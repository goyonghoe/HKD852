// ── Neon Survivors: Fog of War Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type CellVisibility = "hidden" | "explored" | "visible";

export interface FogState {
  /** 2D grid of cell visibility states (row-major: grid[y][x]) */
  readonly grid: ReadonlyArray<ReadonlyArray<CellVisibility>>;
  readonly width: number;
  readonly height: number;
  readonly revealRadius: number;
}

export interface CellPosition {
  readonly x: number;
  readonly y: number;
}

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function cloneGrid(
  grid: ReadonlyArray<ReadonlyArray<CellVisibility>>,
): CellVisibility[][] {
  return grid.map((row) => [...row]);
}

function inBounds(state: FogState, x: number, y: number): boolean {
  return x >= 0 && x < state.width && y >= 0 && y < state.height;
}

// ════════════════════════════════════════════════════════════════
// § CREATE
// ════════════════════════════════════════════════════════════════

/** Create a new FogState with all cells hidden. */
export function createFogState(
  width: number,
  height: number,
  revealRadius: number = 5,
): FogState {
  const grid: CellVisibility[][] = [];
  for (let y = 0; y < height; y++) {
    const row: CellVisibility[] = [];
    for (let x = 0; x < width; x++) {
      row.push("hidden");
    }
    grid.push(row);
  }
  return { grid, width, height, revealRadius };
}

// ════════════════════════════════════════════════════════════════
// § UPDATE VISIBILITY
// ════════════════════════════════════════════════════════════════

/**
 * Update visibility around the player position.
 * - Cells within revealRadius become "visible".
 * - Previously "visible" cells outside the radius become "explored".
 * Returns a new FogState (immutable).
 */
export function updateVisibility(
  state: FogState,
  playerX: number,
  playerY: number,
): FogState {
  const newGrid = cloneGrid(state.grid);
  const r = state.revealRadius;
  const rSq = r * r;

  // First pass: demote all currently "visible" cells to "explored"
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (newGrid[y][x] === "visible") {
        newGrid[y][x] = "explored";
      }
    }
  }

  // Second pass: reveal cells within radius
  const minY = Math.max(0, Math.floor(playerY - r));
  const maxY = Math.min(state.height - 1, Math.ceil(playerY + r));
  const minX = Math.max(0, Math.floor(playerX - r));
  const maxX = Math.min(state.width - 1, Math.ceil(playerX + r));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - playerX;
      const dy = y - playerY;
      if (dx * dx + dy * dy <= rSq) {
        newGrid[y][x] = "visible";
      }
    }
  }

  return { ...state, grid: newGrid };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

/** Get the visibility of a single cell. Out-of-bounds returns "hidden". */
export function getCellVisibility(
  state: FogState,
  x: number,
  y: number,
): CellVisibility {
  if (!inBounds(state, x, y)) return "hidden";
  return state.grid[y][x];
}

/** Return all currently visible cell positions. */
export function getVisibleCells(state: FogState): CellPosition[] {
  const result: CellPosition[] = [];
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (state.grid[y][x] === "visible") {
        result.push({ x, y });
      }
    }
  }
  return result;
}

/** Percentage of the map that has been explored (visible + explored). */
export function getExploredPercent(state: FogState): number {
  const total = state.width * state.height;
  if (total === 0) return 0;
  let count = 0;
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (state.grid[y][x] !== "hidden") {
        count++;
      }
    }
  }
  return (count / total) * 100;
}

/** Quick check: is cell visible right now? */
export function isVisible(state: FogState, x: number, y: number): boolean {
  if (!inBounds(state, x, y)) return false;
  return state.grid[y][x] === "visible";
}

/** Check if cell has been explored (explored or visible). */
export function isExplored(state: FogState, x: number, y: number): boolean {
  if (!inBounds(state, x, y)) return false;
  return state.grid[y][x] !== "hidden";
}

// ════════════════════════════════════════════════════════════════
// § MUTATIONS (return new state)
// ════════════════════════════════════════════════════════════════

/** Force-reveal a circular area. Returns a new FogState. */
export function revealArea(
  state: FogState,
  cx: number,
  cy: number,
  radius: number,
): FogState {
  const newGrid = cloneGrid(state.grid);
  const rSq = radius * radius;

  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(state.height - 1, Math.ceil(cy + radius));
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(state.width - 1, Math.ceil(cx + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rSq) {
        newGrid[y][x] = "visible";
      }
    }
  }

  return { ...state, grid: newGrid };
}

/** Reset all cells to hidden. Returns a new FogState. */
export function hideAll(state: FogState): FogState {
  return createFogState(state.width, state.height, state.revealRadius);
}

/** Set all cells to visible. Returns a new FogState. */
export function revealAll(state: FogState): FogState {
  const newGrid: CellVisibility[][] = [];
  for (let y = 0; y < state.height; y++) {
    const row: CellVisibility[] = [];
    for (let x = 0; x < state.width; x++) {
      row.push("visible");
    }
    newGrid.push(row);
  }
  return { ...state, grid: newGrid };
}

// ════════════════════════════════════════════════════════════════
// § LINE OF SIGHT
// ════════════════════════════════════════════════════════════════

/**
 * Bresenham line-of-sight check.
 * Returns true if ALL cells along the line from (x1,y1) to (x2,y2) are "visible".
 * Out-of-bounds cells are treated as not visible.
 */
export function lineOfSight(
  state: FogState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  let cx = x1;
  let cy = y1;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!isVisible(state, cx, cy)) return false;

    if (cx === x2 && cy === y2) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }

  return true;
}
