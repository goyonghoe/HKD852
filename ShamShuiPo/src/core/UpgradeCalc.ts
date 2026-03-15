// ── Neon Survivors: Upgrade Calculations ──
// Pure TypeScript — NO Phaser imports.

import {
  WEAPONS,
  PASSIVES,
  RUN,
  UPGRADE_RARITY,
  WEAPON_LEVEL_SCALING,
} from "../config/balance";
import { checkEvolution } from "./WeaponCalc";
import type { WeaponSlot, PassiveSlot, UpgradeChoice } from "../types/game";

// ════════════════════════════════════════════════════════════════
// § GENERATE UPGRADE CHOICES
// ════════════════════════════════════════════════════════════════

/**
 * Generate upgrade choices for a level-up event.
 * @param currentWeapons Player's current weapons
 * @param currentPassives Player's current passives
 * @param numChoices Number of choices to present (typically 3)
 * @returns Array of UpgradeChoice objects
 */
export function generateUpgradeChoices(
  currentWeapons: WeaponSlot[],
  currentPassives: PassiveSlot[],
  numChoices: number = RUN.upgradeChoices,
): UpgradeChoice[] {
  const choices: UpgradeChoice[] = [];
  const usedIds = new Set<string>();

  // Always offer evolution first if conditions met
  if (UPGRADE_RARITY.evolutionPriority) {
    const passiveIds = currentPassives.map((p) => p.passiveId);
    for (const weapon of currentWeapons) {
      const recipe = checkEvolution(weapon.weaponId, weapon.level, passiveIds);
      if (recipe && !usedIds.has(recipe.result)) {
        choices.push({
          type: "evolution",
          id: recipe.result,
          level: 1,
          isNew: true,
        });
        usedIds.add(recipe.result);
        if (choices.length >= numChoices) return choices;
      }
    }
  }

  // Build candidate pools
  const weaponCandidates = buildWeaponCandidates(currentWeapons);
  const passiveCandidates = buildPassiveCandidates(currentPassives);

  // Fill remaining slots with weighted random selection
  let attempts = 0;
  const maxAttempts = 50;

  while (choices.length < numChoices && attempts < maxAttempts) {
    attempts++;

    const totalWeight =
      UPGRADE_RARITY.weaponWeight + UPGRADE_RARITY.passiveWeight;
    const roll = Math.random() * totalWeight;

    if (roll < UPGRADE_RARITY.weaponWeight) {
      // Try to offer a weapon
      const choice = pickWeaponChoice(
        weaponCandidates,
        currentWeapons,
        usedIds,
      );
      if (choice) {
        choices.push(choice);
        usedIds.add(choice.id);
      }
    } else {
      // Try to offer a passive
      const choice = pickPassiveChoice(
        passiveCandidates,
        currentPassives,
        usedIds,
      );
      if (choice) {
        choices.push(choice);
        usedIds.add(choice.id);
      }
    }
  }

  // If we couldn't fill all slots, try the other pool
  if (choices.length < numChoices) {
    for (const candidate of [...weaponCandidates, ...passiveCandidates]) {
      if (choices.length >= numChoices) break;
      if (usedIds.has(candidate.id)) continue;
      choices.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  return choices.slice(0, numChoices);
}

// ════════════════════════════════════════════════════════════════
// § INTERNAL HELPERS
// ════════════════════════════════════════════════════════════════

function buildWeaponCandidates(currentWeapons: WeaponSlot[]): UpgradeChoice[] {
  const candidates: UpgradeChoice[] = [];
  const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;

  // Existing weapons that can be upgraded
  for (const slot of currentWeapons) {
    if (slot.level < maxLevel) {
      candidates.push({
        type: "weapon",
        id: slot.weaponId,
        level: slot.level + 1,
        isNew: false,
      });
    }
  }

  // New weapons (if slots available)
  if (currentWeapons.length < RUN.maxWeaponSlots) {
    const ownedIds = new Set(currentWeapons.map((w) => w.weaponId));
    for (const weaponId of Object.keys(WEAPONS)) {
      if (!ownedIds.has(weaponId)) {
        candidates.push({
          type: "weapon",
          id: weaponId,
          level: 1,
          isNew: true,
        });
      }
    }
  }

  return candidates;
}

function buildPassiveCandidates(
  currentPassives: PassiveSlot[],
): UpgradeChoice[] {
  const candidates: UpgradeChoice[] = [];

  // Existing passives that can be upgraded
  for (const slot of currentPassives) {
    const def = PASSIVES[slot.passiveId];
    if (def && slot.level < def.maxLevel) {
      candidates.push({
        type: "passive",
        id: slot.passiveId,
        level: slot.level + 1,
        isNew: false,
      });
    }
  }

  // New passives (if slots available)
  if (currentPassives.length < RUN.maxPassiveSlots) {
    const ownedIds = new Set(currentPassives.map((p) => p.passiveId));
    for (const passiveId of Object.keys(PASSIVES)) {
      if (!ownedIds.has(passiveId)) {
        candidates.push({
          type: "passive",
          id: passiveId,
          level: 1,
          isNew: true,
        });
      }
    }
  }

  return candidates;
}

function pickWeaponChoice(
  candidates: UpgradeChoice[],
  currentWeapons: WeaponSlot[],
  usedIds: Set<string>,
): UpgradeChoice | null {
  const available = candidates.filter((c) => !usedIds.has(c.id));
  if (available.length === 0) return null;

  // Weight: new weapons more likely when few slots filled
  const newChance =
    UPGRADE_RARITY.newWeaponChance +
    UPGRADE_RARITY.newWeaponChancePerSlot * currentWeapons.length;

  const newWeapons = available.filter((c) => c.isNew);
  const upgrades = available.filter((c) => !c.isNew);

  if (newWeapons.length > 0 && Math.random() < newChance) {
    return newWeapons[Math.floor(Math.random() * newWeapons.length)];
  }
  if (upgrades.length > 0) {
    return upgrades[Math.floor(Math.random() * upgrades.length)];
  }
  // Fallback to whatever is available
  return available[Math.floor(Math.random() * available.length)];
}

function pickPassiveChoice(
  candidates: UpgradeChoice[],
  _currentPassives: PassiveSlot[],
  usedIds: Set<string>,
): UpgradeChoice | null {
  const available = candidates.filter((c) => !usedIds.has(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
