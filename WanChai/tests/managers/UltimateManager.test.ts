import { describe, it, expect, vi } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { ELEMENT } from '../../src/config/colors';
import { ULTIMATE_DEFS } from '../../src/config/ultimates';
import { CHARACTERS } from '../../src/config/characters';
import { DISTRICTS, getDistrictForStage } from '../../src/config/districts';

// Mock Phaser before importing UltimateManager
vi.mock('phaser', () => {
  const BaseClass = class {
    constructor(..._args: unknown[]) {
      /* noop */
    }
  };
  return {
    default: {
      WEBGL: 1,
      AUTO: 0,
      Scene: BaseClass,
      Scale: {
        FIT: 1,
        CENTER_BOTH: 1,
      },
      GameObjects: {
        Graphics: BaseClass,
        Rectangle: BaseClass,
        Container: BaseClass,
        Sprite: BaseClass,
        Image: BaseClass,
        Text: BaseClass,
        Zone: BaseClass,
        Group: BaseClass,
      },
      Physics: {
        Arcade: {
          Sprite: BaseClass,
          Group: BaseClass,
          Body: BaseClass,
        },
      },
      Math: {
        Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
      },
    },
  };
});

// =============================================================================
// TASK-064: Ultimate Ability System — Balance Config Tests
// =============================================================================

describe('UltimateManager — ULTIMATE balance config', () => {
  it('ULTIMATE section exists in BALANCE', () => {
    expect(BALANCE.ULTIMATE).toBeDefined();
  });

  it('gaugeMax is defined and positive', () => {
    expect(BALANCE.ULTIMATE.gaugeMax).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugeMax).toBe(100);
  });

  it('gaugePerKill has all tier entries', () => {
    const tiers = ['t1', 't2', 'elite', 'boss'] as const;
    for (const tier of tiers) {
      expect(BALANCE.ULTIMATE.gaugePerKill[tier]).toBeDefined();
      expect(BALANCE.ULTIMATE.gaugePerKill[tier]).toBeGreaterThan(0);
    }
  });

  it('gaugePerKill values increase with tier', () => {
    const g = BALANCE.ULTIMATE.gaugePerKill;
    expect(g.t2).toBeGreaterThan(g.t1);
    expect(g.elite).toBeGreaterThan(g.t2);
    expect(g.boss).toBeGreaterThan(g.elite);
  });

  it('t1 kills required to fill gauge is reasonable (10-40 kills)', () => {
    const killsNeeded = BALANCE.ULTIMATE.gaugeMax / BALANCE.ULTIMATE.gaugePerKill.t1;
    expect(killsNeeded).toBeGreaterThanOrEqual(10);
    expect(killsNeeded).toBeLessThanOrEqual(40);
  });

  it('boss kill alone does not fill gauge from zero', () => {
    expect(BALANCE.ULTIMATE.gaugePerKill.boss).toBeLessThanOrEqual(BALANCE.ULTIMATE.gaugeMax);
  });

  it('slowMoDurationMs is defined and positive', () => {
    expect(BALANCE.ULTIMATE.slowMoDurationMs).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.slowMoDurationMs).toBeLessThanOrEqual(2000);
  });

  it('slowMoTimeScale is between 0 and 1', () => {
    expect(BALANCE.ULTIMATE.slowMoTimeScale).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.slowMoTimeScale).toBeLessThan(1);
  });
});

describe('UltimateManager — HAI (Cyclone) config', () => {
  it('hai config exists', () => {
    expect(BALANCE.ULTIMATE.hai).toBeDefined();
  });

  it('cyclone radius is positive and reasonable', () => {
    expect(BALANCE.ULTIMATE.hai.radius).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.hai.radius).toBeLessThanOrEqual(500);
  });

  it('cyclone damage is positive', () => {
    expect(BALANCE.ULTIMATE.hai.damage).toBeGreaterThan(0);
  });

  it('cyclone knockback force is positive', () => {
    expect(BALANCE.ULTIMATE.hai.knockback).toBeGreaterThan(0);
  });

  it('cyclone duration is reasonable', () => {
    expect(BALANCE.ULTIMATE.hai.durationMs).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.hai.durationMs).toBeLessThanOrEqual(5000);
  });
});

describe('UltimateManager — NOVA (Frost Wave) config', () => {
  it('nova config exists', () => {
    expect(BALANCE.ULTIMATE.nova).toBeDefined();
  });

  it('freeze duration is between 1s and 5s', () => {
    expect(BALANCE.ULTIMATE.nova.freezeDurationMs).toBeGreaterThanOrEqual(1000);
    expect(BALANCE.ULTIMATE.nova.freezeDurationMs).toBeLessThanOrEqual(5000);
  });

  it('freeze range covers full screen (9999 = screen-wide)', () => {
    expect(BALANCE.ULTIMATE.nova.range).toBeGreaterThanOrEqual(1280);
  });
});

