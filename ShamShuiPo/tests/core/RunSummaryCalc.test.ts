import { describe, it, expect } from "vitest";
import {
  createEmptyRecord,
  updateRecord,
  compareToRecord,
  calculateRewards,
  getRunGrade,
  getRunDuration,
  getKillsPerMinute,
  getDamageEfficiency,
  isNewPersonalBest,
  getRunHighlights,
  getMilestoneUnlocks,
  serializeRecord,
  deserializeRecord,
  type RunResult,
  type RunRecord,
} from "../../src/core/RunSummaryCalc";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    score: 10000,
    kills: 100,
    bossKills: 1,
    timeSurvivedMs: 300000, // 5 min
    level: 10,
    coinsEarned: 200,
    maxCombo: 15,
    damageDealt: 5000,
    damageTaken: 1000,
    weaponsUsed: ["pistol", "shotgun"],
    victory: false,
    wave: 10,
    ...overrides,
  };
}

function makeRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    bestScore: 5000,
    bestKills: 50,
    bestCombo: 10,
    bestTime: 200000,
    totalRuns: 5,
    totalKills: 250,
    totalCoins: 1000,
    victories: 1,
    ...overrides,
  };
}

// ─── createEmptyRecord ──────────────────────────────────────────────

describe("createEmptyRecord", () => {
  it("returns a record with all zeros", () => {
    const rec = createEmptyRecord();
    expect(rec.bestScore).toBe(0);
    expect(rec.bestKills).toBe(0);
    expect(rec.bestCombo).toBe(0);
    expect(rec.bestTime).toBe(0);
    expect(rec.totalRuns).toBe(0);
    expect(rec.totalKills).toBe(0);
    expect(rec.totalCoins).toBe(0);
    expect(rec.victories).toBe(0);
  });

  it("returns a new object each call", () => {
    const a = createEmptyRecord();
    const b = createEmptyRecord();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ─── updateRecord ───────────────────────────────────────────────────

describe("updateRecord", () => {
  it("updates best fields when result exceeds record", () => {
    const record = createEmptyRecord();
    const result = makeResult({
      score: 9000,
      kills: 80,
      maxCombo: 20,
      timeSurvivedMs: 400000,
    });
    const updated = updateRecord(record, result);
    expect(updated.bestScore).toBe(9000);
    expect(updated.bestKills).toBe(80);
    expect(updated.bestCombo).toBe(20);
    expect(updated.bestTime).toBe(400000);
  });

  it("does not lower existing bests", () => {
    const record = makeRecord({ bestScore: 20000, bestKills: 200 });
    const result = makeResult({ score: 5000, kills: 50 });
    const updated = updateRecord(record, result);
    expect(updated.bestScore).toBe(20000);
    expect(updated.bestKills).toBe(200);
  });

  it("increments totalRuns by 1", () => {
    const record = makeRecord({ totalRuns: 7 });
    const updated = updateRecord(record, makeResult());
    expect(updated.totalRuns).toBe(8);
  });

  it("accumulates totalKills", () => {
    const record = makeRecord({ totalKills: 500 });
    const result = makeResult({ kills: 120 });
    const updated = updateRecord(record, result);
    expect(updated.totalKills).toBe(620);
  });

  it("accumulates totalCoins", () => {
    const record = makeRecord({ totalCoins: 1000 });
    const result = makeResult({ coinsEarned: 300 });
    const updated = updateRecord(record, result);
    expect(updated.totalCoins).toBe(1300);
  });

  it("increments victories on victory", () => {
    const record = makeRecord({ victories: 2 });
    const result = makeResult({ victory: true });
    const updated = updateRecord(record, result);
    expect(updated.victories).toBe(3);
  });

  it("does not increment victories on defeat", () => {
    const record = makeRecord({ victories: 2 });
    const result = makeResult({ victory: false });
    const updated = updateRecord(record, result);
    expect(updated.victories).toBe(2);
  });

  it("returns a new object (immutability)", () => {
    const record = makeRecord();
    const updated = updateRecord(record, makeResult());
    expect(updated).not.toBe(record);
  });
});

// ─── compareToRecord ────────────────────────────────────────────────

describe("compareToRecord", () => {
  it("returns 4 comparison entries", () => {
    const cmp = compareToRecord(createEmptyRecord(), makeResult());
    expect(cmp).toHaveLength(4);
  });

  it("marks new records correctly", () => {
    const record = makeRecord({ bestScore: 5000 });
    const result = makeResult({ score: 10000 });
    const cmp = compareToRecord(record, result);
    const scoreEntry = cmp.find((e) => e.field === "score")!;
    expect(scoreEntry.isNewRecord).toBe(true);
    expect(scoreEntry.previous).toBe(5000);
    expect(scoreEntry.current).toBe(10000);
  });

  it("marks non-records correctly", () => {
    const record = makeRecord({ bestScore: 99999 });
    const result = makeResult({ score: 100 });
    const cmp = compareToRecord(record, result);
    const scoreEntry = cmp.find((e) => e.field === "score")!;
    expect(scoreEntry.isNewRecord).toBe(false);
  });

  it("equal value is not a new record", () => {
    const record = makeRecord({ bestKills: 100 });
    const result = makeResult({ kills: 100 });
    const cmp = compareToRecord(record, result);
    const killsEntry = cmp.find((e) => e.field === "kills")!;
    expect(killsEntry.isNewRecord).toBe(false);
  });
});

// ─── calculateRewards ───────────────────────────────────────────────

describe("calculateRewards", () => {
  it("calculates base coins correctly", () => {
    const result = makeResult({
      kills: 0,
      bossKills: 0,
      timeSurvivedMs: 0,
      victory: false,
      score: 0,
    });
    const reward = calculateRewards(result);
    expect(reward.coins).toBe(50); // base only
  });

  it("adds kill bonus", () => {
    const result = makeResult({
      kills: 100,
      bossKills: 0,
      timeSurvivedMs: 0,
      victory: false,
    });
    const reward = calculateRewards(result);
    // 50 + 100*2 = 250
    expect(reward.coins).toBe(250);
  });

  it("adds time bonus capped at 600 seconds", () => {
    const result = makeResult({
      kills: 0,
      bossKills: 0,
      timeSurvivedMs: 900000,
      victory: false,
    }); // 15 min
    const reward = calculateRewards(result);
    // 50 + 0 + floor(600*0.5) + 0 = 50 + 300 = 350
    expect(reward.coins).toBe(350);
  });

  it("adds boss bonus", () => {
    const result = makeResult({
      kills: 0,
      bossKills: 3,
      timeSurvivedMs: 0,
      victory: false,
    });
    const reward = calculateRewards(result);
    // 50 + 0 + 0 + 300 = 350
    expect(reward.coins).toBe(350);
  });

  it("adds victory bonus", () => {
    const result = makeResult({
      kills: 0,
      bossKills: 0,
      timeSurvivedMs: 0,
      victory: true,
    });
    const reward = calculateRewards(result);
    // 50 + 0 + 0 + 0 + 200 = 250
    expect(reward.coins).toBe(250);
  });

  it("calculates full reward formula", () => {
    const result = makeResult({
      kills: 50,
      bossKills: 2,
      timeSurvivedMs: 300000, // 300s
      victory: true,
      score: 20000,
    });
    const reward = calculateRewards(result);
    // 50 + 50*2 + floor(300*0.5) + 2*100 + 200 = 50 + 100 + 150 + 200 + 200 = 700
    expect(reward.coins).toBe(700);
    expect(reward.xp).toBe(2000); // 20000/10
  });

  it("calculates xp from score", () => {
    const result = makeResult({ score: 12345 });
    const reward = calculateRewards(result);
    expect(reward.xp).toBe(1234); // floor(12345/10)
  });

  it("includes victory_reward unlock on victory", () => {
    const result = makeResult({ victory: true });
    expect(calculateRewards(result).unlocks).toContain("victory_reward");
  });

  it("includes boss_hunter unlock for 3+ boss kills", () => {
    const result = makeResult({ bossKills: 3 });
    expect(calculateRewards(result).unlocks).toContain("boss_hunter");
  });

  it("includes combo_master unlock for 50+ combo", () => {
    const result = makeResult({ maxCombo: 50 });
    expect(calculateRewards(result).unlocks).toContain("combo_master");
  });

  it("returns no unlocks for a basic run", () => {
    const result = makeResult({ victory: false, bossKills: 0, maxCombo: 5 });
    expect(calculateRewards(result).unlocks).toHaveLength(0);
  });
});

// ─── getRunGrade ────────────────────────────────────────────────────

describe("getRunGrade", () => {
  it("returns S for score >= 50000", () => {
    expect(getRunGrade(makeResult({ score: 50000 }))).toBe("S");
    expect(getRunGrade(makeResult({ score: 99999 }))).toBe("S");
  });

  it("returns A for score >= 30000", () => {
    expect(getRunGrade(makeResult({ score: 30000 }))).toBe("A");
    expect(getRunGrade(makeResult({ score: 49999 }))).toBe("A");
  });

  it("returns B for score >= 15000", () => {
    expect(getRunGrade(makeResult({ score: 15000 }))).toBe("B");
  });

  it("returns C for score >= 5000", () => {
    expect(getRunGrade(makeResult({ score: 5000 }))).toBe("C");
  });

  it("returns D for score >= 1000", () => {
    expect(getRunGrade(makeResult({ score: 1000 }))).toBe("D");
  });

  it("returns F for score < 1000", () => {
    expect(getRunGrade(makeResult({ score: 999 }))).toBe("F");
    expect(getRunGrade(makeResult({ score: 0 }))).toBe("F");
  });
});

// ─── getRunDuration ─────────────────────────────────────────────────

describe("getRunDuration", () => {
  it("formats 0ms as 00:00", () => {
    expect(getRunDuration(makeResult({ timeSurvivedMs: 0 }))).toBe("00:00");
  });

  it("formats 61 seconds as 01:01", () => {
    expect(getRunDuration(makeResult({ timeSurvivedMs: 61000 }))).toBe("01:01");
  });

  it("formats 10 minutes as 10:00", () => {
    expect(getRunDuration(makeResult({ timeSurvivedMs: 600000 }))).toBe(
      "10:00",
    );
  });

  it("formats 5 minutes 30 seconds as 05:30", () => {
    expect(getRunDuration(makeResult({ timeSurvivedMs: 330000 }))).toBe(
      "05:30",
    );
  });

  it("pads single-digit values", () => {
    expect(getRunDuration(makeResult({ timeSurvivedMs: 5000 }))).toBe("00:05");
  });
});

// ─── getKillsPerMinute ──────────────────────────────────────────────

describe("getKillsPerMinute", () => {
  it("returns 0 when time is 0", () => {
    expect(
      getKillsPerMinute(makeResult({ kills: 100, timeSurvivedMs: 0 })),
    ).toBe(0);
  });

  it("calculates correctly for 1 minute", () => {
    expect(
      getKillsPerMinute(makeResult({ kills: 60, timeSurvivedMs: 60000 })),
    ).toBe(60);
  });

  it("calculates fractional KPM", () => {
    const kpm = getKillsPerMinute(
      makeResult({ kills: 100, timeSurvivedMs: 300000 }),
    );
    expect(kpm).toBe(20); // 100 / 5
  });
});

// ─── getDamageEfficiency ────────────────────────────────────────────

describe("getDamageEfficiency", () => {
  it("returns Infinity when no damage taken but damage dealt", () => {
    expect(
      getDamageEfficiency(makeResult({ damageDealt: 1000, damageTaken: 0 })),
    ).toBe(Infinity);
  });

  it("returns 0 when no damage dealt and no damage taken", () => {
    expect(
      getDamageEfficiency(makeResult({ damageDealt: 0, damageTaken: 0 })),
    ).toBe(0);
  });

  it("returns ratio correctly", () => {
    expect(
      getDamageEfficiency(makeResult({ damageDealt: 5000, damageTaken: 1000 })),
    ).toBe(5);
  });

  it("returns < 1 when taking more than dealing", () => {
    expect(
      getDamageEfficiency(makeResult({ damageDealt: 500, damageTaken: 1000 })),
    ).toBe(0.5);
  });
});

// ─── isNewPersonalBest ──────────────────────────────────────────────

describe("isNewPersonalBest", () => {
  it("returns true when score exceeds record", () => {
    expect(
      isNewPersonalBest(
        makeRecord({ bestScore: 100 }),
        makeResult({ score: 101 }),
      ),
    ).toBe(true);
  });

  it("returns true when kills exceeds record", () => {
    expect(
      isNewPersonalBest(
        makeRecord({ bestKills: 50 }),
        makeResult({ kills: 51 }),
      ),
    ).toBe(true);
  });

  it("returns true when combo exceeds record", () => {
    expect(
      isNewPersonalBest(
        makeRecord({ bestCombo: 10 }),
        makeResult({ maxCombo: 11 }),
      ),
    ).toBe(true);
  });

  it("returns true when time exceeds record", () => {
    expect(
      isNewPersonalBest(
        makeRecord({ bestTime: 100000 }),
        makeResult({ timeSurvivedMs: 100001 }),
      ),
    ).toBe(true);
  });

  it("returns false when all fields are equal", () => {
    const record = makeRecord({
      bestScore: 10000,
      bestKills: 100,
      bestCombo: 15,
      bestTime: 300000,
    });
    const result = makeResult({
      score: 10000,
      kills: 100,
      maxCombo: 15,
      timeSurvivedMs: 300000,
    });
    expect(isNewPersonalBest(record, result)).toBe(false);
  });

  it("returns false when all fields are below record", () => {
    const record = makeRecord({
      bestScore: 99999,
      bestKills: 9999,
      bestCombo: 999,
      bestTime: 999999,
    });
    const result = makeResult({
      score: 1,
      kills: 1,
      maxCombo: 1,
      timeSurvivedMs: 1,
    });
    expect(isNewPersonalBest(record, result)).toBe(false);
  });
});

// ─── getRunHighlights ───────────────────────────────────────────────

describe("getRunHighlights", () => {
  it("includes Victory! on win", () => {
    expect(getRunHighlights(makeResult({ victory: true }))).toContain(
      "Victory!",
    );
  });

  it("includes boss kill highlight", () => {
    const highlights = getRunHighlights(makeResult({ bossKills: 3 }));
    expect(highlights).toContain("Killed 3 bosses!");
  });

  it("uses singular boss for 1 kill", () => {
    const highlights = getRunHighlights(makeResult({ bossKills: 1 }));
    expect(highlights).toContain("Killed 1 boss!");
  });

  it("includes combo highlight for combo >= 10", () => {
    expect(getRunHighlights(makeResult({ maxCombo: 25 }))).toContain(
      "Max combo: 25!",
    );
  });

  it("does not include combo highlight for combo < 10", () => {
    const highlights = getRunHighlights(makeResult({ maxCombo: 5 }));
    expect(highlights.some((h) => h.includes("combo"))).toBe(false);
  });

  it("includes no-damage highlight when 0 damage and >= 60s", () => {
    expect(
      getRunHighlights(makeResult({ damageTaken: 0, timeSurvivedMs: 60000 })),
    ).toContain("No damage taken!");
  });

  it("excludes no-damage highlight if survived < 60s", () => {
    const highlights = getRunHighlights(
      makeResult({ damageTaken: 0, timeSurvivedMs: 30000 }),
    );
    expect(highlights).not.toContain("No damage taken!");
  });

  it("includes 500+ kills highlight", () => {
    expect(getRunHighlights(makeResult({ kills: 500 }))).toContain(
      "500+ kills!",
    );
  });

  it("includes 1000+ kills highlight", () => {
    const highlights = getRunHighlights(makeResult({ kills: 1000 }));
    expect(highlights).toContain("1000+ kills!");
    expect(highlights).toContain("500+ kills!"); // also triggers 500+
  });

  it("includes weapon variety highlight", () => {
    const result = makeResult({ weaponsUsed: ["a", "b", "c", "d", "e"] });
    expect(getRunHighlights(result)).toContain("Used 5 weapons!");
  });

  it("includes wave highlight for wave >= 20", () => {
    expect(getRunHighlights(makeResult({ wave: 20 }))).toContain(
      "Reached wave 20!",
    );
  });

  it("includes level highlight for level >= 20", () => {
    expect(getRunHighlights(makeResult({ level: 20 }))).toContain(
      "Reached level 20!",
    );
  });

  it("returns empty array for unremarkable run", () => {
    const result = makeResult({
      victory: false,
      bossKills: 0,
      maxCombo: 5,
      damageTaken: 100,
      kills: 10,
      weaponsUsed: ["pistol"],
      wave: 3,
      level: 3,
    });
    expect(getRunHighlights(result)).toHaveLength(0);
  });
});

// ─── getMilestoneUnlocks ────────────────────────────────────────────

describe("getMilestoneUnlocks", () => {
  it("returns empty for fresh record", () => {
    expect(getMilestoneUnlocks(createEmptyRecord())).toHaveLength(0);
  });

  it("unlocks Veteran at 10 runs", () => {
    expect(getMilestoneUnlocks(makeRecord({ totalRuns: 10 }))).toContain(
      "Veteran",
    );
  });

  it("unlocks Addict at 100 runs", () => {
    const unlocks = getMilestoneUnlocks(makeRecord({ totalRuns: 100 }));
    expect(unlocks).toContain("Addict");
    expect(unlocks).toContain("Veteran"); // also qualifies
  });

  it("unlocks Slayer at 1000 kills", () => {
    expect(getMilestoneUnlocks(makeRecord({ totalKills: 1000 }))).toContain(
      "Slayer",
    );
  });

  it("unlocks Genocide at 10000 kills", () => {
    const unlocks = getMilestoneUnlocks(makeRecord({ totalKills: 10000 }));
    expect(unlocks).toContain("Genocide");
    expect(unlocks).toContain("Slayer");
  });

  it("unlocks Winner at 1 victory", () => {
    expect(getMilestoneUnlocks(makeRecord({ victories: 1 }))).toContain(
      "Winner",
    );
  });

  it("unlocks Champion at 5 victories", () => {
    const unlocks = getMilestoneUnlocks(makeRecord({ victories: 5 }));
    expect(unlocks).toContain("Champion");
    expect(unlocks).toContain("Winner");
  });
});

// ─── serializeRecord / deserializeRecord ────────────────────────────

describe("serializeRecord / deserializeRecord", () => {
  it("round-trips a record", () => {
    const record = makeRecord();
    const json = serializeRecord(record);
    const deserialized = deserializeRecord(json);
    expect(deserialized).toEqual(record);
  });

  it("round-trips an empty record", () => {
    const record = createEmptyRecord();
    expect(deserializeRecord(serializeRecord(record))).toEqual(record);
  });

  it("throws on invalid JSON", () => {
    expect(() => deserializeRecord("not json")).toThrow("Invalid JSON string");
  });

  it("throws on array JSON", () => {
    expect(() => deserializeRecord("[]")).toThrow("expected an object");
  });

  it("throws on null JSON", () => {
    expect(() => deserializeRecord("null")).toThrow("expected an object");
  });

  it("throws on missing field", () => {
    const partial = JSON.stringify({ bestScore: 1 });
    expect(() => deserializeRecord(partial)).toThrow("must be a number");
  });

  it("throws on string field value", () => {
    const bad = JSON.stringify({
      ...createEmptyRecord(),
      bestScore: "not a number",
    });
    expect(() => deserializeRecord(bad)).toThrow("must be a number");
  });

  it("produces valid JSON string", () => {
    const json = serializeRecord(makeRecord());
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
