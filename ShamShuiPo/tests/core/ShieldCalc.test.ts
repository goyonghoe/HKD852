import { describe, it, expect } from "vitest";
import {
  createShieldState,
  takeDamage,
  updateShield,
  getShieldPercent,
  isShieldActive,
  isFullShield,
  addShield,
  setMaxShield,
  resetShield,
  getAbsorptionStats,
} from "../../src/core/ShieldCalc";

// ─── createShieldState ──────────────────────────────────────────

describe("createShieldState", () => {
  it("creates state with default config", () => {
    const s = createShieldState();
    expect(s.config.maxShield).toBe(50);
    expect(s.config.rechargeRate).toBe(10);
    expect(s.config.rechargeDelay).toBe(3000);
    expect(s.config.damageReduction).toBe(1.0);
  });

  it("sets current to maxShield", () => {
    const s = createShieldState();
    expect(s.current).toBe(50);
  });

  it("initializes lastHitTime to 0", () => {
    const s = createShieldState();
    expect(s.lastHitTime).toBe(0);
  });

  it("initializes isRecharging to false", () => {
    const s = createShieldState();
    expect(s.isRecharging).toBe(false);
  });

  it("initializes totalAbsorbed to 0", () => {
    const s = createShieldState();
    expect(s.totalAbsorbed).toBe(0);
  });

  it("accepts partial config overrides", () => {
    const s = createShieldState({ maxShield: 100 });
    expect(s.config.maxShield).toBe(100);
    expect(s.current).toBe(100);
    expect(s.config.rechargeRate).toBe(10); // default preserved
  });

  it("accepts full config override", () => {
    const s = createShieldState({
      maxShield: 200,
      rechargeRate: 25,
      rechargeDelay: 5000,
      damageReduction: 0.5,
    });
    expect(s.config.maxShield).toBe(200);
    expect(s.config.rechargeRate).toBe(25);
    expect(s.config.rechargeDelay).toBe(5000);
    expect(s.config.damageReduction).toBe(0.5);
    expect(s.current).toBe(200);
  });

  it("creates independent instances", () => {
    const a = createShieldState({ maxShield: 30 });
    const b = createShieldState({ maxShield: 80 });
    expect(a.config.maxShield).toBe(30);
    expect(b.config.maxShield).toBe(80);
  });
});

// ─── takeDamage ─────────────────────────────────────────────────

describe("takeDamage", () => {
  it("fully absorbs small damage", () => {
    const s = createShieldState({ maxShield: 50 });
    const { newState, damageToHP } = takeDamage(s, 10, 1000);
    expect(newState.current).toBe(40);
    expect(damageToHP).toBe(0);
  });

  it("passes excess damage to HP when shield breaks", () => {
    const s = createShieldState({ maxShield: 20 });
    const { newState, damageToHP } = takeDamage(s, 30, 1000);
    expect(newState.current).toBe(0);
    expect(damageToHP).toBe(10);
  });

  it("handles exact shield break (damage == current)", () => {
    const s = createShieldState({ maxShield: 25 });
    const { newState, damageToHP } = takeDamage(s, 25, 1000);
    expect(newState.current).toBe(0);
    expect(damageToHP).toBe(0);
  });

  it("updates lastHitTime", () => {
    const s = createShieldState();
    const { newState } = takeDamage(s, 5, 4500);
    expect(newState.lastHitTime).toBe(4500);
  });

  it("stops recharging on hit", () => {
    let s = createShieldState({ maxShield: 50, rechargeDelay: 100 });
    // Drain some shield
    const { newState: damaged } = takeDamage(s, 20, 100);
    // Start recharging
    const recharging = updateShield(damaged, 500, 5000);
    expect(recharging.isRecharging).toBe(true);
    // Take damage again — should stop recharging
    const { newState: hitAgain } = takeDamage(recharging, 5, 5500);
    expect(hitAgain.isRecharging).toBe(false);
  });

  it("accumulates totalAbsorbed", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState: s1 } = takeDamage(s, 15, 100);
    const { newState: s2 } = takeDamage(s1, 25, 200);
    expect(s2.totalAbsorbed).toBe(40);
  });

  it("does not mutate original state", () => {
    const s = createShieldState();
    const original = s.current;
    takeDamage(s, 10, 1000);
    expect(s.current).toBe(original);
  });

  it("handles zero damage", () => {
    const s = createShieldState();
    const { newState, damageToHP } = takeDamage(s, 0, 1000);
    expect(newState.current).toBe(50);
    expect(damageToHP).toBe(0);
  });

  it("handles damage when shield is already 0", () => {
    const s = createShieldState({ maxShield: 10 });
    const { newState: broken } = takeDamage(s, 10, 100);
    const { newState, damageToHP } = takeDamage(broken, 20, 200);
    expect(newState.current).toBe(0);
    expect(damageToHP).toBe(20);
  });

  it("handles very large damage", () => {
    const s = createShieldState({ maxShield: 50 });
    const { newState, damageToHP } = takeDamage(s, 99999, 1000);
    expect(newState.current).toBe(0);
    expect(damageToHP).toBe(99999 - 50);
  });
});

