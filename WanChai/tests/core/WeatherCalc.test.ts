import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../src/core/SeededRandom';
import {
  calculateFlameZonePosition,
  calculateLightningPath,
  calculateFogMaskRects,
  calculateFogRings,
  getWeatherModifiers,
  type WeatherConfig,
  type RNG,
} from '../../src/core/WeatherCalc';

// Fixed RNG that always returns a known value
function fixedRng(value: number): RNG {
  return { next: () => value };
}

const GAME_W = 720;
const GAME_H = 1280;

// ==================== Flame Zone Boundary Tests ====================
describe('calculateFlameZonePosition', () => {
  it('clamps X within [radius, gameWidth - radius] when rng=0', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, fixedRng(0));
    expect(pos.x).toBe(60); // radius + 0 * (720 - 120) = 60
  });

  it('clamps X to max boundary when rng=1 (approx)', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, fixedRng(0.999));
    expect(pos.x).toBeCloseTo(60 + 0.999 * (GAME_W - 120), 0);
    expect(pos.x).toBeLessThanOrEqual(GAME_W - 60);
  });

  it('produces Y within [spawnYMin, spawnYMin + spawnYRange]', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, fixedRng(0.5));
    expect(pos.y).toBeCloseTo(200 + 0.5 * 600); // 500
  });

  it('returns Y=spawnYMin when rng=0', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, fixedRng(0));
    expect(pos.y).toBe(200);
  });

  it('deterministic with SeededRandom', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);
    const pos1 = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, rng1);
    const pos2 = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, rng2);
    expect(pos1.x).toBe(pos2.x);
    expect(pos1.y).toBe(pos2.y);
  });

  it('different seeds give different positions', () => {
    const pos1 = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, new SeededRandom(1));
    const pos2 = calculateFlameZonePosition(GAME_W, GAME_H, 60, 200, 600, new SeededRandom(999));
    // Very unlikely to be exactly equal with different seeds
    const samePosition = pos1.x === pos2.x && pos1.y === pos2.y;
    expect(samePosition).toBe(false);
  });

  it('works with zero radius', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 0, 200, 600, fixedRng(0.5));
    expect(pos.x).toBeCloseTo(0.5 * GAME_W);
  });

  it('handles large radius that nearly fills width', () => {
    const pos = calculateFlameZonePosition(GAME_W, GAME_H, 350, 200, 600, fixedRng(0.5));
    // radius=350, gameWidth=720, available range = 720 - 700 = 20
    expect(pos.x).toBeCloseTo(350 + 0.5 * 20); // 360
  });
});

// ==================== Lightning Path Geometry Tests ====================
describe('calculateLightningPath', () => {
  it('starts at (startX, 0)', () => {
    const path = calculateLightningPath(100, 200, 500, 5, 30, fixedRng(0.5));
    expect(path[0]).toEqual({ x: 100, y: 0 });
  });

  it('ends at (endX, endY)', () => {
    const path = calculateLightningPath(100, 200, 500, 5, 30, fixedRng(0.5));
    const last = path[path.length - 1];
    expect(last).toEqual({ x: 200, y: 500 });
  });

  it('has correct number of points (segments + 1)', () => {
    const path = calculateLightningPath(100, 200, 500, 5, 30, fixedRng(0.5));
    // start + (segments - 1) intermediate + end = segments + 1
    expect(path).toHaveLength(5 + 1);
  });

  it('intermediate Y values increase monotonically', () => {
    const path = calculateLightningPath(100, 200, 500, 8, 30, fixedRng(0.5));
    for (let i = 1; i < path.length; i++) {
      expect(path[i].y).toBeGreaterThanOrEqual(path[i - 1].y);
    }
  });

  it('intermediate X jitters around endX', () => {
    const rng = new SeededRandom(12345);
    const path = calculateLightningPath(100, 360, 800, 10, 60, rng);
    // Check intermediate points are within jitter range of endX
    for (let i = 1; i < path.length - 1; i++) {
      expect(path[i].x).toBeGreaterThanOrEqual(360 - 30); // endX - jitter/2
      expect(path[i].x).toBeLessThanOrEqual(360 + 30); // endX + jitter/2
    }
  });

  it('with 1 segment returns just start and end', () => {
    const path = calculateLightningPath(50, 200, 600, 1, 30, fixedRng(0.5));
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual({ x: 50, y: 0 });
    expect(path[1]).toEqual({ x: 200, y: 600 });
  });

  it('deterministic with same seed', () => {
    const path1 = calculateLightningPath(100, 300, 700, 6, 40, new SeededRandom(42));
    const path2 = calculateLightningPath(100, 300, 700, 6, 40, new SeededRandom(42));
    expect(path1).toEqual(path2);
  });

  it('zero jitter produces straight vertical line at endX', () => {
    const path = calculateLightningPath(300, 300, 600, 5, 0, new SeededRandom(99));
    for (let i = 1; i < path.length; i++) {
      expect(path[i].x).toBe(300);
    }
  });
});

