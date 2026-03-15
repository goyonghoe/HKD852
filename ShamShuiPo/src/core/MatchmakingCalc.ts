/**
 * MatchmakingCalc — Pure TypeScript ELO-like matchmaking system.
 * NO Phaser imports. All functions are pure and immutable.
 */

// ─── Types ───────────────────────────────────────────────────

export type RankTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "legend";

export interface PlayerRating {
  readonly mmr: number;
  readonly rank: RankTier;
  readonly wins: number;
  readonly losses: number;
  readonly streak: number; // positive = win streak, negative = loss streak
  readonly lastMatchAt: number; // timestamp in ms
}

export interface MatchResultPair {
  readonly winner: PlayerRating;
  readonly loser: PlayerRating;
}

// ─── Constants ───────────────────────────────────────────────

/** Rank thresholds sorted descending for lookup */
const RANK_TIERS: readonly {
  readonly tier: RankTier;
  readonly minMmr: number;
}[] = [
  { tier: "legend", minMmr: 2400 },
  { tier: "master", minMmr: 2000 },
  { tier: "diamond", minMmr: 1600 },
  { tier: "platinum", minMmr: 1200 },
  { tier: "gold", minMmr: 900 },
  { tier: "silver", minMmr: 600 },
  { tier: "bronze", minMmr: 0 },
];

/** Ascending order for promotion lookup */
const RANK_ORDER: readonly RankTier[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "master",
  "legend",
];

/** MMR threshold to enter each rank (lower bound) */
const RANK_MIN_MMR: Record<RankTier, number> = {
  bronze: 0,
  silver: 600,
  gold: 900,
  platinum: 1200,
  diamond: 1600,
  master: 2000,
  legend: 2400,
};

const DEFAULT_MMR = 800;
const DEFAULT_K_FACTOR = 32;
const MAX_STREAK = 5;
const STREAK_BONUS_PER_LEVEL = 2;
const INACTIVITY_THRESHOLD_DAYS = 7;
const DECAY_PER_DAY = 10;
const MAX_DECAY = 200;
const MS_PER_DAY = 86_400_000;
const GRACE_PERIOD_MS = 3 * MS_PER_DAY; // 3 days demotion shield

// ─── Factory ─────────────────────────────────────────────────

export function createPlayerRating(
  overrides?: Partial<PlayerRating>,
): PlayerRating {
  const mmr = overrides?.mmr ?? DEFAULT_MMR;
  return {
    mmr,
    rank: overrides?.rank ?? getRank(mmr),
    wins: overrides?.wins ?? 0,
    losses: overrides?.losses ?? 0,
    streak: overrides?.streak ?? 0,
    lastMatchAt: overrides?.lastMatchAt ?? Date.now(),
  };
}

// ─── Rank ────────────────────────────────────────────────────

export function getRank(mmr: number): RankTier {
  const clamped = Math.max(0, mmr);
  for (const { tier, minMmr } of RANK_TIERS) {
    if (clamped >= minMmr) return tier;
  }
  return "bronze";
}

// ─── ELO Core ────────────────────────────────────────────────

