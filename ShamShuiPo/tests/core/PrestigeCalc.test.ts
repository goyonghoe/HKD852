// ── Tests: PrestigeCalc ──

import { describe, it, expect } from "vitest";
import {
  createPrestigeState,
  addRunResults,
  canPrestige,
  performPrestige,
  getPrestigeXpRequired,
  getPrestigeLevel,
  getPrestigeTokensForLevel,
  purchasePerk,
  getPermanentBonus,
  getAllBonuses,
  getPrestigeMultiplier,
  getLifetimeStats,
  estimateRunsToPrestige,
  serializePrestige,
  deserializePrestige,
  PRESTIGE_PERKS,
  type PrestigeState,
} from "../../src/core/PrestigeCalc";

// ════════════════════════════════════════════════════════════════
// § createPrestigeState
// ════════════════════════════════════════════════════════════════

describe("createPrestigeState", () => {
  it("returns level 0 with no bonuses", () => {
    const s = createPrestigeState();
    expect(s.level).toBe(0);
    expect(s.totalPrestigeXp).toBe(0);
    expect(s.currentPrestigeXp).toBe(0);
    expect(s.permanentBonuses).toEqual({});
    expect(s.prestigeTokens).toBe(0);
  });

  it("starts with zero lifetime stats", () => {
    const s = createPrestigeState();
    expect(s.lifetimeRuns).toBe(0);
    expect(s.lifetimeKills).toBe(0);
    expect(s.lifetimeCoins).toBe(0);
    expect(s.lifetimeScore).toBe(0);
  });

  it("sets xpToNextLevel for level 0", () => {
    const s = createPrestigeState();
    expect(s.xpToNextLevel).toBe(1000); // 1000 * 2^0
  });
});

// ════════════════════════════════════════════════════════════════
// § getPrestigeXpRequired
// ════════════════════════════════════════════════════════════════

