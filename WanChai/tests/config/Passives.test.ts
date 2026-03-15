import { describe, it, expect } from 'vitest';
import { PASSIVE_DEFS } from '../../src/config/upgrades';
import { BALANCE } from '../../src/config/balance';

// All character-specific passive IDs
const CHARACTER_PASSIVES = [
  'burn',
  'frost_shot',
  'gust',
  'torrent',
  'refraction',
  'lightspeed',
  'thorns',
  'fortify',
  'dash_trail',
  'ignite',
] as const;

// All generic passive IDs
const GENERIC_PASSIVES = ['attack_speed', 'damage', 'base_armor', 'hp_regen', 'crit_chance', 'crit_damage'] as const;

describe('Passive definitions', () => {
  it('all passive IDs exist in PASSIVE_DEFS', () => {
    for (const id of [...CHARACTER_PASSIVES, ...GENERIC_PASSIVES]) {
      expect(PASSIVE_DEFS[id], `missing passive def: ${id}`).toBeDefined();
    }
  });

  it('all passives have required fields', () => {
    for (const [id, def] of Object.entries(PASSIVE_DEFS)) {
      expect(def.id, `${id}.id`).toBe(id);
      expect(def.name, `${id}.name`).toBeTruthy();
      expect(def.description, `${id}.description`).toBeTruthy();
      expect(def.maxLevel, `${id}.maxLevel`).toBeGreaterThan(0);
      expect(def.effect, `${id}.effect`).toBeTruthy();
      expect(def.valuePerLevel, `${id}.valuePerLevel`).toBeGreaterThan(0);
    }
  });

  it('character passives have characterId set', () => {
    for (const id of CHARACTER_PASSIVES) {
      const def = PASSIVE_DEFS[id];
      expect(def.characterId, `${id} should have characterId`).toBeTruthy();
    }
  });

  it('generic passives have no characterId', () => {
    for (const id of GENERIC_PASSIVES) {
      const def = PASSIVE_DEFS[id];
      expect(def.characterId, `${id} should not have characterId`).toBeUndefined();
    }
  });

  it('maxLevel is between 1 and 5 for all passives', () => {
    for (const [id, def] of Object.entries(PASSIVE_DEFS)) {
      expect(def.maxLevel, `${id}.maxLevel`).toBeGreaterThanOrEqual(1);
      expect(def.maxLevel, `${id}.maxLevel`).toBeLessThanOrEqual(5);
    }
  });
});

