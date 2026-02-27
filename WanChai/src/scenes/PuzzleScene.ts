import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { VISUAL, BALANCE, CUBE_SIZES } from '../config/balance';
import { ELEMENT_COLORS, RETRO } from '../config/colors';
import { LEVELS } from '../data/levels';
import { loadLevel, loadLevelForRoguelike, loadLevelForCombat, loadLevelForRoguelikeCombat } from '../core/LevelLoader';
import { TurnResolver } from '../core/TurnResolver';
import { CombatResolver } from '../core/CombatResolver';
import { CombatPassiveResolver } from '../core/CombatPassiveResolver';
import { CombatRelicResolver } from '../core/CombatRelicResolver';
import { PassiveResolver } from '../core/PassiveResolver';
import { ModifierResolver } from '../core/ModifierResolver';
import { RelicResolver } from '../core/RelicResolver';
import { RunManager } from '../core/RunManager';
import { EventBus } from '../managers/EventBus';
import { GameEvents } from '../types/events';
import { VFXManager } from '../utils/VFXManager';
import { BeltPath } from '../utils/BeltPath';
import { createGlassPanel } from '../ui/GlassPanel';
import { getRetroAudio } from '../audio/RetroAudio';
import { getRetroSFX } from '../audio/RetroSFX';
import { SaveManager } from '../managers/SaveManager';
import type { LevelData } from '../types/level';
import type { ElementColor, HeroInstance } from '../types/hero';
import type { BeltPosition, GravityEvent, StepResult, OrbitResult } from '../types/puzzle';
import type { RunState } from '../types/run';
import type { BlightData } from '../types/blight';
import type { CombatPlugin, CombatHook } from '../types/combat-hooks';
import type { CombatOrbitResult, CombatStepResult, CombatDeployResult } from '../core/CombatResolver';
import type { EnemyAttackEvent } from '../types/combat';

/** Belt hero display size (pixels) on the path */
const BELT_HERO_SIZE = 56;
const BELT_MARGIN = 16;
/** Kept for layout computation — defines track offset from cube grid */
const BELT_OFFSET = 44;

export class PuzzleScene extends Phaser.Scene {
  private resolver!: TurnResolver;
  private combatResolver: CombatResolver | null = null;
  private combatMode = false;
  private level!: LevelData;
  private levelId!: string;

  // Roguelike state
  private runState: RunState | null = null;
  private isRoguelike = false;
  private _roguelikeLevelData: LevelData | null = null;
  private _roguelikeHeroQueue: HeroInstance[] | null = null;
  private _roguelikeBlightMap: Map<string, BlightData> | null = null;

  // Combat mode sprites
  private enemySprites = new Map<string, Phaser.GameObjects.Container>();
  private enemyHpBars = new Map<string, { bg: Phaser.GameObjects.Rectangle; fill: Phaser.GameObjects.Rectangle }>();

  // Sprite containers
  private cubeSprites = new Map<string, Phaser.GameObjects.Image>();
  private cubeTexts = new Map<string, Phaser.GameObjects.Text>();
  private queueSprites: Phaser.GameObjects.Container[] = [];

  // Column-indexed hero sprite tracking for deploy animation
  private queueColumnSprites = new Map<number, Phaser.GameObjects.Container[]>();

  // Bench display
  private benchSlotSprites: Phaser.GameObjects.Arc[] = [];
  private benchCountText!: Phaser.GameObjects.Text;
  private benchFilledSprites: Phaser.GameObjects.Container[] = [];
  private benchHeroData: { slotIdx: number; heroId: string; element: ElementColor }[] = [];

  // Layout
  private boardCenterX = 0;
  private boardCenterY = 0;
  private cubeGridLeft = 0;
  private cubeGridTop = 0;
  private beltTop = 0;
  private beltBottom = 0;
  private beltLeft = 0;
  private beltRight = 0;
  private queueY = 0;
  private beltPosCoords: { x: number; y: number }[] = [];

  // Smooth belt path
  private beltPath!: BeltPath;

  // Concurrent deploy state
  private activeOrbits = new Map<string, Phaser.GameObjects.Container>();
  private deployLock = false;
  private pendingEndState: { gameOver: boolean; levelComplete: boolean; score: number; stars: number; gameOverReason?: string } | null = null;
  private gravityQueue: { events: GravityEvent[]; callback: () => void }[] = [];
  private isGravityRunning = false;

  // Belt highlight
  private currentHighlight: Phaser.GameObjects.Arc | null = null;

  private lastDeployTime = 0;
  private currentCombo = 0;
  private vfx!: VFXManager;
  private currentDeployElement: ElementColor | null = null;

  constructor() {
    super({ key: 'PuzzleScene' });
  }

  init(data: {
    levelId: string;
    runState?: RunState;
    levelData?: LevelData;
    heroQueue?: HeroInstance[];
    blightMap?: Map<string, BlightData>;
    combatMode?: boolean;
  }): void {
    this.levelId = data.levelId || 'w1-s001';
    this.runState = data.runState ?? null;
    this.isRoguelike = !!data.runState;
    this.combatMode = data.combatMode ?? false;
    this._roguelikeLevelData = data.levelData ?? null;
    this._roguelikeHeroQueue = data.heroQueue ?? null;
    this._roguelikeBlightMap = data.blightMap ?? null;
  }

