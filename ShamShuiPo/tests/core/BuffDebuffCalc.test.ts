import { describe, it, expect } from "vitest";
import {
  createState,
  addBuff,
  addDebuff,
  removeBuff,
  removeDebuff,
  tick,
  getBuffMultiplier,
  getDebuffMultiplier,
  getDamageMultiplier,
  getSpeedMultiplier,
  isInvincible,
  isSilenced,
  getActiveBuffCount,
  getActiveDebuffCount,
  clearAllBuffs,
  clearAllDebuffs,
  getDotDamage,
} from "../../src/core/BuffDebuffCalc";

// ── createState ─────────────────────────────────────────────────────

describe("createState", () => {
  it("returns empty state", () => {
    const s = createState();
    expect(s.buffs).toEqual([]);
    expect(s.debuffs).toEqual([]);
    expect(s.nextId).toBe(1);
  });
});

// ── addBuff ─────────────────────────────────────────────────────────

describe("addBuff", () => {
  it("adds a buff and increments nextId", () => {
    const s = addBuff(createState(), "damage_up", 1.5, 5, "relic_A");
    expect(s.buffs).toHaveLength(1);
    expect(s.buffs[0].type).toBe("damage_up");
    expect(s.buffs[0].value).toBe(1.5);
    expect(s.buffs[0].duration).toBe(5);
    expect(s.buffs[0].elapsed).toBe(0);
    expect(s.buffs[0].source).toBe("relic_A");
    expect(s.nextId).toBe(2);
  });

  it("refreshes duration for same type + same source", () => {
    let s = addBuff(createState(), "speed_up", 1.3, 5, "potion");
    s = addBuff(s, "speed_up", 1.2, 8, "potion");
    expect(s.buffs).toHaveLength(1);
    expect(s.buffs[0].duration).toBe(8);
    expect(s.buffs[0].elapsed).toBe(0);
  });

  it("keeps higher value on refresh", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "relic");
    s = addBuff(s, "damage_up", 1.3, 10, "relic");
    expect(s.buffs[0].value).toBe(1.5);
  });

  it("updates value if new is higher on refresh", () => {
    let s = addBuff(createState(), "damage_up", 1.3, 5, "relic");
    s = addBuff(s, "damage_up", 1.8, 10, "relic");
    expect(s.buffs[0].value).toBe(1.8);
  });

  it("stacks same type from different sources", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "relic_A");
    s = addBuff(s, "damage_up", 1.3, 5, "relic_B");
    expect(s.buffs).toHaveLength(2);
  });

  it("caps at 5 buffs of same type", () => {
    let s = createState();
    for (let i = 0; i < 6; i++) {
      s = addBuff(s, "shield", 1.2, 10, `source_${i}`);
    }
    expect(s.buffs.filter((b) => b.type === "shield")).toHaveLength(5);
  });

  it("does not mutate original state", () => {
    const s1 = createState();
    const s2 = addBuff(s1, "regen", 1.1, 3, "passive");
    expect(s1.buffs).toHaveLength(0);
    expect(s2.buffs).toHaveLength(1);
  });

  it("assigns unique ids across multiple adds", () => {
    let s = createState();
    s = addBuff(s, "damage_up", 1.5, 5, "a");
    s = addBuff(s, "speed_up", 1.2, 5, "b");
    expect(s.buffs[0].id).not.toBe(s.buffs[1].id);
  });

  it("allows different buff types without affecting cap", () => {
    let s = createState();
    for (let i = 0; i < 5; i++) {
      s = addBuff(s, "damage_up", 1.1, 5, `src_${i}`);
    }
    s = addBuff(s, "speed_up", 1.2, 5, "src_0");
    expect(getActiveBuffCount(s)).toBe(6);
  });
});

// ── addDebuff ───────────────────────────────────────────────────────

