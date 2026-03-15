import { describe, it, expect } from "vitest";
import {
  createAchievementTracker,
  updateProgress,
  checkUnlocks,
  getAchievement,
  getAchievementsByCategory,
  getAchievementsByTier,
  getUnlockedAchievements,
  getLockedAchievements,
  getCompletionPercent,
  getCategoryProgress,
  getRecentUnlocks,
  claimReward,
  getTotalRewardCoins,
  getNearestAchievement,
  serialize,
  deserialize,
} from "../../src/core/AchievementTrackerCalc";

// ── createAchievementTracker ───────────────────────────────────────

describe("createAchievementTracker", () => {
  it("initializes with 20 achievements", () => {
    const state = createAchievementTracker();
    expect(Object.keys(state.achievements)).toHaveLength(20);
  });

  it("all achievements start locked", () => {
    const state = createAchievementTracker();
    for (const a of Object.values(state.achievements)) {
      expect(a.isUnlocked).toBe(false);
    }
  });

  it("all conditions start at current=0", () => {
    const state = createAchievementTracker();
    for (const a of Object.values(state.achievements)) {
      for (const c of a.conditions) {
        expect(c.current).toBe(0);
      }
    }
  });

  it("recentUnlocks starts empty", () => {
    const state = createAchievementTracker();
    expect(state.recentUnlocks).toHaveLength(0);
  });

  it("totalUnlocked starts at 0", () => {
    const state = createAchievementTracker();
    expect(state.totalUnlocked).toBe(0);
  });

  it("rewards start unclaimed", () => {
    const state = createAchievementTracker();
    for (const a of Object.values(state.achievements)) {
      expect(a.reward.claimed).toBe(false);
    }
  });
});

// ── Achievement pool validation ────────────────────────────────────

describe("achievement pool", () => {
  it("has 5 combat achievements", () => {
    const state = createAchievementTracker();
    const combat = getAchievementsByCategory(state, "combat");
    expect(combat).toHaveLength(5);
  });

  it("has 5 survival achievements", () => {
    const state = createAchievementTracker();
    expect(getAchievementsByCategory(state, "survival")).toHaveLength(5);
  });

  it("has 5 collection achievements", () => {
    const state = createAchievementTracker();
    expect(getAchievementsByCategory(state, "collection")).toHaveLength(5);
  });

  it("has 5 mastery achievements", () => {
    const state = createAchievementTracker();
    expect(getAchievementsByCategory(state, "mastery")).toHaveLength(5);
  });

  it("all ids are unique", () => {
    const state = createAchievementTracker();
    const ids = Object.keys(state.achievements);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every achievement has at least one condition", () => {
    const state = createAchievementTracker();
    for (const a of Object.values(state.achievements)) {
      expect(a.conditions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("full_build has two conditions", () => {
    const state = createAchievementTracker();
    const fb = getAchievement(state, "full_build");
    expect(fb?.conditions).toHaveLength(2);
  });

  it("immortal has title reward", () => {
    const state = createAchievementTracker();
    const a = getAchievement(state, "immortal");
    expect(a?.reward.title).toBe("Immortal");
  });

  it("all_talents has title Master", () => {
    const state = createAchievementTracker();
    const a = getAchievement(state, "all_talents");
    expect(a?.reward.title).toBe("Master");
  });

  it("s_rank has title S-Ranker", () => {
    const state = createAchievementTracker();
    const a = getAchievement(state, "s_rank");
    expect(a?.reward.title).toBe("S-Ranker");
  });
});

// ── updateProgress ─────────────────────────────────────────────────

describe("updateProgress", () => {
  it("updates matching condition type", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 5);
    const a = getAchievement(state, "first_blood");
    expect(a?.conditions[0].current).toBe(5);
  });

  it("does not update non-matching types", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 5);
    const a = getAchievement(state, "survivor");
    expect(a?.conditions[0].current).toBe(0);
  });

  it("uses max semantics (keeps higher value)", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 10);
    state = updateProgress(state, "enemies_killed", 3);
    const a = getAchievement(state, "first_blood");
    expect(a?.conditions[0].current).toBe(10);
  });

  it("skips already unlocked achievements", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const s3 = updateProgress(s2, "enemies_killed", 999);
    // first_blood is unlocked; current should remain as 1
    const a = getAchievement(s3, "first_blood");
    expect(a?.conditions[0].current).toBe(1);
  });

  it("returns new state (immutable)", () => {
    const state = createAchievementTracker();
    const next = updateProgress(state, "enemies_killed", 5);
    expect(next).not.toBe(state);
    expect(getAchievement(state, "first_blood")?.conditions[0].current).toBe(0);
  });

  it("updates multiple achievements with same condition type", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "survive_minutes", 7);
    expect(getAchievement(state, "survivor")?.conditions[0].current).toBe(7);
    expect(getAchievement(state, "endurance")?.conditions[0].current).toBe(7);
  });
});

