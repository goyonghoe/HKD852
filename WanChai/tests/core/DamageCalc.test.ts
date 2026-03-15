import { describe, it, expect } from 'vitest';
import { calculateDamage, getElementMultiplier } from '../../src/core/DamageCalc';

const ADVANTAGES: Record<string, string> = {
  WIND: 'EARTH',
  EARTH: 'LIGHT',
  LIGHT: 'FIRE',
  FIRE: 'WATER',
  WATER: 'WIND',
};
const ADV = 1.5;
const DIS = 0.75;
const DARK = 1.25;

describe('calculateDamage', () => {
  it('normal hit when roll >= critChance', () => {
    const result = calculateDamage(100, 1.0, 0.25, 2.0, 0.5);
    expect(result.isCrit).toBe(false);
    expect(result.damage).toBe(100); // ceil(100 * 1.0 * 1)
  });

  it('crit hit when roll < critChance', () => {
    const result = calculateDamage(100, 1.0, 0.25, 2.0, 0.1);
    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(200); // ceil(100 * 1.0 * 2.0)
  });

  it('damage multiplier scales base damage', () => {
    const result = calculateDamage(100, 1.5, 0.0, 2.0, 0.5);
    expect(result.isCrit).toBe(false);
    expect(result.damage).toBe(150); // ceil(100 * 1.5)
  });

  it('crit + multiplier stacking is multiplicative', () => {
    const result = calculateDamage(100, 1.5, 1.0, 3.0, 0.0);
    // roll=0.0 < critChance=1.0 → crit
    expect(result.isCrit).toBe(true);
    expect(result.damage).toBe(450); // ceil(100 * 1.5 * 3.0)
  });

  it('fractional base uses Math.ceil', () => {
    const result = calculateDamage(10, 1.0, 0.0, 1.0, 0.5);
    // no crit, multiplier 1 → ceil(10) = 10
    const resultFrac = calculateDamage(10, 1.3, 0.0, 1.0, 0.5);
    // ceil(10 * 1.3) = ceil(13) = 13
    expect(resultFrac.damage).toBe(13);
    expect(result.damage).toBe(10);
  });
});

describe('getElementMultiplier', () => {
  it('returns neutral when attacker has no element', () => {
    const r = getElementMultiplier(null, 'FIRE', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1);
    expect(r.effectiveness).toBe('neutral');
  });

  it('returns neutral when defender has no element', () => {
    const r = getElementMultiplier('WIND', null, ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1);
    expect(r.effectiveness).toBe('neutral');
  });

  it('returns neutral when both null', () => {
    const r = getElementMultiplier(null, null, ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1);
    expect(r.effectiveness).toBe('neutral');
  });

  it('WIND beats EARTH (advantage)', () => {
    const r = getElementMultiplier('WIND', 'EARTH', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.5);
    expect(r.effectiveness).toBe('effective');
  });

  it('EARTH beats LIGHT (advantage)', () => {
    const r = getElementMultiplier('EARTH', 'LIGHT', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.5);
    expect(r.effectiveness).toBe('effective');
  });

  it('LIGHT beats FIRE (advantage)', () => {
    const r = getElementMultiplier('LIGHT', 'FIRE', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.5);
    expect(r.effectiveness).toBe('effective');
  });

  it('FIRE beats WATER (advantage)', () => {
    const r = getElementMultiplier('FIRE', 'WATER', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.5);
    expect(r.effectiveness).toBe('effective');
  });

  it('WATER beats WIND (advantage)', () => {
    const r = getElementMultiplier('WATER', 'WIND', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.5);
    expect(r.effectiveness).toBe('effective');
  });

  it('reverse of advantage = disadvantage', () => {
    // WIND is beaten by WATER
    const r = getElementMultiplier('WIND', 'WATER', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(0.75);
    expect(r.effectiveness).toBe('resist');
  });

  it('same element = neutral', () => {
    const r = getElementMultiplier('FIRE', 'FIRE', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1);
    expect(r.effectiveness).toBe('neutral');
  });

  it('non-adjacent elements = neutral', () => {
    // WIND and FIRE: no direct advantage
    const r = getElementMultiplier('WIND', 'FIRE', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1);
    expect(r.effectiveness).toBe('neutral');
  });

  it('attacking DARK defender = darkMult (effective)', () => {
    const r = getElementMultiplier('WIND', 'DARK', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.25);
    expect(r.effectiveness).toBe('effective');
  });

  it('DARK attacker deals extra to any element', () => {
    const r = getElementMultiplier('DARK', 'FIRE', ADVANTAGES, ADV, DIS, DARK);
    expect(r.multiplier).toBe(1.25);
    expect(r.effectiveness).toBe('effective');
  });

  it('full cycle: all 5 advantages correct', () => {
    const cycle = [
      ['WIND', 'EARTH'],
      ['EARTH', 'LIGHT'],
      ['LIGHT', 'FIRE'],
      ['FIRE', 'WATER'],
      ['WATER', 'WIND'],
    ] as const;
    for (const [atk, def] of cycle) {
      const r = getElementMultiplier(atk, def, ADVANTAGES, ADV, DIS, DARK);
      expect(r.effectiveness).toBe('effective');
      expect(r.multiplier).toBe(ADV);
    }
  });

  it('full cycle: all 5 disadvantages correct', () => {
    const cycle = [
      ['EARTH', 'WIND'],
      ['LIGHT', 'EARTH'],
      ['FIRE', 'LIGHT'],
      ['WATER', 'FIRE'],
      ['WIND', 'WATER'],
    ] as const;
    for (const [atk, def] of cycle) {
      const r = getElementMultiplier(atk, def, ADVANTAGES, ADV, DIS, DARK);
      expect(r.effectiveness).toBe('resist');
      expect(r.multiplier).toBe(DIS);
    }
  });
});
