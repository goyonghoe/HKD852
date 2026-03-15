import { describe, it, expect } from "vitest";
import {
  createMiniBoss,
  getMiniBossConfig,
  damageMiniBoss,
  getCurrentPhase,
  shouldTransitionPhase,
  getPhaseAttackPattern,
  tickMiniBoss,
  isEnraged,
  getEnrageMultiplier,
  getMiniBossRewards,
  getHpPercent,
  selectMiniBossForWave,
  getMiniBossDifficulty,
  mulberry32,
  type MiniBossId,
  type MiniBossState,
} from "../../src/core/MiniBossCalc";

// ── Helper ─────────────────────────────────────────────────────

const ALL_IDS: MiniBossId[] = [
  "cyber_brute",
  "neon_mage",
  "shock_tank",
  "blade_dancer",
  "void_weaver",
];

function makeBrute(scaling = 1): MiniBossState {
  return createMiniBoss("cyber_brute", scaling);
}

// ── mulberry32 PRNG ────────────────────────────────────────────

describe("mulberry32", () => {
  it("returns values in [0, 1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for same seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("differs for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const va = a();
    const vb = b();
    expect(va).not.toBe(vb);
  });
});

// ── getMiniBossConfig ──────────────────────────────────────────

describe("getMiniBossConfig", () => {
  it("returns config for each boss id", () => {
    for (const id of ALL_IDS) {
      const cfg = getMiniBossConfig(id);
      expect(cfg.id).toBe(id);
      expect(cfg.baseHp).toBeGreaterThan(0);
      expect(cfg.baseDamage).toBeGreaterThan(0);
      expect(cfg.phases.length).toBeGreaterThan(0);
    }
  });

  it("cyber_brute has 500 HP and 3 phases", () => {
    const cfg = getMiniBossConfig("cyber_brute");
    expect(cfg.baseHp).toBe(500);
    expect(cfg.phases.length).toBe(3);
  });

  it("shock_tank has 700 HP and 2 phases", () => {
    const cfg = getMiniBossConfig("shock_tank");
    expect(cfg.baseHp).toBe(700);
    expect(cfg.phases.length).toBe(2);
  });

  it("blade_dancer has 4 phases", () => {
    const cfg = getMiniBossConfig("blade_dancer");
    expect(cfg.phases.length).toBe(4);
  });

  it("neon_mage has 300 HP", () => {
    const cfg = getMiniBossConfig("neon_mage");
    expect(cfg.baseHp).toBe(300);
  });

  it("void_weaver has 400 HP", () => {
    const cfg = getMiniBossConfig("void_weaver");
    expect(cfg.baseHp).toBe(400);
  });
});

// ── createMiniBoss ─────────────────────────────────────────────

describe("createMiniBoss", () => {
  it("creates boss at full HP with scaling 1", () => {
    const s = makeBrute();
    expect(s.currentHp).toBe(500);
    expect(s.currentPhase).toBe(1);
    expect(s.isDefeated).toBe(false);
    expect(s.enraged).toBe(false);
  });

  it("scales HP by waveScaling", () => {
    const s = createMiniBoss("cyber_brute", 2);
    expect(s.currentHp).toBe(1000);
    expect(s.config.baseHp).toBe(1000);
  });

  it("scales damage by waveScaling", () => {
    const s = createMiniBoss("neon_mage", 3);
    expect(s.config.baseDamage).toBe(Math.round(35 * 3));
  });

  it("initializes timers", () => {
    const s = makeBrute();
    expect(s.attackTimer).toBe(2.0);
    expect(s.specialTimer).toBe(5.0);
  });

  it("starts with 0 shields", () => {
    const s = makeBrute();
    expect(s.shields).toBe(0);
  });
});

// ── getHpPercent ───────────────────────────────────────────────

describe("getHpPercent", () => {
  it("returns 1 at full HP", () => {
    expect(getHpPercent(makeBrute())).toBe(1);
  });

  it("returns 0.5 at half HP", () => {
    const s = makeBrute();
    const { state } = damageMiniBoss(s, 250);
    expect(getHpPercent(state)).toBe(0.5);
  });

  it("returns 0 when defeated", () => {
    const s = makeBrute();
    const { state } = damageMiniBoss(s, 9999);
    expect(getHpPercent(state)).toBe(0);
  });

  it("clamps to 0-1 range", () => {
    const pct = getHpPercent(makeBrute());
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(1);
  });
});

