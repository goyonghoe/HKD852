import { describe, it, expect } from "vitest";
import {
  createOrbitalState,
  addOrbital,
  removeOrbital,
  updateOrbitals,
  getOrbitalPosition,
  getAllPositions,
  redistributeAngles,
  setRadius,
  setSpeed,
  getOrbitalCount,
  checkCollision,
} from "../../src/core/OrbitalCalc";

// ─── createOrbitalState ─────────────────────────────────────────

describe("createOrbitalState", () => {
  it("creates state with default config", () => {
    const state = createOrbitalState();
    expect(state.config.baseRadius).toBe(80);
    expect(state.config.baseSpeed).toBe(2.0);
    expect(state.config.baseDamage).toBe(15);
    expect(state.config.baseSize).toBe(16);
    expect(state.maxOrbitals).toBe(8);
  });

  it("creates state with empty orbitals array", () => {
    const state = createOrbitalState();
    expect(state.orbitals).toHaveLength(0);
  });

  it("accepts partial config overrides", () => {
    const state = createOrbitalState({ baseRadius: 120, baseDamage: 30 });
    expect(state.config.baseRadius).toBe(120);
    expect(state.config.baseDamage).toBe(30);
    expect(state.config.baseSpeed).toBe(2.0);
    expect(state.config.baseSize).toBe(16);
  });

  it("accepts custom maxOrbitals", () => {
    const state = createOrbitalState({}, 12);
    expect(state.maxOrbitals).toBe(12);
  });

  it("accepts zero maxOrbitals", () => {
    const state = createOrbitalState({}, 0);
    expect(state.maxOrbitals).toBe(0);
  });

  it("applies all config overrides simultaneously", () => {
    const state = createOrbitalState({
      baseRadius: 100,
      baseSpeed: 3.0,
      baseDamage: 25,
      baseSize: 24,
    });
    expect(state.config.baseRadius).toBe(100);
    expect(state.config.baseSpeed).toBe(3.0);
    expect(state.config.baseDamage).toBe(25);
    expect(state.config.baseSize).toBe(24);
  });

  it("returns a new object each time", () => {
    const a = createOrbitalState();
    const b = createOrbitalState();
    expect(a).not.toBe(b);
  });
});

// ─── addOrbital ─────────────────────────────────────────────────

describe("addOrbital", () => {
  it("adds one orbital to empty state", () => {
    const state = createOrbitalState();
    const next = addOrbital(state);
    expect(next.orbitals).toHaveLength(1);
  });

  it("first orbital has angle 0", () => {
    const state = createOrbitalState();
    const next = addOrbital(state);
    expect(next.orbitals[0].angle).toBeCloseTo(0);
  });

  it("assigns config values to new orbital", () => {
    const state = createOrbitalState({ baseRadius: 100, baseDamage: 20 });
    const next = addOrbital(state);
    expect(next.orbitals[0].radius).toBe(100);
    expect(next.orbitals[0].damage).toBe(20);
    expect(next.orbitals[0].speed).toBe(2.0);
    expect(next.orbitals[0].size).toBe(16);
  });

  it("new orbital is active", () => {
    const state = createOrbitalState();
    const next = addOrbital(state);
    expect(next.orbitals[0].active).toBe(true);
  });

  it("two orbitals are spaced PI apart", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    expect(state.orbitals).toHaveLength(2);
    const diff = Math.abs(state.orbitals[1].angle - state.orbitals[0].angle);
    expect(diff).toBeCloseTo(Math.PI);
  });

  it("three orbitals are spaced 2PI/3 apart", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = addOrbital(state);
    expect(state.orbitals).toHaveLength(3);
    const expected = (2 * Math.PI) / 3;
    expect(state.orbitals[1].angle - state.orbitals[0].angle).toBeCloseTo(
      expected,
    );
    expect(state.orbitals[2].angle - state.orbitals[1].angle).toBeCloseTo(
      expected,
    );
  });

  it("does not exceed maxOrbitals", () => {
    let state = createOrbitalState({}, 2);
    state = addOrbital(state);
    state = addOrbital(state);
    const capped = addOrbital(state);
    expect(capped.orbitals).toHaveLength(2);
  });

  it("returns same state when at max capacity", () => {
    let state = createOrbitalState({}, 1);
    state = addOrbital(state);
    const same = addOrbital(state);
    expect(same).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = createOrbitalState();
    addOrbital(state);
    expect(state.orbitals).toHaveLength(0);
  });

  it("generates unique IDs for each orbital", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = addOrbital(state);
    const ids = state.orbitals.map((o) => o.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(3);
  });

  it("four orbitals are evenly spaced at PI/2 intervals", () => {
    let state = createOrbitalState();
    for (let i = 0; i < 4; i++) state = addOrbital(state);
    const expected = Math.PI / 2;
    for (let i = 1; i < 4; i++) {
      expect(state.orbitals[i].angle - state.orbitals[i - 1].angle).toBeCloseTo(
        expected,
      );
    }
  });

  it("cannot add to state with maxOrbitals=0", () => {
    const state = createOrbitalState({}, 0);
    const same = addOrbital(state);
    expect(same).toBe(state);
    expect(getOrbitalCount(same)).toBe(0);
  });
});

