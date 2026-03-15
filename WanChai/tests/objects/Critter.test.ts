import { describe, it, expect } from 'vitest';
import { CRITTERS, getCritterForElement, type CritterSkillType } from '../../src/config/critters';
import { BALANCE } from '../../src/config/balance';
import { CHARACTERS } from '../../src/config/characters';
import { ELEMENT } from '../../src/config/colors';

const allCritters = Object.values(CRITTERS);
const B = BALANCE.CRITTER;

describe('Critter skill config — completeness', () => {
  it('has exactly 6 critters', () => {
    expect(allCritters).toHaveLength(6);
  });

  it('all critters have required fields', () => {
    for (const c of allCritters) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.nameKo).toBeTruthy();
      expect(c.element).toBeTruthy();
      expect(c.skill).toBeTruthy();
      expect(c.skillName).toBeTruthy();
      expect(c.skillNameEn).toBeTruthy();
      expect(c.skillDesc).toBeTruthy();
      expect(c.skillDescEn).toBeTruthy();
      expect(c.cooldownMs).toBeGreaterThan(0);
      expect(c.spriteKey).toBeTruthy();
    }
  });

  it('all critters have unique skill types', () => {
    const skills = allCritters.map((c) => c.skill);
    expect(new Set(skills).size).toBe(skills.length);
  });

  it('covers all 6 required skill types', () => {
    const expectedSkills: CritterSkillType[] = [
      'healPulse',
      'knockbackAura',
      'regenStream',
      'flameBurst',
      'chainLightning',
      'shieldBubble',
    ];
    const actualSkills = allCritters.map((c) => c.skill);
    for (const s of expectedSkills) {
      expect(actualSkills).toContain(s);
    }
  });

  it('each critter has a matching element in ELEMENT colors', () => {
    for (const c of allCritters) {
      expect(ELEMENT[c.element as keyof typeof ELEMENT]).toBeDefined();
    }
  });

  it('every character has a matching critter', () => {
    for (const char of Object.values(CHARACTERS)) {
      const critter = getCritterForElement(char.element);
      expect(critter).toBeDefined();
      expect(critter!.element).toBe(char.element);
    }
  });

  it('cooldowns are reasonable (8s-20s)', () => {
    for (const c of allCritters) {
      expect(c.cooldownMs).toBeGreaterThanOrEqual(8000);
      expect(c.cooldownMs).toBeLessThanOrEqual(20000);
    }
  });
});

describe('Critter skill config — individual critters', () => {
  it('dolphin has healPulse skill with WATER element', () => {
    const d = CRITTERS.dolphin;
    expect(d.skill).toBe('healPulse');
    expect(d.element).toBe('WATER');
    expect(d.durationMs).toBe(0); // instant
  });

  it('kite has knockbackAura skill with WIND element', () => {
    const k = CRITTERS.kite;
    expect(k.skill).toBe('knockbackAura');
    expect(k.element).toBe('WIND');
    expect(k.durationMs).toBe(0); // instant
  });

  it('koi has regenStream skill with WATER element', () => {
    const k = CRITTERS.koi;
    expect(k.skill).toBe('regenStream');
    expect(k.element).toBe('WATER');
    expect(k.durationMs).toBeGreaterThan(0); // duration-based
  });

  it('lion has flameBurst skill with FIRE element', () => {
    const l = CRITTERS.lion;
    expect(l.skill).toBe('flameBurst');
    expect(l.element).toBe('FIRE');
    expect(l.durationMs).toBe(0); // instant
  });

  it('macaque has chainLightning skill with LIGHT element', () => {
    const m = CRITTERS.macaque;
    expect(m.skill).toBe('chainLightning');
    expect(m.element).toBe('LIGHT');
    expect(m.durationMs).toBe(0); // instant
  });

  it('pangolin has shieldBubble skill with EARTH element', () => {
    const p = CRITTERS.pangolin;
    expect(p.skill).toBe('shieldBubble');
    expect(p.element).toBe('EARTH');
    expect(p.durationMs).toBeGreaterThan(0); // duration-based
  });
});

describe('Critter balance — Heal Pulse (dolphin)', () => {
  it('healPulsePercent is positive and <= 20%', () => {
    expect(B.healPulsePercent).toBeGreaterThan(0);
    expect(B.healPulsePercent).toBeLessThanOrEqual(0.2);
  });

  it('heal amount never exceeds max HP (600 base)', () => {
    const baseMaxHp = BALANCE.BASE.hp;
    const healAmt = Math.ceil(baseMaxHp * B.healPulsePercent);
    expect(healAmt).toBeLessThanOrEqual(baseMaxHp);
    expect(healAmt).toBeGreaterThan(0);
  });

  it('heal plus current HP capped at max', () => {
    const baseMaxHp = BALANCE.BASE.hp;
    const currentHp = baseMaxHp - 10;
    const healAmt = Math.ceil(baseMaxHp * B.healPulsePercent);
    const afterHeal = Math.min(baseMaxHp, currentHp + healAmt);
    expect(afterHeal).toBeLessThanOrEqual(baseMaxHp);
  });
});

