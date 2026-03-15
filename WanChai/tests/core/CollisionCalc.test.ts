import { describe, it, expect } from 'vitest';
import {
  checkCircleCollision,
  distanceSquared,
  calculateProjectileDamage,
  shouldProjectileDespawn,
  calculateKnockbackVector,
  calculateEnemyBaseDamage,
  isOffscreen,
} from '../../src/core/CollisionCalc';

// ---------- checkCircleCollision ----------

describe('checkCircleCollision', () => {
  it('returns true when circles overlap', () => {
    expect(checkCircleCollision(0, 0, 5, 0, 10)).toBe(true);
  });

  it('returns false when circles are separated', () => {
    expect(checkCircleCollision(0, 0, 100, 0, 10)).toBe(false);
  });

  it('returns false when circles are exactly touching (strict less-than)', () => {
    // distance = 10, combinedRadius = 10 → 100 < 100 is false
    expect(checkCircleCollision(0, 0, 10, 0, 10)).toBe(false);
  });

  it('returns true when circles are just barely overlapping', () => {
    // distance = 9.99, combinedRadius = 10
    expect(checkCircleCollision(0, 0, 9.99, 0, 10)).toBe(true);
  });

  it('returns true when at same position', () => {
    expect(checkCircleCollision(5, 5, 5, 5, 10)).toBe(true);
  });

  it('returns true with zero radius at same position', () => {
    // distance = 0, 0 < 0 is false
    expect(checkCircleCollision(5, 5, 5, 5, 0)).toBe(false);
  });

  it('works with negative coordinates', () => {
    expect(checkCircleCollision(-10, -10, -5, -10, 10)).toBe(true);
  });

  it('works with diagonal positions', () => {
    // distance = sqrt(9+9) = sqrt(18) ≈ 4.24, combinedRadius = 5
    expect(checkCircleCollision(0, 0, 3, 3, 5)).toBe(true);
  });
});

// ---------- distanceSquared ----------

describe('distanceSquared', () => {
  it('returns 0 for same point', () => {
    expect(distanceSquared(5, 5, 5, 5)).toBe(0);
  });

  it('calculates 3-4-5 triangle correctly (9+16=25)', () => {
    expect(distanceSquared(0, 0, 3, 4)).toBe(25);
  });

  it('calculates horizontal distance', () => {
    expect(distanceSquared(0, 0, 10, 0)).toBe(100);
  });

  it('calculates vertical distance', () => {
    expect(distanceSquared(0, 0, 0, 7)).toBe(49);
  });

  it('works with negative coordinates', () => {
    expect(distanceSquared(-3, -4, 0, 0)).toBe(25);
  });

  it('is symmetric', () => {
    expect(distanceSquared(1, 2, 4, 6)).toBe(distanceSquared(4, 6, 1, 2));
  });

  it('handles large numbers', () => {
    expect(distanceSquared(0, 0, 1000, 0)).toBe(1000000);
  });
});

// ---------- calculateProjectileDamage ----------

describe('calculateProjectileDamage', () => {
  it('neutral element, no armor → base damage', () => {
    expect(calculateProjectileDamage(100, 1.0, 1.0)).toBe(100);
  });

  it('applies element multiplier (1.5x effective)', () => {
    expect(calculateProjectileDamage(100, 1.5, 1.0)).toBe(150);
  });

  it('applies element multiplier (0.75x resist)', () => {
    expect(calculateProjectileDamage(100, 0.75, 1.0)).toBe(75);
  });

  it('applies armor reduction (divides by armorMult)', () => {
    // 100 * 1.0 / 2.0 = 50
    expect(calculateProjectileDamage(100, 1.0, 2.0)).toBe(50);
  });

  it('combined element + armor', () => {
    // 100 * 1.5 / 2.0 = 75
    expect(calculateProjectileDamage(100, 1.5, 2.0)).toBe(75);
  });

  it('rounds correctly (Math.round)', () => {
    // 100 * 1.25 / 1.0 = 125 → exact
    expect(calculateProjectileDamage(100, 1.25, 1.0)).toBe(125);
  });

  it('rounds 0.5 up (Math.round behavior)', () => {
    // 7 * 1.5 / 1.0 = 10.5 → rounds to 11 (JS Math.round rounds .5 up)
    expect(calculateProjectileDamage(7, 1.5, 1.0)).toBe(11);
  });

  it('armor less than 1 amplifies damage', () => {
    // 100 * 1.0 / 0.5 = 200
    expect(calculateProjectileDamage(100, 1.0, 0.5)).toBe(200);
  });

  it('2x dark multiplier', () => {
    expect(calculateProjectileDamage(100, 2.0, 1.0)).toBe(200);
  });

  it('zero armor guard: returns base * elem without division', () => {
    expect(calculateProjectileDamage(100, 1.5, 0)).toBe(150);
  });

  it('negative armor guard: returns base * elem without division', () => {
    expect(calculateProjectileDamage(100, 1.0, -1)).toBe(100);
  });
});

// ---------- shouldProjectileDespawn ----------

describe('shouldProjectileDespawn', () => {
  it('despawns when hitCount > piercing', () => {
    expect(shouldProjectileDespawn(2, 1)).toBe(true);
  });

  it('does not despawn when hitCount == piercing', () => {
    expect(shouldProjectileDespawn(1, 1)).toBe(false);
  });

  it('does not despawn when hitCount < piercing', () => {
    expect(shouldProjectileDespawn(0, 1)).toBe(false);
  });

  it('zero piercing: despawns after first hit', () => {
    expect(shouldProjectileDespawn(1, 0)).toBe(true);
  });

  it('zero piercing, zero hits: still active', () => {
    expect(shouldProjectileDespawn(0, 0)).toBe(false);
  });

  it('high piercing, many hits, still under', () => {
    expect(shouldProjectileDespawn(5, 10)).toBe(false);
  });

  it('high piercing, exactly at limit', () => {
    expect(shouldProjectileDespawn(10, 10)).toBe(false);
  });

  it('high piercing, one over', () => {
    expect(shouldProjectileDespawn(11, 10)).toBe(true);
  });
});

