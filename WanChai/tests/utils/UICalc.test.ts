/**
 * TASK-091: UICalc Pure Logic Tests
 *
 * Tests for extracted UI geometry/math helpers:
 *   - fitInBounds: clamp element in container (M-013)
 *   - segmentLayout: compute segment positions (volume bars)
 *   - isWithinViewport: viewport containment check
 *   - roundedRectPoints: corner arc calculation
 *
 * No Phaser imports — pure math tests.
 */
import { describe, it, expect } from 'vitest';
import {
  fitInBounds,
  segmentLayout,
  isWithinViewport,
  roundedRectPoints,
  findActiveLevel,
  shouldAutoMute,
  shouldAutoUnmute,
  calculateProgressFraction,
  calculateProgressFillWidth,
} from '../../src/utils/UICalc';

// =======================================================================
// fitInBounds
// =======================================================================
describe('fitInBounds', () => {
  it('returns x unchanged when fully inside container', () => {
    expect(fitInBounds(10, 100, 500)).toBe(10);
  });

  it('clamps negative x to 0', () => {
    expect(fitInBounds(-20, 100, 500)).toBe(0);
  });

  it('clamps overflow to right edge', () => {
    // x=450, width=100 -> right edge 550 > container 500
    expect(fitInBounds(450, 100, 500)).toBe(400);
  });

  it('exact fit at right edge returns x unchanged', () => {
    // x=400, width=100 -> right edge 500 = container 500
    expect(fitInBounds(400, 100, 500)).toBe(400);
  });

  it('exact fit at left edge (x=0) returns 0', () => {
    expect(fitInBounds(0, 100, 500)).toBe(0);
  });

  it('element wider than container is centered', () => {
    // width=600 > container=500 -> center at (500-600)/2 = -50
    expect(fitInBounds(100, 600, 500)).toBe(-50);
  });

  it('element same width as container returns 0', () => {
    expect(fitInBounds(0, 500, 500)).toBe(0);
  });

  it('zero-width element stays at x', () => {
    expect(fitInBounds(250, 0, 500)).toBe(250);
  });
});

