import { describe, it, expect } from "vitest";
import {
  createAggroState,
  addThreat,
  addDamageThreat,
  addProximityThreat,
  updateAggro,
  getTopThreat,
  getThreat,
  removeThreat,
  clearAggro,
  getEntryCount,
  getSortedEntries,
} from "../../src/core/AggroCalc";

// ── createAggroState ──────────────────────────────────────────────

describe("createAggroState", () => {
  it("returns default config when called with no args", () => {
    const s = createAggroState();
    expect(s.config.threatDecayRate).toBe(5);
    expect(s.config.proximityThreatWeight).toBe(1.0);
    expect(s.config.damageThreatWeight).toBe(2.0);
    expect(s.config.maxThreatEntries).toBe(10);
  });

  it("starts with empty entries", () => {
    const s = createAggroState();
    expect(s.entries).toEqual([]);
  });

  it("allows partial config override — threatDecayRate", () => {
    const s = createAggroState({ threatDecayRate: 10 });
    expect(s.config.threatDecayRate).toBe(10);
    expect(s.config.damageThreatWeight).toBe(2.0);
  });

  it("allows partial config override — maxThreatEntries", () => {
    const s = createAggroState({ maxThreatEntries: 3 });
    expect(s.config.maxThreatEntries).toBe(3);
  });

  it("allows full config override", () => {
    const s = createAggroState({
      threatDecayRate: 1,
      proximityThreatWeight: 0.5,
      damageThreatWeight: 3.0,
      maxThreatEntries: 5,
    });
    expect(s.config.threatDecayRate).toBe(1);
    expect(s.config.proximityThreatWeight).toBe(0.5);
    expect(s.config.damageThreatWeight).toBe(3.0);
    expect(s.config.maxThreatEntries).toBe(5);
  });
});

// ── addThreat ─────────────────────────────────────────────────────

describe("addThreat", () => {
  it("adds a new entry for unknown target", () => {
    const s = addThreat(createAggroState(), "p1", 10, 1000);
    expect(getEntryCount(s)).toBe(1);
    expect(getThreat(s, "p1")).toBe(10);
  });

  it("accumulates threat on existing target", () => {
    let s = addThreat(createAggroState(), "p1", 10, 1000);
    s = addThreat(s, "p1", 5, 2000);
    expect(getThreat(s, "p1")).toBe(15);
  });

  it("updates lastUpdateTime on accumulation", () => {
    let s = addThreat(createAggroState(), "p1", 10, 1000);
    s = addThreat(s, "p1", 5, 2000);
    const entry = s.entries.find((e) => e.targetId === "p1");
    expect(entry!.lastUpdateTime).toBe(2000);
  });

  it("ignores zero amount", () => {
    const s = addThreat(createAggroState(), "p1", 0, 1000);
    expect(getEntryCount(s)).toBe(0);
  });

  it("ignores negative amount", () => {
    const s = addThreat(createAggroState(), "p1", -5, 1000);
    expect(getEntryCount(s)).toBe(0);
  });

  it("respects maxThreatEntries — replaces lowest", () => {
    let s = createAggroState({ maxThreatEntries: 2 });
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 20, 0);
    // Full — adding 'c' with higher threat than lowest (a=10)
    s = addThreat(s, "c", 15, 0);
    expect(getEntryCount(s)).toBe(2);
    expect(getThreat(s, "a")).toBe(0); // replaced
    expect(getThreat(s, "c")).toBe(15);
  });

  it("does not replace if new amount <= lowest when full", () => {
    let s = createAggroState({ maxThreatEntries: 2 });
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 20, 0);
    s = addThreat(s, "c", 5, 0);
    expect(getEntryCount(s)).toBe(2);
    expect(getThreat(s, "c")).toBe(0);
  });

  it("returns same reference if amount <= 0", () => {
    const s = createAggroState();
    expect(addThreat(s, "p1", 0, 0)).toBe(s);
  });

  it("can add multiple distinct targets", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 1, 0);
    s = addThreat(s, "b", 2, 0);
    s = addThreat(s, "c", 3, 0);
    expect(getEntryCount(s)).toBe(3);
  });
});

// ── addDamageThreat ───────────────────────────────────────────────

