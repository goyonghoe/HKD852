import type { EnemyDef } from '../types/enemy';

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  // ── Ground enemies: walk on the floor, horizontal movement only ──
  basic: {
    id: 'basic',
    shape: 'circle',
    baseSize: 12,
    baseSpeed: 45, // was 40
    baseHp: 18, // was 10 — need 2 hits from energy_shot
    baseDamage: 8, // was 5
    behavior: 'march',
    xpValue: 1,
    colorKey: 'ENEMY_BASIC',
    category: 'ground',
  },
  fast: {
    id: 'fast',
    shape: 'triangle',
    baseSize: 10,
    baseSpeed: 90, // was 80
    baseHp: 12, // was 8
    baseDamage: 12, // was 8
    behavior: 'dash',
    xpValue: 2,
    colorKey: 'ENEMY_FAST',
    category: 'ground',
    attackStyle: 'suicide',
  },
  tank: {
    id: 'tank',
    shape: 'rect',
    baseSize: 18,
    baseSpeed: 22, // was 20
    baseHp: 70, // was 50
    baseDamage: 20, // was 15
    behavior: 'slow_march',
    xpValue: 3,
    colorKey: 'ENEMY_TANK',
    category: 'ground',
    knockbackImmune: true,
    attackInterval: 2500,
  },
  chaser: {
    id: 'chaser',
    shape: 'triangle',
    baseSize: 12,
    baseSpeed: 60, // was 55
    baseHp: 22, // was 15
    baseDamage: 15, // was 12
    behavior: 'chase',
    xpValue: 3,
    colorKey: 'ENEMY_FAST',
    category: 'ground',
    attackInterval: 1800,
  },
  guardian: {
    id: 'guardian',
    shape: 'rect',
    baseSize: 22,
    baseSpeed: 15, // was 12
    baseHp: 150, // was 100 — truly tanky
    baseDamage: 30, // was 25
    behavior: 'slow_march',
    xpValue: 5,
    colorKey: 'ENEMY_TANK',
    category: 'ground',
    knockbackImmune: true,
    attackInterval: 3000,
  },
  swarm: {
    id: 'swarm',
    shape: 'circle',
    baseSize: 8,
    baseSpeed: 80, // was 70
    baseHp: 8, // was 5
    baseDamage: 5, // was 3
    behavior: 'march',
    xpValue: 1,
    colorKey: 'ENEMY_FAST',
    category: 'ground',
    attackStyle: 'suicide',
  },
  splitter: {
    id: 'splitter',
    shape: 'hexagon',
    baseSize: 16,
    baseSpeed: 35, // was 30
    baseHp: 45, // was 30
    baseDamage: 12, // was 8
    behavior: 'split_on_death',
    xpValue: 4,
    colorKey: 'ENEMY_ELITE',
    category: 'ground',
    attackStyle: 'suicide',
  },

  // ── Air enemies: fly at varying heights with sine-wave Y movement ──
  special: {
    id: 'special',
    shape: 'diamond',
    baseSize: 14,
    baseSpeed: 55, // was 50
    baseHp: 28, // was 20
    baseDamage: 14, // was 10
    behavior: 'zigzag',
    xpValue: 3,
    colorKey: 'ENEMY_SPECIAL',
    category: 'air',
    attackInterval: 1500,
  },
  shooter: {
    id: 'shooter',
    shape: 'diamond',
    baseSize: 14,
    baseSpeed: 28, // was 25
    baseHp: 25, // was 18
    baseDamage: 12, // was 8
    behavior: 'shoot',
    xpValue: 4,
    colorKey: 'ENEMY_SPECIAL',
    category: 'air',
    attackStyle: 'ranged',
    attackInterval: 2000,
    projectileSpeed: 220, // was 200
  },
  sniper_enemy: {
    id: 'sniper_enemy',
    shape: 'triangle',
    baseSize: 12,
    baseSpeed: 22, // was 20
    baseHp: 20, // was 15
    baseDamage: 20, // was 15 — hurts
    behavior: 'shoot',
    xpValue: 4,
    colorKey: 'ENEMY_SPECIAL',
    category: 'air',
    attackStyle: 'ranged',
    attackInterval: 2500, // was 3000 — shoots faster
    projectileSpeed: 350, // was 300
  },
  teleporter: {
    id: 'teleporter',
    shape: 'diamond',
    baseSize: 13,
    baseSpeed: 35, // was 30
    baseHp: 28, // was 20
    baseDamage: 14, // was 10
    behavior: 'teleport',
    xpValue: 4,
    colorKey: 'ENEMY_ELITE',
    category: 'air',
    attackInterval: 1800,
  },

  // ── Bosses: spawn from right, ground or air depending on type ──
  boss: {
    id: 'boss',
    shape: 'hexagon',
    baseSize: 32,
    baseSpeed: 18, // was 15
    baseHp: 1200, // was 800
    baseDamage: 40, // was 35
    behavior: 'boss_chase',
    xpValue: 100,
    colorKey: 'ENEMY_ELITE',
    category: 'ground',
    knockbackImmune: true,
  },
  boss_circle: {
    id: 'boss_circle',
    shape: 'diamond',
    baseSize: 28,
    baseSpeed: 28, // was 25
    baseHp: 1800, // was 1200
    baseDamage: 35, // was 30
    behavior: 'boss_circle',
    xpValue: 120,
    colorKey: 'ENEMY_SPECIAL',
    category: 'air',
    knockbackImmune: true,
    attackStyle: 'ranged',
    attackInterval: 2000, // 2s between shots → 17.5 DPS to base
    projectileSpeed: 280, // shooter 220 < 280 < sniper 350
  },
  boss_burst: {
    id: 'boss_burst',
    shape: 'rect',
    baseSize: 36,
    baseSpeed: 15, // was 12
    baseHp: 3000, // was 2000
    baseDamage: 45, // was 60 — reduced: Phase 2 ATK 293 instant-killed base (FAIL fix)
    behavior: 'boss_burst',
    xpValue: 150,
    colorKey: 'ENEMY_TANK',
    category: 'ground',
    knockbackImmune: true,
  },
};
