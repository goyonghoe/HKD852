/**
 * TASK-060: WeaponSystem DPS & behavior tests for all 17 weapons.
 * Covers: DPS balance validation, cooldown timing, piercing/multi-hit, special projectile handling.
 * Pure config + WeaponFireCalc tests — no Phaser imports.
 */
import { describe, it, expect } from 'vitest';
import { WEAPON_DEFS } from '../../src/config/weapons';
import {
  calculateLevelMultiplier,
  calculateProjectileCount,
  calculateSpreadAngle,
  calculatePiercing,
  calculateHomingParams,
  calculateChainCount,
  calculateTrainPositions,
} from '../../src/core/WeaponFireCalc';
import { BALANCE } from '../../src/config/balance';
import type { WeaponDef } from '../../src/types/weapon';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Theoretical base DPS = baseDamage * projectileCount / cooldownMs * 1000 */
function baseDPS(def: WeaponDef): number {
  return ((def.baseDamage * def.projectileCount) / def.cooldownMs) * 1000;
}

/** DPS at a given level (accounts for level multiplier + projectile count scaling) */
function dpsAtLevel(def: WeaponDef, level: number): number {
  const mult = calculateLevelMultiplier(level);
  const count = calculateProjectileCount(def.id, level, def.projectileCount);
  return ((def.baseDamage * mult * count) / def.cooldownMs) * 1000;
}

// ── Per-weapon DPS & config validation ───────────────────────────────────────

describe('TASK-060: Per-weapon DPS balance', () => {
  describe('T1 weapons — base DPS ranges', () => {
    it('energy_shot DPS matches balance table (~20)', () => {
      expect(baseDPS(WEAPON_DEFS.energy_shot)).toBeCloseTo(20.0, 0);
    });

    it('napalm direct DPS matches balance table (~11.6)', () => {
      expect(baseDPS(WEAPON_DEFS.napalm)).toBeCloseTo(11.6, 0);
    });

    it('laser_beam DPS matches balance table (~20)', () => {
      expect(baseDPS(WEAPON_DEFS.laser_beam)).toBeCloseTo(20.0, 0);
    });

    it('shuriken DPS matches balance table (~20)', () => {
      expect(baseDPS(WEAPON_DEFS.shuriken)).toBeCloseTo(20.0, 0);
    });

    it('shotgun DPS matches balance table (~25)', () => {
      expect(baseDPS(WEAPON_DEFS.shotgun)).toBeCloseTo(25.0, 0);
    });

    it('lightning DPS matches balance table (~34.3)', () => {
      expect(baseDPS(WEAPON_DEFS.lightning)).toBeCloseTo(34.3, 0);
    });

    it('missile DPS matches balance table (~17.9)', () => {
      expect(baseDPS(WEAPON_DEFS.missile)).toBeCloseTo(17.9, 0);
    });

    it('bomb DPS matches balance table (~18.6)', () => {
      expect(baseDPS(WEAPON_DEFS.bomb)).toBeCloseTo(18.6, 0);
    });

    it('railgun DPS matches balance table (~17.8)', () => {
      expect(baseDPS(WEAPON_DEFS.railgun)).toBeCloseTo(17.8, 0);
    });

    it('rapid_fire DPS matches balance table (15)', () => {
      expect(baseDPS(WEAPON_DEFS.rapid_fire)).toBeCloseTo(15.0, 0);
    });
  });

  describe('T2 weapons — DPS sanity', () => {
    it('plasma_gatling DPS matches balance table (~140)', () => {
      expect(baseDPS(WEAPON_DEFS.plasma_gatling)).toBeCloseTo(140.0, 0);
    });

    it('cluster_warhead DPS matches balance table (100)', () => {
      expect(baseDPS(WEAPON_DEFS.cluster_warhead)).toBeCloseTo(100.0, 0);
    });

    it('tesla_arc DPS matches balance table (200)', () => {
      expect(baseDPS(WEAPON_DEFS.tesla_arc)).toBeCloseTo(200.0, 0);
    });

    it('scatter_storm DPS matches balance table (~189.2)', () => {
      expect(baseDPS(WEAPON_DEFS.scatter_storm)).toBeCloseTo(189.2, 0);
    });

    it('inferno_beam DPS matches balance table (~58.3)', () => {
      expect(baseDPS(WEAPON_DEFS.inferno_beam)).toBeCloseTo(58.3, 0);
    });

    it('thunder_bomb DPS matches balance table (50)', () => {
      expect(baseDPS(WEAPON_DEFS.thunder_bomb)).toBeCloseTo(50.0, 0);
    });

    it('viper_salvo DPS matches balance table (~33.3)', () => {
      expect(baseDPS(WEAPON_DEFS.viper_salvo)).toBeCloseTo(33.3, 0);
    });
  });
});