describe("getPrestigeXpRequired", () => {
  it("level 0 requires 1000 XP", () => {
    expect(getPrestigeXpRequired(0)).toBe(1000);
  });

  it("level 1 requires 2000 XP", () => {
    expect(getPrestigeXpRequired(1)).toBe(2000);
  });

  it("level 5 requires 32000 XP", () => {
    expect(getPrestigeXpRequired(5)).toBe(32000);
  });

  it("level 10 requires 1024000 XP", () => {
    expect(getPrestigeXpRequired(10)).toBe(1024000);
  });

  it("negative level returns Infinity", () => {
    expect(getPrestigeXpRequired(-1)).toBe(Infinity);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPrestigeLevel
// ════════════════════════════════════════════════════════════════

describe("getPrestigeLevel", () => {
  it("0 XP = level 0", () => {
    expect(getPrestigeLevel(0)).toBe(0);
  });

  it("999 XP = level 0 (not enough for level 1)", () => {
    expect(getPrestigeLevel(999)).toBe(0);
  });

  it("1000 XP = level 1", () => {
    expect(getPrestigeLevel(1000)).toBe(1);
  });

  it("2999 XP = level 1", () => {
    expect(getPrestigeLevel(2999)).toBe(1);
  });

  it("3000 XP = level 2 (1000 + 2000 = 3000)", () => {
    expect(getPrestigeLevel(3000)).toBe(2);
  });

  it("7000 XP = level 3 (1000 + 2000 + 4000 = 7000)", () => {
    expect(getPrestigeLevel(7000)).toBe(3);
  });

  it("negative XP = level 0", () => {
    expect(getPrestigeLevel(-100)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPrestigeTokensForLevel
// ════════════════════════════════════════════════════════════════

describe("getPrestigeTokensForLevel", () => {
  it("level 0 gives 0 tokens", () => {
    expect(getPrestigeTokensForLevel(0)).toBe(0);
  });

  it("level 1 gives 3 tokens", () => {
    expect(getPrestigeTokensForLevel(1)).toBe(3);
  });

  it("level 5 gives 15 tokens", () => {
    expect(getPrestigeTokensForLevel(5)).toBe(15);
  });

  it("negative level gives 0 tokens", () => {
    expect(getPrestigeTokensForLevel(-1)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § addRunResults
// ════════════════════════════════════════════════════════════════

describe("addRunResults", () => {
  it("increments lifetime stats", () => {
    const s = addRunResults(createPrestigeState(), 5000, 100, 300);
    expect(s.lifetimeRuns).toBe(1);
    expect(s.lifetimeKills).toBe(100);
    expect(s.lifetimeCoins).toBe(300);
    expect(s.lifetimeScore).toBe(5000);
  });

  it("accumulates prestige XP from score", () => {
    const s = addRunResults(createPrestigeState(), 5000, 100, 300);
    expect(s.totalPrestigeXp).toBe(5000);
  });

  it("does not auto-level (level only changes via performPrestige)", () => {
    const s = addRunResults(createPrestigeState(), 1500, 50, 100);
    // Level stays 0 — prestige leveling is manual
    expect(s.level).toBe(0);
    expect(s.currentPrestigeXp).toBe(1500);
    expect(s.totalPrestigeXp).toBe(1500);
  });

  it("accumulates over multiple runs without auto-leveling", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 500, 20, 50);
    s = addRunResults(s, 500, 20, 50);
    s = addRunResults(s, 500, 20, 50);
    expect(s.lifetimeRuns).toBe(3);
    expect(s.lifetimeScore).toBe(1500);
    expect(s.totalPrestigeXp).toBe(1500);
    expect(s.level).toBe(0); // level only changes via performPrestige
  });

  it("does not mutate original state", () => {
    const original = createPrestigeState();
    addRunResults(original, 5000, 100, 300);
    expect(original.lifetimeRuns).toBe(0);
    expect(original.lifetimeScore).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § canPrestige
// ════════════════════════════════════════════════════════════════

describe("canPrestige", () => {
  it("cannot prestige at level 0 with 0 score", () => {
    expect(canPrestige(createPrestigeState())).toBe(false);
  });

  it("cannot prestige at level 0 with 49999 score", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 49999, 100, 100);
    expect(canPrestige(s)).toBe(false);
  });

  it("can prestige at level 0 with 50000 score", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 50000, 100, 100);
    expect(canPrestige(s)).toBe(true);
  });

  it("prestige 2 requires 200000 lifetime score", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 200000, 500, 1000);
    s = performPrestige(s); // now level 1
    expect(canPrestige(s)).toBe(true); // 200000 >= 200000
  });

  it("prestige 3 requires 500000 lifetime score", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 499999, 500, 1000);
    s = performPrestige(s); // level 1
    s = performPrestige(s); // level 2
    expect(canPrestige(s)).toBe(false); // 499999 < 500000
  });
});

// ════════════════════════════════════════════════════════════════
// § performPrestige
// ════════════════════════════════════════════════════════════════

describe("performPrestige", () => {
  it("increments level when eligible", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 60000, 200, 500);
    s = performPrestige(s);
    expect(s.level).toBe(1);
  });

  it("grants tokens for the new level", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 60000, 200, 500);
    s = performPrestige(s);
    expect(s.prestigeTokens).toBe(3); // level 1 * 3
  });

  it("keeps lifetime stats after prestige", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 60000, 200, 500);
    s = performPrestige(s);
    expect(s.lifetimeScore).toBe(60000);
    expect(s.lifetimeKills).toBe(200);
    expect(s.lifetimeRuns).toBe(1);
  });

  it("returns unchanged state if cannot prestige", () => {
    const s = createPrestigeState();
    const result = performPrestige(s);
    expect(result).toEqual(s);
  });

  it("does not mutate original state", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 60000, 200, 500);
    const before = { ...s };
    performPrestige(s);
    expect(s.level).toBe(before.level);
  });
});

// ════════════════════════════════════════════════════════════════
// § purchasePerk
// ════════════════════════════════════════════════════════════════

describe("purchasePerk", () => {
  function stateWithTokens(tokens: number): PrestigeState {
    return { ...createPrestigeState(), prestigeTokens: tokens };
  }

  it("purchases base_damage for 1 token", () => {
    const { state, success, reason } = purchasePerk(
      stateWithTokens(5),
      "base_damage",
    );
    expect(success).toBe(true);
    expect(reason).toBe("ok");
    expect(state.prestigeTokens).toBe(4);
    expect(state.permanentBonuses["base_damage"]).toBe(1);
  });

  it("fails with unknown perk id", () => {
    const { success, reason } = purchasePerk(stateWithTokens(5), "nonexistent");
    expect(success).toBe(false);
    expect(reason).toContain("Unknown perk");
  });

  it("fails when not enough tokens", () => {
    const { success, reason } = purchasePerk(stateWithTokens(0), "base_damage");
    expect(success).toBe(false);
    expect(reason).toContain("Not enough tokens");
  });

  it("fails when perk is at max level", () => {
    let s = stateWithTokens(100);
    // Max out base_damage (maxLevel 10, cost 1 each)
    for (let i = 0; i < 10; i++) {
      const result = purchasePerk(s, "base_damage");
      s = result.state;
    }
    const { success, reason } = purchasePerk(s, "base_damage");
    expect(success).toBe(false);
    expect(reason).toContain("max level");
  });

  it("weapon_slots costs 5 tokens", () => {
    const { state, success } = purchasePerk(stateWithTokens(5), "weapon_slots");
    expect(success).toBe(true);
    expect(state.prestigeTokens).toBe(0);
  });

  it("weapon_slots fails with only 4 tokens", () => {
    const { success } = purchasePerk(stateWithTokens(4), "weapon_slots");
    expect(success).toBe(false);
  });

  it("does not mutate original state", () => {
    const original = stateWithTokens(5);
    purchasePerk(original, "base_damage");
    expect(original.prestigeTokens).toBe(5);
    expect(original.permanentBonuses).toEqual({});
  });
});

