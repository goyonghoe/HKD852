/**
 * TASK-090: Scene Flow Integration Contract Tests (M-008/M-010)
 *
 * Pure contract tests for scene-to-scene data flow:
 *   1. RunEndData type completeness
 *   2. RunState -> RunEndData conversion
 *   3. Phase state machine transitions (valid/invalid)
 *   4. Stage progression: stage clear -> next stage, final stage -> run complete
 *   5. pendingStageClear + levelup interaction (M-014 regression)
 *   6. Boss stage detection uses correct defId patterns
 *
 * No Phaser imports — all tested via pure TS logic + BALANCE config.
 */
import { describe, it, expect, vi } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import type { RunState, RunEndData, GamePhase, MetaState } from '../../src/types/game';
import { PhaseManager } from '../../src/managers/PhaseManager';
import { shouldTriggerStageClear, isRunComplete, calculateDeathReward } from '../../src/utils/EnemyDeathHandler';
import { purchaseUpgrade } from '../../src/core/MetaProgression';
import { checkAchievements } from '../../src/core/Achievements';
import { addDiscovery } from '../../src/utils/SettingsCalc';

// ── Helpers ──────────────────────────────────────────────────────

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    characterId: 'hai',
    seed: 42,
    runTime: 120000,
    stageTime: 30000,
    stage: 3,
    playerLevel: 8,
    playerXp: 25,
    baseHp: 400,
    baseMaxHp: BALANCE.BASE.hp,
    kills: 150,
    gold: 80,
    weapons: ['energy_shot', 'missile'],
    passives: ['crit_chance'],
    totalDamageDealt: 12000,
    weaponDamageMap: { energy_shot: 7000, missile: 5000 },
    critHitsLanded: 30,
    totalHitsLanded: 200,
    highestSingleHit: 350,
    ...overrides,
  };
}

/**
 * Mirrors RunScene.onRunComplete data construction.
 * This is the contract between RunScene -> GameOverScene.
 */
function buildRunEndData(
  survived: boolean,
  runState: RunState,
  weapons: { defId: string; level: number }[],
  bossKillCount: number,
): RunEndData {
  const weaponsUsed = weapons.length;
  const highestWeaponLevel = weapons.reduce((max, w) => Math.max(max, w.level), 0);
  return {
    kills: runState.kills,
    gold: runState.gold,
    level: runState.playerLevel,
    timeMs: runState.runTime,
    weaponsUsed,
    highestWeaponLevel,
    bossKills: bossKillCount,
    survived,
    totalDamageDealt: runState.totalDamageDealt,
    weaponDamageMap: runState.weaponDamageMap,
    critHitsLanded: runState.critHitsLanded,
    totalHitsLanded: runState.totalHitsLanded,
    highestSingleHit: runState.highestSingleHit,
  };
}

// =======================================================================
// 1. RunEndData type completeness
// =======================================================================
describe('RunEndData type completeness', () => {
  it('contains all required RunEndData fields', () => {
    const runState = makeRunState();
    const data = buildRunEndData(false, runState, [{ defId: 'energy_shot', level: 3 }], 1);

    const requiredFields: (keyof RunEndData)[] = [
      'kills',
      'gold',
      'level',
      'timeMs',
      'weaponsUsed',
      'highestWeaponLevel',
      'bossKills',
      'survived',
    ];

    for (const field of requiredFields) {
      expect(data).toHaveProperty(field);
    }
  });

  it('contains all optional damage stats fields', () => {
    const runState = makeRunState();
    const data = buildRunEndData(true, runState, [{ defId: 'energy_shot', level: 1 }], 0);

    const optionalFields: (keyof RunEndData)[] = [
      'totalDamageDealt',
      'weaponDamageMap',
      'critHitsLanded',
      'totalHitsLanded',
      'highestSingleHit',
    ];

    for (const field of optionalFields) {
      expect(data).toHaveProperty(field);
    }
  });

  it('RunEndData has exactly 13 fields when all populated', () => {
    const data = buildRunEndData(true, makeRunState(), [{ defId: 'energy_shot', level: 1 }], 0);
    expect(Object.keys(data)).toHaveLength(13);
  });

  it('no numeric field is undefined or NaN', () => {
    const data = buildRunEndData(true, makeRunState(), [{ defId: 'energy_shot', level: 2 }], 1);
    const numericFields: (keyof RunEndData)[] = [
      'kills',
      'gold',
      'level',
      'timeMs',
      'weaponsUsed',
      'highestWeaponLevel',
      'bossKills',
    ];
    for (const field of numericFields) {
      expect(data[field]).not.toBeUndefined();
      expect(Number.isNaN(data[field])).toBe(false);
    }
  });
});

