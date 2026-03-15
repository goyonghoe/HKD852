import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createEmitter,
  emit,
  tickParticles,
  getActiveParticles,
  clearParticles,
  createCustomPreset,
  clearCustomPresets,
  getPreset,
  setRandomFn,
  resetRandomFn,
  type ParticlePreset,
  type PresetName,
} from "../../src/core/ParticleEmitterCalc";

// ─── Helpers ─────────────────────────────────────────────────────

const SIMPLE_PRESET: ParticlePreset = {
  count: 5,
  speed: 100,
  lifetime: 1.0,
  spreadAngle: 0,
  color: 0xffffff,
  gravity: 0,
  fade: true,
  scaleCurve: { start: 1.0, end: 0.0 },
};

function mkPreset(overrides: Partial<ParticlePreset> = {}): ParticlePreset {
  return {
    ...SIMPLE_PRESET,
    ...overrides,
    scaleCurve: {
      ...SIMPLE_PRESET.scaleCurve,
      ...(overrides.scaleCurve ?? {}),
    },
  };
}

// ─── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  setRandomFn(() => 0.5); // deterministic: angle=0, speed=100%
});

afterEach(() => {
  resetRandomFn();
  clearCustomPresets();
});

// ─── createEmitter ───────────────────────────────────────────────

describe("createEmitter", () => {
  it("returns empty particle list", () => {
    const state = createEmitter();
    expect(state.particles).toHaveLength(0);
  });

  it("starts nextId at 1", () => {
    const state = createEmitter();
    expect(state.nextId).toBe(1);
  });

  it("returns a new object each call", () => {
    const a = createEmitter();
    const b = createEmitter();
    expect(a).not.toBe(b);
  });
});

// ─── emit ────────────────────────────────────────────────────────

