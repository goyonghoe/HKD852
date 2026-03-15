import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { NEON, BG_COLOR } from '../config/colors';
import { getDistrictForStage } from '../config/districts';
import { PASSIVE_DEFS } from '../config/upgrades';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XpTable } from '../core/XpTable';
import { SpawnManager } from '../managers/SpawnManager';
import { SpatialHash } from '../core/SpatialHash';
import { SeededRandom } from '../core/SeededRandom';
import type { WeaponInstance } from '../types/weapon';
import type { RunState } from '../types/game';
import { VFXManager } from '../utils/VFXManager';
import { DamageNumberManager } from '../ui/DamageNumber';
import { ARIAMessage } from '../ui/ARIAMessage';
import { SaveManager } from '../managers/SaveManager';
import { getMetaBonus } from '../core/MetaProgression';
import { PauseOverlay } from '../ui/PauseOverlay';
import { getRetroSFX } from '../audio/RetroSFX';
import { getRetroAudio } from '../audio/RetroAudio';
import { getAudioManager } from '../audio/AudioManager';
import { getWeaponSfxMethod } from '../audio/weaponSfxRouting';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { CHARACTERS } from '../config/characters';
import { BarrierSystem } from '../core/BarrierSystem';
import { CritterManager } from '../managers/CritterManager';
import { AnalyticsTracker } from '../utils/AnalyticsTracker';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import {
  AriaCooldownTracker,
  getAriaDialogueKey,
  getStoryBeat,
  getRuntimeDialogue,
  getRuntimeLocaleKey,
  createRuntimeEventState,
  type RuntimeEventState,
} from '../core/AriaDialogueCalc';
import { t } from '../lib/i18n';

// Managers
import { PhaseManager } from '../managers/PhaseManager';
import { HUDManager } from '../managers/HUDManager';
import { ShopManager } from '../managers/ShopManager';
import { UltimateManager } from '../managers/UltimateManager';
import { WeatherManager } from '../managers/WeatherManager';
import { CollisionManager } from '../managers/CollisionManager';
import { ProgressionManager } from '../managers/ProgressionManager';
import { SquadManager } from '../managers/SquadManager';
import { PassiveManager } from '../managers/PassiveManager';
import { BackgroundManager } from '../managers/BackgroundManager';
import { CombatEventManager } from '../managers/CombatEventManager';

// Extracted create() helpers (RunSceneInit.ts)
import {
  initRunState,
  createSquadAndPlayer,
  createSpawnAndAria,
  createInputAndUI,
  createCombatEventManager,
  createCollisionManager,
  createUltimateManager,
  createShopManager,
  createProgressionManager,
  type RunSceneCtx,
} from './RunSceneInit';

export class RunScene extends Phaser.Scene {
  // Managers (internal — accessed by RunSceneInit factories)
  phaseManager!: PhaseManager;
  hudManager!: HUDManager;
  shopManager!: ShopManager;
  ultimateManager!: UltimateManager;
  weatherManager!: WeatherManager;
  collisionManager!: CollisionManager;
  progressionManager!: ProgressionManager;
  squadManager!: SquadManager;
  passiveManager!: PassiveManager;
  backgroundManager!: BackgroundManager;
  combatEventManager!: CombatEventManager;

  // Systems (internal — accessed by RunSceneInit factories)
  weaponSystem!: WeaponSystem;
  spawnManager!: SpawnManager;
  rng!: SeededRandom;
  xpTable!: XpTable;
  vfx!: VFXManager;
  dmgNumbers!: DamageNumberManager;
  ariaMsg!: ARIAMessage;
  analyticsTracker!: AnalyticsTracker;

  // Private systems (not accessed by factories)
  private collisionHash!: SpatialHash;

  // Game objects (internal — accessed by RunSceneInit factories)
  player!: Player;
  public enemyGroup!: Phaser.Physics.Arcade.Group;
  projectileGroup!: Phaser.Physics.Arcade.Group;

  // Barrier system (internal)
  barrierSystem!: BarrierSystem;

  // Cached active lists (rebuilt each frame)
  activeEnemies: Enemy[] = [];
  activeEnemyCount = 0;

  // State (internal — accessed by RunSceneInit factories)
  runState!: RunState;
  weapons: WeaponInstance[] = [];
  passiveCounts = new Map<string, number>();

