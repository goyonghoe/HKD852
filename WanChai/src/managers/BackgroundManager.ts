import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { NEON, BG_COLOR, GROUND_COLORS, BARRICADE_COLORS } from '../config/colors';
import { getDistrictForStage, DISTRICTS } from '../config/districts';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import {
  parseChapterMapData,
  getScrollFactor,
  type ChapterMapData,
  type ParsedDecoration,
  type MapMarkerEntry,
  type RawZone,
} from '../core/MapLoaderCalc';
import { resolveTexture } from '../config/atlas-manifest';

// Map district index (0-based) → CraftPix parallax set (1-based)
const DISTRICT_PARALLAX_MAP: Record<number, number> = {
  0: 1, // Central
  1: 2, // TST/WanChai
  2: 3, // Mongkok
  3: 4, // Sham Shui Po
  4: 5, // Wong Tai Sin
  5: 6, // Lantau
  6: 7, // Aberdeen
  7: 8, // Kowloon
};

/**
 * BackgroundManager — owns parallax layers, floor tiles, decorations,
 * barricade visuals, barrier HP bar, and the base-wall graphics.
 *
 * Extracted from RunScene to reduce its size.
 */
export class BackgroundManager {
  private scene: Phaser.Scene;

  // Parallax
  private parallaxLayers: Phaser.GameObjects.GameObject[] = [];
  private parallaxTileSprites: Phaser.GameObjects.Image[] = [];

  // Decorations
  private decoSprites: Phaser.GameObjects.Image[] = [];
  private obstacleDecos: ParsedDecoration[] = [];
  private mapMarkersMap: Map<string, MapMarkerEntry> = new Map();
  private mapZones: RawZone[] = [];

  // Floor
  private floorTileSprites: Phaser.GameObjects.TileSprite[] = [];
  private groundRect?: Phaser.GameObjects.Rectangle;

  // Barricade / barrier
  private barricadeSprites: Phaser.GameObjects.Image[] = [];
  private barricadeGfx?: Phaser.GameObjects.Graphics;
  private barrierHpBar?: Phaser.GameObjects.Graphics;

  // Base wall
  private baseWallGraphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Called once in RunScene.create() — draws grid + creates base wall graphics */
  create(): void {
    this.parallaxLayers = [];
    this.parallaxTileSprites = [];
    this.floorTileSprites = [];

    this.drawGrid();
    this.baseWallGraphics = this.scene.add.graphics().setDepth(10);
    this.drawBaseWall();
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /** Rebuild background for the current stage (called on stage change) */
  updateBackground(stage: number): void {
    // Destroy old parallax layers
    for (const layer of this.parallaxLayers) {
      layer.destroy();
    }
    this.parallaxLayers = [];

    // Dark fill behind everything
    const bgFill = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BG_COLOR, 1);
    bgFill.setOrigin(0.5).setDepth(-20);
    this.parallaxLayers.push(bgFill);

    // Determine district and parallax set
    const district = getDistrictForStage(stage);
    const districtIndex = district ? DISTRICTS.indexOf(district) : 0;
    const parallaxSet = DISTRICT_PARALLAX_MAP[districtIndex] ?? 1;

    // === PRIMARY BACKGROUND: district-specific bgKey image ===
    const districtBgKey = district?.bgKey;
    if (districtBgKey && this.scene.textures.exists(districtBgKey)) {
      const bgImg = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, districtBgKey);
      bgImg.setOrigin(0.5);
      const scaleX = GAME_WIDTH / bgImg.width;
      const scaleY = GAME_HEIGHT / bgImg.height;
      bgImg.setScale(Math.max(scaleX, scaleY));
      bgImg.setDepth(-18);
      bgImg.setAlpha(0.9);
      this.parallaxLayers.push(bgImg);
    }

    // Read chapter JSON for custom bgLayers / ground from Deploy pipeline
    const mapKey = `map_chapter_${parallaxSet}`;
    const chapterMap = this.scene.cache.json.get(mapKey) as {
      bgLayers?: { id: string; alpha?: number; raw?: boolean }[];
      ground?: { surfaceTile?: string; fillTile?: string };
    } | null;

