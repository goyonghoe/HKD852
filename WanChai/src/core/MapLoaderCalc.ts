/**
 * MapLoaderCalc — Pure TS map data parsing for chapter decorations.
 * No Phaser imports. Extracts typed decoration data, markers, zones,
 * and scroll factors from chapter map JSON.
 */

// ---------- Types ----------

export interface RawDecoration {
  key: string;
  x: number;
  y: number;
  scale?: number;
  depth?: number;
  alpha?: number;
  flipX?: boolean;
  type?: string;
  scrollFactor?: number;
  collisionShape?: string;
  destructible?: boolean;
  markerType?: string;
  tag?: string;
  blendMode?: string;
}

export interface RawZone {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tag?: string;
}

export interface ChapterMapData {
  bgLayers?: { id: string; alpha?: number; raw?: boolean }[];
  ground?: { surfaceTile?: string; fillTile?: string };
  decorations?: RawDecoration[];
  textures?: { key: string; path: string }[];
  zones?: RawZone[];
  schemaVersion?: number;
}

export interface ParsedDecoration {
  key: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  alpha: number;
  flipX: boolean;
  type: string;
  scrollFactor: number;
  collisionShape?: string;
  destructible?: boolean;
  markerType?: string;
  tag?: string;
  blendMode?: string;
}

export interface MapMarkerEntry {
  x: number;
  y: number;
  markerType: string;
}

export interface ParsedMapResult {
  decorations: ParsedDecoration[];
  obstacles: ParsedDecoration[];
  markers: Map<string, MapMarkerEntry>;
  zones: RawZone[];
  backgrounds: ParsedDecoration[];
}

// ---------- Defaults ----------

const DEFAULT_SCALE = 2;
const DEFAULT_DEPTH = -5;
const DEFAULT_ALPHA = 0.9;
const DEFAULT_SCROLL_FACTOR = 0;

// ---------- Parser ----------

/**
 * Parse raw chapter map JSON into categorized decoration data.
 * Pure function — no side effects.
 */
export function parseChapterMapData(mapData: ChapterMapData | null | undefined): ParsedMapResult {
  const result: ParsedMapResult = {
    decorations: [],
    obstacles: [],
    markers: new Map(),
    zones: [],
    backgrounds: [],
  };

  if (!mapData) return result;

  // Parse decorations
  if (mapData.decorations) {
    for (const d of mapData.decorations) {
      const parsed: ParsedDecoration = {
        key: d.key,
        x: d.x,
        y: d.y,
        scale: d.scale ?? DEFAULT_SCALE,
        depth: d.depth ?? DEFAULT_DEPTH,
        alpha: d.alpha ?? DEFAULT_ALPHA,
        flipX: d.flipX ?? false,
        type: d.type ?? 'Decoration',
        scrollFactor: d.scrollFactor ?? DEFAULT_SCROLL_FACTOR,
      };

      // Copy type-specific properties
      if (d.collisionShape) parsed.collisionShape = d.collisionShape;
      if (d.destructible) parsed.destructible = d.destructible;
      if (d.markerType) parsed.markerType = d.markerType;
      if (d.tag) parsed.tag = d.tag;
      if (d.blendMode) parsed.blendMode = d.blendMode;

      result.decorations.push(parsed);

      // Categorize by type
      if (parsed.type === 'Obstacle') {
        result.obstacles.push(parsed);
      } else if (parsed.type === 'Marker') {
        const markerTag = parsed.tag || `marker_${parsed.x}_${parsed.y}`;
        result.markers.set(markerTag, {
          x: parsed.x,
          y: parsed.y,
          markerType: parsed.markerType || 'custom',
        });
      } else if (parsed.type === 'Background') {
        result.backgrounds.push(parsed);
      }
    }
  }

  // Parse zones
  if (mapData.zones) {
    for (const z of mapData.zones) {
      result.zones.push({
        type: z.type,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        ...(z.tag ? { tag: z.tag } : {}),
      });
    }
  }

  return result;
}

// ---------- Tilemap Types ----------

export interface TilemapLayerData {
  name: string;
  grid: (string | null)[][];
}

export interface ParsedTilemapResult {
  tileSize: number;
  layers: TilemapLayerData[];
}

/** Raw tilemap format from map editor: { ground: { "col_row": tileKey }, wall: {...}, ... } */
export type RawTilemapLayers = Record<string, Record<string, string>>;

// ---------- Tilemap Parser ----------

/**
 * Parse tilemap data from the map editor format into a structured grid format.
 * Converts sparse `{ "col_row": tileKey }` dictionaries into dense 2D grids.
 * Pure function — no side effects.
 */
export function parseTilemapData(rawLayers: RawTilemapLayers | null | undefined, tileSize = 32): ParsedTilemapResult {
  const result: ParsedTilemapResult = { tileSize, layers: [] };

  if (!rawLayers) return result;

  for (const [layerName, tiles] of Object.entries(rawLayers)) {
    if (!tiles || typeof tiles !== 'object') continue;

    const entries = Object.entries(tiles);
    if (entries.length === 0) continue;

    // Find grid bounds
    let maxCol = 0;
    let maxRow = 0;
    const parsed: { col: number; row: number; key: string }[] = [];

    for (const [coordKey, tileKey] of entries) {
      const parts = coordKey.split('_').map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) continue;
      const [col, row] = parts;
      if (col > maxCol) maxCol = col;
      if (row > maxRow) maxRow = row;
      parsed.push({ col, row, key: tileKey });
    }

    // Build dense grid (null for empty cells)
    const grid: (string | null)[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      grid[r] = new Array(maxCol + 1).fill(null);
    }
    for (const { col, row, key } of parsed) {
      grid[row][col] = key;
    }

    result.layers.push({ name: layerName, grid });
  }

  return result;
}

// ---------- Scroll Factor ----------

/**
 * Check if a decoration should use a non-zero scroll factor.
 */
export function getScrollFactor(deco: ParsedDecoration): number {
  if (deco.type === 'Background' && deco.scrollFactor !== DEFAULT_SCROLL_FACTOR) {
    return deco.scrollFactor;
  }
  return DEFAULT_SCROLL_FACTOR;
}
