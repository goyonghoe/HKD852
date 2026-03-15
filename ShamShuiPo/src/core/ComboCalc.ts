/**
 * ComboCalc — pure TypeScript kill combo/streak system.
 * NO Phaser imports. Immutable state management.
 *
 * Tracks kill combos, multiplier scaling, timer decay,
 * combo tiers, grace period, and combo freeze.
 */

// ─── Types ───────────────────────────────────────────────────

export type ComboTier =
  | "none"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export type ComboConfig = {
  readonly comboWindow: number; // seconds before combo expires
  readonly baseMultiplier: number; // starting multiplier
  readonly multiplierPerKill: number; // multiplier increment per kill
  readonly maxMultiplier: number; // multiplier cap
  readonly gracePeriod: number; // seconds after timer expires before full reset
};

export type ComboState = {
  readonly count: number; // current kill combo count
  readonly maxCombo: number; // highest combo achieved in session
  readonly timer: number; // seconds remaining before combo expires
  readonly multiplier: number; // current combo multiplier
  readonly totalScore: number; // accumulated score in current combo
  readonly lastKillTime: number; // timestamp of last kill
  readonly inGracePeriod: boolean; // whether in grace period after timer expired
  readonly graceTimer: number; // seconds remaining in grace period
  readonly frozen: boolean; // whether timer decay is paused
  readonly freezeTimer: number; // seconds remaining on freeze
};

// ─── Constants / Defaults ────────────────────────────────────

const DEFAULT_CONFIG: ComboConfig = {
  comboWindow: 3.0,
  baseMultiplier: 1.0,
  multiplierPerKill: 0.1,
  maxMultiplier: 5.0,
  gracePeriod: 1.0,
};

// Tier thresholds (kill count)
const TIER_DIAMOND = 100;
const TIER_PLATINUM = 50;
const TIER_GOLD = 25;
const TIER_SILVER = 10;
const TIER_BRONZE = 5;

// ─── Factory ─────────────────────────────────────────────────

export function createComboConfig(
  overrides?: Partial<ComboConfig>,
): ComboConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

export function createComboState(): ComboState {
  return {
    count: 0,
    maxCombo: 0,
    timer: 0,
    multiplier: DEFAULT_CONFIG.baseMultiplier,
    totalScore: 0,
    lastKillTime: 0,
    inGracePeriod: false,
    graceTimer: 0,
    frozen: false,
    freezeTimer: 0,
  };
}

// ─── Core: Register Kill ─────────────────────────────────────

/**
 * Register a kill to increment combo count.
 * Resets timer, updates multiplier, tracks max combo.
 * Can rescue a combo during grace period.
 */
export function registerKill(
  state: ComboState,
  currentTime: number,
  config: ComboConfig = DEFAULT_CONFIG,
): ComboState {
  const newCount = state.count + 1;
  const newMultiplier = calcMultiplier(newCount, config);
  const newMax = Math.max(state.maxCombo, newCount);

  return {
    ...state,
    count: newCount,
    maxCombo: newMax,
    timer: config.comboWindow,
    multiplier: newMultiplier,
    lastKillTime: currentTime,
    inGracePeriod: false,
    graceTimer: 0,
  };
}

// ─── Core: Tick Timer ────────────────────────────────────────

/**
 * Tick the combo timer by delta time.
 * If frozen, decrements freeze timer instead.
 * When timer expires, enters grace period.
 * When grace period expires, combo breaks fully.
 */
export function tickCombo(
  state: ComboState,
  dt: number,
  config: ComboConfig = DEFAULT_CONFIG,
): ComboState {
  // No active combo — nothing to tick
  if (state.count === 0 && !state.inGracePeriod) {
    return state;
  }

  // Handle frozen state
  if (state.frozen) {
    const newFreezeTimer = state.freezeTimer - dt;
    if (newFreezeTimer <= 0) {
      return {
        ...state,
        frozen: false,
        freezeTimer: 0,
      };
    }
    return {
      ...state,
      freezeTimer: newFreezeTimer,
    };
  }

  // In grace period — tick grace timer
  if (state.inGracePeriod) {
    const newGraceTimer = state.graceTimer - dt;
    if (newGraceTimer <= 0) {
      return breakCombo(state);
    }
    return {
      ...state,
      graceTimer: newGraceTimer,
    };
  }

  // Normal timer decay
  const newTimer = state.timer - dt;
  if (newTimer <= 0) {
    // Enter grace period
    return {
      ...state,
      timer: 0,
      inGracePeriod: true,
      graceTimer: config.gracePeriod,
    };
  }

  return {
    ...state,
    timer: newTimer,
  };
}