    // === ATMOSPHERE LAYERS (parallax overlays on top of district bg) ===
    const customBgLayers = chapterMap?.bgLayers ?? [];
    let usedCustomBg = false;

    // Try custom bgLayers from chapter JSON (Deploy pipeline)
    if (customBgLayers.length > 0) {
      for (let i = 0; i < customBgLayers.length; i++) {
        const layer = customBgLayers[i];
        const key = layer.id;
        if (!this.scene.textures.exists(key)) continue;
        const img = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key);
        img.setOrigin(0.5);
        const scaleX = GAME_WIDTH / img.width;
        const scaleY = GAME_HEIGHT / img.height;
        img.setScale(Math.max(scaleX, scaleY));
        img.setDepth(-15 + i);
        img.setAlpha(layer.alpha ?? 0.6 + i * 0.08);
        this.parallaxLayers.push(img);
        usedCustomBg = true;
      }
    }

    // TASK-215: Parallax atmosphere layers as TileSprites for scrolling
    // Destroy old TileSprite parallax layers
    for (const ts of this.parallaxTileSprites) {
      ts.destroy();
    }
    this.parallaxTileSprites = [];

    if (!usedCustomBg) {
      const layerNames = ['sky', 'far', 'mid', 'near', 'front'];
      for (let i = 0; i < layerNames.length; i++) {
        const key = `parallax_${parallaxSet}_${layerNames[i]}`;
        if (!this.scene.textures.exists(key)) continue;
        // Use cover-fit Image instead of TileSprite to avoid tiling artifacts
        const img = this.scene.add.image(GAME_WIDTH / 2, BALANCE.GROUND.y / 2, key);
        img.setOrigin(0.5);
        const scaleX = GAME_WIDTH / img.width;
        const scaleY = BALANCE.GROUND.y / img.height;
        img.setScale(Math.max(scaleX, scaleY));
        img.setDepth(-15 + i); // -15 to -11
        img.setAlpha(0.3 + i * 0.08); // 0.30, 0.38, 0.46, 0.54, 0.62
        this.parallaxLayers.push(img);
        this.parallaxTileSprites.push(img);
      }
    }

    // === OVERLAY ILLUMINATION (neon glow) ===
    const overlayKey = `parallax_${parallaxSet}_overlay`;
    if (this.scene.textures.exists(overlayKey)) {
      const overlay = this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, overlayKey);
      overlay.setOrigin(0.5);
      const oScaleX = GAME_WIDTH / overlay.width;
      const oScaleY = GAME_HEIGHT / overlay.height;
      overlay.setScale(Math.max(oScaleX, oScaleY));
      overlay.setDepth(-6);
      overlay.setBlendMode(Phaser.BlendModes.ADD);
      overlay.setAlpha(0.35);
      this.parallaxLayers.push(overlay);
    }

    // === MAP DECORATIONS (signboards, lamps, vending machines, etc.) ===
    for (const deco of this.decoSprites) {
      deco.destroy();
    }
    this.decoSprites = [];
    this.loadChapterDecorations(parallaxSet);

    // === TASK-216: FLOOR TILES via TileSprite (y:540-636, 96px height) ===
    // Destroy old floor TileSprites
    for (const ft of this.floorTileSprites) {
      ft.destroy();
    }
    this.floorTileSprites = [];

    const groundY = BALANCE.GROUND.y;
    const tileSize = BALANCE.GROUND.tileSize;
    const rows = BALANCE.LAYOUT.GROUND_ROWS;
    const groundHeight = rows * tileSize; // 96px

    // Use custom ground tiles from chapter JSON if available
    const customGround = chapterMap?.ground;
    const customSurface = customGround?.surfaceTile;
    const customFill = customGround?.fillTile;

    // Row 0 (top): edge tile — surface/edge strip
    const edgeKey = customSurface && this.scene.textures.exists(customSurface) ? customSurface : 'floor_tile_edge';
    if (this.scene.textures.exists(edgeKey)) {
      const edgeTile = this.scene.add.tileSprite(
        GAME_WIDTH / 2,
        groundY + tileSize / 2, // center of first row
        GAME_WIDTH,
        tileSize,
        edgeKey,
      );
      edgeTile.setOrigin(0.5);
      edgeTile.setDepth(1);
      this.floorTileSprites.push(edgeTile);
    }

    // Rows 1-2 (fill): brick tile — main floor body
    const fillKey = customFill && this.scene.textures.exists(customFill) ? customFill : 'floor_tile_brick';
    if (this.scene.textures.exists(fillKey)) {
      const fillHeight = (rows - 1) * tileSize; // 64px (2 rows)
      const fillTile = this.scene.add.tileSprite(
        GAME_WIDTH / 2,
        groundY + tileSize + fillHeight / 2, // center of rows 1-2
        GAME_WIDTH,
        fillHeight,
        fillKey,
      );
      fillTile.setOrigin(0.5);
      fillTile.setDepth(1);
      this.floorTileSprites.push(fillTile);
    }

    // Dummy rect for groundRect reference (needed by collision code)
    if (!this.groundRect) {
      this.groundRect = this.scene.add.rectangle(
        GAME_WIDTH / 2,
        groundY + groundHeight / 2,
        GAME_WIDTH,
        groundHeight,
        GROUND_COLORS.FILL,
        0,
      );
      this.groundRect.setDepth(-2);
    }

    // Create barricade
    if (this.barricadeSprites.length === 0) {
      this.createBarricade();
    }

    // Create barrier HP bar
    if (!this.barrierHpBar) {
      this.barrierHpBar = this.scene.add.graphics().setDepth(15);
    }
  }

  /** TASK-215: Update parallax Image scroll each frame (slow drift) */
  updateParallax(): void {
    const speeds = BALANCE.PARALLAX.layerSpeeds;
    const baseSpeed = BALANCE.PARALLAX.baseScrollSpeed;
    const dt = this.scene.game.loop.delta / 1000; // seconds since last frame
    for (let i = 0; i < this.parallaxTileSprites.length; i++) {
      const speed = speeds[i] ?? 0.1;
      // Drift image leftward (enemies approach from right → world scrolls left)
      this.parallaxTileSprites[i].x -= baseSpeed * speed * dt;
      // Wrap: when image drifts too far left, reset to center
      if (this.parallaxTileSprites[i].x < -GAME_WIDTH / 2) {
        this.parallaxTileSprites[i].x = GAME_WIDTH / 2;
      }
    }
  }

  /** Barrier HP bar above barricade — disabled (redundant with base HP bar at screen bottom) */
  drawBarrierHpBar(): void {
    if (!this.barrierHpBar) return;
    this.barrierHpBar.clear();
  }

  /** Flash base wall / barricade on damage */
  flashBaseWall(): void {
    // Flash barricade sprites/graphics red
    if (this.barricadeSprites.length > 0) {
      for (const s of this.barricadeSprites) {
        if (s instanceof Phaser.GameObjects.Image) {
          s.setTint(BARRICADE_COLORS.DAMAGE_FLASH_TINT);
          this.scene.time.delayedCall(BALANCE.BARRIER.damageFlashMs, () => {
            if (s.active) s.clearTint();
          });
        }
      }
    } else if (this.barricadeGfx) {
      this.barricadeGfx.setAlpha(0.4);
      this.scene.time.delayedCall(BALANCE.BARRIER.damageFlashMs, () => {
        if (this.barricadeGfx) this.barricadeGfx.setAlpha(1);
      });
    }
  }

  /** Tint barricade to show barrier destruction */
  showBarricadeDestroyed(): void {
    if (this.barricadeSprites.length > 0) {
      for (const s of this.barricadeSprites) s.setTint(BARRICADE_COLORS.DESTROYED_TINT);
    } else if (this.barricadeGfx) {
      this.barricadeGfx.setAlpha(0.3);
    }
  }

  /** Get obstacle decorations (for collision logic) */
  get obstacles(): ParsedDecoration[] {
    return this.obstacleDecos;
  }

  /** Get map markers */
  get markers(): Map<string, MapMarkerEntry> {
    return this.mapMarkersMap;
  }

  /** Get map zones */
  get zones(): RawZone[] {
    return this.mapZones;
  }

  /** Get barricade sprites (for tint logic in applyBaseDamage) */
  getBarricadeSprites(): Phaser.GameObjects.Image[] {
    return this.barricadeSprites;
  }

  /** Get barricade graphics fallback */
  getBarricadeGfx(): Phaser.GameObjects.Graphics | undefined {
    return this.barricadeGfx;
  }

  /** Cleanup all background resources */
  shutdown(): void {
    // Parallax layers
    for (const layer of this.parallaxLayers) {
      layer.destroy();
    }
    this.parallaxLayers = [];
    this.parallaxTileSprites = [];

    // Floor tiles
    for (const ft of this.floorTileSprites) {
      ft.destroy();
    }
    this.floorTileSprites = [];

    // Decorations
    for (const deco of this.decoSprites) {
      deco.destroy();
    }
    this.decoSprites = [];
    this.obstacleDecos = [];
    this.mapMarkersMap.clear();
    this.mapZones = [];

    // Barricade
    for (const spr of this.barricadeSprites) {
      spr.destroy();
    }
    this.barricadeSprites = [];
    if (this.barricadeGfx) {
      this.barricadeGfx.destroy();
      this.barricadeGfx = undefined;
    }
  }

  // ------------------------------------------------------------------
  // Private methods
  // ------------------------------------------------------------------

  private drawGrid(): void {
    const g = this.scene.add.graphics().setDepth(0);
    g.lineStyle(1, NEON.UI_BORDER, 0.15);
    const step = 64;
    for (let x = 0; x <= GAME_WIDTH; x += step) {
      g.moveTo(x, 0);
      g.lineTo(x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += step) {
      g.moveTo(0, y);
      g.lineTo(GAME_WIDTH, y);
    }
    g.strokePath();
  }

  private drawBaseWall(): void {
    this.baseWallGraphics.clear();
    // No debug rectangle — barricade sprites are the visual
  }

  /** Create barricade as a single small box in front of the player (visual only) */
  private createBarricade(): void {
    const bx = BALANCE.BARRIER.x;
    const groundY = BALANCE.BARRIER.y;

    // Single small box: ~1/3 player size, sitting on the ground just right of player
    const boxKey = 'env_box';
    const boxTex = resolveTexture(this.scene, boxKey);
    if (boxTex) {
      const boxScale = BALANCE.BARRICADE_VISUAL.boxScale;
      const sprite = this.scene.add.image(bx, groundY, boxTex.texture, boxTex.frame);
      sprite.setScale(boxScale);
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(5);
      this.barricadeSprites.push(sprite);
    } else {
      // Fallback: small filled rectangle (box shape)
      const boxW = BALANCE.BARRICADE_VISUAL.boxFallbackW;
      const boxH = BALANCE.BARRICADE_VISUAL.boxFallbackH;
      const g = this.scene.add.graphics().setDepth(5);
      this.barricadeGfx = g;
      g.fillStyle(BARRICADE_COLORS.WALL_FILL, 0.9);
      g.fillRect(bx - boxW / 2, groundY - boxH / 2, boxW, boxH);
      g.lineStyle(2, BARRICADE_COLORS.GLOW, 0.5);
      g.strokeRect(bx - boxW / 2, groundY - boxH / 2, boxW, boxH);
    }
  }

  /** Load and place decorations from chapter map JSON (Phase 4: type-aware) */
  private loadChapterDecorations(parallaxSet: number): void {
    const mapKey = `map_chapter_${parallaxSet}`;
    const mapData = this.scene.cache.json.get(mapKey) as ChapterMapData | null;
    const parsed = parseChapterMapData(mapData);

    // Store obstacle references (no physics bodies yet — just tracking)
    this.obstacleDecos = parsed.obstacles;

    // Store markers for game logic lookup
    this.mapMarkersMap = parsed.markers;

    // Store zones
    this.mapZones = parsed.zones;

    // Create Phaser images for all decorations
    for (const d of parsed.decorations) {
      const decoTex = resolveTexture(this.scene, d.key);
      if (!decoTex) continue;
      const img = this.scene.add.image(d.x, d.y, decoTex.texture, decoTex.frame);
      img.setOrigin(0.5);
      img.setScale(d.scale);
      img.setDepth(d.depth);
      img.setAlpha(d.alpha);
      if (d.flipX) img.setFlipX(true);
      // Apply scroll factor — Background types may have non-zero values
      img.setScrollFactor(getScrollFactor(d));
      this.decoSprites.push(img);
    }
  }
}