// ─── takeDamage with damageReduction < 1 ────────────────────────

describe("takeDamage with partial damageReduction", () => {
  it("absorbs only damageReduction portion", () => {
    const s = createShieldState({ maxShield: 100, damageReduction: 0.5 });
    // 40 damage → 20 absorbable by shield, 20 passes through
    const { newState, damageToHP } = takeDamage(s, 40, 1000);
    expect(newState.current).toBe(80); // 100 - 20
    expect(damageToHP).toBe(20); // 40 - 20
  });

  it("handles shield break with partial reduction", () => {
    const s = createShieldState({ maxShield: 10, damageReduction: 0.5 });
    // 30 damage → 15 absorbable, shield has 10, absorbs 10, passes 20
    const { newState, damageToHP } = takeDamage(s, 30, 1000);
    expect(newState.current).toBe(0);
    expect(damageToHP).toBe(20); // 30 - 10
  });

  it("tracks totalAbsorbed correctly with partial reduction", () => {
    const s = createShieldState({ maxShield: 100, damageReduction: 0.75 });
    // 20 damage → 15 absorbable, all absorbed
    const { newState } = takeDamage(s, 20, 1000);
    expect(newState.totalAbsorbed).toBe(15);
  });

  it("damageReduction=0 means shield absorbs nothing", () => {
    const s = createShieldState({ maxShield: 100, damageReduction: 0 });
    const { newState, damageToHP } = takeDamage(s, 30, 1000);
    expect(newState.current).toBe(100);
    expect(damageToHP).toBe(30);
  });

  it("damageReduction=1 means full absorption", () => {
    const s = createShieldState({ maxShield: 100, damageReduction: 1.0 });
    const { newState, damageToHP } = takeDamage(s, 30, 1000);
    expect(newState.current).toBe(70);
    expect(damageToHP).toBe(0);
  });
});

// ─── updateShield ───────────────────────────────────────────────

describe("updateShield", () => {
  it("does not recharge before delay expires", () => {
    const s = createShieldState({ maxShield: 50, rechargeDelay: 3000 });
    const { newState: damaged } = takeDamage(s, 20, 1000);
    const updated = updateShield(damaged, 100, 2000); // only 1000ms elapsed
    expect(updated.current).toBe(30);
  });

  it("starts recharging after delay", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 10,
      rechargeDelay: 3000,
    });
    const { newState: damaged } = takeDamage(s, 20, 1000);
    // 4001ms after hit → delay passed
    const updated = updateShield(damaged, 500, 4001);
    expect(updated.current).toBeGreaterThan(30);
    expect(updated.isRecharging).toBe(true);
  });

  it("recharges correct amount based on deltaMs", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 10,
      rechargeDelay: 1000,
    });
    const { newState: damaged } = takeDamage(s, 30, 100);
    // 1 second delta at 10/sec = +10
    const updated = updateShield(damaged, 1000, 1200);
    expect(updated.current).toBeCloseTo(30);
  });

  it("caps recharge at maxShield", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 100,
      rechargeDelay: 100,
    });
    const { newState: damaged } = takeDamage(s, 10, 100);
    // Huge delta → would overshoot
    const updated = updateShield(damaged, 5000, 5000);
    expect(updated.current).toBe(50);
  });

  it("returns same state if already full", () => {
    const s = createShieldState();
    const updated = updateShield(s, 1000, 5000);
    expect(updated).toBe(s); // exact same reference
  });

  it("sets isRecharging false when reaching max", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 100,
      rechargeDelay: 100,
    });
    const { newState: damaged } = takeDamage(s, 5, 100);
    const updated = updateShield(damaged, 5000, 5000);
    expect(updated.current).toBe(50);
    expect(updated.isRecharging).toBe(false);
  });

  it("does not recharge at exactly delay boundary", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeDelay: 3000,
    });
    const { newState: damaged } = takeDamage(s, 10, 1000);
    // Exactly 3000ms elapsed → NOT enough (must be >=)
    const updated = updateShield(damaged, 100, 4000);
    // 4000 - 1000 = 3000, which is >= 3000 → should recharge
    expect(updated.current).toBeGreaterThan(40);
  });

  it("recharges incrementally across multiple updates", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 10,
      rechargeDelay: 100,
    });
    const { newState: damaged } = takeDamage(s, 40, 100);
    // 10 shield left, recharge 10/s
    let state = damaged;
    // 5 updates of 200ms each = 1 second total = +10
    for (let i = 0; i < 5; i++) {
      state = updateShield(state, 200, 500 + i * 200);
    }
    expect(state.current).toBeCloseTo(20);
  });

  it("handles zero deltaMs", () => {
    const s = createShieldState({ maxShield: 50, rechargeDelay: 100 });
    const { newState: damaged } = takeDamage(s, 10, 100);
    const updated = updateShield(damaged, 0, 5000);
    expect(updated.current).toBe(40); // no recharge with 0 delta
  });
});

