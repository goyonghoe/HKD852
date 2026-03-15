import { describe, it, expect } from "vitest";
import {
  createAttackSpeedState,
  getEffectiveAttackSpeed,
  getAttackInterval,
  addBonusPercent,
  addBonusFlat,
  recordAttack,
  getActualDPS,
  getAverageAttackSpeed,
  resetStats,
  setScalingType,
  getStats,
} from "../../src/core/AttackSpeedCalc";

// ─── createAttackSpeedState ───

describe("createAttackSpeedState", () => {
  it("returns default config when called with no arguments", () => {
    const s = createAttackSpeedState();
    expect(s.config.baseAttackSpeed).toBe(1.0);
    expect(s.config.maxAttackSpeed).toBe(10.0);
    expect(s.config.minAttackInterval).toBe(50);
    expect(s.config.scalingType).toBe("multiplicative");
  });

  it("initializes counters to zero", () => {
    const s = createAttackSpeedState();
    expect(s.bonusPercent).toBe(0);
    expect(s.bonusFlat).toBe(0);
    expect(s.totalAttacks).toBe(0);
    expect(s.totalTime).toBe(0);
  });

  it("overrides baseAttackSpeed", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 2.5 });
    expect(s.config.baseAttackSpeed).toBe(2.5);
    expect(s.config.maxAttackSpeed).toBe(10.0);
  });

  it("overrides maxAttackSpeed", () => {
    const s = createAttackSpeedState({ maxAttackSpeed: 20 });
    expect(s.config.maxAttackSpeed).toBe(20);
  });

  it("overrides minAttackInterval", () => {
    const s = createAttackSpeedState({ minAttackInterval: 100 });
    expect(s.config.minAttackInterval).toBe(100);
  });

  it("overrides scalingType to linear", () => {
    const s = createAttackSpeedState({ scalingType: "linear" });
    expect(s.config.scalingType).toBe("linear");
  });

  it("overrides scalingType to diminishing", () => {
    const s = createAttackSpeedState({ scalingType: "diminishing" });
    expect(s.config.scalingType).toBe("diminishing");
  });

  it("overrides multiple fields at once", () => {
    const s = createAttackSpeedState({
      baseAttackSpeed: 3,
      maxAttackSpeed: 15,
      scalingType: "linear",
    });
    expect(s.config.baseAttackSpeed).toBe(3);
    expect(s.config.maxAttackSpeed).toBe(15);
    expect(s.config.scalingType).toBe("linear");
  });
});

// ─── getEffectiveAttackSpeed ───

describe("getEffectiveAttackSpeed", () => {
  it("returns base speed with no bonuses (multiplicative)", () => {
    const s = createAttackSpeedState();
    expect(getEffectiveAttackSpeed(s)).toBe(1.0);
  });

  it("multiplicative: base * (1+bonusPercent) + bonusFlat", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 2 });
    s = addBonusPercent(s, 0.5); // 2 * 1.5 = 3
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.0);
  });

  it("multiplicative with flat bonus", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 2 });
    s = addBonusPercent(s, 0.5);
    s = addBonusFlat(s, 1); // 2*1.5 + 1 = 4
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(4.0);
  });

  it("linear: base + base*bonusPercent + bonusFlat", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 2,
      scalingType: "linear",
    });
    s = addBonusPercent(s, 0.5); // 2 + 2*0.5 = 3
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.0);
  });

  it("linear with flat bonus", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 2,
      scalingType: "linear",
    });
    s = addBonusPercent(s, 0.5);
    s = addBonusFlat(s, 2); // 2 + 1 + 2 = 5
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(5.0);
  });

  it("diminishing: base * (1 + bp/(1+bp)) + bonusFlat", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 2,
      scalingType: "diminishing",
    });
    s = addBonusPercent(s, 1.0); // 2 * (1 + 1/2) = 3
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.0);
  });

  it("diminishing with flat bonus", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 2,
      scalingType: "diminishing",
    });
    s = addBonusPercent(s, 1.0);
    s = addBonusFlat(s, 0.5); // 3 + 0.5 = 3.5
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.5);
  });

  it("caps at maxAttackSpeed", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 5, maxAttackSpeed: 8 });
    s = addBonusPercent(s, 1.0); // 5*2 = 10, capped at 8
    expect(getEffectiveAttackSpeed(s)).toBe(8);
  });

  it("caps at maxAttackSpeed with flat bonus", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 5, maxAttackSpeed: 6 });
    s = addBonusFlat(s, 5); // 5 + 5 = 10, capped at 6
    expect(getEffectiveAttackSpeed(s)).toBe(6);
  });

  it("zero base returns zero with no bonuses", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 0 });
    expect(getEffectiveAttackSpeed(s)).toBe(0);
  });

  it("zero base with flat bonus returns flat", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 0 });
    s = addBonusFlat(s, 3);
    expect(getEffectiveAttackSpeed(s)).toBe(3);
  });

  it("diminishing returns converge with high bonus", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 1,
      scalingType: "diminishing",
      maxAttackSpeed: 100,
    });
    s = addBonusPercent(s, 99); // 1 * (1 + 99/100) = 1.99
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(1.99, 1);
  });

  it("diminishing never exceeds 2x base (without flat) at extreme bonus", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 4,
      scalingType: "diminishing",
      maxAttackSpeed: 100,
    });
    s = addBonusPercent(s, 1000);
    // 4 * (1 + 1000/1001) ≈ 7.996, less than 8
    expect(getEffectiveAttackSpeed(s)).toBeLessThan(8);
  });

  it("negative bonusPercent reduces speed", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 4 });
    s = addBonusPercent(s, -0.5); // 4 * 0.5 = 2
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(2.0);
  });
});