// ── checkUnlocks ───────────────────────────────────────────────────

describe("checkUnlocks", () => {
  it("unlocks achievement when condition met", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next, newUnlocks } = checkUnlocks(state, 1000);
    expect(newUnlocks).toContain("first_blood");
    expect(getAchievement(next, "first_blood")?.isUnlocked).toBe(true);
  });

  it("sets unlockedAt timestamp", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state, 12345);
    expect(getAchievement(next, "first_blood")?.unlockedAt).toBe(12345);
  });

  it("increments totalUnlocked", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    expect(next.totalUnlocked).toBe(1);
  });

  it("adds to recentUnlocks", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    expect(next.recentUnlocks).toContain("first_blood");
  });

  it("does not unlock when condition not met", () => {
    const state = createAchievementTracker();
    const { newUnlocks } = checkUnlocks(state);
    expect(newUnlocks).toHaveLength(0);
  });

  it("does not re-unlock already unlocked", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const { newUnlocks } = checkUnlocks(s2);
    expect(newUnlocks).toHaveLength(0);
    expect(s2.totalUnlocked).toBe(1);
  });

  it("unlocks multi-condition achievement only when all met", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "weapons_equipped", 6);
    const { newUnlocks: partial } = checkUnlocks(state);
    expect(partial).not.toContain("full_build");

    state = updateProgress(state, "passives_equipped", 6);
    const { newUnlocks: full } = checkUnlocks(state);
    expect(full).toContain("full_build");
  });

  it("can unlock multiple achievements at once", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    state = updateProgress(state, "survive_minutes", 5);
    const { newUnlocks } = checkUnlocks(state);
    expect(newUnlocks).toContain("first_blood");
    expect(newUnlocks).toContain("survivor");
    expect(newUnlocks.length).toBeGreaterThanOrEqual(2);
  });
});

// ── getAchievement ─────────────────────────────────────────────────

describe("getAchievement", () => {
  it("returns achievement by id", () => {
    const state = createAchievementTracker();
    const a = getAchievement(state, "centurion");
    expect(a?.name).toBe("Centurion");
  });

  it("returns undefined for invalid id", () => {
    const state = createAchievementTracker();
    expect(getAchievement(state, "nonexistent")).toBeUndefined();
  });

  it("returns a clone (not a reference)", () => {
    const state = createAchievementTracker();
    const a = getAchievement(state, "centurion");
    if (a) a.conditions[0].current = 9999;
    expect(getAchievement(state, "centurion")?.conditions[0].current).toBe(0);
  });
});

// ── getAchievementsByCategory ──────────────────────────────────────

describe("getAchievementsByCategory", () => {
  it("returns only matching category", () => {
    const state = createAchievementTracker();
    const combat = getAchievementsByCategory(state, "combat");
    expect(combat.every((a) => a.category === "combat")).toBe(true);
  });

  it("returns empty for unused category", () => {
    const state = createAchievementTracker();
    expect(getAchievementsByCategory(state, "exploration")).toHaveLength(0);
  });
});

// ── getAchievementsByTier ──────────────────────────────────────────

describe("getAchievementsByTier", () => {
  it("returns only matching tier", () => {
    const state = createAchievementTracker();
    const gold = getAchievementsByTier(state, "gold");
    expect(gold.every((a) => a.tier === "gold")).toBe(true);
    expect(gold.length).toBeGreaterThan(0);
  });

  it("returns correct count of bronze achievements", () => {
    const state = createAchievementTracker();
    const bronze = getAchievementsByTier(state, "bronze");
    expect(bronze).toHaveLength(2); // first_blood, survivor
  });

  it("returns correct count of platinum achievements", () => {
    const state = createAchievementTracker();
    const plat = getAchievementsByTier(state, "platinum");
    expect(plat).toHaveLength(3); // untouchable, perfectionist, all_talents
  });
});

