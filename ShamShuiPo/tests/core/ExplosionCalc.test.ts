import { describe, it, expect } from "vitest";
import {
  createExplosionState,
  createExplosionConfig,
  calculateExplosionDamage,
  applyExplosion,
  calculateKnockback,
  spawnExplosion,
  updateExplosions,
  getActiveExplosions,
  clearExplosions,
  getFalloffMultiplier,
} from "../../src/core/ExplosionCalc";

// ─── createExplosionState ───────────────────────────────────────

describe("createExplosionState", () => {
  it("should create state with default maxExplosions=20", () => {
    const state = createExplosionState();
    expect(state.maxExplosions).toBe(20);
    expect(state.explosions).toEqual([]);
  });

  it("should create state with custom maxExplosions", () => {
    const state = createExplosionState(5);
    expect(state.maxExplosions).toBe(5);
  });

  it("should start with empty explosions array", () => {
    const state = createExplosionState(10);
    expect(state.explosions).toHaveLength(0);
  });
});

// ─── createExplosionConfig ──────────────────────────────────────

describe("createExplosionConfig", () => {
  it("should create config with all defaults", () => {
    const config = createExplosionConfig();
    expect(config.radius).toBe(100);
    expect(config.baseDamage).toBe(50);
    expect(config.falloffType).toBe("linear");
    expect(config.knockbackForce).toBe(200);
  });

  it("should override radius", () => {
    const config = createExplosionConfig({ radius: 200 });
    expect(config.radius).toBe(200);
    expect(config.baseDamage).toBe(50);
  });

  it("should override baseDamage", () => {
    const config = createExplosionConfig({ baseDamage: 100 });
    expect(config.baseDamage).toBe(100);
  });

  it("should override falloffType to quadratic", () => {
    const config = createExplosionConfig({ falloffType: "quadratic" });
    expect(config.falloffType).toBe("quadratic");
  });

  it("should override falloffType to none", () => {
    const config = createExplosionConfig({ falloffType: "none" });
    expect(config.falloffType).toBe("none");
  });

  it("should override knockbackForce", () => {
    const config = createExplosionConfig({ knockbackForce: 500 });
    expect(config.knockbackForce).toBe(500);
  });

  it("should override multiple fields at once", () => {
    const config = createExplosionConfig({
      radius: 50,
      baseDamage: 200,
      falloffType: "none",
      knockbackForce: 0,
    });
    expect(config.radius).toBe(50);
    expect(config.baseDamage).toBe(200);
    expect(config.falloffType).toBe("none");
    expect(config.knockbackForce).toBe(0);
  });
});

// ─── getFalloffMultiplier ───────────────────────────────────────

describe("getFalloffMultiplier", () => {
  it("should return 1 at distance 0 for linear", () => {
    expect(getFalloffMultiplier(0, 100, "linear")).toBe(1);
  });

  it("should return 1 at distance 0 for quadratic", () => {
    expect(getFalloffMultiplier(0, 100, "quadratic")).toBe(1);
  });

  it("should return 1 at distance 0 for none", () => {
    expect(getFalloffMultiplier(0, 100, "none")).toBe(1);
  });

  it("should return 0 at distance >= radius for linear", () => {
    expect(getFalloffMultiplier(100, 100, "linear")).toBe(0);
    expect(getFalloffMultiplier(150, 100, "linear")).toBe(0);
  });

  it("should return 0 at distance >= radius for quadratic", () => {
    expect(getFalloffMultiplier(100, 100, "quadratic")).toBe(0);
  });

  it("should return 0 at distance >= radius for none", () => {
    expect(getFalloffMultiplier(100, 100, "none")).toBe(0);
  });

  it("should return 0.5 at half radius for linear", () => {
    expect(getFalloffMultiplier(50, 100, "linear")).toBe(0.5);
  });

  it("should return 0.75 at half radius for quadratic", () => {
    expect(getFalloffMultiplier(50, 100, "quadratic")).toBe(0.75);
  });

  it("should return 1 at half radius for none", () => {
    expect(getFalloffMultiplier(50, 100, "none")).toBe(1);
  });

  it("should handle radius=0", () => {
    expect(getFalloffMultiplier(0, 0, "linear")).toBe(1);
    expect(getFalloffMultiplier(10, 0, "linear")).toBe(0);
  });

  it("should return linear falloff at 25% radius", () => {
    expect(getFalloffMultiplier(25, 100, "linear")).toBeCloseTo(0.75);
  });

  it("should return quadratic falloff at 25% radius", () => {
    // 1 - (0.25)^2 = 1 - 0.0625 = 0.9375
    expect(getFalloffMultiplier(25, 100, "quadratic")).toBeCloseTo(0.9375);
  });
});