// ─── getAttackInterval ───

describe("getAttackInterval", () => {
  it("returns 1000ms at 1 attack/sec", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 1 });
    expect(getAttackInterval(s)).toBe(1000);
  });

  it("returns 500ms at 2 attacks/sec", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 2 });
    expect(getAttackInterval(s)).toBe(500);
  });

  it("floors at minAttackInterval", () => {
    const s = createAttackSpeedState({
      baseAttackSpeed: 100,
      maxAttackSpeed: 1000,
      minAttackInterval: 50,
    });
    // 1000/100 = 10ms, floored at 50
    expect(getAttackInterval(s)).toBe(50);
  });

  it("custom minAttackInterval floor", () => {
    const s = createAttackSpeedState({
      baseAttackSpeed: 20,
      minAttackInterval: 100,
    });
    // 1000/20 = 50, floored at 100
    expect(getAttackInterval(s)).toBe(100);
  });

  it("returns Infinity for 0 attack speed", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 0 });
    expect(getAttackInterval(s)).toBe(Infinity);
  });

  it("interval decreases with bonus percent", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 1 });
    const base = getAttackInterval(s);
    s = addBonusPercent(s, 1.0);
    expect(getAttackInterval(s)).toBeLessThan(base);
  });

  it("interval matches 1000/effectiveSpeed when above floor", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 4 });
    s = addBonusPercent(s, 0.25); // 4*1.25 = 5 -> 200ms
    expect(getAttackInterval(s)).toBeCloseTo(200);
  });
});

// ─── addBonusPercent ───

describe("addBonusPercent", () => {
  it("adds percent bonus", () => {
    const s = addBonusPercent(createAttackSpeedState(), 0.3);
    expect(s.bonusPercent).toBeCloseTo(0.3);
  });

  it("stacks additively", () => {
    let s = createAttackSpeedState();
    s = addBonusPercent(s, 0.2);
    s = addBonusPercent(s, 0.3);
    expect(s.bonusPercent).toBeCloseTo(0.5);
  });

  it("does not mutate original state", () => {
    const original = createAttackSpeedState();
    addBonusPercent(original, 0.5);
    expect(original.bonusPercent).toBe(0);
  });

  it("handles negative percent", () => {
    let s = createAttackSpeedState();
    s = addBonusPercent(s, -0.2);
    expect(s.bonusPercent).toBeCloseTo(-0.2);
  });
});

// ─── addBonusFlat ───

describe("addBonusFlat", () => {
  it("adds flat bonus", () => {
    const s = addBonusFlat(createAttackSpeedState(), 1.5);
    expect(s.bonusFlat).toBeCloseTo(1.5);
  });

  it("stacks additively", () => {
    let s = createAttackSpeedState();
    s = addBonusFlat(s, 1);
    s = addBonusFlat(s, 2);
    expect(s.bonusFlat).toBeCloseTo(3);
  });

  it("does not mutate original state", () => {
    const original = createAttackSpeedState();
    addBonusFlat(original, 5);
    expect(original.bonusFlat).toBe(0);
  });

  it("handles negative flat bonus", () => {
    let s = createAttackSpeedState();
    s = addBonusFlat(s, -0.5);
    expect(s.bonusFlat).toBeCloseTo(-0.5);
  });
});

// ─── recordAttack ───

