/**
 * AudioCalc — pure TypeScript, NO Phaser imports.
 * Audio state calculations for dynamic mixing.
 */

export interface AudioState {
  bgmVolume: number;
  sfxVolume: number;
  bgmKey: string | null;
  fadeTimer: number; // remaining fade seconds
  fadeFrom: number; // volume fade start
  fadeTo: number; // volume fade target
  isFading: boolean;
  combatIntensity: number; // 0-1, affects BGM layer mixing
}

const BGM_MAP: Record<string, string> = {
  menu: "bgm_menu",
  early: "bgm_early",
  mid: "bgm_mid",
  boss: "bgm_boss",
  finale: "bgm_finale",
  victory: "bgm_victory",
  game_over: "bgm_game_over",
};

const SFX_VOLUME_SCALE: Record<string, number> = {
  weapon: 1.0,
  enemy: 0.8,
  ui: 0.7,
  pickup: 0.6,
};

/** Create a fresh audio state with given volumes */
export function createAudioState(
  bgmVolume: number,
  sfxVolume: number,
): AudioState {
  return {
    bgmVolume: clamp01(bgmVolume),
    sfxVolume: clamp01(sfxVolume),
    bgmKey: null,
    fadeTimer: 0,
    fadeFrom: 0,
    fadeTo: 0,
    isFading: false,
    combatIntensity: 0,
  };
}

/** Begin a volume fade from current bgmVolume toward targetVolume over duration seconds */
export function startBgmFade(
  state: AudioState,
  targetVolume: number,
  duration: number,
): AudioState {
  if (duration <= 0) {
    return {
      ...state,
      bgmVolume: clamp01(targetVolume),
      isFading: false,
      fadeTimer: 0,
    };
  }
  return {
    ...state,
    fadeFrom: state.bgmVolume,
    fadeTo: clamp01(targetVolume),
    fadeTimer: duration,
    isFading: true,
  };
}

/** Advance fade timer by dt seconds, interpolating bgmVolume */
export function tickAudioState(state: AudioState, dt: number): AudioState {
  if (!state.isFading || state.fadeTimer <= 0) {
    return state;
  }

  const remaining = state.fadeTimer - dt;
  if (remaining <= 0) {
    return {
      ...state,
      bgmVolume: state.fadeTo,
      fadeTimer: 0,
      isFading: false,
    };
  }

  // Calculate total duration from fadeFrom→fadeTo
  // progress = 1 - (remaining / original_duration)
  // We don't store original duration, so compute interpolation from remaining ratio
  const totalDuration = state.fadeTimer; // timer at start of this tick
  const progress = dt / totalDuration;
  const newVolume =
    state.bgmVolume + (state.fadeTo - state.bgmVolume) * progress;

  return {
    ...state,
    bgmVolume: clamp01(newVolume),
    fadeTimer: remaining,
  };
}

/** Returns the BGM key for a given game phase */
export function getBgmForPhase(
  phase: "menu" | "early" | "mid" | "boss" | "finale" | "victory" | "game_over",
): string {
  return BGM_MAP[phase];
}

/** Returns scaled SFX volume based on type and master sfxVolume */
export function getSfxVolume(
  state: AudioState,
  sfxType: "weapon" | "enemy" | "ui" | "pickup",
): number {
  const scale = SFX_VOLUME_SCALE[sfxType] ?? 1.0;
  return clamp01(state.sfxVolume * scale);
}

/** Update combat intensity based on enemy count and boss presence */
export function updateCombatIntensity(
  state: AudioState,
  enemyCount: number,
  bossActive: boolean,
): AudioState {
  // Base intensity from enemy count (0-30 enemies maps to 0-0.7)
  const enemyIntensity = Math.min(enemyCount / 30, 0.7);
  // Boss adds 0.3 intensity
  const bossBonus = bossActive ? 0.3 : 0;
  const intensity = clamp01(enemyIntensity + bossBonus);

  return { ...state, combatIntensity: intensity };
}

/** Returns true if the new BGM key differs from the current one */
export function shouldChangeBgm(state: AudioState, newKey: string): boolean {
  return state.bgmKey !== newKey;
}

/** Calculate stereo pan position from entity X and screen width. Returns -1 (left) to 1 (right) */
export function calculatePanPosition(
  entityX: number,
  screenWidth: number,
): number {
  if (screenWidth <= 0) return 0;
  // Map 0..screenWidth to -1..1
  const normalized = (entityX / screenWidth) * 2 - 1;
  return Math.max(-1, Math.min(1, normalized));
}

/** Returns a pitch value with random variation applied */
export function getPitchVariation(
  basePitch: number,
  variation: number,
): number {
  const offset = (Math.random() * 2 - 1) * variation;
  return basePitch + offset;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
