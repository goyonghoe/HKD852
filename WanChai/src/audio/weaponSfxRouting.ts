/**
 * Pure weapon → SFX method routing table.
 * Extracted from RunScene.playWeaponSfx() so it can be unit-tested
 * without Phaser scene dependencies.
 */

export type WeaponSfxMethod =
  | 'weaponLaser'
  | 'weaponBomb'
  | 'weaponMissile'
  | 'weaponShuriken'
  | 'weaponNapalm'
  | 'weaponChain'
  | 'weaponAoe'
  | 'weaponBullet';

/**
 * Maps a weapon ID to the RetroSFX method name to call.
 * Returns 'weaponBullet' as the default for unknown/undefined IDs.
 */
export function getWeaponSfxMethod(weaponId?: string): WeaponSfxMethod {
  switch (weaponId) {
    case 'laser_beam':
    case 'railgun':
    case 'inferno_beam':
      return 'weaponLaser';
    case 'bomb':
    case 'thunder_bomb':
      return 'weaponBomb';
    case 'missile':
    case 'viper_salvo':
      return 'weaponMissile';
    case 'shuriken':
      return 'weaponShuriken';
    case 'napalm':
    case 'cluster_warhead':
      return 'weaponNapalm';
    case 'lightning':
    case 'tesla_arc':
      return 'weaponChain';
    case 'plasma_gatling':
    case 'scatter_storm':
      return 'weaponAoe';
    default:
      return 'weaponBullet';
  }
}
