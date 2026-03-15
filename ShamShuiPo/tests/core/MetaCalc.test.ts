// ── Tests: MetaCalc ──

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getDefaultSave,
  loadSave,
  saveMeta,
  getMetaUpgradeCost,
  canAffordUpgrade,
  purchaseUpgrade,
  getMetaBonuses,
  addRunReward,
  type MetaSave,
} from "../../src/core/MetaCalc";
import { META_UPGRADES, PLAYER_BASE } from "../../src/config/balance";

// ── Mock localStorage ──────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─────────────────────────────────────────────────────────────────

describe("getDefaultSave", () => {
  it("returns a save with all zero values", () => {
    const save = getDefaultSave();
    expect(save.coins).toBe(0);
    expect(save.totalRuns).toBe(0);
    expect(save.bestScore).toBe(0);
    expect(save.bestTime).toBe(0);
    expect(save.upgrades).toEqual({});
  });

  it("returns a fresh object each call (no shared reference)", () => {
    const a = getDefaultSave();
    const b = getDefaultSave();
    a.coins = 999;
    expect(b.coins).toBe(0);
  });
});

describe("loadSave / saveMeta", () => {
  beforeEach(() => localStorageMock.clear());

  it("returns default save when localStorage is empty", () => {
    const save = loadSave();
    expect(save).toEqual(getDefaultSave());
  });

  it("round-trips a save correctly", () => {
    const original: MetaSave = {
      coins: 500,
      upgrades: { meta_hp: 2 },
      totalRuns: 7,
      bestScore: 1234,
      bestTime: 345.6,
    };
    saveMeta(original);
    const loaded = loadSave();
    expect(loaded).toEqual(original);
  });

  it("returns default save when localStorage contains invalid JSON", () => {
    localStorageMock.setItem("neon_survivors_meta", "not-json-{{{");
    const save = loadSave();
    expect(save).toEqual(getDefaultSave());
  });

  it("merges partial data with defaults on schema evolution", () => {
    // Simulate old save without bestTime field
    localStorageMock.setItem(
      "neon_survivors_meta",
      JSON.stringify({ coins: 100, totalRuns: 3 }),
    );
    const save = loadSave();
    expect(save.coins).toBe(100);
    expect(save.totalRuns).toBe(3);
    expect(save.bestTime).toBe(0); // merged from default
  });
});

describe("getMetaUpgradeCost", () => {
  it("returns cost for level 0 → 1 for meta_hp", () => {
    const cost = getMetaUpgradeCost("meta_hp", 0);
    expect(cost).toBe(META_UPGRADES.meta_hp.costPerLevel[0]);
  });

  it("returns cost for level 1 → 2 for meta_damage", () => {
    const cost = getMetaUpgradeCost("meta_damage", 1);
    expect(cost).toBe(META_UPGRADES.meta_damage.costPerLevel[1]);
  });

  it("returns Infinity when upgrade is maxed", () => {
    const maxLevel = META_UPGRADES.meta_hp.maxLevel;
    const cost = getMetaUpgradeCost("meta_hp", maxLevel);
    expect(cost).toBe(Infinity);
  });

  it("returns Infinity for unknown upgrade id", () => {
    const cost = getMetaUpgradeCost("nonexistent_upgrade", 0);
    expect(cost).toBe(Infinity);
  });
});

describe("canAffordUpgrade", () => {
  it("returns true when player has enough coins", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 9999 };
    expect(canAffordUpgrade(save, "meta_hp")).toBe(true);
  });

  it("returns false when player lacks coins", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 0 };
    expect(canAffordUpgrade(save, "meta_hp")).toBe(false);
  });

  it("returns false when upgrade is maxed", () => {
    const maxLevel = META_UPGRADES.meta_speed.maxLevel;
    const save: MetaSave = {
      ...getDefaultSave(),
      coins: 99999,
      upgrades: { meta_speed: maxLevel },
    };
    expect(canAffordUpgrade(save, "meta_speed")).toBe(false);
  });

  it("returns false for unknown upgrade", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 9999 };
    expect(canAffordUpgrade(save, "bogus_id")).toBe(false);
  });

  it("returns false for diamond upgrades (not implemented in meta scene)", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 9999 };
    expect(canAffordUpgrade(save, "meta_revive")).toBe(false);
  });
});

