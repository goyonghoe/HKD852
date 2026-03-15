// ── Neon Survivors: Entry Point ──

import Phaser from "phaser";
import { SCENE_KEYS } from "./types/game";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/balance";
import { COLORS } from "./config/colors";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { MetaScene } from "./scenes/MetaScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.BG_DARK,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
    GameScene,
    GameOverScene,
    MetaScene,
  ],
};

new Phaser.Game(config);

export { SCENE_KEYS };
