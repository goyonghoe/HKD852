import { describe, it, expect } from "vitest";
import {
  createParallaxState,
  updateCamera,
  getLayerPosition,
  addLayer,
  removeLayer,
  setLayerSpeed,
  setLayerVisibility,
  setLayerAlpha,
  getVisibleLayers,
  getDefaultParallaxConfig,
  wrapPosition,
  type ParallaxLayer,
  type ParallaxConfig,
} from "../../src/core/ParallaxCalc";

// ─── Helpers ─────────────────────────────────────────────────────

function mkLayer(
  id: string,
  speed: number,
  overrides: Partial<ParallaxLayer> = {},
): ParallaxLayer {
  return {
    id,
    speed,
    offsetX: 0,
    offsetY: 0,
    width: 720,
    height: 1280,
    wrapX: false,
    wrapY: false,
    visible: true,
    alpha: 1,
    ...overrides,
  };
}

function mkConfig(layers: ParallaxLayer[]): ParallaxConfig {
  return { viewportWidth: 720, viewportHeight: 1280, layers };
}

// ─── createParallaxState ─────────────────────────────────────────

describe("createParallaxState", () => {
  it("initializes with camera at origin", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    expect(state.cameraX).toBe(0);
    expect(state.cameraY).toBe(0);
  });

  it("creates scroll positions for all layers", () => {
    const config = mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]);
    const state = createParallaxState(config);
    expect(state.scrollPositions).toHaveLength(2);
  });

  it("scroll positions start at layer offsets when camera is at origin", () => {
    const layer = mkLayer("bg", 0.5, { offsetX: 10, offsetY: 20 });
    const state = createParallaxState(mkConfig([layer]));
    const pos = state.scrollPositions[0];
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
  });

  it("stores the config reference", () => {
    const config = mkConfig([]);
    const state = createParallaxState(config);
    expect(state.config).toBe(config);
  });

  it("handles empty layer list", () => {
    const state = createParallaxState(mkConfig([]));
    expect(state.scrollPositions).toHaveLength(0);
  });
});

// ─── getDefaultParallaxConfig ────────────────────────────────────

describe("getDefaultParallaxConfig", () => {
  it("returns 720x1280 viewport", () => {
    const config = getDefaultParallaxConfig();
    expect(config.viewportWidth).toBe(720);
    expect(config.viewportHeight).toBe(1280);
  });

  it("has 5 layers", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers).toHaveLength(5);
  });

  it("layers are sky, far, mid, near, front", () => {
    const config = getDefaultParallaxConfig();
    const ids = config.layers.map((l) => l.id);
    expect(ids).toEqual(["sky", "far", "mid", "near", "front"]);
  });

  it("sky speed is 0.1", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers[0].speed).toBe(0.1);
  });

  it("far speed is 0.3", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers[1].speed).toBe(0.3);
  });

  it("mid speed is 0.5", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers[2].speed).toBe(0.5);
  });

  it("near speed is 0.7", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers[3].speed).toBe(0.7);
  });

  it("front speed is 0.9", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers[4].speed).toBe(0.9);
  });

  it("all layers have wrapX true", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers.every((l) => l.wrapX)).toBe(true);
  });

  it("all layers are visible with alpha 1", () => {
    const config = getDefaultParallaxConfig();
    expect(config.layers.every((l) => l.visible && l.alpha === 1)).toBe(true);
  });

  it("creates state successfully from default config", () => {
    const state = createParallaxState(getDefaultParallaxConfig());
    expect(state.scrollPositions).toHaveLength(5);
  });
});

// ─── updateCamera ────────────────────────────────────────────────

