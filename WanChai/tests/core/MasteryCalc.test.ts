import { describe, it, expect } from 'vitest';
import {
  createMasteryStats,
  getOrCreateStats,
  getXpForLevel,
  computeMasteryLevel,
  getMasteryLevelProgress,
  calcRunMasteryXp,
  getMasteryBonus,
  applyMasteryToCooldown,
  applyMasteryToDamage,
  updateMasteryAfterRun,
  getWeaponMasteryLevel,
  getTotalMasteryXp,
  getTopMasteryWeapon,
} from '../../src/core/MasteryCalc';
import { BALANCE } from '../../src/config/balance';
import type { MasteryRecord, WeaponMasteryStats } from '../../src/types/game';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<WeaponMasteryStats> = {}): WeaponMasteryStats {
  return {
    weaponId: 'energy_shot',
    kills: 0,
    runsUsed: 0,
    totalDamage: 0,
    masteryXp: 0,
    masteryLevel: 0,
    ...overrides,
  };
}

function makeRecord(entries: Partial<WeaponMasteryStats>[] = []): MasteryRecord {
  const record: MasteryRecord = {};
  for (const e of entries) {
    const s = makeStats(e);
    record[s.weaponId] = s;
  }
  return record;
}

// ── createMasteryStats ───────────────────────────────────────────────────────

describe('createMasteryStats', () => {
  it('creates stats with correct weaponId and zero values', () => {
    const stats = createMasteryStats('shotgun');
    expect(stats.weaponId).toBe('shotgun');
    expect(stats.kills).toBe(0);
    expect(stats.runsUsed).toBe(0);
    expect(stats.totalDamage).toBe(0);
    expect(stats.masteryXp).toBe(0);
    expect(stats.masteryLevel).toBe(0);
  });
});

// ── getOrCreateStats ─────────────────────────────────────────────────────────

describe('getOrCreateStats', () => {
  it('returns existing stats if weapon is in record', () => {
    const existing = makeStats({ weaponId: 'missile', kills: 50, masteryXp: 100 });
    const record: MasteryRecord = { missile: existing };
    expect(getOrCreateStats(record, 'missile')).toBe(existing);
  });

  it('returns blank stats for weapon not in record', () => {
    const record: MasteryRecord = {};
    const stats = getOrCreateStats(record, 'bomb');
    expect(stats.weaponId).toBe('bomb');
    expect(stats.masteryXp).toBe(0);
  });

  it('does not mutate the record', () => {
    const record: MasteryRecord = {};
    getOrCreateStats(record, 'railgun');
    expect(record['railgun']).toBeUndefined();
  });
});

// ── getXpForLevel ────────────────────────────────────────────────────────────

describe('getXpForLevel', () => {
  it('level 0 requires 0 XP', () => {
    expect(getXpForLevel(0)).toBe(0);
  });

  it('level 1 matches first threshold', () => {
    expect(getXpForLevel(1)).toBe(BALANCE.MASTERY.xpThresholds[0]);
  });

  it('level 10 matches last threshold', () => {
    expect(getXpForLevel(10)).toBe(BALANCE.MASTERY.xpThresholds[9]);
  });

  it('level beyond max returns Infinity', () => {
    expect(getXpForLevel(11)).toBe(Infinity);
  });

  it('negative level returns 0', () => {
    expect(getXpForLevel(-1)).toBe(0);
  });
});

// ── computeMasteryLevel ──────────────────────────────────────────────────────

describe('computeMasteryLevel', () => {
  it('0 XP = level 0', () => {
    expect(computeMasteryLevel(0)).toBe(0);
  });

  it('XP just below threshold stays at current level', () => {
    const threshold = BALANCE.MASTERY.xpThresholds[0]; // XP for level 1
    expect(computeMasteryLevel(threshold - 1)).toBe(0);
  });

  it('XP at threshold reaches next level', () => {
    expect(computeMasteryLevel(BALANCE.MASTERY.xpThresholds[0])).toBe(1);
  });

  it('XP at max threshold = max level', () => {
    const maxXp = BALANCE.MASTERY.xpThresholds[9];
    expect(computeMasteryLevel(maxXp)).toBe(10);
  });

  it('XP above max threshold = max level (capped)', () => {
    expect(computeMasteryLevel(9_999_999)).toBe(10);
  });

  it('levels are monotonically increasing with XP', () => {
    let prevLevel = 0;
    for (let xp = 0; xp <= BALANCE.MASTERY.xpThresholds[9]; xp += 1000) {
      const level = computeMasteryLevel(xp);
      expect(level).toBeGreaterThanOrEqual(prevLevel);
      prevLevel = level;
    }
  });
});

