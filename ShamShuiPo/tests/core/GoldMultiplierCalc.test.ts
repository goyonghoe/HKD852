// ── Tests: GoldMultiplierCalc ──

import { describe, it, expect } from "vitest";
import {
  createGoldMultiplierState,
  addMultiplier,
  removeMultiplier,
  updateMultipliers,
  getEffectiveMultiplier,
  calculateGold,
  collectGold,
  getActiveMultipliers,
  getMultiplierCount,
  getStats,
  clearMultipliers,
} from "../../src/core/GoldMultiplierCalc";

// ════════════════════════════════════════════════════════════════
// § createGoldMultiplierState
// ════════════════════════════════════════════════════════════════

describe("createGoldMultiplierState", () => {
  it("returns default state with baseGold=1", () => {
    const s = createGoldMultiplierState();
    expect(s.baseGold).toBe(1);
    expect(s.sources).toEqual([]);
    expect(s.totalGoldEarned).toBe(0);
    expect(s.totalPickups).toBe(0);
  });

  it("accepts custom baseGold", () => {
    const s = createGoldMultiplierState(5);
    expect(s.baseGold).toBe(5);
  });

  it("accepts baseGold of 0", () => {
    const s = createGoldMultiplierState(0);
    expect(s.baseGold).toBe(0);
  });

  it("sources array is empty", () => {
    const s = createGoldMultiplierState();
    expect(s.sources.length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § addMultiplier
// ════════════════════════════════════════════════════════════════

describe("addMultiplier", () => {
  it("adds a permanent multiplier with defaults", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    expect(s.sources.length).toBe(1);
    expect(s.sources[0].id).toBe("m1");
    expect(s.sources[0].multiplier).toBe(2);
    expect(s.sources[0].duration).toBe(0);
    expect(s.sources[0].source).toBe("unknown");
    expect(s.sources[0].elapsed).toBe(0);
  });

  it("adds a timed multiplier", () => {
    const s = addMultiplier(
      createGoldMultiplierState(),
      "m1",
      1.5,
      5000,
      "relic",
    );
    expect(s.sources[0].duration).toBe(5000);
    expect(s.sources[0].source).toBe("relic");
  });

  it("stacks multiple multipliers", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    expect(s.sources.length).toBe(2);
  });

  it("allows duplicate ids", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "dup", 2);
    s = addMultiplier(s, "dup", 3);
    expect(s.sources.length).toBe(2);
  });

  it("does not mutate original state", () => {
    const original = createGoldMultiplierState();
    addMultiplier(original, "m1", 2);
    expect(original.sources.length).toBe(0);
  });

  it("preserves existing counters", () => {
    const base = {
      ...createGoldMultiplierState(),
      totalGoldEarned: 100,
      totalPickups: 5,
    };
    const s = addMultiplier(base, "m1", 2);
    expect(s.totalGoldEarned).toBe(100);
    expect(s.totalPickups).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeMultiplier
// ════════════════════════════════════════════════════════════════

describe("removeMultiplier", () => {
  it("removes a multiplier by id", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    s = removeMultiplier(s, "m1");
    expect(s.sources.length).toBe(0);
  });

  it("only removes matching id", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    s = removeMultiplier(s, "a");
    expect(s.sources.length).toBe(1);
    expect(s.sources[0].id).toBe("b");
  });

  it("removes all entries with same id", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "dup", 2);
    s = addMultiplier(s, "dup", 3);
    s = removeMultiplier(s, "dup");
    expect(s.sources.length).toBe(0);
  });

  it("no-op when id not found", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    const result = removeMultiplier(s, "nonexistent");
    expect(result.sources.length).toBe(1);
  });

  it("does not mutate original state", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    removeMultiplier(s, "m1");
    expect(s.sources.length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateMultipliers
// ════════════════════════════════════════════════════════════════

describe("updateMultipliers", () => {
  it("advances elapsed on all sources", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 5000);
    s = updateMultipliers(s, 1000);
    expect(s.sources[0].elapsed).toBe(1000);
  });

  it("removes expired timed multipliers", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 3000);
    s = updateMultipliers(s, 3000);
    expect(s.sources.length).toBe(0);
  });

  it("keeps multipliers that have not expired", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 5000);
    s = updateMultipliers(s, 2000);
    expect(s.sources.length).toBe(1);
  });

  it("permanent multipliers never expire", () => {
    let s = addMultiplier(createGoldMultiplierState(), "perm", 2, 0);
    s = updateMultipliers(s, 999999);
    expect(s.sources.length).toBe(1);
  });

  it("handles mixed permanent and timed sources", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "perm", 2, 0);
    s = addMultiplier(s, "temp", 3, 1000);
    s = updateMultipliers(s, 1500);
    expect(s.sources.length).toBe(1);
    expect(s.sources[0].id).toBe("perm");
  });

  it("accumulates elapsed across multiple updates", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 5000);
    s = updateMultipliers(s, 1000);
    s = updateMultipliers(s, 1000);
    expect(s.sources[0].elapsed).toBe(2000);
  });

  it("does not mutate original state", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2, 5000);
    updateMultipliers(s, 1000);
    expect(s.sources[0].elapsed).toBe(0);
  });

  it("zero delta is a no-op", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 5000);
    s = updateMultipliers(s, 0);
    expect(s.sources[0].elapsed).toBe(0);
    expect(s.sources.length).toBe(1);
  });

  it("expires exactly at duration boundary", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 2, 1000);
    s = updateMultipliers(s, 1000);
    expect(s.sources.length).toBe(0);
  });

  it("preserves counters", () => {
    const base = {
      ...addMultiplier(createGoldMultiplierState(), "m1", 2, 5000),
      totalGoldEarned: 50,
      totalPickups: 3,
    };
    const s = updateMultipliers(base, 100);
    expect(s.totalGoldEarned).toBe(50);
    expect(s.totalPickups).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveMultiplier
// ════════════════════════════════════════════════════════════════

describe("getEffectiveMultiplier", () => {
  it("returns 1 with no sources", () => {
    expect(getEffectiveMultiplier(createGoldMultiplierState())).toBe(1);
  });

  it("returns single multiplier value", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2.5);
    expect(getEffectiveMultiplier(s)).toBe(2.5);
  });

  it("multiplies all sources together", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    expect(getEffectiveMultiplier(s)).toBe(6);
  });

  it("three sources multiply correctly", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 1.5);
    s = addMultiplier(s, "c", 2);
    expect(getEffectiveMultiplier(s)).toBe(6);
  });

  it("returns minimum 0 when product goes negative", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "neg", -2);
    expect(getEffectiveMultiplier(s)).toBe(0);
  });

  it("handles fractional multipliers", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 0.5);
    expect(getEffectiveMultiplier(s)).toBe(0.5);
  });

  it("handles multiplier of 1 (identity)", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 1);
    expect(getEffectiveMultiplier(s)).toBe(1);
  });

  it("handles multiplier of 0", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 0);
    expect(getEffectiveMultiplier(s)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateGold
// ════════════════════════════════════════════════════════════════

describe("calculateGold", () => {
  it("returns base amount with no multipliers", () => {
    expect(calculateGold(createGoldMultiplierState(), 10)).toBe(10);
  });

  it("applies multiplier to base amount", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    expect(calculateGold(s, 10)).toBe(20);
  });

  it("floors the result", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 1.5);
    expect(calculateGold(s, 3)).toBe(4); // 3 * 1.5 = 4.5 → 4
  });

  it("returns 0 for base amount 0", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    expect(calculateGold(s, 0)).toBe(0);
  });

  it("stacked multipliers affect gold", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    expect(calculateGold(s, 5)).toBe(30); // 5 * 6 = 30
  });

  it("fractional multiplier reduces gold", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 0.5);
    expect(calculateGold(s, 10)).toBe(5);
  });

  it("floors correctly on fractional reduction", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 0.3);
    expect(calculateGold(s, 7)).toBe(2); // 7 * 0.3 = 2.1 → 2
  });
});

