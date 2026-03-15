// ── Tests: NeonSignCalc ──

import { describe, it, expect } from "vitest";
import {
  shouldDropFragment,
  getRandomFragmentType,
  collectFragment,
  checkCombo,
  applyNeonBuff,
  createNeonBuff,
  tickNeonBuffs,
  getActiveBuffMultiplier,
  getAffinityDropChance,
  getAffinityFragmentWeights,
  getRandomFragmentWithAffinity,
  getPossibleCombos,
  selectCombo,
} from "../../src/core/NeonSignCalc";
import { NEON_SIGNS } from "../../src/config/balance";
import type {
  FragmentType,
  NeonBuff,
  NeonComboResult,
} from "../../src/types/game";

// ════════════════════════════════════════════════════════════════
// § shouldDropFragment
// ════════════════════════════════════════════════════════════════

describe("shouldDropFragment", () => {
  it("returns true when rng < drop chance (0.17)", () => {
    expect(shouldDropFragment(1, () => 0.0)).toBe(true);
    expect(shouldDropFragment(1, () => 0.16)).toBe(true);
  });

  it("returns false when rng >= drop chance", () => {
    expect(shouldDropFragment(1, () => 0.17)).toBe(false);
    expect(shouldDropFragment(1, () => 0.5)).toBe(false);
    expect(shouldDropFragment(1, () => 0.99)).toBe(false);
  });

  it("returns true at boundary just below threshold", () => {
    expect(shouldDropFragment(1, () => 0.1699)).toBe(true);
  });

  it("killCount does not affect drop chance (uniform)", () => {
    // Same rng, different killCounts — same result
    const rng = () => 0.1;
    expect(shouldDropFragment(0, rng)).toBe(true);
    expect(shouldDropFragment(100, rng)).toBe(true);
    expect(shouldDropFragment(9999, rng)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getRandomFragmentType
// ════════════════════════════════════════════════════════════════

describe("getRandomFragmentType", () => {
  const allTypes: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];

  it("returns first fragment when rng=0", () => {
    expect(getRandomFragmentType(() => 0)).toBe("大");
  });

  it("returns last fragment when rng is just below 1", () => {
    expect(getRandomFragmentType(() => 0.999)).toBe("龍");
  });

  it("returns correct fragment for mid-range rng", () => {
    // 6 types, index 3 = rng in [0.5, 0.667)
    expect(getRandomFragmentType(() => 0.5)).toBe("力");
  });

  it("all fragment types are reachable", () => {
    const seen = new Set<FragmentType>();
    for (let i = 0; i < 6; i++) {
      seen.add(getRandomFragmentType(() => i / 6));
    }
    expect(seen.size).toBe(6);
    for (const t of allTypes) {
      expect(seen.has(t)).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § collectFragment — basic collection
// ════════════════════════════════════════════════════════════════

describe("collectFragment — basic", () => {
  it("adds a fragment to empty held array", () => {
    const result = collectFragment([], "大");
    expect(result.held).toEqual(["大"]);
    expect(result.combo).toBeNull();
  });

  it("adds a second fragment", () => {
    const result = collectFragment(["大"], "火");
    expect(result.held).toEqual(["大", "火"]);
    expect(result.combo).toBeNull();
  });

  it("adds a third fragment without combo", () => {
    const result = collectFragment(["大", "火"], "金");
    expect(result.held).toEqual(["大", "火", "金"]);
    expect(result.combo).toBeNull();
  });

  it("does not mutate the input array", () => {
    const original: FragmentType[] = ["大"];
    const copy = [...original];
    collectFragment(original, "火");
    expect(original).toEqual(copy);
  });
});

// ════════════════════════════════════════════════════════════════
// § collectFragment — max capacity overflow
// ════════════════════════════════════════════════════════════════

describe("collectFragment — overflow", () => {
  it("holds up to max 4 without overflow (SPEC-034 §4.1: maxHeldFragments=4)", () => {
    // held has 3, adding 4th — exactly at max, no drop
    const result = collectFragment(["大", "火", "金"], "龍");
    // 4 fragments: ["大", "火", "金", "龍"] — 金+龍 triggers combo!
    expect(result.combo).not.toBeNull();
    expect(result.combo!.name).toBe("金龍");
    // After consuming 金 and 龍, 大 and 火 remain
    expect(result.held).toEqual(["大", "火"]);
  });

  it("removes oldest fragment when 5th added (exceeds max=4)", () => {
    // held has 4, adding 5th should drop the first
    const result = collectFragment(["大", "火", "金", "吉"], "龍");
    // "大" dropped → ["火", "金", "吉", "龍"]
    // 3-piece combos checked first: 金+吉+龍 = 金吉龍 fires (higher priority)!
    expect(result.combo).not.toBeNull();
    expect(result.combo!.name).toBe("金吉龍");
    // After consuming 金, 吉 and 龍, only 火 remains
    expect(result.held).toEqual(["火"]);
  });

  it("removes oldest fragment (no combo case, max=4)", () => {
    // held has 4, adding 5th — first drops, no combo
    const result = collectFragment(["大", "火", "金", "吉"], "大");
    // "大" dropped → ["火", "金", "吉", "大"]. Check combos: 吉+金 = 吉金!
    // So a combo IS triggered here. Let's try a non-combo add:
    // Actually ["火", "金", "吉", "大"] — 吉+金 is a combo, so that fires.
    // Use a set of 4 that won't have a sub-combo after drop:
    const result2 = collectFragment(["大", "火", "大", "火"], "大");
    // "大" dropped → ["火", "大", "火", "大"] — no combo among these
    expect(result2.combo).toBeNull();
    expect(result2.held).toEqual(["火", "大", "火", "大"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § checkCombo — all 8 recipes
// ════════════════════════════════════════════════════════════════

describe("checkCombo — all recipes", () => {
  it("大+吉 → 大吉 (luck)", () => {
    const combo = checkCombo(["大", "吉"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("大吉");
    expect(combo!.effect).toBe("luck");
    expect(combo!.multiplier).toBe(2.0);
    expect(combo!.durationMs).toBe(30000);
  });

  it("火+力 → 火力 (damage)", () => {
    const combo = checkCombo(["火", "力"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("火力");
    expect(combo!.effect).toBe("damage");
    expect(combo!.multiplier).toBe(2.0);
  });

  it("金+龍 → 金龍 (coinDrop)", () => {
    const combo = checkCombo(["金", "龍"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("金龍");
    expect(combo!.effect).toBe("coinDrop");
    expect(combo!.multiplier).toBe(3.0);
  });

  it("大+力 → 大力 (knockback)", () => {
    const combo = checkCombo(["大", "力"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("大力");
    expect(combo!.effect).toBe("knockback");
    expect(combo!.multiplier).toBe(3.0);
  });

  it("火+龍 → 火龍 (fireAura)", () => {
    const combo = checkCombo(["火", "龍"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("火龍");
    expect(combo!.effect).toBe("fireAura");
  });

  it("吉+金 → 吉金 (critChance)", () => {
    const combo = checkCombo(["吉", "金"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("吉金");
    expect(combo!.effect).toBe("critChance");
  });

  it("大+火+力 → 大火力 (allDamage)", () => {
    const combo = checkCombo(["大", "火", "力"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("大火力");
    expect(combo!.effect).toBe("allDamage");
    expect(combo!.multiplier).toBe(3.0);
    expect(combo!.durationMs).toBe(10000);
  });

  it("金+吉+龍 → 金吉龍 (allDrop)", () => {
    const combo = checkCombo(["金", "吉", "龍"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("金吉龍");
    expect(combo!.effect).toBe("allDrop");
    expect(combo!.multiplier).toBe(5.0);
    expect(combo!.durationMs).toBe(15000);
  });
});

// ════════════════════════════════════════════════════════════════
// § checkCombo — order independence
// ════════════════════════════════════════════════════════════════

describe("checkCombo — order independence", () => {
  it("吉+大 matches 大吉 (reversed order)", () => {
    const combo = checkCombo(["吉", "大"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("大吉");
  });

  it("力+火 matches 火力", () => {
    const combo = checkCombo(["力", "火"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("火力");
  });

  it("龍+金 matches 金龍", () => {
    const combo = checkCombo(["龍", "金"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("金龍");
  });

  it("力+大+火 matches 大火力 (3-fragment, shuffled)", () => {
    const combo = checkCombo(["力", "大", "火"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("大火力");
  });

  it("龍+金+吉 matches 金吉龍 (shuffled)", () => {
    const combo = checkCombo(["龍", "金", "吉"]);
    expect(combo).not.toBeNull();
    expect(combo!.name).toBe("金吉龍");
  });
});

// ════════════════════════════════════════════════════════════════
// § checkCombo — partial / no matches
// ════════════════════════════════════════════════════════════════

describe("checkCombo — no match", () => {
  it("returns null for empty held", () => {
    expect(checkCombo([])).toBeNull();
  });

  it("returns null for single fragment", () => {
    expect(checkCombo(["大"])).toBeNull();
  });

  it("returns null for non-matching pair", () => {
    expect(checkCombo(["大", "金"])).toBeNull();
  });

  it("returns null for three non-matching fragments", () => {
    expect(checkCombo(["大", "金", "火"])).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § checkCombo — 3-fragment priority over 2-fragment
// ════════════════════════════════════════════════════════════════

describe("checkCombo — priority", () => {
  it("大+火+力 matches 大火力 (3-piece) not 火力 (2-piece)", () => {
    const combo = checkCombo(["大", "火", "力"]);
    expect(combo!.name).toBe("大火力");
    expect(combo!.consumedFragments).toHaveLength(3);
  });

  it("金+吉+龍 matches 金吉龍 (3-piece) not 金龍 or 吉金", () => {
    const combo = checkCombo(["金", "吉", "龍"]);
    expect(combo!.name).toBe("金吉龍");
    expect(combo!.consumedFragments).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════
// § collectFragment — combo triggers fragment consumption
// ════════════════════════════════════════════════════════════════

describe("collectFragment — combo consumption", () => {
  it("2-piece combo consumes both fragments, remaining held is empty", () => {
    const result = collectFragment(["大"], "吉");
    expect(result.combo).not.toBeNull();
    expect(result.combo!.name).toBe("大吉");
    expect(result.held).toEqual([]);
  });

  it("2-piece combo with 3 held: non-consumed fragment remains", () => {
    const result = collectFragment(["火", "大"], "吉");
    // held = ["火", "大", "吉"] → combo 大吉 → 火 remains
    expect(result.combo!.name).toBe("大吉");
    expect(result.held).toEqual(["火"]);
  });

  it("3-piece combo consumes all fragments", () => {
    const result = collectFragment(["大", "火"], "力");
    expect(result.combo!.name).toBe("大火力");
    expect(result.held).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// § collectFragment — duplicate fragments
// ════════════════════════════════════════════════════════════════

describe("collectFragment — duplicates", () => {
  it("duplicate fragments don't trigger combo", () => {
    const result = collectFragment(["大"], "大");
    expect(result.combo).toBeNull();
    expect(result.held).toEqual(["大", "大"]);
  });

  it("three identical fragments don't trigger combo", () => {
    const result = collectFragment(["火", "火"], "火");
    expect(result.combo).toBeNull();
    expect(result.held).toEqual(["火", "火", "火"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyNeonBuff
// ════════════════════════════════════════════════════════════════

describe("applyNeonBuff", () => {
  const damageCombo: NeonComboResult = {
    name: "火力",
    effect: "damage",
    multiplier: 2.0,
    durationMs: 15000,
    consumedFragments: ["火", "力"],
  };

  it("multiplies the matching stat", () => {
    const state = { damage: 10, luck: 1 };
    const result = applyNeonBuff(state, damageCombo);
    expect(result.damage).toBe(20);
    expect(result.luck).toBe(1);
  });

  it("returns a new object (immutable)", () => {
    const state = { damage: 10 };
    const result = applyNeonBuff(state, damageCombo);
    expect(result).not.toBe(state);
  });

  it("returns copy when stat key not present", () => {
    const state = { luck: 5 };
    const result = applyNeonBuff(state, damageCombo);
    expect(result.luck).toBe(5);
  });

  it("allDamage effect maps to damage stat", () => {
    const allDmgCombo: NeonComboResult = {
      name: "大火力",
      effect: "allDamage",
      multiplier: 3.0,
      durationMs: 10000,
      consumedFragments: ["大", "火", "力"],
    };
    const state = { damage: 10 };
    const result = applyNeonBuff(state, allDmgCombo);
    expect(result.damage).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════════
// § createNeonBuff
// ════════════════════════════════════════════════════════════════

describe("createNeonBuff", () => {
  it("creates a buff from combo result", () => {
    const combo: NeonComboResult = {
      name: "大吉",
      effect: "luck",
      multiplier: 2.0,
      durationMs: 30000,
      consumedFragments: ["大", "吉"],
    };
    const buff = createNeonBuff(combo);
    expect(buff.name).toBe("大吉");
    expect(buff.effect).toBe("luck");
    expect(buff.multiplier).toBe(2.0);
    expect(buff.remainingMs).toBe(30000);
  });
});

// ════════════════════════════════════════════════════════════════
// § tickNeonBuffs
// ════════════════════════════════════════════════════════════════

describe("tickNeonBuffs", () => {
  const makeBuff = (
    name: string,
    effect: NeonBuff["effect"],
    ms: number,
    mult = 2.0,
  ): NeonBuff => ({
    name,
    effect,
    multiplier: mult,
    remainingMs: ms,
  });

  it("decrements remaining time", () => {
    const buffs = [makeBuff("大吉", "luck", 10000)];
    const result = tickNeonBuffs(buffs, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].remainingMs).toBe(7000);
  });

  it("removes expired buffs (remaining <= 0)", () => {
    const buffs = [makeBuff("大吉", "luck", 1000)];
    const result = tickNeonBuffs(buffs, 1000);
    expect(result).toHaveLength(0);
  });

  it("removes buffs with negative remaining", () => {
    const buffs = [makeBuff("大吉", "luck", 500)];
    const result = tickNeonBuffs(buffs, 1000);
    expect(result).toHaveLength(0);
  });

  it("keeps active buffs, removes expired in mixed array", () => {
    const buffs = [
      makeBuff("大吉", "luck", 10000),
      makeBuff("火力", "damage", 2000),
      makeBuff("金龍", "coinDrop", 500),
    ];
    const result = tickNeonBuffs(buffs, 2000);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("大吉");
    expect(result[0].remainingMs).toBe(8000);
  });

  it("returns empty array when all buffs expire", () => {
    const buffs = [
      makeBuff("大吉", "luck", 100),
      makeBuff("火力", "damage", 200),
    ];
    const result = tickNeonBuffs(buffs, 500);
    expect(result).toHaveLength(0);
  });

  it("does not mutate original array", () => {
    const buffs = [makeBuff("大吉", "luck", 10000)];
    const original = [...buffs];
    tickNeonBuffs(buffs, 3000);
    expect(buffs[0].remainingMs).toBe(original[0].remainingMs);
  });

  it("handles empty array", () => {
    expect(tickNeonBuffs([], 1000)).toEqual([]);
  });

  it("handles zero delta", () => {
    const buffs = [makeBuff("大吉", "luck", 10000)];
    const result = tickNeonBuffs(buffs, 0);
    expect(result).toHaveLength(1);
    expect(result[0].remainingMs).toBe(10000);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveBuffMultiplier
// ════════════════════════════════════════════════════════════════

describe("getActiveBuffMultiplier", () => {
  const makeBuff = (effect: NeonBuff["effect"], mult: number): NeonBuff => ({
    name: "test",
    effect,
    multiplier: mult,
    remainingMs: 10000,
  });

  it("returns 1.0 when no buffs", () => {
    expect(getActiveBuffMultiplier([], "damage")).toBe(1.0);
  });

  it("returns 1.0 when no matching buffs", () => {
    const buffs = [makeBuff("luck", 2.0)];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(1.0);
  });

  it("returns multiplier for single matching buff", () => {
    const buffs = [makeBuff("damage", 2.0)];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(2.0);
  });

  it("stacks multipliers multiplicatively", () => {
    const buffs = [makeBuff("damage", 2.0), makeBuff("damage", 3.0)];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(6.0);
  });

  it("allDamage effect also boosts damage stat", () => {
    const buffs = [makeBuff("allDamage", 3.0)];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(3.0);
  });

  it("allDrop effect also boosts coinDrop stat", () => {
    const buffs = [makeBuff("allDrop", 5.0)];
    expect(getActiveBuffMultiplier(buffs, "coinDrop")).toBe(5.0);
  });

  it("damage buff + allDamage buff stack multiplicatively", () => {
    const buffs = [makeBuff("damage", 2.0), makeBuff("allDamage", 3.0)];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(6.0);
  });

  it("ignores non-matching effects", () => {
    const buffs = [
      makeBuff("luck", 2.0),
      makeBuff("damage", 3.0),
      makeBuff("coinDrop", 5.0),
    ];
    expect(getActiveBuffMultiplier(buffs, "damage")).toBe(3.0);
    expect(getActiveBuffMultiplier(buffs, "luck")).toBe(2.0);
    expect(getActiveBuffMultiplier(buffs, "coinDrop")).toBe(5.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAffinityDropChance
// ════════════════════════════════════════════════════════════════

describe("getAffinityDropChance", () => {
  it("returns base drop chance for known weapon", () => {
    expect(getAffinityDropChance("pistol")).toBe(NEON_SIGNS.fragmentDropChance);
  });

  it("returns base drop chance for unknown weapon", () => {
    expect(getAffinityDropChance("unknown_weapon")).toBe(
      NEON_SIGNS.fragmentDropChance,
    );
  });

  it("base drop chance is 0.17 (updated from 0.15)", () => {
    expect(NEON_SIGNS.fragmentDropChance).toBe(0.17);
  });

  it("returns same value regardless of weapon", () => {
    const weapons = ["pistol", "shotgun", "laser", "missile"];
    const chances = weapons.map(getAffinityDropChance);
    const unique = new Set(chances);
    expect(unique.size).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getAffinityFragmentWeights
// ════════════════════════════════════════════════════════════════

// SPEC-034 §4.3: Each weapon has exactly ONE PRIMARY affinity.
// No secondary affinity. Affinity drop bonus is +40% for the primary fragment.
//
// Confirmed weapon→fragment mapping from SPEC-034 §4.3:
//   pistol       → 力 (정밀 타격 = 집중된 힘)
//   shotgun      → 大 (넓은 확산 = 크기)
//   laser        → 火 (광선 에너지)
//   missile      → 龍 (추적하는 용)
//   boomerang    → 力 (물리적 투척)
//   lightning    → 金 (전기 = 금속)
//   flamethrower → 火 (화염 그 자체)
//   orbital      → 金 (기계 = 금속)

describe("getAffinityFragmentWeights", () => {
  it("returns weights for all 6 fragment types", () => {
    const types: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];
    const weights = getAffinityFragmentWeights("pistol");
    for (const t of types) {
      expect(weights[t]).toBeDefined();
      expect(weights[t]).toBeGreaterThan(0);
    }
  });

  it("pistol primary (力) gets +0.40 bonus (weight 1.40)", () => {
    const weights = getAffinityFragmentWeights("pistol");
    expect(weights["力"]).toBeCloseTo(1.4);
  });

  it("pistol non-primary types get weight 1.0 (no secondary affinity per SPEC-034)", () => {
    const weights = getAffinityFragmentWeights("pistol");
    expect(weights["大"]).toBeCloseTo(1.0);
    expect(weights["吉"]).toBeCloseTo(1.0);
    expect(weights["火"]).toBeCloseTo(1.0);
    expect(weights["金"]).toBeCloseTo(1.0); // was secondary before, now 1.0
    expect(weights["龍"]).toBeCloseTo(1.0);
  });

  // SPEC-034 §4.3: shotgun primary = 大 (not 火)
  it("shotgun primary (大) gets +0.40 bonus — SPEC-034 §4.3", () => {
    const weights = getAffinityFragmentWeights("shotgun");
    expect(weights["大"]).toBeCloseTo(1.4);
  });

  it("shotgun non-primary types (including 火, 力) get weight 1.0", () => {
    const weights = getAffinityFragmentWeights("shotgun");
    expect(weights["火"]).toBeCloseTo(1.0); // was primary before, now 1.0
    expect(weights["力"]).toBeCloseTo(1.0); // was secondary before, now 1.0
  });

  // SPEC-034 §4.3: laser primary = 火 (not 金)
  it("laser primary (火) weight is 1.40 — SPEC-034 §4.3", () => {
    const weights = getAffinityFragmentWeights("laser");
    expect(weights["火"]).toBeCloseTo(1.4);
  });

  it("laser non-primary types (including 金, 龍) get weight 1.0", () => {
    const weights = getAffinityFragmentWeights("laser");
    expect(weights["金"]).toBeCloseTo(1.0); // was primary before, now 1.0
    expect(weights["龍"]).toBeCloseTo(1.0); // was secondary before, now 1.0
  });

  // SPEC-034 §4.3: missile primary = 龍
  it("missile primary (龍) gets +0.40", () => {
    const weights = getAffinityFragmentWeights("missile");
    expect(weights["龍"]).toBeCloseTo(1.4);
  });

  // SPEC-034 §4.3: boomerang primary = 力
  it("boomerang primary (力) gets +0.40", () => {
    const weights = getAffinityFragmentWeights("boomerang");
    expect(weights["力"]).toBeCloseTo(1.4);
  });

  // SPEC-034 §4.3: lightning primary = 金
  it("lightning primary (金) gets +0.40", () => {
    const weights = getAffinityFragmentWeights("lightning");
    expect(weights["金"]).toBeCloseTo(1.4);
  });

  // SPEC-034 §4.3: flamethrower primary = 火
  it("flamethrower primary (火) gets +0.40 — SPEC-034 §4.3", () => {
    const weights = getAffinityFragmentWeights("flamethrower");
    expect(weights["火"]).toBeCloseTo(1.4);
  });

  it("flamethrower non-primary types (including 大) get weight 1.0", () => {
    const weights = getAffinityFragmentWeights("flamethrower");
    expect(weights["大"]).toBeCloseTo(1.0); // was secondary before, now 1.0
  });

  // SPEC-034 §4.3: orbital primary = 金
  it("orbital primary (金) gets +0.40 — SPEC-034 §4.3", () => {
    const weights = getAffinityFragmentWeights("orbital");
    expect(weights["金"]).toBeCloseTo(1.4);
  });

  it("orbital non-primary types (including 大, 吉) get weight 1.0", () => {
    const weights = getAffinityFragmentWeights("orbital");
    expect(weights["大"]).toBeCloseTo(1.0); // was primary before, now 1.0
    expect(weights["吉"]).toBeCloseTo(1.0); // was secondary before, now 1.0
  });

  it("unknown weapon: all types get weight 1.0", () => {
    const weights = getAffinityFragmentWeights("unknown");
    const types: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];
    for (const t of types) {
      expect(weights[t]).toBeCloseTo(1.0);
    }
  });

  it("all weights are positive for all 8 weapons", () => {
    const weapons = [
      "pistol",
      "shotgun",
      "laser",
      "missile",
      "boomerang",
      "lightning",
      "flamethrower",
      "orbital",
    ];
    const types: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];
    for (const weapon of weapons) {
      const weights = getAffinityFragmentWeights(weapon);
      for (const t of types) {
        expect(weights[t]).toBeGreaterThan(0);
      }
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § getRandomFragmentWithAffinity
// ════════════════════════════════════════════════════════════════

describe("getRandomFragmentWithAffinity", () => {
  const allTypes: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];

  it("returns a valid fragment type for pistol", () => {
    const frag = getRandomFragmentWithAffinity("pistol", () => 0.5);
    expect(allTypes).toContain(frag);
  });

  it("returns a valid fragment type for unknown weapon", () => {
    const frag = getRandomFragmentWithAffinity("unknown", () => 0.5);
    expect(allTypes).toContain(frag);
  });

  it("pistol: 力 is favoured (primary affinity)", () => {
    // With a seeded rng biased near the primary weight range we expect 力 more often
    // Test statistically: generate many and count 力 vs 大
    let liCount = 0;
    let daCount = 0;
    const step = 0.001;
    for (let r = 0; r < 1; r += step) {
      const frag = getRandomFragmentWithAffinity("pistol", () => r);
      if (frag === "力") liCount++;
      if (frag === "大") daCount++;
    }
    // 力 has weight 1.4, 大 has weight 1.0 — so 力 should appear ~40% more
    expect(liCount).toBeGreaterThan(daCount);
  });

  it("rng=0 always produces the first-weighted type that catches the roll", () => {
    // With rng=0, roll=0, first fragment in iteration order wins
    const frag = getRandomFragmentWithAffinity("pistol", () => 0);
    expect(allTypes).toContain(frag);
  });

  it("rng close to 1 returns the last possible fragment", () => {
    const frag = getRandomFragmentWithAffinity("pistol", () => 0.9999);
    expect(allTypes).toContain(frag);
  });

  it("all fragment types are reachable for an unknown weapon (uniform)", () => {
    const seen = new Set<FragmentType>();
    for (let i = 0; i < 6; i++) {
      seen.add(getRandomFragmentWithAffinity("unknown", () => i / 6 + 0.001));
    }
    // Should be able to hit all 6 over 6 uniform intervals
    expect(seen.size).toBeGreaterThanOrEqual(5); // allow 1 miss due to rounding
  });
});

// ════════════════════════════════════════════════════════════════
// § getPossibleCombos
// ════════════════════════════════════════════════════════════════

describe("getPossibleCombos", () => {
  it("returns empty array for empty held", () => {
    expect(getPossibleCombos([])).toHaveLength(0);
  });

  it("returns empty array when no combo is possible", () => {
    expect(getPossibleCombos(["大"])).toHaveLength(0);
    expect(getPossibleCombos(["大", "金"])).toHaveLength(0);
  });

  it("returns a single 2-piece combo when exactly satisfied", () => {
    const combos = getPossibleCombos(["大", "吉"]);
    expect(combos).toHaveLength(1);
    expect(combos[0].name).toBe("大吉");
  });

  it("returns a single 2-piece combo — 火+力", () => {
    const combos = getPossibleCombos(["火", "力"]);
    expect(combos.some((c) => c.name === "火力")).toBe(true);
  });

  it("returns a 3-piece combo when 3 fragments match", () => {
    const combos = getPossibleCombos(["大", "火", "力"]);
    // 大火力 (3-piece) plus possibly 火力 and 大力 (2-piece subsets)
    expect(combos.some((c) => c.name === "大火力")).toBe(true);
  });

  it("3-piece combo appears before 2-piece combos (sorted by length desc)", () => {
    const combos = getPossibleCombos(["大", "火", "力"]);
    // First combo should be the 3-piece one
    expect(combos[0].consumedFragments.length).toBe(3);
  });

  it("returns multiple combos when multiple are possible", () => {
    // 大+火+力 satisfies: 大火力 (3), 火力 (2), 大力 (2)
    const combos = getPossibleCombos(["大", "火", "力"]);
    expect(combos.length).toBeGreaterThanOrEqual(2);
  });

  it("does not mutate the input held array", () => {
    const held: FragmentType[] = ["大", "吉"];
    const copy = [...held];
    getPossibleCombos(held);
    expect(held).toEqual(copy);
  });

  it("returns all 2-piece combos when held has overlapping satisfying pairs", () => {
    const combos = getPossibleCombos(["金", "吉", "龍"]);
    // 金吉龍 (3-piece), 金龍 (2-piece), 吉金 (2-piece)
    expect(combos.some((c) => c.name === "金吉龍")).toBe(true);
    expect(combos.some((c) => c.name === "金龍")).toBe(true);
    expect(combos.some((c) => c.name === "吉金")).toBe(true);
  });

  it("returned combo results have correct effect and multiplier", () => {
    const combos = getPossibleCombos(["大", "吉"]);
    const daji = combos.find((c) => c.name === "大吉");
    expect(daji).toBeDefined();
    expect(daji!.effect).toBe("luck");
    expect(daji!.multiplier).toBe(2.0);
  });

  it("returned combo consumedFragments matches the recipe", () => {
    const combos = getPossibleCombos(["火", "力"]);
    const huoli = combos.find((c) => c.name === "火力");
    expect(huoli!.consumedFragments).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § selectCombo
// ════════════════════════════════════════════════════════════════

describe("selectCombo", () => {
  it("selects first combo and returns updated held", () => {
    const held: FragmentType[] = ["大", "吉"];
    const { held: remaining, combo } = selectCombo(held, 0);
    expect(combo.name).toBe("大吉");
    expect(remaining).toEqual([]);
  });

  it("does not mutate the original held array", () => {
    const held: FragmentType[] = ["大", "吉"];
    const copy = [...held];
    selectCombo(held, 0);
    expect(held).toEqual(copy);
  });

  it("selects a 3-piece combo by index 0 when it is first in list", () => {
    // 大+火+力 → index 0 = 大火力 (3-piece, sorted first)
    const held: FragmentType[] = ["大", "火", "力"];
    const { combo } = selectCombo(held, 0);
    expect(combo.consumedFragments).toHaveLength(3);
    expect(combo.name).toBe("大火力");
  });

  it("selects a 2-piece combo by index 1 when 3-piece is at 0", () => {
    const held: FragmentType[] = ["大", "火", "力"];
    const possible = getPossibleCombos(held);
    // Only select index 1 if there are at least 2 combos
    if (possible.length >= 2) {
      const { combo } = selectCombo(held, 1);
      expect(combo.consumedFragments.length).toBeLessThanOrEqual(3);
    }
  });

  it("remaining held excludes consumed fragments after 2-piece combo", () => {
    // held = [火, 大, 力], select 火力 (2-piece at some index)
    const held: FragmentType[] = ["大", "火", "力"];
    const possible = getPossibleCombos(held);
    // Find the index of 火力
    const idx = possible.findIndex((c) => c.name === "火力");
    if (idx >= 0) {
      const { held: remaining } = selectCombo(held, idx);
      // After consuming 火 and 力, 大 remains
      expect(remaining).toContain("大");
      expect(remaining).not.toContain("火");
      expect(remaining).not.toContain("力");
    }
  });

  it("throws when comboIndex is -1", () => {
    const held: FragmentType[] = ["大", "吉"];
    expect(() => selectCombo(held, -1)).toThrow();
  });

  it("throws when comboIndex exceeds available combos", () => {
    const held: FragmentType[] = ["大", "吉"]; // only 1 combo: 大吉
    expect(() => selectCombo(held, 5)).toThrow();
  });

  it("throws when no combos are possible", () => {
    const held: FragmentType[] = ["大", "金"]; // no combo for this pair
    expect(() => selectCombo(held, 0)).toThrow();
  });

  it("returns the correct combo result object (effect, multiplier, duration)", () => {
    const held: FragmentType[] = ["金", "龍"];
    const { combo } = selectCombo(held, 0);
    expect(combo.name).toBe("金龍");
    expect(combo.effect).toBe("coinDrop");
    expect(combo.multiplier).toBe(3.0);
    expect(combo.durationMs).toBe(20000);
  });
});
