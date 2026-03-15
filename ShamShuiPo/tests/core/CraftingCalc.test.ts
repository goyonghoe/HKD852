import { describe, it, expect } from "vitest";
import {
  createCraftingState,
  canCraft,
  craft,
  addItem,
  removeItem,
  getAvailableRecipes,
  discoverRecipe,
  getItemCount,
  getMissingMaterials,
  bulkCraft,
  DEFAULT_RECIPES,
  type CraftingRecipe,
  type CraftingState,
} from "../../src/core/CraftingCalc";

// ── Helpers ──────────────────────────────────────────────────────

const SIMPLE_RECIPE: CraftingRecipe = {
  id: "recipe_test",
  name: "Test Item",
  inputs: [
    { itemId: "mat_a", quantity: 2 },
    { itemId: "mat_b", quantity: 1 },
  ],
  output: { itemId: "product", quantity: 1 },
  successRate: 1.0,
  levelRequired: 1,
};

const RISKY_RECIPE: CraftingRecipe = {
  id: "recipe_risky",
  name: "Risky Item",
  inputs: [{ itemId: "mat_a", quantity: 1 }],
  output: { itemId: "risky_product", quantity: 1 },
  successRate: 0.5,
  levelRequired: 1,
};

const HIGH_LEVEL_RECIPE: CraftingRecipe = {
  id: "recipe_elite",
  name: "Elite Item",
  inputs: [{ itemId: "mat_a", quantity: 1 }],
  output: { itemId: "elite_product", quantity: 1 },
  successRate: 1.0,
  levelRequired: 10,
};

const MULTI_OUTPUT_RECIPE: CraftingRecipe = {
  id: "recipe_multi",
  name: "Multi Output",
  inputs: [{ itemId: "mat_a", quantity: 1 }],
  output: { itemId: "multi_product", quantity: 5 },
  successRate: 1.0,
  levelRequired: 1,
};

function stateWith(
  recipes: CraftingRecipe[],
  items: Record<string, number> = {},
): CraftingState {
  let state = createCraftingState(recipes);
  for (const [id, qty] of Object.entries(items)) {
    state = addItem(state, id, qty);
  }
  return state;
}

// ════════════════════════════════════════════════════════════════
// § createCraftingState
// ════════════════════════════════════════════════════════════════
describe("createCraftingState", () => {
  it("creates state with empty inventory", () => {
    const state = createCraftingState([]);
    expect(state.inventory).toEqual({});
  });

  it("initializes with provided recipes", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    expect(state.recipes).toHaveLength(1);
    expect(state.recipes[0].id).toBe("recipe_test");
  });

  it("starts with empty discoveredRecipes", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    expect(state.discoveredRecipes).toEqual([]);
  });

  it("starts with craftCount 0", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    expect(state.craftCount).toBe(0);
  });

  it("uses DEFAULT_RECIPES when no argument", () => {
    const state = createCraftingState();
    expect(state.recipes).toBe(DEFAULT_RECIPES);
    expect(state.recipes.length).toBe(8);
  });
});

// ════════════════════════════════════════════════════════════════
// § addItem
// ════════════════════════════════════════════════════════════════
describe("addItem", () => {
  it("adds new item to empty inventory", () => {
    const state = addItem(createCraftingState([]), "iron", 5);
    expect(getItemCount(state, "iron")).toBe(5);
  });

  it("stacks quantity on existing item", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 3);
    state = addItem(state, "iron", 2);
    expect(getItemCount(state, "iron")).toBe(5);
  });

  it("does not mutate original state", () => {
    const original = createCraftingState([]);
    const next = addItem(original, "iron", 5);
    expect(getItemCount(original, "iron")).toBe(0);
    expect(getItemCount(next, "iron")).toBe(5);
  });

  it("returns same state for quantity 0", () => {
    const state = createCraftingState([]);
    const result = addItem(state, "iron", 0);
    expect(result).toBe(state);
  });

  it("returns same state for negative quantity", () => {
    const state = createCraftingState([]);
    const result = addItem(state, "iron", -5);
    expect(result).toBe(state);
  });

  it("handles multiple different items", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 3);
    state = addItem(state, "wood", 7);
    expect(getItemCount(state, "iron")).toBe(3);
    expect(getItemCount(state, "wood")).toBe(7);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeItem
