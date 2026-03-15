import { describe, it, expect } from "vitest";
import {
  createGridMap,
  addObstacle,
  removeObstacle,
  addObstacles,
  isWalkable,
  isInBounds,
  getObstacleCount,
  manhattanDistance,
  euclideanDistance,
  findPath,
  calculatePathCost,
  hasLineOfSight,
  smoothPath,
  findNearestReachable,
  createPathCache,
  getCachedPath,
  setCachedPath,
  invalidateCache,
  getCacheSize,
  findPathCached,
  createPathRequest,
  sortRequestsByPriority,
  processPathRequests,
  setDiagonalMovement,
  getWalkableNeighbors,
  getGridDimensions,
} from "../../src/core/PathfindingCalc";

// ── createGridMap ──

describe("createGridMap", () => {
  it("creates with default config", () => {
    const m = createGridMap();
    expect(m.config.width).toBe(20);
    expect(m.config.height).toBe(20);
    expect(m.config.allowDiagonal).toBe(false);
    expect(m.config.heuristic).toBe("manhattan");
    expect(m.obstacles.size).toBe(0);
  });

  it("accepts partial config", () => {
    const m = createGridMap({ width: 10, height: 5 });
    expect(m.config.width).toBe(10);
    expect(m.config.height).toBe(5);
  });

  it("version starts at 0", () => {
    expect(createGridMap().version).toBe(0);
  });
});

// ── Obstacles ──

