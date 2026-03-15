/**
 * EnemyBehaviorCalc — Pure TypeScript module for enemy movement/behavior calculations.
 *
 * Extracted from Enemy.ts applyMovement() (lines 281-488).
 * M-001: ZERO Phaser imports. All balance values passed as parameters.
 */

export interface Velocity {
  vx: number;
  vy: number;
}

export interface DashState {
  timer: number;
  isDashing: boolean;
}

export interface BurstState {
  timer: number;
  phase: 'idle' | 'charge';
}

// ---------- 1. March ----------

/** Straight down movement (legacy vertical) or horizontal march for hill defense. */
export function calculateMarchVelocity(speed: number, direction?: 'left' | 'right'): Velocity {
  if (direction === 'left') return { vx: speed, vy: 0 }; // left spawns move right
  if (direction === 'right') return { vx: -speed, vy: 0 }; // right spawns move left
  return { vx: 0, vy: speed };
}

// ---------- 2. Slow Chase ----------

/** Slow pursuit with gentle wobble toward target. */
export function calculateSlowChaseVelocity(
  speed: number,
  selfX: number,
  selfY: number,
  targetX: number | undefined,
  targetY: number | undefined,
  zigzagAngle: number,
  zigzagFreq: number,
  dt: number,
): { velocity: Velocity; newZigzagAngle: number } {
  const newAngle = zigzagAngle + zigzagFreq * Math.PI * dt;
  const wobble = Math.sin(newAngle) * 30;

  if (targetX != null && targetY != null) {
    const dx = targetX - selfX;
    const dy = targetY - selfY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      return {
        velocity: {
          vx: (dx / dist) * speed * 0.6 + wobble,
          vy: (dy / dist) * speed * 0.6,
        },
        newZigzagAngle: newAngle,
      };
    }
  }

  return {
    velocity: { vx: wobble, vy: speed * 0.6 },
    newZigzagAngle: newAngle,
  };
}

// ---------- 3. Zigzag ----------

/** Move with oscillation. Primary axis based on direction (horizontal for hill defense). */
export function calculateZigzagVelocity(
  speed: number,
  zigzagAngle: number,
  zigzagSpeed: number,
  zigzagDir: number,
  zigzagFreq: number,
  dt: number,
  direction?: 'left' | 'right',
): { velocity: Velocity; newZigzagAngle: number } {
  const newAngle = zigzagAngle + zigzagFreq * Math.PI * 2 * dt;
  const oscillation = Math.sin(newAngle) * zigzagSpeed * zigzagDir;
  if (direction === 'left') {
    return { velocity: { vx: speed, vy: oscillation }, newZigzagAngle: newAngle };
  }
  if (direction === 'right') {
    return { velocity: { vx: -speed, vy: oscillation }, newZigzagAngle: newAngle };
  }
  return {
    velocity: { vx: oscillation, vy: speed },
    newZigzagAngle: newAngle,
  };
}

// ---------- 4. Dash velocity ----------

/** Periodic dash bursts (faster), slow march between. Supports horizontal direction. */
export function calculateDashVelocity(speed: number, isDashing: boolean, direction?: 'left' | 'right'): Velocity {
  const mult = isDashing ? 3 : 0.4;
  if (direction === 'left') return { vx: speed * mult, vy: 0 };
  if (direction === 'right') return { vx: -speed * mult, vy: 0 };
  return { vx: 0, vy: speed * mult };
}

// ---------- 5. Dash state machine ----------

/** Advance dash state timer. Returns new state. */
export function advanceDashState(state: DashState, interval: number, duration: number, delta: number): DashState {
  const newTimer = state.timer + delta;

  if (!state.isDashing) {
    if (newTimer >= interval) {
      return { timer: 0, isDashing: true };
    }
    return { timer: newTimer, isDashing: false };
  }

  // Currently dashing
  if (newTimer >= duration) {
    return { timer: 0, isDashing: false };
  }
  return { timer: newTimer, isDashing: true };
}

