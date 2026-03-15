// ── Neon Survivors: Difficulty Modifier System ──
// Pure TypeScript — NO Phaser imports.
// Handles custom difficulty modifiers for replayability.
// All functions are pure and return new objects (immutable).

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type DifficultyPreset =
  | "easy"
  | "normal"
  | "hard"
  | "nightmare"
  | "custom";

export interface DifficultyModifier {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: "enemy" | "player" | "economy" | "time" | "special";
  readonly multipliers: Readonly<Record<string, number>>;
  readonly scoreMultiplier: number;
  readonly unlockCondition?: string;
  /** IDs of modifiers that conflict with this one */
  readonly conflicts?: readonly string[];
  /** IDs of modifiers this one bundles (for combo modifiers) */
  readonly includes?: readonly string[];
}

export interface DifficultyState {
  readonly preset: DifficultyPreset;
  readonly activeModifiers: readonly string[];
  readonly enemyHpMultiplier: number;
  readonly enemyDamageMultiplier: number;
  readonly enemySpeedMultiplier: number;
  readonly playerHpMultiplier: number;
  readonly xpMultiplier: number;
  readonly coinMultiplier: number;
  readonly spawnRateMultiplier: number;
  readonly scoreMultiplier: number;
}

export interface PlayerRecord {
  readonly totalRuns: number;
  readonly bestScore: number;
  readonly totalKills: number;
  readonly bossesDefeated: number;
  readonly completedPresets: readonly DifficultyPreset[];
  readonly minutesSurvived: number;
}

// ════════════════════════════════════════════════════════════════
// § MODIFIER REGISTRY
// ════════════════════════════════════════════════════════════════

