import { describe, it, expect } from "vitest";
import {
  createChainConfig,
  calculateChain,
  getDamageAtBounce,
  findNearestEnemy,
  getTotalChainDamage,
  getMaxPossibleBounces,
  canChainTo,
  getChainEfficiency,
} from "../../src/core/ChainLightningCalc";

// ─── Helpers ─────────────────────────────────────────────────────

function enemy(id: string, x: number, y: number) {
  return { id, x, y };
}

// ─── createChainConfig ──────────────────────────────────────────

describe("createChainConfig", () => {
  it("returns defaults when no overrides", () => {
    const cfg = createChainConfig();
    expect(cfg.maxBounces).toBe(5);
    expect(cfg.bounceRange).toBe(150);
    expect(cfg.damageDecay).toBe(0.7);
    expect(cfg.baseDamage).toBe(25);
  });

  it("applies partial overrides", () => {
    const cfg = createChainConfig({ maxBounces: 3 });
    expect(cfg.maxBounces).toBe(3);
    expect(cfg.bounceRange).toBe(150);
  });

  it("overrides all fields", () => {
    const cfg = createChainConfig({
      maxBounces: 10,
      bounceRange: 300,
      damageDecay: 0.5,
      baseDamage: 100,
    });
    expect(cfg.maxBounces).toBe(10);
    expect(cfg.bounceRange).toBe(300);
    expect(cfg.damageDecay).toBe(0.5);
    expect(cfg.baseDamage).toBe(100);
  });

  it("accepts zero values", () => {
    const cfg = createChainConfig({ maxBounces: 0, baseDamage: 0 });
    expect(cfg.maxBounces).toBe(0);
    expect(cfg.baseDamage).toBe(0);
  });

  it("accepts damageDecay of 1 (no decay)", () => {
    const cfg = createChainConfig({ damageDecay: 1 });
    expect(cfg.damageDecay).toBe(1);
  });
});

// ─── getDamageAtBounce ──────────────────────────────────────────

describe("getDamageAtBounce", () => {
  it("bounce 0 returns full baseDamage", () => {
    expect(getDamageAtBounce(100, 0, 0.7)).toBe(100);
  });

  it("bounce 1 applies one decay", () => {
    expect(getDamageAtBounce(100, 1, 0.7)).toBeCloseTo(70);
  });

  it("bounce 2 applies two decays", () => {
    expect(getDamageAtBounce(100, 2, 0.7)).toBeCloseTo(49);
  });

  it("bounce 3 applies three decays", () => {
    expect(getDamageAtBounce(100, 3, 0.5)).toBeCloseTo(12.5);
  });

  it("damageDecay 1 means no reduction", () => {
    expect(getDamageAtBounce(50, 5, 1)).toBe(50);
  });

  it("damageDecay 0 means zero after first bounce", () => {
    expect(getDamageAtBounce(50, 0, 0)).toBe(50);
    expect(getDamageAtBounce(50, 1, 0)).toBe(0);
  });

  it("handles baseDamage 0", () => {
    expect(getDamageAtBounce(0, 3, 0.8)).toBe(0);
  });
});

// ─── findNearestEnemy ───────────────────────────────────────────

describe("findNearestEnemy", () => {
  it("returns null for empty array", () => {
    expect(findNearestEnemy(0, 0, [], new Set(), 100)).toBeNull();
  });

  it("finds closest enemy", () => {
    const enemies = [enemy("a", 10, 0), enemy("b", 5, 0)];
    const result = findNearestEnemy(0, 0, enemies, new Set(), Infinity);
    expect(result?.id).toBe("b");
  });

  it("excludes enemies in excludeIds", () => {
    const enemies = [enemy("a", 5, 0), enemy("b", 10, 0)];
    const result = findNearestEnemy(0, 0, enemies, new Set(["a"]), Infinity);
    expect(result?.id).toBe("b");
  });

  it("returns null if all excluded", () => {
    const enemies = [enemy("a", 5, 0)];
    expect(
      findNearestEnemy(0, 0, enemies, new Set(["a"]), Infinity),
    ).toBeNull();
  });

  it("respects maxRange", () => {
    const enemies = [enemy("a", 200, 0)];
    expect(findNearestEnemy(0, 0, enemies, new Set(), 100)).toBeNull();
  });

  it("includes enemy exactly at maxRange", () => {
    const enemies = [enemy("a", 100, 0)];
    const result = findNearestEnemy(0, 0, enemies, new Set(), 100);
    expect(result?.id).toBe("a");
  });

  it("considers 2D distance not just x", () => {
    const enemies = [enemy("a", 3, 4)]; // distance = 5
    expect(findNearestEnemy(0, 0, enemies, new Set(), 5)?.id).toBe("a");
    expect(findNearestEnemy(0, 0, enemies, new Set(), 4)).toBeNull();
  });

  it("picks nearest among multiple in range", () => {
    const enemies = [enemy("a", 100, 0), enemy("b", 50, 0), enemy("c", 75, 0)];
    const result = findNearestEnemy(0, 0, enemies, new Set(), 200);
    expect(result?.id).toBe("b");
  });
});

