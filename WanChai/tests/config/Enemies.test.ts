import { describe, it, expect } from 'vitest';
import { ENEMY_DEFS } from '../../src/config/enemies';
import { BALANCE } from '../../src/config/balance';
import type { EnemyBehavior } from '../../src/types/enemy';

const enemies = Object.values(ENEMY_DEFS);
const enemyIds = Object.keys(ENEMY_DEFS);

/** Allowed behaviors sourced from the EnemyBehavior union type */
const ALLOWED_BEHAVIORS: EnemyBehavior[] = [
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

describe('Enemies config — required fields', () => {
  it('every enemy has an id', () => {
    for (const e of enemies) {
      expect(e.id).toBeTruthy();
    }
  });

  it('every enemy has a shape', () => {
    for (const e of enemies) {
      expect(e.shape).toBeTruthy();
    }
  });

  it('every enemy has baseHp (positive)', () => {
    for (const e of enemies) {
      expect(e.baseHp).toBeGreaterThan(0);
    }
  });

  it('every enemy has baseSpeed (positive)', () => {
    for (const e of enemies) {
      expect(e.baseSpeed).toBeGreaterThan(0);
    }
  });

  it('every enemy has xpValue (positive)', () => {
    for (const e of enemies) {
      expect(e.xpValue).toBeGreaterThan(0);
    }
  });

  it('every enemy has a behavior', () => {
    for (const e of enemies) {
      expect(e.behavior).toBeTruthy();
    }
  });

  it('every enemy has a colorKey', () => {
    for (const e of enemies) {
      expect(e.colorKey).toBeTruthy();
    }
  });

  it('every enemy has baseDamage (positive)', () => {
    for (const e of enemies) {
      expect(e.baseDamage).toBeGreaterThan(0);
    }
  });

  it('every enemy has baseSize (positive)', () => {
    for (const e of enemies) {
      expect(e.baseSize).toBeGreaterThan(0);
    }
  });
});

describe('Enemies config — no duplicate IDs', () => {
  it('all enemy IDs are unique', () => {
    expect(new Set(enemyIds).size).toBe(enemyIds.length);
  });

  it('each enemy key matches its id field', () => {
    for (const [key, def] of Object.entries(ENEMY_DEFS)) {
      expect(def.id).toBe(key);
    }
  });
});

describe('Enemies config — behavior validation', () => {
  it('all behaviors come from the allowed set', () => {
    for (const e of enemies) {
      expect(ALLOWED_BEHAVIORS).toContain(e.behavior);
    }
  });

  it('boss enemies use boss-prefixed behaviors', () => {
    const bossEnemies = enemies.filter((e) => e.id.startsWith('boss'));
    for (const b of bossEnemies) {
      expect(b.behavior.startsWith('boss_')).toBe(true);
    }
  });

  it('non-boss enemies do not use boss behaviors', () => {
    const nonBoss = enemies.filter((e) => !e.id.startsWith('boss'));
    for (const e of nonBoss) {
      expect(e.behavior.startsWith('boss_')).toBe(false);
    }
  });
});

describe('Enemies config — boss IDs have boss prefix', () => {
  it('all boss-behavior enemies have boss prefix in their ID', () => {
    const bossBehaviors = ['boss_chase', 'boss_circle', 'boss_burst'];
    for (const e of enemies) {
      if (bossBehaviors.includes(e.behavior)) {
        expect(e.id.startsWith('boss')).toBe(true);
      }
    }
  });
});

describe('Enemies config — numeric ranges', () => {
  it('baseHp is a finite number for all enemies', () => {
    for (const e of enemies) {
      expect(Number.isFinite(e.baseHp)).toBe(true);
    }
  });

  it('baseSpeed is a finite number for all enemies', () => {
    for (const e of enemies) {
      expect(Number.isFinite(e.baseSpeed)).toBe(true);
    }
  });

  it('xpValue is a finite number for all enemies', () => {
    for (const e of enemies) {
      expect(Number.isFinite(e.xpValue)).toBe(true);
    }
  });

  it('boss enemies have significantly higher HP than basic enemies', () => {
    const basic = ENEMY_DEFS.basic;
    const bossEnemies = enemies.filter((e) => e.id.startsWith('boss'));
    for (const b of bossEnemies) {
      expect(b.baseHp).toBeGreaterThan(basic.baseHp * 10);
    }
  });

  it('boss enemies have high xpValue', () => {
    const bossEnemies = enemies.filter((e) => e.id.startsWith('boss'));
    for (const b of bossEnemies) {
      expect(b.xpValue).toBeGreaterThanOrEqual(100);
    }
  });
});

describe('Enemies config — attack style', () => {
  it('shooter and sniper enemies have ranged attackStyle', () => {
    const rangedEnemies = enemies.filter((e) => e.id === 'shooter' || e.id === 'sniper_enemy');
    for (const e of rangedEnemies) {
      expect(e.attackStyle).toBe('ranged');
    }
  });

  it('ranged enemies have projectileSpeed > 0', () => {
    const ranged = enemies.filter((e) => e.attackStyle === 'ranged');
    for (const e of ranged) {
      expect(e.projectileSpeed).toBeDefined();
      expect(e.projectileSpeed!).toBeGreaterThan(0);
    }
  });

  it('suicide attackStyle enemies exist (fast, splitter, swarm)', () => {
    const suicideEnemies = enemies.filter((e) => e.attackStyle === 'suicide');
    expect(suicideEnemies.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Enemies config — shape validation', () => {
  const validShapes = ['circle', 'triangle', 'rect', 'diamond', 'hexagon'];

  it('all enemies have valid shapes', () => {
    for (const e of enemies) {
      expect(validShapes).toContain(e.shape);
    }
  });
});

describe('Enemies config — knockback immunity', () => {
  it('boss enemies are knockback immune', () => {
    const bossEnemies = enemies.filter((e) => e.id.startsWith('boss'));
    for (const b of bossEnemies) {
      expect(b.knockbackImmune).toBe(true);
    }
  });

  it('tank and guardian are knockback immune', () => {
    expect(ENEMY_DEFS.tank.knockbackImmune).toBe(true);
    expect(ENEMY_DEFS.guardian.knockbackImmune).toBe(true);
  });
});

describe('Enemies config — stage pool references', () => {
  const stages = BALANCE.STAGE.stages;

  it('all enemies in stage pools are defined in ENEMY_DEFS', () => {
    for (const stage of stages) {
      if (stage.enemyPool) {
        for (const enemyId of stage.enemyPool) {
          expect(ENEMY_DEFS[enemyId]).toBeDefined();
        }
      }
    }
  });

  it('all boss stage bossIds are defined in ENEMY_DEFS', () => {
    for (const stage of stages) {
      if (stage.bossId) {
        expect(ENEMY_DEFS[stage.bossId]).toBeDefined();
      }
    }
  });

  it('challenge mode bossRushPool entries are all valid enemy IDs', () => {
    for (const bossId of BALANCE.CHALLENGE.bossRushPool) {
      expect(ENEMY_DEFS[bossId]).toBeDefined();
    }
  });

  it('challenge mode t1EnemyIds are all valid enemy IDs', () => {
    for (const eid of BALANCE.CHALLENGE.t1EnemyIds) {
      expect(ENEMY_DEFS[eid]).toBeDefined();
    }
  });
});

describe('Enemies config — count', () => {
  it('has at least 10 enemy definitions', () => {
    expect(enemies.length).toBeGreaterThanOrEqual(10);
  });

  it('has exactly 3 boss variants', () => {
    const bosses = enemies.filter((e) => e.id.startsWith('boss'));
    expect(bosses).toHaveLength(3);
  });
});