describe("addDamageThreat", () => {
  it("multiplies damage by damageThreatWeight", () => {
    const s = addDamageThreat(createAggroState(), "p1", 10, 1000);
    expect(getThreat(s, "p1")).toBe(20); // 10 * 2.0
  });

  it("uses custom damageThreatWeight", () => {
    const s = addDamageThreat(
      createAggroState({ damageThreatWeight: 3.0 }),
      "p1",
      10,
      1000,
    );
    expect(getThreat(s, "p1")).toBe(30);
  });

  it("ignores zero damage", () => {
    const s = addDamageThreat(createAggroState(), "p1", 0, 1000);
    expect(getEntryCount(s)).toBe(0);
  });

  it("ignores negative damage", () => {
    const s = addDamageThreat(createAggroState(), "p1", -10, 1000);
    expect(getEntryCount(s)).toBe(0);
  });

  it("accumulates with existing threat", () => {
    let s = addThreat(createAggroState(), "p1", 5, 0);
    s = addDamageThreat(s, "p1", 10, 1000);
    expect(getThreat(s, "p1")).toBe(25); // 5 + 10*2
  });
});

// ── addProximityThreat ────────────────────────────────────────────

describe("addProximityThreat", () => {
  it("calculates proximity threat at distance 0 (max threat)", () => {
    const s = addProximityThreat(createAggroState(), "p1", 0, 100, 0);
    expect(getThreat(s, "p1")).toBe(1.0); // (1-0/100)*1.0
  });

  it("calculates proximity threat at half range", () => {
    const s = addProximityThreat(createAggroState(), "p1", 50, 100, 0);
    expect(getThreat(s, "p1")).toBeCloseTo(0.5);
  });

  it("returns same state if distance >= maxRange", () => {
    const base = createAggroState();
    const s = addProximityThreat(base, "p1", 100, 100, 0);
    expect(s).toBe(base);
  });

  it("returns same state if distance > maxRange", () => {
    const base = createAggroState();
    const s = addProximityThreat(base, "p1", 150, 100, 0);
    expect(s).toBe(base);
  });

  it("returns same state for negative distance", () => {
    const base = createAggroState();
    const s = addProximityThreat(base, "p1", -10, 100, 0);
    expect(s).toBe(base);
  });

  it("returns same state for zero maxRange", () => {
    const base = createAggroState();
    const s = addProximityThreat(base, "p1", 50, 0, 0);
    expect(s).toBe(base);
  });

  it("returns same state for negative maxRange", () => {
    const base = createAggroState();
    const s = addProximityThreat(base, "p1", 50, -100, 0);
    expect(s).toBe(base);
  });

  it("uses custom proximityThreatWeight", () => {
    const s = addProximityThreat(
      createAggroState({ proximityThreatWeight: 5.0 }),
      "p1",
      0,
      100,
      0,
    );
    expect(getThreat(s, "p1")).toBe(5.0);
  });

  it("accumulates with existing threat", () => {
    let s = addThreat(createAggroState(), "p1", 10, 0);
    s = addProximityThreat(s, "p1", 0, 100, 100);
    expect(getThreat(s, "p1")).toBe(11.0);
  });

  it("close distance produces more threat than far", () => {
    const base = createAggroState();
    const close = addProximityThreat(base, "p1", 10, 100, 0);
    const far = addProximityThreat(base, "p2", 90, 100, 0);
    expect(getThreat(close, "p1")).toBeGreaterThan(getThreat(far, "p2"));
  });
});

// ── updateAggro ───────────────────────────────────────────────────

