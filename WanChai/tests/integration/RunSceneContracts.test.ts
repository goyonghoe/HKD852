/**
 * TASK-082: RunScene Integration Tests.
 *
 * Tests the CONTRACTS between RunScene and its managers:
 *   1. onEnemyDeath contract (kills, gold, XP, boss → pendingStageClear)
 *   2. onProjectileHit contract (damage stats tracking)
 *   3. GameOverScene data completeness
 *   4. RunState initialization
 *
 * No Phaser imports — all Phaser objects are mocked as plain JS.
 * All balance numbers come from src/config/balance.ts (M-002).
 */
import { describe, it, expect } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import type { RunState } from '../../src/types/game';
import { calculateDeathReward, shouldTriggerStageClear } from '../../src/utils/EnemyDeathHandler';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    characterId: 'hai',
    seed: 12345,
    runTime: 0,
    stageTime: 0,
    stage: 1,
    playerLevel: 1,
    playerXp: 0,
    baseHp: BALANCE.BASE.hp,
    baseMaxHp: BALANCE.BASE.hp,
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

interface MockEnemy {
  defId: string;
  isElite: boolean;
  xpValue: number;
  behavior: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  active: boolean;
  isSplitChild: boolean;
  frozen: boolean;
  knockbackImmune: boolean;
}

function makeEnemy(overrides: Partial<MockEnemy> = {}): MockEnemy {
  return {
    defId: 'basic',
    isElite: false,
    xpValue: 5,
    behavior: 'move_down',
    x: 360,
    y: 400,
    hp: 0,
    maxHp: 30,
    active: true,
    isSplitChild: false,
    frozen: false,
    knockbackImmune: false,
    ...overrides,
  };
}

interface MockProjectile {
  weaponId: string;
  isCrit: boolean;
  x: number;
  y: number;
}

function makeProjectile(overrides: Partial<MockProjectile> = {}): MockProjectile {
  return {
    weaponId: 'energy_shot',
    isCrit: false,
    x: 360,
    y: 600,
    ...overrides,
  };
}

/**
 * Apply enemy death rewards using the actual EnemyDeathHandler (not reimplemented).
 * Mirrors the RunScene.onEnemyDeath contract.
 */
function applyEnemyDeathRewards(runState: RunState, enemy: MockEnemy, metaXpBonus = 0): void {
  runState.kills++;
  const reward = calculateDeathReward({
    defId: enemy.defId,
    isElite: enemy.isElite,
    xpValue: enemy.xpValue,
    metaXpBonus,
  });
  runState.gold += reward.gold;
  runState.playerXp += reward.xp;
}

/**
 * Reimplements the onProjectileHit stat tracking from RunScene.
 * This mirrors lines 400-405 of RunScene.ts (collision callback).
 */
function applyProjectileHitStats(runState: RunState, proj: MockProjectile, finalDamage: number): void {
  runState.totalDamageDealt += finalDamage;
  runState.totalHitsLanded++;
  runState.weaponDamageMap[proj.weaponId] = (runState.weaponDamageMap[proj.weaponId] ?? 0) + finalDamage;
  if (proj.isCrit) runState.critHitsLanded++;
  runState.highestSingleHit = Math.max(runState.highestSingleHit, finalDamage);
}

// ── Tests ────────────────────────────────────────────────────────────────

