import { describe, it, expect } from "vitest";
import {
  createArmorState,
  getEffectiveArmor,
  getArmorReduction,
  getTotalPercentReduction,
  calculateDamageAfterArmor,
  applyDamage,
  addBonusArmor,
  addFlatReduction,
  addPercentReduction,
  getStats,
  resetStats,
} from "../../src/core/ArmorCalc";

// ─── createArmorState ─────────────────────────────────────────

describe("createArmorState", () => {
  it("creates default state with correct config values", () => {
    const s = createArmorState();
    expect(s.config.baseArmor).toBe(5);
    expect(s.config.armorPerLevel).toBe(1);
    expect(s.config.flatReduction).toBe(2);
    expect(s.config.percentReduction).toBe(0.05);
    expect(s.config.maxPercentReduction).toBe(0.8);
  });

  it("initializes all bonus fields to zero", () => {
    const s = createArmorState();
    expect(s.bonusArmor).toBe(0);
    expect(s.bonusFlatReduction).toBe(0);
    expect(s.bonusPercentReduction).toBe(0);
  });

  it("initializes counters to zero", () => {
    const s = createArmorState();
    expect(s.totalDamageBlocked).toBe(0);
    expect(s.hitsReceived).toBe(0);
  });

  it("accepts partial config override for baseArmor", () => {
    const s = createArmorState({ baseArmor: 20 });
    expect(s.config.baseArmor).toBe(20);
    expect(s.config.armorPerLevel).toBe(1);
  });

  it("accepts partial config override for armorPerLevel", () => {
    const s = createArmorState({ armorPerLevel: 3 });
    expect(s.config.armorPerLevel).toBe(3);
    expect(s.config.baseArmor).toBe(5);
  });

  it("accepts partial config override for flatReduction", () => {
    const s = createArmorState({ flatReduction: 10 });
    expect(s.config.flatReduction).toBe(10);
  });

  it("accepts partial config override for percentReduction", () => {
    const s = createArmorState({ percentReduction: 0.2 });
    expect(s.config.percentReduction).toBe(0.2);
  });

  it("accepts partial config override for maxPercentReduction", () => {
    const s = createArmorState({ maxPercentReduction: 0.5 });
    expect(s.config.maxPercentReduction).toBe(0.5);
  });

  it("accepts full config override", () => {
    const s = createArmorState({
      baseArmor: 10,
      armorPerLevel: 2,
      flatReduction: 5,
      percentReduction: 0.1,
      maxPercentReduction: 0.6,
    });
    expect(s.config.baseArmor).toBe(10);
    expect(s.config.armorPerLevel).toBe(2);
    expect(s.config.flatReduction).toBe(5);
    expect(s.config.percentReduction).toBe(0.1);
    expect(s.config.maxPercentReduction).toBe(0.6);
  });

  it("returns a new object each call", () => {
    const a = createArmorState();
    const b = createArmorState();
    expect(a).not.toBe(b);
    expect(a.config).not.toBe(b.config);
  });
});

// ─── getEffectiveArmor ────────────────────────────────────────

describe("getEffectiveArmor", () => {
  it("returns baseArmor at level 1", () => {
    const s = createArmorState();
    expect(getEffectiveArmor(s)).toBe(5);
  });

  it("defaults level to 1 when omitted", () => {
    const s = createArmorState();
    expect(getEffectiveArmor(s)).toBe(getEffectiveArmor(s, 1));
  });

  it("scales armor with level", () => {
    const s = createArmorState();
    expect(getEffectiveArmor(s, 5)).toBe(5 + 1 * 4);
  });

  it("includes bonusArmor", () => {
    const s = addBonusArmor(createArmorState(), 10);
    expect(getEffectiveArmor(s)).toBe(5 + 10);
  });

  it("combines base + bonus + level scaling", () => {
    const s = addBonusArmor(
      createArmorState({ baseArmor: 10, armorPerLevel: 2 }),
      5,
    );
    expect(getEffectiveArmor(s, 3)).toBe(10 + 5 + 2 * 2);
  });

  it("handles level 1 with no scaling added", () => {
    const s = createArmorState({ armorPerLevel: 0 });
    expect(getEffectiveArmor(s, 10)).toBe(5);
  });

  it("handles zero baseArmor", () => {
    const s = createArmorState({ baseArmor: 0 });
    expect(getEffectiveArmor(s, 1)).toBe(0);
  });
});

// ─── getArmorReduction ────────────────────────────────────────

