/**
 * ScoreCalc — pure TypeScript score calculation module.
 * NO Phaser imports.
 */

// ─── Interfaces ───────────────────────────────────────────────

export interface ScoreBreakdown {
  baseKillScore: number;
  bossBonus: number;
  survivalBonus: number;
  levelBonus: number;
  coinBonus: number;
  comboMultiplier: number;
  totalScore: number;
  grade: string;
}

export interface ComboState {
  current: number;
  max: number;
  timer: number;
}

// ─── Constants ────────────────────────────────────────────────

const KILL_POINTS = 10;
const BOSS_POINTS = 500;
const MAX_SURVIVAL_BONUS = 1000;
const SURVIVAL_CAP_SECONDS = 600; // 10 minutes
const LEVEL_POINTS = 50;
const COIN_MULTIPLIER = 0.5;
const COMBO_RATE = 0.01; // 1% per combo kill
const COMBO_MULTIPLIER_CAP = 2.0;
const COMBO_TIMER_RESET = 2.0; // seconds

// ─── Score Grading ────────────────────────────────────────────

export function getScoreGrade(score: number): string {
  if (score > 10000) return "S";
  if (score > 5000) return "A";
  if (score > 2500) return "B";
  if (score > 1000) return "C";
  if (score > 0) return "D";
  return "F";
}

// ─── Final Score ──────────────────────────────────────────────

export function calculateFinalScore(
  kills: number,
  bossesKilled: number,
  elapsed: number,
  level: number,
  coinsCollected: number,
  maxCombo: number,
): ScoreBreakdown {
  const baseKillScore = kills * KILL_POINTS;
  const bossBonus = bossesKilled * BOSS_POINTS;

  const survivalRatio = Math.min(elapsed / SURVIVAL_CAP_SECONDS, 1);
  const survivalBonus = Math.floor(survivalRatio * MAX_SURVIVAL_BONUS);

  const levelBonus = level * LEVEL_POINTS;
  const coinBonus = Math.floor(coinsCollected * COIN_MULTIPLIER);

  const comboMultiplier = Math.min(
    1.0 + maxCombo * COMBO_RATE,
    COMBO_MULTIPLIER_CAP,
  );

  const subtotal =
    baseKillScore + bossBonus + survivalBonus + levelBonus + coinBonus;
  const totalScore = Math.floor(subtotal * comboMultiplier);
  const grade = getScoreGrade(totalScore);

  return {
    baseKillScore,
    bossBonus,
    survivalBonus,
    levelBonus,
    coinBonus,
    comboMultiplier,
    totalScore,
    grade,
  };
}

// ─── Combo State ──────────────────────────────────────────────

export function createComboState(): ComboState {
  return { current: 0, max: 0, timer: 0 };
}

export function registerKill(state: ComboState): ComboState {
  const current = state.current + 1;
  const max = Math.max(current, state.max);
  return { current, max, timer: COMBO_TIMER_RESET };
}

export function tickCombo(state: ComboState, dt: number): ComboState {
  if (state.current === 0) return state;

  const timer = state.timer - dt;
  if (timer <= 0) {
    return { current: 0, max: state.max, timer: 0 };
  }
  return { ...state, timer };
}
