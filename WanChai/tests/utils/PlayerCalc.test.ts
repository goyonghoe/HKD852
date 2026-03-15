import { describe, it, expect } from 'vitest';
import { aimAtAngle, addUltimateGauge, consumeUltimate } from '../../src/utils/PlayerCalc';

// ── aimAtAngle ──

describe('aimAtAngle', () => {
  const MAX_DEG = 15;
  const MAX_RAD = (MAX_DEG * Math.PI) / 180;

  // Helper: player is at origin for simplicity
  const px = 0;
  const py = 0;

  it('target directly above returns ~0 (straight ahead)', () => {
    // Target above means negative Y (screen coords: up = smaller Y)
    const result = aimAtAngle(px, py, 0, -100, MAX_DEG);
    expect(result).toBeCloseTo(0, 5);
  });

  it('target slightly to the right returns positive rotation', () => {
    const result = aimAtAngle(px, py, 50, -200, MAX_DEG);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(MAX_RAD + 1e-10);
  });

  it('target slightly to the left returns negative rotation', () => {
    const result = aimAtAngle(px, py, -50, -200, MAX_DEG);
    expect(result).toBeLessThan(0);
    expect(result).toBeGreaterThanOrEqual(-MAX_RAD - 1e-10);
  });

  it('target far right is clamped to +maxAimDeg', () => {
    // Target directly to the right — raw angle would be PI/2 + PI/2 = PI
    const result = aimAtAngle(px, py, 1000, 0, MAX_DEG);
    expect(result).toBeCloseTo(MAX_RAD, 5);
  });

  it('target far left is clamped to -maxAimDeg', () => {
    const result = aimAtAngle(px, py, -1000, 0, MAX_DEG);
    expect(result).toBeCloseTo(-MAX_RAD, 5);
  });

  it('target directly below is clamped (behind turret)', () => {
    // Target below = positive Y direction, which is "behind" the turret
    const result = aimAtAngle(px, py, 0, 100, MAX_DEG);
    // Should clamp — the raw angle would wrap around to PI
    // The normalization wraps it, and it gets clamped
    const absResult = Math.abs(result);
    expect(absResult).toBeLessThanOrEqual(MAX_RAD + 1e-10);
  });

  it('target at 45 degrees up-right is clamped to maxAimDeg', () => {
    // atan2(-100, 100) = -PI/4, raw = -PI/4 + PI/2 = PI/4 ≈ 0.785
    // PI/4 > 15deg (0.262) so clamped
    const result = aimAtAngle(px, py, 100, -100, MAX_DEG);
    expect(result).toBeCloseTo(MAX_RAD, 5);
  });

  it('target at 45 degrees up-left is clamped to -maxAimDeg', () => {
    const result = aimAtAngle(px, py, -100, -100, MAX_DEG);
    expect(result).toBeCloseTo(-MAX_RAD, 5);
  });

  it('maxAimDeg of 0 always returns 0', () => {
    const result = aimAtAngle(px, py, 100, -100, 0);
    expect(result).toBeCloseTo(0, 5);
  });

  it('maxAimDeg of 90 allows full range', () => {
    const max90 = (90 * Math.PI) / 180;
    const result = aimAtAngle(px, py, 100, -100, 90);
    // atan2(-100, 100) + PI/2 = -PI/4 + PI/2 = PI/4
    expect(result).toBeCloseTo(Math.PI / 4, 5);
    expect(Math.abs(result)).toBeLessThanOrEqual(max90 + 1e-10);
  });

  it('maxAimDeg of 180 allows behind', () => {
    const result = aimAtAngle(px, py, 0, 100, 180);
    // Target directly below: atan2(100,0) = PI/2, raw = PI/2 + PI/2 = PI
    // Normalized to [-PI, PI] → PI or close to PI
    // Since maxRad = PI, no clamping
    expect(Math.abs(result)).toBeLessThanOrEqual(Math.PI + 1e-10);
  });

  it('same position target returns 0 (atan2(0,0)=0, raw=PI/2, normalized wraps)', () => {
    // atan2(0,0) = 0, rawRot = PI/2 ≈ 1.57
    // normalized: (PI/2 + PI) % 2PI - PI = PI/2
    // clamped to maxRad=0.262 → 0.262
    const result = aimAtAngle(px, py, 0, 0, MAX_DEG);
    expect(result).toBeCloseTo(MAX_RAD, 5);
  });

  it('works with non-origin player position', () => {
    // Player at (360, 1200), target directly above
    const result = aimAtAngle(360, 1200, 360, 100, MAX_DEG);
    expect(result).toBeCloseTo(0, 5);
  });

  it('non-origin player with target to the right', () => {
    const result = aimAtAngle(360, 1200, 460, 1100, MAX_DEG);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(MAX_RAD + 1e-10);
  });

  it('non-origin player with target to the left', () => {
    const result = aimAtAngle(360, 1200, 260, 1100, MAX_DEG);
    expect(result).toBeLessThan(0);
    expect(result).toBeGreaterThanOrEqual(-MAX_RAD - 1e-10);
  });

  it('very small angle within range is preserved', () => {
    // Target very slightly right and high above
    // atan2(-1000, 1) + PI/2 ≈ -PI/2 + PI/2 ≈ 0.001
    const result = aimAtAngle(px, py, 1, -1000, MAX_DEG);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(MAX_RAD);
  });

  it('symmetry: left and right targets at same offset give opposite signs', () => {
    const right = aimAtAngle(px, py, 20, -200, MAX_DEG);
    const left = aimAtAngle(px, py, -20, -200, MAX_DEG);
    expect(right).toBeCloseTo(-left, 4);
    expect(right).toBeGreaterThan(0);
    expect(left).toBeLessThan(0);
  });

  it('result is always within [-maxRad, maxRad]', () => {
    const cases = [
      [100, -100],
      [-100, -100],
      [0, -100],
      [100, 0],
      [-100, 0],
      [0, 100],
      [100, 100],
      [-100, 100],
    ];
    for (const [tx, ty] of cases) {
      const result = aimAtAngle(px, py, tx, ty, MAX_DEG);
      expect(result).toBeGreaterThanOrEqual(-MAX_RAD - 1e-10);
      expect(result).toBeLessThanOrEqual(MAX_RAD + 1e-10);
    }
  });
});

