import { describe, it, expect } from "vitest";
import {
  createLuckState,
  getEffectiveLuck,
  getDropRateBonus,
  getCritBonus,
  rollLuck,
  addBonusLuck,
  getUpgradeQualityBonus,
  getLuckPercent,
  getStats,
  resetStats,
} from "../../src/core/LuckCalc";

// ─── createLuckState ──────────────────────────────────────────

describe("createLuckState", () => {
  it("creates state with all default config values", () => {
    const s = createLuckState();
    expect(s.config.baseLuck).toBe(10);
    expect(s.config.luckPerLevel).toBe(2);
    expect(s.config.maxLuck).toBe(100);
    expect(s.config.dropRateMultiplier).toBe(0.01);
    expect(s.config.critBonusMultiplier).toBe(0.005);
  });

  it("initializes counters to zero", () => {
    const s = createLuckState();
    expect(s.bonusLuck).toBe(0);
    expect(s.totalRolls).toBe(0);
    expect(s.luckyRolls).toBe(0);
  });

  it("accepts partial config overrides", () => {
    const s = createLuckState({ baseLuck: 20, maxLuck: 200 });
    expect(s.config.baseLuck).toBe(20);
    expect(s.config.maxLuck).toBe(200);
    expect(s.config.luckPerLevel).toBe(2); // default preserved
  });

  it("accepts single config override", () => {
    const s = createLuckState({ dropRateMultiplier: 0.05 });
    expect(s.config.dropRateMultiplier).toBe(0.05);
    expect(s.config.baseLuck).toBe(10);
  });

  it("accepts all config overrides", () => {
    const s = createLuckState({
      baseLuck: 5,
      luckPerLevel: 1,
      maxLuck: 50,
      dropRateMultiplier: 0.02,
      critBonusMultiplier: 0.01,
    });
    expect(s.config.baseLuck).toBe(5);
    expect(s.config.luckPerLevel).toBe(1);
    expect(s.config.maxLuck).toBe(50);
    expect(s.config.dropRateMultiplier).toBe(0.02);
    expect(s.config.critBonusMultiplier).toBe(0.01);
  });

  it("accepts empty partial config", () => {
    const s = createLuckState({});
    expect(s.config.baseLuck).toBe(10);
  });
});

// ─── getEffectiveLuck ─────────────────────────────────────────

describe("getEffectiveLuck", () => {
  it("returns baseLuck at level 1 with no bonus", () => {
    const s = createLuckState();
    expect(getEffectiveLuck(s)).toBe(10);
  });

  it("defaults level to 1", () => {
    const s = createLuckState();
    expect(getEffectiveLuck(s)).toBe(getEffectiveLuck(s, 1));
  });

  it("adds luckPerLevel for each level above 1", () => {
    const s = createLuckState(); // baseLuck=10, luckPerLevel=2
    expect(getEffectiveLuck(s, 5)).toBe(10 + 2 * 4); // 18
  });

  it("includes bonusLuck", () => {
    const s = addBonusLuck(createLuckState(), 15);
    expect(getEffectiveLuck(s, 1)).toBe(25); // 10 + 15
  });

  it("combines base + bonus + level scaling", () => {
    const s = addBonusLuck(createLuckState(), 10);
    // 10 base + 10 bonus + 2*(3-1) = 24
    expect(getEffectiveLuck(s, 3)).toBe(24);
  });

  it("caps at maxLuck", () => {
    const s = addBonusLuck(createLuckState(), 200);
    expect(getEffectiveLuck(s, 50)).toBe(100); // capped at maxLuck
  });

  it("caps at maxLuck with high level", () => {
    const s = createLuckState(); // baseLuck=10, luckPerLevel=2, maxLuck=100
    // 10 + 2*(100-1) = 208, capped at 100
    expect(getEffectiveLuck(s, 100)).toBe(100);
  });

  it("returns baseLuck at level 1 with zero luckPerLevel", () => {
    const s = createLuckState({ luckPerLevel: 0 });
    expect(getEffectiveLuck(s, 10)).toBe(10);
  });

  it("handles custom maxLuck cap", () => {
    const s = createLuckState({ maxLuck: 50 });
    expect(getEffectiveLuck(addBonusLuck(s, 100), 1)).toBe(50);
  });
});

// ─── getDropRateBonus ─────────────────────────────────────────

