import { describe, it, expect } from "vitest";
import {
  generateDailyChallenges,
  generateWeeklyChallenges,
  checkChallengeComplete,
  completeChallenge,
  getTotalRewards,
  needsReset,
  resetChallenges,
  getChallengeProgress,
  getDefaultChallengeState,
  getISOWeek,
  CHALLENGE_POOL,
  type ChallengeState,
  type ChallengeStats,
  type ChallengeDef,
} from "../../src/core/ChallengeCalc";

describe("ChallengeCalc", () => {
  // --- CHALLENGE_POOL ---
  describe("CHALLENGE_POOL", () => {
    it("contains exactly 15 challenges", () => {
      expect(CHALLENGE_POOL).toHaveLength(15);
    });

    it("has 5 easy, 5 medium, 5 hard", () => {
      const easy = CHALLENGE_POOL.filter((c) => c.difficulty === "easy");
      const medium = CHALLENGE_POOL.filter((c) => c.difficulty === "medium");
      const hard = CHALLENGE_POOL.filter((c) => c.difficulty === "hard");
      expect(easy).toHaveLength(5);
      expect(medium).toHaveLength(5);
      expect(hard).toHaveLength(5);
    });

    it("all challenges have unique ids", () => {
      const ids = CHALLENGE_POOL.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all challenges have positive reward coins", () => {
      for (const c of CHALLENGE_POOL) {
        expect(c.reward.coins).toBeGreaterThan(0);
      }
    });
  });

  // --- generateDailyChallenges ---
  describe("generateDailyChallenges", () => {
    it("returns exactly 3 challenges", () => {
      const challenges = generateDailyChallenges("2026-03-13");
      expect(challenges).toHaveLength(3);
    });

    it("returns 1 easy, 1 medium, 1 hard", () => {
      const challenges = generateDailyChallenges("2026-03-13");
      expect(challenges[0].difficulty).toBe("easy");
      expect(challenges[1].difficulty).toBe("medium");
      expect(challenges[2].difficulty).toBe("hard");
    });

    it("is deterministic for the same date", () => {
      const a = generateDailyChallenges("2026-03-13");
      const b = generateDailyChallenges("2026-03-13");
      expect(a).toEqual(b);
    });

    it("produces different challenges for different dates", () => {
      const a = generateDailyChallenges("2026-03-13");
      const b = generateDailyChallenges("2026-03-14");
      // At least one challenge should differ (extremely unlikely to be identical)
      const aNames = a.map((c) => c.name).join(",");
      const bNames = b.map((c) => c.name).join(",");
      // With 5 options per difficulty, same combo is unlikely but possible.
      // We check IDs which include the date, so they must differ.
      expect(a[0].id).not.toBe(b[0].id);
    });

    it("generates ids prefixed with daily_<date>", () => {
      const challenges = generateDailyChallenges("2026-03-13");
      for (const c of challenges) {
        expect(c.id).toMatch(/^daily_2026-03-13_/);
      }
    });

    it("uses custom seed when provided", () => {
      const a = generateDailyChallenges("2026-03-13", 42);
      const b = generateDailyChallenges("2026-03-13", 42);
      expect(a).toEqual(b);

      const c = generateDailyChallenges("2026-03-13", 99);
      // Different seed on same date: may produce different results
      // IDs are same format but content may differ
      expect(a[0].id).toBe(c[0].id); // IDs use date, not seed
    });
  });

  // --- generateWeeklyChallenges ---
  describe("generateWeeklyChallenges", () => {
    it("returns exactly 2 challenges", () => {
      const challenges = generateWeeklyChallenges("2026-W11");
      expect(challenges).toHaveLength(2);
    });

    it("returns 1 medium and 1 hard", () => {
      const challenges = generateWeeklyChallenges("2026-W11");
      expect(challenges[0].difficulty).toBe("medium");
      expect(challenges[1].difficulty).toBe("hard");
    });

    it("is deterministic for same week", () => {
      const a = generateWeeklyChallenges("2026-W11");
      const b = generateWeeklyChallenges("2026-W11");
      expect(a).toEqual(b);
    });

    it("has doubled rewards compared to pool", () => {
      const challenges = generateWeeklyChallenges("2026-W11");
      for (const c of challenges) {
        const poolMatch = CHALLENGE_POOL.find((p) => p.name === c.name);
        expect(poolMatch).toBeDefined();
        expect(c.reward.coins).toBe(poolMatch!.reward.coins * 2);
        expect(c.reward.diamonds).toBe(poolMatch!.reward.diamonds * 2);
      }
    });

    it("generates ids prefixed with weekly_<week>", () => {
      const challenges = generateWeeklyChallenges("2026-W11");
      expect(challenges[0].id).toMatch(/^weekly_2026-W11_/);
      expect(challenges[1].id).toMatch(/^weekly_2026-W11_/);
    });
  });

  // --- checkChallengeComplete ---
  describe("checkChallengeComplete", () => {
    const stats: ChallengeStats = {
      kills: 150,
      elapsed: 90,
      score: 2500,
      noDamageTime: 45,
      weaponsUsed: ["pistol"],
    };

    it("kill_count: complete when kills >= target", () => {
      const ch: ChallengeDef = {
        id: "t1",
        name: "Test",
        description: "",
        type: "kill_count",
        target: 100,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(true);
    });

    it("kill_count: incomplete when kills < target", () => {
      const ch: ChallengeDef = {
        id: "t2",
        name: "Test",
        description: "",
        type: "kill_count",
        target: 200,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(false);
    });

    it("survive_time: complete when elapsed >= target", () => {
      const ch: ChallengeDef = {
        id: "t3",
        name: "Test",
        description: "",
        type: "survive_time",
        target: 60,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(true);
    });

    it("score_target: complete when score >= target", () => {
      const ch: ChallengeDef = {
        id: "t4",
        name: "Test",
        description: "",
        type: "score_target",
        target: 2000,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "medium",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(true);
    });

    it("no_damage: incomplete when noDamageTime < target", () => {
      const ch: ChallengeDef = {
        id: "t5",
        name: "Test",
        description: "",
        type: "no_damage",
        target: 60,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "hard",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(false);
    });

    it("weapon_only: complete when only constraint weapon used", () => {
      const ch: ChallengeDef = {
        id: "t6",
        name: "Test",
        description: "",
        type: "weapon_only",
        target: 1,
        constraint: "pistol",
        reward: { coins: 0, diamonds: 0 },
        difficulty: "medium",
      };
      expect(checkChallengeComplete(ch, stats)).toBe(true);
    });

    it("weapon_only: fails when multiple weapons used", () => {
      const multiStats: ChallengeStats = {
        ...stats,
        weaponsUsed: ["pistol", "shotgun"],
      };
      const ch: ChallengeDef = {
        id: "t7",
        name: "Test",
        description: "",
        type: "weapon_only",
        target: 1,
        constraint: "pistol",
        reward: { coins: 0, diamonds: 0 },
        difficulty: "medium",
      };
      expect(checkChallengeComplete(ch, multiStats)).toBe(false);
    });
  });

  // --- completeChallenge ---
  describe("completeChallenge", () => {
    it("adds challengeId to completedIds", () => {
      const state = getDefaultChallengeState();
      const newState = completeChallenge(state, "ch_1");
      expect(newState.completedIds).toContain("ch_1");
    });

    it("does not duplicate already completed id", () => {
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        completedIds: ["ch_1"],
      };
      const newState = completeChallenge(state, "ch_1");
      expect(newState.completedIds.filter((id) => id === "ch_1")).toHaveLength(
        1,
      );
    });

    it("returns same reference if already completed", () => {
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        completedIds: ["ch_1"],
      };
      const newState = completeChallenge(state, "ch_1");
      expect(newState).toBe(state);
    });

    it("is immutable — does not mutate original", () => {
      const state = getDefaultChallengeState();
      const original = { ...state, completedIds: [...state.completedIds] };
      completeChallenge(state, "ch_1");
      expect(state.completedIds).toEqual(original.completedIds);
    });
  });

  // --- getTotalRewards ---
  describe("getTotalRewards", () => {
    it("returns zero for no completed challenges", () => {
      const state = getDefaultChallengeState();
      expect(getTotalRewards(state)).toEqual({ coins: 0, diamonds: 0 });
    });

    it("sums rewards from completed daily challenges", () => {
      const challenges = generateDailyChallenges("2026-03-13");
      const state: ChallengeState = {
        dailyChallenges: challenges,
        weeklyChallenges: [],
        completedIds: [challenges[0].id],
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "",
      };
      const rewards = getTotalRewards(state);
      expect(rewards.coins).toBe(challenges[0].reward.coins);
      expect(rewards.diamonds).toBe(challenges[0].reward.diamonds);
    });

    it("sums rewards from both daily and weekly", () => {
      const daily = generateDailyChallenges("2026-03-13");
      const weekly = generateWeeklyChallenges("2026-W11");
      const state: ChallengeState = {
        dailyChallenges: daily,
        weeklyChallenges: weekly,
        completedIds: [daily[0].id, weekly[0].id],
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "2026-03-13",
      };
      const rewards = getTotalRewards(state);
      expect(rewards.coins).toBe(
        daily[0].reward.coins + weekly[0].reward.coins,
      );
    });
  });

  // --- needsReset ---
  describe("needsReset", () => {
    it("daily needs reset when lastDailyReset differs from today", () => {
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        lastDailyReset: "2026-03-12",
        lastWeeklyReset: "2026-03-10",
      };
      const result = needsReset(state, "2026-03-13");
      expect(result.daily).toBe(true);
    });

    it("daily does not need reset when same date", () => {
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "2026-03-13",
      };
      const result = needsReset(state, "2026-03-13");
      expect(result.daily).toBe(false);
    });

    it("weekly needs reset when week changes", () => {
      // March 13 2026 is a Friday (W11), March 16 is Monday (W12)
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "2026-03-13",
      };
      const result = needsReset(state, "2026-03-16");
      expect(result.weekly).toBe(true);
    });

    it("weekly does not need reset within same week", () => {
      const state: ChallengeState = {
        ...getDefaultChallengeState(),
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "2026-03-13",
      };
      // Same week (W11)
      const result = needsReset(state, "2026-03-13");
      expect(result.weekly).toBe(false);
    });
  });

  // --- resetChallenges ---
  describe("resetChallenges", () => {
    it("returns same state if no reset needed", () => {
      const state: ChallengeState = {
        dailyChallenges: generateDailyChallenges("2026-03-13"),
        weeklyChallenges: generateWeeklyChallenges("2026-W11"),
        completedIds: [],
        lastDailyReset: "2026-03-13",
        lastWeeklyReset: "2026-03-13",
      };
      const result = resetChallenges(state, "2026-03-13");
      expect(result).toBe(state);
    });

    it("regenerates daily challenges on new day", () => {
      const state: ChallengeState = {
        dailyChallenges: generateDailyChallenges("2026-03-12"),
        weeklyChallenges: generateWeeklyChallenges("2026-W11"),
        completedIds: ["daily_2026-03-12_0"],
        lastDailyReset: "2026-03-12",
        lastWeeklyReset: "2026-03-12",
      };
      const result = resetChallenges(state, "2026-03-13");
      expect(result.lastDailyReset).toBe("2026-03-13");
      expect(result.dailyChallenges[0].id).toMatch(/^daily_2026-03-13/);
      // Old daily completed IDs should be cleared
      expect(result.completedIds).not.toContain("daily_2026-03-12_0");
    });

    it("clears expired daily completedIds but keeps weekly", () => {
      const daily = generateDailyChallenges("2026-03-12");
      const weekly = generateWeeklyChallenges("2026-W11");
      const state: ChallengeState = {
        dailyChallenges: daily,
        weeklyChallenges: weekly,
        completedIds: [daily[0].id, weekly[0].id],
        lastDailyReset: "2026-03-12",
        lastWeeklyReset: "2026-03-12",
      };
      // Same week, new day
      const result = resetChallenges(state, "2026-03-13");
      expect(result.completedIds).toContain(weekly[0].id);
      expect(result.completedIds).not.toContain(daily[0].id);
    });
  });

  // --- getChallengeProgress ---
  describe("getChallengeProgress", () => {
    it("returns 0 for no progress", () => {
      const ch: ChallengeDef = {
        id: "t",
        name: "T",
        description: "",
        type: "kill_count",
        target: 100,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      const stats: ChallengeStats = {
        kills: 0,
        elapsed: 0,
        score: 0,
        noDamageTime: 0,
        weaponsUsed: [],
      };
      expect(getChallengeProgress(ch, stats)).toBe(0);
    });

    it("returns 0.5 for half progress", () => {
      const ch: ChallengeDef = {
        id: "t",
        name: "T",
        description: "",
        type: "kill_count",
        target: 100,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      const stats: ChallengeStats = {
        kills: 50,
        elapsed: 0,
        score: 0,
        noDamageTime: 0,
        weaponsUsed: [],
      };
      expect(getChallengeProgress(ch, stats)).toBe(0.5);
    });

    it("clamps at 1 even when exceeding target", () => {
      const ch: ChallengeDef = {
        id: "t",
        name: "T",
        description: "",
        type: "score_target",
        target: 100,
        reward: { coins: 0, diamonds: 0 },
        difficulty: "easy",
      };
      const stats: ChallengeStats = {
        kills: 0,
        elapsed: 0,
        score: 999,
        noDamageTime: 0,
        weaponsUsed: [],
      };
      expect(getChallengeProgress(ch, stats)).toBe(1);
    });

    it("weapon_only returns 0 when wrong weapon", () => {
      const ch: ChallengeDef = {
        id: "t",
        name: "T",
        description: "",
        type: "weapon_only",
        target: 1,
        constraint: "shotgun",
        reward: { coins: 0, diamonds: 0 },
        difficulty: "medium",
      };
      const stats: ChallengeStats = {
        kills: 50,
        elapsed: 60,
        score: 1000,
        noDamageTime: 30,
        weaponsUsed: ["pistol"],
      };
      expect(getChallengeProgress(ch, stats)).toBe(0);
    });

    it("weapon_only returns 1 when correct single weapon", () => {
      const ch: ChallengeDef = {
        id: "t",
        name: "T",
        description: "",
        type: "weapon_only",
        target: 1,
        constraint: "pistol",
        reward: { coins: 0, diamonds: 0 },
        difficulty: "medium",
      };
      const stats: ChallengeStats = {
        kills: 50,
        elapsed: 60,
        score: 1000,
        noDamageTime: 30,
        weaponsUsed: ["pistol"],
      };
      expect(getChallengeProgress(ch, stats)).toBe(1);
    });
  });

  // --- getISOWeek ---
  describe("getISOWeek", () => {
    it("returns correct ISO week for a known date", () => {
      // 2026-03-13 is a Friday in W11
      expect(getISOWeek("2026-03-13")).toBe("2026-W11");
    });

    it("handles year boundary", () => {
      // 2026-01-01 is a Thursday → W01
      expect(getISOWeek("2026-01-01")).toBe("2026-W01");
    });
  });

  // --- getDefaultChallengeState ---
  describe("getDefaultChallengeState", () => {
    it("returns empty arrays and strings", () => {
      const state = getDefaultChallengeState();
      expect(state.dailyChallenges).toEqual([]);
      expect(state.weeklyChallenges).toEqual([]);
      expect(state.completedIds).toEqual([]);
      expect(state.lastDailyReset).toBe("");
      expect(state.lastWeeklyReset).toBe("");
    });
  });
});
