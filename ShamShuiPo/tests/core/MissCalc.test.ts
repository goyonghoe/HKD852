import { describe, it, expect } from "vitest";
import {
  createEvasionState,
  getEffectiveEvasion,
  rollEvasion,
  addBonusEvasion,
  getEvasionPercent,
  getDodgeRate,
  getStats,
  resetStats,
  applyDiminishing,
  setMaxEvasion,
} from "../../src/core/MissCalc";

// ─── createEvasionState ───

describe("createEvasionState", () => {
  it("returns default config when called with no args", () => {
    const s = createEvasionState();
    expect(s.config.baseEvasion).toBe(0.05);
    expect(s.config.maxEvasion).toBe(0.75);
    expect(s.config.evasionPerLevel).toBe(0.01);
    expect(s.config.diminishingFactor).toBe(0.8);
  });

  it("zeroes all counters", () => {
    const s = createEvasionState();
    expect(s.bonusEvasion).toBe(0);
    expect(s.totalDodges).toBe(0);
    expect(s.totalChecks).toBe(0);
    expect(s.consecutiveDodges).toBe(0);
    expect(s.maxConsecutiveDodges).toBe(0);
  });

  it("overrides baseEvasion via partial config", () => {
    const s = createEvasionState({ baseEvasion: 0.2 });
    expect(s.config.baseEvasion).toBe(0.2);
    expect(s.config.maxEvasion).toBe(0.75);
  });

  it("overrides maxEvasion via partial config", () => {
    const s = createEvasionState({ maxEvasion: 0.5 });
    expect(s.config.maxEvasion).toBe(0.5);
  });

  it("overrides evasionPerLevel via partial config", () => {
    const s = createEvasionState({ evasionPerLevel: 0.02 });
    expect(s.config.evasionPerLevel).toBe(0.02);
  });

  it("overrides diminishingFactor via partial config", () => {
    const s = createEvasionState({ diminishingFactor: 0.5 });
    expect(s.config.diminishingFactor).toBe(0.5);
  });

  it("accepts multiple overrides at once", () => {
    const s = createEvasionState({ baseEvasion: 0.1, maxEvasion: 0.9 });
    expect(s.config.baseEvasion).toBe(0.1);
    expect(s.config.maxEvasion).toBe(0.9);
    expect(s.config.evasionPerLevel).toBe(0.01);
  });

  it("returns a new object each time", () => {
    const a = createEvasionState();
    const b = createEvasionState();
    expect(a).not.toBe(b);
    expect(a.config).not.toBe(b.config);
  });
});

// ─── applyDiminishing ───

