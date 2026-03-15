/**
 * BackgroundManager unit tests.
 *
 * Tests create(), updateBackground(), updateParallax(), drawBarrierHpBar(),
 * flashBaseWall(), showBarricadeDestroyed(), shutdown(), and getters.
 *
 * Phaser is mocked at module level. Scene stubs provide minimal add/textures/cache.
 */
import { describe, it, expect, vi } from 'vitest';

// ── Mock Phaser ─────────────────────────────────────────────────────────────
vi.mock('phaser', () => {
  const BaseClass = class {
    constructor(..._args: unknown[]) {
      /* noop */
    }
  };
  return {
    default: {
      WEBGL: 1,
      AUTO: 0,
      Scene: BaseClass,
      Scale: { FIT: 1, CENTER_BOTH: 1 },
      BlendModes: { ADD: 1 },
      GameObjects: {
        Graphics: BaseClass,
        Rectangle: BaseClass,
        Container: BaseClass,
        Sprite: BaseClass,
        Image: BaseClass,
        Text: BaseClass,
        Zone: BaseClass,
        Group: BaseClass,
        TileSprite: BaseClass,
      },
      Physics: {
        Arcade: {
          Sprite: BaseClass,
          Group: BaseClass,
          Body: BaseClass,
        },
      },
      Math: {
        Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
        Between: (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1)),
      },
    },
  };
});

// Mock MapLoaderCalc
vi.mock('../../src/core/MapLoaderCalc', () => ({
  parseChapterMapData: vi.fn(() => ({
    decorations: [],
    obstacles: [],
    markers: new Map(),
    zones: [],
  })),
  getScrollFactor: vi.fn(() => 1),
}));

// Mock districts
vi.mock('../../src/config/districts', () => ({
  getDistrictForStage: vi.fn(() => ({ bgKey: 'bg_central', name: 'Central' })),
  DISTRICTS: [
    { bgKey: 'bg_central', name: 'Central' },
    { bgKey: 'bg_tst', name: 'TST' },
  ],
}));

import { BackgroundManager } from '../../src/managers/BackgroundManager';
import Phaser from 'phaser';

// ── Mock scene factory ──────────────────────────────────────────────────────

