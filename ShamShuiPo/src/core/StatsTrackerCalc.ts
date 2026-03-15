// ── Neon Survivors: Stats Tracker Calculator ──
// Pure TypeScript — NO Phaser imports.
// Comprehensive statistics tracking across combat, survival, economy, progression, and social.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type StatCategory =
  | "combat"
  | "survival"
  | "economy"
  | "progression"
  | "social";

export type StatFormat = "number" | "time" | "percent" | "ratio";

export interface StatEntry {
  key: string;
  category: StatCategory;
  value: number;
  label: string;
  format: StatFormat;
}

export interface StatDefinition {
  key: string;
  category: StatCategory;
  label: string;
  format: StatFormat;
  /** When merging perRun → allTime, "add" sums, "max" keeps highest */
  mergeStrategy: "add" | "max";
}

export interface StatsState {
  stats: Record<string, number>;
  perRunStats: Record<string, number>;
  allTimeStats: Record<string, number>;
}

export interface RunComparison {
  winner: "a" | "b" | "tie";
  scoreA: number;
  scoreB: number;
  advantages: { a: string[]; b: string[] };
}

// ════════════════════════════════════════════════════════════════
// § STAT DEFINITIONS (30+)
// ════════════════════════════════════════════════════════════════

const STAT_DEFINITIONS: readonly StatDefinition[] = [
  // ── Combat (10) ──
  {
    key: "totalKills",
    category: "combat",
    label: "Total Kills",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "bossKills",
    category: "combat",
    label: "Boss Kills",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "eliteKills",
    category: "combat",
    label: "Elite Kills",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "damageDealt",
    category: "combat",
    label: "Damage Dealt",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "damageTaken",
    category: "combat",
    label: "Damage Taken",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "critHits",
    category: "combat",
    label: "Critical Hits",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "accuracy",
    category: "combat",
    label: "Accuracy",
    format: "percent",
    mergeStrategy: "max",
  },
  {
    key: "favoriteWeapon",
    category: "combat",
    label: "Favorite Weapon",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "longestKillStreak",
    category: "combat",
    label: "Longest Kill Streak",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "highestDPS",
    category: "combat",
    label: "Highest DPS",
    format: "number",
    mergeStrategy: "max",
  },

  // ── Survival (5) ──
  {
    key: "totalTimePlayed",
    category: "survival",
    label: "Total Time Played",
    format: "time",
    mergeStrategy: "add",
  },
  {
    key: "longestRun",
    category: "survival",
    label: "Longest Run",
    format: "time",
    mergeStrategy: "max",
  },
  {
    key: "shortestWin",
    category: "survival",
    label: "Shortest Win",
    format: "time",
    mergeStrategy: "max",
  },
  {
    key: "closestCall",
    category: "survival",
    label: "Closest Call (Lowest HP)",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "perfectRuns",
    category: "survival",
    label: "Perfect Runs",
    format: "number",
    mergeStrategy: "add",
  },

  // ── Economy (5) ──
  {
    key: "totalCoinsEarned",
    category: "economy",
    label: "Total Coins Earned",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "totalCoinsSpent",
    category: "economy",
    label: "Total Coins Spent",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "totalGemsEarned",
    category: "economy",
    label: "Total Gems Earned",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "itemsPurchased",
    category: "economy",
    label: "Items Purchased",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "gachaPulls",
    category: "economy",
    label: "Gacha Pulls",
    format: "number",
    mergeStrategy: "add",
  },

  // ── Progression (7) ──
  {
    key: "totalRuns",
    category: "progression",
    label: "Total Runs",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "victories",
    category: "progression",
    label: "Victories",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "defeats",
    category: "progression",
    label: "Defeats",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "highestLevel",
    category: "progression",
    label: "Highest Level",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "weaponsUnlocked",
    category: "progression",
    label: "Weapons Unlocked",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "achievementsUnlocked",
    category: "progression",
    label: "Achievements Unlocked",
    format: "number",
    mergeStrategy: "max",
  },
  {
    key: "prestigeLevel",
    category: "progression",
    label: "Prestige Level",
    format: "number",
    mergeStrategy: "max",
  },

  // ── Social (5) ──
  {
    key: "friendsHelped",
    category: "social",
    label: "Friends Helped",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "giftsGiven",
    category: "social",
    label: "Gifts Given",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "coopRuns",
    category: "social",
    label: "Co-op Runs",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "pvpWins",
    category: "social",
    label: "PvP Wins",
    format: "number",
    mergeStrategy: "add",
  },
  {
    key: "leaderboardPeak",
    category: "social",
    label: "Leaderboard Peak",
    format: "number",
    mergeStrategy: "max",
  },
] as const;

