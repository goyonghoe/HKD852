import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { distance as allyDistance, filterTargetsInRange, type Position as AllyPosition } from '../core/AllyTargeting';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';

export interface AllyCallbacks {
  /** Return the active enemy array and count for targeting. */
  getActiveEnemies: () => Enemy[];
  getActiveEnemyCount: () => number;
  /** Get the projectile group to fire ally projectiles into. */
  getProjectileGroup: () => Phaser.Physics.Arcade.Group;
}

/**
 * Manages ally turret lifecycle: creation, auto-fire, and targeting.
 * Extracted from RunScene Phase 5b (TASK-069).
 */
export class AllyManager {
  private scene: Phaser.Scene;
  private callbacks: AllyCallbacks;

  // Ally sprites
  private allyLeftSprite!: Phaser.GameObjects.Sprite;
  private allyRightSprite!: Phaser.GameObjects.Sprite;

  // Cooldown timers (ms)
  private allySniperCooldown = 0;
  private allySpreadCooldown = 0;

  constructor(scene: Phaser.Scene, callbacks: AllyCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  /** Create ally sprites. Call during RunScene.create(). */
  create(): void {
    this.allySniperCooldown = 0;
    this.allySpreadCooldown = 0;

    this.allyLeftSprite = this.scene.add.sprite(BALANCE.ALLY.leftX, BALANCE.ALLY.baseY, 'ally_sniper').setDepth(50);

    this.allyRightSprite = this.scene.add.sprite(BALANCE.ALLY.rightX, BALANCE.ALLY.baseY, 'ally_spread').setDepth(50);
  }

  /** Update ally auto-fire. Call during RunScene.update() Phase 5b. */
  update(delta: number): void {
    const activeEnemies = this.callbacks.getActiveEnemies();
    const activeEnemyCount = this.callbacks.getActiveEnemyCount();

    // Sniper ally (left): single target, high damage
    this.allySniperCooldown -= delta;
    if (this.allySniperCooldown <= 0 && activeEnemyCount > 0) {
      const target = this.findNearestEnemyFrom(
        this.allyLeftSprite.x,
        this.allyLeftSprite.y,
        BALANCE.ALLY.sniperRange,
        activeEnemies,
        activeEnemyCount,
      );
      if (target) {
        this.fireAllyProjectile(
          this.allyLeftSprite.x,
          this.allyLeftSprite.y,
          target.x,
          target.y,
          BALANCE.ALLY.sniperDamage,
          'projectile_laser',
        );
        this.allySniperCooldown = BALANCE.ALLY.sniperCooldownMs;
      }
    }

    // Spread ally (right): multi-target, low damage
    this.allySpreadCooldown -= delta;
    if (this.allySpreadCooldown <= 0 && activeEnemyCount > 0) {
      const targets = this.findNearestEnemiesFrom(
        this.allyRightSprite.x,
        this.allyRightSprite.y,
        BALANCE.ALLY.spreadRange,
        BALANCE.ALLY.spreadCount,
        activeEnemies,
        activeEnemyCount,
      );
      if (targets.length > 0) {
        for (const t of targets) {
          this.fireAllyProjectile(
            this.allyRightSprite.x,
            this.allyRightSprite.y,
            t.x,
            t.y,
            BALANCE.ALLY.spreadDamage,
            'projectile_bullet',
          );
        }
        this.allySpreadCooldown = BALANCE.ALLY.spreadCooldownMs;
      }
    }
  }

  // === Targeting helpers ===

  private findNearestEnemyFrom(
    fx: number,
    fy: number,
    range: number,
    activeEnemies: Enemy[],
    activeEnemyCount: number,
  ): { x: number; y: number } | null {
    const positions: AllyPosition[] = [];
    for (let i = 0; i < activeEnemyCount; i++) {
      positions.push({ x: activeEnemies[i].x, y: activeEnemies[i].y });
    }
    const inRange = filterTargetsInRange(fx, fy, range, positions);
    if (inRange.length === 0) return null;
    return { x: inRange[0].x, y: inRange[0].y };
  }

  private findNearestEnemiesFrom(
    fx: number,
    fy: number,
    range: number,
    maxCount: number,
    activeEnemies: Enemy[],
    activeEnemyCount: number,
  ): { x: number; y: number }[] {
    const positions: AllyPosition[] = [];
    for (let i = 0; i < activeEnemyCount; i++) {
      positions.push({ x: activeEnemies[i].x, y: activeEnemies[i].y });
    }
    const inRange = filterTargetsInRange(fx, fy, range, positions);
    return inRange.slice(0, maxCount).map((t) => ({ x: t.x, y: t.y }));
  }

  // === Projectile creation ===

  private fireAllyProjectile(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    damage: number,
    texture: string,
  ): void {
    const projGroup = this.callbacks.getProjectileGroup();
    const proj = projGroup.get() as Projectile | null;
    if (!proj) return;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = allyDistance(fromX, fromY, toX, toY);
    if (dist === 0) return;
    const speed = BALANCE.ALLY.projectileSpeed;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    proj.fire(fromX, fromY, vx, vy, damage, 0, 'ally', texture);
  }
}