// ════════════════════════════════════════════════════════════════
describe("removeItem", () => {
  it("removes partial quantity", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 5);
    state = removeItem(state, "iron", 3);
    expect(getItemCount(state, "iron")).toBe(2);
  });

  it("floors at 0 when removing more than available", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 2);
    state = removeItem(state, "iron", 10);
    expect(getItemCount(state, "iron")).toBe(0);
  });

  it("removes item key when quantity reaches 0", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 3);
    state = removeItem(state, "iron", 3);
    expect("iron" in state.inventory).toBe(false);
  });

  it("does not mutate original state", () => {
    let state = createCraftingState([]);
    state = addItem(state, "iron", 5);
    const next = removeItem(state, "iron", 3);
    expect(getItemCount(state, "iron")).toBe(5);
    expect(getItemCount(next, "iron")).toBe(2);
  });

  it("returns same state for quantity 0", () => {
    const state = addItem(createCraftingState([]), "iron", 5);
    const result = removeItem(state, "iron", 0);
    expect(result).toBe(state);
  });

  it("returns same state for negative quantity", () => {
    const state = addItem(createCraftingState([]), "iron", 5);
    const result = removeItem(state, "iron", -1);
    expect(result).toBe(state);
  });

  it("handles removing nonexistent item (floors at 0)", () => {
    const state = createCraftingState([]);
    const next = removeItem(state, "ghost_item", 5);
    expect(getItemCount(next, "ghost_item")).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getItemCount
// ════════════════════════════════════════════════════════════════
describe("getItemCount", () => {
  it("returns 0 for missing item", () => {
    expect(getItemCount(createCraftingState([]), "nope")).toBe(0);
  });

  it("returns correct count after add", () => {
    const state = addItem(createCraftingState([]), "iron", 42);
    expect(getItemCount(state, "iron")).toBe(42);
  });

  it("returns 0 after full removal", () => {
    let state = addItem(createCraftingState([]), "iron", 3);
    state = removeItem(state, "iron", 3);
    expect(getItemCount(state, "iron")).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § canCraft
// ════════════════════════════════════════════════════════════════
describe("canCraft", () => {
  it("returns true when all materials present and level sufficient", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 3 });
    expect(canCraft(state, "recipe_test", 1)).toBe(true);
  });

  it("returns false when missing materials", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 1 });
    expect(canCraft(state, "recipe_test", 1)).toBe(false);
  });

  it("returns false when level too low", () => {
    const state = stateWith([HIGH_LEVEL_RECIPE], { mat_a: 10 });
    expect(canCraft(state, "recipe_elite", 5)).toBe(false);
  });

  it("returns true when level exactly meets requirement", () => {
    const state = stateWith([HIGH_LEVEL_RECIPE], { mat_a: 10 });
    expect(canCraft(state, "recipe_elite", 10)).toBe(true);
  });

  it("returns false for nonexistent recipe", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    expect(canCraft(state, "nonexistent", 99)).toBe(false);
  });

  it("returns false when one material is missing among many", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 10 }); // missing mat_b
    expect(canCraft(state, "recipe_test", 1)).toBe(false);
  });

  it("returns true with exact required quantities", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 2, mat_b: 1 });
    expect(canCraft(state, "recipe_test", 1)).toBe(true);
  });

  it("defaults playerLevel to Infinity when omitted", () => {
    const state = stateWith([HIGH_LEVEL_RECIPE], { mat_a: 10 });
    expect(canCraft(state, "recipe_elite")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § craft
// ════════════════════════════════════════════════════════════════
describe("craft", () => {
  it("consumes inputs and produces output on success", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 3 });
    const result = craft(state, "recipe_test", 1, 0.0);
    expect(result.success).toBe(true);
    expect(result.reason).toBe("ok");
    expect(getItemCount(result.state, "mat_a")).toBe(3);
    expect(getItemCount(result.state, "mat_b")).toBe(2);
    expect(getItemCount(result.state, "product")).toBe(1);
  });

  it("increments craftCount on success", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 2, mat_b: 1 });
    const result = craft(state, "recipe_test", 1, 0.0);
    expect(result.state.craftCount).toBe(1);
  });

  it("increments craftCount even on craft failure (materials consumed)", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 5 });
    const result = craft(state, "recipe_risky", 1, 0.99); // rng >= successRate
    expect(result.state.craftCount).toBe(1);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("craft_failed");
  });

  it("consumes materials but no output on craft failure", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 5 });
    const result = craft(state, "recipe_risky", 1, 0.99);
    expect(getItemCount(result.state, "mat_a")).toBe(4); // consumed 1
    expect(getItemCount(result.state, "risky_product")).toBe(0);
  });

  it("returns recipe_not_found for invalid recipeId", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    const result = craft(state, "no_such_recipe", 1, 0.5);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("recipe_not_found");
    expect(result.state).toBe(state);
  });

  it("returns level_too_low when under-leveled", () => {
    const state = stateWith([HIGH_LEVEL_RECIPE], { mat_a: 10 });
    const result = craft(state, "recipe_elite", 5, 0.0);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("level_too_low");
    expect(result.state).toBe(state);
  });

  it("returns insufficient_materials when lacking", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 1 });
    const result = craft(state, "recipe_test", 1, 0.0);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("insufficient_materials");
    expect(result.state).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 3 });
    craft(state, "recipe_test", 1, 0.0);
    expect(getItemCount(state, "mat_a")).toBe(5);
    expect(getItemCount(state, "mat_b")).toBe(3);
    expect(state.craftCount).toBe(0);
  });

  it("succeeds with rng just below successRate", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 5 });
    const result = craft(state, "recipe_risky", 1, 0.49);
    expect(result.success).toBe(true);
  });

  it("fails with rng exactly at successRate", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 5 });
    const result = craft(state, "recipe_risky", 1, 0.5);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("craft_failed");
  });

  it("produces multi-output correctly", () => {
    const state = stateWith([MULTI_OUTPUT_RECIPE], { mat_a: 1 });
    const result = craft(state, "recipe_multi", 1, 0.0);
    expect(result.success).toBe(true);
    expect(getItemCount(result.state, "multi_product")).toBe(5);
  });

  it("can craft multiple times sequentially", () => {
    let state = stateWith([SIMPLE_RECIPE], { mat_a: 10, mat_b: 5 });
    state = craft(state, "recipe_test", 1, 0.0).state;
    state = craft(state, "recipe_test", 1, 0.0).state;
    expect(getItemCount(state, "product")).toBe(2);
    expect(getItemCount(state, "mat_a")).toBe(6);
    expect(getItemCount(state, "mat_b")).toBe(3);
    expect(state.craftCount).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAvailableRecipes
// ════════════════════════════════════════════════════════════════
describe("getAvailableRecipes", () => {
  it("returns empty when no recipes are craftable", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    expect(getAvailableRecipes(state, 1)).toHaveLength(0);
  });

  it("returns craftable recipes only", () => {
    const state = stateWith([SIMPLE_RECIPE, HIGH_LEVEL_RECIPE], {
      mat_a: 10,
      mat_b: 5,
    });
    const available = getAvailableRecipes(state, 1);
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe("recipe_test");
  });

  it("includes high-level recipe when level is sufficient", () => {
    const state = stateWith([SIMPLE_RECIPE, HIGH_LEVEL_RECIPE], {
      mat_a: 10,
      mat_b: 5,
    });
    const available = getAvailableRecipes(state, 10);
    expect(available).toHaveLength(2);
  });

  it("returns empty array for empty state", () => {
    const state = createCraftingState([]);
    expect(getAvailableRecipes(state, 99)).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § discoverRecipe
// ════════════════════════════════════════════════════════════════
describe("discoverRecipe", () => {
  it("adds recipe to discoveredRecipes", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    const next = discoverRecipe(state, "recipe_test");
    expect(next.discoveredRecipes).toContain("recipe_test");
  });

  it("does not duplicate already discovered recipe", () => {
    let state = createCraftingState([SIMPLE_RECIPE]);
    state = discoverRecipe(state, "recipe_test");
    state = discoverRecipe(state, "recipe_test");
    expect(state.discoveredRecipes.length).toBe(1);
  });

  it("returns same state for nonexistent recipe", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    const next = discoverRecipe(state, "no_such");
    expect(next).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    discoverRecipe(state, "recipe_test");
    expect(state.discoveredRecipes).toHaveLength(0);
  });

  it("can discover multiple different recipes", () => {
    let state = createCraftingState([SIMPLE_RECIPE, RISKY_RECIPE]);
    state = discoverRecipe(state, "recipe_test");
    state = discoverRecipe(state, "recipe_risky");
    expect(state.discoveredRecipes).toEqual(["recipe_test", "recipe_risky"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMissingMaterials
// ════════════════════════════════════════════════════════════════
describe("getMissingMaterials", () => {
  it("returns all inputs when inventory is empty", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    const missing = getMissingMaterials(state, "recipe_test");
    expect(missing).toHaveLength(2);
    expect(missing[0]).toEqual({
      itemId: "mat_a",
      required: 2,
      have: 0,
      need: 2,
    });
    expect(missing[1]).toEqual({
      itemId: "mat_b",
      required: 1,
      have: 0,
      need: 1,
    });
  });

  it("returns empty when all materials available", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 5 });
    expect(getMissingMaterials(state, "recipe_test")).toHaveLength(0);
  });

  it("returns partial missing", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 1 });
    const missing = getMissingMaterials(state, "recipe_test");
    expect(missing).toHaveLength(2);
    expect(missing[0]).toEqual({
      itemId: "mat_a",
      required: 2,
      have: 1,
      need: 1,
    });
  });

  it("returns empty for nonexistent recipe", () => {
    const state = createCraftingState([]);
    expect(getMissingMaterials(state, "no_such")).toEqual([]);
  });

  it("returns empty when exact quantities match", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 2, mat_b: 1 });
    expect(getMissingMaterials(state, "recipe_test")).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § bulkCraft
// ════════════════════════════════════════════════════════════════
describe("bulkCraft", () => {
  it("crafts multiple items in sequence", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 10, mat_b: 5 });
    const result = bulkCraft(state, "recipe_test", 3, 1, () => 0.0);
    expect(result.successCount).toBe(3);
    expect(result.failCount).toBe(0);
    expect(result.totalAttempted).toBe(3);
    expect(getItemCount(result.state, "product")).toBe(3);
    expect(result.state.craftCount).toBe(3);
  });

  it("stops when materials run out", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 4, mat_b: 2 });
    const result = bulkCraft(state, "recipe_test", 10, 1, () => 0.0);
    expect(result.totalAttempted).toBe(2); // only enough for 2
    expect(result.successCount).toBe(2);
    expect(getItemCount(result.state, "mat_a")).toBe(0);
    expect(getItemCount(result.state, "mat_b")).toBe(0);
  });

  it("counts failures correctly with risky recipe", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 5 });
    // Alternating: success, fail, success, fail, success
    let callIdx = 0;
    const rngValues = [0.1, 0.9, 0.1, 0.9, 0.1];
    const result = bulkCraft(state, "recipe_risky", 5, 1, () => {
      return rngValues[callIdx++];
    });
    expect(result.totalAttempted).toBe(5);
    expect(result.successCount).toBe(3);
    expect(result.failCount).toBe(2);
  });

  it("returns 0 attempted when materials insufficient from start", () => {
    const state = stateWith([SIMPLE_RECIPE], {});
    const result = bulkCraft(state, "recipe_test", 5, 1, () => 0.0);
    expect(result.totalAttempted).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.failCount).toBe(0);
    expect(result.state).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 10, mat_b: 5 });
    bulkCraft(state, "recipe_test", 3, 1, () => 0.0);
    expect(getItemCount(state, "mat_a")).toBe(10);
    expect(state.craftCount).toBe(0);
  });

  it("handles count of 0", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 10, mat_b: 5 });
    const result = bulkCraft(state, "recipe_test", 0, 1, () => 0.0);
    expect(result.totalAttempted).toBe(0);
    expect(result.state).toBe(state);
  });
});

