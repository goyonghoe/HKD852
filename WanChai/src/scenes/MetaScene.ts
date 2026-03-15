import Phaser from 'phaser';
import { BG_COLOR, NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { VISUAL } from '../config/balance';
import { createButton } from '../ui/ButtonFactory';
import { SaveManager } from '../managers/SaveManager';
import { META_UPGRADES, canPurchase, purchaseUpgrade } from '../core/MetaProgression';
import { ACHIEVEMENTS, getAchievementProgress } from '../core/Achievements';
import type { MetaState } from '../types/game';
import { getRetroSFX } from '../audio/RetroSFX';
import { trackEvent } from '../lib/analytics';
import { t } from '../lib/i18n';
import { calculateProgressFraction, calculateProgressFillWidth } from '../utils/UICalc';
import { navigateScene } from '../utils/SceneNav';

/** Map meta upgrade IDs to i18n key prefixes */
const META_I18N: Record<string, { name: string; desc: string }> = {
  meta_damage: { name: 'meta.damage_name', desc: 'meta.damage_desc' },
  meta_hp: { name: 'meta.hp_name', desc: 'meta.hp_desc' },
  meta_xp: { name: 'meta.xp_name', desc: 'meta.xp_desc' },
  meta_crit: { name: 'meta.crit_name', desc: 'meta.crit_desc' },
  meta_magnet: { name: 'meta.magnet_name', desc: 'meta.magnet_desc' },
  meta_armor: { name: 'meta.armor_name', desc: 'meta.armor_desc' },
  meta_luck: { name: 'meta.luck_name', desc: 'meta.luck_desc' },
};

/** Achievement category display order */
const CATEGORY_ORDER = ['combat', 'economy', 'progression', 'collection'] as const;

const CATEGORY_I18N: Record<string, string> = {
  combat: 'achievement.category_combat',
  economy: 'achievement.category_economy',
  progression: 'achievement.category_progression',
  collection: 'achievement.category_collection',
};

type TabMode = 'upgrades' | 'achievements';

// Layout constants (GAME_HEIGHT resolved at runtime to avoid circular init)
const HEADER_HEIGHT = 190;
const FOOTER_HEIGHT = 70;
const SCROLL_AREA_TOP = HEADER_HEIGHT;

export class MetaScene extends Phaser.Scene {
  private meta!: MetaState;
  private goldText!: Phaser.GameObjects.Text;
  private activeTab: TabMode = 'upgrades';

  // Tab buttons
  private upgradeTabBg!: Phaser.GameObjects.Rectangle;
  private upgradeTabText!: Phaser.GameObjects.Text;
  private achieveTabBg!: Phaser.GameObjects.Rectangle;
  private achieveTabText!: Phaser.GameObjects.Text;

  // Upgrade view objects
  private upgradeContainer!: Phaser.GameObjects.Container;
  private cards: {
    bg: Phaser.GameObjects.Rectangle;
    nameText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    costText: Phaser.GameObjects.Text;
  }[] = [];

  // Achievement view objects
  private achieveContainer!: Phaser.GameObjects.Container;

  // Scroll state (shared for active tab)
  private scrollDragZone?: Phaser.GameObjects.Zone;
  private scrollMoveHandler?: (pointer: Phaser.Input.Pointer) => void;
  private scrollUpHandler?: () => void;

  // Scroll mask (clips content to scroll area)
  private scrollMask?: Phaser.Display.Masks.GeometryMask;

  /** Computed scroll area height (avoids module-level GAME_HEIGHT reference) */
  private get scrollAreaH(): number {
    return GAME_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;
  }

  constructor() {
    super({ key: 'MetaScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cameras.main.fadeIn(300);

    // Load meta (gold + runsCompleted already saved by GameOverScene)
    this.meta = SaveManager.loadMeta();

    const cx = GAME_WIDTH / 2;

    // --- Scroll area mask (hides content outside the scroll zone) ---
    const maskShape = this.add.graphics();
    maskShape.fillStyle(NEON.UI_TEXT); // white — used for geometry mask shape
    maskShape.fillRect(0, SCROLL_AREA_TOP, GAME_WIDTH, this.scrollAreaH);
    maskShape.setVisible(false);
    this.scrollMask = new Phaser.Display.Masks.GeometryMask(this, maskShape);

    // Title
    this.add
      .text(cx, 50, t('meta.title'), {
        fontSize: '36px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Gold display
    this.goldText = this.add
      .text(cx, 95, t('meta.data', { gold: this.meta.totalGold }), {
        fontSize: '22px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    // --- Tab buttons ---
    const tabY = 145;
    const tabGap = 8;
    const tabW = (680 - tabGap) / 2;
    const tabH = VISUAL.UI.MIN_TOUCH_TARGET;
    const leftTabX = cx - tabGap / 2 - tabW / 2;
    const rightTabX = cx + tabGap / 2 + tabW / 2;

    this.upgradeTabBg = this.add
      .rectangle(leftTabX, tabY, tabW, tabH, NEON.UI_ACCENT)
      .setStrokeStyle(2, NEON.UI_ACCENT)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('upgrades'));

    this.upgradeTabText = this.add
      .text(leftTabX, tabY, t('meta.tab_upgrades'), {
        fontSize: '20px',
        color: NEON_CSS.BG_BLACK,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.achieveTabBg = this.add
      .rectangle(rightTabX, tabY, tabW, tabH, NEON.UI_PANEL)
      .setStrokeStyle(2, NEON.UI_BORDER)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('achievements'));

    this.achieveTabText = this.add
      .text(rightTabX, tabY, t('meta.tab_achievements'), {
        fontSize: '20px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // --- Upgrade container (scrollable, masked) ---
    this.upgradeContainer = this.add.container(0, 0);
    this.upgradeContainer.setMask(this.scrollMask);
    this.buildUpgradeView();

    // --- Achievement container (scrollable, masked) ---
    this.achieveContainer = this.add.container(0, 0);
    this.achieveContainer.setMask(this.scrollMask);
    this.buildAchievementView();
    this.achieveContainer.setVisible(false);

    // Setup scroll for initial tab
    this.setupScrollForActiveTab();

    // --- Footer background (covers scrolling content behind button) ---
    this.add.rectangle(cx, GAME_HEIGHT - FOOTER_HEIGHT / 2, GAME_WIDTH, FOOTER_HEIGHT, BG_COLOR).setDepth(100);

    // Main Menu button (fixed at bottom, above scroll content)
    createButton(this, {
      x: cx,
      y: GAME_HEIGHT - FOOTER_HEIGHT / 2,
      width: 240,
      height: 48,
      label: t('meta.main_menu'),
      fontSize: '24px',
      variant: 'primary',
      onClick: () => navigateScene(this, 'MetaScene', 'MainMenuScene'),
      depth: 101,
    });
  }

  private switchTab(tab: TabMode): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    getRetroSFX().tabSwitch();

    if (tab === 'upgrades') {
      this.upgradeTabBg.setFillStyle(NEON.UI_ACCENT).setStrokeStyle(2, NEON.UI_ACCENT);
      this.upgradeTabText.setColor(NEON_CSS.BG_BLACK);
      this.achieveTabBg.setFillStyle(NEON.UI_PANEL).setStrokeStyle(2, NEON.UI_BORDER);
      this.achieveTabText.setColor(NEON_CSS.UI_DIM);
      this.upgradeContainer.setVisible(true);
      this.achieveContainer.setVisible(false);
    } else {
      this.achieveTabBg.setFillStyle(NEON.UI_ACCENT).setStrokeStyle(2, NEON.UI_ACCENT);
      this.achieveTabText.setColor(NEON_CSS.BG_BLACK);
      this.upgradeTabBg.setFillStyle(NEON.UI_PANEL).setStrokeStyle(2, NEON.UI_BORDER);
      this.upgradeTabText.setColor(NEON_CSS.UI_DIM);
      this.upgradeContainer.setVisible(false);
      this.achieveContainer.setVisible(true);
      // Rebuild to refresh progress
      this.achieveContainer.removeAll(true);
      this.buildAchievementView();
    }

    this.setupScrollForActiveTab();
  }

  // ========== SCROLL SYSTEM ==========

  private setupScrollForActiveTab(): void {
    this.cleanupScrollListeners();

    const container = this.activeTab === 'upgrades' ? this.upgradeContainer : this.achieveContainer;
    const contentHeight = this.getContentHeight();

    // Reset scroll position
    container.setY(0);

    if (contentHeight <= this.scrollAreaH) return; // No scroll needed

    const maxScrollY = 0;
    const minScrollY = -(contentHeight - this.scrollAreaH);

    let dragging = false;
    let dragStartY = 0;
    let containerStartY = 0;

    // Invisible zone covering scroll area
    this.scrollDragZone = this.add
      .zone(GAME_WIDTH / 2, SCROLL_AREA_TOP + this.scrollAreaH / 2, GAME_WIDTH, this.scrollAreaH)
      .setInteractive()
      .setDepth(50);

    this.scrollDragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      dragStartY = pointer.y;
      containerStartY = container.y;
    });

    this.scrollMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (!dragging) return;
      const dy = pointer.y - dragStartY;
      const newY = Phaser.Math.Clamp(containerStartY + dy, minScrollY, maxScrollY);
      container.setY(newY);
    };
    this.input.on('pointermove', this.scrollMoveHandler);

    this.scrollUpHandler = () => {
      dragging = false;
    };
    this.input.on('pointerup', this.scrollUpHandler);
  }

  private getContentHeight(): number {
    if (this.activeTab === 'upgrades') {
      const upgrades = Object.values(META_UPGRADES);
      const cardH = 80;
      const gap = 10;
      return SCROLL_AREA_TOP + upgrades.length * (cardH + gap) + 20;
    } else {
      const allAchievements = Object.values(ACHIEVEMENTS);
      const cardH = 100;
      const gap = 12;
      let rows = 0;
      for (const category of CATEGORY_ORDER) {
        const catItems = allAchievements.filter((a) => a.category === category);
        if (catItems.length === 0) continue;
        rows++; // header
        rows += Math.ceil(catItems.length / 2); // cards
      }
      return SCROLL_AREA_TOP + rows * (cardH + gap) + 20;
    }
  }

  private cleanupScrollListeners(): void {
    if (this.scrollDragZone) {
      this.scrollDragZone.destroy();
      this.scrollDragZone = undefined;
    }
    if (this.scrollMoveHandler) {
      this.input.off('pointermove', this.scrollMoveHandler);
      this.scrollMoveHandler = undefined;
    }
    if (this.scrollUpHandler) {
      this.input.off('pointerup', this.scrollUpHandler);
      this.scrollUpHandler = undefined;
    }
  }

  // ========== UPGRADE VIEW ==========

  private buildUpgradeView(): void {
    const cx = GAME_WIDTH / 2;
    const upgrades = Object.values(META_UPGRADES);
    const cardW = 640;
    const cardH = 80;
    const startY = SCROLL_AREA_TOP + 15;
    const gap = 10;

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
        .setAlpha(maxed ? 0.4 : affordable ? 1 : 0.4);

      const i18nKeys = META_I18N[def.id];
      const displayName = i18nKeys ? t(i18nKeys.name) : def.name;
      const displayDesc = i18nKeys ? t(i18nKeys.desc) : def.description;

      const nameText = this.add
        .text(cx - cardW / 2 + 20, y - 16, `${displayName}  (Lv ${level}/${def.maxLevel})`, {
          fontSize: '20px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      const descText = this.add
        .text(cx - cardW / 2 + 20, y + 14, displayDesc, {
          fontSize: '16px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0, 0.5);

      const levelText = nameText;

      const costText = this.add
        .text(cx + cardW / 2 - 20, y, maxed ? 'MAX' : `${cost}`, {
          fontSize: '22px',
          color: maxed ? NEON_CSS.UI_DIM : affordable ? NEON_CSS.GOLD : NEON_CSS.HEALTH,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);

      this.cards.push({ bg, nameText: levelText, levelText: nameText, costText });
      this.upgradeContainer.add([bg, nameText, descText, costText]);

      if (!maxed && affordable) {
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
            const prevLevel = this.meta.upgrades[def.id] ?? 0;
            this.meta = purchaseUpgrade(this.meta, def.id);
            SaveManager.saveMeta(this.meta);
            trackEvent('meta_upgrade', {
              upgradeType: def.id,
              newLevel: prevLevel + 1,
              cost,
            });
            getRetroSFX().purchaseSuccess();
            this.refreshCards();
          });
      }
    });
  }

  private refreshCards(): void {
    this.goldText.setText(t('meta.data', { gold: this.meta.totalGold }));

    const upgrades = Object.values(META_UPGRADES);
    upgrades.forEach((def, i) => {
      if (i >= this.cards.length) return;
      const card = this.cards[i];
      const level = this.meta.upgrades[def.id] ?? 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : def.costPerLevel[level];
      const affordable = canPurchase(this.meta, def.id);

      const i18nKeys = META_I18N[def.id];
      const displayName = i18nKeys ? t(i18nKeys.name) : def.name;

      card.nameText.setText(`${displayName}  (Lv ${level}/${def.maxLevel})`);
      card.costText.setText(maxed ? 'MAX' : `${cost}`);
      card.costText.setColor(maxed ? NEON_CSS.UI_DIM : affordable ? NEON_CSS.GOLD : NEON_CSS.HEALTH);
      card.bg.setStrokeStyle(2, affordable ? NEON.UI_ACCENT : NEON.UI_BORDER);
      card.bg.setAlpha(maxed ? 0.4 : affordable ? 1 : 0.4);

      if (!maxed && affordable) {
        card.bg.setInteractive({ useHandCursor: true });
      } else {
        card.bg.disableInteractive();
      }
    });
  }

  // ========== ACHIEVEMENT VIEW ==========

  private buildAchievementView(): void {
    const cx = GAME_WIDTH / 2;
    const unlocked = this.meta.unlockedAchievements ?? [];
    const allAchievements = Object.values(ACHIEVEMENTS);

    const cardW = 330;
    const cardH = 100;
    const gap = 12;
    const colGap = 16;
    const startY = SCROLL_AREA_TOP + 15;
    const leftX = cx - cardW / 2 - colGap / 2;
    const rightX = cx + cardW / 2 + colGap / 2;

    let rowIndex = 0;

    for (const category of CATEGORY_ORDER) {
      const catAchievements = allAchievements.filter((a) => a.category === category);
      if (catAchievements.length === 0) continue;

      // Category header
      const headerY = startY + rowIndex * (cardH + gap);
      const headerText = this.add
        .text(cx, headerY, t(CATEGORY_I18N[category]), {
          fontSize: '18px',
          color: NEON_CSS.UI_ACCENT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.achieveContainer.add(headerText);
      rowIndex++;

      // 2-column grid
      for (let i = 0; i < catAchievements.length; i += 2) {
        const y = startY + rowIndex * (cardH + gap);
        this.buildAchievementCard(leftX, y, catAchievements[i], unlocked, cardW, cardH);
        if (i + 1 < catAchievements.length) {
          this.buildAchievementCard(rightX, y, catAchievements[i + 1], unlocked, cardW, cardH);
        }
        rowIndex++;
      }
    }
  }

  private buildAchievementCard(
    cx: number,
    cy: number,
    def: (typeof ACHIEVEMENTS)[string],
    unlocked: string[],
    cardW: number,
    cardH: number,
  ): void {
    const isUnlocked = unlocked.includes(def.id);
    const progress = getAchievementProgress(this.meta, def.id);

    const bg = this.add
      .rectangle(cx, cy, cardW, cardH, NEON.UI_PANEL)
      .setStrokeStyle(2, isUnlocked ? NEON.GOLD : NEON.UI_BORDER)
      .setAlpha(isUnlocked ? 1 : 0.6);
    this.achieveContainer.add(bg);

    const nameStr = t(def.nameKey);
    const nameText = this.add
      .text(cx - cardW / 2 + 14, cy - 26, nameStr, {
        fontSize: '16px',
        color: isUnlocked ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.achieveContainer.add(nameText);

    if (isUnlocked) {
      const checkText = this.add
        .text(cx + cardW / 2 - 14, cy - 26, '\u2713', {
          fontSize: '20px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0.5);
      this.achieveContainer.add(checkText);

      const completeText = this.add
        .text(cx, cy + 2, t('achievement.complete'), {
          fontSize: '14px',
          color: NEON_CSS.UI_ACCENT,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.achieveContainer.add(completeText);

      const rewardText = this.add
        .text(cx, cy + 26, t('achievement.reward', { gold: def.goldReward }), {
          fontSize: '14px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      this.achieveContainer.add(rewardText);
    } else {
      const barW = cardW - 28;
      const barH = 12;
      const barX = cx - barW / 2;
      const barY = cy + 2;

      const barBg = this.add.rectangle(cx, barY, barW, barH, NEON.UI_BORDER).setOrigin(0.5);
      this.achieveContainer.add(barBg);

      const pct = calculateProgressFraction(progress.current, progress.target);
      if (pct > 0) {
        const fillW = calculateProgressFillWidth(pct, barW);
        const fillX = barX + fillW / 2;
        const barFill = this.add.rectangle(fillX, barY, fillW, barH - 4, NEON.UI_ACCENT).setOrigin(0.5);
        this.achieveContainer.add(barFill);
      }

      const progressStr = `${progress.current}/${progress.target}`;
      const progressText = this.add
        .text(cx, barY, progressStr, {
          fontSize: '14px',
          color: NEON_CSS.UI_TEXT,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      this.achieveContainer.add(progressText);

      const rewardText = this.add
        .text(cx, cy + 26, t('achievement.reward', { gold: def.goldReward }), {
          fontSize: '14px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
      this.achieveContainer.add(rewardText);
    }
  }
}
