import { describe, it, expect } from "vitest";
import {
  createGachaState,
  pull,
  multiPull,
  getRates,
  getPityProgress,
  isPitySoftActive,
  getGuaranteedIn,
  calculateExpectedPulls,
  getHistory,
  resetPity,
  calculateCost,
  getBannerValue,
  type GachaBanner,
  type GachaItem,
  type GachaState,
  type GachaRarity,
} from "../../src/core/GachaCalc";

// ── Test Fixtures ──────────────────────────────────────────────────

const ITEMS: GachaItem[] = [
  { id: "c1", name: "Common Blade", rarity: "common", weight: 10 },
  { id: "c2", name: "Common Shield", rarity: "common", weight: 10 },
  { id: "r1", name: "Rare Laser", rarity: "rare", weight: 5 },
  { id: "r2", name: "Rare Plasma", rarity: "rare", weight: 5 },
  { id: "e1", name: "Epic Photon", rarity: "epic", weight: 3 },
  { id: "e2", name: "Epic Nova", rarity: "epic", weight: 2 },
  { id: "l1", name: "Legendary Void", rarity: "legendary", weight: 2 },
  { id: "l2", name: "Legendary Aether", rarity: "legendary", weight: 1 },
  { id: "m1", name: "Mythic Omega", rarity: "mythic", weight: 1 },
];

const BANNER: GachaBanner = {
  id: "banner-001",
  name: "Neon Launch",
  items: ITEMS,
  pityThreshold: 50,
  pityRarity: "epic",
  guaranteedPity: true,
};

function makeStateWithSinceLast(
  overrides: Partial<Record<GachaRarity, number>>,
): GachaState {
  return {
    bannerId: "banner-001",
    pullCount: 0,
    sinceLast: {
      common: 0,
      rare: 0,
      epic: overrides.epic ?? 0,
      legendary: overrides.legendary ?? 0,
      mythic: overrides.mythic ?? 0,
      ...overrides,
    },
    totalPulls: 0,
    history: [],
  };
}

// ── createGachaState ───────────────────────────────────────────────

describe("createGachaState", () => {
  it("creates state with correct bannerId", () => {
    const state = createGachaState("test-banner");
    expect(state.bannerId).toBe("test-banner");
  });

  it("starts with zero pullCount", () => {
    const state = createGachaState("b");
    expect(state.pullCount).toBe(0);
  });

  it("starts with zero totalPulls", () => {
    const state = createGachaState("b");
    expect(state.totalPulls).toBe(0);
  });

  it("starts with all sinceLast at zero", () => {
    const state = createGachaState("b");
    expect(state.sinceLast).toEqual({
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    });
  });

  it("starts with empty history", () => {
    const state = createGachaState("b");
    expect(state.history).toEqual([]);
  });
});

// ── pull ───────────────────────────────────────────────────────────

describe("pull", () => {
  it("returns an item from the banner", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    expect(ITEMS.map((i) => i.id)).toContain(result.item.id);
  });

  it("increments pullCount by 1", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    expect(result.state.pullCount).toBe(1);
  });

  it("increments totalPulls by 1", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    expect(result.state.totalPulls).toBe(1);
  });

  it("appends item id to history", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    expect(result.state.history).toContain(result.item.id);
    expect(result.state.history.length).toBe(1);
  });

  it("resets sinceLast for pulled rarity to 0", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    expect(result.state.sinceLast[result.item.rarity]).toBe(0);
  });

  it("increments sinceLast for non-pulled rarities", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 42);
    const pulledRarity = result.item.rarity;
    const others = (
      ["common", "rare", "epic", "legendary", "mythic"] as GachaRarity[]
    ).filter((r) => r !== pulledRarity);
    for (const r of others) {
      expect(result.state.sinceLast[r]).toBe(1);
    }
  });

  it("is deterministic with same seed", () => {
    const state = createGachaState("banner-001");
    const r1 = pull(state, BANNER, 12345);
    const r2 = pull(state, BANNER, 12345);
    expect(r1.item.id).toBe(r2.item.id);
  });

  it("produces different results with different seeds", () => {
    const state = createGachaState("banner-001");
    const results = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      results.add(pull(state, BANNER, seed).item.id);
    }
    // Should produce at least 2 distinct items over 100 seeds
    expect(results.size).toBeGreaterThan(1);
  });

  it("does not mutate input state", () => {
    const state = createGachaState("banner-001");
    const frozen = JSON.parse(JSON.stringify(state));
    pull(state, BANNER, 42);
    expect(state).toEqual(frozen);
  });

  it("chains correctly over multiple pulls", () => {
    let state = createGachaState("banner-001");
    for (let i = 0; i < 10; i++) {
      const result = pull(state, BANNER, i * 7);
      state = result.state;
    }
    expect(state.pullCount).toBe(10);
    expect(state.totalPulls).toBe(10);
    expect(state.history.length).toBe(10);
  });
});