const MODIFIERS: readonly DifficultyModifier[] = [
  // ── Enemy ──
  {
    id: "iron_hide",
    name: "Iron Hide",
    description: "Enemies have 50% more HP",
    category: "enemy",
    multipliers: { enemyHp: 1.5 },
    scoreMultiplier: 1.2,
    unlockCondition: "complete_normal",
  },
  {
    id: "berserker_enemies",
    name: "Berserker Enemies",
    description: "Enemies deal 30% more damage",
    category: "enemy",
    multipliers: { enemyDamage: 1.3 },
    scoreMultiplier: 1.15,
    unlockCondition: "complete_normal",
  },
  {
    id: "swarm",
    name: "Swarm",
    description: "40% faster spawn rate",
    category: "enemy",
    multipliers: { spawnRate: 1.4 },
    scoreMultiplier: 1.25,
    unlockCondition: "kill_1000",
  },
  {
    id: "speed_demons",
    name: "Speed Demons",
    description: "Enemies are 25% faster",
    category: "enemy",
    multipliers: { enemySpeed: 1.25 },
    scoreMultiplier: 1.1,
  },

  // ── Player ──
  {
    id: "glass_cannon",
    name: "Glass Cannon",
    description: "-50% player HP, +25% damage dealt",
    category: "player",
    multipliers: { playerHp: 0.5, playerDamage: 1.25 },
    scoreMultiplier: 1.3,
    unlockCondition: "complete_hard",
    conflicts: ["fragile"],
  },
  {
    id: "no_healing",
    name: "No Healing",
    description: "All regen and healing disabled",
    category: "player",
    multipliers: { healingRate: 0 },
    scoreMultiplier: 1.4,
    unlockCondition: "survive_8min",
  },
  {
    id: "slow_start",
    name: "Slow Start",
    description: "Start at level 0, no starting weapon",
    category: "player",
    multipliers: { startLevel: 0, startWeapon: 0 },
    scoreMultiplier: 1.5,
    unlockCondition: "complete_hard",
  },
  {
    id: "fragile",
    name: "Fragile",
    description: "Take 2x damage from all sources",
    category: "player",
    multipliers: { damageTaken: 2.0 },
    scoreMultiplier: 1.35,
    unlockCondition: "complete_normal",
    conflicts: ["glass_cannon"],
  },

  // ── Economy ──
  {
    id: "poverty",
    name: "Poverty",
    description: "-50% coin drops from enemies",
    category: "economy",
    multipliers: { coinDrop: 0.5 },
    scoreMultiplier: 1.2,
    conflicts: ["generous"],
  },
  {
    id: "expensive",
    name: "Expensive",
    description: "+100% shop prices",
    category: "economy",
    multipliers: { shopPrice: 2.0 },
    scoreMultiplier: 1.15,
  },
  {
    id: "generous",
    name: "Generous",
    description: "+50% all drops (makes game easier)",
    category: "economy",
    multipliers: { coinDrop: 1.5, xpDrop: 1.5 },
    scoreMultiplier: 0.8,
    conflicts: ["poverty"],
  },

  // ── Time ──
  {
    id: "speedrun",
    name: "Speedrun",
    description: "5 minute time limit to win",
    category: "time",
    multipliers: { timeLimit: 300 },
    scoreMultiplier: 1.5,
    unlockCondition: "complete_normal",
    conflicts: ["endless_night"],
  },
  {
    id: "overtime",
    name: "Overtime",
    description: "Waves come 30% faster",
    category: "time",
    multipliers: { waveSpeed: 1.3 },
    scoreMultiplier: 1.25,
  },
  {
    id: "endless_night",
    name: "Endless Night",
    description: "No breaks between waves",
    category: "time",
    multipliers: { waveBreak: 0 },
    scoreMultiplier: 1.6,
    unlockCondition: "survive_8min",
    conflicts: ["speedrun"],
  },

  // ── Special ──
  {
    id: "true_nightmare",
    name: "True Nightmare",
    description: "Iron Hide + Berserker + Swarm + Fragile combined",
    category: "special",
    multipliers: {
      enemyHp: 1.5,
      enemyDamage: 1.3,
      spawnRate: 1.4,
      damageTaken: 2.0,
    },
    scoreMultiplier: 3.0,
    unlockCondition: "complete_nightmare",
    includes: ["iron_hide", "berserker_enemies", "swarm", "fragile"],
    conflicts: [
      "iron_hide",
      "berserker_enemies",
      "swarm",
      "fragile",
      "glass_cannon",
    ],
  },
] as const;

const MODIFIER_MAP = new Map<string, DifficultyModifier>(
  MODIFIERS.map((m) => [m.id, m]),
);

// ════════════════════════════════════════════════════════════════
// § PRESET DEFINITIONS
// ════════════════════════════════════════════════════════════════

const PRESET_MODIFIERS: Readonly<Record<DifficultyPreset, readonly string[]>> =
  {
    easy: ["generous"],
    normal: [],
    hard: ["iron_hide", "swarm"],
    nightmare: ["iron_hide", "berserker_enemies", "swarm", "fragile"],
    custom: [],
  };

// ════════════════════════════════════════════════════════════════
// § DEFAULT STATE
// ════════════════════════════════════════════════════════════════

function defaultState(preset: DifficultyPreset): DifficultyState {
  return {
    preset,
    activeModifiers: [],
    enemyHpMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    playerHpMultiplier: 1.0,
    xpMultiplier: 1.0,
    coinMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
  };
}

// ════════════════════════════════════════════════════════════════
// § MULTIPLIER CALCULATION
// ════════════════════════════════════════════════════════════════

/**
 * Multiplier keys → DifficultyState field mapping.
 * Values stack multiplicatively.
 */
const MULTIPLIER_KEY_MAP: Readonly<Record<string, keyof DifficultyState>> = {
  enemyHp: "enemyHpMultiplier",
  enemyDamage: "enemyDamageMultiplier",
  enemySpeed: "enemySpeedMultiplier",
  playerHp: "playerHpMultiplier",
  xpDrop: "xpMultiplier",
  coinDrop: "coinMultiplier",
  spawnRate: "spawnRateMultiplier",
};

