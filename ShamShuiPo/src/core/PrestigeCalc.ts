// ── Neon Survivors: Prestige / Ascension Calculator ──
// Pure TypeScript — NO Phaser imports.
// Handles long-term meta progression: prestige levels, permanent perks, lifetime stats.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface PrestigeState {
  level: number;
  totalPrestigeXp: number;
  currentPrestigeXp: number;
  xpToNextLevel: number;
  permanentBonuses: Record<string, number>;
  lifetimeRuns: number;
  lifetimeKills: number;
  lifetimeCoins: number;
  lifetimeScore: number;
  prestigeTokens: number;
}

export interface PrestigePerk {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effectPerLevel: number;
  stat: string;
}

export interface PurchaseResult {
  state: PrestigeState;
  success: boolean;
  reason: string;
}

export interface LifetimeStats {
  lifetimeRuns: number;
  lifetimeKills: number;
  lifetimeCoins: number;
  lifetimeScore: number;
  prestigeLevel: number;
  prestigeTokens: number;
  totalPerks: number;
}

// ════════════════════════════════════════════════════════════════
// § PERK DEFINITIONS
// ════════════════════════════════════════════════════════════════

export const PRESTIGE_PERKS: readonly PrestigePerk[] = [
  {
    id: "base_damage",
    name: "Neural Amplifier",
    description: "+2% damage per level",
    cost: 1,
    maxLevel: 10,
    currentLevel: 0,
    effectPerLevel: 0.02,
    stat: "damage",
  },
  {
    id: "base_hp",
    name: "Subdermal Plating",
    description: "+3% HP per level",
    cost: 1,
    maxLevel: 10,
    currentLevel: 0,
    effectPerLevel: 0.03,
    stat: "hp",
  },
  {
    id: "starting_coins",
    name: "Credit Line",
    description: "+50 coins per level",
    cost: 2,
    maxLevel: 5,
    currentLevel: 0,
    effectPerLevel: 50,
    stat: "startingCoins",
  },
  {
    id: "xp_gain",
    name: "Cortex Boost",
    description: "+5% XP per level",
    cost: 1,
    maxLevel: 10,
    currentLevel: 0,
    effectPerLevel: 0.05,
    stat: "xpGain",
  },
  {
    id: "coin_gain",
    name: "Loot Scanner",
    description: "+5% coins per level",
    cost: 1,
    maxLevel: 10,
    currentLevel: 0,
    effectPerLevel: 0.05,
    stat: "coinGain",
  },
  {
    id: "crit_chance",
    name: "Targeting Matrix",
    description: "+1% crit per level",
    cost: 2,
    maxLevel: 5,
    currentLevel: 0,
    effectPerLevel: 0.01,
    stat: "critChance",
  },
  {
    id: "move_speed",
    name: "Reflex Wiring",
    description: "+2% speed per level",
    cost: 2,
    maxLevel: 5,
    currentLevel: 0,
    effectPerLevel: 0.02,
    stat: "moveSpeed",
  },
  {
    id: "weapon_slots",
    name: "Hardpoint Mount",
    description: "+1 weapon slot per level",
    cost: 5,
    maxLevel: 2,
    currentLevel: 0,
    effectPerLevel: 1,
    stat: "weaponSlots",
  },
  {
    id: "starting_level",
    name: "Memory Upload",
    description: "Start at level X",
    cost: 3,
    maxLevel: 3,
    currentLevel: 0,
    effectPerLevel: 1,
    stat: "startingLevel",
  },
  {
    id: "luck",
    name: "Probability Engine",
    description: "+3% rare drop per level",
    cost: 2,
    maxLevel: 5,
    currentLevel: 0,
    effectPerLevel: 0.03,
    stat: "luck",
  },
] as const;

// ════════════════════════════════════════════════════════════════
// § PRESTIGE THRESHOLDS
// ════════════════════════════════════════════════════════════════

const PRESTIGE_THRESHOLDS: readonly number[] = [
  50_000, // Prestige 1
  200_000, // Prestige 2
  500_000, // Prestige 3
];

function getPrestigeScoreThreshold(level: number): number {
  if (level <= 0) return 0;
  if (level <= PRESTIGE_THRESHOLDS.length) {
    return PRESTIGE_THRESHOLDS[level - 1];
  }
  // Each subsequent: previous * 2.5
  const lastFixed = PRESTIGE_THRESHOLDS[PRESTIGE_THRESHOLDS.length - 1];
  let threshold = lastFixed;
  for (let i = PRESTIGE_THRESHOLDS.length; i < level; i++) {
    threshold = Math.floor(threshold * 2.5);
  }
  return threshold;
}

// ════════════════════════════════════════════════════════════════
// § CORE FUNCTIONS
// ════════════════════════════════════════════════════════════════