/** Lookup map for O(1) definition access */
const STAT_DEF_MAP: ReadonlyMap<string, StatDefinition> = new Map(
  STAT_DEFINITIONS.map((d) => [d.key, d]),
);

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function emptyRecord(): Record<string, number> {
  const rec: Record<string, number> = {};
  for (const def of STAT_DEFINITIONS) {
    rec[def.key] = 0;
  }
  return rec;
}

function cloneRecord(r: Record<string, number>): Record<string, number> {
  return { ...r };
}

// ════════════════════════════════════════════════════════════════
// § PUBLIC API
// ════════════════════════════════════════════════════════════════

/** 1. Create a fresh stats state with all zeros. */
export function createStatsState(): StatsState {
  return {
    stats: emptyRecord(),
    perRunStats: emptyRecord(),
    allTimeStats: emptyRecord(),
  };
}

/** 2. Increment a stat by the given amount (default +1). Returns new state. */
export function incrementStat(
  state: StatsState,
  key: string,
  amount: number = 1,
): StatsState {
  return {
    ...state,
    stats: { ...state.stats, [key]: (state.stats[key] ?? 0) + amount },
    perRunStats: {
      ...state.perRunStats,
      [key]: (state.perRunStats[key] ?? 0) + amount,
    },
  };
}

/** 3. Set a stat to an absolute value. Returns new state. */
export function setStat(
  state: StatsState,
  key: string,
  value: number,
): StatsState {
  return {
    ...state,
    stats: { ...state.stats, [key]: value },
    perRunStats: { ...state.perRunStats, [key]: value },
  };
}

/** 4. Only update if value > current (for records like highestDPS). Returns new state. */
export function setMaxStat(
  state: StatsState,
  key: string,
  value: number,
): StatsState {
  const currentStats = state.stats[key] ?? 0;
  const currentPerRun = state.perRunStats[key] ?? 0;
  return {
    ...state,
    stats: { ...state.stats, [key]: Math.max(currentStats, value) },
    perRunStats: {
      ...state.perRunStats,
      [key]: Math.max(currentPerRun, value),
    },
  };
}

/** 5. Get a single stat value. */
export function getStat(state: StatsState, key: string): number {
  return state.stats[key] ?? 0;
}

/** 6. Get all stats for a given category. */
export function getStatsByCategory(
  state: StatsState,
  category: StatCategory,
): StatEntry[] {
  return STAT_DEFINITIONS.filter((d) => d.category === category).map((d) => ({
    key: d.key,
    category: d.category,
    value: state.stats[d.key] ?? 0,
    label: d.label,
    format: d.format,
  }));
}

/** 7. Start a new run — reset perRunStats to zero. */
export function startRun(state: StatsState): StatsState {
  return {
    ...state,
    perRunStats: emptyRecord(),
  };
}

/** 8. End a run — merge perRunStats into allTimeStats using each stat's merge strategy. */
export function endRun(state: StatsState): StatsState {
  const newAllTime = cloneRecord(state.allTimeStats);
  for (const def of STAT_DEFINITIONS) {
    const runVal = state.perRunStats[def.key] ?? 0;
    const allVal = newAllTime[def.key] ?? 0;
    if (def.mergeStrategy === "add") {
      newAllTime[def.key] = allVal + runVal;
    } else {
      newAllTime[def.key] = Math.max(allVal, runVal);
    }
  }
  return {
    ...state,
    allTimeStats: newAllTime,
  };
}