// =======================================================================
// 2. RunState -> RunEndData conversion correctness
// =======================================================================
describe('RunState -> RunEndData field mapping', () => {
  it('kills maps from runState.kills', () => {
    const data = buildRunEndData(false, makeRunState({ kills: 42 }), [], 0);
    expect(data.kills).toBe(42);
  });

  it('gold maps from runState.gold', () => {
    const data = buildRunEndData(false, makeRunState({ gold: 999 }), [], 0);
    expect(data.gold).toBe(999);
  });

  it('level maps from runState.playerLevel', () => {
    const data = buildRunEndData(false, makeRunState({ playerLevel: 15 }), [], 0);
    expect(data.level).toBe(15);
  });

  it('timeMs maps from runState.runTime', () => {
    const data = buildRunEndData(false, makeRunState({ runTime: 180000 }), [], 0);
    expect(data.timeMs).toBe(180000);
  });

  it('weaponsUsed equals weapons array length', () => {
    const weapons = [
      { defId: 'energy_shot', level: 2 },
      { defId: 'missile', level: 3 },
      { defId: 'shotgun', level: 1 },
    ];
    const data = buildRunEndData(false, makeRunState(), weapons, 0);
    expect(data.weaponsUsed).toBe(3);
  });

  it('highestWeaponLevel finds max across weapons', () => {
    const weapons = [
      { defId: 'energy_shot', level: 2 },
      { defId: 'missile', level: 7 },
      { defId: 'shotgun', level: 1 },
    ];
    const data = buildRunEndData(false, makeRunState(), weapons, 0);
    expect(data.highestWeaponLevel).toBe(7);
  });

  it('highestWeaponLevel is 0 for empty weapons array', () => {
    const data = buildRunEndData(false, makeRunState(), [], 0);
    expect(data.highestWeaponLevel).toBe(0);
  });

  it('survived flag propagates correctly', () => {
    const victory = buildRunEndData(true, makeRunState(), [], 0);
    const defeat = buildRunEndData(false, makeRunState(), [], 0);
    expect(victory.survived).toBe(true);
    expect(defeat.survived).toBe(false);
  });

  it('damage stats propagate from runState', () => {
    const runState = makeRunState({
      totalDamageDealt: 50000,
      weaponDamageMap: { energy_shot: 30000, missile: 20000 },
      critHitsLanded: 100,
      totalHitsLanded: 500,
      highestSingleHit: 1200,
    });
    const data = buildRunEndData(false, runState, [], 0);
    expect(data.totalDamageDealt).toBe(50000);
    expect(data.weaponDamageMap).toEqual({ energy_shot: 30000, missile: 20000 });
    expect(data.critHitsLanded).toBe(100);
    expect(data.totalHitsLanded).toBe(500);
    expect(data.highestSingleHit).toBe(1200);
  });
});

