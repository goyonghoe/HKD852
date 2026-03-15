// ── Neon Survivors: Main Menu Scene ──

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/balance";
import { COLOR_STR } from "../config/colors";
import { AudioManager } from "../audio/AudioManager";

const BG_KEY = "bg_layer1";

export class MainMenuScene extends Phaser.Scene {
  private tapText!: Phaser.GameObjects.Text;
  private audio!: AudioManager;

  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU });
  }

  create(): void {
    this.audio = new AudioManager(this);
    this.createBackground();
    this.createTitle();
    this.createStartPrompt();
    this.setupInput();

    // Play menu BGM
    this.audio.playBgm("bgm_menu");

    // Stop BGM when scene transitions away
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.destroy();
    });
  }

  private createBackground(): void {
    // Scale background image to fill the portrait canvas
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BG_KEY);

    // Fit + fill: scale up uniformly so shortest side fills canvas
    const scaleX = GAME_WIDTH / bg.width;
    const scaleY = GAME_HEIGHT / bg.height;
    bg.setScale(Math.max(scaleX, scaleY));

    // Darken overlay for readability
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.55,
    );
  }

  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;

    // Main title
    this.add
      .text(centerX, GAME_HEIGHT * 0.35, "NEON SURVIVORS", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: COLOR_STR.NEON_CYAN,
          blur: 20,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(
        centerX,
        GAME_HEIGHT * 0.35 + 80,
        "Kill. Collect. Upgrade. Survive.",
        {
          fontFamily: "monospace",
          fontSize: "26px",
          color: COLOR_STR.TEXT_GRAY,
          stroke: "#000000",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5);

    // Decorative neon divider
    this.add
      .text(centerX, GAME_HEIGHT * 0.35 + 130, "━━━━━━━━━━━━━━━━━━━━", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COLOR_STR.NEON_PINK,
      })
      .setOrigin(0.5);
  }

  private createStartPrompt(): void {
    const centerX = GAME_WIDTH / 2;

    // "TAP TO START" button area (min 80px touch target)
    const btnBg = this.add
      .rectangle(centerX, GAME_HEIGHT * 0.62, 400, 90, 0x00f5ff, 0.15)
      .setStrokeStyle(2, 0x00f5ff, 1);

    // Button text
    this.tapText = this.add
      .text(centerX, GAME_HEIGHT * 0.62, "TAP TO START", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: COLOR_STR.NEON_CYAN,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Make button interactive (covers full touch target)
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on("pointerdown", () => this.startGame());

    // Pulse tween on the text
    this.tweens.add({
      targets: this.tapText,
      alpha: { from: 1, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Version / credits footer
    this.add
      .text(centerX, GAME_HEIGHT - 60, "HKD852 Studio · Neon Survivors v0.1", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLOR_STR.TEXT_GRAY,
      })
      .setOrigin(0.5);
  }

  private setupInput(): void {
    // Allow tap anywhere on screen to start (in addition to button)
    this.input.once("pointerdown", () => this.startGame());
  }

  private startGame(): void {
    this.tweens.killAll();
    this.scene.start(SCENE_KEYS.CHARACTER_SELECT);
  }
}
