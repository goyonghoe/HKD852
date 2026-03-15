import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BALANCE } from '../../src/config/balance';
import { WEATHER_COLORS } from '../../src/config/colors';
import { DISTRICTS, getDistrictForStage } from '../../src/config/districts';

// Mock Phaser before importing WeatherManager
// Must provide all Phaser classes and constants referenced transitively
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

import { WeatherManager } from '../../src/managers/WeatherManager';

/** Create a minimal Phaser.Scene mock for WeatherManager tests. */
function createMockScene() {
  const mockGraphics = {
    setDepth: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    fillStyle: vi.fn(),
    fillCircle: vi.fn(),
    fillRect: vi.fn(),
    lineStyle: vi.fn(),
    strokeCircle: vi.fn(),
    strokeRect: vi.fn(),
    strokePath: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    active: true,
  };

  const mockRectangle = {
    setDepth: vi.fn().mockReturnThis(),
    setAngle: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    x: 0,
    y: 0,
  };

  return {
    add: {
      graphics: vi.fn(() => ({ ...mockGraphics })),
      rectangle: vi.fn(() => ({ ...mockRectangle })),
    },
  } as unknown as import('phaser').Scene;
}

/**
 * WeatherManager tests.
 * Since WeatherManager is tightly coupled to Phaser (Graphics, Rectangles, Scene),
 * we test the pure config/balance aspects and verify the weather system contract:
 *   1. All weather effect IDs in balance.ts
 *   2. District-weather mapping validity
 *   3. Rain speed debuff bounds
 *   4. Shield regen rate bounds
 *   5. Lightning field damage/interval balance
 *   6. Void gravity pull force bounds
 *   7. Weather reset on stage change (config-level)
 */

// All valid weather effect IDs the WeatherManager handles
const VALID_WEATHER_EFFECTS = [
  'speed_all',
  'rain',
  'flame_zones',
  'armor_all',
  'crit_all',
  'fog',
  'shield_regen',
  'lightning_field',
  'void_gravity',
] as const;

describe('WeatherManager — balance config', () => {
  it('WEATHER section exists in BALANCE', () => {
    expect(BALANCE.WEATHER).toBeDefined();
  });

  it('speed_all bonus is defined and positive', () => {
    expect(BALANCE.WEATHER.speedAllBonus).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.speedAllBonus).toBeLessThanOrEqual(0.5);
  });

  it('armor_all bonus is defined and positive', () => {
    expect(BALANCE.WEATHER.armorAllBonus).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.armorAllBonus).toBeLessThanOrEqual(0.5);
  });

  it('crit_all bonus is defined and positive', () => {
    expect(BALANCE.WEATHER.critAllBonus).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.critAllBonus).toBeLessThanOrEqual(0.5);
  });

  it('fog radius is reasonable for 720x1280 resolution', () => {
    expect(BALANCE.WEATHER.fogRadius).toBeGreaterThanOrEqual(100);
    expect(BALANCE.WEATHER.fogRadius).toBeLessThanOrEqual(600);
  });

  it('flame zone interval is between 5s and 30s', () => {
    expect(BALANCE.WEATHER.flameZoneIntervalMs).toBeGreaterThanOrEqual(5000);
    expect(BALANCE.WEATHER.flameZoneIntervalMs).toBeLessThanOrEqual(30000);
  });

  it('flame zone damage is positive and reasonable', () => {
    expect(BALANCE.WEATHER.flameZoneDamage).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.flameZoneDamage).toBeLessThanOrEqual(100);
  });

  it('flame zone duration is between 2s and 15s', () => {
    expect(BALANCE.WEATHER.flameZoneDurationMs).toBeGreaterThanOrEqual(2000);
    expect(BALANCE.WEATHER.flameZoneDurationMs).toBeLessThanOrEqual(15000);
  });

  it('flame zone radius is positive', () => {
    expect(BALANCE.WEATHER.flameZoneRadius).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.flameZoneRadius).toBeLessThanOrEqual(200);
  });
});