/** Creates a fresh prestige state at level 0 with no bonuses. */
export function createPrestigeState(): PrestigeState {
  return {
    level: 0,
    totalPrestigeXp: 0,
    currentPrestigeXp: 0,
    xpToNextLevel: getPrestigeXpRequired(0),
    permanentBonuses: {},
    lifetimeRuns: 0,
    lifetimeKills: 0,
    lifetimeCoins: 0,
    lifetimeScore: 0,
    prestigeTokens: 0,
  };
}

/**
 * Adds run results to lifetime totals and accumulates prestige XP.
 * Prestige XP = score (1:1 mapping).
 * Level does NOT auto-increment — use performPrestige() to level up.
 * Returns a new immutable state.
 */
export function addRunResults(
  state: PrestigeState,
  score: number,
  kills: number,
  coins: number,
): PrestigeState {
  const newTotalXp = state.totalPrestigeXp + score;
  const spentXp = getTotalXpForLevel(state.level);
  const currentXp = newTotalXp - spentXp;

  return {
    ...state,
    lifetimeRuns: state.lifetimeRuns + 1,
    lifetimeKills: state.lifetimeKills + kills,
    lifetimeCoins: state.lifetimeCoins + coins,
    lifetimeScore: state.lifetimeScore + score,
    totalPrestigeXp: newTotalXp,
    currentPrestigeXp: currentXp,
    xpToNextLevel: getPrestigeXpRequired(state.level),
  };
}

/** Returns true if the player's lifetime score meets the next prestige threshold. */
export function canPrestige(state: PrestigeState): boolean {
  const nextLevel = state.level + 1;
  const threshold = getPrestigeScoreThreshold(nextLevel);
  return state.lifetimeScore >= threshold;
}

/**
 * Performs prestige: increments level, grants tokens, keeps permanent bonuses.
 * Does not reset lifetime stats (those are permanent records).
 * Returns a new immutable state.
 */
export function performPrestige(state: PrestigeState): PrestigeState {
  if (!canPrestige(state)) {
    return state; // Cannot prestige — return unchanged
  }

  const newLevel = state.level + 1;
  const tokensEarned = getPrestigeTokensForLevel(newLevel);

  return {
    ...state,
    level: newLevel,
    prestigeTokens: state.prestigeTokens + tokensEarned,
    xpToNextLevel: getPrestigeXpRequired(newLevel),
  };
}

// ════════════════════════════════════════════════════════════════
// § XP & LEVEL CALCULATIONS
// ════════════════════════════════════════════════════════════════

/** Exponential XP requirement: 1000 * (2 ^ level). */
export function getPrestigeXpRequired(level: number): number {
  if (level < 0) return Infinity;
  return 1000 * Math.pow(2, level);
}

/** Total cumulative XP required to reach a given level from 0. */
function getTotalXpForLevel(level: number): number {
  // Sum of geometric series: 1000 * (2^0 + 2^1 + ... + 2^(level-1)) = 1000 * (2^level - 1)
  if (level <= 0) return 0;
  return 1000 * (Math.pow(2, level) - 1);
}

/** Calculate prestige level from total accumulated XP. */
export function getPrestigeLevel(totalXp: number): number {
  if (totalXp <= 0) return 0;
  // totalXp >= 1000 * (2^level - 1)  =>  level = floor(log2(totalXp/1000 + 1))
  const level = Math.floor(Math.log2(totalXp / 1000 + 1));
  return Math.max(0, level);
}

/** Tokens earned for reaching a specific prestige level. */
export function getPrestigeTokensForLevel(level: number): number {
  if (level <= 0) return 0;
  return level * 3;
}

// ════════════════════════════════════════════════════════════════
// § PERK SYSTEM
// ════════════════════════════════════════════════════════════════

function findPerk(perkId: string): PrestigePerk | undefined {
  return PRESTIGE_PERKS.find((p) => p.id === perkId);
}

function getPerkLevel(state: PrestigeState, perkId: string): number {
  return state.permanentBonuses[perkId] ?? 0;
}

/** Spend tokens to purchase one level of a permanent perk. */
export function purchasePerk(
  state: PrestigeState,
  perkId: string,
): PurchaseResult {
  const perk = findPerk(perkId);
  if (!perk) {
    return { state, success: false, reason: `Unknown perk: ${perkId}` };
  }

  const currentLevel = getPerkLevel(state, perkId);
  if (currentLevel >= perk.maxLevel) {
    return {
      state,
      success: false,
      reason: `${perk.name} is already at max level`,
    };
  }

  if (state.prestigeTokens < perk.cost) {
    return {
      state,
      success: false,
      reason: `Not enough tokens: have ${state.prestigeTokens}, need ${perk.cost}`,
    };
  }

  const newBonuses = {
    ...state.permanentBonuses,
    [perkId]: currentLevel + 1,
  };

  const newState: PrestigeState = {
    ...state,
    prestigeTokens: state.prestigeTokens - perk.cost,
    permanentBonuses: newBonuses,
  };

  return { state: newState, success: true, reason: "ok" };
}

