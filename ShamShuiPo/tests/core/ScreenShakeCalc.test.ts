import { describe, it, expect } from "vitest";
import {
  createShakeState,
  addShake,
  updateShakes,
  getOffset,
  getTotalIntensity,
  getActiveShakeCount,
  clearShakes,
  isShaking,
  getDecayedIntensity,
} from "../../src/core/ScreenShakeCalc";

// ─── createShakeState ───────────────────────────────────────────────

describe("createShakeState", () => {
  it("returns default config when called with no args", () => {
    const s = createShakeState();
    expect(s.config.maxIntensity).toBe(20);
    expect(s.config.decayRate).toBe(5.0);
    expect(s.config.minIntensity).toBe(0.5);
  });

  it("starts with empty shakes array", () => {
    const s = createShakeState();
    expect(s.shakes).toEqual([]);
  });

  it("starts with nextId = 1", () => {
    const s = createShakeState();
    expect(s.nextId).toBe(1);
  });

  it("merges partial config overrides", () => {
    const s = createShakeState({ maxIntensity: 50 });
    expect(s.config.maxIntensity).toBe(50);
    expect(s.config.decayRate).toBe(5.0);
    expect(s.config.minIntensity).toBe(0.5);
  });

  it("overrides decayRate", () => {
    const s = createShakeState({ decayRate: 10 });
    expect(s.config.decayRate).toBe(10);
  });

  it("overrides minIntensity", () => {
    const s = createShakeState({ minIntensity: 1.0 });
    expect(s.config.minIntensity).toBe(1.0);
  });

  it("overrides all config fields", () => {
    const s = createShakeState({
      maxIntensity: 100,
      decayRate: 2.0,
      minIntensity: 0.1,
    });
    expect(s.config.maxIntensity).toBe(100);
    expect(s.config.decayRate).toBe(2.0);
    expect(s.config.minIntensity).toBe(0.1);
  });
});

// ─── addShake ───────────────────────────────────────────────────────

describe("addShake", () => {
  it("adds a shake to empty state", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(s.shakes).toHaveLength(1);
    expect(s.shakes[0].intensity).toBe(10);
    expect(s.shakes[0].duration).toBe(500);
  });

  it("assigns sequential ids", () => {
    let s = createShakeState();
    s = addShake(s, 5, 300);
    s = addShake(s, 8, 400);
    expect(s.shakes[0].id).toBe(1);
    expect(s.shakes[1].id).toBe(2);
    expect(s.nextId).toBe(3);
  });

  it("defaults frequency to 30", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(s.shakes[0].frequency).toBe(30);
  });

  it("accepts custom frequency", () => {
    const s = addShake(createShakeState(), 10, 500, 60);
    expect(s.shakes[0].frequency).toBe(60);
  });

  it("starts with elapsed = 0", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(s.shakes[0].elapsed).toBe(0);
  });

  it("caps intensity at maxIntensity", () => {
    const s = addShake(createShakeState({ maxIntensity: 15 }), 25, 500);
    expect(s.shakes[0].intensity).toBe(15);
  });

  it("does not modify original state", () => {
    const original = createShakeState();
    const modified = addShake(original, 10, 500);
    expect(original.shakes).toHaveLength(0);
    expect(modified.shakes).toHaveLength(1);
  });

  it("clamps negative intensity to 0", () => {
    const s = addShake(createShakeState(), -5, 500);
    expect(s.shakes[0].intensity).toBe(0);
  });

  it("can add multiple shakes", () => {
    let s = createShakeState();
    s = addShake(s, 5, 200);
    s = addShake(s, 10, 300);
    s = addShake(s, 15, 400);
    expect(s.shakes).toHaveLength(3);
  });
});

// ─── getDecayedIntensity ────────────────────────────────────────────