  // Target point (user tap)
  targetPoint: { x: number; y: number } | null = null;
  private targetReticle!: Phaser.GameObjects.Graphics;
  private targetClearEvent?: Phaser.Time.TimerEvent;

  // Base wall
  baseArmorMultiplier = 1;
  shopArmorMultiplier = 1;

  // Speed control
  gameSpeed = 1;
  speedIndex = 0;

  // ARIA message triggers (consolidated)
  ariaState = {
    bossShown: false,
    bossWarningShown: false,
    lowHpShown: false,
    cooldown: new AriaCooldownTracker(),
    stageEntryShown: false,
    districtChangeShown: false,
    prevDistrict: '',
    seenStoryBeats: new Set<string>(),
  };

  // SPEC-026: Runtime ARIA event tracking (per-run)
  runtimeEventState: RuntimeEventState = createRuntimeEventState();

  // Boss → stage clear sequencing
  pendingStageClear = false;

  // Boss tracking
  activeBoss: Enemy | null = null;
  bossKillCount = 0;

  // Pause
  pauseOverlay!: PauseOverlay;

  // FTUE Tutorial
  tutorialOverlay?: TutorialOverlay;

  // SFX throttle
  sfxThrottles = new Map<string, number>();

  // Mid-run shop
  midShopShown = false;

  // Challenge mode
  challengeMode = false;
  challengeModifier = '';

  // Stage difficulty multipliers
  stageHpMult = 1;
  stageSpeedMult = 1;
  stageDamageMult = 1;
  metaXpBonus = 0;

  // Meta progression base values
  metaDamageBase = 0;
  metaCritBase = 0;
  metaLuck = 0;

  // Weapon fire counter (for aura pulse interval)
  weaponFireCount = 0;

  critterManager!: CritterManager;

  /** Cast this RunScene to RunSceneCtx for factory functions */
  private asCtx(): RunSceneCtx {
    return this as unknown as RunSceneCtx;
  }

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    // === Initialize managers ===
    this.phaseManager = new PhaseManager();
    this.phaseManager.reset();
    this.baseArmorMultiplier = 1;
    this.shopArmorMultiplier = 1;
    this.targetPoint = null;
    this.passiveCounts.clear();
    this.activeEnemies = new Array(BALANCE.SPAWN.maxEnemiesOnScreen);
    this.activeEnemyCount = 0;
    this.sfxThrottles.clear();
    this.bossKillCount = 0;

    // Passive manager
    this.passiveManager = new PassiveManager(this, {
      onEnemyDeath: (enemy: Enemy) => this.combatEventManager.onEnemyDeath(enemy),
      getPhaseManager: () => this.phaseManager,
    });
    this.passiveManager.reset();

    // Reset speed
    this.gameSpeed = 1;
    this.speedIndex = 0;
    this.physics.world.timeScale = 1;
    this.time.timeScale = 1;

    // Fixed world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('combat');
    const am = getAudioManager();
    am.setScene(this);
    am.playBGM('bgm_battle');

    this.backgroundManager = new BackgroundManager(this);
    this.backgroundManager.create();

    // Read character selection + tutorial flag + challenge mode from scene data
    const sceneData = (this.sys.settings.data ?? {}) as {
      characterId?: string;
      tutorial?: boolean;
      challengeMode?: boolean;
      seed?: number;
      weaponId?: string;
      modifier?: string;
    };
    const characterId = sceneData.characterId ?? 'hai';
    const isTutorialRun = sceneData.tutorial === true && !SaveManager.hasActiveRun();
    const charDef = CHARACTERS[characterId];
    const startWeapon = sceneData.weaponId ?? charDef?.startWeapon ?? 'energy_shot';

    // Challenge mode
    this.challengeMode = sceneData.challengeMode === true;
    this.challengeModifier = sceneData.modifier ?? '';

