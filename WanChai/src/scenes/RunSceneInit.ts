/**
 * RunSceneInit.ts — Factory functions extracted from RunScene.create() helpers.
 *
 * Each function receives a RunSceneCtx (a typed view of RunScene's mutable state)
 * and returns the created manager or mutates state via the context object.
 */

import { BALANCE } from '../config/balance';
import type { CharacterDef } from '../config/characters';
import { applyCharacterPassive } from '../core/CharacterPassiveCalc';
import { getDistrictForStage } from '../config/districts';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { SpawnManager } from '../managers/SpawnManager';
import { XpTable } from '../core/XpTable';
import { ARIAMessage } from '../ui/ARIAMessage';
import { PauseOverlay } from '../ui/PauseOverlay';
import { getRetroSFX } from '../audio/RetroSFX';
import { getRetroAudio } from '../audio/RetroAudio';
import { getAudioManager } from '../audio/AudioManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { BarrierSystem } from '../core/BarrierSystem';
import { resetSession, trackEvent } from '../lib/analytics';
import { AnalyticsTracker } from '../utils/AnalyticsTracker';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import { t } from '../lib/i18n';
import { AriaCooldownTracker, getAriaDialogueKey } from '../core/AriaDialogueCalc';
import { navigateScene } from '../utils/SceneNav';
import type { RunState } from '../types/game';
import type { WeaponInstance } from '../types/weapon';

// Managers
import { HUDManager } from '../managers/HUDManager';
import { ShopManager } from '../managers/ShopManager';
import { UltimateManager } from '../managers/UltimateManager';
import { CollisionManager } from '../managers/CollisionManager';
import { ProgressionManager } from '../managers/ProgressionManager';
import { SquadManager } from '../managers/SquadManager';
import { CombatEventManager } from '../managers/CombatEventManager';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { VFXManager } from '../utils/VFXManager';
import type { DamageNumberManager } from '../ui/DamageNumber';
import type { SeededRandom } from '../core/SeededRandom';
import type { PhaseManager } from '../managers/PhaseManager';
import type { WeatherManager } from '../managers/WeatherManager';
import type { BackgroundManager } from '../managers/BackgroundManager';
import type { PassiveManager } from '../managers/PassiveManager';
import type { CritterManager } from '../managers/CritterManager';
import type { Projectile } from '../objects/Projectile';

/**
 * Typed view of RunScene's mutable fields that the factory functions need.
 * RunScene passes `this` (cast via `asCtx()`) to these functions.
 * Extends Phaser.Scene so factories can access physics, input, time, etc.
 */
export interface RunSceneCtx extends Phaser.Scene {
  // Mutable state
  runState: RunState;
  weapons: WeaponInstance[];
  passiveCounts: Map<string, number>;
  targetPoint: { x: number; y: number } | null;
  baseArmorMultiplier: number;
  shopArmorMultiplier: number;
  gameSpeed: number;
  speedIndex: number;
  stageHpMult: number;
  stageSpeedMult: number;
  stageDamageMult: number;
  metaXpBonus: number;
  metaDamageBase: number;
  metaCritBase: number;
  metaLuck: number;
  weaponFireCount: number;
  pendingStageClear: boolean;
  activeBoss: Enemy | null;
  bossKillCount: number;
  midShopShown: boolean;
  challengeMode: boolean;
  challengeModifier: string;
  ariaState: {
    bossShown: boolean;
    bossWarningShown: boolean;
    lowHpShown: boolean;
    cooldown: AriaCooldownTracker;
    stageEntryShown: boolean;
    districtChangeShown: boolean;
    prevDistrict: string;
    seenStoryBeats: Set<string>;
  };
  sfxThrottles: Map<string, number>;

  // Managers (assigned by factories)
  phaseManager: PhaseManager;
  hudManager: HUDManager;
  shopManager: ShopManager;
  ultimateManager: UltimateManager;
  weatherManager: WeatherManager;
  collisionManager: CollisionManager;
  progressionManager: ProgressionManager;
  squadManager: SquadManager;
  passiveManager: PassiveManager;
  backgroundManager: BackgroundManager;
  combatEventManager: CombatEventManager;
  critterManager: CritterManager;

  // Systems
  weaponSystem: WeaponSystem;
  spawnManager: SpawnManager;
  rng: SeededRandom;
  xpTable: XpTable;
  vfx: VFXManager;
  dmgNumbers: DamageNumberManager;
  ariaMsg: ARIAMessage;
  barrierSystem: BarrierSystem;
  analyticsTracker: AnalyticsTracker;

