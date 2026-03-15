import { describe, it, expect } from "vitest";
import {
  createSlowFieldState,
  addField,
  updateFields,
  removeField,
  getSlowAtPosition,
  getActiveFields,
  isInField,
  getAffectedFieldCount,
  clearFields,
  getFieldCount,
  getSpeedMultiplier,
} from "../../src/core/SlowFieldCalc";
import type { SlowField } from "../../src/core/SlowFieldCalc";

// ─── createSlowFieldState ───────────────────────────────────────────

describe("createSlowFieldState", () => {
  it("returns empty fields with default maxFields=10", () => {
    const s = createSlowFieldState();
    expect(s.fields).toEqual([]);
    expect(s.maxFields).toBe(10);
  });

  it("accepts custom maxFields", () => {
    const s = createSlowFieldState(5);
    expect(s.maxFields).toBe(5);
  });

  it("fields array is empty on creation", () => {
    const s = createSlowFieldState(20);
    expect(s.fields.length).toBe(0);
  });
});

// ─── addField ───────────────────────────────────────────────────────

describe("addField", () => {
  it("adds a field with correct properties", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 200, 50, 0.3, 5000);
    expect(s.fields.length).toBe(1);
    const f = s.fields[0];
    expect(f.x).toBe(100);
    expect(f.y).toBe(200);
    expect(f.radius).toBe(50);
    expect(f.slowPercent).toBe(0.3);
    expect(f.duration).toBe(5000);
    expect(f.elapsed).toBe(0);
    expect(f.active).toBe(true);
  });

  it("generates unique ids for each field", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    s = addField(s, 0, 0, 10, 0.5, 1000);
    expect(s.fields[0].id).not.toBe(s.fields[1].id);
  });

  it("clamps slowPercent above 1 to 1", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 1.5, 1000);
    expect(s.fields[0].slowPercent).toBe(1);
  });

  it("clamps slowPercent below 0 to 0", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, -0.5, 1000);
    expect(s.fields[0].slowPercent).toBe(0);
  });

  it("clamps negative radius to 0", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, -10, 0.5, 1000);
    expect(s.fields[0].radius).toBe(0);
  });

  it("clamps negative duration to 0", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, -500);
    expect(s.fields[0].duration).toBe(0);
  });

  it("removes oldest field when maxFields exceeded", () => {
    let s = createSlowFieldState(2);
    s = addField(s, 1, 0, 10, 0.1, 1000);
    s = addField(s, 2, 0, 10, 0.2, 1000);
    s = addField(s, 3, 0, 10, 0.3, 1000);
    expect(s.fields.length).toBe(2);
    expect(s.fields[0].x).toBe(2);
    expect(s.fields[1].x).toBe(3);
  });

  it("returns new state (immutable)", () => {
    const s1 = createSlowFieldState();
    const s2 = addField(s1, 0, 0, 10, 0.5, 1000);
    expect(s1).not.toBe(s2);
    expect(s1.fields.length).toBe(0);
  });

  it("can add field at origin", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 100, 0.5, 3000);
    expect(s.fields[0].x).toBe(0);
    expect(s.fields[0].y).toBe(0);
  });

  it("handles maxFields=1", () => {
    let s = createSlowFieldState(1);
    s = addField(s, 10, 10, 5, 0.2, 1000);
    s = addField(s, 20, 20, 5, 0.3, 1000);
    expect(s.fields.length).toBe(1);
    expect(s.fields[0].x).toBe(20);
  });
});

// ─── updateFields ───────────────────────────────────────────────────

describe("updateFields", () => {
  it("advances elapsed time", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = updateFields(s, 1000);
    expect(s.fields[0].elapsed).toBe(1000);
  });

  it("deactivates field when elapsed >= duration", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 2000);
    s = updateFields(s, 2000);
    expect(s.fields[0].active).toBe(false);
  });

  it("deactivates field when elapsed exceeds duration", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 2000);
    s = updateFields(s, 3000);
    expect(s.fields[0].active).toBe(false);
    expect(s.fields[0].elapsed).toBe(3000);
  });

  it("does not modify already inactive fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    s = updateFields(s, 1500); // deactivates
    const elapsedAfterDeactivation = s.fields[0].elapsed;
    s = updateFields(s, 500);
    expect(s.fields[0].elapsed).toBe(elapsedAfterDeactivation);
    expect(s.fields[0].active).toBe(false);
  });

  it("handles multiple fields with different durations", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    s = addField(s, 10, 10, 10, 0.3, 3000);
    s = updateFields(s, 1500);
    expect(s.fields[0].active).toBe(false);
    expect(s.fields[1].active).toBe(true);
    expect(s.fields[1].elapsed).toBe(1500);
  });

  it("returns new state (immutable)", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    const s2 = updateFields(s, 100);
    expect(s).not.toBe(s2);
    expect(s.fields[0].elapsed).toBe(0);
  });

  it("handles zero deltaMs", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = updateFields(s, 0);
    expect(s.fields[0].elapsed).toBe(0);
    expect(s.fields[0].active).toBe(true);
  });

  it("handles empty state", () => {
    const s = createSlowFieldState();
    const s2 = updateFields(s, 1000);
    expect(s2.fields.length).toBe(0);
  });
});

