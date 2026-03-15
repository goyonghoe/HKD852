import { describe, it, expect } from "vitest";
import {
  createElementalState,
  getModifier,
  applyElementalDamage,
  isEffective,
  isResisted,
  addModifier,
  removeModifier,
  getWeaknesses,
  getResistances,
  getAllElements,
} from "../../src/core/ElementalCalc";
import type { Element } from "../../src/core/ElementalCalc";

// ─── createElementalState ───────────────────────────────────

describe("createElementalState", () => {
  it("returns an object with modifiers array", () => {
    const state = createElementalState();
    expect(state).toBeDefined();
    expect(Array.isArray(state.modifiers)).toBe(true);
  });

  it("has non-empty default modifiers", () => {
    const state = createElementalState();
    expect(state.modifiers.length).toBeGreaterThan(0);
  });

  it("returns a new instance each call", () => {
    const a = createElementalState();
    const b = createElementalState();
    expect(a).not.toBe(b);
    expect(a.modifiers).not.toBe(b.modifiers);
  });

  it("includes fire>ice modifier at 1.5", () => {
    const state = createElementalState();
    expect(getModifier(state, "fire", "ice")).toBe(1.5);
  });

  it("includes ice>electric modifier at 1.5", () => {
    const state = createElementalState();
    expect(getModifier(state, "ice", "electric")).toBe(1.5);
  });

  it("includes electric>fire modifier at 1.5", () => {
    const state = createElementalState();
    expect(getModifier(state, "electric", "fire")).toBe(1.5);
  });

  it("includes poison>physical modifier at 1.5", () => {
    const state = createElementalState();
    expect(getModifier(state, "poison", "physical")).toBe(1.5);
  });
});

// ─── getModifier ────────────────────────────────────────────

describe("getModifier", () => {
  const state = createElementalState();

  it("returns 1.5 for fire vs ice (effective)", () => {
    expect(getModifier(state, "fire", "ice")).toBe(1.5);
  });

  it("returns 1.5 for ice vs electric", () => {
    expect(getModifier(state, "ice", "electric")).toBe(1.5);
  });

  it("returns 1.5 for electric vs fire", () => {
    expect(getModifier(state, "electric", "fire")).toBe(1.5);
  });

  it("returns 0.5 for same-element fire vs fire", () => {
    expect(getModifier(state, "fire", "fire")).toBe(0.5);
  });

  it("returns 0.5 for same-element ice vs ice", () => {
    expect(getModifier(state, "ice", "ice")).toBe(0.5);
  });

  it("returns 0.5 for same-element electric vs electric", () => {
    expect(getModifier(state, "electric", "electric")).toBe(0.5);
  });

  it("returns 0.5 for same-element poison vs poison", () => {
    expect(getModifier(state, "poison", "poison")).toBe(0.5);
  });

  it("returns 0.5 for same-element physical vs physical", () => {
    expect(getModifier(state, "physical", "physical")).toBe(0.5);
  });

  it("returns 1.0 for void vs any (neutral)", () => {
    expect(getModifier(state, "void", "fire")).toBe(1.0);
    expect(getModifier(state, "void", "ice")).toBe(1.0);
    expect(getModifier(state, "void", "electric")).toBe(1.0);
    expect(getModifier(state, "void", "poison")).toBe(1.0);
    expect(getModifier(state, "void", "physical")).toBe(1.0);
  });

  it("returns 1.0 for void vs void", () => {
    expect(getModifier(state, "void", "void")).toBe(1.0);
  });

  it("returns 1.0 for physical vs elemental (neutral)", () => {
    expect(getModifier(state, "physical", "fire")).toBe(1.0);
    expect(getModifier(state, "physical", "ice")).toBe(1.0);
    expect(getModifier(state, "physical", "electric")).toBe(1.0);
    expect(getModifier(state, "physical", "poison")).toBe(1.0);
  });

  it("returns 1.0 for physical vs void", () => {
    expect(getModifier(state, "physical", "void")).toBe(1.0);
  });

  it("returns 1.0 for elemental vs void (neutral)", () => {
    expect(getModifier(state, "fire", "void")).toBe(1.0);
    expect(getModifier(state, "ice", "void")).toBe(1.0);
    expect(getModifier(state, "electric", "void")).toBe(1.0);
    expect(getModifier(state, "poison", "void")).toBe(1.0);
  });

  it("returns 1.0 for undefined pair (fallback)", () => {
    // fire vs physical has no explicit modifier in defaults
    expect(getModifier(state, "fire", "physical")).toBe(1.0);
  });

  it("returns 1.0 for ice vs poison (no explicit modifier)", () => {
    expect(getModifier(state, "ice", "poison")).toBe(1.0);
  });
});

