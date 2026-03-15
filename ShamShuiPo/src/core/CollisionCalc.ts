/**
 * CollisionCalc — pure TypeScript, NO Phaser imports.
 * Optimized collision detection for bullet heaven gameplay.
 */

// ── Types ──

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface AABB {
  x: number; // center x
  y: number; // center y
  halfW: number;
  halfH: number;
}

export interface CollisionPair {
  indexA: number;
  indexB: number;
  distance: number;
}

// ── Distance utilities ──

/** Squared distance between two points (avoids sqrt). */
export function distanceSquared(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/** Euclidean distance between two points. */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

/** Normalize a vector to unit length. Returns (0,0) for zero-length input. */
export function normalize(dx: number, dy: number): { x: number; y: number } {
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: 0, y: 0 };
  const inv = 1 / Math.sqrt(lenSq);
  return { x: dx * inv, y: dy * inv };
}

// ── Collision tests ──

/** Circle vs circle overlap test (uses squared distance). */
export function circleVsCircle(a: Circle, b: Circle): boolean {
  const distSq = distanceSquared(a.x, a.y, b.x, b.y);
  const radSum = a.radius + b.radius;
  return distSq <= radSum * radSum;
}

/** Circle vs axis-aligned bounding box overlap test. */
export function circleVsAABB(circle: Circle, box: AABB): boolean {
  // Find closest point on AABB to circle center
  const closestX = Math.max(
    box.x - box.halfW,
    Math.min(circle.x, box.x + box.halfW),
  );
  const closestY = Math.max(
    box.y - box.halfH,
    Math.min(circle.y, box.y + box.halfH),
  );
  const distSq = distanceSquared(circle.x, circle.y, closestX, closestY);
  return distSq <= circle.radius * circle.radius;
}

/** Check if a point is inside a circle. */
export function pointInCircle(px: number, py: number, circle: Circle): boolean {
  return (
    distanceSquared(px, py, circle.x, circle.y) <= circle.radius * circle.radius
  );
}

// ── Batch operations ──

/**
 * Brute-force O(n*m) collision check between two sets.
 * Returns all pairs within maxDistance.
 */
export function findCollisions(
  entities: Circle[],
  targets: Circle[],
  maxDistance: number,
): CollisionPair[] {
  const pairs: CollisionPair[] = [];
  const maxDistSq = maxDistance * maxDistance;

  for (let a = 0; a < entities.length; a++) {
    const ea = entities[a];
    for (let b = 0; b < targets.length; b++) {
      const tb = targets[b];
      const dSq = distanceSquared(ea.x, ea.y, tb.x, tb.y);
      if (dSq <= maxDistSq) {
        pairs.push({ indexA: a, indexB: b, distance: Math.sqrt(dSq) });
      }
    }
  }

  return pairs;
}

/** Find the closest target to a given point. Returns null if targets is empty. */
export function findNearest(
  x: number,
  y: number,
  targets: Circle[],
): { index: number; distance: number } | null {
  if (targets.length === 0) return null;

  let bestIdx = 0;
  let bestDistSq = distanceSquared(x, y, targets[0].x, targets[0].y);

  for (let i = 1; i < targets.length; i++) {
    const dSq = distanceSquared(x, y, targets[i].x, targets[i].y);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }

  return { index: bestIdx, distance: Math.sqrt(bestDistSq) };
}

// ── Bounds utilities ──

/** Check if position is beyond screen + margin. */
export function isOutOfBounds(
  x: number,
  y: number,
  margin: number,
  width: number,
  height: number,
): boolean {
  return (
    x < -margin || x > width + margin || y < -margin || y > height + margin
  );
}

/** Clamp position within screen bounds (with margin inset). */
export function clampToScreen(
  x: number,
  y: number,
  margin: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(x, width - margin)),
    y: Math.max(margin, Math.min(y, height - margin)),
  };
}

// ── Angle & reflection ──

/** Angle in radians from (x1,y1) to (x2,y2) using atan2. */
export function getAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Reflect velocity vector off a surface normal. */
export function reflect(
  vx: number,
  vy: number,
  nx: number,
  ny: number,
): { vx: number; vy: number } {
  const dot = vx * nx + vy * ny;
  return {
    vx: vx - 2 * dot * nx,
    vy: vy - 2 * dot * ny,
  };
}