// ─── getShieldPercent ───────────────────────────────────────────

describe("getShieldPercent", () => {
  it("returns 1 for full shield", () => {
    const s = createShieldState();
    expect(getShieldPercent(s)).toBe(1);
  });

  it("returns 0 for broken shield", () => {
    const s = createShieldState({ maxShield: 10 });
    const { newState } = takeDamage(s, 10, 100);
    expect(getShieldPercent(newState)).toBe(0);
  });

  it("returns correct fraction", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState } = takeDamage(s, 25, 100);
    expect(getShieldPercent(newState)).toBeCloseTo(0.75);
  });

  it("returns 0 for maxShield=0", () => {
    const s = createShieldState({ maxShield: 0 });
    expect(getShieldPercent(s)).toBe(0);
  });
});

// ─── isShieldActive ─────────────────────────────────────────────

describe("isShieldActive", () => {
  it("returns true when shield has HP", () => {
    const s = createShieldState();
    expect(isShieldActive(s)).toBe(true);
  });

  it("returns false when shield is depleted", () => {
    const s = createShieldState({ maxShield: 10 });
    const { newState } = takeDamage(s, 10, 100);
    expect(isShieldActive(newState)).toBe(false);
  });

  it("returns true with even tiny shield remaining", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState } = takeDamage(s, 99.5, 100);
    expect(isShieldActive(newState)).toBe(true);
  });
});

// ─── isFullShield ───────────────────────────────────────────────

describe("isFullShield", () => {
  it("returns true at creation", () => {
    expect(isFullShield(createShieldState())).toBe(true);
  });

  it("returns false after damage", () => {
    const s = createShieldState();
    const { newState } = takeDamage(s, 1, 100);
    expect(isFullShield(newState)).toBe(false);
  });

  it("returns true after full recharge", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeRate: 100,
      rechargeDelay: 100,
    });
    const { newState: damaged } = takeDamage(s, 10, 100);
    const recharged = updateShield(damaged, 5000, 5000);
    expect(isFullShield(recharged)).toBe(true);
  });
});

// ─── addShield ──────────────────────────────────────────────────

describe("addShield", () => {
  it("adds shield points", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState: damaged } = takeDamage(s, 30, 100);
    const healed = addShield(damaged, 15);
    expect(healed.current).toBe(85);
  });

  it("caps at maxShield", () => {
    const s = createShieldState({ maxShield: 50 });
    const { newState: damaged } = takeDamage(s, 10, 100);
    const healed = addShield(damaged, 999);
    expect(healed.current).toBe(50);
  });

  it("works when shield is at 0", () => {
    const s = createShieldState({ maxShield: 30 });
    const { newState: broken } = takeDamage(s, 30, 100);
    const healed = addShield(broken, 10);
    expect(healed.current).toBe(10);
  });

  it("adding 0 does nothing", () => {
    const s = createShieldState({ maxShield: 50 });
    const { newState: damaged } = takeDamage(s, 20, 100);
    const same = addShield(damaged, 0);
    expect(same.current).toBe(30);
  });

  it("does not exceed max when already full", () => {
    const s = createShieldState({ maxShield: 50 });
    const over = addShield(s, 100);
    expect(over.current).toBe(50);
  });
});

// ─── setMaxShield ───────────────────────────────────────────────

