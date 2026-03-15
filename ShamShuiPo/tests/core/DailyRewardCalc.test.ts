import { describe, it, expect } from "vitest";
import {
  getDefaultRewardState,
  getRewardForDay,
  canClaimToday,
  claimReward,
  isConsecutiveDay,
  getStreakBonus,
  getDaysUntilBonus,
  DAY7_BONUS_DIAMONDS,
} from "../../src/core/DailyRewardCalc";

describe("DailyRewardCalc", () => {
  // --- getDefaultRewardState ---
  describe("getDefaultRewardState", () => {
    it("returns empty lastClaimDate", () => {
      const s = getDefaultRewardState();
      expect(s.lastClaimDate).toBe("");
    });

    it("returns streak 0", () => {
      expect(getDefaultRewardState().currentStreak).toBe(0);
    });

    it("returns 0 totalDaysClaimed", () => {
      expect(getDefaultRewardState().totalDaysClaimed).toBe(0);
    });
  });

  // --- getRewardForDay ---
  describe("getRewardForDay", () => {
    it("day 1 = 50 coins", () => {
      const r = getRewardForDay(1);
      expect(r).toEqual({ day: 1, type: "coins", amount: 50, isBonus: false });
    });

    it("day 2 = 75 coins", () => {
      const r = getRewardForDay(2);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(75);
    });

    it("day 3 = 100 coins", () => {
      expect(getRewardForDay(3).amount).toBe(100);
    });

    it("day 4 = 1 diamond", () => {
      const r = getRewardForDay(4);
      expect(r.type).toBe("diamonds");
      expect(r.amount).toBe(1);
    });

    it("day 5 = 150 coins", () => {
      expect(getRewardForDay(5).amount).toBe(150);
    });

    it("day 6 = 2 diamonds", () => {
      const r = getRewardForDay(6);
      expect(r.type).toBe("diamonds");
      expect(r.amount).toBe(2);
    });

    it("day 7 = 300 coins and is bonus day", () => {
      const r = getRewardForDay(7);
      expect(r.type).toBe("coins");
      expect(r.amount).toBe(300);
      expect(r.isBonus).toBe(true);
    });

    it("day 7 bonus diamonds constant = 3", () => {
      expect(DAY7_BONUS_DIAMONDS).toBe(3);
    });

    it("day 8 wraps to day 1", () => {
      expect(getRewardForDay(8)).toEqual(getRewardForDay(1));
    });

    it("day 14 wraps to day 7", () => {
      expect(getRewardForDay(14).isBonus).toBe(true);
    });

    it("only day 7 has isBonus true", () => {
      for (let d = 1; d <= 7; d++) {
        expect(getRewardForDay(d).isBonus).toBe(d === 7);
      }
    });
  });

  // --- canClaimToday ---
  describe("canClaimToday", () => {
    it("returns true when lastClaimDate is empty", () => {
      const s = getDefaultRewardState();
      expect(canClaimToday(s, "2026-03-13")).toBe(true);
    });

    it("returns false when lastClaimDate equals today", () => {
      const s = {
        lastClaimDate: "2026-03-13",
        currentStreak: 1,
        totalDaysClaimed: 1,
      };
      expect(canClaimToday(s, "2026-03-13")).toBe(false);
    });

    it("returns true when lastClaimDate is different from today", () => {
      const s = {
        lastClaimDate: "2026-03-12",
        currentStreak: 1,
        totalDaysClaimed: 1,
      };
      expect(canClaimToday(s, "2026-03-13")).toBe(true);
    });
  });

  // --- isConsecutiveDay ---
  describe("isConsecutiveDay", () => {
    it("returns true for adjacent dates", () => {
      expect(isConsecutiveDay("2026-03-12", "2026-03-13")).toBe(true);
    });

    it("returns false for same date", () => {
      expect(isConsecutiveDay("2026-03-13", "2026-03-13")).toBe(false);
    });

    it("returns false for 2-day gap", () => {
      expect(isConsecutiveDay("2026-03-11", "2026-03-13")).toBe(false);
    });

    it("returns false for reversed dates", () => {
      expect(isConsecutiveDay("2026-03-13", "2026-03-12")).toBe(false);
    });

    it("returns false for empty lastDate", () => {
      expect(isConsecutiveDay("", "2026-03-13")).toBe(false);
    });

    it("handles month boundary (Jan 31 → Feb 1)", () => {
      expect(isConsecutiveDay("2026-01-31", "2026-02-01")).toBe(true);
    });

    it("handles month boundary (Feb 28 → Mar 1 non-leap)", () => {
      expect(isConsecutiveDay("2026-02-28", "2026-03-01")).toBe(true);
    });

    it("handles year boundary (Dec 31 → Jan 1)", () => {
      expect(isConsecutiveDay("2025-12-31", "2026-01-01")).toBe(true);
    });
  });

  // --- claimReward ---
  describe("claimReward", () => {
    it("first claim sets streak to 1", () => {
      const s = getDefaultRewardState();
      const { newState } = claimReward(s, "2026-03-13");
      expect(newState.currentStreak).toBe(1);
    });

    it("advances streak for consecutive days", () => {
      let s = getDefaultRewardState();
      s = claimReward(s, "2026-03-13").newState;
      const { newState } = claimReward(s, "2026-03-14");
      expect(newState.currentStreak).toBe(2);
    });

    it("resets streak for non-consecutive days", () => {
      const s = {
        lastClaimDate: "2026-03-11",
        currentStreak: 5,
        totalDaysClaimed: 5,
      };
      const { newState } = claimReward(s, "2026-03-13");
      expect(newState.currentStreak).toBe(1);
    });

    it("increments totalDaysClaimed", () => {
      const s = getDefaultRewardState();
      const { newState } = claimReward(s, "2026-03-13");
      expect(newState.totalDaysClaimed).toBe(1);
    });

    it("returns correct reward for the new streak day", () => {
      const s = {
        lastClaimDate: "2026-03-12",
        currentStreak: 3,
        totalDaysClaimed: 3,
      };
      const { reward } = claimReward(s, "2026-03-13");
      expect(reward).toEqual(getRewardForDay(4));
    });

    it("wraps streak from 7 back to 1", () => {
      const s = {
        lastClaimDate: "2026-03-12",
        currentStreak: 7,
        totalDaysClaimed: 7,
      };
      const { newState } = claimReward(s, "2026-03-13");
      expect(newState.currentStreak).toBe(1);
    });

    it("does not mutate original state (immutability)", () => {
      const s = getDefaultRewardState();
      const original = { ...s };
      claimReward(s, "2026-03-13");
      expect(s).toEqual(original);
    });

    it("updates lastClaimDate to today", () => {
      const s = getDefaultRewardState();
      const { newState } = claimReward(s, "2026-03-13");
      expect(newState.lastClaimDate).toBe("2026-03-13");
    });
  });

  // --- getStreakBonus ---
  describe("getStreakBonus", () => {
    it("streak 1 = 1.0x", () => expect(getStreakBonus(1)).toBe(1.0));
    it("streak 3 = 1.0x", () => expect(getStreakBonus(3)).toBe(1.0));
    it("streak 4 = 1.25x", () => expect(getStreakBonus(4)).toBe(1.25));
    it("streak 5 = 1.25x", () => expect(getStreakBonus(5)).toBe(1.25));
    it("streak 6 = 1.5x", () => expect(getStreakBonus(6)).toBe(1.5));
    it("streak 7 = 2.0x", () => expect(getStreakBonus(7)).toBe(2.0));
  });

  // --- getDaysUntilBonus ---
  describe("getDaysUntilBonus", () => {
    it("streak 0 → 7 days", () => expect(getDaysUntilBonus(0)).toBe(7));
    it("streak 1 → 6 days", () => expect(getDaysUntilBonus(1)).toBe(6));
    it("streak 6 → 1 day", () => expect(getDaysUntilBonus(6)).toBe(1));
    it("streak 7 → 0 days", () => expect(getDaysUntilBonus(7)).toBe(0));
  });
});
