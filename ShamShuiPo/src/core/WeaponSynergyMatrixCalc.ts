// ════════════════════════════════════════════════════════════════
// WeaponSynergyMatrixCalc — pure TypeScript, NO Phaser imports
// Weapon combination/set bonuses when player holds specific combos
// ════════════════════════════════════════════════════════════════

export interface WeaponSetBonus {
  id: string;
  name: string;
  requiredWeapons: string[];
  bonusStat: string;
  bonusValue: number;
  isPercent: boolean;
  description: string;
}

export interface ActiveBonus {
  setId: string;
  stat: string;
  value: number;
  isPercent: boolean;
}

// ── Set Bonus Registry ─────────────────────────────────────────

const SET_BONUSES: WeaponSetBonus[] = [
  {
    id: "dual_blades",
    name: "Dual Blades",
    requiredWeapons: ["laser", "blade"],
    bonusStat: "attackSpeed",
    bonusValue: 15,
    isPercent: true,
    description: "+15% attack speed",
  },
  {
    id: "elemental_duo",
    name: "Elemental Duo",
    requiredWeapons: ["flame_thrower", "ice_beam"],
    bonusStat: "elementalDamage",
    bonusValue: 20,
    isPercent: true,
    description: "+20% elemental damage",
  },
  {
    id: "ranged_master",
    name: "Ranged Master",
    requiredWeapons: ["pistol", "sniper"],
    bonusStat: "projectileSpeed",
    bonusValue: 25,
    isPercent: true,
    description: "+25% projectile speed",
  },
  {
    id: "area_control",
    name: "Area Control",
    requiredWeapons: ["grenade", "flame_thrower"],
    bonusStat: "aoeRadius",
    bonusValue: 30,
    isPercent: true,
    description: "+30% AoE radius",
  },
  {
    id: "rapid_fire",
    name: "Rapid Fire",
    requiredWeapons: ["pistol", "smg"],
    bonusStat: "fireRate",
    bonusValue: 20,
    isPercent: true,
    description: "+20% fire rate",
  },
  {
    id: "heavy_hitter",
    name: "Heavy Hitter",
    requiredWeapons: ["sniper", "grenade"],
    bonusStat: "critDamage",
    bonusValue: 25,
    isPercent: true,
    description: "+25% crit damage",
  },
  {
    id: "tech_arsenal",
    name: "Tech Arsenal",
    requiredWeapons: ["laser", "drone"],
    bonusStat: "allDamage",
    bonusValue: 15,
    isPercent: true,
    description: "+15% all damage",
  },
  {
    id: "close_combat",
    name: "Close Combat",
    requiredWeapons: ["blade", "shotgun"],
    bonusStat: "damage",
    bonusValue: 20,
    isPercent: true,
    description: "+20% damage, -10% range",
  },
  {
    id: "full_auto",
    name: "Full Auto",
    requiredWeapons: ["smg", "drone"],
    bonusStat: "fireRate",
    bonusValue: 15,
    isPercent: true,
    description: "+15% fire rate, +10% duration",
  },
  {
    id: "arsenal_master",
    name: "Arsenal Master",
    requiredWeapons: ["pistol", "smg", "sniper"],
    bonusStat: "allStats",
    bonusValue: 10,
    isPercent: true,
    description: "+10% all stats (3-weapon set)",
  },
];

// ── Secondary bonuses for multi-bonus sets ─────────────────────

interface SecondaryBonus {
  setId: string;
  stat: string;
  value: number;
  isPercent: boolean;
}

const SECONDARY_BONUSES: SecondaryBonus[] = [
  { setId: "close_combat", stat: "range", value: -10, isPercent: true },
  { setId: "full_auto", stat: "duration", value: 10, isPercent: true },
];

// ── Public API ─────────────────────────────────────────────────

/** Returns all available set bonus definitions. */
export function getAllSets(): WeaponSetBonus[] {
  return [...SET_BONUSES];
}

/** Find all matching set bonuses for equipped weapons. */
export function getActiveBonuses(equippedWeapons: string[]): ActiveBonus[] {
  const equipped = new Set(equippedWeapons);
  const bonuses: ActiveBonus[] = [];

  for (const set of SET_BONUSES) {
    if (set.requiredWeapons.every((w) => equipped.has(w))) {
      bonuses.push({
        setId: set.id,
        stat: set.bonusStat,
        value: set.bonusValue,
        isPercent: set.isPercent,
      });

      // Add secondary bonuses if any
      for (const secondary of SECONDARY_BONUSES) {
        if (secondary.setId === set.id) {
          bonuses.push({
            setId: set.id,
            stat: secondary.stat,
            value: secondary.value,
            isPercent: secondary.isPercent,
          });
        }
      }
    }
  }

  return bonuses;
}

