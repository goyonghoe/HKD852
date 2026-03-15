import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWeeklyChallenge,
  getChallengeLeaderboard,
  submitChallengeScore,
  getISOWeek,
  getChallengeModifierConfig,
} from '../../src/core/ChallengeMode';
import { BALANCE } from '../../src/config/balance';

/**
 * Minimal in-memory Storage mock for testing.
 */
function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('getISOWeek', () => {
  it('returns correct week for a known date', () => {
    // 2026-03-03 is a Tuesday in ISO week 10
    const d = new Date(2026, 2, 3); // March 3, 2026
    const { year, week } = getISOWeek(d);
    expect(year).toBe(2026);
    expect(week).toBe(10);
  });

  it('returns week 1 for early January', () => {
    // 2026-01-05 is a Monday — ISO week 2
    const d = new Date(2026, 0, 5);
    const { year, week } = getISOWeek(d);
    expect(year).toBe(2026);
    expect(week).toBe(2);
  });
});

describe('getWeeklyChallenge', () => {
  it('returns consistent config for the same date', () => {
    const date = new Date(2026, 2, 3);
    const c1 = getWeeklyChallenge(date);
    const c2 = getWeeklyChallenge(date);
    expect(c1).toEqual(c2);
  });

  it('returns same config for different days in same week', () => {
    // March 2 (Monday) and March 6 (Friday) are both in 2026-W10
    const monday = new Date(2026, 2, 2);
    const friday = new Date(2026, 2, 6);
    expect(getWeeklyChallenge(monday)).toEqual(getWeeklyChallenge(friday));
  });

  it('returns different config for different weeks', () => {
    const week10 = new Date(2026, 2, 3); // W10
    const week11 = new Date(2026, 2, 10); // W11
    const c1 = getWeeklyChallenge(week10);
    const c2 = getWeeklyChallenge(week11);
    expect(c1.seed).not.toBe(c2.seed);
  });

  it('has valid characterId', () => {
    const c = getWeeklyChallenge(new Date(2026, 5, 15));
    expect(['hai', 'nova', 'sol', 'mei', 'kai']).toContain(c.characterId);
  });

  it('has valid startWeapon from T1 pool', () => {
    const t1Weapons = [
      'energy_shot',
      'napalm',
      'laser_beam',
      'shuriken',
      'shotgun',
      'lightning',
      'missile',
      'bomb',
      'railgun',
      'rapid_fire',
    ];
    const c = getWeeklyChallenge(new Date(2026, 5, 15));
    expect(t1Weapons).toContain(c.startWeapon);
  });

  it('has valid modifier', () => {
    const c = getWeeklyChallenge(new Date(2026, 5, 15));
    expect(BALANCE.CHALLENGE.modifiers).toContain(c.modifier);
  });

  it('weekLabel matches expected format', () => {
    const c = getWeeklyChallenge(new Date(2026, 2, 3));
    expect(c.weekLabel).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('seed is derived from year and week', () => {
    const c = getWeeklyChallenge(new Date(2026, 2, 3)); // W10
    expect(c.seed).toBe(2026 * 100 + 10);
  });
});

describe('getChallengeLeaderboard', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('returns empty array when no data exists', () => {
    expect(getChallengeLeaderboard(storage)).toEqual([]);
  });

  it('returns saved scores sorted by kills descending', () => {
    submitChallengeScore({ kills: 10, gold: 5, timeMs: 1000, level: 2, survived: false }, storage);
    submitChallengeScore({ kills: 50, gold: 20, timeMs: 2000, level: 5, survived: true }, storage);
    submitChallengeScore({ kills: 30, gold: 10, timeMs: 1500, level: 3, survived: false }, storage);

    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(3);
    expect(lb[0].kills).toBe(50);
    expect(lb[1].kills).toBe(30);
    expect(lb[2].kills).toBe(10);
  });

  it('returns max 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      submitChallengeScore({ kills: i * 10, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(BALANCE.CHALLENGE.leaderboardMaxEntries);
  });
});

