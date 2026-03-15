import { describe, it, expect } from "vitest";
import {
  createQuestState,
  generateDailyQuests,
  updateProgress,
  claimReward,
  isQuestComplete,
  getCompletionPercent,
  getActiveByType,
  getRewardMultiplier,
  resetDailyQuests,
  getQuestTemplates,
  type Quest,
  type QuestType,
  type QuestRarity,
} from "../../src/core/QuestCalc";

// ── createQuestState ────────────────────────────────────────────

describe("createQuestState", () => {
  it("starts with empty activeQuests", () => {
    const s = createQuestState();
    expect(s.activeQuests).toHaveLength(0);
  });

  it("starts with empty completedIds", () => {
    const s = createQuestState();
    expect(s.completedIds).toHaveLength(0);
  });

  it("defaults dailyResetTime to 0", () => {
    const s = createQuestState();
    expect(s.dailyResetTime).toBe(0);
  });

  it("accepts custom dailyResetTime", () => {
    const s = createQuestState(12345);
    expect(s.dailyResetTime).toBe(12345);
  });
});

// ── generateDailyQuests ─────────────────────────────────────────

describe("generateDailyQuests", () => {
  it("generates 3 quests", () => {
    const s = generateDailyQuests(42);
    expect(s.activeQuests).toHaveLength(3);
  });

  it("same seed produces same quests", () => {
    const a = generateDailyQuests(100);
    const b = generateDailyQuests(100);
    expect(a.activeQuests.map((q) => q.id)).toEqual(
      b.activeQuests.map((q) => q.id),
    );
  });

  it("different seeds produce different quests", () => {
    const a = generateDailyQuests(1);
    const b = generateDailyQuests(999);
    const aIds = a.activeQuests.map((q) => q.id).join(",");
    const bIds = b.activeQuests.map((q) => q.id).join(",");
    expect(aIds).not.toBe(bIds);
  });

  it("all quests start with progress=0 and completed=false", () => {
    const s = generateDailyQuests(42);
    for (const q of s.activeQuests) {
      expect(q.progress).toBe(0);
      expect(q.completed).toBe(false);
    }
  });

  it("quests have unique ids", () => {
    const s = generateDailyQuests(42);
    const ids = s.activeQuests.map((q) => q.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("sets dailyResetTime in the future", () => {
    const before = Date.now();
    const s = generateDailyQuests(42);
    expect(s.dailyResetTime).toBeGreaterThan(before);
  });

  it("each quest has a valid type", () => {
    const validTypes: QuestType[] = [
      "kill_enemies",
      "survive_time",
      "collect_items",
      "reach_wave",
      "deal_damage",
      "use_ability",
    ];
    const s = generateDailyQuests(42);
    for (const q of s.activeQuests) {
      expect(validTypes).toContain(q.type);
    }
  });

  it("each quest has a valid rarity", () => {
    const validRarities: QuestRarity[] = ["common", "rare", "epic"];
    const s = generateDailyQuests(42);
    for (const q of s.activeQuests) {
      expect(validRarities).toContain(q.rarity);
    }
  });
});

// ── updateProgress ──────────────────────────────────────────────

describe("updateProgress", () => {
  it("increases progress for matching quest type", () => {
    const s = generateDailyQuests(42);
    const type = s.activeQuests[0].type;
    const s2 = updateProgress(s, type, 10);
    const updated = s2.activeQuests.find((q) => q.type === type);
    expect(updated!.progress).toBe(10);
  });

  it("does not affect quests of different type", () => {
    const s = generateDailyQuests(42);
    const first = s.activeQuests[0];
    // find a different type
    const otherType: QuestType =
      first.type === "kill_enemies" ? "survive_time" : "kill_enemies";
    const s2 = updateProgress(s, otherType, 999);
    expect(s2.activeQuests.find((q) => q.id === first.id)!.progress).toBe(0);
  });

  it("marks quest completed when progress >= target", () => {
    const s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    const s2 = updateProgress(s, quest.type, quest.target + 10);
    const updated = s2.activeQuests.find((q) => q.id === quest.id);
    expect(updated!.completed).toBe(true);
  });

  it("does not update already completed quests", () => {
    const s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    let s2 = updateProgress(s, quest.type, quest.target);
    const prog1 = s2.activeQuests.find((q) => q.id === quest.id)!.progress;
    s2 = updateProgress(s2, quest.type, 100);
    const prog2 = s2.activeQuests.find((q) => q.id === quest.id)!.progress;
    expect(prog2).toBe(prog1);
  });

  it("returns new state (immutable)", () => {
    const s = generateDailyQuests(42);
    const s2 = updateProgress(s, s.activeQuests[0].type, 1);
    expect(s2).not.toBe(s);
    expect(s.activeQuests[0].progress).toBe(0);
  });
});

// ── claimReward ─────────────────────────────────────────────────

describe("claimReward", () => {
  it("returns reward for completed quest", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const { reward } = claimReward(s, quest.id);
    expect(reward).not.toBeNull();
    expect(reward!.gold).toBeGreaterThan(0);
    expect(reward!.xp).toBeGreaterThan(0);
  });

  it("removes quest from activeQuests after claim", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const { state } = claimReward(s, quest.id);
    expect(state.activeQuests.find((q) => q.id === quest.id)).toBeUndefined();
  });

  it("adds quest id to completedIds", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const { state } = claimReward(s, quest.id);
    expect(state.completedIds).toContain(quest.id);
  });

  it("returns null reward for incomplete quest", () => {
    const s = generateDailyQuests(42);
    const { reward } = claimReward(s, s.activeQuests[0].id);
    expect(reward).toBeNull();
  });

  it("returns null reward for unknown quest id", () => {
    const s = generateDailyQuests(42);
    const { reward } = claimReward(s, "nonexistent");
    expect(reward).toBeNull();
  });

  it("cannot claim same quest twice", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const { state: s2 } = claimReward(s, quest.id);
    const { reward } = claimReward(s2, quest.id);
    expect(reward).toBeNull();
  });
});

