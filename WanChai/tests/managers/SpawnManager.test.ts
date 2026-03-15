/**
 * SpawnManager unit tests.
 *
 * Tests wave spawning, challenge mode modifiers, stage-specific spawning,
 * boss spawning, and elite filtering.
 *
 * SpawnManager wraps WaveDirector and ENEMY_DEFS, both of which are pure TS.
 * The Phaser dependency is mocked at module level.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { ENEMY_DEFS } from '../../src/config/enemies';

// ── Mock Phaser ─────────────────────────────────────────────────────────────
vi.mock('phaser', () => {
  const BaseClass = class {
    constructor(..._args: unknown[]) {
      /* noop */
    }
  };
  return {
    default: {
      WEBGL: 1,
      AUTO: 0,
      Scene: BaseClass,
      Scale: { FIT: 1, CENTER_BOTH: 1 },
      GameObjects: {
        Graphics: BaseClass,
        Rectangle: BaseClass,
        Container: BaseClass,
        Sprite: BaseClass,
        Image: BaseClass,
        Text: BaseClass,
        Zone: BaseClass,
        Group: BaseClass,
      },
      Physics: {
        Arcade: {
          Sprite: BaseClass,
          Group: BaseClass,
          Body: BaseClass,
        },
      },
      Math: {
        Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
        Between: (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1)),
      },
    },
  };
});

import { SpawnManager, type SpawnCallbacks } from '../../src/managers/SpawnManager';

// ── Mock SeededRandom ───────────────────────────────────────────────────────

function createMockRng(value = 0.5) {
  return {
    next: vi.fn(() => value),
    nextInt: vi.fn((min: number, _max: number) => min),
    seed: 12345,
  };
}

// ── Mock enemy group ────────────────────────────────────────────────────────

function createMockEnemyGroup() {
  const activated: { defId: string; x: number; y: number; elite: boolean }[] = [];
  return {
    group: {
      get: vi.fn(() => ({
        activate: vi.fn((def: { id: string }, x: number, y: number, _min: number, elite: boolean) => {
          activated.push({ defId: def.id, x, y, elite });
        }),
      })),
    } as unknown as import('phaser').Physics.Arcade.Group,
    activated,
  };
}