  // Game objects
  player: Player;
  enemyGroup: Phaser.Physics.Arcade.Group;
  projectileGroup: Phaser.Physics.Arcade.Group;
  activeEnemies: Enemy[];
  activeEnemyCount: number;

  // UI
  pauseOverlay: PauseOverlay;
  tutorialOverlay?: TutorialOverlay;

  // Utility methods (bound from RunScene)
  playSfx(key: string, fn: () => void, cooldownMs?: number): void;
  playWeaponSfx(weaponId?: string): void;
  togglePause(): void;
  cycleSpeed(): void;
  onPointerDown(pointer: Phaser.Input.Pointer): void;
  triggerStoryBeat(trigger: 'stage_entry' | 'boss_defeat' | 'stage_clear'): void;
  checkRuntimeAriaEvent(
    event: 'first_boss_kill' | 'player_death' | 'kill_milestone' | 'gold_milestone' | 'district_change',
  ): void;
  onEnemyDeath(enemy: Enemy): void;
}

// ─── Factory Functions ───────────────────────────────────────────────

export function initRunState(ctx: RunSceneCtx, characterId: string, seed: number, startWeapon: string): void {
  ctx.runState = {
    characterId,
    seed,
    runTime: 0,
    stageTime: 0,
    stage: 1,
    playerLevel: 1,
    playerXp: 0,
    baseHp: BALANCE.BASE.hp,
    baseMaxHp: BALANCE.BASE.hp,
    kills: 0,
    gold: 0,
    weapons: [startWeapon],
    passives: [],
    totalDamageDealt: 0,
    weaponDamageMap: {},
    critHitsLanded: 0,
    totalHitsLanded: 0,
    highestSingleHit: 0,
  };
  ctx.stageHpMult = 1;
  ctx.stageSpeedMult = 1;
  ctx.stageDamageMult = 1;

  // Initialize barrier system
  ctx.barrierSystem = new BarrierSystem(BALANCE.BARRIER.hp);

  // Apply challenge mode modifiers (speed only — halfHp/noShop applied after meta init)
  if (ctx.challengeMode && ctx.challengeModifier === 'doubleSpeed') {
    ctx.stageSpeedMult = 2;
  }

  // Analytics
  resetSession();
  const district = getDistrictForStage(ctx.runState.stage);
  trackEvent('session_start', { characterId, district: district?.name ?? 'unknown' });
  ctx.analyticsTracker = new AnalyticsTracker();
  ctx.analyticsTracker.trackStageStart(ctx.runState.stage, Math.ceil(ctx.runState.stage / 2));
}

export function createSquadAndPlayer(
  ctx: RunSceneCtx,
  characterId: string,
  charDef: CharacterDef | undefined,
  metaDmg: number,
  metaCrit: number,
): void {
  ctx.squadManager = new SquadManager(ctx as Phaser.Scene);
  ctx.player = ctx.squadManager.create(characterId, (member, _index) => ({
    vfx: ctx.vfx,
    dmgNumbers: ctx.dmgNumbers,
    onEnemyDeath: (enemy: Enemy) => ctx.onEnemyDeath(enemy),
    onWeaponFire: (barrelX: number, barrelY: number, weaponId?: string) => {
      ctx.playSfx('weaponFire', () => ctx.playWeaponSfx(weaponId), BALANCE.SFX_COOLDOWNS.weaponFireMs);
      getAudioManager().playSFX('sfx_shoot');
      member.onWeaponFire();
      ctx.vfx.muzzleFlash(barrelX, barrelY, ctx.player.elementColor);
      ctx.weaponFireCount = (ctx.weaponFireCount ?? 0) + 1;
      if (ctx.weaponFireCount % BALANCE.PLAYER_ANIM.auraFireInterval === 0) {
        ctx.vfx.elementAuraPulse(ctx.player.x, ctx.player.y, ctx.player.elementColor);
      }
    },
  }));
  // The leader's weapon system is also kept as ctx.weaponSystem for compatibility
  ctx.weaponSystem = ctx.squadManager.getLeaderWeaponSystem();

  // Pass SeededRandom to weapon system for deterministic combat rolls (TASK-011 RT)
  ctx.weaponSystem.setRng(ctx.rng);

  // Apply meta bonuses (solo mode — no squad damage split)
  ctx.player.damageMultiplier = 1 + metaDmg;
  ctx.player.critChance = metaCrit;

  // Apply character passive (pure calc extracted to core/CharacterPassiveCalc)
  if (charDef) {
    const stats = {
      attackSpeedMultiplier: ctx.player.attackSpeedMultiplier,
      critChance: ctx.player.critChance,
      damageMultiplier: ctx.player.damageMultiplier,
      baseHp: ctx.runState.baseHp,
      baseMaxHp: ctx.runState.baseMaxHp,
    };
    applyCharacterPassive(stats, charDef.passive);
    ctx.player.attackSpeedMultiplier = stats.attackSpeedMultiplier;
    ctx.player.critChance = stats.critChance;
    ctx.player.damageMultiplier = stats.damageMultiplier;
    ctx.runState.baseHp = stats.baseHp;
    ctx.runState.baseMaxHp = stats.baseMaxHp;
  }

  // Apply weather crit bonus to player (after character passive)
  ctx.player.critChance += ctx.weatherManager.critBonus;

  // Apply challenge mode modifiers that depend on final HP
  if (ctx.challengeMode && ctx.challengeModifier === 'halfHp') {
    ctx.runState.baseHp = Math.ceil(ctx.runState.baseHp / 2);
    ctx.runState.baseMaxHp = ctx.runState.baseHp;
  }

  // Sync leader stats to support squad members
  ctx.squadManager.syncUpgrades();
}

