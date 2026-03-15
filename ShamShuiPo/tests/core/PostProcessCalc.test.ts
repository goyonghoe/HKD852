import { describe, it, expect } from "vitest";
import {
  createPostProcessState,
  triggerZoomPulse,
  triggerChromaticAberration,
  setVignette,
  triggerSlowMotion,
  setColorGrade,
  tick,
  getZoomLevel,
  getChromaticOffset,
  getVignetteIntensity,
  getTimeScale,
  isAnyEffectActive,
  clearAllEffects,
  getDamageFlashState,
  getKillStreakEffect,
} from "../../src/core/PostProcessCalc";

describe("PostProcessCalc", () => {
  // ── createPostProcessState ──
  describe("createPostProcessState", () => {
    it("returns all effects inactive", () => {
      const s = createPostProcessState();
      expect(s.zoomPulse.active).toBe(false);
      expect(s.chromaticAberration.active).toBe(false);
      expect(s.vignette.active).toBe(false);
      expect(s.slowMotion.active).toBe(false);
    });

    it("returns base zoom of 1.0", () => {
      const s = createPostProcessState();
      expect(s.zoomPulse.baseZoom).toBe(1.0);
    });

    it("returns neutral color grading", () => {
      const s = createPostProcessState();
      expect(s.colorGrading.brightness).toBe(1.0);
      expect(s.colorGrading.contrast).toBe(1.0);
      expect(s.colorGrading.saturation).toBe(1.0);
      expect(s.colorGrading.tint).toBe(0xffffff);
    });

    it("returns timeScale of 1.0", () => {
      const s = createPostProcessState();
      expect(s.slowMotion.timeScale).toBe(1.0);
    });

    it("returns vignette intensity 0", () => {
      const s = createPostProcessState();
      expect(s.vignette.intensity).toBe(0);
      expect(s.vignette.targetIntensity).toBe(0);
    });
  });

  // ── triggerZoomPulse ──
  describe("triggerZoomPulse", () => {
    it("activates zoom pulse", () => {
      const s = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      expect(s.zoomPulse.active).toBe(true);
    });

    it("sets intensity and duration", () => {
      const s = triggerZoomPulse(createPostProcessState(), 1.1, 300);
      expect(s.zoomPulse.intensity).toBe(1.1);
      expect(s.zoomPulse.duration).toBe(300);
      expect(s.zoomPulse.timer).toBe(300);
    });

    it("clamps intensity to minimum 1.0", () => {
      const s = triggerZoomPulse(createPostProcessState(), 0.5, 200);
      expect(s.zoomPulse.intensity).toBe(1.0);
    });

    it("does not mutate original state", () => {
      const original = createPostProcessState();
      triggerZoomPulse(original, 1.05, 200);
      expect(original.zoomPulse.active).toBe(false);
    });

    it("preserves baseZoom", () => {
      const s = triggerZoomPulse(createPostProcessState(), 1.08, 200);
      expect(s.zoomPulse.baseZoom).toBe(1.0);
    });
  });

  // ── triggerChromaticAberration ──
  describe("triggerChromaticAberration", () => {
    it("activates chromatic aberration", () => {
      const s = triggerChromaticAberration(createPostProcessState(), 3, 150);
      expect(s.chromaticAberration.active).toBe(true);
    });

    it("sets offset and maxOffset", () => {
      const s = triggerChromaticAberration(createPostProcessState(), 5, 200);
      expect(s.chromaticAberration.offset).toBe(5);
      expect(s.chromaticAberration.maxOffset).toBe(5);
    });

    it("sets timer equal to duration", () => {
      const s = triggerChromaticAberration(createPostProcessState(), 3, 250);
      expect(s.chromaticAberration.timer).toBe(250);
      expect(s.chromaticAberration.duration).toBe(250);
    });

    it("does not mutate original state", () => {
      const original = createPostProcessState();
      triggerChromaticAberration(original, 3, 150);
      expect(original.chromaticAberration.active).toBe(false);
    });
  });

  // ── setVignette ──
  describe("setVignette", () => {
    it("activates vignette when intensity > 0", () => {
      const s = setVignette(createPostProcessState(), 0.5);
      expect(s.vignette.active).toBe(true);
      expect(s.vignette.targetIntensity).toBe(0.5);
    });

    it("deactivates vignette when intensity is 0", () => {
      const s = setVignette(createPostProcessState(), 0);
      expect(s.vignette.active).toBe(false);
    });

    it("uses default red color", () => {
      const s = setVignette(createPostProcessState(), 0.3);
      expect(s.vignette.color).toBe(0xff0000);
    });

    it("accepts custom color", () => {
      const s = setVignette(createPostProcessState(), 0.3, 0x00ff00);
      expect(s.vignette.color).toBe(0x00ff00);
    });

    it("clamps intensity to 0-1", () => {
      const over = setVignette(createPostProcessState(), 2.0);
      expect(over.vignette.targetIntensity).toBe(1.0);
      const under = setVignette(createPostProcessState(), -0.5);
      expect(under.vignette.targetIntensity).toBe(0);
    });

    it("does not mutate original state", () => {
      const original = createPostProcessState();
      setVignette(original, 0.8);
      expect(original.vignette.targetIntensity).toBe(0);
    });
  });

  // ── triggerSlowMotion ──
  describe("triggerSlowMotion", () => {
    it("activates slow motion", () => {
      const s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      expect(s.slowMotion.active).toBe(true);
    });

    it("sets timeScale and targetScale", () => {
      const s = triggerSlowMotion(createPostProcessState(), 0.5, 400);
      expect(s.slowMotion.timeScale).toBe(0.5);
      expect(s.slowMotion.targetScale).toBe(0.5);
    });

    it("clamps timeScale between 0.01 and 1.0", () => {
      const low = triggerSlowMotion(createPostProcessState(), 0, 500);
      expect(low.slowMotion.timeScale).toBe(0.01);
      const high = triggerSlowMotion(createPostProcessState(), 2.0, 500);
      expect(high.slowMotion.timeScale).toBe(1.0);
    });

    it("sets timer equal to duration", () => {
      const s = triggerSlowMotion(createPostProcessState(), 0.3, 600);
      expect(s.slowMotion.timer).toBe(600);
      expect(s.slowMotion.duration).toBe(600);
    });

    it("does not mutate original state", () => {
      const original = createPostProcessState();
      triggerSlowMotion(original, 0.3, 500);
      expect(original.slowMotion.active).toBe(false);
    });
  });

  // ── setColorGrade ──
  describe("setColorGrade", () => {
    it("sets brightness, contrast, saturation", () => {
      const s = setColorGrade(createPostProcessState(), 1.2, 0.8, 1.5);
      expect(s.colorGrading.brightness).toBe(1.2);
      expect(s.colorGrading.contrast).toBe(0.8);
      expect(s.colorGrading.saturation).toBe(1.5);
    });

    it("clamps values to minimum 0", () => {
      const s = setColorGrade(createPostProcessState(), -1, -2, -3);
      expect(s.colorGrading.brightness).toBe(0);
      expect(s.colorGrading.contrast).toBe(0);
      expect(s.colorGrading.saturation).toBe(0);
    });

    it("preserves tint", () => {
      const s = setColorGrade(createPostProcessState(), 1.0, 1.0, 1.0);
      expect(s.colorGrading.tint).toBe(0xffffff);
    });

    it("does not mutate original state", () => {
      const original = createPostProcessState();
      setColorGrade(original, 2.0, 2.0, 2.0);
      expect(original.colorGrading.brightness).toBe(1.0);
    });
  });

  // ── tick ──
  describe("tick", () => {
    it("decrements zoom pulse timer", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      s = tick(s, 50);
      expect(s.zoomPulse.timer).toBe(150);
      expect(s.zoomPulse.active).toBe(true);
    });

    it("deactivates zoom pulse when timer reaches 0", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      s = tick(s, 200);
      expect(s.zoomPulse.active).toBe(false);
      expect(s.zoomPulse.timer).toBe(0);
    });

    it("decrements chromatic timer", () => {
      let s = triggerChromaticAberration(createPostProcessState(), 3, 150);
      s = tick(s, 50);
      expect(s.chromaticAberration.timer).toBe(100);
    });

    it("deactivates chromatic when timer reaches 0", () => {
      let s = triggerChromaticAberration(createPostProcessState(), 3, 100);
      s = tick(s, 100);
      expect(s.chromaticAberration.active).toBe(false);
    });

    it("lerps vignette intensity toward target", () => {
      let s = setVignette(createPostProcessState(), 1.0);
      s = tick(s, 16); // one frame
      expect(s.vignette.intensity).toBeGreaterThan(0);
      expect(s.vignette.intensity).toBeLessThan(1.0);
    });

    it("vignette converges to target over many ticks", () => {
      let s = setVignette(createPostProcessState(), 0.8);
      for (let i = 0; i < 200; i++) {
        s = tick(s, 16);
      }
      expect(s.vignette.intensity).toBeCloseTo(0.8, 2);
    });

    it("deactivates slow motion when timer reaches 0", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      s = tick(s, 500);
      expect(s.slowMotion.active).toBe(false);
      expect(s.slowMotion.timeScale).toBe(1.0);
    });

    it("slow motion stays active while timer > 0", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      s = tick(s, 200);
      expect(s.slowMotion.active).toBe(true);
      expect(s.slowMotion.timer).toBe(300);
    });

    it("does not go below 0 on timer overshoot", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.05, 100);
      s = tick(s, 999);
      expect(s.zoomPulse.timer).toBe(0);
    });

    it("does not mutate original state", () => {
      const original = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      tick(original, 50);
      expect(original.zoomPulse.timer).toBe(200);
    });

    it("handles multiple effects simultaneously", () => {
      let s = createPostProcessState();
      s = triggerZoomPulse(s, 1.05, 200);
      s = triggerChromaticAberration(s, 3, 150);
      s = triggerSlowMotion(s, 0.5, 300);
      s = tick(s, 100);
      expect(s.zoomPulse.timer).toBe(100);
      expect(s.chromaticAberration.timer).toBe(50);
      expect(s.slowMotion.timer).toBe(200);
    });
  });

  // ── getZoomLevel ──
  describe("getZoomLevel", () => {
    it("returns baseZoom when no pulse active", () => {
      const s = createPostProcessState();
      expect(getZoomLevel(s)).toBe(1.0);
    });

    it("returns intensity at start of pulse (progress=0)", () => {
      const s = triggerZoomPulse(createPostProcessState(), 1.1, 200);
      // timer=200, duration=200 → progress=0 → easeOut=0 → full intensity
      expect(getZoomLevel(s)).toBeCloseTo(1.1, 5);
    });

    it("decays toward baseZoom as pulse progresses", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.1, 200);
      s = tick(s, 100); // halfway
      const zoom = getZoomLevel(s);
      expect(zoom).toBeGreaterThan(1.0);
      expect(zoom).toBeLessThan(1.1);
    });

    it("returns baseZoom after pulse ends", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.1, 200);
      s = tick(s, 200);
      expect(getZoomLevel(s)).toBe(1.0);
    });
  });

  // ── getChromaticOffset ──
  describe("getChromaticOffset", () => {
    it("returns 0 when inactive", () => {
      expect(getChromaticOffset(createPostProcessState())).toBe(0);
    });

    it("returns maxOffset at start", () => {
      const s = triggerChromaticAberration(createPostProcessState(), 5, 200);
      expect(getChromaticOffset(s)).toBe(5);
    });

    it("decays linearly", () => {
      let s = triggerChromaticAberration(createPostProcessState(), 4, 200);
      s = tick(s, 100); // halfway
      expect(getChromaticOffset(s)).toBeCloseTo(2, 5);
    });

    it("returns 0 after effect ends", () => {
      let s = triggerChromaticAberration(createPostProcessState(), 4, 200);
      s = tick(s, 200);
      expect(getChromaticOffset(s)).toBe(0);
    });
  });

  // ── getVignetteIntensity ──
  describe("getVignetteIntensity", () => {
    it("returns 0 for default state", () => {
      expect(getVignetteIntensity(createPostProcessState())).toBe(0);
    });

    it("returns current intensity (not target)", () => {
      const s = setVignette(createPostProcessState(), 0.8);
      // Before tick, intensity is still 0 (target is 0.8)
      expect(getVignetteIntensity(s)).toBe(0);
    });

    it("increases after tick", () => {
      let s = setVignette(createPostProcessState(), 0.8);
      s = tick(s, 16);
      expect(getVignetteIntensity(s)).toBeGreaterThan(0);
    });
  });

  // ── getTimeScale ──
  describe("getTimeScale", () => {
    it("returns 1.0 when no slow motion", () => {
      expect(getTimeScale(createPostProcessState())).toBe(1.0);
    });

    it("returns target scale during active slow motion", () => {
      const s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      expect(getTimeScale(s)).toBe(0.3);
    });

    it("lerps back to 1.0 in final 20% of duration", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      // tick to final 20%: timer should be 100ms (20% of 500)
      s = tick(s, 400);
      const scale = getTimeScale(s);
      expect(scale).toBe(0.3); // at exactly 20%, t=1 so still at targetScale
    });

    it("returns 1.0 after slow motion ends", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      s = tick(s, 500);
      expect(getTimeScale(s)).toBe(1.0);
    });

    it("approaches 1.0 near end of slow motion", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      s = tick(s, 475); // timer=25, 5% remaining
      const scale = getTimeScale(s);
      expect(scale).toBeGreaterThan(0.3);
      expect(scale).toBeLessThanOrEqual(1.0);
    });
  });

  // ── isAnyEffectActive ──
  describe("isAnyEffectActive", () => {
    it("returns false for default state", () => {
      expect(isAnyEffectActive(createPostProcessState())).toBe(false);
    });

    it("returns true when zoom pulse active", () => {
      const s = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      expect(isAnyEffectActive(s)).toBe(true);
    });

    it("returns true when chromatic active", () => {
      const s = triggerChromaticAberration(createPostProcessState(), 3, 100);
      expect(isAnyEffectActive(s)).toBe(true);
    });

    it("returns true when vignette active", () => {
      let s = setVignette(createPostProcessState(), 0.5);
      s = tick(s, 16); // need a tick for vignette to become active
      expect(isAnyEffectActive(s)).toBe(true);
    });

    it("returns true when slow motion active", () => {
      const s = triggerSlowMotion(createPostProcessState(), 0.3, 500);
      expect(isAnyEffectActive(s)).toBe(true);
    });

    it("returns false after all effects expire", () => {
      let s = createPostProcessState();
      s = triggerZoomPulse(s, 1.05, 100);
      s = triggerChromaticAberration(s, 3, 100);
      s = triggerSlowMotion(s, 0.3, 100);
      s = tick(s, 100);
      expect(isAnyEffectActive(s)).toBe(false);
    });
  });

  // ── clearAllEffects ──
  describe("clearAllEffects", () => {
    it("deactivates all effects", () => {
      let s = createPostProcessState();
      s = triggerZoomPulse(s, 1.05, 200);
      s = triggerChromaticAberration(s, 3, 150);
      s = setVignette(s, 0.8);
      s = triggerSlowMotion(s, 0.3, 500);
      s = clearAllEffects(s);
      expect(isAnyEffectActive(s)).toBe(false);
    });

    it("resets zoom pulse completely", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.1, 300);
      s = clearAllEffects(s);
      expect(s.zoomPulse.intensity).toBe(0);
      expect(s.zoomPulse.timer).toBe(0);
    });

    it("resets chromatic aberration completely", () => {
      let s = triggerChromaticAberration(createPostProcessState(), 5, 200);
      s = clearAllEffects(s);
      expect(s.chromaticAberration.offset).toBe(0);
      expect(s.chromaticAberration.maxOffset).toBe(0);
    });

    it("resets vignette to zero intensity", () => {
      let s = setVignette(createPostProcessState(), 0.9, 0x00ff00);
      s = clearAllEffects(s);
      expect(s.vignette.intensity).toBe(0);
      expect(s.vignette.targetIntensity).toBe(0);
      expect(s.vignette.color).toBe(0xff0000); // reset to default
    });

    it("resets slow motion to 1.0 timeScale", () => {
      let s = triggerSlowMotion(createPostProcessState(), 0.2, 800);
      s = clearAllEffects(s);
      expect(s.slowMotion.timeScale).toBe(1.0);
      expect(s.slowMotion.targetScale).toBe(1.0);
    });

    it("resets color grading to neutral", () => {
      let s = setColorGrade(createPostProcessState(), 2.0, 0.5, 1.5);
      s = clearAllEffects(s);
      expect(s.colorGrading.brightness).toBe(1.0);
      expect(s.colorGrading.contrast).toBe(1.0);
      expect(s.colorGrading.saturation).toBe(1.0);
    });

    it("does not mutate original state", () => {
      const original = triggerZoomPulse(createPostProcessState(), 1.1, 200);
      clearAllEffects(original);
      expect(original.zoomPulse.active).toBe(true);
    });
  });

  // ── getDamageFlashState ──
  describe("getDamageFlashState", () => {
    it("returns zero intensity when HP is above 30%", () => {
      const result = getDamageFlashState(createPostProcessState(), 0.5);
      expect(result.vignetteIntensity).toBe(0);
      expect(result.shouldPulse).toBe(false);
    });

    it("returns zero intensity at exactly 30%", () => {
      const result = getDamageFlashState(createPostProcessState(), 0.3);
      expect(result.vignetteIntensity).toBe(0);
    });

    it("returns intensity at 100% HP", () => {
      const result = getDamageFlashState(createPostProcessState(), 1.0);
      expect(result.vignetteIntensity).toBe(0);
    });

    it("returns max intensity at 0% HP", () => {
      const result = getDamageFlashState(createPostProcessState(), 0);
      expect(result.vignetteIntensity).toBeCloseTo(0.6, 5);
    });

    it("scales linearly between threshold and 0", () => {
      const result = getDamageFlashState(createPostProcessState(), 0.15);
      // 0.15 / 0.3 = 0.5 ratio → 0.6 * (1 - 0.5) = 0.3
      expect(result.vignetteIntensity).toBeCloseTo(0.3, 5);
    });

    it("enables pulse below 15% HP", () => {
      const low = getDamageFlashState(createPostProcessState(), 0.1);
      expect(low.shouldPulse).toBe(true);
      const notLow = getDamageFlashState(createPostProcessState(), 0.2);
      expect(notLow.shouldPulse).toBe(false);
    });

    it("uses red as vignette color", () => {
      const result = getDamageFlashState(createPostProcessState(), 0.1);
      expect(result.vignetteColor).toBe(0xff0000);
    });

    it("clamps HP above 1", () => {
      const result = getDamageFlashState(createPostProcessState(), 1.5);
      expect(result.vignetteIntensity).toBe(0);
    });

    it("clamps HP below 0", () => {
      const result = getDamageFlashState(createPostProcessState(), -0.5);
      expect(result.vignetteIntensity).toBeCloseTo(0.6, 5);
    });
  });

  // ── getKillStreakEffect ──
  describe("getKillStreakEffect", () => {
    it("returns tier 0 (no effect) below 10 kills", () => {
      const e = getKillStreakEffect(5);
      expect(e.tier).toBe(0);
      expect(e.zoomIntensity).toBe(1.0);
      expect(e.chromaticOffset).toBe(0);
      expect(e.slowMotionScale).toBe(1.0);
    });

    it("returns tier 0 at 0 kills", () => {
      expect(getKillStreakEffect(0).tier).toBe(0);
    });

    it("returns tier 1 at 10 kills", () => {
      const e = getKillStreakEffect(10);
      expect(e.tier).toBe(1);
      expect(e.zoomIntensity).toBe(1.02);
    });

    it("returns tier 2 at 25 kills", () => {
      const e = getKillStreakEffect(25);
      expect(e.tier).toBe(2);
      expect(e.slowMotionScale).toBe(0.8);
    });

    it("returns tier 3 at 50 kills", () => {
      const e = getKillStreakEffect(50);
      expect(e.tier).toBe(3);
      expect(e.chromaticOffset).toBe(3);
    });

    it("returns tier 4 at 100 kills", () => {
      const e = getKillStreakEffect(100);
      expect(e.tier).toBe(4);
      expect(e.zoomIntensity).toBe(1.08);
      expect(e.slowMotionScale).toBe(0.3);
      expect(e.chromaticOffset).toBe(5);
    });

    it("returns tier 4 for very high kill counts", () => {
      const e = getKillStreakEffect(999);
      expect(e.tier).toBe(4);
    });

    it("has increasing zoom intensity per tier", () => {
      const t1 = getKillStreakEffect(10);
      const t2 = getKillStreakEffect(25);
      const t3 = getKillStreakEffect(50);
      const t4 = getKillStreakEffect(100);
      expect(t2.zoomIntensity).toBeGreaterThan(t1.zoomIntensity);
      expect(t3.zoomIntensity).toBeGreaterThan(t2.zoomIntensity);
      expect(t4.zoomIntensity).toBeGreaterThan(t3.zoomIntensity);
    });

    it("has increasing chromatic offset per tier", () => {
      const t1 = getKillStreakEffect(10);
      const t2 = getKillStreakEffect(25);
      const t3 = getKillStreakEffect(50);
      const t4 = getKillStreakEffect(100);
      expect(t2.chromaticOffset).toBeGreaterThan(t1.chromaticOffset);
      expect(t3.chromaticOffset).toBeGreaterThan(t2.chromaticOffset);
      expect(t4.chromaticOffset).toBeGreaterThan(t3.chromaticOffset);
    });

    it("has decreasing slow motion scale per tier (from tier 2)", () => {
      const t2 = getKillStreakEffect(25);
      const t3 = getKillStreakEffect(50);
      const t4 = getKillStreakEffect(100);
      expect(t3.slowMotionScale).toBeLessThan(t2.slowMotionScale);
      expect(t4.slowMotionScale).toBeLessThan(t3.slowMotionScale);
    });
  });

  // ── Integration: complex scenarios ──
  describe("integration", () => {
    it("boss hit: zoom + chromatic + slow motion combo", () => {
      let s = createPostProcessState();
      s = triggerZoomPulse(s, 1.06, 300);
      s = triggerChromaticAberration(s, 4, 250);
      s = triggerSlowMotion(s, 0.3, 500);
      expect(isAnyEffectActive(s)).toBe(true);
      expect(getZoomLevel(s)).toBeCloseTo(1.06, 5);
      expect(getChromaticOffset(s)).toBe(4);
      expect(getTimeScale(s)).toBe(0.3);
    });

    it("effects expire at different times", () => {
      let s = createPostProcessState();
      s = triggerZoomPulse(s, 1.05, 100);
      s = triggerChromaticAberration(s, 3, 200);
      s = triggerSlowMotion(s, 0.5, 300);

      s = tick(s, 100);
      expect(s.zoomPulse.active).toBe(false);
      expect(s.chromaticAberration.active).toBe(true);
      expect(s.slowMotion.active).toBe(true);

      s = tick(s, 100);
      expect(s.chromaticAberration.active).toBe(false);
      expect(s.slowMotion.active).toBe(true);

      s = tick(s, 100);
      expect(s.slowMotion.active).toBe(false);
      expect(isAnyEffectActive(s)).toBe(false);
    });

    it("retriggering effect mid-play resets it", () => {
      let s = triggerZoomPulse(createPostProcessState(), 1.05, 200);
      s = tick(s, 100); // halfway
      s = triggerZoomPulse(s, 1.1, 300); // retrigger
      expect(s.zoomPulse.intensity).toBe(1.1);
      expect(s.zoomPulse.timer).toBe(300);
    });
  });
});
