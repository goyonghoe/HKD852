// FreezeCalc.ts — Freeze/Stun mechanic (pure TypeScript, immutable state)

export interface FreezeEffect {
  readonly targetId: string;
  readonly duration: number; // ms total
  readonly elapsed: number; // ms elapsed
  readonly slowPercent: number; // 0-1: 1.0 = full freeze, <1.0 = partial slow
  readonly active: boolean;
}

export interface FreezeConfig {
  readonly baseDuration: number; // ms
  readonly baseSlowPercent: number; // 0-1
  readonly diminishingReturns: boolean;
  readonly diminishFactor: number; // multiplier per consecutive freeze
  readonly maxFreezeCount: number; // max times before immunity
}

export interface FreezeState {
  readonly config: FreezeConfig;
  readonly effects: readonly FreezeEffect[];
  readonly freezeCounts: Readonly<Record<string, number>>;
}

const DEFAULT_CONFIG: FreezeConfig = {
  baseDuration: 2000,
  baseSlowPercent: 1.0,
  diminishingReturns: true,
  diminishFactor: 0.7,
  maxFreezeCount: 3,
};

export function createFreezeState(config?: Partial<FreezeConfig>): FreezeState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    effects: [],
    freezeCounts: {},
  };
}

export function applyFreeze(
  state: FreezeState,
  targetId: string,
  duration?: number,
): FreezeState {
  const { config, freezeCounts } = state;
  const count = freezeCounts[targetId] ?? 0;

  // Immune — no effect
  if (count >= config.maxFreezeCount) {
    return state;
  }

  let effectDuration = duration ?? config.baseDuration;

  if (config.diminishingReturns && count > 0) {
    effectDuration *= Math.pow(config.diminishFactor, count);
  }

  const newEffect: FreezeEffect = {
    targetId,
    duration: effectDuration,
    elapsed: 0,
    slowPercent: config.baseSlowPercent,
    active: true,
  };

  // Remove any existing freeze on this target, then add new one
  const filtered = state.effects.filter((e) => e.targetId !== targetId);

  return {
    ...state,
    effects: [...filtered, newEffect],
    freezeCounts: { ...freezeCounts, [targetId]: count + 1 },
  };
}

export function updateFreezes(
  state: FreezeState,
  deltaMs: number,
): FreezeState {
  if (state.effects.length === 0) return state;

  const updated = state.effects.map((e) => {
    if (!e.active) return e;
    const newElapsed = e.elapsed + deltaMs;
    if (newElapsed >= e.duration) {
      return { ...e, elapsed: e.duration, active: false };
    }
    return { ...e, elapsed: newElapsed };
  });

  // Remove deactivated effects
  const active = updated.filter((e) => e.active);

  return { ...state, effects: active };
}

export function isFrozen(state: FreezeState, targetId: string): boolean {
  return state.effects.some((e) => e.targetId === targetId && e.active);
}

export function isImmune(state: FreezeState, targetId: string): boolean {
  const count = state.freezeCounts[targetId] ?? 0;
  return count >= state.config.maxFreezeCount;
}

export function getSpeedMultiplier(
  state: FreezeState,
  targetId: string,
): number {
  const effect = state.effects.find((e) => e.targetId === targetId && e.active);
  if (!effect) return 1.0;
  return 1.0 - effect.slowPercent;
}

export function getActiveFreezes(state: FreezeState): FreezeEffect[] {
  return state.effects.filter((e) => e.active);
}

export function removeFreeze(
  state: FreezeState,
  targetId: string,
): FreezeState {
  const filtered = state.effects.filter((e) => e.targetId !== targetId);
  if (filtered.length === state.effects.length) return state;
  return { ...state, effects: filtered };
}

export function clearFreezes(state: FreezeState): FreezeState {
  if (state.effects.length === 0) return state;
  return { ...state, effects: [] };
}

export function resetImmunity(
  state: FreezeState,
  targetId: string,
): FreezeState {
  if (state.freezeCounts[targetId] === undefined) return state;
  const { [targetId]: _, ...rest } = state.freezeCounts;
  return { ...state, freezeCounts: rest };
}

export function getFreezeCount(state: FreezeState, targetId: string): number {
  return state.freezeCounts[targetId] ?? 0;
}

export function getRemainingDuration(
  state: FreezeState,
  targetId: string,
): number {
  const effect = state.effects.find((e) => e.targetId === targetId && e.active);
  if (!effect) return 0;
  return Math.max(0, effect.duration - effect.elapsed);
}
