import Phaser from 'phaser';
import { VISUAL } from '../config/balance';
import { NEON, NEON_CSS } from '../config/colors';
import { WEAPON_DEFS } from '../config/weapons';
import { PASSIVE_DEFS } from '../config/upgrades';
import type { UpgradeChoice } from '../core/UpgradeSelector';
import { GAME_WIDTH } from '../config/game-config';
import { resolveTexture } from '../config/atlas-manifest';
import { t } from '../lib/i18n';

/**
 * Callbacks needed by LevelUpUIManager — a subset of ProgressionCallbacks.
 */
export interface LevelUpUICallbacks {
  /** Called when user selects an upgrade card. */
  onUpgradeSelected: (choice: UpgradeChoice) => void;
  /** Called when user presses skip. */
  onSkipSelected: () => void;
}

/**
 * Manages level-up UI: upgrade cards, auto-select bar, skip button.
 * Extracted from ProgressionManager (TASK-078).
 */
export class LevelUpUIManager {
  private scene: Phaser.Scene;
  private callbacks: LevelUpUICallbacks;

  // Level-up UI state
  private upgradeContainer?: Phaser.GameObjects.Container;
  private autoSelectBarBg?: Phaser.GameObjects.Rectangle;
  private autoSelectBarFill?: Phaser.GameObjects.Rectangle;
  private autoSelectStartReal = 0;
  private autoSelectBestChoice?: UpgradeChoice;

