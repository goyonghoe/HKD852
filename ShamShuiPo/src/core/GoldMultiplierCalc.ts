// ── Neon Survivors: Gold Multiplier Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface GoldSource {
  readonly id: string;
  readonly multiplier: number;
  readonly duration: number; // ms — 0 = permanent
  readonly elapsed: number; // ms
  readonly source: string;
}

export interface GoldMultiplierState {
  readonly sources: readonly GoldSource[];
  readonly baseGold: number;
  readonly totalGoldEarned: number;
  readonly totalPickups: number;
}

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

export function createGoldMultiplierState(
  baseGold: number = 1,
): GoldMultiplierState {
  return {
    sources: [],
    baseGold,
    totalGoldEarned: 0,
    totalPickups: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § SOURCE MANAGEMENT
// ════════════════════════════════════════════════════════════════

export function addMultiplier(
  state: GoldMultiplierState,
  id: string,
  multiplier: number,
  duration: number = 0,
  source: string = "unknown",
): GoldMultiplierState {
  const newSource: GoldSource = {
    id,
    multiplier,
    duration,
    elapsed: 0,
    source,
  };
  return {
    ...state,
    sources: [...state.sources, newSource],
  };
}

export function removeMultiplier(
  state: GoldMultiplierState,
  id: string,
): GoldMultiplierState {
  return {
    ...state,
    sources: state.sources.filter((s) => s.id !== id),
  };
}

export function clearMultipliers(
  state: GoldMultiplierState,
): GoldMultiplierState {
  return {
    ...state,
    sources: [],
  };
}

// ════════════════════════════════════════════════════════════════
// § TIME UPDATE
// ════════════════════════════════════════════════════════════════

export function updateMultipliers(
  state: GoldMultiplierState,
  deltaMs: number,
): GoldMultiplierState {
  const updated = state.sources
    .map((s) => ({
      ...s,
      elapsed: s.elapsed + deltaMs,
    }))
    .filter((s) => s.duration === 0 || s.elapsed < s.duration);
  return {
    ...state,
    sources: updated,
  };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

export function getEffectiveMultiplier(state: GoldMultiplierState): number {
  if (state.sources.length === 0) return 1;
  const product = state.sources.reduce((acc, s) => acc * s.multiplier, 1);
  return Math.max(0, product);
}

export function calculateGold(
  state: GoldMultiplierState,
  baseAmount: number,
): number {
  return Math.floor(baseAmount * getEffectiveMultiplier(state));
}

export function getActiveMultipliers(state: GoldMultiplierState): GoldSource[] {
  return [...state.sources];
}

export function getMultiplierCount(state: GoldMultiplierState): number {
  return state.sources.length;
}

export function getStats(state: GoldMultiplierState): {
  totalGoldEarned: number;
  totalPickups: number;
  averageGoldPerPickup: number;
  currentMultiplier: number;
} {
  return {
    totalGoldEarned: state.totalGoldEarned,
    totalPickups: state.totalPickups,
    averageGoldPerPickup:
      state.totalPickups === 0 ? 0 : state.totalGoldEarned / state.totalPickups,
    currentMultiplier: getEffectiveMultiplier(state),
  };
}

// ════════════════════════════════════════════════════════════════
// § COLLECT
// ════════════════════════════════════════════════════════════════

export function collectGold(
  state: GoldMultiplierState,
  baseAmount: number,
): { newState: GoldMultiplierState; goldEarned: number } {
  const goldEarned = calculateGold(state, baseAmount);
  return {
    newState: {
      ...state,
      totalGoldEarned: state.totalGoldEarned + goldEarned,
      totalPickups: state.totalPickups + 1,
    },
    goldEarned,
  };
}