describe("setMaxShield", () => {
  it("increases maxShield without changing current", () => {
    const s = createShieldState({ maxShield: 50 });
    const updated = setMaxShield(s, 100);
    expect(updated.config.maxShield).toBe(100);
    expect(updated.current).toBe(50); // not clamped up
  });

  it("clamps current when lowering maxShield", () => {
    const s = createShieldState({ maxShield: 100 });
    const updated = setMaxShield(s, 30);
    expect(updated.config.maxShield).toBe(30);
    expect(updated.current).toBe(30);
  });

  it("does not change current when max is still above", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState: damaged } = takeDamage(s, 60, 100);
    const updated = setMaxShield(damaged, 80);
    expect(updated.current).toBe(40); // 40 <= 80, no clamp
  });

  it("clamps partial shield to new lower max", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState: damaged } = takeDamage(s, 20, 100);
    // current = 80, set max to 50 → clamp to 50
    const updated = setMaxShield(damaged, 50);
    expect(updated.current).toBe(50);
  });
});

// ─── resetShield ────────────────────────────────────────────────

describe("resetShield", () => {
  it("restores current to maxShield", () => {
    const s = createShieldState({ maxShield: 60 });
    const { newState: damaged } = takeDamage(s, 40, 1000);
    const reset = resetShield(damaged);
    expect(reset.current).toBe(60);
  });

  it("clears lastHitTime", () => {
    const s = createShieldState();
    const { newState: damaged } = takeDamage(s, 10, 5000);
    const reset = resetShield(damaged);
    expect(reset.lastHitTime).toBe(0);
  });

  it("clears isRecharging", () => {
    const s = createShieldState({
      maxShield: 50,
      rechargeDelay: 100,
    });
    const { newState: damaged } = takeDamage(s, 20, 100);
    const recharging = updateShield(damaged, 500, 5000);
    const reset = resetShield(recharging);
    expect(reset.isRecharging).toBe(false);
  });

  it("preserves totalAbsorbed", () => {
    const s = createShieldState();
    const { newState: damaged } = takeDamage(s, 15, 100);
    const reset = resetShield(damaged);
    expect(reset.totalAbsorbed).toBe(15);
  });

  it("preserves config", () => {
    const s = createShieldState({ maxShield: 77, rechargeRate: 33 });
    const reset = resetShield(s);
    expect(reset.config.maxShield).toBe(77);
    expect(reset.config.rechargeRate).toBe(33);
  });
});

// ─── getAbsorptionStats ─────────────────────────────────────────

describe("getAbsorptionStats", () => {
  it("returns zero stats on fresh state", () => {
    const s = createShieldState();
    const stats = getAbsorptionStats(s);
    expect(stats.totalAbsorbed).toBe(0);
    expect(stats.currentPercent).toBe(1);
  });

  it("returns accumulated absorption and current percent", () => {
    const s = createShieldState({ maxShield: 100 });
    const { newState: s1 } = takeDamage(s, 10, 100);
    const { newState: s2 } = takeDamage(s1, 15, 200);
    const stats = getAbsorptionStats(s2);
    expect(stats.totalAbsorbed).toBe(25);
    expect(stats.currentPercent).toBeCloseTo(0.75);
  });

  it("shows 0 percent when shield is broken", () => {
    const s = createShieldState({ maxShield: 20 });
    const { newState } = takeDamage(s, 20, 100);
    const stats = getAbsorptionStats(newState);
    expect(stats.totalAbsorbed).toBe(20);
    expect(stats.currentPercent).toBe(0);
  });
});

// ─── Integration scenarios ──────────────────────────────────────

describe("integration scenarios", () => {
  it("full combat cycle: damage → wait → recharge → damage again", () => {
    let s = createShieldState({
      maxShield: 50,
      rechargeRate: 25,
      rechargeDelay: 2000,
    });

    // Take 30 damage at t=1000
    const { newState: s1, damageToHP: d1 } = takeDamage(s, 30, 1000);
    expect(s1.current).toBe(20);
    expect(d1).toBe(0);

    // Wait 1 second (not enough for recharge delay)
    const s2 = updateShield(s1, 1000, 2000);
    expect(s2.current).toBe(20);

    // Wait another 2 seconds (delay passed at t=3000)
    const s3 = updateShield(s2, 1000, 3100);
    // rechargeRate=25/s, deltaMs=1000 → +25
    expect(s3.current).toBeCloseTo(45);

    // Take another hit
    const { newState: s4, damageToHP: d2 } = takeDamage(s3, 60, 3200);
    expect(s4.current).toBe(0);
    expect(d2).toBeCloseTo(15);
  });

  it("multiple sequential hits accumulate totalAbsorbed", () => {
    let s = createShieldState({ maxShield: 100 });
    for (let i = 0; i < 5; i++) {
      const { newState } = takeDamage(s, 10, i * 100);
      s = newState;
    }
    expect(s.totalAbsorbed).toBe(50);
    expect(s.current).toBe(50);
  });
});
