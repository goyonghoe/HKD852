import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  ATLAS_FRAME_MAP,
  ATLAS_COVERED_KEYS,
  getAtlasForKey,
  validateTextureKeys,
} from '../../src/config/atlas-manifest';
import { SPRITE_KEYS } from '../../src/config/sprite-keys';

const ATLAS_DIR = resolve(__dirname, '../../public/assets/atlas');

describe('Atlas Manifest — TASK-025', () => {
  it('has all 5 atlas entries', () => {
    const names = Object.keys(ATLAS_FRAME_MAP);
    expect(names).toContain('ui-atlas');
    expect(names).toContain('deco-atlas');
    expect(names).toContain('env-atlas');
    expect(names).toContain('fx-atlas');
    expect(names).toContain('char-atlas');
    expect(names.length).toBe(5);
  });

  it('ATLAS_COVERED_KEYS is the union of all atlas frames', () => {
    const allFrames = Object.values(ATLAS_FRAME_MAP).flat();
    expect(ATLAS_COVERED_KEYS.size).toBe(new Set(allFrames).size);
    for (const frame of allFrames) {
      expect(ATLAS_COVERED_KEYS.has(frame)).toBe(true);
    }
  });

  it('getAtlasForKey returns correct atlas for known keys', () => {
    expect(getAtlasForKey('hand_biker')).toBe('char-atlas');
    expect(getAtlasForKey('deco_lamp_1')).toBe('deco-atlas');
    expect(getAtlasForKey('env_barrel')).toBe('env-atlas');
    expect(getAtlasForKey('projectile_bullet')).toBe('fx-atlas');
    expect(getAtlasForKey('icon_bomb')).toBe('ui-atlas');
  });

  it('getAtlasForKey returns undefined for keys not in any atlas', () => {
    expect(getAtlasForKey('player')).toBeUndefined();
    expect(getAtlasForKey('boss_aero')).toBeUndefined();
    expect(getAtlasForKey('nonexistent_key')).toBeUndefined();
  });

  it('no duplicate frames across atlases', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const frames of Object.values(ATLAS_FRAME_MAP)) {
      for (const frame of frames) {
        if (seen.has(frame)) duplicates.push(frame);
        seen.add(frame);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('atlas JSON files on disk match manifest entries', () => {
    for (const [atlasName, manifestFrames] of Object.entries(ATLAS_FRAME_MAP)) {
      const jsonPath = resolve(ATLAS_DIR, `${atlasName}.json`);
      if (!existsSync(jsonPath)) continue; // skip if atlas not built yet

      const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      const diskFrames: string[] = [];
      for (const texture of data.textures ?? []) {
        for (const frame of texture.frames ?? []) {
          diskFrames.push(frame.filename.replace(/\.png$/, ''));
        }
      }

      // Every disk frame should be in the manifest
      for (const diskFrame of diskFrames) {
        expect((manifestFrames as readonly string[]).includes(diskFrame)).toBe(true);
      }
    }
  });

  it('atlas-covered SPRITE_KEYS are not double-loaded', () => {
    // Verify that every SPRITE_KEY in an atlas is in ATLAS_COVERED_KEYS
    const coveredSpriteKeys = SPRITE_KEYS.filter((k) => ATLAS_COVERED_KEYS.has(k));
    expect(coveredSpriteKeys.length).toBeGreaterThan(0);

    // Read PreloadScene source to verify the skip pattern
    const preloadSrc = readFileSync(resolve(__dirname, '../../src/scenes/PreloadScene.ts'), 'utf-8');
    expect(preloadSrc).toContain('ATLAS_COVERED_KEYS.has');
    expect(preloadSrc).toContain('continue');
  });
});

describe('validateTextureKeys — TASK-057', () => {
  const proceduralKeys = new Set(['player', 'particle_square', 'particle_glow']);

  function mockScene(existingKeys: string[]) {
    const keySet = new Set(existingKeys);
    return { textures: { exists: (key: string) => keySet.has(key) } };
  }

  it('returns empty array when all keys are resolvable via standalone textures', () => {
    const scene = mockScene(['boss_aero', 'bg_wanchai']);
    const missing = validateTextureKeys(scene, ['boss_aero', 'bg_wanchai'], new Set());
    expect(missing).toEqual([]);
  });

  it('returns empty array when keys are resolvable via atlas', () => {
    // hand_biker is in char-atlas; if char-atlas exists, it should resolve
    const scene = mockScene(['char-atlas']);
    const missing = validateTextureKeys(scene, ['hand_biker'], new Set());
    expect(missing).toEqual([]);
  });

  it('skips procedural-only keys', () => {
    // 'player' is procedural — should not appear in missing even with empty scene
    const scene = mockScene([]);
    const missing = validateTextureKeys(scene, ['player', 'particle_square'], proceduralKeys);
    expect(missing).toEqual([]);
  });

  it('reports keys that are not standalone, not in atlas, and not procedural', () => {
    const scene = mockScene([]);
    const missing = validateTextureKeys(scene, ['boss_aero', 'player'], proceduralKeys);
    expect(missing).toEqual(['boss_aero']);
  });

  it('handles mixed resolvable and missing keys', () => {
    const scene = mockScene(['char-atlas', 'boss_aero']);
    const keys = ['hand_biker', 'boss_aero', 'nonexistent_sprite', 'player'];
    const missing = validateTextureKeys(scene, keys, proceduralKeys);
    expect(missing).toEqual(['nonexistent_sprite']);
  });

  it('returns empty array for empty sprite key list', () => {
    const scene = mockScene([]);
    const missing = validateTextureKeys(scene, [], new Set());
    expect(missing).toEqual([]);
  });
});
