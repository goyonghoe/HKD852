/**
 * Pure settings calculation functions extracted from SaveManager.
 * No Phaser imports — testable without game engine. (M-001)
 * No magic numbers — all thresholds are explicit parameters or constants. (M-002)
 */

/** Supported locale codes for the game. */
const VALID_LOCALES = ['en', 'ko'] as const;

export interface Settings {
  bgmVolume: number;
  bgmMuted: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
  vibration: boolean;
}

/**
 * Clamp a volume value to [0, 1].
 * Returns 0 for NaN/non-finite values.
 */
export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/**
 * Merge a partial saved settings object with defaults.
 * Saved values override defaults; missing keys fall back to defaults.
 * Volume values are clamped to [0, 1].
 */
export function mergeSettings(saved: Partial<Settings>, defaults: Settings): Settings {
  return {
    bgmVolume: clampVolume(saved.bgmVolume ?? defaults.bgmVolume),
    bgmMuted: saved.bgmMuted ?? defaults.bgmMuted,
    sfxVolume: clampVolume(saved.sfxVolume ?? defaults.sfxVolume),
    sfxMuted: saved.sfxMuted ?? defaults.sfxMuted,
    vibration: saved.vibration ?? defaults.vibration,
  };
}

/**
 * Add an ID to a discovery list without duplicates.
 * Returns a new array (does not mutate the original).
 */
export function addDiscovery(list: string[], id: string): string[] {
  if (list.includes(id)) return [...list];
  return [...list, id];
}

/**
 * Validate whether a locale string is supported by the game.
 */
export function isValidLocale(locale: string): boolean {
  return (VALID_LOCALES as readonly string[]).includes(locale);
}
