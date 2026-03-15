/**
 * Pure shop decision logic extracted from ShopManager.
 * NO Phaser imports (M-001). All balance numbers from config (M-002).
 *
 * TASK-188: Expanded from 3 → 8 slots with tiered pricing.
 * TASK-189: Expanded item pool with buffs and consumables.
 */

import { BALANCE } from '../config/balance';
import type { ExpandedShopItem, ShopItemAction, ShopSlot } from '../types/game';
import { calcSlotPrice } from './ProgressionCurveCalc';

export interface ShopItem {
  name: string;
  desc: string;
  cost: number;
  action: 'heal' | 'damage' | 'armor';
}

export interface ShopConfig {
  /** HP threshold below which heal is prioritized (0-1). */
  healHpThreshold: number;
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  healHpThreshold: BALANCE.MID_SHOP.healHpThreshold,
};

export interface ShopChoice {
  action: ShopItemAction;
  cost: number;
}

// ── Expanded Item Pool (TASK-189) ────────────────────────────────────────────

/** The full expanded item pool — 9 item types. */
export const EXPANDED_ITEM_POOL: readonly ExpandedShopItem[] = [
  // --- Original 3 items ---
  {
    id: 'heal',
    name: 'Medkit',
    desc: 'Restore 30% base HP',
    baseCost: BALANCE.ECONOMY.shopCosts['heal'],
    action: 'heal',
    effectValue: BALANCE.ECONOMY.shopEffects.healBasePercent,
  },
  {
    id: 'damage',
    name: 'Damage Core',
    desc: '+25% damage for this run',
    baseCost: BALANCE.ECONOMY.shopCosts['damage'],
    action: 'damage',
    effectValue: BALANCE.ECONOMY.shopEffects.damageBoostPercent,
  },
  {
    id: 'armor',
    name: 'Armor Plating',
    desc: '+25% armor for this run',
    baseCost: BALANCE.ECONOMY.shopCosts['armor'],
    action: 'armor',
    effectValue: BALANCE.ECONOMY.shopEffects.armorBoostPercent,
  },
  // --- New Temporary Buffs (TASK-189) ---
  {
    id: 'shield',
    name: 'Shield Module',
    desc: `Absorb ${BALANCE.ECONOMY.shieldAbsorbHits} incoming hits`,
    baseCost: BALANCE.ECONOMY.shopCosts['shield'],
    action: 'shield',
    effectValue: BALANCE.ECONOMY.shieldAbsorbHits,
  },
  {
    id: 'speedBoost',
    name: 'Speed Chip',
    desc: `+30% move speed for ${BALANCE.ECONOMY.speedBoostDurationMs / 1000}s`,
    baseCost: BALANCE.ECONOMY.shopCosts['speedBoost'],
    action: 'speedBoost',
    durationMs: BALANCE.ECONOMY.speedBoostDurationMs,
    effectValue: BALANCE.ECONOMY.speedBoostMultiplier,
  },
  {
    id: 'damageBoost',
    name: 'Power Surge',
    desc: `+50% damage for ${BALANCE.ECONOMY.damageBoostDurationMs / 1000}s`,
    baseCost: BALANCE.ECONOMY.shopCosts['damageBoost'],
    action: 'damageBoost',
    durationMs: BALANCE.ECONOMY.damageBoostDurationMs,
    effectValue: BALANCE.ECONOMY.damageBoostMultiplier,
  },
  // --- New Consumables (TASK-189) ---
  {
    id: 'fullHeal',
    name: 'Full Repair',
    desc: 'Fully restore base HP',
    baseCost: BALANCE.ECONOMY.shopCosts['fullHeal'],
    action: 'fullHeal',
  },
  {
    id: 'xpBoost',
    name: 'XP Amplifier',
    desc: `2x XP gain for ${BALANCE.ECONOMY.xpBoostDurationMs / 1000}s`,
    baseCost: BALANCE.ECONOMY.shopCosts['xpBoost'],
    action: 'xpBoost',
    durationMs: BALANCE.ECONOMY.xpBoostDurationMs,
    effectValue: BALANCE.ECONOMY.xpBoostMultiplier,
  },
  {
    id: 'magnetPulse',
    name: 'Magnet Pulse',
    desc: 'Collect all XP orbs on screen',
    baseCost: BALANCE.ECONOMY.shopCosts['magnetPulse'],
    action: 'magnetPulse',
  },
];

