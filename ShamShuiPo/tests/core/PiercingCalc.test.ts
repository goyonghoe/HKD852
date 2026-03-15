import { describe, it, expect } from "vitest";
import {
  createPiercingConfig,
  createProjectile,
  pierce,
  canPierce,
  hasHitTarget,
  getDamageAtPierce,
  getSizeAtPierce,
  getRemainingPierces,
  getTotalDamageDealt,
  resetProjectile,
  type PiercingProjectile,
} from "../../src/core/PiercingCalc";

// ── createPiercingConfig ──────────────────────────────────────

describe("createPiercingConfig", () => {
  it("returns defaults when no overrides", () => {
    const cfg = createPiercingConfig();
    expect(cfg.maxPierces).toBe(3);
    expect(cfg.damageRetention).toBe(0.7);
    expect(cfg.sizeReduction).toBe(0.9);
  });

  it("overrides maxPierces", () => {
    const cfg = createPiercingConfig({ maxPierces: 5 });
    expect(cfg.maxPierces).toBe(5);
    expect(cfg.damageRetention).toBe(0.7);
  });

  it("overrides damageRetention", () => {
    const cfg = createPiercingConfig({ damageRetention: 0.5 });
    expect(cfg.damageRetention).toBe(0.5);
  });

  it("overrides sizeReduction", () => {
    const cfg = createPiercingConfig({ sizeReduction: 0.8 });
    expect(cfg.sizeReduction).toBe(0.8);
  });

  it("overrides all fields", () => {
    const cfg = createPiercingConfig({
      maxPierces: 10,
      damageRetention: 1.0,
      sizeReduction: 1.0,
    });
    expect(cfg.maxPierces).toBe(10);
    expect(cfg.damageRetention).toBe(1.0);
    expect(cfg.sizeReduction).toBe(1.0);
  });

  it("accepts zero maxPierces", () => {
    const cfg = createPiercingConfig({ maxPierces: 0 });
    expect(cfg.maxPierces).toBe(0);
  });

  it("accepts zero damageRetention", () => {
    const cfg = createPiercingConfig({ damageRetention: 0 });
    expect(cfg.damageRetention).toBe(0);
  });

  it("accepts empty overrides object", () => {
    const cfg = createPiercingConfig({});
    expect(cfg.maxPierces).toBe(3);
  });
});

// ── createProjectile ──────────────────────────────────────────

describe("createProjectile", () => {
  const cfg = createPiercingConfig();

  it("sets id correctly", () => {
    const p = createProjectile("bullet-1", 100, 10, cfg);
    expect(p.id).toBe("bullet-1");
  });

  it("sets damage equal to baseDamage", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(p.damage).toBe(100);
    expect(p.baseDamage).toBe(100);
  });

  it("sets size equal to baseSize", () => {
    const p = createProjectile("b", 100, 16, cfg);
    expect(p.size).toBe(16);
    expect(p.baseSize).toBe(16);
  });

  it("starts with pierceCount 0", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(p.pierceCount).toBe(0);
  });

  it("starts with empty hitTargets", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(p.hitTargets).toEqual([]);
  });

  it("starts active", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(p.active).toBe(true);
  });

  it("works with zero baseDamage", () => {
    const p = createProjectile("b", 0, 10, cfg);
    expect(p.damage).toBe(0);
  });

  it("works with zero baseSize", () => {
    const p = createProjectile("b", 100, 0, cfg);
    expect(p.size).toBe(0);
  });
});

// ── pierce ────────────────────────────────────────────────────

