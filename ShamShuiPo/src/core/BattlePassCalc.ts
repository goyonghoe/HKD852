/**
 * BattlePassCalc — pure TypeScript, NO Phaser imports.
 * Seasonal battle pass progression with free/premium reward tracks.
 */

// ── Types ──────────────────────────────────────────────

export interface Reward {
  type:
    | "coins"
    | "gems"
    | "weapon_skin"
    | "character_skin"
    | "title"
    | "emote"
    | "xp_boost";
  id: string;
  amount: number;
}

export interface BattlePassTier {
  level: number;
  freeReward: Reward;
  premiumReward: Reward;
  xpRequired: number;
}

export interface BattlePassState {
  seasonId: string;
  currentLevel: number;
  currentXp: number;
  isPremium: boolean;
  claimedFree: Set<number>;
  claimedPremium: Set<number>;
  totalXpEarned: number;
}

export interface AddXpResult {
  state: BattlePassState;
  levelsGained: number;
}

export interface ClaimResult {
  state: BattlePassState;
  reward: Reward | null;
  success: boolean;
}

export interface UnclaimedRewards {
  free: number[];
  premium: number[];
}

// ── Constants ──────────────────────────────────────────

const MAX_LEVEL = 50;
const BASE_XP = 1000;
const XP_PER_LEVEL = 200;

// ── Functions ──────────────────────────────────────────

export function getMaxLevel(): number {
  return MAX_LEVEL;
}

export function getXpForLevel(level: number): number {
  return BASE_XP + level * XP_PER_LEVEL;
}

export function createBattlePass(
  seasonId: string,
  isPremium = false,
): BattlePassState {
  return {
    seasonId,
    currentLevel: 1,
    currentXp: 0,
    isPremium,
    claimedFree: new Set<number>(),
    claimedPremium: new Set<number>(),
    totalXpEarned: 0,
  };
}

export function addXp(state: BattlePassState, amount: number): AddXpResult {
  if (amount <= 0) {
    return { state: { ...state }, levelsGained: 0 };
  }

  let currentLevel = state.currentLevel;
  let currentXp = state.currentXp + amount;
  let levelsGained = 0;

  while (currentLevel < MAX_LEVEL) {
    const needed = getXpForLevel(currentLevel);
    if (currentXp >= needed) {
      currentXp -= needed;
      currentLevel++;
      levelsGained++;
    } else {
      break;
    }
  }

  // Cap XP at max level — no overflow
  if (currentLevel >= MAX_LEVEL) {
    currentLevel = MAX_LEVEL;
    currentXp = 0;
  }

  return {
    state: {
      ...state,
      currentLevel,
      currentXp,
      totalXpEarned: state.totalXpEarned + amount,
      claimedFree: new Set(state.claimedFree),
      claimedPremium: new Set(state.claimedPremium),
    },
    levelsGained,
  };
}

export function getCurrentLevel(state: BattlePassState): number {
  return state.currentLevel;
}

export function getXpProgress(state: BattlePassState): number {
  if (state.currentLevel >= MAX_LEVEL) return 1;
  const needed = getXpForLevel(state.currentLevel);
  if (needed <= 0) return 1;
  return state.currentXp / needed;
}

export function canClaimPremium(state: BattlePassState): boolean {
  return state.isPremium;
}

export function upgradeToPremium(state: BattlePassState): BattlePassState {
  return {
    ...state,
    isPremium: true,
    claimedFree: new Set(state.claimedFree),
    claimedPremium: new Set(state.claimedPremium),
  };
}

export function isSeasonComplete(state: BattlePassState): boolean {
  return state.currentLevel >= MAX_LEVEL;
}

export function getSeasonProgress(state: BattlePassState): number {
  return state.currentLevel / MAX_LEVEL;
}

export function getTierRewards(level: number): {
  free: Reward;
  premium: Reward;
} {
  return {
    free: generateFreeReward(level),
    premium: generatePremiumReward(level),
  };
}