  create(): void {
    this.cubeSprites.clear();
    this.cubeTexts.clear();
    this.queueSprites = [];
    this.queueColumnSprites.clear();
    this.activeOrbits.clear();
    this.deployLock = false;
    this.pendingEndState = null;
    this.gravityQueue = [];
    this.isGravityRunning = false;
    this.currentHighlight = null;
    this.beltPosCoords = [];
    this.benchSlotSprites = [];
    this.benchFilledSprites = [];
    this.benchHeroData = [];

    this.vfx = new VFXManager(this);
    this.enemySprites.clear();
    this.enemyHpBars.clear();
    this.combatResolver = null;

    EventBus.reset();
    const eventBus = EventBus.getInstance();

    let board: import('../core/BoardState').BoardState;
    let conveyor: import('../core/ConveyorState').ConveyorState;
    let heroGrid: HeroInstance[][];

    if (this.combatMode && this.isRoguelike && this._roguelikeLevelData && this._roguelikeHeroQueue) {
      // ---- COMBAT ROGUELIKE PATH (SPEC-021) ----
      this.level = this._roguelikeLevelData;
      const loaded = loadLevelForRoguelikeCombat(this.level, this._roguelikeHeroQueue);
      const conveyorState = loaded.conveyor;
      heroGrid = loaded.heroGrid;

      const hooks: CombatHook[] = [
        new CombatPassiveResolver(),
        new CombatRelicResolver(this.runState!.relics),
      ];

      this.combatResolver = new CombatResolver(
        loaded.enemyBoard, conveyorState, heroGrid, this.level,
        this.level.playerHp, eventBus, hooks,
      );
      this.combatResolver.initCombat();

      // Also set up a dummy TurnResolver board for layout calculations
      const classicLoaded = loadLevelForRoguelike(this.level, this._roguelikeHeroQueue);
      board = classicLoaded.board;
      conveyor = conveyorState;
      this.resolver = new TurnResolver(board, conveyor, heroGrid, this.level, eventBus);
    } else if (this.isRoguelike && this._roguelikeLevelData && this._roguelikeHeroQueue) {
      // ---- ROGUELIKE PATH ----
      this.level = this._roguelikeLevelData;
      const loaded = loadLevelForRoguelike(this.level, this._roguelikeHeroQueue);
      board = loaded.board;
      conveyor = loaded.conveyor;
      heroGrid = loaded.heroGrid;

      // Apply blight data to board cubes
      if (this._roguelikeBlightMap) {
        for (const [key, blightData] of this._roguelikeBlightMap) {
          const [rowStr, colStr] = key.split(',');
          const row = parseInt(rowStr, 10);
          const col = parseInt(colStr, 10);
          const cube = board.getCubeAt(row, col);
          if (cube) {
            (cube as { blight?: BlightData }).blight = blightData;
          }
        }
      }

      // Wire combat plugins
      const plugins: CombatPlugin[] = [
        new PassiveResolver(),
        new ModifierResolver(),
        new RelicResolver(this.runState!.relics),
      ];

      this.resolver = new TurnResolver(board, conveyor, heroGrid, this.level, eventBus, plugins);

      // Fire combat start hooks (bless/curse effects)
      this.resolver.initCombat(heroGrid.flat());
    } else {
      // ---- CLASSIC PATH (unchanged) ----
      this.level = LEVELS[this.levelId];
      if (!this.level) {
        console.error(`Level ${this.levelId} not found`);
        this.scene.start('StageSelectScene');
        return;
      }
      const loaded = loadLevel(this.level);
      board = loaded.board;
      conveyor = loaded.conveyor;
      heroGrid = loaded.heroGrid;

      this.resolver = new TurnResolver(board, conveyor, heroGrid, this.level, eventBus);
    }

    // Track combo for scaled VFX
    eventBus.on(GameEvents.SLING_COMBO, (data: unknown) => {
      this.currentCombo = (data as { count: number }).count;
      getRetroSFX().combo();

      // Combo text popup for combo >= 3
      if (this.currentCombo >= 3) {
        this.showComboText(this.currentCombo);
      }
    });
    eventBus.on(GameEvents.SLING_BREAK, () => { this.currentCombo = 0; });

    // Combat mode event listeners
    if (this.combatMode && this.combatResolver) {
      eventBus.on(GameEvents.ENEMY_DEFEATED, (data: unknown) => {
        const { enemyId } = data as { enemyId: string };
        this.destroyEnemySprite(enemyId);
      });
      eventBus.on(GameEvents.ENEMY_DAMAGED, (data: unknown) => {
        const { enemyId, remainingHp } = data as { enemyId: string; remainingHp: number };
        this.updateEnemyHpBar(enemyId, remainingHp);
      });
      eventBus.on(GameEvents.ENEMY_ATTACK, (data: unknown) => {
        const { damage } = data as EnemyAttackEvent;
        this.vfx.onScreenFlash(0xff0000, 0.3);
      });
    }

    this.calculateLayout();
    this.drawBackground();
    this.drawBeltTrack();

    if (this.combatMode && this.combatResolver) {
      this.createEnemySprites();
    } else {
      this.createCubeSprites();
    }
    this.createBenchArea();
    this.createQueueSprites();

    // Launch UI overlay
    const totalEnemies = this.combatMode && this.combatResolver
      ? this.combatResolver.board.remainingEnemyCount()
      : 0;
    this.scene.launch('PuzzleUIScene', {
      levelId: this.levelId,
      levelName: this.level.name,
      totalCubes: this.combatMode ? 0 : board.remainingCubeCount(),
      combatMode: this.combatMode,
      playerMaxHp: this.combatMode && this.combatResolver ? this.combatResolver.getMaxPlayerHp() : 0,
      totalEnemies,
    });

    // Start BGM (respect saved settings)
    const bgmSettings = SaveManager.getBgmSettings();
    const audio = getRetroAudio();
    audio.setVolume(bgmSettings.volume);
    if (!bgmSettings.muted) {
      audio.play();
    }

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Show tutorial on Stage 1 first play
    if (this.levelId === 'w1-s001' && !SaveManager.isTutorialDone()) {
      this.time.delayedCall(600, () => this.showTutorial());
    }

    this.createAmbientParticles();
  }

  // ─── Layout ─────────────────────────────────────────────

  private calculateLayout(): void {
    const rows = this.level.board.rows;
    const cols = this.level.board.cols;
    const cubeUnit = VISUAL.CUBE_SIZE + VISUAL.CUBE_GAP;

    const gridW = cols * cubeUnit - VISUAL.CUBE_GAP;
    const gridH = rows * cubeUnit - VISUAL.CUBE_GAP;

    this.boardCenterX = GAME_WIDTH / 2;

    // Dynamic board center — push board up for larger grids to leave room for bench + queue
    const beltZoneH = gridH + 2 * (BELT_MARGIN + BELT_OFFSET); // belt wraps around grid
    const topStart = VISUAL.UI.SAFE_AREA_TOP + VISUAL.UI.TOP_BAR_HEIGHT + 20; // 150
    this.boardCenterY = topStart + beltZoneH / 2;

    this.cubeGridLeft = this.boardCenterX - gridW / 2;
    this.cubeGridTop = this.boardCenterY - gridH / 2;

    this.beltTop = this.cubeGridTop - BELT_MARGIN - BELT_OFFSET;
    this.beltBottom = this.cubeGridTop + gridH + BELT_MARGIN;
    this.beltLeft = this.cubeGridLeft - BELT_MARGIN - BELT_OFFSET;
    this.beltRight = this.cubeGridLeft + gridW + BELT_MARGIN;

    // queueY will be finalized in createBenchArea() after bench slots are laid out
    this.queueY = this.beltBottom + BELT_OFFSET + 20;

    // Compute old-style per-slot coordinates (used for seq→t mapping)
    const positions = this.resolver.conveyor.positions;
    this.beltPosCoords = positions.map((pos) => this.beltPositionToPixel(pos));

    // Build smooth belt path through these coordinates
    const trackLeft = this.beltLeft + BELT_OFFSET / 2;
    const trackTop = this.beltTop + BELT_OFFSET / 2;
    const trackRight = this.beltRight + BELT_OFFSET / 2;
    const trackBottom = this.beltBottom + BELT_OFFSET / 2;

    this.beltPath = new BeltPath(
      trackLeft,
      trackTop,
      trackRight,
      trackBottom,
      VISUAL.UI.BELT_CORNER_RADIUS,
      this.beltPosCoords,
    );
  }

  private beltPositionToPixel(pos: BeltPosition): { x: number; y: number } {
    const cubeUnit = VISUAL.CUBE_SIZE + VISUAL.CUBE_GAP;

    switch (pos.edge) {
      case 'top': {
        const x = this.cubeGridLeft + pos.index * cubeUnit + VISUAL.CUBE_SIZE / 2;
        const y = this.beltTop + BELT_OFFSET / 2;
        return { x, y };
      }
      case 'right': {
        const visualRow = this.level.board.rows - 1 - pos.index;
        const x = this.beltRight + BELT_OFFSET / 2;
        const y = this.cubeGridTop + visualRow * cubeUnit + VISUAL.CUBE_SIZE / 2;
        return { x, y };
      }
      case 'bottom': {
        const x = this.cubeGridLeft + pos.index * cubeUnit + VISUAL.CUBE_SIZE / 2;
        const y = this.beltBottom + BELT_OFFSET / 2;
        return { x, y };
      }
      case 'left': {
        const visualRow = this.level.board.rows - 1 - pos.index;
        const x = this.beltLeft + BELT_OFFSET / 2;
        const y = this.cubeGridTop + visualRow * cubeUnit + VISUAL.CUBE_SIZE / 2;
        return { x, y };
      }
    }
  }

  // ─── Background + Belt Track ────────────────────────────

  private drawBackground(): void {
    const rows = this.level.board.rows;
    const cols = this.level.board.cols;
    const cubeUnit = VISUAL.CUBE_SIZE + VISUAL.CUBE_GAP;

    const panelW = cols * cubeUnit + 20;
    const panelH = rows * cubeUnit + 20;

    const bg = this.add.graphics().setDepth(50);
    // Drop shadow
    bg.fillStyle(RETRO.shadowColor, 1.0);
    bg.fillRoundedRect(
      this.boardCenterX - panelW / 2 + 2,
      this.boardCenterY - panelH / 2 + 2,
      panelW,
      panelH,
      RETRO.radius,
    );
    // Panel background
    bg.fillStyle(RETRO.panelBgDark, 1.0);
    bg.fillRoundedRect(
      this.boardCenterX - panelW / 2,
      this.boardCenterY - panelH / 2,
      panelW,
      panelH,
      RETRO.radius,
    );
    // Thick border
    bg.lineStyle(RETRO.borderWidth, RETRO.borderColor, 1.0);
    bg.strokeRoundedRect(
      this.boardCenterX - panelW / 2,
      this.boardCenterY - panelH / 2,
      panelW,
      panelH,
      RETRO.radius,
    );
  }

