import Phaser from "phaser";

// ─── Constants ───────────────────────────────────────────────
const W = 720;
const H = 1280;
const CX = W / 2;
const CY = H / 2 + 40; // slightly below center for HUD room
const DISH_RADIUS = 310;
const DISH_INNER = DISH_RADIUS - 6;

const GAME_DURATION = 60; // seconds
const WIN_CELL_COUNT = 30;
const CELL_GROW_TIME = 3000; // ms to regrow to splittable
const MIN_SPLIT_RADIUS = 14;
const START_RADIUS = 32;
const MAX_RADIUS = 38;
const MERGE_COOLDOWN = 600; // ms after split before merge allowed
const VIRUS_INTERVAL_MIN = 5000;
const VIRUS_INTERVAL_MAX = 9000;
const VIRUS_SPEED = 90;
const VIRUS_RADIUS = 18;
const MAX_CELLS = 60;

// Colors
const BG_COLOR = 0x0a0a1a;
const DISH_COLOR = 0x1a1a3a;
const DISH_BORDER = 0x2a3a6a;
const GRID_COLOR = 0x1e2040;

enum CellType {
  RED = 0,
  BLUE = 1,
  GREEN = 2,
}

const CELL_COLORS: Record<CellType, number> = {
  [CellType.RED]: 0xff4466,
  [CellType.BLUE]: 0x4488ff,
  [CellType.GREEN]: 0x44ff88,
};

const CELL_NAMES: Record<CellType, string> = {
  [CellType.RED]: "RED",
  [CellType.BLUE]: "BLUE",
  [CellType.GREEN]: "GREEN",
};

const CELL_SPEEDS: Record<CellType, number> = {
  [CellType.RED]: 60,
  [CellType.BLUE]: 25,
  [CellType.GREEN]: 35,
};

// ─── Cell Data ───────────────────────────────────────────────
interface CellData {
  id: number;
  type: CellType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  age: number; // ms since creation
  wobblePhase: number;
  wobbleSpeed: number;
  alive: boolean;
  splitting: boolean;
  splitTimer: number;
  mergeImmune: number; // ms remaining
  nucleusPhase: number;
  organelleAngles: number[];
}

interface VirusData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alive: boolean;
  phase: number;
  spikeCount: number;
}

// ─── Scene ───────────────────────────────────────────────────
export class SplitScene extends Phaser.Scene {
  private cells: CellData[] = [];
  private viruses: VirusData[] = [];
  private nextCellId = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private hudGfx!: Phaser.GameObjects.Graphics;

  // Swipe tracking
  private swipeStart: { x: number; y: number } | null = null;
  private swipeEnd: { x: number; y: number } | null = null;
  private isSwiping = false;
  private swipeTrail: { x: number; y: number; t: number }[] = [];

  // Timer
  private timeRemaining = GAME_DURATION;
  private gameOver = false;
  private gameWon = false;

  // Virus spawn
  private virusTimer = 0;
  private nextVirusAt = 0;

