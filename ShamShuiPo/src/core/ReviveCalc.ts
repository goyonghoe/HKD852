// ReviveCalc.ts — Player Revive / Extra Life System
// Pure TypeScript, no Phaser imports, immutable state

export interface ReviveConfig {
  readonly maxLives: number;
  readonly reviveHP: number; // 0-1 percentage of max HP
  readonly invincibilityDuration: number; // ms i-frames after revive
  readonly reviveCooldown: number; // ms min time between revives
}

export interface ReviveState {
  readonly config: ReviveConfig;
  readonly livesRemaining: number;
  readonly totalRevives: number;
  readonly lastReviveTime: number;
  readonly isInvincible: boolean;
  readonly invincibilityElapsed: number; // ms
}

const DEFAULT_CONFIG: ReviveConfig = {
  maxLives: 1,
  reviveHP: 0.5,
  invincibilityDuration: 3000,
  reviveCooldown: 0,
};

export function createReviveState(config?: Partial<ReviveConfig>): ReviveState {
  const merged: ReviveConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    config: merged,
    livesRemaining: merged.maxLives,
    totalRevives: 0,
    lastReviveTime: 0,
    isInvincible: false,
    invincibilityElapsed: 0,
  };
}

export function canRevive(state: ReviveState): boolean {
  return state.livesRemaining > 0;
}

export function revive(state: ReviveState, currentTime: number): ReviveState {
  if (!canRevive(state)) return state;
  if (
    state.config.reviveCooldown > 0 &&
    state.lastReviveTime > 0 &&
    currentTime - state.lastReviveTime < state.config.reviveCooldown
  ) {
    return state;
  }
  return {
    ...state,
    livesRemaining: state.livesRemaining - 1,
    totalRevives: state.totalRevives + 1,
    lastReviveTime: currentTime,
    isInvincible: true,
    invincibilityElapsed: 0,
  };
}

export function updateRevive(state: ReviveState, deltaMs: number): ReviveState {
  if (!state.isInvincible) return state;
  const elapsed = state.invincibilityElapsed + deltaMs;
  if (elapsed >= state.config.invincibilityDuration) {
    return {
      ...state,
      isInvincible: false,
      invincibilityElapsed: state.config.invincibilityDuration,
    };
  }
  return {
    ...state,
    invincibilityElapsed: elapsed,
  };
}

export function getReviveHP(state: ReviveState, maxHP: number): number {
  return maxHP * state.config.reviveHP;
}

export function isInvincible(state: ReviveState): boolean {
  return state.isInvincible;
}

export function getLivesRemaining(state: ReviveState): number {
  return state.livesRemaining;
}

export function addLife(state: ReviveState, count: number = 1): ReviveState {
  const newLives = Math.min(
    state.livesRemaining + count,
    state.config.maxLives,
  );
  return {
    ...state,
    livesRemaining: newLives,
  };
}

export function setMaxLives(state: ReviveState, maxLives: number): ReviveState {
  return {
    ...state,
    config: { ...state.config, maxLives },
    livesRemaining: Math.min(state.livesRemaining, maxLives),
  };
}

export function getStats(state: ReviveState): {
  livesRemaining: number;
  totalRevives: number;
  maxLives: number;
} {
  return {
    livesRemaining: state.livesRemaining,
    totalRevives: state.totalRevives,
    maxLives: state.config.maxLives,
  };
}

export function resetLives(state: ReviveState): ReviveState {
  return {
    ...state,
    livesRemaining: state.config.maxLives,
    totalRevives: state.totalRevives,
    lastReviveTime: state.lastReviveTime,
    isInvincible: false,
    invincibilityElapsed: 0,
  };
}