// ════════════════════════════════════════════════════════════════
// § getPermanentBonus
// ════════════════════════════════════════════════════════════════

describe("getPermanentBonus", () => {
  it("returns 0 for unpurchased stat", () => {
    expect(getPermanentBonus(createPrestigeState(), "damage")).toBe(0);
  });

  it("returns correct bonus for purchased perk", () => {
    let s: PrestigeState = {
      ...createPrestigeState(),
      prestigeTokens: 10,
    };
    s = purchasePerk(s, "base_damage").state; // level 1 → 0.02
    s = purchasePerk(s, "base_damage").state; // level 2 → 0.04
    expect(getPermanentBonus(s, "damage")).toBeCloseTo(0.04);
  });

  it("returns 0 for unknown stat", () => {
    expect(getPermanentBonus(createPrestigeState(), "nonexistent")).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAllBonuses
// ════════════════════════════════════════════════════════════════

describe("getAllBonuses", () => {
  it("returns empty object with no perks", () => {
    expect(getAllBonuses(createPrestigeState())).toEqual({});
  });

  it("returns all purchased bonuses", () => {
    let s: PrestigeState = {
      ...createPrestigeState(),
      prestigeTokens: 20,
    };
    s = purchasePerk(s, "base_damage").state;
    s = purchasePerk(s, "base_hp").state;
    s = purchasePerk(s, "starting_coins").state;

    const bonuses = getAllBonuses(s);
    expect(bonuses["damage"]).toBeCloseTo(0.02);
    expect(bonuses["hp"]).toBeCloseTo(0.03);
    expect(bonuses["startingCoins"]).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPrestigeMultiplier
// ════════════════════════════════════════════════════════════════

describe("getPrestigeMultiplier", () => {
  it("level 0 gives 1.0x multiplier", () => {
    expect(getPrestigeMultiplier(createPrestigeState())).toBe(1.0);
  });

  it("level 1 gives 1.05x", () => {
    const s = { ...createPrestigeState(), level: 1 };
    expect(getPrestigeMultiplier(s)).toBeCloseTo(1.05);
  });

  it("level 10 gives 1.5x", () => {
    const s = { ...createPrestigeState(), level: 10 };
    expect(getPrestigeMultiplier(s)).toBeCloseTo(1.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § getLifetimeStats
// ════════════════════════════════════════════════════════════════

describe("getLifetimeStats", () => {
  it("returns zeroed stats for fresh state", () => {
    const stats = getLifetimeStats(createPrestigeState());
    expect(stats.lifetimeRuns).toBe(0);
    expect(stats.lifetimeKills).toBe(0);
    expect(stats.lifetimeCoins).toBe(0);
    expect(stats.lifetimeScore).toBe(0);
    expect(stats.prestigeLevel).toBe(0);
    expect(stats.totalPerks).toBe(0);
  });

  it("counts total perk levels", () => {
    let s: PrestigeState = {
      ...createPrestigeState(),
      prestigeTokens: 20,
    };
    s = purchasePerk(s, "base_damage").state;
    s = purchasePerk(s, "base_damage").state;
    s = purchasePerk(s, "base_hp").state;
    const stats = getLifetimeStats(s);
    expect(stats.totalPerks).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § estimateRunsToPrestige
// ════════════════════════════════════════════════════════════════

describe("estimateRunsToPrestige", () => {
  it("returns Infinity with no runs", () => {
    expect(estimateRunsToPrestige(createPrestigeState())).toBe(Infinity);
  });

  it("returns 0 if already eligible", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 60000, 100, 100);
    expect(estimateRunsToPrestige(s)).toBe(0);
  });

  it("estimates correct number of runs", () => {
    let s = createPrestigeState();
    // 1 run with 10000 score → need 50000 total → 40000 remaining → 4 more runs
    s = addRunResults(s, 10000, 50, 100);
    expect(estimateRunsToPrestige(s)).toBe(4);
  });

  it("rounds up partial runs", () => {
    let s = createPrestigeState();
    s = addRunResults(s, 15000, 50, 100);
    // avg 15000/run, need 50000 total, remaining 35000, 35000/15000 = 2.33 → 3
    expect(estimateRunsToPrestige(s)).toBe(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § serializePrestige / deserializePrestige
// ════════════════════════════════════════════════════════════════

describe("serializePrestige / deserializePrestige", () => {
  it("round-trips a fresh state", () => {
    const original = createPrestigeState();
    const json = serializePrestige(original);
    const restored = deserializePrestige(json);
    expect(restored).toEqual(original);
  });

  it("round-trips a state with perks and stats", () => {
    let s: PrestigeState = {
      ...createPrestigeState(),
      prestigeTokens: 20,
    };
    s = addRunResults(s, 5000, 100, 300);
    s = purchasePerk(s, "base_damage").state;

    const json = serializePrestige(s);
    const restored = deserializePrestige(json);
    expect(restored).toEqual(s);
  });

  it("returns fresh state on invalid JSON", () => {
    const restored = deserializePrestige("not valid json");
    expect(restored).toEqual(createPrestigeState());
  });

  it("fills missing fields with defaults", () => {
    const partial = JSON.stringify({ level: 5 });
    const restored = deserializePrestige(partial);
    expect(restored.level).toBe(5);
    expect(restored.totalPrestigeXp).toBe(0);
    expect(restored.permanentBonuses).toEqual({});
  });

  it("handles null permanentBonuses gracefully", () => {
    const bad = JSON.stringify({ level: 1, permanentBonuses: null });
    const restored = deserializePrestige(bad);
    expect(restored.permanentBonuses).toEqual({});
  });

  it("handles array permanentBonuses gracefully", () => {
    const bad = JSON.stringify({ level: 1, permanentBonuses: [1, 2, 3] });
    const restored = deserializePrestige(bad);
    expect(restored.permanentBonuses).toEqual({});
  });
});

// ════════════════════════════════════════════════════════════════
// § PRESTIGE_PERKS data integrity
// ════════════════════════════════════════════════════════════════

describe("PRESTIGE_PERKS", () => {
  it("has exactly 10 perks", () => {
    expect(PRESTIGE_PERKS).toHaveLength(10);
  });

  it("all perks have unique ids", () => {
    const ids = PRESTIGE_PERKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all perks start at currentLevel 0", () => {
    for (const perk of PRESTIGE_PERKS) {
      expect(perk.currentLevel).toBe(0);
    }
  });

  it("all perks have positive cost, maxLevel, and effectPerLevel", () => {
    for (const perk of PRESTIGE_PERKS) {
      expect(perk.cost).toBeGreaterThan(0);
      expect(perk.maxLevel).toBeGreaterThan(0);
      expect(perk.effectPerLevel).toBeGreaterThan(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration: full prestige flow
// ════════════════════════════════════════════════════════════════

describe("integration: full prestige flow", () => {
  it("play runs → prestige → buy perks → verify bonuses", () => {
    let s = createPrestigeState();

    // Play 10 runs, each scoring 5500
    for (let i = 0; i < 10; i++) {
      s = addRunResults(s, 5500, 30, 100);
    }
    expect(s.lifetimeScore).toBe(55000);
    expect(canPrestige(s)).toBe(true);

    // Prestige
    s = performPrestige(s);
    expect(s.level).toBe(1);
    expect(s.prestigeTokens).toBe(3);

    // Buy perks
    const r1 = purchasePerk(s, "base_damage");
    expect(r1.success).toBe(true);
    s = r1.state;

    const r2 = purchasePerk(s, "base_hp");
    expect(r2.success).toBe(true);
    s = r2.state;

    const r3 = purchasePerk(s, "xp_gain");
    expect(r3.success).toBe(true);
    s = r3.state;

    expect(s.prestigeTokens).toBe(0);

    // Verify bonuses
    expect(getPermanentBonus(s, "damage")).toBeCloseTo(0.02);
    expect(getPermanentBonus(s, "hp")).toBeCloseTo(0.03);
    expect(getPermanentBonus(s, "xpGain")).toBeCloseTo(0.05);

    // Multiplier
    expect(getPrestigeMultiplier(s)).toBeCloseTo(1.05);
  });

  it("prestige threshold 4+ uses 2.5x scaling", () => {
    let s = createPrestigeState();
    // Need to reach prestige 4: threshold = 500000 * 2.5 = 1250000
    s = addRunResults(s, 1_300_000, 5000, 10000);
    s = performPrestige(s); // 1
    s = performPrestige(s); // 2
    s = performPrestige(s); // 3
    expect(canPrestige(s)).toBe(true); // 1300000 >= 1250000
    s = performPrestige(s); // 4
    expect(s.level).toBe(4);
    // Tokens accumulated: 3 + 6 + 9 + 12 = 30
    expect(s.prestigeTokens).toBe(30);
  });
});
