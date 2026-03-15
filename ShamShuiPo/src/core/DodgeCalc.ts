// ── Neon Survivors: Dodge / Dash Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface DodgeState {
  readonly cooldownTimer: number;
  readonly cooldownDuration: number;
  readonly iFrameTimer: number;
  readonly iFrameDuration: number;
  readonly dashDistance: number;
  readonly dashSpeed: number;
  readonly isDashing: boolean;
  readonly dashDirection: number;
  readonly dashProgress: number;
  readonly totalDodges: number;
  readonly perfectDodges: number;
  readonly charges: number;
  readonly maxCharges: number;
  readonly chargeRegenTimer: number;
  readonly chargeRegenDuration: number;
}

export interface DodgeConfig {
  readonly cooldownDuration?: number;
  readonly iFrameDuration?: number;
  readonly dashDistance?: number;
  readonly dashSpeed?: number;
  readonly maxCharges?: number;
  readonly chargeRegenDuration?: number;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_COOLDOWN = 1.5;
const DEFAULT_IFRAME_DURATION = 0.2;
const DEFAULT_DASH_DISTANCE = 100;
const DEFAULT_DASH_SPEED = 600;
const DEFAULT_MAX_CHARGES = 2;
const DEFAULT_CHARGE_REGEN = 3.0;

/** Distance threshold for perfect dodge detection (pixels) */
const PERFECT_DODGE_RANGE = 30;

// ════════════════════════════════════════════════════════════════
// § createDodgeState
// ════════════════════════════════════════════════════════════════

/**
 * Create initial dodge state with optional config overrides.
 */
export function createDodgeState(config?: DodgeConfig): DodgeState {
  const maxCharges = config?.maxCharges ?? DEFAULT_MAX_CHARGES;
  return {
    cooldownTimer: 0,
    cooldownDuration: config?.cooldownDuration ?? DEFAULT_COOLDOWN,
    iFrameTimer: 0,
    iFrameDuration: config?.iFrameDuration ?? DEFAULT_IFRAME_DURATION,
    dashDistance: config?.dashDistance ?? DEFAULT_DASH_DISTANCE,
    dashSpeed: config?.dashSpeed ?? DEFAULT_DASH_SPEED,
    isDashing: false,
    dashDirection: 0,
    dashProgress: 0,
    totalDodges: 0,
    perfectDodges: 0,
    charges: maxCharges,
    maxCharges,
    chargeRegenTimer: 0,
    chargeRegenDuration: config?.chargeRegenDuration ?? DEFAULT_CHARGE_REGEN,
  };
}

// ════════════════════════════════════════════════════════════════
// § canDodge
// ════════════════════════════════════════════════════════════════

/**
 * True if the player can initiate a dodge (has charges and not on cooldown).
 */
export function canDodge(state: DodgeState): boolean {
  return state.cooldownTimer <= 0 && state.charges > 0;
}

// ════════════════════════════════════════════════════════════════
// § startDodge
// ════════════════════════════════════════════════════════════════

/**
 * Begin a dash: consume a charge, start iFrame timer, set dash direction.
 * Returns unchanged state if dodge is not available.
 */
export function startDodge(state: DodgeState, direction: number): DodgeState {
  if (!canDodge(state)) return state;

  return {
    ...state,
    isDashing: true,
    dashDirection: direction,
    dashProgress: 0,
    cooldownTimer: state.cooldownDuration,
    iFrameTimer: state.iFrameDuration,
    charges: state.charges - 1,
    totalDodges: state.totalDodges + 1,
    chargeRegenTimer:
      state.charges === state.maxCharges
        ? state.chargeRegenDuration
        : state.chargeRegenTimer,
  };
}

// ════════════════════════════════════════════════════════════════
// § tick
// ════════════════════════════════════════════════════════════════

/**
 * Advance all timers by `dt` seconds. Returns new state.
 *
 * - Cooldown timer counts down toward 0.
 * - iFrame timer counts down toward 0.
 * - Dash progress advances based on dashSpeed.
 * - When dash progress >= dashDistance, dash ends.
 * - Charge regen timer counts down; when 0, one charge is restored.
 */
export function tick(state: DodgeState, dt: number): DodgeState {
  if (dt <= 0) return state;

  let cooldownTimer = Math.max(0, state.cooldownTimer - dt);
  let iFrameTimer = Math.max(0, state.iFrameTimer - dt);

  // Advance dash
  let isDashing = state.isDashing;
  let dashProgress = state.dashProgress;
  if (isDashing) {
    dashProgress += state.dashSpeed * dt;
    if (dashProgress >= state.dashDistance) {
      dashProgress = state.dashDistance;
      isDashing = false;
    }
  }

  // Charge regeneration
  let charges = state.charges;
  let chargeRegenTimer = state.chargeRegenTimer;
  if (charges < state.maxCharges) {
    if (chargeRegenTimer <= 0) {
      // Start regen timer if not already running
      chargeRegenTimer = state.chargeRegenDuration;
    }
    chargeRegenTimer -= dt;
    if (chargeRegenTimer <= 0) {
      charges = Math.min(charges + 1, state.maxCharges);
      // If still missing charges, reset timer for next charge
      chargeRegenTimer =
        charges < state.maxCharges ? state.chargeRegenDuration : 0;
    }
  }

  return {
    ...state,
    cooldownTimer,
    iFrameTimer,
    isDashing,
    dashProgress,
    charges,
    chargeRegenTimer,
  };
}

// ════════════════════════════════════════════════════════════════
// § isInvincible
// ════════════════════════════════════════════════════════════════

/**
 * True if the player is currently in invincibility frames.
 */
export function isInvincible(state: DodgeState): boolean {
  return state.iFrameTimer > 0;
}

// ════════════════════════════════════════════════════════════════
// § isDashing
// ════════════════════════════════════════════════════════════════

/**
 * True if the player is currently in a dash animation.
 */
export function isDashingFn(state: DodgeState): boolean {
  return state.isDashing;
}

// ════════════════════════════════════════════════════════════════
// § getDashPosition
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the player's current position during a dash.
 * Returns { x, y } based on start position + progress along dash direction.
 */
export function getDashPosition(
  state: DodgeState,
  startX: number,
  startY: number,
): { x: number; y: number } {
  if (!state.isDashing && state.dashProgress === 0) {
    return { x: startX, y: startY };
  }

  const dx = Math.cos(state.dashDirection) * state.dashProgress;
  const dy = Math.sin(state.dashDirection) * state.dashProgress;

  return {
    x: startX + dx,
    y: startY + dy,
  };
}

// ════════════════════════════════════════════════════════════════
// § getDashEndPosition
// ════════════════════════════════════════════════════════════════

/**
 * Calculate where a dash will end given start position, direction, and distance.
 */
export function getDashEndPosition(
  startX: number,
  startY: number,
  direction: number,
  distance: number,
): { x: number; y: number } {
  return {
    x: startX + Math.cos(direction) * distance,
    y: startY + Math.sin(direction) * distance,
  };
}

// ════════════════════════════════════════════════════════════════
// § registerPerfectDodge
// ════════════════════════════════════════════════════════════════

/**
 * Increment the perfect dodge counter.
 */
export function registerPerfectDodge(state: DodgeState): DodgeState {
  return {
    ...state,
    perfectDodges: state.perfectDodges + 1,
  };
}

// ════════════════════════════════════════════════════════════════
// § isPerfectDodgeWindow
// ════════════════════════════════════════════════════════════════

/**
 * True if an enemy is within 30px during active iFrames — a perfect dodge.
 */
export function isPerfectDodgeWindow(
  state: DodgeState,
  enemyDistance: number,
): boolean {
  return state.iFrameTimer > 0 && enemyDistance <= PERFECT_DODGE_RANGE;
}

// ════════════════════════════════════════════════════════════════
// § addCharge
// ════════════════════════════════════════════════════════════════

/**
 * Add one dodge charge (e.g., from a power-up). Cannot exceed maxCharges.
 */
export function addCharge(state: DodgeState): DodgeState {
  return {
    ...state,
    charges: Math.min(state.charges + 1, state.maxCharges),
  };
}

// ════════════════════════════════════════════════════════════════
// § upgradeMaxCharges
// ════════════════════════════════════════════════════════════════

/**
 * Increase max charges and grant the difference as bonus charges.
 */
export function upgradeMaxCharges(
  state: DodgeState,
  newMax: number,
): DodgeState {
  if (newMax <= state.maxCharges) return state;
  const bonus = newMax - state.maxCharges;
  return {
    ...state,
    maxCharges: newMax,
    charges: state.charges + bonus,
  };
}

// ════════════════════════════════════════════════════════════════
// § upgradeCooldown
// ════════════════════════════════════════════════════════════════

/**
 * Reduce cooldown duration by `reduction` seconds. Minimum 0.1s.
 */
export function upgradeCooldown(
  state: DodgeState,
  reduction: number,
): DodgeState {
  return {
    ...state,
    cooldownDuration: Math.max(0.1, state.cooldownDuration - reduction),
  };
}

// ════════════════════════════════════════════════════════════════
// § upgradeIFrames
// ════════════════════════════════════════════════════════════════

/**
 * Extend iFrame duration by `bonusMs` milliseconds.
 */
export function upgradeIFrames(state: DodgeState, bonusMs: number): DodgeState {
  return {
    ...state,
    iFrameDuration: state.iFrameDuration + bonusMs / 1000,
  };
}

// ════════════════════════════════════════════════════════════════
// § getCooldownPercent
// ════════════════════════════════════════════════════════════════

/**
 * Returns 0–1 representing how much cooldown remains. 0 = ready, 1 = just started.
 */
export function getCooldownPercent(state: DodgeState): number {
  if (state.cooldownDuration <= 0) return 0;
  return Math.max(0, Math.min(1, state.cooldownTimer / state.cooldownDuration));
}