describe("purchaseUpgrade", () => {
  it("deducts the correct coin cost and increments level", () => {
    const cost = META_UPGRADES.meta_hp.costPerLevel[0];
    const save: MetaSave = { ...getDefaultSave(), coins: cost + 100 };
    const newSave = purchaseUpgrade(save, "meta_hp");
    expect(newSave.coins).toBe(100);
    expect(newSave.upgrades["meta_hp"]).toBe(1);
  });

  it("does not mutate the original save", () => {
    const cost = META_UPGRADES.meta_hp.costPerLevel[0];
    const save: MetaSave = { ...getDefaultSave(), coins: cost };
    purchaseUpgrade(save, "meta_hp");
    expect(save.coins).toBe(cost); // original unchanged
    expect(save.upgrades["meta_hp"]).toBeUndefined();
  });

  it("correctly upgrades from level 1 to 2", () => {
    const costL1 = META_UPGRADES.meta_damage.costPerLevel[0];
    const costL2 = META_UPGRADES.meta_damage.costPerLevel[1];
    let save: MetaSave = {
      ...getDefaultSave(),
      coins: costL1 + costL2,
      upgrades: {},
    };
    save = purchaseUpgrade(save, "meta_damage"); // → level 1
    save = purchaseUpgrade(save, "meta_damage"); // → level 2
    expect(save.upgrades["meta_damage"]).toBe(2);
    expect(save.coins).toBe(0);
  });

  it("throws when player cannot afford the upgrade", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 0 };
    expect(() => purchaseUpgrade(save, "meta_hp")).toThrow();
  });

  it("throws when upgrade is already maxed", () => {
    const maxLevel = META_UPGRADES.meta_speed.maxLevel;
    const save: MetaSave = {
      ...getDefaultSave(),
      coins: 99999,
      upgrades: { meta_speed: maxLevel },
    };
    expect(() => purchaseUpgrade(save, "meta_speed")).toThrow();
  });
});

describe("getMetaBonuses", () => {
  it("returns zero bonuses for a fresh save", () => {
    const bonuses = getMetaBonuses(getDefaultSave());
    expect(bonuses.maxHpBonus).toBe(0);
    expect(bonuses.damageBonus).toBe(0);
    expect(bonuses.moveSpeedBonus).toBe(0);
    expect(bonuses.xpBonus).toBe(0);
    expect(bonuses.startingWeaponLevel).toBe(1);
  });

  it("computes correct HP bonus at meta_hp level 1", () => {
    const save: MetaSave = {
      ...getDefaultSave(),
      upgrades: { meta_hp: 1 },
    };
    const bonuses = getMetaBonuses(save);
    expect(bonuses.maxHpBonus).toBe(META_UPGRADES.meta_hp.valuePerLevel[0]);
  });

  it("accumulates HP bonus correctly over multiple levels", () => {
    const save: MetaSave = {
      ...getDefaultSave(),
      upgrades: { meta_hp: 3 },
    };
    const bonuses = getMetaBonuses(save);
    const expected =
      META_UPGRADES.meta_hp.valuePerLevel[0] +
      META_UPGRADES.meta_hp.valuePerLevel[1] +
      META_UPGRADES.meta_hp.valuePerLevel[2];
    expect(bonuses.maxHpBonus).toBeCloseTo(expected);
  });

  it("computes correct damage bonus", () => {
    const save: MetaSave = {
      ...getDefaultSave(),
      upgrades: { meta_damage: 2 },
    };
    const bonuses = getMetaBonuses(save);
    const expected =
      META_UPGRADES.meta_damage.valuePerLevel[0] +
      META_UPGRADES.meta_damage.valuePerLevel[1];
    expect(bonuses.damageBonus).toBeCloseTo(expected);
  });

  it("computes correct move speed bonus", () => {
    const save: MetaSave = {
      ...getDefaultSave(),
      upgrades: { meta_speed: 1 },
    };
    const bonuses = getMetaBonuses(save);
    expect(bonuses.moveSpeedBonus).toBeCloseTo(
      META_UPGRADES.meta_speed.valuePerLevel[0],
    );
  });
});

describe("addRunReward", () => {
  it("increments totalRuns by 1", () => {
    const save = getDefaultSave();
    const newSave = addRunReward(save, 0, 0, 0);
    expect(newSave.totalRuns).toBe(1);
  });

  it("adds coins to existing total", () => {
    const save: MetaSave = { ...getDefaultSave(), coins: 50 };
    const newSave = addRunReward(save, 100, 60, 30);
    expect(newSave.coins).toBe(80);
  });

  it("updates bestScore when new score is higher", () => {
    const save: MetaSave = { ...getDefaultSave(), bestScore: 500 };
    const newSave = addRunReward(save, 1000, 0, 0);
    expect(newSave.bestScore).toBe(1000);
  });

  it("keeps existing bestScore when new score is lower", () => {
    const save: MetaSave = { ...getDefaultSave(), bestScore: 2000 };
    const newSave = addRunReward(save, 500, 0, 0);
    expect(newSave.bestScore).toBe(2000);
  });

  it("updates bestTime when new elapsed is higher", () => {
    const save: MetaSave = { ...getDefaultSave(), bestTime: 120 };
    const newSave = addRunReward(save, 0, 300, 0);
    expect(newSave.bestTime).toBe(300);
  });

  it("does not mutate the original save", () => {
    const save = getDefaultSave();
    addRunReward(save, 500, 120, 50);
    expect(save.totalRuns).toBe(0);
    expect(save.coins).toBe(0);
  });

  it("accumulates across multiple runs", () => {
    let save = getDefaultSave();
    save = addRunReward(save, 100, 60, 10);
    save = addRunReward(save, 200, 120, 20);
    save = addRunReward(save, 50, 30, 5);
    expect(save.totalRuns).toBe(3);
    expect(save.coins).toBe(35);
    expect(save.bestScore).toBe(200);
    expect(save.bestTime).toBe(120);
  });
});
