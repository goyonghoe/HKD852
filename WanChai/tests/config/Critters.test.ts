import { describe, it, expect } from 'vitest';
import { CRITTERS, getCritterForElement } from '../../src/config/critters';
import { CHARACTERS } from '../../src/config/characters';

describe('Critters config', () => {
  const critters = Object.values(CRITTERS);

  it('has exactly 6 critters', () => {
    expect(critters).toHaveLength(6);
  });

  it('all critters have required fields', () => {
    for (const c of critters) {
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

  it('at least 5 distinct elements across 6 critters', () => {
    // dolphin and koi share WATER; all other elements are unique
    const elements = critters.map((c) => c.element);
    expect(new Set(elements).size).toBeGreaterThanOrEqual(5);
  });

  it('all critters have unique skills', () => {
    const skills = critters.map((c) => c.skill);
    expect(new Set(skills).size).toBe(skills.length);
  });

  it('every character has a matching critter', () => {
    for (const char of Object.values(CHARACTERS)) {
      const critter = getCritterForElement(char.element);
      expect(critter).toBeDefined();
      expect(critter!.element).toBe(char.element);
    }
  });

  it('cooldowns are reasonable (5s-20s)', () => {
    for (const c of critters) {
      expect(c.cooldownMs).toBeGreaterThanOrEqual(5000);
      expect(c.cooldownMs).toBeLessThanOrEqual(20000);
    }
  });

  it('duration-based skills have positive durationMs', () => {
    const durationSkills = ['regenStream', 'shieldBubble'];
    for (const c of critters) {
      if (durationSkills.includes(c.skill)) {
        expect(c.durationMs).toBeGreaterThan(0);
      }
    }
  });

  it('instant skills have zero durationMs', () => {
    const instantSkills = ['healPulse', 'knockbackAura', 'flameBurst', 'chainLightning'];
    for (const c of critters) {
      if (instantSkills.includes(c.skill)) {
        expect(c.durationMs).toBe(0);
      }
    }
  });
});
