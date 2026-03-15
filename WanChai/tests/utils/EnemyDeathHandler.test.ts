import { describe, it, expect } from 'vitest';
import {
  getEnemyTier,
  calculateDeathReward,
  getUltimateGaugeAmount,
  getScreenShake,
  getSplitterChildren,
  calculateLightspeedBuff,
  shouldTriggerStageClear,
  isRunComplete,
} from '../../src/utils/EnemyDeathHandler';
import { BALANCE } from '../../src/config/balance';

// ── getEnemyTier ──

describe('getEnemyTier', () => {
  it('returns boss for boss defId', () => {
    expect(getEnemyTier('boss', false)).toBe('boss');
  });

  it('returns boss for boss_circle defId', () => {
    expect(getEnemyTier('boss_circle', false)).toBe('boss');
  });

  it('returns boss for boss_burst defId', () => {
    expect(getEnemyTier('boss_burst', false)).toBe('boss');
  });

  it('boss tier takes precedence over elite flag', () => {
    expect(getEnemyTier('boss', true)).toBe('boss');
  });

  it('returns elite for non-boss with isElite=true', () => {
    expect(getEnemyTier('basic', true)).toBe('elite');
  });

  it('returns t2 for tank', () => {
    expect(getEnemyTier('tank', false)).toBe('t2');
  });

  it('returns t2 for splitter', () => {
    expect(getEnemyTier('splitter', false)).toBe('t2');
  });

  it('returns t2 for guardian', () => {
    expect(getEnemyTier('guardian', false)).toBe('t2');
  });

  it('returns t1 for basic enemy', () => {
    expect(getEnemyTier('basic', false)).toBe('t1');
  });

  it('returns t1 for fast enemy', () => {
    expect(getEnemyTier('fast', false)).toBe('t1');
  });

  it('returns t1 for swarm enemy', () => {
    expect(getEnemyTier('swarm', false)).toBe('t1');
  });

  it('returns t1 for shooter enemy', () => {
    expect(getEnemyTier('shooter', false)).toBe('t1');
  });

  it('returns t1 for chaser enemy', () => {
    expect(getEnemyTier('chaser', false)).toBe('t1');
  });

  it('returns t1 for teleporter enemy', () => {
    expect(getEnemyTier('teleporter', false)).toBe('t1');
  });
});

// ── calculateDeathReward ──

describe('calculateDeathReward', () => {
  it('normal kill gives goldPerKill (1)', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: false, xpValue: 1, metaXpBonus: 0 });
    expect(r.gold).toBe(BALANCE.ECONOMY.goldPerKill);
  });

  it('elite kill gives goldPerElite (5)', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: true, xpValue: 1, metaXpBonus: 0 });
    expect(r.gold).toBe(BALANCE.ECONOMY.goldPerElite);
  });

  it('boss kill gives goldPerKill + goldPerBoss (1+50=51)', () => {
    const r = calculateDeathReward({ defId: 'boss', isElite: false, xpValue: 100, metaXpBonus: 0 });
    expect(r.gold).toBe(BALANCE.ECONOMY.goldPerKill + BALANCE.ECONOMY.goldPerBoss);
  });

  it('boss_circle also gets boss bonus', () => {
    const r = calculateDeathReward({ defId: 'boss_circle', isElite: false, xpValue: 120, metaXpBonus: 0 });
    expect(r.gold).toBe(BALANCE.ECONOMY.goldPerKill + BALANCE.ECONOMY.goldPerBoss);
  });

  it('xp with no meta bonus = ceil(xpValue)', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: false, xpValue: 3, metaXpBonus: 0 });
    expect(r.xp).toBe(3);
  });

  it('xp with 50% meta bonus = ceil(xpValue * 1.5)', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: false, xpValue: 3, metaXpBonus: 0.5 });
    expect(r.xp).toBe(Math.ceil(3 * 1.5)); // 5
  });

  it('xp with 100% meta bonus doubles XP', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: false, xpValue: 7, metaXpBonus: 1.0 });
    expect(r.xp).toBe(Math.ceil(7 * 2.0)); // 14
  });

  it('boss xpValue 100 with 25% bonus = 125', () => {
    const r = calculateDeathReward({ defId: 'boss', isElite: false, xpValue: 100, metaXpBonus: 0.25 });
    expect(r.xp).toBe(125);
  });

  it('zero xpValue gives 0 xp', () => {
    const r = calculateDeathReward({ defId: 'basic', isElite: false, xpValue: 0, metaXpBonus: 0.5 });
    expect(r.xp).toBe(0);
  });
});

// ── getUltimateGaugeAmount ──

