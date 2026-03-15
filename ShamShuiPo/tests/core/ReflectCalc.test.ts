import { describe, it, expect } from "vitest";
import {
  createReflectState,
  calculateReflectDamage,
  applyReflect,
  setReflectPercent,
  setFlatReflect,
  getAverageReflect,
  getReflectStats,
  resetStats,
  isReflectActive,
} from "../../src/core/ReflectCalc";

// ─── createReflectState ──────────────────────────────────────

describe("createReflectState", () => {
  it("should create state with all defaults", () => {
    const s = createReflectState();
    expect(s.config.reflectPercent).toBe(0.15);
    expect(s.config.flatReflect).toBe(5);
    expect(s.config.minReflect).toBe(1);
    expect(s.config.maxReflect).toBe(100);
    expect(s.config.reflectType).toBe("true");
    expect(s.totalReflected).toBe(0);
    expect(s.reflectCount).toBe(0);
  });

  it("should override reflectPercent", () => {
    const s = createReflectState({ reflectPercent: 0.3 });
    expect(s.config.reflectPercent).toBe(0.3);
    expect(s.config.flatReflect).toBe(5);
  });

  it("should override flatReflect", () => {
    const s = createReflectState({ flatReflect: 10 });
    expect(s.config.flatReflect).toBe(10);
    expect(s.config.reflectPercent).toBe(0.15);
  });

  it("should override minReflect", () => {
    const s = createReflectState({ minReflect: 5 });
    expect(s.config.minReflect).toBe(5);
  });

  it("should override maxReflect", () => {
    const s = createReflectState({ maxReflect: 200 });
    expect(s.config.maxReflect).toBe(200);
  });

  it("should override reflectType to physical", () => {
    const s = createReflectState({ reflectType: "physical" });
    expect(s.config.reflectType).toBe("physical");
  });

  it("should override reflectType to magical", () => {
    const s = createReflectState({ reflectType: "magical" });
    expect(s.config.reflectType).toBe("magical");
  });

  it("should override multiple fields at once", () => {
    const s = createReflectState({
      reflectPercent: 0.5,
      flatReflect: 20,
      maxReflect: 500,
    });
    expect(s.config.reflectPercent).toBe(0.5);
    expect(s.config.flatReflect).toBe(20);
    expect(s.config.maxReflect).toBe(500);
    expect(s.config.minReflect).toBe(1);
  });

  it("should always start counters at zero", () => {
    const s = createReflectState({ reflectPercent: 1.0 });
    expect(s.totalReflected).toBe(0);
    expect(s.reflectCount).toBe(0);
  });

  it("should accept empty partial config", () => {
    const s = createReflectState({});
    expect(s.config.reflectPercent).toBe(0.15);
  });

  it("should accept zero values", () => {
    const s = createReflectState({ reflectPercent: 0, flatReflect: 0 });
    expect(s.config.reflectPercent).toBe(0);
    expect(s.config.flatReflect).toBe(0);
  });
});

// ─── calculateReflectDamage ──────────────────────────────────

describe("calculateReflectDamage", () => {
  it("should compute basic reflect damage with defaults", () => {
    const s = createReflectState();
    // 100 * 0.15 + 5 = 20
    expect(calculateReflectDamage(s, 100)).toBe(20);
  });

  it("should compute reflect for zero incoming damage", () => {
    const s = createReflectState();
    // 0 * 0.15 + 5 = 5
    expect(calculateReflectDamage(s, 0)).toBe(5);
  });

  it("should clamp to minReflect when result is too low", () => {
    const s = createReflectState({
      reflectPercent: 0,
      flatReflect: 0,
      minReflect: 3,
    });
    expect(calculateReflectDamage(s, 0)).toBe(3);
  });

  it("should clamp to maxReflect when result is too high", () => {
    const s = createReflectState({ maxReflect: 10 });
    // 1000 * 0.15 + 5 = 155, clamped to 10
    expect(calculateReflectDamage(s, 1000)).toBe(10);
  });

  it("should return minReflect when both percent and flat are zero", () => {
    const s = createReflectState({
      reflectPercent: 0,
      flatReflect: 0,
      minReflect: 1,
    });
    expect(calculateReflectDamage(s, 50)).toBe(1);
  });

  it("should handle high incoming damage", () => {
    const s = createReflectState({
      reflectPercent: 0.5,
      flatReflect: 0,
      maxReflect: 9999,
    });
    expect(calculateReflectDamage(s, 500)).toBe(250);
  });

  it("should respect flatReflect only when percent is zero", () => {
    const s = createReflectState({ reflectPercent: 0, flatReflect: 15 });
    expect(calculateReflectDamage(s, 200)).toBe(15);
  });

  it("should compute with 100% reflect", () => {
    const s = createReflectState({ reflectPercent: 1.0, flatReflect: 0 });
    expect(calculateReflectDamage(s, 50)).toBe(50);
  });

  it("should handle very small incoming damage", () => {
    const s = createReflectState({
      reflectPercent: 0.1,
      flatReflect: 0,
      minReflect: 0,
    });
    expect(calculateReflectDamage(s, 1)).toBeCloseTo(0.1);
  });

  it("should clamp between min and max correctly when raw equals max", () => {
    const s = createReflectState({
      reflectPercent: 0.5,
      flatReflect: 0,
      maxReflect: 25,
    });
    expect(calculateReflectDamage(s, 50)).toBe(25);
  });

  it("should clamp between min and max correctly when raw equals min", () => {
    const s = createReflectState({
      reflectPercent: 0,
      flatReflect: 5,
      minReflect: 5,
    });
    expect(calculateReflectDamage(s, 0)).toBe(5);
  });
});

