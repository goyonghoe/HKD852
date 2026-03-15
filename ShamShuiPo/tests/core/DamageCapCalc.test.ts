// ── Tests: DamageCapCalc ──
//
// SPEC-034 §4.9: DPS 배율 하드캡 3.0배
// "어떤 버프 조합이든 기본 DPS의 3.0배를 초과할 수 없다."
//
// Example scenarios from SPEC-034 §4.9:
//   火力 only:               2.0x                    → 2.0
//   Chrono + 火力:           1.3 × 2.0 = 2.6         → 2.6
//   Chrono + 火力 + FriedRice: 1.3 × 2.0 × 1.5 = 3.9 → 3.0 (capped)
//   Chrono + 大火力:          1.3 × 3.0 = 3.9         → 3.0 (capped)

import { describe, it, expect } from "vitest";
import {
  capDamageMultiplier,
  applyCap,
  wouldExceedCap,
} from "../../src/core/DamageCapCalc";
import { COMBAT } from "../../src/config/balance";

// ════════════════════════════════════════════════════════════════
// § COMBAT constant
// ════════════════════════════════════════════════════════════════

describe("COMBAT config", () => {
  it("dpsHardCap is 3.0 per SPEC-034 §4.9", () => {
    expect(COMBAT.dpsHardCap).toBe(3.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § capDamageMultiplier
// ════════════════════════════════════════════════════════════════

describe("capDamageMultiplier", () => {
  it("returns combined multiplier when under cap", () => {
    // 火力 only: 2.0 × 1.0 × 1.0 = 2.0 (under 3.0)
    expect(capDamageMultiplier(2.0, 1.0, 1.0)).toBeCloseTo(2.0);
  });

  it("returns 1.0 when no buffs active (all mults = 1.0)", () => {
    expect(capDamageMultiplier(1.0, 1.0, 1.0)).toBeCloseTo(1.0);
  });

  it("Chrono + 火力: 1.3 × 2.0 = 2.6 — under cap", () => {
    expect(capDamageMultiplier(2.0, 1.3, 1.0)).toBeCloseTo(2.6);
  });

  it("Chrono + 火力 + 炒飯: 1.3 × 2.0 × 1.5 = 3.9 → capped at 3.0", () => {
    expect(capDamageMultiplier(2.0, 1.3, 1.5)).toBeCloseTo(3.0);
  });

  it("Chrono + 大火力: 1.3 × 3.0 = 3.9 → capped at 3.0", () => {
    expect(capDamageMultiplier(3.0, 1.3, 1.0)).toBeCloseTo(3.0);
  });

  it("returns exactly 3.0 when combined is exactly 3.0", () => {
    // e.g. 3.0 × 1.0 × 1.0
    expect(capDamageMultiplier(3.0, 1.0, 1.0)).toBeCloseTo(3.0);
  });

  it("caps to 3.0 when product greatly exceeds cap", () => {
    // Extreme case: 3.0 × 3.0 × 3.0 = 27 → capped at 3.0
    expect(capDamageMultiplier(3.0, 3.0, 3.0)).toBeCloseTo(3.0);
  });

  it("handles neutral multipliers (1.0) correctly", () => {
    expect(capDamageMultiplier(1.5, 1.0, 1.0)).toBeCloseTo(1.5);
    expect(capDamageMultiplier(1.0, 1.3, 1.0)).toBeCloseTo(1.3);
    expect(capDamageMultiplier(1.0, 1.0, 1.5)).toBeCloseTo(1.5);
  });

  it("result never exceeds COMBAT.dpsHardCap", () => {
    const cases = [
      [4.0, 2.0, 3.0],
      [2.5, 2.5, 2.5],
      [3.0, 3.0, 1.0],
      [1.5, 2.0, 1.5],
    ];
    for (const [n, c, f] of cases) {
      expect(capDamageMultiplier(n, c, f)).toBeLessThanOrEqual(
        COMBAT.dpsHardCap,
      );
    }
  });

  it("result is always at least the minimum of the product (no negative cap)", () => {
    // With all mults >= 1.0, result >= 1.0
    expect(capDamageMultiplier(1.0, 1.0, 1.0)).toBeGreaterThanOrEqual(1.0);
  });

  it("multiplies all three factors before capping", () => {
    // 1.5 × 1.5 × 1.5 = 3.375 → capped at 3.0
    expect(capDamageMultiplier(1.5, 1.5, 1.5)).toBeCloseTo(3.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyCap
// ════════════════════════════════════════════════════════════════

describe("applyCap", () => {
  it("returns combined when under cap", () => {
    expect(applyCap(2.0)).toBeCloseTo(2.0);
    expect(applyCap(1.5)).toBeCloseTo(1.5);
    expect(applyCap(1.0)).toBeCloseTo(1.0);
  });

  it("returns dpsHardCap when combined exceeds it", () => {
    expect(applyCap(3.5)).toBeCloseTo(3.0);
    expect(applyCap(10.0)).toBeCloseTo(3.0);
    expect(applyCap(100.0)).toBeCloseTo(3.0);
  });

  it("returns exactly 3.0 when combined equals cap", () => {
    expect(applyCap(3.0)).toBeCloseTo(3.0);
  });

  it("handles values just below the cap", () => {
    expect(applyCap(2.999)).toBeCloseTo(2.999);
  });

  it("handles values just above the cap", () => {
    expect(applyCap(3.001)).toBeCloseTo(3.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § wouldExceedCap
// ════════════════════════════════════════════════════════════════

describe("wouldExceedCap", () => {
  it("returns false when combined is under cap (2.6)", () => {
    // Chrono + 火力: 1.3 × 2.0 = 2.6
    expect(wouldExceedCap(2.0, 1.3, 1.0)).toBe(false);
  });

  it("returns false when combined is exactly at cap (3.0)", () => {
    expect(wouldExceedCap(3.0, 1.0, 1.0)).toBe(false);
  });

  it("returns true when combined exceeds cap (3.9)", () => {
    // Chrono + 火力 + 炒飯: 1.3 × 2.0 × 1.5 = 3.9
    expect(wouldExceedCap(2.0, 1.3, 1.5)).toBe(true);
  });

  it("returns true when combined greatly exceeds cap", () => {
    expect(wouldExceedCap(3.0, 3.0, 3.0)).toBe(true);
  });

  it("returns false with all neutral multipliers", () => {
    expect(wouldExceedCap(1.0, 1.0, 1.0)).toBe(false);
  });
});
