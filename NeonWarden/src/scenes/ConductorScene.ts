import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

// ─── Color Palette ──────────────────────────────────────────
const COL = {
  bg: 0x08081a,
  grid: 0x1a1a3a,
  generator: 0xffcc00,
  generatorGlow: 0xffee44,
  buildingPowered: 0x3366ff,
  buildingDark: 0x333344,
  buildingCritical: 0xff4444,
  energyBlob: 0xffee00,
  path: 0xffaa00,
  pathGlow: 0xff8800,
  storm: 0xff00ff,
  stormFlash: 0xff66ff,
  hudText: 0xeeeeff,
  hudAccent: 0xffcc00,
  white: 0xffffff,
};

// ─── Layout constants ───────────────────────────────────────
const GRID_COLS = 8;
const GRID_ROWS = 12;
const CELL = GAME_WIDTH / GRID_COLS; // 90
const GRID_TOP = 140;
const GRID_BOTTOM = GRID_TOP + GRID_ROWS * CELL;
const MAX_PATHS = 5;
const GAME_DURATION = 60_000; // 60 seconds
const BLOB_SPEED = 200; // px/sec
const BLOB_INTERVAL = 800; // ms between blob spawns per generator
const STORM_INTERVAL = 8_000; // ms between storm spawns
const STORM_DURATION = 5_000;
const STORM_RADIUS = 70;
const BUILDING_DRAIN_RATE = 0.015; // energy per ms (full in ~4.5s idle)
const BUILDING_CHARGE_AMOUNT = 0.35; // energy delivered per blob

// ─── Interfaces ─────────────────────────────────────────────
interface Generator {
  x: number;
  y: number;
  col: number;
  row: number;
  pulsePhase: number;
  blobTimer: number;
}

interface Building {
  x: number;
  y: number;
  col: number;
  row: number;
  energy: number; // 0..1
  importance: number; // 1 = normal, 2 = important
  dark: boolean;
  pulsePhase: number;
  chargeFlash: number; // flash timer when receiving energy
}

interface EnergyPath {
  points: Phaser.Math.Vector2[];
  age: number;
  totalLength: number;
  segLengths: number[];
  sourceGen: Generator | null;
  fadingOut: boolean;
  fadeAlpha: number;
}

interface EnergyBlob {
  path: EnergyPath;
  distance: number; // distance traveled along path
  alive: boolean;
}

interface Storm {
  x: number;
  y: number;
  radius: number;
  timer: number;
  duration: number;
  phase: number;
  bolts: { x1: number; y1: number; x2: number; y2: number }[];
  boltTimer: number;
}