// ─── removeField ────────────────────────────────────────────────────

describe("removeField", () => {
  it("removes field by id", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    const id = s.fields[0].id;
    s = removeField(s, id);
    expect(s.fields.length).toBe(0);
  });

  it("does nothing when id not found", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    s = removeField(s, "nonexistent");
    expect(s.fields.length).toBe(1);
  });

  it("returns new state (immutable)", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 1000);
    const s2 = removeField(s, s.fields[0].id);
    expect(s.fields.length).toBe(1);
    expect(s2.fields.length).toBe(0);
  });

  it("removes only the targeted field", () => {
    let s = createSlowFieldState();
    s = addField(s, 1, 0, 10, 0.5, 1000);
    s = addField(s, 2, 0, 10, 0.5, 1000);
    s = addField(s, 3, 0, 10, 0.5, 1000);
    const id = s.fields[1].id;
    s = removeField(s, id);
    expect(s.fields.length).toBe(2);
    expect(s.fields[0].x).toBe(1);
    expect(s.fields[1].x).toBe(3);
  });
});

// ─── isInField ──────────────────────────────────────────────────────

describe("isInField", () => {
  const field: SlowField = {
    id: "test",
    x: 100,
    y: 100,
    radius: 50,
    slowPercent: 0.5,
    duration: 5000,
    elapsed: 0,
    active: true,
  };

  it("returns true for point at center", () => {
    expect(isInField(100, 100, field)).toBe(true);
  });

  it("returns true for point inside radius", () => {
    expect(isInField(120, 100, field)).toBe(true);
  });

  it("returns true for point exactly on boundary", () => {
    expect(isInField(150, 100, field)).toBe(true);
  });

  it("returns false for point outside radius", () => {
    expect(isInField(200, 200, field)).toBe(false);
  });

  it("returns false for point just outside radius", () => {
    expect(isInField(151, 100, field)).toBe(false);
  });

  it("handles zero radius (only center point)", () => {
    const zeroField: SlowField = { ...field, radius: 0 };
    expect(isInField(100, 100, zeroField)).toBe(true);
    expect(isInField(101, 100, zeroField)).toBe(false);
  });

  it("works with negative coordinates", () => {
    const negField: SlowField = { ...field, x: -50, y: -50 };
    expect(isInField(-50, -50, negField)).toBe(true);
    expect(isInField(-30, -50, negField)).toBe(true);
  });
});

// ─── getSlowAtPosition ─────────────────────────────────────────────

describe("getSlowAtPosition", () => {
  it("returns 0 when no fields exist", () => {
    const s = createSlowFieldState();
    expect(getSlowAtPosition(s, 100, 100)).toBe(0);
  });

  it("returns 0 when position is outside all fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    expect(getSlowAtPosition(s, 500, 500)).toBe(0);
  });

  it("returns slowPercent when inside one field", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.4, 5000);
    expect(getSlowAtPosition(s, 100, 100)).toBe(0.4);
  });

  it("returns strongest slow from overlapping fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.3, 5000);
    s = addField(s, 110, 100, 50, 0.7, 5000);
    expect(getSlowAtPosition(s, 105, 100)).toBe(0.7);
  });

  it("ignores inactive fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.8, 1000);
    s = updateFields(s, 1500); // deactivate
    expect(getSlowAtPosition(s, 100, 100)).toBe(0);
  });

  it("returns correct slow with mix of active/inactive", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.8, 500);
    s = addField(s, 100, 100, 50, 0.3, 5000);
    s = updateFields(s, 600); // first expires
    expect(getSlowAtPosition(s, 100, 100)).toBe(0.3);
  });
});

// ─── getActiveFields ────────────────────────────────────────────────

