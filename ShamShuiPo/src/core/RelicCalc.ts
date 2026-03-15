// ── Neon Survivors: Relic / Artifact System ──
// Pure TypeScript — NO Phaser imports. All functions pure/immutable.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type RelicRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface RelicEffect {
  stat: string;
  value: number;
  isPercent: boolean;
}

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  effects: RelicEffect[];
  maxStack: number;
  isPassive: boolean;
}

export interface RelicInstance {
  defId: string;
  level: number;
  stackCount: number;
  isActive: boolean;
}

export interface RelicState {
  owned: RelicInstance[];
  maxSlots: number;
  equipped: string[]; // defIds
}

// ════════════════════════════════════════════════════════════════
// § RELIC DEFINITIONS (12 across all rarities)
// ════════════════════════════════════════════════════════════════

export const RELIC_DEFS: ReadonlyArray<RelicDef> = [
  // ── Common (3) ──
  {
    id: "neon_shard",
    name: "Neon Shard",
    description: "A flickering crystal that slightly amplifies weapon output.",
    rarity: "common",
    effects: [{ stat: "damage", value: 5, isPercent: true }],
    maxStack: 5,
    isPassive: true,
  },
  {
    id: "pulse_coil",
    name: "Pulse Coil",
    description: "Electromagnetic coil that quickens reflexes.",
    rarity: "common",
    effects: [{ stat: "speed", value: 8, isPercent: true }],
    maxStack: 5,
    isPassive: true,
  },
  {
    id: "iron_plate",
    name: "Iron Plate",
    description: "Crude armor plating salvaged from the streets.",
    rarity: "common",
    effects: [{ stat: "armor", value: 3, isPercent: false }],
    maxStack: 5,
    isPassive: true,
  },

  // ── Rare (3) ──
  {
    id: "cyber_lens",
    name: "Cyber Lens",
    description: "Augmented optics that reveal enemy weak spots.",
    rarity: "rare",
    effects: [
      { stat: "crit_chance", value: 10, isPercent: true },
      { stat: "crit_damage", value: 15, isPercent: true },
    ],
    maxStack: 3,
    isPassive: true,
  },
  {
    id: "magnet_array",
    name: "Magnet Array",
    description: "High-power electromagnet that vacuums pickups.",
    rarity: "rare",
    effects: [{ stat: "magnet_range", value: 40, isPercent: true }],
    maxStack: 3,
    isPassive: true,
  },
  {
    id: "vita_pump",
    name: "Vita Pump",
    description: "Nanomachine injector that slowly restores health.",
    rarity: "rare",
    effects: [
      { stat: "hp_regen", value: 2, isPercent: false },
      { stat: "max_hp", value: 10, isPercent: false },
    ],
    maxStack: 3,
    isPassive: true,
  },

  // ── Epic (2) ──
  {
    id: "berserker_chip",
    name: "Berserker Chip",
    description: "Overclocks weapons as your health drops dangerously low.",
    rarity: "epic",
    effects: [
      { stat: "damage", value: 25, isPercent: true },
      { stat: "attack_speed", value: 15, isPercent: true },
    ],
    maxStack: 2,
    isPassive: false,
  },
  {
    id: "ghost_module",
    name: "Ghost Module",
    description: "Phase-shift system granting periodic invulnerability.",
    rarity: "epic",
    effects: [
      { stat: "dodge", value: 12, isPercent: true },
      { stat: "speed", value: 10, isPercent: true },
    ],
    maxStack: 2,
    isPassive: false,
  },

  // ── Legendary (2) ──
  {
    id: "thunder_core",
    name: "Thunder Core",
    description:
      "Unstable reactor that chains lightning between defeated foes.",
    rarity: "legendary",
    effects: [
      { stat: "damage", value: 30, isPercent: true },
      { stat: "area", value: 20, isPercent: true },
      { stat: "chain_lightning", value: 50, isPercent: false },
    ],
    maxStack: 1,
    isPassive: false,
  },
  {
    id: "phoenix_heart",
    name: "Phoenix Heart",
    description: "Emergency revival system that defies death once per run.",
    rarity: "legendary",
    effects: [
      { stat: "max_hp", value: 50, isPercent: false },
      { stat: "revive", value: 1, isPercent: false },
    ],
    maxStack: 1,
    isPassive: true,
  },

  // ── Mythic (2) ──
  {
    id: "quantum_dice",
    name: "Quantum Dice",
    description:
      "Chaotic quantum device that amplifies all stats unpredictably.",
    rarity: "mythic",
    effects: [
      { stat: "damage", value: 50, isPercent: true },
      { stat: "speed", value: 25, isPercent: true },
      { stat: "crit_chance", value: 20, isPercent: true },
      { stat: "luck", value: 30, isPercent: true },
    ],
    maxStack: 1,
    isPassive: false,
  },
  {
    id: "time_dilator",
    name: "Time Dilator",
    description:
      "Temporal distortion engine that warps the flow of combat itself.",
    rarity: "mythic",
    effects: [
      { stat: "cooldown_reduction", value: 35, isPercent: true },
      { stat: "attack_speed", value: 30, isPercent: true },
      { stat: "slow_aura", value: 40, isPercent: true },
    ],
    maxStack: 1,
    isPassive: false,
  },
];

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const RARITY_DROP_RATES: Record<RelicRarity, number> = {
  common: 0.45,
  rare: 0.28,
  epic: 0.15,
  legendary: 0.08,
  mythic: 0.04,
};