// =======================================================================
// segmentLayout
// =======================================================================
describe('segmentLayout', () => {
  it('returns empty array for 0 segments', () => {
    expect(segmentLayout(0, 36, 8, 100)).toEqual([]);
  });

  it('returns empty array for negative count', () => {
    expect(segmentLayout(-3, 36, 8, 100)).toEqual([]);
  });

  it('single segment starts at startX', () => {
    const result = segmentLayout(1, 36, 8, 100);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe(100);
    expect(result[0].width).toBe(36);
  });

  it('3 segments with gap=8 layout correctly', () => {
    const result = segmentLayout(3, 36, 8, 50);
    expect(result).toHaveLength(3);
    expect(result[0].x).toBe(50);
    expect(result[1].x).toBe(50 + 44); // 50 + (36+8)
    expect(result[2].x).toBe(50 + 88); // 50 + 2*(36+8)
  });

  it('5 segments match PauseOverlay volume bar layout', () => {
    const segW = 36;
    const gap = 8;
    const startX = 200;
    const result = segmentLayout(5, segW, gap, startX);
    expect(result).toHaveLength(5);

    // Total width: 5 * 36 + 4 * 8 = 180 + 32 = 212
    const rightEdge = result[4].x + result[4].width;
    expect(rightEdge - startX).toBe(5 * segW + 4 * gap);
  });

  it('zero gap places segments adjacent', () => {
    const result = segmentLayout(3, 40, 0, 0);
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBe(40);
    expect(result[2].x).toBe(80);
  });

  it('can detect overflow against panel boundary (M-013)', () => {
    const panelRight = 440;
    const startX = 200;
    const result = segmentLayout(5, 36, 8, startX);
    const rightEdge = result[result.length - 1].x + result[result.length - 1].width;
    // 200 + 5*36 + 4*8 = 200 + 212 = 412, within 440
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
  });

  it('detects when segments exceed boundary', () => {
    const panelRight = 400;
    const startX = 200;
    const result = segmentLayout(5, 36, 8, startX);
    const rightEdge = result[result.length - 1].x + result[result.length - 1].width;
    // 200 + 212 = 412 > 400
    expect(rightEdge).toBeGreaterThan(panelRight);
  });

  // === TASK-093: PauseOverlay / SettingsOverlay integration tests ===

  it('PauseOverlay 5-segment layout fits within panel width 440 (M-013)', () => {
    // PauseOverlay: panel cx=360, width=440 -> left=140, right=580
    const panelCx = 720 / 2; // GAME_WIDTH / 2
    const panelW = 440;
    const panelLeft = panelCx - panelW / 2; // 140
    const panelRight = panelCx + panelW / 2; // 580
    const segStartX = panelCx - 20; // 340
    const result = segmentLayout(5, 36, 8, segStartX);
    const rightEdge = result[result.length - 1].x + result[result.length - 1].width;
    // rightEdge = 340 + 212 = 552, panelRight = 580
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
    expect(result[0].x).toBeGreaterThanOrEqual(panelLeft);
  });

  it('SettingsOverlay 5-segment layout fits within panel width 440 (M-013)', () => {
    // SettingsOverlay: panel cx=360, width=440 -> left=140, right=580
    const panelCx = 720 / 2;
    const panelW = 440;
    const panelLeft = panelCx - panelW / 2; // 140
    const panelRight = panelCx + panelW / 2; // 580
    const segStartX = panelCx - 4; // 356
    const result = segmentLayout(5, 36, 8, segStartX);
    const rightEdge = result[result.length - 1].x + result[result.length - 1].width;
    // rightEdge = 356 + 212 = 568, panelRight = 580
    expect(rightEdge).toBeLessThanOrEqual(panelRight);
    expect(result[0].x).toBeGreaterThanOrEqual(panelLeft);
  });

  it('PauseOverlay segments have correct individual positions', () => {
    const segStartX = 720 / 2 - 20; // 340
    const result = segmentLayout(5, 36, 8, segStartX);
    expect(result[0]).toEqual({ x: 340, width: 36 });
    expect(result[1]).toEqual({ x: 384, width: 36 });
    expect(result[2]).toEqual({ x: 428, width: 36 });
    expect(result[3]).toEqual({ x: 472, width: 36 });
    expect(result[4]).toEqual({ x: 516, width: 36 });
  });

  it('SettingsOverlay segments have correct individual positions', () => {
    const segStartX = 720 / 2 - 4; // 356
    const result = segmentLayout(5, 36, 8, segStartX);
    expect(result[0]).toEqual({ x: 356, width: 36 });
    expect(result[1]).toEqual({ x: 400, width: 36 });
    expect(result[2]).toEqual({ x: 444, width: 36 });
    expect(result[3]).toEqual({ x: 488, width: 36 });
    expect(result[4]).toEqual({ x: 532, width: 36 });
  });

  it('total segment span matches expected formula: count*segW + (count-1)*gap', () => {
    const count = 5;
    const segW = 36;
    const gap = 8;
    const startX = 100;
    const result = segmentLayout(count, segW, gap, startX);
    const totalSpan = result[result.length - 1].x + result[result.length - 1].width - result[0].x;
    const expected = count * segW + (count - 1) * gap; // 212
    expect(totalSpan).toBe(expected);
  });

  it('segment center X values are evenly spaced', () => {
    const result = segmentLayout(5, 36, 8, 100);
    const stride = 36 + 8; // 44
    for (let i = 1; i < result.length; i++) {
      expect(result[i].x - result[i - 1].x).toBe(stride);
    }
  });
});

