// ── Neon Survivors: Knockback Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface KnockbackVector {
  dx: number;
  dy: number;
  magnitude: number;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Base force multiplier applied to projectile damage */
const BASE_FORCE_FACTOR = 0.5;

/** Maximum displacement in pixels */
const MAX_DISPLACEMENT = 40;

/** Magnitude threshold below which knockback snaps to zero */
const SNAP_THRESHOLD = 0.5;

/** Default exponential decay rate (per second) */
const DEFAULT_DECAY_RATE = 8.0;

/** Default weapon knockback force multiplier */
const DEFAULT_WEAPON_FORCE = 1.0;

// ════════════════════════════════════════════════════════════════
// § calculateKnockback
// ════════════════════════════════════════════════════════════════

/**
 * Calculate knockback displacement when a projectile hits an enemy.
 *
 * Direction: away from projectile position.
 * Force: `damage * 0.5 * weaponKnockbackForce * (1 - knockbackResist)`, capped at 40px.
 */
export function calculateKnockback(
  projectileDamage: number,
  projectileX: number,
  projectileY: number,
  enemyX: number,
  enemyY: number,
  knockbackResist: number,
  weaponKnockbackForce: number = DEFAULT_WEAPON_FORCE,
): KnockbackVector {
  const ZERO: KnockbackVector = { dx: 0, dy: 0, magnitude: 0 };

  // Full resistance → no knockback
  if (knockbackResist >= 1) return ZERO;

  // Direction vector (enemy - projectile = away from projectile)
  const rawDx = enemyX - projectileX;
  const rawDy = enemyY - projectileY;
  const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

  // Zero distance edge case — no meaningful direction
  if (dist === 0) return ZERO;

  // Normalize direction
  const nx = rawDx / dist;
  const ny = rawDy / dist;

  // Calculate force magnitude
  const baseForce = projectileDamage * BASE_FORCE_FACTOR;
  const modifiedForce =
    baseForce * weaponKnockbackForce * (1 - knockbackResist);
  const clampedForce = Math.min(modifiedForce, MAX_DISPLACEMENT);

  return {
    dx: nx * clampedForce,
    dy: ny * clampedForce,
    magnitude: clampedForce,
  };
}

// ════════════════════════════════════════════════════════════════
// § applyKnockbackDecay
// ════════════════════════════════════════════════════════════════

/**
 * Apply exponential decay to a knockback velocity vector.
 *
 * Multiplies by `exp(-decayRate * deltaTime)`.
 * Snaps to zero when magnitude < 0.5px.
 */
export function applyKnockbackDecay(
  currentDx: number,
  currentDy: number,
  deltaTime: number,
  decayRate: number = DEFAULT_DECAY_RATE,
): { dx: number; dy: number } {
  const factor = Math.exp(-decayRate * deltaTime);
  const dx = currentDx * factor;
  const dy = currentDy * factor;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < SNAP_THRESHOLD) {
    return { dx: 0, dy: 0 };
  }

  return { dx, dy };
}
