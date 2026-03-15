import { describe, it, expect } from "vitest";
import {
  createFormation,
  getSlotPositions,
  rotateFormation,
  scaleFormation,
  moveFormation,
  assignUnitsToSlots,
  checkCoherence,
  splitFormation,
  mergeFormations,
  setFormationFacing,
  getSlotFacings,
  addSlots,
  removeSlots,
  getOccupiedCount,
  getAvailableCount,
  unassignUnit,
  getUnitSlot,
  getBoundingRadius,
  setFormationCenter,
} from "../../src/core/FormationCalc";

// ── createFormation ──

describe("createFormation", () => {
  it("creates line formation", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 5, 10);
    expect(f.type).toBe("line");
    expect(f.slots).toHaveLength(5);
    expect(f.spacing).toBe(10);
    expect(f.rotationRad).toBe(0);
  });

  it("creates circle formation", () => {
    const f = createFormation("circle", { x: 100, y: 100 }, 8, 20);
    expect(f.slots).toHaveLength(8);
  });

  it("creates v-shape formation", () => {
    const f = createFormation("v-shape", { x: 0, y: 0 }, 5, 10);
    expect(f.slots).toHaveLength(5);
  });

  it("creates wedge formation", () => {
    const f = createFormation("wedge", { x: 0, y: 0 }, 6, 10);
    expect(f.slots).toHaveLength(6);
  });

  it("creates random-cluster formation", () => {
    const f = createFormation("random-cluster", { x: 50, y: 50 }, 10, 15);
    expect(f.slots).toHaveLength(10);
  });

  it("creates grid formation", () => {
    const f = createFormation("grid", { x: 0, y: 0 }, 9, 10);
    expect(f.slots).toHaveLength(9);
  });

  it("handles 0 units", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 0, 10);
    expect(f.slots).toHaveLength(0);
  });

  it("handles 1 unit", () => {
    const f = createFormation("circle", { x: 50, y: 50 }, 1, 10);
    expect(f.slots).toHaveLength(1);
    expect(f.slots[0].position.x).toBeCloseTo(50);
    expect(f.slots[0].position.y).toBeCloseTo(50);
  });

  it("negative count treated as 0", () => {
    const f = createFormation("line", { x: 0, y: 0 }, -3, 10);
    expect(f.slots).toHaveLength(0);
  });

  it("slots are unoccupied initially", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    for (const s of f.slots) {
      expect(s.occupied).toBe(false);
      expect(s.assignedUnitId).toBeNull();
    }
  });
});

// ── getSlotPositions ──

describe("getSlotPositions", () => {
  it("returns positions array", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const positions = getSlotPositions(f);
    expect(positions).toHaveLength(3);
  });

  it("line formation positions are centered", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const positions = getSlotPositions(f);
    expect(positions[0].x).toBeCloseTo(-10);
    expect(positions[1].x).toBeCloseTo(0);
    expect(positions[2].x).toBeCloseTo(10);
  });
});

// ── rotateFormation ──

describe("rotateFormation", () => {
  it("rotates slots around center", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const r = rotateFormation(f, Math.PI / 2);
    expect(r.rotationRad).toBeCloseTo(Math.PI / 2);
    const positions = getSlotPositions(r);
    expect(Math.abs(positions[0].x)).toBeLessThan(1);
  });

  it("cumulative rotation", () => {
    let f = createFormation("line", { x: 0, y: 0 }, 2, 10);
    f = rotateFormation(f, Math.PI / 4);
    f = rotateFormation(f, Math.PI / 4);
    expect(f.rotationRad).toBeCloseTo(Math.PI / 2);
  });
});

// ── scaleFormation ──

describe("scaleFormation", () => {
  it("doubles spacing", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const s = scaleFormation(f, 2);
    expect(s.spacing).toBe(20);
    const positions = getSlotPositions(s);
    expect(positions[2].x).toBeCloseTo(20);
  });

  it("halves spacing", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const s = scaleFormation(f, 0.5);
    expect(s.spacing).toBe(5);
  });

  it("zero or negative scale is no-op", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(scaleFormation(f, 0).spacing).toBe(10);
    expect(scaleFormation(f, -1).spacing).toBe(10);
  });
});

// ── moveFormation ──

describe("moveFormation", () => {
  it("translates all slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const m = moveFormation(f, { x: 100, y: 200 });
    expect(m.center).toEqual({ x: 100, y: 200 });
    const positions = getSlotPositions(m);
    expect(positions[1].x).toBeCloseTo(100);
    expect(positions[1].y).toBeCloseTo(200);
  });
});

// ── assignUnitsToSlots ──

describe("assignUnitsToSlots", () => {
  it("assigns units to nearest slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const units = [
      { unitId: "u1", position: { x: -9, y: 0 } },
      { unitId: "u2", position: { x: 1, y: 0 } },
    ];
    const assigned = assignUnitsToSlots(f, units);
    expect(getOccupiedCount(assigned)).toBe(2);
  });

  it("excess units ignored", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 2, 10);
    const units = [
      { unitId: "u1", position: { x: 0, y: 0 } },
      { unitId: "u2", position: { x: 5, y: 0 } },
      { unitId: "u3", position: { x: 10, y: 0 } },
    ];
    const assigned = assignUnitsToSlots(f, units);
    expect(getOccupiedCount(assigned)).toBe(2);
  });

  it("no units is no-op", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const assigned = assignUnitsToSlots(f, []);
    expect(getOccupiedCount(assigned)).toBe(0);
  });
});

// ── checkCoherence ──

