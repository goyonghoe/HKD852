import { describe, it, expect } from "vitest";
import {
  createCritState,
  getEffectiveCritChance,
  getEffectiveCritDamage,
  rollCrit,
  calculateCritDamage,
  addCritChanceBonus,
  addCritDamageBonus,
  removeCritChanceBonus,
  removeCritDamageBonus,
  getCritRate,
  getStreakBonus,
  resetStreaks,
  getCritTier,
  type CritState,
} from "../../src/core/CritCalc";

// ─── createCritState ──────────────────────────────────────────

describe("createCritState", () => {
  it("creates default state with 5% chance and 150% damage", () => {
    const s = createCritState();
    expect(s.baseCritChance).toBe(0.05);
    expect(s.baseCritDamage).toBe(1.5);
  });

  it("accepts custom base crit chance", () => {
    const s = createCritState(0.2);
    expect(s.baseCritChance).toBe(0.2);
    expect(s.baseCritDamage).toBe(1.5);
  });

  it("accepts custom base crit chance and damage", () => {
    const s = createCritState(0.1, 2.0);
    expect(s.baseCritChance).toBe(0.1);
    expect(s.baseCritDamage).toBe(2.0);
  });

  it("initializes all bonus and counters to zero", () => {
    const s = createCritState();
    expect(s.bonusCritChance).toBe(0);
    expect(s.bonusCritDamage).toBe(0);
    expect(s.consecutiveCrits).toBe(0);
    expect(s.consecutiveNonCrits).toBe(0);
    expect(s.totalCrits).toBe(0);
    expect(s.totalHits).toBe(0);
  });
});

// ─── getEffectiveCritChance ───────────────────────────────────

describe("getEffectiveCritChance", () => {
  it("returns base chance with no bonuses", () => {
    const s = createCritState(0.1);
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.1);
  });

  it("adds bonus to base", () => {
    const s = addCritChanceBonus(createCritState(0.1), 0.15);
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.25);
  });

  it("caps at 80%", () => {
    const s = addCritChanceBonus(createCritState(0.5), 0.5);
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.8);
  });

  it("includes pity bonus", () => {
    // 5 consecutive non-crits: 5-3=2 extra, 2*0.02=0.04 pity
    let s = createCritState(0.1);
    for (let i = 0; i < 5; i++) {
      const r = rollCrit(s, 1.0); // always miss
      s = r.state;
    }
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.1 + 0.04);
  });

  it("caps at 80% even with pity", () => {
    let s = addCritChanceBonus(createCritState(0.5), 0.25);
    // push pity up
    for (let i = 0; i < 13; i++) {
      const r = rollCrit(s, 1.0);
      s = r.state;
    }
    // 0.5 + 0.25 + 0.20 pity = 0.95, but capped at 0.8
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.8);
  });
});

// ─── getEffectiveCritDamage ───────────────────────────────────

describe("getEffectiveCritDamage", () => {
  it("returns base damage with no bonuses", () => {
    const s = createCritState(0.05, 1.5);
    expect(getEffectiveCritDamage(s)).toBeCloseTo(1.5);
  });

  it("adds bonus damage", () => {
    const s = addCritDamageBonus(createCritState(0.05, 1.5), 0.5);
    expect(getEffectiveCritDamage(s)).toBeCloseTo(2.0);
  });

  it("enforces minimum of 100%", () => {
    // base 0.5 + bonus -0.0 won't go below, but if base is low
    const s = createCritState(0.05, 0.8);
    expect(getEffectiveCritDamage(s)).toBeCloseTo(1.0);
  });

  it("has no upper cap", () => {
    const s = addCritDamageBonus(createCritState(0.05, 3.0), 5.0);
    expect(getEffectiveCritDamage(s)).toBeCloseTo(8.0);
  });
});

// ─── rollCrit ─────────────────────────────────────────────────

