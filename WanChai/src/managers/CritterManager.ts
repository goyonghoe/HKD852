import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ELEMENT, NEON } from '../config/colors';
import { getCritterForElement } from '../config/critters';
import { Critter } from '../objects/Critter';
import type { Enemy } from '../objects/Enemy';
import type { Player } from '../objects/Player';
import type { RunState } from '../types/game';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';

export interface CritterCallbacks {
  onEnemyDeath: (enemy: Enemy) => void;
  getActiveEnemies: () => Enemy[];
  getActiveEnemyCount: () => number;
  getRunState: () => RunState;
  getPlayer: () => Player;
  getVfx: () => VFXManager;
  getDmgNumbers: () => DamageNumberManager;
}

/**
 * Manages critter companion lifecycle: creation, orbit, skill firing, shield visuals.
 * Extracted from RunScene Phase 5c.
 */
export class CritterManager {
  private scene: Phaser.Scene;
  private callbacks: CritterCallbacks;

  private _critter?: Critter;
  private critterShieldGraphics?: Phaser.GameObjects.Graphics;
  private shieldExpireTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, callbacks: CritterCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  /** Create critter based on character element */
  create(element: string): void {
    // Clean up previous critter state
    if (this.shieldExpireTimer) {
      this.shieldExpireTimer.destroy();
      this.shieldExpireTimer = undefined;
    }
    if (this.critterShieldGraphics) {
      this.critterShieldGraphics.destroy();
      this.critterShieldGraphics = undefined;
    }

    const critterDef = getCritterForElement(element);
    if (critterDef) {
      const player = this.callbacks.getPlayer();
      this._critter = new Critter(
        this.scene,
        player.x,
        player.y,
        critterDef,
        BALANCE.CRITTER.orbitRadius,
        BALANCE.CRITTER.orbitSpeed,
      );
    }
  }

  /** Update critter orbit + fire skills (called each frame) */
  update(delta: number): void {
    if (!this._critter) return;

    const runState = this.callbacks.getRunState();
    const player = this.callbacks.getPlayer();
    const dmgNumbers = this.callbacks.getDmgNumbers();
    const vfx = this.callbacks.getVfx();

    // Regen stream tick processing
    if (this._critter.regenTicksRemaining > 0) {
      this._critter.regenTickTimer -= delta;
      if (this._critter.regenTickTimer <= 0) {
        this._critter.regenTickTimer = BALANCE.CRITTER.regenStreamIntervalMs;
        this._critter.regenTicksRemaining--;
        const healAmt = BALANCE.CRITTER.regenStreamHpPerTick;
        runState.baseHp = Math.min(runState.baseMaxHp, runState.baseHp + healAmt);
        dmgNumbers.show(player.x, player.y - 30, healAmt, true);
        vfx.elementAuraPulse(player.x, player.y, ELEMENT.WATER, 40);
      }
    }

    // Update shield bubble visual
    if (this._critter.shieldBlocksRemaining > 0 && this.critterShieldGraphics) {
      this.critterShieldGraphics.clear();
      this.critterShieldGraphics.lineStyle(2, ELEMENT.EARTH, 0.6);
      this.critterShieldGraphics.strokeCircle(player.x, BALANCE.BASE.y, BALANCE.CRITTER_SHIELD_VFX.shieldBubbleRadius);
    }

    const shouldFire = this._critter.updateOrbit(delta, player.x, player.y);

    if (shouldFire) {
      this.fireCritterSkill();
    }
  }

  /** Check if critter has shield blocks (for base damage reduction) */
  get shieldBlocksRemaining(): number {
    return this._critter?.shieldBlocksRemaining ?? 0;
  }

  /** Consume a shield block. Returns true if a block was consumed. */
  consumeShieldBlock(): boolean {
    if (!this._critter) return false;
    const consumed = this._critter.consumeShieldBlock();
    if (consumed && this._critter.shieldBlocksRemaining <= 0 && this.critterShieldGraphics) {
      this.critterShieldGraphics.clear();
    }
    return consumed;
  }

  /** Get critter reference (for HUD display) */
  get critter(): Critter | undefined {
    return this._critter;
  }

  /** Cleanup */
  shutdown(): void {
    if (this.shieldExpireTimer) {
      this.shieldExpireTimer.destroy();
      this.shieldExpireTimer = undefined;
    }
    if (this.critterShieldGraphics) {
      this.critterShieldGraphics.destroy();
      this.critterShieldGraphics = undefined;
    }
    if (this._critter) {
      this._critter.destroy();
      this._critter = undefined;
    }
  }

  // === Private methods ===

