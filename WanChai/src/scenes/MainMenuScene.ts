import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH } from '../config/game-config';
import { createButton } from '../ui/ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { SaveManager } from '../managers/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  private settingsOverlay?: SettingsOverlay;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.settingsOverlay = undefined; // reset destroyed reference from previous visit
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('menu');
    const cx = GAME_WIDTH / 2;

    // Title logo (PNG with text fallback)
    if (this.textures.exists('logo_main')) {
      const logo = this.add.image(cx, 300, 'logo_main').setOrigin(0.5);
      // 512x256 source → fit within screen width with margin
      const maxW = GAME_WIDTH - 80;
      if (logo.width > maxW) {
        logo.setScale(maxW / logo.width);
      }
    } else {
      // Fallback: text-based title
      this.add
        .text(cx, 260, 'NEXT STOP', {
          fontSize: '80px',
          color: NEON_CSS.UI_ACCENT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);
      this.add
        .text(cx, 350, '— HK852', {
          fontSize: '56px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);
    }

    // ARIA node label
    this.add
      .text(cx, 420, 'ARIA-01  ·  HONG KONG', {
        fontSize: '22px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    // Tagline
    this.add
      .text(cx, 490, 'ARIA가 삼킨 도시를 되찾아라', {
        fontSize: '24px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        align: 'center',
      })
      .setOrigin(0.5);

    // Best record display (if has progression)
    if (SaveManager.hasProgression()) {
      const meta = SaveManager.loadMeta();
      const records: string[] = [];
      if (meta.bestLevel > 0) records.push(`LV ${meta.bestLevel}`);
      if (meta.bestKills > 0) records.push(`${meta.bestKills} KILL`);
      if (meta.runsCompleted > 0) records.push(`${meta.runsCompleted} RUN`);
      if (records.length > 0) {
        this.add
          .text(cx, 560, records.join('  ·  '), {
            fontSize: '20px',
            color: NEON_CSS.GOLD,
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
      }
    }

    // === Main play button — large, center ===
    createButton(this, {
      x: cx, y: 880, width: 340, height: 80,
      label: '게임하기', fontSize: '40px',
      variant: 'primary',
      onClick: () => this.scene.start('RunScene'),
    });

    // === Bottom icon button row ===
    const iconY = 1120;
    const iconW = 140;
    const iconH = 70;
    const gap = 16;
    const totalW = 4 * iconW + 3 * gap;
    const startX = cx - totalW / 2 + iconW / 2;

    const menuItems = [
      { label: '무기', onClick: () => this.scene.start('WeaponCodexScene') },
      { label: '적', onClick: () => this.scene.start('EnemyCodexScene') },
      { label: '맵', onClick: () => this.scene.start('WorldMapScene') },
      { label: '설정', onClick: () => {
        if (!this.settingsOverlay) this.settingsOverlay = new SettingsOverlay(this);
        this.settingsOverlay.show();
      } },
    ];

    menuItems.forEach((item, i) => {
      const bx = startX + i * (iconW + gap);
      this.createIconButton(bx, iconY, iconW, iconH, item.label, i, item.onClick);
    });
  }

  /** Create a compact icon button with a drawn symbol + label. */
  private createIconButton(
    x: number, y: number, w: number, h: number,
    label: string, index: number, onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(100);
    const hw = w / 2;
    const hh = h / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-hw, -hh, w, h, 6);
    bg.lineStyle(2, NEON.UI_BORDER, 0.8);
    bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    container.add(bg);

    // Draw simple icon symbol
    const iconGfx = this.add.graphics();
    const iconY = -8;
    const iconColor = NEON.UI_ACCENT;

    switch (index) {
      case 0: // 무기 — crossed lines (sword)
        iconGfx.lineStyle(3, iconColor, 1);
        iconGfx.lineBetween(-12, iconY - 10, 12, iconY + 10);
        iconGfx.lineBetween(12, iconY - 10, -12, iconY + 10);
        iconGfx.fillStyle(iconColor);
        iconGfx.fillCircle(0, iconY, 3);
        break;
      case 1: // 적 — diamond (enemy shape)
        iconGfx.fillStyle(NEON.ENEMY_BASIC);
        iconGfx.fillTriangle(0, iconY - 12, -10, iconY, 0, iconY + 12);
        iconGfx.fillTriangle(0, iconY - 12, 10, iconY, 0, iconY + 12);
        break;
      case 2: // 맵 — grid dots (map nodes)
        iconGfx.fillStyle(iconColor);
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            iconGfx.fillCircle(c * 10, iconY + r * 10, 3);
          }
        }
        iconGfx.lineStyle(1, iconColor, 0.5);
        iconGfx.lineBetween(-10, iconY - 10, 10, iconY - 10);
        iconGfx.lineBetween(-10, iconY, 10, iconY);
        iconGfx.lineBetween(-10, iconY + 10, 10, iconY + 10);
        break;
      case 3: // 설정 — gear (circle + rays)
        iconGfx.lineStyle(3, iconColor, 1);
        iconGfx.strokeCircle(0, iconY, 8);
        iconGfx.fillStyle(iconColor);
        iconGfx.fillCircle(0, iconY, 3);
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 4;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          iconGfx.lineBetween(cos * 10, iconY + sin * 10, cos * 14, iconY + sin * 14);
        }
        break;
    }
    container.add(iconGfx);

    // Label text below icon
    const text = this.add
      .text(0, 18, label, {
        fontSize: '20px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(text);

    // Hit area
    const hitZone = this.add
      .zone(0, 0, w, h)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      container.setScale(1.08);
      bg.clear();
      bg.fillStyle(0x252547, 0.95);
      bg.fillRoundedRect(-hw, -hh, w, h, 6);
      bg.lineStyle(2, NEON.UI_ACCENT, 1);
      bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    });

    hitZone.on('pointerout', () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.9);
      bg.fillRoundedRect(-hw, -hh, w, h, 6);
      bg.lineStyle(2, NEON.UI_BORDER, 0.8);
      bg.strokeRoundedRect(-hw, -hh, w, h, 6);
    });

    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.92, scaleY: 0.92,
        duration: 60,
        yoyo: true,
        onComplete: () => onClick(),
      });
    });

    container.add(hitZone);
    return container;
  }
}
