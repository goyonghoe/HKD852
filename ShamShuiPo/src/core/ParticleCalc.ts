// ── Neon Survivors: Particle Effect Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type ParticleEffect =
  | "explosion"
  | "hit_spark"
  | "death_burst"
  | "xp_collect"
  | "level_up"
  | "heal"
  | "crit_flash";

export interface Particle {
  x: number;
  y: number;
  vx: number; // velocity X (px/s)
  vy: number; // velocity Y (px/s)
  life: number; // remaining lifetime (seconds)
  maxLife: number; // initial lifetime
  size: number; // current size
  color: number; // hex color
  alpha: number; // 0-1
  rotation: number; // radians
}

export interface ParticleConfig {
  count: number;
  speed: { min: number; max: number };
  lifetime: { min: number; max: number };
  size: { min: number; max: number };
  color: number;
  gravity: number; // px/s^2 downward
  fadeOut: boolean;
  shrink: boolean;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;

// ════════════════════════════════════════════════════════════════
// § EFFECT PRESETS
// ════════════════════════════════════════════════════════════════

const EFFECT_CONFIGS: Record<ParticleEffect, ParticleConfig> = {
  explosion: {
    count: 24,
    speed: { min: 80, max: 200 },
    lifetime: { min: 0.3, max: 0.6 },
    size: { min: 3, max: 8 },
    color: 0xff6600,
    gravity: 120,
    fadeOut: true,
    shrink: true,
  },
  hit_spark: {
    count: 6,
    speed: { min: 60, max: 140 },
    lifetime: { min: 0.1, max: 0.25 },
    size: { min: 2, max: 4 },
    color: 0xffffff,
    gravity: 0,
    fadeOut: true,
    shrink: false,
  },
  death_burst: {
    count: 16,
    speed: { min: 40, max: 160 },
    lifetime: { min: 0.4, max: 0.8 },
    size: { min: 4, max: 10 },
    color: 0xff0044,
    gravity: 80,
    fadeOut: true,
    shrink: true,
  },
  xp_collect: {
    count: 8,
    speed: { min: 20, max: 60 },
    lifetime: { min: 0.2, max: 0.4 },
    size: { min: 2, max: 5 },
    color: 0x00ffaa,
    gravity: -40,
    fadeOut: true,
    shrink: false,
  },
  level_up: {
    count: 32,
    speed: { min: 60, max: 180 },
    lifetime: { min: 0.5, max: 1.0 },
    size: { min: 3, max: 7 },
    color: 0xffdd00,
    gravity: -20,
    fadeOut: true,
    shrink: true,
  },
  heal: {
    count: 10,
    speed: { min: 30, max: 80 },
    lifetime: { min: 0.3, max: 0.6 },
    size: { min: 3, max: 6 },
    color: 0x00ff66,
    gravity: -60,
    fadeOut: true,
    shrink: false,
  },
  crit_flash: {
    count: 12,
    speed: { min: 100, max: 220 },
    lifetime: { min: 0.15, max: 0.35 },
    size: { min: 2, max: 6 },
    color: 0xffff00,
    gravity: 0,
    fadeOut: true,
    shrink: true,
  },
};

// ════════════════════════════════════════════════════════════════
// § SEEDED PRNG
// ════════════════════════════════════════════════════════════════

/**
 * Simple seeded PRNG (mulberry32).
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════
// § getEffectConfig
// ════════════════════════════════════════════════════════════════

/**
 * Return the preset particle config for a given effect type.
 */
export function getEffectConfig(effect: ParticleEffect): ParticleConfig {
  return { ...EFFECT_CONFIGS[effect] };
}

// ════════════════════════════════════════════════════════════════
// § generateParticles
// ════════════════════════════════════════════════════════════════

/**
 * Create an initial batch of particles at the given position.
 * Deterministic output when `seed` is provided.
 */
export function generateParticles(
  effect: ParticleEffect,
  x: number,
  y: number,
  seed?: number,
): Particle[] {
  const config = EFFECT_CONFIGS[effect];
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const particles: Particle[] = [];

  for (let i = 0; i < config.count; i++) {
    const angle = rand() * TWO_PI;
    const speed =
      config.speed.min + rand() * (config.speed.max - config.speed.min);
    const life =
      config.lifetime.min +
      rand() * (config.lifetime.max - config.lifetime.min);
    const size = config.size.min + rand() * (config.size.max - config.size.min);

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size,
      color: config.color,
      alpha: 1,
      rotation: rand() * TWO_PI,
    });
  }

  return particles;
}

