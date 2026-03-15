import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { WEAPON_DEFS } from '../config/weapons';
import { PASSIVE_DEFS } from '../config/upgrades';
import { getDistrictForStage } from '../config/districts';
import { selectUpgrades, type UpgradeChoice, type EvolutionRecipe } from '../core/UpgradeSelector';
import {
  calculateStageDifficultyMultipliers,
  applyPassiveStatEffect,
  calculateCompositeCritChance,
  calculateStageClearHeal,
} from '../core/DifficultyScaling';
import type { PhaseManager } from './PhaseManager';
import type { SpawnManager } from './SpawnManager';
import type { WeatherManager } from './WeatherManager';
import type { HUDManager } from './HUDManager';
import type { CollisionManager } from './CollisionManager';
import type { ARIAMessage } from '../ui/ARIAMessage';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';
import type { Projectile } from '../objects/Projectile';
import type { SeededRandom } from '../core/SeededRandom';
import type { XpTable } from '../core/XpTable';
import type { WeaponInstance } from '../types/weapon';
import type { RunState } from '../types/game';
import { SaveManager } from '../managers/SaveManager';
import { getRetroSFX } from '../audio/RetroSFX';
import { getRetroAudio } from '../audio/RetroAudio';
import { getAudioManager } from '../audio/AudioManager';
import { trackEvent } from '../lib/analytics';
import { t } from '../lib/i18n';
import { getAriaDialogueKey } from '../core/AriaDialogueCalc';
import { LevelUpUIManager } from './LevelUpUIManager';
import { navigateScene } from '../utils/SceneNav';
import { buildStageClearContainer } from './progression/StageClearUI';

export interface ProgressionCallbacks {
  /** Get current run state (mutable reference). */
  getRunState: () => RunState;
  /** Get mutable weapons array. */
  getWeapons: () => WeaponInstance[];
  /** Set weapons array (for evolution that replaces entries). */
  setWeapons: (weapons: WeaponInstance[]) => void;
  /** Get passive counts map. */
  getPassiveCounts: () => Map<string, number>;
  /** Get phase manager reference. */
  getPhaseManager: () => PhaseManager;
  /** Get spawn manager reference. */
  getSpawnManager: () => SpawnManager;
  /** Get weather manager reference. */
  getWeatherManager: () => WeatherManager;
  /** Get HUD manager reference. */
  getHUDManager: () => HUDManager;
  /** Get collision manager reference. */
  getCollisionManager: () => CollisionManager;
  /** Get ARIA message system. */
  getAriaMsg: () => ARIAMessage;
  /** Get player reference. */
  getPlayer: () => Player;
  /** Get RNG. */
  getRng: () => SeededRandom;
  /** Get XP table. */
  getXpTable: () => XpTable;
  /** Get enemy group. */
  getEnemyGroup: () => Phaser.Physics.Arcade.Group;
  /** Get projectile group. */
  getProjectileGroup: () => Phaser.Physics.Arcade.Group;
  /** Called to clean up shop on game over. */
  cleanupShop: () => void;
  /** Get boss kill count. */
  getBossKillCount: () => number;
  /** Get challenge mode state. */
  getChallengeMode: () => boolean;
  /** Get analytics tracker. */
  trackGameOver: (survived: boolean, kills: number, stage: number) => void;
  /** Disable pointer input. */
  disableInput: () => void;
  /** Set active boss to null. */
  clearActiveBoss: () => void;
  /** Get meta progression values. */
  getMetaDamageBase: () => number;
  getMetaCritBase: () => number;
  getMetaLuck: () => number;
  /** Get/set base armor multiplier. */
  getBaseArmorMultiplier: () => number;
  setBaseArmorMultiplier: (v: number) => void;
  /** Get shop armor multiplier. */
  getShopArmorMultiplier: () => number;
  /** Get/set stage difficulty multipliers. */
  getStageHpMult: () => number;
  getStageSpeedMult: () => number;
  getStageDamageMult: () => number;
  setStageHpMult: (v: number) => void;
  setStageSpeedMult: (v: number) => void;
  setStageDamageMult: (v: number) => void;
  /** Get character ID. */
  getCharacterId: () => string;
  /** Update background for new stage. */
  updateBackground: () => void;
  /** Get/set pending stage clear flag. */
  getPendingStageClear: () => boolean;
  setPendingStageClear: (v: boolean) => void;
  /** Get/set ARIA trigger flags. */
  setAriaBossShown: (v: boolean) => void;
  setAriaBossWarningShown: (v: boolean) => void;
  setAriaLowHpShown: (v: boolean) => void;
  /** Get/set mid shop shown. */
  setMidShopShown: (v: boolean) => void;
  /** Get/set active boss. */
  setActiveBoss: (v: Enemy | null) => void;
  /** Get VFX manager for screen effects. */
  getVfx: () => {
    screenShake: (intensity: number, duration: number) => void;
    cameraZoomPunch: (targetZoom: number, durationMs: number) => void;
    cameraSustainedZoom: (targetZoom: number, durationMs: number) => void;
  };
  /** Called after an upgrade is applied (for squad sync). */
  onUpgradeApplied?: () => void;
  /** SPEC-026: Runtime ARIA event trigger. */
  checkRuntimeAriaEvent: (
    event: 'first_boss_kill' | 'player_death' | 'kill_milestone' | 'gold_milestone' | 'district_change',
  ) => void;
}