describe('getUltimateGaugeAmount', () => {
  it('t1 gives 5 gauge', () => {
    expect(getUltimateGaugeAmount('t1')).toBe(BALANCE.ULTIMATE.gaugePerKill.t1);
    expect(getUltimateGaugeAmount('t1')).toBe(5);
  });

  it('t2 gives 10 gauge', () => {
    expect(getUltimateGaugeAmount('t2')).toBe(BALANCE.ULTIMATE.gaugePerKill.t2);
    expect(getUltimateGaugeAmount('t2')).toBe(10);
  });

  it('elite gives 20 gauge', () => {
    expect(getUltimateGaugeAmount('elite')).toBe(BALANCE.ULTIMATE.gaugePerKill.elite);
    expect(getUltimateGaugeAmount('elite')).toBe(20);
  });

  it('boss gives 50 gauge', () => {
    expect(getUltimateGaugeAmount('boss')).toBe(BALANCE.ULTIMATE.gaugePerKill.boss);
    expect(getUltimateGaugeAmount('boss')).toBe(50);
  });
});

// ── getScreenShake ──

describe('getScreenShake', () => {
  it('boss: matches BALANCE.JUICE.deathShake.boss', () => {
    const s = getScreenShake('boss');
    expect(s.intensity).toBe(BALANCE.JUICE.deathShake.boss.intensity);
    expect(s.durationMs).toBe(BALANCE.JUICE.deathShake.boss.durationMs);
  });

  it('elite: matches BALANCE.JUICE.deathShake.elite', () => {
    const s = getScreenShake('elite');
    expect(s.intensity).toBe(BALANCE.JUICE.deathShake.elite.intensity);
    expect(s.durationMs).toBe(BALANCE.JUICE.deathShake.elite.durationMs);
  });

  it('t1: matches BALANCE.JUICE.deathShake.normal', () => {
    const s = getScreenShake('t1');
    expect(s.intensity).toBe(BALANCE.JUICE.deathShake.normal.intensity);
    expect(s.durationMs).toBe(BALANCE.JUICE.deathShake.normal.durationMs);
  });

  it('t2: same as normal (BALANCE.JUICE.deathShake.normal)', () => {
    const s = getScreenShake('t2');
    expect(s.intensity).toBe(BALANCE.JUICE.deathShake.normal.intensity);
    expect(s.durationMs).toBe(BALANCE.JUICE.deathShake.normal.durationMs);
  });

  it('shake intensity hierarchy: t1 < elite < boss', () => {
    const t1 = getScreenShake('t1');
    const elite = getScreenShake('elite');
    const boss = getScreenShake('boss');
    expect(t1.intensity).toBeLessThan(elite.intensity);
    expect(elite.intensity).toBeLessThan(boss.intensity);
  });

  it('shake duration hierarchy: t1 < elite < boss', () => {
    const t1 = getScreenShake('t1');
    const elite = getScreenShake('elite');
    const boss = getScreenShake('boss');
    expect(t1.durationMs).toBeLessThan(elite.durationMs);
    expect(elite.durationMs).toBeLessThan(boss.durationMs);
  });
});

// ── getSplitterChildren ──

describe('getSplitterChildren', () => {
  it('returns 2 children for split_on_death non-child enemy', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: false,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    expect(children).not.toBeNull();
    expect(children!.length).toBe(2);
  });

  it('child HP is BALANCE.SPLITTER.childHpFraction of parent maxHp (ceiled)', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: false,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    const expectedHp = Math.ceil(100 * BALANCE.SPLITTER.childHpFraction);
    expect(children![0].hp).toBe(expectedHp);
    expect(children![1].hp).toBe(expectedHp);
  });

  it('child HP is ceiled for non-round parent HP', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: false,
      parentMaxHp: 45,
      parentX: 0,
      parentY: 0,
    });
    expect(children![0].hp).toBe(Math.ceil(45 * BALANCE.SPLITTER.childHpFraction));
  });

  it('children spawn at ±BALANCE.SPLITTER.childOffsetX', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: false,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    expect(children![0].offsetX).toBe(-BALANCE.SPLITTER.childOffsetX);
    expect(children![1].offsetX).toBe(BALANCE.SPLITTER.childOffsetX);
  });

  it('children have BALANCE.SPLITTER.childScale', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: false,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    expect(children![0].scale).toBe(BALANCE.SPLITTER.childScale);
    expect(children![1].scale).toBe(BALANCE.SPLITTER.childScale);
  });

  it('returns null for split_on_death child (no recursive split)', () => {
    const children = getSplitterChildren({
      behavior: 'split_on_death',
      isSplitChild: true,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    expect(children).toBeNull();
  });

  it('returns null for march behavior', () => {
    const children = getSplitterChildren({
      behavior: 'march',
      isSplitChild: false,
      parentMaxHp: 100,
      parentX: 300,
      parentY: 400,
    });
    expect(children).toBeNull();
  });

  it('returns null for boss_chase behavior', () => {
    const children = getSplitterChildren({
      behavior: 'boss_chase',
      isSplitChild: false,
      parentMaxHp: 1200,
      parentX: 300,
      parentY: 400,
    });
    expect(children).toBeNull();
  });

  it('returns null for dash behavior', () => {
    const children = getSplitterChildren({
      behavior: 'dash',
      isSplitChild: false,
      parentMaxHp: 50,
      parentX: 100,
      parentY: 200,
    });
    expect(children).toBeNull();
  });
});

