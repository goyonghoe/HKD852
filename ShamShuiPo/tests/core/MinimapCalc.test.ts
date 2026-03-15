// ── Tests: MinimapCalc ──

import { describe, it, expect } from "vitest";
import {
  createMinimap,
  addMarker,
  removeMarker,
  updateMarkerPosition,
  updateCamera,
  worldToMinimap,
  isInViewport,
  getVisibleMarkers,
  getMarkersByType,
  setMarkerVisibility,
  clearMarkers,
  getMarkerCount,
  getDefaultMinimapConfig,
  getEnemyDots,
} from "../../src/core/MinimapCalc";
import type {
  MinimapConfig,
  MinimapMarker,
  MinimapState,
} from "../../src/core/MinimapCalc";

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

const defaultConfig: MinimapConfig = {
  worldWidth: 2000,
  worldHeight: 2000,
  minimapWidth: 200,
  minimapHeight: 200,
  size: 200,
  centerX: 660,
  centerY: 60,
};

function makeMarker(overrides: Partial<MinimapMarker> = {}): MinimapMarker {
  return {
    id: "m1",
    worldX: 100,
    worldY: 100,
    type: "enemy",
    color: "#ff0000",
    visible: true,
    ...overrides,
  };
}

function stateWithCamera(
  cameraX = 0,
  cameraY = 0,
  cameraWidth = 800,
  cameraHeight = 600,
): MinimapState {
  return updateCamera(
    createMinimap(defaultConfig),
    cameraX,
    cameraY,
    cameraWidth,
    cameraHeight,
  );
}

// ════════════════════════════════════════════════════════════════
// § createMinimap
// ════════════════════════════════════════════════════════════════

describe("createMinimap", () => {
  it("returns state with given config", () => {
    const s = createMinimap(defaultConfig);
    expect(s.config).toEqual(defaultConfig);
  });

  it("initializes with empty markers array", () => {
    const s = createMinimap(defaultConfig);
    expect(s.markers).toEqual([]);
  });

  it("initializes camera at 0,0 with 0 dimensions", () => {
    const s = createMinimap(defaultConfig);
    expect(s.cameraX).toBe(0);
    expect(s.cameraY).toBe(0);
    expect(s.cameraWidth).toBe(0);
    expect(s.cameraHeight).toBe(0);
  });

  it("does not mutate the config object passed in", () => {
    const cfg = { ...defaultConfig };
    const s = createMinimap(cfg);
    cfg.worldWidth = 9999;
    expect(s.config.worldWidth).toBe(2000);
  });

  it("stores all config fields including size, centerX, centerY", () => {
    const s = createMinimap(defaultConfig);
    expect(s.config.size).toBe(200);
    expect(s.config.centerX).toBe(660);
    expect(s.config.centerY).toBe(60);
  });
});

// ════════════════════════════════════════════════════════════════
// § addMarker
// ════════════════════════════════════════════════════════════════

describe("addMarker", () => {
  it("adds a marker to the state", () => {
    const s = createMinimap(defaultConfig);
    const s2 = addMarker(s, makeMarker());
    expect(s2.markers).toHaveLength(1);
    expect(s2.markers[0].id).toBe("m1");
  });

  it("does not mutate original state (immutability)", () => {
    const s = createMinimap(defaultConfig);
    addMarker(s, makeMarker());
    expect(s.markers).toHaveLength(0);
  });

  it("can add multiple markers", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    s = addMarker(s, makeMarker({ id: "b" }));
    s = addMarker(s, makeMarker({ id: "c" }));
    expect(s.markers).toHaveLength(3);
  });

  it("preserves existing markers when adding", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "first" }));
    s = addMarker(s, makeMarker({ id: "second" }));
    expect(s.markers[0].id).toBe("first");
    expect(s.markers[1].id).toBe("second");
  });

  it("preserves camera state when adding markers", () => {
    let s = stateWithCamera(10, 20, 800, 600);
    s = addMarker(s, makeMarker());
    expect(s.cameraX).toBe(10);
    expect(s.cameraY).toBe(20);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeMarker
// ════════════════════════════════════════════════════════════════

describe("removeMarker", () => {
  it("removes a marker by id", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "x" }));
    s = addMarker(s, makeMarker({ id: "y" }));
    s = removeMarker(s, "x");
    expect(s.markers).toHaveLength(1);
    expect(s.markers[0].id).toBe("y");
  });

  it("does not mutate original state", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "x" }));
    const before = s;
    removeMarker(s, "x");
    expect(before.markers).toHaveLength(1);
  });

  it("returns same-length markers if id not found", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "x" }));
    const s2 = removeMarker(s, "nonexistent");
    expect(s2.markers).toHaveLength(1);
  });

  it("removes all with same id when duplicates exist", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "dup" }));
    s = addMarker(s, makeMarker({ id: "dup" }));
    s = removeMarker(s, "dup");
    expect(s.markers).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateMarkerPosition
