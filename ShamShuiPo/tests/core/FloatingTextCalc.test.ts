import { describe, it, expect } from "vitest";
import {
  createFloatingTextState,
  spawnText,
  updateTexts,
  getActiveTexts,
  getCurrentY,
  getCurrentAlpha,
  getDefaultColor,
  getDefaultScale,
  clearTexts,
  getTextCount,
  type FloatingText,
} from "../../src/core/FloatingTextCalc";

// ─── createFloatingTextState ────────────────────────────────────

describe("createFloatingTextState", () => {
  it("returns default values", () => {
    const s = createFloatingTextState();
    expect(s.maxTexts).toBe(30);
    expect(s.riseSpeed).toBe(60);
    expect(s.fadeDuration).toBe(800);
    expect(s.texts).toEqual([]);
    expect(s.nextId).toBe(1);
  });

  it("accepts custom maxTexts", () => {
    const s = createFloatingTextState(10);
    expect(s.maxTexts).toBe(10);
  });

  it("accepts custom riseSpeed", () => {
    const s = createFloatingTextState(30, 120);
    expect(s.riseSpeed).toBe(120);
  });

  it("accepts custom fadeDuration", () => {
    const s = createFloatingTextState(30, 60, 500);
    expect(s.fadeDuration).toBe(500);
  });

  it("accepts all custom values", () => {
    const s = createFloatingTextState(5, 100, 1000);
    expect(s.maxTexts).toBe(5);
    expect(s.riseSpeed).toBe(100);
    expect(s.fadeDuration).toBe(1000);
  });

  it("starts with empty texts array", () => {
    const s = createFloatingTextState();
    expect(s.texts.length).toBe(0);
  });
});

// ─── getDefaultColor ────────────────────────────────────────────

describe("getDefaultColor", () => {
  it("returns white for damage", () => {
    expect(getDefaultColor("damage")).toBe("#FFFFFF");
  });

  it("returns red for crit", () => {
    expect(getDefaultColor("crit")).toBe("#FF4444");
  });

  it("returns green for heal", () => {
    expect(getDefaultColor("heal")).toBe("#44FF44");
  });

  it("returns yellow for xp", () => {
    expect(getDefaultColor("xp")).toBe("#FFFF00");
  });

  it("returns gold for gold", () => {
    expect(getDefaultColor("gold")).toBe("#FFD700");
  });

  it("returns gray for miss", () => {
    expect(getDefaultColor("miss")).toBe("#888888");
  });

  it("returns blue for status", () => {
    expect(getDefaultColor("status")).toBe("#44AAFF");
  });
});

// ─── getDefaultScale ────────────────────────────────────────────

describe("getDefaultScale", () => {
  it("returns 1.5 for crit", () => {
    expect(getDefaultScale("crit")).toBe(1.5);
  });

  it("returns 1.0 for damage", () => {
    expect(getDefaultScale("damage")).toBe(1.0);
  });

  it("returns 1.0 for heal", () => {
    expect(getDefaultScale("heal")).toBe(1.0);
  });

  it("returns 0.8 for xp", () => {
    expect(getDefaultScale("xp")).toBe(0.8);
  });

  it("returns 0.8 for gold", () => {
    expect(getDefaultScale("gold")).toBe(0.8);
  });

  it("returns 0.7 for miss", () => {
    expect(getDefaultScale("miss")).toBe(0.7);
  });

  it("returns 0.9 for status", () => {
    expect(getDefaultScale("status")).toBe(0.9);
  });
});

// ─── spawnText ──────────────────────────────────────────────────