describe("applyDiminishing", () => {
  it("returns 0 when rawEvasion is 0", () => {
    expect(applyDiminishing(0, 0.8)).toBe(0);
  });

  it("returns 0 when factor is 0", () => {
    // (1 - 0)^0 = 1, so 1 - 1 = 0
    expect(applyDiminishing(0.5, 0)).toBe(0);
  });

  it("returns rawEvasion when factor is 1", () => {
    expect(applyDiminishing(0.3, 1)).toBeCloseTo(0.3);
  });

  it("applies diminishing returns with factor < 1", () => {
    const result = applyDiminishing(0.5, 0.8);
    // 1 - (1 - 0.5)^0.8 = 1 - 0.5^0.8
    const expected = 1 - Math.pow(0.5, 0.8);
    expect(result).toBeCloseTo(expected);
  });

  it("produces lower value with smaller factor", () => {
    const high = applyDiminishing(0.4, 0.9);
    const low = applyDiminishing(0.4, 0.5);
    expect(low).toBeLessThan(high);
  });

  it("approaches 1 as rawEvasion approaches 1", () => {
    const result = applyDiminishing(0.99, 0.8);
    expect(result).toBeGreaterThan(0.9);
  });

  it("is monotonically increasing with rawEvasion", () => {
    const a = applyDiminishing(0.2, 0.8);
    const b = applyDiminishing(0.4, 0.8);
    const c = applyDiminishing(0.6, 0.8);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

// ─── getEffectiveEvasion ───

describe("getEffectiveEvasion", () => {
  it("returns diminished baseEvasion at level 1", () => {
    const s = createEvasionState();
    const ev = getEffectiveEvasion(s, 1);
    const expected = applyDiminishing(0.05, 0.8);
    expect(ev).toBeCloseTo(expected);
  });

  it("defaults level to 1", () => {
    const s = createEvasionState();
    expect(getEffectiveEvasion(s)).toBe(getEffectiveEvasion(s, 1));
  });

  it("increases with player level", () => {
    const s = createEvasionState();
    const ev1 = getEffectiveEvasion(s, 1);
    const ev10 = getEffectiveEvasion(s, 10);
    expect(ev10).toBeGreaterThan(ev1);
  });

  it("includes bonusEvasion", () => {
    const s = addBonusEvasion(createEvasionState(), 0.1);
    const ev = getEffectiveEvasion(s, 1);
    const expected = applyDiminishing(0.05 + 0.1, 0.8);
    expect(ev).toBeCloseTo(expected);
  });

  it("caps at maxEvasion", () => {
    const s = createEvasionState({ baseEvasion: 0.9, maxEvasion: 0.75 });
    const ev = getEffectiveEvasion(s, 1);
    expect(ev).toBeLessThanOrEqual(0.75);
  });

  it("respects custom maxEvasion", () => {
    const s = createEvasionState({ baseEvasion: 0.5, maxEvasion: 0.3 });
    const ev = getEffectiveEvasion(s, 1);
    expect(ev).toBeLessThanOrEqual(0.3);
  });

  it("treats level < 1 as level 1", () => {
    const s = createEvasionState();
    expect(getEffectiveEvasion(s, 0)).toBe(getEffectiveEvasion(s, 1));
    expect(getEffectiveEvasion(s, -5)).toBe(getEffectiveEvasion(s, 1));
  });

  it("computes correctly at high levels", () => {
    const s = createEvasionState({ evasionPerLevel: 0.02 });
    const ev = getEffectiveEvasion(s, 50);
    // raw = 0.05 + 0.02*49 = 1.03, clamped to 1.0
    // applyDiminishing(1.0, 0.8) = 1.0, capped at maxEvasion 0.75
    expect(ev).toBe(0.75);
  });

  it("stacks bonusEvasion and level evasion", () => {
    const s = addBonusEvasion(createEvasionState(), 0.05);
    const ev = getEffectiveEvasion(s, 5);
    // raw = 0.05 + 0.05 + 0.01*4 = 0.14
    const expected = applyDiminishing(0.14, 0.8);
    expect(ev).toBeCloseTo(expected);
  });
});

// ─── rollEvasion ───

describe("rollEvasion", () => {
  it("dodges when rng returns 0 (below evasion)", () => {
    const s = createEvasionState();
    const { dodged } = rollEvasion(s, 1, () => 0);
    expect(dodged).toBe(true);
  });

  it("does not dodge when rng returns 0.99", () => {
    const s = createEvasionState();
    const { dodged } = rollEvasion(s, 1, () => 0.99);
    expect(dodged).toBe(false);
  });

  it("increments totalChecks on every call", () => {
    const s = createEvasionState();
    const { newState } = rollEvasion(s, 1, () => 0.99);
    expect(newState.totalChecks).toBe(1);
  });

  it("increments totalDodges on dodge", () => {
    const s = createEvasionState();
    const { newState } = rollEvasion(s, 1, () => 0);
    expect(newState.totalDodges).toBe(1);
  });

  it("does not increment totalDodges on miss", () => {
    const s = createEvasionState();
    const { newState } = rollEvasion(s, 1, () => 0.99);
    expect(newState.totalDodges).toBe(0);
  });

  it("tracks consecutiveDodges", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    expect(s.consecutiveDodges).toBe(1);
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    expect(s.consecutiveDodges).toBe(2);
  });

  it("resets consecutiveDodges on hit", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    expect(s.consecutiveDodges).toBe(0);
  });

  it("tracks maxConsecutiveDodges", () => {
    let s = createEvasionState();
    // 3 dodges, then a hit, then 2 dodges
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    expect(s.maxConsecutiveDodges).toBe(3);
  });

  it("does not mutate the original state", () => {
    const s = createEvasionState();
    rollEvasion(s, 1, () => 0);
    expect(s.totalChecks).toBe(0);
    expect(s.totalDodges).toBe(0);
  });

  it("defaults level to 1", () => {
    const s = createEvasionState();
    const a = rollEvasion(s, undefined, () => 0.5);
    const b = rollEvasion(s, 1, () => 0.5);
    expect(a.dodged).toBe(b.dodged);
  });

  it("accumulates across multiple rolls", () => {
    let s = createEvasionState();
    for (let i = 0; i < 10; i++) {
      ({ newState: s } = rollEvasion(s, 1, () => 0));
    }
    expect(s.totalChecks).toBe(10);
    expect(s.totalDodges).toBe(10);
  });
});

// ─── addBonusEvasion ───

describe("addBonusEvasion", () => {
  it("adds positive bonus", () => {
    const s = addBonusEvasion(createEvasionState(), 0.1);
    expect(s.bonusEvasion).toBe(0.1);
  });

  it("stacks multiple bonuses", () => {
    let s = createEvasionState();
    s = addBonusEvasion(s, 0.1);
    s = addBonusEvasion(s, 0.05);
    expect(s.bonusEvasion).toBeCloseTo(0.15);
  });

  it("allows negative bonus (debuff)", () => {
    const s = addBonusEvasion(createEvasionState(), -0.03);
    expect(s.bonusEvasion).toBe(-0.03);
  });

  it("does not mutate original state", () => {
    const orig = createEvasionState();
    addBonusEvasion(orig, 0.1);
    expect(orig.bonusEvasion).toBe(0);
  });

  it("preserves counters", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    s = addBonusEvasion(s, 0.1);
    expect(s.totalDodges).toBe(1);
    expect(s.totalChecks).toBe(1);
  });
});

// ─── getEvasionPercent ───

describe("getEvasionPercent", () => {
  it("returns effective evasion times 100", () => {
    const s = createEvasionState();
    const pct = getEvasionPercent(s, 1);
    const ev = getEffectiveEvasion(s, 1);
    expect(pct).toBeCloseTo(ev * 100);
  });

  it("defaults level to 1", () => {
    const s = createEvasionState();
    expect(getEvasionPercent(s)).toBe(getEvasionPercent(s, 1));
  });

  it("increases with level", () => {
    const s = createEvasionState();
    expect(getEvasionPercent(s, 10)).toBeGreaterThan(getEvasionPercent(s, 1));
  });

  it("is capped at maxEvasion * 100", () => {
    const s = createEvasionState({ baseEvasion: 0.9, maxEvasion: 0.5 });
    expect(getEvasionPercent(s, 1)).toBeLessThanOrEqual(50);
  });
});

// ─── getDodgeRate ───

describe("getDodgeRate", () => {
  it("returns 0 when no checks", () => {
    const s = createEvasionState();
    expect(getDodgeRate(s)).toBe(0);
  });

  it("returns 1.0 when all dodges", () => {
    let s = createEvasionState();
    for (let i = 0; i < 5; i++) {
      ({ newState: s } = rollEvasion(s, 1, () => 0));
    }
    expect(getDodgeRate(s)).toBe(1);
  });

  it("returns 0 when no dodges", () => {
    let s = createEvasionState();
    for (let i = 0; i < 5; i++) {
      ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    }
    expect(getDodgeRate(s)).toBe(0);
  });

  it("returns correct ratio for mixed results", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    expect(getDodgeRate(s)).toBeCloseTo(0.5);
  });
});

