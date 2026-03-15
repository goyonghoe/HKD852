import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../../src/managers/SaveManager';
import { BALANCE } from '../../src/config/balance';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};
vi.stubGlobal('localStorage', localStorageMock);

/** Helper: format Date as "YYYY-MM-DD" */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('DailyReward — checkDailyReward', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('returns reward for brand-new player (no save data)', () => {
    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);
    expect(reward!.isNew).toBe(true);
  });

  it('returns null if already claimed today', () => {
    SaveManager.claimDailyReward();
    expect(SaveManager.checkDailyReward()).toBeNull();
  });

  it('streak is 1 when no previous login date', () => {
    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1);
  });

  it('streak is 1 when lastLoginDate is 2 days ago (missed a day)', () => {
    const meta = SaveManager.loadMeta();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    meta.lastLoginDate = formatDate(twoDaysAgo);
    meta.dailyStreak = 5;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1);
  });

  it('streak advances when lastLoginDate is yesterday', () => {
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    meta.dailyStreak = 4;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(5);
    expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[4]); // Day 5
  });

  it('streak wraps from maxStreak back to 1', () => {
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    meta.dailyStreak = BALANCE.DAILY_REWARDS.maxStreak; // 7
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);
  });

  it('gold amount matches BALANCE.DAILY_REWARDS.streakGold for each streak level', () => {
    for (let day = 1; day <= BALANCE.DAILY_REWARDS.maxStreak; day++) {
      // Reset
      for (const key of Object.keys(store)) delete store[key];

      const meta = SaveManager.loadMeta();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      meta.lastLoginDate = formatDate(yesterday);
      meta.dailyStreak = day - 1 === 0 ? BALANCE.DAILY_REWARDS.maxStreak : day - 1;
      if (day === 1) {
        // For day 1, simulate missed day or first login
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        meta.lastLoginDate = formatDate(twoDaysAgo);
        meta.dailyStreak = 3; // some old streak
      }
      SaveManager.saveMeta(meta);

      const reward = SaveManager.checkDailyReward();
      expect(reward).not.toBeNull();

      if (day === 1) {
        // Missed day resets to 1
        expect(reward!.streak).toBe(1);
        expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);
      } else {
        expect(reward!.streak).toBe(day);
        expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[day - 1]);
      }
    }
  });

  it('isNew is true when dailyStreak is 0 or undefined', () => {
    const reward = SaveManager.checkDailyReward();
    expect(reward!.isNew).toBe(true);
  });

  it('isNew is false when dailyStreak > 0', () => {
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    meta.dailyStreak = 2;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.isNew).toBe(false);
  });
});

describe('DailyReward — claimDailyReward', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('adds gold to meta.totalGold', () => {
    const beforeMeta = SaveManager.loadMeta();
    const beforeGold = beforeMeta.totalGold;

    const claimed = SaveManager.claimDailyReward();
    expect(claimed.gold).toBeGreaterThan(0);

    const afterMeta = SaveManager.loadMeta();
    expect(afterMeta.totalGold).toBe(beforeGold + claimed.gold);
  });

  it('adds gold to meta.totalGoldEarned', () => {
    const claimed = SaveManager.claimDailyReward();
    const meta = SaveManager.loadMeta();
    expect(meta.totalGoldEarned).toBe(claimed.gold);
  });

  it('updates lastLoginDate to today', () => {
    SaveManager.claimDailyReward();
    const meta = SaveManager.loadMeta();
    expect(meta.lastLoginDate).toBe(formatDate(new Date()));
  });

  it('sets dailyStreak to claimed streak', () => {
    const claimed = SaveManager.claimDailyReward();
    const meta = SaveManager.loadMeta();
    expect(meta.dailyStreak).toBe(claimed.streak);
  });

  it('returns 0 gold and 0 streak when no reward available', () => {
    SaveManager.claimDailyReward(); // First claim
    const second = SaveManager.claimDailyReward(); // Already claimed
    expect(second.gold).toBe(0);
    expect(second.streak).toBe(0);
  });

  it('consecutive claims across days accumulate gold', () => {
    // Day 1
    const day1 = SaveManager.claimDailyReward();
    expect(day1.streak).toBe(1);
    expect(day1.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);

    // Simulate next day: set lastLoginDate to yesterday
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    SaveManager.saveMeta(meta);

    // Day 2
    const day2 = SaveManager.claimDailyReward();
    expect(day2.streak).toBe(2);
    expect(day2.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[1]);

    const finalMeta = SaveManager.loadMeta();
    expect(finalMeta.totalGold).toBe(day1.gold + day2.gold);
  });
});

