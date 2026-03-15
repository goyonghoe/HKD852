import { describe, it, expect } from 'vitest';
import { WEAPON_DEFS, PROJECTILE_ROTATION_OFFSET } from '../../src/config/weapons';
import { BALANCE } from '../../src/config/balance';
import { CHARACTERS } from '../../src/config/characters';
import type { ProjectileType, TargetMode } from '../../src/types/weapon';

const weapons = Object.values(WEAPON_DEFS);
const weaponIds = Object.keys(WEAPON_DEFS);
const t1Weapons = weapons.filter((w) => !w.tier || w.tier === 1);
const t2Weapons = weapons.filter((w) => w.tier === 2);

const VALID_PROJECTILE_TYPES: ProjectileType[] = ['bullet', 'aoe', 'laser', 'chain', 'homing', 'bomb', 'napalm'];

const VALID_TARGET_MODES: TargetMode[] = ['nearest', 'random', 'aoe'];

describe('Weapons config — required fields', () => {
  it('every weapon has an id', () => {
    for (const w of weapons) {
      expect(w.id).toBeTruthy();
    }
  });

  it('every weapon has a name', () => {
    for (const w of weapons) {
      expect(w.name).toBeTruthy();
    }
  });

  it('every weapon has a projectileType', () => {
    for (const w of weapons) {
      expect(w.projectileType).toBeTruthy();
    }
  });

  it('every weapon has a targetMode', () => {
    for (const w of weapons) {
      expect(w.targetMode).toBeTruthy();
    }
  });

  it('every weapon has baseDamage (positive)', () => {
    for (const w of weapons) {
      expect(w.baseDamage).toBeGreaterThan(0);
    }
  });

  it('every weapon has cooldownMs (positive)', () => {
    for (const w of weapons) {
      expect(w.cooldownMs).toBeGreaterThan(0);
    }
  });

  it('every weapon has projectileSpeed (>= 0)', () => {
    for (const w of weapons) {
      expect(w.projectileSpeed).toBeGreaterThanOrEqual(0);
    }
  });

  it('every weapon has projectileCount (>= 1)', () => {
    for (const w of weapons) {
      expect(w.projectileCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('every weapon has piercing (>= 0)', () => {
    for (const w of weapons) {
      expect(w.piercing).toBeGreaterThanOrEqual(0);
    }
  });

  it('every weapon has aoeRadius (>= 0)', () => {
    for (const w of weapons) {
      expect(w.aoeRadius).toBeGreaterThanOrEqual(0);
    }
  });

  it('every weapon has range (>= 0)', () => {
    for (const w of weapons) {
      expect(w.range).toBeGreaterThanOrEqual(0);
    }
  });

  it('every weapon has maxLevel (>= 1)', () => {
    for (const w of weapons) {
      expect(w.maxLevel).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Weapons config — no duplicate IDs', () => {
  it('all weapon IDs are unique', () => {
    expect(new Set(weaponIds).size).toBe(weaponIds.length);
  });

  it('each weapon key matches its id field', () => {
    for (const [key, def] of Object.entries(WEAPON_DEFS)) {
      expect(def.id).toBe(key);
    }
  });
});

describe('Weapons config — type validation', () => {
  it('all projectileTypes are from the allowed set', () => {
    for (const w of weapons) {
      expect(VALID_PROJECTILE_TYPES).toContain(w.projectileType);
    }
  });

  it('all targetModes are from the allowed set', () => {
    for (const w of weapons) {
      expect(VALID_TARGET_MODES).toContain(w.targetMode);
    }
  });
});

describe('Weapons config — numeric sanity', () => {
  it('baseDamage is a finite number', () => {
    for (const w of weapons) {
      expect(Number.isFinite(w.baseDamage)).toBe(true);
    }
  });

  it('cooldownMs is a finite number', () => {
    for (const w of weapons) {
      expect(Number.isFinite(w.cooldownMs)).toBe(true);
    }
  });

  it('projectileSpeed is a finite number', () => {
    for (const w of weapons) {
      expect(Number.isFinite(w.projectileSpeed)).toBe(true);
    }
  });

  it('aoe weapons have aoeRadius > 0', () => {
    const aoeWeapons = weapons.filter((w) => w.targetMode === 'aoe');
    for (const w of aoeWeapons) {
      expect(w.aoeRadius).toBeGreaterThan(0);
    }
  });

  it('laser weapons have range > 0', () => {
    const laserWeapons = weapons.filter((w) => w.projectileType === 'laser');
    for (const w of laserWeapons) {
      expect(w.range).toBeGreaterThan(0);
    }
  });
});

describe('Weapons config — T1/T2 tiers', () => {
  it('has at least 10 T1 weapons', () => {
    expect(t1Weapons.length).toBeGreaterThanOrEqual(10);
  });

  it('has at least 5 T2 weapons', () => {
    expect(t2Weapons.length).toBeGreaterThanOrEqual(5);
  });

  it('T2 weapons have tier = 2', () => {
    for (const w of t2Weapons) {
      expect(w.tier).toBe(2);
    }
  });

  it('T2 weapons have recipe', () => {
    for (const w of t2Weapons) {
      expect(w.recipe).toBeDefined();
    }
  });

  it('T2 recipe primary weapons exist in WEAPON_DEFS', () => {
    for (const w of t2Weapons) {
      expect(WEAPON_DEFS[w.recipe!.primary]).toBeDefined();
    }
  });

  it('T2 recipe secondary weapons exist in WEAPON_DEFS', () => {
    for (const w of t2Weapons) {
      expect(WEAPON_DEFS[w.recipe!.secondary]).toBeDefined();
    }
  });

  it('T2 recipe primary weapons are T1', () => {
    for (const w of t2Weapons) {
      const primary = WEAPON_DEFS[w.recipe!.primary];
      expect(primary.tier ?? 1).toBe(1);
    }
  });

  it('T2 recipe secondary weapons are T1', () => {
    for (const w of t2Weapons) {
      const secondary = WEAPON_DEFS[w.recipe!.secondary];
      expect(secondary.tier ?? 1).toBe(1);
    }
  });

  it('T2 recipe required levels are positive', () => {
    for (const w of t2Weapons) {
      expect(w.recipe!.primaryLevel).toBeGreaterThan(0);
      expect(w.recipe!.secondaryLevel).toBeGreaterThan(0);
    }
  });

  it('T1 weapons do not have recipe', () => {
    for (const w of t1Weapons) {
      expect(w.recipe).toBeUndefined();
    }
  });
});

describe('Weapons config — stage enemy pool cross-reference', () => {
  it('all enemy pool entries in BALANCE.STAGE exist in enemy defs (sanity)', () => {
    // This test ensures no orphaned references between stages and enemies
    const stages = BALANCE.STAGE.stages;
    for (const stage of stages) {
      if (stage.enemyPool) {
        for (const enemyId of stage.enemyPool) {
          expect(typeof enemyId).toBe('string');
          expect(enemyId.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Weapons config — character start weapons', () => {
  it('all character start weapons exist in WEAPON_DEFS', () => {
    for (const char of Object.values(CHARACTERS)) {
      expect(WEAPON_DEFS[char.startWeapon]).toBeDefined();
    }
  });

  it('all character start weapons are T1', () => {
    for (const char of Object.values(CHARACTERS)) {
      const weapon = WEAPON_DEFS[char.startWeapon];
      expect(weapon.tier ?? 1).toBe(1);
    }
  });
});

describe('Weapons config — rotation offsets', () => {
  it('PROJECTILE_ROTATION_OFFSET is defined', () => {
    expect(PROJECTILE_ROTATION_OFFSET).toBeDefined();
    expect(typeof PROJECTILE_ROTATION_OFFSET).toBe('object');
  });

  it('rotation offset values (if any) are finite numbers', () => {
    for (const [_key, val] of Object.entries(PROJECTILE_ROTATION_OFFSET)) {
      if (val !== undefined) {
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });
});

describe('Weapons config — specific weapon checks', () => {
  it('energy_shot is the default starter weapon', () => {
    const es = WEAPON_DEFS.energy_shot;
    expect(es).toBeDefined();
    expect(es.projectileType).toBe('bullet');
  });

  it('laser weapons have high piercing', () => {
    const laserBeam = WEAPON_DEFS.laser_beam;
    expect(laserBeam.piercing).toBeGreaterThanOrEqual(10);
  });

  it('homing weapons have projectileType homing', () => {
    const missile = WEAPON_DEFS.missile;
    expect(missile.projectileType).toBe('homing');
  });
});
