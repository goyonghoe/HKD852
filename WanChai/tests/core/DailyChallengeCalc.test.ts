import { describe, it, expect } from 'vitest';
import {
  hashString,
  makeSeededRng,
  getUtcDateStr,
  isDailyValid,
  generateDailyChallenges,
  initChallengeProgress,
  updateChallengeProgress,
  claimChallengeReward,
  totalClaimablePrestige,
  countCompletedChallenges,
  createTodaysSave,
  getOrRefreshDailySave,
  type RunResultForChallenge,
} from '../../src/core/DailyChallengeCalc';
import { BALANCE } from '../../src/config/balance';
import type { ChallengeDef, DailyChallengeSave } from '../../src/types/game';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRun(overrides: Partial<RunResultForChallenge> = {}): RunResultForChallenge {
  return {
    weaponDamageMap: {},
    runTimeMs: 0,
    highestStage: 1,
    xpOrbsCollected: 0,
    usedShop: false,
    levelReached: 1,
    totalDamageDealt: 0,
    characterId: 'hai',
    survived: false,
    bossKills: 0,
    weaponKillMap: {},
    ...overrides,
  };
}

// ── hashString ────────────────────────────────────────────────────────────────

describe('hashString', () => {
  it('returns a non-negative integer', () => {
    expect(hashString('2026-03-06')).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — same input same output', () => {
    expect(hashString('2026-03-06')).toBe(hashString('2026-03-06'));
  });

  it('different inputs produce different outputs (no collision for dates)', () => {
    expect(hashString('2026-03-06')).not.toBe(hashString('2026-03-07'));
    expect(hashString('2026-03-06')).not.toBe(hashString('2026-03-05'));
  });

  it('handles empty string', () => {
    expect(typeof hashString('')).toBe('number');
  });
});

// ── makeSeededRng ─────────────────────────────────────────────────────────────

