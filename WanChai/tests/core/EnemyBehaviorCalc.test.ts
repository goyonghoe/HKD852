import { describe, it, expect } from 'vitest';
import {
  calculateMarchVelocity,
  calculateSlowChaseVelocity,
  calculateZigzagVelocity,
  calculateDashVelocity,
  advanceDashState,
  calculateChaseVelocity,
  calculateSplitVelocity,
  calculateShootBehavior,
  calculateTeleportJump,
  calculateBossChaseVelocity,
  calculateBossOrbitVelocity,
  calculateBossBurstVelocity,
  advanceBurstState,
  applyFrostSlow,
  clampToWorldBounds,
} from '../../src/core/EnemyBehaviorCalc';

// ---------- 1. calculateMarchVelocity ----------
describe('calculateMarchVelocity', () => {
  it('moves straight down at given speed', () => {
    expect(calculateMarchVelocity(100)).toEqual({ vx: 0, vy: 100 });
  });

  it('handles zero speed', () => {
    expect(calculateMarchVelocity(0)).toEqual({ vx: 0, vy: 0 });
  });
});

// ---------- 2. calculateSlowChaseVelocity ----------
describe('calculateSlowChaseVelocity', () => {
  it('chases target ahead with wobble', () => {
    const result = calculateSlowChaseVelocity(100, 360, 500, 360, 700, 0, 2.5, 0.016);
    // target is directly below, dy > 0, dist > 1
    expect(result.velocity.vy).toBeGreaterThan(0);
    expect(result.newZigzagAngle).toBeGreaterThan(0);
  });

  it('chases target behind (above)', () => {
    const result = calculateSlowChaseVelocity(100, 360, 500, 360, 300, 0, 2.5, 0.016);
    // target is above, dy < 0
    expect(result.velocity.vy).toBeLessThan(0);
  });

  it('falls back to march when no target', () => {
    const result = calculateSlowChaseVelocity(100, 360, 500, undefined, undefined, 0, 2.5, 0.016);
    expect(result.velocity.vy).toBeCloseTo(60); // speed * 0.6
  });

  it('falls back when same position (dist < 1)', () => {
    const result = calculateSlowChaseVelocity(100, 360, 500, 360, 500, 0, 2.5, 0.016);
    // dist = 0 < 1 → fallback
    expect(result.velocity.vy).toBeCloseTo(60); // speed * 0.6
  });

  it('updates zigzag angle', () => {
    const result = calculateSlowChaseVelocity(100, 0, 0, 100, 100, 1.0, 2.5, 0.1);
    expect(result.newZigzagAngle).toBeCloseTo(1.0 + 2.5 * Math.PI * 0.1, 6);
  });
});

// ---------- 3. calculateZigzagVelocity ----------
describe('calculateZigzagVelocity', () => {
  it('oscillates with dir=1', () => {
    const result = calculateZigzagVelocity(100, 0, 120, 1, 2.5, 0.1);
    const expectedAngle = 0 + 2.5 * Math.PI * 2 * 0.1;
    expect(result.newZigzagAngle).toBeCloseTo(expectedAngle, 6);
    expect(result.velocity.vx).toBeCloseTo(Math.sin(expectedAngle) * 120, 4);
    expect(result.velocity.vy).toBe(100);
  });

  it('oscillates with dir=-1', () => {
    const result = calculateZigzagVelocity(100, 0, 120, -1, 2.5, 0.1);
    const expectedAngle = 0 + 2.5 * Math.PI * 2 * 0.1;
    expect(result.velocity.vx).toBeCloseTo(Math.sin(expectedAngle) * 120 * -1, 4);
    expect(result.velocity.vy).toBe(100);
  });

  it('wraps angle correctly', () => {
    const result = calculateZigzagVelocity(100, 6.0, 120, 1, 2.5, 0.1);
    expect(result.newZigzagAngle).toBeCloseTo(6.0 + 2.5 * Math.PI * 2 * 0.1, 6);
  });
});

// ---------- 4. calculateDashVelocity ----------
describe('calculateDashVelocity', () => {
  it('dashing: 3x speed', () => {
    expect(calculateDashVelocity(100, true)).toEqual({ vx: 0, vy: 300 });
  });

  it('not dashing: 0.4x speed', () => {
    expect(calculateDashVelocity(100, false)).toEqual({ vx: 0, vy: 40 });
  });
});

