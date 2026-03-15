/**
 * Pure currency management functions for the dual-currency economy system.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 *
 * Two currencies:
 *  - runGold:  earned during runs, spent at in-run shop, resets each run
 *  - prestige: earned on run completion (permanent), spent on meta upgrades
 *
 * TASK-186
 */

import { BALANCE } from '../config/balance';
import type { CurrencyState, PrestigeCalcInput, PrestigeCalcResult } from '../types/game';

// ── Run Gold ────────────────────────────────────────────────────────────────

/**
 * Calculate gold earned from a single kill event.
 */
export function calcKillGold(enemyType: 'normal' | 'elite' | 'boss'): number {
  switch (enemyType) {
    case 'normal':
      return BALANCE.ECONOMY.goldPerKill;
    case 'elite':
      return BALANCE.ECONOMY.goldPerElite;
    case 'boss':
      return BALANCE.ECONOMY.goldPerBoss;
  }
}

/**
 * Add gold to run currency, returning new total (never goes negative).
 */
export function addRunGold(current: number, amount: number): number {
  return Math.max(0, current + amount);
}

/**
 * Spend run gold. Returns new gold amount, or current gold if insufficient.
 * Returns null if the spend cannot be made (insufficient funds).
 */
export function spendRunGold(current: number, cost: number): number | null {
  if (current < cost) return null;
  return current - cost;
}

/**
 * Check if the player can afford a shop purchase.
 */
export function canAffordRunGold(current: number, cost: number): boolean {
  return current >= cost;
}

// ── Prestige ────────────────────────────────────────────────────────────────

/**
 * Calculate stage multiplier for prestige earn formula.
 * Stage 1 → 1.0x, Stage 16 → 8.5x
 * Formula: stageMultiplierBase + (stageReached - 1) * stageMultiplierPerStage
 */
export function calcStageMultiplier(stageReached: number): number {
  const stage = Math.max(1, stageReached);
  return BALANCE.ECONOMY.stageMultiplierBase + (stage - 1) * BALANCE.ECONOMY.stageMultiplierPerStage;
}

/**
 * Calculate performance bonus based on kill count.
 * Scales linearly from performanceBonusMin (0 kills) to performanceBonusMax (maxKills).
 */
export function calcPerformanceBonus(kills: number): number {
  const ratio = Math.min(1, Math.max(0, kills / BALANCE.ECONOMY.performanceBonusMaxKills));
  return (
    BALANCE.ECONOMY.performanceBonusMin +
    ratio * (BALANCE.ECONOMY.performanceBonusMax - BALANCE.ECONOMY.performanceBonusMin)
  );
}

/**
 * Calculate prestige earned at end of run.
 * Formula: floor(basePrestige * stageMultiplier * performanceBonus)
 */
export function calcPrestigeEarned(input: PrestigeCalcInput): PrestigeCalcResult {
  const stageMultiplier = calcStageMultiplier(input.stageReached);
  const performanceBonus = calcPerformanceBonus(input.kills);
  const prestige = Math.floor(BALANCE.ECONOMY.basePrestige * stageMultiplier * performanceBonus);
  return { prestige, stageMultiplier, performanceBonus };
}

/**
 * Add prestige to permanent meta currency.
 */
export function addPrestige(current: number, amount: number): number {
  return Math.max(0, current + amount);
}

/**
 * Spend prestige. Returns new amount, or null if insufficient.
 */
export function spendPrestige(current: number, cost: number): number | null {
  if (current < cost) return null;
  return current - cost;
}

/**
 * Check if player can afford a prestige purchase.
 */
export function canAffordPrestige(current: number, cost: number): boolean {
  return current >= cost;
}

// ── Currency State ───────────────────────────────────────────────────────────

/**
 * Create a fresh currency state for a new run.
 */
export function createInitialCurrencyState(): CurrencyState {
  return { runGold: 0, prestige: 0 };
}

/**
 * Reset runGold to 0 at the start of a new run (prestige is preserved).
 */
export function resetRunGold(state: CurrencyState): CurrencyState {
  return { ...state, runGold: 0 };
}

/**
 * Apply a kill gold reward to currency state.
 */
export function applyKillGold(state: CurrencyState, enemyType: 'normal' | 'elite' | 'boss'): CurrencyState {
  const earned = calcKillGold(enemyType);
  return { ...state, runGold: addRunGold(state.runGold, earned) };
}

/**
 * Apply prestige earned at run end to currency state.
 */
export function applyRunEndPrestige(
  state: CurrencyState,
  input: PrestigeCalcInput,
): {
  newState: CurrencyState;
  result: PrestigeCalcResult;
} {
  const result = calcPrestigeEarned(input);
  return {
    newState: { ...state, prestige: addPrestige(state.prestige, result.prestige) },
    result,
  };
}
