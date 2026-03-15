// PathfindingCalc.ts — Grid-based A* pathfinding for enemy AI (pure TypeScript, immutable)

// ── Types ──────────────────────────────────────────────────────────

export type HeuristicType = "manhattan" | "euclidean";

export type PathPriority = "low" | "normal" | "high" | "critical";

export type GridPos = {
  readonly x: number;
  readonly y: number;
};

export type PathfindingConfig = {
  readonly width: number;
  readonly height: number;
  readonly allowDiagonal: boolean;
  readonly heuristic: HeuristicType;
  readonly maxIterations: number;
  readonly cachePaths: boolean;
};

export type GridMap = {
  readonly config: PathfindingConfig;
  readonly obstacles: ReadonlySet<string>;
  readonly version: number;
};

export type PathResult = {
  readonly path: readonly GridPos[];
  readonly cost: number;
  readonly found: boolean;
  readonly iterations: number;
};

export type CachedPath = {
  readonly key: string;
  readonly result: PathResult;
  readonly mapVersion: number;
};

export type PathCache = {
  readonly entries: ReadonlyMap<string, CachedPath>;
};

export type PathRequest = {
  readonly start: GridPos;
  readonly goal: GridPos;
  readonly priority: PathPriority;
  readonly id: string;
};

// ── Internal types (not exported) ──────────────────────────────────

interface AStarNode {
  readonly pos: GridPos;
  readonly g: number;
  readonly h: number;
  readonly f: number;
  readonly parent: AStarNode | null;
}

// ── Helpers ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<PathPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function posKey(p: GridPos): string {
  return `${p.x},${p.y}`;
}

function cacheKeyStr(start: GridPos, goal: GridPos): string {
  return `${posKey(start)}->${posKey(goal)}`;
}

// ── Default Config ─────────────────────────────────────────────────

const DEFAULT_CONFIG: PathfindingConfig = {
  width: 20,
  height: 20,
  allowDiagonal: false,
  heuristic: "manhattan",
  maxIterations: 1000,
  cachePaths: true,
};

// ── Grid Map ───────────────────────────────────────────────────────

export function createGridMap(config?: Partial<PathfindingConfig>): GridMap {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    obstacles: new Set<string>(),
    version: 0,
  };
}

export function addObstacle(map: GridMap, pos: GridPos): GridMap {
  if (!isInBounds(map, pos)) return map;
  const key = posKey(pos);
  if (map.obstacles.has(key)) return map;
  const next = new Set(map.obstacles);
  next.add(key);
  return { ...map, obstacles: next, version: map.version + 1 };
}

export function removeObstacle(map: GridMap, pos: GridPos): GridMap {
  const key = posKey(pos);
  if (!map.obstacles.has(key)) return map;
  const next = new Set(map.obstacles);
  next.delete(key);
  return { ...map, obstacles: next, version: map.version + 1 };
}

export function addObstacles(
  map: GridMap,
  positions: readonly GridPos[],
): GridMap {
  let result = map;
  for (const pos of positions) {
    result = addObstacle(result, pos);
  }
  return result;
}

export function isWalkable(map: GridMap, pos: GridPos): boolean {
  if (!isInBounds(map, pos)) return false;
  return !map.obstacles.has(posKey(pos));
}

export function isInBounds(map: GridMap, pos: GridPos): boolean {
  return (
    pos.x >= 0 &&
    pos.x < map.config.width &&
    pos.y >= 0 &&
    pos.y < map.config.height
  );
}

export function getObstacleCount(map: GridMap): number {
  return map.obstacles.size;
}

// ── Heuristics ─────────────────────────────────────────────────────

