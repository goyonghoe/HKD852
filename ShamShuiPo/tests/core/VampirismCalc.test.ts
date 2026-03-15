import { describe, it, expect } from "vitest";
import {
  createVampirismState,
  calculateHeal,
  applyLifesteal,
  getLifestealPercent,
  getAverageHealPerHit,
  setLifesteal,
  setMaxHealPerHit,
  resetStats,
  getStats,
} from "../../src/core/VampirismCalc";

// ── createVampirismState ──────────────────────────────────────

describe("createVampirismState", () => {
  it("creates state with default config", () => {
    const s = createVampirismState();
    expect(s.config.baseLifesteal).toBe(0.05);
    expect(s.config.maxHealPerHit).toBe(20);
    expect(s.config.overkillHealing).toBe(false);
  });

  it("initializes all counters to zero", () => {
    const s = createVampirismState();
    expect(s.totalHealed).toBe(0);
    expect(s.totalDamageDealt).toBe(0);
    expect(s.hitCount).toBe(0);
    expect(s.lastHealAmount).toBe(0);
  });

  it("accepts partial config overrides", () => {
    const s = createVampirismState({ baseLifesteal: 0.2 });
    expect(s.config.baseLifesteal).toBe(0.2);
    expect(s.config.maxHealPerHit).toBe(20);
    expect(s.config.overkillHealing).toBe(false);
  });

  it("overrides overkillHealing", () => {
    const s = createVampirismState({ overkillHealing: true });
    expect(s.config.overkillHealing).toBe(true);
  });

  it("overrides maxHealPerHit", () => {
    const s = createVampirismState({ maxHealPerHit: 50 });
    expect(s.config.maxHealPerHit).toBe(50);
  });

  it("clamps baseLifesteal above 1 to 1", () => {
    const s = createVampirismState({ baseLifesteal: 2.5 });
    expect(s.config.baseLifesteal).toBe(1);
  });

  it("clamps baseLifesteal below 0 to 0", () => {
    const s = createVampirismState({ baseLifesteal: -0.3 });
    expect(s.config.baseLifesteal).toBe(0);
  });

  it("accepts all config fields at once", () => {
    const s = createVampirismState({
      baseLifesteal: 0.15,
      maxHealPerHit: 10,
      overkillHealing: true,
    });
    expect(s.config.baseLifesteal).toBe(0.15);
    expect(s.config.maxHealPerHit).toBe(10);
    expect(s.config.overkillHealing).toBe(true);
  });

  it("accepts empty partial config", () => {
    const s = createVampirismState({});
    expect(s.config.baseLifesteal).toBe(0.05);
  });

  it("accepts baseLifesteal of exactly 0", () => {
    const s = createVampirismState({ baseLifesteal: 0 });
    expect(s.config.baseLifesteal).toBe(0);
  });

  it("accepts baseLifesteal of exactly 1", () => {
    const s = createVampirismState({ baseLifesteal: 1 });
    expect(s.config.baseLifesteal).toBe(1);
  });
});

// ── calculateHeal ─────────────────────────────────────────────