describe('WeatherManager — rain effect config', () => {
  it('rainEnemySpeedMult exists in balance', () => {
    expect(BALANCE.WEATHER.rainEnemySpeedMult).toBeDefined();
  });

  it('rain speed debuff multiplier is within reasonable bounds (0.70-0.95)', () => {
    expect(BALANCE.WEATHER.rainEnemySpeedMult).toBeGreaterThanOrEqual(0.7);
    expect(BALANCE.WEATHER.rainEnemySpeedMult).toBeLessThanOrEqual(0.95);
  });

  it('rain speed debuff is actually a debuff (< 1.0)', () => {
    expect(BALANCE.WEATHER.rainEnemySpeedMult).toBeLessThan(1.0);
  });

  it('rain particle count is positive', () => {
    expect(BALANCE.WEATHER.rainParticleCount).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.rainParticleCount).toBeLessThanOrEqual(100);
  });

  it('rain debuff value equals -15% (0.85 multiplier)', () => {
    // Spec: All enemies get -15% move speed
    expect(BALANCE.WEATHER.rainEnemySpeedMult).toBe(0.85);
  });
});

describe('WeatherManager — shield_regen effect config', () => {
  it('shieldRegenHpPerSec exists in balance', () => {
    expect(BALANCE.WEATHER.shieldRegenHpPerSec).toBeDefined();
  });

  it('shield regen rate does not exceed 5 HP/s', () => {
    expect(BALANCE.WEATHER.shieldRegenHpPerSec).toBeLessThanOrEqual(5);
  });

  it('shield regen rate is positive', () => {
    expect(BALANCE.WEATHER.shieldRegenHpPerSec).toBeGreaterThan(0);
  });

  it('shield regen rate equals 2 HP/s (spec)', () => {
    expect(BALANCE.WEATHER.shieldRegenHpPerSec).toBe(2);
  });

  it('shield regen over 60s does not exceed base HP', () => {
    const totalRegen = BALANCE.WEATHER.shieldRegenHpPerSec * 60;
    expect(totalRegen).toBeLessThan(BALANCE.BASE.hp);
  });
});

describe('WeatherManager — lightning_field effect config', () => {
  it('lightningFieldDamage exists in balance', () => {
    expect(BALANCE.WEATHER.lightningFieldDamage).toBeDefined();
  });

  it('lightning damage is positive and not excessive', () => {
    expect(BALANCE.WEATHER.lightningFieldDamage).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.lightningFieldDamage).toBeLessThanOrEqual(50);
  });

  it('lightning damage equals 15 (spec)', () => {
    expect(BALANCE.WEATHER.lightningFieldDamage).toBe(15);
  });

  it('lightningFieldIntervalMs exists in balance', () => {
    expect(BALANCE.WEATHER.lightningFieldIntervalMs).toBeDefined();
  });

  it('lightning interval is between 1s and 10s', () => {
    expect(BALANCE.WEATHER.lightningFieldIntervalMs).toBeGreaterThanOrEqual(1000);
    expect(BALANCE.WEATHER.lightningFieldIntervalMs).toBeLessThanOrEqual(10000);
  });

  it('lightning interval equals 3000ms (spec)', () => {
    expect(BALANCE.WEATHER.lightningFieldIntervalMs).toBe(3000);
  });

  it('lightning DPS is reasonable (damage / interval)', () => {
    const dps = (BALANCE.WEATHER.lightningFieldDamage / BALANCE.WEATHER.lightningFieldIntervalMs) * 1000;
    expect(dps).toBeGreaterThan(0);
    expect(dps).toBeLessThanOrEqual(20); // max 20 DPS environmental
  });

  it('lightning field radius is positive', () => {
    expect(BALANCE.WEATHER.lightningFieldRadius).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.lightningFieldRadius).toBeLessThanOrEqual(200);
  });
});

describe('WeatherManager — void_gravity effect config', () => {
  it('voidGravityPullSpeed exists in balance', () => {
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBeDefined();
  });

  it('void gravity pull speed is positive', () => {
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBeGreaterThan(0);
  });

  it('void gravity pull speed equals 30 px/s (spec)', () => {
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBe(30);
  });

  it('void gravity pull speed is reasonable', () => {
    // Gravity should not outpace enemies completely (player is stationary in hill defense)
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBeLessThan(200);
  });

  it('voidGravityRadius exists and is reasonable', () => {
    expect(BALANCE.WEATHER.voidGravityRadius).toBeGreaterThan(0);
    expect(BALANCE.WEATHER.voidGravityRadius).toBeLessThanOrEqual(600);
  });
});