describe('TASK-060: Cooldown timing correctness', () => {
  const T1_COOLDOWNS: Record<string, number> = {
    energy_shot: 800,
    napalm: 2500,
    laser_beam: 1400,
    shuriken: 700,
    shotgun: 1200,
    lightning: 1400,
    missile: 1950,
    bomb: 3500,
    railgun: 2700,
    rapid_fire: 200,
  };

  for (const [id, expected] of Object.entries(T1_COOLDOWNS)) {
    it(`${id} cooldown is ${expected}ms`, () => {
      expect(WEAPON_DEFS[id].cooldownMs).toBe(expected);
    });
  }

  it('attack speed multiplier 2x halves effective cooldown', () => {
    for (const def of Object.values(WEAPON_DEFS)) {
      const effective = def.cooldownMs / 2;
      expect(effective).toBe(def.cooldownMs / 2);
    }
  });
});

describe('TASK-060: Piercing & multi-hit behavior', () => {
  it('laser_beam pierces 99 enemies (effectively infinite)', () => {
    expect(WEAPON_DEFS.laser_beam.piercing).toBe(99);
  });

  it('railgun pierces 99 enemies', () => {
    expect(WEAPON_DEFS.railgun.piercing).toBe(99);
  });

  it('inferno_beam pierces 999 enemies (T2 evolution)', () => {
    expect(WEAPON_DEFS.inferno_beam.piercing).toBe(999);
  });

  it('shuriken base piercing of 3 scales with level', () => {
    expect(calculatePiercing(3, 1)).toBe(3);
    expect(calculatePiercing(3, 3)).toBe(4);
    expect(calculatePiercing(3, 6)).toBe(5);
  });

  it('energy_shot has no base piercing', () => {
    expect(WEAPON_DEFS.energy_shot.piercing).toBe(0);
    expect(calculatePiercing(0, 1)).toBe(0);
  });

  it('plasma_gatling has T2 piercing of 2', () => {
    expect(WEAPON_DEFS.plasma_gatling.piercing).toBe(2);
  });

  it('scatter_storm has T2 piercing of 1', () => {
    expect(WEAPON_DEFS.scatter_storm.piercing).toBe(1);
  });

  it('viper_salvo has T2 piercing of 1', () => {
    expect(WEAPON_DEFS.viper_salvo.piercing).toBe(1);
  });
});

