// ── Neon Survivors: Projectile Pattern Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

/** A single projectile spawn descriptor. */
export interface ProjectileSpawn {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly speed: number;
}

/** Supported fire pattern types. */
export type PatternType =
  | "single"
  | "spread"
  | "burst"
  | "cone"
  | "ring"
  | "spiral"
  | "random";

/** Optional configuration for `generatePattern`. */
export interface PatternConfig {
  readonly speed?: number;
  readonly count?: number;
  readonly spreadAngle?: number;
  readonly coneAngle?: number;
  readonly rotationOffset?: number;
  readonly seed?: number;
}

// ════════════════════════════════════════════════════════════════
// § PRNG
// ════════════════════════════════════════════════════════════════

/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Returns a function that produces values in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const TWO_PI = Math.PI * 2;

/** Default speed when none is provided. */
const DEFAULT_SPEED = 300;

/** Default spread angle (radians) for spread shots. */
const DEFAULT_SPREAD_ANGLE = Math.PI / 6; // 30°

/** Default cone angle (radians) for cone shots. */
const DEFAULT_CONE_ANGLE = Math.PI / 4; // 45°

/** Base projectile counts per pattern type. */
const BASE_COUNTS: Readonly<Record<PatternType, number>> = {
  single: 1,
  spread: 3,
  burst: 3,
  cone: 5,
  ring: 8,
  spiral: 6,
  random: 4,
};

/** Projectiles added per level (beyond level 1). */
const LEVEL_SCALING: Readonly<Record<PatternType, number>> = {
  single: 0,
  spread: 1,
  burst: 1,
  cone: 1,
  ring: 2,
  spiral: 1,
  random: 1,
};

// ════════════════════════════════════════════════════════════════
// § PATTERN FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Single shot — one projectile toward `angle`.
 */
export function singleShot(
  ox: number,
  oy: number,
  angle: number,
  speed: number,
): readonly ProjectileSpawn[] {
  return [{ x: ox, y: oy, angle, speed }];
}

/**
 * Spread shot — `count` projectiles evenly distributed across `spreadAngle`
 * centered on `angle`.
 */
export function spreadShot(
  ox: number,
  oy: number,
  angle: number,
  speed: number,
  count: number,
  spreadAngle: number,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];
  if (count === 1) return singleShot(ox, oy, angle, speed);

  const step = spreadAngle / (count - 1);
  const startAngle = angle - spreadAngle / 2;
  const spawns: ProjectileSpawn[] = [];

  for (let i = 0; i < count; i++) {
    spawns.push({
      x: ox,
      y: oy,
      angle: startAngle + step * i,
      speed,
    });
  }
  return spawns;
}

/**
 * Burst shot — `count` projectiles in the same direction with staggered
 * speeds: 1×, 0.8×, 0.6×, 0.4×, …
 */
export function burstShot(
  ox: number,
  oy: number,
  angle: number,
  speed: number,
  count: number,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];

  const spawns: ProjectileSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const speedMul = 1 - i * 0.2;
    spawns.push({
      x: ox,
      y: oy,
      angle,
      speed: speed * Math.max(speedMul, 0.2),
    });
  }
  return spawns;
}

/**
 * Cone shot — `count` projectiles at random angles within `coneAngle`
 * centered on `angle`, using mulberry32 PRNG for determinism.
 */
export function coneShot(
  ox: number,
  oy: number,
  angle: number,
  speed: number,
  count: number,
  coneAngle: number,
  seed: number = 42,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];

  const rng = mulberry32(seed);
  const halfCone = coneAngle / 2;
  const spawns: ProjectileSpawn[] = [];

  for (let i = 0; i < count; i++) {
    const offset = (rng() - 0.5) * 2 * halfCone;
    spawns.push({
      x: ox,
      y: oy,
      angle: angle + offset,
      speed,
    });
  }
  return spawns;
}

/**
 * Ring shot — `count` projectiles evenly distributed across a full 360°.
 */
export function ringShot(
  ox: number,
  oy: number,
  speed: number,
  count: number,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];

  const step = TWO_PI / count;
  const spawns: ProjectileSpawn[] = [];

  for (let i = 0; i < count; i++) {
    spawns.push({
      x: ox,
      y: oy,
      angle: step * i,
      speed,
    });
  }
  return spawns;
}

/**
 * Spiral shot — `count` projectiles in a spiral pattern, each rotated
 * by `rotationOffset` from the previous.
 */
export function spiralShot(
  ox: number,
  oy: number,
  speed: number,
  count: number,
  rotationOffset: number,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];

  const spawns: ProjectileSpawn[] = [];
  for (let i = 0; i < count; i++) {
    spawns.push({
      x: ox,
      y: oy,
      angle: rotationOffset * i,
      speed,
    });
  }
  return spawns;
}

/**
 * Random shot — `count` projectiles in random directions using
 * mulberry32 seeded PRNG for reproducibility.
 */
export function randomShot(
  ox: number,
  oy: number,
  speed: number,
  count: number,
  seed: number,
): readonly ProjectileSpawn[] {
  if (count <= 0) return [];

  const rng = mulberry32(seed);
  const spawns: ProjectileSpawn[] = [];

  for (let i = 0; i < count; i++) {
    spawns.push({
      x: ox,
      y: oy,
      angle: rng() * TWO_PI,
      speed,
    });
  }
  return spawns;
}

// ════════════════════════════════════════════════════════════════
// § META FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Get the projectile count for a pattern at a given level.
 * Level 1 = base count, each additional level adds the scaling amount.
 */
export function getPatternProjectileCount(
  type: PatternType,
  level: number,
): number {
  const base = BASE_COUNTS[type];
  const scale = LEVEL_SCALING[type];
  const clampedLevel = Math.max(1, Math.floor(level));
  return base + scale * (clampedLevel - 1);
}

/**
 * Rotate all spawns' angles by `angle` (radians).
 * Returns a new array — does not mutate the input.
 */
export function rotateSpawns(
  spawns: readonly ProjectileSpawn[],
  angle: number,
): readonly ProjectileSpawn[] {
  return spawns.map((s) => ({
    ...s,
    angle: s.angle + angle,
  }));
}

// ════════════════════════════════════════════════════════════════
// § GENERATE PATTERN (DISPATCHER)
// ════════════════════════════════════════════════════════════════

/**
 * Generate projectile spawns for a given pattern type.
 * A unified entry point that delegates to individual pattern functions.
 */
export function generatePattern(
  type: PatternType,
  originX: number,
  originY: number,
  targetAngle: number,
  config?: PatternConfig,
): readonly ProjectileSpawn[] {
  const speed = config?.speed ?? DEFAULT_SPEED;
  const count = config?.count ?? BASE_COUNTS[type];

  switch (type) {
    case "single":
      return singleShot(originX, originY, targetAngle, speed);

    case "spread":
      return spreadShot(
        originX,
        originY,
        targetAngle,
        speed,
        count,
        config?.spreadAngle ?? DEFAULT_SPREAD_ANGLE,
      );

    case "burst":
      return burstShot(originX, originY, targetAngle, speed, count);

    case "cone":
      return coneShot(
        originX,
        originY,
        targetAngle,
        speed,
        count,
        config?.coneAngle ?? DEFAULT_CONE_ANGLE,
        config?.seed ?? 42,
      );

    case "ring":
      return ringShot(originX, originY, speed, count);

    case "spiral":
      return spiralShot(
        originX,
        originY,
        speed,
        count,
        config?.rotationOffset ?? 0.5,
      );

    case "random":
      return randomShot(originX, originY, speed, count, config?.seed ?? 42);
  }
}
