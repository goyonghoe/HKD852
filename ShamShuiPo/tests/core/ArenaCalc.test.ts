// ── Tests: ArenaCalc ──

import { describe, it, expect } from "vitest";
import {
  createArena,
  isPointInArena,
  clampToArena,
  getArenaArea,
  getArenaBounds,
  addSpawnZone,
  addSafeZone,
  addObstacle,
  removeObstacle,
  getDistanceToBorder,
  isNearBorder,
  getValidSpawnPoint,
  shrinkArena,
  generateArenaForWave,
} from "../../src/core/ArenaCalc";

// ════════════════════════════════════════════════════════════════
// § createArena
// ════════════════════════════════════════════════════════════════

describe("createArena", () => {
  it("creates a rectangle arena with correct dimensions", () => {
    const a = createArena("rectangle", 800, 600);
    expect(a.shape).toBe("rectangle");
    expect(a.width).toBe(800);
    expect(a.height).toBe(600);
    expect(a.centerX).toBe(0);
    expect(a.centerY).toBe(0);
  });

  it("creates a circle arena with radius = min(w,h)/2", () => {
    const a = createArena("circle", 1000, 1200);
    expect(a.radius).toBe(500);
  });

  it("creates a hexagon arena", () => {
    const a = createArena("hexagon", 600, 600);
    expect(a.shape).toBe("hexagon");
    expect(a.radius).toBe(300);
  });

  it("accepts custom center coordinates", () => {
    const a = createArena("rectangle", 400, 400, 100, 200);
    expect(a.centerX).toBe(100);
    expect(a.centerY).toBe(200);
  });

  it("generates unique ids", () => {
    const a1 = createArena("rectangle", 100, 100);
    const a2 = createArena("rectangle", 100, 100);
    expect(a1.id).not.toBe(a2.id);
  });

  it("starts with empty zones and obstacles", () => {
    const a = createArena("circle", 500, 500);
    expect(a.spawnZones).toHaveLength(0);
    expect(a.safeZones).toHaveLength(0);
    expect(a.obstacles).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isPointInArena
// ════════════════════════════════════════════════════════════════

describe("isPointInArena", () => {
  it("center is inside rectangle", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isPointInArena(a, 0, 0)).toBe(true);
  });

  it("corner of rectangle is inside (on boundary)", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isPointInArena(a, 400, 300)).toBe(true);
  });

  it("point outside rectangle returns false", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isPointInArena(a, 401, 0)).toBe(false);
  });

  it("center is inside circle", () => {
    const a = createArena("circle", 600, 600);
    expect(isPointInArena(a, 0, 0)).toBe(true);
  });

  it("point on circle boundary is inside", () => {
    const a = createArena("circle", 600, 600);
    expect(isPointInArena(a, 300, 0)).toBe(true);
  });

  it("point outside circle returns false", () => {
    const a = createArena("circle", 600, 600);
    expect(isPointInArena(a, 301, 0)).toBe(false);
  });

  it("center is inside hexagon", () => {
    const a = createArena("hexagon", 600, 600);
    expect(isPointInArena(a, 0, 0)).toBe(true);
  });

  it("point far outside hexagon returns false", () => {
    const a = createArena("hexagon", 600, 600);
    expect(isPointInArena(a, 500, 500)).toBe(false);
  });

  it("works with offset center rectangle", () => {
    const a = createArena("rectangle", 200, 200, 500, 500);
    expect(isPointInArena(a, 500, 500)).toBe(true);
    expect(isPointInArena(a, 0, 0)).toBe(false);
  });

  it("works with offset center circle", () => {
    const a = createArena("circle", 200, 200, 100, 100);
    expect(isPointInArena(a, 100, 100)).toBe(true);
    expect(isPointInArena(a, 0, 0)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § clampToArena
// ════════════════════════════════════════════════════════════════

describe("clampToArena", () => {
  it("returns same point if inside rectangle", () => {
    const a = createArena("rectangle", 800, 600);
    const p = clampToArena(a, 100, 50);
    expect(p.x).toBe(100);
    expect(p.y).toBe(50);
  });

  it("clamps point outside rectangle to boundary", () => {
    const a = createArena("rectangle", 800, 600);
    const p = clampToArena(a, 1000, 0);
    expect(p.x).toBe(400);
    expect(p.y).toBe(0);
  });

  it("returns same point if inside circle", () => {
    const a = createArena("circle", 600, 600);
    const p = clampToArena(a, 100, 0);
    expect(p.x).toBe(100);
    expect(p.y).toBe(0);
  });

  it("clamps point outside circle to boundary", () => {
    const a = createArena("circle", 600, 600);
    const p = clampToArena(a, 600, 0);
    expect(p.x).toBeCloseTo(300, 0);
    expect(p.y).toBeCloseTo(0, 0);
  });

  it("clamps point outside hexagon to boundary", () => {
    const a = createArena("hexagon", 600, 600);
    const p = clampToArena(a, 1000, 0);
    expect(isPointInArena(a, p.x, p.y)).toBe(true);
    expect(p.x).toBeLessThan(1000);
  });

  it("returns same point if inside hexagon", () => {
    const a = createArena("hexagon", 600, 600);
    const p = clampToArena(a, 10, 10);
    expect(p.x).toBe(10);
    expect(p.y).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════════
// § getArenaArea
// ════════════════════════════════════════════════════════════════

describe("getArenaArea", () => {
  it("rectangle area = width * height", () => {
    const a = createArena("rectangle", 800, 600);
    expect(getArenaArea(a)).toBe(480000);
  });

  it("circle area = π * r²", () => {
    const a = createArena("circle", 600, 600);
    expect(getArenaArea(a)).toBeCloseTo(Math.PI * 300 * 300, 0);
  });

  it("hexagon area = (3√3/2) * r²", () => {
    const a = createArena("hexagon", 600, 600);
    const expected = ((3 * Math.sqrt(3)) / 2) * 300 * 300;
    expect(getArenaArea(a)).toBeCloseTo(expected, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getArenaBounds
// ════════════════════════════════════════════════════════════════

describe("getArenaBounds", () => {
  it("rectangle bounds match half-widths", () => {
    const a = createArena("rectangle", 800, 600, 100, 50);
    const b = getArenaBounds(a);
    expect(b.minX).toBe(-300);
    expect(b.maxX).toBe(500);
    expect(b.minY).toBe(-250);
    expect(b.maxY).toBe(350);
  });

  it("circle bounds form a square", () => {
    const a = createArena("circle", 600, 600);
    const b = getArenaBounds(a);
    expect(b.minX).toBe(-300);
    expect(b.maxX).toBe(300);
    expect(b.minY).toBe(-300);
    expect(b.maxY).toBe(300);
  });

  it("hexagon bounds are tighter in Y than X", () => {
    const a = createArena("hexagon", 600, 600);
    const b = getArenaBounds(a);
    expect(b.maxX - b.minX).toBe(600);
    expect(b.maxY - b.minY).toBeLessThan(600);
  });
});

// ════════════════════════════════════════════════════════════════
// § addSpawnZone / addSafeZone / addObstacle / removeObstacle
// ════════════════════════════════════════════════════════════════

describe("addSpawnZone", () => {
  it("adds a spawn zone immutably", () => {
    const a = createArena("rectangle", 800, 600);
    const b = addSpawnZone(a, 100, 200, 50, "enemy");
    expect(a.spawnZones).toHaveLength(0);
    expect(b.spawnZones).toHaveLength(1);
    expect(b.spawnZones[0].type).toBe("enemy");
  });

  it("can add boss spawn zone", () => {
    const a = createArena("rectangle", 800, 600);
    const b = addSpawnZone(a, 0, 0, 100, "boss");
    expect(b.spawnZones[0].type).toBe("boss");
  });
});

describe("addSafeZone", () => {
  it("adds a safe zone immutably", () => {
    const a = createArena("rectangle", 800, 600);
    const b = addSafeZone(a, 0, 0, 100);
    expect(a.safeZones).toHaveLength(0);
    expect(b.safeZones).toHaveLength(1);
    expect(b.safeZones[0].radius).toBe(100);
  });
});

describe("addObstacle", () => {
  it("adds an obstacle immutably", () => {
    const a = createArena("rectangle", 800, 600);
    const b = addObstacle(a, 50, 50, 40, 40, true, 100);
    expect(a.obstacles).toHaveLength(0);
    expect(b.obstacles).toHaveLength(1);
    expect(b.obstacles[0].isDestructible).toBe(true);
    expect(b.obstacles[0].hp).toBe(100);
  });
});

describe("removeObstacle", () => {
  it("removes obstacle by index immutably", () => {
    let a = createArena("rectangle", 800, 600);
    a = addObstacle(a, 10, 10, 20, 20, true, 50);
    a = addObstacle(a, 30, 30, 20, 20, false, 0);
    const b = removeObstacle(a, 0);
    expect(a.obstacles).toHaveLength(2);
    expect(b.obstacles).toHaveLength(1);
    expect(b.obstacles[0].x).toBe(30);
  });

  it("returns same arena for invalid index", () => {
    const a = createArena("rectangle", 800, 600);
    const b = removeObstacle(a, 5);
    expect(b).toBe(a);
  });

  it("returns same arena for negative index", () => {
    const a = createArena("rectangle", 800, 600);
    const b = removeObstacle(a, -1);
    expect(b).toBe(a);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDistanceToBorder
// ════════════════════════════════════════════════════════════════

describe("getDistanceToBorder", () => {
  it("returns 0 for point outside rectangle", () => {
    const a = createArena("rectangle", 800, 600);
    expect(getDistanceToBorder(a, 1000, 0)).toBe(0);
  });

  it("center of rectangle is equidistant to nearest edges", () => {
    const a = createArena("rectangle", 800, 600);
    // min distance is to top/bottom (300)
    expect(getDistanceToBorder(a, 0, 0)).toBe(300);
  });

  it("point near edge of rectangle has small distance", () => {
    const a = createArena("rectangle", 800, 600);
    expect(getDistanceToBorder(a, 390, 0)).toBe(10);
  });

  it("returns 0 for point outside circle", () => {
    const a = createArena("circle", 600, 600);
    expect(getDistanceToBorder(a, 400, 0)).toBe(0);
  });

  it("center of circle has distance = radius", () => {
    const a = createArena("circle", 600, 600);
    expect(getDistanceToBorder(a, 0, 0)).toBe(300);
  });

  it("point near circle edge has small distance", () => {
    const a = createArena("circle", 600, 600);
    expect(getDistanceToBorder(a, 290, 0)).toBeCloseTo(10, 0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isNearBorder
// ════════════════════════════════════════════════════════════════

describe("isNearBorder", () => {
  it("returns true when close to rectangle edge", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isNearBorder(a, 395, 0, 10)).toBe(true);
  });

  it("returns false when far from rectangle edge", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isNearBorder(a, 0, 0, 10)).toBe(false);
  });

  it("returns true for outside point (distance = 0 <= threshold)", () => {
    const a = createArena("rectangle", 800, 600);
    expect(isNearBorder(a, 1000, 0, 10)).toBe(true);
  });

  it("works with circle arenas", () => {
    const a = createArena("circle", 600, 600);
    expect(isNearBorder(a, 295, 0, 10)).toBe(true);
    expect(isNearBorder(a, 100, 0, 10)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getValidSpawnPoint
// ════════════════════════════════════════════════════════════════

describe("getValidSpawnPoint", () => {
  it("returns a point inside the arena", () => {
    const a = createArena("rectangle", 800, 600);
    const p = getValidSpawnPoint(a, 42);
    expect(isPointInArena(a, p.x, p.y)).toBe(true);
  });

  it("is deterministic with same seed", () => {
    const a = createArena("rectangle", 800, 600);
    const p1 = getValidSpawnPoint(a, 123);
    const p2 = getValidSpawnPoint(a, 123);
    expect(p1.x).toBe(p2.x);
    expect(p1.y).toBe(p2.y);
  });

  it("produces different points with different seeds", () => {
    const a = createArena("rectangle", 800, 600);
    const p1 = getValidSpawnPoint(a, 1);
    const p2 = getValidSpawnPoint(a, 2);
    expect(p1.x === p2.x && p1.y === p2.y).toBe(false);
  });

  it("avoids safe zones", () => {
    let a = createArena("rectangle", 200, 200);
    // Large safe zone covering most of the arena
    a = addSafeZone(a, -50, 0, 50);
    const p = getValidSpawnPoint(a, 99);
    const dx = p.x - -50;
    const dy = p.y - 0;
    // Point should be outside the safe zone (or fallback to center)
    const insideSafe = dx * dx + dy * dy <= 50 * 50;
    // If inside safe, it must be the center fallback
    if (insideSafe) {
      expect(p.x).toBe(a.centerX);
      expect(p.y).toBe(a.centerY);
    }
  });

  it("avoids obstacles", () => {
    let a = createArena("rectangle", 400, 400);
    // Large obstacle
    a = addObstacle(a, -100, 0, 150, 150, false, 0);
    const p = getValidSpawnPoint(a, 77);
    // Point should be outside obstacle or center fallback
    const inside =
      p.x >= -100 - 75 && p.x <= -100 + 75 && p.y >= -75 && p.y <= 75;
    if (inside) {
      expect(p.x).toBe(a.centerX);
      expect(p.y).toBe(a.centerY);
    }
  });

  it("works for circle arenas", () => {
    const a = createArena("circle", 600, 600);
    const p = getValidSpawnPoint(a, 42);
    expect(isPointInArena(a, p.x, p.y)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § shrinkArena
// ════════════════════════════════════════════════════════════════

describe("shrinkArena", () => {
  it("shrinks by 50% halves all dimensions", () => {
    const a = createArena("rectangle", 800, 600);
    const b = shrinkArena(a, 50);
    expect(b.width).toBe(400);
    expect(b.height).toBe(300);
    expect(b.radius).toBe(150);
  });

  it("shrink by 0% returns same dimensions", () => {
    const a = createArena("rectangle", 800, 600);
    const b = shrinkArena(a, 0);
    expect(b.width).toBe(800);
    expect(b.height).toBe(600);
  });

  it("shrink by 100% results in zero dimensions", () => {
    const a = createArena("rectangle", 800, 600);
    const b = shrinkArena(a, 100);
    expect(b.width).toBe(0);
    expect(b.height).toBe(0);
  });

  it("clamps negative percent to 0", () => {
    const a = createArena("rectangle", 800, 600);
    const b = shrinkArena(a, -10);
    expect(b.width).toBe(800);
  });

  it("clamps percent above 100 to 100", () => {
    const a = createArena("rectangle", 800, 600);
    const b = shrinkArena(a, 150);
    expect(b.width).toBe(0);
  });

  it("is immutable — original unchanged", () => {
    const a = createArena("rectangle", 800, 600);
    shrinkArena(a, 50);
    expect(a.width).toBe(800);
  });
});

// ════════════════════════════════════════════════════════════════
// § generateArenaForWave
// ════════════════════════════════════════════════════════════════

describe("generateArenaForWave", () => {
  it("wave 1 creates large rectangle", () => {
    const a = generateArenaForWave(1, 42);
    expect(a.shape).toBe("rectangle");
    expect(a.width).toBe(1200);
    expect(a.height).toBe(1600);
  });

  it("wave 3 creates large rectangle", () => {
    const a = generateArenaForWave(3, 42);
    expect(a.shape).toBe("rectangle");
  });

  it("wave 1-3 has 1-3 obstacles", () => {
    const a = generateArenaForWave(2, 42);
    expect(a.obstacles.length).toBeGreaterThanOrEqual(1);
    expect(a.obstacles.length).toBeLessThanOrEqual(3);
  });

  it("wave 4 creates medium rectangle", () => {
    const a = generateArenaForWave(4, 42);
    expect(a.shape).toBe("rectangle");
    expect(a.width).toBe(1000);
    expect(a.height).toBe(1400);
  });

  it("wave 4-6 has a safe zone", () => {
    const a = generateArenaForWave(5, 42);
    expect(a.safeZones.length).toBeGreaterThanOrEqual(1);
  });

  it("wave 4-6 has 3-6 obstacles", () => {
    const a = generateArenaForWave(5, 99);
    expect(a.obstacles.length).toBeGreaterThanOrEqual(3);
    expect(a.obstacles.length).toBeLessThanOrEqual(6);
  });

  it("wave 7 creates circle arena", () => {
    const a = generateArenaForWave(7, 42);
    expect(a.shape).toBe("circle");
    expect(a.radius).toBe(600);
  });

  it("wave 7-9 has boss spawn zone", () => {
    const a = generateArenaForWave(8, 42);
    const bossZones = a.spawnZones.filter((z) => z.type === "boss");
    expect(bossZones.length).toBeGreaterThanOrEqual(1);
  });

  it("wave 10 creates hexagon arena", () => {
    const a = generateArenaForWave(10, 42);
    expect(a.shape).toBe("hexagon");
  });

  it("wave 10+ applies shrinking", () => {
    const a10 = generateArenaForWave(10, 42);
    const a12 = generateArenaForWave(12, 42);
    // wave 12 should be smaller (10% shrink)
    expect(a12.width).toBeLessThan(a10.width);
  });

  it("wave 15 shrinks by max 25%", () => {
    const a = generateArenaForWave(15, 42);
    // (15-10)*5 = 25%, so width = 1000 * 0.75 = 750
    expect(a.width).toBeCloseTo(750, 0);
  });

  it("wave 20 caps shrink at 40%", () => {
    const a = generateArenaForWave(20, 42);
    // (20-10)*5 = 50%, capped at 40%, so width = 1000 * 0.6 = 600
    expect(a.width).toBeCloseTo(600, 0);
  });

  it("is deterministic with same seed", () => {
    const a1 = generateArenaForWave(5, 123);
    const a2 = generateArenaForWave(5, 123);
    expect(a1.obstacles.length).toBe(a2.obstacles.length);
  });

  it("wave 10+ has a safe zone", () => {
    const a = generateArenaForWave(12, 42);
    expect(a.safeZones.length).toBeGreaterThanOrEqual(1);
  });

  it("wave 1 has enemy spawn zone", () => {
    const a = generateArenaForWave(1, 42);
    const enemyZones = a.spawnZones.filter((z) => z.type === "enemy");
    expect(enemyZones.length).toBeGreaterThanOrEqual(1);
  });
});
