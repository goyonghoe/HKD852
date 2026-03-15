// ── Neon Survivors: Enemy AI Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type AIBehavior =
  | "chase"
  | "orbit"
  | "zigzag"
  | "charge"
  | "retreat"
  | "strafe"
  | "swarm";

export interface AIState {
  behavior: AIBehavior;
  timer: number; // seconds in current behavior
  phaseTimer: number; // for periodic behaviors (zigzag, orbit)
  chargeTarget?: { x: number; y: number }; // locked-in charge direction
  retreatThreshold: number; // HP ratio to start retreating
}

export interface MovementResult {
  dx: number; // normalized direction X
  dy: number; // normalized direction Y
  speedMod: number; // speed modifier (e.g., charge = 2x)
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

/** Orbit radius in pixels */
const ORBIT_RADIUS = 200;

/** Orbit angular speed in radians/sec */
const ORBIT_SPEED = 1.5;

/** Zigzag lateral switch interval in seconds */
const ZIGZAG_INTERVAL = 0.5;

/** Zigzag lateral offset strength */
const ZIGZAG_STRENGTH = 0.6;

/** Charge dash duration in seconds */
const CHARGE_DASH_DURATION = 1.0;

/** Charge pause after dash in seconds */
const CHARGE_PAUSE_DURATION = 0.5;

/** Charge speed multiplier */
const CHARGE_SPEED_MOD = 2.0;

/** Charge windup duration (before dash starts) in seconds */
const CHARGE_WINDUP_DURATION = 0.8;

/** Strafe approach factor — how quickly strafe closes distance */
const STRAFE_APPROACH_FACTOR = 0.2;

/** Swarm angle offset factor */
const SWARM_ANGLE_FACTOR = 0.4;

/** Default retreat HP threshold */
const DEFAULT_RETREAT_THRESHOLD = 0.25;

/** Distance at which low-HP enemy starts retreating */
const RETREAT_DISTANCE_MIN = 150;

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

function normalize(dx: number, dy: number): { dx: number; dy: number } {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { dx: 0, dy: 0 };
  return { dx: dx / len, dy: dy / len };
}

function distanceBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ════════════════════════════════════════════════════════════════
// § createAIState
// ════════════════════════════════════════════════════════════════

/**
 * Create a new AI state with the given behavior and sensible defaults.
 */
export function createAIState(behavior: AIBehavior): AIState {
  return {
    behavior,
    timer: 0,
    phaseTimer: 0,
    retreatThreshold: DEFAULT_RETREAT_THRESHOLD,
  };
}

// ════════════════════════════════════════════════════════════════
// § getMovement
// ════════════════════════════════════════════════════════════════

/**
 * Calculate movement direction and speed modifier for the current AI state.
 * Returns the updated AI state alongside movement results.
 *
 * All returned dx/dy are normalized (unit length or zero).
 */
export function getMovement(
  state: AIState,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dt: number,
): { movement: MovementResult; newState: AIState } {
  const newState: AIState = {
    ...state,
    timer: state.timer + dt,
    phaseTimer: state.phaseTimer + dt,
  };

  switch (state.behavior) {
    case "chase":
      return {
        movement: moveChase(enemyX, enemyY, playerX, playerY),
        newState,
      };

    case "orbit":
      return moveOrbit(newState, enemyX, enemyY, playerX, playerY);

    case "zigzag":
      return moveZigzag(newState, enemyX, enemyY, playerX, playerY);

    case "charge":
      return moveCharge(newState, enemyX, enemyY, playerX, playerY);

    case "retreat":
      return {
        movement: moveRetreat(enemyX, enemyY, playerX, playerY),
        newState,
      };

    case "strafe":
      return {
        movement: moveStrafe(enemyX, enemyY, playerX, playerY),
        newState,
      };

    case "swarm":
      return {
        movement: moveSwarm(newState, enemyX, enemyY, playerX, playerY),
        newState,
      };

    default:
      return {
        movement: moveChase(enemyX, enemyY, playerX, playerY),
        newState,
      };
  }
}

// ── Chase ──

function moveChase(
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): MovementResult {
  const dir = normalize(playerX - enemyX, playerY - enemyY);
  return { dx: dir.dx, dy: dir.dy, speedMod: 1.0 };
}

// ── Orbit ──

function moveOrbit(
  state: AIState,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): { movement: MovementResult; newState: AIState } {
  const dist = distanceBetween(enemyX, enemyY, playerX, playerY);
  const angle = Math.atan2(enemyY - playerY, enemyX - playerX);

  // If too far, approach player; if too close, push away; else orbit
  const radialDiff = dist - ORBIT_RADIUS;
  const tangent = angle + Math.PI / 2; // perpendicular = orbit direction

  let dx: number;
  let dy: number;

  if (Math.abs(radialDiff) > 30) {
    // Blend approach/retreat with tangential orbit
    const approach = normalize(playerX - enemyX, playerY - enemyY);
    const sign = radialDiff > 0 ? 1 : -1;
    dx = approach.dx * sign * 0.5 + Math.cos(tangent) * 0.5;
    dy = approach.dy * sign * 0.5 + Math.sin(tangent) * 0.5;
  } else {
    // Pure orbit
    dx = Math.cos(tangent);
    dy = Math.sin(tangent);
  }

  const norm = normalize(dx, dy);
  return {
    movement: { dx: norm.dx, dy: norm.dy, speedMod: 1.0 },
    newState: { ...state, phaseTimer: state.phaseTimer + ORBIT_SPEED * 0.016 },
  };
}

// ── Zigzag ──

function moveZigzag(
  state: AIState,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): { movement: MovementResult; newState: AIState } {
  const chase = normalize(playerX - enemyX, playerY - enemyY);

  // Perpendicular direction (rotate 90 degrees)
  const perpX = -chase.dy;
  const perpY = chase.dx;

  // Alternate sides based on phaseTimer
  const zigzagCycle = Math.floor(state.phaseTimer / ZIGZAG_INTERVAL);
  const side = zigzagCycle % 2 === 0 ? 1 : -1;

  const dx = chase.dx + perpX * ZIGZAG_STRENGTH * side;
  const dy = chase.dy + perpY * ZIGZAG_STRENGTH * side;
  const norm = normalize(dx, dy);

  return {
    movement: { dx: norm.dx, dy: norm.dy, speedMod: 1.0 },
    newState: state,
  };
}

// ── Charge ──

function moveCharge(
  state: AIState,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): { movement: MovementResult; newState: AIState } {
  const totalCycle =
    CHARGE_WINDUP_DURATION + CHARGE_DASH_DURATION + CHARGE_PAUSE_DURATION;
  const cycleTime = state.timer % totalCycle;

  // Phase 1: Windup — slow approach, locking target
  if (cycleTime < CHARGE_WINDUP_DURATION) {
    const dir = normalize(playerX - enemyX, playerY - enemyY);
    const newState: AIState = {
      ...state,
      chargeTarget: { x: playerX, y: playerY },
    };
    return {
      movement: { dx: dir.dx, dy: dir.dy, speedMod: 0.3 },
      newState,
    };
  }

  // Phase 2: Dash — locked direction, 2x speed
  if (cycleTime < CHARGE_WINDUP_DURATION + CHARGE_DASH_DURATION) {
    const target = state.chargeTarget ?? { x: playerX, y: playerY };
    const dir = normalize(target.x - enemyX, target.y - enemyY);
    return {
      movement: { dx: dir.dx, dy: dir.dy, speedMod: CHARGE_SPEED_MOD },
      newState: state,
    };
  }

  // Phase 3: Pause — stationary
  return {
    movement: { dx: 0, dy: 0, speedMod: 0 },
    newState: state,
  };
}

// ── Retreat ──

function moveRetreat(
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): MovementResult {
  const flee = calculateFleeDirection(enemyX, enemyY, playerX, playerY);
  return { dx: flee.dx, dy: flee.dy, speedMod: 1.2 };
}

// ── Strafe ──

function moveStrafe(
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): MovementResult {
  const chase = normalize(playerX - enemyX, playerY - enemyY);

  // Perpendicular (strafe direction)
  const perpX = -chase.dy;
  const perpY = chase.dx;

  // Blend: mostly strafe, slightly close distance
  const dx = perpX + chase.dx * STRAFE_APPROACH_FACTOR;
  const dy = perpY + chase.dy * STRAFE_APPROACH_FACTOR;
  const norm = normalize(dx, dy);

  return { dx: norm.dx, dy: norm.dy, speedMod: 1.0 };
}

// ── Swarm ──

function moveSwarm(
  state: AIState,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): MovementResult {
  const chase = normalize(playerX - enemyX, playerY - enemyY);

  // Add slight angle offset based on phaseTimer for spread
  const angle = Math.atan2(chase.dy, chase.dx);
  const offset = Math.sin(state.phaseTimer * 2) * SWARM_ANGLE_FACTOR;
  const newAngle = angle + offset;

  return {
    dx: Math.cos(newAngle),
    dy: Math.sin(newAngle),
    speedMod: 1.0,
  };
}

// ════════════════════════════════════════════════════════════════
// § shouldChangeBehavior
// ════════════════════════════════════════════════════════════════

/**
 * Suggest a behavior change based on current conditions.
 * Returns null if no change is recommended.
 */
export function shouldChangeBehavior(
  state: AIState,
  hpRatio: number,
  distToPlayer: number,
): AIBehavior | null {
  // Low HP → retreat (unless already retreating)
  if (
    hpRatio <= state.retreatThreshold &&
    state.behavior !== "retreat" &&
    distToPlayer < RETREAT_DISTANCE_MIN
  ) {
    return "retreat";
  }

  // If retreating and HP recovered or far enough, go back to chase
  if (
    state.behavior === "retreat" &&
    (hpRatio > state.retreatThreshold || distToPlayer >= RETREAT_DISTANCE_MIN)
  ) {
    return "chase";
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
// § getDefaultBehaviorForEnemy
// ════════════════════════════════════════════════════════════════

/**
 * Map enemy IDs to their default AI behavior pattern.
 */
const ENEMY_BEHAVIOR_MAP: Record<string, AIBehavior> = {
  drone: "swarm",
  crawler: "chase",
  enforcer: "strafe",
  dasher: "charge",
  sentinel: "orbit",
  bomber: "zigzag",
  mini_boss: "charge",
  chapter_boss: "strafe",
  final_boss: "orbit",
};

export function getDefaultBehaviorForEnemy(enemyId: string): AIBehavior {
  return ENEMY_BEHAVIOR_MAP[enemyId] ?? "chase";
}

// ════════════════════════════════════════════════════════════════
// § calculateFleeDirection
// ════════════════════════════════════════════════════════════════

/**
 * Calculate the direction opposite to the player — flee away.
 * Returns a normalized direction vector.
 */
export function calculateFleeDirection(
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): { dx: number; dy: number } {
  return normalize(enemyX - playerX, enemyY - playerY);
}

// ════════════════════════════════════════════════════════════════
// § getChargeWindup
// ════════════════════════════════════════════════════════════════

/**
 * Returns 0–1 progress of the charge windup phase.
 * 0 = windup just started, 1 = windup complete (about to dash).
 * Returns 0 if not in windup phase.
 */
export function getChargeWindup(state: AIState): number {
  if (state.behavior !== "charge") return 0;

  const totalCycle =
    CHARGE_WINDUP_DURATION + CHARGE_DASH_DURATION + CHARGE_PAUSE_DURATION;
  const cycleTime = state.timer % totalCycle;

  if (cycleTime >= CHARGE_WINDUP_DURATION) return 0;

  return Math.min(cycleTime / CHARGE_WINDUP_DURATION, 1);
}
