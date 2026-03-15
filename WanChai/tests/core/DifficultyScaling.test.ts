import { describe, it, expect } from 'vitest';
import {
  calculateStageDifficultyMultipliers,
  applyPassiveStatEffect,
  calculateCompositeCritChance,
  calculateStageClearHeal,
  type DifficultyConfig,
  type BaseStats,
  type PassiveStatConfig,
} from '../../src/core/DifficultyScaling';

// Balance values from BALANCE.STAGE.difficultyPerStage
const DIFF_CONFIG: DifficultyConfig = {
  hpMult: 1.35,
  speedMult: 1.1,
  damageMult: 1.15,
};

// ========================================
// calculateStageDifficultyMultipliers — stage 1-20 curve
// ========================================
describe('calculateStageDifficultyMultipliers', () => {
  it('stage 1 returns all 1.0', () => {
    const m = calculateStageDifficultyMultipliers(1, DIFF_CONFIG);
    expect(m.hpMult).toBe(1);
    expect(m.speedMult).toBe(1);
    expect(m.damageMult).toBe(1);
  });

  it('stage 2 returns base multipliers', () => {
    const m = calculateStageDifficultyMultipliers(2, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35);
    expect(m.speedMult).toBeCloseTo(1.1);
    expect(m.damageMult).toBeCloseTo(1.15);
  });

  it('stage 3 returns squared multipliers', () => {
    const m = calculateStageDifficultyMultipliers(3, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 2);
    expect(m.speedMult).toBeCloseTo(1.1 ** 2);
    expect(m.damageMult).toBeCloseTo(1.15 ** 2);
  });

  it('stage 5 exponential growth', () => {
    const m = calculateStageDifficultyMultipliers(5, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 4);
    expect(m.speedMult).toBeCloseTo(1.1 ** 4);
    expect(m.damageMult).toBeCloseTo(1.15 ** 4);
  });

  it('stage 8 mid-game scaling', () => {
    const m = calculateStageDifficultyMultipliers(8, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 7);
    expect(m.speedMult).toBeCloseTo(1.1 ** 7);
    expect(m.damageMult).toBeCloseTo(1.15 ** 7);
  });

  it('stage 10 scaling', () => {
    const m = calculateStageDifficultyMultipliers(10, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 9);
  });

  it('stage 16 (max stage) late game', () => {
    const m = calculateStageDifficultyMultipliers(16, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 15);
    expect(m.speedMult).toBeCloseTo(1.1 ** 15);
    expect(m.damageMult).toBeCloseTo(1.15 ** 15);
  });

  it('stage 20 beyond max', () => {
    const m = calculateStageDifficultyMultipliers(20, DIFF_CONFIG);
    expect(m.hpMult).toBeCloseTo(1.35 ** 19);
  });

  it('HP multiplier grows faster than speed and damage', () => {
    const m = calculateStageDifficultyMultipliers(10, DIFF_CONFIG);
    expect(m.hpMult).toBeGreaterThan(m.damageMult);
    expect(m.damageMult).toBeGreaterThan(m.speedMult);
  });

  it('all multipliers are monotonically increasing with stage', () => {
    let prev = calculateStageDifficultyMultipliers(1, DIFF_CONFIG);
    for (let stage = 2; stage <= 16; stage++) {
      const cur = calculateStageDifficultyMultipliers(stage, DIFF_CONFIG);
      expect(cur.hpMult).toBeGreaterThan(prev.hpMult);
      expect(cur.speedMult).toBeGreaterThan(prev.speedMult);
      expect(cur.damageMult).toBeGreaterThan(prev.damageMult);
      prev = cur;
    }
  });
});

// ========================================
// applyPassiveStatEffect — each passive type
// ========================================

const BASE_STATS: BaseStats = {
  attackSpeedMultiplier: 1.0,
  damageMultiplier: 1.0,
  baseArmorMultiplier: 1.0,
  critChance: 0.0,
  critDamage: 2.0,
};

