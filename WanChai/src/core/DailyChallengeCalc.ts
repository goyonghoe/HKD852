/**
 * DailyChallengeCalc — Pure TypeScript daily challenge system.
 * No Phaser imports (M-001). All numbers from balance.ts (M-002).
 *
 * Daily challenges are deterministically generated from the UTC date string.
 * A simple hash function is used for seeding — no crypto or Phaser dependencies.
 *
 * 8 challenge templates:
 *  1. kill_with_weapon       — Kill N enemies with a specific weapon
 *  2. survive_minutes        — Survive for N minutes in a single run
 *  3. defeat_boss_stage      — Defeat a boss at or after stage N
 *  4. collect_xp_orbs        — Collect N XP orbs in a single run
 *  5. no_shop_run            — Complete a full run without using the shop
 *  6. reach_level            — Reach level N in a single run
 *  7. deal_total_damage      — Deal N total damage in a single run
 *  8. complete_with_character — Complete a run with a specific character
 */
import { BALANCE } from '../config/balance';
import type {
  ChallengeDef,
  ChallengeProgress,
  ChallengeType,
  ChallengeDifficulty,
  DailyChallengeSave,
} from '../types/game';

// ── Hash Utilities (no crypto dependency) ────────────────────────────────────

/**
 * Simple deterministic hash of a string → non-negative 32-bit integer.
 * Uses djb2 algorithm.
 */
export function hashString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) >>> 0; // force unsigned 32-bit
  }
  return hash;
}

/**
 * Seeded pseudo-random number generator (LCG).
 * Returns a function that produces numbers in [0, 1).
 * Seed is the djb2 hash of the date string.
 */
export function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    // LCG parameters from Numerical Recipes
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Pick a random integer in [0, max) using the provided rng function.
 */
function rngInt(rng: () => number, max: number): number {
  return Math.floor(rng() * max);
}

/**
 * Pick a random element from an array using the provided rng function.
 */
function rngPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[rngInt(rng, arr.length)];
}

// ── Date Utilities ────────────────────────────────────────────────────────────

/**
 * Get today's UTC date as "YYYY-MM-DD".
 * UTC midnight is used for daily reset consistency across time zones.
 */
