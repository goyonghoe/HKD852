import { describe, it, expect } from "vitest";
import {
  createTransitionState,
  startTransition,
  updateTransition,
  getProgress,
  getOverallProgress,
  getAlpha,
  getOffset,
  isActive,
  isHoldPhase,
  completeTransition,
  getDefaultTransitionConfig,
} from "../../src/core/ScreenTransitionCalc";

// ════════════════════════════════════════════════════════════════
// § createTransitionState
// ════════════════════════════════════════════════════════════════

describe("createTransitionState", () => {
  it("returns idle phase", () => {
    const s = createTransitionState();
    expect(s.phase).toBe("idle");
  });

  it("returns zero elapsed", () => {
    const s = createTransitionState();
    expect(s.elapsed).toBe(0);
  });

  it("returns zero progress", () => {
    const s = createTransitionState();
    expect(s.progress).toBe(0);
  });

  it("has empty scene names", () => {
    const s = createTransitionState();
    expect(s.fromScene).toBe("");
    expect(s.toScene).toBe("");
  });

  it("uses fade as default type", () => {
    const s = createTransitionState();
    expect(s.config.type).toBe("fade");
  });

  it("uses default durations (300/100/300)", () => {
    const s = createTransitionState();
    expect(s.config.outDuration).toBe(300);
    expect(s.config.holdDuration).toBe(100);
    expect(s.config.inDuration).toBe(300);
  });

  it("uses black as default color", () => {
    const s = createTransitionState();
    expect(s.config.color).toBe("#000000");
  });
});

// ════════════════════════════════════════════════════════════════
// § getDefaultTransitionConfig
// ════════════════════════════════════════════════════════════════

describe("getDefaultTransitionConfig", () => {
  it("returns fade type", () => {
    expect(getDefaultTransitionConfig().type).toBe("fade");
  });

  it("returns correct default durations", () => {
    const cfg = getDefaultTransitionConfig();
    expect(cfg.outDuration).toBe(300);
    expect(cfg.holdDuration).toBe(100);
    expect(cfg.inDuration).toBe(300);
  });

  it("returns new object each time", () => {
    const a = getDefaultTransitionConfig();
    const b = getDefaultTransitionConfig();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ════════════════════════════════════════════════════════════════
// § startTransition
// ════════════════════════════════════════════════════════════════

describe("startTransition", () => {
  it("sets phase to out", () => {
    const s = startTransition(createTransitionState(), "menu", "game");
    expect(s.phase).toBe("out");
  });

  it("sets fromScene and toScene", () => {
    const s = startTransition(createTransitionState(), "menu", "game");
    expect(s.fromScene).toBe("menu");
    expect(s.toScene).toBe("game");
  });

  it("resets elapsed and progress to 0", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    expect(s.elapsed).toBe(0);
    expect(s.progress).toBe(0);
  });

  it("uses existing config when no override", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    expect(s.config.type).toBe("fade");
    expect(s.config.outDuration).toBe(300);
  });

  it("merges partial config override", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-left",
      outDuration: 500,
    });
    expect(s.config.type).toBe("slide-left");
    expect(s.config.outDuration).toBe(500);
    expect(s.config.holdDuration).toBe(100); // default preserved
    expect(s.config.inDuration).toBe(300); // default preserved
  });

  it("overrides color in partial config", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      color: "#ff0000",
    });
    expect(s.config.color).toBe("#ff0000");
  });

  it("does not mutate original state", () => {
    const original = createTransitionState();
    startTransition(original, "a", "b", { type: "wipe" });
    expect(original.phase).toBe("idle");
    expect(original.config.type).toBe("fade");
  });

  it("works with slide-right type", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-right",
    });
    expect(s.config.type).toBe("slide-right");
  });

  it("works with none type", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "none",
    });
    expect(s.config.type).toBe("none");
    expect(s.phase).toBe("out");
  });
});

// ════════════════════════════════════════════════════════════════
// § updateTransition — phase progression
// ════════════════════════════════════════════════════════════════

