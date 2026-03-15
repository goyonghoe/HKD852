import { describe, it, expect } from "vitest";
import {
  createBattlePass,
  addXp,
  getXpForLevel,
  getCurrentLevel,
  getXpProgress,
  claimReward,
  getUnclaimedRewards,
  canClaimPremium,
  upgradeToPremium,
  getTierRewards,
  getMaxLevel,
  isSeasonComplete,
  getSeasonProgress,
  generateTiers,
  getTotalXpNeeded,
  type BattlePassState,
  type BattlePassTier,
} from "../../src/core/BattlePassCalc";

describe("BattlePassCalc", () => {
  // ── createBattlePass ──────────────────────────────────

  describe("createBattlePass", () => {
    it("creates a free battle pass at level 1", () => {
      const bp = createBattlePass("season-1");
      expect(bp.seasonId).toBe("season-1");
      expect(bp.currentLevel).toBe(1);
      expect(bp.currentXp).toBe(0);
      expect(bp.isPremium).toBe(false);
      expect(bp.totalXpEarned).toBe(0);
    });

    it("creates a premium battle pass when specified", () => {
      const bp = createBattlePass("season-2", true);
      expect(bp.isPremium).toBe(true);
    });

    it("starts with empty claimed sets", () => {
      const bp = createBattlePass("s1");
      expect(bp.claimedFree.size).toBe(0);
      expect(bp.claimedPremium.size).toBe(0);
    });
  });

  // ── getXpForLevel ─────────────────────────────────────

  describe("getXpForLevel", () => {
    it("returns 1200 for level 1", () => {
      expect(getXpForLevel(1)).toBe(1200);
    });

    it("returns 1400 for level 2", () => {
      expect(getXpForLevel(2)).toBe(1400);
    });

    it("follows formula 1000 + level * 200", () => {
      for (let lvl = 1; lvl <= 50; lvl++) {
        expect(getXpForLevel(lvl)).toBe(1000 + lvl * 200);
      }
    });

    it("increases monotonically", () => {
      for (let lvl = 2; lvl <= 50; lvl++) {
        expect(getXpForLevel(lvl)).toBeGreaterThan(getXpForLevel(lvl - 1));
      }
    });
  });

  // ── addXp ─────────────────────────────────────────────

  describe("addXp", () => {
    it("adds XP without leveling", () => {
      const bp = createBattlePass("s1");
      const { state, levelsGained } = addXp(bp, 500);
      expect(state.currentXp).toBe(500);
      expect(state.currentLevel).toBe(1);
      expect(levelsGained).toBe(0);
    });

    it("levels up when XP exceeds threshold", () => {
      const bp = createBattlePass("s1");
      const { state, levelsGained } = addXp(bp, 1200); // exactly level 1 cost
      expect(state.currentLevel).toBe(2);
      expect(state.currentXp).toBe(0);
      expect(levelsGained).toBe(1);
    });

    it("gains multiple levels at once", () => {
      const bp = createBattlePass("s1");
      // Level 1: 1200, Level 2: 1400 → need 2600 for 2 levels
      const { state, levelsGained } = addXp(bp, 2600);
      expect(state.currentLevel).toBe(3);
      expect(state.currentXp).toBe(0);
      expect(levelsGained).toBe(2);
    });

    it("carries over excess XP", () => {
      const bp = createBattlePass("s1");
      const { state } = addXp(bp, 1300); // 1200 for level 1, 100 remainder
      expect(state.currentLevel).toBe(2);
      expect(state.currentXp).toBe(100);
    });

    it("does not exceed max level", () => {
      const bp = createBattlePass("s1");
      const { state } = addXp(bp, 999999999);
      expect(state.currentLevel).toBe(50);
      expect(state.currentXp).toBe(0);
    });

    it("tracks totalXpEarned", () => {
      const bp = createBattlePass("s1");
      const r1 = addXp(bp, 500);
      const r2 = addXp(r1.state, 300);
      expect(r2.state.totalXpEarned).toBe(800);
    });

    it("returns 0 levelsGained for zero amount", () => {
      const bp = createBattlePass("s1");
      const { levelsGained } = addXp(bp, 0);
      expect(levelsGained).toBe(0);
    });

    it("returns 0 levelsGained for negative amount", () => {
      const bp = createBattlePass("s1");
      const { state, levelsGained } = addXp(bp, -100);
      expect(levelsGained).toBe(0);
      expect(state.currentXp).toBe(0);
    });

    it("does not mutate original state", () => {
      const bp = createBattlePass("s1");
      const original = bp.currentLevel;
      addXp(bp, 99999);
      expect(bp.currentLevel).toBe(original);
    });

    it("preserves claimed sets through addXp", () => {
      let bp = createBattlePass("s1", true);
      bp = addXp(bp, 5000).state;
      const claimed = claimReward(bp, 1, "free");
      const result = addXp(claimed.state, 100);
      expect(result.state.claimedFree.has(1)).toBe(true);
    });
  });

  // ── getCurrentLevel ───────────────────────────────────

  describe("getCurrentLevel", () => {
    it("returns 1 for new pass", () => {
      expect(getCurrentLevel(createBattlePass("s1"))).toBe(1);
    });

    it("returns correct level after XP gain", () => {
      const { state } = addXp(createBattlePass("s1"), 1200);
      expect(getCurrentLevel(state)).toBe(2);
    });
  });

  // ── getXpProgress ─────────────────────────────────────

  describe("getXpProgress", () => {
    it("returns 0 for fresh pass", () => {
      expect(getXpProgress(createBattlePass("s1"))).toBe(0);
    });

    it("returns 0.5 for half XP", () => {
      const bp = createBattlePass("s1");
      const { state } = addXp(bp, 600); // 600/1200 = 0.5
      expect(getXpProgress(state)).toBeCloseTo(0.5);
    });

    it("returns 1 at max level", () => {
      const bp = createBattlePass("s1");
      const { state } = addXp(bp, 999999999);
      expect(getXpProgress(state)).toBe(1);
    });
  });

  // ── claimReward ───────────────────────────────────────

  describe("claimReward", () => {
    it("claims a free reward at reached level", () => {
      const bp = createBattlePass("s1");
      const result = claimReward(bp, 1, "free");
      expect(result.success).toBe(true);
      expect(result.reward).not.toBeNull();
      expect(result.state.claimedFree.has(1)).toBe(true);
    });

    it("fails to claim free reward for unreached level", () => {
      const bp = createBattlePass("s1");
      const result = claimReward(bp, 5, "free");
      expect(result.success).toBe(false);
      expect(result.reward).toBeNull();
    });

    it("fails to claim premium reward without premium", () => {
      const bp = createBattlePass("s1");
      const result = claimReward(bp, 1, "premium");
      expect(result.success).toBe(false);
    });

    it("claims premium reward with premium pass", () => {
      const bp = createBattlePass("s1", true);
      const result = claimReward(bp, 1, "premium");
      expect(result.success).toBe(true);
      expect(result.state.claimedPremium.has(1)).toBe(true);
    });

    it("fails to double-claim same reward", () => {
      const bp = createBattlePass("s1");
      const first = claimReward(bp, 1, "free");
      const second = claimReward(first.state, 1, "free");
      expect(second.success).toBe(false);
    });

    it("fails for level 0", () => {
      const bp = createBattlePass("s1");
      expect(claimReward(bp, 0, "free").success).toBe(false);
    });

    it("fails for negative level", () => {
      const bp = createBattlePass("s1");
      expect(claimReward(bp, -1, "free").success).toBe(false);
    });

    it("does not mutate original claimed sets", () => {
      const bp = createBattlePass("s1");
      claimReward(bp, 1, "free");
      expect(bp.claimedFree.has(1)).toBe(false);
    });
  });

  // ── getUnclaimedRewards ───────────────────────────────

  describe("getUnclaimedRewards", () => {
    it("returns all reached levels as unclaimed initially", () => {
      const bp = addXp(createBattlePass("s1"), 5000).state;
      const tiers = generateTiers();
      const unclaimed = getUnclaimedRewards(bp, tiers);
      expect(unclaimed.free.length).toBeGreaterThan(0);
    });

    it("excludes claimed free levels", () => {
      let bp = addXp(createBattlePass("s1"), 5000).state;
      bp = claimReward(bp, 1, "free").state;
      const tiers = generateTiers();
      const unclaimed = getUnclaimedRewards(bp, tiers);
      expect(unclaimed.free).not.toContain(1);
    });

    it("returns empty premium for free users", () => {
      const bp = addXp(createBattlePass("s1"), 5000).state;
      const tiers = generateTiers();
      const unclaimed = getUnclaimedRewards(bp, tiers);
      expect(unclaimed.premium).toHaveLength(0);
    });

    it("returns unclaimed premium for premium users", () => {
      const bp = addXp(createBattlePass("s1", true), 5000).state;
      const tiers = generateTiers();
      const unclaimed = getUnclaimedRewards(bp, tiers);
      expect(unclaimed.premium.length).toBeGreaterThan(0);
    });
  });

  // ── canClaimPremium ───────────────────────────────────

  describe("canClaimPremium", () => {
    it("returns false for free pass", () => {
      expect(canClaimPremium(createBattlePass("s1"))).toBe(false);
    });

    it("returns true for premium pass", () => {
      expect(canClaimPremium(createBattlePass("s1", true))).toBe(true);
    });
  });

  // ── upgradeToPremium ──────────────────────────────────

  describe("upgradeToPremium", () => {
    it("upgrades to premium", () => {
      const bp = createBattlePass("s1");
      const upgraded = upgradeToPremium(bp);
      expect(upgraded.isPremium).toBe(true);
    });

    it("preserves level and XP", () => {
      const bp = addXp(createBattlePass("s1"), 2000).state;
      const upgraded = upgradeToPremium(bp);
      expect(upgraded.currentLevel).toBe(bp.currentLevel);
      expect(upgraded.currentXp).toBe(bp.currentXp);
    });

    it("preserves existing free claims", () => {
      let bp = createBattlePass("s1");
      bp = claimReward(bp, 1, "free").state;
      const upgraded = upgradeToPremium(bp);
      expect(upgraded.claimedFree.has(1)).toBe(true);
    });

    it("does not mutate original state", () => {
      const bp = createBattlePass("s1");
      upgradeToPremium(bp);
      expect(bp.isPremium).toBe(false);
    });

    it("allows claiming premium rewards after upgrade", () => {
      let bp = createBattlePass("s1");
      bp = upgradeToPremium(bp);
      const result = claimReward(bp, 1, "premium");
      expect(result.success).toBe(true);
    });
  });

  // ── getTierRewards ────────────────────────────────────

  describe("getTierRewards", () => {
    it("returns free and premium rewards", () => {
      const { free, premium } = getTierRewards(1);
      expect(free.type).toBeDefined();
      expect(premium.type).toBeDefined();
    });

    it("level 50 free is legendary weapon skin", () => {
      const { free } = getTierRewards(50);
      expect(free.type).toBe("weapon_skin");
      expect(free.id).toContain("legendary");
    });

    it("level 50 premium is mythic title", () => {
      const { premium } = getTierRewards(50);
      expect(premium.type).toBe("title");
      expect(premium.id).toContain("mythic");
    });

    it("level 10 free is weapon skin", () => {
      const { free } = getTierRewards(10);
      expect(free.type).toBe("weapon_skin");
    });

    it("level 5 free is gems", () => {
      const { free } = getTierRewards(5);
      expect(free.type).toBe("gems");
    });

    it("level 5 premium is character skin", () => {
      const { premium } = getTierRewards(5);
      expect(premium.type).toBe("character_skin");
    });

    it("level 1 free is coins", () => {
      const { free } = getTierRewards(1);
      expect(free.type).toBe("coins");
    });

    it("level 1 premium is coins", () => {
      const { premium } = getTierRewards(1);
      expect(premium.type).toBe("coins");
    });
  });

  // ── getMaxLevel ───────────────────────────────────────

  describe("getMaxLevel", () => {
    it("returns 50", () => {
      expect(getMaxLevel()).toBe(50);
    });
  });

  // ── isSeasonComplete ──────────────────────────────────

  describe("isSeasonComplete", () => {
    it("returns false at level 1", () => {
      expect(isSeasonComplete(createBattlePass("s1"))).toBe(false);
    });

    it("returns true at max level", () => {
      const { state } = addXp(createBattlePass("s1"), 999999999);
      expect(isSeasonComplete(state)).toBe(true);
    });
  });

  // ── getSeasonProgress ─────────────────────────────────

  describe("getSeasonProgress", () => {
    it("returns 1/50 for level 1", () => {
      expect(getSeasonProgress(createBattlePass("s1"))).toBeCloseTo(0.02);
    });

    it("returns 1 at max level", () => {
      const { state } = addXp(createBattlePass("s1"), 999999999);
      expect(getSeasonProgress(state)).toBe(1);
    });

    it("returns 0.5 at level 25", () => {
      let bp = createBattlePass("s1");
      // Manually set level to 25 via enough XP
      let totalXp = 0;
      for (let i = 1; i < 25; i++) totalXp += getXpForLevel(i);
      const { state } = addXp(bp, totalXp);
      expect(getSeasonProgress(state)).toBeCloseTo(0.5);
    });
  });

  // ── generateTiers ─────────────────────────────────────

  describe("generateTiers", () => {
    const tiers = generateTiers();

    it("generates exactly 50 tiers", () => {
      expect(tiers).toHaveLength(50);
    });

    it("tiers are numbered 1 to 50", () => {
      expect(tiers[0].level).toBe(1);
      expect(tiers[49].level).toBe(50);
    });

    it("all tiers have freeReward and premiumReward", () => {
      for (const tier of tiers) {
        expect(tier.freeReward).toBeDefined();
        expect(tier.premiumReward).toBeDefined();
      }
    });

    it("all tiers have positive xpRequired", () => {
      for (const tier of tiers) {
        expect(tier.xpRequired).toBeGreaterThan(0);
      }
    });

    it("every 10th tier free reward is weapon_skin", () => {
      for (const lvl of [10, 20, 30, 40]) {
        const tier = tiers[lvl - 1];
        expect(tier.freeReward.type).toBe("weapon_skin");
      }
    });

    it("every 5th (non-10th) tier free reward is gems", () => {
      for (const lvl of [5, 15, 25, 35, 45]) {
        const tier = tiers[lvl - 1];
        expect(tier.freeReward.type).toBe("gems");
      }
    });

    it("every 5th tier premium reward is character_skin", () => {
      for (const lvl of [5, 10, 15, 20, 25, 30, 35, 40, 45]) {
        const tier = tiers[lvl - 1];
        expect(tier.premiumReward.type).toBe("character_skin");
      }
    });

    it("free coin rewards scale from ~100 to ~500", () => {
      const firstCoinTier = tiers[0]; // level 1
      const lastCoinTier = tiers[48]; // level 49
      expect(firstCoinTier.freeReward.amount).toBe(100);
      expect(lastCoinTier.freeReward.amount).toBeGreaterThanOrEqual(490);
    });
  });

  // ── getTotalXpNeeded ──────────────────────────────────

  describe("getTotalXpNeeded", () => {
    it("returns a positive number", () => {
      expect(getTotalXpNeeded()).toBeGreaterThan(0);
    });

    it("matches sum of getXpForLevel(1..49)", () => {
      let sum = 0;
      for (let i = 1; i < 50; i++) sum += getXpForLevel(i);
      expect(getTotalXpNeeded()).toBe(sum);
    });

    it("equals 1000*49 + 200*(1+2+...+49)", () => {
      // sum 1..49 = 49*50/2 = 1225
      const expected = 1000 * 49 + 200 * 1225;
      expect(getTotalXpNeeded()).toBe(expected);
    });
  });

  // ── Integration / edge cases ──────────────────────────

  describe("integration", () => {
    it("full lifecycle: create → addXp → claim → upgrade → claim premium", () => {
      let bp = createBattlePass("season-1");
      bp = addXp(bp, 3000).state; // should reach level 3+
      expect(bp.currentLevel).toBeGreaterThanOrEqual(3);

      // Claim free rewards
      const r1 = claimReward(bp, 1, "free");
      expect(r1.success).toBe(true);
      bp = r1.state;

      // Can't claim premium yet
      const r2 = claimReward(bp, 1, "premium");
      expect(r2.success).toBe(false);

      // Upgrade to premium
      bp = upgradeToPremium(bp);

      // Now claim premium
      const r3 = claimReward(bp, 1, "premium");
      expect(r3.success).toBe(true);
      bp = r3.state;

      // Verify free claim preserved
      expect(bp.claimedFree.has(1)).toBe(true);
      expect(bp.claimedPremium.has(1)).toBe(true);
    });

    it("reaching max level then claiming all rewards", () => {
      let bp = createBattlePass("s1", true);
      bp = addXp(bp, 999999999).state;
      expect(isSeasonComplete(bp)).toBe(true);

      const tiers = generateTiers();
      const unclaimed = getUnclaimedRewards(bp, tiers);
      expect(unclaimed.free).toHaveLength(50);
      expect(unclaimed.premium).toHaveLength(50);

      // Claim all
      for (let level = 1; level <= 50; level++) {
        bp = claimReward(bp, level, "free").state;
        bp = claimReward(bp, level, "premium").state;
      }

      const remaining = getUnclaimedRewards(bp, tiers);
      expect(remaining.free).toHaveLength(0);
      expect(remaining.premium).toHaveLength(0);
    });
  });
});
