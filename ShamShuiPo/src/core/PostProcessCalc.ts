// ── Neon Survivors: Post-Processing Calculations ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface ZoomPulse {
  active: boolean;
  intensity: number;
  timer: number;
  duration: number;
  baseZoom: number;
}

export interface ChromaticState {
  active: boolean;
  offset: number;
  maxOffset: number;
  timer: number;
  duration: number;
}

export interface VignetteState {
  active: boolean;
  intensity: number;
  targetIntensity: number;
  color: number;
}

export interface ColorGradeState {
  brightness: number;
  contrast: number;
  saturation: number;
  tint: number;
}

export interface SlowMotionState {
  active: boolean;
  timeScale: number;
  targetScale: number;
  duration: number;
  timer: number;
}

export interface PostProcessState {
  zoomPulse: ZoomPulse;
  chromaticAberration: ChromaticState;
  vignette: VignetteState;
  colorGrading: ColorGradeState;
  slowMotion: SlowMotionState;
}

// ════════════════════════════════════════════════════════════════
// § CONSTANTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_BASE_ZOOM = 1.0;
const DEFAULT_VIGNETTE_COLOR = 0xff0000;
const VIGNETTE_LERP_SPEED = 0.08;
const LOW_HP_THRESHOLD = 0.3;
const LOW_HP_MAX_VIGNETTE = 0.6;

// Kill streak thresholds
const STREAK_TIER_1 = 10;
const STREAK_TIER_2 = 25;
const STREAK_TIER_3 = 50;
const STREAK_TIER_4 = 100;

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

/**
 * Create a default post-process state with all effects off.
 */
export function createPostProcessState(): PostProcessState {
  return {
    zoomPulse: {
      active: false,
      intensity: 0,
      timer: 0,
      duration: 0,
      baseZoom: DEFAULT_BASE_ZOOM,
    },
    chromaticAberration: {
      active: false,
      offset: 0,
      maxOffset: 0,
      timer: 0,
      duration: 0,
    },
    vignette: {
      active: false,
      intensity: 0,
      targetIntensity: 0,
      color: DEFAULT_VIGNETTE_COLOR,
    },
    colorGrading: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      tint: 0xffffff,
    },
    slowMotion: {
      active: false,
      timeScale: 1.0,
      targetScale: 1.0,
      duration: 0,
      timer: 0,
    },
  };
}

// ════════════════════════════════════════════════════════════════
// § TRIGGERS
// ════════════════════════════════════════════════════════════════

/**
 * Trigger a zoom pulse effect (e.g., 1.05 intensity for 200ms on boss hit).
 * Intensity is the peak zoom multiplier (1.0 = no zoom, 1.1 = 10% zoom in).
 */
export function triggerZoomPulse(
  state: PostProcessState,
  intensity: number,
  duration: number,
): PostProcessState {
  return {
    ...state,
    zoomPulse: {
      ...state.zoomPulse,
      active: true,
      intensity: Math.max(1.0, intensity),
      timer: duration,
      duration,
    },
  };
}

/**
 * Trigger chromatic aberration (RGB split) effect.
 * Offset is in pixels for the RGB channel separation.
 */
export function triggerChromaticAberration(
  state: PostProcessState,
  offset: number,
  duration: number,
): PostProcessState {
  return {
    ...state,
    chromaticAberration: {
      ...state.chromaticAberration,
      active: true,
      offset,
      maxOffset: offset,
      timer: duration,
      duration,
    },
  };
}

/**
 * Set vignette darkness. intensity 0 = none, 1 = full black edge.
 * Default color is red (damage indicator).
 */
export function setVignette(
  state: PostProcessState,
  intensity: number,
  color: number = DEFAULT_VIGNETTE_COLOR,
): PostProcessState {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  return {
    ...state,
    vignette: {
      ...state.vignette,
      active: clampedIntensity > 0,
      targetIntensity: clampedIntensity,
      color,
    },
  };
}

/**
 * Trigger slow motion effect (e.g., 0.3 timeScale for 500ms on kill streak).
 */
export function triggerSlowMotion(
  state: PostProcessState,
  timeScale: number,
  duration: number,
): PostProcessState {
  const clampedScale = Math.max(0.01, Math.min(1.0, timeScale));
  return {
    ...state,
    slowMotion: {
      ...state.slowMotion,
      active: true,
      timeScale: clampedScale,
      targetScale: clampedScale,
      duration,
      timer: duration,
    },
  };
}

