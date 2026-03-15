/**
 * GachaCalc — Pure gacha/loot-box probability engine with pity system.
 * NO Phaser imports. All functions are pure and immutable.
 */

// ── Types ──────────────────────────────────────────────────────────

export type GachaRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface GachaItem {
  readonly id: string;
  readonly name: string;
  readonly rarity: GachaRarity;
  readonly weight: number;
}

export interface GachaBanner {
  readonly id: string;
  readonly name: string;
  readonly items: readonly GachaItem[];
  readonly pityThreshold: number;
  readonly pityRarity: GachaRarity;
  readonly guaranteedPity: boolean;
}

export interface GachaState {
  readonly bannerId: string;
  readonly pullCount: number;
  readonly sinceLast: Readonly<Record<GachaRarity, number>>;
  readonly totalPulls: number;
  readonly history: readonly string[];
}

export interface PullResult {
  readonly state: GachaState;
  readonly item: GachaItem;
}

export interface MultiPullResult {
  readonly state: GachaState;
  readonly items: readonly GachaItem[];
}

export type EffectiveRates = Readonly<Record<GachaRarity, number>>;

// ── Constants ──────────────────────────────────────────────────────

const BASE_RATES: Record<GachaRarity, number> = {
  common: 0.6,
  rare: 0.25,
  epic: 0.1,
  legendary: 0.04,
  mythic: 0.01,
};

const RARITY_ORDER: readonly GachaRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

const SOFT_PITY_THRESHOLD = 50;
const SOFT_PITY_BONUS_PER_PULL = 0.02;
const HARD_PITY_LEGENDARY = 90;
const HARD_PITY_MYTHIC = 180;

// ── PRNG ───────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function rarityRank(r: GachaRarity): number {
  return RARITY_ORDER.indexOf(r);
}

function isAtLeast(a: GachaRarity, b: GachaRarity): boolean {
  return rarityRank(a) >= rarityRank(b);
}

function clampRates(
  rates: Record<GachaRarity, number>,
): Record<GachaRarity, number> {
  const result = { ...rates };
  // Ensure no rate goes below 0
  for (const r of RARITY_ORDER) {
    if (result[r] < 0) result[r] = 0;
  }
  // Normalize to sum = 1
  const sum = RARITY_ORDER.reduce((s, r) => s + result[r], 0);
  if (sum > 0) {
    for (const r of RARITY_ORDER) {
      result[r] = result[r] / sum;
    }
  }
  return result;
}

// ── Public API ─────────────────────────────────────────────────────

/** Create a fresh gacha state for a banner. */
export function createGachaState(bannerId: string): GachaState {
  return {
    bannerId,
    pullCount: 0,
    sinceLast: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    totalPulls: 0,
    history: [],
  };
}

/** Get current effective rates accounting for pity. */
export function getRates(
  state: GachaState,
  _banner: GachaBanner,
): EffectiveRates {
  const rates = { ...BASE_RATES };

  // Soft pity: after 50 pulls without epic+, increase epic rate
  const pullsSinceEpicPlus = Math.min(
    state.sinceLast.epic,
    state.sinceLast.legendary,
    state.sinceLast.mythic,
  );

  if (pullsSinceEpicPlus > SOFT_PITY_THRESHOLD) {
    const bonus =
      (pullsSinceEpicPlus - SOFT_PITY_THRESHOLD) * SOFT_PITY_BONUS_PER_PULL;
    rates.epic += bonus;
    // Deduct from common to keep total reasonable before clamping
    rates.common -= bonus;
  }

  // Hard pity for legendary at 90
  if (state.sinceLast.legendary >= HARD_PITY_LEGENDARY) {
    rates.legendary = 1.0;
    rates.common = 0;
    rates.rare = 0;
    rates.epic = 0;
    rates.mythic = 0;
  }

  // Hard pity for mythic at 180
  if (state.sinceLast.mythic >= HARD_PITY_MYTHIC) {
    rates.mythic = 1.0;
    rates.common = 0;
    rates.rare = 0;
    rates.epic = 0;
    rates.legendary = 0;
  }

  return clampRates(rates);
}

/** Perform a single pull. Pure function — returns new state + item. */
export function pull(
  state: GachaState,
  banner: GachaBanner,
  seed: number,
): PullResult {
  const rng = mulberry32(seed);
  const rates = getRates(state, banner);

  // Determine rarity via cumulative distribution
  const roll = rng();
  let cumulative = 0;
  let selectedRarity: GachaRarity = "common";
  for (const r of RARITY_ORDER) {
    cumulative += rates[r];
    if (roll < cumulative) {
      selectedRarity = r;
      break;
    }
  }

  // Filter items by rarity, pick by weight
  const candidates = banner.items.filter((i) => i.rarity === selectedRarity);
  let item: GachaItem;

  if (candidates.length === 0) {
    // Fallback: pick from all items of nearest rarity
    const fallback =
      banner.items.length > 0
        ? banner.items[0]
        : {
            id: "fallback",
            name: "Fallback Item",
            rarity: selectedRarity,
            weight: 1,
          };
    item = fallback;
  } else {
    const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
    const weightRoll = rng() * totalWeight;
    let wCumulative = 0;
    item = candidates[0];
    for (const c of candidates) {
      wCumulative += c.weight;
      if (weightRoll < wCumulative) {
        item = c;
        break;
      }
    }
  }

  // Update sinceLast: increment all, reset the pulled rarity
  const newSinceLast = { ...state.sinceLast };
  for (const r of RARITY_ORDER) {
    newSinceLast[r] = newSinceLast[r] + 1;
  }
  newSinceLast[item.rarity] = 0;

  const newState: GachaState = {
    bannerId: state.bannerId,
    pullCount: state.pullCount + 1,
    sinceLast: newSinceLast,
    totalPulls: state.totalPulls + 1,
    history: [...state.history, item.id],
  };

  return { state: newState, item };
}