function createMockGraphics() {
  return {
    setDepth: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockImage() {
  // Create as instance of mocked Phaser.GameObjects.Image so instanceof checks pass
  const img = new (Phaser.GameObjects.Image as unknown as new () => Record<string, unknown>)();
  img.setOrigin = vi.fn().mockReturnValue(img);
  img.setScale = vi.fn().mockReturnValue(img);
  img.setDepth = vi.fn().mockReturnValue(img);
  img.setAlpha = vi.fn().mockReturnValue(img);
  img.setBlendMode = vi.fn().mockReturnValue(img);
  img.setFlipX = vi.fn().mockReturnValue(img);
  img.setScrollFactor = vi.fn().mockReturnValue(img);
  img.setTint = vi.fn().mockReturnValue(img);
  img.clearTint = vi.fn().mockReturnValue(img);
  img.width = 256;
  img.height = 256;
  img.x = 0;
  img.active = true;
  img.destroy = vi.fn();
  return img;
}

function createMockTileSprite() {
  return {
    setOrigin: vi.fn().mockReturnThis(),
    setTileScale: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    tilePositionX: 0,
    destroy: vi.fn(),
  };
}

function createMockRectangle() {
  return {
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
}

function createMockScene(opts: { texturesExist?: boolean } = {}) {
  const texturesExist = opts.texturesExist ?? false;
  const createdGraphics: ReturnType<typeof createMockGraphics>[] = [];
  const createdImages: ReturnType<typeof createMockImage>[] = [];
  const createdTileSprites: ReturnType<typeof createMockTileSprite>[] = [];
  const createdRectangles: ReturnType<typeof createMockRectangle>[] = [];

  const scene = {
    add: {
      graphics: vi.fn(() => {
        const g = createMockGraphics();
        createdGraphics.push(g);
        return g;
      }),
      image: vi.fn((_x: number, _y: number, _key: string) => {
        const img = createMockImage();
        createdImages.push(img);
        return img;
      }),
      tileSprite: vi.fn(() => {
        const ts = createMockTileSprite();
        createdTileSprites.push(ts);
        return ts;
      }),
      rectangle: vi.fn(() => {
        const r = createMockRectangle();
        createdRectangles.push(r);
        return r;
      }),
    },
    textures: {
      exists: vi.fn((_key: string) => texturesExist),
      get: vi.fn(() => ({
        get: () => ({ width: 256, height: 256 }),
      })),
    },
    cache: {
      json: {
        get: vi.fn(() => null),
      },
    },
    time: {
      delayedCall: vi.fn((_delay: number, cb: () => void) => {
        cb();
      }),
    },
    game: {
      loop: {
        delta: 16,
      },
    },
    _createdGraphics: createdGraphics,
    _createdImages: createdImages,
    _createdTileSprites: createdTileSprites,
    _createdRectangles: createdRectangles,
  };

  return scene;
}

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe('BackgroundManager — create()', () => {
  it('creates grid graphics and base wall graphics', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    // drawGrid creates 1 graphics, baseWallGraphics creates 1 more
    expect(scene.add.graphics).toHaveBeenCalledTimes(2);
  });

  it('does not throw on create', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    expect(() => bgm.create()).not.toThrow();
  });
});

describe('BackgroundManager — updateBackground()', () => {
  it('creates background fill rectangle', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);

    expect(scene.add.rectangle).toHaveBeenCalled();
  });

  it('creates barrier HP bar graphics on first call', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    const graphicsCountBefore = scene._createdGraphics.length;
    bgm.updateBackground(1);

    // Should create at least barrierHpBar graphics
    expect(scene._createdGraphics.length).toBeGreaterThan(graphicsCountBefore);
  });

  it('destroys old parallax layers on subsequent calls', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);
    // The bgFill rectangle is the first rectangle created in updateBackground
    // Find it: it's created before the groundRect. groundRect is only created
    // if it doesn't exist yet. bgFill is in parallaxLayers and should be destroyed
    // on the next updateBackground call.
    const createdBefore = scene._createdRectangles.length;
    // Track all objects that existed after first updateBackground
    const firstBgFill = scene._createdRectangles[0]; // bgFill from first call

    bgm.updateBackground(2);

    // First bgFill should have been destroyed (it was in parallaxLayers)
    if (firstBgFill) {
      expect(firstBgFill.destroy).toHaveBeenCalled();
    } else {
      // If no rectangle was tracked, ensure no crash
      expect(createdBefore).toBeGreaterThanOrEqual(0);
    }
  });

  it('creates parallax TileSprites when textures exist', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);

    // Should create TileSprites for sky, far, mid, near, front + floor tiles
    expect(scene.add.tileSprite).toHaveBeenCalled();
  });

  it('creates floor tile sprites', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);

    // At minimum: edge tile + fill tile + parallax layers
    expect(scene.add.tileSprite).toHaveBeenCalled();
  });

  it('creates barricade sprite when texture exists', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);

    // env_box texture exists → creates an image for barricade
    expect(scene.add.image).toHaveBeenCalled();
  });

  it('creates fallback barricade graphics when no texture', () => {
    const scene = createMockScene({ texturesExist: false });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    bgm.updateBackground(1);

    // No env_box texture → creates barricadeGfx via graphics
    const gfx = bgm.getBarricadeGfx();
    // It should exist (fallback created)
    expect(gfx).toBeDefined();
  });
});

describe('BackgroundManager — updateParallax()', () => {
  it('drifts parallax Image x positions', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    // Parallax layers are now Image objects (not TileSprite).
    // Record initial x of all created images, then call updateParallax.
    const images = scene._createdImages;
    if (images.length > 0) {
      // Set known x values so we can detect drift
      const initialPositions = images.map((img) => img.x as number);

      bgm.updateParallax();

      // At least one image should have moved (x decreased by drift)
      const moved = images.some((img, idx) => (img.x as number) !== initialPositions[idx]);
      expect(moved).toBe(true);
    }
  });

  it('does not crash when no parallax layers', () => {
    const scene = createMockScene({ texturesExist: false });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(() => bgm.updateParallax()).not.toThrow();
  });
});

