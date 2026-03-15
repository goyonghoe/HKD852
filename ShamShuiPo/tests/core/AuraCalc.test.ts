import { describe, it, expect } from "vitest";
import {
  createAuraState,
  updateAura,
  getEnemiesInAura,
  applyAuraDamage,
  setRadius,
  setDamage,
  toggleAura,
  isActive,
  getDPS,
  getStats,
  resetStats,
} from "../../src/core/AuraCalc";

// ---------------------------------------------------------------------------
// createAuraState
// ---------------------------------------------------------------------------
describe("createAuraState", () => {
  it("returns default config when called with no args", () => {
    const s = createAuraState();
    expect(s.config.radius).toBe(80);
    expect(s.config.damagePerTick).toBe(5);
    expect(s.config.tickInterval).toBe(500);
    expect(s.config.elementType).toBe("none");
  });

  it("starts active", () => {
    expect(createAuraState().active).toBe(true);
  });

  it("starts with zero tickElapsed", () => {
    expect(createAuraState().tickElapsed).toBe(0);
  });

  it("starts with zero totalDamageDealt", () => {
    expect(createAuraState().totalDamageDealt).toBe(0);
  });

  it("starts with zero totalTicks", () => {
    expect(createAuraState().totalTicks).toBe(0);
  });

  it("accepts partial config — radius only", () => {
    const s = createAuraState({ radius: 120 });
    expect(s.config.radius).toBe(120);
    expect(s.config.damagePerTick).toBe(5);
  });

  it("accepts partial config — damagePerTick only", () => {
    const s = createAuraState({ damagePerTick: 20 });
    expect(s.config.damagePerTick).toBe(20);
    expect(s.config.radius).toBe(80);
  });

  it("accepts partial config — tickInterval only", () => {
    const s = createAuraState({ tickInterval: 1000 });
    expect(s.config.tickInterval).toBe(1000);
  });

  it("accepts partial config — elementType only", () => {
    const s = createAuraState({ elementType: "fire" });
    expect(s.config.elementType).toBe("fire");
  });

  it("accepts full config override", () => {
    const s = createAuraState({
      radius: 200,
      damagePerTick: 50,
      tickInterval: 250,
      elementType: "ice",
    });
    expect(s.config.radius).toBe(200);
    expect(s.config.damagePerTick).toBe(50);
    expect(s.config.tickInterval).toBe(250);
    expect(s.config.elementType).toBe("ice");
  });

  it("returns a new object each call", () => {
    const a = createAuraState();
    const b = createAuraState();
    expect(a).not.toBe(b);
    expect(a.config).not.toBe(b.config);
  });

  it("accepts electric element", () => {
    expect(
      createAuraState({ elementType: "electric" }).config.elementType,
    ).toBe("electric");
  });

  it("accepts poison element", () => {
    expect(createAuraState({ elementType: "poison" }).config.elementType).toBe(
      "poison",
    );
  });
});

// ---------------------------------------------------------------------------
// updateAura
// ---------------------------------------------------------------------------
describe("updateAura", () => {
  it("advances tickElapsed by deltaMs", () => {
    const s = createAuraState();
    const { newState } = updateAura(s, 100);
    expect(newState.tickElapsed).toBe(100);
  });

  it("returns shouldTick=false when interval not reached", () => {
    const s = createAuraState();
    const { shouldTick } = updateAura(s, 200);
    expect(shouldTick).toBe(false);
  });

  it("returns shouldTick=true when interval exactly reached", () => {
    const s = createAuraState(); // tickInterval=500
    const { shouldTick } = updateAura(s, 500);
    expect(shouldTick).toBe(true);
  });

  it("resets tickElapsed after tick (no remainder)", () => {
    const { newState } = updateAura(createAuraState(), 500);
    expect(newState.tickElapsed).toBe(0);
  });

  it("carries over remainder after tick", () => {
    const { newState } = updateAura(createAuraState(), 550);
    expect(newState.tickElapsed).toBe(50);
  });

  it("does not tick when inactive", () => {
    const s = toggleAura(createAuraState()); // now inactive
    const { newState, shouldTick } = updateAura(s, 1000);
    expect(shouldTick).toBe(false);
    expect(newState.tickElapsed).toBe(0);
  });

  it("returns same state reference when inactive", () => {
    const s = toggleAura(createAuraState());
    const { newState } = updateAura(s, 100);
    expect(newState).toBe(s);
  });

  it("accumulates across multiple updates without reaching interval", () => {
    let s = createAuraState();
    ({ newState: s } = updateAura(s, 100));
    ({ newState: s } = updateAura(s, 100));
    ({ newState: s } = updateAura(s, 100));
    expect(s.tickElapsed).toBe(300);
  });

  it("ticks on accumulated updates reaching interval", () => {
    let s = createAuraState();
    ({ newState: s } = updateAura(s, 300));
    const { newState, shouldTick } = updateAura(s, 200);
    expect(shouldTick).toBe(true);
    expect(newState.tickElapsed).toBe(0);
  });

  it("does not mutate original state", () => {
    const s = createAuraState();
    updateAura(s, 100);
    expect(s.tickElapsed).toBe(0);
  });

  it("handles very large delta spanning one interval", () => {
    const { newState, shouldTick } = updateAura(createAuraState(), 1200);
    expect(shouldTick).toBe(true);
    expect(newState.tickElapsed).toBe(700);
  });
});