/** Multi-pull with guaranteed rare+ in a batch (e.g., 10-pull). */
export function multiPull(
  state: GachaState,
  banner: GachaBanner,
  count: number,
  seed: number,
): MultiPullResult {
  const rng = mulberry32(seed);
  const items: GachaItem[] = [];
  let currentState = state;

  for (let i = 0; i < count; i++) {
    const pullSeed = Math.floor(rng() * 0xffffffff);
    const result = pull(currentState, banner, pullSeed);
    currentState = result.state;
    items.push(result.item);
  }

  // Guaranteed rare+ check: if no rare+ in batch, replace last common with a random rare
  const hasRarePlus = items.some((item) => isAtLeast(item.rarity, "rare"));
  if (!hasRarePlus && count > 0) {
    const rareCandidates = banner.items.filter((i) => i.rarity === "rare");
    if (rareCandidates.length > 0) {
      const replacementSeed = Math.floor(rng() * 0xffffffff);
      const replacementRng = mulberry32(replacementSeed);
      const totalWeight = rareCandidates.reduce((s, c) => s + c.weight, 0);
      const roll = replacementRng() * totalWeight;
      let cum = 0;
      let replacement = rareCandidates[0];
      for (const c of rareCandidates) {
        cum += c.weight;
        if (roll < cum) {
          replacement = c;
          break;
        }
      }

      // Find last common item and replace it
      const lastCommonIdx = items.map((i) => i.rarity).lastIndexOf("common");
      if (lastCommonIdx >= 0) {
        items[lastCommonIdx] = replacement;

        // Update history in state
        const newHistory = [...currentState.history];
        const historyOffset = currentState.history.length - count;
        newHistory[historyOffset + lastCommonIdx] = replacement.id;

        // Fix sinceLast for the replacement
        const newSinceLast = { ...currentState.sinceLast };
        // Recalculate sinceLast.rare based on the replacement position
        const pullsAfterReplacement = count - 1 - lastCommonIdx;
        if (pullsAfterReplacement < newSinceLast.rare) {
          newSinceLast.rare = pullsAfterReplacement;
        }

        currentState = {
          ...currentState,
          history: newHistory,
          sinceLast: newSinceLast,
        };
      }
    }
  }

  return { state: currentState, items };
}

/** Get pulls since last drop of the specified rarity. */
export function getPityProgress(
  state: GachaState,
  rarity: GachaRarity,
): number {
  return state.sinceLast[rarity];
}

/** Check if soft pity is active (past threshold without epic+). */
export function isPitySoftActive(state: GachaState): boolean {
  const pullsSinceEpicPlus = Math.min(
    state.sinceLast.epic,
    state.sinceLast.legendary,
    state.sinceLast.mythic,
  );
  return pullsSinceEpicPlus > SOFT_PITY_THRESHOLD;
}

/** Get number of pulls until guaranteed drop of a rarity. */
export function getGuaranteedIn(
  state: GachaState,
  rarity: GachaRarity,
): number {
  switch (rarity) {
    case "legendary":
      return Math.max(0, HARD_PITY_LEGENDARY - state.sinceLast.legendary);
    case "mythic":
      return Math.max(0, HARD_PITY_MYTHIC - state.sinceLast.mythic);
    default:
      return -1; // No hard pity for common/rare/epic
  }
}

/** Calculate mathematical expected pulls for a rarity (base rates, no pity). */
export function calculateExpectedPulls(rarity: GachaRarity): number {
  const rate = BASE_RATES[rarity];
  if (rate <= 0) return Infinity;
  return 1 / rate;
}

/** Get last N pull IDs from history. */
export function getHistory(
  state: GachaState,
  limit?: number,
): readonly string[] {
  if (limit === undefined || limit >= state.history.length) {
    return state.history;
  }
  return state.history.slice(-limit);
}

/** Reset pity counters (e.g., for a new banner rotation). */
export function resetPity(state: GachaState): GachaState {
  return {
    ...state,
    pullCount: 0,
    sinceLast: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 },
  };
}

/** Calculate total cost for a number of pulls. */
export function calculateCost(pulls: number, pricePerPull: number): number {
  return pulls * pricePerPull;
}

/** Calculate average value per pull for a banner (weighted by rarity rank). */
export function getBannerValue(banner: GachaBanner): number {
  if (banner.items.length === 0) return 0;

  const totalWeight = banner.items.reduce((s, i) => s + i.weight, 0);
  if (totalWeight === 0) return 0;

  let weightedValue = 0;
  for (const item of banner.items) {
    const rarityValue = rarityRank(item.rarity) + 1; // 1-5
    weightedValue += (item.weight / totalWeight) * rarityValue;
  }

  return weightedValue;
}
