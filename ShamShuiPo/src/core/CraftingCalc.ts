// ════════════════════════════════════════════════════════════════
// CraftingCalc — pure TypeScript, NO Phaser imports
// Immutable crafting/fusion system for item recipes
// ════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────

export interface CraftingInput {
  readonly itemId: string;
  readonly quantity: number;
}

export interface CraftingOutput {
  readonly itemId: string;
  readonly quantity: number;
}

export interface CraftingRecipe {
  readonly id: string;
  readonly name: string;
  readonly inputs: ReadonlyArray<CraftingInput>;
  readonly output: CraftingOutput;
  readonly successRate: number; // 0-1
  readonly levelRequired: number;
}

export type CraftingInventory = Readonly<Record<string, number>>;

export interface CraftingState {
  readonly inventory: CraftingInventory;
  readonly recipes: ReadonlyArray<CraftingRecipe>;
  readonly discoveredRecipes: ReadonlyArray<string>;
  readonly craftCount: number;
}

export interface CraftResult {
  readonly state: CraftingState;
  readonly success: boolean;
  readonly reason: string;
}

// ── Pre-defined Recipes ──────────────────────────────────────────

export const DEFAULT_RECIPES: ReadonlyArray<CraftingRecipe> = [
  {
    id: "recipe_iron_blade",
    name: "Iron Blade",
    inputs: [
      { itemId: "iron_ore", quantity: 3 },
      { itemId: "wood", quantity: 1 },
    ],
    output: { itemId: "iron_blade", quantity: 1 },
    successRate: 1.0,
    levelRequired: 1,
  },
  {
    id: "recipe_steel_sword",
    name: "Steel Sword",
    inputs: [
      { itemId: "iron_blade", quantity: 1 },
      { itemId: "steel_ingot", quantity: 2 },
    ],
    output: { itemId: "steel_sword", quantity: 1 },
    successRate: 0.9,
    levelRequired: 3,
  },
  {
    id: "recipe_energy_cell",
    name: "Energy Cell",
    inputs: [
      { itemId: "crystal_shard", quantity: 2 },
      { itemId: "copper_wire", quantity: 3 },
    ],
    output: { itemId: "energy_cell", quantity: 1 },
    successRate: 0.85,
    levelRequired: 2,
  },
  {
    id: "recipe_plasma_core",
    name: "Plasma Core",
    inputs: [
      { itemId: "energy_cell", quantity: 2 },
      { itemId: "rare_gem", quantity: 1 },
    ],
    output: { itemId: "plasma_core", quantity: 1 },
    successRate: 0.7,
    levelRequired: 5,
  },
  {
    id: "recipe_healing_potion",
    name: "Healing Potion",
    inputs: [
      { itemId: "herb", quantity: 3 },
      { itemId: "water", quantity: 1 },
    ],
    output: { itemId: "healing_potion", quantity: 2 },
    successRate: 1.0,
    levelRequired: 1,
  },
  {
    id: "recipe_shield_plate",
    name: "Shield Plate",
    inputs: [
      { itemId: "iron_ore", quantity: 5 },
      { itemId: "leather", quantity: 2 },
    ],
    output: { itemId: "shield_plate", quantity: 1 },
    successRate: 0.95,
    levelRequired: 2,
  },
  {
    id: "recipe_scope_lens",
    name: "Scope Lens",
    inputs: [
      { itemId: "glass_shard", quantity: 3 },
      { itemId: "copper_wire", quantity: 1 },
    ],
    output: { itemId: "scope_lens", quantity: 1 },
    successRate: 0.8,
    levelRequired: 4,
  },
  {
    id: "recipe_ammo_pack",
    name: "Ammo Pack",
    inputs: [
      { itemId: "iron_ore", quantity: 2 },
      { itemId: "gunpowder", quantity: 3 },
    ],
    output: { itemId: "ammo_pack", quantity: 5 },
    successRate: 1.0,
    levelRequired: 1,
  },
];

// ── Factory ──────────────────────────────────────────────────────

export function createCraftingState(
  recipes: ReadonlyArray<CraftingRecipe> = DEFAULT_RECIPES,
): CraftingState {
  return {
    inventory: {},
    recipes,
    discoveredRecipes: [],
    craftCount: 0,
  };
}