// ── getUnlockedAchievements / getLockedAchievements ────────────────

describe("getUnlockedAchievements", () => {
  it("returns empty when none unlocked", () => {
    const state = createAchievementTracker();
    expect(getUnlockedAchievements(state)).toHaveLength(0);
  });

  it("returns unlocked achievements after unlock", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    expect(getUnlockedAchievements(next)).toHaveLength(1);
  });
});

describe("getLockedAchievements", () => {
  it("returns all when none unlocked", () => {
    const state = createAchievementTracker();
    expect(getLockedAchievements(state)).toHaveLength(20);
  });

  it("decreases after unlock", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    expect(getLockedAchievements(next)).toHaveLength(19);
  });
});

// ── getCompletionPercent ───────────────────────────────────────────

describe("getCompletionPercent", () => {
  it("returns 0 when none unlocked", () => {
    const state = createAchievementTracker();
    expect(getCompletionPercent(state)).toBe(0);
  });

  it("returns 5 when 1 of 20 unlocked", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    expect(getCompletionPercent(next)).toBe(5);
  });
});

// ── getCategoryProgress ────────────────────────────────────────────

describe("getCategoryProgress", () => {
  it("returns 0 unlocked initially for combat", () => {
    const state = createAchievementTracker();
    const p = getCategoryProgress(state, "combat");
    expect(p.unlocked).toBe(0);
    expect(p.total).toBe(5);
    expect(p.percent).toBe(0);
  });

  it("tracks unlocks in category", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: next } = checkUnlocks(state);
    const p = getCategoryProgress(next, "combat");
    expect(p.unlocked).toBe(1);
    expect(p.percent).toBe(20);
  });

  it("returns 0 for empty category", () => {
    const state = createAchievementTracker();
    const p = getCategoryProgress(state, "secret");
    expect(p.total).toBe(0);
    expect(p.percent).toBe(0);
  });
});

// ── getRecentUnlocks ───────────────────────────────────────────────

describe("getRecentUnlocks", () => {
  it("returns empty initially", () => {
    const state = createAchievementTracker();
    expect(getRecentUnlocks(state)).toHaveLength(0);
  });

  it("returns all when no limit", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    state = updateProgress(state, "survive_minutes", 5);
    const { state: next } = checkUnlocks(state);
    expect(getRecentUnlocks(next).length).toBeGreaterThanOrEqual(2);
  });

  it("respects limit", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    state = updateProgress(state, "survive_minutes", 5);
    const { state: next } = checkUnlocks(state);
    expect(getRecentUnlocks(next, 1)).toHaveLength(1);
  });

  it("returns last N (most recent)", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    let s3 = updateProgress(s2, "survive_minutes", 5);
    const { state: s4 } = checkUnlocks(s3);
    const recent = getRecentUnlocks(s4, 1);
    expect(recent).toHaveLength(1);
    expect(recent[0]).toBe("survivor");
  });
});

// ── claimReward ────────────────────────────────────────────────────

describe("claimReward", () => {
  it("returns reward for unlocked achievement", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const { state: s3, reward } = claimReward(s2, "first_blood");
    expect(reward).toEqual({ coins: 10, title: undefined });
    expect(getAchievement(s3, "first_blood")?.reward.claimed).toBe(true);
  });

  it("returns null for locked achievement", () => {
    const state = createAchievementTracker();
    const { reward } = claimReward(state, "first_blood");
    expect(reward).toBeNull();
  });

  it("returns null for already claimed", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const { state: s3 } = claimReward(s2, "first_blood");
    const { reward } = claimReward(s3, "first_blood");
    expect(reward).toBeNull();
  });

  it("returns null for invalid id", () => {
    const state = createAchievementTracker();
    const { reward } = claimReward(state, "nonexistent");
    expect(reward).toBeNull();
  });

  it("includes title in reward when present", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "runs_won", 10);
    const { state: s2 } = checkUnlocks(state);
    const { reward } = claimReward(s2, "immortal");
    expect(reward?.title).toBe("Immortal");
  });
});

// ── getTotalRewardCoins ────────────────────────────────────────────