/** 9. Get current run stats as StatEntry array. */
export function getRunStats(state: StatsState): StatEntry[] {
  return STAT_DEFINITIONS.map((d) => ({
    key: d.key,
    category: d.category,
    value: state.perRunStats[d.key] ?? 0,
    label: d.label,
    format: d.format,
  }));
}

/** 10. Get lifetime stats as StatEntry array. */
export function getAllTimeStats(state: StatsState): StatEntry[] {
  return STAT_DEFINITIONS.map((d) => ({
    key: d.key,
    category: d.category,
    value: state.allTimeStats[d.key] ?? 0,
    label: d.label,
    format: d.format,
  }));
}

/** 11. Format a stat entry into a display string. */
export function formatStat(entry: StatEntry): string {
  switch (entry.format) {
    case "time": {
      const totalSec = Math.floor(entry.value);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec.toString().padStart(2, "0")}`;
    }
    case "percent":
      return `${entry.value.toFixed(1)}%`;
    case "ratio":
      return entry.value.toFixed(2);
    case "number":
    default:
      return entry.value >= 1_000_000
        ? `${(entry.value / 1_000_000).toFixed(1)}M`
        : entry.value >= 1_000
          ? `${(entry.value / 1_000).toFixed(1)}K`
          : entry.value.toString();
  }
}

/** 12. Get the most impressive stats (highest non-zero values), sorted descending. */
export function getTopStats(state: StatsState, limit: number = 5): StatEntry[] {
  const entries: StatEntry[] = STAT_DEFINITIONS.filter(
    (d) => (state.stats[d.key] ?? 0) > 0,
  ).map((d) => ({
    key: d.key,
    category: d.category,
    value: state.stats[d.key] ?? 0,
    label: d.label,
    format: d.format,
  }));

  entries.sort((a, b) => b.value - a.value);
  return entries.slice(0, limit);
}

/** 13. Compare two run stat records to determine which was better. */
export function compareRuns(
  statsA: Record<string, number>,
  statsB: Record<string, number>,
): RunComparison {
  // Score: weighted sum of normalized stats
  const weights: Record<string, number> = {
    totalKills: 3,
    bossKills: 10,
    eliteKills: 5,
    damageDealt: 1,
    critHits: 2,
    longestKillStreak: 4,
    highestDPS: 2,
    victories: 20,
    highestLevel: 5,
    totalCoinsEarned: 1,
    perfectRuns: 15,
  };

  let scoreA = 0;
  let scoreB = 0;
  const advantagesA: string[] = [];
  const advantagesB: string[] = [];

  for (const def of STAT_DEFINITIONS) {
    const a = statsA[def.key] ?? 0;
    const b = statsB[def.key] ?? 0;
    const w = weights[def.key] ?? 1;
    scoreA += a * w;
    scoreB += b * w;
    if (a > b) advantagesA.push(def.label);
    else if (b > a) advantagesB.push(def.label);
  }

  return {
    winner: scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : "tie",
    scoreA,
    scoreB,
    advantages: { a: advantagesA, b: advantagesB },
  };
}

/** 14a. Serialize state to JSON string. */
export function serialize(state: StatsState): string {
  return JSON.stringify({
    stats: state.stats,
    perRunStats: state.perRunStats,
    allTimeStats: state.allTimeStats,
  });
}

/** 14b. Deserialize JSON string to state. Returns null on invalid input. */
export function deserialize(json: string): StatsState | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.stats !== "object" ||
      typeof parsed.perRunStats !== "object" ||
      typeof parsed.allTimeStats !== "object"
    ) {
      return null;
    }
    // Ensure all known keys exist, fill missing with 0
    const base = createStatsState();
    return {
      stats: { ...base.stats, ...parsed.stats },
      perRunStats: { ...base.perRunStats, ...parsed.perRunStats },
      allTimeStats: { ...base.allTimeStats, ...parsed.allTimeStats },
    };
  } catch {
    return null;
  }
}

/** 15. Get all stat definitions (metadata). */
export function getStatDefinitions(): readonly StatDefinition[] {
  return STAT_DEFINITIONS;
}