// ── getRates ───────────────────────────────────────────────────────

describe("getRates", () => {
  it("returns base rates for fresh state", () => {
    const state = createGachaState("banner-001");
    const rates = getRates(state, BANNER);
    expect(rates.common).toBeCloseTo(0.6, 2);
    expect(rates.rare).toBeCloseTo(0.25, 2);
    expect(rates.epic).toBeCloseTo(0.1, 2);
    expect(rates.legendary).toBeCloseTo(0.04, 2);
    expect(rates.mythic).toBeCloseTo(0.01, 2);
  });

  it("rates sum to 1", () => {
    const state = createGachaState("banner-001");
    const rates = getRates(state, BANNER);
    const sum =
      rates.common + rates.rare + rates.epic + rates.legendary + rates.mythic;
    expect(sum).toBeCloseTo(1, 5);
  });

  it("increases epic rate after soft pity threshold", () => {
    const state = makeStateWithSinceLast({
      epic: 60,
      legendary: 60,
      mythic: 60,
    });
    const rates = getRates(state, BANNER);
    // 10 pulls past threshold * 2% = 20% bonus
    expect(rates.epic).toBeGreaterThan(0.1);
  });

  it("does not activate soft pity at exactly threshold", () => {
    const state = makeStateWithSinceLast({
      epic: 50,
      legendary: 50,
      mythic: 50,
    });
    const rates = getRates(state, BANNER);
    expect(rates.epic).toBeCloseTo(0.1, 2);
  });

  it("guarantees legendary at 90 pulls", () => {
    const state = makeStateWithSinceLast({ legendary: 90, mythic: 90 });
    const rates = getRates(state, BANNER);
    expect(rates.legendary).toBeCloseTo(1, 5);
  });

  it("guarantees mythic at 180 pulls", () => {
    const state = makeStateWithSinceLast({ mythic: 180 });
    const rates = getRates(state, BANNER);
    expect(rates.mythic).toBeCloseTo(1, 5);
  });

  it("mythic pity overrides legendary pity", () => {
    const state = makeStateWithSinceLast({ legendary: 90, mythic: 180 });
    const rates = getRates(state, BANNER);
    // mythic check comes after legendary, so mythic wins
    expect(rates.mythic).toBeCloseTo(1, 5);
    expect(rates.legendary).toBeCloseTo(0, 5);
  });

  it("rates remain normalized with pity", () => {
    const state = makeStateWithSinceLast({
      epic: 70,
      legendary: 70,
      mythic: 70,
    });
    const rates = getRates(state, BANNER);
    const sum =
      rates.common + rates.rare + rates.epic + rates.legendary + rates.mythic;
    expect(sum).toBeCloseTo(1, 5);
  });
});

// ── multiPull ──────────────────────────────────────────────────────

