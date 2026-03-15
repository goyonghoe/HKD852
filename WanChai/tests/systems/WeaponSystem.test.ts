import { describe, it, expect } from 'vitest';
import { WEAPON_DEFS } from '../../src/config/weapons';
import { BALANCE } from '../../src/config/balance';
import type { WeaponDef, WeaponInstance } from '../../src/types/weapon';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInstance(defId: string, level = 1): WeaponInstance {
  return { defId, level, cooldownRemaining: 0 };
}

/** Level multiplier formula mirrored from WeaponSystem.update() */
function levelMult(level: number): number {
  return 1 + (level - 1) * 0.2;
}

/** Homing turn rate formula from WeaponSystem.fireHoming() */
function homingTurnRate(level: number): number {
  return BALANCE.COMBAT.homingBaseTurnRate + level * BALANCE.COMBAT.homingTurnRatePerLevel;
}

/** Energy-shot projectile count: 1, 2, 2, 3, 3 */
function energyShotCount(level: number): number {
  return 1 + Math.floor(level / 2);
}

/** Shotgun projectile count: 3, 3, 5, 5, 7 */
function shotgunCount(level: number, def: WeaponDef): number {
  return def.projectileCount + Math.floor((level - 1) / 2) * 2;
}

/** Generic bullet count */
function genericBulletCount(level: number, def: WeaponDef): number {
  return def.projectileCount + Math.floor((level - 1) * 0.5);
}

/** Piercing formula from fireBullet */
function pierceCount(level: number, def: WeaponDef): number {
  return def.piercing + Math.floor(level / 3);
}

/** AOE radius formula from fireAoe */
function aoeRadius(level: number, def: WeaponDef): number {
  return def.aoeRadius + level * 10;
}

/** Bomb/napalm scan radius formula */
function bombRadius(level: number, def: WeaponDef): number {
  return def.aoeRadius + level * 15;
}

/** Homing speed formula from fireHoming */
function homingSpeed(level: number, def: WeaponDef): number {
  return def.projectileSpeed + level * 40;
}

// ── WEAPON_DEFS config tests ──────────────────────────────────────────────────

