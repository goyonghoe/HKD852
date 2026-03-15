// PoolManagerCalc.ts — pure TypeScript, NO Phaser imports

export interface PoolConfig {
  readonly initialSize: number;
  readonly maxSize: number;
  readonly growthFactor: number;
  readonly shrinkThreshold: number;
}

export interface PoolStats {
  readonly totalCreated: number;
  readonly activeCount: number;
  readonly availableCount: number;
  readonly peakActive: number;
  readonly totalRecycled: number;
  readonly resizeCount: number;
}

export interface PoolState {
  readonly config: PoolConfig;
  readonly stats: PoolStats;
  readonly size: number;
}

export type PoolHealth = "healthy" | "growing" | "saturated" | "oversized";

export interface PoolRequestResult {
  readonly state: PoolState;
  readonly granted: boolean;
}

export interface PoolBatchRequestResult {
  readonly state: PoolState;
  readonly granted: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPool(
  initialSize = 32,
  maxSize = 512,
  growthFactor = 2,
  shrinkThreshold = 0.75,
): PoolState {
  const clamped = Math.max(1, Math.floor(initialSize));
  const clampedMax = Math.max(clamped, Math.floor(maxSize));
  return {
    config: {
      initialSize: clamped,
      maxSize: clampedMax,
      growthFactor: Math.max(1, growthFactor),
      shrinkThreshold: Math.min(1, Math.max(0, shrinkThreshold)),
    },
    stats: {
      totalCreated: clamped,
      activeCount: 0,
      availableCount: clamped,
      peakActive: 0,
      totalRecycled: 0,
      resizeCount: 0,
    },
    size: clamped,
  };
}

// ---------------------------------------------------------------------------
// Single request / return
// ---------------------------------------------------------------------------

export function requestFromPool(state: PoolState): PoolRequestResult {
  if (state.stats.availableCount <= 0) {
    return { state, granted: false };
  }
  const newActive = state.stats.activeCount + 1;
  return {
    state: {
      ...state,
      stats: {
        ...state.stats,
        activeCount: newActive,
        availableCount: state.stats.availableCount - 1,
        peakActive: Math.max(state.stats.peakActive, newActive),
      },
    },
    granted: true,
  };
}

export function returnToPool(state: PoolState): PoolState {
  if (state.stats.activeCount <= 0) return state;
  return {
    ...state,
    stats: {
      ...state.stats,
      activeCount: state.stats.activeCount - 1,
      availableCount: state.stats.availableCount + 1,
      totalRecycled: state.stats.totalRecycled + 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Batch request / return
// ---------------------------------------------------------------------------

export function batchRequest(
  state: PoolState,
  count: number,
): PoolBatchRequestResult {
  const actual = Math.min(
    Math.max(0, Math.floor(count)),
    state.stats.availableCount,
  );
  if (actual === 0) return { state, granted: 0 };
  const newActive = state.stats.activeCount + actual;
  return {
    state: {
      ...state,
      stats: {
        ...state.stats,
        activeCount: newActive,
        availableCount: state.stats.availableCount - actual,
        peakActive: Math.max(state.stats.peakActive, newActive),
      },
    },
    granted: actual,
  };
}

export function batchReturn(state: PoolState, count: number): PoolState {
  const actual = Math.min(
    Math.max(0, Math.floor(count)),
    state.stats.activeCount,
  );
  if (actual === 0) return state;
  return {
    ...state,
    stats: {
      ...state.stats,
      activeCount: state.stats.activeCount - actual,
      availableCount: state.stats.availableCount + actual,
      totalRecycled: state.stats.totalRecycled + actual,
    },
  };
}

// ---------------------------------------------------------------------------
// Growth / Shrink decisions
// ---------------------------------------------------------------------------

export function shouldGrow(state: PoolState): boolean {
  return state.stats.availableCount < state.size * 0.25;
}

export function growPool(state: PoolState): PoolState {
  const newSize = Math.min(
    state.config.maxSize,
    Math.floor(state.size * state.config.growthFactor),
  );
  if (newSize <= state.size) return state;
  const added = newSize - state.size;
  return {
    ...state,
    size: newSize,
    stats: {
      ...state.stats,
      availableCount: state.stats.availableCount + added,
      totalCreated: state.stats.totalCreated + added,
      resizeCount: state.stats.resizeCount + 1,
    },
  };
}

export function shouldShrink(state: PoolState): boolean {
  if (state.size <= state.config.initialSize) return false;
  return state.stats.availableCount > state.size * state.config.shrinkThreshold;
}

export function shrinkPool(state: PoolState): PoolState {
  const newSize = Math.max(
    state.config.initialSize,
    Math.floor(state.size / 2),
  );
  if (newSize >= state.size) return state;
  const removed = state.size - newSize;
  const newAvailable = Math.max(0, state.stats.availableCount - removed);
  return {
    ...state,
    size: newSize,
    stats: {
      ...state.stats,
      availableCount: newAvailable,
      resizeCount: state.stats.resizeCount + 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export function getUtilization(state: PoolState): number {
  if (state.size === 0) return 0;
  return state.stats.activeCount / state.size;
}

export function getEfficiency(state: PoolState): number {
  if (state.stats.totalCreated === 0) return 0;
  return state.stats.totalRecycled / state.stats.totalCreated;
}

export function estimateMemory(
  state: PoolState,
  bytesPerObject: number,
): number {
  return state.size * Math.max(0, bytesPerObject);
}

export function getOptimalSize(peakActive: number): number {
  const target = Math.ceil(peakActive * 1.5);
  // round up to next power of 2
  let power = 1;
  while (power < target) power *= 2;
  return power;
}

// ---------------------------------------------------------------------------
// Reset / Health
// ---------------------------------------------------------------------------

export function resetStats(state: PoolState): PoolState {
  return {
    ...state,
    stats: {
      totalCreated: state.size,
      activeCount: 0,
      availableCount: state.size,
      peakActive: 0,
      totalRecycled: 0,
      resizeCount: 0,
    },
  };
}

export function getPoolHealth(state: PoolState): PoolHealth {
  if (state.size >= state.config.maxSize && state.stats.availableCount === 0) {
    return "saturated";
  }
  if (shouldShrink(state)) {
    return "oversized";
  }
  if (shouldGrow(state)) {
    return "growing";
  }
  return "healthy";
}
