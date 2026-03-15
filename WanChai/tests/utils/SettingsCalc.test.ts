import { describe, it, expect } from 'vitest';
import { clampVolume, mergeSettings, addDiscovery, isValidLocale, type Settings } from '../../src/utils/SettingsCalc';

// ── clampVolume ──────────────────────────────────────────────────────────────

describe('clampVolume', () => {
  it('returns 0 for negative values', () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(-100)).toBe(0);
  });

  it('returns 1 for values above 1', () => {
    expect(clampVolume(1.5)).toBe(1);
    expect(clampVolume(999)).toBe(1);
  });

  it('returns 0 for NaN', () => {
    expect(clampVolume(NaN)).toBe(0);
  });

  it('returns 0 for Infinity', () => {
    expect(clampVolume(Infinity)).toBe(0);
    expect(clampVolume(-Infinity)).toBe(0);
  });

  it('returns exactly 0 for input 0', () => {
    expect(clampVolume(0)).toBe(0);
  });

  it('returns exactly 1 for input 1', () => {
    expect(clampVolume(1)).toBe(1);
  });

  it('preserves valid values between 0 and 1', () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(0.12)).toBeCloseTo(0.12, 10);
    expect(clampVolume(0.001)).toBeCloseTo(0.001, 10);
  });
});

// ── mergeSettings ────────────────────────────────────────────────────────────

describe('mergeSettings', () => {
  const DEFAULTS: Settings = {
    bgmVolume: 0.12,
    bgmMuted: false,
    sfxVolume: 0.8,
    sfxMuted: false,
    vibration: true,
  };

  it('returns defaults when saved is empty', () => {
    const result = mergeSettings({}, DEFAULTS);
    expect(result).toEqual(DEFAULTS);
  });

  it('partial override: only bgmVolume', () => {
    const result = mergeSettings({ bgmVolume: 0.5 }, DEFAULTS);
    expect(result.bgmVolume).toBe(0.5);
    expect(result.bgmMuted).toBe(false);
    expect(result.sfxVolume).toBe(0.8);
    expect(result.vibration).toBe(true);
  });

  it('full override replaces all defaults', () => {
    const saved: Settings = {
      bgmVolume: 0.3,
      bgmMuted: true,
      sfxVolume: 0.6,
      sfxMuted: true,
      vibration: false,
    };
    const result = mergeSettings(saved, DEFAULTS);
    expect(result).toEqual(saved);
  });

  it('clamps out-of-range volume during merge', () => {
    const result = mergeSettings({ bgmVolume: 2.0, sfxVolume: -1.0 }, DEFAULTS);
    expect(result.bgmVolume).toBe(1);
    expect(result.sfxVolume).toBe(0);
  });

  it('clamps NaN volume to 0 during merge', () => {
    const result = mergeSettings({ bgmVolume: NaN }, DEFAULTS);
    expect(result.bgmVolume).toBe(0);
  });
});

// ── addDiscovery ─────────────────────────────────────────────────────────────

describe('addDiscovery', () => {
  it('adds a new item to an empty list', () => {
    const result = addDiscovery([], 'shotgun');
    expect(result).toEqual(['shotgun']);
  });

  it('adds a new item to existing list', () => {
    const result = addDiscovery(['energy_shot'], 'shotgun');
    expect(result).toEqual(['energy_shot', 'shotgun']);
  });

  it('does not add duplicate', () => {
    const result = addDiscovery(['energy_shot', 'shotgun'], 'shotgun');
    expect(result).toEqual(['energy_shot', 'shotgun']);
    expect(result.length).toBe(2);
  });

  it('does not mutate the original array', () => {
    const original = ['energy_shot'];
    const result = addDiscovery(original, 'shotgun');
    expect(original).toEqual(['energy_shot']);
    expect(result).not.toBe(original);
  });

  it('returns new array even for duplicate (immutability)', () => {
    const original = ['energy_shot'];
    const result = addDiscovery(original, 'energy_shot');
    expect(result).not.toBe(original);
    expect(result).toEqual(['energy_shot']);
  });
});

// ── isValidLocale ────────────────────────────────────────────────────────────

describe('isValidLocale', () => {
  it('returns true for "en"', () => {
    expect(isValidLocale('en')).toBe(true);
  });

  it('returns true for "ko"', () => {
    expect(isValidLocale('ko')).toBe(true);
  });

  it('returns false for unsupported locale "ja"', () => {
    expect(isValidLocale('ja')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidLocale('')).toBe(false);
  });

  it('returns false for uppercase "EN"', () => {
    expect(isValidLocale('EN')).toBe(false);
  });

  it('returns false for random string', () => {
    expect(isValidLocale('xyz')).toBe(false);
  });
});