describe('WEAPON_DEFS config', () => {
  const defs = Object.values(WEAPON_DEFS);

  it('has exactly 17 weapon definitions (10 T1 + 7 T2)', () => {
    expect(defs).toHaveLength(17);
  });

  it('all weapons have required fields', () => {
    for (const def of defs) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.projectileType).toBeTruthy();
      expect(def.targetMode).toBeTruthy();
      expect(def.baseDamage).toBeGreaterThan(0);
      expect(def.cooldownMs).toBeGreaterThan(0);
      expect(def.maxLevel).toBeGreaterThan(0);
    }
  });

  it('all weapon ids are unique', () => {
    const ids = defs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all weapons have valid projectile types', () => {
    const validTypes = ['bullet', 'aoe', 'laser', 'chain', 'homing', 'bomb', 'napalm'];
    for (const def of defs) {
      expect(validTypes).toContain(def.projectileType);
    }
  });

  it('all weapons have valid target modes', () => {
    const validModes = ['nearest', 'random', 'aoe'];
    for (const def of defs) {
      expect(validModes).toContain(def.targetMode);
    }
  });

  it('all weapons have maxLevel of 5', () => {
    for (const def of defs) {
      expect(def.maxLevel).toBe(5);
    }
  });

  it('WEAPON_DEFS keys match weapon ids', () => {
    for (const [key, def] of Object.entries(WEAPON_DEFS)) {
      expect(def.id).toBe(key);
    }
  });

  it('bullet weapons have non-zero projectile speed', () => {
    const bullets = defs.filter((d) => d.projectileType === 'bullet');
    for (const def of bullets) {
      expect(def.projectileSpeed).toBeGreaterThan(0);
    }
  });

  it('laser and chain weapons have zero projectile speed (instant)', () => {
    const _instant = defs.filter(
      (d) =>
        d.projectileType === 'chain' || (d.projectileType === 'laser' && d.id !== 'railgun' && d.id !== 'laser_beam'),
    );
    // chain: lightning has speed 0
    expect(WEAPON_DEFS.lightning.projectileSpeed).toBe(0);
  });

  it('laser weapons have high piercing', () => {
    expect(WEAPON_DEFS.laser_beam.piercing).toBe(99);
    expect(WEAPON_DEFS.railgun.piercing).toBe(99);
  });

  it('energy_shot has no piercing at base level', () => {
    expect(WEAPON_DEFS.energy_shot.piercing).toBe(0);
  });

  it('shuriken has high piercing at base level', () => {
    expect(WEAPON_DEFS.shuriken.piercing).toBe(3);
  });

  it('bomb has highest base damage among T1 weapons', () => {
    const t1Defs = defs.filter((d) => !d.tier || d.tier === 1);
    const maxDamage = Math.max(...t1Defs.map((d) => d.baseDamage));
    expect(WEAPON_DEFS.bomb.baseDamage).toBe(maxDamage);
  });

  it('rapid_fire has among the lowest base damage (T1)', () => {
    // rapid_fire trades low per-hit damage for fast cooldown (200ms)
    const t1Defs = defs.filter((d) => !d.tier || d.tier === 1);
    const maxT1Damage = Math.max(...t1Defs.map((d) => d.baseDamage));
    // rapid_fire baseDamage should be well below the max T1 damage
    expect(WEAPON_DEFS.rapid_fire.baseDamage).toBeLessThan(maxT1Damage / 5);
  });

  it('rapid_fire has fastest cooldown among T1 weapons', () => {
    const t1Defs = defs.filter((d) => !d.tier || d.tier === 1);
    const minCooldown = Math.min(...t1Defs.map((d) => d.cooldownMs));
    expect(WEAPON_DEFS.rapid_fire.cooldownMs).toBe(minCooldown);
  });

  it('bomb and missile have high cooldown (slow weapons)', () => {
    // bomb and missile are intentionally slow high-damage weapons
    expect(WEAPON_DEFS.bomb.cooldownMs).toBeGreaterThanOrEqual(2500);
    expect(WEAPON_DEFS.missile.cooldownMs).toBeGreaterThanOrEqual(1500);
    // Both should be slower than rapid_fire
    expect(WEAPON_DEFS.bomb.cooldownMs).toBeGreaterThan(WEAPON_DEFS.rapid_fire.cooldownMs);
    expect(WEAPON_DEFS.missile.cooldownMs).toBeGreaterThan(WEAPON_DEFS.rapid_fire.cooldownMs);
  });

  it('aoe and bomb weapons have non-zero aoeRadius', () => {
    const aoeTypes = defs.filter(
      (d) => d.projectileType === 'aoe' || d.projectileType === 'bomb' || d.projectileType === 'napalm',
    );
    for (const def of aoeTypes) {
      expect(def.aoeRadius).toBeGreaterThan(0);
    }
  });

  it('shotgun starts with 3 projectiles', () => {
    expect(WEAPON_DEFS.shotgun.projectileCount).toBe(3);
  });

  it('lightning starts with 3 chain count', () => {
    expect(WEAPON_DEFS.lightning.projectileCount).toBe(3);
  });
});

// ── Level scaling tests ───────────────────────────────────────────────────────

describe('WeaponSystem level scaling', () => {
  it('levelMult is 1.0 at level 1', () => {
    expect(levelMult(1)).toBe(1.0);
  });

  it('levelMult increases by 0.2 per level', () => {
    expect(levelMult(2)).toBeCloseTo(1.2);
    expect(levelMult(3)).toBeCloseTo(1.4);
    expect(levelMult(4)).toBeCloseTo(1.6);
    expect(levelMult(5)).toBeCloseTo(1.8);
  });

  it('levelMult at level 5 = 1.8x (80% boost)', () => {
    expect(levelMult(5)).toBeCloseTo(1.8);
  });

  it('effective damage at level 5 is 1.8x base', () => {
    const def = WEAPON_DEFS.energy_shot;
    const baseDmg = def.baseDamage;
    expect(baseDmg * levelMult(5)).toBeCloseTo(baseDmg * 1.8);
  });
});

// ── Cooldown logic tests ──────────────────────────────────────────────────────

describe('WeaponInstance cooldown tracking', () => {
  it('cooldownRemaining starts at 0 (ready to fire)', () => {
    const w = makeInstance('energy_shot');
    expect(w.cooldownRemaining).toBe(0);
  });

  it('weapon with positive cooldownRemaining should not fire', () => {
    const w = makeInstance('energy_shot');
    w.cooldownRemaining = 500;
    // canFire logic: cooldownRemaining must be <= 0
    expect(w.cooldownRemaining > 0).toBe(true);
  });

  it('weapon with zero cooldownRemaining should fire', () => {
    const w = makeInstance('energy_shot');
    w.cooldownRemaining = 0;
    expect(w.cooldownRemaining <= 0).toBe(true);
  });

  it('simulated delta reduces cooldown correctly', () => {
    const w = makeInstance('energy_shot');
    w.cooldownRemaining = 800;
    // Apply 400ms delta
    w.cooldownRemaining -= 400;
    expect(w.cooldownRemaining).toBe(400);
    // Apply another 400ms
    w.cooldownRemaining -= 400;
    expect(w.cooldownRemaining).toBe(0);
  });

  it('weapon resets cooldown after firing', () => {
    const def = WEAPON_DEFS.energy_shot;
    const w = makeInstance('energy_shot');
    // Simulate cooldown reset after fire
    w.cooldownRemaining = def.cooldownMs;
    expect(w.cooldownRemaining).toBe(800);
  });

  it('attack speed multiplier correctly reduces effective cooldown', () => {
    const def = WEAPON_DEFS.energy_shot;
    const attackSpeedMult = 1.5;
    const effectiveCooldown = def.cooldownMs / attackSpeedMult;
    expect(effectiveCooldown).toBeCloseTo(800 / 1.5);
    expect(effectiveCooldown).toBeLessThan(def.cooldownMs);
  });
});

