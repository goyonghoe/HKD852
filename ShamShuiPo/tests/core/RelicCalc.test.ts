// ── Tests: RelicCalc (Relic / Artifact System) ──

import { describe, it, expect } from "vitest";
import {
  type RelicRarity,
  RELIC_DEFS,
  createRelicState,
  addRelic,
  removeRelic,
  equipRelic,
  unequipRelic,
  upgradeRelic,
  getRelicEffects,
  getRelicByRarity,
  isRelicEquipped,
  canEquipMore,
  getRelicPower,
  getTotalRelicPower,
  getRarityDropRate,
} from "../../src/core/RelicCalc";

// ════════════════════════════════════════════════════════════════
// § RELIC_DEFS
// ════════════════════════════════════════════════════════════════

describe("RELIC_DEFS", () => {
  it("contains exactly 12 relic definitions", () => {
    expect(RELIC_DEFS).toHaveLength(12);
  });

  it("all IDs are unique", () => {
    const ids = RELIC_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(12);
  });

  it("every def has required fields", () => {
    for (const def of RELIC_DEFS) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.effects.length).toBeGreaterThan(0);
      expect(def.maxStack).toBeGreaterThan(0);
      expect(typeof def.isPassive).toBe("boolean");
    }
  });

  it("covers all 5 rarities", () => {
    const rarities = new Set(RELIC_DEFS.map((d) => d.rarity));
    expect(rarities).toEqual(
      new Set(["common", "rare", "epic", "legendary", "mythic"]),
    );
  });

  it("has 3 common relics", () => {
    expect(RELIC_DEFS.filter((d) => d.rarity === "common")).toHaveLength(3);
  });

  it("has 3 rare relics", () => {
    expect(RELIC_DEFS.filter((d) => d.rarity === "rare")).toHaveLength(3);
  });

  it("has 2 epic relics", () => {
    expect(RELIC_DEFS.filter((d) => d.rarity === "epic")).toHaveLength(2);
  });

  it("has 2 legendary relics", () => {
    expect(RELIC_DEFS.filter((d) => d.rarity === "legendary")).toHaveLength(2);
  });

  it("has 2 mythic relics", () => {
    expect(RELIC_DEFS.filter((d) => d.rarity === "mythic")).toHaveLength(2);
  });

  it("every effect has stat, value, isPercent", () => {
    for (const def of RELIC_DEFS) {
      for (const eff of def.effects) {
        expect(typeof eff.stat).toBe("string");
        expect(typeof eff.value).toBe("number");
        expect(typeof eff.isPercent).toBe("boolean");
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § createRelicState
// ════════════════════════════════════════════════════════════════

describe("createRelicState", () => {
  it("creates empty state with default 6 slots", () => {
    const s = createRelicState();
    expect(s.owned).toEqual([]);
    expect(s.equipped).toEqual([]);
    expect(s.maxSlots).toBe(6);
  });

  it("creates state with custom slot count", () => {
    expect(createRelicState(3).maxSlots).toBe(3);
  });

  it("creates state with 0 slots", () => {
    expect(createRelicState(0).maxSlots).toBe(0);
  });

  it("returns a fresh object each call", () => {
    const a = createRelicState();
    const b = createRelicState();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ════════════════════════════════════════════════════════════════
// § addRelic
// ════════════════════════════════════════════════════════════════

describe("addRelic", () => {
  it("adds a relic to empty state", () => {
    const s = addRelic(createRelicState(), "neon_shard");
    expect(s.owned).toHaveLength(1);
    expect(s.owned[0].defId).toBe("neon_shard");
    expect(s.owned[0].level).toBe(1);
    expect(s.owned[0].stackCount).toBe(1);
    expect(s.owned[0].isActive).toBe(true);
  });

  it("stacks if already owned and below maxStack", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(1);
    expect(s.owned[0].stackCount).toBe(2);
  });

  it("does not exceed maxStack", () => {
    let s = createRelicState();
    for (let i = 0; i < 10; i++) s = addRelic(s, "neon_shard"); // maxStack=5
    expect(s.owned[0].stackCount).toBe(5);
  });

  it("returns unchanged state for unknown defId", () => {
    const s = createRelicState();
    const result = addRelic(s, "nonexistent");
    expect(result).toBe(s);
  });

  it("adds multiple different relics", () => {
    let s = createRelicState();
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = addRelic(s, "thunder_core");
    expect(s.owned).toHaveLength(3);
  });

  it("returns immutable state (original untouched)", () => {
    const original = createRelicState();
    const next = addRelic(original, "neon_shard");
    expect(original.owned).toHaveLength(0);
    expect(next.owned).toHaveLength(1);
  });

  it("legendary maxStack=1 prevents stacking", () => {
    let s = addRelic(createRelicState(), "thunder_core");
    s = addRelic(s, "thunder_core");
    expect(s.owned[0].stackCount).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeRelic
// ════════════════════════════════════════════════════════════════

describe("removeRelic", () => {
  it("removes an owned relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = removeRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(0);
  });

  it("also removes from equipped", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    s = removeRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(0);
    expect(s.equipped).toHaveLength(0);
  });

  it("is a no-op for non-owned relic", () => {
    const s = createRelicState();
    const result = removeRelic(s, "neon_shard");
    expect(result.owned).toHaveLength(0);
  });

  it("does not affect other owned relics", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = removeRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(1);
    expect(s.owned[0].defId).toBe("cyber_lens");
  });
});

// ════════════════════════════════════════════════════════════════
// § equipRelic
// ════════════════════════════════════════════════════════════════

describe("equipRelic", () => {
  it("equips an owned relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    expect(s.equipped).toEqual(["neon_shard"]);
  });

  it("does not equip if not owned", () => {
    const s = equipRelic(createRelicState(), "neon_shard");
    expect(s.equipped).toHaveLength(0);
  });

  it("does not equip duplicates", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "neon_shard");
    expect(s.equipped).toHaveLength(1);
  });

  it("respects maxSlots limit", () => {
    let s = createRelicState(2);
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = addRelic(s, "pulse_coil");
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "cyber_lens");
    s = equipRelic(s, "pulse_coil"); // should fail, only 2 slots
    expect(s.equipped).toHaveLength(2);
    expect(s.equipped).not.toContain("pulse_coil");
  });

  it("returns unchanged state if slots full", () => {
    let s = createRelicState(1);
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = equipRelic(s, "neon_shard");
    const before = s;
    s = equipRelic(s, "cyber_lens");
    expect(s).toBe(before);
  });
});

// ════════════════════════════════════════════════════════════════
// § unequipRelic
// ════════════════════════════════════════════════════════════════

describe("unequipRelic", () => {
  it("unequips an equipped relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    s = unequipRelic(s, "neon_shard");
    expect(s.equipped).toHaveLength(0);
  });

  it("keeps relic in owned after unequip", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    s = unequipRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(1);
  });

  it("returns unchanged state if not equipped", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    const before = s;
    s = unequipRelic(s, "neon_shard");
    expect(s).toBe(before);
  });

  it("returns unchanged state for unknown defId", () => {
    const s = createRelicState();
    const result = unequipRelic(s, "nonexistent");
    expect(result).toBe(s);
  });
});

// ════════════════════════════════════════════════════════════════
// § upgradeRelic
// ════════════════════════════════════════════════════════════════

describe("upgradeRelic", () => {
  it("increases level by 1", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = upgradeRelic(s, "neon_shard");
    expect(s.owned[0].level).toBe(2);
  });

  it("can upgrade multiple times", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = upgradeRelic(s, "neon_shard");
    s = upgradeRelic(s, "neon_shard");
    s = upgradeRelic(s, "neon_shard");
    expect(s.owned[0].level).toBe(4);
  });

  it("returns unchanged state if not owned", () => {
    const s = createRelicState();
    const result = upgradeRelic(s, "neon_shard");
    expect(result).toBe(s);
  });

  it("does not affect other relics", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = upgradeRelic(s, "neon_shard");
    expect(s.owned.find((r) => r.defId === "cyber_lens")!.level).toBe(1);
  });

  it("is immutable", () => {
    const original = addRelic(createRelicState(), "neon_shard");
    const upgraded = upgradeRelic(original, "neon_shard");
    expect(original.owned[0].level).toBe(1);
    expect(upgraded.owned[0].level).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRelicEffects
// ════════════════════════════════════════════════════════════════

describe("getRelicEffects", () => {
  it("returns empty array for no equipped relics", () => {
    expect(getRelicEffects(createRelicState())).toEqual([]);
  });

  it("returns effects for a single equipped relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    const effects = getRelicEffects(s);
    expect(effects).toHaveLength(1);
    expect(effects[0].stat).toBe("damage");
    expect(effects[0].value).toBe(5); // 5 * level(1) * stack(1)
    expect(effects[0].isPercent).toBe(true);
  });

  it("scales with level", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = upgradeRelic(s, "neon_shard");
    s = upgradeRelic(s, "neon_shard"); // level 3
    s = equipRelic(s, "neon_shard");
    const effects = getRelicEffects(s);
    expect(effects[0].value).toBe(15); // 5 * 3 * 1
  });

  it("scales with stack count", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "neon_shard"); // stack 3
    s = equipRelic(s, "neon_shard");
    const effects = getRelicEffects(s);
    expect(effects[0].value).toBe(15); // 5 * 1 * 3
  });

  it("aggregates same stat from different relics", () => {
    // neon_shard: damage +5%, berserker_chip: damage +25%
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "berserker_chip");
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "berserker_chip");
    const effects = getRelicEffects(s);
    const dmg = effects.find(
      (e) => e.stat === "damage" && e.isPercent === true,
    );
    expect(dmg).toBeDefined();
    expect(dmg!.value).toBe(30); // 5 + 25
  });

  it("handles multi-effect relics", () => {
    let s = addRelic(createRelicState(), "cyber_lens");
    s = equipRelic(s, "cyber_lens");
    const effects = getRelicEffects(s);
    expect(effects.length).toBe(2); // crit_chance + crit_damage
  });

  it("does not include unequipped relics", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = equipRelic(s, "neon_shard");
    // cyber_lens is owned but not equipped
    const effects = getRelicEffects(s);
    expect(effects.every((e) => e.stat !== "crit_chance")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRelicByRarity
// ════════════════════════════════════════════════════════════════

describe("getRelicByRarity", () => {
  it("returns empty for no owned relics of that rarity", () => {
    const s = createRelicState();
    expect(getRelicByRarity(s, "legendary")).toEqual([]);
  });

  it("returns only relics of the requested rarity", () => {
    let s = addRelic(createRelicState(), "neon_shard"); // common
    s = addRelic(s, "cyber_lens"); // rare
    s = addRelic(s, "thunder_core"); // legendary
    const commons = getRelicByRarity(s, "common");
    expect(commons).toHaveLength(1);
    expect(commons[0].defId).toBe("neon_shard");
  });

  it("returns multiple relics of same rarity", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "pulse_coil");
    s = addRelic(s, "iron_plate");
    expect(getRelicByRarity(s, "common")).toHaveLength(3);
  });

  it("handles mythic rarity", () => {
    let s = addRelic(createRelicState(), "quantum_dice");
    expect(getRelicByRarity(s, "mythic")).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § isRelicEquipped
// ════════════════════════════════════════════════════════════════

describe("isRelicEquipped", () => {
  it("returns false for empty state", () => {
    expect(isRelicEquipped(createRelicState(), "neon_shard")).toBe(false);
  });

  it("returns false for owned but not equipped", () => {
    const s = addRelic(createRelicState(), "neon_shard");
    expect(isRelicEquipped(s, "neon_shard")).toBe(false);
  });

  it("returns true for equipped relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    expect(isRelicEquipped(s, "neon_shard")).toBe(true);
  });

  it("returns false after unequip", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    s = unequipRelic(s, "neon_shard");
    expect(isRelicEquipped(s, "neon_shard")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § canEquipMore
// ════════════════════════════════════════════════════════════════

describe("canEquipMore", () => {
  it("returns true for empty equipped", () => {
    expect(canEquipMore(createRelicState())).toBe(true);
  });

  it("returns false when maxSlots=0", () => {
    expect(canEquipMore(createRelicState(0))).toBe(false);
  });

  it("returns false when all slots filled", () => {
    let s = createRelicState(2);
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "cyber_lens");
    expect(canEquipMore(s)).toBe(false);
  });

  it("returns true when one slot remains", () => {
    let s = createRelicState(2);
    s = addRelic(s, "neon_shard");
    s = equipRelic(s, "neon_shard");
    expect(canEquipMore(s)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRelicPower
// ════════════════════════════════════════════════════════════════

describe("getRelicPower", () => {
  it("calculates base power for common relic", () => {
    // neon_shard: effects sum=5, level=1, stack=1, rarity mult=1
    const power = getRelicPower({
      defId: "neon_shard",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(5); // 5 * 1 * 1 * 1
  });

  it("scales with level", () => {
    const power = getRelicPower({
      defId: "neon_shard",
      level: 3,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(15); // 5 * 3 * 1 * 1
  });

  it("scales with stackCount", () => {
    const power = getRelicPower({
      defId: "neon_shard",
      level: 1,
      stackCount: 4,
      isActive: true,
    });
    expect(power).toBe(20); // 5 * 1 * 4 * 1
  });

  it("applies rarity multiplier for rare", () => {
    // cyber_lens: effects sum = 10+15 = 25, rare mult = 2
    const power = getRelicPower({
      defId: "cyber_lens",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(50); // 25 * 1 * 1 * 2
  });

  it("applies rarity multiplier for epic", () => {
    // berserker_chip: effects sum = 25+15 = 40, epic mult = 4
    const power = getRelicPower({
      defId: "berserker_chip",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(160); // 40 * 1 * 1 * 4
  });

  it("applies rarity multiplier for legendary", () => {
    // thunder_core: effects sum = 30+20+50 = 100, legendary mult = 8
    const power = getRelicPower({
      defId: "thunder_core",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(800); // 100 * 1 * 1 * 8
  });

  it("applies rarity multiplier for mythic", () => {
    // quantum_dice: effects sum = 50+25+20+30 = 125, mythic mult = 16
    const power = getRelicPower({
      defId: "quantum_dice",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(2000); // 125 * 1 * 1 * 16
  });

  it("returns 0 for unknown defId", () => {
    const power = getRelicPower({
      defId: "nonexistent",
      level: 1,
      stackCount: 1,
      isActive: true,
    });
    expect(power).toBe(0);
  });

  it("combines level and stack", () => {
    // neon_shard: 5 * 2 * 3 * 1 = 30
    const power = getRelicPower({
      defId: "neon_shard",
      level: 2,
      stackCount: 3,
      isActive: true,
    });
    expect(power).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTotalRelicPower
// ════════════════════════════════════════════════════════════════

describe("getTotalRelicPower", () => {
  it("returns 0 for empty state", () => {
    expect(getTotalRelicPower(createRelicState())).toBe(0);
  });

  it("returns 0 when relics are owned but not equipped", () => {
    const s = addRelic(createRelicState(), "neon_shard");
    expect(getTotalRelicPower(s)).toBe(0);
  });

  it("returns power of single equipped relic", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = equipRelic(s, "neon_shard");
    expect(getTotalRelicPower(s)).toBe(5);
  });

  it("sums power of multiple equipped relics", () => {
    let s = addRelic(createRelicState(), "neon_shard");
    s = addRelic(s, "cyber_lens");
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "cyber_lens");
    // neon_shard=5, cyber_lens=50
    expect(getTotalRelicPower(s)).toBe(55);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRarityDropRate
// ════════════════════════════════════════════════════════════════

describe("getRarityDropRate", () => {
  it("common has highest drop rate", () => {
    expect(getRarityDropRate("common")).toBe(0.45);
  });

  it("rare drop rate", () => {
    expect(getRarityDropRate("rare")).toBe(0.28);
  });

  it("epic drop rate", () => {
    expect(getRarityDropRate("epic")).toBe(0.15);
  });

  it("legendary drop rate", () => {
    expect(getRarityDropRate("legendary")).toBe(0.08);
  });

  it("mythic has lowest drop rate", () => {
    expect(getRarityDropRate("mythic")).toBe(0.04);
  });

  it("all rates sum to 1.0", () => {
    const rarities: RelicRarity[] = [
      "common",
      "rare",
      "epic",
      "legendary",
      "mythic",
    ];
    const total = rarities.reduce((sum, r) => sum + getRarityDropRate(r), 0);
    expect(total).toBeCloseTo(1.0);
  });

  it("each rate is between 0 and 1", () => {
    const rarities: RelicRarity[] = [
      "common",
      "rare",
      "epic",
      "legendary",
      "mythic",
    ];
    for (const r of rarities) {
      const rate = getRarityDropRate(r);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    }
  });

  it("rates decrease as rarity increases", () => {
    expect(getRarityDropRate("common")).toBeGreaterThan(
      getRarityDropRate("rare"),
    );
    expect(getRarityDropRate("rare")).toBeGreaterThan(
      getRarityDropRate("epic"),
    );
    expect(getRarityDropRate("epic")).toBeGreaterThan(
      getRarityDropRate("legendary"),
    );
    expect(getRarityDropRate("legendary")).toBeGreaterThan(
      getRarityDropRate("mythic"),
    );
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration — full workflow
// ════════════════════════════════════════════════════════════════

describe("Integration — full workflow", () => {
  it("complete relic lifecycle: add → equip → upgrade → effects → unequip → remove", () => {
    let s = createRelicState(3);

    // Add
    s = addRelic(s, "neon_shard");
    s = addRelic(s, "cyber_lens");
    expect(s.owned).toHaveLength(2);

    // Equip
    s = equipRelic(s, "neon_shard");
    s = equipRelic(s, "cyber_lens");
    expect(s.equipped).toHaveLength(2);
    expect(canEquipMore(s)).toBe(true); // 1 slot left

    // Upgrade
    s = upgradeRelic(s, "neon_shard");
    expect(s.owned.find((r) => r.defId === "neon_shard")!.level).toBe(2);

    // Effects
    const effects = getRelicEffects(s);
    expect(effects.length).toBeGreaterThan(0);
    const dmg = effects.find((e) => e.stat === "damage");
    expect(dmg).toBeDefined();
    expect(dmg!.value).toBe(10); // 5 * level(2) * stack(1)

    // Power
    expect(getTotalRelicPower(s)).toBeGreaterThan(0);

    // Unequip
    s = unequipRelic(s, "neon_shard");
    expect(isRelicEquipped(s, "neon_shard")).toBe(false);
    expect(s.owned).toHaveLength(2); // still owned

    // Remove
    s = removeRelic(s, "neon_shard");
    expect(s.owned).toHaveLength(1);
    expect(s.equipped).toHaveLength(1);
  });

  it("stacking + upgrade interaction", () => {
    let s = createRelicState();
    s = addRelic(s, "pulse_coil");
    s = addRelic(s, "pulse_coil");
    s = addRelic(s, "pulse_coil"); // stack=3
    s = upgradeRelic(s, "pulse_coil"); // level=2
    s = equipRelic(s, "pulse_coil");

    const effects = getRelicEffects(s);
    const speed = effects.find((e) => e.stat === "speed");
    expect(speed!.value).toBe(48); // 8 * 2 * 3
  });
});
