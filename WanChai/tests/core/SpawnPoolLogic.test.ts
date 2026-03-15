import { describe, it, expect } from 'vitest';
import {
  filterEnemyPool,
  validatePool,
  calculateBossRushSpawn,
  buildEliteFilteredPool,
} from '../../src/core/SpawnPoolLogic';

const T1_ENEMIES = ['basic', 'fast', 'swarm'] as const;
const ALL_ENEMIES = [
  'basic',
  'fast',
  'swarm',
  'tank',
  'special',
  'splitter',
  'chaser',
  'shooter',
  'sniper_enemy',
  'guardian',
  'teleporter',
  'boss',
  'boss_circle',
  'boss_burst',
] as const;
const STAGE_POOL = ['basic', 'fast', 'swarm', 'tank', 'special'] as const;
const BOSS_POOL = ['boss', 'boss_circle', 'boss_burst'] as const;

// ==================== Elite-Only Filtering Tests ====================
describe('filterEnemyPool', () => {
  it('returns full pool copy when modifier is empty string', () => {
    const result = filterEnemyPool(STAGE_POOL, '', T1_ENEMIES);
    expect(result).toEqual([...STAGE_POOL]);
  });

  it('returns full pool copy when modifier is not eliteOnly', () => {
    const result = filterEnemyPool(STAGE_POOL, 'bossRush', T1_ENEMIES);
    expect(result).toEqual([...STAGE_POOL]);
  });

  it('removes T1 enemies when modifier is eliteOnly', () => {
    const result = filterEnemyPool(STAGE_POOL, 'eliteOnly', T1_ENEMIES);
    expect(result).toEqual(['tank', 'special']);
    expect(result).not.toContain('basic');
    expect(result).not.toContain('fast');
    expect(result).not.toContain('swarm');
  });

  it('returns empty array when all pool entries are T1', () => {
    const result = filterEnemyPool(['basic', 'fast', 'swarm'], 'eliteOnly', T1_ENEMIES);
    expect(result).toEqual([]);
  });

  it('preserves order of non-T1 enemies', () => {
    const pool = ['tank', 'basic', 'special', 'fast', 'chaser'];
    const result = filterEnemyPool(pool, 'eliteOnly', T1_ENEMIES);
    expect(result).toEqual(['tank', 'special', 'chaser']);
  });

  it('does not modify original pool array', () => {
    const pool = ['basic', 'fast', 'tank'];
    const original = [...pool];
    filterEnemyPool(pool, 'eliteOnly', T1_ENEMIES);
    expect(pool).toEqual(original);
  });

  it('handles empty pool', () => {
    const result = filterEnemyPool([], 'eliteOnly', T1_ENEMIES);
    expect(result).toEqual([]);
  });

  it('handles empty T1 list (nothing filtered)', () => {
    const result = filterEnemyPool(STAGE_POOL, 'eliteOnly', []);
    expect(result).toEqual([...STAGE_POOL]);
  });
});

// ==================== Pool Validation / Fallback Tests ====================
describe('validatePool', () => {
  it('returns primary pool when non-empty', () => {
    const result = validatePool(['tank', 'special'], ['basic']);
    expect(result).toEqual(['tank', 'special']);
  });

  it('returns fallback when primary is empty', () => {
    const result = validatePool([], ['basic', 'fast']);
    expect(result).toEqual(['basic', 'fast']);
  });

  it('returns empty array when both pools are empty', () => {
    const result = validatePool([], []);
    expect(result).toEqual([]);
  });

  it('returns a copy, not a reference', () => {
    const pool = ['tank'];
    const result = validatePool(pool, []);
    result.push('extra');
    expect(pool).toHaveLength(1); // original unchanged
  });

  it('single-element pool is valid', () => {
    const result = validatePool(['solo'], ['fallback']);
    expect(result).toEqual(['solo']);
  });
});

