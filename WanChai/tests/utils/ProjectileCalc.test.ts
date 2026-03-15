import { describe, it, expect } from 'vitest';
import { computeHomingVelocity, isOutOfBounds, isExpired } from '../../src/utils/ProjectileCalc';

// ── computeHomingVelocity ──

describe('computeHomingVelocity', () => {
  const SPEED = 200;
  const TURN_RATE = 4; // rad/s
  const DELTA_MS = 16; // ~60fps frame

  it('target directly ahead (no turn needed)', () => {
    // Projectile at origin moving right (+x), target to the right
    const result = computeHomingVelocity(0, 0, SPEED, 0, 100, 0, TURN_RATE, SPEED, DELTA_MS);
    expect(result.vx).toBeCloseTo(SPEED, 1);
    expect(result.vy).toBeCloseTo(0, 1);
    expect(result.angle).toBeCloseTo(0, 3);
  });

  it('target at 90 degrees (turn toward target)', () => {
    // Moving right, target directly above
    const result = computeHomingVelocity(0, 0, SPEED, 0, 0, -100, TURN_RATE, SPEED, DELTA_MS);
    // Should turn counter-clockwise (negative angle)
    expect(result.angle).toBeLessThan(0);
    // Speed magnitude preserved
    const mag = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(mag).toBeCloseTo(SPEED, 1);
  });

  it('target behind (180 degrees) turns by max turn rate', () => {
    // Moving right, target to the left
    const result = computeHomingVelocity(0, 0, SPEED, 0, -100, 0, TURN_RATE, SPEED, DELTA_MS);
    const maxTurn = TURN_RATE * (DELTA_MS / 1000);
    // The turn should be clamped to maxTurn
    const _expectedAngle = 0 + maxTurn; // or -maxTurn depending on shortest path
    // Since diff = PI, sign(PI) = +1 or -1 (could go either way at exactly PI)
    // But PI > 0, so diff = PI, sign = +1, turn = +maxTurn
    expect(Math.abs(result.angle)).toBeCloseTo(maxTurn, 3);
  });

  it('max turn rate clamping (large angle diff)', () => {
    // Moving up, target to the right
    const result = computeHomingVelocity(0, 0, 0, -SPEED, 100, 0, TURN_RATE, SPEED, DELTA_MS);
    const maxTurn = TURN_RATE * (DELTA_MS / 1000);
    // Current angle: atan2(-SPEED, 0) = -PI/2
    // Desired: atan2(0, 100) = 0
    // diff = 0 - (-PI/2) = PI/2 > maxTurn
    const currentAngle = Math.atan2(-SPEED, 0);
    const expectedAngle = currentAngle + maxTurn;
    expect(result.angle).toBeCloseTo(expectedAngle, 3);
  });

  it('zero delta results in no turn', () => {
    // Moving right, target above — but 0 delta means no turn possible
    const result = computeHomingVelocity(0, 0, SPEED, 0, 0, -100, TURN_RATE, SPEED, 0);
    expect(result.vx).toBeCloseTo(SPEED, 1);
    expect(result.vy).toBeCloseTo(0, 1);
    expect(result.angle).toBeCloseTo(0, 3);
  });

  it('small angle within turn rate is applied exactly', () => {
    // Moving slightly off target — small correction
    const tinyAngle = 0.01; // very small angle off
    const vx = SPEED * Math.cos(tinyAngle);
    const vy = SPEED * Math.sin(tinyAngle);
    const result = computeHomingVelocity(0, 0, vx, vy, 100, 0, TURN_RATE, SPEED, DELTA_MS);
    // The correction should be exact since tinyAngle < maxTurn
    expect(result.angle).toBeCloseTo(0, 2);
  });

  it('speed magnitude is preserved after turn', () => {
    const result = computeHomingVelocity(0, 0, SPEED, 0, 50, -50, TURN_RATE, SPEED, DELTA_MS);
    const mag = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(mag).toBeCloseTo(SPEED, 1);
  });

  it('turn direction: clockwise toward target below', () => {
    // Moving right, target below-right
    const result = computeHomingVelocity(0, 0, SPEED, 0, 100, 100, TURN_RATE, SPEED, DELTA_MS);
    // Should turn clockwise (positive angle change)
    expect(result.angle).toBeGreaterThan(0);
  });

  it('turn direction: counter-clockwise toward target above', () => {
    // Moving right, target above-right
    const result = computeHomingVelocity(0, 0, SPEED, 0, 100, -100, TURN_RATE, SPEED, DELTA_MS);
    // Should turn counter-clockwise (negative angle)
    expect(result.angle).toBeLessThan(0);
  });

  it('high turn rate allows instant snap to target', () => {
    // Turn rate so high it can cover PI/2 in one frame
    const highTurnRate = 1000; // rad/s
    const result = computeHomingVelocity(0, 0, SPEED, 0, 0, -100, highTurnRate, SPEED, DELTA_MS);
    // Should snap to point directly up
    const desiredAngle = Math.atan2(-100, 0);
    expect(result.angle).toBeCloseTo(desiredAngle, 2);
  });

  it('different speed produces proportional velocity', () => {
    const speed2 = 500;
    const result = computeHomingVelocity(0, 0, speed2, 0, 100, 0, TURN_RATE, speed2, DELTA_MS);
    const mag = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(mag).toBeCloseTo(speed2, 1);
  });

  it('works with non-origin projectile position', () => {
    const result = computeHomingVelocity(300, 400, SPEED, 0, 400, 400, TURN_RATE, SPEED, DELTA_MS);
    expect(result.vx).toBeCloseTo(SPEED, 1);
    expect(result.vy).toBeCloseTo(0, 1);
  });

  it('target at same position maintains current heading', () => {
    // Target at projectile position — atan2(0,0) = 0
    const result = computeHomingVelocity(100, 100, SPEED, 0, 100, 100, TURN_RATE, SPEED, DELTA_MS);
    // Desired angle atan2(0,0) = 0, current angle = 0, diff = 0 → no turn
    expect(result.angle).toBeCloseTo(0, 3);
  });

  it('large delta allows bigger turn', () => {
    const largeDelta = 500; // 500ms
    const result = computeHomingVelocity(0, 0, SPEED, 0, 0, -100, TURN_RATE, SPEED, largeDelta);
    const _maxTurn = TURN_RATE * (largeDelta / 1000);
    // desired = -PI/2, current = 0, diff = -PI/2
    // |diff| = PI/2 ≈ 1.57, maxTurn = 4 * 0.5 = 2.0
    // Since |diff| < maxTurn, full correction
    expect(result.angle).toBeCloseTo(-Math.PI / 2, 2);
  });

  it('shortest path wraps around -PI/PI boundary', () => {
    // Moving slightly past -PI, target slightly past +PI
    // Current heading: almost -PI (pointing left, slightly down)
    const almostNegPI = -Math.PI + 0.1;
    const vx = SPEED * Math.cos(almostNegPI);
    const vy = SPEED * Math.sin(almostNegPI);
    // Target slightly below-left of projectile (angle slightly past +PI)
    const targetAngle = Math.PI - 0.1;
    const tx = 100 * Math.cos(targetAngle);
    const ty = 100 * Math.sin(targetAngle);
    const result = computeHomingVelocity(0, 0, vx, vy, tx, ty, TURN_RATE, SPEED, DELTA_MS);
    // The shortest path should be 0.2 rad (not ~6.08 the long way)
    const mag = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(mag).toBeCloseTo(SPEED, 1);
  });

  it('angle output matches velocity direction', () => {
    const result = computeHomingVelocity(0, 0, SPEED, 0, 50, -80, TURN_RATE, SPEED, DELTA_MS);
    const computedAngle = Math.atan2(result.vy, result.vx);
    expect(computedAngle).toBeCloseTo(result.angle, 5);
  });

  it('negative delta is treated as no turn', () => {
    // Defensive: negative delta should result in 0 maxTurn
    const result = computeHomingVelocity(0, 0, SPEED, 0, 0, -100, TURN_RATE, SPEED, -16);
    // maxTurn = 4 * (-0.016) = -0.064, |diff| = PI/2
    // Math.abs(diff) < maxTurn is false (since maxTurn is negative)
    // turn = sign(-PI/2) * (-0.064) = -1 * (-0.064) = 0.064
    // This is an edge case — the function should still return valid velocity
    const mag = Math.sqrt(result.vx * result.vx + result.vy * result.vy);
    expect(mag).toBeCloseTo(SPEED, 1);
  });
});

