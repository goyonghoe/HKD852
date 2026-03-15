/**
 * RunSummaryCalc — Post-run summary: stats aggregation, record comparison, rewards.
 * Pure TypeScript. No Phaser imports. All functions are pure/immutable.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface RunResult {
  readonly score: number;
  readonly kills: number;
  readonly bossKills: number;
  readonly timeSurvivedMs: number;
  readonly level: number;
  readonly coinsEarned: number;
  readonly maxCombo: number;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly weaponsUsed: readonly string[];
  readonly victory: boolean;
  readonly wave: number;
}

export interface RunRecord {
  readonly bestScore: number;
  readonly bestKills: number;
  readonly bestCombo: number;
  readonly bestTime: number;
  readonly totalRuns: number;
  readonly totalKills: number;
  readonly totalCoins: number;
  readonly victories: number;
}

export interface RunReward {
  readonly coins: number;
  readonly xp: number;
  readonly unlocks: readonly string[];
}

export interface RunComparisonEntry {
  readonly field: string;
  readonly previous: number;
  readonly current: number;
  readonly isNewRecord: boolean;
}

export type RunComparison = RunComparisonEntry[];

export type RunGrade = "S" | "A" | "B" | "C" | "D" | "F";

// ─── Constants ───────────────────────────────────────────────────────

const REWARD_BASE_COINS = 50;
const REWARD_KILL_MULTIPLIER = 2;
const REWARD_TIME_DIVISOR = 1000;
const REWARD_TIME_CAP = 600;
const REWARD_TIME_MULTIPLIER = 0.5;
const REWARD_BOSS_BONUS = 100;
const REWARD_VICTORY_BONUS = 200;
const REWARD_XP_DIVISOR = 10;

const GRADE_THRESHOLDS: readonly { grade: RunGrade; min: number }[] = [
  { grade: "S", min: 50000 },
  { grade: "A", min: 30000 },
  { grade: "B", min: 15000 },
  { grade: "C", min: 5000 },
  { grade: "D", min: 1000 },
];

interface MilestoneDef {
  readonly field: keyof RunRecord;
  readonly threshold: number;
  readonly unlock: string;
}

const MILESTONES: readonly MilestoneDef[] = [
  { field: "victories", threshold: 1, unlock: "Winner" },
  { field: "victories", threshold: 5, unlock: "Champion" },
  { field: "totalRuns", threshold: 10, unlock: "Veteran" },
  { field: "totalRuns", threshold: 100, unlock: "Addict" },
  { field: "totalKills", threshold: 1000, unlock: "Slayer" },
  { field: "totalKills", threshold: 10000, unlock: "Genocide" },
];

const RECORD_FIELDS = [
  "bestScore",
  "bestKills",
  "bestCombo",
  "bestTime",
] as const;

// ─── Functions ───────────────────────────────────────────────────────

/** Initialize an empty run record with zeroed stats. */
export function createEmptyRecord(): RunRecord {
  return {
    bestScore: 0,
    bestKills: 0,
    bestCombo: 0,
    bestTime: 0,
    totalRuns: 0,
    totalKills: 0,
    totalCoins: 0,
    victories: 0,
  };
}

/** Merge a run result into an existing record, updating bests. Returns a new record. */
export function updateRecord(record: RunRecord, result: RunResult): RunRecord {
  return {
    bestScore: Math.max(record.bestScore, result.score),
    bestKills: Math.max(record.bestKills, result.kills),
    bestCombo: Math.max(record.bestCombo, result.maxCombo),
    bestTime: Math.max(record.bestTime, result.timeSurvivedMs),
    totalRuns: record.totalRuns + 1,
    totalKills: record.totalKills + result.kills,
    totalCoins: record.totalCoins + result.coinsEarned,
    victories: record.victories + (result.victory ? 1 : 0),
  };
}

/** Generate comparison entries showing which fields are new records. */
export function compareToRecord(
  record: RunRecord,
  result: RunResult,
): RunComparison {
  const mapping: {
    field: string;
    recordKey: keyof RunRecord;
    resultKey: keyof RunResult;
  }[] = [
    { field: "score", recordKey: "bestScore", resultKey: "score" },
    { field: "kills", recordKey: "bestKills", resultKey: "kills" },
    { field: "combo", recordKey: "bestCombo", resultKey: "maxCombo" },
    { field: "time", recordKey: "bestTime", resultKey: "timeSurvivedMs" },
  ];

  return mapping.map(({ field, recordKey, resultKey }) => ({
    field,
    previous: record[recordKey] as number,
    current: result[resultKey] as number,
    isNewRecord: (result[resultKey] as number) > (record[recordKey] as number),
  }));
}

