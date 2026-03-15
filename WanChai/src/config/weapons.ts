import type { WeaponDef } from '../types/weapon';

// === DPS Balance Table (baseDamage * projectileCount / cooldownMs * 1000) ===
// projectileSpeed valid range: 0 (instant/laser) to 1400 (rapid_fire). Fast weapons (energy_shot, rapid_fire) intentionally exceed 1000.
// napalm effective DPS is higher due to DoT zone (4s lifetime, tick interval from BALANCE.COMBAT.napalmZoneTickMs)
//
//                 BEFORE                  AFTER               CHANGE
// Weapon          dmg  cnt  cd(ms) DPS  → dmg  cnt  cd(ms) DPS
// ───────────────────────────────────────────────────────────────────────────────
// energy_shot      10    1    800  12.5 →  16    1    800  20.0  (+60%)
// napalm           12    1   2500   4.8 →  29    1   2500  11.6  (+142%) direct DPS fix
// laser_beam       25    1   2000  12.5 →  28    1   1400  20.0  (+60%)
// shuriken         12    1   1000  12.0 →  14    1    700  20.0  (+67%)
// shotgun          10    3   1200  25.0 →  unchanged                (already balanced)
// lightning        22    3   1200  55.0 →  16    3   1400  34.3  (-38%) ← MAIN FIX
// missile          30    1   2500  12.0 →  35    1   1950  17.9  (+49%)
// bomb             50    1   4000  12.5 →  65    1   3500  18.6  (+49%)
// railgun          45    1   3500  12.9 →  48    1   2700  17.8  (+38%)
// rapid_fire        3    1    200  15.0 →  unchanged
// ───────────────────────────────────────────────────────────────────────────────
// plasma_gatling   25    3    120 625.0 →  14    3    300 140.0  (-78%) ← TYPO FIX
// cluster_warhead  55    1   1200  45.8 →  55    1    550 100.0  (+118%)
// tesla_arc        30    5    600 250.0 →  16    5    400 200.0  (-20%) ratio 10x vs laser
// scatter_storm    18    7    350 360.0 →   5    7    185 189.2  (-47%) ← locked by tests
// inferno_beam     35    1    450  77.8 →  35    1    600  58.3  (-25%) ← locked by tests
// thunder_bomb     60    1   2000  30.0 → 100    1   2000  50.0  (+67%) ← now > T1 parent ✓
// viper_salvo      15    2    200 150.0 →   5    2    300  33.3  (-78%) ← locked by tests