// ── addUltimateGauge ──

describe('addUltimateGauge', () => {
  const MAX = 100;

  it('adds amount from 0', () => {
    const result = addUltimateGauge(0, 10, MAX);
    expect(result.gauge).toBe(10);
    expect(result.ready).toBe(false);
  });

  it('adds to existing gauge', () => {
    const result = addUltimateGauge(50, 20, MAX);
    expect(result.gauge).toBe(70);
    expect(result.ready).toBe(false);
  });

  it('caps at max (overflow)', () => {
    const result = addUltimateGauge(90, 20, MAX);
    expect(result.gauge).toBe(MAX);
    expect(result.ready).toBe(true);
  });

  it('exact fill to max', () => {
    const result = addUltimateGauge(80, 20, MAX);
    expect(result.gauge).toBe(MAX);
    expect(result.ready).toBe(true);
  });

  it('ready is true when gauge equals max', () => {
    const result = addUltimateGauge(99, 1, MAX);
    expect(result.gauge).toBe(MAX);
    expect(result.ready).toBe(true);
  });

  it('ready is false when just under max', () => {
    const result = addUltimateGauge(98, 1, MAX);
    expect(result.gauge).toBe(99);
    expect(result.ready).toBe(false);
  });

  it('adding 0 does not change gauge', () => {
    const result = addUltimateGauge(50, 0, MAX);
    expect(result.gauge).toBe(50);
    expect(result.ready).toBe(false);
  });

  it('adding to already-full gauge stays at max', () => {
    const result = addUltimateGauge(MAX, 10, MAX);
    expect(result.gauge).toBe(MAX);
    expect(result.ready).toBe(true);
  });

  it('works with small max', () => {
    const result = addUltimateGauge(0, 5, 5);
    expect(result.gauge).toBe(5);
    expect(result.ready).toBe(true);
  });

  it('works with float amounts', () => {
    const result = addUltimateGauge(0.5, 0.3, 1.0);
    expect(result.gauge).toBeCloseTo(0.8, 10);
    expect(result.ready).toBe(false);
  });

  it('float overflow caps correctly', () => {
    const result = addUltimateGauge(0.9, 0.5, 1.0);
    expect(result.gauge).toBe(1.0);
    expect(result.ready).toBe(true);
  });

  it('large single addition is capped', () => {
    const result = addUltimateGauge(0, 500, MAX);
    expect(result.gauge).toBe(MAX);
    expect(result.ready).toBe(true);
  });

  it('sequential fills work correctly', () => {
    let state = addUltimateGauge(0, 25, MAX);
    state = addUltimateGauge(state.gauge, 25, MAX);
    state = addUltimateGauge(state.gauge, 25, MAX);
    expect(state.gauge).toBe(75);
    expect(state.ready).toBe(false);
    state = addUltimateGauge(state.gauge, 25, MAX);
    expect(state.gauge).toBe(MAX);
    expect(state.ready).toBe(true);
  });
});