/** Calculate post-run rewards: coins, xp, and unlocks. */
export function calculateRewards(result: RunResult): RunReward {
  const timeSec = Math.min(
    result.timeSurvivedMs / REWARD_TIME_DIVISOR,
    REWARD_TIME_CAP,
  );

  const coins =
    REWARD_BASE_COINS +
    result.kills * REWARD_KILL_MULTIPLIER +
    Math.floor(timeSec * REWARD_TIME_MULTIPLIER) +
    result.bossKills * REWARD_BOSS_BONUS +
    (result.victory ? REWARD_VICTORY_BONUS : 0);

  const xp = Math.floor(result.score / REWARD_XP_DIVISOR);

  const unlocks: string[] = [];
  if (result.victory) unlocks.push("victory_reward");
  if (result.bossKills >= 3) unlocks.push("boss_hunter");
  if (result.maxCombo >= 50) unlocks.push("combo_master");

  return { coins, xp, unlocks };
}

/** Grade a run result based on score thresholds. */
export function getRunGrade(result: RunResult): RunGrade {
  for (const { grade, min } of GRADE_THRESHOLDS) {
    if (result.score >= min) return grade;
  }
  return "F";
}

/** Format timeSurvivedMs as "MM:SS". */
export function getRunDuration(result: RunResult): string {
  const totalSeconds = Math.floor(result.timeSurvivedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Calculate kills per minute. Returns 0 if no time survived. */
export function getKillsPerMinute(result: RunResult): number {
  const minutes = result.timeSurvivedMs / 60000;
  if (minutes <= 0) return 0;
  return result.kills / minutes;
}

/** Calculate damage efficiency (dealt / taken). Returns Infinity if no damage taken, 0 if no damage dealt. */
export function getDamageEfficiency(result: RunResult): number {
  if (result.damageTaken === 0) {
    return result.damageDealt > 0 ? Infinity : 0;
  }
  return result.damageDealt / result.damageTaken;
}

/** Check if any field in the result is a new personal best. */
export function isNewPersonalBest(
  record: RunRecord,
  result: RunResult,
): boolean {
  return (
    result.score > record.bestScore ||
    result.kills > record.bestKills ||
    result.maxCombo > record.bestCombo ||
    result.timeSurvivedMs > record.bestTime
  );
}

/** Generate an array of highlight strings for notable achievements in a run. */
export function getRunHighlights(result: RunResult): string[] {
  const highlights: string[] = [];

  if (result.victory) highlights.push("Victory!");
  if (result.bossKills > 0)
    highlights.push(
      `Killed ${result.bossKills} boss${result.bossKills > 1 ? "es" : ""}!`,
    );
  if (result.maxCombo >= 10) highlights.push(`Max combo: ${result.maxCombo}!`);
  if (result.damageTaken === 0 && result.timeSurvivedMs >= 60000)
    highlights.push("No damage taken!");
  if (result.kills >= 500) highlights.push("500+ kills!");
  if (result.kills >= 1000) highlights.push("1000+ kills!");
  if (result.weaponsUsed.length >= 5)
    highlights.push(`Used ${result.weaponsUsed.length} weapons!`);
  if (result.wave >= 20) highlights.push(`Reached wave ${result.wave}!`);
  if (result.level >= 20) highlights.push(`Reached level ${result.level}!`);

  return highlights;
}

/** Check milestone unlocks based on cumulative record stats. */
export function getMilestoneUnlocks(record: RunRecord): string[] {
  return MILESTONES.filter(
    ({ field, threshold }) => (record[field] as number) >= threshold,
  ).map(({ unlock }) => unlock);
}

/** Serialize a RunRecord to a JSON string. */
export function serializeRecord(record: RunRecord): string {
  return JSON.stringify(record);
}

/** Deserialize a JSON string to a RunRecord with validation. Throws on invalid input. */
export function deserializeRecord(json: string): RunRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON string");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid RunRecord: expected an object");
  }

  const obj = parsed as Record<string, unknown>;
  const requiredFields: (keyof RunRecord)[] = [
    "bestScore",
    "bestKills",
    "bestCombo",
    "bestTime",
    "totalRuns",
    "totalKills",
    "totalCoins",
    "victories",
  ];

  for (const field of requiredFields) {
    if (typeof obj[field] !== "number") {
      throw new Error(`Invalid RunRecord: "${field}" must be a number`);
    }
  }

  return {
    bestScore: obj.bestScore as number,
    bestKills: obj.bestKills as number,
    bestCombo: obj.bestCombo as number,
    bestTime: obj.bestTime as number,
    totalRuns: obj.totalRuns as number,
    totalKills: obj.totalKills as number,
    totalCoins: obj.totalCoins as number,
    victories: obj.victories as number,
  };
}
