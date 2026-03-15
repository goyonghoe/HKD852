/**
 * QuestCalc — pure TypeScript quest/mission system.
 * NO Phaser imports. Immutable state management.
 *
 * Provides daily quest generation, progress tracking, completion detection,
 * and reward claiming for the Neon Survivors quest system.
 */

// ─── Types ───────────────────────────────────────────────────

export type QuestType =
  | "kill_enemies"
  | "survive_time"
  | "collect_items"
  | "reach_wave"
  | "deal_damage"
  | "use_ability";

export type QuestRarity = "common" | "rare" | "epic";

export interface QuestReward {
  readonly gold: number;
  readonly xp: number;
}

export interface Quest {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: QuestType;
  readonly rarity: QuestRarity;
  readonly target: number;
  readonly progress: number;
  readonly completed: boolean;
  readonly reward: QuestReward;
}

export interface QuestState {
  readonly activeQuests: readonly Quest[];
  readonly completedIds: readonly string[];
  readonly dailyResetTime: number;
}

// ─── PRNG ────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Quest Templates ─────────────────────────────────────────

interface QuestTemplate {
  readonly name: string;
  readonly description: string;
  readonly type: QuestType;
  readonly rarity: QuestRarity;
  readonly target: number;
  readonly reward: QuestReward;
}

const QUEST_TEMPLATES: readonly QuestTemplate[] = [
  // ── kill_enemies ──
  {
    name: "Street Sweeper",
    description: "Eliminate 30 enemies",
    type: "kill_enemies",
    rarity: "common",
    target: 30,
    reward: { gold: 50, xp: 30 },
  },
  {
    name: "Neon Hunter",
    description: "Eliminate 80 enemies",
    type: "kill_enemies",
    rarity: "rare",
    target: 80,
    reward: { gold: 120, xp: 70 },
  },
  {
    name: "Apocalypse Protocol",
    description: "Eliminate 200 enemies",
    type: "kill_enemies",
    rarity: "epic",
    target: 200,
    reward: { gold: 350, xp: 180 },
  },

  // ── survive_time ──
  {
    name: "Endurance Test",
    description: "Survive for 60 seconds",
    type: "survive_time",
    rarity: "common",
    target: 60,
    reward: { gold: 40, xp: 25 },
  },
  {
    name: "Iron Will",
    description: "Survive for 180 seconds",
    type: "survive_time",
    rarity: "rare",
    target: 180,
    reward: { gold: 100, xp: 60 },
  },

  // ── collect_items ──
  {
    name: "Scavenger",
    description: "Collect 20 items",
    type: "collect_items",
    rarity: "common",
    target: 20,
    reward: { gold: 35, xp: 20 },
  },
  {
    name: "Hoarder",
    description: "Collect 60 items",
    type: "collect_items",
    rarity: "rare",
    target: 60,
    reward: { gold: 90, xp: 55 },
  },
  {
    name: "Treasure Hunter",
    description: "Collect 150 items",
    type: "collect_items",
    rarity: "epic",
    target: 150,
    reward: { gold: 280, xp: 150 },
  },

  // ── reach_wave ──
  {
    name: "First Steps",
    description: "Reach wave 3",
    type: "reach_wave",
    rarity: "common",
    target: 3,
    reward: { gold: 30, xp: 20 },
  },
  {
    name: "Veteran Runner",
    description: "Reach wave 7",
    type: "reach_wave",
    rarity: "rare",
    target: 7,
    reward: { gold: 110, xp: 65 },
  },

  // ── deal_damage ──
  {
    name: "Damage Dealer",
    description: "Deal 500 total damage",
    type: "deal_damage",
    rarity: "common",
    target: 500,
    reward: { gold: 45, xp: 28 },
  },
  {
    name: "Wrecking Ball",
    description: "Deal 2000 total damage",
    type: "deal_damage",
    rarity: "rare",
    target: 2000,
    reward: { gold: 130, xp: 75 },
  },
  {
    name: "Extinction Event",
    description: "Deal 8000 total damage",
    type: "deal_damage",
    rarity: "epic",
    target: 8000,
    reward: { gold: 400, xp: 200 },
  },

  // ── use_ability ──
  {
    name: "Ability Novice",
    description: "Use abilities 5 times",
    type: "use_ability",
    rarity: "common",
    target: 5,
    reward: { gold: 30, xp: 18 },
  },
  {
    name: "Ability Master",
    description: "Use abilities 15 times",
    type: "use_ability",
    rarity: "rare",
    target: 15,
    reward: { gold: 85, xp: 50 },
  },
  {
    name: "Overdrive",
    description: "Use abilities 40 times",
    type: "use_ability",
    rarity: "epic",
    target: 40,
    reward: { gold: 300, xp: 160 },
  },
];

