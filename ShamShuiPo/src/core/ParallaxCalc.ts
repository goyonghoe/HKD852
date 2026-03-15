/**
 * ParallaxCalc — Pure TypeScript parallax scrolling calculations.
 * NO Phaser imports. All functions are pure and side-effect free.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface ParallaxLayer {
  readonly id: string;
  /** Speed factor 0-1 where 1 = camera speed */
  readonly speed: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;
  readonly wrapX: boolean;
  readonly wrapY: boolean;
  readonly visible: boolean;
  readonly alpha: number;
}

export interface ParallaxConfig {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly layers: readonly ParallaxLayer[];
}

export interface ScrollPosition {
  readonly layerId: string;
  readonly x: number;
  readonly y: number;
}

export interface ParallaxState {
  readonly config: ParallaxConfig;
  readonly cameraX: number;
  readonly cameraY: number;
  readonly scrollPositions: readonly ScrollPosition[];
}

// ─── Internal helpers ────────────────────────────────────────────

function calcScrollPositions(
  config: ParallaxConfig,
  cameraX: number,
  cameraY: number,
): readonly ScrollPosition[] {
  return config.layers.map((layer) => {
    let x = layer.offsetX - cameraX * layer.speed;
    let y = layer.offsetY - cameraY * layer.speed;

    if (layer.wrapX) {
      x = wrapPosition(x, layer.width, config.viewportWidth);
    }
    if (layer.wrapY) {
      y = wrapPosition(y, layer.height, config.viewportHeight);
    }

    return { layerId: layer.id, x, y };
  });
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Wraps a scroll position for seamless tiling.
 * Keeps the position within [-layerSize, viewportSize) range
 * so the layer always covers the viewport.
 */
export function wrapPosition(
  position: number,
  layerSize: number,
  viewportSize: number,
): number {
  if (layerSize <= 0) return position;
  // Normalize into [0, layerSize) then shift back
  const mod = ((position % layerSize) + layerSize) % layerSize;
  // If the wrapped position is beyond the viewport, shift back by layerSize
  return mod > viewportSize ? mod - layerSize : mod;
}

/** Create initial parallax state from config. */
export function createParallaxState(config: ParallaxConfig): ParallaxState {
  return {
    config,
    cameraX: 0,
    cameraY: 0,
    scrollPositions: calcScrollPositions(config, 0, 0),
  };
}

/** Update camera position and recalculate all layer scroll positions. */
export function updateCamera(
  state: ParallaxState,
  cameraX: number,
  cameraY: number,
): ParallaxState {
  return {
    ...state,
    cameraX,
    cameraY,
    scrollPositions: calcScrollPositions(state.config, cameraX, cameraY),
  };
}

/** Get a single layer's current scroll position, or null if not found. */
export function getLayerPosition(
  state: ParallaxState,
  layerId: string,
): { x: number; y: number } | null {
  const pos = state.scrollPositions.find((sp) => sp.layerId === layerId);
  if (!pos) return null;
  return { x: pos.x, y: pos.y };
}

/** Add a layer to the config and recalculate. */
export function addLayer(
  state: ParallaxState,
  layer: ParallaxLayer,
): ParallaxState {
  const newConfig: ParallaxConfig = {
    ...state.config,
    layers: [...state.config.layers, layer],
  };
  return {
    ...state,
    config: newConfig,
    scrollPositions: calcScrollPositions(
      newConfig,
      state.cameraX,
      state.cameraY,
    ),
  };
}

/** Remove a layer by id and recalculate. */
export function removeLayer(
  state: ParallaxState,
  layerId: string,
): ParallaxState {
  const newConfig: ParallaxConfig = {
    ...state.config,
    layers: state.config.layers.filter((l) => l.id !== layerId),
  };
  return {
    ...state,
    config: newConfig,
    scrollPositions: calcScrollPositions(
      newConfig,
      state.cameraX,
      state.cameraY,
    ),
  };
}

/** Set a layer's speed factor and recalculate. */
export function setLayerSpeed(
  state: ParallaxState,
  layerId: string,
  speed: number,
): ParallaxState {
  const newConfig: ParallaxConfig = {
    ...state.config,
    layers: state.config.layers.map((l) =>
      l.id === layerId ? { ...l, speed } : l,
    ),
  };
  return {
    ...state,
    config: newConfig,
    scrollPositions: calcScrollPositions(
      newConfig,
      state.cameraX,
      state.cameraY,
    ),
  };
}

/** Set a layer's visibility. */
export function setLayerVisibility(
  state: ParallaxState,
  layerId: string,
  visible: boolean,
): ParallaxState {
  const newConfig: ParallaxConfig = {
    ...state.config,
    layers: state.config.layers.map((l) =>
      l.id === layerId ? { ...l, visible } : l,
    ),
  };
  return {
    ...state,
    config: newConfig,
    scrollPositions: calcScrollPositions(
      newConfig,
      state.cameraX,
      state.cameraY,
    ),
  };
}

/** Set a layer's alpha (opacity). */
export function setLayerAlpha(
  state: ParallaxState,
  layerId: string,
  alpha: number,
): ParallaxState {
  const newConfig: ParallaxConfig = {
    ...state.config,
    layers: state.config.layers.map((l) =>
      l.id === layerId ? { ...l, alpha } : l,
    ),
  };
  return {
    ...state,
    config: newConfig,
    scrollPositions: calcScrollPositions(
      newConfig,
      state.cameraX,
      state.cameraY,
    ),
  };
}

/** Get all visible layers sorted by speed ascending (farthest/slowest first). */
export function getVisibleLayers(state: ParallaxState): ParallaxLayer[] {
  return state.config.layers
    .filter((l) => l.visible)
    .slice()
    .sort((a, b) => a.speed - b.speed);
}

/** Default 720x1280 config with 5 standard parallax layers. */
export function getDefaultParallaxConfig(): ParallaxConfig {
  const mkLayer = (id: string, speed: number): ParallaxLayer => ({
    id,
    speed,
    offsetX: 0,
    offsetY: 0,
    width: 720,
    height: 1280,
    wrapX: true,
    wrapY: false,
    visible: true,
    alpha: 1,
  });

  return {
    viewportWidth: 720,
    viewportHeight: 1280,
    layers: [
      mkLayer("sky", 0.1),
      mkLayer("far", 0.3),
      mkLayer("mid", 0.5),
      mkLayer("near", 0.7),
      mkLayer("front", 0.9),
    ],
  };
}
