/**
 * ChallengeCalc — pure TypeScript, NO Phaser imports.
 * Daily and weekly challenge generation and tracking.
 */

export type ChallengeType =
  | "kill_count"
  | "survive_time"
  | "score_target"
  | "no_damage"
  | "weapon_only"
  | "speed_kill"
  | "boss_rush";

export interface ChallengeDef {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  constraint?: string; // e.g., "pistol_only", "no_passives"
  reward: { coins: number; diamonds: number };
  difficulty: "easy" | "medium" | "hard";
}

export interface ChallengeState {
  dailyChallenges: ChallengeDef[];
  weeklyChallenges: ChallengeDef[];
  completedIds: string[];
  lastDailyReset: string; // ISO date
  lastWeeklyReset: string; // ISO date
}

export interface ChallengeStats {
  kills: number;
  elapsed: number; // seconds
  score: number;
  noDamageTime: number; // seconds
  weaponsUsed: string[];
}

const CHALLENGE_POOL: readonly ChallengeDef[] = [
  // --- Easy (5) ---
  {
    id: "ch_kill_50",
    name: "Pest Control",
    description: "Kill 50 enemies in a single run",
    type: "kill_count",
    target: 50,
    reward: { coins: 100, diamonds: 0 },
    difficulty: "easy",
  },
  {
    id: "ch_survive_60",
    name: "Minute Man",
    description: "Survive for 60 seconds",
    type: "survive_time",
    target: 60,
    reward: { coins: 80, diamonds: 0 },
    difficulty: "easy",
  },
  {
    id: "ch_score_500",
    name: "Point Collector",
    description: "Reach a score of 500",
    type: "score_target",
    target: 500,
    reward: { coins: 120, diamonds: 0 },
    difficulty: "easy",
  },
  {
    id: "ch_kill_100",
    name: "Exterminator",
    description: "Kill 100 enemies in a single run",
    type: "kill_count",
    target: 100,
    reward: { coins: 150, diamonds: 0 },
    difficulty: "easy",
  },
  {
    id: "ch_survive_120",
    name: "Endurance Test",
    description: "Survive for 2 minutes",
    type: "survive_time",
    target: 120,
    reward: { coins: 100, diamonds: 1 },
    difficulty: "easy",
  },
  // --- Medium (5) ---
  {
    id: "ch_no_damage_30",
    name: "Untouchable",
    description: "Take no damage for 30 seconds",
    type: "no_damage",
    target: 30,
    reward: { coins: 200, diamonds: 1 },
    difficulty: "medium",
  },
  {
    id: "ch_pistol_only",
    name: "Old Faithful",
    description: "Complete a run using only the pistol",
    type: "weapon_only",
    target: 1,
    constraint: "pistol",
    reward: { coins: 250, diamonds: 1 },
    difficulty: "medium",
  },
  {
    id: "ch_score_2000",
    name: "High Roller",
    description: "Reach a score of 2000",
    type: "score_target",
    target: 2000,
    reward: { coins: 200, diamonds: 2 },
    difficulty: "medium",
  },
  {
    id: "ch_speed_kill_20",
    name: "Blitz",
    description: "Kill 20 enemies in under 15 seconds",
    type: "speed_kill",
    target: 20,
    reward: { coins: 180, diamonds: 1 },
    difficulty: "medium",
  },
  {
    id: "ch_kill_300",
    name: "Slayer",
    description: "Kill 300 enemies in a single run",
    type: "kill_count",
    target: 300,
    reward: { coins: 250, diamonds: 2 },
    difficulty: "medium",
  },
  // --- Hard (5) ---
  {
    id: "ch_no_damage_60",
    name: "Ghost",
    description: "Take no damage for 60 seconds",
    type: "no_damage",
    target: 60,
    reward: { coins: 400, diamonds: 3 },
    difficulty: "hard",
  },
  {
    id: "ch_boss_rush",
    name: "Boss Rush",
    description: "Defeat 3 bosses in a single run",
    type: "boss_rush",
    target: 3,
    reward: { coins: 500, diamonds: 5 },
    difficulty: "hard",
  },
  {
    id: "ch_score_5000",
    name: "Legend",
    description: "Reach a score of 5000",
    type: "score_target",
    target: 5000,
    reward: { coins: 350, diamonds: 3 },
    difficulty: "hard",
  },
  {
    id: "ch_shotgun_only",
    name: "Boomstick",
    description: "Complete a run using only the shotgun",
    type: "weapon_only",
    target: 1,
    constraint: "shotgun",
    reward: { coins: 300, diamonds: 3 },
    difficulty: "hard",
  },
  {
    id: "ch_kill_500",
    name: "Annihilator",
    description: "Kill 500 enemies in a single run",
    type: "kill_count",
    target: 500,
    reward: { coins: 400, diamonds: 4 },
    difficulty: "hard",
  },
] as const;