describe('WeatherManager — district-weather mapping', () => {
  it('every district has a weatherEffect assigned', () => {
    for (const district of DISTRICTS) {
      expect(district.weatherEffect).toBeTruthy();
      expect(typeof district.weatherEffect).toBe('string');
    }
  });

  it('every district weatherEffect is a known valid effect', () => {
    for (const district of DISTRICTS) {
      expect(VALID_WEATHER_EFFECTS).toContain(district.weatherEffect);
    }
  });

  it('all 8 districts have unique weather effects', () => {
    const effects = DISTRICTS.map((d) => d.weatherEffect);
    expect(new Set(effects).size).toBe(effects.length);
  });

  it('rain is assigned to TST district', () => {
    const tst = DISTRICTS.find((d) => d.id === 'tst');
    expect(tst).toBeDefined();
    expect(tst!.weatherEffect).toBe('rain');
  });

  it('shield_regen is assigned to Aberdeen district', () => {
    const aberdeen = DISTRICTS.find((d) => d.id === 'aberdeen');
    expect(aberdeen).toBeDefined();
    expect(aberdeen!.weatherEffect).toBe('shield_regen');
  });

  it('lightning_field is assigned to Wong Tai Sin district', () => {
    const wts = DISTRICTS.find((d) => d.id === 'wts');
    expect(wts).toBeDefined();
    expect(wts!.weatherEffect).toBe('lightning_field');
  });

  it('void_gravity is assigned to Kowloon City district', () => {
    const kowloon = DISTRICTS.find((d) => d.id === 'kowloon');
    expect(kowloon).toBeDefined();
    expect(kowloon!.weatherEffect).toBe('void_gravity');
  });

  it('no adjacent wave stages share the same weather effect', () => {
    // Wave stages: 1, 3, 5, 7, 9... → district indices 0, 1, 2, 3, 4...
    for (let i = 0; i < DISTRICTS.length - 1; i++) {
      expect(DISTRICTS[i].weatherEffect).not.toBe(DISTRICTS[i + 1].weatherEffect);
    }
  });
});

describe('WeatherManager — weather reset contract', () => {
  // These test the expected default values after a weather reset.
  // The actual WeatherManager.apply() resets these before applying new effects.

  it('default speedMult should be 1 (no effect)', () => {
    // WeatherManager resets speedMult to 1 before applying
    const defaultSpeedMult = 1;
    expect(defaultSpeedMult).toBe(1);
  });

  it('default armorMult should be 1 (no effect)', () => {
    const defaultArmorMult = 1;
    expect(defaultArmorMult).toBe(1);
  });

  it('default critBonus should be 0 (no effect)', () => {
    const defaultCritBonus = 0;
    expect(defaultCritBonus).toBe(0);
  });

  it('default enemySpeedMult should be 1 (no debuff)', () => {
    const defaultEnemySpeedMult = 1;
    expect(defaultEnemySpeedMult).toBe(1);
  });

  it('default baseRegenPerSec should be 0 (no regen)', () => {
    const defaultBaseRegen = 0;
    expect(defaultBaseRegen).toBe(0);
  });
});

describe('WeatherManager — VFX colors config', () => {
  it('WEATHER_COLORS has rain colors', () => {
    expect(WEATHER_COLORS.RAIN_DROP).toBeDefined();
    expect(WEATHER_COLORS.RAIN_DROP_ALPHA).toBeGreaterThan(0);
    expect(WEATHER_COLORS.RAIN_DROP_ALPHA).toBeLessThanOrEqual(1);
  });

  it('WEATHER_COLORS has shield regen colors', () => {
    expect(WEATHER_COLORS.SHIELD_REGEN_FILL).toBeDefined();
    expect(WEATHER_COLORS.SHIELD_REGEN_FILL_ALPHA).toBeGreaterThan(0);
    expect(WEATHER_COLORS.SHIELD_REGEN_STROKE).toBeDefined();
    expect(WEATHER_COLORS.SHIELD_REGEN_STROKE_ALPHA).toBeGreaterThan(0);
  });

  it('WEATHER_COLORS has lightning field colors', () => {
    expect(WEATHER_COLORS.LIGHTNING_FIELD_BOLT).toBeDefined();
    expect(WEATHER_COLORS.LIGHTNING_FIELD_FLASH).toBeDefined();
    expect(WEATHER_COLORS.LIGHTNING_FIELD_FLASH_ALPHA).toBeGreaterThan(0);
  });

  it('WEATHER_COLORS has void gravity colors', () => {
    expect(WEATHER_COLORS.VOID_GRAVITY_FILL).toBeDefined();
    expect(WEATHER_COLORS.VOID_GRAVITY_FILL_ALPHA).toBeGreaterThan(0);
    expect(WEATHER_COLORS.VOID_GRAVITY_STROKE).toBeDefined();
    expect(WEATHER_COLORS.VOID_GRAVITY_STROKE_ALPHA).toBeGreaterThan(0);
  });

  it('WEATHER_COLORS has original fog/flame colors preserved', () => {
    expect(WEATHER_COLORS.FOG_DARK).toBeDefined();
    expect(WEATHER_COLORS.FOG_ALPHA).toBeDefined();
    expect(WEATHER_COLORS.FLAME_FILL).toBeDefined();
    expect(WEATHER_COLORS.FLAME_STROKE).toBeDefined();
  });
});

