import { describe, it, expect } from 'vitest';
import {
  findNearestTarget,
  findNearestTargets,
  isInRange,
  calculateFireAngle,
  filterTargetsInRange,
  distance,
  predictTargetPosition,
} from '../../src/core/AllyTargeting';

describe('distance', () => {
  it('3-4-5 triangle', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });

  it('zero distance (same point)', () => {
    expect(distance(10, 20, 10, 20)).toBe(0);
  });

  it('large values', () => {
    const d = distance(0, 0, 3000, 4000);
    expect(d).toBe(5000);
  });

  it('negative coordinates', () => {
    const d = distance(-3, -4, 0, 0);
    expect(d).toBe(5);
  });

  it('horizontal only', () => {
    expect(distance(0, 0, 100, 0)).toBe(100);
  });

  it('vertical only', () => {
    expect(distance(0, 0, 0, 200)).toBe(200);
  });
});

describe('findNearestTarget', () => {
  it('single target', () => {
    const result = findNearestTarget(0, 0, [{ x: 10, y: 0 }]);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(0);
    expect(result!.x).toBe(10);
    expect(result!.y).toBe(0);
    expect(result!.distance).toBe(10);
  });

  it('multiple targets — picks closest', () => {
    const targets = [
      { x: 100, y: 0 },
      { x: 10, y: 0 },
      { x: 50, y: 0 },
    ];
    const result = findNearestTarget(0, 0, targets);
    expect(result!.index).toBe(1);
    expect(result!.distance).toBe(10);
  });

  it('empty array returns null', () => {
    expect(findNearestTarget(0, 0, [])).toBeNull();
  });

  it('tie-break: first index wins', () => {
    const targets = [
      { x: 10, y: 0 },
      { x: -10, y: 0 }, // same distance (10)
    ];
    const result = findNearestTarget(0, 0, targets);
    expect(result!.index).toBe(0); // first with distance 10
  });

  it('target at same position', () => {
    const result = findNearestTarget(5, 5, [{ x: 5, y: 5 }]);
    expect(result!.distance).toBe(0);
  });
});

describe('findNearestTargets', () => {
  const targets = [
    { x: 100, y: 0 },
    { x: 10, y: 0 },
    { x: 50, y: 0 },
    { x: 30, y: 0 },
  ];

  it('N=1 returns closest', () => {
    const results = findNearestTargets(0, 0, 1, targets);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe(1); // x=10
  });

  it('N=2 returns 2 closest sorted', () => {
    const results = findNearestTargets(0, 0, 2, targets);
    expect(results).toHaveLength(2);
    expect(results[0].distance).toBeLessThanOrEqual(results[1].distance);
    expect(results[0].index).toBe(1); // x=10
    expect(results[1].index).toBe(3); // x=30
  });

  it('N > available returns all available', () => {
    const results = findNearestTargets(0, 0, 10, targets);
    expect(results).toHaveLength(4);
  });

  it('N=0 returns empty', () => {
    const results = findNearestTargets(0, 0, 0, targets);
    expect(results).toHaveLength(0);
  });

  it('empty targets returns empty', () => {
    const results = findNearestTargets(0, 0, 3, []);
    expect(results).toHaveLength(0);
  });

  it('results are sorted by distance ascending', () => {
    const results = findNearestTargets(0, 0, 4, targets);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
    }
  });
});

describe('isInRange', () => {
  it('inside range', () => {
    expect(isInRange(0, 0, 3, 4, 10)).toBe(true); // dist=5, range=10
  });

  it('outside range', () => {
    expect(isInRange(0, 0, 3, 4, 4)).toBe(false); // dist=5, range=4
  });

  it('exact boundary (inclusive)', () => {
    expect(isInRange(0, 0, 3, 4, 5)).toBe(true); // dist=5, range=5
  });

  it('zero range — only same position', () => {
    expect(isInRange(0, 0, 0, 0, 0)).toBe(true);
    expect(isInRange(0, 0, 1, 0, 0)).toBe(false);
  });

  it('same position always in range', () => {
    expect(isInRange(10, 20, 10, 20, 0)).toBe(true);
    expect(isInRange(10, 20, 10, 20, 100)).toBe(true);
  });
});

