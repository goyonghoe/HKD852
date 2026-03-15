// ── TimerCalc: Flexible timer system for game timers ──
// Pure TypeScript — NO Phaser imports. Testable without game engine.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type TimerType = "countdown" | "stopwatch" | "interval" | "delayed";

export interface Timer {
  readonly id: string;
  readonly type: TimerType;
  readonly duration: number;
  readonly elapsed: number;
  readonly isComplete: boolean;
  readonly isPaused: boolean;
  readonly loops: number;
  readonly maxLoops: number;
  readonly callback?: string;
}

export interface TimerManagerState {
  readonly timers: Record<string, Timer>;
  readonly nextId: number;
}

export interface TickResult {
  readonly state: TimerManagerState;
  readonly completedTimers: string[];
  readonly triggeredCallbacks: string[];
}

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

export function createTimerManager(): TimerManagerState {
  return { timers: {}, nextId: 1 };
}

function genId(state: TimerManagerState): string {
  return `timer_${state.nextId}`;
}

// ════════════════════════════════════════════════════════════════
// § ADD TIMERS
// ════════════════════════════════════════════════════════════════

export function addCountdown(
  state: TimerManagerState,
  duration: number,
  callback?: string,
): { state: TimerManagerState; id: string } {
  const id = genId(state);
  const timer: Timer = {
    id,
    type: "countdown",
    duration,
    elapsed: 0,
    isComplete: false,
    isPaused: false,
    loops: 0,
    maxLoops: 0,
    callback,
  };
  return {
    state: {
      timers: { ...state.timers, [id]: timer },
      nextId: state.nextId + 1,
    },
    id,
  };
}

export function addStopwatch(state: TimerManagerState): {
  state: TimerManagerState;
  id: string;
} {
  const id = genId(state);
  const timer: Timer = {
    id,
    type: "stopwatch",
    duration: Infinity,
    elapsed: 0,
    isComplete: false,
    isPaused: false,
    loops: 0,
    maxLoops: 0,
  };
  return {
    state: {
      timers: { ...state.timers, [id]: timer },
      nextId: state.nextId + 1,
    },
    id,
  };
}

export function addInterval(
  state: TimerManagerState,
  interval: number,
  maxLoops: number,
  callback?: string,
): { state: TimerManagerState; id: string } {
  const id = genId(state);
  const timer: Timer = {
    id,
    type: "interval",
    duration: interval,
    elapsed: 0,
    isComplete: false,
    isPaused: false,
    loops: 0,
    maxLoops,
    callback,
  };
  return {
    state: {
      timers: { ...state.timers, [id]: timer },
      nextId: state.nextId + 1,
    },
    id,
  };
}

export function addDelayed(
  state: TimerManagerState,
  delay: number,
  callback?: string,
): { state: TimerManagerState; id: string } {
  const id = genId(state);
  const timer: Timer = {
    id,
    type: "delayed",
    duration: delay,
    elapsed: 0,
    isComplete: false,
    isPaused: false,
    loops: 0,
    maxLoops: 1,
    callback,
  };
  return {
    state: {
      timers: { ...state.timers, [id]: timer },
      nextId: state.nextId + 1,
    },
    id,
  };
}

// ════════════════════════════════════════════════════════════════
// § TICK
// ════════════════════════════════════════════════════════════════

function tickTimer(
  timer: Timer,
  dt: number,
): { timer: Timer; completed: boolean; triggered: boolean } {
  if (timer.isPaused || timer.isComplete) {
    return { timer, completed: false, triggered: false };
  }

  const newElapsed = timer.elapsed + dt;

  switch (timer.type) {
    case "countdown": {
      const done = newElapsed >= timer.duration;
      return {
        timer: {
          ...timer,
          elapsed: done ? timer.duration : newElapsed,
          isComplete: done,
        },
        completed: done,
        triggered: done && timer.callback !== undefined,
      };
    }

    case "stopwatch": {
      return {
        timer: { ...timer, elapsed: newElapsed },
        completed: false,
        triggered: false,
      };
    }

    case "interval": {
      if (newElapsed >= timer.duration) {
        const newLoops = timer.loops + 1;
        const done = newLoops >= timer.maxLoops;
        return {
          timer: {
            ...timer,
            elapsed: done ? timer.duration : newElapsed - timer.duration,
            loops: newLoops,
            isComplete: done,
          },
          completed: done,
          triggered: timer.callback !== undefined,
        };
      }
      return {
        timer: { ...timer, elapsed: newElapsed },
        completed: false,
        triggered: false,
      };
    }

    case "delayed": {
      const done = newElapsed >= timer.duration;
      return {
        timer: {
          ...timer,
          elapsed: done ? timer.duration : newElapsed,
          isComplete: done,
          loops: done ? 1 : 0,
        },
        completed: done,
        triggered: done && timer.callback !== undefined,
      };
    }
  }
}