export function createSpawnAndAria(ctx: RunSceneCtx): void {
  ctx.spawnManager = new SpawnManager({
    onBossSpawn: () => {
      getRetroAudio().switchTrack('boss');
      getAudioManager().playBGM('bgm_boss');
      getAudioManager().playSFX('sfx_warning');
      ctx.ariaMsg.show(t(getAriaDialogueKey('boss_warning', ctx.runState.stage)));
      ctx.vfx.screenShake(BALANCE.BOSS_SPAWN_VFX.shakeIntensity, BALANCE.BOSS_SPAWN_VFX.shakeDurationMs);
      ctx.vfx.cameraZoomPunch(BALANCE.BOSS_SPAWN_VFX.zoomIn, BALANCE.BOSS_SPAWN_VFX.zoomDurationMs);
      getRetroSFX().bossEntrance();
    },
  });
  if (ctx.challengeMode && ctx.challengeModifier) {
    ctx.spawnManager.setChallengeModifier(
      ctx.challengeModifier as import('../managers/SpawnManager').ChallengeModifier,
    );
  }
  ctx.spawnManager.create(ctx.rng);
  ctx.xpTable = new XpTable(BALANCE.XP.basePerLevel, BALANCE.XP.growthFactor);
  ctx.ariaMsg = new ARIAMessage(ctx as Phaser.Scene);
  ctx.ariaState = {
    bossShown: false,
    bossWarningShown: false,
    lowHpShown: false,
    cooldown: new AriaCooldownTracker(),
    stageEntryShown: false,
    districtChangeShown: false,
    prevDistrict: getDistrictForStage(1)?.id ?? '',
    seenStoryBeats: new Set<string>(),
  };
  ctx.midShopShown = false;
  if (ctx.challengeMode && ctx.challengeModifier === 'noShop') {
    ctx.midShopShown = true;
  }
  ctx.pendingStageClear = false;
  ctx.activeBoss = null;
}

export function createInputAndUI(ctx: RunSceneCtx, isTutorialRun: boolean): void {
  const scene = ctx as Phaser.Scene;
  scene.input.on('pointerdown', ctx.onPointerDown, ctx);
  ctx.hudManager = new HUDManager(scene, {
    togglePause: () => ctx.togglePause(),
    cycleSpeed: () => ctx.cycleSpeed(),
    showWeaponRange: (idx) =>
      ctx.hudManager.showWeaponRange(
        idx,
        ctx.player?.x ?? GAME_WIDTH / 2,
        ctx.player?.y ?? GAME_HEIGHT - 120,
        ctx.weapons,
      ),
    hideWeaponRange: () => ctx.hudManager.hideWeaponRange(ctx.weapons),
  });
  ctx.hudManager.create();
  ctx.pauseOverlay = new PauseOverlay(scene, {
    onResume: () => {
      ctx.phaseManager.transition('playing');
      scene.physics.resume();
    },
    onMenu: () => {
      ctx.pauseOverlay.destroy();
      navigateScene(scene, 'RunScene', 'MainMenuScene');
    },
  });
  if (isTutorialRun) {
    ctx.tutorialOverlay = new TutorialOverlay(scene);
  } else {
    ctx.tutorialOverlay = undefined;
  }
}