// ── getMasteryLevelProgress ──────────────────────────────────────────────────

describe('getMasteryLevelProgress', () => {
  it('returns 0 at XP = 0 (level 0 with nothing earned)', () => {
    // At XP=0, level=0, no progress towards level 1
    expect(getMasteryLevelProgress(0)).toBe(0);
  });

  it('returns 1 at max level', () => {
    expect(getMasteryLevelProgress(BALANCE.MASTERY.xpThresholds[9])).toBe(1);
  });

  it('returns a value between 0 and 1 for partial progress', () => {
    const threshold = BALANCE.MASTERY.xpThresholds[0];
    const progress = getMasteryLevelProgress(Math.floor(threshold / 2));
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });

  it('returns 1 for XP beyond max threshold', () => {
    expect(getMasteryLevelProgress(9_999_999)).toBe(1);
  });
});

// ── calcRunMasteryXp ─────────────────────────────────────────────────────────

describe('calcRunMasteryXp', () => {
  it('0 kills, 0 damage, incomplete run = 0 XP', () => {
    expect(calcRunMasteryXp(0, 0, false)).toBe(0);
  });

  it('kill XP = kills * xpPerKill', () => {
    const xp = calcRunMasteryXp(50, 0, false);
    expect(xp).toBe(50 * BALANCE.MASTERY.xpPerKill);
  });

  it('damage XP = floor(damageDealt / 1000 * xpPer1000Damage)', () => {
    const xp = calcRunMasteryXp(0, 5000, false);
    expect(xp).toBe(Math.floor((5000 / 1000) * BALANCE.MASTERY.xpPer1000Damage));
  });

  it('run completion bonus adds xpPerRunCompleted', () => {
    const withoutCompletion = calcRunMasteryXp(10, 1000, false);
    const withCompletion = calcRunMasteryXp(10, 1000, true);
    expect(withCompletion - withoutCompletion).toBe(BALANCE.MASTERY.xpPerRunCompleted);
  });

  it('all three sources stack correctly', () => {
    const kills = 100;
    const damage = 10000;
    const expected =
      kills * BALANCE.MASTERY.xpPerKill +
      Math.floor((damage / 1000) * BALANCE.MASTERY.xpPer1000Damage) +
      BALANCE.MASTERY.xpPerRunCompleted;
    expect(calcRunMasteryXp(kills, damage, true)).toBe(expected);
  });
});

// ── getMasteryBonus ──────────────────────────────────────────────────────────

describe('getMasteryBonus', () => {
  it('level 0 = no bonus', () => {
    const bonus = getMasteryBonus(makeStats({ masteryLevel: 0 }));
    expect(bonus.damageBonus).toBe(0);
    expect(bonus.fireRateBonus).toBe(0);
  });

  it('level 5 = 5 * damagePerLevel damage bonus', () => {
    const bonus = getMasteryBonus(makeStats({ masteryLevel: 5 }));
    expect(bonus.damageBonus).toBeCloseTo(5 * BALANCE.MASTERY.damagePerLevel);
  });

  it('level 10 = max damage and fire rate bonus', () => {
    const bonus = getMasteryBonus(makeStats({ masteryLevel: 10 }));
    expect(bonus.damageBonus).toBeCloseTo(10 * BALANCE.MASTERY.damagePerLevel);
    expect(bonus.fireRateBonus).toBeCloseTo(10 * BALANCE.MASTERY.fireRatePerLevel);
  });

  it('damage bonus at max level = 20% (10 * 0.02)', () => {
    const bonus = getMasteryBonus(makeStats({ masteryLevel: 10 }));
    expect(bonus.damageBonus).toBeCloseTo(0.2);
  });

  it('fire rate bonus at max level = 10% (10 * 0.01)', () => {
    const bonus = getMasteryBonus(makeStats({ masteryLevel: 10 }));
    expect(bonus.fireRateBonus).toBeCloseTo(0.1);
  });
});

