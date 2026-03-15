// ── Neon Survivors: Homing Projectile Tracking ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface HomingConfig {
  readonly turnRate: number; // radians/sec — how fast projectile can turn
  readonly acquisitionRange: number; // max distance to acquire target
  readonly lockOnDelay: number; // ms before tracking starts
  readonly maxLifetime: number; // ms
}

export interface HomingProjectile {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly angle: number; // radians
  readonly speed: number;
  readonly targetId: string | null;
  readonly elapsed: number; // ms
  readonly locked: boolean;
  readonly active: boolean;
}

// ════════════════════════════════════════════════════════════════
// § createHomingConfig
// ════════════════════════════════════════════════════════════════

/**
 * Create a homing config with sensible defaults.
 * Any field in `overrides` replaces the default.
 */
export function createHomingConfig(
  overrides?: Partial<HomingConfig>,
): HomingConfig {
  return {
    turnRate: 3.0,
    acquisitionRange: 400,
    lockOnDelay: 200,
    maxLifetime: 5000,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════
// § createHomingProjectile
// ════════════════════════════════════════════════════════════════

/**
 * Spawn a new homing projectile at a position with an initial angle and speed.
 */
export function createHomingProjectile(
  id: string,
  x: number,
  y: number,
  angle: number,
  speed: number,
): HomingProjectile {
  return {
    id,
    x,
    y,
    angle,
    speed,
    targetId: null,
    elapsed: 0,
    locked: false,
    active: true,
  };
}

// ════════════════════════════════════════════════════════════════
// § acquireTarget
// ════════════════════════════════════════════════════════════════

/**
 * Find the closest target within acquisitionRange and set it as the projectile's target.
 * If no target is in range, the projectile is returned unchanged.
 */
export function acquireTarget(
  projectile: HomingProjectile,
  targets: readonly { id: string; x: number; y: number }[],
  config: HomingConfig,
): HomingProjectile {
  if (!projectile.active) return projectile;

  let closestId: string | null = null;
  let closestDist = Infinity;
  const rangeSq = config.acquisitionRange * config.acquisitionRange;

  for (const t of targets) {
    const dx = t.x - projectile.x;
    const dy = t.y - projectile.y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= rangeSq && distSq < closestDist) {
      closestDist = distSq;
      closestId = t.id;
    }
  }

  if (closestId === null) return projectile;

  return { ...projectile, targetId: closestId };
}

// ════════════════════════════════════════════════════════════════
// § getDesiredAngle
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the angle from (fromX, fromY) toward (toX, toY) using atan2.
 */
export function getDesiredAngle(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

// ════════════════════════════════════════════════════════════════
// § turnToward
// ════════════════════════════════════════════════════════════════

/**
 * Rotate `currentAngle` toward `desiredAngle` by the shortest path,
 * clamped to `maxTurn` radians.
 */
export function turnToward(
  currentAngle: number,
  desiredAngle: number,
  maxTurn: number,
): number {
  let diff = desiredAngle - currentAngle;

  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  if (Math.abs(diff) <= maxTurn) {
    return desiredAngle;
  }

  return currentAngle + Math.sign(diff) * maxTurn;
}

// ════════════════════════════════════════════════════════════════
// § updateHoming
// ════════════════════════════════════════════════════════════════

/**
 * Advance a homing projectile one tick toward a known target position.
 *
 * - Turns toward target at `turnRate` (radians/sec).
 * - Advances position along the (possibly adjusted) angle.
 * - Advances `elapsed` by `deltaMs`.
 * - Sets `locked = true` once elapsed >= lockOnDelay.
 */
export function updateHoming(
  projectile: HomingProjectile,
  targetX: number,
  targetY: number,
  deltaMs: number,
  config: HomingConfig,
): HomingProjectile {
  if (!projectile.active) return projectile;

  const newElapsed = projectile.elapsed + deltaMs;
  const deltaSec = deltaMs / 1000;
  const maxTurn = config.turnRate * deltaSec;

  const desired = getDesiredAngle(projectile.x, projectile.y, targetX, targetY);

  const newLocked = newElapsed >= config.lockOnDelay;

  // Only turn if locked
  const newAngle = newLocked
    ? turnToward(projectile.angle, desired, maxTurn)
    : projectile.angle;

  const dist = projectile.speed * deltaSec;
  const newX = projectile.x + Math.cos(newAngle) * dist;
  const newY = projectile.y + Math.sin(newAngle) * dist;

  return {
    ...projectile,
    x: newX,
    y: newY,
    angle: newAngle,
    elapsed: newElapsed,
    locked: newLocked,
  };
}

// ════════════════════════════════════════════════════════════════
// § updateHomingNoTarget
// ════════════════════════════════════════════════════════════════

/**
 * Advance a projectile that has no target — move straight ahead.
 */
export function updateHomingNoTarget(
  projectile: HomingProjectile,
  deltaMs: number,
  _config: HomingConfig,
): HomingProjectile {
  if (!projectile.active) return projectile;

  const newElapsed = projectile.elapsed + deltaMs;
  const deltaSec = deltaMs / 1000;
  const dist = projectile.speed * deltaSec;

  return {
    ...projectile,
    x: projectile.x + Math.cos(projectile.angle) * dist,
    y: projectile.y + Math.sin(projectile.angle) * dist,
    elapsed: newElapsed,
  };
}

// ════════════════════════════════════════════════════════════════
// § isExpired
// ════════════════════════════════════════════════════════════════

/**
 * Whether the projectile has exceeded its maximum lifetime.
 */
export function isExpired(
  projectile: HomingProjectile,
  config: HomingConfig,
): boolean {
  return projectile.elapsed >= config.maxLifetime;
}

// ════════════════════════════════════════════════════════════════
// § loseTarget
// ════════════════════════════════════════════════════════════════

/**
 * Clear the projectile's target, resetting locked state.
 */
export function loseTarget(projectile: HomingProjectile): HomingProjectile {
  return { ...projectile, targetId: null, locked: false };
}

// ════════════════════════════════════════════════════════════════
// § getPosition
// ════════════════════════════════════════════════════════════════

/**
 * Extract the current position of a projectile.
 */
export function getPosition(projectile: HomingProjectile): {
  x: number;
  y: number;
} {
  return { x: projectile.x, y: projectile.y };
}
