/**
 * AreaEffectCalc — Pure TypeScript AoE damage calculations.
 * NO Phaser imports. All functions are pure and side-effect free.
 */

// ─── Types ───────────────────────────────────────────────────────

export type AoeType = "circle" | "cone" | "line" | "nova" | "chain_lightning";

export interface AoeConfig {
  readonly type: AoeType;
  readonly originX: number;
  readonly originY: number;
  readonly radius: number;
  /** Direction angle in radians (for cone/line) */
  readonly angle?: number;
  /** Full cone opening angle in radians */
  readonly coneAngle?: number;
  /** Line width in pixels */
  readonly lineWidth?: number;
  /** Line length in pixels */
  readonly lineLength?: number;
  /** Max range per chain hop */
  readonly chainRange?: number;
  /** Max number of chain targets */
  readonly maxChainTargets?: number;
}

export interface Target {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface AoeResult {
  readonly hitTargets: string[];
  readonly damagePerTarget: Map<string, number>;
}

// ─── Internal helpers ────────────────────────────────────────────

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * Normalize an angle to [-PI, PI].
 */
function normalizeAngle(a: number): number {
  let n = a % (2 * Math.PI);
  if (n > Math.PI) n -= 2 * Math.PI;
  if (n < -Math.PI) n += 2 * Math.PI;
  return n;
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * 1. Targets within a circle centred at (cx, cy).
 *    Uses squared distance — no sqrt in hot path.
 */
export function getTargetsInCircle(
  targets: readonly Target[],
  cx: number,
  cy: number,
  radius: number,
): Target[] {
  const rSq = radius * radius;
  return targets.filter((t) => distSq(t.x, t.y, cx, cy) <= rSq);
}

/**
 * 2. Targets inside a cone.
 * @param angle  — centre direction of the cone (radians)
 * @param coneAngle — full opening angle of the cone (radians)
 * @param range  — max reach of the cone
 */
export function getTargetsInCone(
  targets: readonly Target[],
  cx: number,
  cy: number,
  angle: number,
  coneAngle: number,
  range: number,
): Target[] {
  const halfCone = coneAngle / 2;
  const rSq = range * range;
  return targets.filter((t) => {
    if (distSq(t.x, t.y, cx, cy) > rSq) return false;
    const toTarget = Math.atan2(t.y - cy, t.x - cx);
    const diff = Math.abs(normalizeAngle(toTarget - angle));
    return diff <= halfCone;
  });
}

/**
 * 3. Targets inside a rectangle (line AoE).
 * The rectangle extends from (cx,cy) in direction `angle`,
 * with given `width` (perpendicular) and `length` (along direction).
 */
export function getTargetsInLine(
  targets: readonly Target[],
  cx: number,
  cy: number,
  angle: number,
  width: number,
  length: number,
): Target[] {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const halfW = width / 2;

  return targets.filter((t) => {
    const dx = t.x - cx;
    const dy = t.y - cy;
    // Project onto line direction and perpendicular
    const along = dx * cosA + dy * sinA;
    const perp = -dx * sinA + dy * cosA;
    return along >= 0 && along <= length && Math.abs(perp) <= halfW;
  });
}

/**
 * 4. Nova damage falloff: 100% at centre, 25% at edge, linear interpolation.
 *    Returns 0 if distance > maxRadius.
 */
export function calculateNovaDamage(
  baseDamage: number,
  distance: number,
  maxRadius: number,
): number {
  if (distance < 0) return 0;
  if (maxRadius <= 0) return 0;
  if (distance > maxRadius) return 0;
  const t = distance / maxRadius; // 0 at centre, 1 at edge
  const multiplier = 1 - 0.75 * t; // 1.0 → 0.25
  return baseDamage * multiplier;
}

/**
 * 5. Splash damage: 100% at centre, linear falloff to 0 at edge.
 *    Returns 0 if distance >= splashRadius.
 */
export function calculateSplashDamage(
  baseDamage: number,
  distance: number,
  splashRadius: number,
): number {
  if (distance < 0) return 0;
  if (splashRadius <= 0) return 0;
  if (distance >= splashRadius) return 0;
  return baseDamage * (1 - distance / splashRadius);
}

/**
 * 6. Chain lightning: greedy nearest-neighbour chain.
 *    Starting from `startId`, each hop picks the nearest un-visited target
 *    within `chainRange`. Returns ordered array of target IDs (including start).
 */
export function chainLightning(
  targets: readonly Target[],
  startId: string,
  chainRange: number,
  maxChains: number,
): string[] {
  const byId = new Map<string, Target>();
  for (const t of targets) byId.set(t.id, t);

  const start = byId.get(startId);
  if (!start) return [];

  const visited = new Set<string>([startId]);
  const chain: string[] = [startId];
  let current = start;

  while (chain.length - 1 < maxChains) {
    const rSq = chainRange * chainRange;
    let bestDist = Infinity;
    let bestTarget: Target | null = null;

    for (const t of targets) {
      if (visited.has(t.id)) continue;
      const d = distSq(current.x, current.y, t.x, t.y);
      if (d <= rSq && d < bestDist) {
        bestDist = d;
        bestTarget = t;
      }
    }

    if (!bestTarget) break;
    visited.add(bestTarget.id);
    chain.push(bestTarget.id);
    current = bestTarget;
  }

  return chain;
}

/**
 * 7. Damage per chain hop: baseDamage * (decayRate ^ chainIndex).
 *    Index 0 = first target = full damage.
 */
export function chainLightningDamage(
  baseDamage: number,
  chainIndex: number,
  decayRate: number = 0.7,
): number {
  if (chainIndex < 0) return 0;
  return baseDamage * Math.pow(decayRate, chainIndex);
}

/**
 * 8. Full AoE resolution: find hit targets + calculate per-target damage.
 */
export function resolveAoe(
  config: AoeConfig,
  targets: readonly Target[],
  baseDamage: number,
): AoeResult {
  const damagePerTarget = new Map<string, number>();

  switch (config.type) {
    case "circle": {
      const hits = getTargetsInCircle(
        targets,
        config.originX,
        config.originY,
        config.radius,
      );
      for (const t of hits) {
        damagePerTarget.set(t.id, baseDamage);
      }
      return { hitTargets: hits.map((t) => t.id), damagePerTarget };
    }

    case "cone": {
      const angle = config.angle ?? 0;
      const coneAngle = config.coneAngle ?? Math.PI / 3;
      const hits = getTargetsInCone(
        targets,
        config.originX,
        config.originY,
        angle,
        coneAngle,
        config.radius,
      );
      for (const t of hits) {
        damagePerTarget.set(t.id, baseDamage);
      }
      return { hitTargets: hits.map((t) => t.id), damagePerTarget };
    }

    case "line": {
      const angle = config.angle ?? 0;
      const width = config.lineWidth ?? 20;
      const length = config.lineLength ?? config.radius;
      const hits = getTargetsInLine(
        targets,
        config.originX,
        config.originY,
        angle,
        width,
        length,
      );
      for (const t of hits) {
        damagePerTarget.set(t.id, baseDamage);
      }
      return { hitTargets: hits.map((t) => t.id), damagePerTarget };
    }

    case "nova": {
      const hits = getTargetsInCircle(
        targets,
        config.originX,
        config.originY,
        config.radius,
      );
      for (const t of hits) {
        const dist = Math.sqrt(
          distSq(t.x, t.y, config.originX, config.originY),
        );
        damagePerTarget.set(
          t.id,
          calculateNovaDamage(baseDamage, dist, config.radius),
        );
      }
      return { hitTargets: hits.map((t) => t.id), damagePerTarget };
    }

    case "chain_lightning": {
      const chainRange = config.chainRange ?? config.radius;
      const maxChains = config.maxChainTargets ?? 3;
      // Find nearest target to origin as start
      const inRange = getTargetsInCircle(
        targets,
        config.originX,
        config.originY,
        chainRange,
      );
      if (inRange.length === 0) {
        return { hitTargets: [], damagePerTarget };
      }
      // Pick closest to origin as the first target
      let closest = inRange[0];
      let closestDist = distSq(
        closest.x,
        closest.y,
        config.originX,
        config.originY,
      );
      for (let i = 1; i < inRange.length; i++) {
        const d = distSq(
          inRange[i].x,
          inRange[i].y,
          config.originX,
          config.originY,
        );
        if (d < closestDist) {
          closestDist = d;
          closest = inRange[i];
        }
      }

      const chain = chainLightning(targets, closest.id, chainRange, maxChains);
      for (let i = 0; i < chain.length; i++) {
        damagePerTarget.set(chain[i], chainLightningDamage(baseDamage, i));
      }
      return { hitTargets: chain, damagePerTarget };
    }
  }
}

/**
 * 9. Calculate the area of an AoE shape in square pixels.
 */
export function getAoeArea(config: AoeConfig): number {
  switch (config.type) {
    case "circle":
    case "nova":
    case "chain_lightning":
      return Math.PI * config.radius * config.radius;

    case "cone": {
      const coneAngle = config.coneAngle ?? Math.PI / 3;
      // Sector area = (angle / 2) * r^2
      return (coneAngle / 2) * config.radius * config.radius;
    }

    case "line": {
      const width = config.lineWidth ?? 20;
      const length = config.lineLength ?? config.radius;
      return width * length;
    }
  }
}

/**
 * 10. Check if a point (px, py) falls inside the AoE shape.
 */
export function isPointInAoe(
  config: AoeConfig,
  px: number,
  py: number,
): boolean {
  switch (config.type) {
    case "circle":
    case "nova":
    case "chain_lightning": {
      return (
        distSq(px, py, config.originX, config.originY) <=
        config.radius * config.radius
      );
    }

    case "cone": {
      const rSq = config.radius * config.radius;
      if (distSq(px, py, config.originX, config.originY) > rSq) return false;
      const angle = config.angle ?? 0;
      const coneAngle = config.coneAngle ?? Math.PI / 3;
      const toPoint = Math.atan2(py - config.originY, px - config.originX);
      return Math.abs(normalizeAngle(toPoint - angle)) <= coneAngle / 2;
    }

    case "line": {
      const angle = config.angle ?? 0;
      const width = config.lineWidth ?? 20;
      const length = config.lineLength ?? config.radius;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const dx = px - config.originX;
      const dy = py - config.originY;
      const along = dx * cosA + dy * sinA;
      const perp = -dx * sinA + dy * cosA;
      return along >= 0 && along <= length && Math.abs(perp) <= width / 2;
    }
  }
}