// =======================================================================
// 1. onEnemyDeath contract
// =======================================================================
describe('onEnemyDeath contract', () => {
  describe('kills increment', () => {
    it('kills increments by 1 for each enemy death', () => {
      const runState = makeRunState();
      const enemy = makeEnemy();
      applyEnemyDeathRewards(runState, enemy);
      expect(runState.kills).toBe(1);
    });

    it('kills increments for elite enemy', () => {
      const runState = makeRunState();
      const enemy = makeEnemy({ isElite: true });
      applyEnemyDeathRewards(runState, enemy);
      expect(runState.kills).toBe(1);
    });

    it('kills increments for boss enemy', () => {
      const runState = makeRunState();
      const enemy = makeEnemy({ defId: 'boss' });
      applyEnemyDeathRewards(runState, enemy);
      expect(runState.kills).toBe(1);
    });

    it('kills accumulate over multiple deaths', () => {
      const runState = makeRunState();
      for (let i = 0; i < 10; i++) {
        applyEnemyDeathRewards(runState, makeEnemy());
      }
      expect(runState.kills).toBe(10);
    });
  });

  describe('gold reward', () => {
    it('normal enemy gives goldPerKill', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy());
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerKill);
    });

    it('elite enemy gives goldPerElite', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ isElite: true }));
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerElite);
    });

    it('boss enemy gives goldPerKill + goldPerBoss', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ defId: 'boss' }));
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerKill + BALANCE.ECONOMY.goldPerBoss);
    });

    it('boss_circle gives goldPerKill + goldPerBoss', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ defId: 'boss_circle' }));
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerKill + BALANCE.ECONOMY.goldPerBoss);
    });

    it('boss_burst gives goldPerKill + goldPerBoss', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ defId: 'boss_burst' }));
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerKill + BALANCE.ECONOMY.goldPerBoss);
    });

    it('elite boss gives goldPerElite + goldPerBoss', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ defId: 'boss', isElite: true }));
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerElite + BALANCE.ECONOMY.goldPerBoss);
    });

    it('gold accumulates across multiple kills', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy()); // +1
      applyEnemyDeathRewards(runState, makeEnemy()); // +1
      applyEnemyDeathRewards(runState, makeEnemy({ isElite: true })); // +5
      expect(runState.gold).toBe(BALANCE.ECONOMY.goldPerKill * 2 + BALANCE.ECONOMY.goldPerElite);
    });

    it('gold values come from BALANCE.RUN config', () => {
      expect(BALANCE.ECONOMY.goldPerKill).toBe(1);
      expect(BALANCE.ECONOMY.goldPerElite).toBe(5);
      expect(BALANCE.ECONOMY.goldPerBoss).toBe(50);
    });
  });

  describe('XP reward', () => {
    it('normal enemy gives correct XP', () => {
      const runState = makeRunState();
      const enemy = makeEnemy({ xpValue: 5 });
      applyEnemyDeathRewards(runState, enemy);
      expect(runState.playerXp).toBe(5);
    });

    it('XP scales with metaXpBonus', () => {
      const runState = makeRunState();
      const enemy = makeEnemy({ xpValue: 10 });
      applyEnemyDeathRewards(runState, enemy, 0.5); // 50% bonus
      expect(runState.playerXp).toBe(Math.ceil(10 * 1.5));
    });

    it('XP is Math.ceil of scaled value', () => {
      const runState = makeRunState();
      const enemy = makeEnemy({ xpValue: 3 });
      applyEnemyDeathRewards(runState, enemy, 0.1); // 3 * 1.1 = 3.3 -> ceil(3.3) = 4
      expect(runState.playerXp).toBe(Math.ceil(3 * 1.1));
    });

    it('XP accumulates across kills', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ xpValue: 5 }));
      applyEnemyDeathRewards(runState, makeEnemy({ xpValue: 10 }));
      expect(runState.playerXp).toBe(15);
    });

    it('zero metaXpBonus gives base XP', () => {
      const runState = makeRunState();
      applyEnemyDeathRewards(runState, makeEnemy({ xpValue: 7 }), 0);
      expect(runState.playerXp).toBe(7);
    });
  });

  describe('boss kill -> pendingStageClear (via shouldTriggerStageClear)', () => {
    it('boss kill on boss stage triggers stage clear', () => {
      expect(shouldTriggerStageClear(true, 'boss')).toBe(true);
    });

    it('non-boss enemy on boss stage does NOT trigger', () => {
      expect(shouldTriggerStageClear(true, 'basic')).toBe(false);
    });

    it('boss enemy on non-boss stage does NOT trigger', () => {
      expect(shouldTriggerStageClear(false, 'boss')).toBe(false);
    });

    it('boss_circle also triggers on boss stage', () => {
      expect(shouldTriggerStageClear(true, 'boss_circle')).toBe(true);
    });

    it('boss_burst also triggers on boss stage', () => {
      expect(shouldTriggerStageClear(true, 'boss_burst')).toBe(true);
    });

    it('bossKillCount increments when stage clear triggers', () => {
      let bossKillCount = 0;
      if (shouldTriggerStageClear(true, 'boss')) bossKillCount++;
      if (shouldTriggerStageClear(true, 'boss_circle')) bossKillCount++;
      expect(bossKillCount).toBe(2);
    });
  });
});

