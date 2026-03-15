// ── Tests: WavePatternCalc ──

import { describe, it, expect } from "vitest";
import {
  generateCirclePattern,
  generateLinePattern,
  generateVShapePattern,
  generateSpiralPattern,
  generateSwarmPattern,
  generateRandomPattern,
  getPatternForMinute,
  scalePatternDifficulty,
} from "../../src/core/WavePatternCalc";

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ════════════════════════════════════════════════════════════════
// § CIRCLE PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateCirclePattern", () => {
  it("generates correct number of spawn points", () => {
    const p = generateCirclePattern(400, 400, 100, 8, "drone");
    expect(p.points).toHaveLength(8);
    expect(p.type).toBe("circle");
  });

  it("all points are at correct radius from center", () => {
    const cx = 300,
      cy = 500,
      r = 150;
    const p = generateCirclePattern(cx, cy, r, 12, "drone");
    for (const pt of p.points) {
      expect(dist(cx, cy, pt.x, pt.y)).toBeCloseTo(r, 5);
    }
  });

  it("applies 0.1s stagger delay between spawns", () => {
    const p = generateCirclePattern(0, 0, 100, 5, "drone");
    for (let i = 0; i < p.points.length; i++) {
      expect(p.points[i].delay).toBeCloseTo(i * 0.1, 10);
    }
  });

  it("total duration matches last point delay", () => {
    const p = generateCirclePattern(0, 0, 100, 10, "drone");
    expect(p.totalDuration).toBeCloseTo(9 * 0.1, 10);
  });

  it("single point works (count=1)", () => {
    const p = generateCirclePattern(100, 200, 50, 1, "bot");
    expect(p.points).toHaveLength(1);
    expect(p.totalDuration).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § LINE PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateLinePattern", () => {
  it("generates correct count", () => {
    const p = generateLinePattern(0, 0, 100, 0, 5, "grunt");
    expect(p.points).toHaveLength(5);
    expect(p.type).toBe("line");
  });

  it("points are evenly spaced along line", () => {
    const p = generateLinePattern(0, 0, 100, 0, 5, "grunt");
    // x should be 0, 25, 50, 75, 100
    for (let i = 0; i < 5; i++) {
      expect(p.points[i].x).toBeCloseTo(25 * i, 5);
      expect(p.points[i].y).toBeCloseTo(0, 5);
    }
  });

  it("applies 0.15s stagger", () => {
    const p = generateLinePattern(0, 0, 200, 200, 4, "grunt");
    for (let i = 0; i < 4; i++) {
      expect(p.points[i].delay).toBeCloseTo(i * 0.15, 10);
    }
  });

  it("total duration is correct", () => {
    const p = generateLinePattern(0, 0, 100, 100, 6, "grunt");
    expect(p.totalDuration).toBeCloseTo(5 * 0.15, 10);
  });

  it("single point goes to start position", () => {
    const p = generateLinePattern(10, 20, 300, 400, 1, "grunt");
    expect(p.points[0].x).toBeCloseTo(10);
    expect(p.points[0].y).toBeCloseTo(20);
  });
});