// ---------- 5. advanceDashState ----------
describe('advanceDashState', () => {
  const interval = 2000;
  const duration = 400;

  it('idle: accumulates timer without transition', () => {
    const result = advanceDashState({ timer: 0, isDashing: false }, interval, duration, 500);
    expect(result).toEqual({ timer: 500, isDashing: false });
  });

  it('idle → dash transition when timer >= interval', () => {
    const result = advanceDashState({ timer: 1500, isDashing: false }, interval, duration, 600);
    // 1500 + 600 = 2100 >= 2000
    expect(result).toEqual({ timer: 0, isDashing: true });
  });

  it('idle → dash at exact boundary', () => {
    const result = advanceDashState({ timer: 1500, isDashing: false }, interval, duration, 500);
    // 1500 + 500 = 2000 >= 2000
    expect(result).toEqual({ timer: 0, isDashing: true });
  });

  it('dashing: accumulates timer without transition', () => {
    const result = advanceDashState({ timer: 0, isDashing: true }, interval, duration, 200);
    expect(result).toEqual({ timer: 200, isDashing: true });
  });

  it('dash → idle transition when timer >= duration', () => {
    const result = advanceDashState({ timer: 200, isDashing: true }, interval, duration, 300);
    // 200 + 300 = 500 >= 400
    expect(result).toEqual({ timer: 0, isDashing: false });
  });
});

// ---------- 6. calculateChaseVelocity ----------
describe('calculateChaseVelocity', () => {
  it('chases target to the right', () => {
    const result = calculateChaseVelocity(100, 0, 0, 100, 0);
    expect(result.vx).toBeCloseTo(100, 4);
    expect(result.vy).toBeCloseTo(0, 4);
  });

  it('chases target upward', () => {
    const result = calculateChaseVelocity(100, 0, 100, 0, 0);
    expect(result.vx).toBeCloseTo(0, 4);
    expect(result.vy).toBeCloseTo(-100, 4);
  });

  it('falls back when same position', () => {
    const result = calculateChaseVelocity(100, 50, 50, 50, 50);
    // dist = 0 <= 1 → fallback
    expect(result).toEqual({ vx: 0, vy: 100 });
  });

  it('chases target at large distance (normalized)', () => {
    const result = calculateChaseVelocity(100, 0, 0, 300, 400);
    const dist = Math.sqrt(300 * 300 + 400 * 400); // 500
    expect(result.vx).toBeCloseTo((300 / dist) * 100, 4);
    expect(result.vy).toBeCloseTo((400 / dist) * 100, 4);
  });

  it('falls back when no target', () => {
    const result = calculateChaseVelocity(100, 50, 50, undefined, undefined);
    expect(result).toEqual({ vx: 0, vy: 100 });
  });
});

// ---------- 7. calculateSplitVelocity ----------
describe('calculateSplitVelocity', () => {
  it('moves at 0.7x speed', () => {
    expect(calculateSplitVelocity(100)).toEqual({ vx: 0, vy: 70 });
  });

  it('handles zero speed', () => {
    expect(calculateSplitVelocity(0)).toEqual({ vx: 0, vy: 0 });
  });
});

// ---------- 8. calculateShootBehavior ----------
describe('calculateShootBehavior', () => {
  it('descending before stopY', () => {
    const result = calculateShootBehavior(100, 200, 700, false, 0, 2.5, 0.016);
    expect(result.velocity).toEqual({ vx: 0, vy: 100 });
    expect(result.newIsRangedStopped).toBe(false);
  });

  it('just reached stopY → transitions to stopped', () => {
    const result = calculateShootBehavior(100, 700, 700, false, 0, 2.5, 0.016);
    expect(result.newIsRangedStopped).toBe(true);
    expect(result.velocity.vy).toBe(0); // stopped vertically
  });

  it('already stopped → sways horizontally', () => {
    const result = calculateShootBehavior(100, 800, 700, true, 0, 2.5, 0.016);
    expect(result.newIsRangedStopped).toBe(true);
    expect(result.velocity.vy).toBe(0);
    // vx is sin(newAngle) * 20
    const expectedAngle = 0 + 2.5 * Math.PI * 0.016;
    expect(result.velocity.vx).toBeCloseTo(Math.sin(expectedAngle) * 20, 4);
  });

  it('preserves zigzag angle when not stopped', () => {
    const result = calculateShootBehavior(100, 200, 700, false, 1.5, 2.5, 0.016);
    expect(result.newZigzagAngle).toBe(1.5); // unchanged
  });
});