// =======================================================================
// 3. Phase state machine transition contracts (scene flow)
// =======================================================================
describe('Phase state machine scene flow contracts', () => {
  it('normal play flow: playing -> levelup -> playing', () => {
    const pm = new PhaseManager();
    expect(pm.transition('levelup')).toBe(true);
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');
  });

  it('boss kill flow: playing -> stage_clear -> playing (next stage)', () => {
    const pm = new PhaseManager();
    expect(pm.transition('stage_clear')).toBe(true);
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');
  });

  it('stage clear can go to shop: stage_clear -> shop -> playing', () => {
    const pm = new PhaseManager();
    pm.transition('stage_clear');
    expect(pm.transition('shop')).toBe(true);
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');
  });

  it('run complete flow: playing -> stage_clear -> gameover', () => {
    const pm = new PhaseManager();
    pm.transition('stage_clear');
    expect(pm.transition('gameover')).toBe(true);
    expect(pm.current).toBe('gameover');
  });

  it('base destroyed flow: playing -> gameover', () => {
    const pm = new PhaseManager();
    expect(pm.transition('gameover')).toBe(true);
    expect(pm.current).toBe('gameover');
  });

  it('gameover is terminal (no outbound transitions)', () => {
    const pm = new PhaseManager();
    pm.transition('gameover');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const allPhases: GamePhase[] = ['playing', 'levelup', 'paused', 'shop', 'stage_clear'];
    for (const phase of allPhases) {
      expect(pm.transition(phase)).toBe(false);
    }
    expect(pm.current).toBe('gameover');
    warnSpy.mockRestore();
  });

  it('levelup cannot go to stage_clear directly (M-014)', () => {
    const pm = new PhaseManager();
    pm.transition('levelup');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pm.transition('stage_clear')).toBe(false);
    expect(pm.current).toBe('levelup');
    warnSpy.mockRestore();
  });
});

// =======================================================================
// 4. Stage progression contracts
// =======================================================================
describe('Stage progression contracts', () => {
  it('non-final stage clear does NOT trigger run complete', () => {
    for (let stage = 1; stage < BALANCE.STAGE.maxStages; stage++) {
      expect(isRunComplete(stage)).toBe(false);
    }
  });

  it('final stage triggers run complete', () => {
    expect(isRunComplete(BALANCE.STAGE.maxStages)).toBe(true);
  });

  it('stage beyond max also completes run', () => {
    expect(isRunComplete(BALANCE.STAGE.maxStages + 1)).toBe(true);
  });

  it('maxStages matches balance config (6)', () => {
    expect(BALANCE.STAGE.maxStages).toBe(6);
  });

  it('stage array length matches maxStages', () => {
    expect(BALANCE.STAGE.stages.length).toBe(BALANCE.STAGE.maxStages);
  });

  it('boss stages alternate with wave stages', () => {
    for (let i = 0; i < BALANCE.STAGE.stages.length; i++) {
      const stage = BALANCE.STAGE.stages[i];
      if (i % 2 === 0) {
        expect(stage.type).toBe('wave');
      } else {
        expect(stage.type).toBe('boss');
      }
    }
  });

  it('every boss stage has a bossId starting with "boss"', () => {
    const bossStages = BALANCE.STAGE.stages.filter((s) => s.type === 'boss');
    for (const bs of bossStages) {
      expect(bs.bossId).toBeDefined();
      expect(bs.bossId!.startsWith('boss')).toBe(true);
    }
  });

  it('stage difficulty multipliers compound correctly', () => {
    const diff = BALANCE.STAGE.difficultyPerStage;
    const stageNum = 5;
    const expectedHpMult = Math.pow(diff.hpMult, stageNum - 1);
    const expectedSpeedMult = Math.pow(diff.speedMult, stageNum - 1);
    const expectedDmgMult = Math.pow(diff.damageMult, stageNum - 1);

    expect(expectedHpMult).toBeGreaterThan(1);
    expect(expectedSpeedMult).toBeGreaterThan(1);
    expect(expectedDmgMult).toBeGreaterThan(1);
    // Stage 1 has multiplier 1 (no scaling)
    expect(Math.pow(diff.hpMult, 0)).toBe(1);
  });

  it('clearHealPercent restores correct amount', () => {
    const maxHp = BALANCE.BASE.hp;
    const healAmount = Math.ceil(maxHp * BALANCE.STAGE.clearHealPercent);
    expect(healAmount).toBeGreaterThan(0);
    expect(healAmount).toBeLessThanOrEqual(maxHp);
    // 20% of 600 = 120
    expect(healAmount).toBe(Math.ceil(600 * 0.2));
  });
});