describe("recordAttack", () => {
  it("increments totalAttacks by 1", () => {
    const s = recordAttack(createAttackSpeedState(), 100);
    expect(s.totalAttacks).toBe(1);
  });

  it("accumulates totalTime", () => {
    const s = recordAttack(createAttackSpeedState(), 250);
    expect(s.totalTime).toBe(250);
  });

  it("stacks multiple attacks", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 100);
    s = recordAttack(s, 200);
    s = recordAttack(s, 150);
    expect(s.totalAttacks).toBe(3);
    expect(s.totalTime).toBe(450);
  });

  it("does not mutate original state", () => {
    const original = createAttackSpeedState();
    recordAttack(original, 100);
    expect(original.totalAttacks).toBe(0);
    expect(original.totalTime).toBe(0);
  });

  it("preserves bonuses", () => {
    let s = createAttackSpeedState();
    s = addBonusPercent(s, 0.5);
    s = addBonusFlat(s, 1);
    s = recordAttack(s, 100);
    expect(s.bonusPercent).toBeCloseTo(0.5);
    expect(s.bonusFlat).toBe(1);
  });
});

// ─── getActualDPS ───

describe("getActualDPS", () => {
  it("returns effectiveSpeed * damagePerHit", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 2 });
    expect(getActualDPS(s, 50)).toBe(100);
  });

  it("accounts for bonuses", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 2 });
    s = addBonusPercent(s, 0.5); // 2*1.5 = 3
    expect(getActualDPS(s, 10)).toBeCloseTo(30);
  });

  it("returns 0 for 0 damage", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 5 });
    expect(getActualDPS(s, 0)).toBe(0);
  });

  it("returns 0 for 0 attack speed", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 0 });
    expect(getActualDPS(s, 100)).toBe(0);
  });

  it("respects max attack speed cap", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 5, maxAttackSpeed: 8 });
    s = addBonusPercent(s, 2.0); // 5*3 = 15, capped at 8
    expect(getActualDPS(s, 10)).toBe(80);
  });
});

// ─── getAverageAttackSpeed ───

describe("getAverageAttackSpeed", () => {
  it("returns 0 when no time recorded", () => {
    const s = createAttackSpeedState();
    expect(getAverageAttackSpeed(s)).toBe(0);
  });

  it("calculates attacks per second", () => {
    let s = createAttackSpeedState();
    // 10 attacks in 5000ms = 2 attacks/sec
    for (let i = 0; i < 10; i++) {
      s = recordAttack(s, 500);
    }
    expect(getAverageAttackSpeed(s)).toBeCloseTo(2.0);
  });

  it("handles single attack", () => {
    const s = recordAttack(createAttackSpeedState(), 1000);
    expect(getAverageAttackSpeed(s)).toBeCloseTo(1.0);
  });

  it("handles fractional results", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 300);
    s = recordAttack(s, 300);
    s = recordAttack(s, 400);
    // 3 attacks / 1.0s = 3.0
    expect(getAverageAttackSpeed(s)).toBeCloseTo(3.0);
  });
});

// ─── resetStats ───

describe("resetStats", () => {
  it("zeroes totalAttacks and totalTime", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 100);
    s = recordAttack(s, 200);
    s = resetStats(s);
    expect(s.totalAttacks).toBe(0);
    expect(s.totalTime).toBe(0);
  });

  it("preserves config", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 3,
      scalingType: "linear",
    });
    s = recordAttack(s, 100);
    s = resetStats(s);
    expect(s.config.baseAttackSpeed).toBe(3);
    expect(s.config.scalingType).toBe("linear");
  });

  it("preserves bonuses", () => {
    let s = createAttackSpeedState();
    s = addBonusPercent(s, 0.5);
    s = addBonusFlat(s, 2);
    s = recordAttack(s, 100);
    s = resetStats(s);
    expect(s.bonusPercent).toBeCloseTo(0.5);
    expect(s.bonusFlat).toBe(2);
  });

  it("does not mutate original state", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 500);
    const before = s;
    resetStats(s);
    expect(before.totalAttacks).toBe(1);
  });
});

// ─── setScalingType ───

describe("setScalingType", () => {
  it("changes scaling type", () => {
    let s = createAttackSpeedState();
    s = setScalingType(s, "linear");
    expect(s.config.scalingType).toBe("linear");
  });

  it("changing scaling type changes effective speed calculation", () => {
    let base = createAttackSpeedState({ baseAttackSpeed: 2 });
    base = addBonusPercent(base, 1.0);

    const mult = getEffectiveAttackSpeed(base); // 2*(1+1) = 4
    const lin = getEffectiveAttackSpeed(setScalingType(base, "linear")); // 2 + 2*1 = 4 (same here)
    const dim = getEffectiveAttackSpeed(setScalingType(base, "diminishing")); // 2*(1+0.5) = 3

    expect(mult).toBeCloseTo(4);
    expect(lin).toBeCloseTo(4);
    expect(dim).toBeCloseTo(3);
  });

  it("does not mutate original state", () => {
    const original = createAttackSpeedState();
    setScalingType(original, "diminishing");
    expect(original.config.scalingType).toBe("multiplicative");
  });

  it("preserves bonuses and counters", () => {
    let s = createAttackSpeedState();
    s = addBonusPercent(s, 0.3);
    s = addBonusFlat(s, 1);
    s = recordAttack(s, 200);
    s = setScalingType(s, "diminishing");
    expect(s.bonusPercent).toBeCloseTo(0.3);
    expect(s.bonusFlat).toBe(1);
    expect(s.totalAttacks).toBe(1);
    expect(s.totalTime).toBe(200);
  });
});