// ─── calculateExplosionDamage ───────────────────────────────────

describe("calculateExplosionDamage", () => {
  const linearConfig = createExplosionConfig({ falloffType: "linear" });
  const quadConfig = createExplosionConfig({ falloffType: "quadratic" });
  const noneConfig = createExplosionConfig({ falloffType: "none" });

  it("should return full damage at distance 0 (linear)", () => {
    expect(calculateExplosionDamage(0, linearConfig)).toBe(50);
  });

  it("should return full damage at distance 0 (quadratic)", () => {
    expect(calculateExplosionDamage(0, quadConfig)).toBe(50);
  });

  it("should return full damage at distance 0 (none)", () => {
    expect(calculateExplosionDamage(0, noneConfig)).toBe(50);
  });

  it("should return 0 damage beyond radius", () => {
    expect(calculateExplosionDamage(101, linearConfig)).toBe(0);
    expect(calculateExplosionDamage(200, linearConfig)).toBe(0);
  });

  it("should return 0 for negative distance", () => {
    expect(calculateExplosionDamage(-10, linearConfig)).toBe(0);
  });

  it("should return half damage at half radius (linear)", () => {
    expect(calculateExplosionDamage(50, linearConfig)).toBe(25);
  });

  it("should return 75% damage at half radius (quadratic)", () => {
    expect(calculateExplosionDamage(50, quadConfig)).toBeCloseTo(37.5);
  });

  it("should return full damage at half radius (none)", () => {
    expect(calculateExplosionDamage(50, noneConfig)).toBe(50);
  });

  it("should return 0 damage at exactly the radius (linear)", () => {
    expect(calculateExplosionDamage(100, linearConfig)).toBe(0);
  });

  it("should return 0 damage at exactly the radius (quadratic)", () => {
    expect(calculateExplosionDamage(100, quadConfig)).toBe(0);
  });

  it("should return 0 damage at exactly the radius (none)", () => {
    expect(calculateExplosionDamage(100, noneConfig)).toBe(0);
  });

  it("should scale with baseDamage", () => {
    const highDmg = createExplosionConfig({ baseDamage: 200 });
    expect(calculateExplosionDamage(0, highDmg)).toBe(200);
    expect(calculateExplosionDamage(50, highDmg)).toBe(100);
  });
});

// ─── calculateKnockback ────────────────────────────────────────

describe("calculateKnockback", () => {
  it("should push target to the right when east of explosion", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, 100, 0, 200);
    expect(kbX).toBe(200);
    expect(kbY).toBe(0);
  });

  it("should push target upward when north of explosion", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, 0, -100, 200);
    expect(kbX).toBe(0);
    expect(kbY).toBe(-200);
  });

  it("should push target downward when south of explosion", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, 0, 100, 200);
    expect(kbX).toBe(0);
    expect(kbY).toBe(200);
  });

  it("should push target to the left when west of explosion", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, -100, 0, 200);
    expect(kbX).toBe(-200);
    expect(kbY).toBe(0);
  });

  it("should return zero knockback when target is at explosion center", () => {
    const { kbX, kbY } = calculateKnockback(50, 50, 50, 50, 200);
    expect(kbX).toBe(0);
    expect(kbY).toBe(0);
  });

  it("should normalize diagonal knockback", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, 100, 100, 200);
    const magnitude = Math.sqrt(kbX * kbX + kbY * kbY);
    expect(magnitude).toBeCloseTo(200);
  });

  it("should handle zero force", () => {
    const { kbX, kbY } = calculateKnockback(0, 0, 100, 0, 0);
    expect(kbX).toBe(0);
    expect(kbY).toBe(0);
  });
});

// ─── applyExplosion ────────────────────────────────────────────