describe('applyPassiveStatEffect — attack_speed', () => {
  const config: PassiveStatConfig = { valuePerLevel: 0.1 };

  it('level 1: 1 + 0.10 * 1 = 1.10', () => {
    const s = applyPassiveStatEffect('attack_speed', 1, BASE_STATS, config);
    expect(s.attackSpeedMultiplier).toBeCloseTo(1.1);
  });

  it('level 3: 1 + 0.10 * 3 = 1.30', () => {
    const s = applyPassiveStatEffect('attack_speed', 3, BASE_STATS, config);
    expect(s.attackSpeedMultiplier).toBeCloseTo(1.3);
  });

  it('level 5 (max): 1 + 0.10 * 5 = 1.50', () => {
    const s = applyPassiveStatEffect('attack_speed', 5, BASE_STATS, config);
    expect(s.attackSpeedMultiplier).toBeCloseTo(1.5);
  });

  it('does not modify other stats', () => {
    const s = applyPassiveStatEffect('attack_speed', 3, BASE_STATS, config);
    expect(s.damageMultiplier).toBe(1.0);
    expect(s.critChance).toBe(0.0);
  });
});

describe('applyPassiveStatEffect — damage', () => {
  const config: PassiveStatConfig = { valuePerLevel: 0.15 };

  it('level 1 with no meta bonus', () => {
    const s = applyPassiveStatEffect('damage', 1, BASE_STATS, config, 0);
    expect(s.damageMultiplier).toBeCloseTo(1.15);
  });

  it('level 3 with meta bonus 0.20', () => {
    const s = applyPassiveStatEffect('damage', 3, BASE_STATS, config, 0.2);
    // 1 + 0.20 + 0.15 * 3 = 1.65
    expect(s.damageMultiplier).toBeCloseTo(1.65);
  });

  it('level 5 with meta bonus 0.50', () => {
    const s = applyPassiveStatEffect('damage', 5, BASE_STATS, config, 0.5);
    // 1 + 0.50 + 0.15 * 5 = 2.25
    expect(s.damageMultiplier).toBeCloseTo(2.25);
  });
});

describe('applyPassiveStatEffect — base_armor', () => {
  const config: PassiveStatConfig = { valuePerLevel: 0.1 };

  it('level 1 with no shop armor', () => {
    const s = applyPassiveStatEffect('base_armor', 1, BASE_STATS, config, 0, 0, 0, 1.0);
    // max(0.1, 1 - 0.10 * 1) * 1.0 = 0.90
    expect(s.baseArmorMultiplier).toBeCloseTo(0.9);
  });

  it('level 3 with shop armor 0.75', () => {
    const s = applyPassiveStatEffect('base_armor', 3, BASE_STATS, config, 0, 0, 0, 0.75);
    // max(0.1, 1 - 0.30) * 0.75 = 0.70 * 0.75 = 0.525
    expect(s.baseArmorMultiplier).toBeCloseTo(0.525);
  });

  it('clamps at minimum 0.3 for very high levels', () => {
    const s = applyPassiveStatEffect('base_armor', 15, BASE_STATS, config, 0, 0, 0, 1.0);
    // max(0.3, 1 - 1.5) = 0.3
    expect(s.baseArmorMultiplier).toBeCloseTo(0.3);
  });
});

describe('applyPassiveStatEffect — crit_chance', () => {
  const config: PassiveStatConfig = { valuePerLevel: 0.05 };

  it('level 1 with no bonuses', () => {
    const s = applyPassiveStatEffect('crit_chance', 1, BASE_STATS, config, 0, 0, 0);
    expect(s.critChance).toBeCloseTo(0.05);
  });

  it('level 3 with meta 0.09 and weather 0.15', () => {
    const s = applyPassiveStatEffect('crit_chance', 3, BASE_STATS, config, 0, 0.09, 0.15);
    // 0.09 + 0.05 * 3 + 0.15 = 0.39
    expect(s.critChance).toBeCloseTo(0.39);
  });
});

describe('applyPassiveStatEffect — crit_damage', () => {
  const config: PassiveStatConfig = { valuePerLevel: 0.25 };

  it('level 1 with default combat crit multiplier', () => {
    const s = applyPassiveStatEffect('crit_damage', 1, BASE_STATS, config, 0, 0, 0, 1, 2.0);
    // 2.0 + 0.25 * 1 = 2.25
    expect(s.critDamage).toBeCloseTo(2.25);
  });

  it('level 3', () => {
    const s = applyPassiveStatEffect('crit_damage', 3, BASE_STATS, config, 0, 0, 0, 1, 2.0);
    // 2.0 + 0.25 * 3 = 2.75
    expect(s.critDamage).toBeCloseTo(2.75);
  });
});

