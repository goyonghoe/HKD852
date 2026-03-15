import { describe, it, expect } from 'vitest';
import {
  calculateLevelMultiplier,
  calculateProjectileCount,
  calculateSpreadAngle,
  calculateFanAngles,
  calculatePiercing,
  calculateAoeRadius,
  calculateHomingParams,
  calculateHomingSpreadAngles,
  calculateChainCount,
  calculateTrainPositions,
} from '../../src/core/WeaponFireCalc';

// --- calculateLevelMultiplier ---
describe('calculateLevelMultiplier', () => {
  it('level 1 returns 1.0 (base)', () => {
    expect(calculateLevelMultiplier(1)).toBeCloseTo(1.0);
  });

  it('level 2 returns 1.2', () => {
    expect(calculateLevelMultiplier(2)).toBeCloseTo(1.2);
  });

  it('level 5 returns 1.8', () => {
    expect(calculateLevelMultiplier(5)).toBeCloseTo(1.8);
  });

  it('level 10 returns 2.8', () => {
    expect(calculateLevelMultiplier(10)).toBeCloseTo(2.8);
  });

  it('level 0 is clamped to level 1 (returns 1.0)', () => {
    expect(calculateLevelMultiplier(0)).toBe(1.0);
  });
});

// --- calculateProjectileCount ---
describe('calculateProjectileCount', () => {
  describe('energy_shot: 1 + floor(level/2)', () => {
    it('level 1 → 1', () => {
      expect(calculateProjectileCount('energy_shot', 1, 1)).toBe(1);
    });
    it('level 2 → 2', () => {
      expect(calculateProjectileCount('energy_shot', 2, 1)).toBe(2);
    });
    it('level 3 → 2', () => {
      expect(calculateProjectileCount('energy_shot', 3, 1)).toBe(2);
    });
    it('level 4 → 3', () => {
      expect(calculateProjectileCount('energy_shot', 4, 1)).toBe(3);
    });
    it('level 5 → 3', () => {
      expect(calculateProjectileCount('energy_shot', 5, 1)).toBe(3);
    });
  });

  describe('shotgun: baseCount + floor((level-1)/2)*2', () => {
    it('level 1, base 3 → 3', () => {
      expect(calculateProjectileCount('shotgun', 1, 3)).toBe(3);
    });
    it('level 2, base 3 → 3', () => {
      expect(calculateProjectileCount('shotgun', 2, 3)).toBe(3);
    });
    it('level 3, base 3 → 5', () => {
      expect(calculateProjectileCount('shotgun', 3, 3)).toBe(5);
    });
    it('level 4, base 3 → 5', () => {
      expect(calculateProjectileCount('shotgun', 4, 3)).toBe(5);
    });
    it('level 5, base 3 → 7', () => {
      expect(calculateProjectileCount('shotgun', 5, 3)).toBe(7);
    });
  });

  describe('default: baseCount + floor((level-1)*0.5)', () => {
    it('level 1, base 1 → 1', () => {
      expect(calculateProjectileCount('shuriken', 1, 1)).toBe(1);
    });
    it('level 2, base 1 → 1', () => {
      expect(calculateProjectileCount('shuriken', 2, 1)).toBe(1);
    });
    it('level 3, base 1 → 2', () => {
      expect(calculateProjectileCount('shuriken', 3, 1)).toBe(2);
    });
    it('level 4, base 1 → 2', () => {
      expect(calculateProjectileCount('shuriken', 4, 1)).toBe(2);
    });
    it('level 5, base 1 → 3', () => {
      expect(calculateProjectileCount('shuriken', 5, 1)).toBe(3);
    });
    it('level 1, base 2 → 2', () => {
      expect(calculateProjectileCount('rapid_fire', 1, 2)).toBe(2);
    });
  });

  it('level 0 is clamped to level 1', () => {
    expect(calculateProjectileCount('energy_shot', 0, 1)).toBe(calculateProjectileCount('energy_shot', 1, 1));
    expect(calculateProjectileCount('shotgun', 0, 3)).toBe(calculateProjectileCount('shotgun', 1, 3));
    expect(calculateProjectileCount('default', 0, 1)).toBe(calculateProjectileCount('default', 1, 1));
  });
});

