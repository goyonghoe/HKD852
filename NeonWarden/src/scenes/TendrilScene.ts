import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

// ─── Colors ───
const COL = {
  BG: 0x0a0a2e,
  TENDRIL: 0x00ffaa,
  TENDRIL_DIM: 0x007755,
  ORGANISM: 0x00ff88,
  ORGANISM_CORE: 0x88ffcc,
  ORGANISM_DEAD: 0x333355,
  CORRUPTION_INNER: 0x8b0000,
  CORRUPTION_OUTER: 0x4b0082,
  HUD_TEXT: 0xccffee,
  WARNING: 0xff4444,
};

// ─── Tuning ───
const ORGANISM_COUNT = 10;
const ORGANISM_RADIUS = 18;
const TENDRIL_WIDTH = 3;
const GAME_DURATION = 60; // seconds
const CORRUPTION_BASE_SPEED = 0.4; // px per frame
const CORRUPTION_ACCEL = 0.008; // speed increase per second
const SAFE_MARGIN = 80; // organisms spawn this far from edges
const ENERGY_PULSE_SPEED = 0.003; // energy dot travel speed along tendril
const MAX_CONNECTIONS = 3; // max tendrils per organism

interface Organism {
  id: number;
  x: number;
  y: number;
  alive: boolean;
  connected: boolean; // has at least one tendril
  pulsePhase: number;
  radius: number;
  connectionCount: number;
  deathTimer: number; // frames until consumed when touched by corruption
  glowIntensity: number;
}

interface Tendril {
  from: number; // organism id
  to: number; // organism id
  energyPhase: number;
  pulseDir: number; // +1 or -1
  age: number;
}

interface CorruptionBlob {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number; // direction toward center
  pulsePhase: number;
}

export class TendrilScene extends Phaser.Scene {
  // Graphics layers
  private bgGfx!: Phaser.GameObjects.Graphics;
  private corruptionGfx!: Phaser.GameObjects.Graphics;
  private tendrilGfx!: Phaser.GameObjects.Graphics;
  private organismGfx!: Phaser.GameObjects.Graphics;
  private _hudGfx!: Phaser.GameObjects.Graphics;
  private dragGfx!: Phaser.GameObjects.Graphics;

  // State
  private organisms: Organism[] = [];
  private tendrils: Tendril[] = [];
  private corruptionBlobs: CorruptionBlob[] = [];
  private timeLeft = GAME_DURATION;
  private score = 0;
  private gameOver = false;
  private elapsed = 0;

  // Drag state
  private dragging = false;
  private dragFromId = -1;
  private dragPointer = { x: 0, y: 0 };

  // HUD text
  private timerText!: Phaser.GameObjects.Text;
  private aliveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;

