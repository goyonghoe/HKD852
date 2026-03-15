/**
 * WeaponRarityCalc — Pure TS functions for weapon rarity.
 * M-001: NO Phaser imports. Pure TypeScript only.
 * M-002: All constants from balance.ts / types from weapon.ts.
 */

import type { WeaponRarity } from '../types/weapon';
import { BALANCE } from '../config/balance';

/** Ordered rarity tiers from most to least common. */
export const RARITY_TIERS: readonly WeaponRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

/**
 * Get the stat damage multiplier for a given rarity.
 * Applied to baseDamage when the weapon is dropped.
 */
export function getRarityStatMultiplier(rarity: WeaponRarity): number {
  return BALANCE.RARITY.statMultiplier[rarity] ?? 1.0;
}

/**
 * Get the display color key for a rarity (for use with colors.ts lookups).
 * Returns a string key to be looked up in colors.ts.
 */
export function getRarityColorKey(rarity: WeaponRarity): string {
  return `rarity${rarity}`;
}

/**
 * Build the weighted rarity pool as a flat array of rarity strings.
 * Each rarity appears dropWeight[rarity] times.
 * luckBonus shifts weight from Common → Rare+.
 *
 * @param luckBonus  Additive bonus (0.0–1.0). Each 0.05 shifts 5 weight
 *                   from Common to the next tier.
 */
export function buildRarityPool(luckBonus = 0): WeaponRarity[] {
  const weights = { ...BALANCE.RARITY.dropWeight };

  // Apply luck: shift weight from Common to Uncommon/Rare proportionally.
  // Each 0.05 luck = 5 weight points moved away from Common, split evenly
  // to Uncommon and Rare.
  const luckShift = Math.floor((luckBonus / 0.05) * 5);
  const actualShift = Math.min(luckShift, weights['Common'] - 5); // keep at least 5 Common

  if (actualShift > 0) {
    weights['Common'] -= actualShift;
    const half = Math.floor(actualShift / 2);
    weights['Uncommon'] += half;
    weights['Rare'] += actualShift - half;
  }

  const pool: WeaponRarity[] = [];
  for (const rarity of RARITY_TIERS) {
    const count = weights[rarity] ?? 0;
    for (let i = 0; i < count; i++) {
      pool.push(rarity);
    }
  }
  return pool;
}

/**
 * Select a rarity from the pool using a 0–1 random value.
 * The pool is built by buildRarityPool, then we pick index = floor(roll * pool.length).
 *
 * @param roll       A deterministic 0–1 random value.
 * @param luckBonus  Luck factor (0.0–1.0) from meta upgrades.
 */
export function selectRarity(roll: number, luckBonus = 0): WeaponRarity {
  const pool = buildRarityPool(luckBonus);
  const idx = Math.min(Math.floor(roll * pool.length), pool.length - 1);
  return pool[idx];
}

/**
 * Apply rarity multiplier to a base damage value.
 * Returns the scaled damage (Math.ceil for whole numbers).
 */
export function applyRarityToDamage(baseDamage: number, rarity: WeaponRarity): number {
  return Math.ceil(baseDamage * getRarityStatMultiplier(rarity));
}

/**
 * Given a weapon rarity, compute the effective cooldown multiplier.
 * Higher rarities get a minor cooldown reduction (proportional to damage bonus).
 * Formula: max(0.5, 1 - (statMult - 1) * 0.1)
 * e.g. Legendary (2.0x dmg) → 1 - 1.0 * 0.1 = 0.9 cooldown (10% faster)
 */
export function getRarityCooldownMultiplier(rarity: WeaponRarity): number {
  const statMult = getRarityStatMultiplier(rarity);
  return Math.max(0.5, 1 - (statMult - 1) * 0.1);
}

/**
 * Compare two rarities. Returns negative if a < b, 0 if equal, positive if a > b.
 * Useful for sorting weapons by rarity.
 */
export function compareRarity(a: WeaponRarity, b: WeaponRarity): number {
  return RARITY_TIERS.indexOf(a) - RARITY_TIERS.indexOf(b);
}