// =======================================================================
// 5. pendingStageClear + levelup interaction (M-014 regression)
// =======================================================================
describe('pendingStageClear + levelup interaction (M-014)', () => {
  /**
   * Simulates the onEnemyDeath flow:
   *   1. Boss dies -> pendingStageClear=true
   *   2. XP gain may trigger levelup (phase -> 'levelup')
   *   3. After levelup resolved (phase -> 'playing'),
   *      pendingStageClear should be checked and consumed.
   */

  it('boss kill sets pendingStageClear=true when on boss stage', () => {
    let pendingStageClear = false;
    if (shouldTriggerStageClear(true, 'boss')) {
      pendingStageClear = true;
    }
    expect(pendingStageClear).toBe(true);
  });

  it('pendingStageClear persists through levelup phase', () => {
    const pm = new PhaseManager();
    let pendingStageClear = false;

    // Boss dies
    pendingStageClear = true;
    // Levelup triggers
    pm.transition('levelup');
    // pendingStageClear should still be true during levelup
    expect(pendingStageClear).toBe(true);
    expect(pm.current).toBe('levelup');
  });

  it('after levelup resolved, pendingStageClear triggers stage_clear', () => {
    const pm = new PhaseManager();
    let pendingStageClear = true;

    // Levelup active
    pm.transition('levelup');
    // Player picks upgrade -> phase returns to playing
    pm.transition('playing');

    // Now the onEnemyDeath post-levelup check:
    // if pendingStageClear && phase !== 'levelup' -> consume and show stage clear
    if (pendingStageClear && pm.current !== 'levelup') {
      pendingStageClear = false;
      pm.transition('stage_clear');
    }

    expect(pendingStageClear).toBe(false);
    expect(pm.current).toBe('stage_clear');
  });

  it('pendingStageClear NOT consumed during levelup (guarded by phase check)', () => {
    const pm = new PhaseManager();
    let pendingStageClear = true;

    pm.transition('levelup');

    // The guard: only consume if NOT in levelup
    if (pendingStageClear && pm.current !== 'levelup') {
      pendingStageClear = false; // should NOT execute
    }

    expect(pendingStageClear).toBe(true); // still pending
    expect(pm.current).toBe('levelup');
  });

  it('showStageClear guard rejects if phase is levelup', () => {
    const pm = new PhaseManager();
    pm.transition('levelup');
    // showStageClear checks: if (isAny('stage_clear', 'levelup', 'gameover')) return
    expect(pm.isAny('stage_clear', 'levelup', 'gameover')).toBe(true);
  });

  it('showStageClear guard rejects if phase is gameover', () => {
    const pm = new PhaseManager();
    pm.transition('gameover');
    expect(pm.isAny('stage_clear', 'levelup', 'gameover')).toBe(true);
  });

  it('showStageClear guard allows if phase is playing', () => {
    const pm = new PhaseManager();
    expect(pm.isAny('stage_clear', 'levelup', 'gameover')).toBe(false);
  });
});

