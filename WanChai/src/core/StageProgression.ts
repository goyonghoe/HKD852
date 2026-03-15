/**
 * Stage progression logic extracted from WorldMapScene.
 * Pure functions — NO Phaser imports (M-001).
 */

/**
 * Determine how many stages have been cleared based on number of completed runs.
 * Each completed run clears all stages (full run = all stages beaten).
 * Zero completed runs means no stages cleared.
 */
export function getMaxClearedStage(runsCompleted: number, maxStages: number): number {
  if (runsCompleted <= 0) return 0;
  return maxStages;
}

/**
 * Get the status of a stage on the world map.
 * @param stageIndex - 0-based stage index
 * @param maxCleared - number of stages cleared (1-based count)
 * @returns 'cleared' if beaten, 'current' if next to play, 'locked' otherwise
 */
export function getStageStatus(stageIndex: number, maxCleared: number): 'cleared' | 'current' | 'locked' {
  const stageNumber = stageIndex + 1; // convert to 1-based
  if (stageNumber <= maxCleared) return 'cleared';
  if (stageNumber === maxCleared + 1) return 'current';
  return 'locked';
}

/**
 * Get the next stage to play (1-based).
 * If all stages are cleared, returns maxStages (the last stage for replay).
 */
export function getNextPlayableStage(maxCleared: number, maxStages: number): number {
  if (maxCleared >= maxStages) return maxStages;
  return maxCleared + 1;
}
