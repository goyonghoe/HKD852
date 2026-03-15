import { describe, it, expect } from 'vitest';
import { getBossGlowParams, getEliteGlowParams, getStatusTint } from '../../src/core/PostFXCalc';

const MOCK_CONFIG = {
  bossGlowColor: 0xff4444,
  bossGlowDistance: 8,
  bossGlowQuality: 0.1,
  bossGlowOuterStrength: 2,
  bossGlowInnerStrength: 0.5,
  bossPhase2GlowColor: 0xff0000,
  bossPhase2GlowDistance: 12,
  bossPhase2GlowOuterStrength: 3,
  bossPhase2GlowInnerStrength: 1,
  eliteGlowColor: 0xffaa00,
  eliteGlowDistance: 4,
  eliteGlowQuality: 0.05,
  eliteGlowOuterStrength: 1.5,
  eliteGlowInnerStrength: 0.3,
  freezeTintColor: 0x4488ff,
  poisonTintColor: 0x44ff44,
  burnTintColor: 0xff6600,
};

describe('PostFXCalc', () => {
  describe('getBossGlowParams', () => {
    it('returns phase 1 glow for non-phase2 boss', () => {
      const params = getBossGlowParams(false, MOCK_CONFIG);
      expect(params.color).toBe(0xff4444);
      expect(params.distance).toBe(8);
      expect(params.outerStrength).toBe(2);
      expect(params.innerStrength).toBe(0.5);
    });

    it('returns stronger phase 2 glow', () => {
      const params = getBossGlowParams(true, MOCK_CONFIG);
      expect(params.color).toBe(0xff0000);
      expect(params.distance).toBe(12);
      expect(params.outerStrength).toBe(3);
      expect(params.innerStrength).toBe(1);
    });

    it('phase 2 has greater distance than phase 1', () => {
      const p1 = getBossGlowParams(false, MOCK_CONFIG);
      const p2 = getBossGlowParams(true, MOCK_CONFIG);
      expect(p2.distance).toBeGreaterThan(p1.distance);
      expect(p2.outerStrength).toBeGreaterThan(p1.outerStrength);
    });
  });

  describe('getEliteGlowParams', () => {
    it('returns elite glow with orange color', () => {
      const params = getEliteGlowParams(MOCK_CONFIG);
      expect(params.color).toBe(0xffaa00);
      expect(params.distance).toBe(4);
      expect(params.quality).toBe(0.05);
    });

    it('elite glow is weaker than boss glow', () => {
      const elite = getEliteGlowParams(MOCK_CONFIG);
      const boss = getBossGlowParams(false, MOCK_CONFIG);
      expect(elite.outerStrength).toBeLessThan(boss.outerStrength);
      expect(elite.distance).toBeLessThan(boss.distance);
    });
  });

  describe('getStatusTint', () => {
    it('returns freeze tint with blue color', () => {
      const tint = getStatusTint('freeze', MOCK_CONFIG);
      expect(tint.color).toBe(0x4488ff);
      expect(tint.alpha).toBe(0.5);
    });

    it('returns poison tint with green color', () => {
      const tint = getStatusTint('poison', MOCK_CONFIG);
      expect(tint.color).toBe(0x44ff44);
      expect(tint.alpha).toBe(0.4);
    });

    it('returns burn tint with orange color', () => {
      const tint = getStatusTint('burn', MOCK_CONFIG);
      expect(tint.color).toBe(0xff6600);
      expect(tint.alpha).toBe(0.6);
    });

    it('burn has highest alpha (most visible)', () => {
      const freeze = getStatusTint('freeze', MOCK_CONFIG);
      const poison = getStatusTint('poison', MOCK_CONFIG);
      const burn = getStatusTint('burn', MOCK_CONFIG);
      expect(burn.alpha).toBeGreaterThan(freeze.alpha);
      expect(burn.alpha).toBeGreaterThan(poison.alpha);
    });
  });
});