// ════════════════════════════════════════════════════════════════

describe("updateMarkerPosition", () => {
  it("updates worldX and worldY of a marker", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "p", worldX: 0, worldY: 0 }));
    const s2 = updateMarkerPosition(s, "p", 500, 700);
    expect(s2.markers[0].worldX).toBe(500);
    expect(s2.markers[0].worldY).toBe(700);
  });

  it("does not mutate original state", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "p", worldX: 0, worldY: 0 }));
    updateMarkerPosition(s, "p", 500, 700);
    expect(s.markers[0].worldX).toBe(0);
  });

  it("only updates the targeted marker", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a", worldX: 10, worldY: 10 }));
    s = addMarker(s, makeMarker({ id: "b", worldX: 20, worldY: 20 }));
    const s2 = updateMarkerPosition(s, "a", 999, 999);
    expect(s2.markers[0].worldX).toBe(999);
    expect(s2.markers[1].worldX).toBe(20);
  });

  it("preserves other marker properties", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "p", color: "#00ff00", type: "boss" }));
    const s2 = updateMarkerPosition(s, "p", 1, 2);
    expect(s2.markers[0].color).toBe("#00ff00");
    expect(s2.markers[0].type).toBe("boss");
  });

  it("returns unchanged state if id not found", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    const s2 = updateMarkerPosition(s, "missing", 1, 2);
    expect(s2.markers[0].worldX).toBe(s.markers[0].worldX);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateCamera
// ════════════════════════════════════════════════════════════════

describe("updateCamera", () => {
  it("sets all camera properties", () => {
    const s = updateCamera(createMinimap(defaultConfig), 50, 100, 800, 600);
    expect(s.cameraX).toBe(50);
    expect(s.cameraY).toBe(100);
    expect(s.cameraWidth).toBe(800);
    expect(s.cameraHeight).toBe(600);
  });

  it("does not mutate original state", () => {
    const s = createMinimap(defaultConfig);
    updateCamera(s, 50, 100, 800, 600);
    expect(s.cameraX).toBe(0);
  });

  it("preserves markers when updating camera", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "keep" }));
    const s2 = updateCamera(s, 10, 20, 30, 40);
    expect(s2.markers).toHaveLength(1);
    expect(s2.markers[0].id).toBe("keep");
  });

  it("preserves config when updating camera", () => {
    const s = createMinimap(defaultConfig);
    const s2 = updateCamera(s, 10, 20, 30, 40);
    expect(s2.config).toEqual(defaultConfig);
  });
});

// ════════════════════════════════════════════════════════════════
// § worldToMinimap
// ════════════════════════════════════════════════════════════════

