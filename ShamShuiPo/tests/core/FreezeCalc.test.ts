import { describe, it, expect } from "vitest";
import {
  createFreezeState,
  applyFreeze,
  updateFreezes,
  isFrozen,
  isImmune,
  getSpeedMultiplier,
  getActiveFreezes,
  removeFreeze,
  clearFreezes,
  resetImmunity,
  getFreezeCount,
  getRemainingDuration,
} from "../../src/core/FreezeCalc";

// ─── createFreezeState ───────────────────────────────────────

describe("createFreezeState", () => {
  it("returns default config when no args", () => {
    const s = createFreezeState();
    expect(s.config.baseDuration).toBe(2000);
    expect(s.config.baseSlowPercent).toBe(1.0);
    expect(s.config.diminishingReturns).toBe(true);
    expect(s.config.diminishFactor).toBe(0.7);
    expect(s.config.maxFreezeCount).toBe(3);
  });

  it("starts with empty effects", () => {
    const s = createFreezeState();
    expect(s.effects).toHaveLength(0);
  });

  it("starts with empty freezeCounts", () => {
    const s = createFreezeState();
    expect(Object.keys(s.freezeCounts)).toHaveLength(0);
  });

  it("merges partial config", () => {
    const s = createFreezeState({ baseDuration: 5000, maxFreezeCount: 5 });
    expect(s.config.baseDuration).toBe(5000);
    expect(s.config.maxFreezeCount).toBe(5);
    expect(s.config.diminishFactor).toBe(0.7); // default preserved
  });

  it("overrides baseSlowPercent", () => {
    const s = createFreezeState({ baseSlowPercent: 0.5 });
    expect(s.config.baseSlowPercent).toBe(0.5);
  });

  it("can disable diminishing returns", () => {
    const s = createFreezeState({ diminishingReturns: false });
    expect(s.config.diminishingReturns).toBe(false);
  });
});

// ─── applyFreeze ─────────────────────────────────────────────

describe("applyFreeze", () => {
  it("adds a freeze effect to a target", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].targetId).toBe("e1");
    expect(s.effects[0].active).toBe(true);
  });

  it("uses baseDuration by default", () => {
    let s = createFreezeState({ baseDuration: 3000 });
    s = applyFreeze(s, "e1");
    expect(s.effects[0].duration).toBe(3000);
  });

  it("accepts custom duration", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 500);
    expect(s.effects[0].duration).toBe(500);
  });

  it("sets elapsed to 0", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    expect(s.effects[0].elapsed).toBe(0);
  });

  it("increments freeze count", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    expect(s.freezeCounts["e1"]).toBe(1);
  });

  it("replaces existing freeze on same target", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    s = updateFreezes(s, 500);
    s = applyFreeze(s, "e1", 3000);
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].elapsed).toBe(0);
  });

  it("freezes multiple targets independently", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    expect(s.effects).toHaveLength(2);
  });

  it("applies diminishing returns on second freeze", () => {
    let s = createFreezeState({ baseDuration: 1000, diminishFactor: 0.5 });
    s = applyFreeze(s, "e1"); // count=0 -> duration=1000, count becomes 1
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // count=1 -> duration=1000*0.5=500
    expect(s.effects[0].duration).toBe(500);
  });

  it("applies diminishing returns on third freeze", () => {
    let s = createFreezeState({
      baseDuration: 1000,
      diminishFactor: 0.5,
      maxFreezeCount: 5,
    });
    s = applyFreeze(s, "e1"); // count 0->1, dur=1000
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // count 1->2, dur=500
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // count 2->3, dur=250
    expect(s.effects[0].duration).toBe(250);
  });

  it("does not apply diminishing when disabled", () => {
    let s = createFreezeState({
      baseDuration: 1000,
      diminishingReturns: false,
    });
    s = applyFreeze(s, "e1");
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1");
    expect(s.effects[0].duration).toBe(1000);
  });

  it("returns same state when target is immune", () => {
    let s = createFreezeState({ maxFreezeCount: 1 });
    s = applyFreeze(s, "e1"); // count becomes 1
    s = removeFreeze(s, "e1");
    const s2 = applyFreeze(s, "e1"); // count=1 >= max=1 -> immune
    expect(s2).toBe(s);
  });

  it("sets slowPercent from config", () => {
    let s = createFreezeState({ baseSlowPercent: 0.6 });
    s = applyFreeze(s, "e1");
    expect(s.effects[0].slowPercent).toBe(0.6);
  });

  it("custom duration still gets diminishing", () => {
    let s = createFreezeState({ diminishFactor: 0.5 });
    s = applyFreeze(s, "e1", 1000); // count 0->1
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1", 1000); // count 1->2, dur=500
    expect(s.effects[0].duration).toBe(500);
  });
});

