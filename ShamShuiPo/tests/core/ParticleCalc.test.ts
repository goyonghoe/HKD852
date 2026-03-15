// ── Tests: ParticleCalc ──

import { describe, it, expect } from "vitest";
import {
  getEffectConfig,
  generateParticles,
  tickParticle,
  tickParticles,
  isAlive,
  getParticleAlpha,
  getParticleSize,
  mergeParticles,
  type Particle,
  type ParticleEffect,
} from "../../src/core/ParticleCalc";

// ════════════════════════════════════════════════════════════════
// § getEffectConfig
// ════════════════════════════════════════════════════════════════

describe("getEffectConfig", () => {
  const effects: ParticleEffect[] = [
    "explosion",
    "hit_spark",
    "death_burst",
    "xp_collect",
    "level_up",
    "heal",
    "crit_flash",
  ];

  it("returns a valid config for every effect type", () => {
    for (const effect of effects) {
      const cfg = getEffectConfig(effect);
      expect(cfg.count).toBeGreaterThan(0);
      expect(cfg.speed.min).toBeLessThanOrEqual(cfg.speed.max);
      expect(cfg.lifetime.min).toBeLessThanOrEqual(cfg.lifetime.max);
      expect(cfg.size.min).toBeLessThanOrEqual(cfg.size.max);
      expect(typeof cfg.color).toBe("number");
      expect(typeof cfg.gravity).toBe("number");
      expect(typeof cfg.fadeOut).toBe("boolean");
      expect(typeof cfg.shrink).toBe("boolean");
    }
  });

  it("returns a copy (not the internal reference)", () => {
    const a = getEffectConfig("explosion");
    const b = getEffectConfig("explosion");
    expect(a).toEqual(b);
    a.count = 999;
    expect(b.count).not.toBe(999);
  });

  it("explosion has more particles than hit_spark", () => {
    expect(getEffectConfig("explosion").count).toBeGreaterThan(
      getEffectConfig("hit_spark").count,
    );
  });
});

// ════════════════════════════════════════════════════════════════
// § generateParticles
// ════════════════════════════════════════════════════════════════