describe("calculateHeal", () => {
  it("heals 5% of damage by default", () => {
    const s = createVampirismState();
    expect(calculateHeal(s, 100, 100)).toBe(5);
  });

  it("caps heal at maxHealPerHit", () => {
    const s = createVampirismState({ baseLifesteal: 0.5, maxHealPerHit: 10 });
    // 0.5 * 100 = 50, capped at 10
    expect(calculateHeal(s, 100, 100)).toBe(10);
  });

  it("does not heal from overkill when overkillHealing is false", () => {
    const s = createVampirismState({ baseLifesteal: 0.1 });
    // enemy has 30 HP, damage is 100 → effective = 30
    expect(calculateHeal(s, 100, 30)).toBeCloseTo(3);
  });

  it("heals from overkill when overkillHealing is true", () => {
    const s = createVampirismState({
      baseLifesteal: 0.1,
      overkillHealing: true,
    });
    // full 100 damage counts
    expect(calculateHeal(s, 100, 30)).toBeCloseTo(10);
  });

  it("returns 0 for zero damage", () => {
    const s = createVampirismState();
    expect(calculateHeal(s, 0, 50)).toBe(0);
  });

  it("returns 0 for negative damage", () => {
    const s = createVampirismState();
    expect(calculateHeal(s, -10, 50)).toBe(0);
  });

  it("returns 0 when enemy HP remaining is 0 and overkill disabled", () => {
    const s = createVampirismState();
    expect(calculateHeal(s, 50, 0)).toBe(0);
  });

  it("heals when enemy HP remaining is 0 and overkill enabled", () => {
    const s = createVampirismState({
      baseLifesteal: 0.1,
      overkillHealing: true,
    });
    expect(calculateHeal(s, 50, 0)).toBeCloseTo(5);
  });

  it("handles negative enemy HP remaining gracefully", () => {
    const s = createVampirismState();
    // negative HP treated as 0 effective damage
    expect(calculateHeal(s, 50, -10)).toBe(0);
  });

  it("does not exceed maxHealPerHit even with overkill", () => {
    const s = createVampirismState({
      baseLifesteal: 1.0,
      maxHealPerHit: 5,
      overkillHealing: true,
    });
    expect(calculateHeal(s, 1000, 10)).toBe(5);
  });

  it("heals exact maxHealPerHit when rawHeal equals cap", () => {
    const s = createVampirismState({
      baseLifesteal: 0.1,
      maxHealPerHit: 10,
    });
    expect(calculateHeal(s, 100, 100)).toBe(10);
  });

  it("heals less than cap when rawHeal is below cap", () => {
    const s = createVampirismState({
      baseLifesteal: 0.1,
      maxHealPerHit: 100,
    });
    expect(calculateHeal(s, 50, 50)).toBe(5);
  });

  it("handles very small damage values", () => {
    const s = createVampirismState({ baseLifesteal: 0.5 });
    expect(calculateHeal(s, 1, 1)).toBeCloseTo(0.5);
  });

  it("handles very large damage values", () => {
    const s = createVampirismState({ maxHealPerHit: 20 });
    expect(calculateHeal(s, 100000, 100000)).toBe(20);
  });

  it("does not mutate state", () => {
    const s = createVampirismState();
    const before = JSON.stringify(s);
    calculateHeal(s, 100, 100);
    expect(JSON.stringify(s)).toBe(before);
  });
});

// ── applyLifesteal ────────────────────────────────────────────

describe("applyLifesteal", () => {
  it("returns correct healAmount", () => {
    const s = createVampirismState({ baseLifesteal: 0.1 });
    const { healAmount } = applyLifesteal(s, 100, 100);
    expect(healAmount).toBeCloseTo(10);
  });

  it("increments hitCount by 1", () => {
    const s = createVampirismState();
    const { newState } = applyLifesteal(s, 100, 100);
    expect(newState.hitCount).toBe(1);
  });

  it("accumulates totalDamageDealt", () => {
    const s = createVampirismState();
    const { newState: s1 } = applyLifesteal(s, 100, 100);
    const { newState: s2 } = applyLifesteal(s1, 50, 50);
    expect(s2.totalDamageDealt).toBe(150);
  });

  it("accumulates totalHealed", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 100, 100); // heal 10
    const { newState: s2 } = applyLifesteal(s1, 200, 200); // heal 20
    expect(s2.totalHealed).toBeCloseTo(30);
  });

  it("sets lastHealAmount correctly", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 100, 100);
    expect(s1.lastHealAmount).toBeCloseTo(10);
    const { newState: s2 } = applyLifesteal(s1, 50, 50);
    expect(s2.lastHealAmount).toBeCloseTo(5);
  });

  it("does not mutate original state", () => {
    const s = createVampirismState();
    const before = JSON.stringify(s);
    applyLifesteal(s, 100, 100);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("records zero damage hit correctly", () => {
    const s = createVampirismState();
    const { newState, healAmount } = applyLifesteal(s, 0, 50);
    expect(healAmount).toBe(0);
    expect(newState.hitCount).toBe(1);
    expect(newState.totalDamageDealt).toBe(0);
  });

  it("tracks multiple sequential hits", () => {
    let s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    for (let i = 0; i < 10; i++) {
      const { newState } = applyLifesteal(s, 20, 20);
      s = newState;
    }
    expect(s.hitCount).toBe(10);
    expect(s.totalDamageDealt).toBe(200);
    expect(s.totalHealed).toBeCloseTo(20);
  });

  it("respects overkill setting in accumulation", () => {
    const s = createVampirismState({ baseLifesteal: 0.1 });
    const { newState } = applyLifesteal(s, 100, 20);
    // effective damage = 20, heal = 2
    expect(newState.totalHealed).toBeCloseTo(2);
    expect(newState.totalDamageDealt).toBe(100);
  });
});

// ── getLifestealPercent ───────────────────────────────────────

