import { describe, it, expect } from "vitest";
import {
  getRegenRate,
  calculateRegenTick,
  getRegenEfficiency,
  getTimeToFullHp,
} from "../../src/core/RegenCalc";

// ════════════════════════════════════════════════════════════════
// § getRegenRate
// ════════════════════════════════════════════════════════════════

describe("getRegenRate", () => {
  it("returns 0 when no passive is equipped (level 0)", () => {
    expect(getRegenRate(0, 0)).toBe(0);
  });

  it("returns 0.5 HP/sec at passive level 1", () => {
    expect(getRegenRate(1, 0)).toBe(0.5);
  });

  it("returns 4.0 HP/sec at passive level 5", () => {
    expect(getRegenRate(5, 0)).toBe(4.0);
  });

  it("adds bonus regen to passive value", () => {
    // Level 3 = 1.5, bonus = 2.0 → 3.5
    expect(getRegenRate(3, 2.0)).toBe(3.5);
  });

  it("returns only bonus regen when passive level is 0", () => {
    expect(getRegenRate(0, 1.5)).toBe(1.5);
  });

  it("treats out-of-range levels (negative, >5) as 0 passive", () => {
    expect(getRegenRate(-1, 0)).toBe(0);
    expect(getRegenRate(6, 0)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateRegenTick
// ════════════════════════════════════════════════════════════════

describe("calculateRegenTick", () => {
  it("heals correctly over one tick", () => {
    // 50 HP, 100 max, 2 HP/sec, 0.5s delta → 50 + 1 = 51
    expect(calculateRegenTick(50, 100, 2, 0.5)).toBe(51);
  });

  it("caps HP at maxHp", () => {
    // 98 HP, 100 max, 10 HP/sec, 1s delta → would be 108, capped to 100
    expect(calculateRegenTick(98, 100, 10, 1)).toBe(100);
  });

  it("does not regen when already at full HP", () => {
    expect(calculateRegenTick(100, 100, 5, 1)).toBe(100);
  });

  it("scales correctly with delta time", () => {
    // 0 HP, 100 max, 4 HP/sec, 0.016s (~60fps) → 0.064
    const result = calculateRegenTick(0, 100, 4, 0.016);
    expect(result).toBeCloseTo(0.064, 5);
  });

  it("handles zero regen rate", () => {
    expect(calculateRegenTick(50, 100, 0, 1)).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRegenEfficiency
// ════════════════════════════════════════════════════════════════

describe("getRegenEfficiency", () => {
  it("returns 0.5 at half HP", () => {
    expect(getRegenEfficiency(50, 100)).toBe(0.5);
  });

  it("returns 0 at full HP", () => {
    expect(getRegenEfficiency(100, 100)).toBe(0);
  });

  it("returns 1 at 0 HP", () => {
    expect(getRegenEfficiency(0, 100)).toBe(1);
  });

  it("returns 0 when maxHp is 0 (edge case)", () => {
    expect(getRegenEfficiency(0, 0)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTimeToFullHp
// ════════════════════════════════════════════════════════════════

describe("getTimeToFullHp", () => {
  it("calculates time to full from half HP", () => {
    // 50 HP missing, 2 HP/sec → 25 seconds
    expect(getTimeToFullHp(50, 100, 2)).toBe(25);
  });

  it("returns 0 when already at full HP", () => {
    expect(getTimeToFullHp(100, 100, 5)).toBe(0);
  });

  it("returns Infinity when regen is 0", () => {
    expect(getTimeToFullHp(50, 100, 0)).toBe(Infinity);
  });

  it("returns Infinity when regen is negative", () => {
    expect(getTimeToFullHp(50, 100, -1)).toBe(Infinity);
  });
});