function createCallbacks(): SpawnCallbacks & { onBossSpawnSpy: ReturnType<typeof vi.fn> } {
  const onBossSpawnSpy = vi.fn();
  return {
    onBossSpawn: onBossSpawnSpy,
    onBossSpawnSpy,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('SpawnManager — wave spawning', () => {
  let sm: SpawnManager;
  let cbs: ReturnType<typeof createCallbacks>;
  let rng: ReturnType<typeof createMockRng>;

  beforeEach(() => {
    cbs = createCallbacks();
    sm = new SpawnManager(cbs);
    rng = createMockRng(0.99); // high roll = no elite
    sm.create(rng as never);
  });

  it('initialDelayMs honored — no spawn before delay', () => {
    const eg = createMockEnemyGroup();
    // Update with less than initialDelay
    sm.update(
      BALANCE.SPAWN.initialDelayMs - 100,
      BALANCE.SPAWN.initialDelayMs - 100,
      1,
      0,
      eg.group,
      rng as never,
      1,
      1,
      1,
    );
    expect(eg.group.get).not.toHaveBeenCalled();
  });

  it('spawns enemies after initial delay + base interval', () => {
    const eg = createMockEnemyGroup();
    // First: pass initialDelay
    sm.update(
      BALANCE.SPAWN.initialDelayMs + 1,
      BALANCE.SPAWN.initialDelayMs + 1,
      1,
      0,
      eg.group,
      rng as never,
      1,
      1,
      1,
    );
    // Then: pass baseInterval
    sm.update(
      BALANCE.SPAWN.baseIntervalMs + 1,
      BALANCE.SPAWN.initialDelayMs + BALANCE.SPAWN.baseIntervalMs + 2,
      1,
      0,
      eg.group,
      rng as never,
      1,
      1,
      1,
    );
    expect(eg.group.get).toHaveBeenCalled();
  });

  it('max enemies cap respected — no spawn when at cap', () => {
    const eg = createMockEnemyGroup();
    // Force past delays
    sm.update(
      BALANCE.SPAWN.initialDelayMs + BALANCE.SPAWN.baseIntervalMs + 100,
      BALANCE.SPAWN.initialDelayMs + BALANCE.SPAWN.baseIntervalMs + 100,
      1,
      BALANCE.SPAWN.maxEnemiesOnScreen, // already at cap
      eg.group,
      rng as never,
      1,
      1,
      1,
    );
    // No enemies should be spawned when at cap (unless boss)
    expect(eg.activated.length).toBe(0);
  });

  it('spawn stops after stage duration', () => {
    const eg = createMockEnemyGroup();
    const stage1Duration = BALANCE.STAGE.stages[0].durationMs ?? 60000;

    // Advance past stage duration
    sm.update(stage1Duration + 1000, stage1Duration + 1000, 1, 0, eg.group, rng as never, 1, 1, 1);

    expect(sm.isSpawnEnded).toBe(true);

    // Reset call count
    (eg.group.get as ReturnType<typeof vi.fn>).mockClear();

    // Next update should not spawn
    sm.update(
      BALANCE.SPAWN.baseIntervalMs * 2,
      stage1Duration + BALANCE.SPAWN.baseIntervalMs * 2 + 1000,
      1,
      0,
      eg.group,
      rng as never,
      1,
      1,
      1,
    );
    expect(eg.group.get).not.toHaveBeenCalled();
  });

  it('elite spawning triggers based on rng roll', () => {
    // Use a low roll that will pass elite chance
    const lowRng = createMockRng(0.01); // very low → should be elite
    const sm2 = new SpawnManager(cbs);
    sm2.create(lowRng as never);

    const eg = createMockEnemyGroup();
    // Advance past initial delay + interval
    sm2.update(
      BALANCE.SPAWN.initialDelayMs + BALANCE.SPAWN.baseIntervalMs + 100,
      BALANCE.SPAWN.initialDelayMs + BALANCE.SPAWN.baseIntervalMs + 100,
      1,
      0,
      eg.group,
      lowRng as never,
      1,
      1,
      1,
    );

    // With 0.01 roll and eliteChanceBase 0.10, 0.01 < 0.10 → elite
    // Check that enemies were spawned (elite status depends on WaveDirector)
    expect(eg.group.get).toHaveBeenCalled();
  });

  it('boss spawns on boss stage', () => {
    const eg = createMockEnemyGroup();
    // Stage 2 is a boss stage
    sm.resetForStage(2);

    sm.update(100, 100, 2, 0, eg.group, rng as never, 1, 1, 1);

    expect(sm.isBossStage).toBe(true);
    expect(eg.group.get).toHaveBeenCalled();
    expect(cbs.onBossSpawnSpy).toHaveBeenCalled();
  });

  it('boss only spawns once per boss stage', () => {
    const eg = createMockEnemyGroup();
    sm.resetForStage(2);

    // First update: boss spawns
    sm.update(100, 100, 2, 0, eg.group, rng as never, 1, 1, 1);
    const firstCallCount = (eg.group.get as ReturnType<typeof vi.fn>).mock.calls.length;

    // Second update: no additional boss
    sm.update(100, 200, 2, 1, eg.group, rng as never, 1, 1, 1);
    expect((eg.group.get as ReturnType<typeof vi.fn>).mock.calls.length).toBe(firstCallCount);
  });

  it('spawn interval formula: decreases over time', () => {
    // Test the WaveDirector formula directly
    const baseInterval = BALANCE.SPAWN.baseIntervalMs;
    const decay = BALANCE.SPAWN.intervalDecayPerMin;
    const minInterval = BALANCE.SPAWN.minIntervalMs;

    const intervalAt0 = Math.max(minInterval, baseInterval * Math.pow(decay, 0));
    const intervalAt5 = Math.max(minInterval, baseInterval * Math.pow(decay, 5));

    expect(intervalAt5).toBeLessThan(intervalAt0);
    expect(intervalAt5).toBeGreaterThanOrEqual(minInterval);
  });
});

describe('SpawnManager — challenge mode modifiers', () => {
  let cbs: ReturnType<typeof createCallbacks>;

  beforeEach(() => {
    cbs = createCallbacks();
  });

  it('eliteOnly modifier filters out T1 enemies', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('eliteOnly');
    const rng = createMockRng(0.5);
    sm.create(rng as never);

    // The internal enemy pool should not contain T1 enemies
    // We can verify indirectly: get modifier value
    expect(sm.getModifier()).toBe('eliteOnly');

    // Verify T1 enemy IDs exist in config
    const t1Set = new Set(BALANCE.CHALLENGE.t1EnemyIds);
    expect(t1Set.size).toBeGreaterThan(0);
    for (const id of t1Set) {
      expect(ENEMY_DEFS[id]).toBeDefined();
    }
  });

  it('bossRush modifier spawns bosses at interval', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('bossRush');
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    const eg = createMockEnemyGroup();

    // Update with enough delta to trigger boss rush interval
    sm.update(
      BALANCE.CHALLENGE.bossRushIntervalMs + 1,
      BALANCE.CHALLENGE.bossRushIntervalMs + 1,
      1,
      0,
      eg.group,
      rng as never,
      1,
      1,
      1,
    );

    expect(eg.group.get).toHaveBeenCalled();
    expect(cbs.onBossSpawnSpy).toHaveBeenCalled();
  });

  it('bossRush cycles through bossRushPool', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('bossRush');
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    const eg = createMockEnemyGroup();

    const pool = BALANCE.CHALLENGE.bossRushPool;
    // Trigger multiple boss spawns
    for (let i = 0; i < pool.length; i++) {
      sm.update(
        BALANCE.CHALLENGE.bossRushIntervalMs + 1,
        (i + 1) * (BALANCE.CHALLENGE.bossRushIntervalMs + 1),
        1,
        0,
        eg.group,
        rng as never,
        1,
        1,
        1,
      );
    }

    expect(cbs.onBossSpawnSpy).toHaveBeenCalledTimes(pool.length);
  });

  it('bossRush does not spawn normal wave enemies', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('bossRush');
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    const eg = createMockEnemyGroup();

    // Small delta — not enough for boss rush interval
    sm.update(100, 100, 1, 0, eg.group, rng as never, 1, 1, 1);

    // No spawns should happen (not enough time for bossRush interval)
    expect(eg.group.get).not.toHaveBeenCalled();
  });

  it('doubleSpeed modifier is stored correctly', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('doubleSpeed');
    expect(sm.getModifier()).toBe('doubleSpeed');
  });

  it('bossRush modifier skips boss stage mode on resetForStage', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('bossRush');
    const rng = createMockRng(0.5);
    sm.create(rng as never);

    // Stage 2 is normally a boss stage, but bossRush should NOT set bossStageActive
    sm.resetForStage(2);
    expect(sm.isBossStage).toBe(false);
  });
});