export function getUtcDateStr(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a DailyChallengeSave is still valid for today (UTC).
 */
export function isDailyValid(save: DailyChallengeSave, now: Date = new Date()): boolean {
  return save.dateStr === getUtcDateStr(now);
}

// ── Challenge Generation ──────────────────────────────────────────────────────

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ['easy', 'medium', 'hard'];
const CHALLENGE_TYPES: ChallengeType[] = [
  'kill_with_weapon',
  'survive_minutes',
  'defeat_boss_stage',
  'collect_xp_orbs',
  'no_shop_run',
  'reach_level',
  'deal_total_damage',
  'complete_with_character',
];

/**
 * Build a ChallengeDef for the given type, difficulty, and random weapon/character.
 * The id embeds the date string and type to be stable across sessions on the same day.
 */
function buildChallengeDef(
  type: ChallengeType,
  difficulty: ChallengeDifficulty,
  rng: () => number,
  dateStr: string,
  index: number,
): ChallengeDef {
  const p = BALANCE.DAILY_CHALLENGE.params;
  const id = `daily_${dateStr}_${index}_${type}`;
  const prestigeReward = BALANCE.DAILY_CHALLENGE.prestigeByDifficulty[difficulty];

  switch (type) {
    case 'kill_with_weapon': {
      const weaponId = rngPick(rng, BALANCE.DAILY_CHALLENGE.weaponPool);
      const target = p.killWithWeapon[difficulty];
      return {
        id,
        type,
        descKey: 'challenge.kill_with_weapon',
        params: { weaponId, target },
        difficulty,
        prestigeReward,
      };
    }
    case 'survive_minutes': {
      const target = p.surviveMinutes[difficulty];
      return {
        id,
        type,
        descKey: 'challenge.survive_minutes',
        params: { target },
        difficulty,
        prestigeReward,
      };
    }
    case 'defeat_boss_stage': {
      const requiredStage = p.defeatBossStage[difficulty];
      // target=1 (binary: completed or not); stageRequired is the display param
      return {
        id,
        type,
        descKey: 'challenge.defeat_boss_stage',
        params: { stageRequired: requiredStage, target: 1 },
        difficulty,
        prestigeReward,
      };
    }
    case 'collect_xp_orbs': {
      const target = p.collectXpOrbs[difficulty];
      return {
        id,
        type,
        descKey: 'challenge.collect_xp_orbs',
        params: { target },
        difficulty,
        prestigeReward,
      };
    }
    case 'no_shop_run': {
      // Binary challenge: 0 or 1 (completed or not). Target = 1.
      return {
        id,
        type,
        descKey: 'challenge.no_shop_run',
        params: { target: 1 },
        difficulty,
        prestigeReward,
      };
    }
    case 'reach_level': {
      const target = p.reachLevel[difficulty];
      return {
        id,
        type,
        descKey: 'challenge.reach_level',
        params: { target },
        difficulty,
        prestigeReward,
      };
    }
    case 'deal_total_damage': {
      const target = p.dealTotalDamage[difficulty];
      return {
        id,
        type,
        descKey: 'challenge.deal_total_damage',
        params: { target },
        difficulty,
        prestigeReward,
      };
    }
    case 'complete_with_character': {
      const characterId = rngPick(rng, BALANCE.DAILY_CHALLENGE.characterPool);
      return {
        id,
        type,
        descKey: 'challenge.complete_with_character',
        params: { characterId, target: 1 },
        difficulty,
        prestigeReward,
      };
    }
  }
}

/**
 * Generate today's daily challenges deterministically from the UTC date string.
 *
 * Algorithm:
 * 1. Seed = djb2 hash of dateStr
 * 2. Shuffle challenge types using Fisher-Yates with seeded rng
 * 3. Pick first N distinct types (N = challengesPerDay)
 * 4. Assign difficulties: first = easy, second = medium, third = hard
 *    (ensures daily variety while maintaining balanced difficulty)
 */
export function generateDailyChallenges(dateStr: string): ChallengeDef[] {
  const seed = hashString(dateStr);
  const rng = makeSeededRng(seed);
  const count = BALANCE.DAILY_CHALLENGE.challengesPerDay;

  // Fisher-Yates shuffle of challenge types (copy to avoid mutating)
  const shuffled = [...CHALLENGE_TYPES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rngInt(rng, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, count);
  return selected.map((type, i) => {
    const difficulty = DIFFICULTY_ORDER[Math.min(i, DIFFICULTY_ORDER.length - 1)];
    return buildChallengeDef(type, difficulty, rng, dateStr, i);
  });
}

// ── Progress Tracking ─────────────────────────────────────────────────────────

/**
 * Initialize fresh progress entries for a set of challenges.
 */
export function initChallengeProgress(challenges: ChallengeDef[]): Record<string, ChallengeProgress> {
  const progress: Record<string, ChallengeProgress> = {};
  for (const challenge of challenges) {
    const target = getTargetFromChallenge(challenge);
    progress[challenge.id] = {
      challengeId: challenge.id,
      current: 0,
      target,
      completed: false,
      claimed: false,
    };
  }
  return progress;
}

/** Extract the numeric target from a challenge's params. */
function getTargetFromChallenge(challenge: ChallengeDef): number {
  return typeof challenge.params.target === 'number' ? challenge.params.target : 1;
}

/**
 * Inputs describing what happened in a completed run.
 * Used to update challenge progress.
 */
export interface RunResultForChallenge {
  /** Damage dealt per weapon: weaponId → total damage dealt this run */
  weaponDamageMap: Record<string, number>;
  /** Total run time in milliseconds */
  runTimeMs: number;
  /** Highest stage reached this run */
  highestStage: number;
  /** Number of XP orbs collected this run */
  xpOrbsCollected: number;
  /** Whether the shop was used this run */
  usedShop: boolean;
  /** Player level reached at run end */
  levelReached: number;
  /** Total damage dealt this run */
  totalDamageDealt: number;
  /** Character used this run */
  characterId: string;
  /** Whether the run was completed (survived = true, base survived) */
  survived: boolean;
  /** Number of boss kills this run */
  bossKills: number;
  /** Per-weapon kill counts: weaponId → kills */
  weaponKillMap?: Record<string, number>;
}

/**
 * Update challenge progress based on a completed run result.
 * Returns a new progress object (does not mutate in-place).
 * Only updates challenges that are not yet completed.
 */
export function updateChallengeProgress(
  challenges: ChallengeDef[],
  progress: Record<string, ChallengeProgress>,
  run: RunResultForChallenge,
): Record<string, ChallengeProgress> {
  const updated: Record<string, ChallengeProgress> = {};

  for (const challenge of challenges) {
    const prev = progress[challenge.id];
    if (!prev || prev.completed) {
      updated[challenge.id] = prev ?? {
        challengeId: challenge.id,
        current: 0,
        target: getTargetFromChallenge(challenge),
        completed: false,
        claimed: false,
      };
      continue;
    }

    const newProgress = computeNewProgress(challenge, run, prev.current);
    const target = prev.target;
    const completed = newProgress >= target;

    updated[challenge.id] = {
      ...prev,
      current: Math.min(newProgress, target),
      completed,
    };
  }

  return updated;
}

/**
 * Compute the new progress value for a specific challenge type given a run result.
 * Returns the updated cumulative progress.
 */
function computeNewProgress(challenge: ChallengeDef, run: RunResultForChallenge, currentProgress: number): number {
  switch (challenge.type) {
    case 'kill_with_weapon': {
      const weaponId = challenge.params.weaponId as string;
      const kills = run.weaponKillMap?.[weaponId] ?? 0;
      return currentProgress + kills;
    }
    case 'survive_minutes': {
      const minutesSurvived = run.runTimeMs / 60000;
      const target = challenge.params.target as number;
      // Single-run challenge: track best (not cumulative)
      return Math.max(currentProgress, minutesSurvived >= target ? target : minutesSurvived);
    }
    case 'defeat_boss_stage': {
      // stageRequired = the stage the boss must be on; target = 1 (binary completion)
      const requiredStage = (challenge.params.stageRequired ?? challenge.params.target) as number;
      if (run.bossKills > 0 && run.highestStage >= requiredStage) {
        return 1;
      }
      return currentProgress;
    }
    case 'collect_xp_orbs': {
      // Cumulative across multiple runs
      return currentProgress + run.xpOrbsCollected;
    }
    case 'no_shop_run': {
      // Single-run binary: complete a run without using the shop
      if (run.survived && !run.usedShop) return 1;
      return currentProgress;
    }
    case 'reach_level': {
      const target = challenge.params.target as number;
      // Best level reached (single-run)
      return Math.max(currentProgress, run.levelReached >= target ? target : run.levelReached);
    }
    case 'deal_total_damage': {
      // Cumulative across runs
      return currentProgress + run.totalDamageDealt;
    }
    case 'complete_with_character': {
      const characterId = challenge.params.characterId as string;
      if (run.survived && run.characterId === characterId) return 1;
      return currentProgress;
    }
  }
}

// ── Reward & Reset ────────────────────────────────────────────────────────────

/**
 * Mark a completed challenge as claimed.
 * Returns the updated progress entry, or the original if not claimable.
 */
export function claimChallengeReward(progress: ChallengeProgress): ChallengeProgress {
  if (!progress.completed || progress.claimed) return progress;
  return { ...progress, claimed: true };
}

/**
 * Total prestige available from claiming all completed challenges.
 */
export function totalClaimablePrestige(
  challenges: ChallengeDef[],
  progress: Record<string, ChallengeProgress>,
): number {
  let total = 0;
  for (const challenge of challenges) {
    const p = progress[challenge.id];
    if (p?.completed && !p.claimed) {
      total += challenge.prestigeReward;
    }
  }
  return total;
}

/**
 * Check how many challenges are completed (regardless of claimed status).
 */
export function countCompletedChallenges(progress: Record<string, ChallengeProgress>): number {
  return Object.values(progress).filter((p) => p.completed).length;
}

/**
 * Create a fresh DailyChallengeSave for today (UTC).
 */
export function createTodaysSave(now: Date = new Date()): DailyChallengeSave {
  const dateStr = getUtcDateStr(now);
  const challenges = generateDailyChallenges(dateStr);
  return {
    dateStr,
    challenges,
    progress: initChallengeProgress(challenges),
  };
}

/**
 * Get or refresh a DailyChallengeSave:
 * - If the save is still valid for today, return it unchanged.
 * - If expired (new day), create a fresh save for today.
 */
export function getOrRefreshDailySave(existing: DailyChallengeSave | null, now: Date = new Date()): DailyChallengeSave {
  if (existing && isDailyValid(existing, now)) return existing;
  return createTodaysSave(now);
}
