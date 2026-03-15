// AchievementCalc.ts — pure TypeScript achievement system, NO Phaser imports

// ─── Types ───────────────────────────────────────────────────────────

export type AchievementCategory =
  | "combat"
  | "survival"
  | "collection"
  | "mastery"
  | "social"
  | "secret";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly tier: AchievementTier;
  readonly requirement: number;
  readonly progress: number;
  readonly unlocked: boolean;
  readonly unlockedAt: number | null;
  readonly rewardGold: number;
  readonly rewardXp: number;
}

export interface AchievementState {
  readonly achievements: readonly Achievement[];
  readonly totalUnlocked: number;
  readonly lastChecked: number;
}

// ─── Predefined Achievements ────────────────────────────────────────

interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly tier: AchievementTier;
  readonly requirement: number;
  readonly rewardGold: number;
  readonly rewardXp: number;
}

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  // ── Combat ──
  {
    id: "combat_kill_10",
    name: "First Steps",
    description: "Kill 10 enemies",
    category: "combat",
    tier: "bronze",
    requirement: 10,
    rewardGold: 50,
    rewardXp: 20,
  },
  {
    id: "combat_kill_100",
    name: "Centurion",
    description: "Kill 100 enemies",
    category: "combat",
    tier: "silver",
    requirement: 100,
    rewardGold: 200,
    rewardXp: 80,
  },
  {
    id: "combat_kill_500",
    name: "Slaughter Machine",
    description: "Kill 500 enemies",
    category: "combat",
    tier: "gold",
    requirement: 500,
    rewardGold: 500,
    rewardXp: 200,
  },
  {
    id: "combat_kill_1000",
    name: "Genocide Protocol",
    description: "Kill 1000 enemies",
    category: "combat",
    tier: "platinum",
    requirement: 1000,
    rewardGold: 1000,
    rewardXp: 500,
  },

  // ── Survival ──
  {
    id: "survival_1min",
    name: "Warm Up",
    description: "Survive 1 minute",
    category: "survival",
    tier: "bronze",
    requirement: 60,
    rewardGold: 30,
    rewardXp: 15,
  },
  {
    id: "survival_3min",
    name: "Holding On",
    description: "Survive 3 minutes",
    category: "survival",
    tier: "silver",
    requirement: 180,
    rewardGold: 100,
    rewardXp: 50,
  },
  {
    id: "survival_5min",
    name: "Iron Will",
    description: "Survive 5 minutes",
    category: "survival",
    tier: "gold",
    requirement: 300,
    rewardGold: 300,
    rewardXp: 120,
  },
  {
    id: "survival_10min",
    name: "Unkillable",
    description: "Survive 10 minutes",
    category: "survival",
    tier: "platinum",
    requirement: 600,
    rewardGold: 800,
    rewardXp: 400,
  },

  // ── Collection ──
  {
    id: "collect_10",
    name: "Scavenger",
    description: "Collect 10 items",
    category: "collection",
    tier: "bronze",
    requirement: 10,
    rewardGold: 40,
    rewardXp: 15,
  },
  {
    id: "collect_50",
    name: "Hoarder",
    description: "Collect 50 items",
    category: "collection",
    tier: "silver",
    requirement: 50,
    rewardGold: 150,
    rewardXp: 60,
  },
  {
    id: "collect_200",
    name: "Treasure Hunter",
    description: "Collect 200 items",
    category: "collection",
    tier: "gold",
    requirement: 200,
    rewardGold: 400,
    rewardXp: 180,
  },
  {
    id: "collect_500",
    name: "Dragon's Vault",
    description: "Collect 500 items",
    category: "collection",
    tier: "platinum",
    requirement: 500,
    rewardGold: 1200,
    rewardXp: 500,
  },

  // ── Mastery ──
  {
    id: "mastery_wave_5",
    name: "Apprentice",
    description: "Reach wave 5",
    category: "mastery",
    tier: "bronze",
    requirement: 5,
    rewardGold: 60,
    rewardXp: 25,
  },
  {
    id: "mastery_wave_10",
    name: "Journeyman",
    description: "Reach wave 10",
    category: "mastery",
    tier: "silver",
    requirement: 10,
    rewardGold: 200,
    rewardXp: 100,
  },
  {
    id: "mastery_wave_20",
    name: "Expert",
    description: "Reach wave 20",
    category: "mastery",
    tier: "gold",
    requirement: 20,
    rewardGold: 600,
    rewardXp: 250,
  },
  {
    id: "mastery_wave_50",
    name: "Grandmaster",
    description: "Reach wave 50",
    category: "mastery",
    tier: "platinum",
    requirement: 50,
    rewardGold: 1500,
    rewardXp: 600,
  },

  // ── Social ──
  {
    id: "social_share_1",
    name: "Show Off",
    description: "Share 1 result",
    category: "social",
    tier: "bronze",
    requirement: 1,
    rewardGold: 25,
    rewardXp: 10,
  },
  {
    id: "social_share_5",
    name: "Influencer",
    description: "Share 5 results",
    category: "social",
    tier: "silver",
    requirement: 5,
    rewardGold: 100,
    rewardXp: 40,
  },
  {
    id: "social_share_20",
    name: "Viral Star",
    description: "Share 20 results",
    category: "social",
    tier: "gold",
    requirement: 20,
    rewardGold: 350,
    rewardXp: 150,
  },

  // ── Secret ──
  {
    id: "secret_no_damage",
    name: "Untouchable",
    description: "Complete a wave without taking damage",
    category: "secret",
    tier: "gold",
    requirement: 1,
    rewardGold: 500,
    rewardXp: 250,
  },
  {
    id: "secret_speed_kill",
    name: "Lightning Strike",
    description: "Kill 50 enemies in 30 seconds",
    category: "secret",
    tier: "gold",
    requirement: 50,
    rewardGold: 400,
    rewardXp: 200,
  },
  {
    id: "secret_all_collect",
    name: "Completionist",
    description: "Collect every item type",
    category: "secret",
    tier: "platinum",
    requirement: 1,
    rewardGold: 2000,
    rewardXp: 1000,
  },
] as const;

