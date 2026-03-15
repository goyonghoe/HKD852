// ── Tests: InputCalc ──

import { describe, it, expect } from "vitest";
import {
  createJoystickConfig,
  processJoystickInput,
  applyDeadZone,
  clampMagnitude,
  getMovementVector,
  detectSwipe,
  getSwipeDirection,
  isValidSwipe,
  getJoystickPosition,
  normalizeAngle,
  angleBetween,
  distanceBetween,
  lerpInput,
} from "../../src/core/InputCalc";
import type { JoystickInput, SwipeGesture } from "../../src/core/InputCalc";

// ════════════════════════════════════════════════════════════════
// § createJoystickConfig
// ════════════════════════════════════════════════════════════════

describe("createJoystickConfig", () => {
  it("creates config with default values", () => {
    const cfg = createJoystickConfig();
    expect(cfg.isLeftHanded).toBe(false);
    expect(cfg.deadZone).toBe(0.15);
    expect(cfg.maxRadius).toBe(60);
    expect(cfg.sensitivity).toBe(1.0);
    expect(cfg.centerX).toBe(0);
    expect(cfg.centerY).toBe(0);
  });

  it("respects left-handed override", () => {
    const cfg = createJoystickConfig(true);
    expect(cfg.isLeftHanded).toBe(true);
  });

  it("respects all overrides", () => {
    const cfg = createJoystickConfig(true, 0.2, 80, 1.5);
    expect(cfg.isLeftHanded).toBe(true);
    expect(cfg.deadZone).toBe(0.2);
    expect(cfg.maxRadius).toBe(80);
    expect(cfg.sensitivity).toBe(1.5);
  });

  it("uses defaults when passing undefined", () => {
    const cfg = createJoystickConfig(
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(cfg.deadZone).toBe(0.15);
    expect(cfg.maxRadius).toBe(60);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyDeadZone
// ════════════════════════════════════════════════════════════════

describe("applyDeadZone", () => {
  it("returns 0 when below dead zone", () => {
    expect(applyDeadZone(0.1, 0.15)).toBe(0);
  });

  it("returns 0 at exactly dead zone boundary", () => {
    expect(applyDeadZone(0.15, 0.15)).toBe(0);
  });

  it("remaps values above dead zone to 0-1", () => {
    // magnitude 1.0, deadZone 0.15 → (1.0 - 0.15) / (1 - 0.15) = 1.0
    expect(applyDeadZone(1.0, 0.15)).toBeCloseTo(1.0);
  });

  it("remaps midpoint correctly", () => {
    // deadZone=0, magnitude=0.5 → 0.5
    expect(applyDeadZone(0.5, 0)).toBeCloseTo(0.5);
  });

  it("returns 0 for zero magnitude", () => {
    expect(applyDeadZone(0, 0.15)).toBe(0);
  });

  it("returns 0 when deadZone is 1 or higher", () => {
    expect(applyDeadZone(0.5, 1.0)).toBe(0);
    expect(applyDeadZone(0.5, 1.5)).toBe(0);
  });

  it("clamps output to maximum 1", () => {
    expect(applyDeadZone(1.5, 0.1)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § clampMagnitude
// ════════════════════════════════════════════════════════════════

describe("clampMagnitude", () => {
  it("does not clamp vector within radius", () => {
    const result = clampMagnitude(3, 4, 10);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it("clamps vector exceeding radius", () => {
    const result = clampMagnitude(60, 80, 50);
    const mag = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(mag).toBeCloseTo(50);
  });

  it("preserves direction when clamped", () => {
    const result = clampMagnitude(100, 0, 50);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });

  it("handles zero vector", () => {
    const result = clampMagnitude(0, 0, 60);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("handles negative components", () => {
    const result = clampMagnitude(-100, -100, 10);
    const mag = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(mag).toBeCloseTo(10);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeLessThan(0);
  });

  it("returns exact values when at boundary", () => {
    // Vector of length exactly 60
    const result = clampMagnitude(36, 48, 60);
    expect(result.x).toBe(36);
    expect(result.y).toBe(48);
  });
});

// ════════════════════════════════════════════════════════════════
// § processJoystickInput
// ════════════════════════════════════════════════════════════════

describe("processJoystickInput", () => {
  const cfg = { ...createJoystickConfig(), centerX: 100, centerY: 200 };

  it("returns inactive input at center", () => {
    const input = processJoystickInput(100, 200, cfg);
    expect(input.isActive).toBe(false);
    expect(input.magnitude).toBe(0);
    expect(input.normalizedX).toBe(0);
    expect(input.normalizedY).toBe(0);
  });

  it("returns inactive input within dead zone", () => {
    // Tiny offset: 5px on a 60px radius = 0.083, below 0.15 dead zone
    const input = processJoystickInput(105, 200, cfg);
    expect(input.isActive).toBe(false);
    expect(input.magnitude).toBe(0);
  });

  it("returns active input beyond dead zone", () => {
    // 60px right = full radius → magnitude should be ~1.0 after dead zone remap
    const input = processJoystickInput(160, 200, cfg);
    expect(input.isActive).toBe(true);
    expect(input.magnitude).toBeCloseTo(1.0);
    expect(input.normalizedX).toBeGreaterThan(0);
  });

  it("stores raw offset values", () => {
    const input = processJoystickInput(130, 220, cfg);
    expect(input.rawX).toBe(30);
    expect(input.rawY).toBe(20);
  });

  it("clamps input beyond max radius", () => {
    // 200px right, way beyond 60px radius
    const input = processJoystickInput(300, 200, cfg);
    expect(input.magnitude).toBeCloseTo(1.0);
  });

  it("produces correct angle for rightward input", () => {
    const input = processJoystickInput(160, 200, cfg);
    expect(input.angle).toBeCloseTo(0); // right = 0 radians
  });

  it("produces correct angle for downward input", () => {
    const input = processJoystickInput(100, 260, cfg);
    expect(input.angle).toBeCloseTo(Math.PI / 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovementVector
// ════════════════════════════════════════════════════════════════

describe("getMovementVector", () => {
  it("returns zero when input is inactive", () => {
    const input: JoystickInput = {
      rawX: 0,
      rawY: 0,
      normalizedX: 0,
      normalizedY: 0,
      magnitude: 0,
      angle: 0,
      isActive: false,
    };
    const mv = getMovementVector(input, 200);
    expect(mv.dx).toBe(0);
    expect(mv.dy).toBe(0);
  });

  it("scales by speed when active", () => {
    const input: JoystickInput = {
      rawX: 60,
      rawY: 0,
      normalizedX: 1.0,
      normalizedY: 0,
      magnitude: 1.0,
      angle: 0,
      isActive: true,
    };
    const mv = getMovementVector(input, 200);
    expect(mv.dx).toBeCloseTo(200);
    expect(mv.dy).toBe(0);
  });

  it("handles diagonal input", () => {
    const norm = Math.SQRT1_2; // ~0.707
    const input: JoystickInput = {
      rawX: 42,
      rawY: 42,
      normalizedX: norm,
      normalizedY: norm,
      magnitude: 1.0,
      angle: Math.PI / 4,
      isActive: true,
    };
    const mv = getMovementVector(input, 100);
    expect(mv.dx).toBeCloseTo(norm * 100);
    expect(mv.dy).toBeCloseTo(norm * 100);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSwipeDirection
// ════════════════════════════════════════════════════════════════

describe("getSwipeDirection", () => {
  it("returns 'right' for positive dx dominant", () => {
    expect(getSwipeDirection(100, 10)).toBe("right");
  });

  it("returns 'left' for negative dx dominant", () => {
    expect(getSwipeDirection(-100, 10)).toBe("left");
  });

  it("returns 'down' for positive dy dominant (screen coords)", () => {
    expect(getSwipeDirection(10, 100)).toBe("down");
  });

  it("returns 'up' for negative dy dominant", () => {
    expect(getSwipeDirection(10, -100)).toBe("up");
  });

  it("returns 'none' for zero vector", () => {
    expect(getSwipeDirection(0, 0)).toBe("none");
  });

  it("prefers horizontal when equal magnitudes", () => {
    expect(getSwipeDirection(50, 50)).toBe("right");
    expect(getSwipeDirection(-50, -50)).toBe("left");
  });
});

// ════════════════════════════════════════════════════════════════
// § detectSwipe
// ════════════════════════════════════════════════════════════════

describe("detectSwipe", () => {
  it("detects a right swipe", () => {
    const g = detectSwipe(0, 0, 100, 0, 200);
    expect(g.direction).toBe("right");
    expect(g.velocity).toBeCloseTo(0.5); // 100px / 200ms
  });

  it("detects an upward swipe", () => {
    const g = detectSwipe(50, 200, 50, 50, 150);
    expect(g.direction).toBe("up");
  });

  it("stores start/end coordinates", () => {
    const g = detectSwipe(10, 20, 30, 40, 100);
    expect(g.startX).toBe(10);
    expect(g.startY).toBe(20);
    expect(g.endX).toBe(30);
    expect(g.endY).toBe(40);
  });

  it("handles zero duration gracefully", () => {
    const g = detectSwipe(0, 0, 50, 0, 0);
    expect(g.velocity).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isValidSwipe
// ════════════════════════════════════════════════════════════════

describe("isValidSwipe", () => {
  it("accepts valid swipe with defaults", () => {
    const g = detectSwipe(0, 0, 50, 0, 200); // 50px, 200ms
    expect(isValidSwipe(g)).toBe(true);
  });

  it("rejects swipe too short (< 30px)", () => {
    const g = detectSwipe(0, 0, 10, 0, 100);
    expect(isValidSwipe(g)).toBe(false);
  });

  it("rejects swipe too slow (> 300ms)", () => {
    const g = detectSwipe(0, 0, 100, 0, 500);
    expect(isValidSwipe(g)).toBe(false);
  });

  it("accepts swipe at exact boundary (30px, 300ms)", () => {
    const g = detectSwipe(0, 0, 30, 0, 300);
    expect(isValidSwipe(g)).toBe(true);
  });

  it("respects custom thresholds", () => {
    const g = detectSwipe(0, 0, 20, 0, 400);
    expect(isValidSwipe(g, 10, 500)).toBe(true);
  });

  it("rejects with custom min distance", () => {
    const g = detectSwipe(0, 0, 40, 0, 200);
    expect(isValidSwipe(g, 50)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getJoystickPosition
// ════════════════════════════════════════════════════════════════

describe("getJoystickPosition", () => {
  it("places joystick bottom-right for right-handed", () => {
    const cfg = createJoystickConfig(false);
    const pos = getJoystickPosition(cfg, 720, 1280);
    expect(pos.x).toBe(720 - 100); // screenWidth - PADDING_X
    expect(pos.y).toBe(1280 - 200); // screenHeight - PADDING_Y
  });

  it("places joystick bottom-left for left-handed", () => {
    const cfg = createJoystickConfig(true);
    const pos = getJoystickPosition(cfg, 720, 1280);
    expect(pos.x).toBe(100); // PADDING_X
    expect(pos.y).toBe(1280 - 200);
  });

  it("adapts to different screen sizes", () => {
    const cfg = createJoystickConfig(false);
    const pos = getJoystickPosition(cfg, 1080, 1920);
    expect(pos.x).toBe(1080 - 100);
    expect(pos.y).toBe(1920 - 200);
  });
});

// ════════════════════════════════════════════════════════════════
// § normalizeAngle
// ════════════════════════════════════════════════════════════════

describe("normalizeAngle", () => {
  it("keeps angle already in range", () => {
    expect(normalizeAngle(1.0)).toBeCloseTo(1.0);
  });

  it("wraps negative angle", () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
  });

  it("wraps angle above 2*PI", () => {
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
  });

  it("normalizes zero", () => {
    expect(normalizeAngle(0)).toBe(0);
  });

  it("handles large negative angles", () => {
    const result = normalizeAngle(-Math.PI * 5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(Math.PI * 2);
  });

  it("handles large positive angles", () => {
    const result = normalizeAngle(Math.PI * 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(Math.PI * 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § angleBetween
// ════════════════════════════════════════════════════════════════

describe("angleBetween", () => {
  it("returns 0 for point directly to the right", () => {
    expect(angleBetween(0, 0, 10, 0)).toBeCloseTo(0);
  });

  it("returns PI/2 for point directly below", () => {
    expect(angleBetween(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2);
  });

  it("returns PI for point directly to the left", () => {
    expect(angleBetween(0, 0, -10, 0)).toBeCloseTo(Math.PI);
  });

  it("returns -PI/2 for point directly above", () => {
    expect(angleBetween(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2);
  });

  it("works with non-origin start", () => {
    expect(angleBetween(5, 5, 15, 5)).toBeCloseTo(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § distanceBetween
// ════════════════════════════════════════════════════════════════

describe("distanceBetween", () => {
  it("returns 0 for same point", () => {
    expect(distanceBetween(5, 5, 5, 5)).toBe(0);
  });

  it("returns correct distance for 3-4-5 triangle", () => {
    expect(distanceBetween(0, 0, 3, 4)).toBeCloseTo(5);
  });

  it("works with negative coordinates", () => {
    expect(distanceBetween(-3, -4, 0, 0)).toBeCloseTo(5);
  });

  it("is commutative", () => {
    const d1 = distanceBetween(1, 2, 4, 6);
    const d2 = distanceBetween(4, 6, 1, 2);
    expect(d1).toBeCloseTo(d2);
  });
});

// ════════════════════════════════════════════════════════════════
// § lerpInput
// ════════════════════════════════════════════════════════════════

describe("lerpInput", () => {
  it("returns current when smoothing is 0", () => {
    expect(lerpInput(10, 20, 0)).toBe(10);
  });

  it("returns target when smoothing is 1", () => {
    expect(lerpInput(10, 20, 1)).toBe(20);
  });

  it("returns midpoint when smoothing is 0.5", () => {
    expect(lerpInput(0, 100, 0.5)).toBeCloseTo(50);
  });

  it("clamps smoothing below 0 to 0", () => {
    expect(lerpInput(10, 20, -5)).toBe(10);
  });

  it("clamps smoothing above 1 to 1", () => {
    expect(lerpInput(10, 20, 5)).toBe(20);
  });

  it("works with negative values", () => {
    expect(lerpInput(-10, 10, 0.5)).toBeCloseTo(0);
  });

  it("returns current when current equals target", () => {
    expect(lerpInput(42, 42, 0.7)).toBe(42);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration: full joystick flow
// ════════════════════════════════════════════════════════════════

describe("Integration", () => {
  it("full joystick → movement vector pipeline", () => {
    const cfg = { ...createJoystickConfig(), centerX: 360, centerY: 640 };
    // Touch 60px to the right (full radius)
    const input = processJoystickInput(420, 640, cfg);
    expect(input.isActive).toBe(true);

    const mv = getMovementVector(input, 300);
    expect(mv.dx).toBeGreaterThan(0);
    expect(mv.dy).toBeCloseTo(0, 5);
  });

  it("swipe detection → validation pipeline", () => {
    const g = detectSwipe(100, 500, 100, 400, 150);
    expect(g.direction).toBe("up");
    expect(isValidSwipe(g)).toBe(true);
  });
});