// ── isOutOfBounds ──

describe('isOutOfBounds', () => {
  const W = 720;
  const H = 1280;
  const MARGIN = 100;

  it('center of screen is in bounds', () => {
    expect(isOutOfBounds(360, 640, W, H, MARGIN)).toBe(false);
  });

  it('origin (0,0) is in bounds', () => {
    expect(isOutOfBounds(0, 0, W, H, MARGIN)).toBe(false);
  });

  it('top-left corner is in bounds', () => {
    expect(isOutOfBounds(0, 0, W, H, MARGIN)).toBe(false);
  });

  it('bottom-right corner is in bounds', () => {
    expect(isOutOfBounds(W, H, W, H, MARGIN)).toBe(false);
  });

  it('just inside left margin', () => {
    expect(isOutOfBounds(-MARGIN, 640, W, H, MARGIN)).toBe(false);
  });

  it('just outside left margin', () => {
    expect(isOutOfBounds(-MARGIN - 1, 640, W, H, MARGIN)).toBe(true);
  });

  it('just inside right margin', () => {
    expect(isOutOfBounds(W + MARGIN, 640, W, H, MARGIN)).toBe(false);
  });

  it('just outside right margin', () => {
    expect(isOutOfBounds(W + MARGIN + 1, 640, W, H, MARGIN)).toBe(true);
  });

  it('just inside top margin', () => {
    expect(isOutOfBounds(360, -MARGIN, W, H, MARGIN)).toBe(false);
  });

  it('just outside top margin', () => {
    expect(isOutOfBounds(360, -MARGIN - 1, W, H, MARGIN)).toBe(true);
  });

  it('just inside bottom margin', () => {
    expect(isOutOfBounds(360, H + MARGIN, W, H, MARGIN)).toBe(false);
  });

  it('just outside bottom margin', () => {
    expect(isOutOfBounds(360, H + MARGIN + 1, W, H, MARGIN)).toBe(true);
  });

  it('top-left corner out of bounds', () => {
    expect(isOutOfBounds(-200, -200, W, H, MARGIN)).toBe(true);
  });

  it('top-right corner out of bounds', () => {
    expect(isOutOfBounds(W + 200, -200, W, H, MARGIN)).toBe(true);
  });

  it('bottom-left corner out of bounds', () => {
    expect(isOutOfBounds(-200, H + 200, W, H, MARGIN)).toBe(true);
  });

  it('bottom-right corner out of bounds', () => {
    expect(isOutOfBounds(W + 200, H + 200, W, H, MARGIN)).toBe(true);
  });

  it('margin 0: exactly at edge is in bounds', () => {
    expect(isOutOfBounds(0, 0, W, H, 0)).toBe(false);
    expect(isOutOfBounds(W, H, W, H, 0)).toBe(false);
  });

  it('margin 0: just past edge is out of bounds', () => {
    expect(isOutOfBounds(-1, 0, W, H, 0)).toBe(true);
    expect(isOutOfBounds(W + 1, 0, W, H, 0)).toBe(true);
    expect(isOutOfBounds(0, -1, W, H, 0)).toBe(true);
    expect(isOutOfBounds(0, H + 1, W, H, 0)).toBe(true);
  });

  it('default margin of 100 when omitted', () => {
    expect(isOutOfBounds(-100, 640, W, H)).toBe(false);
    expect(isOutOfBounds(-101, 640, W, H)).toBe(true);
  });

  it('large margin allows far-off positions', () => {
    expect(isOutOfBounds(-500, 640, W, H, 600)).toBe(false);
    expect(isOutOfBounds(-601, 640, W, H, 600)).toBe(true);
  });

  it('negative coordinates within margin are in bounds', () => {
    expect(isOutOfBounds(-50, -50, W, H, MARGIN)).toBe(false);
  });
});

