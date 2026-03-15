/**
 * SettingsCalc — pure TypeScript, NO Phaser imports.
 * Game settings management with localStorage persistence.
 */

export interface GameSettings {
  bgmVolume: number; // 0-1
  sfxVolume: number; // 0-1
  masterVolume: number; // 0-1
  screenShake: boolean;
  damageNumbers: boolean;
  autoAim: boolean;
  joystickSide: "left" | "right";
  joystickSize: "small" | "medium" | "large";
  language: "en" | "ko" | "ja" | "zh";
  showFps: boolean;
  showMinimap: boolean;
  particleQuality: "low" | "medium" | "high";
  tutorialEnabled: boolean;
}

const STORAGE_KEY = "neon_survivors_settings";

const JOYSTICK_RADII: Record<GameSettings["joystickSize"], number> = {
  small: 40,
  medium: 60,
  large: 80,
};

const PARTICLE_COUNTS: Record<GameSettings["particleQuality"], number> = {
  low: 15,
  medium: 30,
  high: 60,
};

export function getDefaultSettings(): GameSettings {
  return {
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    masterVolume: 1.0,
    screenShake: true,
    damageNumbers: true,
    autoAim: true,
    joystickSide: "left",
    joystickSize: "medium",
    language: "en",
    showFps: false,
    showMinimap: true,
    particleQuality: "high",
    tutorialEnabled: true,
  };
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return validateSettings(parsed);
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function updateSetting<K extends keyof GameSettings>(
  settings: GameSettings,
  key: K,
  value: GameSettings[K],
): GameSettings {
  return { ...settings, [key]: value };
}

export function getEffectiveBgmVolume(settings: GameSettings): number {
  return clamp01(settings.bgmVolume * settings.masterVolume);
}

export function getEffectiveSfxVolume(settings: GameSettings): number {
  return clamp01(settings.sfxVolume * settings.masterVolume);
}

export function getJoystickRadius(settings: GameSettings): number {
  return JOYSTICK_RADII[settings.joystickSize];
}

export function resetToDefaults(): GameSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may not be available
  }
  return getDefaultSettings();
}

export function validateSettings(partial: Partial<GameSettings>): GameSettings {
  const defaults = getDefaultSettings();
  const merged = { ...defaults, ...partial };

  // Clamp numeric volumes to 0-1
  merged.bgmVolume = clamp01(merged.bgmVolume);
  merged.sfxVolume = clamp01(merged.sfxVolume);
  merged.masterVolume = clamp01(merged.masterVolume);

  // Validate enums — fall back to defaults if invalid
  if (!["left", "right"].includes(merged.joystickSide)) {
    merged.joystickSide = defaults.joystickSide;
  }
  if (!["small", "medium", "large"].includes(merged.joystickSize)) {
    merged.joystickSize = defaults.joystickSize;
  }
  if (!["en", "ko", "ja", "zh"].includes(merged.language)) {
    merged.language = defaults.language;
  }
  if (!["low", "medium", "high"].includes(merged.particleQuality)) {
    merged.particleQuality = defaults.particleQuality;
  }

  // Coerce booleans
  merged.screenShake = Boolean(merged.screenShake);
  merged.damageNumbers = Boolean(merged.damageNumbers);
  merged.autoAim = Boolean(merged.autoAim);
  merged.showFps = Boolean(merged.showFps);
  merged.showMinimap = Boolean(merged.showMinimap);
  merged.tutorialEnabled = Boolean(merged.tutorialEnabled);

  return merged;
}

export function getParticleCount(quality: "low" | "medium" | "high"): number {
  return PARTICLE_COUNTS[quality];
}

// --- Internal helpers ---

function clamp01(value: number): number {
  if (typeof value !== "number" || isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