    // Deterministic seed (use challenge seed if provided)
    const seed = sceneData.seed ?? (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    this.rng = new SeededRandom(seed);

    // Run state, barrier, challenge modifiers, analytics
    initRunState(this.asCtx(), characterId, seed, startWeapon);

    // Weather manager (must be after runState init, per M-015)
    this.weatherManager = new WeatherManager(this);
    this.backgroundManager.updateBackground(this.runState.stage);
    this.weatherManager.apply(this.runState.stage);

    // Meta progression
    const meta = SaveManager.loadMeta();
    const metaDmg = getMetaBonus(meta, 'damage');
    const metaHp = getMetaBonus(meta, 'base_hp');
    const metaCrit = getMetaBonus(meta, 'crit_chance');
    this.metaXpBonus = getMetaBonus(meta, 'xp_bonus') + getMetaBonus(meta, 'xp_magnet');
    const metaArmor = getMetaBonus(meta, 'meta_armor');
    this.metaLuck = getMetaBonus(meta, 'rare_drop');
    this.runState.baseHp = Math.ceil(BALANCE.BASE.hp * (1 + metaHp));
    this.runState.baseMaxHp = this.runState.baseHp;
    this.baseArmorMultiplier = Math.max(0.1, 1 - metaArmor);
    this.metaDamageBase = metaDmg;
    this.metaCritBase = metaCrit;

    // Target reticle
    this.targetReticle = this.add.graphics().setDepth(100).setAlpha(0);

    // Collision spatial hash
    this.collisionHash = new SpatialHash(64);

    // Object pools
    this.enemyGroup = this.physics.add.group({
      classType: Enemy,
      maxSize: BALANCE.SPAWN.maxEnemiesOnScreen,
      runChildUpdate: false,
      createCallback: (item) => {
        const e = item as Enemy;
        if (e.body) {
          (e.body as Phaser.Physics.Arcade.Body).setCircle(12);
        }
      },
    });

    this.projectileGroup = this.physics.add.group({
      classType: Projectile,
      maxSize: 200, // increased for 3 squad members firing simultaneously
      runChildUpdate: false,
    });

    // Systems
    this.vfx = new VFXManager(this);
    this.dmgNumbers = new DamageNumberManager(this);

    // Squad system, weapon system, meta bonuses, character passive
    const ctx = this.asCtx();
    createSquadAndPlayer(ctx, characterId, charDef, metaDmg, metaCrit);
    createSpawnAndAria(ctx);

    // Collision manager
    createCollisionManager(ctx);

    // Ultimate manager
    createUltimateManager(ctx);

    // Shop manager
    createShopManager(ctx);

    // Initial weapon
    this.weapons = [{ defId: startWeapon, level: 1, cooldownRemaining: 0 }];

    // Critter companion
    this.critterManager = new CritterManager(this, {
      onEnemyDeath: (enemy) => this.combatEventManager.onEnemyDeath(enemy),
      getActiveEnemies: () => this.activeEnemies,
      getActiveEnemyCount: () => this.activeEnemyCount,
      getRunState: () => this.runState,
      getPlayer: () => this.player,
      getVfx: () => this.vfx,
      getDmgNumbers: () => this.dmgNumbers,
    });
    if (charDef) {
      this.critterManager.create(charDef.element);
    }

    // Input, HUD, pause, tutorial
    createInputAndUI(ctx, isTutorialRun);

    // Wire tutorial overlay to phase transitions and pointer input
    if (this.tutorialOverlay) {
      this.phaseManager.onTransition((_from, to) => {
        this.tutorialOverlay?.onPhaseChange(to);
      });
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (Math.abs(pointer.x - GAME_WIDTH / 2) > 30) {
          this.tutorialOverlay?.onDragHorizontal();
        }
      });
    }

    // Progression manager (level-up UI, stage clear, next stage)
    createProgressionManager(ctx);

    // Combat event manager (M-015: must be after all dependencies)
    createCombatEventManager(ctx);

    getRetroSFX();
    if (this.challengeMode) {
      getRetroSFX().challengeStart();
    }
    this.ariaMsg.show(t(getAriaDialogueKey('stage_entry', this.runState.stage)));

    // Story beat check on stage entry (TASK-017)
    this.triggerStoryBeat('stage_entry');
  }

  update(_time: number, delta: number): void {
    // Auto-select bar animation during levelup
    if (this.phaseManager.current === 'levelup') {
      this.progressionManager.updateAutoSelect();
    }

    // Auto-select bar animation during shop
    if (this.phaseManager.current === 'shop') {
      const result = this.shopManager.updateAutoSelect(this.phaseManager);
      if (result === 'skip') {
        this.closeShop();
      } else if (result) {
        this.shopManager.applyShopChoice(result.action, result.cost, this.runState, this.player, this.ariaMsg);
        this.closeShop();
      }
    }

    this.ariaMsg.update(delta);
    if (this.phaseManager.current !== 'playing') return;

    const scaledDelta = delta * this.gameSpeed;
    this.runState.runTime += scaledDelta;
    this.runState.stageTime += scaledDelta;

    // === PHASE 1: Build active enemy list + spatial hash ===
    this.collisionHash.clear();
    this.activeEnemyCount = 0;
    this.activeBoss = null;
    const children = this.enemyGroup.getChildren();
    for (let i = 0; i < children.length; i++) {
      const enemy = children[i] as Enemy;
      if (!enemy.active) continue;
      this.activeEnemies[this.activeEnemyCount] = enemy;
      this.collisionHash.insert(this.activeEnemyCount, enemy.x, enemy.y);
      this.activeEnemyCount++;
      if (enemy.behavior === 'boss_chase' || enemy.behavior === 'boss_circle' || enemy.behavior === 'boss_burst') {
        this.activeBoss = enemy;
      }
    }

    // === PHASE 2: Player aim (all squad members) ===
    const aimTarget = this.targetPoint ?? this.findNearestEnemyCached();
    if (aimTarget) {
      this.squadManager.aimAt(aimTarget.x, aimTarget.y);
    } else {
      this.squadManager.aimUp();
    }

    // === PHASE 3: Spawn ===
    this.spawnManager.update(
      scaledDelta,
      this.runState.stageTime,
      this.runState.stage,
      this.activeEnemyCount,
      this.enemyGroup,
      this.rng,
      this.stageHpMult,
      this.stageSpeedMult,
      this.stageDamageMult,
    );

    // === PHASE 3b: Mid-run shop trigger ===
    if (
      !this.spawnManager.isBossStage &&
      !this.midShopShown &&
      this.runState.stageTime >= BALANCE.MID_SHOP.triggerTimeMs
    ) {
      this.midShopShown = true;
      this.showMidRunShop();
      return;
    }

    // === PHASE 4: Enemy movement + attack logic (delegated to CombatEventManager) ===
    const px = this.player.x;
    const py = this.player.y;
    const weatherSpeedMod = this.weatherManager.enemySpeedMult * this.weatherManager.speedMult;
    const gw = this.weatherManager.gravityWell;
    const dtSec = scaledDelta / 1000;
    this.combatEventManager.updateEnemies(scaledDelta, px, py, weatherSpeedMod, gw, dtSec);
    if (this.phaseManager.current !== 'playing') return;

    // === PHASE 4b: Enemy projectile update ===
    this.collisionManager.updateEnemyProjectiles(
      scaledDelta,
      this.runState,
      this.baseArmorMultiplier,
      this.vfx,
      this.dmgNumbers,
    );

    // === PHASE 4c: Weather effects ===
    this.weatherManager.update(scaledDelta, this.runState.stage, this.player.x, this.player.y);

    // === PHASE 4d: Weather lightning damage ===
    this.combatEventManager.processWeatherLightning(this.weatherManager.pendingLightningStrikes);
    this.weatherManager.pendingLightningStrikes = [];
    if (this.phaseManager.current !== 'playing') return;

    // === PHASE 5: Weapon auto-fire (all squad members) ===
    const weaponDelta = scaledDelta;
    this.squadManager.updateWeapons(weaponDelta, this.weapons, this.enemyGroup, this.projectileGroup, this.targetPoint);

    // === PHASE 5b: Critter companion ===
    this.critterManager.update(scaledDelta);

    // === PHASE 5d: Ultimate auto-fire ===
    this.ultimateManager.checkAndFire(this.player, this.vfx, this.ariaMsg);

    // === PHASE 6: Collision detection via SpatialHash ===
    this.collisionManager.resolveProjectileCollisions(
      this.projectileGroup,
      this.activeEnemies,
      this.activeEnemyCount,
      this.collisionHash,
      this.player,
      this.vfx,
      this.dmgNumbers,
      this.weatherManager.armorMult,
    );

    // === PHASE 7b: Parallax scroll ===
    this.backgroundManager.updateParallax();

    // === PHASE 7c: Barrier HP bar ===
    this.backgroundManager.drawBarrierHpBar();

    // === PHASE 8: VFX particle update ===
    this.vfx.update(scaledDelta);
    this.vfx.updateGlitch(scaledDelta, this.runState.baseHp / this.runState.baseMaxHp);
    this.dmgNumbers.update(scaledDelta);

    // === PHASE 8b: Passive timers (burn DOT, buff decay, dash trail) ===
    const passiveResult = this.passiveManager.updateTimers(
      scaledDelta,
      this.passiveCounts,
      this.activeEnemies,
      this.activeEnemyCount,
      this.player,
      this.vfx,
      this.dmgNumbers,
      this.baseArmorMultiplier,
      this.shopArmorMultiplier,
    );
    if (passiveResult.newBaseArmorMultiplier !== undefined) {
      this.baseArmorMultiplier = passiveResult.newBaseArmorMultiplier;
    }
    if (this.phaseManager.current !== 'playing') return;

    // === PHASE 9: Base regen ===
    this.applyBaseRegen(scaledDelta);

    // === PHASE 10: HUD ===
    const currentDistrict = getDistrictForStage(this.runState.stage);
    this.hudManager.update(
      delta,
      this.runState,
      this.player,
      this.weapons,
      this.activeBoss,
      this.activeEnemies,
      this.activeEnemyCount,
      this.spawnManager,
      this.xpTable.required(this.runState.playerLevel),
      this.critterManager.critter ?? null,
      currentDistrict?.weatherEffect,
    );

    // === PHASE 10b: ARIA messages ===
    this.checkARIATriggers();

    // === PHASE 11: Victory check ===
    if (!this.spawnManager.isBossStage && this.spawnManager.isSpawnEnded && this.activeEnemyCount === 0) {
      if (this.runState.stage < BALANCE.STAGE.maxStages) {
        this.analyticsTracker.trackStageClear(this.runState.stage, true, this.runState.kills);
        this.progressionManager.showStageClear();
        this.triggerStoryBeat('stage_clear');
      } else {
        this.progressionManager.onRunComplete(true);
      }
    }
  }

  // === INPUT ===

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phaseManager.current !== 'playing') return;
    if (pointer.x > GAME_WIDTH - 180 && pointer.y < 250) return;

    this.targetPoint = { x: pointer.x, y: pointer.y };
    this.drawTargetReticle(pointer.x, pointer.y);

    if (this.targetClearEvent) this.targetClearEvent.destroy();
    this.targetClearEvent = this.time.delayedCall(BALANCE.TARGET_RETICLE.clearDelayMs, () => {
      this.targetPoint = null;
      this.targetReticle.setAlpha(0);
    });
  }

  private drawTargetReticle(x: number, y: number): void {
    const R = BALANCE.TARGET_RETICLE;
    this.targetReticle.clear();
    this.targetReticle.setAlpha(R.alpha);
    this.targetReticle.lineStyle(2, NEON.UI_ACCENT, 0.8);
    this.targetReticle.strokeCircle(x, y, R.circleRadius);
    this.targetReticle.moveTo(x - R.crosshairOuter, y);
    this.targetReticle.lineTo(x - R.crosshairInner, y);
    this.targetReticle.moveTo(x + R.crosshairInner, y);
    this.targetReticle.lineTo(x + R.crosshairOuter, y);
    this.targetReticle.moveTo(x, y - R.crosshairOuter);
    this.targetReticle.lineTo(x, y - R.crosshairInner);
    this.targetReticle.moveTo(x, y + R.crosshairInner);
    this.targetReticle.lineTo(x, y + R.crosshairOuter);
    this.targetReticle.strokePath();
  }

  // === SPEED CONTROL ===

  private cycleSpeed(): void {
    const options = BALANCE.GAME_SPEED.options;
    this.speedIndex = (this.speedIndex + 1) % options.length;
    this.gameSpeed = options[this.speedIndex];
    this.hudManager.speedText.setText(`${this.gameSpeed}x`);
    this.physics.world.timeScale = this.gameSpeed;
    this.time.timeScale = this.gameSpeed;
  }

  private togglePause(): void {
    if (this.phaseManager.current === 'playing') {
      this.phaseManager.transition('paused');
      this.physics.pause();
      this.pauseOverlay.show();
      getRetroSFX().tap();
    } else if (this.phaseManager.current === 'paused') {
      this.phaseManager.transition('playing');
      this.physics.resume();
      this.pauseOverlay.hide();
    }
  }

  /** Throttled SFX */
  private playSfx(key: string, fn: () => void, cooldownMs = 100): void {
    const now = this.time.now;
    const last = this.sfxThrottles.get(key) ?? 0;
    if (now - last >= cooldownMs) {
      this.sfxThrottles.set(key, now);
      fn();
    }
  }

  /** Play weapon-type-specific fire SFX */
  private playWeaponSfx(weaponId?: string): void {
    const sfx = getRetroSFX();
    const method = getWeaponSfxMethod(weaponId);
    sfx[method]();
  }

  // === HELPERS ===

  private findNearestEnemyCached(): { x: number; y: number } | null {
    let nearest: Enemy | null = null;
    let minDistSq = Infinity;
    const px = this.player.x;
    const py = this.player.y;
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const e = this.activeEnemies[i];
      const dx = e.x - px;
      const dy = e.y - py;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = e;
      }
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }

  // === COMBAT EVENTS (delegated to CombatEventManager) ===

  private onEnemyDeath(enemy: Enemy): void {
    this.combatEventManager.onEnemyDeath(enemy);
    this.tutorialOverlay?.onEnemyKilled();
  }

  // === BASE REGEN ===

  private applyBaseRegen(delta: number): void {
    const level = this.passiveCounts.get('hp_regen') ?? 0;
    const passiveRegen = level > 0 ? PASSIVE_DEFS['hp_regen'].valuePerLevel * level : 0;
    const weatherRegen = this.weatherManager.baseRegenPerSec;
    const totalRegen = passiveRegen + weatherRegen;
    if (totalRegen <= 0) return;
    this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + totalRegen * (delta / 1000));
  }

  // === ARIA MESSAGES ===

  /** Check and display story beats at narrative moments (TASK-017) */
  private triggerStoryBeat(trigger: 'stage_entry' | 'boss_defeat' | 'stage_clear'): void {
    const beat = getStoryBeat(this.runState.stage, trigger, this.ariaState.seenStoryBeats);
    if (beat) {
      this.ariaState.seenStoryBeats.add(beat.id);
      const message = t(beat.localeKey);
      // Queue story beat after the regular ARIA message
      this.ariaMsg.show(message);
    }
  }

  /** Check and display runtime ARIA events (SPEC-026). */
  checkRuntimeAriaEvent(
    event: 'first_boss_kill' | 'player_death' | 'kill_milestone' | 'gold_milestone' | 'district_change',
  ): void {
    const beat = getRuntimeDialogue(event, this.runState, this.runtimeEventState);
    if (!beat) return;
    // Messages are queued by ARIAMessage — no need to check isShowing
    const localeKey = getRuntimeLocaleKey(beat, this.runState.stage);
    this.ariaMsg.show(t(localeKey));
  }

  private checkARIATriggers(): void {
    // Low HP warning (chapter-specific)
    const hpPct = this.runState.baseHp / this.runState.baseMaxHp;
    if (hpPct < BALANCE.ARIA.lowHpThreshold && !this.ariaState.lowHpShown) {
      this.ariaState.lowHpShown = true;
      const key = getAriaDialogueKey('low_hp', this.runState.stage);
      this.ariaMsg.show(t(key));
    }
  }

  // === MID-RUN SHOP ===

  private showMidRunShop(): void {
    this.shopManager.showMidRunShop(this.runState, this.player, this.ariaMsg, this.phaseManager, () =>
      this.closeShop(),
    );
  }

  private closeShop(): void {
    this.shopManager.closeShop();
    this.physics.resume();
    this.phaseManager.transition('playing');
  }

  shutdown(): void {
    this.collisionManager.clearEnemyProjectiles();
    this.weaponSystem?.clearCache();
    this.squadManager?.clearCache();
    this.progressionManager.destroyUI();
    this.shopManager.shopAutoBestAction = undefined;
    this.weatherManager.shutdown();
    this.ultimateManager.reset();
    this.critterManager.shutdown();
    this.backgroundManager.shutdown();
    this.passiveManager.shutdown();
    this.spawnManager.shutdown();
    this.combatEventManager.shutdown();
    if (this.tutorialOverlay) {
      this.tutorialOverlay.destroy();
      this.tutorialOverlay = undefined;
    }
  }
}
