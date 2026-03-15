// ── Neon Survivors: Boot Scene ──

import Phaser from "phaser";
import { SCENE_KEYS } from "../types/game";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/balance";
import { COLOR_STR } from "../config/colors";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Loading...", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: COLOR_STR.TEXT_WHITE,
      })
      .setOrigin(0.5);

    // Immediately transition to preload
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