// ─── State Factory ──────────────────────────────────────────────────

export function createAchievementState(
  now: number = Date.now(),
): AchievementState {
  const achievements: Achievement[] = ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    tier: def.tier,
    requirement: def.requirement,
    progress: 0,
    unlocked: false,
    unlockedAt: null,
    rewardGold: def.rewardGold,
    rewardXp: def.rewardXp,
  }));

  return {
    achievements,
    totalUnlocked: 0,
    lastChecked: now,
  };
}

// ─── Progress Checking ──────────────────────────────────────────────

export function checkProgress(
  state: AchievementState,
  category: AchievementCategory,
  amount: number,
  now: number = Date.now(),
): AchievementState {
  let changed = false;
  const updated = state.achievements.map((ach) => {
    if (ach.category !== category) return ach;
    if (ach.unlocked) return ach;

    const newProgress = Math.min(ach.requirement, ach.progress + amount);
    if (newProgress === ach.progress) return ach;

    changed = true;
    const shouldUnlock = newProgress >= ach.requirement;
    return {
      ...ach,
      progress: newProgress,
      unlocked: shouldUnlock,
      unlockedAt: shouldUnlock ? now : null,
    };
  });

  if (!changed) return state;

  const totalUnlocked = updated.filter((a) => a.unlocked).length;
  return {
    achievements: updated,
    totalUnlocked,
    lastChecked: now,
  };
}

// ─── Unlock / Reset ─────────────────────────────────────────────────

export function unlockAchievement(
  state: AchievementState,
  achievementId: string,
  now: number = Date.now(),
): AchievementState {
  const idx = state.achievements.findIndex((a) => a.id === achievementId);
  if (idx === -1) return state;
  const ach = state.achievements[idx];
  if (ach.unlocked) return state;

  const updated = [...state.achievements];
  updated[idx] = {
    ...ach,
    progress: ach.requirement,
    unlocked: true,
    unlockedAt: now,
  };

  return {
    achievements: updated,
    totalUnlocked: state.totalUnlocked + 1,
    lastChecked: now,
  };
}

export function resetProgress(state: AchievementState): AchievementState {
  const reset = state.achievements.map((ach) => ({
    ...ach,
    progress: 0,
    unlocked: false,
    unlockedAt: null,
  }));

  return {
    achievements: reset,
    totalUnlocked: 0,
    lastChecked: state.lastChecked,
  };
}

// ─── Queries ────────────────────────────────────────────────────────

export function getUnlocked(state: AchievementState): readonly Achievement[] {
  return state.achievements.filter((a) => a.unlocked);
}

export function getByCategory(
  state: AchievementState,
  category: AchievementCategory,
): readonly Achievement[] {
  return state.achievements.filter((a) => a.category === category);
}

export function getByTier(
  state: AchievementState,
  tier: AchievementTier,
): readonly Achievement[] {
  return state.achievements.filter((a) => a.tier === tier);
}

export function getCompletionPercent(state: AchievementState): number {
  if (state.achievements.length === 0) return 0;
  return (state.totalUnlocked / state.achievements.length) * 100;
}

export function getNextUnlockable(state: AchievementState): Achievement | null {
  const locked = state.achievements.filter((a) => !a.unlocked);
  if (locked.length === 0) return null;

  let best = locked[0];
  let bestRatio = best.progress / best.requirement;

  for (let i = 1; i < locked.length; i++) {
    const ratio = locked[i].progress / locked[i].requirement;
    if (ratio > bestRatio) {
      best = locked[i];
      bestRatio = ratio;
    }
  }

  return best;
}

export function getTotalRewards(state: AchievementState): {
  gold: number;
  xp: number;
} {
  let gold = 0;
  let xp = 0;
  for (const ach of state.achievements) {
    if (ach.unlocked) {
      gold += ach.rewardGold;
      xp += ach.rewardXp;
    }
  }
  return { gold, xp };
}

export function isUnlocked(
  state: AchievementState,
  achievementId: string,
): boolean {
  const ach = state.achievements.find((a) => a.id === achievementId);
  return ach ? ach.unlocked : false;
}