describe("addDebuff", () => {
  it("adds a debuff", () => {
    const s = addDebuff(createState(), "slow", 0.7, 3, "enemy_A");
    expect(s.debuffs).toHaveLength(1);
    expect(s.debuffs[0].type).toBe("slow");
    expect(s.debuffs[0].value).toBe(0.7);
  });

  it("refreshes duration for same type + same source", () => {
    let s = addDebuff(createState(), "weaken", 0.8, 5, "boss");
    s = addDebuff(s, "weaken", 0.6, 10, "boss");
    expect(s.debuffs).toHaveLength(1);
    expect(s.debuffs[0].duration).toBe(10);
    expect(s.debuffs[0].elapsed).toBe(0);
  });

  it("keeps higher value on debuff refresh", () => {
    let s = addDebuff(createState(), "slow", 0.8, 5, "trap");
    s = addDebuff(s, "slow", 0.9, 5, "trap");
    expect(s.debuffs[0].value).toBe(0.9);
  });

  it("caps at 3 debuffs of same type", () => {
    let s = createState();
    for (let i = 0; i < 4; i++) {
      s = addDebuff(s, "dot", 5, 10, `source_${i}`);
    }
    expect(s.debuffs.filter((d) => d.type === "dot")).toHaveLength(3);
  });

  it("does not mutate original state", () => {
    const s1 = createState();
    const s2 = addDebuff(s1, "curse", 0.9, 5, "hex");
    expect(s1.debuffs).toHaveLength(0);
    expect(s2.debuffs).toHaveLength(1);
  });

  it("stacks same type from different sources", () => {
    let s = createState();
    s = addDebuff(s, "slow", 0.8, 5, "ice");
    s = addDebuff(s, "slow", 0.7, 5, "web");
    expect(s.debuffs).toHaveLength(2);
  });
});

// ── removeBuff / removeDebuff ───────────────────────────────────────

describe("removeBuff", () => {
  it("removes buff by id", () => {
    let s = addBuff(createState(), "shield", 1.5, 10, "armor");
    const id = s.buffs[0].id;
    s = removeBuff(s, id);
    expect(s.buffs).toHaveLength(0);
  });

  it("does nothing if id not found", () => {
    const s = addBuff(createState(), "regen", 1.1, 5, "passive");
    const s2 = removeBuff(s, "nonexistent");
    expect(s2.buffs).toHaveLength(1);
  });

  it("only removes the targeted buff", () => {
    let s = createState();
    s = addBuff(s, "damage_up", 1.5, 5, "a");
    s = addBuff(s, "speed_up", 1.3, 5, "b");
    const id = s.buffs[0].id;
    s = removeBuff(s, id);
    expect(s.buffs).toHaveLength(1);
    expect(s.buffs[0].type).toBe("speed_up");
  });
});

describe("removeDebuff", () => {
  it("removes debuff by id", () => {
    let s = addDebuff(createState(), "blind", 0.5, 3, "flash");
    const id = s.debuffs[0].id;
    s = removeDebuff(s, id);
    expect(s.debuffs).toHaveLength(0);
  });

  it("does nothing if id not found", () => {
    const s = addDebuff(createState(), "silence", 0.0, 4, "emp");
    const s2 = removeDebuff(s, "nonexistent");
    expect(s2.debuffs).toHaveLength(1);
  });
});

// ── tick ────────────────────────────────────────────────────────────

