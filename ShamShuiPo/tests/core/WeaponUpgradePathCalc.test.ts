// ── WeaponUpgradePathCalc Tests ──
import { describe, it, expect } from "vitest";
import {
  getNodeStats,
  getEvolutionRequirements,
  canEvolveWeapon,
  getWeaponTier,
  getUpgradePath,
  getAllUpgradePaths,
  compareWeapons,
} from "../../src/core/WeaponUpgradePathCalc";

// ════════════════════════════════════════════════════════════════
// § getNodeStats
// ════════════════════════════════════════════════════════════════

describe("getNodeStats", () => {
  it("returns base stats at level 1 (multiplier = 1.0)", () => {
    const stats = getNodeStats("pistol", 1);
    expect(stats).not.toBeNull();
    expect(stats!.damage).toBe(10); // baseDamage 10 × 1.0
    expect(stats!.fireRate).toBe(2.0); // fireRate 2.0 × 1.0
    expect(stats!.projectiles).toBe(1); // 1 + 0
  });

  it("scales damage and fireRate at level 3", () => {
    const stats = getNodeStats("pistol", 3);
    expect(stats!.damage).toBe(10 * 1.6); // damageMultiplier[2] = 1.6
    expect(stats!.fireRate).toBe(2.0 * 1.2); // fireRateMultiplier[2] = 1.2
    expect(stats!.projectiles).toBe(1 + 1); // projectileBonus[2] = 1
  });

  it("applies max multipliers at level 5", () => {
    const stats = getNodeStats("shotgun", 5);
    expect(stats!.damage).toBe(8 * 2.5); // baseDamage 8 × 2.5
    expect(stats!.fireRate).toBe(0.8 * 1.5);
    expect(stats!.projectiles).toBe(5 + 2); // 5 base + bonus 2
  });

  it("returns null for unknown weapon", () => {
    expect(getNodeStats("plasma_cannon", 1)).toBeNull();
  });

  it("clamps level below 1 to level 1", () => {
    const stats = getNodeStats("pistol", 0);
    expect(stats!.damage).toBe(10); // treated as level 1
  });

  it("clamps level above 5 to level 5", () => {
    const stats = getNodeStats("pistol", 10);
    expect(stats!.damage).toBe(10 * 2.5); // treated as level 5
  });
});

// ════════════════════════════════════════════════════════════════
// § getEvolutionRequirements
// ════════════════════════════════════════════════════════════════

