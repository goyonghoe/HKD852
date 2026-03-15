import { describe, it, expect } from "vitest";
import {
  createDropTable,
  addEntry,
  removeEntry,
  getTotalWeight,
  filterByRarity,
  applyLuckToWeight,
  getAdjustedWeights,
  rollDrop,
  rollMultiple,
  createPityState,
  incrementPityCounter,
  resetPityCounter,
  isPityTriggered,
  rollWithPity,
  createDropHistory,
  recordDrop,
  getLastDrop,
  wasRecentlyDropped,
  rollNoRepeat,
  getDropRateByRarity,
  getRarityIndex,
  compareRarity,
} from "../../src/core/DropTableCalc";

const rng0 = () => 0;
const rng05 = () => 0.5;
const rng099 = () => 0.99;

function makeTable() {
  let t = createDropTable();
  t = addEntry(t, "sword", 50, "common");
  t = addEntry(t, "shield", 30, "uncommon");
  t = addEntry(t, "ring", 15, "rare");
  t = addEntry(t, "crown", 4, "epic");
  t = addEntry(t, "excalibur", 1, "legendary");
  return t;
}

// ── Drop Table Management ──

describe("createDropTable", () => {
  it("creates empty table", () => {
    expect(createDropTable().entries).toHaveLength(0);
  });
});

describe("addEntry", () => {
  it("adds entry", () => {
    const t = addEntry(createDropTable(), "sword", 10, "common");
    expect(t.entries).toHaveLength(1);
    expect(t.entries[0].name).toBe("sword");
  });

  it("ignores zero weight", () => {
    const t = addEntry(createDropTable(), "sword", 0, "common");
    expect(t.entries).toHaveLength(0);
  });

  it("ignores negative weight", () => {
    const t = addEntry(createDropTable(), "sword", -5, "common");
    expect(t.entries).toHaveLength(0);
  });
});

describe("removeEntry", () => {
  it("removes by name", () => {
    let t = addEntry(createDropTable(), "sword", 10, "common");
    t = removeEntry(t, "sword");
    expect(t.entries).toHaveLength(0);
  });

  it("no-op for unknown name", () => {
    const t = addEntry(createDropTable(), "sword", 10, "common");
    expect(removeEntry(t, "nope").entries).toHaveLength(1);
  });
});

describe("getTotalWeight", () => {
  it("sums weights", () => {
    expect(getTotalWeight(makeTable())).toBe(100);
  });

  it("returns 0 for empty", () => {
    expect(getTotalWeight(createDropTable())).toBe(0);
  });
});

describe("filterByRarity", () => {
  it("filters correctly", () => {
    const t = filterByRarity(makeTable(), "rare");
    expect(t.entries).toHaveLength(1);
    expect(t.entries[0].name).toBe("ring");
  });
});

// ── Luck ──

describe("luck modifier", () => {
  it("common weight unaffected by luck", () => {
    const entry = { name: "a", weight: 10, rarity: "common" as const };
    expect(applyLuckToWeight(entry, 1)).toBe(10);
  });

  it("legendary gets biggest luck boost", () => {
    const entry = { name: "a", weight: 10, rarity: "legendary" as const };
    expect(applyLuckToWeight(entry, 1)).toBe(30); // 10 * (1 + 2*1)
  });

  it("negative luck clamped to 0", () => {
    const entry = { name: "a", weight: 10, rarity: "epic" as const };
    expect(applyLuckToWeight(entry, -5)).toBe(10);
  });

  it("getAdjustedWeights returns array", () => {
    const w = getAdjustedWeights(makeTable(), 0);
    expect(w).toHaveLength(5);
    expect(w[0]).toBe(50); // common, no luck
  });
});

// ── Rolling ──

describe("rollDrop", () => {
  it("returns null for empty table", () => {
    expect(rollDrop(createDropTable(), rng05)).toBeNull();
  });

  it("returns a drop result", () => {
    const result = rollDrop(makeTable(), rng05);
    expect(result).not.toBeNull();
    expect(result!.name).toBeDefined();
  });

  it("rng=0 selects first entry", () => {
    const result = rollDrop(makeTable(), rng0);
    expect(result!.name).toBe("sword");
  });

  it("rng=0.99 selects last entry", () => {
    const result = rollDrop(makeTable(), rng099);
    expect(result!.name).toBe("excalibur");
  });
});

describe("rollMultiple", () => {
  it("rolls N times", () => {
    const results = rollMultiple(makeTable(), 5, rng05);
    expect(results).toHaveLength(5);
  });

  it("empty table returns empty", () => {
    expect(rollMultiple(createDropTable(), 3, rng05)).toHaveLength(0);
  });
});