// ─── applyElementalDamage ───────────────────────────────────

describe("applyElementalDamage", () => {
  const state = createElementalState();

  it("applies 1.5x for effective matchup", () => {
    expect(applyElementalDamage(state, 100, "fire", "ice")).toBe(150);
  });

  it("applies 0.5x for same-element resistance", () => {
    expect(applyElementalDamage(state, 100, "fire", "fire")).toBe(50);
  });

  it("applies 1.0x for neutral matchup", () => {
    expect(applyElementalDamage(state, 100, "void", "fire")).toBe(100);
  });

  it("handles zero base damage", () => {
    expect(applyElementalDamage(state, 0, "fire", "ice")).toBe(0);
  });

  it("handles fractional base damage", () => {
    expect(applyElementalDamage(state, 33, "fire", "ice")).toBeCloseTo(49.5);
  });

  it("handles large base damage", () => {
    expect(applyElementalDamage(state, 10000, "electric", "fire")).toBe(15000);
  });

  it("returns baseDamage * 1.0 for undefined pair", () => {
    expect(applyElementalDamage(state, 80, "fire", "physical")).toBe(80);
  });

  it("poison vs physical deals 1.5x", () => {
    expect(applyElementalDamage(state, 200, "poison", "physical")).toBe(300);
  });
});

// ─── isEffective ────────────────────────────────────────────

describe("isEffective", () => {
  const state = createElementalState();

  it("fire is effective against ice", () => {
    expect(isEffective(state, "fire", "ice")).toBe(true);
  });

  it("ice is effective against electric", () => {
    expect(isEffective(state, "ice", "electric")).toBe(true);
  });

  it("electric is effective against fire", () => {
    expect(isEffective(state, "electric", "fire")).toBe(true);
  });

  it("poison is effective against physical", () => {
    expect(isEffective(state, "poison", "physical")).toBe(true);
  });

  it("fire is NOT effective against fire (same element)", () => {
    expect(isEffective(state, "fire", "fire")).toBe(false);
  });

  it("void is NOT effective against anything", () => {
    for (const el of getAllElements()) {
      expect(isEffective(state, "void", el)).toBe(false);
    }
  });

  it("physical is NOT effective against any element", () => {
    for (const el of getAllElements()) {
      expect(isEffective(state, "physical", el)).toBe(false);
    }
  });
});

// ─── isResisted ─────────────────────────────────────────────

describe("isResisted", () => {
  const state = createElementalState();

  it("fire is resisted by fire (same element)", () => {
    expect(isResisted(state, "fire", "fire")).toBe(true);
  });

  it("ice is resisted by ice", () => {
    expect(isResisted(state, "ice", "ice")).toBe(true);
  });

  it("electric is resisted by electric", () => {
    expect(isResisted(state, "electric", "electric")).toBe(true);
  });

  it("poison is resisted by poison", () => {
    expect(isResisted(state, "poison", "poison")).toBe(true);
  });

  it("physical is resisted by physical", () => {
    expect(isResisted(state, "physical", "physical")).toBe(true);
  });

  it("fire is NOT resisted by ice (fire is effective)", () => {
    expect(isResisted(state, "fire", "ice")).toBe(false);
  });

  it("void is NOT resisted by anything (neutral)", () => {
    for (const el of getAllElements()) {
      expect(isResisted(state, "void", el)).toBe(false);
    }
  });
});

