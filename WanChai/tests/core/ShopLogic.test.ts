import { describe, it, expect } from 'vitest';
import {
  filterAffordableItems,
  scoreBestShopChoice,
  calculateShopHeal,
  applyShopHeal,
  applyShopDamageBoost,
  applyShopArmorBoost,
  calculateBaseArmor,
  DEFAULT_SHOP_CONFIG,
  type ShopItem,
  type ShopConfig,
} from '../../src/core/ShopLogic';

// Standard test items matching BALANCE.MID_SHOP
const ITEMS: ShopItem[] = [
  { name: 'Heal', desc: 'Restore 30% HP', cost: 15, action: 'heal' },
  { name: 'Damage', desc: '+25% damage', cost: 20, action: 'damage' },
  { name: 'Armor', desc: '+25% armor', cost: 20, action: 'armor' },
];

// ========================================
// filterAffordableItems
// ========================================
describe('filterAffordableItems', () => {
  it('returns all items when gold is sufficient', () => {
    const result = filterAffordableItems(ITEMS, 1000);
    expect(result).toHaveLength(3);
  });

  it('returns only heal when gold = 15', () => {
    const result = filterAffordableItems(ITEMS, 15);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('heal');
  });

  it('returns heal and damage/armor when gold = 20', () => {
    const result = filterAffordableItems(ITEMS, 20);
    expect(result).toHaveLength(3);
  });

  it('returns empty array when gold = 0', () => {
    const result = filterAffordableItems(ITEMS, 0);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty items list', () => {
    const result = filterAffordableItems([], 100);
    expect(result).toHaveLength(0);
  });

  it('exact cost boundary — gold equals item cost', () => {
    const singleItem: ShopItem[] = [{ name: 'X', desc: 'X', cost: 50, action: 'heal' }];
    expect(filterAffordableItems(singleItem, 50)).toHaveLength(1);
    expect(filterAffordableItems(singleItem, 49)).toHaveLength(0);
  });
});

// ========================================
// scoreBestShopChoice — HP threshold → heal priority
// ========================================
describe('scoreBestShopChoice — heal priority', () => {
  it('chooses heal when HP below threshold (30%)', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.3);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('heal');
    expect(result!.cost).toBe(15);
  });

  it('chooses heal at exactly 0% HP', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.0);
    expect(result!.action).toBe('heal');
  });

  it('chooses heal at HP just below threshold (0.49)', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.49);
    expect(result!.action).toBe('heal');
  });

  it('does NOT choose heal at exactly threshold (0.5)', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.5);
    // HP = threshold, so heal is NOT prioritized; damage should be selected
    expect(result!.action).toBe('damage');
  });

  it('does NOT choose heal when HP above threshold (0.9)', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.9);
    expect(result!.action).toBe('damage');
  });

  it('custom config: heal threshold at 0.5', () => {
    const config: ShopConfig = { healHpThreshold: 0.5 };
    const result = scoreBestShopChoice(ITEMS, 1000, 0.49, config);
    expect(result!.action).toBe('heal');
  });

  it('custom config: heal threshold at 0.5 — above threshold', () => {
    const config: ShopConfig = { healHpThreshold: 0.5 };
    const result = scoreBestShopChoice(ITEMS, 1000, 0.5, config);
    expect(result!.action).toBe('damage');
  });
});

// ========================================
// scoreBestShopChoice — damage preference when HP high
// ========================================
describe('scoreBestShopChoice — damage preference', () => {
  it('chooses damage when HP is full (1.0)', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 1.0);
    expect(result!.action).toBe('damage');
  });

  it('chooses damage when HP is at threshold', () => {
    const result = scoreBestShopChoice(ITEMS, 1000, 0.5);
    expect(result!.action).toBe('damage');
  });

  it('falls back to first affordable when damage not available', () => {
    const noDamage: ShopItem[] = [
      { name: 'Heal', desc: 'heal', cost: 200, action: 'heal' },
      { name: 'Armor', desc: 'armor', cost: 250, action: 'armor' },
    ];
    const result = scoreBestShopChoice(noDamage, 1000, 1.0);
    // No damage available, HP high → fallback to first affordable = heal
    expect(result!.action).toBe('heal');
  });

  it('chooses armor when only armor affordable and HP high', () => {
    const armorOnly: ShopItem[] = [{ name: 'Armor', desc: 'armor', cost: 10, action: 'armor' }];
    const result = scoreBestShopChoice(armorOnly, 10, 1.0);
    expect(result!.action).toBe('armor');
  });
});