describe("rollCrit", () => {
  it("crits when roll < effective chance", () => {
    const s = createCritState(0.5);
    const result = rollCrit(s, 0.3);
    expect(result.isCrit).toBe(true);
  });

  it("does not crit when roll >= effective chance", () => {
    const s = createCritState(0.5);
    const result = rollCrit(s, 0.5);
    expect(result.isCrit).toBe(false);
  });

  it("does not crit when roll is exactly equal to chance", () => {
    const s = createCritState(0.2);
    const result = rollCrit(s, 0.2);
    expect(result.isCrit).toBe(false);
  });

  it("increments totalHits on crit", () => {
    const s = createCritState(0.5);
    const result = rollCrit(s, 0.1);
    expect(result.state.totalHits).toBe(1);
    expect(result.state.totalCrits).toBe(1);
  });

  it("increments totalHits on non-crit", () => {
    const s = createCritState(0.1);
    const result = rollCrit(s, 0.5);
    expect(result.state.totalHits).toBe(1);
    expect(result.state.totalCrits).toBe(0);
  });

  it("tracks consecutive crits", () => {
    let s = createCritState(0.9);
    s = rollCrit(s, 0.1).state; // crit
    s = rollCrit(s, 0.2).state; // crit
    s = rollCrit(s, 0.3).state; // crit
    expect(s.consecutiveCrits).toBe(3);
    expect(s.consecutiveNonCrits).toBe(0);
  });

  it("resets consecutive crits on miss", () => {
    let s = createCritState(0.9);
    s = rollCrit(s, 0.1).state; // crit
    s = rollCrit(s, 0.2).state; // crit
    s = rollCrit(s, 0.95).state; // miss
    expect(s.consecutiveCrits).toBe(0);
    expect(s.consecutiveNonCrits).toBe(1);
  });

  it("tracks consecutive non-crits", () => {
    let s = createCritState(0.05);
    s = rollCrit(s, 0.9).state;
    s = rollCrit(s, 0.8).state;
    s = rollCrit(s, 0.7).state;
    expect(s.consecutiveNonCrits).toBe(3);
  });

  it("resets consecutive non-crits on crit", () => {
    let s = createCritState(0.5);
    s = rollCrit(s, 0.9).state; // miss
    s = rollCrit(s, 0.8).state; // miss
    s = rollCrit(s, 0.1).state; // crit
    expect(s.consecutiveNonCrits).toBe(0);
    expect(s.consecutiveCrits).toBe(1);
  });

  it("does not mutate original state", () => {
    const s = createCritState();
    const result = rollCrit(s, 0.01);
    expect(s.totalHits).toBe(0);
    expect(result.state.totalHits).toBe(1);
  });

  it("pity system triggers crit after long miss streak", () => {
    // 5% base + 0 bonus. After 13 non-crits: pity = (13-3)*0.02 = 0.20
    // effective = 0.05 + 0.20 = 0.25
    let s = createCritState(0.05);
    for (let i = 0; i < 13; i++) {
      s = rollCrit(s, 1.0).state; // force miss (roll=1.0 always misses)
    }
    // Now roll=0.2 should crit (0.2 < 0.25)
    const result = rollCrit(s, 0.2);
    expect(result.isCrit).toBe(true);
  });
});

// ─── calculateCritDamage ──────────────────────────────────────

describe("calculateCritDamage", () => {
  it("applies crit multiplier to base damage", () => {
    const s = createCritState(0.5, 2.0);
    expect(calculateCritDamage(s, 100)).toBeCloseTo(200);
  });

  it("uses effective crit damage including bonuses", () => {
    const s = addCritDamageBonus(createCritState(0.05, 1.5), 0.5);
    expect(calculateCritDamage(s, 80)).toBeCloseTo(160); // 80 * 2.0
  });

  it("respects minimum 100% damage", () => {
    const s = createCritState(0.05, 0.5); // below min
    expect(calculateCritDamage(s, 100)).toBeCloseTo(100); // 100 * 1.0
  });

  it("works with zero base damage", () => {
    const s = createCritState(0.05, 2.0);
    expect(calculateCritDamage(s, 0)).toBe(0);
  });
});

// ─── addCritChanceBonus / removeCritChanceBonus ───────────────

describe("addCritChanceBonus", () => {
  it("adds bonus crit chance", () => {
    const s = addCritChanceBonus(createCritState(), 0.1);
    expect(s.bonusCritChance).toBeCloseTo(0.1);
  });

  it("stacks multiple bonuses", () => {
    let s = createCritState();
    s = addCritChanceBonus(s, 0.1);
    s = addCritChanceBonus(s, 0.15);
    expect(s.bonusCritChance).toBeCloseTo(0.25);
  });

  it("does not mutate original", () => {
    const original = createCritState();
    addCritChanceBonus(original, 0.1);
    expect(original.bonusCritChance).toBe(0);
  });
});

describe("removeCritChanceBonus", () => {
  it("removes bonus crit chance", () => {
    let s = addCritChanceBonus(createCritState(), 0.2);
    s = removeCritChanceBonus(s, 0.1);
    expect(s.bonusCritChance).toBeCloseTo(0.1);
  });

  it("floors at zero", () => {
    let s = addCritChanceBonus(createCritState(), 0.05);
    s = removeCritChanceBonus(s, 0.2);
    expect(s.bonusCritChance).toBe(0);
  });
});

