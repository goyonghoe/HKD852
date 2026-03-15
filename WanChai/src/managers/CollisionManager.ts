import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { NEON } from '../config/colors';
import { GAME_HEIGHT } from '../config/game-config';
import {
  checkCircleCollision,
  calculateProjectileDamage,
  shouldProjectileDespawn,
  calculateEnemyBaseDamage,
} from '../core/CollisionCalc';
import { getElementMultiplier } from '../core/DamageCalc';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import type { SpatialHash } from '../core/SpatialHash';
import type { Projectile } from '../objects/Projectile';
import type { Enemy } from '../objects/Enemy';
import type { Player } from '../objects/Player';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { RunState } from '../types/game';
import { resolveTexture } from '../config/atlas-manifest';

// Max query radius for SpatialHash: largest enemy hitRadius (boss ~72) + projectile buffer (24)
const MAX_COLLISION_QUERY_RADIUS = 96;
// Projectile half-size buffer added to per-enemy hitRadius
const PROJECTILE_RADIUS = 12;
// Pre-allocated buffer for spatial hash queries
const QUERY_BUFFER = new Array<number>(128);

export interface CollisionCallbacks {
  onEnemyDeath: (enemy: Enemy) => void;
  onBaseDamage: (damage: number, x: number) => void;
  playSfx: (key: string, fn: () => void, cooldownMs: number) => void;
  /** Called after a projectile hits an enemy (before death check). Used for passive on-hit effects. */
  onProjectileHit?: (proj: Projectile, enemy: Enemy, finalDamage: number) => void;
}

/**
 * Handles projectile-enemy collision (SpatialHash-based) and enemy projectile updates.
 */
export class CollisionManager {
  private callbacks: CollisionCallbacks;

  // Enemy projectiles (non-physics, manual movement)
  enemyProjectiles: {
    x: number;
    y: number;
    vx: number; // horizontal velocity (negative = toward barrier/left)
    vy: number;
    damage: number;
    sprite: Phaser.GameObjects.GameObject & { setPosition(x: number, y: number): void; destroy(): void };
  }[] = [];

  constructor(callbacks: CollisionCallbacks) {
    this.callbacks = callbacks;
  }

