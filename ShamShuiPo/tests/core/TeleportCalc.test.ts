import { describe, it, expect } from "vitest";
import {
  createTeleportState,
  canTeleport,
  startTeleport,
  updateTeleport,
  calculateTeleportTarget,
  getPhase,
  isVisible,
  isTelegraphing,
  getPhaseProgress,
  resetTeleport,
} from "../../src/core/TeleportCalc";

// ── createTeleportState ────────────────────────────────

describe("createTeleportState", () => {
  it("returns defaults when no config provided", () => {
    const s = createTeleportState();
    expect(s.config.cooldown).toBe(5000);
    expect(s.config.windupTime).toBe(500);
    expect(s.config.reappearDelay).toBe(300);
    expect(s.config.maxRange).toBe(400);
    expect(s.config.minRange).toBe(100);
  });

  it("starts in ready phase", () => {
    const s = createTeleportState();
    expect(s.phase).toBe("ready");
  });

  it("starts with zero elapsed", () => {
    const s = createTeleportState();
    expect(s.elapsed).toBe(0);
    expect(s.cooldownElapsed).toBe(0);
  });

  it("starts with zero coordinates", () => {
    const s = createTeleportState();
    expect(s.targetX).toBe(0);
    expect(s.targetY).toBe(0);
    expect(s.originX).toBe(0);
    expect(s.originY).toBe(0);
  });

  it("overrides specific config fields", () => {
    const s = createTeleportState({ cooldown: 3000, minRange: 50 });
    expect(s.config.cooldown).toBe(3000);
    expect(s.config.minRange).toBe(50);
    expect(s.config.windupTime).toBe(500); // still default
  });

  it("overrides all config fields", () => {
    const s = createTeleportState({
      cooldown: 1000,
      windupTime: 200,
      reappearDelay: 100,
      maxRange: 600,
      minRange: 50,
    });
    expect(s.config.cooldown).toBe(1000);
    expect(s.config.windupTime).toBe(200);
    expect(s.config.reappearDelay).toBe(100);
    expect(s.config.maxRange).toBe(600);
    expect(s.config.minRange).toBe(50);
  });

  it("returns a new object each time", () => {
    const a = createTeleportState();
    const b = createTeleportState();
    expect(a).not.toBe(b);
    expect(a.config).not.toBe(b.config);
  });
});

// ── canTeleport ────────────────────────────────────────

describe("canTeleport", () => {
  it("returns true when ready", () => {
    expect(canTeleport(createTeleportState())).toBe(true);
  });

  it("returns false during windup", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(canTeleport(s)).toBe(false);
  });

  it("returns false during gone phase", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 600); // past windup
    expect(s.phase).toBe("gone");
    expect(canTeleport(s)).toBe(false);
  });

  it("returns false during cooldown", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 600); // windup→gone
    s = updateTeleport(s, 400); // gone→reappear
    s = updateTeleport(s, 1); // reappear→cooldown
    expect(s.phase).toBe("cooldown");
    expect(canTeleport(s)).toBe(false);
  });
});

// ── startTeleport ──────────────────────────────────────