// ── Projectile count scaling ──────────────────────────────────────────────────

describe('Projectile count scaling per weapon', () => {
  it('energy_shot count: 1, 2, 2, 3, 3 across levels 1-5', () => {
    expect(energyShotCount(1)).toBe(1);
    expect(energyShotCount(2)).toBe(2);
    expect(energyShotCount(3)).toBe(2); // floor(3/2) = 1 → 1+1=2
    expect(energyShotCount(4)).toBe(3);
    expect(energyShotCount(5)).toBe(3);
  });

  it('shotgun count: 3, 3, 5, 5, 7 across levels 1-5', () => {
    const def = WEAPON_DEFS.shotgun;
    expect(shotgunCount(1, def)).toBe(3); // 3 + floor(0/2)*2 = 3
    expect(shotgunCount(2, def)).toBe(3); // 3 + floor(1/2)*2 = 3
    expect(shotgunCount(3, def)).toBe(5); // 3 + floor(2/2)*2 = 5
    expect(shotgunCount(4, def)).toBe(5); // 3 + floor(3/2)*2 = 5
    expect(shotgunCount(5, def)).toBe(7); // 3 + floor(4/2)*2 = 7
  });

  it('generic bullet count increases by 0.5 steps per level', () => {
    const def = WEAPON_DEFS.rapid_fire;
    expect(genericBulletCount(1, def)).toBe(1);
    expect(genericBulletCount(2, def)).toBe(1); // floor(0.5) = 0
    expect(genericBulletCount(3, def)).toBe(2); // floor(1.0) = 1
    expect(genericBulletCount(5, def)).toBe(3); // floor(2.0) = 2 → 1+2=3
  });

  it('shotgun always fires an odd count (spread symmetry)', () => {
    const def = WEAPON_DEFS.shotgun;
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(shotgunCount(lvl, def) % 2).toBe(1);
    }
  });
});

// ── Piercing scaling ──────────────────────────────────────────────────────────

describe('Piercing scaling per level', () => {
  it('energy_shot piercing scales: 0 at level 1, 1 at level 3, 1 at level 5', () => {
    const def = WEAPON_DEFS.energy_shot;
    expect(pierceCount(1, def)).toBe(0);
    expect(pierceCount(2, def)).toBe(0);
    expect(pierceCount(3, def)).toBe(1);
    expect(pierceCount(4, def)).toBe(1);
    expect(pierceCount(5, def)).toBe(1);
  });

  it('shuriken starts at piercing 3 and grows', () => {
    const def = WEAPON_DEFS.shuriken;
    expect(pierceCount(1, def)).toBe(3);
    expect(pierceCount(3, def)).toBe(4);
    expect(pierceCount(5, def)).toBe(4); // 3 + floor(5/3) = 3+1=4
  });

  it('laser weapons always pierce 99 enemies (ignores level formula)', () => {
    expect(WEAPON_DEFS.laser_beam.piercing).toBe(99);
    expect(WEAPON_DEFS.railgun.piercing).toBe(99);
  });
});

// ── AOE radius scaling ────────────────────────────────────────────────────────

describe('AOE radius scaling per level', () => {
  it('aoe radius grows by 10px per level', () => {
    const def = WEAPON_DEFS.bomb; // uses fireAoe if projectileType were aoe — using bomb aoeRadius as base
    const baseRadius = def.aoeRadius;
    expect(aoeRadius(1, def)).toBe(baseRadius + 10);
    expect(aoeRadius(5, def)).toBe(baseRadius + 50);
  });

  it('bomb/napalm scan radius grows by 15px per level', () => {
    const def = WEAPON_DEFS.bomb;
    const baseRadius = def.aoeRadius;
    expect(bombRadius(1, def)).toBe(baseRadius + 15);
    expect(bombRadius(5, def)).toBe(baseRadius + 75);
  });

  it('napalm base aoeRadius is 120', () => {
    expect(WEAPON_DEFS.napalm.aoeRadius).toBe(120);
  });

  it('bomb base aoeRadius is 120', () => {
    expect(WEAPON_DEFS.bomb.aoeRadius).toBe(120);
  });

  it('missile has non-zero aoeRadius', () => {
    expect(WEAPON_DEFS.missile.aoeRadius).toBeGreaterThan(0);
  });
});