  // Score particles
  private particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: number;
    size: number;
  }[] = [];

  // Screen shake
  private shakeAmount = 0;

  // HUD text objects
  private cellCountText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  // Microscope lens effect
  private lensGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "SplitScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cells = [];
    this.viruses = [];
    this.particles = [];
    this.nextCellId = 0;
    this.timeRemaining = GAME_DURATION;
    this.gameOver = false;
    this.gameWon = false;
    this.virusTimer = 0;
    this.shakeAmount = 0;
    this.nextVirusAt = Phaser.Math.Between(
      VIRUS_INTERVAL_MIN,
      VIRUS_INTERVAL_MAX,
    );

    // Graphics layers
    this.gfx = this.add.graphics().setDepth(1);
    this.hudGfx = this.add.graphics().setDepth(10);
    this.lensGfx = this.add.graphics().setDepth(5);

    // HUD text
    this.cellCountText = this.add
      .text(CX, 50, "0 / 30", {
        fontSize: "36px",
        fontFamily: "monospace",
        color: "#aaccff",
        stroke: "#0a0a1a",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.timerText = this.add
      .text(CX, 95, "60", {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#7799cc",
        stroke: "#0a0a1a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.statusText = this.add
      .text(CX, H - 50, "Swipe cells to split them!", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#556688",
      })
      .setOrigin(0.5)
      .setDepth(11);

    // Spawn initial cell
    this.spawnCell(CX, CY, CellType.GREEN, START_RADIUS);

    // Input handlers
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  // ─── Input ─────────────────────────────────────────────────
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver) {
      this.scene.start("PrototypeMenuScene");
      return;
    }
    this.swipeStart = { x: pointer.x, y: pointer.y };
    this.swipeEnd = null;
    this.isSwiping = true;
    this.swipeTrail = [{ x: pointer.x, y: pointer.y, t: 0 }];
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isSwiping) return;
    this.swipeEnd = { x: pointer.x, y: pointer.y };
    this.swipeTrail.push({ x: pointer.x, y: pointer.y, t: 0 });
    if (this.swipeTrail.length > 20) this.swipeTrail.shift();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isSwiping || !this.swipeStart) {
      this.isSwiping = false;
      return;
    }
    this.swipeEnd = { x: pointer.x, y: pointer.y };
    const dx = this.swipeEnd.x - this.swipeStart.x;
    const dy = this.swipeEnd.y - this.swipeStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 20) {
      this.processSwipe(this.swipeStart, this.swipeEnd, dx, dy, dist);
    }

    this.isSwiping = false;
    this.swipeStart = null;
  }

  private processSwipe(
    start: { x: number; y: number },
    end: { x: number; y: number },
    dx: number,
    dy: number,
    dist: number,
  ): void {
    const nx = dx / dist;
    const ny = dy / dist;

    // Find cells that the swipe line crosses
    const splitCells: CellData[] = [];

    for (const cell of this.cells) {
      if (!cell.alive || cell.splitting || cell.radius < MIN_SPLIT_RADIUS)
        continue;

      // Point-to-line-segment distance
      const d = this.pointToSegmentDist(
        cell.x,
        cell.y,
        start.x,
        start.y,
        end.x,
        end.y,
      );
      if (d < cell.radius + 5) {
        splitCells.push(cell);
      }
    }

    // Determine type bias from swipe direction
    const typeBias = this.getTypeBias(nx, ny);

    for (const cell of splitCells) {
      this.splitCell(cell, nx, ny, typeBias);
    }
  }

  private pointToSegmentDist(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): number {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    if (ab2 === 0) return Math.sqrt(apx * apx + apy * apy);
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const dx = px - cx;
    const dy = py - cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTypeBias(nx: number, ny: number): CellType | null {
    // up=green, left=blue, right=red, down=random
    const angle = Math.atan2(ny, nx);
    // up: -PI/2 ± PI/4
    if (angle < -Math.PI / 4 && angle > (-3 * Math.PI) / 4)
      return CellType.GREEN;
    // right: 0 ± PI/4
    if (angle > -Math.PI / 4 && angle < Math.PI / 4) return CellType.RED;
    // left: PI ± PI/4
    if (angle > (3 * Math.PI) / 4 || angle < (-3 * Math.PI) / 4)
      return CellType.BLUE;
    // down: random
    return null;
  }

  // ─── Cell Operations ──────────────────────────────────────
  private spawnCell(
    x: number,
    y: number,
    type: CellType,
    radius: number,
    vx = 0,
    vy = 0,
  ): CellData | null {
    if (this.cells.filter((c) => c.alive).length >= MAX_CELLS) return null;

    const cell: CellData = {
      id: this.nextCellId++,
      type,
      x,
      y,
      vx,
      vy,
      radius: Math.max(radius, 6),
      targetRadius: MAX_RADIUS,
      age: 0,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 1.5 + Math.random() * 1.5,
      alive: true,
      splitting: false,
      splitTimer: 0,
      mergeImmune: MERGE_COOLDOWN,
      nucleusPhase: Math.random() * Math.PI * 2,
      organelleAngles: Array.from(
        { length: 3 + Math.floor(Math.random() * 3) },
        () => Math.random() * Math.PI * 2,
      ),
    };
    this.cells.push(cell);
    return cell;
  }

  private splitCell(
    cell: CellData,
    nx: number,
    ny: number,
    typeBias: CellType | null,
  ): void {
    if (this.cells.filter((c) => c.alive).length >= MAX_CELLS - 1) return;

    cell.splitting = true;
    cell.splitTimer = 0;

    // Determine child types
    const childType1 =
      typeBias !== null && Math.random() < 0.7 ? typeBias : cell.type;
    const childType2 =
      typeBias === null
        ? [CellType.RED, CellType.BLUE, CellType.GREEN][
            Phaser.Math.Between(0, 2)
          ]
        : Math.random() < 0.5
          ? typeBias
          : cell.type;

    const splitSpeed = 120 + Math.random() * 40;
    const childRadius = cell.radius * 0.6;
    const perpX = -ny;
    const perpY = nx;
    const offset = cell.radius * 0.4;

    // Burst particles at split point
    this.emitParticles(cell.x, cell.y, CELL_COLORS[cell.type], 12);
    this.shakeAmount = 3;

    // Spawn two children
    const c1 = this.spawnCell(
      cell.x + perpX * offset,
      cell.y + perpY * offset,
      childType1,
      childRadius,
      nx * splitSpeed * 0.5 + perpX * splitSpeed * 0.5,
      ny * splitSpeed * 0.5 + perpY * splitSpeed * 0.5,
    );
    const c2 = this.spawnCell(
      cell.x - perpX * offset,
      cell.y - perpY * offset,
      childType2,
      childRadius,
      nx * splitSpeed * 0.5 - perpX * splitSpeed * 0.5,
      ny * splitSpeed * 0.5 - perpY * splitSpeed * 0.5,
    );

    if (c1) c1.mergeImmune = MERGE_COOLDOWN;
    if (c2) c2.mergeImmune = MERGE_COOLDOWN;

    // Kill parent
    cell.alive = false;
  }

  // ─── Update ────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.gameOver) {
      this.drawAll(delta);
      return;
    }

    const dt = delta / 1000;
    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame(false);
      return;
    }

    const aliveCells = this.cells.filter((c) => c.alive);
    if (aliveCells.length >= WIN_CELL_COUNT && !this.gameWon) {
      this.gameWon = true;
      this.endGame(true);
      return;
    }

    // Update cells
    this.updateCells(delta);

    // Virus spawning
    this.virusTimer += delta;
    if (this.virusTimer >= this.nextVirusAt) {
      this.spawnVirus();
      this.virusTimer = 0;
      this.nextVirusAt = Phaser.Math.Between(
        VIRUS_INTERVAL_MIN,
        VIRUS_INTERVAL_MAX,
      );
    }

    // Update viruses
    this.updateViruses(delta);

    // Check collisions
    this.checkCellCollisions();
    this.checkVirusCellCollisions();

    // Update particles
    this.updateParticles(delta);

    // Decay shake
    this.shakeAmount *= 0.9;
    if (this.shakeAmount < 0.1) this.shakeAmount = 0;

    // Green cells generate score text
    // (visual only — score is cell count)

    // Draw everything
    this.drawAll(delta);

    // Update HUD text
    const alive = this.cells.filter((c) => c.alive).length;
    this.cellCountText.setText(`${alive} / ${WIN_CELL_COUNT}`);
    this.cellCountText.setColor(
      alive >= WIN_CELL_COUNT ? "#44ff88" : "#aaccff",
    );

    const secs = Math.ceil(this.timeRemaining);
    this.timerText.setText(`${secs}s`);
    this.timerText.setColor(secs <= 10 ? "#ff4466" : "#7799cc");

    // Update status text based on state
    if (alive < 5) {
      this.statusText.setText("Swipe cells to split them!");
    } else if (alive < 15) {
      this.statusText.setText("Keep splitting! Watch the edges.");
    } else if (alive < 25) {
      this.statusText.setText("Almost there...");
    } else {
      this.statusText.setText(`${WIN_CELL_COUNT - alive} more to win!`);
    }
  }

  private updateCells(delta: number): void {
    for (const cell of this.cells) {
      if (!cell.alive) continue;

      cell.age += delta;
      cell.wobblePhase += cell.wobbleSpeed * (delta / 1000);
      cell.nucleusPhase += 0.8 * (delta / 1000);

      // Decrease merge immunity
      if (cell.mergeImmune > 0) cell.mergeImmune -= delta;

      // Grow toward target
      if (cell.radius < cell.targetRadius) {
        const growRate =
          ((cell.targetRadius - MIN_SPLIT_RADIUS * 0.6) / CELL_GROW_TIME) *
          delta;
        cell.radius = Math.min(cell.radius + growRate, cell.targetRadius);
      }

      // Organelle orbiting
      for (let i = 0; i < cell.organelleAngles.length; i++) {
        cell.organelleAngles[i] += (0.5 + i * 0.3) * (delta / 1000);
      }

      // Apply type-based wandering
      const speed = CELL_SPEEDS[cell.type];
      const wanderAngle = Math.sin(cell.age * 0.001 + cell.id * 7) * Math.PI;
      cell.vx += Math.cos(wanderAngle) * speed * 0.02;
      cell.vy += Math.sin(wanderAngle) * speed * 0.02;

      // Damping
      cell.vx *= 0.97;
      cell.vy *= 0.97;

      // Move
      cell.x += cell.vx * (delta / 1000);
      cell.y += cell.vy * (delta / 1000);

      // Contain within petri dish
      const dx = cell.x - CX;
      const dy = cell.y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = DISH_INNER - cell.radius;

      if (dist > maxDist) {
        if (dist > DISH_INNER + cell.radius * 0.3) {
          // Cell too far out — kill it
          cell.alive = false;
          this.emitParticles(cell.x, cell.y, CELL_COLORS[cell.type], 8);
          this.shakeAmount = 2;
          continue;
        }
        // Push back
        const nx = dx / dist;
        const ny = dy / dist;
        cell.x = CX + nx * maxDist;
        cell.y = CY + ny * maxDist;
        // Bounce inward
        const dot = cell.vx * nx + cell.vy * ny;
        cell.vx -= 2 * dot * nx;
        cell.vy -= 2 * dot * ny;
        cell.vx *= 0.5;
        cell.vy *= 0.5;
      }
    }

    // Clean up dead cells
    this.cells = this.cells.filter((c) => c.alive);
  }

  private checkCellCollisions(): void {
    const alive = this.cells.filter((c) => c.alive);

    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        if (!a.alive || !b.alive) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist) {
          // Same type + both mature + merge immune worn off → merge
          if (
            a.type === b.type &&
            a.mergeImmune <= 0 &&
            b.mergeImmune <= 0 &&
            a.radius >= MIN_SPLIT_RADIUS &&
            b.radius >= MIN_SPLIT_RADIUS
          ) {
            // Merge: bigger absorbs smaller
            const bigger = a.radius >= b.radius ? a : b;
            const smaller = a.radius >= b.radius ? b : a;
            bigger.radius = Math.min(
              MAX_RADIUS,
              Math.sqrt(
                bigger.radius * bigger.radius +
                  smaller.radius * smaller.radius * 0.5,
              ),
            );
            smaller.alive = false;
            this.emitParticles(
              smaller.x,
              smaller.y,
              CELL_COLORS[smaller.type],
              4,
            );
          } else {
            // Separate (push apart)
            if (dist < 0.1) continue;
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const pushFactor = 0.5;
            a.x -= nx * overlap * pushFactor;
            a.y -= ny * overlap * pushFactor;
            b.x += nx * overlap * pushFactor;
            b.y += ny * overlap * pushFactor;

            // Exchange some velocity
            const relVx = b.vx - a.vx;
            const relVy = b.vy - a.vy;
            const relDot = relVx * nx + relVy * ny;
            if (relDot < 0) {
              a.vx += nx * relDot * 0.3;
              a.vy += ny * relDot * 0.3;
              b.vx -= nx * relDot * 0.3;
              b.vy -= ny * relDot * 0.3;
            }
          }
        }
      }
    }
  }

  // ─── Viruses ───────────────────────────────────────────────
  private spawnVirus(): void {
    // Enter from random edge of dish
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = DISH_RADIUS + 30;
    const x = CX + Math.cos(angle) * spawnDist;
    const y = CY + Math.sin(angle) * spawnDist;

    // Move toward center with some randomness
    const targetAngle =
      Math.atan2(CY - y, CX - x) + (Math.random() - 0.5) * 0.6;

    this.viruses.push({
      x,
      y,
      vx: Math.cos(targetAngle) * VIRUS_SPEED,
      vy: Math.sin(targetAngle) * VIRUS_SPEED,
      radius: VIRUS_RADIUS,
      alive: true,
      phase: Math.random() * Math.PI * 2,
      spikeCount: 8 + Math.floor(Math.random() * 4),
    });
  }

  private updateViruses(delta: number): void {
    for (const v of this.viruses) {
      if (!v.alive) continue;
      v.phase += 2.5 * (delta / 1000);
      v.x += v.vx * (delta / 1000);
      v.y += v.vy * (delta / 1000);

      // Remove if exits dish on other side
      const dx = v.x - CX;
      const dy = v.y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > DISH_RADIUS + 60) {
        v.alive = false;
      }
    }
    this.viruses = this.viruses.filter((v) => v.alive);
  }

  private checkVirusCellCollisions(): void {
    for (const v of this.viruses) {
      if (!v.alive) continue;
      for (const cell of this.cells) {
        if (!cell.alive) continue;
        const dx = cell.x - v.x;
        const dy = cell.y - v.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cell.radius + v.radius) {
          cell.alive = false;
          this.emitParticles(cell.x, cell.y, CELL_COLORS[cell.type], 10);
          this.emitParticles(cell.x, cell.y, 0x2a002a, 6);
          this.shakeAmount = 4;
        }
      }
    }
  }

  // ─── Particles ─────────────────────────────────────────────
  private emitParticles(
    x: number,
    y: number,
    color: number,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.4,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  private updateParticles(delta: number): void {
    const dt = delta / 1000;
    for (const p of this.particles) {
      p.life -= dt / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // ─── Drawing ───────────────────────────────────────────────
  private drawAll(_delta: number): void {
    this.gfx.clear();
    this.hudGfx.clear();
    this.lensGfx.clear();

    // Camera shake offset
    const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
    const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;

    this.drawDish(shakeX, shakeY);
    this.drawCells(shakeX, shakeY);
    this.drawViruses(shakeX, shakeY);
    this.drawParticles(shakeX, shakeY);
    this.drawSwipeTrail();
    this.drawHUD();
    this.drawLensEffect(shakeX, shakeY);

    if (this.gameOver) {
      this.drawEndScreen();
    }
  }

  private drawDish(sx: number, sy: number): void {
    const g = this.gfx;
    const cx = CX + sx;
    const cy = CY + sy;

    // Outer glow
    g.lineStyle(3, DISH_BORDER, 0.15);
    g.strokeCircle(cx, cy, DISH_RADIUS + 8);
    g.lineStyle(2, DISH_BORDER, 0.25);
    g.strokeCircle(cx, cy, DISH_RADIUS + 4);

    // Dish fill
    g.fillStyle(DISH_COLOR, 0.6);
    g.fillCircle(cx, cy, DISH_RADIUS);

    // Grid lines inside dish
    g.lineStyle(1, GRID_COLOR, 0.3);
    const gridSize = 40;
    for (let x = cx - DISH_RADIUS; x <= cx + DISH_RADIUS; x += gridSize) {
      // Clip to dish circle
      const relX = x - cx;
      if (Math.abs(relX) >= DISH_RADIUS) continue;
      const h = Math.sqrt(DISH_RADIUS * DISH_RADIUS - relX * relX);
      g.lineBetween(x, cy - h, x, cy + h);
    }
    for (let y = cy - DISH_RADIUS; y <= cy + DISH_RADIUS; y += gridSize) {
      const relY = y - cy;
      if (Math.abs(relY) >= DISH_RADIUS) continue;
      const w = Math.sqrt(DISH_RADIUS * DISH_RADIUS - relY * relY);
      g.lineBetween(cx - w, y, cx + w, y);
    }

    // Dish border
    g.lineStyle(2, DISH_BORDER, 0.6);
    g.strokeCircle(cx, cy, DISH_RADIUS);

    // Inner subtle ring
    g.lineStyle(1, DISH_BORDER, 0.2);
    g.strokeCircle(cx, cy, DISH_RADIUS - 20);
  }

  private drawCells(sx: number, sy: number): void {
    const g = this.gfx;

    for (const cell of this.cells) {
      if (!cell.alive) continue;

      const cx = cell.x + sx;
      const cy = cell.y + sy;
      const baseColor = CELL_COLORS[cell.type];

      // Wobble radius
      const wobble = Math.sin(cell.wobblePhase) * 2;
      const r = cell.radius + wobble;

      // Cell membrane (outer glow)
      g.fillStyle(baseColor, 0.08);
      g.fillCircle(cx, cy, r + 6);

      // Cell body — draw as organic blob
      this.drawOrganicBlob(g, cx, cy, r, baseColor, cell.wobblePhase, 0.6);

      // Inner body (brighter)
      this.drawOrganicBlob(
        g,
        cx,
        cy,
        r * 0.75,
        baseColor,
        cell.wobblePhase + 1,
        0.4,
      );

      // Nucleus
      const nucX = cx + Math.cos(cell.nucleusPhase) * r * 0.15;
      const nucY = cy + Math.sin(cell.nucleusPhase * 1.3) * r * 0.15;
      g.fillStyle(this.brightenColor(baseColor, 0.3), 0.7);
      g.fillCircle(nucX, nucY, r * 0.25);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(nucX - r * 0.05, nucY - r * 0.05, r * 0.12);

      // Organelles
      for (let i = 0; i < cell.organelleAngles.length; i++) {
        const a = cell.organelleAngles[i];
        const orbR = r * (0.35 + i * 0.08);
        const ox = cx + Math.cos(a) * orbR;
        const oy = cy + Math.sin(a) * orbR;
        g.fillStyle(baseColor, 0.3);
        g.fillCircle(ox, oy, 2 + Math.sin(a * 2) * 1);
      }

      // Highlight
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(cx - r * 0.25, cy - r * 0.3, r * 0.2);

      // Splittable indicator (pulsing ring when ready)
      if (cell.radius >= MIN_SPLIT_RADIUS && cell.age > 500) {
        const pulse = 0.15 + Math.sin(cell.age * 0.003) * 0.1;
        g.lineStyle(1.5, 0xffffff, pulse);
        g.strokeCircle(cx, cy, r + 3);
      }
    }
  }

  private drawOrganicBlob(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    color: number,
    phase: number,
    alpha: number,
  ): void {
    const points: { x: number; y: number }[] = [];
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const wobble =
        Math.sin(angle * 3 + phase) * 1.5 +
        Math.sin(angle * 5 + phase * 1.7) * 0.8;
      const r = radius + wobble;
      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }

    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      g.lineTo(cpx, cpy);
      g.lineTo(curr.x, curr.y);
    }
    g.closePath();
    g.fillPath();
  }

  private drawViruses(sx: number, sy: number): void {
    const g = this.gfx;

    for (const v of this.viruses) {
      if (!v.alive) continue;
      const cx = v.x + sx;
      const cy = v.y + sy;
      const pulse = 1 + Math.sin(v.phase * 3) * 0.15;
      const r = v.radius * pulse;

      // Menacing aura
      g.fillStyle(0x440044, 0.15);
      g.fillCircle(cx, cy, r + 12);
      g.fillStyle(0x330033, 0.2);
      g.fillCircle(cx, cy, r + 6);

      // Spiky body
      g.fillStyle(0x2a002a, 0.9);
      g.beginPath();
      for (let i = 0; i < v.spikeCount * 2; i++) {
        const angle = (i / (v.spikeCount * 2)) * Math.PI * 2 + v.phase * 0.5;
        const spikeR =
          i % 2 === 0 ? r + 8 + Math.sin(v.phase + i) * 3 : r * 0.6;
        const px = cx + Math.cos(angle) * spikeR;
        const py = cy + Math.sin(angle) * spikeR;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();

      // Inner core
      g.fillStyle(0x550055, 0.7);
      g.fillCircle(cx, cy, r * 0.5);

      // Evil eye
      g.fillStyle(0xff00ff, 0.4 + Math.sin(v.phase * 2) * 0.2);
      g.fillCircle(cx, cy, r * 0.2);
    }
  }

  private drawParticles(sx: number, sy: number): void {
    const g = this.gfx;
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      g.fillStyle(p.color, alpha * 0.8);
      g.fillCircle(p.x + sx, p.y + sy, p.size * alpha);
    }
  }

  private drawSwipeTrail(): void {
    if (!this.isSwiping || this.swipeTrail.length < 2) return;
    const g = this.gfx;

    g.lineStyle(3, 0xffffff, 0.3);
    g.beginPath();
    g.moveTo(this.swipeTrail[0].x, this.swipeTrail[0].y);
    for (let i = 1; i < this.swipeTrail.length; i++) {
      g.lineTo(this.swipeTrail[i].x, this.swipeTrail[i].y);
    }
    g.strokePath();

    // Direction indicator dots
    if (this.swipeStart && this.swipeEnd) {
      const dx = this.swipeEnd.x - this.swipeStart.x;
      const dy = this.swipeEnd.y - this.swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 20) {
        const nx = dx / dist;
        const ny = dy / dist;
        const bias = this.getTypeBias(nx, ny);
        if (bias !== null) {
          g.fillStyle(CELL_COLORS[bias], 0.5);
        } else {
          g.fillStyle(0xffffff, 0.3);
        }
        g.fillCircle(this.swipeEnd.x, this.swipeEnd.y, 6);
      }
    }
  }

  private drawHUD(): void {
    const g = this.hudGfx;

    // Type distribution bar
    const barX = 60;
    const barY = 140;
    const barW = W - 120;
    const barH = 8;

    const alive = this.cells.filter((c) => c.alive);
    const total = alive.length || 1;
    const redCount = alive.filter((c) => c.type === CellType.RED).length;
    const blueCount = alive.filter((c) => c.type === CellType.BLUE).length;
    const greenCount = alive.filter((c) => c.type === CellType.GREEN).length;

    // Background
    g.fillStyle(0x111122, 0.8);
    g.fillRoundedRect(barX - 4, barY - 4, barW + 8, barH + 8, 6);

    // Segments
    const rw = (redCount / total) * barW;
    const bw = (blueCount / total) * barW;
    const gw = (greenCount / total) * barW;

    if (rw > 0) {
      g.fillStyle(CELL_COLORS[CellType.RED], 0.8);
      g.fillRoundedRect(barX, barY, rw, barH, 4);
    }
    if (bw > 0) {
      g.fillStyle(CELL_COLORS[CellType.BLUE], 0.8);
      g.fillRoundedRect(barX + rw, barY, bw, barH, 4);
    }
    if (gw > 0) {
      g.fillStyle(CELL_COLORS[CellType.GREEN], 0.8);
      g.fillRoundedRect(barX + rw + bw, barY, gw, barH, 4);
    }

    // Labels under bar
    const labelY = barY + 16;
    // Draw small colored dots with counts
    this.drawTypeLabel(g, barX, labelY, CellType.RED, redCount);
    this.drawTypeLabel(g, barX + barW * 0.37, labelY, CellType.BLUE, blueCount);
    this.drawTypeLabel(
      g,
      barX + barW * 0.74,
      labelY,
      CellType.GREEN,
      greenCount,
    );

    // Direction guide at bottom
    this.drawDirectionGuide(g);
  }

  private drawTypeLabel(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    type: CellType,
    count: number,
  ): void {
    g.fillStyle(CELL_COLORS[type], 0.8);
    g.fillCircle(x + 4, y + 4, 4);

    // Use existing text objects would be better, but for simplicity:
    // We'll just draw more dots to represent count
    g.fillStyle(CELL_COLORS[type], 0.4);
    const label = `${CELL_NAMES[type]} ${count}`;
    // Since we can't easily draw text with Graphics, we rely on the status text
    // For the type distribution, the bar itself is clear enough
    for (let i = 0; i < Math.min(count, 10); i++) {
      g.fillCircle(x + 14 + i * 6, y + 4, 2);
    }
    if (count > 10) {
      g.fillStyle(CELL_COLORS[type], 0.6);
      g.fillCircle(x + 14 + 10 * 6 + 4, y + 4, 3);
    }
  }

  private drawDirectionGuide(g: Phaser.GameObjects.Graphics): void {
    const guideX = CX;
    const guideY = H - 100;
    const guideR = 25;

    // Background circle
    g.fillStyle(0x111122, 0.5);
    g.fillCircle(guideX, guideY, guideR + 4);
    g.lineStyle(1, 0x334466, 0.5);
    g.strokeCircle(guideX, guideY, guideR + 4);

    // Direction arrows with colors
    // Up = green
    g.fillStyle(CELL_COLORS[CellType.GREEN], 0.6);
    g.fillTriangle(
      guideX,
      guideY - guideR,
      guideX - 5,
      guideY - guideR + 10,
      guideX + 5,
      guideY - guideR + 10,
    );

    // Right = red
    g.fillStyle(CELL_COLORS[CellType.RED], 0.6);
    g.fillTriangle(
      guideX + guideR,
      guideY,
      guideX + guideR - 10,
      guideY - 5,
      guideX + guideR - 10,
      guideY + 5,
    );

    // Left = blue
    g.fillStyle(CELL_COLORS[CellType.BLUE], 0.6);
    g.fillTriangle(
      guideX - guideR,
      guideY,
      guideX - guideR + 10,
      guideY - 5,
      guideX - guideR + 10,
      guideY + 5,
    );

    // Down = random (white)
    g.fillStyle(0xffffff, 0.4);
    g.fillTriangle(
      guideX,
      guideY + guideR,
      guideX - 5,
      guideY + guideR - 10,
      guideX + 5,
      guideY + guideR - 10,
    );

    // Center dot
    g.fillStyle(0x556688, 0.5);
    g.fillCircle(guideX, guideY, 3);
  }

  private drawLensEffect(sx: number, sy: number): void {
    const g = this.lensGfx;
    const cx = CX + sx;
    const cy = CY + sy;

    // Microscope vignette — ring of darkness around dish
    // We draw a thick semi-transparent ring outside the dish
    g.fillStyle(BG_COLOR, 0.3);
    for (let i = 0; i < 10; i++) {
      const r = DISH_RADIUS + 10 + i * 8;
      const alpha = 0.05 + i * 0.04;
      g.lineStyle(8, BG_COLOR, alpha);
      g.strokeCircle(cx, cy, r);
    }

    // Lens flare / reflection on dish glass
    const flareX = cx - DISH_RADIUS * 0.4;
    const flareY = cy - DISH_RADIUS * 0.4;
    g.fillStyle(0xffffff, 0.03);
    g.fillEllipse(flareX, flareY, DISH_RADIUS * 0.6, DISH_RADIUS * 0.3);
  }

  private drawEndScreen(): void {
    const g = this.hudGfx;

    // Overlay
    g.fillStyle(0x000000, 0.6);
    g.fillRect(0, 0, W, H);

    // Result panel
    g.fillStyle(0x111133, 0.9);
    g.fillRoundedRect(CX - 200, CY - 150, 400, 300, 20);
    g.lineStyle(2, this.gameWon ? 0x44ff88 : 0xff4466, 0.8);
    g.strokeRoundedRect(CX - 200, CY - 150, 400, 300, 20);

    // We need text for end screen — use existing text objects repositioned
    // or just rely on the statusText + cellCountText
    const aliveCells = this.cells.filter((c) => c.alive).length;

    this.cellCountText.setPosition(CX, CY - 80);
    this.cellCountText.setFontSize(48);
    this.cellCountText.setText(
      this.gameWon ? "PETRI DISH FULL!" : "TIME'S UP!",
    );
    this.cellCountText.setColor(this.gameWon ? "#44ff88" : "#ff4466");

    this.timerText.setPosition(CX, CY - 20);
    this.timerText.setFontSize(28);
    this.timerText.setText(`Cells: ${aliveCells} / ${WIN_CELL_COUNT}`);
    this.timerText.setColor("#aaccff");

    this.statusText.setPosition(CX, CY + 60);
    this.statusText.setFontSize(18);
    this.statusText.setText("Tap to retry");
    this.statusText.setColor("#7799cc");
  }

  private endGame(won: boolean): void {
    this.gameOver = true;
    this.gameWon = won;
  }

  // ─── Utility ───────────────────────────────────────────────
  private brightenColor(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (color & 0xff) + 255 * amount);
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }
}