describe("checkCoherence", () => {
  it("returns 1 when all units at slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 2, 10);
    const positions = getSlotPositions(f);
    const units = [
      { unitId: "u1", position: positions[0] },
      { unitId: "u2", position: positions[1] },
    ];
    const assigned = assignUnitsToSlots(f, units);
    expect(checkCoherence(assigned, units, 1)).toBe(1);
  });

  it("returns 0 when all units far from slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 2, 10);
    const units = [
      { unitId: "u1", position: { x: 0, y: 0 } },
      { unitId: "u2", position: { x: 5, y: 0 } },
    ];
    const assigned = assignUnitsToSlots(f, units);
    const farUnits = [
      { unitId: "u1", position: { x: 999, y: 999 } },
      { unitId: "u2", position: { x: 999, y: 999 } },
    ];
    expect(checkCoherence(assigned, farUnits, 1)).toBe(0);
  });

  it("returns 1 for empty formation", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(checkCoherence(f, [], 1)).toBe(1);
  });
});

// ── splitFormation ──

describe("splitFormation", () => {
  it("splits into 2 groups", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 6, 10);
    const groups = splitFormation(f, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].slots.length + groups[1].slots.length).toBe(6);
  });

  it("split 1 returns original slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 4, 10);
    const groups = splitFormation(f, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0].slots).toHaveLength(4);
  });

  it("split count > slots capped", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const groups = splitFormation(f, 10);
    expect(groups.length).toBeLessThanOrEqual(3);
  });
});

// ── mergeFormations ──

describe("mergeFormations", () => {
  it("merges two formations", () => {
    const a = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const b = createFormation("line", { x: 100, y: 0 }, 2, 10);
    const merged = mergeFormations(a, b);
    expect(merged.slots).toHaveLength(5);
    expect(merged.center.x).toBeCloseTo(50);
  });
});

// ── setFormationFacing / getSlotFacings ──

describe("facing", () => {
  it("setFormationFacing points toward target", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const r = setFormationFacing(f, { x: 100, y: 0 });
    expect(r.facing).toBeCloseTo(0);
  });

  it("setFormationFacing upward", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const r = setFormationFacing(f, { x: 0, y: 100 });
    expect(r.facing).toBeCloseTo(Math.PI / 2);
  });

  it("getSlotFacings returns array of angles", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const facings = getSlotFacings(f, { x: 100, y: 0 });
    expect(facings).toHaveLength(3);
  });
});

// ── addSlots / removeSlots ──

describe("addSlots / removeSlots", () => {
  it("adds slots", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const f2 = addSlots(f, 2);
    expect(f2.slots).toHaveLength(5);
  });

  it("add 0 is no-op", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(addSlots(f, 0).slots).toHaveLength(3);
  });

  it("removeSlots removes from end", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 5, 10);
    const f2 = removeSlots(f, 2);
    expect(f2.slots).toHaveLength(3);
  });

  it("removeSlots 0 is no-op", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(removeSlots(f, 0).slots).toHaveLength(3);
  });

  it("removeSlots more than available empties", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(removeSlots(f, 10).slots).toHaveLength(0);
  });
});

// ── getOccupiedCount / getAvailableCount ──

describe("occupied / available counts", () => {
  it("all available initially", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 5, 10);
    expect(getOccupiedCount(f)).toBe(0);
    expect(getAvailableCount(f)).toBe(5);
  });

  it("after assignment", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 5, 10);
    const a = assignUnitsToSlots(f, [
      { unitId: "u1", position: { x: 0, y: 0 } },
    ]);
    expect(getOccupiedCount(a)).toBe(1);
    expect(getAvailableCount(a)).toBe(4);
  });
});

// ── unassignUnit ──

describe("unassignUnit", () => {
  it("unassigns a unit", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    let a = assignUnitsToSlots(f, [{ unitId: "u1", position: { x: 0, y: 0 } }]);
    a = unassignUnit(a, "u1");
    expect(getOccupiedCount(a)).toBe(0);
  });

  it("no-op for unknown unit", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const a = unassignUnit(f, "nope");
    expect(getOccupiedCount(a)).toBe(0);
  });
});

// ── getUnitSlot ──

describe("getUnitSlot", () => {
  it("returns slot for assigned unit", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const a = assignUnitsToSlots(f, [
      { unitId: "u1", position: { x: 0, y: 0 } },
    ]);
    const slot = getUnitSlot(a, "u1");
    expect(slot).not.toBeNull();
    expect(slot!.assignedUnitId).toBe("u1");
  });

  it("returns null for unassigned unit", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(getUnitSlot(f, "u1")).toBeNull();
  });
});

// ── getBoundingRadius ──

describe("getBoundingRadius", () => {
  it("returns 0 for empty formation", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 0, 10);
    expect(getBoundingRadius(f)).toBe(0);
  });

  it("returns max distance from center", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(getBoundingRadius(f)).toBeCloseTo(10);
  });
});

// ── setFormationCenter ──

describe("setFormationCenter", () => {
  it("moves formation to new center", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const m = setFormationCenter(f, { x: 50, y: 100 });
    expect(m.center).toEqual({ x: 50, y: 100 });
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("createFormation returns new object each time", () => {
    const a = createFormation("line", { x: 0, y: 0 }, 3, 10);
    const b = createFormation("line", { x: 0, y: 0 }, 3, 10);
    expect(a).not.toBe(b);
  });

  it("rotateFormation does not mutate original", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    rotateFormation(f, Math.PI);
    expect(f.rotationRad).toBe(0);
  });

  it("moveFormation does not mutate original", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    moveFormation(f, { x: 100, y: 100 });
    expect(f.center).toEqual({ x: 0, y: 0 });
  });

  it("assignUnitsToSlots does not mutate original", () => {
    const f = createFormation("line", { x: 0, y: 0 }, 3, 10);
    assignUnitsToSlots(f, [{ unitId: "u1", position: { x: 0, y: 0 } }]);
    expect(getOccupiedCount(f)).toBe(0);
  });
});