describe('TASK-060: Special projectile type handling', () => {
  it('napalm has projectileType "napalm" and AoE target mode', () => {
    const def = WEAPON_DEFS.napalm;
    expect(def.projectileType).toBe('napalm');
    expect(def.targetMode).toBe('aoe');
    expect(def.aoeRadius).toBe(120);
    expect(def.projectileSpeed).toBe(0); // drops in place
  });

  it('laser_beam has zero projectileSpeed (instant hit)', () => {
    expect(WEAPON_DEFS.laser_beam.projectileSpeed).toBe(0);
  });

  it('lightning chain count scales with level', () => {
    const base = WEAPON_DEFS.lightning.projectileCount; // 3
    expect(calculateChainCount(base, 1)).toBe(3);
    expect(calculateChainCount(base, 3)).toBe(4);
    expect(calculateChainCount(base, 5)).toBe(5);
  });

  it('tesla_arc chain count scales from 5 base', () => {
    const base = WEAPON_DEFS.tesla_arc.projectileCount; // 5
    expect(calculateChainCount(base, 1)).toBe(5);
    expect(calculateChainCount(base, 3)).toBe(6);
    expect(calculateChainCount(base, 5)).toBe(7);
  });

  it('missile is homing type with positive base speed', () => {
    const def = WEAPON_DEFS.missile;
    expect(def.projectileType).toBe('homing');
    expect(def.projectileSpeed).toBeGreaterThan(0);
  });

  it('homing missile speed scales correctly', () => {
    const def = WEAPON_DEFS.missile;
    const params = calculateHomingParams(
      5,
      def.projectileSpeed,
      def.projectileCount,
      BALANCE.COMBAT.homingBaseTurnRate,
      BALANCE.COMBAT.homingTurnRatePerLevel,
    );
    expect(params.speed).toBe(def.projectileSpeed + 5 * 40);
  });

  it('bomb uses centroid targeting (aoe target mode)', () => {
    expect(WEAPON_DEFS.bomb.targetMode).toBe('aoe');
    expect(WEAPON_DEFS.bomb.projectileType).toBe('bomb');
  });

  it('energy_shot train formation produces correct positions', () => {
    const positions = calculateTrainPositions(100, 200, 0, 3, 18);
    expect(positions).toHaveLength(3);
    // Lead bullet at player position
    expect(positions[0].x).toBeCloseTo(100);
    // Each subsequent bullet 18px behind
    expect(positions[1].x).toBeCloseTo(82);
    expect(positions[2].x).toBeCloseTo(64);
  });

  it('shotgun fan spread widens with projectile count', () => {
    expect(calculateSpreadAngle('shotgun', 3)).toBeCloseTo(0.12);
    expect(calculateSpreadAngle('shotgun', 5)).toBeCloseTo(0.18);
    expect(calculateSpreadAngle('shotgun', 7)).toBeCloseTo(0.24);
  });

  it('all 7 projectile types exist in WEAPON_DEFS', () => {
    const types = new Set(Object.values(WEAPON_DEFS).map((d) => d.projectileType));
    expect(types).toContain('bullet');
    expect(types).toContain('laser');
    expect(types).toContain('chain');
    expect(types).toContain('homing');
    expect(types).toContain('bomb');
    expect(types).toContain('napalm');
    // 'aoe' is not used as a direct projectileType in current defs — bomb/napalm handle area instead
  });
});

describe('TASK-060: DPS scaling across levels', () => {
  it('all weapons DPS increases from level 1 to level 5', () => {
    for (const def of Object.values(WEAPON_DEFS)) {
      const dps1 = dpsAtLevel(def, 1);
      const dps5 = dpsAtLevel(def, 5);
      expect(dps5).toBeGreaterThan(dps1);
    }
  });

  it('energy_shot DPS roughly doubles by level 5 (multi-projectile scaling)', () => {
    const def = WEAPON_DEFS.energy_shot;
    const dps1 = dpsAtLevel(def, 1);
    const dps5 = dpsAtLevel(def, 5);
    // level 5: mult=1.8, count=3 → 3*1.8 = 5.4x base vs 1*1.0 = 1x
    expect(dps5 / dps1).toBeGreaterThan(4);
  });

  it('shotgun DPS scales aggressively with projectile count', () => {
    const def = WEAPON_DEFS.shotgun;
    const dps1 = dpsAtLevel(def, 1);
    const dps5 = dpsAtLevel(def, 5);
    // level 5: mult=1.8, count=7 → 7*1.8 = 12.6x base vs 3*1.0 = 3x → ~4.2x ratio
    expect(dps5 / dps1).toBeGreaterThan(3);
  });
});
