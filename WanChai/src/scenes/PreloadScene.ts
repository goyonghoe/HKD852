import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { BG_COLOR, RETRO, UI_COLORS } from '../config/colors';
import { TextureFactory } from '../utils/TextureFactory';
import { SPRITE_KEYS } from '../config/sprite-keys';

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
      RETRO.radius
    );

    const fill = this.add.rectangle(
      barX + RETRO.borderWidth,
      barY,
      0,
      barH - RETRO.borderWidth * 2,
      UI_COLORS.accent
    );
    fill.setOrigin(0, 0.5);

    const loadText = this.add.text(GAME_WIDTH / 2, barY - 44, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    loadText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = (barW - RETRO.borderWidth * 2) * value;
    });

    // Try loading PNG sprites — missing files silently fail
    for (const key of SPRITE_KEYS) {
      this.load.image(key, `assets/sprites/${key}.png`);
    }
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      // Remove failed key so TextureFactory generates a fallback
      if (this.textures.exists(file.key)) {
        this.textures.remove(file.key);
      }
    });
  }

  create(): void {
    // Generate procedural fallbacks only for textures that weren't loaded
    TextureFactory.generateAll(this);
    this.scene.start('MainMenuScene');
  }
}
