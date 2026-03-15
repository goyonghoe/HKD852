// ── Neon Survivors: Minimap Calculation System ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § TYPES
// ════════════════════════════════════════════════════════════════

export interface MinimapConfig {
  worldWidth: number;
  worldHeight: number;
  minimapWidth: number;
  minimapHeight: number;
  /** Screen-space size for rendering. */
  size: number;
  /** Screen-space center X for rendering. */
  centerX: number;
  /** Screen-space center Y for rendering. */
  centerY: number;
}

export interface MinimapMarker {
  id: string;
  worldX: number;
  worldY: number;
  type: "player" | "enemy" | "boss" | "item" | "objective";
  color: string;
  visible: boolean;
}

export interface MinimapState {
  config: MinimapConfig;
  markers: readonly MinimapMarker[];
  cameraX: number;
  cameraY: number;
  cameraWidth: number;
  cameraHeight: number;
}

// ════════════════════════════════════════════════════════════════
// § CORE FUNCTIONS
// ════════════════════════════════════════════════════════════════

/** Create initial minimap state with no markers and a zeroed camera. */
export function createMinimap(config: MinimapConfig): MinimapState {
  return {
    config: { ...config },
    markers: [],
    cameraX: 0,
    cameraY: 0,
    cameraWidth: 0,
    cameraHeight: 0,
  };
}

/** Add a marker. Returns new state. */
export function addMarker(
  state: MinimapState,
  marker: MinimapMarker,
): MinimapState {
  return { ...state, markers: [...state.markers, marker] };
}

/** Remove a marker by id. Returns new state. */
export function removeMarker(state: MinimapState, id: string): MinimapState {
  return { ...state, markers: state.markers.filter((m) => m.id !== id) };
}

/** Update a marker's world position. Returns new state. */
export function updateMarkerPosition(
  state: MinimapState,
  id: string,
  worldX: number,
  worldY: number,
): MinimapState {
  return {
    ...state,
    markers: state.markers.map((m) =>
      m.id === id ? { ...m, worldX, worldY } : m,
    ),
  };
}

/** Update the camera viewport. Returns new state. */
export function updateCamera(
  state: MinimapState,
  cameraX: number,
  cameraY: number,
  cameraWidth: number,
  cameraHeight: number,
): MinimapState {
  return { ...state, cameraX, cameraY, cameraWidth, cameraHeight };
}

// ════════════════════════════════════════════════════════════════
// § COORDINATE CONVERSION
// ════════════════════════════════════════════════════════════════

/** Convert world coordinates to minimap pixel coordinates. */
export function worldToMinimap(
  state: MinimapState,
  worldX: number,
  worldY: number,
): { minimapX: number; minimapY: number } {
  const { worldWidth, worldHeight, minimapWidth, minimapHeight } = state.config;
  const minimapX = (worldX / worldWidth) * minimapWidth;
  const minimapY = (worldY / worldHeight) * minimapHeight;
  return { minimapX, minimapY };
}

// ════════════════════════════════════════════════════════════════
// § QUERIES
// ════════════════════════════════════════════════════════════════

/** Check if a world position is within the camera viewport. */
export function isInViewport(
  state: MinimapState,
  worldX: number,
  worldY: number,
): boolean {
  return (
    worldX >= state.cameraX &&
    worldX <= state.cameraX + state.cameraWidth &&
    worldY >= state.cameraY &&
    worldY <= state.cameraY + state.cameraHeight
  );
}

/** Get all markers currently within the camera viewport. */
export function getVisibleMarkers(state: MinimapState): MinimapMarker[] {
  return state.markers.filter(
    (m) => m.visible && isInViewport(state, m.worldX, m.worldY),
  );
}

/** Filter markers by type. */
export function getMarkersByType(
  state: MinimapState,
  type: MinimapMarker["type"],
): MinimapMarker[] {
  return state.markers.filter((m) => m.type === type);
}

/** Set visibility of a specific marker. Returns new state. */
export function setMarkerVisibility(
  state: MinimapState,
  id: string,
  visible: boolean,
): MinimapState {
  return {
    ...state,
    markers: state.markers.map((m) => (m.id === id ? { ...m, visible } : m)),
  };
}

/** Remove all markers. Returns new state. */
export function clearMarkers(state: MinimapState): MinimapState {
  return { ...state, markers: [] };
}

/** Get total marker count. */
export function getMarkerCount(state: MinimapState): number {
  return state.markers.length;
}

// ════════════════════════════════════════════════════════════════
// § RENDERING HELPERS (used by GameScene)
// ════════════════════════════════════════════════════════════════

/** Default minimap config for the game (720x1280 portrait). */
export function getDefaultMinimapConfig(): MinimapConfig {
  return {
    worldWidth: 3200,
    worldHeight: 3200,
    minimapWidth: 100,
    minimapHeight: 100,
    size: 100,
    centerX: 652,
    centerY: 140,
  };
}

export interface MinimapDot {
  screenX: number;
  screenY: number;
  type: string;
  isVisible: boolean;
}

/**
 * Map enemy positions to screen-space minimap dots relative to player.
 */
export function getEnemyDots(
  enemies: readonly { x: number; y: number; type?: string }[],
  playerX: number,
  playerY: number,
  config: MinimapConfig,
): MinimapDot[] {
  const halfSize = config.size / 2;
  const scale = config.size / config.worldWidth;

  return enemies.map((e) => {
    const dx = (e.x - playerX) * scale;
    const dy = (e.y - playerY) * scale;
    const inRange = Math.abs(dx) <= halfSize && Math.abs(dy) <= halfSize;

    return {
      screenX: config.centerX + dx,
      screenY: config.centerY + dy,
      type: e.type ?? "enemy",
      isVisible: inRange,
    };
  });
}