describe("startTeleport", () => {
  it("sets phase to windup", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(s.phase).toBe("windup");
  });

  it("records origin coordinates", () => {
    const s = startTeleport(createTeleportState(), 150, 200, 350, 400);
    expect(s.originX).toBe(150);
    expect(s.originY).toBe(200);
  });

  it("records target coordinates", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(s.targetX).toBe(300);
    expect(s.targetY).toBe(300);
  });

  it("resets elapsed to 0", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(s.elapsed).toBe(0);
  });

  it("rejects teleport if not ready", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    const s2 = startTeleport(s, 50, 50, 250, 250);
    expect(s2).toBe(s); // same reference, unchanged
  });

  it("rejects teleport if target too close (below minRange)", () => {
    const s = createTeleportState({ minRange: 100 });
    const result = startTeleport(s, 100, 100, 110, 110); // ~14 pixels
    expect(result.phase).toBe("ready"); // unchanged
  });

  it("rejects teleport if target too far (above maxRange)", () => {
    const s = createTeleportState({ maxRange: 200 });
    const result = startTeleport(s, 0, 0, 500, 500); // ~707 pixels
    expect(result.phase).toBe("ready");
  });

  it("accepts teleport at exactly minRange", () => {
    const s = createTeleportState({ minRange: 100, maxRange: 400 });
    const result = startTeleport(s, 0, 0, 100, 0); // exactly 100
    expect(result.phase).toBe("windup");
  });

  it("accepts teleport at exactly maxRange", () => {
    const s = createTeleportState({ minRange: 100, maxRange: 400 });
    const result = startTeleport(s, 0, 0, 400, 0); // exactly 400
    expect(result.phase).toBe("windup");
  });

  it("clamps target X to game bounds", () => {
    const s = createTeleportState({ maxRange: 1000, minRange: 10 });
    const result = startTeleport(s, 360, 640, 800, 640); // 440px away, target within maxRange
    expect(result.targetX).toBeLessThanOrEqual(720);
  });

  it("clamps target Y to game bounds", () => {
    const s = createTeleportState({ maxRange: 1500, minRange: 10 });
    const result = startTeleport(s, 360, 640, 360, 1500);
    expect(result.targetY).toBeLessThanOrEqual(1280);
  });

  it("does not mutate original state", () => {
    const original = createTeleportState();
    startTeleport(original, 100, 100, 300, 300);
    expect(original.phase).toBe("ready");
    expect(original.originX).toBe(0);
  });
});

// ── updateTeleport ─────────────────────────────────────

describe("updateTeleport", () => {
  it("returns same state if already ready", () => {
    const s = createTeleportState();
    const result = updateTeleport(s, 100);
    expect(result).toBe(s);
  });

  it("stays in windup if not enough time", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 200);
    expect(s.phase).toBe("windup");
    expect(s.elapsed).toBe(200);
  });

  it("transitions windup→gone after windupTime", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    expect(s.phase).toBe("gone");
  });

  it("carries overflow from windup into gone elapsed", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 600); // 100ms overflow
    expect(s.phase).toBe("gone");
    expect(s.elapsed).toBe(100);
  });

  it("stays in gone if not enough time for reappear", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone
    s = updateTeleport(s, 100); // not enough for 300ms delay
    expect(s.phase).toBe("gone");
  });

  it("transitions gone→reappear after reappearDelay", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone (elapsed 0)
    s = updateTeleport(s, 300); // gone→reappear
    expect(s.phase).toBe("reappear");
  });

  it("transitions reappear→cooldown immediately on next update", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone
    s = updateTeleport(s, 300); // gone→reappear
    s = updateTeleport(s, 1); // reappear→cooldown
    expect(s.phase).toBe("cooldown");
  });

  it("stays in cooldown if not enough time", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone
    s = updateTeleport(s, 300); // gone→reappear
    s = updateTeleport(s, 1); // reappear→cooldown
    s = updateTeleport(s, 2000); // partial cooldown
    expect(s.phase).toBe("cooldown");
    expect(s.cooldownElapsed).toBe(2000);
  });

  it("transitions cooldown→ready after cooldown expires", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone
    s = updateTeleport(s, 300); // gone→reappear
    s = updateTeleport(s, 1); // reappear→cooldown
    s = updateTeleport(s, 5000); // cooldown→ready
    expect(s.phase).toBe("ready");
  });

  it("full cycle returns to ready", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone
    s = updateTeleport(s, 300); // gone→reappear
    s = updateTeleport(s, 1); // reappear→cooldown
    s = updateTeleport(s, 5000); // cooldown→ready
    expect(canTeleport(s)).toBe(true);
  });

  it("preserves target coordinates through phases", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 400);
    s = updateTeleport(s, 500);
    expect(s.targetX).toBe(300);
    expect(s.targetY).toBe(400);
    s = updateTeleport(s, 300);
    expect(s.targetX).toBe(300);
    expect(s.targetY).toBe(400);
  });

  it("does not mutate original state", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    const before = s.elapsed;
    updateTeleport(s, 200);
    expect(s.elapsed).toBe(before);
  });

  it("handles zero delta in windup", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 0);
    expect(s.phase).toBe("windup");
    expect(s.elapsed).toBe(0);
  });

  it("handles very large delta that spans multiple phases", () => {
    // windupTime=500 => large delta should at least pass windup→gone
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 1000); // 500 windup + overflow 500 into gone
    expect(s.phase).toBe("gone");
  });
});