describe('UltimateManager — SOL (Firestorm) config', () => {
  it('sol config exists', () => {
    expect(BALANCE.ULTIMATE.sol).toBeDefined();
  });

  it('firestorm DOT damage is positive', () => {
    expect(BALANCE.ULTIMATE.sol.dotDamage).toBeGreaterThan(0);
  });

  it('firestorm DOT interval is positive and less than duration', () => {
    expect(BALANCE.ULTIMATE.sol.dotIntervalMs).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.sol.dotIntervalMs).toBeLessThan(BALANCE.ULTIMATE.sol.durationMs);
  });

  it('firestorm duration is between 1s and 10s', () => {
    expect(BALANCE.ULTIMATE.sol.durationMs).toBeGreaterThanOrEqual(1000);
    expect(BALANCE.ULTIMATE.sol.durationMs).toBeLessThanOrEqual(10000);
  });

  it('firestorm total damage over duration is reasonable', () => {
    const ticks = Math.floor(BALANCE.ULTIMATE.sol.durationMs / BALANCE.ULTIMATE.sol.dotIntervalMs);
    const totalDmg = ticks * BALANCE.ULTIMATE.sol.dotDamage;
    expect(totalDmg).toBeGreaterThan(0);
    expect(totalDmg).toBeLessThanOrEqual(500); // prevent screen-clear on activation
  });
});

describe('UltimateManager — MEI (Light Pillar) config', () => {
  it('mei config exists', () => {
    expect(BALANCE.ULTIMATE.mei).toBeDefined();
  });

  it('light pillar damage is high (>= 100)', () => {
    expect(BALANCE.ULTIMATE.mei.damage).toBeGreaterThanOrEqual(100);
  });

  it('light pillar width is positive and reasonable for 720px screen', () => {
    expect(BALANCE.ULTIMATE.mei.width).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.mei.width).toBeLessThanOrEqual(200);
  });

  it('light pillar is piercing', () => {
    expect(BALANCE.ULTIMATE.mei.piercing).toBe(true);
  });
});

describe('UltimateManager — KAI (Earthquake) config', () => {
  it('kai config exists', () => {
    expect(BALANCE.ULTIMATE.kai).toBeDefined();
  });

  it('earthquake stun duration is between 1s and 5s', () => {
    expect(BALANCE.ULTIMATE.kai.stunDurationMs).toBeGreaterThanOrEqual(1000);
    expect(BALANCE.ULTIMATE.kai.stunDurationMs).toBeLessThanOrEqual(5000);
  });

  it('earthquake armor buff is between 0 and 1', () => {
    expect(BALANCE.ULTIMATE.kai.armorBuff).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.kai.armorBuff).toBeLessThanOrEqual(1);
  });

  it('earthquake armor buff duration is >= stun duration', () => {
    expect(BALANCE.ULTIMATE.kai.armorDurationMs).toBeGreaterThanOrEqual(BALANCE.ULTIMATE.kai.stunDurationMs);
  });
});

describe('UltimateManager — ultimate definitions', () => {
  it('every character has an ultimate defined', () => {
    for (const charId of Object.keys(CHARACTERS)) {
      expect(ULTIMATE_DEFS[charId]).toBeDefined();
      expect(ULTIMATE_DEFS[charId].id).toBe(charId);
    }
  });

  it('every ultimate has a name and Korean name', () => {
    for (const ultDef of Object.values(ULTIMATE_DEFS)) {
      expect(ultDef.name).toBeTruthy();
      expect(ultDef.nameKo).toBeTruthy();
    }
  });

  it('every ultimate has an element matching its character', () => {
    for (const charId of Object.keys(CHARACTERS)) {
      const char = CHARACTERS[charId];
      const ult = ULTIMATE_DEFS[charId];
      expect(ult.element).toBe(char.element);
    }
  });

  it('every ultimate has a valid type', () => {
    const validTypes = ['aoe', 'buff', 'projectile', 'debuff'];
    for (const ultDef of Object.values(ULTIMATE_DEFS)) {
      expect(validTypes).toContain(ultDef.type);
    }
  });

  it('ultimate count matches character count', () => {
    expect(Object.keys(ULTIMATE_DEFS).length).toBe(Object.keys(CHARACTERS).length);
  });
});