// ── damageMiniBoss ─────────────────────────────────────────────

describe("damageMiniBoss", () => {
  it("reduces HP by damage amount", () => {
    const { state } = damageMiniBoss(makeBrute(), 100);
    expect(state.currentHp).toBe(400);
  });

  it("does not go below 0 HP", () => {
    const { state } = damageMiniBoss(makeBrute(), 9999);
    expect(state.currentHp).toBe(0);
  });

  it("marks defeated when HP reaches 0", () => {
    const { state, isDefeated } = damageMiniBoss(makeBrute(), 500);
    expect(state.isDefeated).toBe(true);
    expect(isDefeated).toBe(true);
  });

  it("ignores zero damage", () => {
    const original = makeBrute();
    const { state } = damageMiniBoss(original, 0);
    expect(state.currentHp).toBe(500);
  });

  it("ignores negative damage", () => {
    const original = makeBrute();
    const { state } = damageMiniBoss(original, -50);
    expect(state.currentHp).toBe(500);
  });

  it("does not apply damage to defeated boss", () => {
    const defeated = damageMiniBoss(makeBrute(), 500).state;
    const { state } = damageMiniBoss(defeated, 100);
    expect(state.currentHp).toBe(0);
  });

  it("triggers phase transition on threshold cross", () => {
    // cyber_brute phase 2 at 50% HP (250 HP)
    const { phaseChanged, state } = damageMiniBoss(makeBrute(), 250);
    expect(phaseChanged).toBe(true);
    expect(state.currentPhase).toBe(2);
  });

  it("handles shields absorbing damage", () => {
    const s: MiniBossState = { ...makeBrute(), shields: 50 };
    const { state } = damageMiniBoss(s, 30);
    expect(state.shields).toBe(20);
    expect(state.currentHp).toBe(500);
  });

  it("shields partially absorb then HP takes remainder", () => {
    const s: MiniBossState = { ...makeBrute(), shields: 30 };
    const { state } = damageMiniBoss(s, 50);
    expect(state.shields).toBe(0);
    expect(state.currentHp).toBe(480);
  });

  it("sets enraged when HP drops below 25%", () => {
    const { state } = damageMiniBoss(makeBrute(), 400);
    expect(state.enraged).toBe(true);
  });
});

// ── getCurrentPhase ────────────────────────────────────────────

describe("getCurrentPhase", () => {
  it("returns phase 1 at full HP", () => {
    const phase = getCurrentPhase(makeBrute());
    expect(phase.phaseNumber).toBe(1);
  });

  it("returns correct phase after transition", () => {
    const { state } = damageMiniBoss(makeBrute(), 250);
    const phase = getCurrentPhase(state);
    expect(phase.phaseNumber).toBe(2);
  });

  it("blade_dancer can reach phase 4", () => {
    const s = createMiniBoss("blade_dancer", 1);
    // Phase 4 at 15% → 350 * 0.85 = 297.5
    const { state } = damageMiniBoss(s, 298);
    const phase = getCurrentPhase(state);
    expect(phase.phaseNumber).toBe(4);
  });
});

// ── shouldTransitionPhase ──────────────────────────────────────

describe("shouldTransitionPhase", () => {
  it("returns false at full HP", () => {
    expect(shouldTransitionPhase(makeBrute())).toBe(false);
  });

  it("returns true when HP crosses phase 2 threshold", () => {
    const s: MiniBossState = { ...makeBrute(), currentHp: 250 };
    expect(shouldTransitionPhase(s)).toBe(true);
  });

  it("returns false if already in correct phase", () => {
    const { state } = damageMiniBoss(makeBrute(), 250);
    // already transitioned
    expect(shouldTransitionPhase(state)).toBe(false);
  });
});

// ── getPhaseAttackPattern ──────────────────────────────────────