// ── applyMasteryToCooldown ───────────────────────────────────────────────────

describe('applyMasteryToCooldown', () => {
  it('level 0 = no change', () => {
    expect(applyMasteryToCooldown(1000, 0)).toBe(1000);
  });

  it('level 10 reduces cooldown by 10% (fire rate + 10%)', () => {
    const base = 1000;
    const result = applyMasteryToCooldown(base, 10);
    const expected = Math.round(base * (1 - 10 * BALANCE.MASTERY.fireRatePerLevel));
    expect(result).toBe(expected);
  });

  it('never goes below 50ms floor', () => {
    // Extreme case: very short cooldown + high mastery
    expect(applyMasteryToCooldown(55, 10)).toBeGreaterThanOrEqual(50);
    expect(applyMasteryToCooldown(10, 10)).toBe(50);
  });

  it('returns integer (rounded)', () => {
    const result = applyMasteryToCooldown(333, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ── applyMasteryToDamage ─────────────────────────────────────────────────────

describe('applyMasteryToDamage', () => {
  it('level 0 = base damage unchanged', () => {
    expect(applyMasteryToDamage(100, 0)).toBe(100);
  });

  it('level 10 = base * 1.2 (rounded up)', () => {
    expect(applyMasteryToDamage(100, 10)).toBe(120);
    expect(applyMasteryToDamage(10, 10)).toBe(12);
  });

  it('result is always a whole number', () => {
    for (let lvl = 0; lvl <= 10; lvl++) {
      const result = applyMasteryToDamage(14, lvl);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('monotonically increases with mastery level', () => {
    let prev = applyMasteryToDamage(50, 0);
    for (let lvl = 1; lvl <= 10; lvl++) {
      const curr = applyMasteryToDamage(50, lvl);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

// ── updateMasteryAfterRun ───────────────────────────────────────────────────

describe('updateMasteryAfterRun', () => {
  it('creates new entries for weapons not yet in record', () => {
    const record: MasteryRecord = {};
    const updated = updateMasteryAfterRun(record, { energy_shot: 10 }, { energy_shot: 500 }, ['energy_shot'], false);
    expect(updated['energy_shot']).toBeDefined();
    expect(updated['energy_shot'].kills).toBe(10);
    expect(updated['energy_shot'].totalDamage).toBe(500);
    expect(updated['energy_shot'].runsUsed).toBe(1);
  });

  it('accumulates kills and damage across runs', () => {
    const record = makeRecord([{ weaponId: 'shotgun', kills: 30, totalDamage: 2000, runsUsed: 1, masteryXp: 50 }]);
    const updated = updateMasteryAfterRun(record, { shotgun: 20 }, { shotgun: 1000 }, ['shotgun'], false);
    expect(updated['shotgun'].kills).toBe(50); // 30 + 20
    expect(updated['shotgun'].totalDamage).toBe(3000); // 2000 + 1000
    expect(updated['shotgun'].runsUsed).toBe(2); // 1 + 1
  });

  it('does not mutate the original record', () => {
    const record: MasteryRecord = {};
    updateMasteryAfterRun(record, { missile: 5 }, { missile: 100 }, ['missile'], false);
    expect(record['missile']).toBeUndefined();
  });

  it('does not affect weapons not in equippedWeapons', () => {
    const record: MasteryRecord = {};
    const updated = updateMasteryAfterRun(record, { bomb: 50 }, { bomb: 5000 }, ['energy_shot'], false);
    expect(updated['bomb']).toBeUndefined();
    expect(updated['energy_shot']).toBeDefined();
  });

  it('run completion adds xpPerRunCompleted bonus', () => {
    const record: MasteryRecord = {};
    const withoutCompletion = updateMasteryAfterRun(record, {}, {}, ['laser_beam'], false);
    const withCompletion = updateMasteryAfterRun(record, {}, {}, ['laser_beam'], true);
    expect(withCompletion['laser_beam'].masteryXp - withoutCompletion['laser_beam'].masteryXp).toBe(
      BALANCE.MASTERY.xpPerRunCompleted,
    );
  });

  it('mastery level updates when XP crosses threshold', () => {
    // Earn enough kills to cross level 1 threshold (100 XP)
    const killsNeeded = Math.ceil(100 / BALANCE.MASTERY.xpPerKill);
    const record: MasteryRecord = {};
    const updated = updateMasteryAfterRun(record, { energy_shot: killsNeeded }, {}, ['energy_shot'], false);
    expect(updated['energy_shot'].masteryLevel).toBeGreaterThanOrEqual(1);
  });

  it('handles multiple weapons in a single run', () => {
    const record: MasteryRecord = {};
    const updated = updateMasteryAfterRun(
      record,
      { energy_shot: 10, shotgun: 20 },
      { energy_shot: 500, shotgun: 300 },
      ['energy_shot', 'shotgun'],
      true,
    );
    expect(updated['energy_shot']).toBeDefined();
    expect(updated['shotgun']).toBeDefined();
    expect(updated['energy_shot'].kills).toBe(10);
    expect(updated['shotgun'].kills).toBe(20);
  });
});

// ── getWeaponMasteryLevel ────────────────────────────────────────────────────

describe('getWeaponMasteryLevel', () => {
  it('returns 0 for weapon not in record', () => {
    expect(getWeaponMasteryLevel({}, 'energy_shot')).toBe(0);
  });

  it('returns correct level for weapon in record', () => {
    const record = makeRecord([{ weaponId: 'bomb', masteryLevel: 5 }]);
    expect(getWeaponMasteryLevel(record, 'bomb')).toBe(5);
  });
});

// ── getTotalMasteryXp ────────────────────────────────────────────────────────

describe('getTotalMasteryXp', () => {
  it('returns 0 for empty record', () => {
    expect(getTotalMasteryXp({})).toBe(0);
  });

  it('sums masteryXp across all weapons', () => {
    const record = makeRecord([
      { weaponId: 'energy_shot', masteryXp: 100 },
      { weaponId: 'shotgun', masteryXp: 250 },
      { weaponId: 'bomb', masteryXp: 50 },
    ]);
    expect(getTotalMasteryXp(record)).toBe(400);
  });
});

// ── getTopMasteryWeapon ──────────────────────────────────────────────────────

describe('getTopMasteryWeapon', () => {
  it('returns null for empty record', () => {
    expect(getTopMasteryWeapon({})).toBeNull();
  });

  it('returns the weapon with the highest mastery level', () => {
    const record = makeRecord([
      { weaponId: 'energy_shot', masteryLevel: 3 },
      { weaponId: 'shotgun', masteryLevel: 7 },
      { weaponId: 'bomb', masteryLevel: 5 },
    ]);
    const top = getTopMasteryWeapon(record);
    expect(top?.weaponId).toBe('shotgun');
    expect(top?.masteryLevel).toBe(7);
  });

  it('breaks ties by total masteryXp', () => {
    const record = makeRecord([
      { weaponId: 'a', masteryLevel: 5, masteryXp: 1000 },
      { weaponId: 'b', masteryLevel: 5, masteryXp: 2000 },
    ]);
    const top = getTopMasteryWeapon(record);
    expect(top?.weaponId).toBe('b');
  });
});

// ── BALANCE.MASTERY config integrity ────────────────────────────────────────

describe('BALANCE.MASTERY config integrity', () => {
  it('has exactly 10 XP thresholds', () => {
    expect(BALANCE.MASTERY.xpThresholds.length).toBe(10);
  });

  it('XP thresholds are strictly increasing', () => {
    const thresholds = BALANCE.MASTERY.xpThresholds;
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  it('maxLevel is 10', () => {
    expect(BALANCE.MASTERY.maxLevel).toBe(10);
  });

  it('damagePerLevel and fireRatePerLevel are positive', () => {
    expect(BALANCE.MASTERY.damagePerLevel).toBeGreaterThan(0);
    expect(BALANCE.MASTERY.fireRatePerLevel).toBeGreaterThan(0);
  });

  it('xpPerKill, xpPer1000Damage, xpPerRunCompleted are positive', () => {
    expect(BALANCE.MASTERY.xpPerKill).toBeGreaterThan(0);
    expect(BALANCE.MASTERY.xpPer1000Damage).toBeGreaterThan(0);
    expect(BALANCE.MASTERY.xpPerRunCompleted).toBeGreaterThan(0);
  });
});
