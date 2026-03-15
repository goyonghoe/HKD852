/**
 * MapGeneratorCalc — pure TypeScript, NO Phaser imports.
 * Procedural map generation for hazards, decorations, and obstacles.
 */

// ── Types ──

export type TileType =
  | "floor"
  | "wall"
  | "hazard"
  | "decoration"
  | "spawn_point"
  | "pickup_zone";

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  variant: number; // visual variant index
  collidable: boolean;
  damage: number; // hazard damage per second (0 for non-hazards)
}

export interface MapConfig {
  width: number; // tiles wide
  height: number; // tiles tall
  tileSize: number; // pixels per tile
  hazardDensity: number; // 0-1
  decorationDensity: number; // 0-1
  wallDensity: number; // 0-1
  seed: number;
}

export interface GeneratedMap {
  tiles: MapTile[];
  spawnPoints: { x: number; y: number }[];
  pickupZones: { x: number; y: number; radius: number }[];
  bounds: { width: number; height: number };
}

// ── PRNG (mulberry32) ──

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Constants ──

const DEFAULT_WIDTH = 30;
const DEFAULT_HEIGHT = 40;
const DEFAULT_TILE_SIZE = 24;
const DEFAULT_HAZARD_DENSITY = 0.05;
const DEFAULT_DECORATION_DENSITY = 0.1;
const DEFAULT_WALL_DENSITY = 0.08;
const HAZARD_BASE_DAMAGE = 10; // damage per second
const VARIANT_COUNT = 4;
const SPAWN_POINT_COUNT = 4;
const PICKUP_ZONE_COUNT = 3;
const PICKUP_ZONE_RADIUS = 48;

// ── Public API ──

/** Returns a balanced default map config. */
export function getDefaultMapConfig(seed?: number): MapConfig {
  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    tileSize: DEFAULT_TILE_SIZE,
    hazardDensity: DEFAULT_HAZARD_DENSITY,
    decorationDensity: DEFAULT_DECORATION_DENSITY,
    wallDensity: DEFAULT_WALL_DENSITY,
    seed: seed ?? 42,
  };
}

/** Full procedural map generation using seeded PRNG. */
export function generateMap(config: MapConfig): GeneratedMap {
  const rng = mulberry32(config.seed);
  const tiles: MapTile[] = [];
  const spawnPoints: { x: number; y: number }[] = [];
  const pickupZones: { x: number; y: number; radius: number }[] = [];

  // Phase 1: fill all tiles as floor
  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      tiles.push({
        x,
        y,
        type: "floor",
        variant: Math.floor(rng() * VARIANT_COUNT),
        collidable: false,
        damage: 0,
      });
    }
  }

  // Phase 2: place border walls
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (
      t.x === 0 ||
      t.x === config.width - 1 ||
      t.y === 0 ||
      t.y === config.height - 1
    ) {
      t.type = "wall";
      t.collidable = true;
      t.variant = Math.floor(rng() * VARIANT_COUNT);
    }
  }

  // Phase 3: scatter interior walls
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (t.type !== "floor") continue;
    if (rng() < config.wallDensity) {
      t.type = "wall";
      t.collidable = true;
      t.variant = Math.floor(rng() * VARIANT_COUNT);
    }
  }

  // Phase 4: scatter hazards (only on remaining floor tiles)
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (t.type !== "floor") continue;
    if (rng() < config.hazardDensity) {
      t.type = "hazard";
      t.collidable = false;
      t.damage = HAZARD_BASE_DAMAGE;
      t.variant = Math.floor(rng() * VARIANT_COUNT);
    }
  }

  // Phase 5: scatter decorations (only on remaining floor tiles)
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (t.type !== "floor") continue;
    if (rng() < config.decorationDensity) {
      t.type = "decoration";
      t.collidable = false;
      t.variant = Math.floor(rng() * VARIANT_COUNT);
    }
  }

  // Phase 6: place spawn points in interior quadrants
  const qw = Math.floor(config.width / 4);
  const qh = Math.floor(config.height / 4);
  const quadrants = [
    { cx: qw, cy: qh },
    { cx: config.width - qw, cy: qh },
    { cx: qw, cy: config.height - qh },
    { cx: config.width - qw, cy: config.height - qh },
  ];

  for (let i = 0; i < Math.min(SPAWN_POINT_COUNT, quadrants.length); i++) {
    const q = quadrants[i];
    const idx = q.cy * config.width + q.cx;
    if (idx >= 0 && idx < tiles.length) {
      tiles[idx].type = "spawn_point";
      tiles[idx].collidable = false;
      tiles[idx].damage = 0;
      spawnPoints.push({
        x: q.cx * config.tileSize + config.tileSize / 2,
        y: q.cy * config.tileSize + config.tileSize / 2,
      });
    }
  }

  // Phase 7: place pickup zones
  for (let i = 0; i < PICKUP_ZONE_COUNT; i++) {
    const px =
      Math.floor(rng() * (config.width - 4) + 2) * config.tileSize +
      config.tileSize / 2;
    const py =
      Math.floor(rng() * (config.height - 4) + 2) * config.tileSize +
      config.tileSize / 2;
    pickupZones.push({ x: px, y: py, radius: PICKUP_ZONE_RADIUS });

    // Mark the center tile as pickup_zone
    const tx = Math.floor(px / config.tileSize);
    const ty = Math.floor(py / config.tileSize);
    const idx = ty * config.width + tx;
    if (idx >= 0 && idx < tiles.length) {
      tiles[idx].type = "pickup_zone";
      tiles[idx].collidable = false;
      tiles[idx].damage = 0;
    }
  }

  return {
    tiles,
    spawnPoints,
    pickupZones,
    bounds: {
      width: config.width * config.tileSize,
      height: config.height * config.tileSize,
    },
  };
}

