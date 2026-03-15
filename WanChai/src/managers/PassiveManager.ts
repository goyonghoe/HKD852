import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ELEMENT } from '../config/colors';
import { PASSIVE_DEFS } from '../config/upgrades';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';
import type { Player } from '../objects/Player';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { PhaseManager } from './PhaseManager';

export interface PassiveCallbacks {
  onEnemyDeath: (enemy: Enemy) => void;
  getPhaseManager: () => PhaseManager;
}

export class PassiveManager {
  private scene: Phaser.Scene;
  private callbacks: PassiveCallbacks;

  // torrent: consecutive hit combo counter
  private torrentHitCount = 0;
  private torrentBuffActive = false;
  private torrentBuffTimer = 0;
  // lightspeed: kill → speed boost
  private lightspeedBuffActive = false;
  private lightspeedBuffTimer = 0;
  // fortify: no-damage timer → armor buff
  private fortifyNoDamageTimer = 0;
  private fortifyBuffActive = false;
  // dash_trail: damage trail timer
  private dashTrailTickTimer = 0;
  // hit-stop state
  private hitStopActive = false;

  constructor(scene: Phaser.Scene, callbacks: PassiveCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  /** Reset all passive state (called in create) */
  reset(): void {
    this.torrentHitCount = 0;
    this.torrentBuffActive = false;
    this.torrentBuffTimer = 0;
    this.lightspeedBuffActive = false;
    this.lightspeedBuffTimer = 0;
    this.fortifyNoDamageTimer = 0;
    this.fortifyBuffActive = false;
    this.dashTrailTickTimer = 0;
    this.hitStopActive = false;
  }

  /** Apply passive effects when a projectile hits an enemy */
  onProjectileHit(
    proj: Projectile,
    enemy: Enemy,
    finalDamage: number,
    passiveCounts: Map<string, number>,
    activeEnemies: Enemy[],
    activeEnemyCount: number,
    player: Player,
    vfx: VFXManager,
    dmgNumbers: DamageNumberManager,
  ): void {
    if (!enemy.active) return;
    const P = BALANCE.PASSIVE;

    // Burn: chance to apply DoT
    const burnLevel = passiveCounts.get('burn') ?? 0;
    if (burnLevel > 0) {
      const chance = P.burnChancePerLevel * burnLevel;
      if (Math.random() < chance) {
        enemy.burnDamage = Math.ceil(finalDamage * P.burnDamagePct);
        enemy.burnRemainingMs = P.burnDurationMs;
        enemy.burnTickTimer = P.burnTickIntervalMs;
      }
    }

    // Frost Shot: chance to slow
    const frostLevel = passiveCounts.get('frost_shot') ?? 0;
    if (frostLevel > 0) {
      const chance = P.frostChancePerLevel * frostLevel;
      if (Math.random() < chance) {
        enemy.frostSlowMult = P.frostSlowMult;
        enemy.frostRemainingMs = P.frostDurationMs;
        enemy.setTint(ELEMENT.WATER);
      }
    }

    // Gust: extra knockback
    const gustLevel = passiveCounts.get('gust') ?? 0;
    if (gustLevel > 0 && !enemy.knockbackImmune) {
      const bonusPct = P.gustKnockbackBonusPct * gustLevel;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const angle = Math.atan2(enemy.y - proj.y, enemy.x - proj.x);
      const extraForce = BALANCE.COMBAT.knockbackForce * bonusPct;
      body.setVelocity(body.velocity.x + Math.cos(angle) * extraForce, body.velocity.y + Math.sin(angle) * extraForce);
    }

    // Torrent: combo counter → attack speed buff
    const torrentLevel = passiveCounts.get('torrent') ?? 0;
    if (torrentLevel > 0) {
      this.torrentHitCount++;
      if (this.torrentHitCount >= P.torrentComboThreshold) {
        this.torrentHitCount = 0;
        this.torrentBuffActive = true;
        this.torrentBuffTimer = P.torrentDurationMs;
        const baseAtkSpd =
          1 + (PASSIVE_DEFS['attack_speed']?.valuePerLevel ?? 0) * (passiveCounts.get('attack_speed') ?? 0);
        player.attackSpeedMultiplier = baseAtkSpd * (1 + P.torrentAtkSpdBonus * torrentLevel);
      }
    }

    // Refraction: chance to bounce damage to nearest enemy
    const refractionLevel = passiveCounts.get('refraction') ?? 0;
    if (refractionLevel > 0 && enemy.active) {
      const chance = P.refractionChancePerLevel * refractionLevel;
      if (Math.random() < chance) {
        let nearest: Enemy | null = null;
        let nearestDistSq = P.refractionRange * P.refractionRange;
        for (let i = 0; i < activeEnemyCount; i++) {
          const e = activeEnemies[i];
          if (!e.active || e === enemy) continue;
          const dx = e.x - enemy.x;
          const dy = e.y - enemy.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < nearestDistSq) {
            nearestDistSq = dSq;
            nearest = e;
          }
        }
        if (nearest) {
          const bounceDmg = Math.ceil(finalDamage * P.refractionDamageMult);
          const dead = nearest.takeDamage(bounceDmg);
          dmgNumbers.show(nearest.x, nearest.y, bounceDmg, false);
          vfx.hitSpark(nearest.x, nearest.y, player.elementColor);
          if (dead) this.callbacks.onEnemyDeath(nearest);
        }
      }
    }

    // Ignite: bonus damage on low HP enemies
    const igniteLevel = passiveCounts.get('ignite') ?? 0;
    if (igniteLevel > 0 && enemy.active && enemy.hp > 0) {
      const hpPct = enemy.hp / enemy.maxHp;
      if (hpPct < P.igniteHpThreshold) {
        const bonusDmg = Math.ceil(finalDamage * P.igniteBonusDmgPct * igniteLevel);
        const dead = enemy.takeDamage(bonusDmg);
        dmgNumbers.show(enemy.x, enemy.y - 10, bonusDmg, false);
        if (dead) this.callbacks.onEnemyDeath(enemy);
      }
    }

    // Boss hit-stop
    if (enemy.defId.startsWith('boss')) {
      this.applyHitStop(BALANCE.JUICE.hitStopMs);
    }
  }

