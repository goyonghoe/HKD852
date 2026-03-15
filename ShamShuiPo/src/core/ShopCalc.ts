// ── ShopCalc — Pure in-run shop logic (no Phaser) ──

// ────────────────────────── Types ──────────────────────────

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ItemType = "weapon" | "passive" | "heal" | "reroll_token";

export interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly type: ItemType;
  readonly cost: number;
  readonly rarity: Rarity;
  readonly isSold: boolean;
}

export interface ShopState {
  readonly offerings: readonly ShopItem[];
  readonly rerollCount: number;
  readonly rerollBaseCost: number;
  readonly discountPercent: number;
  readonly gold: number;
}

export interface PurchaseResult {
  readonly state: ShopState;
  readonly success: boolean;
  readonly reason: string;
}

export interface RerollResult {
  readonly state: ShopState;
  readonly success: boolean;
  readonly reason: string;
}

// ────────────────────────── PRNG ──────────────────────────

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ────────────────────────── Item Pool ──────────────────────────

interface PoolEntry {
  readonly name: string;
  readonly type: ItemType;
  readonly rarity: Rarity;
  readonly cost: number;
}

const RARITY_PRICES: Record<Rarity, number> = {
  common: 50,
  rare: 100,
  epic: 200,
  legendary: 400,
};