/**
 * Manages level-up flow and stage progression (clear -> next stage).
 * Delegates level-up card UI to LevelUpUIManager (TASK-078).
 */
export class ProgressionManager {
  private scene: Phaser.Scene;
  private callbacks: ProgressionCallbacks;
  private levelUpUI: LevelUpUIManager;

  // Stage clear UI
  private stageClearContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, callbacks: ProgressionCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.levelUpUI = new LevelUpUIManager(scene, {
      onUpgradeSelected: (choice) => this.applyUpgrade(choice),
      onSkipSelected: () => this.skipUpgrade(),
    });
  }

  // ============================
  // Public API for RunScene
  // ============================

  /** Update auto-select bar animation during levelup. Call in RunScene.update(). */
  updateAutoSelect(): void {
    this.levelUpUI.updateAutoSelect();
  }

  /** Show level up UI. Called from RunScene when XP threshold crossed. */
  showLevelUpUI(): void {
    const phaseManager = this.callbacks.getPhaseManager();
    phaseManager.transition('levelup');
    this.scene.physics.pause();
    getRetroSFX().levelUp();
    getAudioManager().playSFX('sfx_levelup');

    const runState = this.callbacks.getRunState();
    const weapons = this.callbacks.getWeapons();
    const rng = this.callbacks.getRng();

    // Build T2 evolution recipes from WEAPON_DEFS
    const evoRecipes: EvolutionRecipe[] = Object.values(WEAPON_DEFS)
      .filter((def) => def.tier === 2 && def.recipe)
      .map((def) => ({
        id: def.id,
        name: def.name,
        primary: def.recipe!.primary,
        primaryLevel: def.recipe!.primaryLevel,
        secondary: def.recipe!.secondary,
        secondaryLevel: def.recipe!.secondaryLevel,
      }));

    const choices = selectUpgrades(
      weapons.map((w) => ({
        id: w.defId,
        level: w.level,
        maxLevel: WEAPON_DEFS[w.defId]?.maxLevel ?? 5,
      })),
      this.getPassiveLevels(),
      Object.keys(WEAPON_DEFS),
      Object.keys(PASSIVE_DEFS),
      Object.fromEntries(Object.entries(WEAPON_DEFS).map(([k, v]) => [k, v.name])),
      Object.fromEntries(
        Object.entries(PASSIVE_DEFS).map(([k, v]) => [
          k,
          {
            name: v.name,
            description: v.description,
            characterId: v.characterId,
          },
        ]),
      ),
      3,
      BALANCE.RUN.maxWeapons,
      rng,
      runState.characterId,
      evoRecipes,
      this.callbacks.getMetaLuck(),
    );

    if (choices.length === 0) {
      if (this.callbacks.getPendingStageClear()) {
        this.callbacks.setPendingStageClear(false);
        phaseManager.transition('playing');
        this.scene.time.delayedCall(300, () => {
          if (phaseManager.current === 'gameover') return;
          const rs = this.callbacks.getRunState();
          if (rs.stage < BALANCE.STAGE.maxStages) {
            this.showStageClear();
          } else {
            this.onRunComplete(true);
          }
        });
        return;
      }
      phaseManager.transition('playing');
      this.scene.physics.resume();
      return;
    }
    this.levelUpUI.showChoices(choices);
  }

  /** Show stage clear overlay. */
  showStageClear(): void {
    const phaseManager = this.callbacks.getPhaseManager();
    if (phaseManager.isAny('stage_clear', 'levelup', 'gameover')) return;
    phaseManager.transition('stage_clear');
    this.scene.physics.pause();
    getRetroSFX().stageClear();

    const runState = this.callbacks.getRunState();
    const spawnManager = this.callbacks.getSpawnManager();

    trackEvent('stage_clear', {
      stage: runState.stage,
      timeMs: runState.runTime,
      kills: runState.kills,
      weaponCount: this.callbacks.getWeapons().length,
    });

    // ARIA stage clear dialogue (TASK-125)
    const ariaMsg = this.callbacks.getAriaMsg();
    ariaMsg.show(t(getAriaDialogueKey('stage_clear', runState.stage)));

    // White screen flash + zoom punch for stage clear fanfare
    this.scene.cameras.main.flash(200, 255, 255, 255);
    this.callbacks.getVfx().screenShake(0.004, 150);
    this.callbacks.getVfx().cameraZoomPunch(BALANCE.CAMERA_FX.stageClearZoom, BALANCE.CAMERA_FX.stageClearZoomMs);

    this.stageClearContainer = buildStageClearContainer(this.scene, runState, spawnManager.isBossStage, () =>
      this.nextStage(),
    );
  }

  /** Handle run completion (victory or defeat). */
  onRunComplete(survived: boolean): void {
    const phaseManager = this.callbacks.getPhaseManager();
    if (phaseManager.current === 'gameover') return;
    if (!phaseManager.transition('gameover')) return;
    this.scene.physics.pause();
    this.callbacks.disableInput();

    const runState = this.callbacks.getRunState();

    if (!survived) {
      trackEvent('stage_fail', {
        stage: runState.stage,
        timeMs: runState.runTime,
        kills: runState.kills,
        deathCause: 'base_destroyed',
      });
      // SPEC-026: Player death runtime ARIA event
      this.callbacks.checkRuntimeAriaEvent('player_death');
    }
    this.callbacks.trackGameOver(survived, runState.kills, runState.stage);

    this.destroyUI();
    this.callbacks.cleanupShop();
    this.callbacks.clearActiveBoss();

    if (survived) {
      getRetroSFX().levelClear();
    } else {
      getRetroSFX().gameOver();
    }

    const weapons = this.callbacks.getWeapons();
    const weaponsUsed = weapons.length;
    const highestWeaponLevel = weapons.reduce((max, w) => Math.max(max, w.level), 0);

    const vfx = this.callbacks.getVfx();
    if (!survived) {
      vfx.cameraSustainedZoom(BALANCE.CAMERA_FX.gameOverZoom, BALANCE.CAMERA_FX.gameOverZoomMs);
    }
    this.scene.cameras.main.fadeOut(BALANCE.CAMERA_FX.sceneTransitionFadeMs);
    this.scene.time.delayedCall(BALANCE.CAMERA_FX.sceneTransitionFadeMs + 50, () => {
      navigateScene(this.scene, 'RunScene', 'GameOverScene', {
        survived,
        kills: runState.kills,
        gold: runState.gold,
        level: runState.playerLevel,
        timeMs: runState.runTime,
        baseHpRemaining: runState.baseHp,
        stage: runState.stage,
        maxStages: BALANCE.STAGE.maxStages,
        characterId: runState.characterId,
        weaponsUsed,
        highestWeaponLevel,
        bossKills: this.callbacks.getBossKillCount(),
        challengeMode: this.callbacks.getChallengeMode(),
        totalDamageDealt: runState.totalDamageDealt,
        weaponDamageMap: runState.weaponDamageMap,
        critHitsLanded: runState.critHitsLanded,
        totalHitsLanded: runState.totalHitsLanded,
        highestSingleHit: runState.highestSingleHit,
      });
    });
  }

  /** Clean up UI containers on shutdown/gameover. */
  destroyUI(): void {
    this.levelUpUI.destroyUI();
    this.stageClearContainer?.destroy();
    this.stageClearContainer = undefined;
  }

  /** Check if auto-select bar fill exists (for RunScene gameover cleanup). */
  get hasAutoSelectBarFill(): boolean {
    return this.levelUpUI.hasAutoSelectBarFill;
  }

  // ============================
  // Level Up internals
  // ============================

  private getPassiveLevels(): { id: string; level: number; maxLevel: number }[] {
    const passiveCounts = this.callbacks.getPassiveCounts();
    return Array.from(passiveCounts.entries()).map(([id, level]) => ({
      id,
      level,
      maxLevel: PASSIVE_DEFS[id]?.maxLevel ?? 5,
    }));
  }

  private skipUpgrade(): void {
    this.levelUpUI.destroyUI();

    getRetroSFX().tap();
    const phaseManager = this.callbacks.getPhaseManager();

    if (this.callbacks.getPendingStageClear()) {
      this.callbacks.setPendingStageClear(false);
      phaseManager.transition('playing');
      this.scene.time.delayedCall(300, () => {
        if (phaseManager.current === 'gameover') return;
        const rs = this.callbacks.getRunState();
        if (rs.stage < BALANCE.STAGE.maxStages) {
          this.showStageClear();
        } else {
          this.onRunComplete(true);
        }
      });
      return;
    }

    phaseManager.transition('playing');
    this.scene.physics.resume();
  }

  applyUpgrade(choice: UpgradeChoice): void {
    const runState = this.callbacks.getRunState();
    const phaseManager = this.callbacks.getPhaseManager();
    const xpTable = this.callbacks.getXpTable();
    let weapons = this.callbacks.getWeapons();
    const passiveCounts = this.callbacks.getPassiveCounts();

    trackEvent('level_up', {
      level: runState.playerLevel,
      chosenUpgrade: `${choice.type}:${choice.id}`,
    });

    if (choice.type === 'evolution' && choice.recipe) {
      const { primary, secondary } = choice.recipe;
      weapons = weapons.filter((w) => w.defId !== primary && w.defId !== secondary);
      runState.weapons = runState.weapons.filter((id) => id !== primary && id !== secondary);
      weapons.push({ defId: choice.id, level: 1, cooldownRemaining: 0 });
      runState.weapons.push(choice.id);
      this.callbacks.setWeapons(weapons);
      SaveManager.discoverWeapon(choice.id);
      trackEvent('weapon_evolved', { weaponId: choice.id, from: `${primary}+${secondary}` });
      this.callbacks.getVfx().screenShake(0.01, 300);
      getRetroSFX().levelClear();
    } else if (choice.type === 'weapon') {
      const existing = weapons.find((w) => w.defId === choice.id);
      if (existing) {
        existing.level = choice.level;
      } else {
        weapons.push({ defId: choice.id, level: 1, cooldownRemaining: 0 });
        runState.weapons.push(choice.id);
        trackEvent('weapon_acquired', { weaponId: choice.id, slot: weapons.length });
      }
      SaveManager.discoverWeapon(choice.id);
    } else if (choice.type === 'passive') {
      runState.passives.push(choice.id);
      const prev = passiveCounts.get(choice.id) ?? 0;
      passiveCounts.set(choice.id, prev + 1);
      this.applyPassiveEffect(choice.id);
    }

    this.levelUpUI.destroyUI();
    getRetroSFX().tap();

    // Sync upgrade stats to squad members
    this.callbacks.onUpgradeApplied?.();

    // Check for more pending level-ups
    if (runState.playerXp >= xpTable.required(runState.playerLevel)) {
      runState.playerXp -= xpTable.required(runState.playerLevel);
      runState.playerLevel++;
      this.showLevelUpUI();
      return;
    }

    // All level-ups resolved — notify tutorial that player completed skill selection.
    // All level-ups resolved. Check pending stage clear (M-014 fix).
    if (this.callbacks.getPendingStageClear()) {
      this.callbacks.setPendingStageClear(false);
      phaseManager.transition('playing');
      this.scene.time.delayedCall(300, () => {
        if (phaseManager.current === 'gameover') return;
        const rs = this.callbacks.getRunState();
        if (rs.stage < BALANCE.STAGE.maxStages) {
          this.showStageClear();
        } else {
          this.onRunComplete(true);
        }
      });
      return;
    }

    this.scene.physics.resume();
    phaseManager.transition('playing');
  }

  applyPassiveEffect(passiveId: string): void {
    const def = PASSIVE_DEFS[passiveId];
    if (!def) return;
    const passiveCounts = this.callbacks.getPassiveCounts();
    const player = this.callbacks.getPlayer();
    const level = passiveCounts.get(passiveId) ?? 0;

    const currentStats = {
      attackSpeedMultiplier: player.attackSpeedMultiplier,
      damageMultiplier: player.damageMultiplier,
      baseArmorMultiplier: this.callbacks.getBaseArmorMultiplier(),
      critChance: player.critChance,
      critDamage: player.critDamage,
    };

    const updated = applyPassiveStatEffect(
      def.effect,
      level,
      currentStats,
      { valuePerLevel: def.valuePerLevel },
      this.callbacks.getMetaDamageBase(),
      this.callbacks.getMetaCritBase(),
      this.callbacks.getWeatherManager().critBonus,
      this.callbacks.getShopArmorMultiplier(),
      BALANCE.COMBAT.critMultiplier,
    );

    player.attackSpeedMultiplier = updated.attackSpeedMultiplier;
    player.damageMultiplier = updated.damageMultiplier;
    this.callbacks.setBaseArmorMultiplier(updated.baseArmorMultiplier);
    player.critChance = updated.critChance;
    player.critDamage = updated.critDamage;
  }

  // ============================
  // Stage Clear / Next Stage
  // ============================

  private nextStage(): void {
    this.stageClearContainer?.destroy();
    this.stageClearContainer = undefined;

    const runState = this.callbacks.getRunState();
    const spawnManager = this.callbacks.getSpawnManager();
    const weatherManager = this.callbacks.getWeatherManager();
    const hudManager = this.callbacks.getHUDManager();
    const collisionManager = this.callbacks.getCollisionManager();
    const phaseManager = this.callbacks.getPhaseManager();
    const player = this.callbacks.getPlayer();
    const ariaMsg = this.callbacks.getAriaMsg();
    const passiveCounts = this.callbacks.getPassiveCounts();
    const enemyGroup = this.callbacks.getEnemyGroup();
    const projectileGroup = this.callbacks.getProjectileGroup();

    runState.stage++;
    runState.stageTime = 0;

    spawnManager.resetForStage(runState.stage);

    const diff = BALANCE.STAGE.difficultyPerStage;
    const diffMults = calculateStageDifficultyMultipliers(runState.stage, {
      hpMult: diff.hpMult,
      speedMult: diff.speedMult,
      damageMult: diff.damageMult,
    });
    this.callbacks.setStageHpMult(diffMults.hpMult);
    this.callbacks.setStageSpeedMult(diffMults.speedMult);
    this.callbacks.setStageDamageMult(diffMults.damageMult);

    runState.baseHp = calculateStageClearHeal(runState.baseHp, runState.baseMaxHp, BALANCE.STAGE.clearHealPercent);

    if (!spawnManager.isBossStage) {
      getRetroAudio().switchTrack('combat');
      getAudioManager().playBGM('bgm_battle');
    }

    this.callbacks.updateBackground();
    weatherManager.apply(runState.stage);

    // Recalculate player crit chance with new weather bonus
    const critLevel = passiveCounts.get('crit_chance') ?? 0;
    const critValuePerLevel = PASSIVE_DEFS['crit_chance']?.valuePerLevel ?? 0;
    player.critChance = calculateCompositeCritChance(
      this.callbacks.getMetaCritBase(),
      critLevel,
      critValuePerLevel,
      weatherManager.critBonus,
    );

    this.callbacks.setPendingStageClear(false);
    this.callbacks.setAriaBossShown(false);
    this.callbacks.setAriaBossWarningShown(false);
    this.callbacks.setAriaLowHpShown(false);
    this.callbacks.setMidShopShown(false);
    this.callbacks.setActiveBoss(null);

    // Deactivate remaining enemies
    const enemyChildren = enemyGroup.getChildren();
    for (let i = 0; i < enemyChildren.length; i++) {
      const enemy = enemyChildren[i] as Enemy;
      if (enemy.active) enemy.deactivate();
    }

    // Deactivate remaining projectiles
    const projChildren = projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (proj.active) proj.deactivate();
    }

    collisionManager.clearEnemyProjectiles();
    hudManager.resetDirtyFlags();

    this.scene.physics.resume();
    phaseManager.transition('playing');

    // ARIA chapter-specific stage entry + district change (TASK-125)
    const prevDistrict = getDistrictForStage(runState.stage - 1);
    const curDistrict = getDistrictForStage(runState.stage);
    if (prevDistrict && curDistrict && prevDistrict.id !== curDistrict.id) {
      // New district — show district_change dialogue
      ariaMsg.show(t(getAriaDialogueKey('district_change', runState.stage)));
      // SPEC-026: District change runtime ARIA event
      this.callbacks.checkRuntimeAriaEvent('district_change');
    } else {
      // Same district — show stage_entry dialogue
      ariaMsg.show(t(getAriaDialogueKey('stage_entry', runState.stage)));
    }
  }
}
