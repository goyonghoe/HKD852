/**
 * Pure spawn pool filtering and selection logic extracted from SpawnManager.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 */

/**
 * Filter an enemy pool by the 'eliteOnly' challenge modifier.
 * Removes T1 basic enemies from the pool.
 *
 * @param fullPool - Complete enemy ID pool for the stage
 * @param modifier - Active challenge modifier (only 'eliteOnly' triggers filtering)
 * @param t1EnemyIds - List of T1 basic enemy IDs to remove
 * @returns Filtered pool (same reference if no filtering needed)
 */
export function filterEnemyPool(
  fullPool: readonly string[],
  modifier: string,
  t1EnemyIds: readonly string[],
): string[] {
  if (modifier !== 'eliteOnly') {
    return [...fullPool];
  }

  const t1Set = new Set(t1EnemyIds);
  const filtered = fullPool.filter((id) => !t1Set.has(id));
  return filtered;
}

/**
 * Validate that a pool is not empty, falling back to a backup pool if needed.
 *
 * @param pool - Primary pool to validate
 * @param fallbackPool - Backup pool used when primary is empty
 * @returns The primary pool if non-empty, otherwise the fallback pool
 */
export function validatePool(pool: readonly string[], fallbackPool: readonly string[]): string[] {
  if (pool.length > 0) {
    return [...pool];
  }
  return [...fallbackPool];
}

/**
 * Calculate which boss to spawn in boss rush mode using cyclic selection.
 *
 * @param timer - Current boss rush accumulated timer (ms)
 * @param interval - Interval between boss spawns (ms)
 * @param bossPool - Array of boss IDs to cycle through
 * @param currentIndex - Current position in the cycle
 * @returns Object with shouldSpawn flag, selected bossId, new timer, and new index
 */
export function calculateBossRushSpawn(
  timer: number,
  interval: number,
  bossPool: readonly string[],
  currentIndex: number,
): { shouldSpawn: boolean; bossId: string; newTimer: number; newIndex: number } {
  if (bossPool.length === 0) {
    return { shouldSpawn: false, bossId: '', newTimer: timer, newIndex: currentIndex };
  }

  if (timer >= interval) {
    const bossId = bossPool[currentIndex % bossPool.length];
    return {
      shouldSpawn: true,
      bossId,
      newTimer: timer - interval,
      newIndex: currentIndex + 1,
    };
  }

  return { shouldSpawn: false, bossId: '', newTimer: timer, newIndex: currentIndex };
}

/**
 * Build a full filtered pool for eliteOnly: filters fullPool, then validates
 * against a non-boss, non-T1 fallback built from allEnemyIds.
 * This is the combined operation used in both create() and resetForStage().
 *
 * @param fullPool - Stage enemy pool
 * @param modifier - Challenge modifier
 * @param t1EnemyIds - T1 enemy IDs to filter out
 * @param allEnemyIds - All known enemy IDs (for fallback construction)
 * @returns Final validated pool
 */
export function buildEliteFilteredPool(
  fullPool: readonly string[],
  modifier: string,
  t1EnemyIds: readonly string[],
  allEnemyIds: readonly string[],
): string[] {
  const filtered = filterEnemyPool(fullPool, modifier, t1EnemyIds);

  if (filtered.length > 0) {
    return filtered;
  }

  // Fallback: all non-boss, non-T1 enemies
  const t1Set = new Set(t1EnemyIds);
  const fallback = allEnemyIds.filter((id) => !id.startsWith('boss') && !t1Set.has(id));
  return validatePool([], fallback);
}
