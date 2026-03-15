import { describe, it, expect } from "vitest";
import {
  createSpawnTable,
  addEntry,
  removeEntry,
  getAvailableEntries,
  getTotalWeight,
  selectWeighted,
  getProbability,
  getAllProbabilities,
  setWeight,
  getEntryCount,
  normalizeWeights,
  type SpawnEntry,
} from "../../src/core/SpawnWeightCalc";

// ── Helpers ──

function entry(
  id: string,
  weight: number,
  minWave = 1,
  maxWave = 0,
): SpawnEntry {
  return { id, weight, minWave, maxWave };
}

function fixedRng(value: number): () => number {
  return () => value;
}

// ════════════════════════════════════════════════════════════════
// § createSpawnTable
// ════════════════════════════════════════════════════════════════

describe("createSpawnTable", () => {
  it("creates a table from an empty array", () => {
    const table = createSpawnTable([]);
    expect(table.entries).toEqual([]);
  });

  it("creates a table with provided entries", () => {
    const entries = [entry("zombie", 50), entry("drone", 30)];
    const table = createSpawnTable(entries);
    expect(table.entries).toHaveLength(2);
    expect(table.entries[0].id).toBe("zombie");
    expect(table.entries[1].id).toBe("drone");
  });

  it("does not mutate the original entries array", () => {
    const entries = [entry("zombie", 50)];
    const table = createSpawnTable(entries);
    entries.push(entry("drone", 30));
    expect(table.entries).toHaveLength(1);
  });

  it("preserves all entry fields", () => {
    const e = entry("boss", 10, 5, 10);
    const table = createSpawnTable([e]);
    expect(table.entries[0]).toEqual({
      id: "boss",
      weight: 10,
      minWave: 5,
      maxWave: 10,
    });
  });
});

// ════════════════════════════════════════════════════════════════
// § addEntry
// ════════════════════════════════════════════════════════════════