describe("getEvolutionRequirements", () => {
  it("returns requirements for pistol (needs crit passive)", () => {
    const req = getEvolutionRequirements("pistol");
    expect(req).not.toBeNull();
    expect(req!.passiveId).toBe("crit");
    expect(req!.passiveLevel).toBe(1);
    expect(req!.weaponLevel).toBe(5);
  });

  it("returns requirements for shotgun (needs area passive)", () => {
    const req = getEvolutionRequirements("shotgun");
    expect(req!.passiveId).toBe("area");
  });

  it("returns null for non-existent weapon", () => {
    expect(getEvolutionRequirements("railgun")).toBeNull();
  });

  it("all 8 weapons have evolution recipes", () => {
    const weaponIds = [
      "pistol",
      "shotgun",
      "laser",
      "missile",
      "boomerang",
      "lightning",
      "flamethrower",
      "orbital",
    ];
    for (const id of weaponIds) {
      expect(getEvolutionRequirements(id)).not.toBeNull();
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § canEvolveWeapon
// ════════════════════════════════════════════════════════════════

describe("canEvolveWeapon", () => {
  it("returns true when all conditions met", () => {
    expect(canEvolveWeapon("pistol", 5, "crit", 1)).toBe(true);
  });

  it("returns true with higher passive level than required", () => {
    expect(canEvolveWeapon("pistol", 5, "crit", 5)).toBe(true);
  });

  it("returns false when weapon level is too low", () => {
    expect(canEvolveWeapon("pistol", 4, "crit", 3)).toBe(false);
  });

  it("returns false when wrong passive is provided", () => {
    expect(canEvolveWeapon("pistol", 5, "armor", 3)).toBe(false);
  });

  it("returns false when passive level is 0", () => {
    expect(canEvolveWeapon("pistol", 5, "crit", 0)).toBe(false);
  });

  it("returns false for unknown weapon", () => {
    expect(canEvolveWeapon("unknown", 5, "crit", 3)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getWeaponTier
// ════════════════════════════════════════════════════════════════

describe("getWeaponTier", () => {
  it("returns correct tier for each level", () => {
    expect(getWeaponTier(1)).toBe("basic");
    expect(getWeaponTier(2)).toBe("improved");
    expect(getWeaponTier(3)).toBe("advanced");
    expect(getWeaponTier(4)).toBe("elite");
    expect(getWeaponTier(5)).toBe("max");
  });

  it("clamps below 1 to basic", () => {
    expect(getWeaponTier(0)).toBe("basic");
    expect(getWeaponTier(-5)).toBe("basic");
  });

  it("clamps above 5 to max", () => {
    expect(getWeaponTier(99)).toBe("max");
  });
});

// ════════════════════════════════════════════════════════════════
// § getUpgradePath
// ════════════════════════════════════════════════════════════════

describe("getUpgradePath", () => {
  it("returns null for unknown weapon", () => {
    expect(getUpgradePath("railgun")).toBeNull();
  });

  it("returns 5 level nodes for pistol", () => {
    const path = getUpgradePath("pistol")!;
    expect(path.nodes).toHaveLength(5);
    expect(path.maxLevel).toBe(5);
    expect(path.weaponId).toBe("pistol");
  });

  it("nodes have ascending levels 1-5", () => {
    const path = getUpgradePath("laser")!;
    path.nodes.forEach((node, i) => {
      expect(node.level).toBe(i + 1);
    });
  });

  it("no node is marked as evolution", () => {
    const path = getUpgradePath("pistol")!;
    path.nodes.forEach((node) => {
      expect(node.isEvolution).toBe(false);
    });
  });

  it("level 5 node has evolution info attached", () => {
    const path = getUpgradePath("pistol")!;
    const maxNode = path.nodes[4];
    expect(maxNode.evolutionResult).toBe("evo_pistol");
    expect(maxNode.requiredPassive).toBe("crit");
  });

  it("evolution node is present and marked isEvolution=true", () => {
    const path = getUpgradePath("pistol")!;
    expect(path.evolution).not.toBeNull();
    expect(path.evolution!.isEvolution).toBe(true);
    expect(path.evolution!.name).toBe("Neon Executioner");
    expect(path.evolution!.weaponId).toBe("evo_pistol");
  });

  it("evolution node has correct stats from recipe", () => {
    const path = getUpgradePath("pistol")!;
    expect(path.evolution!.stats.damage).toBe(30);
    expect(path.evolution!.stats.fireRate).toBe(3.0);
  });

  it("evolution node level is 6 (beyond max)", () => {
    const path = getUpgradePath("missile")!;
    expect(path.evolution!.level).toBe(6);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAllUpgradePaths
// ════════════════════════════════════════════════════════════════

describe("getAllUpgradePaths", () => {
  it("returns exactly 8 paths (one per weapon)", () => {
    const paths = getAllUpgradePaths();
    expect(paths).toHaveLength(8);
  });

  it("every path has an evolution", () => {
    const paths = getAllUpgradePaths();
    paths.forEach((path) => {
      expect(path.evolution).not.toBeNull();
    });
  });

  it("weapon IDs are unique", () => {
    const paths = getAllUpgradePaths();
    const ids = paths.map((p) => p.weaponId);
    expect(new Set(ids).size).toBe(8);
  });
});

// ════════════════════════════════════════════════════════════════
// § compareWeapons
// ════════════════════════════════════════════════════════════════

describe("compareWeapons", () => {
  it("returns null if either weapon is unknown", () => {
    expect(compareWeapons("pistol", 1, "railgun", 1)).toBeNull();
    expect(compareWeapons("railgun", 1, "pistol", 1)).toBeNull();
  });

  it("calculates DPS as damage × fireRate × projectiles", () => {
    const result = compareWeapons("pistol", 1, "shotgun", 1)!;
    // pistol: 10 × 2.0 × 1 = 20
    expect(result.dpsA).toBe(20);
    // shotgun: 8 × 0.8 × 5 = 32
    expect(result.dpsB).toBe(32);
    expect(result.winner).toBe("shotgun");
  });

  it("higher level wins over lower level of same weapon", () => {
    const result = compareWeapons("pistol", 1, "pistol", 5)!;
    expect(result.dpsB).toBeGreaterThan(result.dpsA);
    expect(result.winner).toBe("pistol");
  });

  it("ties go to weaponA (>= comparison)", () => {
    const result = compareWeapons("pistol", 1, "pistol", 1)!;
    expect(result.dpsA).toBe(result.dpsB);
    expect(result.winner).toBe("pistol");
  });

  it("flamethrower has highest base DPS due to fire rate", () => {
    const result = compareWeapons("flamethrower", 1, "pistol", 1)!;
    // flamethrower: 6 × 6.0 × 1 = 36
    expect(result.dpsA).toBe(36);
    expect(result.winner).toBe("flamethrower");
  });
});