// ─── applyReflect ────────────────────────────────────────────

describe("applyReflect", () => {
  it("should return reflected damage and updated state", () => {
    const s = createReflectState();
    const { newState, reflectedDamage } = applyReflect(s, 100);
    expect(reflectedDamage).toBe(20);
    expect(newState.totalReflected).toBe(20);
    expect(newState.reflectCount).toBe(1);
  });

  it("should not mutate original state", () => {
    const s = createReflectState();
    applyReflect(s, 100);
    expect(s.totalReflected).toBe(0);
    expect(s.reflectCount).toBe(0);
  });

  it("should accumulate over multiple applies", () => {
    let s = createReflectState();
    const r1 = applyReflect(s, 100);
    s = r1.newState;
    const r2 = applyReflect(s, 200);
    s = r2.newState;
    // 100*0.15+5=20, 200*0.15+5=35
    expect(s.totalReflected).toBe(55);
    expect(s.reflectCount).toBe(2);
  });

  it("should clamp reflected damage to maxReflect", () => {
    const s = createReflectState({ maxReflect: 10 });
    const { reflectedDamage } = applyReflect(s, 1000);
    expect(reflectedDamage).toBe(10);
  });

  it("should clamp reflected damage to minReflect", () => {
    const s = createReflectState({
      reflectPercent: 0,
      flatReflect: 0,
      minReflect: 7,
    });
    const { reflectedDamage } = applyReflect(s, 0);
    expect(reflectedDamage).toBe(7);
  });

  it("should preserve config through apply", () => {
    const s = createReflectState({ reflectType: "magical" });
    const { newState } = applyReflect(s, 50);
    expect(newState.config.reflectType).toBe("magical");
    expect(newState.config.reflectPercent).toBe(0.15);
  });

  it("should handle zero incoming damage", () => {
    const s = createReflectState();
    const { reflectedDamage, newState } = applyReflect(s, 0);
    expect(reflectedDamage).toBe(5); // 0 * 0.15 + 5
    expect(newState.reflectCount).toBe(1);
  });
});

// ─── setReflectPercent ───────────────────────────────────────

describe("setReflectPercent", () => {
  it("should set a valid percent", () => {
    const s = createReflectState();
    const updated = setReflectPercent(s, 0.5);
    expect(updated.config.reflectPercent).toBe(0.5);
  });

  it("should clamp percent below 0 to 0", () => {
    const s = createReflectState();
    const updated = setReflectPercent(s, -0.5);
    expect(updated.config.reflectPercent).toBe(0);
  });

  it("should clamp percent above 1 to 1", () => {
    const s = createReflectState();
    const updated = setReflectPercent(s, 1.5);
    expect(updated.config.reflectPercent).toBe(1);
  });

  it("should allow exactly 0", () => {
    const s = createReflectState();
    const updated = setReflectPercent(s, 0);
    expect(updated.config.reflectPercent).toBe(0);
  });

  it("should allow exactly 1", () => {
    const s = createReflectState();
    const updated = setReflectPercent(s, 1);
    expect(updated.config.reflectPercent).toBe(1);
  });

  it("should not mutate original state", () => {
    const s = createReflectState();
    setReflectPercent(s, 0.8);
    expect(s.config.reflectPercent).toBe(0.15);
  });

  it("should preserve other config fields", () => {
    const s = createReflectState({ flatReflect: 20, reflectType: "physical" });
    const updated = setReflectPercent(s, 0.7);
    expect(updated.config.flatReflect).toBe(20);
    expect(updated.config.reflectType).toBe("physical");
  });

  it("should preserve counters", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    const updated = setReflectPercent(s, 0.5);
    expect(updated.totalReflected).toBe(s.totalReflected);
    expect(updated.reflectCount).toBe(1);
  });
});

