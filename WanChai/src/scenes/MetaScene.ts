import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { createButton } from '../ui/ButtonFactory';
import { SaveManager } from '../managers/SaveManager';
import {
  META_UPGRADES,
  canPurchase,
  purchaseUpgrade,
} from '../core/MetaProgression';
import type { MetaState } from '../types/game';
import { getRetroSFX } from '../audio/RetroSFX';

interface MetaSceneData {
  goldEarned: number;
}

export class MetaScene extends Phaser.Scene {
  private meta!: MetaState;
  private goldText!: Phaser.GameObjects.Text;
  private cards: {
    bg: Phaser.GameObjects.Rectangle;
    nameText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    costText: Phaser.GameObjects.Text;
  }[] = [];

  constructor() {
    super({ key: 'MetaScene' });
  }

  create(data: MetaSceneData): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);

    // Load and update meta with earned gold
    this.meta = SaveManager.loadMeta();
    this.meta.totalGold += data.goldEarned ?? 0;
    this.meta.runsCompleted++;
    SaveManager.saveMeta(this.meta);

    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 80, '영구 강화', {
        fontSize: '50px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Gold display
    this.goldText = this.add
      .text(cx, 140, `데이터: ${this.meta.totalGold}`, {
        fontSize: '28px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // Upgrade cards
    const upgrades = Object.values(META_UPGRADES);
    const cardW = 640;
    const cardH = 100;
    const startY = 220;
    const gap = 16;

    this.cards = [];
    upgrades.forEach((def, i) => {
      const y = startY + i * (cardH + gap);
      const level = this.meta.upgrades[def.id] ?? 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : def.costPerLevel[level];
      const affordable = canPurchase(this.meta, def.id);

      const bg = this.add
        .rectangle(cx, y, cardW, cardH, NEON.UI_PANEL)
        .setStrokeStyle(2, affordable ? NEON.UI_ACCENT : NEON.UI_BORDER)
        .setAlpha(maxed ? 0.4 : affordable ? 1 : 0.6);

      const nameText = this.add
        .text(cx - cardW / 2 + 20, y - 20, `${def.name}  (Lv ${level}/${def.maxLevel})`, {
          fontSize: '24px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      const descText = this.add
        .text(cx - cardW / 2 + 20, y + 15, def.description, {
          fontSize: '20px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0, 0.5);

      const levelText = nameText; // reuse reference

      const costText = this.add
        .text(cx + cardW / 2 - 20, y, maxed ? 'MAX' : `${cost}`, {
          fontSize: '26px',
          color: maxed ? NEON_CSS.UI_DIM : affordable ? NEON_CSS.GOLD : NEON_CSS.HEALTH,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      this.cards.push({ bg, nameText: levelText, levelText: nameText, costText });

      if (!maxed) {
        bg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            if (canPurchase(this.meta, def.id)) {
              bg.setStrokeStyle(3, NEON.UI_ACCENT);
            }
          })
          .on('pointerout', () => {
            bg.setStrokeStyle(2, canPurchase(this.meta, def.id) ? NEON.UI_ACCENT : NEON.UI_BORDER);
          })
          .on('pointerdown', () => {
            if (!canPurchase(this.meta, def.id)) return;
            this.meta = purchaseUpgrade(this.meta, def.id);
            SaveManager.saveMeta(this.meta);
            getRetroSFX().purchase();
            this.refreshCards();
          });
      }
    });

    // Continue button
    const btnY = startY + upgrades.length * (cardH + gap) + 40;
    createButton(this, {
      x: cx, y: btnY, width: 240, height: 60,
      label: '메인 메뉴', fontSize: '28px',
      variant: 'primary',
      onClick: () => this.scene.start('MainMenuScene'),
    });
  }

  private refreshCards(): void {
    this.goldText.setText(`데이터: ${this.meta.totalGold}`);

    const upgrades = Object.values(META_UPGRADES);
    upgrades.forEach((def, i) => {
      if (i >= this.cards.length) return;
      const card = this.cards[i];
      const level = this.meta.upgrades[def.id] ?? 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : def.costPerLevel[level];
      const affordable = canPurchase(this.meta, def.id);

      card.nameText.setText(`${def.name}  (Lv ${level}/${def.maxLevel})`);
      card.costText.setText(maxed ? 'MAX' : `${cost}`);
      card.costText.setColor(maxed ? NEON_CSS.UI_DIM : affordable ? NEON_CSS.GOLD : NEON_CSS.HEALTH);
      card.bg.setStrokeStyle(2, affordable ? NEON.UI_ACCENT : NEON.UI_BORDER);
      card.bg.setAlpha(maxed ? 0.4 : affordable ? 1 : 0.6);
    });
  }
}
