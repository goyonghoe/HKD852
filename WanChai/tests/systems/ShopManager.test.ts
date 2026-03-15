import { describe, it, expect } from 'vitest';
import { BALANCE } from '../../src/config/balance';

/**
 * ShopManager is tightly coupled to Phaser (Scene, Physics, Containers, etc.).
 * We test the pure logic aspects:
 *   1. Shop cost/pricing from BALANCE config
 *   2. scoreBestShopChoice algorithm (reimplemented as pure function)
 *   3. applyShopChoice gold deduction logic
 *   4. Heal amount calculation
 *   5. Armor stacking formula
 */

// Reimplement scoreBestShopChoice as pure function (mirrors ShopManager.scoreBestShopChoice)
interface ShopItem {
  name: string;
  cost: number;
  action: 'heal' | 'damage' | 'armor';
}

function scoreBestShopChoice(
  items: ShopItem[],
  gold: number,
  hpPct: number,
): { action: 'heal' | 'damage' | 'armor'; cost: number } | null {
  const affordable = items.filter((it) => gold >= it.cost);
  if (affordable.length === 0) return null;

  const heal = affordable.find((it) => it.action === 'heal');
  if (heal && hpPct < BALANCE.MID_SHOP.healHpThreshold) return { action: heal.action, cost: heal.cost };

  const dmg = affordable.find((it) => it.action === 'damage');
  if (dmg) return { action: dmg.action, cost: dmg.cost };

  return { action: affordable[0].action, cost: affordable[0].cost };
}

// Reimplement applyShopChoice gold deduction (mirrors ShopManager.applyShopChoice)
function canAffordAndDeduct(gold: number, cost: number): { newGold: number; success: boolean } {
  if (gold < cost) return { newGold: gold, success: false };
  return { newGold: gold - cost, success: true };
}

// Reimplement heal calculation (mirrors ShopManager.applyShopChoice heal case)
function calculateHeal(baseHp: number, baseMaxHp: number, healPercent: number): number {
  const healAmount = Math.ceil(baseMaxHp * healPercent);
  return Math.min(baseMaxHp, baseHp + healAmount);
}

// Reimplement armor stacking (mirrors ShopManager.applyShopChoice armor case)
function calculateArmorStack(
  shopArmor: number,
  armorBoostPercent: number,
  passiveArmorLevel: number,
  passiveValuePerLevel: number,
): { shopArmorMultiplier: number; baseArmorMultiplier: number } {
  const newShopArmor = shopArmor * (1 - armorBoostPercent);
  let baseArmor = newShopArmor;
  if (passiveArmorLevel > 0) {
    baseArmor = Math.max(0.1, 1 - passiveValuePerLevel * passiveArmorLevel) * newShopArmor;
  }
  return { shopArmorMultiplier: newShopArmor, baseArmorMultiplier: baseArmor };
}

describe('Shop — BALANCE config', () => {
  const shop = BALANCE.MID_SHOP;
  const shopEffects = BALANCE.ECONOMY.shopEffects;

  it('triggerTimeMs is 30s', () => {
    expect(shop.triggerTimeMs).toBe(30000);
  });

  it('healBasePercent is 30%', () => {
    expect(shopEffects.healBasePercent).toBe(0.3);
  });

  it('damageBoostPercent is 25%', () => {
    expect(shopEffects.damageBoostPercent).toBe(0.25);
  });

  it('armorBoostPercent is 25%', () => {
    expect(shopEffects.armorBoostPercent).toBe(0.25);
  });

  it('ECONOMY.shopCosts has positive costs for heal/damage/armor', () => {
    const costs = BALANCE.ECONOMY.shopCosts;
    expect(costs.heal).toBeGreaterThan(0);
    expect(costs.damage).toBeGreaterThan(0);
    expect(costs.armor).toBeGreaterThan(0);
  });
});

describe('Shop — scoreBestShopChoice', () => {
  const items: ShopItem[] = [
    { name: 'Heal', cost: BALANCE.ECONOMY.shopCosts['heal'], action: 'heal' },
    { name: 'Damage', cost: BALANCE.ECONOMY.shopCosts['damage'], action: 'damage' },
    { name: 'Armor', cost: BALANCE.ECONOMY.shopCosts['armor'], action: 'armor' },
  ];

  it('returns null when no items are affordable', () => {
    expect(scoreBestShopChoice(items, 0, 1.0)).toBeNull();
    expect(scoreBestShopChoice(items, 5, 1.0)).toBeNull();
  });

  it('prefers heal when HP < 50%', () => {
    const result = scoreBestShopChoice(items, 1000, 0.3);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('heal');
  });

  it('prefers heal even at 49% HP', () => {
    const result = scoreBestShopChoice(items, 1000, 0.49);
    expect(result!.action).toBe('heal');
  });

  it('prefers damage when HP >= 50%', () => {
    const result = scoreBestShopChoice(items, 1000, 0.5);
    expect(result!.action).toBe('damage');
  });

  it('prefers damage when HP is full', () => {
    const result = scoreBestShopChoice(items, 1000, 1.0);
    expect(result!.action).toBe('damage');
  });

  it('falls back to first affordable item when damage not affordable', () => {
    // Can only afford heal (cost 40), not damage (60) or armor (55)
    const result = scoreBestShopChoice(items, 45, 1.0);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('heal'); // first affordable
  });

  it('selects damage even when heal is affordable but HP >= 70%', () => {
    const result = scoreBestShopChoice(items, 1000, 0.8);
    expect(result!.action).toBe('damage');
  });

  it('returns heal cost correctly', () => {
    const result = scoreBestShopChoice(items, 1000, 0.3);
    expect(result!.cost).toBe(BALANCE.ECONOMY.shopCosts['heal']);
  });
});

