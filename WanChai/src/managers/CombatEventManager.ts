import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { NEON, ELEMENT, BOSS_AERO_COLORS } from '../config/colors';
import { ENEMY_DEFS } from '../config/enemies';
import { Enemy } from '../objects/Enemy';
import { VFXManager } from '../utils/VFXManager';
import { DamageNumberManager } from '../ui/DamageNumber';
import { ARIAMessage } from '../ui/ARIAMessage';
import { SaveManager } from '../managers/SaveManager';
import { getRetroSFX } from '../audio/RetroSFX';
import { getAudioManager } from '../audio/AudioManager';
import { getBossCritterInfo } from '../utils/BossCritterMap';
import {
  getEnemyTier,
  calculateDeathReward,
  getUltimateGaugeAmount,
  getScreenShake,
  getSplitterChildren,
  calculateLightspeedBuff,
  shouldTriggerStageClear,
  isRunComplete,
} from '../utils/EnemyDeathHandler';
import { t } from '../lib/i18n';
import { getAriaDialogueKey } from '../core/AriaDialogueCalc';
import { tickEagleDive } from '../core/BossAeroCalc';
import type { RunState } from '../types/game';
import type { PhaseManager } from './PhaseManager';
import type { PassiveManager } from './PassiveManager';
import type { ProgressionManager } from './ProgressionManager';
import type { CollisionManager } from './CollisionManager';
import type { SpawnManager } from './SpawnManager';
import type { WeatherManager } from './WeatherManager';
import type { BackgroundManager } from './BackgroundManager';
import type { CritterManager } from './CritterManager';
import type { BarrierSystem } from '../core/BarrierSystem';
import type { Player } from '../objects/Player';
import type { AnalyticsTracker } from '../utils/AnalyticsTracker';

export interface CombatEventCallbacks {
  getRunState: () => RunState;
  getPlayer: () => Player;
  getPhaseManager: () => PhaseManager;
  getProgressionManager: () => ProgressionManager;
  getPassiveManager: () => PassiveManager;
  getCollisionManager: () => CollisionManager;
  getSpawnManager: () => SpawnManager;
  getWeatherManager: () => WeatherManager;
  getBackgroundManager: () => BackgroundManager;
  getCritterManager: () => CritterManager;
  getBarrierSystem: () => BarrierSystem;
  getVfx: () => VFXManager;
  getDmgNumbers: () => DamageNumberManager;
  getAriaMsg: () => ARIAMessage;
  getAnalyticsTracker: () => AnalyticsTracker;
  getEnemyGroup: () => Phaser.Physics.Arcade.Group;

  getActiveEnemies: () => Enemy[];
  getActiveEnemyCount: () => number;

  getMetaXpBonus: () => number;
  getBaseArmorMultiplier: () => number;
  getShopArmorMultiplier: () => number;
  getPassiveCounts: () => Map<string, number>;

  getStageHpMult: () => number;
  getStageSpeedMult: () => number;
  getStageDamageMult: () => number;

  getPendingStageClear: () => boolean;
  setPendingStageClear: (v: boolean) => void;
  getBossKillCount: () => number;
  setBossKillCount: (v: number) => void;

  setBaseArmorMultiplier: (v: number) => void;

  getXpTableRequired: (level: number) => number;

  playSfx: (key: string, fn: () => void, cooldownMs?: number) => void;
  triggerStoryBeat: (trigger: 'stage_entry' | 'boss_defeat' | 'stage_clear') => void;
  checkRuntimeAriaEvent: (
    event: 'first_boss_kill' | 'player_death' | 'kill_milestone' | 'gold_milestone' | 'district_change',
  ) => void;
}

export class CombatEventManager {
  private scene: Phaser.Scene;
  private cb: CombatEventCallbacks;

  constructor(scene: Phaser.Scene, callbacks: CombatEventCallbacks) {
    this.scene = scene;
    this.cb = callbacks;
  }