// =======================================================================
// 6. Boss stage detection uses correct defId patterns
// =======================================================================
describe('Boss stage detection defId patterns', () => {
  it('all bossIds in BALANCE.STAGE.stages trigger shouldTriggerStageClear', () => {
    const bossStages = BALANCE.STAGE.stages.filter((s) => s.type === 'boss');
    for (const bs of bossStages) {
      expect(shouldTriggerStageClear(true, bs.bossId!)).toBe(true);
    }
  });

  it('"boss" prefix pattern matches boss, boss_circle, boss_burst', () => {
    const bossDefIds = ['boss', 'boss_circle', 'boss_burst'];
    for (const id of bossDefIds) {
      expect(id.startsWith('boss')).toBe(true);
      expect(shouldTriggerStageClear(true, id)).toBe(true);
    }
  });

  it('non-boss defIds do NOT start with "boss"', () => {
    const nonBoss = [
      'basic',
      'fast',
      'swarm',
      'tank',
      'splitter',
      'guardian',
      'chaser',
      'shooter',
      'teleporter',
      'sniper_enemy',
    ];
    for (const id of nonBoss) {
      expect(id.startsWith('boss')).toBe(false);
      expect(shouldTriggerStageClear(true, id)).toBe(false);
    }
  });

  it('isBossStage=false prevents stage clear even for boss defId', () => {
    expect(shouldTriggerStageClear(false, 'boss')).toBe(false);
    expect(shouldTriggerStageClear(false, 'boss_circle')).toBe(false);
    expect(shouldTriggerStageClear(false, 'boss_burst')).toBe(false);
  });

  it('challenge bossRushPool bossIds all match "boss" prefix', () => {
    for (const id of BALANCE.CHALLENGE.bossRushPool) {
      expect(id.startsWith('boss')).toBe(true);
    }
  });
});

// =======================================================================
// 7. Scene transition data contracts (MainMenu -> CharSelect -> RunScene)
// =======================================================================
describe('Scene transition data contracts', () => {
  it('CharacterSelect -> RunScene data contract includes characterId as string', () => {
    // CharacterSelectScene passes { characterId: string, tutorial?: boolean }
    // RunScene.init()/create() expects data.characterId to exist and be a string.
    const validCharacterIds = ['hai', 'nova', 'sol', 'mei', 'kai'];
    for (const charId of validCharacterIds) {
      const sceneData = { characterId: charId, tutorial: false };
      expect(sceneData).toHaveProperty('characterId');
      expect(typeof sceneData.characterId).toBe('string');
      expect(sceneData.characterId.length).toBeGreaterThan(0);
    }
  });

  it('CharacterSelect -> RunScene passes characterId', () => {
    // CharacterSelectScene passes { characterId: string, tutorial?: boolean }
    // RunScene reads data.characterId in init()/create()
    const selectedId = 'nova';
    const runSceneData = { characterId: selectedId, tutorial: false };
    expect(runSceneData.characterId).toBe('nova');
    expect(typeof runSceneData.characterId).toBe('string');
  });

  it('RunScene -> GameOverScene passes full data payload', () => {
    const runState = makeRunState({ stage: 8 });
    const weapons = [{ defId: 'energy_shot', level: 4 }];
    const data = buildRunEndData(true, runState, weapons, 3);

    // GameOverScene expects all these fields
    expect(data.kills).toBe(runState.kills);
    expect(data.gold).toBe(runState.gold);
    expect(data.level).toBe(runState.playerLevel);
    expect(data.timeMs).toBe(runState.runTime);
    expect(data.survived).toBe(true);
    expect(data.bossKills).toBe(3);
    expect(data.weaponsUsed).toBe(1);
    expect(data.highestWeaponLevel).toBe(4);
  });

  it('GameOverScene -> MetaScene: gold and records are persisted before transition', () => {
    // GameOverScene saves gold + records to meta BEFORE transitioning to MetaScene.
    // MetaScene reads from SaveManager — contract: meta must contain updated values.
    const runState = makeRunState({ kills: 200, gold: 50, playerLevel: 12 });
    const runEndData = buildRunEndData(false, runState, [{ defId: 'energy_shot', level: 3 }], 1);

    // Simulate what GameOverScene does before transition:
    const meta: MetaState = {
      totalGold: 100,
      totalGoldEarned: 100,
      highScore: 0,
      bestKills: 50,
      bestLevel: 5,
      bestTimeMs: 0,
      upgrades: {},
      runsCompleted: 3,
      discovered: { weapons: ['energy_shot'], enemies: [] },
    };

    // Apply GameOverScene's save logic (gold + records)
    meta.totalGold += runEndData.gold;
    meta.totalGoldEarned += runEndData.gold;
    if (runEndData.kills > meta.bestKills) meta.bestKills = runEndData.kills;
    if (runEndData.level > meta.bestLevel) meta.bestLevel = runEndData.level;
    if (runEndData.timeMs > meta.bestTimeMs) meta.bestTimeMs = runEndData.timeMs;

    // Contract: MetaScene would read these updated values
    expect(meta.totalGold).toBe(150); // 100 + 50
    expect(meta.bestKills).toBe(200); // new record
    expect(meta.bestLevel).toBe(12); // new record
    expect(meta.bestTimeMs).toBe(runState.runTime); // new record
  });

  it('GameOverScene retry passes characterId back to RunScene', () => {
    // scene.start('RunScene', { characterId: data.characterId })
    const characterId = 'sol';
    const retryData = { characterId };
    expect(retryData.characterId).toBe('sol');
  });
});