// ---------- 6. Chase ----------

/** Direct pursuit toward player. */
export function calculateChaseVelocity(
  speed: number,
  selfX: number,
  selfY: number,
  targetX: number | undefined,
  targetY: number | undefined,
): Velocity {
  if (targetX != null && targetY != null) {
    const dx = targetX - selfX;
    const dy = targetY - selfY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
    }
  }
  return { vx: 0, vy: speed };
}

// ---------- 7. Split ----------

/** Slow straight march for split_on_death enemies. Supports horizontal direction. */
export function calculateSplitVelocity(speed: number, direction?: 'left' | 'right'): Velocity {
  if (direction === 'left') return { vx: speed * 0.7, vy: 0 };
  if (direction === 'right') return { vx: -speed * 0.7, vy: 0 };
  return { vx: 0, vy: speed * 0.7 };
}

// ---------- 8. Shoot ----------

/** Ranged enemy behavior: advance, stop at range, sway. Supports horizontal direction. */
export function calculateShootBehavior(
  speed: number,
  selfY: number,
  rangedStopY: number,
  isRangedStopped: boolean,
  zigzagAngle: number,
  zigzagFreq: number,
  dt: number,
  direction?: 'left' | 'right',
  selfX?: number,
  rangedStopX?: number,
): { velocity: Velocity; newZigzagAngle: number; newIsRangedStopped: boolean } {
  let stopped = isRangedStopped;

  if (direction === 'left' || direction === 'right') {
    // Horizontal: stop at X threshold
    if (!stopped && selfX != null && rangedStopX != null) {
      if (direction === 'left' && selfX >= rangedStopX) stopped = true;
      if (direction === 'right' && selfX <= rangedStopX) stopped = true;
    }
    if (stopped) {
      const newAngle = zigzagAngle + zigzagFreq * Math.PI * dt;
      const sway = Math.sin(newAngle) * 20;
      return { velocity: { vx: 0, vy: sway }, newZigzagAngle: newAngle, newIsRangedStopped: true };
    }
    const vx = direction === 'left' ? speed : -speed;
    return { velocity: { vx, vy: 0 }, newZigzagAngle: zigzagAngle, newIsRangedStopped: false };
  }

  // Legacy vertical behavior
  if (!stopped && selfY >= rangedStopY) {
    stopped = true;
  }

  if (stopped) {
    const newAngle = zigzagAngle + zigzagFreq * Math.PI * dt;
    const sway = Math.sin(newAngle) * 20;
    return {
      velocity: { vx: sway, vy: 0 },
      newZigzagAngle: newAngle,
      newIsRangedStopped: true,
    };
  }

  return {
    velocity: { vx: 0, vy: speed },
    newZigzagAngle: zigzagAngle,
    newIsRangedStopped: false,
  };
}

// ---------- 9. Teleport jump ----------

/** Calculate new position after teleport jump. */
export function calculateTeleportJump(
  currentX: number,
  currentY: number,
  gameWidth: number,
  jumpYMin: number,
  jumpYRange: number,
  jumpXRange: number,
  random: number,
  randomX: number,
): { newX: number; newY: number } {
  const jumpY = jumpYMin + random * jumpYRange;
  const jumpX = (randomX - 0.5) * jumpXRange;
  const newX = Math.max(10, Math.min(gameWidth - 10, currentX + jumpX));
  const newY = currentY + jumpY;
  return { newX, newY };
}

// ---------- 10. Boss chase ----------

/** Boss chase: slow approach with gradual tracking. Supports horizontal direction.
 * trackingMult controls how aggressively the boss tracks the target (default 0.02).
 */