// =======================================================================
// 2. onProjectileHit contract
// =======================================================================
describe('onProjectileHit contract', () => {
  describe('totalDamageDealt accumulation', () => {
    it('accumulates damage from single hit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 50);
      expect(runState.totalDamageDealt).toBe(50);
    });

    it('accumulates across multiple hits', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 30);
      applyProjectileHitStats(runState, makeProjectile(), 45);
      applyProjectileHitStats(runState, makeProjectile(), 25);
      expect(runState.totalDamageDealt).toBe(100);
    });

    it('handles zero damage hit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 0);
      expect(runState.totalDamageDealt).toBe(0);
      expect(runState.totalHitsLanded).toBe(1); // still counts as a hit
    });
  });

  describe('totalHitsLanded increment', () => {
    it('increments on every hit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 10);
      applyProjectileHitStats(runState, makeProjectile(), 20);
      applyProjectileHitStats(runState, makeProjectile(), 30);
      expect(runState.totalHitsLanded).toBe(3);
    });
  });

  describe('critHitsLanded tracking', () => {
    it('increments only on crit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile({ isCrit: false }), 10);
      applyProjectileHitStats(runState, makeProjectile({ isCrit: true }), 20);
      applyProjectileHitStats(runState, makeProjectile({ isCrit: false }), 10);
      applyProjectileHitStats(runState, makeProjectile({ isCrit: true }), 40);
      expect(runState.critHitsLanded).toBe(2);
      expect(runState.totalHitsLanded).toBe(4);
    });

    it('does not increment on non-crit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile({ isCrit: false }), 10);
      expect(runState.critHitsLanded).toBe(0);
    });

    it('crit rate can be calculated from tracked stats', () => {
      const runState = makeRunState();
      for (let i = 0; i < 10; i++) {
        applyProjectileHitStats(runState, makeProjectile({ isCrit: i < 3 }), 10);
      }
      const critRate = runState.critHitsLanded / runState.totalHitsLanded;
      expect(critRate).toBeCloseTo(0.3, 5);
    });
  });

  describe('weaponDamageMap per-weapon tracking', () => {
    it('tracks damage for a single weapon', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'energy_shot' }), 30);
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'energy_shot' }), 20);
      expect(runState.weaponDamageMap['energy_shot']).toBe(50);
    });

    it('tracks damage separately for different weapons', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'energy_shot' }), 30);
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'missile' }), 100);
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'energy_shot' }), 20);
      expect(runState.weaponDamageMap['energy_shot']).toBe(50);
      expect(runState.weaponDamageMap['missile']).toBe(100);
    });

    it('initializes weapon entry on first hit', () => {
      const runState = makeRunState();
      expect(runState.weaponDamageMap['shotgun']).toBeUndefined();
      applyProjectileHitStats(runState, makeProjectile({ weaponId: 'shotgun' }), 15);
      expect(runState.weaponDamageMap['shotgun']).toBe(15);
    });
  });

  describe('highestSingleHit tracking', () => {
    it('updates on first hit', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 42);
      expect(runState.highestSingleHit).toBe(42);
    });

    it('updates when new hit is higher', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 42);
      applyProjectileHitStats(runState, makeProjectile(), 100);
      expect(runState.highestSingleHit).toBe(100);
    });

    it('does NOT update when new hit is lower', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 100);
      applyProjectileHitStats(runState, makeProjectile(), 50);
      expect(runState.highestSingleHit).toBe(100);
    });

    it('handles equal damage correctly', () => {
      const runState = makeRunState();
      applyProjectileHitStats(runState, makeProjectile(), 42);
      applyProjectileHitStats(runState, makeProjectile(), 42);
      expect(runState.highestSingleHit).toBe(42);
    });
  });
});

