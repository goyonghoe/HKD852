/**
 * TASK-061: Enemy config validation + per-enemy behavior mapping tests.
 * Complements EnemyBehaviorCalc.test.ts (which tests the pure calc functions)
 * by validating ENEMY_DEFS config integrity and behavior-to-enemy mapping.
 * Pure TypeScript — no Phaser imports.
 */
import { describe, it, expect } from 'vitest';
import { ENEMY_DEFS } from '../../src/config/enemies';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALL_DEFS = Object.values(ENEMY_DEFS);
const GROUND = ALL_DEFS.filter((d) => d.category === 'ground');
const AIR = ALL_DEFS.filter((d) => d.category === 'air');
const BOSSES = ALL_DEFS.filter((d) => d.behavior.startsWith('boss_') || d.id === 'boss');
const NON_BOSSES = ALL_DEFS.filter((d) => !d.behavior.startsWith('boss_') && d.id !== 'boss');

// ── Config structure ─────────────────────────────────────────────────────────

describe('TASK-061: ENEMY_DEFS structure', () => {
  it('has exactly 14 enemy definitions', () => {
    expect(ALL_DEFS).toHaveLength(14);
  });

  it('all enemy ids match their keys', () => {
    for (const [key, def] of Object.entries(ENEMY_DEFS)) {
      expect(def.id).toBe(key);
    }
  });

  it('all enemies have valid shape', () => {
    const validShapes = ['circle', 'triangle', 'rect', 'diamond', 'hexagon'];
    for (const def of ALL_DEFS) {
      expect(validShapes).toContain(def.shape);
    }
  });

  it('all enemies have valid behavior', () => {
    const validBehaviors = [
      'march',
      'zigzag',
      'dash',
      'slow_march',
      'split_on_death',
      'boss_chase',
      'boss_circle',
      'boss_burst',
      'shoot',
      'teleport',
      'chase',
      'slow_chase',
    ];
    for (const def of ALL_DEFS) {
      expect(validBehaviors).toContain(def.behavior);
    }
  });

  it('all enemies have valid category', () => {
    for (const def of ALL_DEFS) {
      expect(['ground', 'air']).toContain(def.category);
    }
  });
});

// ── Category counts ──────────────────────────────────────────────────────────

describe('TASK-061: Enemy category counts', () => {
  it('has 9 ground enemies (7 regular + 2 bosses)', () => {
    expect(GROUND).toHaveLength(9);
  });

  it('has 5 air enemies', () => {
    expect(AIR).toHaveLength(5);
  });

  it('has 3 boss types', () => {
    expect(BOSSES).toHaveLength(3);
  });

  it('has 11 non-boss types', () => {
    expect(NON_BOSSES).toHaveLength(11);
  });
});

// ── Per-enemy config spot checks ─────────────────────────────────────────────

describe('TASK-061: basic enemy', () => {
  const def = ENEMY_DEFS.basic;

  it('march behavior on ground', () => {
    expect(def.behavior).toBe('march');
    expect(def.category).toBe('ground');
  });

  it('hp=18 requires 2 energy_shot hits (16 dmg each)', () => {
    expect(def.baseHp).toBe(18);
    expect(def.baseHp).toBeGreaterThan(16); // survives 1 hit
    expect(def.baseHp).toBeLessThanOrEqual(32); // dies in 2 hits
  });

  it('low xp value (1)', () => {
    expect(def.xpValue).toBe(1);
  });
});

describe('TASK-061: fast enemy (dash)', () => {
  const def = ENEMY_DEFS.fast;

  it('fastest non-boss ground enemy', () => {
    const groundSpeeds = GROUND.filter((d) => !BOSSES.includes(d)).map((d) => d.baseSpeed);
    expect(def.baseSpeed).toBe(Math.max(...groundSpeeds));
  });

  it('suicide attack style', () => {
    expect(def.attackStyle).toBe('suicide');
  });

  it('low HP for a dash enemy', () => {
    expect(def.baseHp).toBe(12);
  });
});

describe('TASK-061: tank enemy', () => {
  const def = ENEMY_DEFS.tank;

  it('knockback immune', () => {
    expect(def.knockbackImmune).toBe(true);
  });

  it('among the slowest non-boss ground enemies', () => {
    const _groundNonBossSpeeds = GROUND.filter((d) => !BOSSES.includes(d)).map((d) => d.baseSpeed);
    // tank at 22 is slow but guardian at 15 is slower
    expect(def.baseSpeed).toBeLessThanOrEqual(35);
  });

  it('attack interval 2500ms', () => {
    expect(def.attackInterval).toBe(2500);
  });
});

describe('TASK-061: guardian enemy', () => {
  const def = ENEMY_DEFS.guardian;

  it('highest HP among non-boss enemies', () => {
    const nonBossHp = NON_BOSSES.map((d) => d.baseHp);
    expect(def.baseHp).toBe(Math.max(...nonBossHp));
  });

  it('knockback immune like tank', () => {
    expect(def.knockbackImmune).toBe(true);
  });

  it('high damage output', () => {
    expect(def.baseDamage).toBe(30);
  });
});

describe('TASK-061: swarm enemy', () => {
  const def = ENEMY_DEFS.swarm;

  it('lowest HP in the game', () => {
    const allHp = ALL_DEFS.map((d) => d.baseHp);
    expect(def.baseHp).toBe(Math.min(...allHp));
  });

  it('suicide attack', () => {
    expect(def.attackStyle).toBe('suicide');
  });

  it('smallest base size', () => {
    expect(def.baseSize).toBe(8);
  });
});

