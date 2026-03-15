import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { BG_COLOR, RETRO, UI_COLORS, UI_CSS } from '../config/colors';
import { TextureFactory } from '../utils/TextureFactory';
import { SPRITE_KEYS } from '../config/sprite-keys';
import { ATLAS_COVERED_KEYS, validateTextureKeys } from '../config/atlas-manifest';
import { BGM_ASSETS, SFX_ASSETS } from '../audio/AudioManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);

    const barW = 400;
    const barH = 30;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bgG = this.add.graphics();
    bgG.fillStyle(RETRO.borderColor);
    bgG.fillRoundedRect(barX, barY - barH / 2, barW, barH, RETRO.radius);
    bgG.fillStyle(RETRO.panelBg);
    bgG.fillRoundedRect(
      barX + RETRO.borderWidth,
      barY - barH / 2 + RETRO.borderWidth,
      barW - RETRO.borderWidth * 2,
      barH - RETRO.borderWidth * 2,
      RETRO.radius,
    );

    const fill = this.add.rectangle(barX + RETRO.borderWidth, barY, 0, barH - RETRO.borderWidth * 2, UI_COLORS.accent);
    fill.setOrigin(0, 0.5);

    const loadText = this.add.text(GAME_WIDTH / 2, barY - 44, 'Loading...', {
      fontSize: '24px',
      color: UI_CSS.TEXT_WHITE,
      fontFamily: 'monospace',
    });
    loadText.setOrigin(0.5);

    // Loading tips — cycle during load for perceived speed improvement
    const tips = [
      'Defeat bosses to free the critters trapped within...',
      'Each district has unique enemies and weather patterns',
      'ARIA is watching. She learns from your tactics.',
      'Upgrade your weapons — evolutions combine two weapons into one',
      'The barrier is your lifeline. Defend it at all costs.',
      'Passives stack. Choose wisely at each level up.',
      'Bosses enter Phase 2 at half health. Stay alert.',
    ];
    const tipText = this.add.text(GAME_WIDTH / 2, barY + 36, tips[0], {
      fontSize: '16px',
      color: UI_CSS.SUBLABEL,
      fontFamily: 'monospace',
      fontStyle: 'italic',
      align: 'center',
    });
    tipText.setOrigin(0.5);
    let tipIndex = 0;

    this.load.on('progress', (value: number) => {
      fill.width = (barW - RETRO.borderWidth * 2) * value;
      // Cycle tip every ~15% of progress
      const nextTipIndex = Math.min(Math.floor(value * tips.length), tips.length - 1);
      if (nextTipIndex !== tipIndex) {
        tipIndex = nextTipIndex;
        tipText.setText(tips[tipIndex]);
      }
    });

    const cacheBust = `v=${Date.now()}`;

    // Load texture atlases (reduces HTTP requests: 108 sprites → 5 atlas files)
    for (const atlasName of PreloadScene.ATLAS_NAMES) {
      this.load.multiatlas(atlasName, `assets/atlas/${atlasName}.json?${cacheBust}`, 'assets/atlas');
    }

    // Load individual PNG sprites — skip keys covered by atlases or procedural-only
    for (const key of SPRITE_KEYS) {
      if (ATLAS_COVERED_KEYS.has(key)) continue;
      if (PreloadScene.PROCEDURAL_ONLY_KEYS.has(key)) continue;
      this.load.image(key, `assets/sprites/${key}.png?${cacheBust}`);
    }

    // Load barricade sprites — skip keys already covered by atlases
    for (const bKey of ['barricade_box', 'barricade_barrel', 'barricade_crate', 'barricade_rail']) {
      if (ATLAS_COVERED_KEYS.has(bKey)) continue;
      this.load.image(bKey, `assets/sprites/${bKey}.png?${cacheBust}`);
    }

    // Load parallax background layers as regular images
    for (const bgSet of PreloadScene.PARALLAX_BG_SETS) {
      for (const key of bgSet.keys) {
        this.load.image(key, `assets/bg/${key}.png?${cacheBust}`);
      }
    }

    // Load CraftPix-style horizontal spritesheets
    // Format: horizontal strip where height = frame height, width = numFrames * frameWidth
    for (const sheet of PreloadScene.SPRITESHEET_DEFS) {
      this.load.spritesheet(sheet.key, `assets/spritesheets/${sheet.path}?${cacheBust}`, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }

    // Parallax backgrounds (8 sets × 5 layers + overlays where available)
    for (let set = 1; set <= 8; set++) {
      for (const layer of ['sky', 'far', 'mid', 'near', 'front']) {
        this.load.image(`parallax_${set}_${layer}`, `assets/sprites/parallax_${set}_${layer}.png?${cacheBust}`);
      }
    }
    // Only district 1 has an overlay PNG; others use procedural fallbacks
    this.load.image('parallax_1_overlay', `assets/sprites/parallax_1_overlay.png?${cacheBust}`);

    // Chapter map decoration data (all 8 chapters)
    for (let ch = 1; ch <= 8; ch++) {
      this.load.json(`map_chapter_${ch}`, `assets/maps/chapter-${ch}.json?${cacheBust}`);
    }

    // Market Street decoration sprites
    const decoKeys = [
      'deco_sign_guitar',
      'deco_sign_cocktail',
      'deco_sign_heart',
      'deco_sign_open',
      'deco_sign_star',
      'deco_sign_icecream',
      'deco_sign_ps',
      'deco_sign_bolt',
      'deco_sign_gamepad',
      'deco_sign_gift',
      'deco_sign_drink',
      'deco_sign_burger',
      'deco_lamp_1',
      'deco_lamp_2',
      'deco_lamp_3',
      'deco_shop_front',
      'deco_vending_1',
      'deco_vending_2',
      'deco_vending_3',
      'deco_vending_4',
      'deco_vending_5',
      'deco_vending_6',
      'deco_table',
      'deco_table_round',
      'deco_chair_1',
      'deco_chair_2',
      'deco_chair_3',
      'deco_parasol',
    ];
    for (const key of decoKeys) {
      if (ATLAS_COVERED_KEYS.has(key)) continue;
      this.load.image(key, `assets/sprites/${key}.png?${cacheBust}`);
    }

    // Floor tiles — skip if covered by atlas
    for (const floorKey of ['floor_tile_brick', 'floor_tile_blue', 'floor_tile_edge']) {
      if (ATLAS_COVERED_KEYS.has(floorKey)) continue;
      this.load.image(floorKey, `assets/sprites/${floorKey}.png?${cacheBust}`);
    }

    // Barrier sprites — skip if covered by atlas
    for (const barrierKey of ['barrier_metal', 'barrier_metal_2', 'barrier_metal_3', 'barrier_metal_4']) {
      if (ATLAS_COVERED_KEYS.has(barrierKey)) continue;
      this.load.image(barrierKey, `assets/sprites/${barrierKey}.png?${cacheBust}`);
    }

    // Environment objects — skip if covered by atlas
    for (const envKey of ['env_barrel', 'env_box']) {
      if (ATLAS_COVERED_KEYS.has(envKey)) continue;
      this.load.image(envKey, `assets/sprites/${envKey}.png?${cacheBust}`);
    }

    // Load audio assets (BGM + SFX)
    for (const bgm of BGM_ASSETS) {
      this.load.audio(bgm.key, `${bgm.path}?${cacheBust}`);
    }
    for (const sfx of SFX_ASSETS) {
      this.load.audio(sfx.key, `${sfx.path}?${cacheBust}`);
    }

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      // Remove failed key so TextureFactory generates a fallback
      if (this.textures.exists(file.key)) {
        this.textures.remove(file.key);
      }
    });
  }

  /** Texture atlas names — built by tools/build-atlas.ts */
  private static readonly ATLAS_NAMES = ['ui-atlas', 'deco-atlas', 'env-atlas', 'fx-atlas', 'char-atlas'];

  /** Keys that have no PNG assets — TextureFactory generates procedural fallbacks */
  private static readonly PROCEDURAL_ONLY_KEYS = new Set([
    'player',
    'enemy_shooter',
    'enemy_teleporter',
    'boss_hex',
    'boss_diamond',
    'boss_rect',
    'particle_square',
    'particle_glow',
    'particle_purify',
  ]);

  /** Parallax background image sets mapped to stages */
  private static readonly PARALLAX_BG_SETS: { stage: number; keys: string[] }[] = [
    { stage: 1, keys: ['parallax_1', 'parallax_2', 'parallax_3', 'parallax_4', 'parallax_5'] },
    { stage: 3, keys: ['parallax_s3_1', 'parallax_s3_2', 'parallax_s3_3', 'parallax_s3_4', 'parallax_s3_5'] },
    { stage: 5, keys: ['parallax_s5_1', 'parallax_s5_2', 'parallax_s5_3', 'parallax_s5_4', 'parallax_s5_5'] },
  ];

  /** Get parallax layer keys for a given stage number */
  static getParallaxKeysForStage(stage: number): string[] {
    // Find the latest bg set that applies to this stage
    let bestSet = PreloadScene.PARALLAX_BG_SETS[0];
    for (const set of PreloadScene.PARALLAX_BG_SETS) {
      if (stage >= set.stage) bestSet = set;
    }
    return bestSet.keys;
  }

  /** CraftPix spritesheet definitions: key, path, frameWidth, frameHeight, frameCount, animFps, repeat */
  private static readonly SPRITESHEET_DEFS: {
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animFps: number;
    repeat: number; // -1 = loop forever, 0 = play once
  }[] = [
    // === Heroes (48x48 frames) ===
    // Biker (HAI) — Idle1 gun pose (4 frames, gentle breathing loop)
    {
      key: 'biker_idle',
      path: 'heroes/biker_idle_gun.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 4,
      repeat: -1,
    },
    {
      key: 'biker_run',
      path: 'heroes/biker_run.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    // Punk (NOVA) — Idle1 gun pose (4 frames)
    {
      key: 'punk_idle',
      path: 'heroes/punk_idle_gun.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 4,
      repeat: -1,
    },
    {
      key: 'punk_run',
      path: 'heroes/punk_run.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    // Cyborg (SOL) — Idle1 gun pose (4 frames)
    {
      key: 'cyborg_idle',
      path: 'heroes/cyborg_idle_gun.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 4,
      repeat: -1,
    },
    {
      key: 'cyborg_run',
      path: 'heroes/cyborg_run.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    // Mei (MEI) — reuses punk gun idle (unique key for future replacement)
    {
      key: 'mei_idle',
      path: 'heroes/punk_idle_gun.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 4,
      repeat: -1,
    },
    {
      key: 'mei_run',
      path: 'heroes/punk_run.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    // Kai (KAI) — reuses cyborg gun idle (unique key for future replacement)
    {
      key: 'kai_idle',
      path: 'heroes/cyborg_idle_gun.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 4,
      repeat: -1,
    },
    {
      key: 'kai_run',
      path: 'heroes/cyborg_run.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    // === Hero Attack Animations (Walk_attack, 48x48, 6 frames) ===
    {
      key: 'biker_attack',
      path: 'heroes/biker_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'punk_attack',
      path: 'heroes/punk_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'cyborg_attack',
      path: 'heroes/cyborg_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'mei_attack',
      path: 'heroes/punk_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'kai_attack',
      path: 'heroes/cyborg_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 10,
      repeat: 0,
    },
    // === Shoot Effects / Muzzle Flash (48x48, 6 frames) ===
    {
      key: 'shoot_effect_1',
      path: 'fx/shoot_effect_1.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 12,
      repeat: 0,
    },
    {
      key: 'shoot_effect_2',
      path: 'fx/shoot_effect_2.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 12,
      repeat: 0,
    },

    // === Enemies 1-6 (48x48 frames) ===
    // Enemy 1
    {
      key: 'enemy1_idle',
      path: 'enemies/enemy1_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy1_walk',
      path: 'enemies/enemy1_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy1_attack',
      path: 'enemies/enemy1_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy1_hurt',
      path: 'enemies/enemy1_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy1_death',
      path: 'enemies/enemy1_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Enemy 2
    {
      key: 'enemy2_idle',
      path: 'enemies/enemy2_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy2_walk',
      path: 'enemies/enemy2_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy2_attack',
      path: 'enemies/enemy2_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy2_hurt',
      path: 'enemies/enemy2_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy2_death',
      path: 'enemies/enemy2_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Enemy 3
    {
      key: 'enemy3_idle',
      path: 'enemies/enemy3_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy3_walk',
      path: 'enemies/enemy3_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy3_attack',
      path: 'enemies/enemy3_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy3_hurt',
      path: 'enemies/enemy3_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy3_death',
      path: 'enemies/enemy3_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Enemy 4
    {
      key: 'enemy4_idle',
      path: 'enemies/enemy4_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy4_walk',
      path: 'enemies/enemy4_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy4_attack',
      path: 'enemies/enemy4_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy4_hurt',
      path: 'enemies/enemy4_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy4_death',
      path: 'enemies/enemy4_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Enemy 5
    {
      key: 'enemy5_idle',
      path: 'enemies/enemy5_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy5_walk',
      path: 'enemies/enemy5_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy5_attack',
      path: 'enemies/enemy5_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy5_hurt',
      path: 'enemies/enemy5_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy5_death',
      path: 'enemies/enemy5_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Enemy 6
    {
      key: 'enemy6_idle',
      path: 'enemies/enemy6_idle.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 7,
      repeat: -1,
    },
    {
      key: 'enemy6_walk',
      path: 'enemies/enemy6_walk.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 9,
      repeat: -1,
    },
    {
      key: 'enemy6_attack',
      path: 'enemies/enemy6_attack.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 4,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'enemy6_hurt',
      path: 'enemies/enemy6_hurt.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'enemy6_death',
      path: 'enemies/enemy6_death.png',
      frameWidth: 48,
      frameHeight: 48,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },

    // === Bosses ===
    // Boss 1 (96x96 frames)
    {
      key: 'boss1_idle',
      path: 'bosses/boss1_idle.png',
      frameWidth: 96,
      frameHeight: 96,
      frameCount: 4,
      animFps: 6,
      repeat: -1,
    },
    {
      key: 'boss1_walk',
      path: 'bosses/boss1_walk.png',
      frameWidth: 96,
      frameHeight: 96,
      frameCount: 4,
      animFps: 8,
      repeat: -1,
    },
    {
      key: 'boss1_attack',
      path: 'bosses/boss1_attack.png',
      frameWidth: 96,
      frameHeight: 96,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'boss1_hurt',
      path: 'bosses/boss1_hurt.png',
      frameWidth: 96,
      frameHeight: 96,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    // Boss 2 (72x72 frames)
    {
      key: 'boss2_idle',
      path: 'bosses/boss2_idle.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 4,
      animFps: 6,
      repeat: -1,
    },
    {
      key: 'boss2_walk',
      path: 'bosses/boss2_walk.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 8,
      repeat: -1,
    },
    {
      key: 'boss2_attack',
      path: 'bosses/boss2_attack.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'boss2_hurt',
      path: 'bosses/boss2_hurt.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'boss2_death',
      path: 'bosses/boss2_death.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
    // Boss 3 (72x72 frames)
    {
      key: 'boss3_idle',
      path: 'bosses/boss3_idle.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 4,
      animFps: 6,
      repeat: -1,
    },
    {
      key: 'boss3_walk',
      path: 'bosses/boss3_walk.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 8,
      repeat: -1,
    },
    {
      key: 'boss3_attack',
      path: 'bosses/boss3_attack.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 11,
      repeat: 0,
    },
    {
      key: 'boss3_hurt',
      path: 'bosses/boss3_hurt.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 2,
      animFps: 10,
      repeat: 0,
    },
    {
      key: 'boss3_death',
      path: 'bosses/boss3_death.png',
      frameWidth: 72,
      frameHeight: 72,
      frameCount: 6,
      animFps: 8,
      repeat: 0,
    },
  ];

  create(): void {
    // Generate procedural fallbacks only for textures that weren't loaded
    TextureFactory.generateAll(this);

    // Validate that all required sprite keys are resolvable after loading + procedural generation
    const missingKeys = validateTextureKeys(this, SPRITE_KEYS, PreloadScene.PROCEDURAL_ONLY_KEYS);
    if (missingKeys.length > 0) {
      console.warn(`[PreloadScene] Missing textures (${missingKeys.length}):`, missingKeys.join(', '));
    }

    // Create animations from loaded spritesheets
    for (const sheet of PreloadScene.SPRITESHEET_DEFS) {
      if (!this.textures.exists(sheet.key)) continue;
      this.anims.create({
        key: sheet.key,
        frames: this.anims.generateFrameNumbers(sheet.key, {
          start: 0,
          end: sheet.frameCount - 1,
        }),
        frameRate: sheet.animFps,
        repeat: sheet.repeat,
      });
    }

    // Load map textures from chapter JSON manifests (Deploy pipeline assets)
    const mapTextures = this.collectMapTextures();
    if (mapTextures.length > 0) {
      const cacheBust = `v=${Date.now()}`;
      for (const tex of mapTextures) {
        if (!this.textures.exists(tex.key)) {
          this.load.image(tex.key, `${tex.path}?${cacheBust}`);
        }
      }
      this.load.once('complete', () => {
        this.scene.start('MainMenuScene');
      });
      this.load.start();
    } else {
      this.scene.start('MainMenuScene');
    }
  }

  /** Collect all texture entries from chapter JSON manifests */
  private collectMapTextures(): { key: string; path: string }[] {
    const result: { key: string; path: string }[] = [];
    const seen = new Set<string>();
    for (let ch = 1; ch <= 8; ch++) {
      const mapData = this.cache.json.get(`map_chapter_${ch}`) as {
        textures?: { key: string; path: string }[];
      } | null;
      if (!mapData?.textures) continue;
      for (const tex of mapData.textures) {
        if (!seen.has(tex.key)) {
          seen.add(tex.key);
          result.push(tex);
        }
      }
    }
    return result;
  }
}