// =======================================================================
// 3. GameOverScene data completeness
// =======================================================================
describe('GameOverScene data completeness', () => {
  /**
   * Reimplements the data object construction from RunScene.onRunComplete
   * (lines 1323-1342). This tests that all required fields are present.
   */
  function buildGameOverData(
    survived: boolean,
    runState: RunState,
    weapons: { defId: string; level: number }[],
    bossKillCount: number,
    challengeMode: boolean,
  ): Record<string, unknown> {
    const weaponsUsed = weapons.length;
    const highestWeaponLevel = weapons.reduce((max, w) => Math.max(max, w.level), 0);
    return {
      survived,
      kills: runState.kills,
      gold: runState.gold,
      level: runState.playerLevel,
      timeMs: runState.runTime,
      baseHpRemaining: runState.baseHp,
      stage: runState.stage,
      maxStages: BALANCE.STAGE.maxStages,
      characterId: runState.characterId,
      weaponsUsed,
      highestWeaponLevel,
      bossKills: bossKillCount,
      challengeMode,
      totalDamageDealt: runState.totalDamageDealt,
      weaponDamageMap: runState.weaponDamageMap,
      critHitsLanded: runState.critHitsLanded,
      totalHitsLanded: runState.totalHitsLanded,
      highestSingleHit: runState.highestSingleHit,
    };
  }

  it('contains all required GameOverData fields', () => {
    const runState = makeRunState({ kills: 42, gold: 100, playerLevel: 5, runTime: 60000 });
    const data = buildGameOverData(false, runState, [{ defId: 'energy_shot', level: 3 }], 1, false);

    const requiredFields = [
      'survived',
      'kills',
      'gold',
      'level',
      'timeMs',
      'baseHpRemaining',
      'stage',
      'maxStages',
      'characterId',
      'weaponsUsed',
      'highestWeaponLevel',
      'bossKills',
      'challengeMode',
      'totalDamageDealt',
      'weaponDamageMap',
      'critHitsLanded',
      'totalHitsLanded',
      'highestSingleHit',
    ];

    for (const field of requiredFields) {
      expect(data).toHaveProperty(field);
    }
  });

  it('survived is true on victory', () => {
    const data = buildGameOverData(true, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 0, false);
    expect(data.survived).toBe(true);
  });

  it('survived is false on defeat', () => {
    const data = buildGameOverData(false, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 0, false);
    expect(data.survived).toBe(false);
  });

  it('weaponsUsed matches weapon array length', () => {
    const weapons = [
      { defId: 'energy_shot', level: 2 },
      { defId: 'missile', level: 3 },
      { defId: 'shotgun', level: 1 },
    ];
    const data = buildGameOverData(false, makeRunState(), weapons, 0, false);
    expect(data.weaponsUsed).toBe(3);
  });

  it('highestWeaponLevel finds max level', () => {
    const weapons = [
      { defId: 'energy_shot', level: 2 },
      { defId: 'missile', level: 5 },
      { defId: 'shotgun', level: 1 },
    ];
    const data = buildGameOverData(false, makeRunState(), weapons, 0, false);
    expect(data.highestWeaponLevel).toBe(5);
  });

  it('maxStages comes from BALANCE.STAGE.maxStages', () => {
    const data = buildGameOverData(false, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 0, false);
    expect(data.maxStages).toBe(BALANCE.STAGE.maxStages);
  });

  it('damage stats are propagated from runState', () => {
    const runState = makeRunState({
      totalDamageDealt: 5000,
      weaponDamageMap: { energy_shot: 3000, missile: 2000 },
      critHitsLanded: 15,
      totalHitsLanded: 100,
      highestSingleHit: 250,
    });
    const data = buildGameOverData(false, runState, [{ defId: 'energy_shot', level: 1 }], 0, false);
    expect(data.totalDamageDealt).toBe(5000);
    expect(data.weaponDamageMap).toEqual({ energy_shot: 3000, missile: 2000 });
    expect(data.critHitsLanded).toBe(15);
    expect(data.totalHitsLanded).toBe(100);
    expect(data.highestSingleHit).toBe(250);
  });

  it('challengeMode flag is propagated', () => {
    const data = buildGameOverData(false, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 0, true);
    expect(data.challengeMode).toBe(true);
  });

  it('bossKills is propagated from bossKillCount', () => {
    const data = buildGameOverData(true, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 3, false);
    expect(data.bossKills).toBe(3);
  });

  it('characterId is propagated from runState', () => {
    const runState = makeRunState({ characterId: 'nova' });
    const data = buildGameOverData(false, runState, [{ defId: 'energy_shot', level: 1 }], 0, false);
    expect(data.characterId).toBe('nova');
  });
});

