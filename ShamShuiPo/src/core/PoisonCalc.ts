/**
 * PoisonCalc — Pure TypeScript damage-over-time poison system
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export interface PoisonEffect {
  readonly id: string;
  readonly targetId: string;
  readonly damagePerTick: number;
  readonly tickInterval: number; // ms
  readonly totalDuration: number; // ms
  readonly elapsed: number; // ms
  readonly tickElapsed: number; // ms
  readonly totalDamageDealt: number;
  readonly active: boolean;
  readonly stackCount: number;
}

export interface PoisonConfig {
  readonly maxStacks: number;
  readonly stackMultiplier: number; // damage multiplier per stack
  readonly defaultDamage: number;
  readonly defaultTickInterval: number; // ms
  readonly defaultDuration: number; // ms
}

export interface PoisonState {
  readonly config: PoisonConfig;
  readonly effects: readonly PoisonEffect[];
}

// ── Defaults ───────────────────────────────────────────────────────

const DEFAULT_CONFIG: PoisonConfig = {
  maxStacks: 5,
  stackMultiplier: 0.5,
  defaultDamage: 3,
  defaultTickInterval: 500,
  defaultDuration: 5000,
};

// ── ID Generation ──────────────────────────────────────────────────

let _idCounter = 0;

function generateId(): string {
  return `poison_${++_idCounter}_${Date.now()}`;
}

// ── Functions ──────────────────────────────────────────────────────

export function createPoisonState(config?: Partial<PoisonConfig>): PoisonState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    effects: [],
  };
}

export function getEffectiveDamage(
  effect: PoisonEffect,
  stackMultiplier: number,
): number {
  return effect.damagePerTick * (1 + (effect.stackCount - 1) * stackMultiplier);
}

export function applyPoison(
  state: PoisonState,
  targetId: string,
  damage?: number,
  duration?: number,
  tickInterval?: number,
): PoisonState {
  const { config } = state;
  const dmg = damage ?? config.defaultDamage;
  const dur = duration ?? config.defaultDuration;
  const interval = tickInterval ?? config.defaultTickInterval;

  const existing = state.effects.find(
    (e) => e.targetId === targetId && e.active,
  );

  if (existing) {
    // Stack: increase stackCount (up to maxStacks) and refresh duration
    const newStackCount = Math.min(existing.stackCount + 1, config.maxStacks);
    const updated: PoisonEffect = {
      ...existing,
      stackCount: newStackCount,
      totalDuration: dur,
      elapsed: 0,
      tickElapsed: 0,
    };
    return {
      ...state,
      effects: state.effects.map((e) => (e.id === existing.id ? updated : e)),
    };
  }

  // New effect
  const effect: PoisonEffect = {
    id: generateId(),
    targetId,
    damagePerTick: dmg,
    tickInterval: interval,
    totalDuration: dur,
    elapsed: 0,
    tickElapsed: 0,
    totalDamageDealt: 0,
    active: true,
    stackCount: 1,
  };

  return {
    ...state,
    effects: [...state.effects, effect],
  };
}

export function updatePoison(
  state: PoisonState,
  deltaMs: number,
): {
  newState: PoisonState;
  tickDamages: readonly { targetId: string; damage: number }[];
} {
  const tickDamages: { targetId: string; damage: number }[] = [];

  const updatedEffects = state.effects.map((effect) => {
    if (!effect.active) return effect;

    let elapsed = effect.elapsed + deltaMs;
    let tickElapsed = effect.tickElapsed + deltaMs;
    let totalDamageDealt = effect.totalDamageDealt;
    let active: boolean = effect.active;

    // Process ticks
    while (tickElapsed >= effect.tickInterval && active) {
      const dmg = getEffectiveDamage(effect, state.config.stackMultiplier);
      tickDamages.push({ targetId: effect.targetId, damage: dmg });
      totalDamageDealt += dmg;
      tickElapsed -= effect.tickInterval;

      // Check if expired after this tick
      if (elapsed >= effect.totalDuration) {
        active = false;
        break;
      }
    }

    // Also deactivate if elapsed exceeds duration (even without tick)
    if (elapsed >= effect.totalDuration) {
      active = false;
    }

    return {
      ...effect,
      elapsed,
      tickElapsed: active ? tickElapsed : effect.tickElapsed,
      totalDamageDealt,
      active,
    };
  });

  return {
    newState: { ...state, effects: updatedEffects },
    tickDamages,
  };
}

export function getPoisonOnTarget(
  state: PoisonState,
  targetId: string,
): PoisonEffect | null {
  return state.effects.find((e) => e.targetId === targetId && e.active) ?? null;
}

export function isPoisoned(state: PoisonState, targetId: string): boolean {
  return state.effects.some((e) => e.targetId === targetId && e.active);
}

export function removePoison(
  state: PoisonState,
  targetId: string,
): PoisonState {
  return {
    ...state,
    effects: state.effects.map((e) =>
      e.targetId === targetId && e.active ? { ...e, active: false } : e,
    ),
  };
}

export function clearPoisons(state: PoisonState): PoisonState {
  return {
    ...state,
    effects: state.effects.map((e) => (e.active ? { ...e, active: false } : e)),
  };
}

export function getActivePoisonCount(state: PoisonState): number {
  return state.effects.filter((e) => e.active).length;
}

export function getTotalPoisonDPS(state: PoisonState): number {
  return state.effects
    .filter((e) => e.active)
    .reduce((sum, e) => {
      const effectiveDmg = getEffectiveDamage(e, state.config.stackMultiplier);
      const ticksPerSecond = 1000 / e.tickInterval;
      return sum + effectiveDmg * ticksPerSecond;
    }, 0);
}
