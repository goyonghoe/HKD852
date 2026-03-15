/**
 * StatusEffectCalc — Pure TypeScript status effect management system
 * No Phaser imports. All functions are pure and return new state (immutable).
 *
 * Supports buff/debuff/neutral effects with stack rules (refresh/stack/replace),
 * tick-based DoT/HoT, immunity system, combined stat modifiers, and priority sorting.
 */

// ── Types ──────────────────────────────────────────────────────────

export type EffectType = "buff" | "debuff" | "neutral";

export type EffectCategory =
  | "speed"
  | "damage"
  | "defense"
  | "regen"
  | "slow"
  | "stun"
  | "silence"
  | "bleed";

export type StackRule = "refresh" | "stack" | "replace";

export type StatusEffect = {
  readonly id: string;
  readonly name: string;
  readonly type: EffectType;
  readonly category: EffectCategory;
  readonly magnitude: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly source: string;
  readonly stackRule: StackRule;
  readonly stackCount: number;
  readonly maxStacks: number;
  readonly tickInterval: number;
  readonly lastTickTime: number;
  readonly priority: number;
};

export type StatusEffectState = {
  readonly effects: readonly StatusEffect[];
  readonly immunities: readonly EffectCategory[];
  readonly nextId: number;
};

export type TickResult = {
  readonly state: StatusEffectState;
  readonly tickedEffects: readonly StatusEffect[];
};

export type ApplyEffectParams = {
  readonly name: string;
  readonly type: EffectType;
  readonly category: EffectCategory;
  readonly magnitude: number;
  readonly duration: number;
  readonly source: string;
  readonly stackRule?: StackRule;
  readonly maxStacks?: number;
  readonly tickInterval?: number;
  readonly priority?: number;
};

// ── Constants ──────────────────────────────────────────────────────

const DEFAULT_MAX_STACKS = 5;
const DEFAULT_TICK_INTERVAL = 0;
const DEFAULT_PRIORITY = 0;
const DEFAULT_STACK_RULE: StackRule = "refresh";

// ── Factory ────────────────────────────────────────────────────────

export function createState(): StatusEffectState {
  return { effects: [], immunities: [], nextId: 1 };
}

// ── Apply Effect ───────────────────────────────────────────────────

export function applyEffect(
  state: StatusEffectState,
  params: ApplyEffectParams,
): StatusEffectState {
  const {
    name,
    type,
    category,
    magnitude,
    duration,
    source,
    stackRule = DEFAULT_STACK_RULE,
    maxStacks = DEFAULT_MAX_STACKS,
    tickInterval = DEFAULT_TICK_INTERVAL,
    priority = DEFAULT_PRIORITY,
  } = params;

  if (isImmuneTo(state, category)) {
    return state;
  }

  const existingIdx = state.effects.findIndex(
    (e) => e.name === name && e.source === source,
  );

  if (existingIdx >= 0) {
    const existing = state.effects[existingIdx];

    switch (stackRule) {
      case "refresh":
        return {
          ...state,
          effects: state.effects.map((e, i) =>
            i === existingIdx ? { ...e, elapsed: 0, duration, magnitude } : e,
          ),
        };

      case "stack": {
        if (existing.stackCount >= maxStacks) {
          return {
            ...state,
            effects: state.effects.map((e, i) =>
              i === existingIdx ? { ...e, elapsed: 0, duration } : e,
            ),
          };
        }
        return {
          ...state,
          effects: state.effects.map((e, i) =>
            i === existingIdx
              ? {
                  ...e,
                  magnitude: e.magnitude + magnitude,
                  stackCount: e.stackCount + 1,
                  elapsed: 0,
                  duration,
                }
              : e,
          ),
        };
      }

      case "replace": {
        if (magnitude >= existing.magnitude) {
          return {
            ...state,
            effects: state.effects.map((e, i) =>
              i === existingIdx ? { ...e, magnitude, elapsed: 0, duration } : e,
            ),
          };
        }
        return state;
      }
    }
  }

  const effect: StatusEffect = {
    id: `effect_${state.nextId}`,
    name,
    type,
    category,
    magnitude,
    duration,
    elapsed: 0,
    source,
    stackRule,
    stackCount: 1,
    maxStacks,
    tickInterval,
    lastTickTime: 0,
    priority,
  };

  return {
    ...state,
    effects: [...state.effects, effect],
    nextId: state.nextId + 1,
  };
}