describe("spawnText", () => {
  it("creates a floating text with correct fields", () => {
    const s0 = createFloatingTextState();
    const s1 = spawnText(s0, "damage", "50", 100, 200);
    expect(s1.texts.length).toBe(1);
    const t = s1.texts[0];
    expect(t.id).toBe(1);
    expect(t.type).toBe("damage");
    expect(t.text).toBe("50");
    expect(t.x).toBe(100);
    expect(t.y).toBe(200);
    expect(t.startY).toBe(200);
    expect(t.age).toBe(0);
    expect(t.active).toBe(true);
    expect(t.alpha).toBe(1.0);
  });

  it("uses default color when none provided", () => {
    const s = spawnText(createFloatingTextState(), "crit", "999", 0, 0);
    expect(s.texts[0].color).toBe("#FF4444");
  });

  it("uses custom color when provided", () => {
    const s = spawnText(
      createFloatingTextState(),
      "damage",
      "10",
      0,
      0,
      "#ABCDEF",
    );
    expect(s.texts[0].color).toBe("#ABCDEF");
  });

  it("uses default scale based on type", () => {
    const s = spawnText(createFloatingTextState(), "crit", "!", 0, 0);
    expect(s.texts[0].scale).toBe(1.5);
  });

  it("increments nextId", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    expect(s.nextId).toBe(2);
    s = spawnText(s, "damage", "2", 0, 0);
    expect(s.nextId).toBe(3);
  });

  it("assigns sequential ids", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "a", 0, 0);
    s = spawnText(s, "heal", "b", 0, 0);
    s = spawnText(s, "xp", "c", 0, 0);
    expect(s.texts.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("trims oldest when maxTexts exceeded", () => {
    let s = createFloatingTextState(3);
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "damage", "2", 0, 0);
    s = spawnText(s, "damage", "3", 0, 0);
    s = spawnText(s, "damage", "4", 0, 0);
    expect(s.texts.length).toBe(3);
    expect(s.texts[0].text).toBe("2");
    expect(s.texts[2].text).toBe("4");
  });

  it("does not mutate original state", () => {
    const s0 = createFloatingTextState();
    const s1 = spawnText(s0, "damage", "x", 0, 0);
    expect(s0.texts.length).toBe(0);
    expect(s1.texts.length).toBe(1);
  });

  it("sets age to 0", () => {
    const s = spawnText(createFloatingTextState(), "gold", "+5", 50, 100);
    expect(s.texts[0].age).toBe(0);
  });

  it("sets duration based on fadeDuration + 400", () => {
    const s = spawnText(
      createFloatingTextState(30, 60, 800),
      "damage",
      "1",
      0,
      0,
    );
    expect(s.texts[0].duration).toBe(1200);
  });

  it("handles miss type correctly", () => {
    const s = spawnText(createFloatingTextState(), "miss", "MISS", 10, 20);
    const t = s.texts[0];
    expect(t.type).toBe("miss");
    expect(t.scale).toBe(0.7);
    expect(t.color).toBe("#888888");
  });
});

// ─── getCurrentY ────────────────────────────────────────────────

describe("getCurrentY", () => {
  const makeText = (age: number, startY: number): FloatingText => ({
    id: 1,
    type: "damage",
    text: "1",
    x: 0,
    y: startY,
    startY,
    age,
    duration: 1200,
    scale: 1,
    alpha: 1,
    color: "#FFF",
    active: true,
  });

  it("returns startY when age is 0", () => {
    expect(getCurrentY(makeText(0, 500), 60)).toBe(500);
  });

  it("rises by riseSpeed * time", () => {
    // 1 second at 60px/s => 60px rise
    expect(getCurrentY(makeText(1000, 500), 60)).toBe(440);
  });

  it("rises proportionally at half second", () => {
    expect(getCurrentY(makeText(500, 500), 60)).toBe(470);
  });

  it("works with different riseSpeed", () => {
    expect(getCurrentY(makeText(1000, 300), 120)).toBe(180);
  });
});

// ─── getCurrentAlpha ────────────────────────────────────────────

describe("getCurrentAlpha", () => {
  const makeText = (age: number, duration: number): FloatingText => ({
    id: 1,
    type: "damage",
    text: "1",
    x: 0,
    y: 0,
    startY: 0,
    age,
    duration,
    scale: 1,
    alpha: 1,
    color: "#FFF",
    active: true,
  });

  it("returns 1.0 before fade starts", () => {
    // duration=1200, fadeDuration=800, fadeStart=400
    expect(getCurrentAlpha(makeText(0, 1200), 800)).toBe(1.0);
    expect(getCurrentAlpha(makeText(200, 1200), 800)).toBe(1.0);
    expect(getCurrentAlpha(makeText(400, 1200), 800)).toBe(1.0);
  });

  it("fades linearly after fadeStart", () => {
    // fadeStart=400, at 800ms => 400/800 elapsed => alpha=0.5
    expect(getCurrentAlpha(makeText(800, 1200), 800)).toBeCloseTo(0.5);
  });

  it("returns 0 at duration end", () => {
    expect(getCurrentAlpha(makeText(1200, 1200), 800)).toBe(0);
  });

  it("clamps to 0 past duration", () => {
    expect(getCurrentAlpha(makeText(1500, 1200), 800)).toBe(0);
  });

  it("returns 1.0 when fadeDuration equals duration (always fading)", () => {
    // fadeStart=0, at age 0 => alpha=1.0
    expect(getCurrentAlpha(makeText(0, 800), 800)).toBe(1.0);
  });

  it("fades from start when fadeDuration equals duration", () => {
    expect(getCurrentAlpha(makeText(400, 800), 800)).toBeCloseTo(0.5);
  });
});