// =======================================================================
// isWithinViewport
// =======================================================================
describe('isWithinViewport', () => {
  const VP_W = 720;
  const VP_H = 1280;

  it('fully inside viewport returns true', () => {
    expect(isWithinViewport(100, 200, 200, 300, VP_W, VP_H)).toBe(true);
  });

  it('at origin with small rect returns true', () => {
    expect(isWithinViewport(0, 0, 100, 100, VP_W, VP_H)).toBe(true);
  });

  it('exact fit to viewport returns true', () => {
    expect(isWithinViewport(0, 0, VP_W, VP_H, VP_W, VP_H)).toBe(true);
  });

  it('partially outside right edge returns false', () => {
    expect(isWithinViewport(700, 0, 100, 100, VP_W, VP_H)).toBe(false);
  });

  it('partially outside bottom edge returns false', () => {
    expect(isWithinViewport(0, 1200, 100, 200, VP_W, VP_H)).toBe(false);
  });

  it('negative x (left overflow) returns false', () => {
    expect(isWithinViewport(-10, 100, 200, 300, VP_W, VP_H)).toBe(false);
  });

  it('negative y (top overflow) returns false', () => {
    expect(isWithinViewport(100, -5, 200, 300, VP_W, VP_H)).toBe(false);
  });

  it('fully outside (far right) returns false', () => {
    expect(isWithinViewport(800, 100, 200, 300, VP_W, VP_H)).toBe(false);
  });

  it('fully outside (below viewport) returns false', () => {
    expect(isWithinViewport(100, 1400, 200, 300, VP_W, VP_H)).toBe(false);
  });

  it('zero-size element at valid position returns true', () => {
    expect(isWithinViewport(360, 640, 0, 0, VP_W, VP_H)).toBe(true);
  });
});

// =======================================================================
// roundedRectPoints
// =======================================================================
describe('roundedRectPoints', () => {
  it('returns 4 corner points', () => {
    const { corners } = roundedRectPoints(0, 0, 200, 100, 10);
    expect(corners).toHaveLength(4);
  });

  it('corner positions for standard rect', () => {
    const { corners } = roundedRectPoints(50, 100, 200, 100, 12);
    // top-left: (50+12, 100+12) = (62, 112)
    expect(corners[0]).toEqual([62, 112]);
    // top-right: (50+200-12, 100+12) = (238, 112)
    expect(corners[1]).toEqual([238, 112]);
    // bottom-right: (238, 100+100-12) = (238, 188)
    expect(corners[2]).toEqual([238, 188]);
    // bottom-left: (62, 188)
    expect(corners[3]).toEqual([62, 188]);
  });

  it('zero radius puts corners at exact rect corners', () => {
    const { corners } = roundedRectPoints(10, 20, 100, 50, 0);
    expect(corners[0]).toEqual([10, 20]); // top-left
    expect(corners[1]).toEqual([110, 20]); // top-right
    expect(corners[2]).toEqual([110, 70]); // bottom-right
    expect(corners[3]).toEqual([10, 70]); // bottom-left
  });

  it('radius clamped to half width when radius > w/2', () => {
    // w=100, h=200, radius=80 -> clamped to 50 (w/2)
    const { corners } = roundedRectPoints(0, 0, 100, 200, 80);
    expect(corners[0]).toEqual([50, 50]);
    expect(corners[1]).toEqual([50, 50]); // top-right merges with top-left at half-width
  });

  it('radius clamped to half height when radius > h/2', () => {
    // w=200, h=60, radius=40 -> clamped to 30 (h/2)
    const { corners } = roundedRectPoints(0, 0, 200, 60, 40);
    expect(corners[0]).toEqual([30, 30]);
    expect(corners[1]).toEqual([170, 30]);
    expect(corners[2]).toEqual([170, 30]); // bottom-right meets top-right
    expect(corners[3]).toEqual([30, 30]); // bottom-left meets top-left
  });

  it('negative radius treated as 0', () => {
    const { corners } = roundedRectPoints(0, 0, 100, 100, -10);
    expect(corners[0]).toEqual([0, 0]);
    expect(corners[1]).toEqual([100, 0]);
    expect(corners[2]).toEqual([100, 100]);
    expect(corners[3]).toEqual([0, 100]);
  });

  it('square rect with radius = half-side', () => {
    // 100x100, radius=50 -> full circle corners
    const { corners } = roundedRectPoints(0, 0, 100, 100, 50);
    expect(corners[0]).toEqual([50, 50]);
    expect(corners[1]).toEqual([50, 50]);
    expect(corners[2]).toEqual([50, 50]);
    expect(corners[3]).toEqual([50, 50]);
  });
});

