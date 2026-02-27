import Phaser from 'phaser';
import { ELEMENT_COLORS } from '../config/colors';
import { VISUAL } from '../config/balance';
import type { ElementColor } from '../types/hero';

const POOL_SIZE = VISUAL.PARTICLE.POOL_SIZE;

/**
 * High-level visual effects API with object pooling.
 * Pre-allocates rectangle particles and reuses them to avoid GC pressure.
 */
export class VFXManager {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Rectangle[] = [];
  private activeCount = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPool();
  }

  // ── Pool management ───────────────────────────────────────────────────────

  private initPool(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const r = this.scene.add
        .rectangle(-100, -100, 6, 6, 0xffffff)
        .setVisible(false)
        .setActive(false)
        .setDepth(500);
      this.pool.push(r);
    }
  }

  private acquire(
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    depth = 500
  ): Phaser.GameObjects.Rectangle | null {
    const p = this.pool.pop();
    if (!p) return null; // pool exhausted

    p.setPosition(x, y);
    p.setSize(w, h);
    p.setDisplaySize(w, h);
    p.fillColor = color;
    p.fillAlpha = 1;
    p.setAlpha(1);
    p.setScale(1, 1);
    p.setAngle(0);
    p.setBlendMode(Phaser.BlendModes.NORMAL);
    p.setDepth(depth);
    p.setVisible(true);
    p.setActive(true);
    this.activeCount++;
    return p;
  }

  private release(p: Phaser.GameObjects.Rectangle): void {
    p.setVisible(false);
    p.setActive(false);
    p.setPosition(-100, -100);
    this.pool.push(p);
    this.activeCount--;
  }

  /** Tween helper that auto-releases the particle on complete */
  private tweenParticle(
    p: Phaser.GameObjects.Rectangle,
    config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>
  ): void {
    const origComplete = config.onComplete as
      | ((tween: Phaser.Tweens.Tween, targets: object[]) => void)
      | undefined;

    this.scene.tweens.add({
      ...(config as Phaser.Types.Tweens.TweenBuilderConfig),
      targets: p,
      onComplete: (tween, targets) => {
        origComplete?.(tween, targets);
        this.release(p);
      },
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Element-differentiated burst when a cube is destroyed */
  onCubeDestroy(x: number, y: number, element: ElementColor, matchType?: 'same' | 'advantage'): void {
    const color = ELEMENT_COLORS[element];
    const baseCount = Phaser.Math.Between(
      VISUAL.PARTICLE.MATCH_DESTROY.min,
      VISUAL.PARTICLE.MATCH_DESTROY.max
    );
    const count = matchType === 'advantage' ? baseCount * 2 : baseCount;

    switch (element) {
      case 'fire':
        this.fireBurst(x, y, color, count);
        break;
      case 'water':
        this.waterSplash(x, y, color, count);
        break;
      case 'earth':
        this.earthShatter(x, y, color, count);
        break;
      case 'wind':
        this.windSwirl(x, y, color, count);
        break;
      case 'light':
        this.lightFlash(x, y, count);
        break;
      case 'dark':
        this.darkImplode(x, y, color, count);
        break;
      default:
        this.genericBurst(x, y, color, count);
    }

    if (matchType === 'advantage') {
      // White screen flash
      const flash = this.acquire(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0xffffff,
        1000
      );
      if (flash) {
        flash.setAlpha(0.15);
        this.tweenParticle(flash, {
          alpha: 0,
          duration: 80,
        });
      }

      // "SUPER!" text popup
      const superText = this.scene.add.text(x, y - 40, 'SUPER!', {
        fontSize: '22px',
        color: '#f0d050',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(600);
      this.scene.tweens.add({
        targets: superText,
        y: y - 80,
        alpha: 0,
        scaleX: { from: 0, to: 1.3 },
        scaleY: { from: 0, to: 1.3 },
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => superText.destroy(),
      });
    }
  }

  /** Fire: upward sparks with long trails */
  private fireBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const px = x + Phaser.Math.Between(-8, 8);
      const py = y + Phaser.Math.Between(-4, 4);
      const w = Phaser.Math.Between(3, 5);
      const h = Phaser.Math.Between(6, 12);
      const p = this.acquire(px, py, w, h, color);
      if (!p) return;

      this.tweenParticle(p, {
        x: px + Phaser.Math.Between(-20, 20),
        y: py - Phaser.Math.Between(40, 100),
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(250, 450),
        ease: 'Power2',
      });
    }
  }

  /** Water: radial splash droplets that spread and fall */
  private waterSplash(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.Between(30, 70);
      const size = Phaser.Math.Between(3, 6);
      const p = this.acquire(x, y, size, size, color);
      if (!p) return;

      this.tweenParticle(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 20,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Quad.easeOut',
      });
    }
  }

  /** Earth: heavy rectangular fragments falling down */
  private earthShatter(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const px = x + Phaser.Math.Between(-12, 12);
      const py = y + Phaser.Math.Between(-6, 6);
      const size = Phaser.Math.Between(4, 8);
      const p = this.acquire(px, py, size, size, color);
      if (!p) return;
      p.setAngle(Phaser.Math.Between(0, 45));

      this.tweenParticle(p, {
        x: px + Phaser.Math.Between(-30, 30),
        y: py + Phaser.Math.Between(30, 80),
        angle: p.angle + Phaser.Math.Between(-90, 90),
        alpha: 0,
        duration: Phaser.Math.Between(350, 550),
        ease: 'Bounce.easeOut',
      });
    }
  }

  /** Wind: fast spiral/swirl particles */
  private windSwirl(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const startAngle = (Math.PI * 2 * i) / count;
      const radius = Phaser.Math.Between(10, 20);
      const px = x + Math.cos(startAngle) * radius;
      const py = y + Math.sin(startAngle) * radius;
      const p = this.acquire(px, py, 3, 3, color);
      if (!p) return;

      const endAngle = startAngle + Math.PI * 1.5;
      const endRadius = Phaser.Math.Between(50, 90);

      this.tweenParticle(p, {
        x: x + Math.cos(endAngle) * endRadius,
        y: y + Math.sin(endAngle) * endRadius,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(200, 350),
        ease: 'Cubic.easeOut',
      });
    }
  }

  /** Light: bright flash + radial star rays */
  private lightFlash(x: number, y: number, count: number): void {
    // Central flash (uses pool particle with ADD blend)
    const flash = this.acquire(x, y, 40, 40, 0xffffff, 510);
    if (flash) {
      flash.setAlpha(0.9);
      flash.setBlendMode(Phaser.BlendModes.ADD);
      this.tweenParticle(flash, {
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 200,
        ease: 'Power3',
      });
    }

    // Radial rays
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Phaser.Math.Between(40, 80);
      const p = this.acquire(x, y, 2, Phaser.Math.Between(6, 12), 0xf0f0f0);
      if (!p) return;
      p.setAngle(Phaser.Math.RadToDeg(angle) + 90);
      p.setBlendMode(Phaser.BlendModes.ADD);

      this.tweenParticle(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: Phaser.Math.Between(150, 300),
        ease: 'Power2',
      });
    }
  }

  /** Dark: implosion then explosion */
  private darkImplode(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const startR = Phaser.Math.Between(40, 60);
      const px = x + Math.cos(angle) * startR;
      const py = y + Math.sin(angle) * startR;
      const p = this.acquire(px, py, 5, 5, color);
      if (!p) return;
      p.setAlpha(0.8);

      this.tweenParticle(p, {
        x: x,
        y: y,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 200,
        ease: 'Power3',
      });
    }

    // Phase 2: delayed small burst from center
    this.scene.time.delayedCall(150, () => {
      for (let i = 0; i < 6; i++) {
        const angle2 = (Math.PI * 2 * i) / 6;
        const p2 = this.acquire(x, y, 3, 3, 0x604098);
        if (!p2) return;

        this.tweenParticle(p2, {
          x: x + Math.cos(angle2) * 30,
          y: y + Math.sin(angle2) * 30,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
        });
      }
    });
  }

  /** Generic fallback burst */
  private genericBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const px = x + Phaser.Math.Between(-10, 10);
      const py = y + Phaser.Math.Between(-10, 10);
      const p = this.acquire(px, py, 6, 6, color);
      if (!p) return;

      this.tweenParticle(p, {
        x: px + Phaser.Math.Between(-60, 60),
        y: py + Phaser.Math.Between(-80, 20),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
      });
    }
  }

  /** Combo text pop + radial burst */
  onCombo(x: number, y: number, count: number): void {
    const burstCount = Phaser.Math.Between(
      VISUAL.PARTICLE.COMBO_BURST.min,
      VISUAL.PARTICLE.COMBO_BURST.max
    );
    const comboColor = count >= 4 ? 0xe83820 : count >= 2 ? 0xf8d030 : 0x38b868;

    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount;
      const speed = Phaser.Math.Between(60, 150);
      const p = this.acquire(x, y, 4, 4, comboColor);
      if (!p) return;

      this.tweenParticle(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
      });
    }
  }

  /** Celebration burst for level complete */
  onLevelComplete(centerX: number, centerY: number): void {
    const count = Phaser.Math.Between(
      VISUAL.PARTICLE.CELEBRATION.min,
      VISUAL.PARTICLE.CELEBRATION.max
    );
    const colors = [0xf8d030, 0xe83820, 0x3890f8, 0x38b868, 0x7038c8, 0xf8f0d0];

    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      const px = centerX + Phaser.Math.Between(-200, 200);
      const startY = centerY - 100;
      const w = Phaser.Math.Between(4, 8);
      const h = Phaser.Math.Between(4, 8);
      const p = this.acquire(px, startY, w, h, color, 600);
      if (!p) return;

      this.tweenParticle(p, {
        y: startY + Phaser.Math.Between(200, 500),
        x: px + Phaser.Math.Between(-50, 50),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(600, 1200),
        delay: Phaser.Math.Between(0, 300),
        ease: 'Power1',
      });
    }
  }

  /** Star reveal particles (gold burst) */
  onStarReveal(x: number, y: number): void {
    const count = Phaser.Math.Between(8, 12);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Phaser.Math.Between(30, 80);
      const p = this.acquire(x, y, 5, 5, 0xf8d030, 600);
      if (!p) return;

      this.tweenParticle(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400,
        ease: 'Power2',
      });
    }
  }

  /** Screen shake — intensity scales with combo */
  screenShake(intensity = 4, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
  }

  /** Brief screen flash overlay (combat: enemy attack, player hit) */
  onScreenFlash(color: number, alpha = 0.3): void {
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color, alpha)
      .setDepth(999)
      .setScrollFactor(0);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  /** Shield break flash (combat mode) */
  onShieldBreak(x: number, y: number): void {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = this.acquire(x, y, 3, 8, 0x63b3ed);
      if (!p) break;
      const angle = (i / count) * Math.PI * 2;
      const dist = 40 + Math.random() * 30;
      p.setAngle(Phaser.Math.RadToDeg(angle));
      this.tweenParticle(p, {
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 250,
      });
    }
  }

  /** Player hit indicator (combat mode) */
  onPlayerHit(centerX: number, centerY: number, damage: number): void {
    // Floating damage text
    const text = this.scene.add.text(centerX, centerY - 40, `-${damage}`, {
      fontSize: '24px',
      color: '#e74c3c',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(800);

    this.scene.tweens.add({
      targets: text,
      y: centerY - 100,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    this.screenShake(5, 120);
  }

  /** Floating damage number on enemy (combat mode) */
  onDamageNumber(x: number, y: number, damage: number, color = '#ffffff'): void {
    const text = this.scene.add.text(x, y - 10, `${damage}`, {
      fontSize: '18px',
      color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(800);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /** Enemy defeat burst (combat mode) */
  onEnemyDefeat(x: number, y: number, color: number): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const size = 4 + Math.random() * 4;
      const p = this.acquire(x, y, size, size, color);
      if (!p) break;
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.tweenParticle(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300 + Math.random() * 200,
      });
    }
    this.screenShake(3, 80);
  }

  /** Trail particle behind a moving object */
  emitTrail(x: number, y: number, color: number): void {
    const p = this.acquire(x, y, 4, 4, color, 440);
    if (!p) return;
    p.setAlpha(0.8);

    this.tweenParticle(p, {
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 150,
    });
  }
}