// ── Remove Effects ─────────────────────────────────────────────────

export function removeEffect(
  state: StatusEffectState,
  effectId: string,
): StatusEffectState {
  return {
    ...state,
    effects: state.effects.filter((e) => e.id !== effectId),
  };
}

export function removeEffectByName(
  state: StatusEffectState,
  name: string,
  source?: string,
): StatusEffectState {
  return {
    ...state,
    effects: state.effects.filter(
      (e) =>
        !(e.name === name && (source === undefined || e.source === source)),
    ),
  };
}

export function clearByCategory(
  state: StatusEffectState,
  category: EffectCategory,
): StatusEffectState {
  return {
    ...state,
    effects: state.effects.filter((e) => e.category !== category),
  };
}

export function clearByType(
  state: StatusEffectState,
  type: EffectType,
): StatusEffectState {
  return {
    ...state,
    effects: state.effects.filter((e) => e.type !== type),
  };
}

export function clearAll(state: StatusEffectState): StatusEffectState {
  return { ...state, effects: [] };
}

// ── Tick / Expiration ──────────────────────────────────────────────

export function tick(state: StatusEffectState, dt: number): TickResult {
  const tickedEffects: StatusEffect[] = [];

  const updatedEffects = state.effects
    .map((e) => {
      const newElapsed = e.elapsed + dt;
      let newLastTick = e.lastTickTime;

      if (e.tickInterval > 0) {
        const timeSinceLastTick = newElapsed - e.lastTickTime;
        if (timeSinceLastTick >= e.tickInterval) {
          const tickCount = Math.floor(timeSinceLastTick / e.tickInterval);
          newLastTick = e.lastTickTime + tickCount * e.tickInterval;
          for (let i = 0; i < tickCount; i++) {
            tickedEffects.push(e);
          }
        }
      }

      return { ...e, elapsed: newElapsed, lastTickTime: newLastTick };
    })
    .filter((e) => e.elapsed < e.duration);

  return {
    state: { ...state, effects: updatedEffects },
    tickedEffects,
  };
}

export function expireEffects(state: StatusEffectState): StatusEffectState {
  return {
    ...state,
    effects: state.effects.filter((e) => e.elapsed < e.duration),
  };
}

// ── Immunity System ────────────────────────────────────────────────

export function addImmunity(
  state: StatusEffectState,
  category: EffectCategory,
): StatusEffectState {
  if (state.immunities.includes(category)) {
    return {
      ...state,
      effects: state.effects.filter((e) => e.category !== category),
    };
  }
  return {
    ...state,
    immunities: [...state.immunities, category],
    effects: state.effects.filter((e) => e.category !== category),
  };
}

export function removeImmunity(
  state: StatusEffectState,
  category: EffectCategory,
): StatusEffectState {
  return {
    ...state,
    immunities: state.immunities.filter((c) => c !== category),
  };
}

export function isImmuneTo(
  state: StatusEffectState,
  category: EffectCategory,
): boolean {
  return state.immunities.includes(category);
}

export function clearImmunities(state: StatusEffectState): StatusEffectState {
  return { ...state, immunities: [] };
}

// ── Queries ────────────────────────────────────────────────────────

export function getActiveEffects(
  state: StatusEffectState,
): readonly StatusEffect[] {
  return state.effects;
}

export function getEffectsByCategory(
  state: StatusEffectState,
  category: EffectCategory,
): readonly StatusEffect[] {
  return state.effects.filter((e) => e.category === category);
}

