import { describe, it, expect } from "vitest";
import {
  createPlayerStats,
  addXp,
  getXpForLevel,
  levelUp,
  applyStatGrowth,
  getStatAtLevel,
  getEffectiveDamage,
  getEffectiveToughness,
  getDPS,
  getPowerLevel,
  heal,
  takeDamage,
  isDead,
  getHpPercent,
  applyBuff,
  resetToBase,
  DEFAULT_GROWTHS,
  type PlayerStats,
  type StatGrowth,
  type CharacterId,
} from "../../src/core/PlayerProgressionCalc";

// ─── createPlayerStats ───────────────────────────────────────────────────────

describe("createPlayerStats", () => {
  it("creates kai with correct defaults", () => {
    const s = createPlayerStats("kai");
    expect(s.maxHp).toBe(100);
    expect(s.damage).toBe(10);
    expect(s.speed).toBe(200);
    expect(s.level).toBe(1);
    expect(s.xp).toBe(0);
  });

  it("defaults to kai when no argument", () => {
    const s = createPlayerStats();
    expect(s.maxHp).toBe(100);
    expect(s.damage).toBe(10);
  });

  it("creates mei as glass cannon", () => {
    const s = createPlayerStats("mei");
    expect(s.maxHp).toBe(70);
    expect(s.damage).toBe(15);
    expect(s.speed).toBe(220);
    expect(s.critChance).toBe(10);
  });

  it("creates punk as tank", () => {
    const s = createPlayerStats("punk");
    expect(s.maxHp).toBe(150);
    expect(s.damage).toBe(8);
    expect(s.armor).toBe(12);
  });

  it("creates cyborg as fast", () => {
    const s = createPlayerStats("cyborg");
    expect(s.speed).toBe(250);
    expect(s.xpMultiplier).toBe(1.1);
  });

  it("creates biker as bruiser", () => {
    const s = createPlayerStats("biker");
    expect(s.maxHp).toBe(120);
    expect(s.damage).toBe(13);
    expect(s.speed).toBe(190);
  });

  it("sets xpToNext for level 2", () => {
    const s = createPlayerStats();
    expect(s.xpToNext).toBe(getXpForLevel(2));
  });

  it("starts with currentHp equal to maxHp", () => {
    for (const id of [
      "kai",
      "mei",
      "punk",
      "cyborg",
      "biker",
    ] as CharacterId[]) {
      const s = createPlayerStats(id);
      expect(s.currentHp).toBe(s.maxHp);
    }
  });
});

// ─── getXpForLevel ───────────────────────────────────────────────────────────

describe("getXpForLevel", () => {
  it("returns 0 for level 1", () => {
    expect(getXpForLevel(1)).toBe(0);
  });

  it("returns 0 for level 0", () => {
    expect(getXpForLevel(0)).toBe(0);
  });

  it("returns 283 for level 2 (100 * 2^1.5)", () => {
    expect(getXpForLevel(2)).toBe(Math.round(100 * Math.pow(2, 1.5)));
  });

  it("increases with level", () => {
    const xp5 = getXpForLevel(5);
    const xp10 = getXpForLevel(10);
    const xp20 = getXpForLevel(20);
    expect(xp10).toBeGreaterThan(xp5);
    expect(xp20).toBeGreaterThan(xp10);
  });

  it("grows super-linearly", () => {
    const xp5 = getXpForLevel(5);
    const xp10 = getXpForLevel(10);
    // xp10 should be more than 2x xp5 since growth is ^1.5
    expect(xp10).toBeGreaterThan(xp5 * 2);
  });
});

// ─── getStatAtLevel ──────────────────────────────────────────────────────────

