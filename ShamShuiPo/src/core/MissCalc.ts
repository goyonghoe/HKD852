// MissCalc.ts — Evasion / Miss Chance System
// Pure TypeScript, no Phaser imports. Immutable state.

export interface EvasionConfig {
  readonly baseEvasion: number; // 0-1
  readonly maxEvasion: number; // 0-1, hard cap
  readonly evasionPerLevel: number; // bonus per player level
  readonly diminishingFactor: number; // 0-1, diminishing returns factor
}

export interface EvasionState {
  readonly config: EvasionConfig;
  readonly bonusEvasion: number;
  readonly totalDodges: number;
  readonly totalChecks: number;
  readonly consecutiveDodges: number;
  readonly maxConsecutiveDodges: number;
}

const DEFAULT_CONFIG: EvasionConfig = {
  baseEvasion: 0.05,
  maxEvasion: 0.75,
  evasionPerLevel: 0.01,
  diminishingFactor: 0.8,
};

export function createEvasionState(
  config?: Partial<EvasionConfig>,
): EvasionState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    bonusEvasion: 0,
    totalDodges: 0,
    totalChecks: 0,
    consecutiveDodges: 0,
    maxConsecutiveDodges: 0,
  };
}

export function applyDiminishing(rawEvasion: number, factor: number): number {
  const clamped = Math.max(0, Math.min(1, rawEvasion));
  return 1 - Math.pow(1 - clamped, factor);
}

export function getEffectiveEvasion(
  state: EvasionState,
  level: number = 1,
): number {
  const lvl = Math.max(1, level);
  const raw =
    state.config.baseEvasion +
    state.bonusEvasion +
    state.config.evasionPerLevel * (lvl - 1);
  const diminished = applyDiminishing(raw, state.config.diminishingFactor);
  return Math.min(diminished, state.config.maxEvasion);
}

export function rollEvasion(
  state: EvasionState,
  level: number = 1,
  rng: () => number = Math.random,
): { newState: EvasionState; dodged: boolean } {
  const evasion = getEffectiveEvasion(state, level);
  const roll = rng();
  const dodged = roll < evasion;

  const newConsecutive = dodged ? state.consecutiveDodges + 1 : 0;
  const newMaxConsecutive = Math.max(
    state.maxConsecutiveDodges,
    newConsecutive,
  );

  return {
    newState: {
      ...state,
      totalChecks: state.totalChecks + 1,
      totalDodges: state.totalDodges + (dodged ? 1 : 0),
      consecutiveDodges: newConsecutive,
      maxConsecutiveDodges: newMaxConsecutive,
    },
    dodged,
  };
}

export function addBonusEvasion(
  state: EvasionState,
  bonus: number,
): EvasionState {
  return {
    ...state,
    bonusEvasion: state.bonusEvasion + bonus,
  };
}

export function getEvasionPercent(
  state: EvasionState,
  level: number = 1,
): number {
  return getEffectiveEvasion(state, level) * 100;
}

export function getDodgeRate(state: EvasionState): number {
  if (state.totalChecks === 0) return 0;
  return state.totalDodges / state.totalChecks;
}

export function getStats(state: EvasionState): {
  totalDodges: number;
  totalChecks: number;
  dodgeRate: number;
  consecutiveDodges: number;
  maxConsecutiveDodges: number;
} {
  return {
    totalDodges: state.totalDodges,
    totalChecks: state.totalChecks,
    dodgeRate: getDodgeRate(state),
    consecutiveDodges: state.consecutiveDodges,
    maxConsecutiveDodges: state.maxConsecutiveDodges,
  };
}

export function resetStats(state: EvasionState): EvasionState {
  return {
    ...state,
    totalDodges: 0,
    totalChecks: 0,
    consecutiveDodges: 0,
    maxConsecutiveDodges: 0,
  };
}

export function setMaxEvasion(
  state: EvasionState,
  maxEvasion: number,
): EvasionState {
  return {
    ...state,
    config: {
      ...state.config,
      maxEvasion,
    },
  };
}
