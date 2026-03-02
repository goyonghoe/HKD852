import Phaser from 'phaser';

/**
 * Enable vertical drag-scroll on a scene's main camera.
 * Shared utility — replaces duplicate enableDragScroll() in codex/map scenes.
 */
export function enableDragScroll(scene: Phaser.Scene, contentHeight: number): void {
  const cam = scene.cameras.main;
  const maxScroll = contentHeight - 1280;

  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    if (pointer.isDown) {
      cam.scrollY -= pointer.velocity.y * 0.02;
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, maxScroll);
    }
  });
}
