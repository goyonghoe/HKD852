import { describe, it, expect } from 'vitest';
import {
  calculateWindDeflection,
  applyWindDeflectionToVelocity,
  getWindDeflectConfig,
  createEagleDiveState,
  tickEagleDive,
  getSpawnBoostMultiplier,
  shouldUseZigzag,
} from '../../src/core/BossAeroCalc';

describe('calculateWindDeflection', () => {
  const config = { angleDeg: 15, radius: 200 };

  it('returns 0 for projectile outside wind radius', () => {
    expect(calculateWindDeflection(500, 300, 200, 300, config, 0)).toBe(0);
  });

  it('returns 0 for laser (piercing 99)', () => {
    // Even if inside radius
    expect(calculateWindDeflection(200, 300, 200, 300, config, 99)).toBe(0);
  });

  it('returns non-zero for projectile inside wind radius', () => {
    const offset = calculateWindDeflection(250, 310, 200, 300, config, 0);
    expect(offset).not.toBe(0);
  });

  it('deflection is stronger when closer to boss', () => {
    const close = Math.abs(calculateWindDeflection(210, 310, 200, 300, config, 0));
    const far = Math.abs(calculateWindDeflection(390, 310, 200, 300, config, 0));
    expect(close).toBeGreaterThan(far);
  });

  it('returns exactly 0 at the radius boundary', () => {
    // Exactly at radius = 200 px away
    const offset = calculateWindDeflection(400, 300, 200, 300, config, 0);
    expect(offset).toBe(0);
  });

  it('direction depends on Y relative to boss', () => {
    const above = calculateWindDeflection(250, 290, 200, 300, config, 0);
    const below = calculateWindDeflection(250, 310, 200, 300, config, 0);
    // Above boss → negative sign, below boss → positive sign
    expect(above * below).toBeLessThan(0);
  });

  it('high piercing below 99 still gets deflected', () => {
    const offset = calculateWindDeflection(250, 310, 200, 300, config, 5);
    expect(offset).not.toBe(0);
  });
});

describe('applyWindDeflectionToVelocity', () => {
  it('returns unchanged velocity for 0 offset', () => {
    const result = applyWindDeflectionToVelocity(100, 0, 0);
    expect(result.vx).toBe(100);
    expect(result.vy).toBe(0);
  });

  it('rotates velocity by angle offset', () => {
    // 90 degree rotation
    const result = applyWindDeflectionToVelocity(100, 0, Math.PI / 2);
    expect(result.vx).toBeCloseTo(0, 5);
    expect(result.vy).toBeCloseTo(100, 5);
  });

  it('preserves speed magnitude', () => {
    const vx = 300;
    const vy = -100;
    const speed = Math.sqrt(vx * vx + vy * vy);
    const result = applyWindDeflectionToVelocity(vx, vy, 0.3);
    const newSpeed = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(newSpeed).toBeCloseTo(speed, 5);
  });
});

describe('getWindDeflectConfig', () => {
  it('returns Phase 1 config for phase 1', () => {
    const cfg = getWindDeflectConfig(1, 15, 200, 25, 250);
    expect(cfg.angleDeg).toBe(15);
    expect(cfg.radius).toBe(200);
  });

  it('returns Phase 1 config for phase 2 (same deflection)', () => {
    const cfg = getWindDeflectConfig(2, 15, 200, 25, 250);
    expect(cfg.angleDeg).toBe(15);
    expect(cfg.radius).toBe(200);
  });

  it('returns Phase 3 enhanced config', () => {
    const cfg = getWindDeflectConfig(3, 15, 200, 25, 250);
    expect(cfg.angleDeg).toBe(25);
    expect(cfg.radius).toBe(250);
  });
});

describe('Eagle Dive state machine', () => {
  it('creates initial state with no active dive', () => {
    const state = createEagleDiveState();
    expect(state.timer).toBe(0);
    expect(state.active).toBe(false);
    expect(state.remainingMs).toBe(0);
  });

  it('accumulates timer without triggering before interval', () => {
    const state = createEagleDiveState();
    const result = tickEagleDive(state, 5000, 10000, 3000);
    expect(result.state.timer).toBe(5000);
    expect(result.diveStarted).toBe(false);
    expect(result.state.active).toBe(false);
  });

  it('triggers dive at interval', () => {
    const state = { timer: 9000, active: false, remainingMs: 0 };
    const result = tickEagleDive(state, 1000, 10000, 3000);
    expect(result.diveStarted).toBe(true);
    expect(result.state.active).toBe(true);
    expect(result.state.remainingMs).toBe(3000);
    expect(result.state.timer).toBe(0);
  });

  it('counts down during active dive', () => {
    const state = { timer: 0, active: true, remainingMs: 3000 };
    const result = tickEagleDive(state, 1000, 10000, 3000);
    expect(result.state.active).toBe(true);
    expect(result.state.remainingMs).toBe(2000);
    expect(result.diveStarted).toBe(false);
    expect(result.diveEnded).toBe(false);
  });

  it('ends dive when duration expires', () => {
    const state = { timer: 0, active: true, remainingMs: 500 };
    const result = tickEagleDive(state, 600, 10000, 3000);
    expect(result.state.active).toBe(false);
    expect(result.diveEnded).toBe(true);
    expect(result.state.timer).toBe(0);
  });

  it('full cycle: idle → trigger → active → end → idle', () => {
    let state = createEagleDiveState();

    // Tick to near interval
    let r = tickEagleDive(state, 9500, 10000, 3000);
    state = r.state;
    expect(r.diveStarted).toBe(false);

    // Trigger dive
    r = tickEagleDive(state, 600, 10000, 3000);
    state = r.state;
    expect(r.diveStarted).toBe(true);
    expect(state.active).toBe(true);

    // During dive
    r = tickEagleDive(state, 2000, 10000, 3000);
    state = r.state;
    expect(state.active).toBe(true);

    // End dive
    r = tickEagleDive(state, 1500, 10000, 3000);
    state = r.state;
    expect(r.diveEnded).toBe(true);
    expect(state.active).toBe(false);

    // Back to idle accumulation
    r = tickEagleDive(state, 5000, 10000, 3000);
    expect(r.state.timer).toBe(5000);
  });
});

describe('getSpawnBoostMultiplier', () => {
  it('returns 1.0 for Phase 1', () => {
    expect(getSpawnBoostMultiplier(1, 1.5)).toBe(1);
  });

  it('returns boost for Phase 2', () => {
    expect(getSpawnBoostMultiplier(2, 1.5)).toBe(1.5);
  });

  it('returns boost for Phase 3', () => {
    expect(getSpawnBoostMultiplier(3, 1.5)).toBe(1.5);
  });
});

describe('shouldUseZigzag', () => {
  it('returns false for Phase 1 and 2', () => {
    expect(shouldUseZigzag(1)).toBe(false);
    expect(shouldUseZigzag(2)).toBe(false);
  });

  it('returns true for Phase 3', () => {
    expect(shouldUseZigzag(3)).toBe(true);
  });
});