// ─── getWeaknesses ──────────────────────────────────────────

describe("getWeaknesses", () => {
  const state = createElementalState();

  it("ice is weak to fire", () => {
    expect(getWeaknesses(state, "ice")).toContain("fire");
  });

  it("electric is weak to ice", () => {
    expect(getWeaknesses(state, "electric")).toContain("ice");
  });

  it("fire is weak to electric", () => {
    expect(getWeaknesses(state, "fire")).toContain("electric");
  });

  it("physical is weak to poison", () => {
    expect(getWeaknesses(state, "physical")).toContain("poison");
  });

  it("void has no weaknesses", () => {
    expect(getWeaknesses(state, "void")).toHaveLength(0);
  });

  it("ice weakness list has exactly 1 entry", () => {
    expect(getWeaknesses(state, "ice")).toHaveLength(1);
  });

  it("fire weakness list has exactly 1 entry", () => {
    expect(getWeaknesses(state, "fire")).toHaveLength(1);
  });
});

// ─── getResistances ─────────────────────────────────────────

describe("getResistances", () => {
  const state = createElementalState();

  it("fire resists fire", () => {
    expect(getResistances(state, "fire")).toContain("fire");
  });

  it("ice resists ice", () => {
    expect(getResistances(state, "ice")).toContain("ice");
  });

  it("electric resists electric", () => {
    expect(getResistances(state, "electric")).toContain("electric");
  });

  it("poison resists poison", () => {
    expect(getResistances(state, "poison")).toContain("poison");
  });

  it("physical resists physical", () => {
    expect(getResistances(state, "physical")).toContain("physical");
  });

  it("void has no resistances (all neutral)", () => {
    expect(getResistances(state, "void")).toHaveLength(0);
  });

  it("each elemental target has exactly 1 resistance (itself)", () => {
    const elements: Element[] = [
      "fire",
      "ice",
      "electric",
      "poison",
      "physical",
    ];
    for (const el of elements) {
      expect(getResistances(state, el)).toHaveLength(1);
    }
  });
});

// ─── getAllElements ──────────────────────────────────────────

describe("getAllElements", () => {
  it("returns exactly 6 elements", () => {
    expect(getAllElements()).toHaveLength(6);
  });

  it("contains fire", () => {
    expect(getAllElements()).toContain("fire");
  });

  it("contains ice", () => {
    expect(getAllElements()).toContain("ice");
  });

  it("contains electric", () => {
    expect(getAllElements()).toContain("electric");
  });

  it("contains poison", () => {
    expect(getAllElements()).toContain("poison");
  });

  it("contains physical", () => {
    expect(getAllElements()).toContain("physical");
  });

  it("contains void", () => {
    expect(getAllElements()).toContain("void");
  });

  it("returns a new array each call", () => {
    const a = getAllElements();
    const b = getAllElements();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ─── addModifier ────────────────────────────────────────────

describe("addModifier", () => {
  it("adds a new modifier pair", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "physical", 2.0);
    expect(getModifier(next, "fire", "physical")).toBe(2.0);
  });

  it("does not mutate original state", () => {
    const state = createElementalState();
    const originalLen = state.modifiers.length;
    addModifier(state, "fire", "physical", 2.0);
    expect(state.modifiers.length).toBe(originalLen);
  });

  it("overwrites existing modifier for same pair", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "ice", 3.0);
    expect(getModifier(next, "fire", "ice")).toBe(3.0);
  });

  it("does not duplicate when overwriting", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "ice", 3.0);
    const fireIceCount = next.modifiers.filter(
      (m) => m.source === "fire" && m.target === "ice",
    ).length;
    expect(fireIceCount).toBe(1);
  });

  it("preserves other modifiers when adding", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "physical", 2.0);
    expect(getModifier(next, "ice", "electric")).toBe(1.5);
    expect(getModifier(next, "fire", "fire")).toBe(0.5);
  });

  it("can add a modifier with multiplier 0", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "physical", 0);
    expect(getModifier(next, "fire", "physical")).toBe(0);
  });
});