// ─── canChainTo ─────────────────────────────────────────────────

describe("canChainTo", () => {
  it("returns true within range", () => {
    expect(canChainTo(0, 0, 50, 0, 100)).toBe(true);
  });

  it("returns true exactly at range", () => {
    expect(canChainTo(0, 0, 100, 0, 100)).toBe(true);
  });

  it("returns false beyond range", () => {
    expect(canChainTo(0, 0, 101, 0, 100)).toBe(false);
  });

  it("handles diagonal distance", () => {
    // 3-4-5 triangle
    expect(canChainTo(0, 0, 3, 4, 5)).toBe(true);
    expect(canChainTo(0, 0, 3, 4, 4)).toBe(false);
  });

  it("works with non-origin positions", () => {
    expect(canChainTo(100, 100, 150, 100, 50)).toBe(true);
    expect(canChainTo(100, 100, 200, 100, 50)).toBe(false);
  });

  it("returns true for same position", () => {
    expect(canChainTo(50, 50, 50, 50, 0)).toBe(true);
  });
});

// ─── getTotalChainDamage ────────────────────────────────────────

describe("getTotalChainDamage", () => {
  it("returns 0 for 0 bounces", () => {
    expect(getTotalChainDamage(100, 0, 0.7)).toBe(0);
  });

  it("1 bounce = baseDamage", () => {
    expect(getTotalChainDamage(100, 1, 0.7)).toBeCloseTo(100);
  });

  it("2 bounces with 0.5 decay = 100 + 50 = 150", () => {
    expect(getTotalChainDamage(100, 2, 0.5)).toBeCloseTo(150);
  });

  it("3 bounces with 0.7 decay = geometric sum", () => {
    const expected = 100 + 70 + 49;
    expect(getTotalChainDamage(100, 3, 0.7)).toBeCloseTo(expected);
  });

  it("damageDecay 1 = baseDamage * bounces", () => {
    expect(getTotalChainDamage(25, 5, 1)).toBeCloseTo(125);
  });

  it("matches manual sum for 5 bounces", () => {
    const base = 25;
    const decay = 0.7;
    let manual = 0;
    for (let i = 0; i < 5; i++) manual += base * Math.pow(decay, i);
    expect(getTotalChainDamage(base, 5, decay)).toBeCloseTo(manual);
  });

  it("handles baseDamage 0", () => {
    expect(getTotalChainDamage(0, 5, 0.7)).toBe(0);
  });

  it("negative bounces returns 0", () => {
    expect(getTotalChainDamage(100, -1, 0.7)).toBe(0);
  });
});

// ─── getMaxPossibleBounces ──────────────────────────────────────

describe("getMaxPossibleBounces", () => {
  it("returns 0 for no enemies", () => {
    const cfg = createChainConfig();
    expect(getMaxPossibleBounces([], cfg)).toBe(0);
  });

  it("returns enemy count when fewer than maxBounces", () => {
    const cfg = createChainConfig({ maxBounces: 5 });
    const enemies = [enemy("a", 0, 0), enemy("b", 10, 0)];
    expect(getMaxPossibleBounces(enemies, cfg)).toBe(2);
  });

  it("returns maxBounces when more enemies", () => {
    const cfg = createChainConfig({ maxBounces: 2 });
    const enemies = [enemy("a", 0, 0), enemy("b", 10, 0), enemy("c", 20, 0)];
    expect(getMaxPossibleBounces(enemies, cfg)).toBe(2);
  });

  it("returns equal value when enemies === maxBounces", () => {
    const cfg = createChainConfig({ maxBounces: 3 });
    const enemies = [enemy("a", 0, 0), enemy("b", 10, 0), enemy("c", 20, 0)];
    expect(getMaxPossibleBounces(enemies, cfg)).toBe(3);
  });
});

// ─── getChainEfficiency ─────────────────────────────────────────

