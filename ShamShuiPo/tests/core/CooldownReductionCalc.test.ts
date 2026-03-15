import { describe, it, expect } from "vitest";
import {
  createCDRState,
  addCDRSource,
  removeCDRSource,
  getEffectiveCDR,
  applyCDR,
  getReducedCooldown,
  getCDRFromSource,
  getSourceCount,
  clearSources,
  updateSource,
  getCDRBreakdown,
  setMaxCDR,
} from "../../src/core/CooldownReductionCalc";

describe("CooldownReductionCalc", () => {
  // ── createCDRState ──

  describe("createCDRState", () => {
    it("creates state with default maxCDR 0.75", () => {
      const state = createCDRState();
      expect(state.maxCDR).toBe(0.75);
    });

    it("creates state with empty sources", () => {
      const state = createCDRState();
      expect(state.sources).toEqual([]);
    });

    it("accepts custom maxCDR", () => {
      const state = createCDRState(0.5);
      expect(state.maxCDR).toBe(0.5);
    });

    it("accepts maxCDR of 0", () => {
      const state = createCDRState(0);
      expect(state.maxCDR).toBe(0);
    });

    it("accepts maxCDR of 1", () => {
      const state = createCDRState(1);
      expect(state.maxCDR).toBe(1);
    });
  });

  // ── addCDRSource ──

  describe("addCDRSource", () => {
    it("adds a source to empty state", () => {
      const state = createCDRState();
      const next = addCDRSource(state, "swift-boots", 0.1, "item");
      expect(next.sources).toHaveLength(1);
      expect(next.sources[0]).toEqual({
        id: "swift-boots",
        percent: 0.1,
        source: "item",
      });
    });

    it("does not mutate original state", () => {
      const state = createCDRState();
      addCDRSource(state, "a", 0.1, "item");
      expect(state.sources).toHaveLength(0);
    });

    it("appends multiple sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      state = addCDRSource(state, "c", 0.15, "buff");
      expect(state.sources).toHaveLength(3);
    });

    it("allows duplicate ids (no dedup enforcement)", () => {
      let state = createCDRState();
      state = addCDRSource(state, "x", 0.1, "item");
      state = addCDRSource(state, "x", 0.2, "buff");
      expect(state.sources).toHaveLength(2);
    });

    it("preserves maxCDR when adding", () => {
      const state = createCDRState(0.6);
      const next = addCDRSource(state, "a", 0.1, "item");
      expect(next.maxCDR).toBe(0.6);
    });
  });

  // ── removeCDRSource ──

  describe("removeCDRSource", () => {
    it("removes existing source by id", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      const next = removeCDRSource(state, "a");
      expect(next.sources).toHaveLength(1);
      expect(next.sources[0].id).toBe("b");
    });

    it("does not mutate original state", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      removeCDRSource(state, "a");
      expect(state.sources).toHaveLength(1);
    });

    it("returns same structure when id not found", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      const next = removeCDRSource(state, "nonexistent");
      expect(next.sources).toHaveLength(1);
    });

    it("removes from empty state without error", () => {
      const state = createCDRState();
      const next = removeCDRSource(state, "a");
      expect(next.sources).toHaveLength(0);
    });

    it("preserves maxCDR when removing", () => {
      let state = createCDRState(0.8);
      state = addCDRSource(state, "a", 0.1, "item");
      const next = removeCDRSource(state, "a");
      expect(next.maxCDR).toBe(0.8);
    });
  });

  // ── getEffectiveCDR ──

  describe("getEffectiveCDR", () => {
    it("returns 0 for empty state", () => {
      const state = createCDRState();
      expect(getEffectiveCDR(state)).toBe(0);
    });

    it("returns single source percent", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      expect(getEffectiveCDR(state)).toBeCloseTo(0.2);
    });

    it("uses multiplicative stacking for two sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0.3, "passive");
      // 1 - (0.8 * 0.7) = 1 - 0.56 = 0.44
      expect(getEffectiveCDR(state)).toBeCloseTo(0.44);
    });

    it("uses multiplicative stacking for three sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      state = addCDRSource(state, "c", 0.3, "buff");
      // 1 - (0.9 * 0.8 * 0.7) = 1 - 0.504 = 0.496
      expect(getEffectiveCDR(state)).toBeCloseTo(0.496);
    });

    it("caps at maxCDR", () => {
      let state = createCDRState(0.5);
      state = addCDRSource(state, "a", 0.4, "item");
      state = addCDRSource(state, "b", 0.4, "passive");
      // 1 - (0.6 * 0.6) = 1 - 0.36 = 0.64, capped to 0.5
      expect(getEffectiveCDR(state)).toBe(0.5);
    });

    it("returns exact maxCDR when stacking exceeds cap", () => {
      let state = createCDRState(0.75);
      state = addCDRSource(state, "a", 0.5, "item");
      state = addCDRSource(state, "b", 0.5, "passive");
      state = addCDRSource(state, "c", 0.5, "buff");
      // 1 - (0.5^3) = 0.875, capped to 0.75
      expect(getEffectiveCDR(state)).toBe(0.75);
    });

    it("does not cap when under maxCDR", () => {
      let state = createCDRState(0.75);
      state = addCDRSource(state, "a", 0.1, "item");
      expect(getEffectiveCDR(state)).toBeCloseTo(0.1);
    });

    it("handles 0% source without affecting CDR", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0, "passive");
      expect(getEffectiveCDR(state)).toBeCloseTo(0.2);
    });

    it("handles source with maxCDR=0 always returning 0", () => {
      let state = createCDRState(0);
      state = addCDRSource(state, "a", 0.5, "item");
      expect(getEffectiveCDR(state)).toBe(0);
    });
  });

  // ── applyCDR ──

  describe("applyCDR", () => {
    it("reduces cooldown by cdr fraction", () => {
      expect(applyCDR(10, 0.3)).toBeCloseTo(7);
    });

    it("returns full cooldown when cdr is 0", () => {
      expect(applyCDR(5, 0)).toBe(5);
    });

    it("returns 0 cooldown when cdr is 1", () => {
      expect(applyCDR(5, 1)).toBe(0);
    });

    it("handles small cdr values", () => {
      expect(applyCDR(100, 0.01)).toBeCloseTo(99);
    });

    it("handles zero base cooldown", () => {
      expect(applyCDR(0, 0.5)).toBe(0);
    });
  });

  // ── getReducedCooldown ──

  describe("getReducedCooldown", () => {
    it("returns base cooldown for empty state", () => {
      const state = createCDRState();
      expect(getReducedCooldown(state, 10)).toBe(10);
    });

    it("applies multiplicative CDR to base cooldown", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0.3, "passive");
      // effective CDR = 0.44, cooldown = 10 * 0.56 = 5.6
      expect(getReducedCooldown(state, 10)).toBeCloseTo(5.6);
    });

    it("respects maxCDR cap in reduced cooldown", () => {
      let state = createCDRState(0.5);
      state = addCDRSource(state, "a", 0.9, "item");
      // effective CDR capped at 0.5, cooldown = 8 * 0.5 = 4
      expect(getReducedCooldown(state, 8)).toBeCloseTo(4);
    });

    it("handles zero base cooldown", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.5, "item");
      expect(getReducedCooldown(state, 0)).toBe(0);
    });
  });

  // ── getCDRFromSource ──

  describe("getCDRFromSource", () => {
    it("returns 0 for empty state", () => {
      const state = createCDRState();
      expect(getCDRFromSource(state, "item")).toBe(0);
    });

    it("returns 0 for non-matching source type", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      expect(getCDRFromSource(state, "passive")).toBe(0);
    });

    it("returns CDR from single matching source", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.3, "item");
      expect(getCDRFromSource(state, "item")).toBeCloseTo(0.3);
    });

    it("uses multiplicative stacking for multiple same-source", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0.3, "item");
      // 1 - (0.8 * 0.7) = 0.44
      expect(getCDRFromSource(state, "item")).toBeCloseTo(0.44);
    });

    it("ignores sources of other types", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.5, "item");
      state = addCDRSource(state, "b", 0.5, "passive");
      expect(getCDRFromSource(state, "item")).toBeCloseTo(0.5);
    });
  });

  // ── getSourceCount ──

  describe("getSourceCount", () => {
    it("returns 0 for empty state", () => {
      expect(getSourceCount(createCDRState())).toBe(0);
    });

    it("returns correct count after adds", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      expect(getSourceCount(state)).toBe(2);
    });

    it("returns correct count after remove", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      state = removeCDRSource(state, "a");
      expect(getSourceCount(state)).toBe(1);
    });
  });

  // ── clearSources ──

  describe("clearSources", () => {
    it("returns state with empty sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      const cleared = clearSources(state);
      expect(cleared.sources).toHaveLength(0);
    });

    it("preserves maxCDR", () => {
      let state = createCDRState(0.6);
      state = addCDRSource(state, "a", 0.1, "item");
      const cleared = clearSources(state);
      expect(cleared.maxCDR).toBe(0.6);
    });

    it("does not mutate original", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      clearSources(state);
      expect(state.sources).toHaveLength(1);
    });

    it("works on already empty state", () => {
      const state = createCDRState();
      const cleared = clearSources(state);
      expect(cleared.sources).toHaveLength(0);
    });
  });

  // ── updateSource ──

  describe("updateSource", () => {
    it("updates percent of existing source", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      const updated = updateSource(state, "a", 0.5);
      expect(updated.sources[0].percent).toBe(0.5);
    });

    it("does not mutate original state", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      updateSource(state, "a", 0.5);
      expect(state.sources[0].percent).toBe(0.1);
    });

    it("preserves source type when updating", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      const updated = updateSource(state, "a", 0.3);
      expect(updated.sources[0].source).toBe("item");
      expect(updated.sources[0].id).toBe("a");
    });

    it("does not change other sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      const updated = updateSource(state, "a", 0.5);
      expect(updated.sources[1].percent).toBe(0.2);
    });

    it("leaves state unchanged for nonexistent id", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      const updated = updateSource(state, "z", 0.9);
      expect(updated.sources[0].percent).toBe(0.1);
    });
  });

  // ── getCDRBreakdown ──

  describe("getCDRBreakdown", () => {
    it("returns empty array for empty state", () => {
      const state = createCDRState();
      expect(getCDRBreakdown(state)).toEqual([]);
    });

    it("groups by source type", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "item");
      state = addCDRSource(state, "c", 0.3, "passive");
      const breakdown = getCDRBreakdown(state);
      expect(breakdown).toHaveLength(2);
    });

    it("calculates multiplicative total per group", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0.3, "item");
      const breakdown = getCDRBreakdown(state);
      const itemGroup = breakdown.find((g) => g.source === "item");
      // 1 - (0.8 * 0.7) = 0.44
      expect(itemGroup!.totalPercent).toBeCloseTo(0.44);
    });

    it("handles single source per group", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.25, "buff");
      const breakdown = getCDRBreakdown(state);
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].source).toBe("buff");
      expect(breakdown[0].totalPercent).toBeCloseTo(0.25);
    });

    it("returns correct breakdown for three source types", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      state = addCDRSource(state, "b", 0.2, "passive");
      state = addCDRSource(state, "c", 0.3, "buff");
      const breakdown = getCDRBreakdown(state);
      expect(breakdown).toHaveLength(3);
      const sources = breakdown.map((b) => b.source).sort();
      expect(sources).toEqual(["buff", "item", "passive"]);
    });
  });

  // ── setMaxCDR ──

  describe("setMaxCDR", () => {
    it("updates maxCDR", () => {
      const state = createCDRState(0.75);
      const next = setMaxCDR(state, 0.5);
      expect(next.maxCDR).toBe(0.5);
    });

    it("does not mutate original", () => {
      const state = createCDRState(0.75);
      setMaxCDR(state, 0.5);
      expect(state.maxCDR).toBe(0.75);
    });

    it("preserves sources", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.1, "item");
      const next = setMaxCDR(state, 0.5);
      expect(next.sources).toHaveLength(1);
    });

    it("new maxCDR affects getEffectiveCDR", () => {
      let state = createCDRState(0.75);
      state = addCDRSource(state, "a", 0.5, "item");
      state = addCDRSource(state, "b", 0.5, "passive");
      // raw = 0.75, not capped
      expect(getEffectiveCDR(state)).toBe(0.75);
      const lowered = setMaxCDR(state, 0.4);
      expect(getEffectiveCDR(lowered)).toBe(0.4);
    });
  });

  // ── Integration / Edge Cases ──

  describe("integration", () => {
    it("full workflow: add, update, remove, check CDR", () => {
      let state = createCDRState(0.75);
      state = addCDRSource(state, "boots", 0.1, "item");
      state = addCDRSource(state, "talent", 0.15, "passive");
      state = addCDRSource(state, "haste", 0.2, "buff");
      expect(getSourceCount(state)).toBe(3);

      // multiplicative: 1 - (0.9 * 0.85 * 0.8) = 1 - 0.612 = 0.388
      expect(getEffectiveCDR(state)).toBeCloseTo(0.388);

      // update boots
      state = updateSource(state, "boots", 0.2);
      // 1 - (0.8 * 0.85 * 0.8) = 1 - 0.544 = 0.456
      expect(getEffectiveCDR(state)).toBeCloseTo(0.456);

      // remove buff
      state = removeCDRSource(state, "haste");
      // 1 - (0.8 * 0.85) = 1 - 0.68 = 0.32
      expect(getEffectiveCDR(state)).toBeCloseTo(0.32);

      expect(getReducedCooldown(state, 10)).toBeCloseTo(6.8);
    });

    it("many small sources approach but never reach cap", () => {
      let state = createCDRState(0.75);
      for (let i = 0; i < 20; i++) {
        state = addCDRSource(state, `src-${i}`, 0.05, "passive");
      }
      // 1 - 0.95^20 ≈ 0.6415, under 0.75
      expect(getEffectiveCDR(state)).toBeCloseTo(1 - Math.pow(0.95, 20));
      expect(getEffectiveCDR(state)).toBeLessThan(0.75);
    });

    it("large sources hit cap", () => {
      let state = createCDRState(0.75);
      for (let i = 0; i < 10; i++) {
        state = addCDRSource(state, `src-${i}`, 0.2, "item");
      }
      expect(getEffectiveCDR(state)).toBe(0.75);
    });

    it("clearSources resets effective CDR to 0", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.5, "item");
      state = clearSources(state);
      expect(getEffectiveCDR(state)).toBe(0);
      expect(getReducedCooldown(state, 10)).toBe(10);
    });

    it("breakdown matches effective CDR logic", () => {
      let state = createCDRState();
      state = addCDRSource(state, "a", 0.2, "item");
      state = addCDRSource(state, "b", 0.1, "item");
      state = addCDRSource(state, "c", 0.3, "passive");
      const breakdown = getCDRBreakdown(state);
      const itemGroup = breakdown.find((g) => g.source === "item")!;
      expect(itemGroup.totalPercent).toBeCloseTo(
        getCDRFromSource(state, "item"),
      );
    });
  });
});
