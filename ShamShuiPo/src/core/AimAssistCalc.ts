// AimAssistCalc — Auto-Aim / Target Snapping System
// Pure TypeScript, no Phaser imports, immutable state

export interface AimTarget {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly priority: number;
  readonly distance: number;
}

export interface AimConfig {
  readonly maxRange: number;
  readonly snapAngle: number; // degrees — max deviation from current aim
  readonly priorityWeight: number; // 0-1 — weight distance vs priority
  readonly stickyTime: number; // ms — how long to keep targeting same enemy
}

export interface AimState {
  readonly config: AimConfig;
  readonly currentTargetId: string | null;
  readonly aimAngle: number; // radians
  readonly stickyElapsed: number;
  readonly lastAimX: number;
  readonly lastAimY: number;
}

const DEFAULT_CONFIG: AimConfig = {
  maxRange: 300,
  snapAngle: 45,
  priorityWeight: 0.5,
  stickyTime: 500,
};

export function createAimState(config?: Partial<AimConfig>): AimState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    currentTargetId: null,
    aimAngle: 0,
    stickyElapsed: 0,
    lastAimX: 0,
    lastAimY: 0,
  };
}

export function getDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getAimAngle(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
): number {
  return Math.atan2(targetY - playerY, targetX - playerX);
}

export function isInRange(
  state: AimState,
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
): boolean {
  return (
    getDistance(playerX, playerY, targetX, targetY) <= state.config.maxRange
  );
}

export function getAimDirection(state: AimState): { dx: number; dy: number } {
  return {
    dx: Math.cos(state.aimAngle),
    dy: Math.sin(state.aimAngle),
  };
}

export function hasTarget(state: AimState): boolean {
  return state.currentTargetId !== null;
}

export function clearTarget(state: AimState): AimState {
  return {
    ...state,
    currentTargetId: null,
  };
}

export function setConfig(
  state: AimState,
  config: Partial<AimConfig>,
): AimState {
  return {
    ...state,
    config: { ...state.config, ...config },
  };
}

interface EnemyInput {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly priority?: number;
}

function scoreEnemy(
  dist: number,
  priority: number,
  maxRange: number,
  priorityWeight: number,
): number {
  // Normalized distance score: 1 (closest) to 0 (at maxRange)
  const distScore = 1 - dist / maxRange;
  // Priority score: higher priority = better (normalize assuming priority 0-10 range, clamp)
  const prioScore = Math.min(Math.max(priority / 10, 0), 1);
  // Combined: higher is better
  return (1 - priorityWeight) * distScore + priorityWeight * prioScore;
}

export function findBestTarget(
  state: AimState,
  playerX: number,
  playerY: number,
  enemies: readonly EnemyInput[],
): AimTarget | null {
  const { maxRange, priorityWeight } = state.config;

  let bestScore = -Infinity;
  let bestTarget: AimTarget | null = null;

  for (const enemy of enemies) {
    const dist = getDistance(playerX, playerY, enemy.x, enemy.y);
    if (dist > maxRange) continue;

    const priority = enemy.priority ?? 0;
    const score = scoreEnemy(dist, priority, maxRange, priorityWeight);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = {
        id: enemy.id,
        x: enemy.x,
        y: enemy.y,
        priority,
        distance: dist,
      };
    }
  }

  return bestTarget;
}

export function updateAim(
  state: AimState,
  playerX: number,
  playerY: number,
  enemies: readonly EnemyInput[],
  deltaMs: number,
): AimState {
  const { stickyTime } = state.config;

  // Check if current sticky target is still valid
  if (state.currentTargetId !== null) {
    const currentEnemy = enemies.find((e) => e.id === state.currentTargetId);
    const newElapsed = state.stickyElapsed + deltaMs;

    if (
      currentEnemy &&
      isInRange(state, playerX, playerY, currentEnemy.x, currentEnemy.y)
    ) {
      if (newElapsed < stickyTime) {
        // Keep current target, update aim angle
        const angle = getAimAngle(
          playerX,
          playerY,
          currentEnemy.x,
          currentEnemy.y,
        );
        return {
          ...state,
          aimAngle: angle,
          stickyElapsed: newElapsed,
          lastAimX: currentEnemy.x,
          lastAimY: currentEnemy.y,
        };
      }
      // Sticky time expired — fall through to find new best (may re-select same)
    }
    // Current target gone or out of range — fall through to find new
  }

  // Find new best target
  const best = findBestTarget(state, playerX, playerY, enemies);

  if (best === null) {
    return {
      ...state,
      currentTargetId: null,
      stickyElapsed: 0,
    };
  }

  const angle = getAimAngle(playerX, playerY, best.x, best.y);

  return {
    ...state,
    currentTargetId: best.id,
    aimAngle: angle,
    stickyElapsed: 0,
    lastAimX: best.x,
    lastAimY: best.y,
  };
}