describe("worldToMinimap", () => {
  it("converts world origin to minimap origin", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 0, 0);
    expect(minimapX).toBe(0);
    expect(minimapY).toBe(0);
  });

  it("converts world center to minimap center", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 1000, 1000);
    expect(minimapX).toBe(100);
    expect(minimapY).toBe(100);
  });

  it("converts bottom-right world corner to bottom-right minimap corner", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 2000, 2000);
    expect(minimapX).toBe(200);
    expect(minimapY).toBe(200);
  });

  it("scales correctly with non-square configs", () => {
    const cfg: MinimapConfig = {
      worldWidth: 4000,
      worldHeight: 2000,
      minimapWidth: 200,
      minimapHeight: 100,
      size: 200,
      centerX: 660,
      centerY: 60,
    };
    const s = createMinimap(cfg);
    const { minimapX, minimapY } = worldToMinimap(s, 2000, 1000);
    expect(minimapX).toBe(100);
    expect(minimapY).toBe(50);
  });

  it("handles fractional world positions", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 500, 500);
    expect(minimapX).toBeCloseTo(50, 5);
    expect(minimapY).toBeCloseTo(50, 5);
  });

  it("handles negative world coordinates", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, -200, -200);
    expect(minimapX).toBeCloseTo(-20, 5);
    expect(minimapY).toBeCloseTo(-20, 5);
  });

  it("handles coordinates beyond world bounds", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 3000, 3000);
    expect(minimapX).toBeCloseTo(300, 5);
    expect(minimapY).toBeCloseTo(300, 5);
  });

  it("handles quarter-world position", () => {
    const s = createMinimap(defaultConfig);
    const { minimapX, minimapY } = worldToMinimap(s, 500, 1500);
    expect(minimapX).toBeCloseTo(50, 5);
    expect(minimapY).toBeCloseTo(150, 5);
  });
});

// ════════════════════════════════════════════════════════════════
// § isInViewport
// ════════════════════════════════════════════════════════════════