/** Aggregate total bonus value for a specific stat. */
export function getStatBonus(bonuses: ActiveBonus[], stat: string): number {
  let total = 0;
  for (const b of bonuses) {
    if (b.stat === stat) {
      total += b.value;
    }
  }
  return total;
}

/** Record of all stat bonuses aggregated. */
export function getAllStatBonuses(
  bonuses: ActiveBonus[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const b of bonuses) {
    result[b.stat] = (result[b.stat] ?? 0) + b.value;
  }
  return result;
}

/** Check whether a specific set bonus is active. */
export function hasSetBonus(equippedWeapons: string[], setId: string): boolean {
  const set = SET_BONUSES.find((s) => s.id === setId);
  if (!set) return false;
  const equipped = new Set(equippedWeapons);
  return set.requiredWeapons.every((w) => equipped.has(w));
}

/** Returns weapons needed to complete a specific set. */
export function getMissingWeapons(
  equippedWeapons: string[],
  setId: string,
): string[] {
  const set = SET_BONUSES.find((s) => s.id === setId);
  if (!set) return [];
  const equipped = new Set(equippedWeapons);
  return set.requiredWeapons.filter((w) => !equipped.has(w));
}

/** Returns sets where player has at least 1 required weapon. */
export function getPartialSets(equippedWeapons: string[]): WeaponSetBonus[] {
  const equipped = new Set(equippedWeapons);
  return SET_BONUSES.filter(
    (set) =>
      set.requiredWeapons.some((w) => equipped.has(w)) &&
      !set.requiredWeapons.every((w) => equipped.has(w)),
  );
}

/** Returns 0-1 completion progress for a set. */
export function getSetCompletionPercent(
  equippedWeapons: string[],
  setId: string,
): number {
  const set = SET_BONUSES.find((s) => s.id === setId);
  if (!set) return 0;
  const equipped = new Set(equippedWeapons);
  const matched = set.requiredWeapons.filter((w) => equipped.has(w)).length;
  return matched / set.requiredWeapons.length;
}

/** Returns the highest-value active set bonus. */
export function getBestAvailableSet(
  equippedWeapons: string[],
): WeaponSetBonus | null {
  const equipped = new Set(equippedWeapons);
  let best: WeaponSetBonus | null = null;
  let bestValue = -Infinity;

  for (const set of SET_BONUSES) {
    if (set.requiredWeapons.every((w) => equipped.has(w))) {
      if (set.bonusValue > bestValue) {
        bestValue = set.bonusValue;
        best = set;
      }
    }
  }

  return best;
}

/** Suggest a weapon that would complete the most partial sets. */
export function getRecommendedWeapon(equippedWeapons: string[]): string | null {
  const equipped = new Set(equippedWeapons);

  // Count how many sets each missing weapon would complete
  const completionCount: Record<string, number> = {};

  for (const set of SET_BONUSES) {
    const missing = set.requiredWeapons.filter((w) => !equipped.has(w));
    // If exactly 1 weapon missing, adding it would complete the set
    if (missing.length === 1) {
      const weapon = missing[0];
      completionCount[weapon] = (completionCount[weapon] ?? 0) + 1;
    }
  }

  // If no single weapon completes a set, look at partial progress
  if (Object.keys(completionCount).length === 0) {
    const partialCount: Record<string, number> = {};
    for (const set of SET_BONUSES) {
      const missing = set.requiredWeapons.filter((w) => !equipped.has(w));
      if (missing.length > 0 && missing.length < set.requiredWeapons.length) {
        for (const w of missing) {
          partialCount[w] = (partialCount[w] ?? 0) + 1;
        }
      }
    }

    let bestWeapon: string | null = null;
    let bestCount = 0;
    for (const [weapon, count] of Object.entries(partialCount)) {
      if (count > bestCount) {
        bestCount = count;
        bestWeapon = weapon;
      }
    }
    return bestWeapon;
  }

  // Return weapon that completes the most sets
  let bestWeapon: string | null = null;
  let bestCount = 0;
  for (const [weapon, count] of Object.entries(completionCount)) {
    if (count > bestCount) {
      bestCount = count;
      bestWeapon = weapon;
    }
  }

  return bestWeapon;
}