  // Particles for organism death
  private deathParticles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: number;
  }[] = [];

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;

  constructor() {
    super({ key: "TendrilScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COL.BG);

    // Graphics layers (draw order matters)
    this.bgGfx = this.add.graphics();
    this.corruptionGfx = this.add.graphics();
    this.tendrilGfx = this.add.graphics();
    this.dragGfx = this.add.graphics();
    this.organismGfx = this.add.graphics();
    this._hudGfx = this.add.graphics();

    // Reset state
    this.organisms = [];
    this.tendrils = [];
    this.corruptionBlobs = [];
    this.deathParticles = [];
    this.timeLeft = GAME_DURATION;
    this.score = 0;
    this.gameOver = false;
    this.elapsed = 0;
    this.dragging = false;
    this.dragFromId = -1;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    this.spawnOrganisms();
    this.spawnCorruption();
    this.setupInput();
    this.setupHUD();
  }

  // ─── Spawn ───

  private spawnOrganisms(): void {
    const margin = SAFE_MARGIN;
    const minDist = ORGANISM_RADIUS * 5;

    for (let i = 0; i < ORGANISM_COUNT; i++) {
      let x: number, y: number;
      let attempts = 0;

      do {
        x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        y = Phaser.Math.Between(margin + 60, GAME_HEIGHT - margin - 40);
        attempts++;
      } while (
        attempts < 100 &&
        this.organisms.some(
          (o) => Phaser.Math.Distance.Between(o.x, o.y, x, y) < minDist,
        )
      );

      this.organisms.push({
        id: i,
        x,
        y,
        alive: true,
        connected: false,
        pulsePhase: Math.random() * Math.PI * 2,
        radius: ORGANISM_RADIUS,
        connectionCount: 0,
        deathTimer: 90, // ~1.5 sec at 60fps to consume
        glowIntensity: 0.5,
      });
    }
  }

  private spawnCorruption(): void {
    const blobCount = 20;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    for (let i = 0; i < blobCount; i++) {
      // Distribute around edges
      let x: number, y: number;
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: // top
          x = Math.random() * GAME_WIDTH;
          y = -20;
          break;
        case 1: // bottom
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT + 20;
          break;
        case 2: // left
          x = -20;
          y = Math.random() * GAME_HEIGHT;
          break;
        default: // right
          x = GAME_WIDTH + 20;
          y = Math.random() * GAME_HEIGHT;
          break;
      }

      const angle = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 0.6;

      this.corruptionBlobs.push({
        x,
        y,
        radius: Phaser.Math.Between(25, 55),
        speed: CORRUPTION_BASE_SPEED * (0.7 + Math.random() * 0.6),
        angle,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ─── Input ───

  private setupInput(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.gameOver) return;

      const org = this.getOrganismAt(p.x, p.y);
      if (org && org.alive) {
        this.dragging = true;
        this.dragFromId = org.id;
        this.dragPointer.x = p.x;
        this.dragPointer.y = p.y;
      }
    });

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.dragging) {
        this.dragPointer.x = p.x;
        this.dragPointer.y = p.y;
      }
    });

    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) {
        // Tap to restart after game over
        if (this.gameOver) {
          this.scene.start("PrototypeMenuScene");
        }
        return;
      }

      const target = this.getOrganismAt(p.x, p.y);
      if (
        target &&
        target.alive &&
        target.id !== this.dragFromId &&
        !this.tendrilExists(this.dragFromId, target.id)
      ) {
        const fromOrg = this.organisms[this.dragFromId];
        if (
          fromOrg.connectionCount < MAX_CONNECTIONS &&
          target.connectionCount < MAX_CONNECTIONS
        ) {
          this.addTendril(this.dragFromId, target.id);
        }
      }

      this.dragging = false;
      this.dragFromId = -1;
      this.dragGfx.clear();
    });
  }

  private getOrganismAt(x: number, y: number): Organism | null {
    const hitRadius = ORGANISM_RADIUS * 2.5; // generous touch target
    let closest: Organism | null = null;
    let closestDist = hitRadius;

    for (const org of this.organisms) {
      if (!org.alive) continue;
      const dist = Phaser.Math.Distance.Between(org.x, org.y, x, y);
      if (dist < closestDist) {
        closest = org;
        closestDist = dist;
      }
    }
    return closest;
  }

  private tendrilExists(a: number, b: number): boolean {
    return this.tendrils.some(
      (t) => (t.from === a && t.to === b) || (t.from === b && t.to === a),
    );
  }

  private addTendril(fromId: number, toId: number): void {
    this.tendrils.push({
      from: fromId,
      to: toId,
      energyPhase: 0,
      pulseDir: Math.random() > 0.5 ? 1 : -1,
      age: 0,
    });

    this.organisms[fromId].connectionCount++;
    this.organisms[toId].connectionCount++;
    this.updateConnectedState();
  }

  private updateConnectedState(): void {
    // BFS to find all organisms connected to any network
    const visited = new Set<number>();

    for (const org of this.organisms) {
      org.connected = false;
    }

    for (const org of this.organisms) {
      if (!org.alive || visited.has(org.id)) continue;

      // Find connected component
      const component: number[] = [];
      const queue = [org.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);

        for (const t of this.tendrils) {
          if (t.from === current && !visited.has(t.to)) queue.push(t.to);
          if (t.to === current && !visited.has(t.from)) queue.push(t.from);
        }
      }

      // A component of 2+ is "connected"
      if (component.length >= 2) {
        for (const id of component) {
          this.organisms[id].connected = true;
        }
      }
    }
  }

  // ─── HUD ───

  private setupHUD(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ccffee",
      stroke: "#0a0a2e",
      strokeThickness: 3,
    };

    this.timerText = this.add.text(GAME_WIDTH / 2, 24, "", {
      ...textStyle,
      fontSize: "32px",
    });
    this.timerText.setOrigin(0.5, 0);
    this.timerText.setDepth(100);

    this.aliveText = this.add.text(20, 24, "", textStyle);
    this.aliveText.setDepth(100);

    this.scoreText = this.add.text(GAME_WIDTH - 20, 24, "", textStyle);
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setDepth(100);

    this.titleText = this.add.text(GAME_WIDTH / 2, 60, "TENDRIL", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#447766",
    });
    this.titleText.setOrigin(0.5, 0);
    this.titleText.setAlpha(0.6);
    this.titleText.setDepth(100);

    // Game over text (hidden initially)
    this.gameOverText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 60,
      "",
      {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#00ffaa",
        stroke: "#0a0a2e",
        strokeThickness: 6,
        align: "center",
      },
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setDepth(200);
    this.gameOverText.setVisible(false);

    this.restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#88ccaa",
      align: "center",
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setDepth(200);
    this.restartText.setVisible(false);
  }

  // ─── Update ───

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.elapsed += dt;

    if (!this.gameOver) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame(true);
      }

      this.updateCorruption(dt);
      this.checkCorruptionCollisions();
    }

    this.updateOrganisms(dt);
    this.updateTendrils(dt);
    this.updateParticles(dt);
    this.updateShake(dt);

    // Draw everything
    this.drawBackground();
    this.drawCorruption();
    this.drawTendrils();
    this.drawDragLine();
    this.drawOrganisms();
    this.drawParticles();
    this.updateHUD();
  }

  // ─── Game Logic ───

  private updateCorruption(dt: number): void {
    const speedMult = 1 + this.elapsed * CORRUPTION_ACCEL;

    for (const blob of this.corruptionBlobs) {
      blob.x += Math.cos(blob.angle) * blob.speed * speedMult;
      blob.y += Math.sin(blob.angle) * blob.speed * speedMult;
      blob.pulsePhase += dt * 2;
      // Slowly grow
      blob.radius += dt * 0.3 * speedMult;
    }

    // Spawn new blobs over time
    if (this.elapsed > 5 && Math.random() < 0.01 * speedMult) {
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT / 2;
      let x: number, y: number;
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0:
          x = Math.random() * GAME_WIDTH;
          y = -10;
          break;
        case 1:
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT + 10;
          break;
        case 2:
          x = -10;
          y = Math.random() * GAME_HEIGHT;
          break;
        default:
          x = GAME_WIDTH + 10;
          y = Math.random() * GAME_HEIGHT;
          break;
      }
      const angle = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 0.8;
      this.corruptionBlobs.push({
        x,
        y,
        radius: Phaser.Math.Between(20, 45),
        speed: CORRUPTION_BASE_SPEED * (0.8 + Math.random() * 0.5),
        angle,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private checkCorruptionCollisions(): void {
    for (const org of this.organisms) {
      if (!org.alive) continue;

      let touching = false;
      for (const blob of this.corruptionBlobs) {
        const dist = Phaser.Math.Distance.Between(org.x, org.y, blob.x, blob.y);
        const blobR = blob.radius + Math.sin(blob.pulsePhase) * 4;
        if (dist < blobR + org.radius) {
          touching = true;
          break;
        }
      }

      if (touching) {
        if (org.connected) {
          // Connected organisms resist — push corruption back slightly
          org.glowIntensity = Math.min(1.2, org.glowIntensity + 0.01);
        } else {
          // Isolated organism gets consumed
          org.deathTimer -= 1;
          org.glowIntensity = Math.max(0.1, org.glowIntensity - 0.015);
          if (org.deathTimer <= 0) {
            this.killOrganism(org);
          }
        }
      } else {
        // Recover death timer slowly
        org.deathTimer = Math.min(90, org.deathTimer + 0.5);
        if (org.connected) {
          org.glowIntensity = Phaser.Math.Linear(org.glowIntensity, 1.0, 0.02);
        } else {
          org.glowIntensity = Phaser.Math.Linear(org.glowIntensity, 0.5, 0.02);
        }
      }
    }
  }

  private killOrganism(org: Organism): void {
    org.alive = false;
    org.connected = false;

    // Remove tendrils connected to this organism
    this.tendrils = this.tendrils.filter((t) => {
      if (t.from === org.id || t.to === org.id) {
        // Reduce connection count
        if (t.from === org.id) this.organisms[t.to].connectionCount--;
        if (t.to === org.id) this.organisms[t.from].connectionCount--;
        return false;
      }
      return true;
    });

    this.updateConnectedState();

    // Death particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      this.deathParticles.push({
        x: org.x,
        y: org.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? COL.ORGANISM : COL.TENDRIL,
      });
    }

    // Screen shake
    this.shakeIntensity = 6;
    this.shakeDuration = 0.3;

    // Check if all dead
    const aliveCount = this.organisms.filter((o) => o.alive).length;
    if (aliveCount === 0) {
      this.endGame(false);
    }
  }

  private updateOrganisms(dt: number): void {
    for (const org of this.organisms) {
      if (!org.alive) continue;
      org.pulsePhase += dt * (org.connected ? 3.5 : 2.0);
    }
  }

  private updateTendrils(dt: number): void {
    for (const t of this.tendrils) {
      t.energyPhase += dt * ENERGY_PULSE_SPEED * 60;
      t.age += dt;
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.deathParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt * 1.5;
    }
    this.deathParticles = this.deathParticles.filter((p) => p.life > 0);
  }

  private updateShake(dt: number): void {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const ox = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const oy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.cameras.main.setScroll(ox, oy);
      this.shakeIntensity *= 0.92;
    } else {
      this.cameras.main.setScroll(0, 0);
    }
  }

  private endGame(survived: boolean): void {
    this.gameOver = true;
    const aliveCount = this.organisms.filter((o) => o.alive).length;
    this.score = aliveCount;

    if (survived) {
      this.gameOverText.setText(`SURVIVED!\n${aliveCount}/${ORGANISM_COUNT}`);
      this.gameOverText.setColor("#00ffaa");
    } else {
      this.gameOverText.setText("CONSUMED");
      this.gameOverText.setColor("#ff4444");
    }
    this.gameOverText.setVisible(true);

    this.restartText.setText("tap to return to menu");
    this.restartText.setVisible(true);

    // Flash effect
    this.cameras.main.flash(300, 0, 255, 170, true);
  }

  // ─── Drawing ───

  private drawBackground(): void {
    this.bgGfx.clear();

    // Subtle grid lines
    this.bgGfx.lineStyle(1, 0x111133, 0.15);
    const gridSize = 60;
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
      this.bgGfx.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      this.bgGfx.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Ambient glow around connected organisms
    for (const org of this.organisms) {
      if (!org.alive || !org.connected) continue;
      const pulse = Math.sin(org.pulsePhase) * 0.1 + 0.15;
      this.bgGfx.fillStyle(COL.TENDRIL, pulse * org.glowIntensity);
      this.bgGfx.fillCircle(org.x, org.y, 60 + Math.sin(org.pulsePhase) * 8);
    }
  }

  private drawCorruption(): void {
    this.corruptionGfx.clear();

    for (const blob of this.corruptionBlobs) {
      const pulse = Math.sin(blob.pulsePhase) * 5;
      const r = blob.radius + pulse;

      // Outer glow
      this.corruptionGfx.fillStyle(COL.CORRUPTION_OUTER, 0.15);
      this.corruptionGfx.fillCircle(blob.x, blob.y, r * 1.6);

      // Mid layer
      this.corruptionGfx.fillStyle(COL.CORRUPTION_OUTER, 0.3);
      this.corruptionGfx.fillCircle(blob.x, blob.y, r * 1.2);

      // Core
      this.corruptionGfx.fillStyle(COL.CORRUPTION_INNER, 0.5);
      this.corruptionGfx.fillCircle(blob.x, blob.y, r);

      // Inner hot core
      this.corruptionGfx.fillStyle(COL.CORRUPTION_INNER, 0.7);
      this.corruptionGfx.fillCircle(blob.x, blob.y, r * 0.5);

      // Particle-like tendrils at edges
      for (let i = 0; i < 5; i++) {
        const a = blob.pulsePhase * 0.7 + (i * Math.PI * 2) / 5;
        const px = blob.x + Math.cos(a) * r * 1.3;
        const py = blob.y + Math.sin(a) * r * 1.3;
        this.corruptionGfx.fillStyle(COL.CORRUPTION_OUTER, 0.4);
        this.corruptionGfx.fillCircle(
          px,
          py,
          4 + Math.sin(a + blob.pulsePhase) * 2,
        );
      }
    }
  }

  private drawTendrils(): void {
    this.tendrilGfx.clear();

    for (const t of this.tendrils) {
      const fromOrg = this.organisms[t.from];
      const toOrg = this.organisms[t.to];
      if (!fromOrg.alive || !toOrg.alive) continue;

      const fadeIn = Math.min(1, t.age * 3); // fade in over ~0.33s

      // Glow layer (thicker, more transparent)
      this.tendrilGfx.lineStyle(TENDRIL_WIDTH * 4, COL.TENDRIL, 0.08 * fadeIn);
      this.tendrilGfx.lineBetween(fromOrg.x, fromOrg.y, toOrg.x, toOrg.y);

      // Mid glow
      this.tendrilGfx.lineStyle(TENDRIL_WIDTH * 2, COL.TENDRIL, 0.2 * fadeIn);
      this.tendrilGfx.lineBetween(fromOrg.x, fromOrg.y, toOrg.x, toOrg.y);

      // Core line
      this.tendrilGfx.lineStyle(TENDRIL_WIDTH, COL.TENDRIL, 0.7 * fadeIn);
      this.tendrilGfx.lineBetween(fromOrg.x, fromOrg.y, toOrg.x, toOrg.y);

      // Energy dots flowing along the tendril
      const dx = toOrg.x - fromOrg.x;
      const dy = toOrg.y - fromOrg.y;
      const dotCount = 3;

      for (let i = 0; i < dotCount; i++) {
        let p = (((t.energyPhase * t.pulseDir + i / dotCount) % 1) + 1) % 1;
        const dotX = fromOrg.x + dx * p;
        const dotY = fromOrg.y + dy * p;

        // Bright dot
        this.tendrilGfx.fillStyle(COL.ORGANISM_CORE, 0.9 * fadeIn);
        this.tendrilGfx.fillCircle(dotX, dotY, 3);

        // Dot glow
        this.tendrilGfx.fillStyle(COL.TENDRIL, 0.3 * fadeIn);
        this.tendrilGfx.fillCircle(dotX, dotY, 7);
      }
    }
  }

  private drawDragLine(): void {
    this.dragGfx.clear();
    if (!this.dragging || this.dragFromId < 0) return;

    const fromOrg = this.organisms[this.dragFromId];
    if (!fromOrg.alive) return;

    // Dashed preview line
    const dx = this.dragPointer.x - fromOrg.x;
    const dy = this.dragPointer.y - fromOrg.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(dist / 12);

    // Check if hovering over valid target
    const target = this.getOrganismAt(this.dragPointer.x, this.dragPointer.y);
    const valid =
      target !== null &&
      target.alive &&
      target.id !== this.dragFromId &&
      !this.tendrilExists(this.dragFromId, target.id) &&
      fromOrg.connectionCount < MAX_CONNECTIONS &&
      target.connectionCount < MAX_CONNECTIONS;

    const color = valid ? COL.TENDRIL : COL.TENDRIL_DIM;

    for (let i = 0; i < steps; i++) {
      const p = i / steps;
      if (i % 2 === 0) {
        const sx = fromOrg.x + dx * p;
        const sy = fromOrg.y + dy * p;
        const ex = fromOrg.x + dx * Math.min(1, p + 1 / steps);
        const ey = fromOrg.y + dy * Math.min(1, p + 1 / steps);
        this.dragGfx.lineStyle(2, color, 0.5);
        this.dragGfx.lineBetween(sx, sy, ex, ey);
      }
    }

    // Highlight valid target
    if (valid && target) {
      this.dragGfx.lineStyle(2, COL.TENDRIL, 0.6);
      this.dragGfx.strokeCircle(target.x, target.y, ORGANISM_RADIUS + 8);
    }
  }

  private drawOrganisms(): void {
    this.organismGfx.clear();

    for (const org of this.organisms) {
      if (!org.alive) {
        // Ghost of dead organism
        this.organismGfx.fillStyle(COL.ORGANISM_DEAD, 0.15);
        this.organismGfx.fillCircle(org.x, org.y, org.radius * 0.7);
        continue;
      }

      const pulse = Math.sin(org.pulsePhase) * 0.25 + 0.75;
      const r = org.radius + Math.sin(org.pulsePhase) * 2;
      const intensity = org.glowIntensity;

      // Outer glow
      this.organismGfx.fillStyle(COL.ORGANISM, 0.06 * intensity);
      this.organismGfx.fillCircle(org.x, org.y, r * 3);

      // Mid glow ring
      this.organismGfx.fillStyle(COL.ORGANISM, 0.12 * intensity * pulse);
      this.organismGfx.fillCircle(org.x, org.y, r * 2);

      // Main body
      this.organismGfx.fillStyle(COL.ORGANISM, 0.3 * intensity * pulse);
      this.organismGfx.fillCircle(org.x, org.y, r * 1.3);

      // Core
      this.organismGfx.fillStyle(COL.ORGANISM, 0.6 * intensity);
      this.organismGfx.fillCircle(org.x, org.y, r);

      // Bright center
      this.organismGfx.fillStyle(COL.ORGANISM_CORE, 0.8 * intensity * pulse);
      this.organismGfx.fillCircle(org.x, org.y, r * 0.5);

      // Hot white center
      this.organismGfx.fillStyle(0xffffff, 0.4 * intensity * pulse);
      this.organismGfx.fillCircle(org.x, org.y, r * 0.2);

      // Connection indicator ring
      if (org.connected) {
        this.organismGfx.lineStyle(1.5, COL.TENDRIL, 0.5 * pulse);
        this.organismGfx.strokeCircle(
          org.x,
          org.y,
          r + 6 + Math.sin(org.pulsePhase * 0.7) * 3,
        );
      }

      // Danger indicator: pulsing ring when being consumed
      if (org.deathTimer < 60 && !org.connected) {
        const danger = 1 - org.deathTimer / 60;
        const dangerPulse = Math.sin(this.elapsed * 10) * 0.3 + 0.7;
        this.organismGfx.lineStyle(2, COL.WARNING, danger * dangerPulse * 0.8);
        this.organismGfx.strokeCircle(org.x, org.y, r + 12);
      }

      // Connection count pips
      if (org.connectionCount > 0) {
        for (let i = 0; i < org.connectionCount; i++) {
          const a = -Math.PI / 2 + (i - (org.connectionCount - 1) / 2) * 0.5;
          const px = org.x + Math.cos(a) * (r + 14);
          const py = org.y + Math.sin(a) * (r + 14);
          this.organismGfx.fillStyle(COL.TENDRIL, 0.7);
          this.organismGfx.fillCircle(px, py, 2);
        }
      }
    }
  }

  private drawParticles(): void {
    for (const p of this.deathParticles) {
      const alpha = p.life / p.maxLife;
      const size = 2 + alpha * 4;
      this.organismGfx.fillStyle(p.color, alpha * 0.8);
      this.organismGfx.fillCircle(p.x, p.y, size);
    }
  }

  private updateHUD(): void {
    const aliveCount = this.organisms.filter((o) => o.alive).length;

    // Timer — flashes red when low
    const seconds = Math.ceil(this.timeLeft);
    const timerColor =
      seconds <= 10
        ? Math.sin(this.elapsed * 8) > 0
          ? "#ff4444"
          : "#ccffee"
        : "#ccffee";
    this.timerText.setText(`${seconds}s`);
    this.timerText.setColor(timerColor);

    // Alive count
    this.aliveText.setText(`alive: ${aliveCount}`);
    this.aliveText.setColor(aliveCount <= 3 ? "#ff4444" : "#ccffee");

    // Score / connections
    const connections = this.tendrils.length;
    this.scoreText.setText(`links: ${connections}`);
  }
}