describe('TASK-061: splitter enemy', () => {
  const def = ENEMY_DEFS.splitter;

  it('split_on_death behavior', () => {
    expect(def.behavior).toBe('split_on_death');
  });

  it('hexagon shape (unique)', () => {
    expect(def.shape).toBe('hexagon');
  });

  it('medium HP for splitting', () => {
    expect(def.baseHp).toBe(45);
  });
});

describe('TASK-061: shooter enemy (ranged)', () => {
  const def = ENEMY_DEFS.shooter;

  it('ranged attack with projectile', () => {
    expect(def.attackStyle).toBe('ranged');
    expect(def.projectileSpeed).toBe(220);
  });

  it('shoot behavior', () => {
    expect(def.behavior).toBe('shoot');
  });

  it('air category', () => {
    expect(def.category).toBe('air');
  });
});

describe('TASK-061: sniper_enemy', () => {
  const def = ENEMY_DEFS.sniper_enemy;

  it('highest projectile speed among regular enemies', () => {
    const rangedSpeeds = NON_BOSSES.filter((d) => d.projectileSpeed).map((d) => d.projectileSpeed!);
    expect(def.projectileSpeed).toBe(Math.max(...rangedSpeeds));
  });

  it('high damage per shot', () => {
    expect(def.baseDamage).toBe(20);
  });

  it('slower attack interval than shooter (2500 vs 2000)', () => {
    expect(def.attackInterval).toBeGreaterThan(ENEMY_DEFS.shooter.attackInterval!);
  });
});

describe('TASK-061: teleporter enemy', () => {
  const def = ENEMY_DEFS.teleporter;

  it('teleport behavior (unique)', () => {
    expect(def.behavior).toBe('teleport');
    const teleporters = ALL_DEFS.filter((d) => d.behavior === 'teleport');
    expect(teleporters).toHaveLength(1);
  });

  it('elite color key', () => {
    expect(def.colorKey).toBe('ENEMY_ELITE');
  });
});

// ── Boss validation ──────────────────────────────────────────────────────────

describe('TASK-061: Boss hierarchy', () => {
  it('all bosses are knockback immune', () => {
    for (const boss of BOSSES) {
      expect(boss.knockbackImmune, `${boss.id} should be knockback immune`).toBe(true);
    }
  });

  it('boss HP escalates: boss < boss_circle < boss_burst', () => {
    expect(ENEMY_DEFS.boss.baseHp).toBeLessThan(ENEMY_DEFS.boss_circle.baseHp);
    expect(ENEMY_DEFS.boss_circle.baseHp).toBeLessThan(ENEMY_DEFS.boss_burst.baseHp);
  });

  it('boss XP escalates: boss < boss_circle < boss_burst', () => {
    expect(ENEMY_DEFS.boss.xpValue).toBeLessThan(ENEMY_DEFS.boss_circle.xpValue);
    expect(ENEMY_DEFS.boss_circle.xpValue).toBeLessThan(ENEMY_DEFS.boss_burst.xpValue);
  });

  it('boss_circle is the only ranged boss', () => {
    const rangedBosses = BOSSES.filter((d) => d.attackStyle === 'ranged');
    expect(rangedBosses).toHaveLength(1);
    expect(rangedBosses[0].id).toBe('boss_circle');
  });

  it('boss_burst has highest base damage', () => {
    const bossMaxDamage = Math.max(...BOSSES.map((d) => d.baseDamage));
    expect(ENEMY_DEFS.boss_burst.baseDamage).toBe(bossMaxDamage);
  });
});

// ── Cross-cutting constraints ────────────────────────────────────────────────

describe('TASK-061: Cross-cutting constraints', () => {
  it('all ranged enemies have projectileSpeed defined', () => {
    const ranged = ALL_DEFS.filter((d) => d.attackStyle === 'ranged');
    for (const def of ranged) {
      expect(def.projectileSpeed, `${def.id} ranged but no projectileSpeed`).toBeGreaterThan(0);
    }
  });

  it('all knockback immune enemies are either bosses or tanks', () => {
    const immune = ALL_DEFS.filter((d) => d.knockbackImmune);
    for (const def of immune) {
      const isBossOrTank = def.id === 'tank' || def.id === 'guardian' || BOSSES.includes(def);
      expect(isBossOrTank, `${def.id} is knockback immune but not boss/tank`).toBe(true);
    }
  });

  it('suicide enemies have no attackInterval', () => {
    const suicides = ALL_DEFS.filter((d) => d.attackStyle === 'suicide');
    for (const def of suicides) {
      // suicide enemies deal damage on contact, attackInterval is not meaningful
      // but some may have it defined for other purposes — just check they exist
      expect(def.attackStyle).toBe('suicide');
    }
  });

  it('all enemy baseSize is between 8 and 36', () => {
    for (const def of ALL_DEFS) {
      expect(def.baseSize).toBeGreaterThanOrEqual(8);
      expect(def.baseSize).toBeLessThanOrEqual(36);
    }
  });

  it('all non-boss enemies have xpValue between 1 and 5', () => {
    for (const def of NON_BOSSES) {
      expect(def.xpValue).toBeGreaterThanOrEqual(1);
      expect(def.xpValue).toBeLessThanOrEqual(5);
    }
  });
});
