/**
 * OrbitalCalc — Pure TypeScript orbital weapon calculations.
 * NO Phaser imports. All functions are pure and side-effect free.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface Orbital {
  readonly id: string;
  readonly angle: number;
  readonly radius: number;
  readonly speed: number;
  readonly damage: number;
  readonly size: number;
  readonly active: boolean;
}

export interface OrbitalConfig {
  readonly baseRadius: number;
  readonly baseSpeed: number;
  readonly baseDamage: number;
  readonly baseSize: number;
}

export interface OrbitalState {
  readonly config: OrbitalConfig;
  readonly orbitals: readonly Orbital[];
  readonly maxOrbitals: number;
}

// ─── Defaults ────────────────────────────────────────────────────

const DEFAULT_CONFIG: OrbitalConfig = {
  baseRadius: 80,
  baseSpeed: 2.0,
  baseDamage: 15,
  baseSize: 16,
};

const DEFAULT_MAX_ORBITALS = 8;

// ─── ID generation ───────────────────────────────────────────────

let _idCounter = 0;

function generateId(): string {
  return `orb_${++_idCounter}`;
}

// ─── Functions ───────────────────────────────────────────────────

export function createOrbitalState(
  config?: Partial<OrbitalConfig>,
  maxOrbitals?: number,
): OrbitalState {
  const merged: OrbitalConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    config: merged,
    orbitals: [],
    maxOrbitals: maxOrbitals ?? DEFAULT_MAX_ORBITALS,
  };
}

export function addOrbital(state: OrbitalState): OrbitalState {
  if (state.orbitals.length >= state.maxOrbitals) {
    return state;
  }

  const count = state.orbitals.length + 1;
  const newOrbital: Orbital = {
    id: generateId(),
    angle: (state.orbitals.length * 2 * Math.PI) / count,
    radius: state.config.baseRadius,
    speed: state.config.baseSpeed,
    damage: state.config.baseDamage,
    size: state.config.baseSize,
    active: true,
  };

  const orbitals = [...state.orbitals, newOrbital];

  // Redistribute angles evenly for all orbitals
  const redistributed = orbitals.map((orb, i) => ({
    ...orb,
    angle: (i * 2 * Math.PI) / count,
  }));

  return { ...state, orbitals: redistributed };
}

export function removeOrbital(state: OrbitalState, id: string): OrbitalState {
  const filtered = state.orbitals.filter((o) => o.id !== id);
  if (filtered.length === state.orbitals.length) {
    return state;
  }
  return { ...state, orbitals: filtered };
}

export function updateOrbitals(
  state: OrbitalState,
  deltaMs: number,
): OrbitalState {
  const deltaSec = deltaMs / 1000;
  const updated = state.orbitals.map((orb) => ({
    ...orb,
    angle: orb.angle + orb.speed * deltaSec,
  }));
  return { ...state, orbitals: updated };
}

export function getOrbitalPosition(
  orbital: Orbital,
  centerX: number,
  centerY: number,
): { x: number; y: number } {
  return {
    x: centerX + Math.cos(orbital.angle) * orbital.radius,
    y: centerY + Math.sin(orbital.angle) * orbital.radius,
  };
}

export function getAllPositions(
  state: OrbitalState,
  centerX: number,
  centerY: number,
): readonly { id: string; x: number; y: number }[] {
  return state.orbitals.map((orb) => {
    const pos = getOrbitalPosition(orb, centerX, centerY);
    return { id: orb.id, x: pos.x, y: pos.y };
  });
}

export function redistributeAngles(state: OrbitalState): OrbitalState {
  const count = state.orbitals.length;
  if (count === 0) return state;

  const redistributed = state.orbitals.map((orb, i) => ({
    ...orb,
    angle: (i * 2 * Math.PI) / count,
  }));

  return { ...state, orbitals: redistributed };
}

export function setRadius(state: OrbitalState, radius: number): OrbitalState {
  const updated = state.orbitals.map((orb) => ({
    ...orb,
    radius,
  }));
  return { ...state, orbitals: updated };
}

export function setSpeed(state: OrbitalState, speed: number): OrbitalState {
  const updated = state.orbitals.map((orb) => ({
    ...orb,
    speed,
  }));
  return { ...state, orbitals: updated };
}

export function getOrbitalCount(state: OrbitalState): number {
  return state.orbitals.length;
}

export function checkCollision(
  orbitalX: number,
  orbitalY: number,
  orbitalSize: number,
  targetX: number,
  targetY: number,
  targetSize: number,
): boolean {
  const dx = orbitalX - targetX;
  const dy = orbitalY - targetY;
  const distSq = dx * dx + dy * dy;
  const radiiSum = orbitalSize + targetSize;
  return distSq <= radiiSum * radiiSum;
}
