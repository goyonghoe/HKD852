/**
 * CritCalc — pure TypeScript critical hit calculation module.
 * NO Phaser imports. Immutable state management.
 *
 * Handles crit chance, crit damage, streak tracking, and pity system.
 */

// ─── Interfaces ───────────────────────────────────────────────

export interface CritState {
  readonly baseCritChance: number;
  readonly baseCritDamage: number;
  readonly bonusCritChance: number;
  readonly bonusCritDamage: number;
  readonly consecutiveCrits: number;
  readonly consecutiveNonCrits: number;
  readonly totalCrits: number;
  readonly totalHits: number;
}

export type CritTier = "none" | "low" | "medium" | "high" | "hyper";

export interface CritRollResult {
  readonly isCrit: boolean;
  readonly state: CritState;
}

// ─── Constants ────────────────────────────────────────────────

const DEFAULT_CRIT_CHANCE = 0.05; // 5%
const DEFAULT_CRIT_DAMAGE = 1.5; // 150%
const MAX_CRIT_CHANCE = 0.8; // 80% cap
const MIN_CRIT_DAMAGE = 1.0; // 100% minimum (no reduction below base)
const PITY_THRESHOLD = 3; // non-crits before pity kicks in
const PITY_PER_MISS = 0.02; // +2% per additional non-crit
const MAX_PITY_BONUS = 0.2; // +20% max pity

// ─── Factory ──────────────────────────────────────────────────

export function createCritState(
  baseCritChance: number = DEFAULT_CRIT_CHANCE,
  baseCritDamage: number = DEFAULT_CRIT_DAMAGE,
): CritState {
  return {
    baseCritChance,
    baseCritDamage,
    bonusCritChance: 0,
    bonusCritDamage: 0,
    consecutiveCrits: 0,
    consecutiveNonCrits: 0,
    totalCrits: 0,
    totalHits: 0,
  };
}

// ─── Pity System ──────────────────────────────────────────────

export function getStreakBonus(state: CritState): number {
  if (state.consecutiveNonCrits <= PITY_THRESHOLD) return 0;
  const extraMisses = state.consecutiveNonCrits - PITY_THRESHOLD;
  return Math.min(extraMisses * PITY_PER_MISS, MAX_PITY_BONUS);
}

// ─── Effective Stats ──────────────────────────────────────────

export function getEffectiveCritChance(state: CritState): number {
  const raw =
    state.baseCritChance + state.bonusCritChance + getStreakBonus(state);
  return Math.min(raw, MAX_CRIT_CHANCE);
}

export function getEffectiveCritDamage(state: CritState): number {
  const raw = state.baseCritDamage + state.bonusCritDamage;
  return Math.max(raw, MIN_CRIT_DAMAGE);
}

// ─── Crit Roll ────────────────────────────────────────────────

export function rollCrit(state: CritState, roll: number): CritRollResult {
  const chance = getEffectiveCritChance(state);
  const isCrit = roll < chance;

  const newState: CritState = {
    ...state,
    totalHits: state.totalHits + 1,
    totalCrits: isCrit ? state.totalCrits + 1 : state.totalCrits,
    consecutiveCrits: isCrit ? state.consecutiveCrits + 1 : 0,
    consecutiveNonCrits: isCrit ? 0 : state.consecutiveNonCrits + 1,
  };

  return { isCrit, state: newState };
}

// ─── Damage ───────────────────────────────────────────────────

export function calculateCritDamage(
  state: CritState,
  baseDamage: number,
): number {
  return baseDamage * getEffectiveCritDamage(state);
}

// ─── Bonus Management ─────────────────────────────────────────

export function addCritChanceBonus(
  state: CritState,
  amount: number,
): CritState {
  return { ...state, bonusCritChance: state.bonusCritChance + amount };
}

export function addCritDamageBonus(
  state: CritState,
  amount: number,
): CritState {
  return { ...state, bonusCritDamage: state.bonusCritDamage + amount };
}

export function removeCritChanceBonus(
  state: CritState,
  amount: number,
): CritState {
  return {
    ...state,
    bonusCritChance: Math.max(0, state.bonusCritChance - amount),
  };
}

export function removeCritDamageBonus(
  state: CritState,
  amount: number,
): CritState {
  return {
    ...state,
    bonusCritDamage: Math.max(0, state.bonusCritDamage - amount),
  };
}

// ─── Stats / Queries ──────────────────────────────────────────

export function getCritRate(state: CritState): number {
  if (state.totalHits === 0) return 0;
  return state.totalCrits / state.totalHits;
}

export function resetStreaks(state: CritState): CritState {
  return { ...state, consecutiveCrits: 0, consecutiveNonCrits: 0 };
}

export function getCritTier(state: CritState): CritTier {
  const chance = getEffectiveCritChance(state);
  if (chance < 0.05) return "none";
  if (chance < 0.15) return "low";
  if (chance < 0.4) return "medium";
  if (chance < 0.6) return "high";
  return "hyper";
}
