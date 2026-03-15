// AchievementTrackerCalc.ts — pure TypeScript, NO Phaser imports

// ── Types ──────────────────────────────────────────────────────────

export type AchievementCategory =
  | "combat"
  | "survival"
  | "collection"
  | "exploration"
  | "mastery"
  | "secret";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface AchievementCondition {
  readonly type: string;
  readonly target: number;
  current: number;
}

export interface AchievementReward {
  readonly coins: number;
  readonly title?: string;
  claimed: boolean;
}

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly tier: AchievementTier;
  readonly conditions: AchievementCondition[];
  isUnlocked: boolean;
  unlockedAt?: number;
  readonly reward: AchievementReward;
}

export interface AchievementTrackerState {
  readonly achievements: Record<string, Achievement>;
  recentUnlocks: string[];
  totalUnlocked: number;
}

// ── Achievement Definitions ────────────────────────────────────────

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  conditions: { type: string; target: number }[];
  reward: { coins: number; title?: string };
}

const ACHIEVEMENT_POOL: readonly AchievementDef[] = [
  // ── Combat (5) ──
  {
    id: "first_blood",
    name: "First Blood",
    description: "Kill your first enemy",
    category: "combat",
    tier: "bronze",
    conditions: [{ type: "enemies_killed", target: 1 }],
    reward: { coins: 10 },
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Kill 100 enemies in one run",
    category: "combat",
    tier: "silver",
    conditions: [{ type: "enemies_killed_run", target: 100 }],
    reward: { coins: 50 },
  },
  {
    id: "thousand_cuts",
    name: "Thousand Cuts",
    description: "Deal 10000 damage in one run",
    category: "combat",
    tier: "silver",
    conditions: [{ type: "damage_dealt_run", target: 10000 }],
    reward: { coins: 50 },
  },
  {
    id: "boss_slayer",
    name: "Boss Slayer",
    description: "Kill 5 bosses total",
    category: "combat",
    tier: "gold",
    conditions: [{ type: "bosses_killed", target: 5 }],
    reward: { coins: 100 },
  },
  {
    id: "untouchable",
    name: "Untouchable",
    description: "Complete a run taking no damage",
    category: "combat",
    tier: "platinum",
    conditions: [{ type: "no_damage_run", target: 1 }],
    reward: { coins: 500 },
  },

  // ── Survival (5) ──
  {
    id: "survivor",
    name: "Survivor",
    description: "Survive 5 minutes",
    category: "survival",
    tier: "bronze",
    conditions: [{ type: "survive_minutes", target: 5 }],
    reward: { coins: 10 },
  },
  {
    id: "endurance",
    name: "Endurance",
    description: "Survive 10 minutes",
    category: "survival",
    tier: "silver",
    conditions: [{ type: "survive_minutes", target: 10 }],
    reward: { coins: 50 },
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Survive with 1 HP for 30 seconds",
    category: "survival",
    tier: "gold",
    conditions: [{ type: "survive_1hp_seconds", target: 30 }],
    reward: { coins: 100 },
  },
  {
    id: "cockroach",
    name: "Cockroach",
    description: "Survive after being at 1 HP 3 times",
    category: "survival",
    tier: "silver",
    conditions: [{ type: "times_at_1hp", target: 3 }],
    reward: { coins: 50 },
  },
  {
    id: "immortal",
    name: "Immortal",
    description: "Win 10 runs",
    category: "survival",
    tier: "gold",
    conditions: [{ type: "runs_won", target: 10 }],
    reward: { coins: 200, title: "Immortal" },
  },

  // ── Collection (5) ──
  {
    id: "hoarder",
    name: "Hoarder",
    description: "Collect 1000 coins total",
    category: "collection",
    tier: "silver",
    conditions: [{ type: "coins_collected", target: 1000 }],
    reward: { coins: 50 },
  },
  {
    id: "arsenal",
    name: "Arsenal",
    description: "Own all 8 weapons in one run",
    category: "collection",
    tier: "gold",
    conditions: [{ type: "weapons_owned_run", target: 8 }],
    reward: { coins: 100 },
  },
  {
    id: "max_power",
    name: "Max Power",
    description: "Max level any weapon",
    category: "collection",
    tier: "silver",
    conditions: [{ type: "weapon_maxed", target: 1 }],
    reward: { coins: 50 },
  },
  {
    id: "evolution",
    name: "Evolution",
    description: "Evolve a weapon",
    category: "collection",
    tier: "gold",
    conditions: [{ type: "weapons_evolved", target: 1 }],
    reward: { coins: 100 },
  },
  {
    id: "full_build",
    name: "Full Build",
    description: "Have 6 weapons + 6 passives",
    category: "collection",
    tier: "gold",
    conditions: [
      { type: "weapons_equipped", target: 6 },
      { type: "passives_equipped", target: 6 },
    ],
    reward: { coins: 150 },
  },

  // ── Mastery (5) ──
  {
    id: "combo_king",
    name: "Combo King",
    description: "Reach 50 combo",
    category: "mastery",
    tier: "silver",
    conditions: [{ type: "max_combo", target: 50 }],
    reward: { coins: 50 },
  },
  {
    id: "speed_run",
    name: "Speed Run",
    description: "Win in under 8 minutes",
    category: "mastery",
    tier: "gold",
    conditions: [{ type: "speed_run_win", target: 1 }],
    reward: { coins: 100 },
  },
  {
    id: "s_rank",
    name: "S Rank",
    description: "Get S rank",
    category: "mastery",
    tier: "gold",
    conditions: [{ type: "s_rank_achieved", target: 1 }],
    reward: { coins: 200, title: "S-Ranker" },
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete all quests in one run",
    category: "mastery",
    tier: "platinum",
    conditions: [{ type: "all_quests_completed", target: 1 }],
    reward: { coins: 300 },
  },
  {
    id: "all_talents",
    name: "All Talents",
    description: "Unlock all talents",
    category: "mastery",
    tier: "platinum",
    conditions: [{ type: "talents_unlocked_all", target: 1 }],
    reward: { coins: 500, title: "Master" },
  },
] as const;