// ─── getStats ───

describe("getStats", () => {
  it("returns all stat fields", () => {
    const s = createAttackSpeedState();
    const stats = getStats(s);
    expect(stats).toHaveProperty("effectiveSpeed");
    expect(stats).toHaveProperty("interval");
    expect(stats).toHaveProperty("totalAttacks");
    expect(stats).toHaveProperty("averageSpeed");
  });

  it("effectiveSpeed matches getEffectiveAttackSpeed", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 3 });
    s = addBonusPercent(s, 0.5);
    const stats = getStats(s);
    expect(stats.effectiveSpeed).toBeCloseTo(getEffectiveAttackSpeed(s));
  });

  it("interval matches getAttackInterval", () => {
    const s = createAttackSpeedState({ baseAttackSpeed: 4 });
    const stats = getStats(s);
    expect(stats.interval).toBe(250);
  });

  it("totalAttacks reflects recorded attacks", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 100);
    s = recordAttack(s, 100);
    expect(getStats(s).totalAttacks).toBe(2);
  });

  it("averageSpeed matches getAverageAttackSpeed", () => {
    let s = createAttackSpeedState();
    s = recordAttack(s, 500);
    s = recordAttack(s, 500);
    const stats = getStats(s);
    expect(stats.averageSpeed).toBeCloseTo(2.0);
  });
});

// ─── Integration / Edge cases ───

describe("integration and edge cases", () => {
  it("full workflow: create → bonus → attack → stats → reset", () => {
    let s = createAttackSpeedState({
      baseAttackSpeed: 2,
      scalingType: "multiplicative",
    });
    s = addBonusPercent(s, 0.5);
    s = addBonusFlat(s, 0.5);
    // effective = 2*1.5 + 0.5 = 3.5
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.5);
    expect(getAttackInterval(s)).toBeCloseTo(1000 / 3.5);

    s = recordAttack(s, 286);
    s = recordAttack(s, 286);
    expect(s.totalAttacks).toBe(2);

    s = resetStats(s);
    expect(s.totalAttacks).toBe(0);
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(3.5); // bonuses preserved
  });

  it("very high bonus percent capped by maxAttackSpeed", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 1, maxAttackSpeed: 5 });
    s = addBonusPercent(s, 100); // 1*101 = 101, capped at 5
    expect(getEffectiveAttackSpeed(s)).toBe(5);
  });

  it("negative flat bonus can reduce below base", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 2 });
    s = addBonusFlat(s, -1); // 2 + (-1) = 1
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(1);
  });

  it("combined negative bonuses can make speed negative", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 1 });
    s = addBonusPercent(s, -0.5);
    s = addBonusFlat(s, -1); // 1*0.5 + (-1) = -0.5
    expect(getEffectiveAttackSpeed(s)).toBeCloseTo(-0.5);
  });

  it("interval for negative speed returns Infinity (clamped by minAttackInterval)", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 1 });
    s = addBonusFlat(s, -5); // negative speed
    // 1000 / negative = negative, but Math.max with minAttackInterval=50
    const interval = getAttackInterval(s);
    expect(interval).toBeGreaterThanOrEqual(50);
  });

  it("switching scaling types mid-game preserves state", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 2 });
    s = addBonusPercent(s, 1.0);
    s = recordAttack(s, 200);

    const multSpeed = getEffectiveAttackSpeed(s); // 2*2 = 4
    s = setScalingType(s, "diminishing");
    const dimSpeed = getEffectiveAttackSpeed(s); // 2*(1+0.5) = 3

    expect(multSpeed).toBeCloseTo(4);
    expect(dimSpeed).toBeCloseTo(3);
    expect(s.totalAttacks).toBe(1);
  });

  it("DPS scales with both attack speed and damage", () => {
    let s = createAttackSpeedState({ baseAttackSpeed: 5 });
    s = addBonusPercent(s, 0.2); // 5*1.2 = 6
    expect(getActualDPS(s, 20)).toBeCloseTo(120);
  });

  it("minAttackInterval=0 allows very fast intervals", () => {
    const s = createAttackSpeedState({
      baseAttackSpeed: 10,
      minAttackInterval: 0,
      maxAttackSpeed: 1000,
    });
    expect(getAttackInterval(s)).toBe(100);
  });
});
