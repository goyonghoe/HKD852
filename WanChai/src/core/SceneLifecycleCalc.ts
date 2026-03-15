/**
 * SceneLifecycleCalc — Pure TS calculations for scene lifecycle decisions.
 * Determines when to use sleep/wake vs start/stop for scene transitions.
 * No Phaser imports.
 */

export type SceneAction = 'start' | 'launch' | 'sleep' | 'wake' | 'stop';

export interface SceneTransition {
  action: SceneAction;
  target: string;
  preserveState: boolean;
}

/** Scenes that should use sleep/wake pattern (keep state alive) */
const SLEEPABLE_SCENES = new Set(['RunScene']);

/** Overlay scenes that should be launched (not started) */
const OVERLAY_SCENES = new Set(['HUDScene', 'PauseScene']);

/** Scenes where RunScene should sleep instead of stop */
const RUN_SLEEP_TARGETS = new Set(['WeaponCodexScene', 'EnemyCodexScene', 'WorldMapScene', 'MetaScene']);

/**
 * Determine the optimal scene transition action.
 * - RunScene → codex/settings: sleep RunScene, start target
 * - codex → RunScene: stop codex, wake RunScene
 * - Any → GameOver: stop current (RunScene destroyed)
 */
export function getSceneTransition(from: string, to: string): SceneTransition {
  // RunScene going to a menu that should preserve game state
  if (SLEEPABLE_SCENES.has(from) && RUN_SLEEP_TARGETS.has(to)) {
    return { action: 'sleep', target: to, preserveState: true };
  }

  // Returning to a sleeping RunScene
  if (RUN_SLEEP_TARGETS.has(from) && to === 'RunScene') {
    return { action: 'wake', target: to, preserveState: true };
  }

  // Overlay scenes (HUD, Pause) should be launched on top
  if (OVERLAY_SCENES.has(to)) {
    return { action: 'launch', target: to, preserveState: true };
  }

  // Default: full scene transition (destroys previous)
  return { action: 'start', target: to, preserveState: false };
}

/**
 * Check if a scene should be sleepable (state preserved during navigation).
 */
export function isSleepable(sceneName: string): boolean {
  return SLEEPABLE_SCENES.has(sceneName);
}

/**
 * Check if a scene is an overlay (launched on top of another).
 */
export function isOverlay(sceneName: string): boolean {
  return OVERLAY_SCENES.has(sceneName);
}

/**
 * Estimate memory impact of keeping a scene alive via sleep.
 * Returns relative weight (higher = more memory).
 */
export function getSceneMemoryWeight(sceneName: string): number {
  const weights: Record<string, number> = {
    RunScene: 10, // heaviest — enemies, projectiles, particles
    MainMenuScene: 3, // parallax, particles
    GameOverScene: 2,
    MetaScene: 2,
    CharacterSelectScene: 2,
    WeaponCodexScene: 1,
    EnemyCodexScene: 1,
    WorldMapScene: 1,
    PreloadScene: 0,
    BootScene: 0,
  };
  return weights[sceneName] ?? 1;
}