describe("updateAggro", () => {
  it("decays threat over time", () => {
    let s = addThreat(createAggroState(), "p1", 10, 0);
    s = updateAggro(s, 1000); // 1 second, decay = 5
    expect(getThreat(s, "p1")).toBe(5);
  });

  it("removes entries that decay to zero", () => {
    let s = addThreat(createAggroState(), "p1", 5, 0);
    s = updateAggro(s, 1000); // decay 5 → 0
    expect(getEntryCount(s)).toBe(0);
  });

  it("removes entries that would go negative (clamped)", () => {
    let s = addThreat(createAggroState(), "p1", 3, 0);
    s = updateAggro(s, 2000); // decay 10 → clamped to 0
    expect(getEntryCount(s)).toBe(0);
  });

  it("decays with fractional seconds", () => {
    let s = addThreat(createAggroState(), "p1", 10, 0);
    s = updateAggro(s, 500); // 0.5s, decay = 2.5
    expect(getThreat(s, "p1")).toBeCloseTo(7.5);
  });

  it("returns same state for zero deltaMs", () => {
    const s = addThreat(createAggroState(), "p1", 10, 0);
    expect(updateAggro(s, 0)).toBe(s);
  });

  it("returns same state for negative deltaMs", () => {
    const s = addThreat(createAggroState(), "p1", 10, 0);
    expect(updateAggro(s, -100)).toBe(s);
  });

  it("decays all entries equally", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 20, 0);
    s = addThreat(s, "b", 10, 0);
    s = updateAggro(s, 1000);
    expect(getThreat(s, "a")).toBe(15);
    expect(getThreat(s, "b")).toBe(5);
  });

  it("uses custom threatDecayRate", () => {
    let s = addThreat(createAggroState({ threatDecayRate: 10 }), "p1", 20, 0);
    s = updateAggro(s, 1000);
    expect(getThreat(s, "p1")).toBe(10);
  });

  it("partial decay keeps entry alive", () => {
    let s = addThreat(createAggroState(), "p1", 100, 0);
    s = updateAggro(s, 1000);
    expect(getEntryCount(s)).toBe(1);
    expect(getThreat(s, "p1")).toBe(95);
  });

  it("multiple updates accumulate decay", () => {
    let s = addThreat(createAggroState(), "p1", 20, 0);
    s = updateAggro(s, 1000);
    s = updateAggro(s, 1000);
    expect(getThreat(s, "p1")).toBe(10);
  });
});

// ── getTopThreat ──────────────────────────────────────────────────

describe("getTopThreat", () => {
  it("returns null for empty state", () => {
    expect(getTopThreat(createAggroState())).toBeNull();
  });

  it("returns the single entry", () => {
    const s = addThreat(createAggroState(), "p1", 10, 0);
    expect(getTopThreat(s)!.targetId).toBe("p1");
  });

  it("returns highest threat target", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 5, 0);
    s = addThreat(s, "b", 20, 0);
    s = addThreat(s, "c", 10, 0);
    expect(getTopThreat(s)!.targetId).toBe("b");
    expect(getTopThreat(s)!.threat).toBe(20);
  });

  it("returns first if tied", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 10, 0);
    const top = getTopThreat(s)!;
    expect(top.threat).toBe(10);
  });
});

// ── getThreat ─────────────────────────────────────────────────────

describe("getThreat", () => {
  it("returns 0 for unknown target", () => {
    expect(getThreat(createAggroState(), "unknown")).toBe(0);
  });

  it("returns correct threat for known target", () => {
    const s = addThreat(createAggroState(), "p1", 42, 0);
    expect(getThreat(s, "p1")).toBe(42);
  });

  it("returns 0 after target removed", () => {
    let s = addThreat(createAggroState(), "p1", 10, 0);
    s = removeThreat(s, "p1");
    expect(getThreat(s, "p1")).toBe(0);
  });
});

// ── removeThreat ──────────────────────────────────────────────────

describe("removeThreat", () => {
  it("removes existing target", () => {
    let s = addThreat(createAggroState(), "p1", 10, 0);
    s = removeThreat(s, "p1");
    expect(getEntryCount(s)).toBe(0);
  });

  it("returns same state if target not found", () => {
    const s = addThreat(createAggroState(), "p1", 10, 0);
    expect(removeThreat(s, "unknown")).toBe(s);
  });

  it("only removes specified target", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 20, 0);
    s = removeThreat(s, "a");
    expect(getEntryCount(s)).toBe(1);
    expect(getThreat(s, "b")).toBe(20);
  });
});

// ── clearAggro ────────────────────────────────────────────────────

describe("clearAggro", () => {
  it("clears all entries", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 20, 0);
    s = clearAggro(s);
    expect(getEntryCount(s)).toBe(0);
  });

  it("returns same state if already empty", () => {
    const s = createAggroState();
    expect(clearAggro(s)).toBe(s);
  });
});

// ── getEntryCount ─────────────────────────────────────────────────

describe("getEntryCount", () => {
  it("returns 0 for new state", () => {
    expect(getEntryCount(createAggroState())).toBe(0);
  });

  it("counts correctly after adds", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 1, 0);
    s = addThreat(s, "b", 2, 0);
    expect(getEntryCount(s)).toBe(2);
  });

  it("counts correctly after remove", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 1, 0);
    s = addThreat(s, "b", 2, 0);
    s = removeThreat(s, "a");
    expect(getEntryCount(s)).toBe(1);
  });
});

// ── getSortedEntries ──────────────────────────────────────────────