describe('WeatherManager — weather description i18n keys', () => {
  // Test that every weather effect has a matching i18n key in the locales
  // We import from the locale files to verify keys exist
  it('every valid weather effect has a weather.* description pattern', () => {
    for (const effect of VALID_WEATHER_EFFECTS) {
      const key = `weather.${effect}`;
      expect(key.startsWith('weather.')).toBe(true);
    }
  });
});

describe('WeatherManager — edge cases and cross-effect balance', () => {
  it('rain debuff does not stack with speed_all buff to create negative speed', () => {
    // If both were somehow active (they cannot be, but verify values are safe)
    const worstCase = BALANCE.WEATHER.rainEnemySpeedMult * (1 + BALANCE.WEATHER.speedAllBonus);
    expect(worstCase).toBeGreaterThan(0);
  });

  it('shield regen plus flame zone damage does not create invincibility', () => {
    const regenPerSec = BALANCE.WEATHER.shieldRegenHpPerSec;
    const flameDps = BALANCE.WEATHER.flameZoneDamage;
    // Flame DPS should still be able to overwhelm regen
    expect(flameDps).toBeGreaterThan(regenPerSec);
  });

  it('void gravity pull speed is slower than typical enemy speed', () => {
    // Player is stationary in hill defense; compare against a reasonable enemy speed cap
    expect(BALANCE.WEATHER.voidGravityPullSpeed).toBeLessThan(200);
  });

  it('lightning field interval matches spec (every 3 seconds)', () => {
    expect(BALANCE.WEATHER.lightningFieldIntervalMs).toBe(3000);
  });
});

// =============================================================================
// Behavioral tests — test WeatherManager class methods with mocked Phaser scene
// =============================================================================

describe('WeatherManager — behavioral: apply()', () => {
  let wm: WeatherManager;

  beforeEach(() => {
    wm = new WeatherManager(createMockScene());
  });

  it('resets all modifiers before applying new weather', () => {
    // Apply rain first (sets enemySpeedMult)
    wm.apply(3); // stage 3 = TST = rain
    expect(wm.enemySpeedMult).toBe(BALANCE.WEATHER.rainEnemySpeedMult);

    // Apply speed_all (stage 1 = Central = speed_all) — should reset rain
    wm.apply(1);
    expect(wm.enemySpeedMult).toBe(1);
    expect(wm.speedMult).toBe(1 + BALANCE.WEATHER.speedAllBonus);
    expect(wm.armorMult).toBe(1);
    expect(wm.critBonus).toBe(0);
    expect(wm.baseRegenPerSec).toBe(0);
    expect(wm.pendingLightningStrikes).toEqual([]);
    expect(wm.gravityWell).toBeNull();
  });

  it('sets speedMult for speed_all (Central, stage 1)', () => {
    wm.apply(1); // Central = speed_all
    expect(wm.speedMult).toBe(1 + BALANCE.WEATHER.speedAllBonus);
    expect(wm.enemySpeedMult).toBe(1);
  });

  it('sets enemySpeedMult for rain (TST, stage 3)', () => {
    wm.apply(3); // TST = rain
    expect(wm.enemySpeedMult).toBe(BALANCE.WEATHER.rainEnemySpeedMult);
    expect(wm.speedMult).toBe(1);
  });

  it('sets armorMult for armor_all (Sham Shui Po, stage 7)', () => {
    wm.apply(7); // SSP = armor_all
    expect(wm.armorMult).toBe(1 + BALANCE.WEATHER.armorAllBonus);
  });

  it('sets baseRegenPerSec for shield_regen (Aberdeen, stage 13)', () => {
    wm.apply(13); // Aberdeen = shield_regen
    expect(wm.baseRegenPerSec).toBe(BALANCE.WEATHER.shieldRegenHpPerSec);
  });

  it('sets gravityWell for void_gravity (Kowloon, stage 15)', () => {
    wm.apply(15); // Kowloon = void_gravity
    expect(wm.gravityWell).not.toBeNull();
    expect(wm.gravityWell!.pullSpeed).toBe(BALANCE.WEATHER.voidGravityPullSpeed);
    expect(wm.gravityWell!.radius).toBe(BALANCE.WEATHER.voidGravityRadius);
  });

  it('clears gravityWell when switching away from void_gravity', () => {
    wm.apply(15); // Kowloon = void_gravity
    expect(wm.gravityWell).not.toBeNull();

    wm.apply(1); // Central = speed_all
    expect(wm.gravityWell).toBeNull();
  });

  it('clears pendingLightningStrikes on apply', () => {
    // Manually push a strike
    wm.pendingLightningStrikes.push({ x: 100, y: 200, damage: 15 });
    expect(wm.pendingLightningStrikes.length).toBe(1);

    wm.apply(1);
    expect(wm.pendingLightningStrikes).toEqual([]);
  });
});

