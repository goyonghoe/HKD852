import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../../src/core/DamageCalc';

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
