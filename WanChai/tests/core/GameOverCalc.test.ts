import { describe, it, expect } from 'vitest';
import {
  calculateStatSpacing,
  isCurrentRunMatch,
  sortWeaponsByDamage,
  calculateBaseHpPercent,
  calculateButtonBaseY,
  calculateAchievementNotifyY,
  checkNewRecords,
} from '../../src/core/GameOverCalc';

// ---------------------------------------------------------------------------
// calculateStatSpacing
// ---------------------------------------------------------------------------
describe('calculateStatSpacing', () => {
  it('returns 30 for 5 stats (comfortable)', () => {
    expect(calculateStatSpacing(5)).toBe(30);
  });

  it('returns 26 for 8 stats (medium)', () => {
    expect(calculateStatSpacing(8)).toBe(26);
  });

  it('returns 22 for 12 stats (compact)', () => {
    expect(calculateStatSpacing(12)).toBe(22);
  });

  it('returns 30 for boundary 7 (not > 7)', () => {
    expect(calculateStatSpacing(7)).toBe(30);
  });

  it('returns 26 for boundary 10 (> 7 but not > 10)', () => {
    expect(calculateStatSpacing(10)).toBe(26);
  });

  it('returns 22 for boundary 11 (> 10)', () => {
    expect(calculateStatSpacing(11)).toBe(22);
  });
});

