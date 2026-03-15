import { describe, it, expect } from "vitest";
import {
  createShop,
  generateOfferings,
  purchaseItem,
  rerollShop,
  getRerollCost,
  applyDiscount,
  getDiscountedPrice,
  canAfford,
  addGold,
  getAvailableItems,
  mulberry32,
  type ShopState,
  type ShopItem,
} from "../../src/core/ShopCalc";

// ────────────────────────── Helpers ──────────────────────────

function shopWithOfferings(gold = 500): ShopState {
  return generateOfferings(createShop(gold), 5, 42);
}

function makeItem(overrides: Partial<ShopItem> = {}): ShopItem {
  return {
    id: "test_item",
    name: "Test",
    type: "weapon",
    cost: 100,
    rarity: "common",
    isSold: false,
    ...overrides,
  };
}

// ────────────────────────── mulberry32 PRNG ──────────────────────────

describe("mulberry32", () => {
  it("produces deterministic output for same seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("produces values in [0, 1)", () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).not.toEqual(seqB);
  });
});

// ────────────────────────── createShop ──────────────────────────

describe("createShop", () => {
  it("creates state with given gold", () => {
    const s = createShop(300);
    expect(s.gold).toBe(300);
  });

  it("starts with empty offerings", () => {
    const s = createShop(100);
    expect(s.offerings).toHaveLength(0);
  });

  it("starts with 0 reroll count", () => {
    const s = createShop(0);
    expect(s.rerollCount).toBe(0);
  });

  it("has default reroll base cost of 50", () => {
    const s = createShop(0);
    expect(s.rerollBaseCost).toBe(50);
  });

  it("starts with 0 discount", () => {
    const s = createShop(0);
    expect(s.discountPercent).toBe(0);
  });
});

// ────────────────────────── generateOfferings ──────────────────────────

describe("generateOfferings", () => {
  it("generates exactly 3 items", () => {
    const s = generateOfferings(createShop(200), 1, 42);
    expect(s.offerings).toHaveLength(3);
  });

  it("always includes a heal item as the third offering", () => {
    const s = generateOfferings(createShop(200), 5, 77);
    const heal = s.offerings[2];
    expect(heal.type).toBe("heal");
    expect(heal.cost).toBe(30);
  });

  it("all items start unsold", () => {
    const s = generateOfferings(createShop(200), 3, 10);
    s.offerings.forEach((item) => {
      expect(item.isSold).toBe(false);
    });
  });

  it("is deterministic with same seed", () => {
    const a = generateOfferings(createShop(200), 5, 42);
    const b = generateOfferings(createShop(200), 5, 42);
    expect(a.offerings.map((i) => i.name)).toEqual(
      b.offerings.map((i) => i.name),
    );
  });

  it("produces different items with different seeds", () => {
    const a = generateOfferings(createShop(200), 5, 1);
    const b = generateOfferings(createShop(200), 5, 9999);
    // Very unlikely to match — names at index 0
    const nameA = a.offerings[0].name;
    const nameB = b.offerings[0].name;
    // At least one of the first two items should differ
    const allSame = a.offerings.every(
      (item, i) => item.name === b.offerings[i].name,
    );
    expect(allSame).toBe(false);
  });

  it("preserves existing gold", () => {
    const s = generateOfferings(createShop(999), 1, 42);
    expect(s.gold).toBe(999);
  });

  it("first two items are weapon or passive type", () => {
    const s = generateOfferings(createShop(200), 5, 42);
    expect(["weapon", "passive"]).toContain(s.offerings[0].type);
    expect(["weapon", "passive"]).toContain(s.offerings[1].type);
  });

  it("low-level generates mostly common items", () => {
    // Run many seeds at level 1 and check rarity distribution
    let commonCount = 0;
    const total = 200; // 100 seeds * 2 non-heal items
    for (let seed = 0; seed < 100; seed++) {
      const s = generateOfferings(createShop(200), 1, seed);
      if (s.offerings[0].rarity === "common") commonCount++;
      if (s.offerings[1].rarity === "common") commonCount++;
    }
    // With 70% common rate, expect at least 50% to be common
    expect(commonCount / total).toBeGreaterThan(0.5);
  });

  it("high-level generates more epic/legendary items", () => {
    let epicOrLegendary = 0;
    const total = 200;
    for (let seed = 0; seed < 100; seed++) {
      const s = generateOfferings(createShop(200), 10, seed);
      for (let i = 0; i < 2; i++) {
        const r = s.offerings[i].rarity;
        if (r === "epic" || r === "legendary") epicOrLegendary++;
      }
    }
    // Level 10+: epic 35% + legendary 15% = 50%
    expect(epicOrLegendary / total).toBeGreaterThan(0.3);
  });

  it("level 1-3 never generates legendary", () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = generateOfferings(createShop(200), 1, seed);
      expect(s.offerings[0].rarity).not.toBe("legendary");
      expect(s.offerings[1].rarity).not.toBe("legendary");
    }
  });
});

