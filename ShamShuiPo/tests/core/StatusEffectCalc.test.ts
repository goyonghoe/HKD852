import { describe, it, expect } from "vitest";
import {
  createState,
  applyEffect,
  removeEffect,
  removeEffectByName,
  clearByCategory,
  clearByType,
  clearAll,
  tick,
  expireEffects,
  addImmunity,
  removeImmunity,
  isImmuneTo,
  clearImmunities,
  getActiveEffects,
  getEffectsByCategory,
  getEffectsByType,
  hasEffect,
  hasEffectFromSource,
  isStunned,
  isSilenced,
  isBleeding,
  isSlowed,
  getEffectCount,
  getEffectCountByType,
  getCombinedModifier,
  getSpeedModifier,
  getDamageModifier,
  getDefenseModifier,
  getRegenModifier,
  getBleedDamagePerTick,
  getRegenPerTick,
  getEffectsSortedByPriority,
  getRemainingDuration,
  getEffectProgress,
} from "../../src/core/StatusEffectCalc";

// ── Helpers ──

const speedBuff = {
  name: "haste",
  type: "buff" as const,
  category: "speed" as const,
  magnitude: 0.5,
  duration: 5,
  source: "potion",
};

const damageBuff = {
  name: "rage",
  type: "buff" as const,
  category: "damage" as const,
  magnitude: 0.3,
  duration: 10,
  source: "skill",
};

const bleedDebuff = {
  name: "bleed",
  type: "debuff" as const,
  category: "bleed" as const,
  magnitude: 5,
  duration: 6,
  source: "enemy",
  tickInterval: 1,
};

// ── createState ──

describe("createState", () => {
  it("returns empty state", () => {
    const s = createState();
    expect(s.effects).toEqual([]);
    expect(s.immunities).toEqual([]);
    expect(s.nextId).toBe(1);
  });
});

// ── applyEffect ──

describe("applyEffect", () => {
  it("adds a new effect", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].name).toBe("haste");
    expect(s.effects[0].id).toBe("effect_1");
    expect(s.nextId).toBe(2);
  });

  it("adds multiple different effects", () => {
    let s = createState();
    s = applyEffect(s, speedBuff);
    s = applyEffect(s, damageBuff);
    expect(s.effects).toHaveLength(2);
  });

  it("refresh stack rule resets elapsed and updates magnitude", () => {
    let s = applyEffect(createState(), { ...speedBuff, stackRule: "refresh" });
    s = tick(s, 2).state;
    s = applyEffect(s, { ...speedBuff, stackRule: "refresh", magnitude: 0.8 });
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].elapsed).toBe(0);
    expect(s.effects[0].magnitude).toBe(0.8);
  });

  it("stack rule increases magnitude up to maxStacks", () => {
    let s = createState();
    for (let i = 0; i < 7; i++) {
      s = applyEffect(s, { ...bleedDebuff, stackRule: "stack", maxStacks: 3 });
    }
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].stackCount).toBe(3);
    expect(s.effects[0].magnitude).toBe(15); // 5 * 3
  });

  it("replace rule keeps strongest", () => {
    let s = applyEffect(createState(), {
      ...speedBuff,
      stackRule: "replace",
      magnitude: 0.5,
    });
    // weaker should be ignored
    s = applyEffect(s, {
      ...speedBuff,
      stackRule: "replace",
      magnitude: 0.3,
    });
    expect(s.effects[0].magnitude).toBe(0.5);
    // stronger replaces
    s = applyEffect(s, {
      ...speedBuff,
      stackRule: "replace",
      magnitude: 0.9,
    });
    expect(s.effects[0].magnitude).toBe(0.9);
  });

  it("blocked by immunity", () => {
    let s = addImmunity(createState(), "speed");
    s = applyEffect(s, speedBuff);
    expect(s.effects).toHaveLength(0);
  });

  it("defaults to refresh stack rule", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(s.effects[0].stackRule).toBe("refresh");
  });

  it("sets tickInterval from params", () => {
    const s = applyEffect(createState(), bleedDebuff);
    expect(s.effects[0].tickInterval).toBe(1);
  });
});

