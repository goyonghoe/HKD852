import { describe, it, expect } from "vitest";
import {
  getTargetsInCircle,
  getTargetsInCone,
  getTargetsInLine,
  calculateNovaDamage,
  calculateSplashDamage,
  chainLightning,
  chainLightningDamage,
  resolveAoe,
  getAoeArea,
  isPointInAoe,
  type Target,
  type AoeConfig,
} from "../../src/core/AreaEffectCalc";

// ─── Helpers ─────────────────────────────────────────────────────

function mkTarget(id: string, x: number, y: number): Target {
  return { id, x, y };
}

const SQRT2 = Math.sqrt(2);

// ─── getTargetsInCircle ──────────────────────────────────────────

describe("getTargetsInCircle", () => {
  const targets: Target[] = [
    mkTarget("a", 0, 0),
    mkTarget("b", 3, 4), // dist 5
    mkTarget("c", 10, 10), // dist ~14.14
    mkTarget("d", 5, 0), // dist 5
  ];

  it("returns targets within radius", () => {
    const hits = getTargetsInCircle(targets, 0, 0, 5);
    const ids = hits.map((t) => t.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toContain("d");
    expect(ids).not.toContain("c");
  });

  it("includes targets exactly on the boundary", () => {
    const hits = getTargetsInCircle(targets, 0, 0, 5);
    expect(hits.map((t) => t.id)).toContain("b"); // dist = exactly 5
  });

  it("returns empty for zero radius", () => {
    // only origin target should match
    const hits = getTargetsInCircle(targets, 0, 0, 0);
    expect(hits.map((t) => t.id)).toEqual(["a"]);
  });

  it("returns all for huge radius", () => {
    const hits = getTargetsInCircle(targets, 0, 0, 1000);
    expect(hits).toHaveLength(4);
  });

  it("returns empty array for no targets", () => {
    expect(getTargetsInCircle([], 0, 0, 100)).toEqual([]);
  });

  it("works with non-origin centre", () => {
    const hits = getTargetsInCircle(targets, 10, 10, 1);
    expect(hits.map((t) => t.id)).toEqual(["c"]);
  });
});

// ─── getTargetsInCone ────────────────────────────────────────────

describe("getTargetsInCone", () => {
  it("hits target directly ahead", () => {
    const targets = [mkTarget("a", 5, 0)];
    const hits = getTargetsInCone(targets, 0, 0, 0, Math.PI / 2, 10);
    expect(hits).toHaveLength(1);
  });

  it("misses target behind", () => {
    const targets = [mkTarget("a", -5, 0)];
    const hits = getTargetsInCone(targets, 0, 0, 0, Math.PI / 2, 10);
    expect(hits).toHaveLength(0);
  });

  it("misses target outside range", () => {
    const targets = [mkTarget("a", 15, 0)];
    const hits = getTargetsInCone(targets, 0, 0, 0, Math.PI, 10);
    expect(hits).toHaveLength(0);
  });

  it("respects cone angle boundary", () => {
    // 90-degree cone aimed right: covers +-45 degrees
    const inside = mkTarget("in", 5, 4); // atan2(4,5) ≈ 0.674 < PI/4 ≈ 0.785
    const outside = mkTarget("out", 1, 5); // atan2(5,1) ≈ 1.37 > PI/4
    const hits = getTargetsInCone([inside, outside], 0, 0, 0, Math.PI / 2, 10);
    expect(hits.map((t) => t.id)).toContain("in");
    expect(hits.map((t) => t.id)).not.toContain("out");
  });

  it("handles downward-facing cone", () => {
    const targets = [mkTarget("a", 0, 5)];
    const hits = getTargetsInCone(targets, 0, 0, Math.PI / 2, Math.PI / 4, 10);
    expect(hits).toHaveLength(1);
  });

  it("full circle cone hits everything in range", () => {
    const targets = [
      mkTarget("a", 3, 0),
      mkTarget("b", -3, 0),
      mkTarget("c", 0, 3),
    ];
    const hits = getTargetsInCone(targets, 0, 0, 0, Math.PI * 2, 5);
    expect(hits).toHaveLength(3);
  });
});

// ─── getTargetsInLine ────────────────────────────────────────────

describe("getTargetsInLine", () => {
  it("hits target on the line axis", () => {
    const targets = [mkTarget("a", 5, 0)];
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(1);
  });

  it("hits target within line width", () => {
    const targets = [mkTarget("a", 5, 0.5)];
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(1);
  });

  it("misses target beyond line width", () => {
    const targets = [mkTarget("a", 5, 5)];
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(0);
  });

  it("misses target beyond line length", () => {
    const targets = [mkTarget("a", 15, 0)];
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(0);
  });

  it("misses target behind origin", () => {
    const targets = [mkTarget("a", -5, 0)];
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(0);
  });

  it("works with angled line (45 degrees)", () => {
    // Line aimed at 45 degrees, length 10, width 2
    const t = mkTarget("a", 3, 3); // on the 45-degree axis
    const hits = getTargetsInLine([t], 0, 0, Math.PI / 4, 2, 10);
    expect(hits).toHaveLength(1);
  });

  it("includes targets exactly at the boundary", () => {
    const targets = [mkTarget("a", 10, 0)]; // exactly at length
    const hits = getTargetsInLine(targets, 0, 0, 0, 2, 10);
    expect(hits).toHaveLength(1);
  });
});

// ─── calculateNovaDamage ─────────────────────────────────────────

describe("calculateNovaDamage", () => {
  it("full damage at centre", () => {
    expect(calculateNovaDamage(100, 0, 50)).toBe(100);
  });

  it("25% damage at edge", () => {
    expect(calculateNovaDamage(100, 50, 50)).toBe(25);
  });

  it("linear interpolation at midpoint", () => {
    expect(calculateNovaDamage(100, 25, 50)).toBe(62.5);
  });

  it("zero beyond max radius", () => {
    expect(calculateNovaDamage(100, 60, 50)).toBe(0);
  });

  it("zero for negative distance", () => {
    expect(calculateNovaDamage(100, -5, 50)).toBe(0);
  });

  it("zero for zero max radius", () => {
    expect(calculateNovaDamage(100, 0, 0)).toBe(0);
  });
});

// ─── calculateSplashDamage ───────────────────────────────────────

describe("calculateSplashDamage", () => {
  it("full damage at centre", () => {
    expect(calculateSplashDamage(100, 0, 50)).toBe(100);
  });

  it("zero at edge", () => {
    expect(calculateSplashDamage(100, 50, 50)).toBe(0);
  });

  it("half damage at half radius", () => {
    expect(calculateSplashDamage(100, 25, 50)).toBe(50);
  });

  it("zero beyond radius", () => {
    expect(calculateSplashDamage(100, 60, 50)).toBe(0);
  });

  it("zero for negative distance", () => {
    expect(calculateSplashDamage(100, -1, 50)).toBe(0);
  });

  it("zero for zero splash radius", () => {
    expect(calculateSplashDamage(100, 0, 0)).toBe(0);
  });
});

// ─── chainLightning ──────────────────────────────────────────────

describe("chainLightning", () => {
  const targets: Target[] = [
    mkTarget("a", 0, 0),
    mkTarget("b", 3, 0), // 3 from a
    mkTarget("c", 6, 0), // 3 from b
    mkTarget("d", 100, 100), // far away
  ];

  it("chains through nearby targets", () => {
    const chain = chainLightning(targets, "a", 5, 3);
    expect(chain).toEqual(["a", "b", "c"]);
  });

  it("respects max chains limit", () => {
    const chain = chainLightning(targets, "a", 5, 1);
    expect(chain).toEqual(["a", "b"]);
  });

  it("stops when no target in range", () => {
    const chain = chainLightning(targets, "c", 5, 5);
    // From c, nearest un-visited is b at dist 3, then a at dist 3 from b
    expect(chain).toEqual(["c", "b", "a"]);
  });

  it("returns only start if isolated", () => {
    const chain = chainLightning(targets, "d", 5, 3);
    expect(chain).toEqual(["d"]);
  });

  it("returns empty for unknown start ID", () => {
    const chain = chainLightning(targets, "z", 5, 3);
    expect(chain).toEqual([]);
  });

  it("includes start in chain", () => {
    const chain = chainLightning(targets, "a", 5, 0);
    expect(chain).toEqual(["a"]);
  });

  it("picks nearest neighbour at each hop", () => {
    const t = [
      mkTarget("s", 0, 0),
      mkTarget("far", 4, 0),
      mkTarget("near", 2, 0),
    ];
    const chain = chainLightning(t, "s", 5, 2);
    expect(chain[1]).toBe("near"); // nearest first
    expect(chain[2]).toBe("far");
  });
});

// ─── chainLightningDamage ────────────────────────────────────────

describe("chainLightningDamage", () => {
  it("full damage at index 0", () => {
    expect(chainLightningDamage(100, 0)).toBe(100);
  });

  it("70% at index 1 (default decay)", () => {
    expect(chainLightningDamage(100, 1)).toBeCloseTo(70);
  });

  it("49% at index 2 (default decay)", () => {
    expect(chainLightningDamage(100, 2)).toBeCloseTo(49);
  });

  it("custom decay rate", () => {
    expect(chainLightningDamage(100, 1, 0.5)).toBeCloseTo(50);
    expect(chainLightningDamage(100, 2, 0.5)).toBeCloseTo(25);
  });

  it("zero for negative index", () => {
    expect(chainLightningDamage(100, -1)).toBe(0);
  });
});

// ─── resolveAoe ──────────────────────────────────────────────────

describe("resolveAoe", () => {
  const targets: Target[] = [
    mkTarget("a", 1, 0),
    mkTarget("b", 3, 0),
    mkTarget("c", 50, 50),
  ];

  it("circle: uniform damage to all in range", () => {
    const config: AoeConfig = {
      type: "circle",
      originX: 0,
      originY: 0,
      radius: 5,
    };
    const result = resolveAoe(config, targets, 100);
    expect(result.hitTargets).toContain("a");
    expect(result.hitTargets).toContain("b");
    expect(result.hitTargets).not.toContain("c");
    expect(result.damagePerTarget.get("a")).toBe(100);
    expect(result.damagePerTarget.get("b")).toBe(100);
  });

  it("nova: damage falls off with distance", () => {
    const config: AoeConfig = {
      type: "nova",
      originX: 0,
      originY: 0,
      radius: 10,
    };
    const result = resolveAoe(config, targets, 100);
    expect(result.hitTargets).toContain("a");
    expect(result.hitTargets).toContain("b");
    const dmgA = result.damagePerTarget.get("a")!;
    const dmgB = result.damagePerTarget.get("b")!;
    expect(dmgA).toBeGreaterThan(dmgB); // a is closer
  });

  it("cone: only targets in cone direction", () => {
    const allTargets = [mkTarget("front", 5, 0), mkTarget("back", -5, 0)];
    const config: AoeConfig = {
      type: "cone",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      coneAngle: Math.PI / 2,
    };
    const result = resolveAoe(config, allTargets, 100);
    expect(result.hitTargets).toContain("front");
    expect(result.hitTargets).not.toContain("back");
  });

  it("line: hits targets along line", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      lineWidth: 2,
      lineLength: 5,
    };
    const result = resolveAoe(config, targets, 80);
    expect(result.hitTargets).toContain("a");
    expect(result.hitTargets).toContain("b");
    expect(result.damagePerTarget.get("a")).toBe(80);
  });

  it("chain_lightning: chains with decay", () => {
    const chainTargets = [
      mkTarget("x", 1, 0),
      mkTarget("y", 3, 0),
      mkTarget("z", 5, 0),
    ];
    const config: AoeConfig = {
      type: "chain_lightning",
      originX: 0,
      originY: 0,
      radius: 10,
      chainRange: 5,
      maxChainTargets: 3,
    };
    const result = resolveAoe(config, chainTargets, 100);
    expect(result.hitTargets.length).toBeGreaterThanOrEqual(2);
    // First target gets full damage
    const first = result.hitTargets[0];
    expect(result.damagePerTarget.get(first)).toBe(100);
    // Second gets decayed
    if (result.hitTargets.length > 1) {
      const second = result.hitTargets[1];
      expect(result.damagePerTarget.get(second)!).toBeCloseTo(70);
    }
  });

  it("chain_lightning: no targets in range returns empty", () => {
    const config: AoeConfig = {
      type: "chain_lightning",
      originX: 0,
      originY: 0,
      radius: 1,
      chainRange: 1,
      maxChainTargets: 3,
    };
    const result = resolveAoe(config, [mkTarget("far", 100, 100)], 100);
    expect(result.hitTargets).toHaveLength(0);
  });
});

