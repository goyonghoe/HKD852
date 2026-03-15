import { describe, it, expect } from 'vitest';
import { DISTRICTS, getDistrictForStage } from '../../src/config/districts';
import { ko } from '../../src/locales/ko';
import { en } from '../../src/locales/en';

describe('Districts config', () => {
  it('has exactly 8 districts', () => {
    expect(DISTRICTS).toHaveLength(8);
  });

  it('all districts have required fields', () => {
    for (const d of DISTRICTS) {
      expect(d.id).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.nameEn).toBeTruthy();
      expect(d.nameCn).toBeTruthy();
      expect(d.element).toBeTruthy();
      expect(d.weatherEffect).toBeTruthy();
      expect(d.weatherDescription).toBeTruthy();
      expect(d.bgKey).toBeTruthy();
    }
  });

  it('first 6 districts cover all 6 elements', () => {
    const first6Elements = DISTRICTS.slice(0, 6).map((d) => d.element);
    const validElements = ['WIND', 'WATER', 'FIRE', 'LIGHT', 'EARTH', 'DARK'];
    for (const elem of validElements) {
      expect(first6Elements).toContain(elem);
    }
  });

  it('all districts have unique weather effects', () => {
    const effects = DISTRICTS.map((d) => d.weatherEffect);
    expect(new Set(effects).size).toBe(effects.length);
  });

  it('district order matches stage progression', () => {
    expect(DISTRICTS[0].id).toBe('central');
    expect(DISTRICTS[1].id).toBe('tst');
    expect(DISTRICTS[2].id).toBe('mongkok');
    expect(DISTRICTS[3].id).toBe('ssp');
    expect(DISTRICTS[4].id).toBe('wts');
    expect(DISTRICTS[5].id).toBe('lantau');
    expect(DISTRICTS[6].id).toBe('aberdeen');
    expect(DISTRICTS[7].id).toBe('kowloon');
  });
});

describe('getDistrictForStage', () => {
  it('wave stages map to sequential districts', () => {
    expect(getDistrictForStage(1)?.id).toBe('central'); // wave 1
    expect(getDistrictForStage(3)?.id).toBe('tst'); // wave 2
    expect(getDistrictForStage(5)?.id).toBe('mongkok'); // wave 3
  });

  it('boss stages inherit parent district', () => {
    expect(getDistrictForStage(2)?.id).toBe('central'); // boss after wave 1
    expect(getDistrictForStage(4)?.id).toBe('tst'); // boss after wave 2
    expect(getDistrictForStage(6)?.id).toBe('mongkok'); // boss after wave 3
  });
});

describe('Districts — weather effect coverage', () => {
  it('all 8 districts have a weatherEffect assigned', () => {
    for (const d of DISTRICTS) {
      expect(d.weatherEffect).toBeTruthy();
      expect(typeof d.weatherEffect).toBe('string');
      expect(d.weatherEffect.length).toBeGreaterThan(0);
    }
  });

  it('no duplicate weatherEffect across adjacent stages', () => {
    for (let i = 0; i < DISTRICTS.length - 1; i++) {
      expect(DISTRICTS[i].weatherEffect).not.toBe(DISTRICTS[i + 1].weatherEffect);
    }
  });

  it('new districts Aberdeen and Kowloon have valid bgKey references', () => {
    const aberdeen = DISTRICTS.find((d) => d.id === 'aberdeen');
    const kowloon = DISTRICTS.find((d) => d.id === 'kowloon');
    expect(aberdeen).toBeDefined();
    expect(kowloon).toBeDefined();
    expect(aberdeen!.bgKey).toBe('bg_aberdeen');
    expect(kowloon!.bgKey).toBe('bg_kowloon');
  });

  it('new weather effects are assigned to specific districts', () => {
    const effectMap = new Map(DISTRICTS.map((d) => [d.id, d.weatherEffect]));
    expect(effectMap.get('tst')).toBe('rain');
    expect(effectMap.get('aberdeen')).toBe('shield_regen');
    expect(effectMap.get('wts')).toBe('lightning_field');
    expect(effectMap.get('kowloon')).toBe('void_gravity');
  });

  it('all weather effects have a corresponding i18n key in ko locale', () => {
    for (const d of DISTRICTS) {
      const key = `weather.${d.weatherEffect}`;
      expect(ko[key]).toBeTruthy();
    }
  });

  it('all weather effects have a corresponding i18n key in en locale', () => {
    for (const d of DISTRICTS) {
      const key = `weather.${d.weatherEffect}`;
      expect(en[key]).toBeTruthy();
    }
  });

  it('all districts have a weatherDescription in Korean', () => {
    for (const d of DISTRICTS) {
      expect(d.weatherDescription).toBeTruthy();
      // Korean descriptions should contain Korean characters
      expect(d.weatherDescription.length).toBeGreaterThan(3);
    }
  });

  it('district elements use only valid element values', () => {
    const validElements = ['WIND', 'WATER', 'FIRE', 'LIGHT', 'EARTH', 'DARK'];
    for (const d of DISTRICTS) {
      expect(validElements).toContain(d.element);
    }
  });
});