describe("getChainEfficiency", () => {
  it("returns 1 when all bounces used", () => {
    const cfg = createChainConfig({ maxBounces: 3 });
    const result = { targets: [], totalDamage: 0, bouncesUsed: 3 };
    expect(getChainEfficiency(result, cfg)).toBeCloseTo(1);
  });

  it("returns 0 when no bounces used", () => {
    const cfg = createChainConfig({ maxBounces: 5 });
    const result = { targets: [], totalDamage: 0, bouncesUsed: 0 };
    expect(getChainEfficiency(result, cfg)).toBe(0);
  });

  it("returns fraction for partial use", () => {
    const cfg = createChainConfig({ maxBounces: 4 });
    const result = { targets: [], totalDamage: 0, bouncesUsed: 2 };
    expect(getChainEfficiency(result, cfg)).toBeCloseTo(0.5);
  });

  it("returns 0 when maxBounces is 0", () => {
    const cfg = createChainConfig({ maxBounces: 0 });
    const result = { targets: [], totalDamage: 0, bouncesUsed: 0 };
    expect(getChainEfficiency(result, cfg)).toBe(0);
  });
});

// ─── calculateChain ─────────────────────────────────────────────

describe("calculateChain", () => {
  it("returns empty for no enemies", () => {
    const cfg = createChainConfig();
    const result = calculateChain(0, 0, [], cfg);
    expect(result.targets).toHaveLength(0);
    expect(result.totalDamage).toBe(0);
    expect(result.bouncesUsed).toBe(0);
  });

  it("hits single enemy", () => {
    const cfg = createChainConfig({ maxBounces: 5 });
    const enemies = [enemy("a", 10, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("a");
    expect(result.targets[0].bounceIndex).toBe(0);
    expect(result.targets[0].damage).toBe(cfg.baseDamage);
    expect(result.bouncesUsed).toBe(1);
  });

  it("chains through multiple enemies in range", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 100 });
    const enemies = [enemy("a", 50, 0), enemy("b", 100, 0), enemy("c", 150, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(3);
    expect(result.targets[0].id).toBe("a");
    expect(result.targets[1].id).toBe("b");
    expect(result.targets[2].id).toBe("c");
  });

  it("stops when no enemy in bounce range", () => {
    const cfg = createChainConfig({ maxBounces: 5, bounceRange: 30 });
    const enemies = [enemy("a", 10, 0), enemy("b", 200, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("a");
  });

  it("applies damage decay correctly", () => {
    const cfg = createChainConfig({
      maxBounces: 3,
      bounceRange: 200,
      damageDecay: 0.5,
      baseDamage: 100,
    });
    const enemies = [enemy("a", 50, 0), enemy("b", 100, 0), enemy("c", 150, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets[0].damage).toBeCloseTo(100);
    expect(result.targets[1].damage).toBeCloseTo(50);
    expect(result.targets[2].damage).toBeCloseTo(25);
  });

  it("totalDamage matches sum of target damages", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 200 });
    const enemies = [enemy("a", 50, 0), enemy("b", 100, 0), enemy("c", 150, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    const summed = result.targets.reduce((s, t) => s + t.damage, 0);
    expect(result.totalDamage).toBeCloseTo(summed);
  });

  it("never visits same enemy twice", () => {
    const cfg = createChainConfig({ maxBounces: 5, bounceRange: 200 });
    const enemies = [enemy("a", 10, 0), enemy("b", 20, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    const ids = result.targets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("bounceIndex is sequential starting from 0", () => {
    const cfg = createChainConfig({ maxBounces: 4, bounceRange: 200 });
    const enemies = [enemy("a", 10, 0), enemy("b", 20, 0), enemy("c", 30, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    result.targets.forEach((t, i) => {
      expect(t.bounceIndex).toBe(i);
    });
  });

  it("first target is closest to start position", () => {
    const cfg = createChainConfig({ maxBounces: 5, bounceRange: 300 });
    const enemies = [
      enemy("far", 200, 0),
      enemy("close", 10, 0),
      enemy("mid", 100, 0),
    ];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets[0].id).toBe("close");
  });

  it("maxBounces 0 returns empty", () => {
    const cfg = createChainConfig({ maxBounces: 0 });
    const enemies = [enemy("a", 10, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(0);
    expect(result.bouncesUsed).toBe(0);
  });

  it("handles enemies in 2D grid", () => {
    const cfg = createChainConfig({ maxBounces: 4, bounceRange: 80 });
    const enemies = [
      enemy("a", 50, 0),
      enemy("b", 50, 60),
      enemy("c", 120, 60),
      enemy("d", 120, 0),
    ];
    const result = calculateChain(0, 0, enemies, cfg);
    // first hit should be 'a' (closest to origin)
    expect(result.targets[0].id).toBe("a");
    expect(result.bouncesUsed).toBeGreaterThanOrEqual(2);
  });

  it("stores correct x/y in targets", () => {
    const cfg = createChainConfig({ maxBounces: 1, bounceRange: 200 });
    const enemies = [enemy("a", 42, 99)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets[0].x).toBe(42);
    expect(result.targets[0].y).toBe(99);
  });

  it("first bounce ignores bounceRange (searches all)", () => {
    const cfg = createChainConfig({ maxBounces: 2, bounceRange: 10 });
    // Enemy far away but should still be hit on first bounce
    const enemies = [enemy("a", 9999, 9999)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("a");
  });

  it("second bounce respects bounceRange", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 50 });
    const enemies = [
      enemy("a", 1000, 0), // first bounce (no range limit)
      enemy("b", 1020, 0), // within 50 of a
      enemy("c", 5000, 0), // way too far from b
    ];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.targets).toHaveLength(2);
    expect(result.targets[0].id).toBe("a");
    expect(result.targets[1].id).toBe("b");
  });

  it("handles large number of enemies", () => {
    const cfg = createChainConfig({ maxBounces: 10, bounceRange: 20 });
    const enemies = Array.from({ length: 50 }, (_, i) =>
      enemy(`e${i}`, i * 10, 0),
    );
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.bouncesUsed).toBe(10);
    expect(result.targets).toHaveLength(10);
  });

  it("efficiency is 1.0 when all bounces used", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 200 });
    const enemies = [enemy("a", 10, 0), enemy("b", 20, 0), enemy("c", 30, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(getChainEfficiency(result, cfg)).toBeCloseTo(1);
  });

  it("efficiency < 1 when chain broken early", () => {
    const cfg = createChainConfig({ maxBounces: 5, bounceRange: 30 });
    const enemies = [enemy("a", 10, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(getChainEfficiency(result, cfg)).toBeCloseTo(0.2);
  });
});

// ─── Integration / Edge Cases ───────────────────────────────────

describe("integration", () => {
  it("total damage from calculateChain matches getTotalChainDamage", () => {
    const cfg = createChainConfig({ maxBounces: 4, bounceRange: 200 });
    const enemies = [
      enemy("a", 10, 0),
      enemy("b", 20, 0),
      enemy("c", 30, 0),
      enemy("d", 40, 0),
    ];
    const result = calculateChain(0, 0, enemies, cfg);
    const formulaDamage = getTotalChainDamage(
      cfg.baseDamage,
      result.bouncesUsed,
      cfg.damageDecay,
    );
    expect(result.totalDamage).toBeCloseTo(formulaDamage);
  });

  it("getDamageAtBounce for each target matches target.damage", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 200 });
    const enemies = [enemy("a", 10, 0), enemy("b", 20, 0), enemy("c", 30, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    result.targets.forEach((t) => {
      expect(t.damage).toBeCloseTo(
        getDamageAtBounce(cfg.baseDamage, t.bounceIndex, cfg.damageDecay),
      );
    });
  });

  it("canChainTo confirms chain path validity", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 100 });
    const enemies = [enemy("a", 50, 0), enemy("b", 100, 0), enemy("c", 150, 0)];
    const result = calculateChain(0, 0, enemies, cfg);
    // Check consecutive targets are within range
    for (let i = 1; i < result.targets.length; i++) {
      const prev = result.targets[i - 1];
      const cur = result.targets[i];
      expect(canChainTo(prev.x, prev.y, cur.x, cur.y, cfg.bounceRange)).toBe(
        true,
      );
    }
  });

  it("bouncesUsed never exceeds getMaxPossibleBounces", () => {
    const cfg = createChainConfig({ maxBounces: 3, bounceRange: 200 });
    const enemies = [
      enemy("a", 10, 0),
      enemy("b", 20, 0),
      enemy("c", 30, 0),
      enemy("d", 40, 0),
      enemy("e", 50, 0),
    ];
    const result = calculateChain(0, 0, enemies, cfg);
    expect(result.bouncesUsed).toBeLessThanOrEqual(
      getMaxPossibleBounces(enemies, cfg),
    );
  });
});
