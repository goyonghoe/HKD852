import { describe, it, expect } from "vitest";
import {
  createUIScaleConfig,
  calculateScale,
  scalePosition,
  unscalePosition,
  scaleFontSize,
  scaleValue,
  getAspectRatio,
  isPortrait,
  isLandscape,
  getLetterboxBars,
} from "../../src/core/UIScaleCalc";

describe("UIScaleCalc", () => {
  // --- createUIScaleConfig ---
  describe("createUIScaleConfig", () => {
    it("returns default config with no overrides", () => {
      const cfg = createUIScaleConfig();
      expect(cfg.baseWidth).toBe(720);
      expect(cfg.baseHeight).toBe(1280);
      expect(cfg.minScale).toBe(0.5);
      expect(cfg.maxScale).toBe(2.0);
      expect(cfg.scaleMode).toBe("fit");
    });

    it("overrides baseWidth", () => {
      const cfg = createUIScaleConfig({ baseWidth: 1080 });
      expect(cfg.baseWidth).toBe(1080);
      expect(cfg.baseHeight).toBe(1280);
    });

    it("overrides scaleMode to fill", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fill" });
      expect(cfg.scaleMode).toBe("fill");
    });

    it("overrides scaleMode to stretch", () => {
      const cfg = createUIScaleConfig({ scaleMode: "stretch" });
      expect(cfg.scaleMode).toBe("stretch");
    });

    it("overrides minScale and maxScale", () => {
      const cfg = createUIScaleConfig({ minScale: 0.25, maxScale: 3.0 });
      expect(cfg.minScale).toBe(0.25);
      expect(cfg.maxScale).toBe(3.0);
    });

    it("overrides multiple fields at once", () => {
      const cfg = createUIScaleConfig({
        baseWidth: 1080,
        baseHeight: 1920,
        scaleMode: "stretch",
      });
      expect(cfg.baseWidth).toBe(1080);
      expect(cfg.baseHeight).toBe(1920);
      expect(cfg.scaleMode).toBe("stretch");
    });

    it("returns a new object each call", () => {
      const a = createUIScaleConfig();
      const b = createUIScaleConfig();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // --- calculateScale — fit mode ---
  describe("calculateScale (fit)", () => {
    const cfg = createUIScaleConfig({ scaleMode: "fit" });

    it("returns scale 1 when screen matches base", () => {
      const r = calculateScale(cfg, 720, 1280);
      expect(r.scaleX).toBe(1);
      expect(r.scaleY).toBe(1);
      expect(r.uniformScale).toBe(1);
    });

    it("returns zero offset when screen matches base", () => {
      const r = calculateScale(cfg, 720, 1280);
      expect(r.offsetX).toBe(0);
      expect(r.offsetY).toBe(0);
    });

    it("scales down for smaller screen", () => {
      const r = calculateScale(cfg, 360, 640);
      expect(r.uniformScale).toBe(0.5);
      expect(r.scaleX).toBe(0.5);
      expect(r.scaleY).toBe(0.5);
    });

    it("scales up for larger screen proportionally", () => {
      const r = calculateScale(cfg, 1440, 2560);
      expect(r.uniformScale).toBe(2.0);
    });

    it("creates vertical letterbox when screen is wider", () => {
      const r = calculateScale(cfg, 1280, 1280);
      // height-limited: 1280/1280 = 1.0, width: 1280/720 ≈ 1.78 → min = 1.0
      expect(r.uniformScale).toBe(1);
      expect(r.offsetX).toBeGreaterThan(0);
      expect(r.offsetY).toBe(0);
    });

    it("creates horizontal letterbox when screen is taller", () => {
      const r = calculateScale(cfg, 720, 2560);
      // width: 720/720=1, height: 2560/1280=2 → min=1
      expect(r.uniformScale).toBe(1);
      expect(r.offsetY).toBeGreaterThan(0);
    });

    it("clamps to minScale", () => {
      const r = calculateScale(cfg, 100, 100);
      expect(r.uniformScale).toBe(0.5);
    });

    it("clamps to maxScale", () => {
      const r = calculateScale(cfg, 7200, 12800);
      expect(r.uniformScale).toBe(2.0);
    });

    it("effective dimensions match base * scale", () => {
      const r = calculateScale(cfg, 1080, 1920);
      expect(r.effectiveWidth).toBe(cfg.baseWidth * r.scaleX);
      expect(r.effectiveHeight).toBe(cfg.baseHeight * r.scaleY);
    });

    it("offset centers the content", () => {
      const sw = 1000;
      const sh = 1280;
      const r = calculateScale(cfg, sw, sh);
      expect(r.offsetX).toBeCloseTo((sw - r.effectiveWidth) / 2);
      expect(r.offsetY).toBeCloseTo((sh - r.effectiveHeight) / 2);
    });
  });

  // --- calculateScale — fill mode ---
  describe("calculateScale (fill)", () => {
    const cfg = createUIScaleConfig({ scaleMode: "fill" });

    it("returns scale 1 when screen matches base", () => {
      const r = calculateScale(cfg, 720, 1280);
      expect(r.uniformScale).toBe(1);
    });

    it("uses max of scaleX/scaleY", () => {
      const r = calculateScale(cfg, 1440, 1280);
      // scaleX=2, scaleY=1 → max=2
      expect(r.uniformScale).toBe(2.0);
    });

    it("may produce negative offsets (cropping)", () => {
      const r = calculateScale(cfg, 1440, 1280);
      // effective: 720*2=1440, 1280*2=2560, offsetY = (1280-2560)/2 = -640
      expect(r.offsetY).toBeLessThan(0);
    });

    it("clamps to maxScale", () => {
      const r = calculateScale(cfg, 7200, 12800);
      expect(r.uniformScale).toBe(2.0);
    });

    it("clamps to minScale", () => {
      const r = calculateScale(cfg, 100, 100);
      expect(r.uniformScale).toBe(0.5);
    });

    it("fills entire screen width/height", () => {
      const r = calculateScale(cfg, 1080, 1920);
      // scaleX=1.5, scaleY=1.5 → max=1.5
      expect(r.uniformScale).toBe(1.5);
      expect(r.effectiveWidth).toBe(1080);
      expect(r.effectiveHeight).toBe(1920);
    });
  });

  // --- calculateScale — stretch mode ---
  describe("calculateScale (stretch)", () => {
    const cfg = createUIScaleConfig({ scaleMode: "stretch" });

    it("returns independent x/y scales", () => {
      const r = calculateScale(cfg, 1080, 1280);
      expect(r.scaleX).toBe(1.5);
      expect(r.scaleY).toBe(1);
    });

    it("uniformScale is min of scaleX, scaleY", () => {
      const r = calculateScale(cfg, 1080, 1280);
      expect(r.uniformScale).toBe(Math.min(r.scaleX, r.scaleY));
    });

    it("produces zero offsets (fills exactly)", () => {
      const r = calculateScale(cfg, 1080, 1920);
      expect(r.offsetX).toBeCloseTo(0);
      expect(r.offsetY).toBeCloseTo(0);
    });

    it("clamps each axis independently to minScale", () => {
      const r = calculateScale(cfg, 100, 12800);
      expect(r.scaleX).toBe(0.5);
      expect(r.scaleY).toBe(2.0);
    });

    it("clamps each axis independently to maxScale", () => {
      const r = calculateScale(cfg, 7200, 640);
      expect(r.scaleX).toBe(2.0);
      expect(r.scaleY).toBe(0.5);
    });

    it("effective dimensions fill screen when within clamp", () => {
      const r = calculateScale(cfg, 1080, 1920);
      expect(r.effectiveWidth).toBeCloseTo(1080);
      expect(r.effectiveHeight).toBeCloseTo(1920);
    });
  });

  // --- scalePosition ---
  describe("scalePosition", () => {
    it("maps origin to offset", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      const p = scalePosition(0, 0, r);
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    });

    it("maps base corner to screen corner at 1x", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      const p = scalePosition(720, 1280, r);
      expect(p.x).toBe(720);
      expect(p.y).toBe(1280);
    });

    it("applies offset for letterboxed screen", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1280, 1280);
      const p = scalePosition(0, 0, r);
      expect(p.x).toBeGreaterThan(0);
      expect(p.y).toBe(0);
    });

    it("scales position at 2x", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1440, 2560);
      const p = scalePosition(100, 200, r);
      expect(p.x).toBe(100 * r.scaleX + r.offsetX);
      expect(p.y).toBe(200 * r.scaleY + r.offsetY);
    });

    it("handles negative coordinates", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      const p = scalePosition(-10, -20, r);
      expect(p.x).toBe(-10);
      expect(p.y).toBe(-20);
    });
  });

  // --- unscalePosition ---
  describe("unscalePosition", () => {
    it("inverts scalePosition at 1x", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      const p = scalePosition(100, 200, r);
      const u = unscalePosition(p.x, p.y, r);
      expect(u.x).toBeCloseTo(100);
      expect(u.y).toBeCloseTo(200);
    });

    it("inverts scalePosition at 2x", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1440, 2560);
      const p = scalePosition(360, 640, r);
      const u = unscalePosition(p.x, p.y, r);
      expect(u.x).toBeCloseTo(360);
      expect(u.y).toBeCloseTo(640);
    });

    it("inverts with letterbox offset", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1280, 1280);
      const p = scalePosition(0, 0, r);
      const u = unscalePosition(p.x, p.y, r);
      expect(u.x).toBeCloseTo(0);
      expect(u.y).toBeCloseTo(0);
    });

    it("roundtrip for arbitrary point", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fill" });
      const r = calculateScale(cfg, 1080, 1920);
      const orig = { x: 355.5, y: 999.9 };
      const screen = scalePosition(orig.x, orig.y, r);
      const back = unscalePosition(screen.x, screen.y, r);
      expect(back.x).toBeCloseTo(orig.x, 5);
      expect(back.y).toBeCloseTo(orig.y, 5);
    });

    it("roundtrip in stretch mode", () => {
      const cfg = createUIScaleConfig({ scaleMode: "stretch" });
      const r = calculateScale(cfg, 1080, 1920);
      const orig = { x: 200, y: 800 };
      const screen = scalePosition(orig.x, orig.y, r);
      const back = unscalePosition(screen.x, screen.y, r);
      expect(back.x).toBeCloseTo(orig.x, 5);
      expect(back.y).toBeCloseTo(orig.y, 5);
    });
  });

  // --- scaleFontSize ---
  describe("scaleFontSize", () => {
    it("returns same size at 1x scale", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      expect(scaleFontSize(16, r)).toBe(16);
    });

    it("doubles at 2x scale", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1440, 2560);
      expect(scaleFontSize(16, r)).toBe(32);
    });

    it("halves at 0.5x scale", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 360, 640);
      expect(scaleFontSize(16, r)).toBe(8);
    });

    it("rounds to nearest integer", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1080, 1920);
      const result = scaleFontSize(16, r);
      expect(result).toBe(Math.round(result));
    });

    it("handles zero font size", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1080, 1920);
      expect(scaleFontSize(0, r)).toBe(0);
    });
  });

  // --- scaleValue ---
  describe("scaleValue", () => {
    it("returns same value at 1x scale", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 720, 1280);
      expect(scaleValue(50, r)).toBe(50);
    });

    it("doubles at 2x scale", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1440, 2560);
      expect(scaleValue(50, r)).toBe(100);
    });

    it("handles zero", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1080, 1920);
      expect(scaleValue(0, r)).toBe(0);
    });

    it("handles negative values", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1440, 2560);
      expect(scaleValue(-10, r)).toBe(-20);
    });

    it("uses uniformScale not scaleX", () => {
      const cfg = createUIScaleConfig({ scaleMode: "stretch" });
      const r = calculateScale(cfg, 1080, 1280);
      // scaleX=1.5, scaleY=1, uniformScale=1
      expect(scaleValue(100, r)).toBe(100 * r.uniformScale);
    });
  });

  // --- getAspectRatio ---
  describe("getAspectRatio", () => {
    it("returns 9/16 for 720x1280", () => {
      expect(getAspectRatio(720, 1280)).toBeCloseTo(720 / 1280);
    });

    it("returns 16/9 for 1920x1080", () => {
      expect(getAspectRatio(1920, 1080)).toBeCloseTo(16 / 9);
    });

    it("returns 1 for square", () => {
      expect(getAspectRatio(500, 500)).toBe(1);
    });

    it("returns Infinity for zero height", () => {
      expect(getAspectRatio(100, 0)).toBe(Infinity);
    });

    it("returns 0 for zero width", () => {
      expect(getAspectRatio(0, 100)).toBe(0);
    });
  });

  // --- isPortrait ---
  describe("isPortrait", () => {
    it("returns true for 720x1280", () => {
      expect(isPortrait(720, 1280)).toBe(true);
    });

    it("returns false for 1920x1080", () => {
      expect(isPortrait(1920, 1080)).toBe(false);
    });

    it("returns false for square", () => {
      expect(isPortrait(500, 500)).toBe(false);
    });
  });

  // --- isLandscape ---
  describe("isLandscape", () => {
    it("returns true for 1920x1080", () => {
      expect(isLandscape(1920, 1080)).toBe(true);
    });

    it("returns false for 720x1280", () => {
      expect(isLandscape(720, 1280)).toBe(false);
    });

    it("returns false for square", () => {
      expect(isLandscape(500, 500)).toBe(false);
    });
  });

  // --- getLetterboxBars ---
  describe("getLetterboxBars", () => {
    it("returns zero bars when screen matches base", () => {
      const cfg = createUIScaleConfig();
      const bars = getLetterboxBars(cfg, 720, 1280);
      expect(bars.horizontal).toBe(0);
      expect(bars.vertical).toBe(0);
    });

    it("returns vertical bars for wider screen (fit)", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fit" });
      const bars = getLetterboxBars(cfg, 1280, 1280);
      expect(bars.vertical).toBeGreaterThan(0);
      expect(bars.horizontal).toBe(0);
    });

    it("returns horizontal bars for taller screen (fit)", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fit" });
      const bars = getLetterboxBars(cfg, 720, 2560);
      expect(bars.horizontal).toBeGreaterThan(0);
      expect(bars.vertical).toBe(0);
    });

    it("returns zero bars for exact 2x screen (fit)", () => {
      const cfg = createUIScaleConfig();
      const bars = getLetterboxBars(cfg, 1440, 2560);
      expect(bars.horizontal).toBe(0);
      expect(bars.vertical).toBe(0);
    });

    it("never returns negative values", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fill" });
      const bars = getLetterboxBars(cfg, 1440, 1280);
      expect(bars.horizontal).toBeGreaterThanOrEqual(0);
      expect(bars.vertical).toBeGreaterThanOrEqual(0);
    });

    it("vertical bar width is symmetric", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fit" });
      const bars = getLetterboxBars(cfg, 1280, 1280);
      const r = calculateScale(cfg, 1280, 1280);
      // offset is half bar, bar = offset
      expect(bars.vertical).toBe(r.offsetX);
    });
  });

  // --- edge cases ---
  describe("edge cases", () => {
    it("handles very small screen", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 1, 1);
      expect(r.uniformScale).toBe(0.5);
    });

    it("handles very large screen", () => {
      const cfg = createUIScaleConfig();
      const r = calculateScale(cfg, 10000, 20000);
      expect(r.uniformScale).toBe(2.0);
    });

    it("custom minScale/maxScale is respected", () => {
      const cfg = createUIScaleConfig({ minScale: 0.1, maxScale: 5.0 });
      const r = calculateScale(cfg, 3600, 6400);
      expect(r.uniformScale).toBe(5.0);
    });

    it("minScale equals maxScale locks scale", () => {
      const cfg = createUIScaleConfig({ minScale: 1.5, maxScale: 1.5 });
      const r = calculateScale(cfg, 100, 100);
      expect(r.uniformScale).toBe(1.5);
    });

    it("scalePosition + unscalePosition roundtrip with fill", () => {
      const cfg = createUIScaleConfig({ scaleMode: "fill" });
      const r = calculateScale(cfg, 800, 1400);
      const orig = { x: 123.456, y: 789.012 };
      const s = scalePosition(orig.x, orig.y, r);
      const u = unscalePosition(s.x, s.y, r);
      expect(u.x).toBeCloseTo(orig.x, 5);
      expect(u.y).toBeCloseTo(orig.y, 5);
    });
  });
});
