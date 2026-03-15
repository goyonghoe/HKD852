/**
 * DaiPaiDongCalc — pure TypeScript Dai Pai Dong (大排檔) buff station logic.
 * NO Phaser imports. Immutable state management.
 *
 * Handles station placement, interaction progress, food buffs, and cooldowns.
 */

import { DAI_PAI_DONG } from "../config/balance";
import type { FragmentType } from "../types/game";

// ─── Interfaces ───────────────────────────────────────────────

export interface StationPosition {
  readonly x: number;
  readonly y: number;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly nameEn: string;
  readonly effect: string;
  readonly value: number;
  readonly durationMs: number;
}

/**
 * A purchasable item in the Dai Pai Dong shop.
 * Items may cost coins, fragments, or both.
 */
export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly nameEn: string;
  readonly effect: string;
  readonly value: number;
  readonly durationMs: number;
  readonly costCoins: number;
  /** Fragment requirements — empty array means coins-only purchase */
  readonly costFragments: ReadonlyArray<{
    readonly type: FragmentType;
    readonly count: number;
  }>;
}

export interface PurchaseResult {
  readonly success: boolean;
  readonly remainingCoins: number;
  readonly remainingFragments: FragmentType[];
  /** The item that was purchased, or null if purchase failed */
  readonly item: ShopItem | null;
  readonly failReason?: string;
}

export interface InteractionState {
  readonly inRange: boolean;
  readonly progress: number; // 0.0 to 1.0
  readonly elapsedMs: number;
}

export interface FoodBuff {
  readonly foodId: string;
  readonly effect: string;
  readonly value: number;
  readonly remainingMs: number;
  readonly totalDurationMs: number;
}

export interface StationState {
  readonly position: StationPosition;
  readonly lastUsedAt: number; // timestamp in ms, -1 if never used
  readonly available: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const CENTER_EXCLUSION_RATIO = 0.2; // avoid center 20% of map

// ─── Station Positioning ──────────────────────────────────────

/**
 * Generate evenly distributed station positions, avoiding the center
 * (player start area). Divides the map into equal vertical bands.
 */
export function generateStationPositions(
  mapWidth: number,
  mapHeight: number,
  count: number,
): StationPosition[] {
  if (count <= 0) return [];

  const positions: StationPosition[] = [];
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const exclusionX = mapWidth * CENTER_EXCLUSION_RATIO;
  const exclusionY = mapHeight * CENTER_EXCLUSION_RATIO;

  // Distribute stations in a ring around the map, avoiding center
  const angleStep = (2 * Math.PI) / count;
  const radiusX = mapWidth * 0.35; // 35% from center
  const radiusY = mapHeight * 0.35;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i + Math.PI / 4; // offset to avoid axis-aligned
    let x = centerX + Math.cos(angle) * radiusX;
    let y = centerY + Math.sin(angle) * radiusY;

    // Clamp to map bounds with margin
    const margin = 40;
    x = Math.max(margin, Math.min(mapWidth - margin, x));
    y = Math.max(margin, Math.min(mapHeight - margin, y));

    // Push away from center if too close
    const dx = x - centerX;
    const dy = y - centerY;
    if (Math.abs(dx) < exclusionX && Math.abs(dy) < exclusionY) {
      x = dx >= 0 ? centerX + exclusionX : centerX - exclusionX;
      y = dy >= 0 ? centerY + exclusionY : centerY - exclusionY;
    }

    positions.push({ x: Math.round(x), y: Math.round(y) });
  }

  return positions;
}

// ─── Interaction ──────────────────────────────────────────────

/**
 * Calculate interaction progress based on distance and elapsed time.
 */
export function getInteractionProgress(
  playerX: number,
  playerY: number,
  stationX: number,
  stationY: number,
  radius: number,
  elapsedMs: number,
): InteractionState {
  const dx = playerX - stationX;
  const dy = playerY - stationY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const inRange = dist <= radius;

  if (!inRange) {
    return { inRange: false, progress: 0, elapsedMs: 0 };
  }

  // interactionTimeMs = 0 means instant interaction (SPEC-034 §4.7)
  const progress =
    DAI_PAI_DONG.interactionTimeMs === 0
      ? 1.0
      : Math.min(elapsedMs / DAI_PAI_DONG.interactionTimeMs, 1.0);
  return { inRange: true, progress, elapsedMs };
}

/**
 * Reset interaction on damage (or leaving range).
 */
export function interruptInteraction(): InteractionState {
  return { inRange: false, progress: 0, elapsedMs: 0 };
}

// ─── Food Selection ───────────────────────────────────────────

/**
 * Select a random food item from the menu.
 * Uses a provided roll value (0-1) for deterministic testing.
 */
export function serveFood(menu: readonly MenuItem[], roll?: number): MenuItem {
  if (menu.length === 0) {
    throw new Error("Menu cannot be empty");
  }
  const r = roll !== undefined ? roll : Math.random();
  const index = Math.min(Math.floor(r * menu.length), menu.length - 1);
  return menu[index];
}

// ─── Buff Management ──────────────────────────────────────────

/**
 * Apply a food buff — replaces existing buff if maxActiveBuffs is 1.
 */
export function applyFoodBuff(
  currentBuffs: readonly FoodBuff[],
  newFood: MenuItem,
): FoodBuff[] {
  const newBuff: FoodBuff = {
    foodId: newFood.id,
    effect: newFood.effect,
    value: newFood.value,
    remainingMs: newFood.durationMs,
    totalDurationMs: newFood.durationMs,
  };

  // Instant effects (durationMs === 0) don't persist as buffs
  if (newFood.durationMs === 0) {
    // Still return a brief entry so the caller can detect and apply the instant effect
    return [newBuff];
  }

  // Max 1 active buff — replace any existing
  if (currentBuffs.length >= DAI_PAI_DONG.maxActiveBuffs) {
    return [newBuff];
  }

  return [...currentBuffs, newBuff];
}