/** Total number of shop slots. */
export const SHOP_SLOT_COUNT = 8;

/**
 * Generate 8 shop slots from the expanded item pool.
 * Shuffles pool using provided seed index, fills 8 slots.
 * Items are distributed so variety is ensured.
 * Later slots apply price multipliers per BALANCE.ECONOMY.shopSlotTiers.
 *
 * @param availableGold Current player gold (for affordability info only — does not filter).
 * @param seed Simple integer seed to vary shop offerings per-run/stage.
 */
export function generateShopSlots(availableGold: number, seed: number = 0): ShopSlot[] {
  const pool = [...EXPANDED_ITEM_POOL];

  // Simple deterministic shuffle using seed
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.abs((seed * 1664525 + i * 1013904223) % (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Fill 8 slots, cycling through shuffled pool if needed
  const slots: ShopSlot[] = [];
  for (let i = 0; i < SHOP_SLOT_COUNT; i++) {
    const item = pool[i % pool.length];
    slots.push({
      item,
      cost: calcSlotPrice(item.baseCost, i),
      slotIndex: i,
    });
  }

  return slots;
}

/**
 * Filter shop slots the player can afford.
 */
export function filterAffordableSlots(slots: readonly ShopSlot[], gold: number): ShopSlot[] {
  return slots.filter((slot) => gold >= slot.cost);
}

/**
 * Get a shop slot by item action from a list of slots.
 */
export function findSlotByAction(slots: readonly ShopSlot[], action: ShopItemAction): ShopSlot | undefined {
  return slots.find((slot) => slot.item.action === action);
}

/**
 * Filter shop items the player can afford.
 */
export function filterAffordableItems(items: readonly ShopItem[], gold: number): ShopItem[] {
  return items.filter((item) => gold >= item.cost);
}

/**
 * Score and select the best shop choice for auto-select.
 *
 * Priority:
 * 1. If HP% < threshold and heal is affordable → heal
 * 2. If damage boost is affordable → damage
 * 3. Fallback → first affordable item (cheapest by position)
 * 4. Nothing affordable → null
 */
export function scoreBestShopChoice(
  items: readonly ShopItem[],
  currentGold: number,
  hpPercent: number,
  config: ShopConfig = DEFAULT_SHOP_CONFIG,
): ShopChoice | null {
  const affordable = filterAffordableItems(items, currentGold);
  if (affordable.length === 0) return null;

  // Low HP → prioritize heal
  const heal = affordable.find((it) => it.action === 'heal');
  if (heal && hpPercent < config.healHpThreshold) {
    return { action: heal.action, cost: heal.cost };
  }

  // Prefer damage boost
  const dmg = affordable.find((it) => it.action === 'damage');
  if (dmg) {
    return { action: dmg.action, cost: dmg.cost };
  }

  // Fallback to first affordable
  return { action: affordable[0].action, cost: affordable[0].cost };
}

/**
 * Calculate heal amount from shop heal purchase.
 */
export function calculateShopHeal(baseMaxHp: number, healPercent: number): number {
  return Math.ceil(baseMaxHp * healPercent);
}

/**
 * Calculate new HP after shop heal (clamped to max).
 */
export function applyShopHeal(currentHp: number, baseMaxHp: number, healPercent: number): number {
  const healAmount = calculateShopHeal(baseMaxHp, healPercent);
  return Math.min(baseMaxHp, currentHp + healAmount);
}

/**
 * Calculate new damage multiplier after shop damage boost.
 */
export function applyShopDamageBoost(currentMultiplier: number, boostPercent: number): number {
  return currentMultiplier * (1 + boostPercent);
}

/**
 * Calculate new armor multiplier after shop armor purchase.
 * Returns the new shop armor multiplier.
 */
export function applyShopArmorBoost(currentShopArmor: number, boostPercent: number): number {
  return currentShopArmor * (1 - boostPercent);
}

/**
 * Recalculate base armor multiplier after shop armor + passive armor.
 */
export function calculateBaseArmor(
  shopArmorMultiplier: number,
  passiveArmorLevel: number,
  passiveValuePerLevel: number,
): number {
  if (passiveArmorLevel > 0) {
    return (
      Math.max(BALANCE.MID_SHOP.minArmorMultiplier, 1 - passiveValuePerLevel * passiveArmorLevel) * shopArmorMultiplier
    );
  }
  return shopArmorMultiplier;
}