describe("getActiveFields", () => {
  it("returns empty array for empty state", () => {
    const s = createSlowFieldState();
    expect(getActiveFields(s)).toEqual([]);
  });

  it("returns only active fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 500);
    s = addField(s, 10, 10, 10, 0.3, 5000);
    s = updateFields(s, 600);
    const active = getActiveFields(s);
    expect(active.length).toBe(1);
    expect(active[0].slowPercent).toBe(0.3);
  });

  it("returns all fields when all active", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = addField(s, 10, 10, 10, 0.3, 5000);
    expect(getActiveFields(s).length).toBe(2);
  });
});

// ─── getAffectedFieldCount ──────────────────────────────────────────

describe("getAffectedFieldCount", () => {
  it("returns 0 for empty state", () => {
    const s = createSlowFieldState();
    expect(getAffectedFieldCount(s, 0, 0)).toBe(0);
  });

  it("returns 0 when outside all fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    expect(getAffectedFieldCount(s, 500, 500)).toBe(0);
  });

  it("counts overlapping active fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.3, 5000);
    s = addField(s, 110, 100, 50, 0.4, 5000);
    s = addField(s, 120, 100, 50, 0.5, 5000);
    expect(getAffectedFieldCount(s, 105, 100)).toBe(3);
  });

  it("ignores inactive fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.3, 500);
    s = addField(s, 100, 100, 50, 0.4, 5000);
    s = updateFields(s, 600);
    expect(getAffectedFieldCount(s, 100, 100)).toBe(1);
  });
});

// ─── clearFields ────────────────────────────────────────────────────

describe("clearFields", () => {
  it("removes all fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = addField(s, 10, 10, 10, 0.3, 5000);
    s = clearFields(s);
    expect(s.fields.length).toBe(0);
  });

  it("preserves maxFields", () => {
    let s = createSlowFieldState(5);
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = clearFields(s);
    expect(s.maxFields).toBe(5);
  });

  it("returns new state (immutable)", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    const s2 = clearFields(s);
    expect(s.fields.length).toBe(1);
    expect(s2.fields.length).toBe(0);
  });

  it("clearing empty state is safe", () => {
    const s = createSlowFieldState();
    const s2 = clearFields(s);
    expect(s2.fields.length).toBe(0);
  });
});

// ─── getFieldCount ──────────────────────────────────────────────────

describe("getFieldCount", () => {
  it("returns 0 for empty state", () => {
    const s = createSlowFieldState();
    expect(getFieldCount(s)).toBe(0);
  });

  it("counts only active fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 500);
    s = addField(s, 10, 10, 10, 0.3, 5000);
    s = updateFields(s, 600);
    expect(getFieldCount(s)).toBe(1);
  });

  it("counts all fields when all active", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    s = addField(s, 10, 10, 10, 0.3, 5000);
    s = addField(s, 20, 20, 10, 0.2, 5000);
    expect(getFieldCount(s)).toBe(3);
  });

  it("returns 0 when all expired", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 500);
    s = addField(s, 10, 10, 10, 0.3, 500);
    s = updateFields(s, 600);
    expect(getFieldCount(s)).toBe(0);
  });
});

// ─── getSpeedMultiplier ─────────────────────────────────────────────

describe("getSpeedMultiplier", () => {
  it("returns 1.0 when no slow affects position", () => {
    const s = createSlowFieldState();
    expect(getSpeedMultiplier(s, 100, 100)).toBe(1.0);
  });

  it("returns 1.0 - slowPercent when inside a field", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.4, 5000);
    expect(getSpeedMultiplier(s, 100, 100)).toBeCloseTo(0.6);
  });

  it("returns 0.0 when slowPercent is 1.0", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 1.0, 5000);
    expect(getSpeedMultiplier(s, 100, 100)).toBe(0.0);
  });

  it("uses strongest slow for multiplier", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.3, 5000);
    s = addField(s, 100, 100, 50, 0.7, 5000);
    expect(getSpeedMultiplier(s, 100, 100)).toBeCloseTo(0.3);
  });

  it("returns 1.0 outside all fields", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 10, 0.5, 5000);
    expect(getSpeedMultiplier(s, 500, 500)).toBe(1.0);
  });
});

// ─── Integration / Edge Cases ───────────────────────────────────────