export function createCombatEventManager(ctx: RunSceneCtx): void {
  ctx.combatEventManager = new CombatEventManager(ctx as Phaser.Scene, {
    getRunState: () => ctx.runState,
    getPlayer: () => ctx.player,
    getPhaseManager: () => ctx.phaseManager,
    getProgressionManager: () => ctx.progressionManager,
    getPassiveManager: () => ctx.passiveManager,
    getCollisionManager: () => ctx.collisionManager,
    getSpawnManager: () => ctx.spawnManager,
    getWeatherManager: () => ctx.weatherManager,
    getBackgroundManager: () => ctx.backgroundManager,
    getCritterManager: () => ctx.critterManager,
    getBarrierSystem: () => ctx.barrierSystem,
    getVfx: () => ctx.vfx,
    getDmgNumbers: () => ctx.dmgNumbers,
    getAriaMsg: () => ctx.ariaMsg,
    getAnalyticsTracker: () => ctx.analyticsTracker,
    getEnemyGroup: () => ctx.enemyGroup,
    getActiveEnemies: () => ctx.activeEnemies,
    getActiveEnemyCount: () => ctx.activeEnemyCount,
    getMetaXpBonus: () => ctx.metaXpBonus,
    getBaseArmorMultiplier: () => ctx.baseArmorMultiplier,
    getShopArmorMultiplier: () => ctx.shopArmorMultiplier,
    getPassiveCounts: () => ctx.passiveCounts,
    getStageHpMult: () => ctx.stageHpMult,
    getStageSpeedMult: () => ctx.stageSpeedMult,
    getStageDamageMult: () => ctx.stageDamageMult,
    getPendingStageClear: () => ctx.pendingStageClear,
    setPendingStageClear: (v) => {
      ctx.pendingStageClear = v;
    },
    getBossKillCount: () => ctx.bossKillCount,
    setBossKillCount: (v) => {
      ctx.bossKillCount = v;
    },
    setBaseArmorMultiplier: (v) => {
      ctx.baseArmorMultiplier = v;
    },
    getXpTableRequired: (level) => ctx.xpTable.required(level),
    playSfx: (key, fn, cd) => ctx.playSfx(key, fn, cd),
    triggerStoryBeat: (trigger) => ctx.triggerStoryBeat(trigger),
    checkRuntimeAriaEvent: (event) => ctx.checkRuntimeAriaEvent(event),
  });
}

export function createCollisionManager(ctx: RunSceneCtx): void {
  ctx.collisionManager = new CollisionManager({
    onEnemyDeath: (enemy: Enemy) => ctx.onEnemyDeath(enemy),
    onBaseDamage: (damage: number, _x: number) => {
      ctx.barrierSystem.takeDamage(damage);
      ctx.runState.baseHp = Math.max(0, ctx.runState.baseHp - damage);
      ctx.backgroundManager.flashBaseWall();
      ctx.vfx.screenShake(
        BALANCE.BASE_DAMAGE_VFX.collisionShakeIntensity,
        BALANCE.BASE_DAMAGE_VFX.collisionShakeDurationMs,
      );
      if (ctx.barrierSystem.isDestroyed() || ctx.runState.baseHp <= 0) {
        ctx.progressionManager.onRunComplete(false);
      }
    },
    playSfx: (key, fn, cd) => ctx.playSfx(key, fn, cd),
    onProjectileHit: (proj: Projectile, enemy: Enemy, finalDamage: number) => {
      // Track damage stats
      ctx.runState.totalDamageDealt += finalDamage;
      ctx.runState.totalHitsLanded++;
      ctx.runState.weaponDamageMap[proj.weaponId] = (ctx.runState.weaponDamageMap[proj.weaponId] ?? 0) + finalDamage;
      if (proj.isCrit) ctx.runState.critHitsLanded++;
      ctx.runState.highestSingleHit = Math.max(ctx.runState.highestSingleHit, finalDamage);
      // Passive effects
      ctx.passiveManager.onProjectileHit(
        proj,
        enemy,
        finalDamage,
        ctx.passiveCounts,
        ctx.activeEnemies,
        ctx.activeEnemyCount,
        ctx.player,
        ctx.vfx,
        ctx.dmgNumbers,
      );
    },
  });
  // Clean up enemy projectiles from previous run
  ctx.collisionManager.clearEnemyProjectiles();
}

