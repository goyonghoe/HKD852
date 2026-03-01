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
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';

// Collision radius: enemy body (12) + projectile buffer (12)
const COLLISION_RADIUS = 24;
const COLLISION_RADIUS_SQ = COLLISION_RADIUS * COLLISION_RADIUS;
// Pre-allocated buffer for spatial hash queries
const QUERY_BUFFER = new Array<number>(64);

export class RunScene extends Phaser.Scene {
  // Systems
  private weaponSystem!: WeaponSystem;
  private waveDirector!: WaveDirector;
  private xpTable!: XpTable;
  private vfx!: VFXManager;
  private dmgNumbers!: DamageNumberManager;
  private ariaMsg!: ARIAMessage;
  private collisionHash!: SpatialHash;

  // Game objects
  private player!: Player;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;

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

  // Speed control
  private gameSpeed = 1;
  private speedIndex = 0;
  private speedText!: Phaser.GameObjects.Text;

  // ARIA message triggers
  private ariaBossShown = false;
  private ariaBossWarningShown = false;
  private ariaLowHpShown = false;

  // Boss tracking
  private activeBoss: Enemy | null = null;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private prevBossHpPct = -1;

  // Orbit weapon
  private orbitSprites: Phaser.GameObjects.Sprite[] = [];
  private orbitAngle = 0;
  private orbitDamage = 0;
  private orbitRadius = 100;
  private orbitHitCooldowns = new Map<Enemy, number>();

  // Pause
  private pauseOverlay!: PauseOverlay;

  // SFX throttle (key → last play time)
  private sfxThrottles = new Map<string, number>();

  // Mid-run shop
  private midShopShown = false;
  private shopContainer?: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private prevGold = -1;

  // Stage clear UI
  private stageClearContainer?: Phaser.GameObjects.Container;
  private stageText!: Phaser.GameObjects.Text;
  private prevStage = -1;

  // Stage difficulty multiplier (cumulative from balance config)
  private stageDifficultyMult = 1;

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
    this.spawnEnded = false;
    this.targetPoint = null;
    this.passiveCounts.clear();
    this.activeEnemies = new Array(BALANCE.SPAWN.maxEnemiesOnScreen);
    this.activeEnemyCount = 0;
    this.prevBaseHpPct = -1;
    this.prevXpPct = -1;
    this.prevKills = -1;
    this.prevLevel = -1;
    this.prevTimerStr = '';
    this.fpsUpdateTimer = 0;

    // Reset speed
    this.gameSpeed = 1;
    this.speedIndex = 0;
    this.physics.world.timeScale = 1;
    this.time.timeScale = 1;
    this.sfxThrottles.clear();

    // Reset orbit
    this.orbitSprites.forEach((s) => s.destroy());
    this.orbitSprites = [];
    this.orbitAngle = 0;
    this.orbitDamage = 0;
    this.orbitHitCooldowns.clear();

    // Fixed world bounds
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.setScroll(0, 0);

    this.drawGrid();