describe("getSortedEntries", () => {
  it("returns empty array for empty state", () => {
    expect(getSortedEntries(createAggroState())).toEqual([]);
  });

  it("returns sorted by threat descending", () => {
    let s = createAggroState();
    s = addThreat(s, "low", 5, 0);
    s = addThreat(s, "high", 50, 0);
    s = addThreat(s, "mid", 25, 0);
    const sorted = getSortedEntries(s);
    expect(sorted[0].targetId).toBe("high");
    expect(sorted[1].targetId).toBe("mid");
    expect(sorted[2].targetId).toBe("low");
  });

  it("does not mutate original entries order", () => {
    let s = createAggroState();
    s = addThreat(s, "b", 1, 0);
    s = addThreat(s, "a", 100, 0);
    const originalFirst = s.entries[0].targetId;
    getSortedEntries(s);
    expect(s.entries[0].targetId).toBe(originalFirst);
  });

  it("returns all entries", () => {
    let s = createAggroState();
    s = addThreat(s, "a", 1, 0);
    s = addThreat(s, "b", 2, 0);
    s = addThreat(s, "c", 3, 0);
    expect(getSortedEntries(s).length).toBe(3);
  });
});

// ── Immutability ──────────────────────────────────────────────────

describe("immutability", () => {
  it("addThreat does not mutate original state", () => {
    const s1 = createAggroState();
    const s2 = addThreat(s1, "p1", 10, 0);
    expect(s1.entries.length).toBe(0);
    expect(s2.entries.length).toBe(1);
  });

  it("updateAggro does not mutate original state", () => {
    const s1 = addThreat(createAggroState(), "p1", 10, 0);
    const s2 = updateAggro(s1, 1000);
    expect(getThreat(s1, "p1")).toBe(10);
    expect(getThreat(s2, "p1")).toBe(5);
  });

  it("removeThreat does not mutate original state", () => {
    const s1 = addThreat(createAggroState(), "p1", 10, 0);
    const s2 = removeThreat(s1, "p1");
    expect(getEntryCount(s1)).toBe(1);
    expect(getEntryCount(s2)).toBe(0);
  });

  it("clearAggro does not mutate original state", () => {
    const s1 = addThreat(createAggroState(), "p1", 10, 0);
    const s2 = clearAggro(s1);
    expect(getEntryCount(s1)).toBe(1);
    expect(getEntryCount(s2)).toBe(0);
  });
});

// ── Integration / Edge Cases ──────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: add → damage → proximity → decay → top → clear", () => {
    let s = createAggroState();
    s = addThreat(s, "hero", 5, 0);
    s = addDamageThreat(s, "hero", 10, 100);
    s = addProximityThreat(s, "ally", 25, 100, 200);
    expect(getEntryCount(s)).toBe(2);
    expect(getThreat(s, "hero")).toBe(25); // 5 + 10*2
    expect(getThreat(s, "ally")).toBeCloseTo(0.75);
    expect(getTopThreat(s)!.targetId).toBe("hero");

    s = updateAggro(s, 1000); // decay 5
    expect(getThreat(s, "hero")).toBe(20);
    // ally had 0.75, decays to 0 → removed
    expect(getEntryCount(s)).toBe(1);

    s = clearAggro(s);
    expect(getEntryCount(s)).toBe(0);
    expect(getTopThreat(s)).toBeNull();
  });

  it("maxThreatEntries=1 only keeps the highest", () => {
    let s = createAggroState({ maxThreatEntries: 1 });
    s = addThreat(s, "a", 10, 0);
    s = addThreat(s, "b", 20, 0);
    expect(getEntryCount(s)).toBe(1);
    expect(getThreat(s, "b")).toBe(20);
  });

  it("rapid threat additions to same target", () => {
    let s = createAggroState();
    for (let i = 0; i < 100; i++) {
      s = addThreat(s, "p1", 1, i);
    }
    expect(getThreat(s, "p1")).toBe(100);
    expect(getEntryCount(s)).toBe(1);
  });

  it("decay rate 0 means no decay", () => {
    let s = addThreat(createAggroState({ threatDecayRate: 0 }), "p1", 10, 0);
    s = updateAggro(s, 10000);
    expect(getThreat(s, "p1")).toBe(10);
  });

  it("very small deltaMs produces proportional decay", () => {
    let s = addThreat(createAggroState(), "p1", 100, 0);
    s = updateAggro(s, 1); // 0.001s, decay = 0.005
    expect(getThreat(s, "p1")).toBeCloseTo(99.995);
  });
});