describe("getStatAtLevel", () => {
  const linearGrowth: StatGrowth = {
    stat: "maxHp",
    baseValue: 0,
    growthPerLevel: 8,
    growthType: "linear",
  };

  it("returns baseValue at level 1", () => {
    expect(getStatAtLevel(linearGrowth, 1)).toBe(0);
  });

  it("applies linear growth correctly", () => {
    expect(getStatAtLevel(linearGrowth, 2)).toBe(8);
    expect(getStatAtLevel(linearGrowth, 11)).toBe(80); // 10 levels * 8
  });

  it("applies diminishing growth", () => {
    const dim: StatGrowth = {
      stat: "damage",
      baseValue: 0,
      growthPerLevel: 1.5,
      growthType: "diminishing",
    };
    const atLv5 = getStatAtLevel(dim, 5);
    const atLv10 = getStatAtLevel(dim, 10);
    // Diminishing: the second set of 5 levels should give less than the first
    const first5 = atLv5;
    const second5 = atLv10 - atLv5;
    expect(second5).toBeLessThan(first5);
  });

  it("applies exponential growth", () => {
    const exp: StatGrowth = {
      stat: "damage",
      baseValue: 5,
      growthPerLevel: 2,
      growthType: "exponential",
    };
    const atLv2 = getStatAtLevel(exp, 2);
    const atLv10 = getStatAtLevel(exp, 10);
    expect(atLv2).toBeGreaterThan(5);
    // Exponential grows faster at higher levels
    expect(atLv10).toBeGreaterThan(atLv2);
  });

  it("respects cap", () => {
    const capped: StatGrowth = {
      stat: "speed",
      baseValue: 0,
      growthPerLevel: 100,
      growthType: "linear",
      cap: 350,
    };
    expect(getStatAtLevel(capped, 100)).toBe(350);
  });
});

// ─── levelUp ─────────────────────────────────────────────────────────────────

describe("levelUp", () => {
  it("increments level by 1", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(leveled.level).toBe(2);
  });

  it("increases maxHp", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(leveled.maxHp).toBeGreaterThan(s.maxHp);
  });

  it("increases currentHp when maxHp increases", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(leveled.currentHp).toBeGreaterThan(s.currentHp);
  });

  it("increases damage", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(leveled.damage).toBeGreaterThan(s.damage);
  });

  it("updates xpToNext for next level", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(leveled.xpToNext).toBe(getXpForLevel(3));
  });

  it("does not reset xp", () => {
    const s = { ...createPlayerStats("kai"), xp: 50 };
    const leveled = levelUp(s);
    expect(leveled.xp).toBe(50);
  });

  it("is pure — original stats unchanged", () => {
    const s = createPlayerStats("kai");
    const original = { ...s };
    levelUp(s);
    expect(s).toEqual(original);
  });
});

// ─── addXp ───────────────────────────────────────────────────────────────────

describe("addXp", () => {
  it("adds XP without leveling up", () => {
    const s = createPlayerStats("kai");
    const result = addXp(s, 10);
    expect(result.stats.xp).toBe(10);
    expect(result.leveledUp).toBe(false);
    expect(result.levelsGained).toBe(0);
  });

  it("triggers level up when XP reaches threshold", () => {
    const s = createPlayerStats("kai");
    const result = addXp(s, s.xpToNext + 1);
    expect(result.leveledUp).toBe(true);
    expect(result.levelsGained).toBe(1);
    expect(result.stats.level).toBe(2);
  });

  it("handles multi-level-up", () => {
    const s = createPlayerStats("kai");
    // Give massive XP
    const result = addXp(s, 100000);
    expect(result.levelsGained).toBeGreaterThan(1);
    expect(result.stats.level).toBe(1 + result.levelsGained);
  });

  it("carries over excess XP", () => {
    const s = createPlayerStats("kai");
    const xpNeeded = s.xpToNext;
    const result = addXp(s, xpNeeded + 5);
    expect(result.stats.xp).toBe(5);
  });

  it("applies xpMultiplier", () => {
    const s = createPlayerStats("cyborg"); // xpMultiplier = 1.1
    const result = addXp(s, 100);
    // 100 * 1.1 = 110 total XP
    expect(result.stats.xp).toBe(110);
  });

  it("is pure — original stats unchanged", () => {
    const s = createPlayerStats("kai");
    const original = { ...s };
    addXp(s, 50);
    expect(s).toEqual(original);
  });
});

// ─── applyStatGrowth ─────────────────────────────────────────────────────────

