import Phaser from 'phaser';
import { gameConfig } from './config/game-config';

interface VQAState {
  activeScene: string;
  phase: string | null;
  stage: number | null;
  hp: number | null;
  kills: number | null;
  level: number | null;
  bossAlive: boolean | null;
  enemies: number | null;
}

declare global {
  interface Window {
    __PHASER_GAME__?: Phaser.Game;
    __VQA_STATE__?: () => VQAState;
    __VQA_CLICK__?: (x: number, y: number) => void;
    __VQA_GOTO__?: (sceneName: string, data?: Record<string, unknown>) => void;
    __VQA_WAIT_SCENE__?: (sceneName: string, timeoutMs?: number) => Promise<void>;
  }
}

const game = new Phaser.Game(gameConfig);

// Expose for debugging in dev mode
if (import.meta.env.DEV) {
  window.__PHASER_GAME__ = game;

  /**
   * Returns current game state snapshot for E2E test inspection.
   */
  window.__VQA_STATE__ = (): VQAState => {
    const scenes = game.scene.getScenes(true);
    const active = scenes.length > 0 ? scenes[0] : null;
    const activeKey = active?.scene.key ?? 'none';

    const result: VQAState = {
      activeScene: activeKey,
      phase: null,
      stage: null,
      hp: null,
      kills: null,
      level: null,
      bossAlive: null,
      enemies: null,
    };

    if (activeKey === 'RunScene' && active) {
      const rs = active as any;
      result.phase = rs.phaseManager?.current ?? null;
      result.stage = rs.runState?.stage ?? null;
      result.hp = rs.runState?.baseHp ?? null;
      result.kills = rs.runState?.kills ?? null;
      result.level = rs.runState?.playerLevel ?? null;
      result.bossAlive = rs.activeBoss !== undefined ? rs.activeBoss !== null : null;
      result.enemies = rs.enemyGroup?.getLength?.() ?? null;
    }

    return result;
  };

  /**
   * Dispatches a pointer click at game-coordinate (x, y) in the 1280x720 design space.
   * Handles Phaser.Scale.FIT + CENTER_BOTH coordinate transformation.
   */
  window.__VQA_CLICK__ = (x: number, y: number): void => {
    const canvas = game.canvas;
    const sm = game.scale;

    // Compute the scale factor and offset applied by FIT + CENTER_BOTH
    const displaySize = sm.displaySize;
    const canvasWidth = displaySize.width;
    const canvasHeight = displaySize.height;

    const scaleX = canvasWidth / sm.gameSize.width;
    const scaleY = canvasHeight / sm.gameSize.height;

    // Canvas may be offset within the parent (centering)
    const rect = canvas.getBoundingClientRect();
    const offsetX = rect.left;
    const offsetY = rect.top;

    // Transform game coords → page coords
    const pageX = offsetX + x * scaleX;
    const pageY = offsetY + y * scaleY;

    const eventInit: PointerEventInit = {
      clientX: pageX,
      clientY: pageY,
      bubbles: true,
      pointerId: 1,
      pointerType: 'mouse',
    };

    canvas.dispatchEvent(new PointerEvent('pointerdown', eventInit));
    canvas.dispatchEvent(new PointerEvent('pointerup', eventInit));
  };

  /**
   * Navigate to a scene directly (bypasses UI clicks).
   * Finds the currently active scene and calls scene.start() from it.
   */
  window.__VQA_GOTO__ = (sceneName: string, data?: Record<string, unknown>): void => {
    const scenes = game.scene.getScenes(true);
    if (scenes.length > 0) {
      scenes[0].scene.start(sceneName, data);
    }
  };

  /**
   * Returns a Promise that resolves when the specified scene becomes active.
   * Rejects on timeout (default 10000ms).
   */
  window.__VQA_WAIT_SCENE__ = (sceneName: string, timeoutMs = 10000): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      // Check if already active
      const scenes = game.scene.getScenes(true);
      if (scenes.some((s) => s.scene.key === sceneName)) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        game.events.off('step', check);
        reject(new Error(`__VQA_WAIT_SCENE__: timeout waiting for "${sceneName}" after ${timeoutMs}ms`));
      }, timeoutMs);

      const check = () => {
        const active = game.scene.getScenes(true);
        if (active.some((s) => s.scene.key === sceneName)) {
          clearTimeout(timer);
          game.events.off('step', check);
          resolve();
        }
      };

      game.events.on('step', check);
    });
  };
}
