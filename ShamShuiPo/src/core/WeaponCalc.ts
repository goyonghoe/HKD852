// ── Neon Survivors: Weapon Calculations ──
// Pure TypeScript — NO Phaser imports.

import {
  WEAPONS,
  WEAPON_LEVEL_SCALING,
  PASSIVES,
  EVOLUTIONS,
  PLAYER_BASE,
  type WeaponDef,
  type EvolutionRecipe,
} from "../config/balance";
import type { PassiveSlot } from "../types/game";

// ════════════════════════════════════════════════════════════════
// § DAMAGE
// ════════════════════════════════════════════════════════════════

/**
 * Calculate final damage for a weapon shot.
 * @param weaponId Weapon identifier
 * @param weaponLevel Current weapon level (1-5)
 * @param passives Player's current passives
 * @param metaDamageBonus Permanent meta-upgrade damage bonus (0-1)
 * @returns Final damage value
 */
export function calculateDamage(
  weaponId: string,
  weaponLevel: number,
  passives: PassiveSlot[],
  metaDamageBonus: number = 0,
): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const levelIdx = Math.min(
    weaponLevel - 1,
    WEAPON_LEVEL_SCALING.damageMultiplier.length - 1,
  );
  const baseDmg =
    weapon.baseDamage * WEAPON_LEVEL_SCALING.damageMultiplier[levelIdx];

  // Passive damage bonus
  const passiveDmgBonus = getPassiveVal(passives, "damage");

  const totalDmg = baseDmg * (1 + passiveDmgBonus + metaDamageBonus);
  return Math.round(totalDmg);
}

/**
 * Calculate crit damage. Call this only when a crit occurs.
 */
export function calculateCritDamage(
  baseDamage: number,
  passives: PassiveSlot[],
): number {
  const critDmgBonus = getPassiveVal(passives, "crit_dmg");
  const critMultiplier = PLAYER_BASE.critMultiplier + critDmgBonus;
  return Math.round(baseDamage * critMultiplier);
}

/**
 * Roll whether this shot crits.
 */
export function rollCrit(passives: PassiveSlot[]): boolean {
  const critBonus = getPassiveVal(passives, "crit");
  const critChance = PLAYER_BASE.critChance + critBonus;
  return Math.random() < critChance;
}

// ════════════════════════════════════════════════════════════════
// § FIRE RATE
// ════════════════════════════════════════════════════════════════

/**
 * Calculate actual fire rate (shots per second).
 */
export function calculateFireRate(
  weaponId: string,
  weaponLevel: number,
  passives: PassiveSlot[],
): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const levelIdx = Math.min(
    weaponLevel - 1,
    WEAPON_LEVEL_SCALING.fireRateMultiplier.length - 1,
  );
  const baseRate =
    weapon.fireRate * WEAPON_LEVEL_SCALING.fireRateMultiplier[levelIdx];

  // Cooldown reduction passive (reduces interval, effectively increases fire rate)
  const cdReduction = getPassiveVal(passives, "cooldown");
  const effectiveRate = baseRate / (1 - Math.min(cdReduction, 0.9)); // cap at 90% CDR

  return effectiveRate;
}

/**
 * Get cooldown duration in seconds for a weapon.
 */
export function getCooldownDuration(
  weaponId: string,
  weaponLevel: number,
  passives: PassiveSlot[],
): number {
  const rate = calculateFireRate(weaponId, weaponLevel, passives);
  return rate > 0 ? 1 / rate : Infinity;
}

// ════════════════════════════════════════════════════════════════
// § PROJECTILE COUNT
// ════════════════════════════════════════════════════════════════

/**
 * Get total number of projectiles per shot.
 */
export function getProjectileCount(
  weaponId: string,
  weaponLevel: number,
  passives: PassiveSlot[],
): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const levelIdx = Math.min(
    weaponLevel - 1,
    WEAPON_LEVEL_SCALING.projectileBonus.length - 1,
  );
  const base = weapon.projectileCount;
  const levelBonus = WEAPON_LEVEL_SCALING.projectileBonus[levelIdx];
  const passiveBonus = getPassiveVal(passives, "projectile");

  return base + levelBonus + passiveBonus;
}

// ════════════════════════════════════════════════════════════════
// § AREA
// ════════════════════════════════════════════════════════════════

/**
 * Get weapon area (hit/explosion radius in pixels).
 */
export function getWeaponArea(
  weaponId: string,
  weaponLevel: number,
  passives: PassiveSlot[],
): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const levelIdx = Math.min(
    weaponLevel - 1,
    WEAPON_LEVEL_SCALING.areaMultiplier.length - 1,
  );
  const baseArea = weapon.area * WEAPON_LEVEL_SCALING.areaMultiplier[levelIdx];

  const areaBonus = getPassiveVal(passives, "area");
  return Math.round(baseArea * (1 + areaBonus));
}

// ════════════════════════════════════════════════════════════════
// § PIERCE
// ════════════════════════════════════════════════════════════════

/**
 * Get total pierce count for a weapon.
 */
export function getPierceCount(weaponId: string, weaponLevel: number): number {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return 0;

  const levelIdx = Math.min(
    weaponLevel - 1,
    WEAPON_LEVEL_SCALING.pierceBonus.length - 1,
  );
  return weapon.pierce + WEAPON_LEVEL_SCALING.pierceBonus[levelIdx];
}

// ════════════════════════════════════════════════════════════════
// § EVOLUTION
// ════════════════════════════════════════════════════════════════

/**
 * Check if a weapon can evolve.
 * Requires weapon at max level (5) + required passive owned.
 */
export function checkEvolution(
  weaponId: string,
  weaponLevel: number,
  passiveIds: string[],
): EvolutionRecipe | null {
  const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
  if (weaponLevel < maxLevel) return null;

  const recipe = EVOLUTIONS.find(
    (e) => e.weapon === weaponId && passiveIds.includes(e.passive),
  );
  return recipe ?? null;
}

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function getPassiveVal(passives: PassiveSlot[], passiveId: string): number {
  const slot = passives.find((p) => p.passiveId === passiveId);
  if (!slot) return 0;

  const def = PASSIVES[passiveId];
  if (!def) return 0;

  return def.values[slot.level - 1];
}
