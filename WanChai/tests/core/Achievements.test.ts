import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, checkAchievements, getAchievementProgress } from '../../src/core/Achievements';
import type { MetaState, RunEndData } from '../../src/types/game';
import { BALANCE } from '../../src/config/balance';

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

describe('ACHIEVEMENTS definitions', () => {
  it('has exactly 15 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS)).toHaveLength(15);
  });

  it('all achievements have required fields', () => {
    for (const def of Object.values(ACHIEVEMENTS)) {
      expect(def.id).toBeTruthy();
      expect(def.category).toMatch(/^(combat|economy|progression|collection)$/);
      expect(def.nameKey).toBeTruthy();
      expect(def.descKey).toBeTruthy();
      expect(def.target).toBeGreaterThan(0);
      expect(def.goldReward).toBeGreaterThan(0);
      expect(typeof def.getProgress).toBe('function');
    }
  });

  it('gold rewards match balance constants', () => {
    expect(ACHIEVEMENTS.first_blood.goldReward).toBe(BALANCE.ACHIEVEMENTS.firstBloodGold);
    expect(ACHIEVEMENTS.hunter_100.goldReward).toBe(BALANCE.ACHIEVEMENTS.hunter100Gold);
    expect(ACHIEVEMENTS.legend.goldReward).toBe(BALANCE.ACHIEVEMENTS.legendGold);
  });
});