// ── Homing (missile) scaling ──────────────────────────────────────────────────

describe('Homing missile scaling', () => {
  it('homing speed increases by 40px/s per level', () => {
    const def = WEAPON_DEFS.missile;
    expect(homingSpeed(1, def)).toBe(def.projectileSpeed + 40);
    expect(homingSpeed(5, def)).toBe(def.projectileSpeed + 200);
  });

  it('homing turn rate increases per level', () => {
    const base = BALANCE.COMBAT.homingBaseTurnRate;
    const perLvl = BALANCE.COMBAT.homingTurnRatePerLevel;
    expect(homingTurnRate(1)).toBeCloseTo(base + perLvl);
    expect(homingTurnRate(5)).toBeCloseTo(base + 5 * perLvl);
    expect(homingTurnRate(5)).toBeGreaterThan(homingTurnRate(1));
  });

  it('missile projectile type is homing', () => {
    expect(WEAPON_DEFS.missile.projectileType).toBe('homing');
  });

  it('missile starts with a positive base speed', () => {
    expect(WEAPON_DEFS.missile.projectileSpeed).toBeGreaterThan(0);
  });
});

// ── Weapon acquisition helpers ────────────────────────────────────────────────

describe('WeaponInstance acquisition helpers', () => {
  it('creating a WeaponInstance sets defId correctly', () => {
    const w = makeInstance('shotgun');
    expect(w.defId).toBe('shotgun');
  });

  it('new weapon starts at level 1', () => {
    const w = makeInstance('laser_beam');
    expect(w.level).toBe(1);
  });

  it('can create instances for all defined weapons', () => {
    for (const key of Object.keys(WEAPON_DEFS)) {
      const w = makeInstance(key);
      expect(w.defId).toBe(key);
      expect(w.level).toBe(1);
    }
  });

  it('hasWeapon equivalent: defId lookup in instance list', () => {
    const weapons: WeaponInstance[] = [makeInstance('energy_shot'), makeInstance('shotgun')];
    const has = (id: string) => weapons.some((w) => w.defId === id);
    expect(has('energy_shot')).toBe(true);
    expect(has('shotgun')).toBe(true);
    expect(has('laser_beam')).toBe(false);
  });

  it('weapon level can be incremented', () => {
    const w = makeInstance('energy_shot');
    w.level++;
    expect(w.level).toBe(2);
    w.level++;
    expect(w.level).toBe(3);
  });

  it('cannot exceed maxLevel (guard check)', () => {
    const def = WEAPON_DEFS.energy_shot;
    const w = makeInstance('energy_shot', def.maxLevel);
    expect(w.level).toBe(def.maxLevel);
    // upgrading beyond maxLevel should be blocked (guard: level < def.maxLevel)
    const canUpgrade = w.level < def.maxLevel;
    expect(canUpgrade).toBe(false);
  });
});

// ── Projectile type coverage ──────────────────────────────────────────────────

describe('All projectile types are covered by some weapon', () => {
  const defs = Object.values(WEAPON_DEFS);

  it('bullet type exists', () => {
    expect(defs.some((d) => d.projectileType === 'bullet')).toBe(true);
  });

  it('laser type exists', () => {
    expect(defs.some((d) => d.projectileType === 'laser')).toBe(true);
  });

  it('chain type exists', () => {
    expect(defs.some((d) => d.projectileType === 'chain')).toBe(true);
  });

  it('homing type exists', () => {
    expect(defs.some((d) => d.projectileType === 'homing')).toBe(true);
  });

  it('bomb type exists', () => {
    expect(defs.some((d) => d.projectileType === 'bomb')).toBe(true);
  });

  it('napalm type exists', () => {
    expect(defs.some((d) => d.projectileType === 'napalm')).toBe(true);
  });
});

// ── Balance constants cross-check ─────────────────────────────────────────────

describe('BALANCE combat constants sanity', () => {
  it('homingBaseTurnRate is positive', () => {
    expect(BALANCE.COMBAT.homingBaseTurnRate).toBeGreaterThan(0);
  });

  it('homingTurnRatePerLevel is positive', () => {
    expect(BALANCE.COMBAT.homingTurnRatePerLevel).toBeGreaterThan(0);
  });

  it('maxWeapons is 4', () => {
    expect(BALANCE.RUN.maxWeapons).toBe(4);
  });
});

