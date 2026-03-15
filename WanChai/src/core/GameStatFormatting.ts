/**
 * Pure formatting/calculation helpers for game-over stats display.
 * M-001: No Phaser imports — testable without game engine.
 *
 * Extracted from GameOverScene to enable unit testing and reuse
 * in leaderboard rendering, analytics, etc.
 */

/**
 * Convert milliseconds to "M:SS" display format.
 * Returns "0:00" for non-positive or non-finite input.
 * Examples: 0 -> "0:00", 61000 -> "1:01", 125000 -> "2:05"
 */
export function formatTimeMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const min = Math.floor(totalSecs / 60);
  const sec = totalSecs % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format a number with thousands separators (locale-independent).
 * Returns "0" for non-finite input (NaN, Infinity).
 * Uses en-US style commas: 1234567 -> "1,234,567"
 * Negative numbers retain the minus sign: -1500 -> "-1,500"
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Calculate critical hit rate as a percentage (0-100).
 * Returns 0 when totalHits is 0 (divide-by-zero guard).
 */
export function calculateCritRate(critHits: number, totalHits: number): number {
  if (totalHits <= 0) return 0;
  return Math.round((critHits / totalHits) * 100);
}

/**
 * Calculate a weapon's damage contribution as a percentage (0-100).
 * Returns 0 when totalDmg is 0 (divide-by-zero guard).
 */
export function calculateWeaponDmgPercent(weaponDmg: number, totalDmg: number): number {
  if (totalDmg <= 0) return 0;
  return Math.round((weaponDmg / totalDmg) * 100);
}