  constructor(scene: Phaser.Scene, callbacks: LevelUpUICallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  // ============================
  // Public API
  // ============================

  /**
   * Show upgrade choice cards for level-up.
   * @param choices Array of upgrade choices to display
   */
  showChoices(choices: UpgradeChoice[]): void {
    this.createUpgradeCards(choices);
  }

  /**
   * Update auto-select bar animation. Call in RunScene.update().
   */
  updateAutoSelect(): void {
    if (this.autoSelectBarFill) {
      const elapsed = Date.now() - this.autoSelectStartReal;
      const progress = Math.min(elapsed / VISUAL.UI.autoSelectDelayMs, 1);
      const totalW = this.autoSelectBarBg?.width ?? 200;
      this.autoSelectBarFill.width = totalW * (1 - progress);
      if (progress >= 1 && this.autoSelectBestChoice) {
        this.callbacks.onUpgradeSelected(this.autoSelectBestChoice);
      }
    }
  }

  /**
   * Clean up all level-up UI elements.
   */
  destroyUI(): void {
    this.autoSelectBestChoice = undefined;
    this.autoSelectBarFill = undefined;
    this.autoSelectBarBg = undefined;
    this.upgradeContainer?.destroy();
    this.upgradeContainer = undefined;
  }

  /**
   * Get the auto-selected best choice (for testing / external use).
   */
  getSelectedChoice(): UpgradeChoice | undefined {
    return this.autoSelectBestChoice;
  }

  /**
   * Check if auto-select bar fill exists.
   */
  get hasAutoSelectBarFill(): boolean {
    return this.autoSelectBarFill !== undefined;
  }

  // ============================
  // Static scoring (testable)
  // ============================

  /**
   * Score a set of choices and return the best one for auto-select.
   * Evolution > weapon upgrade > new weapon > passive.
   */
  static scoreBestChoice(choices: UpgradeChoice[]): UpgradeChoice | undefined {
    if (choices.length === 0) return undefined;
    const scoreChoice = (c: UpgradeChoice): number => {
      let s = 0;
      if (c.type === 'evolution') {
        s += 500; // Always prefer evolution
        const def = WEAPON_DEFS[c.id];
        if (def) s += def.baseDamage;
      } else if (c.type === 'weapon') {
        s += 100;
        if (!c.isNew) s += 50 + c.level * 10;
        const def = WEAPON_DEFS[c.id];
        if (def) s += def.baseDamage;
      } else {
        s += 50;
        if (!c.isNew) s += 30;
        if (c.id === 'damage' || c.id === 'crit_chance' || c.id === 'attack_speed') s += 20;
      }
      return s;
    };
    return choices.reduce((best, c) => (scoreChoice(c) > scoreChoice(best) ? c : best));
  }

  /**
   * Generate stat description for an upgrade choice.
   */
  static getUpgradeStatDesc(choice: UpgradeChoice): string {
    if (choice.type === 'evolution') {
      const def = WEAPON_DEFS[choice.id];
      if (!def) return '';
      const parts = [`DMG ${def.baseDamage}`];
      parts.push(`CD ${def.cooldownMs}ms`);
      if (def.piercing > 0) parts.push(t('stat.piercing', { val: def.piercing }));
      if (def.aoeRadius > 0) parts.push(t('stat.aoe', { val: def.aoeRadius }));
      return parts.join(' | ');
    }
    if (choice.type === 'weapon') {
      const def = WEAPON_DEFS[choice.id];
      if (!def) return '';
      if (choice.isNew) {
        const parts = [`DMG ${def.baseDamage}`];
        parts.push(`CD ${def.cooldownMs}ms`);
        if (def.piercing > 0) parts.push(t('stat.piercing', { val: def.piercing }));
        if (def.aoeRadius > 0) parts.push(t('stat.aoe', { val: def.aoeRadius }));
        return parts.join(' | ');
      }
      const lv = choice.level;
      const prevLv = lv - 1;
      const dmgNow = (1 + (lv - 1) * 0.2).toFixed(1);
      const dmgPrev = (1 + (prevLv - 1) * 0.2).toFixed(1);
      const parts = [`DMG x${dmgPrev}\u2192x${dmgNow}`];
      let countNow: number, countPrev: number;
      if (def.id === 'energy_shot') {
        countNow = 1 + Math.floor(lv / 2);
        countPrev = 1 + Math.floor(prevLv / 2);
      } else if (def.id === 'shotgun') {
        countNow = def.projectileCount + Math.floor((lv - 1) / 2) * 2;
        countPrev = def.projectileCount + Math.floor((prevLv - 1) / 2) * 2;
      } else {
        countNow = def.projectileCount + Math.floor((lv - 1) * 0.5);
        countPrev = def.projectileCount + Math.floor((prevLv - 1) * 0.5);
      }
      if (countNow !== countPrev) parts.push(t('stat.proj_change', { prev: countPrev, next: countNow }));
      const piercNow = def.piercing + Math.floor(lv / 3);
      const piercPrev = def.piercing + Math.floor(prevLv / 3);
      if (piercNow !== piercPrev) parts.push(t('stat.pierce_up', { val: piercNow - piercPrev }));
      return parts.join(' | ');
    }
    const pdef = PASSIVE_DEFS[choice.id];
    if (!pdef) return '';
    const val = pdef.valuePerLevel;
    switch (pdef.effect) {
      case 'attack_speed':
        return t('stat.attack_speed', { val: (val * 100).toFixed(0) });
      case 'damage':
        return t('stat.damage', { val: (val * 100).toFixed(0) });
      case 'base_armor':
        return t('stat.base_armor', { val: (val * 100).toFixed(0) });
      case 'hp_regen':
        return t('stat.hp_regen', { val });
      case 'crit_chance':
        return t('stat.crit_chance', { val: (val * 100).toFixed(0) });
      case 'crit_damage':
        return t('stat.crit_damage', { val: (val * 100).toFixed(0) });
      default:
        return pdef.description;
    }
  }

  // ============================
  // Internals
  // ============================

  private createUpgradeCards(choices: UpgradeChoice[]): void {
    const cx = GAME_WIDTH / 2;
    const cy = this.scene.scale?.height ? this.scene.scale.height / 2 : 360;

    this.upgradeContainer = this.scene.add.container(cx, cy).setDepth(2000);
    const backdrop = this.scene.add.rectangle(0, 0, GAME_WIDTH, cy * 2, NEON.BG_BLACK, 0.75);
    this.upgradeContainer.add(backdrop);

    if (choices.length === 0) {
      const maxedText = this.scene.add
        .text(0, -20, t('levelup.all_maxed'), {
          fontSize: '28px',
          color: NEON_CSS.GOLD,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.upgradeContainer.add(maxedText);
      this.scene.time.delayedCall(1000, () => this.callbacks.onSkipSelected());
      return;
    }

    const fxLevelTex = resolveTexture(this.scene, 'fx_levelup');
    if (fxLevelTex) {
      const fxImg = this.scene.add
        .image(0, -cy * 0.3 - 60, fxLevelTex.texture, fxLevelTex.frame)
        .setDisplaySize(72, 72)
        .setAlpha(0);
      this.upgradeContainer.add(fxImg);
      this.scene.tweens.add({
        targets: fxImg,
        alpha: 1,
        scale: { from: 0.5, to: 1 },
        duration: 350,
        ease: 'Back.easeOut',
      });
    }

    const title = this.scene.add
      .text(0, -cy * 0.3, t('levelup.title'), {
        fontSize: '56px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.upgradeContainer.add(title);

    const cardW = VISUAL.UI.upgradeCardWidth;
    const cardH = VISUAL.UI.upgradeCardHeight;
    const gap = VISUAL.UI.upgradeCardGap;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = -totalW / 2 + cardW / 2;

    choices.forEach((choice, i) => {
      const cardX = startX + i * (cardW + gap);
      const isEvo = choice.type === 'evolution';
      const borderColor = isEvo ? NEON.GOLD : choice.isNew ? NEON.UI_ACCENT : NEON.UI_BORDER;
      const borderWidth = isEvo ? 3 : 2;
      const bg = this.scene.add
        .rectangle(cardX, 0, cardW, cardH, NEON.UI_PANEL)
        .setStrokeStyle(borderWidth, borderColor);

      const iconKey =
        choice.type === 'weapon' || choice.type === 'evolution'
          ? `icon_${choice.id}`
          : `icon_passive_${choice.id === 'base_armor' ? 'armor' : choice.id === 'crit_chance' ? 'crit' : choice.id === 'crit_damage' ? 'crit_dmg' : choice.id === 'hp_regen' ? 'regen' : choice.id === 'attack_speed' ? 'cooldown' : choice.id}`;
      const items: Phaser.GameObjects.GameObject[] = [bg];
      const iconTex = resolveTexture(this.scene, iconKey);
      if (iconTex) {
        const icon = this.scene.add.image(cardX, -80, iconTex.texture, iconTex.frame).setDisplaySize(36, 36);
        items.push(icon);
      }

      const nameColor = isEvo ? NEON_CSS.GOLD : NEON_CSS.UI_TEXT;
      const nameText = this.scene.add
        .text(cardX, iconTex ? -54 : -80, choice.name, {
          fontSize: '24px',
          color: nameColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          wordWrap: { width: cardW - 16 },
          align: 'center',
        })
        .setOrigin(0.5);

      const descText = this.scene.add
        .text(cardX, iconTex ? -6 : -20, choice.description, {
          fontSize: '20px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 16 },
          align: 'center',
        })
        .setOrigin(0.5);

      const statDesc = LevelUpUIManager.getUpgradeStatDesc(choice);
      const statText = this.scene.add
        .text(cardX, 30, statDesc, {
          fontSize: '14px', // M-011: 14px minimum font size
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 12 },
          align: 'center',
        })
        .setOrigin(0.5);

      const labelText = isEvo ? t('evolution.available') : choice.isNew ? t('levelup.new') : `Lv ${choice.level}`;
      const labelColor = isEvo ? NEON_CSS.GOLD : choice.isNew ? NEON_CSS.UI_ACCENT : NEON_CSS.GOLD;
      const levelLabel = this.scene.add
        .text(cardX, 80, labelText, {
          fontSize: '22px',
          color: labelColor,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      items.push(nameText, descText, statText, levelLabel);
      this.upgradeContainer!.add(items);

      const hoverColor = isEvo ? NEON.GOLD : NEON.UI_ACCENT;
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setStrokeStyle(3, hoverColor))
        .on('pointerout', () => bg.setStrokeStyle(borderWidth, borderColor))
        .on('pointerdown', () => this.callbacks.onUpgradeSelected(choice));
    });

    // Auto-select timer bar
    const barW = totalW;
    const barH = 6;
    const barY = cardH / 2 + 20;
    this.autoSelectBarBg = this.scene.add.rectangle(0, barY, barW, barH, NEON.UI_BORDER, 0.8);
    this.autoSelectBarFill = this.scene.add
      .rectangle(-barW / 2, barY, barW, barH, NEON.UI_ACCENT, 0.9)
      .setOrigin(0, 0.5);
    this.upgradeContainer!.add([this.autoSelectBarBg, this.autoSelectBarFill]);

    // Skip button — 160x48 for 48dp minimum touch target (M-011)
    const skipY = cardH / 2 + 50;
    const skipBg = this.scene.add.rectangle(0, skipY, 160, 48, NEON.UI_PANEL, 0.6).setStrokeStyle(1, NEON.UI_BORDER);
    const skipLabel = this.scene.add
      .text(0, skipY, t('levelup.skip'), {
        fontSize: '18px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    this.upgradeContainer!.add([skipBg, skipLabel]);

    skipBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        skipBg.setStrokeStyle(1, NEON.UI_ACCENT);
        skipLabel.setColor(NEON_CSS.UI_TEXT);
      })
      .on('pointerout', () => {
        skipBg.setStrokeStyle(1, NEON.UI_BORDER);
        skipLabel.setColor(NEON_CSS.UI_DIM);
      })
      .on('pointerdown', () => this.callbacks.onSkipSelected());

    this.autoSelectBestChoice = LevelUpUIManager.scoreBestChoice(choices);
    this.autoSelectStartReal = Date.now();
  }
}
