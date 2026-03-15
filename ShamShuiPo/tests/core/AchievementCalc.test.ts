import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENT_DEFS,
  createAchievementState,
  checkProgress,
  unlockAchievement,
  resetProgress,
  getUnlocked,
  getByCategory,
  getByTier,
  getCompletionPercent,
  getNextUnlockable,
  getTotalRewards,
  isUnlocked,
} from "../../src/core/AchievementCalc";

// ── ACHIEVEMENT_DEFS ────────────────────────────────────────────

describe("ACHIEVEMENT_DEFS", () => {
  it("has 22 predefined achievements", () => {
    expect(ACHIEVEMENT_DEFS.length).toBe(22);
  });

  it("covers all 6 categories", () => {
    const cats = new Set(ACHIEVEMENT_DEFS.map((a) => a.category));
    expect(cats.size).toBe(6);
  });

  it("covers all 4 tiers", () => {
    const tiers = new Set(ACHIEVEMENT_DEFS.map((a) => a.tier));
    expect(tiers.size).toBe(4);
  });

  it("all have unique ids", () => {
    const ids = ACHIEVEMENT_DEFS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── createAchievementState ──────────────────────────────────────

describe("createAchievementState", () => {
  it("initializes all achievements from ACHIEVEMENT_DEFS", () => {
    const s = createAchievementState(0);
    expect(s.achievements).toHaveLength(ACHIEVEMENT_DEFS.length);
  });

  it("all achievements start locked with progress 0", () => {
    const s = createAchievementState(0);
    for (const a of s.achievements) {
      expect(a.unlocked).toBe(false);
      expect(a.progress).toBe(0);
      expect(a.unlockedAt).toBeNull();
    }
  });

  it("totalUnlocked starts at 0", () => {
    const s = createAchievementState(0);
    expect(s.totalUnlocked).toBe(0);
  });

  it("sets lastChecked to provided timestamp", () => {
    const s = createAchievementState(12345);
    expect(s.lastChecked).toBe(12345);
  });
});

// ── checkProgress ───────────────────────────────────────────────

describe("checkProgress", () => {
  it("increases progress for matching category", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 5, 100);
    const combat = s2.achievements.find((a) => a.id === "combat_kill_10");
    expect(combat!.progress).toBe(5);
  });

  it("does not affect other categories", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 5, 100);
    const survival = s2.achievements.find((a) => a.id === "survival_1min");
    expect(survival!.progress).toBe(0);
  });

  it("unlocks achievement when progress >= requirement", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 10, 100);
    const ach = s2.achievements.find((a) => a.id === "combat_kill_10");
    expect(ach!.unlocked).toBe(true);
    expect(ach!.unlockedAt).toBe(100);
  });

  it("updates totalUnlocked count", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 10, 100);
    expect(s2.totalUnlocked).toBeGreaterThanOrEqual(1);
  });

  it("caps progress at requirement", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 9999, 100);
    const ach = s2.achievements.find((a) => a.id === "combat_kill_10");
    expect(ach!.progress).toBe(ach!.requirement);
  });

  it("does not update already unlocked achievements", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 10, 100);
    const before = s.achievements.find((a) => a.id === "combat_kill_10");
    s = checkProgress(s, "combat", 5, 200);
    const after = s.achievements.find((a) => a.id === "combat_kill_10");
    expect(after!.progress).toBe(before!.progress);
    expect(after!.unlockedAt).toBe(100);
  });

  it("returns same state if no changes", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 0, 100);
    expect(s2).toBe(s);
  });

  it("is immutable", () => {
    const s = createAchievementState(0);
    const s2 = checkProgress(s, "combat", 5, 100);
    expect(s.achievements[0].progress).toBe(0);
    expect(s2).not.toBe(s);
  });

  it("multiple categories can progress independently", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 10, 100);
    s = checkProgress(s, "survival", 60, 200);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
    expect(isUnlocked(s, "survival_1min")).toBe(true);
  });

  it("accumulates progress across calls", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 3, 100);
    s = checkProgress(s, "combat", 4, 200);
    s = checkProgress(s, "combat", 3, 300);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
  });
});

// ── unlockAchievement ───────────────────────────────────────────

describe("unlockAchievement", () => {
  it("force-unlocks by id", () => {
    const s = createAchievementState(0);
    const s2 = unlockAchievement(s, "combat_kill_10", 999);
    const ach = s2.achievements.find((a) => a.id === "combat_kill_10");
    expect(ach!.unlocked).toBe(true);
    expect(ach!.unlockedAt).toBe(999);
  });

  it("sets progress to requirement", () => {
    const s = createAchievementState(0);
    const s2 = unlockAchievement(s, "combat_kill_10", 999);
    const ach = s2.achievements.find((a) => a.id === "combat_kill_10");
    expect(ach!.progress).toBe(ach!.requirement);
  });

  it("no-op if already unlocked", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    const s2 = unlockAchievement(s, "combat_kill_10", 200);
    expect(s2).toBe(s);
  });

  it("no-op for unknown id", () => {
    const s = createAchievementState(0);
    const s2 = unlockAchievement(s, "nonexistent", 100);
    expect(s2).toBe(s);
  });

  it("increments totalUnlocked", () => {
    const s = createAchievementState(0);
    const s2 = unlockAchievement(s, "combat_kill_10", 100);
    expect(s2.totalUnlocked).toBe(1);
  });
});

// ── resetProgress ───────────────────────────────────────────────

