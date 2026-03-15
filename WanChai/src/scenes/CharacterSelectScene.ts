import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS, ELEMENT, ELEMENT_CSS, TEX, UI_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { CHARACTER_LIST, type CharacterDef } from '../config/characters';
import { createButton } from '../ui/ButtonFactory';
import { getRetroAudio } from '../audio/RetroAudio';
import { trackEvent } from '../lib/analytics';
import { SaveManager } from '../managers/SaveManager';
import { t } from '../lib/i18n';
import { resolveTexture } from '../config/atlas-manifest';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedId: string | null = null;
  private cards: { container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; def: CharacterDef }[] = [];
  private goButton?: Phaser.GameObjects.Container;
  private isTutorial = false;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    this.isTutorial = !SaveManager.isTutorialCompleted();

    this.selectedId = null;
    this.cards = [];
    this.goButton = undefined;

    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);
    getRetroAudio().switchTrack('menu');

    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 40, t('charselect.title'), {
        fontSize: '44px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Layout: all 5 in a single row for landscape
    const cardW = 200;
    const cardH = 260;
    const gapX = 16;
    const gapY = 20;

    // Single row: 5 cards (fits 1280 wide)
    const row1Count = 5;
    const row1TotalW = row1Count * cardW + (row1Count - 1) * gapX;
    const row1StartX = cx - row1TotalW / 2 + cardW / 2;
    const row1Y = 220;

    // Row 2: unused in landscape but keep for compatibility
    const row2Count = 2;
    const row2TotalW = row2Count * cardW + (row2Count - 1) * gapX;
    const row2StartX = cx - row2TotalW / 2 + cardW / 2;
    const row2Y = row1Y + cardH + gapY;

    CHARACTER_LIST.forEach((charDef, i) => {
      let cardX: number;
      let cardY: number;
      if (i < row1Count) {
        cardX = row1StartX + i * (cardW + gapX);
        cardY = row1Y;
      } else {
        cardX = row2StartX + (i - row1Count) * (cardW + gapX);
        cardY = row2Y;
      }
      this.createCharCard(cardX, cardY, cardW, cardH, charDef);
    });

    // Back button
    createButton(this, {
      x: 100,
      y: GAME_HEIGHT - 80,
      width: 140,
      height: 60,
      label: t('charselect.back'),
      fontSize: '28px',
      variant: 'secondary',
      onClick: () => this.scene.start('MainMenuScene'),
    });
  }

  private getUnlockI18nKey(type: string): string {
    switch (type) {
      case 'runsCompleted':
        return 'character.unlock_runs';
      case 'totalGold':
        return 'character.unlock_gold';
      case 'bestKills':
        return 'character.unlock_kills';
      default:
        return 'character.locked';
    }
  }

  private createCharCard(x: number, y: number, w: number, h: number, def: CharacterDef): void {
    const container = this.add.container(x, y);
    const hw = w / 2;
    const hh = h / 2;
    const isUnlocked = SaveManager.isCharacterUnlocked(def.id);

    // Card background
    const bg = this.add.graphics();
    this.drawCardBg(bg, hw, hh, w, h, false);
    container.add(bg);

    // Portrait
    const portraitY = -hh + 16 + 56; // 16 top padding + half of 112
    const portraitTex = resolveTexture(this, def.portraitKey);
    if (portraitTex) {
      const portrait = this.add.image(0, portraitY, portraitTex.texture, portraitTex.frame).setOrigin(0.5);
      const targetSize = 112;
      const srcW = portrait.texture.getSourceImage().width;
      if (srcW > 0 && srcW !== targetSize) {
        portrait.setScale(targetSize / srcW);
      }
      if (!isUnlocked) portrait.setAlpha(0.3);
      container.add(portrait);
    } else {
      // Fallback circle with element color
      const fallback = this.add.graphics();
      const elemColor = ELEMENT[def.element] ?? NEON.UI_ACCENT;
      fallback.fillStyle(elemColor, isUnlocked ? 0.3 : 0.1);
      fallback.fillCircle(0, portraitY, 48);
      fallback.lineStyle(2, elemColor, isUnlocked ? 1 : 0.3);
      fallback.strokeCircle(0, portraitY, 48);
      container.add(fallback);

      this.add
        .text(0, portraitY, def.name[0], {
          fontSize: '40px',
          color: UI_CSS.TEXT_WHITE,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(isUnlocked ? 1 : 0.3);
    }

    // Lock overlay for locked characters
    if (!isUnlocked) {
      const lockText = this.add
        .text(0, portraitY, t('character.locked'), {
          fontSize: '28px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      container.add(lockText);
    }

    // Element badge
    const badgeY = portraitY + 64;
    const elemColor = ELEMENT[def.element] ?? NEON.UI_ACCENT;
    const elemCss = ELEMENT_CSS[def.element] ?? NEON_CSS.UI_ACCENT;
    const badge = this.add.graphics();
    badge.fillStyle(elemColor, isUnlocked ? 0.25 : 0.1);
    badge.fillRoundedRect(-32, badgeY - 10, 64, 20, 10);
    badge.lineStyle(1, elemColor, isUnlocked ? 0.8 : 0.3);
    badge.strokeRoundedRect(-32, badgeY - 10, 64, 20, 10);
    container.add(badge);

    const elemText = this.add
      .text(0, badgeY, def.element, {
        fontSize: '14px',
        color: elemCss,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(isUnlocked ? 1 : 0.3);
    container.add(elemText);

    // Name
    const nameY = badgeY + 24;
    const nameText = this.add
      .text(0, nameY, `${def.name} · ${def.nameKo}`, {
        fontSize: '18px',
        color: isUnlocked ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // Passive description OR unlock condition
    const passiveY = nameY + 22;
    if (isUnlocked) {
      const passiveText = this.add
        .text(0, passiveY, t(`passive.${def.passive.type}`), {
          fontSize: '16px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      container.add(passiveText);
    } else if (def.unlockCondition) {
      const condKey = this.getUnlockI18nKey(def.unlockCondition.type);
      const condText = this.add
        .text(0, passiveY, t(condKey, { count: def.unlockCondition.value }), {
          fontSize: '14px',
          color: NEON_CSS.HEALTH,
          fontFamily: 'monospace',
          wordWrap: { width: w - 16 },
          align: 'center',
        })
        .setOrigin(0.5);
      container.add(condText);
    }

    // Hit zone — only for unlocked characters
    if (isUnlocked) {
      const hitZone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        this.selectCharacter(def.id);
      });

      container.add(hitZone);
    } else {
      // Dim the entire card
      container.setAlpha(0.6);
    }

    this.cards.push({ container, bg, def });
  }

  private drawCardBg(
    bg: Phaser.GameObjects.Graphics,
    hw: number,
    hh: number,
    w: number,
    h: number,
    selected: boolean,
  ): void {
    bg.clear();
    if (selected) {
      bg.fillStyle(TEX.CHAR_SELECT_BG, 0.95);
      bg.fillRoundedRect(-hw, -hh, w, h, 12);
      bg.lineStyle(3, NEON.UI_ACCENT, 1);
      bg.strokeRoundedRect(-hw, -hh, w, h, 12);
    } else {
      bg.fillStyle(NEON.UI_PANEL, 0.9);
      bg.fillRoundedRect(-hw, -hh, w, h, 12);
      bg.lineStyle(2, NEON.UI_BORDER, 0.7);
      bg.strokeRoundedRect(-hw, -hh, w, h, 12);
    }
  }

  private selectCharacter(id: string): void {
    this.selectedId = id;
    const cardW = 200;
    const cardH = 260;
    const hw = cardW / 2;
    const hh = cardH / 2;

    // Redraw all card backgrounds
    for (const card of this.cards) {
      const isSelected = card.def.id === id;
      this.drawCardBg(card.bg, hw, hh, cardW, cardH, isSelected);
      // Subtle scale on selected
      card.container.setScale(isSelected ? 1.05 : 1);
    }

    // Show "go" button
    if (!this.goButton) {
      const cx = GAME_WIDTH / 2;
      this.goButton = createButton(this, {
        x: cx,
        y: GAME_HEIGHT - 80,
        width: 300,
        height: 72,
        label: t('charselect.go'),
        fontSize: '36px',
        variant: 'primary',
        onClick: () => {
          if (this.selectedId) {
            this.input.enabled = false;
            trackEvent('character_select', { characterId: this.selectedId });
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
              this.scene.start('RunScene', { characterId: this.selectedId, tutorial: this.isTutorial });
            });
          }
        },
      });
    }
  }
}