// ─── updateTexts ────────────────────────────────────────────────

describe("updateTexts", () => {
  it("advances age of active texts", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "10", 100, 500);
    s = updateTexts(s, 100);
    expect(s.texts[0].age).toBe(100);
  });

  it("updates y position as text rises", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "10", 100, 500);
    s = updateTexts(s, 1000); // 1s => 60px rise
    expect(s.texts[0].y).toBeCloseTo(440);
  });

  it("keeps alpha at 1.0 before fade phase", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "10", 0, 0);
    // duration = 1200, fadeStart = 400
    s = updateTexts(s, 200);
    expect(s.texts[0].alpha).toBe(1.0);
  });

  it("reduces alpha during fade phase", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "10", 0, 0);
    // duration = 1200, fadeStart = 400, at 800ms => alpha ~0.5
    s = updateTexts(s, 800);
    expect(s.texts[0].alpha).toBeCloseTo(0.5);
  });

  it("deactivates text when age >= duration", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "10", 0, 0);
    s = updateTexts(s, 1200); // duration = 1200
    expect(s.texts[0].active).toBe(false);
    expect(s.texts[0].alpha).toBe(0);
  });

  it("does not modify inactive texts", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "10", 0, 500);
    s = updateTexts(s, 1300); // deactivate
    const y1 = s.texts[0].y;
    const age1 = s.texts[0].age;
    s = updateTexts(s, 100); // update again
    expect(s.texts[0].y).toBe(y1);
    expect(s.texts[0].age).toBe(age1);
  });

  it("handles multiple texts independently", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "A", 0, 100);
    s = updateTexts(s, 500);
    s = spawnText(s, "heal", "B", 0, 200);
    s = updateTexts(s, 200);
    expect(s.texts[0].age).toBe(700); // A: 500 + 200
    expect(s.texts[1].age).toBe(200); // B: 200
  });

  it("does not mutate original state", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "x", 0, 0);
    const before = s;
    const after = updateTexts(s, 100);
    expect(before.texts[0].age).toBe(0);
    expect(after.texts[0].age).toBe(100);
  });

  it("handles zero deltaMs", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "x", 0, 100);
    s = updateTexts(s, 0);
    expect(s.texts[0].age).toBe(0);
    expect(s.texts[0].y).toBe(100);
  });
});

// ─── getActiveTexts ─────────────────────────────────────────────

describe("getActiveTexts", () => {
  it("returns empty for fresh state", () => {
    expect(getActiveTexts(createFloatingTextState())).toEqual([]);
  });

  it("returns all spawned texts", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "heal", "2", 0, 0);
    expect(getActiveTexts(s).length).toBe(2);
  });

  it("excludes deactivated texts", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "heal", "2", 0, 0);
    s = updateTexts(s, 1300); // both expire (duration=1200)
    expect(getActiveTexts(s).length).toBe(0);
  });

  it("returns mix of active and inactive correctly", () => {
    let s = createFloatingTextState(30, 60, 100); // short fadeDuration => duration=500
    s = spawnText(s, "damage", "1", 0, 0);
    s = updateTexts(s, 400);
    s = spawnText(s, "heal", "2", 0, 0); // fresh, age=0
    s = updateTexts(s, 200); // text1 age=600 (>500), text2 age=200
    const active = getActiveTexts(s);
    expect(active.length).toBe(1);
    expect(active[0].text).toBe("2");
  });
});