// ── removeEffect ──

describe("removeEffect", () => {
  it("removes by id", () => {
    let s = applyEffect(createState(), speedBuff);
    s = removeEffect(s, "effect_1");
    expect(s.effects).toHaveLength(0);
  });

  it("no-op for unknown id", () => {
    const s = applyEffect(createState(), speedBuff);
    const s2 = removeEffect(s, "nope");
    expect(s2.effects).toHaveLength(1);
  });
});

// ── removeEffectByName ──

describe("removeEffectByName", () => {
  it("removes all effects with name", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, { ...speedBuff, source: "other" });
    s = removeEffectByName(s, "haste");
    expect(s.effects).toHaveLength(0);
  });

  it("removes only matching source when provided", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, { ...speedBuff, source: "other" });
    s = removeEffectByName(s, "haste", "potion");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].source).toBe("other");
  });
});

// ── clearByCategory / clearByType / clearAll ──

describe("clear functions", () => {
  it("clearByCategory removes matching category", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, damageBuff);
    s = clearByCategory(s, "speed");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].category).toBe("damage");
  });

  it("clearByType removes matching type", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, bleedDebuff);
    s = clearByType(s, "buff");
    expect(s.effects).toHaveLength(1);
    expect(s.effects[0].type).toBe("debuff");
  });

  it("clearAll removes everything", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, bleedDebuff);
    s = clearAll(s);
    expect(s.effects).toHaveLength(0);
  });
});

// ── tick ──

describe("tick", () => {
  it("advances elapsed time", () => {
    const s = applyEffect(createState(), speedBuff);
    const r = tick(s, 1);
    expect(r.state.effects[0].elapsed).toBe(1);
  });

  it("expires effects past duration", () => {
    const s = applyEffect(createState(), { ...speedBuff, duration: 2 });
    const r = tick(s, 3);
    expect(r.state.effects).toHaveLength(0);
  });

  it("fires tick events for DoT effects", () => {
    const s = applyEffect(createState(), bleedDebuff);
    const r = tick(s, 2.5);
    expect(r.tickedEffects.length).toBe(2); // ticked at t=1 and t=2
  });

  it("updates lastTickTime", () => {
    const s = applyEffect(createState(), bleedDebuff);
    const r = tick(s, 1.5);
    expect(r.state.effects[0].lastTickTime).toBe(1);
  });

  it("no tick events when tickInterval is 0", () => {
    const s = applyEffect(createState(), speedBuff);
    const r = tick(s, 3);
    expect(r.tickedEffects).toHaveLength(0);
  });
});

// ── expireEffects ──

describe("expireEffects", () => {
  it("removes expired effects", () => {
    const s = applyEffect(createState(), { ...speedBuff, duration: 3 });
    expect(expireEffects(s).effects).toHaveLength(1);
  });
});

// ── Immunity ──

describe("immunity system", () => {
  it("addImmunity adds category", () => {
    const s = addImmunity(createState(), "stun");
    expect(isImmuneTo(s, "stun")).toBe(true);
  });

  it("addImmunity removes existing effects of that category", () => {
    let s = applyEffect(createState(), {
      ...speedBuff,
      category: "stun",
      type: "debuff",
      name: "stun",
    });
    s = addImmunity(s, "stun");
    expect(s.effects).toHaveLength(0);
  });

  it("removeImmunity removes category", () => {
    let s = addImmunity(createState(), "stun");
    s = removeImmunity(s, "stun");
    expect(isImmuneTo(s, "stun")).toBe(false);
  });

  it("clearImmunities clears all", () => {
    let s = addImmunity(createState(), "stun");
    s = addImmunity(s, "slow");
    s = clearImmunities(s);
    expect(s.immunities).toHaveLength(0);
  });

  it("duplicate immunity is idempotent", () => {
    let s = addImmunity(createState(), "stun");
    s = addImmunity(s, "stun");
    expect(s.immunities.filter((c) => c === "stun")).toHaveLength(1);
  });
});

