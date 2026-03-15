/**
 * TrapCalc — Pure TypeScript deployable trap system
 * No Phaser imports. All functions are pure and return new state (immutable).
 */

// ── Types ──────────────────────────────────────────────────────────

export type TrapType = "mine" | "spike" | "slow" | "stun" | "electric";

export interface Trap {
  readonly id: string;
  readonly type: TrapType;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly damage: number;
  readonly duration: number; // ms — effect duration on enemies
  readonly armed: boolean;
  readonly triggered: boolean;
  readonly lifetime: number; // ms
  readonly elapsed: number; // ms
}

export interface TrapState {
  readonly traps: readonly Trap[];
  readonly maxTraps: number;
  readonly nextId: number;
}

// ── Functions ──────────────────────────────────────────────────────

export function createTrapState(maxTraps: number = 10): TrapState {
  return { traps: [], maxTraps, nextId: 1 };
}

export function deployTrap(
  state: TrapState,
  type: TrapType,
  x: number,
  y: number,
  damage: number,
  radius: number = 50,
  lifetime: number = 15000,
  duration: number = 2000,
): TrapState {
  const trap: Trap = {
    id: `trap_${state.nextId}`,
    type,
    x,
    y,
    radius,
    damage,
    duration,
    armed: true,
    triggered: false,
    lifetime,
    elapsed: 0,
  };

  let traps = [...state.traps, trap];

  // Remove oldest if max exceeded
  if (traps.length > state.maxTraps) {
    traps = traps.slice(traps.length - state.maxTraps);
  }

  return { ...state, traps, nextId: state.nextId + 1 };
}

export function updateTraps(state: TrapState, deltaMs: number): TrapState {
  const traps = state.traps
    .map((t) => ({ ...t, elapsed: t.elapsed + deltaMs }))
    .filter((t) => t.elapsed < t.lifetime);

  return { ...state, traps };
}

export function checkTrigger(
  trap: Trap,
  enemyX: number,
  enemyY: number,
): boolean {
  if (!trap.armed || trap.triggered) return false;
  const dx = trap.x - enemyX;
  const dy = trap.y - enemyY;
  return dx * dx + dy * dy <= trap.radius * trap.radius;
}

export function triggerTrap(state: TrapState, trapId: string): TrapState {
  const traps = state.traps.map((t) =>
    t.id === trapId ? { ...t, triggered: true, armed: false } : t,
  );
  return { ...state, traps };
}

export function getArmedTraps(state: TrapState): Trap[] {
  return state.traps.filter((t) => t.armed && !t.triggered);
}

export function getTriggeredTraps(state: TrapState): Trap[] {
  return state.traps.filter((t) => t.triggered);
}

export function removeTrap(state: TrapState, id: string): TrapState {
  const traps = state.traps.filter((t) => t.id !== id);
  return { ...state, traps };
}

export function clearTraps(state: TrapState): TrapState {
  return { ...state, traps: [] };
}

export function getTrapCount(state: TrapState): number {
  return state.traps.length;
}

export function getTrapsInRange(
  state: TrapState,
  x: number,
  y: number,
  range: number,
): Trap[] {
  const r2 = range * range;
  return state.traps.filter((t) => {
    if (!t.armed || t.triggered) return false;
    const dx = t.x - x;
    const dy = t.y - y;
    return dx * dx + dy * dy <= r2;
  });
}