describe("isInViewport", () => {
  it("returns true for point inside viewport", () => {
    const s = stateWithCamera(0, 0, 800, 600);
    expect(isInViewport(s, 400, 300)).toBe(true);
  });

  it("returns false for point outside viewport (right)", () => {
    const s = stateWithCamera(0, 0, 800, 600);
    expect(isInViewport(s, 801, 300)).toBe(false);
  });

  it("returns false for point outside viewport (below)", () => {
    const s = stateWithCamera(0, 0, 800, 600);
    expect(isInViewport(s, 400, 601)).toBe(false);
  });

  it("returns false for point outside viewport (left)", () => {
    const s = stateWithCamera(100, 0, 800, 600);
    expect(isInViewport(s, 99, 300)).toBe(false);
  });

  it("returns false for point outside viewport (above)", () => {
    const s = stateWithCamera(0, 100, 800, 600);
    expect(isInViewport(s, 400, 99)).toBe(false);
  });

  it("returns true for point on the edge (top-left)", () => {
    const s = stateWithCamera(100, 100, 800, 600);
    expect(isInViewport(s, 100, 100)).toBe(true);
  });

  it("returns true for point on the edge (bottom-right)", () => {
    const s = stateWithCamera(100, 100, 800, 600);
    expect(isInViewport(s, 900, 700)).toBe(true);
  });

  it("handles offset camera position", () => {
    const s = stateWithCamera(500, 500, 200, 200);
    expect(isInViewport(s, 600, 600)).toBe(true);
    expect(isInViewport(s, 499, 600)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getVisibleMarkers
// ════════════════════════════════════════════════════════════════

describe("getVisibleMarkers", () => {
  it("returns markers inside the camera viewport", () => {
    let s = stateWithCamera(0, 0, 800, 600);
    s = addMarker(s, makeMarker({ id: "in", worldX: 100, worldY: 100 }));
    s = addMarker(s, makeMarker({ id: "out", worldX: 900, worldY: 900 }));
    const visible = getVisibleMarkers(s);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("in");
  });

  it("excludes markers with visible=false even if in viewport", () => {
    let s = stateWithCamera(0, 0, 800, 600);
    s = addMarker(
      s,
      makeMarker({ id: "hidden", worldX: 100, worldY: 100, visible: false }),
    );
    expect(getVisibleMarkers(s)).toHaveLength(0);
  });

  it("returns empty when no markers exist", () => {
    const s = stateWithCamera(0, 0, 800, 600);
    expect(getVisibleMarkers(s)).toEqual([]);
  });

  it("returns all markers when all are in viewport and visible", () => {
    let s = stateWithCamera(0, 0, 1000, 1000);
    s = addMarker(s, makeMarker({ id: "a", worldX: 100, worldY: 100 }));
    s = addMarker(s, makeMarker({ id: "b", worldX: 200, worldY: 200 }));
    s = addMarker(s, makeMarker({ id: "c", worldX: 300, worldY: 300 }));
    expect(getVisibleMarkers(s)).toHaveLength(3);
  });

  it("returns empty when all markers are outside viewport", () => {
    let s = stateWithCamera(0, 0, 100, 100);
    s = addMarker(s, makeMarker({ id: "far", worldX: 500, worldY: 500 }));
    expect(getVisibleMarkers(s)).toHaveLength(0);
  });

  it("includes markers on viewport boundary", () => {
    let s = stateWithCamera(0, 0, 100, 100);
    s = addMarker(s, makeMarker({ id: "edge", worldX: 100, worldY: 100 }));
    expect(getVisibleMarkers(s)).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMarkersByType
// ════════════════════════════════════════════════════════════════

describe("getMarkersByType", () => {
  it("returns only markers of the specified type", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "e1", type: "enemy" }));
    s = addMarker(s, makeMarker({ id: "p1", type: "player" }));
    s = addMarker(s, makeMarker({ id: "e2", type: "enemy" }));
    const enemies = getMarkersByType(s, "enemy");
    expect(enemies).toHaveLength(2);
    expect(enemies.every((m) => m.type === "enemy")).toBe(true);
  });

  it("returns empty array when no markers of type exist", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "e1", type: "enemy" }));
    expect(getMarkersByType(s, "boss")).toEqual([]);
  });

  it("filters all five marker types correctly", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "1", type: "player" }));
    s = addMarker(s, makeMarker({ id: "2", type: "enemy" }));
    s = addMarker(s, makeMarker({ id: "3", type: "boss" }));
    s = addMarker(s, makeMarker({ id: "4", type: "item" }));
    s = addMarker(s, makeMarker({ id: "5", type: "objective" }));
    expect(getMarkersByType(s, "player")).toHaveLength(1);
    expect(getMarkersByType(s, "enemy")).toHaveLength(1);
    expect(getMarkersByType(s, "boss")).toHaveLength(1);
    expect(getMarkersByType(s, "item")).toHaveLength(1);
    expect(getMarkersByType(s, "objective")).toHaveLength(1);
  });

  it("includes both visible and invisible markers", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "v", type: "item", visible: true }));
    s = addMarker(s, makeMarker({ id: "h", type: "item", visible: false }));
    expect(getMarkersByType(s, "item")).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § setMarkerVisibility
// ════════════════════════════════════════════════════════════════

