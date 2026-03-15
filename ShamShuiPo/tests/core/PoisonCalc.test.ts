import { describe, it, expect } from "vitest";
import {
  createPoisonState,
  applyPoison,
  updatePoison,
  getEffectiveDamage,
  getPoisonOnTarget,
  isPoisoned,
  removePoison,
  clearPoisons,
  getActivePoisonCount,
  getTotalPoisonDPS,
  type PoisonEffect,
} from "../../src/core/PoisonCalc";

// ── createPoisonState ─────────────────────────────────────────────

describe("createPoisonState", () => {
  it("returns default config when no args", () => {
    const s = createPoisonState();
    expect(s.config.maxStacks).toBe(5);
    expect(s.config.stackMultiplier).toBe(0.5);
    expect(s.config.defaultDamage).toBe(3);
    expect(s.config.defaultTickInterval).toBe(500);
    expect(s.config.defaultDuration).toBe(5000);
  });

  it("starts with empty effects", () => {
    const s = createPoisonState();
    expect(s.effects).toHaveLength(0);
  });

  it("accepts partial config overrides", () => {
    const s = createPoisonState({ maxStacks: 10, defaultDamage: 7 });
    expect(s.config.maxStacks).toBe(10);
    expect(s.config.defaultDamage).toBe(7);
    // defaults preserved
    expect(s.config.stackMultiplier).toBe(0.5);
    expect(s.config.defaultTickInterval).toBe(500);
  });

  it("accepts all config fields", () => {
    const s = createPoisonState({
      maxStacks: 3,
      stackMultiplier: 0.25,
      defaultDamage: 10,
      defaultTickInterval: 250,
      defaultDuration: 3000,
    });
    expect(s.config.maxStacks).toBe(3);
    expect(s.config.stackMultiplier).toBe(0.25);
    expect(s.config.defaultDamage).toBe(10);
    expect(s.config.defaultTickInterval).toBe(250);
    expect(s.config.defaultDuration).toBe(3000);
  });
});

// ── applyPoison ───────────────────────────────────────────────────

describe("applyPoison", () => {
  it("adds a new effect to target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "enemy_1");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].targetId).toBe("enemy_1");
    expect(s.effects[0].active).toBe(true);
    expect(s.effects[0].stackCount).toBe(1);
  });

  it("uses default damage/duration/interval", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    expect(s.effects[0].damagePerTick).toBe(3);
    expect(s.effects[0].totalDuration).toBe(5000);
    expect(s.effects[0].tickInterval).toBe(500);
  });

  it("accepts custom damage", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", 10);
    expect(s.effects[0].damagePerTick).toBe(10);
  });

  it("accepts custom duration", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", undefined, 8000);
    expect(s.effects[0].totalDuration).toBe(8000);
  });

  it("accepts custom tick interval", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", undefined, undefined, 250);
    expect(s.effects[0].tickInterval).toBe(250);
  });

  it("starts with 0 elapsed and 0 totalDamageDealt", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    expect(s.effects[0].elapsed).toBe(0);
    expect(s.effects[0].tickElapsed).toBe(0);
    expect(s.effects[0].totalDamageDealt).toBe(0);
  });

  it("stacks poison on same target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e1");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].stackCount).toBe(2);
  });

  it("caps stacks at maxStacks", () => {
    let s = createPoisonState({ maxStacks: 3 });
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e1"); // 4th apply
    s = applyPoison(s, "e1"); // 5th apply
    expect(s.effects[0].stackCount).toBe(3);
  });

  it("refreshes duration on stack", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", 3, 5000);
    // Simulate some elapsed time
    const result = updatePoison(s, 2000);
    s = result.newState;
    // Re-apply to stack
    s = applyPoison(s, "e1", 3, 5000);
    expect(s.effects[0].elapsed).toBe(0);
    expect(s.effects[0].tickElapsed).toBe(0);
  });

  it("does not affect other targets when stacking", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e2");
    s = applyPoison(s, "e1");
    expect(s.effects).toHaveLength(2);
    const e1 = s.effects.find((e) => e.targetId === "e1")!;
    const e2 = s.effects.find((e) => e.targetId === "e2")!;
    expect(e1.stackCount).toBe(2);
    expect(e2.stackCount).toBe(1);
  });

  it("is immutable — does not mutate original state", () => {
    const s1 = createPoisonState();
    const s2 = applyPoison(s1, "e1");
    expect(s1.effects).toHaveLength(0);
    expect(s2.effects).toHaveLength(1);
  });

  it("can poison multiple distinct targets", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a");
    s = applyPoison(s, "b");
    s = applyPoison(s, "c");
    expect(s.effects).toHaveLength(3);
  });
});

