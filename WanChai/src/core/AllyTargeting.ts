/**
 * Pure targeting/distance calculations for critters (allies) and weapon systems.
 * No Phaser imports — pure TypeScript only (M-001).
 */

export interface Position {
  x: number;
  y: number;
}

export interface TargetResult {
  index: number;
  x: number;
  y: number;
  distance: number;
}

/**
 * Calculate distance between two points.
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find nearest target from a position.
 * Returns null if targets array is empty.
 * On tie, the target with the lower index wins.
 */
export function findNearestTarget(fromX: number, fromY: number, targets: readonly Position[]): TargetResult | null {
  if (targets.length === 0) return null;

  let bestIndex = 0;
  let bestDist = distance(fromX, fromY, targets[0].x, targets[0].y);

  for (let i = 1; i < targets.length; i++) {
    const d = distance(fromX, fromY, targets[i].x, targets[i].y);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }

  return {
    index: bestIndex,
    x: targets[bestIndex].x,
    y: targets[bestIndex].y,
    distance: bestDist,
  };
}

/**
 * Find N nearest targets, sorted by distance (ascending).
 * Returns fewer than count if not enough targets available.
 */
export function findNearestTargets(
  fromX: number,
  fromY: number,
  count: number,
  targets: readonly Position[],
): TargetResult[] {
  if (count <= 0 || targets.length === 0) return [];

  const all: TargetResult[] = targets.map((t, i) => ({
    index: i,
    x: t.x,
    y: t.y,
    distance: distance(fromX, fromY, t.x, t.y),
  }));

  all.sort((a, b) => a.distance - b.distance);
  return all.slice(0, count);
}

/**
 * Check if a target is within range (inclusive).
 */
export function isInRange(fromX: number, fromY: number, toX: number, toY: number, range: number): boolean {
  return distance(fromX, fromY, toX, toY) <= range;
}

/**
 * Calculate fire angle in radians from source to target.
 * Uses Math.atan2 (standard: right=0, up=-PI/2, left=+/-PI, down=PI/2).
 */
export function calculateFireAngle(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

/**
 * Filter targets within range, returning TargetResult[] sorted by distance.
 */
export function filterTargetsInRange(
  fromX: number,
  fromY: number,
  range: number,
  targets: readonly Position[],
): TargetResult[] {
  const results: TargetResult[] = [];
  for (let i = 0; i < targets.length; i++) {
    const d = distance(fromX, fromY, targets[i].x, targets[i].y);
    if (d <= range) {
      results.push({ index: i, x: targets[i].x, y: targets[i].y, distance: d });
    }
  }
  results.sort((a, b) => a.distance - b.distance);
  return results;
}

/**
 * Predict target position for leading shots.
 * Solves the interception equation:
 *   |targetPos + targetVel * t - sourcePos| = projectileSpeed * t
 * Falls back to current target position if no valid solution.
 */
export function predictTargetPosition(
  targetX: number,
  targetY: number,
  targetVx: number,
  targetVy: number,
  projectileSpeed: number,
  sourceX: number,
  sourceY: number,
): Position {
  // If projectile speed is zero or negative, return current target position
  if (projectileSpeed <= 0) {
    return { x: targetX, y: targetY };
  }

  // Relative position and velocity
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // Quadratic: (vx^2 + vy^2 - ps^2) * t^2 + 2*(dx*vx + dy*vy) * t + (dx^2 + dy^2) = 0
  const a = targetVx * targetVx + targetVy * targetVy - projectileSpeed * projectileSpeed;
  const b = 2 * (dx * targetVx + dy * targetVy);
  const c = dx * dx + dy * dy;

  let t = 0;

  if (Math.abs(a) < 1e-10) {
    // Linear case: projectile speed equals target speed
    if (Math.abs(b) < 1e-10) {
      // No solution or already on target
      t = 0;
    } else {
      t = -c / b;
      if (t < 0) t = 0;
    }
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      // No interception possible, aim at current position
      t = 0;
    } else {
      const sqrtD = Math.sqrt(discriminant);
      const t1 = (-b - sqrtD) / (2 * a);
      const t2 = (-b + sqrtD) / (2 * a);

      // Pick smallest positive finite t
      const validT1 = Number.isFinite(t1) && t1 > 0;
      const validT2 = Number.isFinite(t2) && t2 > 0;
      if (validT1 && validT2) {
        t = Math.min(t1, t2);
      } else if (validT1) {
        t = t1;
      } else if (validT2) {
        t = t2;
      } else {
        t = 0;
      }
    }
  }

  return {
    x: targetX + targetVx * t,
    y: targetY + targetVy * t,
  };
}
