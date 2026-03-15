// ── Neon Survivors: Talent Tree Calculator ──
// Pure TypeScript — NO Phaser imports.
// Persistent talent/skill tree for meta-progression between runs.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type TalentCategory = "offense" | "defense" | "utility" | "special";

export interface Talent {
  id: string;
  name: string;
  description: string;
  category: TalentCategory;
  maxLevel: number;
  currentLevel: number;
  cost: number;
  prerequisites: string[];
  effects: Record<string, number>;
}

export interface TalentTreeState {
  talents: Talent[];
  availablePoints: number;
  totalSpent: number;
}

// ════════════════════════════════════════════════════════════════
// § TALENT DEFINITIONS (16+ across 4 categories)
// ════════════════════════════════════════════════════════════════

interface TalentDef {
  id: string;
  name: string;
  description: string;
  category: TalentCategory;
  maxLevel: number;
  cost: number;
  prerequisites: string[];
  effects: Record<string, number>;
}

const TALENT_DEFS: readonly TalentDef[] = [
  // ── Offense (5) ──
  {
    id: "atk_power",
    name: "Attack Power",
    description: "+5% damage per level",
    category: "offense",
    maxLevel: 5,
    cost: 1,
    prerequisites: [],
    effects: { damage: 5 },
  },
  {
    id: "crit_chance",
    name: "Critical Strike",
    description: "+3% crit chance per level",
    category: "offense",
    maxLevel: 5,
    cost: 2,
    prerequisites: [],
    effects: { critChance: 3 },
  },
  {
    id: "fire_rate",
    name: "Rapid Fire",
    description: "+4% fire rate per level",
    category: "offense",
    maxLevel: 5,
    cost: 1,
    prerequisites: [],
    effects: { fireRate: 4 },
  },
  {
    id: "piercing",
    name: "Piercing Rounds",
    description: "+1 pierce per level",
    category: "offense",
    maxLevel: 3,
    cost: 3,
    prerequisites: ["atk_power"],
    effects: { pierce: 1 },
  },
  {
    id: "multi_shot",
    name: "Multi-Shot",
    description: "+1 projectile per level",
    category: "offense",
    maxLevel: 3,
    cost: 4,
    prerequisites: ["fire_rate"],
    effects: { projectileCount: 1 },
  },

  // ── Defense (4) ──
  {
    id: "max_hp",
    name: "Vitality",
    description: "+10% HP per level",
    category: "defense",
    maxLevel: 5,
    cost: 1,
    prerequisites: [],
    effects: { maxHp: 10 },
  },
  {
    id: "armor",
    name: "Reinforced Plating",
    description: "+5 armor per level",
    category: "defense",
    maxLevel: 5,
    cost: 2,
    prerequisites: [],
    effects: { armor: 5 },
  },
  {
    id: "hp_regen",
    name: "Nano Repair",
    description: "+1 HP/s per level",
    category: "defense",
    maxLevel: 3,
    cost: 3,
    prerequisites: ["max_hp"],
    effects: { hpRegen: 1 },
  },
  {
    id: "dodge_chance",
    name: "Phase Shift",
    description: "+2% dodge chance per level",
    category: "defense",
    maxLevel: 5,
    cost: 2,
    prerequisites: [],
    effects: { dodgeChance: 2 },
  },

  // ── Utility (4) ──
  {
    id: "move_speed",
    name: "Overclock Legs",
    description: "+3% movement speed per level",
    category: "utility",
    maxLevel: 5,
    cost: 1,
    prerequisites: [],
    effects: { moveSpeed: 3 },
  },
  {
    id: "magnet_range",
    name: "Magnetic Pull",
    description: "+15% magnet range per level",
    category: "utility",
    maxLevel: 5,
    cost: 1,
    prerequisites: [],
    effects: { magnetRange: 15 },
  },
  {
    id: "xp_bonus",
    name: "Neural Link",
    description: "+5% XP gain per level",
    category: "utility",
    maxLevel: 5,
    cost: 2,
    prerequisites: ["move_speed"],
    effects: { xpBonus: 5 },
  },
  {
    id: "cooldown",
    name: "Chrono Compress",
    description: "-3% cooldown per level",
    category: "utility",
    maxLevel: 5,
    cost: 2,
    prerequisites: [],
    effects: { cooldownReduction: 3 },
  },

  // ── Special (4) — deeper prerequisite chains ──
  {
    id: "revive",
    name: "Second Chance",
    description: "+1 revive per level (requires Vitality + Nano Repair)",
    category: "special",
    maxLevel: 2,
    cost: 5,
    prerequisites: ["max_hp", "hp_regen"],
    effects: { revives: 1 },
  },
  {
    id: "area_bonus",
    name: "Blast Radius",
    description: "+10% AoE per level",
    category: "special",
    maxLevel: 3,
    cost: 3,
    prerequisites: ["atk_power"],
    effects: { areaBonus: 10 },
  },
  {
    id: "lucky_drops",
    name: "Lucky Chip",
    description: "+5% rare drop chance per level",
    category: "special",
    maxLevel: 3,
    cost: 3,
    prerequisites: ["xp_bonus"],
    effects: { rareDropChance: 5 },
  },
  {
    id: "combo_master",
    name: "Combo Protocol",
    description: "+0.5s combo window and +10% combo damage per level",
    category: "special",
    maxLevel: 3,
    cost: 4,
    prerequisites: ["crit_chance"],
    effects: { comboWindow: 0.5, comboDamage: 10 },
  },
] as const;

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function cloneTalent(t: Talent): Talent {
  return {
    ...t,
    prerequisites: [...t.prerequisites],
    effects: { ...t.effects },
  };
}

