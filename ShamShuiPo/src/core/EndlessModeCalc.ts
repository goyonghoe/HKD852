// ── Neon Survivors: Endless Mode Calculations ──
// Pure TypeScript — NO Phaser imports.
// Scaling logic for endless/survival mode beyond the standard 10-minute run.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface EndlessConfig {
  baseHpMultiplier: number;
  baseDamageMultiplier: number;
  baseSpeedMultiplier: number;
  spawnRateMultiplier: number;
  minutesPassed: number;
  bossesDefeated: number;
}

export interface EndlessReward {
  coins: number;
  diamonds: number;
  bonusXp: number;
  rank: string;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Endless mode begins after minute 10. */
const ENDLESS_START_MINUTE = 10;

/** Per-minute scaling rates (applied beyond minute 10). */
const HP_SCALE_PER_MINUTE = 0.15;
const DAMAGE_SCALE_PER_MINUTE = 0.1;
const SPEED_SCALE_PER_MINUTE = 0.05;
const SPAWN_SCALE_PER_MINUTE = 0.08;

/** Speed multiplier hard cap. */
const SPEED_CAP = 3.0;

/** Rank thresholds (minutes survived). */
const RANK_THRESHOLDS: readonly { min: number; rank: string }[] = [
  { min: 40, rank: "Legend" },
  { min: 30, rank: "Master" },
  { min: 25, rank: "Diamond" },
  { min: 20, rank: "Gold" },
  { min: 15, rank: "Silver" },
  { min: 0, rank: "Bronze" },
];

/** Diamond milestone minutes and their reward descriptions. */
const MILESTONES: readonly {
  minute: number;
  reward: string;
  diamonds: number;
}[] = [
  { minute: 15, reward: "Silver Crate — 5 diamonds", diamonds: 5 },
  { minute: 20, reward: "Gold Crate — 15 diamonds", diamonds: 15 },
  { minute: 30, reward: "Diamond Crate — 50 diamonds", diamonds: 50 },
  { minute: 40, reward: "Legend Trophy — 100 diamonds", diamonds: 100 },
];

/** Unlock requirements. */
const UNLOCK_MIN_RUNS = 5;
const UNLOCK_MIN_SCORE = 5000;

// ════════════════════════════════════════════════════════════════
// § SCALING
// ════════════════════════════════════════════════════════════════

/**
 * Get endless-mode scaling multipliers for a given minute.
 * Before minute 10, all multipliers are 1.0 (no endless scaling).
 * Beyond minute 10: HP +15%/min, damage +10%/min, speed +5%/min (capped 3x),
 * spawn rate +8%/min.
 */
export function getEndlessScaling(minutesPassed: number): EndlessConfig {
  const clamped = Math.max(minutesPassed, 0);
  const endlessMinutes = Math.max(clamped - ENDLESS_START_MINUTE, 0);

  return {
    baseHpMultiplier: 1 + endlessMinutes * HP_SCALE_PER_MINUTE,
    baseDamageMultiplier: 1 + endlessMinutes * DAMAGE_SCALE_PER_MINUTE,
    baseSpeedMultiplier: Math.min(
      1 + endlessMinutes * SPEED_SCALE_PER_MINUTE,
      SPEED_CAP,
    ),
    spawnRateMultiplier: 1 + endlessMinutes * SPAWN_SCALE_PER_MINUTE,
    minutesPassed: clamped,
    bossesDefeated: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § ENEMY STAT HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Apply endless HP scaling to a base HP value.
 */
export function getEndlessEnemyHp(baseHp: number, minute: number): number {
  const scaling = getEndlessScaling(minute);
  return Math.round(baseHp * scaling.baseHpMultiplier);
}

/**
 * Apply endless damage scaling to a base damage value.
 */
export function getEndlessEnemyDamage(baseDmg: number, minute: number): number {
  const scaling = getEndlessScaling(minute);
  return Math.round(baseDmg * scaling.baseDamageMultiplier);
}

/**
 * Apply endless spawn-rate scaling to a base rate.
 * Higher return = more enemies per second.
 */
export function getEndlessSpawnRate(baseRate: number, minute: number): number {
  const scaling = getEndlessScaling(minute);
  return baseRate * scaling.spawnRateMultiplier;
}

// ════════════════════════════════════════════════════════════════
// § REWARDS
// ════════════════════════════════════════════════════════════════

/**
 * Calculate rewards for an endless run.
 * Coins scale linearly with time and kills.
 * Diamonds awarded at milestones (15, 20, 30, 40 min).
 * Rank determined by survival time.
 */
export function calculateEndlessReward(
  minutesSurvived: number,
  kills: number,
  bossesDefeated: number,
): EndlessReward {
  const clamped = Math.max(minutesSurvived, 0);

  // Coins: base from time + bonus per kill + boss bonus
  const timeCoins = clamped * 10;
  const killCoins = kills * 2;
  const bossCoins = bossesDefeated * 50;
  const coins = timeCoins + killCoins + bossCoins;

  // Diamonds: sum of all reached milestones
  const diamonds = MILESTONES.filter((m) => clamped >= m.minute).reduce(
    (sum, m) => sum + m.diamonds,
    0,
  );

  // Bonus XP scales with time beyond 10 min
  const endlessMinutes = Math.max(clamped - ENDLESS_START_MINUTE, 0);
  const bonusXp = endlessMinutes * 50 + bossesDefeated * 100;

  const rank = getEndlessRank(clamped);

  return { coins, diamonds, bonusXp, rank };
}

// ════════════════════════════════════════════════════════════════
// § RANK
// ════════════════════════════════════════════════════════════════

/**
 * Get the endless rank based on survival time.
 * Bronze (<15), Silver (15-19), Gold (20-24), Diamond (25-29),
 * Master (30-39), Legend (40+).
 */
export function getEndlessRank(minutesSurvived: number): string {
  const clamped = Math.max(minutesSurvived, 0);
  for (const threshold of RANK_THRESHOLDS) {
    if (clamped >= threshold.min) return threshold.rank;
  }
  return "Bronze";
}

// ════════════════════════════════════════════════════════════════
// § MILESTONES
// ════════════════════════════════════════════════════════════════

/**
 * Get the next upcoming milestone and its reward description.
 * Returns the first milestone whose minute > minutesPassed.
 * If all milestones are passed, returns the last one with "(completed)" suffix.
 */
export function getNextMilestone(minutesPassed: number): {
  minute: number;
  reward: string;
} {
  const clamped = Math.max(minutesPassed, 0);
  const next = MILESTONES.find((m) => m.minute > clamped);
  if (next) return { minute: next.minute, reward: next.reward };

  // All milestones completed — return last one
  const last = MILESTONES[MILESTONES.length - 1];
  return { minute: last.minute, reward: `${last.reward} (completed)` };
}

// ════════════════════════════════════════════════════════════════
// § UNLOCK
// ════════════════════════════════════════════════════════════════

/**
 * Check if endless mode is unlocked.
 * Requires 5+ total runs AND 5000+ best score.
 */
export function isEndlessUnlocked(
  totalRuns: number,
  bestScore: number,
): boolean {
  return totalRuns >= UNLOCK_MIN_RUNS && bestScore >= UNLOCK_MIN_SCORE;
}
