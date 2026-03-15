/**
 * SceneNav — Wraps scene transitions using SceneLifecycleCalc decisions.
 * Determines whether to start/sleep/wake/launch based on scene pair.
 * TASK-029: Wire SceneLifecycleCalc into production code.
 */
import Phaser from 'phaser';
import { getSceneTransition } from '../core/SceneLifecycleCalc';

/**
 * Navigate between scenes using the optimal transition action.
 * @param scene - The current Phaser scene instance
 * @param from - Scene key of the current scene
 * @param to - Scene key of the destination scene
 * @param data - Optional data to pass to the target scene
 */
export function navigateScene(scene: Phaser.Scene, from: string, to: string, data?: object): void {
  const t = getSceneTransition(from, to);

  const doTransition = () => {
    switch (t.action) {
      case 'sleep':
        scene.scene.sleep(from);
        if (scene.scene.isSleeping(to)) {
          scene.scene.wake(to, data);
        } else {
          scene.scene.start(to, data);
        }
        break;
      case 'wake':
        scene.scene.stop(from);
        scene.scene.wake(to, data);
        break;
      case 'launch':
        scene.scene.launch(to, data);
        break;
      case 'stop':
        scene.scene.stop(from);
        break;
      default: // 'start'
        scene.scene.start(to, data);
        break;
    }
  };

  const cam = scene.cameras?.main;
  if (cam && t.action !== 'launch') {
    cam.fadeOut(300, 0, 0, 0);
    cam.once('camerafadeoutcomplete', doTransition);
  } else {
    doTransition();
  }
}
