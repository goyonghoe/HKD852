// ── Neon Survivors: Arena Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type ArenaShape = "rectangle" | "circle" | "hexagon";

export interface SpawnZone {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly type: "enemy" | "boss" | "item";
}

export interface SafeZone {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Obstacle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isDestructible: boolean;
  readonly hp: number;
}

export interface Arena {
  readonly id: string;
  readonly shape: ArenaShape;
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly spawnZones: readonly SpawnZone[];
  readonly safeZones: readonly SafeZone[];
  readonly obstacles: readonly Obstacle[];
}

// ════════════════════════════════════════════════════════════════
// § PRNG — mulberry32
// ════════════════════════════════════════════════════════════════

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════
// § ARENA CREATION
// ════════════════════════════════════════════════════════════════

let arenaCounter = 0;

/**
 * Create a new arena with the given shape and dimensions.
 * For circles/hexagons, radius is derived from min(width, height) / 2.
 */
export function createArena(
  shape: ArenaShape,
  width: number,
  height: number,
  centerX: number = 0,
  centerY: number = 0,
): Arena {
  const radius = Math.min(width, height) / 2;
  arenaCounter += 1;
  return {
    id: `arena_${arenaCounter}`,
    shape,
    centerX,
    centerY,
    width,
    height,
    radius,
    spawnZones: [],
    safeZones: [],
    obstacles: [],
  };
}

// ════════════════════════════════════════════════════════════════
// § BOUNDARY CHECKS
// ════════════════════════════════════════════════════════════════

/**
 * Check if a point (px, py) lies inside the arena boundary.
 */
export function isPointInArena(arena: Arena, px: number, py: number): boolean {
  const dx = px - arena.centerX;
  const dy = py - arena.centerY;

  switch (arena.shape) {
    case "rectangle":
      return (
        Math.abs(dx) <= arena.width / 2 && Math.abs(dy) <= arena.height / 2
      );

    case "circle":
      return dx * dx + dy * dy <= arena.radius * arena.radius;

    case "hexagon": {
      // Flat-top hexagon check using hex distance
      const r = arena.radius;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      // Hexagon boundary: max(|dx|, |dx|/2 + |dy| * sqrt(3)/2) <= r
      // Using flat-top: check q/r hex coordinates
      const q = (2 / 3) * adx;
      const rCoord = (-1 / 3) * adx + (Math.sqrt(3) / 3) * ady;
      const s = q + rCoord; // third axial coord magnitude
      return Math.max(q, rCoord, s) <= r;
    }

    default:
      return false;
  }
}

/**
 * Clamp a point to stay inside arena bounds.
 */
export function clampToArena(
  arena: Arena,
  px: number,
  py: number,
): { x: number; y: number } {
  switch (arena.shape) {
    case "rectangle": {
      const halfW = arena.width / 2;
      const halfH = arena.height / 2;
      return {
        x: Math.max(arena.centerX - halfW, Math.min(arena.centerX + halfW, px)),
        y: Math.max(arena.centerY - halfH, Math.min(arena.centerY + halfH, py)),
      };
    }

    case "circle": {
      const dx = px - arena.centerX;
      const dy = py - arena.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= arena.radius) return { x: px, y: py };
      const scale = arena.radius / dist;
      return {
        x: arena.centerX + dx * scale,
        y: arena.centerY + dy * scale,
      };
    }

    case "hexagon": {
      // If already inside, return as-is
      if (isPointInArena(arena, px, py)) return { x: px, y: py };
      // Project onto nearest hex boundary by scaling down
      const dx = px - arena.centerX;
      const dy = py - arena.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: px, y: py };
      // Binary search for the max scale factor that keeps point inside
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        if (
          isPointInArena(
            arena,
            arena.centerX + dx * mid,
            arena.centerY + dy * mid,
          )
        ) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return {
        x: arena.centerX + dx * lo,
        y: arena.centerY + dy * lo,
      };
    }

    default:
      return { x: px, y: py };
  }
}

// ════════════════════════════════════════════════════════════════
// § AREA & BOUNDS
// ════════════════════════════════════════════════════════════════

/**
 * Get the arena area in pixels squared.
 */
export function getArenaArea(arena: Arena): number {
  switch (arena.shape) {
    case "rectangle":
      return arena.width * arena.height;
    case "circle":
      return Math.PI * arena.radius * arena.radius;
    case "hexagon":
      // Regular hexagon area = (3 * sqrt(3) / 2) * r^2
      return ((3 * Math.sqrt(3)) / 2) * arena.radius * arena.radius;
    default:
      return 0;
  }
}

/**
 * Get the axis-aligned bounding box of the arena.
 */
