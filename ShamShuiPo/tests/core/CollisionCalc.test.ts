// ── Tests: CollisionCalc ──

import { describe, it, expect } from "vitest";
import {
  circleVsCircle,
  circleVsAABB,
  pointInCircle,
  distanceSquared,
  distance,
  normalize,
  findCollisions,
  findNearest,
  isOutOfBounds,
  clampToScreen,
  getAngle,
  reflect,
} from "../../src/core/CollisionCalc";

// ════════════════════════════════════════════════════════════════
// § distanceSquared
// ════════════════════════════════════════════════════════════════

describe("distanceSquared", () => {
  it("returns 0 for same point", () => {
    expect(distanceSquared(5, 5, 5, 5)).toBe(0);
  });

  it("returns correct squared distance", () => {
    expect(distanceSquared(0, 0, 3, 4)).toBe(25);
  });

  it("handles negative coordinates", () => {
    expect(distanceSquared(-1, -1, 2, 3)).toBe(25);
  });
});

// ════════════════════════════════════════════════════════════════
// § distance
// ════════════════════════════════════════════════════════════════

describe("distance", () => {
  it("returns 0 for same point", () => {
    expect(distance(0, 0, 0, 0)).toBe(0);
  });

  it("returns correct euclidean distance", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════
// § normalize
// ════════════════════════════════════════════════════════════════

describe("normalize", () => {
  it("returns (0,0) for zero vector", () => {
    const n = normalize(0, 0);
    expect(n.x).toBe(0);
    expect(n.y).toBe(0);
  });

  it("normalizes axis-aligned vector", () => {
    const n = normalize(10, 0);
    expect(n.x).toBeCloseTo(1);
    expect(n.y).toBeCloseTo(0);
  });

  it("normalizes diagonal vector to unit length", () => {
    const n = normalize(3, 4);
    const len = Math.sqrt(n.x * n.x + n.y * n.y);
    expect(len).toBeCloseTo(1);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  it("handles negative components", () => {
    const n = normalize(-5, 0);
    expect(n.x).toBeCloseTo(-1);
    expect(n.y).toBeCloseTo(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § circleVsCircle
// ════════════════════════════════════════════════════════════════

describe("circleVsCircle", () => {
  it("detects overlapping circles", () => {
    const a = { x: 0, y: 0, radius: 10 };
    const b = { x: 15, y: 0, radius: 10 };
    expect(circleVsCircle(a, b)).toBe(true);
  });

  it("detects non-overlapping circles", () => {
    const a = { x: 0, y: 0, radius: 5 };
    const b = { x: 20, y: 0, radius: 5 };
    expect(circleVsCircle(a, b)).toBe(false);
  });

  it("detects touching circles (edge case)", () => {
    const a = { x: 0, y: 0, radius: 5 };
    const b = { x: 10, y: 0, radius: 5 };
    expect(circleVsCircle(a, b)).toBe(true);
  });

  it("detects concentric circles", () => {
    const a = { x: 5, y: 5, radius: 10 };
    const b = { x: 5, y: 5, radius: 3 };
    expect(circleVsCircle(a, b)).toBe(true);
  });

  it("handles zero-radius circle", () => {
    const a = { x: 0, y: 0, radius: 0 };
    const b = { x: 0, y: 0, radius: 0 };
    expect(circleVsCircle(a, b)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § circleVsAABB
// ════════════════════════════════════════════════════════════════

describe("circleVsAABB", () => {
  const box = { x: 50, y: 50, halfW: 20, halfH: 15 };

  it("detects circle inside box", () => {
    const circle = { x: 50, y: 50, radius: 5 };
    expect(circleVsAABB(circle, box)).toBe(true);
  });

  it("detects circle overlapping box edge", () => {
    const circle = { x: 75, y: 50, radius: 10 };
    expect(circleVsAABB(circle, box)).toBe(true);
  });

  it("detects circle far from box", () => {
    const circle = { x: 200, y: 200, radius: 10 };
    expect(circleVsAABB(circle, box)).toBe(false);
  });

  it("detects circle touching box corner", () => {
    // Corner at (70, 65), circle at (80, 75) with radius = sqrt(200) ≈ 14.14
    const circle = { x: 80, y: 75, radius: Math.sqrt(200) };
    expect(circleVsAABB(circle, box)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § pointInCircle
// ════════════════════════════════════════════════════════════════

describe("pointInCircle", () => {
  const circle = { x: 10, y: 10, radius: 5 };

  it("detects point at center", () => {
    expect(pointInCircle(10, 10, circle)).toBe(true);
  });

  it("detects point on edge", () => {
    expect(pointInCircle(15, 10, circle)).toBe(true);
  });

  it("detects point outside", () => {
    expect(pointInCircle(20, 20, circle)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § findCollisions
// ════════════════════════════════════════════════════════════════

describe("findCollisions", () => {
  it("returns empty for empty inputs", () => {
    expect(findCollisions([], [], 100)).toEqual([]);
  });

  it("returns empty when no pairs in range", () => {
    const entities = [{ x: 0, y: 0, radius: 5 }];
    const targets = [{ x: 1000, y: 1000, radius: 5 }];
    expect(findCollisions(entities, targets, 50)).toEqual([]);
  });

  it("finds all pairs within maxDistance", () => {
    const entities = [{ x: 0, y: 0, radius: 5 }];
    const targets = [
      { x: 10, y: 0, radius: 5 },
      { x: 20, y: 0, radius: 5 },
      { x: 100, y: 0, radius: 5 },
    ];
    const pairs = findCollisions(entities, targets, 25);
    expect(pairs).toHaveLength(2);
    expect(pairs[0].indexA).toBe(0);
    expect(pairs[0].indexB).toBe(0);
    expect(pairs[0].distance).toBeCloseTo(10);
    expect(pairs[1].indexB).toBe(1);
  });

  it("includes pairs at exactly maxDistance", () => {
    const entities = [{ x: 0, y: 0, radius: 1 }];
    const targets = [{ x: 50, y: 0, radius: 1 }];
    const pairs = findCollisions(entities, targets, 50);
    expect(pairs).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § findNearest
// ════════════════════════════════════════════════════════════════

describe("findNearest", () => {
  it("returns null for empty targets", () => {
    expect(findNearest(0, 0, [])).toBeNull();
  });

  it("finds the closest target", () => {
    const targets = [
      { x: 100, y: 0, radius: 5 },
      { x: 10, y: 0, radius: 5 },
      { x: 50, y: 0, radius: 5 },
    ];
    const result = findNearest(0, 0, targets);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(1);
    expect(result!.distance).toBeCloseTo(10);
  });

  it("returns first when all equidistant", () => {
    const targets = [
      { x: 10, y: 0, radius: 5 },
      { x: -10, y: 0, radius: 5 },
      { x: 0, y: 10, radius: 5 },
    ];
    const result = findNearest(0, 0, targets);
    expect(result!.index).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isOutOfBounds
// ════════════════════════════════════════════════════════════════

describe("isOutOfBounds", () => {
  const W = 720;
  const H = 1280;
  const M = 50;

  it("returns false for center of screen", () => {
    expect(isOutOfBounds(360, 640, M, W, H)).toBe(false);
  });

  it("returns false at edge of margin", () => {
    expect(isOutOfBounds(-M, 0, M, W, H)).toBe(false);
  });

  it("returns true beyond left margin", () => {
    expect(isOutOfBounds(-M - 1, 0, M, W, H)).toBe(true);
  });

  it("returns true beyond right margin", () => {
    expect(isOutOfBounds(W + M + 1, 0, M, W, H)).toBe(true);
  });

  it("returns true beyond top margin", () => {
    expect(isOutOfBounds(0, -M - 1, M, W, H)).toBe(true);
  });

  it("returns true beyond bottom margin", () => {
    expect(isOutOfBounds(0, H + M + 1, M, W, H)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § clampToScreen
// ════════════════════════════════════════════════════════════════

describe("clampToScreen", () => {
  it("does not change position already in bounds", () => {
    const result = clampToScreen(100, 200, 10, 720, 1280);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("clamps x below margin", () => {
    const result = clampToScreen(-50, 200, 10, 720, 1280);
    expect(result.x).toBe(10);
  });

  it("clamps x above width - margin", () => {
    const result = clampToScreen(800, 200, 10, 720, 1280);
    expect(result.x).toBe(710);
  });

  it("clamps y below margin", () => {
    const result = clampToScreen(100, -50, 10, 720, 1280);
    expect(result.y).toBe(10);
  });

  it("clamps y above height - margin", () => {
    const result = clampToScreen(100, 1500, 10, 720, 1280);
    expect(result.y).toBe(1270);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAngle
// ════════════════════════════════════════════════════════════════

describe("getAngle", () => {
  it("returns 0 for rightward direction", () => {
    expect(getAngle(0, 0, 10, 0)).toBeCloseTo(0);
  });

  it("returns PI/2 for downward direction", () => {
    expect(getAngle(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2);
  });

  it("returns PI for leftward direction", () => {
    expect(getAngle(0, 0, -10, 0)).toBeCloseTo(Math.PI);
  });

  it("returns -PI/2 for upward direction", () => {
    expect(getAngle(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § reflect
// ════════════════════════════════════════════════════════════════

describe("reflect", () => {
  it("reflects horizontal velocity off vertical wall", () => {
    const r = reflect(5, 0, -1, 0);
    expect(r.vx).toBeCloseTo(-5);
    expect(r.vy).toBeCloseTo(0);
  });

  it("reflects vertical velocity off horizontal floor", () => {
    const r = reflect(0, 5, 0, -1);
    expect(r.vx).toBeCloseTo(0);
    expect(r.vy).toBeCloseTo(-5);
  });

  it("reflects diagonal velocity off vertical wall", () => {
    const r = reflect(3, 4, -1, 0);
    expect(r.vx).toBeCloseTo(-3);
    expect(r.vy).toBeCloseTo(4);
  });

  it("preserves speed after reflection", () => {
    const vx = 3,
      vy = 4;
    const r = reflect(vx, vy, 0, -1);
    const speedBefore = Math.sqrt(vx * vx + vy * vy);
    const speedAfter = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
    expect(speedAfter).toBeCloseTo(speedBefore);
  });
});