describe("getDropRateBonus", () => {
  it("returns effectiveLuck * dropRateMultiplier at level 1", () => {
    const s = createLuckState(); // luck=10, multiplier=0.01
    expect(getDropRateBonus(s)).toBeCloseTo(0.1); // 10 * 0.01
  });

  it("scales with level", () => {
    const s = createLuckState(); // luck at level 6 = 10 + 2*5 = 20
    expect(getDropRateBonus(s, 6)).toBeCloseTo(0.2); // 20 * 0.01
  });

  it("includes bonus luck", () => {
    const s = addBonusLuck(createLuckState(), 10); // luck = 20
    expect(getDropRateBonus(s)).toBeCloseTo(0.2);
  });

  it("respects maxLuck cap", () => {
    const s = addBonusLuck(createLuckState(), 200); // capped at 100
    expect(getDropRateBonus(s)).toBeCloseTo(1.0); // 100 * 0.01
  });

  it("uses custom dropRateMultiplier", () => {
    const s = createLuckState({ dropRateMultiplier: 0.05 });
    expect(getDropRateBonus(s)).toBeCloseTo(0.5); // 10 * 0.05
  });
});

// ─── getCritBonus ─────────────────────────────────────────────

describe("getCritBonus", () => {
  it("returns effectiveLuck * critBonusMultiplier at level 1", () => {
    const s = createLuckState(); // luck=10, multiplier=0.005
    expect(getCritBonus(s)).toBeCloseTo(0.05); // 10 * 0.005
  });

  it("scales with level", () => {
    const s = createLuckState(); // luck at level 11 = 10 + 2*10 = 30
    expect(getCritBonus(s, 11)).toBeCloseTo(0.15); // 30 * 0.005
  });

  it("includes bonus luck", () => {
    const s = addBonusLuck(createLuckState(), 30); // luck = 40
    expect(getCritBonus(s)).toBeCloseTo(0.2); // 40 * 0.005
  });

  it("respects maxLuck cap", () => {
    const s = addBonusLuck(createLuckState(), 200); // capped at 100
    expect(getCritBonus(s)).toBeCloseTo(0.5); // 100 * 0.005
  });

  it("uses custom critBonusMultiplier", () => {
    const s = createLuckState({ critBonusMultiplier: 0.01 });
    expect(getCritBonus(s)).toBeCloseTo(0.1); // 10 * 0.01
  });
});

// ─── rollLuck ─────────────────────────────────────────────────

describe("rollLuck", () => {
  it("succeeds when rng returns value below modified chance", () => {
    const s = createLuckState(); // dropRateBonus = 0.1
    const result = rollLuck(s, 0.2, 1, () => 0.25); // 0.2 + 0.1 = 0.3, roll 0.25 < 0.3
    expect(result.success).toBe(true);
  });

  it("fails when rng returns value >= modified chance", () => {
    const s = createLuckState(); // dropRateBonus = 0.1
    const result = rollLuck(s, 0.2, 1, () => 0.5); // 0.2 + 0.1 = 0.3, roll 0.5 >= 0.3
    expect(result.success).toBe(false);
  });

  it("increments totalRolls on success", () => {
    const s = createLuckState();
    const { newState } = rollLuck(s, 1.0, 1, () => 0.0); // guaranteed success
    expect(newState.totalRolls).toBe(1);
    expect(newState.luckyRolls).toBe(1);
  });

  it("increments totalRolls on failure", () => {
    const s = createLuckState();
    const { newState } = rollLuck(s, 0.0, 1, () => 0.5); // baseChance=0, bonus=0.1, roll=0.5
    expect(newState.totalRolls).toBe(1);
    expect(newState.luckyRolls).toBe(0);
  });

  it("does not mutate original state", () => {
    const s = createLuckState();
    rollLuck(s, 0.5, 1, () => 0.1);
    expect(s.totalRolls).toBe(0);
    expect(s.luckyRolls).toBe(0);
  });

  it("accumulates rolls across multiple calls", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState; // success
    s = rollLuck(s, 0.0, 1, () => 0.99).newState; // fail (0+0.1=0.1, 0.99>=0.1)
    s = rollLuck(s, 1.0, 1, () => 0.0).newState; // success
    expect(s.totalRolls).toBe(3);
    expect(s.luckyRolls).toBe(2);
  });

  it("uses level to compute drop rate bonus", () => {
    const s = createLuckState(); // level 6: luck=20, bonus=0.2
    // baseChance=0.05 + 0.2 = 0.25, roll=0.2 < 0.25
    const result = rollLuck(s, 0.05, 6, () => 0.2);
    expect(result.success).toBe(true);
  });

  it("defaults level to 1", () => {
    const s = createLuckState(); // luck=10, bonus=0.1
    // baseChance=0.05 + 0.1 = 0.15, roll=0.1 < 0.15
    const result = rollLuck(s, 0.05, undefined, () => 0.1);
    expect(result.success).toBe(true);
  });

  it("uses Math.random by default (no rng provided)", () => {
    const s = createLuckState();
    // Just verify it doesn't throw and returns valid structure
    const result = rollLuck(s, 0.5);
    expect(typeof result.success).toBe("boolean");
    expect(result.newState.totalRolls).toBe(1);
  });

  it("boundary: roll exactly equal to modified chance fails", () => {
    const s = createLuckState({ baseLuck: 0, luckPerLevel: 0 }); // dropRateBonus=0
    // baseChance=0.5 + 0 = 0.5, roll=0.5 is NOT < 0.5
    const result = rollLuck(s, 0.5, 1, () => 0.5);
    expect(result.success).toBe(false);
  });

  it("roll=0 always succeeds with any positive modified chance", () => {
    const s = createLuckState(); // dropRateBonus = 0.1
    const result = rollLuck(s, 0.0, 1, () => 0.0); // 0 + 0.1 = 0.1, 0 < 0.1
    expect(result.success).toBe(true);
  });

  it("preserves config in newState", () => {
    const s = createLuckState({ baseLuck: 50 });
    const { newState } = rollLuck(s, 0.5, 1, () => 0.1);
    expect(newState.config.baseLuck).toBe(50);
  });

  it("preserves bonusLuck in newState", () => {
    const s = addBonusLuck(createLuckState(), 25);
    const { newState } = rollLuck(s, 0.5, 1, () => 0.1);
    expect(newState.bonusLuck).toBe(25);
  });
});