// ─── removeOrbital ──────────────────────────────────────────────

describe("removeOrbital", () => {
  it("removes orbital by id", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const id = state.orbitals[0].id;
    const next = removeOrbital(state, id);
    expect(next.orbitals).toHaveLength(0);
  });

  it("returns same state if id not found", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const same = removeOrbital(state, "nonexistent");
    expect(same).toBe(state);
  });

  it("does not mutate original state", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const id = state.orbitals[0].id;
    removeOrbital(state, id);
    expect(state.orbitals).toHaveLength(1);
  });

  it("removes correct orbital from multiple", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = addOrbital(state);
    const idToRemove = state.orbitals[1].id;
    const next = removeOrbital(state, idToRemove);
    expect(next.orbitals).toHaveLength(2);
    expect(next.orbitals.find((o) => o.id === idToRemove)).toBeUndefined();
  });

  it("preserves remaining orbitals", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    const keepId = state.orbitals[0].id;
    const removeId = state.orbitals[1].id;
    const next = removeOrbital(state, removeId);
    expect(next.orbitals[0].id).toBe(keepId);
  });

  it("removing from empty state returns same state", () => {
    const state = createOrbitalState();
    const same = removeOrbital(state, "any");
    expect(same).toBe(state);
  });
});

// ─── updateOrbitals ─────────────────────────────────────────────

describe("updateOrbitals", () => {
  it("advances angle based on speed and delta", () => {
    let state = createOrbitalState({ baseSpeed: 1.0 });
    state = addOrbital(state);
    const initial = state.orbitals[0].angle;
    const next = updateOrbitals(state, 1000);
    expect(next.orbitals[0].angle).toBeCloseTo(initial + 1.0);
  });

  it("handles fractional delta", () => {
    let state = createOrbitalState({ baseSpeed: 2.0 });
    state = addOrbital(state);
    const initial = state.orbitals[0].angle;
    const next = updateOrbitals(state, 500);
    expect(next.orbitals[0].angle).toBeCloseTo(initial + 1.0);
  });

  it("zero delta does not change angles", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const initial = state.orbitals[0].angle;
    const next = updateOrbitals(state, 0);
    expect(next.orbitals[0].angle).toBeCloseTo(initial);
  });

  it("does not mutate original state", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const originalAngle = state.orbitals[0].angle;
    updateOrbitals(state, 1000);
    expect(state.orbitals[0].angle).toBeCloseTo(originalAngle);
  });

  it("updates all orbitals independently", () => {
    let state = createOrbitalState({ baseSpeed: 1.0 });
    state = addOrbital(state);
    state = addOrbital(state);
    const angles = state.orbitals.map((o) => o.angle);
    const next = updateOrbitals(state, 1000);
    next.orbitals.forEach((orb, i) => {
      expect(orb.angle).toBeCloseTo(angles[i] + 1.0);
    });
  });

  it("handles empty state gracefully", () => {
    const state = createOrbitalState();
    const next = updateOrbitals(state, 1000);
    expect(next.orbitals).toHaveLength(0);
  });

  it("handles large delta values", () => {
    let state = createOrbitalState({ baseSpeed: 1.0 });
    state = addOrbital(state);
    const next = updateOrbitals(state, 60000);
    expect(next.orbitals[0].angle).toBeCloseTo(60.0);
  });

  it("accumulates angle over multiple updates", () => {
    let state = createOrbitalState({ baseSpeed: 2.0 });
    state = addOrbital(state);
    state = updateOrbitals(state, 500);
    state = updateOrbitals(state, 500);
    expect(state.orbitals[0].angle).toBeCloseTo(2.0);
  });
});

// ─── getOrbitalPosition ─────────────────────────────────────────

