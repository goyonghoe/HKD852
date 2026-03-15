import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../../src/managers/SaveManager';

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

describe('SaveManager', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('loadMeta returns defaults when no save exists', () => {
    const meta = SaveManager.loadMeta();
    expect(meta.totalGold).toBe(0);
    expect(meta.runsCompleted).toBe(0);
    expect(meta.upgrades).toEqual({});
  });

  it('saveMeta persists and can be reloaded', () => {
    const meta = SaveManager.loadMeta();
    meta.totalGold = 500;
    meta.bestKills = 42;
    SaveManager.saveMeta(meta);

    const loaded = SaveManager.loadMeta();
    expect(loaded.totalGold).toBe(500);
    expect(loaded.bestKills).toBe(42);
  });

  it('setBgmVolume clamps between 0 and 1', () => {
    SaveManager.setBgmVolume(1.5);
    expect(SaveManager.getBgmSettings().volume).toBe(1);

    SaveManager.setBgmVolume(-0.5);
    expect(SaveManager.getBgmSettings().volume).toBe(0);

    SaveManager.setBgmVolume(0.5);
    expect(SaveManager.getBgmSettings().volume).toBe(0.5);
  });

  it('setSfxVolume clamps between 0 and 1', () => {
    SaveManager.setSfxVolume(2.0);
    expect(SaveManager.getSfxSettings().volume).toBe(1);

    SaveManager.setSfxVolume(-1);
    expect(SaveManager.getSfxSettings().volume).toBe(0);
  });

  it('mute toggles persist', () => {
    SaveManager.setBgmMuted(true);
    expect(SaveManager.getBgmSettings().muted).toBe(true);

    SaveManager.setBgmMuted(false);
    expect(SaveManager.getBgmSettings().muted).toBe(false);

    SaveManager.setSfxMuted(true);
    expect(SaveManager.getSfxSettings().muted).toBe(true);
  });

  it('discoverWeapon adds without duplicates', () => {
    SaveManager.discoverWeapon('shotgun');
    SaveManager.discoverWeapon('shotgun');
    const disc = SaveManager.getDiscovered();
    expect(disc.weapons.filter((w) => w === 'shotgun').length).toBe(1);
  });

  it('discoverEnemy adds without duplicates', () => {
    SaveManager.discoverEnemy('boss');
    SaveManager.discoverEnemy('boss');
    const disc = SaveManager.getDiscovered();
    expect(disc.enemies.filter((e) => e === 'boss').length).toBe(1);
  });

  it('resetAll clears everything', () => {
    SaveManager.saveMeta({ ...SaveManager.loadMeta(), totalGold: 999 });
    SaveManager.resetAll();
    expect(SaveManager.loadMeta().totalGold).toBe(0);
  });

  it('hasProgression detects gold', () => {
    expect(SaveManager.hasProgression()).toBe(false);
    const meta = SaveManager.loadMeta();
    meta.totalGold = 10;
    SaveManager.saveMeta(meta);
    expect(SaveManager.hasProgression()).toBe(true);
  });

  it('hasProgression detects runs completed', () => {
    const meta = SaveManager.loadMeta();
    meta.runsCompleted = 1;
    SaveManager.saveMeta(meta);
    expect(SaveManager.hasProgression()).toBe(true);
  });

  it('hasActiveRun returns false when no run saved', () => {
    expect(SaveManager.hasActiveRun()).toBe(false);
  });

  it('load handles corrupted data gracefully', () => {
    store['neonsurvivor_save'] = 'not valid json';
    const meta = SaveManager.loadMeta();
    expect(meta.totalGold).toBe(0); // fallback to default
  });

  it('default meta includes totalGoldEarned', () => {
    const meta = SaveManager.loadMeta();
    expect(meta.totalGoldEarned).toBe(0);
  });
});