// ── calculateLightspeedBuff ──

describe('calculateLightspeedBuff', () => {
  it('returns null when level is 0', () => {
    expect(calculateLightspeedBuff(0)).toBeNull();
  });

  it('returns null when level is negative', () => {
    expect(calculateLightspeedBuff(-1)).toBeNull();
  });

  it('level 1: atkSpeedMult = 1 + 0.20', () => {
    const result = calculateLightspeedBuff(1)!;
    expect(result.active).toBe(true);
    expect(result.newAtkSpeedMult).toBe(1.2);
  });

  it('level 2: atkSpeedMult = 1 + 0.40', () => {
    const result = calculateLightspeedBuff(2)!;
    expect(result.newAtkSpeedMult).toBe(1.4);
  });

  it('level 3: atkSpeedMult = 1 + 0.60', () => {
    const result = calculateLightspeedBuff(3)!;
    expect(result.newAtkSpeedMult).toBe(1.6);
  });

  it('duration matches BALANCE.PASSIVE.lightspeedDurationMs', () => {
    const result = calculateLightspeedBuff(1)!;
    expect(result.durationMs).toBe(BALANCE.PASSIVE.lightspeedDurationMs);
    expect(result.durationMs).toBe(5000);
  });

  it('active flag is always true when level > 0', () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(calculateLightspeedBuff(lvl)!.active).toBe(true);
    }
  });
});

// ── shouldTriggerStageClear ──

describe('shouldTriggerStageClear', () => {
  it('returns true for boss stage + boss defId', () => {
    expect(shouldTriggerStageClear(true, 'boss')).toBe(true);
  });

  it('returns true for boss stage + boss_circle', () => {
    expect(shouldTriggerStageClear(true, 'boss_circle')).toBe(true);
  });

  it('returns true for boss stage + boss_burst', () => {
    expect(shouldTriggerStageClear(true, 'boss_burst')).toBe(true);
  });

  it('returns false for non-boss stage + boss defId', () => {
    expect(shouldTriggerStageClear(false, 'boss')).toBe(false);
  });

  it('returns false for boss stage + non-boss defId', () => {
    expect(shouldTriggerStageClear(true, 'basic')).toBe(false);
  });

  it('returns false for non-boss stage + non-boss defId', () => {
    expect(shouldTriggerStageClear(false, 'basic')).toBe(false);
  });
});

// ── isRunComplete ──

describe('isRunComplete', () => {
  it('returns true when stage equals maxStages', () => {
    expect(isRunComplete(BALANCE.STAGE.maxStages)).toBe(true);
  });

  it('returns true when stage exceeds maxStages', () => {
    expect(isRunComplete(BALANCE.STAGE.maxStages + 1)).toBe(true);
  });

  it('returns false when stage is less than maxStages', () => {
    expect(isRunComplete(BALANCE.STAGE.maxStages - 1)).toBe(false);
  });

  it('returns false for stage 1', () => {
    expect(isRunComplete(1)).toBe(false);
  });

  it('maxStages is 6', () => {
    expect(BALANCE.STAGE.maxStages).toBe(6);
  });
});

// ── Balance Constants Integrity ──

describe('EnemyDeathHandler — Balance Constants', () => {
  it('goldPerKill is 1', () => {
    expect(BALANCE.ECONOMY.goldPerKill).toBe(1);
  });

  it('goldPerElite is 5', () => {
    expect(BALANCE.ECONOMY.goldPerElite).toBe(5);
  });

  it('goldPerBoss is 50', () => {
    expect(BALANCE.ECONOMY.goldPerBoss).toBe(50);
  });

  it('ultimate gauge per kill tiers are ascending', () => {
    const g = BALANCE.ULTIMATE.gaugePerKill;
    expect(g.t1).toBeLessThan(g.t2);
    expect(g.t2).toBeLessThan(g.elite);
    expect(g.elite).toBeLessThan(g.boss);
  });

  it('lightspeed atk speed bonus per level is 20%', () => {
    expect(BALANCE.PASSIVE.lightspeedAtkSpdBonus).toBe(0.2);
  });

  it('lightspeed duration is 5000ms', () => {
    expect(BALANCE.PASSIVE.lightspeedDurationMs).toBe(5000);
  });
});
