import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";
import { PrototypeMenuScene } from "../scenes/PrototypeMenuScene";
import { TendrilScene } from "../scenes/TendrilScene";
import { PulseScene } from "../scenes/PulseScene";
import { SplitScene } from "../scenes/SplitScene";
import { ConductorScene } from "../scenes/ConductorScene";
import { BloomScene } from "../scenes/BloomScene";
import { GAME_WIDTH, GAME_HEIGHT } from "./constants";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#08081a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [
    BootScene,
    PrototypeMenuScene,
    TendrilScene,
    PulseScene,
    SplitScene,
    ConductorScene,
    BloomScene,
    GameScene,
    GameOverScene,
  ],
};