describe("multiPull", () => {
  it("returns correct number of items", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 10, 42);
    expect(result.items.length).toBe(10);
  });

  it("updates pullCount correctly", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 10, 42);
    expect(result.state.pullCount).toBe(10);
  });

  it("guarantees at least one rare+ in 10-pull", () => {
    // Run many times with different seeds
    for (let seed = 0; seed < 50; seed++) {
      const state = createGachaState("banner-001");
      const result = multiPull(state, BANNER, 10, seed);
      const hasRarePlus = result.items.some(
        (i) =>
          i.rarity === "rare" ||
          i.rarity === "epic" ||
          i.rarity === "legendary" ||
          i.rarity === "mythic",
      );
      expect(hasRarePlus).toBe(true);
    }
  });

  it("history length matches pull count", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 10, 42);
    expect(result.state.history.length).toBe(10);
  });

  it("handles single pull in multi", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 1, 42);
    expect(result.items.length).toBe(1);
    expect(result.state.pullCount).toBe(1);
  });

  it("handles zero pulls", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 0, 42);
    expect(result.items.length).toBe(0);
    expect(result.state.pullCount).toBe(0);
  });

  it("is deterministic with same seed", () => {
    const state = createGachaState("banner-001");
    const r1 = multiPull(state, BANNER, 10, 999);
    const r2 = multiPull(state, BANNER, 10, 999);
    expect(r1.items.map((i) => i.id)).toEqual(r2.items.map((i) => i.id));
  });
});

// ── getPityProgress ────────────────────────────────────────────────

describe("getPityProgress", () => {
  it("returns 0 for fresh state", () => {
    const state = createGachaState("b");
    expect(getPityProgress(state, "legendary")).toBe(0);
  });

  it("returns correct value after pulls", () => {
    const state = makeStateWithSinceLast({ legendary: 45 });
    expect(getPityProgress(state, "legendary")).toBe(45);
  });

  it("returns correct value for each rarity", () => {
    const state = makeStateWithSinceLast({
      common: 1,
      rare: 5,
      epic: 20,
      legendary: 50,
      mythic: 100,
    });
    expect(getPityProgress(state, "common")).toBe(1);
    expect(getPityProgress(state, "rare")).toBe(5);
    expect(getPityProgress(state, "epic")).toBe(20);
    expect(getPityProgress(state, "legendary")).toBe(50);
    expect(getPityProgress(state, "mythic")).toBe(100);
  });
});

// ── isPitySoftActive ───────────────────────────────────────────────

describe("isPitySoftActive", () => {
  it("returns false for fresh state", () => {
    const state = createGachaState("b");
    expect(isPitySoftActive(state)).toBe(false);
  });

  it("returns false at exactly 50 pulls", () => {
    const state = makeStateWithSinceLast({
      epic: 50,
      legendary: 50,
      mythic: 50,
    });
    expect(isPitySoftActive(state)).toBe(false);
  });

  it("returns true at 51 pulls without epic+", () => {
    const state = makeStateWithSinceLast({
      epic: 51,
      legendary: 51,
      mythic: 51,
    });
    expect(isPitySoftActive(state)).toBe(true);
  });

  it("returns false if epic was recently pulled", () => {
    const state = makeStateWithSinceLast({
      epic: 5,
      legendary: 60,
      mythic: 60,
    });
    // min(5, 60, 60) = 5, not > 50
    expect(isPitySoftActive(state)).toBe(false);
  });
});

// ── getGuaranteedIn ────────────────────────────────────────────────

describe("getGuaranteedIn", () => {
  it("returns 90 for legendary from fresh state", () => {
    const state = createGachaState("b");
    expect(getGuaranteedIn(state, "legendary")).toBe(90);
  });

  it("returns 180 for mythic from fresh state", () => {
    const state = createGachaState("b");
    expect(getGuaranteedIn(state, "mythic")).toBe(180);
  });

  it("decreases with pulls", () => {
    const state = makeStateWithSinceLast({ legendary: 30 });
    expect(getGuaranteedIn(state, "legendary")).toBe(60);
  });

  it("returns 0 when at pity", () => {
    const state = makeStateWithSinceLast({ legendary: 90 });
    expect(getGuaranteedIn(state, "legendary")).toBe(0);
  });

  it("returns 0 when past pity", () => {
    const state = makeStateWithSinceLast({ legendary: 100 });
    expect(getGuaranteedIn(state, "legendary")).toBe(0);
  });

  it("returns -1 for common (no hard pity)", () => {
    const state = createGachaState("b");
    expect(getGuaranteedIn(state, "common")).toBe(-1);
  });

  it("returns -1 for rare (no hard pity)", () => {
    const state = createGachaState("b");
    expect(getGuaranteedIn(state, "rare")).toBe(-1);
  });

  it("returns -1 for epic (no hard pity)", () => {
    const state = createGachaState("b");
    expect(getGuaranteedIn(state, "epic")).toBe(-1);
  });
});

