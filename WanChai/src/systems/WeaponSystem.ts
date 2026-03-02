import Phaser from 'phaser';
import { WEAPON_DEFS } from '../config/weapons';
import { BALANCE } from '../config/balance';
import { calculateDamage } from '../core/DamageCalc';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { WeaponDef } from '../types/weapon';
import type { WeaponInstance } from '../types/weapon';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';

interface NapalmZone {
  x: number;
  y: number;
  radius: number;
  damage: number;
  remainingMs: number;
  tickMs: number;
  tickTimer: number;
}

export interface WeaponSystemDeps {
  vfx?: VFXManager;
  dmgNumbers?: DamageNumberManager;
  onEnemyDeath?: (enemy: Enemy) => void;
  onWeaponFire?: () => void;
}

export class WeaponSystem {
  private scene: Phaser.Scene;
  private deps: WeaponSystemDeps = {};

  // Cached active enemy list (rebuilt once per update call)
  private cachedEnemies: Enemy[] = [];
  private cachedEnemyCount = 0;

  // Napalm zones
  private napalmZones: NapalmZone[] = [];

  constructor(scene: Phaser.Scene, deps?: WeaponSystemDeps) {
    this.scene = scene;
    if (deps) this.deps = deps;
  }

  /** Release references to prevent memory leaks on scene restart. */
  clearCache(): void {
    this.cachedEnemies.length = 0;
    this.cachedEnemyCount = 0;
    this.napalmZones.length = 0;
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
          this.deps.onWeaponFire?.();
          break;
        case 'aoe':
          this.fireAoe(player, def, weapon, levelMult);
          this.deps.onWeaponFire?.();
          break;
        case 'laser':
          this.fireLaser(player, def, weapon, projectilePool, levelMult);
          this.deps.onWeaponFire?.();
          break;
        case 'napalm':
          this.fireNapalm(player, def, weapon, levelMult);
          this.deps.onWeaponFire?.();
          break;
        case 'chain':
          this.fireChain(player, def, weapon, levelMult);
          this.deps.onWeaponFire?.();
          break;
        case 'homing':
          this.fireHoming(player, def, weapon, projectilePool, levelMult);
          this.deps.onWeaponFire?.();
          break;
        case 'bomb':
          this.fireBomb(player, def, weapon, levelMult);
          this.deps.onWeaponFire?.();
          break;
        default:
          break;
      }
    }

    this.updateNapalmZones(delta);
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
    const spread = count > 1 ? 0.15 : 0;

    for (let i = 0; i < count; i++) {
      const proj = projectilePool.get() as Projectile | null;
      if (!proj) break;

      const bulletAngle =
        count > 1 ? angle - spread / 2 + (spread / (count - 1)) * i : angle;

      const vx = Math.cos(bulletAngle) * def.projectileSpeed;
      const vy = Math.sin(bulletAngle) * def.projectileSpeed;

      let texture = 'projectile_bullet';
      if (def.id === 'shuriken') texture = 'projectile_shuriken';
      else if (def.id === 'rapid_fire') texture = 'projectile_rapid';
      else if (def.id === 'shotgun') texture = 'projectile_bullet';
      proj.fire(player.x, player.y, vx, vy, result.damage, def.piercing + Math.floor(weapon.level / 3), def.id, texture, result.isCrit);
      if (def.id === 'shuriken') proj.spinRate = 12;
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
    const turnRate = BALANCE.COMBAT.homingBaseTurnRate + weapon.level * BALANCE.COMBAT.homingTurnRatePerLevel;

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
        'projectile_missile',
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

  /** Napalm — fire a visible projectile that flies to enemy centroid, then creates fire zone */
  private fireNapalm(
    player: Player,
    def: WeaponDef,
    weapon: WeaponInstance,
    levelMult: number,
  ): void {
    if (this.cachedEnemyCount === 0) return;

    const radius = def.aoeRadius + weapon.level * 15;

    // Target: centroid of all enemies
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      sumX += this.cachedEnemies[i].x;
      sumY += this.cachedEnemies[i].y;
    }
    const zoneX = sumX / this.cachedEnemyCount;
    const zoneY = sumY / this.cachedEnemyCount;

    const { damage } = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      Math.random(),
    );

    // Visual projectile — flies from player to target then creates zone
    const texKey = this.scene.textures.exists('projectile_napalm') ? 'projectile_napalm' : 'projectile_bullet';
    const fireball = this.scene.add.sprite(player.x, player.y, texKey).setDepth(300);
    const dist = Math.sqrt((zoneX - player.x) ** 2 + (zoneY - player.y) ** 2);
    const flightMs = Math.max(200, Math.min(500, dist * 0.5));

    this.scene.tweens.add({
      targets: fireball,
      x: zoneX,
      y: zoneY,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: flightMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        fireball.destroy();
        this.napalmZones.push({
          x: zoneX,
          y: zoneY,
          radius,
          damage,
          remainingMs: 4000,
          tickMs: 500,
          tickTimer: 0,
        });
        this.deps.vfx?.napalmZone(zoneX, zoneY, radius);
      },
    });
  }

  /** Tick all active napalm zones — damage enemies in range each 500ms */
  private updateNapalmZones(delta: number): void {
    for (let z = this.napalmZones.length - 1; z >= 0; z--) {
      const zone = this.napalmZones[z];
      zone.remainingMs -= delta;
      if (zone.remainingMs <= 0) {
        this.napalmZones[z] = this.napalmZones[this.napalmZones.length - 1];
        this.napalmZones.pop();
        continue;
      }

      zone.tickTimer -= delta;
      if (zone.tickTimer <= 0) {
        zone.tickTimer = zone.tickMs;
        const radiusSq = zone.radius * zone.radius;

        for (let i = 0; i < this.cachedEnemyCount; i++) {
          const enemy = this.cachedEnemies[i];
          const dx = enemy.x - zone.x;
          const dy = enemy.y - zone.y;
          if (dx * dx + dy * dy < radiusSq) {
            const dead = enemy.takeDamage(zone.damage);
            this.deps.dmgNumbers?.show(enemy.x, enemy.y, zone.damage, false);
            if (dead) {
              this.deps.onEnemyDeath?.(enemy);
            }
          }
        }
      }
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
