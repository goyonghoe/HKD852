import Phaser from 'phaser';
import { BALANCE, VISUAL } from '../config/balance';
import { NEON, NEON_CSS, BG_COLOR } from '../config/colors';
import { ENEMY_DEFS } from '../config/enemies';
import { WEAPON_DEFS } from '../config/weapons';
import { PASSIVE_DEFS } from '../config/upgrades';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Projectile } from '../objects/Projectile';
import { WeaponSystem } from '../systems/WeaponSystem';
import { WaveDirector } from '../core/WaveDirector';
import { XpTable } from '../core/XpTable';
import { SpatialHash } from '../core/SpatialHash';
import { SeededRandom } from '../core/SeededRandom';
import { selectUpgrades } from '../core/UpgradeSelector';
import type { UpgradeChoice } from '../core/UpgradeSelector';
import type { WeaponInstance } from '../types/weapon';
import type { GamePhase, RunState } from '../types/game';
import { VFXManager } from '../utils/VFXManager';
import { DamageNumberManager } from '../ui/DamageNumber';
import { ARIAMessage } from '../ui/ARIAMessage';
import { SaveManager } from '../managers/SaveManager';
import { getMetaBonus } from '../core/MetaProgression';
import { PauseOverlay } from '../ui/PauseOverlay';
import { getRetroSFX } from '../audio/RetroSFX';
import { getRetroAudio } from '../audio/RetroAudio';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';

// Collision radius: enemy body (12) + projectile buffer (12)
const COLLISION_RADIUS = 24;
const COLLISION_RADIUS_SQ = COLLISION_RADIUS * COLLISION_RADIUS;
// Pre-allocated buffer for spatial hash queries
const QUERY_BUFFER = new Array<number>(128);

export class RunScene extends Phaser.Scene {
  // Systems
  private weaponSystem!: WeaponSystem;
  private waveDirector!: WaveDirector;
  private rng!: SeededRandom;
  private xpTable!: XpTable;
  private vfx!: VFXManager;
  private dmgNumbers!: DamageNumberManager;
  private ariaMsg!: ARIAMessage;
  private collisionHash!: SpatialHash;

  // Game objects
  private player!: Player;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles: { x: number; y: number; vy: number; damage: number; sprite: Phaser.GameObjects.Arc }[] = [];

  // Background
  private bgSprite?: Phaser.GameObjects.Image;

  // Cached active lists (rebuilt each frame, avoids getChildren() allocation)
  private activeEnemies: Enemy[] = [];
  private activeEnemyCount = 0;

  // State
  private phase: GamePhase = 'playing';
  private runState!: RunState;
  private weapons: WeaponInstance[] = [];
  private spawnEnded = false;
  private passiveCounts = new Map<string, number>();

  // Target point (user tap to prioritize attacks)
  private targetPoint: { x: number; y: number } | null = null;
  private targetReticle!: Phaser.GameObjects.Graphics;
  private targetClearEvent?: Phaser.Time.TimerEvent;

  // Base wall
  private baseWallGraphics!: Phaser.GameObjects.Graphics;
  private baseArmorMultiplier = 1;
  private shopArmorMultiplier = 1;  // track shop armor separately (C-02)

  // HUD elements
  private baseBar!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private killText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;

  // HUD dirty cache — only redraw when values change
  private prevBaseHpPct = -1;
  private prevXpPct = -1;
  private prevKills = -1;
  private prevLevel = -1;
  private prevTimerStr = '';
  private fpsUpdateTimer = 0;

  // Level up UI
  private upgradeContainer?: Phaser.GameObjects.Container;
  private autoSelectBarBg?: Phaser.GameObjects.Rectangle;
  private autoSelectBarFill?: Phaser.GameObjects.Rectangle;
  private autoSelectStartReal = 0;   // Date.now() — immune to timeScale
  private autoSelectBestChoice?: UpgradeChoice;

  // Speed control
  private gameSpeed = 1;
  private speedIndex = 0;
  private speedText!: Phaser.GameObjects.Text;

  // ARIA message triggers
  private ariaBossShown = false;
  private ariaBossWarningShown = false;
  private ariaLowHpShown = false;

  // Boss → stage clear sequencing (must complete level-ups first)
  private pendingStageClear = false;

  // Boss tracking
  private activeBoss: Enemy | null = null;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private prevBossHpPct = -1;

  // Pause
  private pauseOverlay!: PauseOverlay;

  // SFX throttle (key → last play time)
  private sfxThrottles = new Map<string, number>();

  // Mid-run shop
  private midShopShown = false;
  private shopContainer?: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private prevGold = -1;
  private shopAutoBarBg?: Phaser.GameObjects.Rectangle;
  private shopAutoBarFill?: Phaser.GameObjects.Rectangle;
  private shopAutoStartReal = 0;     // Date.now() — immune to timeScale
  private shopAutoBestAction?: { action: 'heal' | 'damage' | 'armor'; cost: number } | null;

  // Stage clear UI
  private stageClearContainer?: Phaser.GameObjects.Container;
  private stageText!: Phaser.GameObjects.Text;
  private prevStage = -1;

  // Stage difficulty multipliers (cumulative from balance config)
  private stageHpMult = 1;
  private stageSpeedMult = 1;
  private stageDamageMult = 1;
  private bossStageActive = false;  // true during boss-only stages
  private bossSpawnedThisStage = false;
  private metaXpBonus = 0;

  // Meta progression base values (preserved across passive stacking)
  private metaDamageBase = 0;
  private metaCritBase = 0;

  // Weapon slots HUD (right side, 4 fixed slots)
  private weaponSlotBgs: Phaser.GameObjects.Rectangle[] = [];
  private weaponSlotTexts: Phaser.GameObjects.Text[] = [];
  private prevWeaponSlotStr = '';

  // Player stats HUD (left side)
  private statsText!: Phaser.GameObjects.Text;
  private prevStatsStr = '';

  // Enemy overhead HP bars (elites + bosses)
  private enemyHpBarsGfx!: Phaser.GameObjects.Graphics;

  // Allies
  private allyLeftSprite!: Phaser.GameObjects.Sprite;
  private allyRightSprite!: Phaser.GameObjects.Sprite;
  private allySniperCooldown = 0;
  private allySpreadCooldown = 0;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.phase = 'playing';
    this.baseArmorMultiplier = 1;
    this.shopArmorMultiplier = 1;
    this.spawnEnded = false;
    this.targetPoint = null;
    this.passiveCounts.clear();
    this.activeEnemies = new Array(BALANCE.SPAWN.maxEnemiesOnScreen);
    this.activeEnemyCount = 0;
    // Clean up enemy projectiles from previous run
    for (const p of this.enemyProjectiles) p.sprite.destroy();
    this.enemyProjectiles = [];
    this.prevBaseHpPct = -1;
    this.prevXpPct = -1;
    this.prevKills = -1;
    this.prevLevel = -1;
    this.prevTimerStr = '';
    this.prevWeaponSlotStr = '';
    this.fpsUpdateTimer = 0;
    this.bgSprite = undefined; // reset destroyed sprite reference from previous run

    // Reset speed
    this.gameSpeed = 1;
    this.speedIndex = 0;
    this.physics.world.timeScale = 1;
    this.time.timeScale = 1;
    this.sfxThrottles.clear();

    // Fixed world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('combat');

    this.drawGrid();