describe("addEntry", () => {
  it("adds an entry to an empty table", () => {
    const table = createSpawnTable([]);
    const result = addEntry(table, entry("zombie", 50));
    expect(getEntryCount(result)).toBe(1);
  });

  it("appends to existing entries", () => {
    const table = createSpawnTable([entry("zombie", 50)]);
    const result = addEntry(table, entry("drone", 30));
    expect(getEntryCount(result)).toBe(2);
    expect(result.entries[1].id).toBe("drone");
  });

  it("does not mutate the original table", () => {
    const table = createSpawnTable([entry("zombie", 50)]);
    addEntry(table, entry("drone", 30));
    expect(getEntryCount(table)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeEntry
// ════════════════════════════════════════════════════════════════

describe("removeEntry", () => {
  it("removes an entry by id", () => {
    const table = createSpawnTable([entry("zombie", 50), entry("drone", 30)]);
    const result = removeEntry(table, "zombie");
    expect(getEntryCount(result)).toBe(1);
    expect(result.entries[0].id).toBe("drone");
  });

  it("returns unchanged table if id not found", () => {
    const table = createSpawnTable([entry("zombie", 50)]);
    const result = removeEntry(table, "ghost");
    expect(getEntryCount(result)).toBe(1);
  });

  it("does not mutate the original table", () => {
    const table = createSpawnTable([entry("zombie", 50)]);
    removeEntry(table, "zombie");
    expect(getEntryCount(table)).toBe(1);
  });

  it("removes all entries with matching id", () => {
    const table = createSpawnTable([
      entry("zombie", 50),
      entry("zombie", 30),
      entry("drone", 20),
    ]);
    const result = removeEntry(table, "zombie");
    expect(getEntryCount(result)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAvailableEntries
// ════════════════════════════════════════════════════════════════

describe("getAvailableEntries", () => {
  it("returns entries available at the given wave", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 0),
      entry("drone", 30, 3, 0),
    ]);
    const available = getAvailableEntries(table, 1);
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("zombie");
  });

  it("includes entries when wave equals minWave", () => {
    const table = createSpawnTable([entry("drone", 30, 5, 0)]);
    expect(getAvailableEntries(table, 5)).toHaveLength(1);
  });

  it("excludes entries when wave is below minWave", () => {
    const table = createSpawnTable([entry("drone", 30, 5, 0)]);
    expect(getAvailableEntries(table, 4)).toHaveLength(0);
  });

  it("includes entries when maxWave is 0 (unlimited)", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    expect(getAvailableEntries(table, 999)).toHaveLength(1);
  });

  it("excludes entries when wave exceeds maxWave", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 5)]);
    expect(getAvailableEntries(table, 6)).toHaveLength(0);
  });

  it("includes entries when wave equals maxWave", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 5)]);
    expect(getAvailableEntries(table, 5)).toHaveLength(1);
  });

  it("returns empty for empty table", () => {
    const table = createSpawnTable([]);
    expect(getAvailableEntries(table, 1)).toHaveLength(0);
  });

  it("filters multiple entries correctly", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 3),
      entry("drone", 30, 2, 5),
      entry("boss", 10, 5, 10),
    ]);
    const at3 = getAvailableEntries(table, 3);
    expect(at3.map((e) => e.id)).toEqual(["zombie", "drone"]);

    const at5 = getAvailableEntries(table, 5);
    expect(at5.map((e) => e.id)).toEqual(["drone", "boss"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTotalWeight
// ════════════════════════════════════════════════════════════════

describe("getTotalWeight", () => {
  it("sums weights of all entries", () => {
    const entries = [entry("zombie", 50), entry("drone", 30)];
    expect(getTotalWeight(entries)).toBe(80);
  });

  it("returns 0 for empty array", () => {
    expect(getTotalWeight([])).toBe(0);
  });

  it("handles single entry", () => {
    expect(getTotalWeight([entry("zombie", 42)])).toBe(42);
  });

  it("handles fractional weights", () => {
    const entries = [entry("a", 0.5), entry("b", 0.3)];
    expect(getTotalWeight(entries)).toBeCloseTo(0.8);
  });
});

// ════════════════════════════════════════════════════════════════
// § selectWeighted
// ════════════════════════════════════════════════════════════════

describe("selectWeighted", () => {
  it("returns null for empty table", () => {
    const table = createSpawnTable([]);
    expect(selectWeighted(table, 1)).toBeNull();
  });

  it("returns null when no entries available at wave", () => {
    const table = createSpawnTable([entry("boss", 10, 5, 0)]);
    expect(selectWeighted(table, 1)).toBeNull();
  });

  it("selects the only available entry", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    const result = selectWeighted(table, 1, fixedRng(0.5));
    expect(result).not.toBeNull();
    expect(result!.selectedId).toBe("zombie");
    expect(result!.probability).toBe(1);
  });

  it("selects first entry when rng returns 0", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 0),
      entry("drone", 50, 1, 0),
    ]);
    const result = selectWeighted(table, 1, fixedRng(0));
    expect(result!.selectedId).toBe("zombie");
  });

  it("selects second entry when rng is high enough", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 0),
      entry("drone", 50, 1, 0),
    ]);
    const result = selectWeighted(table, 1, fixedRng(0.6));
    expect(result!.selectedId).toBe("drone");
  });

  it("returns correct probability for selected entry", () => {
    const table = createSpawnTable([
      entry("zombie", 75, 1, 0),
      entry("drone", 25, 1, 0),
    ]);
    const result = selectWeighted(table, 1, fixedRng(0.8));
    expect(result!.selectedId).toBe("drone");
    expect(result!.probability).toBe(0.25);
  });

  it("handles rng at boundary (just below 1)", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 0),
      entry("drone", 50, 1, 0),
    ]);
    const result = selectWeighted(table, 1, fixedRng(0.9999));
    expect(result).not.toBeNull();
    expect(result!.selectedId).toBe("drone");
  });

  it("respects wave filtering in selection", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 3),
      entry("drone", 50, 4, 0),
    ]);
    // Wave 2: only zombie available
    const result = selectWeighted(table, 2, fixedRng(0.5));
    expect(result!.selectedId).toBe("zombie");
    expect(result!.probability).toBe(1);
  });

  it("uses Math.random by default", () => {
    const table = createSpawnTable([entry("zombie", 100, 1, 0)]);
    const result = selectWeighted(table, 1);
    expect(result).not.toBeNull();
    expect(result!.selectedId).toBe("zombie");
  });

  it("handles very skewed weights", () => {
    const table = createSpawnTable([
      entry("common", 999, 1, 0),
      entry("rare", 1, 1, 0),
    ]);
    // rng just barely above common threshold
    const result = selectWeighted(table, 1, fixedRng(0.9999));
    expect(result!.selectedId).toBe("rare");
  });
});

// ════════════════════════════════════════════════════════════════
// § getProbability
// ════════════════════════════════════════════════════════════════