// ─── Scene ──────────────────────────────────────────────────
export class ConductorScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private glowGfx!: Phaser.GameObjects.Graphics;
  private stormGfx!: Phaser.GameObjects.Graphics;
  private hudGfx!: Phaser.GameObjects.Graphics;

  private generators: Generator[] = [];
  private buildings: Building[] = [];
  private paths: EnergyPath[] = [];
  private blobs: EnergyBlob[] = [];
  private storms: Storm[] = [];

  private drawingPath: Phaser.Math.Vector2[] | null = null;
  private isDrawing = false;
  private nearestGen: Generator | null = null;

  private elapsedMs = 0;
  private score = 0;
  private totalEnergyDelivered = 0;
  private blackoutCount = 0;
  private stormSpawnTimer = 0;
  private gameOver = false;

  // HUD text objects
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private pathCountText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "ConductorScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COL.bg);

    // Reset state
    this.generators = [];
    this.buildings = [];
    this.paths = [];
    this.blobs = [];
    this.storms = [];
    this.drawingPath = null;
    this.isDrawing = false;
    this.nearestGen = null;
    this.elapsedMs = 0;
    this.score = 0;
    this.totalEnergyDelivered = 0;
    this.blackoutCount = 0;
    this.stormSpawnTimer = STORM_INTERVAL * 0.6;
    this.gameOver = false;

    // Graphics layers (back to front)
    this.glowGfx = this.add
      .graphics()
      .setDepth(0)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.gfx = this.add.graphics().setDepth(1);
    this.stormGfx = this.add
      .graphics()
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.hudGfx = this.add.graphics().setDepth(10);

    // Place generators and buildings
    this.setupCity();

    // HUD text
    this.titleText = this.add
      .text(GAME_WIDTH / 2, 20, "CONDUCTOR", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffcc00",
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setDepth(11);

    this.timerText = this.add
      .text(GAME_WIDTH - 20, 55, "60s", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#eeeeff",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(11);

    this.scoreText = this.add
      .text(20, 55, "Score: 0", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffcc00",
      })
      .setOrigin(0, 0)
      .setDepth(11);

    this.statusText = this.add
      .text(20, 80, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#3366ff",
      })
      .setOrigin(0, 0)
      .setDepth(11);

    this.pathCountText = this.add
      .text(20, 105, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffaa00",
      })
      .setOrigin(0, 0)
      .setDepth(11);

    // Instruction text (fades out)
    const instrText = this.add
      .text(
        GAME_WIDTH / 2,
        GRID_BOTTOM + 40,
        "Draw paths from generators to buildings\nKeep all buildings powered for 60s",
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#666688",
          align: "center",
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(11);

    this.tweens.add({
      targets: instrText,
      alpha: 0,
      delay: 4000,
      duration: 2000,
      onComplete: () => instrText.destroy(),
    });

    // Input: path drawing
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) =>
      this.onPointerDown(p),
    );
    this.input.on("pointermove", (p: Phaser.Input.Pointer) =>
      this.onPointerMove(p),
    );
    this.input.on("pointerup", () => this.onPointerUp());
  }

  // ─── City layout ──────────────────────────────────────────
  private setupCity(): void {
    // Place 3 generators at strategic positions
    const genPositions = [
      { col: 1, row: 2 },
      { col: 6, row: 5 },
      { col: 3, row: 9 },
    ];
    for (const gp of genPositions) {
      this.generators.push({
        x: gp.col * CELL + CELL / 2,
        y: GRID_TOP + gp.row * CELL + CELL / 2,
        col: gp.col,
        row: gp.row,
        pulsePhase: Math.random() * Math.PI * 2,
        blobTimer: 0,
      });
    }

    // Place buildings avoiding generator cells
    const genSet = new Set(genPositions.map((g) => `${g.col},${g.row}`));
    const buildingPositions = [
      // Important buildings (importance=2)
      { col: 4, row: 1, imp: 2 },
      { col: 1, row: 6, imp: 2 },
      { col: 6, row: 10, imp: 2 },
      // Normal buildings
      { col: 6, row: 1, imp: 1 },
      { col: 2, row: 4, imp: 1 },
      { col: 5, row: 3, imp: 1 },
      { col: 0, row: 8, imp: 1 },
      { col: 4, row: 7, imp: 1 },
      { col: 7, row: 7, imp: 1 },
      { col: 2, row: 10, imp: 1 },
      { col: 5, row: 11, imp: 1 },
    ];

    for (const bp of buildingPositions) {
      if (genSet.has(`${bp.col},${bp.row}`)) continue;
      this.buildings.push({
        x: bp.col * CELL + CELL / 2,
        y: GRID_TOP + bp.row * CELL + CELL / 2,
        col: bp.col,
        row: bp.row,
        energy: 0.6 + Math.random() * 0.4, // start partially charged
        importance: bp.imp,
        dark: false,
        pulsePhase: Math.random() * Math.PI * 2,
        chargeFlash: 0,
      });
    }
  }

  // ─── Input handlers ───────────────────────────────────────
  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.gameOver) return;
    // Must start near a generator
    const gen = this.findNearestGenerator(p.x, p.y, CELL * 1.5);
    if (!gen) return;

    this.isDrawing = true;
    this.nearestGen = gen;
    this.drawingPath = [new Phaser.Math.Vector2(gen.x, gen.y)];
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!this.isDrawing || !this.drawingPath) return;

    const last = this.drawingPath[this.drawingPath.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Add point every 12px of movement
    if (dist > 12) {
      this.drawingPath.push(new Phaser.Math.Vector2(p.x, p.y));
    }
  }

  private onPointerUp(): void {
    if (!this.isDrawing || !this.drawingPath || this.gameOver) {
      this.isDrawing = false;
      this.drawingPath = null;
      this.nearestGen = null;
      return;
    }

    // Check if path ends near a building
    if (this.drawingPath.length < 3) {
      this.isDrawing = false;
      this.drawingPath = null;
      this.nearestGen = null;
      return;
    }

    const endPt = this.drawingPath[this.drawingPath.length - 1];
    const building = this.findNearestBuilding(endPt.x, endPt.y, CELL * 1.5);

    if (building) {
      // Snap endpoint to building center
      this.drawingPath[this.drawingPath.length - 1] = new Phaser.Math.Vector2(
        building.x,
        building.y,
      );

      // Smooth the path
      const smoothed = this.smoothPath(this.drawingPath);

      // Calculate segment lengths
      const segLengths: number[] = [];
      let totalLength = 0;
      for (let i = 1; i < smoothed.length; i++) {
        const d = Phaser.Math.Distance.Between(
          smoothed[i - 1].x,
          smoothed[i - 1].y,
          smoothed[i].x,
          smoothed[i].y,
        );
        segLengths.push(d);
        totalLength += d;
      }

      const newPath: EnergyPath = {
        points: smoothed,
        age: 0,
        totalLength,
        segLengths,
        sourceGen: this.nearestGen,
        fadingOut: false,
        fadeAlpha: 1,
      };

      // FIFO: remove oldest if at max
      if (this.paths.length >= MAX_PATHS) {
        const oldest = this.paths[0];
        oldest.fadingOut = true;
        // Remove blobs on this path
        this.blobs = this.blobs.filter((b) => b.path !== oldest);
      }

      this.paths.push(newPath);
    }

    this.isDrawing = false;
    this.drawingPath = null;
    this.nearestGen = null;
  }

  // ─── Helpers ──────────────────────────────────────────────
  private findNearestGenerator(
    x: number,
    y: number,
    maxDist: number,
  ): Generator | null {
    let best: Generator | null = null;
    let bestD = maxDist;
    for (const g of this.generators) {
      const d = Phaser.Math.Distance.Between(x, y, g.x, g.y);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    return best;
  }

  private findNearestBuilding(
    x: number,
    y: number,
    maxDist: number,
  ): Building | null {
    let best: Building | null = null;
    let bestD = maxDist;
    for (const b of this.buildings) {
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  private smoothPath(raw: Phaser.Math.Vector2[]): Phaser.Math.Vector2[] {
    if (raw.length <= 2) return [...raw];
    // Chaikin's corner-cutting for smoothness
    let pts = raw.map((p) => new Phaser.Math.Vector2(p.x, p.y));
    for (let iter = 0; iter < 2; iter++) {
      const smoothed: Phaser.Math.Vector2[] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        smoothed.push(
          new Phaser.Math.Vector2(
            p0.x * 0.75 + p1.x * 0.25,
            p0.y * 0.75 + p1.y * 0.25,
          ),
        );
        smoothed.push(
          new Phaser.Math.Vector2(
            p0.x * 0.25 + p1.x * 0.75,
            p0.y * 0.25 + p1.y * 0.75,
          ),
        );
      }
      smoothed.push(pts[pts.length - 1]);
      pts = smoothed;
    }
    return pts;
  }

  private getPointOnPath(path: EnergyPath, dist: number): Phaser.Math.Vector2 {
    let remaining = dist;
    for (let i = 0; i < path.segLengths.length; i++) {
      if (remaining <= path.segLengths[i]) {
        const t = remaining / path.segLengths[i];
        const p0 = path.points[i];
        const p1 = path.points[i + 1];
        return new Phaser.Math.Vector2(
          Phaser.Math.Linear(p0.x, p1.x, t),
          Phaser.Math.Linear(p0.y, p1.y, t),
        );
      }
      remaining -= path.segLengths[i];
    }
    return path.points[path.points.length - 1].clone();
  }

  // ─── Update loop ──────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    const dt = Math.min(delta, 50); // cap for stability
    this.elapsedMs += dt;

    // Check win condition
    if (this.elapsedMs >= GAME_DURATION) {
      this.endGame(true);
      return;
    }

    this.updateBuildings(dt);
    this.updateGenerators(dt);
    this.updateBlobs(dt);
    this.updatePaths(dt);
    this.updateStorms(dt);
    this.updateScore();
    this.draw();
    this.drawHUD();
  }

  // ─── Buildings ────────────────────────────────────────────
  private updateBuildings(dt: number): void {
    for (const b of this.buildings) {
      if (b.dark) continue;
      b.energy -=
        ((BUILDING_DRAIN_RATE * dt) / 1000) *
        (1 + (this.elapsedMs / GAME_DURATION) * 0.5);
      b.pulsePhase += dt * 0.003;
      if (b.chargeFlash > 0) b.chargeFlash -= dt;

      if (b.energy <= 0) {
        b.energy = 0;
        b.dark = true;
        this.blackoutCount++;
        // Screen shake
        this.cameras.main.shake(200, 0.005);
      }
    }
  }

  // ─── Generators ───────────────────────────────────────────
  private updateGenerators(dt: number): void {
    for (const gen of this.generators) {
      gen.pulsePhase += dt * 0.004;
      gen.blobTimer += dt;

      if (gen.blobTimer >= BLOB_INTERVAL) {
        gen.blobTimer -= BLOB_INTERVAL;
        // Spawn blobs on all paths originating from this generator
        for (const path of this.paths) {
          if (path.sourceGen === gen && !path.fadingOut) {
            this.blobs.push({
              path,
              distance: 0,
              alive: true,
            });
          }
        }
      }
    }
  }

  // ─── Energy blobs ─────────────────────────────────────────
  private updateBlobs(dt: number): void {
    for (const blob of this.blobs) {
      if (!blob.alive) continue;
      blob.distance += (BLOB_SPEED * dt) / 1000;

      // Check if blob reached end
      if (blob.distance >= blob.path.totalLength) {
        blob.alive = false;
        // Find the building at the end of this path
        const endPt = blob.path.points[blob.path.points.length - 1];
        const building = this.findNearestBuilding(endPt.x, endPt.y, CELL);
        if (building && !building.dark) {
          building.energy = Math.min(
            1,
            building.energy + BUILDING_CHARGE_AMOUNT,
          );
          building.chargeFlash = 300;
          this.totalEnergyDelivered += BUILDING_CHARGE_AMOUNT;
          this.score += building.importance * 10;
        }
      }

      // Check if blob is in a storm
      const pos = this.getPointOnPath(
        blob.path,
        Math.min(blob.distance, blob.path.totalLength),
      );
      for (const storm of this.storms) {
        const d = Phaser.Math.Distance.Between(pos.x, pos.y, storm.x, storm.y);
        if (d < storm.radius) {
          blob.alive = false;
        }
      }
    }
    this.blobs = this.blobs.filter((b) => b.alive);
  }

  // ─── Paths ────────────────────────────────────────────────
  private updatePaths(dt: number): void {
    for (const path of this.paths) {
      path.age += dt;
      if (path.fadingOut) {
        path.fadeAlpha -= dt * 0.003;
      }
    }

    // Remove fully faded paths
    this.paths = this.paths.filter((p) => !(p.fadingOut && p.fadeAlpha <= 0));

    // Check storm destruction
    for (const storm of this.storms) {
      for (const path of this.paths) {
        if (path.fadingOut) continue;
        // Check if any segment of path passes through storm
        for (const pt of path.points) {
          const d = Phaser.Math.Distance.Between(pt.x, pt.y, storm.x, storm.y);
          if (d < storm.radius * 0.8) {
            path.fadingOut = true;
            // Flash effect
            this.cameras.main.flash(150, 255, 0, 255, false);
            break;
          }
        }
      }
    }
  }

  // ─── Storms ───────────────────────────────────────────────
  private updateStorms(dt: number): void {
    this.stormSpawnTimer += dt;

    if (this.stormSpawnTimer >= STORM_INTERVAL) {
      this.stormSpawnTimer = 0;
      // Spawn storm at random grid position
      const x = Phaser.Math.Between(CELL * 2, GAME_WIDTH - CELL * 2);
      const y = Phaser.Math.Between(
        GRID_TOP + CELL * 2,
        GRID_BOTTOM - CELL * 2,
      );
      this.storms.push({
        x,
        y,
        radius: STORM_RADIUS,
        timer: 0,
        duration: STORM_DURATION,
        phase: 0,
        bolts: [],
        boltTimer: 0,
      });
    }

    for (const storm of this.storms) {
      storm.timer += dt;
      storm.phase += dt * 0.008;
      storm.boltTimer += dt;

      // Regenerate lightning bolts periodically
      if (storm.boltTimer > 80) {
        storm.boltTimer = 0;
        storm.bolts = [];
        const numBolts = Phaser.Math.Between(3, 6);
        for (let i = 0; i < numBolts; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r1 = Math.random() * storm.radius * 0.3;
          const r2 = Math.random() * storm.radius * 0.9;
          storm.bolts.push({
            x1: storm.x + Math.cos(angle) * r1,
            y1: storm.y + Math.sin(angle) * r1,
            x2: storm.x + Math.cos(angle + (Math.random() - 0.5) * 0.8) * r2,
            y2: storm.y + Math.sin(angle + (Math.random() - 0.5) * 0.8) * r2,
          });
        }
      }
    }

    this.storms = this.storms.filter((s) => s.timer < s.duration);
  }

  // ─── Scoring ──────────────────────────────────────────────
  private updateScore(): void {
    // Continuous scoring for powered buildings
    const powered = this.buildings.filter((b) => !b.dark).length;
    if (powered === this.buildings.length) {
      this.score += 1; // bonus for all powered each frame
    }
  }

  // ─── End game ─────────────────────────────────────────────
  private endGame(won: boolean): void {
    this.gameOver = true;

    // No-blackout bonus
    const noBlackoutBonus = this.blackoutCount === 0 ? 500 : 0;
    const finalScore = this.score + noBlackoutBonus;

    // Overlay
    const overlay = this.add.graphics().setDepth(20);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const resultTitle = won ? "CIRCUIT COMPLETE" : "BLACKOUT";
    const resultColor = won ? "#ffcc00" : "#ff4444";

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, resultTitle, {
        fontFamily: "monospace",
        fontSize: "32px",
        color: resultColor,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(21);

    const lines = [
      `Score: ${finalScore}`,
      `Energy Delivered: ${Math.floor(this.totalEnergyDelivered * 100)}%`,
      `Blackouts: ${this.blackoutCount}`,
      noBlackoutBonus > 0 ? `Perfect Bonus: +${noBlackoutBonus}` : "",
      "",
      "Tap for menu",
    ].filter((l) => l !== "");

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ccccdd",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.input.removeAllListeners();
    this.time.delayedCall(800, () => {
      this.input.once("pointerdown", () => {
        this.scene.start("PrototypeMenuScene");
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ─── RENDERING ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════

  private draw(): void {
    this.gfx.clear();
    this.glowGfx.clear();
    this.stormGfx.clear();

    this.drawGridLines();
    this.drawPaths();
    this.drawDrawingPath();
    this.drawGenerators();
    this.drawBuildings();
    this.drawBlobs();
    this.drawStorms();
  }

  // ─── Grid ─────────────────────────────────────────────────
  private drawGridLines(): void {
    this.gfx.lineStyle(1, COL.grid, 0.3);
    for (let c = 0; c <= GRID_COLS; c++) {
      const x = c * CELL;
      this.gfx.lineBetween(x, GRID_TOP, x, GRID_BOTTOM);
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      const y = GRID_TOP + r * CELL;
      this.gfx.lineBetween(0, y, GAME_WIDTH, y);
    }
    // Border
    this.gfx.lineStyle(2, COL.grid, 0.5);
    this.gfx.strokeRect(0, GRID_TOP, GAME_WIDTH, GRID_ROWS * CELL);
  }

  // ─── Generators (pulsing yellow diamonds) ─────────────────
  private drawGenerators(): void {
    for (const gen of this.generators) {
      const pulse = Math.sin(gen.pulsePhase) * 0.3 + 0.7;
      const size = 28 + pulse * 8;

      // Glow
      this.glowGfx.fillStyle(COL.generator, 0.15 * pulse);
      this.glowGfx.fillCircle(gen.x, gen.y, size + 20);
      this.glowGfx.fillStyle(COL.generator, 0.25 * pulse);
      this.glowGfx.fillCircle(gen.x, gen.y, size + 10);

      // Diamond shape
      this.gfx.fillStyle(COL.generator, pulse);
      this.gfx.beginPath();
      this.gfx.moveTo(gen.x, gen.y - size / 2);
      this.gfx.lineTo(gen.x + size / 2, gen.y);
      this.gfx.lineTo(gen.x, gen.y + size / 2);
      this.gfx.lineTo(gen.x - size / 2, gen.y);
      this.gfx.closePath();
      this.gfx.fillPath();

      // Inner bright core
      this.gfx.fillStyle(COL.generatorGlow, pulse * 0.8);
      const innerSize = size * 0.4;
      this.gfx.beginPath();
      this.gfx.moveTo(gen.x, gen.y - innerSize / 2);
      this.gfx.lineTo(gen.x + innerSize / 2, gen.y);
      this.gfx.lineTo(gen.x, gen.y + innerSize / 2);
      this.gfx.lineTo(gen.x - innerSize / 2, gen.y);
      this.gfx.closePath();
      this.gfx.fillPath();

      // Label
      this.gfx.fillStyle(COL.bg, 1);
      this.gfx.fillRect(gen.x - 4, gen.y - 4, 8, 8);
    }
  }

  // ─── Buildings ────────────────────────────────────────────
  private drawBuildings(): void {
    for (const b of this.buildings) {
      const size = b.importance === 2 ? 36 : 26;
      const halfSize = size / 2;

      if (b.dark) {
        // Dark building - dim and flickering
        const flicker = Math.random() * 0.1 + 0.15;
        this.gfx.fillStyle(COL.buildingDark, flicker);
        this.gfx.fillRect(b.x - halfSize, b.y - halfSize, size, size);
        this.gfx.lineStyle(1, COL.buildingDark, 0.4);
        this.gfx.strokeRect(b.x - halfSize, b.y - halfSize, size, size);
        // X mark
        this.gfx.lineStyle(2, 0xff2222, 0.5);
        this.gfx.lineBetween(
          b.x - halfSize + 4,
          b.y - halfSize + 4,
          b.x + halfSize - 4,
          b.y + halfSize - 4,
        );
        this.gfx.lineBetween(
          b.x + halfSize - 4,
          b.y - halfSize + 4,
          b.x - halfSize + 4,
          b.y + halfSize - 4,
        );
        continue;
      }

      const pulse = Math.sin(b.pulsePhase) * 0.1 + 0.9;
      const energyColor =
        b.energy < 0.25 ? COL.buildingCritical : COL.buildingPowered;
      const alpha = 0.4 + b.energy * 0.6;

      // Glow when charged
      if (b.chargeFlash > 0) {
        const flashIntensity = b.chargeFlash / 300;
        this.glowGfx.fillStyle(COL.white, 0.3 * flashIntensity);
        this.glowGfx.fillCircle(b.x, b.y, size + 15);
      }

      // Building glow halo
      if (b.energy > 0.5) {
        this.glowGfx.fillStyle(energyColor, 0.08 * b.energy * pulse);
        this.glowGfx.fillCircle(b.x, b.y, size + 12);
      }

      // Building body
      this.gfx.fillStyle(energyColor, alpha * pulse);
      this.gfx.fillRect(b.x - halfSize, b.y - halfSize, size, size);

      // Border
      this.gfx.lineStyle(2, energyColor, alpha);
      this.gfx.strokeRect(b.x - halfSize, b.y - halfSize, size, size);

      // Energy meter (vertical bar on right side)
      const meterH = size - 4;
      const meterW = 4;
      const meterX = b.x + halfSize + 3;
      const meterY = b.y - halfSize + 2;
      this.gfx.fillStyle(COL.buildingDark, 0.5);
      this.gfx.fillRect(meterX, meterY, meterW, meterH);
      const fillH = meterH * b.energy;
      const meterColor =
        b.energy < 0.25 ? COL.buildingCritical : COL.buildingPowered;
      this.gfx.fillStyle(meterColor, 0.9);
      this.gfx.fillRect(meterX, meterY + meterH - fillH, meterW, fillH);

      // Importance star for important buildings
      if (b.importance === 2) {
        this.gfx.fillStyle(COL.hudAccent, 0.9);
        this.drawStar(b.x, b.y - halfSize - 8, 5, 3);
      }
    }
  }

  private drawStar(
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
  ): void {
    this.gfx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) this.gfx.moveTo(x, y);
      else this.gfx.lineTo(x, y);
    }
    this.gfx.closePath();
    this.gfx.fillPath();
  }

  // ─── Paths (glowing lines) ────────────────────────────────
  private drawPaths(): void {
    for (const path of this.paths) {
      const alpha = path.fadingOut ? path.fadeAlpha : 1;
      if (alpha <= 0) continue;
      const pts = path.points;
      if (pts.length < 2) continue;

      // Outer glow
      this.glowGfx.lineStyle(10, COL.pathGlow, 0.15 * alpha);
      this.glowGfx.beginPath();
      this.glowGfx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        this.glowGfx.lineTo(pts[i].x, pts[i].y);
      }
      this.glowGfx.strokePath();

      // Main path
      this.gfx.lineStyle(3, COL.path, 0.8 * alpha);
      this.gfx.beginPath();
      this.gfx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        this.gfx.lineTo(pts[i].x, pts[i].y);
      }
      this.gfx.strokePath();

      // Inner bright line
      this.gfx.lineStyle(1, COL.generatorGlow, 0.5 * alpha);
      this.gfx.beginPath();
      this.gfx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        this.gfx.lineTo(pts[i].x, pts[i].y);
      }
      this.gfx.strokePath();
    }
  }

  // ─── Drawing path preview ─────────────────────────────────
  private drawDrawingPath(): void {
    if (!this.drawingPath || this.drawingPath.length < 2) return;

    this.gfx.lineStyle(2, COL.path, 0.4);
    this.gfx.beginPath();
    this.gfx.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);
    for (let i = 1; i < this.drawingPath.length; i++) {
      this.gfx.lineTo(this.drawingPath[i].x, this.drawingPath[i].y);
    }
    this.gfx.strokePath();

    // Endpoint indicator
    const end = this.drawingPath[this.drawingPath.length - 1];
    const nearBuilding = this.findNearestBuilding(end.x, end.y, CELL * 1.5);
    if (nearBuilding) {
      this.gfx.lineStyle(2, COL.buildingPowered, 0.6);
      this.gfx.strokeCircle(nearBuilding.x, nearBuilding.y, 24);
    }
  }

  // ─── Energy blobs ─────────────────────────────────────────
  private drawBlobs(): void {
    for (const blob of this.blobs) {
      const pos = this.getPointOnPath(
        blob.path,
        Math.min(blob.distance, blob.path.totalLength),
      );

      // Glow
      this.glowGfx.fillStyle(COL.energyBlob, 0.25);
      this.glowGfx.fillCircle(pos.x, pos.y, 12);
      this.glowGfx.fillStyle(COL.energyBlob, 0.4);
      this.glowGfx.fillCircle(pos.x, pos.y, 7);

      // Core
      this.gfx.fillStyle(COL.energyBlob, 1);
      this.gfx.fillCircle(pos.x, pos.y, 4);
      this.gfx.fillStyle(COL.white, 0.8);
      this.gfx.fillCircle(pos.x, pos.y, 2);
    }
  }

  // ─── Storms ───────────────────────────────────────────────
  private drawStorms(): void {
    for (const storm of this.storms) {
      const lifeRatio = storm.timer / storm.duration;
      // Fade in and out
      const alpha =
        lifeRatio < 0.15
          ? lifeRatio / 0.15
          : lifeRatio > 0.8
            ? (1 - lifeRatio) / 0.2
            : 1;

      // Danger zone circle
      this.stormGfx.lineStyle(2, COL.storm, 0.3 * alpha);
      this.stormGfx.strokeCircle(storm.x, storm.y, storm.radius);
      this.stormGfx.fillStyle(COL.storm, 0.06 * alpha);
      this.stormGfx.fillCircle(storm.x, storm.y, storm.radius);

      // Inner crackling area
      this.stormGfx.fillStyle(
        COL.storm,
        0.04 * alpha * (0.5 + Math.sin(storm.phase * 3) * 0.5),
      );
      this.stormGfx.fillCircle(storm.x, storm.y, storm.radius * 0.6);

      // Lightning bolts
      for (const bolt of storm.bolts) {
        // Main bolt
        this.stormGfx.lineStyle(2, COL.stormFlash, 0.7 * alpha);
        this.drawLightningLine(
          this.stormGfx,
          bolt.x1,
          bolt.y1,
          bolt.x2,
          bolt.y2,
          3,
        );

        // Glow
        this.stormGfx.lineStyle(4, COL.storm, 0.2 * alpha);
        this.stormGfx.lineBetween(bolt.x1, bolt.y1, bolt.x2, bolt.y2);
      }

      // Warning ring pulse
      const ringPulse = (Math.sin(storm.phase * 2) + 1) * 0.5;
      this.stormGfx.lineStyle(1, COL.stormFlash, 0.15 * alpha * ringPulse);
      this.stormGfx.strokeCircle(
        storm.x,
        storm.y,
        storm.radius + 5 + ringPulse * 10,
      );
    }
  }

  private drawLightningLine(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    depth: number,
  ): void {
    if (depth <= 0) {
      g.lineBetween(x1, y1, x2, y2);
      return;
    }
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 15;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 15;
    this.drawLightningLine(g, x1, y1, mx, my, depth - 1);
    this.drawLightningLine(g, mx, my, x2, y2, depth - 1);
  }

  // ─── HUD ──────────────────────────────────────────────────
  private drawHUD(): void {
    this.hudGfx.clear();

    // HUD background bar
    this.hudGfx.fillStyle(COL.bg, 0.85);
    this.hudGfx.fillRect(0, 0, GAME_WIDTH, GRID_TOP);
    this.hudGfx.lineStyle(1, COL.grid, 0.5);
    this.hudGfx.lineBetween(0, GRID_TOP, GAME_WIDTH, GRID_TOP);

    // Timer
    const remaining = Math.max(
      0,
      Math.ceil((GAME_DURATION - this.elapsedMs) / 1000),
    );
    const timerColor = remaining <= 10 ? "#ff4444" : "#eeeeff";
    this.timerText.setText(`${remaining}s`);
    this.timerText.setColor(timerColor);
    if (remaining <= 10) {
      this.timerText.setScale(1 + Math.sin(this.elapsedMs * 0.01) * 0.05);
    }

    // Score
    this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

    // Building status
    const powered = this.buildings.filter((b) => !b.dark).length;
    const total = this.buildings.length;
    const statusColor =
      powered === total
        ? "#44ff44"
        : powered > total * 0.7
          ? "#ffcc00"
          : "#ff4444";
    this.statusText.setText(`Buildings: ${powered}/${total}`);
    this.statusText.setColor(statusColor);

    // Active paths
    const activePaths = this.paths.filter((p) => !p.fadingOut).length;
    this.pathCountText.setText(`Paths: ${activePaths}/${MAX_PATHS}`);

    // Bottom HUD - storm warning
    if (this.storms.length > 0) {
      const warningPulse = Math.sin(this.elapsedMs * 0.008) * 0.3 + 0.7;
      this.hudGfx.fillStyle(COL.storm, 0.1 * warningPulse);
      this.hudGfx.fillRect(0, GRID_BOTTOM, GAME_WIDTH, 30);
    }
  }
}
