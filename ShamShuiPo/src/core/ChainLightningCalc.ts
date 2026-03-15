/**
 * ChainLightningCalc — Pure TypeScript chain bounce weapon calculations.
 * NO Phaser imports. All functions are pure and side-effect free.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface ChainTarget {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly damage: number;
  readonly bounceIndex: number;
}

export interface ChainConfig {
  readonly maxBounces: number;
  readonly bounceRange: number;
  readonly damageDecay: number;
  readonly baseDamage: number;
}

export interface ChainResult {
  readonly targets: readonly ChainTarget[];
  readonly totalDamage: number;
  readonly bouncesUsed: number;
}

// ─── Enemy shape ─────────────────────────────────────────────────

type EnemyLike = Readonly<{ id: string; x: number; y: number }>;

// ─── Helpers ─────────────────────────────────────────────────────

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Create a ChainConfig with sensible defaults, optionally overridden.
 */
export function createChainConfig(
  overrides?: Partial<ChainConfig>,
): ChainConfig {
  return {
    maxBounces: 5,
    bounceRange: 150,
    damageDecay: 0.7,
    baseDamage: 25,
    ...overrides,
  };
}

/**
 * Calculate the full chain path starting from (startX, startY).
 * Finds the closest enemy, then bounces to the nearest unvisited enemy
 * within bounceRange, applying damageDecay at each bounce.
 */
export function calculateChain(
  startX: number,
  startY: number,
  enemies: readonly EnemyLike[],
  config: ChainConfig,
): ChainResult {
  if (enemies.length === 0) {
    return { targets: [], totalDamage: 0, bouncesUsed: 0 };
  }

  const targets: ChainTarget[] = [];
  const visited = new Set<string>();
  let curX = startX;
  let curY = startY;
  const maxHops = Math.min(config.maxBounces, enemies.length);

  for (let i = 0; i < maxHops; i++) {
    const range = i === 0 ? Infinity : config.bounceRange;
    const next = findNearestEnemy(curX, curY, enemies, visited, range);
    if (!next) break;

    const damage = getDamageAtBounce(config.baseDamage, i, config.damageDecay);
    targets.push({
      id: next.id,
      x: next.x,
      y: next.y,
      damage,
      bounceIndex: i,
    });
    visited.add(next.id);
    curX = next.x;
    curY = next.y;
  }

  const totalDamage = targets.reduce((sum, t) => sum + t.damage, 0);
  return { targets, totalDamage, bouncesUsed: targets.length };
}

/**
 * Damage dealt at a specific bounce index.
 * baseDamage * damageDecay ^ bounceIndex
 */
export function getDamageAtBounce(
  baseDamage: number,
  bounceIndex: number,
  damageDecay: number,
): number {
  return baseDamage * Math.pow(damageDecay, bounceIndex);
}

/**
 * Find the nearest enemy to (x, y) not in excludeIds within maxRange.
 * Returns null if none found.
 */
export function findNearestEnemy(
  x: number,
  y: number,
  enemies: readonly EnemyLike[],
  excludeIds: ReadonlySet<string>,
  maxRange: number,
): EnemyLike | null {
  let best: EnemyLike | null = null;
  let bestDistSq = maxRange * maxRange;

  for (const e of enemies) {
    if (excludeIds.has(e.id)) continue;
    const d = distSq(x, y, e.x, e.y);
    if (d <= bestDistSq) {
      bestDistSq = d;
      best = e;
    }
  }
  return best;
}

/**
 * Total damage across all bounces (geometric series).
 * Sum of baseDamage * damageDecay^i for i in [0, bounces).
 */
export function getTotalChainDamage(
  baseDamage: number,
  bounces: number,
  damageDecay: number,
): number {
  if (bounces <= 0) return 0;
  if (damageDecay === 1) return baseDamage * bounces;
  return (
    (baseDamage * (1 - Math.pow(damageDecay, bounces))) / (1 - damageDecay)
  );
}

/**
 * Maximum bounces possible given enemy count and config.
 */
export function getMaxPossibleBounces(
  enemies: readonly EnemyLike[],
  config: ChainConfig,
): number {
  return Math.min(config.maxBounces, enemies.length);
}

/**
 * Whether a chain can reach from (fromX, fromY) to (targetX, targetY)
 * within bounceRange.
 */
export function canChainTo(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  bounceRange: number,
): boolean {
  return distSq(fromX, fromY, targetX, targetY) <= bounceRange * bounceRange;
}

/**
 * Chain efficiency: bouncesUsed / maxBounces (0–1).
 */
export function getChainEfficiency(
  result: ChainResult,
  config: ChainConfig,
): number {
  if (config.maxBounces <= 0) return 0;
  return result.bouncesUsed / config.maxBounces;
}