// ─── removeModifier ─────────────────────────────────────────

describe("removeModifier", () => {
  it("removes an existing modifier", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "ice");
    // After removal, getModifier returns fallback 1.0
    expect(getModifier(next, "fire", "ice")).toBe(1.0);
  });

  it("does not mutate original state", () => {
    const state = createElementalState();
    const originalLen = state.modifiers.length;
    removeModifier(state, "fire", "ice");
    expect(state.modifiers.length).toBe(originalLen);
  });

  it("returns same length when removing non-existent pair", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "physical");
    // fire vs physical is not explicitly in defaults, so nothing removed
    expect(next.modifiers.length).toBe(state.modifiers.length);
  });

  it("decrements modifier count by 1 on removal", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "ice");
    expect(next.modifiers.length).toBe(state.modifiers.length - 1);
  });

  it("preserves other modifiers after removal", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "ice");
    expect(getModifier(next, "ice", "electric")).toBe(1.5);
    expect(getModifier(next, "electric", "fire")).toBe(1.5);
  });
});

// ─── Immutability ───────────────────────────────────────────

describe("immutability", () => {
  it("addModifier returns new state object", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "physical", 2.0);
    expect(next).not.toBe(state);
  });

  it("removeModifier returns new state object", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "ice");
    expect(next).not.toBe(state);
  });

  it("addModifier returns new modifiers array", () => {
    const state = createElementalState();
    const next = addModifier(state, "fire", "physical", 2.0);
    expect(next.modifiers).not.toBe(state.modifiers);
  });

  it("removeModifier returns new modifiers array", () => {
    const state = createElementalState();
    const next = removeModifier(state, "fire", "ice");
    expect(next.modifiers).not.toBe(state.modifiers);
  });
});

// ─── Integration / chained operations ───────────────────────

describe("chained operations", () => {
  it("add then remove restores fallback", () => {
    const state = createElementalState();
    const added = addModifier(state, "fire", "physical", 2.5);
    const removed = removeModifier(added, "fire", "physical");
    expect(getModifier(removed, "fire", "physical")).toBe(1.0);
  });

  it("multiple adds update correctly", () => {
    let state = createElementalState();
    state = addModifier(state, "fire", "ice", 2.0);
    state = addModifier(state, "fire", "ice", 3.0);
    expect(getModifier(state, "fire", "ice")).toBe(3.0);
  });

  it("custom modifier affects applyElementalDamage", () => {
    let state = createElementalState();
    state = addModifier(state, "fire", "ice", 3.0);
    expect(applyElementalDamage(state, 100, "fire", "ice")).toBe(300);
  });

  it("removed modifier makes pair neutral in applyElementalDamage", () => {
    let state = createElementalState();
    state = removeModifier(state, "fire", "ice");
    expect(applyElementalDamage(state, 100, "fire", "ice")).toBe(100);
  });

  it("custom modifier changes isEffective result", () => {
    let state = createElementalState();
    // fire vs physical defaults to 1.0 (not effective)
    expect(isEffective(state, "fire", "physical")).toBe(false);
    state = addModifier(state, "fire", "physical", 2.0);
    expect(isEffective(state, "fire", "physical")).toBe(true);
  });

  it("custom modifier changes isResisted result", () => {
    let state = createElementalState();
    expect(isResisted(state, "fire", "ice")).toBe(false);
    state = addModifier(state, "fire", "ice", 0.3);
    expect(isResisted(state, "fire", "ice")).toBe(true);
  });

  it("custom modifier changes getWeaknesses result", () => {
    let state = createElementalState();
    expect(getWeaknesses(state, "void")).toHaveLength(0);
    state = addModifier(state, "fire", "void", 2.0);
    expect(getWeaknesses(state, "void")).toContain("fire");
  });

  it("custom modifier changes getResistances result", () => {
    let state = createElementalState();
    state = addModifier(state, "ice", "void", 0.25);
    expect(getResistances(state, "void")).toContain("ice");
  });
});