describe("obstacles", () => {
  it("addObstacle adds and increments version", () => {
    const m = addObstacle(createGridMap(), { x: 3, y: 4 });
    expect(getObstacleCount(m)).toBe(1);
    expect(m.version).toBe(1);
  });

  it("duplicate obstacle is no-op", () => {
    let m = addObstacle(createGridMap(), { x: 3, y: 4 });
    m = addObstacle(m, { x: 3, y: 4 });
    expect(getObstacleCount(m)).toBe(1);
    expect(m.version).toBe(1);
  });

  it("removeObstacle removes", () => {
    let m = addObstacle(createGridMap(), { x: 3, y: 4 });
    m = removeObstacle(m, { x: 3, y: 4 });
    expect(getObstacleCount(m)).toBe(0);
  });

  it("removing nonexistent obstacle is no-op", () => {
    const m = createGridMap();
    const m2 = removeObstacle(m, { x: 1, y: 1 });
    expect(m2.version).toBe(0);
  });

  it("addObstacles adds multiple", () => {
    const m = addObstacles(createGridMap(), [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
    expect(getObstacleCount(m)).toBe(3);
  });

  it("out-of-bounds obstacle ignored", () => {
    const m = addObstacle(createGridMap({ width: 5, height: 5 }), {
      x: 10,
      y: 10,
    });
    expect(getObstacleCount(m)).toBe(0);
  });
});

// ── isWalkable / isInBounds ──

describe("isWalkable / isInBounds", () => {
  it("walkable on empty grid", () => {
    expect(isWalkable(createGridMap(), { x: 5, y: 5 })).toBe(true);
  });

  it("not walkable on obstacle", () => {
    const m = addObstacle(createGridMap(), { x: 5, y: 5 });
    expect(isWalkable(m, { x: 5, y: 5 })).toBe(false);
  });

  it("not walkable out of bounds", () => {
    expect(isWalkable(createGridMap({ width: 5 }), { x: 10, y: 0 })).toBe(
      false,
    );
  });

  it("isInBounds edges", () => {
    const m = createGridMap({ width: 5, height: 5 });
    expect(isInBounds(m, { x: 0, y: 0 })).toBe(true);
    expect(isInBounds(m, { x: 4, y: 4 })).toBe(true);
    expect(isInBounds(m, { x: 5, y: 0 })).toBe(false);
    expect(isInBounds(m, { x: -1, y: 0 })).toBe(false);
  });
});

// ── Heuristics ──

describe("heuristics", () => {
  it("manhattan distance", () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it("euclidean distance", () => {
    expect(euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5);
  });
});

// ── findPath ──

describe("findPath", () => {
  it("same start and goal", () => {
    const r = findPath(createGridMap(), { x: 5, y: 5 }, { x: 5, y: 5 });
    expect(r.found).toBe(true);
    expect(r.path).toHaveLength(1);
    expect(r.cost).toBe(0);
  });

  it("straight line path", () => {
    const m = createGridMap({ width: 10, height: 10 });
    const r = findPath(m, { x: 0, y: 0 }, { x: 5, y: 0 });
    expect(r.found).toBe(true);
    expect(r.cost).toBe(5);
  });

  it("navigates around obstacle", () => {
    let m = createGridMap({ width: 10, height: 10 });
    for (let y = 0; y < 8; y++) m = addObstacle(m, { x: 5, y });
    const r = findPath(m, { x: 0, y: 0 }, { x: 9, y: 0 });
    expect(r.found).toBe(true);
    expect(r.cost).toBeGreaterThan(9);
  });

  it("returns not found when goal unreachable", () => {
    let m = createGridMap({ width: 5, height: 5 });
    for (let x = 2; x <= 4; x++)
      for (let y = 2; y <= 4; y++) m = addObstacle(m, { x, y });
    const r = findPath(m, { x: 0, y: 0 }, { x: 3, y: 3 });
    expect(r.found).toBe(false);
  });

  it("returns not found for out-of-bounds start", () => {
    const r = findPath(
      createGridMap({ width: 5 }),
      { x: 10, y: 0 },
      { x: 0, y: 0 },
    );
    expect(r.found).toBe(false);
  });

  it("returns not found when start is obstacle", () => {
    const m = addObstacle(createGridMap(), { x: 0, y: 0 });
    const r = findPath(m, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(r.found).toBe(false);
  });

  it("respects maxIterations", () => {
    const m = createGridMap({ width: 100, height: 100, maxIterations: 5 });
    const r = findPath(m, { x: 0, y: 0 }, { x: 99, y: 99 });
    expect(r.iterations).toBeLessThanOrEqual(5);
  });

  it("diagonal path when allowed", () => {
    const m = createGridMap({
      width: 10,
      height: 10,
      allowDiagonal: true,
      heuristic: "euclidean",
    });
    const r = findPath(m, { x: 0, y: 0 }, { x: 3, y: 3 });
    expect(r.found).toBe(true);
    expect(r.path.length).toBeLessThanOrEqual(5);
  });

  it("uses euclidean heuristic", () => {
    const m = createGridMap({ width: 10, height: 10, heuristic: "euclidean" });
    const r = findPath(m, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(r.found).toBe(true);
  });
});

// ── calculatePathCost ──

describe("calculatePathCost", () => {
  it("empty path has 0 cost", () => {
    expect(calculatePathCost([])).toBe(0);
  });

  it("single point has 0 cost", () => {
    expect(calculatePathCost([{ x: 0, y: 0 }])).toBe(0);
  });

  it("straight line cost", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(calculatePathCost(path)).toBe(2);
  });
});

// ── hasLineOfSight ──

describe("hasLineOfSight", () => {
  it("clear line of sight", () => {
    expect(
      hasLineOfSight(createGridMap(), { x: 0, y: 0 }, { x: 5, y: 5 }),
    ).toBe(true);
  });

  it("blocked by obstacle", () => {
    const m = addObstacle(createGridMap(), { x: 3, y: 3 });
    expect(hasLineOfSight(m, { x: 0, y: 0 }, { x: 5, y: 5 })).toBe(false);
  });

  it("same point", () => {
    expect(
      hasLineOfSight(createGridMap(), { x: 3, y: 3 }, { x: 3, y: 3 }),
    ).toBe(true);
  });
});

// ── smoothPath ──

describe("smoothPath", () => {
  it("short path unchanged", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    expect(smoothPath(createGridMap(), path)).toHaveLength(2);
  });

  it("removes unnecessary waypoints", () => {
    const m = createGridMap();
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];
    const smoothed = smoothPath(m, path);
    expect(smoothed.length).toBeLessThanOrEqual(path.length);
    expect(smoothed[0]).toEqual({ x: 0, y: 0 });
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 3, y: 0 });
  });
});

// ── findNearestReachable ──

describe("findNearestReachable", () => {
  it("returns goal if reachable", () => {
    const result = findNearestReachable(
      createGridMap(),
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    );
    expect(result).toEqual({ x: 5, y: 5 });
  });

  it("returns nearby cell when goal blocked", () => {
    let m = createGridMap({ width: 10, height: 10 });
    m = addObstacle(m, { x: 5, y: 5 });
    const result = findNearestReachable(m, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x !== 5 || result.y !== 5).toBe(true);
    }
  });

  it("returns null when start is invalid", () => {
    expect(
      findNearestReachable(createGridMap(), { x: -1, y: -1 }, { x: 5, y: 5 }),
    ).toBeNull();
  });
});

// ── Path Cache ──