// ── getEffectiveDamage ────────────────────────────────────────────

describe("getEffectiveDamage", () => {
  const baseEffect: PoisonEffect = {
    id: "test",
    targetId: "t",
    damagePerTick: 10,
    tickInterval: 500,
    totalDuration: 5000,
    elapsed: 0,
    tickElapsed: 0,
    totalDamageDealt: 0,
    active: true,
    stackCount: 1,
  };

  it("returns base damage at stack 1", () => {
    expect(getEffectiveDamage(baseEffect, 0.5)).toBe(10);
  });

  it("scales with stackCount", () => {
    const e = { ...baseEffect, stackCount: 3 };
    // 10 * (1 + (3-1)*0.5) = 10 * 2 = 20
    expect(getEffectiveDamage(e, 0.5)).toBe(20);
  });

  it("scales with different multiplier", () => {
    const e = { ...baseEffect, stackCount: 5 };
    // 10 * (1 + (5-1)*0.25) = 10 * 2 = 20
    expect(getEffectiveDamage(e, 0.25)).toBe(20);
  });

  it("handles multiplier of 0 (no scaling)", () => {
    const e = { ...baseEffect, stackCount: 5 };
    expect(getEffectiveDamage(e, 0)).toBe(10);
  });

  it("handles multiplier of 1.0", () => {
    const e = { ...baseEffect, stackCount: 3 };
    // 10 * (1 + (3-1)*1.0) = 10 * 3 = 30
    expect(getEffectiveDamage(e, 1.0)).toBe(30);
  });
});

// ── updatePoison ──────────────────────────────────────────────────

describe("updatePoison", () => {
  it("advances elapsed time", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const { newState } = updatePoison(s, 200);
    expect(newState.effects[0].elapsed).toBe(200);
  });

  it("does not fire tick before interval", () => {
    let s = createPoisonState(); // tickInterval = 500
    s = applyPoison(s, "e1");
    const { tickDamages } = updatePoison(s, 400);
    expect(tickDamages).toHaveLength(0);
  });

  it("fires tick at exact interval", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const { tickDamages } = updatePoison(s, 500);
    expect(tickDamages).toHaveLength(1);
    expect(tickDamages[0].targetId).toBe("e1");
    expect(tickDamages[0].damage).toBe(3);
  });

  it("fires multiple ticks for large delta", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const { tickDamages } = updatePoison(s, 1500);
    expect(tickDamages).toHaveLength(3);
  });

  it("accumulates totalDamageDealt", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const { newState } = updatePoison(s, 1000);
    // 2 ticks * 3 damage = 6
    expect(newState.effects[0].totalDamageDealt).toBe(6);
  });

  it("deactivates expired poison", () => {
    let s = createPoisonState({
      defaultDuration: 1000,
      defaultTickInterval: 500,
    });
    s = applyPoison(s, "e1");
    const { newState } = updatePoison(s, 1000);
    expect(newState.effects[0].active).toBe(false);
  });

  it("returns empty tickDamages for inactive effects", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = removePoison(s, "e1");
    const { tickDamages } = updatePoison(s, 1000);
    expect(tickDamages).toHaveLength(0);
  });

  it("processes multiple targets independently", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a", 5);
    s = applyPoison(s, "b", 10);
    const { tickDamages } = updatePoison(s, 500);
    expect(tickDamages).toHaveLength(2);
    const dmgA = tickDamages.find((d) => d.targetId === "a")!;
    const dmgB = tickDamages.find((d) => d.targetId === "b")!;
    expect(dmgA.damage).toBe(5);
    expect(dmgB.damage).toBe(10);
  });

  it("applies stack multiplier to tick damage", () => {
    let s = createPoisonState({ stackMultiplier: 0.5 });
    s = applyPoison(s, "e1", 10);
    s = applyPoison(s, "e1"); // stack 2
    const { tickDamages } = updatePoison(s, 500);
    // 10 * (1 + (2-1)*0.5) = 15
    expect(tickDamages[0].damage).toBe(15);
  });

  it("is immutable — does not mutate original", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const original = s;
    const { newState } = updatePoison(s, 500);
    expect(original.effects[0].elapsed).toBe(0);
    expect(newState.effects[0].elapsed).toBe(500);
  });

  it("handles zero delta", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const { newState, tickDamages } = updatePoison(s, 0);
    expect(tickDamages).toHaveLength(0);
    expect(newState.effects[0].elapsed).toBe(0);
  });

  it("carries over partial tick elapsed across updates", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    let result = updatePoison(s, 300);
    result = updatePoison(result.newState, 300);
    // 300 + 300 = 600 → 1 tick at 500, remainder 100
    expect(result.tickDamages).toHaveLength(1);
    expect(result.newState.effects[0].tickElapsed).toBe(100);
  });
});

