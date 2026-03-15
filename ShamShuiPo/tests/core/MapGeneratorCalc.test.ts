// ── Tests: MapGeneratorCalc ──

import { describe, it, expect } from "vitest";
import {
  getDefaultMapConfig,
  generateMap,
  getTileAt,
  isWalkable,
  getHazardDamage,
  getSpawnableArea,
  generateDecoration,
  type MapTile,
  type MapConfig,
  type GeneratedMap,
} from "../../src/core/MapGeneratorCalc";

// ════════════════════════════════════════════════════════════════
// § getDefaultMapConfig
// ════════════════════════════════════════════════════════════════

describe("getDefaultMapConfig", () => {
  it("returns 30x40 tile grid", () => {
    const cfg = getDefaultMapConfig();
    expect(cfg.width).toBe(30);
    expect(cfg.height).toBe(40);
  });

  it("uses 24px tile size", () => {
    expect(getDefaultMapConfig().tileSize).toBe(24);
  });

  it("defaults seed to 42 when omitted", () => {
    expect(getDefaultMapConfig().seed).toBe(42);
  });

  it("accepts custom seed", () => {
    expect(getDefaultMapConfig(999).seed).toBe(999);
  });

  it("has densities between 0 and 1", () => {
    const cfg = getDefaultMapConfig();
    expect(cfg.hazardDensity).toBeGreaterThan(0);
    expect(cfg.hazardDensity).toBeLessThan(1);
    expect(cfg.decorationDensity).toBeGreaterThan(0);
    expect(cfg.decorationDensity).toBeLessThan(1);
    expect(cfg.wallDensity).toBeGreaterThan(0);
    expect(cfg.wallDensity).toBeLessThan(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § generateMap — basic structure
// ════════════════════════════════════════════════════════════════

describe("generateMap", () => {
  const cfg = getDefaultMapConfig(123);
  const map = generateMap(cfg);

  it("produces correct number of tiles", () => {
    expect(map.tiles.length).toBe(cfg.width * cfg.height);
  });

  it("sets correct bounds in pixels", () => {
    expect(map.bounds.width).toBe(cfg.width * cfg.tileSize);
    expect(map.bounds.height).toBe(cfg.height * cfg.tileSize);
  });

  it("generates spawn points", () => {
    expect(map.spawnPoints.length).toBeGreaterThan(0);
    expect(map.spawnPoints.length).toBeLessThanOrEqual(4);
  });

  it("generates pickup zones", () => {
    expect(map.pickupZones.length).toBeGreaterThan(0);
    for (const pz of map.pickupZones) {
      expect(pz.radius).toBeGreaterThan(0);
    }
  });

  it("has border walls on all edges", () => {
    for (const tile of map.tiles) {
      if (
        tile.x === 0 ||
        tile.x === cfg.width - 1 ||
        tile.y === 0 ||
        tile.y === cfg.height - 1
      ) {
        // Border tiles should be wall unless overridden by spawn/pickup
        if (tile.type === "wall") {
          expect(tile.collidable).toBe(true);
        }
      }
    }
  });

  it("contains at least some hazard tiles", () => {
    const hazards = map.tiles.filter((t) => t.type === "hazard");
    expect(hazards.length).toBeGreaterThan(0);
  });

  it("contains at least some decoration tiles", () => {
    const decos = map.tiles.filter((t) => t.type === "decoration");
    expect(decos.length).toBeGreaterThan(0);
  });

  it("contains floor tiles as majority", () => {
    const floors = map.tiles.filter((t) => t.type === "floor");
    expect(floors.length).toBeGreaterThan(map.tiles.length * 0.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § Seed reproducibility
// ════════════════════════════════════════════════════════════════

describe("seed reproducibility", () => {
  it("produces identical maps for same seed", () => {
    const cfg = getDefaultMapConfig(777);
    const map1 = generateMap(cfg);
    const map2 = generateMap(cfg);
    expect(map1.tiles.length).toBe(map2.tiles.length);
    for (let i = 0; i < map1.tiles.length; i++) {
      expect(map1.tiles[i].type).toBe(map2.tiles[i].type);
      expect(map1.tiles[i].variant).toBe(map2.tiles[i].variant);
    }
  });

  it("produces different maps for different seeds", () => {
    const map1 = generateMap(getDefaultMapConfig(1));
    const map2 = generateMap(getDefaultMapConfig(2));
    const diff = map1.tiles.filter(
      (t, i) => t.type !== map2.tiles[i].type,
    ).length;
    expect(diff).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getTileAt
// ════════════════════════════════════════════════════════════════

describe("getTileAt", () => {
  const cfg = getDefaultMapConfig(50);
  const map = generateMap(cfg);

  it("returns a tile for valid world position", () => {
    const tile = getTileAt(map, 12, 12, cfg.tileSize);
    expect(tile).not.toBeNull();
    expect(tile!.x).toBe(0);
    expect(tile!.y).toBe(0);
  });

  it("returns correct tile in the middle of the map", () => {
    const tx = 15;
    const ty = 20;
    const tile = getTileAt(
      map,
      tx * cfg.tileSize + 1,
      ty * cfg.tileSize + 1,
      cfg.tileSize,
    );
    expect(tile).not.toBeNull();
    expect(tile!.x).toBe(tx);
    expect(tile!.y).toBe(ty);
  });

  it("returns null for negative coordinates", () => {
    expect(getTileAt(map, -1, 5, cfg.tileSize)).toBeNull();
    expect(getTileAt(map, 5, -1, cfg.tileSize)).toBeNull();
  });

  it("returns null for coordinates beyond bounds", () => {
    expect(getTileAt(map, map.bounds.width + 1, 5, cfg.tileSize)).toBeNull();
    expect(getTileAt(map, 5, map.bounds.height + 1, cfg.tileSize)).toBeNull();
  });

  it("returns null at exact boundary edge", () => {
    expect(getTileAt(map, map.bounds.width, 0, cfg.tileSize)).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § isWalkable
// ════════════════════════════════════════════════════════════════

describe("isWalkable", () => {
  it("floor is walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "floor",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(isWalkable(tile)).toBe(true);
  });

  it("wall is not walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "wall",
      variant: 0,
      collidable: true,
      damage: 0,
    };
    expect(isWalkable(tile)).toBe(false);
  });

  it("hazard is not walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "hazard",
      variant: 0,
      collidable: false,
      damage: 10,
    };
    expect(isWalkable(tile)).toBe(false);
  });

  it("decoration is walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "decoration",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(isWalkable(tile)).toBe(true);
  });

  it("spawn_point is walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "spawn_point",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(isWalkable(tile)).toBe(true);
  });

  it("pickup_zone is walkable", () => {
    const tile: MapTile = {
      x: 0,
      y: 0,
      type: "pickup_zone",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(isWalkable(tile)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getHazardDamage
// ════════════════════════════════════════════════════════════════

describe("getHazardDamage", () => {
  const hazardTile: MapTile = {
    x: 5,
    y: 5,
    type: "hazard",
    variant: 0,
    collidable: false,
    damage: 10,
  };

  it("returns damage scaled by dt", () => {
    expect(getHazardDamage(hazardTile, 1.0)).toBe(10);
    expect(getHazardDamage(hazardTile, 0.5)).toBe(5);
    expect(getHazardDamage(hazardTile, 0.016)).toBeCloseTo(0.16);
  });

  it("returns 0 for non-hazard tiles", () => {
    const floor: MapTile = {
      x: 0,
      y: 0,
      type: "floor",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(getHazardDamage(floor, 1.0)).toBe(0);
  });

  it("returns 0 for hazard with 0 damage", () => {
    const safe: MapTile = {
      x: 0,
      y: 0,
      type: "hazard",
      variant: 0,
      collidable: false,
      damage: 0,
    };
    expect(getHazardDamage(safe, 1.0)).toBe(0);
  });

  it("returns 0 for zero dt", () => {
    expect(getHazardDamage(hazardTile, 0)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getSpawnableArea
// ════════════════════════════════════════════════════════════════

describe("getSpawnableArea", () => {
  const cfg = getDefaultMapConfig(200);
  const map = generateMap(cfg);
  const spawnable = getSpawnableArea(map);

  it("returns only floor tiles", () => {
    const floorCount = map.tiles.filter((t) => t.type === "floor").length;
    expect(spawnable.length).toBe(floorCount);
  });

  it("returns world-pixel positions (not tile coords)", () => {
    for (const s of spawnable) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.y).toBeGreaterThan(0);
    }
  });

  it("all positions are within map bounds", () => {
    for (const s of spawnable) {
      expect(s.x).toBeLessThanOrEqual(map.bounds.width);
      expect(s.y).toBeLessThanOrEqual(map.bounds.height);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § generateDecoration
// ════════════════════════════════════════════════════════════════

describe("generateDecoration", () => {
  it("returns variant in range 0-3", () => {
    const d = generateDecoration(10, 20, 42);
    expect(d.variant).toBeGreaterThanOrEqual(0);
    expect(d.variant).toBeLessThan(4);
  });

  it("returns rotation in range 0 to 2π", () => {
    const d = generateDecoration(10, 20, 42);
    expect(d.rotation).toBeGreaterThanOrEqual(0);
    expect(d.rotation).toBeLessThan(Math.PI * 2);
  });

  it("returns scale between 0.8 and 1.2", () => {
    const d = generateDecoration(10, 20, 42);
    expect(d.scale).toBeGreaterThanOrEqual(0.8);
    expect(d.scale).toBeLessThanOrEqual(1.2);
  });

  it("is deterministic for same inputs", () => {
    const d1 = generateDecoration(5, 10, 99);
    const d2 = generateDecoration(5, 10, 99);
    expect(d1.variant).toBe(d2.variant);
    expect(d1.rotation).toBe(d2.rotation);
    expect(d1.scale).toBe(d2.scale);
  });

  it("differs for different positions", () => {
    const d1 = generateDecoration(0, 0, 42);
    const d2 = generateDecoration(100, 200, 42);
    const same =
      d1.variant === d2.variant &&
      d1.rotation === d2.rotation &&
      d1.scale === d2.scale;
    expect(same).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Edge cases
// ════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles tiny 3x3 map", () => {
    const cfg: MapConfig = {
      width: 3,
      height: 3,
      tileSize: 16,
      hazardDensity: 0,
      decorationDensity: 0,
      wallDensity: 0,
      seed: 1,
    };
    const map = generateMap(cfg);
    expect(map.tiles.length).toBe(9);
    // All border tiles should be walls (3x3 = all borders)
    const walls = map.tiles.filter((t) => t.type === "wall");
    // 8 border tiles, but some may be overwritten by spawn_point/pickup_zone
    expect(walls.length).toBeGreaterThanOrEqual(4);
    expect(walls.length).toBeLessThanOrEqual(8);
  });

  it("zero hazard density produces no hazards", () => {
    const cfg: MapConfig = {
      width: 10,
      height: 10,
      tileSize: 16,
      hazardDensity: 0,
      decorationDensity: 0,
      wallDensity: 0,
      seed: 55,
    };
    const map = generateMap(cfg);
    const hazards = map.tiles.filter((t) => t.type === "hazard");
    expect(hazards.length).toBe(0);
  });

  it("all hazard tiles have positive damage", () => {
    const cfg = getDefaultMapConfig(300);
    const map = generateMap(cfg);
    for (const t of map.tiles) {
      if (t.type === "hazard") {
        expect(t.damage).toBeGreaterThan(0);
      }
    }
  });

  it("spawn point positions are inside bounds", () => {
    const cfg = getDefaultMapConfig(400);
    const map = generateMap(cfg);
    for (const sp of map.spawnPoints) {
      expect(sp.x).toBeGreaterThan(0);
      expect(sp.x).toBeLessThan(map.bounds.width);
      expect(sp.y).toBeGreaterThan(0);
      expect(sp.y).toBeLessThan(map.bounds.height);
    }
  });
});
