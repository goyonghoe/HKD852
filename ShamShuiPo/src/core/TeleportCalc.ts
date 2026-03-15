// TeleportCalc.ts — Enemy Teleport Mechanic (pure TypeScript, no Phaser)

// ── Types ──────────────────────────────────────────────

export interface TeleportConfig {
  readonly cooldown: number; // ms
  readonly windupTime: number; // ms — telegraph before disappearing
  readonly reappearDelay: number; // ms
  readonly maxRange: number; // pixels
  readonly minRange: number; // pixels
}

export type TeleportPhase =
  | "ready"
  | "windup"
  | "gone"
  | "reappear"
  | "cooldown";

export interface TeleportState {
  readonly config: TeleportConfig;
  readonly phase: TeleportPhase;
  readonly elapsed: number; // ms within current phase
  readonly targetX: number;
  readonly targetY: number;
  readonly originX: number;
  readonly originY: number;
  readonly cooldownElapsed: number; // ms
}

export interface TeleportResult {
  readonly x: number;
  readonly y: number;
  readonly valid: boolean;
}

// ── Constants ──────────────────────────────────────────

const GAME_W = 720;
const GAME_H = 1280;

const DEFAULT_CONFIG: TeleportConfig = {
  cooldown: 5000,
  windupTime: 500,
  reappearDelay: 300,
  maxRange: 400,
  minRange: 100,
};

// ── Helpers ────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Public Functions ───────────────────────────────────

export function createTeleportState(
  config?: Partial<TeleportConfig>,
): TeleportState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    phase: "ready",
    elapsed: 0,
    targetX: 0,
    targetY: 0,
    originX: 0,
    originY: 0,
    cooldownElapsed: 0,
  };
}

export function canTeleport(state: TeleportState): boolean {
  return state.phase === "ready";
}

export function startTeleport(
  state: TeleportState,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
): TeleportState {
  if (state.phase !== "ready") return state;

  const dist = distance(originX, originY, targetX, targetY);
  if (dist < state.config.minRange || dist > state.config.maxRange) {
    return state;
  }

  // Clamp target within game bounds
  const clampedX = clamp(targetX, 0, GAME_W);
  const clampedY = clamp(targetY, 0, GAME_H);

  return {
    ...state,
    phase: "windup",
    elapsed: 0,
    originX,
    originY,
    targetX: clampedX,
    targetY: clampedY,
    cooldownElapsed: 0,
  };
}

export function updateTeleport(
  state: TeleportState,
  deltaMs: number,
): TeleportState {
  if (state.phase === "ready") return state;

  const elapsed = state.elapsed + deltaMs;

  switch (state.phase) {
    case "windup": {
      if (elapsed >= state.config.windupTime) {
        return {
          ...state,
          phase: "gone",
          elapsed: elapsed - state.config.windupTime,
        };
      }
      return { ...state, elapsed };
    }

    case "gone": {
      if (elapsed >= state.config.reappearDelay) {
        return {
          ...state,
          phase: "reappear",
          elapsed: 0,
        };
      }
      return { ...state, elapsed };
    }

    case "reappear": {
      // Reappear is instantaneous — transition to cooldown
      return {
        ...state,
        phase: "cooldown",
        elapsed: 0,
        cooldownElapsed: 0,
      };
    }

    case "cooldown": {
      const cdElapsed = state.cooldownElapsed + deltaMs;
      if (cdElapsed >= state.config.cooldown) {
        return {
          ...state,
          phase: "ready",
          elapsed: 0,
          cooldownElapsed: 0,
        };
      }
      return { ...state, elapsed: 0, cooldownElapsed: cdElapsed };
    }

    default:
      return state;
  }
}

export function calculateTeleportTarget(
  originX: number,
  originY: number,
  playerX: number,
  playerY: number,
  config: TeleportConfig,
): TeleportResult {
  const dx = playerX - originX;
  const dy = playerY - originY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // If enemy is on top of player, pick a direction
  if (dist < 1) {
    const fallbackX = clamp(playerX + config.minRange, 0, GAME_W);
    const fallbackY = clamp(playerY, 0, GAME_H);
    return { x: fallbackX, y: fallbackY, valid: true };
  }

  // Normalised direction from origin toward player
  const nx = dx / dist;
  const ny = dy / dist;

  // Flanking: land behind the player at midpoint of min/maxRange past the player
  const flankDist = (config.minRange + config.maxRange) / 2;
  let tx = playerX + nx * (flankDist * 0.5);
  let ty = playerY + ny * (flankDist * 0.5);

  // Clamp to game bounds
  tx = clamp(tx, 0, GAME_W);
  ty = clamp(ty, 0, GAME_H);

  // Validate resulting distance from origin
  const resultDist = distance(originX, originY, tx, ty);
  const valid = resultDist >= config.minRange && resultDist <= config.maxRange;

  return { x: tx, y: ty, valid };
}

export function getPhase(state: TeleportState): string {
  return state.phase;
}

export function isVisible(state: TeleportState): boolean {
  return state.phase !== "gone";
}

export function isTelegraphing(state: TeleportState): boolean {
  return state.phase === "windup";
}

export function getPhaseProgress(state: TeleportState): number {
  switch (state.phase) {
    case "ready":
      return 0;
    case "windup":
      return state.config.windupTime > 0
        ? clamp(state.elapsed / state.config.windupTime, 0, 1)
        : 1;
    case "gone":
      return state.config.reappearDelay > 0
        ? clamp(state.elapsed / state.config.reappearDelay, 0, 1)
        : 1;
    case "reappear":
      return 1;
    case "cooldown":
      return state.config.cooldown > 0
        ? clamp(state.cooldownElapsed / state.config.cooldown, 0, 1)
        : 1;
    default:
      return 0;
  }
}

export function resetTeleport(state: TeleportState): TeleportState {
  return {
    ...state,
    phase: "ready",
    elapsed: 0,
    targetX: 0,
    targetY: 0,
    originX: 0,
    originY: 0,
    cooldownElapsed: 0,
  };
}
