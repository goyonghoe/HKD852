// ── Tests: MovementModCalc ──

import { describe, it, expect } from "vitest";
import {
  createMovementModState,
  addMod,
  removeMod,
  updateMods,
  getEffectiveMultiplier,
  getEffectiveSpeed,
  getModsBySource,
  getActiveMods,
  clearMods,
  setBaseSpeed,
  getModCount,
  hasMod,
} from "../../src/core/MovementModCalc";

// ════════════════════════════════════════════════════════════════
// § createMovementModState
// ════════════════════════════════════════════════════════════════

describe("createMovementModState", () => {
  it("returns default state with baseSpeed=200", () => {
    const s = createMovementModState();
    expect(s.baseSpeed).toBe(200);
  });

  it("returns empty mods array", () => {
    const s = createMovementModState();
    expect(s.mods).toEqual([]);
  });

  it("sets minSpeedMultiplier to 0.1", () => {
    const s = createMovementModState();
    expect(s.minSpeedMultiplier).toBe(0.1);
  });

  it("sets maxSpeedMultiplier to 3.0", () => {
    const s = createMovementModState();
    expect(s.maxSpeedMultiplier).toBe(3.0);
  });

  it("accepts custom baseSpeed", () => {
    const s = createMovementModState(500);
    expect(s.baseSpeed).toBe(500);
  });

  it("accepts baseSpeed of 0", () => {
    const s = createMovementModState(0);
    expect(s.baseSpeed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § addMod
// ════════════════════════════════════════════════════════════════

describe("addMod", () => {
  it("adds a mod with all defaults", () => {
    const s = addMod(createMovementModState(), "boost1", 1.5);
    expect(s.mods).toHaveLength(1);
    expect(s.mods[0].id).toBe("boost1");
    expect(s.mods[0].multiplier).toBe(1.5);
    expect(s.mods[0].duration).toBe(0);
    expect(s.mods[0].source).toBe("unknown");
    expect(s.mods[0].stackable).toBe(true);
    expect(s.mods[0].elapsed).toBe(0);
  });

  it("adds a mod with custom duration", () => {
    const s = addMod(createMovementModState(), "slow1", 0.5, 3000);
    expect(s.mods[0].duration).toBe(3000);
  });

  it("adds a mod with custom source", () => {
    const s = addMod(createMovementModState(), "s1", 1.2, 0, "ice-zone");
    expect(s.mods[0].source).toBe("ice-zone");
  });

  it("adds a mod with stackable=false", () => {
    const s = addMod(createMovementModState(), "s1", 1.2, 0, "src", false);
    expect(s.mods[0].stackable).toBe(false);
  });

  it("stacks multiple mods when stackable=true", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 0, "weapon");
    s = addMod(s, "b", 1.3, 0, "weapon");
    expect(s.mods).toHaveLength(2);
  });

  it("replaces same-source mods when stackable=false", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 0, "aura", false);
    s = addMod(s, "b", 1.8, 0, "aura", false);
    expect(s.mods).toHaveLength(1);
    expect(s.mods[0].id).toBe("b");
    expect(s.mods[0].multiplier).toBe(1.8);
  });

  it("non-stackable only removes same source, keeps others", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 0, "aura", false);
    s = addMod(s, "b", 1.3, 0, "potion", true);
    s = addMod(s, "c", 2.0, 0, "aura", false);
    expect(s.mods).toHaveLength(2);
    expect(hasMod(s, "b")).toBe(true);
    expect(hasMod(s, "c")).toBe(true);
    expect(hasMod(s, "a")).toBe(false);
  });

  it("does not mutate the original state", () => {
    const s0 = createMovementModState();
    const s1 = addMod(s0, "x", 1.5);
    expect(s0.mods).toHaveLength(0);
    expect(s1.mods).toHaveLength(1);
  });

  it("preserves baseSpeed when adding mod", () => {
    const s = addMod(createMovementModState(300), "m1", 1.5);
    expect(s.baseSpeed).toBe(300);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeMod
// ════════════════════════════════════════════════════════════════

describe("removeMod", () => {
  it("removes a mod by id", () => {
    let s = addMod(createMovementModState(), "m1", 1.5);
    s = removeMod(s, "m1");
    expect(s.mods).toHaveLength(0);
  });

  it("returns same structure when id not found", () => {
    const s = addMod(createMovementModState(), "m1", 1.5);
    const s2 = removeMod(s, "nonexistent");
    expect(s2.mods).toHaveLength(1);
  });

  it("removes only the matching id", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 0.8);
    s = removeMod(s, "a");
    expect(s.mods).toHaveLength(1);
    expect(s.mods[0].id).toBe("b");
  });

  it("does not mutate the original state", () => {
    const s0 = addMod(createMovementModState(), "m1", 1.5);
    const s1 = removeMod(s0, "m1");
    expect(s0.mods).toHaveLength(1);
    expect(s1.mods).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateMods
// ════════════════════════════════════════════════════════════════

describe("updateMods", () => {
  it("advances elapsed time", () => {
    let s = addMod(createMovementModState(), "m1", 1.5, 5000);
    s = updateMods(s, 1000);
    expect(s.mods[0].elapsed).toBe(1000);
  });

  it("removes expired timed mods", () => {
    let s = addMod(createMovementModState(), "m1", 1.5, 2000);
    s = updateMods(s, 2000);
    expect(s.mods).toHaveLength(0);
  });

  it("keeps permanent mods (duration=0) forever", () => {
    let s = addMod(createMovementModState(), "perm", 1.5, 0);
    s = updateMods(s, 999999);
    expect(s.mods).toHaveLength(1);
  });

  it("keeps timed mods that are not yet expired", () => {
    let s = addMod(createMovementModState(), "m1", 1.5, 5000);
    s = updateMods(s, 3000);
    expect(s.mods).toHaveLength(1);
    expect(s.mods[0].elapsed).toBe(3000);
  });

  it("handles multiple updates cumulatively", () => {
    let s = addMod(createMovementModState(), "m1", 1.5, 5000);
    s = updateMods(s, 2000);
    s = updateMods(s, 2000);
    expect(s.mods[0].elapsed).toBe(4000);
    s = updateMods(s, 1000);
    expect(s.mods).toHaveLength(0);
  });

  it("mixed permanent and timed: only timed expires", () => {
    let s = createMovementModState();
    s = addMod(s, "perm", 1.5, 0);
    s = addMod(s, "timed", 0.5, 1000);
    s = updateMods(s, 1500);
    expect(s.mods).toHaveLength(1);
    expect(s.mods[0].id).toBe("perm");
  });

  it("does not mutate the original state", () => {
    const s0 = addMod(createMovementModState(), "m1", 1.5, 5000);
    const s1 = updateMods(s0, 3000);
    expect(s0.mods[0].elapsed).toBe(0);
    expect(s1.mods[0].elapsed).toBe(3000);
  });

  it("handles deltaMs=0 without changes", () => {
    let s = addMod(createMovementModState(), "m1", 1.5, 5000);
    s = updateMods(s, 0);
    expect(s.mods[0].elapsed).toBe(0);
    expect(s.mods).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveMultiplier
// ════════════════════════════════════════════════════════════════

describe("getEffectiveMultiplier", () => {
  it("returns 1.0 with no mods", () => {
    expect(getEffectiveMultiplier(createMovementModState())).toBe(1.0);
  });

  it("returns single mod multiplier", () => {
    const s = addMod(createMovementModState(), "m1", 1.5);
    expect(getEffectiveMultiplier(s)).toBeCloseTo(1.5);
  });

  it("multiplies multiple mod multipliers", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 2.0);
    expect(getEffectiveMultiplier(s)).toBeCloseTo(3.0);
  });

  it("clamps to maxSpeedMultiplier", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 2.0);
    s = addMod(s, "b", 2.0);
    // 2.0 * 2.0 = 4.0, clamped to 3.0
    expect(getEffectiveMultiplier(s)).toBe(3.0);
  });

  it("clamps to minSpeedMultiplier", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 0.05);
    s = addMod(s, "b", 0.5);
    // 0.05 * 0.5 = 0.025, clamped to 0.1
    expect(getEffectiveMultiplier(s)).toBe(0.1);
  });

  it("handles multiplier of exactly 1.0 (no effect)", () => {
    const s = addMod(createMovementModState(), "noop", 1.0);
    expect(getEffectiveMultiplier(s)).toBe(1.0);
  });

  it("handles slow debuff (multiplier < 1)", () => {
    const s = addMod(createMovementModState(), "slow", 0.5);
    expect(getEffectiveMultiplier(s)).toBeCloseTo(0.5);
  });

  it("product of speed and slow can cancel out", () => {
    let s = createMovementModState();
    s = addMod(s, "fast", 2.0);
    s = addMod(s, "slow", 0.5);
    expect(getEffectiveMultiplier(s)).toBeCloseTo(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveSpeed
// ════════════════════════════════════════════════════════════════

describe("getEffectiveSpeed", () => {
  it("returns baseSpeed with no mods", () => {
    expect(getEffectiveSpeed(createMovementModState())).toBe(200);
  });

  it("applies multiplier to baseSpeed", () => {
    const s = addMod(createMovementModState(), "m1", 1.5);
    expect(getEffectiveSpeed(s)).toBeCloseTo(300);
  });

  it("applies stacked multipliers", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 2.0);
    // 200 * 3.0 = 600, but clamped mult to 3.0, 200*3.0=600
    expect(getEffectiveSpeed(s)).toBeCloseTo(600);
  });

  it("respects custom baseSpeed", () => {
    const s = addMod(createMovementModState(100), "m1", 2.0);
    expect(getEffectiveSpeed(s)).toBeCloseTo(200);
  });

  it("returns 0 when baseSpeed is 0", () => {
    const s = addMod(createMovementModState(0), "m1", 2.0);
    expect(getEffectiveSpeed(s)).toBe(0);
  });

  it("clamps speed via max multiplier", () => {
    let s = createMovementModState(100);
    s = addMod(s, "a", 5.0);
    // mult clamped to 3.0 → 100*3.0=300
    expect(getEffectiveSpeed(s)).toBeCloseTo(300);
  });

  it("clamps speed via min multiplier", () => {
    let s = createMovementModState(200);
    s = addMod(s, "a", 0.01);
    // mult clamped to 0.1 → 200*0.1=20
    expect(getEffectiveSpeed(s)).toBeCloseTo(20);
  });
});

// ════════════════════════════════════════════════════════════════
// § getModsBySource
// ════════════════════════════════════════════════════════════════

describe("getModsBySource", () => {
  it("returns empty array when no mods", () => {
    expect(getModsBySource(createMovementModState(), "any")).toEqual([]);
  });

  it("returns mods matching source", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 0, "ice-zone");
    s = addMod(s, "b", 0.8, 0, "fire-zone");
    s = addMod(s, "c", 1.2, 0, "ice-zone");
    const result = getModsBySource(s, "ice-zone");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("c");
  });

  it("returns empty when source not found", () => {
    const s = addMod(createMovementModState(), "a", 1.5, 0, "ice");
    expect(getModsBySource(s, "fire")).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveMods
// ════════════════════════════════════════════════════════════════

describe("getActiveMods", () => {
  it("returns empty for fresh state", () => {
    expect(getActiveMods(createMovementModState())).toEqual([]);
  });

  it("returns all permanent mods", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 0);
    s = addMod(s, "b", 0.8, 0);
    expect(getActiveMods(s)).toHaveLength(2);
  });

  it("returns timed mods that are not expired", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 5000);
    s = updateMods(s, 3000);
    expect(getActiveMods(s)).toHaveLength(1);
  });

  it("excludes expired timed mods after updateMods removes them", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5, 2000);
    s = updateMods(s, 2500);
    // updateMods already removes expired, so getActiveMods on the result is empty
    expect(getActiveMods(s)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § clearMods
// ════════════════════════════════════════════════════════════════

describe("clearMods", () => {
  it("removes all mods", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 0.8);
    s = clearMods(s);
    expect(s.mods).toHaveLength(0);
  });

  it("preserves baseSpeed", () => {
    let s = createMovementModState(500);
    s = addMod(s, "a", 1.5);
    s = clearMods(s);
    expect(s.baseSpeed).toBe(500);
  });

  it("is idempotent on empty state", () => {
    const s = clearMods(createMovementModState());
    expect(s.mods).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    const s0 = addMod(createMovementModState(), "a", 1.5);
    const s1 = clearMods(s0);
    expect(s0.mods).toHaveLength(1);
    expect(s1.mods).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § setBaseSpeed
// ════════════════════════════════════════════════════════════════

describe("setBaseSpeed", () => {
  it("updates baseSpeed", () => {
    const s = setBaseSpeed(createMovementModState(), 400);
    expect(s.baseSpeed).toBe(400);
  });

  it("preserves existing mods", () => {
    let s = addMod(createMovementModState(), "a", 1.5);
    s = setBaseSpeed(s, 300);
    expect(s.mods).toHaveLength(1);
    expect(s.baseSpeed).toBe(300);
  });

  it("does not mutate original state", () => {
    const s0 = createMovementModState(200);
    const s1 = setBaseSpeed(s0, 500);
    expect(s0.baseSpeed).toBe(200);
    expect(s1.baseSpeed).toBe(500);
  });

  it("allows setting baseSpeed to 0", () => {
    const s = setBaseSpeed(createMovementModState(), 0);
    expect(s.baseSpeed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getModCount
// ════════════════════════════════════════════════════════════════

describe("getModCount", () => {
  it("returns 0 for empty state", () => {
    expect(getModCount(createMovementModState())).toBe(0);
  });

  it("returns correct count after adds", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 0.8);
    s = addMod(s, "c", 1.2);
    expect(getModCount(s)).toBe(3);
  });

  it("decreases after remove", () => {
    let s = createMovementModState();
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 0.8);
    s = removeMod(s, "a");
    expect(getModCount(s)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § hasMod
// ════════════════════════════════════════════════════════════════

describe("hasMod", () => {
  it("returns false for empty state", () => {
    expect(hasMod(createMovementModState(), "any")).toBe(false);
  });

  it("returns true when mod exists", () => {
    const s = addMod(createMovementModState(), "boost", 1.5);
    expect(hasMod(s, "boost")).toBe(true);
  });

  it("returns false after mod removed", () => {
    let s = addMod(createMovementModState(), "boost", 1.5);
    s = removeMod(s, "boost");
    expect(hasMod(s, "boost")).toBe(false);
  });

  it("returns false for non-existent id", () => {
    const s = addMod(createMovementModState(), "a", 1.5);
    expect(hasMod(s, "b")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / Edge Cases
// ════════════════════════════════════════════════════════════════

describe("integration scenarios", () => {
  it("full lifecycle: add → update → expire → check speed", () => {
    let s = createMovementModState(200);
    s = addMod(s, "sprint", 2.0, 3000, "ability");
    expect(getEffectiveSpeed(s)).toBeCloseTo(400);

    s = updateMods(s, 2000);
    expect(getEffectiveSpeed(s)).toBeCloseTo(400);

    s = updateMods(s, 1500);
    expect(getModCount(s)).toBe(0);
    expect(getEffectiveSpeed(s)).toBe(200);
  });

  it("stacking slow + fast results in net multiplier", () => {
    let s = createMovementModState(200);
    s = addMod(s, "slow", 0.5, 0, "debuff");
    s = addMod(s, "fast", 1.5, 0, "buff");
    // 0.5 * 1.5 = 0.75
    expect(getEffectiveMultiplier(s)).toBeCloseTo(0.75);
    expect(getEffectiveSpeed(s)).toBeCloseTo(150);
  });

  it("non-stackable replacement updates effective speed", () => {
    let s = createMovementModState(200);
    s = addMod(s, "aura-v1", 1.2, 0, "aura", false);
    expect(getEffectiveSpeed(s)).toBeCloseTo(240);

    s = addMod(s, "aura-v2", 1.8, 0, "aura", false);
    expect(getModCount(s)).toBe(1);
    expect(getEffectiveSpeed(s)).toBeCloseTo(360);
  });

  it("clearMods resets effective speed to base", () => {
    let s = createMovementModState(200);
    s = addMod(s, "a", 2.0);
    s = addMod(s, "b", 0.5);
    s = clearMods(s);
    expect(getEffectiveSpeed(s)).toBe(200);
  });

  it("setBaseSpeed changes effective speed with existing mods", () => {
    let s = createMovementModState(200);
    s = addMod(s, "m1", 1.5);
    expect(getEffectiveSpeed(s)).toBeCloseTo(300);

    s = setBaseSpeed(s, 100);
    expect(getEffectiveSpeed(s)).toBeCloseTo(150);
  });

  it("many mods product clamps correctly at upper bound", () => {
    let s = createMovementModState(100);
    s = addMod(s, "a", 1.5);
    s = addMod(s, "b", 1.5);
    s = addMod(s, "c", 1.5);
    // 1.5^3 = 3.375, clamped to 3.0
    expect(getEffectiveMultiplier(s)).toBe(3.0);
    expect(getEffectiveSpeed(s)).toBeCloseTo(300);
  });

  it("many slow mods product clamps correctly at lower bound", () => {
    let s = createMovementModState(200);
    s = addMod(s, "a", 0.3);
    s = addMod(s, "b", 0.2);
    // 0.3 * 0.2 = 0.06, clamped to 0.1
    expect(getEffectiveMultiplier(s)).toBe(0.1);
    expect(getEffectiveSpeed(s)).toBeCloseTo(20);
  });

  it("negative duration treated as permanent (duration <= 0)", () => {
    let s = createMovementModState();
    s = addMod(s, "neg-dur", 1.5, -1);
    s = updateMods(s, 100000);
    expect(s.mods).toHaveLength(1);
  });
});