// ─── setFlatReflect ──────────────────────────────────────────

describe("setFlatReflect", () => {
  it("should set flat reflect value", () => {
    const s = createReflectState();
    const updated = setFlatReflect(s, 25);
    expect(updated.config.flatReflect).toBe(25);
  });

  it("should allow zero", () => {
    const s = createReflectState();
    const updated = setFlatReflect(s, 0);
    expect(updated.config.flatReflect).toBe(0);
  });

  it("should allow negative values (damage reduction reflection)", () => {
    const s = createReflectState();
    const updated = setFlatReflect(s, -5);
    expect(updated.config.flatReflect).toBe(-5);
  });

  it("should not mutate original state", () => {
    const s = createReflectState();
    setFlatReflect(s, 99);
    expect(s.config.flatReflect).toBe(5);
  });

  it("should preserve other config fields", () => {
    const s = createReflectState({
      reflectPercent: 0.3,
      reflectType: "magical",
    });
    const updated = setFlatReflect(s, 50);
    expect(updated.config.reflectPercent).toBe(0.3);
    expect(updated.config.reflectType).toBe("magical");
  });

  it("should preserve counters", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    const updated = setFlatReflect(s, 50);
    expect(updated.reflectCount).toBe(1);
    expect(updated.totalReflected).toBe(s.totalReflected);
  });
});

// ─── getAverageReflect ───────────────────────────────────────

describe("getAverageReflect", () => {
  it("should return 0 when no reflects have occurred", () => {
    const s = createReflectState();
    expect(getAverageReflect(s)).toBe(0);
  });

  it("should compute average after one reflect", () => {
    const s = createReflectState();
    const { newState } = applyReflect(s, 100);
    expect(getAverageReflect(newState)).toBe(20);
  });

  it("should compute average after multiple reflects", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState; // 20
    s = applyReflect(s, 200).newState; // 35
    expect(getAverageReflect(s)).toBeCloseTo(27.5);
  });

  it("should return 0 after resetStats", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    s = resetStats(s);
    expect(getAverageReflect(s)).toBe(0);
  });
});

// ─── getReflectStats ─────────────────────────────────────────

describe("getReflectStats", () => {
  it("should return all zeroes on fresh state", () => {
    const s = createReflectState();
    const stats = getReflectStats(s);
    expect(stats.totalReflected).toBe(0);
    expect(stats.reflectCount).toBe(0);
    expect(stats.averageReflect).toBe(0);
    expect(stats.config.reflectPercent).toBe(0.15);
  });

  it("should return correct stats after reflects", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    s = applyReflect(s, 200).newState;
    const stats = getReflectStats(s);
    expect(stats.totalReflected).toBe(55);
    expect(stats.reflectCount).toBe(2);
    expect(stats.averageReflect).toBeCloseTo(27.5);
  });

  it("should include current config", () => {
    const s = createReflectState({ reflectType: "physical", maxReflect: 999 });
    const stats = getReflectStats(s);
    expect(stats.config.reflectType).toBe("physical");
    expect(stats.config.maxReflect).toBe(999);
  });

  it("should reflect updated config after setReflectPercent", () => {
    let s = createReflectState();
    s = setReflectPercent(s, 0.8);
    const stats = getReflectStats(s);
    expect(stats.config.reflectPercent).toBe(0.8);
  });
});

// ─── resetStats ──────────────────────────────────────────────

describe("resetStats", () => {
  it("should zero out counters", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    s = applyReflect(s, 200).newState;
    const reset = resetStats(s);
    expect(reset.totalReflected).toBe(0);
    expect(reset.reflectCount).toBe(0);
  });

  it("should preserve config", () => {
    let s = createReflectState({ reflectPercent: 0.5, reflectType: "magical" });
    s = applyReflect(s, 100).newState;
    const reset = resetStats(s);
    expect(reset.config.reflectPercent).toBe(0.5);
    expect(reset.config.reflectType).toBe("magical");
  });

  it("should not mutate original state", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    const before = s.totalReflected;
    resetStats(s);
    expect(s.totalReflected).toBe(before);
  });

  it("should be idempotent on fresh state", () => {
    const s = createReflectState();
    const reset = resetStats(s);
    expect(reset.totalReflected).toBe(0);
    expect(reset.reflectCount).toBe(0);
  });
});

// ─── isReflectActive ─────────────────────────────────────────

