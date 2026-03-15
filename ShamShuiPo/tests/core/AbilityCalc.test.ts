import { describe, it, expect } from "vitest";
import {
  AbilityId,
  ABILITY_DEFS,
  createAbilityState,
  canActivate,
  activate,
  tickAbility,
  deactivate,
  upgradeAbility,
  getAbilityDamage,
  getAbilityRadius,
  getCooldownPercent,
  resetAllCooldowns,
  getReadyAbilities,
  calculateEnergyCost,
} from "../../src/core/AbilityCalc";

// ── ABILITY_DEFS ──────────────────────────────────────────────────

describe("ABILITY_DEFS", () => {
  it("contains all six abilities", () => {
    const ids: AbilityId[] = [
      "dash",
      "shield_burst",
      "time_warp",
      "neon_nova",
      "cyber_strike",
      "hack_pulse",
    ];
    for (const id of ids) {
      expect(ABILITY_DEFS[id]).toBeDefined();
      expect(ABILITY_DEFS[id].id).toBe(id);
    }
  });

  it("dash has 2 max charges", () => {
    expect(ABILITY_DEFS.dash.maxCharges).toBe(2);
  });

  it("neon_nova has damageMultiplier", () => {
    expect(ABILITY_DEFS.neon_nova.damageMultiplier).toBe(3.0);
  });

  it("shield_burst has radiusOrRange", () => {
    expect(ABILITY_DEFS.shield_burst.radiusOrRange).toBe(120);
  });

  it("time_warp has no damageMultiplier", () => {
    expect(ABILITY_DEFS.time_warp.damageMultiplier).toBeUndefined();
  });

  it("all defs have positive cooldown", () => {
    for (const def of Object.values(ABILITY_DEFS)) {
      expect(def.cooldown).toBeGreaterThan(0);
    }
  });

  it("all defs have positive energyCost", () => {
    for (const def of Object.values(ABILITY_DEFS)) {
      expect(def.energyCost).toBeGreaterThan(0);
    }
  });

  it("all defs have name and description", () => {
    for (const def of Object.values(ABILITY_DEFS)) {
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });
});

// ── createAbilityState ────────────────────────────────────────────

describe("createAbilityState", () => {
  it("creates state with correct id", () => {
    const state = createAbilityState("dash");
    expect(state.id).toBe("dash");
  });

  it("starts with zero cooldown", () => {
    const state = createAbilityState("dash");
    expect(state.cooldownRemaining).toBe(0);
  });

  it("starts with full charges", () => {
    const state = createAbilityState("dash");
    expect(state.chargesLeft).toBe(2);
  });

  it("starts with full charges for cyber_strike", () => {
    const state = createAbilityState("cyber_strike");
    expect(state.chargesLeft).toBe(3);
  });

  it("starts inactive", () => {
    const state = createAbilityState("shield_burst");
    expect(state.isActive).toBe(false);
  });

  it("starts with zero active time", () => {
    const state = createAbilityState("time_warp");
    expect(state.activeTimeRemaining).toBe(0);
  });

  it("starts at level 1", () => {
    const state = createAbilityState("neon_nova");
    expect(state.level).toBe(1);
  });

  it("works for all six ability ids", () => {
    const ids: AbilityId[] = [
      "dash",
      "shield_burst",
      "time_warp",
      "neon_nova",
      "cyber_strike",
      "hack_pulse",
    ];
    for (const id of ids) {
      const state = createAbilityState(id);
      expect(state.id).toBe(id);
      expect(state.level).toBe(1);
    }
  });
});

// ── canActivate ───────────────────────────────────────────────────

describe("canActivate", () => {
  it("returns true for fresh state", () => {
    const state = createAbilityState("dash");
    expect(canActivate(state)).toBe(true);
  });

  it("returns false when on cooldown", () => {
    const state = createAbilityState("dash");
    const activated = activate(state);
    expect(canActivate(activated)).toBe(false);
  });

  it("returns false when no charges remain", () => {
    const state: ReturnType<typeof createAbilityState> = {
      ...createAbilityState("shield_burst"),
      chargesLeft: 0,
    };
    expect(canActivate(state)).toBe(false);
  });

  it("returns false when ability is active", () => {
    const state: ReturnType<typeof createAbilityState> = {
      ...createAbilityState("shield_burst"),
      isActive: true,
      activeTimeRemaining: 2,
    };
    expect(canActivate(state)).toBe(false);
  });

  it("returns true when cooldown is zero and has charges", () => {
    const state: ReturnType<typeof createAbilityState> = {
      ...createAbilityState("dash"),
      cooldownRemaining: 0,
      chargesLeft: 1,
    };
    expect(canActivate(state)).toBe(true);
  });
});

// ── activate ──────────────────────────────────────────────────────

describe("activate", () => {
  it("consumes a charge", () => {
    const state = createAbilityState("dash");
    const result = activate(state);
    expect(result.chargesLeft).toBe(1);
  });

  it("sets cooldown", () => {
    const state = createAbilityState("dash");
    const result = activate(state);
    expect(result.cooldownRemaining).toBe(ABILITY_DEFS.dash.cooldown);
  });

  it("activates duration-based ability", () => {
    const state = createAbilityState("shield_burst");
    const result = activate(state);
    expect(result.isActive).toBe(true);
    expect(result.activeTimeRemaining).toBe(
      ABILITY_DEFS.shield_burst.activeDuration,
    );
  });

  it("does not activate instant ability (activeDuration=0)", () => {
    const state = createAbilityState("neon_nova");
    const result = activate(state);
    expect(result.isActive).toBe(false);
    expect(result.activeTimeRemaining).toBe(0);
  });

  it("returns same state when cannot activate", () => {
    const state: ReturnType<typeof createAbilityState> = {
      ...createAbilityState("dash"),
      chargesLeft: 0,
    };
    const result = activate(state);
    expect(result).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = createAbilityState("dash");
    activate(state);
    expect(state.chargesLeft).toBe(2);
    expect(state.cooldownRemaining).toBe(0);
  });

  it("sets cooldown scaled by level", () => {
    const state = { ...createAbilityState("dash"), level: 3 };
    const result = activate(state);
    // level 3: cooldown * (1 - 0.05*2) = 3 * 0.9 = 2.7
    expect(result.cooldownRemaining).toBeCloseTo(2.7, 5);
  });

  it("activates time_warp with correct duration", () => {
    const state = createAbilityState("time_warp");
    const result = activate(state);
    expect(result.isActive).toBe(true);
    expect(result.activeTimeRemaining).toBe(5);
  });

  it("activates hack_pulse with correct duration", () => {
    const state = createAbilityState("hack_pulse");
    const result = activate(state);
    expect(result.isActive).toBe(true);
    expect(result.activeTimeRemaining).toBe(3);
  });
});

// ── tickAbility ──────────────────────────────────────────────────

describe("tickAbility", () => {
  it("reduces cooldown", () => {
    const state = activate(createAbilityState("dash"));
    const ticked = tickAbility(state, 1);
    expect(ticked.cooldownRemaining).toBe(state.cooldownRemaining - 1);
  });

  it("does not reduce cooldown below zero", () => {
    const state = activate(createAbilityState("dash"));
    const ticked = tickAbility(state, 100);
    expect(ticked.cooldownRemaining).toBe(0);
  });

  it("reduces active time", () => {
    const state = activate(createAbilityState("shield_burst"));
    const ticked = tickAbility(state, 1);
    expect(ticked.activeTimeRemaining).toBe(
      ABILITY_DEFS.shield_burst.activeDuration - 1,
    );
  });

  it("deactivates when active time expires", () => {
    const state = activate(createAbilityState("shield_burst"));
    const ticked = tickAbility(state, 10);
    expect(ticked.isActive).toBe(false);
    expect(ticked.activeTimeRemaining).toBe(0);
  });

  it("regenerates a charge when cooldown expires", () => {
    const state = activate(createAbilityState("shield_burst"));
    expect(state.chargesLeft).toBe(0);
    const ticked = tickAbility(state, ABILITY_DEFS.shield_burst.cooldown + 1);
    expect(ticked.chargesLeft).toBe(1);
  });

  it("does not regenerate above max charges", () => {
    const state = createAbilityState("dash"); // already at max (2)
    const ticked = tickAbility(state, 100);
    expect(ticked.chargesLeft).toBe(2);
  });

  it("returns same state for zero dt", () => {
    const state = createAbilityState("dash");
    const ticked = tickAbility(state, 0);
    expect(ticked).toBe(state);
  });

  it("returns same state for negative dt", () => {
    const state = createAbilityState("dash");
    const ticked = tickAbility(state, -5);
    expect(ticked).toBe(state);
  });

  it("does not mutate original state", () => {
    const state = activate(createAbilityState("dash"));
    const originalCooldown = state.cooldownRemaining;
    tickAbility(state, 1);
    expect(state.cooldownRemaining).toBe(originalCooldown);
  });

  it("handles very small dt correctly", () => {
    const state = activate(createAbilityState("dash"));
    const ticked = tickAbility(state, 0.016);
    expect(ticked.cooldownRemaining).toBeCloseTo(
      state.cooldownRemaining - 0.016,
      5,
    );
  });
});

// ── deactivate ──────────────────────────────────────────────────

describe("deactivate", () => {
  it("sets isActive to false", () => {
    const state = activate(createAbilityState("shield_burst"));
    const result = deactivate(state);
    expect(result.isActive).toBe(false);
  });

  it("sets activeTimeRemaining to zero", () => {
    const state = activate(createAbilityState("shield_burst"));
    const result = deactivate(state);
    expect(result.activeTimeRemaining).toBe(0);
  });

  it("returns same state if not active", () => {
    const state = createAbilityState("dash");
    const result = deactivate(state);
    expect(result).toBe(state);
  });

  it("does not affect cooldown", () => {
    const state = activate(createAbilityState("shield_burst"));
    const result = deactivate(state);
    expect(result.cooldownRemaining).toBe(state.cooldownRemaining);
  });
});

// ── upgradeAbility ──────────────────────────────────────────────

describe("upgradeAbility", () => {
  it("increases level by 1", () => {
    const state = createAbilityState("dash");
    const upgraded = upgradeAbility(state);
    expect(upgraded.level).toBe(2);
  });

  it("can upgrade multiple times", () => {
    let state = createAbilityState("dash");
    state = upgradeAbility(state);
    state = upgradeAbility(state);
    state = upgradeAbility(state);
    expect(state.level).toBe(4);
  });

  it("grants bonus charge at level 4", () => {
    let state = createAbilityState("shield_burst"); // 1 max charge
    // Level up to 4
    state = upgradeAbility(state); // 2
    state = upgradeAbility(state); // 3
    state = upgradeAbility(state); // 4 -> +1 bonus charge
    expect(state.chargesLeft).toBe(2); // 1 base + 1 bonus
  });

  it("grants another bonus charge at level 8", () => {
    let state = createAbilityState("shield_burst"); // 1 max charge
    for (let i = 0; i < 7; i++) {
      state = upgradeAbility(state);
    }
    expect(state.level).toBe(8);
    expect(state.chargesLeft).toBe(3); // 1 base + 2 bonus
  });

  it("does not mutate original state", () => {
    const state = createAbilityState("dash");
    upgradeAbility(state);
    expect(state.level).toBe(1);
  });

  it("preserves id", () => {
    const state = createAbilityState("neon_nova");
    const upgraded = upgradeAbility(state);
    expect(upgraded.id).toBe("neon_nova");
  });
});

// ── getAbilityDamage ─────────────────────────────────────────────

describe("getAbilityDamage", () => {
  it("returns scaled damage for ability with multiplier", () => {
    const state = createAbilityState("neon_nova");
    // baseDamage=100, multiplier=3.0, level=1 -> 300
    expect(getAbilityDamage(state, 100)).toBe(300);
  });

  it("returns zero for ability without multiplier", () => {
    const state = createAbilityState("dash");
    expect(getAbilityDamage(state, 100)).toBe(0);
  });

  it("returns zero for ability without multiplier (time_warp)", () => {
    const state = createAbilityState("time_warp");
    expect(getAbilityDamage(state, 100)).toBe(0);
  });

  it("scales damage with level", () => {
    const state = { ...createAbilityState("neon_nova"), level: 3 };
    // multiplier=3.0, level bonus = 1 + 0.1*2 = 1.2
    // 100 * 3.0 * 1.2 = 360
    expect(getAbilityDamage(state, 100)).toBeCloseTo(360, 5);
  });

  it("returns zero for zero base damage", () => {
    const state = createAbilityState("neon_nova");
    expect(getAbilityDamage(state, 0)).toBe(0);
  });

  it("handles cyber_strike damage", () => {
    const state = createAbilityState("cyber_strike");
    // multiplier=2.0, level=1 -> 100 * 2.0 = 200
    expect(getAbilityDamage(state, 100)).toBe(200);
  });

  it("handles shield_burst damage", () => {
    const state = createAbilityState("shield_burst");
    // multiplier=0.5, level=1 -> 100 * 0.5 = 50
    expect(getAbilityDamage(state, 100)).toBe(50);
  });
});

// ── getAbilityRadius ─────────────────────────────────────────────

describe("getAbilityRadius", () => {
  it("returns radius for ability with radiusOrRange", () => {
    const state = createAbilityState("neon_nova");
    expect(getAbilityRadius(state)).toBe(200);
  });

  it("returns zero for ability without radiusOrRange", () => {
    const state = createAbilityState("dash");
    expect(getAbilityRadius(state)).toBe(0);
  });

  it("returns zero for time_warp (no radius)", () => {
    const state = createAbilityState("time_warp");
    expect(getAbilityRadius(state)).toBe(0);
  });

  it("scales radius with level", () => {
    const state = { ...createAbilityState("neon_nova"), level: 3 };
    // 200 * (1 + 0.08*2) = 200 * 1.16 = 232
    expect(getAbilityRadius(state)).toBeCloseTo(232, 5);
  });

  it("returns correct radius for shield_burst", () => {
    const state = createAbilityState("shield_burst");
    expect(getAbilityRadius(state)).toBe(120);
  });
});

// ── getCooldownPercent ──────────────────────────────────────────

describe("getCooldownPercent", () => {
  it("returns 0 when not on cooldown", () => {
    const state = createAbilityState("dash");
    expect(getCooldownPercent(state)).toBe(0);
  });

  it("returns 1 immediately after activation", () => {
    const state = activate(createAbilityState("dash"));
    expect(getCooldownPercent(state)).toBeCloseTo(1, 5);
  });

  it("returns value between 0 and 1 during cooldown", () => {
    const state = activate(createAbilityState("dash"));
    const ticked = tickAbility(state, ABILITY_DEFS.dash.cooldown / 2);
    const pct = getCooldownPercent(ticked);
    expect(pct).toBeCloseTo(0.5, 1);
  });

  it("returns 0 after cooldown expires", () => {
    const state = activate(createAbilityState("dash"));
    const ticked = tickAbility(state, ABILITY_DEFS.dash.cooldown + 1);
    expect(getCooldownPercent(ticked)).toBe(0);
  });

  it("never exceeds 1", () => {
    const state: ReturnType<typeof createAbilityState> = {
      ...createAbilityState("dash"),
      cooldownRemaining: 999,
    };
    const pct = getCooldownPercent(state);
    expect(pct).toBeLessThanOrEqual(1);
  });

  it("accounts for level scaling", () => {
    const state = { ...createAbilityState("dash"), level: 3 };
    const activated = activate(state);
    // Should be 1.0 immediately after activation even with level scaling
    expect(getCooldownPercent(activated)).toBeCloseTo(1, 5);
  });
});

// ── calculateEnergyCost ──────────────────────────────────────────

describe("calculateEnergyCost", () => {
  it("returns base cost at level 1", () => {
    const state = createAbilityState("dash");
    expect(calculateEnergyCost(state)).toBe(ABILITY_DEFS.dash.energyCost);
  });

  it("reduces cost at higher levels", () => {
    const state = { ...createAbilityState("dash"), level: 5 };
    const cost = calculateEnergyCost(state);
    // 15 * (1 - 0.03*4) = 15 * 0.88 = 13.2
    expect(cost).toBeCloseTo(13.2, 5);
  });

  it("does not reduce below 50% of base", () => {
    const state = { ...createAbilityState("time_warp"), level: 50 };
    const cost = calculateEnergyCost(state);
    // floor is 50% => 60 * 0.5 = 30
    expect(cost).toBe(ABILITY_DEFS.time_warp.energyCost * 0.5);
  });

  it("returns correct cost for each ability at level 1", () => {
    const ids: AbilityId[] = [
      "dash",
      "shield_burst",
      "time_warp",
      "neon_nova",
      "cyber_strike",
      "hack_pulse",
    ];
    for (const id of ids) {
      const state = createAbilityState(id);
      expect(calculateEnergyCost(state)).toBe(ABILITY_DEFS[id].energyCost);
    }
  });
});

// ── resetAllCooldowns ───────────────────────────────────────────

describe("resetAllCooldowns", () => {
  it("resets cooldowns to zero", () => {
    const states = [
      activate(createAbilityState("dash")),
      activate(createAbilityState("shield_burst")),
    ];
    const reset = resetAllCooldowns(states);
    for (const s of reset) {
      expect(s.cooldownRemaining).toBe(0);
    }
  });

  it("refills charges to max", () => {
    const states = [
      activate(createAbilityState("dash")),
      activate(createAbilityState("cyber_strike")),
    ];
    const reset = resetAllCooldowns(states);
    expect(reset[0].chargesLeft).toBe(ABILITY_DEFS.dash.maxCharges);
    expect(reset[1].chargesLeft).toBe(ABILITY_DEFS.cyber_strike.maxCharges);
  });

  it("handles empty array", () => {
    const reset = resetAllCooldowns([]);
    expect(reset).toHaveLength(0);
  });

  it("does not mutate original array", () => {
    const states = [activate(createAbilityState("dash"))];
    const originalCooldown = states[0].cooldownRemaining;
    resetAllCooldowns(states);
    expect(states[0].cooldownRemaining).toBe(originalCooldown);
  });

  it("accounts for level bonus charges", () => {
    const state = { ...createAbilityState("shield_burst"), level: 4 };
    const activated = activate(state);
    const reset = resetAllCooldowns([activated]);
    // shield_burst: 1 base + 1 bonus at level 4 = 2
    expect(reset[0].chargesLeft).toBe(2);
  });
});

// ── getReadyAbilities ──────────────────────────────────────────

describe("getReadyAbilities", () => {
  it("returns all abilities when all ready", () => {
    const states = [
      createAbilityState("dash"),
      createAbilityState("neon_nova"),
      createAbilityState("cyber_strike"),
    ];
    const ready = getReadyAbilities(states);
    expect(ready).toHaveLength(3);
  });

  it("excludes abilities on cooldown", () => {
    const states = [
      activate(createAbilityState("dash")),
      createAbilityState("neon_nova"),
    ];
    const ready = getReadyAbilities(states);
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("neon_nova");
  });

  it("excludes abilities with no charges", () => {
    const states = [
      { ...createAbilityState("dash"), chargesLeft: 0 },
      createAbilityState("neon_nova"),
    ];
    const ready = getReadyAbilities(states);
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("neon_nova");
  });

  it("returns empty array when none ready", () => {
    const states = [
      activate(createAbilityState("dash")),
      activate(createAbilityState("neon_nova")),
    ];
    const ready = getReadyAbilities(states);
    expect(ready).toHaveLength(0);
  });

  it("handles empty array", () => {
    const ready = getReadyAbilities([]);
    expect(ready).toHaveLength(0);
  });
});

// ── Integration / edge cases ───────────────────────────────────

describe("integration", () => {
  it("full cycle: activate → tick → recharge → activate again", () => {
    let state = createAbilityState("shield_burst");
    state = activate(state);
    expect(state.chargesLeft).toBe(0);
    expect(state.isActive).toBe(true);

    // Tick past cooldown
    state = tickAbility(state, ABILITY_DEFS.shield_burst.cooldown + 1);
    expect(state.chargesLeft).toBe(1);
    expect(state.cooldownRemaining).toBe(0);
    expect(state.isActive).toBe(false);

    // Can use again
    expect(canActivate(state)).toBe(true);
    state = activate(state);
    expect(state.chargesLeft).toBe(0);
  });

  it("dash can be used twice before needing recharge", () => {
    let state = createAbilityState("dash");
    state = activate(state);
    expect(state.chargesLeft).toBe(1);

    // Tick past cooldown only
    state = tickAbility(state, ABILITY_DEFS.dash.cooldown + 0.1);
    // Charge was regenerated since cooldown expired
    expect(state.chargesLeft).toBe(2);

    state = activate(state);
    expect(state.chargesLeft).toBe(1);
  });

  it("upgrade improves damage output", () => {
    let state = createAbilityState("neon_nova");
    const dmg1 = getAbilityDamage(state, 100);

    state = upgradeAbility(state);
    state = upgradeAbility(state);
    const dmg2 = getAbilityDamage(state, 100);

    expect(dmg2).toBeGreaterThan(dmg1);
  });

  it("upgrade improves radius", () => {
    let state = createAbilityState("shield_burst");
    const r1 = getAbilityRadius(state);

    state = upgradeAbility(state);
    const r2 = getAbilityRadius(state);

    expect(r2).toBeGreaterThan(r1);
  });

  it("upgrade reduces cooldown", () => {
    let state = createAbilityState("dash");
    state = activate(state);
    const cd1 = state.cooldownRemaining;

    let state2 = { ...createAbilityState("dash"), level: 5 };
    state2 = activate(state2);
    const cd2 = state2.cooldownRemaining;

    expect(cd2).toBeLessThan(cd1);
  });

  it("upgrade reduces energy cost", () => {
    const state1 = createAbilityState("neon_nova");
    const cost1 = calculateEnergyCost(state1);

    const state2 = { ...state1, level: 5 };
    const cost2 = calculateEnergyCost(state2);

    expect(cost2).toBeLessThan(cost1);
  });

  it("deactivate mid-duration stops the ability", () => {
    let state = createAbilityState("time_warp");
    state = activate(state);
    expect(state.isActive).toBe(true);

    state = tickAbility(state, 1);
    expect(state.isActive).toBe(true);

    state = deactivate(state);
    expect(state.isActive).toBe(false);
    expect(state.activeTimeRemaining).toBe(0);
  });

  it("resetAllCooldowns makes all abilities ready", () => {
    const states = [
      activate(createAbilityState("dash")),
      activate(createAbilityState("shield_burst")),
      activate(createAbilityState("cyber_strike")),
    ];
    // Deactivate duration-based abilities first, then reset cooldowns
    const deactivated = states.map((s) => (s.isActive ? deactivate(s) : s));
    const reset = resetAllCooldowns(deactivated);
    const ready = getReadyAbilities(reset);
    expect(ready).toHaveLength(3);
  });

  it("immutability is preserved across operations", () => {
    const original = createAbilityState("dash");
    const activated = activate(original);
    const ticked = tickAbility(activated, 1);
    const upgraded = upgradeAbility(original);

    expect(original.chargesLeft).toBe(2);
    expect(original.cooldownRemaining).toBe(0);
    expect(original.level).toBe(1);
    expect(activated.chargesLeft).toBe(1);
    expect(ticked.cooldownRemaining).toBeLessThan(activated.cooldownRemaining);
    expect(upgraded.level).toBe(2);
  });

  it("cyber_strike can be used 3 times rapidly then needs recharge", () => {
    let state = createAbilityState("cyber_strike");
    // Use all 3 charges without waiting for cooldown to expire
    // First use
    state = activate(state);
    expect(state.chargesLeft).toBe(2);
    // Tick just barely past cooldown (charge regens, net = still 2)
    // Instead, tick a tiny amount so cooldown is still active
    state = tickAbility(state, 0.1);
    // Manually clear cooldown to allow next activation without regen
    state = { ...state, cooldownRemaining: 0 };
    // Second use
    state = activate(state);
    expect(state.chargesLeft).toBe(1);
    state = { ...state, cooldownRemaining: 0 };
    // Third use
    state = activate(state);
    expect(state.chargesLeft).toBe(0);
    // No charges left, cannot activate
    expect(canActivate(state)).toBe(false);
  });
});