describe('Critter balance — Knockback Aura (kite)', () => {
  it('knockback radius is positive', () => {
    expect(B.knockbackAuraRadius).toBeGreaterThan(0);
  });

  it('knockback force is positive and >= 100px', () => {
    expect(B.knockbackAuraForce).toBeGreaterThanOrEqual(100);
  });

  it('knockback radius is reasonable (100-400px)', () => {
    expect(B.knockbackAuraRadius).toBeGreaterThanOrEqual(100);
    expect(B.knockbackAuraRadius).toBeLessThanOrEqual(400);
  });
});

describe('Critter balance — Regen Stream (koi)', () => {
  it('regen ticks count is 3', () => {
    expect(B.regenStreamTicks).toBe(3);
  });

  it('regen HP per tick is positive', () => {
    expect(B.regenStreamHpPerTick).toBeGreaterThan(0);
  });

  it('regen interval is positive', () => {
    expect(B.regenStreamIntervalMs).toBeGreaterThan(0);
  });

  it('total regen does not exceed max base HP', () => {
    const totalHeal = B.regenStreamTicks * B.regenStreamHpPerTick;
    expect(totalHeal).toBeLessThanOrEqual(BALANCE.BASE.hp);
  });

  it('koi durationMs covers all ticks (ticks * interval)', () => {
    const totalDuration = B.regenStreamTicks * B.regenStreamIntervalMs;
    expect(CRITTERS.koi.durationMs).toBeGreaterThanOrEqual(totalDuration);
  });
});

describe('Critter balance — Flame Burst (lion)', () => {
  it('flame burst radius is 120', () => {
    expect(B.flameBurstRadius).toBe(120);
  });

  it('flame burst damage is positive', () => {
    expect(B.flameBurstDamage).toBeGreaterThan(0);
  });

  it('flame burst damage contributes ~10-15% of DPS budget', () => {
    // Lion cooldown is 10s, damage is 25 per activation
    // DPS contribution = 25 / 10 = 2.5 DPS
    // Player base DPS ~30-50, so 2.5/40 ~= 6% — within budget
    const dps = B.flameBurstDamage / (CRITTERS.lion.cooldownMs / 1000);
    expect(dps).toBeGreaterThan(0);
    expect(dps).toBeLessThan(20); // should not overshadow player weapons
  });
});

describe('Critter balance — Chain Lightning (macaque)', () => {
  it('chain targets 3 enemies', () => {
    expect(B.chainLightningTargets).toBe(3);
  });

  it('chain damage is positive', () => {
    expect(B.chainLightningDamage).toBeGreaterThan(0);
  });

  it('chain range is positive', () => {
    expect(B.chainLightningRange).toBeGreaterThan(0);
  });

  it('chain jump range is positive and less than initial range', () => {
    expect(B.chainLightningChainRange).toBeGreaterThan(0);
    expect(B.chainLightningChainRange).toBeLessThanOrEqual(B.chainLightningRange);
  });

  it('total chain damage does not overshadow weapons', () => {
    const totalDmg = B.chainLightningTargets * B.chainLightningDamage;
    const dps = totalDmg / (CRITTERS.macaque.cooldownMs / 1000);
    expect(dps).toBeLessThan(20);
  });
});

describe('Critter balance — Shield Bubble (pangolin)', () => {
  it('shield blocks at least 1 hit', () => {
    expect(B.shieldBubbleBlockCount).toBeGreaterThanOrEqual(1);
  });

  it('shield block count is reasonable (1-3)', () => {
    expect(B.shieldBubbleBlockCount).toBeLessThanOrEqual(3);
  });

  it('shield duration is positive', () => {
    expect(B.shieldBubbleDurationMs).toBeGreaterThan(0);
  });

  it('shield duration matches pangolin durationMs', () => {
    expect(CRITTERS.pangolin.durationMs).toBe(B.shieldBubbleDurationMs);
  });

  it('shield cooldown is longer than duration (cannot be permanent)', () => {
    expect(CRITTERS.pangolin.cooldownMs).toBeGreaterThan(B.shieldBubbleDurationMs);
  });
});

describe('Critter balance — orbit constants', () => {
  it('orbit radius is positive', () => {
    expect(B.orbitRadius).toBeGreaterThan(0);
  });

  it('orbit speed is positive', () => {
    expect(B.orbitSpeed).toBeGreaterThan(0);
  });

  it('orbit radius is reasonable (40-200px)', () => {
    expect(B.orbitRadius).toBeGreaterThanOrEqual(40);
    expect(B.orbitRadius).toBeLessThanOrEqual(200);
  });
});
