// ── Tests: BossShieldCalc ──
//
// SPEC-034 §4.6: Shield mechanic is "spend fragments directly to break shields"
// NOT combo-buff based. Player throws fragments from inventory at the boss shield.
//
// Key design:
//   mini_boss:    any 2 fragments
//   chapter_boss: 3 fragments including 火
//   final_boss:   3 fragments including 火 (Phase 1 default)

import { describe, it, expect } from "vitest";
import {
  createShieldState,
  applyFragmentToShield,
  getShieldDamageReduction,
  isShieldBroken,
  getShieldHpRatio,
  fragmentsSatisfyShield,
  canAttemptShatterWithFragments,
  type BossShieldState,
  type BossType,
} from "../../src/core/BossShieldCalc";
import { BOSS_NEON_SHIELDS } from "../../src/config/balance";
import type { FragmentType } from "../../src/types/game";

// ─── Helpers ─────────────────────────────────────────────────

function anyTwo(): FragmentType[] {
  return ["大", "吉"];
}

function withHuo(): FragmentType[] {
  return ["火", "力", "金"];
}

function withHuoAndExtras(): FragmentType[] {
  return ["火", "大", "龍"];
}

function noHuo(): FragmentType[] {
  return ["大", "吉", "金"]; // no 火
}

// ════════════════════════════════════════════════════════════════
// § createShieldState
// ════════════════════════════════════════════════════════════════

describe("createShieldState", () => {
  const bossTypes: BossType[] = ["mini_boss", "chapter_boss", "final_boss"];

  for (const bossType of bossTypes) {
    it(`creates initial state for ${bossType}`, () => {
      const state = createShieldState(bossType);
      expect(state.bossType).toBe(bossType);
      expect(state.broken).toBe(false);
      expect(state.shieldHp).toBe(BOSS_NEON_SHIELDS[bossType].shieldHp);
      expect(state.maxShieldHp).toBe(BOSS_NEON_SHIELDS[bossType].shieldHp);
      expect(state.damageReduction).toBe(
        BOSS_NEON_SHIELDS[bossType].damageReduction,
      );
    });
  }

  it("mini_boss starts with shieldHp=200 (neon charges)", () => {
    const state = createShieldState("mini_boss");
    expect(state.shieldHp).toBe(200);
  });

  it("chapter_boss starts with shieldHp=500", () => {
    const state = createShieldState("chapter_boss");
    expect(state.shieldHp).toBe(500);
  });

  it("final_boss starts with shieldHp=800", () => {
    const state = createShieldState("final_boss");
    expect(state.shieldHp).toBe(800);
  });

  it("mini_boss has 50% damage reduction (0.5)", () => {
    const state = createShieldState("mini_boss");
    expect(state.damageReduction).toBeCloseTo(0.5);
  });

  it("chapter_boss has 70% damage reduction (0.7)", () => {
    const state = createShieldState("chapter_boss");
    expect(state.damageReduction).toBeCloseTo(0.7);
  });

  it("final_boss has 80% damage reduction (0.8)", () => {
    const state = createShieldState("final_boss");
    expect(state.damageReduction).toBeCloseTo(0.8);
  });

  it("mini_boss requires 2 fragments, no type restriction", () => {
    const state = createShieldState("mini_boss");
    expect(state.requiredFragmentCount).toBe(2);
    expect(state.requiredFragmentType).toBeNull();
  });

  it("chapter_boss requires 3 fragments including 火", () => {
    const state = createShieldState("chapter_boss");
    expect(state.requiredFragmentCount).toBe(3);
    expect(state.requiredFragmentType).toBe("火");
  });

  it("final_boss requires 3 fragments including 火 (Phase 1 default)", () => {
    const state = createShieldState("final_boss");
    expect(state.requiredFragmentCount).toBe(3);
    expect(state.requiredFragmentType).toBe("火");
  });

  it("shield HP values are ordered: mini < chapter < final", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.shieldHp).toBeLessThan(
      BOSS_NEON_SHIELDS.chapter_boss.shieldHp,
    );
    expect(BOSS_NEON_SHIELDS.chapter_boss.shieldHp).toBeLessThan(
      BOSS_NEON_SHIELDS.final_boss.shieldHp,
    );
  });

  it("damage reductions are ordered: mini < chapter < final", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.damageReduction).toBeLessThan(
      BOSS_NEON_SHIELDS.chapter_boss.damageReduction,
    );
    expect(BOSS_NEON_SHIELDS.chapter_boss.damageReduction).toBeLessThan(
      BOSS_NEON_SHIELDS.final_boss.damageReduction,
    );
  });
});