  /** Update buff timers + burn DOT + dash_trail AOE */
  updateTimers(
    delta: number,
    passiveCounts: Map<string, number>,
    activeEnemies: Enemy[],
    activeEnemyCount: number,
    player: Player,
    vfx: VFXManager,
    dmgNumbers: DamageNumberManager,
    baseArmorMultiplier: number,
    shopArmorMultiplier: number,
  ): { newBaseArmorMultiplier?: number } {
    const P = BALANCE.PASSIVE;
    const armorChanged: { newBaseArmorMultiplier?: number } = {};

    // Burn DOT ticks
    for (let i = 0; i < activeEnemyCount; i++) {
      const enemy = activeEnemies[i];
      if (!enemy.active || enemy.burnRemainingMs <= 0) continue;
      enemy.burnRemainingMs -= delta;
      enemy.burnTickTimer -= delta;
      if (enemy.burnTickTimer <= 0) {
        enemy.burnTickTimer = P.burnTickIntervalMs;
        const dead = enemy.takeDamage(enemy.burnDamage);
        dmgNumbers.show(enemy.x, enemy.y - 10, enemy.burnDamage, false);
        if (dead) {
          this.callbacks.onEnemyDeath(enemy);
          if (this.callbacks.getPhaseManager().current !== 'playing') return armorChanged;
        }
      }
      if (enemy.burnRemainingMs <= 0) enemy.burnDamage = 0;
    }

    // Torrent buff decay
    if (this.torrentBuffActive) {
      this.torrentBuffTimer -= delta;
      if (this.torrentBuffTimer <= 0) {
        this.torrentBuffActive = false;
        const atkLevel = passiveCounts.get('attack_speed') ?? 0;
        player.attackSpeedMultiplier = 1 + (PASSIVE_DEFS['attack_speed']?.valuePerLevel ?? 0) * atkLevel;
      }
    }

    // Lightspeed buff decay
    if (this.lightspeedBuffActive) {
      this.lightspeedBuffTimer -= delta;
      if (this.lightspeedBuffTimer <= 0) {
        this.lightspeedBuffActive = false;
        const atkLevel = passiveCounts.get('attack_speed') ?? 0;
        player.attackSpeedMultiplier = 1 + (PASSIVE_DEFS['attack_speed']?.valuePerLevel ?? 0) * atkLevel;
      }
    }

    // Fortify: no-damage timer → armor buff
    const fortifyLevel = passiveCounts.get('fortify') ?? 0;
    if (fortifyLevel > 0) {
      this.fortifyNoDamageTimer += delta;
      if (!this.fortifyBuffActive && this.fortifyNoDamageTimer >= P.fortifyNoHitMs) {
        this.fortifyBuffActive = true;
        const passiveArmorLevel = passiveCounts.get('base_armor') ?? 0;
        const passiveArmor = Math.max(0.1, 1 - (PASSIVE_DEFS['base_armor']?.valuePerLevel ?? 0) * passiveArmorLevel);
        const fortifyBonus = Math.max(0.1, 1 - P.fortifyArmorBonusPct * fortifyLevel);
        armorChanged.newBaseArmorMultiplier = passiveArmor * shopArmorMultiplier * fortifyBonus;
      }
    }

    // dash_trail: periodic AOE damage around player (no speed threshold — player is stationary)
    const dashTrailLevel = passiveCounts.get('dash_trail') ?? 0;
    if (dashTrailLevel > 0) {
      this.dashTrailTickTimer += delta;
      if (this.dashTrailTickTimer >= P.dashTrailTickIntervalMs) {
        this.dashTrailTickTimer = 0;
        const trailDmg = P.dashTrailDamagePerLevel * dashTrailLevel;
        const rSq = P.dashTrailRadius * P.dashTrailRadius;
        for (let i = 0; i < activeEnemyCount; i++) {
          const enemy = activeEnemies[i];
          if (!enemy.active) continue;
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          if (dx * dx + dy * dy <= rSq) {
            const dead = enemy.takeDamage(trailDmg);
            vfx.hitSpark(enemy.x, enemy.y, player.elementColor);
            if (dead) {
              this.callbacks.onEnemyDeath(enemy);
              if (this.callbacks.getPhaseManager().current !== 'playing') return armorChanged;
            }
          }
        }
      }
    }

    return armorChanged;
  }