describe('SaveManager.isCharacterUnlocked (TASK-041)', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
  });

  it('returns true for HAI (always unlocked)', () => {
    expect(SaveManager.isCharacterUnlocked('hai')).toBe(true);
  });

  it('returns true for NOVA (always unlocked)', () => {
    expect(SaveManager.isCharacterUnlocked('nova')).toBe(true);
  });

  it('returns false for SOL when runsCompleted < 3', () => {
    const meta = SaveManager.loadMeta();
    meta.runsCompleted = 2;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('sol')).toBe(false);
  });

  it('returns true for SOL when runsCompleted >= 3', () => {
    const meta = SaveManager.loadMeta();
    meta.runsCompleted = 3;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('sol')).toBe(true);
  });

  it('returns false for MEI when totalGoldEarned < 500', () => {
    const meta = SaveManager.loadMeta();
    meta.totalGoldEarned = 499;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('mei')).toBe(false);
  });

  it('returns true for MEI when totalGoldEarned >= 500', () => {
    const meta = SaveManager.loadMeta();
    meta.totalGoldEarned = 500;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('mei')).toBe(true);
  });

  it('returns false for KAI when bestKills < 200', () => {
    const meta = SaveManager.loadMeta();
    meta.bestKills = 199;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('kai')).toBe(false);
  });

  it('returns true for KAI when bestKills >= 200', () => {
    const meta = SaveManager.loadMeta();
    meta.bestKills = 200;
    SaveManager.saveMeta(meta);
    expect(SaveManager.isCharacterUnlocked('kai')).toBe(true);
  });

  it('returns false for unknown character', () => {
    expect(SaveManager.isCharacterUnlocked('nonexistent')).toBe(false);
  });
});

describe('SaveManager.dailyReward (TASK-042)', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('checkDailyReward returns reward for fresh player', () => {
    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1);
    expect(reward!.gold).toBe(50); // Day 1 = 50 gold
  });

  it('checkDailyReward returns null after claiming today', () => {
    SaveManager.claimDailyReward();
    const reward = SaveManager.checkDailyReward();
    expect(reward).toBeNull();
  });

  it('claimDailyReward adds gold to totalGold', () => {
    const before = SaveManager.loadMeta().totalGold;
    const claimed = SaveManager.claimDailyReward();
    const after = SaveManager.loadMeta().totalGold;
    expect(after).toBe(before + claimed.gold);
  });

  it('claimDailyReward sets streak to 1 for first claim', () => {
    const claimed = SaveManager.claimDailyReward();
    expect(claimed.streak).toBe(1);
    const meta = SaveManager.loadMeta();
    expect(meta.dailyStreak).toBe(1);
  });

  it('claimDailyReward returns 0 gold if already claimed', () => {
    SaveManager.claimDailyReward();
    const second = SaveManager.claimDailyReward();
    expect(second.gold).toBe(0);
    expect(second.streak).toBe(0);
  });

  it('streak resets to 1 after missing a day', () => {
    // Simulate claiming yesterday with streak 3
    const meta = SaveManager.loadMeta();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    meta.lastLoginDate = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;
    meta.dailyStreak = 3;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1); // reset because missed a day
    expect(reward!.gold).toBe(50); // Day 1 gold
  });

  it('streak advances when consecutive', () => {
    // Simulate claiming yesterday with streak 2
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    meta.dailyStreak = 2;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(3); // consecutive: 2 -> 3
    expect(reward!.gold).toBe(100); // Day 3 = 100 gold
  });

  it('streak wraps after day 7 back to day 1', () => {
    // Simulate claiming yesterday with streak 7
    const meta = SaveManager.loadMeta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    meta.lastLoginDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    meta.dailyStreak = 7;
    SaveManager.saveMeta(meta);

    const reward = SaveManager.checkDailyReward();
    expect(reward).not.toBeNull();
    expect(reward!.streak).toBe(1); // wraps 7 -> 1
    expect(reward!.gold).toBe(50); // Day 1 = 50 gold
  });
});
