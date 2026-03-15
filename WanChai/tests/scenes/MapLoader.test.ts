import { describe, it, expect } from 'vitest';
import {
  parseChapterMapData,
  getScrollFactor,
  parseTilemapData,
  type ChapterMapData,
  type ParsedDecoration,
  type RawTilemapLayers,
} from '../../src/core/MapLoaderCalc';

describe('MapLoaderCalc', () => {
  describe('parseChapterMapData', () => {
    it('returns empty result for null input', () => {
      const result = parseChapterMapData(null);
      expect(result.decorations).toHaveLength(0);
      expect(result.obstacles).toHaveLength(0);
      expect(result.markers.size).toBe(0);
      expect(result.zones).toHaveLength(0);
      expect(result.backgrounds).toHaveLength(0);
    });

    it('returns empty result for undefined input', () => {
      const result = parseChapterMapData(undefined);
      expect(result.decorations).toHaveLength(0);
    });

    it('returns empty result for data without decorations', () => {
      const data: ChapterMapData = {
        bgLayers: [{ id: 'test' }],
        ground: { surfaceTile: 'tile_a' },
      };
      const result = parseChapterMapData(data);
      expect(result.decorations).toHaveLength(0);
    });

    it('parses basic decorations with defaults', () => {
      const data: ChapterMapData = {
        decorations: [{ key: 'deco_lamp_1', x: 100, y: 200 }],
      };
      const result = parseChapterMapData(data);
      expect(result.decorations).toHaveLength(1);
      const d = result.decorations[0];
      expect(d.key).toBe('deco_lamp_1');
      expect(d.x).toBe(100);
      expect(d.y).toBe(200);
      expect(d.scale).toBe(2);
      expect(d.depth).toBe(-5);
      expect(d.alpha).toBe(0.9);
      expect(d.flipX).toBe(false);
      expect(d.type).toBe('Decoration');
      expect(d.scrollFactor).toBe(0);
    });

    it('preserves explicit property values', () => {
      const data: ChapterMapData = {
        decorations: [{ key: 'deco_sign_bolt', x: 300, y: 400, scale: 1.5, depth: -3, alpha: 0.8, flipX: true }],
      };
      const result = parseChapterMapData(data);
      const d = result.decorations[0];
      expect(d.scale).toBe(1.5);
      expect(d.depth).toBe(-3);
      expect(d.alpha).toBe(0.8);
      expect(d.flipX).toBe(true);
    });

    it('categorizes Obstacle type decorations', () => {
      const data: ChapterMapData = {
        decorations: [
          { key: 'barricade_box', x: 500, y: 600, type: 'Obstacle', collisionShape: 'rect', destructible: true },
          { key: 'deco_lamp_1', x: 100, y: 200 },
        ],
      };
      const result = parseChapterMapData(data);
      expect(result.decorations).toHaveLength(2);
      expect(result.obstacles).toHaveLength(1);
      expect(result.obstacles[0].key).toBe('barricade_box');
      expect(result.obstacles[0].collisionShape).toBe('rect');
      expect(result.obstacles[0].destructible).toBe(true);
    });

    it('categorizes Marker type decorations and builds markers map', () => {
      const data: ChapterMapData = {
        decorations: [
          { key: 'marker_spawn', x: 200, y: 300, type: 'Marker', markerType: 'spawn', tag: 'enemy_spawn_1' },
          { key: 'marker_exit', x: 1000, y: 300, type: 'Marker', markerType: 'exit', tag: 'level_exit' },
        ],
      };
      const result = parseChapterMapData(data);
      expect(result.markers.size).toBe(2);

      const spawn = result.markers.get('enemy_spawn_1');
      expect(spawn).toBeDefined();
      expect(spawn!.x).toBe(200);
      expect(spawn!.y).toBe(300);
      expect(spawn!.markerType).toBe('spawn');

      const exit = result.markers.get('level_exit');
      expect(exit).toBeDefined();
      expect(exit!.x).toBe(1000);
      expect(exit!.markerType).toBe('exit');
    });

    it('generates default tag for Marker without tag', () => {
      const data: ChapterMapData = {
        decorations: [{ key: 'marker_generic', x: 150, y: 250, type: 'Marker', markerType: 'custom' }],
      };
      const result = parseChapterMapData(data);
      expect(result.markers.size).toBe(1);
      // Should use fallback tag based on coordinates
      expect(result.markers.has('marker_150_250')).toBe(true);
    });

    it('categorizes Background type with scrollFactor', () => {
      const data: ChapterMapData = {
        decorations: [{ key: 'parallax_bg', x: 640, y: 360, type: 'Background', scrollFactor: 0.3 }],
      };
      const result = parseChapterMapData(data);
      expect(result.backgrounds).toHaveLength(1);
      expect(result.backgrounds[0].scrollFactor).toBe(0.3);
    });

    it('loads zones from map data', () => {
      const data: ChapterMapData = {
        decorations: [],
        zones: [
          { type: 'danger', x: 100, y: 200, w: 300, h: 100, tag: 'lava_zone' },
          { type: 'safe', x: 500, y: 200, w: 200, h: 100 },
        ],
      };
      const result = parseChapterMapData(data);
      expect(result.zones).toHaveLength(2);
      expect(result.zones[0].type).toBe('danger');
      expect(result.zones[0].tag).toBe('lava_zone');
      expect(result.zones[0].w).toBe(300);
      expect(result.zones[1].type).toBe('safe');
      expect(result.zones[1].tag).toBeUndefined();
    });

    it('handles mixed decoration types in single list', () => {
      const data: ChapterMapData = {
        decorations: [
          { key: 'lamp', x: 100, y: 200 },
          { key: 'box', x: 200, y: 300, type: 'Obstacle' },
          { key: 'spawn', x: 300, y: 400, type: 'Marker', tag: 'sp1' },
          { key: 'bg', x: 640, y: 360, type: 'Background', scrollFactor: 0.5 },
          { key: 'vending', x: 500, y: 300 },
        ],
      };
      const result = parseChapterMapData(data);
      expect(result.decorations).toHaveLength(5);
      expect(result.obstacles).toHaveLength(1);
      expect(result.markers.size).toBe(1);
      expect(result.backgrounds).toHaveLength(1);
    });

    it('handles Overlay type with blendMode', () => {
      const data: ChapterMapData = {
        decorations: [{ key: 'fog_overlay', x: 640, y: 360, type: 'Overlay', blendMode: 'MULTIPLY' }],
      };
      const result = parseChapterMapData(data);
      expect(result.decorations[0].blendMode).toBe('MULTIPLY');
      expect(result.decorations[0].type).toBe('Overlay');
    });
  });

  describe('getScrollFactor', () => {
    it('returns 0 for regular Decoration type', () => {
      const deco: ParsedDecoration = {
        key: 'lamp',
        x: 0,
        y: 0,
        scale: 2,
        depth: -5,
        alpha: 0.9,
        flipX: false,
        type: 'Decoration',
        scrollFactor: 0,
      };
      expect(getScrollFactor(deco)).toBe(0);
    });

    it('returns scrollFactor for Background type with non-zero value', () => {
      const deco: ParsedDecoration = {
        key: 'bg',
        x: 0,
        y: 0,
        scale: 1,
        depth: -10,
        alpha: 1,
        flipX: false,
        type: 'Background',
        scrollFactor: 0.3,
      };
      expect(getScrollFactor(deco)).toBe(0.3);
    });

    it('returns 0 for Background type with zero scrollFactor', () => {
      const deco: ParsedDecoration = {
        key: 'bg',
        x: 0,
        y: 0,
        scale: 1,
        depth: -10,
        alpha: 1,
        flipX: false,
        type: 'Background',
        scrollFactor: 0,
      };
      expect(getScrollFactor(deco)).toBe(0);
    });

    it('returns 0 for Obstacle type even with scrollFactor set', () => {
      const deco: ParsedDecoration = {
        key: 'box',
        x: 0,
        y: 0,
        scale: 2,
        depth: -5,
        alpha: 0.9,
        flipX: false,
        type: 'Obstacle',
        scrollFactor: 0.5,
      };
      expect(getScrollFactor(deco)).toBe(0);
    });
  });

  describe('parseTilemapData', () => {
    it('returns empty layers for null input', () => {
      const result = parseTilemapData(null);
      expect(result.tileSize).toBe(32);
      expect(result.layers).toHaveLength(0);
    });

    it('returns empty layers for undefined input', () => {
      const result = parseTilemapData(undefined);
      expect(result.tileSize).toBe(32);
      expect(result.layers).toHaveLength(0);
    });

    it('returns empty layers for tilemap with no tiles', () => {
      const raw: RawTilemapLayers = { ground: {}, wall: {} };
      const result = parseTilemapData(raw);
      expect(result.layers).toHaveLength(0);
    });

    it('parses a single tile correctly', () => {
      const raw: RawTilemapLayers = {
        ground: { '2_3': 'floor_tile_brick' },
      };
      const result = parseTilemapData(raw);
      expect(result.tileSize).toBe(32);
      expect(result.layers).toHaveLength(1);
      expect(result.layers[0].name).toBe('ground');
      // Grid should be at least 4 rows (0-3) and 3 cols (0-2)
      expect(result.layers[0].grid.length).toBe(4);
      expect(result.layers[0].grid[3][2]).toBe('floor_tile_brick');
      // Empty cells should be null
      expect(result.layers[0].grid[0][0]).toBeNull();
      expect(result.layers[0].grid[0][1]).toBeNull();
    });

    it('parses multi-layer tilemap', () => {
      const raw: RawTilemapLayers = {
        ground: { '0_0': 'floor_a', '1_0': 'floor_b' },
        wall: { '0_0': 'wall_top' },
      };
      const result = parseTilemapData(raw);
      expect(result.layers).toHaveLength(2);

      const groundLayer = result.layers.find((l) => l.name === 'ground');
      const wallLayer = result.layers.find((l) => l.name === 'wall');
      expect(groundLayer).toBeDefined();
      expect(wallLayer).toBeDefined();
      expect(groundLayer!.grid[0][0]).toBe('floor_a');
      expect(groundLayer!.grid[0][1]).toBe('floor_b');
      expect(wallLayer!.grid[0][0]).toBe('wall_top');
    });

    it('handles sparse grid correctly', () => {
      const raw: RawTilemapLayers = {
        ground: { '0_0': 'tile_a', '5_8': 'tile_b' },
      };
      const result = parseTilemapData(raw);
      expect(result.layers).toHaveLength(1);
      const grid = result.layers[0].grid;
      // Grid should span from (0,0) to (5,8)
      expect(grid.length).toBe(9); // rows 0-8
      expect(grid[0].length).toBe(6); // cols 0-5
      expect(grid[0][0]).toBe('tile_a');
      expect(grid[8][5]).toBe('tile_b');
      // Middle cells should be null
      expect(grid[4][3]).toBeNull();
    });

    it('respects custom tileSize', () => {
      const raw: RawTilemapLayers = { ground: { '0_0': 'tile' } };
      const result = parseTilemapData(raw, 64);
      expect(result.tileSize).toBe(64);
    });

    it('skips invalid coordinate keys', () => {
      const raw: RawTilemapLayers = {
        ground: { '0_0': 'tile_a', bad_key: 'tile_b', x_y: 'tile_c' },
      };
      const result = parseTilemapData(raw);
      expect(result.layers).toHaveLength(1);
      // Only '0_0' should be parsed
      expect(result.layers[0].grid[0][0]).toBe('tile_a');
    });
  });
});