describe("getArmorReduction", () => {
  it("returns 0 for 0 armor", () => {
    expect(getArmorReduction(0)).toBe(0);
  });

  it("returns 0.5 for 100 armor (standard formula)", () => {
    expect(getArmorReduction(100)).toBe(0.5);
  });

  it("returns diminishing returns at high armor", () => {
    const r200 = getArmorReduction(200);
    const r400 = getArmorReduction(400);
    expect(r200).toBeCloseTo(200 / 300, 10);
    expect(r400).toBeCloseTo(400 / 500, 10);
    expect(r400 - r200).toBeLessThan(r200 - 0);
  });

  it("returns ~4.76% for 5 armor (default base)", () => {
    expect(getArmorReduction(5)).toBeCloseTo(5 / 105, 10);
  });

  it("returns small values for small armor", () => {
    expect(getArmorReduction(1)).toBeCloseTo(1 / 101, 10);
  });

  it("approaches 1 but never reaches it", () => {
    expect(getArmorReduction(10000)).toBeLessThan(1);
    expect(getArmorReduction(10000)).toBeCloseTo(10000 / 10100, 10);
  });
});

// ─── getTotalPercentReduction ─────────────────────────────────

describe("getTotalPercentReduction", () => {
  it("returns base percentReduction with no bonus", () => {
    const s = createArmorState();
    expect(getTotalPercentReduction(s)).toBe(0.05);
  });

  it("sums base + bonus percent reduction", () => {
    const s = addPercentReduction(createArmorState(), 0.1);
    expect(getTotalPercentReduction(s)).toBeCloseTo(0.15, 10);
  });

  it("caps at maxPercentReduction", () => {
    const s = addPercentReduction(createArmorState(), 0.9);
    expect(getTotalPercentReduction(s)).toBe(0.8);
  });

  it("respects custom maxPercentReduction", () => {
    const s = addPercentReduction(
      createArmorState({ maxPercentReduction: 0.5 }),
      0.6,
    );
    expect(getTotalPercentReduction(s)).toBe(0.5);
  });

  it("returns exact cap when sum equals max", () => {
    const s = addPercentReduction(
      createArmorState({ percentReduction: 0.3, maxPercentReduction: 0.5 }),
      0.2,
    );
    expect(getTotalPercentReduction(s)).toBe(0.5);
  });

  it("returns sum when under cap", () => {
    const s = addPercentReduction(
      createArmorState({ percentReduction: 0.1 }),
      0.05,
    );
    expect(getTotalPercentReduction(s)).toBeCloseTo(0.15, 10);
  });
});

// ─── calculateDamageAfterArmor ────────────────────────────────

describe("calculateDamageAfterArmor", () => {
  it("reduces damage with default state at level 1", () => {
    const s = createArmorState();
    const dmg = calculateDamageAfterArmor(s, 100);
    // armor=5, armorRed=5/105, percentRed=0.05, flat=2
    const expected = 100 * (1 - 5 / 105) * (1 - 0.05) - 2;
    expect(dmg).toBeCloseTo(expected, 5);
  });

  it("floors damage at 1 (minimum damage)", () => {
    const s = createArmorState({ flatReduction: 1000 });
    expect(calculateDamageAfterArmor(s, 10)).toBe(1);
  });

  it("returns 1 for tiny incoming damage", () => {
    const s = createArmorState();
    expect(calculateDamageAfterArmor(s, 0.5)).toBe(1);
  });

  it("applies level scaling to armor", () => {
    const s = createArmorState();
    const dmgLv1 = calculateDamageAfterArmor(s, 100, 1);
    const dmgLv10 = calculateDamageAfterArmor(s, 100, 10);
    expect(dmgLv10).toBeLessThan(dmgLv1);
  });

  it("applies bonus flat reduction", () => {
    const s = addFlatReduction(createArmorState(), 5);
    const base = createArmorState();
    expect(calculateDamageAfterArmor(s, 100)).toBeLessThan(
      calculateDamageAfterArmor(base, 100),
    );
  });

  it("applies bonus percent reduction", () => {
    const s = addPercentReduction(createArmorState(), 0.1);
    const base = createArmorState();
    expect(calculateDamageAfterArmor(s, 100)).toBeLessThan(
      calculateDamageAfterArmor(base, 100),
    );
  });

  it("applies bonus armor", () => {
    const s = addBonusArmor(createArmorState(), 50);
    const base = createArmorState();
    expect(calculateDamageAfterArmor(s, 100)).toBeLessThan(
      calculateDamageAfterArmor(base, 100),
    );
  });

  it("stacks all reduction types together", () => {
    let s = createArmorState();
    s = addBonusArmor(s, 20);
    s = addFlatReduction(s, 3);
    s = addPercentReduction(s, 0.1);
    const dmg = calculateDamageAfterArmor(s, 100, 5);
    // armor=5+20+4=29, armorRed=29/129, percentRed=0.15, flat=2+3=5
    const expected = 100 * (1 - 29 / 129) * (1 - 0.15) - 5;
    expect(dmg).toBeCloseTo(expected, 5);
  });

  it("defaults level to 1 when omitted", () => {
    const s = createArmorState();
    expect(calculateDamageAfterArmor(s, 100)).toBe(
      calculateDamageAfterArmor(s, 100, 1),
    );
  });

  it("handles zero incoming damage — floors at 1", () => {
    const s = createArmorState();
    expect(calculateDamageAfterArmor(s, 0)).toBe(1);
  });

  it("handles very large incoming damage", () => {
    const s = createArmorState();
    const dmg = calculateDamageAfterArmor(s, 10000);
    expect(dmg).toBeGreaterThan(1);
    expect(dmg).toBeLessThan(10000);
  });
});