describe("setMarkerVisibility", () => {
  it("sets a marker to invisible", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "m", visible: true }));
    const s2 = setMarkerVisibility(s, "m", false);
    expect(s2.markers[0].visible).toBe(false);
  });

  it("sets a marker to visible", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "m", visible: false }));
    const s2 = setMarkerVisibility(s, "m", true);
    expect(s2.markers[0].visible).toBe(true);
  });

  it("does not mutate original state", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "m", visible: true }));
    setMarkerVisibility(s, "m", false);
    expect(s.markers[0].visible).toBe(true);
  });

  it("only affects the targeted marker", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a", visible: true }));
    s = addMarker(s, makeMarker({ id: "b", visible: true }));
    const s2 = setMarkerVisibility(s, "a", false);
    expect(s2.markers[0].visible).toBe(false);
    expect(s2.markers[1].visible).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § clearMarkers
// ════════════════════════════════════════════════════════════════

describe("clearMarkers", () => {
  it("removes all markers", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    s = addMarker(s, makeMarker({ id: "b" }));
    s = addMarker(s, makeMarker({ id: "c" }));
    const s2 = clearMarkers(s);
    expect(s2.markers).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    clearMarkers(s);
    expect(s.markers).toHaveLength(1);
  });

  it("preserves config and camera after clearing", () => {
    let s = stateWithCamera(10, 20, 800, 600);
    s = addMarker(s, makeMarker());
    const s2 = clearMarkers(s);
    expect(s2.config).toEqual(defaultConfig);
    expect(s2.cameraX).toBe(10);
    expect(s2.cameraY).toBe(20);
  });

  it("works on already empty state", () => {
    const s = createMinimap(defaultConfig);
    const s2 = clearMarkers(s);
    expect(s2.markers).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMarkerCount
// ════════════════════════════════════════════════════════════════

describe("getMarkerCount", () => {
  it("returns 0 for empty state", () => {
    expect(getMarkerCount(createMinimap(defaultConfig))).toBe(0);
  });

  it("returns correct count after adding markers", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    s = addMarker(s, makeMarker({ id: "b" }));
    expect(getMarkerCount(s)).toBe(2);
  });

  it("returns correct count after removing a marker", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "a" }));
    s = addMarker(s, makeMarker({ id: "b" }));
    s = removeMarker(s, "a");
    expect(getMarkerCount(s)).toBe(1);
  });

  it("includes invisible markers in count", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "v", visible: true }));
    s = addMarker(s, makeMarker({ id: "h", visible: false }));
    expect(getMarkerCount(s)).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDefaultMinimapConfig
// ════════════════════════════════════════════════════════════════