// ─── addBonusLuck ─────────────────────────────────────────────

describe("addBonusLuck", () => {
  it("adds bonus luck", () => {
    const s = addBonusLuck(createLuckState(), 15);
    expect(s.bonusLuck).toBe(15);
  });

  it("stacks multiple bonuses", () => {
    let s = createLuckState();
    s = addBonusLuck(s, 10);
    s = addBonusLuck(s, 5);
    expect(s.bonusLuck).toBe(15);
  });

  it("does not mutate original state", () => {
    const original = createLuckState();
    addBonusLuck(original, 20);
    expect(original.bonusLuck).toBe(0);
  });

  it("accepts negative bonus (debuff)", () => {
    const s = addBonusLuck(createLuckState(), -5);
    expect(s.bonusLuck).toBe(-5);
  });

  it("preserves config and counters", () => {
    let s = createLuckState({ baseLuck: 20 });
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = addBonusLuck(s, 10);
    expect(s.config.baseLuck).toBe(20);
    expect(s.totalRolls).toBe(1);
    expect(s.luckyRolls).toBe(1);
  });
});

// ─── getUpgradeQualityBonus ───────────────────────────────────

describe("getUpgradeQualityBonus", () => {
  it("returns normalized luck at level 1", () => {
    const s = createLuckState(); // luck=10, maxLuck=100
    expect(getUpgradeQualityBonus(s)).toBeCloseTo(0.1); // 10/100
  });

  it("scales with level", () => {
    const s = createLuckState(); // level 6: luck=20
    expect(getUpgradeQualityBonus(s, 6)).toBeCloseTo(0.2); // 20/100
  });

  it("returns 1.0 at maxLuck", () => {
    const s = addBonusLuck(createLuckState(), 90); // luck=100=maxLuck
    expect(getUpgradeQualityBonus(s)).toBeCloseTo(1.0);
  });

  it("caps at 1.0 when luck exceeds maxLuck", () => {
    const s = addBonusLuck(createLuckState(), 200);
    expect(getUpgradeQualityBonus(s)).toBeCloseTo(1.0);
  });

  it("uses custom maxLuck for normalization", () => {
    const s = createLuckState({ maxLuck: 50 }); // luck=10, maxLuck=50
    expect(getUpgradeQualityBonus(s)).toBeCloseTo(0.2); // 10/50
  });
});

// ─── getLuckPercent ────────────────────────────────────────────

describe("getLuckPercent", () => {
  it("returns percentage of effective luck relative to max", () => {
    const s = createLuckState(); // luck=10, maxLuck=100
    expect(getLuckPercent(s)).toBeCloseTo(10); // 10%
  });

  it("scales with level", () => {
    const s = createLuckState(); // level 11: luck=30
    expect(getLuckPercent(s, 11)).toBeCloseTo(30);
  });

  it("returns 100 at maxLuck", () => {
    const s = addBonusLuck(createLuckState(), 90);
    expect(getLuckPercent(s)).toBeCloseTo(100);
  });

  it("caps at 100 when luck exceeds maxLuck", () => {
    const s = addBonusLuck(createLuckState(), 200);
    expect(getLuckPercent(s)).toBeCloseTo(100);
  });

  it("includes bonus luck", () => {
    const s = addBonusLuck(createLuckState(), 40); // luck=50
    expect(getLuckPercent(s)).toBeCloseTo(50);
  });
});

// ─── getStats ─────────────────────────────────────────────────