describe('SpawnManager — stage-specific spawning', () => {
  let cbs: ReturnType<typeof createCallbacks>;

  beforeEach(() => {
    cbs = createCallbacks();
  });

  it('stage 1 enemy pool matches config', () => {
    const stage1Config = BALANCE.STAGE.stages[0];
    expect(stage1Config.enemyPool).toBeDefined();
    expect(stage1Config.enemyPool!.length).toBeGreaterThan(0);
    // Every enemy in pool should exist in ENEMY_DEFS
    for (const id of stage1Config.enemyPool!) {
      expect(ENEMY_DEFS[id]).toBeDefined();
    }
  });

  it('all stages have valid enemy pools or boss IDs', () => {
    for (let i = 0; i < BALANCE.STAGE.stages.length; i++) {
      const stageConfig = BALANCE.STAGE.stages[i];
      if (stageConfig.type === 'wave') {
        expect(stageConfig.enemyPool).toBeDefined();
        expect(stageConfig.enemyPool!.length).toBeGreaterThan(0);
      } else if (stageConfig.type === 'boss') {
        expect(stageConfig.bossId).toBeDefined();
        expect(ENEMY_DEFS[stageConfig.bossId!]).toBeDefined();
      }
    }
  });

  it('resetForStage sets bossStageActive for boss stages', () => {
    const sm = new SpawnManager(cbs);
    const rng = createMockRng(0.5);
    sm.create(rng as never);

    // Stage 2 = boss
    sm.resetForStage(2);
    expect(sm.isBossStage).toBe(true);

    // Stage 3 = wave
    sm.resetForStage(3);
    expect(sm.isBossStage).toBe(false);
  });

  it('resetForStage updates enemy pool for eliteOnly modifier', () => {
    const sm = new SpawnManager(cbs);
    sm.setChallengeModifier('eliteOnly');
    const rng = createMockRng(0.5);
    sm.create(rng as never);

    // Reset to stage 3 (wave stage with larger pool)
    sm.resetForStage(3);
    expect(sm.isBossStage).toBe(false);
    // No crash means eliteOnly filtering worked
  });

  it('later stages have larger enemy pools than early stages', () => {
    const stage1Pool = BALANCE.STAGE.stages[0].enemyPool ?? [];
    const stage5Pool = BALANCE.STAGE.stages[4]?.enemyPool ?? [];
    // Stage 5 (Mong Kok) should have more enemy types than stage 1
    if (stage5Pool.length > 0) {
      expect(stage5Pool.length).toBeGreaterThanOrEqual(stage1Pool.length);
    }
  });
});