// ==================== Fog Mask Rectangles Tests ====================
describe('calculateFogMaskRects', () => {
  it('returns exactly 4 rectangles', () => {
    const rects = calculateFogMaskRects(360, 640, 300, GAME_W, GAME_H);
    expect(rects).toHaveLength(4);
  });

  it('top rect covers from y=0 to playerY-fogR', () => {
    const rects = calculateFogMaskRects(360, 640, 300, GAME_W, GAME_H);
    const top = rects[0];
    expect(top.x).toBe(0);
    expect(top.y).toBe(0);
    expect(top.w).toBe(GAME_W);
    expect(top.h).toBe(640 - 300); // 340
  });

  it('bottom rect covers from playerY+fogR to bottom', () => {
    const rects = calculateFogMaskRects(360, 640, 300, GAME_W, GAME_H);
    const bottom = rects[1];
    expect(bottom.x).toBe(0);
    expect(bottom.y).toBe(640 + 300); // 940
    expect(bottom.w).toBe(GAME_W);
    expect(bottom.h).toBe(GAME_H - 640 - 300); // 340
  });

  it('left rect covers left side at mid band', () => {
    const rects = calculateFogMaskRects(360, 640, 300, GAME_W, GAME_H);
    const left = rects[2];
    expect(left.x).toBe(0);
    expect(left.y).toBe(640 - 300); // 340
    expect(left.w).toBe(360 - 300); // 60
    expect(left.h).toBe(300 * 2); // 600
  });

  it('right rect covers right side at mid band', () => {
    const rects = calculateFogMaskRects(360, 640, 300, GAME_W, GAME_H);
    const right = rects[3];
    expect(right.x).toBe(360 + 300); // 660
    expect(right.y).toBe(640 - 300); // 340
    expect(right.w).toBe(GAME_W - 360 - 300); // 60
    expect(right.h).toBe(300 * 2); // 600
  });

  it('clamps to zero when player near top edge (playerY < fogR)', () => {
    const rects = calculateFogMaskRects(360, 100, 300, GAME_W, GAME_H);
    const top = rects[0];
    expect(top.h).toBe(0); // max(0, 100-300) = 0
  });

  it('clamps to zero when player near left edge (playerX < fogR)', () => {
    const rects = calculateFogMaskRects(50, 640, 300, GAME_W, GAME_H);
    const left = rects[2];
    expect(left.w).toBe(0); // max(0, 50-300) = 0
  });

  it('handles player at screen center with concrete values', () => {
    const cx = GAME_W / 2; // 360
    const cy = GAME_H / 2; // 640
    const fogR = 200;
    const rects = calculateFogMaskRects(cx, cy, fogR, GAME_W, GAME_H);
    // Top strip: full width, from y=0 to y=cy-fogR=440
    expect(rects[0]).toEqual({ x: 0, y: 0, w: GAME_W, h: cy - fogR });
    // Bottom strip: full width, from y=cy+fogR=840 to bottom
    expect(rects[1]).toEqual({ x: 0, y: cy + fogR, w: GAME_W, h: GAME_H - (cy + fogR) });
    // Left strip: from y=cy-fogR to y=cy+fogR, width=cx-fogR=160
    expect(rects[2]).toEqual({ x: 0, y: cy - fogR, w: cx - fogR, h: fogR * 2 });
    // Right strip: from x=cx+fogR=560 to right edge
    expect(rects[3]).toEqual({ x: cx + fogR, y: cy - fogR, w: GAME_W - (cx + fogR), h: fogR * 2 });
  });
});