// =======================================================================
// TASK-108: findActiveLevel
// =======================================================================
describe('findActiveLevel', () => {
  const levels = [0, 0.25, 0.5, 0.75, 1.0];

  it('exact match returns that index', () => {
    expect(findActiveLevel(levels, 0.5)).toBe(2);
  });

  it('between two levels picks first >=', () => {
    // 0.3 is between levels[1]=0.25 and levels[2]=0.5, first >= is index 2
    expect(findActiveLevel(levels, 0.3)).toBe(2);
  });

  it('below all levels returns index 0', () => {
    // -0.1 is below levels[0]=0, first >= is index 0
    expect(findActiveLevel(levels, -0.1)).toBe(0);
  });

  it('above all levels returns last index', () => {
    // 1.5 is above levels[4]=1.0, no match -> last index
    expect(findActiveLevel(levels, 1.5)).toBe(4);
  });

  it('empty array returns -1', () => {
    expect(findActiveLevel([], 0.5)).toBe(-1);
  });
});

// =======================================================================
// TASK-108: shouldAutoMute
// =======================================================================
describe('shouldAutoMute', () => {
  it('vol=0 and not muted returns true (should mute)', () => {
    expect(shouldAutoMute(0, false)).toBe(true);
  });

  it('vol=0 and already muted returns false (already muted)', () => {
    expect(shouldAutoMute(0, true)).toBe(false);
  });

  it('vol>0 and not muted returns false (no action needed)', () => {
    expect(shouldAutoMute(0.5, false)).toBe(false);
  });
});

// =======================================================================
// TASK-108: shouldAutoUnmute
// =======================================================================
describe('shouldAutoUnmute', () => {
  it('vol>0 and muted returns true (should unmute)', () => {
    expect(shouldAutoUnmute(0.75, true)).toBe(true);
  });

  it('vol=0 and muted returns false (stay muted)', () => {
    expect(shouldAutoUnmute(0, true)).toBe(false);
  });

  it('vol>0 and not muted returns false (already unmuted)', () => {
    expect(shouldAutoUnmute(0.5, false)).toBe(false);
  });
});

// =======================================================================
// TASK-110: calculateProgressFraction
// =======================================================================
describe('calculateProgressFraction', () => {
  it('target=0 returns 0 (avoid division by zero)', () => {
    expect(calculateProgressFraction(50, 0)).toBe(0);
  });

  it('current < target returns correct fraction', () => {
    expect(calculateProgressFraction(30, 100)).toBeCloseTo(0.3);
  });

  it('current = target returns 1', () => {
    expect(calculateProgressFraction(100, 100)).toBe(1);
  });

  it('current > target is capped at 1', () => {
    expect(calculateProgressFraction(150, 100)).toBe(1);
  });

  it('negative target returns 0', () => {
    expect(calculateProgressFraction(50, -10)).toBe(0);
  });

  it('negative current is clamped to 0 (RedTeam UIC-07)', () => {
    expect(calculateProgressFraction(-10, 100)).toBe(0);
  });
});

// =======================================================================
// TASK-110: calculateProgressFillWidth
// =======================================================================
describe('calculateProgressFillWidth', () => {
  it('fraction=0 returns 0', () => {
    expect(calculateProgressFillWidth(0, 200)).toBe(0);
  });

  it('fraction=0.5 with barWidth=200 returns 100', () => {
    expect(calculateProgressFillWidth(0.5, 200)).toBe(100);
  });

  it('very small fraction returns default minWidth (4)', () => {
    // fraction=0.001, barWidth=200 -> 0.2 < 4 -> returns 4
    expect(calculateProgressFillWidth(0.001, 200)).toBe(4);
  });

  it('fraction=1.0 returns full barWidth', () => {
    expect(calculateProgressFillWidth(1.0, 300)).toBe(300);
  });

  it('custom minWidth overrides default', () => {
    // fraction=0.001, barWidth=200 -> 0.2 < 8 -> returns 8
    expect(calculateProgressFillWidth(0.001, 200, 8)).toBe(8);
  });

  it('negative fraction returns 0', () => {
    expect(calculateProgressFillWidth(-0.5, 200)).toBe(0);
  });
});