// --- calculateSpreadAngle ---
describe('calculateSpreadAngle', () => {
  it('count=1 returns 0 regardless of weaponId', () => {
    expect(calculateSpreadAngle('shotgun', 1)).toBe(0);
    expect(calculateSpreadAngle('shuriken', 1)).toBe(0);
  });

  describe('shotgun', () => {
    it('count=3 → 0.12', () => {
      expect(calculateSpreadAngle('shotgun', 3)).toBeCloseTo(0.12);
    });
    it('count=5 → 0.18', () => {
      expect(calculateSpreadAngle('shotgun', 5)).toBeCloseTo(0.18);
    });
    it('count=7 → 0.24', () => {
      expect(calculateSpreadAngle('shotgun', 7)).toBeCloseTo(0.24);
    });
  });

  describe('default', () => {
    it('count=2 → 0.15', () => {
      expect(calculateSpreadAngle('shuriken', 2)).toBeCloseTo(0.15);
    });
    it('count=4 → 0.15', () => {
      expect(calculateSpreadAngle('rapid_fire', 4)).toBeCloseTo(0.15);
    });
  });
});

// --- calculateFanAngles ---
describe('calculateFanAngles', () => {
  it('count=1 returns [baseAngle]', () => {
    const angles = calculateFanAngles(1.5, 1, 0.15);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(1.5);
  });

  it('3 bullets symmetric around baseAngle', () => {
    const base = 0;
    const spread = 0.12;
    const angles = calculateFanAngles(base, 3, spread);
    expect(angles).toHaveLength(3);
    expect(angles[0]).toBeCloseTo(-0.06); // base - spread/2
    expect(angles[1]).toBeCloseTo(0); // center
    expect(angles[2]).toBeCloseTo(0.06); // base + spread/2
  });

  it('5 bullets evenly spaced', () => {
    const base = Math.PI / 4;
    const spread = 0.15;
    const angles = calculateFanAngles(base, 5, spread);
    expect(angles).toHaveLength(5);
    // First and last should be symmetric around base
    expect(angles[0]).toBeCloseTo(base - spread / 2);
    expect(angles[4]).toBeCloseTo(base + spread / 2);
    // Center should be base
    expect(angles[2]).toBeCloseTo(base);
  });

  it('2 bullets: first and last at edges', () => {
    const base = 0;
    const spread = 0.15;
    const angles = calculateFanAngles(base, 2, spread);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(-0.075);
    expect(angles[1]).toBeCloseTo(0.075);
  });
});

// --- calculatePiercing ---
describe('calculatePiercing', () => {
  it('level 1, base 0 → 0', () => {
    expect(calculatePiercing(0, 1)).toBe(0);
  });
  it('level 3, base 0 → 1', () => {
    expect(calculatePiercing(0, 3)).toBe(1);
  });
  it('level 6, base 0 → 2', () => {
    expect(calculatePiercing(0, 6)).toBe(2);
  });
  it('level 9, base 0 → 3', () => {
    expect(calculatePiercing(0, 9)).toBe(3);
  });
  it('level 2, base 0 → 0', () => {
    expect(calculatePiercing(0, 2)).toBe(0);
  });
  it('level 3, base 2 → 3', () => {
    expect(calculatePiercing(2, 3)).toBe(3);
  });
  it('level 6, base 1 → 3', () => {
    expect(calculatePiercing(1, 6)).toBe(3);
  });
});

// --- calculateAoeRadius ---
describe('calculateAoeRadius', () => {
  it('level 1, base 50 → 60', () => {
    expect(calculateAoeRadius(50, 1)).toBe(60);
  });
  it('level 5, base 50 → 100', () => {
    expect(calculateAoeRadius(50, 5)).toBe(100);
  });
  it('level 1, base 100 → 110', () => {
    expect(calculateAoeRadius(100, 1)).toBe(110);
  });
  it('level 3, base 100 → 130', () => {
    expect(calculateAoeRadius(100, 3)).toBe(130);
  });
  it('level 0, base 50 → 50', () => {
    expect(calculateAoeRadius(50, 0)).toBe(50);
  });
});

// --- calculateHomingParams ---
describe('calculateHomingParams', () => {
  const baseTurnRate = 4;
  const turnRatePerLevel = 0.5;

  it('level 1', () => {
    const r = calculateHomingParams(1, 200, 1, baseTurnRate, turnRatePerLevel);
    expect(r.speed).toBe(240);
    expect(r.turnRate).toBeCloseTo(4.5);
    expect(r.count).toBe(1);
  });

  it('level 2', () => {
    const r = calculateHomingParams(2, 200, 1, baseTurnRate, turnRatePerLevel);
    expect(r.speed).toBe(280);
    expect(r.turnRate).toBeCloseTo(5.0);
    expect(r.count).toBe(1);
  });

  it('level 3', () => {
    const r = calculateHomingParams(3, 200, 1, baseTurnRate, turnRatePerLevel);
    expect(r.speed).toBe(320);
    expect(r.turnRate).toBeCloseTo(5.5);
    expect(r.count).toBe(2);
  });

  it('level 4', () => {
    const r = calculateHomingParams(4, 200, 1, baseTurnRate, turnRatePerLevel);
    expect(r.speed).toBe(360);
    expect(r.turnRate).toBeCloseTo(6.0);
    expect(r.count).toBe(2);
  });

  it('level 5', () => {
    const r = calculateHomingParams(5, 200, 1, baseTurnRate, turnRatePerLevel);
    expect(r.speed).toBe(400);
    expect(r.turnRate).toBeCloseTo(6.5);
    expect(r.count).toBe(3);
  });
});