describe("emit", () => {
  it("spawns preset.count particles", () => {
    const state = createEmitter();
    const next = emit(state, 0, 0, mkPreset({ count: 7 }));
    expect(next.particles).toHaveLength(7);
  });

  it("particles start at given position", () => {
    const next = emit(createEmitter(), 50, 100, mkPreset({ count: 1 }));
    expect(next.particles[0].x).toBe(50);
    expect(next.particles[0].y).toBe(100);
  });

  it("particles start with active=true", () => {
    const next = emit(createEmitter(), 0, 0, mkPreset({ count: 1 }));
    expect(next.particles[0].active).toBe(true);
  });

  it("particles start with alpha=1", () => {
    const next = emit(createEmitter(), 0, 0, mkPreset({ count: 1 }));
    expect(next.particles[0].alpha).toBe(1);
  });

  it("particles start with age=0", () => {
    const next = emit(createEmitter(), 0, 0, mkPreset({ count: 1 }));
    expect(next.particles[0].age).toBe(0);
  });

  it("particles inherit preset color", () => {
    const next = emit(
      createEmitter(),
      0,
      0,
      mkPreset({ color: 0xff0000, count: 1 }),
    );
    expect(next.particles[0].color).toBe(0xff0000);
  });

  it("particles start with scaleCurve.start", () => {
    const next = emit(
      createEmitter(),
      0,
      0,
      mkPreset({ count: 1, scaleCurve: { start: 2.5, end: 0.0 } }),
    );
    expect(next.particles[0].scale).toBe(2.5);
  });

  it("assigns unique ids", () => {
    const s1 = emit(createEmitter(), 0, 0, mkPreset({ count: 3 }));
    const ids = s1.particles.map((p) => p.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("increments nextId after emission", () => {
    const next = emit(createEmitter(), 0, 0, mkPreset({ count: 3 }));
    expect(next.nextId).toBe(4);
  });

  it("accumulates particles across multiple emits", () => {
    let state = createEmitter();
    state = emit(state, 0, 0, mkPreset({ count: 3 }));
    state = emit(state, 10, 10, mkPreset({ count: 2 }));
    expect(state.particles).toHaveLength(5);
  });

  it("does not mutate original state", () => {
    const state = createEmitter();
    const next = emit(state, 0, 0, SIMPLE_PRESET);
    expect(state.particles).toHaveLength(0);
    expect(next.particles).toHaveLength(5);
  });

  it("accepts a PresetName string", () => {
    const next = emit(createEmitter(), 0, 0, "explosion");
    expect(next.particles).toHaveLength(20);
  });

  it("with zero spreadAngle, direction is consistent", () => {
    const preset = mkPreset({ speed: 200, spreadAngle: 0, count: 1 });
    const next = emit(createEmitter(), 0, 0, preset);
    const p = next.particles[0];
    // angle = (0.5 - 0.5) * 0 = 0, so vx = speed*cos(0), vy = speed*sin(0)
    expect(p.vx).toBeCloseTo(200, 0);
    expect(p.vy).toBeCloseTo(0, 0);
  });

  it("emitting 0-count preset adds nothing", () => {
    const next = emit(createEmitter(), 0, 0, mkPreset({ count: 0 }));
    expect(next.particles).toHaveLength(0);
  });

  it("maxAge matches preset lifetime", () => {
    const next = emit(
      createEmitter(),
      0,
      0,
      mkPreset({ count: 1, lifetime: 2.5 }),
    );
    expect(next.particles[0].maxAge).toBe(2.5);
  });
});

// ─── tickParticles ───────────────────────────────────────────────

describe("tickParticles", () => {
  it("updates particle position based on velocity", () => {
    const preset = mkPreset({
      speed: 100,
      spreadAngle: 0,
      count: 1,
      gravity: 0,
    });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    expect(state.particles[0].x).toBeCloseTo(50, 0);
  });

  it("ages particles", () => {
    const preset = mkPreset({ count: 1, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.3, preset);
    expect(state.particles[0].age).toBeCloseTo(0.3);
  });

  it("removes dead particles (age >= maxAge)", () => {
    const preset = mkPreset({ lifetime: 0.5, count: 3, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.6, preset);
    expect(state.particles).toHaveLength(0);
  });

  it("applies gravity to vy", () => {
    const preset = mkPreset({ gravity: 100, speed: 0, count: 1, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    expect(state.particles[0].vy).toBeCloseTo(50, 0);
  });

  it("gravity affects y position", () => {
    const preset = mkPreset({ gravity: 200, speed: 0, count: 1, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    // y = 0 + 0*0.5 + 0.5*200*0.25 = 25
    expect(state.particles[0].y).toBeCloseTo(25, 0);
  });

  it("negative gravity makes particles float up", () => {
    const preset = mkPreset({ gravity: -100, speed: 0, count: 1, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    expect(state.particles[0].y).toBeLessThan(0);
  });

  it("fades alpha over lifetime when fade=true", () => {
    const preset = mkPreset({ count: 1, lifetime: 1.0, fade: true });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    // t=0.5, alpha = 1 - 0.5 = 0.5
    expect(state.particles[0].alpha).toBeCloseTo(0.5, 2);
  });

  it("does not fade alpha when fade=false", () => {
    const preset = mkPreset({ count: 1, lifetime: 1.0, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    expect(state.particles[0].alpha).toBe(1);
  });

  it("kills particle when alpha reaches 0 via fade", () => {
    const preset = mkPreset({ count: 1, lifetime: 1.0, fade: true });
    let state = emit(createEmitter(), 0, 0, preset);
    // At t=1.0, alpha = 1-1 = 0 → dead
    state = tickParticles(state, 1.0, preset);
    expect(state.particles).toHaveLength(0);
  });

  it("interpolates scale from start to end", () => {
    const preset = mkPreset({
      count: 1,
      scaleCurve: { start: 2.0, end: 0.0 },
      fade: false,
    });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.5, preset);
    // t=0.5: scale = 2.0 + (0.0-2.0)*0.5 = 1.0
    expect(state.particles[0].scale).toBeCloseTo(1.0, 2);
  });

  it("scale never goes below 0", () => {
    const preset = mkPreset({
      count: 1,
      scaleCurve: { start: 0.1, end: -2.0 },
      fade: false,
    });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.9, preset);
    expect(state.particles[0].scale).toBeGreaterThanOrEqual(0);
  });

  it("handles zero dt without changes", () => {
    const preset = mkPreset({ count: 1 });
    let state = emit(createEmitter(), 0, 0, preset);
    const before = state.particles[0];
    state = tickParticles(state, 0, preset);
    expect(state.particles[0].x).toBe(before.x);
    expect(state.particles[0].age).toBe(0);
  });

  it("does not mutate original state", () => {
    const preset = mkPreset({ count: 2 });
    let state = emit(createEmitter(), 0, 0, preset);
    const original = state;
    const next = tickParticles(state, 0.1, preset);
    expect(original.particles).toHaveLength(2);
    expect(next.particles.length).toBeLessThanOrEqual(2);
  });

  it("multiple ticks accumulate correctly", () => {
    const preset = mkPreset({
      speed: 100,
      spreadAngle: 0,
      count: 1,
      gravity: 0,
      fade: false,
    });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.1, preset);
    state = tickParticles(state, 0.1, preset);
    state = tickParticles(state, 0.1, preset);
    expect(state.particles[0].x).toBeCloseTo(30, 0);
  });

  it("alpha is clamped to [0,1]", () => {
    const preset = mkPreset({ count: 1, fade: true });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.1, preset);
    expect(state.particles[0].alpha).toBeGreaterThanOrEqual(0);
    expect(state.particles[0].alpha).toBeLessThanOrEqual(1);
  });

  it("preserves nextId through ticks", () => {
    const preset = mkPreset({ count: 3 });
    let state = emit(createEmitter(), 0, 0, preset);
    expect(state.nextId).toBe(4);
    state = tickParticles(state, 0.1, preset);
    expect(state.nextId).toBe(4);
  });
});

// ─── getActiveParticles ──────────────────────────────────────────

describe("getActiveParticles", () => {
  it("returns empty array for empty state", () => {
    const state = createEmitter();
    expect(getActiveParticles(state)).toHaveLength(0);
  });

  it("returns all freshly emitted particles", () => {
    const state = emit(createEmitter(), 0, 0, mkPreset({ count: 5 }));
    expect(getActiveParticles(state)).toHaveLength(5);
  });

  it("returns fewer after some expire", () => {
    const preset = mkPreset({ lifetime: 0.2, count: 5, fade: false });
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 0.3, preset);
    expect(getActiveParticles(state)).toHaveLength(0);
  });

  it("does not include inactive particles", () => {
    const preset = mkPreset({ lifetime: 1.0, count: 3, fade: true });
    let state = emit(createEmitter(), 0, 0, preset);
    // tick far enough to kill all (alpha fades to 0 at t=lifetime)
    state = tickParticles(state, 1.0, preset);
    const active = getActiveParticles(state);
    for (const p of active) {
      expect(p.active).toBe(true);
    }
  });
});

// ─── clearParticles ──────────────────────────────────────────────

describe("clearParticles", () => {
  it("removes all particles", () => {
    let state = emit(createEmitter(), 0, 0, SIMPLE_PRESET);
    state = clearParticles(state);
    expect(state.particles).toHaveLength(0);
  });

  it("preserves nextId", () => {
    let state = emit(createEmitter(), 0, 0, mkPreset({ count: 10 }));
    const idBefore = state.nextId;
    state = clearParticles(state);
    expect(state.nextId).toBe(idBefore);
  });

  it("does not mutate original state", () => {
    const state = emit(createEmitter(), 0, 0, SIMPLE_PRESET);
    const cleared = clearParticles(state);
    expect(state.particles).toHaveLength(5);
    expect(cleared.particles).toHaveLength(0);
  });

  it("clearing already empty state is safe", () => {
    const state = createEmitter();
    const cleared = clearParticles(state);
    expect(cleared.particles).toHaveLength(0);
  });
});

// ─── getPreset ───────────────────────────────────────────────────

describe("getPreset", () => {
  const presetNames: PresetName[] = [
    "explosion",
    "spark",
    "smoke",
    "blood",
    "heal",
    "levelup",
  ];

  it("returns config for each built-in preset", () => {
    for (const name of presetNames) {
      const cfg = getPreset(name);
      expect(cfg).toBeDefined();
      expect(cfg.count).toBeGreaterThan(0);
      expect(cfg.lifetime).toBeGreaterThan(0);
    }
  });

  it("explosion has high count and speed", () => {
    const cfg = getPreset("explosion");
    expect(cfg.count).toBeGreaterThanOrEqual(15);
    expect(cfg.speed).toBeGreaterThanOrEqual(150);
  });

  it("smoke has negative gravity (floats up)", () => {
    const cfg = getPreset("smoke");
    expect(cfg.gravity).toBeLessThan(0);
  });

  it("blood has high positive gravity", () => {
    const cfg = getPreset("blood");
    expect(cfg.gravity).toBeGreaterThan(100);
  });

  it("heal has green-ish color", () => {
    const cfg = getPreset("heal");
    const green = (cfg.color >> 8) & 0xff;
    expect(green).toBeGreaterThan(0x80);
  });

  it("levelup has many particles", () => {
    const cfg = getPreset("levelup");
    expect(cfg.count).toBeGreaterThanOrEqual(20);
  });

  it("spark has short lifetime", () => {
    const cfg = getPreset("spark");
    expect(cfg.lifetime).toBeLessThanOrEqual(0.5);
  });

  it("returns a deep copy (modifying doesn't affect preset)", () => {
    const cfg1 = getPreset("explosion");
    cfg1.count = 999;
    cfg1.scaleCurve.start = -999;
    const cfg2 = getPreset("explosion");
    expect(cfg2.count).not.toBe(999);
    expect(cfg2.scaleCurve.start).not.toBe(-999);
  });

  it("throws for unknown preset name", () => {
    expect(() => getPreset("nonexistent")).toThrow();
  });
});

// ─── createCustomPreset ──────────────────────────────────────────

describe("createCustomPreset", () => {
  it("registers a custom preset retrievable by getPreset", () => {
    const custom: ParticlePreset = {
      count: 3,
      speed: 50,
      lifetime: 2.0,
      spreadAngle: Math.PI,
      color: 0x123456,
      gravity: 10,
      fade: false,
      scaleCurve: { start: 1.0, end: 0.5 },
    };
    createCustomPreset("myFx", custom);
    const retrieved = getPreset("myFx");
    expect(retrieved.count).toBe(3);
    expect(retrieved.color).toBe(0x123456);
  });

  it("returns the stored preset", () => {
    const custom = mkPreset({ count: 42 });
    const result = createCustomPreset("test", custom);
    expect(result.count).toBe(42);
  });

  it("stores a copy (modifying input doesn't affect stored)", () => {
    const custom = mkPreset({ count: 10 });
    createCustomPreset("safe", custom);
    custom.count = 999;
    const retrieved = getPreset("safe");
    expect(retrieved.count).toBe(10);
  });

  it("getPreset returns a copy of custom preset", () => {
    createCustomPreset("cp", mkPreset({ count: 5 }));
    const a = getPreset("cp");
    a.count = 999;
    const b = getPreset("cp");
    expect(b.count).toBe(5);
  });

  it("custom preset can be used with emit", () => {
    const custom = mkPreset({ count: 4, color: 0xaabbcc });
    createCustomPreset("myEmit", custom);
    const state = emit(createEmitter(), 0, 0, getPreset("myEmit"));
    expect(state.particles).toHaveLength(4);
    expect(state.particles[0].color).toBe(0xaabbcc);
  });

  it("overwriting an existing custom preset updates it", () => {
    createCustomPreset("ow", mkPreset({ count: 2 }));
    createCustomPreset("ow", mkPreset({ count: 8 }));
    expect(getPreset("ow").count).toBe(8);
  });
});

// ─── Full Lifecycle Integration ──────────────────────────────────

describe("full lifecycle", () => {
  it("create → emit → tick → all dead", () => {
    const preset = mkPreset({ lifetime: 0.5, count: 10, fade: false });
    let state = emit(createEmitter(), 100, 200, preset);
    expect(getActiveParticles(state)).toHaveLength(10);
    state = tickParticles(state, 0.6, preset);
    expect(getActiveParticles(state)).toHaveLength(0);
  });

  it("emit at different positions tracks correctly", () => {
    const preset = mkPreset({ count: 1 });
    let state = emit(createEmitter(), 0, 0, preset);
    state = emit(state, 100, 200, preset);
    expect(state.particles[0].x).toBe(0);
    expect(state.particles[1].x).toBe(100);
    expect(state.particles[1].y).toBe(200);
  });

  it("preset → emit → tick works end-to-end", () => {
    const preset = getPreset("explosion");
    let state = emit(createEmitter(), 400, 300, preset);
    expect(getActiveParticles(state)).toHaveLength(preset.count);
    for (let i = 0; i < 10; i++) {
      state = tickParticles(state, 1 / 60, preset);
    }
    // 10 frames at 60fps = 0.167s, explosion lifetime=0.6, should still have particles
    expect(getActiveParticles(state).length).toBeGreaterThan(0);
  });

  it("long tick kills all explosion particles", () => {
    const preset = getPreset("explosion");
    let state = emit(createEmitter(), 0, 0, preset);
    state = tickParticles(state, 5.0, preset);
    expect(getActiveParticles(state)).toHaveLength(0);
  });

  it("clearParticles then emit restarts fresh", () => {
    const preset = mkPreset({ count: 3 });
    let state = emit(createEmitter(), 0, 0, preset);
    state = clearParticles(state);
    state = emit(state, 50, 50, preset);
    expect(state.particles).toHaveLength(3);
    expect(state.particles[0].x).toBe(50);
  });

  it("immutability: chained operations produce independent states", () => {
    const preset = mkPreset({ count: 5 });
    const s0 = createEmitter();
    const s1 = emit(s0, 0, 0, preset);
    const s2 = tickParticles(s1, 0.1, preset);
    const s3 = clearParticles(s2);

    expect(s0.particles).toHaveLength(0);
    expect(s1.particles).toHaveLength(5);
    expect(s2.particles.length).toBeLessThanOrEqual(5);
    expect(s3.particles).toHaveLength(0);
    // s1 unaffected by s2
    expect(s1.particles).toHaveLength(5);
  });

  it("all 6 presets can emit and tick without error", () => {
    const names: PresetName[] = [
      "explosion",
      "spark",
      "smoke",
      "blood",
      "heal",
      "levelup",
    ];
    for (const name of names) {
      const preset = getPreset(name);
      let state = emit(createEmitter(), 100, 100, preset);
      expect(state.particles.length).toBeGreaterThan(0);
      state = tickParticles(state, 0.1, preset);
      // Should not throw
    }
  });
});