describe('checkAchievements — combat category', () => {
  it('first_blood unlocks at 1 kill', () => {
    const meta = makeMeta({ bestKills: 1 });
    const run = makeRun({ kills: 1 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('first_blood');
  });

  it('first_blood does NOT unlock at 0 kills', () => {
    const meta = makeMeta({ bestKills: 0 });
    const run = makeRun({ kills: 0 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('first_blood');
  });

  it('hunter_100 unlocks at 100 kills', () => {
    const meta = makeMeta({ bestKills: 100 });
    const run = makeRun({ kills: 100 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('hunter_100');
  });

  it('hunter_1000 unlocks at 1000 kills', () => {
    const meta = makeMeta({ bestKills: 1000 });
    const run = makeRun({ kills: 1000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('hunter_1000');
  });

  it('boss_slayer unlocks at 10 boss kills', () => {
    const meta = makeMeta({ totalBossKills: 10 });
    const run = makeRun({ bossKills: 1 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('boss_slayer');
  });

  it('boss_slayer does NOT unlock at 9 boss kills', () => {
    const meta = makeMeta({ totalBossKills: 9 });
    const run = makeRun({ bossKills: 1 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('boss_slayer');
  });
});

describe('checkAchievements — economy category', () => {
  it('gold_hoarder unlocks at 1000 total gold earned', () => {
    const meta = makeMeta({ totalGoldEarned: 1000 });
    const run = makeRun({ gold: 100 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('gold_hoarder');
  });

  it('pacifist_gold unlocks at 5000 total gold earned', () => {
    const meta = makeMeta({ totalGoldEarned: 5000 });
    const run = makeRun({ gold: 200 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('pacifist_gold');
  });
});

describe('checkAchievements — progression category', () => {
  it('veteran_10 unlocks at 10 runs', () => {
    const meta = makeMeta({ runsCompleted: 10 });
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('veteran_10');
  });

  it('max_level unlocks at level 20', () => {
    const meta = makeMeta({ bestLevel: 20 });
    const run = makeRun({ level: 20 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('max_level');
  });

  it('survivor_5min unlocks at 300000ms', () => {
    const meta = makeMeta({ bestTimeMs: 300000 });
    const run = makeRun({ timeMs: 300000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('survivor_5min');
  });

  it('speedrun unlocks when survived in under 3min', () => {
    const meta = makeMeta({ bestTimeMs: 170000 });
    const run = makeRun({ survived: true, timeMs: 170000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('speedrun');
  });

  it('speedrun does NOT unlock if not survived', () => {
    const meta = makeMeta({ bestTimeMs: 170000 });
    const run = makeRun({ survived: false, timeMs: 170000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('speedrun');
  });

  it('speedrun does NOT unlock if time exceeds 3min', () => {
    const meta = makeMeta({ bestTimeMs: 200000 });
    const run = makeRun({ survived: true, timeMs: 200000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('speedrun');
  });

  it('legend unlocks at 30 runs', () => {
    const meta = makeMeta({ runsCompleted: 30 });
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('legend');
  });

  it('meta_max unlocks when a meta upgrade hits max level', () => {
    const meta = makeMeta({ upgrades: { meta_xp: 3 } }); // meta_xp maxLevel = 3
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('meta_max');
  });

  it('meta_max does NOT unlock when no upgrade is maxed', () => {
    const meta = makeMeta({ upgrades: { meta_xp: 2, meta_damage: 4 } });
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('meta_max');
  });
});

describe('checkAchievements — collection category', () => {
  it('weapon_master unlocks with highest weapon level 5 (T2 evolution)', () => {
    const meta = makeMeta({ bestKills: 50 });
    const run = makeRun({ highestWeaponLevel: 5 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('weapon_master');
  });

  it('weapon_master does NOT unlock at weapon level 4', () => {
    const meta = makeMeta();
    const run = makeRun({ highestWeaponLevel: 4 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('weapon_master');
  });

  it('full_house unlocks with 5 weapons used', () => {
    const meta = makeMeta();
    const run = makeRun({ weaponsUsed: 5 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('full_house');
  });

  it('all_characters unlocks when all 5 characters are unlocked', () => {
    const meta = makeMeta({
      runsCompleted: 10, // sol: >= 3
      totalGoldEarned: 1000, // mei: >= 500
      bestKills: 500, // kai: >= 200
    });
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('all_characters');
  });

  it('all_characters does NOT unlock with only partial unlocks', () => {
    const meta = makeMeta({
      runsCompleted: 2, // sol not unlocked (needs 3)
      totalGoldEarned: 400, // mei not unlocked (needs 500)
      bestKills: 100, // kai not unlocked (needs 200)
    });
    const run = makeRun();
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('all_characters');
  });
});

describe('checkAchievements — already unlocked filter', () => {
  it('does NOT return already-unlocked achievements', () => {
    const meta = makeMeta({
      bestKills: 500,
      unlockedAchievements: ['first_blood', 'hunter_100'],
    });
    const run = makeRun({ kills: 500 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).not.toContain('first_blood');
    expect(unlocked).not.toContain('hunter_100');
  });

  it('returns newly eligible achievements even if others are already unlocked', () => {
    const meta = makeMeta({
      bestKills: 1000,
      unlockedAchievements: ['first_blood', 'hunter_100'],
    });
    const run = makeRun({ kills: 1000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('hunter_1000');
  });
});

describe('getAchievementProgress', () => {
  it('returns correct progress for hunter_100', () => {
    const meta = makeMeta({ bestKills: 42 });
    const prog = getAchievementProgress(meta, 'hunter_100');
    expect(prog.current).toBe(42);
    expect(prog.target).toBe(100);
  });

  it('clamps progress to target (no overshoot)', () => {
    const meta = makeMeta({ bestKills: 999 });
    const prog = getAchievementProgress(meta, 'hunter_100');
    expect(prog.current).toBe(100);
    expect(prog.target).toBe(100);
  });

  it('returns {0,0} for unknown achievement', () => {
    const prog = getAchievementProgress(makeMeta(), 'nonexistent_ach');
    expect(prog.current).toBe(0);
    expect(prog.target).toBe(0);
  });

  it('tracks run-based achievements with runData', () => {
    const meta = makeMeta();
    const run = makeRun({ weaponsUsed: 3 });
    const prog = getAchievementProgress(meta, 'full_house', run);
    expect(prog.current).toBe(3);
    expect(prog.target).toBe(5);
  });
});

describe('multiple achievements at once', () => {
  it('can unlock multiple achievements in a single run', () => {
    const meta = makeMeta({
      bestKills: 100,
      totalGoldEarned: 1000,
      runsCompleted: 10,
      bestTimeMs: 300000,
    });
    const run = makeRun({ kills: 100, gold: 200, timeMs: 300000 });
    const unlocked = checkAchievements(meta, run);
    expect(unlocked).toContain('first_blood');
    expect(unlocked).toContain('hunter_100');
    expect(unlocked).toContain('gold_hoarder');
    expect(unlocked).toContain('veteran_10');
    expect(unlocked).toContain('survivor_5min');
    expect(unlocked.length).toBeGreaterThanOrEqual(5);
  });
});