describe("pierce", () => {
  const cfg = createPiercingConfig();

  it("increments pierceCount", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const result = pierce(p, "enemy-1", cfg);
    expect(result.pierceCount).toBe(1);
  });

  it("adds target to hitTargets", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const result = pierce(p, "enemy-1", cfg);
    expect(result.hitTargets).toContain("enemy-1");
  });

  it("reduces damage by damageRetention", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const result = pierce(p, "enemy-1", cfg);
    expect(result.damage).toBeCloseTo(70, 5); // 100 * 0.7^1
  });

  it("reduces size by sizeReduction", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const result = pierce(p, "enemy-1", cfg);
    expect(result.size).toBeCloseTo(9, 5); // 10 * 0.9^1
  });

  it("stays active before reaching maxPierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    expect(r1.active).toBe(true);
    const r2 = pierce(r1, "e2", cfg);
    expect(r2.active).toBe(true);
  });

  it("deactivates at maxPierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    const r3 = pierce(r2, "e3", cfg);
    expect(r3.active).toBe(false);
    expect(r3.pierceCount).toBe(3);
  });

  it("does not modify inactive projectile", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    const r3 = pierce(r2, "e3", cfg); // now inactive
    const r4 = pierce(r3, "e4", cfg);
    expect(r4).toBe(r3); // same reference
  });

  it("does not re-hit same target", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e1", cfg);
    expect(r2).toBe(r1); // same reference, no change
  });

  it("accumulates multiple hit targets", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    expect(r2.hitTargets).toEqual(["e1", "e2"]);
  });

  it("damage compounds correctly over multiple pierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    expect(r2.damage).toBeCloseTo(100 * 0.7 * 0.7, 5); // 49
  });

  it("size compounds correctly over multiple pierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    expect(r2.size).toBeCloseTo(10 * 0.9 * 0.9, 5); // 8.1
  });

  it("returns new object (immutability)", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(r).not.toBe(p);
    expect(p.pierceCount).toBe(0); // original unchanged
  });

  it("works with maxPierces=1 (single pierce then deactivate)", () => {
    const cfg1 = createPiercingConfig({ maxPierces: 1 });
    const p = createProjectile("b", 100, 10, cfg1);
    const r = pierce(p, "e1", cfg1);
    expect(r.active).toBe(false);
    expect(r.pierceCount).toBe(1);
  });

  it("works with damageRetention=1 (no damage loss)", () => {
    const cfgFull = createPiercingConfig({ damageRetention: 1.0 });
    const p = createProjectile("b", 100, 10, cfgFull);
    const r = pierce(p, "e1", cfgFull);
    expect(r.damage).toBe(100);
  });

  it("works with damageRetention=0 (full damage loss)", () => {
    const cfgZero = createPiercingConfig({ damageRetention: 0 });
    const p = createProjectile("b", 100, 10, cfgZero);
    const r = pierce(p, "e1", cfgZero);
    expect(r.damage).toBe(0);
  });

  it("works with sizeReduction=1 (no size loss)", () => {
    const cfgFull = createPiercingConfig({ sizeReduction: 1.0 });
    const p = createProjectile("b", 100, 10, cfgFull);
    const r = pierce(p, "e1", cfgFull);
    expect(r.size).toBe(10);
  });
});

// ── canPierce ─────────────────────────────────────────────────

describe("canPierce", () => {
  const cfg = createPiercingConfig();

  it("returns true for fresh projectile", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(canPierce(p, cfg)).toBe(true);
  });

  it("returns true after partial pierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(canPierce(r, cfg)).toBe(true);
  });

  it("returns false at max pierces", () => {
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg);
    p = pierce(p, "e1", cfg);
    p = pierce(p, "e2", cfg);
    p = pierce(p, "e3", cfg);
    expect(canPierce(p, cfg)).toBe(false);
  });

  it("returns false for inactive projectile", () => {
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg);
    p = pierce(p, "e1", cfg);
    p = pierce(p, "e2", cfg);
    p = pierce(p, "e3", cfg);
    expect(p.active).toBe(false);
    expect(canPierce(p, cfg)).toBe(false);
  });

  it("returns false with maxPierces=0", () => {
    const cfg0 = createPiercingConfig({ maxPierces: 0 });
    const p = createProjectile("b", 100, 10, cfg0);
    expect(canPierce(p, cfg0)).toBe(false);
  });
});

// ── hasHitTarget ──────────────────────────────────────────────

describe("hasHitTarget", () => {
  const cfg = createPiercingConfig();

  it("returns false for fresh projectile", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(hasHitTarget(p, "e1")).toBe(false);
  });

  it("returns true for hit target", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(hasHitTarget(r, "e1")).toBe(true);
  });

  it("returns false for non-hit target", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(hasHitTarget(r, "e2")).toBe(false);
  });

  it("tracks multiple targets", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    expect(hasHitTarget(r2, "e1")).toBe(true);
    expect(hasHitTarget(r2, "e2")).toBe(true);
    expect(hasHitTarget(r2, "e3")).toBe(false);
  });
});

// ── getDamageAtPierce ─────────────────────────────────────────