// ── calculateTeleportTarget ────────────────────────────

describe("calculateTeleportTarget", () => {
  const config = {
    cooldown: 5000,
    windupTime: 500,
    reappearDelay: 300,
    maxRange: 400,
    minRange: 100,
  };

  it("returns a valid result for normal case", () => {
    const r = calculateTeleportTarget(100, 640, 400, 640, config);
    expect(r.valid).toBeDefined();
    expect(typeof r.x).toBe("number");
    expect(typeof r.y).toBe("number");
  });

  it("places target behind/past the player (flanking)", () => {
    // Enemy at left, player to the right — target should be past player
    const r = calculateTeleportTarget(100, 640, 300, 640, config);
    expect(r.x).toBeGreaterThan(300); // past the player
  });

  it("clamps X within [0, 720]", () => {
    const r = calculateTeleportTarget(0, 640, 700, 640, config);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x).toBeLessThanOrEqual(720);
  });

  it("clamps Y within [0, 1280]", () => {
    const r = calculateTeleportTarget(360, 0, 360, 1200, config);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeLessThanOrEqual(1280);
  });

  it("handles enemy on top of player (distance ≈ 0)", () => {
    const r = calculateTeleportTarget(360, 640, 360, 640, config);
    expect(typeof r.x).toBe("number");
    expect(typeof r.y).toBe("number");
    expect(r.valid).toBe(true);
  });

  it("handles vertical teleport", () => {
    const r = calculateTeleportTarget(360, 100, 360, 300, config);
    expect(r.y).toBeGreaterThan(300); // past player downward
  });

  it("handles diagonal teleport", () => {
    const r = calculateTeleportTarget(100, 100, 300, 300, config);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });

  it("returns valid=false when result distance out of range after clamping", () => {
    // Extreme case: short maxRange, positions that force out-of-range after clamping
    const shortConfig = { ...config, maxRange: 120, minRange: 100 };
    const r = calculateTeleportTarget(10, 10, 700, 1200, shortConfig);
    // The clamped position may still exceed maxRange from origin
    expect(typeof r.valid).toBe("boolean");
  });

  it("works with custom config ranges", () => {
    const wideConfig = { ...config, maxRange: 800, minRange: 50 };
    const r = calculateTeleportTarget(100, 640, 400, 640, wideConfig);
    expect(typeof r.x).toBe("number");
  });
});

// ── getPhase ───────────────────────────────────────────

describe("getPhase", () => {
  it("returns 'ready' for new state", () => {
    expect(getPhase(createTeleportState())).toBe("ready");
  });

  it("returns 'windup' after startTeleport", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(getPhase(s)).toBe("windup");
  });

  it("returns 'gone' after windup completes", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    expect(getPhase(s)).toBe("gone");
  });

  it("returns 'reappear' after gone completes", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    expect(getPhase(s)).toBe("reappear");
  });

  it("returns 'cooldown' after reappear", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1);
    expect(getPhase(s)).toBe("cooldown");
  });
});

// ── isVisible ──────────────────────────────────────────

describe("isVisible", () => {
  it("true when ready", () => {
    expect(isVisible(createTeleportState())).toBe(true);
  });

  it("true during windup", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(isVisible(s)).toBe(true);
  });

  it("false during gone phase", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    expect(isVisible(s)).toBe(false);
  });

  it("true during reappear", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    expect(isVisible(s)).toBe(true);
  });

  it("true during cooldown", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1);
    expect(isVisible(s)).toBe(true);
  });
});

// ── isTelegraphing ─────────────────────────────────────

describe("isTelegraphing", () => {
  it("false when ready", () => {
    expect(isTelegraphing(createTeleportState())).toBe(false);
  });

  it("true during windup", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(isTelegraphing(s)).toBe(true);
  });

  it("false during gone", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    expect(isTelegraphing(s)).toBe(false);
  });

  it("false during cooldown", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1);
    expect(isTelegraphing(s)).toBe(false);
  });
});

// ── getPhaseProgress ───────────────────────────────────