// ─── getAoeArea ──────────────────────────────────────────────────

describe("getAoeArea", () => {
  it("circle area = PI * r^2", () => {
    const config: AoeConfig = {
      type: "circle",
      originX: 0,
      originY: 0,
      radius: 10,
    };
    expect(getAoeArea(config)).toBeCloseTo(Math.PI * 100);
  });

  it("cone area = sector", () => {
    const config: AoeConfig = {
      type: "cone",
      originX: 0,
      originY: 0,
      radius: 10,
      coneAngle: Math.PI / 2,
    };
    // (PI/2 / 2) * 100 = PI/4 * 100
    expect(getAoeArea(config)).toBeCloseTo((Math.PI / 4) * 100);
  });

  it("line area = width * length", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 10,
      lineWidth: 4,
      lineLength: 20,
    };
    expect(getAoeArea(config)).toBe(80);
  });

  it("nova uses circle area", () => {
    const config: AoeConfig = {
      type: "nova",
      originX: 0,
      originY: 0,
      radius: 5,
    };
    expect(getAoeArea(config)).toBeCloseTo(Math.PI * 25);
  });

  it("line defaults length to radius", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 15,
      lineWidth: 3,
    };
    expect(getAoeArea(config)).toBe(45); // 3 * 15
  });
});

