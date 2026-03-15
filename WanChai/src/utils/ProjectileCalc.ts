/**
 * Pure math functions extracted from Projectile.ts.
 * No Phaser imports — testable without game engine. (M-001)
 */

/**
 * Compute new homing velocity by steering toward a target.
 * Uses shortest rotation direction with clamped turn rate.
 *
 * @param projX     Projectile world X
 * @param projY     Projectile world Y
 * @param projVx    Current velocity X
 * @param projVy    Current velocity Y
 * @param targetX   Target world X
 * @param targetY   Target world Y
 * @param turnRate  Max turn rate in radians per second
 * @param speed     Projectile speed (magnitude)
 * @param deltaMs   Frame delta in milliseconds
 * @returns New velocity { vx, vy } and facing angle in radians
 */
export function computeHomingVelocity(
  projX: number,
  projY: number,
  projVx: number,
  projVy: number,
  targetX: number,
  targetY: number,
  turnRate: number,
  speed: number,
  deltaMs: number,
): { vx: number; vy: number; angle: number } {
  const dx = targetX - projX;
  const dy = targetY - projY;
  const desiredAngle = Math.atan2(dy, dx);

  const currentAngle = Math.atan2(projVy, projVx);

  // Shortest rotation direction
  let diff = desiredAngle - currentAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const safeDelta = Math.max(0, deltaMs);
  const maxTurn = turnRate * (safeDelta / 1000);
  const turn = Math.abs(diff) < maxTurn ? diff : Math.sign(diff) * maxTurn;
  const newAngle = currentAngle + turn;

  return {
    vx: Math.cos(newAngle) * speed,
    vy: Math.sin(newAngle) * speed,
    angle: newAngle,
  };
}

/**
 * Check if a position is outside the game bounds (with margin).
 *
 * @param x          Projectile X
 * @param y          Projectile Y
 * @param gameWidth  Game viewport width
 * @param gameHeight Game viewport height
 * @param margin     Extra margin beyond bounds (default 100)
 * @returns true if out of bounds
 */
export function isOutOfBounds(
  x: number,
  y: number,
  gameWidth: number,
  gameHeight: number,
  margin: number = 100,
): boolean {
  return x < -margin || x > gameWidth + margin || y < -margin || y > gameHeight + margin;
}

/**
 * Check if a projectile has exceeded its lifetime.
 *
 * @param currentTime  Current game time in ms
 * @param spawnTime    Time when projectile was spawned in ms
 * @param lifeMs       Maximum lifetime in ms
 * @returns true if expired
 */
export function isExpired(currentTime: number, spawnTime: number, lifeMs: number): boolean {
  return currentTime - spawnTime > lifeMs;
}