  private drawBeltTrack(): void {
    // Solid 2px black track line (retro style — no glow)
    const trackMain = this.add.graphics().setDepth(300);
    trackMain.lineStyle(2, RETRO.borderColor, 1.0);
    this.beltPath.path.draw(trackMain);

    // Small dot markers at each belt position — solid element color circles (alpha 0.3)
    const dotGraphics = this.add.graphics().setDepth(305);
    dotGraphics.fillStyle(RETRO.borderColor, 0.3);
    for (const coord of this.beltPosCoords) {
      dotGraphics.fillCircle(coord.x, coord.y, 3);
    }

    // START indicator — plain retro text
    const entryPoint = this.beltPath.getPointAt(this.beltPath.getT(0));
    this.add
      .text(entryPoint.x, entryPoint.y - 22, 'START', {
        fontSize: '10px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(600);
  }

  // ─── Cube Sprites ───────────────────────────────────────

  private createCubeSprites(): void {
    const snapshot = this.resolver.board.getSnapshot();

    for (let row = 0; row < this.level.board.rows; row++) {
      for (let col = 0; col < this.level.board.cols; col++) {
        const cube = snapshot[row][col];
        if (!cube) continue;

        const { x, y } = this.cubeToPixel(row, col);
        const isArmored = cube.hp > 1;
        const displaySize = CUBE_SIZES[cube.size].display;

        const sizedKey = isArmored
          ? `cube_${cube.element}_armored_${cube.size}`
          : `cube_${cube.element}_${cube.size}`;
        const legacyKey = isArmored
          ? `cube_${cube.element}_armored`
          : `cube_${cube.element}`;
        const key = this.textures.exists(sizedKey)
          ? sizedKey
          : this.textures.exists(legacyKey)
            ? legacyKey
            : 'cube';

        const sprite = this.add
          .image(x, y, key)
          .setDisplaySize(displaySize - 4, displaySize - 4)
          .setDepth(200);

        if (key === 'cube') {
          sprite.setTint(ELEMENT_COLORS[cube.element]);
        }

        this.cubeSprites.set(cube.id, sprite);

        if (cube.hp > 1) {
          const fontSize = cube.size === 'S' ? '14px' : '20px';
          const hpText = this.add
            .text(x, y, `${cube.hp}`, {
              fontSize,
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setDepth(210);
          this.cubeTexts.set(cube.id, hpText);
        }
      }
    }
  }

  private cubeToPixel(row: number, col: number): { x: number; y: number } {
    const cubeUnit = VISUAL.CUBE_SIZE + VISUAL.CUBE_GAP;
    const visualRow = this.level.board.rows - 1 - row;
    const x = this.cubeGridLeft + col * cubeUnit + VISUAL.CUBE_SIZE / 2;
    const y = this.cubeGridTop + visualRow * cubeUnit + VISUAL.CUBE_SIZE / 2;
    return { x, y };
  }

  // ─── Bench Area ─────────────────────────────────────────

  private createBenchArea(): void {
    const benchY = this.beltBottom + BELT_OFFSET + 36;
    const slotSize = VISUAL.BENCH_SLOT_SIZE;
    const gap = VISUAL.BENCH_SLOT_GAP;
    const totalW = 5 * slotSize + 4 * gap;
    const startX = GAME_WIDTH / 2 - totalW / 2 + slotSize / 2;

    // "BENCH 0/5" centered above slots
    this.benchCountText = this.add.text(GAME_WIDTH / 2, benchY - slotSize / 2 - 14, 'BENCH 0/5', {
      fontSize: '13px', color: '#718096', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(600);

    // Empty slot outlines (centered)
    const gfx = this.add.graphics().setDepth(395);
    gfx.lineStyle(2, 0x2d3748, 0.6);
    for (let i = 0; i < 5; i++) {
      const x = startX + i * (slotSize + gap);
      gfx.strokeCircle(x, benchY, slotSize / 2);
      this.benchSlotSprites.push(
        this.add.circle(x, benchY, slotSize / 2 - 2, 0x000000, 0).setDepth(396)
      );
    }

    // Subtle zone separator
    const sepY = benchY + slotSize / 2 + 8;
    const sepGfx = this.add.graphics().setDepth(395);
    sepGfx.lineStyle(1, 0x2d3748, 0.5);
    sepGfx.lineBetween(60, sepY, GAME_WIDTH - 60, sepY);

    // Queue starts below bench
    this.queueY = benchY + slotSize / 2 + 16;
  }

  private updateBenchCounter(): void {
    const count = this.resolver.getBenchCount();
    this.benchCountText.setText(`BENCH ${count}/5`);
    if (count >= 5) this.benchCountText.setColor('#e83820');
    else if (count >= 4) this.benchCountText.setColor('#f39c12');
    else this.benchCountText.setColor('#718096');
  }

  // ─── Hero Queue ─────────────────────────────────────────

  private createQueueSprites(): void {
    this.queueSprites.forEach((s) => s.destroy());
    this.queueSprites = [];
    this.queueColumnSprites.clear();

    const grid = this.resolver.getHeroGrid();
    const numCols = grid.length;

    if (numCols <= 1) {
      this.createLinearQueue(grid[0] ?? []);
      return;
    }

    this.createGridLayout(grid);
  }

  private createLinearQueue(queue: ReadonlyArray<import('../types/hero').HeroInstance>): void {
    const queuePanelW = 600;
    const queuePanelH = 140;
    createGlassPanel(this, {
      x: GAME_WIDTH / 2,
      y: this.queueY + 30,
      width: queuePanelW,
      height: queuePanelH,
      depth: 390,
    });

    this.add
      .text(GAME_WIDTH / 2, this.queueY - 20, 'TAP TO DEPLOY', {
        fontSize: '22px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(600);

    const visibleCount = Math.min(queue.length, 8);
    const spacing = 70;
    const startX = GAME_WIDTH / 2 - ((visibleCount - 1) * spacing) / 2;

    for (let i = 0; i < visibleCount; i++) {
      const hero = queue[i];
      const x = startX + i * spacing;
      const y = this.queueY + 35;

      const container = this.add.container(x, y).setDepth(400);
      const queueKey = this.textures.exists(`hero_queue_${hero.element}`)
        ? `hero_queue_${hero.element}`
        : 'hero_queue';
      const circle = this.add
        .image(0, 0, queueKey)
        .setDisplaySize(i === 0 ? 64 : 56, i === 0 ? 64 : 56);
      if (queueKey === 'hero_queue') circle.setTint(ELEMENT_COLORS[hero.element]);

      const apText = this.add
        .text(0, 0, `${hero.ap}`, {
          fontSize: '26px',
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      if (i === 0) {
        const glowColor = ELEMENT_COLORS[hero.element];
        const glow = this.add.graphics();
        glow.lineStyle(2, glowColor, 0.6);
        glow.strokeCircle(0, 0, 36);
        container.add(glow);
        const nextLabel = this.add
          .text(0, -44, 'NEXT', { fontSize: '14px', color: '#e2e8f0', fontFamily: 'monospace' })
          .setOrigin(0.5);
        container.add(nextLabel);
      }

      container.add([circle, apText]);
      container.setData('heroImage', circle);
      container.setData('apText', apText);

      if (i === 0) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerdown', () => this.onDeployTap(0));
        this.tweens.add({
          targets: container,
          scaleX: 1.08,
          scaleY: 1.08,
          yoyo: true,
          repeat: -1,
          duration: 600,
          ease: 'Sine.easeInOut',
        });
      } else {
        container.setAlpha(0.6 - i * 0.05);
      }
      this.queueSprites.push(container);
    }

    if (queue.length > visibleCount) {
      const moreLabel = this.add
        .text(GAME_WIDTH / 2, this.queueY + 85, `+${queue.length - visibleCount} more`, {
          fontSize: '16px',
          color: '#718096',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setDepth(600);
      const moreContainer = this.add.container(0, 0).setDepth(600);
      moreContainer.add(moreLabel);
      this.queueSprites.push(moreContainer);
    }
  }

  private createGridLayout(grid: ReadonlyArray<ReadonlyArray<import('../types/hero').HeroInstance>>): void {
    const numCols = grid.length;
    const cellSize = numCols > 3 ? 64 : VISUAL.UI.HERO_GRID_CELL;
    const gap = VISUAL.UI.HERO_GRID_GAP;
    const maxVisible = Math.min(VISUAL.UI.HERO_GRID_MAX_ROWS, 3); // cap at 3 rows for space

    const colWidth = cellSize;
    const maxRowCount = Math.min(
      maxVisible,
      Math.max(...grid.map((col) => col.length)),
    );
    const panelW = numCols * colWidth + (numCols - 1) * gap + 48;
    const panelH = maxRowCount * (cellSize + gap) + 80;
    const panelX = GAME_WIDTH / 2;
    // Ensure panel doesn't exceed bottom safe area
    const maxPanelY = GAME_HEIGHT - 60 - panelH / 2;
    const panelY = Math.min(this.queueY + panelH / 2 - 10, maxPanelY);

    createGlassPanel(this, {
      x: panelX,
      y: panelY,
      width: panelW,
      height: panelH,
      depth: 390,
    });

    this.add
      .text(GAME_WIDTH / 2, this.queueY - 12, 'DEPLOY', {
        fontSize: '22px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(600);

    const gridStartX = panelX - (numCols * (colWidth + gap) - gap) / 2 + colWidth / 2;
    const gridStartY = this.queueY + 24;

    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      const col = grid[colIdx];
      const colX = gridStartX + colIdx * (colWidth + gap);
      const colSprites: Phaser.GameObjects.Container[] = [];

      const headerContainer = this.add.container(colX, gridStartY - 2).setDepth(600);
      const headerText = this.add
        .text(0, 0, `${colIdx + 1}`, {
          fontSize: '20px',
          color: col.length > 0 ? '#e2e8f0' : '#718096',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      headerContainer.add(headerText);
      this.queueSprites.push(headerContainer);

      const visibleCount = Math.min(col.length, maxVisible);

      for (let rowIdx = 0; rowIdx < visibleCount; rowIdx++) {
        const hero = col[rowIdx];
        const heroY = gridStartY + 28 + rowIdx * (cellSize + gap);

        const container = this.add.container(colX, heroY).setDepth(400);
        const queueKey = this.textures.exists(`hero_queue_${hero.element}`)
          ? `hero_queue_${hero.element}`
          : 'hero_queue';
        const size = rowIdx === 0 ? cellSize : cellSize - 8;
        const circle = this.add.image(0, 0, queueKey).setDisplaySize(size, size);
        if (queueKey === 'hero_queue') circle.setTint(ELEMENT_COLORS[hero.element]);

        const apText = this.add
          .text(0, 0, `${hero.ap}`, {
            fontSize: rowIdx === 0 ? '26px' : '20px',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        container.add([circle, apText]);
        container.setData('heroImage', circle);
        container.setData('apText', apText);
        container.setData('heroElement', hero.element);

        if (rowIdx === 0 && col.length > 0) {
          const glowColor = ELEMENT_COLORS[hero.element];
          const glow = this.add.graphics();
          glow.lineStyle(2, glowColor, 0.6);
          glow.strokeCircle(0, 0, cellSize / 2 + 2);
          container.add(glow);
          container.sendToBack(glow);

          circle.setInteractive({ useHandCursor: true });
          const capturedCol = colIdx;
          circle.on('pointerdown', () => this.onDeployTap(capturedCol));

          this.tweens.add({
            targets: container,
            scaleX: 1.06,
            scaleY: 1.06,
            yoyo: true,
            repeat: -1,
            duration: 700,
            ease: 'Sine.easeInOut',
          });
        } else {
          container.setAlpha(0.5 - rowIdx * 0.08);
        }

        colSprites.push(container);
        this.queueSprites.push(container);
      }

      this.queueColumnSprites.set(colIdx, colSprites);

      if (col.length > visibleCount) {
        const overflowY = gridStartY + 28 + visibleCount * (cellSize + gap);
        const overflowContainer = this.add.container(colX, overflowY).setDepth(600);
        const overflowText = this.add
          .text(0, 0, `+${col.length - visibleCount}`, {
            fontSize: '14px',
            color: '#718096',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
        overflowContainer.add(overflowText);
        this.queueSprites.push(overflowContainer);
      }

      if (col.length === 0) {
        const emptyY = gridStartY + 28;
        const emptyContainer = this.add.container(colX, emptyY).setDepth(400);
        const emptyBg = this.add
          .rectangle(0, 0, cellSize, cellSize, 0x1a2332, 0.3)
          .setStrokeStyle(1, 0x2d3748, 0.3);
        const emptyText = this.add
          .text(0, 0, '-', { fontSize: '28px', color: '#718096', fontFamily: 'monospace' })
          .setOrigin(0.5);
        emptyContainer.add([emptyBg, emptyText]);
        this.queueSprites.push(emptyContainer);
      }
    }
  }

  // ─── Deploy (concurrent) ────────────────────────────────

  private onDeployTap(colIdx: number = 0): void {
    // Combat mode deploy
    if (this.combatMode && this.combatResolver) {
      if (this.deployLock || this.combatResolver.getIsGameOver() || this.combatResolver.getIsBattleComplete()) {
        return;
      }
      this.deployLock = true;
      this.time.delayedCall(VISUAL.ANIM.DEPLOY_COOLDOWN_MS, () => { this.deployLock = false; });

      const now = Date.now();
      const isRapid = now - this.lastDeployTime < BALANCE.SLING_TAP_THRESHOLD_MS;
      this.lastDeployTime = now;

      const heroElement = this.combatResolver.peekColumn(colIdx)?.element ?? null;
      const fromPos = this.getHeroGridPosition(colIdx);
      const result: CombatDeployResult = this.combatResolver.deployFromColumn(colIdx, isRapid);
      if (!result.success) return;

      getRetroSFX().deploy();
      this.removeAndShiftQueue(colIdx);

      const orbitId = result.orbit?.heroId ?? `orbit_${Date.now()}`;
      this.animateCombatOrbit(orbitId, result.orbit!, heroElement, fromPos, result.heroBenched, () => {
        this.activeOrbits.delete(orbitId);
        this.checkEndConditions(result.gameOver, result.battleComplete, result.score, result.stars, result.gameOverReason);
      });
      return;
    }

    // Classic mode deploy
    if (this.deployLock || this.resolver.getIsGameOver() || this.resolver.getIsLevelComplete()) {
      return;
    }

    // Short cooldown to prevent double-tap on same frame
    this.deployLock = true;
    this.time.delayedCall(VISUAL.ANIM.DEPLOY_COOLDOWN_MS, () => {
      this.deployLock = false;
    });

    const now = Date.now();
    const isRapid = now - this.lastDeployTime < BALANCE.SLING_TAP_THRESHOLD_MS;
    this.lastDeployTime = now;

    const heroElement = this.resolver.peekColumn(colIdx)?.element ?? null;
    const fromPos = this.getHeroGridPosition(colIdx);

    const result = this.resolver.deployFromColumn(colIdx, isRapid);

    if (!result.success) {
      return;
    }

    getRetroSFX().deploy();

    this.removeAndShiftQueue(colIdx);

    // Unique orbit ID (hero id from resolver)
    const orbitId = result.orbit?.heroId ?? `orbit_${Date.now()}`;

    this.animateOrbitSequence(
      orbitId,
      result.orbit!,
      result.gravityEvents,
      heroElement,
      fromPos,
      result.heroBenched,
      () => {
        this.activeOrbits.delete(orbitId);
        this.checkEndConditions(result.gameOver, result.levelComplete, result.score, result.stars, result.gameOverReason);
      },
    );
  }

  private onBenchTap(slotIdx: number): void {
    if (this.deployLock || this.resolver.getIsGameOver() || this.resolver.getIsLevelComplete()) {
      return;
    }

    this.deployLock = true;
    this.time.delayedCall(VISUAL.ANIM.DEPLOY_COOLDOWN_MS, () => {
      this.deployLock = false;
    });

    // Get hero element before deploying
    const benchSlots = this.resolver.getBenchSlots();
    const hero = benchSlots[slotIdx];
    if (!hero) return;
    const heroElement = hero.element;

    // Remove the filled bench sprite with a shrink-out animation
    const filledSprite = this.benchFilledSprites.find(s => s.getData('benchSlotIdx') === slotIdx);
    const fromPos = filledSprite ? { x: filledSprite.x, y: filledSprite.y } : null;
    if (filledSprite) {
      const idx = this.benchFilledSprites.indexOf(filledSprite);
      this.benchFilledSprites.splice(idx, 1);
      this.tweens.add({
        targets: filledSprite,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => filledSprite.destroy(),
      });
    }

    const result = this.resolver.deployFromBench(slotIdx);

    if (!result.success) return;

    getRetroSFX().deploy();
    this.updateBenchCounter();

    const orbitId = result.orbit?.heroId ?? `orbit_bench_${Date.now()}`;

    this.animateOrbitSequence(
      orbitId,
      result.orbit!,
      result.gravityEvents,
      heroElement,
      fromPos,
      result.heroBenched,
      () => {
        this.activeOrbits.delete(orbitId);
        this.checkEndConditions(result.gameOver, result.levelComplete, result.score, result.stars, result.gameOverReason);
      },
    );
  }

  private getHeroGridPosition(colIdx: number): { x: number; y: number } | null {
    const grid = this.resolver.getHeroGrid();

    if (grid.length > 1) {
      const colSprites = this.queueColumnSprites.get(colIdx);
      if (colSprites && colSprites.length > 0) {
        return { x: colSprites[0].x, y: colSprites[0].y };
      }
    }

    if (this.queueSprites.length > 0) {
      return { x: this.queueSprites[0].x, y: this.queueSprites[0].y };
    }

    return null;
  }

  // ─── Queue management ───────────────────────────────────

  private removeAndShiftQueue(colIdx: number): void {
    const grid = this.resolver.getHeroGrid();

    if (grid.length <= 1) {
      if (this.queueSprites.length > 0) {
        this.queueSprites[0].destroy();
        this.queueSprites.splice(0, 1);
      }
      this.time.delayedCall(50, () => this.refreshQueueSprites());
      return;
    }

    const colSprites = this.queueColumnSprites.get(colIdx);
    if (!colSprites || colSprites.length === 0) {
      this.refreshQueueSprites();
      return;
    }

    const cellSize = VISUAL.UI.HERO_GRID_CELL;
    const gap = VISUAL.UI.HERO_GRID_GAP;
    const frontSprite = colSprites[0];

    frontSprite.destroy();
    colSprites.shift();
    const idx = this.queueSprites.indexOf(frontSprite);
    if (idx >= 0) this.queueSprites.splice(idx, 1);

    const currentCol = grid[colIdx];
    if (colSprites.length === 0 || currentCol.length > colSprites.length) {
      this.refreshQueueSprites();
      return;
    }

    let shifted = 0;
    const totalToShift = colSprites.length;

    colSprites.forEach((sprite, i) => {
      const targetY = sprite.y - (cellSize + gap);

      this.tweens.add({
        targets: sprite,
        y: targetY,
        duration: VISUAL.ANIM.HERO_SHIFT,
        delay: i * VISUAL.ANIM.HERO_SHIFT_STAGGER,
        ease: 'Power2',
        onComplete: () => {
          shifted++;
          if (shifted >= totalToShift) {
            this.promoteFrontHero(colIdx, colSprites);
          }
        },
      });
    });
  }

  private promoteFrontHero(colIdx: number, colSprites: Phaser.GameObjects.Container[]): void {
    if (colSprites.length === 0) return;

    const newFront = colSprites[0];
    const cellSize = VISUAL.UI.HERO_GRID_CELL;

    newFront.setAlpha(1);

    const grid = this.resolver.getHeroGrid();
    const heroData = grid[colIdx]?.[0];
    if (!heroData) return;

    const glowColor = ELEMENT_COLORS[heroData.element];
    const glow = this.add.graphics();
    glow.lineStyle(2, glowColor, 0.6);
    glow.strokeCircle(0, 0, cellSize / 2 + 2);
    newFront.add(glow);
    newFront.sendToBack(glow);

    const heroImage = newFront.getData('heroImage') as Phaser.GameObjects.Image | undefined;
    if (heroImage) {
      heroImage.setDisplaySize(cellSize, cellSize);
      heroImage.setInteractive({ useHandCursor: true });
      heroImage.on('pointerdown', () => this.onDeployTap(colIdx));
    }

    const apText = newFront.getData('apText') as Phaser.GameObjects.Text | undefined;
    if (apText) {
      apText.setFontSize(26);
    }

    this.tweens.add({
      targets: newFront,
      scaleX: 1.06,
      scaleY: 1.06,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Orbit animation (path-following) ───────────────────

  private animateOrbitSequence(
    orbitId: string,
    orbit: OrbitResult,
    gravityEvents: GravityEvent[],
    heroElement: ElementColor | null,
    fromPos: { x: number; y: number } | null,
    heroBenched: boolean,
    onComplete: () => void,
  ): void {
    const steps = orbit.steps;
    if (steps.length === 0) {
      this.enqueueGravity(gravityEvents, onComplete);
      return;
    }

    const firstT = this.beltPath.getT(steps[0].beltPos.seq);
    const firstPoint = this.beltPath.getPointAt(firstT);

    // Start hero at grid position (if available) or belt start
    const startX = fromPos?.x ?? firstPoint.x;
    const startY = fromPos?.y ?? firstPoint.y;
    const depthOffset = 450 + this.activeOrbits.size;
    const container = this.add.container(startX, startY).setDepth(depthOffset);

    const heroKey =
      heroElement && this.textures.exists(`hero_${heroElement}`)
        ? `hero_${heroElement}`
        : 'hero';
    const heroCircle = this.add
      .image(0, 0, heroKey)
      .setDisplaySize(BELT_HERO_SIZE, BELT_HERO_SIZE);

    if (heroKey === 'hero' && heroElement) {
      heroCircle.setTint(ELEMENT_COLORS[heroElement]);
    }

    const apText = this.add
      .text(0, 0, `${steps[0].apRemaining}`, {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    container.add([heroCircle, apText]);
    this.activeOrbits.set(orbitId, container);

    // Build schedule of t-values and events
    const schedule = steps.map((step) => ({
      t: this.beltPath.getT(step.beltPos.seq),
      step,
    }));

    const startOrbit = () => {
      let eventIdx = 0;
      const totalDuration = steps.length * VISUAL.ANIM.ORBIT_STEP_MS;
      const tracker = { progress: 0 };

      this.tweens.add({
        targets: tracker,
        progress: 1,
        duration: totalDuration,
        ease: 'Linear',
        onUpdate: () => {
          // Interpolate t between current and next event position
          const floatIdx = tracker.progress * (schedule.length - 1);
          const fromIdx = Math.floor(floatIdx);
          const toIdx = Math.min(fromIdx + 1, schedule.length - 1);
          const localProgress = floatIdx - fromIdx;

          const fromT = schedule[fromIdx].t;
          let toT = schedule[toIdx].t;
          // Handle wrapping
          if (toT < fromT - 0.5) toT += 1;
          let currentT = fromT + (toT - fromT) * localProgress;
          if (currentT >= 1) currentT -= 1;

          const point = this.beltPath.getPointAt(currentT);
          container.setPosition(point.x, point.y);

          // Trail
          if (heroElement) {
            this.vfx.emitTrail(container.x, container.y, ELEMENT_COLORS[heroElement]);
          }

          // Fire scheduled events as we pass them
          while (eventIdx < schedule.length) {
            const threshold = eventIdx / (schedule.length - 1 || 1);
            if (tracker.progress >= threshold - 0.01) {
              const step = schedule[eventIdx].step;
              apText.setText(`${step.apRemaining}`);
              this.highlightBeltSlot(step.beltPos.seq);

              if (step.cubeDestroyed) {
                const evt = step.cubeDestroyed;
                const cubePixel = this.cubeToPixel(evt.row, evt.col);
                const projColor = heroElement ? ELEMENT_COLORS[heroElement] : 0xffffff;
                const vfxMatchType: 'same' | 'advantage' | undefined =
                  evt.matchType === 'same' || evt.matchType === 'advantage' ? evt.matchType : undefined;
                this.currentDeployElement = heroElement;
                this.animateProjectile(
                  container.x, container.y,
                  cubePixel.x, cubePixel.y,
                  projColor,
                  () => this.destroyCubeSprite(evt.cubeId, heroElement, vfxMatchType),
                  vfxMatchType,
                );
              }
              eventIdx++;
            } else {
              break;
            }
          }
        },
        onComplete: () => {
          if (heroBenched) {
            // Find the actual bench slot this hero was placed in
            const benchSlots = this.resolver.getBenchSlots();
            let slotIdx = -1;
            for (let si = 0; si < benchSlots.length; si++) {
              if (benchSlots[si]?.id === orbit.heroId) { slotIdx = si; break; }
            }
            if (slotIdx >= 0 && slotIdx < this.benchSlotSprites.length) {
              const targetSlot = this.benchSlotSprites[slotIdx];
              getRetroSFX().benchRetreat();
              this.tweens.add({
                targets: container,
                x: targetSlot.x,
                y: targetSlot.y,
                scaleX: 1,
                scaleY: 1,
                duration: VISUAL.ANIM.BENCH_RETREAT,
                ease: 'Power2',
                onComplete: () => {
                  // Place hero sprite at bench slot — same appearance as queue heroes
                  const bSlotSize = VISUAL.BENCH_SLOT_SIZE;
                  const benchHeroContainer = this.add.container(targetSlot.x, targetSlot.y).setDepth(397);
                  const qKey = heroElement && this.textures.exists(`hero_queue_${heroElement}`)
                    ? `hero_queue_${heroElement}` : 'hero_queue';
                  const heroImg = this.add.image(0, 0, qKey)
                    .setDisplaySize(bSlotSize - 8, bSlotSize - 8);
                  if (qKey === 'hero_queue' && heroElement) {
                    heroImg.setTint(ELEMENT_COLORS[heroElement]);
                  }
                  const lastStep = orbit.steps[orbit.steps.length - 1];
                  const benchApText = this.add.text(0, 0, `${lastStep?.apRemaining ?? 0}`, {
                    fontSize: '20px', color: '#e2e8f0',
                    fontFamily: 'monospace', fontStyle: 'bold',
                  }).setOrigin(0.5);
                  benchHeroContainer.add([heroImg, benchApText]);
                  benchHeroContainer.setData('benchSlotIdx', slotIdx);
                  benchHeroContainer.setData('heroElement', heroElement);
                  heroImg.setInteractive({ useHandCursor: true });
                  heroImg.on('pointerdown', () => this.onBenchTap(slotIdx));
                  // TAP indicator text below the hero
                  const tapText = this.add.text(0, 28, 'TAP', {
                    fontSize: '10px', color: '#718096',
                    fontFamily: 'monospace',
                  }).setOrigin(0.5).setAlpha(0.5);
                  benchHeroContainer.add(tapText);
                  // Breathing pulse on the container
                  this.tweens.add({
                    targets: benchHeroContainer,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                  });
                  // Alpha pulse on TAP text
                  this.tweens.add({
                    targets: tapText,
                    alpha: 1.0,
                    duration: 1200,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                  });
                  this.benchFilledSprites.push(benchHeroContainer);
                  container.destroy();
                  this.updateBenchCounter();
                  this.enqueueGravity(gravityEvents, onComplete);
                },
              });
              return; // skip normal destroy path
            }
          }
          container.destroy();
          this.enqueueGravity(gravityEvents, onComplete);
        },
      });
    };

    // Fly from grid → belt START, then begin orbit
    if (fromPos) {
      this.tweens.add({
        targets: container,
        x: firstPoint.x,
        y: firstPoint.y,
        duration: VISUAL.ANIM.HERO_EXIT,
        ease: 'Power2',
        onComplete: startOrbit,
      });
    } else {
      container.setScale(0);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: VISUAL.ANIM.DEPLOY,
        ease: 'Back.easeOut',
      });
      startOrbit();
    }
  }

  // ─── Projectile + Cube destruction ──────────────────────

  private animateProjectile(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number,
    onHit: () => void,
    matchType?: 'same' | 'advantage',
  ): void {
    const heroEl = this.currentDeployElement;
    const projKey = heroEl ? `projectile_${heroEl}` : null;

    if (projKey && this.textures.exists(projKey)) {
      const proj = this.add.image(fromX, fromY, projKey).setDepth(350);
      const scale = matchType === 'advantage' ? 3 : 2;
      proj.setScale(scale);
      if (matchType === 'advantage') {
        proj.setBlendMode(Phaser.BlendModes.ADD);
      }
      // Rotate toward target
      const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
      proj.setRotation(angle);

      this.tweens.add({
        targets: proj,
        x: toX,
        y: toY,
        duration: VISUAL.ANIM.PROJECTILE || 100,
        ease: 'Power2',
        onComplete: () => {
          proj.destroy();
          onHit();
        },
      });
    } else {
      // Fallback: original line
      const line = this.add.graphics().setDepth(350);
      const lineWidth = matchType === 'advantage' ? 6 : 4;
      line.lineStyle(lineWidth, color, 0.9);
      line.lineBetween(fromX, fromY, toX, toY);

      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          line.destroy();
          onHit();
        },
      });
    }
  }

  private destroyCubeSprite(cubeId: string, heroElement: ElementColor | null, matchType?: 'same' | 'advantage'): void {
    const sprite = this.cubeSprites.get(cubeId);
    const text = this.cubeTexts.get(cubeId);

    if (sprite) {
      getRetroSFX().destroy();
      if (heroElement) {
        this.vfx.onCubeDestroy(sprite.x, sprite.y, heroElement, matchType);
      }
      const shakeIntensity = 3 + this.currentCombo * 2;
      const shakeDuration = 80 + this.currentCombo * 20;
      this.vfx.screenShake(shakeIntensity, shakeDuration);

      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: VISUAL.ANIM.CUBE_DESTROY,
        ease: 'Power2',
        onComplete: () => {
          sprite.destroy();
          this.cubeSprites.delete(cubeId);
        },
      });
    }
    if (text) {
      text.destroy();
      this.cubeTexts.delete(cubeId);
    }
  }

  // ─── Belt highlight (glow on path) ─────────────────────

  private highlightBeltSlot(seq: number): void {
    this.currentHighlight?.destroy();

    const point = this.beltPath.getPointAt(this.beltPath.getT(seq));
    this.currentHighlight = this.add
      .circle(point.x, point.y, 8, RETRO.textHighlight, 0.5)
      .setDepth(350);

    this.tweens.add({
      targets: this.currentHighlight,
      alpha: 0,
      scale: 2.5,
      duration: 300,
      onComplete: () => {
        this.currentHighlight?.destroy();
        this.currentHighlight = null;
      },
    });
  }

  // ─── Gravity queue (serialized across concurrent orbits) ─

  private enqueueGravity(events: GravityEvent[], callback: () => void): void {
    if (events.length === 0) {
      callback();
      return;
    }

    this.gravityQueue.push({ events, callback });
    if (!this.isGravityRunning) {
      this.drainGravityQueue();
    }
  }

  private drainGravityQueue(): void {
    if (this.gravityQueue.length === 0) {
      this.isGravityRunning = false;
      return;
    }

    this.isGravityRunning = true;
    const { events, callback } = this.gravityQueue.shift()!;

    this.animateGravity(events, () => {
      callback();
      this.drainGravityQueue();
    });
  }

  private animateGravity(gravityEvents: GravityEvent[], onComplete: () => void): void {
    if (gravityEvents.length === 0) {
      onComplete();
      return;
    }

    let completed = 0;
    for (const gEvt of gravityEvents) {
      const sprite = this.cubeSprites.get(gEvt.cubeId);
      if (sprite) {
        const target = this.cubeToPixel(gEvt.toRow, gEvt.col);
        this.tweens.add({
          targets: sprite,
          y: target.y,
          duration: VISUAL.ANIM.GRAVITY_FALL,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            completed++;
            if (completed >= gravityEvents.length) {
              onComplete();
            }
          },
        });
      } else {
        completed++;
        if (completed >= gravityEvents.length) {
          onComplete();
        }
      }
    }
  }

  // ─── End conditions ─────────────────────────────────────

  private checkEndConditions(
    gameOver: boolean,
    levelComplete: boolean,
    score: number,
    stars: number,
    gameOverReason?: string,
  ): void {
    if (gameOver || levelComplete) {
      // Store pending end state — wait for all orbits to finish
      this.pendingEndState = { gameOver, levelComplete, score, stars, gameOverReason };
    }
    // Always try to finalize — a previous orbit may have set pendingEndState
    // while this orbit was still in activeOrbits, blocking the transition.
    this.tryFinalize();
  }

  private tryFinalize(): void {
    if (!this.pendingEndState) return;
    if (this.activeOrbits.size > 0) return; // still orbiting heroes

    const { gameOver, levelComplete, score, stars, gameOverReason } = this.pendingEndState;
    this.pendingEndState = null;

    if (this.isRoguelike && this.runState) {
      // ---- ROGUELIKE ROUTING ----
      if (gameOver) {
        RunManager.endBattle(this.runState, false, score);
        getRetroSFX().gameOver();
        this.time.delayedCall(500, () => {
          this.scene.stop('PuzzleUIScene');
          this.scene.start('RunResultScene', {
            runState: this.runState,
            won: false,
          });
        });
      } else if (levelComplete) {
        RunManager.endBattle(this.runState, true, score);
        getRetroSFX().levelClear();
        this.vfx.onLevelComplete(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.time.delayedCall(800, () => {
          this.scene.stop('PuzzleUIScene');
          this.scene.start('RewardScene', {
            runState: this.runState,
            score,
            stars,
          });
        });
      }
    } else {
      // ---- CLASSIC ROUTING (unchanged) ----
      if (gameOver) {
        getRetroSFX().gameOver();
        this.time.delayedCall(500, () => {
          this.scene.stop('PuzzleUIScene');
          this.scene.start('ResultScene', {
            levelId: this.levelId,
            win: false,
            score,
            stars: 0,
            gameOverReason,
          });
        });
      } else if (levelComplete) {
        getRetroSFX().levelClear();
        this.vfx.onLevelComplete(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.time.delayedCall(800, () => {
          this.scene.stop('PuzzleUIScene');
          this.scene.start('ResultScene', {
            levelId: this.levelId,
            win: true,
            score,
            stars,
          });
        });
      }
    }
  }

  private refreshQueueSprites(): void {
    this.queueSprites.forEach((s) => s.destroy());
    this.queueSprites = [];
    this.queueColumnSprites.clear();
    this.createQueueSprites();
  }

  // ─── Combat Mode (SPEC-021) ──────────────────────────────

  /** Create enemy sprites for combat mode */
  private createEnemySprites(): void {
    if (!this.combatResolver) return;
    const snapshot = this.combatResolver.board.getSnapshot();
    const rows = this.combatResolver.board.rows;
    const cols = this.combatResolver.board.cols;
    const cubeUnit = VISUAL.CUBE_SIZE + VISUAL.CUBE_GAP;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const enemy = snapshot[row]?.[col];
        if (!enemy) continue;

        const pixel = this.cubeToPixel(row, col);
        const container = this.add.container(pixel.x, pixel.y).setDepth(200);

        // Enemy body (element-colored square with border)
        const size = VISUAL.CUBE_SIZE - 4;
        const body = this.add.rectangle(0, 0, size, size, ELEMENT_COLORS[enemy.element])
          .setStrokeStyle(2, 0xffffff, 0.6);
        container.add(body);

        // Tier indicator
        const tierText = this.add.text(0, -2, `T${enemy.tier}`, {
          fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(tierText);

        // HP bar background
        const hpBarW = size - 8;
        const hpBarH = 6;
        const hpBarY = size / 2 - 8;
        const hpBg = this.add.rectangle(0, hpBarY, hpBarW, hpBarH, 0x1a1a2e).setOrigin(0.5);
        const hpFill = this.add.rectangle(-hpBarW / 2 + hpBarW / 2, hpBarY, hpBarW, hpBarH, 0x48bb78).setOrigin(0.5);
        container.add([hpBg, hpFill]);

        // Timer text (small, bottom-right)
        const timerText = this.add.text(size / 2 - 4, size / 2 - 4, `${enemy.attackTimer}`, {
          fontSize: '10px', color: '#f0d050', fontFamily: 'monospace',
        }).setOrigin(1, 1);
        container.add(timerText);

        this.enemySprites.set(enemy.id, container);
        this.enemyHpBars.set(enemy.id, { bg: hpBg, fill: hpFill });
      }
    }
  }

  /** Update enemy HP bar */
  private updateEnemyHpBar(enemyId: string, remainingHp: number): void {
    const bars = this.enemyHpBars.get(enemyId);
    if (!bars) return;
    const enemy = this.combatResolver?.board.findEnemies(e => e.id === enemyId)[0];
    if (!enemy) return;

    const ratio = Math.max(0, remainingHp / enemy.maxHp);
    const size = VISUAL.CUBE_SIZE - 4;
    const barW = size - 8;
    const targetW = barW * ratio;
    const color = ratio > 0.5 ? 0x48bb78 : ratio > 0.25 ? 0xf0d050 : 0xe74c3c;

    bars.fill.fillColor = color;
    this.tweens.add({
      targets: bars.fill,
      displayWidth: Math.max(1, targetW),
      duration: 150,
      ease: 'Power2',
    });
  }

  /** Destroy enemy sprite with VFX */
  private destroyEnemySprite(enemyId: string): void {
    const container = this.enemySprites.get(enemyId);
    if (!container) return;

    this.vfx.onCubeDestroy(container.x, container.y, 'fire' as ElementColor);
    getRetroSFX().destroy();

    this.tweens.add({
      targets: container,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        container.destroy();
        this.enemySprites.delete(enemyId);
        this.enemyHpBars.delete(enemyId);
      },
    });
  }

  /** Animate combat orbit (enemy-based, no gravity) */
  private animateCombatOrbit(
    orbitId: string,
    orbit: CombatOrbitResult,
    heroElement: ElementColor | null,
    fromPos: { x: number; y: number } | null,
    heroBenched: boolean,
    onComplete: () => void,
  ): void {
    const steps = orbit.steps;
    if (steps.length === 0) {
      onComplete();
      return;
    }

    const firstT = this.beltPath.getT(steps[0].beltPos.seq);
    const firstPoint = this.beltPath.getPointAt(firstT);
    const startX = fromPos?.x ?? firstPoint.x;
    const startY = fromPos?.y ?? firstPoint.y;
    const depthOffset = 450 + this.activeOrbits.size;
    const container = this.add.container(startX, startY).setDepth(depthOffset);

    const heroKey = heroElement && this.textures.exists(`hero_${heroElement}`)
      ? `hero_${heroElement}` : 'hero';
    const heroCircle = this.add.image(0, 0, heroKey)
      .setDisplaySize(BELT_HERO_SIZE, BELT_HERO_SIZE);
    if (heroKey === 'hero' && heroElement) {
      heroCircle.setTint(ELEMENT_COLORS[heroElement]);
    }

    const apText = this.add.text(0, 0, `${steps[0].apRemaining}`, {
      fontSize: '14px', color: '#e2e8f0', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([heroCircle, apText]);
    this.activeOrbits.set(orbitId, container);

    const schedule = steps.map((step) => ({
      t: this.beltPath.getT(step.beltPos.seq),
      step,
    }));

    const startOrbit = () => {
      let eventIdx = 0;
      const totalDuration = steps.length * VISUAL.ANIM.ORBIT_STEP_MS;
      const tracker = { progress: 0 };

      this.tweens.add({
        targets: tracker,
        progress: 1,
        duration: totalDuration,
        ease: 'Linear',
        onUpdate: () => {
          const floatIdx = tracker.progress * (schedule.length - 1);
          const fromIdx = Math.floor(floatIdx);
          const toIdx = Math.min(fromIdx + 1, schedule.length - 1);
          const localProgress = floatIdx - fromIdx;
          const fromT = schedule[fromIdx].t;
          let toT = schedule[toIdx].t;
          if (toT < fromT - 0.5) toT += 1;
          let currentT = fromT + (toT - fromT) * localProgress;
          if (currentT >= 1) currentT -= 1;

          const point = this.beltPath.getPointAt(currentT);
          container.setPosition(point.x, point.y);

          if (heroElement) {
            this.vfx.emitTrail(container.x, container.y, ELEMENT_COLORS[heroElement]);
          }

          while (eventIdx < schedule.length) {
            const threshold = eventIdx / (schedule.length - 1 || 1);
            if (tracker.progress >= threshold - 0.01) {
              const step = schedule[eventIdx].step;
              apText.setText(`${step.apRemaining}`);
              this.highlightBeltSlot(step.beltPos.seq);

              if (step.enemyHit) {
                const hit = step.enemyHit;
                const enemyContainer = this.enemySprites.get(hit.enemyId);
                if (enemyContainer) {
                  const projColor = heroElement ? ELEMENT_COLORS[heroElement] : 0xffffff;
                  this.animateProjectile(
                    container.x, container.y,
                    enemyContainer.x, enemyContainer.y,
                    projColor,
                    () => {
                      // Damage flash
                      if (!hit.defeated) {
                        this.tweens.add({
                          targets: enemyContainer,
                          alpha: 0.4, duration: 60, yoyo: true,
                        });
                      }
                    },
                  );
                }
              }
              eventIdx++;
            } else {
              break;
            }
          }
        },
        onComplete: () => {
          container.destroy();
          onComplete();
        },
      });
    };

    if (fromPos) {
      this.tweens.add({
        targets: container,
        x: firstPoint.x,
        y: firstPoint.y,
        duration: VISUAL.ANIM.HERO_EXIT,
        ease: 'Power2',
        onComplete: startOrbit,
      });
    } else {
      container.setScale(0);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: startOrbit,
      });
    }
  }

  // ─── Combo text popup ──────────────────────────────────

  private showComboText(count: number): void {
    const cx = GAME_WIDTH / 2;
    const cy = 200;
    const colors = ['', '', '', '#38b868', '#f0d050', '#e83820']; // 3=green, 4=yellow, 5=red
    const color = colors[Math.min(count, 5)] || '#e83820';

    const text = this.add.text(cx, cy, `COMBO x${count}!`, {
      fontSize: '28px',
      color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(700).setScale(0);

    this.tweens.add({
      targets: text,
      scaleX: { from: 0, to: 1.3 },
      scaleY: { from: 0, to: 1.3 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          scaleX: 1.0,
          scaleY: 1.0,
          alpha: 0,
          y: cy - 30,
          duration: 400,
          delay: 100,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  // ─── Ambient background particles ──────────────────────

  private createAmbientParticles(): void {
    const colors = [0x50c878, 0xf0d050, 0x5090f8, 0xf06060, 0x9060d8];
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const y = Phaser.Math.Between(200, GAME_HEIGHT - 100);
      const color = colors[i % colors.length];
      const size = Phaser.Math.Between(3, 6);
      const dot = this.add
        .rectangle(x, y, size, size, color, 0.08)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(60, 150),
        alpha: { from: 0.08, to: 0 },
        duration: Phaser.Math.Between(5000, 9000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          dot.setPosition(
            Phaser.Math.Between(40, GAME_WIDTH - 40),
            Phaser.Math.Between(GAME_HEIGHT * 0.3, GAME_HEIGHT - 100)
          );
          dot.setAlpha(0.08);
        },
      });
    }
  }

  // ─── Tutorial ──────────────────────────────────────────

  private showTutorial(): void {
    const steps = [
      {
        title: 'WELCOME!',
        body: 'Match heroes to same-color cubes\nto clear the board.',
        icon: '\u2694',
      },
      {
        title: 'TAP TO DEPLOY',
        body: 'Tap a hero in the queue below\nto send them onto the belt.',
        icon: '\u25B6',
      },
      {
        title: 'ORBIT & MATCH',
        body: 'Heroes orbit the belt and\nautomatically attack matching cubes.',
        icon: '\u27F3',
      },
      {
        title: 'BENCH',
        body: 'Heroes with no targets go to the bench.\nTap bench heroes to redeploy them!',
        icon: '\u23F8',
      },
      {
        title: 'GOOD LUCK!',
        body: 'Clear all cubes to win.\nWatch the deploy order carefully!',
        icon: '\u2605',
      },
    ];

    let currentStep = 0;
    const depth = 2000;

    // Dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.7
    ).setDepth(depth).setInteractive();

    // Panel
    const panelW = 560;
    const panelH = 280;
    const panelY = GAME_HEIGHT / 2 - 40;
    const panelContainer = this.add.container(GAME_WIDTH / 2, panelY).setDepth(depth + 1);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a2332);
    panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    panelBg.lineStyle(3, 0x2d3748, 1.0);
    panelBg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    panelContainer.add(panelBg);

    // Icon
    const iconText = this.add.text(0, -80, '', {
      fontSize: '48px', color: '#e94560', fontFamily: 'monospace',
    }).setOrigin(0.5);
    panelContainer.add(iconText);

    // Title
    const titleText = this.add.text(0, -30, '', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    panelContainer.add(titleText);

    // Body
    const bodyText = this.add.text(0, 30, '', {
      fontSize: '18px', color: '#a0aec0', fontFamily: 'monospace',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    panelContainer.add(bodyText);

    // Step indicator dots
    const dotsContainer = this.add.container(0, panelH / 2 - 30);
    panelContainer.add(dotsContainer);

    // "TAP TO CONTINUE" hint
    const hintText = this.add.text(0, panelH / 2 + 10, 'TAP TO CONTINUE', {
      fontSize: '14px', color: '#718096', fontFamily: 'monospace',
    }).setOrigin(0.5);
    panelContainer.add(hintText);

    // Blink hint
    this.tweens.add({
      targets: hintText,
      alpha: { from: 0.4, to: 1.0 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const renderStep = (): void => {
      const step = steps[currentStep];
      iconText.setText(step.icon);
      titleText.setText(step.title);
      bodyText.setText(step.body);

      // Update dots
      dotsContainer.removeAll(true);
      const dotGap = 16;
      const dotsW = (steps.length - 1) * dotGap;
      for (let i = 0; i < steps.length; i++) {
        const dx = -dotsW / 2 + i * dotGap;
        const dot = this.add.circle(dx, 0, 4, i === currentStep ? 0xe94560 : 0x4a5568);
        dotsContainer.add(dot);
      }

      // Update hint on last step
      if (currentStep === steps.length - 1) {
        hintText.setText('TAP TO START');
      }

      // Entrance animation
      panelContainer.setScale(0.9).setAlpha(0);
      this.tweens.add({
        targets: panelContainer,
        scaleX: 1, scaleY: 1, alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    };

    overlay.on('pointerdown', () => {
      getRetroSFX().tap();
      currentStep++;
      if (currentStep >= steps.length) {
        // Tutorial done
        SaveManager.setTutorialDone();
        this.tweens.add({
          targets: [overlay, panelContainer],
          alpha: 0,
          duration: 200,
          onComplete: () => {
            overlay.destroy();
            panelContainer.destroy();
          },
        });
      } else {
        renderStep();
      }
    });

    renderStep();
  }
}
