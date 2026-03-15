// ── Tests: LootTableCalc ──

import { describe, it, expect } from "vitest";
import {
  getRarityMultiplier,
  getEffectiveWeights,
  selectLoot,
  selectMultipleLoot,
  getRarityColor,
  getDropChance,
  Rarity,
  LootEntry,
  LootTableConfig,
} from "../../src/core/LootTableCalc";

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function makeConfig(entries: LootEntry[], luckBonus = 0): LootTableConfig {
  return { entries, luckBonus };
}

const SAMPLE_ENTRIES: LootEntry[] = [
  { id: "sword", rarity: "common", weight: 100, minWave: 0 },
  { id: "shield", rarity: "uncommon", weight: 50, minWave: 0 },
  { id: "bow", rarity: "rare", weight: 20, minWave: 3 },
  { id: "staff", rarity: "epic", weight: 5, minWave: 5 },
  { id: "excalibur", rarity: "legendary", weight: 1, minWave: 10 },
];

// ════════════════════════════════════════════════════════════════
// § getRarityMultiplier
// ════════════════════════════════════════════════════════════════

describe("getRarityMultiplier", () => {
  it("returns 1.0 for all rarities with 0 luck", () => {
    const rarities: Rarity[] = [
      "common",
      "uncommon",
      "rare",
      "epic",
      "legendary",
    ];
    for (const r of rarities) {
      expect(getRarityMultiplier(r, 0)).toBe(1.0);
    }
  });

  it("returns correct values with 1.0 luck", () => {
    expect(getRarityMultiplier("common", 1.0)).toBe(1.0);
    expect(getRarityMultiplier("uncommon", 1.0)).toBe(1.5);
    expect(getRarityMultiplier("rare", 1.0)).toBe(2.0);
    expect(getRarityMultiplier("epic", 1.0)).toBe(3.0);
    expect(getRarityMultiplier("legendary", 1.0)).toBe(4.0);
  });

  it("returns correct values with 0.5 luck", () => {
    expect(getRarityMultiplier("common", 0.5)).toBe(1.0);
    expect(getRarityMultiplier("uncommon", 0.5)).toBe(1.25);
    expect(getRarityMultiplier("rare", 0.5)).toBe(1.5);
    expect(getRarityMultiplier("epic", 0.5)).toBe(2.0);
    expect(getRarityMultiplier("legendary", 0.5)).toBe(2.5);
  });

  it("common is always 1.0 regardless of luck", () => {
    for (const luck of [0, 0.25, 0.5, 0.75, 1.0]) {
      expect(getRarityMultiplier("common", luck)).toBe(1.0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § getEffectiveWeights
// ════════════════════════════════════════════════════════════════

describe("getEffectiveWeights", () => {
  it("filters entries by minWave", () => {
    const config = makeConfig(SAMPLE_ENTRIES);
    const wave0 = getEffectiveWeights(config, 0);
    expect(wave0).toHaveLength(2); // sword, shield
    expect(wave0.map((w) => w.id)).toEqual(["sword", "shield"]);
  });

  it("includes entries at exactly their minWave", () => {
    const config = makeConfig(SAMPLE_ENTRIES);
    const wave3 = getEffectiveWeights(config, 3);
    expect(wave3).toHaveLength(3); // sword, shield, bow
    expect(wave3.map((w) => w.id)).toContain("bow");
  });

  it("includes all entries at wave 10+", () => {
    const config = makeConfig(SAMPLE_ENTRIES);
    const wave10 = getEffectiveWeights(config, 10);
    expect(wave10).toHaveLength(5);
  });

  it("applies luck multiplier to weights", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 1.0);
    const weights = getEffectiveWeights(config, 10);
    // common sword: 100 * 1.0 = 100
    expect(weights.find((w) => w.id === "sword")!.weight).toBe(100);
    // uncommon shield: 50 * 1.5 = 75
    expect(weights.find((w) => w.id === "shield")!.weight).toBe(75);
    // rare bow: 20 * 2.0 = 40
    expect(weights.find((w) => w.id === "bow")!.weight).toBe(40);
    // epic staff: 5 * 3.0 = 15
    expect(weights.find((w) => w.id === "staff")!.weight).toBe(15);
    // legendary excalibur: 1 * 4.0 = 4
    expect(weights.find((w) => w.id === "excalibur")!.weight).toBe(4);
  });

  it("returns empty array when no entries qualify", () => {
    const entries: LootEntry[] = [
      { id: "late_item", rarity: "epic", weight: 10, minWave: 99 },
    ];
    const config = makeConfig(entries);
    expect(getEffectiveWeights(config, 1)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § selectLoot
// ════════════════════════════════════════════════════════════════

describe("selectLoot", () => {
  it("returns null for empty table", () => {
    const config = makeConfig([]);
    expect(selectLoot(config, 0, 0.5)).toBeNull();
  });

  it("returns null when no entries qualify for current wave", () => {
    const entries: LootEntry[] = [
      { id: "late", rarity: "epic", weight: 10, minWave: 99 },
    ];
    const config = makeConfig(entries);
    expect(selectLoot(config, 1, 0.5)).toBeNull();
  });

  it("returns correct entry for roll=0 (first entry)", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const result = selectLoot(config, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("sword");
    expect(result!.rarity).toBe("common");
  });

  it("returns last entry for roll=0.999", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    // At wave 0, only sword(100) and shield(50) available
    // total = 150, roll=0.999 → target=149.85 → shield
    const result = selectLoot(config, 0, 0.999);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("shield");
  });

  it("returns single entry when only one available", () => {
    const entries: LootEntry[] = [
      { id: "only_item", rarity: "common", weight: 10, minWave: 0 },
    ];
    const config = makeConfig(entries);
    expect(selectLoot(config, 0, 0)!.id).toBe("only_item");
    expect(selectLoot(config, 0, 0.5)!.id).toBe("only_item");
    expect(selectLoot(config, 0, 0.999)!.id).toBe("only_item");
  });

  it("respects minWave filter", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    // At wave 0, bow (minWave 3) should never appear
    for (let i = 0; i < 100; i++) {
      const result = selectLoot(config, 0, i / 100);
      expect(result!.id).not.toBe("bow");
      expect(result!.id).not.toBe("staff");
      expect(result!.id).not.toBe("excalibur");
    }
  });

  it("selects proportionally based on weights", () => {
    const entries: LootEntry[] = [
      { id: "a", rarity: "common", weight: 75, minWave: 0 },
      { id: "b", rarity: "common", weight: 25, minWave: 0 },
    ];
    const config = makeConfig(entries, 0);
    // roll 0.5 → target = 50, cumulative a=75 → should select a
    expect(selectLoot(config, 0, 0.5)!.id).toBe("a");
    // roll 0.8 → target = 80, cumulative a=75, b=100 → should select b
    expect(selectLoot(config, 0, 0.8)!.id).toBe("b");
  });

  it("handles roll=1.0 edge case (returns last entry)", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const result = selectLoot(config, 0, 1.0);
    expect(result).not.toBeNull();
    // Should return last available entry (shield at wave 0)
    expect(result!.id).toBe("shield");
  });
});

// ════════════════════════════════════════════════════════════════
// § selectMultipleLoot
// ════════════════════════════════════════════════════════════════

describe("selectMultipleLoot", () => {
  it("returns correct count", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const results = selectMultipleLoot(config, 0, 5, [0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(results).toHaveLength(5);
  });

  it("with single entry returns all same", () => {
    const entries: LootEntry[] = [
      { id: "only", rarity: "rare", weight: 10, minWave: 0 },
    ];
    const config = makeConfig(entries, 0);
    const results = selectMultipleLoot(config, 0, 3, [0, 0.5, 0.99]);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.id).toBe("only");
      expect(r.rarity).toBe("rare");
    }
  });

  it("may include duplicates", () => {
    const entries: LootEntry[] = [
      { id: "a", rarity: "common", weight: 90, minWave: 0 },
      { id: "b", rarity: "rare", weight: 10, minWave: 0 },
    ];
    const config = makeConfig(entries, 0);
    // All low rolls should give "a"
    const results = selectMultipleLoot(config, 0, 3, [0.1, 0.2, 0.3]);
    expect(results.every((r) => r.id === "a")).toBe(true);
  });

  it("returns empty array when no entries available", () => {
    const config = makeConfig([]);
    const results = selectMultipleLoot(config, 0, 3, [0.1, 0.5, 0.9]);
    expect(results).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRarityColor
// ════════════════════════════════════════════════════════════════

describe("getRarityColor", () => {
  it("returns correct colors for each rarity", () => {
    expect(getRarityColor("common")).toBe(0xcccccc);
    expect(getRarityColor("uncommon")).toBe(0x00ff88);
    expect(getRarityColor("rare")).toBe(0x00ccff);
    expect(getRarityColor("epic")).toBe(0xcc66ff);
    expect(getRarityColor("legendary")).toBe(0xffcc00);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDropChance
// ════════════════════════════════════════════════════════════════

describe("getDropChance", () => {
  it("sums to ~1.0 for all available entries", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const wave = 10; // all entries available
    let total = 0;
    for (const entry of SAMPLE_ENTRIES) {
      total += getDropChance(entry, config, wave);
    }
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("returns 0 for entry not yet available (minWave)", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const bowEntry = SAMPLE_ENTRIES.find((e) => e.id === "bow")!;
    expect(getDropChance(bowEntry, config, 0)).toBe(0);
  });

  it("higher luck increases rare drop chance", () => {
    const noLuck = makeConfig(SAMPLE_ENTRIES, 0);
    const highLuck = makeConfig(SAMPLE_ENTRIES, 1.0);
    const wave = 10;
    const rareEntry = SAMPLE_ENTRIES.find((e) => e.id === "bow")!;
    const chanceNoLuck = getDropChance(rareEntry, noLuck, wave);
    const chanceHighLuck = getDropChance(rareEntry, highLuck, wave);
    expect(chanceHighLuck).toBeGreaterThan(chanceNoLuck);
  });

  it("higher luck increases legendary drop chance", () => {
    const noLuck = makeConfig(SAMPLE_ENTRIES, 0);
    const highLuck = makeConfig(SAMPLE_ENTRIES, 1.0);
    const wave = 10;
    const legendaryEntry = SAMPLE_ENTRIES.find((e) => e.id === "excalibur")!;
    const chanceNoLuck = getDropChance(legendaryEntry, noLuck, wave);
    const chanceHighLuck = getDropChance(legendaryEntry, highLuck, wave);
    expect(chanceHighLuck).toBeGreaterThan(chanceNoLuck);
  });

  it("common drop chance decreases with higher luck", () => {
    const noLuck = makeConfig(SAMPLE_ENTRIES, 0);
    const highLuck = makeConfig(SAMPLE_ENTRIES, 1.0);
    const wave = 10;
    const commonEntry = SAMPLE_ENTRIES.find((e) => e.id === "sword")!;
    const chanceNoLuck = getDropChance(commonEntry, noLuck, wave);
    const chanceHighLuck = getDropChance(commonEntry, highLuck, wave);
    // Common weight stays same but total grows, so its share decreases
    expect(chanceHighLuck).toBeLessThan(chanceNoLuck);
  });

  it("legendary items only available after their minWave", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const legendaryEntry = SAMPLE_ENTRIES.find((e) => e.id === "excalibur")!;
    // Before minWave 10
    expect(getDropChance(legendaryEntry, config, 0)).toBe(0);
    expect(getDropChance(legendaryEntry, config, 5)).toBe(0);
    expect(getDropChance(legendaryEntry, config, 9)).toBe(0);
    // At minWave 10
    expect(getDropChance(legendaryEntry, config, 10)).toBeGreaterThan(0);
  });

  it("returns 0 for entry not in config", () => {
    const config = makeConfig(SAMPLE_ENTRIES, 0);
    const fakeEntry: LootEntry = {
      id: "nonexistent",
      rarity: "common",
      weight: 10,
      minWave: 0,
    };
    expect(getDropChance(fakeEntry, config, 10)).toBe(0);
  });
});