describe("isReflectActive", () => {
  it("should return true with default config", () => {
    const s = createReflectState();
    expect(isReflectActive(s)).toBe(true);
  });

  it("should return true when only percent is positive", () => {
    const s = createReflectState({ reflectPercent: 0.1, flatReflect: 0 });
    expect(isReflectActive(s)).toBe(true);
  });

  it("should return true when only flat is positive", () => {
    const s = createReflectState({ reflectPercent: 0, flatReflect: 5 });
    expect(isReflectActive(s)).toBe(true);
  });

  it("should return false when both are zero", () => {
    const s = createReflectState({ reflectPercent: 0, flatReflect: 0 });
    expect(isReflectActive(s)).toBe(false);
  });

  it("should return true after setReflectPercent to positive", () => {
    let s = createReflectState({ reflectPercent: 0, flatReflect: 0 });
    s = setReflectPercent(s, 0.1);
    expect(isReflectActive(s)).toBe(true);
  });

  it("should return false after setting both to zero", () => {
    let s = createReflectState();
    s = setReflectPercent(s, 0);
    s = setFlatReflect(s, 0);
    expect(isReflectActive(s)).toBe(false);
  });

  it("should return false with negative values clamped to zero", () => {
    let s = createReflectState({ flatReflect: 0 });
    s = setReflectPercent(s, -1);
    expect(isReflectActive(s)).toBe(false);
  });
});

// ─── Immutability ────────────────────────────────────────────

describe("immutability", () => {
  it("applyReflect should not modify the input state object", () => {
    const s = createReflectState();
    const original = { ...s };
    applyReflect(s, 100);
    expect(s.totalReflected).toBe(original.totalReflected);
    expect(s.reflectCount).toBe(original.reflectCount);
  });

  it("setReflectPercent should not modify the input config", () => {
    const s = createReflectState();
    const originalPercent = s.config.reflectPercent;
    setReflectPercent(s, 0.9);
    expect(s.config.reflectPercent).toBe(originalPercent);
  });

  it("setFlatReflect should not modify the input config", () => {
    const s = createReflectState();
    const originalFlat = s.config.flatReflect;
    setFlatReflect(s, 999);
    expect(s.config.flatReflect).toBe(originalFlat);
  });

  it("resetStats should not modify the input state", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    const beforeCount = s.reflectCount;
    resetStats(s);
    expect(s.reflectCount).toBe(beforeCount);
  });
});

// ─── Edge Cases / Integration ────────────────────────────────

describe("edge cases and integration", () => {
  it("should handle very large incoming damage", () => {
    const s = createReflectState({ maxReflect: 100 });
    expect(calculateReflectDamage(s, 1_000_000)).toBe(100);
  });

  it("should handle minReflect greater than maxReflect (returns maxReflect)", () => {
    const s = createReflectState({
      minReflect: 50,
      maxReflect: 10,
      reflectPercent: 0,
      flatReflect: 0,
    });
    // raw=0, max(0,50)=50, min(50,10)=10
    expect(calculateReflectDamage(s, 100)).toBe(10);
  });

  it("should chain multiple operations correctly", () => {
    let s = createReflectState();
    s = setReflectPercent(s, 0.5);
    s = setFlatReflect(s, 10);
    const { newState, reflectedDamage } = applyReflect(s, 100);
    // 100 * 0.5 + 10 = 60
    expect(reflectedDamage).toBe(60);
    expect(newState.reflectCount).toBe(1);
    expect(newState.totalReflected).toBe(60);
  });

  it("should handle stats after reset and new applies", () => {
    let s = createReflectState();
    s = applyReflect(s, 100).newState;
    s = applyReflect(s, 100).newState;
    s = resetStats(s);
    s = applyReflect(s, 100).newState;
    expect(s.reflectCount).toBe(1);
    expect(s.totalReflected).toBe(20);
    expect(getAverageReflect(s)).toBe(20);
  });

  it("should keep config through entire lifecycle", () => {
    let s = createReflectState({ reflectType: "physical" });
    s = setReflectPercent(s, 0.3);
    s = applyReflect(s, 50).newState;
    s = resetStats(s);
    s = setFlatReflect(s, 0);
    expect(s.config.reflectType).toBe("physical");
    expect(s.config.reflectPercent).toBe(0.3);
    expect(s.config.flatReflect).toBe(0);
  });

  it("should compute correct damage with fractional values", () => {
    const s = createReflectState({
      reflectPercent: 0.123,
      flatReflect: 2.5,
      minReflect: 0,
      maxReflect: 1000,
    });
    const result = calculateReflectDamage(s, 77);
    // 77 * 0.123 + 2.5 = 9.471 + 2.5 = 11.971
    expect(result).toBeCloseTo(11.971);
  });
});