const RARITY_POWER_MULTIPLIER: Record<RelicRarity, number> = {
  common: 1,
  rare: 2,
  epic: 4,
  legendary: 8,
  mythic: 16,
};

// ════════════════════════════════════════════════════════════════
// § HELPER — lookup def
// ════════════════════════════════════════════════════════════════

function getDef(defId: string): RelicDef | undefined {
  return RELIC_DEFS.find((d) => d.id === defId);
}

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

/** Create an empty relic state with a given number of equip slots. */
export function createRelicState(maxSlots: number = 6): RelicState {
  return { owned: [], maxSlots, equipped: [] };
}

// ════════════════════════════════════════════════════════════════
// § MUTATION (immutable — return new state)
// ════════════════════════════════════════════════════════════════

/**
 * Add a relic to owned. If already owned and below maxStack, increment
 * stackCount instead. Returns unchanged state if def not found or
 * stack is already at max.
 */
export function addRelic(state: RelicState, defId: string): RelicState {
  const def = getDef(defId);
  if (!def) return state;

  const existing = state.owned.find((r) => r.defId === defId);
  if (existing) {
    if (existing.stackCount >= def.maxStack) return state;
    return {
      ...state,
      owned: state.owned.map((r) =>
        r.defId === defId ? { ...r, stackCount: r.stackCount + 1 } : r,
      ),
    };
  }

  const instance: RelicInstance = {
    defId,
    level: 1,
    stackCount: 1,
    isActive: true,
  };
  return { ...state, owned: [...state.owned, instance] };
}

/** Remove a relic from owned (and equipped if present). */
export function removeRelic(state: RelicState, defId: string): RelicState {
  return {
    ...state,
    owned: state.owned.filter((r) => r.defId !== defId),
    equipped: state.equipped.filter((id) => id !== defId),
  };
}

/**
 * Equip a relic. Must be owned, not already equipped, and slots available.
 * Returns unchanged state on failure.
 */
export function equipRelic(state: RelicState, defId: string): RelicState {
  if (!state.owned.some((r) => r.defId === defId)) return state;
  if (state.equipped.includes(defId)) return state;
  if (state.equipped.length >= state.maxSlots) return state;

  return { ...state, equipped: [...state.equipped, defId] };
}

/** Unequip a relic. Returns unchanged state if not equipped. */
export function unequipRelic(state: RelicState, defId: string): RelicState {
  if (!state.equipped.includes(defId)) return state;
  return { ...state, equipped: state.equipped.filter((id) => id !== defId) };
}

/**
 * Upgrade a relic (increase level by 1). Must be owned.
 * Returns unchanged state if not found.
 */
export function upgradeRelic(state: RelicState, defId: string): RelicState {
  if (!state.owned.some((r) => r.defId === defId)) return state;
  return {
    ...state,
    owned: state.owned.map((r) =>
      r.defId === defId ? { ...r, level: r.level + 1 } : r,
    ),
  };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Aggregate effects from all equipped relics. Each effect's value is
 * multiplied by (instance.level * instance.stackCount).
 */
export function getRelicEffects(state: RelicState): RelicEffect[] {
  const aggregated: Record<string, RelicEffect> = {};

  for (const defId of state.equipped) {
    const def = getDef(defId);
    const inst = state.owned.find((r) => r.defId === defId);
    if (!def || !inst) continue;

    const multiplier = inst.level * inst.stackCount;

    for (const eff of def.effects) {
      const key = `${eff.stat}_${eff.isPercent}`;
      if (aggregated[key]) {
        aggregated[key] = {
          ...aggregated[key],
          value: aggregated[key].value + eff.value * multiplier,
        };
      } else {
        aggregated[key] = {
          stat: eff.stat,
          value: eff.value * multiplier,
          isPercent: eff.isPercent,
        };
      }
    }
  }

  return Object.values(aggregated);
}

/** Filter owned relics by rarity. */
export function getRelicByRarity(
  state: RelicState,
  rarity: RelicRarity,
): RelicInstance[] {
  return state.owned.filter((r) => {
    const def = getDef(r.defId);
    return def !== undefined && def.rarity === rarity;
  });
}

/** Check if a relic is equipped. */
export function isRelicEquipped(state: RelicState, defId: string): boolean {
  return state.equipped.includes(defId);
}

/** Check if there are available equip slots. */
export function canEquipMore(state: RelicState): boolean {
  return state.equipped.length < state.maxSlots;
}

/**
 * Composite power score for a single relic instance.
 * Formula: sum(effect.value) * level * stackCount * rarityMultiplier
 */
export function getRelicPower(instance: RelicInstance): number {
  const def = getDef(instance.defId);
  if (!def) return 0;

  const baseValue = def.effects.reduce((sum, e) => sum + e.value, 0);
  const rarityMult = RARITY_POWER_MULTIPLIER[def.rarity];

  return baseValue * instance.level * instance.stackCount * rarityMult;
}

/** Sum power of all equipped relics. */
export function getTotalRelicPower(state: RelicState): number {
  let total = 0;
  for (const defId of state.equipped) {
    const inst = state.owned.find((r) => r.defId === defId);
    if (inst) total += getRelicPower(inst);
  }
  return total;
}

/** Drop probability for a given rarity tier. */
export function getRarityDropRate(rarity: RelicRarity): number {
  return RARITY_DROP_RATES[rarity];
}