describe("applyExplosion", () => {
  const config = createExplosionConfig();

  it("should hit enemies within radius", () => {
    const enemies = [{ id: "e1", x: 50, y: 0 }];
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].id).toBe("e1");
  });

  it("should skip enemies outside radius", () => {
    const enemies = [{ id: "e1", x: 200, y: 0 }];
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets).toHaveLength(0);
    expect(result.totalDamage).toBe(0);
  });

  it("should calculate correct totalDamage for multiple enemies", () => {
    const enemies = [
      { id: "e1", x: 0, y: 0 },
      { id: "e2", x: 50, y: 0 },
    ];
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets).toHaveLength(2);
    // e1 at distance 0 = 50, e2 at distance 50 = 25
    expect(result.totalDamage).toBe(75);
  });

  it("should include distance in target results", () => {
    const enemies = [{ id: "e1", x: 60, y: 80 }];
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets[0].distance).toBe(100);
  });

  it("should handle empty enemies array", () => {
    const result = applyExplosion(0, 0, [], config);
    expect(result.targets).toHaveLength(0);
    expect(result.totalDamage).toBe(0);
  });

  it("should apply knockback to hit enemies", () => {
    const enemies = [{ id: "e1", x: 100, y: 0 }];
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets[0].knockbackX).toBe(200);
    expect(result.targets[0].knockbackY).toBe(0);
  });

  it("should use none falloff for uniform damage", () => {
    const noneConfig = createExplosionConfig({ falloffType: "none" });
    const enemies = [
      { id: "e1", x: 10, y: 0 },
      { id: "e2", x: 90, y: 0 },
    ];
    const result = applyExplosion(0, 0, enemies, noneConfig);
    expect(result.targets[0].damage).toBe(50);
    expect(result.targets[1].damage).toBe(50);
  });

  it("should handle explosion at non-origin position", () => {
    const enemies = [{ id: "e1", x: 350, y: 200 }];
    const result = applyExplosion(300, 200, enemies, config);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].distance).toBe(50);
  });
});

// ─── spawnExplosion ─────────────────────────────────────────────

describe("spawnExplosion", () => {
  const config = createExplosionConfig();

  it("should add an explosion to state", () => {
    const state = createExplosionState();
    const next = spawnExplosion(state, 100, 200, config);
    expect(next.explosions).toHaveLength(1);
    expect(next.explosions[0].x).toBe(100);
    expect(next.explosions[0].y).toBe(200);
    expect(next.explosions[0].active).toBe(true);
  });

  it("should default duration to 300ms", () => {
    const state = createExplosionState();
    const next = spawnExplosion(state, 0, 0, config);
    expect(next.explosions[0].duration).toBe(300);
  });

  it("should accept custom duration", () => {
    const state = createExplosionState();
    const next = spawnExplosion(state, 0, 0, config, 500);
    expect(next.explosions[0].duration).toBe(500);
  });

  it("should start with elapsed=0", () => {
    const state = createExplosionState();
    const next = spawnExplosion(state, 0, 0, config);
    expect(next.explosions[0].elapsed).toBe(0);
  });

  it("should remove oldest when max exceeded", () => {
    let state = createExplosionState(2);
    state = spawnExplosion(state, 0, 0, config);
    state = spawnExplosion(state, 10, 10, config);
    state = spawnExplosion(state, 20, 20, config);
    expect(state.explosions).toHaveLength(2);
    expect(state.explosions[0].x).toBe(10);
    expect(state.explosions[1].x).toBe(20);
  });

  it("should not mutate original state", () => {
    const state = createExplosionState();
    const next = spawnExplosion(state, 0, 0, config);
    expect(state.explosions).toHaveLength(0);
    expect(next.explosions).toHaveLength(1);
  });

  it("should assign unique ids", () => {
    let state = createExplosionState();
    state = spawnExplosion(state, 0, 0, config);
    state = spawnExplosion(state, 0, 0, config);
    expect(state.explosions[0].id).not.toBe(state.explosions[1].id);
  });

  it("should store the config on the instance", () => {
    const customConfig = createExplosionConfig({ baseDamage: 999 });
    const state = spawnExplosion(createExplosionState(), 0, 0, customConfig);
    expect(state.explosions[0].config.baseDamage).toBe(999);
  });
});

// ─── updateExplosions ───────────────────────────────────────────

describe("updateExplosions", () => {
  const config = createExplosionConfig();

  it("should advance elapsed time", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 300);
    state = updateExplosions(state, 100);
    expect(state.explosions[0].elapsed).toBe(100);
  });

  it("should deactivate expired explosions", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 300);
    state = updateExplosions(state, 300);
    expect(state.explosions[0].active).toBe(false);
  });

  it("should keep active explosions that have not expired", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 300);
    state = updateExplosions(state, 150);
    expect(state.explosions[0].active).toBe(true);
  });

  it("should handle multiple updates", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 300);
    state = updateExplosions(state, 100);
    state = updateExplosions(state, 100);
    expect(state.explosions[0].elapsed).toBe(200);
    expect(state.explosions[0].active).toBe(true);
    state = updateExplosions(state, 100);
    expect(state.explosions[0].elapsed).toBe(300);
    expect(state.explosions[0].active).toBe(false);
  });

  it("should not update already inactive explosions", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 100);
    state = updateExplosions(state, 200); // deactivates
    const elapsed = state.explosions[0].elapsed;
    state = updateExplosions(state, 100); // should not change
    expect(state.explosions[0].elapsed).toBe(elapsed);
  });

  it("should not mutate original state", () => {
    const state = spawnExplosion(createExplosionState(), 0, 0, config, 300);
    const next = updateExplosions(state, 100);
    expect(state.explosions[0].elapsed).toBe(0);
    expect(next.explosions[0].elapsed).toBe(100);
  });

  it("should handle empty state", () => {
    const state = createExplosionState();
    const next = updateExplosions(state, 100);
    expect(next.explosions).toHaveLength(0);
  });
});

