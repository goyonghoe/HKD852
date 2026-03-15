// ── Tests: ChronoHackCalc ──

import { describe, it, expect } from "vitest";
import {
  createChronoState,
  chargeGauge,
  canActivate,
  activate,
  tickChrono,
  isActive,
  getTimeScale,
  getPlayerSpeedMultiplier,
  getDamageMultiplier,
  getCritBonus,
  deactivate,
  getFragmentFreezeMultiplier,
  getComboMeterBonus,
  type ChronoState,
  type ChronoActiveState,
} from "../../src/core/ChronoHackCalc";
import { CHRONO_HACK } from "../../src/config/balance";

// ════════════════════════════════════════════════════════════════
// § Factory
// ════════════════════════════════════════════════════════════════

describe("createChronoState", () => {
  it("creates state with 0 gauge", () => {
    const state = createChronoState();
    expect(state.gauge).toBe(0);
  });

  it("creates inactive state", () => {
    const state = createChronoState();
    expect(state.active).toBe(false);
  });

  it("accepts hasPassive flag", () => {
    const state = createChronoState(true);
    expect(state.hasPassive).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § Gauge Charging
// ════════════════════════════════════════════════════════════════

describe("chargeGauge", () => {
  it("adds 2 charge per normal kill", () => {
    const result = chargeGauge(0, "normal", false);
    expect(result).toBe(CHRONO_HACK.chargePerKill);
  });

  it("adds 5 charge per elite kill", () => {
    const result = chargeGauge(0, "elite", false);
    expect(result).toBe(CHRONO_HACK.chargePerEliteKill);
  });

  it("adds 20 charge per boss kill", () => {
    const result = chargeGauge(0, "boss", false);
    expect(result).toBe(CHRONO_HACK.chargePerBossKill);
  });

  it("caps at maxGauge (100)", () => {
    const result = chargeGauge(99, "boss", false);
    expect(result).toBe(CHRONO_HACK.maxGauge);
  });

  it("does not exceed maxGauge", () => {
    const result = chargeGauge(CHRONO_HACK.maxGauge, "normal", false);
    expect(result).toBe(CHRONO_HACK.maxGauge);
  });

  it("accumulates multiple charges", () => {
    let gauge = 0;
    gauge = chargeGauge(gauge, "normal", false);
    gauge = chargeGauge(gauge, "normal", false);
    gauge = chargeGauge(gauge, "normal", false);
    expect(gauge).toBe(6);
  });

  it("applies passive charge boost (+20%)", () => {
    const result = chargeGauge(0, "normal", true);
    const expected =
      CHRONO_HACK.chargePerKill * (1 + CHRONO_HACK.passiveBonus.chargeBoost);
    expect(result).toBeCloseTo(expected);
  });

  it("applies passive boost to elite kills", () => {
    const result = chargeGauge(0, "elite", true);
    const expected =
      CHRONO_HACK.chargePerEliteKill *
      (1 + CHRONO_HACK.passiveBonus.chargeBoost);
    expect(result).toBeCloseTo(expected);
  });

  it("applies passive boost to boss kills", () => {
    const result = chargeGauge(0, "boss", true);
    const expected =
      CHRONO_HACK.chargePerBossKill *
      (1 + CHRONO_HACK.passiveBonus.chargeBoost);
    expect(result).toBeCloseTo(expected);
  });

  it("passive boosted charge still caps at max", () => {
    const result = chargeGauge(90, "boss", true);
    expect(result).toBe(CHRONO_HACK.maxGauge);
  });
});

// ════════════════════════════════════════════════════════════════
// § Activation
// ════════════════════════════════════════════════════════════════

describe("canActivate", () => {
  it("returns false when gauge is below max", () => {
    expect(canActivate(50)).toBe(false);
  });

  it("returns false when gauge is 0", () => {
    expect(canActivate(0)).toBe(false);
  });

  it("returns false at 99", () => {
    expect(canActivate(99)).toBe(false);
  });

  it("returns true at exactly maxGauge", () => {
    expect(canActivate(CHRONO_HACK.maxGauge)).toBe(true);
  });

  it("returns true above maxGauge", () => {
    expect(canActivate(CHRONO_HACK.maxGauge + 10)).toBe(true);
  });
});

describe("activate", () => {
  it("sets active to true", () => {
    const state = { ...createChronoState(), gauge: CHRONO_HACK.maxGauge };
    const active = activate(state);
    expect(active.active).toBe(true);
  });

  it("sets timer to durationMs", () => {
    const state = { ...createChronoState(), gauge: CHRONO_HACK.maxGauge };
    const active = activate(state);
    expect(active.remainingMs).toBe(CHRONO_HACK.durationMs);
  });

  it("adds extra duration with passive", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: false,
      remainingMs: 0,
      hasPassive: true,
    };
    const active = activate(state);
    expect(active.remainingMs).toBe(
      CHRONO_HACK.durationMs + CHRONO_HACK.passiveBonus.extraDurationMs,
    );
  });

  it("throws when gauge is not full", () => {
    const state = createChronoState();
    expect(() => activate(state)).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// § Tick
// ════════════════════════════════════════════════════════════════

describe("tickChrono", () => {
  function makeActive(
    remainingMs: number = CHRONO_HACK.durationMs,
  ): ChronoActiveState {
    return {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs,
      hasPassive: false,
    };
  }

  it("decrements timer", () => {
    const state = makeActive(3000);
    const result = tickChrono(state, 1000);
    expect(result.remainingMs).toBe(2000);
  });

  it("auto-deactivates when timer reaches 0", () => {
    const state = makeActive(1000);
    const result = tickChrono(state, 1000);
    expect(result.active).toBe(false);
    expect(result.gauge).toBe(0);
  });

  it("auto-deactivates when timer goes negative", () => {
    const state = makeActive(500);
    const result = tickChrono(state, 1000);
    expect(result.active).toBe(false);
  });

  it("stays active when timer > 0", () => {
    const state = makeActive(3000);
    const result = tickChrono(state, 100);
    expect(result.active).toBe(true);
    expect(result.remainingMs).toBe(2900);
  });

  it("resets gauge to 0 on auto-deactivation", () => {
    const state = makeActive(100);
    const result = tickChrono(state, 200);
    expect(result.gauge).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § State Queries — Active
// ════════════════════════════════════════════════════════════════

describe("isActive", () => {
  it("returns false for new state", () => {
    expect(isActive(createChronoState())).toBe(false);
  });

  it("returns true for activated state", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(isActive(state)).toBe(true);
  });

  it("returns false when active but timer=0", () => {
    const state: ChronoState = {
      gauge: 0,
      active: true,
      remainingMs: 0,
      hasPassive: false,
    };
    expect(isActive(state)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § Multipliers — Active vs Inactive
// ════════════════════════════════════════════════════════════════

describe("getTimeScale", () => {
  it("returns 1.0 when inactive", () => {
    expect(getTimeScale(createChronoState())).toBe(1.0);
  });

  it("returns gameSpeedDuring when active", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getTimeScale(state)).toBe(CHRONO_HACK.gameSpeedDuring);
  });
});

describe("getPlayerSpeedMultiplier", () => {
  it("returns 1.0 when inactive", () => {
    expect(getPlayerSpeedMultiplier(createChronoState())).toBe(1.0);
  });

  it("returns playerSpeedMultiplier when active", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getPlayerSpeedMultiplier(state)).toBe(
      CHRONO_HACK.playerSpeedMultiplier,
    );
  });
});

describe("getDamageMultiplier", () => {
  it("returns 1.0 when inactive", () => {
    expect(getDamageMultiplier(createChronoState())).toBe(1.0);
  });

  it("returns 1.5x when active", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getDamageMultiplier(state)).toBe(CHRONO_HACK.damageMultiplier);
  });
});

describe("getCritBonus", () => {
  it("returns 0 when inactive", () => {
    expect(getCritBonus(createChronoState())).toBe(0);
  });

  it("returns +0.30 when active", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getCritBonus(state)).toBe(CHRONO_HACK.critChanceBonus);
  });
});

// ════════════════════════════════════════════════════════════════
// § Deactivation
// ════════════════════════════════════════════════════════════════

describe("deactivate", () => {
  it("sets active to false", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 1000,
      hasPassive: false,
    };
    const result = deactivate(active);
    expect(result.active).toBe(false);
  });

  it("resets gauge to 0", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 1000,
      hasPassive: false,
    };
    const result = deactivate(active);
    expect(result.gauge).toBe(0);
  });

  it("sets remainingMs to 0", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 1500,
      hasPassive: false,
    };
    const result = deactivate(active);
    expect(result.remainingMs).toBe(0);
  });

  it("preserves hasPassive flag", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 1000,
      hasPassive: true,
    };
    const result = deactivate(active);
    expect(result.hasPassive).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § getFragmentFreezeMultiplier (Neon Synergy)
// ════════════════════════════════════════════════════════════════

describe("getFragmentFreezeMultiplier", () => {
  it("returns 1 when Chrono Hack is inactive (fragments age normally)", () => {
    expect(getFragmentFreezeMultiplier(createChronoState())).toBe(1);
  });

  it("returns 0 when Chrono Hack is active (fragments are frozen)", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getFragmentFreezeMultiplier(state)).toBe(0);
  });

  it("returns 1 after Chrono Hack deactivates", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 100,
      hasPassive: false,
    };
    const deactivated = tickChrono(active, 200); // auto-deactivates
    expect(getFragmentFreezeMultiplier(deactivated)).toBe(1);
  });

  it("freeze multiplier * deltaMs = 0 means fragment age does not advance", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    const deltaMs = 500;
    const ageAdvance = deltaMs * getFragmentFreezeMultiplier(state);
    expect(ageAdvance).toBe(0);
  });

  it("freeze multiplier * deltaMs = deltaMs when inactive (normal aging)", () => {
    const state = createChronoState();
    const deltaMs = 500;
    const ageAdvance = deltaMs * getFragmentFreezeMultiplier(state);
    expect(ageAdvance).toBe(500);
  });

  it("returns 0 even with passive active during Chrono Hack", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 4000, // extra duration from passive
      hasPassive: true,
    };
    expect(getFragmentFreezeMultiplier(state)).toBe(0);
  });

  it("state with active=true but remainingMs=0 returns 1 (not truly active)", () => {
    const state: ChronoState = {
      gauge: 0,
      active: true,
      remainingMs: 0,
      hasPassive: false,
    };
    // isActive() returns false because remainingMs <= 0
    expect(getFragmentFreezeMultiplier(state)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getComboMeterBonus (Neon Synergy)
// ════════════════════════════════════════════════════════════════

describe("getComboMeterBonus", () => {
  it("returns 1.0 when Chrono Hack is inactive", () => {
    expect(getComboMeterBonus(createChronoState())).toBe(1.0);
  });

  it("returns 1.5 when Chrono Hack is active", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 3000,
      hasPassive: false,
    };
    expect(getComboMeterBonus(state)).toBe(CHRONO_HACK.comboMeterBonus);
  });

  it("returns 1.5 with passive during active Chrono Hack", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 4000,
      hasPassive: true,
    };
    expect(getComboMeterBonus(state)).toBe(CHRONO_HACK.comboMeterBonus);
  });

  it("returns 1.0 after Chrono Hack timer expires", () => {
    const active: ChronoActiveState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 100,
      hasPassive: false,
    };
    const deactivated = tickChrono(active, 200);
    expect(getComboMeterBonus(deactivated)).toBe(1.0);
  });

  it("comboMeterBonus is 1.5 in balance config", () => {
    expect(CHRONO_HACK.comboMeterBonus).toBe(1.5);
  });

  it("bonus is greater than 1.0 when active (always a boost)", () => {
    const state: ChronoState = {
      gauge: CHRONO_HACK.maxGauge,
      active: true,
      remainingMs: 1000,
      hasPassive: false,
    };
    expect(getComboMeterBonus(state)).toBeGreaterThan(1.0);
  });

  it("inactive state with zero gauge returns 1.0", () => {
    const state: ChronoState = {
      gauge: 0,
      active: false,
      remainingMs: 0,
      hasPassive: false,
    };
    expect(getComboMeterBonus(state)).toBe(1.0);
  });
});
