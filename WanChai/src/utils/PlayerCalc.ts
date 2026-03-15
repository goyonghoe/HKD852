/**
 * Pure math functions extracted from Player.ts.
 * No Phaser imports — testable without game engine. (M-001)
 */

/**
 * Calculate clamped rotation angle for aiming at a target.
 * Sprite faces UP by default, so +PI/2 offset is applied.
 * Result is clamped to +-maxAimDeg from vertical (0).
 *
 * @param playerX  Player's world X
 * @param playerY  Player's world Y
 * @param targetX  Target world X
 * @param targetY  Target world Y
 * @param maxAimDeg  Maximum aim angle in degrees (e.g. 15 for +-15 deg)
 * @returns Clamped rotation in radians
 */
export function aimAtAngle(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
  maxAimDeg: number,
): number {
  const angle = Math.atan2(targetY - playerY, targetX - playerX);
  // Sprite faces up by default, so +PI/2 offset
  const rawRot = angle + Math.PI / 2;
  // Clamp to +-maxAimDeg from vertical (0)
  const maxRad = (maxAimDeg * Math.PI) / 180;
  // Normalize to [-PI, PI]
  let clamped = ((rawRot + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (clamped < -maxRad) clamped = -maxRad;
  if (clamped > maxRad) clamped = maxRad;
  return clamped;
}

/**
 * Add to the ultimate gauge, capped at max.
 *
 * @param current  Current gauge value
 * @param amount   Amount to add
 * @param max      Maximum gauge value
 * @returns New gauge state: { gauge, ready }
 */
export function addUltimateGauge(current: number, amount: number, max: number): { gauge: number; ready: boolean } {
  const gauge = Math.min(current + amount, max);
  return { gauge, ready: gauge >= max };
}

/**
 * Consume the ultimate gauge. Returns the new state and whether it was consumed.
 *
 * @param gauge   Current gauge value
 * @param ready   Whether the ultimate is ready
 * @param max     Maximum gauge value (unused, kept for API consistency)
 * @returns New state: { gauge, ready, consumed }
 */
export function consumeUltimate(
  gauge: number,
  ready: boolean,
  _max: number,
): { gauge: number; ready: boolean; consumed: boolean } {
  if (!ready) {
    return { gauge, ready, consumed: false };
  }
  return { gauge: 0, ready: false, consumed: true };
}
