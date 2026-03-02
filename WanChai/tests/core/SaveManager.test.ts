import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../../src/managers/SaveManager';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
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
    expect(disc.weapons.filter(w => w === 'shotgun').length).toBe(1);
  });

  it('discoverEnemy adds without duplicates', () => {
    SaveManager.discoverEnemy('boss');
    SaveManager.discoverEnemy('boss');
    const disc = SaveManager.getDiscovered();
    expect(disc.enemies.filter(e => e === 'boss').length).toBe(1);
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
});