    // Run state
    this.runState = {
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
    this.stageDifficultyMult = 1;
    this.prevStage = -1;

    // Apply meta progression bonuses
    const meta = SaveManager.loadMeta();
    const metaDmg = getMetaBonus(meta, 'damage');
    const metaHp = getMetaBonus(meta, 'base_hp');
    const metaSpeed = getMetaBonus(meta, 'move_speed');
    const metaCrit = getMetaBonus(meta, 'crit_chance');
    this.runState.baseHp = Math.ceil(BALANCE.BASE.hp * (1 + metaHp));
    this.runState.baseMaxHp = this.runState.baseHp;

    // Player turret — FIXED at center
    this.player = new Player(this, GAME_WIDTH / 2);
    this.player.damageMultiplier = 1 + metaDmg;
    this.player.moveSpeed = BALANCE.PLAYER.baseMoveSpeed * (1 + metaSpeed);
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

    // Systems
    this.weaponSystem = new WeaponSystem(this, {
      vfx: this.vfx,
      dmgNumbers: this.dmgNumbers,
      onEnemyDeath: (enemy: Enemy) => this.onEnemyDeath(enemy),
    });
    this.waveDirector = new WaveDirector({
      initialDelayMs: BALANCE.SPAWN.initialDelayMs,
      baseIntervalMs: BALANCE.SPAWN.baseIntervalMs,
      minIntervalMs: BALANCE.SPAWN.minIntervalMs,
      intervalDecayPerMin: BALANCE.SPAWN.intervalDecayPerMin,
      eliteChanceBase: BALANCE.SPAWN.eliteChanceBase,
      eliteChancePerMin: BALANCE.SPAWN.eliteChancePerMin,
      bossTimeMinutes: BALANCE.SPAWN.bossTimeMinutes,
    });
    this.waveDirector.setEnemyPool(
      Object.keys(ENEMY_DEFS).filter(id => !id.startsWith('boss')),
    );
    this.waveDirector.setBossId(BALANCE.STAGE.bossPerStage[0]);
    this.xpTable = new XpTable(BALANCE.XP.basePerLevel, BALANCE.XP.growthFactor);
    this.vfx = new VFXManager(this);
    this.dmgNumbers = new DamageNumberManager(this);
    this.ariaMsg = new ARIAMessage(this);
    this.ariaBossShown = false;
    this.ariaBossWarningShown = false;
    this.ariaLowHpShown = false;
    this.midShopShown = false;
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

    // === PHASE 3: Spawn (within stage duration only) ===
    if (!this.spawnEnded) {
      if (this.runState.stageTime >= BALANCE.STAGE.durationMs) {
        this.spawnEnded = true;
      } else {
        const commands = this.waveDirector.update(scaledDelta);
        for (const cmd of commands) {
          this.spawnEnemies(cmd.enemyId, cmd.count, cmd.isElite);
        }
      }
    }

    // === PHASE 3b: Mid-run shop trigger (once per stage) ===
    if (!this.midShopShown && this.runState.stageTime >= BALANCE.MID_SHOP.triggerTimeMs) {
      this.midShopShown = true;
      this.showMidRunShop();
      return; // pause update loop during shop
    }

    // === PHASE 4: Enemy movement + flash ===
    const px = this.player.x;
    const py = this.player.y;
    for (let i = 0; i < this.activeEnemyCount; i++) {
      const enemy = this.activeEnemies[i];
      enemy.applyMovement(scaledDelta, px, py);
      enemy.updateFlash(scaledDelta);
      if (enemy.y >= BALANCE.BASE.y) {
        this.onEnemyReachedBase(enemy);
      }
    }

    // === PHASE 5: Weapon auto-fire ===
    this.weaponSystem.update(
      scaledDelta,
      this.player,
      this.weapons,
      this.enemyGroup,
      this.projectileGroup,
      this.targetPoint,
    );

    // === PHASE 5b: Orbit weapon update ===
    this.updateOrbit(scaledDelta);

    // === PHASE 5c: Ally auto-fire ===
    this.updateAllies(scaledDelta);

    // === PHASE 6: Projectile update (manual, active only) ===
    const time = this.time.now;
    const projChildren = this.projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (proj.active) {
        proj.preUpdate(time, delta);
      }
    }