// ─── applyDamage ──────────────────────────────────────────────

describe("applyDamage", () => {
  it("returns finalDamage matching calculateDamageAfterArmor", () => {
    const s = createArmorState();
    const { finalDamage } = applyDamage(s, 100);
    expect(finalDamage).toBe(calculateDamageAfterArmor(s, 100));
  });

  it("returns blocked = incoming - final", () => {
    const s = createArmorState();
    const { finalDamage, blocked } = applyDamage(s, 100);
    expect(blocked).toBeCloseTo(100 - finalDamage, 10);
  });

  it("increments hitsReceived by 1", () => {
    const s = createArmorState();
    const { newState } = applyDamage(s, 100);
    expect(newState.hitsReceived).toBe(1);
  });

  it("accumulates totalDamageBlocked", () => {
    const s = createArmorState();
    const { newState: s1 } = applyDamage(s, 100);
    const { newState: s2 } = applyDamage(s1, 100);
    expect(s2.totalDamageBlocked).toBeCloseTo(s1.totalDamageBlocked * 2, 5);
    expect(s2.hitsReceived).toBe(2);
  });

  it("does not mutate original state", () => {
    const s = createArmorState();
    const { newState } = applyDamage(s, 100);
    expect(s.hitsReceived).toBe(0);
    expect(s.totalDamageBlocked).toBe(0);
    expect(newState.hitsReceived).toBe(1);
  });

  it("passes level to calculation", () => {
    const s = createArmorState();
    const r1 = applyDamage(s, 100, 1);
    const r10 = applyDamage(s, 100, 10);
    expect(r10.finalDamage).toBeLessThan(r1.finalDamage);
  });

  it("blocked is positive when armor reduces damage", () => {
    const s = createArmorState();
    const { blocked } = applyDamage(s, 100);
    expect(blocked).toBeGreaterThan(0);
  });

  it("handles minimum damage floor in blocked calc", () => {
    const s = createArmorState({ flatReduction: 500 });
    const { finalDamage, blocked } = applyDamage(s, 10);
    expect(finalDamage).toBe(1);
    expect(blocked).toBe(9);
  });
});

// ─── addBonusArmor ────────────────────────────────────────────

describe("addBonusArmor", () => {
  it("adds bonus armor to state", () => {
    const s = addBonusArmor(createArmorState(), 10);
    expect(s.bonusArmor).toBe(10);
  });

  it("stacks multiple additions", () => {
    let s = createArmorState();
    s = addBonusArmor(s, 5);
    s = addBonusArmor(s, 3);
    expect(s.bonusArmor).toBe(8);
  });

  it("does not mutate original", () => {
    const original = createArmorState();
    addBonusArmor(original, 10);
    expect(original.bonusArmor).toBe(0);
  });
});

// ─── addFlatReduction ─────────────────────────────────────────

describe("addFlatReduction", () => {
  it("adds flat reduction bonus", () => {
    const s = addFlatReduction(createArmorState(), 3);
    expect(s.bonusFlatReduction).toBe(3);
  });

  it("stacks multiple additions", () => {
    let s = createArmorState();
    s = addFlatReduction(s, 2);
    s = addFlatReduction(s, 4);
    expect(s.bonusFlatReduction).toBe(6);
  });

  it("does not mutate original", () => {
    const original = createArmorState();
    addFlatReduction(original, 5);
    expect(original.bonusFlatReduction).toBe(0);
  });
});

// ─── addPercentReduction ──────────────────────────────────────

describe("addPercentReduction", () => {
  it("adds percent reduction bonus", () => {
    const s = addPercentReduction(createArmorState(), 0.1);
    expect(s.bonusPercentReduction).toBe(0.1);
  });

  it("stacks multiple additions", () => {
    let s = createArmorState();
    s = addPercentReduction(s, 0.05);
    s = addPercentReduction(s, 0.1);
    expect(s.bonusPercentReduction).toBeCloseTo(0.15, 10);
  });

  it("does not mutate original", () => {
    const original = createArmorState();
    addPercentReduction(original, 0.1);
    expect(original.bonusPercentReduction).toBe(0);
  });

  it("allows exceeding max (capping is done in getTotalPercentReduction)", () => {
    const s = addPercentReduction(createArmorState(), 0.95);
    expect(s.bonusPercentReduction).toBe(0.95);
  });
});