  /** Apply hit-stop effect (brief physics freeze for impact feel) */
  applyHitStop(durationMs: number): void {
    if (this.hitStopActive) return;
    this.hitStopActive = true;
    this.scene.physics.world.timeScale = BALANCE.JUICE.hitStopTimeScale;
    this.scene.time.delayedCall(durationMs, () => {
      this.scene.physics.world.timeScale = 1;
      this.hitStopActive = false;
    });
  }

  /** Record that base was damaged (resets fortify timer) */
  onBaseDamaged(passiveCounts: Map<string, number>, shopArmorMultiplier: number): number | null {
    if ((passiveCounts.get('fortify') ?? 0) <= 0) return null;
    this.fortifyNoDamageTimer = 0;
    if (this.fortifyBuffActive) {
      this.fortifyBuffActive = false;
      // Recalculate armor without fortify bonus
      const passiveArmorLevel = passiveCounts.get('base_armor') ?? 0;
      const passiveArmor = Math.max(0.1, 1 - (PASSIVE_DEFS['base_armor']?.valuePerLevel ?? 0) * passiveArmorLevel);
      return passiveArmor * shopArmorMultiplier;
    }
    return null;
  }

  /** Apply lightspeed buff on kill */
  applyLightspeedOnKill(durationMs: number, newAtkSpeedMult: number, player: Player): void {
    this.lightspeedBuffActive = true;
    this.lightspeedBuffTimer = durationMs;
    player.attackSpeedMultiplier = newAtkSpeedMult;
  }

  shutdown(): void {
    // No scene objects to clean up — state is primitive
  }
}