describe("updateTransition — phase progression", () => {
  it("stays in out phase when elapsed < outDuration", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 100);
    expect(u.phase).toBe("out");
    expect(u.elapsed).toBe(100);
  });

  it("transitions from out to hold when elapsed >= outDuration", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 300);
    expect(u.phase).toBe("hold");
  });

  it("transitions from hold to in when elapsed >= holdDuration", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u1 = updateTransition(s, 300); // out → hold
    const u2 = updateTransition(u1, 100); // hold → in
    expect(u2.phase).toBe("in");
  });

  it("transitions from in to complete when elapsed >= inDuration", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300); // out→hold
    state = updateTransition(state, 100); // hold→in
    state = updateTransition(state, 300); // in→complete
    expect(state.phase).toBe("complete");
  });

  it("handles overflow across multiple phases in single update", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    // 300 out + 100 hold + 300 in = 700 total
    const u = updateTransition(s, 700);
    expect(u.phase).toBe("complete");
  });

  it("does not update idle state", () => {
    const s = createTransitionState();
    const u = updateTransition(s, 100);
    expect(u).toBe(s); // same reference
  });

  it("does not update complete state", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    const u = updateTransition(s, 100);
    expect(u).toBe(s);
  });

  it("carries overflow from out to hold", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    // 350ms: 300 out + 50 into hold
    const u = updateTransition(s, 350);
    expect(u.phase).toBe("hold");
    expect(u.elapsed).toBe(50);
  });

  it("carries overflow through all phases", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    // 800ms > 700 total → complete
    const u = updateTransition(s, 800);
    expect(u.phase).toBe("complete");
  });
});

// ════════════════════════════════════════════════════════════════
// § updateTransition — progress within phase
// ════════════════════════════════════════════════════════════════

describe("updateTransition — progress", () => {
  it("calculates out phase progress correctly at midpoint", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 150); // halfway through 300ms out
    expect(u.progress).toBeCloseTo(0.5);
  });

  it("calculates out phase progress at quarter", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 75);
    expect(u.progress).toBeCloseTo(0.25);
  });

  it("progress never exceeds 1 within a phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 100,
      holdDuration: 0,
      inDuration: 0,
    });
    const u = updateTransition(s, 50);
    expect(u.progress).toBeLessThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getProgress
// ════════════════════════════════════════════════════════════════