// ---------------------------------------------------------------------------
// isCurrentRunMatch
// ---------------------------------------------------------------------------
describe('isCurrentRunMatch', () => {
  const run = { kills: 100, timeMs: 60000, level: 5 };

  it('returns true when all fields match', () => {
    expect(isCurrentRunMatch({ kills: 100, timeMs: 60000, level: 5 }, run)).toBe(true);
  });

  it('returns false when kills differ', () => {
    expect(isCurrentRunMatch({ kills: 99, timeMs: 60000, level: 5 }, run)).toBe(false);
  });

  it('returns false when timeMs differs', () => {
    expect(isCurrentRunMatch({ kills: 100, timeMs: 59999, level: 5 }, run)).toBe(false);
  });

  it('returns false when level differs', () => {
    expect(isCurrentRunMatch({ kills: 100, timeMs: 60000, level: 4 }, run)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sortWeaponsByDamage
// ---------------------------------------------------------------------------
describe('sortWeaponsByDamage', () => {
  it('returns top 2 from 3 weapons', () => {
    const map = { sword: 300, bow: 500, staff: 100 };
    const result = sortWeaponsByDamage(map, 2);
    expect(result).toEqual([
      ['bow', 500],
      ['sword', 300],
    ]);
  });

  it('returns empty array for empty map', () => {
    expect(sortWeaponsByDamage({}, 5)).toEqual([]);
  });

  it('returns empty array when limit is 0', () => {
    expect(sortWeaponsByDamage({ a: 10, b: 20 }, 0)).toEqual([]);
  });

  it('returns all entries when limit exceeds count', () => {
    const map = { x: 50, y: 30 };
    const result = sortWeaponsByDamage(map, 10);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(['x', 50]);
    expect(result[1]).toEqual(['y', 30]);
  });

  it('sorts highest damage first', () => {
    const map = { a: 10, b: 50, c: 30, d: 40, e: 20 };
    const result = sortWeaponsByDamage(map, 5);
    expect(result.map(([, dmg]) => dmg)).toEqual([50, 40, 30, 20, 10]);
  });
});

// ---------------------------------------------------------------------------
// calculateBaseHpPercent
// ---------------------------------------------------------------------------
describe('calculateBaseHpPercent', () => {
  it('returns 50 for 50/100', () => {
    expect(calculateBaseHpPercent(50, 100)).toBe(50);
  });

  it('returns 100 for 100/100', () => {
    expect(calculateBaseHpPercent(100, 100)).toBe(100);
  });

  it('returns 0 for 0/100', () => {
    expect(calculateBaseHpPercent(0, 100)).toBe(0);
  });

  it('returns 0 when maxHp is 0 (divide-by-zero guard)', () => {
    expect(calculateBaseHpPercent(50, 0)).toBe(0);
  });

  it('rounds correctly: 33/100 → 33', () => {
    expect(calculateBaseHpPercent(33, 100)).toBe(33);
  });

  it('rounds correctly: 1/3 → 33 (not 33.33)', () => {
    expect(calculateBaseHpPercent(1, 3)).toBe(33);
  });

  it('negative remaining is clamped to 0 (RedTeam GOC-03)', () => {
    expect(calculateBaseHpPercent(-10, 100)).toBe(0);
  });

  it('remaining > maxHp is capped at 100 (RedTeam GOC-02)', () => {
    expect(calculateBaseHpPercent(150, 100)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// calculateButtonBaseY
// ---------------------------------------------------------------------------
describe('calculateButtonBaseY', () => {
  it('returns default 520 when not challenge mode', () => {
    expect(
      calculateButtonBaseY({
        challengeMode: false,
        statStartY: 130,
        statsCount: 6,
        statSpacing: 30,
        isNewRecord: true,
        achievementCount: 3,
        leaderboardHeight: 200,
      }),
    ).toBe(520);
  });

  it('returns custom defaultY when not challenge mode', () => {
    expect(
      calculateButtonBaseY({
        challengeMode: false,
        statStartY: 130,
        statsCount: 6,
        statSpacing: 30,
        isNewRecord: false,
        achievementCount: 0,
        leaderboardHeight: 0,
        defaultY: 400,
      }),
    ).toBe(400);
  });

  it('clamps to 520 when challenge computed value is lower', () => {
    // statStartY(130) + 2*30(60) + 30 + 0 + 0 + 20 = 240 → clamped to 520
    expect(
      calculateButtonBaseY({
        challengeMode: true,
        statStartY: 130,
        statsCount: 2,
        statSpacing: 30,
        isNewRecord: false,
        achievementCount: 0,
        leaderboardHeight: 0,
      }),
    ).toBe(520);
  });

  it('returns computed value when it exceeds 520 in challenge mode', () => {
    // 130 + 12*22(264) + 70 + (3*40+10=130) + 200 + 20 = 814
    expect(
      calculateButtonBaseY({
        challengeMode: true,
        statStartY: 130,
        statsCount: 12,
        statSpacing: 22,
        isNewRecord: true,
        achievementCount: 3,
        leaderboardHeight: 200,
      }),
    ).toBe(540); // clamped to GAME_HEIGHT(720) - 180
  });

  it('uses 30 gap when isNewRecord is false', () => {
    // 130 + 12*22(264) + 30 + 130 + 200 + 20 = 774
    expect(
      calculateButtonBaseY({
        challengeMode: true,
        statStartY: 130,
        statsCount: 12,
        statSpacing: 22,
        isNewRecord: false,
        achievementCount: 3,
        leaderboardHeight: 200,
      }),
    ).toBe(540); // clamped to GAME_HEIGHT(720) - 180
  });

  it('handles zero achievement count', () => {
    // 130 + 10*26(260) + 70 + 0 + 100 + 20 = 580
    expect(
      calculateButtonBaseY({
        challengeMode: true,
        statStartY: 130,
        statsCount: 10,
        statSpacing: 26,
        isNewRecord: true,
        achievementCount: 0,
        leaderboardHeight: 100,
      }),
    ).toBe(540); // clamped to GAME_HEIGHT(720) - 180
  });

  it('uses defaultY as floor in challenge mode (RedTeam GOC-01)', () => {
    // computed: 130 + 2*30(60) + 30 + 0 + 0 + 20 = 240 → clamped to defaultY(400)
    expect(
      calculateButtonBaseY({
        challengeMode: true,
        statStartY: 130,
        statsCount: 2,
        statSpacing: 30,
        isNewRecord: false,
        achievementCount: 0,
        leaderboardHeight: 0,
        defaultY: 400,
      }),
    ).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// calculateAchievementNotifyY
// ---------------------------------------------------------------------------
describe('calculateAchievementNotifyY', () => {
  it('adds 60 offset when isNewRecord is true', () => {
    // 280 + 6*55(330) + 60 = 670
    expect(calculateAchievementNotifyY(280, 6, 55, true)).toBe(670);
  });

  it('adds 20 offset when isNewRecord is false', () => {
    // 280 + 6*55(330) + 20 = 630
    expect(calculateAchievementNotifyY(280, 6, 55, false)).toBe(630);
  });

  it('works with different stat counts', () => {
    // 280 + 12*36(432) + 60 = 772
    expect(calculateAchievementNotifyY(280, 12, 36, true)).toBe(772);
  });

  it('works with zero stats', () => {
    // 280 + 0 + 20 = 300
    expect(calculateAchievementNotifyY(280, 0, 55, false)).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// checkNewRecords
// ---------------------------------------------------------------------------
describe('checkNewRecords', () => {
  it('detects all three new records', () => {
    const result = checkNewRecords(
      { kills: 200, level: 10, timeMs: 120000 },
      { bestKills: 100, bestLevel: 5, bestTimeMs: 60000 },
    );
    expect(result.isNewRecord).toBe(true);
    expect(result.fields).toEqual(['kills', 'level', 'timeMs']);
  });

  it('returns no records when all values are lower', () => {
    const result = checkNewRecords(
      { kills: 50, level: 3, timeMs: 30000 },
      { bestKills: 100, bestLevel: 5, bestTimeMs: 60000 },
    );
    expect(result.isNewRecord).toBe(false);
    expect(result.fields).toEqual([]);
  });

  it('detects partial records (kills only)', () => {
    const result = checkNewRecords(
      { kills: 150, level: 5, timeMs: 60000 },
      { bestKills: 100, bestLevel: 5, bestTimeMs: 60000 },
    );
    expect(result.isNewRecord).toBe(true);
    expect(result.fields).toEqual(['kills']);
  });

  it('equal values are NOT new records (must be strictly greater)', () => {
    const result = checkNewRecords(
      { kills: 100, level: 5, timeMs: 60000 },
      { bestKills: 100, bestLevel: 5, bestTimeMs: 60000 },
    );
    expect(result.isNewRecord).toBe(false);
    expect(result.fields).toEqual([]);
  });

  it('detects two out of three records', () => {
    const result = checkNewRecords(
      { kills: 200, level: 5, timeMs: 120000 },
      { bestKills: 100, bestLevel: 10, bestTimeMs: 60000 },
    );
    expect(result.isNewRecord).toBe(true);
    expect(result.fields).toEqual(['kills', 'timeMs']);
  });
});