// ════════════════════════════════════════════════════════════════
// § isAlive
// ════════════════════════════════════════════════════════════════

/**
 * A particle is alive if it has remaining lifetime and visible alpha.
 */
export function isAlive(particle: Particle): boolean {
  return particle.life > 0 && particle.alpha > 0;
}

// ════════════════════════════════════════════════════════════════
// § getParticleAlpha
// ════════════════════════════════════════════════════════════════

/**
 * Linear fade from 1 → 0 over the particle's lifetime.
 */
export function getParticleAlpha(particle: Particle): number {
  if (particle.maxLife <= 0) return 0;
  const ratio = Math.max(0, particle.life / particle.maxLife);
  return Math.min(1, ratio);
}

// ════════════════════════════════════════════════════════════════
// § getParticleSize
// ════════════════════════════════════════════════════════════════

/**
 * If shrink is enabled, size linearly decreases from initial to 0 over lifetime.
 * Otherwise returns the particle's current size unchanged.
 */
export function getParticleSize(particle: Particle, shrink: boolean): number {
  if (!shrink) return particle.size;
  if (particle.maxLife <= 0) return 0;
  const ratio = Math.max(0, particle.life / particle.maxLife);
  return particle.size * ratio;
}

// ════════════════════════════════════════════════════════════════
// § tickParticle
// ════════════════════════════════════════════════════════════════

/**
 * Advance a single particle by `dt` seconds.
 * Applies velocity, gravity, and decrements lifetime.
 * Returns a new Particle (immutable style).
 */
export function tickParticle(
  particle: Particle,
  dt: number,
  gravity: number,
): Particle {
  const newLife = particle.life - dt;
  const newVy = particle.vy + gravity * dt;

  return {
    ...particle,
    x: particle.x + particle.vx * dt,
    y: particle.y + particle.vy * dt + 0.5 * gravity * dt * dt,
    vy: newVy,
    life: newLife,
    alpha: newLife > 0 ? Math.max(0, newLife / particle.maxLife) : 0,
    size: particle.size,
    rotation: particle.rotation + dt * 2, // gentle spin
  };
}

// ════════════════════════════════════════════════════════════════
// § tickParticles
// ════════════════════════════════════════════════════════════════

/**
 * Tick all particles, apply config-driven gravity/fade/shrink, remove dead ones.
 */
export function tickParticles(
  particles: Particle[],
  dt: number,
  config: ParticleConfig,
): Particle[] {
  const result: Particle[] = [];

  for (const p of particles) {
    const updated = tickParticle(p, dt, config.gravity);

    if (!isAlive(updated)) continue;

    // Apply optional visual effects
    const finalAlpha = config.fadeOut
      ? getParticleAlpha(updated)
      : updated.alpha;
    const finalSize = config.shrink
      ? getParticleSize(updated, true)
      : updated.size;

    result.push({
      ...updated,
      alpha: finalAlpha,
      size: finalSize,
    });
  }

  return result;
}

// ════════════════════════════════════════════════════════════════
// § mergeParticles
// ════════════════════════════════════════════════════════════════

/**
 * Merge new particles into an existing array, capping total at `maxTotal`.
 * Older particles (lower index) are dropped first to keep newest.
 */
export function mergeParticles(
  existing: Particle[],
  newParticles: Particle[],
  maxTotal: number,
): Particle[] {
  const combined = [...existing, ...newParticles];
  if (combined.length <= maxTotal) return combined;
  // Drop oldest (front of array) to stay within cap
  return combined.slice(combined.length - maxTotal);
}
