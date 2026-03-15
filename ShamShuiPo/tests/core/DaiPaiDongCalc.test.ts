// ── Tests: DaiPaiDongCalc ──

import { describe, it, expect } from "vitest";
import {
  generateStationPositions,
  getInteractionProgress,
  interruptInteraction,
  serveFood,
  applyFoodBuff,
  tickFoodBuffs,
  isStationAvailable,
  getFoodBuffMultiplier,
  getShopMenu,
  canAfford,
  purchaseItem,
  type MenuItem,
  type FoodBuff,
  type ShopItem,
} from "../../src/core/DaiPaiDongCalc";
import { DAI_PAI_DONG } from "../../src/config/balance";
import type { FragmentType } from "../../src/types/game";

// ════════════════════════════════════════════════════════════════
// § Station Positioning
// ════════════════════════════════════════════════════════════════

describe("generateStationPositions", () => {
  it("stationCount is 2 per SPEC-034 §4.7", () => {
    expect(DAI_PAI_DONG.stationCount).toBe(2);
  });

  it("returns the correct number of stations", () => {
    // Use SPEC-034 §4.7 confirmed count of 2
    const positions = generateStationPositions(1000, 2000, 2);
    expect(positions).toHaveLength(2);
  });

  it("returns empty array for count 0", () => {
    const positions = generateStationPositions(1000, 2000, 0);
    expect(positions).toHaveLength(0);
  });

  it("returns empty array for negative count", () => {
    const positions = generateStationPositions(1000, 2000, -1);
    expect(positions).toHaveLength(0);
  });

  it("avoids the center of the map", () => {
    const width = 1000;
    const height = 2000;
    const centerX = width / 2;
    const centerY = height / 2;
    const exclusionX = width * 0.2;
    const exclusionY = height * 0.2;

    const positions = generateStationPositions(width, height, 5);
    for (const pos of positions) {
      const inCenter =
        Math.abs(pos.x - centerX) < exclusionX &&
        Math.abs(pos.y - centerY) < exclusionY;
      expect(inCenter).toBe(false);
    }
  });

  it("keeps all stations within map bounds", () => {
    const width = 720;
    const height = 1280;
    const positions = generateStationPositions(width, height, 6);
    for (const pos of positions) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(width);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(height);
    }
  });

  it("stations have integer coordinates", () => {
    const positions = generateStationPositions(720, 1280, 3);
    for (const pos of positions) {
      expect(pos.x).toBe(Math.round(pos.x));
      expect(pos.y).toBe(Math.round(pos.y));
    }
  });

  it("handles single station", () => {
    const positions = generateStationPositions(720, 1280, 1);
    expect(positions).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § Interaction Progress
// ════════════════════════════════════════════════════════════════

// SPEC-034 §4.7 & Issue 5-2: interactionTimeMs = 0 (instant interaction).
// "즉시 (0초)" — 대배당이 위험 지역에 있으므로 빠른 의사결정이 맞다.
// With instant interaction, progress is immediately 1.0 when player is in range.

describe("getInteractionProgress", () => {
  const radius = DAI_PAI_DONG.interactionRadiusPx;

  it("interactionTimeMs is 0 (instant) per SPEC-034 §4.7", () => {
    expect(DAI_PAI_DONG.interactionTimeMs).toBe(0);
  });

  it("returns inRange=true when player is within radius", () => {
    const result = getInteractionProgress(100, 100, 100, 100, radius, 0);
    expect(result.inRange).toBe(true);
  });

  it("returns inRange=false when player is out of range", () => {
    const result = getInteractionProgress(0, 0, 200, 200, radius, 1000);
    expect(result.inRange).toBe(false);
  });

  it("returns progress=1.0 immediately when in range (instant interaction)", () => {
    // With interactionTimeMs=0, any elapsed time (including 0) gives progress=1.0
    const result = getInteractionProgress(100, 100, 100, 100, radius, 0);
    expect(result.progress).toBe(1.0);
  });

  it("returns progress=1.0 at any elapsed time when in range", () => {
    const result = getInteractionProgress(100, 100, 100, 100, radius, 5000);
    expect(result.progress).toBe(1.0);
  });

  it("caps progress at 1.0 when in range", () => {
    const result = getInteractionProgress(100, 100, 100, 100, radius, 99999);
    expect(result.progress).toBe(1.0);
  });

  it("resets progress to 0 when out of range", () => {
    const result = getInteractionProgress(0, 0, 500, 500, radius, 2000);
    expect(result.progress).toBe(0);
    expect(result.elapsedMs).toBe(0);
  });

  it("works at exact radius boundary", () => {
    const result = getInteractionProgress(
      100,
      100,
      100 + radius,
      100,
      radius,
      1000,
    );
    expect(result.inRange).toBe(true);
  });

  it("detects out of range just beyond radius", () => {
    const result = getInteractionProgress(
      100,
      100,
      100 + radius + 1,
      100,
      radius,
      1000,
    );
    expect(result.inRange).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Interrupt
// ════════════════════════════════════════════════════════════════

describe("interruptInteraction", () => {
  it("resets progress to 0", () => {
    const result = interruptInteraction();
    expect(result.progress).toBe(0);
  });

  it("sets inRange to false", () => {
    const result = interruptInteraction();
    expect(result.inRange).toBe(false);
  });

  it("resets elapsedMs to 0", () => {
    const result = interruptInteraction();
    expect(result.elapsedMs).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § Food Selection
// ════════════════════════════════════════════════════════════════

describe("serveFood", () => {
  const menu: MenuItem[] = DAI_PAI_DONG.menu.map((item) => ({ ...item }));

  it("returns a valid menu item with deterministic roll", () => {
    const food = serveFood(menu, 0);
    expect(food.id).toBe("wonton");
  });

  it("returns last item when roll is 0.99", () => {
    const food = serveFood(menu, 0.99);
    expect(food.id).toBe("chickenfeet");
  });

  it("returns a menu item for any roll in [0,1)", () => {
    for (let r = 0; r < 1; r += 0.1) {
      const food = serveFood(menu, r);
      expect(menu.some((m) => m.id === food.id)).toBe(true);
    }
  });

  it("throws on empty menu", () => {
    expect(() => serveFood([], 0)).toThrow("Menu cannot be empty");
  });
});

// ════════════════════════════════════════════════════════════════
// § Food Buffs
// ════════════════════════════════════════════════════════════════

describe("applyFoodBuff", () => {
  const friedRice: MenuItem = {
    id: "friedrice",
    name: "鑊氣炒飯",
    nameEn: "Wok Hei Fried Rice",
    effect: "fireDamage",
    value: 0.5,
    durationMs: 20000,
  };

  const yuanYang: MenuItem = {
    id: "yuanyang",
    name: "鴛鴦",
    nameEn: "Yuan Yang",
    effect: "speedAndAttack",
    value: 0.25,
    durationMs: 20000,
  };

  const wonton: MenuItem = {
    id: "wonton",
    name: "雲吞麵",
    nameEn: "Wonton Noodles",
    effect: "healPercent",
    value: 0.3,
    durationMs: 0,
  };

  it("adds a buff when no active buffs", () => {
    const buffs = applyFoodBuff([], friedRice);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].foodId).toBe("friedrice");
  });

  it("replaces existing buff (max 1)", () => {
    const existingBuffs: FoodBuff[] = [
      {
        foodId: "friedrice",
        effect: "fireDamage",
        value: 0.5,
        remainingMs: 10000,
        totalDurationMs: 20000,
      },
    ];
    const buffs = applyFoodBuff(existingBuffs, yuanYang);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].foodId).toBe("yuanyang");
  });

  it("handles instant effect (wonton heal)", () => {
    const buffs = applyFoodBuff([], wonton);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].remainingMs).toBe(0);
  });

  it("sets correct duration on buff", () => {
    const buffs = applyFoodBuff([], friedRice);
    expect(buffs[0].remainingMs).toBe(20000);
    expect(buffs[0].totalDurationMs).toBe(20000);
  });
});

// ════════════════════════════════════════════════════════════════
// § Buff Tick / Expiry
// ════════════════════════════════════════════════════════════════

describe("tickFoodBuffs", () => {
  it("decrements remaining time", () => {
    const buffs: FoodBuff[] = [
      {
        foodId: "friedrice",
        effect: "fireDamage",
        value: 0.5,
        remainingMs: 20000,
        totalDurationMs: 20000,
      },
    ];
    const result = tickFoodBuffs(buffs, 5000);
    expect(result).toHaveLength(1);
    expect(result[0].remainingMs).toBe(15000);
  });

  it("removes expired buffs", () => {
    const buffs: FoodBuff[] = [
      {
        foodId: "friedrice",
        effect: "fireDamage",
        value: 0.5,
        remainingMs: 1000,
        totalDurationMs: 20000,
      },
    ];
    const result = tickFoodBuffs(buffs, 1000);
    expect(result).toHaveLength(0);
  });

  it("removes buffs that go negative", () => {
    const buffs: FoodBuff[] = [
      {
        foodId: "friedrice",
        effect: "fireDamage",
        value: 0.5,
        remainingMs: 500,
        totalDurationMs: 20000,
      },
    ];
    const result = tickFoodBuffs(buffs, 1000);
    expect(result).toHaveLength(0);
  });

  it("keeps active buffs", () => {
    const buffs: FoodBuff[] = [
      {
        foodId: "friedrice",
        effect: "fireDamage",
        value: 0.5,
        remainingMs: 10000,
        totalDurationMs: 20000,
      },
    ];
    const result = tickFoodBuffs(buffs, 100);
    expect(result).toHaveLength(1);
  });

  it("handles empty buffs array", () => {
    const result = tickFoodBuffs([], 1000);
    expect(result).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § Station Cooldown
// ════════════════════════════════════════════════════════════════

describe("isStationAvailable", () => {
  const cooldown = DAI_PAI_DONG.stationCooldownMs;

  it("returns true when never used", () => {
    expect(isStationAvailable(-1, 10000, cooldown)).toBe(true);
  });

  it("returns false during cooldown", () => {
    expect(isStationAvailable(1000, 2000, cooldown)).toBe(false);
  });

  it("returns true after cooldown expires", () => {
    expect(isStationAvailable(0, cooldown, cooldown)).toBe(true);
  });

  it("returns true well after cooldown", () => {
    expect(isStationAvailable(0, cooldown + 10000, cooldown)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § Food Buff Multiplier Query
// ════════════════════════════════════════════════════════════════

describe("getFoodBuffMultiplier", () => {
  const activeBuff: FoodBuff = {
    foodId: "friedrice",
    effect: "fireDamage",
    value: 0.5,
    remainingMs: 10000,
    totalDurationMs: 20000,
  };

  const pierceBuff: FoodBuff = {
    foodId: "fishball",
    effect: "pierce",
    value: 3,
    remainingMs: 10000,
    totalDurationMs: 20000,
  };

  const armorBuff: FoodBuff = {
    foodId: "chickenfeet",
    effect: "armor",
    value: 5,
    remainingMs: 10000,
    totalDurationMs: 30000,
  };

  const speedBuff: FoodBuff = {
    foodId: "yuanyang",
    effect: "speedAndAttack",
    value: 0.25,
    remainingMs: 10000,
    totalDurationMs: 20000,
  };

  const xpBuff: FoodBuff = {
    foodId: "eggtart",
    effect: "xpBonus",
    value: 1.0,
    remainingMs: 10000,
    totalDurationMs: 15000,
  };

  it("returns fireDamage multiplicative bonus", () => {
    const result = getFoodBuffMultiplier([activeBuff], "fireDamage");
    expect(result.multiplicative).toBe(1.5);
    expect(result.additive).toBe(0);
  });

  it("returns pierce additive bonus", () => {
    const result = getFoodBuffMultiplier([pierceBuff], "pierce");
    expect(result.additive).toBe(3);
    expect(result.multiplicative).toBe(1);
  });

  it("returns armor additive bonus", () => {
    const result = getFoodBuffMultiplier([armorBuff], "armor");
    expect(result.additive).toBe(5);
  });

  it("returns speed multiplicative bonus", () => {
    const result = getFoodBuffMultiplier([speedBuff], "speed");
    expect(result.multiplicative).toBe(1.25);
  });

  it("returns attackSpeed multiplicative bonus from speedAndAttack", () => {
    const result = getFoodBuffMultiplier([speedBuff], "attackSpeed");
    expect(result.multiplicative).toBe(1.25);
  });

  it("returns xpBonus multiplicative bonus", () => {
    const result = getFoodBuffMultiplier([xpBuff], "xpBonus");
    expect(result.multiplicative).toBe(2.0);
  });

  it("returns neutral values for unmatched stat", () => {
    const result = getFoodBuffMultiplier([activeBuff], "speed");
    expect(result.additive).toBe(0);
    expect(result.multiplicative).toBe(1);
  });

  it("returns neutral values for empty buffs", () => {
    const result = getFoodBuffMultiplier([], "fireDamage");
    expect(result.additive).toBe(0);
    expect(result.multiplicative).toBe(1);
  });

  it("ignores expired buffs", () => {
    const expiredBuff: FoodBuff = { ...activeBuff, remainingMs: 0 };
    const result = getFoodBuffMultiplier([expiredBuff], "fireDamage");
    expect(result.multiplicative).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getShopMenu
// ════════════════════════════════════════════════════════════════

describe("getShopMenu", () => {
  it("returns a non-empty menu for wave 0", () => {
    const menu = getShopMenu(0);
    expect(menu.length).toBeGreaterThan(0);
  });

  it("includes all 6 food items from DAI_PAI_DONG.menu", () => {
    const menu = getShopMenu(1);
    const foodIds = DAI_PAI_DONG.menu.map((item) => item.id);
    for (const id of foodIds) {
      expect(menu.some((item) => item.id === id)).toBe(true);
    }
  });

  it("includes a specific-fragment purchase option", () => {
    const menu = getShopMenu(1);
    expect(menu.some((item) => item.id === "buy_fragment_specific")).toBe(true);
  });

  it("includes a random-fragment purchase option", () => {
    const menu = getShopMenu(1);
    expect(menu.some((item) => item.id === "buy_fragment_random")).toBe(true);
  });

  it("wonton has correct coin price (15)", () => {
    const menu = getShopMenu(0);
    const wonton = menu.find((item) => item.id === "wonton");
    expect(wonton).toBeDefined();
    expect(wonton!.costCoins).toBe(15);
  });

  it("friedrice has correct coin price (25)", () => {
    const menu = getShopMenu(0);
    const item = menu.find((i) => i.id === "friedrice");
    expect(item!.costCoins).toBe(25);
  });

  it("chickenfeet has correct coin price (15)", () => {
    const menu = getShopMenu(0);
    const item = menu.find((i) => i.id === "chickenfeet");
    expect(item!.costCoins).toBe(15);
  });

  it("specific fragment purchase costs 50 coins (SPEC-034 §4.7)", () => {
    const menu = getShopMenu(0);
    const item = menu.find((i) => i.id === "buy_fragment_specific");
    expect(item!.costCoins).toBe(50);
    expect(item!.costCoins).toBe(
      DAI_PAI_DONG.fragmentPurchases.specificFragmentCost,
    );
  });

  it("random fragment purchase costs 30 coins (SPEC-034 §4.7)", () => {
    const menu = getShopMenu(0);
    const item = menu.find((i) => i.id === "buy_fragment_random");
    expect(item!.costCoins).toBe(30);
    expect(item!.costCoins).toBe(
      DAI_PAI_DONG.fragmentPurchases.randomFragmentCost,
    );
  });

  it("food items have empty costFragments (coins-only)", () => {
    const menu = getShopMenu(0);
    const foodIds = DAI_PAI_DONG.menu.map((item) => item.id);
    for (const id of foodIds) {
      const item = menu.find((i) => i.id === id);
      expect(item!.costFragments).toHaveLength(0);
    }
  });

  it("returns same menu regardless of wave number (static)", () => {
    const menuW0 = getShopMenu(0);
    const menuW5 = getShopMenu(5);
    expect(menuW0.length).toBe(menuW5.length);
  });

  it("all items have non-negative coin cost", () => {
    const menu = getShopMenu(0);
    for (const item of menu) {
      expect(item.costCoins).toBeGreaterThanOrEqual(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § canAfford
// ════════════════════════════════════════════════════════════════

describe("canAfford", () => {
  const wontonItem: ShopItem = {
    id: "wonton",
    name: "雲吞麵",
    nameEn: "Wonton Noodles",
    effect: "healPercent",
    value: 0.3,
    durationMs: 0,
    costCoins: 15,
    costFragments: [],
  };

  const fragItem: ShopItem = {
    id: "test_frag_item",
    name: "Test",
    nameEn: "Test",
    effect: "grantFragment",
    value: 1,
    durationMs: 0,
    costCoins: 10,
    costFragments: [{ type: "火" as FragmentType, count: 1 }],
  };

  it("returns true when player has enough coins and no fragment cost", () => {
    expect(canAfford(wontonItem, 20, [])).toBe(true);
  });

  it("returns true at exact coin threshold", () => {
    expect(canAfford(wontonItem, 15, [])).toBe(true);
  });

  it("returns false when player has insufficient coins", () => {
    expect(canAfford(wontonItem, 10, [])).toBe(false);
  });

  it("returns false when player has zero coins", () => {
    expect(canAfford(wontonItem, 0, [])).toBe(false);
  });

  it("returns true when player has both required coins and fragments", () => {
    const fragments: FragmentType[] = ["火", "大"];
    expect(canAfford(fragItem, 10, fragments)).toBe(true);
  });

  it("returns false when player lacks required fragment", () => {
    const fragments: FragmentType[] = ["大"]; // no 火
    expect(canAfford(fragItem, 10, fragments)).toBe(false);
  });

  it("returns false when player has coins but lacks fragments", () => {
    expect(canAfford(fragItem, 100, [])).toBe(false);
  });

  it("returns false when insufficient coins even with correct fragments", () => {
    const fragments: FragmentType[] = ["火"];
    expect(canAfford(fragItem, 5, fragments)).toBe(false);
  });

  it("handles multi-fragment cost", () => {
    const expensiveItem: ShopItem = {
      ...fragItem,
      costFragments: [{ type: "火" as FragmentType, count: 2 }],
    };
    expect(canAfford(expensiveItem, 10, ["火"])).toBe(false);
    expect(canAfford(expensiveItem, 10, ["火", "火"])).toBe(true);
  });

  it("does not mutate fragments array", () => {
    const fragments: FragmentType[] = ["火"];
    const copy = [...fragments];
    canAfford(fragItem, 10, fragments);
    expect(fragments).toEqual(copy);
  });
});

// ════════════════════════════════════════════════════════════════
// § purchaseItem
// ════════════════════════════════════════════════════════════════

describe("purchaseItem", () => {
  const wontonItem: ShopItem = {
    id: "wonton",
    name: "雲吞麵",
    nameEn: "Wonton Noodles",
    effect: "healPercent",
    value: 0.3,
    durationMs: 0,
    costCoins: 15,
    costFragments: [],
  };

  const fragItem: ShopItem = {
    id: "frag_circuit",
    name: "Circuit",
    nameEn: "Circuit",
    effect: "permanentDamage",
    value: 0.1,
    durationMs: 0,
    costCoins: 0,
    costFragments: [{ type: "力" as FragmentType, count: 1 }],
  };

  it("succeeds and deducts coins for a coins-only item", () => {
    const result = purchaseItem(wontonItem, 50, []);
    expect(result.success).toBe(true);
    expect(result.remainingCoins).toBe(35);
    expect(result.item).toBe(wontonItem);
  });

  it("returns the purchased item in result.item", () => {
    const result = purchaseItem(wontonItem, 50, []);
    expect(result.item?.id).toBe("wonton");
  });

  it("fails when insufficient coins", () => {
    const result = purchaseItem(wontonItem, 10, []);
    expect(result.success).toBe(false);
    expect(result.item).toBeNull();
    expect(result.remainingCoins).toBe(10); // unchanged
  });

  it("deducts correct fragment on fragment purchase", () => {
    const fragments: FragmentType[] = ["力", "大"];
    const result = purchaseItem(fragItem, 0, fragments);
    expect(result.success).toBe(true);
    expect(result.remainingFragments).not.toContain("力");
    expect(result.remainingFragments).toContain("大");
  });

  it("fails when fragment requirement not met", () => {
    const result = purchaseItem(fragItem, 0, []);
    expect(result.success).toBe(false);
    expect(result.remainingFragments).toEqual([]);
  });

  it("does not mutate original fragments array on failure", () => {
    const fragments: FragmentType[] = ["大"];
    const copy = [...fragments];
    purchaseItem(fragItem, 0, fragments); // 力 required, 大 present — fails
    expect(fragments).toEqual(copy);
  });

  it("does not mutate original fragments array on success", () => {
    const fragments: FragmentType[] = ["力", "大"];
    const copy = [...fragments];
    purchaseItem(fragItem, 0, fragments);
    expect(fragments).toEqual(copy);
  });

  it("remaining coins are unchanged on failure", () => {
    const result = purchaseItem(wontonItem, 5, []);
    expect(result.remainingCoins).toBe(5);
  });

  it("sets failReason on failure", () => {
    const result = purchaseItem(wontonItem, 5, []);
    expect(result.failReason).toBeDefined();
    expect(result.failReason!.length).toBeGreaterThan(0);
  });

  it("handles zero-coin item with only fragment cost", () => {
    const result = purchaseItem(fragItem, 0, ["力"]);
    expect(result.success).toBe(true);
    expect(result.remainingCoins).toBe(0);
  });

  it("consumes exact number of required fragments (not more)", () => {
    const item: ShopItem = {
      ...fragItem,
      costFragments: [{ type: "火" as FragmentType, count: 2 }],
    };
    const frags: FragmentType[] = ["火", "火", "火"]; // 3 available, 2 required
    const result = purchaseItem(item, 0, frags);
    expect(result.success).toBe(true);
    expect(result.remainingFragments.filter((f) => f === "火")).toHaveLength(1);
  });
});