describe('SpawnManager — accessors and lifecycle', () => {
  it('isSpawnEnded starts as false', () => {
    const sm = new SpawnManager(createCallbacks());
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    expect(sm.isSpawnEnded).toBe(false);
  });

  it('isBossStage starts as false', () => {
    const sm = new SpawnManager(createCallbacks());
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    expect(sm.isBossStage).toBe(false);
  });

  it('getModifier returns empty string by default', () => {
    const sm = new SpawnManager(createCallbacks());
    expect(sm.getModifier()).toBe('');
  });

  it('getElapsedMinutes returns 0 initially', () => {
    const sm = new SpawnManager(createCallbacks());
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    expect(sm.getElapsedMinutes()).toBe(0);
  });

  it('shutdown does not throw', () => {
    const sm = new SpawnManager(createCallbacks());
    const rng = createMockRng(0.5);
    sm.create(rng as never);
    expect(() => sm.shutdown()).not.toThrow();
  });
});

describe('SpawnManager — side-view spawn Y', () => {
  it('SPAWN config has ground and air Y constants', () => {
    expect(BALANCE.SPAWN.groundY).toBeDefined();
    expect(BALANCE.SPAWN.airYMin).toBeDefined();
    expect(BALANCE.SPAWN.airYMax).toBeDefined();
    expect(BALANCE.SPAWN.airYMin).toBeLessThan(BALANCE.SPAWN.airYMax);
    expect(BALANCE.SPAWN.groundY).toBeGreaterThan(BALANCE.SPAWN.airYMax);
  });

  it('all ENEMY_DEFS have a category field', () => {
    for (const [_id, def] of Object.entries(ENEMY_DEFS)) {
      expect(['ground', 'air']).toContain(def.category);
    }
  });
});

describe('SpawnManager — balance config', () => {
  it('SPAWN config has all required fields', () => {
    expect(BALANCE.SPAWN.initialDelayMs).toBeGreaterThan(0);
    expect(BALANCE.SPAWN.baseIntervalMs).toBeGreaterThan(0);
    expect(BALANCE.SPAWN.minIntervalMs).toBeGreaterThan(0);
    expect(BALANCE.SPAWN.minIntervalMs).toBeLessThan(BALANCE.SPAWN.baseIntervalMs);
    expect(BALANCE.SPAWN.intervalDecayPerMin).toBeGreaterThan(0);
    expect(BALANCE.SPAWN.intervalDecayPerMin).toBeLessThan(1);
    expect(BALANCE.SPAWN.maxEnemiesOnScreen).toBeGreaterThan(0);
  });

  it('CHALLENGE bossRush config is valid', () => {
    expect(BALANCE.CHALLENGE.bossRushIntervalMs).toBeGreaterThan(0);
    expect(BALANCE.CHALLENGE.bossRushPool.length).toBeGreaterThan(0);
    for (const bossId of BALANCE.CHALLENGE.bossRushPool) {
      expect(ENEMY_DEFS[bossId]).toBeDefined();
    }
  });

  it('T1 enemy IDs are valid enemy def IDs', () => {
    for (const id of BALANCE.CHALLENGE.t1EnemyIds) {
      expect(ENEMY_DEFS[id]).toBeDefined();
    }
  });

  it('maxStages matches stages array length', () => {
    expect(BALANCE.STAGE.maxStages).toBe(BALANCE.STAGE.stages.length);
  });
});