// ========================================
// scoreBestShopChoice — edge cases
// ========================================
describe('scoreBestShopChoice — edge cases', () => {
  it('returns null for empty items', () => {
    expect(scoreBestShopChoice([], 100, 0.5)).toBeNull();
  });

  it('returns null when all items unaffordable', () => {
    expect(scoreBestShopChoice(ITEMS, 5, 0.5)).toBeNull();
  });

  it('handles tied costs correctly — damage preferred', () => {
    const tied: ShopItem[] = [
      { name: 'Heal', desc: 'heal', cost: 250, action: 'heal' },
      { name: 'Damage', desc: 'dmg', cost: 250, action: 'damage' },
      { name: 'Armor', desc: 'armor', cost: 250, action: 'armor' },
    ];
    const result = scoreBestShopChoice(tied, 250, 1.0);
    expect(result!.action).toBe('damage');
    expect(result!.cost).toBe(250);
  });

  it('handles negative gold gracefully', () => {
    expect(scoreBestShopChoice(ITEMS, -10, 0.5)).toBeNull();
  });

  it('single affordable item returned as fallback', () => {
    const result = scoreBestShopChoice(ITEMS, 15, 1.0);
    // Only heal (15) is affordable, HP is high, no damage available → fallback to heal
    expect(result!.action).toBe('heal');
    expect(result!.cost).toBe(15);
  });
});

// ========================================
// scoreBestShopChoice — config variations
// ========================================
describe('scoreBestShopChoice — config variations', () => {
  it('threshold 0 means heal is never prioritized', () => {
    const config: ShopConfig = { healHpThreshold: 0 };
    const result = scoreBestShopChoice(ITEMS, 1000, 0.01, config);
    expect(result!.action).toBe('damage');
  });

  it('threshold 1 means heal is always prioritized when affordable', () => {
    const config: ShopConfig = { healHpThreshold: 1.0 };
    const result = scoreBestShopChoice(ITEMS, 1000, 0.99, config);
    expect(result!.action).toBe('heal');
  });

  it('default config uses 0.5 threshold', () => {
    expect(DEFAULT_SHOP_CONFIG.healHpThreshold).toBe(0.5);
  });
});

// ========================================
// calculateShopHeal / applyShopHeal
// ========================================
describe('calculateShopHeal', () => {
  it('calculates 30% of 600 as 180', () => {
    expect(calculateShopHeal(600, 0.3)).toBe(180);
  });

  it('uses Math.ceil for fractional values', () => {
    expect(calculateShopHeal(100, 0.33)).toBe(33); // ceil(33) = 33
    expect(calculateShopHeal(99, 0.33)).toBe(33); // ceil(32.67) = 33
  });
});

describe('applyShopHeal', () => {
  it('heals from 300 to 480 (30% of 600)', () => {
    expect(applyShopHeal(300, 600, 0.3)).toBe(480);
  });

  it('clamps to max HP', () => {
    expect(applyShopHeal(550, 600, 0.3)).toBe(600);
  });

  it('heals from 0', () => {
    expect(applyShopHeal(0, 600, 0.3)).toBe(180);
  });
});

// ========================================
// applyShopDamageBoost
// ========================================
describe('applyShopDamageBoost', () => {
  it('applies 25% boost to base multiplier', () => {
    expect(applyShopDamageBoost(1.0, 0.25)).toBeCloseTo(1.25);
  });

  it('stacks multiplicatively on existing multiplier', () => {
    expect(applyShopDamageBoost(1.5, 0.25)).toBeCloseTo(1.875);
  });
});

// ========================================
// applyShopArmorBoost / calculateBaseArmor
// ========================================
describe('applyShopArmorBoost', () => {
  it('applies 25% armor reduction', () => {
    expect(applyShopArmorBoost(1.0, 0.25)).toBeCloseTo(0.75);
  });

  it('stacks multiplicatively', () => {
    expect(applyShopArmorBoost(0.75, 0.25)).toBeCloseTo(0.5625);
  });
});

describe('calculateBaseArmor', () => {
  it('returns shopArmor when passive level is 0', () => {
    expect(calculateBaseArmor(0.75, 0, 0.1)).toBe(0.75);
  });

  it('combines passive and shop armor at level 1', () => {
    // passiveArmor = max(0.1, 1 - 0.10 * 1) = 0.90
    // result = 0.90 * 0.75 = 0.675
    expect(calculateBaseArmor(0.75, 1, 0.1)).toBeCloseTo(0.675);
  });

  it('clamps passive armor to minimum 0.3', () => {
    // level 10 at 0.10/level = 1 - 1.0 = 0 → clamped to 0.3
    // result = 0.3 * 1.0 = 0.3
    expect(calculateBaseArmor(1.0, 10, 0.1)).toBeCloseTo(0.3);
  });

  it('clamps passive armor with high level + shop armor', () => {
    // level 20 at 0.10/level = 1 - 2.0 = -1.0 → clamped to 0.3
    // result = 0.3 * 0.5 = 0.15
    expect(calculateBaseArmor(0.5, 20, 0.1)).toBeCloseTo(0.15);
  });
});
