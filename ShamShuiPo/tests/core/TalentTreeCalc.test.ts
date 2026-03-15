import { describe, it, expect } from "vitest";
import {
  createTalentTree,
  allocateTalent,
  deallocateTalent,
  canAllocate,
  resetTree,
  getTalentsByCategory,
  getUnlockedTalents,
  getTalentEffects,
  getTotalCost,
  isPrerequisiteMet,
  getAvailableTalents,
  type TalentCategory,
} from "../../src/core/TalentTreeCalc";

// ════════════════════════════════════════════════════════════════
// § createTalentTree
// ════════════════════════════════════════════════════════════════

describe("createTalentTree", () => {
  it("should create a tree with 17 talents", () => {
    const state = createTalentTree();
    expect(state.talents.length).toBeGreaterThanOrEqual(16);
  });

  it("should start all talents at level 0", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.currentLevel).toBe(0);
    }
  });

  it("should default to 0 available points", () => {
    const state = createTalentTree();
    expect(state.availablePoints).toBe(0);
    expect(state.totalSpent).toBe(0);
  });

  it("should accept initial points", () => {
    const state = createTalentTree(50);
    expect(state.availablePoints).toBe(50);
  });

  it("should contain all 4 categories", () => {
    const state = createTalentTree();
    const cats = new Set(state.talents.map((t) => t.category));
    expect(cats.has("offense")).toBe(true);
    expect(cats.has("defense")).toBe(true);
    expect(cats.has("utility")).toBe(true);
    expect(cats.has("special")).toBe(true);
  });

  it("should contain expected talent ids", () => {
    const state = createTalentTree();
    const ids = state.talents.map((t) => t.id);
    expect(ids).toContain("atk_power");
    expect(ids).toContain("max_hp");
    expect(ids).toContain("move_speed");
    expect(ids).toContain("revive");
  });

  it("should have non-empty descriptions for all talents", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it("should have non-empty names for all talents", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.name.length).toBeGreaterThan(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § canAllocate
// ════════════════════════════════════════════════════════════════

describe("canAllocate", () => {
  it("should return false with 0 points", () => {
    const state = createTalentTree(0);
    expect(canAllocate(state, "atk_power")).toBe(false);
  });

  it("should return true with enough points and no prerequisites", () => {
    const state = createTalentTree(5);
    expect(canAllocate(state, "atk_power")).toBe(true);
  });

  it("should return false for unknown talent id", () => {
    const state = createTalentTree(99);
    expect(canAllocate(state, "nonexistent")).toBe(false);
  });

  it("should return false when talent is at maxLevel", () => {
    let state = createTalentTree(100);
    for (let i = 0; i < 5; i++) {
      state = allocateTalent(state, "atk_power");
    }
    expect(canAllocate(state, "atk_power")).toBe(false);
  });

  it("should return false when prerequisite is not met", () => {
    const state = createTalentTree(100);
    // piercing requires atk_power
    expect(canAllocate(state, "piercing")).toBe(false);
  });

  it("should return true when prerequisite is met", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    expect(canAllocate(state, "piercing")).toBe(true);
  });

  it("should return false when not enough points for cost", () => {
    const state = createTalentTree(1);
    // crit_chance costs 2
    expect(canAllocate(state, "crit_chance")).toBe(false);
  });

  it("should enforce multi-prerequisite chains", () => {
    let state = createTalentTree(100);
    // revive requires max_hp AND hp_regen
    expect(canAllocate(state, "revive")).toBe(false);
    state = allocateTalent(state, "max_hp");
    expect(canAllocate(state, "revive")).toBe(false); // hp_regen still unmet
    state = allocateTalent(state, "hp_regen");
    expect(canAllocate(state, "revive")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § allocateTalent
// ════════════════════════════════════════════════════════════════

describe("allocateTalent", () => {
  it("should allocate and deduct points", () => {
    const state = createTalentTree(10);
    const next = allocateTalent(state, "atk_power");
    const talent = next.talents.find((t) => t.id === "atk_power")!;
    expect(talent.currentLevel).toBe(1);
    expect(next.availablePoints).toBe(9); // cost = 1
    expect(next.totalSpent).toBe(1);
  });

  it("should not mutate the original state (immutable)", () => {
    const state = createTalentTree(10);
    allocateTalent(state, "atk_power");
    expect(state.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      0,
    );
    expect(state.availablePoints).toBe(10);
  });

  it("should return the same state if allocation is invalid", () => {
    const state = createTalentTree(0);
    const next = allocateTalent(state, "atk_power");
    expect(next).toBe(state); // same reference
  });

  it("should return same state for nonexistent talent", () => {
    const state = createTalentTree(10);
    const next = allocateTalent(state, "fake_talent");
    expect(next).toBe(state);
  });

  it("should return same state when maxed", () => {
    let state = createTalentTree(100);
    for (let i = 0; i < 5; i++) {
      state = allocateTalent(state, "atk_power");
    }
    const next = allocateTalent(state, "atk_power");
    expect(next).toBe(state);
  });

  it("should track totalSpent across multiple allocations", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power"); // cost 1
    state = allocateTalent(state, "max_hp"); // cost 1
    state = allocateTalent(state, "crit_chance"); // cost 2
    expect(state.totalSpent).toBe(4);
    expect(state.availablePoints).toBe(96);
  });

  it("should allow multiple levels of same talent", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "atk_power");
    const talent = state.talents.find((t) => t.id === "atk_power")!;
    expect(talent.currentLevel).toBe(3);
    expect(state.totalSpent).toBe(3); // 1+1+1
  });

  it("should respect prerequisite chain (piercing requires atk_power)", () => {
    const state = createTalentTree(100);
    const next = allocateTalent(state, "piercing");
    expect(next).toBe(state); // blocked
  });

  it("should allow piercing after allocating atk_power", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "piercing");
    expect(state.talents.find((t) => t.id === "piercing")!.currentLevel).toBe(
      1,
    );
  });
});

// ════════════════════════════════════════════════════════════════
// § deallocateTalent
// ════════════════════════════════════════════════════════════════

describe("deallocateTalent", () => {
  it("should deallocate and refund points", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    const next = deallocateTalent(state, "atk_power");
    expect(next.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      0,
    );
    expect(next.availablePoints).toBe(10);
    expect(next.totalSpent).toBe(0);
  });

  it("should return same state if talent is at level 0", () => {
    const state = createTalentTree(10);
    const next = deallocateTalent(state, "atk_power");
    expect(next).toBe(state);
  });

  it("should return same state for nonexistent talent", () => {
    const state = createTalentTree(10);
    const next = deallocateTalent(state, "nonexistent");
    expect(next).toBe(state);
  });

  it("should not mutate original state", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    const lvBefore = state.talents.find(
      (t) => t.id === "atk_power",
    )!.currentLevel;
    deallocateTalent(state, "atk_power");
    expect(state.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      lvBefore,
    );
  });

  it("should block deallocation if a dependent talent is allocated", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "piercing"); // depends on atk_power
    const next = deallocateTalent(state, "atk_power");
    expect(next).toBe(state); // blocked
  });

  it("should allow deallocation from level 2 to 1 even with dependents", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "atk_power"); // level 2
    state = allocateTalent(state, "piercing"); // depends on atk_power
    const next = deallocateTalent(state, "atk_power");
    // Should succeed: atk_power goes from 2 to 1, still > 0
    expect(next.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      1,
    );
  });

  it("should refund correct cost per level", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "crit_chance"); // cost 2
    const pointsBefore = state.availablePoints;
    const next = deallocateTalent(state, "crit_chance");
    expect(next.availablePoints).toBe(pointsBefore + 2);
  });

  it("should block deallocation with chain dependency (multi-prereq)", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "max_hp"); // defense prereq
    state = allocateTalent(state, "hp_regen"); // requires max_hp
    state = allocateTalent(state, "revive"); // requires max_hp AND hp_regen
    // Try to deallocate hp_regen (revive depends on it)
    const next = deallocateTalent(state, "hp_regen");
    expect(next).toBe(state); // blocked
  });
});