// ---------------------------------------------------------------------------
// getEnemiesInAura
// ---------------------------------------------------------------------------
describe("getEnemiesInAura", () => {
  const enemies = [
    { id: "a", x: 10, y: 0 },
    { id: "b", x: 100, y: 0 },
    { id: "c", x: 0, y: 50 },
    { id: "d", x: 200, y: 200 },
  ];

  it("returns enemies within radius", () => {
    const hit = getEnemiesInAura(0, 0, 80, enemies);
    const ids = hit.map((e) => e.id);
    expect(ids).toContain("a");
    expect(ids).toContain("c");
  });

  it("excludes enemies outside radius", () => {
    const hit = getEnemiesInAura(0, 0, 80, enemies);
    const ids = hit.map((e) => e.id);
    expect(ids).not.toContain("d");
  });

  it("includes enemy exactly on radius boundary", () => {
    const hit = getEnemiesInAura(0, 0, 100, [{ id: "e", x: 100, y: 0 }]);
    expect(hit).toHaveLength(1);
  });

  it("returns empty array when no enemies in range", () => {
    expect(getEnemiesInAura(0, 0, 5, enemies)).toHaveLength(0);
  });

  it("returns empty array for empty enemy list", () => {
    expect(getEnemiesInAura(0, 0, 100, [])).toHaveLength(0);
  });

  it("works with non-origin player position", () => {
    const hit = getEnemiesInAura(200, 200, 10, enemies);
    const ids = hit.map((e) => e.id);
    expect(ids).toContain("d");
    expect(hit).toHaveLength(1);
  });

  it("uses squared distance (no sqrt needed)", () => {
    // enemy at (60,60) → dist = sqrt(7200) ≈ 84.85
    const hit = getEnemiesInAura(0, 0, 84, [{ id: "f", x: 60, y: 60 }]);
    expect(hit).toHaveLength(0);
    const hit2 = getEnemiesInAura(0, 0, 85, [{ id: "f", x: 60, y: 60 }]);
    expect(hit2).toHaveLength(1);
  });

  it("handles negative coordinates", () => {
    const hit = getEnemiesInAura(-10, -10, 30, [{ id: "g", x: -20, y: -20 }]);
    expect(hit).toHaveLength(1);
  });

  it("does not mutate the enemies array", () => {
    const orig = [...enemies];
    getEnemiesInAura(0, 0, 80, enemies);
    expect(enemies).toEqual(orig);
  });

  it("returns all enemies when radius is very large", () => {
    const hit = getEnemiesInAura(0, 0, 10000, enemies);
    expect(hit).toHaveLength(enemies.length);
  });
});

