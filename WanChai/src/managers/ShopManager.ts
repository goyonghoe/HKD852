import Phaser from 'phaser';
import { BALANCE, VISUAL } from '../config/balance';
import { NEON, NEON_CSS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game-config';
import { PASSIVE_DEFS } from '../config/upgrades';
import { getRetroSFX } from '../audio/RetroSFX';
import { trackEvent } from '../lib/analytics';
import {
  scoreBestShopChoice as scoreBestShopChoicePure,
  applyShopHeal,
  applyShopDamageBoost,
  applyShopArmorBoost,
  calculateBaseArmor,
  generateShopSlots,
  type ShopItem,
} from '../core/ShopLogic';
import type { RunState, ShopItemAction, ShopSlot } from '../types/game';
import type { Player } from '../objects/Player';
import type { ARIAMessage } from '../ui/ARIAMessage';
import type { PhaseManager } from './PhaseManager';
import { t } from '../lib/i18n';

export interface ShopCallbacks {
  getPassiveArmorLevel: () => number;
  getShopArmorMultiplier: () => number;
  setShopArmorMultiplier: (v: number) => void;
  setBaseArmorMultiplier: (v: number) => void;
}

/**
 * Mid-run shop overlay: item generation, purchase logic, UI.
 */
export class ShopManager {
  private scene: Phaser.Scene;
  private callbacks: ShopCallbacks;

  // Shop UI
  shopContainer?: Phaser.GameObjects.Container;
  shopAutoBarBg?: Phaser.GameObjects.Rectangle;
  shopAutoBarFill?: Phaser.GameObjects.Rectangle;
  shopAutoStartReal = 0;
  shopAutoBestAction?: { action: ShopItemAction; cost: number } | null;

  constructor(scene: Phaser.Scene, callbacks: ShopCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  /** Update auto-select bar animation (call from RunScene.update when phase === 'shop'). */
  updateAutoSelect(_phaseManager: PhaseManager): { action: ShopItemAction; cost: number } | 'skip' | null {
    if (!this.shopAutoBarFill) return null;
    const elapsed = Date.now() - this.shopAutoStartReal;
    const progress = Math.min(elapsed / VISUAL.UI.autoSelectDelayMs, 1);
    const totalW = this.shopAutoBarBg?.width ?? 200;
    this.shopAutoBarFill.width = totalW * (1 - progress);
    if (progress >= 1) {
      if (this.shopAutoBestAction) {
        return this.shopAutoBestAction;
      }
      return 'skip';
    }
    return null;
  }

  showMidRunShop(
    runState: RunState,
    player: Player,
    ariaMsg: ARIAMessage,
    phaseManager: PhaseManager,
    onCloseShop: () => void,
  ): void {
    phaseManager.transition('shop');
    this.scene.physics.pause();
    getRetroSFX().tap();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.shopContainer = this.scene.add.container(cx, cy).setDepth(2000);

    const backdrop = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, NEON.BG_BLACK, 0.8);
    this.shopContainer.add(backdrop);

    const title = this.scene.add
      .text(0, -250, t('shop.title'), {
        fontSize: '42px',
        color: NEON_CSS.UI_ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.shopContainer.add(title);

    const goldLabel = this.scene.add
      .text(0, -198, t('shop.gold', { gold: runState.gold }), {
        fontSize: '28px',
        color: NEON_CSS.GOLD,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    this.shopContainer.add(goldLabel);

    // 8-slot grid: 4 per row, 2 rows (M-016: total height verified fits viewport)
    // cardW=156, cardH=156, gap=12 → row width = 4*156+3*12 = 660 ≤ 720
    // row1 centerY=-100, row2 centerY=-100+156+16=+72
    // bottom of row2 = cy + 72 + 78 = 640+150 = 790 < 1280 ✓
    const slots = generateShopSlots(runState.gold, runState.stage);
    const cardW = 156;
    const cardH = 156;
    const colGap = 12;
    const rowGap = 16;
    const cols = 4;
    const row1Y = -100;
    const row2Y = row1Y + cardH + rowGap;
    const totalRowW = cols * cardW + (cols - 1) * colGap;
    const startX = -totalRowW / 2 + cardW / 2;

    slots.forEach((slot: ShopSlot, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = startX + col * (cardW + colGap);
      const cardY = row === 0 ? row1Y : row2Y;
      const canAfford = runState.gold >= slot.cost;

      const bg = this.scene.add
        .rectangle(cardX, cardY, cardW, cardH, NEON.UI_PANEL)
        .setStrokeStyle(2, canAfford ? NEON.UI_ACCENT : NEON.UI_BORDER);

      const nameText = this.scene.add
        .text(cardX, cardY - 46, slot.item.name, {
          fontSize: '20px',
          color: canAfford ? NEON_CSS.UI_TEXT : NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          wordWrap: { width: cardW - 12 },
          align: 'center',
        })
        .setOrigin(0.5);

      const descText = this.scene.add
        .text(cardX, cardY - 6, slot.item.desc, {
          fontSize: '14px',
          color: NEON_CSS.UI_DIM,
          fontFamily: 'monospace',
          wordWrap: { width: cardW - 12 },
          align: 'center',
        })
        .setOrigin(0.5);

      const costText = this.scene.add
        .text(cardX, cardY + 50, `${slot.cost}G`, {
          fontSize: '24px',
          color: canAfford ? NEON_CSS.GOLD : NEON_CSS.HEALTH,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.shopContainer!.add([bg, nameText, descText, costText]);

      if (canAfford) {
        bg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => bg.setStrokeStyle(3, NEON.UI_ACCENT))
          .on('pointerout', () => bg.setStrokeStyle(2, NEON.UI_ACCENT))
          .on('pointerdown', () => {
            this.applyShopChoice(slot.item.action, slot.cost, runState, player, ariaMsg);
            onCloseShop();
          });
      }
    });

    // Skip button — 200x50, placed below row2 (M-011: height >= 48dp ✓)
    const skipY = row2Y + cardH / 2 + 44;
    const skipBg = this.scene.add.rectangle(0, skipY, 200, 50, NEON.UI_PANEL).setStrokeStyle(1, NEON.UI_BORDER);
    const skipText = this.scene.add
      .text(0, skipY, t('shop.skip'), {
        fontSize: '24px',
        color: NEON_CSS.UI_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);
    this.shopContainer.add([skipBg, skipText]);

    skipBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => skipBg.setStrokeStyle(2, NEON.UI_ACCENT))
      .on('pointerout', () => skipBg.setStrokeStyle(1, NEON.UI_BORDER))
      .on('pointerdown', () => onCloseShop());

    // Auto-select timer bar
    const barW = totalRowW;
    const barH = 6;
    const barY = skipY + 40;
    this.shopAutoBarBg = this.scene.add.rectangle(0, barY, barW, barH, NEON.UI_BORDER, 0.8);
    this.shopAutoBarFill = this.scene.add.rectangle(-barW / 2, barY, barW, barH, NEON.UI_ACCENT, 0.9).setOrigin(0, 0.5);
    this.shopContainer!.add([this.shopAutoBarBg, this.shopAutoBarFill]);

    this.shopAutoBestAction = this.scoreBestShopChoiceFromSlots(slots, runState);
    this.shopAutoStartReal = Date.now();
  }

  applyShopChoice(
    action: ShopItemAction,
    cost: number,
    runState: RunState,
    player: Player,
    ariaMsg: ARIAMessage,
  ): void {
    if (runState.gold < cost) {
      getRetroSFX().purchaseFail();
      return;
    }
    runState.gold -= cost;
    trackEvent('shop_purchase', { item: action, cost });

    const shopEffects = BALANCE.ECONOMY.shopEffects;
    switch (action) {
      case 'heal': {
        runState.baseHp = applyShopHeal(runState.baseHp, runState.baseMaxHp, shopEffects.healBasePercent);
        ariaMsg.show(t('aria.shop_heal', { pct: Math.round(shopEffects.healBasePercent * 100) }));
        break;
      }
      case 'fullHeal': {
        runState.baseHp = runState.baseMaxHp;
        ariaMsg.show(t('aria.shop_heal', { pct: 100 }));
        break;
      }
      case 'damage':
        player.damageMultiplier = applyShopDamageBoost(player.damageMultiplier, shopEffects.damageBoostPercent);
        ariaMsg.show(t('aria.shop_damage', { pct: Math.round(shopEffects.damageBoostPercent * 100) }));
        break;
      case 'armor': {
        const newShopArmor = applyShopArmorBoost(
          this.callbacks.getShopArmorMultiplier(),
          shopEffects.armorBoostPercent,
        );
        this.callbacks.setShopArmorMultiplier(newShopArmor);
        const armorLevel = this.callbacks.getPassiveArmorLevel();
        const pDef = PASSIVE_DEFS['base_armor'];
        const newBaseArmor = calculateBaseArmor(newShopArmor, armorLevel, pDef.valuePerLevel);
        this.callbacks.setBaseArmorMultiplier(newBaseArmor);
        ariaMsg.show(t('aria.shop_armor', { pct: Math.round(shopEffects.armorBoostPercent * 100) }));
        break;
      }
      // Expanded shop items — effects noted for future implementation
      case 'shield':
      case 'speedBoost':
      case 'damageBoost':
      case 'xpBoost':
      case 'magnetPulse':
        ariaMsg.show(action);
        break;
    }
    getRetroSFX().purchaseSuccess();
  }

  closeShop(): void {
    this.shopAutoBestAction = undefined;
    this.shopAutoBarBg = undefined;
    this.shopAutoBarFill = undefined;
    this.shopContainer?.destroy();
    this.shopContainer = undefined;
  }

  /** Score best auto-select from 8-slot shop slots. */
  private scoreBestShopChoiceFromSlots(
    slots: ShopSlot[],
    runState: RunState,
  ): { action: ShopItemAction; cost: number } | null {
    const hpPct = runState.baseHp / runState.baseMaxHp;
    // Prioritize heal when HP is low, otherwise pick cheapest affordable item
    const affordable = slots.filter((s) => runState.gold >= s.cost);
    if (affordable.length === 0) return null;
    if (hpPct < BALANCE.MID_SHOP.healHpThreshold) {
      const healSlot = affordable.find((s) => s.item.action === 'heal' || s.item.action === 'fullHeal');
      if (healSlot) return { action: healSlot.item.action, cost: healSlot.cost };
    }
    const damageSlot = affordable.find((s) => s.item.action === 'damage' || s.item.action === 'damageBoost');
    if (damageSlot) return { action: damageSlot.item.action, cost: damageSlot.cost };
    return { action: affordable[0].item.action, cost: affordable[0].cost };
  }

  /** @deprecated Legacy 3-item scorer — kept for test compatibility. */
  private scoreBestShopChoice(items: ShopItem[], runState: RunState): { action: ShopItemAction; cost: number } | null {
    const hpPct = runState.baseHp / runState.baseMaxHp;
    return scoreBestShopChoicePure(items, runState.gold, hpPct);
  }
}