// ─── getStats ───

describe("getStats", () => {
  it("returns all zero stats for fresh state", () => {
    const stats = getStats(createEvasionState());
    expect(stats.totalDodges).toBe(0);
    expect(stats.totalChecks).toBe(0);
    expect(stats.dodgeRate).toBe(0);
    expect(stats.consecutiveDodges).toBe(0);
    expect(stats.maxConsecutiveDodges).toBe(0);
  });

  it("reflects state after rolls", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    const stats = getStats(s);
    expect(stats.totalDodges).toBe(2);
    expect(stats.totalChecks).toBe(3);
    expect(stats.dodgeRate).toBeCloseTo(2 / 3);
    expect(stats.consecutiveDodges).toBe(0);
    expect(stats.maxConsecutiveDodges).toBe(2);
  });

  it("returns dodgeRate consistent with getDodgeRate", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0.99));
    expect(getStats(s).dodgeRate).toBe(getDodgeRate(s));
  });
});

// ─── resetStats ───

describe("resetStats", () => {
  it("zeroes all counters", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    s = resetStats(s);
    expect(s.totalDodges).toBe(0);
    expect(s.totalChecks).toBe(0);
    expect(s.consecutiveDodges).toBe(0);
    expect(s.maxConsecutiveDodges).toBe(0);
  });

  it("preserves config", () => {
    const s = createEvasionState({ baseEvasion: 0.2 });
    const r = resetStats(s);
    expect(r.config.baseEvasion).toBe(0.2);
  });

  it("preserves bonusEvasion", () => {
    let s = addBonusEvasion(createEvasionState(), 0.1);
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    s = resetStats(s);
    expect(s.bonusEvasion).toBe(0.1);
  });

  it("does not mutate original state", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    const orig = s;
    resetStats(s);
    expect(orig.totalDodges).toBe(1);
  });
});

