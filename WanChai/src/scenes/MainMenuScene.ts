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

    // === BUTTONS ===

    // Primary: 게임 시작
    this.createMenuButton(cx, 640, 240, 56, '게임 시작', '28px', NEON.UI_ACCENT, NEON_CSS.UI_ACCENT, () => {
      this.scene.start('RunScene');
    });

    // Secondary: 무기 도감
    this.createMenuButton(cx, 720, 200, 48, '무기 도감', '22px', NEON.UI_BORDER, NEON_CSS.UI_TEXT, () => {
      this.scene.start('WeaponCodexScene');
    });

    // Secondary: 적 도감
    this.createMenuButton(cx, 780, 200, 48, '적 도감', '22px', NEON.UI_BORDER, NEON_CSS.UI_TEXT, () => {
      this.scene.start('EnemyCodexScene');
    });

    // Secondary: 월드맵
    this.createMenuButton(cx, 840, 200, 48, '월드맵', '22px', NEON.UI_BORDER, NEON_CSS.UI_TEXT, () => {
      this.scene.start('WorldMapScene');
    });
  }

  private createMenuButton(
    x: number, y: number, w: number, h: number,
    label: string, fontSize: string,
    strokeColor: number, textColor: string,
    onClick: () => void,
  ): void {
    const bg = this.add
      .rectangle(x, y, w, h, NEON.UI_PANEL)
      .setStrokeStyle(2, strokeColor);

    this.add
      .text(x, y, label, {
        fontSize,
        color: textColor,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    bg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setStrokeStyle(3, NEON.UI_ACCENT))
      .on('pointerout', () => bg.setStrokeStyle(2, strokeColor))
      .on('pointerdown', onClick);
  }
}