export function claimReward(
  state: BattlePassState,
  level: number,
  type: "free" | "premium",
): ClaimResult {
  // Level must be reachable
  if (level < 1 || level > state.currentLevel) {
    return {
      state: {
        ...state,
        claimedFree: new Set(state.claimedFree),
        claimedPremium: new Set(state.claimedPremium),
      },
      reward: null,
      success: false,
    };
  }

  if (type === "premium" && !state.isPremium) {
    return {
      state: {
        ...state,
        claimedFree: new Set(state.claimedFree),
        claimedPremium: new Set(state.claimedPremium),
      },
      reward: null,
      success: false,
    };
  }

  const claimedSet = type === "free" ? state.claimedFree : state.claimedPremium;
  if (claimedSet.has(level)) {
    return {
      state: {
        ...state,
        claimedFree: new Set(state.claimedFree),
        claimedPremium: new Set(state.claimedPremium),
      },
      reward: null,
      success: false,
    };
  }

  const reward =
    type === "free" ? generateFreeReward(level) : generatePremiumReward(level);

  const newClaimedFree = new Set(state.claimedFree);
  const newClaimedPremium = new Set(state.claimedPremium);

  if (type === "free") {
    newClaimedFree.add(level);
  } else {
    newClaimedPremium.add(level);
  }

  return {
    state: {
      ...state,
      claimedFree: newClaimedFree,
      claimedPremium: newClaimedPremium,
    },
    reward,
    success: true,
  };
}

export function getUnclaimedRewards(
  state: BattlePassState,
  tiers: BattlePassTier[],
): UnclaimedRewards {
  const free: number[] = [];
  const premium: number[] = [];

  for (const tier of tiers) {
    if (tier.level > state.currentLevel) continue;
    if (!state.claimedFree.has(tier.level)) {
      free.push(tier.level);
    }
    if (state.isPremium && !state.claimedPremium.has(tier.level)) {
      premium.push(tier.level);
    }
  }

  return { free, premium };
}

export function generateTiers(): BattlePassTier[] {
  const tiers: BattlePassTier[] = [];
  for (let level = 1; level <= MAX_LEVEL; level++) {
    tiers.push({
      level,
      freeReward: generateFreeReward(level),
      premiumReward: generatePremiumReward(level),
      xpRequired: getXpForLevel(level),
    });
  }
  return tiers;
}

export function getTotalXpNeeded(): number {
  let total = 0;
  for (let level = 1; level < MAX_LEVEL; level++) {
    total += getXpForLevel(level);
  }
  return total;
}

// ── Internal reward generation ─────────────────────────

function generateFreeReward(level: number): Reward {
  // Level 50: legendary weapon skin
  if (level === MAX_LEVEL) {
    return { type: "weapon_skin", id: "ws_legendary_50", amount: 1 };
  }

  // Every 10 levels: weapon skin
  if (level % 10 === 0) {
    return {
      type: "weapon_skin",
      id: `ws_free_${level}`,
      amount: 1,
    };
  }

  // Every 5 levels: gem reward
  if (level % 5 === 0) {
    return {
      type: "gems",
      id: `gems_free_${level}`,
      amount: 10 + Math.floor(level / 5) * 5,
    };
  }

  // Every other level: coins (100–500 scaling)
  const coinAmount = 100 + Math.floor(((level - 1) / (MAX_LEVEL - 1)) * 400);
  return {
    type: "coins",
    id: `coins_free_${level}`,
    amount: coinAmount,
  };
}

function generatePremiumReward(level: number): Reward {
  // Level 50: mythic title
  if (level === MAX_LEVEL) {
    return { type: "title", id: "title_mythic_50", amount: 1 };
  }

  // Every 5 levels: character skin
  if (level % 5 === 0) {
    return {
      type: "character_skin",
      id: `cs_premium_${level}`,
      amount: 1,
    };
  }

  // Every other level: bonus coins
  const bonusCoins = 50 + Math.floor(((level - 1) / (MAX_LEVEL - 1)) * 200);
  return {
    type: "coins",
    id: `coins_premium_${level}`,
    amount: bonusCoins,
  };
}