// ─── getActiveExplosions ────────────────────────────────────────

describe("getActiveExplosions", () => {
  const config = createExplosionConfig();

  it("should return only active explosions", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 100);
    state = spawnExplosion(state, 10, 10, config, 500);
    state = updateExplosions(state, 200);
    const active = getActiveExplosions(state);
    expect(active).toHaveLength(1);
    expect(active[0].x).toBe(10);
  });

  it("should return empty array when none active", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 100);
    state = updateExplosions(state, 200);
    expect(getActiveExplosions(state)).toHaveLength(0);
  });

  it("should return all when all active", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config, 500);
    state = spawnExplosion(state, 10, 10, config, 500);
    const active = getActiveExplosions(state);
    expect(active).toHaveLength(2);
  });
});

// ─── clearExplosions ────────────────────────────────────────────

describe("clearExplosions", () => {
  const config = createExplosionConfig();

  it("should remove all explosions", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config);
    state = spawnExplosion(state, 10, 10, config);
    const cleared = clearExplosions(state);
    expect(cleared.explosions).toHaveLength(0);
  });

  it("should preserve maxExplosions", () => {
    const state = createExplosionState(5);
    const cleared = clearExplosions(state);
    expect(cleared.maxExplosions).toBe(5);
  });

  it("should not mutate original state", () => {
    let state = spawnExplosion(createExplosionState(), 0, 0, config);
    const cleared = clearExplosions(state);
    expect(state.explosions).toHaveLength(1);
    expect(cleared.explosions).toHaveLength(0);
  });

  it("should handle already empty state", () => {
    const state = createExplosionState();
    const cleared = clearExplosions(state);
    expect(cleared.explosions).toHaveLength(0);
  });
});

// ─── Integration / Edge Cases ───────────────────────────────────

describe("integration and edge cases", () => {
  it("should handle full lifecycle: spawn, update, check active, clear", () => {
    const config = createExplosionConfig();
    let state = createExplosionState(10);

    state = spawnExplosion(state, 100, 200, config, 200);
    expect(getActiveExplosions(state)).toHaveLength(1);

    state = updateExplosions(state, 100);
    expect(getActiveExplosions(state)).toHaveLength(1);

    state = updateExplosions(state, 150);
    expect(getActiveExplosions(state)).toHaveLength(0);

    state = clearExplosions(state);
    expect(state.explosions).toHaveLength(0);
  });

  it("should apply explosion with quadratic falloff correctly", () => {
    const config = createExplosionConfig({
      radius: 200,
      baseDamage: 100,
      falloffType: "quadratic",
    });
    const enemies = [
      { id: "near", x: 50, y: 0 },
      { id: "mid", x: 100, y: 0 },
      { id: "far", x: 150, y: 0 },
    ];
    const result = applyExplosion(0, 0, enemies, config);
    // near: 1 - (50/200)^2 = 1 - 0.0625 = 0.9375 => 93.75
    // mid:  1 - (100/200)^2 = 1 - 0.25 = 0.75 => 75
    // far:  1 - (150/200)^2 = 1 - 0.5625 = 0.4375 => 43.75
    expect(result.targets[0].damage).toBeCloseTo(93.75);
    expect(result.targets[1].damage).toBeCloseTo(75);
    expect(result.targets[2].damage).toBeCloseTo(43.75);
  });

  it("should handle large number of enemies", () => {
    const config = createExplosionConfig({ radius: 500, falloffType: "none" });
    const enemies = Array.from({ length: 100 }, (_, i) => ({
      id: `e${i}`,
      x: i * 4,
      y: 0,
    }));
    const result = applyExplosion(0, 0, enemies, config);
    expect(result.targets.length).toBeGreaterThan(0);
    expect(result.totalDamage).toBe(result.targets.length * 50);
  });

  it("should handle maxExplosions=1", () => {
    const config = createExplosionConfig();
    let state = createExplosionState(1);
    state = spawnExplosion(state, 0, 0, config);
    state = spawnExplosion(state, 10, 10, config);
    expect(state.explosions).toHaveLength(1);
    expect(state.explosions[0].x).toBe(10);
  });
});