  /** Resolve player projectile → enemy collisions via spatial hash. */
  resolveProjectileCollisions(
    projectileGroup: Phaser.Physics.Arcade.Group,
    activeEnemies: Enemy[],
    _activeEnemyCount: number,
    collisionHash: SpatialHash,
    player: Player,
    vfx: VFXManager,
    dmgNumbers: DamageNumberManager,
    enemyArmorMult = 1,
  ): void {
    const projChildren = projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (!proj.active) continue;

      const count = collisionHash.queryRadiusInto(proj.x, proj.y, MAX_COLLISION_QUERY_RADIUS, QUERY_BUFFER);

      for (let j = 0; j < count; j++) {
        const enemyIdx = QUERY_BUFFER[j];
        const enemy = activeEnemies[enemyIdx];
        if (!enemy || !enemy.active) continue;

        const hitDist = enemy.hitRadius + PROJECTILE_RADIUS;
        if (checkCircleCollision(proj.x, proj.y, enemy.x, enemy.y, hitDist)) {
          this.onProjectileHitEnemy(proj, enemy, player, vfx, dmgNumbers, enemyArmorMult);
          if (!proj.active) break;
        }
      }
    }
  }

  private onProjectileHitEnemy(
    proj: Projectile,
    enemy: Enemy,
    player: Player,
    vfx: VFXManager,
    dmgNumbers: DamageNumberManager,
    enemyArmorMult = 1,
  ): void {
    if (!proj.active || !enemy.active) return;

    const elemResult = getElementMultiplier(
      player.elementName,
      enemy.element,
      BALANCE.ELEMENT.advantages,
      BALANCE.ELEMENT.advantageMultiplier,
      BALANCE.ELEMENT.disadvantageMultiplier,
      BALANCE.ELEMENT.darkMultiplier,
    );
    const finalDamage = calculateProjectileDamage(proj.damage, elemResult.multiplier, enemyArmorMult);

    const dead = enemy.takeDamage(finalDamage);
    if (elemResult.effectiveness === 'effective') {
      vfx.hitSpark(enemy.x, enemy.y, player.elementColor);
      vfx.hitSpark(enemy.x, enemy.y, player.elementColor);
    } else {
      vfx.hitSpark(enemy.x, enemy.y);
    }
    dmgNumbers.show(enemy.x, enemy.y, finalDamage, proj.isCrit, elemResult.effectiveness);
    this.callbacks.playSfx('hit', () => getRetroSFX().enemyHit(), 150);
    getAudioManager().playSFX('sfx_hit');
    if (!dead) {
      enemy.applyKnockback(proj.x, proj.y);
    }

    // On-hit passive effects (burn, frost, gust, refraction, ignite, torrent)
    this.callbacks.onProjectileHit?.(proj, enemy, finalDamage);

    proj.hitCount++;
    if (shouldProjectileDespawn(proj.hitCount, proj.piercing)) {
      proj.deactivate();
    }

    if (dead) {
      this.callbacks.onEnemyDeath(enemy);
    }
  }

  /** Update enemy projectiles: move down, check base collision, remove offscreen. */
  updateEnemyProjectiles(
    delta: number,
    _runState: RunState,
    baseArmorMultiplier: number,
    _vfx: VFXManager,
    dmgNumbers: DamageNumberManager,
  ): void {
    const dt = delta / 1000;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.x += (p.vx ?? 0) * dt;
      p.y += p.vy * dt;
      p.sprite.setPosition(p.x, p.y);

      // Street Defense: projectile hits barrier when x <= barrier X
      if (p.x <= BALANCE.BARRIER.x) {
        const actualDamage = calculateEnemyBaseDamage(p.damage, baseArmorMultiplier);
        dmgNumbers.show(p.x, BALANCE.BARRIER.y - 20, actualDamage, false);
        this.callbacks.playSfx('baseHit', () => getRetroSFX().baseHit(), 500);
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);
        this.callbacks.onBaseDamage(actualDamage, p.x);
        continue;
      }

      // Also remove offscreen projectiles (left, right, top, bottom)
      if (p.x < -50 || p.x > GAME_HEIGHT + 800 || p.y < -50 || p.y > GAME_HEIGHT + 50) {
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  /** Spawn an enemy projectile aimed at base wall. */
  spawnEnemyProjectile(scene: Phaser.Scene, enemy: Enemy): void {
    const isBoss = enemy.behavior.startsWith('boss_');
    const largeTex = resolveTexture(scene, 'projectile_enemy_large');
    const normalTex = resolveTexture(scene, 'projectile_enemy');
    const resolvedTex = isBoss && largeTex ? largeTex : normalTex;
    let sprite: Phaser.GameObjects.GameObject & { setPosition(x: number, y: number): void; destroy(): void };
    if (resolvedTex) {
      const img = scene.add.image(enemy.x, enemy.y, resolvedTex.texture, resolvedTex.frame).setDepth(50);
      const targetSize = isBoss ? 24 : 16;
      const frame = img.texture.get(resolvedTex.frame ?? '__BASE');
      const srcW = frame.width > 0 ? frame.width : img.texture.getSourceImage().width;
      if (srcW > 0) img.setScale(targetSize / srcW);
      sprite = img;
    } else {
      sprite = scene.add.circle(enemy.x, enemy.y, 6, NEON.HEALTH).setDepth(50);
    }
    // Street Defense: enemy projectiles move left toward barrier
    this.enemyProjectiles.push({
      x: enemy.x,
      y: enemy.y,
      vx: -enemy.projectileSpeed, // move left
      vy: 0,
      damage: enemy.damage,
      sprite,
    });
    this.callbacks.playSfx('enemyShoot', () => getRetroSFX().deploy(), 300);
  }

  /** Clean up all enemy projectiles. */
  clearEnemyProjectiles(): void {
    for (const p of this.enemyProjectiles) p.sprite.destroy();
    this.enemyProjectiles = [];
  }
}
