import { describe, it, expect } from 'vitest';
import {
  calculateHpScale,
  calculateSpeedScale,
  calculateDamageScale,
  getEliteMultipliers,
  calculateEnemyHp,
  calculateEnemySpeed,
  calculateEnemyDamage,
  calculateEnemyXp,
  calculateDisplaySize,
  calculateSpriteScale,
  calculateHitRadius,
  isBossBehavior,
} from '../../src/core/EnemyScalingCalc';

// ---------- calculateHpScale ----------
describe('calculateHpScale', () => {
  it('returns 1 at 0 minutes', () => {
    expect(calculateHpScale(0, 2.2)).toBe(1);
  });

  it('scales correctly at 5 minutes', () => {
    expect(calculateHpScale(5, 2.2)).toBeCloseTo(Math.pow(2.2, 5), 6);
  });

  it('scales correctly at 10 minutes', () => {
    expect(calculateHpScale(10, 2.2)).toBeCloseTo(Math.pow(2.2, 10), 6);
  });

  it('handles large elapsed time', () => {
    const result = calculateHpScale(30, 2.2);
    expect(result).toBeGreaterThan(1e10);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('handles scale of 1 (no scaling)', () => {
    expect(calculateHpScale(10, 1.0)).toBe(1);
  });

  it('negative minutes clamped to 0 (returns 1.0)', () => {
    expect(calculateHpScale(-5, 1.05)).toBe(1.0);
  });
});

// ---------- calculateSpeedScale ----------
describe('calculateSpeedScale', () => {
  it('returns 1 at 0 minutes', () => {
    expect(calculateSpeedScale(0, 1.5, 2.8)).toBe(1);
  });

  it('scales correctly at 5 minutes (under cap)', () => {
    const _raw = Math.pow(1.5, 5); // 7.59... > 2.8
    expect(calculateSpeedScale(5, 1.5, 2.8)).toBe(2.8);
  });

  it('caps at maxSpeedMultiplier', () => {
    expect(calculateSpeedScale(10, 1.5, 2.8)).toBe(2.8);
  });

  it('returns raw value when just under max', () => {
    // 1.1^5 = 1.61 which is under 2.8
    const result = calculateSpeedScale(5, 1.1, 2.8);
    expect(result).toBeCloseTo(Math.pow(1.1, 5), 6);
    expect(result).toBeLessThan(2.8);
  });

  it('handles zero minutes', () => {
    expect(calculateSpeedScale(0, 1.5, 2.8)).toBe(1);
  });

  it('negative minutes clamped to 0 for speed scale', () => {
    expect(calculateSpeedScale(-3, 1.02, 3.0)).toBe(1.0);
  });
});

// ---------- calculateDamageScale ----------
describe('calculateDamageScale', () => {
  it('returns 1 at 0 minutes', () => {
    expect(calculateDamageScale(0, 2.0)).toBe(1);
  });

  it('scales correctly at 5 minutes', () => {
    expect(calculateDamageScale(5, 2.0)).toBeCloseTo(Math.pow(2.0, 5), 6);
  });

  it('scales correctly at 10 minutes', () => {
    expect(calculateDamageScale(10, 2.0)).toBeCloseTo(Math.pow(2.0, 10), 6);
  });

  it('handles scale of 1 (no scaling)', () => {
    expect(calculateDamageScale(10, 1.0)).toBe(1);
  });

  it('negative minutes clamped to 0 for damage scale', () => {
    expect(calculateDamageScale(-2, 1.03)).toBe(1.0);
  });
});

// ---------- getEliteMultipliers ----------
describe('getEliteMultipliers', () => {
  it('returns elite multipliers when elite', () => {
    const result = getEliteMultipliers(true);
    expect(result).toEqual({ hpMult: 3, damageMult: 2, xpMult: 5, knockbackImmune: true });
  });

  it('returns normal multipliers when not elite', () => {
    const result = getEliteMultipliers(false);
    expect(result).toEqual({ hpMult: 1, damageMult: 1, xpMult: 1, knockbackImmune: false });
  });

  it('non-elite with def knockbackImmune inherits from def', () => {
    const result = getEliteMultipliers(false, true);
    expect(result.knockbackImmune).toBe(true);
  });

  it('non-elite without def knockbackImmune = false', () => {
    const result = getEliteMultipliers(false, false);
    expect(result.knockbackImmune).toBe(false);
  });
});

// ---------- calculateEnemyHp ----------
describe('calculateEnemyHp', () => {
  it('calculates normal enemy HP', () => {
    // ceil(50 * 2 * 1 * 1) = 100
    expect(calculateEnemyHp(50, 2, 1, 1, false, 15000)).toBe(100);
  });

  it('applies elite HP multiplier (3x)', () => {
    // ceil(50 * 2 * 3 * 1) = 300
    expect(calculateEnemyHp(50, 2, 3, 1, false, 15000)).toBe(300);
  });

  it('applies stage HP multiplier', () => {
    // ceil(50 * 2 * 1 * 1.5) = 150
    expect(calculateEnemyHp(50, 2, 1, 1.5, false, 15000)).toBe(150);
  });

  it('does not cap normal enemy HP even if > maxBossHp', () => {
    // ceil(10000 * 10 * 1 * 1) = 100000, not capped because not boss
    expect(calculateEnemyHp(10000, 10, 1, 1, false, 15000)).toBe(100000);
  });

  it('caps boss HP at maxBossHp when over', () => {
    // ceil(5000 * 10 * 1 * 1) = 50000 > 15000, capped
    expect(calculateEnemyHp(5000, 10, 1, 1, true, 15000)).toBe(15000);
  });

  it('does not cap boss HP when under maxBossHp', () => {
    // ceil(100 * 2 * 1 * 1) = 200, under 15000
    expect(calculateEnemyHp(100, 2, 1, 1, true, 15000)).toBe(200);
  });

  it('boss HP exactly at cap', () => {
    // ceil(15000 * 1 * 1 * 1) = 15000, exactly at cap
    expect(calculateEnemyHp(15000, 1, 1, 1, true, 15000)).toBe(15000);
  });

  it('handles zero base HP', () => {
    expect(calculateEnemyHp(0, 2, 3, 1.5, false, 15000)).toBe(0);
  });

  it('uses ceil for fractional results', () => {
    // ceil(10 * 1.5 * 1 * 1) = ceil(15) = 15
    expect(calculateEnemyHp(10, 1.5, 1, 1, false, 15000)).toBe(15);
    // ceil(7 * 1.3 * 1 * 1) = ceil(9.1) = 10
    expect(calculateEnemyHp(7, 1.3, 1, 1, false, 15000)).toBe(10);
  });
});

// ---------- calculateEnemySpeed ----------
describe('calculateEnemySpeed', () => {
  it('calculates base speed', () => {
    expect(calculateEnemySpeed(100, 1, 1)).toBe(100);
  });

  it('applies speed scale', () => {
    expect(calculateEnemySpeed(100, 2, 1)).toBe(200);
  });

  it('applies stage speed multiplier', () => {
    expect(calculateEnemySpeed(100, 1, 1.5)).toBe(150);
  });

  it('applies both multipliers', () => {
    expect(calculateEnemySpeed(100, 2, 1.5)).toBe(300);
  });
});

// ---------- calculateEnemyDamage ----------
describe('calculateEnemyDamage', () => {
  it('calculates normal enemy damage', () => {
    // ceil(10 * 2 * 1 * 1) = 20
    expect(calculateEnemyDamage(10, 2, 1, 1)).toBe(20);
  });

  it('applies elite damage multiplier (2x)', () => {
    // ceil(10 * 2 * 2 * 1) = 40
    expect(calculateEnemyDamage(10, 2, 2, 1)).toBe(40);
  });

  it('applies stage damage multiplier', () => {
    // ceil(10 * 1 * 1 * 1.5) = 15
    expect(calculateEnemyDamage(10, 1, 1, 1.5)).toBe(15);
  });

  it('uses ceil for fractional results', () => {
    // ceil(7 * 1.3 * 1 * 1) = ceil(9.1) = 10
    expect(calculateEnemyDamage(7, 1.3, 1, 1)).toBe(10);
  });

  it('does not cap normal enemy damage even if > maxBossAtk', () => {
    // ceil(100 * 5 * 1 * 1) = 500, not capped because not boss
    expect(calculateEnemyDamage(100, 5, 1, 1, false, 200)).toBe(500);
  });

  it('caps boss ATK at maxBossAtk when over', () => {
    // ceil(60 * 3 * 1 * 1.5) = 270 > 200, capped
    expect(calculateEnemyDamage(60, 3, 1, 1.5, true, 200)).toBe(200);
  });

  it('does not cap boss ATK when under maxBossAtk', () => {
    // ceil(10 * 2 * 1 * 1) = 20, under 200
    expect(calculateEnemyDamage(10, 2, 1, 1, true, 200)).toBe(20);
  });

  it('boss ATK exactly at cap', () => {
    // ceil(200 * 1 * 1 * 1) = 200, exactly at cap
    expect(calculateEnemyDamage(200, 1, 1, 1, true, 200)).toBe(200);
  });

  it('defaults to no cap when maxBossAtk not provided', () => {
    // ceil(60 * 5 * 2 * 3) = 1800, no cap (default Infinity)
    expect(calculateEnemyDamage(60, 5, 2, 3, true)).toBe(1800);
  });
});

// ---------- calculateEnemyXp ----------
describe('calculateEnemyXp', () => {
  it('normal enemy (1x)', () => {
    expect(calculateEnemyXp(10, 1)).toBe(10);
  });

  it('elite enemy (5x)', () => {
    expect(calculateEnemyXp(10, 5)).toBe(50);
  });

  it('handles zero base XP', () => {
    expect(calculateEnemyXp(0, 5)).toBe(0);
  });
});

// ---------- calculateDisplaySize ----------
describe('calculateDisplaySize', () => {
  it('boss gets 384 (default _large sprite size)', () => {
    expect(calculateDisplaySize(192, true, false)).toBe(384);
  });

  it('boss elite gets 384 * 1.4', () => {
    expect(calculateDisplaySize(192, true, true)).toBeCloseTo(384 * 1.4);
  });

  it('boss with custom display size', () => {
    expect(calculateDisplaySize(192, true, false, 480)).toBe(480);
  });

  it('T2 normal (texWidth >= 72) gets 120', () => {
    expect(calculateDisplaySize(72, false, false)).toBe(120);
  });

  it('T2 elite gets 120 * 1.4', () => {
    expect(calculateDisplaySize(72, false, true)).toBeCloseTo(120 * 1.4);
  });

  it('T1 normal (texWidth < 72) gets 96', () => {
    expect(calculateDisplaySize(48, false, false)).toBe(96);
  });

  it('T1 elite gets 96 * 1.4', () => {
    expect(calculateDisplaySize(48, false, true)).toBeCloseTo(96 * 1.4);
  });

  it('T2 boundary: texWidth exactly 72', () => {
    expect(calculateDisplaySize(72, false, false)).toBe(120);
  });

  it('T1 boundary: texWidth 71', () => {
    expect(calculateDisplaySize(71, false, false)).toBe(96);
  });
});

// ---------- calculateSpriteScale ----------
describe('calculateSpriteScale', () => {
  it('calculates normal scale', () => {
    expect(calculateSpriteScale(120, 72)).toBeCloseTo(120 / 72, 6);
  });

  it('returns 1 when texWidth is zero', () => {
    expect(calculateSpriteScale(120, 0)).toBe(1);
  });

  it('returns 1 when texWidth is negative', () => {
    expect(calculateSpriteScale(120, -10)).toBe(1);
  });

  it('calculates boss scale', () => {
    expect(calculateSpriteScale(360, 192)).toBeCloseTo(360 / 192, 6);
  });
});

// ---------- calculateHitRadius ----------
describe('calculateHitRadius', () => {
  it('large sprite boss: 20% of displaySize', () => {
    expect(calculateHitRadius(360, true, false, true)).toBe(Math.round(360 * 0.2));
  });

  it('large sprite elite: 20% of displaySize', () => {
    expect(calculateHitRadius(168, false, true, true)).toBe(Math.round(168 * 0.2));
  });

  it('large sprite normal: 20% of displaySize', () => {
    expect(calculateHitRadius(96, false, false, true)).toBe(Math.round(96 * 0.2));
  });

  it('fallback boss (no large sprite): 40', () => {
    expect(calculateHitRadius(0, true, false, false)).toBe(40);
  });

  it('fallback elite (no large sprite): 24', () => {
    expect(calculateHitRadius(0, false, true, false)).toBe(24);
  });

  it('fallback default (no large sprite): 20', () => {
    expect(calculateHitRadius(0, false, false, false)).toBe(20);
  });
});

// ---------- isBossBehavior ----------
describe('isBossBehavior', () => {
  it('boss_chase is boss', () => {
    expect(isBossBehavior('boss_chase')).toBe(true);
  });

  it('boss_circle is boss', () => {
    expect(isBossBehavior('boss_circle')).toBe(true);
  });

  it('boss_burst is boss', () => {
    expect(isBossBehavior('boss_burst')).toBe(true);
  });

  it('march is not boss', () => {
    expect(isBossBehavior('march')).toBe(false);
  });

  it('chase is not boss', () => {
    expect(isBossBehavior('chase')).toBe(false);
  });

  it('zigzag is not boss', () => {
    expect(isBossBehavior('zigzag')).toBe(false);
  });

  it('empty string is not boss', () => {
    expect(isBossBehavior('')).toBe(false);
  });

  it('shoot is not boss', () => {
    expect(isBossBehavior('shoot')).toBe(false);
  });
});