describe("applyStatGrowth", () => {
  it("applies a growth to stats", () => {
    const s = createPlayerStats("kai");
    const growth: StatGrowth = {
      stat: "armor",
      baseValue: 0,
      growthPerLevel: 5,
      growthType: "linear",
    };
    const result = applyStatGrowth(s, growth);
    // At level 1, bonus is 0, so armor stays at base
    expect(result.armor).toBe(s.armor);
  });

  it("applies growth at higher levels", () => {
    let s = createPlayerStats("kai");
    s = { ...s, level: 5 };
    const growth: StatGrowth = {
      stat: "armor",
      baseValue: 0,
      growthPerLevel: 5,
      growthType: "linear",
    };
    const result = applyStatGrowth(s, growth);
    // bonus = 5 * 4 = 20, base armor = 5, total = 5 + 20 = 25
    expect(result.armor).toBe(25);
  });

  it("increases currentHp when maxHp grows", () => {
    const s = createPlayerStats("kai");
    const growth: StatGrowth = {
      stat: "maxHp",
      baseValue: 50,
      growthPerLevel: 10,
      growthType: "linear",
    };
    const leveled = { ...s, level: 3 };
    const result = applyStatGrowth(leveled, growth);
    expect(result.maxHp).toBeGreaterThan(s.maxHp);
    expect(result.currentHp).toBeGreaterThan(s.currentHp);
  });
});

// ─── getEffectiveDamage ──────────────────────────────────────────────────────

describe("getEffectiveDamage", () => {
  it("returns base damage when critChance is 0", () => {
    const s = { ...createPlayerStats("kai"), critChance: 0 };
    expect(getEffectiveDamage(s)).toBe(10);
  });

  it("factors in crit chance and crit damage", () => {
    const s = createPlayerStats("kai"); // critChance=5, critDamage=1.5
    const eff = getEffectiveDamage(s);
    // 10 * (1 + 0.05 * 0.5) = 10 * 1.025 = 10.25
    expect(eff).toBeCloseTo(10.25);
  });

  it("mei has higher effective damage than kai", () => {
    const kai = createPlayerStats("kai");
    const mei = createPlayerStats("mei");
    expect(getEffectiveDamage(mei)).toBeGreaterThan(getEffectiveDamage(kai));
  });
});

// ─── getEffectiveToughness ───────────────────────────────────────────────────

describe("getEffectiveToughness", () => {
  it("calculates correctly", () => {
    const s = createPlayerStats("kai"); // maxHp=100, armor=5
    // 100 * (1 + 5/100) = 105
    expect(getEffectiveToughness(s)).toBeCloseTo(105);
  });

  it("punk is tougher than mei", () => {
    const punk = createPlayerStats("punk");
    const mei = createPlayerStats("mei");
    expect(getEffectiveToughness(punk)).toBeGreaterThan(
      getEffectiveToughness(mei),
    );
  });
});

// ─── getDPS ──────────────────────────────────────────────────────────────────

describe("getDPS", () => {
  it("calculates damage per second", () => {
    const s = createPlayerStats("kai");
    const dps = getDPS(s, 2.0); // weapon fires 2 shots/sec
    const expected = getEffectiveDamage(s) * 2.0 * s.fireRate;
    expect(dps).toBeCloseTo(expected);
  });

  it("higher fireRate increases DPS", () => {
    const s = createPlayerStats("kai");
    const dps1 = getDPS(s, 1.0);
    const dps2 = getDPS(s, 3.0);
    expect(dps2).toBeGreaterThan(dps1);
  });

  it("returns 0 when weaponFireRate is 0", () => {
    const s = createPlayerStats("kai");
    expect(getDPS(s, 0)).toBe(0);
  });
});

// ─── getPowerLevel ───────────────────────────────────────────────────────────