// ── Queries ──

describe("queries", () => {
  it("getActiveEffects returns all", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, damageBuff);
    expect(getActiveEffects(s)).toHaveLength(2);
  });

  it("getEffectsByCategory filters", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, damageBuff);
    expect(getEffectsByCategory(s, "speed")).toHaveLength(1);
  });

  it("getEffectsByType filters", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, bleedDebuff);
    expect(getEffectsByType(s, "buff")).toHaveLength(1);
  });

  it("hasEffect checks by name", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(hasEffect(s, "haste")).toBe(true);
    expect(hasEffect(s, "nope")).toBe(false);
  });

  it("hasEffectFromSource checks name+source", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(hasEffectFromSource(s, "haste", "potion")).toBe(true);
    expect(hasEffectFromSource(s, "haste", "other")).toBe(false);
  });

  it("isStunned", () => {
    const s = applyEffect(createState(), {
      name: "stun",
      type: "debuff",
      category: "stun",
      magnitude: 1,
      duration: 2,
      source: "e",
    });
    expect(isStunned(s)).toBe(true);
  });

  it("isSilenced", () => {
    const s = applyEffect(createState(), {
      name: "silence",
      type: "debuff",
      category: "silence",
      magnitude: 1,
      duration: 2,
      source: "e",
    });
    expect(isSilenced(s)).toBe(true);
  });

  it("isBleeding", () => {
    const s = applyEffect(createState(), bleedDebuff);
    expect(isBleeding(s)).toBe(true);
  });

  it("isSlowed", () => {
    const s = applyEffect(createState(), {
      name: "slow",
      type: "debuff",
      category: "slow",
      magnitude: 0.3,
      duration: 3,
      source: "e",
    });
    expect(isSlowed(s)).toBe(true);
  });

  it("getEffectCount", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, damageBuff);
    expect(getEffectCount(s)).toBe(2);
  });

  it("getEffectCountByType", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, bleedDebuff);
    expect(getEffectCountByType(s, "buff")).toBe(1);
    expect(getEffectCountByType(s, "debuff")).toBe(1);
  });
});

// ── Combined Modifiers ──

describe("combined modifiers", () => {
  it("getCombinedModifier returns 1 with no effects", () => {
    expect(getCombinedModifier(createState(), "speed")).toBe(1);
  });

  it("buff increases modifier", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(getCombinedModifier(s, "speed")).toBeCloseTo(1.5);
  });

  it("debuff decreases modifier", () => {
    const s = applyEffect(createState(), {
      name: "slow",
      type: "debuff",
      category: "slow",
      magnitude: 0.3,
      duration: 3,
      source: "e",
    });
    expect(getCombinedModifier(s, "slow")).toBeCloseTo(0.7);
  });

  it("debuff magnitude clamped so modifier >= 0", () => {
    const s = applyEffect(createState(), {
      name: "mega-slow",
      type: "debuff",
      category: "slow",
      magnitude: 2,
      duration: 3,
      source: "e",
    });
    expect(getCombinedModifier(s, "slow")).toBe(0);
  });

  it("getSpeedModifier combines speed + slow + stun", () => {
    let s = applyEffect(createState(), speedBuff);
    expect(getSpeedModifier(s)).toBeCloseTo(1.5);
    s = applyEffect(s, {
      name: "stun",
      type: "debuff",
      category: "stun",
      magnitude: 1,
      duration: 2,
      source: "e",
    });
    expect(getSpeedModifier(s)).toBe(0); // stunned
  });

  it("getDamageModifier", () => {
    const s = applyEffect(createState(), damageBuff);
    expect(getDamageModifier(s)).toBeCloseTo(1.3);
  });

  it("getDefenseModifier", () => {
    const s = applyEffect(createState(), {
      name: "shield",
      type: "buff",
      category: "defense",
      magnitude: 0.2,
      duration: 5,
      source: "s",
    });
    expect(getDefenseModifier(s)).toBeCloseTo(1.2);
  });

  it("getRegenModifier", () => {
    const s = applyEffect(createState(), {
      name: "regen",
      type: "buff",
      category: "regen",
      magnitude: 0.5,
      duration: 5,
      source: "s",
    });
    expect(getRegenModifier(s)).toBeCloseTo(1.5);
  });
});

