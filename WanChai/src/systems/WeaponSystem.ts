import Phaser from 'phaser';
import { WEAPON_DEFS } from '../config/weapons';
import { calculateDamage } from '../core/DamageCalc';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { WeaponDef } from '../types/weapon';
import type { WeaponInstance } from '../types/weapon';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';

export interface WeaponSystemDeps {
  vfx?: VFXManager;
  dmgNumbers?: DamageNumberManager;
  onEnemyDeath?: (enemy: Enemy) => void;
}

export class WeaponSystem {
  private scene: Phaser.Scene;
  private deps: WeaponSystemDeps = {};

  // Cached active enemy list (rebuilt once per update call)
  private cachedEnemies: Enemy[] = [];
  private cachedEnemyCount = 0;

  constructor(scene: Phaser.Scene, deps?: WeaponSystemDeps) {
    this.scene = scene;
    if (deps) this.deps = deps;
  }

  update(
    delta: number,
    player: Player,
    weapons: WeaponInstance[],
    enemies: Phaser.GameObjects.Group,
    projectilePool: Phaser.GameObjects.Group,
    targetPoint?: { x: number; y: number } | null,
  ): void {
    this._targetPoint = targetPoint ?? null;

    // Build active enemy cache ONCE per update (avoids repeated getChildren() + filter)
    this.cachedEnemyCount = 0;
    const children = enemies.getChildren();
    for (let i = 0; i < children.length; i++) {
      const e = children[i] as Enemy;
      if (e.active) {
        this.cachedEnemies[this.cachedEnemyCount++] = e;
      }
    }

    for (const weapon of weapons) {
      weapon.cooldownRemaining -= delta;
      if (weapon.cooldownRemaining > 0) continue;

      const def = WEAPON_DEFS[weapon.defId];
      if (!def) continue;

      const cooldown = def.cooldownMs / player.attackSpeedMultiplier;
      weapon.cooldownRemaining = cooldown;

      const levelMult = 1 + (weapon.level - 1) * 0.2;

      switch (def.projectileType) {
        case 'bullet':
          this.fireBullet(player, def, weapon, projectilePool, levelMult);
          break;
        case 'aoe':
          this.fireAoe(player, def, weapon, levelMult);
          break;
        case 'laser':
          this.fireLaser(player, def, weapon, projectilePool, levelMult);
          break;
        case 'orbit':
          weapon.cooldownRemaining = 0;
          break;
        case 'chain':
          this.fireChain(player, def, weapon, levelMult);
          break;
        case 'homing':
          this.fireHoming(player, def, weapon, projectilePool, levelMult);
          break;
        case 'bomb':
          this.fireBomb(player, def, weapon, levelMult);
          break;
        default:
          break;
      }
    }
  }

  private _targetPoint: { x: number; y: number } | null = null;

  private fireBullet(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    projectilePool: Phaser.GameObjects.Group,
    levelMult: number,
  ): void {
    const nearest = this.findNearest(player, def.range);
    if (!nearest) return;

    const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    const count = def.projectileCount + Math.floor((weapon.level - 1) * 0.5);
    const spread = count > 1 ? 0.3 : 0;

    for (let i = 0; i < count; i++) {
      const proj = projectilePool.get() as Projectile | null;
      if (!proj) break;

      const bulletAngle =
        count > 1 ? angle - spread / 2 + (spread / (count - 1)) * i : angle;

      const vx = Math.cos(bulletAngle) * def.projectileSpeed;
      const vy = Math.sin(bulletAngle) * def.projectileSpeed;

      proj.fire(player.x, player.y, vx, vy, result.damage, def.piercing + Math.floor(weapon.level / 3), def.id, 'projectile_bullet', result.isCrit);
    }
  }

  private fireLaser(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    projectilePool: Phaser.GameObjects.Group,
    levelMult: number,
  ): void {
    const nearest = this.findNearest(player, def.range);
    if (!nearest) return;

    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    const proj = projectilePool.get() as Projectile | null;
    if (!proj) return;

    const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    const speed = 800;
    proj.fire(
      player.x,
      player.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      result.damage,
      def.piercing,
      def.id,
      'projectile_laser',
      result.isCrit,
    );
    proj.lifeMs = 1000;
  }

  private fireAoe(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    levelMult: number,
  ): void {
    const radius = def.aoeRadius + weapon.level * 10;
    const radiusSq = radius * radius;
    const { damage } = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    for (let i = 0; i < this.cachedEnemyCount; i++) {
      const enemy = this.cachedEnemies[i];
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (dx * dx + dy * dy < radiusSq) {
        enemy.takeDamage(damage);
      }
    }
  }

