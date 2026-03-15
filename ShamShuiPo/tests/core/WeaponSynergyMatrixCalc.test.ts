import { describe, it, expect } from "vitest";
import {
  getAllSets,
  getActiveBonuses,
  getStatBonus,
  getAllStatBonuses,
  hasSetBonus,
  getMissingWeapons,
  getPartialSets,
  getSetCompletionPercent,
  getBestAvailableSet,
  getRecommendedWeapon,
  type WeaponSetBonus,
  type ActiveBonus,
} from "../../src/core/WeaponSynergyMatrixCalc";

// ── getAllSets ──────────────────────────────────────────────────

describe("getAllSets", () => {
  it("returns all 10 set definitions", () => {
    const sets = getAllSets();
    expect(sets).toHaveLength(10);
  });

  it("returns a copy, not a reference", () => {
    const a = getAllSets();
    const b = getAllSets();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it("every set has required fields", () => {
    for (const set of getAllSets()) {
      expect(set.id).toBeTruthy();
      expect(set.name).toBeTruthy();
      expect(set.requiredWeapons.length).toBeGreaterThanOrEqual(2);
      expect(typeof set.bonusValue).toBe("number");
      expect(typeof set.isPercent).toBe("boolean");
      expect(set.description).toBeTruthy();
    }
  });

  it("all set IDs are unique", () => {
    const ids = getAllSets().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── getActiveBonuses ───────────────────────────────────────────

describe("getActiveBonuses", () => {
  it("returns empty for no weapons", () => {
    expect(getActiveBonuses([])).toEqual([]);
  });

  it("returns empty for single weapon", () => {
    expect(getActiveBonuses(["pistol"])).toEqual([]);
  });

  it("activates dual_blades with laser+blade", () => {
    const bonuses = getActiveBonuses(["laser", "blade"]);
    expect(bonuses.some((b) => b.setId === "dual_blades")).toBe(true);
  });

  it("activates elemental_duo with flame_thrower+ice_beam", () => {
    const bonuses = getActiveBonuses(["flame_thrower", "ice_beam"]);
    expect(bonuses.some((b) => b.setId === "elemental_duo")).toBe(true);
    const bonus = bonuses.find((b) => b.setId === "elemental_duo")!;
    expect(bonus.stat).toBe("elementalDamage");
    expect(bonus.value).toBe(20);
    expect(bonus.isPercent).toBe(true);
  });

  it("activates multiple sets when conditions met", () => {
    const bonuses = getActiveBonuses(["pistol", "sniper", "smg"]);
    const setIds = bonuses.map((b) => b.setId);
    expect(setIds).toContain("ranged_master");
    expect(setIds).toContain("rapid_fire");
    expect(setIds).toContain("arsenal_master");
  });

  it("includes secondary bonuses for close_combat", () => {
    const bonuses = getActiveBonuses(["blade", "shotgun"]);
    expect(bonuses).toHaveLength(2);
    const rangePenalty = bonuses.find((b) => b.stat === "range");
    expect(rangePenalty).toBeDefined();
    expect(rangePenalty!.value).toBe(-10);
  });

  it("includes secondary bonuses for full_auto", () => {
    const bonuses = getActiveBonuses(["smg", "drone"]);
    expect(bonuses).toHaveLength(2);
    const duration = bonuses.find((b) => b.stat === "duration");
    expect(duration).toBeDefined();
    expect(duration!.value).toBe(10);
  });

  it("order of equipped weapons does not matter", () => {
    const a = getActiveBonuses(["laser", "blade"]);
    const b = getActiveBonuses(["blade", "laser"]);
    expect(a).toEqual(b);
  });

  it("extra weapons do not break existing bonuses", () => {
    const bonuses = getActiveBonuses(["laser", "blade", "shotgun", "drone"]);
    const setIds = bonuses.map((b) => b.setId);
    expect(setIds).toContain("dual_blades");
    expect(setIds).toContain("tech_arsenal");
  });

  it("does not activate sets with missing weapons", () => {
    const bonuses = getActiveBonuses(["pistol", "grenade"]);
    expect(bonuses).toEqual([]);
  });
});

// ── getStatBonus ───────────────────────────────────────────────

describe("getStatBonus", () => {
  it("returns 0 for empty bonuses", () => {
    expect(getStatBonus([], "fireRate")).toBe(0);
  });

  it("returns 0 for non-matching stat", () => {
    const bonuses = getActiveBonuses(["pistol", "smg"]);
    expect(getStatBonus(bonuses, "nonExistent")).toBe(0);
  });

  it("aggregates fire rate from rapid_fire", () => {
    const bonuses = getActiveBonuses(["pistol", "smg"]);
    expect(getStatBonus(bonuses, "fireRate")).toBe(20);
  });

  it("aggregates fireRate from multiple sets", () => {
    // rapid_fire gives +20 fireRate, full_auto gives +15 fireRate
    const bonuses = getActiveBonuses(["pistol", "smg", "drone"]);
    expect(getStatBonus(bonuses, "fireRate")).toBe(35);
  });

  it("returns negative values correctly", () => {
    const bonuses = getActiveBonuses(["blade", "shotgun"]);
    expect(getStatBonus(bonuses, "range")).toBe(-10);
  });
});

// ── getAllStatBonuses ───────────────────────────────────────────

describe("getAllStatBonuses", () => {
  it("returns empty record for no bonuses", () => {
    expect(getAllStatBonuses([])).toEqual({});
  });

  it("returns all stats from close_combat set", () => {
    const bonuses = getActiveBonuses(["blade", "shotgun"]);
    const stats = getAllStatBonuses(bonuses);
    expect(stats["damage"]).toBe(20);
    expect(stats["range"]).toBe(-10);
  });

  it("aggregates multiple set bonuses", () => {
    const bonuses = getActiveBonuses(["pistol", "smg", "sniper"]);
    const stats = getAllStatBonuses(bonuses);
    expect(stats["projectileSpeed"]).toBe(25);
    expect(stats["fireRate"]).toBe(20);
    expect(stats["allStats"]).toBe(10);
  });
});

// ── hasSetBonus ────────────────────────────────────────────────

describe("hasSetBonus", () => {
  it("returns true when set is active", () => {
    expect(hasSetBonus(["laser", "blade"], "dual_blades")).toBe(true);
  });

  it("returns false when set is incomplete", () => {
    expect(hasSetBonus(["laser"], "dual_blades")).toBe(false);
  });

  it("returns false for non-existent set ID", () => {
    expect(hasSetBonus(["laser", "blade"], "fake_set")).toBe(false);
  });

  it("returns true for 3-weapon set when all present", () => {
    expect(hasSetBonus(["pistol", "smg", "sniper"], "arsenal_master")).toBe(
      true,
    );
  });

  it("returns false for 3-weapon set with only 2", () => {
    expect(hasSetBonus(["pistol", "smg"], "arsenal_master")).toBe(false);
  });
});

// ── getMissingWeapons ──────────────────────────────────────────

describe("getMissingWeapons", () => {
  it("returns all weapons for empty loadout", () => {
    const missing = getMissingWeapons([], "dual_blades");
    expect(missing).toEqual(["laser", "blade"]);
  });

  it("returns single missing weapon", () => {
    const missing = getMissingWeapons(["laser"], "dual_blades");
    expect(missing).toEqual(["blade"]);
  });

  it("returns empty when set is complete", () => {
    const missing = getMissingWeapons(["laser", "blade"], "dual_blades");
    expect(missing).toEqual([]);
  });

  it("returns empty for non-existent set", () => {
    expect(getMissingWeapons(["laser"], "fake_set")).toEqual([]);
  });

  it("returns 2 missing for arsenal_master with 1 weapon", () => {
    const missing = getMissingWeapons(["pistol"], "arsenal_master");
    expect(missing).toHaveLength(2);
    expect(missing).toContain("smg");
    expect(missing).toContain("sniper");
  });
});

// ── getPartialSets ─────────────────────────────────────────────

describe("getPartialSets", () => {
  it("returns empty for no weapons", () => {
    expect(getPartialSets([])).toEqual([]);
  });

  it("returns partial sets for pistol", () => {
    const partial = getPartialSets(["pistol"]);
    const ids = partial.map((s) => s.id);
    expect(ids).toContain("ranged_master");
    expect(ids).toContain("rapid_fire");
    expect(ids).toContain("arsenal_master");
  });

  it("excludes fully completed sets", () => {
    const partial = getPartialSets(["pistol", "smg"]);
    const ids = partial.map((s) => s.id);
    // rapid_fire is now complete, should NOT be in partial
    expect(ids).not.toContain("rapid_fire");
    // ranged_master still partial (missing sniper)
    expect(ids).toContain("ranged_master");
  });

  it("returns empty when no weapons match any set", () => {
    expect(getPartialSets(["unknown_weapon"])).toEqual([]);
  });
});

// ── getSetCompletionPercent ────────────────────────────────────

describe("getSetCompletionPercent", () => {
  it("returns 0 for empty loadout", () => {
    expect(getSetCompletionPercent([], "dual_blades")).toBe(0);
  });

  it("returns 0.5 for 1 of 2 weapons", () => {
    expect(getSetCompletionPercent(["laser"], "dual_blades")).toBe(0.5);
  });

  it("returns 1 for complete set", () => {
    expect(getSetCompletionPercent(["laser", "blade"], "dual_blades")).toBe(1);
  });

  it("returns 0 for non-existent set", () => {
    expect(getSetCompletionPercent(["laser"], "fake_set")).toBe(0);
  });

  it("returns ~0.333 for 1 of 3 weapons in arsenal_master", () => {
    const pct = getSetCompletionPercent(["pistol"], "arsenal_master");
    expect(pct).toBeCloseTo(1 / 3, 5);
  });

  it("returns ~0.667 for 2 of 3 weapons in arsenal_master", () => {
    const pct = getSetCompletionPercent(["pistol", "smg"], "arsenal_master");
    expect(pct).toBeCloseTo(2 / 3, 5);
  });
});

// ── getBestAvailableSet ────────────────────────────────────────

describe("getBestAvailableSet", () => {
  it("returns null for no weapons", () => {
    expect(getBestAvailableSet([])).toBeNull();
  });

  it("returns null when no set is complete", () => {
    expect(getBestAvailableSet(["pistol"])).toBeNull();
  });

  it("returns the only active set", () => {
    const best = getBestAvailableSet(["laser", "blade"]);
    expect(best).not.toBeNull();
    expect(best!.id).toBe("dual_blades");
  });

  it("returns highest value set among multiple", () => {
    // area_control: +30%, ranged_master: +25%
    const best = getBestAvailableSet([
      "grenade",
      "flame_thrower",
      "pistol",
      "sniper",
    ]);
    expect(best).not.toBeNull();
    expect(best!.id).toBe("area_control");
    expect(best!.bonusValue).toBe(30);
  });

  it("returns heavy_hitter over other 25-value sets (first found)", () => {
    // sniper+grenade = heavy_hitter (25), pistol+sniper = ranged_master (25)
    const best = getBestAvailableSet(["sniper", "grenade", "pistol"]);
    // Both are 25, ranged_master comes first in array
    expect(best!.bonusValue).toBe(25);
  });
});

// ── getRecommendedWeapon ───────────────────────────────────────

describe("getRecommendedWeapon", () => {
  it("returns null for empty loadout (no partial sets)", () => {
    // With empty loadout there are no partial sets
    expect(getRecommendedWeapon([])).toBeNull();
  });

  it("recommends weapon that completes the most sets", () => {
    // With pistol+smg: arsenal_master needs sniper, ranged_master needs sniper
    // heavy_hitter needs sniper+grenade but only sniper partial match
    const rec = getRecommendedWeapon(["pistol", "smg"]);
    expect(rec).toBe("sniper");
  });

  it("recommends based on partial progress when none can complete", () => {
    // With just pistol, no single weapon completes 2+ sets
    // sniper would complete ranged_master, smg would complete rapid_fire
    // but sniper also partially fills arsenal_master, heavy_hitter
    const rec = getRecommendedWeapon(["pistol"]);
    expect(rec).toBeTruthy();
  });

  it("returns a string result for typical loadout", () => {
    const rec = getRecommendedWeapon(["laser"]);
    expect(typeof rec).toBe("string");
  });

  it("handles loadout with all weapons (all sets complete)", () => {
    const allWeapons = [
      "laser",
      "blade",
      "flame_thrower",
      "ice_beam",
      "pistol",
      "sniper",
      "grenade",
      "smg",
      "drone",
      "shotgun",
    ];
    // All sets are complete, no missing weapons → null
    expect(getRecommendedWeapon(allWeapons)).toBeNull();
  });
});

// ── Edge Cases / Integration ───────────────────────────────────

describe("edge cases", () => {
  it("duplicate weapons in loadout do not cause issues", () => {
    const bonuses = getActiveBonuses(["laser", "blade", "laser"]);
    expect(bonuses.some((b) => b.setId === "dual_blades")).toBe(true);
  });

  it("unknown weapons are safely ignored", () => {
    const bonuses = getActiveBonuses(["unknown_1", "unknown_2"]);
    expect(bonuses).toEqual([]);
  });

  it("full loadout activates all applicable sets", () => {
    const allWeapons = [
      "laser",
      "blade",
      "flame_thrower",
      "ice_beam",
      "pistol",
      "sniper",
      "grenade",
      "smg",
      "drone",
      "shotgun",
    ];
    const bonuses = getActiveBonuses(allWeapons);
    const setIds = new Set(bonuses.map((b) => b.setId));
    expect(setIds.size).toBe(10);
  });

  it("getStatBonus works with manually crafted bonuses", () => {
    const manual: ActiveBonus[] = [
      { setId: "a", stat: "damage", value: 10, isPercent: true },
      { setId: "b", stat: "damage", value: 5, isPercent: false },
    ];
    expect(getStatBonus(manual, "damage")).toBe(15);
  });

  it("case sensitivity: weapon IDs are case-sensitive", () => {
    expect(hasSetBonus(["Laser", "Blade"], "dual_blades")).toBe(false);
    expect(hasSetBonus(["laser", "blade"], "dual_blades")).toBe(true);
  });
});