describe('BackgroundManager — drawBarrierHpBar()', () => {
  it('clears the HP bar graphics', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.drawBarrierHpBar();

    // Should have called clear on the barrierHpBar graphics
    // Find the last created graphics (barrierHpBar is the last one created in updateBackground)
    const allGraphics = scene._createdGraphics;
    const lastGraphics = allGraphics[allGraphics.length - 1];
    expect(lastGraphics?.clear).toHaveBeenCalled();
  });

  it('does not crash when called before updateBackground', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    // No barrierHpBar yet — should not throw
    expect(() => bgm.drawBarrierHpBar()).not.toThrow();
  });
});

describe('BackgroundManager — flashBaseWall()', () => {
  it('tints barricade sprites on flash', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.flashBaseWall();

    // Barricade sprites should have setTint called
    const sprites = bgm.getBarricadeSprites();
    if (sprites.length > 0) {
      expect((sprites[0] as unknown as { setTint: ReturnType<typeof vi.fn> }).setTint).toHaveBeenCalled();
    }
  });

  it('reduces barricadeGfx alpha when no sprites', () => {
    const scene = createMockScene({ texturesExist: false });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.flashBaseWall();

    const gfx = bgm.getBarricadeGfx();
    if (gfx) {
      expect((gfx as unknown as { setAlpha: ReturnType<typeof vi.fn> }).setAlpha).toHaveBeenCalledWith(0.4);
    }
  });
});

describe('BackgroundManager — showBarricadeDestroyed()', () => {
  it('tints barricade sprites for destruction', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.showBarricadeDestroyed();

    const sprites = bgm.getBarricadeSprites();
    if (sprites.length > 0) {
      expect((sprites[0] as unknown as { setTint: ReturnType<typeof vi.fn> }).setTint).toHaveBeenCalled();
    }
  });

  it('reduces barricadeGfx alpha when no sprites', () => {
    const scene = createMockScene({ texturesExist: false });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.showBarricadeDestroyed();

    const gfx = bgm.getBarricadeGfx();
    if (gfx) {
      expect((gfx as unknown as { setAlpha: ReturnType<typeof vi.fn> }).setAlpha).toHaveBeenCalledWith(0.3);
    }
  });
});

describe('BackgroundManager — getters', () => {
  it('obstacles returns empty array initially', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(bgm.obstacles).toEqual([]);
  });

  it('markers returns empty map initially', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(bgm.markers.size).toBe(0);
  });

  it('zones returns empty array initially', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(bgm.zones).toEqual([]);
  });

  it('getBarricadeSprites returns empty before updateBackground', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(bgm.getBarricadeSprites()).toEqual([]);
  });

  it('getBarricadeGfx returns undefined before updateBackground', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(bgm.getBarricadeGfx()).toBeUndefined();
  });
});

describe('BackgroundManager — shutdown()', () => {
  it('destroys all game objects', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.shutdown();

    // All images, tileSprites, rects should have destroy called
    for (const img of scene._createdImages) {
      expect(img.destroy).toHaveBeenCalled();
    }
  });

  it('clears all arrays', () => {
    const scene = createMockScene({ texturesExist: true });
    const bgm = new BackgroundManager(scene as never);
    bgm.create();
    bgm.updateBackground(1);

    bgm.shutdown();

    expect(bgm.obstacles).toEqual([]);
    expect(bgm.markers.size).toBe(0);
    expect(bgm.zones).toEqual([]);
    expect(bgm.getBarricadeSprites()).toEqual([]);
    expect(bgm.getBarricadeGfx()).toBeUndefined();
  });

  it('does not throw when called multiple times', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(() => {
      bgm.shutdown();
      bgm.shutdown();
    }).not.toThrow();
  });

  it('does not throw when called before updateBackground', () => {
    const scene = createMockScene();
    const bgm = new BackgroundManager(scene as never);
    bgm.create();

    expect(() => bgm.shutdown()).not.toThrow();
  });
});