describe("tick", () => {
  it("advances elapsed time", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "src");
    s = tick(s, 2);
    expect(s.buffs[0].elapsed).toBe(2);
  });

  it("removes expired buffs", () => {
    let s = addBuff(createState(), "shield", 1.5, 3, "src");
    s = tick(s, 3);
    expect(s.buffs).toHaveLength(0);
  });

  it("removes expired debuffs", () => {
    let s = addDebuff(createState(), "slow", 0.7, 2, "ice");
    s = tick(s, 2);
    expect(s.debuffs).toHaveLength(0);
  });

  it("keeps non-expired entries", () => {
    let s = addBuff(createState(), "regen", 1.1, 10, "src");
    s = addDebuff(s, "dot", 5, 10, "fire");
    s = tick(s, 5);
    expect(s.buffs).toHaveLength(1);
    expect(s.debuffs).toHaveLength(1);
  });

  it("handles multiple ticks accumulating elapsed", () => {
    let s = addBuff(createState(), "invincible", 1.0, 5, "ult");
    s = tick(s, 2);
    s = tick(s, 2);
    expect(s.buffs[0].elapsed).toBe(4);
    s = tick(s, 1);
    expect(s.buffs).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    const s1 = addBuff(createState(), "damage_up", 1.5, 1, "src");
    const s2 = tick(s1, 1);
    expect(s1.buffs).toHaveLength(1);
    expect(s2.buffs).toHaveLength(0);
  });

  it("handles zero dt", () => {
    let s = addBuff(createState(), "shield", 1.5, 5, "src");
    s = tick(s, 0);
    expect(s.buffs).toHaveLength(1);
    expect(s.buffs[0].elapsed).toBe(0);
  });
});

// ── getBuffMultiplier ───────────────────────────────────────────────

describe("getBuffMultiplier", () => {
  it("returns 1.0 with no buffs", () => {
    expect(getBuffMultiplier(createState(), "damage_up")).toBe(1.0);
  });

  it("returns single buff value", () => {
    const s = addBuff(createState(), "damage_up", 1.5, 5, "src");
    expect(getBuffMultiplier(s, "damage_up")).toBe(1.5);
  });

  it("multiplies stacked buffs", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addBuff(s, "damage_up", 1.2, 5, "b");
    expect(getBuffMultiplier(s, "damage_up")).toBeCloseTo(1.8);
  });

  it("ignores other buff types", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addBuff(s, "speed_up", 2.0, 5, "b");
    expect(getBuffMultiplier(s, "damage_up")).toBe(1.5);
  });
});

// ── getDebuffMultiplier ─────────────────────────────────────────────

describe("getDebuffMultiplier", () => {
  it("returns 1.0 with no debuffs", () => {
    expect(getDebuffMultiplier(createState(), "slow")).toBe(1.0);
  });

  it("returns single debuff value", () => {
    const s = addDebuff(createState(), "slow", 0.7, 5, "ice");
    expect(getDebuffMultiplier(s, "slow")).toBe(0.7);
  });

  it("multiplies stacked debuffs", () => {
    let s = addDebuff(createState(), "slow", 0.8, 5, "ice");
    s = addDebuff(s, "slow", 0.9, 5, "web");
    expect(getDebuffMultiplier(s, "slow")).toBeCloseTo(0.72);
  });
});

// ── getDamageMultiplier ─────────────────────────────────────────────

describe("getDamageMultiplier", () => {
  it("returns 1.0 with no effects", () => {
    expect(getDamageMultiplier(createState())).toBe(1.0);
  });

  it("combines damage_up buff only", () => {
    const s = addBuff(createState(), "damage_up", 1.5, 5, "relic");
    expect(getDamageMultiplier(s)).toBe(1.5);
  });

  it("combines weaken debuff only", () => {
    const s = addDebuff(createState(), "weaken", 0.6, 5, "boss");
    expect(getDamageMultiplier(s)).toBe(0.6);
  });

  it("combines buff and debuff multiplicatively", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "relic");
    s = addDebuff(s, "weaken", 0.8, 5, "boss");
    expect(getDamageMultiplier(s)).toBeCloseTo(1.2);
  });
});

// ── getSpeedMultiplier ──────────────────────────────────────────────

describe("getSpeedMultiplier", () => {
  it("returns 1.0 with no effects", () => {
    expect(getSpeedMultiplier(createState())).toBe(1.0);
  });

  it("combines speed_up and slow", () => {
    let s = addBuff(createState(), "speed_up", 1.4, 5, "boots");
    s = addDebuff(s, "slow", 0.5, 5, "ice");
    expect(getSpeedMultiplier(s)).toBeCloseTo(0.7);
  });
});

