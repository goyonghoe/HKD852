import Phaser from 'phaser';
import { NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH } from '../config/game-config';

const TYPE_SPEED_MS = 30;    // ms per character
const DISPLAY_MS = 3000;     // total display time after typing finishes
const GLITCH_INTERVAL = 80;  // ms between random glitch char swaps

/**
 * ARIA communication overlay — cyberpunk typewriter text at top of screen.
 * Shows one message at a time with typing effect + glitch noise.
 */
export class ARIAMessage {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private textObj: Phaser.GameObjects.Text;
  private bgRect: Phaser.GameObjects.Rectangle;
  private queue: string[] = [];
  private typing = false;
  private currentFull = '';
  private currentIndex = 0;
  private typeTimer = 0;
  private displayTimer = 0;
  private glitchTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.bgRect = scene.add
      .rectangle(GAME_WIDTH / 2, 110, GAME_WIDTH - 40, 36, NEON.UI_PANEL, 0.85)
      .setStrokeStyle(1, NEON.UI_BORDER);

    this.textObj = scene.add
      .text(GAME_WIDTH / 2, 110, '', {
        fontSize: '14px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0, [this.bgRect, this.textObj])
      .setDepth(1600)
      .setAlpha(0);
  }

  /** Queue a message. Displayed after current one finishes. */
  show(message: string): void {
    this.queue.push(message);
    if (!this.typing && this.container.alpha === 0) {
      this.startNext();
    }
  }

  update(delta: number): void {
    if (this.container.alpha === 0) return;

    // Typing phase
    if (this.typing) {
      this.typeTimer += delta;
      while (this.typeTimer >= TYPE_SPEED_MS && this.currentIndex < this.currentFull.length) {
        this.typeTimer -= TYPE_SPEED_MS;
        this.currentIndex++;
        this.textObj.setText(this.currentFull.substring(0, this.currentIndex));
      }
      if (this.currentIndex >= this.currentFull.length) {
        this.typing = false;
        this.displayTimer = DISPLAY_MS;
        this.textObj.setText(this.currentFull);
      }
      // Glitch effect during typing
      this.glitchTimer += delta;
      if (this.glitchTimer >= GLITCH_INTERVAL) {
        this.glitchTimer = 0;
        this.applyGlitch();
      }
    } else {
      // Display phase — fade after time
      this.displayTimer -= delta;
      if (this.displayTimer <= 0) {
        this.container.setAlpha(0);
        if (this.queue.length > 0) {
          this.startNext();
        }
      } else if (this.displayTimer < 500) {
        this.container.setAlpha(this.displayTimer / 500);
      }
    }
  }

  destroy(): void {
    this.container.destroy();
  }

  private startNext(): void {
    const msg = this.queue.shift();
    if (!msg) return;
    this.currentFull = msg;
    this.currentIndex = 0;
    this.typing = true;
    this.typeTimer = 0;
    this.glitchTimer = 0;
    this.textObj.setText('');
    this.container.setAlpha(1);
  }

  private applyGlitch(): void {
    if (!this.typing || this.currentIndex < 2) return;
    // Briefly show a glitch character, then revert
    const chars = '!@#$%^&*░▒▓█';
    const idx = Math.floor(Math.random() * this.currentIndex);
    const original = this.currentFull.substring(0, this.currentIndex);
    const glitched = original.substring(0, idx) +
      chars[Math.floor(Math.random() * chars.length)] +
      original.substring(idx + 1);
    this.textObj.setText(glitched);
    this.scene.time.delayedCall(40, () => {
      if (this.typing) {
        this.textObj.setText(this.currentFull.substring(0, this.currentIndex));
      }
    });
  }
}
