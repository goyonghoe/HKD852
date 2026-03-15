import { describe, it, expect } from "vitest";
import {
  createSaveManager,
  createSave,
  updateSave,
  deleteSave,
  loadSave,
  getSlotInfo,
  setActiveSlot,
  isSlotOccupied,
  getOccupiedSlots,
  getEmptySlots,
  exportSave,
  importSave,
  calculateChecksum,
  validateSave,
  getNewestSave,
  autoSaveSlot,
  migrateSave,
  type SaveSlot,
} from "../../src/core/SaveSlotCalc";

// ── Helpers ────────────────────────────────────────────

function makeState(count = 3) {
  return createSaveManager(count);
}

function stateWithSave(slotId = 0, name = "Test", data = '{"hp":100}') {
  const s = makeState();
  return createSave(s, slotId, name, data).state;
}

// ── createSaveManager ──────────────────────────────────

describe("createSaveManager", () => {
  it("creates 3 null slots by default", () => {
    const s = makeState();
    expect(s.slots).toHaveLength(3);
    expect(s.slots.every((sl) => sl === null)).toBe(true);
    expect(s.maxSlots).toBe(3);
  });

  it("respects custom maxSlots", () => {
    const s = createSaveManager(5);
    expect(s.slots).toHaveLength(5);
    expect(s.maxSlots).toBe(5);
  });

  it("clamps maxSlots to at least 1", () => {
    const s = createSaveManager(0);
    expect(s.maxSlots).toBe(1);
    expect(s.slots).toHaveLength(1);
  });

  it("floors fractional maxSlots", () => {
    const s = createSaveManager(2.9);
    expect(s.maxSlots).toBe(2);
  });

  it("defaults activeSlotId to 0 and autoSave enabled", () => {
    const s = makeState();
    expect(s.activeSlotId).toBe(0);
    expect(s.autoSaveEnabled).toBe(true);
  });
});

// ── createSave ─────────────────────────────────────────

describe("createSave", () => {
  it("creates a save in an empty slot", () => {
    const result = createSave(makeState(), 0, "Run1", '{"x":1}');
    expect(result.success).toBe(true);
    expect(result.state.slots[0]).not.toBeNull();
    expect(result.state.slots[0]!.name).toBe("Run1");
  });

  it("populates all metadata fields", () => {
    const result = createSave(makeState(), 1, "Save", "data");
    const slot = result.state.slots[1]!;
    expect(slot.slotId).toBe(1);
    expect(slot.playtime).toBe(0);
    expect(slot.level).toBe(1);
    expect(slot.totalRuns).toBe(0);
    expect(slot.bestScore).toBe(0);
    expect(slot.version).toBe(1);
    expect(slot.checksum).toBe(calculateChecksum("data"));
  });

  it("fails for an occupied slot", () => {
    const s = stateWithSave(0);
    const result = createSave(s, 0, "Dup", "x");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("occupied");
  });

  it("fails for out-of-range slotId", () => {
    const result = createSave(makeState(), 5, "Bad", "x");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Invalid");
  });

  it("fails for negative slotId", () => {
    const result = createSave(makeState(), -1, "Neg", "x");
    expect(result.success).toBe(false);
  });

  it("does not mutate original state", () => {
    const original = makeState();
    createSave(original, 0, "Test", "data");
    expect(original.slots[0]).toBeNull();
  });
});

// ── updateSave ─────────────────────────────────────────

