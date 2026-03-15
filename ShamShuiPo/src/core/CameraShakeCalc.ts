/**
 * CameraShakeCalc — pure TypeScript, NO Phaser imports.
 * Computes camera shake intensity and offset for game events.
 */

export type ShakeEvent =
  | "hit"
  | "crit"
  | "boss_hit"
  | "explosion"
  | "level_up"
  | "death";

export interface ShakeConfig {
  intensity: number; // max pixel offset
  duration: number; // seconds
  frequency: number; // oscillations per second
  decay: number; // exponential decay rate (higher = faster decay)
}

export interface ShakeState {
  active: boolean;
  timer: number; // remaining seconds
  config: ShakeConfig;
  offsetX: number; // current pixel offset
  offsetY: number;
}

// Default shake configs per event
const SHAKE_CONFIGS: Record<ShakeEvent, ShakeConfig> = {
  hit: { intensity: 2, duration: 0.15, frequency: 30, decay: 8 },
  crit: { intensity: 4, duration: 0.2, frequency: 25, decay: 6 },
  boss_hit: { intensity: 6, duration: 0.3, frequency: 20, decay: 5 },
  explosion: { intensity: 8, duration: 0.4, frequency: 15, decay: 4 },
  level_up: { intensity: 3, duration: 0.25, frequency: 20, decay: 7 },
  death: { intensity: 10, duration: 0.5, frequency: 12, decay: 3 },
};

/** Create an inactive default shake state */
export function createShakeState(): ShakeState {
  return {
    active: false,
    timer: 0,
    config: { intensity: 0, duration: 0, frequency: 0, decay: 0 },
    offsetX: 0,
    offsetY: 0,
  };
}

/** Start a shake. Stronger shakes override weaker ones mid-shake. */
export function triggerShake(state: ShakeState, event: ShakeEvent): ShakeState {
  const config = SHAKE_CONFIGS[event];

  // If already shaking, only override if new event is stronger
  if (state.active && config.intensity <= state.config.intensity) {
    return state;
  }

  return {
    active: true,
    timer: config.duration,
    config: { ...config },
    offsetX: 0,
    offsetY: 0,
  };
}

/** Update offsets each frame using sine oscillation + exponential decay */
export function tickShake(state: ShakeState, dt: number): ShakeState {
  if (!state.active) return state;
  if (dt === 0) return state;

  const newTimer = state.timer - dt;

  if (newTimer <= 0) {
    return {
      ...state,
      active: false,
      timer: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const { intensity, duration, frequency, decay } = state.config;
  const elapsed = duration - newTimer;
  const decayFactor = Math.exp(-decay * elapsed);
  const angle = elapsed * frequency * 2 * Math.PI;

  const offsetX = Math.sin(angle) * intensity * decayFactor;
  const offsetY = Math.cos(angle * 1.3) * intensity * decayFactor * 0.7;

  return {
    ...state,
    timer: newTimer,
    offsetX,
    offsetY,
  };
}

/** Get config for an event */
export function getShakeConfig(event: ShakeEvent): ShakeConfig {
  return { ...SHAKE_CONFIGS[event] };
}

/** Simple check if currently shaking */
export function isShaking(state: ShakeState): boolean {
  return state.active;
}

/** Returns max pixel offset for event */
export function getMaxIntensity(event: ShakeEvent): number {
  return SHAKE_CONFIGS[event].intensity;
}