// ==================== Fog Rings (Concentric Circle) Tests ====================
describe('calculateFogRings', () => {
  const fogR = 300;
  const alphaMax = 0.65;
  const alphaMin = 0.02;
  const ringCount = 8;

  it('returns rings with decreasing radius (outer to inner)', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    expect(rings.length).toBeGreaterThan(0);
    for (let i = 1; i < rings.length; i++) {
      expect(rings[i].radius).toBeLessThan(rings[i - 1].radius);
    }
  });

  it('returns rings with decreasing alpha (outer to inner)', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    for (let i = 1; i < rings.length; i++) {
      expect(rings[i].alpha).toBeLessThan(rings[i - 1].alpha);
    }
  });

  it('outermost ring alpha equals alphaMax', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    expect(rings[0].alpha).toBeCloseTo(alphaMax);
  });

  it('innermost ring radius is >= fogRadius', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    const last = rings[rings.length - 1];
    expect(last.radius).toBeGreaterThanOrEqual(fogR);
  });

  it('all rings share the player position as center', () => {
    const rings = calculateFogRings(200, 400, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    for (const ring of rings) {
      expect(ring.cx).toBe(200);
      expect(ring.cy).toBe(400);
    }
  });

  it('skips rings below alphaMin threshold', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    for (const ring of rings) {
      expect(ring.alpha).toBeGreaterThanOrEqual(alphaMin);
    }
  });

  it('returns empty array when alphaMax is below alphaMin', () => {
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, ringCount, 0.01, 0.02);
    expect(rings).toHaveLength(0);
  });

  it('returns correct count when no rings are filtered out', () => {
    // With high alphaMax and low alphaMin, most rings should survive
    const rings = calculateFogRings(360, 640, fogR, GAME_W, GAME_H, 4, 1.0, 0.0);
    expect(rings).toHaveLength(4);
  });

  it('handles player at corner (0, 0)', () => {
    const rings = calculateFogRings(0, 0, fogR, GAME_W, GAME_H, ringCount, alphaMax, alphaMin);
    expect(rings.length).toBeGreaterThan(0);
    // Outermost radius should reach the far corner
    const maxExpected = Math.sqrt(GAME_W ** 2 + GAME_H ** 2);
    expect(rings[0].radius).toBeCloseTo(maxExpected, 0);
  });
});

// ==================== Weather Modifiers Tests ====================
describe('getWeatherModifiers', () => {
  const config: WeatherConfig = {
    speedAllBonus: 0.1,
    rainEnemySpeedMult: 0.85,
    armorAllBonus: 0.15,
    critAllBonus: 0.15,
    shieldRegenHpPerSec: 2,
  };

  it('speed_all applies speed multiplier', () => {
    const mods = getWeatherModifiers('speed_all', config);
    expect(mods.speedMult).toBeCloseTo(1.1);
    expect(mods.armorMult).toBe(1);
    expect(mods.critBonus).toBe(0);
    expect(mods.enemySpeedMult).toBe(1);
    expect(mods.baseRegenPerSec).toBe(0);
  });

  it('rain applies enemy speed reduction', () => {
    const mods = getWeatherModifiers('rain', config);
    expect(mods.enemySpeedMult).toBeCloseTo(0.85);
    expect(mods.speedMult).toBe(1);
  });

  it('armor_all applies armor multiplier', () => {
    const mods = getWeatherModifiers('armor_all', config);
    expect(mods.armorMult).toBeCloseTo(1.15);
  });

  it('crit_all applies crit bonus', () => {
    const mods = getWeatherModifiers('crit_all', config);
    expect(mods.critBonus).toBeCloseTo(0.15);
  });

  it('shield_regen applies base regen', () => {
    const mods = getWeatherModifiers('shield_regen', config);
    expect(mods.baseRegenPerSec).toBe(2);
  });

  it('unknown weather returns neutral modifiers', () => {
    const mods = getWeatherModifiers('nonexistent', config);
    expect(mods.speedMult).toBe(1);
    expect(mods.armorMult).toBe(1);
    expect(mods.critBonus).toBe(0);
    expect(mods.enemySpeedMult).toBe(1);
    expect(mods.baseRegenPerSec).toBe(0);
  });

  it('fog returns neutral modifiers (visual only)', () => {
    const mods = getWeatherModifiers('fog', config);
    expect(mods.speedMult).toBe(1);
    expect(mods.armorMult).toBe(1);
  });

  it('flame_zones returns neutral modifiers (damage only)', () => {
    const mods = getWeatherModifiers('flame_zones', config);
    expect(mods.speedMult).toBe(1);
  });
});
