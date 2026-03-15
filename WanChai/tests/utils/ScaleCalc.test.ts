import { describe, it, expect } from 'vitest';
import {
  MIN_TOUCH_TARGET_DP,
  BASE_WIDTH,
  BASE_HEIGHT,
  getDpiScale,
  dpToPhysical,
  meetsTouchTarget,
  getViewportScaleFactor,
  getEffectiveGameSize,
} from '../../src/utils/ScaleCalc';

describe('ScaleCalc — DPI-aware scaling', () => {
  it('MIN_TOUCH_TARGET_DP is 48', () => {
    expect(MIN_TOUCH_TARGET_DP).toBe(48);
  });

  it('BASE_WIDTH and BASE_HEIGHT match game design resolution', () => {
    expect(BASE_WIDTH).toBe(1280);
    expect(BASE_HEIGHT).toBe(720);
  });

  it('getDpiScale returns a positive number', () => {
    const scale = getDpiScale();
    expect(scale).toBeGreaterThan(0);
  });

  it('dpToPhysical multiplies by DPI scale', () => {
    const scale = getDpiScale();
    expect(dpToPhysical(48)).toBe(48 * scale);
    expect(dpToPhysical(100)).toBe(100 * scale);
  });

  it('meetsTouchTarget returns true for 48x48', () => {
    expect(meetsTouchTarget(48, 48)).toBe(true);
  });

  it('meetsTouchTarget returns false for 47x48 (width too small)', () => {
    expect(meetsTouchTarget(47, 48)).toBe(false);
  });

  it('meetsTouchTarget returns false for 48x47 (height too small)', () => {
    expect(meetsTouchTarget(48, 47)).toBe(false);
  });

  it('meetsTouchTarget returns true for 60x60 (above minimum)', () => {
    expect(meetsTouchTarget(60, 60)).toBe(true);
  });

  it('getViewportScaleFactor for exact match returns 1.0', () => {
    expect(getViewportScaleFactor(1280, 720)).toBe(1.0);
  });

  it('getViewportScaleFactor for 2x viewport returns 2.0', () => {
    expect(getViewportScaleFactor(2560, 1440)).toBe(2.0);
  });

  it('getViewportScaleFactor for wider aspect ratio is height-limited', () => {
    // 1920x720: scaleX=1.5, scaleY=1.0 → min = 1.0
    expect(getViewportScaleFactor(1920, 720)).toBe(1.0);
  });

  it('getViewportScaleFactor for taller aspect ratio is width-limited', () => {
    // 1280x1280: scaleX=1.0, scaleY=1.78 → min = 1.0
    expect(getViewportScaleFactor(1280, 1280)).toBe(1.0);
  });

  it('getViewportScaleFactor for half viewport returns 0.5', () => {
    expect(getViewportScaleFactor(640, 360)).toBe(0.5);
  });

  it('getEffectiveGameSize preserves aspect ratio', () => {
    const size = getEffectiveGameSize(1920, 1080);
    const ratio = size.width / size.height;
    expect(ratio).toBeCloseTo(16 / 9, 1);
  });

  it('getEffectiveGameSize for exact match returns base resolution', () => {
    const size = getEffectiveGameSize(1280, 720);
    expect(size.width).toBe(1280);
    expect(size.height).toBe(720);
  });

  it('getEffectiveGameSize for 2x returns double resolution', () => {
    const size = getEffectiveGameSize(2560, 1440);
    expect(size.width).toBe(2560);
    expect(size.height).toBe(1440);
  });
});