// ─── Constants ───────────────────────────────────────────────

const DAILY_QUEST_COUNT = 3;
const MS_PER_DAY = 86_400_000;

const RARITY_MULTIPLIERS: Record<QuestRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
};

// ─── Core Functions ──────────────────────────────────────────

/** Create an empty quest state with the given reset time (defaults to 0). */
export function createQuestState(dailyResetTime: number = 0): QuestState {
  return {
    activeQuests: [],
    completedIds: [],
    dailyResetTime,
  };
}

/**
 * Generate 3 daily quests based on a deterministic seed.
 * Same seed always produces the same quest selection.
 * Returns a new QuestState with the generated quests.
 */
export function generateDailyQuests(seed: number): QuestState {
  const rng = mulberry32(seed);
  const now = Date.now();
  const resetTime = now + MS_PER_DAY;

  // Fisher-Yates partial shuffle to pick DAILY_QUEST_COUNT unique templates
  const pool = [...QUEST_TEMPLATES];
  const count = Math.min(DAILY_QUEST_COUNT, pool.length);
  const selected: QuestTemplate[] = [];

  for (let i = 0; i < count; i++) {
    const remaining = pool.length - i;
    const idx = i + Math.floor(rng() * remaining);
    const tmp = pool[idx];
    pool[idx] = pool[i];
    pool[i] = tmp;
    selected.push(tmp);
  }

  const quests: Quest[] = selected.map((template, index) => ({
    id: `daily_${seed}_${index}`,
    name: template.name,
    description: template.description,
    type: template.type,
    rarity: template.rarity,
    target: template.target,
    progress: 0,
    completed: false,
    reward: template.reward,
  }));

  return {
    activeQuests: quests,
    completedIds: [],
    dailyResetTime: resetTime,
  };
}

/**
 * Update progress for all active quests matching the given type.
 * Does not update already-completed quests.
 * Returns a new immutable state.
 */
export function updateProgress(
  state: QuestState,
  type: QuestType,
  amount: number,
): QuestState {
  const updatedQuests = state.activeQuests.map((quest) => {
    if (quest.completed) return quest;
    if (quest.type !== type) return quest;
    const newProgress = quest.progress + amount;
    const nowComplete = newProgress >= quest.target;
    return {
      ...quest,
      progress: newProgress,
      completed: nowComplete,
    };
  });
  return {
    ...state,
    activeQuests: updatedQuests,
  };
}

/**
 * Claim reward for a completed quest by ID.
 * Moves quest from activeQuests to completedIds.
 * Returns the reward and updated state. Reward is null if quest
 * is not found, not completed, or already claimed.
 */
export function claimReward(
  state: QuestState,
  questId: string,
): { state: QuestState; reward: QuestReward | null } {
  const quest = state.activeQuests.find((q) => q.id === questId);
  if (!quest || !quest.completed) {
    return { state, reward: null };
  }
  if (state.completedIds.includes(questId)) {
    return { state, reward: null };
  }
  return {
    state: {
      activeQuests: state.activeQuests.filter((q) => q.id !== questId),
      completedIds: [...state.completedIds, questId],
      dailyResetTime: state.dailyResetTime,
    },
    reward: quest.reward,
  };
}

/** Check if a specific quest is complete (progress >= target). */
export function isQuestComplete(quest: Quest): boolean {
  return quest.progress >= quest.target;
}

/** Get completion percentage (0–100) for a quest. Clamped to 100. */
export function getCompletionPercent(quest: Quest): number {
  if (quest.target <= 0) return 100;
  return Math.min((quest.progress / quest.target) * 100, 100);
}

/** Get all active (non-completed) quests of a specific type. */
export function getActiveByType(
  state: QuestState,
  type: QuestType,
): readonly Quest[] {
  return state.activeQuests.filter((q) => q.type === type && !q.completed);
}

/**
 * Get the reward multiplier for a quest rarity.
 * common = 1x, rare = 2x, epic = 3x.
 */
export function getRewardMultiplier(rarity: QuestRarity): number {
  return RARITY_MULTIPLIERS[rarity];
}

/**
 * Reset daily quests. Clears active quests and generates new ones
 * using the provided seed. Preserves completedIds history.
 */
export function resetDailyQuests(state: QuestState, seed: number): QuestState {
  const fresh = generateDailyQuests(seed);
  return {
    activeQuests: fresh.activeQuests,
    completedIds: state.completedIds,
    dailyResetTime: fresh.dailyResetTime,
  };
}

/** Get all quest templates (for testing / UI display). */
export function getQuestTemplates(): readonly QuestTemplate[] {
  return QUEST_TEMPLATES;
}