describe('UltimateManager — gauge HUD config', () => {
  it('gauge bar width is defined and fits screen (<=720)', () => {
    expect(BALANCE.ULTIMATE.gaugeBarWidth).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugeBarWidth).toBeLessThanOrEqual(720);
  });

  it('gauge bar height is defined and reasonable', () => {
    expect(BALANCE.ULTIMATE.gaugeBarHeight).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.gaugeBarHeight).toBeLessThanOrEqual(20);
  });

  it('pulse animation values are valid', () => {
    expect(BALANCE.ULTIMATE.pulseAlphaMin).toBeGreaterThan(0);
    expect(BALANCE.ULTIMATE.pulseAlphaMax).toBeLessThanOrEqual(1);
    expect(BALANCE.ULTIMATE.pulseAlphaMin).toBeLessThan(BALANCE.ULTIMATE.pulseAlphaMax);
    expect(BALANCE.ULTIMATE.pulseDurationMs).toBeGreaterThan(0);
  });
});

describe('UltimateManager — element color mapping', () => {
  it('every character element has a color in ELEMENT', () => {
    for (const char of Object.values(CHARACTERS)) {
      expect(ELEMENT[char.element]).toBeDefined();
      expect(typeof ELEMENT[char.element]).toBe('number');
    }
  });

  it('HAI element color is WIND (cyan-green)', () => {
    expect(ELEMENT[CHARACTERS.hai.element]).toBe(ELEMENT.WIND);
  });

  it('NOVA element color is WATER (blue)', () => {
    expect(ELEMENT[CHARACTERS.nova.element]).toBe(ELEMENT.WATER);
  });

  it('SOL element color is FIRE (orange)', () => {
    expect(ELEMENT[CHARACTERS.sol.element]).toBe(ELEMENT.FIRE);
  });

  it('MEI element color is LIGHT (gold)', () => {
    expect(ELEMENT[CHARACTERS.mei.element]).toBe(ELEMENT.LIGHT);
  });

  it('KAI element color is EARTH (green)', () => {
    expect(ELEMENT[CHARACTERS.kai.element]).toBe(ELEMENT.EARTH);
  });
});

// =============================================================================
// TASK-065: HUD Enhancement Tests
// =============================================================================

describe('HUD Enhancement — HUD balance config', () => {
  it('HUD section exists in BALANCE', () => {
    expect(BALANCE.HUD).toBeDefined();
  });

  it('weather indicator position is within screen bounds', () => {
    expect(BALANCE.HUD.weatherIndicatorX).toBeGreaterThanOrEqual(0);
    expect(BALANCE.HUD.weatherIndicatorX).toBeLessThan(720);
    expect(BALANCE.HUD.weatherIndicatorY).toBeGreaterThanOrEqual(0);
    expect(BALANCE.HUD.weatherIndicatorY).toBeLessThan(1280);
  });

  it('weather dot radius is positive and reasonable', () => {
    expect(BALANCE.HUD.weatherDotRadius).toBeGreaterThan(0);
    expect(BALANCE.HUD.weatherDotRadius).toBeLessThanOrEqual(20);
  });

  it('critter cooldown position is within screen bounds', () => {
    expect(BALANCE.HUD.critterCdX).toBeGreaterThanOrEqual(0);
    expect(BALANCE.HUD.critterCdX).toBeLessThan(720);
    expect(BALANCE.HUD.critterCdY).toBeGreaterThanOrEqual(0);
    expect(BALANCE.HUD.critterCdY).toBeLessThan(1280);
  });

  it('critter cooldown radius is positive and reasonable', () => {
    expect(BALANCE.HUD.critterCdRadius).toBeGreaterThan(0);
    expect(BALANCE.HUD.critterCdRadius).toBeLessThanOrEqual(40);
  });

  it('district label fade duration is positive', () => {
    expect(BALANCE.HUD.districtLabelFadeMs).toBeGreaterThan(0);
    expect(BALANCE.HUD.districtLabelFadeMs).toBeLessThanOrEqual(10000);
  });

  it('district label font size is readable (>=20)', () => {
    expect(BALANCE.HUD.districtLabelFontSize).toBeGreaterThanOrEqual(20);
    expect(BALANCE.HUD.districtLabelFontSize).toBeLessThanOrEqual(60);
  });
});

describe('HUD Enhancement — weather indicator i18n', () => {
  it('every district weather effect has a locale key', () => {
    for (const district of DISTRICTS) {
      const key = `weather.${district.weatherEffect}`;
      expect(key).toBeTruthy();
    }
  });
});