// --- calculateHomingSpreadAngles ---
describe('calculateHomingSpreadAngles', () => {
  it('count=1 returns [baseAngle]', () => {
    const angles = calculateHomingSpreadAngles(1.0, 1);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(1.0);
  });

  it('3 missiles: spread across [-0.3, +0.3]', () => {
    const base = 0;
    const angles = calculateHomingSpreadAngles(base, 3);
    expect(angles).toHaveLength(3);
    expect(angles[0]).toBeCloseTo(-0.3);
    expect(angles[1]).toBeCloseTo(0);
    expect(angles[2]).toBeCloseTo(0.3);
  });

  it('5 missiles: evenly distributed', () => {
    const base = Math.PI / 2;
    const angles = calculateHomingSpreadAngles(base, 5);
    expect(angles).toHaveLength(5);
    expect(angles[0]).toBeCloseTo(base - 0.3);
    expect(angles[2]).toBeCloseTo(base);
    expect(angles[4]).toBeCloseTo(base + 0.3);
  });

  it('2 missiles: edges of range', () => {
    const base = 0;
    const angles = calculateHomingSpreadAngles(base, 2);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(-0.3);
    expect(angles[1]).toBeCloseTo(0.3);
  });
});

// --- calculateChainCount ---
describe('calculateChainCount', () => {
  it('level 1, base 3 → 3', () => {
    expect(calculateChainCount(3, 1)).toBe(3);
  });
  it('level 2, base 3 → 3', () => {
    expect(calculateChainCount(3, 2)).toBe(3);
  });
  it('level 3, base 3 → 4', () => {
    expect(calculateChainCount(3, 3)).toBe(4);
  });
  it('level 4, base 3 → 4', () => {
    expect(calculateChainCount(3, 4)).toBe(4);
  });
  it('level 5, base 3 → 5', () => {
    expect(calculateChainCount(3, 5)).toBe(5);
  });
  it('level 1, base 1 → 1', () => {
    expect(calculateChainCount(1, 1)).toBe(1);
  });
});

// --- calculateTrainPositions ---
describe('calculateTrainPositions', () => {
  it('angle=0: positions trail behind horizontally', () => {
    const positions = calculateTrainPositions(100, 200, 0, 3, 18);
    expect(positions).toHaveLength(3);
    // i=0: at player
    expect(positions[0].x).toBeCloseTo(100);
    expect(positions[0].y).toBeCloseTo(200);
    // i=1: 18px behind (cos(0)=1, so x - 18)
    expect(positions[1].x).toBeCloseTo(82);
    expect(positions[1].y).toBeCloseTo(200);
    // i=2: 36px behind
    expect(positions[2].x).toBeCloseTo(64);
    expect(positions[2].y).toBeCloseTo(200);
  });

  it('angle=PI/2: positions trail behind vertically', () => {
    const positions = calculateTrainPositions(100, 200, Math.PI / 2, 3, 18);
    expect(positions).toHaveLength(3);
    // cos(PI/2)≈0, sin(PI/2)=1
    expect(positions[0].x).toBeCloseTo(100);
    expect(positions[0].y).toBeCloseTo(200);
    expect(positions[1].x).toBeCloseTo(100);
    expect(positions[1].y).toBeCloseTo(182);
    expect(positions[2].x).toBeCloseTo(100);
    expect(positions[2].y).toBeCloseTo(164);
  });

  it('count=1: single position at player', () => {
    const positions = calculateTrainPositions(50, 60, 0.5, 1, 18);
    expect(positions).toHaveLength(1);
    expect(positions[0].x).toBeCloseTo(50);
    expect(positions[0].y).toBeCloseTo(60);
  });

  it('count=0: empty array', () => {
    const positions = calculateTrainPositions(50, 60, 0, 0, 18);
    expect(positions).toHaveLength(0);
  });

  it('angle=PI: trail behind to the right', () => {
    const positions = calculateTrainPositions(100, 200, Math.PI, 2, 20);
    expect(positions).toHaveLength(2);
    expect(positions[0].x).toBeCloseTo(100);
    expect(positions[0].y).toBeCloseTo(200);
    // cos(PI)=-1, so x - (-1)*20 = x + 20
    expect(positions[1].x).toBeCloseTo(120);
    expect(positions[1].y).toBeCloseTo(200);
  });
});
