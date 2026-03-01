import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH } from '../config/game-config';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    const cx = GAME_WIDTH / 2;

    // Title: NEXT STOP
    this.add
      .text(cx, 280, 'NEXT STOP', {
        fontSize: '72px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    // Subtitle: — HK852
    this.add
      .text(cx, 370, '— HK852', {
        fontSize: '48px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);

    // ARIA node label
    this.add
      .text(cx, 440, 'ARIA-01  ·  HONG KONG', {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    // Tagline
    this.add
      .text(cx, 510, 'ARIA가 삼킨 도시를 되찾아라', {
        fontSize: '20px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    // Start button (custom, no ButtonFactory dependency issues)
    const btnW = 240;
    const btnH = 64;
    const btnY = 700;

    const btnBg = this.add
      .rectangle(cx, btnY, btnW, btnH, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_ACCENT);

    this.add
      .text(cx, btnY, '게임 시작', {
        fontSize: '28px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btnBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btnBg.setStrokeStyle(3, NEON.UI_ACCENT))
      .on('pointerout', () => btnBg.setStrokeStyle(2, NEON.UI_ACCENT))
      .on('pointerdown', () => this.scene.start('RunScene'));
  }
}