describe('makeSeededRng', () => {
  it('returns values in [0, 1)', () => {
    const rng = makeSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const rng1 = makeSeededRng(12345);
    const rng2 = makeSeededRng(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = makeSeededRng(1);
    const rng2 = makeSeededRng(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

// ── getUtcDateStr ─────────────────────────────────────────────────────────────

describe('getUtcDateStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2026-03-06T14:30:00Z');
    expect(getUtcDateStr(d)).toBe('2026-03-06');
  });

  it('uses UTC not local time', () => {
    // 2026-03-06T23:59:59Z → still 2026-03-06 in UTC
    const d = new Date('2026-03-06T23:59:59Z');
    expect(getUtcDateStr(d)).toBe('2026-03-06');
  });

  it('rolls to next day at midnight UTC', () => {
    const d = new Date('2026-03-07T00:00:00Z');
    expect(getUtcDateStr(d)).toBe('2026-03-07');
  });

  it('pads month and day with zeros', () => {
    const d = new Date('2026-01-05T00:00:00Z');
    expect(getUtcDateStr(d)).toBe('2026-01-05');
  });
});

// ── isDailyValid ──────────────────────────────────────────────────────────────

describe('isDailyValid', () => {
  it('returns true when dateStr matches today UTC', () => {
    const today = new Date('2026-03-06T10:00:00Z');
    const save: DailyChallengeSave = {
      dateStr: '2026-03-06',
      challenges: [],
      progress: {},
    };
    expect(isDailyValid(save, today)).toBe(true);
  });

  it('returns false when dateStr is yesterday', () => {
    const today = new Date('2026-03-06T10:00:00Z');
    const save: DailyChallengeSave = {
      dateStr: '2026-03-05',
      challenges: [],
      progress: {},
    };
    expect(isDailyValid(save, today)).toBe(false);
  });

  it('returns false when dateStr is tomorrow', () => {
    const today = new Date('2026-03-06T10:00:00Z');
    const save: DailyChallengeSave = {
      dateStr: '2026-03-07',
      challenges: [],
      progress: {},
    };
    expect(isDailyValid(save, today)).toBe(false);
  });
});

// ── generateDailyChallenges ───────────────────────────────────────────────────

describe('generateDailyChallenges', () => {
  it('returns exactly challengesPerDay challenges', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    expect(challenges.length).toBe(BALANCE.DAILY_CHALLENGE.challengesPerDay);
  });

  it('is deterministic — same date produces same challenges', () => {
    const c1 = generateDailyChallenges('2026-03-06');
    const c2 = generateDailyChallenges('2026-03-06');
    expect(c1.map((c) => c.id)).toEqual(c2.map((c) => c.id));
    expect(c1.map((c) => c.type)).toEqual(c2.map((c) => c.type));
  });

  it('different dates produce different challenges', () => {
    const c1 = generateDailyChallenges('2026-03-06');
    const c2 = generateDailyChallenges('2026-03-07');
    // At minimum the IDs should differ (they embed the date)
    expect(c1.map((c) => c.id)).not.toEqual(c2.map((c) => c.id));
  });

  it('all challenge types are valid', () => {
    const validTypes = [
      'kill_with_weapon',
      'survive_minutes',
      'defeat_boss_stage',
      'collect_xp_orbs',
      'no_shop_run',
      'reach_level',
      'deal_total_damage',
      'complete_with_character',
    ];
    const challenges = generateDailyChallenges('2026-03-06');
    for (const c of challenges) {
      expect(validTypes).toContain(c.type);
    }
  });

  it('all challenges have valid difficulty', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    for (const c of challenges) {
      expect(['easy', 'medium', 'hard']).toContain(c.difficulty);
    }
  });

  it('challenge types within a day are distinct (no repeats)', () => {
    // Run many dates and check — allows for rare collision but should hold for common dates
    const dates = ['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'];
    for (const date of dates) {
      const challenges = generateDailyChallenges(date);
      const types = challenges.map((c) => c.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    }
  });

  it('all challenges have positive prestigeReward', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    for (const c of challenges) {
      expect(c.prestigeReward).toBeGreaterThan(0);
    }
  });

  it('challenges have IDs containing the date string', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    for (const c of challenges) {
      expect(c.id).toContain('2026-03-06');
    }
  });

  it('first challenge has easy difficulty, second medium, third hard', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    expect(challenges[0].difficulty).toBe('easy');
    expect(challenges[1].difficulty).toBe('medium');
    expect(challenges[2].difficulty).toBe('hard');
  });

  it('kill_with_weapon challenge has a valid weaponId', () => {
    // Generate many dates until we get a kill_with_weapon challenge
    let found = false;
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
      const challenges = generateDailyChallenges(dateStr);
      const kwChallenge = challenges.find((c) => c.type === 'kill_with_weapon');
      if (kwChallenge) {
        expect(BALANCE.DAILY_CHALLENGE.weaponPool).toContain(kwChallenge.params.weaponId);
        found = true;
        break;
      }
    }
    if (!found) {
      // If we didn't find it in 30 days, skip (very unlikely with 8 types and 3 picks)
      expect(true).toBe(true);
    }
  });

  it('complete_with_character challenge has a valid characterId', () => {
    let found = false;
    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
      const challenges = generateDailyChallenges(dateStr);
      const cwcChallenge = challenges.find((c) => c.type === 'complete_with_character');
      if (cwcChallenge) {
        expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain(cwcChallenge.params.characterId);
        found = true;
        break;
      }
    }
    if (!found) expect(true).toBe(true);
  });
});

// ── initChallengeProgress ─────────────────────────────────────────────────────

describe('initChallengeProgress', () => {
  it('creates an entry for each challenge', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    for (const c of challenges) {
      expect(progress[c.id]).toBeDefined();
    }
  });

  it('all entries start at 0 current, not completed, not claimed', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    for (const p of Object.values(progress)) {
      expect(p.current).toBe(0);
      expect(p.completed).toBe(false);
      expect(p.claimed).toBe(false);
    }
  });

  it('target is positive for all entries', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    for (const p of Object.values(progress)) {
      expect(p.target).toBeGreaterThan(0);
    }
  });
});

// ── updateChallengeProgress — kill_with_weapon ────────────────────────────────

describe('updateChallengeProgress — kill_with_weapon', () => {
  function makeKillWeaponChallenge(weaponId: string, target: number): ChallengeDef {
    return {
      id: `daily_test_0_kill_with_weapon`,
      type: 'kill_with_weapon',
      descKey: 'challenge.kill_with_weapon',
      params: { weaponId, target },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('adds weapon kills to progress', () => {
    const challenge = makeKillWeaponChallenge('energy_shot', 30);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ weaponKillMap: { energy_shot: 15 } });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].current).toBe(15);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('completes when target reached', () => {
    const challenge = makeKillWeaponChallenge('energy_shot', 30);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ weaponKillMap: { energy_shot: 30 } });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('accumulates kills across multiple runs', () => {
    const challenge = makeKillWeaponChallenge('energy_shot', 30);
    let progress = initChallengeProgress([challenge]);
    const run1 = makeRun({ weaponKillMap: { energy_shot: 10 } });
    progress = updateChallengeProgress([challenge], progress, run1);
    const run2 = makeRun({ weaponKillMap: { energy_shot: 10 } });
    progress = updateChallengeProgress([challenge], progress, run2);
    expect(progress[challenge.id].current).toBe(20);
  });

  it('ignores kills from different weapon', () => {
    const challenge = makeKillWeaponChallenge('energy_shot', 30);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ weaponKillMap: { shotgun: 50 } });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].current).toBe(0);
  });

  it('does not update already-completed challenge', () => {
    const challenge = makeKillWeaponChallenge('energy_shot', 30);
    let progress = initChallengeProgress([challenge]);
    const run = makeRun({ weaponKillMap: { energy_shot: 30 } });
    progress = updateChallengeProgress([challenge], progress, run);
    expect(progress[challenge.id].completed).toBe(true);

    // Attempt to update again
    const run2 = makeRun({ weaponKillMap: { energy_shot: 100 } });
    const updated2 = updateChallengeProgress([challenge], progress, run2);
    // Should remain at clamped target
    expect(updated2[challenge.id].current).toBe(30);
  });
});

