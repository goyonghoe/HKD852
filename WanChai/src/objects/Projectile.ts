import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { PROJECTILE_ROTATION_OFFSET } from '../config/weapons';
import { BALANCE } from '../config/balance';
import { computeHomingVelocity, isOutOfBounds, isExpired } from '../utils/ProjectileCalc';
import { resolveTexture } from '../config/atlas-manifest';
import { calculateWindDeflection, applyWindDeflectionToVelocity, getWindDeflectConfig } from '../core/BossAeroCalc';
import type { Enemy } from './Enemy';

/** Subset of RunScene that Projectile needs for homing retarget and boss tracking. */
interface SceneWithEnemyGroup extends Phaser.Scene {
  enemyGroup: Phaser.Physics.Arcade.Group;
  activeBoss: Enemy | null;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage = 0;
  public piercing = 0;
  public hitCount = 0;
  public weaponId = '';
  public lifeMs = 0;
  public isCrit = false;
  public spinRate = 0; // radians/s, 0 = no spin (used by shuriken)
  private spawnTime = 0;

  // Homing properties
  public homingTarget: Phaser.GameObjects.GameObject | null = null;
  public homingTurnRate = 0; // radians per second
  public homingSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_bullet');
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    piercing: number,
    weaponId: string,
    texture = 'projectile_bullet',
    isCrit = false,
  ): void {
    const resolved = resolveTexture(this.scene, texture);
    if (resolved) {
      this.setTexture(resolved.texture, resolved.frame);
    }
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    // Scale up projectiles for better visibility against dark backgrounds (C5)
    this.setScale(2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    this.setVelocity(vx, vy);

    // Rotate to face direction (sprites face RIGHT = Phaser standard)
    this.setRotation(Math.atan2(vy, vx) + (PROJECTILE_ROTATION_OFFSET[texture] ?? 0));

    this.damage = damage;
    this.piercing = piercing;
    this.hitCount = 0;
    this.weaponId = weaponId;
    this.isCrit = isCrit;
    this.spawnTime = this.scene.time.now;
    this.lifeMs = 5000;
    this.homingTarget = null;
    this.homingTurnRate = 0;
    this.homingSpeed = 0;
    this.spinRate = 0;
  }

  /** Find nearest active enemy for homing retarget */
  private findNearestEnemy(): Phaser.GameObjects.GameObject | null {
    // RunScene.enemyGroup is public — access via interface
    const eg = (this.scene as SceneWithEnemyGroup).enemyGroup;
    if (!eg) return null;

    const children = eg.getChildren();
    let nearest: Phaser.GameObjects.GameObject | null = null;
    let nearestDist = Infinity;
    for (let i = 0; i < children.length; i++) {
      const e = children[i];
      if (!e.active) continue;
      const sprite = e as Phaser.GameObjects.Sprite;
      const dx = sprite.x - this.x;
      const dy = sprite.y - this.y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.setVelocity(0, 0);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Expired
    if (isExpired(time, this.spawnTime, this.lifeMs)) {
      this.deactivate();
      return;
    }

    // Spin rotation (shuriken)
    if (this.spinRate !== 0) {
      this.rotation += this.spinRate * (delta / 1000);
    }

    // Homing: steer toward target (retarget if current target dies)
    if (this.homingTurnRate > 0) {
      if (!this.homingTarget || !this.homingTarget.active) {
        // Retarget: find nearest active enemy
        this.homingTarget = this.findNearestEnemy();
      }
      if (!this.homingTarget || !this.homingTarget.active) {
        // No valid target — keep flying straight, skip homing
      } else {
        const target = this.homingTarget as Phaser.GameObjects.Sprite;
        const body = this.body as Phaser.Physics.Arcade.Body;

        const result = computeHomingVelocity(
          this.x,
          this.y,
          body.velocity.x,
          body.velocity.y,
          target.x,
          target.y,
          this.homingTurnRate,
          this.homingSpeed,
          delta,
        );

        body.setVelocity(result.vx, result.vy);
        this.setRotation(result.angle + (PROJECTILE_ROTATION_OFFSET[this.texture.key] ?? 0));
      } // end if valid target
    }

    // Boss Aero wind deflection (TASK-048)
    const runScene = this.scene as SceneWithEnemyGroup;
    const boss = runScene.activeBoss;
    if (boss && boss.active && boss.behavior === 'boss_burst') {
      const windConfig = getWindDeflectConfig(
        boss.bossPhaseState.phase,
        BALANCE.BOSS_AERO.windDeflectAngle,
        BALANCE.BOSS_AERO.windDeflectRadius,
        BALANCE.BOSS_AERO.windDeflectAngleP3,
        BALANCE.BOSS_AERO.windDeflectRadiusP3,
      );
      const angleOffset = calculateWindDeflection(this.x, this.y, boss.x, boss.y, windConfig, this.piercing);
      if (angleOffset !== 0) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const deflected = applyWindDeflectionToVelocity(body.velocity.x, body.velocity.y, angleOffset);
        body.setVelocity(deflected.vx, deflected.vy);
        // Update rotation to match new direction
        this.setRotation(Math.atan2(deflected.vy, deflected.vx) + (PROJECTILE_ROTATION_OFFSET[this.texture.key] ?? 0));
      }
    }

    // Out of world bounds
    if (isOutOfBounds(this.x, this.y, GAME_WIDTH, GAME_HEIGHT, BALANCE.PROJECTILE.oobMargin)) {
      this.deactivate();
    }
  }
}