// ---------------------------------------------------------------------------
// applyAuraDamage
// ---------------------------------------------------------------------------
describe("applyAuraDamage", () => {
  it("adds damagePerTick * hitCount to totalDamageDealt", () => {
    const s = createAuraState({ damagePerTick: 10 });
    const next = applyAuraDamage(s, 3);
    expect(next.totalDamageDealt).toBe(30);
  });

  it("increments totalTicks by 1", () => {
    const next = applyAuraDamage(createAuraState(), 5);
    expect(next.totalTicks).toBe(1);
  });

  it("accumulates damage across multiple calls", () => {
    let s = createAuraState({ damagePerTick: 10 });
    s = applyAuraDamage(s, 2); // 20
    s = applyAuraDamage(s, 3); // 30
    expect(s.totalDamageDealt).toBe(50);
    expect(s.totalTicks).toBe(2);
  });

  it("handles hitCount=0", () => {
    const s = createAuraState({ damagePerTick: 10 });
    const next = applyAuraDamage(s, 0);
    expect(next.totalDamageDealt).toBe(0);
    expect(next.totalTicks).toBe(1);
  });

  it("does not mutate original", () => {
    const s = createAuraState();
    applyAuraDamage(s, 5);
    expect(s.totalDamageDealt).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// setRadius
// ---------------------------------------------------------------------------
describe("setRadius", () => {
  it("updates radius in config", () => {
    const s = setRadius(createAuraState(), 150);
    expect(s.config.radius).toBe(150);
  });

  it("preserves other config fields", () => {
    const s = setRadius(
      createAuraState({ damagePerTick: 20, elementType: "fire" }),
      150,
    );
    expect(s.config.damagePerTick).toBe(20);
    expect(s.config.elementType).toBe("fire");
  });

  it("does not mutate original", () => {
    const orig = createAuraState();
    setRadius(orig, 999);
    expect(orig.config.radius).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// setDamage
// ---------------------------------------------------------------------------
describe("setDamage", () => {
  it("updates damagePerTick in config", () => {
    const s = setDamage(createAuraState(), 25);
    expect(s.config.damagePerTick).toBe(25);
  });

  it("preserves other config fields", () => {
    const s = setDamage(createAuraState({ radius: 120 }), 25);
    expect(s.config.radius).toBe(120);
  });

  it("does not mutate original", () => {
    const orig = createAuraState();
    setDamage(orig, 999);
    expect(orig.config.damagePerTick).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// toggleAura
// ---------------------------------------------------------------------------
describe("toggleAura", () => {
  it("deactivates an active aura", () => {
    const s = toggleAura(createAuraState());
    expect(s.active).toBe(false);
  });

  it("activates an inactive aura", () => {
    const s = toggleAura(toggleAura(createAuraState()));
    expect(s.active).toBe(true);
  });

  it("does not mutate original", () => {
    const orig = createAuraState();
    toggleAura(orig);
    expect(orig.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isActive
// ---------------------------------------------------------------------------
describe("isActive", () => {
  it("returns true for default state", () => {
    expect(isActive(createAuraState())).toBe(true);
  });

  it("returns false after toggle", () => {
    expect(isActive(toggleAura(createAuraState()))).toBe(false);
  });

  it("returns true after double toggle", () => {
    expect(isActive(toggleAura(toggleAura(createAuraState())))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getDPS
// ---------------------------------------------------------------------------
describe("getDPS", () => {
  it("calculates DPS from defaults (5 / 0.5 = 10)", () => {
    expect(getDPS(createAuraState())).toBe(10);
  });

  it("calculates DPS with custom values", () => {
    const s = createAuraState({ damagePerTick: 20, tickInterval: 1000 });
    expect(getDPS(s)).toBe(20);
  });

  it("handles high frequency ticks", () => {
    const s = createAuraState({ damagePerTick: 1, tickInterval: 100 });
    expect(getDPS(s)).toBe(10);
  });

  it("reflects setDamage changes", () => {
    const s = setDamage(createAuraState(), 50);
    expect(getDPS(s)).toBe(100); // 50 / 0.5
  });
});

// ---------------------------------------------------------------------------
// getStats
// ---------------------------------------------------------------------------
describe("getStats", () => {
  it("returns all stat fields", () => {
    const stats = getStats(createAuraState());
    expect(stats).toHaveProperty("totalDamageDealt");
    expect(stats).toHaveProperty("totalTicks");
    expect(stats).toHaveProperty("dps");
    expect(stats).toHaveProperty("radius");
  });

  it("reflects initial zeros", () => {
    const stats = getStats(createAuraState());
    expect(stats.totalDamageDealt).toBe(0);
    expect(stats.totalTicks).toBe(0);
  });

  it("reflects accumulated damage", () => {
    let s = createAuraState({ damagePerTick: 10 });
    s = applyAuraDamage(s, 5);
    const stats = getStats(s);
    expect(stats.totalDamageDealt).toBe(50);
    expect(stats.totalTicks).toBe(1);
  });

  it("returns correct dps", () => {
    expect(getStats(createAuraState()).dps).toBe(10);
  });

  it("returns correct radius", () => {
    const s = setRadius(createAuraState(), 200);
    expect(getStats(s).radius).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// resetStats
// ---------------------------------------------------------------------------
describe("resetStats", () => {
  it("zeroes totalDamageDealt", () => {
    let s = createAuraState({ damagePerTick: 10 });
    s = applyAuraDamage(s, 5);
    s = resetStats(s);
    expect(s.totalDamageDealt).toBe(0);
  });

  it("zeroes totalTicks", () => {
    let s = applyAuraDamage(createAuraState(), 3);
    s = resetStats(s);
    expect(s.totalTicks).toBe(0);
  });

  it("zeroes tickElapsed", () => {
    let s = createAuraState();
    ({ newState: s } = updateAura(s, 200));
    s = resetStats(s);
    expect(s.tickElapsed).toBe(0);
  });

  it("preserves config", () => {
    let s = createAuraState({ radius: 200, elementType: "ice" });
    s = applyAuraDamage(s, 10);
    s = resetStats(s);
    expect(s.config.radius).toBe(200);
    expect(s.config.elementType).toBe("ice");
  });

  it("preserves active state", () => {
    let s = toggleAura(createAuraState());
    s = resetStats(s);
    expect(s.active).toBe(false);
  });

  it("does not mutate original", () => {
    const s = applyAuraDamage(createAuraState(), 5);
    resetStats(s);
    expect(s.totalDamageDealt).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Integration scenarios
// ---------------------------------------------------------------------------
describe("integration", () => {
  it("full tick cycle: update → getEnemies → applyDamage", () => {
    let s = createAuraState({
      damagePerTick: 10,
      tickInterval: 500,
      radius: 100,
    });
    const enemies = [
      { id: "1", x: 50, y: 0 },
      { id: "2", x: 200, y: 0 },
    ];

    // advance to tick
    const { newState, shouldTick } = updateAura(s, 500);
    expect(shouldTick).toBe(true);
    s = newState;

    const hit = getEnemiesInAura(0, 0, s.config.radius, enemies);
    expect(hit).toHaveLength(1);

    s = applyAuraDamage(s, hit.length);
    expect(s.totalDamageDealt).toBe(10);
    expect(s.totalTicks).toBe(1);
  });

  it("multiple ticks accumulate correctly", () => {
    let s = createAuraState({ damagePerTick: 5, tickInterval: 200 });
    const enemies = [{ id: "x", x: 10, y: 10 }];

    for (let i = 0; i < 5; i++) {
      const { newState, shouldTick } = updateAura(s, 200);
      s = newState;
      if (shouldTick) {
        const hit = getEnemiesInAura(0, 0, s.config.radius, enemies);
        s = applyAuraDamage(s, hit.length);
      }
    }

    expect(s.totalTicks).toBe(5);
    expect(s.totalDamageDealt).toBe(25);
  });

  it("toggling off mid-cycle prevents further ticks", () => {
    let s = createAuraState({ tickInterval: 100 });
    ({ newState: s } = updateAura(s, 50));
    s = toggleAura(s); // deactivate
    const { shouldTick } = updateAura(s, 100);
    expect(shouldTick).toBe(false);
  });

  it("stats reflect all operations", () => {
    let s = createAuraState({
      damagePerTick: 8,
      tickInterval: 250,
      radius: 60,
    });
    s = applyAuraDamage(s, 3);
    s = applyAuraDamage(s, 2);
    s = setRadius(s, 120);

    const stats = getStats(s);
    expect(stats.totalDamageDealt).toBe(40); // 8*3 + 8*2
    expect(stats.totalTicks).toBe(2);
    expect(stats.radius).toBe(120);
    expect(stats.dps).toBe(32); // 8 / 0.25
  });

  it("resetStats then re-accumulate", () => {
    let s = createAuraState({ damagePerTick: 10 });
    s = applyAuraDamage(s, 4);
    expect(s.totalDamageDealt).toBe(40);
    s = resetStats(s);
    expect(s.totalDamageDealt).toBe(0);
    s = applyAuraDamage(s, 2);
    expect(s.totalDamageDealt).toBe(20);
    expect(s.totalTicks).toBe(1);
  });
});