// ─── isPointInAoe ────────────────────────────────────────────────

describe("isPointInAoe", () => {
  it("circle: inside", () => {
    const config: AoeConfig = {
      type: "circle",
      originX: 0,
      originY: 0,
      radius: 10,
    };
    expect(isPointInAoe(config, 3, 4)).toBe(true);
  });

  it("circle: outside", () => {
    const config: AoeConfig = {
      type: "circle",
      originX: 0,
      originY: 0,
      radius: 5,
    };
    expect(isPointInAoe(config, 10, 10)).toBe(false);
  });

  it("circle: on boundary", () => {
    const config: AoeConfig = {
      type: "circle",
      originX: 0,
      originY: 0,
      radius: 5,
    };
    expect(isPointInAoe(config, 3, 4)).toBe(true); // dist = 5
  });

  it("cone: inside", () => {
    const config: AoeConfig = {
      type: "cone",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      coneAngle: Math.PI / 2,
    };
    expect(isPointInAoe(config, 5, 1)).toBe(true);
  });

  it("cone: outside angle", () => {
    const config: AoeConfig = {
      type: "cone",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      coneAngle: Math.PI / 4,
    };
    expect(isPointInAoe(config, 1, 5)).toBe(false);
  });

  it("cone: outside range", () => {
    const config: AoeConfig = {
      type: "cone",
      originX: 0,
      originY: 0,
      radius: 5,
      angle: 0,
      coneAngle: Math.PI,
    };
    expect(isPointInAoe(config, 10, 0)).toBe(false);
  });

  it("line: inside", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      lineWidth: 4,
      lineLength: 10,
    };
    expect(isPointInAoe(config, 5, 1)).toBe(true);
  });

  it("line: outside width", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      lineWidth: 2,
      lineLength: 10,
    };
    expect(isPointInAoe(config, 5, 5)).toBe(false);
  });

  it("line: behind origin", () => {
    const config: AoeConfig = {
      type: "line",
      originX: 0,
      originY: 0,
      radius: 10,
      angle: 0,
      lineWidth: 4,
      lineLength: 10,
    };
    expect(isPointInAoe(config, -3, 0)).toBe(false);
  });

  it("nova: same as circle containment", () => {
    const config: AoeConfig = {
      type: "nova",
      originX: 5,
      originY: 5,
      radius: 3,
    };
    expect(isPointInAoe(config, 6, 6)).toBe(true);
    expect(isPointInAoe(config, 20, 20)).toBe(false);
  });
});
