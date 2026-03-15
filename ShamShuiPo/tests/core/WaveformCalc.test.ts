// ── Tests: WaveformCalc ──

import { describe, it, expect } from "vitest";
import {
  createWaveformConfig,
  createWaveformProjectile,
  updateWaveform,
  getPosition,
  getForwardDistance,
  getSineOffset,
  getPerpendicularDirection,
  deactivate,
  isActive,
  getWavelength,
  setAmplitude,
  setFrequency,
} from "../../src/core/WaveformCalc";

// ════════════════════════════════════════════════════════════════
// § createWaveformConfig
// ════════════════════════════════════════════════════════════════

describe("createWaveformConfig", () => {
  it("returns defaults when no overrides given", () => {
    const cfg = createWaveformConfig();
    expect(cfg.amplitude).toBe(30);
    expect(cfg.frequency).toBe(3);
    expect(cfg.phase).toBe(0);
    expect(cfg.baseSpeed).toBe(200);
  });

  it("returns defaults when called with empty object", () => {
    const cfg = createWaveformConfig({});
    expect(cfg.amplitude).toBe(30);
    expect(cfg.frequency).toBe(3);
  });

  it("overrides amplitude", () => {
    const cfg = createWaveformConfig({ amplitude: 50 });
    expect(cfg.amplitude).toBe(50);
    expect(cfg.frequency).toBe(3);
  });

  it("overrides frequency", () => {
    const cfg = createWaveformConfig({ frequency: 10 });
    expect(cfg.frequency).toBe(10);
    expect(cfg.amplitude).toBe(30);
  });

  it("overrides phase", () => {
    const cfg = createWaveformConfig({ phase: Math.PI / 2 });
    expect(cfg.phase).toBeCloseTo(Math.PI / 2);
  });

  it("overrides baseSpeed", () => {
    const cfg = createWaveformConfig({ baseSpeed: 500 });
    expect(cfg.baseSpeed).toBe(500);
  });

  it("overrides multiple fields at once", () => {
    const cfg = createWaveformConfig({
      amplitude: 10,
      frequency: 5,
      phase: 1,
      baseSpeed: 300,
    });
    expect(cfg.amplitude).toBe(10);
    expect(cfg.frequency).toBe(5);
    expect(cfg.phase).toBe(1);
    expect(cfg.baseSpeed).toBe(300);
  });

  it("allows zero amplitude", () => {
    const cfg = createWaveformConfig({ amplitude: 0 });
    expect(cfg.amplitude).toBe(0);
  });

  it("allows zero frequency", () => {
    const cfg = createWaveformConfig({ frequency: 0 });
    expect(cfg.frequency).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § createWaveformProjectile
// ════════════════════════════════════════════════════════════════

describe("createWaveformProjectile", () => {
  it("creates with given id, position, angle", () => {
    const p = createWaveformProjectile("p1", 100, 200, Math.PI / 4);
    expect(p.id).toBe("p1");
    expect(p.baseX).toBe(100);
    expect(p.baseY).toBe(200);
    expect(p.angle).toBeCloseTo(Math.PI / 4);
  });

  it("starts with elapsed = 0", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    expect(p.elapsed).toBe(0);
  });

  it("starts as active", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    expect(p.active).toBe(true);
  });

  it("uses default config when no overrides", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    expect(p.config.amplitude).toBe(30);
    expect(p.config.frequency).toBe(3);
    expect(p.config.phase).toBe(0);
    expect(p.config.baseSpeed).toBe(200);
  });

  it("applies config overrides", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0, {
      amplitude: 60,
      baseSpeed: 400,
    });
    expect(p.config.amplitude).toBe(60);
    expect(p.config.baseSpeed).toBe(400);
    expect(p.config.frequency).toBe(3); // default preserved
  });

  it("preserves angle = 0", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    expect(p.angle).toBe(0);
  });

  it("handles negative coordinates", () => {
    const p = createWaveformProjectile("neg", -50, -100, 0);
    expect(p.baseX).toBe(-50);
    expect(p.baseY).toBe(-100);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateWaveform
// ════════════════════════════════════════════════════════════════

describe("updateWaveform", () => {
  it("advances elapsed by deltaMs", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const updated = updateWaveform(p, 16);
    expect(updated.elapsed).toBe(16);
  });

  it("accumulates elapsed across multiple updates", () => {
    let p = createWaveformProjectile("p1", 0, 0, 0);
    p = updateWaveform(p, 16);
    p = updateWaveform(p, 16);
    p = updateWaveform(p, 16);
    expect(p.elapsed).toBe(48);
  });

  it("does not mutate the original projectile", () => {
    const original = createWaveformProjectile("p1", 0, 0, 0);
    const updated = updateWaveform(original, 100);
    expect(original.elapsed).toBe(0);
    expect(updated.elapsed).toBe(100);
  });

  it("preserves all other fields", () => {
    const p = createWaveformProjectile("p1", 10, 20, 1.5, { amplitude: 50 });
    const updated = updateWaveform(p, 33);
    expect(updated.id).toBe("p1");
    expect(updated.baseX).toBe(10);
    expect(updated.baseY).toBe(20);
    expect(updated.angle).toBe(1.5);
    expect(updated.config.amplitude).toBe(50);
    expect(updated.active).toBe(true);
  });

  it("handles zero delta", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const updated = updateWaveform(p, 0);
    expect(updated.elapsed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getForwardDistance
// ════════════════════════════════════════════════════════════════

describe("getForwardDistance", () => {
  it("returns 0 at elapsed=0", () => {
    expect(getForwardDistance(0, 200)).toBe(0);
  });

  it("returns speed after 1 second", () => {
    expect(getForwardDistance(1000, 200)).toBe(200);
  });

  it("returns half speed after 500ms", () => {
    expect(getForwardDistance(500, 200)).toBe(100);
  });

  it("scales with speed", () => {
    expect(getForwardDistance(1000, 400)).toBe(400);
  });

  it("returns 0 for zero speed", () => {
    expect(getForwardDistance(1000, 0)).toBe(0);
  });

  it("handles fractional elapsed", () => {
    expect(getForwardDistance(16.67, 200)).toBeCloseTo(3.334, 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSineOffset
// ════════════════════════════════════════════════════════════════

describe("getSineOffset", () => {
  it("returns 0 at elapsed=0, phase=0", () => {
    expect(getSineOffset(0, 30, 3, 0)).toBeCloseTo(0);
  });

  it("returns amplitude at quarter period (phase=0)", () => {
    // Quarter period of 3Hz = 1/(3*4) = 1/12 sec = ~83.33ms
    const quarterPeriod = 1000 / (3 * 4);
    expect(getSineOffset(quarterPeriod, 30, 3, 0)).toBeCloseTo(30);
  });

  it("returns 0 at half period (phase=0)", () => {
    const halfPeriod = 1000 / (3 * 2);
    expect(getSineOffset(halfPeriod, 30, 3, 0)).toBeCloseTo(0, 5);
  });

  it("returns -amplitude at three-quarter period", () => {
    const threeQuarterPeriod = (3 * 1000) / (3 * 4);
    expect(getSineOffset(threeQuarterPeriod, 30, 3, 0)).toBeCloseTo(-30);
  });

  it("returns 0 at full period", () => {
    const fullPeriod = 1000 / 3;
    expect(getSineOffset(fullPeriod, 30, 3, 0)).toBeCloseTo(0, 5);
  });

  it("respects phase offset (π/2 shifts to cosine)", () => {
    // sin(phase) at t=0 with phase=π/2 → sin(π/2) = 1 → amplitude
    expect(getSineOffset(0, 30, 3, Math.PI / 2)).toBeCloseTo(30);
  });

  it("returns 0 for zero amplitude", () => {
    expect(getSineOffset(500, 0, 3, 0)).toBe(0);
  });

  it("returns 0 for zero frequency at phase=0", () => {
    expect(getSineOffset(500, 30, 0, 0)).toBeCloseTo(0);
  });

  it("scales linearly with amplitude", () => {
    const t = 83.33;
    const a1 = getSineOffset(t, 30, 3, 0);
    const a2 = getSineOffset(t, 60, 3, 0);
    expect(a2).toBeCloseTo(a1 * 2, 1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPerpendicularDirection
// ════════════════════════════════════════════════════════════════

describe("getPerpendicularDirection", () => {
  it("angle=0 (right) → perpendicular is (0, 1) (down)", () => {
    const p = getPerpendicularDirection(0);
    expect(p.dx).toBeCloseTo(0);
    expect(p.dy).toBeCloseTo(1);
  });

  it("angle=π/2 (down) → perpendicular is (-1, 0) (left)", () => {
    const p = getPerpendicularDirection(Math.PI / 2);
    expect(p.dx).toBeCloseTo(-1);
    expect(p.dy).toBeCloseTo(0, 5);
  });

  it("angle=π (left) → perpendicular is (0, -1) (up)", () => {
    const p = getPerpendicularDirection(Math.PI);
    expect(p.dx).toBeCloseTo(0, 5);
    expect(p.dy).toBeCloseTo(-1);
  });

  it("angle=3π/2 (up) → perpendicular is (1, 0) (right)", () => {
    const p = getPerpendicularDirection((3 * Math.PI) / 2);
    expect(p.dx).toBeCloseTo(1);
    expect(p.dy).toBeCloseTo(0, 5);
  });

  it("result is a unit vector", () => {
    const p = getPerpendicularDirection(0.7);
    const len = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
    expect(len).toBeCloseTo(1);
  });

  it("result is perpendicular to the forward vector", () => {
    const angle = 1.2;
    const fwd = { dx: Math.cos(angle), dy: Math.sin(angle) };
    const perp = getPerpendicularDirection(angle);
    const dot = fwd.dx * perp.dx + fwd.dy * perp.dy;
    expect(dot).toBeCloseTo(0, 10);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPosition
// ════════════════════════════════════════════════════════════════

describe("getPosition", () => {
  it("returns base position at elapsed=0, phase=0", () => {
    const p = createWaveformProjectile("p1", 100, 200, 0);
    const pos = getPosition(p);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(200);
  });

  it("moves right along angle=0 after 1 second", () => {
    let p = createWaveformProjectile("p1", 0, 0, 0, { amplitude: 0 });
    p = updateWaveform(p, 1000);
    const pos = getPosition(p);
    expect(pos.x).toBeCloseTo(200); // baseSpeed=200
    expect(pos.y).toBeCloseTo(0);
  });

  it("moves down along angle=π/2 after 1 second", () => {
    let p = createWaveformProjectile("p1", 0, 0, Math.PI / 2, { amplitude: 0 });
    p = updateWaveform(p, 1000);
    const pos = getPosition(p);
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.y).toBeCloseTo(200);
  });

  it("includes sine offset perpendicular to travel", () => {
    // angle=0, at quarter wave period the offset should be +amplitude in y
    const quarterPeriod = 1000 / (3 * 4); // ~83.33ms
    let p = createWaveformProjectile("p1", 0, 0, 0);
    p = updateWaveform(p, quarterPeriod);
    const pos = getPosition(p);
    // forward: quarterPeriod/1000 * 200 = ~16.67
    expect(pos.x).toBeCloseTo((quarterPeriod / 1000) * 200, 1);
    // perpendicular offset: 30 * sin(π/2) = 30, direction (0,1) for angle=0
    expect(pos.y).toBeCloseTo(30, 1);
  });

  it("returns to base y-line at half period (angle=0)", () => {
    const halfPeriod = 1000 / (3 * 2); // ~166.67ms
    let p = createWaveformProjectile("p1", 0, 0, 0);
    p = updateWaveform(p, halfPeriod);
    const pos = getPosition(p);
    expect(pos.y).toBeCloseTo(0, 4);
  });

  it("with phase=π/2 starts at peak offset", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0, { phase: Math.PI / 2 });
    const pos = getPosition(p);
    // at t=0: offset = 30*sin(π/2) = 30, perp=(0,1)
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(30);
  });

  it("zero amplitude means straight line", () => {
    let p = createWaveformProjectile("p1", 50, 50, Math.PI / 4, {
      amplitude: 0,
    });
    p = updateWaveform(p, 1000);
    const pos = getPosition(p);
    const dist = 200;
    expect(pos.x).toBeCloseTo(50 + Math.cos(Math.PI / 4) * dist);
    expect(pos.y).toBeCloseTo(50 + Math.sin(Math.PI / 4) * dist);
  });
});

// ════════════════════════════════════════════════════════════════
// § deactivate
// ════════════════════════════════════════════════════════════════

describe("deactivate", () => {
  it("sets active to false", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const d = deactivate(p);
    expect(d.active).toBe(false);
  });

  it("does not mutate original", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    deactivate(p);
    expect(p.active).toBe(true);
  });

  it("preserves all other fields", () => {
    const p = createWaveformProjectile("p1", 10, 20, 1.5, { amplitude: 50 });
    const d = deactivate(updateWaveform(p, 100));
    expect(d.id).toBe("p1");
    expect(d.baseX).toBe(10);
    expect(d.elapsed).toBe(100);
    expect(d.config.amplitude).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════
// § isActive
// ════════════════════════════════════════════════════════════════

describe("isActive", () => {
  it("returns true for new projectile", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    expect(isActive(p)).toBe(true);
  });

  it("returns false after deactivation", () => {
    const p = deactivate(createWaveformProjectile("p1", 0, 0, 0));
    expect(isActive(p)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getWavelength
// ════════════════════════════════════════════════════════════════

describe("getWavelength", () => {
  it("returns baseSpeed / frequency for defaults", () => {
    const cfg = createWaveformConfig();
    expect(getWavelength(cfg)).toBeCloseTo(200 / 3);
  });

  it("doubles when speed doubles", () => {
    const cfg = createWaveformConfig({ baseSpeed: 400 });
    expect(getWavelength(cfg)).toBeCloseTo(400 / 3);
  });

  it("halves when frequency doubles", () => {
    const cfg = createWaveformConfig({ frequency: 6 });
    expect(getWavelength(cfg)).toBeCloseTo(200 / 6);
  });

  it("returns Infinity for zero frequency", () => {
    const cfg = createWaveformConfig({ frequency: 0 });
    expect(getWavelength(cfg)).toBe(Infinity);
  });

  it("returns 0 for zero speed", () => {
    const cfg = createWaveformConfig({ baseSpeed: 0 });
    expect(getWavelength(cfg)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § setAmplitude
// ════════════════════════════════════════════════════════════════

describe("setAmplitude", () => {
  it("updates amplitude in config", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const updated = setAmplitude(p, 60);
    expect(updated.config.amplitude).toBe(60);
  });

  it("does not mutate original", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    setAmplitude(p, 60);
    expect(p.config.amplitude).toBe(30);
  });

  it("preserves other config fields", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0, {
      frequency: 5,
      baseSpeed: 300,
    });
    const updated = setAmplitude(p, 60);
    expect(updated.config.frequency).toBe(5);
    expect(updated.config.baseSpeed).toBe(300);
    expect(updated.config.phase).toBe(0);
  });

  it("preserves projectile fields", () => {
    let p = createWaveformProjectile("p1", 10, 20, 1);
    p = updateWaveform(p, 50);
    const updated = setAmplitude(p, 100);
    expect(updated.id).toBe("p1");
    expect(updated.baseX).toBe(10);
    expect(updated.elapsed).toBe(50);
  });

  it("allows setting to zero", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const updated = setAmplitude(p, 0);
    expect(updated.config.amplitude).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § setFrequency
// ════════════════════════════════════════════════════════════════

describe("setFrequency", () => {
  it("updates frequency in config", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const updated = setFrequency(p, 10);
    expect(updated.config.frequency).toBe(10);
  });

  it("does not mutate original", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    setFrequency(p, 10);
    expect(p.config.frequency).toBe(3);
  });

  it("preserves other config fields", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0, {
      amplitude: 50,
      baseSpeed: 300,
    });
    const updated = setFrequency(p, 10);
    expect(updated.config.amplitude).toBe(50);
    expect(updated.config.baseSpeed).toBe(300);
  });

  it("preserves projectile fields", () => {
    let p = createWaveformProjectile("p1", 10, 20, 1);
    p = updateWaveform(p, 50);
    const updated = setFrequency(p, 8);
    expect(updated.id).toBe("p1");
    expect(updated.baseX).toBe(10);
    expect(updated.elapsed).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / immutability
// ════════════════════════════════════════════════════════════════

describe("integration", () => {
  it("full lifecycle: create → update → getPosition → deactivate", () => {
    let p = createWaveformProjectile("bullet-1", 360, 640, -Math.PI / 2, {
      amplitude: 20,
    });
    expect(isActive(p)).toBe(true);

    p = updateWaveform(p, 500);
    const pos = getPosition(p);
    // Should have moved upward (angle=-π/2) by 100px
    expect(pos.y).toBeLessThan(640);

    p = deactivate(p);
    expect(isActive(p)).toBe(false);
  });

  it("chaining setAmplitude then getPosition changes wave width", () => {
    const quarterPeriod = 1000 / (3 * 4);
    let p = createWaveformProjectile("p1", 0, 0, 0);
    p = updateWaveform(p, quarterPeriod);

    const posNormal = getPosition(p);
    const posWide = getPosition(setAmplitude(p, 60));

    // y offset should double
    expect(posWide.y).toBeCloseTo(posNormal.y * 2, 1);
  });

  it("chaining setFrequency changes wavelength", () => {
    const p = createWaveformProjectile("p1", 0, 0, 0);
    const wl1 = getWavelength(p.config);
    const p2 = setFrequency(p, 6);
    const wl2 = getWavelength(p2.config);
    expect(wl2).toBeCloseTo(wl1 / 2);
  });

  it("multiple projectiles are independent", () => {
    const a = createWaveformProjectile("a", 0, 0, 0);
    const b = createWaveformProjectile("b", 100, 100, Math.PI);
    const a2 = updateWaveform(a, 100);
    expect(a2.elapsed).toBe(100);
    expect(b.elapsed).toBe(0);
  });
});
