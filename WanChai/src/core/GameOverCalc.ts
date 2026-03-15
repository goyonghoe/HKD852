/**
 * Pure calculation helpers for the game-over screen layout and logic.
 * M-001: No Phaser imports — testable without game engine.
 * M-002: No magic numbers — all thresholds are explicit parameters or documented constants.
 *
 * Extracted from GameOverScene to enable unit testing and reuse.
 */

/**
 * Calculate vertical spacing between stat lines based on how many stats
 * need to fit on screen.
 *
 * - >10 stats → compact (36px)
 * - >7 stats  → medium (42px)
 * - otherwise → comfortable (55px)
 */
export function calculateStatSpacing(statCount: number): number {
  if (statCount > 10) return 22;
  if (statCount > 7) return 26;
  return 30;
}

/**
 * Determine whether a leaderboard entry matches the current run by comparing
 * kills, timeMs, and level exactly.
 */
export function isCurrentRunMatch(
  entry: { kills: number; timeMs: number; level: number },
  run: { kills: number; timeMs: number; level: number },
): boolean {
  return entry.kills === run.kills && entry.timeMs === run.timeMs && entry.level === run.level;
}

/**
 * Sort a weapon-damage map by damage descending and return the top N entries.
 */
export function sortWeaponsByDamage(weaponMap: Record<string, number>, limit: number): [string, number][] {
  return Object.entries(weaponMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Calculate base HP remaining as an integer percentage (0–100).
 * Returns 0 when maxHp is non-positive (divide-by-zero guard).
 */
export function calculateBaseHpPercent(remaining: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((remaining / maxHp) * 100)));
}

/**
 * Calculate the Y position for game-over action buttons.
 *
 * In normal mode, returns a fixed default Y (880).
 * In challenge mode, computes the Y based on stat area, new-record banner,
 * achievement notifications, and leaderboard height — with a minimum of 880.
 */
export function calculateButtonBaseY(params: {
  challengeMode: boolean;
  statStartY: number;
  statsCount: number;
  statSpacing: number;
  isNewRecord: boolean;
  achievementCount: number;
  leaderboardHeight: number;
  defaultY?: number;
}): number {
  const defaultY = params.defaultY ?? 520;
  if (!params.challengeMode) return defaultY;

  const statsEnd = params.statStartY + params.statsCount * params.statSpacing;
  const recordGap = params.isNewRecord ? 70 : 30;
  const achieveGap = params.achievementCount > 0 ? params.achievementCount * 40 + 10 : 0;

  return Math.min(
    Math.max(defaultY, statsEnd + recordGap + achieveGap + params.leaderboardHeight + 20),
    GAME_HEIGHT_REF - 180,
  );
}

/** Reference game height for clamping — matches GAME_HEIGHT from game-config */
const GAME_HEIGHT_REF = 720;

/**
 * Calculate the Y position for achievement notification text.
 */
export function calculateAchievementNotifyY(
  statStartY: number,
  statsCount: number,
  statSpacing: number,
  isNewRecord: boolean,
): number {
  return statStartY + statsCount * statSpacing + (isNewRecord ? 60 : 20);
}

/**
 * Check which stats set new records compared to previous bests.
 * A new record requires the current value to be strictly greater than the best.
 */
export function checkNewRecords(
  stats: { kills: number; level: number; timeMs: number },
  best: { bestKills: number; bestLevel: number; bestTimeMs: number },
): { isNewRecord: boolean; fields: string[] } {
  const fields: string[] = [];

  if (stats.kills > best.bestKills) fields.push('kills');
  if (stats.level > best.bestLevel) fields.push('level');
  if (stats.timeMs > best.bestTimeMs) fields.push('timeMs');

  return { isNewRecord: fields.length > 0, fields };
}