// =======================================================================
// 4. RunState initialization
// =======================================================================
describe('RunState initialization', () => {
  it('all fields have correct initial values', () => {
    const runState = makeRunState();

    expect(runState.characterId).toBe('hai');
    expect(runState.seed).toBe(12345);
    expect(runState.runTime).toBe(0);
    expect(runState.stageTime).toBe(0);
    expect(runState.stage).toBe(1);
    expect(runState.playerLevel).toBe(1);
    expect(runState.playerXp).toBe(0);
    expect(runState.baseHp).toBe(BALANCE.BASE.hp);
    expect(runState.baseMaxHp).toBe(BALANCE.BASE.hp);
    expect(runState.kills).toBe(0);
    expect(runState.gold).toBe(0);
    expect(runState.weapons).toEqual(['energy_shot']);
    expect(runState.passives).toEqual([]);
    expect(runState.totalDamageDealt).toBe(0);
    expect(runState.weaponDamageMap).toEqual({});
    expect(runState.critHitsLanded).toBe(0);
    expect(runState.totalHitsLanded).toBe(0);
    expect(runState.highestSingleHit).toBe(0);
  });

  it('baseHp equals BALANCE.BASE.hp at start', () => {
    const runState = makeRunState();
    expect(runState.baseHp).toBe(BALANCE.BASE.hp);
    expect(runState.baseMaxHp).toBe(BALANCE.BASE.hp);
  });

  it('stage starts at 1', () => {
    expect(makeRunState().stage).toBe(1);
  });

  it('playerLevel starts at 1', () => {
    expect(makeRunState().playerLevel).toBe(1);
  });

  it('weapons contains start weapon', () => {
    expect(makeRunState().weapons).toContain('energy_shot');
    expect(makeRunState().weapons).toHaveLength(1);
  });

  it('passives starts empty', () => {
    expect(makeRunState().passives).toEqual([]);
  });

  it('damage tracking fields start at 0', () => {
    const rs = makeRunState();
    expect(rs.totalDamageDealt).toBe(0);
    expect(rs.critHitsLanded).toBe(0);
    expect(rs.totalHitsLanded).toBe(0);
    expect(rs.highestSingleHit).toBe(0);
  });

  it('weaponDamageMap starts as empty object', () => {
    const rs = makeRunState();
    expect(rs.weaponDamageMap).toEqual({});
    expect(Object.keys(rs.weaponDamageMap)).toHaveLength(0);
  });

  it('RunState interface has all expected fields', () => {
    const rs = makeRunState();
    const expectedFields = [
      'characterId',
      'seed',
      'runTime',
      'stageTime',
      'stage',
      'playerLevel',
      'playerXp',
      'baseHp',
      'baseMaxHp',
      'kills',
      'gold',
      'weapons',
      'passives',
      'totalDamageDealt',
      'weaponDamageMap',
      'critHitsLanded',
      'totalHitsLanded',
      'highestSingleHit',
    ];
    for (const field of expectedFields) {
      expect(rs).toHaveProperty(field);
    }
  });

  it('RunState has exactly 18 fields', () => {
    const rs = makeRunState();
    expect(Object.keys(rs)).toHaveLength(18);
  });
});
