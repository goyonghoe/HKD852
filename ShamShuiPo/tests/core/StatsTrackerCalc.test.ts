import { describe, it, expect } from "vitest";
import {
  createStatsState,
  incrementStat,
  setStat,
  setMaxStat,
  getStat,
  getStatsByCategory,
  startRun,
  endRun,
  getRunStats,
  getAllTimeStats,
  formatStat,
  getTopStats,
  compareRuns,
  serialize,
  deserialize,
  getStatDefinitions,
  type StatsState,
  type StatEntry,
} from "../../src/core/StatsTrackerCalc";

// ════════════════════════════════════════════════════════════════
// § createStatsState
// ════════════════════════════════════════════════════════════════

describe("createStatsState", () => {
  it("returns a state with all stats at zero", () => {
    const state = createStatsState();
    expect(state.stats.totalKills).toBe(0);
    expect(state.stats.bossKills).toBe(0);
    expect(state.stats.damageDealt).toBe(0);
    expect(state.stats.highestDPS).toBe(0);
  });

  it("initializes perRunStats and allTimeStats to zero", () => {
    const state = createStatsState();
    expect(state.perRunStats.totalKills).toBe(0);
    expect(state.allTimeStats.totalKills).toBe(0);
  });

  it("contains all 32 defined stats", () => {
    const state = createStatsState();
    const defs = getStatDefinitions();
    for (const def of defs) {
      expect(state.stats).toHaveProperty(def.key, 0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § incrementStat
// ════════════════════════════════════════════════════════════════

describe("incrementStat", () => {
  it("increments by 1 by default", () => {
    const s0 = createStatsState();
    const s1 = incrementStat(s0, "totalKills");
    expect(s1.stats.totalKills).toBe(1);
  });

  it("increments by a custom amount", () => {
    const s0 = createStatsState();
    const s1 = incrementStat(s0, "damageDealt", 150);
    expect(s1.stats.damageDealt).toBe(150);
  });

  it("accumulates across multiple calls", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 5);
    state = incrementStat(state, "totalKills", 3);
    expect(state.stats.totalKills).toBe(8);
  });

  it("also updates perRunStats", () => {
    const s0 = createStatsState();
    const s1 = incrementStat(s0, "critHits", 10);
    expect(s1.perRunStats.critHits).toBe(10);
  });

  it("does not mutate original state (immutable)", () => {
    const s0 = createStatsState();
    const s1 = incrementStat(s0, "totalKills");
    expect(s0.stats.totalKills).toBe(0);
    expect(s1.stats.totalKills).toBe(1);
  });

  it("handles unknown keys gracefully", () => {
    const s0 = createStatsState();
    const s1 = incrementStat(s0, "unknownStat", 5);
    expect(s1.stats.unknownStat).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════
// § setStat
// ════════════════════════════════════════════════════════════════

describe("setStat", () => {
  it("sets an absolute value", () => {
    const s0 = createStatsState();
    const s1 = setStat(s0, "accuracy", 87.5);
    expect(s1.stats.accuracy).toBe(87.5);
  });

  it("overwrites previous value", () => {
    let state = createStatsState();
    state = setStat(state, "accuracy", 50);
    state = setStat(state, "accuracy", 75);
    expect(state.stats.accuracy).toBe(75);
  });

  it("also sets perRunStats", () => {
    const s0 = createStatsState();
    const s1 = setStat(s0, "highestDPS", 999);
    expect(s1.perRunStats.highestDPS).toBe(999);
  });
});

// ════════════════════════════════════════════════════════════════
// § setMaxStat
// ════════════════════════════════════════════════════════════════

describe("setMaxStat", () => {
  it("sets value when current is zero", () => {
    const s0 = createStatsState();
    const s1 = setMaxStat(s0, "highestDPS", 500);
    expect(s1.stats.highestDPS).toBe(500);
  });

  it("updates when new value is higher", () => {
    let state = createStatsState();
    state = setMaxStat(state, "longestKillStreak", 10);
    state = setMaxStat(state, "longestKillStreak", 15);
    expect(state.stats.longestKillStreak).toBe(15);
  });

  it("keeps old value when new value is lower", () => {
    let state = createStatsState();
    state = setMaxStat(state, "longestKillStreak", 20);
    state = setMaxStat(state, "longestKillStreak", 5);
    expect(state.stats.longestKillStreak).toBe(20);
  });

  it("keeps equal value", () => {
    let state = createStatsState();
    state = setMaxStat(state, "highestDPS", 100);
    state = setMaxStat(state, "highestDPS", 100);
    expect(state.stats.highestDPS).toBe(100);
  });

  it("updates perRunStats with max logic", () => {
    let state = createStatsState();
    state = setMaxStat(state, "highestDPS", 300);
    state = setMaxStat(state, "highestDPS", 200);
    expect(state.perRunStats.highestDPS).toBe(300);
  });
});

// ════════════════════════════════════════════════════════════════
// § getStat
// ════════════════════════════════════════════════════════════════

describe("getStat", () => {
  it("returns 0 for unset stats", () => {
    const state = createStatsState();
    expect(getStat(state, "totalKills")).toBe(0);
  });

  it("returns the current value", () => {
    let state = createStatsState();
    state = incrementStat(state, "bossKills", 3);
    expect(getStat(state, "bossKills")).toBe(3);
  });

  it("returns 0 for unknown keys", () => {
    const state = createStatsState();
    expect(getStat(state, "nonexistent")).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getStatsByCategory
// ════════════════════════════════════════════════════════════════

describe("getStatsByCategory", () => {
  it("returns 10 combat stats", () => {
    const state = createStatsState();
    const combat = getStatsByCategory(state, "combat");
    expect(combat.length).toBe(10);
    expect(combat.every((s) => s.category === "combat")).toBe(true);
  });

  it("returns 5 survival stats", () => {
    const state = createStatsState();
    const survival = getStatsByCategory(state, "survival");
    expect(survival.length).toBe(5);
  });

  it("returns 5 economy stats", () => {
    const state = createStatsState();
    const economy = getStatsByCategory(state, "economy");
    expect(economy.length).toBe(5);
  });

  it("returns 7 progression stats", () => {
    const state = createStatsState();
    const progression = getStatsByCategory(state, "progression");
    expect(progression.length).toBe(7);
  });

  it("returns 5 social stats", () => {
    const state = createStatsState();
    const social = getStatsByCategory(state, "social");
    expect(social.length).toBe(5);
  });

  it("reflects current values", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 42);
    const combat = getStatsByCategory(state, "combat");
    const kills = combat.find((s) => s.key === "totalKills");
    expect(kills?.value).toBe(42);
  });
});

// ════════════════════════════════════════════════════════════════
// § startRun / endRun
// ════════════════════════════════════════════════════════════════

describe("startRun", () => {
  it("resets perRunStats to zero", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 50);
    state = startRun(state);
    expect(state.perRunStats.totalKills).toBe(0);
  });

  it("preserves stats and allTimeStats", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 50);
    state = startRun(state);
    expect(state.stats.totalKills).toBe(50);
  });
});

describe("endRun", () => {
  it("merges additive stats into allTimeStats", () => {
    let state = createStatsState();
    state = startRun(state);
    state = incrementStat(state, "totalKills", 100);
    state = endRun(state);
    expect(state.allTimeStats.totalKills).toBe(100);
  });

  it("accumulates additive stats across multiple runs", () => {
    let state = createStatsState();

    // Run 1
    state = startRun(state);
    state = incrementStat(state, "totalKills", 50);
    state = endRun(state);

    // Run 2
    state = startRun(state);
    state = incrementStat(state, "totalKills", 30);
    state = endRun(state);

    expect(state.allTimeStats.totalKills).toBe(80);
  });

  it("uses max strategy for record stats", () => {
    let state = createStatsState();

    // Run 1
    state = startRun(state);
    state = setMaxStat(state, "highestDPS", 500);
    state = endRun(state);

    // Run 2
    state = startRun(state);
    state = setMaxStat(state, "highestDPS", 300);
    state = endRun(state);

    expect(state.allTimeStats.highestDPS).toBe(500);
  });

  it("updates max stats when new run beats record", () => {
    let state = createStatsState();

    state = startRun(state);
    state = setMaxStat(state, "longestKillStreak", 10);
    state = endRun(state);

    state = startRun(state);
    state = setMaxStat(state, "longestKillStreak", 25);
    state = endRun(state);

    expect(state.allTimeStats.longestKillStreak).toBe(25);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRunStats / getAllTimeStats
// ════════════════════════════════════════════════════════════════

describe("getRunStats", () => {
  it("returns all stat definitions as entries", () => {
    const state = createStatsState();
    const runStats = getRunStats(state);
    expect(runStats.length).toBe(getStatDefinitions().length);
  });

  it("reflects perRun values", () => {
    let state = createStatsState();
    state = startRun(state);
    state = incrementStat(state, "eliteKills", 7);
    const runStats = getRunStats(state);
    const elite = runStats.find((s) => s.key === "eliteKills");
    expect(elite?.value).toBe(7);
  });
});

describe("getAllTimeStats", () => {
  it("returns all stat definitions as entries", () => {
    const state = createStatsState();
    const all = getAllTimeStats(state);
    expect(all.length).toBe(getStatDefinitions().length);
  });

  it("reflects allTime values after endRun", () => {
    let state = createStatsState();
    state = startRun(state);
    state = incrementStat(state, "victories", 1);
    state = endRun(state);
    const all = getAllTimeStats(state);
    const vic = all.find((s) => s.key === "victories");
    expect(vic?.value).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § formatStat
// ════════════════════════════════════════════════════════════════

describe("formatStat", () => {
  it("formats time as mm:ss", () => {
    const entry: StatEntry = {
      key: "totalTimePlayed",
      category: "survival",
      value: 754,
      label: "Total Time Played",
      format: "time",
    };
    expect(formatStat(entry)).toBe("12:34");
  });

  it("formats zero time as 0:00", () => {
    const entry: StatEntry = {
      key: "longestRun",
      category: "survival",
      value: 0,
      label: "Longest Run",
      format: "time",
    };
    expect(formatStat(entry)).toBe("0:00");
  });

  it("formats percent with one decimal", () => {
    const entry: StatEntry = {
      key: "accuracy",
      category: "combat",
      value: 45.23,
      label: "Accuracy",
      format: "percent",
    };
    expect(formatStat(entry)).toBe("45.2%");
  });

  it("formats ratio with two decimals", () => {
    const entry: StatEntry = {
      key: "test",
      category: "combat",
      value: 1.5,
      label: "Test Ratio",
      format: "ratio",
    };
    expect(formatStat(entry)).toBe("1.50");
  });

  it("formats small numbers as plain integers", () => {
    const entry: StatEntry = {
      key: "totalKills",
      category: "combat",
      value: 42,
      label: "Total Kills",
      format: "number",
    };
    expect(formatStat(entry)).toBe("42");
  });

  it("formats thousands with K suffix", () => {
    const entry: StatEntry = {
      key: "damageDealt",
      category: "combat",
      value: 5400,
      label: "Damage Dealt",
      format: "number",
    };
    expect(formatStat(entry)).toBe("5.4K");
  });

  it("formats millions with M suffix", () => {
    const entry: StatEntry = {
      key: "damageDealt",
      category: "combat",
      value: 2_500_000,
      label: "Damage Dealt",
      format: "number",
    };
    expect(formatStat(entry)).toBe("2.5M");
  });

  it("formats time with seconds padded", () => {
    const entry: StatEntry = {
      key: "longestRun",
      category: "survival",
      value: 65,
      label: "Longest Run",
      format: "time",
    };
    expect(formatStat(entry)).toBe("1:05");
  });
});

// ════════════════════════════════════════════════════════════════
// § getTopStats
// ════════════════════════════════════════════════════════════════

describe("getTopStats", () => {
  it("returns empty for fresh state", () => {
    const state = createStatsState();
    expect(getTopStats(state)).toEqual([]);
  });

  it("returns top 5 by default", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 100);
    state = incrementStat(state, "damageDealt", 5000);
    state = incrementStat(state, "critHits", 25);
    state = incrementStat(state, "bossKills", 3);
    state = incrementStat(state, "eliteKills", 10);
    state = incrementStat(state, "victories", 1);
    const top = getTopStats(state);
    expect(top.length).toBe(5);
    expect(top[0].value).toBeGreaterThanOrEqual(top[1].value);
  });

  it("respects custom limit", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 100);
    state = incrementStat(state, "damageDealt", 5000);
    state = incrementStat(state, "critHits", 25);
    const top = getTopStats(state, 2);
    expect(top.length).toBe(2);
  });

  it("excludes zero-value stats", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 1);
    const top = getTopStats(state, 100);
    expect(top.every((s) => s.value > 0)).toBe(true);
  });

  it("sorts by value descending", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 10);
    state = incrementStat(state, "damageDealt", 999);
    state = incrementStat(state, "critHits", 50);
    const top = getTopStats(state, 3);
    expect(top[0].value).toBe(999);
    expect(top[1].value).toBe(50);
    expect(top[2].value).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════════
// § compareRuns
// ════════════════════════════════════════════════════════════════

describe("compareRuns", () => {
  it("returns tie for identical stats", () => {
    const a = createStatsState().perRunStats;
    const b = createStatsState().perRunStats;
    const result = compareRuns(a, b);
    expect(result.winner).toBe("tie");
    expect(result.scoreA).toBe(result.scoreB);
  });

  it("declares winner a when a has more kills", () => {
    const a = { ...createStatsState().perRunStats, totalKills: 100 };
    const b = { ...createStatsState().perRunStats, totalKills: 10 };
    const result = compareRuns(a, b);
    expect(result.winner).toBe("a");
    expect(result.scoreA).toBeGreaterThan(result.scoreB);
  });

  it("declares winner b when b has more boss kills", () => {
    const a = { ...createStatsState().perRunStats };
    const b = { ...createStatsState().perRunStats, bossKills: 5 };
    const result = compareRuns(a, b);
    expect(result.winner).toBe("b");
  });

  it("tracks advantages per side", () => {
    const a = {
      ...createStatsState().perRunStats,
      totalKills: 50,
      damageDealt: 1000,
    };
    const b = { ...createStatsState().perRunStats, bossKills: 3, victories: 1 };
    const result = compareRuns(a, b);
    expect(result.advantages.a.length).toBeGreaterThan(0);
    expect(result.advantages.b.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § serialize / deserialize
// ════════════════════════════════════════════════════════════════

describe("serialize / deserialize", () => {
  it("roundtrips a fresh state", () => {
    const state = createStatsState();
    const json = serialize(state);
    const restored = deserialize(json);
    expect(restored).toEqual(state);
  });

  it("roundtrips a state with values", () => {
    let state = createStatsState();
    state = incrementStat(state, "totalKills", 42);
    state = setMaxStat(state, "highestDPS", 999);
    state = startRun(state);
    state = incrementStat(state, "bossKills", 2);
    state = endRun(state);

    const json = serialize(state);
    const restored = deserialize(json);
    expect(restored!.stats.totalKills).toBe(42);
    expect(restored!.stats.highestDPS).toBe(999);
    expect(restored!.allTimeStats.bossKills).toBe(2);
  });

  it("returns null for invalid JSON", () => {
    expect(deserialize("not json")).toBeNull();
  });

  it("returns null for wrong structure", () => {
    expect(deserialize('{"foo": "bar"}')).toBeNull();
  });

  it("returns null for partial structure", () => {
    expect(deserialize('{"stats": {}}')).toBeNull();
  });

  it("fills missing keys with zero on deserialize", () => {
    const partial = JSON.stringify({
      stats: { totalKills: 10 },
      perRunStats: {},
      allTimeStats: {},
    });
    const restored = deserialize(partial);
    expect(restored!.stats.totalKills).toBe(10);
    expect(restored!.stats.bossKills).toBe(0);
    expect(restored!.stats.damageDealt).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getStatDefinitions
// ════════════════════════════════════════════════════════════════

describe("getStatDefinitions", () => {
  it("returns at least 30 definitions", () => {
    const defs = getStatDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(30);
  });

  it("every definition has required fields", () => {
    const defs = getStatDefinitions();
    for (const def of defs) {
      expect(def.key).toBeTruthy();
      expect(def.label).toBeTruthy();
      expect([
        "combat",
        "survival",
        "economy",
        "progression",
        "social",
      ]).toContain(def.category);
      expect(["number", "time", "percent", "ratio"]).toContain(def.format);
      expect(["add", "max"]).toContain(def.mergeStrategy);
    }
  });

  it("has no duplicate keys", () => {
    const defs = getStatDefinitions();
    const keys = defs.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration: full run lifecycle
// ════════════════════════════════════════════════════════════════

describe("full run lifecycle", () => {
  it("simulates a complete game session", () => {
    let state = createStatsState();

    // Start run
    state = startRun(state);
    state = incrementStat(state, "totalRuns");

    // Combat
    state = incrementStat(state, "totalKills", 150);
    state = incrementStat(state, "eliteKills", 8);
    state = incrementStat(state, "bossKills", 1);
    state = incrementStat(state, "damageDealt", 25000);
    state = incrementStat(state, "damageTaken", 3000);
    state = incrementStat(state, "critHits", 45);
    state = setMaxStat(state, "longestKillStreak", 22);
    state = setMaxStat(state, "highestDPS", 1200);
    state = setStat(state, "accuracy", 72.5);

    // Survival
    state = incrementStat(state, "totalTimePlayed", 600);
    state = setMaxStat(state, "longestRun", 600);

    // Economy
    state = incrementStat(state, "totalCoinsEarned", 340);
    state = incrementStat(state, "totalCoinsSpent", 200);

    // Progression
    state = setMaxStat(state, "highestLevel", 15);
    state = incrementStat(state, "victories");

    // End run
    state = endRun(state);

    // Verify allTime
    expect(state.allTimeStats.totalKills).toBe(150);
    expect(state.allTimeStats.victories).toBe(1);
    expect(state.allTimeStats.highestDPS).toBe(1200);
    expect(state.allTimeStats.longestRun).toBe(600);

    // Second run
    state = startRun(state);
    state = incrementStat(state, "totalRuns");
    state = incrementStat(state, "totalKills", 200);
    state = setMaxStat(state, "highestDPS", 900);
    state = incrementStat(state, "defeats");
    state = endRun(state);

    // allTime should accumulate kills, keep max DPS
    expect(state.allTimeStats.totalKills).toBe(350);
    expect(state.allTimeStats.highestDPS).toBe(1200);
    expect(state.allTimeStats.defeats).toBe(1);
    expect(state.allTimeStats.totalRuns).toBe(2);

    // Serialize and restore
    const json = serialize(state);
    const restored = deserialize(json)!;
    expect(restored.allTimeStats.totalKills).toBe(350);
    expect(restored.allTimeStats.highestDPS).toBe(1200);
  });
});