describe("getLifestealPercent", () => {
  it("returns 0 when no damage dealt", () => {
    const s = createVampirismState();
    expect(getLifestealPercent(s)).toBe(0);
  });

  it("returns correct effective rate", () => {
    let s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    // healed 10, dealt 100
    expect(getLifestealPercent(newState)).toBeCloseTo(0.1);
  });

  it("effective rate differs from base when capped", () => {
    let s = createVampirismState({ baseLifesteal: 0.5, maxHealPerHit: 5 });
    const { newState } = applyLifesteal(s, 100, 100);
    // rawHeal=50, capped at 5. effective = 5/100 = 0.05
    expect(getLifestealPercent(newState)).toBeCloseTo(0.05);
  });

  it("effective rate differs from base with overkill disabled", () => {
    let s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 10);
    // effective damage=10, heal=1. rate = 1/100 = 0.01
    expect(getLifestealPercent(newState)).toBeCloseTo(0.01);
  });
});

// ── getAverageHealPerHit ──────────────────────────────────────

describe("getAverageHealPerHit", () => {
  it("returns 0 when no hits", () => {
    const s = createVampirismState();
    expect(getAverageHealPerHit(s)).toBe(0);
  });

  it("returns correct average after one hit", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    expect(getAverageHealPerHit(newState)).toBeCloseTo(10);
  });

  it("returns correct average after multiple hits", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 100, 100); // heal 10
    const { newState: s2 } = applyLifesteal(s1, 200, 200); // heal 20
    // avg = 30/2 = 15
    expect(getAverageHealPerHit(s2)).toBeCloseTo(15);
  });
});

// ── setLifesteal ──────────────────────────────────────────────

describe("setLifesteal", () => {
  it("updates baseLifesteal", () => {
    const s = createVampirismState();
    const s2 = setLifesteal(s, 0.25);
    expect(s2.config.baseLifesteal).toBe(0.25);
  });

  it("clamps to 0 when negative", () => {
    const s = createVampirismState();
    const s2 = setLifesteal(s, -0.5);
    expect(s2.config.baseLifesteal).toBe(0);
  });

  it("clamps to 1 when above 1", () => {
    const s = createVampirismState();
    const s2 = setLifesteal(s, 1.5);
    expect(s2.config.baseLifesteal).toBe(1);
  });

  it("does not mutate original state", () => {
    const s = createVampirismState();
    const before = s.config.baseLifesteal;
    setLifesteal(s, 0.9);
    expect(s.config.baseLifesteal).toBe(before);
  });

  it("preserves other config fields", () => {
    const s = createVampirismState({
      maxHealPerHit: 99,
      overkillHealing: true,
    });
    const s2 = setLifesteal(s, 0.3);
    expect(s2.config.maxHealPerHit).toBe(99);
    expect(s2.config.overkillHealing).toBe(true);
  });

  it("preserves counters", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    const s2 = setLifesteal(newState, 0.5);
    expect(s2.hitCount).toBe(1);
    expect(s2.totalDamageDealt).toBe(100);
    expect(s2.totalHealed).toBeCloseTo(10);
  });
});

// ── setMaxHealPerHit ──────────────────────────────────────────

describe("setMaxHealPerHit", () => {
  it("updates maxHealPerHit", () => {
    const s = createVampirismState();
    const s2 = setMaxHealPerHit(s, 50);
    expect(s2.config.maxHealPerHit).toBe(50);
  });

  it("does not mutate original state", () => {
    const s = createVampirismState();
    const before = s.config.maxHealPerHit;
    setMaxHealPerHit(s, 999);
    expect(s.config.maxHealPerHit).toBe(before);
  });

  it("preserves other config fields", () => {
    const s = createVampirismState({
      baseLifesteal: 0.3,
      overkillHealing: true,
    });
    const s2 = setMaxHealPerHit(s, 42);
    expect(s2.config.baseLifesteal).toBe(0.3);
    expect(s2.config.overkillHealing).toBe(true);
  });

  it("preserves counters", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    const s2 = setMaxHealPerHit(newState, 5);
    expect(s2.hitCount).toBe(1);
    expect(s2.totalHealed).toBeCloseTo(10);
  });
});

// ── resetStats ────────────────────────────────────────────────

