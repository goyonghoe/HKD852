import { describe, it, expect, vi } from "vitest";
import {
  createAudioState,
  startBgmFade,
  tickAudioState,
  getBgmForPhase,
  getSfxVolume,
  updateCombatIntensity,
  shouldChangeBgm,
  calculatePanPosition,
  getPitchVariation,
} from "../../src/core/AudioCalc";

describe("AudioCalc", () => {
  // --- createAudioState ---
  describe("createAudioState", () => {
    it("returns state with given volumes", () => {
      const s = createAudioState(0.8, 0.6);
      expect(s.bgmVolume).toBe(0.8);
      expect(s.sfxVolume).toBe(0.6);
    });

    it("clamps volumes to 0-1 range", () => {
      const s = createAudioState(1.5, -0.3);
      expect(s.bgmVolume).toBe(1);
      expect(s.sfxVolume).toBe(0);
    });

    it("initializes with no fade active", () => {
      const s = createAudioState(0.5, 0.5);
      expect(s.isFading).toBe(false);
      expect(s.fadeTimer).toBe(0);
    });

    it("initializes combatIntensity at 0", () => {
      const s = createAudioState(1, 1);
      expect(s.combatIntensity).toBe(0);
    });

    it("initializes bgmKey as null", () => {
      const s = createAudioState(1, 1);
      expect(s.bgmKey).toBeNull();
    });
  });

  // --- startBgmFade ---
  describe("startBgmFade", () => {
    it("sets isFading to true", () => {
      const s = startBgmFade(createAudioState(1, 1), 0, 2);
      expect(s.isFading).toBe(true);
    });

    it("records fadeFrom as current bgmVolume", () => {
      const s = startBgmFade(createAudioState(0.7, 1), 0.2, 1);
      expect(s.fadeFrom).toBe(0.7);
    });

    it("records fadeTo clamped to 0-1", () => {
      const s = startBgmFade(createAudioState(0.5, 1), 1.5, 1);
      expect(s.fadeTo).toBe(1);
    });

    it("sets fadeTimer to duration", () => {
      const s = startBgmFade(createAudioState(1, 1), 0, 3);
      expect(s.fadeTimer).toBe(3);
    });

    it("instant fade when duration is 0", () => {
      const s = startBgmFade(createAudioState(1, 1), 0.3, 0);
      expect(s.isFading).toBe(false);
      expect(s.bgmVolume).toBeCloseTo(0.3);
    });
  });

  // --- tickAudioState ---
  describe("tickAudioState", () => {
    it("does nothing when not fading", () => {
      const s = createAudioState(0.5, 0.5);
      const ticked = tickAudioState(s, 0.1);
      expect(ticked.bgmVolume).toBe(0.5);
    });

    it("completes fade when dt exceeds remaining timer", () => {
      const s = startBgmFade(createAudioState(1, 1), 0, 1);
      const ticked = tickAudioState(s, 2);
      expect(ticked.bgmVolume).toBe(0);
      expect(ticked.isFading).toBe(false);
      expect(ticked.fadeTimer).toBe(0);
    });

    it("interpolates volume during fade", () => {
      const s = startBgmFade(createAudioState(1, 1), 0, 1);
      const ticked = tickAudioState(s, 0.5);
      expect(ticked.bgmVolume).toBeGreaterThan(0);
      expect(ticked.bgmVolume).toBeLessThan(1);
    });

    it("decreases fadeTimer", () => {
      const s = startBgmFade(createAudioState(1, 1), 0, 2);
      const ticked = tickAudioState(s, 0.5);
      expect(ticked.fadeTimer).toBeCloseTo(1.5);
    });
  });

  // --- getBgmForPhase ---
  describe("getBgmForPhase", () => {
    it("returns correct key for menu", () => {
      expect(getBgmForPhase("menu")).toBe("bgm_menu");
    });

    it("returns correct key for boss", () => {
      expect(getBgmForPhase("boss")).toBe("bgm_boss");
    });

    it("returns correct key for game_over", () => {
      expect(getBgmForPhase("game_over")).toBe("bgm_game_over");
    });

    it("returns unique keys for all phases", () => {
      const phases = [
        "menu",
        "early",
        "mid",
        "boss",
        "finale",
        "victory",
        "game_over",
      ] as const;
      const keys = phases.map(getBgmForPhase);
      expect(new Set(keys).size).toBe(phases.length);
    });
  });

  // --- getSfxVolume ---
  describe("getSfxVolume", () => {
    it("weapon sfx at full master returns 1.0", () => {
      const s = createAudioState(1, 1);
      expect(getSfxVolume(s, "weapon")).toBe(1);
    });

    it("pickup sfx is lower than weapon sfx", () => {
      const s = createAudioState(1, 1);
      expect(getSfxVolume(s, "pickup")).toBeLessThan(getSfxVolume(s, "weapon"));
    });

    it("scales with master sfxVolume", () => {
      const s = createAudioState(1, 0.5);
      expect(getSfxVolume(s, "weapon")).toBe(0.5);
    });
  });

  // --- updateCombatIntensity ---
  describe("updateCombatIntensity", () => {
    it("zero enemies yields zero intensity", () => {
      const s = updateCombatIntensity(createAudioState(1, 1), 0, false);
      expect(s.combatIntensity).toBe(0);
    });

    it("caps enemy contribution at 0.7", () => {
      const s = updateCombatIntensity(createAudioState(1, 1), 100, false);
      expect(s.combatIntensity).toBeCloseTo(0.7);
    });

    it("boss adds 0.3 intensity", () => {
      const s = updateCombatIntensity(createAudioState(1, 1), 0, true);
      expect(s.combatIntensity).toBeCloseTo(0.3);
    });

    it("max intensity is 1.0 with boss and many enemies", () => {
      const s = updateCombatIntensity(createAudioState(1, 1), 50, true);
      expect(s.combatIntensity).toBe(1);
    });
  });

  // --- shouldChangeBgm ---
  describe("shouldChangeBgm", () => {
    it("returns true when bgmKey is null", () => {
      const s = createAudioState(1, 1);
      expect(shouldChangeBgm(s, "bgm_menu")).toBe(true);
    });

    it("returns false when key matches current", () => {
      const s = { ...createAudioState(1, 1), bgmKey: "bgm_boss" };
      expect(shouldChangeBgm(s, "bgm_boss")).toBe(false);
    });

    it("returns true when key differs", () => {
      const s = { ...createAudioState(1, 1), bgmKey: "bgm_menu" };
      expect(shouldChangeBgm(s, "bgm_boss")).toBe(true);
    });
  });

  // --- calculatePanPosition ---
  describe("calculatePanPosition", () => {
    it("center of screen returns 0", () => {
      expect(calculatePanPosition(360, 720)).toBeCloseTo(0);
    });

    it("left edge returns -1", () => {
      expect(calculatePanPosition(0, 720)).toBe(-1);
    });

    it("right edge returns 1", () => {
      expect(calculatePanPosition(720, 720)).toBe(1);
    });

    it("clamps beyond screen bounds", () => {
      expect(calculatePanPosition(-100, 720)).toBe(-1);
      expect(calculatePanPosition(900, 720)).toBe(1);
    });

    it("returns 0 when screenWidth is 0", () => {
      expect(calculatePanPosition(100, 0)).toBe(0);
    });
  });

  // --- getPitchVariation ---
  describe("getPitchVariation", () => {
    it("returns base pitch when variation is 0", () => {
      expect(getPitchVariation(1.0, 0)).toBe(1.0);
    });

    it("returns value within variation range", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      // random=0.5 → offset = (0.5*2-1)*0.2 = 0
      expect(getPitchVariation(1.0, 0.2)).toBeCloseTo(1.0);
      vi.restoreAllMocks();
    });

    it("returns max when random is 1", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.9999);
      const result = getPitchVariation(1.0, 0.2);
      expect(result).toBeGreaterThan(1.0);
      expect(result).toBeLessThanOrEqual(1.2);
      vi.restoreAllMocks();
    });
  });
});