describe('DailyReward — streakGold config', () => {
  it('streakGold has exactly maxStreak entries', () => {
    expect(BALANCE.DAILY_REWARDS.streakGold.length).toBe(BALANCE.DAILY_REWARDS.maxStreak);
  });

  it('streakGold values are all positive', () => {
    for (const gold of BALANCE.DAILY_REWARDS.streakGold) {
      expect(gold).toBeGreaterThan(0);
    }
  });

  it('streakGold is non-decreasing (later days give more or equal)', () => {
    for (let i = 1; i < BALANCE.DAILY_REWARDS.streakGold.length; i++) {
      expect(BALANCE.DAILY_REWARDS.streakGold[i]).toBeGreaterThanOrEqual(BALANCE.DAILY_REWARDS.streakGold[i - 1]);
    }
  });

  it('maxStreak is 7', () => {
    expect(BALANCE.DAILY_REWARDS.maxStreak).toBe(7);
  });

  it('Day 1 gold is 50, Day 7 gold is 300', () => {
    expect(BALANCE.DAILY_REWARDS.streakGold[0]).toBe(50);
    expect(BALANCE.DAILY_REWARDS.streakGold[6]).toBe(300);
  });
});

// === NEW TESTS: streak-scaled gold, boundary, cycling ===

describe('DailyReward — streak-scaled gold rewards', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('Day 1 reward is exactly 50 gold', () => {
    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(50);
  });

  it('Day 7 reward is exactly 300 gold (max streak)', () => {
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    meta.dailyStreak = 6; // will advance to 7
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(7);
    expect(reward!.gold).toBe(300);
  });

  it('gold scales monotonically from Day 1 to Day 7', () => {
    const g = BALANCE.DAILY_REWARDS.streakGold;
    for (let i = 0; i < g.length - 1; i++) {
      expect(g[i + 1]).toBeGreaterThanOrEqual(g[i]);
    }
  });

  it('total 7-day cycle gold equals sum of all streak rewards', () => {
    const total = BALANCE.DAILY_REWARDS.streakGold.reduce((sum, g) => sum + g, 0);
    expect(total).toBe(50 + 75 + 100 + 125 + 150 + 200 + 300);
  });
});

describe('DailyReward — streak break resets to Day 1', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('missing 1 day resets streak to 1', () => {
    const meta = SaveManager.loadMeta();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    meta.lastLoginDate = formatDate(twoDaysAgo);
    meta.dailyStreak = 6; // was on day 6
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);
  });

  it('missing 7 days resets streak to 1', () => {
    const meta = SaveManager.loadMeta();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 8);
    meta.lastLoginDate = formatDate(weekAgo);
    meta.dailyStreak = 7;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1);
  });

  it('missing 30 days still resets to 1', () => {
    const meta = SaveManager.loadMeta();
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 30);
    meta.lastLoginDate = formatDate(longAgo);
    meta.dailyStreak = 4;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(50);
  });
});

describe('DailyReward — midnight boundary', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('can claim again after midnight (date changes)', () => {
    // Claim today
    SaveManager.claimDailyReward();
    expect(SaveManager.checkDailyReward()).toBeNull();

    // Simulate: set lastLoginDate to yesterday (as if midnight passed)
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    SaveManager.saveMeta(meta);

    // Should be able to claim again
    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(2); // consecutive day
  });

  it('same date string means already claimed', () => {
    SaveManager.claimDailyReward();
    const meta = SaveManager.loadMeta();
    expect(meta.lastLoginDate).toBe(formatDate(new Date()));
    expect(SaveManager.checkDailyReward()).toBeNull();
  });
});

describe('DailyReward — max streak cycling', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('after Day 7 completes, next consecutive day resets to Day 1', () => {
    // Set up: just completed Day 7
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = formatDate(yesterday);
    meta.dailyStreak = 7;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward!.streak).toBe(1); // wraps back
    expect(reward!.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]); // Day 1 gold
  });

  it('full 7-day cycle: Day 1 through Day 7 and back to Day 1', () => {
    // Day 1 (fresh start)
    const day1 = SaveManager.claimDailyReward();
    expect(day1.streak).toBe(1);

    // Day 2..7
    for (let d = 2; d <= 7; d++) {
      const meta = SaveManager.loadMeta();
      const y = new Date();
      y.setDate(y.getDate() - 1);
      meta.lastLoginDate = formatDate(y);
      SaveManager.saveMeta(meta);

      const claim = SaveManager.claimDailyReward();
      expect(claim.streak).toBe(d);
      expect(claim.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[d - 1]);
    }

    // Day 8 = wraps to Day 1
    const meta = SaveManager.loadMeta();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    meta.lastLoginDate = formatDate(y);
    SaveManager.saveMeta(meta);

    const day8 = SaveManager.claimDailyReward();
    expect(day8.streak).toBe(1);
    expect(day8.gold).toBe(BALANCE.DAILY_REWARDS.streakGold[0]);
  });
});