// ─── updateFreezes ───────────────────────────────────────────

describe("updateFreezes", () => {
  it("advances elapsed time", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    s = updateFreezes(s, 500);
    expect(s.effects[0].elapsed).toBe(500);
  });

  it("deactivates and removes expired freezes", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 1000);
    s = updateFreezes(s, 1000);
    expect(s.effects).toHaveLength(0);
  });

  it("returns same state when no effects", () => {
    const s = createFreezeState();
    expect(updateFreezes(s, 100)).toBe(s);
  });

  it("handles multiple freezes with different durations", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 500);
    s = applyFreeze(s, "e2", 2000);
    s = updateFreezes(s, 600);
    // e1 expired, e2 still active
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].targetId).toBe("e2");
  });

  it("accumulates elapsed across updates", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    s = updateFreezes(s, 300);
    s = updateFreezes(s, 400);
    expect(s.effects[0].elapsed).toBe(700);
  });

  it("removes freeze exactly at duration boundary", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 1000);
    s = updateFreezes(s, 999);
    expect(s.effects).toHaveLength(1);
    s = updateFreezes(s, 1);
    expect(s.effects).toHaveLength(0);
  });

  it("handles zero delta", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 1000);
    const s2 = updateFreezes(s, 0);
    expect(s2.effects[0].elapsed).toBe(0);
  });
});

// ─── isFrozen ────────────────────────────────────────────────

describe("isFrozen", () => {
  it("returns true for active freeze", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    expect(isFrozen(s, "e1")).toBe(true);
  });

  it("returns false for unknown target", () => {
    const s = createFreezeState();
    expect(isFrozen(s, "e1")).toBe(false);
  });

  it("returns false after freeze expires", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 500);
    s = updateFreezes(s, 500);
    expect(isFrozen(s, "e1")).toBe(false);
  });

  it("returns false after removeFreeze", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = removeFreeze(s, "e1");
    expect(isFrozen(s, "e1")).toBe(false);
  });
});

// ─── isImmune ────────────────────────────────────────────────

describe("isImmune", () => {
  it("returns false initially", () => {
    const s = createFreezeState();
    expect(isImmune(s, "e1")).toBe(false);
  });

  it("returns true after maxFreezeCount reached", () => {
    let s = createFreezeState({ maxFreezeCount: 2 });
    s = applyFreeze(s, "e1"); // count=1
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // count=2
    expect(isImmune(s, "e1")).toBe(true);
  });

  it("returns false when count < max", () => {
    let s = createFreezeState({ maxFreezeCount: 3 });
    s = applyFreeze(s, "e1");
    expect(isImmune(s, "e1")).toBe(false);
  });

  it("returns false after resetImmunity", () => {
    let s = createFreezeState({ maxFreezeCount: 1 });
    s = applyFreeze(s, "e1"); // count=1, now immune
    expect(isImmune(s, "e1")).toBe(true);
    s = resetImmunity(s, "e1");
    expect(isImmune(s, "e1")).toBe(false);
  });
});

// ─── getSpeedMultiplier ──────────────────────────────────────

describe("getSpeedMultiplier", () => {
  it("returns 1.0 for unfrozen target", () => {
    const s = createFreezeState();
    expect(getSpeedMultiplier(s, "e1")).toBe(1.0);
  });

  it("returns 0 for fully frozen target (slowPercent=1.0)", () => {
    let s = createFreezeState({ baseSlowPercent: 1.0 });
    s = applyFreeze(s, "e1");
    expect(getSpeedMultiplier(s, "e1")).toBe(0);
  });

  it("returns partial speed for partial freeze", () => {
    let s = createFreezeState({ baseSlowPercent: 0.6 });
    s = applyFreeze(s, "e1");
    expect(getSpeedMultiplier(s, "e1")).toBeCloseTo(0.4);
  });

  it("returns 1.0 after freeze expires", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 500);
    s = updateFreezes(s, 600);
    expect(getSpeedMultiplier(s, "e1")).toBe(1.0);
  });

  it("returns 0.5 for 50% slow", () => {
    let s = createFreezeState({ baseSlowPercent: 0.5 });
    s = applyFreeze(s, "e1");
    expect(getSpeedMultiplier(s, "e1")).toBe(0.5);
  });
});

