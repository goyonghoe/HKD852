// ── Neon Survivors: Waveform Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface WaveformConfig {
  readonly amplitude: number; // pixels
  readonly frequency: number; // Hz
  readonly phase: number; // radians — initial phase offset
  readonly baseSpeed: number; // pixels/sec
}

export interface WaveformProjectile {
  readonly id: string;
  readonly baseX: number;
  readonly baseY: number;
  readonly angle: number; // radians — travel direction
  readonly elapsed: number; // ms
  readonly config: WaveformConfig;
  readonly active: boolean;
}

// ════════════════════════════════════════════════════════════════
// § DEFAULTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_AMPLITUDE = 30;
const DEFAULT_FREQUENCY = 3;
const DEFAULT_PHASE = 0;
const DEFAULT_BASE_SPEED = 200;

// ════════════════════════════════════════════════════════════════
// § createWaveformConfig
// ════════════════════════════════════════════════════════════════

/**
 * Create a WaveformConfig with sensible defaults.
 * Any fields in `overrides` replace the defaults.
 */
export function createWaveformConfig(
  overrides?: Partial<WaveformConfig>,
): WaveformConfig {
  return {
    amplitude: DEFAULT_AMPLITUDE,
    frequency: DEFAULT_FREQUENCY,
    phase: DEFAULT_PHASE,
    baseSpeed: DEFAULT_BASE_SPEED,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════
// § createWaveformProjectile
// ════════════════════════════════════════════════════════════════

/**
 * Spawn a new waveform projectile at (x, y) travelling in `angle`.
 */
export function createWaveformProjectile(
  id: string,
  x: number,
  y: number,
  angle: number,
  config?: Partial<WaveformConfig>,
): WaveformProjectile {
  return {
    id,
    baseX: x,
    baseY: y,
    angle,
    elapsed: 0,
    config: createWaveformConfig(config),
    active: true,
  };
}

// ════════════════════════════════════════════════════════════════
// § updateWaveform
// ════════════════════════════════════════════════════════════════

/**
 * Advance a projectile's elapsed time by `deltaMs`.
 * Returns a new projectile (immutable).
 */
export function updateWaveform(
  projectile: WaveformProjectile,
  deltaMs: number,
): WaveformProjectile {
  return {
    ...projectile,
    elapsed: projectile.elapsed + deltaMs,
  };
}

// ════════════════════════════════════════════════════════════════
// § getForwardDistance
// ════════════════════════════════════════════════════════════════

/**
 * How far a projectile has travelled along its base direction.
 */
export function getForwardDistance(elapsed: number, speed: number): number {
  return (elapsed / 1000) * speed;
}

// ════════════════════════════════════════════════════════════════
// § getSineOffset
// ════════════════════════════════════════════════════════════════

/**
 * Perpendicular sine-wave displacement at the given elapsed time.
 * amplitude * sin(2π * frequency * elapsed/1000 + phase)
 */
export function getSineOffset(
  elapsed: number,
  amplitude: number,
  frequency: number,
  phase: number,
): number {
  return (
    amplitude * Math.sin(2 * Math.PI * frequency * (elapsed / 1000) + phase)
  );
}

// ════════════════════════════════════════════════════════════════
// § getPerpendicularDirection
// ════════════════════════════════════════════════════════════════

/**
 * Unit vector perpendicular to the given angle (rotated +90°).
 */
export function getPerpendicularDirection(angle: number): {
  dx: number;
  dy: number;
} {
  return {
    dx: -Math.sin(angle),
    dy: Math.cos(angle),
  };
}

// ════════════════════════════════════════════════════════════════
// § getPosition
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the world position of a waveform projectile.
 *
 * Base position advances forward along `angle` at `baseSpeed`.
 * A perpendicular sine-wave offset is added.
 */
export function getPosition(projectile: WaveformProjectile): {
  x: number;
  y: number;
} {
  const { baseX, baseY, angle, elapsed, config } = projectile;
  const forward = getForwardDistance(elapsed, config.baseSpeed);
  const offset = getSineOffset(
    elapsed,
    config.amplitude,
    config.frequency,
    config.phase,
  );
  const perp = getPerpendicularDirection(angle);

  return {
    x: baseX + Math.cos(angle) * forward + perp.dx * offset,
    y: baseY + Math.sin(angle) * forward + perp.dy * offset,
  };
}

// ════════════════════════════════════════════════════════════════
// § deactivate / isActive
// ════════════════════════════════════════════════════════════════

/** Mark a projectile as inactive (immutable). */
export function deactivate(projectile: WaveformProjectile): WaveformProjectile {
  return { ...projectile, active: false };
}

/** Check whether a projectile is active. */
export function isActive(projectile: WaveformProjectile): boolean {
  return projectile.active;
}

// ════════════════════════════════════════════════════════════════
// § getWavelength
// ════════════════════════════════════════════════════════════════

/**
 * Spatial wavelength: how many pixels between successive wave peaks.
 * baseSpeed / frequency
 */
export function getWavelength(config: WaveformConfig): number {
  return config.baseSpeed / config.frequency;
}

// ════════════════════════════════════════════════════════════════
// § setAmplitude / setFrequency
// ════════════════════════════════════════════════════════════════

/** Return a new projectile with updated amplitude. */
export function setAmplitude(
  projectile: WaveformProjectile,
  amplitude: number,
): WaveformProjectile {
  return {
    ...projectile,
    config: { ...projectile.config, amplitude },
  };
}

/** Return a new projectile with updated frequency. */
export function setFrequency(
  projectile: WaveformProjectile,
  frequency: number,
): WaveformProjectile {
  return {
    ...projectile,
    config: { ...projectile.config, frequency },
  };
}