describe("path cache", () => {
  it("createPathCache is empty", () => {
    expect(getCacheSize(createPathCache())).toBe(0);
  });

  it("set and get cached path", () => {
    const m = createGridMap();
    const result = findPath(m, { x: 0, y: 0 }, { x: 5, y: 0 });
    const cache = setCachedPath(
      createPathCache(),
      m,
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      result,
    );
    expect(getCacheSize(cache)).toBe(1);
    const cached = getCachedPath(cache, m, { x: 0, y: 0 }, { x: 5, y: 0 });
    expect(cached).not.toBeNull();
    expect(cached!.found).toBe(true);
  });

  it("cache invalidated on version change", () => {
    let m = createGridMap();
    const result = findPath(m, { x: 0, y: 0 }, { x: 5, y: 0 });
    const cache = setCachedPath(
      createPathCache(),
      m,
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      result,
    );
    m = addObstacle(m, { x: 3, y: 3 });
    expect(getCachedPath(cache, m, { x: 0, y: 0 }, { x: 5, y: 0 })).toBeNull();
  });

  it("invalidateCache returns empty cache", () => {
    expect(getCacheSize(invalidateCache())).toBe(0);
  });

  it("findPathCached uses cache on second call", () => {
    const m = createGridMap();
    const r1 = findPathCached(
      m,
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      createPathCache(),
    );
    expect(r1.result.found).toBe(true);
    expect(getCacheSize(r1.cache)).toBe(1);
    const r2 = findPathCached(m, { x: 0, y: 0 }, { x: 5, y: 0 }, r1.cache);
    expect(r2.result.found).toBe(true);
  });
});

// ── Path Requests ──

describe("path requests", () => {
  it("createPathRequest", () => {
    const r = createPathRequest("r1", { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(r.id).toBe("r1");
    expect(r.priority).toBe("normal");
  });

  it("sortRequestsByPriority orders critical first", () => {
    const requests = [
      createPathRequest("a", { x: 0, y: 0 }, { x: 1, y: 1 }, "low"),
      createPathRequest("b", { x: 0, y: 0 }, { x: 1, y: 1 }, "critical"),
      createPathRequest("c", { x: 0, y: 0 }, { x: 1, y: 1 }, "normal"),
    ];
    const sorted = sortRequestsByPriority(requests);
    expect(sorted[0].id).toBe("b");
    expect(sorted[2].id).toBe("a");
  });

  it("processPathRequests returns results for each request", () => {
    const m = createGridMap();
    const requests = [
      createPathRequest("r1", { x: 0, y: 0 }, { x: 3, y: 0 }),
      createPathRequest("r2", { x: 0, y: 0 }, { x: 0, y: 3 }),
    ];
    const results = processPathRequests(m, requests);
    expect(results.size).toBe(2);
    expect(results.get("r1")!.found).toBe(true);
  });
});

// ── Diagonal toggle ──

describe("setDiagonalMovement", () => {
  it("enables diagonal", () => {
    const m = setDiagonalMovement(createGridMap(), true);
    expect(m.config.allowDiagonal).toBe(true);
  });

  it("no-op if already set", () => {
    const m = createGridMap({ allowDiagonal: true });
    const m2 = setDiagonalMovement(m, true);
    expect(m2.version).toBe(m.version);
  });
});

// ── Grid queries ──

describe("grid queries", () => {
  it("getWalkableNeighbors returns adjacent cells", () => {
    const m = createGridMap({ width: 10, height: 10 });
    const neighbors = getWalkableNeighbors(m, { x: 5, y: 5 });
    expect(neighbors.length).toBe(4);
  });

  it("getWalkableNeighbors excludes obstacles", () => {
    let m = createGridMap({ width: 10, height: 10 });
    m = addObstacle(m, { x: 5, y: 4 });
    const neighbors = getWalkableNeighbors(m, { x: 5, y: 5 });
    expect(neighbors.length).toBe(3);
  });

  it("getWalkableNeighbors at corner", () => {
    const neighbors = getWalkableNeighbors(createGridMap(), { x: 0, y: 0 });
    expect(neighbors.length).toBe(2);
  });

  it("getGridDimensions", () => {
    const d = getGridDimensions(createGridMap({ width: 15, height: 25 }));
    expect(d.width).toBe(15);
    expect(d.height).toBe(25);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("addObstacle does not mutate original", () => {
    const m = createGridMap();
    addObstacle(m, { x: 3, y: 3 });
    expect(getObstacleCount(m)).toBe(0);
  });

  it("findPath does not mutate map", () => {
    const m = createGridMap();
    const before = m.version;
    findPath(m, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(m.version).toBe(before);
  });
});
