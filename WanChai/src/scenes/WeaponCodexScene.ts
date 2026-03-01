import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { WEAPON_DEFS } from '../config/weapons';
import { GAME_WIDTH } from '../config/game-config';

const TYPE_LABELS: Record<string, string> = {
  bullet: '탄환',
  aoe: '범위',
  laser: '레이저',
  orbit: '궤도',
  chain: '체인',
  homing: '유도',
  bomb: '폭탄',
};

export class WeaponCodexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeaponCodexScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 50, '무기 도감', {
        fontSize: '32px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Weapon cards (2 columns x 4 rows)
    const defs = Object.values(WEAPON_DEFS);
    const cardW = 320;
    const cardH = 130;
    const gap = 16;
    const startY = 100;
    const col1X = cx - cardW / 2 - gap / 2;
    const col2X = cx + cardW / 2 + gap / 2;

    defs.forEach((def, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? col1X : col2X;
      const y = startY + row * (cardH + gap) + cardH / 2;

      // Card background
      this.add
        .rectangle(x, y, cardW, cardH, NEON.UI_PANEL, 0.9)
        .setStrokeStyle(1, NEON.UI_BORDER);

      // Weapon name
      this.add
        .text(x - cardW / 2 + 16, y - cardH / 2 + 14, def.name, {
          fontSize: '20px',
          color: NEON_CSS.UI_ACCENT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        });

      // Type label
      const typeLabel = TYPE_LABELS[def.projectileType] ?? def.projectileType;
      this.add
        .text(x + cardW / 2 - 16, y - cardH / 2 + 16, typeLabel, {
          fontSize: '16px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(1, 0);

      // Stats line 1
      const cdSec = (def.cooldownMs / 1000).toFixed(1);
      this.add
        .text(x - cardW / 2 + 16, y - 4, `DMG ${def.baseDamage}  CD ${cdSec}s`, {
          fontSize: '16px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
        });

      // Stats line 2 (special attributes)
      const extras: string[] = [];
      if (def.piercing > 0) extras.push(`관통 ${def.piercing}`);
      if (def.aoeRadius > 0) extras.push(`범위 ${def.aoeRadius}px`);
      if (def.projectileCount > 1) extras.push(`발사 x${def.projectileCount}`);
      if (def.range > 0) extras.push(`사거리 ${def.range}`);
      if (extras.length > 0) {
        this.add
          .text(x - cardW / 2 + 16, y + 22, extras.join('  '), {
            fontSize: '14px',
            color: NEON_CSS.UI_DIM,
            fontFamily: 'monospace',
          });
      }

      // Max level
      this.add
        .text(x + cardW / 2 - 16, y + cardH / 2 - 18, `Max Lv${def.maxLevel}`, {
          fontSize: '14px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
        })
        .setOrigin(1, 0);
    });

    // Back button
    const btnY = startY + Math.ceil(defs.length / 2) * (cardH + gap) + 30;
    const btnBg = this.add
      .rectangle(cx, btnY, 200, 48, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_BORDER);

    this.add
      .text(cx, btnY, '돌아가기', {
        fontSize: '22px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btnBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btnBg.setStrokeStyle(3, NEON.UI_ACCENT))
      .on('pointerout', () => btnBg.setStrokeStyle(2, NEON.UI_BORDER))
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