describe("updateSave", () => {
  it("updates data and playtime", () => {
    const s = stateWithSave(0);
    const result = updateSave(s, 0, '{"hp":50}', 120);
    expect(result.success).toBe(true);
    const slot = result.state.slots[0]!;
    expect(slot.data).toBe('{"hp":50}');
    expect(slot.playtime).toBe(120);
  });

  it("recalculates checksum on update", () => {
    const s = stateWithSave(0, "T", "old");
    const result = updateSave(s, 0, "new", 10);
    expect(result.state.slots[0]!.checksum).toBe(calculateChecksum("new"));
  });

  it("fails on empty slot", () => {
    const result = updateSave(makeState(), 1, "data", 0);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("fails on invalid slotId", () => {
    const result = updateSave(makeState(), 99, "data", 0);
    expect(result.success).toBe(false);
  });
});

// ── deleteSave ─────────────────────────────────────────

describe("deleteSave", () => {
  it("clears an occupied slot", () => {
    const s = stateWithSave(0);
    const result = deleteSave(s, 0);
    expect(result.success).toBe(true);
    expect(result.state.slots[0]).toBeNull();
  });

  it("fails on already empty slot", () => {
    const result = deleteSave(makeState(), 0);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("fails on invalid slotId", () => {
    const result = deleteSave(makeState(), -1);
    expect(result.success).toBe(false);
  });
});

// ── loadSave ───────────────────────────────────────────

describe("loadSave", () => {
  it("returns data for a valid save", () => {
    const s = stateWithSave(0, "T", '{"hp":100}');
    const result = loadSave(s, 0);
    expect(result.success).toBe(true);
    expect(result.data).toBe('{"hp":100}');
  });

  it("fails on empty slot", () => {
    const result = loadSave(makeState(), 0);
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  it("fails on invalid slotId", () => {
    const result = loadSave(makeState(), 10);
    expect(result.success).toBe(false);
  });
});

// ── getSlotInfo ────────────────────────────────────────

describe("getSlotInfo", () => {
  it("returns metadata without data field", () => {
    const s = stateWithSave(1, "Meta", "secret");
    const info = getSlotInfo(s, 1);
    expect(info).not.toBeNull();
    expect(info!.name).toBe("Meta");
    expect((info as Record<string, unknown>)["data"]).toBeUndefined();
  });

  it("returns null for empty slot", () => {
    expect(getSlotInfo(makeState(), 0)).toBeNull();
  });

  it("returns null for invalid slotId", () => {
    expect(getSlotInfo(makeState(), 99)).toBeNull();
  });
});

// ── setActiveSlot ──────────────────────────────────────

describe("setActiveSlot", () => {
  it("switches active slot", () => {
    const result = setActiveSlot(makeState(), 2);
    expect(result.success).toBe(true);
    expect(result.state.activeSlotId).toBe(2);
  });

  it("fails for out-of-range slot", () => {
    const result = setActiveSlot(makeState(), 5);
    expect(result.success).toBe(false);
  });
});

// ── isSlotOccupied ─────────────────────────────────────

describe("isSlotOccupied", () => {
  it("returns false for empty slot", () => {
    expect(isSlotOccupied(makeState(), 0)).toBe(false);
  });

  it("returns true for occupied slot", () => {
    expect(isSlotOccupied(stateWithSave(1), 1)).toBe(true);
  });

  it("returns false for invalid slotId", () => {
    expect(isSlotOccupied(makeState(), -1)).toBe(false);
  });
});

// ── getOccupiedSlots / getEmptySlots ───────────────────

describe("getOccupiedSlots", () => {
  it("returns empty array when no saves", () => {
    expect(getOccupiedSlots(makeState())).toHaveLength(0);
  });

  it("returns all occupied slots", () => {
    let s = stateWithSave(0);
    s = createSave(s, 2, "B", "y").state;
    const occ = getOccupiedSlots(s);
    expect(occ).toHaveLength(2);
    expect(occ.map((o) => o.slotId)).toContain(0);
    expect(occ.map((o) => o.slotId)).toContain(2);
  });
});

describe("getEmptySlots", () => {
  it("returns all IDs when no saves", () => {
    expect(getEmptySlots(makeState())).toEqual([0, 1, 2]);
  });

  it("excludes occupied slot IDs", () => {
    const s = stateWithSave(1);
    expect(getEmptySlots(s)).toEqual([0, 2]);
  });
});

// ── export / import ────────────────────────────────────

describe("exportSave / importSave", () => {
  it("round-trips a save through export and import", () => {
    const s = stateWithSave(0, "Export", '{"gold":500}');
    const slot = s.slots[0]!;
    const exported = exportSave(slot);
    expect(typeof exported).toBe("string");

    const result = importSave(makeState(), 1, exported);
    expect(result.success).toBe(true);
    const imported = result.state.slots[1]!;
    expect(imported.name).toBe("Export");
    expect(imported.data).toBe('{"gold":500}');
    expect(imported.slotId).toBe(1); // re-mapped to target slot
  });

  it("fails to import into occupied slot", () => {
    const s = stateWithSave(0);
    const exported = exportSave(s.slots[0]!);
    const result = importSave(s, 0, exported);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("occupied");
  });

  it("fails on corrupt base64", () => {
    const result = importSave(makeState(), 0, "!!!not-base64!!!");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Invalid");
  });

  it("fails on tampered checksum", () => {
    const s = stateWithSave(0, "T", "original");
    const slot = s.slots[0]!;
    // Tamper with data after export creation
    const tampered = { ...slot, data: "tampered" };
    const exported = exportSave(tampered);
    const result = importSave(makeState(), 0, exported);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Checksum");
  });

  it("fails on invalid slotId", () => {
    const result = importSave(makeState(), 99, "abc");
    expect(result.success).toBe(false);
  });
});

// ── calculateChecksum ──────────────────────────────────

describe("calculateChecksum", () => {
  it("returns consistent hash for same input", () => {
    const a = calculateChecksum("hello");
    const b = calculateChecksum("hello");
    expect(a).toBe(b);
  });

  it("returns different hash for different input", () => {
    expect(calculateChecksum("aaa")).not.toBe(calculateChecksum("bbb"));
  });

  it("returns 8-char hex string", () => {
    const cs = calculateChecksum("test");
    expect(cs).toMatch(/^[0-9a-f]{8}$/);
  });

  it("handles empty string", () => {
    const cs = calculateChecksum("");
    expect(cs).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ── validateSave ───────────────────────────────────────

describe("validateSave", () => {
  it("returns true for valid save", () => {
    const s = stateWithSave(0, "V", "data");
    expect(validateSave(s.slots[0]!)).toBe(true);
  });

  it("returns false for mismatched checksum", () => {
    const s = stateWithSave(0, "V", "data");
    const bad = { ...s.slots[0]!, checksum: "deadbeef" } as SaveSlot;
    expect(validateSave(bad)).toBe(false);
  });

  it("returns false for null-like input", () => {
    expect(validateSave(null as unknown as SaveSlot)).toBe(false);
    expect(validateSave(undefined as unknown as SaveSlot)).toBe(false);
  });
});

// ── getNewestSave ──────────────────────────────────────

describe("getNewestSave", () => {
  it("returns null when all slots empty", () => {
    expect(getNewestSave(makeState())).toBeNull();
  });

  it("returns the save with the highest updatedAt", () => {
    let s = stateWithSave(0, "Old", "a");
    s = createSave(s, 2, "New", "b").state;
    // Manually set updatedAt to guarantee ordering
    const oldSlot = { ...s.slots[0]!, updatedAt: 1000 };
    const newSlot = { ...s.slots[2]!, updatedAt: 2000 };
    const fixed: typeof s = {
      ...s,
      slots: [oldSlot, null, newSlot],
    };
    const newest = getNewestSave(fixed);
    expect(newest).not.toBeNull();
    expect(newest!.slotId).toBe(2);
  });

  it("returns single save when only one exists", () => {
    const s = stateWithSave(1, "Only", "x");
    expect(getNewestSave(s)!.slotId).toBe(1);
  });
});

// ── autoSaveSlot ───────────────────────────────────────

describe("autoSaveSlot", () => {
  it("returns active slot when it has data", () => {
    const s = stateWithSave(0);
    expect(autoSaveSlot(s)).toBe(0);
  });

  it("returns first slot when all empty", () => {
    expect(autoSaveSlot(makeState())).toBe(0);
  });

  it("returns oldest occupied slot when active is empty", () => {
    let s = makeState();
    s = createSave(s, 1, "A", "a").state;
    s = createSave(s, 2, "B", "b").state;
    // active is 0 (empty), oldest occupied should be 1
    expect(autoSaveSlot(s)).toBe(1);
  });
});

// ── migrateSave ────────────────────────────────────────

describe("migrateSave", () => {
  it("bumps version number", () => {
    const s = stateWithSave(0);
    const slot = s.slots[0]!;
    const migrated = migrateSave(slot, 2);
    expect(migrated.version).toBe(2);
  });

  it("returns same slot if version is already at target", () => {
    const s = stateWithSave(0);
    const slot = s.slots[0]!;
    const same = migrateSave(slot, slot.version);
    expect(same).toBe(slot); // identity — no copy needed
  });

  it("returns same slot if version exceeds target", () => {
    const s = stateWithSave(0);
    const slot = s.slots[0]!;
    const same = migrateSave(slot, 0);
    expect(same).toBe(slot);
  });

  it("preserves all other fields", () => {
    const s = stateWithSave(0, "Migr", '{"level":5}');
    const slot = s.slots[0]!;
    const migrated = migrateSave(slot, 3);
    expect(migrated.name).toBe("Migr");
    expect(migrated.data).toBe('{"level":5}');
    expect(migrated.checksum).toBe(slot.checksum);
  });
});

// ── Immutability ───────────────────────────────────────

describe("immutability", () => {
  it("createSave does not mutate original slots array", () => {
    const s = makeState();
    const ref = s.slots;
    createSave(s, 0, "X", "y");
    expect(s.slots).toBe(ref);
    expect(s.slots[0]).toBeNull();
  });

  it("updateSave does not mutate original", () => {
    const s = stateWithSave(0, "T", "old");
    const oldData = s.slots[0]!.data;
    updateSave(s, 0, "new", 50);
    expect(s.slots[0]!.data).toBe(oldData);
  });

  it("deleteSave does not mutate original", () => {
    const s = stateWithSave(0);
    deleteSave(s, 0);
    expect(s.slots[0]).not.toBeNull();
  });
});
