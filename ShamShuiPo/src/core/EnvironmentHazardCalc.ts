// ── Neon Survivors: Environment Hazard Calculator ──
// Pure TypeScript — NO Phaser imports.
// Manages environmental hazard zones that damage/affect players and enemies.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type HazardType =
  | "lava"
  | "poison_fog"
  | "lightning"
  | "ice_field"
  | "acid_pool"
  | "laser_grid";

export interface HazardZone {
  readonly id: string;
  readonly type: HazardType;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly damage: number;
  readonly tickRateMs: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly isActive: boolean;
}

export interface HazardState {
  readonly zones: readonly HazardZone[];
  readonly nextId: number;
}

export interface HazardEffectMeta {
  readonly damage_type: string;
  readonly slow_percent: number;
  readonly dot_interval: number;
}

// ════════════════════════════════════════════════════════════════
// § HAZARD EFFECT TABLE
// ════════════════════════════════════════════════════════════════

const HAZARD_EFFECTS: Record<HazardType, HazardEffectMeta> = {
  lava: { damage_type: "fire", slow_percent: 30, dot_interval: 500 },
  poison_fog: { damage_type: "poison", slow_percent: 0, dot_interval: 1000 },
  lightning: { damage_type: "electric", slow_percent: 0, dot_interval: 2000 },
  ice_field: { damage_type: "cold", slow_percent: 50, dot_interval: 500 },
  acid_pool: { damage_type: "acid", slow_percent: 0, dot_interval: 500 },
  laser_grid: { damage_type: "energy", slow_percent: 0, dot_interval: 300 },
};

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function distSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function isInsideZone(zone: HazardZone, px: number, py: number): boolean {
  return distSq(zone.x, zone.y, px, py) <= zone.radius * zone.radius;
}

// ════════════════════════════════════════════════════════════════
// § PUBLIC API
// ════════════════════════════════════════════════════════════════

/**
 * Create an empty hazard state.
 */
export function createHazardState(): HazardState {
  return { zones: [], nextId: 1 };
}

/**
 * Add a new hazard zone. Returns new state with the zone added.
 */
export function addHazard(
  state: HazardState,
  type: HazardType,
  x: number,
  y: number,
  radius: number,
  damage: number,
  tickRateMs: number,
  duration: number,
): HazardState {
  const zone: HazardZone = {
    id: `hazard_${state.nextId}`,
    type,
    x,
    y,
    radius,
    damage,
    tickRateMs,
    duration,
    elapsed: 0,
    isActive: true,
  };
  return {
    zones: [...state.zones, zone],
    nextId: state.nextId + 1,
  };
}

/**
 * Remove a specific hazard by id.
 */
export function removeHazard(state: HazardState, id: string): HazardState {
  return {
    ...state,
    zones: state.zones.filter((z) => z.id !== id),
  };
}

/**
 * Advance all hazard timers by dt (milliseconds).
 * Deactivates zones that have exceeded their duration.
 */
export function tick(state: HazardState, dt: number): HazardState {
  const updatedZones = state.zones.map((zone) => {
    if (!zone.isActive) return zone;
    const newElapsed = zone.elapsed + dt;
    const stillActive = newElapsed < zone.duration;
    return {
      ...zone,
      elapsed: newElapsed,
      isActive: stillActive,
    };
  });
  return { ...state, zones: updatedZones };
}

/**
 * Get all active hazard zones that overlap a given point.
 */
export function getHazardsAtPoint(
  state: HazardState,
  px: number,
  py: number,
): readonly HazardZone[] {
  return state.zones.filter((z) => z.isActive && isInsideZone(z, px, py));
}

/**
 * Calculate total DPS at a point from all overlapping active hazards.
 * DPS = damage * (1000 / tickRateMs) for each overlapping zone.
 */
export function getDamageAtPoint(
  state: HazardState,
  px: number,
  py: number,
): number {
  const hazards = getHazardsAtPoint(state, px, py);
  return hazards.reduce((total, z) => {
    const dps = z.damage * (1000 / z.tickRateMs);
    return total + dps;
  }, 0);
}

/**
 * Check if any active hazard overlaps the given point.
 */
export function isPointInHazard(
  state: HazardState,
  px: number,
  py: number,
): boolean {
  return state.zones.some((z) => z.isActive && isInsideZone(z, px, py));
}

/**
 * Get effect metadata for a hazard type.
 */
export function getHazardEffect(type: HazardType): HazardEffectMeta {
  return HAZARD_EFFECTS[type];
}

/**
 * Check if damage should be applied this frame based on tick rate.
 * Returns true if the totalElapsed has crossed a tickRate boundary.
 */
export function shouldTickDamage(
  zone: HazardZone,
  totalElapsed: number,
): boolean {
  if (!zone.isActive) return false;
  if (zone.tickRateMs <= 0) return false;
  const prevTicks = Math.floor(zone.elapsed / zone.tickRateMs);
  const currTicks = Math.floor(totalElapsed / zone.tickRateMs);
  return currTicks > prevTicks;
}

/**
 * Count active hazards in state.
 */
export function getActiveHazardCount(state: HazardState): number {
  return state.zones.filter((z) => z.isActive).length;
}

/**
 * Remove all inactive (expired) hazards from the list.
 */
export function clearExpiredHazards(state: HazardState): HazardState {
  return {
    ...state,
    zones: state.zones.filter((z) => z.isActive),
  };
}

/**
 * Warning radius = radius * 1.5 (for UI warning display).
 */
export function getHazardWarningRadius(zone: HazardZone): number {
  return zone.radius * 1.5;
}
