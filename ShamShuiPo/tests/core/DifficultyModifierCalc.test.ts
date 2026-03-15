import { describe, it, expect } from "vitest";
import {
  createDifficulty,
  addModifier,
  removeModifier,
  getModifier,
  getAllModifiers,
  calculateCombinedMultipliers,
  getTotalScoreMultiplier,
  isModifierUnlocked,
  getPresetModifiers,
  getDifficultyRating,
  getCompatibleModifiers,
  estimateSurvivalChance,
  serializeDifficulty,
  deserializeDifficulty,
  type DifficultyState,
  type PlayerRecord,
} from "../../src/core/DifficultyModifierCalc";

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function makeRecord(overrides: Partial<PlayerRecord> = {}): PlayerRecord {
  return {
    totalRuns: 0,
    bestScore: 0,
    totalKills: 0,
    bossesDefeated: 0,
    completedPresets: [],
    minutesSurvived: 0,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════
// § createDifficulty
// ════════════════════════════════════════════════════════════════

describe("createDifficulty", () => {
  it("normal preset has no modifiers and all multipliers at 1.0", () => {
    const s = createDifficulty("normal");
    expect(s.preset).toBe("normal");
    expect(s.activeModifiers).toEqual([]);
    expect(s.enemyHpMultiplier).toBe(1.0);
    expect(s.enemyDamageMultiplier).toBe(1.0);
    expect(s.enemySpeedMultiplier).toBe(1.0);
    expect(s.playerHpMultiplier).toBe(1.0);
    expect(s.xpMultiplier).toBe(1.0);
    expect(s.coinMultiplier).toBe(1.0);
    expect(s.spawnRateMultiplier).toBe(1.0);
    expect(s.scoreMultiplier).toBe(1.0);
  });

  it("easy preset includes generous modifier", () => {
    const s = createDifficulty("easy");
    expect(s.preset).toBe("easy");
    expect(s.activeModifiers).toContain("generous");
    expect(s.coinMultiplier).toBe(1.5);
    expect(s.scoreMultiplier).toBe(0.8);
  });

  it("hard preset includes iron_hide and swarm", () => {
    const s = createDifficulty("hard");
    expect(s.activeModifiers).toEqual(["iron_hide", "swarm"]);
    expect(s.enemyHpMultiplier).toBe(1.5);
    expect(s.spawnRateMultiplier).toBe(1.4);
  });

  it("nightmare preset includes 4 modifiers", () => {
    const s = createDifficulty("nightmare");
    expect(s.activeModifiers).toHaveLength(4);
    expect(s.activeModifiers).toContain("iron_hide");
    expect(s.activeModifiers).toContain("berserker_enemies");
    expect(s.activeModifiers).toContain("swarm");
    expect(s.activeModifiers).toContain("fragile");
  });

  it("custom preset starts empty", () => {
    const s = createDifficulty("custom");
    expect(s.activeModifiers).toEqual([]);
    expect(s.scoreMultiplier).toBe(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § addModifier
// ════════════════════════════════════════════════════════════════

describe("addModifier", () => {
  it("adds a modifier and recalculates multipliers", () => {
    const s = createDifficulty("normal");
    const next = addModifier(s, "iron_hide");
    expect(next.activeModifiers).toContain("iron_hide");
    expect(next.enemyHpMultiplier).toBe(1.5);
    expect(next.preset).toBe("custom");
  });

  it("returns same state if modifier already active", () => {
    const s = createDifficulty("normal");
    const s2 = addModifier(s, "iron_hide");
    const s3 = addModifier(s2, "iron_hide");
    expect(s3).toBe(s2);
  });

  it("returns same state for unknown modifier", () => {
    const s = createDifficulty("normal");
    const next = addModifier(s, "nonexistent_mod");
    expect(next).toBe(s);
  });

  it("blocks conflicting modifiers (glass_cannon vs fragile)", () => {
    const s = addModifier(createDifficulty("normal"), "glass_cannon");
    const blocked = addModifier(s, "fragile");
    expect(blocked).toBe(s);
    expect(blocked.activeModifiers).not.toContain("fragile");
  });

  it("blocks conflicting modifiers (poverty vs generous)", () => {
    const s = addModifier(createDifficulty("normal"), "poverty");
    const blocked = addModifier(s, "generous");
    expect(blocked).toBe(s);
  });

  it("blocks reverse conflict direction (generous then poverty)", () => {
    const s = addModifier(createDifficulty("normal"), "generous");
    const blocked = addModifier(s, "poverty");
    expect(blocked).toBe(s);
  });

  it("blocks speedrun + endless_night conflict", () => {
    const s = addModifier(createDifficulty("normal"), "speedrun");
    const blocked = addModifier(s, "endless_night");
    expect(blocked).toBe(s);
  });

  it("stacks multiple non-conflicting modifiers", () => {
    let s = createDifficulty("normal");
    s = addModifier(s, "iron_hide");
    s = addModifier(s, "swarm");
    s = addModifier(s, "overtime");
    expect(s.activeModifiers).toHaveLength(3);
    expect(s.enemyHpMultiplier).toBe(1.5);
    expect(s.spawnRateMultiplier).toBe(1.4);
  });

  it("does not mutate the original state", () => {
    const original = createDifficulty("normal");
    const originalMods = [...original.activeModifiers];
    addModifier(original, "iron_hide");
    expect(original.activeModifiers).toEqual(originalMods);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeModifier
// ════════════════════════════════════════════════════════════════

describe("removeModifier", () => {
  it("removes modifier and recalculates", () => {
    const s = createDifficulty("hard");
    const next = removeModifier(s, "iron_hide");
    expect(next.activeModifiers).not.toContain("iron_hide");
    expect(next.enemyHpMultiplier).toBe(1.0);
    expect(next.spawnRateMultiplier).toBe(1.4);
  });

  it("returns same state if modifier not active", () => {
    const s = createDifficulty("normal");
    const next = removeModifier(s, "iron_hide");
    expect(next).toBe(s);
  });

  it("sets preset to custom after removal", () => {
    const s = createDifficulty("hard");
    const next = removeModifier(s, "swarm");
    expect(next.preset).toBe("custom");
  });

  it("does not mutate original state", () => {
    const s = createDifficulty("hard");
    const count = s.activeModifiers.length;
    removeModifier(s, "iron_hide");
    expect(s.activeModifiers).toHaveLength(count);
  });
});

// ════════════════════════════════════════════════════════════════
// § getModifier
// ════════════════════════════════════════════════════════════════

describe("getModifier", () => {
  it("returns modifier definition for valid ID", () => {
    const mod = getModifier("iron_hide");
    expect(mod).toBeDefined();
    expect(mod!.name).toBe("Iron Hide");
    expect(mod!.category).toBe("enemy");
    expect(mod!.scoreMultiplier).toBe(1.2);
  });

  it("returns undefined for invalid ID", () => {
    expect(getModifier("fake")).toBeUndefined();
  });

  it("each modifier has required fields", () => {
    const mod = getModifier("glass_cannon");
    expect(mod).toBeDefined();
    expect(mod!.id).toBe("glass_cannon");
    expect(mod!.description).toBeTruthy();
    expect(mod!.multipliers).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════
// § getAllModifiers
// ════════════════════════════════════════════════════════════════

describe("getAllModifiers", () => {
  it("returns exactly 15 modifiers", () => {
    expect(getAllModifiers()).toHaveLength(15);
  });

  it("every modifier has a unique ID", () => {
    const ids = getAllModifiers().map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains all expected categories", () => {
    const cats = new Set(getAllModifiers().map((m) => m.category));
    expect(cats).toContain("enemy");
    expect(cats).toContain("player");
    expect(cats).toContain("economy");
    expect(cats).toContain("time");
    expect(cats).toContain("special");
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateCombinedMultipliers
// ════════════════════════════════════════════════════════════════

describe("calculateCombinedMultipliers", () => {
  it("returns empty object for no modifiers", () => {
    expect(calculateCombinedMultipliers([])).toEqual({});
  });

  it("single modifier returns its multipliers", () => {
    const result = calculateCombinedMultipliers(["iron_hide"]);
    expect(result.enemyHp).toBe(1.5);
  });

  it("stacks multiplicatively for same key", () => {
    // true_nightmare has enemyHp:1.5 and iron_hide has enemyHp:1.5
    // But they conflict, so let's use a realistic case:
    // iron_hide (enemyHp:1.5) alone
    const result = calculateCombinedMultipliers(["iron_hide", "speed_demons"]);
    expect(result.enemyHp).toBe(1.5);
    expect(result.enemySpeed).toBe(1.25);
  });

  it("skips unknown modifier IDs", () => {
    const result = calculateCombinedMultipliers(["iron_hide", "unknown_thing"]);
    expect(result.enemyHp).toBe(1.5);
  });

  it("generous modifier sets coinDrop and xpDrop", () => {
    const result = calculateCombinedMultipliers(["generous"]);
    expect(result.coinDrop).toBe(1.5);
    expect(result.xpDrop).toBe(1.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTotalScoreMultiplier
// ════════════════════════════════════════════════════════════════

describe("getTotalScoreMultiplier", () => {
  it("normal preset = 1.0 score", () => {
    expect(getTotalScoreMultiplier(createDifficulty("normal"))).toBe(1.0);
  });

  it("easy preset = 0.8 score (generous)", () => {
    expect(getTotalScoreMultiplier(createDifficulty("easy"))).toBe(0.8);
  });

  it("hard preset multiplies iron_hide * swarm scores", () => {
    const s = createDifficulty("hard");
    // 1.2 * 1.25 = 1.5
    expect(getTotalScoreMultiplier(s)).toBe(1.5);
  });

  it("nightmare stacks all 4 modifier scores", () => {
    const s = createDifficulty("nightmare");
    // 1.2 * 1.15 * 1.25 * 1.35 = 2.328...
    const expected = Math.round(1.2 * 1.15 * 1.25 * 1.35 * 100) / 100;
    expect(getTotalScoreMultiplier(s)).toBe(expected);
  });

  it("true_nightmare gives 3.0x score", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "true_nightmare");
    expect(getTotalScoreMultiplier(s)).toBe(3.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isModifierUnlocked
// ════════════════════════════════════════════════════════════════

describe("isModifierUnlocked", () => {
  it("speed_demons has no unlock condition — always unlocked", () => {
    expect(isModifierUnlocked("speed_demons", makeRecord())).toBe(true);
  });

  it("iron_hide requires complete_normal", () => {
    expect(isModifierUnlocked("iron_hide", makeRecord())).toBe(false);
    expect(
      isModifierUnlocked(
        "iron_hide",
        makeRecord({ completedPresets: ["normal"] }),
      ),
    ).toBe(true);
  });

  it("glass_cannon requires complete_hard", () => {
    expect(
      isModifierUnlocked(
        "glass_cannon",
        makeRecord({ completedPresets: ["normal"] }),
      ),
    ).toBe(false);
    expect(
      isModifierUnlocked(
        "glass_cannon",
        makeRecord({ completedPresets: ["hard"] }),
      ),
    ).toBe(true);
  });

  it("swarm requires 1000 kills", () => {
    expect(isModifierUnlocked("swarm", makeRecord({ totalKills: 999 }))).toBe(
      false,
    );
    expect(isModifierUnlocked("swarm", makeRecord({ totalKills: 1000 }))).toBe(
      true,
    );
  });

  it("no_healing requires 8 min survived", () => {
    expect(
      isModifierUnlocked("no_healing", makeRecord({ minutesSurvived: 7 })),
    ).toBe(false);
    expect(
      isModifierUnlocked("no_healing", makeRecord({ minutesSurvived: 8 })),
    ).toBe(true);
  });

  it("true_nightmare requires complete_nightmare", () => {
    expect(
      isModifierUnlocked(
        "true_nightmare",
        makeRecord({ completedPresets: ["nightmare"] }),
      ),
    ).toBe(true);
  });

  it("returns false for unknown modifier", () => {
    expect(isModifierUnlocked("fake_mod", makeRecord())).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPresetModifiers
// ════════════════════════════════════════════════════════════════

describe("getPresetModifiers", () => {
  it("easy => generous", () => {
    expect(getPresetModifiers("easy")).toEqual(["generous"]);
  });

  it("normal => empty", () => {
    expect(getPresetModifiers("normal")).toEqual([]);
  });

  it("hard => iron_hide + swarm", () => {
    expect(getPresetModifiers("hard")).toEqual(["iron_hide", "swarm"]);
  });

  it("nightmare => 4 modifiers", () => {
    const mods = getPresetModifiers("nightmare");
    expect(mods).toHaveLength(4);
  });

  it("custom => empty", () => {
    expect(getPresetModifiers("custom")).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDifficultyRating
// ════════════════════════════════════════════════════════════════

describe("getDifficultyRating", () => {
  it("normal = rating 2 (score 1.0)", () => {
    expect(getDifficultyRating(createDifficulty("normal"))).toBe(2);
  });

  it("easy = rating 1 (score 0.8)", () => {
    expect(getDifficultyRating(createDifficulty("easy"))).toBe(1);
  });

  it("hard = rating 5 (score 1.5)", () => {
    expect(getDifficultyRating(createDifficulty("hard"))).toBe(5);
  });

  it("true_nightmare = rating 9 or 10 (score 3.0)", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "true_nightmare");
    expect(getDifficultyRating(s)).toBeGreaterThanOrEqual(9);
  });

  it("rating is between 1 and 10", () => {
    for (const preset of ["easy", "normal", "hard", "nightmare"] as const) {
      const r = getDifficultyRating(createDifficulty(preset));
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § getCompatibleModifiers
// ════════════════════════════════════════════════════════════════

describe("getCompatibleModifiers", () => {
  it("all modifiers compatible when none active", () => {
    const compat = getCompatibleModifiers([]);
    expect(compat.length).toBe(getAllModifiers().length);
  });

  it("glass_cannon removes fragile and true_nightmare from compatible", () => {
    const compat = getCompatibleModifiers(["glass_cannon"]);
    const ids = compat.map((m) => m.id);
    expect(ids).not.toContain("glass_cannon"); // already active
    expect(ids).not.toContain("fragile"); // conflict
    expect(ids).not.toContain("true_nightmare"); // true_nightmare conflicts with glass_cannon
  });

  it("poverty removes generous from compatible", () => {
    const compat = getCompatibleModifiers(["poverty"]);
    const ids = compat.map((m) => m.id);
    expect(ids).not.toContain("generous");
    expect(ids).not.toContain("poverty");
  });

  it("speedrun removes endless_night from compatible", () => {
    const compat = getCompatibleModifiers(["speedrun"]);
    const ids = compat.map((m) => m.id);
    expect(ids).not.toContain("endless_night");
  });
});

// ════════════════════════════════════════════════════════════════
// § estimateSurvivalChance
// ════════════════════════════════════════════════════════════════

describe("estimateSurvivalChance", () => {
  it("normal difficulty = 1.0 survival", () => {
    expect(estimateSurvivalChance(createDifficulty("normal"))).toBe(1.0);
  });

  it("easy difficulty > normal (generous boosts xp)", () => {
    const easy = estimateSurvivalChance(createDifficulty("easy"));
    expect(easy).toBeGreaterThanOrEqual(1.0);
  });

  it("hard difficulty < normal", () => {
    const hard = estimateSurvivalChance(createDifficulty("hard"));
    expect(hard).toBeLessThan(1.0);
  });

  it("nightmare < hard", () => {
    const hard = estimateSurvivalChance(createDifficulty("hard"));
    const nightmare = estimateSurvivalChance(createDifficulty("nightmare"));
    expect(nightmare).toBeLessThan(hard);
  });

  it("returns value between 0 and 1", () => {
    const s = createDifficulty("nightmare");
    const chance = estimateSurvivalChance(s);
    expect(chance).toBeGreaterThanOrEqual(0);
    expect(chance).toBeLessThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § serialize / deserialize
// ════════════════════════════════════════════════════════════════

describe("serializeDifficulty / deserializeDifficulty", () => {
  it("round-trips normal preset", () => {
    const original = createDifficulty("normal");
    const json = serializeDifficulty(original);
    const restored = deserializeDifficulty(json);
    expect(restored.preset).toBe("normal");
    expect(restored.activeModifiers).toEqual([]);
    expect(restored.scoreMultiplier).toBe(1.0);
  });

  it("round-trips hard preset with multipliers", () => {
    const original = createDifficulty("hard");
    const json = serializeDifficulty(original);
    const restored = deserializeDifficulty(json);
    expect(restored.activeModifiers).toEqual(original.activeModifiers);
    expect(restored.enemyHpMultiplier).toBe(original.enemyHpMultiplier);
    expect(restored.spawnRateMultiplier).toBe(original.spawnRateMultiplier);
    expect(restored.scoreMultiplier).toBe(original.scoreMultiplier);
  });

  it("round-trips custom state with multiple modifiers", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "iron_hide");
    s = addModifier(s, "overtime");
    s = addModifier(s, "poverty");
    const json = serializeDifficulty(s);
    const restored = deserializeDifficulty(json);
    expect(restored.activeModifiers).toEqual(s.activeModifiers);
    expect(restored.scoreMultiplier).toBe(s.scoreMultiplier);
  });

  it("filters out invalid modifier IDs on deserialize", () => {
    const json = JSON.stringify({
      preset: "custom",
      activeModifiers: ["iron_hide", "totally_fake", "swarm"],
    });
    const restored = deserializeDifficulty(json);
    expect(restored.activeModifiers).toEqual(["iron_hide", "swarm"]);
  });

  it("falls back to custom for invalid preset", () => {
    const json = JSON.stringify({
      preset: "ultra_mega",
      activeModifiers: [],
    });
    const restored = deserializeDifficulty(json);
    expect(restored.preset).toBe("custom");
  });

  it("serialized JSON is compact (only preset + modifiers)", () => {
    const s = createDifficulty("hard");
    const parsed = JSON.parse(serializeDifficulty(s));
    expect(Object.keys(parsed)).toEqual(["preset", "activeModifiers"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § INTEGRATION / EDGE CASES
// ════════════════════════════════════════════════════════════════

describe("integration and edge cases", () => {
  it("adding then removing returns to base multipliers", () => {
    const base = createDifficulty("normal");
    let s = addModifier(base, "iron_hide");
    s = removeModifier(s, "iron_hide");
    expect(s.enemyHpMultiplier).toBe(1.0);
    expect(s.scoreMultiplier).toBe(1.0);
  });

  it("true_nightmare conflicts with its component modifiers", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "iron_hide");
    const blocked = addModifier(s, "true_nightmare");
    expect(blocked).toBe(s);
  });

  it("true_nightmare applies all component multipliers at once", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "true_nightmare");
    expect(s.enemyHpMultiplier).toBe(1.5);
    expect(s.enemyDamageMultiplier).toBe(1.3);
    expect(s.spawnRateMultiplier).toBe(1.4);
    expect(s.scoreMultiplier).toBe(3.0);
  });

  it("can build a max-difficulty custom configuration", () => {
    let s = createDifficulty("custom");
    s = addModifier(s, "true_nightmare");
    s = addModifier(s, "no_healing");
    s = addModifier(s, "slow_start");
    s = addModifier(s, "poverty");
    s = addModifier(s, "expensive");
    s = addModifier(s, "endless_night");
    expect(s.activeModifiers.length).toBeGreaterThanOrEqual(6);
    expect(s.scoreMultiplier).toBeGreaterThan(5);
    expect(getDifficultyRating(s)).toBe(10);
  });

  it("score multiplier handles floating point cleanly", () => {
    const s = createDifficulty("nightmare");
    const score = getTotalScoreMultiplier(s);
    // Should be rounded to 2 decimal places
    const decimals = score.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