// ─── getActiveFreezes ────────────────────────────────────────

describe("getActiveFreezes", () => {
  it("returns empty array when no freezes", () => {
    const s = createFreezeState();
    expect(getActiveFreezes(s)).toHaveLength(0);
  });

  it("returns all active freezes", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    expect(getActiveFreezes(s)).toHaveLength(2);
  });

  it("excludes expired freezes", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 100);
    s = applyFreeze(s, "e2", 2000);
    s = updateFreezes(s, 200);
    const active = getActiveFreezes(s);
    expect(active).toHaveLength(1);
    expect(active[0].targetId).toBe("e2");
  });
});

// ─── removeFreeze ────────────────────────────────────────────

describe("removeFreeze", () => {
  it("removes freeze for target", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = removeFreeze(s, "e1");
    expect(s.effects).toHaveLength(0);
  });

  it("does not affect other targets", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    s = removeFreeze(s, "e1");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].targetId).toBe("e2");
  });

  it("returns same state if target not found", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    const s2 = removeFreeze(s, "e999");
    expect(s2).toBe(s);
  });

  it("preserves freeze count after removal", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = removeFreeze(s, "e1");
    expect(getFreezeCount(s, "e1")).toBe(1);
  });
});

// ─── clearFreezes ────────────────────────────────────────────

describe("clearFreezes", () => {
  it("removes all freezes", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    s = clearFreezes(s);
    expect(s.effects).toHaveLength(0);
  });

  it("returns same state if already empty", () => {
    const s = createFreezeState();
    expect(clearFreezes(s)).toBe(s);
  });

  it("preserves freeze counts", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = clearFreezes(s);
    expect(getFreezeCount(s, "e1")).toBe(1);
  });

  it("preserves config", () => {
    let s = createFreezeState({ baseDuration: 999 });
    s = applyFreeze(s, "e1");
    s = clearFreezes(s);
    expect(s.config.baseDuration).toBe(999);
  });
});

// ─── resetImmunity ───────────────────────────────────────────

describe("resetImmunity", () => {
  it("resets freeze count to zero", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = resetImmunity(s, "e1");
    expect(getFreezeCount(s, "e1")).toBe(0);
  });

  it("allows refreezing after reset", () => {
    let s = createFreezeState({ maxFreezeCount: 1 });
    s = applyFreeze(s, "e1");
    s = removeFreeze(s, "e1");
    expect(isImmune(s, "e1")).toBe(true);
    s = resetImmunity(s, "e1");
    s = applyFreeze(s, "e1");
    expect(isFrozen(s, "e1")).toBe(true);
  });

  it("returns same state if target has no count", () => {
    const s = createFreezeState();
    expect(resetImmunity(s, "e1")).toBe(s);
  });

  it("does not affect other targets", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    s = resetImmunity(s, "e1");
    expect(getFreezeCount(s, "e1")).toBe(0);
    expect(getFreezeCount(s, "e2")).toBe(1);
  });
});

// ─── getFreezeCount ──────────────────────────────────────────

describe("getFreezeCount", () => {
  it("returns 0 for unknown target", () => {
    const s = createFreezeState();
    expect(getFreezeCount(s, "e1")).toBe(0);
  });

  it("increments with each apply", () => {
    let s = createFreezeState({ maxFreezeCount: 10 });
    s = applyFreeze(s, "e1");
    expect(getFreezeCount(s, "e1")).toBe(1);
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1");
    expect(getFreezeCount(s, "e1")).toBe(2);
  });

  it("does not increment when immune", () => {
    let s = createFreezeState({ maxFreezeCount: 1 });
    s = applyFreeze(s, "e1"); // count=1
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // immune, no change
    expect(getFreezeCount(s, "e1")).toBe(1);
  });
});

// ─── getRemainingDuration ────────────────────────────────────

describe("getRemainingDuration", () => {
  it("returns 0 for unfrozen target", () => {
    const s = createFreezeState();
    expect(getRemainingDuration(s, "e1")).toBe(0);
  });

  it("returns full duration at start", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    expect(getRemainingDuration(s, "e1")).toBe(2000);
  });

  it("returns remaining after partial update", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    s = updateFreezes(s, 800);
    expect(getRemainingDuration(s, "e1")).toBe(1200);
  });

  it("returns 0 after freeze expires", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 1000);
    s = updateFreezes(s, 1500);
    expect(getRemainingDuration(s, "e1")).toBe(0);
  });
});

