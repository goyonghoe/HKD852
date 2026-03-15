/**
 * Pure geometry/math helpers for UI layout (M-001: no Phaser imports).
 * All functions are stateless and testable without game engine.
 *
 * segmentLayout — wired into PauseOverlay.ts and SettingsOverlay.ts.
 * fitInBounds, isWithinViewport, roundedRectPoints — utility functions
 * for future panel layout validation.
 *
 * TASK-108: findActiveLevel, shouldAutoMute, shouldAutoUnmute —
 *   audio toggle logic extracted from PauseOverlay / SettingsOverlay.
 * TASK-110: calculateProgressFraction, calculateProgressFillWidth —
 *   progress bar logic extracted from MetaScene.
 */

/**
 * Clamp an element's X position so it stays within a container.
 * Returns the clamped X. If element width exceeds container, centers it.
 */
export function fitInBounds(x: number, width: number, containerWidth: number): number {
  if (width >= containerWidth) {
    // Element is wider than container: center it
    return (containerWidth - width) / 2;
  }
  if (x < 0) return 0;
  if (x + width > containerWidth) return containerWidth - width;
  return x;
}

/**
 * Compute positions for a row of equal-width segments (e.g., volume bars).
 * Returns an array of { x, width } for each segment.
 *
 * If total width exceeds available space, still computes positions
 * (caller should check for overflow via returned rightEdge).
 */
export function segmentLayout(
  count: number,
  segWidth: number,
  gap: number,
  startX: number,
): { x: number; width: number }[] {
  if (count <= 0) return [];
  const result: { x: number; width: number }[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      x: startX + i * (segWidth + gap),
      width: segWidth,
    });
  }
  return result;
}

/**
 * Check whether a rectangle is fully within a viewport.
 * All coordinates assume (0,0) top-left.
 */
export function isWithinViewport(x: number, y: number, w: number, h: number, vpW: number, vpH: number): boolean {
  return x >= 0 && y >= 0 && x + w <= vpW && y + h <= vpH;
}

/**
 * Calculate corner points for a rounded rectangle.
 * Returns 4 corner arcs as arrays of [centerX, centerY] pairs.
 * Radius is clamped to half the minimum dimension.
 */
export function roundedRectPoints(x: number, y: number, w: number, h: number, radius: number): { corners: number[][] } {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  return {
    corners: [
      [x + r, y + r], // top-left
      [x + w - r, y + r], // top-right
      [x + w - r, y + h - r], // bottom-right
      [x + r, y + h - r], // bottom-left
    ],
  };
}

// =======================================================================
// TASK-108: Audio toggle logic (extracted from PauseOverlay / SettingsOverlay)
// =======================================================================

/**
 * Find the index in `levels` where `levels[i] >= currentVolume`.
 * If no match found, returns the last valid index (`levels.length - 1`).
 * For empty arrays, returns -1.
 *
 * Source: PauseOverlay:199-200, SettingsOverlay:207-208
 */
export function findActiveLevel(levels: number[], currentVolume: number): number {
  if (levels.length === 0) return -1;
  const idx = levels.findIndex((v) => v >= currentVolume);
  return idx < 0 ? levels.length - 1 : idx;
}

/**
 * Returns true if volume is 0 AND not currently muted (should auto-mute).
 *
 * Source: PauseOverlay:239-240, SettingsOverlay:257-258
 */
export function shouldAutoMute(volume: number, currentlyMuted: boolean): boolean {
  return volume === 0 && !currentlyMuted;
}

/**
 * Returns true if volume > 0 AND currently muted (should auto-unmute).
 *
 * Source: PauseOverlay:232-233, SettingsOverlay:250-251
 */
export function shouldAutoUnmute(volume: number, currentlyMuted: boolean): boolean {
  return volume > 0 && currentlyMuted;
}

// =======================================================================
// TASK-110: Progress bar logic (extracted from MetaScene)
// =======================================================================

/**
 * Calculate progress as a fraction [0..1].
 * If target <= 0, returns 0 to avoid division by zero.
 * Capped at 1 to prevent overflow.
 *
 * Source: MetaScene:415
 */
export function calculateProgressFraction(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(current / target, 1));
}

/**
 * Calculate the pixel width of a progress bar fill.
 * Returns 0 when fraction <= 0.
 * Otherwise returns at least `minWidth` (default 4) to ensure visibility.
 *
 * Source: MetaScene:417
 */
export function calculateProgressFillWidth(fraction: number, barWidth: number, minWidth?: number): number {
  if (fraction <= 0) return 0;
  return Math.max(barWidth * fraction, minWidth ?? 4);
}
