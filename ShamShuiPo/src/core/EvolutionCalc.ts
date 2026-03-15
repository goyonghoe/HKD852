// ════════════════════════════════════════════════════════════════
// EvolutionCalc — pure TypeScript, NO Phaser imports
// Checks weapon evolution eligibility based on player state
// ════════════════════════════════════════════════════════════════

import { EVOLUTIONS, type EvolutionRecipe } from "../config/balance";
import type { WeaponSlot, PassiveSlot } from "../types/game";

const MAX_WEAPON_LEVEL = 5;

/**
 * Returns all evolution recipes the player currently qualifies for.
 * A recipe is available when:
 *  1. Player owns the base weapon at level 5
 *  2. Player owns the required passive (any level)
 *  3. Player does NOT already have the evolved weapon
 */
export function getAvailableEvolutions(
  weapons: WeaponSlot[],
  passives: PassiveSlot[],
): EvolutionRecipe[] {
  const weaponIds = new Set(weapons.map((w) => w.weaponId));
  const passiveIds = new Set(passives.map((p) => p.passiveId));

  return EVOLUTIONS.filter((recipe) => {
    // Already evolved → skip
    if (weaponIds.has(recipe.result)) return false;

    // Base weapon must be at max level
    const slot = weapons.find((w) => w.weaponId === recipe.weapon);
    if (!slot || slot.level < MAX_WEAPON_LEVEL) return false;

    // Required passive must be present (any level)
    return passiveIds.has(recipe.passive);
  });
}

/**
 * Check whether a specific weapon can evolve right now.
 * Returns the matching recipe, or null.
 */
export function canEvolve(
  weaponId: string,
  weapons: WeaponSlot[],
  passives: PassiveSlot[],
): EvolutionRecipe | null {
  const recipe = EVOLUTIONS.find((r) => r.weapon === weaponId);
  if (!recipe) return null;

  // Already evolved
  if (weapons.some((w) => w.weaponId === recipe.result)) return null;

  const slot = weapons.find((w) => w.weaponId === weaponId);
  if (!slot || slot.level < MAX_WEAPON_LEVEL) return null;

  const hasPassive = passives.some((p) => p.passiveId === recipe.passive);
  if (!hasPassive) return null;

  return recipe;
}

export interface EvolutionProgress {
  recipe: EvolutionRecipe | null;
  hasWeaponMaxLevel: boolean;
  hasRequiredPassive: boolean;
  weaponLevel: number;
}

/**
 * Detailed progress toward evolution for a given weapon — useful for UI display.
 */
export function getEvolutionProgress(
  weaponId: string,
  weapons: WeaponSlot[],
  passives: PassiveSlot[],
): EvolutionProgress {
  const recipe = EVOLUTIONS.find((r) => r.weapon === weaponId) ?? null;

  const slot = weapons.find((w) => w.weaponId === weaponId);
  const weaponLevel = slot?.level ?? 0;
  const hasWeaponMaxLevel = weaponLevel >= MAX_WEAPON_LEVEL;

  const hasRequiredPassive = recipe
    ? passives.some((p) => p.passiveId === recipe.passive)
    : false;

  return { recipe, hasWeaponMaxLevel, hasRequiredPassive, weaponLevel };
}
