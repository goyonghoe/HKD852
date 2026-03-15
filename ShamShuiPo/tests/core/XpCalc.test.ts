// ── Tests: XpCalc ──

import { describe, it, expect } from "vitest";
import {
  getXpForLevel,
  addXp,
  getXpGemValue,
  getBossXpValue,
} from "../../src/core/XpCalc";
import { XP_THRESHOLDS, XP_GEM } from "../../src/config/balance";

describe("getXpForLevel", () => {
  it("returns correct threshold for level 1", () => {
    expect(getXpForLevel(1)).toBe(XP_THRESHOLDS[0]);
  });

  it("returns correct threshold for level 15 (max)", () => {
    expect(getXpForLevel(15)).toBe(XP_THRESHOLDS[14]);
  });

  it("returns Infinity for level beyond max", () => {
    expect(getXpForLevel(16)).toBe(Infinity);
    expect(getXpForLevel(100)).toBe(Infinity);
  });

  it("returns Infinity for level 0 or negative", () => {
    expect(getXpForLevel(0)).toBe(Infinity);
    expect(getXpForLevel(-1)).toBe(Infinity);
  });

  it("thresholds are monotonically increasing", () => {
    for (let i = 2; i <= XP_THRESHOLDS.length; i++) {
      expect(getXpForLevel(i)).toBeGreaterThan(getXpForLevel(i - 1));
    }
  });
});

describe("addXp", () => {
  it("adds XP without leveling up when below threshold", () => {
    const result = addXp(0, 5);
    expect(result.levelsGained).toBe(0);
    expect(result.newXp).toBe(5);
  });

  it("triggers a level up when XP reaches threshold", () => {
    const threshold = XP_THRESHOLDS[0]; // level 1 threshold = 8
    const result = addXp(0, threshold);
    expect(result.levelsGained).toBe(1);
    expect(result.newXp).toBe(0);
  });

  it("carries over excess XP after level up", () => {
    const threshold = XP_THRESHOLDS[0]; // 8
    const result = addXp(0, threshold + 3);
    expect(result.levelsGained).toBe(1);
    expect(result.newXp).toBe(3);
  });

  it("applies XP bonus correctly", () => {
    // With 50% bonus, 6 XP becomes 9; threshold is 8
    const result = addXp(0, 6, 0.5);
    expect(result.levelsGained).toBe(1);
    expect(result.newXp).toBeCloseTo(1);
  });

  it("adds to existing XP", () => {
    const result = addXp(3, 2);
    expect(result.levelsGained).toBe(0);
    expect(result.newXp).toBe(5);
  });

  it("handles zero amount", () => {
    const result = addXp(5, 0);
    expect(result.levelsGained).toBe(0);
    expect(result.newXp).toBe(5);
  });

  it("only gains one level per call (safety break)", () => {
    const result = addXp(0, 1000);
    expect(result.levelsGained).toBe(1);
  });
});

describe("getXpGemValue", () => {
  it("returns small value for tier 1", () => {
    expect(getXpGemValue(1)).toBe(XP_GEM.small);
  });

  it("returns medium value for tier 2", () => {
    expect(getXpGemValue(2)).toBe(XP_GEM.medium);
  });

  it("returns large value for tier 3", () => {
    expect(getXpGemValue(3)).toBe(XP_GEM.large);
  });

  it("defaults to small for unknown tier", () => {
    expect(getXpGemValue(0)).toBe(XP_GEM.small);
    expect(getXpGemValue(99)).toBe(XP_GEM.small);
  });

  it("gem values increase with tier", () => {
    expect(getXpGemValue(2)).toBeGreaterThan(getXpGemValue(1));
    expect(getXpGemValue(3)).toBeGreaterThan(getXpGemValue(2));
  });
});

describe("getBossXpValue", () => {
  it("returns large gem value", () => {
    expect(getBossXpValue()).toBe(XP_GEM.large);
  });

  it("is greater than tier 1 and tier 2 drops", () => {
    expect(getBossXpValue()).toBeGreaterThan(getXpGemValue(1));
    expect(getBossXpValue()).toBeGreaterThan(getXpGemValue(2));
  });
});
