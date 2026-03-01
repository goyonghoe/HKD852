import Phaser from 'phaser';
import { gameConfig } from './config/game-config';

const game = new Phaser.Game(gameConfig);

// Expose for debugging in dev mode
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;
}