describe("getDamageAtPierce", () => {
  it("returns baseDamage at pierce 0", () => {
    expect(getDamageAtPierce(100, 0, 0.7)).toBe(100);
  });

  it("applies retention once at pierce 1", () => {
    expect(getDamageAtPierce(100, 1, 0.7)).toBeCloseTo(70, 5);
  });

  it("applies retention twice at pierce 2", () => {
    expect(getDamageAtPierce(100, 2, 0.7)).toBeCloseTo(49, 5);
  });

  it("applies retention three times at pierce 3", () => {
    expect(getDamageAtPierce(100, 3, 0.7)).toBeCloseTo(34.3, 5);
  });

  it("returns 0 with damageRetention=0 at pierce>0", () => {
    expect(getDamageAtPierce(100, 1, 0)).toBe(0);
  });

  it("preserves full damage with retention=1", () => {
    expect(getDamageAtPierce(100, 5, 1.0)).toBe(100);
  });

  it("returns 0 for baseDamage=0", () => {
    expect(getDamageAtPierce(0, 3, 0.7)).toBe(0);
  });

  it("handles high pierce index", () => {
    const result = getDamageAtPierce(100, 10, 0.5);
    expect(result).toBeCloseTo(100 * Math.pow(0.5, 10), 5);
  });
});

// ── getSizeAtPierce ───────────────────────────────────────────

describe("getSizeAtPierce", () => {
  it("returns baseSize at pierce 0", () => {
    expect(getSizeAtPierce(10, 0, 0.9)).toBe(10);
  });

  it("applies reduction once at pierce 1", () => {
    expect(getSizeAtPierce(10, 1, 0.9)).toBeCloseTo(9, 5);
  });

  it("applies reduction twice at pierce 2", () => {
    expect(getSizeAtPierce(10, 2, 0.9)).toBeCloseTo(8.1, 5);
  });

  it("returns 0 with sizeReduction=0 at pierce>0", () => {
    expect(getSizeAtPierce(10, 1, 0)).toBe(0);
  });

  it("preserves full size with reduction=1", () => {
    expect(getSizeAtPierce(10, 5, 1.0)).toBe(10);
  });

  it("returns 0 for baseSize=0", () => {
    expect(getSizeAtPierce(0, 3, 0.9)).toBe(0);
  });
});

// ── getRemainingPierces ───────────────────────────────────────

describe("getRemainingPierces", () => {
  const cfg = createPiercingConfig(); // maxPierces=3

  it("returns maxPierces for fresh projectile", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(getRemainingPierces(p, cfg)).toBe(3);
  });

  it("returns 2 after one pierce", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(getRemainingPierces(r, cfg)).toBe(2);
  });

  it("returns 0 at max pierces", () => {
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg);
    p = pierce(p, "e1", cfg);
    p = pierce(p, "e2", cfg);
    p = pierce(p, "e3", cfg);
    expect(getRemainingPierces(p, cfg)).toBe(0);
  });

  it("never returns negative", () => {
    const cfg1 = createPiercingConfig({ maxPierces: 1 });
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg1);
    p = pierce(p, "e1", cfg1);
    expect(getRemainingPierces(p, cfg1)).toBe(0);
  });
});

// ── getTotalDamageDealt ───────────────────────────────────────

describe("getTotalDamageDealt", () => {
  const cfg = createPiercingConfig(); // damageRetention=0.7

  it("returns 0 for fresh projectile", () => {
    const p = createProjectile("b", 100, 10, cfg);
    expect(getTotalDamageDealt(p)).toBe(0);
  });

  it("returns baseDamage after first pierce", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(getTotalDamageDealt(r)).toBeCloseTo(100, 3);
  });

  it("sums damage for two pierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    // first hit: 100, second hit: 70
    expect(getTotalDamageDealt(r2)).toBeCloseTo(170, 3);
  });

  it("sums damage for three pierces", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r1 = pierce(p, "e1", cfg);
    const r2 = pierce(r1, "e2", cfg);
    const r3 = pierce(r2, "e3", cfg);
    // 100 + 70 + 49 = 219
    expect(getTotalDamageDealt(r3)).toBeCloseTo(219, 1);
  });

  it("returns 0 for baseDamage=0", () => {
    const p = createProjectile("b", 0, 10, cfg);
    const r = pierce(p, "e1", cfg);
    expect(getTotalDamageDealt(r)).toBe(0);
  });

  it("handles damageRetention=1 (no loss)", () => {
    const cfgFull = createPiercingConfig({ damageRetention: 1.0 });
    const p = createProjectile("b", 50, 10, cfgFull);
    const r1 = pierce(p, "e1", cfgFull);
    const r2 = pierce(r1, "e2", cfgFull);
    expect(getTotalDamageDealt(r2)).toBeCloseTo(100, 3);
  });
});

