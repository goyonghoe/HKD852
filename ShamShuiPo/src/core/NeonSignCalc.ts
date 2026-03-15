// ── Neon Survivors: Neon Sign Combo Calculations ──
// Pure TypeScript — NO Phaser imports.

import { NEON_SIGNS, WEAPON_FRAGMENT_AFFINITY } from "../config/balance";
import type {
  FragmentType,
  NeonBuff,
  NeonComboResult,
  NeonEffect,
} from "../types/game";

// Re-export types for convenience
export type { FragmentType, NeonBuff, NeonComboResult, NeonEffect };

// ════════════════════════════════════════════════════════════════
// § FRAGMENT DROP
// ════════════════════════════════════════════════════════════════

/**
 * Determine if a killed enemy should drop a neon fragment.
 * Uses Math.random internally; pass a custom rng for testing.
 */
export function shouldDropFragment(
  _killCount: number,
  rng: () => number = Math.random,
): boolean {
  return rng() < NEON_SIGNS.fragmentDropChance;
}

// ════════════════════════════════════════════════════════════════
// § WEAPON-FRAGMENT AFFINITY DROP
// ════════════════════════════════════════════════════════════════

/**
 * Get the adjusted drop chance for fragments based on weapon affinity.
 * The base drop chance is boosted if the weapon has a primary or secondary
 * affinity that benefits drop rate.
 *
 * NOTE: This returns the base fragment drop chance adjusted for the weapon's
 * affinity (i.e. does this weapon make fragments drop more often?).
 * The affinity system primarily affects *which* fragment type drops, not
 * whether a fragment drops — but weapons with affinity may nudge the
 * drop check slightly. This function exposes the base rate since drop
 * decisions are uniform; use getAffinityFragmentWeights for type selection.
 */
export function getAffinityDropChance(_weaponId: string): number {
  // Base drop chance is uniform regardless of weapon.
  // Affinity affects fragment TYPE distribution, not whether a fragment drops.
  return NEON_SIGNS.fragmentDropChance;
}

/**
 * Returns a weight map for each fragment type given the active weapon's
 * affinity. Weights are relative probabilities (they will be normalised
 * before use). A type with no affinity bonus gets weight 1.0.
 *
 * SPEC-034 §4.3: Each weapon has exactly ONE PRIMARY affinity.
 * Primary affinity adds NEON_SIGNS.primaryAffinityBonus (0.40).
 * There is no secondary affinity in SPEC-034.
 */
export function getAffinityFragmentWeights(
  weaponId: string,
): Record<FragmentType, number> {
  const types = NEON_SIGNS.fragmentTypes as readonly FragmentType[];
  const affinity = WEAPON_FRAGMENT_AFFINITY[weaponId];

  const weights = {} as Record<FragmentType, number>;
  for (const t of types) {
    let w = 1.0;
    if (affinity) {
      if (t === affinity.primary) w += NEON_SIGNS.primaryAffinityBonus;
      // No secondary affinity per SPEC-034 §4.3
    }
    weights[t] = w;
  }
  return weights;
}

/**
 * Pick a random fragment type using weapon affinity weights.
 * Weapons with affinity will have a higher chance of dropping their
 * primary/secondary fragments.
 *
 * @param weaponId  The ID of the currently active / last-used weapon.
 * @param rng       Optional deterministic RNG for testing (defaults to Math.random).
 */
export function getRandomFragmentWithAffinity(
  weaponId: string,
  rng: () => number = Math.random,
): FragmentType {
  const weights = getAffinityFragmentWeights(weaponId);
  const types = NEON_SIGNS.fragmentTypes as readonly FragmentType[];

  const totalWeight = types.reduce((sum, t) => sum + weights[t], 0);
  let roll = rng() * totalWeight;

  for (const t of types) {
    roll -= weights[t];
    if (roll <= 0) return t;
  }

  // Fallback: last type (handles floating-point edge cases)
  return types[types.length - 1];
}

