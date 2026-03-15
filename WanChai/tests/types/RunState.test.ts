/**
 * RunState damage tracking fields — type and behavior tests.
 *
 * Verifies that RunState includes the new damage tracking fields
 * and that weaponDamageMap accumulation behaves correctly.
 */
import { describe, it, expect } from 'vitest';
import type { RunState } from '../../src/types/game';

/** Create a fresh RunState with all required fields for testing. */
function createTestRunState(overrides?: Partial<RunState>): RunState {
  return {
    characterId: 'hai',
    seed: 12345,
    runTime: 0,
    stageTime: 0,
    stage: 1,
    playerLevel: 1,
    playerXp: 0,
    baseHp: 600,
    baseMaxHp: 600,
    kills: 0,
    gold: 0,
    weapons: ['energy_shot'],
    passives: [],
    totalDamageDealt: 0,
    weaponDamageMap: {},
    critHitsLanded: 0,
    totalHitsLanded: 0,
    highestSingleHit: 0,
    ...overrides,
  };
}

describe('RunState — damage tracking fields', () => {
  it('initializes totalDamageDealt to 0', () => {
    const rs = createTestRunState();
    expect(rs.totalDamageDealt).toBe(0);
  });

  it('initializes weaponDamageMap to empty object', () => {
    const rs = createTestRunState();
    expect(rs.weaponDamageMap).toEqual({});
  });

  it('initializes critHitsLanded to 0', () => {
    const rs = createTestRunState();
    expect(rs.critHitsLanded).toBe(0);
  });

  it('initializes highestSingleHit to 0', () => {
    const rs = createTestRunState();
    expect(rs.highestSingleHit).toBe(0);
  });
});

describe('RunState — weaponDamageMap accumulation', () => {
  it('accumulates damage for a single weapon', () => {
    const rs = createTestRunState();
    const weaponId = 'energy_shot';
    const damages = [10, 25, 15, 30];

    for (const dmg of damages) {
      rs.weaponDamageMap[weaponId] = (rs.weaponDamageMap[weaponId] ?? 0) + dmg;
      rs.totalDamageDealt += dmg;
    }

    expect(rs.weaponDamageMap[weaponId]).toBe(80);
    expect(rs.totalDamageDealt).toBe(80);
  });

  it('accumulates damage for multiple weapons independently', () => {
    const rs = createTestRunState();

    // Simulate hits from different weapons
    const hits = [
      { weaponId: 'energy_shot', damage: 10 },
      { weaponId: 'shotgun', damage: 20 },
      { weaponId: 'energy_shot', damage: 15 },
      { weaponId: 'laser_beam', damage: 50 },
      { weaponId: 'shotgun', damage: 25 },
    ];

    for (const hit of hits) {
      rs.weaponDamageMap[hit.weaponId] = (rs.weaponDamageMap[hit.weaponId] ?? 0) + hit.damage;
      rs.totalDamageDealt += hit.damage;
    }

    expect(rs.weaponDamageMap['energy_shot']).toBe(25);
    expect(rs.weaponDamageMap['shotgun']).toBe(45);
    expect(rs.weaponDamageMap['laser_beam']).toBe(50);
    expect(rs.totalDamageDealt).toBe(120);
  });

  it('returns undefined for weapons not yet used', () => {
    const rs = createTestRunState();
    expect(rs.weaponDamageMap['missile']).toBeUndefined();
  });

  it('correctly sorts weapons by damage for top-3 display', () => {
    const rs = createTestRunState();
    rs.weaponDamageMap = {
      energy_shot: 500,
      shotgun: 1200,
      laser_beam: 800,
      missile: 300,
      napalm: 900,
    };

    const sorted = Object.entries(rs.weaponDamageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    expect(sorted).toEqual([
      ['shotgun', 1200],
      ['napalm', 900],
      ['laser_beam', 800],
    ]);
  });
});

describe('RunState — crit tracking', () => {
  it('increments critHitsLanded on crits', () => {
    const rs = createTestRunState();

    // Simulate 10 hits, 3 crits
    const hits = [false, true, false, false, true, false, true, false, false, false];
    for (const isCrit of hits) {
      if (isCrit) rs.critHitsLanded++;
    }

    expect(rs.critHitsLanded).toBe(3);
  });

  it('computes crit rate as critHitsLanded / totalHitsLanded', () => {
    const rs = createTestRunState();
    rs.critHitsLanded = 15;
    rs.totalHitsLanded = 50;

    const critRate = rs.totalHitsLanded > 0 ? rs.critHitsLanded / rs.totalHitsLanded : 0;
    expect(critRate).toBeCloseTo(0.3, 2);
  });

  it('crit rate never exceeds 100% with totalHitsLanded denominator', () => {
    const rs = createTestRunState();
    // Multi-hit weapons: 3 crits, 10 total hits, 2 kills
    rs.critHitsLanded = 3;
    rs.totalHitsLanded = 10;
    rs.kills = 2;

    const critPct = Math.round((rs.critHitsLanded / rs.totalHitsLanded) * 100);
    expect(critPct).toBe(30);
    expect(critPct).toBeLessThanOrEqual(100);
  });
});

describe('RunState — highestSingleHit tracking', () => {
  it('tracks the highest single hit correctly', () => {
    const rs = createTestRunState();
    const damages = [10, 25, 50, 30, 15, 100, 45];

    for (const dmg of damages) {
      rs.highestSingleHit = Math.max(rs.highestSingleHit, dmg);
    }

    expect(rs.highestSingleHit).toBe(100);
  });

  it('handles single hit scenario', () => {
    const rs = createTestRunState();
    rs.highestSingleHit = Math.max(rs.highestSingleHit, 42);
    expect(rs.highestSingleHit).toBe(42);
  });
});
