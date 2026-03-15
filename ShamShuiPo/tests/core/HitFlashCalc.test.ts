import { describe, it, expect } from "vitest";
import {
  createHitFlashState,
  triggerFlash,
  updateFlashes,
  getActiveFlashes,
  getFlashForTarget,
  getFlashIntensity,
  removeExpired,
  clearFlashes,
  isFlashing,
  getFlashCount,
} from "../../src/core/HitFlashCalc";

// ════════════════════════════════════════════════════════════════
// § createHitFlashState
// ════════════════════════════════════════════════════════════════

describe("createHitFlashState", () => {
  it("creates state with default values", () => {
    const s = createHitFlashState();
    expect(s.effects).toEqual([]);
    expect(s.defaultDuration).toBe(150);
    expect(s.defaultColor).toBe("#FFFFFF");
    expect(s.maxConcurrent).toBe(10);
  });

  it("accepts custom defaultDuration", () => {
    const s = createHitFlashState(200);
    expect(s.defaultDuration).toBe(200);
  });

  it("accepts custom defaultColor", () => {
    const s = createHitFlashState(150, "#FF0000");
    expect(s.defaultColor).toBe("#FF0000");
  });

  it("accepts custom maxConcurrent", () => {
    const s = createHitFlashState(150, "#FFFFFF", 5);
    expect(s.maxConcurrent).toBe(5);
  });

  it("starts with empty effects array", () => {
    const s = createHitFlashState(300, "#00FF00", 20);
    expect(s.effects.length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § triggerFlash
// ════════════════════════════════════════════════════════════════

describe("triggerFlash", () => {
  it("adds an effect with default color and duration", () => {
    const s = createHitFlashState();
    const s2 = triggerFlash(s, "enemy_1");
    expect(s2.effects.length).toBe(1);
    expect(s2.effects[0].targetId).toBe("enemy_1");
    expect(s2.effects[0].color).toBe("#FFFFFF");
    expect(s2.effects[0].duration).toBe(150);
  });

  it("uses custom color when provided", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1", "#FF0000");
    expect(s.effects[0].color).toBe("#FF0000");
  });

  it("uses custom duration when provided", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1", undefined, 300);
    expect(s.effects[0].duration).toBe(300);
  });

  it("uses both custom color and duration", () => {
    const s = triggerFlash(createHitFlashState(), "p1", "#00FF00", 500);
    expect(s.effects[0].color).toBe("#00FF00");
    expect(s.effects[0].duration).toBe(500);
  });

  it("sets startTime to 0", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(s.effects[0].startTime).toBe(0);
  });

  it("sets elapsed to 0", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(s.effects[0].elapsed).toBe(0);
  });

  it("sets active to true", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(s.effects[0].active).toBe(true);
  });

  it("sets intensity to 1", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(s.effects[0].intensity).toBe(1);
  });

  it("generates unique ids for each flash", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "enemy_1");
    s = triggerFlash(s, "enemy_2");
    expect(s.effects[0].id).not.toBe(s.effects[1].id);
  });

  it("does not mutate original state", () => {
    const s = createHitFlashState();
    const s2 = triggerFlash(s, "enemy_1");
    expect(s.effects.length).toBe(0);
    expect(s2.effects.length).toBe(1);
  });

  it("removes oldest when maxConcurrent reached", () => {
    let s = createHitFlashState(150, "#FFFFFF", 3);
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    s = triggerFlash(s, "c");
    const firstId = s.effects[0].id;
    s = triggerFlash(s, "d");
    expect(s.effects.length).toBe(3);
    expect(s.effects.find((e) => e.id === firstId)).toBeUndefined();
    expect(s.effects[s.effects.length - 1].targetId).toBe("d");
  });

  it("removes multiple oldest when far over maxConcurrent", () => {
    let s = createHitFlashState(150, "#FFFFFF", 2);
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    s = triggerFlash(s, "c");
    expect(s.effects.length).toBe(2);
    expect(s.effects[0].targetId).toBe("b");
    expect(s.effects[1].targetId).toBe("c");
  });

  it("allows multiple flashes on same target", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "enemy_1");
    s = triggerFlash(s, "enemy_1");
    expect(s.effects.length).toBe(2);
    expect(s.effects[0].targetId).toBe("enemy_1");
    expect(s.effects[1].targetId).toBe("enemy_1");
  });
});