describe("getOrbitalPosition", () => {
  it("returns center + radius at angle 0", () => {
    let state = createOrbitalState({ baseRadius: 80 });
    state = addOrbital(state);
    const pos = getOrbitalPosition(state.orbitals[0], 360, 640);
    expect(pos.x).toBeCloseTo(440);
    expect(pos.y).toBeCloseTo(640);
  });

  it("returns correct position at PI/2", () => {
    const orbital = {
      id: "test",
      angle: Math.PI / 2,
      radius: 100,
      speed: 1,
      damage: 10,
      size: 8,
      active: true,
    };
    const pos = getOrbitalPosition(orbital, 0, 0);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(100);
  });

  it("returns correct position at PI", () => {
    const orbital = {
      id: "test",
      angle: Math.PI,
      radius: 50,
      speed: 1,
      damage: 10,
      size: 8,
      active: true,
    };
    const pos = getOrbitalPosition(orbital, 100, 100);
    expect(pos.x).toBeCloseTo(50);
    expect(pos.y).toBeCloseTo(100);
  });

  it("handles zero radius", () => {
    const orbital = {
      id: "test",
      angle: 1.5,
      radius: 0,
      speed: 1,
      damage: 10,
      size: 8,
      active: true,
    };
    const pos = getOrbitalPosition(orbital, 200, 300);
    expect(pos.x).toBeCloseTo(200);
    expect(pos.y).toBeCloseTo(300);
  });

  it("handles negative center coordinates", () => {
    const orbital = {
      id: "test",
      angle: 0,
      radius: 50,
      speed: 1,
      damage: 10,
      size: 8,
      active: true,
    };
    const pos = getOrbitalPosition(orbital, -100, -200);
    expect(pos.x).toBeCloseTo(-50);
    expect(pos.y).toBeCloseTo(-200);
  });
});

// ─── getAllPositions ─────────────────────────────────────────────

describe("getAllPositions", () => {
  it("returns empty array for empty state", () => {
    const state = createOrbitalState();
    const positions = getAllPositions(state, 360, 640);
    expect(positions).toHaveLength(0);
  });

  it("returns positions for all orbitals", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    const positions = getAllPositions(state, 360, 640);
    expect(positions).toHaveLength(2);
  });

  it("includes orbital id in each position", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const positions = getAllPositions(state, 360, 640);
    expect(positions[0].id).toBe(state.orbitals[0].id);
  });

  it("positions match individual getOrbitalPosition calls", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = addOrbital(state);
    const cx = 360;
    const cy = 640;
    const all = getAllPositions(state, cx, cy);
    state.orbitals.forEach((orb, i) => {
      const single = getOrbitalPosition(orb, cx, cy);
      expect(all[i].x).toBeCloseTo(single.x);
      expect(all[i].y).toBeCloseTo(single.y);
    });
  });
});

// ─── redistributeAngles ─────────────────────────────────────────

describe("redistributeAngles", () => {
  it("returns same state for empty orbitals", () => {
    const state = createOrbitalState();
    const same = redistributeAngles(state);
    expect(same).toBe(state);
  });

  it("single orbital gets angle 0", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = updateOrbitals(state, 5000);
    const redistributed = redistributeAngles(state);
    expect(redistributed.orbitals[0].angle).toBeCloseTo(0);
  });

  it("two orbitals get 0 and PI", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = updateOrbitals(state, 3000);
    const redistributed = redistributeAngles(state);
    expect(redistributed.orbitals[0].angle).toBeCloseTo(0);
    expect(redistributed.orbitals[1].angle).toBeCloseTo(Math.PI);
  });

  it("does not mutate original state", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = updateOrbitals(state, 5000);
    const originalAngle = state.orbitals[0].angle;
    redistributeAngles(state);
    expect(state.orbitals[0].angle).toBeCloseTo(originalAngle);
  });

  it("preserves orbital count", () => {
    let state = createOrbitalState();
    for (let i = 0; i < 5; i++) state = addOrbital(state);
    state = updateOrbitals(state, 2000);
    const redistributed = redistributeAngles(state);
    expect(redistributed.orbitals).toHaveLength(5);
  });

  it("five orbitals are spaced at 2PI/5 intervals", () => {
    let state = createOrbitalState();
    for (let i = 0; i < 5; i++) state = addOrbital(state);
    state = updateOrbitals(state, 7777);
    const redistributed = redistributeAngles(state);
    const step = (2 * Math.PI) / 5;
    for (let i = 0; i < 5; i++) {
      expect(redistributed.orbitals[i].angle).toBeCloseTo(i * step);
    }
  });
});