// ---------- 9. calculateTeleportJump ----------
describe('calculateTeleportJump', () => {
  it('jumps from middle of screen', () => {
    // random=0.5 → jumpY = 100 + 0.5*50 = 125
    // randomX=0.5 → jumpX = 0
    const result = calculateTeleportJump(360, 200, 720, 100, 50, 100, 0.5, 0.5);
    expect(result.newX).toBe(360);
    expect(result.newY).toBe(325);
  });

  it('clamps X to left edge', () => {
    // currentX=5, randomX=0 → jumpX = (0-0.5)*100 = -50 → 5 + (-50) = -45 → clamped to 10
    const result = calculateTeleportJump(5, 200, 720, 100, 50, 100, 0, 0);
    expect(result.newX).toBe(10);
  });

  it('clamps X to right edge', () => {
    // currentX=715, randomX=1 → jumpX = (1-0.5)*100 = 50 → 715+50=765 → clamped to 710
    const result = calculateTeleportJump(715, 200, 720, 100, 50, 100, 0, 1);
    expect(result.newX).toBe(710);
  });

  it('random=0 gives minimum jump', () => {
    const result = calculateTeleportJump(360, 200, 720, 100, 50, 100, 0, 0.5);
    expect(result.newY).toBe(300); // 200 + 100
  });

  it('random=1 gives maximum jump', () => {
    const result = calculateTeleportJump(360, 200, 720, 100, 50, 100, 1, 0.5);
    expect(result.newY).toBe(350); // 200 + 150
  });
});

// ---------- 10. calculateBossChaseVelocity ----------
describe('calculateBossChaseVelocity', () => {
  it('tracks target to the left', () => {
    const result = calculateBossChaseVelocity(100, 400, 200);
    // dx = 200-400 = -200, bvx = -200 * 0.02 * 100 = -400
    expect(result.vx).toBeCloseTo(-400, 4);
    expect(result.vy).toBe(100);
  });

  it('tracks target to the right', () => {
    const result = calculateBossChaseVelocity(100, 200, 400);
    // dx = 400-200 = 200, bvx = 200 * 0.02 * 100 = 400
    expect(result.vx).toBeCloseTo(400, 4);
    expect(result.vy).toBe(100);
  });

  it('centered: no horizontal movement', () => {
    const result = calculateBossChaseVelocity(100, 360, 360);
    expect(result.vx).toBeCloseTo(0, 4);
    expect(result.vy).toBe(100);
  });

  it('no target: straight down', () => {
    const result = calculateBossChaseVelocity(100, 360, undefined);
    expect(result.vx).toBe(0);
    expect(result.vy).toBe(100);
  });
});

// ---------- 11. calculateBossOrbitVelocity ----------
describe('calculateBossOrbitVelocity', () => {
  it('approach: moves toward center', () => {
    const result = calculateBossOrbitVelocity(100, 0, 0, 200, 200, 0, 200, 2, 'approach', 0.016);
    const dist = Math.sqrt(200 * 200 + 200 * 200);
    expect(result.velocity.vx).toBeCloseTo((200 / dist) * 200, 4);
    expect(result.velocity.vy).toBeCloseTo((200 / dist) * 200, 4);
    expect(result.newPhase).toBe('approach');
  });

  it('approach → orbit transition when close to center', () => {
    // selfX/selfY very close to center
    const result = calculateBossOrbitVelocity(100, 360, 500, 360, 500, 0, 200, 2, 'approach', 0.016);
    expect(result.newPhase).toBe('orbit');
  });

  it('orbit: circular movement with descent', () => {
    const result = calculateBossOrbitVelocity(100, 360, 500, 360, 500, 0, 200, 2, 'orbit', 0.016);
    const newAngle = 0 + 2 * 0.016;
    const tx = 360 + Math.cos(newAngle) * 200;
    const ty = 500 + Math.sin(newAngle) * 200;
    expect(result.velocity.vx).toBeCloseTo((tx - 360) * 3, 2);
    expect(result.velocity.vy).toBeCloseTo((ty - 500) * 3 + 100 * 0.3, 2);
    expect(result.newAngle).toBeCloseTo(newAngle, 6);
    expect(result.newPhase).toBe('orbit');
  });

  it('orbit: angle advances', () => {
    const result = calculateBossOrbitVelocity(100, 360, 500, 360, 500, 1.0, 200, 2, 'orbit', 0.5);
    expect(result.newAngle).toBeCloseTo(1.0 + 2 * 0.5, 6);
  });
});

// ---------- 12. calculateBossBurstVelocity ----------
describe('calculateBossBurstVelocity', () => {
  it('idle phase: slow descent', () => {
    expect(calculateBossBurstVelocity(100, 'idle')).toEqual({ vx: 0, vy: 20 });
  });

  it('charge phase: fast descent', () => {
    expect(calculateBossBurstVelocity(100, 'charge')).toEqual({ vx: 0, vy: 400 });
  });
});

