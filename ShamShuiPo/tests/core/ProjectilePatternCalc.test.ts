import { describe, it, expect } from "vitest";
import {
  mulberry32,
  singleShot,
  spreadShot,
  burstShot,
  coneShot,
  ringShot,
  spiralShot,
  randomShot,
  getPatternProjectileCount,
  rotateSpawns,
  generatePattern,
} from "../../src/core/ProjectilePatternCalc";

// ── mulberry32 ──

describe("mulberry32", () => {
  it("produces deterministic values", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("values in [0, 1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

// ── singleShot ──

describe("singleShot", () => {
  it("returns 1 projectile", () => {
    const s = singleShot(0, 0, Math.PI, 300);
    expect(s).toHaveLength(1);
    expect(s[0].angle).toBe(Math.PI);
    expect(s[0].speed).toBe(300);
  });

  it("preserves origin", () => {
    const s = singleShot(10, 20, 0, 100);
    expect(s[0].x).toBe(10);
    expect(s[0].y).toBe(20);
  });
});

// ── spreadShot ──

describe("spreadShot", () => {
  it("returns count projectiles", () => {
    const s = spreadShot(0, 0, 0, 300, 5, Math.PI / 4);
    expect(s).toHaveLength(5);
  });

  it("0 count returns empty", () => {
    expect(spreadShot(0, 0, 0, 300, 0, Math.PI)).toHaveLength(0);
  });

  it("1 count returns single shot", () => {
    const s = spreadShot(0, 0, 1, 300, 1, Math.PI);
    expect(s).toHaveLength(1);
    expect(s[0].angle).toBe(1);
  });

  it("angles are symmetric around base angle", () => {
    const s = spreadShot(0, 0, 0, 300, 3, Math.PI / 2);
    expect(s[0].angle).toBeCloseTo(-Math.PI / 4);
    expect(s[1].angle).toBeCloseTo(0);
    expect(s[2].angle).toBeCloseTo(Math.PI / 4);
  });
});

// ── burstShot ──

describe("burstShot", () => {
  it("returns count projectiles", () => {
    expect(burstShot(0, 0, 0, 300, 4)).toHaveLength(4);
  });

  it("speeds decrease", () => {
    const s = burstShot(0, 0, 0, 300, 3);
    expect(s[0].speed).toBe(300);
    expect(s[1].speed).toBeCloseTo(240);
    expect(s[2].speed).toBeCloseTo(180);
  });

  it("speed doesn't go below 0.2x", () => {
    const s = burstShot(0, 0, 0, 100, 10);
    for (const p of s) expect(p.speed).toBeGreaterThanOrEqual(20);
  });

  it("0 count returns empty", () => {
    expect(burstShot(0, 0, 0, 300, 0)).toHaveLength(0);
  });
});

// ── coneShot ──

describe("coneShot", () => {
  it("returns count projectiles", () => {
    expect(coneShot(0, 0, 0, 300, 5, Math.PI / 4)).toHaveLength(5);
  });

  it("angles within cone", () => {
    const halfCone = Math.PI / 4;
    const s = coneShot(0, 0, 0, 300, 100, halfCone * 2, 42);
    for (const p of s) {
      expect(p.angle).toBeGreaterThanOrEqual(-halfCone - 0.01);
      expect(p.angle).toBeLessThanOrEqual(halfCone + 0.01);
    }
  });

  it("deterministic with same seed", () => {
    const a = coneShot(0, 0, 0, 300, 5, Math.PI, 42);
    const b = coneShot(0, 0, 0, 300, 5, Math.PI, 42);
    expect(a).toEqual(b);
  });
});

// ── ringShot ──

describe("ringShot", () => {
  it("returns count projectiles", () => {
    expect(ringShot(0, 0, 300, 8)).toHaveLength(8);
  });

  it("evenly distributed in 360°", () => {
    const s = ringShot(0, 0, 300, 4);
    expect(s[0].angle).toBeCloseTo(0);
    expect(s[1].angle).toBeCloseTo(Math.PI / 2);
    expect(s[2].angle).toBeCloseTo(Math.PI);
    expect(s[3].angle).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("0 count returns empty", () => {
    expect(ringShot(0, 0, 300, 0)).toHaveLength(0);
  });
});

// ── spiralShot ──

describe("spiralShot", () => {
  it("returns count projectiles", () => {
    expect(spiralShot(0, 0, 300, 6, 0.5)).toHaveLength(6);
  });

  it("angles offset incrementally", () => {
    const s = spiralShot(0, 0, 300, 3, 1);
    expect(s[0].angle).toBeCloseTo(0);
    expect(s[1].angle).toBeCloseTo(1);
    expect(s[2].angle).toBeCloseTo(2);
  });
});

// ── randomShot ──

describe("randomShot", () => {
  it("returns count projectiles", () => {
    expect(randomShot(0, 0, 300, 5, 42)).toHaveLength(5);
  });

  it("deterministic with same seed", () => {
    const a = randomShot(0, 0, 300, 5, 42);
    const b = randomShot(0, 0, 300, 5, 42);
    expect(a).toEqual(b);
  });

  it("different seeds produce different results", () => {
    const a = randomShot(0, 0, 300, 5, 1);
    const b = randomShot(0, 0, 300, 5, 2);
    expect(a[0].angle).not.toBe(b[0].angle);
  });
});

// ── getPatternProjectileCount ──

describe("getPatternProjectileCount", () => {
  it("single is always 1", () => {
    expect(getPatternProjectileCount("single", 1)).toBe(1);
    expect(getPatternProjectileCount("single", 10)).toBe(1);
  });

  it("spread scales with level", () => {
    expect(getPatternProjectileCount("spread", 1)).toBe(3);
    expect(getPatternProjectileCount("spread", 3)).toBe(5);
  });

  it("ring scales with level", () => {
    expect(getPatternProjectileCount("ring", 1)).toBe(8);
    expect(getPatternProjectileCount("ring", 2)).toBe(10);
  });

  it("level clamped to 1 minimum", () => {
    expect(getPatternProjectileCount("spread", 0)).toBe(3);
  });
});

// ── rotateSpawns ──

describe("rotateSpawns", () => {
  it("adds angle to all spawns", () => {
    const s = singleShot(0, 0, 0, 300);
    const r = rotateSpawns(s, Math.PI);
    expect(r[0].angle).toBeCloseTo(Math.PI);
  });

  it("does not mutate input", () => {
    const s = singleShot(0, 0, 0, 300);
    rotateSpawns(s, 1);
    expect(s[0].angle).toBe(0);
  });
});

// ── generatePattern ──

describe("generatePattern", () => {
  it("single pattern", () => {
    const s = generatePattern("single", 0, 0, 0);
    expect(s).toHaveLength(1);
  });

  it("spread pattern with config", () => {
    const s = generatePattern("spread", 0, 0, 0, { count: 7 });
    expect(s).toHaveLength(7);
  });

  it("burst pattern", () => {
    const s = generatePattern("burst", 0, 0, 0);
    expect(s.length).toBeGreaterThan(0);
  });

  it("ring pattern", () => {
    const s = generatePattern("ring", 5, 10, 0, { count: 12 });
    expect(s).toHaveLength(12);
    expect(s[0].x).toBe(5);
    expect(s[0].y).toBe(10);
  });

  it("spiral pattern", () => {
    const s = generatePattern("spiral", 0, 0, 0, {
      count: 4,
      rotationOffset: 0.3,
    });
    expect(s).toHaveLength(4);
  });

  it("cone pattern", () => {
    const s = generatePattern("cone", 0, 0, 0, { count: 5, seed: 99 });
    expect(s).toHaveLength(5);
  });

  it("random pattern", () => {
    const s = generatePattern("random", 0, 0, 0, { count: 6, seed: 7 });
    expect(s).toHaveLength(6);
  });

  it("uses default speed", () => {
    const s = generatePattern("single", 0, 0, 0);
    expect(s[0].speed).toBe(300);
  });

  it("custom speed", () => {
    const s = generatePattern("single", 0, 0, 0, { speed: 500 });
    expect(s[0].speed).toBe(500);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("rotateSpawns returns new array", () => {
    const s = ringShot(0, 0, 300, 4);
    const r = rotateSpawns(s, 1);
    expect(r).not.toBe(s);
    expect(s[0].angle).toBeCloseTo(0);
  });
});