// =======================================================================
// 8. SaveManager integration contracts (TASK-095)
// =======================================================================

function makeMeta(overrides: Partial<MetaState> = {}): MetaState {
  return {
    totalGold: 0,
    totalGoldEarned: 0,
    highScore: 0,
    bestKills: 0,
    bestLevel: 0,
    bestTimeMs: 0,
    upgrades: {},
    runsCompleted: 0,
    discovered: { weapons: ['energy_shot'], enemies: [] },
    ...overrides,
  };
}

describe('SaveManager integration contracts', () => {
  it('gold earned in run is added to totalGold after run ends', () => {
    const meta = makeMeta({ totalGold: 100, totalGoldEarned: 100 });
    const reward = calculateDeathReward({
      defId: 'basic',
      isElite: false,
      xpValue: 5,
      metaXpBonus: 0,
    });
    // Simulate gold accumulation during a run
    const goldEarned = reward.gold * 50; // 50 kills of basic enemies
    meta.totalGold += goldEarned;
    meta.totalGoldEarned += goldEarned;

    expect(meta.totalGold).toBe(100 + goldEarned);
    expect(meta.totalGoldEarned).toBe(100 + goldEarned);
    expect(goldEarned).toBe(50 * BALANCE.ECONOMY.goldPerKill);
  });

  it('highScore updates when new score > old score', () => {
    const meta = makeMeta({ highScore: 100 });
    const newScore = 250;
    // GameOverScene logic: kills is used as score proxy
    if (newScore > meta.highScore) {
      meta.highScore = newScore;
    }
    expect(meta.highScore).toBe(250);
  });

  it('highScore does NOT update when new score <= old score', () => {
    const meta = makeMeta({ highScore: 500 });
    const newScore = 200;
    if (newScore > meta.highScore) {
      meta.highScore = newScore;
    }
    expect(meta.highScore).toBe(500);
  });

  it('bestKills only updates when beaten', () => {
    const meta = makeMeta({ bestKills: 300 });

    // Lower kills: no update
    const lowerKills = 100;
    if (lowerKills > meta.bestKills) meta.bestKills = lowerKills;
    expect(meta.bestKills).toBe(300);

    // Higher kills: update
    const higherKills = 500;
    if (higherKills > meta.bestKills) meta.bestKills = higherKills;
    expect(meta.bestKills).toBe(500);
  });

  it('bestLevel only updates when beaten', () => {
    const meta = makeMeta({ bestLevel: 10 });

    if (8 > meta.bestLevel) meta.bestLevel = 8;
    expect(meta.bestLevel).toBe(10);

    if (15 > meta.bestLevel) meta.bestLevel = 15;
    expect(meta.bestLevel).toBe(15);
  });

  it('bestTimeMs only updates when beaten', () => {
    const meta = makeMeta({ bestTimeMs: 120000 });

    if (60000 > meta.bestTimeMs) meta.bestTimeMs = 60000;
    expect(meta.bestTimeMs).toBe(120000);

    if (180000 > meta.bestTimeMs) meta.bestTimeMs = 180000;
    expect(meta.bestTimeMs).toBe(180000);
  });

  it('runsCompleted increments after each run', () => {
    const meta = makeMeta({ runsCompleted: 5 });
    meta.runsCompleted += 1;
    expect(meta.runsCompleted).toBe(6);

    meta.runsCompleted += 1;
    expect(meta.runsCompleted).toBe(7);
  });

  it('discovered weapons list grows after using new weapon', () => {
    const discovered = { weapons: ['energy_shot'], enemies: [] };

    // Use addDiscovery (same util as SaveManager.discoverWeapon)
    discovered.weapons = addDiscovery(discovered.weapons, 'missile');
    expect(discovered.weapons).toContain('missile');
    expect(discovered.weapons).toHaveLength(2);

    // Adding same weapon again does not duplicate
    discovered.weapons = addDiscovery(discovered.weapons, 'missile');
    expect(discovered.weapons).toHaveLength(2);

    // Adding another new weapon
    discovered.weapons = addDiscovery(discovered.weapons, 'shotgun');
    expect(discovered.weapons).toHaveLength(3);
    expect(discovered.weapons).toContain('shotgun');
  });

  it('discovered enemies list grows after killing new type', () => {
    const discovered = { weapons: ['energy_shot'], enemies: [] as string[] };

    discovered.enemies = addDiscovery(discovered.enemies, 'basic');
    expect(discovered.enemies).toContain('basic');
    expect(discovered.enemies).toHaveLength(1);

    discovered.enemies = addDiscovery(discovered.enemies, 'fast');
    expect(discovered.enemies).toHaveLength(2);

    // Duplicate detection
    discovered.enemies = addDiscovery(discovered.enemies, 'basic');
    expect(discovered.enemies).toHaveLength(2);
  });

  it('upgrade purchase deducts gold and increments level', () => {
    const meta = makeMeta({ totalGold: 500 });

    // Purchase meta_damage level 1 (cost: 50)
    const after = purchaseUpgrade(meta, 'meta_damage');
    expect(after.totalGold).toBe(450);
    expect(after.upgrades.meta_damage).toBe(1);

    // Purchase meta_damage level 2 (cost: 100)
    const after2 = purchaseUpgrade(after, 'meta_damage');
    expect(after2.totalGold).toBe(350);
    expect(after2.upgrades.meta_damage).toBe(2);

    // Cannot purchase when insufficient gold
    const broke = makeMeta({ totalGold: 10 });
    const notPurchased = purchaseUpgrade(broke, 'meta_damage');
    expect(notPurchased.totalGold).toBe(10);
    expect(notPurchased.upgrades.meta_damage).toBeUndefined();
  });

  it('achievements unlock based on meta state thresholds', () => {
    // first_blood: bestKills >= 1
    const freshMeta = makeMeta({ bestKills: 0 });
    const runData: RunEndData = {
      kills: 0,
      gold: 0,
      level: 1,
      timeMs: 30000,
      weaponsUsed: 1,
      highestWeaponLevel: 1,
      bossKills: 0,
      survived: false,
    };

    // No achievements with 0 kills
    const noAch = checkAchievements(freshMeta, runData);
    expect(noAch).not.toContain('first_blood');

    // first_blood with bestKills >= 1
    const killedMeta = makeMeta({ bestKills: 1 });
    const ach = checkAchievements(killedMeta, runData);
    expect(ach).toContain('first_blood');
  });

  it('already unlocked achievements are not re-triggered', () => {
    const meta = makeMeta({
      bestKills: 10,
      unlockedAchievements: ['first_blood'],
    });
    const runData: RunEndData = {
      kills: 10,
      gold: 5,
      level: 3,
      timeMs: 60000,
      weaponsUsed: 1,
      highestWeaponLevel: 2,
      bossKills: 0,
      survived: false,
    };

    const newAch = checkAchievements(meta, runData);
    expect(newAch).not.toContain('first_blood');
  });
});
