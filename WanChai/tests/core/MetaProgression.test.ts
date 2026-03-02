import { describe, it, expect } from 'vitest';
import {
  META_UPGRADES,
  canPurchase,
  purchaseUpgrade,
  getMetaBonus,
} from '../../src/core/MetaProgression';
import type { MetaState } from '../../src/types/game';

function makeMeta(overrides: Partial<MetaState> = {}): MetaState {
  return {
    totalGold: 0,
    highScore: 0,
    bestKills: 0,
    bestLevel: 0,
    bestTimeMs: 0,
    upgrades: {},
    runsCompleted: 0,
    discovered: { weapons: ['energy_shot'], enemies: [] },
    ...overrides,
  };
}

describe('META_UPGRADES definitions', () => {
  it('all upgrades have costPerLevel matching maxLevel', () => {
    for (const def of Object.values(META_UPGRADES)) {
      expect(def.costPerLevel.length).toBe(def.maxLevel);
    }
  });

  it('costs are monotonically increasing', () => {
    for (const def of Object.values(META_UPGRADES)) {
      for (let i = 1; i < def.costPerLevel.length; i++) {
        expect(def.costPerLevel[i]).toBeGreaterThan(def.costPerLevel[i - 1]);
      }
    }
  });
});

describe('canPurchase', () => {
  it('returns false for unknown upgrade id', () => {
    expect(canPurchase(makeMeta({ totalGold: 9999 }), 'no_such_upgrade')).toBe(false);
  });

  it('returns false when gold is insufficient', () => {
    expect(canPurchase(makeMeta({ totalGold: 10 }), 'meta_damage')).toBe(false);
  });

  it('returns true when gold is sufficient', () => {
    expect(canPurchase(makeMeta({ totalGold: 50 }), 'meta_damage')).toBe(true);
  });

  it('returns false when upgrade is at max level', () => {
    const meta = makeMeta({
      totalGold: 9999,
      upgrades: { meta_xp: 3 }, // maxLevel = 3
    });
    expect(canPurchase(meta, 'meta_xp')).toBe(false);
  });

  it('uses correct cost for current level', () => {
    // meta_damage level 0 costs 50, level 1 costs 100
    const meta = makeMeta({ totalGold: 99, upgrades: { meta_damage: 1 } });
    expect(canPurchase(meta, 'meta_damage')).toBe(false); // needs 100
    const meta2 = makeMeta({ totalGold: 100, upgrades: { meta_damage: 1 } });
    expect(canPurchase(meta2, 'meta_damage')).toBe(true);
  });
});

describe('purchaseUpgrade', () => {
  it('returns same meta for unknown upgrade', () => {
    const meta = makeMeta({ totalGold: 100 });
    expect(purchaseUpgrade(meta, 'bogus')).toBe(meta);
  });

  it('returns same meta when at max level', () => {
    const meta = makeMeta({ totalGold: 9999, upgrades: { meta_xp: 3 } });
    expect(purchaseUpgrade(meta, 'meta_xp')).toBe(meta);
  });

  it('returns same meta when gold insufficient', () => {
    const meta = makeMeta({ totalGold: 10 });
    expect(purchaseUpgrade(meta, 'meta_damage')).toBe(meta);
  });

  it('deducts gold and increments level on purchase', () => {
    const meta = makeMeta({ totalGold: 200 });
    const result = purchaseUpgrade(meta, 'meta_damage');
    expect(result.totalGold).toBe(150); // 200 - 50
    expect(result.upgrades.meta_damage).toBe(1);
  });

  it('does not mutate original meta', () => {
    const meta = makeMeta({ totalGold: 200 });
    purchaseUpgrade(meta, 'meta_damage');
    expect(meta.totalGold).toBe(200);
    expect(meta.upgrades.meta_damage).toBeUndefined();
  });
});

describe('getMetaBonus', () => {
  it('returns 0 with no upgrades', () => {
    expect(getMetaBonus(makeMeta(), 'damage')).toBe(0);
  });

  it('returns correct bonus for single upgrade', () => {
    const meta = makeMeta({ upgrades: { meta_damage: 3 } });
    expect(getMetaBonus(meta, 'damage')).toBeCloseTo(0.30); // 0.10 * 3
  });

  it('returns 0 for effects with no matching upgrades', () => {
    const meta = makeMeta({ upgrades: { meta_damage: 5 } });
    expect(getMetaBonus(meta, 'nonexistent_effect')).toBe(0);
  });
});