describe("resetProgress", () => {
  it("resets all progress to 0", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 50, 100);
    s = resetProgress(s);
    for (const a of s.achievements) {
      expect(a.progress).toBe(0);
      expect(a.unlocked).toBe(false);
    }
  });

  it("resets totalUnlocked to 0", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    s = resetProgress(s);
    expect(s.totalUnlocked).toBe(0);
  });

  it("preserves lastChecked", () => {
    let s = createAchievementState(500);
    s = resetProgress(s);
    expect(s.lastChecked).toBe(500);
  });
});

// ── getUnlocked ─────────────────────────────────────────────────

describe("getUnlocked", () => {
  it("returns empty for fresh state", () => {
    expect(getUnlocked(createAchievementState(0))).toHaveLength(0);
  });

  it("returns unlocked achievements", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    s = unlockAchievement(s, "survival_1min", 200);
    expect(getUnlocked(s)).toHaveLength(2);
  });
});

// ── getByCategory ───────────────────────────────────────────────

describe("getByCategory", () => {
  it("returns all combat achievements", () => {
    const s = createAchievementState(0);
    const combat = getByCategory(s, "combat");
    expect(combat.length).toBe(4);
    for (const a of combat) {
      expect(a.category).toBe("combat");
    }
  });

  it("returns all secret achievements", () => {
    const s = createAchievementState(0);
    const secret = getByCategory(s, "secret");
    expect(secret.length).toBe(3);
  });
});

// ── getByTier ───────────────────────────────────────────────────

describe("getByTier", () => {
  it("returns all bronze achievements", () => {
    const s = createAchievementState(0);
    const bronze = getByTier(s, "bronze");
    for (const a of bronze) {
      expect(a.tier).toBe("bronze");
    }
    expect(bronze.length).toBeGreaterThan(0);
  });

  it("returns all platinum achievements", () => {
    const s = createAchievementState(0);
    const plat = getByTier(s, "platinum");
    for (const a of plat) {
      expect(a.tier).toBe("platinum");
    }
    expect(plat.length).toBeGreaterThan(0);
  });
});

// ── getCompletionPercent ────────────────────────────────────────

describe("getCompletionPercent", () => {
  it("returns 0 for fresh state", () => {
    expect(getCompletionPercent(createAchievementState(0))).toBe(0);
  });

  it("returns correct percentage", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    const expected = (1 / s.achievements.length) * 100;
    expect(getCompletionPercent(s)).toBeCloseTo(expected);
  });
});

// ── getNextUnlockable ───────────────────────────────────────────

describe("getNextUnlockable", () => {
  it("returns achievement closest to completion", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 9, 100); // 9/10 = 90%
    s = checkProgress(s, "survival", 1, 100); // 1/60 = 1.7%
    const next = getNextUnlockable(s);
    expect(next!.id).toBe("combat_kill_10");
  });

  it("returns null when all unlocked", () => {
    let s = createAchievementState(0);
    for (const def of ACHIEVEMENT_DEFS) {
      s = unlockAchievement(s, def.id, 100);
    }
    expect(getNextUnlockable(s)).toBeNull();
  });

  it("returns something for fresh state", () => {
    const s = createAchievementState(0);
    expect(getNextUnlockable(s)).not.toBeNull();
  });
});

// ── getTotalRewards ─────────────────────────────────────────────

describe("getTotalRewards", () => {
  it("returns 0/0 for fresh state", () => {
    const { gold, xp } = getTotalRewards(createAchievementState(0));
    expect(gold).toBe(0);
    expect(xp).toBe(0);
  });

  it("sums rewards from unlocked achievements", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    s = unlockAchievement(s, "survival_1min", 100);
    const { gold, xp } = getTotalRewards(s);
    expect(gold).toBe(50 + 30);
    expect(xp).toBe(20 + 15);
  });
});

// ── isUnlocked ──────────────────────────────────────────────────

describe("isUnlocked", () => {
  it("returns false for locked achievement", () => {
    expect(isUnlocked(createAchievementState(0), "combat_kill_10")).toBe(false);
  });

  it("returns true after unlock", () => {
    let s = createAchievementState(0);
    s = unlockAchievement(s, "combat_kill_10", 100);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
  });

  it("returns false for unknown id", () => {
    expect(isUnlocked(createAchievementState(0), "nonexistent")).toBe(false);
  });
});

// ── Integration ─────────────────────────────────────────────────

describe("integration", () => {
  it("progressive unlock: bronze → silver → gold → platinum", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 10, 100);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
    expect(isUnlocked(s, "combat_kill_100")).toBe(false);

    s = checkProgress(s, "combat", 90, 200);
    expect(isUnlocked(s, "combat_kill_100")).toBe(true);
    expect(isUnlocked(s, "combat_kill_500")).toBe(false);

    s = checkProgress(s, "combat", 400, 300);
    expect(isUnlocked(s, "combat_kill_500")).toBe(true);

    s = checkProgress(s, "combat", 500, 400);
    expect(isUnlocked(s, "combat_kill_1000")).toBe(true);
    expect(s.totalUnlocked).toBeGreaterThanOrEqual(4);
  });

  it("reset then re-progress works", () => {
    let s = createAchievementState(0);
    s = checkProgress(s, "combat", 10, 100);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
    s = resetProgress(s);
    expect(isUnlocked(s, "combat_kill_10")).toBe(false);
    s = checkProgress(s, "combat", 10, 200);
    expect(isUnlocked(s, "combat_kill_10")).toBe(true);
  });
});