// ── isInvincible ────────────────────────────────────────────────────

describe("isInvincible", () => {
  it("returns false with no buffs", () => {
    expect(isInvincible(createState())).toBe(false);
  });

  it("returns true when invincible buff active", () => {
    const s = addBuff(createState(), "invincible", 1.0, 3, "ult");
    expect(isInvincible(s)).toBe(true);
  });

  it("returns false after invincible expires", () => {
    let s = addBuff(createState(), "invincible", 1.0, 3, "ult");
    s = tick(s, 3);
    expect(isInvincible(s)).toBe(false);
  });
});

// ── isSilenced ──────────────────────────────────────────────────────

describe("isSilenced", () => {
  it("returns false with no debuffs", () => {
    expect(isSilenced(createState())).toBe(false);
  });

  it("returns true when silence active", () => {
    const s = addDebuff(createState(), "silence", 0.0, 4, "emp");
    expect(isSilenced(s)).toBe(true);
  });

  it("returns false after silence expires", () => {
    let s = addDebuff(createState(), "silence", 0.0, 2, "emp");
    s = tick(s, 2);
    expect(isSilenced(s)).toBe(false);
  });
});

// ── getActiveBuffCount / getActiveDebuffCount ───────────────────────

describe("getActiveBuffCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActiveBuffCount(createState())).toBe(0);
  });

  it("counts all active buffs", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addBuff(s, "shield", 1.2, 5, "b");
    s = addBuff(s, "regen", 1.1, 5, "c");
    expect(getActiveBuffCount(s)).toBe(3);
  });
});

describe("getActiveDebuffCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActiveDebuffCount(createState())).toBe(0);
  });

  it("counts all active debuffs", () => {
    let s = addDebuff(createState(), "slow", 0.7, 5, "a");
    s = addDebuff(s, "dot", 5, 5, "b");
    expect(getActiveDebuffCount(s)).toBe(2);
  });
});

// ── clearAllBuffs / clearAllDebuffs ─────────────────────────────────

describe("clearAllBuffs", () => {
  it("removes all buffs", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addBuff(s, "shield", 1.2, 5, "b");
    s = clearAllBuffs(s);
    expect(s.buffs).toHaveLength(0);
  });

  it("preserves debuffs", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addDebuff(s, "slow", 0.7, 5, "b");
    s = clearAllBuffs(s);
    expect(s.buffs).toHaveLength(0);
    expect(s.debuffs).toHaveLength(1);
  });

  it("does not mutate original", () => {
    const s1 = addBuff(createState(), "regen", 1.1, 5, "a");
    const s2 = clearAllBuffs(s1);
    expect(s1.buffs).toHaveLength(1);
    expect(s2.buffs).toHaveLength(0);
  });
});

describe("clearAllDebuffs", () => {
  it("removes all debuffs", () => {
    let s = addDebuff(createState(), "slow", 0.7, 5, "a");
    s = addDebuff(s, "dot", 5, 5, "b");
    s = clearAllDebuffs(s);
    expect(s.debuffs).toHaveLength(0);
  });

  it("preserves buffs", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "a");
    s = addDebuff(s, "curse", 0.9, 5, "b");
    s = clearAllDebuffs(s);
    expect(s.buffs).toHaveLength(1);
    expect(s.debuffs).toHaveLength(0);
  });
});

// ── getDotDamage ────────────────────────────────────────────────────

describe("getDotDamage", () => {
  it("returns 0 with no dots", () => {
    expect(getDotDamage(createState())).toBe(0);
  });

  it("returns single dot value", () => {
    const s = addDebuff(createState(), "dot", 10, 5, "fire");
    expect(getDotDamage(s)).toBe(10);
  });

  it("sums multiple dot sources", () => {
    let s = addDebuff(createState(), "dot", 10, 5, "fire");
    s = addDebuff(s, "dot", 5, 5, "poison");
    expect(getDotDamage(s)).toBe(15);
  });

  it("ignores non-dot debuffs", () => {
    let s = addDebuff(createState(), "dot", 10, 5, "fire");
    s = addDebuff(s, "slow", 0.7, 5, "ice");
    expect(getDotDamage(s)).toBe(10);
  });
});

