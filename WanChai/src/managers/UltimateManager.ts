import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ELEMENT } from '../config/colors';
import { ULTIMATE_DEFS } from '../config/ultimates';
import { getRetroSFX } from '../audio/RetroSFX';
import {
  calculateCycloneHits,
  calculateBeamHits,
  applyArmorBuff,
  removeArmorBuff,
  calculateDOTTicks,
  type EnemyTarget,
} from '../core/UltimateCalc';
import { trackEvent } from '../lib/analytics';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';
import type { VFXManager } from '../utils/VFXManager';
import type { ARIAMessage } from '../ui/ARIAMessage';
import { t } from '../lib/i18n';

export interface UltimateCallbacks {
  getActiveEnemies: () => Enemy[];
  getActiveEnemyCount: () => number;
  getEnemyGroup: () => Phaser.Physics.Arcade.Group;
  onEnemyDeath: (enemy: Enemy) => void;
  getBaseArmorMultiplier: () => number;
  setBaseArmorMultiplier: (v: number) => void;
  getGameSpeed: () => number;
}

/**
 * Ultimate gauge, activation check, and per-character ultimate effects.
 */
export class UltimateManager {
  private scene: Phaser.Scene;
  private callbacks: UltimateCallbacks;

  active = false;
  private solTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, callbacks: UltimateCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  reset(): void {
    this.active = false;
    if (this.solTimer) {
      this.solTimer.destroy();
      this.solTimer = undefined;
    }
  }

  /** Check and fire ultimate if ready. Call from RunScene.update(). */
  checkAndFire(player: Player, vfx: VFXManager, ariaMsg: ARIAMessage): void {
    if (!player.ultimateReady || this.active) return;
    this.activate(player, vfx, ariaMsg);
  }

  private activate(player: Player, vfx: VFXManager, ariaMsg: ARIAMessage): void {
    if (!player.consumeUltimate()) return;
    trackEvent('ultimate_used', {
      characterId: player.characterId,
      enemiesOnScreen: this.callbacks.getActiveEnemyCount(),
    });
    this.active = true;

    // Full-screen element flash
    vfx.ultimateFlash(player.elementColor);
    getRetroSFX().deploy();

    // Slow-mo effect
    const prevTimeScale = this.scene.time.timeScale;
    this.scene.time.timeScale = BALANCE.ULTIMATE.slowMoTimeScale;
    this.scene.physics.world.timeScale = this.callbacks.getGameSpeed() * BALANCE.ULTIMATE.slowMoTimeScale;

    this.scene.time.delayedCall(BALANCE.ULTIMATE.slowMoDurationMs * BALANCE.ULTIMATE.slowMoTimeScale, () => {
      this.scene.time.timeScale = prevTimeScale;
      this.scene.physics.world.timeScale = this.callbacks.getGameSpeed();
      this.execute(player.characterId, player, vfx, ariaMsg);
    });
  }

  private execute(characterId: string, player: Player, vfx: VFXManager, ariaMsg: ARIAMessage): void {
    switch (characterId) {
      case 'hai':
        this.ultimateHai(player, vfx);
        break;
      case 'nova':
        this.ultimateNova();
        break;
      case 'sol':
        this.ultimateSol(vfx);
        break;
      case 'mei':
        this.ultimateMei(player, vfx);
        break;
      case 'kai':
        this.ultimateKai(vfx);
        break;
    }
    const ultDef = ULTIMATE_DEFS[characterId];
    if (ultDef) {
      ariaMsg.show(
        t('aria.ultimate', {
          name: t(`ultimate.${characterId}`),
          desc: t(`ultimate.${characterId}_desc`),
        }),
      );
    }
  }

  /** HAI — Cyclone: damage + knockback all enemies within radius */
  private ultimateHai(player: Player, vfx: VFXManager): void {
    const cfg = BALANCE.ULTIMATE.hai;
    const px = player.x;
    const py = player.y;
    const enemies = this.callbacks.getActiveEnemies();
    const count = this.callbacks.getActiveEnemyCount();

    // Map enemies to EnemyTarget[] for pure calc
    const targets: EnemyTarget[] = [];
    for (let i = 0; i < count; i++) {
      targets.push({ x: enemies[i].x, y: enemies[i].y, hp: enemies[i].hp, active: enemies[i].active });
    }

    const result = calculateCycloneHits({ x: px, y: py }, cfg.radius, cfg.damage, cfg.knockback, targets);

    // Apply damage to all hit enemies
    for (let h = 0; h < result.hitIndices.length; h++) {
      enemies[result.hitIndices[h]].takeDamage(cfg.damage);
    }
    // Handle kills
    for (let k = 0; k < result.killIndices.length; k++) {
      this.callbacks.onEnemyDeath(enemies[result.killIndices[k]]);
    }
    // Apply knockback to survivors
    for (let kb = 0; kb < result.knockbacks.length; kb++) {
      const { index, vx, vy } = result.knockbacks[kb];
      const body = enemies[index].body as Phaser.Physics.Arcade.Body;
      body.setVelocity(vx, vy);
    }

    vfx.elementAuraPulse(px, py, player.elementColor, cfg.radius);
    this.active = false;
  }

