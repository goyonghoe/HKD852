import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { WEAPON_DEFS } from '../config/weapons';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { createButton } from '../ui/ButtonFactory';
import { SaveManager } from '../managers/SaveManager';
import { enableDragScroll } from '../utils/DragScroll';
import { t } from '../lib/i18n';
import { resolveTexture } from '../config/atlas-manifest';
import { navigateScene } from '../utils/SceneNav';
const FIXED_FOOTER_H = 80; // reserved for Back button at bottom

export class WeaponCodexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WeaponCodexScene' });
  }

  shutdown(): void {
    this.children?.removeAll(true);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    const cx = GAME_WIDTH / 2;

    const discovered = SaveManager.getDiscovered();
    const defs = Object.values(WEAPON_DEFS);
    const unlockedCount = defs.filter((d) => discovered.weapons.includes(d.id)).length;

    // Title — fixed header (scrollFactor 0)
    this.add
      .text(cx, 50, t('codex.weapons_title'), {
        fontSize: '38px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Discovery counter — fixed header
    this.add
      .text(cx, 86, t('codex.unlocked', { count: unlockedCount, total: defs.length }), {
        fontSize: '22px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const cardW = 320;
    const cardH = 130;
    const gap = 16;
    const startY = 120;
    const col1X = cx - cardW / 2 - gap / 2;
    const col2X = cx + cardW / 2 + gap / 2;

    defs.forEach((def, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? col1X : col2X;
      const y = startY + row * (cardH + gap) + cardH / 2;
      const unlocked = discovered.weapons.includes(def.id);

      // Card background
      this.add
        .rectangle(x, y, cardW, cardH, NEON.UI_PANEL, unlocked ? 0.9 : 0.4)
        .setStrokeStyle(1, unlocked ? NEON.UI_BORDER : NEON.UI_PANEL);

      if (!unlocked) {
        // Locked card — show "???"
        this.add
          .text(x, y, '???', {
            fontSize: '34px',
            color: NEON_CSS.UI_DIM,
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setAlpha(0.5);
        return;
      }

      // Weapon icon
      const iconKey = `icon_${def.id}`;
      const iconTex = resolveTexture(this, iconKey);
      if (iconTex) {
        this.add.image(x - cardW / 2 + 34, y - cardH / 2 + 38, iconTex.texture, iconTex.frame).setDisplaySize(40, 40);
      }

      // Weapon name
      const nameX = iconTex ? x - cardW / 2 + 62 : x - cardW / 2 + 16;
      this.add.text(nameX, y - cardH / 2 + 14, t(`weapon.${def.id}`), {
        fontSize: '24px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });

      // Type label
      const typeLabel = t(`weapon_type.${def.projectileType}`);
      this.add
        .text(x + cardW / 2 - 16, y - cardH / 2 + 16, typeLabel, {
          fontSize: '20px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(1, 0);

      // Stats line 1
      const cdSec = (def.cooldownMs / 1000).toFixed(1);
      this.add.text(x - cardW / 2 + 16, y - 4, `DMG ${def.baseDamage}  CD ${cdSec}s`, {
        fontSize: '20px',
        color: NEON_CSS.UI_TEXT,
        fontFamily: 'monospace',
      });

      // Stats line 2 (special attributes)
      const extras: string[] = [];
      if (def.piercing > 0) extras.push(t('weapon_stat.piercing', { val: def.piercing }));
      if (def.aoeRadius > 0) extras.push(t('weapon_stat.aoe', { val: def.aoeRadius }));
      if (def.projectileCount > 1) extras.push(t('weapon_stat.projectiles', { val: def.projectileCount }));
      if (def.range > 0) extras.push(t('weapon_stat.range', { val: def.range }));
      if (extras.length > 0) {
        this.add.text(x - cardW / 2 + 16, y + 22, extras.join('  '), {
          fontSize: '20px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        });
      }

      // Max level
      this.add
        .text(x + cardW / 2 - 16, y + cardH / 2 - 18, `Max Lv${def.maxLevel}`, {
          fontSize: '20px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
        })
        .setOrigin(1, 0);
    });

    // Calculate total content height
    // 9 rows * (130+16) = 1314, plus startY=120 → total=1434
    const totalContentHeight = startY + Math.ceil(defs.length / 2) * (cardH + gap);

    // Back button — FIXED at bottom of screen, OUTSIDE scroll area
    // scrollFactor(0) ensures it stays on screen regardless of camera position
    const backBtnScreenY = GAME_HEIGHT - FIXED_FOOTER_H / 2; // y=1240 on screen
    createButton(this, {
      x: cx,
      y: backBtnScreenY,
      width: 220,
      height: 52,
      label: t('codex.back'),
      fontSize: '26px',
      variant: 'secondary',
      onClick: () => navigateScene(this, 'WeaponCodexScene', 'MainMenuScene'),
    })
      .setScrollFactor(0)
      .setDepth(200);

    // Enable drag scroll — content always overflows (17 weapons = 1434px > 1280)
    // maxScroll capped so content stops before the fixed footer
    const scrollableHeight = GAME_HEIGHT - FIXED_FOOTER_H; // 1200
    if (totalContentHeight > scrollableHeight) {
      enableDragScroll(this, totalContentHeight, scrollableHeight);
    }
  }
}