// ── Helpers ────────────────────────────────────────────────────────

function cloneAchievement(a: Achievement): Achievement {
  return {
    ...a,
    conditions: a.conditions.map((c) => ({ ...c })),
    reward: { ...a.reward },
  };
}

function cloneState(state: AchievementTrackerState): AchievementTrackerState {
  const achievements: Record<string, Achievement> = {};
  for (const key of Object.keys(state.achievements)) {
    achievements[key] = cloneAchievement(state.achievements[key]);
  }
  return {
    achievements,
    recentUnlocks: [...state.recentUnlocks],
    totalUnlocked: state.totalUnlocked,
  };
}

function isComplete(a: Achievement): boolean {
  return a.conditions.every((c) => c.current >= c.target);
}

function completionRatio(a: Achievement): number {
  if (a.conditions.length === 0) return 0;
  let sum = 0;
  for (const c of a.conditions) {
    sum += Math.min(c.current / c.target, 1);
  }
  return sum / a.conditions.length;
}

// ── Public API ─────────────────────────────────────────────────────

export function createAchievementTracker(): AchievementTrackerState {
  const achievements: Record<string, Achievement> = {};
  for (const def of ACHIEVEMENT_POOL) {
    achievements[def.id] = {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      tier: def.tier,
      conditions: def.conditions.map((c) => ({
        type: c.type,
        target: c.target,
        current: 0,
      })),
      isUnlocked: false,
      reward: {
        coins: def.reward.coins,
        title: def.reward.title,
        claimed: false,
      },
    };
  }
  return { achievements, recentUnlocks: [], totalUnlocked: 0 };
}

export function updateProgress(
  state: AchievementTrackerState,
  conditionType: string,
  value: number,
): AchievementTrackerState {
  const next = cloneState(state);
  for (const a of Object.values(next.achievements)) {
    if (a.isUnlocked) continue;
    for (const c of a.conditions) {
      if (c.type === conditionType) {
        c.current = Math.max(c.current, value);
      }
    }
  }
  return next;
}