describe("getStats", () => {
  it("returns zero stats for fresh state", () => {
    const stats = getStats(createLuckState());
    expect(stats.totalRolls).toBe(0);
    expect(stats.luckyRolls).toBe(0);
    expect(stats.luckRate).toBe(0);
  });

  it("returns correct stats after rolls", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState; // success
    s = rollLuck(s, 0.0, 1, () => 0.99).newState; // fail
    s = rollLuck(s, 1.0, 1, () => 0.0).newState; // success
    const stats = getStats(s);
    expect(stats.totalRolls).toBe(3);
    expect(stats.luckyRolls).toBe(2);
    expect(stats.luckRate).toBeCloseTo(2 / 3);
  });

  it("returns luckRate=0 with zero rolls", () => {
    expect(getStats(createLuckState()).luckRate).toBe(0);
  });

  it("returns luckRate=1.0 when all rolls succeed", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    expect(getStats(s).luckRate).toBeCloseTo(1.0);
  });

  it("returns luckRate=0 when all rolls fail", () => {
    let s = createLuckState({ baseLuck: 0, luckPerLevel: 0 });
    s = rollLuck(s, 0.0, 1, () => 0.5).newState;
    s = rollLuck(s, 0.0, 1, () => 0.5).newState;
    expect(getStats(s).luckRate).toBeCloseTo(0);
  });
});

// ─── resetStats ───────────────────────────────────────────────

describe("resetStats", () => {
  it("resets totalRolls and luckyRolls to zero", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = resetStats(s);
    expect(s.totalRolls).toBe(0);
    expect(s.luckyRolls).toBe(0);
  });

  it("preserves config", () => {
    let s = createLuckState({ baseLuck: 50 });
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = resetStats(s);
    expect(s.config.baseLuck).toBe(50);
  });

  it("preserves bonusLuck", () => {
    let s = addBonusLuck(createLuckState(), 30);
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = resetStats(s);
    expect(s.bonusLuck).toBe(30);
  });

  it("does not mutate original state", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    const before = s;
    resetStats(s);
    expect(before.totalRolls).toBe(1);
  });

  it("getStats returns zeroes after reset", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = resetStats(s);
    const stats = getStats(s);
    expect(stats.totalRolls).toBe(0);
    expect(stats.luckyRolls).toBe(0);
    expect(stats.luckRate).toBe(0);
  });
});

// ─── Integration / Edge Cases ─────────────────────────────────

describe("integration", () => {
  it("full workflow: create → buff → roll → check stats", () => {
    let s = createLuckState({ baseLuck: 5, maxLuck: 50 });
    s = addBonusLuck(s, 10); // luck = 15
    // dropRateBonus = 15 * 0.01 = 0.15
    const { newState, success } = rollLuck(s, 0.3, 1, () => 0.4);
    // modifiedChance = 0.3 + 0.15 = 0.45, roll=0.4 < 0.45 → success
    expect(success).toBe(true);
    expect(newState.totalRolls).toBe(1);
    expect(newState.luckyRolls).toBe(1);
  });

  it("luck scaling across many levels", () => {
    const s = createLuckState(); // baseLuck=10, luckPerLevel=2
    // Level 46: 10 + 2*45 = 100 = maxLuck
    expect(getEffectiveLuck(s, 46)).toBe(100);
    // Level 47 should still be capped
    expect(getEffectiveLuck(s, 47)).toBe(100);
  });

  it("drop rate and crit bonus are consistent with effective luck", () => {
    const s = addBonusLuck(createLuckState(), 20); // luck=30
    const luck = getEffectiveLuck(s, 1);
    expect(getDropRateBonus(s, 1)).toBeCloseTo(luck * 0.01);
    expect(getCritBonus(s, 1)).toBeCloseTo(luck * 0.005);
  });

  it("upgrade quality matches luck percent / 100", () => {
    const s = createLuckState();
    const pct = getLuckPercent(s, 5);
    const quality = getUpgradeQualityBonus(s, 5);
    expect(quality).toBeCloseTo(pct / 100);
  });

  it("zero baseLuck with bonus still works", () => {
    const s = addBonusLuck(createLuckState({ baseLuck: 0 }), 25);
    expect(getEffectiveLuck(s)).toBe(25);
  });

  it("negative bonusLuck reduces effective luck", () => {
    const s = addBonusLuck(createLuckState(), -5); // 10 - 5 = 5
    expect(getEffectiveLuck(s)).toBe(5);
  });

  it("very high luckPerLevel is still capped", () => {
    const s = createLuckState({ luckPerLevel: 50 });
    expect(getEffectiveLuck(s, 10)).toBe(100); // 10 + 50*9 = 460, capped at 100
  });

  it("reset then roll again works correctly", () => {
    let s = createLuckState();
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    s = resetStats(s);
    s = rollLuck(s, 1.0, 1, () => 0.0).newState;
    expect(s.totalRolls).toBe(1);
    expect(s.luckyRolls).toBe(1);
  });
});
