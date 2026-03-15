// ── Neon Survivors: Movement Modifier Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface SpeedMod {
  readonly id: string;
  readonly multiplier: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly source: string;
  readonly stackable: boolean;
}

export interface MovementModState {
  readonly mods: readonly SpeedMod[];
  readonly baseSpeed: number;
  readonly minSpeedMultiplier: number;
  readonly maxSpeedMultiplier: number;
}

// ════════════════════════════════════════════════════════════════
// § DEFAULTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_BASE_SPEED = 200;
const DEFAULT_MIN_MULTIPLIER = 0.1;
const DEFAULT_MAX_MULTIPLIER = 3.0;

// ════════════════════════════════════════════════════════════════
// § createMovementModState
// ════════════════════════════════════════════════════════════════

export function createMovementModState(
  baseSpeed: number = DEFAULT_BASE_SPEED,
): MovementModState {
  return {
    mods: [],
    baseSpeed,
    minSpeedMultiplier: DEFAULT_MIN_MULTIPLIER,
    maxSpeedMultiplier: DEFAULT_MAX_MULTIPLIER,
  };
}

// ════════════════════════════════════════════════════════════════
// § addMod
// ════════════════════════════════════════════════════════════════

export function addMod(
  state: MovementModState,
  id: string,
  multiplier: number,
  duration: number = 0,
  source: string = "unknown",
  stackable: boolean = true,
): MovementModState {
  const newMod: SpeedMod = {
    id,
    multiplier,
    duration,
    elapsed: 0,
    source,
    stackable,
  };

  let filteredMods: readonly SpeedMod[];

  if (!stackable) {
    // Replace existing mods from the same source
    filteredMods = state.mods.filter((m) => m.source !== source);
  } else {
    filteredMods = state.mods;
  }

  return {
    ...state,
    mods: [...filteredMods, newMod],
  };
}

// ════════════════════════════════════════════════════════════════
// § removeMod
// ════════════════════════════════════════════════════════════════

export function removeMod(
  state: MovementModState,
  id: string,
): MovementModState {
  return {
    ...state,
    mods: state.mods.filter((m) => m.id !== id),
  };
}

// ════════════════════════════════════════════════════════════════
// § updateMods
// ════════════════════════════════════════════════════════════════

export function updateMods(
  state: MovementModState,
  deltaMs: number,
): MovementModState {
  const updated = state.mods
    .map((m) => ({
      ...m,
      elapsed: m.elapsed + deltaMs,
    }))
    .filter((m) => m.duration <= 0 || m.elapsed < m.duration);

  return {
    ...state,
    mods: updated,
  };
}

// ════════════════════════════════════════════════════════════════
// § getEffectiveMultiplier
// ════════════════════════════════════════════════════════════════

export function getEffectiveMultiplier(state: MovementModState): number {
  if (state.mods.length === 0) return 1.0;

  const product = state.mods.reduce((acc, m) => acc * m.multiplier, 1.0);
  return Math.min(
    state.maxSpeedMultiplier,
    Math.max(state.minSpeedMultiplier, product),
  );
}

// ════════════════════════════════════════════════════════════════
// § getEffectiveSpeed
// ════════════════════════════════════════════════════════════════

export function getEffectiveSpeed(state: MovementModState): number {
  return state.baseSpeed * getEffectiveMultiplier(state);
}

// ════════════════════════════════════════════════════════════════
// § getModsBySource
// ════════════════════════════════════════════════════════════════

export function getModsBySource(
  state: MovementModState,
  source: string,
): SpeedMod[] {
  return state.mods.filter((m) => m.source === source) as SpeedMod[];
}

// ════════════════════════════════════════════════════════════════
// § getActiveMods
// ════════════════════════════════════════════════════════════════

export function getActiveMods(state: MovementModState): SpeedMod[] {
  return state.mods.filter(
    (m) => m.duration <= 0 || m.elapsed < m.duration,
  ) as SpeedMod[];
}

// ════════════════════════════════════════════════════════════════
// § clearMods
// ════════════════════════════════════════════════════════════════

export function clearMods(state: MovementModState): MovementModState {
  return {
    ...state,
    mods: [],
  };
}

// ════════════════════════════════════════════════════════════════
// § setBaseSpeed
// ════════════════════════════════════════════════════════════════

export function setBaseSpeed(
  state: MovementModState,
  baseSpeed: number,
): MovementModState {
  return {
    ...state,
    baseSpeed,
  };
}

// ════════════════════════════════════════════════════════════════
// § getModCount
// ════════════════════════════════════════════════════════════════

export function getModCount(state: MovementModState): number {
  return state.mods.length;
}

// ════════════════════════════════════════════════════════════════
// § hasMod
// ════════════════════════════════════════════════════════════════

export function hasMod(state: MovementModState, id: string): boolean {
  return state.mods.some((m) => m.id === id);
}