describe("integration and edge cases", () => {
  it("full lifecycle: add, update, expire, clear", () => {
    let s = createSlowFieldState(5);
    s = addField(s, 100, 100, 50, 0.5, 2000);
    s = addField(s, 200, 200, 30, 0.3, 4000);
    expect(getFieldCount(s)).toBe(2);

    s = updateFields(s, 1000);
    expect(getFieldCount(s)).toBe(2);
    expect(getSpeedMultiplier(s, 100, 100)).toBeCloseTo(0.5);

    s = updateFields(s, 1500); // first expires at 2500ms
    expect(getFieldCount(s)).toBe(1);

    s = clearFields(s);
    expect(getFieldCount(s)).toBe(0);
    expect(getSpeedMultiplier(s, 200, 200)).toBe(1.0);
  });

  it("fields at game boundaries (720x1280)", () => {
    let s = createSlowFieldState();
    s = addField(s, 0, 0, 50, 0.5, 5000);
    s = addField(s, 720, 1280, 50, 0.3, 5000);
    expect(isInField(10, 10, s.fields[0])).toBe(true);
    expect(isInField(710, 1270, s.fields[1])).toBe(true);
    expect(isInField(360, 640, s.fields[0])).toBe(false);
  });

  it("many fields at same position", () => {
    let s = createSlowFieldState(20);
    for (let i = 0; i < 10; i++) {
      s = addField(s, 100, 100, 50, (i + 1) * 0.1, 5000);
    }
    expect(getSlowAtPosition(s, 100, 100)).toBeCloseTo(1.0);
    expect(getAffectedFieldCount(s, 100, 100)).toBe(10);
  });

  it("removing a field does not affect others", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.5, 5000);
    s = addField(s, 200, 200, 50, 0.3, 5000);
    const id = s.fields[0].id;
    s = removeField(s, id);
    expect(getSlowAtPosition(s, 200, 200)).toBe(0.3);
    expect(getSlowAtPosition(s, 100, 100)).toBe(0);
  });

  it("rapid add/remove cycle", () => {
    let s = createSlowFieldState(3);
    s = addField(s, 0, 0, 10, 0.1, 1000);
    s = addField(s, 10, 0, 10, 0.2, 1000);
    s = addField(s, 20, 0, 10, 0.3, 1000);
    s = removeField(s, s.fields[0].id);
    s = addField(s, 30, 0, 10, 0.4, 1000);
    expect(s.fields.length).toBe(3);
  });

  it("diagonal distance check", () => {
    let s = createSlowFieldState();
    // radius 50, point at (135, 135) from center (100,100) => dist ~49.5 => inside
    s = addField(s, 100, 100, 50, 0.5, 5000);
    const dist = Math.sqrt(35 * 35 + 35 * 35); // ~49.497
    expect(dist).toBeLessThan(50);
    expect(isInField(135, 135, s.fields[0])).toBe(true);
  });

  it("diagonal distance just outside", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.5, 5000);
    // (136, 136) => dist ~50.91 => outside
    const dist = Math.sqrt(36 * 36 + 36 * 36);
    expect(dist).toBeGreaterThan(50);
    expect(isInField(136, 136, s.fields[0])).toBe(false);
  });

  it("field with zero duration deactivates immediately on update", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.5, 0);
    expect(s.fields[0].active).toBe(true); // active before update
    s = updateFields(s, 0);
    expect(s.fields[0].active).toBe(false);
  });

  it("maxFields overflow removes multiple oldest", () => {
    let s = createSlowFieldState(2);
    s = addField(s, 1, 0, 10, 0.1, 1000);
    s = addField(s, 2, 0, 10, 0.2, 1000);
    // State is full (2). Adding one more removes the oldest.
    s = addField(s, 3, 0, 10, 0.3, 1000);
    expect(s.fields.length).toBe(2);
    expect(s.fields[0].x).toBe(2);
  });

  it("getSpeedMultiplier with no active fields after expiration", () => {
    let s = createSlowFieldState();
    s = addField(s, 100, 100, 50, 0.9, 100);
    s = updateFields(s, 200);
    expect(getSpeedMultiplier(s, 100, 100)).toBe(1.0);
  });

  it("large radius field covers wide area", () => {
    let s = createSlowFieldState();
    s = addField(s, 360, 640, 1000, 0.5, 5000);
    expect(isInField(0, 0, s.fields[0])).toBe(true);
    expect(isInField(720, 1280, s.fields[0])).toBe(true);
  });

  it("state immutability across chained operations", () => {
    const s0 = createSlowFieldState();
    const s1 = addField(s0, 0, 0, 10, 0.5, 5000);
    const s2 = addField(s1, 10, 10, 10, 0.3, 5000);
    const s3 = updateFields(s2, 1000);
    const s4 = removeField(s3, s3.fields[0].id);

    // All previous states should be unchanged
    expect(s0.fields.length).toBe(0);
    expect(s1.fields.length).toBe(1);
    expect(s2.fields.length).toBe(2);
    expect(s3.fields.length).toBe(2);
    expect(s4.fields.length).toBe(1);
  });
});
