import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

// ── Constants ──────────────────────────────────────────────
const GAME_DURATION = 60_000; // 60 seconds
const GOAL_BLOOMS = 10;

const GRID_COLS = 18;
const GRID_ROWS = 32;
const CELL_W = GAME_WIDTH / GRID_COLS;
const CELL_H = GAME_HEIGHT / GRID_ROWS;

const GROW_TIME = 3000; // ms per growth stage
const SEED_GEN_INTERVAL = 5000; // bloomed flower generates 1 seed every 5s
const HARVEST_YIELD = 3;
const START_SEEDS = 5;

const AURA_RADIUS = 3; // cells
const SYNERGY_BONUS = 0.5; // extra radius per adjacent bloom

const BLIGHT_SPAWN_INTERVAL = 8000; // new blight source every 8s
const BLIGHT_SPREAD_INTERVAL = 1200; // blight spreads every 1.2s

// ── Colors ─────────────────────────────────────────────────
const COL_SOIL = 0x1a1208;
const COL_ALIVE = 0x1a3a1a;
const COL_SEED = 0x8b7355;
const COL_SPROUT = 0x66aa44;
const COL_FLOWER_COLORS = [0xff69b4, 0xff6347, 0xffd700];
const COL_AURA = 0x44ff88;
const COL_BLIGHT = 0x2a0a2a;
const COL_BLIGHT_EDGE = 0x4a1a4a;
const COL_HUD_BG = 0x000000;
const COL_HUD_TEXT = "#e0e0e0";

// ── Types ──────────────────────────────────────────────────
enum CellState {
  Soil,
  Alive,
  Blighted,
}

enum PlantStage {
  Seed,
  Sprout,
  Flower,
  Bloom,
}

interface Plant {
  col: number;
  row: number;
  stage: PlantStage;
  stageTimer: number;
  seedGenTimer: number;
  color: number;
  swayOffset: number;
  withering: boolean;
  witherTimer: number;
  scaleAnim: number; // for pop animation
}

interface BlightSource {
  col: number;
  row: number;
  active: boolean;
}

// ── Scene ──────────────────────────────────────────────────
export class BloomScene extends Phaser.Scene {
  // Grid state
  private grid: CellState[][] = [];
  private auraMap: number[][] = []; // aura strength per cell

  // Plants
  private plants: Plant[] = [];
  private seeds = START_SEEDS;
  private bloomCount = 0;

  // Blight
  private blightSources: BlightSource[] = [];
  private blightCells: Set<string> = new Set();
  private blightSpawnTimer = 0;
  private blightSpreadTimer = 0;

  // Timer
  private elapsed = 0;
  private gameOver = false;

  // Graphics layers
  private groundGfx!: Phaser.GameObjects.Graphics;
  private auraGfx!: Phaser.GameObjects.Graphics;
  private plantGfx!: Phaser.GameObjects.Graphics;
  private blightGfx!: Phaser.GameObjects.Graphics;
  private hudGfx!: Phaser.GameObjects.Graphics;

  // HUD texts
  private seedText!: Phaser.GameObjects.Text;
  private bloomText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private blightText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;