describe('Shop — gold deduction', () => {
  it('deducts cost when gold >= cost', () => {
    const result = canAffordAndDeduct(50, 20);
    expect(result.success).toBe(true);
    expect(result.newGold).toBe(30);
  });

  it('fails when gold < cost', () => {
    const result = canAffordAndDeduct(10, 20);
    expect(result.success).toBe(false);
    expect(result.newGold).toBe(10); // unchanged
  });

  it('exact gold = cost works', () => {
    const result = canAffordAndDeduct(20, 20);
    expect(result.success).toBe(true);
    expect(result.newGold).toBe(0);
  });
});

describe('Shop — heal calculation', () => {
  const healPct = BALANCE.ECONOMY.shopEffects.healBasePercent;

  it('heals 30% of max HP', () => {
    const newHp = calculateHeal(400, 600, healPct);
    // 600 * 0.30 = 180 → 400 + 180 = 580
    expect(newHp).toBe(580);
  });

  it('clamps to maxHp', () => {
    const newHp = calculateHeal(550, 600, healPct);
    // 600 * 0.30 = 180 → 550 + 180 = 730 → clamped to 600
    expect(newHp).toBe(600);
  });

  it('heals from 0 HP', () => {
    const newHp = calculateHeal(0, 600, healPct);
    // 0 + 180 = 180
    expect(newHp).toBe(180);
  });

  it('uses Math.ceil for fractional heal', () => {
    // maxHp=101, baseHp=50 → heal = ceil(101 * 0.30) = ceil(30.3) = 31
    // newHp = min(101, 50 + 31) = 81
    const newHp = calculateHeal(50, 101, healPct);
    expect(newHp).toBe(81);
  });

  it('ceil rounds up fractional heal amounts', () => {
    // maxHp=333, baseHp=100 → heal = ceil(333 * 0.30) = ceil(99.9) = 100
    // newHp = min(333, 100 + 100) = 200
    const newHp = calculateHeal(100, 333, healPct);
    expect(newHp).toBe(200);
  });

  it('full HP heal returns maxHp', () => {
    const newHp = calculateHeal(600, 600, healPct);
    // 600 + 180 = 780 → clamped to 600
    expect(newHp).toBe(600);
  });
});

describe('Shop — armor stacking', () => {
  const boostPct = BALANCE.ECONOMY.shopEffects.armorBoostPercent;

  it('first armor purchase: 1.0 * (1 - 0.25) = 0.75', () => {
    const result = calculateArmorStack(1.0, boostPct, 0, 0.1);
    expect(result.shopArmorMultiplier).toBeCloseTo(0.75, 5);
    expect(result.baseArmorMultiplier).toBeCloseTo(0.75, 5);
  });

  it('second armor purchase stacks multiplicatively', () => {
    const result = calculateArmorStack(0.75, boostPct, 0, 0.1);
    expect(result.shopArmorMultiplier).toBeCloseTo(0.5625, 4);
    expect(result.baseArmorMultiplier).toBeCloseTo(0.5625, 4);
  });

  it('armor with passive armor level 2', () => {
    // shopArmor = 1.0 * 0.75 = 0.75
    // baseArmor = max(0.1, 1 - 0.10*2) * 0.75 = 0.80 * 0.75 = 0.60
    const result = calculateArmorStack(1.0, boostPct, 2, 0.1);
    expect(result.shopArmorMultiplier).toBeCloseTo(0.75, 5);
    expect(result.baseArmorMultiplier).toBeCloseTo(0.6, 5);
  });

  it('armor with max passive armor level 5', () => {
    // shopArmor = 1.0 * 0.75 = 0.75
    // baseArmor = max(0.1, 1 - 0.10*5) * 0.75 = 0.50 * 0.75 = 0.375
    const result = calculateArmorStack(1.0, boostPct, 5, 0.1);
    expect(result.shopArmorMultiplier).toBeCloseTo(0.75, 5);
    expect(result.baseArmorMultiplier).toBeCloseTo(0.375, 5);
  });

  it('armor floor is 0.1', () => {
    // If passive reduces to below 0.1: max(0.1, ...) ensures floor
    const result = calculateArmorStack(1.0, boostPct, 10, 0.1);
    // max(0.1, 1 - 1.0) = max(0.1, 0) = 0.1, then * 0.75 = 0.075
    expect(result.baseArmorMultiplier).toBeCloseTo(0.075, 5);
  });
});
