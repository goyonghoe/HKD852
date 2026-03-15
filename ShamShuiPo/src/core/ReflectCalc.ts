/**
 * ReflectCalc — pure TypeScript damage reflect / thorns system.
 * NO Phaser imports. Immutable state management.
 *
 * When the player takes damage, a percentage is reflected back to the attacker.
 */

// ─── Types ───────────────────────────────────────────────────

export type ReflectType = "physical" | "magical" | "true";

export interface ReflectConfig {
  readonly reflectPercent: number;
  readonly flatReflect: number;
  readonly minReflect: number;
  readonly maxReflect: number;
  readonly reflectType: ReflectType;
}

export interface ReflectState {
  readonly config: ReflectConfig;
  readonly totalReflected: number;
  readonly reflectCount: number;
}

// ─── Defaults ────────────────────────────────────────────────

const DEFAULT_CONFIG: ReflectConfig = {
  reflectPercent: 0.15,
  flatReflect: 5,
  minReflect: 1,
  maxReflect: 100,
  reflectType: "true",
};

// ─── Factory ─────────────────────────────────────────────────

export function createReflectState(
  config?: Partial<ReflectConfig>,
): ReflectState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    totalReflected: 0,
    reflectCount: 0,
  };
}

// ─── Calculation ─────────────────────────────────────────────

export function calculateReflectDamage(
  state: ReflectState,
  incomingDamage: number,
): number {
  const raw =
    incomingDamage * state.config.reflectPercent + state.config.flatReflect;
  return Math.min(
    Math.max(raw, state.config.minReflect),
    state.config.maxReflect,
  );
}

// ─── Apply ───────────────────────────────────────────────────

export function applyReflect(
  state: ReflectState,
  incomingDamage: number,
): { newState: ReflectState; reflectedDamage: number } {
  const reflectedDamage = calculateReflectDamage(state, incomingDamage);
  const newState: ReflectState = {
    ...state,
    totalReflected: state.totalReflected + reflectedDamage,
    reflectCount: state.reflectCount + 1,
  };
  return { newState, reflectedDamage };
}

// ─── Config Setters ──────────────────────────────────────────

export function setReflectPercent(
  state: ReflectState,
  percent: number,
): ReflectState {
  const clamped = Math.min(Math.max(percent, 0), 1);
  return {
    ...state,
    config: { ...state.config, reflectPercent: clamped },
  };
}

export function setFlatReflect(
  state: ReflectState,
  flat: number,
): ReflectState {
  return {
    ...state,
    config: { ...state.config, flatReflect: flat },
  };
}

// ─── Stats / Queries ─────────────────────────────────────────

export function getAverageReflect(state: ReflectState): number {
  if (state.reflectCount === 0) return 0;
  return state.totalReflected / state.reflectCount;
}

export function getReflectStats(state: ReflectState): {
  totalReflected: number;
  reflectCount: number;
  averageReflect: number;
  config: ReflectConfig;
} {
  return {
    totalReflected: state.totalReflected,
    reflectCount: state.reflectCount,
    averageReflect: getAverageReflect(state),
    config: state.config,
  };
}

export function resetStats(state: ReflectState): ReflectState {
  return {
    ...state,
    totalReflected: 0,
    reflectCount: 0,
  };
}

export function isReflectActive(state: ReflectState): boolean {
  return state.config.reflectPercent > 0 || state.config.flatReflect > 0;
}