describe("getPowerLevel", () => {
  it("returns a positive number", () => {
    const s = createPlayerStats("kai");
    expect(getPowerLevel(s)).toBeGreaterThan(0);
  });

  it("increases after level up", () => {
    const s = createPlayerStats("kai");
    const leveled = levelUp(s);
    expect(getPowerLevel(leveled)).toBeGreaterThan(getPowerLevel(s));
  });

  it("returns an integer", () => {
    const s = createPlayerStats("mei");
    expect(Number.isInteger(getPowerLevel(s))).toBe(true);
  });
});

// ─── heal ────────────────────────────────────────────────────────────────────

describe("heal", () => {
  it("heals damage", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 50 };
    const healed = heal(s, 30);
    expect(healed.currentHp).toBe(80);
  });

  it("caps at maxHp", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 90 };
    const healed = heal(s, 50);
    expect(healed.currentHp).toBe(100);
  });

  it("does nothing at full HP", () => {
    const s = createPlayerStats("kai");
    const healed = heal(s, 50);
    expect(healed.currentHp).toBe(100);
  });

  it("is pure", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 50 };
    const original = { ...s };
    heal(s, 30);
    expect(s).toEqual(original);
  });
});

// ─── takeDamage ──────────────────────────────────────────────────────────────

describe("takeDamage", () => {
  it("reduces HP", () => {
    const s = createPlayerStats("kai");
    const damaged = takeDamage(s, 20);
    expect(damaged.currentHp).toBeLessThan(100);
  });

  it("applies armor reduction", () => {
    const s = createPlayerStats("kai"); // armor=5
    const damaged = takeDamage(s, 100);
    // Reduction = 100 * 5/100 = 5, actual = 95
    expect(damaged.currentHp).toBeCloseTo(5);
  });

  it("floors at 0 HP", () => {
    const s = createPlayerStats("kai");
    const damaged = takeDamage(s, 10000);
    expect(damaged.currentHp).toBe(0);
  });

  it("punk takes less damage than mei (higher armor)", () => {
    const punk = createPlayerStats("punk");
    const mei = createPlayerStats("mei");
    const punkDamaged = takeDamage(punk, 50);
    const meiDamaged = takeDamage(mei, 50);
    // punk lost less HP proportionally
    const punkLost = punk.currentHp - punkDamaged.currentHp;
    const meiLost = mei.currentHp - meiDamaged.currentHp;
    expect(punkLost).toBeLessThan(meiLost);
  });

  it("is pure", () => {
    const s = createPlayerStats("kai");
    const original = { ...s };
    takeDamage(s, 20);
    expect(s).toEqual(original);
  });
});

// ─── isDead ──────────────────────────────────────────────────────────────────

describe("isDead", () => {
  it("returns false at full HP", () => {
    expect(isDead(createPlayerStats("kai"))).toBe(false);
  });

  it("returns true at 0 HP", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 0 };
    expect(isDead(s)).toBe(true);
  });

  it("returns true at negative HP (edge case)", () => {
    const s = { ...createPlayerStats("kai"), currentHp: -5 };
    expect(isDead(s)).toBe(true);
  });
});

// ─── getHpPercent ────────────────────────────────────────────────────────────

describe("getHpPercent", () => {
  it("returns 1 at full HP", () => {
    expect(getHpPercent(createPlayerStats("kai"))).toBe(1);
  });

  it("returns 0.5 at half HP", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 50 };
    expect(getHpPercent(s)).toBe(0.5);
  });

  it("returns 0 at 0 HP", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 0 };
    expect(getHpPercent(s)).toBe(0);
  });

  it("returns 0 when maxHp is 0", () => {
    const s = { ...createPlayerStats("kai"), maxHp: 0, currentHp: 0 };
    expect(getHpPercent(s)).toBe(0);
  });
});

// ─── applyBuff ───────────────────────────────────────────────────────────────