// ── updateChallengeProgress — survive_minutes ─────────────────────────────────

describe('updateChallengeProgress — survive_minutes', () => {
  function makeSurviveChallenge(target: number): ChallengeDef {
    return {
      id: 'daily_test_0_survive_minutes',
      type: 'survive_minutes',
      descKey: 'challenge.survive_minutes',
      params: { target },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('completes when survived >= target minutes', () => {
    const challenge = makeSurviveChallenge(3);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ runTimeMs: 3 * 60000 }); // exactly 3 minutes
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('does not complete when time is less than target', () => {
    const challenge = makeSurviveChallenge(3);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ runTimeMs: 2 * 60000 + 59999 }); // just under 3 minutes
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('tracks best (single-run) — second attempt does not accumulate', () => {
    const challenge = makeSurviveChallenge(6);
    const progress = initChallengeProgress([challenge]);
    // Two runs, each 3 minutes — should NOT add up to 6
    const run1 = makeRun({ runTimeMs: 3 * 60000 });
    const p2 = updateChallengeProgress([challenge], progress, run1);
    const run2 = makeRun({ runTimeMs: 3 * 60000 });
    const p3 = updateChallengeProgress([challenge], p2, run2);
    // Should remain at 3 minutes, not 6
    expect(p3[challenge.id].completed).toBe(false);
    expect(p3[challenge.id].current).toBeLessThan(challenge.params.target as number);
  });
});

// ── updateChallengeProgress — defeat_boss_stage ───────────────────────────────

describe('updateChallengeProgress — defeat_boss_stage', () => {
  function makeDefeatBossChallenge(requiredStage: number): ChallengeDef {
    return {
      id: 'daily_test_0_defeat_boss_stage',
      type: 'defeat_boss_stage',
      descKey: 'challenge.defeat_boss_stage',
      params: { stageRequired: requiredStage, target: 1 },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('completes when boss defeated at required stage', () => {
    const challenge = makeDefeatBossChallenge(2);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ bossKills: 1, highestStage: 2 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('completes when boss defeated beyond required stage', () => {
    const challenge = makeDefeatBossChallenge(2);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ bossKills: 2, highestStage: 6 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('does not complete when no boss kills', () => {
    const challenge = makeDefeatBossChallenge(2);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ bossKills: 0, highestStage: 5 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('does not complete when stage not reached', () => {
    const challenge = makeDefeatBossChallenge(6);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ bossKills: 1, highestStage: 3 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });
});

// ── updateChallengeProgress — collect_xp_orbs ────────────────────────────────

describe('updateChallengeProgress — collect_xp_orbs', () => {
  function makeXpOrbChallenge(target: number): ChallengeDef {
    return {
      id: 'daily_test_0_collect_xp_orbs',
      type: 'collect_xp_orbs',
      descKey: 'challenge.collect_xp_orbs',
      params: { target },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('accumulates xp orbs across runs (cumulative)', () => {
    const challenge = makeXpOrbChallenge(50);
    let progress = initChallengeProgress([challenge]);
    const run1 = makeRun({ xpOrbsCollected: 20 });
    progress = updateChallengeProgress([challenge], progress, run1);
    const run2 = makeRun({ xpOrbsCollected: 30 });
    progress = updateChallengeProgress([challenge], progress, run2);
    expect(progress[challenge.id].current).toBe(50);
    expect(progress[challenge.id].completed).toBe(true);
  });
});

// ── updateChallengeProgress — no_shop_run ─────────────────────────────────────

describe('updateChallengeProgress — no_shop_run', () => {
  function makeNoShopChallenge(): ChallengeDef {
    return {
      id: 'daily_test_0_no_shop_run',
      type: 'no_shop_run',
      descKey: 'challenge.no_shop_run',
      params: { target: 1 },
      difficulty: 'medium',
      prestigeReward: 75,
    };
  }

  it('completes when survived without using shop', () => {
    const challenge = makeNoShopChallenge();
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: true, usedShop: false });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('does not complete when shop was used', () => {
    const challenge = makeNoShopChallenge();
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: true, usedShop: true });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('does not complete when not survived (even without shop)', () => {
    const challenge = makeNoShopChallenge();
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: false, usedShop: false });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });
});

// ── updateChallengeProgress — reach_level ────────────────────────────────────

describe('updateChallengeProgress — reach_level', () => {
  function makeReachLevelChallenge(target: number): ChallengeDef {
    return {
      id: 'daily_test_0_reach_level',
      type: 'reach_level',
      descKey: 'challenge.reach_level',
      params: { target },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('completes when level reached >= target', () => {
    const challenge = makeReachLevelChallenge(8);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ levelReached: 8 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('does not complete at level below target', () => {
    const challenge = makeReachLevelChallenge(8);
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ levelReached: 7 });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('tracks best level (single-run), not cumulative', () => {
    const challenge = makeReachLevelChallenge(14);
    let progress = initChallengeProgress([challenge]);
    const run1 = makeRun({ levelReached: 7 });
    progress = updateChallengeProgress([challenge], progress, run1);
    const run2 = makeRun({ levelReached: 7 });
    progress = updateChallengeProgress([challenge], progress, run2);
    // Should NOT add up to 14
    expect(progress[challenge.id].current).toBe(7);
    expect(progress[challenge.id].completed).toBe(false);
  });
});

// ── updateChallengeProgress — deal_total_damage ───────────────────────────────

describe('updateChallengeProgress — deal_total_damage', () => {
  function makeDamageChallengeDF(target: number): ChallengeDef {
    return {
      id: 'daily_test_0_deal_total_damage',
      type: 'deal_total_damage',
      descKey: 'challenge.deal_total_damage',
      params: { target },
      difficulty: 'easy',
      prestigeReward: 30,
    };
  }

  it('accumulates damage across runs', () => {
    const challenge = makeDamageChallengeDF(5000);
    let progress = initChallengeProgress([challenge]);
    const run1 = makeRun({ totalDamageDealt: 2500 });
    progress = updateChallengeProgress([challenge], progress, run1);
    const run2 = makeRun({ totalDamageDealt: 2500 });
    progress = updateChallengeProgress([challenge], progress, run2);
    expect(progress[challenge.id].current).toBe(5000);
    expect(progress[challenge.id].completed).toBe(true);
  });
});

// ── updateChallengeProgress — complete_with_character ─────────────────────────

describe('updateChallengeProgress — complete_with_character', () => {
  function makeCharChallenge(characterId: string): ChallengeDef {
    return {
      id: 'daily_test_0_complete_with_character',
      type: 'complete_with_character',
      descKey: 'challenge.complete_with_character',
      params: { characterId, target: 1 },
      difficulty: 'hard',
      prestigeReward: 150,
    };
  }

  it('completes when survived with correct character', () => {
    const challenge = makeCharChallenge('nova');
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: true, characterId: 'nova' });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(true);
  });

  it('does not complete with wrong character', () => {
    const challenge = makeCharChallenge('nova');
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: true, characterId: 'hai' });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });

  it('does not complete when not survived even with correct character', () => {
    const challenge = makeCharChallenge('nova');
    const progress = initChallengeProgress([challenge]);
    const run = makeRun({ survived: false, characterId: 'nova' });
    const updated = updateChallengeProgress([challenge], progress, run);
    expect(updated[challenge.id].completed).toBe(false);
  });
});

// ── claimChallengeReward ──────────────────────────────────────────────────────

describe('claimChallengeReward', () => {
  it('marks completed challenge as claimed', () => {
    const prog = {
      challengeId: 'test',
      current: 1,
      target: 1,
      completed: true,
      claimed: false,
    };
    const result = claimChallengeReward(prog);
    expect(result.claimed).toBe(true);
  });

  it('does not claim if not completed', () => {
    const prog = {
      challengeId: 'test',
      current: 0,
      target: 1,
      completed: false,
      claimed: false,
    };
    const result = claimChallengeReward(prog);
    expect(result.claimed).toBe(false);
  });

  it('does not modify if already claimed', () => {
    const prog = {
      challengeId: 'test',
      current: 1,
      target: 1,
      completed: true,
      claimed: true,
    };
    const result = claimChallengeReward(prog);
    expect(result.claimed).toBe(true);
    // Same reference since nothing changed
    expect(result).toBe(prog);
  });
});

// ── totalClaimablePrestige ────────────────────────────────────────────────────

describe('totalClaimablePrestige', () => {
  it('returns 0 when nothing completed', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    expect(totalClaimablePrestige(challenges, progress)).toBe(0);
  });

  it('sums prestige for completed+unclaimed challenges only', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);

    // Manually mark first as completed
    const id0 = challenges[0].id;
    const id1 = challenges[1].id;
    progress[id0] = { ...progress[id0], completed: true };
    progress[id1] = { ...progress[id1], completed: true, claimed: true }; // already claimed

    const claimable = totalClaimablePrestige(challenges, progress);
    expect(claimable).toBe(challenges[0].prestigeReward);
  });
});

// ── countCompletedChallenges ──────────────────────────────────────────────────

describe('countCompletedChallenges', () => {
  it('returns 0 when none completed', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    expect(countCompletedChallenges(progress)).toBe(0);
  });

  it('counts completed challenges regardless of claimed status', () => {
    const challenges = generateDailyChallenges('2026-03-06');
    const progress = initChallengeProgress(challenges);
    progress[challenges[0].id] = { ...progress[challenges[0].id], completed: true };
    progress[challenges[1].id] = {
      ...progress[challenges[1].id],
      completed: true,
      claimed: true,
    };
    expect(countCompletedChallenges(progress)).toBe(2);
  });
});

// ── createTodaysSave ──────────────────────────────────────────────────────────

describe('createTodaysSave', () => {
  it('creates a save with today UTC dateStr', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const save = createTodaysSave(now);
    expect(save.dateStr).toBe('2026-03-06');
  });

  it('includes challengesPerDay challenges', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const save = createTodaysSave(now);
    expect(save.challenges.length).toBe(BALANCE.DAILY_CHALLENGE.challengesPerDay);
  });

  it('initializes progress for all challenges', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const save = createTodaysSave(now);
    for (const c of save.challenges) {
      expect(save.progress[c.id]).toBeDefined();
    }
  });
});

// ── getOrRefreshDailySave ─────────────────────────────────────────────────────

describe('getOrRefreshDailySave', () => {
  it('returns existing save if still valid for today', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const existingSave = createTodaysSave(now);
    const result = getOrRefreshDailySave(existingSave, now);
    expect(result).toBe(existingSave);
  });

  it('creates new save when existing is expired (yesterday)', () => {
    const yesterday = new Date('2026-03-05T10:00:00Z');
    const oldSave = createTodaysSave(yesterday);

    const today = new Date('2026-03-06T10:00:00Z');
    const result = getOrRefreshDailySave(oldSave, today);
    expect(result.dateStr).toBe('2026-03-06');
    expect(result).not.toBe(oldSave);
  });

  it('creates new save when null is passed', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const result = getOrRefreshDailySave(null, now);
    expect(result.dateStr).toBe('2026-03-06');
    expect(result.challenges.length).toBe(BALANCE.DAILY_CHALLENGE.challengesPerDay);
  });

  it('new daily save has cleared progress', () => {
    const now = new Date('2026-03-06T10:00:00Z');
    const result = getOrRefreshDailySave(null, now);
    for (const p of Object.values(result.progress)) {
      expect(p.current).toBe(0);
      expect(p.completed).toBe(false);
    }
  });
});

// ── Balance config validation ─────────────────────────────────────────────────

describe('BALANCE.DAILY_CHALLENGE config', () => {
  it('challengesPerDay is 3', () => {
    expect(BALANCE.DAILY_CHALLENGE.challengesPerDay).toBe(3);
  });

  it('all difficulties have positive prestige', () => {
    for (const val of Object.values(BALANCE.DAILY_CHALLENGE.prestigeByDifficulty)) {
      expect(val).toBeGreaterThan(0);
    }
  });

  it('hard > medium > easy prestige', () => {
    const p = BALANCE.DAILY_CHALLENGE.prestigeByDifficulty;
    expect(p.hard).toBeGreaterThan(p.medium);
    expect(p.medium).toBeGreaterThan(p.easy);
  });

  it('weaponPool has at least 4 weapons', () => {
    expect(BALANCE.DAILY_CHALLENGE.weaponPool.length).toBeGreaterThanOrEqual(4);
  });

  it('characterPool has all 5 characters', () => {
    expect(BALANCE.DAILY_CHALLENGE.characterPool.length).toBe(5);
    expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain('hai');
    expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain('nova');
    expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain('sol');
    expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain('mei');
    expect(BALANCE.DAILY_CHALLENGE.characterPool).toContain('kai');
  });
});
