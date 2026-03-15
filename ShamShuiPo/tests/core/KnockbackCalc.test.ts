// ── Tests: KnockbackCalc ──

import { describe, it, expect } from "vitest";
import {
  calculateKnockback,
  applyKnockbackDecay,
} from "../../src/core/KnockbackCalc";

// ════════════════════════════════════════════════════════════════
// § calculateKnockback — direction
// ════════════════════════════════════════════════════════════════

describe("calculateKnockback direction", () => {
  // damage=20, resist=0 → force = 20*0.5 = 10px

  it("knocks enemy to the right (projectile left of enemy)", () => {
    const result = calculateKnockback(20, 0, 100, 50, 100, 0);
    expect(result.dx).toBeGreaterThan(0);
    expect(result.dy).toBeCloseTo(0);
    expect(result.magnitude).toBeCloseTo(10);
  });

  it("knocks enemy to the left (projectile right of enemy)", () => {
    const result = calculateKnockback(20, 100, 100, 50, 100, 0);
    expect(result.dx).toBeLessThan(0);
    expect(result.dy).toBeCloseTo(0);
    expect(result.magnitude).toBeCloseTo(10);
  });

  it("knocks enemy upward (projectile below enemy)", () => {
    const result = calculateKnockback(20, 100, 200, 100, 100, 0);
    expect(result.dx).toBeCloseTo(0);
    expect(result.dy).toBeLessThan(0);
    expect(result.magnitude).toBeCloseTo(10);
  });

  it("knocks enemy downward (projectile above enemy)", () => {
    const result = calculateKnockback(20, 100, 0, 100, 100, 0);
    expect(result.dx).toBeCloseTo(0);
    expect(result.dy).toBeGreaterThan(0);
    expect(result.magnitude).toBeCloseTo(10);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateKnockback — resistance
// ════════════════════════════════════════════════════════════════

describe("calculateKnockback resistance", () => {
  it("resist=0 gives full force", () => {
    const result = calculateKnockback(40, 0, 0, 100, 0, 0);
    // force = 40 * 0.5 * 1.0 * (1-0) = 20
    expect(result.magnitude).toBeCloseTo(20);
  });

  it("resist=0.5 gives half force", () => {
    const result = calculateKnockback(40, 0, 0, 100, 0, 0.5);
    // force = 40 * 0.5 * 1.0 * (1-0.5) = 10
    expect(result.magnitude).toBeCloseTo(10);
  });

  it("resist=1.0 gives zero knockback", () => {
    const result = calculateKnockback(40, 0, 0, 100, 0, 1.0);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.magnitude).toBe(0);
  });

  it("resist > 1.0 still gives zero knockback", () => {
    const result = calculateKnockback(40, 0, 0, 100, 0, 1.5);
    expect(result.magnitude).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateKnockback — cap & multiplier
// ════════════════════════════════════════════════════════════════

describe("calculateKnockback cap and multiplier", () => {
  it("caps at 40px displacement", () => {
    // damage=200, force = 200*0.5 = 100 → capped to 40
    const result = calculateKnockback(200, 0, 0, 100, 0, 0);
    expect(result.magnitude).toBe(40);
  });

  it("custom weaponKnockbackForce multiplier increases force", () => {
    // damage=20, force = 20*0.5*2.0 = 20
    const result = calculateKnockback(20, 0, 0, 100, 0, 0, 2.0);
    expect(result.magnitude).toBeCloseTo(20);
  });

  it("weaponKnockbackForce of 0 gives zero knockback", () => {
    const result = calculateKnockback(20, 0, 0, 100, 0, 0, 0);
    expect(result.magnitude).toBeCloseTo(0);
  });

  it("high weaponKnockbackForce still capped at 40", () => {
    // damage=60, force = 60*0.5*3.0 = 90 → capped to 40
    const result = calculateKnockback(60, 0, 0, 100, 0, 0, 3.0);
    expect(result.magnitude).toBe(40);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateKnockback — edge cases
// ════════════════════════════════════════════════════════════════

describe("calculateKnockback edge cases", () => {
  it("zero distance (same position) returns zero vector", () => {
    const result = calculateKnockback(50, 100, 100, 100, 100, 0);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.magnitude).toBe(0);
  });

  it("diagonal knockback has correct normalized direction", () => {
    const result = calculateKnockback(20, 0, 0, 100, 100, 0);
    // direction should be (1/√2, 1/√2)
    const invSqrt2 = 1 / Math.sqrt(2);
    expect(result.dx).toBeCloseTo(10 * invSqrt2, 5);
    expect(result.dy).toBeCloseTo(10 * invSqrt2, 5);
    expect(result.magnitude).toBeCloseTo(10);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyKnockbackDecay
// ════════════════════════════════════════════════════════════════

describe("applyKnockbackDecay", () => {
  it("reduces magnitude over time", () => {
    const result = applyKnockbackDecay(20, 0, 0.1);
    // factor = exp(-8 * 0.1) ≈ 0.449
    expect(result.dx).toBeLessThan(20);
    expect(result.dx).toBeGreaterThan(0);
  });

  it("snaps to zero when magnitude < 0.5", () => {
    // Start small enough that after decay it's under threshold
    const result = applyKnockbackDecay(1, 0, 0.5);
    // factor = exp(-8 * 0.5) = exp(-4) ≈ 0.018 → magnitude ≈ 0.018 < 0.5
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
  });

  it("zero deltaTime preserves vector", () => {
    const result = applyKnockbackDecay(15, 10, 0);
    expect(result.dx).toBeCloseTo(15);
    expect(result.dy).toBeCloseTo(10);
  });

  it("custom decayRate changes speed of decay", () => {
    const fast = applyKnockbackDecay(20, 0, 0.1, 16.0);
    const slow = applyKnockbackDecay(20, 0, 0.1, 4.0);
    expect(fast.dx).toBeLessThan(slow.dx);
  });

  it("multiple decay steps converge to zero", () => {
    let dx = 30;
    let dy = 20;
    const dt = 0.016; // ~60fps frame

    for (let i = 0; i < 60; i++) {
      const result = applyKnockbackDecay(dx, dy, dt);
      dx = result.dx;
      dy = result.dy;
    }

    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });
});