  private fireChain(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    levelMult: number,
  ): void {
    const nearest = this.findNearest(player, def.range);
    if (!nearest) return;

    const chainCount = def.projectileCount + Math.floor((weapon.level - 1) * 0.5);
    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    const hit = new Set<Enemy>();
    let current: Enemy = nearest;
    let prevX = player.x;
    let prevY = player.y;

    for (let i = 0; i < chainCount; i++) {
      if (!current.active) break;
      hit.add(current);

      const dead = current.takeDamage(result.damage);
      this.deps.dmgNumbers?.show(current.x, current.y, result.damage, result.isCrit);
      this.deps.vfx?.lightning(prevX, prevY, current.x, current.y);

      if (dead) {
        this.deps.onEnemyDeath?.(current);
      }

      prevX = current.x;
      prevY = current.y;

      // Find next nearest not yet hit (uses cached list)
      let nextEnemy: Enemy | null = null;
      let nextDistSq = Infinity;
      const chainRange = 150;
      const chainRangeSq = chainRange * chainRange;

      for (let j = 0; j < this.cachedEnemyCount; j++) {
        const e = this.cachedEnemies[j];
        if (!e.active || hit.has(e)) continue;
        const dx = e.x - prevX;
        const dy = e.y - prevY;
        const dSq = dx * dx + dy * dy;
        if (dSq < chainRangeSq && dSq < nextDistSq) {
          nextDistSq = dSq;
          nextEnemy = e;
        }
      }
      if (!nextEnemy) break;
      current = nextEnemy;
    }
  }

  private fireHoming(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    projectilePool: Phaser.GameObjects.Group,
    levelMult: number,
  ): void {
    const nearest = this.findNearest(player, 0);
    if (!nearest) return;

    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    const count = def.projectileCount + Math.floor((weapon.level - 1) * 0.5);
    const homingSpeed = def.projectileSpeed + weapon.level * 40;
    const turnRate = 4 + weapon.level * 0.5;

    for (let i = 0; i < count; i++) {
      const proj = projectilePool.get() as Projectile | null;
      if (!proj) break;
      const spreadAngle = count > 1
        ? -0.3 + (0.6 / (count - 1)) * i
        : 0;
      const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x) + spreadAngle;
      proj.fire(
        player.x,
        player.y,
        Math.cos(angle) * homingSpeed,
        Math.sin(angle) * homingSpeed,
        result.damage,
        0,
        def.id,
        'projectile_bullet',
        result.isCrit,
      );
      proj.lifeMs = 4000;
      proj.homingTarget = nearest;
      proj.homingTurnRate = turnRate;
      proj.homingSpeed = homingSpeed;
    }
  }

  /** Bomb — O(n) single-pass densest-point estimation (replaces O(n²) scan) */
  private fireBomb(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    levelMult: number,
  ): void {
    if (this.cachedEnemyCount === 0) return;

    const scanRadius = def.aoeRadius + weapon.level * 15;
    const scanRadiusSq = scanRadius * scanRadius;

    // O(n) approach: use centroid of all active enemies as bomb target
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      sumX += this.cachedEnemies[i].x;
      sumY += this.cachedEnemies[i].y;
    }
    const bestX = sumX / this.cachedEnemyCount;
    const bestY = sumY / this.cachedEnemyCount;

    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    // Apply AOE damage at centroid
    let hitCount = 0;
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      const enemy = this.cachedEnemies[i];
      const dx = enemy.x - bestX;
      const dy = enemy.y - bestY;
      if (dx * dx + dy * dy < scanRadiusSq) {
        const dead = enemy.takeDamage(result.damage);
        this.deps.dmgNumbers?.show(enemy.x, enemy.y, result.damage, result.isCrit);
        if (dead) {
          this.deps.onEnemyDeath?.(enemy);
        }
        hitCount++;
      }
    }

    if (hitCount > 0) {
      this.deps.vfx?.screenShake(0.006, 150);
      this.deps.vfx?.bombFlash(bestX, bestY, scanRadius);
    }
  }

  /** Find nearest active enemy (uses cached list, no getChildren()) */
  private findNearest(player: Player, range: number): Enemy | null {
    const cx = this._targetPoint?.x ?? player.x;
    const cy = this._targetPoint?.y ?? player.y;
    let nearest: Enemy | null = null;
    let minDistSq = Infinity;
    const rangeSq = range > 0 ? range * range : Infinity;

    for (let i = 0; i < this.cachedEnemyCount; i++) {
      const enemy = this.cachedEnemies[i];
      const dx = enemy.x - cx;
      const dy = enemy.y - cy;
      const distSq = dx * dx + dy * dy;
      if (range > 0) {
        const pdx = enemy.x - player.x;
        const pdy = enemy.y - player.y;
        if (pdx * pdx + pdy * pdy > rangeSq) continue;
      }
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  }
}