// ─── Multiplier ──────────────────────────────────────────────

/**
 * Calculate multiplier for a given kill count.
 * Formula: baseMultiplier + count * multiplierPerKill, capped at maxMultiplier.
 */
export function calcMultiplier(
  count: number,
  config: ComboConfig = DEFAULT_CONFIG,
): number {
  const raw = config.baseMultiplier + count * config.multiplierPerKill;
  return Math.min(raw, config.maxMultiplier);
}

/**
 * Get the current combo multiplier from state.
 */
export function getMultiplier(state: ComboState): number {
  return state.multiplier;
}

// ─── Combo Tiers ─────────────────────────────────────────────

/**
 * Get the combo tier based on current kill count.
 * diamond (100+), platinum (50+), gold (25+), silver (10+), bronze (5+), none (<5)
 */
export function getComboTier(state: ComboState): ComboTier {
  return getTierForCount(state.count);
}

/**
 * Get tier for an arbitrary count value.
 */
export function getTierForCount(count: number): ComboTier {
  if (count >= TIER_DIAMOND) return "diamond";
  if (count >= TIER_PLATINUM) return "platinum";
  if (count >= TIER_GOLD) return "gold";
  if (count >= TIER_SILVER) return "silver";
  if (count >= TIER_BRONZE) return "bronze";
  return "none";
}

// ─── Score ───────────────────────────────────────────────────

/**
 * Calculate score bonus: baseScore * current multiplier.
 */
export function calcScoreBonus(state: ComboState, baseScore: number): number {
  return baseScore * state.multiplier;
}

/**
 * Get the combo score (count * multiplier as a simple metric).
 */
export function getComboScore(state: ComboState): number {
  return state.count * state.multiplier;
}

// ─── Queries ─────────────────────────────────────────────────

/**
 * Whether a combo is currently active (has kills and timer/grace not expired).
 */
export function isComboActive(state: ComboState): boolean {
  return state.count > 0 && (state.timer > 0 || state.inGracePeriod);
}

/**
 * Whether the combo is in the grace period.
 */
export function isInGracePeriod(state: ComboState): boolean {
  return state.inGracePeriod;
}

/**
 * Whether the combo timer is frozen.
 */
export function isFrozen(state: ComboState): boolean {
  return state.frozen;
}

/**
 * Get timer as a 0–100 percentage.
 */
export function getTimerPercent(
  state: ComboState,
  config: ComboConfig = DEFAULT_CONFIG,
): number {
  if (state.timer <= 0) return 0;
  const pct = (state.timer / config.comboWindow) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

/**
 * Get grace timer as a 0–100 percentage.
 */
export function getGracePercent(
  state: ComboState,
  config: ComboConfig = DEFAULT_CONFIG,
): number {
  if (!state.inGracePeriod || state.graceTimer <= 0) return 0;
  const pct = (state.graceTimer / config.gracePeriod) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

/**
 * Get the time remaining on the combo timer.
 */
export function getTimeRemaining(state: ComboState): number {
  return Math.max(state.timer, 0);
}

/**
 * Get the highest combo achieved this session.
 */
export function getMaxCombo(state: ComboState): number {
  return state.maxCombo;
}

// ─── Freeze ──────────────────────────────────────────────────

/**
 * Freeze the combo timer for a specified duration.
 * While frozen, the combo timer does not decay.
 */
export function freezeCombo(state: ComboState, duration: number): ComboState {
  if (state.count === 0) return state;
  return {
    ...state,
    frozen: true,
    freezeTimer: duration,
  };
}

/**
 * Unfreeze the combo timer immediately.
 */
export function unfreezeCombo(state: ComboState): ComboState {
  return {
    ...state,
    frozen: false,
    freezeTimer: 0,
  };
}

// ─── State Management ────────────────────────────────────────

/**
 * Break the current combo. Preserves maxCombo and lastKillTime.
 * Resets count, timer, multiplier, grace, freeze.
 */
export function breakCombo(state: ComboState): ComboState {
  return {
    count: 0,
    maxCombo: state.maxCombo,
    timer: 0,
    multiplier: DEFAULT_CONFIG.baseMultiplier,
    totalScore: 0,
    lastKillTime: state.lastKillTime,
    inGracePeriod: false,
    graceTimer: 0,
    frozen: false,
    freezeTimer: 0,
  };
}

/**
 * Full reset — clears everything including maxCombo and session history.
 */
export function resetCombo(): ComboState {
  return createComboState();
}

/**
 * Add score to the current combo's running total.
 */
export function addScore(state: ComboState, score: number): ComboState {
  return {
    ...state,
    totalScore: state.totalScore + score,
  };
}