  // Particles (visual feedback)
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: number;
    size: number;
  }> = [];

  constructor() {
    super({ key: "BloomScene" });
  }

  create(): void {
    this.resetState();

    // Graphics layers (order = depth)
    this.groundGfx = this.add.graphics().setDepth(0);
    this.auraGfx = this.add.graphics().setDepth(1);
    this.blightGfx = this.add.graphics().setDepth(2);
    this.plantGfx = this.add.graphics().setDepth(3);
    this.hudGfx = this.add.graphics().setDepth(10);

    this.createHUD();
    this.drawGround();

    // Input
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
      this.handleTap(p),
    );
  }

  private resetState(): void {
    this.grid = [];
    this.auraMap = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      this.grid[r] = [];
      this.auraMap[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        this.grid[r][c] = CellState.Soil;
        this.auraMap[r][c] = 0;
      }
    }
    this.plants = [];
    this.seeds = START_SEEDS;
    this.bloomCount = 0;
    this.blightSources = [];
    this.blightCells = new Set();
    this.blightSpawnTimer = 3000; // first blight after 3s
    this.blightSpreadTimer = 0;
    this.elapsed = 0;
    this.gameOver = false;
    this.particles = [];
  }

  // ── HUD ────────────────────────────────────────────────
  private createHUD(): void {
    const y = 20;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "22px",
      color: COL_HUD_TEXT,
    };
    const smallStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#aaaaaa",
    };

    this.seedText = this.add.text(20, y, "", style).setDepth(11);
    this.bloomText = this.add.text(20, y + 30, "", style).setDepth(11);
    this.timerText = this.add
      .text(GAME_WIDTH - 20, y, "", style)
      .setOrigin(1, 0)
      .setDepth(11);
    this.blightText = this.add
      .text(GAME_WIDTH - 20, y + 30, "", smallStyle)
      .setOrigin(1, 0)
      .setDepth(11);
    this.goalText = this.add
      .text(GAME_WIDTH / 2, y + 10, "", smallStyle)
      .setOrigin(0.5, 0)
      .setDepth(11);
  }

  private updateHUD(): void {
    const timeLeft = Math.max(0, GAME_DURATION - this.elapsed);
    const secs = Math.ceil(timeLeft / 1000);

    this.seedText.setText(`Seeds: ${this.seeds}`);
    this.bloomText.setText(`Blooms: ${this.bloomCount}/${GOAL_BLOOMS}`);
    this.timerText.setText(`${secs}s`);

    // Blight coverage
    const totalCells = GRID_COLS * GRID_ROWS;
    const blightPct = ((this.blightCells.size / totalCells) * 100).toFixed(1);
    this.blightText.setText(`Blight: ${blightPct}%`);

    // Goal hint
    if (this.bloomCount >= GOAL_BLOOMS) {
      this.goalText.setText("GOAL REACHED! Survive!").setColor("#44ff88");
    } else {
      this.goalText
        .setText(`Goal: ${GOAL_BLOOMS} blooms by 0:00`)
        .setColor("#aaaaaa");
    }

    // Timer color urgency
    if (secs <= 10) {
      this.timerText.setColor("#ff4444");
    } else if (secs <= 20) {
      this.timerText.setColor("#ffaa44");
    } else {
      this.timerText.setColor(COL_HUD_TEXT);
    }

    // HUD background bar
    this.hudGfx.clear();
    this.hudGfx.fillStyle(COL_HUD_BG, 0.7);
    this.hudGfx.fillRect(0, 0, GAME_WIDTH, 70);
  }

  // ── Ground Drawing ─────────────────────────────────────
  private drawGround(): void {
    this.groundGfx.clear();

    // Base soil
    this.groundGfx.fillStyle(COL_SOIL, 1);
    this.groundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid texture
    this.groundGfx.lineStyle(1, 0x2a1e10, 0.3);
    for (let c = 0; c <= GRID_COLS; c++) {
      this.groundGfx.lineBetween(c * CELL_W, 0, c * CELL_W, GAME_HEIGHT);
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      this.groundGfx.lineBetween(0, r * CELL_H, GAME_WIDTH, r * CELL_H);
    }
  }

  // ── Input ──────────────────────────────────────────────
  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver) return;
    if (pointer.y < 70) return; // HUD area

    const col = Math.floor(pointer.x / CELL_W);
    const row = Math.floor(pointer.y / CELL_H);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;

    // Check if tapping existing bloomed flower (harvest)
    const existingPlant = this.plants.find(
      (p) => p.col === col && p.row === row && !p.withering,
    );
    if (existingPlant && existingPlant.stage === PlantStage.Bloom) {
      this.harvestPlant(existingPlant);
      return;
    }

    // Plant a seed
    if (existingPlant) return; // occupied
    if (this.grid[row][col] === CellState.Blighted) return;
    if (this.seeds <= 0) return;

    this.seeds--;
    const plant: Plant = {
      col,
      row,
      stage: PlantStage.Seed,
      stageTimer: 0,
      seedGenTimer: 0,
      color:
        COL_FLOWER_COLORS[Math.floor(Math.random() * COL_FLOWER_COLORS.length)],
      swayOffset: Math.random() * Math.PI * 2,
      withering: false,
      witherTimer: 0,
      scaleAnim: 0, // will animate 0 → 1
    };
    this.plants.push(plant);

    // Pop particle effect
    this.spawnParticles(
      col * CELL_W + CELL_W / 2,
      row * CELL_H + CELL_H / 2,
      COL_SEED,
      6,
    );
  }

  private harvestPlant(plant: Plant): void {
    this.seeds += HARVEST_YIELD;
    plant.withering = true;
    plant.witherTimer = 500; // quick wither

    // Harvest particles
    this.spawnParticles(
      plant.col * CELL_W + CELL_W / 2,
      plant.row * CELL_H + CELL_H / 2,
      0xffd700,
      10,
    );
  }

  // ── Update ─────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    this.elapsed += delta;

    // Check game end
    if (this.elapsed >= GAME_DURATION) {
      this.endGame();
      return;
    }

    this.updatePlants(delta);
    this.updateBlight(delta);
    this.recalcAura();
    this.updateParticles(delta);

    // Drawing
    this.drawAliveGround();
    this.drawAuras();
    this.drawBlightOverlay();
    this.drawPlants();
    this.drawParticles();
    this.updateHUD();
  }

  // ── Plant Logic ────────────────────────────────────────
  private updatePlants(delta: number): void {
    this.bloomCount = 0;

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];

      // Pop scale animation
      if (p.scaleAnim < 1) {
        p.scaleAnim = Math.min(1, p.scaleAnim + delta * 0.005);
      }

      // Withering
      if (p.withering) {
        p.witherTimer -= delta;
        if (p.witherTimer <= 0) {
          this.plants.splice(i, 1);
          continue;
        }
        continue;
      }

      // Check if blighted
      if (this.grid[p.row][p.col] === CellState.Blighted) {
        p.withering = true;
        p.witherTimer = 1000;
        this.spawnParticles(
          p.col * CELL_W + CELL_W / 2,
          p.row * CELL_H + CELL_H / 2,
          COL_BLIGHT_EDGE,
          4,
        );
        continue;
      }

      // Growth
      if (p.stage < PlantStage.Bloom) {
        p.stageTimer += delta;
        if (p.stageTimer >= GROW_TIME) {
          p.stageTimer = 0;
          p.stage++;
          p.scaleAnim = 0.3; // re-trigger pop

          if (p.stage === PlantStage.Bloom) {
            this.spawnParticles(
              p.col * CELL_W + CELL_W / 2,
              p.row * CELL_H + CELL_H / 2,
              p.color,
              8,
            );
          }
        }
      }

      // Seed generation from bloomed flowers
      if (p.stage === PlantStage.Bloom) {
        this.bloomCount++;
        p.seedGenTimer += delta;
        if (p.seedGenTimer >= SEED_GEN_INTERVAL) {
          p.seedGenTimer = 0;
          this.seeds++;
          this.spawnParticles(
            p.col * CELL_W + CELL_W / 2,
            p.row * CELL_H + CELL_H / 2,
            COL_SEED,
            3,
          );
        }
      }
    }
  }

  // ── Aura Calculation ───────────────────────────────────
  private recalcAura(): void {
    // Reset
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.auraMap[r][c] = 0;
        if (this.grid[r][c] === CellState.Alive) {
          this.grid[r][c] = CellState.Soil; // reset alive, recalc below
        }
      }
    }

    // Calculate per-bloom aura
    const blooms = this.plants.filter(
      (p) => p.stage === PlantStage.Bloom && !p.withering,
    );

    for (const bloom of blooms) {
      // Count adjacent blooms for synergy
      let adjacentCount = 0;
      for (const other of blooms) {
        if (other === bloom) continue;
        const dist =
          Math.abs(other.col - bloom.col) + Math.abs(other.row - bloom.row);
        if (dist <= 2) adjacentCount++;
      }
      const radius = AURA_RADIUS + adjacentCount * SYNERGY_BONUS;
      const rSq = radius * radius;

      const minR = Math.max(0, Math.floor(bloom.row - radius));
      const maxR = Math.min(GRID_ROWS - 1, Math.ceil(bloom.row + radius));
      const minC = Math.max(0, Math.floor(bloom.col - radius));
      const maxC = Math.min(GRID_COLS - 1, Math.ceil(bloom.col + radius));

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const dSq = (c - bloom.col) ** 2 + (r - bloom.row) ** 2;
          if (dSq <= rSq) {
            const strength = 1 - dSq / rSq;
            this.auraMap[r][c] = Math.max(this.auraMap[r][c], strength);

            // Push back blight
            const key = `${c},${r}`;
            if (this.blightCells.has(key) && strength > 0.3) {
              this.blightCells.delete(key);
              this.grid[r][c] = CellState.Alive;
            } else if (this.grid[r][c] !== CellState.Blighted) {
              this.grid[r][c] = CellState.Alive;
            }
          }
        }
      }
    }

    // Also mark flower/sprout cells as alive
    for (const p of this.plants) {
      if (
        !p.withering &&
        p.stage >= PlantStage.Sprout &&
        this.grid[p.row][p.col] !== CellState.Blighted
      ) {
        this.grid[p.row][p.col] = CellState.Alive;
      }
    }
  }

  // ── Blight Logic ───────────────────────────────────────
  private updateBlight(delta: number): void {
    // Spawn new blight sources from edges
    this.blightSpawnTimer -= delta;
    if (this.blightSpawnTimer <= 0) {
      this.blightSpawnTimer = BLIGHT_SPAWN_INTERVAL;
      this.spawnBlightSource();
    }

    // Spread existing blight
    this.blightSpreadTimer -= delta;
    if (this.blightSpreadTimer <= 0) {
      this.blightSpreadTimer = BLIGHT_SPREAD_INTERVAL;
      this.spreadBlight();
    }
  }

  private spawnBlightSource(): void {
    // Random edge point
    const side = Math.floor(Math.random() * 4);
    let col: number, row: number;
    switch (side) {
      case 0: // top
        col = Math.floor(Math.random() * GRID_COLS);
        row = 0;
        break;
      case 1: // bottom
        col = Math.floor(Math.random() * GRID_COLS);
        row = GRID_ROWS - 1;
        break;
      case 2: // left
        col = 0;
        row = Math.floor(Math.random() * GRID_ROWS);
        break;
      default: // right
        col = GRID_COLS - 1;
        row = Math.floor(Math.random() * GRID_ROWS);
        break;
    }

    // Don't spawn in strong aura
    if (this.auraMap[row][col] > 0.5) return;

    this.blightSources.push({ col, row, active: true });
    const key = `${col},${row}`;
    this.blightCells.add(key);
    this.grid[row][col] = CellState.Blighted;
  }

  private spreadBlight(): void {
    const newCells: Array<[number, number]> = [];

    for (const key of this.blightCells) {
      const [c, r] = key.split(",").map(Number);

      // Try spreading to neighbors (with some randomness for organic feel)
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      // Add diagonal spread occasionally
      if (Math.random() < 0.3) {
        dirs.push([1, 1], [-1, -1], [1, -1], [-1, 1]);
      }

      for (const [dc, dr] of dirs) {
        if (Math.random() > 0.4) continue; // not every neighbor spreads

        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;

        const nKey = `${nc},${nr}`;
        if (this.blightCells.has(nKey)) continue;

        // Aura blocks blight spread
        if (this.auraMap[nr][nc] > 0.2) continue;

        newCells.push([nc, nr]);
      }
    }

    for (const [c, r] of newCells) {
      const key = `${c},${r}`;
      this.blightCells.add(key);
      this.grid[r][c] = CellState.Blighted;
    }
  }

  // ── Drawing: Alive Ground ──────────────────────────────
  private drawAliveGround(): void {
    this.groundGfx.clear();

    // Base soil
    this.groundGfx.fillStyle(COL_SOIL, 1);
    this.groundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw alive cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c] === CellState.Alive) {
          const strength = this.auraMap[r][c];
          const alpha = 0.3 + strength * 0.5;
          this.groundGfx.fillStyle(COL_ALIVE, alpha);
          this.groundGfx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
        }
      }
    }

    // Subtle grid
    this.groundGfx.lineStyle(1, 0x2a1e10, 0.15);
    for (let c = 0; c <= GRID_COLS; c++) {
      this.groundGfx.lineBetween(c * CELL_W, 70, c * CELL_W, GAME_HEIGHT);
    }
    for (let r = 2; r <= GRID_ROWS; r++) {
      this.groundGfx.lineBetween(0, r * CELL_H, GAME_WIDTH, r * CELL_H);
    }
  }

  // ── Drawing: Auras ─────────────────────────────────────
  private drawAuras(): void {
    this.auraGfx.clear();
    const time = this.elapsed * 0.001;

    const blooms = this.plants.filter(
      (p) => p.stage === PlantStage.Bloom && !p.withering,
    );

    for (const bloom of blooms) {
      const cx = bloom.col * CELL_W + CELL_W / 2;
      const cy = bloom.row * CELL_H + CELL_H / 2;

      // Count adjacent for radius
      let adjacentCount = 0;
      for (const other of blooms) {
        if (other === bloom) continue;
        const dist =
          Math.abs(other.col - bloom.col) + Math.abs(other.row - bloom.row);
        if (dist <= 2) adjacentCount++;
      }
      const radius = (AURA_RADIUS + adjacentCount * SYNERGY_BONUS) * CELL_W;

      // Pulsing aura
      const pulse = 1 + Math.sin(time * 2 + bloom.swayOffset) * 0.08;
      const r = radius * pulse;

      // Outer glow
      this.auraGfx.fillStyle(COL_AURA, 0.06);
      this.auraGfx.fillCircle(cx, cy, r * 1.2);

      // Main aura
      this.auraGfx.fillStyle(COL_AURA, 0.12);
      this.auraGfx.fillCircle(cx, cy, r);

      // Inner glow
      this.auraGfx.fillStyle(COL_AURA, 0.08);
      this.auraGfx.fillCircle(cx, cy, r * 0.6);
    }
  }

  // ── Drawing: Blight ────────────────────────────────────
  private drawBlightOverlay(): void {
    this.blightGfx.clear();
    const time = this.elapsed * 0.001;

    for (const key of this.blightCells) {
      const [c, r] = key.split(",").map(Number);
      const x = c * CELL_W;
      const y = r * CELL_H;

      // Main blight cell
      this.blightGfx.fillStyle(COL_BLIGHT, 0.9);
      this.blightGfx.fillRect(x, y, CELL_W, CELL_H);

      // Organic tendril edges — small circles at edges for noise effect
      const tendrils = 3;
      for (let t = 0; t < tendrils; t++) {
        const angle = (t / tendrils) * Math.PI * 2 + time * 0.5 + c * 0.7;
        const dist = CELL_W * 0.3 + Math.sin(time * 3 + r + t) * CELL_W * 0.15;
        const tx = x + CELL_W / 2 + Math.cos(angle) * dist;
        const ty = y + CELL_H / 2 + Math.sin(angle) * dist;
        const tSize = 3 + Math.sin(time * 2 + t * 1.5) * 1.5;

        this.blightGfx.fillStyle(COL_BLIGHT_EDGE, 0.7);
        this.blightGfx.fillCircle(tx, ty, tSize);
      }

      // Edge glow on blight boundaries
      const neighbors = [
        [c - 1, r],
        [c + 1, r],
        [c, r - 1],
        [c, r + 1],
      ];
      for (const [nc, nr] of neighbors) {
        if (
          nc >= 0 &&
          nc < GRID_COLS &&
          nr >= 0 &&
          nr < GRID_ROWS &&
          !this.blightCells.has(`${nc},${nr}`)
        ) {
          // This edge is a boundary — draw tendril extension
          const ex = nc * CELL_W + CELL_W / 2;
          const ey = nr * CELL_H + CELL_H / 2;
          const wobble = Math.sin(time * 4 + nc * 2.1 + nr * 1.7) * 4;
          this.blightGfx.fillStyle(COL_BLIGHT, 0.3);
          this.blightGfx.fillCircle(ex + wobble, ey + wobble, CELL_W * 0.25);
        }
      }
    }
  }

  // ── Drawing: Plants ────────────────────────────────────
  private drawPlants(): void {
    this.plantGfx.clear();
    const time = this.elapsed * 0.001;

    for (const p of this.plants) {
      const cx = p.col * CELL_W + CELL_W / 2;
      const cy = p.row * CELL_H + CELL_H / 2;

      // Ease-out bounce for pop animation
      const scale = this.easeOutBack(Math.min(1, p.scaleAnim));

      // Wither effect
      let alpha = 1;
      if (p.withering) {
        alpha = Math.max(0, p.witherTimer / 1000);
      }

      // Sway
      const sway = Math.sin(time * 1.5 + p.swayOffset) * 2;

      if (p.stage === PlantStage.Seed) {
        this.drawSeed(cx, cy, scale, alpha);
      } else if (p.stage === PlantStage.Sprout) {
        this.drawSprout(cx + sway, cy, scale, alpha, time, p);
      } else if (p.stage === PlantStage.Flower) {
        this.drawFlower(cx + sway, cy, p.color, scale * 0.7, alpha, time, p);
      } else if (p.stage === PlantStage.Bloom) {
        this.drawBloom(cx + sway, cy, p.color, scale, alpha, time, p);
      }
    }
  }

  private drawSeed(cx: number, cy: number, scale: number, alpha: number): void {
    const s = CELL_W * 0.2 * scale;
    this.plantGfx.fillStyle(COL_SEED, alpha);
    this.plantGfx.fillEllipse(cx, cy + 2, s * 2, s * 1.4);

    // Small crack detail
    this.plantGfx.lineStyle(1, 0x6a5535, alpha * 0.6);
    this.plantGfx.lineBetween(cx - s * 0.3, cy + 1, cx + s * 0.2, cy + 3);
  }

  private drawSprout(
    cx: number,
    cy: number,
    scale: number,
    alpha: number,
    time: number,
    plant: Plant,
  ): void {
    const h = CELL_H * 0.5 * scale;

    // Stem
    this.plantGfx.lineStyle(2 * scale, COL_SPROUT, alpha);
    this.plantGfx.lineBetween(cx, cy + CELL_H * 0.2, cx, cy - h * 0.5);

    // Two small leaves
    const leafSway = Math.sin(time * 2 + plant.swayOffset) * 3;
    this.plantGfx.fillStyle(COL_SPROUT, alpha);
    this.plantGfx.fillEllipse(
      cx - 5 * scale + leafSway * 0.5,
      cy - h * 0.3,
      8 * scale,
      4 * scale,
    );
    this.plantGfx.fillEllipse(
      cx + 5 * scale - leafSway * 0.5,
      cy - h * 0.2,
      7 * scale,
      3.5 * scale,
    );
  }

  private drawFlower(
    cx: number,
    cy: number,
    color: number,
    scale: number,
    alpha: number,
    time: number,
    plant: Plant,
  ): void {
    const h = CELL_H * 0.55 * scale;

    // Stem
    this.plantGfx.lineStyle(2, COL_SPROUT, alpha);
    this.plantGfx.lineBetween(cx, cy + CELL_H * 0.2, cx, cy - h);

    // Leaves
    const leafSway = Math.sin(time * 1.8 + plant.swayOffset) * 2;
    this.plantGfx.fillStyle(COL_SPROUT, alpha * 0.9);
    this.plantGfx.fillEllipse(cx - 6, cy - h * 0.3 + leafSway, 9, 4);
    this.plantGfx.fillEllipse(cx + 6, cy - h * 0.5 - leafSway, 8, 3.5);

    // Flower bud (partially open)
    const petalSize = 4 * scale;
    const petals = 4;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 + time * 0.3;
      const px = cx + Math.cos(angle) * petalSize;
      const py = cy - h + Math.sin(angle) * petalSize * 0.7;
      this.plantGfx.fillStyle(color, alpha * 0.8);
      this.plantGfx.fillCircle(px, py, 3 * scale);
    }

    // Center
    this.plantGfx.fillStyle(0xffee88, alpha);
    this.plantGfx.fillCircle(cx, cy - h, 2 * scale);
  }

  private drawBloom(
    cx: number,
    cy: number,
    color: number,
    scale: number,
    alpha: number,
    time: number,
    plant: Plant,
  ): void {
    const h = CELL_H * 0.6;

    // Stem
    this.plantGfx.lineStyle(2.5, COL_SPROUT, alpha);
    this.plantGfx.lineBetween(cx, cy + CELL_H * 0.2, cx, cy - h);

    // Leaves
    const leafSway = Math.sin(time * 1.5 + plant.swayOffset) * 2.5;
    this.plantGfx.fillStyle(COL_SPROUT, alpha);
    this.plantGfx.fillEllipse(cx - 7, cy - h * 0.25 + leafSway, 10, 5);
    this.plantGfx.fillEllipse(cx + 7, cy - h * 0.45 - leafSway, 9, 4.5);
    this.plantGfx.fillEllipse(cx - 5, cy - h * 0.6 + leafSway * 0.5, 7, 3);

    // Full bloom petals
    const flowerY = cy - h - 2;
    const petalCount = 6;
    const petalSize = 6 * scale;
    const breathe = 1 + Math.sin(time * 2 + plant.swayOffset) * 0.1;

    for (let i = 0; i < petalCount; i++) {
      const angle =
        (i / petalCount) * Math.PI * 2 + time * 0.2 + plant.swayOffset;
      const dist = petalSize * breathe;
      const px = cx + Math.cos(angle) * dist;
      const py = flowerY + Math.sin(angle) * dist * 0.8;
      this.plantGfx.fillStyle(color, alpha * 0.9);
      this.plantGfx.fillCircle(px, py, petalSize * 0.7);
    }

    // Inner petals (lighter)
    for (let i = 0; i < petalCount; i++) {
      const angle =
        (i / petalCount) * Math.PI * 2 + Math.PI / petalCount + time * 0.15;
      const dist = petalSize * 0.5 * breathe;
      const px = cx + Math.cos(angle) * dist;
      const py = flowerY + Math.sin(angle) * dist * 0.8;
      this.plantGfx.fillStyle(this.lightenColor(color), alpha * 0.7);
      this.plantGfx.fillCircle(px, py, petalSize * 0.45);
    }

    // Center
    this.plantGfx.fillStyle(0xffee44, alpha);
    this.plantGfx.fillCircle(cx, flowerY, 3 * scale);
    this.plantGfx.fillStyle(0xffcc00, alpha);
    this.plantGfx.fillCircle(cx, flowerY, 2 * scale);
  }

  // ── Particles ──────────────────────────────────────────
  private spawnParticles(
    x: number,
    y: number,
    color: number,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 600 + Math.random() * 400,
        maxLife: 600 + Math.random() * 400,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      p.vy += 60 * (delta / 1000); // gravity
      p.life -= delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.plantGfx.fillStyle(p.color, alpha);
      this.plantGfx.fillCircle(p.x, p.y, p.size * alpha);
    }
  }

  // ── Game End ───────────────────────────────────────────
  private endGame(): void {
    this.gameOver = true;

    const won = this.bloomCount >= GOAL_BLOOMS;
    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "48px",
      color: won ? "#44ff88" : "#ff4444",
      align: "center",
    };

    const bodyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#cccccc",
      align: "center",
    };

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.35,
        won ? "GARDEN BLOOMS" : "BLIGHT PREVAILS",
        titleStyle,
      )
      .setOrigin(0.5)
      .setDepth(21);

    const totalCells = GRID_COLS * GRID_ROWS;
    const blightPct = ((this.blightCells.size / totalCells) * 100).toFixed(1);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.45,
        `Blooms: ${this.bloomCount}\nSeeds: ${this.seeds}\nBlight: ${blightPct}%`,
        bodyStyle,
      )
      .setOrigin(0.5)
      .setDepth(21);

    // Restart prompt
    const restartStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#888888",
    };
    const restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.6, "Tap for menu", restartStyle)
      .setOrigin(0.5)
      .setDepth(21);

    // Blink
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Restart on tap after delay
    this.time.delayedCall(1000, () => {
      this.input.once("pointerdown", () => {
        this.scene.start("PrototypeMenuScene");
      });
    });
  }

  // ── Utilities ──────────────────────────────────────────
  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private lightenColor(color: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 60);
    const g = Math.min(255, ((color >> 8) & 0xff) + 60);
    const b = Math.min(255, (color & 0xff) + 60);
    return (r << 16) | (g << 8) | b;
  }
}