export function getEffectsByType(
  state: StatusEffectState,
  type: EffectType,
): readonly StatusEffect[] {
  return state.effects.filter((e) => e.type === type);
}

export function hasEffect(state: StatusEffectState, name: string): boolean {
  return state.effects.some((e) => e.name === name);
}

export function hasEffectFromSource(
  state: StatusEffectState,
  name: string,
  source: string,
): boolean {
  return state.effects.some((e) => e.name === name && e.source === source);
}

export function isStunned(state: StatusEffectState): boolean {
  return state.effects.some((e) => e.category === "stun");
}

export function isSilenced(state: StatusEffectState): boolean {
  return state.effects.some((e) => e.category === "silence");
}

export function isBleeding(state: StatusEffectState): boolean {
  return state.effects.some((e) => e.category === "bleed");
}

export function isSlowed(state: StatusEffectState): boolean {
  return state.effects.some((e) => e.category === "slow");
}

export function getEffectCount(state: StatusEffectState): number {
  return state.effects.length;
}

export function getEffectCountByType(
  state: StatusEffectState,
  type: EffectType,
): number {
  return state.effects.filter((e) => e.type === type).length;
}

// ── Combined Modifiers ─────────────────────────────────────────────

export function getCombinedModifier(
  state: StatusEffectState,
  stat: EffectCategory,
): number {
  const relevant = state.effects.filter((e) => e.category === stat);

  if (relevant.length === 0) return 1.0;

  return relevant.reduce((acc, e) => {
    if (e.type === "buff") {
      return acc * (1 + e.magnitude);
    } else if (e.type === "debuff") {
      return acc * Math.max(0, 1 - e.magnitude);
    }
    return acc;
  }, 1.0);
}

export function getSpeedModifier(state: StatusEffectState): number {
  const speedMod = getCombinedModifier(state, "speed");
  const slowMod = getCombinedModifier(state, "slow");
  const stunMod = state.effects.some((e) => e.category === "stun") ? 0 : 1;
  return speedMod * slowMod * stunMod;
}

export function getDamageModifier(state: StatusEffectState): number {
  const damageMod = getCombinedModifier(state, "damage");
  const silenceMod = getCombinedModifier(state, "silence");
  return damageMod * silenceMod;
}

export function getDefenseModifier(state: StatusEffectState): number {
  return getCombinedModifier(state, "defense");
}

export function getRegenModifier(state: StatusEffectState): number {
  return getCombinedModifier(state, "regen");
}

// ── Tick Damage / Healing ──────────────────────────────────────────

export function getBleedDamagePerTick(state: StatusEffectState): number {
  return state.effects
    .filter((e) => e.category === "bleed")
    .reduce((sum, e) => sum + e.magnitude, 0);
}

export function getRegenPerTick(state: StatusEffectState): number {
  return state.effects
    .filter((e) => e.category === "regen")
    .reduce((sum, e) => sum + e.magnitude, 0);
}

// ── Display Ordering ───────────────────────────────────────────────

export function getEffectsSortedByPriority(
  state: StatusEffectState,
): readonly StatusEffect[] {
  return [...state.effects].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const typeOrder: Record<EffectType, number> = {
      buff: 2,
      neutral: 1,
      debuff: 0,
    };
    if (typeOrder[b.type] !== typeOrder[a.type]) {
      return typeOrder[b.type] - typeOrder[a.type];
    }
    const aRemaining = a.duration - a.elapsed;
    const bRemaining = b.duration - b.elapsed;
    return aRemaining - bRemaining;
  });
}

export function getRemainingDuration(effect: StatusEffect): number {
  return Math.max(0, effect.duration - effect.elapsed);
}

export function getEffectProgress(effect: StatusEffect): number {
  if (effect.duration <= 0) return 1;
  return Math.min(1, effect.elapsed / effect.duration);
}
