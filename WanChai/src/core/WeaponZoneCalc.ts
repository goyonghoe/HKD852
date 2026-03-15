/**
 * WeaponZoneCalc — pure math functions for AOE zone logic.
 * Extracted from WeaponSystem.ts for testability.
 *
 * RULE M-001: Zero Phaser imports (pure TS only).
 * RULE M-002: No magic numbers — all balance values parameterized.
 */

export interface Position {
  x: number;
  y: number;
}

export interface NapalmZoneState {
  x: number;
  y: number;
  radius: number;
  damage: number;
  remainingMs: number;
  tickMs: number;
  tickTimer: number;
}

export interface NapalmTickResult {
  expired: boolean;
  shouldTick: boolean;
  updatedZone: NapalmZoneState;
}

export interface BatchTickResult {
  activeZones: NapalmZoneState[];
  tickingIndices: number[];
}

/**
 * Calculate the centroid (average position) of a set of positions.
 * Guard: empty array returns {x: 0, y: 0}.
 */
export function calculateCentroid(positions: Position[]): Position {
  if (positions.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < positions.length; i++) {
    sumX += positions[i].x;
    sumY += positions[i].y;
  }
  return {
    x: sumX / positions.length,
    y: sumY / positions.length,
  };
}

/**
 * Check which positions fall within a circular AOE.
 * Returns indices where dx*dx + dy*dy < radius*radius (strict less-than).
 */
export function checkAoeHits(positions: Position[], centerX: number, centerY: number, radius: number): number[] {
  const radiusSq = radius * radius;
  const hitIndices: number[] = [];

  for (let i = 0; i < positions.length; i++) {
    const dx = positions[i].x - centerX;
    const dy = positions[i].y - centerY;
    if (dx * dx + dy * dy < radiusSq) {
      hitIndices.push(i);
    }
  }
  return hitIndices;
}

/**
 * Tick a single napalm zone forward by `delta` ms.
 * Does NOT mutate the input — returns a new updated zone state.
 *
 * - Subtract delta from remainingMs. If <= 0, expired=true.
 * - Subtract delta from tickTimer. If <= 0, shouldTick=true, reset tickTimer to tickMs.
 */
export function tickNapalmZone(zone: NapalmZoneState, delta: number): NapalmTickResult {
  const newRemaining = zone.remainingMs - delta;
  const expired = newRemaining <= 0;

  let newTickTimer = zone.tickTimer - delta;
  let shouldTick = false;

  if (newTickTimer <= 0) {
    shouldTick = true;
    newTickTimer = zone.tickMs;
  }

  return {
    expired,
    shouldTick,
    updatedZone: {
      ...zone,
      remainingMs: newRemaining,
      tickTimer: newTickTimer,
    },
  };
}

/**
 * Tick all napalm zones. Remove expired zones. Return indices of zones that should tick.
 * tickingIndices refer to INPUT array indices — caller can look up original zone.
 * Expired zones that tick on their last frame are included in tickingIndices.
 */
export function batchTickNapalmZones(zones: NapalmZoneState[], delta: number): BatchTickResult {
  const activeZones: NapalmZoneState[] = [];
  const tickingIndices: number[] = [];

  for (let i = 0; i < zones.length; i++) {
    const result = tickNapalmZone(zones[i], delta);
    if (result.shouldTick) {
      tickingIndices.push(i); // Use INPUT index — caller can look up original zone
    }
    if (!result.expired) {
      activeZones.push(result.updatedZone);
    }
  }

  return { activeZones, tickingIndices };
}

/**
 * Calculate napalm projectile flight time based on distance.
 * Formula: clamp(dist * 0.5, 200, 500)
 */
export function calculateNapalmFlightTime(playerX: number, playerY: number, targetX: number, targetY: number): number {
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(200, Math.min(500, dist * 0.5));
}

/**
 * Calculate barrel offset relative to player for muzzle flash positioning.
 * - aoe/bomb/napalm: straight up {x: 0, y: -barrelDist}
 * - others: directional {x: cos(angle)*barrelDist, y: sin(angle)*barrelDist}
 */
export function calculateBarrelOffset(weaponType: string, barrelDist: number, angle: number): Position {
  if (weaponType === 'aoe' || weaponType === 'bomb' || weaponType === 'napalm') {
    return { x: 0, y: -barrelDist };
  }
  return {
    x: Math.cos(angle) * barrelDist,
    y: Math.sin(angle) * barrelDist,
  };
}

/**
 * Calculate AOE zone radius for bomb/napalm weapons.
 * Formula: baseRadius + level * 15
 */
export function calculateZoneRadius(baseRadius: number, level: number): number {
  return baseRadius + level * 15;
}
