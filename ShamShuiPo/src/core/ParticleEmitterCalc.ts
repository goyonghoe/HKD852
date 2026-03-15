// ── Neon Survivors: Particle Emitter Calculations ──
// Pure TypeScript — NO Phaser imports. All functions pure/immutable.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  alpha: number;
  scale: number;
  color: number;
  active: boolean;
}

export interface ParticlePreset {
  count: number;
  speed: number;
  lifetime: number;
  spreadAngle: number; // radians
  color: number; // hex
  gravity: number; // px/s^2 (positive = downward)
  fade: boolean; // whether alpha fades over lifetime
  scaleCurve: { start: number; end: number };
}

export interface ParticleState {
  particles: readonly Particle[];
  nextId: number;
}

// ════════════════════════════════════════════════════════════════
// § PRESET NAMES
// ════════════════════════════════════════════════════════════════

export type PresetName =
  | "explosion"
  | "spark"
  | "smoke"
  | "blood"
  | "heal"
  | "levelup";

// ════════════════════════════════════════════════════════════════
// § PRESETS
// ════════════════════════════════════════════════════════════════

const PRESETS: Record<PresetName, ParticlePreset> = {
  explosion: {
    count: 20,
    speed: 200,
    lifetime: 0.6,
    spreadAngle: Math.PI * 2,
    color: 0xff6600,
    gravity: 80,
    fade: true,
    scaleCurve: { start: 1.0, end: 0.2 },
  },
  spark: {
    count: 10,
    speed: 300,
    lifetime: 0.3,
    spreadAngle: Math.PI * 2,
    color: 0xffff00,
    gravity: 0,
    fade: true,
    scaleCurve: { start: 0.5, end: 0.1 },
  },
  smoke: {
    count: 8,
    speed: 30,
    lifetime: 1.5,
    spreadAngle: Math.PI / 4,
    color: 0x888888,
    gravity: -15,
    fade: true,
    scaleCurve: { start: 0.5, end: 2.0 },
  },
  blood: {
    count: 12,
    speed: 150,
    lifetime: 0.5,
    spreadAngle: Math.PI,
    color: 0xcc0000,
    gravity: 300,
    fade: true,
    scaleCurve: { start: 0.8, end: 0.3 },
  },
  heal: {
    count: 6,
    speed: 40,
    lifetime: 1.0,
    spreadAngle: Math.PI / 3,
    color: 0x00ff88,
    gravity: -20,
    fade: true,
    scaleCurve: { start: 0.6, end: 1.2 },
  },
  levelup: {
    count: 25,
    speed: 100,
    lifetime: 1.2,
    spreadAngle: Math.PI * 2,
    color: 0xffdd00,
    gravity: -30,
    fade: true,
    scaleCurve: { start: 0.8, end: 1.5 },
  },
};

// Custom presets registry (separate from built-in)
const customPresets: Map<string, ParticlePreset> = new Map();

// ════════════════════════════════════════════════════════════════
// § DETERMINISTIC SEED (for testability)
// ════════════════════════════════════════════════════════════════

let _randomFn: () => number = Math.random;

/** Override random function (for deterministic tests). */
export function setRandomFn(fn: () => number): void {
  _randomFn = fn;
}

/** Reset to Math.random. */
export function resetRandomFn(): void {
  _randomFn = Math.random;
}

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

/** Create a new empty emitter state. */
export function createEmitter(): ParticleState {
  return {
    particles: [],
    nextId: 1,
  };
}

// ════════════════════════════════════════════════════════════════
// § EMISSION
// ════════════════════════════════════════════════════════════════

function spawnParticle(
  id: number,
  x: number,
  y: number,
  preset: ParticlePreset,
): Particle {
  const angle = (_randomFn() - 0.5) * preset.spreadAngle;
  const speed = preset.speed * (0.7 + _randomFn() * 0.6); // 70%-130% variance

  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0,
    maxAge: preset.lifetime,
    alpha: 1,
    scale: preset.scaleCurve.start,
    color: preset.color,
    active: true,
  };
}

