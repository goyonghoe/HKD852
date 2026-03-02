import Phaser from 'phaser';
import { NEON } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { VISUAL } from '../config/balance';

const POOL_SIZE = 80; // reduced from 120
const LIGHTNING_POOL_SIZE = 6; // max concurrent lightning bolts
const NAPALM_POOL_SIZE = 4;   // max concurrent napalm zones

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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPool();
    this.initLightningPool();
    this.initNapalmPool();
  }

  private initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const r = this.scene.add
        .rectangle(-100, -100, 6, 6, 0xffffff)
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
  hitSpark(x: number, y: number): void {
    const count = Math.min(VISUAL.PARTICLE.hitSpark, 2);
    const life = VISUAL.ANIM.hitFlashMs * 3;
    for (let i = 0; i < count; i++) {
      const r = this.acquire();
      if (!r) break;
      r.setPosition(x, y).setFillStyle(NEON.PROJECTILE).setSize(3, 3).setAlpha(1).setScale(1);
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
  lightning(x1: number, y1: number, x2: number, y2: number, color = NEON.XP_BAR): void {
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
    g.fillStyle(0xff4400, 0.25);
    g.fillCircle(x, y, radius);
    g.lineStyle(2, 0xff6600, 0.5);
    g.strokeCircle(x, y, radius);
    // Inner fire
    g.fillStyle(0xff8800, 0.15);
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
    g.fillStyle(0xff4400, 0.3);
    g.fillCircle(x, y, radius);
    g.lineStyle(3, 0xff6600, 0.8);
    g.strokeCircle(x, y, radius);
    this.bombLife = 300;
  }

  /** Camera shake */
  screenShake(intensity = 0.003, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
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

  destroy(): void {
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
    for (const r of this.pool) r.destroy();
    this.pool = [];
    this.active = [];
  }
}
