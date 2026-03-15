/**
 * DPI-aware scaling utilities for multi-resolution support.
 *
 * Phaser's Scale.FIT + CENTER_BOTH handles canvas sizing automatically,
 * but game logic may need to convert between design pixels (dp) and
 * physical pixels for touch targets and UI sizing.
 *
 * Base design resolution: 1280x720 (16:9 landscape).
 */

/** Minimum touch target size in design pixels (dp) per platform guidelines */
export const MIN_TOUCH_TARGET_DP = 48;

/**
 * Base design resolution — must match GAME_WIDTH/GAME_HEIGHT in game-config.ts.
 * Defined here (not imported) to keep this module free of Phaser dependencies,
 * making it testable in Node without a browser environment.
 */
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

/**
 * Calculate the current DPI scale factor.
 * Returns window.devicePixelRatio when available, 1.0 otherwise.
 */
export function getDpiScale(): number {
  if (typeof window !== 'undefined' && window.devicePixelRatio) {
    return window.devicePixelRatio;
  }
  return 1.0;
}

/**
 * Convert design pixels to physical pixels at the current DPI.
 */
export function dpToPhysical(dp: number): number {
  return dp * getDpiScale();
}

/**
 * Check if a UI element meets the minimum touch target size
 * in design pixels (48dp).
 */
export function meetsTouchTarget(widthDp: number, heightDp: number): boolean {
  return widthDp >= MIN_TOUCH_TARGET_DP && heightDp >= MIN_TOUCH_TARGET_DP;
}

/**
 * Calculate the scale factor from the base design resolution
 * to the actual viewport size.
 *
 * Uses FIT mode logic: scale to fit while maintaining aspect ratio.
 */
export function getViewportScaleFactor(viewportWidth: number, viewportHeight: number): number {
  const scaleX = viewportWidth / BASE_WIDTH;
  const scaleY = viewportHeight / BASE_HEIGHT;
  return Math.min(scaleX, scaleY);
}

/**
 * Calculate the effective game area dimensions after FIT scaling.
 * Returns the actual pixel dimensions of the game canvas.
 */
export function getEffectiveGameSize(viewportWidth: number, viewportHeight: number): { width: number; height: number } {
  const scale = getViewportScaleFactor(viewportWidth, viewportHeight);
  return {
    width: Math.floor(BASE_WIDTH * scale),
    height: Math.floor(BASE_HEIGHT * scale),
  };
}