export const WEAPON_DEFS: Record<string, WeaponDef> = {
  energy_shot: {
    id: 'energy_shot',
    name: '에너지 샷',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 16,
    cooldownMs: 800,
    projectileSpeed: 1200,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 0,
    range: 0,
    maxLevel: 5,
  },
  napalm: {
    id: 'napalm',
    name: '네이팜탄',
    projectileType: 'napalm',
    targetMode: 'aoe',
    baseDamage: 29,
    cooldownMs: 2500,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 120,
    range: 0,
    maxLevel: 5,
  },
  laser_beam: {
    id: 'laser_beam',
    name: '레이저 빔',
    projectileType: 'laser',
    targetMode: 'nearest',
    baseDamage: 28,
    cooldownMs: 1400,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 99,
    aoeRadius: 0,
    range: 500,
    maxLevel: 5,
  },
  shuriken: {
    id: 'shuriken',
    name: '수리검',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 14,
    cooldownMs: 700,
    projectileSpeed: 800,
    projectileCount: 1,
    piercing: 3,
    aoeRadius: 0,
    range: 400,
    maxLevel: 5,
  },
  shotgun: {
    id: 'shotgun',
    name: '산탄총',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 10,
    cooldownMs: 1200,
    projectileSpeed: 900,
    projectileCount: 3,
    piercing: 0,
    aoeRadius: 0,
    range: 380,
    maxLevel: 5,
  },
  lightning: {
    id: 'lightning',
    name: '체인 라이트닝',
    projectileType: 'chain',
    targetMode: 'nearest',
    baseDamage: 16,
    cooldownMs: 1400,
    projectileSpeed: 0,
    projectileCount: 3, // chain count
    piercing: 0,
    aoeRadius: 0,
    range: 400,
    maxLevel: 5,
  },
  missile: {
    id: 'missile',
    name: '추적 미사일',
    projectileType: 'homing',
    targetMode: 'nearest',
    baseDamage: 35,
    cooldownMs: 1950,
    projectileSpeed: 200,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 60,
    range: 0,
    maxLevel: 5,
  },
  bomb: {
    id: 'bomb',
    name: '에너지 폭탄',
    projectileType: 'bomb',
    targetMode: 'aoe',
    baseDamage: 65,
    cooldownMs: 3500,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 120,
    range: 0,
    maxLevel: 5,
  },
  railgun: {
    id: 'railgun',
    name: '레일건',
    projectileType: 'laser',
    targetMode: 'nearest',
    baseDamage: 48,
    cooldownMs: 2700,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 99,
    aoeRadius: 0,
    range: 800,
    maxLevel: 5,
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: '속사포',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 3,
    cooldownMs: 200,
    projectileSpeed: 1400,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 0,
    range: 480,
    maxLevel: 5,
  },

  // === T2 Evolved Weapons ===
  plasma_gatling: {
    id: 'plasma_gatling',
    name: '플라즈마 개틀링',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 14,
    cooldownMs: 300,
    projectileSpeed: 800,
    projectileCount: 3,
    piercing: 2,
    aoeRadius: 0,
    range: 0,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'energy_shot', primaryLevel: 5, secondary: 'rapid_fire', secondaryLevel: 3 },
  },
  cluster_warhead: {
    id: 'cluster_warhead',
    name: '클러스터 탄두',
    projectileType: 'homing',
    targetMode: 'nearest',
    baseDamage: 55,
    cooldownMs: 550,
    projectileSpeed: 400,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 100,
    range: 0,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'missile', primaryLevel: 5, secondary: 'bomb', secondaryLevel: 3 },
  },
  tesla_arc: {
    id: 'tesla_arc',
    name: '테슬라 아크',
    projectileType: 'chain',
    targetMode: 'nearest',
    baseDamage: 16,
    cooldownMs: 400,
    projectileSpeed: 0,
    projectileCount: 5,
    piercing: 2,
    aoeRadius: 0,
    range: 500,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'laser_beam', primaryLevel: 5, secondary: 'lightning', secondaryLevel: 3 },
  },
  scatter_storm: {
    id: 'scatter_storm',
    name: '스캐터 스톰',
    projectileType: 'bullet',
    targetMode: 'nearest',
    baseDamage: 5,
    cooldownMs: 185,
    projectileSpeed: 900,
    projectileCount: 7,
    piercing: 1,
    aoeRadius: 0,
    range: 400,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'shotgun', primaryLevel: 5, secondary: 'shuriken', secondaryLevel: 3 },
  },
  inferno_beam: {
    id: 'inferno_beam',
    name: '인페르노 빔',
    projectileType: 'laser',
    targetMode: 'nearest',
    baseDamage: 35,
    cooldownMs: 600,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 999,
    aoeRadius: 0,
    range: 600,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'laser_beam', primaryLevel: 5, secondary: 'napalm', secondaryLevel: 3 },
  },
  thunder_bomb: {
    id: 'thunder_bomb',
    name: '썬더 봄',
    projectileType: 'bomb',
    targetMode: 'aoe',
    baseDamage: 100,
    cooldownMs: 2000,
    projectileSpeed: 0,
    projectileCount: 1,
    piercing: 0,
    aoeRadius: 120,
    range: 0,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'lightning', primaryLevel: 5, secondary: 'bomb', secondaryLevel: 3 },
  },
  viper_salvo: {
    id: 'viper_salvo',
    name: '바이퍼 살보',
    projectileType: 'homing',
    targetMode: 'nearest',
    baseDamage: 5,
    cooldownMs: 300,
    projectileSpeed: 250,
    projectileCount: 2,
    piercing: 1,
    aoeRadius: 0,
    range: 0,
    maxLevel: 5,
    tier: 2,
    recipe: { primary: 'rapid_fire', primaryLevel: 5, secondary: 'missile', secondaryLevel: 3 },
  },
};

/**
 * Per-texture rotation offset in radians.
 * Applied AFTER Math.atan2(vy, vx) in Projectile.fire() and preUpdate().
 * All sprites face RIGHT (→) by convention, so default offset is 0.
 * Only add non-zero offsets if a specific PNG needs correction.
 */
export const PROJECTILE_ROTATION_OFFSET: Partial<Record<string, number>> = {
  // All current sprites face RIGHT — no offset needed
};