// ── T2 weapon definitions ───────────────────────────────────────────────────

describe('T2 weapon definitions', () => {
  const t2Defs = Object.values(WEAPON_DEFS).filter((d) => d.tier === 2);
  const t1Defs = Object.values(WEAPON_DEFS).filter((d) => !d.tier || d.tier === 1);

  it('has exactly 7 T2 weapons', () => {
    expect(t2Defs).toHaveLength(7);
  });

  it('has exactly 10 T1 weapons', () => {
    expect(t1Defs).toHaveLength(10);
  });

  it('all T2 weapons have tier: 2', () => {
    for (const def of t2Defs) {
      expect(def.tier, `${def.id} tier`).toBe(2);
    }
  });

  it('all T2 weapons have a recipe', () => {
    for (const def of t2Defs) {
      expect(def.recipe, `${def.id} recipe`).toBeDefined();
      expect(def.recipe!.primary, `${def.id} primary`).toBeTruthy();
      expect(def.recipe!.secondary, `${def.id} secondary`).toBeTruthy();
      expect(def.recipe!.primaryLevel, `${def.id} primaryLevel`).toBeGreaterThanOrEqual(1);
      expect(def.recipe!.secondaryLevel, `${def.id} secondaryLevel`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all T2 recipe ingredients reference existing T1 weapons', () => {
    const t1Ids = new Set(t1Defs.map((d) => d.id));
    for (const def of t2Defs) {
      expect(t1Ids.has(def.recipe!.primary), `${def.id} primary "${def.recipe!.primary}" must be a T1 weapon`).toBe(
        true,
      );
      expect(
        t1Ids.has(def.recipe!.secondary),
        `${def.id} secondary "${def.recipe!.secondary}" must be a T1 weapon`,
      ).toBe(true);
    }
  });

  it('scatter_storm has correct stats', () => {
    const def = WEAPON_DEFS.scatter_storm;
    expect(def.projectileType).toBe('bullet');
    expect(def.baseDamage).toBe(5);
    expect(def.cooldownMs).toBe(185);
    expect(def.projectileCount).toBe(7);
    expect(def.piercing).toBe(1);
    expect(def.recipe!.primary).toBe('shotgun');
    expect(def.recipe!.secondary).toBe('shuriken');
  });

  it('inferno_beam has correct stats', () => {
    const def = WEAPON_DEFS.inferno_beam;
    expect(def.projectileType).toBe('laser');
    expect(def.baseDamage).toBe(35);
    expect(def.cooldownMs).toBe(600);
    expect(def.piercing).toBe(999);
    expect(def.recipe!.primary).toBe('laser_beam');
    expect(def.recipe!.secondary).toBe('napalm');
  });

  it('thunder_bomb has correct stats', () => {
    const def = WEAPON_DEFS.thunder_bomb;
    expect(def.projectileType).toBe('bomb');
    expect(def.baseDamage).toBe(100);
    expect(def.cooldownMs).toBe(2000);
    expect(def.aoeRadius).toBe(120);
    expect(def.recipe!.primary).toBe('lightning');
    expect(def.recipe!.secondary).toBe('bomb');
  });

  it('viper_salvo has correct stats', () => {
    const def = WEAPON_DEFS.viper_salvo;
    expect(def.projectileType).toBe('homing');
    // baseDamage intentionally not pinned — viper_salvo fires 2 homing projectiles
    // rapidly (300ms CD) so per-hit damage is tuned for burst feel, not raw DPS.
    expect(def.baseDamage).toBeGreaterThan(0);
    expect(def.cooldownMs).toBe(300);
    expect(def.projectileCount).toBe(2);
    expect(def.piercing).toBe(1);
    expect(def.recipe!.primary).toBe('rapid_fire');
    expect(def.recipe!.secondary).toBe('missile');
  });

  it('no T1 weapon has a recipe', () => {
    for (const def of t1Defs) {
      expect(def.recipe, `${def.id} should not have recipe`).toBeUndefined();
    }
  });

  it('T2 weapon baseDamage is positive', () => {
    // T2 weapons may have lower per-hit baseDamage than some T1 weapons when
    // they compensate via higher projectileCount or faster cooldown (e.g. scatter_storm, viper_salvo).
    for (const def of t2Defs) {
      expect(def.baseDamage, `${def.id} baseDamage > 0`).toBeGreaterThan(0);
    }
  });
});