describe("generateParticles", () => {
  it("creates the correct number of particles", () => {
    const particles = generateParticles("explosion", 100, 200, 42);
    const cfg = getEffectConfig("explosion");
    expect(particles).toHaveLength(cfg.count);
  });

  it("all particles start at the given position", () => {
    const particles = generateParticles("hit_spark", 50, 75, 1);
    for (const p of particles) {
      expect(p.x).toBe(50);
      expect(p.y).toBe(75);
    }
  });

  it("particles have valid initial properties", () => {
    const particles = generateParticles("death_burst", 0, 0, 99);
    const cfg = getEffectConfig("death_burst");
    for (const p of particles) {
      expect(p.alpha).toBe(1);
      expect(p.life).toBeGreaterThanOrEqual(cfg.lifetime.min);
      expect(p.life).toBeLessThanOrEqual(cfg.lifetime.max);
      expect(p.life).toBe(p.maxLife);
      expect(p.size).toBeGreaterThanOrEqual(cfg.size.min);
      expect(p.size).toBeLessThanOrEqual(cfg.size.max);
      expect(p.color).toBe(cfg.color);
    }
  });

  it("is deterministic with the same seed", () => {
    const a = generateParticles("level_up", 100, 200, 42);
    const b = generateParticles("level_up", 100, 200, 42);
    expect(a).toEqual(b);
  });

  it("produces different results with different seeds", () => {
    const a = generateParticles("level_up", 100, 200, 1);
    const b = generateParticles("level_up", 100, 200, 2);
    // At least one particle should differ
    const differ = a.some((p, i) => p.vx !== b[i].vx || p.vy !== b[i].vy);
    expect(differ).toBe(true);
  });

  it("particles have velocity directions spread around the circle", () => {
    const particles = generateParticles("explosion", 0, 0, 7);
    const hasPositiveVx = particles.some((p) => p.vx > 0);
    const hasNegativeVx = particles.some((p) => p.vx < 0);
    const hasPositiveVy = particles.some((p) => p.vy > 0);
    const hasNegativeVy = particles.some((p) => p.vy < 0);
    expect(hasPositiveVx).toBe(true);
    expect(hasNegativeVx).toBe(true);
    expect(hasPositiveVy).toBe(true);
    expect(hasNegativeVy).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § isAlive
// ════════════════════════════════════════════════════════════════

describe("isAlive", () => {
  const base: Particle = {
    x: 0,
    y: 0,
    vx: 10,
    vy: 10,
    life: 0.5,
    maxLife: 1,
    size: 4,
    color: 0xffffff,
    alpha: 1,
    rotation: 0,
  };

  it("returns true for a fresh particle", () => {
    expect(isAlive(base)).toBe(true);
  });

  it("returns false when life <= 0", () => {
    expect(isAlive({ ...base, life: 0 })).toBe(false);
    expect(isAlive({ ...base, life: -0.1 })).toBe(false);
  });

  it("returns false when alpha <= 0", () => {
    expect(isAlive({ ...base, alpha: 0 })).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getParticleAlpha
// ════════════════════════════════════════════════════════════════

describe("getParticleAlpha", () => {
  it("returns 1 at full lifetime", () => {
    const p: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      size: 4,
      color: 0xffffff,
      alpha: 1,
      rotation: 0,
    };
    expect(getParticleAlpha(p)).toBeCloseTo(1);
  });

  it("returns 0.5 at half lifetime", () => {
    const p: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 1,
      size: 4,
      color: 0xffffff,
      alpha: 1,
      rotation: 0,
    };
    expect(getParticleAlpha(p)).toBeCloseTo(0.5);
  });

  it("returns 0 when life is 0", () => {
    const p: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      color: 0xffffff,
      alpha: 1,
      rotation: 0,
    };
    expect(getParticleAlpha(p)).toBeCloseTo(0);
  });

  it("clamps to 0 for negative life", () => {
    const p: Particle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: -0.5,
      maxLife: 1,
      size: 4,
      color: 0xffffff,
      alpha: 1,
      rotation: 0,
    };
    expect(getParticleAlpha(p)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getParticleSize
// ════════════════════════════════════════════════════════════════

describe("getParticleSize", () => {
  const base: Particle = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0.5,
    maxLife: 1,
    size: 10,
    color: 0xffffff,
    alpha: 1,
    rotation: 0,
  };

  it("returns full size when shrink is disabled", () => {
    expect(getParticleSize(base, false)).toBe(10);
  });

  it("returns proportional size when shrink is enabled", () => {
    expect(getParticleSize(base, true)).toBeCloseTo(5);
  });

  it("returns 0 at end of life with shrink enabled", () => {
    expect(getParticleSize({ ...base, life: 0 }, true)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § tickParticle
// ════════════════════════════════════════════════════════════════

describe("tickParticle", () => {
  const base: Particle = {
    x: 100,
    y: 200,
    vx: 60,
    vy: 0,
    life: 1,
    maxLife: 1,
    size: 5,
    color: 0xff0000,
    alpha: 1,
    rotation: 0,
  };

  it("moves particle by velocity * dt", () => {
    const result = tickParticle(base, 0.1, 0);
    expect(result.x).toBeCloseTo(106); // 100 + 60*0.1
    expect(result.y).toBeCloseTo(200);
  });

  it("applies gravity to vertical position and velocity", () => {
    const result = tickParticle(base, 0.1, 100);
    expect(result.vy).toBeCloseTo(10); // 0 + 100*0.1
    // y = 200 + 0*0.1 + 0.5*100*0.01 = 200.5
    expect(result.y).toBeCloseTo(200.5);
  });

  it("decrements life by dt", () => {
    const result = tickParticle(base, 0.3, 0);
    expect(result.life).toBeCloseTo(0.7);
  });

  it("updates alpha based on remaining life ratio", () => {
    const result = tickParticle(base, 0.4, 0);
    expect(result.alpha).toBeCloseTo(0.6);
  });
});

// ════════════════════════════════════════════════════════════════
// § tickParticles
// ════════════════════════════════════════════════════════════════

describe("tickParticles", () => {
  it("removes dead particles after tick", () => {
    const cfg = getEffectConfig("hit_spark");
    // Create particles with very short life
    const particles: Particle[] = [
      {
        x: 0,
        y: 0,
        vx: 10,
        vy: 10,
        life: 0.01,
        maxLife: 0.5,
        size: 3,
        color: 0xffffff,
        alpha: 1,
        rotation: 0,
      },
      {
        x: 0,
        y: 0,
        vx: 10,
        vy: 10,
        life: 1.0,
        maxLife: 1.0,
        size: 3,
        color: 0xffffff,
        alpha: 1,
        rotation: 0,
      },
    ];
    const result = tickParticles(particles, 0.05, cfg);
    // First particle should be dead (life 0.01 - 0.05 < 0)
    expect(result).toHaveLength(1);
  });

  it("keeps alive particles and advances them", () => {
    const cfg = getEffectConfig("explosion");
    const particles = generateParticles("explosion", 0, 0, 42);
    const result = tickParticles(particles, 0.01, cfg);
    // After a tiny dt, most should survive
    expect(result.length).toBeGreaterThan(0);
    // All should have moved from origin
    for (const p of result) {
      expect(p.x !== 0 || p.y !== 0).toBe(true);
    }
  });

  it("returns empty array when all particles are dead", () => {
    const cfg = getEffectConfig("hit_spark");
    const particles: Particle[] = [
      {
        x: 0,
        y: 0,
        vx: 10,
        vy: 10,
        life: 0.01,
        maxLife: 0.5,
        size: 3,
        color: 0xffffff,
        alpha: 1,
        rotation: 0,
      },
    ];
    const result = tickParticles(particles, 1.0, cfg);
    expect(result).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § mergeParticles
// ════════════════════════════════════════════════════════════════

describe("mergeParticles", () => {
  const makeP = (id: number): Particle => ({
    x: id,
    y: 0,
    vx: 0,
    vy: 0,
    life: 1,
    maxLife: 1,
    size: 3,
    color: 0xffffff,
    alpha: 1,
    rotation: 0,
  });

  it("combines both arrays when under cap", () => {
    const existing = [makeP(1), makeP(2)];
    const newP = [makeP(3)];
    const result = mergeParticles(existing, newP, 10);
    expect(result).toHaveLength(3);
  });

  it("caps total to maxTotal, dropping oldest", () => {
    const existing = [makeP(1), makeP(2), makeP(3)];
    const newP = [makeP(4), makeP(5)];
    const result = mergeParticles(existing, newP, 3);
    expect(result).toHaveLength(3);
    // Should keep the newest: 3, 4, 5
    expect(result[0].x).toBe(3);
    expect(result[1].x).toBe(4);
    expect(result[2].x).toBe(5);
  });

  it("returns exact max when combined equals max", () => {
    const existing = [makeP(1), makeP(2)];
    const newP = [makeP(3)];
    const result = mergeParticles(existing, newP, 3);
    expect(result).toHaveLength(3);
  });

  it("handles empty existing array", () => {
    const result = mergeParticles([], [makeP(1), makeP(2)], 5);
    expect(result).toHaveLength(2);
  });

  it("handles empty new array", () => {
    const result = mergeParticles([makeP(1)], [], 5);
    expect(result).toHaveLength(1);
  });
});