describe("getDecayedIntensity", () => {
  it("returns original intensity at deltaMs = 0", () => {
    expect(getDecayedIntensity(10, 5.0, 0)).toBe(10);
  });

  it("decays over time with exponential function", () => {
    const result = getDecayedIntensity(10, 5.0, 1000);
    const expected = 10 * Math.exp(-5.0);
    expect(result).toBeCloseTo(expected, 10);
  });

  it("returns smaller value for larger deltaMs", () => {
    const short = getDecayedIntensity(10, 5.0, 100);
    const long = getDecayedIntensity(10, 5.0, 500);
    expect(long).toBeLessThan(short);
  });

  it("returns smaller value for larger decayRate", () => {
    const slow = getDecayedIntensity(10, 1.0, 500);
    const fast = getDecayedIntensity(10, 10.0, 500);
    expect(fast).toBeLessThan(slow);
  });

  it("handles zero decayRate (no decay)", () => {
    expect(getDecayedIntensity(10, 0, 1000)).toBe(10);
  });

  it("handles zero intensity", () => {
    expect(getDecayedIntensity(0, 5.0, 500)).toBe(0);
  });

  it("handles very small deltaMs", () => {
    const result = getDecayedIntensity(10, 5.0, 1);
    expect(result).toBeCloseTo(10, 1);
    expect(result).toBeLessThan(10);
  });

  it("never goes negative", () => {
    const result = getDecayedIntensity(10, 100, 10000);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ─── updateShakes ───────────────────────────────────────────────────

describe("updateShakes", () => {
  it("returns empty shakes when no shakes present", () => {
    const s = updateShakes(createShakeState(), 16);
    expect(s.shakes).toHaveLength(0);
  });

  it("advances elapsed time", () => {
    let s = addShake(createShakeState({ decayRate: 0.1 }), 10, 1000);
    s = updateShakes(s, 100);
    expect(s.shakes[0].elapsed).toBe(100);
  });

  it("decays intensity over time", () => {
    let s = addShake(createShakeState(), 10, 2000);
    s = updateShakes(s, 100);
    expect(s.shakes[0].intensity).toBeLessThan(10);
  });

  it("removes shakes that exceed duration", () => {
    let s = addShake(createShakeState({ decayRate: 0 }), 10, 500);
    s = updateShakes(s, 600);
    expect(s.shakes).toHaveLength(0);
  });

  it("removes shakes below minIntensity threshold", () => {
    let s = addShake(
      createShakeState({ decayRate: 100, minIntensity: 1 }),
      5,
      10000,
    );
    s = updateShakes(s, 1000);
    expect(s.shakes).toHaveLength(0);
  });

  it("keeps shakes above threshold and within duration", () => {
    let s = addShake(createShakeState({ decayRate: 0.01 }), 20, 5000);
    s = updateShakes(s, 16);
    expect(s.shakes).toHaveLength(1);
  });

  it("does not modify original state", () => {
    const original = addShake(createShakeState(), 10, 1000);
    const updated = updateShakes(original, 100);
    expect(original.shakes[0].elapsed).toBe(0);
    expect(updated.shakes[0].elapsed).toBe(100);
  });

  it("handles multiple updates sequentially", () => {
    let s = addShake(createShakeState({ decayRate: 0.5 }), 10, 2000);
    s = updateShakes(s, 100);
    s = updateShakes(s, 100);
    expect(s.shakes[0].elapsed).toBe(200);
  });

  it("removes exact-duration shakes", () => {
    let s = addShake(createShakeState({ decayRate: 0 }), 10, 500);
    s = updateShakes(s, 500);
    expect(s.shakes).toHaveLength(0);
  });

  it("processes multiple shakes independently", () => {
    let s = createShakeState({ decayRate: 0.01 });
    s = addShake(s, 10, 200);
    s = addShake(s, 15, 1000);
    s = updateShakes(s, 300);
    // First shake expired (300 >= 200), second still active
    expect(s.shakes).toHaveLength(1);
    expect(s.shakes[0].id).toBe(2);
  });
});

// ─── getOffset ──────────────────────────────────────────────────────

describe("getOffset", () => {
  it("returns {0,0} when no shakes", () => {
    const s = createShakeState();
    const offset = getOffset(s);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it("returns non-zero offset when shakes active", () => {
    const s = addShake(createShakeState(), 10, 500);
    const rng = () => 0.5;
    const offset = getOffset(s, rng);
    const dist = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    expect(dist).toBeGreaterThan(0);
  });

  it("uses provided rng function", () => {
    const s = addShake(createShakeState(), 10, 500);
    let calls = 0;
    const rng = () => {
      calls++;
      return 0.5;
    };
    getOffset(s, rng);
    expect(calls).toBeGreaterThan(0);
  });

  it("produces deterministic output with fixed rng", () => {
    const s = addShake(createShakeState(), 10, 500);
    const rng = () => 0.5;
    const a = getOffset(s, rng);
    const b = getOffset(s, rng);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
  });

  it("caps offset magnitude at maxIntensity", () => {
    let s = createShakeState({ maxIntensity: 10 });
    // Add many large shakes
    for (let i = 0; i < 10; i++) {
      s = addShake(s, 10, 500);
    }
    // rng=1 would give max displacement per shake
    const rng = () => 0.99;
    const offset = getOffset(s, rng);
    const dist = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    expect(dist).toBeLessThanOrEqual(10 + 0.001);
  });

  it("combines offsets from multiple shakes", () => {
    let s = createShakeState({ maxIntensity: 100 });
    s = addShake(s, 5, 500);
    s = addShake(s, 5, 500);
    const singleShake = addShake(
      createShakeState({ maxIntensity: 100 }),
      5,
      500,
    );
    const singleOffset = getOffset(singleShake, () => 0.25);
    const multiOffset = getOffset(s, () => 0.25);
    // Two shakes should generally produce larger offset than one
    // (with same rng they produce exactly double)
    const singleDist = Math.sqrt(singleOffset.x ** 2 + singleOffset.y ** 2);
    const multiDist = Math.sqrt(multiOffset.x ** 2 + multiOffset.y ** 2);
    expect(multiDist).toBeCloseTo(singleDist * 2, 5);
  });

  it("returns zero-length offset when intensity is 0", () => {
    const s = addShake(createShakeState(), 0, 500);
    const offset = getOffset(s, () => 0.5);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });
});

// ─── getTotalIntensity ──────────────────────────────────────────────

describe("getTotalIntensity", () => {
  it("returns 0 for empty state", () => {
    expect(getTotalIntensity(createShakeState())).toBe(0);
  });

  it("returns single shake intensity", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(getTotalIntensity(s)).toBe(10);
  });

  it("sums multiple shake intensities", () => {
    let s = createShakeState({ maxIntensity: 100 });
    s = addShake(s, 5, 500);
    s = addShake(s, 8, 500);
    expect(getTotalIntensity(s)).toBe(13);
  });

  it("caps total at maxIntensity", () => {
    let s = createShakeState({ maxIntensity: 10 });
    s = addShake(s, 8, 500);
    s = addShake(s, 8, 500);
    // 8 + 8 = 16 but each capped at 10, so total = min(10+10, 10)
    // Wait: each is capped at addShake level, so both are 8 (under 10)
    // total = min(8+8, 10) = 10
    expect(getTotalIntensity(s)).toBe(10);
  });

  it("handles intensity of zero", () => {
    const s = addShake(createShakeState(), 0, 500);
    expect(getTotalIntensity(s)).toBe(0);
  });
});

// ─── getActiveShakeCount ────────────────────────────────────────────

describe("getActiveShakeCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActiveShakeCount(createShakeState())).toBe(0);
  });

  it("returns 1 after adding one shake", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(getActiveShakeCount(s)).toBe(1);
  });

  it("returns correct count after adding multiple shakes", () => {
    let s = createShakeState();
    s = addShake(s, 5, 200);
    s = addShake(s, 10, 300);
    s = addShake(s, 15, 400);
    expect(getActiveShakeCount(s)).toBe(3);
  });

  it("decreases after shakes expire", () => {
    let s = createShakeState({ decayRate: 0.01 });
    s = addShake(s, 10, 100);
    s = addShake(s, 10, 500);
    s = updateShakes(s, 200);
    expect(getActiveShakeCount(s)).toBe(1);
  });

  it("returns 0 after all shakes expire", () => {
    let s = createShakeState({ decayRate: 0 });
    s = addShake(s, 10, 100);
    s = updateShakes(s, 200);
    expect(getActiveShakeCount(s)).toBe(0);
  });
});

// ─── clearShakes ────────────────────────────────────────────────────

describe("clearShakes", () => {
  it("returns empty shakes from empty state", () => {
    const s = clearShakes(createShakeState());
    expect(s.shakes).toHaveLength(0);
  });

  it("removes all active shakes", () => {
    let s = createShakeState();
    s = addShake(s, 10, 500);
    s = addShake(s, 15, 600);
    s = clearShakes(s);
    expect(s.shakes).toHaveLength(0);
  });

  it("preserves config after clearing", () => {
    let s = createShakeState({ maxIntensity: 50 });
    s = addShake(s, 10, 500);
    s = clearShakes(s);
    expect(s.config.maxIntensity).toBe(50);
  });

  it("preserves nextId after clearing", () => {
    let s = createShakeState();
    s = addShake(s, 10, 500);
    s = addShake(s, 15, 600);
    const nextIdBefore = s.nextId;
    s = clearShakes(s);
    expect(s.nextId).toBe(nextIdBefore);
  });

  it("does not modify original state", () => {
    const original = addShake(createShakeState(), 10, 500);
    clearShakes(original);
    expect(original.shakes).toHaveLength(1);
  });
});

// ─── isShaking ──────────────────────────────────────────────────────

describe("isShaking", () => {
  it("returns false for empty state", () => {
    expect(isShaking(createShakeState())).toBe(false);
  });

  it("returns true after adding a shake", () => {
    const s = addShake(createShakeState(), 10, 500);
    expect(isShaking(s)).toBe(true);
  });

  it("returns false after all shakes expire", () => {
    let s = addShake(createShakeState({ decayRate: 0 }), 10, 100);
    s = updateShakes(s, 200);
    expect(isShaking(s)).toBe(false);
  });

  it("returns false after clearShakes", () => {
    let s = addShake(createShakeState(), 10, 500);
    s = clearShakes(s);
    expect(isShaking(s)).toBe(false);
  });

  it("returns true when at least one shake remains", () => {
    let s = createShakeState({ decayRate: 0.01 });
    s = addShake(s, 10, 100);
    s = addShake(s, 10, 1000);
    s = updateShakes(s, 200);
    expect(isShaking(s)).toBe(true);
  });
});

// ─── integration / edge cases ───────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: add, update, decay, expire", () => {
    let s = createShakeState({ decayRate: 2.0, minIntensity: 0.1 });
    s = addShake(s, 10, 2000);
    expect(isShaking(s)).toBe(true);

    // Update a few frames
    for (let i = 0; i < 10; i++) {
      s = updateShakes(s, 16);
    }
    expect(isShaking(s)).toBe(true);
    expect(s.shakes[0].intensity).toBeLessThan(10);

    // Large time jump to expire
    s = updateShakes(s, 5000);
    expect(isShaking(s)).toBe(false);
  });

  it("add shake after clear resets properly", () => {
    let s = createShakeState();
    s = addShake(s, 10, 500);
    s = clearShakes(s);
    s = addShake(s, 5, 300);
    expect(getActiveShakeCount(s)).toBe(1);
    expect(s.shakes[0].intensity).toBe(5);
  });

  it("simultaneous shakes combine intensity", () => {
    let s = createShakeState({ maxIntensity: 50 });
    s = addShake(s, 10, 1000);
    s = addShake(s, 15, 1000);
    expect(getTotalIntensity(s)).toBe(25);
  });

  it("getOffset returns {0,0} after clear", () => {
    let s = addShake(createShakeState(), 10, 500);
    s = clearShakes(s);
    expect(getOffset(s)).toEqual({ x: 0, y: 0 });
  });

  it("zero-duration shake is immediately removed on update", () => {
    let s = addShake(createShakeState({ decayRate: 0 }), 10, 0);
    s = updateShakes(s, 1);
    expect(isShaking(s)).toBe(false);
  });

  it("very high frequency shake still decays normally", () => {
    let s = addShake(createShakeState({ decayRate: 1.0 }), 10, 2000, 120);
    s = updateShakes(s, 500);
    expect(s.shakes[0].frequency).toBe(120);
    expect(s.shakes[0].intensity).toBeLessThan(10);
  });
});
