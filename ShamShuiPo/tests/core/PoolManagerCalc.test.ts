import { describe, it, expect } from "vitest";
import {
  createPool,
  requestFromPool,
  returnToPool,
  batchRequest,
  batchReturn,
  shouldGrow,
  growPool,
  shouldShrink,
  shrinkPool,
  getUtilization,
  getEfficiency,
  estimateMemory,
  getOptimalSize,
  resetStats,
  getPoolHealth,
  type PoolState,
} from "../../src/core/PoolManagerCalc";

// ---------------------------------------------------------------------------
// createPool
// ---------------------------------------------------------------------------
describe("createPool", () => {
  it("uses default values", () => {
    const p = createPool();
    expect(p.config.initialSize).toBe(32);
    expect(p.config.maxSize).toBe(512);
    expect(p.config.growthFactor).toBe(2);
    expect(p.size).toBe(32);
    expect(p.stats.availableCount).toBe(32);
    expect(p.stats.activeCount).toBe(0);
    expect(p.stats.totalCreated).toBe(32);
  });

  it("accepts custom parameters", () => {
    const p = createPool(16, 128, 3, 0.8);
    expect(p.config.initialSize).toBe(16);
    expect(p.config.maxSize).toBe(128);
    expect(p.config.growthFactor).toBe(3);
    expect(p.config.shrinkThreshold).toBe(0.8);
    expect(p.size).toBe(16);
  });

  it("clamps initialSize to at least 1", () => {
    const p = createPool(0);
    expect(p.config.initialSize).toBe(1);
    expect(p.size).toBe(1);
  });

  it("clamps maxSize to at least initialSize", () => {
    const p = createPool(64, 10);
    expect(p.config.maxSize).toBe(64);
  });

  it("clamps growthFactor to at least 1", () => {
    const p = createPool(8, 64, 0.5);
    expect(p.config.growthFactor).toBe(1);
  });

  it("clamps shrinkThreshold between 0 and 1", () => {
    const p1 = createPool(8, 64, 2, -0.5);
    expect(p1.config.shrinkThreshold).toBe(0);
    const p2 = createPool(8, 64, 2, 1.5);
    expect(p2.config.shrinkThreshold).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// requestFromPool
// ---------------------------------------------------------------------------
describe("requestFromPool", () => {
  it("grants one object and updates counts", () => {
    const p = createPool(4, 16, 2);
    const { state, granted } = requestFromPool(p);
    expect(granted).toBe(true);
    expect(state.stats.activeCount).toBe(1);
    expect(state.stats.availableCount).toBe(3);
  });

  it("tracks peakActive", () => {
    let p = createPool(4, 16, 2);
    let r = requestFromPool(p);
    r = requestFromPool(r.state);
    r = requestFromPool(r.state);
    expect(r.state.stats.peakActive).toBe(3);
  });

  it("returns false when pool is empty", () => {
    let p = createPool(2, 4, 2);
    let r = requestFromPool(p);
    r = requestFromPool(r.state);
    const final = requestFromPool(r.state);
    expect(final.granted).toBe(false);
    expect(final.state.stats.activeCount).toBe(2);
  });

  it("does not mutate original state", () => {
    const p = createPool(4, 16, 2);
    requestFromPool(p);
    expect(p.stats.activeCount).toBe(0);
    expect(p.stats.availableCount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// returnToPool
// ---------------------------------------------------------------------------
describe("returnToPool", () => {
  it("returns an object and increments recycled count", () => {
    const p = createPool(4, 16, 2);
    const { state } = requestFromPool(p);
    const returned = returnToPool(state);
    expect(returned.stats.activeCount).toBe(0);
    expect(returned.stats.availableCount).toBe(4);
    expect(returned.stats.totalRecycled).toBe(1);
  });

  it("does nothing when activeCount is 0", () => {
    const p = createPool(4, 16, 2);
    const returned = returnToPool(p);
    expect(returned).toBe(p); // same reference
  });

  it("does not mutate original state", () => {
    const p = createPool(4, 16, 2);
    const { state } = requestFromPool(p);
    returnToPool(state);
    expect(state.stats.activeCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// batchRequest
// ---------------------------------------------------------------------------
describe("batchRequest", () => {
  it("grants multiple objects", () => {
    const p = createPool(10, 32, 2);
    const { state, granted } = batchRequest(p, 5);
    expect(granted).toBe(5);
    expect(state.stats.activeCount).toBe(5);
    expect(state.stats.availableCount).toBe(5);
  });

  it("clamps to available count", () => {
    const p = createPool(4, 8, 2);
    const { state, granted } = batchRequest(p, 10);
    expect(granted).toBe(4);
    expect(state.stats.activeCount).toBe(4);
    expect(state.stats.availableCount).toBe(0);
  });

  it("handles zero count", () => {
    const p = createPool(4, 8, 2);
    const { state, granted } = batchRequest(p, 0);
    expect(granted).toBe(0);
    expect(state).toBe(p);
  });

  it("handles negative count", () => {
    const p = createPool(4, 8, 2);
    const { granted } = batchRequest(p, -3);
    expect(granted).toBe(0);
  });

  it("updates peakActive correctly", () => {
    const p = createPool(10, 32, 2);
    const { state } = batchRequest(p, 7);
    expect(state.stats.peakActive).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// batchReturn
// ---------------------------------------------------------------------------
describe("batchReturn", () => {
  it("returns multiple objects", () => {
    const p = createPool(10, 32, 2);
    const { state: s1 } = batchRequest(p, 8);
    const s2 = batchReturn(s1, 5);
    expect(s2.stats.activeCount).toBe(3);
    expect(s2.stats.availableCount).toBe(7);
    expect(s2.stats.totalRecycled).toBe(5);
  });

  it("clamps to activeCount", () => {
    const p = createPool(10, 32, 2);
    const { state: s1 } = batchRequest(p, 3);
    const s2 = batchReturn(s1, 100);
    expect(s2.stats.activeCount).toBe(0);
    expect(s2.stats.totalRecycled).toBe(3);
  });

  it("handles zero count", () => {
    const p = createPool(4, 8, 2);
    const { state: s1 } = batchRequest(p, 2);
    const s2 = batchReturn(s1, 0);
    expect(s2).toBe(s1);
  });
});

// ---------------------------------------------------------------------------
// shouldGrow
// ---------------------------------------------------------------------------
describe("shouldGrow", () => {
  it("returns true when available < 25% of size", () => {
    const p = createPool(8, 64, 2);
    // use 7 of 8 → 1 available = 12.5% < 25%
    const { state } = batchRequest(p, 7);
    expect(shouldGrow(state)).toBe(true);
  });

  it("returns false when pool has plenty available", () => {
    const p = createPool(8, 64, 2);
    expect(shouldGrow(p)).toBe(false);
  });

  it("returns true when pool is completely empty", () => {
    const p = createPool(4, 16, 2);
    const { state } = batchRequest(p, 4);
    expect(shouldGrow(state)).toBe(true);
  });

  it("boundary: exactly 25% available returns false", () => {
    const p = createPool(8, 64, 2);
    // use 6 of 8 → 2 available = 25% — NOT less than, so false
    const { state } = batchRequest(p, 6);
    expect(shouldGrow(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// growPool
// ---------------------------------------------------------------------------
describe("growPool", () => {
  it("doubles size by default growth factor", () => {
    const p = createPool(8, 64, 2);
    const grown = growPool(p);
    expect(grown.size).toBe(16);
    expect(grown.stats.availableCount).toBe(16); // 8 original + 8 added
    expect(grown.stats.totalCreated).toBe(16);
    expect(grown.stats.resizeCount).toBe(1);
  });

  it("caps at maxSize", () => {
    const p = createPool(8, 12, 2);
    const grown = growPool(p);
    expect(grown.size).toBe(12);
    expect(grown.stats.availableCount).toBe(12);
  });

  it("returns same state when already at maxSize", () => {
    const p = createPool(8, 8, 2);
    const grown = growPool(p);
    expect(grown).toBe(p);
  });

  it("respects custom growth factor", () => {
    const p = createPool(4, 64, 3);
    const grown = growPool(p);
    expect(grown.size).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// shouldShrink
// ---------------------------------------------------------------------------
describe("shouldShrink", () => {
  it("returns true when lots of available and above initial size", () => {
    const p = createPool(4, 64, 2, 0.75);
    const grown = growPool(p); // 4 → 8, all 8 available
    // available=8, size=8, threshold=0.75 → 8 > 6 → true
    expect(shouldShrink(grown)).toBe(true);
  });

  it("returns false when at initial size", () => {
    const p = createPool(8, 64, 2, 0.5);
    // all 8 available, size=8, but size === initialSize
    expect(shouldShrink(p)).toBe(false);
  });

  it("returns false when pool is heavily used", () => {
    const p = createPool(4, 64, 2, 0.75);
    const grown = growPool(p);
    const { state } = batchRequest(grown, 6);
    // available=2, size=8, threshold=0.75 → 2 > 6? false
    expect(shouldShrink(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shrinkPool
// ---------------------------------------------------------------------------
describe("shrinkPool", () => {
  it("halves pool size", () => {
    const p = createPool(4, 64, 2);
    const grown = growPool(growPool(p)); // 4 → 8 → 16
    const shrunk = shrinkPool(grown);
    expect(shrunk.size).toBe(8);
    expect(shrunk.stats.resizeCount).toBe(grown.stats.resizeCount + 1);
  });

  it("does not go below initial size", () => {
    const p = createPool(8, 64, 2);
    const grown = growPool(p); // 8 → 16
    const shrunk = shrinkPool(grown);
    expect(shrunk.size).toBe(8);
    const again = shrinkPool(shrunk);
    expect(again).toBe(shrunk); // no change
  });

  it("adjusts available count when shrinking removes available slots", () => {
    const p = createPool(4, 64, 2);
    const grown = growPool(p); // 4 → 8, available=8
    const shrunk = shrinkPool(grown); // 8 → 4
    expect(shrunk.stats.availableCount).toBe(4); // 8 - 4 = 4
  });

  it("returns same state if already at initial size", () => {
    const p = createPool(16, 64, 2);
    const result = shrinkPool(p);
    expect(result).toBe(p);
  });
});

// ---------------------------------------------------------------------------
// getUtilization
// ---------------------------------------------------------------------------
describe("getUtilization", () => {
  it("returns 0 for empty pool", () => {
    const p = createPool(8, 32, 2);
    expect(getUtilization(p)).toBe(0);
  });

  it("returns 1 for fully used pool", () => {
    const p = createPool(4, 8, 2);
    const { state } = batchRequest(p, 4);
    expect(getUtilization(state)).toBe(1);
  });

  it("returns correct fraction", () => {
    const p = createPool(8, 32, 2);
    const { state } = batchRequest(p, 2);
    expect(getUtilization(state)).toBe(0.25);
  });
});

// ---------------------------------------------------------------------------
// getEfficiency
// ---------------------------------------------------------------------------
describe("getEfficiency", () => {
  it("returns 0 when nothing recycled", () => {
    const p = createPool(4, 8, 2);
    expect(getEfficiency(p)).toBe(0);
  });

  it("improves with recycling", () => {
    let p = createPool(4, 8, 2);
    const { state: s1 } = requestFromPool(p);
    const s2 = returnToPool(s1);
    // totalRecycled=1, totalCreated=4
    expect(getEfficiency(s2)).toBe(0.25);
  });

  it("increases over many cycles", () => {
    let state = createPool(2, 8, 2);
    for (let i = 0; i < 10; i++) {
      const r = requestFromPool(state);
      if (r.granted) state = returnToPool(r.state);
    }
    expect(getEfficiency(state)).toBeGreaterThan(1); // recycled > created
  });
});

// ---------------------------------------------------------------------------
// estimateMemory
// ---------------------------------------------------------------------------
describe("estimateMemory", () => {
  it("multiplies size by bytes per object", () => {
    const p = createPool(16, 64, 2);
    expect(estimateMemory(p, 256)).toBe(16 * 256);
  });

  it("returns 0 for 0 bytes per object", () => {
    const p = createPool(16, 64, 2);
    expect(estimateMemory(p, 0)).toBe(0);
  });

  it("clamps negative bytes to 0", () => {
    const p = createPool(8, 32, 2);
    expect(estimateMemory(p, -100)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getOptimalSize
// ---------------------------------------------------------------------------
describe("getOptimalSize", () => {
  it("returns next power of 2 above 1.5x peak", () => {
    // peakActive=10, target=15, next power of 2=16
    expect(getOptimalSize(10)).toBe(16);
  });

  it("returns exact power of 2 when target matches", () => {
    // peakActive=20, target=30, next power of 2=32
    expect(getOptimalSize(20)).toBe(32);
  });

  it("handles peakActive of 1", () => {
    // target=2, power of 2=2
    expect(getOptimalSize(1)).toBe(2);
  });

  it("handles peakActive of 0", () => {
    expect(getOptimalSize(0)).toBe(1);
  });

  it("handles large values", () => {
    // peakActive=1000, target=1500, next power of 2=2048
    expect(getOptimalSize(1000)).toBe(2048);
  });
});

// ---------------------------------------------------------------------------
// resetStats
// ---------------------------------------------------------------------------
describe("resetStats", () => {
  it("clears all stats but keeps pool size", () => {
    let p = createPool(8, 32, 2);
    const { state } = batchRequest(p, 5);
    const grown = growPool(state);
    const reset = resetStats(grown);
    expect(reset.size).toBe(grown.size);
    expect(reset.config).toEqual(grown.config);
    expect(reset.stats.activeCount).toBe(0);
    expect(reset.stats.availableCount).toBe(grown.size);
    expect(reset.stats.peakActive).toBe(0);
    expect(reset.stats.totalRecycled).toBe(0);
    expect(reset.stats.resizeCount).toBe(0);
    expect(reset.stats.totalCreated).toBe(grown.size);
  });

  it("does not mutate original", () => {
    const p = createPool(4, 16, 2);
    const { state } = requestFromPool(p);
    resetStats(state);
    expect(state.stats.activeCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getPoolHealth
// ---------------------------------------------------------------------------
describe("getPoolHealth", () => {
  it("returns healthy for normal pool", () => {
    const p = createPool(8, 64, 2);
    const { state } = batchRequest(p, 2);
    expect(getPoolHealth(state)).toBe("healthy");
  });

  it("returns growing when low availability", () => {
    const p = createPool(8, 64, 2);
    const { state } = batchRequest(p, 7);
    expect(getPoolHealth(state)).toBe("growing");
  });

  it("returns saturated when at max with zero available", () => {
    const p = createPool(8, 8, 2);
    const { state } = batchRequest(p, 8);
    expect(getPoolHealth(state)).toBe("saturated");
  });

  it("returns oversized when mostly idle and above initial", () => {
    const p = createPool(4, 64, 2, 0.5);
    const grown = growPool(p); // 4 → 8, all available
    // available=8, size=8, threshold=0.5 → 8 > 4 → oversized
    expect(getPoolHealth(grown)).toBe("oversized");
  });
});

// ---------------------------------------------------------------------------
// Integration / lifecycle
// ---------------------------------------------------------------------------
describe("integration: full pool lifecycle", () => {
  it("create → use → recycle → grow → shrink", () => {
    // 1. Create
    let state = createPool(4, 32, 2, 0.75);
    expect(state.size).toBe(4);

    // 2. Use all 4
    const r1 = batchRequest(state, 4);
    state = r1.state;
    expect(r1.granted).toBe(4);
    expect(shouldGrow(state)).toBe(true);

    // 3. Grow
    state = growPool(state);
    expect(state.size).toBe(8);
    expect(state.stats.availableCount).toBe(4);

    // 4. Return all
    state = batchReturn(state, 4);
    expect(state.stats.activeCount).toBe(0);
    expect(state.stats.availableCount).toBe(8);
    expect(state.stats.totalRecycled).toBe(4);

    // 5. Should shrink (all 8 available, threshold 0.75, 8 > 6)
    expect(shouldShrink(state)).toBe(true);
    state = shrinkPool(state);
    expect(state.size).toBe(4);

    // 6. Health check
    expect(getPoolHealth(state)).toBe("healthy");
  });

  it("repeated request-return cycles increase efficiency", () => {
    let state = createPool(4, 16, 2);
    for (let i = 0; i < 20; i++) {
      const r = requestFromPool(state);
      if (r.granted) state = returnToPool(r.state);
    }
    // 20 recycles over 4 created
    expect(getEfficiency(state)).toBe(5);
  });

  it("pool exhaustion and recovery", () => {
    let state = createPool(2, 4, 2);

    // Exhaust
    let r = batchRequest(state, 2);
    state = r.state;
    const fail = requestFromPool(state);
    expect(fail.granted).toBe(false);

    // Grow
    state = growPool(state);
    expect(state.size).toBe(4);
    expect(state.stats.availableCount).toBe(2);

    // Use new capacity
    r = batchRequest(state, 2);
    expect(r.granted).toBe(2);
    state = r.state;
    expect(state.stats.activeCount).toBe(4);
    expect(getUtilization(state)).toBe(1);
  });
});