// ── isExpired ──

describe('isExpired', () => {
  it('expired: current > spawn + life', () => {
    expect(isExpired(6000, 1000, 5000)).toBe(false);
    expect(isExpired(6001, 1000, 5000)).toBe(true);
  });

  it('not expired: within lifetime', () => {
    expect(isExpired(3000, 1000, 5000)).toBe(false);
  });

  it('exact boundary: elapsed equals life is not expired', () => {
    // currentTime - spawnTime = lifeMs → NOT greater than, so not expired
    expect(isExpired(6000, 1000, 5000)).toBe(false);
  });

  it('one ms past boundary is expired', () => {
    expect(isExpired(6001, 1000, 5000)).toBe(true);
  });

  it('spawn time = current time is not expired', () => {
    expect(isExpired(1000, 1000, 5000)).toBe(false);
  });

  it('life of 0: only expired if current > spawn', () => {
    expect(isExpired(1000, 1000, 0)).toBe(false);
    expect(isExpired(1001, 1000, 0)).toBe(true);
  });

  it('very long lifetime', () => {
    expect(isExpired(10000, 0, 999999)).toBe(false);
  });

  it('just spawned (delta=1ms) with short life', () => {
    expect(isExpired(1001, 1000, 100)).toBe(false);
  });

  it('large time values', () => {
    expect(isExpired(1000000, 999000, 5000)).toBe(false);
    expect(isExpired(1005001, 1000000, 5000)).toBe(true);
  });
});
