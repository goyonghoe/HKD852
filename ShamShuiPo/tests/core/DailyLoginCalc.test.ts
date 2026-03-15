import { describe, it, expect } from "vitest";
import {
  createDailyLoginState,
  checkIn,
  canCheckIn,
  getRewardForDay,
  getStreakMultiplier,
  applyStreakBonus,
  isStreakBroken,
  getNextMilestone,
  getDaysUntilMilestone,
  getMonthlyProgress,
  resetMonth,
  getTotalRewardsEarned,
  getCalendarPreview,
} from "../../src/core/DailyLoginCalc";

// ════════════════════════════════════════════════════════════════
// createDailyLoginState
// ════════════════════════════════════════════════════════════════

describe("createDailyLoginState", () => {
  it("returns a fresh state with all defaults", () => {
    const s = createDailyLoginState();
    expect(s.currentDay).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.maxStreak).toBe(0);
    expect(s.lastLoginDate).toBe("");
    expect(s.totalLogins).toBe(0);
    expect(s.claimedToday).toBe(false);
    expect(s.monthlyProgress).toEqual([]);
    expect(s.currentMonth).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// getRewardForDay
// ════════════════════════════════════════════════════════════════

describe("getRewardForDay", () => {
  it("days 1-6 give 100 coins", () => {
    for (let d = 1; d <= 6; d++) {
      const r = getRewardForDay(d);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(100);
      expect(r.isBonus).toBe(false);
    }
  });

  it("day 7 gives 50 gems (weekly milestone)", () => {
    const r = getRewardForDay(7);
    expect(r.type).toBe("gems");
    expect(r.amount).toBe(50);
  });

  it("days 8-13 give 150 coins", () => {
    for (let d = 8; d <= 13; d++) {
      const r = getRewardForDay(d);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(150);
    }
  });

  it("day 14 gives weapon crate", () => {
    const r = getRewardForDay(14);
    expect(r.type).toBe("weapon_crate");
    expect(r.amount).toBe(1);
  });

  it("days 15-20 give 200 coins", () => {
    for (let d = 15; d <= 20; d++) {
      const r = getRewardForDay(d);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(200);
    }
  });

  it("day 21 gives 100 gems (3-week milestone)", () => {
    const r = getRewardForDay(21);
    expect(r.type).toBe("gems");
    expect(r.amount).toBe(100);
  });

  it("days 22-27 give 250 coins", () => {
    for (let d = 22; d <= 27; d++) {
      const r = getRewardForDay(d);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(250);
    }
  });

  it("day 28 gives premium crate (monthly milestone)", () => {
    const r = getRewardForDay(28);
    expect(r.type).toBe("premium_crate");
    expect(r.amount).toBe(1);
  });

  it("wraps around — day 29 maps to day 1", () => {
    const r = getRewardForDay(29);
    expect(r.day).toBe(1);
    expect(r.type).toBe("coins");
    expect(r.amount).toBe(100);
  });

  it("wraps around — day 56 maps to day 28", () => {
    const r = getRewardForDay(56);
    expect(r.type).toBe("premium_crate");
  });
});

// ════════════════════════════════════════════════════════════════
// getStreakMultiplier
// ════════════════════════════════════════════════════════════════

describe("getStreakMultiplier", () => {
  it("0 streak returns 0", () => {
    expect(getStreakMultiplier(0)).toBe(0);
  });

  it("1-2 streak returns 0", () => {
    expect(getStreakMultiplier(1)).toBe(0);
    expect(getStreakMultiplier(2)).toBe(0);
  });

  it("3-6 streak returns 0.25", () => {
    expect(getStreakMultiplier(3)).toBe(0.25);
    expect(getStreakMultiplier(6)).toBe(0.25);
  });

  it("7-13 streak returns 0.5", () => {
    expect(getStreakMultiplier(7)).toBe(0.5);
    expect(getStreakMultiplier(13)).toBe(0.5);
  });

  it("14-27 streak returns 0.75", () => {
    expect(getStreakMultiplier(14)).toBe(0.75);
    expect(getStreakMultiplier(27)).toBe(0.75);
  });

  it("28+ streak returns 1.0 (double)", () => {
    expect(getStreakMultiplier(28)).toBe(1.0);
    expect(getStreakMultiplier(100)).toBe(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// applyStreakBonus
// ════════════════════════════════════════════════════════════════

describe("applyStreakBonus", () => {
  it("boosts coin rewards by multiplier", () => {
    const base = {
      day: 1,
      type: "coins" as const,
      amount: 100,
      isBonus: false,
    };
    const boosted = applyStreakBonus(base, 0.5);
    expect(boosted.amount).toBe(150);
    expect(boosted.isBonus).toBe(true);
  });

  it("does not boost gem rewards", () => {
    const base = { day: 7, type: "gems" as const, amount: 50, isBonus: false };
    const result = applyStreakBonus(base, 1.0);
    expect(result.amount).toBe(50);
    expect(result.isBonus).toBe(false);
  });

  it("does not boost weapon crate", () => {
    const base = {
      day: 14,
      type: "weapon_crate" as const,
      amount: 1,
      isBonus: false,
    };
    const result = applyStreakBonus(base, 0.75);
    expect(result.amount).toBe(1);
  });

  it("does not boost premium crate", () => {
    const base = {
      day: 28,
      type: "premium_crate" as const,
      amount: 1,
      isBonus: false,
    };
    const result = applyStreakBonus(base, 1.0);
    expect(result.amount).toBe(1);
  });

  it("returns original reward when multiplier is 0", () => {
    const base = {
      day: 1,
      type: "coins" as const,
      amount: 100,
      isBonus: false,
    };
    const result = applyStreakBonus(base, 0);
    expect(result.amount).toBe(100);
    expect(result.isBonus).toBe(false);
  });

  it("floors fractional bonus amounts", () => {
    const base = {
      day: 1,
      type: "coins" as const,
      amount: 100,
      isBonus: false,
    };
    const result = applyStreakBonus(base, 0.25);
    expect(result.amount).toBe(125);
  });

  it("floors odd coin amounts correctly", () => {
    const base = {
      day: 8,
      type: "coins" as const,
      amount: 150,
      isBonus: false,
    };
    const result = applyStreakBonus(base, 0.25);
    // 150 * 0.25 = 37.5 → floor to 37 → 187
    expect(result.amount).toBe(187);
  });
});

// ════════════════════════════════════════════════════════════════
// isStreakBroken
// ════════════════════════════════════════════════════════════════

describe("isStreakBroken", () => {
  it("returns false when no previous login", () => {
    expect(isStreakBroken("", "2026-03-13")).toBe(false);
  });

  it("returns false for consecutive days", () => {
    expect(isStreakBroken("2026-03-12", "2026-03-13")).toBe(false);
  });

  it("returns false for same day", () => {
    expect(isStreakBroken("2026-03-13", "2026-03-13")).toBe(false);
  });

  it("returns true for 2-day gap", () => {
    expect(isStreakBroken("2026-03-11", "2026-03-13")).toBe(true);
  });

  it("returns true for large gap", () => {
    expect(isStreakBroken("2026-01-01", "2026-03-13")).toBe(true);
  });

  it("handles month boundary correctly", () => {
    expect(isStreakBroken("2026-02-28", "2026-03-01")).toBe(false);
  });

  it("detects break across month boundary", () => {
    expect(isStreakBroken("2026-02-27", "2026-03-01")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// canCheckIn
// ════════════════════════════════════════════════════════════════

describe("canCheckIn", () => {
  it("returns true for fresh state", () => {
    const s = createDailyLoginState();
    expect(canCheckIn(s, "2026-03-13")).toBe(true);
  });

  it("returns false if already claimed today", () => {
    const s = {
      ...createDailyLoginState(),
      claimedToday: true,
      lastLoginDate: "2026-03-13",
    };
    expect(canCheckIn(s, "2026-03-13")).toBe(false);
  });

  it("returns true for a new day even if claimedToday was true", () => {
    const s = {
      ...createDailyLoginState(),
      claimedToday: true,
      lastLoginDate: "2026-03-12",
    };
    expect(canCheckIn(s, "2026-03-13")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// checkIn
// ════════════════════════════════════════════════════════════════

describe("checkIn", () => {
  it("first check-in sets day 1, streak 1", () => {
    const s = createDailyLoginState();
    const result = checkIn(s, "2026-03-13");
    expect(result.state.currentDay).toBe(1);
    expect(result.state.streak).toBe(1);
    expect(result.state.totalLogins).toBe(1);
    expect(result.state.claimedToday).toBe(true);
    expect(result.state.lastLoginDate).toBe("2026-03-13");
  });

  it("consecutive logins build streak", () => {
    let s = createDailyLoginState();
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    s = checkIn(s, "2026-03-03").state;
    expect(s.streak).toBe(3);
    expect(s.currentDay).toBe(3);
  });

  it("broken streak resets to 1", () => {
    let s = createDailyLoginState();
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    // skip March 3
    s = checkIn(s, "2026-03-04").state;
    expect(s.streak).toBe(1);
    expect(s.currentDay).toBe(3); // still day 3 in calendar
  });

  it("maxStreak tracks the highest streak", () => {
    let s = createDailyLoginState();
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    s = checkIn(s, "2026-03-03").state;
    expect(s.maxStreak).toBe(3);
    // break streak
    s = checkIn(s, "2026-03-05").state;
    expect(s.streak).toBe(1);
    expect(s.maxStreak).toBe(3); // preserved
  });

  it("throws if already checked in today", () => {
    const s = checkIn(createDailyLoginState(), "2026-03-13").state;
    expect(() => checkIn(s, "2026-03-13")).toThrow("Already checked in today");
  });

  it("applies streak bonus to coin rewards at 3-day streak", () => {
    let s = createDailyLoginState();
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    const result = checkIn(s, "2026-03-03");
    // Day 3 = 100 coins, 3-streak = +25% = 125
    expect(result.reward.amount).toBe(125);
    expect(result.reward.isBonus).toBe(true);
    expect(result.streakBonus).toBe(0.25);
  });

  it("does not apply streak bonus to gem milestones", () => {
    let s = createDailyLoginState();
    // Login days 1-7 consecutively
    for (let i = 1; i <= 6; i++) {
      s = checkIn(s, `2026-03-0${i}`).state;
    }
    const result = checkIn(s, "2026-03-07");
    // Day 7 = 50 gems, streak bonus should NOT apply
    expect(result.reward.type).toBe("gems");
    expect(result.reward.amount).toBe(50);
  });

  it("monthly progress tracks claimed days", () => {
    let s = createDailyLoginState();
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    expect(s.monthlyProgress).toEqual([1, 2]);
  });

  it("wraps calendar day after 28", () => {
    let s = createDailyLoginState();
    // Simulate 28 consecutive days
    for (let i = 1; i <= 28; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      s = checkIn(s, `2026-03-${day}`).state;
    }
    expect(s.currentDay).toBe(28);
    // Day 29 wraps to day 1
    const result = checkIn(s, "2026-03-29");
    expect(result.state.currentDay).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// getNextMilestone
// ════════════════════════════════════════════════════════════════

describe("getNextMilestone", () => {
  it("from day 1, next milestone is 7", () => {
    expect(getNextMilestone(1)).toBe(7);
  });

  it("from day 7, next milestone is 14", () => {
    expect(getNextMilestone(7)).toBe(14);
  });

  it("from day 14, next milestone is 21", () => {
    expect(getNextMilestone(14)).toBe(21);
  });

  it("from day 21, next milestone is 28", () => {
    expect(getNextMilestone(21)).toBe(28);
  });

  it("from day 28, wraps to 7", () => {
    expect(getNextMilestone(28)).toBe(7);
  });

  it("from day 10, next milestone is 14", () => {
    expect(getNextMilestone(10)).toBe(14);
  });
});

// ════════════════════════════════════════════════════════════════
// getDaysUntilMilestone
// ════════════════════════════════════════════════════════════════

describe("getDaysUntilMilestone", () => {
  it("day 1 → 6 days to milestone 7", () => {
    expect(getDaysUntilMilestone(1)).toBe(6);
  });

  it("day 6 → 1 day to milestone 7", () => {
    expect(getDaysUntilMilestone(6)).toBe(1);
  });

  it("day 7 → 7 days to milestone 14", () => {
    expect(getDaysUntilMilestone(7)).toBe(7);
  });

  it("day 27 → 1 day to milestone 28", () => {
    expect(getDaysUntilMilestone(27)).toBe(1);
  });

  it("day 28 → wraps, 7 days to next milestone", () => {
    expect(getDaysUntilMilestone(28)).toBe(7);
  });
});

// ════════════════════════════════════════════════════════════════
// getMonthlyProgress
// ════════════════════════════════════════════════════════════════

describe("getMonthlyProgress", () => {
  it("returns 0 for fresh state", () => {
    expect(getMonthlyProgress(createDailyLoginState())).toBe(0);
  });

  it("returns correct fraction", () => {
    const s = {
      ...createDailyLoginState(),
      monthlyProgress: [1, 2, 3, 4, 5, 6, 7],
    };
    expect(getMonthlyProgress(s)).toBe(7 / 28);
    expect(getMonthlyProgress(s)).toBeCloseTo(0.25);
  });

  it("returns 1.0 for full month", () => {
    const progress = Array.from({ length: 28 }, (_, i) => i + 1);
    const s = { ...createDailyLoginState(), monthlyProgress: progress };
    expect(getMonthlyProgress(s)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// resetMonth
// ════════════════════════════════════════════════════════════════

describe("resetMonth", () => {
  it("resets currentDay and progress but increments month", () => {
    const s = {
      ...createDailyLoginState(),
      currentDay: 28,
      streak: 10,
      maxStreak: 15,
      totalLogins: 28,
      monthlyProgress: Array.from({ length: 28 }, (_, i) => i + 1),
      currentMonth: 1,
    };
    const reset = resetMonth(s);
    expect(reset.currentDay).toBe(0);
    expect(reset.monthlyProgress).toEqual([]);
    expect(reset.currentMonth).toBe(2);
    expect(reset.claimedToday).toBe(false);
    // preserves streak and totals
    expect(reset.streak).toBe(10);
    expect(reset.maxStreak).toBe(15);
    expect(reset.totalLogins).toBe(28);
  });

  it("does not mutate original state", () => {
    const s = createDailyLoginState();
    const reset = resetMonth(s);
    expect(s.currentMonth).toBe(1);
    expect(reset.currentMonth).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// getTotalRewardsEarned
// ════════════════════════════════════════════════════════════════

describe("getTotalRewardsEarned", () => {
  it("returns zeros for fresh state", () => {
    const totals = getTotalRewardsEarned(createDailyLoginState());
    expect(totals).toEqual({
      coins: 0,
      gems: 0,
      weaponCrates: 0,
      premiumCrates: 0,
    });
  });

  it("tallies first 7 days correctly", () => {
    const s = {
      ...createDailyLoginState(),
      monthlyProgress: [1, 2, 3, 4, 5, 6, 7],
    };
    const totals = getTotalRewardsEarned(s);
    // 6 * 100 coins + 50 gems
    expect(totals.coins).toBe(600);
    expect(totals.gems).toBe(50);
    expect(totals.weaponCrates).toBe(0);
    expect(totals.premiumCrates).toBe(0);
  });

  it("tallies full month correctly", () => {
    const progress = Array.from({ length: 28 }, (_, i) => i + 1);
    const s = { ...createDailyLoginState(), monthlyProgress: progress };
    const totals = getTotalRewardsEarned(s);
    // coins: 6*100 + 6*150 + 6*200 + 6*250 = 600+900+1200+1500 = 4200
    expect(totals.coins).toBe(4200);
    // gems: 50 + 100 = 150
    expect(totals.gems).toBe(150);
    expect(totals.weaponCrates).toBe(1);
    expect(totals.premiumCrates).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// getCalendarPreview
// ════════════════════════════════════════════════════════════════

describe("getCalendarPreview", () => {
  it("returns 7 rewards", () => {
    const preview = getCalendarPreview(0);
    expect(preview).toHaveLength(7);
  });

  it("from day 0, shows days 1-7", () => {
    const preview = getCalendarPreview(0);
    expect(preview[0].day).toBe(1);
    expect(preview[6].day).toBe(7);
    expect(preview[6].type).toBe("gems");
  });

  it("from day 5, shows days 6-12", () => {
    const preview = getCalendarPreview(5);
    expect(preview[0].day).toBe(6);
    expect(preview[0].type).toBe("coins");
    expect(preview[1].day).toBe(7);
    expect(preview[1].type).toBe("gems");
  });

  it("wraps around end of cycle", () => {
    const preview = getCalendarPreview(25);
    // days 26, 27, 28, 1, 2, 3, 4
    expect(preview[0].day).toBe(26);
    expect(preview[2].day).toBe(28);
    expect(preview[2].type).toBe("premium_crate");
    expect(preview[3].day).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// Integration / Edge Cases
// ════════════════════════════════════════════════════════════════

describe("integration", () => {
  it("full 28-day consecutive login cycle", () => {
    let s = createDailyLoginState();
    for (let i = 1; i <= 28; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      const result = checkIn(s, `2026-03-${day}`);
      s = result.state;
    }
    expect(s.totalLogins).toBe(28);
    expect(s.streak).toBe(28);
    expect(s.maxStreak).toBe(28);
    expect(s.currentDay).toBe(28);
    expect(s.monthlyProgress).toHaveLength(28);
    expect(getMonthlyProgress(s)).toBe(1);
  });

  it("reset month then continue streak into new cycle", () => {
    let s = createDailyLoginState();
    // 3 logins
    s = checkIn(s, "2026-03-01").state;
    s = checkIn(s, "2026-03-02").state;
    s = checkIn(s, "2026-03-03").state;
    expect(s.streak).toBe(3);
    // reset
    s = resetMonth(s);
    expect(s.currentDay).toBe(0);
    expect(s.currentMonth).toBe(2);
    // continue next day — streak preserved
    s = checkIn(s, "2026-03-04").state;
    expect(s.streak).toBe(4);
    expect(s.currentDay).toBe(1);
  });

  it("immutability — checkIn does not mutate original state", () => {
    const original = createDailyLoginState();
    const result = checkIn(original, "2026-03-13");
    expect(original.currentDay).toBe(0);
    expect(original.totalLogins).toBe(0);
    expect(result.state.currentDay).toBe(1);
  });
});