  // === ENEMY UPDATE LOOP (PHASE 4) ===

  updateEnemies(
    scaledDelta: number,
    px: number,
    py: number,
    weatherSpeedMod: number,
    gw: { cx: number; cy: number; radius: number; pullSpeed: number } | null,
    dtSec: number,
  ): void {
    const activeEnemies = this.cb.getActiveEnemies();
    const activeEnemyCount = this.cb.getActiveEnemyCount();
    const vfx = this.cb.getVfx();
    const collisionManager = this.cb.getCollisionManager();
    const phaseManager = this.cb.getPhaseManager();
    const runState = this.cb.getRunState();
    const enemyDelta = scaledDelta;

    // Track Eagle Dive push for all enemies (TASK-048)
    let eagleDivePushActive = false;

    for (let i = 0; i < activeEnemyCount; i++) {
      const enemy = activeEnemies[i];
      enemy.updateFlash(scaledDelta);
      // Boss phase transition tick + VFX (TASK-121)
      enemy.updateBossPhase(scaledDelta);
      if (
        enemy.bossPhaseState.phase === 2 &&
        enemy.bossPhaseState.invulnerabilityMs > 0 &&
        !enemy.getData('phase2VfxFired')
      ) {
        enemy.setData('phase2VfxFired', true);
        vfx.screenFlash(NEON.BOSS_PHASE2_FLASH, 0.6, BALANCE.BOSS_PHASE.flashDurationMs);
        vfx.screenShake(BALANCE.BOSS_PHASE2_VFX.shakeIntensity, BALANCE.BOSS_PHASE2_VFX.shakeDurationMs);
        enemy.setTint(NEON.BOSS_PHASE2_TINT);
        enemy.applyPhase2Glow();
        // TASK-049: Turbine explosion debris for boss_burst P2
        if (enemy.behavior === 'boss_burst') {
          vfx.phaseTransitionDebris(enemy.x, enemy.y, 2);
        }
      }
      // Phase 3 transition VFX + ARIA (TASK-048: Boss Aero)
      if (
        enemy.bossPhaseState.phase === 3 &&
        enemy.bossPhaseState.invulnerabilityMs > 0 &&
        !enemy.getData('phase3VfxFired')
      ) {
        enemy.setData('phase3VfxFired', true);
        vfx.screenFlash(NEON.BOSS_PHASE2_FLASH, 0.6, BALANCE.BOSS_PHASE.flashDurationMs);
        vfx.screenShake(BALANCE.BOSS_PHASE2_VFX.shakeIntensity, BALANCE.BOSS_PHASE2_VFX.shakeDurationMs);
        enemy.applyPhase3Glow();
        // TASK-049: Antenna break debris for boss_burst P3
        if (enemy.behavior === 'boss_burst') {
          vfx.phaseTransitionDebris(enemy.x, enemy.y, 3);
        }
        // ARIA Phase 3 warning
        const ariaMsg = this.cb.getAriaMsg();
        if (ariaMsg) {
          ariaMsg.show(t(getAriaDialogueKey('boss_phase3', runState.stage)));
        }
      }

      // Keep Phase 2/3 tint after invulnerability ends
      if (
        enemy.bossPhaseState.phase >= 2 &&
        enemy.bossPhaseState.invulnerabilityMs <= 0 &&
        (enemy.getData('phase2VfxFired') || enemy.getData('phase3VfxFired'))
      ) {
        // Pulsing alpha effect during Phase 2/3
        const pulse = 0.7 + 0.3 * Math.sin(runState.runTime * 0.005);
        enemy.setAlpha(pulse);
      }

      // TASK-049: Boss Aero wind vortex VFX — continuous rotating particles
      if (enemy.behavior === 'boss_burst' && enemy.bossPhaseState.invulnerabilityMs <= 0) {
        const windRadius =
          enemy.bossPhaseState.phase >= 3 ? BALANCE.BOSS_AERO.windDeflectRadiusP3 : BALANCE.BOSS_AERO.windDeflectRadius;
        vfx.windVortexTick(scaledDelta, enemy.x, enemy.y, windRadius, enemy.bossPhaseState.phase);
      }

      // Boss Aero Eagle Dive — Phase 3 only (TASK-048)
      if (enemy.behavior === 'boss_burst' && enemy.bossPhaseState.phase === 3) {
        const diveResult = tickEagleDive(
          enemy.eagleDiveState,
          scaledDelta,
          BALANCE.BOSS_AERO.diveIntervalMs,
          BALANCE.BOSS_AERO.diveDurationMs,
        );
        enemy.eagleDiveState = diveResult.state;
        if (diveResult.diveStarted) {
          // VFX: warning flash + screen shake + eagle silhouette (TASK-049)
          vfx.screenFlash(BOSS_AERO_COLORS.DIVE_WARNING, 0.3, 500);
          vfx.screenShake(0.006, 200);
          vfx.eagleDiveSilhouette();
        }
        if (diveResult.state.active) {
          eagleDivePushActive = true;
        }
      }

      if (enemy.isAttackingBase) {
        if (enemy.shouldAttack(scaledDelta)) {
          this.applyBaseDamage(enemy);
          if (phaseManager.current !== 'playing') return;
        }
        continue;
      }

      if (enemy.attackStyle === 'ranged' && enemy.isRangedStopped) {
        enemy.applyMovement(enemyDelta, px, py);
        if (enemy.shouldShoot(scaledDelta)) {
          collisionManager.spawnEnemyProjectile(this.scene, enemy);
        }
        // Apply weather speed modifier to ranged-stopped enemies
        if (weatherSpeedMod !== 1) {
          const body = enemy.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(body.velocity.x * weatherSpeedMod, body.velocity.y * weatherSpeedMod);
        }
        continue;
      }

      enemy.applyMovement(enemyDelta, px, py);

      // Apply weather speed modifier to enemy velocity
      if (weatherSpeedMod !== 1) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(body.velocity.x * weatherSpeedMod, body.velocity.y * weatherSpeedMod);
      }

      // Eagle Dive push: all non-boss enemies get extra leftward velocity (TASK-048)
      if (eagleDivePushActive && !enemy.knockbackImmune) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(body.velocity.x + BALANCE.BOSS_AERO.divePushSpeed);
      }

