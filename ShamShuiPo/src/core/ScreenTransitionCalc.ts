// ── Neon Survivors: Screen Transition Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export type TransitionType =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "wipe"
  | "none";

export type TransitionPhase = "idle" | "out" | "hold" | "in" | "complete";

export interface TransitionConfig {
  /** Transition animation type */
  readonly type: TransitionType;
  /** Duration of the out phase in ms */
  readonly outDuration: number;
  /** Duration of the hold phase in ms */
  readonly holdDuration: number;
  /** Duration of the in phase in ms */
  readonly inDuration: number;
  /** Overlay color (hex string) */
  readonly color: string;
}

export interface TransitionState {
  readonly config: TransitionConfig;
  readonly phase: TransitionPhase;
  /** Elapsed time within current phase in ms */
  readonly elapsed: number;
  /** Progress within current phase (0-1) */
  readonly progress: number;
  /** Scene transitioning from */
  readonly fromScene: string;
  /** Scene transitioning to */
  readonly toScene: string;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const VIEWPORT_WIDTH = 720;
const VIEWPORT_HEIGHT = 1280;

// ════════════════════════════════════════════════════════════════
// § DEFAULT CONFIG
// ════════════════════════════════════════════════════════════════

/**
 * Returns the default transition configuration.
 */
export function getDefaultTransitionConfig(): TransitionConfig {
  return {
    type: "fade",
    outDuration: 300,
    holdDuration: 100,
    inDuration: 300,
    color: "#000000",
  };
}

// ════════════════════════════════════════════════════════════════
// § STATE CREATION
// ════════════════════════════════════════════════════════════════

/**
 * Creates a default idle transition state.
 */
export function createTransitionState(): TransitionState {
  return {
    config: getDefaultTransitionConfig(),
    phase: "idle",
    elapsed: 0,
    progress: 0,
    fromScene: "",
    toScene: "",
  };
}

// ════════════════════════════════════════════════════════════════
// § START TRANSITION
// ════════════════════════════════════════════════════════════════

/**
 * Starts a new transition from one scene to another.
 * Merges partial config with defaults.
 */
export function startTransition(
  state: TransitionState,
  fromScene: string,
  toScene: string,
  config?: Partial<TransitionConfig>,
): TransitionState {
  const mergedConfig: TransitionConfig = {
    ...state.config,
    ...config,
  };
  return {
    config: mergedConfig,
    phase: "out",
    elapsed: 0,
    progress: 0,
    fromScene,
    toScene,
  };
}

// ════════════════════════════════════════════════════════════════
// § UPDATE TRANSITION
// ════════════════════════════════════════════════════════════════

/**
 * Advances the transition by deltaMs.
 * Progresses through out → hold → in → complete phases.
 */
export function updateTransition(
  state: TransitionState,
  deltaMs: number,
): TransitionState {
  if (state.phase === "idle" || state.phase === "complete") {
    return state;
  }

  const newElapsed = state.elapsed + deltaMs;

  if (state.phase === "out") {
    const duration = state.config.outDuration;
    if (duration <= 0 || newElapsed >= duration) {
      const overflow = duration <= 0 ? newElapsed : newElapsed - duration;
      return updateTransition(
        { ...state, phase: "hold", elapsed: 0, progress: 0 },
        overflow,
      );
    }
    const progress = Math.min(1, newElapsed / duration);
    return { ...state, elapsed: newElapsed, progress };
  }

  if (state.phase === "hold") {
    const duration = state.config.holdDuration;
    if (duration <= 0 || newElapsed >= duration) {
      const overflow = duration <= 0 ? newElapsed : newElapsed - duration;
      return updateTransition(
        { ...state, phase: "in", elapsed: 0, progress: 0 },
        overflow,
      );
    }
    const progress = Math.min(1, newElapsed / duration);
    return { ...state, elapsed: newElapsed, progress };
  }

  if (state.phase === "in") {
    const duration = state.config.inDuration;
    if (duration <= 0 || newElapsed >= duration) {
      return {
        ...state,
        phase: "complete",
        elapsed: duration <= 0 ? 0 : duration,
        progress: 1,
      };
    }
    const progress = Math.min(1, newElapsed / duration);
    return { ...state, elapsed: newElapsed, progress };
  }

  return state;
}

// ════════════════════════════════════════════════════════════════
// § PROGRESS QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Returns 0-1 progress within the current phase.
 */
export function getProgress(state: TransitionState): number {
  return state.progress;
}

/**
 * Returns 0-1 progress across the entire transition (out + hold + in).
 */
export function getOverallProgress(state: TransitionState): number {
  if (state.phase === "idle") return 0;
  if (state.phase === "complete") return 1;

  const { outDuration, holdDuration, inDuration } = state.config;
  const totalDuration = outDuration + holdDuration + inDuration;

  if (totalDuration <= 0) return 1;

  let consumedBefore = 0;
  let currentDuration = 0;

  if (state.phase === "out") {
    consumedBefore = 0;
    currentDuration = outDuration;
  } else if (state.phase === "hold") {
    consumedBefore = outDuration;
    currentDuration = holdDuration;
  } else if (state.phase === "in") {
    consumedBefore = outDuration + holdDuration;
    currentDuration = inDuration;
  }

  const phaseContribution =
    currentDuration > 0
      ? (state.elapsed / currentDuration) * currentDuration
      : 0;

  return Math.min(1, (consumedBefore + phaseContribution) / totalDuration);
}

// ════════════════════════════════════════════════════════════════
// § ALPHA (FADE)
// ════════════════════════════════════════════════════════════════

/**
 * Returns opacity for fade transitions.
 * - out phase: 0 → 1 (screen fades to color)
 * - hold phase: 1
 * - in phase: 1 → 0 (color fades to reveal new scene)
 * - idle/complete: 0
 * - 'none' type: always 0
 */
export function getAlpha(state: TransitionState): number {
  if (state.config.type === "none") return 0;
  if (state.phase === "idle" || state.phase === "complete") return 0;
  if (state.phase === "out") return state.progress;
  if (state.phase === "hold") return 1;
  if (state.phase === "in") return 1 - state.progress;
  return 0;
}

// ════════════════════════════════════════════════════════════════
// § OFFSET (SLIDE)
// ════════════════════════════════════════════════════════════════

/**
 * Returns pixel offset for slide transitions based on 720x1280 viewport.
 * - slide-left: scene slides left (negative x)
 * - slide-right: scene slides right (positive x)
 * - slide-up: scene slides up (negative y)
 * - slide-down: scene slides down (positive y)
 *
 * During out phase: offset goes from 0 to full viewport distance.
 * During in phase: offset goes from full viewport distance to 0.
 * During hold: full offset. idle/complete: zero.
 */
export function getOffset(state: TransitionState): { x: number; y: number } {
  const type = state.config.type;

  if (
    type !== "slide-left" &&
    type !== "slide-right" &&
    type !== "slide-up" &&
    type !== "slide-down"
  ) {
    return { x: 0, y: 0 };
  }

  let factor = 0;
  if (state.phase === "out") {
    factor = state.progress;
  } else if (state.phase === "hold") {
    factor = 1;
  } else if (state.phase === "in") {
    factor = 1 - state.progress;
  }
  // idle and complete: factor = 0
  if (factor === 0) return { x: 0, y: 0 };

  switch (type) {
    case "slide-left":
      return { x: -VIEWPORT_WIDTH * factor, y: 0 };
    case "slide-right":
      return { x: VIEWPORT_WIDTH * factor, y: 0 };
    case "slide-up":
      return { x: 0, y: -VIEWPORT_HEIGHT * factor };
    case "slide-down":
      return { x: 0, y: VIEWPORT_HEIGHT * factor };
  }
}

// ════════════════════════════════════════════════════════════════
// § STATE QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Returns true if a transition is actively running (not idle, not complete).
 */
export function isActive(state: TransitionState): boolean {
  return state.phase !== "idle" && state.phase !== "complete";
}

/**
 * Returns true if the transition is in the hold phase (scene swap point).
 */
export function isHoldPhase(state: TransitionState): boolean {
  return state.phase === "hold";
}

// ════════════════════════════════════════════════════════════════
// § FORCE COMPLETE
// ════════════════════════════════════════════════════════════════

/**
 * Forces the transition to the complete state immediately.
 */
export function completeTransition(state: TransitionState): TransitionState {
  return {
    ...state,
    phase: "complete",
    elapsed: 0,
    progress: 1,
  };
}
