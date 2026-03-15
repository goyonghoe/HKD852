import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/game-config';

/**
 * Enable vertical drag-scroll on a scene's main camera.
 * Shared utility — replaces duplicate enableDragScroll() in codex/map scenes.
 *
 * @param scene        - The Phaser scene to attach scroll to
 * @param contentHeight - Total world height of scrollable content
 * @param viewportHeight - Visible viewport height (default: GAME_HEIGHT=1280).
 *                        Pass a smaller value when a fixed footer reduces the
 *                        effective scroll area (e.g. GAME_HEIGHT - 80 for Back button).
 */
export function enableDragScroll(
  scene: Phaser.Scene,
  contentHeight: number,
  viewportHeight: number = GAME_HEIGHT,
): void {
  const cam = scene.cameras.main;
  const maxScroll = Math.max(0, contentHeight - viewportHeight);

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.isDown) {
      cam.scrollY -= pointer.velocity.y * 0.02;
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, maxScroll);
    }
  });
}