export function getArenaBounds(arena: Arena): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  switch (arena.shape) {
    case "rectangle":
      return {
        minX: arena.centerX - arena.width / 2,
        maxX: arena.centerX + arena.width / 2,
        minY: arena.centerY - arena.height / 2,
        maxY: arena.centerY + arena.height / 2,
      };
    case "circle":
      return {
        minX: arena.centerX - arena.radius,
        maxX: arena.centerX + arena.radius,
        minY: arena.centerY - arena.radius,
        maxY: arena.centerY + arena.radius,
      };
    case "hexagon": {
      // Flat-top hexagon bounding box
      const r = arena.radius;
      const hHeight = r * Math.sqrt(3) * 0.5;
      return {
        minX: arena.centerX - r,
        maxX: arena.centerX + r,
        minY: arena.centerY - hHeight,
        maxY: arena.centerY + hHeight,
      };
    }
    default:
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
}

// ════════════════════════════════════════════════════════════════
// § ZONE & OBSTACLE MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Add a spawn zone to the arena (immutable — returns new Arena).
 */
export function addSpawnZone(
  arena: Arena,
  x: number,
  y: number,
  radius: number,
  type: "enemy" | "boss" | "item",
): Arena {
  return {
    ...arena,
    spawnZones: [...arena.spawnZones, { x, y, radius, type }],
  };
}

/**
 * Add a safe zone to the arena (no enemy spawns).
 */
export function addSafeZone(
  arena: Arena,
  x: number,
  y: number,
  radius: number,
): Arena {
  return {
    ...arena,
    safeZones: [...arena.safeZones, { x, y, radius }],
  };
}

/**
 * Add an obstacle to the arena.
 */
export function addObstacle(
  arena: Arena,
  x: number,
  y: number,
  w: number,
  h: number,
  isDestructible: boolean,
  hp: number,
): Arena {
  return {
    ...arena,
    obstacles: [
      ...arena.obstacles,
      { x, y, width: w, height: h, isDestructible, hp },
    ],
  };
}

/**
 * Remove an obstacle by index.
 */
export function removeObstacle(arena: Arena, index: number): Arena {
  if (index < 0 || index >= arena.obstacles.length) return arena;
  return {
    ...arena,
    obstacles: arena.obstacles.filter((_, i) => i !== index),
  };
}

// ════════════════════════════════════════════════════════════════
// § DISTANCE & BORDER
// ════════════════════════════════════════════════════════════════

/**
 * Distance from a point to the nearest arena border edge.
 * Returns 0 if point is outside.
 */
export function getDistanceToBorder(
  arena: Arena,
  px: number,
  py: number,
): number {
  if (!isPointInArena(arena, px, py)) return 0;

  switch (arena.shape) {
    case "rectangle": {
      const dx = px - arena.centerX;
      const dy = py - arena.centerY;
      const distLeft = arena.width / 2 + dx;
      const distRight = arena.width / 2 - dx;
      const distTop = arena.height / 2 + dy;
      const distBottom = arena.height / 2 - dy;
      return Math.min(distLeft, distRight, distTop, distBottom);
    }

    case "circle": {
      const dx = px - arena.centerX;
      const dy = py - arena.centerY;
      return arena.radius - Math.sqrt(dx * dx + dy * dy);
    }

    case "hexagon": {
      // Approximate: distance to border via scaling factor
      const dx = px - arena.centerX;
      const dy = py - arena.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) {
        // Center point — distance to nearest edge of flat-top hex
        return arena.radius * (Math.sqrt(3) / 2);
      }
      // Find the border point along this direction
      const clamped = clampToArena(
        { ...arena, centerX: 0, centerY: 0 } as Arena,
        (dx * (arena.radius * 2)) / dist,
        (dy * (arena.radius * 2)) / dist,
      );
      const borderDist = Math.sqrt(
        clamped.x * clamped.x + clamped.y * clamped.y,
      );
      return borderDist - dist;
    }

    default:
      return 0;
  }
}

/**
 * Check if a point is within threshold pixels of the border.
 */
export function isNearBorder(
  arena: Arena,
  px: number,
  py: number,
  threshold: number,
): boolean {
  return getDistanceToBorder(arena, px, py) <= threshold;
}

// ════════════════════════════════════════════════════════════════
// § SPAWN POINT GENERATION
// ════════════════════════════════════════════════════════════════

function isInsideObstacle(
  obstacles: readonly Obstacle[],
  px: number,
  py: number,
): boolean {
  return obstacles.some(
    (o) =>
      px >= o.x - o.width / 2 &&
      px <= o.x + o.width / 2 &&
      py >= o.y - o.height / 2 &&
      py <= o.y + o.height / 2,
  );
}

function isInsideSafeZone(
  safeZones: readonly SafeZone[],
  px: number,
  py: number,
): boolean {
  return safeZones.some((sz) => {
    const dx = px - sz.x;
    const dy = py - sz.y;
    return dx * dx + dy * dy <= sz.radius * sz.radius;
  });
}