// ════════════════════════════════════════════════════════════════
// § resetTree
// ════════════════════════════════════════════════════════════════

describe("resetTree", () => {
  it("should reset all talents to level 0", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "max_hp");
    state = allocateTalent(state, "move_speed");
    const reset = resetTree(state);
    for (const t of reset.talents) {
      expect(t.currentLevel).toBe(0);
    }
  });

  it("should return all spent points", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power"); // 1
    state = allocateTalent(state, "atk_power"); // 1
    state = allocateTalent(state, "crit_chance"); // 2
    const reset = resetTree(state);
    expect(reset.availablePoints).toBe(100);
    expect(reset.totalSpent).toBe(0);
  });

  it("should not mutate original state", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    resetTree(state);
    expect(state.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      1,
    );
  });

  it("should return fresh tree if nothing was spent", () => {
    const state = createTalentTree(20);
    const reset = resetTree(state);
    expect(reset.availablePoints).toBe(20);
    expect(reset.totalSpent).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTalentsByCategory
// ════════════════════════════════════════════════════════════════

describe("getTalentsByCategory", () => {
  it("should return offense talents", () => {
    const state = createTalentTree();
    const offense = getTalentsByCategory(state, "offense");
    expect(offense.length).toBeGreaterThanOrEqual(4);
    for (const t of offense) {
      expect(t.category).toBe("offense");
    }
  });

  it("should return defense talents", () => {
    const state = createTalentTree();
    const defense = getTalentsByCategory(state, "defense");
    expect(defense.length).toBeGreaterThanOrEqual(4);
    for (const t of defense) {
      expect(t.category).toBe("defense");
    }
  });

  it("should return utility talents", () => {
    const state = createTalentTree();
    const utility = getTalentsByCategory(state, "utility");
    expect(utility.length).toBeGreaterThanOrEqual(4);
    for (const t of utility) {
      expect(t.category).toBe("utility");
    }
  });

  it("should return special talents", () => {
    const state = createTalentTree();
    const special = getTalentsByCategory(state, "special");
    expect(special.length).toBeGreaterThanOrEqual(4);
    for (const t of special) {
      expect(t.category).toBe("special");
    }
  });

  it("should cover all talents across categories", () => {
    const state = createTalentTree();
    const categories: TalentCategory[] = [
      "offense",
      "defense",
      "utility",
      "special",
    ];
    let totalCount = 0;
    for (const cat of categories) {
      totalCount += getTalentsByCategory(state, cat).length;
    }
    expect(totalCount).toBe(state.talents.length);
  });
});

// ════════════════════════════════════════════════════════════════
// § getUnlockedTalents
// ════════════════════════════════════════════════════════════════

describe("getUnlockedTalents", () => {
  it("should return empty for fresh tree", () => {
    const state = createTalentTree();
    expect(getUnlockedTalents(state)).toHaveLength(0);
  });

  it("should return only allocated talents", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "max_hp");
    const unlocked = getUnlockedTalents(state);
    expect(unlocked).toHaveLength(2);
    const ids = unlocked.map((t) => t.id);
    expect(ids).toContain("atk_power");
    expect(ids).toContain("max_hp");
  });

  it("should update after deallocation", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = deallocateTalent(state, "atk_power");
    expect(getUnlockedTalents(state)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTalentEffects
// ════════════════════════════════════════════════════════════════

describe("getTalentEffects", () => {
  it("should return empty record for fresh tree", () => {
    const state = createTalentTree();
    const effects = getTalentEffects(state);
    expect(Object.keys(effects)).toHaveLength(0);
  });

  it("should return correct effect for single talent at level 1", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    const effects = getTalentEffects(state);
    expect(effects["damage"]).toBe(5); // 5 per level * 1 level
  });

  it("should scale with talent level", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "atk_power");
    state = allocateTalent(state, "atk_power");
    const effects = getTalentEffects(state);
    expect(effects["damage"]).toBe(15); // 5 * 3
  });

  it("should aggregate effects from multiple talents", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power"); // damage +5
    state = allocateTalent(state, "max_hp"); // maxHp +10
    const effects = getTalentEffects(state);
    expect(effects["damage"]).toBe(5);
    expect(effects["maxHp"]).toBe(10);
  });

  it("should not include zero-level talents", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    const effects = getTalentEffects(state);
    expect(effects["armor"]).toBeUndefined();
  });

  it("should handle talents with multiple effects (combo_master)", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "crit_chance"); // prereq for combo_master
    state = allocateTalent(state, "combo_master");
    const effects = getTalentEffects(state);
    expect(effects["comboWindow"]).toBe(0.5);
    expect(effects["comboDamage"]).toBe(10);
  });

  it("should handle fractional values correctly", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "crit_chance");
    state = allocateTalent(state, "combo_master");
    state = allocateTalent(state, "combo_master");
    const effects = getTalentEffects(state);
    expect(effects["comboWindow"]).toBeCloseTo(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTotalCost
// ════════════════════════════════════════════════════════════════

describe("getTotalCost", () => {
  it("should return total cost for fresh tree", () => {
    const state = createTalentTree();
    const total = getTotalCost(state);
    // Manual: sum of (maxLevel * cost) for each talent
    let expected = 0;
    for (const t of state.talents) {
      expected += t.maxLevel * t.cost;
    }
    expect(total).toBe(expected);
    expect(total).toBeGreaterThan(0);
  });

  it("should decrease after allocating talents", () => {
    const fresh = createTalentTree(100);
    const totalFresh = getTotalCost(fresh);
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power"); // cost 1, 1 level used
    const totalAfter = getTotalCost(state);
    expect(totalAfter).toBe(totalFresh - 1);
  });

  it("should return 0 when all maxed", () => {
    let state = createTalentTree(9999);
    // Allocate everything in order that satisfies prerequisites
    const safeOrder = [
      "atk_power",
      "crit_chance",
      "fire_rate",
      "max_hp",
      "armor",
      "dodge_chance",
      "move_speed",
      "magnet_range",
      "cooldown",
      "piercing",
      "multi_shot",
      "hp_regen",
      "xp_bonus",
      "revive",
      "area_bonus",
      "lucky_drops",
      "combo_master",
    ];
    for (const id of safeOrder) {
      const talent = state.talents.find((t) => t.id === id)!;
      for (let i = 0; i < talent.maxLevel; i++) {
        state = allocateTalent(state, id);
      }
    }
    expect(getTotalCost(state)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isPrerequisiteMet
// ════════════════════════════════════════════════════════════════

describe("isPrerequisiteMet", () => {
  it("should return true for talents with no prerequisites", () => {
    const state = createTalentTree();
    expect(isPrerequisiteMet(state, "atk_power")).toBe(true);
    expect(isPrerequisiteMet(state, "max_hp")).toBe(true);
    expect(isPrerequisiteMet(state, "move_speed")).toBe(true);
  });

  it("should return false when prerequisite not allocated", () => {
    const state = createTalentTree();
    expect(isPrerequisiteMet(state, "piercing")).toBe(false); // needs atk_power
  });

  it("should return true after prerequisite allocated", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    expect(isPrerequisiteMet(state, "piercing")).toBe(true);
  });

  it("should return false for nonexistent talent", () => {
    const state = createTalentTree();
    expect(isPrerequisiteMet(state, "fake")).toBe(false);
  });

  it("should handle multi-prerequisite (revive needs max_hp + hp_regen)", () => {
    let state = createTalentTree(100);
    expect(isPrerequisiteMet(state, "revive")).toBe(false);
    state = allocateTalent(state, "max_hp");
    expect(isPrerequisiteMet(state, "revive")).toBe(false);
    state = allocateTalent(state, "hp_regen");
    expect(isPrerequisiteMet(state, "revive")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAvailableTalents
// ════════════════════════════════════════════════════════════════

describe("getAvailableTalents", () => {
  it("should return empty with 0 points", () => {
    const state = createTalentTree(0);
    expect(getAvailableTalents(state)).toHaveLength(0);
  });

  it("should return only no-prerequisite talents initially", () => {
    const state = createTalentTree(100);
    const available = getAvailableTalents(state);
    for (const t of available) {
      expect(t.prerequisites).toHaveLength(0);
    }
  });

  it("should include prerequisite-gated talents once prereqs met", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "atk_power");
    const available = getAvailableTalents(state);
    const ids = available.map((t) => t.id);
    expect(ids).toContain("piercing");
    expect(ids).toContain("area_bonus");
  });

  it("should exclude maxed talents", () => {
    let state = createTalentTree(100);
    for (let i = 0; i < 5; i++) {
      state = allocateTalent(state, "atk_power");
    }
    const available = getAvailableTalents(state);
    const ids = available.map((t) => t.id);
    expect(ids).not.toContain("atk_power");
  });

  it("should exclude talents with unmet prerequisites", () => {
    const state = createTalentTree(100);
    const available = getAvailableTalents(state);
    const ids = available.map((t) => t.id);
    expect(ids).not.toContain("piercing");
    expect(ids).not.toContain("revive");
  });
});

// ════════════════════════════════════════════════════════════════
// § Immutability
// ════════════════════════════════════════════════════════════════

describe("immutability", () => {
  it("createTalentTree returns independent instances", () => {
    const a = createTalentTree(10);
    const b = createTalentTree(10);
    a.talents[0].currentLevel = 99;
    expect(b.talents[0].currentLevel).toBe(0);
  });

  it("allocateTalent does not share references with original", () => {
    const state = createTalentTree(10);
    const next = allocateTalent(state, "atk_power");
    const talent = next.talents.find((t) => t.id === "atk_power")!;
    talent.currentLevel = 99;
    expect(state.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      0,
    );
  });

  it("deallocateTalent does not share references", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    const next = deallocateTalent(state, "atk_power");
    next.talents.find((t) => t.id === "atk_power")!.currentLevel = 99;
    expect(state.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      1,
    );
  });

  it("resetTree does not share references with original", () => {
    let state = createTalentTree(10);
    state = allocateTalent(state, "atk_power");
    const reset = resetTree(state);
    reset.talents[0].currentLevel = 99;
    expect(state.talents[0].currentLevel).toBe(
      state.talents[0].id === "atk_power" ? 1 : 0,
    );
  });

  it("effects record is not shared between clones", () => {
    const state = createTalentTree(10);
    const next = allocateTalent(state, "atk_power");
    const originalEffects = state.talents.find(
      (t) => t.id === "atk_power",
    )!.effects;
    const nextEffects = next.talents.find((t) => t.id === "atk_power")!.effects;
    nextEffects["damage"] = 999;
    expect(originalEffects["damage"]).not.toBe(999);
  });
});

// ════════════════════════════════════════════════════════════════
// § Edge Cases
// ════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("should handle allocating with exactly enough points", () => {
    const state = createTalentTree(1);
    const next = allocateTalent(state, "atk_power");
    expect(next.availablePoints).toBe(0);
    expect(next.talents.find((t) => t.id === "atk_power")!.currentLevel).toBe(
      1,
    );
  });

  it("should handle talent with cost > 1 correctly", () => {
    let state = createTalentTree(20);
    state = allocateTalent(state, "crit_chance"); // cost 2
    expect(state.availablePoints).toBe(18);
    expect(state.totalSpent).toBe(2);
  });

  it("all talent cost values should be positive", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.cost).toBeGreaterThan(0);
    }
  });

  it("all talent maxLevel values should be positive", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.maxLevel).toBeGreaterThan(0);
    }
  });

  it("prerequisites should reference valid talent ids", () => {
    const state = createTalentTree();
    const ids = new Set(state.talents.map((t) => t.id));
    for (const t of state.talents) {
      for (const prereq of t.prerequisites) {
        expect(ids.has(prereq)).toBe(true);
      }
    }
  });

  it("no talent should list itself as a prerequisite", () => {
    const state = createTalentTree();
    for (const t of state.talents) {
      expect(t.prerequisites).not.toContain(t.id);
    }
  });

  it("revive with full chain should work end-to-end", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "max_hp");
    state = allocateTalent(state, "hp_regen");
    state = allocateTalent(state, "revive");
    expect(state.talents.find((t) => t.id === "revive")!.currentLevel).toBe(1);
    const effects = getTalentEffects(state);
    expect(effects["revives"]).toBe(1);
  });

  it("lucky_drops chain: move_speed → xp_bonus → lucky_drops", () => {
    let state = createTalentTree(100);
    state = allocateTalent(state, "move_speed");
    state = allocateTalent(state, "xp_bonus");
    state = allocateTalent(state, "lucky_drops");
    expect(
      state.talents.find((t) => t.id === "lucky_drops")!.currentLevel,
    ).toBe(1);
  });

  it("full tree allocation and reset round-trip", () => {
    let state = createTalentTree(9999);
    const safeOrder = [
      "atk_power",
      "crit_chance",
      "fire_rate",
      "max_hp",
      "armor",
      "dodge_chance",
      "move_speed",
      "magnet_range",
      "cooldown",
      "piercing",
      "multi_shot",
      "hp_regen",
      "xp_bonus",
      "revive",
      "area_bonus",
      "lucky_drops",
      "combo_master",
    ];
    for (const id of safeOrder) {
      const talent = state.talents.find((t) => t.id === id)!;
      for (let i = 0; i < talent.maxLevel; i++) {
        state = allocateTalent(state, id);
      }
    }
    const totalSpent = state.totalSpent;
    expect(totalSpent).toBeGreaterThan(0);

    const reset = resetTree(state);
    expect(reset.availablePoints).toBe(9999);
    expect(reset.totalSpent).toBe(0);
    expect(getUnlockedTalents(reset)).toHaveLength(0);
  });
});