// ─── addCritDamageBonus / removeCritDamageBonus ───────────────

describe("addCritDamageBonus", () => {
  it("adds bonus crit damage", () => {
    const s = addCritDamageBonus(createCritState(), 0.3);
    expect(s.bonusCritDamage).toBeCloseTo(0.3);
  });

  it("does not mutate original", () => {
    const original = createCritState();
    addCritDamageBonus(original, 0.5);
    expect(original.bonusCritDamage).toBe(0);
  });
});

describe("removeCritDamageBonus", () => {
  it("removes bonus crit damage", () => {
    let s = addCritDamageBonus(createCritState(), 0.5);
    s = removeCritDamageBonus(s, 0.3);
    expect(s.bonusCritDamage).toBeCloseTo(0.2);
  });

  it("floors at zero", () => {
    const s = removeCritDamageBonus(createCritState(), 1.0);
    expect(s.bonusCritDamage).toBe(0);
  });
});

// ─── getCritRate ──────────────────────────────────────────────

describe("getCritRate", () => {
  it("returns 0 when no hits", () => {
    expect(getCritRate(createCritState())).toBe(0);
  });

  it("returns correct rate after mixed hits", () => {
    let s = createCritState(0.5);
    s = rollCrit(s, 0.1).state; // crit
    s = rollCrit(s, 0.9).state; // miss
    s = rollCrit(s, 0.2).state; // crit
    s = rollCrit(s, 0.8).state; // miss
    expect(getCritRate(s)).toBeCloseTo(0.5);
  });

  it("returns 1.0 when all crits", () => {
    let s = createCritState(0.9);
    s = rollCrit(s, 0.1).state;
    s = rollCrit(s, 0.2).state;
    expect(getCritRate(s)).toBeCloseTo(1.0);
  });

  it("returns 0 when all misses", () => {
    let s = createCritState(0.05);
    s = rollCrit(s, 0.9).state;
    s = rollCrit(s, 0.8).state;
    expect(getCritRate(s)).toBeCloseTo(0);
  });
});

// ─── getStreakBonus ────────────────────────────────────────────

describe("getStreakBonus", () => {
  it("returns 0 with 0 consecutive non-crits", () => {
    expect(getStreakBonus(createCritState())).toBe(0);
  });

  it("returns 0 with exactly 3 consecutive non-crits", () => {
    let s = createCritState(0.01);
    for (let i = 0; i < 3; i++) s = rollCrit(s, 1.0).state;
    expect(getStreakBonus(s)).toBe(0);
  });

  it("returns 0.02 with 4 consecutive non-crits", () => {
    let s = createCritState(0.01);
    for (let i = 0; i < 4; i++) s = rollCrit(s, 1.0).state;
    expect(getStreakBonus(s)).toBeCloseTo(0.02);
  });

  it("returns 0.10 with 8 consecutive non-crits", () => {
    let s = createCritState(0.01);
    for (let i = 0; i < 8; i++) s = rollCrit(s, 1.0).state;
    expect(getStreakBonus(s)).toBeCloseTo(0.1);
  });

  it("caps at 0.20 (13+ consecutive non-crits)", () => {
    let s = createCritState(0.01);
    for (let i = 0; i < 13; i++) s = rollCrit(s, 1.0).state;
    expect(getStreakBonus(s)).toBeCloseTo(0.2);
  });

  it("does not exceed cap with 20 non-crits", () => {
    let s = createCritState(0.01);
    for (let i = 0; i < 20; i++) s = rollCrit(s, 1.0).state;
    expect(getStreakBonus(s)).toBeCloseTo(0.2);
  });

  it("resets after a crit", () => {
    let s = createCritState(0.5);
    for (let i = 0; i < 6; i++) s = rollCrit(s, 1.0).state; // 6 misses
    expect(getStreakBonus(s)).toBeCloseTo(0.06);
    s = rollCrit(s, 0.0).state; // crit resets streak
    expect(getStreakBonus(s)).toBe(0);
  });
});

// ─── resetStreaks ─────────────────────────────────────────────

