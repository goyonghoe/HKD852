// ── Neon Survivors: Preload Scene ──

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/balance";
import { COLORS, COLOR_STR } from "../config/colors";
import { ALL_SPRITESHEETS, BG_LAYERS } from "../config/sprite-keys";
import { BGM_TRACKS, SFX } from "../config/audio-keys";

const BAR_WIDTH = 500;
const BAR_HEIGHT = 24;
const BAR_X = (GAME_WIDTH - BAR_WIDTH) / 2;
const BAR_Y = GAME_HEIGHT / 2 + 40;

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload(): void {
    this.createLoadingUI();

    // Track load progress
    this.load.on("progress", (value: number) => {
      this.progressBar.setDisplaySize(BAR_WIDTH * value, BAR_HEIGHT);
    });

    // Load all spritesheets
    for (const sheet of ALL_SPRITESHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }

    // Load all background images
    for (const bg of BG_LAYERS) {
      this.load.image(bg.key, bg.path);
    }

    // Load BGM tracks
    for (const track of BGM_TRACKS) {
      this.load.audio(track.key, track.path);
    }

    // Load SFX
    for (const sfx of SFX) {
      this.load.audio(sfx.key, sfx.path);
    }
  }

  create(): void {
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }

  private createLoadingUI(): void {
    // Dark background
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.BG_DARK,
    );

    // Title
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "NEON SURVIVORS", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: COLOR_STR.NEON_CYAN,
      })
      .setOrigin(0.5);

    // Loading label
    this.add
      .text(GAME_WIDTH / 2, BAR_Y - 40, "Loading assets...", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);

    // Progress bar background
    this.progressBg = this.add.rectangle(
      GAME_WIDTH / 2,
      BAR_Y,
      BAR_WIDTH + 4,
      BAR_HEIGHT + 4,
      COLORS.HP_BG,
    );

    // Progress bar fill (starts at 0 width)
    this.progressBar = this.add
      .rectangle(BAR_X, BAR_Y, 0, BAR_HEIGHT, COLORS.NEON_CYAN)
      .setOrigin(0, 0.5);
  }
}