// ── consumeUltimate ──

describe('consumeUltimate', () => {
  const MAX = 100;

  it('consume when ready', () => {
    const result = consumeUltimate(MAX, true, MAX);
    expect(result.consumed).toBe(true);
    expect(result.gauge).toBe(0);
    expect(result.ready).toBe(false);
  });

  it('fails when not ready (gauge 0)', () => {
    const result = consumeUltimate(0, false, MAX);
    expect(result.consumed).toBe(false);
    expect(result.gauge).toBe(0);
    expect(result.ready).toBe(false);
  });

  it('fails when not ready (gauge partially filled)', () => {
    const result = consumeUltimate(50, false, MAX);
    expect(result.consumed).toBe(false);
    expect(result.gauge).toBe(50);
    expect(result.ready).toBe(false);
  });

  it('state after consume: gauge is 0 and not ready', () => {
    const result = consumeUltimate(MAX, true, MAX);
    expect(result.gauge).toBe(0);
    expect(result.ready).toBe(false);
    expect(result.consumed).toBe(true);
  });

  it('cannot consume twice in a row', () => {
    const first = consumeUltimate(MAX, true, MAX);
    expect(first.consumed).toBe(true);
    const second = consumeUltimate(first.gauge, first.ready, MAX);
    expect(second.consumed).toBe(false);
    expect(second.gauge).toBe(0);
  });

  it('can consume again after refilling', () => {
    const consumed = consumeUltimate(MAX, true, MAX);
    const refilled = addUltimateGauge(consumed.gauge, MAX, MAX);
    const second = consumeUltimate(refilled.gauge, refilled.ready, MAX);
    expect(second.consumed).toBe(true);
    expect(second.gauge).toBe(0);
  });

  it('ready=true but gauge is 0 still consumes (trusts ready flag)', () => {
    // Edge case: if ready is true but gauge was somehow 0
    const result = consumeUltimate(0, true, MAX);
    expect(result.consumed).toBe(true);
    expect(result.gauge).toBe(0);
    expect(result.ready).toBe(false);
  });

  it('preserves gauge when not ready', () => {
    const result = consumeUltimate(75, false, MAX);
    expect(result.gauge).toBe(75);
  });

  it('preserves ready=false when not ready', () => {
    const result = consumeUltimate(75, false, MAX);
    expect(result.ready).toBe(false);
  });

  it('full cycle: empty -> fill -> consume -> empty', () => {
    // Start empty
    let state = { gauge: 0, ready: false };
    // Fill
    state = addUltimateGauge(state.gauge, MAX, MAX);
    expect(state.ready).toBe(true);
    // Consume
    const consumed = consumeUltimate(state.gauge, state.ready, MAX);
    expect(consumed.consumed).toBe(true);
    expect(consumed.gauge).toBe(0);
    expect(consumed.ready).toBe(false);
  });
});