// ─── setRadius ──────────────────────────────────────────────────

describe("setRadius", () => {
  it("updates all orbitals to new radius", () => {
    let state = createOrbitalState({ baseRadius: 80 });
    state = addOrbital(state);
    state = addOrbital(state);
    const next = setRadius(state, 120);
    next.orbitals.forEach((orb) => {
      expect(orb.radius).toBe(120);
    });
  });

  it("does not mutate original state", () => {
    let state = createOrbitalState({ baseRadius: 80 });
    state = addOrbital(state);
    setRadius(state, 120);
    expect(state.orbitals[0].radius).toBe(80);
  });

  it("handles empty state", () => {
    const state = createOrbitalState();
    const next = setRadius(state, 200);
    expect(next.orbitals).toHaveLength(0);
  });

  it("allows zero radius", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const next = setRadius(state, 0);
    expect(next.orbitals[0].radius).toBe(0);
  });

  it("preserves other orbital properties", () => {
    let state = createOrbitalState({ baseDamage: 25 });
    state = addOrbital(state);
    const next = setRadius(state, 150);
    expect(next.orbitals[0].damage).toBe(25);
    expect(next.orbitals[0].speed).toBe(2.0);
    expect(next.orbitals[0].size).toBe(16);
  });
});

// ─── setSpeed ───────────────────────────────────────────────────

describe("setSpeed", () => {
  it("updates all orbitals to new speed", () => {
    let state = createOrbitalState({ baseSpeed: 2.0 });
    state = addOrbital(state);
    state = addOrbital(state);
    const next = setSpeed(state, 5.0);
    next.orbitals.forEach((orb) => {
      expect(orb.speed).toBe(5.0);
    });
  });

  it("does not mutate original state", () => {
    let state = createOrbitalState({ baseSpeed: 2.0 });
    state = addOrbital(state);
    setSpeed(state, 5.0);
    expect(state.orbitals[0].speed).toBe(2.0);
  });

  it("handles empty state", () => {
    const state = createOrbitalState();
    const next = setSpeed(state, 10.0);
    expect(next.orbitals).toHaveLength(0);
  });

  it("allows zero speed (stationary orbitals)", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const next = setSpeed(state, 0);
    expect(next.orbitals[0].speed).toBe(0);
    const updated = updateOrbitals(next, 1000);
    expect(updated.orbitals[0].angle).toBeCloseTo(next.orbitals[0].angle);
  });

  it("allows negative speed (reverse rotation)", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    const next = setSpeed(state, -2.0);
    const initialAngle = next.orbitals[0].angle;
    const updated = updateOrbitals(next, 1000);
    expect(updated.orbitals[0].angle).toBeLessThan(initialAngle);
  });

  it("preserves other orbital properties", () => {
    let state = createOrbitalState({ baseRadius: 100, baseDamage: 30 });
    state = addOrbital(state);
    const next = setSpeed(state, 8.0);
    expect(next.orbitals[0].radius).toBe(100);
    expect(next.orbitals[0].damage).toBe(30);
  });
});

// ─── getOrbitalCount ────────────────────────────────────────────

describe("getOrbitalCount", () => {
  it("returns 0 for empty state", () => {
    const state = createOrbitalState();
    expect(getOrbitalCount(state)).toBe(0);
  });

  it("returns correct count after adding", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    state = addOrbital(state);
    expect(getOrbitalCount(state)).toBe(3);
  });

  it("returns correct count after removing", () => {
    let state = createOrbitalState();
    state = addOrbital(state);
    state = addOrbital(state);
    const id = state.orbitals[0].id;
    state = removeOrbital(state, id);
    expect(getOrbitalCount(state)).toBe(1);
  });
});

// ─── checkCollision ─────────────────────────────────────────────