describe("getProbability", () => {
  it("returns correct probability for entry", () => {
    const table = createSpawnTable([
      entry("zombie", 75, 1, 0),
      entry("drone", 25, 1, 0),
    ]);
    expect(getProbability(table, "zombie", 1)).toBe(0.75);
    expect(getProbability(table, "drone", 1)).toBe(0.25);
  });

  it("returns 0 for entry not in table", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    expect(getProbability(table, "ghost", 1)).toBe(0);
  });

  it("returns 0 for entry not available at wave", () => {
    const table = createSpawnTable([entry("boss", 10, 5, 0)]);
    expect(getProbability(table, "boss", 1)).toBe(0);
  });

  it("returns 1 for sole entry", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    expect(getProbability(table, "zombie", 1)).toBe(1);
  });

  it("returns 0 for empty table", () => {
    const table = createSpawnTable([]);
    expect(getProbability(table, "zombie", 1)).toBe(0);
  });

  it("recalculates probability based on wave availability", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 3),
      entry("drone", 50, 1, 0),
    ]);
    // Wave 1: both available → 0.5
    expect(getProbability(table, "drone", 1)).toBe(0.5);
    // Wave 4: only drone → 1.0
    expect(getProbability(table, "drone", 4)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAllProbabilities
// ════════════════════════════════════════════════════════════════

describe("getAllProbabilities", () => {
  it("returns probabilities for all available entries", () => {
    const table = createSpawnTable([
      entry("zombie", 60, 1, 0),
      entry("drone", 40, 1, 0),
    ]);
    const probs = getAllProbabilities(table, 1);
    expect(probs).toHaveLength(2);
    expect(probs[0]).toEqual({ id: "zombie", probability: 0.6 });
    expect(probs[1]).toEqual({ id: "drone", probability: 0.4 });
  });

  it("returns empty array for empty table", () => {
    const table = createSpawnTable([]);
    expect(getAllProbabilities(table, 1)).toEqual([]);
  });

  it("filters by wave", () => {
    const table = createSpawnTable([
      entry("zombie", 50, 1, 2),
      entry("drone", 50, 3, 0),
    ]);
    const probsW1 = getAllProbabilities(table, 1);
    expect(probsW1).toHaveLength(1);
    expect(probsW1[0].id).toBe("zombie");
    expect(probsW1[0].probability).toBe(1);
  });

  it("probabilities sum to 1", () => {
    const table = createSpawnTable([
      entry("a", 10, 1, 0),
      entry("b", 20, 1, 0),
      entry("c", 30, 1, 0),
      entry("d", 40, 1, 0),
    ]);
    const probs = getAllProbabilities(table, 1);
    const sum = probs.reduce((s, p) => s + p.probability, 0);
    expect(sum).toBeCloseTo(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § setWeight
// ════════════════════════════════════════════════════════════════

describe("setWeight", () => {
  it("changes weight of specified entry", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    const result = setWeight(table, "zombie", 100);
    expect(result.entries[0].weight).toBe(100);
  });

  it("does not mutate the original table", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    setWeight(table, "zombie", 100);
    expect(table.entries[0].weight).toBe(50);
  });

  it("returns unchanged table if id not found", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    const result = setWeight(table, "ghost", 100);
    expect(result.entries[0].weight).toBe(50);
  });

  it("can set weight to zero", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    const result = setWeight(table, "zombie", 0);
    expect(result.entries[0].weight).toBe(0);
  });

  it("preserves other entry fields", () => {
    const table = createSpawnTable([entry("zombie", 50, 3, 7)]);
    const result = setWeight(table, "zombie", 100);
    expect(result.entries[0].minWave).toBe(3);
    expect(result.entries[0].maxWave).toBe(7);
  });
});

// ════════════════════════════════════════════════════════════════
// § getEntryCount
// ════════════════════════════════════════════════════════════════

describe("getEntryCount", () => {
  it("returns 0 for empty table", () => {
    expect(getEntryCount(createSpawnTable([]))).toBe(0);
  });

  it("returns correct count", () => {
    const table = createSpawnTable([
      entry("a", 10),
      entry("b", 20),
      entry("c", 30),
    ]);
    expect(getEntryCount(table)).toBe(3);
  });

  it("reflects additions", () => {
    const table = addEntry(createSpawnTable([]), entry("a", 10));
    expect(getEntryCount(table)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § normalizeWeights
// ════════════════════════════════════════════════════════════════

describe("normalizeWeights", () => {
  it("scales weights to sum to 100", () => {
    const table = createSpawnTable([
      entry("zombie", 10, 1, 0),
      entry("drone", 20, 1, 0),
      entry("boss", 70, 1, 0),
    ]);
    const normalized = normalizeWeights(table);
    const total = getTotalWeight(normalized.entries as SpawnEntry[]);
    expect(total).toBeCloseTo(100);
  });

  it("preserves relative proportions", () => {
    const table = createSpawnTable([
      entry("a", 10, 1, 0),
      entry("b", 30, 1, 0),
    ]);
    const normalized = normalizeWeights(table);
    expect(normalized.entries[0].weight).toBeCloseTo(25);
    expect(normalized.entries[1].weight).toBeCloseTo(75);
  });

  it("does not mutate original table", () => {
    const table = createSpawnTable([entry("zombie", 50, 1, 0)]);
    normalizeWeights(table);
    expect(table.entries[0].weight).toBe(50);
  });

  it("returns unchanged table if total weight is 0", () => {
    const table = createSpawnTable([entry("a", 0, 1, 0), entry("b", 0, 1, 0)]);
    const result = normalizeWeights(table);
    expect(result.entries[0].weight).toBe(0);
  });

  it("handles single entry", () => {
    const table = createSpawnTable([entry("zombie", 42, 1, 0)]);
    const normalized = normalizeWeights(table);
    expect(normalized.entries[0].weight).toBeCloseTo(100);
  });

  it("handles already-normalized table (sum=100)", () => {
    const table = createSpawnTable([
      entry("a", 50, 1, 0),
      entry("b", 50, 1, 0),
    ]);
    const normalized = normalizeWeights(table);
    expect(normalized.entries[0].weight).toBeCloseTo(50);
    expect(normalized.entries[1].weight).toBeCloseTo(50);
  });

  it("preserves non-weight fields", () => {
    const table = createSpawnTable([entry("boss", 200, 5, 10)]);
    const normalized = normalizeWeights(table);
    expect(normalized.entries[0].id).toBe("boss");
    expect(normalized.entries[0].minWave).toBe(5);
    expect(normalized.entries[0].maxWave).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / Edge Cases
// ════════════════════════════════════════════════════════════════

describe("integration", () => {
  it("add then remove returns to original count", () => {
    const table = createSpawnTable([entry("zombie", 50)]);
    const added = addEntry(table, entry("drone", 30));
    const removed = removeEntry(added, "drone");
    expect(getEntryCount(removed)).toBe(1);
  });

  it("setWeight affects probability", () => {
    const table = createSpawnTable([
      entry("a", 50, 1, 0),
      entry("b", 50, 1, 0),
    ]);
    const boosted = setWeight(table, "a", 150);
    expect(getProbability(boosted, "a", 1)).toBe(0.75);
  });

  it("normalize then getAllProbabilities still sums to 1", () => {
    const table = createSpawnTable([
      entry("a", 7, 1, 0),
      entry("b", 13, 1, 0),
      entry("c", 33, 1, 0),
    ]);
    const normalized = normalizeWeights(table);
    const probs = getAllProbabilities(normalized, 1);
    const sum = probs.reduce((s, p) => s + p.probability, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("selectWeighted distribution matches probabilities over many rolls", () => {
    const table = createSpawnTable([
      entry("common", 80, 1, 0),
      entry("rare", 20, 1, 0),
    ]);
    let commonCount = 0;
    let rareCount = 0;
    const N = 10000;
    let seed = 0;
    const seededRng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < N; i++) {
      const result = selectWeighted(table, 1, seededRng);
      if (result!.selectedId === "common") commonCount++;
      else rareCount++;
    }
    // Within 5% tolerance
    expect(commonCount / N).toBeCloseTo(0.8, 1);
    expect(rareCount / N).toBeCloseTo(0.2, 1);
  });

  it("wave progression changes available pool", () => {
    const table = createSpawnTable([
      entry("grunt", 60, 1, 3),
      entry("elite", 30, 2, 5),
      entry("boss", 10, 4, 0),
    ]);
    expect(getAvailableEntries(table, 1).map((e) => e.id)).toEqual(["grunt"]);
    expect(getAvailableEntries(table, 2).map((e) => e.id)).toEqual([
      "grunt",
      "elite",
    ]);
    expect(getAvailableEntries(table, 4).map((e) => e.id)).toEqual([
      "elite",
      "boss",
    ]);
    expect(getAvailableEntries(table, 6).map((e) => e.id)).toEqual(["boss"]);
  });

  it("chained operations produce correct final state", () => {
    let table = createSpawnTable([]);
    table = addEntry(table, entry("a", 10, 1, 0));
    table = addEntry(table, entry("b", 20, 1, 0));
    table = addEntry(table, entry("c", 30, 1, 0));
    table = removeEntry(table, "b");
    table = setWeight(table, "c", 10);
    expect(getEntryCount(table)).toBe(2);
    expect(getProbability(table, "a", 1)).toBe(0.5);
    expect(getProbability(table, "c", 1)).toBe(0.5);
  });

  it("zero-weight entries do not get selected", () => {
    const table = createSpawnTable([
      entry("a", 0, 1, 0),
      entry("b", 100, 1, 0),
    ]);
    for (let i = 0; i < 100; i++) {
      const result = selectWeighted(table, 1, fixedRng(i / 100));
      expect(result!.selectedId).toBe("b");
    }
  });
});
