// ── Neon Survivors: Game Scene ──
// Phaser rendering layer only. All game logic lives in src/core/*.

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import type {
  RunState,
  EnemyInstance,
  ProjectileInstance,
  XpGem,
  CoinDrop,
  HealthPickup,
  UpgradeChoice,
} from "../types/game";
import { COLORS, COLOR_STR } from "../config/colors";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INPUT,
  FEEDBACK,
  SPAWN,
  RUN,
  PLAYER_BASE,
  WEAPONS,
  PASSIVES,
  BOSSES,
  EVOLUTIONS,
  NEON_SIGNS,
  DAI_PAI_DONG,
  CHRONO_HACK,
} from "../config/balance";
import { getCharacter, type CharacterDef } from "../config/characters";
import type { CharacterSelectData } from "./CharacterSelectScene";
import {
  createInitialState,
  tick,
  applyJoystickInput,
  grantXp,
  addWeapon,
  upgradeWeapon,
  addPassive,
  upgradePassive,
  damagePlayer,
  resumePlaying,
  setPhase,
} from "../core/RunStateManager";
import {
  calculateDamage,
  calculateFireRate,
  getProjectileCount,
  getWeaponArea,
  getPierceCount,
  rollCrit,
  calculateCritDamage,
  getCooldownDuration,
} from "../core/WeaponCalc";
import {
  getWaveConfig,
  getSpawnPosition,
  scaleEnemy,
  shouldSpawnEnemy,
  pickRandomEnemy,
  getEnemyDef,
} from "../core/SpawnCalc";
import { generateUpgradeChoices } from "../core/UpgradeCalc";
import { getXpForLevel, getXpGemValue } from "../core/XpCalc";
import { IdGenerator } from "../core/IdGenerator";
import { swapRemove } from "../core/ObjectPool";
import { calculateIndicators } from "../core/IndicatorCalc";
import { calculateDrops } from "../core/DropCalc";
import { getWeaponVisual, getProjectileSize } from "../core/WeaponVisualCalc";
import { calculateStageProgress } from "../core/StageProgressCalc";
import {
  getFlashForEvent,
  getVignetteAlpha,
  type FlashEvent,
} from "../core/ScreenFlashCalc";
import { AudioManager } from "../audio/AudioManager";
import { CirclePool, TextPool } from "../utils/VisualPool";
import { calculateKnockback, applyKnockbackDecay } from "../core/KnockbackCalc";
import { getAvailableEvolutions } from "../core/EvolutionCalc";
import { getBossPhase } from "../core/BossPhaseCalc";
import {
  selectLoot,
  getRarityColor,
  type LootTableConfig,
  type LootEntry,
} from "../core/LootTableCalc";
import {
  getDefaultMinimapConfig,
  getEnemyDots,
  type MinimapConfig,
} from "../core/MinimapCalc";
import { getRegenRate, calculateRegenTick } from "../core/RegenCalc";
import {
  createComboState,
  registerKill,
  tickCombo,
  type ComboState,
} from "../core/ScoreCalc";
import {
  createShakeState,
  triggerShake,
  tickShake,
  type ShakeState,
} from "../core/CameraShakeCalc";
import {
  shouldDropFragment,
  getRandomFragmentType,
  collectFragment,
  createNeonBuff,
  tickNeonBuffs,
  getActiveBuffMultiplier,
  type FragmentType,
  type NeonBuff,
} from "../core/NeonSignCalc";
import {
  generateStationPositions,
  getInteractionProgress,
  interruptInteraction,
  serveFood,
  applyFoodBuff,
  tickFoodBuffs,
  isStationAvailable,
  getFoodBuffMultiplier,
  type InteractionState,
  type FoodBuff,
  type StationPosition,
} from "../core/DaiPaiDongCalc";
import {
  createChronoState,
  chargeGauge,
  canActivate,
  activate,
  tickChrono,
  isActive as isChronoActive,
  getTimeScale,
  getDamageMultiplier as getChronoDmgMult,
  getCritBonus as getChronoCritBonus,
  type ChronoState,
  type ChronoActiveState,
} from "../core/ChronoHackCalc";

// ── Layout constants ──
const HUD_H = 80;
const SPRITE_SCALE = 2.5;
const BOSS_SCALE = 2.0;

// ── Weapon slot HUD layout (bottom-right panel) ──
const WS_SLOT_SIZE = 50; // icon box size (px)
const WS_SLOT_GAP = 6; // gap between slots
const WS_MAX_SLOTS = 6;
const WS_PIP_SIZE = 5; // level pip dot size
const WS_PIP_GAP = 3; // gap between pips
const WS_PANEL_RIGHT = GAME_WIDTH - 24; // right-align anchor (24px margin)
const WS_PANEL_BOTTOM = GAME_HEIGHT - 24; // y-coordinate of slot bottom edge (24px bottom margin)

// ── Enemy ID → sprite prefix mapping ──
const ENEMY_SPRITE_PREFIX: Record<string, string> = {
  drone: "enemy_grunt",
  crawler: "enemy_brute",
  enforcer: "enemy_slasher",
  dasher: "enemy_dasher",
  sentinel: "enemy_ranged",
  bomber: "enemy_worker",
};

// ── Boss ID → sprite prefix mapping ──
const BOSS_SPRITE_PREFIX: Record<string, string> = {
  mini_boss: "boss",
  chapter_boss: "boss2",
  final_boss: "boss3",
};

// ── Data sent to GameOverScene ──
export interface GameOverData {
  score: number;
  victory: boolean;
  elapsed: number;
  level: number;
  coinsEarned: number;
  kills: number;
  bossesKilled: number;
  maxCombo: number;
}

const ENEMY_LOOT_TABLE: LootTableConfig = {
  entries: [
    { id: "xp_small", rarity: "common", weight: 50, minWave: 0 },
    { id: "xp_medium", rarity: "uncommon", weight: 30, minWave: 2 },
    { id: "xp_large", rarity: "rare", weight: 10, minWave: 4 },
    { id: "coin", rarity: "common", weight: 25, minWave: 0 },
    { id: "health", rarity: "uncommon", weight: 15, minWave: 3 },
    { id: "magnet_burst", rarity: "rare", weight: 5, minWave: 5 },
    { id: "bomb", rarity: "epic", weight: 2, minWave: 6 },
    { id: "shield", rarity: "legendary", weight: 1, minWave: 8 },
  ],
  luckBonus: 0,
};

export class GameScene extends Phaser.Scene {
  // Core state
  private runState!: RunState;
  private idGen = new IdGenerator();

  // Joystick
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickActive = false;
  private joystickPointerId: number | null = null;
  private joystickOriginX = 0;
  private joystickOriginY = 0;
  private joystickDx = 0;
  private joystickDy = 0;

  // Sprite maps
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySpriteMap = new Map<
    string,
    {
      sprite: Phaser.GameObjects.Sprite;
      hpBar: Phaser.GameObjects.Rectangle;
      hpBarBg: Phaser.GameObjects.Rectangle;
    }
  >();
  private projectileSpriteMap = new Map<
    string,
    | Phaser.GameObjects.Arc
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Triangle
  >();
  private xpGemSpriteMap = new Map<string, Phaser.GameObjects.Arc>();
  private coinSpriteMap = new Map<string, Phaser.GameObjects.Arc>();
  private healthSpriteMap = new Map<string, Phaser.GameObjects.Text>();

  // HUD refs
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private stageBar!: Phaser.GameObjects.Rectangle;
  private stageBarBg!: Phaser.GameObjects.Rectangle;
  private stageText!: Phaser.GameObjects.Text;
  private weaponIcons: Phaser.GameObjects.Text[] = [];
  // Weapon slot panel (bottom-right, above joystick zone)
  private weaponSlotBgs: Phaser.GameObjects.Rectangle[] = [];
  private weaponSlotLabels: Phaser.GameObjects.Text[] = [];
  private weaponSlotPips: Phaser.GameObjects.Rectangle[][] = [];

  // Level-up UI
  private levelUpContainer!: Phaser.GameObjects.Container;
  private isLevelUpShown = false;

  // Pause
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseButton!: Phaser.GameObjects.Text;
  private bgmToggleText!: Phaser.GameObjects.Text;
  private sfxToggleText!: Phaser.GameObjects.Text;

  // Banner
  private bannerText!: Phaser.GameObjects.Text;

  // Audio
  private audio!: AudioManager;

  // Object pools for visual recycling
  private circlePool!: CirclePool;
  private textPool!: TextPool;

  // Off-screen enemy indicators (arrow triangles)
  private indicatorSprites: Phaser.GameObjects.Triangle[] = [];

  // Low HP vignette overlay
  private vignetteOverlay!: Phaser.GameObjects.Rectangle;

  // Tracks previous level for level-up detection
  private prevLevel = 1;

