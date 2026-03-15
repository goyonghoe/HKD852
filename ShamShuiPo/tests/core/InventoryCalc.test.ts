import { describe, it, expect } from "vitest";
import {
  createInventory,
  addWeapon,
  addPassive,
  upgradeWeapon,
  upgradePassive,
  evolveWeapon,
  removeWeapon,
  removePassive,
  hasWeapon,
  hasPassive,
  getWeapon,
  getWeaponCount,
  getPassiveCount,
  canAddWeapon,
  canAddPassive,
} from "../../src/core/InventoryCalc";

// ════════════════════════════════════════════════════════════════
// § createInventory
// ════════════════════════════════════════════════════════════════
describe("createInventory", () => {
  it("creates inventory with default 6 weapon and 6 passive slots", () => {
    const inv = createInventory();
    expect(inv.maxWeapons).toBe(6);
    expect(inv.maxPassives).toBe(6);
    expect(inv.weaponSlots).toHaveLength(6);
    expect(inv.passiveSlots).toHaveLength(6);
  });

  it("all slots start as null", () => {
    const inv = createInventory();
    inv.weaponSlots.forEach((s) => expect(s).toBeNull());
    inv.passiveSlots.forEach((s) => expect(s).toBeNull());
  });

  it("respects custom slot counts", () => {
    const inv = createInventory(3, 4);
    expect(inv.weaponSlots).toHaveLength(3);
    expect(inv.passiveSlots).toHaveLength(4);
    expect(inv.maxWeapons).toBe(3);
    expect(inv.maxPassives).toBe(4);
  });

  it("works with 0 slots", () => {
    const inv = createInventory(0, 0);
    expect(inv.weaponSlots).toHaveLength(0);
    expect(inv.passiveSlots).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § addWeapon
// ════════════════════════════════════════════════════════════════
describe("addWeapon", () => {
  it("adds weapon at level 1, not evolved", () => {
    const inv = createInventory();
    const { state, success } = addWeapon(inv, "pistol");
    expect(success).toBe(true);
    const w = getWeapon(state, "pistol");
    expect(w).not.toBeNull();
    expect(w!.level).toBe(1);
    expect(w!.isEvolved).toBe(false);
  });

  it("fills the first empty slot", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    expect(inv.weaponSlots[0]?.weaponId).toBe("pistol");
    expect(inv.weaponSlots[1]?.weaponId).toBe("shotgun");
  });

  it("rejects duplicate weapon", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const { success, reason } = addWeapon(inv, "pistol");
    expect(success).toBe(false);
    expect(reason).toBe("duplicate_weapon");
  });

  it("rejects when slots are full", () => {
    let inv = createInventory(2, 2);
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    const { success, reason } = addWeapon(inv, "laser");
    expect(success).toBe(false);
    expect(reason).toBe("slots_full");
  });

  it("does not mutate original state", () => {
    const original = createInventory();
    const { state } = addWeapon(original, "pistol");
    expect(original.weaponSlots[0]).toBeNull();
    expect(state.weaponSlots[0]).not.toBeNull();
  });

  it("fills gap left by removed weapon", () => {
    let inv = createInventory(2, 2);
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    inv = removeWeapon(inv, "pistol").state;
    const { success, state } = addWeapon(inv, "laser");
    expect(success).toBe(true);
    expect(state.weaponSlots[0]?.weaponId).toBe("laser");
  });
});

// ════════════════════════════════════════════════════════════════
// § addPassive
// ════════════════════════════════════════════════════════════════
describe("addPassive", () => {
  it("adds passive at level 1", () => {
    const inv = createInventory();
    const { state, success } = addPassive(inv, "armor");
    expect(success).toBe(true);
    expect(hasPassive(state, "armor")).toBe(true);
  });

  it("rejects duplicate passive", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    const { success, reason } = addPassive(inv, "armor");
    expect(success).toBe(false);
    expect(reason).toBe("duplicate_passive");
  });

  it("rejects when slots are full", () => {
    let inv = createInventory(6, 1);
    inv = addPassive(inv, "armor").state;
    const { success, reason } = addPassive(inv, "speed");
    expect(success).toBe(false);
    expect(reason).toBe("slots_full");
  });

  it("does not mutate original state", () => {
    const original = createInventory();
    addPassive(original, "armor");
    expect(original.passiveSlots[0]).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § upgradeWeapon
// ════════════════════════════════════════════════════════════════
describe("upgradeWeapon", () => {
  it("increments weapon level by 1", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const { state, success } = upgradeWeapon(inv, "pistol");
    expect(success).toBe(true);
    expect(getWeapon(state, "pistol")!.level).toBe(2);
  });

  it("upgrades from 4 to 5 (max)", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = upgradeWeapon(inv, "pistol").state; // 2
    inv = upgradeWeapon(inv, "pistol").state; // 3
    inv = upgradeWeapon(inv, "pistol").state; // 4
    const { state, success } = upgradeWeapon(inv, "pistol");
    expect(success).toBe(true);
    expect(getWeapon(state, "pistol")!.level).toBe(5);
  });

  it("rejects upgrade beyond level 5", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    for (let i = 0; i < 4; i++) inv = upgradeWeapon(inv, "pistol").state;
    // Now at level 5
    const { success, reason } = upgradeWeapon(inv, "pistol");
    expect(success).toBe(false);
    expect(reason).toBe("max_level");
  });

  it("rejects upgrade for nonexistent weapon", () => {
    const inv = createInventory();
    const { success, reason } = upgradeWeapon(inv, "ghost_gun");
    expect(success).toBe(false);
    expect(reason).toBe("weapon_not_found");
  });

  it("does not mutate original state", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const { state } = upgradeWeapon(inv, "pistol");
    expect(getWeapon(inv, "pistol")!.level).toBe(1);
    expect(getWeapon(state, "pistol")!.level).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § upgradePassive
// ════════════════════════════════════════════════════════════════
describe("upgradePassive", () => {
  it("increments passive level by 1", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    const { state, success } = upgradePassive(inv, "armor");
    expect(success).toBe(true);
    expect(
      state.passiveSlots.find((s) => s?.passiveId === "armor")!.level,
    ).toBe(2);
  });

  it("rejects upgrade beyond level 5", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    for (let i = 0; i < 4; i++) inv = upgradePassive(inv, "armor").state;
    const { success, reason } = upgradePassive(inv, "armor");
    expect(success).toBe(false);
    expect(reason).toBe("max_level");
  });

  it("rejects upgrade for nonexistent passive", () => {
    const inv = createInventory();
    const { success, reason } = upgradePassive(inv, "phantom");
    expect(success).toBe(false);
    expect(reason).toBe("passive_not_found");
  });
});

// ════════════════════════════════════════════════════════════════
// § evolveWeapon
// ════════════════════════════════════════════════════════════════
describe("evolveWeapon", () => {
  it("marks weapon as evolved", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const { state, success } = evolveWeapon(inv, "pistol");
    expect(success).toBe(true);
    expect(getWeapon(state, "pistol")!.isEvolved).toBe(true);
  });

  it("rejects evolving already-evolved weapon", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = evolveWeapon(inv, "pistol").state;
    const { success, reason } = evolveWeapon(inv, "pistol");
    expect(success).toBe(false);
    expect(reason).toBe("already_evolved");
  });

  it("rejects evolving nonexistent weapon", () => {
    const inv = createInventory();
    const { success, reason } = evolveWeapon(inv, "ghost_gun");
    expect(success).toBe(false);
    expect(reason).toBe("weapon_not_found");
  });

  it("does not change weapon level when evolving", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = upgradeWeapon(inv, "pistol").state; // level 2
    const { state } = evolveWeapon(inv, "pistol");
    expect(getWeapon(state, "pistol")!.level).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeWeapon
// ════════════════════════════════════════════════════════════════
describe("removeWeapon", () => {
  it("removes weapon, slot becomes null", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const { state, success } = removeWeapon(inv, "pistol");
    expect(success).toBe(true);
    expect(hasWeapon(state, "pistol")).toBe(false);
    expect(state.weaponSlots[0]).toBeNull();
  });

  it("rejects removing nonexistent weapon", () => {
    const inv = createInventory();
    const { success, reason } = removeWeapon(inv, "pistol");
    expect(success).toBe(false);
    expect(reason).toBe("weapon_not_found");
  });

  it("does not affect other weapons", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    const { state } = removeWeapon(inv, "pistol");
    expect(hasWeapon(state, "shotgun")).toBe(true);
    expect(hasWeapon(state, "pistol")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § removePassive
// ════════════════════════════════════════════════════════════════
describe("removePassive", () => {
  it("removes passive, slot becomes null", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    const { state, success } = removePassive(inv, "armor");
    expect(success).toBe(true);
    expect(hasPassive(state, "armor")).toBe(false);
  });

  it("rejects removing nonexistent passive", () => {
    const inv = createInventory();
    const { success, reason } = removePassive(inv, "phantom");
    expect(success).toBe(false);
    expect(reason).toBe("passive_not_found");
  });
});

// ════════════════════════════════════════════════════════════════
// § hasWeapon / hasPassive
// ════════════════════════════════════════════════════════════════
describe("hasWeapon", () => {
  it("returns false for empty inventory", () => {
    expect(hasWeapon(createInventory(), "pistol")).toBe(false);
  });

  it("returns true after adding weapon", () => {
    const inv = addWeapon(createInventory(), "pistol").state;
    expect(hasWeapon(inv, "pistol")).toBe(true);
  });

  it("returns false after removing weapon", () => {
    let inv = addWeapon(createInventory(), "pistol").state;
    inv = removeWeapon(inv, "pistol").state;
    expect(hasWeapon(inv, "pistol")).toBe(false);
  });
});

describe("hasPassive", () => {
  it("returns false for empty inventory", () => {
    expect(hasPassive(createInventory(), "armor")).toBe(false);
  });

  it("returns true after adding passive", () => {
    const inv = addPassive(createInventory(), "armor").state;
    expect(hasPassive(inv, "armor")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getWeapon
// ════════════════════════════════════════════════════════════════
describe("getWeapon", () => {
  it("returns null for nonexistent weapon", () => {
    expect(getWeapon(createInventory(), "pistol")).toBeNull();
  });

  it("returns weapon entry with correct fields", () => {
    const inv = addWeapon(createInventory(), "pistol").state;
    const w = getWeapon(inv, "pistol");
    expect(w).toEqual({ weaponId: "pistol", level: 1, isEvolved: false });
  });
});

// ════════════════════════════════════════════════════════════════
// § getWeaponCount / getPassiveCount
// ════════════════════════════════════════════════════════════════
describe("getWeaponCount", () => {
  it("returns 0 for empty inventory", () => {
    expect(getWeaponCount(createInventory())).toBe(0);
  });

  it("counts correctly after adds and removes", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    expect(getWeaponCount(inv)).toBe(2);
    inv = removeWeapon(inv, "pistol").state;
    expect(getWeaponCount(inv)).toBe(1);
  });
});

describe("getPassiveCount", () => {
  it("returns 0 for empty inventory", () => {
    expect(getPassiveCount(createInventory())).toBe(0);
  });

  it("increments on add", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    inv = addPassive(inv, "speed").state;
    expect(getPassiveCount(inv)).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § canAddWeapon / canAddPassive
// ════════════════════════════════════════════════════════════════
describe("canAddWeapon", () => {
  it("returns true for empty inventory", () => {
    expect(canAddWeapon(createInventory())).toBe(true);
  });

  it("returns false when all slots filled", () => {
    let inv = createInventory(2, 2);
    inv = addWeapon(inv, "a").state;
    inv = addWeapon(inv, "b").state;
    expect(canAddWeapon(inv)).toBe(false);
  });

  it("returns true after removing from full inventory", () => {
    let inv = createInventory(1, 1);
    inv = addWeapon(inv, "a").state;
    expect(canAddWeapon(inv)).toBe(false);
    inv = removeWeapon(inv, "a").state;
    expect(canAddWeapon(inv)).toBe(true);
  });

  it("returns false for zero-slot inventory", () => {
    expect(canAddWeapon(createInventory(0, 0))).toBe(false);
  });
});

describe("canAddPassive", () => {
  it("returns true for empty inventory", () => {
    expect(canAddPassive(createInventory())).toBe(true);
  });

  it("returns false when all slots filled", () => {
    let inv = createInventory(2, 1);
    inv = addPassive(inv, "armor").state;
    expect(canAddPassive(inv)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Immutability guarantees
// ════════════════════════════════════════════════════════════════
describe("immutability", () => {
  it("addPassive does not mutate original", () => {
    const original = createInventory();
    const copy = { ...original, passiveSlots: [...original.passiveSlots] };
    addPassive(original, "armor");
    expect(original.passiveSlots).toEqual(copy.passiveSlots);
  });

  it("upgradePassive does not mutate original", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    const before = inv.passiveSlots.find(
      (s) => s?.passiveId === "armor",
    )!.level;
    upgradePassive(inv, "armor");
    expect(inv.passiveSlots.find((s) => s?.passiveId === "armor")!.level).toBe(
      before,
    );
  });

  it("evolveWeapon does not mutate original", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    evolveWeapon(inv, "pistol");
    expect(getWeapon(inv, "pistol")!.isEvolved).toBe(false);
  });

  it("removePassive does not mutate original", () => {
    let inv = createInventory();
    inv = addPassive(inv, "armor").state;
    removePassive(inv, "armor");
    expect(hasPassive(inv, "armor")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § Complex scenarios
// ════════════════════════════════════════════════════════════════
describe("complex scenarios", () => {
  it("full weapon lifecycle: add → upgrade × 4 → evolve", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    for (let i = 0; i < 4; i++) inv = upgradeWeapon(inv, "pistol").state;
    expect(getWeapon(inv, "pistol")!.level).toBe(5);
    inv = evolveWeapon(inv, "pistol").state;
    expect(getWeapon(inv, "pistol")!.isEvolved).toBe(true);
  });

  it("fill all 6 weapon slots then try adding 7th", () => {
    let inv = createInventory();
    const weapons = ["a", "b", "c", "d", "e", "f"];
    for (const w of weapons) inv = addWeapon(inv, w).state;
    expect(getWeaponCount(inv)).toBe(6);
    const { success } = addWeapon(inv, "g");
    expect(success).toBe(false);
  });

  it("remove and re-add different weapon", () => {
    let inv = createInventory(1, 1);
    inv = addWeapon(inv, "pistol").state;
    inv = removeWeapon(inv, "pistol").state;
    const { success, state } = addWeapon(inv, "shotgun");
    expect(success).toBe(true);
    expect(hasWeapon(state, "shotgun")).toBe(true);
    expect(hasWeapon(state, "pistol")).toBe(false);
  });

  it("multiple upgrades across different weapons", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = addWeapon(inv, "shotgun").state;
    inv = upgradeWeapon(inv, "pistol").state;
    inv = upgradeWeapon(inv, "shotgun").state;
    inv = upgradeWeapon(inv, "pistol").state;
    expect(getWeapon(inv, "pistol")!.level).toBe(3);
    expect(getWeapon(inv, "shotgun")!.level).toBe(2);
  });

  it("mixed weapon and passive operations", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    inv = addPassive(inv, "armor").state;
    inv = upgradeWeapon(inv, "pistol").state;
    inv = upgradePassive(inv, "armor").state;
    expect(getWeapon(inv, "pistol")!.level).toBe(2);
    expect(inv.passiveSlots.find((s) => s?.passiveId === "armor")!.level).toBe(
      2,
    );
  });

  it("failed operations return unchanged state reference", () => {
    let inv = createInventory();
    inv = addWeapon(inv, "pistol").state;
    const result = addWeapon(inv, "pistol");
    expect(result.state).toBe(inv);
  });

  it("failed upgrade returns same state object", () => {
    const inv = createInventory();
    const result = upgradeWeapon(inv, "nonexistent");
    expect(result.state).toBe(inv);
  });

  it("failed evolve returns same state object", () => {
    const inv = createInventory();
    const result = evolveWeapon(inv, "nonexistent");
    expect(result.state).toBe(inv);
  });
});
