// ── Neon Survivors: UI Animation Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type EasingFn =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "bounce"
  | "elastic"
  | "back";

export interface AnimState {
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  easing: EasingFn;
  isComplete: boolean;
}

export interface NumberPopup {
  value: number;
  x: number;
  y: number;
  elapsed: number;
  duration: number;
  isCrit: boolean;
  color: number;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const POPUP_DURATION = 800;
const POPUP_FLOAT_DISTANCE = 40;
const POPUP_NORMAL_COLOR = 0xffffff;
const POPUP_CRIT_COLOR = 0xffdd00;
const POPUP_CRIT_START_SCALE = 1.8;
const POPUP_CRIT_END_SCALE = 1.2;
const SMOOTH_DAMP_EPSILON = 0.0001;

// ════════════════════════════════════════════════════════════════
// § EASING FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Apply an easing function to a 0-1 progress value.
 * Input is clamped to [0, 1].
 */
export function ease(t: number, fn: EasingFn): number {
  const c = Math.max(0, Math.min(1, t));
  switch (fn) {
    case "linear":
      return c;
    case "easeIn":
      return c * c * c;
    case "easeOut":
      return 1 - Math.pow(1 - c, 3);
    case "easeInOut":
      return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
    case "bounce":
      return easeOutBounce(c);
    case "elastic":
      return easeOutElastic(c);
    case "back":
      return easeOutBack(c);
  }
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    const t2 = t - 1.5 / d1;
    return n1 * t2 * t2 + 0.75;
  } else if (t < 2.5 / d1) {
    const t2 = t - 2.25 / d1;
    return n1 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / d1;
    return n1 * t2 * t2 + 0.984375;
  }
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ════════════════════════════════════════════════════════════════
// § ANIMATION LIFECYCLE
// ════════════════════════════════════════════════════════════════

/**
 * Create a new animation state.
 */
export function createAnim(
  from: number,
  to: number,
  duration: number,
  easing: EasingFn = "easeOut",
): AnimState {
  return {
    from,
    to,
    duration: Math.max(0, duration),
    elapsed: 0,
    easing,
    isComplete: duration <= 0,
  };
}

/**
 * Advance animation by dt milliseconds. Returns new state (immutable).
 */
export function tickAnim(state: AnimState, dt: number): AnimState {
  if (state.isComplete) return state;
  const elapsed = Math.min(state.elapsed + dt, state.duration);
  return {
    ...state,
    elapsed,
    isComplete: elapsed >= state.duration,
  };
}

/**
 * Get the current interpolated value of an animation.
 */
export function getValue(state: AnimState): number {
  if (state.duration <= 0) return state.to;
  const t = Math.min(state.elapsed / state.duration, 1);
  const easedT = ease(t, state.easing);
  return state.from + (state.to - state.from) * easedT;
}

// ════════════════════════════════════════════════════════════════
// § INTERPOLATION
// ════════════════════════════════════════════════════════════════

/**
 * Linear interpolation between a and b by t (unclamped).
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two RGB hex colors channel by channel.
 * t is clamped to [0, 1].
 */
export function lerpColor(colorA: number, colorB: number, t: number): number {
  const ct = Math.max(0, Math.min(1, t));
  const rA = (colorA >> 16) & 0xff;
  const gA = (colorA >> 8) & 0xff;
  const bA = colorA & 0xff;
  const rB = (colorB >> 16) & 0xff;
  const gB = (colorB >> 8) & 0xff;
  const bB = colorB & 0xff;
  const r = Math.round(rA + (rB - rA) * ct);
  const g = Math.round(gA + (gB - gA) * ct);
  const b = Math.round(bA + (bB - bA) * ct);
  return (r << 16) | (g << 8) | b;
}

// ════════════════════════════════════════════════════════════════
// § NUMBER POPUP
// ════════════════════════════════════════════════════════════════

/**
 * Create a damage/heal number popup.
 */
export function createNumberPopup(
  value: number,
  x: number,
  y: number,
  isCrit: boolean,
): NumberPopup {
  return {
    value,
    x,
    y,
    elapsed: 0,
    duration: POPUP_DURATION,
    isCrit,
    color: isCrit ? POPUP_CRIT_COLOR : POPUP_NORMAL_COLOR,
  };
}

/**
 * Advance a number popup by dt milliseconds.
 */
export function tickNumberPopup(popup: NumberPopup, dt: number): NumberPopup {
  const elapsed = Math.min(popup.elapsed + dt, popup.duration);
  return { ...popup, elapsed };
}

/**
 * Get popup alpha (fades out over lifetime). Full opacity for first 60%, then fade.
 */
export function getPopupAlpha(popup: NumberPopup): number {
  if (popup.duration <= 0) return 0;
  const progress = popup.elapsed / popup.duration;
  if (progress <= 0.6) return 1;
  return 1 - (progress - 0.6) / 0.4;
}

/**
 * Get popup scale. Crits start big and settle; normal is always 1.0.
 */
export function getPopupScale(popup: NumberPopup): number {
  if (!popup.isCrit) return 1.0;
  if (popup.duration <= 0) return POPUP_CRIT_END_SCALE;
  const progress = Math.min(popup.elapsed / popup.duration, 1);
  // Crit: starts at CRIT_START_SCALE, settles to CRIT_END_SCALE over first 30%
  if (progress <= 0.3) {
    const t = progress / 0.3;
    return (
      POPUP_CRIT_START_SCALE +
      (POPUP_CRIT_END_SCALE - POPUP_CRIT_START_SCALE) * t
    );
  }
  return POPUP_CRIT_END_SCALE;
}

/**
 * Get popup Y position. Floats upward by POPUP_FLOAT_DISTANCE over duration.
 */
export function getPopupY(popup: NumberPopup): number {
  if (popup.duration <= 0) return popup.y - POPUP_FLOAT_DISTANCE;
  const progress = Math.min(popup.elapsed / popup.duration, 1);
  return popup.y - POPUP_FLOAT_DISTANCE * progress;
}

// ════════════════════════════════════════════════════════════════
// § SMOOTH DAMP
// ════════════════════════════════════════════════════════════════

/**
 * Critically-damped spring for smooth camera follow / UI chase.
 * Based on Game Programming Gems 4 smooth damp algorithm.
 */
export function smoothDamp(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  dt: number,
): { value: number; velocity: number } {
  const st = Math.max(SMOOTH_DAMP_EPSILON, smoothTime);
  const omega = 2 / st;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (velocity + omega * change) * dt;
  let newVelocity = (velocity - omega * temp) * exp;
  let newValue = target + (change + temp) * exp;
  // Prevent overshooting
  if (target - current > 0 === newValue > target) {
    newValue = target;
    newVelocity = 0;
  }
  return { value: newValue, velocity: newVelocity };
}