export function calculateBossChaseVelocity(
  speed: number,
  selfX: number,
  targetX: number | undefined,
  direction?: 'left' | 'right',
  targetY?: number,
  selfY?: number,
  trackingMult: number = 0.02,
): Velocity {
  if (direction === 'left' || direction === 'right') {
    // Horizontal approach toward target with Y tracking
    const baseVx = direction === 'left' ? speed : -speed;
    let bvy = 0;
    // Track target vertically (enhanced in Phase 2 via trackingMult)
    if (targetY != null && selfY != null) {
      const dy = targetY - selfY;
      bvy = dy * trackingMult * speed;
    }
    return { vx: baseVx, vy: bvy };
  }
  let bvx = 0;
  if (targetX != null) {
    const dx = targetX - selfX;
    bvx = dx * trackingMult * speed;
  }
  return { vx: bvx, vy: speed };
}

// ---------- 11. Boss orbit ----------

/** Boss orbit: approach center, then circular orbit with descent. */
export function calculateBossOrbitVelocity(
  speed: number,
  selfX: number,
  selfY: number,
  centerX: number,
  centerY: number,
  angle: number,
  radius: number,
  orbitSpeed: number,
  phase: 'approach' | 'orbit',
  dt: number,
): { velocity: Velocity; newPhase: 'approach' | 'orbit'; newAngle: number } {
  if (phase === 'approach') {
    const dx = centerX - selfX;
    const dy = centerY - selfY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) {
      return { velocity: { vx: 0, vy: 0 }, newPhase: 'orbit', newAngle: angle };
    }
    return {
      velocity: { vx: (dx / dist) * speed * 2, vy: (dy / dist) * speed * 2 },
      newPhase: 'approach',
      newAngle: angle,
    };
  }

  // Orbit phase
  const newAngle = angle + orbitSpeed * dt;
  const targetX = centerX + Math.cos(newAngle) * radius;
  const targetY = centerY + Math.sin(newAngle) * radius;
  const dx = targetX - selfX;
  const dy = targetY - selfY;
  return {
    velocity: { vx: dx * 3, vy: dy * 3 + speed * 0.3 },
    newPhase: 'orbit',
    newAngle,
  };
}

// ---------- 12. Boss burst velocity ----------

/** Boss burst: idle (slow) or charge (fast). Supports horizontal direction. */
export function calculateBossBurstVelocity(
  speed: number,
  phase: 'idle' | 'charge',
  direction?: 'left' | 'right',
): Velocity {
  const mult = phase === 'idle' ? 0.2 : 4;
  if (direction === 'left') return { vx: speed * mult, vy: 0 };
  if (direction === 'right') return { vx: -speed * mult, vy: 0 };
  return { vx: 0, vy: speed * mult };
}

// ---------- 13. Burst state machine ----------

/** Advance burst state timer. Returns new state. */
export function advanceBurstState(
  state: BurstState,
  idleDuration: number,
  chargeDuration: number,
  delta: number,
): BurstState {
  const newTimer = state.timer + delta;

  if (state.phase === 'idle') {
    if (newTimer >= idleDuration) {
      return { timer: 0, phase: 'charge' };
    }
    return { timer: newTimer, phase: 'idle' };
  }

  // charge phase
  if (newTimer >= chargeDuration) {
    return { timer: 0, phase: 'idle' };
  }
  return { timer: newTimer, phase: 'charge' };
}

// ---------- 14. Frost slow ----------

/** Apply frost slow multiplier to velocity. */
export function applyFrostSlow(velocity: Velocity, frostSlowMult: number): Velocity {
  if (frostSlowMult < 1) {
    return { vx: velocity.vx * frostSlowMult, vy: velocity.vy * frostSlowMult };
  }
  return velocity;
}

// ---------- 15. World bounds clamp ----------

/** Clamp position to world bounds. */
export function clampToWorldBounds(x: number, y: number, gameWidth: number, minY: number): { x: number; y: number } {
  const clampedX = Math.max(10, Math.min(gameWidth - 10, x));
  const clampedY = Math.max(minY, y);
  return { x: clampedX, y: clampedY };
}
