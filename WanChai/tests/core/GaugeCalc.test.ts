import { describe, it, expect } from 'vitest';
import {
  addGaugeFromKill,
  isGaugeReady,
  resetGauge,
  calculateGaugePercent,
  estimateKillsToFull,
  calculateXpPercent,
  batchGaugeFill,
  validateGaugeConfig,
} from '../../src/core/GaugeCalc';

describe('addGaugeFromKill', () => {
  it('adds gauge from a normal kill', () => {
    const result = addGaugeFromKill(0, 100, 5);
    expect(result.newValue).toBe(5);
    expect(result.isReady).toBe(false);
  });

  it('clamps to gaugeMax on overflow', () => {
    const result = addGaugeFromKill(95, 100, 10);
    expect(result.newValue).toBe(100);
    expect(result.isReady).toBe(true);
  });

  it('handles zero starting gauge', () => {
    const result = addGaugeFromKill(0, 100, 50);
    expect(result.newValue).toBe(50);
    expect(result.isReady).toBe(false);
  });

  it('fills exactly to max', () => {
    const result = addGaugeFromKill(80, 100, 20);
    expect(result.newValue).toBe(100);
    expect(result.isReady).toBe(true);
  });

  it('already at max remains at max', () => {
    const result = addGaugeFromKill(100, 100, 5);
    expect(result.newValue).toBe(100);
    expect(result.isReady).toBe(true);
  });
});

describe('isGaugeReady', () => {
  it('returns true at max', () => {
    expect(isGaugeReady(100, 100)).toBe(true);
  });

  it('returns false under max', () => {
    expect(isGaugeReady(50, 100)).toBe(false);
  });

  it('returns true over max', () => {
    expect(isGaugeReady(150, 100)).toBe(true);
  });

  it('returns true when max is zero and current is zero', () => {
    expect(isGaugeReady(0, 0)).toBe(true);
  });
});

describe('resetGauge', () => {
  it('returns 0', () => {
    expect(resetGauge()).toBe(0);
  });
});

describe('calculateGaugePercent', () => {
  it('returns 0% at zero current', () => {
    expect(calculateGaugePercent(0, 100)).toBe(0);
  });

  it('returns 50% at half', () => {
    expect(calculateGaugePercent(50, 100)).toBe(50);
  });

  it('returns 100% at max', () => {
    expect(calculateGaugePercent(100, 100)).toBe(100);
  });

  it('clamps overflow to 100%', () => {
    expect(calculateGaugePercent(200, 100)).toBe(100);
  });

  it('returns 0 when max is zero (guard)', () => {
    expect(calculateGaugePercent(50, 0)).toBe(0);
  });

  it('returns 0 when max is negative (guard)', () => {
    expect(calculateGaugePercent(50, -10)).toBe(0);
  });

  it('clamps negative current to 0%', () => {
    expect(calculateGaugePercent(-50, 100)).toBe(0);
  });
});

describe('estimateKillsToFull', () => {
  it('from empty gauge', () => {
    expect(estimateKillsToFull(0, 100, 5)).toBe(20);
  });

  it('from partial gauge', () => {
    expect(estimateKillsToFull(60, 100, 10)).toBe(4);
  });

  it('already full returns 0 kills', () => {
    expect(estimateKillsToFull(100, 100, 5)).toBe(0);
  });

  it('fractional rounds up', () => {
    // 100-1=99 remaining / 10 per kill = 9.9 → 10
    expect(estimateKillsToFull(1, 100, 10)).toBe(10);
  });

  it('returns Infinity for zero gaugePerKill', () => {
    expect(estimateKillsToFull(0, 100, 0)).toBe(Infinity);
  });

  it('returns Infinity for negative gaugePerKill', () => {
    expect(estimateKillsToFull(0, 100, -5)).toBe(Infinity);
  });
});

describe('calculateXpPercent', () => {
  it('standard case: half XP', () => {
    expect(calculateXpPercent(50, 100)).toBe(50);
  });

  it('zero XP', () => {
    expect(calculateXpPercent(0, 100)).toBe(0);
  });

  it('full XP', () => {
    expect(calculateXpPercent(100, 100)).toBe(100);
  });

  it('clamps overflow to 100', () => {
    expect(calculateXpPercent(200, 100)).toBe(100);
  });

  it('returns 0 when xpToNextLevel is zero (guard)', () => {
    expect(calculateXpPercent(50, 0)).toBe(0);
  });

  it('returns 0 when xpToNextLevel is negative (guard)', () => {
    expect(calculateXpPercent(50, -10)).toBe(0);
  });
});

describe('batchGaugeFill', () => {
  it('fills from multiple kills', () => {
    const kills = [{ gaugePerKill: 5 }, { gaugePerKill: 5 }, { gaugePerKill: 5 }];
    const result = batchGaugeFill(0, 100, kills);
    expect(result.newValue).toBe(15);
    expect(result.isReady).toBe(false);
  });

  it('mixed tier kills', () => {
    // t1:5, t2:10, elite:20
    const kills = [{ gaugePerKill: 5 }, { gaugePerKill: 10 }, { gaugePerKill: 20 }];
    const result = batchGaugeFill(60, 100, kills);
    expect(result.newValue).toBe(95);
    expect(result.isReady).toBe(false);
  });

  it('overflows and clamps to max', () => {
    const kills = [{ gaugePerKill: 50 }, { gaugePerKill: 50 }, { gaugePerKill: 50 }];
    const result = batchGaugeFill(0, 100, kills);
    expect(result.newValue).toBe(100);
    expect(result.isReady).toBe(true);
  });

  it('empty kills array keeps current gauge', () => {
    const result = batchGaugeFill(40, 100, []);
    expect(result.newValue).toBe(40);
    expect(result.isReady).toBe(false);
  });

  it('single boss kill fills to max', () => {
    const kills = [{ gaugePerKill: 50 }];
    const result = batchGaugeFill(50, 100, kills);
    expect(result.newValue).toBe(100);
    expect(result.isReady).toBe(true);
  });
});

describe('validateGaugeConfig', () => {
  it('valid config', () => {
    expect(validateGaugeConfig(100, 5)).toBe(true);
  });

  it('zero max is invalid', () => {
    expect(validateGaugeConfig(0, 5)).toBe(false);
  });

  it('negative max is invalid', () => {
    expect(validateGaugeConfig(-10, 5)).toBe(false);
  });

  it('zero gaugePerKill is invalid', () => {
    expect(validateGaugeConfig(100, 0)).toBe(false);
  });

  it('negative gaugePerKill is invalid', () => {
    expect(validateGaugeConfig(100, -5)).toBe(false);
  });
});
