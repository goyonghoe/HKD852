/**
 * ComboChainCalc — pure TypeScript combo chain calculation module.
 * NO Phaser imports. Immutable state management.
 *
 * Advanced combo chain system with timing windows and escalating rewards.
 * Kill streaks build chains → higher multipliers → bigger scores.
 */

// ─── Types ───────────────────────────────────────────────────

export type ComboGrade =
  | "none"
  | "nice"
  | "great"
  | "excellent"
  | "legendary"
  | "godlike";

export interface ComboChainState {
  readonly currentChain: number;
  readonly maxChain: number;
  readonly timer: number;
  readonly windowMs: number;
  readonly multiplier: number;
  readonly grade: ComboGrade;
  readonly totalChains: number;
  readonly longestChain: number;
}

// ─── Constants ───────────────────────────────────────────────

const DEFAULT_WINDOW_MS = 2000;

const MULTIPLIER_THRESHOLDS: readonly { min: number; mult: number }[] = [
  { min: 100, mult: 5.0 },
  { min: 50, mult: 3.0 },
  { min: 20, mult: 2.0 },
  { min: 10, mult: 1.5 },
  { min: 5, mult: 1.2 },
  { min: 0, mult: 1.0 },
];

const GRADE_THRESHOLDS: readonly { min: number; grade: ComboGrade }[] = [
  { min: 150, grade: "godlike" },
  { min: 75, grade: "legendary" },
  { min: 30, grade: "excellent" },
  { min: 15, grade: "great" },
  { min: 5, grade: "nice" },
  { min: 0, grade: "none" },
];

const MILESTONES: readonly number[] = [10, 25, 50, 100, 250, 500];

// ─── Factory ─────────────────────────────────────────────────

export function createComboChain(
  windowMs: number = DEFAULT_WINDOW_MS,
): ComboChainState {
  return {
    currentChain: 0,
    maxChain: 0,
    timer: 0,
    windowMs,
    multiplier: 1.0,
    grade: "none",
    totalChains: 0,
    longestChain: 0,
  };
}

// ─── Core Functions ──────────────────────────────────────────

export function registerHit(state: ComboChainState): ComboChainState {
  const newChain = state.currentChain + 1;
  const newMax = Math.max(state.maxChain, newChain);
  const newLongest = Math.max(state.longestChain, newChain);

  const updated: ComboChainState = {
    ...state,
    currentChain: newChain,
    maxChain: newMax,
    timer: state.windowMs,
    longestChain: newLongest,
  };

  return {
    ...updated,
    multiplier: getMultiplier(updated),
    grade: getGrade(updated),
  };
}

export function tick(state: ComboChainState, dt: number): ComboChainState {
  if (state.currentChain === 0) return state;

  const newTimer = Math.max(0, state.timer - dt);

  if (newTimer <= 0) {
    return breakChain({ ...state, timer: 0 });
  }

  return { ...state, timer: newTimer };
}

// ─── Multiplier & Grade ──────────────────────────────────────

export function getMultiplier(state: ComboChainState): number {
  const chain = state.currentChain;
  for (const t of MULTIPLIER_THRESHOLDS) {
    if (chain >= t.min) return t.mult;
  }
  return 1.0;
}

export function getGrade(state: ComboChainState): ComboGrade {
  const chain = state.currentChain;
  for (const t of GRADE_THRESHOLDS) {
    if (chain >= t.min) return t.grade;
  }
  return "none";
}

// ─── Timer / UI ──────────────────────────────────────────────

export function getTimerPercent(state: ComboChainState): number {
  if (state.windowMs <= 0) return 0;
  return Math.max(0, Math.min(1, state.timer / state.windowMs));
}

// ─── Chain Management ────────────────────────────────────────

export function breakChain(state: ComboChainState): ComboChainState {
  const newLongest = Math.max(state.longestChain, state.currentChain);
  const hadChain = state.currentChain > 0;

  return {
    ...state,
    currentChain: 0,
    timer: 0,
    multiplier: 1.0,
    grade: "none",
    longestChain: newLongest,
    totalChains: hadChain ? state.totalChains + 1 : state.totalChains,
  };
}

// ─── Score ────────────────────────────────────────────────────

export function getScoreBonus(
  state: ComboChainState,
  baseScore: number,
): number {
  return baseScore * state.multiplier;
}

// ─── Queries ─────────────────────────────────────────────────

export function isChainActive(state: ComboChainState): boolean {
  return state.currentChain > 0 && state.timer > 0;
}

export function extendWindow(
  state: ComboChainState,
  bonusMs: number,
): ComboChainState {
  return {
    ...state,
    windowMs: state.windowMs + bonusMs,
    timer: Math.min(state.timer + bonusMs, state.windowMs + bonusMs),
  };
}

export function getChainMilestone(state: ComboChainState): number | null {
  const chain = state.currentChain;
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (chain >= MILESTONES[i]) return MILESTONES[i];
  }
  return null;
}

// ─── Stats Reset ─────────────────────────────────────────────

export function resetStats(state: ComboChainState): ComboChainState {
  return {
    ...state,
    totalChains: 0,
    longestChain: 0,
  };
}