// ─── getStats ─────────────────────────────────────────────────

describe("getStats", () => {
  it("returns zeros for fresh state", () => {
    const stats = getStats(createArmorState());
    expect(stats.totalDamageBlocked).toBe(0);
    expect(stats.hitsReceived).toBe(0);
    expect(stats.averageBlocked).toBe(0);
  });

  it("returns correct stats after one hit", () => {
    const { newState } = applyDamage(createArmorState(), 100);
    const stats = getStats(newState);
    expect(stats.hitsReceived).toBe(1);
    expect(stats.totalDamageBlocked).toBeGreaterThan(0);
    expect(stats.averageBlocked).toBe(stats.totalDamageBlocked);
  });

  it("computes averageBlocked correctly over multiple hits", () => {
    let s = createArmorState();
    const { newState: s1 } = applyDamage(s, 100);
    const { newState: s2 } = applyDamage(s1, 200);
    const stats = getStats(s2);
    expect(stats.hitsReceived).toBe(2);
    expect(stats.averageBlocked).toBeCloseTo(stats.totalDamageBlocked / 2, 10);
  });

  it("handles zero hits without division error", () => {
    const stats = getStats(createArmorState());
    expect(stats.averageBlocked).toBe(0);
  });
});

// ─── resetStats ───────────────────────────────────────────────

describe("resetStats", () => {
  it("clears totalDamageBlocked and hitsReceived", () => {
    const { newState } = applyDamage(createArmorState(), 100);
    const reset = resetStats(newState);
    expect(reset.totalDamageBlocked).toBe(0);
    expect(reset.hitsReceived).toBe(0);
  });

  it("preserves config", () => {
    const s = createArmorState({ baseArmor: 20 });
    const { newState } = applyDamage(s, 100);
    const reset = resetStats(newState);
    expect(reset.config.baseArmor).toBe(20);
  });

  it("preserves bonus values", () => {
    let s = createArmorState();
    s = addBonusArmor(s, 10);
    s = addFlatReduction(s, 3);
    s = addPercentReduction(s, 0.1);
    const { newState } = applyDamage(s, 100);
    const reset = resetStats(newState);
    expect(reset.bonusArmor).toBe(10);
    expect(reset.bonusFlatReduction).toBe(3);
    expect(reset.bonusPercentReduction).toBe(0.1);
  });

  it("does not mutate original", () => {
    const { newState } = applyDamage(createArmorState(), 100);
    resetStats(newState);
    expect(newState.hitsReceived).toBe(1);
  });
});

// ─── Integration / Edge Cases ─────────────────────────────────

describe("integration", () => {
  it("full upgrade pipeline: add all bonuses then take hits", () => {
    let s = createArmorState();
    s = addBonusArmor(s, 15);
    s = addFlatReduction(s, 5);
    s = addPercentReduction(s, 0.1);

    const { newState: s1, finalDamage: d1 } = applyDamage(s, 200, 5);
    const { newState: s2, finalDamage: d2 } = applyDamage(s1, 150, 5);

    expect(d1).toBeGreaterThanOrEqual(1);
    expect(d2).toBeGreaterThanOrEqual(1);
    expect(s2.hitsReceived).toBe(2);
    expect(getStats(s2).averageBlocked).toBeGreaterThan(0);
  });

  it("percent reduction at cap still allows minimum damage", () => {
    let s = createArmorState({ maxPercentReduction: 0.99 });
    s = addPercentReduction(s, 0.95);
    s = addBonusArmor(s, 1000);
    const dmg = calculateDamageAfterArmor(s, 10);
    expect(dmg).toBe(1);
  });

  it("high armor + high flat still floors at 1", () => {
    let s = createArmorState({ baseArmor: 500, flatReduction: 100 });
    s = addBonusArmor(s, 500);
    s = addFlatReduction(s, 100);
    const dmg = calculateDamageAfterArmor(s, 50);
    expect(dmg).toBe(1);
  });

  it("state immutability chain — original unchanged after many operations", () => {
    const original = createArmorState();
    const a = addBonusArmor(original, 10);
    const b = addFlatReduction(a, 5);
    const c = addPercentReduction(b, 0.1);
    const { newState } = applyDamage(c, 100);
    resetStats(newState);

    expect(original.bonusArmor).toBe(0);
    expect(original.bonusFlatReduction).toBe(0);
    expect(original.bonusPercentReduction).toBe(0);
    expect(original.hitsReceived).toBe(0);
    expect(original.totalDamageBlocked).toBe(0);
  });
});
