import { describe, it, expect, beforeEach } from "vitest";
import {
  getDefaultSettings,
  loadSettings,
  saveSettings,
  updateSetting,
  getEffectiveBgmVolume,
  getEffectiveSfxVolume,
  getJoystickRadius,
  resetToDefaults,
  validateSettings,
  getParticleCount,
  type GameSettings,
} from "../../src/core/SettingsCalc";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  length: 0,
  key: () => null,
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("SettingsCalc", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // --- getDefaultSettings ---
  describe("getDefaultSettings", () => {
    it("returns sensible default volumes", () => {
      const d = getDefaultSettings();
      expect(d.bgmVolume).toBe(0.7);
      expect(d.sfxVolume).toBe(0.8);
      expect(d.masterVolume).toBe(1.0);
    });

    it("enables screen shake and damage numbers by default", () => {
      const d = getDefaultSettings();
      expect(d.screenShake).toBe(true);
      expect(d.damageNumbers).toBe(true);
    });

    it("defaults to left-handed medium joystick", () => {
      const d = getDefaultSettings();
      expect(d.joystickSide).toBe("left");
      expect(d.joystickSize).toBe("medium");
    });

    it("defaults language to en", () => {
      expect(getDefaultSettings().language).toBe("en");
    });

    it("enables tutorial by default", () => {
      expect(getDefaultSettings().tutorialEnabled).toBe(true);
    });
  });

  // --- loadSettings / saveSettings ---
  describe("loadSettings / saveSettings", () => {
    it("returns defaults when localStorage is empty", () => {
      const s = loadSettings();
      expect(s).toEqual(getDefaultSettings());
    });

    it("round-trips through save and load", () => {
      const custom = {
        ...getDefaultSettings(),
        bgmVolume: 0.3,
        language: "ko" as const,
      };
      saveSettings(custom);
      const loaded = loadSettings();
      expect(loaded.bgmVolume).toBe(0.3);
      expect(loaded.language).toBe("ko");
    });

    it("returns defaults on corrupted JSON", () => {
      store["neon_survivors_settings"] = "NOT_JSON{{{";
      const s = loadSettings();
      expect(s).toEqual(getDefaultSettings());
    });

    it("merges missing keys with defaults", () => {
      store["neon_survivors_settings"] = JSON.stringify({ bgmVolume: 0.5 });
      const s = loadSettings();
      expect(s.bgmVolume).toBe(0.5);
      expect(s.sfxVolume).toBe(0.8); // default
      expect(s.tutorialEnabled).toBe(true); // default
    });
  });

  // --- updateSetting ---
  describe("updateSetting", () => {
    it("returns a new object (immutable)", () => {
      const original = getDefaultSettings();
      const updated = updateSetting(original, "bgmVolume", 0.5);
      expect(updated).not.toBe(original);
      expect(updated.bgmVolume).toBe(0.5);
    });

    it("does not modify the original", () => {
      const original = getDefaultSettings();
      updateSetting(original, "autoAim", false);
      expect(original.autoAim).toBe(true);
    });

    it("handles enum values", () => {
      const s = updateSetting(getDefaultSettings(), "language", "ja");
      expect(s.language).toBe("ja");
    });
  });

  // --- effective volumes ---
  describe("getEffectiveBgmVolume", () => {
    it("multiplies bgm by master", () => {
      const s = { ...getDefaultSettings(), bgmVolume: 0.5, masterVolume: 0.8 };
      expect(getEffectiveBgmVolume(s)).toBeCloseTo(0.4);
    });

    it("returns 0 when master is 0", () => {
      const s = { ...getDefaultSettings(), bgmVolume: 1.0, masterVolume: 0 };
      expect(getEffectiveBgmVolume(s)).toBe(0);
    });
  });

  describe("getEffectiveSfxVolume", () => {
    it("multiplies sfx by master", () => {
      const s = { ...getDefaultSettings(), sfxVolume: 0.6, masterVolume: 0.5 };
      expect(getEffectiveSfxVolume(s)).toBeCloseTo(0.3);
    });

    it("clamps to 1 max", () => {
      const s = { ...getDefaultSettings(), sfxVolume: 1.0, masterVolume: 1.0 };
      expect(getEffectiveSfxVolume(s)).toBeLessThanOrEqual(1);
    });
  });

  // --- joystick ---
  describe("getJoystickRadius", () => {
    it("returns 40 for small", () => {
      const s = updateSetting(getDefaultSettings(), "joystickSize", "small");
      expect(getJoystickRadius(s)).toBe(40);
    });

    it("returns 60 for medium", () => {
      expect(getJoystickRadius(getDefaultSettings())).toBe(60);
    });

    it("returns 80 for large", () => {
      const s = updateSetting(getDefaultSettings(), "joystickSize", "large");
      expect(getJoystickRadius(s)).toBe(80);
    });
  });

  // --- resetToDefaults ---
  describe("resetToDefaults", () => {
    it("returns default settings", () => {
      expect(resetToDefaults()).toEqual(getDefaultSettings());
    });

    it("clears localStorage", () => {
      saveSettings({ ...getDefaultSettings(), bgmVolume: 0.1 });
      resetToDefaults();
      expect(store["neon_survivors_settings"]).toBeUndefined();
    });
  });

  // --- validateSettings ---
  describe("validateSettings", () => {
    it("clamps volume above 1 to 1", () => {
      const s = validateSettings({ bgmVolume: 5.0 });
      expect(s.bgmVolume).toBe(1);
    });

    it("clamps negative volume to 0", () => {
      const s = validateSettings({ sfxVolume: -0.5 });
      expect(s.sfxVolume).toBe(0);
    });

    it("handles NaN volume as 0", () => {
      const s = validateSettings({ masterVolume: NaN });
      expect(s.masterVolume).toBe(0);
    });

    it("falls back invalid enum to default", () => {
      const s = validateSettings({ joystickSide: "center" as never });
      expect(s.joystickSide).toBe("left");
    });

    it("falls back invalid language to en", () => {
      const s = validateSettings({ language: "fr" as never });
      expect(s.language).toBe("en");
    });

    it("fills missing keys with defaults", () => {
      const s = validateSettings({});
      expect(s).toEqual(getDefaultSettings());
    });

    it("coerces truthy value to boolean", () => {
      const s = validateSettings({ screenShake: 1 as unknown as boolean });
      expect(s.screenShake).toBe(true);
    });
  });

  // --- getParticleCount ---
  describe("getParticleCount", () => {
    it("returns 15 for low", () => {
      expect(getParticleCount("low")).toBe(15);
    });

    it("returns 30 for medium", () => {
      expect(getParticleCount("medium")).toBe(30);
    });

    it("returns 60 for high", () => {
      expect(getParticleCount("high")).toBe(60);
    });
  });
});