// ════════════════════════════════════════════════════════════════
// § BONUS QUERIES
// ════════════════════════════════════════════════════════════════

/** Get the computed bonus value for a specific stat from purchased perks. */
export function getPermanentBonus(state: PrestigeState, stat: string): number {
  let total = 0;
  for (const perk of PRESTIGE_PERKS) {
    if (perk.stat === stat) {
      const level = getPerkLevel(state, perk.id);
      total += level * perk.effectPerLevel;
    }
  }
  return total;
}

/** Get all permanent bonuses as a Record<stat, value>. */
export function getAllBonuses(state: PrestigeState): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const perk of PRESTIGE_PERKS) {
    const level = getPerkLevel(state, perk.id);
    if (level > 0) {
      const stat = perk.stat;
      bonuses[stat] = (bonuses[stat] ?? 0) + level * perk.effectPerLevel;
    }
  }
  return bonuses;
}

/** Global multiplier based on prestige level: 1 + level * 0.05. */
export function getPrestigeMultiplier(state: PrestigeState): number {
  return 1 + state.level * 0.05;
}

// ════════════════════════════════════════════════════════════════
// § LIFETIME STATS
// ════════════════════════════════════════════════════════════════

/** Formatted lifetime statistics summary. */
export function getLifetimeStats(state: PrestigeState): LifetimeStats {
  const totalPerks = Object.values(state.permanentBonuses).reduce(
    (sum, v) => sum + v,
    0,
  );

  return {
    lifetimeRuns: state.lifetimeRuns,
    lifetimeKills: state.lifetimeKills,
    lifetimeCoins: state.lifetimeCoins,
    lifetimeScore: state.lifetimeScore,
    prestigeLevel: state.level,
    prestigeTokens: state.prestigeTokens,
    totalPerks,
  };
}

/** Estimate runs needed to reach next prestige based on average score. */
export function estimateRunsToPrestige(state: PrestigeState): number {
  if (state.lifetimeRuns === 0) return Infinity;

  const nextThreshold = getPrestigeScoreThreshold(state.level + 1);
  const remaining = nextThreshold - state.lifetimeScore;
  if (remaining <= 0) return 0;

  const avgScore = state.lifetimeScore / state.lifetimeRuns;
  if (avgScore <= 0) return Infinity;

  return Math.ceil(remaining / avgScore);
}

// ════════════════════════════════════════════════════════════════
// § SERIALIZATION
// ════════════════════════════════════════════════════════════════

/** Serialize prestige state to JSON string. */
export function serializePrestige(state: PrestigeState): string {
  return JSON.stringify(state);
}

/** Deserialize prestige state from JSON string. Falls back to fresh state on error. */
export function deserializePrestige(json: string): PrestigeState {
  try {
    const parsed = JSON.parse(json) as Partial<PrestigeState>;
    const defaults = createPrestigeState();

    return {
      level: typeof parsed.level === "number" ? parsed.level : defaults.level,
      totalPrestigeXp:
        typeof parsed.totalPrestigeXp === "number"
          ? parsed.totalPrestigeXp
          : defaults.totalPrestigeXp,
      currentPrestigeXp:
        typeof parsed.currentPrestigeXp === "number"
          ? parsed.currentPrestigeXp
          : defaults.currentPrestigeXp,
      xpToNextLevel:
        typeof parsed.xpToNextLevel === "number"
          ? parsed.xpToNextLevel
          : defaults.xpToNextLevel,
      permanentBonuses:
        parsed.permanentBonuses &&
        typeof parsed.permanentBonuses === "object" &&
        !Array.isArray(parsed.permanentBonuses)
          ? parsed.permanentBonuses
          : defaults.permanentBonuses,
      lifetimeRuns:
        typeof parsed.lifetimeRuns === "number"
          ? parsed.lifetimeRuns
          : defaults.lifetimeRuns,
      lifetimeKills:
        typeof parsed.lifetimeKills === "number"
          ? parsed.lifetimeKills
          : defaults.lifetimeKills,
      lifetimeCoins:
        typeof parsed.lifetimeCoins === "number"
          ? parsed.lifetimeCoins
          : defaults.lifetimeCoins,
      lifetimeScore:
        typeof parsed.lifetimeScore === "number"
          ? parsed.lifetimeScore
          : defaults.lifetimeScore,
      prestigeTokens:
        typeof parsed.prestigeTokens === "number"
          ? parsed.prestigeTokens
          : defaults.prestigeTokens,
    };
  } catch {
    return createPrestigeState();
  }
}