describe("getDefaultMinimapConfig", () => {
  it("returns correct worldWidth and worldHeight", () => {
    const cfg = getDefaultMinimapConfig();
    expect(cfg.worldWidth).toBe(3200);
    expect(cfg.worldHeight).toBe(3200);
  });

  it("returns correct minimapWidth and minimapHeight", () => {
    const cfg = getDefaultMinimapConfig();
    expect(cfg.minimapWidth).toBe(100);
    expect(cfg.minimapHeight).toBe(100);
  });

  it("returns correct size", () => {
    const cfg = getDefaultMinimapConfig();
    expect(cfg.size).toBe(100);
  });

  it("returns correct centerX and centerY", () => {
    const cfg = getDefaultMinimapConfig();
    expect(cfg.centerX).toBe(652);
    expect(cfg.centerY).toBe(140);
  });

  it("returns a new object each call (no shared reference)", () => {
    const a = getDefaultMinimapConfig();
    const b = getDefaultMinimapConfig();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("returned config has all seven fields", () => {
    const cfg = getDefaultMinimapConfig();
    expect(cfg).toHaveProperty("worldWidth");
    expect(cfg).toHaveProperty("worldHeight");
    expect(cfg).toHaveProperty("minimapWidth");
    expect(cfg).toHaveProperty("minimapHeight");
    expect(cfg).toHaveProperty("size");
    expect(cfg).toHaveProperty("centerX");
    expect(cfg).toHaveProperty("centerY");
  });
});

// ════════════════════════════════════════════════════════════════
// § getEnemyDots
// ════════════════════════════════════════════════════════════════

describe("getEnemyDots", () => {
  const dotConfig: MinimapConfig = {
    worldWidth: 3200,
    worldHeight: 3200,
    minimapWidth: 100,
    minimapHeight: 100,
    size: 100,
    centerX: 660,
    centerY: 60,
  };

  it("returns empty array for no enemies", () => {
    const dots = getEnemyDots([], 100, 100, dotConfig);
    expect(dots).toEqual([]);
  });

  it("places enemy at center when at same position as player", () => {
    const enemies = [{ x: 500, y: 500 }];
    const dots = getEnemyDots(enemies, 500, 500, dotConfig);
    expect(dots).toHaveLength(1);
    expect(dots[0].screenX).toBe(660);
    expect(dots[0].screenY).toBe(60);
    expect(dots[0].isVisible).toBe(true);
  });

  it("offsets enemy screen position relative to player", () => {
    const scale = dotConfig.size / dotConfig.worldWidth; // 100/3200
    const enemies = [{ x: 600, y: 500 }];
    const dots = getEnemyDots(enemies, 500, 500, dotConfig);
    const expectedX = dotConfig.centerX + (600 - 500) * scale;
    expect(dots[0].screenX).toBeCloseTo(expectedX, 5);
  });

  it("marks enemy as not visible when out of range", () => {
    // halfSize = 50, scale = 100/3200 = 0.03125
    // dx = (5000-0)*0.03125 = 156.25, which > 50 => not visible
    const enemies = [{ x: 5000, y: 0 }];
    const dots = getEnemyDots(enemies, 0, 0, dotConfig);
    expect(dots[0].isVisible).toBe(false);
  });

  it("marks enemy as visible when within range", () => {
    // halfSize = 50, scale = 0.03125
    // dx = 100 * 0.03125 = 3.125, dy = 100 * 0.03125 = 3.125 => visible
    const enemies = [{ x: 600, y: 600 }];
    const dots = getEnemyDots(enemies, 500, 500, dotConfig);
    expect(dots[0].isVisible).toBe(true);
  });

  it("uses enemy type when provided", () => {
    const enemies = [{ x: 100, y: 100, type: "boss" }];
    const dots = getEnemyDots(enemies, 100, 100, dotConfig);
    expect(dots[0].type).toBe("boss");
  });

  it("defaults type to 'enemy' when not provided", () => {
    const enemies = [{ x: 100, y: 100 }];
    const dots = getEnemyDots(enemies, 100, 100, dotConfig);
    expect(dots[0].type).toBe("enemy");
  });

  it("handles multiple enemies", () => {
    const enemies = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 300, y: 300 },
    ];
    const dots = getEnemyDots(enemies, 150, 150, dotConfig);
    expect(dots).toHaveLength(3);
  });

  it("enemy at boundary of range is visible (abs(dx) == halfSize)", () => {
    // halfSize = 50, need dx exactly 50 => offset = 50 / scale = 50 / 0.03125 = 1600
    const enemies = [{ x: 1600, y: 0 }];
    const dots = getEnemyDots(enemies, 0, 0, dotConfig);
    // dx = 1600 * 0.03125 = 50, which equals halfSize => visible
    expect(dots[0].isVisible).toBe(true);
  });

  it("enemy just beyond boundary is not visible", () => {
    const enemies = [{ x: 1601, y: 0 }];
    const dots = getEnemyDots(enemies, 0, 0, dotConfig);
    // dx = 1601 * 0.03125 = 50.03125 > 50 => not visible
    expect(dots[0].isVisible).toBe(false);
  });

  it("handles negative offsets (enemy behind player)", () => {
    const scale = dotConfig.size / dotConfig.worldWidth;
    const enemies = [{ x: 0, y: 0 }];
    const dots = getEnemyDots(enemies, 500, 500, dotConfig);
    const expectedX = dotConfig.centerX + (0 - 500) * scale;
    const expectedY = dotConfig.centerY + (0 - 500) * scale;
    expect(dots[0].screenX).toBeCloseTo(expectedX, 5);
    expect(dots[0].screenY).toBeCloseTo(expectedY, 5);
  });
});

// ════════════════════════════════════════════════════════════════
// § INTEGRATION / EDGE CASES
// ════════════════════════════════════════════════════════════════