/**
 * Set color grading parameters.
 * brightness/contrast/saturation default to 1.0 (neutral).
 */
export function setColorGrade(
  state: PostProcessState,
  brightness: number,
  contrast: number,
  saturation: number,
): PostProcessState {
  return {
    ...state,
    colorGrading: {
      ...state.colorGrading,
      brightness: Math.max(0, brightness),
      contrast: Math.max(0, contrast),
      saturation: Math.max(0, saturation),
    },
  };
}

// ════════════════════════════════════════════════════════════════
// § TICK
// ════════════════════════════════════════════════════════════════

/**
 * Advance all effect timers by dt (ms). Returns a new state with decayed effects.
 */
export function tick(state: PostProcessState, dt: number): PostProcessState {
  return {
    ...state,
    zoomPulse: tickZoomPulse(state.zoomPulse, dt),
    chromaticAberration: tickChromatic(state.chromaticAberration, dt),
    vignette: tickVignette(state.vignette),
    slowMotion: tickSlowMotion(state.slowMotion, dt),
  };
}

function tickZoomPulse(z: ZoomPulse, dt: number): ZoomPulse {
  if (!z.active) return z;
  const newTimer = Math.max(0, z.timer - dt);
  return {
    ...z,
    timer: newTimer,
    active: newTimer > 0,
  };
}

function tickChromatic(c: ChromaticState, dt: number): ChromaticState {
  if (!c.active) return c;
  const newTimer = Math.max(0, c.timer - dt);
  return {
    ...c,
    timer: newTimer,
    active: newTimer > 0,
  };
}

function tickVignette(v: VignetteState): VignetteState {
  const diff = v.targetIntensity - v.intensity;
  if (Math.abs(diff) < 0.001) {
    return {
      ...v,
      intensity: v.targetIntensity,
      active: v.targetIntensity > 0,
    };
  }
  const newIntensity = v.intensity + diff * VIGNETTE_LERP_SPEED;
  return {
    ...v,
    intensity: newIntensity,
    active: true,
  };
}

function tickSlowMotion(s: SlowMotionState, dt: number): SlowMotionState {
  if (!s.active) return s;
  const newTimer = Math.max(0, s.timer - dt);
  if (newTimer <= 0) {
    return {
      ...s,
      active: false,
      timer: 0,
      timeScale: 1.0,
    };
  }
  return {
    ...s,
    timer: newTimer,
  };
}

// ════════════════════════════════════════════════════════════════
// § GETTERS
// ════════════════════════════════════════════════════════════════

/**
 * Current zoom level. Applies easeOut decay based on remaining timer.
 */
export function getZoomLevel(state: PostProcessState): number {
  const z = state.zoomPulse;
  if (!z.active || z.duration <= 0) return z.baseZoom;
  const progress = 1 - z.timer / z.duration; // 0→1
  const easeOut = 1 - (1 - progress) * (1 - progress); // quadratic easeOut
  // Zoom goes from intensity back to baseZoom
  const zoomDelta = z.intensity - z.baseZoom;
  return z.baseZoom + zoomDelta * (1 - easeOut);
}

/**
 * Current chromatic aberration offset. Decays linearly over duration.
 */
export function getChromaticOffset(state: PostProcessState): number {
  const c = state.chromaticAberration;
  if (!c.active || c.duration <= 0) return 0;
  return c.maxOffset * (c.timer / c.duration);
}

/**
 * Current vignette intensity (smoothly transitioning to target).
 */
export function getVignetteIntensity(state: PostProcessState): number {
  return state.vignette.intensity;
}

/**
 * Current time scale. Returns the slow-motion timeScale while active, 1.0 otherwise.
 * Lerps back toward 1.0 in the final 20% of the duration.
 */