  private fireCritterSkill(): void {
    if (!this._critter) return;
    const def = this._critter.def;
    const elementColor = ELEMENT[def.element as keyof typeof ELEMENT] ?? NEON.PROJECTILE;
    this._critter.flashSkill(elementColor);

    const runState = this.callbacks.getRunState();
    const player = this.callbacks.getPlayer();
    const dmgNumbers = this.callbacks.getDmgNumbers();
    const vfx = this.callbacks.getVfx();
    const activeEnemies = this.callbacks.getActiveEnemies();
    const activeEnemyCount = this.callbacks.getActiveEnemyCount();

    switch (def.skill) {
      // Dolphin -- Heal Pulse: instant base HP restore
      case 'healPulse': {
        const healAmt = Math.ceil(runState.baseMaxHp * BALANCE.CRITTER.healPulsePercent);
        runState.baseHp = Math.min(runState.baseMaxHp, runState.baseHp + healAmt);
        dmgNumbers.show(player.x, player.y - 30, healAmt, true);
        vfx.elementAuraPulse(player.x, player.y, ELEMENT.WATER, 60);
        break;
      }

      // Kite -- Knockback Aura: push nearby enemies 150px away
      case 'knockbackAura':
        for (let i = 0; i < activeEnemyCount; i++) {
          const e = activeEnemies[i];
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BALANCE.CRITTER.knockbackAuraRadius) {
            const nx = dist > 0 ? dx / dist : 0;
            const ny = dist > 0 ? dy / dist : -1;
            e.x += nx * BALANCE.CRITTER.knockbackAuraForce;
            e.y += ny * BALANCE.CRITTER.knockbackAuraForce;
          }
        }
        vfx.elementAuraPulse(player.x, player.y, ELEMENT.WIND, BALANCE.CRITTER.knockbackAuraRadius);
        break;

      // Koi -- Regen Stream: heal over time (3 ticks)
      case 'regenStream':
        this._critter.activateSkill();
        this._critter.regenTicksRemaining = BALANCE.CRITTER.regenStreamTicks;
        this._critter.regenTickTimer = 0; // first tick immediately
        break;

      // Lion -- Flame Burst: AOE damage to nearby enemies
      case 'flameBurst': {
        const radius = BALANCE.CRITTER.flameBurstRadius;
        const damage = BALANCE.CRITTER.flameBurstDamage;
        const radiusSq = radius * radius;
        for (let i = 0; i < activeEnemyCount; i++) {
          const e = activeEnemies[i];
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          if (dx * dx + dy * dy < radiusSq) {
            e.takeDamage(damage);
            if (e.hp <= 0) {
              this.callbacks.onEnemyDeath(e);
            }
          }
        }
        vfx.bombFlash(player.x, player.y, radius);
        break;
      }

      // Macaque -- Chain Lightning: damage 3 nearest enemies
      case 'chainLightning': {
        const targets = this.findChainLightningTargets(
          player.x,
          player.y,
          BALANCE.CRITTER.chainLightningRange,
          BALANCE.CRITTER.chainLightningChainRange,
          BALANCE.CRITTER.chainLightningTargets,
        );
        let prevX = this._critter.x;
        let prevY = this._critter.y;
        for (const t of targets) {
          t.enemy.takeDamage(BALANCE.CRITTER.chainLightningDamage);
          vfx.lightning(prevX, prevY, t.enemy.x, t.enemy.y, ELEMENT.LIGHT);
          if (t.enemy.hp <= 0) {
            this.callbacks.onEnemyDeath(t.enemy);
          }
          prevX = t.enemy.x;
          prevY = t.enemy.y;
        }
        break;
      }

      // Pangolin -- Shield Bubble: block next N incoming base damage
      case 'shieldBubble':
        this._critter.activateSkill();
        this._critter.shieldBlocksRemaining = BALANCE.CRITTER.shieldBubbleBlockCount;
        // Draw shield visual
        if (!this.critterShieldGraphics) {
          this.critterShieldGraphics = this.scene.add.graphics().setDepth(85);
        }
        this.critterShieldGraphics.clear();
        this.critterShieldGraphics.lineStyle(2, ELEMENT.EARTH, 0.6);
        this.critterShieldGraphics.strokeCircle(
          player.x,
          BALANCE.BASE.y,
          BALANCE.CRITTER_SHIELD_VFX.shieldBubbleRadius,
        );
        // Cancel previous shield expire timer to prevent leak
        if (this.shieldExpireTimer) {
          this.shieldExpireTimer.destroy();
          this.shieldExpireTimer = undefined;
        }
        // Auto-expire shield after duration
        this.shieldExpireTimer = this.scene.time.delayedCall(BALANCE.CRITTER.shieldBubbleDurationMs, () => {
          if (this._critter) {
            this._critter.shieldBlocksRemaining = 0;
            this._critter.skillActive = false;
            this._critter.skillTimer = 0;
          }
          if (this.critterShieldGraphics) {
            this.critterShieldGraphics.clear();
          }
          this.shieldExpireTimer = undefined;
        });
        break;
    }
  }

  /**
   * Find chain lightning targets: start from origin, find nearest enemy,
   * then chain to the next nearest from the last hit, etc.
   */
  private findChainLightningTargets(
    ox: number,
    oy: number,
    initialRange: number,
    chainRange: number,
    maxTargets: number,
  ): { enemy: Enemy }[] {
    const result: { enemy: Enemy }[] = [];
    const used = new Set<Enemy>();
    let cx = ox;
    let cy = oy;
    let range = initialRange;

    const activeEnemies = this.callbacks.getActiveEnemies();
    const activeEnemyCount = this.callbacks.getActiveEnemyCount();

    for (let t = 0; t < maxTargets; t++) {
      let nearest: Enemy | null = null;
      let minDistSq = range * range;
      for (let i = 0; i < activeEnemyCount; i++) {
        const e = activeEnemies[i];
        if (used.has(e)) continue;
        const dx = e.x - cx;
        const dy = e.y - cy;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          nearest = e;
        }
      }
      if (!nearest) break;
      used.add(nearest);
      result.push({ enemy: nearest });
      cx = nearest.x;
      cy = nearest.y;
      range = chainRange; // subsequent jumps use chain range
    }
    return result;
  }
}