const ITEM_POOL: readonly PoolEntry[] = [
  // Weapons — 4 common, 3 rare, 2 epic, 1 legendary
  {
    name: "Pulse Pistol",
    type: "weapon",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Scatter Shot",
    type: "weapon",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Neon Blade",
    type: "weapon",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Shock Drone",
    type: "weapon",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Plasma Rifle",
    type: "weapon",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  {
    name: "Arc Launcher",
    type: "weapon",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  {
    name: "Cryo Beam",
    type: "weapon",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  { name: "Railgun", type: "weapon", rarity: "epic", cost: RARITY_PRICES.epic },
  {
    name: "Void Cannon",
    type: "weapon",
    rarity: "epic",
    cost: RARITY_PRICES.epic,
  },
  {
    name: "Singularity Core",
    type: "weapon",
    rarity: "legendary",
    cost: RARITY_PRICES.legendary,
  },

  // Passives — 4 common, 3 rare, 2 epic, 1 legendary
  {
    name: "Speed Boost",
    type: "passive",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "HP Regen",
    type: "passive",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Magnet Range",
    type: "passive",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Armor Plating",
    type: "passive",
    rarity: "common",
    cost: RARITY_PRICES.common,
  },
  {
    name: "Crit Chance",
    type: "passive",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  {
    name: "Cooldown Redux",
    type: "passive",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  {
    name: "Area Boost",
    type: "passive",
    rarity: "rare",
    cost: RARITY_PRICES.rare,
  },
  {
    name: "Projectile Multi",
    type: "passive",
    rarity: "epic",
    cost: RARITY_PRICES.epic,
  },
  {
    name: "Crit Damage",
    type: "passive",
    rarity: "epic",
    cost: RARITY_PRICES.epic,
  },
  {
    name: "Quantum Shield",
    type: "passive",
    rarity: "legendary",
    cost: RARITY_PRICES.legendary,
  },
];

const HEAL_ITEM: PoolEntry = {
  name: "Repair Kit",
  type: "heal",
  rarity: "common",
  cost: 30,
};

// ────────────────────────── Rarity Distribution ──────────────────────────

interface RarityWeights {
  readonly common: number;
  readonly rare: number;
  readonly epic: number;
  readonly legendary: number;
}

function getRarityWeights(playerLevel: number): RarityWeights {
  if (playerLevel <= 3)
    return { common: 0.7, rare: 0.25, epic: 0.05, legendary: 0.0 };
  if (playerLevel <= 6)
    return { common: 0.5, rare: 0.35, epic: 0.13, legendary: 0.02 };
  if (playerLevel <= 9)
    return { common: 0.3, rare: 0.4, epic: 0.22, legendary: 0.08 };
  return { common: 0.15, rare: 0.35, epic: 0.35, legendary: 0.15 };
}

function pickRarity(roll: number, weights: RarityWeights): Rarity {
  if (roll < weights.common) return "common";
  if (roll < weights.common + weights.rare) return "rare";
  if (roll < weights.common + weights.rare + weights.epic) return "epic";
  return "legendary";
}

function pickFromPool(rarity: Rarity, rng: () => number): PoolEntry {
  const candidates = ITEM_POOL.filter((e) => e.rarity === rarity);
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
}

// ────────────────────────── Public API ──────────────────────────

/** Create an empty shop state with initial gold. */
export function createShop(gold: number): ShopState {
  return {
    offerings: [],
    rerollCount: 0,
    rerollBaseCost: 50,
    discountPercent: 0,
    gold,
  };
}

/** Generate 3 shop offerings based on player level and seed. */
export function generateOfferings(
  state: ShopState,
  playerLevel: number,
  seed: number,
): ShopState {
  const rng = mulberry32(seed);
  const weights = getRarityWeights(playerLevel);

  const items: ShopItem[] = [];

  // 2 random items (weapon or passive)
  for (let i = 0; i < 2; i++) {
    const rarity = pickRarity(rng(), weights);
    const entry = pickFromPool(rarity, rng);
    items.push({
      id: `shop_${seed}_${i}`,
      name: entry.name,
      type: entry.type,
      cost: entry.cost,
      rarity: entry.rarity,
      isSold: false,
    });
  }

  // 1 heal item always available
  items.push({
    id: `shop_${seed}_heal`,
    name: HEAL_ITEM.name,
    type: HEAL_ITEM.type,
    cost: HEAL_ITEM.cost,
    rarity: HEAL_ITEM.rarity,
    isSold: false,
  });

  return { ...state, offerings: items };
}

/** Purchase an item by id. Returns new state, success flag, and reason. */
export function purchaseItem(state: ShopState, itemId: string): PurchaseResult {
  const item = state.offerings.find((i) => i.id === itemId);

  if (!item) {
    return { state, success: false, reason: "Item not found" };
  }
  if (item.isSold) {
    return { state, success: false, reason: "Item already sold" };
  }

  const finalPrice = getDiscountedPrice(item, state.discountPercent);

  if (state.gold < finalPrice) {
    return { state, success: false, reason: "Not enough gold" };
  }

  const updatedOfferings = state.offerings.map((i) =>
    i.id === itemId ? { ...i, isSold: true } : i,
  );

  return {
    state: {
      ...state,
      offerings: updatedOfferings,
      gold: state.gold - finalPrice,
    },
    success: true,
    reason: "Purchase successful",
  };
}

/** Reroll shop offerings. Cost doubles each time. */
export function rerollShop(state: ShopState, seed: number): RerollResult {
  const cost = getRerollCost(state);

  if (state.gold < cost) {
    return { state, success: false, reason: "Not enough gold to reroll" };
  }

  const deducted: ShopState = {
    ...state,
    gold: state.gold - cost,
    rerollCount: state.rerollCount + 1,
  };

  // Re-generate offerings with new seed; use level 5 as default mid-tier
  // The caller should use generateOfferings separately for level-aware rerolls.
  // Here we regenerate with the same structure.
  const rng = mulberry32(seed);
  const weights = getRarityWeights(5); // mid-tier default for rerolls

  const items: ShopItem[] = [];
  for (let i = 0; i < 2; i++) {
    const rarity = pickRarity(rng(), weights);
    const entry = pickFromPool(rarity, rng);
    items.push({
      id: `reroll_${seed}_${i}`,
      name: entry.name,
      type: entry.type,
      cost: entry.cost,
      rarity: entry.rarity,
      isSold: false,
    });
  }

  items.push({
    id: `reroll_${seed}_heal`,
    name: HEAL_ITEM.name,
    type: HEAL_ITEM.type,
    cost: HEAL_ITEM.cost,
    rarity: HEAL_ITEM.rarity,
    isSold: false,
  });

  return {
    state: { ...deducted, offerings: items },
    success: true,
    reason: "Reroll successful",
  };
}

/** Calculate current reroll cost: baseCost * 2^rerollCount */
export function getRerollCost(state: ShopState): number {
  return state.rerollBaseCost * Math.pow(2, state.rerollCount);
}

/** Apply a discount percentage (capped 0-50). */
export function applyDiscount(state: ShopState, percent: number): ShopState {
  const capped = Math.max(0, Math.min(50, percent));
  return { ...state, discountPercent: capped };
}

/** Get final price after discount (minimum 1). */
export function getDiscountedPrice(
  item: ShopItem,
  discountPercent: number,
): number {
  const discounted = item.cost * (1 - discountPercent / 100);
  return Math.max(1, Math.floor(discounted));
}

/** Check if player can afford an item (with discount). */
export function canAfford(state: ShopState, itemId: string): boolean {
  const item = state.offerings.find((i) => i.id === itemId);
  if (!item || item.isSold) return false;
  return state.gold >= getDiscountedPrice(item, state.discountPercent);
}

/** Add gold to shop state. */
export function addGold(state: ShopState, amount: number): ShopState {
  return { ...state, gold: state.gold + amount };
}

/** Get available (unsold) items. */
export function getAvailableItems(state: ShopState): readonly ShopItem[] {
  return state.offerings.filter((i) => !i.isSold);
}