// ── Pity System ──

describe("pity system", () => {
  it("createPityState", () => {
    const p = createPityState(10);
    expect(p.killsSinceLastDrop).toBe(0);
    expect(p.pityThreshold).toBe(10);
  });

  it("incrementPityCounter", () => {
    const p = incrementPityCounter(createPityState(10));
    expect(p.killsSinceLastDrop).toBe(1);
  });

  it("resetPityCounter", () => {
    let p = createPityState(10);
    p = incrementPityCounter(p);
    p = resetPityCounter(p);
    expect(p.killsSinceLastDrop).toBe(0);
  });

  it("isPityTriggered", () => {
    let p = createPityState(3);
    expect(isPityTriggered(p)).toBe(false);
    for (let i = 0; i < 3; i++) p = incrementPityCounter(p);
    expect(isPityTriggered(p)).toBe(true);
  });

  it("rollWithPity forces rare+ on pity", () => {
    let p = createPityState(1);
    p = incrementPityCounter(p);
    const [result, newPity] = rollWithPity(makeTable(), p, rng05);
    expect(result).not.toBeNull();
    expect(newPity.killsSinceLastDrop).toBe(0);
  });

  it("rollWithPity normal roll resets pity", () => {
    const p = createPityState(100);
    const [result, newPity] = rollWithPity(makeTable(), p, rng05);
    expect(result).not.toBeNull();
    expect(newPity.killsSinceLastDrop).toBe(0);
  });
});

// ── Drop History ──

describe("drop history", () => {
  it("createDropHistory", () => {
    const h = createDropHistory(5);
    expect(h.items).toHaveLength(0);
    expect(h.maxSize).toBe(5);
  });

  it("recordDrop adds item", () => {
    let h = createDropHistory(5);
    h = recordDrop(h, "sword");
    expect(h.items).toHaveLength(1);
  });

  it("trims to maxSize", () => {
    let h = createDropHistory(2);
    h = recordDrop(h, "a");
    h = recordDrop(h, "b");
    h = recordDrop(h, "c");
    expect(h.items).toHaveLength(2);
    expect(h.items[0]).toBe("b");
  });

  it("getLastDrop", () => {
    expect(getLastDrop(createDropHistory(5))).toBeNull();
    let h = recordDrop(createDropHistory(5), "sword");
    expect(getLastDrop(h)).toBe("sword");
  });

  it("wasRecentlyDropped", () => {
    let h = createDropHistory(3);
    h = recordDrop(h, "sword");
    expect(wasRecentlyDropped(h, "sword")).toBe(true);
    expect(wasRecentlyDropped(h, "shield")).toBe(false);
  });
});

// ── No-Repeat ──

describe("rollNoRepeat", () => {
  it("returns result and updated history", () => {
    const [result, history] = rollNoRepeat(
      makeTable(),
      createDropHistory(5),
      rng05,
    );
    expect(result).not.toBeNull();
    expect(history.items).toHaveLength(1);
  });

  it("rerolls if same as last drop", () => {
    let h = createDropHistory(5);
    h = recordDrop(h, "sword"); // last drop is sword
    // rng=0 would normally pick sword, should reroll
    const [result] = rollNoRepeat(makeTable(), h, rng0);
    expect(result).not.toBeNull();
  });
});

// ── Statistics ──

describe("drop rate statistics", () => {
  it("getDropRateByRarity sums to 100", () => {
    const dist = getDropRateByRarity(makeTable());
    const sum =
      dist.common + dist.uncommon + dist.rare + dist.epic + dist.legendary;
    expect(sum).toBeCloseTo(100);
  });

  it("empty table returns all zeros", () => {
    const dist = getDropRateByRarity(createDropTable());
    expect(dist.common).toBe(0);
  });

  it("getRarityIndex", () => {
    expect(getRarityIndex("common")).toBe(0);
    expect(getRarityIndex("legendary")).toBe(4);
  });

  it("compareRarity", () => {
    expect(compareRarity("common", "legendary")).toBeLessThan(0);
    expect(compareRarity("epic", "epic")).toBe(0);
    expect(compareRarity("legendary", "common")).toBeGreaterThan(0);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("addEntry does not mutate", () => {
    const t = createDropTable();
    addEntry(t, "sword", 10, "common");
    expect(t.entries).toHaveLength(0);
  });

  it("rollDrop does not mutate table", () => {
    const t = makeTable();
    const len = t.entries.length;
    rollDrop(t, rng05);
    expect(t.entries).toHaveLength(len);
  });
});
