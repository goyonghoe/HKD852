import Phaser from 'phaser';
import { NEON_CSS } from '../config/colors';

const POOL_SIZE = 20;
const FLOAT_SPEED = 80; // px/s upward
const LIFE_MS = 600;

interface ActiveNumber {
  text: Phaser.GameObjects.Text;
  life: number;
}

/**
 * Pooled floating damage numbers.
 * Shows damage dealt at enemy position, floats up and fades out.
 */
export class DamageNumberManager {
  private pool: Phaser.GameObjects.Text[] = [];
  private active: ActiveNumber[] = [];
  private poolHead = 0;

  constructor(private scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const t = scene.add
        .text(-100, -100, '', {
          fontSize: '22px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(600)
        .setVisible(false);
      this.pool.push(t);
    }
  }

  show(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.acquire();
    if (!text) return;

    text.setText(String(Math.round(damage)));
    text.setPosition(x + (Math.random() - 0.5) * 20, y - 10);
    text.setAlpha(1);

    if (isCrit) {
      text.setFontSize(34);
      text.setColor(NEON_CSS.GOLD);
    } else {
      text.setFontSize(22);
      text.setColor(NEON_CSS.UI_TEXT);
    }

    this.active.push({ text, life: LIFE_MS });
  }

  update(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i];
      entry.life -= delta;
      if (entry.life <= 0) {
        this.release(entry.text);
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        continue;
      }
      const t = entry.life / LIFE_MS;
      entry.text.y -= FLOAT_SPEED * dt;
      entry.text.setAlpha(t);
    }
  }

  destroy(): void {
    for (const t of this.pool) t.destroy();
    this.pool = [];
    this.active = [];
  }

  private acquire(): Phaser.GameObjects.Text | null {
    for (let i = 0; i < POOL_SIZE; i++) {
      const idx = (this.poolHead + i) % POOL_SIZE;
      const t = this.pool[idx];
      if (!t.visible) {
        t.setVisible(true);
        this.poolHead = (idx + 1) % POOL_SIZE;
        return t;
      }
    }
    return null;
  }

  private release(t: Phaser.GameObjects.Text): void {
    t.setVisible(false).setPosition(-100, -100);
  }
}
