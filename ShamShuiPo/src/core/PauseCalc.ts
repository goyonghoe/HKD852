// ── PauseCalc: Pause/resume timing & state management ──
// Pure TypeScript — NO Phaser imports. Testable without game engine.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface PauseState {
  isPaused: boolean;
  totalPausedTime: number;
  pauseStartTime: number | null;
  pauseCount: number;
}

export interface PauseStats {
  totalPausedSeconds: number;
  pauseCount: number;
  averagePauseDuration: number;
}

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

export function createPauseState(): PauseState {
  return {
    isPaused: false,
    totalPausedTime: 0,
    pauseStartTime: null,
    pauseCount: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § PAUSE / RESUME
// ════════════════════════════════════════════════════════════════

export function pause(state: PauseState, currentTime: number): PauseState {
  if (state.isPaused) return state;
  return {
    ...state,
    isPaused: true,
    pauseStartTime: currentTime,
    pauseCount: state.pauseCount + 1,
  };
}

export function resume(state: PauseState, currentTime: number): PauseState {
  if (!state.isPaused || state.pauseStartTime === null) return state;
  return {
    ...state,
    isPaused: false,
    pauseStartTime: null,
    totalPausedTime:
      state.totalPausedTime + (currentTime - state.pauseStartTime),
  };
}

// ════════════════════════════════════════════════════════════════
// § EFFECTIVE ELAPSED
// ════════════════════════════════════════════════════════════════

export function getEffectiveElapsed(
  totalElapsed: number,
  pauseState: PauseState,
  currentTime: number,
): number {
  let paused = pauseState.totalPausedTime;
  if (pauseState.isPaused && pauseState.pauseStartTime !== null) {
    paused += currentTime - pauseState.pauseStartTime;
  }
  return Math.max(0, totalElapsed - paused);
}

// ════════════════════════════════════════════════════════════════
// § CAN PAUSE
// ════════════════════════════════════════════════════════════════

const PAUSABLE_PHASES = new Set(["playing", "boss"]);

export function canPause(runPhase: string): boolean {
  return PAUSABLE_PHASES.has(runPhase);
}

// ════════════════════════════════════════════════════════════════
// § STATS
// ════════════════════════════════════════════════════════════════

export function getPauseStats(state: PauseState): PauseStats {
  const totalSec = state.totalPausedTime / 1000;
  return {
    totalPausedSeconds: totalSec,
    pauseCount: state.pauseCount,
    averagePauseDuration:
      state.pauseCount > 0 ? totalSec / state.pauseCount : 0,
  };
}