// ─── clearTexts ─────────────────────────────────────────────────

describe("clearTexts", () => {
  it("removes all texts", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "heal", "2", 0, 0);
    s = clearTexts(s);
    expect(s.texts.length).toBe(0);
  });

  it("preserves other state fields", () => {
    let s = createFloatingTextState(10, 120, 500);
    s = spawnText(s, "damage", "1", 0, 0);
    s = clearTexts(s);
    expect(s.maxTexts).toBe(10);
    expect(s.riseSpeed).toBe(120);
    expect(s.fadeDuration).toBe(500);
    expect(s.nextId).toBe(2); // nextId is preserved
  });

  it("does not mutate original", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    const before = s;
    clearTexts(s);
    expect(before.texts.length).toBe(1);
  });
});

// ─── getTextCount ───────────────────────────────────────────────

describe("getTextCount", () => {
  it("returns 0 for empty state", () => {
    expect(getTextCount(createFloatingTextState())).toBe(0);
  });

  it("counts active texts", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "damage", "2", 0, 0);
    expect(getTextCount(s)).toBe(2);
  });

  it("excludes inactive texts", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "damage", "1", 0, 0);
    s = updateTexts(s, 1300);
    expect(getTextCount(s)).toBe(0);
  });

  it("counts correctly with mix", () => {
    let s = createFloatingTextState(30, 60, 100); // duration=500
    s = spawnText(s, "damage", "1", 0, 0);
    s = updateTexts(s, 400);
    s = spawnText(s, "heal", "2", 0, 0);
    s = updateTexts(s, 200); // text1 expired, text2 alive
    expect(getTextCount(s)).toBe(1);
  });
});

// ─── Integration / edge cases ───────────────────────────────────

describe("integration", () => {
  it("full lifecycle: spawn -> update -> fade -> deactivate", () => {
    let s = createFloatingTextState(30, 60, 800);
    s = spawnText(s, "crit", "999", 360, 640);

    // Just spawned
    expect(getTextCount(s)).toBe(1);
    expect(s.texts[0].alpha).toBe(1.0);

    // Before fade
    s = updateTexts(s, 300);
    expect(s.texts[0].active).toBe(true);
    expect(s.texts[0].alpha).toBe(1.0);

    // During fade
    s = updateTexts(s, 500); // age=800, fadeStart=400
    expect(s.texts[0].active).toBe(true);
    expect(s.texts[0].alpha).toBeCloseTo(0.5);

    // At expiry
    s = updateTexts(s, 400); // age=1200
    expect(s.texts[0].active).toBe(false);
    expect(getTextCount(s)).toBe(0);
  });

  it("maxTexts=1 always keeps latest", () => {
    let s = createFloatingTextState(1);
    s = spawnText(s, "damage", "A", 0, 0);
    s = spawnText(s, "damage", "B", 0, 0);
    expect(s.texts.length).toBe(1);
    expect(s.texts[0].text).toBe("B");
  });

  it("rapid spawning respects maxTexts", () => {
    let s = createFloatingTextState(5);
    for (let i = 0; i < 20; i++) {
      s = spawnText(s, "xp", `+${i}`, 0, 0);
    }
    expect(s.texts.length).toBe(5);
    expect(s.texts[0].text).toBe("+15");
    expect(s.texts[4].text).toBe("+19");
  });

  it("spawn after clear resets text list but keeps nextId", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "damage", "1", 0, 0);
    s = spawnText(s, "damage", "2", 0, 0);
    s = clearTexts(s);
    s = spawnText(s, "heal", "3", 0, 0);
    expect(s.texts.length).toBe(1);
    expect(s.texts[0].id).toBe(3);
  });

  it("status type text works correctly", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "status", "POISONED", 200, 300);
    const t = s.texts[0];
    expect(t.type).toBe("status");
    expect(t.scale).toBe(0.9);
    expect(t.color).toBe("#44AAFF");
    expect(t.text).toBe("POISONED");
  });

  it("gold type uses correct defaults", () => {
    let s = createFloatingTextState();
    s = spawnText(s, "gold", "+100", 50, 50);
    expect(s.texts[0].scale).toBe(0.8);
    expect(s.texts[0].color).toBe("#FFD700");
  });
});