// ── resetProjectile ───────────────────────────────────────────

describe("resetProjectile", () => {
  const cfg = createPiercingConfig();

  it("restores damage to baseDamage", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.damage).toBe(100);
  });

  it("restores size to baseSize", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.size).toBe(10);
  });

  it("resets pierceCount to 0", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.pierceCount).toBe(0);
  });

  it("clears hitTargets", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.hitTargets).toEqual([]);
  });

  it("reactivates projectile", () => {
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg);
    p = pierce(p, "e1", cfg);
    p = pierce(p, "e2", cfg);
    p = pierce(p, "e3", cfg);
    expect(p.active).toBe(false);
    const reset = resetProjectile(p);
    expect(reset.active).toBe(true);
  });

  it("preserves id", () => {
    const p = createProjectile("bullet-42", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.id).toBe("bullet-42");
  });

  it("preserves baseDamage and baseSize", () => {
    const p = createProjectile("b", 200, 20, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset.baseDamage).toBe(200);
    expect(reset.baseSize).toBe(20);
  });

  it("returns new object (immutability)", () => {
    const p = createProjectile("b", 100, 10, cfg);
    const r = pierce(p, "e1", cfg);
    const reset = resetProjectile(r);
    expect(reset).not.toBe(r);
  });

  it("reset projectile can pierce again", () => {
    let p: PiercingProjectile = createProjectile("b", 100, 10, cfg);
    p = pierce(p, "e1", cfg);
    p = pierce(p, "e2", cfg);
    p = pierce(p, "e3", cfg);
    const reset = resetProjectile(p);
    expect(canPierce(reset, cfg)).toBe(true);
    const r = pierce(reset, "e1", cfg); // can hit e1 again
    expect(r.pierceCount).toBe(1);
    expect(hasHitTarget(r, "e1")).toBe(true);
  });
});

// ── Integration / edge cases ──────────────────────────────────

describe("integration", () => {
  it("full lifecycle: create → pierce 3 → deactivate → reset → pierce again", () => {
    const cfg = createPiercingConfig({
      maxPierces: 2,
      damageRetention: 0.5,
      sizeReduction: 0.8,
    });
    let p: PiercingProjectile = createProjectile("laser", 200, 16, cfg);

    // Pierce 1
    p = pierce(p, "drone-a", cfg);
    expect(p.damage).toBeCloseTo(100, 5);
    expect(p.size).toBeCloseTo(12.8, 5);
    expect(p.active).toBe(true);

    // Pierce 2 → deactivate
    p = pierce(p, "drone-b", cfg);
    expect(p.damage).toBeCloseTo(50, 5);
    expect(p.active).toBe(false);

    // Reset
    p = resetProjectile(p);
    expect(p.damage).toBe(200);
    expect(p.size).toBe(16);
    expect(p.active).toBe(true);
    expect(p.hitTargets).toEqual([]);

    // Pierce again
    p = pierce(p, "drone-c", cfg);
    expect(p.pierceCount).toBe(1);
  });

  it("high pierce count with small retention degrades damage correctly", () => {
    const cfg = createPiercingConfig({
      maxPierces: 10,
      damageRetention: 0.5,
      sizeReduction: 0.5,
    });
    let p: PiercingProjectile = createProjectile("b", 1024, 1024, cfg);
    for (let i = 0; i < 10; i++) {
      p = pierce(p, `e${i}`, cfg);
    }
    expect(p.damage).toBeCloseTo(1, 1); // 1024 * 0.5^10 = 1
    expect(p.size).toBeCloseTo(1, 1);
    expect(p.active).toBe(false);
  });

  it("different configs produce different results on same projectile pattern", () => {
    const cfgA = createPiercingConfig({ damageRetention: 0.9 });
    const cfgB = createPiercingConfig({ damageRetention: 0.5 });
    const pA = createProjectile("a", 100, 10, cfgA);
    const pB = createProjectile("b", 100, 10, cfgB);
    const rA = pierce(pA, "e1", cfgA);
    const rB = pierce(pB, "e1", cfgB);
    expect(rA.damage).toBeCloseTo(90, 5);
    expect(rB.damage).toBeCloseTo(50, 5);
  });
});