// ════════════════════════════════════════════════════════════════
// § DEFAULT_RECIPES
// ════════════════════════════════════════════════════════════════
describe("DEFAULT_RECIPES", () => {
  it("contains 8 recipes", () => {
    expect(DEFAULT_RECIPES).toHaveLength(8);
  });

  it("all recipes have unique ids", () => {
    const ids = DEFAULT_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all recipes have positive successRate between 0 and 1", () => {
    for (const r of DEFAULT_RECIPES) {
      expect(r.successRate).toBeGreaterThan(0);
      expect(r.successRate).toBeLessThanOrEqual(1);
    }
  });

  it("all recipes have levelRequired >= 1", () => {
    for (const r of DEFAULT_RECIPES) {
      expect(r.levelRequired).toBeGreaterThanOrEqual(1);
    }
  });

  it("all recipes have at least one input", () => {
    for (const r of DEFAULT_RECIPES) {
      expect(r.inputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all recipe outputs have quantity >= 1", () => {
    for (const r of DEFAULT_RECIPES) {
      expect(r.output.quantity).toBeGreaterThanOrEqual(1);
    }
  });

  it("iron blade recipe is craftable at level 1 with 100% success", () => {
    const ironBlade = DEFAULT_RECIPES.find((r) => r.id === "recipe_iron_blade");
    expect(ironBlade).toBeDefined();
    expect(ironBlade!.levelRequired).toBe(1);
    expect(ironBlade!.successRate).toBe(1.0);
  });

  it("plasma core is the hardest recipe (level 5, 70% rate)", () => {
    const plasma = DEFAULT_RECIPES.find((r) => r.id === "recipe_plasma_core");
    expect(plasma).toBeDefined();
    expect(plasma!.levelRequired).toBe(5);
    expect(plasma!.successRate).toBe(0.7);
  });
});

// ════════════════════════════════════════════════════════════════
// § Immutability guarantees
// ════════════════════════════════════════════════════════════════
describe("immutability", () => {
  it("addItem does not mutate original inventory", () => {
    const state = createCraftingState([]);
    const next = addItem(state, "x", 5);
    expect(state.inventory).toEqual({});
    expect(getItemCount(next, "x")).toBe(5);
  });

  it("removeItem does not mutate original inventory", () => {
    const state = addItem(createCraftingState([]), "x", 5);
    removeItem(state, "x", 3);
    expect(getItemCount(state, "x")).toBe(5);
  });

  it("craft does not mutate original state", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 3 });
    const originalCount = getItemCount(state, "mat_a");
    craft(state, "recipe_test", 1, 0.0);
    expect(getItemCount(state, "mat_a")).toBe(originalCount);
  });

  it("discoverRecipe does not mutate original", () => {
    const state = createCraftingState([SIMPLE_RECIPE]);
    discoverRecipe(state, "recipe_test");
    expect(state.discoveredRecipes).toEqual([]);
  });

  it("bulkCraft does not mutate original", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 10, mat_b: 5 });
    bulkCraft(state, "recipe_test", 2, 1, () => 0.0);
    expect(getItemCount(state, "mat_a")).toBe(10);
    expect(state.craftCount).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § Complex scenarios