  /** NOVA — Frost Wave: freeze all enemies on screen */
  private ultimateNova(): void {
    const cfg = BALANCE.ULTIMATE.nova;
    const enemies = this.callbacks.getActiveEnemies();
    const count = this.callbacks.getActiveEnemyCount();
    for (let i = 0; i < count; i++) {
      const enemy = enemies[i];
      if (!enemy.active) continue;
      enemy.frozen = true;
      enemy.setTint(ELEMENT.WATER);
    }
    this.scene.time.delayedCall(cfg.freezeDurationMs, () => {
      const children = this.callbacks.getEnemyGroup().getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i] as Enemy;
        if (enemy.active && enemy.frozen) {
          enemy.frozen = false;
          enemy.clearTint();
        }
      }
      this.active = false;
    });
  }

  /** SOL — Firestorm: DOT to all enemies for duration */
  private ultimateSol(vfx: VFXManager): void {
    const cfg = BALANCE.ULTIMATE.sol;
    let elapsed = 0;
    this.solTimer = this.scene.time.addEvent({
      delay: cfg.dotIntervalMs,
      repeat: calculateDOTTicks(cfg.durationMs, cfg.dotIntervalMs) - 1,
      callback: () => {
        elapsed += cfg.dotIntervalMs;
        const children = this.callbacks.getEnemyGroup().getChildren();
        for (let i = 0; i < children.length; i++) {
          const enemy = children[i] as Enemy;
          if (!enemy.active) continue;
          const dead = enemy.takeDamage(cfg.dotDamage);
          if (dead) {
            this.callbacks.onEnemyDeath(enemy);
          }
        }
        if (elapsed === cfg.dotIntervalMs) {
          vfx.screenFlash(ELEMENT.FIRE, 0.15, 300);
        }
        if (elapsed >= cfg.durationMs) {
          this.active = false;
        }
      },
    });
    this.scene.time.delayedCall(cfg.durationMs + 100, () => {
      this.active = false;
    });
  }

  /** MEI — Light Pillar: vertical beam dealing massive damage */
  private ultimateMei(player: Player, vfx: VFXManager): void {
    const cfg = BALANCE.ULTIMATE.mei;
    const px = player.x;
    const halfW = cfg.width / 2;
    vfx.ultimateBeam(px, player.elementColor, cfg.width);
    const enemies = this.callbacks.getActiveEnemies();
    const count = this.callbacks.getActiveEnemyCount();

    // Map enemies to EnemyTarget[] for pure calc
    const targets: EnemyTarget[] = [];
    for (let i = 0; i < count; i++) {
      targets.push({ x: enemies[i].x, y: enemies[i].y, hp: enemies[i].hp, active: enemies[i].active });
    }

    const result = calculateBeamHits(px, halfW, cfg.damage, targets);

    // Apply damage to all hit enemies
    for (let h = 0; h < result.hitIndices.length; h++) {
      enemies[result.hitIndices[h]].takeDamage(cfg.damage);
    }
    // Handle kills
    for (let k = 0; k < result.killIndices.length; k++) {
      this.callbacks.onEnemyDeath(enemies[result.killIndices[k]]);
    }

    this.active = false;
  }

  /** KAI — Earthquake: stun all enemies + armor buff */
  private ultimateKai(vfx: VFXManager): void {
    const cfg = BALANCE.ULTIMATE.kai;
    const enemies = this.callbacks.getActiveEnemies();
    const count = this.callbacks.getActiveEnemyCount();
    for (let i = 0; i < count; i++) {
      const enemy = enemies[i];
      if (!enemy.active) continue;
      enemy.frozen = true;
      enemy.setTint(ELEMENT.EARTH);
    }
    vfx.screenShake(0.015, 500);
    const currentArmor = this.callbacks.getBaseArmorMultiplier();
    this.callbacks.setBaseArmorMultiplier(applyArmorBuff(currentArmor, cfg.armorBuff));
    // Unstun after duration
    this.scene.time.delayedCall(cfg.stunDurationMs, () => {
      const children = this.callbacks.getEnemyGroup().getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i] as Enemy;
        if (enemy.active && enemy.frozen) {
          enemy.frozen = false;
          enemy.clearTint();
        }
      }
    });
    // Remove armor buff
    this.scene.time.delayedCall(cfg.armorDurationMs, () => {
      const curArmor = this.callbacks.getBaseArmorMultiplier();
      this.callbacks.setBaseArmorMultiplier(removeArmorBuff(curArmor, cfg.armorBuff));
      this.active = false;
    });
    if (cfg.stunDurationMs >= cfg.armorDurationMs) {
      this.scene.time.delayedCall(cfg.stunDurationMs + 100, () => {
        this.active = false;
      });
    }
  }
}
