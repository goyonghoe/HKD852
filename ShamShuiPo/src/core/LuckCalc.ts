/**
 * LuckCalc — pure TypeScript luck stat system.
 * NO Phaser imports. Immutable state management.
 *
 * Luck affects drop rates, crit chance, and upgrade quality.
 */

// ─── Interfaces ───────────────────────────────────────────────

export interface LuckConfig {
  readonly baseLuck: number;
  readonly luckPerLevel: number;
  readonly maxLuck: number;
  readonly dropRateMultiplier: number;
  readonly critBonusMultiplier: number;
}

export interface LuckState {
  readonly config: LuckConfig;
  readonly bonusLuck: number;
  readonly totalRolls: number;
  readonly luckyRolls: number;
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_CONFIG: LuckConfig = {
  baseLuck: 10,
  luckPerLevel: 2,
  maxLuck: 100,
  dropRateMultiplier: 0.01,
  critBonusMultiplier: 0.005,
};

// ─── Factory ──────────────────────────────────────────────────

export function createLuckState(config?: Partial<LuckConfig>): LuckState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    bonusLuck: 0,
    totalRolls: 0,
    luckyRolls: 0,
  };
}

// ─── Effective Luck ───────────────────────────────────────────

export function getEffectiveLuck(state: LuckState, level: number = 1): number {
  const raw =
    state.config.baseLuck +
    state.bonusLuck +
    state.config.luckPerLevel * (level - 1);
  return Math.min(raw, state.config.maxLuck);
}

// ─── Drop Rate Bonus ──────────────────────────────────────────

export function getDropRateBonus(state: LuckState, level: number = 1): number {
  return getEffectiveLuck(state, level) * state.config.dropRateMultiplier;
}

// ─── Crit Bonus ───────────────────────────────────────────────

export function getCritBonus(state: LuckState, level: number = 1): number {
  return getEffectiveLuck(state, level) * state.config.critBonusMultiplier;
}

// ─── Roll Luck ────────────────────────────────────────────────

export function rollLuck(
  state: LuckState,
  baseChance: number,
  level: number = 1,
  rng: () => number = Math.random,
): { newState: LuckState; success: boolean } {
  const modifiedChance = baseChance + getDropRateBonus(state, level);
  const roll = rng();
  const success = roll < modifiedChance;

  const newState: LuckState = {
    ...state,
    totalRolls: state.totalRolls + 1,
    luckyRolls: success ? state.luckyRolls + 1 : state.luckyRolls,
  };

  return { newState, success };
}

// ─── Bonus Management ─────────────────────────────────────────

export function addBonusLuck(state: LuckState, bonus: number): LuckState {
  return { ...state, bonusLuck: state.bonusLuck + bonus };
}

// ─── Upgrade Quality ──────────────────────────────────────────

export function getUpgradeQualityBonus(
  state: LuckState,
  level: number = 1,
): number {
  return getEffectiveLuck(state, level) / state.config.maxLuck;
}

// ─── Luck Percent ─────────────────────────────────────────────

export function getLuckPercent(state: LuckState, level: number = 1): number {
  return (getEffectiveLuck(state, level) / state.config.maxLuck) * 100;
}

// ─── Stats ────────────────────────────────────────────────────

export function getStats(state: LuckState): {
  totalRolls: number;
  luckyRolls: number;
  luckRate: number;
} {
  return {
    totalRolls: state.totalRolls,
    luckyRolls: state.luckyRolls,
    luckRate: state.totalRolls === 0 ? 0 : state.luckyRolls / state.totalRolls,
  };
}

// ─── Reset Stats ──────────────────────────────────────────────

export function resetStats(state: LuckState): LuckState {
  return { ...state, totalRolls: 0, luckyRolls: 0 };
}