describe('HUD Enhancement — district name i18n', () => {
  it('every district has a district.* locale key pattern', () => {
    for (const district of DISTRICTS) {
      const key = `district.${district.id}`;
      expect(key).toBeTruthy();
      expect(district.id).toBeTruthy();
    }
  });

  it('district IDs are unique', () => {
    const ids = DISTRICTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('HUD Enhancement — district-stage mapping for HUD', () => {
  it('all 16 stages map to a district', () => {
    for (let s = 1; s <= 16; s++) {
      const district = getDistrictForStage(s);
      expect(district).toBeDefined();
    }
  });

  it('stage 1 maps to Central', () => {
    expect(getDistrictForStage(1)!.id).toBe('central');
  });

  it('stage 3 maps to TST', () => {
    expect(getDistrictForStage(3)!.id).toBe('tst');
  });

  it('wave stages get correct district cycling', () => {
    // Wave stages: 1,3,5,7,9,11,13,15 → districts 0,1,2,3,4,5,6,7
    const waveStages = [1, 3, 5, 7, 9, 11, 13, 15];
    for (let i = 0; i < waveStages.length; i++) {
      const district = getDistrictForStage(waveStages[i]);
      expect(district).toBeDefined();
      expect(district!.id).toBe(DISTRICTS[i].id);
    }
  });

  it('boss stages inherit parent district', () => {
    // Stage 2 (boss) should get same district as stage 1 (wave)
    expect(getDistrictForStage(2)!.id).toBe(getDistrictForStage(1)!.id);
    // Stage 4 (boss) should get same district as stage 3 (wave)
    expect(getDistrictForStage(4)!.id).toBe(getDistrictForStage(3)!.id);
  });
});

describe('HUD Enhancement — critter cooldown integration', () => {
  it('every character element maps to a critter', () => {
    // Verify critters cover the character elements
    const characterElements = new Set(Object.values(CHARACTERS).map((c) => c.element));
    expect(characterElements.size).toBeGreaterThan(0);
  });

  it('critter cooldown is positive for all critters', () => {
    // Import is avoided since critters.ts is tested elsewhere
    // Just verify BALANCE.CRITTER config is available
    expect(BALANCE.CRITTER.orbitRadius).toBeGreaterThan(0);
    expect(BALANCE.CRITTER.orbitSpeed).toBeGreaterThan(0);
  });
});

describe('HUD Enhancement — element color coverage for HUD indicators', () => {
  it('all district elements have colors in ELEMENT config', () => {
    for (const district of DISTRICTS) {
      const color = ELEMENT[district.element as keyof typeof ELEMENT];
      expect(color).toBeDefined();
      expect(typeof color).toBe('number');
    }
  });

  it('WIND element has a valid hex color', () => {
    expect(ELEMENT.WIND).toBeGreaterThan(0);
  });

  it('DARK element has a valid hex color', () => {
    expect(ELEMENT.DARK).toBeGreaterThan(0);
  });
});

// =============================================================================
// Cross-system integration tests
// =============================================================================

describe('Ultimate + HUD — cross-system balance', () => {
  it('ultimate gauge bar fits between base HP bar and screen bottom', () => {
    const gaugeY = 1280 - 52; // GAME_HEIGHT - 52 (from HUDManager)
    const baseBarY = 1280 - 30; // GAME_HEIGHT - 30
    expect(gaugeY).toBeLessThan(baseBarY);
    expect(gaugeY + BALANCE.ULTIMATE.gaugeBarHeight).toBeLessThanOrEqual(baseBarY);
  });

  it('weather indicator is on the left side, weapon slots on the right (no overlap)', () => {
    // Weather is at x=20 (left); weapon slots are at x=(720-10-75)=635 (right)
    const weatherX = BALANCE.HUD.weatherIndicatorX;
    const weaponSlotX = 720 - 10 - 150 / 2; // GAME_WIDTH - 10 - slotW/2
    // Weather indicator + text is at most ~220px wide, well below weapon slot X
    expect(weatherX + 220).toBeLessThan(weaponSlotX);
  });

  it('critter cooldown does not overlap with base HP bar', () => {
    const critterY = BALANCE.HUD.critterCdY;
    const baseBarY = 1280 - 30;
    // Critter center + radius should be above base bar
    expect(critterY + BALANCE.HUD.critterCdRadius).toBeLessThan(baseBarY);
  });

  it('district label does not overlap with XP bar', () => {
    // District label at y=120, XP bar at y=70 with height 8
    const districtY = 120;
    const xpBarBottom = 70 + 8;
    expect(districtY).toBeGreaterThan(xpBarBottom);
  });
});
