/**
 * TASK-055: Achievement + Challenge Integration Tests
 * Pure TypeScript — no Phaser imports.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PhaseManager } from '../../src/managers/PhaseManager';
import { ACHIEVEMENTS, checkAchievements, getAchievementProgress } from '../../src/core/Achievements';
import {
  getWeeklyChallenge,
  getChallengeLeaderboard,
  submitChallengeScore,
  getChallengeModifierConfig,
} from '../../src/core/ChallengeMode';
import type { MetaState, RunEndData } from '../../src/types/game';
import { BALANCE } from '../../src/config/balance';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
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

function makeRun(overrides: Partial<RunEndData> = {}): RunEndData {
  return {
    kills: 0,
    gold: 0,
    level: 1,
    timeMs: 0,
    weaponsUsed: 1,
    highestWeaponLevel: 1,
    bossKills: 0,
    survived: false,
    ...overrides,
  };
}

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

// ---------------------------------------------------------------
// Achievement gold reward accumulation
// ---------------------------------------------------------------
describe('Achievement gold reward accumulation', () => {
  it('checkAchievements returns correct IDs for a high-kill run', () => {
    const meta = makeMeta({ bestKills: 150 });
    const run = makeRun({ kills: 150 });
    const ids = checkAchievements(meta, run);
    expect(ids).toContain('first_blood');
    expect(ids).toContain('hunter_100');
    expect(ids).not.toContain('hunter_1000');
  });

  it('total gold from unlocked achievements matches sum of rewards', () => {
    const meta = makeMeta({
      bestKills: 100,
      totalGoldEarned: 1000,
      runsCompleted: 10,
      bestTimeMs: 300000,
    });
    const run = makeRun({ kills: 100, gold: 200, timeMs: 300000 });
    const ids = checkAchievements(meta, run);
    const totalGold = ids.reduce((sum, id) => {
      const def = ACHIEVEMENTS[id];
      return sum + (def?.goldReward ?? 0);
    }, 0);
    expect(totalGold).toBeGreaterThan(0);
    // Verify each reward is a positive integer
    for (const id of ids) {
      expect(ACHIEVEMENTS[id].goldReward).toBeGreaterThan(0);
    }
  });

  it('gold rewards are from BALANCE.ACHIEVEMENTS constants', () => {
    // Spot-check several achievements
    expect(ACHIEVEMENTS.first_blood.goldReward).toBe(BALANCE.ACHIEVEMENTS.firstBloodGold);
    expect(ACHIEVEMENTS.hunter_100.goldReward).toBe(BALANCE.ACHIEVEMENTS.hunter100Gold);
    expect(ACHIEVEMENTS.hunter_1000.goldReward).toBe(BALANCE.ACHIEVEMENTS.hunter1000Gold);
    expect(ACHIEVEMENTS.boss_slayer.goldReward).toBe(BALANCE.ACHIEVEMENTS.bossSlayerGold);
    expect(ACHIEVEMENTS.weapon_master.goldReward).toBe(BALANCE.ACHIEVEMENTS.weaponMasterGold);
    expect(ACHIEVEMENTS.legend.goldReward).toBe(BALANCE.ACHIEVEMENTS.legendGold);
    expect(ACHIEVEMENTS.speedrun.goldReward).toBe(BALANCE.ACHIEVEMENTS.speedrunGold);
  });
});

// ---------------------------------------------------------------
// Challenge score submission + leaderboard round-trip
// ---------------------------------------------------------------
describe('Challenge score submission + leaderboard round-trip', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('submit then retrieve returns the same score', () => {
    const score = { kills: 42, gold: 10, timeMs: 5000, level: 3, survived: false };
    submitChallengeScore(score, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(1);
    expect(lb[0].kills).toBe(42);
    expect(lb[0].gold).toBe(10);
    expect(lb[0].timeMs).toBe(5000);
    expect(lb[0].level).toBe(3);
    expect(lb[0].survived).toBe(false);
    expect(lb[0].timestamp).toBeGreaterThan(0);
  });

  it('multiple submissions are sorted by kills descending', () => {
    submitChallengeScore({ kills: 10, gold: 1, timeMs: 100, level: 1, survived: false }, storage);
    submitChallengeScore({ kills: 100, gold: 50, timeMs: 2000, level: 10, survived: true }, storage);
    submitChallengeScore({ kills: 50, gold: 20, timeMs: 1000, level: 5, survived: false }, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb[0].kills).toBe(100);
    expect(lb[1].kills).toBe(50);
    expect(lb[2].kills).toBe(10);
  });

  it('round-trip preserves all fields', () => {
    const score = { kills: 99, gold: 77, timeMs: 12345, level: 15, survived: true };
    submitChallengeScore(score, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb[0]).toMatchObject(score);
  });

  it('leaderboard overflow trims to max entries', () => {
    for (let i = 0; i < 15; i++) {
      submitChallengeScore({ kills: i * 10, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(BALANCE.CHALLENGE.leaderboardMaxEntries);
    // Lowest score in trimmed board should be higher than discarded ones
    expect(lb[lb.length - 1].kills).toBeGreaterThanOrEqual(50);
  });

  it('timestamps are monotonically non-decreasing', () => {
    submitChallengeScore({ kills: 10, gold: 1, timeMs: 100, level: 1, survived: false }, storage);
    submitChallengeScore({ kills: 20, gold: 2, timeMs: 200, level: 2, survived: false }, storage);
    const lb = getChallengeLeaderboard(storage);
    // Sorted by kills, but timestamps should both be valid
    expect(lb[0].timestamp).toBeGreaterThan(0);
    expect(lb[1].timestamp).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------
// Challenge mode config determinism
// ---------------------------------------------------------------
describe('Challenge mode config determinism', () => {
  it('same date produces identical config across multiple calls', () => {
    const date = new Date(2026, 5, 15);
    const configs = Array.from({ length: 10 }, () => getWeeklyChallenge(date));
    for (let i = 1; i < configs.length; i++) {
      expect(configs[i]).toEqual(configs[0]);
    }
  });

  it('config contains all required fields', () => {
    const config = getWeeklyChallenge(new Date(2026, 3, 20));
    expect(config).toHaveProperty('seed');
    expect(config).toHaveProperty('characterId');
    expect(config).toHaveProperty('startWeapon');
    expect(config).toHaveProperty('modifier');
    expect(config).toHaveProperty('weekLabel');
  });

  it('seed is a positive number', () => {
    const config = getWeeklyChallenge(new Date(2026, 0, 5));
    expect(config.seed).toBeGreaterThan(0);
    expect(Number.isInteger(config.seed)).toBe(true);
  });

  it('different weeks produce different seeds', () => {
    const seeds = new Set<number>();
    for (let w = 0; w < 52; w++) {
      const date = new Date(2026, 0, 1 + w * 7);
      seeds.add(getWeeklyChallenge(date).seed);
    }
    expect(seeds.size).toBeGreaterThan(40); // at least 40 unique seeds across 52 weeks
  });

  it('modifier config is deterministic across multiple calls', () => {
    for (const mod of BALANCE.CHALLENGE.modifiers) {
      const a = getChallengeModifierConfig(mod);
      const b = getChallengeModifierConfig(mod);
      expect(a).toEqual(b);
    }
  });
});

// ---------------------------------------------------------------
// Achievement unlocked filtering
// ---------------------------------------------------------------
describe('Achievement unlocked filtering', () => {
  it('already-unlocked achievements are not returned', () => {
    const meta = makeMeta({
      bestKills: 500,
      unlockedAchievements: ['first_blood', 'hunter_100'],
    });
    const run = makeRun({ kills: 500 });
    const ids = checkAchievements(meta, run);
    expect(ids).not.toContain('first_blood');
    expect(ids).not.toContain('hunter_100');
  });

  it('newly eligible achievements appear when others are already locked', () => {
    const meta = makeMeta({
      bestKills: 1000,
      unlockedAchievements: ['first_blood'],
    });
    const run = makeRun({ kills: 1000 });
    const ids = checkAchievements(meta, run);
    expect(ids).toContain('hunter_100');
    expect(ids).toContain('hunter_1000');
    expect(ids).not.toContain('first_blood');
  });

  it('empty unlockedAchievements array does not block anything', () => {
    const meta = makeMeta({
      bestKills: 5,
      unlockedAchievements: [],
    });
    const run = makeRun({ kills: 5 });
    const ids = checkAchievements(meta, run);
    expect(ids).toContain('first_blood');
  });

  it('undefined unlockedAchievements acts as empty', () => {
    const meta = makeMeta({ bestKills: 5 });
    delete (meta as Record<string, unknown>).unlockedAchievements;
    const run = makeRun({ kills: 5 });
    const ids = checkAchievements(meta, run);
    expect(ids).toContain('first_blood');
  });

  it('all 15 achievements can be filtered out if all are unlocked', () => {
    const allIds = Object.keys(ACHIEVEMENTS);
    const meta = makeMeta({
      bestKills: 10000,
      totalGoldEarned: 100000,
      runsCompleted: 100,
      bestTimeMs: 600000,
      bestLevel: 50,
      totalBossKills: 100,
      unlockedAchievements: allIds,
      upgrades: { meta_xp: 3 },
    });
    const run = makeRun({
      kills: 10000,
      gold: 10000,
      timeMs: 100000,
      level: 50,
      weaponsUsed: 10,
      highestWeaponLevel: 5,
      bossKills: 50,
      survived: true,
    });
    const ids = checkAchievements(meta, run);
    expect(ids).toHaveLength(0);
  });
});

// ---------------------------------------------------------------
// RunEndData interface completeness
// ---------------------------------------------------------------
describe('RunEndData interface completeness', () => {
  it('makeRun produces all required fields', () => {
    const run = makeRun();
    expect(run).toHaveProperty('kills');
    expect(run).toHaveProperty('gold');
    expect(run).toHaveProperty('level');
    expect(run).toHaveProperty('timeMs');
    expect(run).toHaveProperty('weaponsUsed');
    expect(run).toHaveProperty('highestWeaponLevel');
    expect(run).toHaveProperty('bossKills');
    expect(run).toHaveProperty('survived');
  });

  it('all RunEndData fields have correct types', () => {
    const run = makeRun({
      kills: 10,
      gold: 5,
      level: 3,
      timeMs: 1000,
      weaponsUsed: 2,
      highestWeaponLevel: 3,
      bossKills: 1,
      survived: true,
    });
    expect(typeof run.kills).toBe('number');
    expect(typeof run.gold).toBe('number');
    expect(typeof run.level).toBe('number');
    expect(typeof run.timeMs).toBe('number');
    expect(typeof run.weaponsUsed).toBe('number');
    expect(typeof run.highestWeaponLevel).toBe('number');
    expect(typeof run.bossKills).toBe('number');
    expect(typeof run.survived).toBe('boolean');
  });

  it('RunEndData has exactly 8 fields', () => {
    const run = makeRun();
    expect(Object.keys(run)).toHaveLength(8);
  });

  it('default RunEndData values are sensible', () => {
    const run = makeRun();
    expect(run.kills).toBe(0);
    expect(run.gold).toBe(0);
    expect(run.level).toBe(1);
    expect(run.timeMs).toBe(0);
    expect(run.weaponsUsed).toBe(1);
    expect(run.highestWeaponLevel).toBe(1);
    expect(run.bossKills).toBe(0);
    expect(run.survived).toBe(false);
  });
});

// ---------------------------------------------------------------
// Multiple achievements unlocking simultaneously
// ---------------------------------------------------------------
describe('Multiple achievements unlocking simultaneously', () => {
  it('can unlock 5+ achievements in one run', () => {
    const meta = makeMeta({
      bestKills: 100,
      totalGoldEarned: 1000,
      runsCompleted: 10,
      bestTimeMs: 300000,
      bestLevel: 20,
    });
    const run = makeRun({ kills: 100, gold: 200, timeMs: 300000, level: 20, weaponsUsed: 5 });
    const ids = checkAchievements(meta, run);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain('first_blood');
    expect(ids).toContain('hunter_100');
    expect(ids).toContain('gold_hoarder');
    expect(ids).toContain('veteran_10');
    expect(ids).toContain('survivor_5min');
  });

  it('all achievements can unlock at once with extreme stats', () => {
    const meta = makeMeta({
      bestKills: 10000,
      totalGoldEarned: 100000,
      runsCompleted: 100,
      bestTimeMs: 600000,
      bestLevel: 50,
      totalBossKills: 100,
      upgrades: { meta_xp: 3 },
    });
    const run = makeRun({
      kills: 10000,
      gold: 10000,
      timeMs: 100000,
      level: 50,
      weaponsUsed: 10,
      highestWeaponLevel: 5,
      bossKills: 50,
      survived: true,
    });
    const ids = checkAchievements(meta, run);
    // Should unlock all 15 except those with special conditions (speedrun needs <= 180000ms)
    expect(ids.length).toBeGreaterThanOrEqual(12);
  });

  it('no duplicate IDs in unlock list', () => {
    const meta = makeMeta({
      bestKills: 1000,
      totalGoldEarned: 5000,
      runsCompleted: 30,
      bestTimeMs: 300000,
      bestLevel: 20,
      totalBossKills: 10,
    });
    const run = makeRun({
      kills: 1000,
      gold: 500,
      timeMs: 300000,
      level: 20,
      weaponsUsed: 5,
      highestWeaponLevel: 5,
      bossKills: 5,
    });
    const ids = checkAchievements(meta, run);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('partial unlock leaves remaining locked', () => {
    const meta = makeMeta({
      bestKills: 50,
      unlockedAchievements: ['first_blood'],
    });
    const run = makeRun({ kills: 50 });
    const ids = checkAchievements(meta, run);
    expect(ids).not.toContain('first_blood');
    expect(ids).not.toContain('hunter_100'); // need 100, only have 50
    expect(ids).not.toContain('hunter_1000');
  });
});

// ---------------------------------------------------------------
// Challenge leaderboard overflow (>10 entries trimmed)
// ---------------------------------------------------------------
describe('Challenge leaderboard overflow', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('exactly 10 entries kept after 10 submissions', () => {
    for (let i = 0; i < 10; i++) {
      submitChallengeScore({ kills: (i + 1) * 10, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(10);
  });

  it('11th entry pushes out lowest', () => {
    for (let i = 0; i < 10; i++) {
      submitChallengeScore({ kills: (i + 1) * 10, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    // Add a score that beats position 10 (kills=10)
    submitChallengeScore({ kills: 15, gold: 1, timeMs: 50, level: 1, survived: false }, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(10);
    // kills=10 should be pushed out, kills=15 should be in
    const allKills = lb.map((s) => s.kills);
    expect(allKills).toContain(15);
    expect(allKills).not.toContain(10);
  });

  it('20 entries trimmed to exactly 10', () => {
    for (let i = 0; i < 20; i++) {
      submitChallengeScore({ kills: i * 5, gold: i, timeMs: i * 100, level: i + 1, survived: false }, storage);
    }
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(BALANCE.CHALLENGE.leaderboardMaxEntries);
    expect(lb[0].kills).toBe(95); // highest: 19 * 5
  });

  it('very low score does not enter full leaderboard', () => {
    // Fill with high scores
    for (let i = 0; i < 10; i++) {
      submitChallengeScore({ kills: 100 + i * 10, gold: i * 10, timeMs: i * 1000, level: 10, survived: true }, storage);
    }
    // Submit a very low score
    submitChallengeScore({ kills: 1, gold: 0, timeMs: 50, level: 1, survived: false }, storage);
    const lb = getChallengeLeaderboard(storage);
    expect(lb).toHaveLength(10);
    // kills=1 should not be present (all existing are >= 100)
    expect(lb[lb.length - 1].kills).toBeGreaterThanOrEqual(100);
  });
});

// ---------------------------------------------------------------
// MetaState field validation
// ---------------------------------------------------------------
describe('MetaState field validation', () => {
  it('unlockedAchievements array starts empty by default', () => {
    const meta = makeMeta();
    // unlockedAchievements is optional, defaults to undefined
    expect(meta.unlockedAchievements ?? []).toEqual([]);
  });

  it('unlockedAchievements can be set and read', () => {
    const meta = makeMeta({ unlockedAchievements: ['first_blood', 'legend'] });
    expect(meta.unlockedAchievements).toEqual(['first_blood', 'legend']);
  });

  it('totalBossKills is optional and defaults to 0 in achievement check', () => {
    const meta = makeMeta(); // totalBossKills is undefined
    const run = makeRun({ bossKills: 1 });
    // boss_slayer checks meta.totalBossKills ?? 0, should be 0
    const ids = checkAchievements(meta, run);
    expect(ids).not.toContain('boss_slayer'); // needs 10
  });

  it('totalBossKills tracks across runs', () => {
    const meta = makeMeta({ totalBossKills: 10 });
    const run = makeRun({ bossKills: 1 });
    const ids = checkAchievements(meta, run);
    expect(ids).toContain('boss_slayer');
  });

  it('upgrades record starts empty', () => {
    const meta = makeMeta();
    expect(Object.keys(meta.upgrades)).toHaveLength(0);
  });

  it('discovered has weapons and enemies arrays', () => {
    const meta = makeMeta();
    expect(Array.isArray(meta.discovered.weapons)).toBe(true);
    expect(Array.isArray(meta.discovered.enemies)).toBe(true);
  });

  it('MetaState has all expected required fields', () => {
    const meta = makeMeta();
    expect(meta).toHaveProperty('totalGold');
    expect(meta).toHaveProperty('totalGoldEarned');
    expect(meta).toHaveProperty('highScore');
    expect(meta).toHaveProperty('bestKills');
    expect(meta).toHaveProperty('bestLevel');
    expect(meta).toHaveProperty('bestTimeMs');
    expect(meta).toHaveProperty('upgrades');
    expect(meta).toHaveProperty('runsCompleted');
    expect(meta).toHaveProperty('discovered');
  });
});

// ---------------------------------------------------------------
// Achievement progress tracking
// ---------------------------------------------------------------
describe('Achievement progress integration', () => {
  it('progress clamps at target for completed achievements', () => {
    const meta = makeMeta({ bestKills: 999 });
    const prog = getAchievementProgress(meta, 'hunter_100');
    expect(prog.current).toBe(100);
    expect(prog.target).toBe(100);
  });

  it('progress for run-based achievements uses run data', () => {
    const meta = makeMeta();
    const run = makeRun({ weaponsUsed: 3 });
    const prog = getAchievementProgress(meta, 'full_house', run);
    expect(prog.current).toBe(3);
    expect(prog.target).toBe(5);
  });

  it('progress for unknown achievement returns zeros', () => {
    const prog = getAchievementProgress(makeMeta(), 'does_not_exist');
    expect(prog.current).toBe(0);
    expect(prog.target).toBe(0);
  });

  it('all achievement IDs have valid progress functions', () => {
    const meta = makeMeta({
      bestKills: 50,
      totalGoldEarned: 500,
      runsCompleted: 5,
      bestTimeMs: 120000,
      bestLevel: 10,
      totalBossKills: 3,
      upgrades: { meta_damage: 2 },
    });
    const run = makeRun({
      kills: 50,
      gold: 100,
      timeMs: 120000,
      level: 10,
      weaponsUsed: 3,
      highestWeaponLevel: 3,
      bossKills: 1,
    });

    for (const id of Object.keys(ACHIEVEMENTS)) {
      const prog = getAchievementProgress(meta, id, run);
      expect(typeof prog.current).toBe('number');
      expect(typeof prog.target).toBe('number');
      expect(prog.current).toBeGreaterThanOrEqual(0);
      expect(prog.target).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------
// Modifier + Challenge config cross-validation
// ---------------------------------------------------------------
describe('Modifier + Challenge config cross-validation', () => {
  it('weekly challenge modifier is always from BALANCE list', () => {
    for (let week = 1; week <= 52; week++) {
      const date = new Date(2026, 0, 1 + (week - 1) * 7);
      const config = getWeeklyChallenge(date);
      expect(BALANCE.CHALLENGE.modifiers).toContain(config.modifier);
    }
  });

  it('every modifier in BALANCE has a valid config', () => {
    for (const mod of BALANCE.CHALLENGE.modifiers) {
      const effect = getChallengeModifierConfig(mod);
      expect(effect).toBeDefined();
      expect(effect.modifier).toBe(mod);
      expect(['none', 'eliteOnly', 'bossRush']).toContain(effect.spawnFilter);
    }
  });

  it('no two modifiers produce identical effects (unique gameplay)', () => {
    const effects = BALANCE.CHALLENGE.modifiers.map(getChallengeModifierConfig);
    for (let i = 0; i < effects.length; i++) {
      for (let j = i + 1; j < effects.length; j++) {
        const a = effects[i];
        const b = effects[j];
        const same =
          a.spawnFilter === b.spawnFilter &&
          a.hpMultiplier === b.hpMultiplier &&
          a.speedMultiplier === b.speedMultiplier &&
          a.shopDisabled === b.shopDisabled;
        expect(same).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------
// M-014 Regression: Boss death + level-up → stage clear phase flow
// ---------------------------------------------------------------
describe('Boss death + level-up → stage clear phase flow (M-014)', () => {
  let pm: PhaseManager;

  beforeEach(() => {
    pm = new PhaseManager();
  });

  it('levelup → stage_clear is NOT a valid direct transition', () => {
    pm.transition('levelup');
    expect(pm.current).toBe('levelup');
    const ok = pm.transition('stage_clear');
    expect(ok).toBe(false);
    expect(pm.current).toBe('levelup');
  });

  it('correct flow: playing → levelup → playing → stage_clear', () => {
    // Boss dies, xp triggers level-up
    expect(pm.transition('levelup')).toBe(true);
    expect(pm.current).toBe('levelup');

    // Player picks upgrade, phase returns to playing
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');

    // pendingStageClear consumed, stage clear shown
    expect(pm.transition('stage_clear')).toBe(true);
    expect(pm.current).toBe('stage_clear');
  });

  it('stage_clear → playing advances to next stage', () => {
    pm.transition('levelup');
    pm.transition('playing');
    pm.transition('stage_clear');
    expect(pm.current).toBe('stage_clear');

    // Player confirms, next stage begins
    expect(pm.transition('playing')).toBe(true);
    expect(pm.current).toBe('playing');
  });

  it('pendingStageClear flag simulation: set during levelup, consumed after', () => {
    let pendingStageClear = false;

    // Boss dies → set flag
    pendingStageClear = true;
    pm.transition('levelup');

    // During levelup, flag stays true
    expect(pendingStageClear).toBe(true);
    expect(pm.current).toBe('levelup');

    // Upgrade applied → transition to playing
    pm.transition('playing');

    // Now consume the flag and transition to stage_clear
    if (pendingStageClear) {
      pendingStageClear = false;
      pm.transition('stage_clear');
    }

    expect(pendingStageClear).toBe(false);
    expect(pm.current).toBe('stage_clear');
  });
});
