import Phaser from 'phaser';
import { WEAPON_DEFS } from '../config/weapons';
import { BALANCE } from '../config/balance';
import { calculateDamage } from '../core/DamageCalc';
import {
  calculateLevelMultiplier,
  calculateProjectileCount,
  calculateSpreadAngle,
  calculateFanAngles,
  calculatePiercing,
  calculateAoeRadius,
  calculateHomingParams,
  calculateHomingSpreadAngles,
  calculateChainCount,
  calculateTrainPositions,
} from '../core/WeaponFireCalc';
import {
  calculateCentroid,
  checkAoeHits,
  batchTickNapalmZones,
  calculateNapalmFlightTime,
  calculateBarrelOffset,
  calculateZoneRadius,
  type NapalmZoneState,
} from '../core/WeaponZoneCalc';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { WeaponDef, WeaponInstance } from '../types/weapon';
import type { Player } from '../objects/Player';
import { resolveTexture } from '../config/atlas-manifest';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';
import type { SeededRandom } from '../core/SeededRandom';

// NapalmZone type aliased from core module (NapalmZoneState)
type NapalmZone = NapalmZoneState;

export interface WeaponSystemDeps {
  vfx?: VFXManager;
  dmgNumbers?: DamageNumberManager;
  onEnemyDeath?: (enemy: Enemy) => void;
  onWeaponFire?: (barrelX: number, barrelY: number, weaponId?: string) => void;
}

export class WeaponSystem {
  private scene: Phaser.Scene;
  private deps: WeaponSystemDeps = {};

  // Deterministic RNG for combat-relevant randomness (TASK-011 RT)
  private rng: SeededRandom | null = null;

  // Cached active enemy list (rebuilt once per update call)
  private cachedEnemies: Enemy[] = [];
  private cachedEnemyCount = 0;

  // Napalm zones
  private napalmZones: NapalmZone[] = [];

  constructor(scene: Phaser.Scene, deps?: WeaponSystemDeps) {
    this.scene = scene;
    if (deps) this.deps = deps;
  }

  /** Set the deterministic RNG for combat-relevant rolls (crit, spread). */
  setRng(rng: SeededRandom): void {
    this.rng = rng;
  }

