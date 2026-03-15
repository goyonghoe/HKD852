import { describe, it, expect } from "vitest";
import {
  ease,
  createAnim,
  tickAnim,
  getValue,
  lerp,
  lerpColor,
  createNumberPopup,
  tickNumberPopup,
  getPopupAlpha,
  getPopupScale,
  getPopupY,
  smoothDamp,
  type AnimState,
  type NumberPopup,
  type EasingFn,
} from "../../src/core/UIAnimCalc";

// ── Easing ──

describe("ease", () => {
  it("linear returns identity", () => {
    expect(ease(0, "linear")).toBe(0);
    expect(ease(0.5, "linear")).toBe(0.5);
    expect(ease(1, "linear")).toBe(1);
  });

  it("easeIn starts slow", () => {
    expect(ease(0.5, "easeIn")).toBeLessThan(0.5);
    expect(ease(0, "easeIn")).toBe(0);
    expect(ease(1, "easeIn")).toBe(1);
  });

  it("easeOut starts fast", () => {
    expect(ease(0.5, "easeOut")).toBeGreaterThan(0.5);
    expect(ease(0, "easeOut")).toBe(0);
    expect(ease(1, "easeOut")).toBe(1);
  });

  it("easeInOut is symmetric around 0.5", () => {
    expect(ease(0, "easeInOut")).toBe(0);
    expect(ease(1, "easeInOut")).toBe(1);
    expect(ease(0.5, "easeInOut")).toBe(0.5);
  });

  it("bounce reaches 1 at t=1", () => {
    expect(ease(0, "bounce")).toBe(0);
    expect(ease(1, "bounce")).toBeCloseTo(1, 3);
  });

  it("elastic reaches 1 at t=1", () => {
    expect(ease(0, "elastic")).toBe(0);
    expect(ease(1, "elastic")).toBe(1);
  });

  it("back overshoots then returns", () => {
    expect(ease(0, "back")).toBeCloseTo(0, 3);
    expect(ease(1, "back")).toBeCloseTo(1, 3);
  });

  it("clamps input to [0, 1]", () => {
    expect(ease(-1, "linear")).toBe(0);
    expect(ease(2, "linear")).toBe(1);
  });

  const allEasings: EasingFn[] = [
    "linear",
    "easeIn",
    "easeOut",
    "easeInOut",
    "bounce",
    "elastic",
    "back",
  ];
  it.each(allEasings)("%s returns 0 at t=0 and ~1 at t=1", (fn) => {
    expect(ease(0, fn)).toBeCloseTo(0, 1);
    expect(ease(1, fn)).toBeCloseTo(1, 1);
  });
});

// ── Animation Lifecycle ──

describe("createAnim", () => {
  it("creates animation with defaults", () => {
    const a = createAnim(0, 100, 500);
    expect(a.from).toBe(0);
    expect(a.to).toBe(100);
    expect(a.duration).toBe(500);
    expect(a.elapsed).toBe(0);
    expect(a.easing).toBe("easeOut");
    expect(a.isComplete).toBe(false);
  });

  it("accepts custom easing", () => {
    const a = createAnim(10, 20, 300, "bounce");
    expect(a.easing).toBe("bounce");
  });

  it("zero duration marks complete immediately", () => {
    const a = createAnim(0, 100, 0);
    expect(a.isComplete).toBe(true);
  });

  it("negative duration treated as zero", () => {
    const a = createAnim(0, 100, -100);
    expect(a.duration).toBe(0);
    expect(a.isComplete).toBe(true);
  });
});

describe("tickAnim", () => {
  it("advances elapsed", () => {
    const a = createAnim(0, 100, 500);
    const b = tickAnim(a, 200);
    expect(b.elapsed).toBe(200);
    expect(b.isComplete).toBe(false);
  });

  it("completes when elapsed >= duration", () => {
    const a = createAnim(0, 100, 500);
    const b = tickAnim(a, 600);
    expect(b.elapsed).toBe(500);
    expect(b.isComplete).toBe(true);
  });

  it("does not modify already complete animation", () => {
    const a = createAnim(0, 100, 500);
    const b = tickAnim(a, 500);
    const c = tickAnim(b, 100);
    expect(c).toBe(b);
  });

  it("is immutable", () => {
    const a = createAnim(0, 100, 500);
    const b = tickAnim(a, 100);
    expect(a.elapsed).toBe(0);
    expect(b.elapsed).toBe(100);
  });
});

describe("getValue", () => {
  it("returns from at start", () => {
    const a = createAnim(10, 50, 500, "linear");
    expect(getValue(a)).toBe(10);
  });

  it("returns to at end", () => {
    const a = createAnim(10, 50, 500, "linear");
    const b = tickAnim(a, 500);
    expect(getValue(b)).toBe(50);
  });

  it("returns midpoint at half with linear", () => {
    const a = createAnim(0, 100, 1000, "linear");
    const b = tickAnim(a, 500);
    expect(getValue(b)).toBe(50);
  });

  it("returns to for zero duration", () => {
    const a = createAnim(0, 100, 0);
    expect(getValue(a)).toBe(100);
  });
});

// ── Interpolation ──

describe("lerp", () => {
  it("returns a at t=0", () => expect(lerp(10, 20, 0)).toBe(10));
  it("returns b at t=1", () => expect(lerp(10, 20, 1)).toBe(20));
  it("returns midpoint at t=0.5", () => expect(lerp(0, 100, 0.5)).toBe(50));
  it("extrapolates beyond [0,1]", () => {
    expect(lerp(0, 100, 2)).toBe(200);
    expect(lerp(0, 100, -1)).toBe(-100);
  });
});