describe("updateCamera", () => {
  it("updates cameraX and cameraY", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, 100, 200);
    expect(next.cameraX).toBe(100);
    expect(next.cameraY).toBe(200);
  });

  it("speed=0.5 moves layer at half camera speed", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, 100, 0);
    expect(next.scrollPositions[0].x).toBe(-50);
  });

  it("speed=1.0 moves layer at full camera speed", () => {
    const state = createParallaxState(mkConfig([mkLayer("fg", 1.0)]));
    const next = updateCamera(state, 100, 0);
    expect(next.scrollPositions[0].x).toBe(-100);
  });

  it("speed=0 keeps layer stationary", () => {
    const state = createParallaxState(mkConfig([mkLayer("fixed", 0)]));
    const next = updateCamera(state, 500, 300);
    expect(next.scrollPositions[0].x).toBe(0);
    expect(next.scrollPositions[0].y).toBe(0);
  });

  it("applies offsetX correctly with camera movement", () => {
    const layer = mkLayer("bg", 0.5, { offsetX: 30 });
    const state = createParallaxState(mkConfig([layer]));
    const next = updateCamera(state, 100, 0);
    // offsetX - cameraX * speed = 30 - 100*0.5 = -20
    expect(next.scrollPositions[0].x).toBe(-20);
  });

  it("applies offsetY correctly with camera movement", () => {
    const layer = mkLayer("bg", 0.4, { offsetY: 50 });
    const state = createParallaxState(mkConfig([layer]));
    const next = updateCamera(state, 0, 200);
    // offsetY - cameraY * speed = 50 - 200*0.4 = -30
    expect(next.scrollPositions[0].y).toBe(-30);
  });

  it("handles negative camera positions", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, -200, -100);
    // 0 - (-200)*0.5 = 100
    expect(next.scrollPositions[0].x).toBe(100);
    expect(next.scrollPositions[0].y).toBe(50);
  });

  it("recalculates all layers simultaneously", () => {
    const config = mkConfig([mkLayer("slow", 0.2), mkLayer("fast", 0.8)]);
    const state = createParallaxState(config);
    const next = updateCamera(state, 100, 0);
    expect(next.scrollPositions[0].x).toBe(-20);
    expect(next.scrollPositions[1].x).toBe(-80);
  });

  it("does not mutate original state", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, 100, 200);
    expect(state.cameraX).toBe(0);
    expect(state.cameraY).toBe(0);
    expect(next).not.toBe(state);
  });

  it("handles very large camera values", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.3)]));
    const next = updateCamera(state, 100000, 0);
    expect(next.scrollPositions[0].x).toBe(-30000);
  });
});

// ─── getLayerPosition ────────────────────────────────────────────

describe("getLayerPosition", () => {
  it("returns position for existing layer", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const pos = getLayerPosition(state, "bg");
    expect(pos).not.toBeNull();
    expect(pos!.x).toBe(0);
    expect(pos!.y).toBe(0);
  });

  it("returns null for non-existing layer", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    expect(getLayerPosition(state, "nonexistent")).toBeNull();
  });

  it("returns updated position after camera move", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, 200, 0);
    const pos = getLayerPosition(next, "bg");
    expect(pos!.x).toBe(-100);
  });

  it("returns null on empty state", () => {
    const state = createParallaxState(mkConfig([]));
    expect(getLayerPosition(state, "anything")).toBeNull();
  });

  it("finds correct layer among multiple", () => {
    const config = mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]);
    const state = updateCamera(createParallaxState(config), 100, 0);
    const posA = getLayerPosition(state, "a");
    const posB = getLayerPosition(state, "b");
    expect(posA!.x).toBe(-20);
    expect(posB!.x).toBe(-80);
  });
});

// ─── addLayer ────────────────────────────────────────────────────

describe("addLayer", () => {
  it("adds a layer to config", () => {
    const state = createParallaxState(mkConfig([]));
    const next = addLayer(state, mkLayer("new", 0.5));
    expect(next.config.layers).toHaveLength(1);
    expect(next.config.layers[0].id).toBe("new");
  });

  it("appends to existing layers", () => {
    const state = createParallaxState(mkConfig([mkLayer("a", 0.2)]));
    const next = addLayer(state, mkLayer("b", 0.8));
    expect(next.config.layers).toHaveLength(2);
    expect(next.config.layers[1].id).toBe("b");
  });

  it("recalculates scroll positions for new layer", () => {
    const state = updateCamera(createParallaxState(mkConfig([])), 100, 0);
    const next = addLayer(state, mkLayer("bg", 0.5));
    expect(next.scrollPositions[0].x).toBe(-50);
  });

  it("does not mutate original state", () => {
    const state = createParallaxState(mkConfig([]));
    addLayer(state, mkLayer("new", 0.5));
    expect(state.config.layers).toHaveLength(0);
  });
});

// ─── removeLayer ─────────────────────────────────────────────────

describe("removeLayer", () => {
  it("removes a layer by id", () => {
    const state = createParallaxState(
      mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]),
    );
    const next = removeLayer(state, "a");
    expect(next.config.layers).toHaveLength(1);
    expect(next.config.layers[0].id).toBe("b");
  });

  it("does nothing if layer not found", () => {
    const state = createParallaxState(mkConfig([mkLayer("a", 0.5)]));
    const next = removeLayer(state, "nonexistent");
    expect(next.config.layers).toHaveLength(1);
  });

  it("recalculates scroll positions after removal", () => {
    const state = createParallaxState(
      mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]),
    );
    const next = removeLayer(state, "a");
    expect(next.scrollPositions).toHaveLength(1);
    expect(next.scrollPositions[0].layerId).toBe("b");
  });

  it("does not mutate original state", () => {
    const state = createParallaxState(mkConfig([mkLayer("a", 0.5)]));
    removeLayer(state, "a");
    expect(state.config.layers).toHaveLength(1);
  });
});

// ─── setLayerSpeed ───────────────────────────────────────────────

