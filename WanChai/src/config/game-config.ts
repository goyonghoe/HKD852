import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { RunScene } from '../scenes/RunScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { MetaScene } from '../scenes/MetaScene';
import { WeaponCodexScene } from '../scenes/WeaponCodexScene';
import { EnemyCodexScene } from '../scenes/EnemyCodexScene';
import { WorldMapScene } from '../scenes/WorldMapScene';

/** Game version — bump on each deploy */
export const GAME_VERSION = '1.5.0';

/** Base design resolution (9:16 portrait for mobile) */
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 360, height: 640 },
    max: { width: 1440, height: 2560 },
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    RunScene,
    GameOverScene,
    MetaScene,
    WeaponCodexScene,
    EnemyCodexScene,
    WorldMapScene,
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  input: {
    activePointers: 2,
  },
};
