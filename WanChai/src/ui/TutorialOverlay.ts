import Phaser from 'phaser';
import { NEON, NEON_CSS, UI_CSS } from '../config/colors';
import { SaveManager } from '../managers/SaveManager';
import { t } from '../lib/i18n';
import {
  getTutorialSteps,
  createTutorialState,
  processTutorialEvent,
  type TutorialHint,
  type TutorialState,
  type TutorialEvent,
} from '../core/TutorialHintCalc';

/**
 * 4-step progressive tutorial overlay — event-driven, non-blocking.
 *
 * Steps:
 *   1. Movement (timer 0.5s) — dismiss on drag or 5s timeout
 *   2. Weapons (first kill) — dismiss on 4 kills or 5s timeout
 *   3. Level Up (levelup phase) — dismiss on phase exit or 8s timeout
 *   4. Supply Point (shop phase) — dismiss on phase exit or 6s timeout
 *
 * No input blocking. No dimming. Gameplay continues underneath.
 */
export class TutorialOverlay {
  private scene: Phaser.Scene;
  private destroyed = false;
  private state: TutorialState;
  private steps: TutorialHint[];
  private activeContainer: Phaser.GameObjects.Container | null = null;
  private timeoutTimer: Phaser.Time.TimerEvent | null = null;
  private timerCheckEvent: Phaser.Time.TimerEvent | null = null;
  private elapsedMs = 0;
  private step1TimerFired = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = createTutorialState();
    this.steps = getTutorialSteps();

    // Step 1 is timer-triggered: schedule check at 500ms
    this.timerCheckEvent = scene.time.delayedCall(500, () => {
      if (this.destroyed) return;
      this.step1TimerFired = true;
      this.elapsedMs = 500;
      this.handleEvent({ type: 'timer_elapsed', elapsedMs: 500 });
    });
  }

  /** Called by RunScene when an enemy is killed. */
  onEnemyKilled(): void {
    if (this.destroyed) return;
    this.handleEvent({ type: 'enemy_killed' });
  }

  /** Called by RunScene when game phase changes (playing, levelup, shop, etc). */
  onPhaseChange(phase: string): void {
    if (this.destroyed) return;
    this.handleEvent({ type: 'phase_change', phase });
  }

  /** Called by RunScene when player drags horizontally (>30px). */
  onDragHorizontal(): void {
    if (this.destroyed) return;
    this.handleEvent({ type: 'drag_horizontal' });
  }

  private handleEvent(event: TutorialEvent): void {
    const actions = processTutorialEvent(this.state, this.steps, event);

    for (const action of actions) {
      switch (action.type) {
        case 'show_hint':
          this.showHint(this.steps[action.stepIndex!]);
          break;
        case 'dismiss_hint':
          this.dismissActiveHint();
          break;
        case 'complete':
          this.completeTutorial();
          break;
      }
    }
  }

  private showHint(hint: TutorialHint): void {
    // Clean up any previous hint
    this.dismissActiveHintImmediate();

    const container = this.scene.add.container(0, 0).setDepth(hint.depth).setAlpha(0);

    // Primary text
    const textColor = hint.accentColor ? NEON_CSS.UI_ACCENT : UI_CSS.TEXT_WHITE;
    const primaryText = this.scene.add
      .text(hint.x, hint.y, t(hint.key), {
        fontSize: '28px',
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
        stroke: UI_CSS.STROKE_BLACK,
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add(primaryText);

    // Secondary text (if any)
    if (hint.key2) {
      const secondaryText = this.scene.add
        .text(hint.x, hint.y + 36, t(hint.key2), {
          fontSize: '28px',
          color: UI_CSS.TEXT_WHITE,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          align: 'center',
          stroke: UI_CSS.STROKE_BLACK,
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      container.add(secondaryText);
    }

    // Arrows
    if (hint.showArrows) {
      if (hint.arrowDirection === 'left-right') {
        this.addLeftRightArrows(container, hint.x, hint.y);
      } else if (hint.arrowDirection === 'down') {
        this.addDownArrow(container, hint.x, hint.key2 ? hint.y + 70 : hint.y + 40);
      }
    }

    // Fade in
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Quad.Out',
    });

    this.activeContainer = container;

    // Auto-dismiss timeout
    this.timeoutTimer = this.scene.time.delayedCall(hint.timeoutMs, () => {
      if (this.destroyed) return;
      this.handleEvent({ type: 'hint_timeout' });
    });
  }

  private addLeftRightArrows(container: Phaser.GameObjects.Container, cx: number, ay: number): void {
    const arrows = this.scene.add.graphics();

    // Left arrow
    arrows.lineStyle(4, NEON.UI_ACCENT, 0.9);
    arrows.lineBetween(cx - 80, ay, cx - 140, ay);
    arrows.lineBetween(cx - 140, ay, cx - 120, ay - 15);
    arrows.lineBetween(cx - 140, ay, cx - 120, ay + 15);

    // Right arrow
    arrows.lineBetween(cx + 80, ay, cx + 140, ay);
    arrows.lineBetween(cx + 140, ay, cx + 120, ay - 15);
    arrows.lineBetween(cx + 140, ay, cx + 120, ay + 15);

    container.add(arrows);

    this.scene.tweens.add({
      targets: arrows,
      alpha: { from: 0.4, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private addDownArrow(container: Phaser.GameObjects.Container, cx: number, topY: number): void {
    const arrows = this.scene.add.graphics();
    const ay = topY;

    arrows.lineStyle(4, NEON.UI_ACCENT, 0.9);
    arrows.lineBetween(cx, ay, cx, ay + 30);
    arrows.lineBetween(cx, ay + 30, cx - 10, ay + 20);
    arrows.lineBetween(cx, ay + 30, cx + 10, ay + 20);

    container.add(arrows);

    // Bounce animation
    this.scene.tweens.add({
      targets: arrows,
      y: { from: 0, to: 8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private dismissActiveHint(): void {
    if (!this.activeContainer) return;

    if (this.timeoutTimer) {
      this.timeoutTimer.destroy();
      this.timeoutTimer = null;
    }

    const container = this.activeContainer;
    this.activeContainer = null;

    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 400,
      ease: 'Quad.Out',
      onComplete: () => container.destroy(),
    });
  }

  private dismissActiveHintImmediate(): void {
    if (this.timeoutTimer) {
      this.timeoutTimer.destroy();
      this.timeoutTimer = null;
    }
    if (this.activeContainer) {
      this.activeContainer.destroy();
      this.activeContainer = null;
    }
  }

  private completeTutorial(): void {
    SaveManager.setTutorialCompleted();
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  get isCompleted(): boolean {
    return this.state.completed;
  }

  get currentStepIndex(): number {
    return this.state.currentStep;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.dismissActiveHintImmediate();
    if (this.timerCheckEvent) {
      this.timerCheckEvent.destroy();
      this.timerCheckEvent = null;
    }
    if (!this.state.completed) {
      SaveManager.setTutorialCompleted();
    }
  }
}