describe('BALANCE.PASSIVE constants', () => {
  const P = BALANCE.PASSIVE;

  it('PASSIVE section exists in BALANCE', () => {
    expect(P).toBeDefined();
  });

  // burn
  it('burn: chance per level is 0 < x <= 1', () => {
    expect(P.burnChancePerLevel).toBeGreaterThan(0);
    expect(P.burnChancePerLevel).toBeLessThanOrEqual(1);
  });

  it('burn: damage percent is 0 < x <= 1', () => {
    expect(P.burnDamagePct).toBeGreaterThan(0);
    expect(P.burnDamagePct).toBeLessThanOrEqual(1);
  });

  it('burn: duration and tick interval are positive', () => {
    expect(P.burnDurationMs).toBeGreaterThan(0);
    expect(P.burnTickIntervalMs).toBeGreaterThan(0);
    expect(P.burnDurationMs).toBeGreaterThan(P.burnTickIntervalMs);
  });

  it('burn: DOT damage calculation is correct', () => {
    const hitDamage = 100;
    const burnDmgPerTick = Math.ceil(hitDamage * P.burnDamagePct);
    const totalTicks = Math.floor(P.burnDurationMs / P.burnTickIntervalMs);
    expect(burnDmgPerTick).toBe(30); // 100 * 0.30 = 30
    expect(totalTicks).toBe(6); // 3000 / 500 = 6
    expect(burnDmgPerTick * totalTicks).toBe(180); // total burn damage
  });

  // frost_shot
  it('frost_shot: chance per level is 0 < x <= 1', () => {
    expect(P.frostChancePerLevel).toBeGreaterThan(0);
    expect(P.frostChancePerLevel).toBeLessThanOrEqual(1);
  });

  it('frost_shot: slow multiplier is 0 < x < 1 (reduction)', () => {
    expect(P.frostSlowMult).toBeGreaterThan(0);
    expect(P.frostSlowMult).toBeLessThan(1);
  });

  it('frost_shot: slow is exactly 30% reduction', () => {
    expect(P.frostSlowMult).toBe(0.7);
  });

  it('frost_shot: duration is positive', () => {
    expect(P.frostDurationMs).toBeGreaterThan(0);
  });

  // gust
  it('gust: knockback bonus is positive', () => {
    expect(P.gustKnockbackBonusPct).toBeGreaterThan(0);
  });

  // torrent
  it('torrent: combo threshold is at least 2', () => {
    expect(P.torrentComboThreshold).toBeGreaterThanOrEqual(2);
  });

  it('torrent: attack speed bonus is 0 < x <= 1', () => {
    expect(P.torrentAtkSpdBonus).toBeGreaterThan(0);
    expect(P.torrentAtkSpdBonus).toBeLessThanOrEqual(1);
  });

  it('torrent: buff duration is positive', () => {
    expect(P.torrentDurationMs).toBeGreaterThan(0);
  });

  // refraction
  it('refraction: chance per level is 0 < x <= 1', () => {
    expect(P.refractionChancePerLevel).toBeGreaterThan(0);
    expect(P.refractionChancePerLevel).toBeLessThanOrEqual(1);
  });

  it('refraction: damage multiplier is 0 < x <= 1', () => {
    expect(P.refractionDamageMult).toBeGreaterThan(0);
    expect(P.refractionDamageMult).toBeLessThanOrEqual(1);
  });

  it('refraction: range is positive', () => {
    expect(P.refractionRange).toBeGreaterThan(0);
  });

  // lightspeed
  it('lightspeed: atk speed bonus is 0 < x <= 1', () => {
    expect(P.lightspeedAtkSpdBonus).toBeGreaterThan(0);
    expect(P.lightspeedAtkSpdBonus).toBeLessThanOrEqual(1);
  });

  it('lightspeed: duration is positive', () => {
    expect(P.lightspeedDurationMs).toBeGreaterThan(0);
  });

  // thorns
  it('thorns: damage per level is positive', () => {
    expect(P.thornsDamagePerLevel).toBeGreaterThan(0);
  });

  it('thorns: damage reflection amount is correct', () => {
    const level1Dmg = P.thornsDamagePerLevel * 1;
    const level3Dmg = P.thornsDamagePerLevel * 3;
    expect(level1Dmg).toBe(15);
    expect(level3Dmg).toBe(45);
  });

  // fortify
  it('fortify: no-hit timer is positive', () => {
    expect(P.fortifyNoHitMs).toBeGreaterThan(0);
  });

  it('fortify: armor bonus is 0 < x <= 1', () => {
    expect(P.fortifyArmorBonusPct).toBeGreaterThan(0);
    expect(P.fortifyArmorBonusPct).toBeLessThanOrEqual(1);
  });

  // dash_trail
  it('dash_trail: damage per level is positive', () => {
    expect(P.dashTrailDamagePerLevel).toBeGreaterThan(0);
  });

  it('dash_trail: tick interval is positive', () => {
    expect(P.dashTrailTickIntervalMs).toBeGreaterThan(0);
  });

  it('dash_trail: radius is positive', () => {
    expect(P.dashTrailRadius).toBeGreaterThan(0);
  });

  // ignite
  it('ignite: HP threshold is 0 < x <= 1', () => {
    expect(P.igniteHpThreshold).toBeGreaterThan(0);
    expect(P.igniteHpThreshold).toBeLessThanOrEqual(1);
  });

  it('ignite: threshold is exactly 20%', () => {
    expect(P.igniteHpThreshold).toBe(0.2);
  });

  it('ignite: bonus damage is 0 < x <= 1', () => {
    expect(P.igniteBonusDmgPct).toBeGreaterThan(0);
    expect(P.igniteBonusDmgPct).toBeLessThanOrEqual(1);
  });

  it('ignite: damage multiplier calculation', () => {
    const baseDmg = 100;
    const level1Bonus = Math.ceil(baseDmg * P.igniteBonusDmgPct * 1);
    const level3Bonus = Math.ceil(baseDmg * P.igniteBonusDmgPct * 3);
    expect(level1Bonus).toBe(25); // 100 * 0.25 * 1
    expect(level3Bonus).toBe(75); // 100 * 0.25 * 3
  });
});

describe('BALANCE.JUICE constants', () => {
  it('JUICE section exists', () => {
    expect(BALANCE.JUICE).toBeDefined();
  });

  it('hitStopMs is positive and reasonable', () => {
    expect(BALANCE.JUICE.hitStopMs).toBeGreaterThan(0);
    expect(BALANCE.JUICE.hitStopMs).toBeLessThanOrEqual(100); // should not be too long
  });

  it('hitStopMs is exactly 40', () => {
    expect(BALANCE.JUICE.hitStopMs).toBe(40);
  });
});

