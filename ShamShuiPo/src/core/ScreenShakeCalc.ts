// ScreenShakeCalc — Screen Shake Intensity/Decay System
// Pure TypeScript, no Phaser imports, immutable state

export interface ShakeConfig {
  readonly maxIntensity: number; // pixels
  readonly decayRate: number; // multiplier per second (e.g. 5.0 means exponential decay)
  readonly minIntensity: number; // threshold to stop
}

export interface ShakeInstance {
  readonly id: number;
  readonly intensity: number;
  readonly elapsed: number; // ms
  readonly duration: number; // ms
  readonly frequency: number; // shakes per second
}

export interface ShakeState {
  readonly config: ShakeConfig;
  readonly shakes: readonly ShakeInstance[];
  readonly nextId: number;
}

const DEFAULT_CONFIG: ShakeConfig = {
  maxIntensity: 20,
  decayRate: 5.0,
  minIntensity: 0.5,
};

export function createShakeState(config?: Partial<ShakeConfig>): ShakeState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    shakes: [],
    nextId: 1,
  };
}

export function addShake(
  state: ShakeState,
  intensity: number,
  duration: number,
  frequency: number = 30,
): ShakeState {
  const capped = Math.min(Math.max(intensity, 0), state.config.maxIntensity);
  const shake: ShakeInstance = {
    id: state.nextId,
    intensity: capped,
    elapsed: 0,
    duration,
    frequency,
  };
  return {
    ...state,
    shakes: [...state.shakes, shake],
    nextId: state.nextId + 1,
  };
}

export function getDecayedIntensity(
  intensity: number,
  decayRate: number,
  deltaMs: number,
): number {
  return intensity * Math.exp((-decayRate * deltaMs) / 1000);
}

export function updateShakes(state: ShakeState, deltaMs: number): ShakeState {
  const { config } = state;
  const updated: ShakeInstance[] = [];

  for (const shake of state.shakes) {
    const newElapsed = shake.elapsed + deltaMs;
    if (newElapsed >= shake.duration) continue;

    const newIntensity = getDecayedIntensity(
      shake.intensity,
      config.decayRate,
      deltaMs,
    );
    if (newIntensity < config.minIntensity) continue;

    updated.push({
      ...shake,
      intensity: newIntensity,
      elapsed: newElapsed,
    });
  }

  return { ...state, shakes: updated };
}

export function getOffset(
  state: ShakeState,
  rng: () => number = Math.random,
): { x: number; y: number } {
  if (state.shakes.length === 0) return { x: 0, y: 0 };

  let x = 0;
  let y = 0;

  for (const shake of state.shakes) {
    const angle = rng() * Math.PI * 2;
    const magnitude = shake.intensity * rng();
    x += Math.cos(angle) * magnitude;
    y += Math.sin(angle) * magnitude;
  }

  // Cap combined offset to maxIntensity
  const dist = Math.sqrt(x * x + y * y);
  if (dist > state.config.maxIntensity) {
    const scale = state.config.maxIntensity / dist;
    x *= scale;
    y *= scale;
  }

  return { x, y };
}

export function getTotalIntensity(state: ShakeState): number {
  let total = 0;
  for (const shake of state.shakes) {
    total += shake.intensity;
  }
  return Math.min(total, state.config.maxIntensity);
}

export function getActiveShakeCount(state: ShakeState): number {
  return state.shakes.length;
}

export function clearShakes(state: ShakeState): ShakeState {
  return { ...state, shakes: [] };
}

export function isShaking(state: ShakeState): boolean {
  return state.shakes.length > 0;
}
