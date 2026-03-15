// ── Tests: EndlessModeCalc ──

import { describe, it, expect } from "vitest";
import {
  getEndlessScaling,
  getEndlessEnemyHp,
  getEndlessEnemyDamage,
  getEndlessSpawnRate,
  calculateEndlessReward,
  getEndlessRank,
  getNextMilestone,
  isEndlessUnlocked,
  type EndlessConfig,
  type EndlessReward,
} from "../../src/core/EndlessModeCalc";

// ════════════════════════════════════════════════════════════════
// § getEndlessScaling
// ════════════════════════════════════════════════════════════════

describe("getEndlessScaling", () => {
  it("returns base multipliers (all 1.0) at minute 0", () => {
    const s = getEndlessScaling(0);
    expect(s.baseHpMultiplier).toBe(1.0);
    expect(s.baseDamageMultiplier).toBe(1.0);
    expect(s.baseSpeedMultiplier).toBe(1.0);
    expect(s.spawnRateMultiplier).toBe(1.0);
  });

  it("returns base multipliers at minute 10 (endless hasn't started)", () => {
    const s = getEndlessScaling(10);
    expect(s.baseHpMultiplier).toBe(1.0);
    expect(s.baseDamageMultiplier).toBe(1.0);
    expect(s.baseSpeedMultiplier).toBe(1.0);
    expect(s.spawnRateMultiplier).toBe(1.0);
  });

  it("scales HP +15% per minute beyond 10", () => {
    const s = getEndlessScaling(15);
    // 5 minutes past 10 → 1 + 5 * 0.15 = 1.75
    expect(s.baseHpMultiplier).toBeCloseTo(1.75);
  });

  it("scales damage +10% per minute beyond 10", () => {
    const s = getEndlessScaling(15);
    // 5 * 0.10 = 0.50 → 1.50
    expect(s.baseDamageMultiplier).toBeCloseTo(1.5);
  });

  it("scales speed +5% per minute beyond 10, capped at 3x", () => {
    const s = getEndlessScaling(15);
    // 5 * 0.05 = 0.25 → 1.25
    expect(s.baseSpeedMultiplier).toBeCloseTo(1.25);
  });

  it("caps speed multiplier at 3.0", () => {
    // Need 40 endless minutes to hit cap: 1 + 40 * 0.05 = 3.0
    const s = getEndlessScaling(50);
    expect(s.baseSpeedMultiplier).toBe(3.0);

    // Beyond cap: still 3.0
    const s2 = getEndlessScaling(100);
    expect(s2.baseSpeedMultiplier).toBe(3.0);
  });

  it("scales spawn rate +8% per minute beyond 10", () => {
    const s = getEndlessScaling(20);
    // 10 * 0.08 = 0.80 → 1.80
    expect(s.spawnRateMultiplier).toBeCloseTo(1.8);
  });

  it("clamps negative minutes to 0", () => {
    const s = getEndlessScaling(-5);
    expect(s.baseHpMultiplier).toBe(1.0);
    expect(s.minutesPassed).toBe(0);
  });

  it("stores minutesPassed correctly", () => {
    expect(getEndlessScaling(25).minutesPassed).toBe(25);
    expect(getEndlessScaling(0).minutesPassed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEndlessEnemyHp
// ════════════════════════════════════════════════════════════════

describe("getEndlessEnemyHp", () => {
  it("returns base HP at minute 10 or below", () => {
    expect(getEndlessEnemyHp(100, 10)).toBe(100);
    expect(getEndlessEnemyHp(100, 5)).toBe(100);
  });

  it("scales HP at minute 15", () => {
    // 1.75x → 175
    expect(getEndlessEnemyHp(100, 15)).toBe(175);
  });

  it("rounds to nearest integer", () => {
    // 50 * 1.15 = 57.5 → Math.round(57.5) = 58
    // (JS rounds .5 up for positive numbers)
    // Actual: 50 * (1 + 1*0.15) = 57.50000000000001 → 58
    // But due to floating point: 50 * 1.15 = 57.49999... → 57
    expect(getEndlessEnemyHp(50, 11)).toBe(57);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEndlessEnemyDamage
// ════════════════════════════════════════════════════════════════

describe("getEndlessEnemyDamage", () => {
  it("returns base damage at minute 10 or below", () => {
    expect(getEndlessEnemyDamage(20, 10)).toBe(20);
  });

  it("scales damage at minute 20", () => {
    // 10 minutes past → 1 + 10 * 0.10 = 2.0 → 20 * 2.0 = 40
    expect(getEndlessEnemyDamage(20, 20)).toBe(40);
  });

  it("rounds to nearest integer", () => {
    // 15 * 1.1 = 16.5 → 17
    expect(getEndlessEnemyDamage(15, 11)).toBe(17);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEndlessSpawnRate
// ════════════════════════════════════════════════════════════════

describe("getEndlessSpawnRate", () => {
  it("returns base rate at minute 10 or below", () => {
    expect(getEndlessSpawnRate(2.0, 10)).toBe(2.0);
  });

  it("scales spawn rate at minute 20", () => {
    // 10 * 0.08 = 0.80 → 1.80 → 2.0 * 1.80 = 3.6
    expect(getEndlessSpawnRate(2.0, 20)).toBeCloseTo(3.6);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEndlessRank
// ════════════════════════════════════════════════════════════════

describe("getEndlessRank", () => {
  it("returns Bronze for < 15 minutes", () => {
    expect(getEndlessRank(0)).toBe("Bronze");
    expect(getEndlessRank(14)).toBe("Bronze");
    expect(getEndlessRank(14.9)).toBe("Bronze");
  });

  it("returns Silver for 15-19 minutes", () => {
    expect(getEndlessRank(15)).toBe("Silver");
    expect(getEndlessRank(19)).toBe("Silver");
  });

  it("returns Gold for 20-24 minutes", () => {
    expect(getEndlessRank(20)).toBe("Gold");
    expect(getEndlessRank(24)).toBe("Gold");
  });

  it("returns Diamond for 25-29 minutes", () => {
    expect(getEndlessRank(25)).toBe("Diamond");
    expect(getEndlessRank(29)).toBe("Diamond");
  });

  it("returns Master for 30-39 minutes", () => {
    expect(getEndlessRank(30)).toBe("Master");
    expect(getEndlessRank(39)).toBe("Master");
  });

  it("returns Legend for 40+ minutes", () => {
    expect(getEndlessRank(40)).toBe("Legend");
    expect(getEndlessRank(999)).toBe("Legend");
  });

  it("clamps negative to Bronze", () => {
    expect(getEndlessRank(-5)).toBe("Bronze");
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateEndlessReward
// ════════════════════════════════════════════════════════════════

describe("calculateEndlessReward", () => {
  it("calculates coins from time + kills + bosses", () => {
    // 20 min * 10 + 100 kills * 2 + 2 bosses * 50 = 200 + 200 + 100 = 500
    const r = calculateEndlessReward(20, 100, 2);
    expect(r.coins).toBe(500);
  });

  it("awards diamonds for reached milestones", () => {
    // At 20 min: 15-min milestone (5) + 20-min milestone (15) = 20
    const r = calculateEndlessReward(20, 0, 0);
    expect(r.diamonds).toBe(20);
  });

  it("awards no diamonds before 15 minutes", () => {
    const r = calculateEndlessReward(14, 0, 0);
    expect(r.diamonds).toBe(0);
  });

  it("awards all diamonds at 40+ minutes", () => {
    // 5 + 15 + 50 + 100 = 170
    const r = calculateEndlessReward(40, 0, 0);
    expect(r.diamonds).toBe(170);
  });

  it("calculates bonus XP from endless minutes + bosses", () => {
    // 20 min → 10 endless min * 50 = 500, + 3 bosses * 100 = 300 → 800
    const r = calculateEndlessReward(20, 0, 3);
    expect(r.bonusXp).toBe(800);
  });

  it("sets correct rank", () => {
    expect(calculateEndlessReward(14, 0, 0).rank).toBe("Bronze");
    expect(calculateEndlessReward(25, 0, 0).rank).toBe("Diamond");
    expect(calculateEndlessReward(40, 0, 0).rank).toBe("Legend");
  });

  it("handles zero values", () => {
    const r = calculateEndlessReward(0, 0, 0);
    expect(r.coins).toBe(0);
    expect(r.diamonds).toBe(0);
    expect(r.bonusXp).toBe(0);
    expect(r.rank).toBe("Bronze");
  });
});

// ════════════════════════════════════════════════════════════════
// § getNextMilestone
// ════════════════════════════════════════════════════════════════

describe("getNextMilestone", () => {
  it("returns 15-min milestone at start", () => {
    const m = getNextMilestone(0);
    expect(m.minute).toBe(15);
    expect(m.reward).toContain("5 diamonds");
  });

  it("returns 20-min milestone after passing 15", () => {
    const m = getNextMilestone(15);
    expect(m.minute).toBe(20);
  });

  it("returns 30-min milestone after passing 20", () => {
    const m = getNextMilestone(20);
    expect(m.minute).toBe(30);
  });

  it("returns 40-min milestone after passing 30", () => {
    const m = getNextMilestone(30);
    expect(m.minute).toBe(40);
  });

  it("returns last milestone with (completed) when all passed", () => {
    const m = getNextMilestone(45);
    expect(m.minute).toBe(40);
    expect(m.reward).toContain("(completed)");
  });
});

// ════════════════════════════════════════════════════════════════
// § isEndlessUnlocked
// ════════════════════════════════════════════════════════════════

describe("isEndlessUnlocked", () => {
  it("returns false with insufficient runs", () => {
    expect(isEndlessUnlocked(4, 10000)).toBe(false);
  });

  it("returns false with insufficient score", () => {
    expect(isEndlessUnlocked(10, 4999)).toBe(false);
  });

  it("returns false with both insufficient", () => {
    expect(isEndlessUnlocked(0, 0)).toBe(false);
  });

  it("returns true at exact thresholds", () => {
    expect(isEndlessUnlocked(5, 5000)).toBe(true);
  });

  it("returns true above thresholds", () => {
    expect(isEndlessUnlocked(100, 99999)).toBe(true);
  });
});