describe('calculateFireAngle', () => {
  it('right direction (0 radians)', () => {
    const angle = calculateFireAngle(0, 0, 10, 0);
    expect(angle).toBeCloseTo(0, 5);
  });

  it('up direction (-PI/2)', () => {
    const angle = calculateFireAngle(0, 0, 0, -10);
    expect(angle).toBeCloseTo(-Math.PI / 2, 5);
  });

  it('left direction (PI or -PI)', () => {
    const angle = calculateFireAngle(0, 0, -10, 0);
    expect(Math.abs(angle)).toBeCloseTo(Math.PI, 5);
  });

  it('down direction (PI/2)', () => {
    const angle = calculateFireAngle(0, 0, 0, 10);
    expect(angle).toBeCloseTo(Math.PI / 2, 5);
  });

  it('diagonal (up-right, -PI/4)', () => {
    const angle = calculateFireAngle(0, 0, 10, -10);
    expect(angle).toBeCloseTo(-Math.PI / 4, 5);
  });

  it('diagonal (down-left, 3PI/4)', () => {
    const angle = calculateFireAngle(0, 0, -10, 10);
    expect(angle).toBeCloseTo((3 * Math.PI) / 4, 5);
  });
});

describe('filterTargetsInRange', () => {
  const targets = [
    { x: 5, y: 0 }, // dist=5
    { x: 15, y: 0 }, // dist=15
    { x: 8, y: 0 }, // dist=8
    { x: 20, y: 0 }, // dist=20
  ];

  it('mixed in/out of range', () => {
    const results = filterTargetsInRange(0, 0, 10, targets);
    expect(results).toHaveLength(2);
    expect(results[0].index).toBe(0); // dist=5
    expect(results[1].index).toBe(2); // dist=8
  });

  it('all in range', () => {
    const results = filterTargetsInRange(0, 0, 100, targets);
    expect(results).toHaveLength(4);
  });

  it('none in range', () => {
    const results = filterTargetsInRange(0, 0, 1, targets);
    expect(results).toHaveLength(0);
  });

  it('empty targets', () => {
    const results = filterTargetsInRange(0, 0, 100, []);
    expect(results).toHaveLength(0);
  });

  it('results are sorted by distance', () => {
    const results = filterTargetsInRange(0, 0, 100, targets);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
    }
  });
});

describe('predictTargetPosition', () => {
  it('stationary target returns current position', () => {
    const pos = predictTargetPosition(100, 200, 0, 0, 500, 0, 0);
    expect(pos.x).toBeCloseTo(100, 1);
    expect(pos.y).toBeCloseTo(200, 1);
  });

  it('moving target predicts ahead with exact value', () => {
    // Target at (100, 0), moving right at 100/s. Source at (0, 0), projectile 200/s.
    // Quadratic: (100^2 - 200^2)*t^2 + 2*(100*100)*t + (100^2) = 0
    //   = -30000*t^2 + 20000*t + 10000 = 0 → 3t^2 - 2t - 1 = 0
    //   t = (2 + sqrt(4+12))/6 = (2+4)/6 = 1.0
    // Predicted: x = 100 + 100*1 = 200, y = 0
    const pos = predictTargetPosition(100, 0, 100, 0, 200, 0, 0);
    expect(pos.x).toBeCloseTo(200, 1);
    expect(pos.y).toBeCloseTo(0, 1);
  });

  it('zero projectile speed returns current target position', () => {
    const pos = predictTargetPosition(100, 200, 50, 50, 0, 0, 0);
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(200);
  });

  it('negative projectile speed returns current target position', () => {
    const pos = predictTargetPosition(100, 200, 50, 50, -10, 0, 0);
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(200);
  });

  it('target moving directly away — prediction further ahead', () => {
    // Target at (100, 0), moving away (right) at 100/s. Projectile 300/s.
    const pos = predictTargetPosition(100, 0, 100, 0, 300, 0, 0);
    expect(pos.x).toBeGreaterThan(100);
  });

  it('target moving toward source — prediction closer', () => {
    // Target at (100, 0), moving toward source at -100/s. Projectile 200/s.
    const pos = predictTargetPosition(100, 0, -100, 0, 200, 0, 0);
    // With target moving toward, predicted x should be less than current x
    expect(pos.x).toBeLessThan(100);
  });

  it('target on top of source returns current position (zero distance)', () => {
    const pos = predictTargetPosition(50, 50, 10, 10, 100, 50, 50);
    // Target is at source, t should be 0 (c=0)
    expect(pos.x).toBeCloseTo(50, 1);
    expect(pos.y).toBeCloseTo(50, 1);
  });

  it('returns finite position even with near-degenerate inputs', () => {
    // Speed nearly equal to target speed → a near zero
    const pos = predictTargetPosition(1000, 0, 100, 0, 100.001, 0, 0);
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
  });
});