  // Parallax background layers (TileSprite for seamless scrolling)
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];
  // Previous player position for computing per-frame delta
  private prevPlayerX = 0;
  private prevPlayerY = 0;

  // Selected character (set in init, used in create)
  private character: CharacterDef = getCharacter("biker");

  // Character passive bonus — damage multiplier (0 = no bonus)
  private charDamageBonus = 0;

  // Knockback velocities per enemy (decays each frame)
  private knockbackMap = new Map<string, { dx: number; dy: number }>();

  // Combo state for ScoreCalc
  private comboState: ComboState = createComboState();

  // Camera shake state
  private shakeState: ShakeState = createShakeState();

  // ── Neon Sign Combo System ──
  private heldFragments: FragmentType[] = [];
  private neonBuffs: NeonBuff[] = [];
  private neonFragmentSprites = new Map<
    string,
    { text: Phaser.GameObjects.Text; x: number; y: number; lifetime: number }
  >();

  // ── Dai Pai Dong Stations ──
  private dpdStations: {
    position: StationPosition;
    lastUsedAt: number;
    interactionElapsedMs: number;
    visual: Phaser.GameObjects.Container;
    progressBar: Phaser.GameObjects.Rectangle;
    progressBarBg: Phaser.GameObjects.Rectangle;
  }[] = [];
  private dpdFoodBuffs: FoodBuff[] = [];
  private dpdBuffIndicator!: Phaser.GameObjects.Text;

  // ── Chrono Hack ──
  private chronoState: ChronoState = createChronoState();
  private chronoOverlay!: Phaser.GameObjects.Rectangle;
  private chronoGaugeBar!: Phaser.GameObjects.Rectangle;
  private chronoGaugeBg!: Phaser.GameObjects.Rectangle;

  // Minimap radar overlay
  private minimapConfig: MinimapConfig = getDefaultMinimapConfig();
  private minimapBg!: Phaser.GameObjects.Arc;
  private minimapDots: Phaser.GameObjects.Arc[] = [];
  private minimapPlayerDot!: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  // ── Lifecycle ──

  init(data: CharacterSelectData | Record<string, unknown>): void {
    const id = (data as CharacterSelectData)?.characterId ?? "biker";
    this.character = getCharacter(id);
    this.charDamageBonus = 0; // reset before applyCharacterPassive sets it
  }

  create(): void {
    this.runState = createInitialState(this.character.startingWeapon);
    this.applyCharacterPassive();
    this.idGen.reset();

    this.enemySpriteMap.clear();
    this.projectileSpriteMap.clear();
    this.xpGemSpriteMap.clear();
    this.coinSpriteMap.clear();
    this.healthSpriteMap.clear();
    this.knockbackMap.clear();
    this.heldFragments = [];
    this.neonBuffs = [];
    this.neonFragmentSprites.clear();
    this.dpdStations = [];
    this.dpdFoodBuffs = [];
    this.chronoState = createChronoState();
    this.isLevelUpShown = false;
    this.joystickActive = false;
    this.joystickDx = 0;
    this.joystickDy = 0;
    this.weaponIcons = [];
    this.weaponSlotBgs = [];
    this.weaponSlotLabels = [];
    this.weaponSlotPips = [];

    this.prevLevel = 1;
    this.isPaused = false;
    this.audio = new AudioManager(this);
    this.circlePool = new CirclePool(this);
    this.textPool = new TextPool(this);

    this.createBackground();
    this.createPlayer();
    this.createEnemyAnimations();
    this.createHUD();
    this.createWeaponSlotPanel();
    this.createJoystick();
    this.createLevelUpUI();
    this.createPauseButton();
    this.createPauseOverlay();
    this.createBanner();
    this.createIndicators();
    this.createVignette();
    this.createMinimap();
    this.createDaiPaiDongStations();
    this.createChronoHUD();
    this.createChronoInput();
    this.createDpdBuffIndicator();
    this.showBanner("SURVIVE!", COLOR_STR.NEON_GREEN);

    // Start battle BGM (early phase)
    this.audio.playBgmForPhase("early");

    // Clean up audio and pools when scene shuts down
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.destroy();
      this.circlePool.destroy();
      this.textPool.destroy();
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // When paused, skip all game logic but keep rendering
    if (this.isPaused) return;

    if (this.runState.phase === "playing" || this.runState.phase === "boss") {
      // Core tick
      const newMinute = tick(this.runState, dt);

      // Player movement
      applyJoystickInput(this.runState, this.joystickDx, this.joystickDy, dt);

      // Spawning
      this.handleSpawning(dt);

      // Weapon firing
      this.handleWeaponFiring(dt);

      // Projectile movement & collision
      this.updateProjectiles(dt);

      // Enemy movement & collision with player
      this.updateEnemies(dt);

      // XP gem pickup
      this.updateXpGems(dt);

      // Coin pickup
      this.updateCoins(dt);

      // Health pickup
      this.updateHealthPickups(dt);

      // Neon fragment pickup
      this.updateNeonFragments(dt);

      // Dai Pai Dong station interaction
      this.updateDaiPaiDong(delta);

      // Chrono Hack tick
      this.updateChrono(delta);

      // Tick neon buffs
      this.neonBuffs = tickNeonBuffs(this.neonBuffs, delta);

      // Tick food buffs
      this.dpdFoodBuffs = tickFoodBuffs(this.dpdFoodBuffs, delta);

      // Check boss spawn on minute change
      if (newMinute >= 0) {
        this.checkBossSpawn();
      }

      // BGM phase transitions (only while in "playing" — boss handles its own)
      if (this.runState.phase === "playing") {
        this.audio.updateBgmForTime(this.runState.elapsed);
      }

      // Level-up detection
      const currentLevel = this.runState.player.level;
      if (currentLevel > this.prevLevel) {
        this.audio.playLevelUp();
        this.triggerLevelUpEffects();
        this.shakeState = triggerShake(this.shakeState, "level_up");
        this.prevLevel = currentLevel;
      }

      // Victory/GameOver check (phase may change during tick)
      const currentPhase = this.runState.phase as string;
      if (currentPhase === "victory") {
        this.triggerVictory();
        return;
      }
      if (currentPhase === "game_over") {
        this.triggerGameOver();
        return;
      }
    }

    if (this.runState.phase === "level_up" && !this.isLevelUpShown) {
      this.showLevelUpChoices();
    }

    // Sync visuals
    this.syncPlayerSprite();
    this.updateParallax();
    this.syncHUD();
    this.syncWeaponSlotPanel();
    this.syncIndicators();
    this.syncVignette();
    this.syncMinimap();
    this.syncChronoHUD();
    this.applyRegen(dt);
    this.comboState = tickCombo(this.comboState, dt);

    // Camera shake
    this.shakeState = tickShake(this.shakeState, dt);
    if (this.shakeState.active) {
      this.cameras.main.setScroll(
        this.shakeState.offsetX,
        this.shakeState.offsetY,
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }
  }

  // ── Background ──

  private createBackground(): void {
    this.bgLayers = [];
    const layerKeys = [
      "bg_layer1",
      "bg_layer2",
      "bg_layer3",
      "bg_layer4",
      "bg_layer5",
    ];

    for (let i = 0; i < layerKeys.length; i++) {
      const key = layerKeys[i];
      if (!this.textures.exists(key)) continue;

      // Use TileSprite so the layer can scroll seamlessly via tilePositionX/Y
      const tex = this.textures.get(key);
      const sourceW = tex.source[0].width;
      const sourceH = tex.source[0].height;

      // Scale factor: fill the viewport height, keep aspect ratio
      const scale = GAME_HEIGHT / sourceH;
      const scaledW = Math.ceil(sourceW * scale);

      // TileSprite covers the full viewport; width is at least 3× to allow
      // left/right drift without revealing the edge
      const tileW = Math.max(GAME_WIDTH * 3, scaledW * 3);

      const tile = this.add.tileSprite(
        GAME_WIDTH / 2, // centred horizontally
        GAME_HEIGHT / 2, // centred vertically
        tileW,
        GAME_HEIGHT,
        key,
      );
      tile.setTileScale(scale, scale);
      tile.setAlpha(i === 0 ? 1 : 0.6 - i * 0.1);
      tile.setDepth(i);

      this.bgLayers.push(tile);
    }

    // Dark overlay sits just above all bg layers
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.4,
      )
      .setDepth(layerKeys.length);

    // Initialise previous position so the first frame delta is zero
    this.prevPlayerX = this.runState.player.x;
    this.prevPlayerY = this.runState.player.y;
  }

  // ── Player ──

  private createPlayer(): void {
    const prefix = this.character.spritePrefix;
    const key = `${prefix}_idle`;
    const animKey = `${prefix}_idle_anim`;

    this.playerSprite = this.add
      .sprite(this.runState.player.x, this.runState.player.y, key)
      .setScale(SPRITE_SCALE)
      .setDepth(20);

    if (this.anims.exists(animKey)) {
      this.playerSprite.play(animKey);
    } else if (this.textures.exists(key)) {
      // Create idle animation for this character
      const frames = this.anims.generateFrameNumbers(key, { start: 0, end: 3 });
      if (frames.length > 0) {
        this.anims.create({
          key: animKey,
          frames,
          frameRate: 8,
          repeat: -1,
        });
        this.playerSprite.play(animKey);
      }
    }
  }

  /**
   * Apply the character's unique passive bonus to the initial run state.
   * Called immediately after createInitialState() in create().
   *
   * move_speed / max_hp are applied directly to player stats.
   * damage is stored on this.charDamageBonus and multiplied into every
   * damage roll inside handleWeaponFiring — avoids touching core/ logic.
   */
  private applyCharacterPassive(): void {
    const { stat, value } = this.character.passiveBonus;
    const player = this.runState.player;

    switch (stat) {
      case "move_speed":
        player.speed = Math.round(player.speed * (1 + value));
        break;
      case "damage":
        this.charDamageBonus = value;
        break;
      case "max_hp":
        player.maxHp = Math.round(player.maxHp * (1 + value));
        player.hp = player.maxHp;
        break;
    }
  }

  // ── Enemy Animations ──

  private createEnemyAnimations(): void {
    // Regular enemy types
    const enemyPrefixes = [
      "enemy_grunt",
      "enemy_brute",
      "enemy_slasher",
      "enemy_dasher",
      "enemy_ranged",
      "enemy_worker",
    ];

    for (const prefix of enemyPrefixes) {
      this.tryCreateAnim(`${prefix}_walk_anim`, `${prefix}_walk`, 0, 7, 8);
      this.tryCreateAnim(
        `${prefix}_death_anim`,
        `${prefix}_death`,
        0,
        5,
        10,
        0,
      );
    }

    // Boss types
    const bossPrefixes = ["boss", "boss2", "boss3"];
    for (const prefix of bossPrefixes) {
      this.tryCreateAnim(`${prefix}_walk_anim`, `${prefix}_walk`, 0, 7, 6);
      this.tryCreateAnim(`${prefix}_death_anim`, `${prefix}_death`, 0, 7, 8, 0);
    }
  }

  /** Create an animation only if the spritesheet texture exists and the anim key is not already registered. */
  private tryCreateAnim(
    animKey: string,
    textureKey: string,
    startFrame: number,
    endFrame: number,
    frameRate: number,
    repeat = -1,
  ): void {
    if (this.anims.exists(animKey)) return;
    if (!this.textures.exists(textureKey)) return;

    const frames = this.anims.generateFrameNumbers(textureKey, {
      start: startFrame,
      end: endFrame,
    });
    if (frames.length === 0) return;

    this.anims.create({ key: animKey, frames, frameRate, repeat });
  }

  private syncPlayerSprite(): void {
    this.playerSprite.setPosition(
      this.runState.player.x,
      this.runState.player.y,
    );

    // Flash on invincibility
    if (this.runState.player.invincibilityTimer > 0) {
      this.playerSprite.setAlpha(Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.3);
    } else {
      this.playerSprite.setAlpha(1);
    }
  }

  // ── Parallax ──

  /**
   * Scroll each background layer at a fraction of the player's per-frame
   * movement to create a depth illusion.
   *
   * Speed factors (layer index 0 = farthest, index 4 = closest):
   *   0 → 0.1×, 1 → 0.2×, 2 → 0.3×, 3 → 0.4×, 4 → 0.5×
   *
   * We offset `tilePositionX/Y` rather than moving the sprite so the tile
   * repeats seamlessly without needing a huge canvas.
   */
  private updateParallax(): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;

    const dx = px - this.prevPlayerX;
    const dy = py - this.prevPlayerY;

    this.prevPlayerX = px;
    this.prevPlayerY = py;

    const speedFactors = [0.1, 0.2, 0.3, 0.4, 0.5];

    for (let i = 0; i < this.bgLayers.length; i++) {
      const factor = speedFactors[i] ?? 0.5;
      this.bgLayers[i].tilePositionX += dx * factor;
      this.bgLayers[i].tilePositionY += dy * factor;
    }
  }

  // ── HUD ──

  private createHUD(): void {
    // Top band
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        HUD_H / 2,
        GAME_WIDTH,
        HUD_H,
        COLORS.BG_PANEL,
        0.9,
      )
      .setDepth(90);

    // HP bar
    const hpBarW = 180;
    const hpBarY = 38;
    this.hpBarBg = this.add
      .rectangle(24, hpBarY, hpBarW, 14, COLORS.HP_BG)
      .setOrigin(0, 0.5)
      .setDepth(91);
    this.hpBar = this.add
      .rectangle(24, hpBarY, hpBarW, 14, COLORS.HP_GREEN)
      .setOrigin(0, 0.5)
      .setDepth(91);

    // XP bar
    const xpBarY = 58;
    this.xpBarBg = this.add
      .rectangle(24, xpBarY, hpBarW, 10, COLORS.HP_BG)
      .setOrigin(0, 0.5)
      .setDepth(91);
    this.xpBar = this.add
      .rectangle(24, xpBarY, 0, 10, COLORS.NEON_CYAN)
      .setOrigin(0, 0.5)
      .setDepth(91);

    // Level text
    this.levelText = this.add
      .text(214, 38, "Lv 1", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.NEON_CYAN,
      })
      .setOrigin(0, 0.5)
      .setDepth(91);

    // Coin counter (below level text)
    this.coinText = this.add
      .text(214, 58, "🪙 0", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLOR_STR.COIN_GOLD,
      })
      .setOrigin(0, 0.5)
      .setDepth(91);

    // Stage progress bar (very top of screen, full width, 4px tall)
    const stageBarW = GAME_WIDTH - 48;
    this.stageBarBg = this.add
      .rectangle(GAME_WIDTH / 2, 8, stageBarW, 4, COLORS.HP_BG)
      .setDepth(92);
    this.stageBar = this.add
      .rectangle(24, 8, 0, 4, COLORS.NEON_CYAN)
      .setOrigin(0, 0.5)
      .setDepth(92);

    // Stage label (top-center, below progress bar)
    this.stageText = this.add
      .text(GAME_WIDTH / 2, 20, "STAGE 1 — EARLY", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: COLOR_STR.TEXT_DIM,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(92);

    // Timer (top-right, first row — leave space for pause btn)
    this.timerText = this.add
      .text(GAME_WIDTH - 60, 30, "0:00", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_STR.TEXT_WHITE,
      })
      .setOrigin(1, 0.5)
      .setDepth(91);

    // Kill counter (top-right, second row)
    this.killText = this.add
      .text(GAME_WIDTH - 60, 52, "💀 0", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLOR_STR.NEON_GREEN,
      })
      .setOrigin(1, 0.5)
      .setDepth(91);

    // Score counter (top-right, third row)
    this.scoreText = this.add
      .text(GAME_WIDTH - 60, 70, "★ 0", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLOR_STR.COIN_GOLD,
      })
      .setOrigin(1, 0.5)
      .setDepth(91);
  }

  private syncHUD(): void {
    const p = this.runState.player;

    // HP bar
    const hpRatio = Math.max(0, p.hp / p.maxHp);
    this.hpBar.setDisplaySize(180 * hpRatio, 14);
    this.hpBar.setFillStyle(hpRatio > 0.4 ? COLORS.HP_GREEN : COLORS.HP_RED);

    // XP bar
    const xpThreshold = getXpForLevel(p.level);
    const xpRatio =
      xpThreshold < Infinity ? Math.min(1, p.xp / xpThreshold) : 0;
    this.xpBar.setDisplaySize(180 * xpRatio, 10);

    // Level text
    this.levelText.setText(`Lv ${p.level}`);

    // Timer
    const totalSec = Math.floor(this.runState.elapsed);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    this.timerText.setText(`${min}:${String(sec).padStart(2, "0")}`);

    // Kill counter
    this.killText.setText(`💀 ${this.runState.kills}`);

    // Score
    this.scoreText.setText(`★ ${this.runState.score}`);

    // Coins
    this.coinText.setText(`🪙 ${this.runState.player.coins}`);

    // Stage progress
    const sp = calculateStageProgress(this.runState.elapsed);
    const stageBarMaxW = GAME_WIDTH - 48;
    this.stageBar.setDisplaySize(stageBarMaxW * sp.progress, 4);
    this.stageBar.setFillStyle(
      sp.isUrgent ? COLORS.NEON_PINK : COLORS.NEON_CYAN,
    );
    const bossHint = sp.nextBossStage ? ` — BOSS at ${sp.nextBossStage}` : "";
    this.stageText.setText(`STAGE ${sp.stage} — ${sp.stageLabel}${bossHint}`);
    this.stageText.setColor(
      sp.isUrgent ? COLOR_STR.NEON_PINK : COLOR_STR.TEXT_DIM,
    );
  }

  // ── Weapon Slot Panel ──

  /**
   * Create 6 weapon slot boxes in the bottom-right corner above the joystick.
   * Slots are built once; syncWeaponSlotPanel() updates their content each frame.
   */
  private createWeaponSlotPanel(): void {
    const DEPTH = 92;

    for (let i = 0; i < WS_MAX_SLOTS; i++) {
      // Position: right-align, stacking right-to-left
      const slotX =
        WS_PANEL_RIGHT - (WS_MAX_SLOTS - 1 - i) * (WS_SLOT_SIZE + WS_SLOT_GAP);
      const slotY = WS_PANEL_BOTTOM - WS_SLOT_SIZE / 2;

      // Slot background box
      const bg = this.add
        .rectangle(
          slotX,
          slotY,
          WS_SLOT_SIZE,
          WS_SLOT_SIZE,
          COLORS.UI_SLOT_EMPTY,
          0.85,
        )
        .setStrokeStyle(1, COLORS.UI_SLOT_BORDER)
        .setDepth(DEPTH);
      this.weaponSlotBgs.push(bg);

      // Weapon abbreviation label (centered in box)
      const label = this.add
        .text(slotX, slotY - 4, "", {
          fontFamily: "monospace",
          fontSize: "13px",
          color: COLOR_STR.TEXT_DIM,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(DEPTH + 1);
      this.weaponSlotLabels.push(label);

      // Level pips row below label (up to 5 pips)
      const maxLevel = 5;
      const pipRowWidth = maxLevel * WS_PIP_SIZE + (maxLevel - 1) * WS_PIP_GAP;
      const pipStartX = slotX - pipRowWidth / 2 + WS_PIP_SIZE / 2;
      const pipY = slotY + WS_SLOT_SIZE / 2 - 7;

      const pips: Phaser.GameObjects.Rectangle[] = [];
      for (let p = 0; p < maxLevel; p++) {
        const pip = this.add
          .rectangle(
            pipStartX + p * (WS_PIP_SIZE + WS_PIP_GAP),
            pipY,
            WS_PIP_SIZE,
            WS_PIP_SIZE,
            COLORS.UI_LEVEL_PIP_EMPTY,
          )
          .setDepth(DEPTH + 1);
        pips.push(pip);
      }
      this.weaponSlotPips.push(pips);
    }
  }

  /**
   * Refresh weapon slot panel visuals to match current player weapon loadout.
   * Called every frame from update().
   */
  private syncWeaponSlotPanel(): void {
    const weapons = this.runState.player.weapons;

    for (let i = 0; i < WS_MAX_SLOTS; i++) {
      const slot = weapons[i];
      const bg = this.weaponSlotBgs[i];
      const label = this.weaponSlotLabels[i];
      const pips = this.weaponSlotPips[i];

      if (!slot) {
        // Empty slot
        bg.setFillStyle(COLORS.UI_SLOT_EMPTY, 0.6).setStrokeStyle(
          1,
          COLORS.UI_SLOT_BORDER,
        );
        label.setText("").setColor(COLOR_STR.TEXT_DIM);
        pips.forEach((p) => p.setFillStyle(COLORS.UI_LEVEL_PIP_EMPTY));
        continue;
      }

      // Filled slot — highlight brightness scales with weapon level (1–5)
      const level = slot.level;
      const weaponDef = WEAPONS[slot.weaponId];
      const abbr = (weaponDef?.name ?? slot.weaponId)
        .substring(0, 3)
        .toUpperCase();

      // Border color: brighter at higher levels
      const borderColor = this.weaponLevelColor(level);
      bg.setFillStyle(COLORS.BG_PANEL, 0.9).setStrokeStyle(2, borderColor);

      // Abbreviation in matching color
      const labelColor = this.weaponLevelColorStr(level);
      label.setText(abbr).setColor(labelColor);

      // Pips: filled up to current level
      pips.forEach((p, pi) => {
        p.setFillStyle(
          pi < level ? COLORS.UI_LEVEL_PIP : COLORS.UI_LEVEL_PIP_EMPTY,
        );
      });
    }
  }

  /** Returns a numeric color for a weapon level (1–5), brighter at higher levels. */
  private weaponLevelColor(level: number): number {
    switch (level) {
      case 1:
        return COLORS.RARITY_COMMON;
      case 2:
        return COLORS.RARITY_UNCOMMON;
      case 3:
        return COLORS.RARITY_RARE;
      case 4:
        return COLORS.RARITY_EPIC;
      case 5:
        return COLORS.RARITY_LEGENDARY;
      default:
        return COLORS.UI_SLOT_BORDER;
    }
  }

  /** Returns a string color for a weapon level (1–5), for use in text styles. */
  private weaponLevelColorStr(level: number): string {
    switch (level) {
      case 1:
        return COLOR_STR.RARITY_COMMON;
      case 2:
        return COLOR_STR.RARITY_UNCOMMON;
      case 3:
        return COLOR_STR.RARITY_RARE;
      case 4:
        return COLOR_STR.RARITY_EPIC;
      case 5:
        return COLOR_STR.RARITY_LEGENDARY;
      default:
        return COLOR_STR.TEXT_DIM;
    }
  }

  // ── Joystick ──

  private createJoystick(): void {
    this.joystickBase = this.add
      .circle(
        INPUT.joystickX,
        INPUT.joystickY,
        INPUT.joystickRadius,
        COLORS.TEXT_WHITE,
        0.15,
      )
      .setDepth(95);
    this.joystickThumb = this.add
      .circle(
        INPUT.joystickX,
        INPUT.joystickY,
        INPUT.joystickRadius * 0.5,
        COLORS.NEON_CYAN,
        0.4,
      )
      .setDepth(96);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isLevelUpShown) return;
      // Only use lower half for joystick
      if (pointer.y > GAME_HEIGHT * 0.5) {
        this.joystickActive = true;
        this.joystickPointerId = pointer.id;

        if (INPUT.floatingJoystick) {
          this.joystickOriginX = pointer.x;
          this.joystickOriginY = pointer.y;
          this.joystickBase.setPosition(pointer.x, pointer.y);
          this.joystickThumb.setPosition(pointer.x, pointer.y);
        } else {
          this.joystickOriginX = INPUT.joystickX;
          this.joystickOriginY = INPUT.joystickY;
        }
        this.joystickBase.setAlpha(0.3);
        this.joystickThumb.setAlpha(0.6);
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.joystickActive || pointer.id !== this.joystickPointerId) return;

      const dx = pointer.x - this.joystickOriginX;
      const dy = pointer.y - this.joystickOriginY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = INPUT.joystickRadius;

      if (dist < INPUT.joystickDeadzone) {
        this.joystickDx = 0;
        this.joystickDy = 0;
        this.joystickThumb.setPosition(
          this.joystickOriginX,
          this.joystickOriginY,
        );
        return;
      }

      const clampedDist = Math.min(dist, maxDist);
      const nx = dx / dist;
      const ny = dy / dist;

      this.joystickDx = nx * (clampedDist / maxDist);
      this.joystickDy = ny * (clampedDist / maxDist);

      this.joystickThumb.setPosition(
        this.joystickOriginX + nx * clampedDist,
        this.joystickOriginY + ny * clampedDist,
      );
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;
      this.joystickActive = false;
      this.joystickPointerId = null;
      this.joystickDx = 0;
      this.joystickDy = 0;
      this.joystickBase.setAlpha(0.15);
      this.joystickThumb.setAlpha(0.4);
      this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
    });
  }

  // ── Spawning ──

  private handleSpawning(dt: number): void {
    const waveConfig = getWaveConfig(this.runState.elapsed);
    if (!shouldSpawnEnemy(dt, waveConfig.enemiesPerSecond)) return;

    const enemyId = pickRandomEnemy(waveConfig);
    const enemyDef = getEnemyDef(enemyId);
    if (!enemyDef) return;

    const scaled = scaleEnemy(enemyDef, waveConfig);
    const pos = getSpawnPosition(
      this.runState.player.x,
      this.runState.player.y,
    );
    const id = this.idGen.next("enemy");

    const instance: EnemyInstance = {
      id,
      enemyId,
      x: pos.x,
      y: pos.y,
      hp: scaled.hp,
      maxHp: scaled.hp,
      speed: scaled.speed,
      damage: scaled.damage,
      active: true,
    };

    this.runState.enemies.push(instance);
    this.createEnemySprite(instance);
  }

  private checkBossSpawn(): void {
    const waveConfig = getWaveConfig(this.runState.elapsed);
    if (!waveConfig.bossSpawn) return;
    if (this.runState.bossesSpawned.includes(waveConfig.bossSpawn)) return;

    this.runState.bossesSpawned.push(waveConfig.bossSpawn);
    const bossDef = BOSSES[waveConfig.bossSpawn];
    if (!bossDef) return;

    const pos = getSpawnPosition(
      this.runState.player.x,
      this.runState.player.y,
      SPAWN.bossSpawnOffset,
    );
    const id = this.idGen.next("boss");

    const instance: EnemyInstance = {
      id,
      enemyId: waveConfig.bossSpawn,
      x: pos.x,
      y: pos.y,
      hp: bossDef.hp,
      maxHp: bossDef.hp,
      speed: bossDef.speed,
      damage: bossDef.damage,
      active: true,
    };

    this.runState.enemies.push(instance);
    this.createEnemySprite(instance, true);
    setPhase(this.runState, "boss");
    this.showBanner(bossDef.name.toUpperCase(), COLOR_STR.NEON_PINK);
    this.triggerFlash("boss_spawn");

    // Boss audio: warning SFX then boss BGM
    this.audio.playBossWarning();
    this.time.delayedCall(1200, () => {
      this.audio.playBgmForPhase("boss");
    });
  }

  private createEnemySprite(instance: EnemyInstance, isBoss = false): void {
    const scale = isBoss ? BOSS_SCALE : SPRITE_SCALE;

    // Resolve sprite prefix from enemy/boss ID, falling back to defaults
    const prefix = isBoss
      ? (BOSS_SPRITE_PREFIX[instance.enemyId] ?? "boss")
      : (ENEMY_SPRITE_PREFIX[instance.enemyId] ?? "enemy_grunt");

    // Prefer the walk spritesheet so the walk animation plays immediately;
    // fall back to idle frame, then hard-coded safe defaults.
    const walkKey = `${prefix}_walk`;
    const idleKey = `${prefix}_idle`;
    const spriteKey = this.textures.exists(walkKey)
      ? walkKey
      : this.textures.exists(idleKey)
        ? idleKey
        : isBoss
          ? "boss_idle"
          : "enemy_grunt_idle";

    const sprite = this.add
      .sprite(instance.x, instance.y, spriteKey)
      .setScale(scale)
      .setDepth(10);

    // Play walk animation if it was registered during createEnemyAnimations()
    const walkAnimKey = `${prefix}_walk_anim`;
    if (this.anims.exists(walkAnimKey)) {
      sprite.play(walkAnimKey);
    }

    const barW = isBoss ? 120 : 60;
    const barY = instance.y + (isBoss ? 90 : 60);
    const hpBarBg = this.add
      .rectangle(instance.x, barY, barW, 6, COLORS.HP_BG)
      .setDepth(11);
    const hpBar = this.add
      .rectangle(
        instance.x - barW / 2,
        barY,
        barW,
        6,
        isBoss ? COLORS.NEON_PINK : COLORS.HP_RED,
      )
      .setOrigin(0, 0.5)
      .setDepth(11);

    this.enemySpriteMap.set(instance.id, { sprite, hpBar, hpBarBg });
  }

  // ── Weapon Firing ──

  private handleWeaponFiring(_dt: number): void {
    const p = this.runState.player;

    for (const weapon of p.weapons) {
      if (weapon.cooldownTimer > 0) continue;

      const cd = getCooldownDuration(weapon.weaponId, weapon.level, p.passives);
      weapon.cooldownTimer = cd;

      // Play weapon fire SFX
      this.audio.playWeaponFire(weapon.weaponId);

      const projCount = getProjectileCount(
        weapon.weaponId,
        weapon.level,
        p.passives,
      );
      const baseDamage = calculateDamage(
        weapon.weaponId,
        weapon.level,
        p.passives,
      );
      let damage =
        this.charDamageBonus > 0
          ? Math.round(baseDamage * (1 + this.charDamageBonus))
          : baseDamage;

      // Apply neon buff damage multiplier
      const neonDmgMult = getActiveBuffMultiplier(this.neonBuffs, "damage");
      damage = Math.round(damage * neonDmgMult);

      // Apply chrono damage multiplier
      damage = Math.round(damage * getChronoDmgMult(this.chronoState));

      // Apply food buff damage (fire damage)
      const foodDmg = getFoodBuffMultiplier(this.dpdFoodBuffs, "fireDamage");
      damage = Math.round(damage * foodDmg.multiplicative);

      const area = getWeaponArea(weapon.weaponId, weapon.level, p.passives);
      const pierce = getPierceCount(weapon.weaponId, weapon.level);

      // Apply food buff pierce bonus
      const foodPierce = getFoodBuffMultiplier(this.dpdFoodBuffs, "pierce");

      const weaponDef = WEAPONS[weapon.weaponId];
      if (!weaponDef) continue;

      // Check crit — add neon and chrono crit bonuses on top of base roll
      let isCrit = rollCrit(p.passives);
      if (!isCrit) {
        const chronoCritBonus = getChronoCritBonus(this.chronoState);
        const neonCritMult = getActiveBuffMultiplier(
          this.neonBuffs,
          "critChance",
        );
        const extraCrit = chronoCritBonus + (neonCritMult > 1 ? 0.15 : 0);
        if (extraCrit > 0) {
          isCrit = Math.random() < extraCrit;
        }
      }
      const finalDmg = isCrit
        ? calculateCritDamage(damage, p.passives)
        : damage;

      // Find nearest enemy for targeting
      const target = this.findNearestEnemy();

      for (let i = 0; i < projCount; i++) {
        let vx = 0;
        let vy = -1; // default: shoot up

        if (target) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            vx = dx / dist;
            vy = dy / dist;
          }
        }

        // Spread for multi-projectile weapons
        if (projCount > 1) {
          const spreadAngle = Math.PI / 6; // 30 degree total spread
          const angleOffset =
            (i - (projCount - 1) / 2) *
            (spreadAngle / Math.max(projCount - 1, 1));
          const cos = Math.cos(angleOffset);
          const sin = Math.sin(angleOffset);
          const newVx = vx * cos - vy * sin;
          const newVy = vx * sin + vy * cos;
          vx = newVx;
          vy = newVy;
        }

        const speed = weaponDef.projectileSpeed || 600;
        const id = this.idGen.next("proj");

        const proj: ProjectileInstance = {
          id,
          weaponId: weapon.weaponId,
          x: p.x,
          y: p.y,
          vx: vx * speed,
          vy: vy * speed,
          damage: finalDmg,
          pierce: pierce + foodPierce.additive,
          area,
          lifetime: weaponDef.range > 0 ? weaponDef.range / speed : 2,
        };

        this.runState.projectiles.push(proj);

        // Create visual with weapon-specific shape
        const wVisual = getWeaponVisual(weapon.weaponId);
        const projSize = getProjectileSize(weapon.weaponId, weapon.level);
        const projColor = isCrit ? COLORS.NEON_YELLOW : wVisual.color;
        const projAngle = Math.atan2(vy, vx);

        let projVisual:
          | Phaser.GameObjects.Arc
          | Phaser.GameObjects.Rectangle
          | Phaser.GameObjects.Triangle;

        if (wVisual.shape === "line") {
          projVisual = this.add
            .rectangle(proj.x, proj.y, wVisual.height, projSize, projColor)
            .setRotation(projAngle)
            .setDepth(15);
        } else if (wVisual.shape === "rect") {
          projVisual = this.add
            .rectangle(proj.x, proj.y, projSize, projSize, projColor)
            .setRotation(projAngle)
            .setDepth(15);
        } else if (wVisual.shape === "triangle") {
          projVisual = this.add
            .triangle(
              proj.x,
              proj.y,
              0,
              -projSize / 2,
              projSize,
              projSize / 2,
              0,
              projSize / 2,
              projColor,
            )
            .setRotation(projAngle)
            .setDepth(15);
        } else {
          // Default: circle (pooled)
          const circle = this.circlePool.acquire(
            proj.x,
            proj.y,
            projSize,
            projColor,
          );
          circle.setDepth(15);
          projVisual = circle;
        }

        this.projectileSpriteMap.set(id, projVisual);
      }
    }
  }

  private findNearestEnemy(): EnemyInstance | null {
    let nearest: EnemyInstance | null = null;
    let minDist = Infinity;
    const px = this.runState.player.x;
    const py = this.runState.player.y;

    for (const enemy of this.runState.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - px;
      const dy = enemy.y - py;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  // ── Projectile Update ──

  private updateProjectiles(dt: number): void {
    for (let i = this.runState.projectiles.length - 1; i >= 0; i--) {
      const proj = this.runState.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.lifetime -= dt;

      // Sync visual
      const visual = this.projectileSpriteMap.get(proj.id);
      if (visual) {
        visual.setPosition(proj.x, proj.y);
        // Rotate non-circle shapes to face movement direction
        if (!(visual instanceof Phaser.GameObjects.Arc)) {
          visual.setRotation(Math.atan2(proj.vy, proj.vx));
        }
      }

      // Collision with enemies (squared distance — avoids Math.sqrt)
      let destroyed = false;
      for (const enemy of this.runState.enemies) {
        if (!enemy.active) continue;
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const hitRadius = proj.area + 20; // enemy body radius approximation

        if (distSq < hitRadius * hitRadius) {
          enemy.hp -= proj.damage;
          if (enemy.id.startsWith("boss")) {
            this.shakeState = triggerShake(this.shakeState, "boss_hit");
          }
          this.spawnDamageNumber(
            enemy.x,
            enemy.y - 40,
            proj.damage,
            proj.damage > 0,
          );

          // Update enemy HP bar
          const enemyVisual = this.enemySpriteMap.get(enemy.id);
          if (enemyVisual) {
            const ratio = Math.max(0, enemy.hp / enemy.maxHp);
            enemyVisual.hpBar.setDisplaySize(
              enemyVisual.hpBarBg.displayWidth * ratio,
              enemyVisual.hpBar.displayHeight,
            );
            enemyVisual.sprite.setTint(0xffffff);
            this.time.delayedCall(FEEDBACK.hitFlashDuration, () => {
              enemyVisual.sprite.clearTint();
            });
          }

          // Apply knockback
          const enemyDef = getEnemyDef(enemy.enemyId);
          const resist = enemyDef?.knockbackResist ?? 0;
          const kb = calculateKnockback(
            proj.damage,
            proj.x,
            proj.y,
            enemy.x,
            enemy.y,
            resist,
          );
          if (kb.magnitude > 0) {
            const existing = this.knockbackMap.get(enemy.id);
            if (existing) {
              existing.dx += kb.dx;
              existing.dy += kb.dy;
            } else {
              this.knockbackMap.set(enemy.id, { dx: kb.dx, dy: kb.dy });
            }
          }

          if (enemy.hp <= 0) {
            this.killEnemy(enemy);
          }

          proj.pierce--;
          if (proj.pierce < 0) {
            destroyed = true;
            break;
          }
        }
      }

      // Remove if expired or destroyed
      if (proj.lifetime <= 0 || destroyed) {
        swapRemove(this.runState.projectiles, i);
        if (visual) {
          if (visual instanceof Phaser.GameObjects.Arc) {
            this.circlePool.release(visual);
          } else {
            visual.destroy();
          }
          this.projectileSpriteMap.delete(proj.id);
        }
      }
    }
  }

  // ── Enemy Update ──

  private updateEnemies(dt: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;

    for (let i = this.runState.enemies.length - 1; i >= 0; i--) {
      const enemy = this.runState.enemies[i];
      if (!enemy.active) continue;

      // Boss phase modifiers (speed/damage scale per phase)
      const isBossEnemy = enemy.id.startsWith("boss");
      let speedMult = 1;
      let dmgMult = 1;
      if (isBossEnemy) {
        const phase = getBossPhase(enemy.enemyId, enemy.hp, enemy.maxHp);
        speedMult = phase.speedMultiplier;
        dmgMult = phase.damageMultiplier;
      }

      // Move toward player (apply chrono time scale to enemy speed)
      const chronoScale = getTimeScale(this.chronoState);
      const dx = px - enemy.x;
      const dy = py - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        const nx = dx / dist;
        const ny = dy / dist;
        enemy.x += nx * enemy.speed * speedMult * chronoScale * dt;
        enemy.y += ny * enemy.speed * speedMult * chronoScale * dt;
      }

      // Apply knockback displacement
      const kb = this.knockbackMap.get(enemy.id);
      if (kb) {
        enemy.x += kb.dx * dt * 10; // scale for frame-rate independence
        enemy.y += kb.dy * dt * 10;
        const decayed = applyKnockbackDecay(kb.dx, kb.dy, dt);
        if (decayed.dx === 0 && decayed.dy === 0) {
          this.knockbackMap.delete(enemy.id);
        } else {
          kb.dx = decayed.dx;
          kb.dy = decayed.dy;
        }
      }

      // Sync visual
      const visual = this.enemySpriteMap.get(enemy.id);
      if (visual) {
        visual.sprite.setPosition(enemy.x, enemy.y);
        visual.hpBarBg.setPosition(enemy.x, enemy.y + 60);
        visual.hpBar.setPosition(
          enemy.x - visual.hpBarBg.displayWidth / 2,
          enemy.y + 60,
        );
        // Flip to face player
        visual.sprite.setFlipX(enemy.x > px);
      }

      // Contact damage to player (bosses deal phase-scaled damage)
      if (dist < 30) {
        const effectiveDamage = Math.round(enemy.damage * dmgMult);
        const dmg = damagePlayer(this.runState, effectiveDamage);
        if (dmg > 0) {
          this.shakeState = triggerShake(this.shakeState, "hit");
          this.triggerFlash("player_hit");
          this.spawnDamageNumber(px, py - 40, dmg, false);
          this.audio.playPlayerHurt();
          // Interrupt any Dai Pai Dong interaction on damage
          for (const station of this.dpdStations) {
            if (station.interactionElapsedMs > 0) {
              station.interactionElapsedMs = 0;
              station.progressBar.setDisplaySize(0, 6);
            }
          }
        }
      }

      // Despawn if too far
      if (dist > SPAWN.despawnRadius) {
        this.removeEnemyVisual(enemy.id);
        swapRemove(this.runState.enemies, i);
      }
    }

    // Check if boss is dead → resume playing
    if (this.runState.phase === "boss") {
      const bossAlive = this.runState.enemies.some(
        (e) => e.active && e.id.startsWith("boss"),
      );
      if (!bossAlive) {
        resumePlaying(this.runState);
      }
    }
  }

  private killEnemy(enemy: EnemyInstance): void {
    enemy.active = false;
    this.knockbackMap.delete(enemy.id);
    this.shakeState = triggerShake(this.shakeState, "explosion");

    // Increment kill counter
    this.runState.kills += 1;
    this.comboState = registerKill(this.comboState);

    // Enemy death SFX
    this.audio.playEnemyDeath();

    // ── Neon Sign fragment drop ──
    if (shouldDropFragment(this.runState.kills)) {
      const fragType = getRandomFragmentType();
      const fragId = this.idGen.next("frag");
      const fragText = this.add
        .text(enemy.x, enemy.y, fragType, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: COLOR_STR.NEON_PINK,
          stroke: COLOR_STR.NEON_CYAN,
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(25);
      this.neonFragmentSprites.set(fragId, {
        text: fragText,
        x: enemy.x,
        y: enemy.y,
        lifetime: NEON_SIGNS.fragmentLifetimeMs / 1000,
      });
    }

    // ── Chrono gauge charge ──
    const isBossForChrono = enemy.id.startsWith("boss");
    const enemyDefForChrono = getEnemyDef(enemy.enemyId);
    const enemyType: "normal" | "elite" | "boss" = isBossForChrono
      ? "boss"
      : (enemyDefForChrono?.tier ?? 1) >= 3
        ? "elite"
        : "normal";
    this.chronoState = {
      ...this.chronoState,
      gauge: chargeGauge(
        this.chronoState.gauge,
        enemyType,
        this.chronoState.hasPassive,
      ),
    };

    // Score
    const enemyDef = getEnemyDef(enemy.enemyId);
    const isBoss = enemy.id.startsWith("boss");
    this.runState.score += isBoss ? 500 : (enemyDef?.xpDrop ?? 1) * 10;

    const tier = enemyDef?.tier ?? 1;
    const playerHpRatio = this.runState.player.hp / this.runState.player.maxHp;

    // Calculate drops using DropCalc
    const drops = calculateDrops(tier, isBoss, playerHpRatio);
    for (const drop of drops) {
      const dropX = enemy.x + (Math.random() - 0.5) * 20;
      const dropY = enemy.y + (Math.random() - 0.5) * 20;

      if (drop.type === "coin") {
        const coinId = this.idGen.next("coin");
        const coin: CoinDrop = {
          id: coinId,
          x: dropX,
          y: dropY,
          value: drop.value,
          lifetime: 8,
        };
        this.runState.coinDrops.push(coin);
        const coinVisual = this.circlePool.acquire(
          coin.x,
          coin.y,
          isBoss ? 7 : 4,
          COLORS.COIN_GOLD,
          0.95,
        );
        coinVisual.setDepth(5);
        this.coinSpriteMap.set(coinId, coinVisual);
      } else if (drop.type === "health") {
        const healthId = this.idGen.next("hp");
        const hp: HealthPickup = {
          id: healthId,
          x: dropX,
          y: dropY,
          value: drop.value,
          lifetime: 10,
        };
        this.runState.healthPickups.push(hp);
        const hpVisual = this.textPool.acquire(dropX, dropY, "❤", {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#ff4444",
        });
        hpVisual.setOrigin(0.5).setDepth(5);
        this.tweens.add({
          targets: hpVisual,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.healthSpriteMap.set(healthId, hpVisual);
      } else if (drop.type === "magnet_burst") {
        // Magnet burst: temporarily pull all drops toward player
        this.triggerMagnetBurst(drop.value);
      }
    }

    // Boss kill flash
    if (isBoss) {
      this.triggerFlash("boss_kill");
    }

    // Spawn XP gem
    const xpValue = getXpGemValue(tier);
    const gemId = this.idGen.next("gem");
    const gem: XpGem = {
      id: gemId,
      x: enemy.x,
      y: enemy.y,
      value: isBoss ? (BOSSES[enemy.enemyId]?.xpDrop ?? xpValue) : xpValue,
      lifetime: FEEDBACK.xpGemLifetime / 1000,
    };
    this.runState.xpGems.push(gem);

    // Create gem visual — tier-based color + pulse tween
    const gemColor = isBoss
      ? COLORS.NEON_YELLOW // boss drop = gold (tier 3)
      : tier === 3
        ? COLORS.NEON_YELLOW // tier 3 elite = gold
        : tier === 2
          ? COLORS.NEON_CYAN // tier 2 mid = cyan
          : COLORS.NEON_GREEN; // tier 1 fodder = green
    const gemVisual = this.circlePool.acquire(gem.x, gem.y, 5, gemColor, 0.9);
    gemVisual.setDepth(5);
    this.tweens.add({
      targets: gemVisual,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      from: 0.8,
    });
    this.xpGemSpriteMap.set(gemId, gemVisual);

    // Loot table bonus drop
    const lootResult = selectLoot(
      ENEMY_LOOT_TABLE,
      this.runState.waveMinute,
      Math.random(),
    );
    if (lootResult) {
      const color = getRarityColor(lootResult.rarity);
      console.log(
        `[LootTable] Bonus drop: ${lootResult.id} (${lootResult.rarity}) color=0x${color.toString(16)}`,
      );
    }

    // Enemy death visual: play death animation if available, then fade out
    const visual = this.enemySpriteMap.get(enemy.id);
    if (visual) {
      const isBoss = enemy.id.startsWith("boss");
      const prefix = isBoss
        ? (BOSS_SPRITE_PREFIX[enemy.enemyId] ?? "boss")
        : (ENEMY_SPRITE_PREFIX[enemy.enemyId] ?? "enemy_grunt");
      const deathAnimKey = `${prefix}_death_anim`;

      // Hide HP bars immediately
      visual.hpBar.setAlpha(0);
      visual.hpBarBg.setAlpha(0);

      if (this.anims.exists(deathAnimKey)) {
        // Play death animation once, then destroy
        visual.sprite.play(deathAnimKey);
        visual.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.tweens.add({
            targets: visual.sprite,
            alpha: 0,
            duration: 150,
            onComplete: () => {
              this.removeEnemyVisual(enemy.id);
            },
          });
        });
      } else {
        // No death animation — fall back to simple fade
        this.tweens.add({
          targets: visual.sprite,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            this.removeEnemyVisual(enemy.id);
          },
        });
      }
    }

    // Remove from logical state
    const idx = this.runState.enemies.indexOf(enemy);
    if (idx >= 0) {
      swapRemove(this.runState.enemies, idx);
    }
  }

  private removeEnemyVisual(id: string): void {
    const visual = this.enemySpriteMap.get(id);
    if (visual) {
      visual.sprite.destroy();
      visual.hpBar.destroy();
      visual.hpBarBg.destroy();
      this.enemySpriteMap.delete(id);
    }
  }

  // ── XP Gem Update ──

  private updateXpGems(dt: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const magnetPassive = this.runState.player.passives.find(
      (p) => p.passiveId === "magnet",
    );
    const magnetBonus = magnetPassive
      ? PASSIVES.magnet.values[magnetPassive.level - 1]
      : 0;
    const magnetRadius = PLAYER_BASE.magnetRadius + magnetBonus;

    for (let i = this.runState.xpGems.length - 1; i >= 0; i--) {
      const gem = this.runState.xpGems[i];
      gem.lifetime -= dt;

      const dx = px - gem.x;
      const dy = py - gem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetize toward player
      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = 300;
        gem.x += (dx / dist) * pullSpeed * dt;
        gem.y += (dy / dist) * pullSpeed * dt;
      }

      // Pickup
      if (dist < 20) {
        grantXp(this.runState, gem.value);
        this.audio.playXpPickup();
        swapRemove(this.runState.xpGems, i);
        const visual = this.xpGemSpriteMap.get(gem.id);
        if (visual) {
          this.tweens.killTweensOf(visual);
          this.circlePool.release(visual);
          this.xpGemSpriteMap.delete(gem.id);
        }
        continue;
      }

      // Sync visual
      const visual = this.xpGemSpriteMap.get(gem.id);
      if (visual) {
        visual.setPosition(gem.x, gem.y);
      }

      // Despawn
      if (gem.lifetime <= 0) {
        swapRemove(this.runState.xpGems, i);
        if (visual) {
          this.tweens.killTweensOf(visual);
          this.circlePool.release(visual);
          this.xpGemSpriteMap.delete(gem.id);
        }
      }
    }
  }

  // ── Off-screen Indicators ──

  private createIndicators(): void {
    this.indicatorSprites = [];
    const MAX_INDICATORS = 8;
    for (let i = 0; i < MAX_INDICATORS; i++) {
      // Triangle pointing right (will be rotated toward enemy direction)
      const tri = this.add
        .triangle(0, 0, 0, -8, 16, 0, 0, 8, COLORS.NEON_PINK, 0.8)
        .setDepth(80)
        .setVisible(false);
      this.indicatorSprites.push(tri);
    }
  }

  private syncIndicators(): void {
    const indicators = calculateIndicators(
      this.runState.player.x,
      this.runState.player.y,
      this.runState.enemies,
      GAME_WIDTH,
      GAME_HEIGHT,
      800, // maxDistance
      this.indicatorSprites.length,
    );

    for (let i = 0; i < this.indicatorSprites.length; i++) {
      const tri = this.indicatorSprites[i];
      const data = indicators[i];
      if (data) {
        tri.setPosition(data.x, data.y);
        tri.setRotation(data.angle);
        tri.setFillStyle(
          data.isBoss ? COLORS.NEON_YELLOW : COLORS.NEON_PINK,
          0.8,
        );
        tri.setScale(data.isBoss ? 1.5 : 1);
        tri.setVisible(true);
      } else {
        tri.setVisible(false);
      }
    }
  }

  // ── Vignette (low HP warning) ──

  private createVignette(): void {
    this.vignetteOverlay = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0xff0000,
        0,
      )
      .setDepth(85)
      .setAlpha(0);
  }

  private syncVignette(): void {
    const alpha = getVignetteAlpha(
      this.runState.player.hp,
      this.runState.player.maxHp,
    );
    this.vignetteOverlay.setAlpha(alpha);
  }

  // ── Minimap ──

  private createMinimap(): void {
    const cfg = this.minimapConfig;
    const r = cfg.size / 2;

    // Circular background
    this.minimapBg = this.add
      .circle(cfg.centerX, cfg.centerY, r, 0x000000, 0.5)
      .setStrokeStyle(2, COLORS.NEON_CYAN, 0.6)
      .setDepth(90);

    // Player dot at center (always visible)
    this.minimapPlayerDot = this.add
      .circle(cfg.centerX, cfg.centerY, 3, COLORS.NEON_GREEN, 1)
      .setDepth(91);

    // Pre-create reusable dots (enemy dots pool)
    this.minimapDots = [];
    for (let i = 0; i < 30; i++) {
      const dot = this.add
        .circle(0, 0, 2, COLORS.NEON_PINK, 1)
        .setVisible(false)
        .setDepth(91);
      this.minimapDots.push(dot);
    }
  }

  private syncMinimap(): void {
    const cfg = this.minimapConfig;
    const px = this.runState.player.x;
    const py = this.runState.player.y;

    const dots = getEnemyDots(this.runState.enemies, px, py, cfg);

    // Update dot visuals
    for (let i = 0; i < this.minimapDots.length; i++) {
      const dot = this.minimapDots[i];
      if (i < dots.length) {
        const d = dots[i];
        dot.setPosition(d.screenX, d.screenY);
        dot.setFillStyle(
          d.type === "boss" ? COLORS.NEON_YELLOW : COLORS.NEON_PINK,
          d.isVisible ? 1 : 0.4,
        );
        dot.setRadius(d.type === "boss" ? 4 : 2);
        dot.setVisible(true);
      } else {
        dot.setVisible(false);
      }
    }
  }

  // ── HP Regen ──

  private applyRegen(dt: number): void {
    const player = this.runState.player;
    // Calculate regen from passive level
    const regenPassive = player.passives.find((p) => p.passiveId === "regen");
    const regenLevel = regenPassive?.level ?? 0;
    const regenRate = getRegenRate(regenLevel, 0);

    if (regenRate > 0 && player.hp < player.maxHp) {
      player.hp = calculateRegenTick(player.hp, player.maxHp, regenRate, dt);
    }
  }

  // ── Screen Flash ──

  private triggerFlash(event: FlashEvent): void {
    const config = getFlashForEvent(event);
    const flash = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        config.color,
        config.alpha,
      )
      .setDepth(150);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: config.duration,
      ease: "Sine.easeOut",
      onComplete: () => flash.destroy(),
    });

    if (config.shake) {
      this.cameras.main.shake(config.duration, config.shakeIntensity);
    }
  }

  // ── Coin Update ──

  private updateCoins(dt: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const magnetPassive = this.runState.player.passives.find(
      (p) => p.passiveId === "magnet",
    );
    const magnetBonus = magnetPassive
      ? PASSIVES.magnet.values[magnetPassive.level - 1]
      : 0;
    const magnetRadius = PLAYER_BASE.magnetRadius + magnetBonus;

    for (let i = this.runState.coinDrops.length - 1; i >= 0; i--) {
      const coin = this.runState.coinDrops[i];
      coin.lifetime -= dt;

      const dx = px - coin.x;
      const dy = py - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetize toward player
      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = 250;
        coin.x += (dx / dist) * pullSpeed * dt;
        coin.y += (dy / dist) * pullSpeed * dt;
      }

      // Pickup
      if (dist < 25) {
        this.runState.player.coins += coin.value;
        this.audio.playXpPickup(); // reuse pickup SFX
        swapRemove(this.runState.coinDrops, i);
        const visual = this.coinSpriteMap.get(coin.id);
        if (visual) {
          this.circlePool.release(visual);
          this.coinSpriteMap.delete(coin.id);
        }
        continue;
      }

      // Sync visual
      const visual = this.coinSpriteMap.get(coin.id);
      if (visual) {
        visual.setPosition(coin.x, coin.y);
      }

      // Despawn
      if (coin.lifetime <= 0) {
        swapRemove(this.runState.coinDrops, i);
        if (visual) {
          this.circlePool.release(visual);
          this.coinSpriteMap.delete(coin.id);
        }
      }
    }
  }

  // ── Health Pickup Update ──

  private updateHealthPickups(dt: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const magnetPassive = this.runState.player.passives.find(
      (p) => p.passiveId === "magnet",
    );
    const magnetBonus = magnetPassive
      ? PASSIVES.magnet.values[magnetPassive.level - 1]
      : 0;
    const magnetRadius = PLAYER_BASE.magnetRadius + magnetBonus;

    for (let i = this.runState.healthPickups.length - 1; i >= 0; i--) {
      const hp = this.runState.healthPickups[i];
      hp.lifetime -= dt;

      const dx = px - hp.x;
      const dy = py - hp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetize
      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = 200;
        hp.x += (dx / dist) * pullSpeed * dt;
        hp.y += (dy / dist) * pullSpeed * dt;
      }

      // Pickup
      if (dist < 25) {
        const p = this.runState.player;
        const healed = Math.min(hp.value, p.maxHp - p.hp);
        p.hp += healed;
        if (healed > 0) {
          this.spawnDamageNumber(px, py - 50, healed, true);
        }
        swapRemove(this.runState.healthPickups, i);
        const visual = this.healthSpriteMap.get(hp.id);
        if (visual) {
          this.tweens.killTweensOf(visual);
          this.textPool.release(visual);
          this.healthSpriteMap.delete(hp.id);
        }
        continue;
      }

      // Sync visual
      const visual = this.healthSpriteMap.get(hp.id);
      if (visual) {
        visual.setPosition(hp.x, hp.y);
      }

      // Despawn
      if (hp.lifetime <= 0) {
        swapRemove(this.runState.healthPickups, i);
        if (visual) {
          this.tweens.killTweensOf(visual);
          this.textPool.release(visual);
          this.healthSpriteMap.delete(hp.id);
        }
      }
    }
  }

  // ── Magnet Burst ──

  private triggerMagnetBurst(radiusMultiplier: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const burstRadius = PLAYER_BASE.magnetRadius * radiusMultiplier;

    // Pull all gems, coins, health pickups toward player instantly
    const pullAll = (items: Array<{ x: number; y: number }>) => {
      for (const item of items) {
        const dx = px - item.x;
        const dy = py - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < burstRadius && dist > 1) {
          // Move 80% of the way toward player
          item.x += dx * 0.8;
          item.y += dy * 0.8;
        }
      }
    };

    pullAll(this.runState.xpGems);
    pullAll(this.runState.coinDrops);
    pullAll(this.runState.healthPickups);

    // Visual feedback: brief cyan flash
    const flash = this.add
      .circle(px, py, burstRadius, COLORS.NEON_CYAN, 0.15)
      .setDepth(50);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  // ── Pause ──

  private createPauseButton(): void {
    // 44×44 touch target — far right column, aligned with HP bar row
    const btnX = GAME_WIDTH - 24; // 24px from right edge
    const btnY = 38; // aligned with HP bar row, between timer rows

    // Hit-area rectangle (invisible, 44×44)
    const hitArea = this.add
      .rectangle(btnX, btnY, 44, 44, 0x000000, 0)
      .setDepth(92)
      .setInteractive({ useHandCursor: true });

    // Visible icon text
    this.pauseButton = this.add
      .text(btnX, btnY, "⏸", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.TEXT_WHITE,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(92)
      .setAlpha(0.7);

    hitArea.on("pointerdown", () => {
      this.togglePause();
    });
    hitArea.on("pointerover", () => {
      this.pauseButton.setAlpha(1);
    });
    hitArea.on("pointerout", () => {
      this.pauseButton.setAlpha(0.7);
    });
  }

  private createPauseOverlay(): void {
    this.pauseOverlay = this.add
      .container(0, 0)
      .setDepth(200)
      .setVisible(false);

    // Semi-transparent dim
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.65,
    );
    this.pauseOverlay.add(overlay);

    // Panel background
    const panelH = 480;
    const panel = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH - 80,
        panelH,
        COLORS.BG_PANEL,
        0.95,
      )
      .setStrokeStyle(2, COLORS.NEON_CYAN);
    this.pauseOverlay.add(panel);

    // "PAUSED" title
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, "PAUSED", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.pauseOverlay.add(title);

    // Stats labels (dynamic — updated when shown)
    const statStyle = {
      fontFamily: "monospace",
      fontSize: "20px",
      color: COLOR_STR.TEXT_GRAY,
    };

    const timeLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, "", statStyle)
      .setOrigin(0.5);
    const levelLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 35, "", statStyle)
      .setOrigin(0.5);
    const killLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", statStyle)
      .setOrigin(0.5);
    const scoreLabel = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35, "", statStyle)
      .setOrigin(0.5);
    this.pauseOverlay.add(timeLabel);
    this.pauseOverlay.add(levelLabel);
    this.pauseOverlay.add(killLabel);
    this.pauseOverlay.add(scoreLabel);

    // Audio toggle buttons
    const toggleStyle = {
      fontFamily: "monospace",
      fontSize: "20px",
      color: COLOR_STR.NEON_GREEN,
    };

    const bgmOn = !this.audio.isBgmMuted();
    this.bgmToggleText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 70,
        bgmOn ? "\ud83d\udd0a BGM: ON" : "\ud83d\udd07 BGM: OFF",
        {
          ...toggleStyle,
          color: bgmOn ? COLOR_STR.NEON_GREEN : COLOR_STR.TEXT_DIM,
        },
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const muted = this.audio.toggleBgm();
        this.bgmToggleText.setText(
          muted ? "\ud83d\udd07 BGM: OFF" : "\ud83d\udd0a BGM: ON",
        );
        this.bgmToggleText.setColor(
          muted ? COLOR_STR.TEXT_DIM : COLOR_STR.NEON_GREEN,
        );
      });
    this.pauseOverlay.add(this.bgmToggleText);

    const sfxOn = !this.audio.isSfxMuted();
    this.sfxToggleText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 105,
        sfxOn ? "\ud83d\udd0a SFX: ON" : "\ud83d\udd07 SFX: OFF",
        {
          ...toggleStyle,
          color: sfxOn ? COLOR_STR.NEON_GREEN : COLOR_STR.TEXT_DIM,
        },
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        const muted = this.audio.toggleSfx();
        this.sfxToggleText.setText(
          muted ? "\ud83d\udd07 SFX: OFF" : "\ud83d\udd0a SFX: ON",
        );
        this.sfxToggleText.setColor(
          muted ? COLOR_STR.TEXT_DIM : COLOR_STR.NEON_GREEN,
        );
      });
    this.pauseOverlay.add(this.sfxToggleText);

    // "TAP TO RESUME" hint
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, "TAP TO RESUME", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.pauseOverlay.add(hint);

    // Tapping the overlay itself resumes
    overlay.setInteractive().on("pointerdown", () => {
      if (this.isPaused) this.togglePause();
    });

    // Store stat text references at known indices so we can update them
    // Container children order: overlay(0), panel(1), title(2),
    // timeLabel(3), levelLabel(4), killLabel(5), scoreLabel(6),
    // bgmToggle(7), sfxToggle(8), hint(9)
  }

  private togglePause(): void {
    // Cannot pause during level-up or end screens
    const phase = this.runState.phase;
    if (phase === "level_up" || phase === "game_over" || phase === "victory")
      return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.pauseButton.setText("▶");

      // Update stat text before showing
      const statTexts = this.pauseOverlay.list as Phaser.GameObjects.Text[];
      const elapsed = this.runState.elapsed;
      const min = Math.floor(elapsed / 60);
      const sec = Math.floor(elapsed % 60);
      if (statTexts[3])
        statTexts[3].setText(`⏱  ${min}:${String(sec).padStart(2, "0")}`);
      if (statTexts[4])
        statTexts[4].setText(`⬆  Level ${this.runState.player.level}`);
      if (statTexts[5])
        statTexts[5].setText(`💀  Kills: ${this.runState.kills}`);
      if (statTexts[6])
        statTexts[6].setText(`★  Score: ${this.runState.score}`);

      // Sync audio toggle text
      const bgmMuted = this.audio.isBgmMuted();
      this.bgmToggleText.setText(
        bgmMuted ? "\ud83d\udd07 BGM: OFF" : "\ud83d\udd0a BGM: ON",
      );
      this.bgmToggleText.setColor(
        bgmMuted ? COLOR_STR.TEXT_DIM : COLOR_STR.NEON_GREEN,
      );
      const sfxMuted = this.audio.isSfxMuted();
      this.sfxToggleText.setText(
        sfxMuted ? "\ud83d\udd07 SFX: OFF" : "\ud83d\udd0a SFX: ON",
      );
      this.sfxToggleText.setColor(
        sfxMuted ? COLOR_STR.TEXT_DIM : COLOR_STR.NEON_GREEN,
      );

      this.pauseOverlay.setVisible(true);
      this.tweens.add({
        targets: this.pauseOverlay,
        alpha: { from: 0, to: 1 },
        duration: 180,
        ease: "Sine.easeOut",
      });
    } else {
      this.pauseButton.setText("⏸");
      this.tweens.add({
        targets: this.pauseOverlay,
        alpha: 0,
        duration: 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.pauseOverlay.setVisible(false);
          this.pauseOverlay.setAlpha(1);
        },
      });
    }
  }

  // ── Level-up effects ──

  /** Brief white flash + camera zoom punch when player levels up */
  private triggerLevelUpEffects(): void {
    this.triggerFlash("level_up");

    // Camera zoom punch: 1.0 → 1.02 → 1.0
    this.cameras.main.zoomTo(
      1.02,
      100,
      "Sine.easeOut",
      false,
      (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) {
          this.cameras.main.zoomTo(1.0, 100, "Sine.easeIn");
        }
      },
    );
  }

  // ── Level Up UI ──

  private createLevelUpUI(): void {
    this.levelUpContainer = this.add
      .container(0, 0)
      .setDepth(100)
      .setVisible(false);
  }

  private showLevelUpChoices(): void {
    this.isLevelUpShown = true;
    this.levelUpContainer.removeAll(true);
    this.levelUpContainer.setVisible(true);

    // Dim overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7,
    );
    this.levelUpContainer.add(overlay);

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, 200, "LEVEL UP!", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.levelUpContainer.add(title);

    // Generate choices — inject evolutions when eligible
    const choices = generateUpgradeChoices(
      this.runState.player.weapons,
      this.runState.player.passives,
    );

    // Check for available evolutions and inject as priority choice
    const evolutions = getAvailableEvolutions(
      this.runState.player.weapons,
      this.runState.player.passives,
    );
    if (evolutions.length > 0) {
      const evo = evolutions[0]; // offer the first available evolution
      const evoChoice: UpgradeChoice = {
        type: "evolution",
        id: evo.result,
        level: 1,
        isNew: true,
      };
      // Replace the last choice with the evolution
      if (choices.length > 0) {
        choices[choices.length - 1] = evoChoice;
      } else {
        choices.push(evoChoice);
      }
    }

    const startY = 380;
    const cardH = 160;
    const gap = 20;

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const cy = startY + i * (cardH + gap);

      // Card background
      const cardBg = this.add
        .rectangle(
          GAME_WIDTH / 2,
          cy,
          GAME_WIDTH - 80,
          cardH,
          COLORS.BG_PANEL,
          0.95,
        )
        .setStrokeStyle(
          2,
          choice.type === "evolution" ? COLORS.NEON_YELLOW : COLORS.NEON_CYAN,
        )
        .setInteractive({ useHandCursor: true });
      this.levelUpContainer.add(cardBg);

      // Choice label
      const labelColor =
        choice.type === "evolution"
          ? COLOR_STR.NEON_YELLOW
          : choice.type === "weapon"
            ? COLOR_STR.NEON_CYAN
            : COLOR_STR.NEON_GREEN;

      let displayName = choice.id;
      let description = "";

      if (choice.type === "weapon") {
        const wDef = WEAPONS[choice.id];
        if (wDef) {
          displayName = wDef.name;
          description = choice.isNew
            ? `NEW! ${wDef.description}`
            : `Level ${choice.level}`;
        }
      } else if (choice.type === "passive") {
        const pDef = PASSIVES[choice.id];
        if (pDef) {
          displayName = pDef.name;
          description = choice.isNew
            ? `NEW! ${pDef.description.replace("{v}", String(pDef.values[0]))}`
            : `Level ${choice.level} — ${pDef.description.replace("{v}", String(pDef.values[choice.level - 1]))}`;
        }
      } else {
        // Evolution — look up recipe by result id
        const evoRecipe = EVOLUTIONS.find((r) => r.result === choice.id);
        displayName = evoRecipe?.resultName ?? choice.id;
        description = evoRecipe
          ? `★ EVOLUTION ★ ${evoRecipe.description}`
          : "EVOLUTION!";
      }

      const nameText = this.add
        .text(GAME_WIDTH / 2, cy - 25, displayName.toUpperCase(), {
          fontFamily: "monospace",
          fontSize: "24px",
          color: labelColor,
        })
        .setOrigin(0.5);
      this.levelUpContainer.add(nameText);

      const descText = this.add
        .text(GAME_WIDTH / 2, cy + 20, description, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: COLOR_STR.TEXT_GRAY,
          wordWrap: { width: GAME_WIDTH - 120 },
        })
        .setOrigin(0.5);
      this.levelUpContainer.add(descText);

      // Type badge
      const badge = this.add
        .text(GAME_WIDTH / 2, cy + 50, choice.type.toUpperCase(), {
          fontFamily: "monospace",
          fontSize: "14px",
          color: labelColor,
        })
        .setOrigin(0.5)
        .setAlpha(0.6);
      this.levelUpContainer.add(badge);

      // Click handler
      cardBg.on("pointerdown", () => {
        this.applyUpgradeChoice(choice);
      });

      cardBg.on("pointerover", () => {
        cardBg.setStrokeStyle(3, COLORS.NEON_YELLOW);
      });
      cardBg.on("pointerout", () => {
        cardBg.setStrokeStyle(
          2,
          choice.type === "evolution" ? COLORS.NEON_YELLOW : COLORS.NEON_CYAN,
        );
      });
    }
  }

  private applyUpgradeChoice(choice: UpgradeChoice): void {
    if (choice.type === "weapon") {
      if (choice.isNew) {
        addWeapon(this.runState, choice.id);
      } else {
        upgradeWeapon(this.runState, choice.id);
      }
    } else if (choice.type === "passive") {
      if (choice.isNew) {
        addPassive(this.runState, choice.id);
      } else {
        upgradePassive(this.runState, choice.id);
      }
    }
    // Evolution: handled as adding a new weapon
    if (choice.type === "evolution") {
      addWeapon(this.runState, choice.id);
    }

    this.levelUpContainer.setVisible(false);
    this.isLevelUpShown = false;
    resumePlaying(this.runState);
  }

  // ── Banner ──

  private createBanner(): void {
    this.bannerText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: COLOR_STR.NEON_GREEN,
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(110);
  }

  private showBanner(msg: string, color: string): void {
    this.bannerText.setText(msg).setColor(color).setAlpha(1).setScale(0.5);

    this.tweens.add({
      targets: this.bannerText,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: this.bannerText,
        alpha: 0,
        duration: 400,
      });
    });
  }

  // ── VFX ──

  private spawnDamageNumber(
    x: number,
    y: number,
    dmg: number,
    isEnemyDmg: boolean,
  ): void {
    const color = isEnemyDmg ? COLOR_STR.NEON_YELLOW : "#ff4444";
    const txt = this.textPool.acquire(x, y, `${dmg}`, {
      fontFamily: "monospace",
      fontSize: "22px",
      color,
      stroke: "#000000",
      strokeThickness: 3,
    });
    txt.setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: txt,
      y: y - FEEDBACK.damageNumberRise,
      alpha: 0,
      duration: FEEDBACK.damageNumberDuration,
      ease: "Power1",
      onComplete: () => this.textPool.release(txt),
    });
  }

  // ── End Conditions ──

  private triggerGameOver(): void {
    this.shakeState = triggerShake(this.shakeState, "death");
    this.audio.stopBgm();
    this.audio.playPlayerDeath();
    this.showBanner("GAME OVER", COLOR_STR.NEON_PINK);
    this.triggerFlash("critical_hp");

    this.time.delayedCall(2500, () => {
      const coinsEarned = this.runState.player.coins;
      const data: GameOverData = {
        score: this.runState.score,
        victory: false,
        elapsed: this.runState.elapsed,
        level: this.runState.player.level,
        coinsEarned,
        kills: this.runState.kills,
        bossesKilled: this.runState.bossesSpawned.length,
        maxCombo: this.comboState.max,
      };
      this.scene.start(SCENE_KEYS.GAME_OVER, data);
    });
  }

  private triggerVictory(): void {
    this.audio.playVictory();
    this.showBanner("VICTORY!", COLOR_STR.NEON_GREEN);

    this.time.delayedCall(3000, () => {
      const coinsEarned = this.runState.player.coins;
      const data: GameOverData = {
        score: this.runState.score,
        victory: true,
        elapsed: this.runState.elapsed,
        level: this.runState.player.level,
        coinsEarned,
        kills: this.runState.kills,
        bossesKilled: this.runState.bossesSpawned.length,
        maxCombo: this.comboState.max,
      };
      this.scene.start(SCENE_KEYS.GAME_OVER, data);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // § NEON SIGN COMBO SYSTEM
  // ══════════════════════════════════════════════════════════════

  /**
   * Update neon fragment pickups — magnetize toward player, collect on contact.
   */
  private updateNeonFragments(dt: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const magnetPassive = this.runState.player.passives.find(
      (p) => p.passiveId === "magnet",
    );
    const magnetBonus = magnetPassive
      ? PASSIVES.magnet.values[magnetPassive.level - 1]
      : 0;
    const magnetRadius = PLAYER_BASE.magnetRadius + magnetBonus;

    const toDelete: string[] = [];

    for (const [fragId, frag] of this.neonFragmentSprites) {
      frag.lifetime -= dt;

      const dx = px - frag.x;
      const dy = py - frag.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetize toward player
      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = 280;
        frag.x += (dx / dist) * pullSpeed * dt;
        frag.y += (dy / dist) * pullSpeed * dt;
        frag.text.setPosition(frag.x, frag.y);
      }

      // Collect on contact
      if (dist < 25) {
        const fragChar = frag.text.text as FragmentType;
        const result = collectFragment(this.heldFragments, fragChar);
        this.heldFragments = result.held;

        if (result.combo) {
          // Combo triggered — create buff and show announcement
          const buff = createNeonBuff(result.combo);
          this.neonBuffs.push(buff);
          this.showBanner(result.combo.name, COLOR_STR.NEON_PINK);
        }

        frag.text.destroy();
        toDelete.push(fragId);
        continue;
      }

      // Despawn expired
      if (frag.lifetime <= 0) {
        frag.text.destroy();
        toDelete.push(fragId);
      }
    }

    for (const id of toDelete) {
      this.neonFragmentSprites.delete(id);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // § DAI PAI DONG STATIONS
  // ══════════════════════════════════════════════════════════════

  /**
   * Create food stall stations at generated positions.
   */
  private createDaiPaiDongStations(): void {
    const positions = generateStationPositions(
      GAME_WIDTH * 3, // map is larger than viewport
      GAME_HEIGHT * 3,
      DAI_PAI_DONG.stationCount,
    );

    this.dpdStations = [];

    for (const pos of positions) {
      const container = this.add.container(pos.x, pos.y).setDepth(8);

      // Semi-transparent stall rectangle
      const stall = this.add
        .rectangle(0, 0, 50, 40, COLORS.NEON_CYAN, 0.15)
        .setStrokeStyle(1, COLORS.NEON_CYAN, 0.4);
      container.add(stall);

      // Emoji label
      const label = this.add
        .text(0, -2, "🍜", {
          fontFamily: "monospace",
          fontSize: "24px",
        })
        .setOrigin(0.5);
      container.add(label);

      // Progress bar background
      const progressBg = this.add
        .rectangle(0, 28, 46, 6, COLORS.HP_BG)
        .setDepth(9)
        .setAlpha(0);

      // Progress bar fill
      const progressBar = this.add
        .rectangle(0 - 23, 28, 0, 6, COLORS.NEON_GREEN)
        .setOrigin(0, 0.5)
        .setDepth(9)
        .setAlpha(0);

      this.dpdStations.push({
        position: pos,
        lastUsedAt: -1,
        interactionElapsedMs: 0,
        visual: container,
        progressBar,
        progressBarBg: progressBg,
      });
    }
  }

  /**
   * Create the food buff indicator text near the HP bar.
   */
  private createDpdBuffIndicator(): void {
    this.dpdBuffIndicator = this.add
      .text(24, 78, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: COLOR_STR.NEON_GREEN,
      })
      .setDepth(91)
      .setAlpha(0);
  }

  /**
   * Update Dai Pai Dong station interactions each frame.
   */
  private updateDaiPaiDong(deltaMs: number): void {
    const px = this.runState.player.x;
    const py = this.runState.player.y;
    const now = this.runState.elapsed * 1000;

    for (const station of this.dpdStations) {
      // Check cooldown
      const available = isStationAvailable(
        station.lastUsedAt,
        now,
        DAI_PAI_DONG.stationCooldownMs,
      );

      // Visual: dim if on cooldown
      station.visual.setAlpha(available ? 1 : 0.3);

      if (!available) {
        station.interactionElapsedMs = 0;
        station.progressBar.setAlpha(0);
        station.progressBarBg.setAlpha(0);
        continue;
      }

      // Check proximity
      const interaction = getInteractionProgress(
        px,
        py,
        station.position.x,
        station.position.y,
        DAI_PAI_DONG.interactionRadiusPx,
        station.interactionElapsedMs,
      );

      if (interaction.inRange) {
        station.interactionElapsedMs += deltaMs;
        station.progressBar.setAlpha(1);
        station.progressBarBg.setAlpha(1);

        // Recalculate progress with updated elapsed
        const updatedProgress = getInteractionProgress(
          px,
          py,
          station.position.x,
          station.position.y,
          DAI_PAI_DONG.interactionRadiusPx,
          station.interactionElapsedMs,
        );

        station.progressBar.setDisplaySize(46 * updatedProgress.progress, 6);

        // Interaction complete
        if (updatedProgress.progress >= 1.0) {
          const food = serveFood(DAI_PAI_DONG.menu);
          this.dpdFoodBuffs = applyFoodBuff(this.dpdFoodBuffs, food);

          // Handle instant heal
          if (food.effect === "healPercent" && food.durationMs === 0) {
            const p = this.runState.player;
            const healAmount = Math.round(p.maxHp * food.value);
            const healed = Math.min(healAmount, p.maxHp - p.hp);
            p.hp += healed;
            if (healed > 0) {
              this.spawnDamageNumber(px, py - 50, healed, true);
            }
          }

          // Show food name
          this.showBanner(`${food.name} ${food.nameEn}`, COLOR_STR.NEON_GREEN);

          // Mark station as used
          station.lastUsedAt = now;
          station.interactionElapsedMs = 0;
          station.progressBar.setAlpha(0);
          station.progressBarBg.setAlpha(0);
        }
      } else {
        station.interactionElapsedMs = 0;
        station.progressBar.setDisplaySize(0, 6);
        station.progressBar.setAlpha(0);
        station.progressBarBg.setAlpha(0);
      }
    }

    // Update buff indicator near HP bar
    if (this.dpdFoodBuffs.length > 0) {
      const buff = this.dpdFoodBuffs[0];
      const remainSec = Math.ceil(buff.remainingMs / 1000);
      this.dpdBuffIndicator
        .setText(`🍜 ${buff.effect} ${remainSec}s`)
        .setAlpha(1);
    } else {
      this.dpdBuffIndicator.setAlpha(0);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // § CHRONO HACK
  // ══════════════════════════════════════════════════════════════

  /**
   * Create the chrono gauge HUD (bar at left side, below XP bar).
   */
  private createChronoHUD(): void {
    const gaugeY = 100;
    const gaugeW = 120;

    this.chronoGaugeBg = this.add
      .rectangle(24, gaugeY, gaugeW, 8, COLORS.HP_BG)
      .setOrigin(0, 0.5)
      .setDepth(91);

    this.chronoGaugeBar = this.add
      .rectangle(24, gaugeY, 0, 8, 0x4488ff)
      .setOrigin(0, 0.5)
      .setDepth(91);

    // Blue overlay for chrono active (covers whole screen)
    this.chronoOverlay = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x0044ff,
        0,
      )
      .setDepth(84);
  }

  /**
   * Create input handler for chrono activation.
   * Tap on upper half of screen (non-joystick area) to activate.
   */
  private createChronoInput(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isLevelUpShown || this.isPaused) return;

      // Only trigger from upper portion of screen (above joystick zone)
      if (pointer.y < GAME_HEIGHT * 0.4) {
        // Avoid the HUD area (top 80px) and pause button area
        if (pointer.y > HUD_H && pointer.x < GAME_WIDTH - 60) {
          if (canActivate(this.chronoState.gauge)) {
            this.chronoState = activate(this.chronoState);
            this.showBanner("CHRONO HACK!", "#4488ff");
          }
        }
      }
    });
  }

  /**
   * Tick chrono state each frame.
   */
  private updateChrono(deltaMs: number): void {
    if (isChronoActive(this.chronoState)) {
      this.chronoState = tickChrono(
        this.chronoState as ChronoActiveState,
        deltaMs,
      );
    }
  }

  /**
   * Sync chrono gauge bar and blue overlay.
   */
  private syncChronoHUD(): void {
    const gaugeRatio = this.chronoState.gauge / CHRONO_HACK.maxGauge;
    this.chronoGaugeBar.setDisplaySize(120 * gaugeRatio, 8);

    // Blue tint when active
    if (isChronoActive(this.chronoState)) {
      this.chronoOverlay.setAlpha(0.12);
    } else {
      this.chronoOverlay.setAlpha(0);
    }

    // Gauge bar color: blue normally, bright when full
    if (canActivate(this.chronoState.gauge)) {
      this.chronoGaugeBar.setFillStyle(0x66bbff);
    } else {
      this.chronoGaugeBar.setFillStyle(0x4488ff);
    }
  }
}