function cloneState(state: TalentTreeState): TalentTreeState {
  return {
    talents: state.talents.map(cloneTalent),
    availablePoints: state.availablePoints,
    totalSpent: state.totalSpent,
  };
}

function findTalent(talents: Talent[], talentId: string): Talent | undefined {
  return talents.find((t) => t.id === talentId);
}

// ════════════════════════════════════════════════════════════════
// § PUBLIC API
// ════════════════════════════════════════════════════════════════

/** Create a fresh talent tree with all talents at level 0. */
export function createTalentTree(initialPoints: number = 0): TalentTreeState {
  const talents: Talent[] = TALENT_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    maxLevel: def.maxLevel,
    currentLevel: 0,
    cost: def.cost,
    prerequisites: [...def.prerequisites],
    effects: { ...def.effects },
  }));
  return { talents, availablePoints: initialPoints, totalSpent: 0 };
}

/** Check whether prerequisites for a talent are met. */
export function isPrerequisiteMet(
  state: TalentTreeState,
  talentId: string,
): boolean {
  const talent = findTalent(state.talents, talentId);
  if (!talent) return false;
  for (const prereqId of talent.prerequisites) {
    const prereq = findTalent(state.talents, prereqId);
    if (!prereq || prereq.currentLevel <= 0) return false;
  }
  return true;
}

/** Check if a talent can be allocated (points, prerequisites, maxLevel). */
export function canAllocate(state: TalentTreeState, talentId: string): boolean {
  const talent = findTalent(state.talents, talentId);
  if (!talent) return false;
  if (talent.currentLevel >= talent.maxLevel) return false;
  if (state.availablePoints < talent.cost) return false;
  return isPrerequisiteMet(state, talentId);
}

/** Allocate one point into a talent. Returns new immutable state. */
export function allocateTalent(
  state: TalentTreeState,
  talentId: string,
): TalentTreeState {
  if (!canAllocate(state, talentId)) return state;

  const next = cloneState(state);
  const talent = findTalent(next.talents, talentId)!;
  talent.currentLevel += 1;
  next.availablePoints -= talent.cost;
  next.totalSpent += talent.cost;
  return next;
}

/** Deallocate one point from a talent. Returns new immutable state.
 *  Blocks deallocation if another allocated talent depends on this one
 *  and this talent would drop to level 0. */
export function deallocateTalent(
  state: TalentTreeState,
  talentId: string,
): TalentTreeState {
  const talent = findTalent(state.talents, talentId);
  if (!talent || talent.currentLevel <= 0) return state;

  // If dropping to 0, check no allocated talent depends on this one
  if (talent.currentLevel === 1) {
    for (const t of state.talents) {
      if (t.currentLevel > 0 && t.prerequisites.includes(talentId)) {
        return state; // blocked — dependent talent is allocated
      }
    }
  }

  const next = cloneState(state);
  const target = findTalent(next.talents, talentId)!;
  target.currentLevel -= 1;
  next.availablePoints += target.cost;
  next.totalSpent -= target.cost;
  return next;
}

/** Reset the entire tree — all talents to 0, all spent points refunded. */
export function resetTree(state: TalentTreeState): TalentTreeState {
  const next = cloneState(state);
  next.availablePoints += next.totalSpent;
  next.totalSpent = 0;
  for (const talent of next.talents) {
    talent.currentLevel = 0;
  }
  return next;
}

/** Get all talents in a specific category. */
export function getTalentsByCategory(
  state: TalentTreeState,
  category: TalentCategory,
): Talent[] {
  return state.talents.filter((t) => t.category === category);
}

/** Get all talents with currentLevel > 0. */
export function getUnlockedTalents(state: TalentTreeState): Talent[] {
  return state.talents.filter((t) => t.currentLevel > 0);
}

/** Sum all active talent effects into a single record.
 *  Each effect key is summed across all allocated talents
 *  (value = effect_value_per_level * currentLevel). */
export function getTalentEffects(
  state: TalentTreeState,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const talent of state.talents) {
    if (talent.currentLevel <= 0) continue;
    for (const [key, valuePerLevel] of Object.entries(talent.effects)) {
      result[key] = (result[key] ?? 0) + valuePerLevel * talent.currentLevel;
    }
  }
  return result;
}

/** Compute total cost to fully max out the tree from current state. */
export function getTotalCost(state: TalentTreeState): number {
  let total = 0;
  for (const talent of state.talents) {
    const remaining = talent.maxLevel - talent.currentLevel;
    total += remaining * talent.cost;
  }
  return total;
}

/** Get all talents that can currently be allocated (canAllocate = true). */
export function getAvailableTalents(state: TalentTreeState): Talent[] {
  return state.talents.filter((t) => canAllocate(state, t.id));
}