export function checkUnlocks(
  state: AchievementTrackerState,
  now?: number,
): { state: AchievementTrackerState; newUnlocks: string[] } {
  const next = cloneState(state);
  const newUnlocks: string[] = [];
  const timestamp = now ?? Date.now();

  for (const a of Object.values(next.achievements)) {
    if (a.isUnlocked) continue;
    if (isComplete(a)) {
      a.isUnlocked = true;
      a.unlockedAt = timestamp;
      newUnlocks.push(a.id);
      next.recentUnlocks.push(a.id);
      next.totalUnlocked += 1;
    }
  }
  return { state: next, newUnlocks };
}

export function getAchievement(
  state: AchievementTrackerState,
  id: string,
): Achievement | undefined {
  const a = state.achievements[id];
  return a ? cloneAchievement(a) : undefined;
}

export function getAchievementsByCategory(
  state: AchievementTrackerState,
  category: AchievementCategory,
): Achievement[] {
  return Object.values(state.achievements)
    .filter((a) => a.category === category)
    .map(cloneAchievement);
}

export function getAchievementsByTier(
  state: AchievementTrackerState,
  tier: AchievementTier,
): Achievement[] {
  return Object.values(state.achievements)
    .filter((a) => a.tier === tier)
    .map(cloneAchievement);
}

export function getUnlockedAchievements(
  state: AchievementTrackerState,
): Achievement[] {
  return Object.values(state.achievements)
    .filter((a) => a.isUnlocked)
    .map(cloneAchievement);
}

export function getLockedAchievements(
  state: AchievementTrackerState,
): Achievement[] {
  return Object.values(state.achievements)
    .filter((a) => !a.isUnlocked)
    .map(cloneAchievement);
}

export function getCompletionPercent(state: AchievementTrackerState): number {
  const total = Object.keys(state.achievements).length;
  if (total === 0) return 0;
  return (state.totalUnlocked / total) * 100;
}

export function getCategoryProgress(
  state: AchievementTrackerState,
  category: AchievementCategory,
): { unlocked: number; total: number; percent: number } {
  const all = Object.values(state.achievements).filter(
    (a) => a.category === category,
  );
  const unlocked = all.filter((a) => a.isUnlocked).length;
  const total = all.length;
  return {
    unlocked,
    total,
    percent: total === 0 ? 0 : (unlocked / total) * 100,
  };
}

export function getRecentUnlocks(
  state: AchievementTrackerState,
  limit?: number,
): string[] {
  const ids = state.recentUnlocks;
  if (limit === undefined || limit >= ids.length) return [...ids];
  return ids.slice(ids.length - limit);
}

export function claimReward(
  state: AchievementTrackerState,
  id: string,
): {
  state: AchievementTrackerState;
  reward: { coins: number; title?: string } | null;
} {
  const a = state.achievements[id];
  if (!a || !a.isUnlocked || a.reward.claimed) {
    return { state, reward: null };
  }
  const next = cloneState(state);
  next.achievements[id].reward.claimed = true;
  return {
    state: next,
    reward: { coins: a.reward.coins, title: a.reward.title },
  };
}

export function getTotalRewardCoins(state: AchievementTrackerState): number {
  let total = 0;
  for (const a of Object.values(state.achievements)) {
    if (a.isUnlocked && !a.reward.claimed) {
      total += a.reward.coins;
    }
  }
  return total;
}

export function getNearestAchievement(
  state: AchievementTrackerState,
): Achievement | null {
  let best: Achievement | null = null;
  let bestRatio = -1;

  for (const a of Object.values(state.achievements)) {
    if (a.isUnlocked) continue;
    const ratio = completionRatio(a);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = a;
    }
  }
  return best ? cloneAchievement(best) : null;
}

export function serialize(state: AchievementTrackerState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): AchievementTrackerState {
  const parsed = JSON.parse(json) as AchievementTrackerState;
  // Ensure structural integrity
  if (!parsed.achievements || typeof parsed.totalUnlocked !== "number") {
    throw new Error("Invalid AchievementTrackerState JSON");
  }
  return parsed;
}