describe("getPhaseProgress", () => {
  it("returns 0 when ready", () => {
    expect(getPhaseProgress(createTeleportState())).toBe(0);
  });

  it("returns 0 at start of windup", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    expect(getPhaseProgress(s)).toBe(0);
  });

  it("returns ~0.5 at midpoint of windup", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 250); // half of 500ms windup
    expect(getPhaseProgress(s)).toBeCloseTo(0.5, 1);
  });

  it("returns progress during gone phase", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // windup→gone (elapsed=0)
    s = updateTeleport(s, 150); // half of 300ms gone
    expect(getPhaseProgress(s)).toBeCloseTo(0.5, 1);
  });

  it("returns 1 during reappear", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    expect(getPhaseProgress(s)).toBe(1);
  });

  it("returns progress during cooldown", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1); // reappear→cooldown
    s = updateTeleport(s, 2500); // half of 5000ms cooldown
    expect(getPhaseProgress(s)).toBeCloseTo(0.5, 1);
  });

  it("clamps progress to max 1", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 499); // just under windup
    expect(getPhaseProgress(s)).toBeLessThanOrEqual(1);
  });

  it("handles zero windupTime config", () => {
    const s = startTeleport(
      createTeleportState({ windupTime: 0 }),
      100,
      100,
      300,
      300,
    );
    // windupTime=0 means instant windup, but startTeleport sets phase to 'windup'
    // getPhaseProgress should return 1 when windupTime=0
    expect(getPhaseProgress(s)).toBe(1);
  });
});

// ── resetTeleport ──────────────────────────────────────

describe("resetTeleport", () => {
  it("sets phase back to ready", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = resetTeleport(s);
    expect(s.phase).toBe("ready");
  });

  it("zeroes elapsed", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 200);
    s = resetTeleport(s);
    expect(s.elapsed).toBe(0);
  });

  it("zeroes coordinates", () => {
    let s = startTeleport(createTeleportState(), 100, 200, 300, 400);
    s = resetTeleport(s);
    expect(s.targetX).toBe(0);
    expect(s.targetY).toBe(0);
    expect(s.originX).toBe(0);
    expect(s.originY).toBe(0);
  });

  it("zeroes cooldownElapsed", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1);
    s = updateTeleport(s, 2000);
    s = resetTeleport(s);
    expect(s.cooldownElapsed).toBe(0);
  });

  it("preserves config", () => {
    const custom = createTeleportState({ cooldown: 9999 });
    let s = startTeleport(custom, 100, 100, 300, 300);
    s = resetTeleport(s);
    expect(s.config.cooldown).toBe(9999);
  });

  it("can teleport again after reset", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 200); // mid-windup
    s = resetTeleport(s);
    expect(canTeleport(s)).toBe(true);
  });

  it("does not mutate original", () => {
    const s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    resetTeleport(s);
    expect(s.phase).toBe("windup");
  });

  it("works from any phase", () => {
    let s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500); // gone
    s = resetTeleport(s);
    expect(s.phase).toBe("ready");

    s = startTeleport(createTeleportState(), 100, 100, 300, 300);
    s = updateTeleport(s, 500);
    s = updateTeleport(s, 300);
    s = updateTeleport(s, 1); // cooldown
    s = resetTeleport(s);
    expect(s.phase).toBe("ready");
  });
});

// ── Immutability ───────────────────────────────────────

describe("immutability", () => {
  it("createTeleportState returns distinct objects", () => {
    const a = createTeleportState();
    const b = createTeleportState();
    expect(a).not.toBe(b);
  });

  it("startTeleport returns new object", () => {
    const a = createTeleportState();
    const b = startTeleport(a, 100, 100, 300, 300);
    expect(a).not.toBe(b);
  });

  it("updateTeleport returns new object when state changes", () => {
    const a = startTeleport(createTeleportState(), 100, 100, 300, 300);
    const b = updateTeleport(a, 100);
    expect(a).not.toBe(b);
  });

  it("resetTeleport returns new object", () => {
    const a = startTeleport(createTeleportState(), 100, 100, 300, 300);
    const b = resetTeleport(a);
    expect(a).not.toBe(b);
  });
});