// ---------- calculateKnockbackVector ----------

describe('calculateKnockbackVector', () => {
  const force = 100;

  it('knockback to the right (east)', () => {
    const kb = calculateKnockbackVector(0, 0, 10, 0, force);
    expect(kb.vx).toBeCloseTo(100, 5);
    expect(kb.vy).toBeCloseTo(0, 5);
  });

  it('knockback to the left (west)', () => {
    const kb = calculateKnockbackVector(10, 0, 0, 0, force);
    expect(kb.vx).toBeCloseTo(-100, 5);
    expect(kb.vy).toBeCloseTo(0, 5);
  });

  it('knockback downward (south)', () => {
    const kb = calculateKnockbackVector(0, 0, 0, 10, force);
    expect(kb.vx).toBeCloseTo(0, 5);
    expect(kb.vy).toBeCloseTo(100, 5);
  });

  it('knockback upward (north)', () => {
    const kb = calculateKnockbackVector(0, 10, 0, 0, force);
    expect(kb.vx).toBeCloseTo(0, 5);
    expect(kb.vy).toBeCloseTo(-100, 5);
  });

  it('knockback northeast (diagonal)', () => {
    const kb = calculateKnockbackVector(0, 0, 10, 10, force);
    const expected = force * Math.cos(Math.PI / 4); // ~70.71
    expect(kb.vx).toBeCloseTo(expected, 2);
    expect(kb.vy).toBeCloseTo(expected, 2);
  });

  it('knockback southwest (diagonal)', () => {
    const kb = calculateKnockbackVector(10, 10, 0, 0, force);
    const expected = force * Math.cos(Math.PI / 4); // ~70.71
    expect(kb.vx).toBeCloseTo(-expected, 2);
    expect(kb.vy).toBeCloseTo(-expected, 2);
  });

  it('knockback southeast (diagonal)', () => {
    const kb = calculateKnockbackVector(0, 10, 10, 0, force);
    const expected = force * Math.cos(Math.PI / 4);
    expect(kb.vx).toBeCloseTo(expected, 2);
    expect(kb.vy).toBeCloseTo(-expected, 2);
  });

  it('knockback northwest (diagonal)', () => {
    const kb = calculateKnockbackVector(10, 0, 0, 10, force);
    const expected = force * Math.cos(Math.PI / 4);
    expect(kb.vx).toBeCloseTo(-expected, 2);
    expect(kb.vy).toBeCloseTo(expected, 2);
  });

  it('zero force returns zero vector', () => {
    const kb = calculateKnockbackVector(0, 0, 10, 10, 0);
    expect(kb.vx).toBeCloseTo(0, 5);
    expect(kb.vy).toBeCloseTo(0, 5);
  });

  it('same position returns zero vector', () => {
    const kb = calculateKnockbackVector(5, 5, 5, 5, force);
    expect(kb.vx).toBe(0);
    expect(kb.vy).toBe(0);
  });
});

// ---------- calculateEnemyBaseDamage ----------

describe('calculateEnemyBaseDamage', () => {
  it('full armor (1.0) = full damage', () => {
    expect(calculateEnemyBaseDamage(20, 1.0)).toBe(20);
  });

  it('reduced armor (0.5) halves damage', () => {
    expect(calculateEnemyBaseDamage(20, 0.5)).toBe(10);
  });

  it('uses Math.ceil for fractional results', () => {
    // 15 * 0.3 = 4.5 → ceil = 5
    expect(calculateEnemyBaseDamage(15, 0.3)).toBe(5);
  });

  it('ceil rounds up small fractions', () => {
    // 10 * 0.11 = 1.1 → ceil = 2
    expect(calculateEnemyBaseDamage(10, 0.11)).toBe(2);
  });

  it('zero armor = zero damage', () => {
    expect(calculateEnemyBaseDamage(20, 0)).toBe(0);
  });

  it('armor > 1 amplifies damage', () => {
    expect(calculateEnemyBaseDamage(20, 1.5)).toBe(30);
  });

  it('exact integer result (no ceil effect)', () => {
    expect(calculateEnemyBaseDamage(10, 0.5)).toBe(5);
  });
});

// ---------- isOffscreen ----------

describe('isOffscreen', () => {
  const gameHeight = 1280;
  const buffer = 50;

  it('returns true when y > gameHeight + buffer', () => {
    expect(isOffscreen(1331, gameHeight, buffer)).toBe(true);
  });

  it('returns false when y == gameHeight + buffer (not strictly greater)', () => {
    expect(isOffscreen(1330, gameHeight, buffer)).toBe(false);
  });

  it('returns false when y < gameHeight + buffer', () => {
    expect(isOffscreen(1329, gameHeight, buffer)).toBe(false);
  });

  it('returns false when inside screen', () => {
    expect(isOffscreen(500, gameHeight, buffer)).toBe(false);
  });

  it('returns false at y=0', () => {
    expect(isOffscreen(0, gameHeight, buffer)).toBe(false);
  });

  it('returns true well below screen', () => {
    expect(isOffscreen(2000, gameHeight, buffer)).toBe(true);
  });

  it('works with zero buffer', () => {
    expect(isOffscreen(1281, gameHeight, 0)).toBe(true);
    expect(isOffscreen(1280, gameHeight, 0)).toBe(false);
  });
});