// ════════════════════════════════════════════════════════════════
// § updateFlashes
// ════════════════════════════════════════════════════════════════

describe("updateFlashes", () => {
  it("advances elapsed time on active effects", () => {
    let s = triggerFlash(createHitFlashState(), "enemy_1");
    s = updateFlashes(s, 50);
    expect(s.effects[0].elapsed).toBe(50);
  });

  it("accumulates elapsed over multiple updates", () => {
    let s = triggerFlash(createHitFlashState(), "enemy_1");
    s = updateFlashes(s, 30);
    s = updateFlashes(s, 40);
    expect(s.effects[0].elapsed).toBe(70);
  });

  it("deactivates effect when elapsed >= duration", () => {
    let s = triggerFlash(createHitFlashState(100), "enemy_1");
    s = updateFlashes(s, 100);
    expect(s.effects[0].active).toBe(false);
  });

  it("deactivates effect when elapsed > duration", () => {
    let s = triggerFlash(createHitFlashState(100), "enemy_1");
    s = updateFlashes(s, 150);
    expect(s.effects[0].active).toBe(false);
  });

  it("keeps effect active when elapsed < duration", () => {
    let s = triggerFlash(createHitFlashState(100), "enemy_1");
    s = updateFlashes(s, 99);
    expect(s.effects[0].active).toBe(true);
  });

  it("does not advance elapsed on already inactive effects", () => {
    let s = triggerFlash(createHitFlashState(100), "enemy_1");
    s = updateFlashes(s, 100);
    const elapsedBefore = s.effects[0].elapsed;
    s = updateFlashes(s, 50);
    expect(s.effects[0].elapsed).toBe(elapsedBefore);
  });

  it("handles zero deltaMs", () => {
    let s = triggerFlash(createHitFlashState(), "enemy_1");
    s = updateFlashes(s, 0);
    expect(s.effects[0].elapsed).toBe(0);
    expect(s.effects[0].active).toBe(true);
  });

  it("handles multiple effects independently", () => {
    let s = createHitFlashState(100);
    s = triggerFlash(s, "a", undefined, 50);
    s = triggerFlash(s, "b", undefined, 200);
    s = updateFlashes(s, 60);
    expect(s.effects[0].active).toBe(false); // 50ms duration, 60ms elapsed
    expect(s.effects[1].active).toBe(true); // 200ms duration, 60ms elapsed
  });

  it("does not mutate original state", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    const s2 = updateFlashes(s, 50);
    expect(s.effects[0].elapsed).toBe(0);
    expect(s2.effects[0].elapsed).toBe(50);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveFlashes
// ════════════════════════════════════════════════════════════════

describe("getActiveFlashes", () => {
  it("returns empty array for fresh state", () => {
    expect(getActiveFlashes(createHitFlashState())).toEqual([]);
  });

  it("returns all effects when all are active", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    expect(getActiveFlashes(s).length).toBe(2);
  });

  it("excludes inactive effects", () => {
    let s = createHitFlashState(50);
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    s = updateFlashes(s, 60);
    expect(getActiveFlashes(s).length).toBe(0);
  });

  it("returns mix of active/inactive correctly", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a", undefined, 50);
    s = triggerFlash(s, "b", undefined, 200);
    s = updateFlashes(s, 60);
    const active = getActiveFlashes(s);
    expect(active.length).toBe(1);
    expect(active[0].targetId).toBe("b");
  });
});

// ════════════════════════════════════════════════════════════════
// § getFlashForTarget
// ════════════════════════════════════════════════════════════════

describe("getFlashForTarget", () => {
  it("returns null when no effects exist", () => {
    expect(getFlashForTarget(createHitFlashState(), "enemy_1")).toBeNull();
  });

  it("returns null when target has no flash", () => {
    let s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(getFlashForTarget(s, "enemy_2")).toBeNull();
  });

  it("returns the flash for the correct target", () => {
    let s = triggerFlash(createHitFlashState(), "enemy_1");
    const result = getFlashForTarget(s, "enemy_1");
    expect(result).not.toBeNull();
    expect(result!.targetId).toBe("enemy_1");
  });

  it("returns the latest active flash when multiple exist", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "enemy_1", "#FF0000");
    s = triggerFlash(s, "enemy_1", "#00FF00");
    const result = getFlashForTarget(s, "enemy_1");
    expect(result!.color).toBe("#00FF00");
  });

  it("returns null when all flashes for target are inactive", () => {
    let s = triggerFlash(createHitFlashState(50), "enemy_1");
    s = updateFlashes(s, 60);
    expect(getFlashForTarget(s, "enemy_1")).toBeNull();
  });

  it("skips inactive and returns active flash for target", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "enemy_1", "#FF0000", 30);
    s = updateFlashes(s, 35);
    s = triggerFlash(s, "enemy_1", "#00FF00", 200);
    const result = getFlashForTarget(s, "enemy_1");
    expect(result!.color).toBe("#00FF00");
    expect(result!.active).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getFlashIntensity
// ════════════════════════════════════════════════════════════════

describe("getFlashIntensity", () => {
  it("returns full intensity at elapsed=0", () => {
    const s = triggerFlash(createHitFlashState(100), "e1");
    expect(getFlashIntensity(s.effects[0])).toBe(1);
  });

  it("returns 0 when elapsed equals duration", () => {
    let s = triggerFlash(createHitFlashState(100), "e1");
    s = updateFlashes(s, 100);
    expect(getFlashIntensity(s.effects[0])).toBe(0);
  });

  it("returns 0 when elapsed exceeds duration", () => {
    let s = triggerFlash(createHitFlashState(100), "e1");
    s = updateFlashes(s, 200);
    expect(getFlashIntensity(s.effects[0])).toBe(0);
  });

  it("returns 0.5 at halfway through duration", () => {
    let s = triggerFlash(createHitFlashState(100), "e1");
    s = updateFlashes(s, 50);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.5);
  });

  it("returns 0.75 at 25% through duration", () => {
    let s = triggerFlash(createHitFlashState(200), "e1");
    s = updateFlashes(s, 50);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.75);
  });

  it("returns 0.25 at 75% through duration", () => {
    let s = triggerFlash(createHitFlashState(200), "e1");
    s = updateFlashes(s, 150);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.25);
  });

  it("linearly fades — 10% elapsed gives 90% intensity", () => {
    let s = triggerFlash(createHitFlashState(1000), "e1");
    s = updateFlashes(s, 100);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.9);
  });

  it("handles zero duration by returning 0", () => {
    let s = triggerFlash(createHitFlashState(), "e1", undefined, 0);
    expect(getFlashIntensity(s.effects[0])).toBe(0);
  });

  it("handles very small elapsed values", () => {
    let s = triggerFlash(createHitFlashState(100), "e1");
    s = updateFlashes(s, 1);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.99);
  });
});

