import Phaser from 'phaser';
import { BG_CSS } from './colors';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { RunScene } from '../scenes/RunScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { MetaScene } from '../scenes/MetaScene';
import { WeaponCodexScene } from '../scenes/WeaponCodexScene';
import { EnemyCodexScene } from '../scenes/EnemyCodexScene';
import { WorldMapScene } from '../scenes/WorldMapScene';

/** Game version — bump on each deploy */
export const GAME_VERSION = '1.5.0';

/** Base design resolution (16:9 landscape) */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BG_CSS,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 640, height: 360 },
    max: { width: 2560, height: 1440 },
    fullscreenTarget: 'game-container',
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
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
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  input: {
    activePointers: 2,
  },
};
