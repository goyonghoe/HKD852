import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/constants";

// ── Colors ──────────────────────────────────────────────
const COL_BG = 0x0d0d2b;
const COL_PULSE = 0x00ccff;
const COL_PULSE_PERFECT = 0x44ffff;
const COL_ORGANISM = 0xffaa00;
const COL_ORGANISM_DIM = 0xff3333;
const COL_CORRUPTION = 0x660066;
const COL_UI_TEXT = "#00ccff";
const COL_STREAK_TEXT = "#ffaa00";

// ── Tuning ──────────────────────────────────────────────
const PULSE_COOLDOWN = 800; // ms
const PULSE_MAX_RADIUS = 400;
const PULSE_SPEED = 320; // px/s
const PULSE_ENERGY_NORMAL = 25;
const PULSE_ENERGY_PERFECT = 45;
const RHYTHM_WINDOW = 100; // ±ms tolerance for perfect rhythm
const ORGANISM_COUNT = 8;
const ORGANISM_MAX_ENERGY = 100;
const ORGANISM_DRAIN_RATE = 12; // per second
const CORRUPTION_DRAIN_MULT = 2;
const CORRUPTION_SPAWN_INTERVAL = 8000;
const CORRUPTION_RADIUS = 100;
const CORRUPTION_LIFETIME = 10000;
const WIN_ALIVE_MIN = 5;
const WIN_TIME = 60; // seconds
const IDEAL_INTERVAL = 1200; // ideal tap interval for rhythm

// ── Interfaces ──────────────────────────────────────────
interface Organism {
  x: number;
  y: number;
  energy: number;
  alive: boolean;
  gfx: Phaser.GameObjects.Graphics;
  glowTween?: Phaser.Tweens.Tween;
  radius: number;
}

interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  energy: number;
  perfect: boolean;
  gfx: Phaser.GameObjects.Graphics;
}

interface CorruptionZone {
  x: number;
  y: number;
  radius: number;
  gfx: Phaser.GameObjects.Graphics;
  spawnTime: number;
  lifetime: number;
  alpha: number;
}

export class PulseScene extends Phaser.Scene {
  // ── State ───────────────────────────────────────────
  private organisms: Organism[] = [];
  private pulseRings: PulseRing[] = [];
  private corruptionZones: CorruptionZone[] = [];
  private lastTapTime = 0;
  private lastInterval = 0;
  private streak = 0;
  private bestStreak = 0;
  private totalEnergyDelivered = 0;
  private elapsedTime = 0;
  private gameOver = false;
  private gameWon = false;
  private canPulse = true;

  // ── UI ──────────────────────────────────────────────
  private timerText!: Phaser.GameObjects.Text;
  private aliveText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private cooldownBar!: Phaser.GameObjects.Graphics;
  private rhythmIndicator!: Phaser.GameObjects.Graphics;
  private bgGfx!: Phaser.GameObjects.Graphics;
  private flashRect!: Phaser.GameObjects.Rectangle;
  private resultContainer!: Phaser.GameObjects.Container;

  // ── Timing ──────────────────────────────────────────
  private nextCorruptionSpawn = 0;
  private cooldownTimer = 0;
  private rhythmPhase = 0; // 0..1 for metronome

  constructor() {
    super({ key: "PulseScene" });
  }

  // ════════════════════════════════════════════════════
  //  CREATE
  // ════════════════════════════════════════════════════
  create(): void {
    this.resetState();
    this.cameras.main.setBackgroundColor(COL_BG);

    // Background grid
    this.bgGfx = this.add.graphics();
    this.drawBgGrid();

    // Screen flash overlay
    this.flashRect = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0xffffff,
      )
      .setAlpha(0)
      .setDepth(100);

    // Spawn organisms
    this.spawnOrganisms();

    // UI
    this.createUI();

    // Input
    this.input.on("pointerdown", (_p: Phaser.Input.Pointer) => {
      if (this.gameOver) return;
      this.handleTap(_p.x, _p.y);
    });