// ── isQuestComplete ─────────────────────────────────────────────

describe("isQuestComplete", () => {
  it("returns false when progress < target", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 100,
      progress: 50,
      completed: false,
      reward: { gold: 10, xp: 5 },
    };
    expect(isQuestComplete(q)).toBe(false);
  });

  it("returns true when progress >= target", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 100,
      progress: 100,
      completed: true,
      reward: { gold: 10, xp: 5 },
    };
    expect(isQuestComplete(q)).toBe(true);
  });

  it("returns true when progress exceeds target", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 50,
      progress: 99,
      completed: true,
      reward: { gold: 10, xp: 5 },
    };
    expect(isQuestComplete(q)).toBe(true);
  });
});

// ── getCompletionPercent ────────────────────────────────────────

describe("getCompletionPercent", () => {
  it("returns 0 for no progress", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 100,
      progress: 0,
      completed: false,
      reward: { gold: 10, xp: 5 },
    };
    expect(getCompletionPercent(q)).toBe(0);
  });

  it("returns 50 for half progress", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 100,
      progress: 50,
      completed: false,
      reward: { gold: 10, xp: 5 },
    };
    expect(getCompletionPercent(q)).toBe(50);
  });

  it("clamps to 100", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 50,
      progress: 200,
      completed: true,
      reward: { gold: 10, xp: 5 },
    };
    expect(getCompletionPercent(q)).toBe(100);
  });

  it("returns 100 for zero target", () => {
    const q: Quest = {
      id: "t",
      name: "t",
      description: "t",
      type: "kill_enemies",
      rarity: "common",
      target: 0,
      progress: 0,
      completed: false,
      reward: { gold: 10, xp: 5 },
    };
    expect(getCompletionPercent(q)).toBe(100);
  });
});

// ── getActiveByType ─────────────────────────────────────────────

describe("getActiveByType", () => {
  it("filters by quest type", () => {
    const s = generateDailyQuests(42);
    const type = s.activeQuests[0].type;
    const results = getActiveByType(s, type);
    for (const q of results) {
      expect(q.type).toBe(type);
    }
  });

  it("excludes completed quests", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const results = getActiveByType(s, quest.type);
    expect(results.find((q) => q.id === quest.id)).toBeUndefined();
  });

  it("returns empty for unmatched type", () => {
    const s = createQuestState();
    expect(getActiveByType(s, "kill_enemies")).toHaveLength(0);
  });
});

// ── getRewardMultiplier ─────────────────────────────────────────

describe("getRewardMultiplier", () => {
  it("common = 1x", () => {
    expect(getRewardMultiplier("common")).toBe(1);
  });

  it("rare = 2x", () => {
    expect(getRewardMultiplier("rare")).toBe(2);
  });

  it("epic = 3x", () => {
    expect(getRewardMultiplier("epic")).toBe(3);
  });
});

// ── resetDailyQuests ────────────────────────────────────────────

describe("resetDailyQuests", () => {
  it("generates new quests", () => {
    let s = generateDailyQuests(42);
    s = resetDailyQuests(s, 99);
    expect(s.activeQuests).toHaveLength(3);
  });

  it("preserves completedIds", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    const { state: claimed } = claimReward(s, quest.id);
    const reset = resetDailyQuests(claimed, 99);
    expect(reset.completedIds).toContain(quest.id);
  });

  it("new seed gives different quests", () => {
    const s1 = generateDailyQuests(1);
    const s2 = resetDailyQuests(s1, 9999);
    const ids1 = s1.activeQuests.map((q) => q.name).join(",");
    const ids2 = s2.activeQuests.map((q) => q.name).join(",");
    expect(ids1).not.toBe(ids2);
  });
});

// ── getQuestTemplates ───────────────────────────────────────────

describe("getQuestTemplates", () => {
  it("returns 16 templates", () => {
    expect(getQuestTemplates().length).toBe(16);
  });

  it("covers all 6 quest types", () => {
    const types = new Set(getQuestTemplates().map((t) => t.type));
    expect(types.size).toBe(6);
  });

  it("covers all 3 rarities", () => {
    const rarities = new Set(getQuestTemplates().map((t) => t.rarity));
    expect(rarities.size).toBe(3);
  });
});

// ── Integration ─────────────────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: generate → progress → complete → claim", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    s = updateProgress(s, quest.type, quest.target);
    expect(s.activeQuests.find((q) => q.id === quest.id)!.completed).toBe(true);
    const { state, reward } = claimReward(s, quest.id);
    expect(reward).not.toBeNull();
    expect(state.completedIds).toContain(quest.id);
    expect(state.activeQuests).toHaveLength(2);
  });

  it("partial progress across multiple updates", () => {
    let s = generateDailyQuests(42);
    const quest = s.activeQuests[0];
    const half = Math.floor(quest.target / 2);
    s = updateProgress(s, quest.type, half);
    expect(s.activeQuests.find((q) => q.id === quest.id)!.completed).toBe(
      false,
    );
    s = updateProgress(s, quest.type, quest.target);
    expect(s.activeQuests.find((q) => q.id === quest.id)!.completed).toBe(true);
  });
});