describe("getProgress", () => {
  it("returns 0 for idle state", () => {
    expect(getProgress(createTransitionState())).toBe(0);
  });

  it("returns current phase progress", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 150);
    expect(getProgress(u)).toBeCloseTo(0.5);
  });

  it("returns 1 for complete state", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    expect(getProgress(s)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getOverallProgress
// ════════════════════════════════════════════════════════════════

describe("getOverallProgress", () => {
  it("returns 0 for idle state", () => {
    expect(getOverallProgress(createTransitionState())).toBe(0);
  });

  it("returns 1 for complete state", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    expect(getOverallProgress(s)).toBe(1);
  });

  it("returns ~0.5 at midpoint of total transition", () => {
    // total = 300+100+300 = 700. At 300 (end of out) + 50 into hold = 350
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 350);
    expect(getOverallProgress(u)).toBeCloseTo(350 / 700, 1);
  });

  it("returns ~0.43 at end of out phase (300/700)", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    // update to exactly 299ms to stay in out phase
    const u = updateTransition(s, 299);
    // Should be close to 299/700
    expect(getOverallProgress(u)).toBeCloseTo(299 / 700, 1);
  });

  it("returns value between 0 and 1 during in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300); // out→hold
    state = updateTransition(state, 100); // hold→in
    state = updateTransition(state, 150); // halfway in
    const overall = getOverallProgress(state);
    expect(overall).toBeGreaterThan(0.5);
    expect(overall).toBeLessThan(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAlpha — fade transitions
// ════════════════════════════════════════════════════════════════

describe("getAlpha — fade transitions", () => {
  it("returns 0 for idle", () => {
    expect(getAlpha(createTransitionState())).toBe(0);
  });

  it("returns 0 for complete", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    expect(getAlpha(s)).toBe(0);
  });

  it("returns 0 at start of out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    expect(getAlpha(s)).toBe(0); // progress=0
  });

  it("returns ~0.5 at midpoint of out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 150);
    expect(getAlpha(u)).toBeCloseTo(0.5);
  });

  it("returns 1 during hold phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 300); // out→hold, overflow=0
    expect(getAlpha(u)).toBe(1);
  });

  it("returns ~0.5 at midpoint of in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300); // out→hold
    state = updateTransition(state, 100); // hold→in
    state = updateTransition(state, 150); // halfway in
    expect(getAlpha(state)).toBeCloseTo(0.5);
  });

  it("returns 0 at end of in phase (near complete)", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300);
    state = updateTransition(state, 100);
    state = updateTransition(state, 299); // near end of in
    expect(getAlpha(state)).toBeCloseTo(1 / 300, 1);
  });

  it("alpha progresses 0→1 through out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const a1 = getAlpha(updateTransition(s, 75));
    const a2 = getAlpha(updateTransition(s, 150));
    const a3 = getAlpha(updateTransition(s, 225));
    expect(a1).toBeCloseTo(0.25);
    expect(a2).toBeCloseTo(0.5);
    expect(a3).toBeCloseTo(0.75);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAlpha — 'none' type
// ════════════════════════════════════════════════════════════════

describe("getAlpha — none type", () => {
  it("returns 0 during out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "none",
    });
    const u = updateTransition(s, 150);
    expect(getAlpha(u)).toBe(0);
  });

  it("returns 0 during hold phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "none",
    });
    const u = updateTransition(s, 300);
    expect(getAlpha(u)).toBe(0);
  });

  it("returns 0 during in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "none",
    });
    let state = updateTransition(s, 300);
    state = updateTransition(state, 100);
    state = updateTransition(state, 50);
    expect(getAlpha(state)).toBe(0);
  });

  it("returns 0 for idle with none type", () => {
    const s = createTransitionState();
    // Even if we force the config type to none
    const withNone = { ...s, config: { ...s.config, type: "none" as const } };
    expect(getAlpha(withNone)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAlpha — wipe type
// ════════════════════════════════════════════════════════════════

describe("getAlpha — wipe type", () => {
  it("returns alpha like fade for wipe type (non-none, non-slide)", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "wipe",
    });
    const u = updateTransition(s, 150);
    expect(getAlpha(u)).toBeCloseTo(0.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § getOffset — slide transitions
// ════════════════════════════════════════════════════════════════

describe("getOffset — slide transitions", () => {
  it("returns {0,0} for fade type", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 150);
    expect(getOffset(u)).toEqual({ x: 0, y: 0 });
  });

  it("returns {0,0} for none type", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "none",
    });
    const u = updateTransition(s, 150);
    expect(getOffset(u)).toEqual({ x: 0, y: 0 });
  });

  it("returns {0,0} for wipe type", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "wipe",
    });
    const u = updateTransition(s, 150);
    expect(getOffset(u)).toEqual({ x: 0, y: 0 });
  });

  it("slide-left: negative x offset during out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-left",
    });
    const u = updateTransition(s, 150); // 50% out
    const offset = getOffset(u);
    expect(offset.x).toBeCloseTo(-360); // -720 * 0.5
    expect(offset.y).toBe(0);
  });

  it("slide-right: positive x offset during out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-right",
    });
    const u = updateTransition(s, 150);
    const offset = getOffset(u);
    expect(offset.x).toBeCloseTo(360); // 720 * 0.5
    expect(offset.y).toBe(0);
  });

  it("slide-up: negative y offset during out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-up",
    });
    const u = updateTransition(s, 150);
    const offset = getOffset(u);
    expect(offset.x).toBe(0);
    expect(offset.y).toBeCloseTo(-640); // -1280 * 0.5
  });

  it("slide-down: positive y offset during out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-down",
    });
    const u = updateTransition(s, 150);
    const offset = getOffset(u);
    expect(offset.x).toBe(0);
    expect(offset.y).toBeCloseTo(640); // 1280 * 0.5
  });

  it("slide-left: full offset during hold", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-left",
    });
    const u = updateTransition(s, 300); // out→hold
    const offset = getOffset(u);
    expect(offset.x).toBeCloseTo(-720);
    expect(offset.y).toBe(0);
  });

  it("slide-left: offset decreases during in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-left",
    });
    let state = updateTransition(s, 300); // out→hold
    state = updateTransition(state, 100); // hold→in
    state = updateTransition(state, 150); // halfway in
    const offset = getOffset(state);
    expect(offset.x).toBeCloseTo(-360); // -720 * 0.5
  });

  it("slide: zero offset when idle", () => {
    const s = createTransitionState();
    const withSlide = {
      ...s,
      config: { ...s.config, type: "slide-left" as const },
    };
    expect(getOffset(withSlide)).toEqual({ x: 0, y: 0 });
  });

  it("slide: zero offset when complete", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b", {
        type: "slide-left",
      }),
    );
    expect(getOffset(s)).toEqual({ x: 0, y: 0 });
  });
});

// ════════════════════════════════════════════════════════════════
// § isActive
// ════════════════════════════════════════════════════════════════