    // Initial corruption timer
    this.nextCorruptionSpawn = 5000;
  }

  // ════════════════════════════════════════════════════
  //  UPDATE
  // ════════════════════════════════════════════════════
  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    const dt = delta / 1000;
    this.elapsedTime += dt;

    // Cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = 0;
        this.canPulse = true;
      }
    }

    // Update rhythm phase (metronome)
    this.rhythmPhase = (this.rhythmPhase + dt / (IDEAL_INTERVAL / 1000)) % 1;

    // Drain organisms
    this.updateOrganisms(dt);

    // Update pulse rings
    this.updatePulseRings(dt);

    // Update corruption zones
    this.updateCorruptionZones(delta);

    // Spawn corruption
    this.nextCorruptionSpawn -= delta;
    if (this.nextCorruptionSpawn <= 0) {
      this.spawnCorruptionZone();
      this.nextCorruptionSpawn = CORRUPTION_SPAWN_INTERVAL;
    }

    // Check win/lose
    const aliveCount = this.organisms.filter((o) => o.alive).length;

    if (this.elapsedTime >= WIN_TIME) {
      if (aliveCount >= WIN_ALIVE_MIN) {
        this.endGame(true);
      } else {
        this.endGame(false);
      }
      return;
    }

    if (aliveCount < WIN_ALIVE_MIN) {
      // Check if it's possible to still win — if fewer than 5 alive, game over
      this.endGame(false);
      return;
    }

    // Update UI
    this.updateUI(aliveCount);
  }

  // ════════════════════════════════════════════════════
  //  TAP HANDLER
  // ════════════════════════════════════════════════════
  private handleTap(x: number, y: number): void {
    if (!this.canPulse) return;

    const now = this.time.now;
    let isPerfect = false;
    let energy = PULSE_ENERGY_NORMAL;

    // Rhythm detection
    if (this.lastTapTime > 0) {
      const interval = now - this.lastTapTime;
      this.lastInterval = interval;

      // Check if interval matches ideal rhythm (±RHYTHM_WINDOW)
      const diff = Math.abs(interval - IDEAL_INTERVAL);
      if (diff <= RHYTHM_WINDOW) {
        isPerfect = true;
        this.streak++;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;
        energy = PULSE_ENERGY_PERFECT + Math.min(this.streak * 3, 30);
      } else {
        this.streak = 0;
      }
    }

    this.lastTapTime = now;

    // Emit pulse
    const maxRadius = isPerfect
      ? PULSE_MAX_RADIUS + Math.min(this.streak * 15, 150)
      : PULSE_MAX_RADIUS;
    this.emitPulse(x, y, maxRadius, energy, isPerfect);

    // Cooldown
    this.canPulse = false;
    this.cooldownTimer = PULSE_COOLDOWN;

    // Visual feedback
    if (isPerfect) {
      this.screenFlash();
      this.streakPopAnimation();
    }

    // Tap ripple feedback
    this.tapRipple(x, y);
  }

  // ════════════════════════════════════════════════════
  //  PULSE RING
  // ════════════════════════════════════════════════════
  private emitPulse(
    x: number,
    y: number,
    maxRadius: number,
    energy: number,
    perfect: boolean,
  ): void {
    const gfx = this.add.graphics().setDepth(10);
    const ring: PulseRing = {
      x,
      y,
      radius: 10,
      maxRadius,
      alpha: 1,
      energy,
      perfect,
      gfx,
    };
    this.pulseRings.push(ring);

    // Camera shake on perfect
    if (perfect) {
      this.cameras.main.shake(80, 0.005);
    }
  }

  private updatePulseRings(dt: number): void {
    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const ring = this.pulseRings[i];
      ring.radius += PULSE_SPEED * dt;
      ring.alpha = 1 - ring.radius / ring.maxRadius;

      // Check collision with organisms
      for (const org of this.organisms) {
        if (!org.alive) continue;
        const dist = Phaser.Math.Distance.Between(ring.x, ring.y, org.x, org.y);
        // Ring passes through organism (within a band)
        if (Math.abs(dist - ring.radius) < 20) {
          this.rechargeOrganism(org, ring.energy * dt * 3, ring.perfect);
        }
      }

      // Draw
      ring.gfx.clear();
      if (ring.alpha > 0) {
        const col = ring.perfect ? COL_PULSE_PERFECT : COL_PULSE;
        const lineWidth = ring.perfect ? 4 : 2.5;

        // Outer ring
        ring.gfx.lineStyle(lineWidth, col, ring.alpha * 0.9);
        ring.gfx.strokeCircle(ring.x, ring.y, ring.radius);

        // Inner glow ring
        ring.gfx.lineStyle(lineWidth * 2.5, col, ring.alpha * 0.2);
        ring.gfx.strokeCircle(ring.x, ring.y, ring.radius);

        // Perfect: secondary ring
        if (ring.perfect) {
          ring.gfx.lineStyle(1, 0xffffff, ring.alpha * 0.3);
          ring.gfx.strokeCircle(ring.x, ring.y, ring.radius * 0.92);
        }
      }

      // Remove if done
      if (ring.radius >= ring.maxRadius) {
        ring.gfx.destroy();
        this.pulseRings.splice(i, 1);
      }
    }
  }

  // ════════════════════════════════════════════════════
  //  ORGANISMS
  // ════════════════════════════════════════════════════
  private spawnOrganisms(): void {
    const margin = 80;
    const minDist = 100;

    for (let i = 0; i < ORGANISM_COUNT; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
        y = Phaser.Math.Between(200, GAME_HEIGHT - 200);
        attempts++;
      } while (
        attempts < 50 &&
        this.organisms.some(
          (o) => Phaser.Math.Distance.Between(o.x, o.y, x, y) < minDist,
        )
      );

      const gfx = this.add.graphics().setDepth(20);
      const org: Organism = {
        x,
        y,
        energy: ORGANISM_MAX_ENERGY,
        alive: true,
        gfx,
        radius: 14,
      };
      this.organisms.push(org);
    }
  }

  private updateOrganisms(dt: number): void {
    for (const org of this.organisms) {
      if (!org.alive) continue;

      // Drain
      let drain = ORGANISM_DRAIN_RATE * dt;

      // Check if in corruption zone
      for (const zone of this.corruptionZones) {
        const dist = Phaser.Math.Distance.Between(org.x, org.y, zone.x, zone.y);
        if (dist < zone.radius) {
          drain *= CORRUPTION_DRAIN_MULT;
          break;
        }
      }

      org.energy -= drain;

      // Gentle float/bob
      const bobOffset = Math.sin(this.elapsedTime * 1.5 + org.x * 0.01) * 2;

      // Draw organism
      org.gfx.clear();

      if (org.energy <= 0) {
        org.energy = 0;
        org.alive = false;
        this.deathAnimation(org);
        continue;
      }

      const energyPct = org.energy / ORGANISM_MAX_ENERGY;
      const col = energyPct > 0.3 ? COL_ORGANISM : COL_ORGANISM_DIM;
      const pulseScale =
        1 + Math.sin(this.elapsedTime * 3 + org.y * 0.02) * 0.08;
      const r = org.radius * pulseScale;

      // Glow aura
      org.gfx.fillStyle(col, 0.08 * energyPct);
      org.gfx.fillCircle(org.x, org.y + bobOffset, r * 3);
      org.gfx.fillStyle(col, 0.15 * energyPct);
      org.gfx.fillCircle(org.x, org.y + bobOffset, r * 2);

      // Core
      org.gfx.fillStyle(col, 0.6 + energyPct * 0.4);
      org.gfx.fillCircle(org.x, org.y + bobOffset, r);

      // Bright center
      org.gfx.fillStyle(0xffffff, 0.3 * energyPct);
      org.gfx.fillCircle(org.x, org.y + bobOffset, r * 0.4);

      // Energy arc above organism
      this.drawEnergyArc(
        org.gfx,
        org.x,
        org.y + bobOffset - r - 8,
        energyPct,
        col,
      );
    }
  }

  private drawEnergyArc(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    pct: number,
    color: number,
  ): void {
    const arcRadius = 18;
    const startAngle = Math.PI + 0.3;
    const endAngle = 2 * Math.PI - 0.3;
    const fillEnd = startAngle + (endAngle - startAngle) * pct;

    // Background arc
    gfx.lineStyle(2, 0x333366, 0.4);
    gfx.beginPath();
    gfx.arc(cx, cy, arcRadius, startAngle, endAngle, false);
    gfx.strokePath();

    // Fill arc
    if (pct > 0) {
      gfx.lineStyle(2.5, color, 0.8);
      gfx.beginPath();
      gfx.arc(cx, cy, arcRadius, startAngle, fillEnd, false);
      gfx.strokePath();
    }
  }

  private rechargeOrganism(
    org: Organism,
    amount: number,
    perfect: boolean,
  ): void {
    const before = org.energy;
    org.energy = Math.min(ORGANISM_MAX_ENERGY, org.energy + amount);
    const delivered = org.energy - before;
    if (delivered > 0) {
      this.totalEnergyDelivered += delivered;

      // Recharge flash
      if (perfect && delivered > 1) {
        this.rechargeFlash(org.x, org.y);
      }
    }
  }

  private rechargeFlash(x: number, y: number): void {
    const flash = this.add.graphics().setDepth(25);
    flash.fillStyle(COL_ORGANISM, 0.5);
    flash.fillCircle(x, y, 30);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  private deathAnimation(org: Organism): void {
    const death = this.add.graphics().setDepth(20);
    death.fillStyle(COL_ORGANISM_DIM, 0.6);
    death.fillCircle(org.x, org.y, org.radius);

    this.tweens.add({
      targets: death,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 600,
      ease: "Cubic.easeIn",
      onComplete: () => death.destroy(),
    });

    // Particle burst
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.add.graphics().setDepth(20);
      particle.fillStyle(COL_ORGANISM_DIM, 0.7);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(org.x, org.y);

      this.tweens.add({
        targets: particle,
        x: org.x + Math.cos(angle) * 40,
        y: org.y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }

    org.gfx.clear();
  }

  // ════════════════════════════════════════════════════
  //  CORRUPTION ZONES
  // ════════════════════════════════════════════════════
  private spawnCorruptionZone(): void {
    const margin = CORRUPTION_RADIUS + 20;
    const x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
    const y = Phaser.Math.Between(250, GAME_HEIGHT - 250);

    const gfx = this.add.graphics().setDepth(5);
    const zone: CorruptionZone = {
      x,
      y,
      radius: CORRUPTION_RADIUS,
      gfx,
      spawnTime: this.elapsedTime,
      lifetime: CORRUPTION_LIFETIME,
      alpha: 0,
    };
    this.corruptionZones.push(zone);
  }

  private updateCorruptionZones(delta: number): void {
    for (let i = this.corruptionZones.length - 1; i >= 0; i--) {
      const zone = this.corruptionZones[i];
      const age = (this.elapsedTime - zone.spawnTime) * 1000;

      // Fade in/out
      if (age < 500) {
        zone.alpha = age / 500;
      } else if (age > zone.lifetime - 1000) {
        zone.alpha = Math.max(0, (zone.lifetime - age) / 1000);
      } else {
        zone.alpha = 1;
      }

      // Remove if expired
      if (age >= zone.lifetime) {
        zone.gfx.destroy();
        this.corruptionZones.splice(i, 1);
        continue;
      }

      // Draw
      zone.gfx.clear();
      const wobble = Math.sin(this.elapsedTime * 2 + zone.x) * 5;

      // Multiple layers for fog effect
      zone.gfx.fillStyle(COL_CORRUPTION, 0.06 * zone.alpha);
      zone.gfx.fillCircle(zone.x, zone.y, zone.radius + wobble + 20);

      zone.gfx.fillStyle(COL_CORRUPTION, 0.12 * zone.alpha);
      zone.gfx.fillCircle(zone.x, zone.y, zone.radius + wobble);

      zone.gfx.fillStyle(COL_CORRUPTION, 0.2 * zone.alpha);
      zone.gfx.fillCircle(zone.x, zone.y, zone.radius * 0.7 + wobble * 0.5);

      // Danger ring
      zone.gfx.lineStyle(1.5, COL_CORRUPTION, 0.4 * zone.alpha);
      zone.gfx.strokeCircle(zone.x, zone.y, zone.radius + wobble);

      // Inner swirl particles (procedural)
      for (let p = 0; p < 4; p++) {
        const angle = this.elapsedTime * (1 + p * 0.3) + p * 1.5;
        const dist = zone.radius * 0.5 * (0.5 + Math.sin(angle * 2) * 0.5);
        const px = zone.x + Math.cos(angle) * dist;
        const py = zone.y + Math.sin(angle) * dist;
        zone.gfx.fillStyle(COL_CORRUPTION, 0.35 * zone.alpha);
        zone.gfx.fillCircle(px, py, 4);
      }
    }
  }

  // ════════════════════════════════════════════════════
  //  UI
  // ════════════════════════════════════════════════════
  private createUI(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "24px",
      color: COL_UI_TEXT,
    };

    // Timer
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 40, "60.0", {
        ...textStyle,
        fontSize: "36px",
      })
      .setOrigin(0.5)
      .setDepth(50);

    // Alive counter
    this.aliveText = this.add
      .text(GAME_WIDTH / 2, 80, `${ORGANISM_COUNT}/${WIN_ALIVE_MIN} alive`, {
        ...textStyle,
        fontSize: "20px",
        color: "#88aacc",
      })
      .setOrigin(0.5)
      .setDepth(50);

    // Streak
    this.streakText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 100, "", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: COL_STREAK_TEXT,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(50);

    // Score
    this.scoreText = this.add
      .text(20, 40, "0", {
        ...textStyle,
        fontSize: "18px",
        color: "#667799",
      })
      .setDepth(50);

    // Cooldown bar
    this.cooldownBar = this.add.graphics().setDepth(50);

    // Rhythm indicator
    this.rhythmIndicator = this.add.graphics().setDepth(50);

    // Instructions
    const instr = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 40,
        "TAP TO PULSE  |  FIND THE RHYTHM",
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#445566",
        },
      )
      .setOrigin(0.5)
      .setDepth(50);

    this.tweens.add({
      targets: instr,
      alpha: 0,
      delay: 4000,
      duration: 1000,
    });
  }

  private updateUI(aliveCount: number): void {
    // Timer
    const remaining = Math.max(0, WIN_TIME - this.elapsedTime);
    this.timerText.setText(remaining.toFixed(1));
    if (remaining < 10) {
      this.timerText.setColor("#ff4444");
    }

    // Alive
    this.aliveText.setText(`${aliveCount}/${WIN_ALIVE_MIN} alive`);
    this.aliveText.setColor(
      aliveCount >= WIN_ALIVE_MIN ? "#88aacc" : "#ff4444",
    );

    // Streak
    if (this.streak >= 2) {
      this.streakText.setText(`${this.streak}x STREAK`);
      this.streakText.setAlpha(1);
    } else {
      this.streakText.setAlpha(
        Math.max(0, (this.streakText.alpha || 0) - 0.02),
      );
    }

    // Score
    const score = Math.floor(this.totalEnergyDelivered + this.bestStreak * 50);
    this.scoreText.setText(`SCORE: ${score}`);

    // Cooldown bar
    this.cooldownBar.clear();
    const barW = 120;
    const barH = 4;
    const barX = GAME_WIDTH / 2 - barW / 2;
    const barY = GAME_HEIGHT - 60;
    const cooldownPct = this.cooldownTimer / PULSE_COOLDOWN;

    // Background
    this.cooldownBar.fillStyle(0x222244, 0.5);
    this.cooldownBar.fillRect(barX, barY, barW, barH);

    if (cooldownPct > 0) {
      this.cooldownBar.fillStyle(COL_PULSE, 0.6);
      this.cooldownBar.fillRect(barX, barY, barW * (1 - cooldownPct), barH);
    } else {
      this.cooldownBar.fillStyle(COL_PULSE, 0.9);
      this.cooldownBar.fillRect(barX, barY, barW, barH);
    }

    // Rhythm indicator (metronome)
    this.rhythmIndicator.clear();
    const riY = GAME_HEIGHT - 140;
    const riW = 200;
    const riX = GAME_WIDTH / 2 - riW / 2;

    // Track line
    this.rhythmIndicator.lineStyle(1, 0x334466, 0.4);
    this.rhythmIndicator.lineBetween(riX, riY, riX + riW, riY);

    // Center marker (ideal tap point)
    this.rhythmIndicator.fillStyle(COL_PULSE, 0.5);
    this.rhythmIndicator.fillRect(riX + riW / 2 - 1, riY - 8, 2, 16);

    // Tolerance zone
    const tolW = (RHYTHM_WINDOW / IDEAL_INTERVAL) * riW;
    this.rhythmIndicator.fillStyle(COL_PULSE, 0.08);
    this.rhythmIndicator.fillRect(riX + riW / 2 - tolW, riY - 6, tolW * 2, 12);

    // Moving dot (phase)
    const dotX = riX + this.rhythmPhase * riW;
    const dotAlpha = 0.3 + Math.abs(0.5 - this.rhythmPhase) * 0.6;
    this.rhythmIndicator.fillStyle(0xffffff, dotAlpha);
    this.rhythmIndicator.fillCircle(dotX, riY, 4);

    // Label
    if (this.streak >= 2) {
      this.rhythmIndicator.fillStyle(COL_PULSE_PERFECT, 0.3);
      const glowPhase = Math.sin(this.elapsedTime * 6) * 0.2 + 0.3;
      this.rhythmIndicator.fillCircle(riX + riW / 2, riY, 8 + glowPhase * 5);
    }
  }

  // ════════════════════════════════════════════════════
  //  VISUAL EFFECTS
  // ════════════════════════════════════════════════════
  private screenFlash(): void {
    this.flashRect.setAlpha(0.15);
    this.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: 200,
      ease: "Cubic.easeOut",
    });
  }

  private streakPopAnimation(): void {
    this.streakText.setScale(1.5);
    this.tweens.add({
      targets: this.streakText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  private tapRipple(x: number, y: number): void {
    const ripple = this.add.graphics().setDepth(8);
    ripple.lineStyle(1.5, COL_PULSE, 0.5);
    ripple.strokeCircle(x, y, 10);

    this.tweens.add({
      targets: ripple,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 400,
      onComplete: () => ripple.destroy(),
    });
  }

  private drawBgGrid(): void {
    this.bgGfx.clear();
    const spacing = 60;

    // Vertical lines
    for (let x = 0; x <= GAME_WIDTH; x += spacing) {
      this.bgGfx.lineStyle(1, 0x1a1a4a, 0.15);
      this.bgGfx.lineBetween(x, 0, x, GAME_HEIGHT);
    }

    // Horizontal lines
    for (let y = 0; y <= GAME_HEIGHT; y += spacing) {
      this.bgGfx.lineStyle(1, 0x1a1a4a, 0.15);
      this.bgGfx.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  // ════════════════════════════════════════════════════
  //  GAME END
  // ════════════════════════════════════════════════════
  private endGame(won: boolean): void {
    this.gameOver = true;
    this.gameWon = won;

    const aliveCount = this.organisms.filter((o) => o.alive).length;
    const score = Math.floor(this.totalEnergyDelivered + this.bestStreak * 50);

    // Dim everything
    const dimOverlay = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0,
      )
      .setDepth(80);

    this.tweens.add({
      targets: dimOverlay,
      fillAlpha: 0.6,
      duration: 500,
    });

    // Result panel
    this.resultContainer = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(90);
    this.resultContainer.setAlpha(0);

    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x0d0d3b, 0.9);
    panelGfx.fillRoundedRect(-200, -180, 400, 360, 16);
    panelGfx.lineStyle(2, won ? COL_PULSE : COL_ORGANISM_DIM, 0.6);
    panelGfx.strokeRoundedRect(-200, -180, 400, 360, 16);
    this.resultContainer.add(panelGfx);

    const titleColor = won ? COL_UI_TEXT : "#ff4444";
    const titleStr = won ? "SYNCHRONIZED" : "DESYNC";

    const title = this.add
      .text(0, -140, titleStr, {
        fontFamily: "monospace",
        fontSize: "36px",
        color: titleColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.resultContainer.add(title);

    const lines = [
      `Score: ${score}`,
      `Organisms Saved: ${aliveCount}/${ORGANISM_COUNT}`,
      `Best Streak: ${this.bestStreak}x`,
      `Energy Delivered: ${Math.floor(this.totalEnergyDelivered)}`,
      `Time: ${Math.min(WIN_TIME, this.elapsedTime).toFixed(1)}s`,
    ];

    lines.forEach((line, i) => {
      const t = this.add
        .text(0, -60 + i * 36, line, {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#aabbcc",
        })
        .setOrigin(0.5);
      this.resultContainer.add(t);
    });

    const restartText = this.add
      .text(0, 140, "TAP FOR MENU", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COL_UI_TEXT,
      })
      .setOrigin(0.5);
    this.resultContainer.add(restartText);

    // Blink restart text
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    // Fade in
    this.tweens.add({
      targets: this.resultContainer,
      alpha: 1,
      y: GAME_HEIGHT / 2 - 20,
      duration: 500,
      ease: "Back.easeOut",
    });

    // Restart on tap (after delay)
    this.time.delayedCall(800, () => {
      this.input.once("pointerdown", () => {
        this.scene.start("PrototypeMenuScene");
      });
    });
  }

  // ════════════════════════════════════════════════════
  //  RESET
  // ════════════════════════════════════════════════════
  private resetState(): void {
    this.organisms = [];
    this.pulseRings = [];
    this.corruptionZones = [];
    this.lastTapTime = 0;
    this.lastInterval = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.totalEnergyDelivered = 0;
    this.elapsedTime = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.canPulse = true;
    this.cooldownTimer = 0;
    this.rhythmPhase = 0;
    this.nextCorruptionSpawn = 5000;
  }
}