// ==================== Boss Rush Cycle / Wrap-around Tests ====================
describe('calculateBossRushSpawn', () => {
  it('does not spawn when timer < interval', () => {
    const result = calculateBossRushSpawn(10000, 15000, BOSS_POOL, 0);
    expect(result.shouldSpawn).toBe(false);
    expect(result.newTimer).toBe(10000);
    expect(result.newIndex).toBe(0);
  });

  it('spawns first boss at index 0', () => {
    const result = calculateBossRushSpawn(15000, 15000, BOSS_POOL, 0);
    expect(result.shouldSpawn).toBe(true);
    expect(result.bossId).toBe('boss');
    expect(result.newIndex).toBe(1);
    expect(result.newTimer).toBe(0);
  });

  it('cycles through pool in order', () => {
    const r1 = calculateBossRushSpawn(15000, 15000, BOSS_POOL, 0);
    expect(r1.bossId).toBe('boss');

    const r2 = calculateBossRushSpawn(15000, 15000, BOSS_POOL, r1.newIndex);
    expect(r2.bossId).toBe('boss_circle');

    const r3 = calculateBossRushSpawn(15000, 15000, BOSS_POOL, r2.newIndex);
    expect(r3.bossId).toBe('boss_burst');
  });

  it('wraps around to start after exhausting pool', () => {
    // Index 3 with pool length 3 → 3 % 3 = 0 → first boss again
    const result = calculateBossRushSpawn(15000, 15000, BOSS_POOL, 3);
    expect(result.shouldSpawn).toBe(true);
    expect(result.bossId).toBe('boss');
    expect(result.newIndex).toBe(4);
  });

  it('handles large index wrap-around correctly', () => {
    const result = calculateBossRushSpawn(15000, 15000, BOSS_POOL, 100);
    expect(result.shouldSpawn).toBe(true);
    // 100 % 3 = 1 → 'boss_circle'
    expect(result.bossId).toBe('boss_circle');
  });

  it('preserves leftover time in newTimer', () => {
    const result = calculateBossRushSpawn(17000, 15000, BOSS_POOL, 0);
    expect(result.shouldSpawn).toBe(true);
    expect(result.newTimer).toBe(2000); // 17000 - 15000
  });

  it('handles empty boss pool gracefully', () => {
    const result = calculateBossRushSpawn(15000, 15000, [], 0);
    expect(result.shouldSpawn).toBe(false);
    expect(result.bossId).toBe('');
  });
});

// ==================== buildEliteFilteredPool (Combined Operation) Tests ====================
describe('buildEliteFilteredPool', () => {
  it('returns full pool when modifier is not eliteOnly', () => {
    const result = buildEliteFilteredPool(STAGE_POOL, '', T1_ENEMIES, [...ALL_ENEMIES]);
    expect(result).toEqual([...STAGE_POOL]);
  });

  it('filters T1 when eliteOnly with non-empty result', () => {
    const result = buildEliteFilteredPool(STAGE_POOL, 'eliteOnly', T1_ENEMIES, [...ALL_ENEMIES]);
    expect(result).toEqual(['tank', 'special']);
  });

  it('falls back to non-boss non-T1 pool when filtering leaves nothing', () => {
    const allT1Pool = ['basic', 'fast', 'swarm'];
    const result = buildEliteFilteredPool(allT1Pool, 'eliteOnly', T1_ENEMIES, [...ALL_ENEMIES]);
    // Should contain all non-boss, non-T1 enemies
    expect(result).not.toContain('basic');
    expect(result).not.toContain('fast');
    expect(result).not.toContain('swarm');
    expect(result).not.toContain('boss');
    expect(result).not.toContain('boss_circle');
    expect(result).not.toContain('boss_burst');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('tank');
    expect(result).toContain('special');
  });

  it('fallback excludes bosses', () => {
    const allT1Pool = ['basic', 'fast'];
    const result = buildEliteFilteredPool(allT1Pool, 'eliteOnly', T1_ENEMIES, [...ALL_ENEMIES]);
    for (const id of result) {
      expect(id.startsWith('boss')).toBe(false);
    }
  });
});