// ════════════════════════════════════════════════════════════════
// § isFlashing
// ════════════════════════════════════════════════════════════════

describe("isFlashing", () => {
  it("returns false for empty state", () => {
    expect(isFlashing(createHitFlashState(), "enemy_1")).toBe(false);
  });

  it("returns true when target has active flash", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(isFlashing(s, "enemy_1")).toBe(true);
  });

  it("returns false for different target", () => {
    const s = triggerFlash(createHitFlashState(), "enemy_1");
    expect(isFlashing(s, "enemy_2")).toBe(false);
  });

  it("returns false after flash expires", () => {
    let s = triggerFlash(createHitFlashState(50), "enemy_1");
    s = updateFlashes(s, 60);
    expect(isFlashing(s, "enemy_1")).toBe(false);
  });

  it("returns true when one of multiple flashes is still active", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "enemy_1", undefined, 30);
    s = triggerFlash(s, "enemy_1", undefined, 200);
    s = updateFlashes(s, 35);
    expect(isFlashing(s, "enemy_1")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getFlashCount
// ════════════════════════════════════════════════════════════════

describe("getFlashCount", () => {
  it("returns 0 for empty state", () => {
    expect(getFlashCount(createHitFlashState())).toBe(0);
  });

  it("returns count of active flashes", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    s = triggerFlash(s, "c");
    expect(getFlashCount(s)).toBe(3);
  });

  it("excludes inactive flashes from count", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a", undefined, 30);
    s = triggerFlash(s, "b", undefined, 200);
    s = updateFlashes(s, 40);
    expect(getFlashCount(s)).toBe(1);
  });

  it("returns 0 when all flashes expired", () => {
    let s = triggerFlash(createHitFlashState(50), "a");
    s = updateFlashes(s, 60);
    expect(getFlashCount(s)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeExpired
// ════════════════════════════════════════════════════════════════

describe("removeExpired", () => {
  it("returns same effects when all active", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    const cleaned = removeExpired(s);
    expect(cleaned.effects.length).toBe(2);
  });

  it("removes inactive effects", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a", undefined, 30);
    s = triggerFlash(s, "b", undefined, 200);
    s = updateFlashes(s, 40);
    const cleaned = removeExpired(s);
    expect(cleaned.effects.length).toBe(1);
    expect(cleaned.effects[0].targetId).toBe("b");
  });

  it("returns empty effects when all expired", () => {
    let s = triggerFlash(createHitFlashState(50), "a");
    s = updateFlashes(s, 60);
    const cleaned = removeExpired(s);
    expect(cleaned.effects.length).toBe(0);
  });

  it("does not mutate original state", () => {
    let s = triggerFlash(createHitFlashState(50), "a");
    s = updateFlashes(s, 60);
    const original = s;
    removeExpired(s);
    expect(original.effects.length).toBe(1);
  });

  it("preserves state fields other than effects", () => {
    let s = createHitFlashState(200, "#FF0000", 5);
    s = triggerFlash(s, "a", undefined, 30);
    s = updateFlashes(s, 40);
    const cleaned = removeExpired(s);
    expect(cleaned.defaultDuration).toBe(200);
    expect(cleaned.defaultColor).toBe("#FF0000");
    expect(cleaned.maxConcurrent).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════════
// § clearFlashes
// ════════════════════════════════════════════════════════════════

describe("clearFlashes", () => {
  it("removes all effects", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    s = triggerFlash(s, "c");
    const cleared = clearFlashes(s);
    expect(cleared.effects.length).toBe(0);
  });

  it("returns empty effects on already empty state", () => {
    const cleared = clearFlashes(createHitFlashState());
    expect(cleared.effects.length).toBe(0);
  });

  it("does not mutate original state", () => {
    let s = triggerFlash(createHitFlashState(), "a");
    const original = s;
    clearFlashes(s);
    expect(original.effects.length).toBe(1);
  });

  it("preserves state fields other than effects", () => {
    let s = createHitFlashState(300, "#AABBCC", 7);
    s = triggerFlash(s, "a");
    const cleared = clearFlashes(s);
    expect(cleared.defaultDuration).toBe(300);
    expect(cleared.defaultColor).toBe("#AABBCC");
    expect(cleared.maxConcurrent).toBe(7);
  });
});

// ════════════════════════════════════════════════════════════════
// § integration / edge cases
// ════════════════════════════════════════════════════════════════

describe("integration / edge cases", () => {
  it("full lifecycle: trigger → update → expire → cleanup", () => {
    let s = createHitFlashState(100);
    s = triggerFlash(s, "enemy_1");
    expect(getFlashCount(s)).toBe(1);

    s = updateFlashes(s, 50);
    expect(isFlashing(s, "enemy_1")).toBe(true);
    expect(getFlashIntensity(s.effects[0])).toBeCloseTo(0.5);

    s = updateFlashes(s, 50);
    expect(isFlashing(s, "enemy_1")).toBe(false);
    expect(getFlashIntensity(s.effects[0])).toBe(0);

    s = removeExpired(s);
    expect(s.effects.length).toBe(0);
  });

  it("maxConcurrent=1 only keeps the latest flash", () => {
    let s = createHitFlashState(150, "#FFFFFF", 1);
    s = triggerFlash(s, "a");
    s = triggerFlash(s, "b");
    expect(s.effects.length).toBe(1);
    expect(s.effects[0].targetId).toBe("b");
  });

  it("rapid successive triggers on same target", () => {
    let s = createHitFlashState(100);
    for (let i = 0; i < 5; i++) {
      s = triggerFlash(s, "player");
    }
    expect(s.effects.length).toBe(5);
    expect(s.effects.every((e) => e.targetId === "player")).toBe(true);
  });

  it("update with large deltaMs deactivates all short flashes", () => {
    let s = createHitFlashState();
    s = triggerFlash(s, "a", undefined, 50);
    s = triggerFlash(s, "b", undefined, 100);
    s = triggerFlash(s, "c", undefined, 200);
    s = updateFlashes(s, 10000);
    expect(getFlashCount(s)).toBe(0);
  });

  it("clearFlashes then trigger starts fresh", () => {
    let s = triggerFlash(createHitFlashState(), "a");
    s = clearFlashes(s);
    s = triggerFlash(s, "b");
    expect(s.effects.length).toBe(1);
    expect(s.effects[0].targetId).toBe("b");
  });
});