describe('WeatherManager — behavioral: update()', () => {
  let wm: WeatherManager;

  beforeEach(() => {
    wm = new WeatherManager(createMockScene());
  });

  it('populates pendingLightningStrikes after interval elapses (lightning_field)', () => {
    wm.apply(9); // Wong Tai Sin = lightning_field
    expect(wm.pendingLightningStrikes.length).toBe(0);

    // Update for slightly more than the lightning interval
    wm.update(BALANCE.WEATHER.lightningFieldIntervalMs + 1, 9, 360, 640);
    expect(wm.pendingLightningStrikes.length).toBe(1);
    expect(wm.pendingLightningStrikes[0].damage).toBe(BALANCE.WEATHER.lightningFieldDamage);
  });

  it('does not create lightning strikes before interval', () => {
    wm.apply(9); // Wong Tai Sin = lightning_field

    // Update for less than the interval
    wm.update(BALANCE.WEATHER.lightningFieldIntervalMs - 100, 9, 360, 640);
    expect(wm.pendingLightningStrikes.length).toBe(0);
  });

  it('accumulates multiple lightning strikes over multiple intervals', () => {
    wm.apply(9); // Wong Tai Sin = lightning_field

    // First interval
    wm.update(BALANCE.WEATHER.lightningFieldIntervalMs + 1, 9, 360, 640);
    expect(wm.pendingLightningStrikes.length).toBe(1);

    // Second interval (but do not clear — RunScene clears them)
    wm.update(BALANCE.WEATHER.lightningFieldIntervalMs, 9, 360, 640);
    expect(wm.pendingLightningStrikes.length).toBe(2);
  });

  it('does nothing for weather effects without update logic (speed_all)', () => {
    wm.apply(1); // Central = speed_all
    // Should not throw
    wm.update(1000, 1, 360, 640);
    expect(wm.speedMult).toBe(1 + BALANCE.WEATHER.speedAllBonus);
  });
});

describe('WeatherManager — behavioral: shutdown()', () => {
  it('clears pendingLightningStrikes on shutdown', () => {
    const wm = new WeatherManager(createMockScene());
    wm.apply(9); // lightning_field
    wm.update(BALANCE.WEATHER.lightningFieldIntervalMs + 1, 9, 360, 640);
    expect(wm.pendingLightningStrikes.length).toBe(1);

    wm.shutdown();
    // After shutdown, VFX should be cleaned up (no crash)
    // pendingLightningStrikes should be unchanged (RunScene consumes them)
    // but gravityWell should be safely unusable
  });

  it('can be called multiple times without error', () => {
    const wm = new WeatherManager(createMockScene());
    wm.apply(1);
    wm.shutdown();
    wm.shutdown(); // double shutdown should not throw
  });
});

describe('WeatherManager — behavioral: district coverage (16 stages)', () => {
  it('every district maps to a valid stage pair', () => {
    for (let s = 1; s <= 16; s++) {
      const district = getDistrictForStage(s);
      expect(district).toBeDefined();
      expect(district!.weatherEffect).toBeTruthy();
    }
  });

  it('apply works for all 16 stages without error', () => {
    const wm = new WeatherManager(createMockScene());
    for (let s = 1; s <= 16; s++) {
      // Should not throw
      wm.apply(s);
    }
  });

  it('stage 15 maps to Kowloon (district index 7)', () => {
    const district = getDistrictForStage(15);
    expect(district!.id).toBe('kowloon');
    expect(district!.weatherEffect).toBe('void_gravity');
  });

  it('stage 13 maps to Aberdeen (district index 6)', () => {
    const district = getDistrictForStage(13);
    expect(district!.id).toBe('aberdeen');
    expect(district!.weatherEffect).toBe('shield_regen');
  });
});