// ────────────────────────── purchaseItem ──────────────────────────

describe("purchaseItem", () => {
  it("successfully purchases an affordable item", () => {
    const shop = shopWithOfferings(500);
    const itemId = shop.offerings[0].id;
    const result = purchaseItem(shop, itemId);
    expect(result.success).toBe(true);
    expect(result.reason).toBe("Purchase successful");
  });

  it("deducts correct gold amount", () => {
    const shop = shopWithOfferings(500);
    const item = shop.offerings[0];
    const result = purchaseItem(shop, item.id);
    expect(result.state.gold).toBe(500 - item.cost);
  });

  it("marks item as sold", () => {
    const shop = shopWithOfferings(500);
    const itemId = shop.offerings[0].id;
    const result = purchaseItem(shop, itemId);
    const sold = result.state.offerings.find((i) => i.id === itemId);
    expect(sold?.isSold).toBe(true);
  });

  it("fails when item not found", () => {
    const shop = shopWithOfferings(500);
    const result = purchaseItem(shop, "nonexistent");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Item not found");
  });

  it("fails when item already sold", () => {
    const shop = shopWithOfferings(500);
    const itemId = shop.offerings[0].id;
    const first = purchaseItem(shop, itemId);
    const second = purchaseItem(first.state, itemId);
    expect(second.success).toBe(false);
    expect(second.reason).toBe("Item already sold");
  });

  it("fails when not enough gold", () => {
    const shop = shopWithOfferings(1); // only 1 gold
    const itemId = shop.offerings[0].id; // costs >= 50
    const result = purchaseItem(shop, itemId);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Not enough gold");
  });

  it("does not mutate original state on success", () => {
    const shop = shopWithOfferings(500);
    const originalGold = shop.gold;
    purchaseItem(shop, shop.offerings[0].id);
    expect(shop.gold).toBe(originalGold);
  });

  it("does not mutate original state on failure", () => {
    const shop = shopWithOfferings(1);
    const originalGold = shop.gold;
    purchaseItem(shop, shop.offerings[0].id);
    expect(shop.gold).toBe(originalGold);
  });

  it("applies discount when purchasing", () => {
    const shop = applyDiscount(shopWithOfferings(500), 50);
    const item = shop.offerings[0];
    const result = purchaseItem(shop, item.id);
    const expectedPrice = getDiscountedPrice(item, 50);
    expect(result.state.gold).toBe(500 - expectedPrice);
  });
});

// ────────────────────────── rerollShop ──────────────────────────

describe("rerollShop", () => {
  it("succeeds with enough gold", () => {
    const shop = shopWithOfferings(500);
    const result = rerollShop(shop, 99);
    expect(result.success).toBe(true);
  });

  it("deducts reroll cost", () => {
    const shop = shopWithOfferings(500);
    const cost = getRerollCost(shop);
    const result = rerollShop(shop, 99);
    expect(result.state.gold).toBe(500 - cost);
  });

  it("increments reroll count", () => {
    const shop = shopWithOfferings(500);
    const result = rerollShop(shop, 99);
    expect(result.state.rerollCount).toBe(1);
  });

  it("generates new offerings", () => {
    const shop = shopWithOfferings(500);
    const oldNames = shop.offerings.map((i) => i.id);
    const result = rerollShop(shop, 99);
    const newNames = result.state.offerings.map((i) => i.id);
    expect(newNames).not.toEqual(oldNames);
  });

  it("fails when not enough gold", () => {
    const shop = shopWithOfferings(10);
    const result = rerollShop(shop, 99);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Not enough gold to reroll");
  });

  it("cost doubles after each reroll", () => {
    let shop = shopWithOfferings(10000);
    expect(getRerollCost(shop)).toBe(50);

    const r1 = rerollShop(shop, 100);
    shop = r1.state;
    expect(getRerollCost(shop)).toBe(100);

    const r2 = rerollShop(shop, 200);
    shop = r2.state;
    expect(getRerollCost(shop)).toBe(200);

    const r3 = rerollShop(shop, 300);
    shop = r3.state;
    expect(getRerollCost(shop)).toBe(400);
  });
});

// ────────────────────────── getRerollCost ──────────────────────────

describe("getRerollCost", () => {
  it("returns base cost for 0 rerolls", () => {
    expect(getRerollCost(createShop(0))).toBe(50);
  });

  it("doubles each reroll", () => {
    const s = { ...createShop(0), rerollCount: 3 };
    expect(getRerollCost(s)).toBe(50 * 8); // 50 * 2^3
  });
});