describe("resetStreaks", () => {
  it("resets consecutive counters", () => {
    let s = createCritState(0.5);
    s = rollCrit(s, 0.1).state; // crit
    s = rollCrit(s, 0.1).state; // crit
    s = resetStreaks(s);
    expect(s.consecutiveCrits).toBe(0);
    expect(s.consecutiveNonCrits).toBe(0);
  });

  it("preserves total counters", () => {
    let s = createCritState(0.5);
    s = rollCrit(s, 0.1).state;
    s = rollCrit(s, 0.9).state;
    s = resetStreaks(s);
    expect(s.totalHits).toBe(2);
    expect(s.totalCrits).toBe(1);
  });

  it("preserves bonuses", () => {
    let s = addCritChanceBonus(createCritState(), 0.1);
    s = addCritDamageBonus(s, 0.2);
    s = resetStreaks(s);
    expect(s.bonusCritChance).toBeCloseTo(0.1);
    expect(s.bonusCritDamage).toBeCloseTo(0.2);
  });

  it("does not mutate original", () => {
    let s = createCritState(0.9);
    s = rollCrit(s, 0.1).state;
    const before = s;
    resetStreaks(s);
    expect(before.consecutiveCrits).toBe(1);
  });
});

// ─── getCritTier ──────────────────────────────────────────────

describe("getCritTier", () => {
  it('returns "none" for <5%', () => {
    const s = createCritState(0.03);
    expect(getCritTier(s)).toBe("none");
  });

  it('returns "low" for 5-15%', () => {
    const s = createCritState(0.1);
    expect(getCritTier(s)).toBe("low");
  });

  it('returns "medium" for 15-40%', () => {
    const s = addCritChanceBonus(createCritState(0.1), 0.1);
    expect(getCritTier(s)).toBe("medium");
  });

  it('returns "high" for 40-60%', () => {
    const s = addCritChanceBonus(createCritState(0.2), 0.3);
    expect(getCritTier(s)).toBe("high");
  });

  it('returns "hyper" for 60%+', () => {
    const s = addCritChanceBonus(createCritState(0.3), 0.4);
    expect(getCritTier(s)).toBe("hyper");
  });

  it('boundary: exactly 5% is "low"', () => {
    const s = createCritState(0.05);
    expect(getCritTier(s)).toBe("low");
  });

  it('boundary: exactly 15% is "medium"', () => {
    const s = createCritState(0.15);
    expect(getCritTier(s)).toBe("medium");
  });

  it('boundary: exactly 40% is "high"', () => {
    const s = createCritState(0.4);
    expect(getCritTier(s)).toBe("high");
  });

  it('boundary: exactly 60% is "hyper"', () => {
    const s = createCritState(0.6);
    expect(getCritTier(s)).toBe("hyper");
  });
});

// ─── Integration / edge cases ─────────────────────────────────

describe("integration", () => {
  it("full workflow: create → buff → roll → damage", () => {
    let s = createCritState(0.1, 2.0);
    s = addCritChanceBonus(s, 0.2); // 30% chance
    s = addCritDamageBonus(s, 0.5); // 250% damage

    const result = rollCrit(s, 0.15); // crit (0.15 < 0.30)
    expect(result.isCrit).toBe(true);

    const dmg = calculateCritDamage(result.state, 50);
    expect(dmg).toBeCloseTo(125); // 50 * 2.5
  });

  it("pity system feeds into rollCrit correctly", () => {
    let s = createCritState(0.05); // 5% base
    // Miss 8 times -> pity = (8-3)*0.02 = 0.10, effective = 0.15
    for (let i = 0; i < 8; i++) {
      s = rollCrit(s, 1.0).state;
    }
    expect(getEffectiveCritChance(s)).toBeCloseTo(0.15);
    // roll=0.14 should now crit
    const result = rollCrit(s, 0.14);
    expect(result.isCrit).toBe(true);
    // after crit, pity resets
    expect(getStreakBonus(result.state)).toBe(0);
  });

  it("removing more bonus than exists floors at 0", () => {
    let s = createCritState();
    s = addCritChanceBonus(s, 0.05);
    s = removeCritChanceBonus(s, 0.1);
    expect(s.bonusCritChance).toBe(0);

    s = addCritDamageBonus(s, 0.1);
    s = removeCritDamageBonus(s, 0.5);
    expect(s.bonusCritDamage).toBe(0);
  });

  it("roll=0 always crits (for any positive chance)", () => {
    const s = createCritState(0.01);
    expect(rollCrit(s, 0).isCrit).toBe(true);
  });

  it("roll=1.0 never crits (chance capped at 80%)", () => {
    const s = addCritChanceBonus(createCritState(0.5), 0.5);
    expect(rollCrit(s, 1.0).isCrit).toBe(false);
  });
});