describe("lerpColor", () => {
  it("returns colorA at t=0", () =>
    expect(lerpColor(0xff0000, 0x0000ff, 0)).toBe(0xff0000));
  it("returns colorB at t=1", () =>
    expect(lerpColor(0xff0000, 0x0000ff, 1)).toBe(0x0000ff));
  it("blends at midpoint", () => {
    const mid = lerpColor(0xff0000, 0x0000ff, 0.5);
    const r = (mid >> 16) & 0xff;
    const b = mid & 0xff;
    expect(r).toBe(128);
    expect(b).toBe(128);
  });
  it("clamps t", () => {
    expect(lerpColor(0xff0000, 0x0000ff, -1)).toBe(0xff0000);
    expect(lerpColor(0xff0000, 0x0000ff, 2)).toBe(0x0000ff);
  });
});

// ── Number Popup ──

describe("createNumberPopup", () => {
  it("creates normal popup", () => {
    const p = createNumberPopup(42, 100, 200, false);
    expect(p.value).toBe(42);
    expect(p.isCrit).toBe(false);
    expect(p.color).toBe(0xffffff);
    expect(p.elapsed).toBe(0);
    expect(p.duration).toBe(800);
  });

  it("creates crit popup", () => {
    const p = createNumberPopup(99, 50, 50, true);
    expect(p.isCrit).toBe(true);
    expect(p.color).toBe(0xffdd00);
  });
});

describe("tickNumberPopup", () => {
  it("advances elapsed", () => {
    const p = createNumberPopup(10, 0, 0, false);
    const p2 = tickNumberPopup(p, 300);
    expect(p2.elapsed).toBe(300);
  });

  it("caps at duration", () => {
    const p = createNumberPopup(10, 0, 0, false);
    const p2 = tickNumberPopup(p, 1000);
    expect(p2.elapsed).toBe(800);
  });

  it("is immutable", () => {
    const p = createNumberPopup(10, 0, 0, false);
    const p2 = tickNumberPopup(p, 100);
    expect(p.elapsed).toBe(0);
    expect(p2.elapsed).toBe(100);
  });
});

describe("getPopupAlpha", () => {
  it("returns 1 for first 60%", () => {
    const p = createNumberPopup(10, 0, 0, false);
    expect(getPopupAlpha(p)).toBe(1);
    expect(getPopupAlpha(tickNumberPopup(p, 480))).toBe(1);
  });

  it("fades out after 60%", () => {
    const p = createNumberPopup(10, 0, 0, false);
    expect(getPopupAlpha(tickNumberPopup(p, 640))).toBeCloseTo(0.5, 5);
  });

  it("returns ~0 at end", () => {
    const p = createNumberPopup(10, 0, 0, false);
    expect(getPopupAlpha(tickNumberPopup(p, 800))).toBeCloseTo(0, 5);
  });
});

describe("getPopupScale", () => {
  it("returns 1.0 for normal", () => {
    expect(getPopupScale(createNumberPopup(10, 0, 0, false))).toBe(1.0);
  });

  it("crits start at 1.8", () => {
    expect(getPopupScale(createNumberPopup(10, 0, 0, true))).toBe(1.8);
  });

  it("crits settle to 1.2 after 30%", () => {
    const p = createNumberPopup(10, 0, 0, true);
    expect(getPopupScale(tickNumberPopup(p, 240))).toBeCloseTo(1.2, 2);
  });

  it("crits stay at 1.2 after settling", () => {
    const p = createNumberPopup(10, 0, 0, true);
    expect(getPopupScale(tickNumberPopup(p, 600))).toBe(1.2);
  });
});

describe("getPopupY", () => {
  it("starts at original y", () => {
    expect(getPopupY(createNumberPopup(10, 100, 200, false))).toBe(200);
  });

  it("floats up by 40px at end", () => {
    const p = createNumberPopup(10, 100, 200, false);
    expect(getPopupY(tickNumberPopup(p, 800))).toBe(160);
  });

  it("floats up by 20px at half", () => {
    const p = createNumberPopup(10, 100, 200, false);
    expect(getPopupY(tickNumberPopup(p, 400))).toBe(180);
  });
});

// ── Smooth Damp ──

describe("smoothDamp", () => {
  it("moves toward target", () => {
    const r = smoothDamp(0, 100, 0, 0.3, 0.016);
    expect(r.value).toBeGreaterThan(0);
    expect(r.value).toBeLessThan(100);
  });

  it("converges over time", () => {
    let current = 0,
      velocity = 0;
    for (let i = 0; i < 100; i++) {
      const r = smoothDamp(current, 100, velocity, 0.3, 0.016);
      current = r.value;
      velocity = r.velocity;
    }
    expect(current).toBeCloseTo(100, 1);
  });

  it("does not overshoot", () => {
    let current = 0,
      velocity = 0;
    for (let i = 0; i < 200; i++) {
      const r = smoothDamp(current, 100, velocity, 0.1, 0.016);
      current = r.value;
      velocity = r.velocity;
      expect(current).toBeLessThanOrEqual(100.001);
    }
  });

  it("handles negative direction", () => {
    expect(smoothDamp(100, 0, 0, 0.3, 0.016).value).toBeLessThan(100);
  });

  it("already at target stays", () => {
    const r = smoothDamp(100, 100, 0, 0.3, 0.016);
    expect(r.value).toBe(100);
    expect(r.velocity).toBe(0);
  });
});
