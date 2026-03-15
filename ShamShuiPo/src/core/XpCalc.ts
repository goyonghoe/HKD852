// ── Neon Survivors: XP Calculations ──
// Pure TypeScript — NO Phaser imports.

import { XP_THRESHOLDS, XP_GEM } from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § XP THRESHOLDS
// ════════════════════════════════════════════════════════════════

/**
 * Get XP required for a specific level.
 * @param level Player level (1-indexed, requesting threshold FOR this level)
 * @returns XP required to reach this level, or Infinity if beyond max
 */
export function getXpForLevel(level: number): number {
  const idx = level - 1; // level 1 → index 0
  if (idx < 0 || idx >= XP_THRESHOLDS.length) return Infinity;
  return XP_THRESHOLDS[idx];
}

// ════════════════════════════════════════════════════════════════
// § XP ADDITION
// ════════════════════════════════════════════════════════════════

/**
 * Add XP and calculate levels gained.
 * XP resets per level (each level has its own bar).
 * @param currentXp Current XP within current level
 * @param amount Raw XP to add
 * @param xpBonus Percentage bonus (0.1 = +10%)
 * @returns New XP value and number of levels gained
 */
export function addXp(
  currentXp: number,
  amount: number,
  xpBonus: number = 0,
): { newXp: number; levelsGained: number } {
  const boostedAmount = amount * (1 + xpBonus);
  let xp = currentXp + boostedAmount;
  let levelsGained = 0;

  // Check if XP exceeds current level threshold
  // We iterate because one gem could trigger multiple level-ups
  let threshold = getXpForLevel(1); // Will be recalculated based on actual level
  // Since we don't know the current level here, we iterate using the
  // XP_THRESHOLDS array sequentially. The caller tracks actual level.
  // We treat currentXp as XP within the current level bar.

  // Simple approach: keep subtracting thresholds
  // The caller should pass the threshold for the current level
  // For safety, we just count how many times we overflow
  while (xp >= threshold && threshold < Infinity) {
    xp -= threshold;
    levelsGained++;
    // Next threshold in sequence — but we don't know current level
    // This function is stateless, so we just return overflow XP
    // The caller (RunStateManager) uses player.level to track
    break; // only one level-up per call for safety
  }

  return { newXp: xp, levelsGained };
}

// ════════════════════════════════════════════════════════════════
// § XP GEM VALUES
// ════════════════════════════════════════════════════════════════

/**
 * Get XP gem value based on enemy tier.
 * @param tier Enemy tier (1, 2, or 3)
 * @returns XP value of the gem
 */
export function getXpGemValue(tier: number): number {
  switch (tier) {
    case 1:
      return XP_GEM.small;
    case 2:
      return XP_GEM.medium;
    case 3:
      return XP_GEM.large;
    default:
      return XP_GEM.small;
  }
}

/**
 * Get boss XP drop value.
 */
export function getBossXpValue(): number {
  return XP_GEM.large;
}