/**
 * Simple seeded PRNG (mulberry32).
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert ISO date string to a numeric seed.
 */
function dateToSeed(dateISO: string): number {
  let hash = 0;
  for (let i = 0; i < dateISO.length; i++) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Get the ISO week string (YYYY-Www) for a given date.
 */
export function getISOWeek(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7; // Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Deterministic shuffle using Fisher-Yates with seeded PRNG.
 */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate 3 daily challenges deterministically from a date string.
 * Picks 1 easy, 1 medium, 1 hard.
 */
export function generateDailyChallenges(
  dateISO: string,
  seed?: number,
): ChallengeDef[] {
  const baseSeed = seed ?? dateToSeed(dateISO);
  const rng = seededRandom(baseSeed);

  const easy = CHALLENGE_POOL.filter((c) => c.difficulty === "easy");
  const medium = CHALLENGE_POOL.filter((c) => c.difficulty === "medium");
  const hard = CHALLENGE_POOL.filter((c) => c.difficulty === "hard");

  const shuffledEasy = shuffle([...easy], rng);
  const shuffledMedium = shuffle([...medium], rng);
  const shuffledHard = shuffle([...hard], rng);

  return [
    { ...shuffledEasy[0], id: `daily_${dateISO}_0` },
    { ...shuffledMedium[0], id: `daily_${dateISO}_1` },
    { ...shuffledHard[0], id: `daily_${dateISO}_2` },
  ];
}

/**
 * Generate 2 weekly challenges (medium + hard) deterministically from week string.
 */
export function generateWeeklyChallenges(
  weekISO: string,
  seed?: number,
): ChallengeDef[] {
  const baseSeed = seed ?? dateToSeed(weekISO);
  const rng = seededRandom(baseSeed);

  const medium = CHALLENGE_POOL.filter((c) => c.difficulty === "medium");
  const hard = CHALLENGE_POOL.filter((c) => c.difficulty === "hard");

  const shuffledMedium = shuffle([...medium], rng);
  const shuffledHard = shuffle([...hard], rng);

  // Weekly challenges have boosted rewards
  return [
    {
      ...shuffledMedium[0],
      id: `weekly_${weekISO}_0`,
      reward: {
        coins: shuffledMedium[0].reward.coins * 2,
        diamonds: shuffledMedium[0].reward.diamonds * 2,
      },
    },
    {
      ...shuffledHard[0],
      id: `weekly_${weekISO}_1`,
      reward: {
        coins: shuffledHard[0].reward.coins * 2,
        diamonds: shuffledHard[0].reward.diamonds * 2,
      },
    },
  ];
}

/**
 * Check if a challenge is complete given current run stats.
 */
export function checkChallengeComplete(
  challenge: ChallengeDef,
  stats: ChallengeStats,
): boolean {
  switch (challenge.type) {
    case "kill_count":
      return stats.kills >= challenge.target;
    case "survive_time":
      return stats.elapsed >= challenge.target;
    case "score_target":
      return stats.score >= challenge.target;
    case "no_damage":
      return stats.noDamageTime >= challenge.target;
    case "weapon_only":
      return (
        stats.weaponsUsed.length === 1 &&
        stats.weaponsUsed[0] === challenge.constraint
      );
    case "speed_kill":
      // "Kill N enemies" — target is kill count, checked against kills
      return stats.kills >= challenge.target;
    case "boss_rush":
      // Target = number of bosses to defeat, encoded in kills for boss type
      return stats.kills >= challenge.target;
    default:
      return false;
  }
}

/**
 * Mark a challenge as completed (immutable update).
 */
export function completeChallenge(
  state: ChallengeState,
  challengeId: string,
): ChallengeState {
  if (state.completedIds.includes(challengeId)) {
    return state; // Already completed, no change
  }
  return {
    ...state,
    completedIds: [...state.completedIds, challengeId],
  };
}

/**
 * Calculate total unclaimed rewards from completed challenges.
 */
export function getTotalRewards(state: ChallengeState): {
  coins: number;
  diamonds: number;
} {
  const allChallenges = [...state.dailyChallenges, ...state.weeklyChallenges];

  let coins = 0;
  let diamonds = 0;

  for (const id of state.completedIds) {
    const challenge = allChallenges.find((c) => c.id === id);
    if (challenge) {
      coins += challenge.reward.coins;
      diamonds += challenge.reward.diamonds;
    }
  }

  return { coins, diamonds };
}

/**
 * Check if daily/weekly challenges need to be reset.
 */
export function needsReset(
  state: ChallengeState,
  todayISO: string,
): { daily: boolean; weekly: boolean } {
  const daily = state.lastDailyReset !== todayISO;
  const currentWeek = getISOWeek(todayISO);
  const lastWeek =
    state.lastWeeklyReset.length > 0 ? getISOWeek(state.lastWeeklyReset) : "";
  const weekly = currentWeek !== lastWeek;

  return { daily, weekly };
}

/**
 * Regenerate challenges if needed, clearing completed IDs for expired challenges.
 */
export function resetChallenges(
  state: ChallengeState,
  todayISO: string,
): ChallengeState {
  const reset = needsReset(state, todayISO);

  if (!reset.daily && !reset.weekly) {
    return state;
  }

  let newState = { ...state };

  if (reset.daily) {
    const oldDailyIds = new Set(state.dailyChallenges.map((c) => c.id));
    newState = {
      ...newState,
      dailyChallenges: generateDailyChallenges(todayISO),
      lastDailyReset: todayISO,
      completedIds: newState.completedIds.filter((id) => !oldDailyIds.has(id)),
    };
  }

  if (reset.weekly) {
    const weekISO = getISOWeek(todayISO);
    const oldWeeklyIds = new Set(state.weeklyChallenges.map((c) => c.id));
    newState = {
      ...newState,
      weeklyChallenges: generateWeeklyChallenges(weekISO),
      lastWeeklyReset: todayISO,
      completedIds: newState.completedIds.filter((id) => !oldWeeklyIds.has(id)),
    };
  }

  return newState;
}

/**
 * Get progress (0-1) for a challenge given current stats.
 */
export function getChallengeProgress(
  challenge: ChallengeDef,
  stats: ChallengeStats,
): number {
  let raw: number;

  switch (challenge.type) {
    case "kill_count":
      raw = stats.kills / challenge.target;
      break;
    case "survive_time":
      raw = stats.elapsed / challenge.target;
      break;
    case "score_target":
      raw = stats.score / challenge.target;
      break;
    case "no_damage":
      raw = stats.noDamageTime / challenge.target;
      break;
    case "weapon_only":
      raw =
        stats.weaponsUsed.length === 1 &&
        stats.weaponsUsed[0] === challenge.constraint
          ? 1
          : 0;
      break;
    case "speed_kill":
      raw = stats.kills / challenge.target;
      break;
    case "boss_rush":
      raw = stats.kills / challenge.target;
      break;
    default:
      raw = 0;
  }

  return Math.min(1, Math.max(0, raw));
}

/**
 * Get the default (empty) challenge state.
 */
export function getDefaultChallengeState(): ChallengeState {
  return {
    dailyChallenges: [],
    weeklyChallenges: [],
    completedIds: [],
    lastDailyReset: "",
    lastWeeklyReset: "",
  };
}

export { CHALLENGE_POOL };