// ── Tick Damage / Healing ──

describe("tick damage and healing", () => {
  it("getBleedDamagePerTick sums bleed magnitudes", () => {
    let s = applyEffect(createState(), bleedDebuff);
    s = applyEffect(s, { ...bleedDebuff, source: "enemy2", name: "bleed2" });
    expect(getBleedDamagePerTick(s)).toBe(10);
  });

  it("getRegenPerTick sums regen magnitudes", () => {
    const s = applyEffect(createState(), {
      name: "regen",
      type: "buff",
      category: "regen",
      magnitude: 3,
      duration: 10,
      source: "s",
    });
    expect(getRegenPerTick(s)).toBe(3);
  });
});

// ── Display Ordering ──

describe("display ordering", () => {
  it("sorts by priority descending", () => {
    let s = applyEffect(createState(), { ...speedBuff, priority: 1 });
    s = applyEffect(s, { ...damageBuff, priority: 5 });
    const sorted = getEffectsSortedByPriority(s);
    expect(sorted[0].priority).toBe(5);
    expect(sorted[1].priority).toBe(1);
  });

  it("same priority: buffs before debuffs", () => {
    let s = applyEffect(createState(), speedBuff);
    s = applyEffect(s, bleedDebuff);
    const sorted = getEffectsSortedByPriority(s);
    expect(sorted[0].type).toBe("buff");
  });

  it("same priority+type: shorter remaining first", () => {
    let s = applyEffect(createState(), { ...speedBuff, duration: 3 });
    s = applyEffect(s, {
      ...speedBuff,
      name: "haste2",
      source: "s2",
      duration: 10,
    });
    const sorted = getEffectsSortedByPriority(s);
    expect(sorted[0].name).toBe("haste");
  });
});

// ── Remaining Duration / Progress ──

describe("getRemainingDuration", () => {
  it("returns remaining time", () => {
    let s = applyEffect(createState(), speedBuff);
    s = tick(s, 2).state;
    expect(getRemainingDuration(s.effects[0])).toBe(3);
  });

  it("never returns negative", () => {
    const s = applyEffect(createState(), { ...speedBuff, duration: 1 });
    const effect = { ...s.effects[0], elapsed: 5 };
    expect(getRemainingDuration(effect)).toBe(0);
  });
});

describe("getEffectProgress", () => {
  it("returns 0 at start", () => {
    const s = applyEffect(createState(), speedBuff);
    expect(getEffectProgress(s.effects[0])).toBe(0);
  });

  it("returns 0.5 at midpoint", () => {
    let s = applyEffect(createState(), { ...speedBuff, duration: 4 });
    s = tick(s, 2).state;
    expect(getEffectProgress(s.effects[0])).toBeCloseTo(0.5);
  });

  it("clamps at 1", () => {
    const effect = {
      ...applyEffect(createState(), speedBuff).effects[0],
      elapsed: 100,
    };
    expect(getEffectProgress(effect)).toBe(1);
  });

  it("returns 1 for zero-duration effect", () => {
    const s = applyEffect(createState(), { ...speedBuff, duration: 0 });
    expect(getEffectProgress(s.effects[0])).toBe(1);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("applyEffect does not mutate input", () => {
    const s = createState();
    applyEffect(s, speedBuff);
    expect(s.effects).toHaveLength(0);
  });

  it("tick does not mutate input", () => {
    const s = applyEffect(createState(), speedBuff);
    tick(s, 1);
    expect(s.effects[0].elapsed).toBe(0);
  });

  it("removeEffect does not mutate input", () => {
    const s = applyEffect(createState(), speedBuff);
    removeEffect(s, "effect_1");
    expect(s.effects).toHaveLength(1);
  });
});