describe("isActive", () => {
  it("returns false for idle", () => {
    expect(isActive(createTransitionState())).toBe(false);
  });

  it("returns true for out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    expect(isActive(s)).toBe(true);
  });

  it("returns true for hold phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 300);
    expect(isActive(u)).toBe(true);
  });

  it("returns true for in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300);
    state = updateTransition(state, 100);
    state = updateTransition(state, 50);
    expect(isActive(state)).toBe(true);
  });

  it("returns false for complete", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    expect(isActive(s)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § isHoldPhase
// ════════════════════════════════════════════════════════════════

describe("isHoldPhase", () => {
  it("returns false for idle", () => {
    expect(isHoldPhase(createTransitionState())).toBe(false);
  });

  it("returns false for out phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    expect(isHoldPhase(s)).toBe(false);
  });

  it("returns true for hold phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 300);
    expect(isHoldPhase(u)).toBe(true);
  });

  it("returns false for in phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    let state = updateTransition(s, 300);
    state = updateTransition(state, 100);
    state = updateTransition(state, 50);
    expect(isHoldPhase(state)).toBe(false);
  });

  it("returns false for complete", () => {
    const s = completeTransition(
      startTransition(createTransitionState(), "a", "b"),
    );
    expect(isHoldPhase(s)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § completeTransition
// ════════════════════════════════════════════════════════════════

describe("completeTransition", () => {
  it("sets phase to complete", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const c = completeTransition(s);
    expect(c.phase).toBe("complete");
  });

  it("sets progress to 1", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const c = completeTransition(s);
    expect(c.progress).toBe(1);
  });

  it("preserves scene names", () => {
    const s = startTransition(createTransitionState(), "menu", "game");
    const c = completeTransition(s);
    expect(c.fromScene).toBe("menu");
    expect(c.toScene).toBe("game");
  });

  it("preserves config", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      type: "slide-up",
    });
    const c = completeTransition(s);
    expect(c.config.type).toBe("slide-up");
  });

  it("does not mutate original state", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    completeTransition(s);
    expect(s.phase).toBe("out");
  });

  it("can force complete from hold phase", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const hold = updateTransition(s, 300);
    const c = completeTransition(hold);
    expect(c.phase).toBe("complete");
    expect(isActive(c)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Immutability
// ════════════════════════════════════════════════════════════════

describe("immutability", () => {
  it("updateTransition returns new object", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const u = updateTransition(s, 50);
    expect(u).not.toBe(s);
  });

  it("startTransition returns new object", () => {
    const s = createTransitionState();
    const started = startTransition(s, "a", "b");
    expect(started).not.toBe(s);
  });

  it("completeTransition returns new object", () => {
    const s = startTransition(createTransitionState(), "a", "b");
    const c = completeTransition(s);
    expect(c).not.toBe(s);
  });
});

// ════════════════════════════════════════════════════════════════
// § Custom config merging
// ════════════════════════════════════════════════════════════════

describe("custom config merging", () => {
  it("overrides only outDuration", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 1000,
    });
    expect(s.config.outDuration).toBe(1000);
    expect(s.config.holdDuration).toBe(100);
    expect(s.config.inDuration).toBe(300);
  });

  it("overrides all durations", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 500,
      holdDuration: 200,
      inDuration: 500,
    });
    expect(s.config.outDuration).toBe(500);
    expect(s.config.holdDuration).toBe(200);
    expect(s.config.inDuration).toBe(500);
  });

  it("uses custom durations in phase progression", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 100,
      holdDuration: 50,
      inDuration: 100,
    });
    // 100 out + 50 hold + 100 in = 250 total
    const u = updateTransition(s, 250);
    expect(u.phase).toBe("complete");
  });

  it("handles zero outDuration (skips straight to hold)", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 0,
    });
    const u = updateTransition(s, 50);
    // Should skip out, enter hold with 50ms
    expect(u.phase).toBe("hold");
    expect(u.elapsed).toBe(50);
  });

  it("handles zero holdDuration (skips straight to in)", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 100,
      holdDuration: 0,
      inDuration: 100,
    });
    const u = updateTransition(s, 100); // out done, skip hold
    expect(u.phase).toBe("in");
  });

  it("handles all zero durations (instant complete)", () => {
    const s = startTransition(createTransitionState(), "a", "b", {
      outDuration: 0,
      holdDuration: 0,
      inDuration: 0,
    });
    const u = updateTransition(s, 16); // one frame
    expect(u.phase).toBe("complete");
  });
});