export function getTimeScale(state: PostProcessState): number {
  const s = state.slowMotion;
  if (!s.active || s.duration <= 0) return 1.0;
  const remaining = s.timer / s.duration;
  const LERP_BACK_THRESHOLD = 0.2;
  if (remaining <= LERP_BACK_THRESHOLD) {
    // Lerp from targetScale back to 1.0 in the final 20%
    const t = remaining / LERP_BACK_THRESHOLD; // 1→0
    return s.targetScale + (1.0 - s.targetScale) * (1 - t);
  }
  return s.targetScale;
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

/**
 * Returns true if any post-processing effect is currently active.
 */
export function isAnyEffectActive(state: PostProcessState): boolean {
  return (
    state.zoomPulse.active ||
    state.chromaticAberration.active ||
    state.vignette.active ||
    state.slowMotion.active
  );
}

/**
 * Reset all effects to defaults.
 */
export function clearAllEffects(state: PostProcessState): PostProcessState {
  return {
    ...state,
    zoomPulse: {
      ...state.zoomPulse,
      active: false,
      intensity: 0,
      timer: 0,
      duration: 0,
    },
    chromaticAberration: {
      ...state.chromaticAberration,
      active: false,
      offset: 0,
      maxOffset: 0,
      timer: 0,
      duration: 0,
    },
    vignette: {
      ...state.vignette,
      active: false,
      intensity: 0,
      targetIntensity: 0,
      color: DEFAULT_VIGNETTE_COLOR,
    },
    colorGrading: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      tint: 0xffffff,
    },
    slowMotion: {
      ...state.slowMotion,
      active: false,
      timeScale: 1.0,
      targetScale: 1.0,
      duration: 0,
      timer: 0,
    },
  };
}

// ════════════════════════════════════════════════════════════════
// § GAMEPLAY HELPERS
// ════════════════════════════════════════════════════════════════

export interface DamageFlashResult {
  vignetteIntensity: number;
  vignetteColor: number;
  shouldPulse: boolean;
}

/**
 * Auto vignette based on current HP percentage.
 * Below LOW_HP_THRESHOLD (30%), red vignette scales up.
 */
export function getDamageFlashState(
  _state: PostProcessState,
  hpPercent: number,
): DamageFlashResult {
  const clamped = Math.max(0, Math.min(1, hpPercent));
  if (clamped >= LOW_HP_THRESHOLD) {
    return {
      vignetteIntensity: 0,
      vignetteColor: DEFAULT_VIGNETTE_COLOR,
      shouldPulse: false,
    };
  }
  // Scale: at threshold → 0, at 0 HP → LOW_HP_MAX_VIGNETTE
  const ratio = clamped / LOW_HP_THRESHOLD;
  const intensity = LOW_HP_MAX_VIGNETTE * (1 - ratio);
  return {
    vignetteIntensity: intensity,
    vignetteColor: DEFAULT_VIGNETTE_COLOR,
    shouldPulse: clamped < LOW_HP_THRESHOLD * 0.5, // pulse below 15% HP
  };
}

export interface KillStreakEffect {
  zoomIntensity: number;
  zoomDuration: number;
  chromaticOffset: number;
  chromaticDuration: number;
  slowMotionScale: number;
  slowMotionDuration: number;
  tier: number;
}

/**
 * Returns post-process parameters scaled by kill streak count.
 * Higher streaks produce more dramatic effects.
 */
export function getKillStreakEffect(killCount: number): KillStreakEffect {
  if (killCount < STREAK_TIER_1) {
    return {
      zoomIntensity: 1.0,
      zoomDuration: 0,
      chromaticOffset: 0,
      chromaticDuration: 0,
      slowMotionScale: 1.0,
      slowMotionDuration: 0,
      tier: 0,
    };
  }

  if (killCount < STREAK_TIER_2) {
    return {
      zoomIntensity: 1.02,
      zoomDuration: 150,
      chromaticOffset: 1,
      chromaticDuration: 100,
      slowMotionScale: 1.0,
      slowMotionDuration: 0,
      tier: 1,
    };
  }

  if (killCount < STREAK_TIER_3) {
    return {
      zoomIntensity: 1.04,
      zoomDuration: 200,
      chromaticOffset: 2,
      chromaticDuration: 150,
      slowMotionScale: 0.8,
      slowMotionDuration: 200,
      tier: 2,
    };
  }

  if (killCount < STREAK_TIER_4) {
    return {
      zoomIntensity: 1.06,
      zoomDuration: 300,
      chromaticOffset: 3,
      chromaticDuration: 250,
      slowMotionScale: 0.5,
      slowMotionDuration: 400,
      tier: 3,
    };
  }

  // Tier 4: 100+ kills
  return {
    zoomIntensity: 1.08,
    zoomDuration: 400,
    chromaticOffset: 5,
    chromaticDuration: 350,
    slowMotionScale: 0.3,
    slowMotionDuration: 500,
    tier: 4,
  };
}