describe('Passive balance value ranges (no negative, percentages <= 1.0)', () => {
  const P = BALANCE.PASSIVE;

  const percentFields = [
    ['burnChancePerLevel', P.burnChancePerLevel],
    ['burnDamagePct', P.burnDamagePct],
    ['frostChancePerLevel', P.frostChancePerLevel],
    ['frostSlowMult', P.frostSlowMult],
    ['torrentAtkSpdBonus', P.torrentAtkSpdBonus],
    ['refractionChancePerLevel', P.refractionChancePerLevel],
    ['refractionDamageMult', P.refractionDamageMult],
    ['lightspeedAtkSpdBonus', P.lightspeedAtkSpdBonus],
    ['fortifyArmorBonusPct', P.fortifyArmorBonusPct],
    ['igniteHpThreshold', P.igniteHpThreshold],
    ['igniteBonusDmgPct', P.igniteBonusDmgPct],
  ] as const;

  for (const [name, value] of percentFields) {
    it(`${name} is between 0 and 1`, () => {
      expect(value, name).toBeGreaterThan(0);
      expect(value, name).toBeLessThanOrEqual(1);
    });
  }

  const positiveFields = [
    ['burnDurationMs', P.burnDurationMs],
    ['burnTickIntervalMs', P.burnTickIntervalMs],
    ['frostDurationMs', P.frostDurationMs],
    ['gustKnockbackBonusPct', P.gustKnockbackBonusPct],
    ['torrentComboThreshold', P.torrentComboThreshold],
    ['torrentDurationMs', P.torrentDurationMs],
    ['refractionRange', P.refractionRange],
    ['lightspeedDurationMs', P.lightspeedDurationMs],
    ['thornsDamagePerLevel', P.thornsDamagePerLevel],
    ['fortifyNoHitMs', P.fortifyNoHitMs],
    ['dashTrailDamagePerLevel', P.dashTrailDamagePerLevel],
    ['dashTrailTickIntervalMs', P.dashTrailTickIntervalMs],
    ['dashTrailRadius', P.dashTrailRadius],
  ] as const;

  for (const [name, value] of positiveFields) {
    it(`${name} is positive (no negative)`, () => {
      expect(value, name).toBeGreaterThan(0);
    });
  }
});

describe('All passives in upgrades.ts have matching balance constants', () => {
  it('burn has balance constants', () => {
    expect(BALANCE.PASSIVE.burnChancePerLevel).toBeDefined();
    expect(BALANCE.PASSIVE.burnDamagePct).toBeDefined();
    expect(BALANCE.PASSIVE.burnDurationMs).toBeDefined();
    expect(BALANCE.PASSIVE.burnTickIntervalMs).toBeDefined();
  });

  it('frost_shot has balance constants', () => {
    expect(BALANCE.PASSIVE.frostChancePerLevel).toBeDefined();
    expect(BALANCE.PASSIVE.frostSlowMult).toBeDefined();
    expect(BALANCE.PASSIVE.frostDurationMs).toBeDefined();
  });

  it('gust has balance constants', () => {
    expect(BALANCE.PASSIVE.gustKnockbackBonusPct).toBeDefined();
  });

  it('torrent has balance constants', () => {
    expect(BALANCE.PASSIVE.torrentComboThreshold).toBeDefined();
    expect(BALANCE.PASSIVE.torrentAtkSpdBonus).toBeDefined();
    expect(BALANCE.PASSIVE.torrentDurationMs).toBeDefined();
  });

  it('refraction has balance constants', () => {
    expect(BALANCE.PASSIVE.refractionChancePerLevel).toBeDefined();
    expect(BALANCE.PASSIVE.refractionRange).toBeDefined();
    expect(BALANCE.PASSIVE.refractionDamageMult).toBeDefined();
  });

  it('lightspeed has balance constants', () => {
    expect(BALANCE.PASSIVE.lightspeedAtkSpdBonus).toBeDefined();
    expect(BALANCE.PASSIVE.lightspeedDurationMs).toBeDefined();
  });

  it('thorns has balance constants', () => {
    expect(BALANCE.PASSIVE.thornsDamagePerLevel).toBeDefined();
  });

  it('fortify has balance constants', () => {
    expect(BALANCE.PASSIVE.fortifyNoHitMs).toBeDefined();
    expect(BALANCE.PASSIVE.fortifyArmorBonusPct).toBeDefined();
  });

  it('dash_trail has balance constants', () => {
    expect(BALANCE.PASSIVE.dashTrailDamagePerLevel).toBeDefined();
    expect(BALANCE.PASSIVE.dashTrailTickIntervalMs).toBeDefined();
    expect(BALANCE.PASSIVE.dashTrailRadius).toBeDefined();
  });

  it('ignite has balance constants', () => {
    expect(BALANCE.PASSIVE.igniteHpThreshold).toBeDefined();
    expect(BALANCE.PASSIVE.igniteBonusDmgPct).toBeDefined();
  });

  it('hitStop has balance constant', () => {
    expect(BALANCE.JUICE.hitStopMs).toBeDefined();
  });
});