    // Deterministic seed for this run (replay/debugging)
    const seed = (Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0;
    this.rng = new SeededRandom(seed);

    // Run state
    this.runState = {
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
      weapons: ['energy_shot'],
      passives: [],
    };
    this.stageHpMult = 1;
    this.stageSpeedMult = 1;
    this.stageDamageMult = 1;
    this.prevStage = -1;

    this.updateBackground();

    // Apply meta progression bonuses
    const meta = SaveManager.loadMeta();
    const metaDmg = getMetaBonus(meta, 'damage');
    const metaHp = getMetaBonus(meta, 'base_hp');
    const metaCrit = getMetaBonus(meta, 'crit_chance');
    this.metaXpBonus = getMetaBonus(meta, 'xp_bonus');
    this.runState.baseHp = Math.ceil(BALANCE.BASE.hp * (1 + metaHp));
    this.runState.baseMaxHp = this.runState.baseHp;

    // Store meta base values for passive stacking
    this.metaDamageBase = metaDmg;
    this.metaCritBase = metaCrit;

    // Player turret — FIXED at center
    this.player = new Player(this, GAME_WIDTH / 2);
    this.player.damageMultiplier = 1 + metaDmg;
    this.player.critChance = metaCrit;

    // Base wall
    this.baseWallGraphics = this.add.graphics().setDepth(10);
    this.drawBaseWall();

    // Target reticle
    this.targetReticle = this.add.graphics().setDepth(100).setAlpha(0);

    // Collision spatial hash
    this.collisionHash = new SpatialHash(64);

    // Object pools — NOTE: runChildUpdate = false for both (manual update)
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
      maxSize: 80, // Reduced from 200
      runChildUpdate: false,
    });

    // Systems — VFX + DmgNumbers must be created BEFORE WeaponSystem (C-02 fix)
    this.vfx = new VFXManager(this);
    this.dmgNumbers = new DamageNumberManager(this);
    this.weaponSystem = new WeaponSystem(this, {
      vfx: this.vfx,
      dmgNumbers: this.dmgNumbers,
      onEnemyDeath: (enemy: Enemy) => this.onEnemyDeath(enemy),
      onWeaponFire: () => this.playSfx('weaponFire', () => getRetroSFX().weaponFire(), 400),
    });
    this.waveDirector = new WaveDirector({
      initialDelayMs: BALANCE.SPAWN.initialDelayMs,
      baseIntervalMs: BALANCE.SPAWN.baseIntervalMs,
      minIntervalMs: BALANCE.SPAWN.minIntervalMs,
      intervalDecayPerMin: BALANCE.SPAWN.intervalDecayPerMin,
      eliteChanceBase: BALANCE.SPAWN.eliteChanceBase,
      eliteChancePerMin: BALANCE.SPAWN.eliteChancePerMin,
      bossTimeMinutes: Infinity, // boss stages are separate — never auto-spawn boss
    }, this.rng);
    const stage1Config = BALANCE.STAGE.stages[0];
    this.waveDirector.setEnemyPool(
      stage1Config.enemyPool ?? Object.keys(ENEMY_DEFS).filter(id => !id.startsWith('boss')),
    );
    this.xpTable = new XpTable(BALANCE.XP.basePerLevel, BALANCE.XP.growthFactor);
    this.ariaMsg = new ARIAMessage(this);
    this.ariaBossShown = false;
    this.ariaBossWarningShown = false;
    this.ariaLowHpShown = false;
    this.midShopShown = false;
    this.bossStageActive = false;
    this.bossSpawnedThisStage = false;
    this.pendingStageClear = false;
    this.activeBoss = null;
    this.prevBossHpPct = -1;
    this.prevGold = -1;

    // Initial weapon
    this.weapons = [
      { defId: 'energy_shot', level: 1, cooldownRemaining: 0 },
    ];

    // NO physics.add.overlap — we handle collision manually via SpatialHash

    // Allies
    this.createAllies();

    // Input: tap to set target priority
    this.input.on('pointerdown', this.onPointerDown, this);

    this.createHUD();

    // Pause overlay
    this.pauseOverlay = new PauseOverlay(this, {
      onResume: () => {
        this.phase = 'playing';
        this.physics.resume();
      },
      onMenu: () => {
        this.pauseOverlay.destroy();
        this.scene.start('MainMenuScene');
      },
    });

    // Pre-warm SFX singleton
    getRetroSFX();

    // Opening ARIA message
    this.ariaMsg.show('ARIA-01: 최적화체 감지... 구역 방어 개시');
  }

  update(_time: number, delta: number): void {
    // Auto-select bar animation + trigger during levelup (uses real time, immune to gameSpeed)
    if (this.phase === 'levelup' && this.autoSelectBarFill) {
      const elapsed = Date.now() - this.autoSelectStartReal;
      const progress = Math.min(elapsed / VISUAL.UI.autoSelectDelayMs, 1);
      const totalW = this.autoSelectBarBg?.width ?? 200;
      this.autoSelectBarFill.width = totalW * (1 - progress);
      if (progress >= 1 && this.autoSelectBestChoice) {
        this.applyUpgrade(this.autoSelectBestChoice);
      }
    }

    // Auto-select bar animation + trigger during shop (uses real time, immune to gameSpeed)
    if (this.phase === 'shop' && this.shopAutoBarFill) {
      const elapsed = Date.now() - this.shopAutoStartReal;
      const progress = Math.min(elapsed / VISUAL.UI.autoSelectDelayMs, 1);
      const totalW = this.shopAutoBarBg?.width ?? 200;
      this.shopAutoBarFill.width = totalW * (1 - progress);
      if (progress >= 1) {
        if (this.shopAutoBestAction) {
          this.applyShopChoice(this.shopAutoBestAction.action, this.shopAutoBestAction.cost);
        } else {
          this.closeShop();
        }
      }
    }

    if (this.phase !== 'playing') return;

    const scaledDelta = delta * this.gameSpeed;
    this.runState.runTime += scaledDelta;
    this.runState.stageTime += scaledDelta;

    // === PHASE 1: Build active enemy list + spatial hash (ONCE per frame) ===
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

    // === PHASE 2: Player aim ===
    const aimTarget = this.targetPoint ?? this.findNearestEnemyCached();
    if (aimTarget) {
      this.player.aimAt(aimTarget.x, aimTarget.y);
    } else {
      this.player.aimUp();
    }

    // === PHASE 3: Spawn ===
    const stageConfig = BALANCE.STAGE.stages[this.runState.stage - 1];
    if (this.bossStageActive) {
      // Boss stage: spawn boss once at start, no wave spawning
      if (!this.bossSpawnedThisStage) {
        this.bossSpawnedThisStage = true;
        const bossId = stageConfig?.bossId ?? 'boss';
        this.spawnEnemies(bossId, 1, false);
        getRetroAudio().switchTrack('boss');
        this.ariaMsg.show(`ARIA-01: 상위 최적화체 접근... 저항은 비효율적이다`);
        this.vfx.screenShake(0.01, 400);
        getRetroSFX().deploy();
      }
    } else if (!this.spawnEnded) {
      // Wave stage: timed spawning
      const duration = stageConfig?.durationMs ?? 60000;
      if (this.runState.stageTime >= duration) {
        this.spawnEnded = true;
      } else {
        const commands = this.waveDirector.update(scaledDelta);
        for (const cmd of commands) {
          this.spawnEnemies(cmd.enemyId, cmd.count, cmd.isElite);
        }
      }
    }

    // === PHASE 3b: Mid-run shop trigger (wave stages only, once per stage) ===
    if (!this.bossStageActive && !this.midShopShown && this.runState.stageTime >= BALANCE.MID_SHOP.triggerTimeMs) {
      this.midShopShown = true;
      this.showMidRunShop();
      return; // pause update loop during shop
    }

    // === PHASE 4: Enemy movement + attack logic + flash ===
    const px = this.player.x;
    const py = this.player.y;
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const enemy = this.activeEnemies[i];
      enemy.updateFlash(scaledDelta);

      if (enemy.isAttackingBase) {
        // Melee: already at base, periodic attacks
        if (enemy.shouldAttack(scaledDelta)) {
          this.applyBaseDamage(enemy);
          if (this.phase !== 'playing') return; // game-over guard
        }
        continue;
      }

      if (enemy.attackStyle === 'ranged' && enemy.isRangedStopped) {
        // Ranged: stopped at firing position, shoot projectiles
        enemy.applyMovement(scaledDelta, px, py); // slight sway
        if (enemy.shouldShoot(scaledDelta)) {
          this.spawnEnemyProjectile(enemy);
        }
        continue;
      }

      enemy.applyMovement(scaledDelta, px, py);

      // Boss ranged: shoot while orbiting (boss_circle in orbit phase)
      if (enemy.attackStyle === 'ranged' && enemy.circlePhase === 'orbit') {
        if (enemy.shouldShoot(scaledDelta)) {
          this.spawnEnemyProjectile(enemy);
        }
      }

      if (enemy.y >= BALANCE.BASE.y) {
        this.onEnemyReachedBase(enemy);
        if (this.phase !== 'playing') return; // game-over guard
      }
    }

    // === PHASE 4b: Enemy projectile update ===
    this.updateEnemyProjectiles(scaledDelta);

    // Guard: game-over may have been triggered during enemy/projectile phases
    if (this.phase !== 'playing') return;

    // === PHASE 5: Weapon auto-fire ===
    this.weaponSystem.update(
      scaledDelta,
      this.player,
      this.weapons,
      this.enemyGroup,
      this.projectileGroup,
      this.targetPoint,
    );

    // === PHASE 5b: Ally auto-fire ===
    this.updateAllies(scaledDelta);

    // === PHASE 6: Collision detection via SpatialHash ===
    // NOTE: Projectile.preUpdate() is called automatically by Phaser's Group update.
    // Do NOT call it manually here — that causes double-speed expiry/homing (C-01 fix).
    this.resolveCollisions();

    // === PHASE 8: VFX particle update (manual, no tweens) ===
    this.vfx.update(scaledDelta);
    this.vfx.updateGlitch(scaledDelta, this.runState.baseHp / this.runState.baseMaxHp);
    this.dmgNumbers.update(scaledDelta);

    // === PHASE 9: Base regen ===
    this.applyBaseRegen(scaledDelta);

    // === PHASE 10: HUD (dirty-flag, only redraws on change) ===
    this.updateHUD(delta);

    // === PHASE 10b: ARIA messages ===
    this.ariaMsg.update(scaledDelta);
    this.checkARIATriggers();

    // === PHASE 11: Victory check ===
    // Boss stage: boss death triggers clear (handled in onEnemyDeath)
    // Wave stage: spawn ended + all enemies dead
    if (!this.bossStageActive && this.spawnEnded && this.activeEnemyCount === 0) {
      if (this.runState.stage < BALANCE.STAGE.maxStages) {
        this.showStageClear();
      } else {
        this.onRunComplete(true);
      }
    }
  }

  // === COLLISION (SpatialHash-based, replaces physics.overlap) ===

  private resolveCollisions(): void {
    const projChildren = this.projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (!proj.active) continue;

      const count = this.collisionHash.queryRadiusInto(
        proj.x, proj.y, COLLISION_RADIUS, QUERY_BUFFER,
      );

      for (let j = 0; j < count; j++) {
        const enemyIdx = QUERY_BUFFER[j];
        const enemy = this.activeEnemies[enemyIdx];
        if (!enemy || !enemy.active) continue;

        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        if (dx * dx + dy * dy < COLLISION_RADIUS_SQ) {
          this.onProjectileHitEnemy(proj, enemy);
          if (!proj.active) break; // projectile consumed
        }
      }
    }
  }

  // === INPUT ===

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.phase !== 'playing') return;

    // Ignore taps on HUD area (top-right: speed + pause + weapon list)
    if (pointer.x > GAME_WIDTH - 180 && pointer.y < 250) return;

    this.targetPoint = { x: pointer.x, y: pointer.y };
    this.drawTargetReticle(pointer.x, pointer.y);

    if (this.targetClearEvent) this.targetClearEvent.destroy();
    this.targetClearEvent = this.time.delayedCall(3000, () => {
      this.targetPoint = null;
      this.targetReticle.setAlpha(0);
    });
  }

  private drawTargetReticle(x: number, y: number): void {
    this.targetReticle.clear();
    this.targetReticle.setAlpha(0.6);
    this.targetReticle.lineStyle(2, NEON.UI_ACCENT, 0.8);
    this.targetReticle.strokeCircle(x, y, 20);
    this.targetReticle.moveTo(x - 28, y); this.targetReticle.lineTo(x - 12, y);
    this.targetReticle.moveTo(x + 12, y); this.targetReticle.lineTo(x + 28, y);
    this.targetReticle.moveTo(x, y - 28); this.targetReticle.lineTo(x, y - 12);
    this.targetReticle.moveTo(x, y + 12); this.targetReticle.lineTo(x, y + 28);
    this.targetReticle.strokePath();
  }

  // === SPEED CONTROL ===

  private cycleSpeed(): void {
    const options = BALANCE.GAME_SPEED.options;
    this.speedIndex = (this.speedIndex + 1) % options.length;
    this.gameSpeed = options[this.speedIndex];
    this.speedText.setText(`${this.gameSpeed}x`);
    this.physics.world.timeScale = this.gameSpeed;
    this.time.timeScale = this.gameSpeed;
  }

  private togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.physics.pause();
      this.pauseOverlay.show();
      getRetroSFX().tap();
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.physics.resume();
      this.pauseOverlay.hide();
    }
  }

  /** Throttled SFX — prevents audio overload from rapid events */
  private playSfx(key: string, fn: () => void, cooldownMs = 100): void {
    const now = this.time.now;
    const last = this.sfxThrottles.get(key) ?? 0;
    if (now - last >= cooldownMs) {
      this.sfxThrottles.set(key, now);
      fn();
    }
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

  // === SPAWN ===

  private spawnEnemies(defId: string, count: number, elite: boolean): void {
    const def = ENEMY_DEFS[defId] ?? ENEMY_DEFS['basic'];
    if (!def) return;
    const isBoss = defId.startsWith('boss');
    // Hard cap: skip spawn if already at max (bosses always spawn)
    if (!isBoss && this.activeEnemyCount >= BALANCE.SPAWN.maxEnemiesOnScreen) return;
    const minutes = this.waveDirector.getElapsedMinutes();
    // Clamp spawn count to remaining capacity (bosses bypass)
    const capacity = BALANCE.SPAWN.maxEnemiesOnScreen - this.activeEnemyCount;
    const actualCount = isBoss ? count : Math.min(count, Math.max(0, capacity));

    for (let i = 0; i < actualCount; i++) {
      const enemy = this.enemyGroup.get() as Enemy | null;
      if (!enemy) return;
      // Boss spawns at center-top for dramatic entrance
      const sx = isBoss ? GAME_WIDTH / 2 : Phaser.Math.Between(20, GAME_WIDTH - 20);
      const sy = isBoss ? -60 : BALANCE.SPAWN.spawnYMin +
        this.rng.next() * (BALANCE.SPAWN.spawnYMax - BALANCE.SPAWN.spawnYMin);
      enemy.activate(def, sx, sy, minutes, elite, this.stageHpMult, this.stageSpeedMult, this.stageDamageMult);
    }
  }

  // === COLLISION CALLBACKS ===

  private onProjectileHitEnemy(proj: Projectile, enemy: Enemy): void {
    if (!proj.active || !enemy.active) return;

    const dead = enemy.takeDamage(proj.damage);
    this.vfx.hitSpark(enemy.x, enemy.y);
    this.dmgNumbers.show(enemy.x, enemy.y, proj.damage, proj.isCrit);
    this.playSfx('hit', () => getRetroSFX().match(), 150);
    if (!dead) {
      enemy.applyKnockback(proj.x, proj.y);
    }

    proj.hitCount++;
    if (proj.hitCount > proj.piercing) {
      proj.deactivate();
    }

    if (dead) {
      this.onEnemyDeath(enemy);
    }
  }

  private onEnemyReachedBase(enemy: Enemy): void {
    // Boss bounces back instead of being deactivated (prevents softlock)
    if (enemy.defId.startsWith('boss')) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      enemy.y = BALANCE.BASE.y - 80;
      body.setVelocity(0, -enemy.speed * 2);
      this.vfx.screenShake(0.003, 100);
      return;
    }

    // Melee enemies: start periodic base attack (stay alive)
    if (enemy.attackStyle === 'melee') {
      enemy.y = BALANCE.BASE.y - 10; // position just above base
      enemy.startBaseAttack();
      this.applyBaseDamage(enemy); // first hit on contact
      return;
    }

    // Suicide enemies: deal damage + die (original behavior)
    this.applyBaseDamage(enemy);
    const color = (NEON as Record<string, number>)[enemy.colorKey] ?? NEON.ENEMY_BASIC;
    this.vfx.enemyDeath(enemy.x, BALANCE.BASE.y, color);
    enemy.deactivate();
  }

  /** Apply base damage from an enemy (shared by melee periodic + suicide impact) */
  private applyBaseDamage(enemy: Enemy): void {
    const actualDamage = Math.ceil(enemy.damage * this.baseArmorMultiplier);
    this.runState.baseHp = Math.max(0, this.runState.baseHp - actualDamage);
    this.flashBaseWall();
    this.vfx.screenShake(0.005, 150);
    this.dmgNumbers.show(enemy.x, BALANCE.BASE.y - 20, actualDamage, false);
    this.playSfx('baseHit', () => getRetroSFX().baseHit(), 500);

    if (this.runState.baseHp <= 0) {
      this.onRunComplete(false);
    }
  }

  /** Spawn an enemy projectile aimed at base wall */
  private spawnEnemyProjectile(enemy: Enemy): void {
    const sprite = this.add.circle(enemy.x, enemy.y, 6, 0xe94560).setDepth(50);
    this.enemyProjectiles.push({
      x: enemy.x,
      y: enemy.y,
      vy: enemy.projectileSpeed,
      damage: enemy.damage,
      sprite,
    });
    this.playSfx('enemyShoot', () => getRetroSFX().deploy(), 300);
  }

  /** Update enemy projectiles: move down, check base collision, remove offscreen */
  private updateEnemyProjectiles(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.y += p.vy * dt;
      p.sprite.setPosition(p.x, p.y);

      // Hit base wall
      if (p.y >= BALANCE.BASE.y) {
        const actualDamage = Math.ceil(p.damage * this.baseArmorMultiplier);
        this.runState.baseHp = Math.max(0, this.runState.baseHp - actualDamage);
        this.flashBaseWall();
        this.vfx.screenShake(0.003, 80);
        this.dmgNumbers.show(p.x, BALANCE.BASE.y - 20, actualDamage, false);
        this.playSfx('baseHit', () => getRetroSFX().baseHit(), 500);
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);

        if (this.runState.baseHp <= 0) {
          this.onRunComplete(false);
        }
        continue;
      }

      // Offscreen cleanup
      if (p.y > GAME_HEIGHT + 50) {
        p.sprite.destroy();
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // === ENEMY DEATH ===

  private onEnemyDeath(enemy: Enemy): void {
    this.runState.kills++;
    this.runState.gold += enemy.isElite
      ? BALANCE.RUN.goldPerElite
      : BALANCE.RUN.goldPerKill;
    this.playSfx('gold', () => getRetroSFX().goldCollect(), 200);
    this.runState.playerXp += Math.ceil(enemy.xpValue * (1 + this.metaXpBonus));
    this.playSfx('xp', () => getRetroSFX().xpCollect(), 100);
    SaveManager.discoverEnemy(enemy.defId);

    const color = (NEON as Record<string, number>)[enemy.colorKey] ?? NEON.ENEMY_BASIC;
    this.vfx.enemyDeath(enemy.x, enemy.y, color);

    // Boss gold bonus
    const isBossEnemy = enemy.defId.startsWith('boss');
    if (isBossEnemy) {
      this.runState.gold += BALANCE.RUN.goldPerBoss;
    }

    // Screen shake + SFX: boss > elite > normal
    if (isBossEnemy) {
      this.vfx.screenShake(0.008, 200);
      getRetroSFX().bossDefeat();
    } else if (enemy.isElite) {
      this.vfx.screenShake(0.004, 120);
    } else {
      this.vfx.screenShake(0.001, 60);
    }

    // Splitter: spawn 2 smaller children on death (once only)
    if (enemy.behavior === 'split_on_death' && !enemy.isSplitChild) {
      const def = ENEMY_DEFS[enemy.defId] ?? ENEMY_DEFS['basic'];
      for (let i = 0; i < 2; i++) {
        const child = this.enemyGroup.get() as Enemy | null;
        if (!child) break;
        const offsetX = i === 0 ? -20 : 20;
        child.activate(def, enemy.x + offsetX, enemy.y, this.waveDirector.getElapsedMinutes(), false, this.stageHpMult, this.stageSpeedMult, this.stageDamageMult);
        child.hp = Math.ceil(enemy.maxHp * 0.4);
        child.maxHp = child.hp;
        child.isSplitChild = true;
        child.setScale(0.6);
      }
    }

    enemy.deactivate();
    this.playSfx('kill', () => getRetroSFX().destroy(), 80);

    // Boss stage: boss death = stage clear (serialized: level-ups first, then stage clear)
    if (this.bossStageActive && isBossEnemy) {
      getRetroSFX().levelClear();
      this.pendingStageClear = true;
    }

    // Level up check — ONLY when still in 'playing' phase.
    // If another kill in the same frame already triggered levelup, skip here;
    // accumulated XP will be processed in applyUpgrade() chained level-up check.
    if (this.phase === 'playing') {
      while (
        this.runState.playerXp >= this.xpTable.required(this.runState.playerLevel)
      ) {
        this.runState.playerXp -= this.xpTable.required(this.runState.playerLevel);
        this.runState.playerLevel++;
        this.showLevelUpUI();
        break; // show one level-up at a time
      }
    }

    // If boss died but no level-up pending → show stage clear after VFX delay
    // CRITICAL: Pause physics to prevent new kills/level-ups during delay (C-03 fix)
    if (this.pendingStageClear && this.phase !== 'levelup') {
      this.pendingStageClear = false;
      this.physics.pause();
      this.time.delayedCall(500, () => {
        if (this.phase === 'gameover') return;
        if (this.runState.stage < BALANCE.STAGE.maxStages) {
          this.showStageClear();
        } else {
          this.onRunComplete(true);
        }
      });
    }
  }

  // === BASE WALL ===

  private drawBaseWall(): void {
    this.baseWallGraphics.clear();
    this.baseWallGraphics.fillStyle(NEON.UI_BORDER, 0.9);
    this.baseWallGraphics.fillRect(0, BALANCE.BASE.y, GAME_WIDTH, BALANCE.BASE.height);
    this.baseWallGraphics.lineStyle(2, NEON.UI_ACCENT, 1);
    this.baseWallGraphics.strokeRect(0, BALANCE.BASE.y, GAME_WIDTH, BALANCE.BASE.height);
  }

  private flashBaseWall(): void {
    this.baseWallGraphics.clear();
    this.baseWallGraphics.fillStyle(NEON.HEALTH, 1);
    this.baseWallGraphics.fillRect(0, BALANCE.BASE.y, GAME_WIDTH, BALANCE.BASE.height);
    this.time.delayedCall(BALANCE.BASE.damageFlashMs, () => {
      if (this.baseWallGraphics?.active) this.drawBaseWall();
    });
  }

  // === BASE REGEN ===

  private applyBaseRegen(delta: number): void {
    const level = this.passiveCounts.get('hp_regen') ?? 0;
    if (level === 0) return;
    const regenPerSec = PASSIVE_DEFS['hp_regen'].valuePerLevel * level;
    this.runState.baseHp = Math.min(
      this.runState.baseMaxHp,
      this.runState.baseHp + regenPerSec * (delta / 1000),
    );
  }

  // === LEVEL UP UI ===

  private showLevelUpUI(): void {
    this.phase = 'levelup';
    this.physics.pause();
    getRetroSFX().combo();

    const choices = selectUpgrades(
      this.weapons.map((w) => ({
        id: w.defId,
        level: w.level,
        maxLevel: WEAPON_DEFS[w.defId]?.maxLevel ?? 5,
      })),
      this.getPassiveLevels(),
      Object.keys(WEAPON_DEFS),
      Object.keys(PASSIVE_DEFS),
      Object.fromEntries(Object.entries(WEAPON_DEFS).map(([k, v]) => [k, v.name])),
      Object.fromEntries(
        Object.entries(PASSIVE_DEFS).map(([k, v]) => [k, { name: v.name, description: v.description }]),
      ),
      3,
      BALANCE.RUN.maxWeapons,
      this.rng,
    );
    this.createUpgradeCards(choices);
  }

  private getPassiveLevels(): { id: string; level: number; maxLevel: number }[] {
    return Array.from(this.passiveCounts.entries()).map(([id, level]) => ({
      id,
      level,
      maxLevel: PASSIVE_DEFS[id]?.maxLevel ?? 5,
    }));
  }

  private createUpgradeCards(choices: UpgradeChoice[]): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.upgradeContainer = this.add.container(cx, cy).setDepth(2000);
    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75);
    this.upgradeContainer.add(backdrop);

    const title = this.add
      .text(0, -GAME_HEIGHT * 0.3, '무기 선택!', {
        fontSize: '56px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.upgradeContainer.add(title);

    const cardW = VISUAL.UI.upgradeCardWidth;
    const cardH = VISUAL.UI.upgradeCardHeight;
    const gap = VISUAL.UI.upgradeCardGap;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = -totalW / 2 + cardW / 2;

    choices.forEach((choice, i) => {
      const cardX = startX + i * (cardW + gap);
      const bg = this.add
        .rectangle(cardX, 0, cardW, cardH, NEON.UI_PANEL)
        .setStrokeStyle(2, choice.isNew ? NEON.UI_ACCENT : NEON.UI_BORDER);

      const nameText = this.add
        .text(cardX, -70, choice.name, {
          fontSize: '24px', color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace', fontStyle: 'bold',
          wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const descText = this.add
        .text(cardX, -10, choice.description, {
          fontSize: '20px', color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const levelLabel = this.add
        .text(cardX, 70, choice.isNew ? '신규!' : `Lv ${choice.level}`, {
          fontSize: '22px',
          color: choice.isNew ? NEON_CSS.UI_ACCENT : NEON_CSS.GOLD,
          fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);

      this.upgradeContainer!.add([bg, nameText, descText, levelLabel]);

      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setStrokeStyle(3, NEON.UI_ACCENT))
        .on('pointerout', () =>
          bg.setStrokeStyle(2, choice.isNew ? NEON.UI_ACCENT : NEON.UI_BORDER))
        .on('pointerdown', () => this.applyUpgrade(choice));
    });

    // Auto-select timer bar
    const barW = totalW;
    const barH = 6;
    const barY = cardH / 2 + 20;
    this.autoSelectBarBg = this.add.rectangle(0, barY, barW, barH, 0x333355, 0.8);
    this.autoSelectBarFill = this.add.rectangle(-barW / 2, barY, barW, barH, NEON.UI_ACCENT, 0.9).setOrigin(0, 0.5);
    this.upgradeContainer!.add([this.autoSelectBarBg, this.autoSelectBarFill]);

    // Determine best choice — real-time auto-select (immune to gameSpeed)
    this.autoSelectBestChoice = this.scoreBestChoice(choices);
    this.autoSelectStartReal = Date.now();
  }

  private scoreBestChoice(choices: UpgradeChoice[]): UpgradeChoice {
    const scoreChoice = (c: UpgradeChoice): number => {
      let s = 0;
      if (c.type === 'weapon') {
        s += 100;
        if (!c.isNew) s += 50 + c.level * 10;
        const def = WEAPON_DEFS[c.id];
        if (def) s += def.baseDamage;
      } else {
        s += 50;
        if (!c.isNew) s += 30;
        if (c.id === 'damage' || c.id === 'crit_chance' || c.id === 'attack_speed') s += 20;
      }
      return s;
    };
    return choices.reduce((best, c) => scoreChoice(c) > scoreChoice(best) ? c : best);
  }

  private applyUpgrade(choice: UpgradeChoice): void {
    if (choice.type === 'weapon') {
      const existing = this.weapons.find((w) => w.defId === choice.id);
      if (existing) {
        existing.level = choice.level;
      } else {
        this.weapons.push({ defId: choice.id, level: 1, cooldownRemaining: 0 });
        this.runState.weapons.push(choice.id);
      }
      SaveManager.discoverWeapon(choice.id);
    } else {
      this.runState.passives.push(choice.id);
      const prev = this.passiveCounts.get(choice.id) ?? 0;
      this.passiveCounts.set(choice.id, prev + 1);
      this.applyPassiveEffect(choice.id);
    }

    // Clean up auto-select state
    this.autoSelectBarBg = undefined;
    this.autoSelectBarFill = undefined;
    this.autoSelectBestChoice = undefined;

    getRetroSFX().tap();
    this.upgradeContainer?.destroy();
    this.upgradeContainer = undefined;

    // Check for more pending level-ups before resuming
    if (this.runState.playerXp >= this.xpTable.required(this.runState.playerLevel)) {
      this.runState.playerXp -= this.xpTable.required(this.runState.playerLevel);
      this.runState.playerLevel++;
      this.showLevelUpUI(); // stay in levelup phase
      return;
    }

    // All level-ups resolved. Check pending stage clear (boss was killed).
    // CRITICAL: Must transition phase OUT of 'levelup' before scheduling showStageClear,
    // because showStageClear guards against phase === 'levelup' to prevent overlap.
    // Without this, boss clear + level-up = permanent softlock (M-014).
    if (this.pendingStageClear) {
      this.pendingStageClear = false;
      this.phase = 'playing'; // exit levelup phase — physics stays paused until stage clear
      this.time.delayedCall(300, () => {
        if (this.phase === 'gameover') return;
        if (this.runState.stage < BALANCE.STAGE.maxStages) {
          this.showStageClear();
        } else {
          this.onRunComplete(true);
        }
      });
      return; // don't resume physics — stage clear will handle it
    }

    // Normal resume
    this.physics.resume();
    this.phase = 'playing';
  }

  private applyPassiveEffect(passiveId: string): void {
    const def = PASSIVE_DEFS[passiveId];
    if (!def) return;
    const level = this.passiveCounts.get(passiveId) ?? 0;

    // C-01 fix: Add passive bonus ON TOP of meta progression base, not overwrite
    switch (def.effect) {
      case 'attack_speed':
        this.player.attackSpeedMultiplier = 1 + def.valuePerLevel * level;
        break;
      case 'damage':
        this.player.damageMultiplier = 1 + this.metaDamageBase + def.valuePerLevel * level;
        break;
      case 'base_armor': {
        const passiveArmor = Math.max(0.1, 1 - def.valuePerLevel * level);
        this.baseArmorMultiplier = passiveArmor * this.shopArmorMultiplier;
        break;
      }
      case 'crit_chance':
        this.player.critChance = this.metaCritBase + def.valuePerLevel * level;
        break;
      case 'crit_damage':
        this.player.critDamage = BALANCE.COMBAT.critMultiplier + def.valuePerLevel * level;
        break;
      // move_speed removed: player is a fixed turret
    }
  }

  // === STAGE CLEAR / NEXT STAGE ===

  private showStageClear(): void {
    if (this.phase === 'stage_clear' || this.phase === 'levelup' || this.phase === 'gameover') return;
    this.phase = 'stage_clear';
    this.physics.pause();
    getRetroSFX().levelClear();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.stageClearContainer = this.add.container(cx, cy).setDepth(2000);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.stageClearContainer.add(backdrop);

    const curConfig = BALANCE.STAGE.stages[this.runState.stage - 1];
    const clearTitle = this.bossStageActive
      ? `${curConfig?.name ?? 'BOSS'} 격파!`
      : `STAGE ${this.runState.stage} CLEAR`;

    const stageLabel = this.add
      .text(0, -80, clearTitle, {
        fontSize: '50px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.stageClearContainer.add(stageLabel);

    const healPct = BALANCE.STAGE.clearHealPercent;
    const infoText = this.add
      .text(0, 0, `기지 HP ${Math.round(healPct * 100)}% 회복`, {
        fontSize: '28px', color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace', align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5);
    this.stageClearContainer.add(infoText);

    const nextConfig = BALANCE.STAGE.stages[this.runState.stage]; // next stage (0-indexed)
    const nextLabel = this.add
      .text(0, 60, `다음: ${nextConfig?.name ?? 'FINAL'} (${this.runState.stage + 1}/${BALANCE.STAGE.maxStages})`, {
        fontSize: '28px', color: NEON_CSS.GOLD,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.stageClearContainer.add(nextLabel);

    // "다음 스테이지" button — player must tap to proceed
    const btnBg = this.add
      .rectangle(0, 150, 280, 60, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_ACCENT);
    const btnText = this.add
      .text(0, 150, '다음 스테이지', {
        fontSize: '30px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.stageClearContainer.add([btnBg, btnText]);

    btnBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => btnBg.setStrokeStyle(3, NEON.UI_ACCENT))
      .on('pointerout', () => btnBg.setStrokeStyle(2, NEON.UI_ACCENT))
      .on('pointerdown', () => {
        getRetroSFX().tap();
        this.nextStage();
      });
  }

  private nextStage(): void {
    // Cleanup stage clear UI
    this.stageClearContainer?.destroy();
    this.stageClearContainer = undefined;

    // Advance stage
    this.runState.stage++;
    this.runState.stageTime = 0;

    // Determine stage type
    const nextConfig = BALANCE.STAGE.stages[this.runState.stage - 1];
    this.bossStageActive = nextConfig?.type === 'boss';
    this.bossSpawnedThisStage = false;

    // Apply stage difficulty multipliers (cumulative, C-03 fix)
    const diff = BALANCE.STAGE.difficultyPerStage;
    this.stageHpMult = Math.pow(diff.hpMult, this.runState.stage - 1);
    this.stageSpeedMult = Math.pow(diff.speedMult, this.runState.stage - 1);
    this.stageDamageMult = Math.pow(diff.damageMult, this.runState.stage - 1);

    // Heal base
    const healAmount = Math.ceil(this.runState.baseMaxHp * BALANCE.STAGE.clearHealPercent);
    this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + healAmount);

    // Reset wave director for wave stages
    if (!this.bossStageActive) {
      this.waveDirector.reset();
      if (nextConfig?.enemyPool) {
        this.waveDirector.setEnemyPool(nextConfig.enemyPool);
      }
      getRetroAudio().switchTrack('combat');
    }

    // Update background for new stage area
    this.updateBackground();

    // Reset spawn state
    this.spawnEnded = false;
    this.pendingStageClear = false;
    this.ariaBossShown = false;
    this.ariaBossWarningShown = false;
    this.ariaLowHpShown = false;
    this.midShopShown = false;
    this.activeBoss = null;
    this.prevBossHpPct = -1;

    // Deactivate all remaining enemies (defensive: should already be 0, but prevents ghost sprites)
    const enemyChildren = this.enemyGroup.getChildren();
    for (let i = 0; i < enemyChildren.length; i++) {
      const enemy = enemyChildren[i] as Enemy;
      if (enemy.active) enemy.deactivate();
    }

    // Deactivate all remaining projectiles
    const projChildren = this.projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (proj.active) proj.deactivate();
    }

    // Clean up enemy projectiles
    for (const p of this.enemyProjectiles) p.sprite.destroy();
    this.enemyProjectiles = [];

    // Reset HUD dirty flags
    this.prevBaseHpPct = -1;
    this.prevXpPct = -1;
    this.prevStage = -1;
    this.prevGold = -1;

    // Resume
    this.physics.resume();
    this.phase = 'playing';
    const stageName = nextConfig?.name ?? `구역 ${this.runState.stage}`;
    if (this.bossStageActive) {
      this.ariaMsg.show(`ARIA-01: ${stageName} 감지... 경계 태세`);
    } else {
      this.ariaMsg.show(`ARIA-01: ${stageName} 침입 감지... 방어 태세 재편성`);
    }
  }

  // === ARIA MESSAGES ===

  private checkARIATriggers(): void {
    // Wave stage: boss pre-warning at 45s (no longer applies — boss has own stage)
    // Boss stage ARIA is handled in Phase 3 (boss spawn)

    // Low HP warning
    const hpPct = this.runState.baseHp / this.runState.baseMaxHp;
    if (hpPct < 0.3 && !this.ariaLowHpShown) {
      this.ariaLowHpShown = true;
      this.ariaMsg.show('ARIA-01: 방어 시스템 저하... 최적화 진행률 70%');
    }
  }

  // === MID-RUN SHOP ===

  private showMidRunShop(): void {
    this.phase = 'shop';
    this.physics.pause();
    getRetroSFX().tap();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.shopContainer = this.add.container(cx, cy).setDepth(2000);

    // Backdrop
    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    this.shopContainer.add(backdrop);

    // Title
    const title = this.add
      .text(0, -GAME_HEIGHT * 0.3, 'ARIA 보급 포인트', {
        fontSize: '42px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.shopContainer.add(title);

    // Gold display
    const goldLabel = this.add
      .text(0, -GAME_HEIGHT * 0.22, `보유 골드: ${this.runState.gold}G`, {
        fontSize: '28px', color: NEON_CSS.GOLD, fontFamily: 'monospace',
      }).setOrigin(0.5);
    this.shopContainer.add(goldLabel);

    const shop = BALANCE.MID_SHOP;
    const items = [
      {
        name: '기지 수리',
        desc: `기지 HP ${Math.round(shop.healBasePercent * 100)}% 회복`,
        cost: shop.healCost,
        action: 'heal' as const,
      },
      {
        name: '공격 강화',
        desc: `공격력 +${Math.round(shop.damageBoostPercent * 100)}%`,
        cost: shop.damageCost,
        action: 'damage' as const,
      },
      {
        name: '방어 강화',
        desc: `받는 피해 -${Math.round(shop.armorBoostPercent * 100)}%`,
        cost: shop.armorCost,
        action: 'armor' as const,
      },
    ];

    const cardW = 200;
    const cardH = 180;
    const gap = 16;
    const totalW = items.length * cardW + (items.length - 1) * gap;
    const startX = -totalW / 2 + cardW / 2;

    items.forEach((item, i) => {
      const cardX = startX + i * (cardW + gap);
      const canAfford = this.runState.gold >= item.cost;

      const bg = this.add
        .rectangle(cardX, 0, cardW, cardH, NEON.UI_PANEL)
        .setStrokeStyle(2, canAfford ? NEON.UI_ACCENT : NEON.UI_BORDER);

      const nameText = this.add
        .text(cardX, -50, item.name, {
          fontSize: '26px', color: canAfford ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
          fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);

      const descText = this.add
        .text(cardX, 0, item.desc, {
          fontSize: '20px', color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace', wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const costText = this.add
        .text(cardX, 50, `${item.cost}G`, {
          fontSize: '28px', color: canAfford ? NEON_CSS.GOLD : NEON_CSS.HEALTH,
          fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);

      this.shopContainer!.add([bg, nameText, descText, costText]);

      if (canAfford) {
        bg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => bg.setStrokeStyle(3, NEON.UI_ACCENT))
          .on('pointerout', () => bg.setStrokeStyle(2, NEON.UI_ACCENT))
          .on('pointerdown', () => this.applyShopChoice(item.action, item.cost));
      }
    });

    // Skip button
    const skipBg = this.add
      .rectangle(0, cardH / 2 + 60, 200, 50, NEON.UI_PANEL)
      .setStrokeStyle(1, NEON.UI_BORDER);
    const skipText = this.add
      .text(0, cardH / 2 + 60, '건너뛰기', {
        fontSize: '24px', color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    this.shopContainer.add([skipBg, skipText]);

    skipBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => skipBg.setStrokeStyle(2, NEON.UI_ACCENT))
      .on('pointerout', () => skipBg.setStrokeStyle(1, NEON.UI_BORDER))
      .on('pointerdown', () => this.closeShop());

    // Auto-select timer bar (same as level-up)
    const barW = totalW;
    const barH = 6;
    const barY = cardH / 2 + 110;
    this.shopAutoBarBg = this.add.rectangle(0, barY, barW, barH, 0x333355, 0.8);
    this.shopAutoBarFill = this.add.rectangle(-barW / 2, barY, barW, barH, NEON.UI_ACCENT, 0.9).setOrigin(0, 0.5);
    this.shopContainer!.add([this.shopAutoBarBg, this.shopAutoBarFill]);

    // Determine best affordable choice — real-time auto-select (immune to gameSpeed)
    this.shopAutoBestAction = this.scoreBestShopChoice(items);
    this.shopAutoStartReal = Date.now();
  }

  /** Pick the best affordable shop item: heal > damage > armor. */
  private scoreBestShopChoice(
    items: { name: string; desc: string; cost: number; action: 'heal' | 'damage' | 'armor' }[],
  ): { action: 'heal' | 'damage' | 'armor'; cost: number } | null {
    // Priority: heal if base HP < 70%, otherwise damage > armor
    const affordable = items.filter(it => this.runState.gold >= it.cost);
    if (affordable.length === 0) return null;

    const hpPct = this.runState.baseHp / this.runState.baseMaxHp;
    const heal = affordable.find(it => it.action === 'heal');
    if (heal && hpPct < 0.7) return { action: heal.action, cost: heal.cost };

    const dmg = affordable.find(it => it.action === 'damage');
    if (dmg) return { action: dmg.action, cost: dmg.cost };

    return { action: affordable[0].action, cost: affordable[0].cost };
  }

  private applyShopChoice(action: 'heal' | 'damage' | 'armor', cost: number): void {
    if (this.runState.gold < cost) return;
    this.runState.gold -= cost;

    const shop = BALANCE.MID_SHOP;
    switch (action) {
      case 'heal': {
        const healAmount = Math.ceil(this.runState.baseMaxHp * shop.healBasePercent);
        this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + healAmount);
        this.ariaMsg.show(`ARIA-01: 방어 시스템 ${Math.round(shop.healBasePercent * 100)}% 복구 완료`);
        break;
      }
      case 'damage':
        this.player.damageMultiplier *= (1 + shop.damageBoostPercent);
        this.ariaMsg.show(`ARIA-01: 화력 ${Math.round(shop.damageBoostPercent * 100)}% 증폭 적용`);
        break;
      case 'armor':
        this.shopArmorMultiplier *= (1 - shop.armorBoostPercent);
        this.baseArmorMultiplier = this.shopArmorMultiplier;
        // Recalculate with passive armor if any
        const armorLevel = this.passiveCounts.get('base_armor') ?? 0;
        if (armorLevel > 0) {
          const pDef = PASSIVE_DEFS['base_armor'];
          this.baseArmorMultiplier = Math.max(0.1, 1 - pDef.valuePerLevel * armorLevel) * this.shopArmorMultiplier;
        }
        this.ariaMsg.show(`ARIA-01: 방어막 ${Math.round(shop.armorBoostPercent * 100)}% 강화 적용`);
        break;
    }

    getRetroSFX().combo();
    this.closeShop();
  }

  private closeShop(): void {
    this.shopAutoBestAction = undefined;
    this.shopAutoBarBg = undefined;
    this.shopAutoBarFill = undefined;
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
    this.physics.resume();
    this.phase = 'playing';
  }

  // === GAME OVER / VICTORY ===

  private onRunComplete(survived: boolean): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.physics.pause();
    this.input.off('pointerdown', this.onPointerDown, this);

    // Clean up auto-select state (prevent update() callbacks after scene change)
    this.autoSelectBestChoice = undefined;
    this.autoSelectBarFill = undefined;
    this.shopAutoBestAction = undefined;
    this.shopAutoBarFill = undefined;

    this.activeBoss = null;
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
    this.stageClearContainer?.destroy();
    this.stageClearContainer = undefined;
    this.upgradeContainer?.destroy();
    this.upgradeContainer = undefined;

    if (survived) {
      getRetroSFX().levelClear();
    } else {
      getRetroSFX().gameOver();
    }

    // Delay scene transition slightly so SFX plays and frame completes cleanly
    this.time.delayedCall(100, () => {
      this.scene.start('GameOverScene', {
        survived,
        kills: this.runState.kills,
        gold: this.runState.gold,
        level: this.runState.playerLevel,
        timeMs: this.runState.runTime,
        baseHpRemaining: this.runState.baseHp,
        stage: this.runState.stage,
        maxStages: BALANCE.STAGE.maxStages,
      });
    });
  }

  // === HUD (dirty-flag: only redraws on value change) ===

  private createHUD(): void {
    this.baseBar = this.add.graphics().setScrollFactor(0).setDepth(1500);
    this.xpBar = this.add.graphics().setScrollFactor(0).setDepth(1500);

    // === Row 1 (y=16): Kill | Timer | [II][1x] ===
    this.killText = this.add
      .text(20, 16, '정화: 0', {
        fontSize: '24px', color: NEON_CSS.UI_TEXT, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    this.timerText = this.add
      .text(GAME_WIDTH / 2, 14, '1:00', {
        fontSize: '30px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500);

    // Pause button (top-right)
    this.add
      .rectangle(GAME_WIDTH - 50, 28, 60, 32, NEON.UI_PANEL, 0.9)
      .setStrokeStyle(1, NEON.UI_BORDER)
      .setScrollFactor(0).setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());
    this.add
      .text(GAME_WIDTH - 50, 28, 'II', {
        fontSize: '22px', color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1501);

    // Speed toggle button (bottom-right, large for easy tapping)
    this.add
      .rectangle(GAME_WIDTH - 70, BALANCE.BASE.y - 50, 100, 50, NEON.UI_PANEL, 0.85)
      .setStrokeStyle(2, NEON.UI_BORDER)
      .setScrollFactor(0).setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cycleSpeed());
    this.speedText = this.add
      .text(GAME_WIDTH - 70, BALANCE.BASE.y - 50, '1x', {
        fontSize: '28px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1501);

    // === Row 2 (y=44): Lv + Gold | Stage ===
    this.levelText = this.add
      .text(20, 44, 'Lv 1', {
        fontSize: '22px', color: NEON_CSS.UI_ACCENT, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    this.goldText = this.add
      .text(120, 44, 'G 0', {
        fontSize: '22px', color: NEON_CSS.GOLD, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    this.stageText = this.add
      .text(GAME_WIDTH / 2, 44, `Stage 1/${BALANCE.STAGE.maxStages}`, {
        fontSize: '22px', color: NEON_CSS.GOLD, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500);

    // === Row 3 (y=70): XP bar (drawn in updateHUD) ===
    // === Row 4 (y=84): Boss name (conditional) ===
    this.bossNameText = this.add
      .text(GAME_WIDTH / 2, 84, '', {
        fontSize: '20px', color: NEON_CSS.BOSS_WARNING, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500).setAlpha(0);

    // === Row 5 (y=102): Boss HP bar (conditional) ===
    this.bossHpBar = this.add.graphics().setScrollFactor(0).setDepth(1500).setAlpha(0);

    // === Left panel (y=96): Player stats ===
    this.statsText = this.add
      .text(14, 96, '', {
        fontSize: '18px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
        lineSpacing: 4,
      }).setScrollFactor(0).setDepth(1500);
    this.prevStatsStr = '';

    // === Right panel (y=96): 4 fixed weapon slots ===
    const slotW = 150;
    const slotH = 30;
    const slotGap = 4;
    const slotX = GAME_WIDTH - 10 - slotW / 2;
    this.weaponSlotBgs = [];
    this.weaponSlotTexts = [];
    for (let i = 0; i < BALANCE.RUN.maxWeapons; i++) {
      const sy = 96 + i * (slotH + slotGap) + slotH / 2;
      const bg = this.add
        .rectangle(slotX, sy, slotW, slotH, NEON.UI_PANEL, 0.4)
        .setStrokeStyle(1, NEON.UI_BORDER, 0.4)
        .setScrollFactor(0).setDepth(1500);
      const txt = this.add
        .text(slotX, sy, '---', {
          fontSize: '16px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
        })
        .setOrigin(0.5).setScrollFactor(0).setDepth(1501);
      this.weaponSlotBgs.push(bg);
      this.weaponSlotTexts.push(txt);
    }
    this.prevWeaponSlotStr = '';

    // Enemy overhead HP bars (world-space, moves with enemies)
    this.enemyHpBarsGfx = this.add.graphics().setDepth(200);

    this.fpsText = this.add
      .text(GAME_WIDTH - 20, GAME_HEIGHT - 50, '', {
        fontSize: '18px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(1500);
  }

  private updateHUD(rawDelta: number): void {
    // Base HP bar — only redraw on change
    const bPct = Math.round((this.runState.baseHp / this.runState.baseMaxHp) * 100);
    if (bPct !== this.prevBaseHpPct) {
      this.prevBaseHpPct = bPct;
      const bW = VISUAL.UI.baseBarWidth;
      const bH = VISUAL.UI.baseBarHeight;
      const bX = GAME_WIDTH / 2 - bW / 2;
      const bY = GAME_HEIGHT - 30;
      const pct = bPct / 100;
      this.baseBar.clear();
      this.baseBar.fillStyle(NEON.UI_PANEL, 0.9);
      this.baseBar.fillRect(bX, bY, bW, bH);
      const barColor = pct > 0.5 ? NEON.UI_ACCENT : pct > 0.25 ? NEON.GOLD : NEON.HEALTH;
      this.baseBar.fillStyle(barColor, 1);
      this.baseBar.fillRect(bX, bY, bW * pct, bH);
      this.baseBar.lineStyle(1, NEON.UI_BORDER, 0.8);
      this.baseBar.strokeRect(bX, bY, bW, bH);
    }

    // XP bar — only redraw on change
    const xpNeeded = this.xpTable.required(this.runState.playerLevel);
    const xpPct = Math.round((Math.min(this.runState.playerXp / xpNeeded, 1)) * 100);
    if (xpPct !== this.prevXpPct) {
      this.prevXpPct = xpPct;
      const xW = VISUAL.UI.xpBarWidth;
      const xH = VISUAL.UI.xpBarHeight;
      const xX = GAME_WIDTH / 2 - xW / 2;
      const xY = 70;
      this.xpBar.clear();
      this.xpBar.fillStyle(NEON.UI_PANEL, 0.8);
      this.xpBar.fillRect(xX, xY, xW, xH);
      this.xpBar.fillStyle(NEON.XP_BAR, 1);
      this.xpBar.fillRect(xX, xY, xW * (xpPct / 100), xH);
    }

    // Text — only update on change
    if (this.runState.kills !== this.prevKills) {
      this.prevKills = this.runState.kills;
      this.killText.setText(`정화: ${this.runState.kills}`);
    }

    if (this.runState.playerLevel !== this.prevLevel) {
      this.prevLevel = this.runState.playerLevel;
      this.levelText.setText(`Lv ${this.runState.playerLevel}`);
    }

    if (this.runState.gold !== this.prevGold) {
      this.prevGold = this.runState.gold;
      this.goldText.setText(`G ${this.runState.gold}`);
    }

    if (this.runState.stage !== this.prevStage) {
      this.prevStage = this.runState.stage;
      this.stageText.setText(`Stage ${this.runState.stage}/${BALANCE.STAGE.maxStages}`);
    }

    // Timer — countdown for wave stages, "BOSS" label for boss stages
    let timerStr: string;
    if (this.bossStageActive) {
      timerStr = 'BOSS';
    } else if (this.spawnEnded) {
      timerStr = `잔여: ${this.activeEnemyCount}`;
    } else {
      const curStageConfig = BALANCE.STAGE.stages[this.runState.stage - 1];
      const duration = curStageConfig?.durationMs ?? 60000;
      const remaining = Math.max(0, Math.ceil(
        (duration - this.runState.stageTime) / 1000,
      ));
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      timerStr = `${min}:${sec.toString().padStart(2, '0')}`;
    }
    if (timerStr !== this.prevTimerStr) {
      this.prevTimerStr = timerStr;
      this.timerText.setText(timerStr);
      if (this.bossStageActive) {
        this.timerText.setColor(NEON_CSS.GOLD);
      } else if (this.spawnEnded) {
        this.timerText.setColor(NEON_CSS.GOLD);
      } else {
        const curStageConfig = BALANCE.STAGE.stages[this.runState.stage - 1];
        const duration = curStageConfig?.durationMs ?? 60000;
        const remaining = Math.max(0, Math.ceil(
          (duration - this.runState.stageTime) / 1000,
        ));
        this.timerText.setColor(remaining <= 10 ? NEON_CSS.HEALTH : NEON_CSS.UI_TEXT);
      }
    }

    // Boss HP bar — show only when boss is alive
    if (this.activeBoss && this.activeBoss.active) {
      const bossPct = Math.round((this.activeBoss.hp / this.activeBoss.maxHp) * 100);
      if (bossPct !== this.prevBossHpPct) {
        this.prevBossHpPct = bossPct;
        const bW = 500;
        const bH = 12;
        const bX = GAME_WIDTH / 2 - bW / 2;
        const bY = 102;
        const pct = bossPct / 100;
        this.bossHpBar.clear();
        this.bossHpBar.fillStyle(NEON.UI_PANEL, 0.9);
        this.bossHpBar.fillRect(bX, bY, bW, bH);
        this.bossHpBar.fillStyle(NEON.HEALTH, 1);
        this.bossHpBar.fillRect(bX, bY, bW * pct, bH);
        this.bossHpBar.lineStyle(1, NEON.BOSS_WARNING, 0.8);
        this.bossHpBar.strokeRect(bX, bY, bW, bH);
        this.bossHpBar.setAlpha(1);
      }
      if (this.bossNameText.alpha === 0) {
        const bossNames: Record<string, string> = {
          boss_chase: '수호자',
          boss_circle: '회전자',
          boss_burst: '돌격자',
        };
        this.bossNameText.setText(bossNames[this.activeBoss.behavior] ?? '보스');
        this.bossNameText.setAlpha(1);
      }
    } else if (this.prevBossHpPct !== -1) {
      // Boss died — hide bar
      this.bossHpBar.clear();
      this.bossHpBar.setAlpha(0);
      this.bossNameText.setAlpha(0);
      this.prevBossHpPct = -1;
    }

    // Weapon slots — only update on change
    let weaponSlotStr = '';
    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      const def = WEAPON_DEFS[w.defId];
      weaponSlotStr += def ? `${def.name}:${w.level}|` : '';
    }
    if (weaponSlotStr !== this.prevWeaponSlotStr) {
      this.prevWeaponSlotStr = weaponSlotStr;
      for (let i = 0; i < BALANCE.RUN.maxWeapons; i++) {
        if (i < this.weapons.length) {
          const w = this.weapons[i];
          const def = WEAPON_DEFS[w.defId];
          if (def) {
            this.weaponSlotTexts[i].setText(`${def.name} Lv${w.level}`);
            this.weaponSlotTexts[i].setColor(NEON_CSS.UI_TEXT);
            this.weaponSlotBgs[i].setStrokeStyle(1, NEON.UI_ACCENT, 0.7);
            this.weaponSlotBgs[i].setFillStyle(NEON.UI_PANEL, 0.7);
          }
        } else {
          this.weaponSlotTexts[i].setText('---');
          this.weaponSlotTexts[i].setColor(NEON_CSS.UI_DIM);
          this.weaponSlotBgs[i].setStrokeStyle(1, NEON.UI_BORDER, 0.3);
          this.weaponSlotBgs[i].setFillStyle(NEON.UI_PANEL, 0.3);
        }
      }
    }

    // Player stats — only update on change
    const dmgMult = this.player.damageMultiplier;
    const spdMult = this.player.attackSpeedMultiplier;
    const critPct = Math.round(this.player.critChance * 100);
    const critDmg = this.player.critDamage;
    const statsStr =
      `DMG x${dmgMult.toFixed(1)}\n` +
      `SPD x${spdMult.toFixed(1)}\n` +
      `CRT ${critPct}%\n` +
      `CRT DMG x${critDmg.toFixed(1)}`;
    if (statsStr !== this.prevStatsStr) {
      this.prevStatsStr = statsStr;
      this.statsText.setText(statsStr);
    }

    // Enemy overhead HP bars (elites + bosses)
    this.enemyHpBarsGfx.clear();
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const e = this.activeEnemies[i];
      if (!e.isElite && !e.behavior.startsWith('boss_')) continue;
      if (e.hp >= e.maxHp) continue; // full HP — skip bar
      const barW = e.isElite ? 30 : 44;
      const barH = 4;
      const barX = e.x - barW / 2;
      const barY = e.y - (e.isElite ? 20 : 36);
      const pct = e.hp / e.maxHp;
      // Background
      this.enemyHpBarsGfx.fillStyle(0x000000, 0.6);
      this.enemyHpBarsGfx.fillRect(barX, barY, barW, barH);
      // Fill
      const barColor = pct > 0.5 ? NEON.XP_ORB : pct > 0.25 ? NEON.ENEMY_FAST : NEON.HEALTH;
      this.enemyHpBarsGfx.fillStyle(barColor, 1);
      this.enemyHpBarsGfx.fillRect(barX, barY, barW * pct, barH);
    }

    // FPS — update every 500ms to avoid per-frame text update
    this.fpsUpdateTimer += rawDelta;
    if (this.fpsUpdateTimer >= 500) {
      this.fpsUpdateTimer = 0;
      const fps = Math.round(this.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
      this.fpsText.setColor(fps >= 50 ? NEON_CSS.UI_DIM : fps >= 30 ? NEON_CSS.GOLD : NEON_CSS.HEALTH);
    }
  }

  // === ALLIES ===

  private createAllies(): void {
    this.allySniperCooldown = 0;
    this.allySpreadCooldown = 0;

    // Left ally: sniper (single-target, high damage)
    this.allyLeftSprite = this.add.sprite(
      BALANCE.ALLY.leftX,
      BALANCE.ALLY.baseY,
      'ally_sniper',
    ).setDepth(50);

    // Right ally: spread (multi-target, low damage)
    this.allyRightSprite = this.add.sprite(
      BALANCE.ALLY.rightX,
      BALANCE.ALLY.baseY,
      'ally_spread',
    ).setDepth(50);
  }

  private updateAllies(delta: number): void {
    // Sniper ally (left): single nearest enemy, high damage
    this.allySniperCooldown -= delta;
    if (this.allySniperCooldown <= 0 && this.activeEnemyCount > 0) {
      const target = this.findNearestEnemyFrom(
        this.allyLeftSprite.x, this.allyLeftSprite.y, BALANCE.ALLY.sniperRange,
      );
      if (target) {
        this.fireAllyProjectile(
          this.allyLeftSprite.x, this.allyLeftSprite.y,
          target.x, target.y,
          BALANCE.ALLY.sniperDamage,
          'projectile_laser',
        );
        this.allySniperCooldown = BALANCE.ALLY.sniperCooldownMs;
      }
    }

    // Spread ally (right): up to N nearest enemies, low damage
    this.allySpreadCooldown -= delta;
    if (this.allySpreadCooldown <= 0 && this.activeEnemyCount > 0) {
      const targets = this.findNearestEnemiesFrom(
        this.allyRightSprite.x, this.allyRightSprite.y,
        BALANCE.ALLY.spreadRange, BALANCE.ALLY.spreadCount,
      );
      if (targets.length > 0) {
        for (const t of targets) {
          this.fireAllyProjectile(
            this.allyRightSprite.x, this.allyRightSprite.y,
            t.x, t.y,
            BALANCE.ALLY.spreadDamage,
            'projectile_bullet',
          );
        }
        this.allySpreadCooldown = BALANCE.ALLY.spreadCooldownMs;
      }
    }
  }

  /** Find nearest enemy within range from a given point */
  private findNearestEnemyFrom(
    fx: number, fy: number, range: number,
  ): { x: number; y: number } | null {
    let nearest: Enemy | null = null;
    let minDistSq = range * range;
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const e = this.activeEnemies[i];
      const dx = e.x - fx;
      const dy = e.y - fy;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = e;
      }
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }

  /** Find up to N nearest enemies within range from a given point */
  private findNearestEnemiesFrom(
    fx: number, fy: number, range: number, maxCount: number,
  ): { x: number; y: number }[] {
    const rangeSq = range * range;
    const candidates: { x: number; y: number; dSq: number }[] = [];
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const e = this.activeEnemies[i];
      const dx = e.x - fx;
      const dy = e.y - fy;
      const dSq = dx * dx + dy * dy;
      if (dSq < rangeSq) {
        candidates.push({ x: e.x, y: e.y, dSq });
      }
    }
    candidates.sort((a, b) => a.dSq - b.dSq);
    return candidates.slice(0, maxCount);
  }

  /** Fire a projectile from an ally toward a target */
  private fireAllyProjectile(
    fromX: number, fromY: number,
    toX: number, toY: number,
    damage: number,
    texture: string,
  ): void {
    const proj = this.projectileGroup.get() as Projectile | null;
    if (!proj) return;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const speed = 500;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    proj.fire(fromX, fromY, vx, vy, damage, 0, 'ally', texture);
  }

  // === GRID BACKGROUND ===

  /** Show stage-appropriate background image (fallback: solid color only) */
  private static readonly BG_MAP: Record<number, string> = {
    1: 'bg_wanchai',      // 灣仔
    2: 'bg_central',      // 中環
    3: 'bg_aberdeen',     // 香港仔
    4: 'bg_mongkok',      // 旺角
    5: 'bg_shamshuipo',   // 深水埗
    6: 'bg_wongtaisin',   // 黃大仙
    7: 'bg_kowloon',      // 九龍城寨
    8: 'bg_lantau',       // 大嶼山
  };

  private updateBackground(): void {
    const bgKey = RunScene.BG_MAP[this.runState.stage] ?? 'bg_wanchai';
    if (!this.textures.exists(bgKey)) return;
    if (this.bgSprite) {
      this.bgSprite.setTexture(bgKey);
    } else {
      this.bgSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey)
        .setDepth(-1)
        .setAlpha(0.35);
    }
  }

  /** Clean up when scene shuts down (C-06 fix: prevent memory leaks on restart). */
  shutdown(): void {
    for (const p of this.enemyProjectiles) p.sprite.destroy();
    this.enemyProjectiles = [];
    this.weaponSystem?.clearCache();
    this.autoSelectBestChoice = undefined;
    this.shopAutoBestAction = undefined;
  }

  private drawGrid(): void {
    const g = this.add.graphics().setDepth(0);
    g.lineStyle(1, NEON.UI_BORDER, 0.15);
    const step = 64;
    for (let x = 0; x <= GAME_WIDTH; x += step) {
      g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += step) {
      g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
    }
    g.strokePath();
  }
}