// ════════════════════════════════════════════════════════════════
// § FRAGMENT TYPE SELECTION
// ════════════════════════════════════════════════════════════════

/**
 * Get a random fragment type (uniform distribution).
 */
export function getRandomFragmentType(
  rng: () => number = Math.random,
): FragmentType {
  const types = NEON_SIGNS.fragmentTypes;
  const idx = Math.floor(rng() * types.length);
  return types[idx];
}

// ════════════════════════════════════════════════════════════════
// § PLAYER COMBO CHOICE (manual trigger support)
// ════════════════════════════════════════════════════════════════

/**
 * Return ALL possible combos that can be formed from the currently held
 * fragments. Used to populate the combo-choice popup when the player
 * manually triggers a combo.
 *
 * Longer combos are listed before shorter ones (3-fragment first).
 * If no combo is possible, returns an empty array.
 */
export function getPossibleCombos(held: FragmentType[]): NeonComboResult[] {
  const sortedCombos = [...NEON_SIGNS.combos].sort(
    (a, b) => b.fragments.length - a.fragments.length,
  );

  const results: NeonComboResult[] = [];

  for (const combo of sortedCombos) {
    if (hasAllFragments(held, combo.fragments as unknown as FragmentType[])) {
      results.push({
        name: combo.name,
        effect: combo.effect as NeonEffect,
        multiplier: combo.multiplier,
        durationMs: combo.durationMs,
        consumedFragments: [...combo.fragments] as unknown as FragmentType[],
      });
    }
  }

  return results;
}

/**
 * Player selects a specific combo from the list returned by getPossibleCombos.
 * Consumes the required fragments from held and returns the combo result.
 *
 * @param held        Current held fragments.
 * @param comboIndex  Index into the getPossibleCombos(held) result array.
 * @returns Updated held array and the triggered combo result.
 * @throws If comboIndex is out of range or the combo is no longer satisfiable.
 */
export function selectCombo(
  held: FragmentType[],
  comboIndex: number,
): { held: FragmentType[]; combo: NeonComboResult } {
  const possible = getPossibleCombos(held);

  if (comboIndex < 0 || comboIndex >= possible.length) {
    throw new Error(
      `selectCombo: invalid comboIndex ${comboIndex}, only ${possible.length} combos available`,
    );
  }

  const combo = possible[comboIndex];

  if (!hasAllFragments(held, combo.consumedFragments)) {
    throw new Error(
      `selectCombo: held fragments no longer satisfy combo "${combo.name}"`,
    );
  }

  const remaining = removeConsumedFragments(held, combo.consumedFragments);
  return { held: remaining, combo };
}

// ════════════════════════════════════════════════════════════════
// § FRAGMENT COLLECTION
// ════════════════════════════════════════════════════════════════

/**
 * Add a fragment to the held array. If at max capacity, removes the oldest
 * (first) fragment. Then checks for combo matches.
 *
 * @returns Updated held array and combo result (null if no combo triggered)
 */
export function collectFragment(
  held: FragmentType[],
  newFragment: FragmentType,
): { held: FragmentType[]; combo: NeonComboResult | null } {
  let updated = [...held, newFragment];

  // Enforce max capacity — remove oldest (front) if over limit
  while (updated.length > NEON_SIGNS.maxHeldFragments) {
    updated = updated.slice(1);
  }

  const combo = checkCombo(updated);

  if (combo) {
    // Remove consumed fragments from held
    const remaining = removeConsumedFragments(updated, combo.consumedFragments);
    return { held: remaining, combo };
  }

  return { held: updated, combo: null };
}

/**
 * Remove the consumed fragments from held (handles duplicates correctly).
 */
function removeConsumedFragments(
  held: FragmentType[],
  consumed: FragmentType[],
): FragmentType[] {
  const toRemove = [...consumed];
  const result: FragmentType[] = [];

  for (const fragment of held) {
    const idx = toRemove.indexOf(fragment);
    if (idx !== -1) {
      toRemove.splice(idx, 1);
    } else {
      result.push(fragment);
    }
  }

  return result;
}

