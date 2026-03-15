import { describe, it, expect } from "vitest";
import {
  createShakeState,
  triggerShake,
  tickShake,
  getShakeConfig,
  isShaking,
  getMaxIntensity,
  type ShakeEvent,
} from "../../src/core/CameraShakeCalc";

describe("CameraShakeCalc", () => {
  // --- createShakeState ---
  describe("createShakeState", () => {
    it("returns inactive state", () => {
      const state = createShakeState();
      expect(state.active).toBe(false);
    });

    it("returns zero offsets", () => {
      const state = createShakeState();
      expect(state.offsetX).toBe(0);
      expect(state.offsetY).toBe(0);
    });

    it("returns zero timer", () => {
      const state = createShakeState();
      expect(state.timer).toBe(0);
    });
  });

  // --- triggerShake ---
  describe("triggerShake", () => {
    it("activates the shake state", () => {
      const state = triggerShake(createShakeState(), "hit");
      expect(state.active).toBe(true);
    });

    it("sets timer to config duration", () => {
      const state = triggerShake(createShakeState(), "hit");
      const config = getShakeConfig("hit");
      expect(state.timer).toBe(config.duration);
    });

    it("sets correct config for the event", () => {
      const state = triggerShake(createShakeState(), "explosion");
      const config = getShakeConfig("explosion");
      expect(state.config.intensity).toBe(config.intensity);
      expect(state.config.duration).toBe(config.duration);
      expect(state.config.frequency).toBe(config.frequency);
      expect(state.config.decay).toBe(config.decay);
    });

    it("stronger event overrides weaker one mid-shake", () => {
      let state = triggerShake(createShakeState(), "hit"); // intensity 2
      state = triggerShake(state, "explosion"); // intensity 8
      expect(state.config.intensity).toBe(8);
    });

    it("weaker event does NOT override stronger one mid-shake", () => {
      let state = triggerShake(createShakeState(), "explosion"); // intensity 8
      state = triggerShake(state, "hit"); // intensity 2
      expect(state.config.intensity).toBe(8);
    });

    it("equal intensity does NOT override", () => {
      let state = triggerShake(createShakeState(), "hit");
      const originalDuration = state.timer;
      state = tickShake(state, 0.05); // consume some time
      state = triggerShake(state, "hit"); // same intensity
      // Should keep original (partially elapsed) state
      expect(state.timer).toBeLessThan(originalDuration);
    });
  });

  // --- tickShake ---
  describe("tickShake", () => {
    it("reduces timer", () => {
      let state = triggerShake(createShakeState(), "hit");
      const before = state.timer;
      state = tickShake(state, 0.05);
      expect(state.timer).toBeLessThan(before);
    });

    it("produces non-zero offsets while active", () => {
      let state = triggerShake(createShakeState(), "explosion");
      state = tickShake(state, 0.01);
      // At least one offset should be non-zero
      expect(Math.abs(state.offsetX) + Math.abs(state.offsetY)).toBeGreaterThan(
        0,
      );
    });

    it("deactivates when timer expires", () => {
      let state = triggerShake(createShakeState(), "hit");
      state = tickShake(state, 1.0); // well past duration
      expect(state.active).toBe(false);
      expect(state.offsetX).toBe(0);
      expect(state.offsetY).toBe(0);
    });

    it("zero dt does not change state", () => {
      let state = triggerShake(createShakeState(), "hit");
      const before = { ...state };
      state = tickShake(state, 0);
      expect(state.timer).toBe(before.timer);
      expect(state.offsetX).toBe(before.offsetX);
      expect(state.offsetY).toBe(before.offsetY);
    });

    it("does nothing for inactive state", () => {
      const state = createShakeState();
      const result = tickShake(state, 0.1);
      expect(result).toBe(state); // same reference
    });

    it("decay produces diminishing offsets over time", () => {
      let state = triggerShake(createShakeState(), "death"); // long duration
      state = tickShake(state, 0.01);
      const earlyMagnitude = Math.sqrt(state.offsetX ** 2 + state.offsetY ** 2);

      // Reset and advance further
      state = triggerShake(createShakeState(), "death");
      state = tickShake(state, 0.4); // near end of 0.5s duration
      const lateMagnitude = Math.sqrt(state.offsetX ** 2 + state.offsetY ** 2);

      expect(earlyMagnitude).toBeGreaterThan(lateMagnitude);
    });

    it("Y offset magnitude is approximately 70% of X offset magnitude", () => {
      // Use a time where sin and cos both give ~1 to compare raw multipliers
      // We'll sample many frames and check the ratio of max values
      let state = triggerShake(createShakeState(), "explosion");
      let maxAbsX = 0;
      let maxAbsY = 0;

      for (let i = 0; i < 100; i++) {
        state = triggerShake(createShakeState(), "explosion");
        state = tickShake(state, (i + 1) * 0.004);
        if (state.active) {
          maxAbsX = Math.max(maxAbsX, Math.abs(state.offsetX));
          maxAbsY = Math.max(maxAbsY, Math.abs(state.offsetY));
        }
      }

      // Y/X ratio should be around 0.7
      const ratio = maxAbsY / maxAbsX;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(0.9);
    });

    it("multiple ticks eventually settle to zero", () => {
      let state = triggerShake(createShakeState(), "crit");
      for (let i = 0; i < 100; i++) {
        state = tickShake(state, 0.01);
      }
      expect(state.active).toBe(false);
      expect(state.offsetX).toBe(0);
      expect(state.offsetY).toBe(0);
    });

    it("timer does not go negative on deactivation", () => {
      let state = triggerShake(createShakeState(), "hit");
      state = tickShake(state, 10); // way past duration
      expect(state.timer).toBe(0);
    });
  });

  // --- getShakeConfig ---
  describe("getShakeConfig", () => {
    const events: ShakeEvent[] = [
      "hit",
      "crit",
      "boss_hit",
      "explosion",
      "level_up",
      "death",
    ];

    it.each(events)("returns valid config for '%s'", (event) => {
      const config = getShakeConfig(event);
      expect(config.intensity).toBeGreaterThan(0);
      expect(config.duration).toBeGreaterThan(0);
      expect(config.frequency).toBeGreaterThan(0);
      expect(config.decay).toBeGreaterThan(0);
    });

    it("returns a copy (not the internal object)", () => {
      const a = getShakeConfig("hit");
      const b = getShakeConfig("hit");
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });

    it("hit has intensity 2", () => {
      expect(getShakeConfig("hit").intensity).toBe(2);
    });

    it("death has highest intensity (10)", () => {
      expect(getShakeConfig("death").intensity).toBe(10);
    });

    it("death has longest duration (0.5s)", () => {
      expect(getShakeConfig("death").duration).toBe(0.5);
    });
  });

  // --- isShaking ---
  describe("isShaking", () => {
    it("returns false for new state", () => {
      expect(isShaking(createShakeState())).toBe(false);
    });

    it("returns true after trigger", () => {
      const state = triggerShake(createShakeState(), "hit");
      expect(isShaking(state)).toBe(true);
    });

    it("returns false after shake completes", () => {
      let state = triggerShake(createShakeState(), "hit");
      state = tickShake(state, 1.0);
      expect(isShaking(state)).toBe(false);
    });
  });

  // --- getMaxIntensity ---
  describe("getMaxIntensity", () => {
    it("returns 2 for hit", () => {
      expect(getMaxIntensity("hit")).toBe(2);
    });

    it("returns 4 for crit", () => {
      expect(getMaxIntensity("crit")).toBe(4);
    });

    it("returns 6 for boss_hit", () => {
      expect(getMaxIntensity("boss_hit")).toBe(6);
    });

    it("returns 8 for explosion", () => {
      expect(getMaxIntensity("explosion")).toBe(8);
    });

    it("returns 3 for level_up", () => {
      expect(getMaxIntensity("level_up")).toBe(3);
    });

    it("returns 10 for death", () => {
      expect(getMaxIntensity("death")).toBe(10);
    });
  });

  // --- Integration-style ---
  describe("full shake lifecycle", () => {
    it("trigger → tick → tick → deactivate", () => {
      let state = createShakeState();
      expect(isShaking(state)).toBe(false);

      state = triggerShake(state, "crit");
      expect(isShaking(state)).toBe(true);

      state = tickShake(state, 0.05);
      expect(isShaking(state)).toBe(true);
      expect(state.offsetX).not.toBe(0);

      state = tickShake(state, 0.05);
      expect(isShaking(state)).toBe(true);

      // Exhaust remaining
      state = tickShake(state, 0.5);
      expect(isShaking(state)).toBe(false);
      expect(state.offsetX).toBe(0);
      expect(state.offsetY).toBe(0);
    });
  });
});
