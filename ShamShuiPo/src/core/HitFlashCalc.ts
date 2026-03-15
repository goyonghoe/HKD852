// ── Neon Survivors: Hit Flash Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface HitFlashEffect {
  readonly id: string;
  readonly targetId: string;
  readonly color: string;
  readonly intensity: number;
  readonly startTime: number;
  readonly duration: number;
  readonly elapsed: number;
  readonly active: boolean;
}

export interface HitFlashState {
  readonly effects: readonly HitFlashEffect[];
  readonly defaultDuration: number;
  readonly defaultColor: string;
  readonly maxConcurrent: number;
}

// ════════════════════════════════════════════════════════════════
// § ID GENERATION
// ════════════════════════════════════════════════════════════════

let _flashCounter = 0;

function nextFlashId(): string {
  return `flash_${_flashCounter++}`;
}

// ════════════════════════════════════════════════════════════════
// § STATE FACTORY
// ════════════════════════════════════════════════════════════════

/**
 * Creates a new HitFlashState with sensible defaults.
 */
export function createHitFlashState(
  defaultDuration: number = 150,
  defaultColor: string = "#FFFFFF",
  maxConcurrent: number = 10,
): HitFlashState {
  return {
    effects: [],
    defaultDuration,
    defaultColor,
    maxConcurrent,
  };
}

// ════════════════════════════════════════════════════════════════
// § TRIGGER
// ════════════════════════════════════════════════════════════════

/**
 * Adds a new flash effect for a target. If maxConcurrent reached,
 * removes the oldest effect to make room.
 */
export function triggerFlash(
  state: HitFlashState,
  targetId: string,
  color?: string,
  duration?: number,
): HitFlashState {
  const effect: HitFlashEffect = {
    id: nextFlashId(),
    targetId,
    color: color ?? state.defaultColor,
    intensity: 1,
    startTime: 0,
    duration: duration ?? state.defaultDuration,
    elapsed: 0,
    active: true,
  };

  let effects = [...state.effects, effect];

  // Enforce maxConcurrent — remove oldest first
  while (effects.length > state.maxConcurrent) {
    effects = effects.slice(1);
  }

  return { ...state, effects };
}

// ════════════════════════════════════════════════════════════════
// § UPDATE
// ════════════════════════════════════════════════════════════════

/**
 * Advances elapsed time on all active effects and deactivates
 * those that have exceeded their duration.
 */
export function updateFlashes(
  state: HitFlashState,
  deltaMs: number,
): HitFlashState {
  const effects = state.effects.map((e) => {
    if (!e.active) return e;
    const elapsed = e.elapsed + deltaMs;
    const active = elapsed < e.duration;
    return { ...e, elapsed, active };
  });
  return { ...state, effects };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Returns only active flash effects.
 */
export function getActiveFlashes(state: HitFlashState): HitFlashEffect[] {
  return state.effects.filter((e) => e.active);
}

/**
 * Returns the latest active flash for a given target, or null.
 */
export function getFlashForTarget(
  state: HitFlashState,
  targetId: string,
): HitFlashEffect | null {
  const matches = state.effects.filter(
    (e) => e.targetId === targetId && e.active,
  );
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

/**
 * Calculates the current intensity of a flash effect.
 * Linearly fades from effect.intensity to 0 over the duration.
 * Returns 0 if elapsed >= duration.
 */
export function getFlashIntensity(effect: HitFlashEffect): number {
  if (effect.elapsed >= effect.duration) return 0;
  if (effect.duration <= 0) return 0;
  const progress = effect.elapsed / effect.duration;
  return effect.intensity * (1 - progress);
}

/**
 * Returns true if the given target has any active flash.
 */
export function isFlashing(state: HitFlashState, targetId: string): boolean {
  return state.effects.some((e) => e.targetId === targetId && e.active);
}

/**
 * Returns the count of active flash effects.
 */
export function getFlashCount(state: HitFlashState): number {
  return state.effects.filter((e) => e.active).length;
}

// ════════════════════════════════════════════════════════════════
// § CLEANUP
// ════════════════════════════════════════════════════════════════

/**
 * Removes all inactive (expired) effects from the state.
 */
export function removeExpired(state: HitFlashState): HitFlashState {
  return { ...state, effects: state.effects.filter((e) => e.active) };
}

/**
 * Removes all effects, returning a clean state.
 */
export function clearFlashes(state: HitFlashState): HitFlashState {
  return { ...state, effects: [] };
}