describe("resetStats", () => {
  it("zeros all counters", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    const reset = resetStats(newState);
    expect(reset.totalHealed).toBe(0);
    expect(reset.totalDamageDealt).toBe(0);
    expect(reset.hitCount).toBe(0);
    expect(reset.lastHealAmount).toBe(0);
  });

  it("preserves config", () => {
    const s = createVampirismState({
      baseLifesteal: 0.3,
      maxHealPerHit: 42,
      overkillHealing: true,
    });
    const { newState } = applyLifesteal(s, 100, 100);
    const reset = resetStats(newState);
    expect(reset.config.baseLifesteal).toBe(0.3);
    expect(reset.config.maxHealPerHit).toBe(42);
    expect(reset.config.overkillHealing).toBe(true);
  });

  it("does not mutate original state", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    const before = JSON.stringify(newState);
    resetStats(newState);
    expect(JSON.stringify(newState)).toBe(before);
  });

  it("can be applied to a fresh state", () => {
    const s = createVampirismState();
    const reset = resetStats(s);
    expect(reset.totalHealed).toBe(0);
    expect(reset.hitCount).toBe(0);
  });
});

// ── getStats ──────────────────────────────────────────────────

describe("getStats", () => {
  it("returns all zeros for fresh state", () => {
    const s = createVampirismState();
    const stats = getStats(s);
    expect(stats.totalHealed).toBe(0);
    expect(stats.totalDamageDealt).toBe(0);
    expect(stats.hitCount).toBe(0);
    expect(stats.averageHeal).toBe(0);
    expect(stats.effectiveRate).toBe(0);
  });

  it("returns correct stats after hits", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 100, 100); // heal 10
    const { newState: s2 } = applyLifesteal(s1, 50, 50); // heal 5
    const stats = getStats(s2);
    expect(stats.totalHealed).toBeCloseTo(15);
    expect(stats.totalDamageDealt).toBe(150);
    expect(stats.hitCount).toBe(2);
    expect(stats.averageHeal).toBeCloseTo(7.5);
    expect(stats.effectiveRate).toBeCloseTo(0.1);
  });

  it("effectiveRate reflects capping", () => {
    const s = createVampirismState({ baseLifesteal: 0.5, maxHealPerHit: 5 });
    const { newState } = applyLifesteal(s, 100, 100);
    const stats = getStats(newState);
    expect(stats.effectiveRate).toBeCloseTo(0.05);
  });

  it("does not mutate state", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState } = applyLifesteal(s, 100, 100);
    const before = JSON.stringify(newState);
    getStats(newState);
    expect(JSON.stringify(newState)).toBe(before);
  });
});

// ── Integration / edge cases ──────────────────────────────────

describe("integration", () => {
  it("full lifecycle: create → apply → setLifesteal → apply → getStats → reset", () => {
    let s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 200, 200); // heal 20
    const s2 = setLifesteal(s1, 0.2);
    const { newState: s3 } = applyLifesteal(s2, 100, 100); // heal 20
    const stats = getStats(s3);
    expect(stats.hitCount).toBe(2);
    expect(stats.totalHealed).toBeCloseTo(40);
    expect(stats.totalDamageDealt).toBe(300);
    const s4 = resetStats(s3);
    expect(s4.hitCount).toBe(0);
    expect(s4.config.baseLifesteal).toBe(0.2);
  });

  it("overkill toggled mid-session via new state", () => {
    const s = createVampirismState({ baseLifesteal: 0.1, maxHealPerHit: 100 });
    const { newState: s1 } = applyLifesteal(s, 100, 20); // effective=20, heal=2
    expect(s1.totalHealed).toBeCloseTo(2);

    // Switch overkill on by creating new state with preserved counters
    const overkillState: typeof s1 = {
      ...s1,
      config: { ...s1.config, overkillHealing: true },
    };
    const { newState: s2 } = applyLifesteal(overkillState, 100, 20); // effective=100, heal=10
    expect(s2.totalHealed).toBeCloseTo(12);
  });

  it("maxHealPerHit of 0 produces zero healing", () => {
    const s = createVampirismState({ baseLifesteal: 1.0, maxHealPerHit: 0 });
    const heal = calculateHeal(s, 1000, 1000);
    expect(heal).toBe(0);
  });

  it("baseLifesteal of 0 produces zero healing", () => {
    const s = createVampirismState({ baseLifesteal: 0 });
    const heal = calculateHeal(s, 1000, 1000);
    expect(heal).toBe(0);
  });

  it("state objects are independent references", () => {
    const s = createVampirismState();
    const { newState: s1 } = applyLifesteal(s, 100, 100);
    const { newState: s2 } = applyLifesteal(s, 200, 200);
    // Both derived from s independently
    expect(s1.totalDamageDealt).toBe(100);
    expect(s2.totalDamageDealt).toBe(200);
    expect(s.totalDamageDealt).toBe(0);
  });
});