// ── calculateExpectedPulls ─────────────────────────────────────────

describe("calculateExpectedPulls", () => {
  it("common: ~1.67 pulls", () => {
    expect(calculateExpectedPulls("common")).toBeCloseTo(1 / 0.6, 2);
  });

  it("rare: 4 pulls", () => {
    expect(calculateExpectedPulls("rare")).toBeCloseTo(4, 2);
  });

  it("epic: 10 pulls", () => {
    expect(calculateExpectedPulls("epic")).toBeCloseTo(10, 2);
  });

  it("legendary: 25 pulls", () => {
    expect(calculateExpectedPulls("legendary")).toBeCloseTo(25, 2);
  });

  it("mythic: 100 pulls", () => {
    expect(calculateExpectedPulls("mythic")).toBeCloseTo(100, 2);
  });
});

// ── getHistory ─────────────────────────────────────────────────────

describe("getHistory", () => {
  it("returns empty for fresh state", () => {
    const state = createGachaState("b");
    expect(getHistory(state)).toEqual([]);
  });

  it("returns all history when no limit", () => {
    const state: GachaState = {
      ...createGachaState("b"),
      history: ["a", "b", "c"],
    };
    expect(getHistory(state)).toEqual(["a", "b", "c"]);
  });

  it("returns last N with limit", () => {
    const state: GachaState = {
      ...createGachaState("b"),
      history: ["a", "b", "c", "d", "e"],
    };
    expect(getHistory(state, 3)).toEqual(["c", "d", "e"]);
  });

  it("returns all if limit exceeds length", () => {
    const state: GachaState = {
      ...createGachaState("b"),
      history: ["a", "b"],
    };
    expect(getHistory(state, 10)).toEqual(["a", "b"]);
  });
});

// ── resetPity ──────────────────────────────────────────────────────

describe("resetPity", () => {
  it("resets pullCount to 0", () => {
    const state = makeStateWithSinceLast({ legendary: 80 });
    const reset = resetPity({ ...state, pullCount: 80 });
    expect(reset.pullCount).toBe(0);
  });

  it("resets all sinceLast to 0", () => {
    const state = makeStateWithSinceLast({
      common: 5,
      rare: 10,
      epic: 30,
      legendary: 80,
      mythic: 150,
    });
    const reset = resetPity(state);
    expect(reset.sinceLast).toEqual({
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    });
  });

  it("preserves totalPulls", () => {
    const state: GachaState = {
      ...makeStateWithSinceLast({ legendary: 80 }),
      totalPulls: 200,
    };
    const reset = resetPity(state);
    expect(reset.totalPulls).toBe(200);
  });

  it("preserves history", () => {
    const state: GachaState = {
      ...createGachaState("b"),
      history: ["x", "y", "z"],
    };
    const reset = resetPity(state);
    expect(reset.history).toEqual(["x", "y", "z"]);
  });

  it("preserves bannerId", () => {
    const state = createGachaState("my-banner");
    const reset = resetPity(state);
    expect(reset.bannerId).toBe("my-banner");
  });
});

// ── calculateCost ──────────────────────────────────────────────────

describe("calculateCost", () => {
  it("calculates single pull cost", () => {
    expect(calculateCost(1, 100)).toBe(100);
  });

  it("calculates 10-pull cost", () => {
    expect(calculateCost(10, 160)).toBe(1600);
  });

  it("returns 0 for 0 pulls", () => {
    expect(calculateCost(0, 100)).toBe(0);
  });

  it("handles decimal prices", () => {
    expect(calculateCost(5, 0.99)).toBeCloseTo(4.95, 2);
  });
});

// ── getBannerValue ─────────────────────────────────────────────────

