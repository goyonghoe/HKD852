// ── Neon Survivors: HP Regeneration Calculations ──
// Pure TypeScript — NO Phaser imports.

import { PLAYER_BASE, PASSIVES } from "../config/balance";

// ════════════════════════════════════════════════════════════════
// § getRegenRate
// ════════════════════════════════════════════════════════════════

/**
 * Calculate total HP regeneration per second.
 *
 * @param regenPassiveLevel 0 = no passive equipped, 1-5 = passive level
 * @param bonusRegen additional flat HP/sec from other sources
 * @returns HP per second
 */
export function getRegenRate(
  regenPassiveLevel: number,
  bonusRegen: number = 0,
): number {
  const baseRegen = PLAYER_BASE.regenPerSec;
  const passiveRegen =
    regenPassiveLevel >= 1 && regenPassiveLevel <= PASSIVES.regen.maxLevel
      ? PASSIVES.regen.values[regenPassiveLevel - 1]
      : 0;
  return baseRegen + passiveRegen + bonusRegen;
}

// ════════════════════════════════════════════════════════════════
// § calculateRegenTick
// ════════════════════════════════════════════════════════════════

/**
 * Apply one tick of HP regeneration.
 *
 * @returns new HP after regen, capped at maxHp
 */
export function calculateRegenTick(
  currentHp: number,
  maxHp: number,
  regenPerSec: number,
  deltaTime: number,
): number {
  if (currentHp >= maxHp) return currentHp;
  return Math.min(currentHp + regenPerSec * deltaTime, maxHp);
}

// ════════════════════════════════════════════════════════════════
// § getRegenEfficiency
// ════════════════════════════════════════════════════════════════

/**
 * How useful is regen right now? 0 = full HP (no benefit), 1 = 0 HP (max benefit).
 *
 * Formula: 1 - (currentHp / maxHp)
 */
export function getRegenEfficiency(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return 1 - currentHp / maxHp;
}

// ════════════════════════════════════════════════════════════════
// § getTimeToFullHp
// ════════════════════════════════════════════════════════════════

/**
 * Seconds needed to regenerate from currentHp to maxHp.
 *
 * @returns 0 if already full, Infinity if regenPerSec <= 0
 */
export function getTimeToFullHp(
  currentHp: number,
  maxHp: number,
  regenPerSec: number,
): number {
  if (currentHp >= maxHp) return 0;
  if (regenPerSec <= 0) return Infinity;
  return (maxHp - currentHp) / regenPerSec;
}
