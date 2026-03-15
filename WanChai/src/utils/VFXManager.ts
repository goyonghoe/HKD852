import Phaser from 'phaser';
import { NEON, ELEMENT, TEX, BOSS_FREEDOM_COLORS, BOSS_AERO_COLORS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { VISUAL, BALANCE } from '../config/balance';

const POOL_SIZE = 80; // reduced from 120
const LIGHTNING_POOL_SIZE = 6; // max concurrent lightning bolts
const NAPALM_POOL_SIZE = 4; // max concurrent napalm zones

interface ActiveParticle {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ActiveLightning {
  graphics: Phaser.GameObjects.Graphics;
  life: number;
}

interface ActiveNapalm {
  graphics: Phaser.GameObjects.Graphics;
  life: number;
}

/**
 * Zero-allocation VFX manager.
 * Uses manual velocity updates instead of tweens to avoid GC pressure.
 * Lightning + bomb use pooled Graphics objects (no create/destroy per use).
 */
export class VFXManager {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Rectangle[] = [];
  private active: ActiveParticle[] = [];
  private poolHead = 0;

  // Pooled lightning graphics (no per-use create/destroy)
  private lightningPool: Phaser.GameObjects.Graphics[] = [];
  private activeLightning: ActiveLightning[] = [];

  // Pooled napalm graphics (multiple concurrent zones)
  private napalmPool: Phaser.GameObjects.Graphics[] = [];
  private activeNapalm: ActiveNapalm[] = [];

  // Pooled bomb graphics (single reusable instance)
  private bombGraphics: Phaser.GameObjects.Graphics | null = null;
  private bombLife = 0;

  // Pooled muzzle flash graphics
  private muzzlePool: Phaser.GameObjects.Graphics[] = [];
  private activeMuzzle: { graphics: Phaser.GameObjects.Graphics; life: number }[] = [];
  private static readonly MUZZLE_POOL_SIZE = 3;

  // Pooled aura pulse graphics
  private auraPool: Phaser.GameObjects.Graphics[] = [];
  private activeAura: {
    graphics: Phaser.GameObjects.Graphics;
    life: number;
    maxLife: number;
    x: number;
    y: number;
    color: number;
    maxRadius: number;
  }[] = [];
  private static readonly AURA_POOL_SIZE = 2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPool();
    this.initLightningPool();
    this.initNapalmPool();
    this.initMuzzlePool();
    this.initAuraPool();
  }

  private initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const r = this.scene.add
        .rectangle(-100, -100, 6, 6, NEON.PROJECTILE)
        .setVisible(false)
        .setActive(false)
        .setDepth(500);
      this.pool.push(r);
    }
    this.poolHead = 0;
  }

  private initLightningPool(): void {
    for (let i = 0; i < LIGHTNING_POOL_SIZE; i++) {
      const g = this.scene.add.graphics().setDepth(500).setVisible(false);
      this.lightningPool.push(g);
    }
  }

  private initNapalmPool(): void {
    for (let i = 0; i < NAPALM_POOL_SIZE; i++) {
      const g = this.scene.add.graphics().setDepth(200).setVisible(false);
      this.napalmPool.push(g);
    }
  }

  private initMuzzlePool(): void {
    for (let i = 0; i < VFXManager.MUZZLE_POOL_SIZE; i++) {
      const g = this.scene.add.graphics().setDepth(550).setVisible(false);
      this.muzzlePool.push(g);
    }
  }

  private initAuraPool(): void {
    for (let i = 0; i < VFXManager.AURA_POOL_SIZE; i++) {
      const g = this.scene.add.graphics().setDepth(100).setVisible(false);
      this.auraPool.push(g);
    }
  }

  private acquireMuzzle(): Phaser.GameObjects.Graphics | null {
    for (const g of this.muzzlePool) {
      if (!g.visible) {
        g.setVisible(true);
        return g;
      }
    }
    return null;
  }

  private acquireAura(): Phaser.GameObjects.Graphics | null {
    for (const g of this.auraPool) {
      if (!g.visible) {
        g.setVisible(true);
        return g;
      }
    }
    return null;
  }

  private acquireNapalm(): Phaser.GameObjects.Graphics | null {
    for (const g of this.napalmPool) {
      if (!g.visible) {
        g.setVisible(true);
        return g;
      }
    }
    return null;
  }

  private acquire(): Phaser.GameObjects.Rectangle | null {
    for (let i = 0; i < POOL_SIZE; i++) {
      const idx = (this.poolHead + i) % POOL_SIZE;
      const r = this.pool[idx];
      if (!r.active) {
        r.setActive(true).setVisible(true);
        this.poolHead = (idx + 1) % POOL_SIZE;
        return r;
      }
    }
    return null;
  }

  private release(r: Phaser.GameObjects.Rectangle): void {
    r.setActive(false).setVisible(false).setPosition(-100, -100).setScale(1).setAlpha(1);
  }

  private acquireLightning(): Phaser.GameObjects.Graphics | null {
    for (const g of this.lightningPool) {
      if (!g.visible) {
        g.setVisible(true);
        return g;
      }
    }
    return null;
  }

  /** Must be called every frame from RunScene.update() */
  update(delta: number): void {
    const dt = delta / 1000;

    // Particles
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.release(p.rect);
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        continue;
      }
      const t = p.life / p.maxLife;
      p.rect.x += p.vx * dt;
      p.rect.y += p.vy * dt;
      p.rect.setAlpha(t);
      p.rect.setScale(t);
    }

    // Lightning fade
    for (let i = this.activeLightning.length - 1; i >= 0; i--) {
      const l = this.activeLightning[i];
      l.life -= delta;
      if (l.life <= 0) {
        l.graphics.clear().setVisible(false);
        this.activeLightning[i] = this.activeLightning[this.activeLightning.length - 1];
        this.activeLightning.pop();
      } else {
        l.graphics.setAlpha(l.life / 200);
      }
    }

    // Napalm zone fade (pooled — supports multiple concurrent zones)
    for (let i = this.activeNapalm.length - 1; i >= 0; i--) {
      const n = this.activeNapalm[i];
      n.life -= delta;
      if (n.life <= 0) {
        n.graphics.clear().setVisible(false);
        this.activeNapalm[i] = this.activeNapalm[this.activeNapalm.length - 1];
        this.activeNapalm.pop();
      } else {
        n.graphics.setAlpha((n.life / 4000) * 0.6);
      }
    }

    // Bomb flash fade
    if (this.bombLife > 0) {
      this.bombLife -= delta;
      if (this.bombLife <= 0 && this.bombGraphics) {
        this.bombGraphics.clear().setVisible(false);
      } else if (this.bombGraphics) {
        this.bombGraphics.setAlpha(this.bombLife / 300);
      }
    }

    // Muzzle flash fade
    for (let i = this.activeMuzzle.length - 1; i >= 0; i--) {
      const m = this.activeMuzzle[i];
      m.life -= delta;
      if (m.life <= 0) {
        m.graphics.clear().setVisible(false);
        this.activeMuzzle[i] = this.activeMuzzle[this.activeMuzzle.length - 1];
        this.activeMuzzle.pop();
      } else {
        m.graphics.setAlpha(m.life / BALANCE.PLAYER_ANIM.muzzleFlashMs);
      }
    }

    // Aura pulse expand + fade
    for (let i = this.activeAura.length - 1; i >= 0; i--) {
      const a = this.activeAura[i];
      a.life -= delta;
      if (a.life <= 0) {
        a.graphics.clear().setVisible(false);
        this.activeAura[i] = this.activeAura[this.activeAura.length - 1];
        this.activeAura.pop();
      } else {
        const t = 1 - a.life / a.maxLife; // 0→1 progress
        const radius = a.maxRadius * t;
        a.graphics.clear().setAlpha(1 - t);
        a.graphics.lineStyle(2, a.color, 1 - t);
        a.graphics.strokeCircle(a.x, a.y, radius);
      }
    }
  }

  /** Burst on enemy death — capped at 4 particles */
  enemyDeath(x: number, y: number, color: number): void {
    const count = Math.min(VISUAL.PARTICLE.deathBurst, 4);
    const life = VISUAL.ANIM.deathFadeMs * 2;
    for (let i = 0; i < count; i++) {
      const r = this.acquire();
      if (!r) break;
      r.setPosition(x, y).setFillStyle(color).setSize(4, 4).setAlpha(1).setScale(1);
      const angle = (Math.PI * 2 * i) / count;
      const speed = 80 + Math.random() * 120;
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
      });
    }
  }

  /** Small spark on projectile hit — 2 particles max */
  hitSpark(x: number, y: number, color?: number): void {
    const count = Math.min(VISUAL.PARTICLE.hitSpark, 2);
    const life = VISUAL.ANIM.hitFlashMs * 3;
    const fillColor = color ?? NEON.PROJECTILE;
    for (let i = 0; i < count; i++) {
      const r = this.acquire();
      if (!r) break;
      r.setPosition(x, y).setFillStyle(fillColor).setSize(3, 3).setAlpha(1).setScale(1);
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 80;
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
      });
    }
  }

  /** Draw a zigzag lightning bolt — uses pooled Graphics (no create/destroy) */
  lightning(x1: number, y1: number, x2: number, y2: number, color: number = NEON.XP_BAR): void {
    const g = this.acquireLightning();
    if (!g) return;

    g.clear();
    g.setAlpha(1);
    g.lineStyle(2, color, 0.9);
    g.beginPath();
    g.moveTo(x1, y1);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t + (Math.random() - 0.5) * 20;
      const py = y1 + dy * t + (Math.random() - 0.5) * 20;
      g.lineTo(px, py);
    }
    g.lineTo(x2, y2);
    g.strokePath();

    this.activeLightning.push({ graphics: g, life: 200 });
  }

  /** Napalm fire zone — pooled Graphics (supports multiple concurrent zones), fades over 4s */
  napalmZone(x: number, y: number, radius: number): void {
    const g = this.acquireNapalm();
    if (!g) return;
    g.clear();
    g.setAlpha(0.6);
    g.fillStyle(TEX.NAPALM_FILL, 0.25);
    g.fillCircle(x, y, radius);
    g.lineStyle(2, TEX.NAPALM_STROKE, 0.5);
    g.strokeCircle(x, y, radius);
    // Inner fire
    g.fillStyle(TEX.NAPALM_INNER, 0.15);
    g.fillCircle(x, y, radius * 0.6);
    this.activeNapalm.push({ graphics: g, life: 4000 });
  }

  /** Bomb explosion flash — uses single pooled Graphics */
  bombFlash(x: number, y: number, radius: number): void {
    if (!this.bombGraphics) {
      this.bombGraphics = this.scene.add.graphics().setDepth(500);
    }
    const g = this.bombGraphics;
    g.clear();
    g.setVisible(true).setAlpha(1);
    g.fillStyle(TEX.NAPALM_FILL, 0.3);
    g.fillCircle(x, y, radius);
    g.lineStyle(3, TEX.NAPALM_STROKE, 0.8);
    g.strokeCircle(x, y, radius);
    this.bombLife = 300;
  }

  /** Muzzle flash — element-colored circle + white core, 80ms fade */
  muzzleFlash(x: number, y: number, color: number): void {
    const g = this.acquireMuzzle();
    if (!g) return;
    g.clear().setAlpha(1);
    // Outer glow (element color)
    g.fillStyle(color, 0.6);
    g.fillCircle(x, y, BALANCE.PLAYER_ANIM.muzzleFlashRadius);
    // Inner core (white)
    g.fillStyle(NEON.PROJECTILE, 0.9);
    g.fillCircle(x, y, BALANCE.PLAYER_ANIM.muzzleFlashRadius * 0.5);
    this.activeMuzzle.push({ graphics: g, life: BALANCE.PLAYER_ANIM.muzzleFlashMs });
  }

  /** Element aura pulse — expanding ring from player position */
  elementAuraPulse(x: number, y: number, color: number, maxRadius?: number): void {
    const g = this.acquireAura();
    if (!g) return;
    const mr = maxRadius ?? BALANCE.PLAYER_ANIM.auraPulseMaxRadius;
    const ml = BALANCE.PLAYER_ANIM.auraPulseMs;
    g.clear().setAlpha(0.8);
    this.activeAura.push({ graphics: g, life: ml, maxLife: ml, x, y, color, maxRadius: mr });
  }

  /** Purification burst — enemy freed from corruption. Purple→white particles + light residue. */
  purifyDeath(x: number, y: number, tier: 't1' | 't2' | 'elite' | 'boss'): void {
    const config = {
      t1: { count: 4, size: 4, life: 300 },
      t2: { count: 6, size: 5, life: 400 },
      elite: { count: 8, size: 6, life: 500 },
      boss: { count: 12, size: 8, life: 800 },
    }[tier];

    // Purple→white particles (corruption purging)
    for (let i = 0; i < config.count; i++) {
      const r = this.acquire();
      if (!r) break;
      const angle = (Math.PI * 2 * i) / config.count;
      const speed = 40 + Math.random() * 60;
      // Start purple or white alternating
      const startColor = i % 2 === 0 ? ELEMENT.DARK : NEON.PROJECTILE;
      r.setPosition(x, y).setFillStyle(startColor).setSize(config.size, config.size).setAlpha(1).setScale(1);
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30, // upward bias (ascending/liberating feel)
        life: config.life,
        maxLife: config.life,
      });
    }

    // Boss: full screen white flash
    if (tier === 'boss') {
      this.screenFlash(NEON.PROJECTILE, 0.5, 600);
    }
  }

  /** Brief screen flash overlay */
  private flashOverlay: Phaser.GameObjects.Rectangle | null = null;
  screenFlash(color: number, alpha: number, duration: number): void {
    if (!this.flashOverlay) {
      this.flashOverlay = this.scene.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, 0)
        .setDepth(1500);
    }
    this.flashOverlay.setFillStyle(color, alpha).setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  /** Camera shake */
  screenShake(intensity = 0.003, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Camera zoom punch — briefly zooms in then returns to 1.0.
   * Uses a delayed call to guarantee zoom-back even if overlapping calls occur.
   */
  private zoomResetTimer?: Phaser.Time.TimerEvent;
  cameraZoomPunch(targetZoom: number, durationMs: number): void {
    const cam = this.scene.cameras.main;
    // Cancel any pending zoom reset to avoid conflicts
    if (this.zoomResetTimer) {
      this.zoomResetTimer.destroy();
      this.zoomResetTimer = undefined;
    }
    cam.zoomTo(targetZoom, durationMs / 2, 'Quad.easeOut', true);
    // Schedule guaranteed zoom-back to 1.0
    this.zoomResetTimer = this.scene.time.delayedCall(durationMs / 2, () => {
      cam.zoomTo(1, durationMs / 2, 'Quad.easeIn', true);
      this.zoomResetTimer = undefined;
    });
  }

  /**
   * Camera slow zoom — zooms to target over duration without returning.
   * Used for game over dramatic zoom-out.
   */
  cameraSustainedZoom(targetZoom: number, durationMs: number): void {
    this.scene.cameras.main.zoomTo(targetZoom, durationMs, 'Quad.easeInOut');
  }

  /** Glitch scanlines overlay */
  private glitchGraphics: Phaser.GameObjects.Graphics | null = null;
  private glitchTimer = 0;

  updateGlitch(delta: number, hpPct: number): void {
    if (hpPct >= 0.3) {
      if (this.glitchGraphics) {
        this.glitchGraphics.setAlpha(0);
      }
      return;
    }

    this.glitchTimer += delta;
    if (this.glitchTimer < 200) return;
    this.glitchTimer = 0;

    if (!this.glitchGraphics) {
      this.glitchGraphics = this.scene.add.graphics().setDepth(1400);
    }

    const g = this.glitchGraphics;
    g.clear();

    const intensity = 1 - hpPct / 0.3;
    g.setAlpha(0.15 + intensity * 0.25);

    const lineCount = 3 + Math.floor(intensity * 8);
    g.lineStyle(1, NEON.HEALTH, 0.4);
    for (let i = 0; i < lineCount; i++) {
      const y = Math.random() * GAME_HEIGHT;
      g.moveTo(0, y);
      g.lineTo(GAME_WIDTH, y);
    }
    g.strokePath();

    const blockCount = Math.floor(intensity * 4);
    g.fillStyle(NEON.HEALTH, 0.1 + intensity * 0.15);
    for (let i = 0; i < blockCount; i++) {
      const bw = 30 + Math.random() * 60;
      const bh = 5 + Math.random() * 15;
      const side = Math.random() < 0.5 ? 0 : GAME_WIDTH - bw;
      g.fillRect(side, Math.random() * GAME_HEIGHT, bw, bh);
    }
  }

  /** Full-screen element color flash for ultimate activation */
  ultimateFlash(color: number): void {
    this.screenFlash(color, 0.4, 250);
    this.screenShake(0.005, 200);
  }

  /**
   * TASK-126: Boss Freedom Burst — 5-second liberation cutscene.
   * Phase 1 (0-1s): Explosion flash + debris spreading outward + screen shake.
   * Phase 2 (1-3s): Animal silhouette particles rising from boss position (critter color).
   * Phase 3 (3-5s): Particles fade upward and dissolve, soft glow remains.
   * Uses tweens for the cutscene (acceptable since this is a rare one-time event per boss).
   */
  bossFreedomBurst(x: number, y: number, critterColor: number): void {
    const cfg = BALANCE.BOSS_FREEDOM;

    // === PHASE 1: Explosion flash + debris (0 – 1s) ===
    this.screenFlash(NEON.PROJECTILE, cfg.flashAlpha, cfg.explosionMs);
    this.screenShake(cfg.explosionShakeIntensity, cfg.explosionShakeDurationMs);

    // Debris particles spreading outward
    for (let i = 0; i < cfg.debrisCount; i++) {
      const r = this.acquire();
      if (!r) break;
      const angle = (Math.PI * 2 * i) / cfg.debrisCount;
      const speed = 100 + Math.random() * 150;
      const debrisColor = i % 2 === 0 ? BOSS_FREEDOM_COLORS.DEBRIS_DARK : BOSS_FREEDOM_COLORS.DEBRIS_LIGHT;
      r.setPosition(x, y).setFillStyle(debrisColor).setSize(6, 6).setAlpha(1).setScale(1);
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: cfg.explosionMs,
        maxLife: cfg.explosionMs,
      });
    }

    // === PHASE 2: Rising silhouette particles (1s – 3s) ===
    this.scene.time.delayedCall(cfg.explosionMs, () => {
      for (let i = 0; i < cfg.particleCount; i++) {
        const r = this.acquire();
        if (!r) break;
        // Stagger particle spawns across Phase 2
        const delay = (i / cfg.particleCount) * 400;
        const offsetX = (Math.random() - 0.5) * 60;
        const startY = y + (Math.random() - 0.5) * 30;
        // Alternate between critter color and white core
        const pColor = i % 3 === 0 ? BOSS_FREEDOM_COLORS.GLOW_CORE : critterColor;
        const pSize = 6 + Math.random() * 4;

        this.scene.time.delayedCall(delay, () => {
          r.setPosition(x + offsetX, startY)
            .setFillStyle(pColor)
            .setSize(pSize, pSize)
            .setAlpha(1)
            .setScale(1);
          // Rise upward with slight horizontal drift
          const driftX = (Math.random() - 0.5) * 40;
          this.active.push({
            rect: r,
            vx: driftX,
            vy: -(cfg.riseHeightPx / ((cfg.riseDurationMs + cfg.fadeDurationMs) / 1000)),
            life: cfg.riseDurationMs + cfg.fadeDurationMs - delay,
            maxLife: cfg.riseDurationMs + cfg.fadeDurationMs - delay,
          });
        });
      }
    });

    // === PHASE 3: Soft glow at boss position (3s – 5s) ===
    this.scene.time.delayedCall(cfg.explosionMs + cfg.riseDurationMs, () => {
      // Element aura pulse as final glow
      this.elementAuraPulse(x, y, critterColor, 80);
      // One more gentle screen flash in critter color
      this.screenFlash(critterColor, 0.2, cfg.fadeDurationMs);
    });
  }

  /** Vertical beam for MEI ultimate — element-colored beam from player to top of screen */
  ultimateBeam(x: number, color: number, width: number): void {
    const g = this.acquireNapalm(); // reuse napalm pool for beam graphic
    if (!g) return;
    g.clear().setAlpha(0.9).setDepth(600);
    // Outer glow
    g.fillStyle(color, 0.3);
    g.fillRect(x - width, 0, width * 2, GAME_HEIGHT);
    // Inner beam
    g.fillStyle(color, 0.7);
    g.fillRect(x - width / 2, 0, width, GAME_HEIGHT);
    // Core white
    g.fillStyle(NEON.PROJECTILE, 0.8);
    g.fillRect(x - width / 4, 0, width / 2, GAME_HEIGHT);
    this.activeNapalm.push({ graphics: g, life: 600 });
  }

  /** Boss Aero: spawn rotating wind particles around boss position.
   *  Called every frame when boss_burst is active. Spawns one particle per call
   *  that orbits outward from center. Phase determines color. */
  private windSpawnTimer = 0;
  windVortexTick(delta: number, bossX: number, bossY: number, radius: number, phase: 1 | 2 | 3): void {
    this.windSpawnTimer += delta;
    const interval = BALANCE.BOSS_AERO.windParticleSpawnIntervalMs;
    if (this.windSpawnTimer < interval) return;
    this.windSpawnTimer -= interval;

    const r = this.acquire();
    if (!r) return;
    const color = phase >= 3 ? BOSS_AERO_COLORS.WIND_PARTICLE_P3 : BOSS_AERO_COLORS.WIND_PARTICLE;
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * 0.3 + Math.random() * radius * 0.7;
    const px = bossX + Math.cos(angle) * dist;
    const py = bossY + Math.sin(angle) * dist;
    r.setPosition(px, py).setFillStyle(color).setSize(3, 3).setAlpha(0.7).setScale(1);
    // Tangential velocity (perpendicular to radius = orbiting)
    const orbSpeed = BALANCE.BOSS_AERO.windParticleSpeed * dist;
    const life = BALANCE.BOSS_AERO.windParticleLifeMs;
    this.active.push({
      rect: r,
      vx: -Math.sin(angle) * orbSpeed,
      vy: Math.cos(angle) * orbSpeed,
      life,
      maxLife: life,
    });
  }

  /** Boss Aero: Eagle Dive silhouette — golden triangle crossing screen right-to-left */
  eagleDiveSilhouette(): void {
    const size = BALANCE.BOSS_AERO.diveEagleSize;
    const duration = BALANCE.BOSS_AERO.diveEagleDurationMs;
    // Spawn 3 triangle-shaped particles as eagle silhouette
    for (let i = 0; i < 3; i++) {
      const r = this.acquire();
      if (!r) break;
      const startX = GAME_WIDTH + 50;
      const startY = GAME_HEIGHT * 0.3 + i * size * 0.6;
      r.setPosition(startX, startY)
        .setFillStyle(BOSS_AERO_COLORS.EAGLE_SILHOUETTE)
        .setSize(size - i * 8, size - i * 12)
        .setAlpha(0.8)
        .setScale(1);
      // Fly left across the entire screen
      const speed = (GAME_WIDTH + 100) / (duration / 1000);
      this.active.push({
        rect: r,
        vx: -speed,
        vy: (Math.random() - 0.5) * 30, // slight vertical wobble
        life: duration,
        maxLife: duration,
      });
    }
  }

  /** Boss Aero: Phase transition turbine debris — mechanical parts flying outward */
  phaseTransitionDebris(x: number, y: number, toPhase: 2 | 3): void {
    const count = BALANCE.BOSS_AERO.phaseTransitionDebrisCount;
    const life = BALANCE.BOSS_AERO.phaseTransitionDebrisLife;
    const color = toPhase === 2 ? BOSS_AERO_COLORS.WIND_PARTICLE : BOSS_AERO_COLORS.WIND_PARTICLE_P3;
    for (let i = 0; i < count; i++) {
      const r = this.acquire();
      if (!r) break;
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 80;
      r.setPosition(x, y)
        .setFillStyle(i % 2 === 0 ? color : NEON.UI_DIM)
        .setSize(5, 5)
        .setAlpha(1)
        .setScale(1);
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 30, // slight downward bias (falling debris)
        life,
        maxLife: life,
      });
    }
    // Extra camera punch for phase transition drama
    this.cameraZoomPunch(1.04, 400);
  }

  /** Boss Aero: Wind dissipation on boss death — particles scatter outward and fade */
  windDissipate(x: number, y: number): void {
    const count = BALANCE.BOSS_AERO.windDissipateCount;
    const life = BALANCE.BOSS_AERO.windDissipateLife;
    for (let i = 0; i < count; i++) {
      const r = this.acquire();
      if (!r) break;
      const angle = (Math.PI * 2 * i) / count;
      const speed = 60 + Math.random() * 100;
      const color = i % 3 === 0 ? BOSS_AERO_COLORS.WIND_PARTICLE_P3 : BOSS_AERO_COLORS.WIND_PARTICLE;
      r.setPosition(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40)
        .setFillStyle(color)
        .setSize(4, 4)
        .setAlpha(0.9)
        .setScale(1);
      this.active.push({
        rect: r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50, // upward bias (wind rising)
        life,
        maxLife: life,
      });
    }
  }

  destroy(): void {
    if (this.flashOverlay) {
      this.flashOverlay.destroy();
      this.flashOverlay = null;
    }
    if (this.glitchGraphics) {
      this.glitchGraphics.destroy();
      this.glitchGraphics = null;
    }
    for (const g of this.napalmPool) g.destroy();
    this.napalmPool = [];
    this.activeNapalm = [];
    if (this.bombGraphics) {
      this.bombGraphics.destroy();
      this.bombGraphics = null;
    }
    for (const g of this.lightningPool) g.destroy();
    this.lightningPool = [];
    this.activeLightning = [];
    for (const g of this.muzzlePool) g.destroy();
    this.muzzlePool = [];
    this.activeMuzzle = [];
    for (const g of this.auraPool) g.destroy();
    this.auraPool = [];
    this.activeAura = [];
    for (const r of this.pool) r.destroy();
    this.pool = [];
    this.active = [];
  }
}