// ────────────────────────── applyDiscount ──────────────────────────

describe("applyDiscount", () => {
  it("sets discount percent", () => {
    const s = applyDiscount(createShop(100), 25);
    expect(s.discountPercent).toBe(25);
  });

  it("caps at 50%", () => {
    const s = applyDiscount(createShop(100), 80);
    expect(s.discountPercent).toBe(50);
  });

  it("caps at 0% for negative values", () => {
    const s = applyDiscount(createShop(100), -10);
    expect(s.discountPercent).toBe(0);
  });

  it("does not mutate original state", () => {
    const original = createShop(100);
    applyDiscount(original, 30);
    expect(original.discountPercent).toBe(0);
  });
});

// ────────────────────────── getDiscountedPrice ──────────────────────────

describe("getDiscountedPrice", () => {
  it("returns full price at 0% discount", () => {
    const item = makeItem({ cost: 100 });
    expect(getDiscountedPrice(item, 0)).toBe(100);
  });

  it("applies 50% discount", () => {
    const item = makeItem({ cost: 200 });
    expect(getDiscountedPrice(item, 50)).toBe(100);
  });

  it("applies 25% discount", () => {
    const item = makeItem({ cost: 100 });
    expect(getDiscountedPrice(item, 25)).toBe(75);
  });

  it("never returns less than 1", () => {
    const item = makeItem({ cost: 1 });
    expect(getDiscountedPrice(item, 50)).toBe(1);
  });

  it("floors the result", () => {
    const item = makeItem({ cost: 99 });
    // 99 * 0.75 = 74.25 → floor → 74
    expect(getDiscountedPrice(item, 25)).toBe(74);
  });
});

// ────────────────────────── canAfford ──────────────────────────

describe("canAfford", () => {
  it("returns true when gold >= price", () => {
    const shop = shopWithOfferings(500);
    expect(canAfford(shop, shop.offerings[0].id)).toBe(true);
  });

  it("returns false when gold < price", () => {
    const shop = shopWithOfferings(1);
    expect(canAfford(shop, shop.offerings[0].id)).toBe(false);
  });

  it("returns false for nonexistent item", () => {
    const shop = shopWithOfferings(500);
    expect(canAfford(shop, "nope")).toBe(false);
  });

  it("returns false for sold item", () => {
    const shop = shopWithOfferings(5000);
    const result = purchaseItem(shop, shop.offerings[0].id);
    expect(canAfford(result.state, shop.offerings[0].id)).toBe(false);
  });

  it("considers discount when checking", () => {
    // Heal item costs 30, with 50% discount = 15
    const shop = applyDiscount(shopWithOfferings(20), 50);
    const healId = shop.offerings[2].id; // heal item
    expect(canAfford(shop, healId)).toBe(true);
  });
});

// ────────────────────────── addGold ──────────────────────────

describe("addGold", () => {
  it("increases gold by amount", () => {
    const s = addGold(createShop(100), 50);
    expect(s.gold).toBe(150);
  });

  it("handles zero addition", () => {
    const s = addGold(createShop(100), 0);
    expect(s.gold).toBe(100);
  });

  it("does not mutate original state", () => {
    const original = createShop(100);
    addGold(original, 50);
    expect(original.gold).toBe(100);
  });
});

// ────────────────────────── getAvailableItems ──────────────────────────

describe("getAvailableItems", () => {
  it("returns all items when none sold", () => {
    const shop = shopWithOfferings(500);
    expect(getAvailableItems(shop)).toHaveLength(3);
  });

  it("excludes sold items", () => {
    const shop = shopWithOfferings(5000);
    const result = purchaseItem(shop, shop.offerings[0].id);
    expect(getAvailableItems(result.state)).toHaveLength(2);
  });

  it("returns empty array when all sold", () => {
    let shop = shopWithOfferings(5000);
    for (const item of shop.offerings) {
      const r = purchaseItem(shop, item.id);
      shop = r.state;
    }
    expect(getAvailableItems(shop)).toHaveLength(0);
  });
});

// ────────────────────────── Immutability ──────────────────────────

describe("immutability", () => {
  it("generateOfferings does not mutate input", () => {
    const original = createShop(200);
    generateOfferings(original, 5, 42);
    expect(original.offerings).toHaveLength(0);
  });

  it("rerollShop does not mutate input", () => {
    const shop = shopWithOfferings(500);
    const originalGold = shop.gold;
    rerollShop(shop, 99);
    expect(shop.gold).toBe(originalGold);
    expect(shop.rerollCount).toBe(0);
  });
});