// ════════════════════════════════════════════════════════════════
// § V-SHAPE PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateVShapePattern", () => {
  it("tip is the first point", () => {
    const p = generateVShapePattern(360, 640, 100, 7, "scout");
    expect(p.points[0].x).toBe(360);
    expect(p.points[0].y).toBe(640);
  });

  it("generates correct count", () => {
    const p = generateVShapePattern(360, 640, 100, 7, "scout");
    expect(p.points).toHaveLength(7);
    expect(p.type).toBe("vshape");
  });

  it("arms extend away from tip", () => {
    const p = generateVShapePattern(360, 640, 200, 9, "scout");
    // Points after tip should be further from tip
    for (let i = 1; i < p.points.length; i++) {
      const d = dist(360, 640, p.points[i].x, p.points[i].y);
      expect(d).toBeGreaterThan(0);
    }
  });

  it("applies 0.1s stagger", () => {
    const p = generateVShapePattern(0, 0, 100, 5, "scout");
    expect(p.points[0].delay).toBe(0);
    for (let i = 1; i < p.points.length; i++) {
      expect(p.points[i].delay).toBeGreaterThan(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § SPIRAL PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateSpiralPattern", () => {
  it("generates correct count", () => {
    const p = generateSpiralPattern(400, 600, 200, 10, "swirl");
    expect(p.points).toHaveLength(10);
    expect(p.type).toBe("spiral");
  });

  it("radius increases with each point", () => {
    const cx = 400,
      cy = 600;
    const p = generateSpiralPattern(cx, cy, 200, 10, "swirl");
    for (let i = 1; i < p.points.length; i++) {
      const rCurr = dist(cx, cy, p.points[i].x, p.points[i].y);
      const rPrev = dist(cx, cy, p.points[i - 1].x, p.points[i - 1].y);
      expect(rCurr).toBeGreaterThanOrEqual(rPrev - 0.001);
    }
  });

  it("first point is at center", () => {
    const p = generateSpiralPattern(100, 200, 300, 5, "swirl");
    expect(p.points[0].x).toBeCloseTo(100);
    expect(p.points[0].y).toBeCloseTo(200);
  });

  it("applies 0.2s stagger", () => {
    const p = generateSpiralPattern(0, 0, 100, 4, "swirl");
    for (let i = 0; i < 4; i++) {
      expect(p.points[i].delay).toBeCloseTo(i * 0.2, 10);
    }
  });

  it("total duration is correct", () => {
    const p = generateSpiralPattern(0, 0, 100, 8, "swirl");
    expect(p.totalDuration).toBeCloseTo(7 * 0.2, 10);
  });
});

// ════════════════════════════════════════════════════════════════
// § SWARM PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateSwarmPattern", () => {
  it("generates correct count", () => {
    const p = generateSwarmPattern(400, 400, 50, 15, "bug");
    expect(p.points).toHaveLength(15);
    expect(p.type).toBe("swarm");
  });

  it("all points are within spread radius from center", () => {
    const cx = 400,
      cy = 400,
      spread = 60;
    const p = generateSwarmPattern(cx, cy, spread, 20, "bug");
    for (const pt of p.points) {
      const d = dist(cx, cy, pt.x, pt.y);
      // Distance should be ≤ spread * sqrt(2) since sin/cos max is 1
      expect(d).toBeLessThanOrEqual(spread * Math.SQRT2 + 0.01);
    }
  });

  it("applies 0.05s stagger", () => {
    const p = generateSwarmPattern(0, 0, 30, 6, "bug");
    for (let i = 0; i < 6; i++) {
      expect(p.points[i].delay).toBeCloseTo(i * 0.05, 10);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § RANDOM PATTERN
// ════════════════════════════════════════════════════════════════

describe("generateRandomPattern", () => {
  it("generates correct count", () => {
    const p = generateRandomPattern(0, 0, 720, 1280, 10, "any");
    expect(p.points).toHaveLength(10);
    expect(p.type).toBe("random");
  });

  it("all points are within bounds", () => {
    const p = generateRandomPattern(100, 200, 600, 1000, 20, "any");
    for (const pt of p.points) {
      expect(pt.x).toBeGreaterThanOrEqual(100);
      expect(pt.x).toBeLessThanOrEqual(600);
      expect(pt.y).toBeGreaterThanOrEqual(200);
      expect(pt.y).toBeLessThanOrEqual(1000);
    }
  });

  it("applies 0.1s stagger", () => {
    const p = generateRandomPattern(0, 0, 100, 100, 5, "any");
    for (let i = 0; i < 5; i++) {
      expect(p.points[i].delay).toBeCloseTo(i * 0.1, 10);
    }
  });

  it("is deterministic (same inputs = same outputs)", () => {
    const a = generateRandomPattern(0, 0, 720, 1280, 10, "bot");
    const b = generateRandomPattern(0, 0, 720, 1280, 10, "bot");
    for (let i = 0; i < 10; i++) {
      expect(a.points[i].x).toBe(b.points[i].x);
      expect(a.points[i].y).toBe(b.points[i].y);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § getPatternForMinute
// ════════════════════════════════════════════════════════════════

describe("getPatternForMinute", () => {
  it("returns random for minutes 0-1", () => {
    expect(getPatternForMinute(0)).toBe("random");
    expect(getPatternForMinute(1)).toBe("random");
  });

  it("returns line for minutes 2-3", () => {
    expect(getPatternForMinute(2)).toBe("line");
    expect(getPatternForMinute(3)).toBe("line");
  });

  it("returns circle for minutes 4-5", () => {
    expect(getPatternForMinute(4)).toBe("circle");
    expect(getPatternForMinute(5)).toBe("circle");
  });

  it("returns vshape for minutes 6-7", () => {
    expect(getPatternForMinute(6)).toBe("vshape");
    expect(getPatternForMinute(7)).toBe("vshape");
  });

  it("returns spiral for minute 8", () => {
    expect(getPatternForMinute(8)).toBe("spiral");
  });

  it("returns swarm for minute 9", () => {
    expect(getPatternForMinute(9)).toBe("swarm");
  });

  it("returns swarm for minutes beyond 9", () => {
    expect(getPatternForMinute(10)).toBe("swarm");
    expect(getPatternForMinute(15)).toBe("swarm");
  });
});

// ════════════════════════════════════════════════════════════════
// § scalePatternDifficulty
// ════════════════════════════════════════════════════════════════

describe("scalePatternDifficulty", () => {
  it("increases count by multiplier", () => {
    const base = generateCirclePattern(0, 0, 100, 10, "drone");
    const scaled = scalePatternDifficulty(base, 2);
    expect(scaled.points).toHaveLength(20);
  });

  it("reduces delays with higher multiplier", () => {
    const base = generateLinePattern(0, 0, 100, 0, 6, "grunt");
    const scaled = scalePatternDifficulty(base, 2);
    // Original stagger: 0.15, scaled: 0.075
    const originalStagger = base.totalDuration / (base.points.length - 1);
    const scaledStagger = scaled.totalDuration / (scaled.points.length - 1);
    expect(scaledStagger).toBeCloseTo(originalStagger / 2, 5);
  });

  it("preserves pattern type", () => {
    const base = generateSpiralPattern(0, 0, 100, 5, "swirl");
    const scaled = scalePatternDifficulty(base, 1.5);
    expect(scaled.type).toBe("spiral");
  });

  it("preserves enemyId", () => {
    const base = generateSwarmPattern(0, 0, 50, 4, "special_bug");
    const scaled = scalePatternDifficulty(base, 2);
    for (const pt of scaled.points) {
      expect(pt.enemyId).toBe("special_bug");
    }
  });

  it("multiplier of 1 keeps same count", () => {
    const base = generateCirclePattern(0, 0, 100, 8, "drone");
    const scaled = scalePatternDifficulty(base, 1);
    expect(scaled.points).toHaveLength(8);
  });
});

// ════════════════════════════════════════════════════════════════
// § LARGE COUNT
// ════════════════════════════════════════════════════════════════

describe("large count patterns", () => {
  it("circle with 50 points", () => {
    const p = generateCirclePattern(360, 640, 300, 50, "drone");
    expect(p.points).toHaveLength(50);
    expect(p.totalDuration).toBeCloseTo(49 * 0.1, 10);
  });

  it("swarm with 50 points stays within spread", () => {
    const cx = 360,
      cy = 640,
      spread = 80;
    const p = generateSwarmPattern(cx, cy, spread, 50, "bug");
    expect(p.points).toHaveLength(50);
    for (const pt of p.points) {
      const d = dist(cx, cy, pt.x, pt.y);
      expect(d).toBeLessThanOrEqual(spread * Math.SQRT2 + 0.01);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § ALL PATTERNS — COMMON PROPERTIES
// ════════════════════════════════════════════════════════════════

describe("common pattern properties", () => {
  it("all patterns assign correct enemyId", () => {
    const patterns = [
      generateCirclePattern(0, 0, 100, 3, "test_enemy"),
      generateLinePattern(0, 0, 100, 0, 3, "test_enemy"),
      generateVShapePattern(0, 0, 100, 3, "test_enemy"),
      generateSpiralPattern(0, 0, 100, 3, "test_enemy"),
      generateSwarmPattern(0, 0, 50, 3, "test_enemy"),
      generateRandomPattern(0, 0, 100, 100, 3, "test_enemy"),
    ];
    for (const p of patterns) {
      for (const pt of p.points) {
        expect(pt.enemyId).toBe("test_enemy");
      }
    }
  });

  it("first point always has delay=0", () => {
    const patterns = [
      generateCirclePattern(0, 0, 100, 5, "e"),
      generateLinePattern(0, 0, 100, 0, 5, "e"),
      generateVShapePattern(0, 0, 100, 5, "e"),
      generateSpiralPattern(0, 0, 100, 5, "e"),
      generateSwarmPattern(0, 0, 50, 5, "e"),
      generateRandomPattern(0, 0, 100, 100, 5, "e"),
    ];
    for (const p of patterns) {
      expect(p.points[0].delay).toBe(0);
    }
  });
});