export function tick(state: TimerManagerState, dt: number): TickResult {
  const completedTimers: string[] = [];
  const triggeredCallbacks: string[] = [];
  const newTimers: Record<string, Timer> = {};

  for (const [id, timer] of Object.entries(state.timers)) {
    const result = tickTimer(timer, dt);
    newTimers[id] = result.timer;
    if (result.completed) completedTimers.push(id);
    if (result.triggered && result.timer.callback) {
      triggeredCallbacks.push(result.timer.callback);
    }
  }

  return {
    state: { timers: newTimers, nextId: state.nextId },
    completedTimers,
    triggeredCallbacks,
  };
}

// ════════════════════════════════════════════════════════════════
// § PAUSE / RESUME
// ════════════════════════════════════════════════════════════════

export function pauseTimer(
  state: TimerManagerState,
  id: string,
): TimerManagerState {
  const timer = state.timers[id];
  if (!timer || timer.isPaused) return state;
  return {
    ...state,
    timers: { ...state.timers, [id]: { ...timer, isPaused: true } },
  };
}

export function resumeTimer(
  state: TimerManagerState,
  id: string,
): TimerManagerState {
  const timer = state.timers[id];
  if (!timer || !timer.isPaused) return state;
  return {
    ...state,
    timers: { ...state.timers, [id]: { ...timer, isPaused: false } },
  };
}

export function pauseAll(state: TimerManagerState): TimerManagerState {
  const newTimers: Record<string, Timer> = {};
  for (const [id, timer] of Object.entries(state.timers)) {
    newTimers[id] = timer.isPaused ? timer : { ...timer, isPaused: true };
  }
  return { ...state, timers: newTimers };
}

export function resumeAll(state: TimerManagerState): TimerManagerState {
  const newTimers: Record<string, Timer> = {};
  for (const [id, timer] of Object.entries(state.timers)) {
    newTimers[id] = timer.isPaused ? { ...timer, isPaused: false } : timer;
  }
  return { ...state, timers: newTimers };
}

// ════════════════════════════════════════════════════════════════
// § RESET / REMOVE
// ════════════════════════════════════════════════════════════════

export function resetTimer(
  state: TimerManagerState,
  id: string,
): TimerManagerState {
  const timer = state.timers[id];
  if (!timer) return state;
  return {
    ...state,
    timers: {
      ...state.timers,
      [id]: { ...timer, elapsed: 0, isComplete: false, loops: 0 },
    },
  };
}

export function removeTimer(
  state: TimerManagerState,
  id: string,
): TimerManagerState {
  const { [id]: _, ...rest } = state.timers;
  return { ...state, timers: rest };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

export function getTimeRemaining(timer: Timer): number {
  if (timer.type !== "countdown" && timer.type !== "delayed") return 0;
  return Math.max(0, timer.duration - timer.elapsed);
}

export function getTimeElapsed(timer: Timer): number {
  return timer.elapsed;
}

export function getProgress(timer: Timer): number {
  if (timer.duration === 0 || timer.duration === Infinity) return 0;
  return Math.min(1, timer.elapsed / timer.duration);
}

export function isExpired(timer: Timer): boolean {
  return timer.isComplete;
}

export function getActiveTimerCount(state: TimerManagerState): number {
  let count = 0;
  for (const timer of Object.values(state.timers)) {
    if (!timer.isPaused && !timer.isComplete) count++;
  }
  return count;
}

// ════════════════════════════════════════════════════════════════
// § FORMAT
// ════════════════════════════════════════════════════════════════

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);

  const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (tenths === 0) {
    return `${minutes}:${secStr}`;
  }
  return `${minutes}:${secStr}.${tenths}`;
}