// ── Integration / Edge Cases ────────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: add, tick, expire, query", () => {
    let s = createState();
    s = addBuff(s, "damage_up", 1.5, 3, "relic");
    s = addDebuff(s, "slow", 0.7, 5, "ice");
    expect(getDamageMultiplier(s)).toBe(1.5);
    expect(getSpeedMultiplier(s)).toBe(0.7);

    s = tick(s, 3);
    expect(getActiveBuffCount(s)).toBe(0);
    expect(getActiveDebuffCount(s)).toBe(1);
    expect(getDamageMultiplier(s)).toBe(1.0);
    expect(getSpeedMultiplier(s)).toBe(0.7);

    s = tick(s, 2);
    expect(getActiveDebuffCount(s)).toBe(0);
    expect(getSpeedMultiplier(s)).toBe(1.0);
  });

  it("nextId increments correctly across buff and debuff adds", () => {
    let s = createState();
    s = addBuff(s, "damage_up", 1.5, 5, "a");
    s = addDebuff(s, "slow", 0.7, 5, "b");
    s = addBuff(s, "shield", 1.2, 5, "c");
    expect(s.nextId).toBe(4);
  });

  it("refresh does not increment nextId", () => {
    let s = addBuff(createState(), "damage_up", 1.5, 5, "relic");
    const id1 = s.nextId;
    s = addBuff(s, "damage_up", 1.3, 10, "relic");
    expect(s.nextId).toBe(id1);
  });

  it("debuff cap does not increment nextId", () => {
    let s = createState();
    for (let i = 0; i < 3; i++) {
      s = addDebuff(s, "dot", 5, 10, `s${i}`);
    }
    const idBefore = s.nextId;
    s = addDebuff(s, "dot", 5, 10, "s_overflow");
    expect(s.nextId).toBe(idBefore);
  });

  it("mixed buff types and debuff types coexist", () => {
    let s = createState();
    s = addBuff(s, "damage_up", 1.5, 10, "a");
    s = addBuff(s, "speed_up", 1.3, 10, "b");
    s = addBuff(s, "invincible", 1.0, 3, "c");
    s = addDebuff(s, "slow", 0.8, 10, "d");
    s = addDebuff(s, "dot", 5, 10, "e");
    s = addDebuff(s, "silence", 0.0, 2, "f");

    expect(getActiveBuffCount(s)).toBe(3);
    expect(getActiveDebuffCount(s)).toBe(3);
    expect(isInvincible(s)).toBe(true);
    expect(isSilenced(s)).toBe(true);
    expect(getDotDamage(s)).toBe(5);

    s = tick(s, 2);
    expect(isSilenced(s)).toBe(false);
    expect(isInvincible(s)).toBe(true);

    s = tick(s, 1);
    expect(isInvincible(s)).toBe(false);
  });

  it("clearing buffs then adding new ones works", () => {
    let s = addBuff(createState(), "damage_up", 2.0, 5, "old");
    s = clearAllBuffs(s);
    s = addBuff(s, "damage_up", 1.3, 5, "new");
    expect(getActiveBuffCount(s)).toBe(1);
    expect(getBuffMultiplier(s, "damage_up")).toBe(1.3);
  });

  it("three multiplicative stacks compute correctly", () => {
    let s = createState();
    s = addBuff(s, "fire_rate_up", 1.2, 10, "a");
    s = addBuff(s, "fire_rate_up", 1.3, 10, "b");
    s = addBuff(s, "fire_rate_up", 1.1, 10, "c");
    expect(getBuffMultiplier(s, "fire_rate_up")).toBeCloseTo(1.716);
  });
});