describe('applyPassiveStatEffect — unknown passive', () => {
  it('returns stats unchanged for unknown passive ID', () => {
    const s = applyPassiveStatEffect('burn', 3, BASE_STATS, { valuePerLevel: 5 });
    expect(s).toEqual(BASE_STATS);
  });

  it('does not mutate input stats', () => {
    const original = { ...BASE_STATS };
    applyPassiveStatEffect('attack_speed', 5, BASE_STATS, { valuePerLevel: 0.1 });
    expect(BASE_STATS).toEqual(original);
  });
});

// ========================================
// calculateCompositeCritChance
// ========================================
describe('calculateCompositeCritChance', () => {
  it('all zero returns 0', () => {
    expect(calculateCompositeCritChance(0, 0, 0.05, 0)).toBe(0);
  });

  it('meta only', () => {
    expect(calculateCompositeCritChance(0.09, 0, 0.05, 0)).toBeCloseTo(0.09);
  });

  it('meta + passive level 3', () => {
    // 0.09 + 0.05 * 3 = 0.24
    expect(calculateCompositeCritChance(0.09, 3, 0.05, 0)).toBeCloseTo(0.24);
  });

  it('meta + passive + weather', () => {
    // 0.09 + 0.05 * 3 + 0.15 = 0.39
    expect(calculateCompositeCritChance(0.09, 3, 0.05, 0.15)).toBeCloseTo(0.39);
  });

  it('weather only', () => {
    expect(calculateCompositeCritChance(0, 0, 0.05, 0.15)).toBeCloseTo(0.15);
  });

  it('passive level 0 contributes nothing', () => {
    expect(calculateCompositeCritChance(0.1, 0, 0.05, 0.05)).toBeCloseTo(0.15);
  });
});

// ========================================
// Edge cases
// ========================================
describe('calculateStageDifficultyMultipliers — edge cases', () => {
  it('stage 0 returns all 1.0 (below minimum)', () => {
    const m = calculateStageDifficultyMultipliers(0, DIFF_CONFIG);
    expect(m.hpMult).toBe(1);
    expect(m.speedMult).toBe(1);
    expect(m.damageMult).toBe(1);
  });

  it('negative stage returns all 1.0', () => {
    const m = calculateStageDifficultyMultipliers(-5, DIFF_CONFIG);
    expect(m.hpMult).toBe(1);
    expect(m.speedMult).toBe(1);
    expect(m.damageMult).toBe(1);
  });

  it('very high stage does not return Infinity with reasonable config', () => {
    const m = calculateStageDifficultyMultipliers(100, DIFF_CONFIG);
    expect(Number.isFinite(m.hpMult)).toBe(true);
    expect(Number.isFinite(m.speedMult)).toBe(true);
    expect(Number.isFinite(m.damageMult)).toBe(true);
  });

  it('multiplier 1.0 config keeps everything at 1', () => {
    const flat: DifficultyConfig = { hpMult: 1.0, speedMult: 1.0, damageMult: 1.0 };
    const m = calculateStageDifficultyMultipliers(10, flat);
    expect(m.hpMult).toBe(1);
    expect(m.speedMult).toBe(1);
    expect(m.damageMult).toBe(1);
  });
});

// ========================================
// calculateStageClearHeal
// ========================================
describe('calculateStageClearHeal', () => {
  it('heals 20% of 600 max HP', () => {
    expect(calculateStageClearHeal(400, 600, 0.2)).toBe(520);
  });

  it('clamps to max HP', () => {
    expect(calculateStageClearHeal(580, 600, 0.2)).toBe(600);
  });

  it('heals from 0', () => {
    expect(calculateStageClearHeal(0, 600, 0.2)).toBe(120);
  });

  it('already at max HP stays at max', () => {
    expect(calculateStageClearHeal(600, 600, 0.2)).toBe(600);
  });
});