describe("integration and edge cases", () => {
  it("full workflow: create → add → move → camera → query", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(
      s,
      makeMarker({ id: "player", worldX: 500, worldY: 500, type: "player" }),
    );
    s = addMarker(
      s,
      makeMarker({ id: "boss1", worldX: 1500, worldY: 1500, type: "boss" }),
    );
    s = addMarker(
      s,
      makeMarker({ id: "item1", worldX: 300, worldY: 300, type: "item" }),
    );
    s = updateCamera(s, 200, 200, 600, 600);

    expect(getMarkerCount(s)).toBe(3);
    expect(getVisibleMarkers(s)).toHaveLength(2); // player + item
    expect(getMarkersByType(s, "boss")).toHaveLength(1);

    // Move boss into viewport
    s = updateMarkerPosition(s, "boss1", 500, 500);
    expect(getVisibleMarkers(s)).toHaveLength(3);
  });

  it("worldToMinimap with tiny world produces large minimap coords per unit", () => {
    const cfg: MinimapConfig = {
      worldWidth: 10,
      worldHeight: 10,
      minimapWidth: 200,
      minimapHeight: 200,
      size: 200,
      centerX: 100,
      centerY: 100,
    };
    const s = createMinimap(cfg);
    const { minimapX, minimapY } = worldToMinimap(s, 5, 5);
    expect(minimapX).toBe(100);
    expect(minimapY).toBe(100);
  });

  it("zero-sized camera viewport excludes all except edge points", () => {
    const s = updateCamera(createMinimap(defaultConfig), 100, 100, 0, 0);
    expect(isInViewport(s, 100, 100)).toBe(true);
    expect(isInViewport(s, 100.01, 100)).toBe(false);
  });

  it("markers retain identity through multiple operations", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(
      s,
      makeMarker({
        id: "z",
        worldX: 0,
        worldY: 0,
        type: "objective",
        color: "#abcdef",
      }),
    );
    s = updateMarkerPosition(s, "z", 100, 200);
    s = setMarkerVisibility(s, "z", false);
    const m = s.markers[0];
    expect(m.id).toBe("z");
    expect(m.type).toBe("objective");
    expect(m.color).toBe("#abcdef");
    expect(m.worldX).toBe(100);
    expect(m.worldY).toBe(200);
    expect(m.visible).toBe(false);
  });

  it("large world with many markers", () => {
    const cfg: MinimapConfig = {
      worldWidth: 100000,
      worldHeight: 100000,
      minimapWidth: 300,
      minimapHeight: 300,
      size: 300,
      centerX: 150,
      centerY: 150,
    };
    let s = createMinimap(cfg);
    for (let i = 0; i < 100; i++) {
      s = addMarker(
        s,
        makeMarker({ id: `e${i}`, worldX: i * 1000, worldY: i * 500 }),
      );
    }
    expect(getMarkerCount(s)).toBe(100);
    s = updateCamera(s, 0, 0, 10000, 10000);
    const visible = getVisibleMarkers(s);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(100);
  });

  it("worldToMinimap at world=0,0 returns minimap 0,0", () => {
    const s = createMinimap(defaultConfig);
    const r = worldToMinimap(s, 0, 0);
    expect(r.minimapX).toBe(0);
    expect(r.minimapY).toBe(0);
  });

  it("clearMarkers then add works correctly", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "old" }));
    s = clearMarkers(s);
    s = addMarker(s, makeMarker({ id: "new" }));
    expect(getMarkerCount(s)).toBe(1);
    expect(s.markers[0].id).toBe("new");
  });

  it("remove then re-add same id", () => {
    let s = createMinimap(defaultConfig);
    s = addMarker(s, makeMarker({ id: "r", worldX: 10, worldY: 10 }));
    s = removeMarker(s, "r");
    s = addMarker(s, makeMarker({ id: "r", worldX: 99, worldY: 99 }));
    expect(s.markers).toHaveLength(1);
    expect(s.markers[0].worldX).toBe(99);
  });

  it("getDefaultMinimapConfig can be used with createMinimap", () => {
    const cfg = getDefaultMinimapConfig();
    const s = createMinimap(cfg);
    expect(s.config.worldWidth).toBe(3200);
    expect(s.markers).toHaveLength(0);
  });

  it("getEnemyDots works with getDefaultMinimapConfig", () => {
    const cfg = getDefaultMinimapConfig();
    const enemies = [{ x: 100, y: 100 }];
    const dots = getEnemyDots(enemies, 100, 100, cfg);
    expect(dots).toHaveLength(1);
    expect(dots[0].screenX).toBe(cfg.centerX);
    expect(dots[0].screenY).toBe(cfg.centerY);
  });
});