function recalculateState(
  preset: DifficultyPreset,
  modifierIds: readonly string[],
): DifficultyState {
  const combined = calculateCombinedMultipliers(modifierIds);
  return {
    preset,
    activeModifiers: [...modifierIds],
    enemyHpMultiplier: combined.enemyHp ?? 1.0,
    enemyDamageMultiplier: combined.enemyDamage ?? 1.0,
    enemySpeedMultiplier: combined.enemySpeed ?? 1.0,
    playerHpMultiplier: combined.playerHp ?? 1.0,
    xpMultiplier: combined.xpDrop ?? 1.0,
    coinMultiplier: combined.coinDrop ?? 1.0,
    spawnRateMultiplier: combined.spawnRate ?? 1.0,
    scoreMultiplier: getTotalScoreMultiplierFromIds(modifierIds),
  };
}

// ════════════════════════════════════════════════════════════════
// § PUBLIC API
// ════════════════════════════════════════════════════════════════

/**
 * Initialize difficulty from a preset.
 */
export function createDifficulty(preset: DifficultyPreset): DifficultyState {
  const mods = PRESET_MODIFIERS[preset];
  return recalculateState(preset, mods);
}

/**
 * Add a modifier, returning a new state with recalculated multipliers.
 * Returns the same state if modifier already active or not found.
 */
export function addModifier(
  state: DifficultyState,
  modifierId: string,
): DifficultyState {
  const mod = MODIFIER_MAP.get(modifierId);
  if (!mod) return state;
  if (state.activeModifiers.includes(modifierId)) return state;

  // Check conflicts
  if (mod.conflicts) {
    for (const conflict of mod.conflicts) {
      if (state.activeModifiers.includes(conflict)) return state;
    }
  }

  // Check if any active modifier conflicts with this one
  for (const activeId of state.activeModifiers) {
    const activeMod = MODIFIER_MAP.get(activeId);
    if (activeMod?.conflicts?.includes(modifierId)) return state;
  }

  const newMods = [...state.activeModifiers, modifierId];
  return recalculateState("custom", newMods);
}

/**
 * Remove a modifier, returning a new state with recalculated multipliers.
 */
export function removeModifier(
  state: DifficultyState,
  modifierId: string,
): DifficultyState {
  if (!state.activeModifiers.includes(modifierId)) return state;
  const newMods = state.activeModifiers.filter((id) => id !== modifierId);
  return recalculateState("custom", newMods);
}

/**
 * Get a modifier definition by ID.
 */
export function getModifier(
  modifierId: string,
): DifficultyModifier | undefined {
  return MODIFIER_MAP.get(modifierId);
}

/**
 * List all available modifiers.
 */
export function getAllModifiers(): readonly DifficultyModifier[] {
  return MODIFIERS;
}

/**
 * Calculate combined multipliers from a set of modifier IDs.
 * Multipliers stack multiplicatively for the same key.
 */
