/**
 * TASK-092: GameStatFormatting Pure Logic Tests
 *
 * Tests for extracted stat formatting/calculation helpers:
 *   - formatTimeMs: milliseconds -> "M:SS"
 *   - formatNumber: thousands separators
 *   - calculateCritRate: crit percentage with div-by-zero guard
 *   - calculateWeaponDmgPercent: weapon damage % contribution
 *
 * No Phaser imports — pure math/string tests.
 */
import { describe, it, expect } from 'vitest';
import {
  formatTimeMs,
  formatNumber,
  calculateCritRate,
  calculateWeaponDmgPercent,
} from '../../src/core/GameStatFormatting';

// =======================================================================
// formatTimeMs
// =======================================================================
describe('formatTimeMs', () => {
  it('0ms returns "0:00"', () => {
    expect(formatTimeMs(0)).toBe('0:00');
  });

  it('1000ms returns "0:01"', () => {
    expect(formatTimeMs(1000)).toBe('0:01');
  });

  it('59999ms returns "0:59" (just under 1 minute)', () => {
    expect(formatTimeMs(59999)).toBe('0:59');
  });

  it('60000ms returns "1:00"', () => {
    expect(formatTimeMs(60000)).toBe('1:00');
  });

  it('61000ms returns "1:01"', () => {
    expect(formatTimeMs(61000)).toBe('1:01');
  });

  it('125000ms returns "2:05"', () => {
    expect(formatTimeMs(125000)).toBe('2:05');
  });

  it('599999ms returns "9:59" (just under 10 minutes)', () => {
    expect(formatTimeMs(599999)).toBe('9:59');
  });

  it('600000ms returns "10:00"', () => {
    expect(formatTimeMs(600000)).toBe('10:00');
  });

  it('sub-second ms (500) returns "0:00"', () => {
    expect(formatTimeMs(500)).toBe('0:00');
  });

  it('large value 3661000ms returns "61:01"', () => {
    expect(formatTimeMs(3661000)).toBe('61:01');
  });
});

// =======================================================================
// formatNumber
// =======================================================================
describe('formatNumber', () => {
  it('0 returns "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('999 returns "999" (no separator)', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('1000 returns "1,000"', () => {
    expect(formatNumber(1000)).toBe('1,000');
  });

  it('1234567 returns "1,234,567"', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('negative number -1500 returns "-1,500"', () => {
    expect(formatNumber(-1500)).toBe('-1,500');
  });

  it('small number 42 returns "42"', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

// =======================================================================
// calculateCritRate
// =======================================================================
describe('calculateCritRate', () => {
  it('0 crits out of 0 total returns 0 (div-by-zero guard)', () => {
    expect(calculateCritRate(0, 0)).toBe(0);
  });

  it('0 crits out of 100 total returns 0', () => {
    expect(calculateCritRate(0, 100)).toBe(0);
  });

  it('50 crits out of 100 total returns 50', () => {
    expect(calculateCritRate(50, 100)).toBe(50);
  });

  it('100 crits out of 100 total returns 100', () => {
    expect(calculateCritRate(100, 100)).toBe(100);
  });

  it('1 crit out of 3 total returns 33 (rounds down)', () => {
    expect(calculateCritRate(1, 3)).toBe(33);
  });

  it('2 crits out of 3 total returns 67 (rounds up)', () => {
    expect(calculateCritRate(2, 3)).toBe(67);
  });

  it('negative totalHits returns 0', () => {
    expect(calculateCritRate(5, -10)).toBe(0);
  });
});

// =======================================================================
// calculateWeaponDmgPercent
// =======================================================================
describe('calculateWeaponDmgPercent', () => {
  it('0 weapon dmg out of 0 total returns 0 (div-by-zero guard)', () => {
    expect(calculateWeaponDmgPercent(0, 0)).toBe(0);
  });

  it('500 weapon dmg out of 1000 total returns 50', () => {
    expect(calculateWeaponDmgPercent(500, 1000)).toBe(50);
  });

  it('1000 weapon dmg out of 1000 total returns 100', () => {
    expect(calculateWeaponDmgPercent(1000, 1000)).toBe(100);
  });

  it('333 weapon dmg out of 1000 total returns 33', () => {
    expect(calculateWeaponDmgPercent(333, 1000)).toBe(33);
  });

  it('0 weapon dmg out of 5000 total returns 0', () => {
    expect(calculateWeaponDmgPercent(0, 5000)).toBe(0);
  });

  it('negative totalDmg returns 0', () => {
    expect(calculateWeaponDmgPercent(100, -500)).toBe(0);
  });
});

// =======================================================================
// NaN/negative guards (RedTeam fix)
// =======================================================================
describe('formatTimeMs NaN/negative guards', () => {
  it('NaN returns "0:00"', () => {
    expect(formatTimeMs(NaN)).toBe('0:00');
  });

  it('negative ms returns "0:00"', () => {
    expect(formatTimeMs(-5000)).toBe('0:00');
  });

  it('Infinity returns "0:00"', () => {
    expect(formatTimeMs(Infinity)).toBe('0:00');
  });
});

describe('formatNumber NaN guard', () => {
  it('NaN returns "0"', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('Infinity returns "0"', () => {
    expect(formatNumber(Infinity)).toBe('0');
  });
});