// ════════════════════════════════════════════════════════════════
describe("complex scenarios", () => {
  it("craft chain: gather → craft blade → craft sword", () => {
    const recipes = DEFAULT_RECIPES;
    let state = createCraftingState(recipes);
    state = addItem(state, "iron_ore", 10);
    state = addItem(state, "wood", 5);
    state = addItem(state, "steel_ingot", 10);

    // Craft iron blade
    const bladeResult = craft(state, "recipe_iron_blade", 1, 0.0);
    expect(bladeResult.success).toBe(true);
    state = bladeResult.state;
    expect(getItemCount(state, "iron_blade")).toBe(1);

    // Craft steel sword (requires level 3)
    const swordResult = craft(state, "recipe_steel_sword", 3, 0.0);
    expect(swordResult.success).toBe(true);
    state = swordResult.state;
    expect(getItemCount(state, "steel_sword")).toBe(1);
    expect(getItemCount(state, "iron_blade")).toBe(0);
  });

  it("failed craft attempt preserves other inventory items", () => {
    const state = stateWith([SIMPLE_RECIPE], { mat_a: 1, mat_b: 5, extra: 99 });
    const result = craft(state, "recipe_test", 1, 0.0);
    expect(result.success).toBe(false);
    expect(getItemCount(result.state, "extra")).toBe(99);
  });

  it("discover then craft workflow", () => {
    let state = stateWith([SIMPLE_RECIPE], { mat_a: 5, mat_b: 3 });
    state = discoverRecipe(state, "recipe_test");
    expect(state.discoveredRecipes).toContain("recipe_test");
    const result = craft(state, "recipe_test", 1, 0.0);
    expect(result.success).toBe(true);
    expect(result.state.discoveredRecipes).toContain("recipe_test");
  });

  it("bulk craft with all failures still consumes materials", () => {
    const state = stateWith([RISKY_RECIPE], { mat_a: 3 });
    const result = bulkCraft(state, "recipe_risky", 3, 1, () => 0.99);
    expect(result.successCount).toBe(0);
    expect(result.failCount).toBe(3);
    expect(getItemCount(result.state, "mat_a")).toBe(0);
    expect(getItemCount(result.state, "risky_product")).toBe(0);
  });

  it("getAvailableRecipes updates after crafting depletes materials", () => {
    let state = stateWith([SIMPLE_RECIPE], { mat_a: 2, mat_b: 1 });
    expect(getAvailableRecipes(state, 1)).toHaveLength(1);
    state = craft(state, "recipe_test", 1, 0.0).state;
    expect(getAvailableRecipes(state, 1)).toHaveLength(0);
  });

  it("getMissingMaterials updates after partial add", () => {
    let state = createCraftingState([SIMPLE_RECIPE]);
    expect(getMissingMaterials(state, "recipe_test")).toHaveLength(2);
    state = addItem(state, "mat_a", 2);
    const missing = getMissingMaterials(state, "recipe_test");
    expect(missing).toHaveLength(1);
    expect(missing[0].itemId).toBe("mat_b");
  });
});