export function manhattanDistance(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function euclideanDistance(a: GridPos, b: GridPos): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getHeuristic(type: HeuristicType): (a: GridPos, b: GridPos) => number {
  return type === "euclidean" ? euclideanDistance : manhattanDistance;
}

// ── Neighbors ──────────────────────────────────────────────────────

const CARDINAL_DIRS: readonly GridPos[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

const DIAGONAL_DIRS: readonly GridPos[] = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
];

function getNeighborsInternal(map: GridMap, pos: GridPos): GridPos[] {
  const dirs = map.config.allowDiagonal
    ? [...CARDINAL_DIRS, ...DIAGONAL_DIRS]
    : CARDINAL_DIRS;
  const result: GridPos[] = [];
  for (const d of dirs) {
    const n: GridPos = { x: pos.x + d.x, y: pos.y + d.y };
    if (!isWalkable(map, n)) continue;
    // Diagonal: both adjacent cardinal cells must be walkable (no corner-cutting)
    if (d.x !== 0 && d.y !== 0) {
      if (!isWalkable(map, { x: pos.x + d.x, y: pos.y })) continue;
      if (!isWalkable(map, { x: pos.x, y: pos.y + d.y })) continue;
    }
    result.push(n);
  }
  return result;
}

function moveCost(from: GridPos, to: GridPos): number {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  return dx + dy === 2 ? Math.SQRT2 : 1;
}

// ── A* Core ────────────────────────────────────────────────────────

function reconstructPath(node: AStarNode): GridPos[] {
  const path: GridPos[] = [];
  let current: AStarNode | null = node;
  while (current) {
    path.push({ x: current.pos.x, y: current.pos.y });
    current = current.parent;
  }
  return path.reverse();
}

export function findPath(
  map: GridMap,
  start: GridPos,
  goal: GridPos,
): PathResult {
  const noPath: PathResult = { path: [], cost: 0, found: false, iterations: 0 };

  if (!isInBounds(map, start) || !isInBounds(map, goal)) return noPath;
  if (!isWalkable(map, start) || !isWalkable(map, goal)) return noPath;

  if (start.x === goal.x && start.y === goal.y) {
    return {
      path: [{ x: start.x, y: start.y }],
      cost: 0,
      found: true,
      iterations: 0,
    };
  }

  const heuristic = getHeuristic(map.config.heuristic);
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();

  const startH = heuristic(start, goal);
  const startNode: AStarNode = {
    pos: start,
    g: 0,
    h: startH,
    f: startH,
    parent: null,
  };

  openSet.push(startNode);
  gScores.set(posKey(start), 0);

  let iterations = 0;

  while (openSet.length > 0 && iterations < map.config.maxIterations) {
    iterations++;

    // Find node with lowest f
    let bestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
    }
    const current = openSet[bestIdx];
    openSet.splice(bestIdx, 1);

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      const path = reconstructPath(current);
      return { path, cost: current.g, found: true, iterations };
    }

    const currentKey = posKey(current.pos);
    closedSet.add(currentKey);

    for (const neighbor of getNeighborsInternal(map, current.pos)) {
      const nKey = posKey(neighbor);
      if (closedSet.has(nKey)) continue;

      const tentativeG = current.g + moveCost(current.pos, neighbor);
      const existingG = gScores.get(nKey);

      if (existingG !== undefined && tentativeG >= existingG) continue;

      gScores.set(nKey, tentativeG);
      const h = heuristic(neighbor, goal);
      const node: AStarNode = {
        pos: neighbor,
        g: tentativeG,
        h,
        f: tentativeG + h,
        parent: current,
      };

      // Remove existing worse entry from open set
      const existingIdx = openSet.findIndex((n) => posKey(n.pos) === nKey);
      if (existingIdx >= 0) openSet.splice(existingIdx, 1);

      openSet.push(node);
    }
  }

  return { ...noPath, iterations };
}

// ── Path Cost ──────────────────────────────────────────────────────

export function calculatePathCost(path: readonly GridPos[]): number {
  if (path.length <= 1) return 0;
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    cost += moveCost(path[i - 1], path[i]);
  }
  return cost;
}

// ── Line of Sight (Bresenham) ──────────────────────────────────────

export function hasLineOfSight(
  map: GridMap,
  from: GridPos,
  to: GridPos,
): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (!isWalkable(map, { x: x0, y: y0 })) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// ── Path Smoothing ─────────────────────────────────────────────────

export function smoothPath(
  map: GridMap,
  path: readonly GridPos[],
): readonly GridPos[] {
  if (path.length <= 2) return [...path];

  const result: GridPos[] = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    let furthest = current + 1;
    for (let i = path.length - 1; i > current + 1; i--) {
      if (hasLineOfSight(map, path[current], path[i])) {
        furthest = i;
        break;
      }
    }
    result.push(path[furthest]);
    current = furthest;
  }

  return result;
}

// ── Nearest Reachable Point ────────────────────────────────────────