describe("getPhaseAttackPattern", () => {
  it("returns phase 1 attack pattern initially", () => {
    expect(getPhaseAttackPattern(makeBrute())).toBe("heavy_swing");
  });

  it("changes with phase transition", () => {
    const { state } = damageMiniBoss(makeBrute(), 250);
    expect(getPhaseAttackPattern(state)).toBe("charge_rush");
  });

  it("neon_mage phase 1 is arcane_bolt", () => {
    const s = createMiniBoss("neon_mage", 1);
    expect(getPhaseAttackPattern(s)).toBe("arcane_bolt");
  });
});

// ── tickMiniBoss ───────────────────────────────────────────────

describe("tickMiniBoss", () => {
  it("decrements attack timer", () => {
    const s = makeBrute();
    const ticked = tickMiniBoss(s, 0.5);
    expect(ticked.attackTimer).toBe(1.5);
  });

  it("decrements special timer", () => {
    const s = makeBrute();
    const ticked = tickMiniBoss(s, 1.0);
    expect(ticked.specialTimer).toBe(4.0);
  });

  it("resets attack timer to cooldown when it reaches 0", () => {
    const s = makeBrute();
    const ticked = tickMiniBoss(s, 2.0);
    expect(ticked.attackTimer).toBe(2.0); // reset
  });

  it("resets special timer to cooldown when it reaches 0", () => {
    const s = makeBrute();
    const ticked = tickMiniBoss(s, 5.0);
    expect(ticked.specialTimer).toBe(5.0); // reset
  });

  it("does not tick defeated boss", () => {
    const defeated = damageMiniBoss(makeBrute(), 500).state;
    const ticked = tickMiniBoss(defeated, 1.0);
    expect(ticked.attackTimer).toBe(defeated.attackTimer);
  });

  it("timer does not go negative", () => {
    const s = makeBrute();
    const ticked = tickMiniBoss(s, 100);
    expect(ticked.attackTimer).toBeGreaterThanOrEqual(0);
    expect(ticked.specialTimer).toBeGreaterThanOrEqual(0);
  });
});

// ── isEnraged / getEnrageMultiplier ────────────────────────────

describe("isEnraged", () => {
  it("returns false at full HP", () => {
    expect(isEnraged(makeBrute())).toBe(false);
  });

  it("returns true below 25% HP", () => {
    const { state } = damageMiniBoss(makeBrute(), 400);
    expect(isEnraged(state)).toBe(true);
  });

  it("returns true at exactly 25% HP", () => {
    const { state } = damageMiniBoss(makeBrute(), 375);
    expect(isEnraged(state)).toBe(true);
  });

  it("returns false for defeated boss", () => {
    const { state } = damageMiniBoss(makeBrute(), 500);
    expect(isEnraged(state)).toBe(false);
  });
});

describe("getEnrageMultiplier", () => {
  it("returns 1.0 when not enraged", () => {
    expect(getEnrageMultiplier(makeBrute())).toBe(1.0);
  });

  it("returns 1.5 when enraged", () => {
    const { state } = damageMiniBoss(makeBrute(), 400);
    expect(getEnrageMultiplier(state)).toBe(1.5);
  });
});

// ── getMiniBossRewards ─────────────────────────────────────────

describe("getMiniBossRewards", () => {
  it("returns base rewards at scale 1", () => {
    const s = makeBrute();
    const r = getMiniBossRewards(s);
    expect(r.xp).toBe(200);
    expect(r.coins).toBe(150);
    expect(r.drops).toBeGreaterThanOrEqual(1);
  });

  it("scales rewards with wave scaling", () => {
    const s = createMiniBoss("cyber_brute", 2);
    const r = getMiniBossRewards(s);
    expect(r.xp).toBe(400);
    expect(r.coins).toBe(300);
  });

  it("gives bonus rewards when enraged", () => {
    const s = createMiniBoss("cyber_brute", 1);
    const { state } = damageMiniBoss(s, 400);
    const r = getMiniBossRewards(state);
    expect(r.xp).toBe(Math.round(200 * 1.25));
    expect(r.coins).toBe(Math.round(150 * 1.25));
  });

  it("drops clamped between 1 and 5", () => {
    const s1 = createMiniBoss("cyber_brute", 0.1);
    expect(getMiniBossRewards(s1).drops).toBeGreaterThanOrEqual(1);
    const s5 = createMiniBoss("cyber_brute", 10);
    expect(getMiniBossRewards(s5).drops).toBeLessThanOrEqual(5);
  });
});