    // === PHASE 7: Collision detection via SpatialHash ===
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
    if (this.spawnEnded && this.activeEnemyCount === 0) {
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

    // Ignore taps on HUD button area (top-right: speed + pause)
    if (pointer.x > GAME_WIDTH - 180 && pointer.y < 100) return;

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
    // Hard cap: skip spawn if already at max
    if (this.activeEnemyCount >= BALANCE.SPAWN.maxEnemiesOnScreen) return;
    const minutes = this.waveDirector.getElapsedMinutes();
    // Clamp spawn count to remaining capacity
    const capacity = BALANCE.SPAWN.maxEnemiesOnScreen - this.activeEnemyCount;
    const actualCount = Math.min(count, capacity);

    for (let i = 0; i < actualCount; i++) {
      const enemy = this.enemyGroup.get() as Enemy | null;
      if (!enemy) return;
      const sx = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const sy = BALANCE.SPAWN.spawnYMin +
        Math.random() * (BALANCE.SPAWN.spawnYMax - BALANCE.SPAWN.spawnYMin);
      enemy.activate(def, sx, sy, minutes, elite, this.stageDifficultyMult);
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
    const actualDamage = Math.ceil(enemy.damage * this.baseArmorMultiplier);
    this.runState.baseHp = Math.max(0, this.runState.baseHp - actualDamage);
    this.flashBaseWall();
    this.vfx.screenShake(0.005, 150);
    this.playSfx('baseHit', () => getRetroSFX().benchRetreat(), 200);

    const color = (NEON as Record<string, number>)[enemy.colorKey] ?? NEON.ENEMY_BASIC;
    this.vfx.enemyDeath(enemy.x, BALANCE.BASE.y, color);
    enemy.deactivate();

    if (this.runState.baseHp <= 0) {
      this.onRunComplete(false);
    }
  }

  // === ENEMY DEATH ===

  private onEnemyDeath(enemy: Enemy): void {
    this.runState.kills++;
    this.runState.gold += enemy.isElite
      ? BALANCE.RUN.goldPerElite
      : BALANCE.RUN.goldPerKill;
    this.runState.playerXp += enemy.xpValue;

    const color = (NEON as Record<string, number>)[enemy.colorKey] ?? NEON.ENEMY_BASIC;
    this.vfx.enemyDeath(enemy.x, enemy.y, color);

    // Screen shake: boss > elite > normal
    if (enemy.behavior === 'boss_chase') {
      this.vfx.screenShake(0.008, 200);
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
        child.activate(def, enemy.x + offsetX, enemy.y, this.waveDirector.getElapsedMinutes(), false, this.stageDifficultyMult);
        child.hp = Math.ceil(enemy.maxHp * 0.4);
        child.maxHp = child.hp;
        child.isSplitChild = true;
        child.setScale(0.6);
      }
    }

    enemy.deactivate();
    this.playSfx('kill', () => getRetroSFX().destroy(), 80);

    // Level up check
    while (
      this.runState.playerXp >= this.xpTable.required(this.runState.playerLevel)
    ) {
      this.runState.playerXp -= this.xpTable.required(this.runState.playerLevel);
      this.runState.playerLevel++;
      this.showLevelUpUI();
      break;
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
      6,
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
      .text(0, -GAME_HEIGHT * 0.3, '원소 강화!', {
        fontSize: '48px',
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
          fontSize: '20px', color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace', fontStyle: 'bold',
          wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const descText = this.add
        .text(cardX, -10, choice.description, {
          fontSize: '16px', color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const levelLabel = this.add
        .text(cardX, 70, choice.isNew ? '신규!' : `Lv ${choice.level}`, {
          fontSize: '18px',
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
      if (choice.id === 'orbit_guard') this.syncOrbitSprites();
    } else {
      this.runState.passives.push(choice.id);
      const prev = this.passiveCounts.get(choice.id) ?? 0;
      this.passiveCounts.set(choice.id, prev + 1);
      this.applyPassiveEffect(choice.id);
    }

    getRetroSFX().tap();
    this.upgradeContainer?.destroy();
    this.upgradeContainer = undefined;
    this.physics.resume();
    this.phase = 'playing';

    while (
      this.runState.playerXp >= this.xpTable.required(this.runState.playerLevel)
    ) {
      this.runState.playerXp -= this.xpTable.required(this.runState.playerLevel);
      this.runState.playerLevel++;
      this.showLevelUpUI();
      break;
    }
  }

  private applyPassiveEffect(passiveId: string): void {
    const def = PASSIVE_DEFS[passiveId];
    if (!def) return;
    const level = this.passiveCounts.get(passiveId) ?? 0;

    switch (def.effect) {
      case 'attack_speed':
        this.player.attackSpeedMultiplier = 1 + def.valuePerLevel * level;
        break;
      case 'damage':
        this.player.damageMultiplier = 1 + def.valuePerLevel * level;
        break;
      case 'base_armor':
        this.baseArmorMultiplier = Math.max(0.1, 1 - def.valuePerLevel * level);
        break;
      case 'crit_chance':
        this.player.critChance = def.valuePerLevel * level;
        break;
      case 'crit_damage':
        this.player.critDamage = BALANCE.COMBAT.critMultiplier + def.valuePerLevel * level;
        break;
      case 'move_speed':
        this.player.moveSpeed = BALANCE.PLAYER.baseMoveSpeed * (1 + def.valuePerLevel * level);
        break;
    }
  }

  // === STAGE CLEAR / NEXT STAGE ===

  private showStageClear(): void {
    if (this.phase === 'stage_clear') return;
    this.phase = 'stage_clear';
    this.physics.pause();
    getRetroSFX().levelClear();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.stageClearContainer = this.add.container(cx, cy).setDepth(2000);

    const backdrop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.stageClearContainer.add(backdrop);

    const stageLabel = this.add
      .text(0, -80, `STAGE ${this.runState.stage} CLEAR`, {
        fontSize: '48px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.stageClearContainer.add(stageLabel);

    const healPct = BALANCE.STAGE.clearHealPercent;
    const infoText = this.add
      .text(0, 0, `기지 HP ${Math.round(healPct * 100)}% 회복\n다음 스테이지 준비 중...`, {
        fontSize: '24px', color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace', align: 'center',
        lineSpacing: 8,
      }).setOrigin(0.5);
    this.stageClearContainer.add(infoText);

    const nextLabel = this.add
      .text(0, 80, `STAGE ${this.runState.stage + 1} / ${BALANCE.STAGE.maxStages}`, {
        fontSize: '28px', color: NEON_CSS.GOLD,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.stageClearContainer.add(nextLabel);

    this.time.delayedCall(BALANCE.STAGE.clearPauseMs, () => {
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

    // Apply stage difficulty multiplier (cumulative)
    const diff = BALANCE.STAGE.difficultyPerStage;
    this.stageDifficultyMult = Math.pow(diff.hpMult, this.runState.stage - 1);

    // Heal base
    const healAmount = Math.ceil(this.runState.baseMaxHp * BALANCE.STAGE.clearHealPercent);
    this.runState.baseHp = Math.min(this.runState.baseMaxHp, this.runState.baseHp + healAmount);

    // Reset wave director for new stage
    this.waveDirector.reset();
    const bossId = BALANCE.STAGE.bossPerStage[this.runState.stage - 1] ?? 'boss';
    this.waveDirector.setBossId(bossId);

    // Reset spawn state
    this.spawnEnded = false;
    this.ariaBossShown = false;
    this.ariaBossWarningShown = false;
    this.ariaLowHpShown = false;
    this.midShopShown = false;
    this.activeBoss = null;
    this.prevBossHpPct = -1;

    // Deactivate all remaining projectiles
    const projChildren = this.projectileGroup.getChildren();
    for (let i = 0; i < projChildren.length; i++) {
      const proj = projChildren[i] as Projectile;
      if (proj.active) proj.deactivate();
    }

    // Reset HUD dirty flags
    this.prevBaseHpPct = -1;
    this.prevXpPct = -1;
    this.prevStage = -1;
    this.prevGold = -1;

    // Resume
    this.physics.resume();
    this.phase = 'playing';
    this.ariaMsg.show(`ARIA-01: 구역 ${this.runState.stage} 침입 감지... 방어 태세 재편성`);
  }

  // === ARIA MESSAGES ===

  private checkARIATriggers(): void {
    // Boss pre-warning (5s before boss spawn at ~45s)
    if (!this.ariaBossWarningShown && this.runState.stageTime >= 45000) {
      this.ariaBossWarningShown = true;
      this.ariaMsg.show('ARIA-01: 고위험 최적화체 접근 중...');
      this.vfx.screenShake(0.006, 300);
    }
    // Boss spawn
    if (this.waveDirector.isBossSpawned() && !this.ariaBossShown) {
      this.ariaBossShown = true;
      this.ariaMsg.show('ARIA-01: 상위 최적화체 접근... 저항은 비효율적이다');
      this.vfx.screenShake(0.01, 400);
      getRetroSFX().deploy();
    }
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
        fontSize: '36px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
    this.shopContainer.add(title);

    // Gold display
    const goldLabel = this.add
      .text(0, -GAME_HEIGHT * 0.22, `보유 골드: ${this.runState.gold}G`, {
        fontSize: '24px', color: NEON_CSS.GOLD, fontFamily: 'monospace',
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
          fontSize: '22px', color: canAfford ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
          fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);

      const descText = this.add
        .text(cardX, 0, item.desc, {
          fontSize: '16px', color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace', wordWrap: { width: cardW - 16 }, align: 'center',
        }).setOrigin(0.5);

      const costText = this.add
        .text(cardX, 50, `${item.cost}G`, {
          fontSize: '24px', color: canAfford ? NEON_CSS.GOLD : NEON_CSS.HEALTH,
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
        fontSize: '20px', color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    this.shopContainer.add([skipBg, skipText]);

    skipBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => skipBg.setStrokeStyle(2, NEON.UI_ACCENT))
      .on('pointerout', () => skipBg.setStrokeStyle(1, NEON.UI_BORDER))
      .on('pointerdown', () => this.closeShop());
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
        this.baseArmorMultiplier *= (1 - shop.armorBoostPercent);
        this.ariaMsg.show(`ARIA-01: 방어막 ${Math.round(shop.armorBoostPercent * 100)}% 강화 적용`);
        break;
    }

    getRetroSFX().combo();
    this.closeShop();
  }

  private closeShop(): void {
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
    this.physics.resume();
    this.phase = 'playing';
  }

  // === ORBIT WEAPON ===

  private updateOrbit(delta: number): void {
    if (this.orbitSprites.length === 0) return;

    const rotSpeed = 3; // radians per second
    this.orbitAngle += rotSpeed * (delta / 1000);

    const hitRadius = 28; // orbit sprite + enemy body
    const hitRadiusSq = hitRadius * hitRadius;
    const hitCooldownMs = 500; // ms between hits per enemy

    for (let i = 0; i < this.orbitSprites.length; i++) {
      const sprite = this.orbitSprites[i];
      const angle = this.orbitAngle + (Math.PI * 2 * i) / this.orbitSprites.length;
      sprite.setPosition(
        this.player.x + Math.cos(angle) * this.orbitRadius,
        this.player.y + Math.sin(angle) * this.orbitRadius,
      );
      sprite.setRotation(angle);

      // Collision with enemies
      for (let j = 0; j < this.activeEnemyCount; j++) {
        const enemy = this.activeEnemies[j];
        if (!enemy.active) continue;

        const dx = sprite.x - enemy.x;
        const dy = sprite.y - enemy.y;
        if (dx * dx + dy * dy >= hitRadiusSq) continue;

        // Per-enemy hit cooldown
        const lastHit = this.orbitHitCooldowns.get(enemy) ?? 0;
        const now = this.time.now;
        if (now - lastHit < hitCooldownMs) continue;
        this.orbitHitCooldowns.set(enemy, now);

        const dead = enemy.takeDamage(this.orbitDamage);
        this.vfx.hitSpark(enemy.x, enemy.y);
        if (dead) {
          this.onEnemyDeath(enemy);
        }
      }
    }

    // Clean stale cooldown entries
    if (this.orbitHitCooldowns.size > 50) {
      const now = this.time.now;
      for (const [enemy, t] of this.orbitHitCooldowns) {
        if (!enemy.active || now - t > hitCooldownMs * 2) {
          this.orbitHitCooldowns.delete(enemy);
        }
      }
    }
  }

  private syncOrbitSprites(): void {
    const weapon = this.weapons.find((w) => w.defId === 'orbit_guard');
    if (!weapon) return;

    const def = WEAPON_DEFS['orbit_guard'];
    if (!def) return;

    const count = def.projectileCount + Math.floor((weapon.level - 1) * 0.5);
    const levelMult = 1 + (weapon.level - 1) * 0.2;
    this.orbitDamage = Math.ceil(def.baseDamage * levelMult * this.player.damageMultiplier);
    this.orbitRadius = def.range + weapon.level * 10;

    // Add missing sprites
    while (this.orbitSprites.length < count) {
      const sprite = this.add.sprite(0, 0, 'projectile_orbit').setDepth(400);
      this.orbitSprites.push(sprite);
    }
    // Remove excess sprites
    while (this.orbitSprites.length > count) {
      const sprite = this.orbitSprites.pop()!;
      sprite.destroy();
    }
  }

  // === GAME OVER / VICTORY ===

  private onRunComplete(survived: boolean): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.physics.pause();
    this.input.off('pointerdown', this.onPointerDown, this);
    this.orbitSprites.forEach((s) => s.destroy());
    this.orbitSprites = [];
    this.allyLeftSprite?.destroy();
    this.allyRightSprite?.destroy();
    this.activeBoss = null;
    this.vfx.destroy();
    this.dmgNumbers.destroy();
    this.ariaMsg.destroy();
    this.pauseOverlay.destroy();
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
    this.stageClearContainer?.destroy();
    this.stageClearContainer = undefined;

    if (survived) {
      getRetroSFX().levelClear();
    } else {
      getRetroSFX().gameOver();
    }

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
  }

  // === HUD (dirty-flag: only redraws on value change) ===

  private createHUD(): void {
    this.baseBar = this.add.graphics().setScrollFactor(0).setDepth(1500);
    this.xpBar = this.add.graphics().setScrollFactor(0).setDepth(1500);

    this.killText = this.add
      .text(20, 20, '정화: 0', {
        fontSize: '22px', color: NEON_CSS.UI_TEXT, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    this.timerText = this.add
      .text(GAME_WIDTH / 2, 20, '1:00', {
        fontSize: '26px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500);

    this.goldText = this.add
      .text(200, 20, '💰 0', {
        fontSize: '20px', color: NEON_CSS.GOLD, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    this.stageText = this.add
      .text(GAME_WIDTH / 2, 50, `Stage 1/${BALANCE.STAGE.maxStages}`, {
        fontSize: '18px', color: NEON_CSS.GOLD, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500);

    this.levelText = this.add
      .text(20, 50, 'Lv 1', {
        fontSize: '18px', color: NEON_CSS.UI_ACCENT, fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1500);

    // Boss HP bar (hidden until boss spawns)
    this.bossHpBar = this.add.graphics().setScrollFactor(0).setDepth(1500).setAlpha(0);
    this.bossNameText = this.add
      .text(GAME_WIDTH / 2, 88, '', {
        fontSize: '16px', color: NEON_CSS.BOSS_WARNING, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1500).setAlpha(0);

    this.fpsText = this.add
      .text(GAME_WIDTH - 20, GAME_HEIGHT - 50, '', {
        fontSize: '14px', color: NEON_CSS.UI_DIM, fontFamily: 'monospace',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(1500);

    // Pause button
    this.add
      .rectangle(GAME_WIDTH - 130, 30, 50, 32, NEON.UI_PANEL, 0.9)
      .setStrokeStyle(1, NEON.UI_BORDER)
      .setScrollFactor(0).setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());

    this.add
      .text(GAME_WIDTH - 130, 30, 'II', {
        fontSize: '18px', color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1501);

    // Speed toggle button
    this.add
      .rectangle(GAME_WIDTH - 50, 30, 70, 32, NEON.UI_PANEL, 0.9)
      .setStrokeStyle(1, NEON.UI_BORDER)
      .setScrollFactor(0).setDepth(1500)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cycleSpeed());

    this.speedText = this.add
      .text(GAME_WIDTH - 50, 30, '1x', {
        fontSize: '18px', color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1501);
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
      const xY = 75;
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

    // Timer — countdown from stage duration
    let timerStr: string;
    if (this.spawnEnded) {
      timerStr = `잔여: ${this.activeEnemyCount}`;
    } else {
      const remaining = Math.max(0, Math.ceil(
        (BALANCE.STAGE.durationMs - this.runState.stageTime) / 1000,
      ));
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      timerStr = `${min}:${sec.toString().padStart(2, '0')}`;
    }
    if (timerStr !== this.prevTimerStr) {
      this.prevTimerStr = timerStr;
      this.timerText.setText(timerStr);
      if (this.spawnEnded) {
        this.timerText.setColor(NEON_CSS.GOLD);
      } else {
        const remaining = Math.max(0, Math.ceil(
          (BALANCE.STAGE.durationMs - this.runState.stageTime) / 1000,
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
        const bY = 105;
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