export function calculateCombinedMultipliers(
  modifierIds: readonly string[],
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const id of modifierIds) {
    const mod = MODIFIER_MAP.get(id);
    if (!mod) continue;

    for (const [key, value] of Object.entries(mod.multipliers)) {
      if (key in result) {
        result[key] *= value;
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Get total combined score multiplier for a state.
 */
export function getTotalScoreMultiplier(state: DifficultyState): number {
  return getTotalScoreMultiplierFromIds(state.activeModifiers);
}

function getTotalScoreMultiplierFromIds(
  modifierIds: readonly string[],
): number {
  let total = 1.0;
  for (const id of modifierIds) {
    const mod = MODIFIER_MAP.get(id);
    if (mod) {
      total *= mod.scoreMultiplier;
    }
  }
  // Round to 2 decimal places to avoid floating-point drift
  return Math.round(total * 100) / 100;
}

/**
 * Check whether a modifier is unlocked given a player record.
 */
export function isModifierUnlocked(
  modifierId: string,
  playerRecord: PlayerRecord,
): boolean {
  const mod = MODIFIER_MAP.get(modifierId);
  if (!mod) return false;
  if (!mod.unlockCondition) return true;

  switch (mod.unlockCondition) {
    case "complete_normal":
      return playerRecord.completedPresets.includes("normal");
    case "complete_hard":
      return playerRecord.completedPresets.includes("hard");
    case "complete_nightmare":
      return playerRecord.completedPresets.includes("nightmare");
    case "kill_1000":
      return playerRecord.totalKills >= 1000;
    case "survive_8min":
      return playerRecord.minutesSurvived >= 8;
    default:
      return false;
  }
}

/**
 * Get modifier IDs that a preset includes.
 */
export function getPresetModifiers(
  preset: DifficultyPreset,
): readonly string[] {
  return PRESET_MODIFIERS[preset];
}

/**
 * Get a 1-10 star difficulty rating based on active modifiers.
 */
export function getDifficultyRating(state: DifficultyState): number {
  const score = state.scoreMultiplier;

  if (score <= 0.8) return 1;
  if (score <= 1.0) return 2;
  if (score <= 1.15) return 3;
  if (score <= 1.3) return 4;
  if (score <= 1.5) return 5;
  if (score <= 1.8) return 6;
  if (score <= 2.2) return 7;
  if (score <= 2.8) return 8;
  if (score <= 3.5) return 9;
  return 10;
}

/**
 * Get modifiers that can still be added (no conflicts with active ones).
 */
export function getCompatibleModifiers(
  activeModifiers: readonly string[],
): readonly DifficultyModifier[] {
  return MODIFIERS.filter((mod) => {
    // Already active
    if (activeModifiers.includes(mod.id)) return false;

    // Check if this modifier conflicts with any active
    if (mod.conflicts) {
      for (const conflict of mod.conflicts) {
        if (activeModifiers.includes(conflict)) return false;
      }
    }

    // Check if any active modifier conflicts with this one
    for (const activeId of activeModifiers) {
      const activeMod = MODIFIER_MAP.get(activeId);
      if (activeMod?.conflicts?.includes(mod.id)) return false;
    }

    return true;
  });
}

/**
 * Rough survival chance estimate (0.0 to 1.0) based on multiplier stack.
 * Higher enemy multipliers + lower player multipliers = lower chance.
 */
export function estimateSurvivalChance(state: DifficultyState): number {
  // Threat = how much harder enemies are
  const threat =
    state.enemyHpMultiplier *
    state.enemyDamageMultiplier *
    state.enemySpeedMultiplier *
    state.spawnRateMultiplier;

  // Resilience = how strong the player is
  const resilience = state.playerHpMultiplier * state.xpMultiplier;

  // Base survival is resilience / threat, clamped to [0, 1]
  const raw = resilience / threat;
  return Math.round(Math.min(1.0, Math.max(0.0, raw)) * 100) / 100;
}

/**
 * Serialize difficulty state to a JSON string for persistence.
 */
export function serializeDifficulty(state: DifficultyState): string {
  return JSON.stringify({
    preset: state.preset,
    activeModifiers: [...state.activeModifiers],
  });
}

/**
 * Deserialize difficulty state from a JSON string.
 * Recalculates all multipliers from the stored modifier list.
 */
export function deserializeDifficulty(json: string): DifficultyState {
  const data = JSON.parse(json) as {
    preset: DifficultyPreset;
    activeModifiers: string[];
  };
  const validPresets: DifficultyPreset[] = [
    "easy",
    "normal",
    "hard",
    "nightmare",
    "custom",
  ];

  const preset = validPresets.includes(data.preset) ? data.preset : "custom";
  const validMods = (data.activeModifiers ?? []).filter((id: string) =>
    MODIFIER_MAP.has(id),
  );

  return recalculateState(preset, validMods);
}
