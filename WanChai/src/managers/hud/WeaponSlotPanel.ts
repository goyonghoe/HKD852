import Phaser from 'phaser';
import { BALANCE } from '../../config/balance';
import { NEON, NEON_CSS } from '../../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/game-config';
import { WEAPON_DEFS } from '../../config/weapons';
import { resolveTexture } from '../../config/atlas-manifest';
import type { WeaponInstance } from '../../types/weapon';

export interface WeaponSlotCallbacks {
  showWeaponRange: (slotIndex: number) => void;
  hideWeaponRange: () => void;
}

/**
 * Manages weapon slot display (4 vertical slots) and range overlay.
 */
export class WeaponSlotPanel {
  private scene: Phaser.Scene;

  weaponSlotBgs: Phaser.GameObjects.Rectangle[] = [];
  private weaponSlotTexts: Phaser.GameObjects.Text[] = [];
  private weaponSlotIcons: Phaser.GameObjects.Image[] = [];

  rangeOverlay!: Phaser.GameObjects.Graphics;
  activeRangeSlot = -1;

  private prevWeaponSlotStr = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(callbacks: WeaponSlotCallbacks): void {
    const scene = this.scene;
    const slotW = BALANCE.HUD.weaponSlotW;
    const slotH = BALANCE.HUD.weaponSlotH;
    const slotGap = BALANCE.HUD.weaponSlotGap;
    const slotX = BALANCE.HUD.weaponSlotStartX + slotW / 2;
    const slotStartY = BALANCE.HUD.weaponSlotStartY;
    this.weaponSlotBgs = [];
    this.weaponSlotTexts = [];
    this.weaponSlotIcons = [];

    for (let i = 0; i < BALANCE.RUN.maxWeapons; i++) {
      const sy = slotStartY + i * (slotH + slotGap) + slotH / 2;
      const bg = scene.add
        .rectangle(slotX, sy, slotW, slotH, NEON.UI_PANEL, 0.5)
        .setStrokeStyle(1, NEON.UI_BORDER, 0.4)
        .setScrollFactor(0)
        .setDepth(1500);
      const icon = scene.add
        .image(slotX, sy - 4, '__DEFAULT')
        .setDisplaySize(BALANCE.HUD.weaponIconSize, BALANCE.HUD.weaponIconSize)
        .setAlpha(0)
        .setScrollFactor(0)
        .setDepth(1501);
      const txt = scene.add
        .text(slotX, sy + slotH / 2 - 6, '', {
          fontSize: '14px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1501);
      this.weaponSlotBgs.push(bg);
      this.weaponSlotTexts.push(txt);
      this.weaponSlotIcons.push(icon);
    }

    // Range overlay (hidden by default)
    this.rangeOverlay = scene.add.graphics().setScrollFactor(0).setDepth(1400).setVisible(false);
    this.activeRangeSlot = -1;

    // Make weapon slots interactive for range preview
    for (let i = 0; i < BALANCE.RUN.maxWeapons; i++) {
      this.weaponSlotBgs[i].setInteractive();
      const idx = i;
      this.weaponSlotBgs[i].on('pointerdown', () => callbacks.showWeaponRange(idx));
      this.weaponSlotBgs[i].on('pointerup', () => callbacks.hideWeaponRange());
      this.weaponSlotBgs[i].on('pointerout', () => callbacks.hideWeaponRange());
    }
  }

  resetDirtyFlags(): void {
    this.prevWeaponSlotStr = '';
  }

  updateSlots(weapons: WeaponInstance[]): void {
    let weaponSlotStr = '';
    for (let i = 0; i < weapons.length; i++) {
      const w = weapons[i];
      const def = WEAPON_DEFS[w.defId];
      weaponSlotStr += def ? `${def.name}:${w.level}|` : '';
    }
    if (weaponSlotStr === this.prevWeaponSlotStr) return;
    this.prevWeaponSlotStr = weaponSlotStr;

    for (let i = 0; i < BALANCE.RUN.maxWeapons; i++) {
      if (i < weapons.length) {
        const w = weapons[i];
        const def = WEAPON_DEFS[w.defId];
        if (def) {
          this.weaponSlotTexts[i].setText(`Lv${w.level}`);
          this.weaponSlotTexts[i].setColor(NEON_CSS.UI_TEXT);
          this.weaponSlotBgs[i].setStrokeStyle(1, NEON.UI_ACCENT, 0.7);
          this.weaponSlotBgs[i].setFillStyle(NEON.UI_PANEL, 0.7);
          const iconKey = `icon_${w.defId}`;
          const iconTex = resolveTexture(this.scene, iconKey);
          if (iconTex) {
            this.weaponSlotIcons[i].setTexture(iconTex.texture, iconTex.frame).setAlpha(1);
          }
        }
      } else {
        this.weaponSlotTexts[i].setText('');
        this.weaponSlotTexts[i].setColor(NEON_CSS.UI_DIM);
        this.weaponSlotBgs[i].setStrokeStyle(1, NEON.UI_BORDER, 0.3);
        this.weaponSlotBgs[i].setFillStyle(NEON.UI_PANEL, 0.3);
        this.weaponSlotIcons[i].setAlpha(0);
      }
    }
  }

  showWeaponRange(slotIndex: number, playerX: number, playerY: number, weapons: WeaponInstance[]): void {
    if (slotIndex >= weapons.length) return;
    const w = weapons[slotIndex];
    const def = WEAPON_DEFS[w.defId];
    if (!def) return;

    this.activeRangeSlot = slotIndex;
    this.rangeOverlay.clear();
    this.rangeOverlay.setVisible(true);

    if (def.range > 0) {
      this.rangeOverlay.lineStyle(2, NEON.UI_ACCENT, 0.6);
      this.rangeOverlay.fillStyle(NEON.UI_ACCENT, 0.08);
      this.rangeOverlay.fillCircle(playerX, playerY, def.range);
      this.rangeOverlay.strokeCircle(playerX, playerY, def.range);
    } else {
      this.rangeOverlay.fillStyle(NEON.UI_ACCENT, 0.05);
      this.rangeOverlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.rangeOverlay.lineStyle(1, NEON.UI_ACCENT, 0.3);
      this.rangeOverlay.strokeRect(4, 4, GAME_WIDTH - 8, GAME_HEIGHT - 8);
    }

    this.weaponSlotBgs[slotIndex].setStrokeStyle(2, NEON.UI_ACCENT, 1.0);
  }

  hideWeaponRange(weapons: WeaponInstance[]): void {
    const slot = this.activeRangeSlot;
    if (slot >= 0 && slot < this.weaponSlotBgs.length) {
      const w = weapons[slot];
      if (w) {
        this.weaponSlotBgs[slot].setStrokeStyle(1, NEON.UI_ACCENT, 0.7);
      } else {
        this.weaponSlotBgs[slot].setStrokeStyle(1, NEON.UI_BORDER, 0.3);
      }
    }
    this.rangeOverlay.clear();
    this.rangeOverlay.setVisible(false);
    this.activeRangeSlot = -1;
  }
}
