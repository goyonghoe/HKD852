/**
 * Pure collision math calculations.
 * Extracted from CollisionManager.ts for testability.
 * NO Phaser imports — pure TypeScript only (M-001).
 */

/**
 * Circle-circle collision check.
 * Returns true if the distance between two points is strictly less than combinedRadius.
 */
export function checkCircleCollision(px: number, py: number, ex: number, ey: number, combinedRadius: number): boolean {
  const dx = px - ex;
  const dy = py - ey;
  return dx * dx + dy * dy < combinedRadius * combinedRadius;
}

/**
 * Squared distance between two 2D points.
 * Avoids sqrt for performance in distance comparisons.
 */
export function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Calculate final projectile damage with element multiplier and armor.
 * Formula: Math.round(baseDamage * elementMultiplier / enemyArmorMult)
 * Guards against zero/negative armor (returns base * elem unmodified).
 */
export function calculateProjectileDamage(
  baseDamage: number,
  elementMultiplier: number,
  enemyArmorMult: number,
): number {
  if (enemyArmorMult <= 0) return Math.round(baseDamage * elementMultiplier);
  return Math.round((baseDamage * elementMultiplier) / enemyArmorMult);
}

/**
 * Determine if a projectile should despawn after hitting an enemy.
 * Despawns when hitCount exceeds piercing count.
 */
export function shouldProjectileDespawn(hitCount: number, piercing: number): boolean {
  return hitCount > piercing;
}

/**
 * Calculate knockback vector from source position to target position.
 * Returns velocity components scaled by force.
 * If source and target are at the same position, returns zero vector.
 */
export function calculateKnockbackVector(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  force: number,
): { vx: number; vy: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dx === 0 && dy === 0) {
    return { vx: 0, vy: 0 };
  }

  const angle = Math.atan2(dy, dx);
  return {
    vx: Math.cos(angle) * force,
    vy: Math.sin(angle) * force,
  };
}

/**
 * Calculate enemy projectile base damage with armor multiplier.
 * Formula: Math.ceil(damage * baseArmorMultiplier)
 */
export function calculateEnemyBaseDamage(damage: number, baseArmorMultiplier: number): number {
  return Math.ceil(damage * baseArmorMultiplier);
}

/**
 * Check if a Y position is offscreen (below game height + buffer).
 */
export function isOffscreen(y: number, gameHeight: number, buffer: number): boolean {
  return y > gameHeight + buffer;
}