/** Look up the tile at a world-pixel position. Returns null if out of bounds. */
export function getTileAt(
  map: GeneratedMap,
  x: number,
  y: number,
  tileSize: number,
): MapTile | null {
  if (x < 0 || y < 0 || x >= map.bounds.width || y >= map.bounds.height) {
    return null;
  }
  const tx = Math.floor(x / tileSize);
  const ty = Math.floor(y / tileSize);
  const width = Math.round(map.bounds.width / tileSize);
  const idx = ty * width + tx;
  return idx >= 0 && idx < map.tiles.length ? map.tiles[idx] : null;
}

/** Returns true if the tile is walkable (not wall, not hazard). */
export function isWalkable(tile: MapTile): boolean {
  return tile.type !== "wall" && tile.type !== "hazard";
}

/** Returns hazard damage scaled by delta time (seconds). */
export function getHazardDamage(tile: MapTile, dt: number): number {
  if (tile.type !== "hazard" || tile.damage <= 0) return 0;
  return tile.damage * dt;
}

/** Returns world-pixel positions of all floor tiles suitable for enemy/item spawning. */
export function getSpawnableArea(
  map: GeneratedMap,
): { x: number; y: number }[] {
  const tileSize = Math.round(
    map.bounds.width /
      Math.round(
        Math.sqrt((map.tiles.length * map.bounds.width) / map.bounds.height),
      ),
  );
  const result: { x: number; y: number }[] = [];
  for (const tile of map.tiles) {
    if (tile.type === "floor") {
      result.push({
        x: tile.x * tileSize + tileSize / 2,
        y: tile.y * tileSize + tileSize / 2,
      });
    }
  }
  return result;
}

/** Generates deterministic decoration visual properties from position + seed. */
export function generateDecoration(
  x: number,
  y: number,
  seed: number,
): { variant: number; rotation: number; scale: number } {
  const rng = mulberry32(seed ^ ((x * 73856093) ^ (y * 19349663)));
  const variant = Math.floor(rng() * VARIANT_COUNT);
  const rotation = rng() * Math.PI * 2; // 0 to 2π
  const scale = 0.8 + rng() * 0.4; // 0.8 to 1.2
  return { variant, rotation, scale };
}