// ── Queries ──────────────────────────────────────────────────────

export function getItemCount(state: CraftingState, itemId: string): number {
  return state.inventory[itemId] ?? 0;
}

export function canCraft(
  state: CraftingState,
  recipeId: string,
  playerLevel: number = Infinity,
): boolean {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return false;
  if (playerLevel < recipe.levelRequired) return false;
  return recipe.inputs.every(
    (input) => getItemCount(state, input.itemId) >= input.quantity,
  );
}

export function getAvailableRecipes(
  state: CraftingState,
  playerLevel: number,
): ReadonlyArray<CraftingRecipe> {
  return state.recipes.filter((recipe) =>
    canCraft(state, recipe.id, playerLevel),
  );
}

export interface MissingMaterial {
  readonly itemId: string;
  readonly required: number;
  readonly have: number;
  readonly need: number;
}

export function getMissingMaterials(
  state: CraftingState,
  recipeId: string,
): ReadonlyArray<MissingMaterial> {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return [];

  const missing: MissingMaterial[] = [];
  for (const input of recipe.inputs) {
    const have = getItemCount(state, input.itemId);
    if (have < input.quantity) {
      missing.push({
        itemId: input.itemId,
        required: input.quantity,
        have,
        need: input.quantity - have,
      });
    }
  }
  return missing;
}

// ── Mutations (immutable — return new state) ─────────────────────

export function addItem(
  state: CraftingState,
  itemId: string,
  quantity: number,
): CraftingState {
  if (quantity <= 0) return state;
  const current = getItemCount(state, itemId);
  return {
    ...state,
    inventory: { ...state.inventory, [itemId]: current + quantity },
  };
}

export function removeItem(
  state: CraftingState,
  itemId: string,
  quantity: number,
): CraftingState {
  if (quantity <= 0) return state;
  const current = getItemCount(state, itemId);
  const newAmount = Math.max(0, current - quantity);
  const newInventory = { ...state.inventory };
  if (newAmount === 0) {
    delete newInventory[itemId];
  } else {
    newInventory[itemId] = newAmount;
  }
  return { ...state, inventory: newInventory };
}

export function craft(
  state: CraftingState,
  recipeId: string,
  playerLevel: number,
  rng: number,
): CraftResult {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return { state, success: false, reason: "recipe_not_found" };
  }
  if (playerLevel < recipe.levelRequired) {
    return { state, success: false, reason: "level_too_low" };
  }
  if (!canCraft(state, recipeId, playerLevel)) {
    return { state, success: false, reason: "insufficient_materials" };
  }

  // Consume inputs
  let newState = state;
  for (const input of recipe.inputs) {
    newState = removeItem(newState, input.itemId, input.quantity);
  }

  // Increment craft count
  newState = { ...newState, craftCount: newState.craftCount + 1 };

  // Check success rate
  if (rng < recipe.successRate) {
    // Success — produce output
    newState = addItem(newState, recipe.output.itemId, recipe.output.quantity);
    return { state: newState, success: true, reason: "ok" };
  } else {
    // Failure — materials consumed but no output
    return { state: newState, success: false, reason: "craft_failed" };
  }
}

export function discoverRecipe(
  state: CraftingState,
  recipeId: string,
): CraftingState {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return state;
  if (state.discoveredRecipes.includes(recipeId)) return state;
  return {
    ...state,
    discoveredRecipes: [...state.discoveredRecipes, recipeId],
  };
}

export interface BulkCraftResult {
  readonly state: CraftingState;
  readonly successCount: number;
  readonly failCount: number;
  readonly totalAttempted: number;
}

export function bulkCraft(
  state: CraftingState,
  recipeId: string,
  count: number,
  playerLevel: number,
  rngFn: () => number,
): BulkCraftResult {
  let current = state;
  let successCount = 0;
  let failCount = 0;
  let attempted = 0;

  for (let i = 0; i < count; i++) {
    if (!canCraft(current, recipeId, playerLevel)) break;
    const result = craft(current, recipeId, playerLevel, rngFn());
    current = result.state;
    attempted++;
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  return {
    state: current,
    successCount,
    failCount,
    totalAttempted: attempted,
  };
}