// ── getPoisonOnTarget ─────────────────────────────────────────────

describe("getPoisonOnTarget", () => {
  it("returns null for no poison", () => {
    const s = createPoisonState();
    expect(getPoisonOnTarget(s, "e1")).toBeNull();
  });

  it("returns active effect", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", 7);
    const effect = getPoisonOnTarget(s, "e1");
    expect(effect).not.toBeNull();
    expect(effect!.damagePerTick).toBe(7);
  });

  it("returns null for inactive/removed poison", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = removePoison(s, "e1");
    expect(getPoisonOnTarget(s, "e1")).toBeNull();
  });

  it("returns null for wrong target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    expect(getPoisonOnTarget(s, "e2")).toBeNull();
  });
});

// ── isPoisoned ────────────────────────────────────────────────────

describe("isPoisoned", () => {
  it("returns false when no effects", () => {
    expect(isPoisoned(createPoisonState(), "e1")).toBe(false);
  });

  it("returns true for active poison", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    expect(isPoisoned(s, "e1")).toBe(true);
  });

  it("returns false after removal", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = removePoison(s, "e1");
    expect(isPoisoned(s, "e1")).toBe(false);
  });

  it("returns false for different target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    expect(isPoisoned(s, "e2")).toBe(false);
  });
});

// ── removePoison ──────────────────────────────────────────────────

describe("removePoison", () => {
  it("deactivates poison on target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = removePoison(s, "e1");
    expect(s.effects[0].active).toBe(false);
  });

  it("does not remove the effect record", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = removePoison(s, "e1");
    expect(s.effects).toHaveLength(1);
  });

  it("does not affect other targets", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e2");
    s = removePoison(s, "e1");
    expect(isPoisoned(s, "e2")).toBe(true);
  });

  it("is safe to call on non-existent target", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const s2 = removePoison(s, "e99");
    expect(s2.effects).toHaveLength(1);
    expect(s2.effects[0].active).toBe(true);
  });

  it("is immutable", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const original = s;
    const s2 = removePoison(s, "e1");
    expect(original.effects[0].active).toBe(true);
    expect(s2.effects[0].active).toBe(false);
  });
});

// ── clearPoisons ──────────────────────────────────────────────────

describe("clearPoisons", () => {
  it("deactivates all effects", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e2");
    s = applyPoison(s, "e3");
    s = clearPoisons(s);
    expect(getActivePoisonCount(s)).toBe(0);
  });

  it("returns same state when no effects", () => {
    const s = createPoisonState();
    const s2 = clearPoisons(s);
    expect(s2.effects).toHaveLength(0);
  });

  it("preserves effect records", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    s = applyPoison(s, "e2");
    s = clearPoisons(s);
    expect(s.effects).toHaveLength(2);
  });

  it("is immutable", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1");
    const original = s;
    clearPoisons(s);
    expect(original.effects[0].active).toBe(true);
  });
});

// ── getActivePoisonCount ──────────────────────────────────────────

describe("getActivePoisonCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActivePoisonCount(createPoisonState())).toBe(0);
  });

  it("counts active effects", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a");
    s = applyPoison(s, "b");
    expect(getActivePoisonCount(s)).toBe(2);
  });

  it("excludes inactive effects", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a");
    s = applyPoison(s, "b");
    s = removePoison(s, "a");
    expect(getActivePoisonCount(s)).toBe(1);
  });
});

// ── getTotalPoisonDPS ─────────────────────────────────────────────

