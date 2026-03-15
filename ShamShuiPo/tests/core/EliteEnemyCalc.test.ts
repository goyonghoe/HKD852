import { describe, it, expect } from "vitest";
import {
  createEliteConfig,
  isElite,
  getEliteRank,
  rollEliteModifiers,
  getModifierEffect,
  applyDamageReduction,
  shouldSplit,
  getSplitConfig,
  getDeathEffect,
  getXpReward,
  combineMultipliers,
  mulberry32,
  type EliteModifier,
  type EliteConfig,
} from "../../src/core/EliteEnemyCalc";

// ── mulberry32 PRNG ────────────────────────────────────────────

describe("mulberry32", () => {
  it("produces deterministic output for the same seed", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

// ── getModifierEffect ──────────────────────────────────────────

describe("getModifierEffect", () => {
  it("armored: 50% damage reduction, 1.3x size, 0.8x speed", () => {
    const e = getModifierEffect("armored");
    expect(e.damageReduction).toBe(0.5);
    expect(e.sizeMultiplier).toBe(1.3);
    expect(e.speedMultiplier).toBe(0.8);
    expect(e.hpMultiplier).toBe(1);
  });

  it("swift: 1.5x speed, 0.8x HP", () => {
    const e = getModifierEffect("swift");
    expect(e.speedMultiplier).toBe(1.5);
    expect(e.hpMultiplier).toBe(0.8);
  });

  it("berserker: 1.5x damage, 0.9x HP", () => {
    const e = getModifierEffect("berserker");
    expect(e.damageMultiplier).toBe(1.5);
    expect(e.hpMultiplier).toBe(0.9);
  });

  it("shielded: absorbs 3 hits", () => {
    const e = getModifierEffect("shielded");
    expect(e.shieldHits).toBe(3);
  });

  it("vampiric: heals 10% of damage dealt", () => {
    const e = getModifierEffect("vampiric");
    expect(e.vampiricPercent).toBe(0.1);
  });

  it("splitting: 2 copies at 30% HP", () => {
    const e = getModifierEffect("splitting");
    expect(e.splitCount).toBe(2);
    expect(e.splitHpPercent).toBe(0.3);
  });

  it("teleporting: 100px every 3 seconds", () => {
    const e = getModifierEffect("teleporting");
    expect(e.teleportDistance).toBe(100);
    expect(e.teleportCooldown).toBe(3);
  });

  it("explosive: 50px radius on death", () => {
    const e = getModifierEffect("explosive");
    expect(e.explosionRadius).toBe(50);
  });
});

// ── combineMultipliers ─────────────────────────────────────────

describe("combineMultipliers", () => {
  it("empty modifiers return all 1x", () => {
    const m = combineMultipliers([]);
    expect(m.hpMultiplier).toBe(1);
    expect(m.damageMultiplier).toBe(1);
    expect(m.speedMultiplier).toBe(1);
    expect(m.xpMultiplier).toBe(1);
    expect(m.sizeMultiplier).toBe(1);
  });

  it("single modifier applies correctly", () => {
    const m = combineMultipliers(["swift"]);
    expect(m.hpMultiplier).toBe(0.8);
    expect(m.speedMultiplier).toBe(1.5);
    expect(m.xpMultiplier).toBe(1.5); // 1.5^1
  });

  it("stacks multiplicatively for multiple modifiers", () => {
    const m = combineMultipliers(["swift", "berserker"]);
    expect(m.hpMultiplier).toBeCloseTo(0.8 * 0.9);
    expect(m.speedMultiplier).toBe(1.5); // only swift affects speed
    expect(m.damageMultiplier).toBe(1.5); // only berserker affects damage
    expect(m.xpMultiplier).toBeCloseTo(1.5 ** 2); // 2.25
  });

  it("three modifiers scale XP to 1.5^3", () => {
    const m = combineMultipliers(["armored", "swift", "berserker"]);
    expect(m.xpMultiplier).toBeCloseTo(1.5 ** 3);
  });

  it("armored + swift stacks speed: 0.8 * 1.5 = 1.2", () => {
    const m = combineMultipliers(["armored", "swift"]);
    expect(m.speedMultiplier).toBeCloseTo(0.8 * 1.5);
  });
});

// ── createEliteConfig ──────────────────────────────────────────

describe("createEliteConfig", () => {
  it("creates config with no modifiers", () => {
    const config = createEliteConfig([]);
    expect(config.modifiers).toEqual([]);
    expect(config.hpMultiplier).toBe(1);
    expect(config.xpMultiplier).toBe(1);
  });

  it("creates config with one modifier", () => {
    const config = createEliteConfig(["armored"]);
    expect(config.modifiers).toEqual(["armored"]);
    expect(config.sizeMultiplier).toBe(1.3);
    expect(config.speedMultiplier).toBe(0.8);
  });

  it("deduplicates modifiers", () => {
    const config = createEliteConfig(["swift", "swift", "swift"]);
    expect(config.modifiers).toEqual(["swift"]);
    expect(config.speedMultiplier).toBe(1.5);
  });

  it("config is immutable (readonly modifiers array)", () => {
    const config = createEliteConfig(["armored"]);
    // TypeScript enforces readonly, runtime check that it's a proper array
    expect(Array.isArray(config.modifiers)).toBe(true);
  });
});

// ── isElite ────────────────────────────────────────────────────

describe("isElite", () => {
  it("returns false for no modifiers", () => {
    expect(isElite(createEliteConfig([]))).toBe(false);
  });

  it("returns true for one modifier", () => {
    expect(isElite(createEliteConfig(["swift"]))).toBe(true);
  });

  it("returns true for multiple modifiers", () => {
    expect(isElite(createEliteConfig(["swift", "armored"]))).toBe(true);
  });
});

// ── getEliteRank ───────────────────────────────────────────────

describe("getEliteRank", () => {
  it("0 modifiers → normal", () => {
    expect(getEliteRank(createEliteConfig([]))).toBe("normal");
  });

  it("1 modifier → elite", () => {
    expect(getEliteRank(createEliteConfig(["swift"]))).toBe("elite");
  });

  it("2 modifiers → elite", () => {
    expect(getEliteRank(createEliteConfig(["swift", "armored"]))).toBe("elite");
  });

  it("3 modifiers → champion", () => {
    expect(
      getEliteRank(createEliteConfig(["swift", "armored", "berserker"])),
    ).toBe("champion");
  });

  it("4+ modifiers → champion", () => {
    expect(
      getEliteRank(
        createEliteConfig(["swift", "armored", "berserker", "vampiric"]),
      ),
    ).toBe("champion");
  });
});

// ── rollEliteModifiers ─────────────────────────────────────────

describe("rollEliteModifiers", () => {
  it("wave 1 returns empty", () => {
    expect(rollEliteModifiers(1, 42)).toEqual([]);
  });

  it("wave 2 returns empty", () => {
    expect(rollEliteModifiers(2, 999)).toEqual([]);
  });

  it("wave 3 returns empty", () => {
    expect(rollEliteModifiers(3, 0)).toEqual([]);
  });

  it("is deterministic for same wave + seed", () => {
    const a = rollEliteModifiers(10, 42);
    const b = rollEliteModifiers(10, 42);
    expect(a).toEqual(b);
  });

  it("wave 4-6: max 1 modifier when elite spawns", () => {
    // Try many seeds to find one that produces an elite
    for (let seed = 0; seed < 10000; seed++) {
      const mods = rollEliteModifiers(5, seed);
      if (mods.length > 0) {
        expect(mods.length).toBeLessThanOrEqual(1);
        return;
      }
    }
    // 5% chance per seed, statistically guaranteed to find one in 10000 tries
  });

  it("wave 7-9: max 2 modifiers when elite spawns", () => {
    for (let seed = 0; seed < 10000; seed++) {
      const mods = rollEliteModifiers(8, seed);
      if (mods.length > 0) {
        expect(mods.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("wave 10+: max 3 modifiers", () => {
    for (let seed = 0; seed < 10000; seed++) {
      const mods = rollEliteModifiers(15, seed);
      expect(mods.length).toBeLessThanOrEqual(3);
    }
  });

  it("produces no duplicate modifiers", () => {
    for (let seed = 0; seed < 1000; seed++) {
      const mods = rollEliteModifiers(12, seed);
      const unique = new Set(mods);
      expect(unique.size).toBe(mods.length);
    }
  });

  it("all returned modifiers are valid EliteModifier values", () => {
    const valid: EliteModifier[] = [
      "armored",
      "swift",
      "berserker",
      "shielded",
      "vampiric",
      "splitting",
      "teleporting",
      "explosive",
    ];
    for (let seed = 0; seed < 500; seed++) {
      const mods = rollEliteModifiers(10, seed);
      for (const m of mods) {
        expect(valid).toContain(m);
      }
    }
  });

  it("higher waves produce elites more frequently", () => {
    let eliteCountWave5 = 0;
    let eliteCountWave15 = 0;
    const trials = 5000;

    for (let seed = 0; seed < trials; seed++) {
      if (rollEliteModifiers(5, seed).length > 0) eliteCountWave5++;
      if (rollEliteModifiers(15, seed).length > 0) eliteCountWave15++;
    }

    expect(eliteCountWave15).toBeGreaterThan(eliteCountWave5);
  });
});

// ── applyDamageReduction ───────────────────────────────────────

describe("applyDamageReduction", () => {
  it("no armor: full damage", () => {
    const config = createEliteConfig(["swift"]);
    expect(applyDamageReduction(config, 100)).toBe(100);
  });

  it("armored: 50% damage reduction", () => {
    const config = createEliteConfig(["armored"]);
    expect(applyDamageReduction(config, 100)).toBe(50);
  });

  it("armored: works with fractional damage", () => {
    const config = createEliteConfig(["armored"]);
    expect(applyDamageReduction(config, 33)).toBe(16.5);
  });

  it("armored + other mods: still reduces by 50%", () => {
    const config = createEliteConfig(["armored", "swift", "berserker"]);
    expect(applyDamageReduction(config, 200)).toBe(100);
  });

  it("zero damage stays zero", () => {
    const config = createEliteConfig(["armored"]);
    expect(applyDamageReduction(config, 0)).toBe(0);
  });
});

// ── shouldSplit ────────────────────────────────────────────────

describe("shouldSplit", () => {
  it("returns false without splitting modifier", () => {
    expect(shouldSplit(createEliteConfig([]))).toBe(false);
    expect(shouldSplit(createEliteConfig(["armored"]))).toBe(false);
  });

  it("returns true with splitting modifier", () => {
    expect(shouldSplit(createEliteConfig(["splitting"]))).toBe(true);
  });

  it("returns true with splitting + other modifiers", () => {
    expect(shouldSplit(createEliteConfig(["splitting", "armored"]))).toBe(true);
  });
});

// ── getSplitConfig ─────────────────────────────────────────────

describe("getSplitConfig", () => {
  it("removes splitting modifier from result", () => {
    const config = createEliteConfig(["splitting", "armored"]);
    const split = getSplitConfig(config);
    expect(split.modifiers).not.toContain("splitting");
    expect(split.modifiers).toContain("armored");
  });

  it("HP multiplier is 30% of recalculated base", () => {
    const config = createEliteConfig(["splitting"]);
    const split = getSplitConfig(config);
    // Without splitting, base HP = 1, so split HP = 0.3
    expect(split.hpMultiplier).toBeCloseTo(0.3);
  });

  it("split copies are smaller (0.7x size)", () => {
    const config = createEliteConfig(["splitting"]);
    const split = getSplitConfig(config);
    expect(split.sizeMultiplier).toBeCloseTo(0.7);
  });

  it("split copies have reduced XP", () => {
    const config = createEliteConfig(["splitting"]);
    const split = getSplitConfig(config);
    // No modifiers left → xpMultiplier = 1, * 0.3 = 0.3
    expect(split.xpMultiplier).toBeCloseTo(0.3);
  });

  it("preserves other modifier effects after split", () => {
    const config = createEliteConfig(["splitting", "swift"]);
    const split = getSplitConfig(config);
    expect(split.speedMultiplier).toBe(1.5);
    expect(split.hpMultiplier).toBeCloseTo(0.8 * 0.3); // swift 0.8 * split 0.3
  });
});

// ── getDeathEffect ─────────────────────────────────────────────

describe("getDeathEffect", () => {
  it("no special modifiers → none", () => {
    expect(getDeathEffect(createEliteConfig([]))).toBe("none");
    expect(getDeathEffect(createEliteConfig(["swift"]))).toBe("none");
  });

  it("splitting only → split", () => {
    expect(getDeathEffect(createEliteConfig(["splitting"]))).toBe("split");
  });

  it("explosive only → explode", () => {
    expect(getDeathEffect(createEliteConfig(["explosive"]))).toBe("explode");
  });

  it("splitting + explosive → both", () => {
    expect(getDeathEffect(createEliteConfig(["splitting", "explosive"]))).toBe(
      "both",
    );
  });

  it("splitting + explosive + others → both", () => {
    expect(
      getDeathEffect(createEliteConfig(["splitting", "explosive", "armored"])),
    ).toBe("both");
  });
});

// ── getXpReward ────────────────────────────────────────────────

describe("getXpReward", () => {
  it("normal enemy: base XP unchanged", () => {
    const config = createEliteConfig([]);
    expect(getXpReward(100, config)).toBe(100);
  });

  it("1-mod elite: 1.5x XP", () => {
    const config = createEliteConfig(["swift"]);
    expect(getXpReward(100, config)).toBeCloseTo(150);
  });

  it("2-mod elite: 2.25x XP", () => {
    const config = createEliteConfig(["swift", "armored"]);
    expect(getXpReward(100, config)).toBeCloseTo(225);
  });

  it("3-mod champion: 3.375x XP", () => {
    const config = createEliteConfig(["swift", "armored", "berserker"]);
    expect(getXpReward(100, config)).toBeCloseTo(337.5);
  });

  it("zero base XP returns zero", () => {
    const config = createEliteConfig(["swift", "armored"]);
    expect(getXpReward(0, config)).toBe(0);
  });
});

// ── Integration / Edge Cases ───────────────────────────────────

describe("integration", () => {
  it("full flow: roll → create → check → reward", () => {
    // Use a seed known to produce an elite on wave 10+
    let foundElite = false;
    for (let seed = 0; seed < 1000; seed++) {
      const mods = rollEliteModifiers(12, seed);
      if (mods.length > 0) {
        const config = createEliteConfig(mods);
        expect(isElite(config)).toBe(true);
        const rank = getEliteRank(config);
        expect(["elite", "champion"]).toContain(rank);
        const xp = getXpReward(50, config);
        expect(xp).toBeGreaterThan(50);
        foundElite = true;
        break;
      }
    }
    expect(foundElite).toBe(true);
  });

  it("splitting elite full lifecycle", () => {
    const config = createEliteConfig(["splitting", "armored"]);
    expect(shouldSplit(config)).toBe(true);
    expect(getDeathEffect(config)).toBe("split");

    const splitCfg = getSplitConfig(config);
    expect(shouldSplit(splitCfg)).toBe(false);
    expect(splitCfg.modifiers).toEqual(["armored"]);
    // Split copies still have armor damage reduction
    expect(applyDamageReduction(splitCfg, 100)).toBe(50);
  });

  it("explosive + splitting: both death effects, split copies still explode", () => {
    const config = createEliteConfig(["splitting", "explosive", "swift"]);
    expect(getDeathEffect(config)).toBe("both");

    const splitCfg = getSplitConfig(config);
    // Split copies keep explosive but lose splitting
    expect(getDeathEffect(splitCfg)).toBe("explode");
    expect(splitCfg.speedMultiplier).toBe(1.5);
  });
});