// ── selectMiniBossForWave ──────────────────────────────────────

describe("selectMiniBossForWave", () => {
  it("returns a valid MiniBossId", () => {
    const id = selectMiniBossForWave(5, 42);
    expect(ALL_IDS).toContain(id);
  });

  it("is deterministic for same wave+seed", () => {
    const a = selectMiniBossForWave(10, 99);
    const b = selectMiniBossForWave(10, 99);
    expect(a).toBe(b);
  });

  it("varies with different seeds", () => {
    const results = new Set<MiniBossId>();
    for (let seed = 0; seed < 50; seed++) {
      results.add(selectMiniBossForWave(1, seed));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("varies with different waves", () => {
    const results = new Set<MiniBossId>();
    for (let wave = 1; wave <= 50; wave++) {
      results.add(selectMiniBossForWave(wave, 42));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── getMiniBossDifficulty ──────────────────────────────────────

describe("getMiniBossDifficulty", () => {
  it("returns 1-5 for all bosses", () => {
    for (const id of ALL_IDS) {
      const d = getMiniBossDifficulty(id);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(5);
    }
  });

  it("blade_dancer is hardest (5)", () => {
    expect(getMiniBossDifficulty("blade_dancer")).toBe(5);
  });

  it("shock_tank is easiest (2)", () => {
    expect(getMiniBossDifficulty("shock_tank")).toBe(2);
  });

  it("cyber_brute is 3", () => {
    expect(getMiniBossDifficulty("cyber_brute")).toBe(3);
  });
});

// ── Immutability ───────────────────────────────────────────────

describe("immutability", () => {
  it("damageMiniBoss does not mutate original state", () => {
    const original = makeBrute();
    const originalHp = original.currentHp;
    damageMiniBoss(original, 100);
    expect(original.currentHp).toBe(originalHp);
  });

  it("tickMiniBoss does not mutate original state", () => {
    const original = makeBrute();
    const originalTimer = original.attackTimer;
    tickMiniBoss(original, 1.0);
    expect(original.attackTimer).toBe(originalTimer);
  });
});

// ── Multi-phase combat sequence ────────────────────────────────

describe("full combat sequence", () => {
  it("cyber_brute transitions through all 3 phases to defeat", () => {
    let state = makeBrute();
    expect(state.currentPhase).toBe(1);

    // Phase 1 → 2 (cross 50%)
    const r1 = damageMiniBoss(state, 260);
    state = r1.state;
    expect(r1.phaseChanged).toBe(true);
    expect(state.currentPhase).toBe(2);

    // Phase 2 → 3 (cross 25%)
    const r2 = damageMiniBoss(state, 130);
    state = r2.state;
    expect(r2.phaseChanged).toBe(true);
    expect(state.currentPhase).toBe(3);
    expect(state.enraged).toBe(true);

    // Defeat
    const r3 = damageMiniBoss(state, 200);
    state = r3.state;
    expect(r3.isDefeated).toBe(true);
    expect(state.currentHp).toBe(0);
  });

  it("blade_dancer goes through 4 phases", () => {
    let state = createMiniBoss("blade_dancer", 1);
    // HP = 350
    // Phase 2 at 70% → 245 HP → need 105 dmg
    let r = damageMiniBoss(state, 106);
    state = r.state;
    expect(state.currentPhase).toBe(2);

    // Phase 3 at 40% → 140 HP → need 104 more (from 244)
    r = damageMiniBoss(state, 105);
    state = r.state;
    expect(state.currentPhase).toBe(3);

    // Phase 4 at 15% → 52.5 HP → need ~87
    r = damageMiniBoss(state, 90);
    state = r.state;
    expect(state.currentPhase).toBe(4);

    // Defeat
    r = damageMiniBoss(state, 100);
    state = r.state;
    expect(r.isDefeated).toBe(true);
  });
});