export function createUltimateManager(ctx: RunSceneCtx): void {
  ctx.ultimateManager = new UltimateManager(ctx as Phaser.Scene, {
    getActiveEnemies: () => ctx.activeEnemies,
    getActiveEnemyCount: () => ctx.activeEnemyCount,
    getEnemyGroup: () => ctx.enemyGroup,
    onEnemyDeath: (enemy: Enemy) => ctx.onEnemyDeath(enemy),
    getBaseArmorMultiplier: () => ctx.baseArmorMultiplier,
    setBaseArmorMultiplier: (v: number) => {
      ctx.baseArmorMultiplier = v;
    },
    getGameSpeed: () => ctx.gameSpeed,
  });
  ctx.ultimateManager.reset();
}

export function createShopManager(ctx: RunSceneCtx): void {
  ctx.shopManager = new ShopManager(ctx as Phaser.Scene, {
    getPassiveArmorLevel: () => ctx.passiveCounts.get('base_armor') ?? 0,
    getShopArmorMultiplier: () => ctx.shopArmorMultiplier,
    setShopArmorMultiplier: (v: number) => {
      ctx.shopArmorMultiplier = v;
    },
    setBaseArmorMultiplier: (v: number) => {
      ctx.baseArmorMultiplier = v;
    },
  });
}

export function createProgressionManager(ctx: RunSceneCtx): void {
  ctx.progressionManager = new ProgressionManager(ctx as Phaser.Scene, {
    getRunState: () => ctx.runState,
    getWeapons: () => ctx.weapons,
    setWeapons: (w) => {
      ctx.weapons = w;
    },
    getPassiveCounts: () => ctx.passiveCounts,
    getPhaseManager: () => ctx.phaseManager,
    getSpawnManager: () => ctx.spawnManager,
    getWeatherManager: () => ctx.weatherManager,
    getHUDManager: () => ctx.hudManager,
    getCollisionManager: () => ctx.collisionManager,
    getAriaMsg: () => ctx.ariaMsg,
    getPlayer: () => ctx.player,
    getRng: () => ctx.rng,
    getXpTable: () => ctx.xpTable,
    getEnemyGroup: () => ctx.enemyGroup,
    getProjectileGroup: () => ctx.projectileGroup,
    cleanupShop: () => {
      ctx.shopManager.shopAutoBestAction = undefined;
      ctx.shopManager.shopAutoBarFill = undefined;
      ctx.shopManager.shopContainer?.destroy();
      ctx.shopManager.shopContainer = undefined;
    },
    getBossKillCount: () => ctx.bossKillCount,
    getChallengeMode: () => ctx.challengeMode,
    trackGameOver: (survived, kills, stage) => ctx.analyticsTracker.trackGameOver(survived, kills, stage),
    disableInput: () => (ctx as Phaser.Scene).input.off('pointerdown', ctx.onPointerDown, ctx),
    clearActiveBoss: () => {
      ctx.activeBoss = null;
    },
    getMetaDamageBase: () => ctx.metaDamageBase,
    getMetaCritBase: () => ctx.metaCritBase,
    getMetaLuck: () => ctx.metaLuck,
    getBaseArmorMultiplier: () => ctx.baseArmorMultiplier,
    setBaseArmorMultiplier: (v) => {
      ctx.baseArmorMultiplier = v;
    },
    getShopArmorMultiplier: () => ctx.shopArmorMultiplier,
    getStageHpMult: () => ctx.stageHpMult,
    getStageSpeedMult: () => ctx.stageSpeedMult,
    getStageDamageMult: () => ctx.stageDamageMult,
    setStageHpMult: (v) => {
      ctx.stageHpMult = v;
    },
    setStageSpeedMult: (v) => {
      ctx.stageSpeedMult = v;
    },
    setStageDamageMult: (v) => {
      ctx.stageDamageMult = v;
    },
    getCharacterId: () => ctx.runState.characterId,
    updateBackground: () => ctx.backgroundManager.updateBackground(ctx.runState.stage),
    getPendingStageClear: () => ctx.pendingStageClear,
    setPendingStageClear: (v) => {
      ctx.pendingStageClear = v;
    },
    setAriaBossShown: (v) => {
      ctx.ariaState.bossShown = v;
    },
    setAriaBossWarningShown: (v) => {
      ctx.ariaState.bossWarningShown = v;
    },
    setAriaLowHpShown: (v) => {
      ctx.ariaState.lowHpShown = v;
    },
    setMidShopShown: (v) => {
      ctx.midShopShown = v;
    },
    setActiveBoss: (v) => {
      ctx.activeBoss = v;
    },
    getVfx: () => ctx.vfx,
    onUpgradeApplied: () => ctx.squadManager.syncUpgrades(),
    checkRuntimeAriaEvent: (event) => ctx.checkRuntimeAriaEvent(event),
  });
}
