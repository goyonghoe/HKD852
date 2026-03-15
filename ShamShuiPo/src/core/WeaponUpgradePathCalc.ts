// ════════════════════════════════════════════════════════════════
// WeaponUpgradePathCalc — pure TypeScript, NO Phaser imports.
// Calculates weapon upgrade paths and evolution prerequisites.
// ════════════════════════════════════════════════════════════════

import {
  WEAPONS,
  WEAPON_LEVEL_SCALING,
  EVOLUTIONS,
  PASSIVES,
  type WeaponDef,
  type EvolutionRecipe,
} from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface UpgradeNode {
  weaponId: string;
  name: string;
  level: number;
  isEvolution: boolean;
  evolutionResult?: string;
  requiredPassive?: string;
  requiredPassiveLevel?: number;
  stats: { damage: number; fireRate: number; projectiles: number };
}

export interface UpgradePath {
  weaponId: string;
  nodes: UpgradeNode[]; // levels 1-5
  evolution: UpgradeNode | null; // evolved form if exists
  maxLevel: number;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const MAX_WEAPON_LEVEL = 5;

const TIER_MAP: Record<
  number,
  "basic" | "improved" | "advanced" | "elite" | "max"
> = {
  1: "basic",
  2: "improved",
  3: "advanced",
  4: "elite",
  5: "max",
};

// ════════════════════════════════════════════════════════════════
// § NODE STATS
// ════════════════════════════════════════════════════════════════

/**
 * Get weapon stats at a specific level, applying level scaling.
 * @param weaponId Weapon identifier from WEAPONS config
 * @param level Weapon level (1-5)
 * @returns Scaled stats or null if weapon not found
 */
export function getNodeStats(
  weaponId: string,
  level: number,
): { damage: number; fireRate: number; projectiles: number } | null {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return null;

  const clampedLevel = Math.max(1, Math.min(level, MAX_WEAPON_LEVEL));
  const idx = clampedLevel - 1;

  const damage = weapon.baseDamage * WEAPON_LEVEL_SCALING.damageMultiplier[idx];
  const fireRate =
    weapon.fireRate * WEAPON_LEVEL_SCALING.fireRateMultiplier[idx];
  const projectiles =
    weapon.projectileCount + WEAPON_LEVEL_SCALING.projectileBonus[idx];

  return { damage, fireRate, projectiles };
}

// ════════════════════════════════════════════════════════════════
// § EVOLUTION REQUIREMENTS
// ════════════════════════════════════════════════════════════════

/**
 * Get what's needed to evolve a weapon.
 * @param weaponId Base weapon identifier
 * @returns Evolution requirements or null if no evolution exists
 */
export function getEvolutionRequirements(
  weaponId: string,
): { passiveId: string; passiveLevel: number; weaponLevel: number } | null {
  const recipe = EVOLUTIONS.find((e) => e.weapon === weaponId);
  if (!recipe) return null;

  return {
    passiveId: recipe.passive,
    passiveLevel: 1, // any level of passive is sufficient
    weaponLevel: MAX_WEAPON_LEVEL, // weapon must be max level
  };
}

/**
 * Check whether a weapon can evolve given current levels.
 * @param weaponId Base weapon identifier
 * @param weaponLevel Current weapon level
 * @param passiveId ID of passive the player has
 * @param passiveLevel Current level of that passive
 * @returns true if evolution conditions are met
 */
export function canEvolveWeapon(
  weaponId: string,
  weaponLevel: number,
  passiveId: string,
  passiveLevel: number,
): boolean {
  const req = getEvolutionRequirements(weaponId);
  if (!req) return false;

  return (
    weaponLevel >= req.weaponLevel &&
    passiveId === req.passiveId &&
    passiveLevel >= req.passiveLevel
  );
}

// ════════════════════════════════════════════════════════════════
// § WEAPON TIER
// ════════════════════════════════════════════════════════════════

/**
 * Map weapon level to a human-readable tier name.
 * @param level Weapon level (1-5)
 * @returns Tier string
 */
export function getWeaponTier(
  level: number,
): "basic" | "improved" | "advanced" | "elite" | "max" {
  const clamped = Math.max(1, Math.min(level, MAX_WEAPON_LEVEL));
  return TIER_MAP[clamped];
}

// ════════════════════════════════════════════════════════════════
// § UPGRADE PATH
// ════════════════════════════════════════════════════════════════

/**
 * Build the full upgrade tree for a single weapon.
 * @param weaponId Weapon identifier
 * @returns Complete upgrade path with level nodes and evolution, or null
 */
export function getUpgradePath(weaponId: string): UpgradePath | null {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return null;

  const recipe = EVOLUTIONS.find((e) => e.weapon === weaponId);

  const nodes: UpgradeNode[] = [];
  for (let level = 1; level <= MAX_WEAPON_LEVEL; level++) {
    const stats = getNodeStats(weaponId, level)!;
    const isLastLevel = level === MAX_WEAPON_LEVEL;

    const node: UpgradeNode = {
      weaponId,
      name: weapon.name,
      level,
      isEvolution: false,
      stats,
    };

    // Mark the max-level node with evolution info if available
    if (isLastLevel && recipe) {
      node.evolutionResult = recipe.result;
      node.requiredPassive = recipe.passive;
      node.requiredPassiveLevel = 1;
    }

    nodes.push(node);
  }

  let evolution: UpgradeNode | null = null;
  if (recipe) {
    evolution = {
      weaponId: recipe.result,
      name: recipe.resultName,
      level: MAX_WEAPON_LEVEL + 1, // beyond max = evolved
      isEvolution: true,
      requiredPassive: recipe.passive,
      requiredPassiveLevel: 1,
      stats: {
        damage: recipe.resultDamage,
        fireRate: recipe.resultFireRate,
        projectiles:
          weapon.projectileCount +
          WEAPON_LEVEL_SCALING.projectileBonus[MAX_WEAPON_LEVEL - 1],
      },
    };
  }

  return {
    weaponId,
    nodes,
    evolution,
    maxLevel: MAX_WEAPON_LEVEL,
  };
}

/**
 * Get upgrade paths for all weapons in the game.
 * @returns Array of upgrade paths for all 8 weapons
 */
export function getAllUpgradePaths(): UpgradePath[] {
  return Object.keys(WEAPONS).map((id) => getUpgradePath(id)!);
}

// ════════════════════════════════════════════════════════════════
// § WEAPON COMPARISON
// ════════════════════════════════════════════════════════════════

/**
 * Compare two weapons at given levels by DPS (damage × fireRate × projectiles).
 * @param weaponA First weapon ID
 * @param levelA First weapon level
 * @param weaponB Second weapon ID
 * @param levelB Second weapon level
 * @returns DPS values and the winner, or null if either weapon not found
 */
export function compareWeapons(
  weaponA: string,
  levelA: number,
  weaponB: string,
  levelB: number,
): { dpsA: number; dpsB: number; winner: string } | null {
  const statsA = getNodeStats(weaponA, levelA);
  const statsB = getNodeStats(weaponB, levelB);

  if (!statsA || !statsB) return null;

  const dpsA = statsA.damage * statsA.fireRate * statsA.projectiles;
  const dpsB = statsB.damage * statsB.fireRate * statsB.projectiles;

  return {
    dpsA,
    dpsB,
    winner: dpsA >= dpsB ? weaponA : weaponB,
  };
}
