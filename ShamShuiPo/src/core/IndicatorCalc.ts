// ── Neon Survivors: Off-Screen Enemy Indicator Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface IndicatorData {
  x: number; // screen position of indicator
  y: number;
  angle: number; // rotation in radians
  isBoss: boolean;
  distance: number; // from player to enemy
}

export interface OffScreenEnemy {
  x: number;
  y: number;
  id: string;
  active: boolean;
}

// ════════════════════════════════════════════════════════════════
// § INDICATOR CALCULATION
// ════════════════════════════════════════════════════════════════

const EDGE_MARGIN = 30;

/**
 * Calculate screen-edge indicator positions for off-screen enemies.
 * Only returns indicators for enemies that are outside the visible area
 * but within maxDistance.
 */
export function calculateIndicators(
  playerX: number,
  playerY: number,
  enemies: readonly OffScreenEnemy[],
  screenW: number,
  screenH: number,
  maxDistance: number,
  maxIndicators: number,
): IndicatorData[] {
  // Camera bounds (player is at screen center)
  const camLeft = playerX - screenW / 2;
  const camTop = playerY - screenH / 2;
  const camRight = playerX + screenW / 2;
  const camBottom = playerY + screenH / 2;

  // Clamped screen bounds for indicator placement
  const minX = EDGE_MARGIN;
  const maxX = screenW - EDGE_MARGIN;
  const minY = EDGE_MARGIN;
  const maxY = screenH - EDGE_MARGIN;

  // Filter: active, off-screen, within maxDistance
  const candidates: Array<{
    dx: number;
    dy: number;
    dist: number;
    isBoss: boolean;
  }> = [];

  for (const e of enemies) {
    if (!e.active) continue;
    // On-screen check
    if (e.x >= camLeft && e.x <= camRight && e.y >= camTop && e.y <= camBottom)
      continue;

    const dx = e.x - playerX;
    const dy = e.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDistance || dist === 0) continue;

    candidates.push({
      dx,
      dy,
      dist,
      isBoss: e.id.startsWith("boss"),
    });
  }

  // Sort by distance (closest first), bosses get priority
  candidates.sort((a, b) => {
    if (a.isBoss !== b.isBoss) return a.isBoss ? -1 : 1;
    return a.dist - b.dist;
  });

  // Limit count
  const limited = candidates.slice(0, maxIndicators);

  // Calculate screen-edge intersection for each
  const results: IndicatorData[] = [];
  const halfW = screenW / 2;
  const halfH = screenH / 2;

  for (const c of limited) {
    const angle = Math.atan2(c.dy, c.dx);

    // Ray from screen center in direction (dx, dy).
    // Find where it intersects the clamped rectangle.
    let ix: number;
    let iy: number;

    // Scale factor to hit each edge
    const absX = Math.abs(c.dx);
    const absY = Math.abs(c.dy);

    // Avoid division by zero for axis-aligned directions
    const tX = absX > 0 ? (halfW - EDGE_MARGIN) / absX : Infinity;
    const tY = absY > 0 ? (halfH - EDGE_MARGIN) / absY : Infinity;
    const t = Math.min(tX, tY);

    ix = halfW + c.dx * t;
    iy = halfH + c.dy * t;

    // Clamp within safe bounds
    ix = Math.max(minX, Math.min(maxX, ix));
    iy = Math.max(minY, Math.min(maxY, iy));

    results.push({
      x: ix,
      y: iy,
      angle,
      isBoss: c.isBoss,
      distance: c.dist,
    });
  }

  return results;
}