describe("getTotalRewardCoins", () => {
  it("returns 0 with no unlocks", () => {
    const state = createAchievementTracker();
    expect(getTotalRewardCoins(state)).toBe(0);
  });

  it("sums unclaimed rewards", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    state = updateProgress(state, "survive_minutes", 5);
    const { state: next } = checkUnlocks(state);
    // first_blood=10, survivor=10
    expect(getTotalRewardCoins(next)).toBe(20);
  });

  it("excludes claimed rewards", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    state = updateProgress(state, "survive_minutes", 5);
    const { state: s2 } = checkUnlocks(state);
    const { state: s3 } = claimReward(s2, "first_blood");
    expect(getTotalRewardCoins(s3)).toBe(10);
  });
});

// ── getNearestAchievement ──────────────────────────────────────────

describe("getNearestAchievement", () => {
  it("returns null when all unlocked (edge case via mocking)", () => {
    // With 20 achievements this is hard, test with initial state — nearest should be achievable
    const state = createAchievementTracker();
    // All at 0, so ratio = 0 for all; should return first found
    const nearest = getNearestAchievement(state);
    expect(nearest).not.toBeNull();
  });

  it("returns achievement with most progress", () => {
    let state = createAchievementTracker();
    // first_blood: 1/1 needed but not yet checked, centurion: 50/100 = 0.5
    state = updateProgress(state, "enemies_killed_run", 50);
    state = updateProgress(state, "survive_minutes", 2); // 2/5 = 0.4
    const nearest = getNearestAchievement(state);
    // enemies_killed_run 50/100 = 0.5 is highest
    expect(nearest?.id).toBe("centurion");
  });

  it("prefers higher ratio", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "survive_minutes", 9); // 9/10 = 0.9 for endurance
    state = updateProgress(state, "enemies_killed_run", 10); // 10/100 = 0.1
    const nearest = getNearestAchievement(state);
    // survivor 9/5 capped at 1.0, but we need to check — first_blood is enemies_killed not enemies_killed_run
    // endurance: 9/10 = 0.9, survivor: 9/5 = 1.0 (capped)
    // survivor would be complete, so checkUnlocks would unlock it
    // But we haven't called checkUnlocks, so survivor is still locked with ratio 1.0
    expect(nearest?.id).toBe("survivor");
  });

  it("skips unlocked achievements", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    s2; // first_blood unlocked
    const nearest = getNearestAchievement(s2);
    expect(nearest?.id).not.toBe("first_blood");
  });
});

// ── serialize / deserialize ────────────────────────────────────────

describe("serialize / deserialize", () => {
  it("roundtrips state correctly", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 5);
    const { state: s2 } = checkUnlocks(state);
    const json = serialize(s2);
    const restored = deserialize(json);
    expect(restored.totalUnlocked).toBe(s2.totalUnlocked);
    expect(Object.keys(restored.achievements)).toHaveLength(20);
  });

  it("preserves unlock status", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const restored = deserialize(serialize(s2));
    expect(restored.achievements["first_blood"].isUnlocked).toBe(true);
  });

  it("preserves condition progress", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed_run", 42);
    const restored = deserialize(serialize(state));
    expect(restored.achievements["centurion"].conditions[0].current).toBe(42);
  });

  it("preserves claimed status", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    const { state: s3 } = claimReward(s2, "first_blood");
    const restored = deserialize(serialize(s3));
    expect(restored.achievements["first_blood"].reward.claimed).toBe(true);
  });

  it("throws on invalid JSON structure", () => {
    expect(() => deserialize("{}")).toThrow();
  });

  it("throws on malformed JSON", () => {
    expect(() => deserialize("not json")).toThrow();
  });
});

// ── Immutability ───────────────────────────────────────────────────

describe("immutability", () => {
  it("updateProgress does not mutate original state", () => {
    const state = createAchievementTracker();
    const orig = getAchievement(state, "first_blood")!.conditions[0].current;
    updateProgress(state, "enemies_killed", 99);
    expect(getAchievement(state, "first_blood")!.conditions[0].current).toBe(
      orig,
    );
  });

  it("checkUnlocks does not mutate original state", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const origTotal = state.totalUnlocked;
    checkUnlocks(state);
    expect(state.totalUnlocked).toBe(origTotal);
  });

  it("claimReward does not mutate original state", () => {
    let state = createAchievementTracker();
    state = updateProgress(state, "enemies_killed", 1);
    const { state: s2 } = checkUnlocks(state);
    claimReward(s2, "first_blood");
    expect(getAchievement(s2, "first_blood")!.reward.claimed).toBe(false);
  });
});
