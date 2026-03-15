import { describe, it, expect } from "vitest";
import {
  getEffectiveMagnetRadius,
  getPickupsInRange,
  calculateMagnetPull,
  getMagnetBurstRadius,
  shouldAutoCollect,
  type PickupTarget,
} from "../../src/core/MagnetCalc";

describe("MagnetCalc", () => {
  // ── getEffectiveMagnetRadius ──

  describe("getEffectiveMagnetRadius", () => {
    it("returns base radius (50) with no passive and no meta bonus", () => {
      expect(getEffectiveMagnetRadius(0, 0)).toBe(50);
    });

    it("magnet level 1 = 70 (50 + 20)", () => {
      expect(getEffectiveMagnetRadius(1, 0)).toBe(70);
    });

    it("magnet level 5 = 180 (50 + 130)", () => {
      expect(getEffectiveMagnetRadius(5, 0)).toBe(180);
    });

    it("meta bonus adds flat px on top of base", () => {
      expect(getEffectiveMagnetRadius(0, 25)).toBe(75);
    });

    it("combines passive and meta bonus", () => {
      // 50 + 40 (level 2) + 30 (meta) = 120
      expect(getEffectiveMagnetRadius(2, 30)).toBe(120);
    });

    it("out-of-range passive level gives no passive bonus", () => {
      expect(getEffectiveMagnetRadius(6, 0)).toBe(50);
      expect(getEffectiveMagnetRadius(-1, 0)).toBe(50);
    });
  });

  // ── getPickupsInRange ──

  describe("getPickupsInRange", () => {
    const pickups: PickupTarget[] = [
      { id: "a", x: 110, y: 100 }, // 10px away from (100,100)
      { id: "b", x: 200, y: 100 }, // 100px away
      { id: "c", x: 100, y: 150 }, // 50px away (exactly on boundary)
      { id: "d", x: 300, y: 300 }, // far away
    ];

    it("returns pickups within radius", () => {
      const result = getPickupsInRange(100, 100, 50, pickups);
      const ids = result.map((p) => p.id);
      expect(ids).toContain("a");
      expect(ids).toContain("c");
      expect(ids).not.toContain("b");
      expect(ids).not.toContain("d");
    });

    it("returns empty array when no pickups in range", () => {
      const result = getPickupsInRange(100, 100, 5, pickups);
      expect(result).toHaveLength(0);
    });

    it("includes pickup exactly on boundary (<=)", () => {
      const result = getPickupsInRange(100, 100, 50, pickups);
      expect(result.map((p) => p.id)).toContain("c");
    });

    it("uses squared distance — no false positive on diagonal", () => {
      // Pickup at (135, 135) from player at (100, 100):
      // dx=35, dy=35, dist = sqrt(35²+35²) ≈ 49.5 → inside radius 50
      // Pickup at (136, 136): dist ≈ 50.9 → outside radius 50
      const diag: PickupTarget[] = [
        { id: "inside", x: 135, y: 135 },
        { id: "outside", x: 136, y: 136 },
      ];
      const result = getPickupsInRange(100, 100, 50, diag);
      expect(result.map((p) => p.id)).toContain("inside");
      expect(result.map((p) => p.id)).not.toContain("outside");
    });
  });

  // ── calculateMagnetPull ──

  describe("calculateMagnetPull", () => {
    it("moves pickup toward player by pullStrength fraction", () => {
      // Player at (100, 100), pickup at (200, 100), pull 0.3
      // new x = 200 + (100 - 200) * 0.3 = 200 - 30 = 170
      const result = calculateMagnetPull(100, 100, 200, 100, 0.3);
      expect(result.x).toBeCloseTo(170);
      expect(result.y).toBeCloseTo(100);
    });

    it("pullStrength 1.0 teleports pickup to player", () => {
      const result = calculateMagnetPull(100, 200, 500, 600, 1.0);
      expect(result.x).toBeCloseTo(100);
      expect(result.y).toBeCloseTo(200);
    });

    it("pullStrength 0.0 does not move pickup", () => {
      const result = calculateMagnetPull(100, 200, 500, 600, 0.0);
      expect(result.x).toBeCloseTo(500);
      expect(result.y).toBeCloseTo(600);
    });

    it("handles diagonal pull correctly", () => {
      // Player (0,0), pickup (100, 100), pull 0.5 → (50, 50)
      const result = calculateMagnetPull(0, 0, 100, 100, 0.5);
      expect(result.x).toBeCloseTo(50);
      expect(result.y).toBeCloseTo(50);
    });
  });

  // ── getMagnetBurstRadius ──

  describe("getMagnetBurstRadius", () => {
    it("returns baseRadius * burstMultiplier", () => {
      expect(getMagnetBurstRadius(50, 3)).toBe(150);
    });

    it("handles fractional multiplier", () => {
      expect(getMagnetBurstRadius(80, 2.5)).toBe(200);
    });

    it("multiplier of 1 returns base", () => {
      expect(getMagnetBurstRadius(50, 1)).toBe(50);
    });
  });

  // ── shouldAutoCollect ──

  describe("shouldAutoCollect", () => {
    it("returns true when pickup is within collectRadius", () => {
      expect(shouldAutoCollect(100, 100, 105, 100, 10)).toBe(true);
    });

    it("returns false when pickup is outside collectRadius", () => {
      expect(shouldAutoCollect(100, 100, 200, 100, 10)).toBe(false);
    });

    it("returns true when pickup is exactly on boundary", () => {
      // distance = 10, collectRadius = 10
      expect(shouldAutoCollect(100, 100, 110, 100, 10)).toBe(true);
    });

    it("uses squared distance for diagonal check", () => {
      // (107, 107) from (100, 100): dist = sqrt(49+49) ≈ 9.9 → inside 10
      expect(shouldAutoCollect(100, 100, 107, 107, 10)).toBe(true);
      // (108, 108): dist = sqrt(64+64) ≈ 11.3 → outside 10
      expect(shouldAutoCollect(100, 100, 108, 108, 10)).toBe(false);
    });
  });
});