/**
 * Tick all food buffs, decrementing their remaining time.
 * Expired buffs are removed.
 */
export function tickFoodBuffs(
  buffs: readonly FoodBuff[],
  deltaMs: number,
): FoodBuff[] {
  return buffs
    .map((buff) => ({
      ...buff,
      remainingMs: buff.remainingMs - deltaMs,
    }))
    .filter((buff) => buff.remainingMs > 0);
}

// ─── Station Cooldown ─────────────────────────────────────────

/**
 * Check if a station is available (not on cooldown).
 */
export function isStationAvailable(
  lastUsedAt: number,
  currentTime: number,
  cooldownMs: number,
): boolean {
  if (lastUsedAt < 0) return true; // never used
  return currentTime - lastUsedAt >= cooldownMs;
}

// ─── Buff Query ───────────────────────────────────────────────

// ─── Fragment Shop ─────────────────────────────────────────────

/**
 * Build the shop menu for a given wave. Returns ShopItem entries for all
 * food items (with coin prices) plus fragment-purchase options.
 *
 * The menu is deterministic for a given wave — used for UI display.
 * In a full game implementation the selection would be filtered by
 * dynamic conditions; here we return the full catalogue.
 */
export function getShopMenu(_currentWave: number): ShopItem[] {
  const menu = DAI_PAI_DONG.menu;
  const prices = DAI_PAI_DONG.shopMenuPrices;
  const fragPurchases = DAI_PAI_DONG.fragmentPurchases;

  const foodItems: ShopItem[] = menu.map((item) => ({
    id: item.id,
    name: item.name,
    nameEn: item.nameEn,
    effect: item.effect,
    value: item.value,
    durationMs: item.durationMs,
    costCoins: prices[item.id] ?? 20,
    costFragments: [],
  }));

  // Add fragment-purchase options
  const buySpecificFragment: ShopItem = {
    id: "buy_fragment_specific",
    name: "指定霓虹碎片",
    nameEn: "Specific Neon Fragment",
    effect: "grantFragment",
    value: 1,
    durationMs: 0,
    costCoins: fragPurchases.specificFragmentCost,
    costFragments: [],
  };

  const buyRandomFragment: ShopItem = {
    id: "buy_fragment_random",
    name: "隨機霓虹碎片",
    nameEn: "Random Neon Fragment",
    effect: "grantRandomFragment",
    value: 1,
    durationMs: 0,
    costCoins: fragPurchases.randomFragmentCost,
    costFragments: [],
  };

  return [...foodItems, buySpecificFragment, buyRandomFragment];
}

/**
 * Check whether the player can afford a ShopItem given their current
 * coins and fragment inventory.
 */
export function canAfford(
  item: ShopItem,
  coins: number,
  fragments: FragmentType[],
): boolean {
  if (coins < item.costCoins) return false;

  // Check fragment costs
  const available = [...fragments];
  for (const cost of item.costFragments) {
    let needed = cost.count;
    for (let i = available.length - 1; i >= 0 && needed > 0; i--) {
      if (available[i] === cost.type) {
        available.splice(i, 1);
        needed--;
      }
    }
    if (needed > 0) return false;
  }

  return true;
}

/**
 * Purchase a ShopItem. Deducts coins and fragments from the player's
 * inventory. Returns the updated state as a PurchaseResult.
 *
 * This function is pure and immutable — it never modifies its inputs.
 */
export function purchaseItem(
  item: ShopItem,
  coins: number,
  fragments: FragmentType[],
): PurchaseResult {
  if (!canAfford(item, coins, fragments)) {
    return {
      success: false,
      remainingCoins: coins,
      remainingFragments: [...fragments],
      item: null,
      failReason: "Insufficient coins or fragments",
    };
  }

  let remainingCoins = coins - item.costCoins;
  let remainingFragments = [...fragments];

  // Consume required fragments (remove from inventory)
  for (const cost of item.costFragments) {
    let needed = cost.count;
    remainingFragments = remainingFragments.filter((frag) => {
      if (needed > 0 && frag === cost.type) {
        needed--;
        return false; // consume
      }
      return true;
    });
  }

  return {
    success: true,
    remainingCoins,
    remainingFragments,
    item,
  };
}

/**
 * Get the additive and multiplicative bonuses from active food buffs for a given stat.
 */
export function getFoodBuffMultiplier(
  buffs: readonly FoodBuff[],
  stat: string,
): { additive: number; multiplicative: number } {
  let additive = 0;
  let multiplicative = 1;

  for (const buff of buffs) {
    if (buff.remainingMs <= 0) continue;

    switch (stat) {
      case "fireDamage":
        if (buff.effect === "fireDamage") multiplicative += buff.value;
        break;
      case "speed":
        if (buff.effect === "speedAndAttack") multiplicative += buff.value;
        break;
      case "attackSpeed":
        if (buff.effect === "speedAndAttack") multiplicative += buff.value;
        break;
      case "xpBonus":
        if (buff.effect === "xpBonus") multiplicative += buff.value;
        break;
      case "pierce":
        if (buff.effect === "pierce") additive += buff.value;
        break;
      case "armor":
        if (buff.effect === "armor") additive += buff.value;
        break;
      default:
        break;
    }
  }

  return { additive, multiplicative };
}