  /** Get a combat roll from SeededRandom (deterministic) or Math.random() (fallback). */
  private roll(): number {
    return this.rng ? this.rng.next() : Math.random();
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

      const levelMult = calculateLevelMultiplier(weapon.level);

      switch (def.projectileType) {
        case 'bullet':
          this.fireBullet(player, def, weapon, projectilePool, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'aoe':
          this.fireAoe(player, def, weapon, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'laser':
          this.fireLaser(player, def, weapon, projectilePool, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'napalm':
          this.fireNapalm(player, def, weapon, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'chain':
          this.fireChain(player, def, weapon, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'homing':
          this.fireHoming(player, def, weapon, projectilePool, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
          break;
        case 'bomb':
          this.fireBomb(player, def, weapon, levelMult);
          {
            const b = this.getBarrelPosition(player, def);
            this.deps.onWeaponFire?.(b.x, b.y, def.id);
          }
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
      this.roll(),
    );

    // Per-weapon count formulas
    const count = calculateProjectileCount(def.id, weapon.level, def.projectileCount);

    let texture = 'projectile_bullet';
    if (def.id === 'shuriken') texture = 'projectile_shuriken';
    else if (def.id === 'rapid_fire') texture = 'projectile_rapid';

    const piercing = calculatePiercing(def.piercing, weapon.level);
    const speed = def.projectileSpeed;

    if (def.id === 'energy_shot') {
      // Train formation: bullets in single file along firing direction
      const spacing = 18; // px gap between bullets (no overlap)
      const positions = calculateTrainPositions(player.x, player.y, angle, count, spacing);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      for (let i = 0; i < positions.length; i++) {
        const proj = projectilePool.get() as Projectile | null;
        if (!proj) break;
        proj.fire(positions[i].x, positions[i].y, vx, vy, result.damage, piercing, def.id, texture, result.isCrit);
      }
    } else {
      // Fan spread (shotgun, shuriken, etc.)
      const spread = calculateSpreadAngle(def.id, count);
      const angles = calculateFanAngles(angle, count, spread);

      for (let i = 0; i < angles.length; i++) {
        const proj = projectilePool.get() as Projectile | null;
        if (!proj) break;

        const vx = Math.cos(angles[i]) * speed;
        const vy = Math.sin(angles[i]) * speed;

        proj.fire(player.x, player.y, vx, vy, result.damage, piercing, def.id, texture, result.isCrit);
        if (def.id === 'shuriken') proj.spinRate = 12;
      }
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
      this.roll(),
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

  private fireAoe(player: Player, def: WeaponDef, weapon: WeaponInstance, levelMult: number): void {
    const radius = calculateAoeRadius(def.aoeRadius, weapon.level);
    const radiusSq = radius * radius;
    const { damage } = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      this.roll(),
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

  private fireChain(player: Player, def: WeaponDef, weapon: WeaponInstance, levelMult: number): void {
    const nearest = this.findNearest(player, def.range);
    if (!nearest) return;

    const chainCount = calculateChainCount(def.projectileCount, weapon.level);
    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      this.roll(),
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
      this.roll(),
    );

    const homing = calculateHomingParams(
      weapon.level,
      def.projectileSpeed,
      def.projectileCount,
      BALANCE.COMBAT.homingBaseTurnRate,
      BALANCE.COMBAT.homingTurnRatePerLevel,
    );
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    const spreadAngles = calculateHomingSpreadAngles(baseAngle, homing.count);

    for (let i = 0; i < spreadAngles.length; i++) {
      const proj = projectilePool.get() as Projectile | null;
      if (!proj) break;
      proj.fire(
        player.x,
        player.y,
        Math.cos(spreadAngles[i]) * homing.speed,
        Math.sin(spreadAngles[i]) * homing.speed,
        result.damage,
        0,
        def.id,
        'projectile_missile',
        result.isCrit,
      );
      proj.lifeMs = 8000;
      proj.homingTarget = nearest;
      proj.homingTurnRate = homing.turnRate;
      proj.homingSpeed = homing.speed;
    }
  }

  /** Bomb — O(n) single-pass densest-point estimation (replaces O(n²) scan) */
  private fireBomb(player: Player, def: WeaponDef, weapon: WeaponInstance, levelMult: number): void {
    if (this.cachedEnemyCount === 0) return;

    const scanRadius = calculateZoneRadius(def.aoeRadius, weapon.level);

    // O(n) approach: use centroid of all active enemies as bomb target
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      positions.push({ x: this.cachedEnemies[i].x, y: this.cachedEnemies[i].y });
    }
    const centroid = calculateCentroid(positions);
    const bestX = centroid.x;
    const bestY = centroid.y;

    const result = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      this.roll(),
    );

    // Apply AOE damage at centroid
    const hitIndices = checkAoeHits(positions, bestX, bestY, scanRadius);
    let hitCount = 0;
    for (let h = 0; h < hitIndices.length; h++) {
      const enemy = this.cachedEnemies[hitIndices[h]];
      const dead = enemy.takeDamage(result.damage);
      this.deps.dmgNumbers?.show(enemy.x, enemy.y, result.damage, result.isCrit);
      if (dead) {
        this.deps.onEnemyDeath?.(enemy);
      }
      hitCount++;
    }

    if (hitCount > 0) {
      this.deps.vfx?.screenShake(0.006, 150);
      this.deps.vfx?.bombFlash(bestX, bestY, scanRadius);
    }
  }

  /** Napalm — fire a visible projectile that flies to enemy centroid, then creates fire zone */
  private fireNapalm(player: Player, def: WeaponDef, weapon: WeaponInstance, levelMult: number): void {
    if (this.cachedEnemyCount === 0) return;

    const radius = calculateZoneRadius(def.aoeRadius, weapon.level);

    // Target: centroid of all enemies
    const napalmPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      napalmPositions.push({ x: this.cachedEnemies[i].x, y: this.cachedEnemies[i].y });
    }
    const napalmCentroid = calculateCentroid(napalmPositions);
    const zoneX = napalmCentroid.x;
    const zoneY = napalmCentroid.y;

    const { damage } = calculateDamage(
      def.baseDamage * levelMult,
      player.damageMultiplier,
      player.critChance,
      player.critDamage,
      this.roll(),
    );

    // Visual projectile — flies from player to target then creates zone
    const napalmTex = resolveTexture(this.scene, 'projectile_napalm');
    const bulletTex = resolveTexture(this.scene, 'projectile_bullet');
    const fireballTex = napalmTex ?? bulletTex;
    const fireball = fireballTex
      ? this.scene.add.sprite(player.x, player.y, fireballTex.texture, fireballTex.frame).setDepth(300)
      : this.scene.add.sprite(player.x, player.y, 'projectile_bullet').setDepth(300);
    const flightMs = calculateNapalmFlightTime(player.x, player.y, zoneX, zoneY);

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
          tickMs: BALANCE.COMBAT.napalmZoneTickMs,
          tickTimer: 0,
        });
        this.deps.vfx?.napalmZone(zoneX, zoneY, radius);
      },
    });
  }

  /** Tick all active napalm zones — damage enemies in range each tick (BALANCE.COMBAT.napalmZoneTickMs) */
  private updateNapalmZones(delta: number): void {
    const batchResult = batchTickNapalmZones(this.napalmZones, delta);

    // Apply damage for ticking zones (use original zones before replacement)
    const enemyPositions: { x: number; y: number }[] = [];
    for (let i = 0; i < this.cachedEnemyCount; i++) {
      enemyPositions.push({ x: this.cachedEnemies[i].x, y: this.cachedEnemies[i].y });
    }

    for (let t = 0; t < batchResult.tickingIndices.length; t++) {
      const zone = this.napalmZones[batchResult.tickingIndices[t]];
      const hitIndices = checkAoeHits(enemyPositions, zone.x, zone.y, zone.radius);
      for (let h = 0; h < hitIndices.length; h++) {
        const enemy = this.cachedEnemies[hitIndices[h]];
        const dead = enemy.takeDamage(zone.damage);
        this.deps.dmgNumbers?.show(enemy.x, enemy.y, zone.damage, false);
        if (dead) {
          this.deps.onEnemyDeath?.(enemy);
        }
      }
    }

    // Replace zones with updated active list
    this.napalmZones = batchResult.activeZones;
  }

  /** Calculate barrel position for muzzle flash */
  private getBarrelPosition(player: Player, def: WeaponDef): { x: number; y: number } {
    const barrelDist = 30;
    const nearest = this.findNearest(player, def.range);
    if (!nearest && def.projectileType !== 'aoe' && def.projectileType !== 'bomb' && def.projectileType !== 'napalm') {
      // No target and not an area weapon — default straight up
      return { x: player.x, y: player.y - barrelDist };
    }
    const angle = nearest ? Math.atan2(nearest.y - player.y, nearest.x - player.x) : 0;
    const offset = calculateBarrelOffset(def.projectileType, barrelDist, angle);
    return { x: player.x + offset.x, y: player.y + offset.y };
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