describe("applyBuff", () => {
  it("multiplies a stat", () => {
    const s = createPlayerStats("kai");
    const buffed = applyBuff(s, "damage", 1.5);
    expect(buffed.damage).toBe(15);
  });

  it("doubles speed", () => {
    const s = createPlayerStats("kai");
    const buffed = applyBuff(s, "speed", 2.0);
    expect(buffed.speed).toBe(400);
  });

  it("adjusts currentHp proportionally when maxHp buffed", () => {
    const s = { ...createPlayerStats("kai"), currentHp: 50 };
    const buffed = applyBuff(s, "maxHp", 2.0);
    expect(buffed.maxHp).toBe(200);
    // Was at 50% HP → should still be at 50%
    expect(buffed.currentHp).toBe(100);
  });

  it("is pure", () => {
    const s = createPlayerStats("kai");
    const original = { ...s };
    applyBuff(s, "damage", 2.0);
    expect(s).toEqual(original);
  });
});

// ─── resetToBase ─────────────────────────────────────────────────────────────

describe("resetToBase", () => {
  it("resets to level 1 base stats", () => {
    let s = createPlayerStats("kai");
    s = levelUp(levelUp(levelUp(s))); // level 4
    const reset = resetToBase(s, 1);
    expect(reset.level).toBe(1);
    expect(reset.maxHp).toBe(100);
    expect(reset.damage).toBe(10);
  });

  it("rebuilds to a specified level", () => {
    const s = createPlayerStats("kai");
    const rebuilt = resetToBase(s, 5);
    expect(rebuilt.level).toBe(5);
    expect(rebuilt.maxHp).toBeGreaterThan(100);
  });

  it("preserves xp", () => {
    const s = { ...createPlayerStats("kai"), xp: 42 };
    const rebuilt = resetToBase(s, 3);
    expect(rebuilt.xp).toBe(42);
  });
});

// ─── DEFAULT_GROWTHS ─────────────────────────────────────────────────────────

describe("DEFAULT_GROWTHS", () => {
  it("has 6 growth definitions", () => {
    expect(DEFAULT_GROWTHS).toHaveLength(6);
  });

  it("includes maxHp, damage, speed, fireRate, armor, critChance", () => {
    const stats = DEFAULT_GROWTHS.map((g) => g.stat);
    expect(stats).toContain("maxHp");
    expect(stats).toContain("damage");
    expect(stats).toContain("speed");
    expect(stats).toContain("fireRate");
    expect(stats).toContain("armor");
    expect(stats).toContain("critChance");
  });

  it("speed is capped at 350", () => {
    const speedGrowth = DEFAULT_GROWTHS.find((g) => g.stat === "speed")!;
    expect(speedGrowth.cap).toBe(350);
  });

  it("critChance is capped at 50", () => {
    const critGrowth = DEFAULT_GROWTHS.find((g) => g.stat === "critChance")!;
    expect(critGrowth.cap).toBe(50);
  });

  it("fireRate is capped at 2.0", () => {
    const frGrowth = DEFAULT_GROWTHS.find((g) => g.stat === "fireRate")!;
    expect(frGrowth.cap).toBe(2.0);
  });

  it("damage uses diminishing growth", () => {
    const dmgGrowth = DEFAULT_GROWTHS.find((g) => g.stat === "damage")!;
    expect(dmgGrowth.growthType).toBe("diminishing");
  });
});

// ─── Integration / Edge Cases ────────────────────────────────────────────────

describe("integration", () => {
  it("leveling up multiple times makes the character stronger", () => {
    let s = createPlayerStats("kai");
    const initialPower = getPowerLevel(s);
    for (let i = 0; i < 10; i++) {
      s = levelUp(s);
    }
    expect(getPowerLevel(s)).toBeGreaterThan(initialPower);
  });

  it("take damage then heal restores HP correctly", () => {
    let s = createPlayerStats("kai");
    s = takeDamage(s, 40);
    expect(s.currentHp).toBeLessThan(100);
    s = heal(s, 1000);
    expect(s.currentHp).toBe(s.maxHp);
  });

  it("zero damage does not change HP", () => {
    const s = createPlayerStats("kai");
    const damaged = takeDamage(s, 0);
    expect(damaged.currentHp).toBe(s.currentHp);
  });

  it("addXp with 0 does not level up", () => {
    const s = createPlayerStats("kai");
    const result = addXp(s, 0);
    expect(result.leveledUp).toBe(false);
    expect(result.stats.xp).toBe(0);
  });
});
