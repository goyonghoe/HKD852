// ── Tests: IndicatorCalc ──

import { describe, it, expect } from "vitest";
import {
  calculateIndicators,
  type OffScreenEnemy,
} from "../../src/core/IndicatorCalc";

const W = 720;
const H = 1280;
const MAX_DIST = 2000;
const MAX_IND = 8;

/** Helper: player at center, one enemy at given world position */
function singleEnemy(
  ex: number,
  ey: number,
  id = "drone_1",
): ReturnType<typeof calculateIndicators> {
  const playerX = 500;
  const playerY = 500;
  const enemies: OffScreenEnemy[] = [{ x: ex, y: ey, id, active: true }];
  return calculateIndicators(
    playerX,
    playerY,
    enemies,
    W,
    H,
    MAX_DIST,
    MAX_IND,
  );
}

describe("calculateIndicators", () => {
  it("returns empty array when no enemies exist", () => {
    const result = calculateIndicators(500, 500, [], W, H, MAX_DIST, MAX_IND);
    expect(result).toEqual([]);
  });

  it("returns no indicator for an on-screen enemy", () => {
    // Enemy at player position (definitely on screen)
    const result = singleEnemy(500, 500);
    expect(result).toHaveLength(0);
  });

  it("returns no indicator for on-screen enemy near edge", () => {
    // Player at 500,500 → camera covers [140,860] x [-140,1140]
    // Enemy at 600, 600 is well within view
    const result = singleEnemy(600, 600);
    expect(result).toHaveLength(0);
  });

  it("enemy above viewport → indicator near top edge", () => {
    // Player at 500, camera top = 500-640 = -140. Enemy at y=-500 is above.
    const result = singleEnemy(500, -500);
    expect(result).toHaveLength(1);
    expect(result[0].y).toBe(30); // top margin
    expect(result[0].angle).toBeCloseTo(-Math.PI / 2, 1); // pointing up
  });

  it("enemy below viewport → indicator near bottom edge", () => {
    // Camera bottom = 500+640 = 1140. Enemy at y=2000 is below.
    const result = singleEnemy(500, 2000);
    expect(result).toHaveLength(1);
    expect(result[0].y).toBe(H - 30); // bottom margin
    expect(result[0].angle).toBeCloseTo(Math.PI / 2, 1); // pointing down
  });

  it("enemy left of viewport → indicator near left edge", () => {
    // Camera left = 500-360 = 140. Enemy at x=-500 is left.
    const result = singleEnemy(-500, 500);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(30); // left margin
    expect(result[0].angle).toBeCloseTo(Math.PI, 1); // pointing left
  });

  it("enemy right of viewport → indicator near right edge", () => {
    // Camera right = 500+360 = 860. Enemy at x=2000 is right.
    const result = singleEnemy(2000, 500);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(W - 30); // right margin
    expect(result[0].angle).toBeCloseTo(0, 1); // pointing right
  });

  it("detects boss flag from id prefix", () => {
    const result = singleEnemy(2000, 500, "boss_aero_1");
    expect(result).toHaveLength(1);
    expect(result[0].isBoss).toBe(true);
  });

  it("non-boss enemy has isBoss=false", () => {
    const result = singleEnemy(2000, 500, "drone_42");
    expect(result).toHaveLength(1);
    expect(result[0].isBoss).toBe(false);
  });

  it("respects maxIndicators limit", () => {
    const playerX = 500;
    const playerY = 500;
    const enemies: OffScreenEnemy[] = [];
    // Create 12 off-screen enemies
    for (let i = 0; i < 12; i++) {
      enemies.push({
        x: 2000 + i * 10,
        y: 500,
        id: `drone_${i}`,
        active: true,
      });
    }
    const result = calculateIndicators(
      playerX,
      playerY,
      enemies,
      W,
      H,
      MAX_DIST,
      5,
    );
    expect(result).toHaveLength(5);
  });

  it("filters out enemies beyond maxDistance", () => {
    const result = singleEnemy(5000, 500); // distance ~4500, beyond MAX_DIST=2000
    expect(result).toHaveLength(0);
  });

  it("filters out inactive enemies", () => {
    const playerX = 500;
    const playerY = 500;
    const enemies: OffScreenEnemy[] = [
      { x: 2000, y: 500, id: "drone_1", active: false },
    ];
    const result = calculateIndicators(
      playerX,
      playerY,
      enemies,
      W,
      H,
      MAX_DIST,
      MAX_IND,
    );
    expect(result).toHaveLength(0);
  });

  it("bosses appear before non-bosses regardless of distance", () => {
    const playerX = 500;
    const playerY = 500;
    const enemies: OffScreenEnemy[] = [
      { x: 1500, y: 500, id: "drone_1", active: true }, // closer
      { x: 2000, y: 500, id: "boss_hydra", active: true }, // farther but boss
    ];
    const result = calculateIndicators(
      playerX,
      playerY,
      enemies,
      W,
      H,
      MAX_DIST,
      MAX_IND,
    );
    expect(result).toHaveLength(2);
    expect(result[0].isBoss).toBe(true);
    expect(result[1].isBoss).toBe(false);
  });

  it("returns correct distance value", () => {
    const playerX = 500;
    const playerY = 500;
    const ex = 1500;
    const enemies: OffScreenEnemy[] = [
      { x: ex, y: 500, id: "drone_1", active: true },
    ];
    const result = calculateIndicators(
      playerX,
      playerY,
      enemies,
      W,
      H,
      MAX_DIST,
      MAX_IND,
    );
    expect(result).toHaveLength(1);
    expect(result[0].distance).toBeCloseTo(1000, 0);
  });

  it("diagonal enemy → indicator at corner area", () => {
    // Enemy far to bottom-right
    const result = singleEnemy(1500, 1800);
    expect(result).toHaveLength(1);
    // Should be clamped to right or bottom edge area
    const ind = result[0];
    const atRightEdge = ind.x === W - 30;
    const atBottomEdge = ind.y === H - 30;
    expect(atRightEdge || atBottomEdge).toBe(true);
  });
});
