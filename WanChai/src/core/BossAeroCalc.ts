/**
 * BossAeroCalc — Pure TypeScript module for Boss Aero mechanics.
 *
 * TASK-048: Boss Aero 3-phase mechanics (Wind Deflection, Gust Surge, Eagle Dive).
 * M-001: ZERO Phaser imports. All balance values passed as parameters.
 */

export interface WindDeflectConfig {
  /** Deflection angle in degrees */
  angleDeg: number;
  /** Radius in px within which deflection applies */
  radius: number;
}

export interface EagleDiveState {
  /** Time accumulator since last dive (ms) */
  timer: number;
  /** Whether the dive push is currently active */
  active: boolean;
  /** Remaining duration of current dive push (ms) */
  remainingMs: number;
}

/**
 * Calculate wind deflection offset for a projectile near Boss Aero.
 * Returns the angular offset in radians to apply to the projectile's velocity.
 * Returns 0 if projectile is outside the wind radius or weapon has high piercing (laser).
 *
 * @param projX - projectile X
 * @param projY - projectile Y
 * @param bossX - boss X
 * @param bossY - boss Y
 * @param config - wind deflection parameters
 * @param piercing - projectile piercing value (99 = laser, immune to wind)
 * @returns angular offset in radians (positive = clockwise deflection)
 */
export function calculateWindDeflection(
  projX: number,
  projY: number,
  bossX: number,
  bossY: number,
  config: WindDeflectConfig,
  piercing: number,
): number {
  // Lasers (piercing 99) are immune to wind deflection
  if (piercing >= 99) return 0;

  const dx = projX - bossX;
  const dy = projY - bossY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = config.radius * config.radius;

  if (distSq >= radiusSq) return 0;

  // Deflection scales with proximity: stronger when closer
  const dist = Math.sqrt(distSq);
  const proximity = 1 - dist / config.radius; // 0 at edge, 1 at center
  const angleRad = (config.angleDeg * Math.PI) / 180;

  // Deflect away from boss center (direction based on relative position)
  const sign = dy >= 0 ? 1 : -1; // deflect downward if above boss, upward if below
  return sign * angleRad * proximity;
}

/**
 * Apply wind deflection to a velocity vector.
 * Rotates the velocity by the given angle offset.
 *
 * @returns new velocity components { vx, vy }
 */
export function applyWindDeflectionToVelocity(
  vx: number,
  vy: number,
  angleOffsetRad: number,
): { vx: number; vy: number } {
  if (angleOffsetRad === 0) return { vx, vy };
  const cos = Math.cos(angleOffsetRad);
  const sin = Math.sin(angleOffsetRad);
  return {
    vx: vx * cos - vy * sin,
    vy: vx * sin + vy * cos,
  };
}

/**
 * Get wind deflection config for the current boss phase.
 */
export function getWindDeflectConfig(
  phase: 1 | 2 | 3,
  p1Angle: number,
  p1Radius: number,
  p3Angle: number,
  p3Radius: number,
): WindDeflectConfig {
  if (phase === 3) {
    return { angleDeg: p3Angle, radius: p3Radius };
  }
  // Phase 1 and 2 use same wind deflection
  return { angleDeg: p1Angle, radius: p1Radius };
}

/**
 * Create initial Eagle Dive state.
 */
export function createEagleDiveState(): EagleDiveState {
  return { timer: 0, active: false, remainingMs: 0 };
}

/**
 * Tick the Eagle Dive state machine.
 * Returns updated state and whether a new dive just started.
 */
export function tickEagleDive(
  state: EagleDiveState,
  deltaMs: number,
  intervalMs: number,
  durationMs: number,
): { state: EagleDiveState; diveStarted: boolean; diveEnded: boolean } {
  if (state.active) {
    const remaining = state.remainingMs - deltaMs;
    if (remaining <= 0) {
      return {
        state: { timer: 0, active: false, remainingMs: 0 },
        diveStarted: false,
        diveEnded: true,
      };
    }
    return {
      state: { ...state, remainingMs: remaining },
      diveStarted: false,
      diveEnded: false,
    };
  }

  // Not active — accumulate timer
  const newTimer = state.timer + deltaMs;
  if (newTimer >= intervalMs) {
    return {
      state: { timer: 0, active: true, remainingMs: durationMs },
      diveStarted: true,
      diveEnded: false,
    };
  }

  return {
    state: { timer: newTimer, active: false, remainingMs: 0 },
    diveStarted: false,
    diveEnded: false,
  };
}

/**
 * Calculate spawn boost multiplier for Phase 2 Gust Surge.
 * Returns 1.0 for phases without boost.
 */
export function getSpawnBoostMultiplier(phase: 1 | 2 | 3, boostMult: number): number {
  return phase >= 2 ? boostMult : 1;
}

/**
 * Determine if the boss should use zigzag movement (Phase 3).
 */
export function shouldUseZigzag(phase: 1 | 2 | 3): boolean {
  return phase >= 3;
}