// ─── setMaxEvasion ───

describe("setMaxEvasion", () => {
  it("updates maxEvasion in config", () => {
    const s = setMaxEvasion(createEvasionState(), 0.5);
    expect(s.config.maxEvasion).toBe(0.5);
  });

  it("does not mutate original state", () => {
    const orig = createEvasionState();
    setMaxEvasion(orig, 0.5);
    expect(orig.config.maxEvasion).toBe(0.75);
  });

  it("affects getEffectiveEvasion cap", () => {
    const s = setMaxEvasion(createEvasionState({ baseEvasion: 0.8 }), 0.3);
    expect(getEffectiveEvasion(s, 1)).toBeLessThanOrEqual(0.3);
  });

  it("preserves other config values", () => {
    const s = setMaxEvasion(createEvasionState({ baseEvasion: 0.2 }), 0.6);
    expect(s.config.baseEvasion).toBe(0.2);
    expect(s.config.evasionPerLevel).toBe(0.01);
  });

  it("preserves state counters", () => {
    let s = createEvasionState();
    ({ newState: s } = rollEvasion(s, 1, () => 0));
    s = setMaxEvasion(s, 0.5);
    expect(s.totalDodges).toBe(1);
    expect(s.totalChecks).toBe(1);
  });
});

// ─── Integration / edge cases ───

describe("integration and edge cases", () => {
  it("full flow: create → bonus → roll → stats → reset", () => {
    let s = createEvasionState({ baseEvasion: 0.1 });
    s = addBonusEvasion(s, 0.05);
    ({ newState: s } = rollEvasion(s, 5, () => 0));
    ({ newState: s } = rollEvasion(s, 5, () => 0.99));
    const stats = getStats(s);
    expect(stats.totalChecks).toBe(2);
    expect(stats.totalDodges).toBe(1);
    s = resetStats(s);
    expect(getStats(s).totalChecks).toBe(0);
    expect(s.bonusEvasion).toBe(0.05);
  });

  it("zero evasion config never dodges", () => {
    const s = createEvasionState({ baseEvasion: 0, evasionPerLevel: 0 });
    const ev = getEffectiveEvasion(s, 100);
    expect(ev).toBe(0);
    const { dodged } = rollEvasion(s, 100, () => 0.001);
    expect(dodged).toBe(false);
  });

  it("maxEvasion of 0 prevents all dodges", () => {
    const s = createEvasionState({ baseEvasion: 0.5, maxEvasion: 0 });
    const ev = getEffectiveEvasion(s, 1);
    expect(ev).toBe(0);
  });

  it("very high level still capped", () => {
    const s = createEvasionState();
    const ev = getEffectiveEvasion(s, 9999);
    expect(ev).toBeLessThanOrEqual(0.75);
  });

  it("diminishingFactor of 1 means no diminishing", () => {
    const s = createEvasionState({
      baseEvasion: 0.3,
      diminishingFactor: 1,
      maxEvasion: 1,
    });
    const ev = getEffectiveEvasion(s, 1);
    expect(ev).toBeCloseTo(0.3);
  });

  it("multiple setMaxEvasion calls chain correctly", () => {
    let s = createEvasionState();
    s = setMaxEvasion(s, 0.4);
    s = setMaxEvasion(s, 0.2);
    expect(s.config.maxEvasion).toBe(0.2);
    expect(getEffectiveEvasion(s, 100)).toBeLessThanOrEqual(0.2);
  });
});