describe("getBannerValue", () => {
  it("returns 0 for empty banner", () => {
    const empty: GachaBanner = {
      ...BANNER,
      items: [],
    };
    expect(getBannerValue(empty)).toBe(0);
  });

  it("returns positive value for normal banner", () => {
    expect(getBannerValue(BANNER)).toBeGreaterThan(0);
  });

  it("higher rarity items increase value", () => {
    const lowBanner: GachaBanner = {
      ...BANNER,
      items: [{ id: "c", name: "C", rarity: "common", weight: 1 }],
    };
    const highBanner: GachaBanner = {
      ...BANNER,
      items: [{ id: "m", name: "M", rarity: "mythic", weight: 1 }],
    };
    expect(getBannerValue(highBanner)).toBeGreaterThan(
      getBannerValue(lowBanner),
    );
  });

  it("value reflects weight distribution", () => {
    const evenBanner: GachaBanner = {
      ...BANNER,
      items: [
        { id: "c", name: "C", rarity: "common", weight: 1 },
        { id: "m", name: "M", rarity: "mythic", weight: 1 },
      ],
    };
    // average of rank 1 and rank 5 = 3
    expect(getBannerValue(evenBanner)).toBeCloseTo(3, 1);
  });
});

// ── Hard pity integration ──────────────────────────────────────────

describe("hard pity integration", () => {
  it("forces legendary at 90 pulls via actual pull loop", () => {
    // getRates checks sinceLast BEFORE incrementing, so sinceLast.legendary must be >= 90
    const state: GachaState = {
      bannerId: "banner-001",
      pullCount: 90,
      sinceLast: { common: 0, rare: 0, epic: 0, legendary: 90, mythic: 90 },
      totalPulls: 90,
      history: Array(90).fill("c1"),
    };

    const result = pull(state, BANNER, 42);
    expect(
      result.item.rarity === "legendary" || result.item.rarity === "mythic",
    ).toBe(true);
  });

  it("forces mythic at 180 pulls", () => {
    // sinceLast.mythic must be >= 180 for mythic pity to activate
    const state: GachaState = {
      bannerId: "banner-001",
      pullCount: 180,
      sinceLast: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 180,
        mythic: 180,
      },
      totalPulls: 180,
      history: Array(180).fill("c1"),
    };

    const result = pull(state, BANNER, 42);
    expect(result.item.rarity).toBe("mythic");
  });
});

// ── Distribution test (statistical) ────────────────────────────────

describe("distribution", () => {
  it("produces roughly expected rarity distribution over many pulls", () => {
    const counts: Record<GachaRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };

    let state = createGachaState("banner-001");
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const result = pull(state, BANNER, i * 31337);
      counts[result.item.rarity]++;
      // Reset state to avoid pity effects skewing distribution
      state = createGachaState("banner-001");
    }

    // With base rates, common should be ~60% +/- 5%
    expect(counts.common / N).toBeGreaterThan(0.5);
    expect(counts.common / N).toBeLessThan(0.75);

    // Rare should be ~25%
    expect(counts.rare / N).toBeGreaterThan(0.15);
    expect(counts.rare / N).toBeLessThan(0.35);
  });
});

// ── Edge cases ─────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles banner with single item", () => {
    const singleBanner: GachaBanner = {
      id: "single",
      name: "Single",
      items: [{ id: "only", name: "Only Item", rarity: "common", weight: 1 }],
      pityThreshold: 50,
      pityRarity: "epic",
      guaranteedPity: true,
    };
    const state = createGachaState("single");
    const result = pull(state, singleBanner, 42);
    expect(result.item.id).toBe("only");
  });

  it("handles very large seed values", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 0xffffffff);
    expect(result.item).toBeDefined();
  });

  it("handles negative seed values", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, -12345);
    expect(result.item).toBeDefined();
  });

  it("handles seed = 0", () => {
    const state = createGachaState("banner-001");
    const result = pull(state, BANNER, 0);
    expect(result.item).toBeDefined();
  });

  it("multiPull with large count", () => {
    const state = createGachaState("banner-001");
    const result = multiPull(state, BANNER, 100, 42);
    expect(result.items.length).toBe(100);
    expect(result.state.pullCount).toBe(100);
    expect(result.state.totalPulls).toBe(100);
  });
});
