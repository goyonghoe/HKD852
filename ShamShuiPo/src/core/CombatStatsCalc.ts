// ── Neon Survivors: Combat Stats Calculator ──
// Pure TypeScript — NO Phaser imports.
// Calculates DPS, TTK, effective HP, and build summaries.

import {
  WEAPONS,
  WEAPON_LEVEL_SCALING,
  PLAYER_BASE,
  type WeaponDef,
} from "../config/balance";
import type { WeaponSlot, PassiveSlot } from "../types/game";

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface WeaponDpsInfo {
  weaponId: string;
  baseDps: number;
  effectiveDps: number;
  fireRate: number;
  damagePerHit: number;
  projectileCount: number;
}

export interface SurvivabilityStats {
  effectiveHp: number;
  ehpWithArmor: number;
  hitsToKill: number;
  survivalTimeAtDps: number;
}

export interface BuildSummary {
  totalDps: number;
  weaponCount: number;
  perWeapon: WeaponDpsInfo[];
}

// ════════════════════════════════════════════════════════════════
// § WEAPON DPS
// ════════════════════════════════════════════════════════════════

/**
 * Calculate DPS breakdown for a single weapon.
 * @param weaponId - Key into WEAPONS config
 * @param level - Weapon level 1-5 (index into WEAPON_LEVEL_SCALING is level-1)
 * @param damageBonus - Fractional bonus from passives/meta (e.g. 0.2 = +20%)
 * @returns WeaponDpsInfo with base and effective DPS
 */
export function calculateWeaponDps(
  weaponId: string,
  level: number,
  damageBonus: number,
): WeaponDpsInfo {
  const weapon = WEAPONS[weaponId];
  if (!weapon) {
    return {
      weaponId,
      baseDps: 0,
      effectiveDps: 0,
      fireRate: 0,
      damagePerHit: 0,
      projectileCount: 0,
    };
  }

  const idx = Math.max(0, Math.min(level - 1, 4));
  const dmgMult = WEAPON_LEVEL_SCALING.damageMultiplier[idx];
  const frMult = WEAPON_LEVEL_SCALING.fireRateMultiplier[idx];
  const projBonus = WEAPON_LEVEL_SCALING.projectileBonus[idx];

  const baseDps = weapon.baseDamage * weapon.fireRate * weapon.projectileCount;

  const effectiveDamage = weapon.baseDamage * dmgMult * (1 + damageBonus);
  const effectiveFireRate = weapon.fireRate * frMult;
  const effectiveProjCount = weapon.projectileCount + projBonus;
  const effectiveDps = effectiveDamage * effectiveFireRate * effectiveProjCount;

  return {
    weaponId,
    baseDps,
    effectiveDps,
    fireRate: effectiveFireRate,
    damagePerHit: effectiveDamage,
    projectileCount: effectiveProjCount,
  };
}

// ════════════════════════════════════════════════════════════════
// § TOTAL DPS
// ════════════════════════════════════════════════════════════════

/**
 * Sum effective DPS across all equipped weapons.
 */
export function calculateTotalDps(
  weapons: WeaponSlot[],
  damageBonus: number,
): number {
  let total = 0;
  for (const w of weapons) {
    const info = calculateWeaponDps(w.weaponId, w.level, damageBonus);
    total += info.effectiveDps;
  }
  return total;
}

// ════════════════════════════════════════════════════════════════
// § TIME TO KILL
// ════════════════════════════════════════════════════════════════

/**
 * Calculate time to kill an enemy with given HP.
 * @returns seconds, or Infinity if totalDps is 0
 */
export function calculateTTK(
  weapons: WeaponSlot[],
  damageBonus: number,
  enemyHp: number,
): number {
  const totalDps = calculateTotalDps(weapons, damageBonus);
  if (totalDps <= 0) return Infinity;
  return enemyHp / totalDps;
}

// ════════════════════════════════════════════════════════════════
// § SURVIVABILITY
// ════════════════════════════════════════════════════════════════

/**
 * Calculate survivability stats.
 * @param hp - Player's current max HP
 * @param armor - Flat damage reduction per hit
 * @param regenPerSec - HP regenerated per second
 * @param incomingDps - Total incoming damage per second from enemies
 * @returns SurvivabilityStats
 */
export function calculateSurvivability(
  hp: number,
  armor: number,
  regenPerSec: number,
  incomingDps: number,
): SurvivabilityStats {
  const effectiveHp = hp;

  // Assume 2 hits/sec from enemies for per-hit calculations
  const hitsPerSec = 2;
  const avgHitDamage = incomingDps > 0 ? incomingDps / hitsPerSec : 0;
  const effectiveHitDamage = Math.max(1, avgHitDamage - armor);

  // ehpWithArmor: how much raw damage the player can absorb
  // before dying, accounting for flat armor reduction
  const ehpWithArmor =
    avgHitDamage > 0 ? hp * (avgHitDamage / effectiveHitDamage) : hp;

  const hitsToKill =
    effectiveHitDamage > 0 ? hp / effectiveHitDamage : Infinity;

  const netDps = incomingDps - regenPerSec;
  const survivalTimeAtDps = netDps > 0.01 ? hp / netDps : Infinity;

  return {
    effectiveHp,
    ehpWithArmor,
    hitsToKill,
    survivalTimeAtDps,
  };
}

// ════════════════════════════════════════════════════════════════
// § BUILD SUMMARY
// ════════════════════════════════════════════════════════════════

/**
 * Get a full combat summary for the player's current weapon loadout.
 */
export function calculateBuildSummary(
  weapons: WeaponSlot[],
  damageBonus: number,
): BuildSummary {
  const perWeapon: WeaponDpsInfo[] = weapons.map((w) =>
    calculateWeaponDps(w.weaponId, w.level, damageBonus),
  );

  const totalDps = perWeapon.reduce((sum, w) => sum + w.effectiveDps, 0);

  return {
    totalDps,
    weaponCount: weapons.length,
    perWeapon,
  };
}