/** Spawn particles at (x, y) using a preset or preset name. */
export function emit(
  state: ParticleState,
  x: number,
  y: number,
  presetOrName: ParticlePreset | PresetName,
): ParticleState {
  const preset =
    typeof presetOrName === "string" ? getPreset(presetOrName) : presetOrName;

  const newParticles: Particle[] = [];
  let nextId = state.nextId;

  for (let i = 0; i < preset.count; i++) {
    newParticles.push(spawnParticle(nextId++, x, y, preset));
  }

  return {
    particles: [...state.particles, ...newParticles],
    nextId,
  };
}

// ════════════════════════════════════════════════════════════════
// § TICK / UPDATE
// ════════════════════════════════════════════════════════════════

function updateParticle(
  p: Particle,
  dt: number,
  preset: ParticlePreset,
): Particle {
  if (!p.active) return p;

  const newAge = p.age + dt;

  if (newAge >= p.maxAge) {
    return { ...p, age: newAge, alpha: 0, scale: 0, active: false };
  }

  const t = newAge / p.maxAge;

  // Alpha: linear fade from 1 to 0 over lifetime if fade enabled
  const newAlpha = preset.fade ? Math.max(0, Math.min(1, 1 - t)) : 1;

  // Scale: linear interpolation from start to end
  const newScale = Math.max(
    0,
    preset.scaleCurve.start +
      (preset.scaleCurve.end - preset.scaleCurve.start) * t,
  );

  return {
    ...p,
    x: p.x + p.vx * dt,
    y: p.y + p.vy * dt + 0.5 * preset.gravity * dt * dt,
    vx: p.vx,
    vy: p.vy + preset.gravity * dt,
    age: newAge,
    alpha: newAlpha,
    scale: newScale,
    active: newAlpha > 0,
  };
}

/**
 * Advance all particles by dt seconds. Apply gravity, fade, remove dead.
 */
export function tickParticles(
  state: ParticleState,
  dt: number,
  preset: ParticlePreset,
): ParticleState {
  const updated = state.particles.map((p) => updateParticle(p, dt, preset));
  const alive = updated.filter((p) => p.active);
  return {
    particles: alive,
    nextId: state.nextId,
  };
}

// ════════════════════════════════════════════════════════════════
// § STATE QUERIES
// ════════════════════════════════════════════════════════════════

/** Get all currently active particles. */
export function getActiveParticles(state: ParticleState): readonly Particle[] {
  return state.particles.filter((p) => p.active);
}

/** Remove all particles, returning a clean state. */
export function clearParticles(state: ParticleState): ParticleState {
  return {
    particles: [],
    nextId: state.nextId,
  };
}

// ════════════════════════════════════════════════════════════════
// § PRESETS API
// ════════════════════════════════════════════════════════════════

/** Get a built-in or custom preset config by name. Returns a deep copy. */
export function getPreset(name: PresetName | string): ParticlePreset {
  if (name in PRESETS) {
    const p = PRESETS[name as PresetName];
    return {
      ...p,
      scaleCurve: { ...p.scaleCurve },
    };
  }

  const custom = customPresets.get(name);
  if (custom) {
    return {
      ...custom,
      scaleCurve: { ...custom.scaleCurve },
    };
  }

  throw new Error(`Unknown particle preset: ${name}`);
}

/** Register a custom preset. Returns the stored preset copy. */
export function createCustomPreset(
  name: string,
  preset: ParticlePreset,
): ParticlePreset {
  const copy: ParticlePreset = {
    ...preset,
    scaleCurve: { ...preset.scaleCurve },
  };
  customPresets.set(name, copy);
  return copy;
}

/** Clear all custom presets (useful for test teardown). */
export function clearCustomPresets(): void {
  customPresets.clear();
}