describe("checkCollision", () => {
  it("detects overlapping circles", () => {
    expect(checkCollision(0, 0, 10, 15, 0, 10)).toBe(true);
  });

  it("detects exact touching circles", () => {
    expect(checkCollision(0, 0, 10, 20, 0, 10)).toBe(true);
  });

  it("returns false for separated circles", () => {
    expect(checkCollision(0, 0, 10, 25, 0, 10)).toBe(false);
  });

  it("detects collision at same position", () => {
    expect(checkCollision(100, 100, 5, 100, 100, 5)).toBe(true);
  });

  it("handles zero size orbital", () => {
    expect(checkCollision(10, 10, 0, 10, 10, 5)).toBe(true);
    expect(checkCollision(10, 10, 0, 20, 10, 5)).toBe(false);
  });

  it("handles diagonal distance", () => {
    // distance = sqrt(3^2 + 4^2) = 5, radii sum = 6 → collision
    expect(checkCollision(0, 0, 3, 3, 4, 3)).toBe(true);
  });

  it("handles diagonal just outside range", () => {
    // distance = sqrt(3^2 + 4^2) = 5, radii sum = 4 → no collision
    expect(checkCollision(0, 0, 2, 3, 4, 2)).toBe(false);
  });

  it("handles negative coordinates", () => {
    expect(checkCollision(-10, -10, 5, -15, -10, 5)).toBe(true);
  });

  it("handles large distances", () => {
    expect(checkCollision(0, 0, 10, 1000, 1000, 10)).toBe(false);
  });

  it("both zero size at same point collide", () => {
    expect(checkCollision(5, 5, 0, 5, 5, 0)).toBe(true);
  });

  it("both zero size at different points do not collide", () => {
    expect(checkCollision(5, 5, 0, 6, 5, 0)).toBe(false);
  });
});

// ─── Integration / immutability ─────────────────────────────────

describe("integration", () => {
  it("full lifecycle: create → add → update → position → remove", () => {
    let state = createOrbitalState({ baseRadius: 60, baseSpeed: Math.PI });
    state = addOrbital(state);
    state = addOrbital(state);
    expect(getOrbitalCount(state)).toBe(2);

    state = updateOrbitals(state, 1000);
    const positions = getAllPositions(state, 360, 640);
    expect(positions).toHaveLength(2);

    const id = state.orbitals[0].id;
    state = removeOrbital(state, id);
    expect(getOrbitalCount(state)).toBe(1);
  });

  it("setRadius then getAllPositions reflects new radius", () => {
    let state = createOrbitalState({ baseRadius: 80 });
    state = addOrbital(state);
    state = setRadius(state, 200);
    const positions = getAllPositions(state, 0, 0);
    // angle is 0, so x = cos(0)*200 = 200
    expect(positions[0].x).toBeCloseTo(200);
    expect(positions[0].y).toBeCloseTo(0);
  });

  it("setSpeed affects subsequent updateOrbitals", () => {
    let state = createOrbitalState({ baseSpeed: 1.0 });
    state = addOrbital(state);
    state = setSpeed(state, 4.0);
    const initial = state.orbitals[0].angle;
    state = updateOrbitals(state, 1000);
    expect(state.orbitals[0].angle).toBeCloseTo(initial + 4.0);
  });

  it("add-remove-add allows re-adding up to max", () => {
    let state = createOrbitalState({}, 2);
    state = addOrbital(state);
    state = addOrbital(state);
    expect(getOrbitalCount(state)).toBe(2);
    const id = state.orbitals[0].id;
    state = removeOrbital(state, id);
    expect(getOrbitalCount(state)).toBe(1);
    state = addOrbital(state);
    expect(getOrbitalCount(state)).toBe(2);
  });

  it("redistributeAngles after removal evenly spaces", () => {
    let state = createOrbitalState();
    for (let i = 0; i < 4; i++) state = addOrbital(state);
    state = removeOrbital(state, state.orbitals[1].id);
    state = redistributeAngles(state);
    const step = (2 * Math.PI) / 3;
    for (let i = 0; i < 3; i++) {
      expect(state.orbitals[i].angle).toBeCloseTo(i * step);
    }
  });

  it("collision check with actual orbital positions", () => {
    let state = createOrbitalState({ baseRadius: 80, baseSize: 10 });
    state = addOrbital(state);
    const pos = getOrbitalPosition(state.orbitals[0], 360, 640);
    // orbital at (440, 640) with size 10, target at (445, 640) with size 10
    expect(checkCollision(pos.x, pos.y, 10, 445, 640, 10)).toBe(true);
    // target far away
    expect(checkCollision(pos.x, pos.y, 10, 600, 640, 10)).toBe(false);
  });

  it("config is preserved through all operations", () => {
    const cfg = {
      baseRadius: 99,
      baseSpeed: 3.5,
      baseDamage: 42,
      baseSize: 20,
    };
    let state = createOrbitalState(cfg);
    state = addOrbital(state);
    state = updateOrbitals(state, 1000);
    state = setRadius(state, 150);
    state = setSpeed(state, 7.0);
    state = redistributeAngles(state);
    expect(state.config).toEqual(cfg);
  });
});