describe("setLayerSpeed", () => {
  it("updates layer speed", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = setLayerSpeed(state, "bg", 0.9);
    expect(next.config.layers[0].speed).toBe(0.9);
  });

  it("recalculates scroll position with new speed", () => {
    const state = updateCamera(
      createParallaxState(mkConfig([mkLayer("bg", 0.5)])),
      100,
      0,
    );
    const next = setLayerSpeed(state, "bg", 0.2);
    expect(next.scrollPositions[0].x).toBe(-20);
  });

  it("does not affect other layers", () => {
    const state = createParallaxState(
      mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]),
    );
    const next = setLayerSpeed(state, "a", 0.9);
    expect(next.config.layers[1].speed).toBe(0.8);
  });

  it("does not mutate original", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    setLayerSpeed(state, "bg", 0.9);
    expect(state.config.layers[0].speed).toBe(0.5);
  });
});

// ─── setLayerVisibility ──────────────────────────────────────────

describe("setLayerVisibility", () => {
  it("hides a visible layer", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = setLayerVisibility(state, "bg", false);
    expect(next.config.layers[0].visible).toBe(false);
  });

  it("shows a hidden layer", () => {
    const layer = mkLayer("bg", 0.5, { visible: false });
    const state = createParallaxState(mkConfig([layer]));
    const next = setLayerVisibility(state, "bg", true);
    expect(next.config.layers[0].visible).toBe(true);
  });

  it("does not mutate original", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    setLayerVisibility(state, "bg", false);
    expect(state.config.layers[0].visible).toBe(true);
  });
});

// ─── setLayerAlpha ───────────────────────────────────────────────

describe("setLayerAlpha", () => {
  it("sets alpha to 0.5", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = setLayerAlpha(state, "bg", 0.5);
    expect(next.config.layers[0].alpha).toBe(0.5);
  });

  it("sets alpha to 0", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = setLayerAlpha(state, "bg", 0);
    expect(next.config.layers[0].alpha).toBe(0);
  });

  it("does not mutate original", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    setLayerAlpha(state, "bg", 0.3);
    expect(state.config.layers[0].alpha).toBe(1);
  });
});

// ─── getVisibleLayers ────────────────────────────────────────────

