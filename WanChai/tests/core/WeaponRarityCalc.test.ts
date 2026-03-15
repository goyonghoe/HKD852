import { describe, it, expect } from 'vitest';
import {
  RARITY_TIERS,
  getRarityStatMultiplier,
  getRarityColorKey,
  buildRarityPool,
  selectRarity,
  applyRarityToDamage,
  getRarityCooldownMultiplier,
  compareRarity,
} from '../../src/core/WeaponRarityCalc';
import { BALANCE } from '../../src/config/balance';
import type { WeaponRarity } from '../../src/types/weapon';

// ── RARITY_TIERS ────────────────────────────────────────────────────────────

describe('RARITY_TIERS', () => {
  it('contains all 5 rarity tiers in order', () => {
    expect(RARITY_TIERS).toEqual(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  });
});

// ── getRarityStatMultiplier ─────────────────────────────────────────────────

describe('getRarityStatMultiplier', () => {
  it('Common returns 1.0', () => {
    expect(getRarityStatMultiplier('Common')).toBe(1.0);
  });

  it('Uncommon returns 1.15', () => {
    expect(getRarityStatMultiplier('Uncommon')).toBe(1.15);
  });

  it('Rare returns 1.35', () => {
    expect(getRarityStatMultiplier('Rare')).toBe(1.35);
  });

  it('Epic returns 1.6', () => {
    expect(getRarityStatMultiplier('Epic')).toBe(1.6);
  });

  it('Legendary returns 2.0', () => {
    expect(getRarityStatMultiplier('Legendary')).toBe(2.0);
  });

  it('matches BALANCE.RARITY.statMultiplier for all tiers', () => {
    for (const rarity of RARITY_TIERS) {
      expect(getRarityStatMultiplier(rarity)).toBe(BALANCE.RARITY.statMultiplier[rarity]);
    }
  });
});

// ── getRarityColorKey ───────────────────────────────────────────────────────

describe('getRarityColorKey', () => {
  it('returns rarity-prefixed key', () => {
    expect(getRarityColorKey('Common')).toBe('rarityCommon');
    expect(getRarityColorKey('Legendary')).toBe('rarityLegendary');
  });
});

// ── buildRarityPool ─────────────────────────────────────────────────────────

describe('buildRarityPool', () => {
  it('pool length equals sum of all drop weights with no luck bonus', () => {
    const pool = buildRarityPool(0);
    const totalWeight = Object.values(BALANCE.RARITY.dropWeight).reduce((a, b) => a + b, 0);
    expect(pool.length).toBe(totalWeight);
  });

  it('pool contains all rarity tiers', () => {
    const pool = buildRarityPool(0);
    for (const rarity of RARITY_TIERS) {
      expect(pool).toContain(rarity);
    }
  });

  it('Common is most frequent tier in default pool', () => {
    const pool = buildRarityPool(0);
    const counts: Record<string, number> = {};
    for (const r of pool) counts[r] = (counts[r] ?? 0) + 1;
    expect(counts['Common']).toBeGreaterThan(counts['Uncommon']);
    expect(counts['Uncommon']).toBeGreaterThan(counts['Rare']);
    expect(counts['Rare']).toBeGreaterThan(counts['Epic']);
    expect(counts['Epic']).toBeGreaterThan(counts['Legendary']);
  });

  it('luck bonus reduces Common count and increases Uncommon/Rare', () => {
    const noLuck = buildRarityPool(0);
    const withLuck = buildRarityPool(0.2); // 4 * 5 = 20 weight shift
    const commonBefore = noLuck.filter((r) => r === 'Common').length;
    const commonAfter = withLuck.filter((r) => r === 'Common').length;
    const rareBefore = noLuck.filter((r) => r === 'Rare').length;
    const rareAfter = withLuck.filter((r) => r === 'Rare').length;
    expect(commonAfter).toBeLessThan(commonBefore);
    expect(rareAfter).toBeGreaterThanOrEqual(rareBefore);
  });

  it('Common never drops below 5 entries even with max luck bonus', () => {
    const pool = buildRarityPool(1.0); // extreme luck
    const commonCount = pool.filter((r) => r === 'Common').length;
    expect(commonCount).toBeGreaterThanOrEqual(5);
  });
});

// ── selectRarity ────────────────────────────────────────────────────────────

describe('selectRarity', () => {
  it('returns a valid rarity tier', () => {
    const rarities = new Set<WeaponRarity>(RARITY_TIERS);
    for (let roll = 0; roll <= 1; roll += 0.1) {
      expect(rarities.has(selectRarity(roll))).toBe(true);
    }
  });

  it('roll=0 always returns Common (first element of pool)', () => {
    expect(selectRarity(0)).toBe('Common');
  });

  it('is deterministic for the same roll', () => {
    expect(selectRarity(0.5)).toBe(selectRarity(0.5));
    expect(selectRarity(0.99)).toBe(selectRarity(0.99));
  });

  it('with no luck, roll near 1.0 returns Legendary (pool index > 99)', () => {
    // Pool: [50 Common, 30 Uncommon, 15 Rare, 4 Epic, 1 Legendary] = 100 total
    // Last element (idx 99) = Legendary
    const result = selectRarity(0.999);
    expect(result).toBe('Legendary');
  });

  it('distributes rarities roughly proportional to drop weights', () => {
    const buckets: Record<string, number> = { Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0 };
    const N = 10000;
    for (let i = 0; i < N; i++) {
      const roll = i / N;
      const r = selectRarity(roll);
      buckets[r]++;
    }
    // Common should be ~50%, Legendary should be ~1%
    expect(buckets['Common'] / N).toBeCloseTo(0.5, 1);
    expect(buckets['Legendary'] / N).toBeCloseTo(0.01, 1);
  });
});

// ── applyRarityToDamage ─────────────────────────────────────────────────────

describe('applyRarityToDamage', () => {
  it('Common returns base damage unchanged', () => {
    expect(applyRarityToDamage(100, 'Common')).toBe(100);
  });

  it('Legendary doubles damage and rounds up', () => {
    expect(applyRarityToDamage(10, 'Legendary')).toBe(20);
    expect(applyRarityToDamage(11, 'Legendary')).toBe(22);
  });

  it('Uncommon returns Math.ceil(base * 1.15)', () => {
    expect(applyRarityToDamage(10, 'Uncommon')).toBe(12); // ceil(11.5)
    expect(applyRarityToDamage(20, 'Uncommon')).toBe(23); // ceil(23.0)
  });

  it('Rare returns Math.ceil(base * 1.35)', () => {
    expect(applyRarityToDamage(100, 'Rare')).toBe(135);
  });

  it('Epic returns Math.ceil(base * 1.6)', () => {
    expect(applyRarityToDamage(50, 'Epic')).toBe(80);
  });
});

// ── getRarityCooldownMultiplier ────────────────────────────────────────────

describe('getRarityCooldownMultiplier', () => {
  it('Common returns 1.0 (no cooldown reduction)', () => {
    expect(getRarityCooldownMultiplier('Common')).toBe(1.0);
  });

  it('all rarities return a value in (0.5, 1.0]', () => {
    for (const rarity of RARITY_TIERS) {
      const mult = getRarityCooldownMultiplier(rarity);
      expect(mult).toBeGreaterThan(0.5);
      expect(mult).toBeLessThanOrEqual(1.0);
    }
  });

  it('higher rarity = lower cooldown multiplier', () => {
    const values = RARITY_TIERS.map(getRarityCooldownMultiplier);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });

  it('never drops below 0.5 floor', () => {
    // Legendary: statMult=2.0 → 1 - (2-1)*0.1 = 0.9 — well above floor
    expect(getRarityCooldownMultiplier('Legendary')).toBeGreaterThanOrEqual(0.5);
  });
});

// ── compareRarity ────────────────────────────────────────────────────────────

describe('compareRarity', () => {
  it('equal rarities return 0', () => {
    expect(compareRarity('Common', 'Common')).toBe(0);
    expect(compareRarity('Legendary', 'Legendary')).toBe(0);
  });

  it('lower rarity returns negative', () => {
    expect(compareRarity('Common', 'Rare')).toBeLessThan(0);
    expect(compareRarity('Uncommon', 'Legendary')).toBeLessThan(0);
  });

  it('higher rarity returns positive', () => {
    expect(compareRarity('Legendary', 'Common')).toBeGreaterThan(0);
    expect(compareRarity('Epic', 'Rare')).toBeGreaterThan(0);
  });

  it('can sort an array of rarities by tier', () => {
    const unsorted: WeaponRarity[] = ['Legendary', 'Common', 'Epic', 'Rare', 'Uncommon'];
    const sorted = [...unsorted].sort(compareRarity);
    expect(sorted).toEqual(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']);
  });
});

// ── Balance config integrity ─────────────────────────────────────────────────

describe('BALANCE.RARITY config integrity', () => {
  it('dropWeight sums to 100', () => {
    const total = Object.values(BALANCE.RARITY.dropWeight).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('statMultipliers are strictly increasing across tiers', () => {
    const mults = RARITY_TIERS.map((r) => BALANCE.RARITY.statMultiplier[r]);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThan(mults[i - 1]);
    }
  });

  it('Common stat multiplier is exactly 1.0', () => {
    expect(BALANCE.RARITY.statMultiplier['Common']).toBe(1.0);
  });

  it('Legendary stat multiplier is exactly 2.0', () => {
    expect(BALANCE.RARITY.statMultiplier['Legendary']).toBe(2.0);
  });
});
