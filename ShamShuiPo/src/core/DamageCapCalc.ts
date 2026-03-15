/**
 * DamageCapCalc — pure TypeScript DPS hard cap logic.
 * NO Phaser imports. Immutable state management.
 *
 * SPEC-034 §4.9 — DPS 배율 하드캡: 3.0배
 * "어떤 버프 조합이든 기본 DPS의 3.0배를 초과할 수 없다."
 *
 * Prevents crono + combo + food multiplier stacking beyond 3.0x base DPS.
 *
 * Example scenarios from SPEC-034 §4.9:
 *   火力 only:               2.0x                  → 2.0 (under cap)
 *   Chrono + 火力:           1.3 × 2.0 = 2.6       → 2.6 (under cap)
 *   Chrono + 火力 + FriedRice: 1.3 × 2.0 × 1.5 = 3.9 → 3.0 (capped)
 *   Chrono + 大火力:          1.3 × 3.0 = 3.9       → 3.0 (capped)
 */

import { COMBAT } from "../config/balance";

/**
 * Cap the combined DPS multiplier from all active buff sources.
 *
 * Multipliers are applied multiplicatively before the cap.
 * Any combination that exceeds COMBAT.dpsHardCap (3.0) is clamped to 3.0.
 *
 * @param neonMult   Multiplier from active neon combo buffs (e.g. 2.0 for 火力)
 * @param chronoMult Multiplier from Chrono Hack (e.g. 1.3, or 1.0 if inactive)
 * @param foodMult   Multiplier from Dai Pai Dong food buff (e.g. 1.5 for 炒飯, or 1.0)
 * @returns Capped combined multiplier, never exceeding COMBAT.dpsHardCap
 */
export function capDamageMultiplier(
  neonMult: number,
  chronoMult: number,
  foodMult: number,
): number {
  const combined = neonMult * chronoMult * foodMult;
  return Math.min(combined, COMBAT.dpsHardCap);
}

/**
 * Apply the DPS hard cap to an already-combined multiplier.
 * Useful when you have pre-combined buffs from multiple sources.
 *
 * @param combined Pre-combined multiplier
 * @returns Capped multiplier
 */
export function applyCap(combined: number): number {
  return Math.min(combined, COMBAT.dpsHardCap);
}

/**
 * Check whether a given combination of multipliers would exceed the hard cap.
 */
export function wouldExceedCap(
  neonMult: number,
  chronoMult: number,
  foodMult: number,
): boolean {
  return neonMult * chronoMult * foodMult > COMBAT.dpsHardCap;
}