describe("getVisibleLayers", () => {
  it("returns only visible layers", () => {
    const config = mkConfig([
      mkLayer("a", 0.2),
      mkLayer("b", 0.5, { visible: false }),
      mkLayer("c", 0.8),
    ]);
    const state = createParallaxState(config);
    const visible = getVisibleLayers(state);
    expect(visible).toHaveLength(2);
    expect(visible.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("sorts by speed ascending (farthest first)", () => {
    const config = mkConfig([
      mkLayer("fast", 0.9),
      mkLayer("slow", 0.1),
      mkLayer("mid", 0.5),
    ]);
    const state = createParallaxState(config);
    const visible = getVisibleLayers(state);
    expect(visible.map((l) => l.speed)).toEqual([0.1, 0.5, 0.9]);
  });

  it("returns empty array when all hidden", () => {
    const config = mkConfig([
      mkLayer("a", 0.2, { visible: false }),
      mkLayer("b", 0.8, { visible: false }),
    ]);
    const state = createParallaxState(config);
    expect(getVisibleLayers(state)).toHaveLength(0);
  });

  it("returns empty for empty config", () => {
    const state = createParallaxState(mkConfig([]));
    expect(getVisibleLayers(state)).toHaveLength(0);
  });

  it("does not mutate config layers order", () => {
    const config = mkConfig([mkLayer("fast", 0.9), mkLayer("slow", 0.1)]);
    const state = createParallaxState(config);
    getVisibleLayers(state);
    expect(state.config.layers[0].id).toBe("fast");
    expect(state.config.layers[1].id).toBe("slow");
  });

  it("reflects visibility changes", () => {
    const state = createParallaxState(
      mkConfig([mkLayer("a", 0.2), mkLayer("b", 0.8)]),
    );
    const next = setLayerVisibility(state, "a", false);
    const visible = getVisibleLayers(next);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("b");
  });
});

// ─── wrapPosition ────────────────────────────────────────────────

describe("wrapPosition", () => {
  it("wraps positive position within layer size", () => {
    // position=800, layerSize=720, viewport=720
    const result = wrapPosition(800, 720, 720);
    // 800 % 720 = 80 → 80 <= 720 → 80
    expect(result).toBe(80);
  });

  it("wraps negative position", () => {
    // position=-100, layerSize=720, viewport=720
    const result = wrapPosition(-100, 720, 720);
    // ((-100 % 720) + 720) % 720 = 620 → 620 <= 720 → 620
    expect(result).toBe(620);
  });

  it("returns 0 for position at exact layer size", () => {
    expect(wrapPosition(720, 720, 720)).toBe(0);
  });

  it("returns position unchanged when within range", () => {
    expect(wrapPosition(100, 720, 720)).toBe(100);
  });

  it("handles zero position", () => {
    expect(wrapPosition(0, 720, 720)).toBe(0);
  });

  it("handles position equal to negative layer size", () => {
    expect(wrapPosition(-720, 720, 720)).toBe(0);
  });

  it("handles very large negative position", () => {
    const result = wrapPosition(-1440, 720, 720);
    expect(result).toBe(0);
  });

  it("handles layerSize <= 0 by returning position unchanged", () => {
    expect(wrapPosition(500, 0, 720)).toBe(500);
    expect(wrapPosition(500, -100, 720)).toBe(500);
  });

  it("wraps correctly with different layer and viewport sizes", () => {
    // layerSize=1000, viewport=720, position=1500
    const result = wrapPosition(1500, 1000, 720);
    // 1500 % 1000 = 500 → 500 <= 720 → 500
    expect(result).toBe(500);
  });

  it("handles position exactly at boundary", () => {
    // position=720 with layerSize=720 → wraps to 0
    expect(wrapPosition(720, 720, 720)).toBe(0);
  });

  it("wraps large position that exceeds viewport after modulo", () => {
    // position=750, layerSize=100, viewport=50
    // 750 % 100 = 50 → 50 > 50? no (<=) → 50
    const result = wrapPosition(750, 100, 50);
    expect(result).toBe(50);
  });

  it("shifts back when mod exceeds viewport", () => {
    // position=780, layerSize=1000, viewport=100
    // 780 % 1000 = 780 → 780 > 100 → 780 - 1000 = -220
    const result = wrapPosition(780, 1000, 100);
    expect(result).toBe(-220);
  });
});

// ─── wrapX/wrapY integration ─────────────────────────────────────

describe("wrap integration with updateCamera", () => {
  it("applies wrapX when layer has wrapX=true", () => {
    const layer = mkLayer("bg", 0.5, { wrapX: true, width: 720 });
    const state = createParallaxState(mkConfig([layer]));
    const next = updateCamera(state, 2000, 0);
    const pos = getLayerPosition(next, "bg");
    // Without wrap: 0 - 2000*0.5 = -1000
    // With wrap: wrapPosition(-1000, 720, 720) = ((-1000%720)+720)%720 = 440
    expect(pos!.x).toBe(440);
  });

  it("does not apply wrapX when wrapX=false", () => {
    const layer = mkLayer("bg", 0.5, { wrapX: false });
    const state = createParallaxState(mkConfig([layer]));
    const next = updateCamera(state, 2000, 0);
    const pos = getLayerPosition(next, "bg");
    expect(pos!.x).toBe(-1000);
  });

  it("applies wrapY when layer has wrapY=true", () => {
    const layer = mkLayer("bg", 0.5, { wrapY: true, height: 1280 });
    const state = createParallaxState(mkConfig([layer]));
    const next = updateCamera(state, 0, 3000);
    const pos = getLayerPosition(next, "bg");
    // Without wrap: 0 - 3000*0.5 = -1500
    // With wrap: wrapPosition(-1500, 1280, 1280) = ((-1500%1280)+1280)%1280 = 1060
    expect(pos!.x).toBe(0);
    expect(pos!.y).toBe(1060);
  });
});

// ─── Immutability ────────────────────────────────────────────────

describe("immutability", () => {
  it("updateCamera returns new object", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = updateCamera(state, 10, 20);
    expect(next).not.toBe(state);
    expect(next.scrollPositions).not.toBe(state.scrollPositions);
  });

  it("addLayer returns new config", () => {
    const state = createParallaxState(mkConfig([]));
    const next = addLayer(state, mkLayer("x", 0.5));
    expect(next.config).not.toBe(state.config);
    expect(next.config.layers).not.toBe(state.config.layers);
  });

  it("setLayerSpeed returns new config", () => {
    const state = createParallaxState(mkConfig([mkLayer("bg", 0.5)]));
    const next = setLayerSpeed(state, "bg", 0.9);
    expect(next.config).not.toBe(state.config);
  });

  it("chained operations preserve correctness", () => {
    let state = createParallaxState(getDefaultParallaxConfig());
    state = updateCamera(state, 500, 0);
    state = setLayerSpeed(state, "sky", 0.05);
    state = setLayerVisibility(state, "front", false);
    state = setLayerAlpha(state, "mid", 0.7);

    expect(state.config.layers.find((l) => l.id === "sky")!.speed).toBe(0.05);
    expect(state.config.layers.find((l) => l.id === "front")!.visible).toBe(
      false,
    );
    expect(state.config.layers.find((l) => l.id === "mid")!.alpha).toBe(0.7);

    const visible = getVisibleLayers(state);
    expect(visible.find((l) => l.id === "front")).toBeUndefined();
    expect(visible).toHaveLength(4);
  });
});
