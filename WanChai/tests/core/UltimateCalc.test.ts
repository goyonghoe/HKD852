import { describe, it, expect } from 'vitest';
import {
  calculateCycloneHits,
  calculateBeamHits,
  applyArmorBuff,
  removeArmorBuff,
  calculateDOTTicks,
  calculateTotalDOTDamage,
  countFreezeTargets,
  type EnemyTarget,
  type Position,
} from '../../src/core/UltimateCalc';

// ---------- calculateCycloneHits ----------

describe('calculateCycloneHits', () => {
  const center: Position = { x: 100, y: 100 };

  it('hits enemy inside radius', () => {
    const enemies: EnemyTarget[] = [{ x: 110, y: 100, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.hitIndices).toEqual([0]);
    expect(result.killIndices).toEqual([]);
    expect(result.knockbacks).toHaveLength(1);
  });

  it('misses enemy outside radius', () => {
    const enemies: EnemyTarget[] = [{ x: 500, y: 500, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 50, 50, 100, enemies);
    expect(result.hitIndices).toEqual([]);
    expect(result.knockbacks).toEqual([]);
    expect(result.killIndices).toEqual([]);
  });

  it('enemy exactly at boundary is NOT hit (strict less-than)', () => {
    // Distance = exactly radius → dx*dx+dy*dy == radiusSq, NOT < radiusSq
    const enemies: EnemyTarget[] = [{ x: 300, y: 100, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.hitIndices).toEqual([]);
  });

  it('enemy just inside boundary is hit', () => {
    // Distance = 199.99... < 200
    const enemies: EnemyTarget[] = [{ x: 299, y: 100, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.hitIndices).toEqual([0]);
  });

  it('kills enemy when damage >= hp', () => {
    const enemies: EnemyTarget[] = [{ x: 110, y: 100, hp: 50, active: true }];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.hitIndices).toEqual([0]);
    expect(result.killIndices).toEqual([0]);
    expect(result.knockbacks).toEqual([]); // dead enemies don't get knockback
  });

  it('kills enemy when damage > hp', () => {
    const enemies: EnemyTarget[] = [{ x: 110, y: 100, hp: 30, active: true }];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.killIndices).toEqual([0]);
  });

  it('knockback angle is correct for enemy to the right', () => {
    const enemies: EnemyTarget[] = [{ x: 150, y: 100, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 10, 100, enemies);
    expect(result.knockbacks).toHaveLength(1);
    const kb = result.knockbacks[0];
    expect(kb.vx).toBeCloseTo(100, 5); // angle=0, cos(0)=1
    expect(kb.vy).toBeCloseTo(0, 5); // sin(0)=0
  });

  it('knockback angle is correct for enemy above', () => {
    const enemies: EnemyTarget[] = [{ x: 100, y: 50, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 10, 100, enemies);
    const kb = result.knockbacks[0];
    expect(kb.vx).toBeCloseTo(0, 5);
    expect(kb.vy).toBeCloseTo(-100, 5); // angle = -PI/2
  });

  it('knockback angle is correct for enemy diagonally', () => {
    const enemies: EnemyTarget[] = [{ x: 150, y: 150, hp: 100, active: true }];
    const result = calculateCycloneHits(center, 200, 10, 100, enemies);
    const kb = result.knockbacks[0];
    const expected = 100 * Math.cos(Math.PI / 4); // ~70.71
    expect(kb.vx).toBeCloseTo(expected, 2);
    expect(kb.vy).toBeCloseTo(expected, 2);
  });

  it('handles zero enemies', () => {
    const result = calculateCycloneHits(center, 200, 50, 100, []);
    expect(result.hitIndices).toEqual([]);
    expect(result.knockbacks).toEqual([]);
    expect(result.killIndices).toEqual([]);
  });

  it('skips inactive enemies', () => {
    const enemies: EnemyTarget[] = [
      { x: 110, y: 100, hp: 100, active: false },
      { x: 120, y: 100, hp: 100, active: true },
    ];
    const result = calculateCycloneHits(center, 200, 10, 100, enemies);
    expect(result.hitIndices).toEqual([1]);
  });

  it('all enemies killed', () => {
    const enemies: EnemyTarget[] = [
      { x: 110, y: 100, hp: 10, active: true },
      { x: 120, y: 100, hp: 5, active: true },
      { x: 130, y: 100, hp: 20, active: true },
    ];
    const result = calculateCycloneHits(center, 200, 100, 100, enemies);
    expect(result.killIndices).toEqual([0, 1, 2]);
    expect(result.knockbacks).toEqual([]);
  });

  it('mixed hit/miss/kill', () => {
    const enemies: EnemyTarget[] = [
      { x: 110, y: 100, hp: 10, active: true }, // hit + kill
      { x: 500, y: 500, hp: 100, active: true }, // miss (too far)
      { x: 120, y: 100, hp: 200, active: true }, // hit + survive (knockback)
    ];
    const result = calculateCycloneHits(center, 200, 50, 100, enemies);
    expect(result.hitIndices).toEqual([0, 2]);
    expect(result.killIndices).toEqual([0]);
    expect(result.knockbacks).toHaveLength(1);
    expect(result.knockbacks[0].index).toBe(2);
  });
});

// ---------- calculateBeamHits ----------

describe('calculateBeamHits', () => {
  const playerX = 360; // center of 720px screen

  it('hits enemy within beam width', () => {
    const enemies: EnemyTarget[] = [{ x: 360, y: 200, hp: 100, active: true }];
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([0]);
  });

  it('misses enemy outside beam width', () => {
    const enemies: EnemyTarget[] = [{ x: 500, y: 200, hp: 100, active: true }];
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([]);
  });

  it('hits enemy at exact left edge (inclusive)', () => {
    const enemies: EnemyTarget[] = [{ x: 330, y: 200, hp: 100, active: true }]; // 360 - 30 = 330
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([0]);
  });

  it('hits enemy at exact right edge (inclusive)', () => {
    const enemies: EnemyTarget[] = [{ x: 390, y: 200, hp: 100, active: true }]; // 360 + 30 = 390
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([0]);
  });

  it('misses enemy just outside left edge', () => {
    const enemies: EnemyTarget[] = [{ x: 329, y: 200, hp: 100, active: true }];
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([]);
  });

  it('kills enemy when damage >= hp', () => {
    const enemies: EnemyTarget[] = [{ x: 360, y: 200, hp: 50, active: true }];
    const result = calculateBeamHits(playerX, 30, 200, enemies);
    expect(result.hitIndices).toEqual([0]);
    expect(result.killIndices).toEqual([0]);
  });

  it('skips inactive enemies', () => {
    const enemies: EnemyTarget[] = [
      { x: 360, y: 200, hp: 100, active: false },
      { x: 360, y: 300, hp: 100, active: true },
    ];
    const result = calculateBeamHits(playerX, 30, 50, enemies);
    expect(result.hitIndices).toEqual([1]);
  });

  it('mixed alive and dead after hit', () => {
    const enemies: EnemyTarget[] = [
      { x: 355, y: 200, hp: 10, active: true }, // killed
      { x: 365, y: 300, hp: 500, active: true }, // survives
      { x: 700, y: 100, hp: 100, active: true }, // missed
    ];
    const result = calculateBeamHits(playerX, 30, 100, enemies);
    expect(result.hitIndices).toEqual([0, 1]);
    expect(result.killIndices).toEqual([0]);
  });

  it('empty enemies array', () => {
    const result = calculateBeamHits(playerX, 30, 100, []);
    expect(result.hitIndices).toEqual([]);
    expect(result.killIndices).toEqual([]);
  });
});

// ---------- applyArmorBuff / removeArmorBuff ----------

describe('applyArmorBuff', () => {
  it('reduces armor by buff percent', () => {
    expect(applyArmorBuff(1.0, 0.5)).toBe(0.5); // 1.0 * (1 - 0.5)
  });

  it('zero buff returns same armor', () => {
    expect(applyArmorBuff(0.8, 0)).toBe(0.8);
  });

  it('100% buff reduces armor to zero', () => {
    expect(applyArmorBuff(1.0, 1.0)).toBe(0);
  });

  it('works with fractional armor', () => {
    expect(applyArmorBuff(0.6, 0.5)).toBeCloseTo(0.3);
  });
});

describe('removeArmorBuff', () => {
  it('restores armor from buff', () => {
    expect(removeArmorBuff(0.5, 0.5)).toBe(1.0); // 0.5 / (1 - 0.5)
  });

  it('zero buff returns same armor', () => {
    expect(removeArmorBuff(0.8, 0)).toBe(0.8);
  });

  it('round-trip: apply then remove returns original', () => {
    const original = 0.75;
    const buffPercent = 0.5;
    const applied = applyArmorBuff(original, buffPercent);
    const restored = removeArmorBuff(applied, buffPercent);
    expect(restored).toBeCloseTo(original, 10);
  });

  it('round-trip with small buff', () => {
    const original = 1.0;
    const buffPercent = 0.15;
    const applied = applyArmorBuff(original, buffPercent);
    const restored = removeArmorBuff(applied, buffPercent);
    expect(restored).toBeCloseTo(original, 10);
  });

  it('100% buff guard: returns currentArmor instead of Infinity', () => {
    expect(removeArmorBuff(0, 1.0)).toBe(0);
    expect(removeArmorBuff(0.5, 1.0)).toBe(0.5);
  });
});

// ---------- calculateDOTTicks ----------

describe('calculateDOTTicks', () => {
  it('calculates correct tick count (3000ms / 500ms = 6)', () => {
    expect(calculateDOTTicks(3000, 500)).toBe(6);
  });

  it('floors partial ticks (2500 / 500 = 5)', () => {
    expect(calculateDOTTicks(2500, 500)).toBe(5);
  });

  it('returns 0 for zero duration', () => {
    expect(calculateDOTTicks(0, 500)).toBe(0);
  });

  it('returns 0 for zero interval (guard against division by zero)', () => {
    expect(calculateDOTTicks(3000, 0)).toBe(0);
  });

  it('returns 0 for negative interval', () => {
    expect(calculateDOTTicks(3000, -100)).toBe(0);
  });

  it('single tick when duration == interval', () => {
    expect(calculateDOTTicks(500, 500)).toBe(1);
  });

  it('floors when not evenly divisible (1000ms / 300ms = 3)', () => {
    expect(calculateDOTTicks(1000, 300)).toBe(3);
  });
});

// ---------- calculateTotalDOTDamage ----------

describe('calculateTotalDOTDamage', () => {
  it('calculates total (15 dmg * 6 ticks = 90)', () => {
    expect(calculateTotalDOTDamage(15, 6)).toBe(90);
  });

  it('zero ticks yields zero damage', () => {
    expect(calculateTotalDOTDamage(15, 0)).toBe(0);
  });

  it('zero damage per tick yields zero', () => {
    expect(calculateTotalDOTDamage(0, 10)).toBe(0);
  });

  it('single tick', () => {
    expect(calculateTotalDOTDamage(25, 1)).toBe(25);
  });
});

// ---------- countFreezeTargets ----------

describe('countFreezeTargets', () => {
  it('counts only active enemies', () => {
    const enemies: EnemyTarget[] = [
      { x: 0, y: 0, hp: 100, active: true },
      { x: 0, y: 0, hp: 0, active: false },
      { x: 0, y: 0, hp: 50, active: true },
    ];
    expect(countFreezeTargets(enemies)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(countFreezeTargets([])).toBe(0);
  });

  it('returns 0 when all inactive', () => {
    const enemies: EnemyTarget[] = [
      { x: 0, y: 0, hp: 100, active: false },
      { x: 0, y: 0, hp: 50, active: false },
    ];
    expect(countFreezeTargets(enemies)).toBe(0);
  });

  it('counts all when all active', () => {
    const enemies: EnemyTarget[] = [
      { x: 0, y: 0, hp: 100, active: true },
      { x: 0, y: 0, hp: 50, active: true },
      { x: 0, y: 0, hp: 200, active: true },
    ];
    expect(countFreezeTargets(enemies)).toBe(3);
  });
});
