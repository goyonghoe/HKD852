/**
 * TASK-126: BossFreedomCalc — pure function tests.
 * Tests boss-critter mapping and balance config for liberation VFX.
 * No Phaser imports.
 */
import { describe, it, expect } from 'vitest';
import { getBossCritterInfo } from '../../src/utils/BossCritterMap';
import { BALANCE } from '../../src/config/balance';
import { ELEMENT, BOSS_FREEDOM_COLORS } from '../../src/config/colors';

// =======================================================================
// 1. Boss-Critter Mapping
// =======================================================================
describe('getBossCritterInfo', () => {
  it('returns Wind/Eagle for stage 2 (Central boss)', () => {
    const info = getBossCritterInfo(2);
    expect(info.element).toBe('WIND');
    expect(info.color).toBe(ELEMENT.WIND);
    expect(info.animalName).toBe('Eagle');
  });

  it('returns Water/Sea Dragon for stage 4 (Tsim Sha Tsui boss)', () => {
    const info = getBossCritterInfo(4);
    expect(info.element).toBe('WATER');
    expect(info.color).toBe(ELEMENT.WATER);
    expect(info.animalName).toBe('Sea Dragon');
  });

  it('returns Fire/Phoenix for stage 6 (Mong Kok boss)', () => {
    const info = getBossCritterInfo(6);
    expect(info.element).toBe('FIRE');
    expect(info.color).toBe(ELEMENT.FIRE);
    expect(info.animalName).toBe('Phoenix');
  });

  it('returns Earth/Pangolin for stage 8 (Sham Shui Po boss)', () => {
    const info = getBossCritterInfo(8);
    expect(info.element).toBe('EARTH');
    expect(info.color).toBe(ELEMENT.EARTH);
    expect(info.animalName).toBe('Pangolin');
  });

  it('returns Light/Lion for stage 10 (Wong Tai Sin boss)', () => {
    const info = getBossCritterInfo(10);
    expect(info.element).toBe('LIGHT');
    expect(info.color).toBe(ELEMENT.LIGHT);
    expect(info.animalName).toBe('Lion');
  });

  it('returns Dark/Bat for stage 12 (Lantau boss)', () => {
    const info = getBossCritterInfo(12);
    expect(info.element).toBe('DARK');
    expect(info.color).toBe(ELEMENT.DARK);
    expect(info.animalName).toBe('Bat');
  });

  it('returns Water/Sea Turtle for stage 14 (Aberdeen boss)', () => {
    const info = getBossCritterInfo(14);
    expect(info.element).toBe('WATER');
    expect(info.color).toBe(ELEMENT.WATER);
    expect(info.animalName).toBe('Sea Turtle');
  });

  it('returns Dark/Shadow Wolf for stage 16 (Kowloon boss)', () => {
    const info = getBossCritterInfo(16);
    expect(info.element).toBe('DARK');
    expect(info.color).toBe(ELEMENT.DARK);
    expect(info.animalName).toBe('Shadow Wolf');
  });

  it('returns default Light/Spirit for unmapped stages', () => {
    const info = getBossCritterInfo(99);
    expect(info.element).toBe('LIGHT');
    expect(info.color).toBe(ELEMENT.LIGHT);
    expect(info.animalName).toBe('Spirit');
  });

  it('returns default for odd (wave) stages', () => {
    const info = getBossCritterInfo(1);
    expect(info.animalName).toBe('Spirit');
  });
});

// =======================================================================
// 2. BOSS_FREEDOM balance config
// =======================================================================
describe('BOSS_FREEDOM balance config', () => {
  const cfg = BALANCE.BOSS_FREEDOM;

  it('totalMs equals explosionMs + riseDurationMs + fadeDurationMs', () => {
    expect(cfg.totalMs).toBe(cfg.explosionMs + cfg.riseDurationMs + cfg.fadeDurationMs);
  });

  it('totalMs is 5000ms (5 seconds)', () => {
    expect(cfg.totalMs).toBe(5000);
  });

  it('explosionMs is 1000ms', () => {
    expect(cfg.explosionMs).toBe(1000);
  });

  it('riseDurationMs is 2000ms', () => {
    expect(cfg.riseDurationMs).toBe(2000);
  });

  it('fadeDurationMs is 2000ms', () => {
    expect(cfg.fadeDurationMs).toBe(2000);
  });

  it('particleCount is 12', () => {
    expect(cfg.particleCount).toBe(12);
  });

  it('debrisCount is 8', () => {
    expect(cfg.debrisCount).toBe(8);
  });

  it('explosionShakeIntensity is positive', () => {
    expect(cfg.explosionShakeIntensity).toBeGreaterThan(0);
  });

  it('riseHeightPx is positive', () => {
    expect(cfg.riseHeightPx).toBeGreaterThan(0);
  });

  it('flashAlpha is between 0 and 1', () => {
    expect(cfg.flashAlpha).toBeGreaterThan(0);
    expect(cfg.flashAlpha).toBeLessThanOrEqual(1);
  });
});

// =======================================================================
// 3. BOSS_FREEDOM_COLORS
// =======================================================================
describe('BOSS_FREEDOM_COLORS', () => {
  it('has all required color keys', () => {
    expect(BOSS_FREEDOM_COLORS.DEBRIS_DARK).toBeDefined();
    expect(BOSS_FREEDOM_COLORS.DEBRIS_LIGHT).toBeDefined();
    expect(BOSS_FREEDOM_COLORS.GLOW_CORE).toBeDefined();
    expect(BOSS_FREEDOM_COLORS.GLOW_RING).toBeDefined();
  });

  it('GLOW_CORE is white', () => {
    expect(BOSS_FREEDOM_COLORS.GLOW_CORE).toBe(0xffffff);
  });
});

// =======================================================================
// 4. All 8 boss stages have valid critter mappings
// =======================================================================
describe('All boss stages mapped', () => {
  const bossStages = [2, 4, 6, 8, 10, 12, 14, 16];

  it.each(bossStages)('stage %i has a non-default critter mapping', (stage) => {
    const info = getBossCritterInfo(stage);
    expect(info.animalName).not.toBe('Spirit');
    expect(info.color).toBeDefined();
    expect(info.element).toBeDefined();
  });
});
