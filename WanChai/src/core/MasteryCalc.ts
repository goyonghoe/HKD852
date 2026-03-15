/**
 * MasteryCalc — Pure TS functions for weapon mastery progression.
 * M-001: NO Phaser imports. Pure TypeScript only.
 * M-002: All constants from balance.ts.
 */

import type { WeaponMasteryStats, MasteryBonus, MasteryRecord } from '../types/game';
import { BALANCE } from '../config/balance';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a blank mastery stats entry for a weapon.
 */
export function createMasteryStats(weaponId: string): WeaponMasteryStats {
  return {
    weaponId,
    kills: 0,
    runsUsed: 0,
    totalDamage: 0,
    masteryXp: 0,
    masteryLevel: 0,
  };
}

/**
 * Get or create mastery stats for a weapon from the record.
 * Pure — returns existing or new; does NOT mutate the record.
 */
export function getOrCreateStats(record: MasteryRecord, weaponId: string): WeaponMasteryStats {
  return record[weaponId] ?? createMasteryStats(weaponId);
}

// ── XP Thresholds ────────────────────────────────────────────────────────────

/**
 * Get the CUMULATIVE XP required to reach a given mastery level.
 * Level 0 requires 0 XP (starting point).
 * Level 1 requires xpThresholds[0], etc.
 */
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  const maxLevel = BALANCE.MASTERY.maxLevel;
  if (level > maxLevel) return Infinity;
  return BALANCE.MASTERY.xpThresholds[level - 1] ?? Infinity;
}

/**
 * Compute the mastery level for a given cumulative XP value.
 * Returns a value in [0, MASTERY.maxLevel].
 */
export function computeMasteryLevel(totalXp: number): number {
  const thresholds = BALANCE.MASTERY.xpThresholds;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXp < thresholds[i]) return i;
  }
  return BALANCE.MASTERY.maxLevel;
}

/**
 * Return the XP progress within the current mastery level as a 0–1 fraction.
 * Useful for progress bar rendering.
 */
export function getMasteryLevelProgress(totalXp: number): number {
  const level = computeMasteryLevel(totalXp);
  if (level >= BALANCE.MASTERY.maxLevel) return 1;
  const prevXp = getXpForLevel(level);
  const nextXp = getXpForLevel(level + 1);
  if (nextXp === Infinity || nextXp === prevXp) return 1;
  return Math.min(1, (totalXp - prevXp) / (nextXp - prevXp));
}

// ── XP Calculation ───────────────────────────────────────────────────────────

/**
 * Calculate mastery XP earned during a run for a weapon.
 *
 * @param kills         Kills attributed to this weapon during the run.
 * @param damageDealt   Total damage dealt by this weapon during the run.
 * @param runCompleted  Whether the player completed the run (survived all stages).
 */
export function calcRunMasteryXp(kills: number, damageDealt: number, runCompleted: boolean): number {
  const killXp = kills * BALANCE.MASTERY.xpPerKill;
  const damageXp = Math.floor((damageDealt / 1000) * BALANCE.MASTERY.xpPer1000Damage);
  const runXp = runCompleted ? BALANCE.MASTERY.xpPerRunCompleted : 0;
  return killXp + damageXp + runXp;
}

// ── Stat Bonuses ─────────────────────────────────────────────────────────────

/**
 * Get the permanent mastery bonuses for a weapon at its current mastery level.
 * Bonuses scale linearly: +damagePerLevel per level, +fireRatePerLevel per level.
 */
export function getMasteryBonus(stats: WeaponMasteryStats): MasteryBonus {
  const level = stats.masteryLevel;
  return {
    damageBonus: level * BALANCE.MASTERY.damagePerLevel,
    fireRateBonus: level * BALANCE.MASTERY.fireRatePerLevel,
  };
}

/**
 * Apply mastery fire-rate bonus to a base cooldown in ms.
 * Each mastery level reduces cooldown by fireRatePerLevel (e.g. 1% per level).
 * Minimum cooldown = 50ms (hard floor to prevent divide-by-zero / infinite fire rate).
 */
export function applyMasteryToCooldown(baseCooldownMs: number, masteryLevel: number): number {
  const reduction = masteryLevel * BALANCE.MASTERY.fireRatePerLevel;
  return Math.max(50, Math.round(baseCooldownMs * (1 - reduction)));
}

/**
 * Apply mastery damage bonus to a base damage value.
 * Returns Math.ceil to maintain whole numbers.
 */
export function applyMasteryToDamage(baseDamage: number, masteryLevel: number): number {
  const bonus = masteryLevel * BALANCE.MASTERY.damagePerLevel;
  return Math.ceil(baseDamage * (1 + bonus));
}

// ── Record Mutations (return new records; never mutate in-place) ──────────────

/**
 * Update mastery record after a run ends.
 * Returns a new MasteryRecord with updated stats for all weapons used.
 *
 * @param record          Existing mastery record (from MetaState).
 * @param weaponKills     Per-weapon kill counts this run.
 * @param weaponDamage    Per-weapon damage totals this run.
 * @param equippedWeapons Weapon IDs equipped during the run (for runsUsed tracking).
 * @param runCompleted    Whether the player survived to the end.
 */
export function updateMasteryAfterRun(
  record: MasteryRecord,
  weaponKills: Record<string, number>,
  weaponDamage: Record<string, number>,
  equippedWeapons: string[],
  runCompleted: boolean,
): MasteryRecord {
  const updated: MasteryRecord = { ...record };

  for (const weaponId of equippedWeapons) {
    const existing = getOrCreateStats(record, weaponId);
    const kills = weaponKills[weaponId] ?? 0;
    const damage = weaponDamage[weaponId] ?? 0;
    const xpGained = calcRunMasteryXp(kills, damage, runCompleted);
    const newXp = existing.masteryXp + xpGained;
    const newLevel = computeMasteryLevel(newXp);

    updated[weaponId] = {
      weaponId,
      kills: existing.kills + kills,
      runsUsed: existing.runsUsed + 1,
      totalDamage: existing.totalDamage + damage,
      masteryXp: newXp,
      masteryLevel: newLevel,
    };
  }

  return updated;
}

/**
 * Get the mastery level for a specific weapon from the record.
 * Returns 0 if weapon has no mastery data yet.
 */
export function getWeaponMasteryLevel(record: MasteryRecord, weaponId: string): number {
  return record[weaponId]?.masteryLevel ?? 0;
}

/**
 * Get total mastery XP across all weapons (for leaderboard / stat display).
 */
export function getTotalMasteryXp(record: MasteryRecord): number {
  return Object.values(record).reduce((sum, stats) => sum + stats.masteryXp, 0);
}

/**
 * Get the weapon with the highest mastery level.
 * Returns null if the record is empty.
 */
export function getTopMasteryWeapon(record: MasteryRecord): WeaponMasteryStats | null {
  const entries = Object.values(record);
  if (entries.length === 0) return null;
  return entries.reduce((best, cur) =>
    cur.masteryLevel > best.masteryLevel || (cur.masteryLevel === best.masteryLevel && cur.masteryXp > best.masteryXp)
      ? cur
      : best,
  );
}