// ════════════════════════════════════════════════════════════════
// § fragmentsSatisfyShield
// ════════════════════════════════════════════════════════════════

describe("fragmentsSatisfyShield", () => {
  it("mini_boss: any 2 fragments satisfy the requirement", () => {
    const state = createShieldState("mini_boss");
    expect(fragmentsSatisfyShield(["大", "吉"], state)).toBe(true);
    expect(fragmentsSatisfyShield(["火", "龍"], state)).toBe(true);
    expect(fragmentsSatisfyShield(["力", "金"], state)).toBe(true);
  });

  it("mini_boss: fewer than 2 fragments is insufficient", () => {
    const state = createShieldState("mini_boss");
    expect(fragmentsSatisfyShield([], state)).toBe(false);
    expect(fragmentsSatisfyShield(["大"], state)).toBe(false);
  });

  it("mini_boss: 3+ fragments also satisfy (>= 2 requirement)", () => {
    const state = createShieldState("mini_boss");
    expect(fragmentsSatisfyShield(["大", "吉", "火"], state)).toBe(true);
  });

  it("chapter_boss: 3 fragments with 火 satisfies requirement", () => {
    const state = createShieldState("chapter_boss");
    expect(fragmentsSatisfyShield(["火", "力", "金"], state)).toBe(true);
    expect(fragmentsSatisfyShield(["大", "火", "龍"], state)).toBe(true);
  });

  it("chapter_boss: 3 fragments without 火 does NOT satisfy", () => {
    const state = createShieldState("chapter_boss");
    expect(fragmentsSatisfyShield(["大", "吉", "金"], state)).toBe(false);
    expect(fragmentsSatisfyShield(["力", "大", "龍"], state)).toBe(false);
  });

  it("chapter_boss: fewer than 3 fragments is insufficient (even with 火)", () => {
    const state = createShieldState("chapter_boss");
    expect(fragmentsSatisfyShield(["火"], state)).toBe(false);
    expect(fragmentsSatisfyShield(["火", "大"], state)).toBe(false);
  });

  it("final_boss: 3 fragments with 火 satisfies requirement", () => {
    const state = createShieldState("final_boss");
    expect(fragmentsSatisfyShield(["火", "龍", "金"], state)).toBe(true);
  });

  it("final_boss: 3 fragments without 火 does NOT satisfy", () => {
    const state = createShieldState("final_boss");
    expect(fragmentsSatisfyShield(["大", "吉", "龍"], state)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § canAttemptShatterWithFragments
// ════════════════════════════════════════════════════════════════

describe("canAttemptShatterWithFragments", () => {
  it("returns false when shield is already broken", () => {
    const state: BossShieldState = {
      ...createShieldState("mini_boss"),
      broken: true,
      shieldHp: 0,
    };
    expect(canAttemptShatterWithFragments(["大", "吉"], state)).toBe(false);
  });

  it("mini_boss: true with 2+ fragments", () => {
    const state = createShieldState("mini_boss");
    expect(canAttemptShatterWithFragments(["大", "吉"], state)).toBe(true);
    expect(canAttemptShatterWithFragments(["火", "龍", "力"], state)).toBe(
      true,
    );
  });

  it("mini_boss: false with fewer than 2 fragments", () => {
    const state = createShieldState("mini_boss");
    expect(canAttemptShatterWithFragments([], state)).toBe(false);
    expect(canAttemptShatterWithFragments(["大"], state)).toBe(false);
  });

  it("chapter_boss: true with 3 fragments including 火", () => {
    const state = createShieldState("chapter_boss");
    expect(canAttemptShatterWithFragments(["火", "大", "吉"], state)).toBe(
      true,
    );
  });

  it("chapter_boss: false without 火 even if 3 fragments present", () => {
    const state = createShieldState("chapter_boss");
    expect(canAttemptShatterWithFragments(["大", "吉", "金"], state)).toBe(
      false,
    );
  });

  it("chapter_boss: false with fewer than 3 fragments", () => {
    const state = createShieldState("chapter_boss");
    expect(canAttemptShatterWithFragments(["火", "大"], state)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyFragmentToShield — mini_boss (any 2 fragments)
// ════════════════════════════════════════════════════════════════

describe("applyFragmentToShield — mini_boss (any 2 fragments)", () => {
  it("reduces shieldHp by 1 on valid 2-fragment throw", () => {
    const state = createShieldState("mini_boss");
    const initial = state.shieldHp;
    const { state: next } = applyFragmentToShield(state, anyTwo());
    expect(next.shieldHp).toBe(initial - 1);
  });

  it("consumes 2 fragments from inventory", () => {
    const state = createShieldState("mini_boss");
    const held: FragmentType[] = ["大", "吉", "火"]; // 3 held, 2 consumed
    const { remainingFragments } = applyFragmentToShield(state, held);
    expect(remainingFragments.length).toBe(1); // 3 - 2 = 1 remains
  });

  it("accepts any 2 fragments (no type restriction)", () => {
    const state = createShieldState("mini_boss");
    const pairs: FragmentType[][] = [
      ["火", "龍"],
      ["吉", "金"],
      ["大", "力"],
    ];
    for (const pair of pairs) {
      const { state: next } = applyFragmentToShield(state, pair);
      expect(next.shieldHp).toBe(state.shieldHp - 1);
    }
  });

  it("does nothing when fewer than 2 fragments — no fragments consumed", () => {
    const state = createShieldState("mini_boss");
    const { state: next, remainingFragments } = applyFragmentToShield(state, [
      "大",
    ]);
    expect(next.shieldHp).toBe(state.shieldHp); // unchanged
    expect(next).toEqual(state);
    expect(remainingFragments).toEqual(["大"]); // not consumed
  });

  it("does nothing when shield is already broken", () => {
    const state = createShieldState("mini_boss");
    // Break the shield manually by building the final state
    const brokenState: BossShieldState = {
      ...state,
      shieldHp: 0,
      broken: true,
    };
    const { state: after, remainingFragments } = applyFragmentToShield(
      brokenState,
      ["大", "吉"],
    );
    expect(after.shieldHp).toBe(0);
    expect(after.broken).toBe(true);
    expect(remainingFragments).toEqual(["大", "吉"]); // not consumed
  });

  it("returns new state object (immutable)", () => {
    const state = createShieldState("mini_boss");
    const { state: next } = applyFragmentToShield(state, anyTwo());
    expect(next).not.toBe(state);
    expect(state.shieldHp).toBe(BOSS_NEON_SHIELDS.mini_boss.shieldHp); // original unchanged
  });

  it("does not mutate the held fragments array", () => {
    const state = createShieldState("mini_boss");
    const held: FragmentType[] = ["大", "吉"];
    const copy = [...held];
    applyFragmentToShield(state, held);
    expect(held).toEqual(copy);
  });

  it("successive throws reduce shield HP cumulatively", () => {
    let state = createShieldState("mini_boss");
    let held: FragmentType[] = ["大", "吉", "火", "力", "金", "龍"];

    const initial = state.shieldHp;
    const { state: s1, remainingFragments: r1 } = applyFragmentToShield(
      state,
      held,
    );
    expect(s1.shieldHp).toBe(initial - 1);

    held = r1; // use remaining fragments for next throw
    // pad if needed
    held = [...held, "大", "吉"]; // ensure we have enough
    const { state: s2 } = applyFragmentToShield(s1, held);
    expect(s2.shieldHp).toBe(initial - 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § applyFragmentToShield — chapter_boss (requires 火 in 3 fragments)
// ════════════════════════════════════════════════════════════════

describe("applyFragmentToShield — chapter_boss (3 fragments including 火)", () => {
  it("accepts 3 fragments that include 火", () => {
    const state = createShieldState("chapter_boss");
    const { state: next } = applyFragmentToShield(state, withHuo());
    expect(next.shieldHp).toBe(state.shieldHp - 1);
  });

  it("consumes 3 fragments from inventory", () => {
    const state = createShieldState("chapter_boss");
    const held: FragmentType[] = ["火", "力", "金", "大"]; // 4 held, 3 consumed
    const { remainingFragments } = applyFragmentToShield(state, held);
    expect(remainingFragments.length).toBe(1);
  });

  it("rejects 3 fragments that do NOT include 火", () => {
    const state = createShieldState("chapter_boss");
    const { state: next, remainingFragments } = applyFragmentToShield(
      state,
      noHuo(),
    );
    expect(next.shieldHp).toBe(state.shieldHp); // unchanged
    expect(remainingFragments).toEqual(noHuo()); // nothing consumed
  });

  it("rejects fewer than 3 fragments even with 火", () => {
    const state = createShieldState("chapter_boss");
    const { state: next } = applyFragmentToShield(state, ["火", "大"]);
    expect(next.shieldHp).toBe(state.shieldHp);
  });

  it("accepts 4+ fragments that include 火 (extra fragments not all consumed)", () => {
    const state = createShieldState("chapter_boss");
    const held: FragmentType[] = ["火", "大", "吉", "龍"]; // 4 fragments
    const { state: next, remainingFragments } = applyFragmentToShield(
      state,
      held,
    );
    expect(next.shieldHp).toBe(state.shieldHp - 1);
    expect(remainingFragments.length).toBe(1); // 4 - 3 = 1
  });
});

// ════════════════════════════════════════════════════════════════
// § applyFragmentToShield — final_boss
// ════════════════════════════════════════════════════════════════

describe("applyFragmentToShield — final_boss (3 fragments including 火)", () => {
  it("accepts 3 fragments including 火", () => {
    const state = createShieldState("final_boss");
    const { state: next } = applyFragmentToShield(state, withHuoAndExtras());
    expect(next.shieldHp).toBe(state.shieldHp - 1);
  });

  it("rejects 3 fragments without 火", () => {
    const state = createShieldState("final_boss");
    const { state: next } = applyFragmentToShield(state, noHuo());
    expect(next.shieldHp).toBe(state.shieldHp);
  });

  it("shieldHp never goes below 0", () => {
    let state = createShieldState("final_boss");
    // Drain to 1 HP remaining
    const drainTo1: BossShieldState = { ...state, shieldHp: 1 };
    const { state: broken } = applyFragmentToShield(drainTo1, withHuo());
    expect(broken.shieldHp).toBe(0);
    expect(broken.broken).toBe(true);

    // Apply again — no change
    const { state: afterBroken } = applyFragmentToShield(broken, withHuo());
    expect(afterBroken.shieldHp).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getShieldDamageReduction
// ════════════════════════════════════════════════════════════════

describe("getShieldDamageReduction", () => {
  it("returns damageReduction when shield is active (mini_boss = 0.5)", () => {
    const state = createShieldState("mini_boss");
    expect(getShieldDamageReduction(state)).toBeCloseTo(0.5);
  });

  it("returns damageReduction when shield is active (chapter_boss = 0.7)", () => {
    const state = createShieldState("chapter_boss");
    expect(getShieldDamageReduction(state)).toBeCloseTo(0.7);
  });

  it("returns damageReduction when shield is active (final_boss = 0.8)", () => {
    const state = createShieldState("final_boss");
    expect(getShieldDamageReduction(state)).toBeCloseTo(0.8);
  });

  it("returns 0 when shield is broken (boss fully vulnerable)", () => {
    const broken: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 0,
      broken: true,
    };
    expect(getShieldDamageReduction(broken)).toBe(0);
  });

  it("returns 0 for all boss types when broken", () => {
    const bossTypes: BossType[] = ["mini_boss", "chapter_boss", "final_boss"];
    for (const bt of bossTypes) {
      const broken: BossShieldState = {
        ...createShieldState(bt),
        shieldHp: 0,
        broken: true,
      };
      expect(getShieldDamageReduction(broken)).toBe(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// § isShieldBroken
// ════════════════════════════════════════════════════════════════

describe("isShieldBroken", () => {
  it("returns false on initial state", () => {
    expect(isShieldBroken(createShieldState("mini_boss"))).toBe(false);
  });

  it("returns false when shield has HP remaining", () => {
    const state: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 50,
    };
    expect(isShieldBroken(state)).toBe(false);
  });

  it("returns true when shieldHp = 0 and broken = true", () => {
    const broken: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 0,
      broken: true,
    };
    expect(isShieldBroken(broken)).toBe(true);
  });

  it("stays broken after additional fragment throws", () => {
    const broken: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 0,
      broken: true,
    };
    const { state: after } = applyFragmentToShield(broken, anyTwo());
    expect(isShieldBroken(after)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getShieldHpRatio
// ════════════════════════════════════════════════════════════════

describe("getShieldHpRatio", () => {
  it("returns 1.0 on initial state (full HP)", () => {
    expect(getShieldHpRatio(createShieldState("mini_boss"))).toBeCloseTo(1.0);
  });

  it("returns 0.0 when shield is broken", () => {
    const broken: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 0,
      broken: true,
    };
    expect(getShieldHpRatio(broken)).toBeCloseTo(0.0);
  });

  it("returns fractional value when partially damaged", () => {
    const state = createShieldState("mini_boss"); // shieldHp = 200
    const partial: BossShieldState = { ...state, shieldHp: 100 };
    expect(getShieldHpRatio(partial)).toBeCloseTo(0.5);
  });

  it("returns 0 when maxShieldHp is 0 (edge case)", () => {
    const state: BossShieldState = {
      ...createShieldState("mini_boss"),
      shieldHp: 0,
      maxShieldHp: 0,
    };
    expect(getShieldHpRatio(state)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § Immutability checks
// ════════════════════════════════════════════════════════════════

describe("BossShieldCalc — immutability", () => {
  it("createShieldState returns a new object each call", () => {
    const s1 = createShieldState("mini_boss");
    const s2 = createShieldState("mini_boss");
    expect(s1).not.toBe(s2);
    expect(s1).toEqual(s2);
  });

  it("applyFragmentToShield does not mutate original state", () => {
    const original = createShieldState("mini_boss");
    const originalHp = original.shieldHp;
    applyFragmentToShield(original, anyTwo());
    expect(original.shieldHp).toBe(originalHp);
    expect(original.broken).toBe(false);
  });

  it("applyFragmentToShield does not mutate input fragments array", () => {
    const state = createShieldState("mini_boss");
    const held: FragmentType[] = ["大", "吉", "火"];
    const copy = [...held];
    applyFragmentToShield(state, held);
    expect(held).toEqual(copy);
  });

  it("multiple successive calls build on previous state", () => {
    const state0 = createShieldState("mini_boss"); // shieldHp = 200
    const { state: state1 } = applyFragmentToShield(state0, ["大", "吉"]);
    const { state: state2 } = applyFragmentToShield(state1, ["火", "龍"]);
    const { state: state3 } = applyFragmentToShield(state2, ["力", "金"]);

    expect(state0.shieldHp).toBe(200);
    expect(state1.shieldHp).toBe(199);
    expect(state2.shieldHp).toBe(198);
    expect(state3.shieldHp).toBe(197);
  });
});

// ════════════════════════════════════════════════════════════════
// § Balance config sanity checks
// ════════════════════════════════════════════════════════════════

describe("BOSS_NEON_SHIELDS config", () => {
  it("mini_boss shieldHp is 200", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.shieldHp).toBe(200);
  });

  it("chapter_boss shieldHp is 500", () => {
    expect(BOSS_NEON_SHIELDS.chapter_boss.shieldHp).toBe(500);
  });

  it("final_boss shieldHp is 800", () => {
    expect(BOSS_NEON_SHIELDS.final_boss.shieldHp).toBe(800);
  });

  it("mini_boss damageReduction is 0.5 (50%)", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.damageReduction).toBeCloseTo(0.5);
  });

  it("chapter_boss damageReduction is 0.7 (70%)", () => {
    expect(BOSS_NEON_SHIELDS.chapter_boss.damageReduction).toBeCloseTo(0.7);
  });

  it("final_boss damageReduction is 0.8 (80%)", () => {
    expect(BOSS_NEON_SHIELDS.final_boss.damageReduction).toBeCloseTo(0.8);
  });

  it("mini_boss requiredFragmentCount is 2", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.requiredFragmentCount).toBe(2);
  });

  it("chapter_boss requiredFragmentCount is 3", () => {
    expect(BOSS_NEON_SHIELDS.chapter_boss.requiredFragmentCount).toBe(3);
  });

  it("chapter_boss requiredFragmentType is 火", () => {
    expect(BOSS_NEON_SHIELDS.chapter_boss.requiredFragmentType).toBe("火");
  });

  it("mini_boss requiredFragmentType is null (any type accepted)", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.requiredFragmentType).toBeNull();
  });

  it("autoWeakenMs values exist and are ordered correctly", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.autoWeakenMs).toBe(30000);
    expect(BOSS_NEON_SHIELDS.chapter_boss.autoWeakenMs).toBe(45000);
    expect(BOSS_NEON_SHIELDS.final_boss.autoWeakenMs).toBe(60000);
  });

  it("vulnerableDurationMs values exist", () => {
    expect(BOSS_NEON_SHIELDS.mini_boss.vulnerableDurationMs).toBe(10000);
    expect(BOSS_NEON_SHIELDS.chapter_boss.vulnerableDurationMs).toBe(8000);
    expect(BOSS_NEON_SHIELDS.final_boss.vulnerableDurationMs).toBe(6000);
  });
});