export function findNearestReachable(
  map: GridMap,
  start: GridPos,
  goal: GridPos,
): GridPos | null {
  if (!isInBounds(map, start) || !isWalkable(map, start)) return null;

  // If goal itself is reachable, return it
  if (isWalkable(map, goal) && isInBounds(map, goal)) {
    const result = findPath(map, start, goal);
    if (result.found) return { x: goal.x, y: goal.y };
  }

  const heuristic = getHeuristic(map.config.heuristic);
  const maxRadius = Math.max(map.config.width, map.config.height);
  const visited = new Set<string>();

  for (let r = 1; r <= maxRadius; r++) {
    let bestPos: GridPos | null = null;
    let bestDist = Infinity;

    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // ring only
        const candidate: GridPos = { x: goal.x + dx, y: goal.y + dy };
        const ck = posKey(candidate);
        if (visited.has(ck)) continue;
        visited.add(ck);

        if (!isInBounds(map, candidate) || !isWalkable(map, candidate))
          continue;
        // Skip start position — we want a point near the goal, not trivially the start
        if (candidate.x === start.x && candidate.y === start.y) continue;

        const dist = heuristic(goal, candidate);
        if (dist < bestDist) {
          const pathResult = findPath(map, start, candidate);
          if (pathResult.found) {
            bestPos = candidate;
            bestDist = dist;
          }
        }
      }
    }
    if (bestPos !== null) return bestPos;
  }

  return null;
}

// ── Path Cache ─────────────────────────────────────────────────────

export function createPathCache(): PathCache {
  return { entries: new Map() };
}

export function getCachedPath(
  cache: PathCache,
  map: GridMap,
  start: GridPos,
  goal: GridPos,
): PathResult | null {
  const key = cacheKeyStr(start, goal);
  const entry = cache.entries.get(key);
  if (!entry) return null;
  if (entry.mapVersion !== map.version) return null;
  return entry.result;
}

export function setCachedPath(
  cache: PathCache,
  map: GridMap,
  start: GridPos,
  goal: GridPos,
  result: PathResult,
): PathCache {
  const key = cacheKeyStr(start, goal);
  const entry: CachedPath = { key, result, mapVersion: map.version };
  const next = new Map(cache.entries);
  next.set(key, entry);
  return { entries: next };
}

export function invalidateCache(): PathCache {
  return createPathCache();
}

export function getCacheSize(cache: PathCache): number {
  return cache.entries.size;
}

export function findPathCached(
  map: GridMap,
  start: GridPos,
  goal: GridPos,
  cache: PathCache,
): { result: PathResult; cache: PathCache } {
  const cached = getCachedPath(cache, map, start, goal);
  if (cached) return { result: cached, cache };
  const result = findPath(map, start, goal);
  const nextCache = setCachedPath(cache, map, start, goal, result);
  return { result, cache: nextCache };
}

// ── Priority Queue for Multiple Requests ───────────────────────────

export function createPathRequest(
  id: string,
  start: GridPos,
  goal: GridPos,
  priority: PathPriority = "normal",
): PathRequest {
  return { id, start, goal, priority };
}

export function sortRequestsByPriority(
  requests: readonly PathRequest[],
): readonly PathRequest[] {
  return [...requests].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

export function processPathRequests(
  map: GridMap,
  requests: readonly PathRequest[],
): ReadonlyMap<string, PathResult> {
  const sorted = sortRequestsByPriority(requests);
  const results = new Map<string, PathResult>();
  for (const req of sorted) {
    results.set(req.id, findPath(map, req.start, req.goal));
  }
  return results;
}

// ── Diagonal Toggle ────────────────────────────────────────────────

export function setDiagonalMovement(map: GridMap, allow: boolean): GridMap {
  if (map.config.allowDiagonal === allow) return map;
  return {
    ...map,
    config: { ...map.config, allowDiagonal: allow },
    version: map.version + 1,
  };
}

// ── Grid Queries ───────────────────────────────────────────────────

export function getWalkableNeighbors(
  map: GridMap,
  pos: GridPos,
): readonly GridPos[] {
  return getNeighborsInternal(map, pos);
}

export function getGridDimensions(map: GridMap): {
  width: number;
  height: number;
} {
  return { width: map.config.width, height: map.config.height };
}