// ─── Immutability ────────────────────────────────────────────

describe("immutability", () => {
  it("applyFreeze does not mutate original state", () => {
    const s = createFreezeState();
    const s2 = applyFreeze(s, "e1");
    expect(s.effects).toHaveLength(0);
    expect(s2.effects).toHaveLength(1);
  });

  it("updateFreezes does not mutate original state", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 2000);
    const before = s.effects[0].elapsed;
    updateFreezes(s, 500);
    expect(s.effects[0].elapsed).toBe(before);
  });

  it("removeFreeze does not mutate original state", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    const len = s.effects.length;
    removeFreeze(s, "e1");
    expect(s.effects.length).toBe(len);
  });

  it("clearFreezes does not mutate original state", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    clearFreezes(s);
    expect(s.effects).toHaveLength(1);
  });

  it("resetImmunity does not mutate original state", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1");
    const count = s.freezeCounts["e1"];
    resetImmunity(s, "e1");
    expect(s.freezeCounts["e1"]).toBe(count);
  });
});

// ─── Integration / Edge Cases ────────────────────────────────

describe("integration", () => {
  it("full lifecycle: freeze -> partial update -> expire -> refreeze -> immune", () => {
    let s = createFreezeState({
      baseDuration: 1000,
      maxFreezeCount: 2,
      diminishFactor: 0.5,
    });

    // First freeze
    s = applyFreeze(s, "e1");
    expect(isFrozen(s, "e1")).toBe(true);
    expect(getRemainingDuration(s, "e1")).toBe(1000);

    // Expire
    s = updateFreezes(s, 1000);
    expect(isFrozen(s, "e1")).toBe(false);

    // Second freeze (diminished)
    s = applyFreeze(s, "e1");
    expect(s.effects[0].duration).toBe(500); // 1000 * 0.5
    expect(getFreezeCount(s, "e1")).toBe(2);
    expect(isImmune(s, "e1")).toBe(true);

    // Third attempt blocked
    s = removeFreeze(s, "e1");
    const s2 = applyFreeze(s, "e1");
    expect(s2).toBe(s);
  });

  it("multiple targets with independent immunity", () => {
    let s = createFreezeState({ maxFreezeCount: 1 });
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    expect(isImmune(s, "e1")).toBe(true);
    expect(isImmune(s, "e2")).toBe(true);
    s = resetImmunity(s, "e1");
    expect(isImmune(s, "e1")).toBe(false);
    expect(isImmune(s, "e2")).toBe(true);
  });

  it("speed multiplier transitions correctly", () => {
    let s = createFreezeState({ baseSlowPercent: 0.8 });
    expect(getSpeedMultiplier(s, "e1")).toBe(1.0);
    s = applyFreeze(s, "e1", 500);
    expect(getSpeedMultiplier(s, "e1")).toBeCloseTo(0.2);
    s = updateFreezes(s, 500);
    expect(getSpeedMultiplier(s, "e1")).toBe(1.0);
  });

  it("clearFreezes then refreeze works", () => {
    let s = createFreezeState({ maxFreezeCount: 5 });
    s = applyFreeze(s, "e1");
    s = applyFreeze(s, "e2");
    s = clearFreezes(s);
    expect(getActiveFreezes(s)).toHaveLength(0);
    s = applyFreeze(s, "e1");
    expect(isFrozen(s, "e1")).toBe(true);
    expect(getFreezeCount(s, "e1")).toBe(2);
  });

  it("resetImmunity restores diminishing from zero", () => {
    let s = createFreezeState({
      baseDuration: 1000,
      diminishFactor: 0.5,
      maxFreezeCount: 5,
    });
    s = applyFreeze(s, "e1"); // count 0->1, dur=1000
    s = removeFreeze(s, "e1");
    s = applyFreeze(s, "e1"); // count 1->2, dur=500
    s = removeFreeze(s, "e1");
    s = resetImmunity(s, "e1");
    s = applyFreeze(s, "e1"); // count 0->1, dur=1000 again
    expect(s.effects[0].duration).toBe(1000);
  });

  it("large delta removes all freezes", () => {
    let s = createFreezeState();
    s = applyFreeze(s, "e1", 1000);
    s = applyFreeze(s, "e2", 2000);
    s = applyFreeze(s, "e3", 3000);
    s = updateFreezes(s, 10000);
    expect(getActiveFreezes(s)).toHaveLength(0);
  });
});