// ════════════════════════════════════════════════════════════════
// § COMBO CHECKING
// ════════════════════════════════════════════════════════════════

/**
 * Check all combo recipes against held fragments.
 * Longer combos are checked first (3-fragment before 2-fragment).
 * Order of fragments in hand doesn't matter.
 *
 * @returns The first matching combo result, or null
 */
export function checkCombo(held: FragmentType[]): NeonComboResult | null {
  // Sort combos by fragment count descending — prefer longer combos
  const sortedCombos = [...NEON_SIGNS.combos].sort(
    (a, b) => b.fragments.length - a.fragments.length,
  );

  for (const combo of sortedCombos) {
    if (hasAllFragments(held, combo.fragments as unknown as FragmentType[])) {
      return {
        name: combo.name,
        effect: combo.effect as NeonEffect,
        multiplier: combo.multiplier,
        durationMs: combo.durationMs,
        consumedFragments: [...combo.fragments] as unknown as FragmentType[],
      };
    }
  }

  return null;
}

/**
 * Check if held contains all required fragments (order-independent).
 * Handles duplicate fragment requirements correctly.
 */
function hasAllFragments(
  held: FragmentType[],
  required: FragmentType[],
): boolean {
  const available = [...held];

  for (const frag of required) {
    const idx = available.indexOf(frag);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }

  return true;
}

// ════════════════════════════════════════════════════════════════
// § BUFF APPLICATION
// ════════════════════════════════════════════════════════════════

/**
 * Apply a neon combo buff to a stat state. Returns a new state (immutable).
 *
 * @param state Object containing numeric stat fields
 * @param combo The combo result to apply
 * @returns Updated state with the buff's multiplier applied to the relevant stat
 */
export function applyNeonBuff<T extends Record<string, number>>(
  state: T,
  combo: NeonComboResult,
): T {
  const effectToStat: Record<NeonEffect, string> = {
    luck: "luck",
    damage: "damage",
    coinDrop: "coinDrop",
    knockback: "knockback",
    fireAura: "fireAura",
    critChance: "critChance",
    allDamage: "damage",
    allDrop: "coinDrop",
  };

  const statKey = effectToStat[combo.effect];
  if (statKey in state) {
    return {
      ...state,
      [statKey]: state[statKey] * combo.multiplier,
    };
  }

  return { ...state };
}

// ════════════════════════════════════════════════════════════════
// § BUFF TICK & MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Create a NeonBuff from a combo result.
 */
export function createNeonBuff(combo: NeonComboResult): NeonBuff {
  return {
    name: combo.name,
    effect: combo.effect,
    multiplier: combo.multiplier,
    remainingMs: combo.durationMs,
  };
}

/**
 * Tick all neon buffs by deltaMs. Removes expired buffs.
 * Returns a new array (immutable).
 */
export function tickNeonBuffs(buffs: NeonBuff[], deltaMs: number): NeonBuff[] {
  return buffs
    .map((b) => ({ ...b, remainingMs: b.remainingMs - deltaMs }))
    .filter((b) => b.remainingMs > 0);
}

/**
 * Get the combined multiplier for a given stat from all active buffs.
 * Multipliers stack multiplicatively. Returns 1.0 if no matching buffs.
 */
export function getActiveBuffMultiplier(
  buffs: NeonBuff[],
  stat: string,
): number {
  const effectToStat: Record<NeonEffect, string[]> = {
    luck: ["luck"],
    damage: ["damage"],
    coinDrop: ["coinDrop"],
    knockback: ["knockback"],
    fireAura: ["fireAura"],
    critChance: ["critChance"],
    allDamage: ["damage", "allDamage"],
    allDrop: ["coinDrop", "allDrop"],
  };

  let multiplier = 1.0;

  for (const buff of buffs) {
    const affectedStats = effectToStat[buff.effect] ?? [];
    if (affectedStats.includes(stat)) {
      multiplier *= buff.multiplier;
    }
  }

  return multiplier;
}