export function getExpectedWinRate(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateMatchResult(
  winner: PlayerRating,
  loser: PlayerRating,
  kFactor: number = DEFAULT_K_FACTOR,
): MatchResultPair {
  const expectedWin = getExpectedWinRate(winner.mmr, loser.mmr);
  const expectedLose = 1 - expectedWin;

  // Update streaks
  const winnerStreak = clampStreak(winner.streak >= 0 ? winner.streak + 1 : 1);
  const loserStreak = clampStreak(loser.streak <= 0 ? loser.streak - 1 : -1);

  // Calculate MMR deltas
  const winnerDelta =
    kFactor * (1 - expectedWin) + getStreakBonus(winnerStreak);
  const loserDelta = kFactor * (0 - expectedLose) + getStreakBonus(loserStreak);

  const newWinnerMmr = Math.max(0, Math.round(winner.mmr + winnerDelta));
  const newLoserMmr = Math.max(0, Math.round(loser.mmr + loserDelta));

  const now = Date.now();

  return {
    winner: {
      mmr: newWinnerMmr,
      rank: getRank(newWinnerMmr),
      wins: winner.wins + 1,
      losses: winner.losses,
      streak: winnerStreak,
      lastMatchAt: now,
    },
    loser: {
      mmr: newLoserMmr,
      rank: getRank(newLoserMmr),
      wins: loser.wins,
      losses: loser.losses + 1,
      streak: loserStreak,
      lastMatchAt: now,
    },
  };
}

// ─── Streak ──────────────────────────────────────────────────

function clampStreak(streak: number): number {
  return Math.max(-MAX_STREAK, Math.min(MAX_STREAK, streak));
}

export function getStreakBonus(streak: number): number {
  const clamped = Math.max(-MAX_STREAK, Math.min(MAX_STREAK, streak));
  if (clamped === 0) return 0;
  return clamped * STREAK_BONUS_PER_LEVEL;
}

// ─── Inactivity Decay ────────────────────────────────────────

export function applyInactivityDecay(
  rating: PlayerRating,
  now: number,
): PlayerRating {
  const elapsedMs = now - rating.lastMatchAt;
  const elapsedDays = Math.floor(elapsedMs / MS_PER_DAY);

  if (elapsedDays <= INACTIVITY_THRESHOLD_DAYS) return rating;

  const decayDays = elapsedDays - INACTIVITY_THRESHOLD_DAYS;
  const totalDecay = Math.min(decayDays * DECAY_PER_DAY, MAX_DECAY);
  const newMmr = Math.max(0, rating.mmr - totalDecay);

  return {
    ...rating,
    mmr: newMmr,
    rank: getRank(newMmr),
  };
}

// ─── Match Quality ───────────────────────────────────────────

export function estimateMatchQuality(
  ratingA: PlayerRating,
  ratingB: PlayerRating,
): number {
  const diff = Math.abs(ratingA.mmr - ratingB.mmr);
  // Gaussian-like falloff: 0 diff → 1.0, ~200 diff → ~0.61, ~400 diff → ~0.14
  const quality = Math.exp((-diff * diff) / (2 * 200 * 200));
  return Math.round(quality * 1000) / 1000;
}

// ─── Leaderboard ─────────────────────────────────────────────

export function getLeaderboardPosition(
  ratings: readonly PlayerRating[],
  targetMmr: number,
): number {
  let position = 1;
  for (const r of ratings) {
    if (r.mmr > targetMmr) {
      position++;
    }
  }
  return position;
}

// ─── Promotion / Demotion ────────────────────────────────────

export function isPromotionMatch(rating: PlayerRating): boolean {
  if (rating.rank === "legend") return false;

  const currentIdx = RANK_ORDER.indexOf(rating.rank);
  const nextTier = RANK_ORDER[currentIdx + 1];
  const nextThreshold = RANK_MIN_MMR[nextTier];

  // A typical win could gain ~16-32 MMR; promotion match if within kFactor range
  return (
    rating.mmr >= nextThreshold - DEFAULT_K_FACTOR && rating.mmr < nextThreshold
  );
}

export function getDemotionShield(rating: PlayerRating): boolean {
  // Bronze cannot demote
  if (rating.rank === "bronze") return false;

  const currentFloor = RANK_MIN_MMR[rating.rank];

  // Must be near the bottom of current rank (within kFactor range)
  const isNearBottom = rating.mmr - currentFloor < DEFAULT_K_FACTOR;
  if (!isNearBottom) return false;

  // Grace period: last match was within 3 days (proxy for recent promotion)
  const elapsed = Date.now() - rating.lastMatchAt;
  return elapsed < GRACE_PERIOD_MS;
}