// ---------- 13. advanceBurstState ----------
describe('advanceBurstState', () => {
  const idleDuration = 2000;
  const chargeDuration = 1000;

  it('idle: accumulates timer', () => {
    const result = advanceBurstState({ timer: 0, phase: 'idle' }, idleDuration, chargeDuration, 500);
    expect(result).toEqual({ timer: 500, phase: 'idle' });
  });

  it('idle → charge transition', () => {
    const result = advanceBurstState({ timer: 1500, phase: 'idle' }, idleDuration, chargeDuration, 600);
    // 1500 + 600 = 2100 >= 2000
    expect(result).toEqual({ timer: 0, phase: 'charge' });
  });

  it('charge: accumulates timer', () => {
    const result = advanceBurstState({ timer: 0, phase: 'charge' }, idleDuration, chargeDuration, 500);
    expect(result).toEqual({ timer: 500, phase: 'charge' });
  });

  it('charge → idle transition', () => {
    const result = advanceBurstState({ timer: 500, phase: 'charge' }, idleDuration, chargeDuration, 600);
    // 500 + 600 = 1100 >= 1000
    expect(result).toEqual({ timer: 0, phase: 'idle' });
  });

  it('no transition when under threshold', () => {
    const result = advanceBurstState({ timer: 100, phase: 'idle' }, idleDuration, chargeDuration, 100);
    expect(result).toEqual({ timer: 200, phase: 'idle' });
  });
});

// ---------- 14. applyFrostSlow ----------
describe('applyFrostSlow', () => {
  it('no frost (1.0): returns same velocity', () => {
    const vel = { vx: 100, vy: 200 };
    const result = applyFrostSlow(vel, 1.0);
    expect(result).toBe(vel); // same reference
  });

  it('half speed (0.5)', () => {
    const result = applyFrostSlow({ vx: 100, vy: 200 }, 0.5);
    expect(result).toEqual({ vx: 50, vy: 100 });
  });

  it('full freeze (0)', () => {
    const result = applyFrostSlow({ vx: 100, vy: 200 }, 0);
    expect(result).toEqual({ vx: 0, vy: 0 });
  });

  it('frost mult > 1 returns as-is', () => {
    const vel = { vx: 100, vy: 200 };
    const result = applyFrostSlow(vel, 1.5);
    expect(result).toBe(vel); // same reference, no scaling
  });

  it('frost with negative velocity', () => {
    const result = applyFrostSlow({ vx: -100, vy: -200 }, 0.7);
    expect(result).toEqual({ vx: -70, vy: -140 });
  });
});

// ---------- 15. clampToWorldBounds ----------
describe('clampToWorldBounds', () => {
  const gameWidth = 720;
  const minY = -100;

  it('within bounds: no change', () => {
    expect(clampToWorldBounds(360, 500, gameWidth, minY)).toEqual({ x: 360, y: 500 });
  });

  it('left edge clamping', () => {
    expect(clampToWorldBounds(-50, 500, gameWidth, minY)).toEqual({ x: 10, y: 500 });
  });

  it('right edge clamping', () => {
    expect(clampToWorldBounds(800, 500, gameWidth, minY)).toEqual({ x: 710, y: 500 });
  });

  it('top edge clamping', () => {
    expect(clampToWorldBounds(360, -200, gameWidth, minY)).toEqual({ x: 360, y: -100 });
  });

  it('far below: no clamp on y upper bound', () => {
    expect(clampToWorldBounds(360, 5000, gameWidth, minY)).toEqual({ x: 360, y: 5000 });
  });

  it('both x and y clamped', () => {
    expect(clampToWorldBounds(-100, -500, gameWidth, minY)).toEqual({ x: 10, y: -100 });
  });

  it('exactly on boundary', () => {
    expect(clampToWorldBounds(10, -100, gameWidth, minY)).toEqual({ x: 10, y: -100 });
    expect(clampToWorldBounds(710, 0, gameWidth, minY)).toEqual({ x: 710, y: 0 });
  });
});

// ---------- Cross-function integration: frost + behavior ----------
describe('frost + behavior integration', () => {
  it('march velocity with frost applied', () => {
    const march = calculateMarchVelocity(100);
    const frosted = applyFrostSlow(march, 0.7);
    expect(frosted).toEqual({ vx: 0, vy: 70 });
  });

  it('dash velocity with frost applied', () => {
    const dash = calculateDashVelocity(100, true);
    const frosted = applyFrostSlow(dash, 0.5);
    expect(frosted).toEqual({ vx: 0, vy: 150 }); // 300 * 0.5
  });

  it('boss burst charge with frost applied', () => {
    const burst = calculateBossBurstVelocity(100, 'charge');
    const frosted = applyFrostSlow(burst, 0.7);
    expect(frosted.vy).toBeCloseTo(280, 4); // 400 * 0.7
  });
});