describe('submitChallengeScore', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('adds a score and returns updated leaderboard', () => {
    const lb = submitChallengeScore({ kills: 42, gold: 10, timeMs: 5000, level: 3, survived: false }, storage);
    expect(lb).toHaveLength(1);
    expect(lb[0].kills).toBe(42);
    expect(lb[0].timestamp).toBeGreaterThan(0);
  });

  it('keeps leaderboard sorted by kills descending', () => {
    submitChallengeScore({ kills: 10, gold: 1, timeMs: 100, level: 1, survived: false }, storage);
    submitChallengeScore({ kills: 50, gold: 5, timeMs: 500, level: 5, survived: true }, storage);
    const lb = submitChallengeScore({ kills: 30, gold: 3, timeMs: 300, level: 3, survived: false }, storage);
    expect(lb[0].kills).toBe(50);
    expect(lb[1].kills).toBe(30);
    expect(lb[2].kills).toBe(10);
  });

  it('trims to max entries, removing lowest scores', () => {
    for (let i = 0; i < 12; i++) {
      submitChallengeScore({ kills: i * 5, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(10);
    // The lowest should be kills=10 (i=2), not kills=0 or kills=5
    expect(lb[lb.length - 1].kills).toBeGreaterThanOrEqual(10);
  });

  it('includes timestamp on each entry', () => {
    const before = Date.now();
    submitChallengeScore({ kills: 1, gold: 0, timeMs: 100, level: 1, survived: false }, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(lb[0].timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('returns empty array with no storage', () => {
    // Pass undefined as storage — function should handle gracefully
    const lb = getChallengeLeaderboard(undefined as unknown as Storage);
    expect(lb).toEqual([]);
  });
});

// ==================================================================
// TASK-054: Challenge Modifier Balance Tests
// ==================================================================

describe('getChallengeModifierConfig', () => {
  it('modifier list matches BALANCE.CHALLENGE.modifiers', () => {
    const expected = BALANCE.CHALLENGE.modifiers;
    for (const mod of expected) {
      const config = getChallengeModifierConfig(mod);
      expect(config.modifier).toBe(mod);
    }
  });

  it('each modifier produces a valid ModifierEffect', () => {
    for (const mod of BALANCE.CHALLENGE.modifiers) {
      const config = getChallengeModifierConfig(mod);
      expect(config).toBeDefined();
      expect(config.modifier).toBe(mod);
      expect(typeof config.spawnFilter).toBe('string');
      expect(typeof config.hpMultiplier).toBe('number');
      expect(typeof config.speedMultiplier).toBe('number');
      expect(typeof config.shopDisabled).toBe('boolean');
      expect(config.hpMultiplier).toBeGreaterThan(0);
      expect(config.speedMultiplier).toBeGreaterThan(0);
    }
  });

  it('doubleSpeed sets speedMultiplier to 2', () => {
    const config = getChallengeModifierConfig('doubleSpeed');
    expect(config.speedMultiplier).toBe(2);
    expect(config.hpMultiplier).toBe(1);
    expect(config.spawnFilter).toBe('none');
    expect(config.shopDisabled).toBe(false);
  });

  it('halfHp sets hpMultiplier to 0.5', () => {
    const config = getChallengeModifierConfig('halfHp');
    expect(config.hpMultiplier).toBe(0.5);
    expect(config.speedMultiplier).toBe(1);
    expect(config.spawnFilter).toBe('none');
    expect(config.shopDisabled).toBe(false);
  });

  it('eliteOnly sets spawnFilter to eliteOnly', () => {
    const config = getChallengeModifierConfig('eliteOnly');
    expect(config.spawnFilter).toBe('eliteOnly');
    expect(config.hpMultiplier).toBe(1);
    expect(config.speedMultiplier).toBe(1);
    expect(config.shopDisabled).toBe(false);
  });

  it('bossRush sets spawnFilter to bossRush', () => {
    const config = getChallengeModifierConfig('bossRush');
    expect(config.spawnFilter).toBe('bossRush');
    expect(config.hpMultiplier).toBe(1);
    expect(config.speedMultiplier).toBe(1);
    expect(config.shopDisabled).toBe(false);
  });

  it('noShop disables shop', () => {
    const config = getChallengeModifierConfig('noShop');
    expect(config.shopDisabled).toBe(true);
    expect(config.hpMultiplier).toBe(1);
    expect(config.speedMultiplier).toBe(1);
    expect(config.spawnFilter).toBe('none');
  });

  it('unknown modifier returns safe defaults', () => {
    const config = getChallengeModifierConfig('unknownMod');
    expect(config.modifier).toBe('unknownMod');
    expect(config.hpMultiplier).toBe(1);
    expect(config.speedMultiplier).toBe(1);
    expect(config.spawnFilter).toBe('none');
    expect(config.shopDisabled).toBe(false);
  });

  it('empty string modifier returns safe defaults', () => {
    const config = getChallengeModifierConfig('');
    expect(config.hpMultiplier).toBe(1);
    expect(config.speedMultiplier).toBe(1);
  });

  it('config is deterministic (same input → same output)', () => {
    for (const mod of BALANCE.CHALLENGE.modifiers) {
      const a = getChallengeModifierConfig(mod);
      const b = getChallengeModifierConfig(mod);
      expect(a).toEqual(b);
    }
  });
});

describe('BALANCE.CHALLENGE modifier constants', () => {
  it('t1EnemyIds are all valid enemy keys', () => {
    // t1EnemyIds should be basic enemy types
    for (const id of BALANCE.CHALLENGE.t1EnemyIds) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('t1EnemyIds contains basic, fast, swarm', () => {
    expect(BALANCE.CHALLENGE.t1EnemyIds).toContain('basic');
    expect(BALANCE.CHALLENGE.t1EnemyIds).toContain('fast');
    expect(BALANCE.CHALLENGE.t1EnemyIds).toContain('swarm');
  });

  it('bossRushPool contains valid boss IDs', () => {
    for (const id of BALANCE.CHALLENGE.bossRushPool) {
      expect(id.startsWith('boss')).toBe(true);
    }
  });

  it('bossRushIntervalMs is positive', () => {
    expect(BALANCE.CHALLENGE.bossRushIntervalMs).toBeGreaterThan(0);
  });

  it('leaderboardMaxEntries is positive', () => {
    expect(BALANCE.CHALLENGE.leaderboardMaxEntries).toBeGreaterThan(0);
  });

  it('modifiers array has 5 entries', () => {
    expect(BALANCE.CHALLENGE.modifiers).toHaveLength(5);
  });
});