/**
 * Get a valid spawn point inside the arena but outside safe zones and obstacles.
 * Uses mulberry32 PRNG for determinism.
 */
export function getValidSpawnPoint(
  arena: Arena,
  seed: number,
): { x: number; y: number } {
  const rng = mulberry32(seed);
  const bounds = getArenaBounds(arena);
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    const px = bounds.minX + rng() * (bounds.maxX - bounds.minX);
    const py = bounds.minY + rng() * (bounds.maxY - bounds.minY);

    if (
      isPointInArena(arena, px, py) &&
      !isInsideSafeZone(arena.safeZones, px, py) &&
      !isInsideObstacle(arena.obstacles, px, py)
    ) {
      return { x: px, y: py };
    }
  }

  // Fallback: return center
  return { x: arena.centerX, y: arena.centerY };
}

// ════════════════════════════════════════════════════════════════
// § ARENA MUTATION (IMMUTABLE)
// ════════════════════════════════════════════════════════════════

/**
 * Shrink the arena by a percentage (0–100). Returns a new Arena.
 * Used for closing-circle mechanic.
 */
export function shrinkArena(arena: Arena, percent: number): Arena {
  const factor = 1 - Math.max(0, Math.min(100, percent)) / 100;
  return {
    ...arena,
    width: arena.width * factor,
    height: arena.height * factor,
    radius: arena.radius * factor,
  };
}

// ════════════════════════════════════════════════════════════════
// § PROCEDURAL GENERATION
// ════════════════════════════════════════════════════════════════

/**
 * Generate an arena configuration based on wave number.
 *
 * Wave 1-3:  large rectangle (1200x1600), few obstacles
 * Wave 4-6:  medium rectangle (1000x1400), more obstacles, 1 safe zone
 * Wave 7-9:  circle (radius 600), obstacles in patterns
 * Wave 10+:  hexagon (radius 500), dense obstacles, shrinking
 */
export function generateArenaForWave(wave: number, seed: number): Arena {
  const rng = mulberry32(seed);

  if (wave <= 3) {
    // Large rectangle — early game, forgiving
    let arena = createArena("rectangle", 1200, 1600);
    // 1-3 obstacles
    const count = Math.floor(rng() * 3) + 1;
    for (let i = 0; i < count; i++) {
      arena = addObstacle(
        arena,
        (rng() - 0.5) * 800,
        (rng() - 0.5) * 1200,
        60 + rng() * 40,
        60 + rng() * 40,
        true,
        50,
      );
    }
    // Default enemy spawn zone
    arena = addSpawnZone(arena, 0, -600, 200, "enemy");
    return arena;
  } else if (wave <= 6) {
    // Medium rectangle — mid game
    let arena = createArena("rectangle", 1000, 1400);
    // 3-6 obstacles
    const count = Math.floor(rng() * 4) + 3;
    for (let i = 0; i < count; i++) {
      arena = addObstacle(
        arena,
        (rng() - 0.5) * 700,
        (rng() - 0.5) * 1000,
        50 + rng() * 50,
        50 + rng() * 50,
        rng() > 0.3,
        80,
      );
    }
    // 1 safe zone near center
    arena = addSafeZone(arena, 0, 0, 100);
    arena = addSpawnZone(arena, 0, -500, 250, "enemy");
    arena = addSpawnZone(arena, 0, 500, 150, "item");
    return arena;
  } else if (wave <= 9) {
    // Circle arena — late game
    let arena = createArena("circle", 1200, 1200); // radius = 600
    // 5-8 obstacles in ring pattern
    const count = Math.floor(rng() * 4) + 5;
    const ringRadius = 300 + rng() * 100;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.3;
      arena = addObstacle(
        arena,
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        40 + rng() * 30,
        40 + rng() * 30,
        rng() > 0.5,
        100,
      );
    }
    arena = addSpawnZone(arena, 0, 0, 400, "enemy");
    arena = addSpawnZone(arena, 0, 0, 100, "boss");
    return arena;
  } else {
    // Wave 10+ — hexagon, dense obstacles
    let arena = createArena("hexagon", 1000, 1000); // radius = 500
    // 8-12 dense obstacles
    const count = Math.floor(rng() * 5) + 8;
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = rng() * 350;
      arena = addObstacle(
        arena,
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        30 + rng() * 40,
        30 + rng() * 40,
        rng() > 0.4,
        120,
      );
    }
    // Shrink by wave number beyond 10 (5% per wave, max 40%)
    const shrinkPercent = Math.min((wave - 10) * 5, 40);
    arena = shrinkArena(arena, shrinkPercent);
    arena = addSpawnZone(arena, 0, 0, 300, "enemy");
    arena = addSpawnZone(arena, 0, 0, 150, "boss");
    arena = addSafeZone(arena, 0, 0, 60);
    return arena;
  }
}