describe("getTotalPoisonDPS", () => {
  it("returns 0 for empty state", () => {
    expect(getTotalPoisonDPS(createPoisonState())).toBe(0);
  });

  it("calculates DPS for single effect", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", 5, undefined, 500);
    // 5 damage per tick, 2 ticks/sec = 10 DPS
    expect(getTotalPoisonDPS(s)).toBe(10);
  });

  it("sums DPS across multiple targets", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a", 5, undefined, 500);
    s = applyPoison(s, "b", 10, undefined, 1000);
    // a: 5 * 2 = 10, b: 10 * 1 = 10 → total 20
    expect(getTotalPoisonDPS(s)).toBe(20);
  });

  it("accounts for stacks in DPS", () => {
    let s = createPoisonState({ stackMultiplier: 0.5 });
    s = applyPoison(s, "e1", 10, undefined, 500);
    s = applyPoison(s, "e1"); // stack 2
    // effective damage: 10 * (1 + 1*0.5) = 15
    // DPS: 15 * 2 = 30
    expect(getTotalPoisonDPS(s)).toBe(30);
  });

  it("excludes inactive effects from DPS", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a", 5, undefined, 500);
    s = applyPoison(s, "b", 5, undefined, 500);
    s = removePoison(s, "a");
    expect(getTotalPoisonDPS(s)).toBe(10);
  });

  it("handles different tick intervals", () => {
    let s = createPoisonState();
    s = applyPoison(s, "e1", 4, undefined, 250);
    // 4 * (1000/250) = 16
    expect(getTotalPoisonDPS(s)).toBe(16);
  });
});

// ── Integration / Edge Cases ──────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: apply → update → expire", () => {
    let s = createPoisonState({
      defaultDuration: 1000,
      defaultTickInterval: 500,
      defaultDamage: 4,
    });
    s = applyPoison(s, "boss");
    expect(isPoisoned(s, "boss")).toBe(true);

    // 500ms: 1 tick
    let result = updatePoison(s, 500);
    expect(result.tickDamages).toHaveLength(1);
    expect(result.tickDamages[0].damage).toBe(4);
    s = result.newState;

    // 500ms more: 1 tick + expire
    result = updatePoison(s, 500);
    expect(result.tickDamages).toHaveLength(1);
    s = result.newState;
    expect(s.effects[0].active).toBe(false);
    expect(s.effects[0].totalDamageDealt).toBe(8);
  });

  it("stacking increases damage over time", () => {
    let s = createPoisonState({
      defaultDamage: 6,
      stackMultiplier: 0.5,
      maxStacks: 3,
    });
    s = applyPoison(s, "t1");
    s = applyPoison(s, "t1"); // stack 2
    s = applyPoison(s, "t1"); // stack 3
    const effect = getPoisonOnTarget(s, "t1")!;
    // 6 * (1 + 2*0.5) = 6 * 2 = 12
    expect(getEffectiveDamage(effect, s.config.stackMultiplier)).toBe(12);
  });

  it("re-apply after expiry creates new effect", () => {
    let s = createPoisonState({
      defaultDuration: 500,
      defaultTickInterval: 500,
    });
    s = applyPoison(s, "e1");
    const { newState } = updatePoison(s, 600);
    expect(isPoisoned(newState, "e1")).toBe(false);
    // Re-apply
    const s2 = applyPoison(newState, "e1");
    expect(isPoisoned(s2, "e1")).toBe(true);
    expect(s2.effects).toHaveLength(2);
  });

  it("clearPoisons then re-apply works", () => {
    let s = createPoisonState();
    s = applyPoison(s, "a");
    s = applyPoison(s, "b");
    s = clearPoisons(s);
    expect(getActivePoisonCount(s)).toBe(0);
    s = applyPoison(s, "c");
    expect(getActivePoisonCount(s)).toBe(1);
    expect(isPoisoned(s, "c")).toBe(true);
  });

  it("very small tick interval produces many ticks", () => {
    let s = createPoisonState({
      defaultTickInterval: 50,
      defaultDuration: 10000,
    });
    s = applyPoison(s, "e1");
    const { tickDamages } = updatePoison(s, 500);
    expect(tickDamages).toHaveLength(10);
  });

  it("damage does not fire after deactivation within same update", () => {
    let s = createPoisonState({
      defaultDuration: 750,
      defaultTickInterval: 500,
      defaultDamage: 2,
    });
    s = applyPoison(s, "e1");
    // At 1000ms delta: should fire 1 tick at 500ms, then expire at 750ms
    // Second tick at 1000ms should not fire because expired
    const { tickDamages, newState } = updatePoison(s, 1000);
    expect(tickDamages).toHaveLength(1);
    expect(newState.effects[0].active).toBe(false);
  });
});