      // Apply gravity well pull toward center
      if (gw && !enemy.frozen) {
        const dx = gw.cx - enemy.x;
        const dy = gw.cy - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist <= gw.radius) {
          const pull = gw.pullSpeed * dtSec;
          enemy.x += (dx / dist) * pull;
          enemy.y += (dy / dist) * pull;
        }
      }

      if (enemy.attackStyle === 'ranged' && enemy.circlePhase === 'orbit') {
        if (enemy.shouldShoot(scaledDelta)) {
          collisionManager.spawnEnemyProjectile(this.scene, enemy);
        }
      }

      // Street Defense: base reached when enemy crosses barrier X threshold
      // Enemies come from right, so they reach barrier when x <= leftReachX
      const reachedBase = enemy.x <= BALANCE.BASE.leftReachX;
      if (reachedBase) {
        this.onEnemyReachedBase(enemy);
        if (phaseManager.current !== 'playing') return;
      }
    }
  }

  // === ENEMY REACHED BASE ===

  onEnemyReachedBase(enemy: Enemy): void {
    const barrierX = BALANCE.BARRIER.x;
    const vfx = this.cb.getVfx();

    if (enemy.defId.startsWith('boss')) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      // Bounce boss back to the right of barrier
      enemy.x = barrierX + BALANCE.BOSS_BOUNCE.offsetX;
      body.setVelocity(enemy.speed * 2, 0);
      vfx.screenShake(BALANCE.BOSS_BOUNCE.shakeIntensity, BALANCE.BOSS_BOUNCE.shakeDurationMs);
      return;
    }

    if (enemy.attackStyle === 'melee') {
      // Stop at barrier threshold (enemies come from right, so stop just right of barrier)
      enemy.x = BALANCE.BASE.leftReachX + 10;
      enemy.startBaseAttack();
      this.applyBaseDamage(enemy);
      return;
    }

    this.applyBaseDamage(enemy);
    const tier = enemy.defId === 'tank' || enemy.defId === 'splitter' || enemy.defId === 'guardian' ? 't2' : 't1';
    vfx.purifyDeath(enemy.x, BALANCE.BASE.y, tier);
    enemy.deactivate();
  }

  // === APPLY BASE DAMAGE ===

  applyBaseDamage(enemy: Enemy): void {
    const critterManager = this.cb.getCritterManager();
    const dmgNumbers = this.cb.getDmgNumbers();
    const vfx = this.cb.getVfx();
    const player = this.cb.getPlayer();
    const passiveManager = this.cb.getPassiveManager();
    const progressionManager = this.cb.getProgressionManager();
    const backgroundManager = this.cb.getBackgroundManager();
    const barrierSystem = this.cb.getBarrierSystem();
    const runState = this.cb.getRunState();
    const passiveCounts = this.cb.getPassiveCounts();
    const baseArmorMultiplier = this.cb.getBaseArmorMultiplier();
    const shopArmorMultiplier = this.cb.getShopArmorMultiplier();

    // Shield Bubble: critter blocks incoming base damage
    if (critterManager.consumeShieldBlock()) {
      dmgNumbers.show(enemy.x, BALANCE.BARRIER.y + BALANCE.BASE_DAMAGE_VFX.dmgNumberOffsetY, 0, true);
      vfx.elementAuraPulse(player.x, BALANCE.BARRIER.y, ELEMENT.EARTH, BALANCE.CRITTER_SHIELD_VFX.blockAuraRadius);
      return;
    }
    const actualDamage = Math.ceil(enemy.damage * baseArmorMultiplier);

    // Damage both barrier system and base HP (they track together)
    barrierSystem.takeDamage(actualDamage);
    runState.baseHp = Math.max(0, runState.baseHp - actualDamage);

    backgroundManager.flashBaseWall();
    vfx.screenShake(BALANCE.BASE_DAMAGE_VFX.shakeIntensity, BALANCE.BASE_DAMAGE_VFX.shakeDurationMs);
    dmgNumbers.show(enemy.x, BALANCE.BARRIER.y + BALANCE.BASE_DAMAGE_VFX.dmgNumberOffsetY, actualDamage, false);
    this.cb.playSfx('baseHit', () => getRetroSFX().baseHit(), BALANCE.SFX_COOLDOWNS.baseHitMs);

    // Thorns passive: reflect damage back to enemy
    const thornsLevel = passiveCounts.get('thorns') ?? 0;
    if (thornsLevel > 0 && enemy.active) {
      const thornsDmg = BALANCE.PASSIVE.thornsDamagePerLevel * thornsLevel;
      const dead = enemy.takeDamage(thornsDmg);
      dmgNumbers.show(enemy.x, enemy.y - 10, thornsDmg, false);
      vfx.hitSpark(enemy.x, enemy.y, player.elementColor);
      if (dead) this.onEnemyDeath(enemy);
    }

    // Fortify passive: reset no-damage timer on base hit
    const newArmor = passiveManager.onBaseDamaged(passiveCounts, shopArmorMultiplier);
    if (newArmor !== null) {
      this.cb.setBaseArmorMultiplier(newArmor);
    }

    // Hit-stop + screen flash on base damage
    passiveManager.applyHitStop(BALANCE.JUICE.hitStopMs);
    (this.scene as Phaser.Scene).cameras.main.flash(BALANCE.BASE_DAMAGE_VFX.flashDurationMs, 255, 255, 255, false);

    // Barrier destroyed → game over
    if (barrierSystem.isDestroyed() || runState.baseHp <= 0) {
      backgroundManager.showBarricadeDestroyed();
      progressionManager.onRunComplete(false);
    }
  }

  // === ENEMY DEATH ===

  onEnemyDeath(enemy: Enemy): void {
    const runState = this.cb.getRunState();
    const player = this.cb.getPlayer();
    const vfx = this.cb.getVfx();
    const ariaMsg = this.cb.getAriaMsg();
    const phaseManager = this.cb.getPhaseManager();
    const passiveManager = this.cb.getPassiveManager();
    const progressionManager = this.cb.getProgressionManager();
    const spawnManager = this.cb.getSpawnManager();
    const analyticsTracker = this.cb.getAnalyticsTracker();
    const passiveCounts = this.cb.getPassiveCounts();
    const enemyGroup = this.cb.getEnemyGroup();

    // Pure reward calculation (EnemyDeathHandler)
    const tier = getEnemyTier(enemy.defId, enemy.isElite);
    const reward = calculateDeathReward({
      defId: enemy.defId,
      isElite: enemy.isElite,
      xpValue: enemy.xpValue,
      metaXpBonus: this.cb.getMetaXpBonus(),
    });

    runState.kills++;
    runState.gold += reward.gold;
    runState.playerXp += reward.xp;

    // SPEC-026: Runtime ARIA events — kill & gold milestones
    this.cb.checkRuntimeAriaEvent('kill_milestone');
    this.cb.checkRuntimeAriaEvent('gold_milestone');

    this.cb.playSfx('gold', () => getRetroSFX().goldCollect(), 200);
    this.cb.playSfx('xp', () => getRetroSFX().xpCollect(), 100);
    getAudioManager().playSFX('sfx_pickup');
    SaveManager.discoverEnemy(enemy.defId);

    // VFX + ultimate gauge + screen shake
    vfx.purifyDeath(enemy.x, enemy.y, tier);
    player.addUltimateGauge(getUltimateGaugeAmount(tier));
    const shake = getScreenShake(tier);
    vfx.screenShake(shake.intensity, shake.durationMs);

    // Lightspeed passive (attack speed boost on kill — delegated to PassiveManager)
    const lsBuff = calculateLightspeedBuff(passiveCounts.get('lightspeed') ?? 0);
    if (lsBuff) {
      passiveManager.applyLightspeedOnKill(lsBuff.durationMs, lsBuff.newAtkSpeedMult, player);
    }

    // Splitter children
    const splitterChildren = getSplitterChildren({
      behavior: enemy.defId,
      isSplitChild: enemy.isSplitChild,
      parentMaxHp: enemy.maxHp,
      parentX: enemy.x,
      parentY: enemy.y,
    });
    if (splitterChildren) {
      const def = ENEMY_DEFS[enemy.defId] ?? ENEMY_DEFS['basic'];
      for (const sc of splitterChildren) {
        const child = enemyGroup.get() as Enemy | null;
        if (!child) break;
        child.activate(
          def,
          enemy.x + sc.offsetX,
          enemy.y,
          spawnManager.getElapsedMinutes(),
          false,
          this.cb.getStageHpMult(),
          this.cb.getStageSpeedMult(),
          this.cb.getStageDamageMult(),
        );
        child.hp = sc.hp;
        child.maxHp = sc.hp;
        child.isSplitChild = true;
        child.setScale(sc.scale);
      }
    }

    // Play death animation if available, otherwise deactivate immediately
    const hasDeathAnim = enemy.playDeathAnim(() => {
      enemy.deactivate();
    });
    if (!hasDeathAnim) {
      enemy.deactivate();
    } else {
      // Disable physics body immediately so dead enemy doesn't block projectiles/collisions
      const deadBody = enemy.body as Phaser.Physics.Arcade.Body;
      deadBody.enable = false;
      deadBody.setVelocity(0, 0);
    }
    this.cb.playSfx('kill', () => getRetroSFX().enemyDeath(), 80);
    getAudioManager().playSFX('sfx_death');

    // Boss stage clear
    if (shouldTriggerStageClear(spawnManager.isBossStage, enemy.defId)) {
      getRetroSFX().bossDefeat();
      getAudioManager().playSFX('sfx_explosion');
      this.cb.setPendingStageClear(true);
      this.cb.setBossKillCount(this.cb.getBossKillCount() + 1);
      // SPEC-026: First boss kill runtime ARIA event
      this.cb.checkRuntimeAriaEvent('first_boss_kill');
      // ARIA boss defeat dialogue (TASK-125)
      ariaMsg.show(t(getAriaDialogueKey('boss_defeat', runState.stage)));
      // Story beat on boss defeat (TASK-017)
      this.cb.triggerStoryBeat('boss_defeat');
      // TASK-049: Boss Aero wind dissipation on death
      if (enemy.behavior === 'boss_burst') {
        vfx.windDissipate(enemy.x, enemy.y);
      }
      // TASK-126: Boss Freedom Burst — liberation VFX cutscene
      const critterInfo = getBossCritterInfo(runState.stage);
      vfx.bossFreedomBurst(enemy.x, enemy.y, critterInfo.color);
    }

    // Level up check
    if (phaseManager.current === 'playing') {
      while (runState.playerXp >= this.cb.getXpTableRequired(runState.playerLevel)) {
        runState.playerXp -= this.cb.getXpTableRequired(runState.playerLevel);
        runState.playerLevel++;
        analyticsTracker.trackLevelUp(runState.playerLevel);
        vfx.cameraZoomPunch(BALANCE.CAMERA_FX.levelUpZoom, BALANCE.CAMERA_FX.levelUpZoomMs);
        progressionManager.showLevelUpUI();
        break;
      }
    }

    // Boss died, no level-up → show stage clear (delayed by freedom cutscene)
    if (this.cb.getPendingStageClear() && phaseManager.current !== 'levelup') {
      this.cb.setPendingStageClear(false);
      this.scene.physics.pause();
      // Delay stage clear by BOSS_FREEDOM.totalMs to let the liberation cutscene play
      this.scene.time.delayedCall(BALANCE.BOSS_FREEDOM.totalMs, () => {
        if (phaseManager.current === 'gameover') return;
        if (!isRunComplete(runState.stage)) {
          analyticsTracker.trackStageClear(runState.stage, true, runState.kills);
          progressionManager.showStageClear();
        } else {
          progressionManager.onRunComplete(true);
        }
      });
    }
  }

  // === WEATHER LIGHTNING DAMAGE ===

  processWeatherLightning(strikes: { x: number; y: number; damage: number }[]): void {
    if (strikes.length === 0) return;

    const activeEnemies = this.cb.getActiveEnemies();
    const activeEnemyCount = this.cb.getActiveEnemyCount();
    const phaseManager = this.cb.getPhaseManager();
    const vfx = this.cb.getVfx();
    const dmgNumbers = this.cb.getDmgNumbers();

    for (const strike of strikes) {
      const rSq = BALANCE.WEATHER.lightningFieldRadius * BALANCE.WEATHER.lightningFieldRadius;
      for (let i = 0; i < activeEnemyCount; i++) {
        const enemy = activeEnemies[i];
        if (!enemy.active) continue;
        const dx = enemy.x - strike.x;
        const dy = enemy.y - strike.y;
        if (dx * dx + dy * dy <= rSq) {
          enemy.hp -= strike.damage;
          dmgNumbers.show(enemy.x, enemy.y + BALANCE.BASE_DAMAGE_VFX.dmgNumberOffsetY, strike.damage, false);
          vfx.hitSpark(enemy.x, enemy.y);
          if (enemy.hp <= 0) {
            this.onEnemyDeath(enemy);
            if (phaseManager.current !== 'playing') return;
          }
        }
      }
    }
  }

  shutdown(): void {
    // Release references to prevent stale closures on scene restart
    this.cb = null!;
    this.scene = null!;
  }
}