// ════════════════════════════════════════════════════════════════
// § collectGold
// ════════════════════════════════════════════════════════════════

describe("collectGold", () => {
  it("returns goldEarned and updated state", () => {
    const { newState, goldEarned } = collectGold(
      createGoldMultiplierState(),
      10,
    );
    expect(goldEarned).toBe(10);
    expect(newState.totalGoldEarned).toBe(10);
    expect(newState.totalPickups).toBe(1);
  });

  it("applies multipliers to collected gold", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 3);
    const { goldEarned } = collectGold(s, 10);
    expect(goldEarned).toBe(30);
  });

  it("accumulates totalGoldEarned across collections", () => {
    let s = createGoldMultiplierState();
    const r1 = collectGold(s, 10);
    const r2 = collectGold(r1.newState, 20);
    expect(r2.newState.totalGoldEarned).toBe(30);
    expect(r2.newState.totalPickups).toBe(2);
  });

  it("does not mutate original state", () => {
    const s = createGoldMultiplierState();
    collectGold(s, 10);
    expect(s.totalGoldEarned).toBe(0);
    expect(s.totalPickups).toBe(0);
  });

  it("floors collected gold", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 1.5);
    const { goldEarned } = collectGold(s, 3);
    expect(goldEarned).toBe(4);
  });

  it("collecting 0 gold still increments pickups", () => {
    const { newState, goldEarned } = collectGold(
      createGoldMultiplierState(),
      0,
    );
    expect(goldEarned).toBe(0);
    expect(newState.totalPickups).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveMultipliers
// ════════════════════════════════════════════════════════════════

describe("getActiveMultipliers", () => {
  it("returns empty array when no sources", () => {
    expect(getActiveMultipliers(createGoldMultiplierState())).toEqual([]);
  });

  it("returns all active sources", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    const active = getActiveMultipliers(s);
    expect(active.length).toBe(2);
    expect(active[0].id).toBe("a");
    expect(active[1].id).toBe("b");
  });

  it("returns a copy, not a reference", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    const active = getActiveMultipliers(s);
    active.pop();
    expect(getActiveMultipliers(s).length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMultiplierCount
// ════════════════════════════════════════════════════════════════

describe("getMultiplierCount", () => {
  it("returns 0 for empty state", () => {
    expect(getMultiplierCount(createGoldMultiplierState())).toBe(0);
  });

  it("counts all sources", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    s = addMultiplier(s, "c", 1.5);
    expect(getMultiplierCount(s)).toBe(3);
  });

  it("reflects removals", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    s = removeMultiplier(s, "a");
    expect(getMultiplierCount(s)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getStats
// ════════════════════════════════════════════════════════════════

describe("getStats", () => {
  it("returns zeroed stats for fresh state", () => {
    const stats = getStats(createGoldMultiplierState());
    expect(stats.totalGoldEarned).toBe(0);
    expect(stats.totalPickups).toBe(0);
    expect(stats.averageGoldPerPickup).toBe(0);
    expect(stats.currentMultiplier).toBe(1);
  });

  it("calculates average gold per pickup", () => {
    let s = createGoldMultiplierState();
    s = collectGold(s, 10).newState;
    s = collectGold(s, 20).newState;
    const stats = getStats(s);
    expect(stats.averageGoldPerPickup).toBe(15);
  });

  it("reflects current multiplier", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2.5);
    const stats = getStats(s);
    expect(stats.currentMultiplier).toBe(2.5);
  });

  it("averageGoldPerPickup is 0 when no pickups", () => {
    const stats = getStats(createGoldMultiplierState());
    expect(stats.averageGoldPerPickup).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § clearMultipliers
// ════════════════════════════════════════════════════════════════

describe("clearMultipliers", () => {
  it("removes all sources", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "a", 2);
    s = addMultiplier(s, "b", 3);
    s = clearMultipliers(s);
    expect(s.sources.length).toBe(0);
  });

  it("preserves counters", () => {
    let s = createGoldMultiplierState();
    s = collectGold(s, 10).newState;
    s = addMultiplier(s, "m1", 2);
    s = clearMultipliers(s);
    expect(s.totalGoldEarned).toBe(10);
    expect(s.totalPickups).toBe(1);
  });

  it("does not mutate original state", () => {
    const s = addMultiplier(createGoldMultiplierState(), "m1", 2);
    clearMultipliers(s);
    expect(s.sources.length).toBe(1);
  });

  it("clearing empty state is a no-op", () => {
    const s = clearMultipliers(createGoldMultiplierState());
    expect(s.sources.length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § INTEGRATION / EDGE CASES
// ════════════════════════════════════════════════════════════════

describe("integration scenarios", () => {
  it("full lifecycle: add, collect, update, expire, collect again", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "buff", 2, 3000, "power-up");
    const r1 = collectGold(s, 10);
    expect(r1.goldEarned).toBe(20);
    s = r1.newState;
    s = updateMultipliers(s, 3000);
    expect(s.sources.length).toBe(0);
    const r2 = collectGold(s, 10);
    expect(r2.goldEarned).toBe(10);
    expect(r2.newState.totalGoldEarned).toBe(30);
    expect(r2.newState.totalPickups).toBe(2);
  });

  it("multiple timed buffs expire at different times", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "short", 2, 1000);
    s = addMultiplier(s, "long", 3, 5000);
    s = updateMultipliers(s, 1500);
    expect(s.sources.length).toBe(1);
    expect(s.sources[0].id).toBe("long");
    expect(getEffectiveMultiplier(s)).toBe(3);
  });

  it("large number of multipliers stack correctly", () => {
    let s = createGoldMultiplierState();
    for (let i = 0; i < 10; i++) {
      s = addMultiplier(s, `m${i}`, 1.1);
    }
    // 1.1^10 ≈ 2.5937
    expect(getEffectiveMultiplier(s)).toBeCloseTo(Math.pow(1.1, 10), 5);
    expect(calculateGold(s, 100)).toBe(Math.floor(100 * Math.pow(1.1, 10)));
  });

  it("collect then clear then collect again", () => {
    let s = addMultiplier(createGoldMultiplierState(), "m1", 5);
    const r1 = collectGold(s, 10);
    expect(r1.goldEarned).toBe(50);
    s = clearMultipliers(r1.newState);
    const r2 = collectGold(s, 10);
    expect(r2.goldEarned).toBe(10);
    expect(r2.newState.totalGoldEarned).toBe(60);
  });

  it("effective multiplier with zero-multiplier source yields 0 gold", () => {
    let s = createGoldMultiplierState();
    s = addMultiplier(s, "good", 5);
    s = addMultiplier(s, "zero", 0);
    expect(getEffectiveMultiplier(s)).toBe(0);
    expect(calculateGold(s, 100)).toBe(0);
  });
});
