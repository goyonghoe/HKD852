// ── Neon Survivors: Drop Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type DropType = "coin" | "health" | "magnet_burst";

export interface DropResult {
  type: DropType;
  value: number; // coin amount, heal amount, or magnet radius multiplier
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Base coin drop chance per tier (1-indexed: fodder/mid/elite) */
const COIN_CHANCE: Record<number, number> = { 1: 0.3, 2: 0.5, 3: 0.8 };

/** Coin value per tier */
const COIN_VALUE: Record<number, number | [number, number]> = {
  1: 1,
  2: [2, 3], // random range
  3: 5,
};
const BOSS_COIN_VALUE = 50;

/** Health drop heal values per tier */
const HEAL_VALUE: Record<number, number> = { 1: 5, 2: 10, 3: 20 };
const BOSS_HEAL_VALUE = 50;

/** HP threshold below which health drops can appear */
const HEALTH_DROP_HP_THRESHOLD = 0.4;

/** Max health drop chance multiplier */
const HEALTH_DROP_MAX_CHANCE = 0.15;

/** Magnet burst chance for tier 3+ / boss */
const MAGNET_CHANCE = 0.05;
const MAGNET_RADIUS_MULTIPLIER = 3;

// ════════════════════════════════════════════════════════════════
// § DROP CALCULATION
// ════════════════════════════════════════════════════════════════

/**
 * Calculate what an enemy drops on death.
 * Always drops XP (handled elsewhere). This calculates bonus drops.
 *
 * @param enemyTier 1-3 (fodder/mid/elite)
 * @param isBoss whether this is a boss enemy
 * @param playerHpRatio current HP / maxHP (0 to 1)
 * @returns array of drops (can be empty)
 */
export function calculateDrops(
  enemyTier: number,
  isBoss: boolean,
  playerHpRatio: number,
): DropResult[] {
  const drops: DropResult[] = [];

  // ── Coins ──
  const coinChance = isBoss ? 1 : (COIN_CHANCE[enemyTier] ?? 0);
  if (Math.random() < coinChance) {
    let value: number;
    if (isBoss) {
      value = BOSS_COIN_VALUE;
    } else {
      const raw = COIN_VALUE[enemyTier] ?? 1;
      if (Array.isArray(raw)) {
        value = raw[0] + Math.floor(Math.random() * (raw[1] - raw[0] + 1));
      } else {
        value = raw;
      }
    }
    drops.push({ type: "coin", value });
  }

  // ── Health ──
  if (playerHpRatio < HEALTH_DROP_HP_THRESHOLD) {
    const healthChance = (1 - playerHpRatio) * HEALTH_DROP_MAX_CHANCE;
    if (Math.random() < healthChance) {
      const healValue = isBoss ? BOSS_HEAL_VALUE : (HEAL_VALUE[enemyTier] ?? 5);
      drops.push({ type: "health", value: healValue });
    }
  }

  // ── Magnet burst (tier 3+ and bosses only) ──
  if (enemyTier >= 3 || isBoss) {
    if (Math.random() < MAGNET_CHANCE) {
      drops.push({ type: "magnet_burst", value: MAGNET_RADIUS_MULTIPLIER });
    }
  }

  return drops;
}
