/**
 * Weapon SFX routing tests — verifies that each weapon ID maps to
 * the correct RetroSFX method name via the extracted getWeaponSfxMethod().
 *
 * Tests cover:
 *  - All T1 weapon → SFX mappings
 *  - All T2 (evolved) weapon → SFX mappings
 *  - Default/unknown → weaponBullet fallback
 *  - undefined → weaponBullet fallback
 */
import { describe, it, expect } from 'vitest';
import { getWeaponSfxMethod, type WeaponSfxMethod } from '../../src/audio/weaponSfxRouting';

describe('Weapon SFX routing — T1 weapons', () => {
  const t1Cases: [string, WeaponSfxMethod][] = [
    ['laser_beam', 'weaponLaser'],
    ['bomb', 'weaponBomb'],
    ['missile', 'weaponMissile'],
    ['shuriken', 'weaponShuriken'],
    ['napalm', 'weaponNapalm'],
    ['lightning', 'weaponChain'],
    ['plasma_gatling', 'weaponAoe'],
    ['railgun', 'weaponLaser'],
  ];

  for (const [weaponId, expected] of t1Cases) {
    it(`${weaponId} → ${expected}()`, () => {
      expect(getWeaponSfxMethod(weaponId)).toBe(expected);
    });
  }
});

describe('Weapon SFX routing — T2 (evolved) weapons', () => {
  const t2Cases: [string, WeaponSfxMethod][] = [
    ['inferno_beam', 'weaponLaser'],
    ['thunder_bomb', 'weaponBomb'],
    ['viper_salvo', 'weaponMissile'],
    ['cluster_warhead', 'weaponNapalm'],
    ['tesla_arc', 'weaponChain'],
    ['scatter_storm', 'weaponAoe'],
  ];

  for (const [weaponId, expected] of t2Cases) {
    it(`${weaponId} → ${expected}()`, () => {
      expect(getWeaponSfxMethod(weaponId)).toBe(expected);
    });
  }
});

describe('Weapon SFX routing — default/fallback', () => {
  it('unknown weapon ID → weaponBullet()', () => {
    expect(getWeaponSfxMethod('unknown_weapon')).toBe('weaponBullet');
  });

  it('undefined → weaponBullet()', () => {
    expect(getWeaponSfxMethod(undefined)).toBe('weaponBullet');
  });

  it('empty string → weaponBullet()', () => {
    expect(getWeaponSfxMethod('')).toBe('weaponBullet');
  });

  it('energy_shot (bullet-type) → weaponBullet()', () => {
    expect(getWeaponSfxMethod('energy_shot')).toBe('weaponBullet');
  });

  it('shotgun (bullet-type) → weaponBullet()', () => {
    expect(getWeaponSfxMethod('shotgun')).toBe('weaponBullet');
  });

  it('rapid_fire (bullet-type) → weaponBullet()', () => {
    expect(getWeaponSfxMethod('rapid_fire')).toBe('weaponBullet');
  });
});

describe('Weapon SFX routing — return type is always valid method name', () => {
  const validMethods: WeaponSfxMethod[] = [
    'weaponLaser',
    'weaponBomb',
    'weaponMissile',
    'weaponShuriken',
    'weaponNapalm',
    'weaponChain',
    'weaponAoe',
    'weaponBullet',
  ];

  const allWeaponIds = [
    'laser_beam',
    'railgun',
    'inferno_beam',
    'bomb',
    'thunder_bomb',
    'missile',
    'viper_salvo',
    'shuriken',
    'napalm',
    'cluster_warhead',
    'lightning',
    'tesla_arc',
    'plasma_gatling',
    'scatter_storm',
    'energy_shot',
    'shotgun',
    'rapid_fire',
    undefined,
    '',
    'nonexistent',
  ];

  for (const weaponId of allWeaponIds) {
    it(`getWeaponSfxMethod('${weaponId}') returns a valid SFX method name`, () => {
      const result = getWeaponSfxMethod(weaponId);
      expect(validMethods).toContain(result);
    });
  }
});
