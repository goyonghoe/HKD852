import { describe, it, expect, beforeEach } from "vitest";
import {
  createSummonState,
  spawnSummon,
  updateSummons,
  damageSummon,
  canAttack,
  recordAttack,
  getActiveSummons,
  getSummonCount,
  canSpawn,
  removeSummon,
  clearSummons,
  healSummon,
  SummonState,
} from "../../src/core/SummonCalc";

// ── createSummonState ──────────────────────────────────────────────

describe("createSummonState", () => {
  it("returns default config when no args", () => {
    const s = createSummonState();
    expect(s.config.maxSummons).toBe(3);
    expect(s.config.baseDamage).toBe(10);
    expect(s.config.baseHP).toBe(30);
    expect(s.config.duration).toBe(10_000);
    expect(s.config.attackSpeed).toBe(1.0);
    expect(s.config.moveSpeed).toBe(100);
  });

  it("starts with empty summons array", () => {
    const s = createSummonState();
    expect(s.summons).toEqual([]);
  });

  it("merges partial config overrides", () => {
    const s = createSummonState({ maxSummons: 5, baseDamage: 20 });
    expect(s.config.maxSummons).toBe(5);
    expect(s.config.baseDamage).toBe(20);
    expect(s.config.baseHP).toBe(30); // default preserved
  });

  it("accepts duration=0 for permanent summons", () => {
    const s = createSummonState({ duration: 0 });
    expect(s.config.duration).toBe(0);
  });

  it("accepts custom attackSpeed", () => {
    const s = createSummonState({ attackSpeed: 2.5 });
    expect(s.config.attackSpeed).toBe(2.5);
  });

  it("accepts custom moveSpeed", () => {
    const s = createSummonState({ moveSpeed: 200 });
    expect(s.config.moveSpeed).toBe(200);
  });
});

// ── spawnSummon ────────────────────────────────────────────────────

describe("spawnSummon", () => {
  let state: SummonState;
  beforeEach(() => {
    state = createSummonState();
  });

  it("creates a summon at given position", () => {
    const s = spawnSummon(state, 100, 200);
    expect(s.summons).toHaveLength(1);
    expect(s.summons[0].x).toBe(100);
    expect(s.summons[0].y).toBe(200);
  });

  it("uses config baseDamage and baseHP", () => {
    const s = spawnSummon(state, 0, 0);
    expect(s.summons[0].damage).toBe(10);
    expect(s.summons[0].hp).toBe(30);
    expect(s.summons[0].maxHp).toBe(30);
  });

  it("sets age to 0", () => {
    const s = spawnSummon(state, 0, 0);
    expect(s.summons[0].age).toBe(0);
  });

  it("sets active to true", () => {
    const s = spawnSummon(state, 0, 0);
    expect(s.summons[0].active).toBe(true);
  });

  it("sets attackCooldown to 0", () => {
    const s = spawnSummon(state, 0, 0);
    expect(s.summons[0].attackCooldown).toBe(0);
  });

  it("assigns unique ids", () => {
    let s = spawnSummon(state, 0, 0);
    s = spawnSummon(s, 10, 10);
    expect(s.summons[0].id).not.toBe(s.summons[1].id);
  });

  it("does not exceed maxSummons", () => {
    const s1 = createSummonState({ maxSummons: 2 });
    let s = spawnSummon(s1, 0, 0);
    s = spawnSummon(s, 1, 1);
    s = spawnSummon(s, 2, 2); // should be ignored
    expect(s.summons).toHaveLength(2);
  });

  it("returns same state when at max", () => {
    const s1 = createSummonState({ maxSummons: 1 });
    let s = spawnSummon(s1, 0, 0);
    const before = s;
    s = spawnSummon(s, 1, 1);
    expect(s).toBe(before);
  });

  it("uses config duration", () => {
    const s = spawnSummon(state, 0, 0);
    expect(s.summons[0].duration).toBe(10_000);
  });

  it("does not mutate original state", () => {
    const original = createSummonState();
    spawnSummon(original, 0, 0);
    expect(original.summons).toHaveLength(0);
  });

  it("can spawn after inactive summon frees a slot", () => {
    const s1 = createSummonState({ maxSummons: 1, duration: 100 });
    let s = spawnSummon(s1, 0, 0);
    s = updateSummons(s, 200); // expire it
    s = spawnSummon(s, 5, 5);
    expect(getActiveSummons(s)).toHaveLength(1);
  });
});

// ── updateSummons ──────────────────────────────────────────────────

describe("updateSummons", () => {
  it("advances age by deltaMs", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = updateSummons(s, 500);
    expect(s.summons[0].age).toBe(500);
  });

  it("accumulates age across multiple updates", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = updateSummons(s, 100);
    s = updateSummons(s, 200);
    expect(s.summons[0].age).toBe(300);
  });

  it("reduces attackCooldown by deltaMs", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    const cd = s.summons[0].attackCooldown;
    s = updateSummons(s, 300);
    expect(s.summons[0].attackCooldown).toBe(cd - 300);
  });

  it("clamps attackCooldown to 0", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    s = updateSummons(s, 99999);
    expect(s.summons[0].attackCooldown).toBe(0);
  });

  it("deactivates summon when age >= duration", () => {
    let s = spawnSummon(createSummonState({ duration: 1000 }), 0, 0);
    s = updateSummons(s, 1000);
    expect(s.summons[0].active).toBe(false);
  });

  it("deactivates summon when age exceeds duration", () => {
    let s = spawnSummon(createSummonState({ duration: 500 }), 0, 0);
    s = updateSummons(s, 800);
    expect(s.summons[0].active).toBe(false);
  });

  it("does not deactivate permanent summons (duration=0)", () => {
    let s = spawnSummon(createSummonState({ duration: 0 }), 0, 0);
    s = updateSummons(s, 999_999);
    expect(s.summons[0].active).toBe(true);
  });

  it("does not modify inactive summons", () => {
    let s = spawnSummon(createSummonState({ duration: 100 }), 0, 0);
    s = updateSummons(s, 200); // deactivate
    const ageBefore = s.summons[0].age;
    s = updateSummons(s, 500);
    expect(s.summons[0].age).toBe(ageBefore); // unchanged
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const copy = s;
    updateSummons(s, 100);
    expect(copy.summons[0].age).toBe(0);
  });
});

// ── damageSummon ───────────────────────────────────────────────────

describe("damageSummon", () => {
  it("reduces HP by damage amount", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 10);
    expect(s.summons[0].hp).toBe(20);
  });

  it("deactivates summon when HP reaches 0", () => {
    let s = spawnSummon(createSummonState({ baseHP: 10 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 10);
    expect(s.summons[0].hp).toBe(0);
    expect(s.summons[0].active).toBe(false);
  });

  it("deactivates summon when HP goes below 0", () => {
    let s = spawnSummon(createSummonState({ baseHP: 5 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 100);
    expect(s.summons[0].active).toBe(false);
  });

  it("ignores damage to non-existent id", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const before = s;
    s = damageSummon(s, "nonexistent", 10);
    expect(s.summons[0].hp).toBe(before.summons[0].hp);
  });

  it("does not damage inactive summons", () => {
    let s = spawnSummon(createSummonState({ baseHP: 10 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 10); // kill it
    s = damageSummon(s, id, 5); // should be no-op
    expect(s.summons[0].hp).toBe(0);
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    const original = s;
    damageSummon(s, id, 5);
    expect(original.summons[0].hp).toBe(30);
  });
});

// ── canAttack ──────────────────────────────────────────────────────

describe("canAttack", () => {
  it("returns true when cooldown is 0 and active", () => {
    const s = spawnSummon(createSummonState(), 0, 0);
    expect(canAttack(s.summons[0])).toBe(true);
  });

  it("returns false when cooldown > 0", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    expect(canAttack(s.summons[0])).toBe(false);
  });

  it("returns false when inactive", () => {
    let s = spawnSummon(createSummonState({ baseHP: 1 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 5);
    expect(canAttack(s.summons[0])).toBe(false);
  });

  it("returns true after cooldown expires via update", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    s = updateSummons(s, 2000); // 1000ms cooldown at 1.0 aps
    expect(canAttack(s.summons[0])).toBe(true);
  });
});

// ── recordAttack ───────────────────────────────────────────────────

describe("recordAttack", () => {
  it("sets attackCooldown based on attackSpeed", () => {
    let s = spawnSummon(createSummonState({ attackSpeed: 2.0 }), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    expect(s.summons[0].attackCooldown).toBe(500); // 1000/2.0
  });

  it("sets cooldown to 1000 for 1.0 attackSpeed", () => {
    let s = spawnSummon(createSummonState({ attackSpeed: 1.0 }), 0, 0);
    s = recordAttack(s, s.summons[0].id);
    expect(s.summons[0].attackCooldown).toBe(1000);
  });

  it("does not affect other summons", () => {
    const st = createSummonState({ maxSummons: 3 });
    let s = spawnSummon(st, 0, 0);
    s = spawnSummon(s, 1, 1);
    s = recordAttack(s, s.summons[0].id);
    expect(s.summons[1].attackCooldown).toBe(0);
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const original = s;
    recordAttack(s, s.summons[0].id);
    expect(original.summons[0].attackCooldown).toBe(0);
  });
});

// ── getActiveSummons ───────────────────────────────────────────────

describe("getActiveSummons", () => {
  it("returns empty for fresh state", () => {
    expect(getActiveSummons(createSummonState())).toEqual([]);
  });

  it("returns only active summons", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 3, baseHP: 5 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    s = damageSummon(s, s.summons[0].id, 100); // kill first
    const active = getActiveSummons(s);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(s.summons[1].id);
  });

  it("returns all when all active", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 3 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    expect(getActiveSummons(s)).toHaveLength(2);
  });
});

// ── getSummonCount ─────────────────────────────────────────────────

describe("getSummonCount", () => {
  it("returns 0 for empty state", () => {
    expect(getSummonCount(createSummonState())).toBe(0);
  });

  it("counts only active summons", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 3, baseHP: 5 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    s = damageSummon(s, s.summons[0].id, 100);
    expect(getSummonCount(s)).toBe(1);
  });

  it("counts all active summons", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 5 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    s = spawnSummon(s, 2, 2);
    expect(getSummonCount(s)).toBe(3);
  });
});

// ── canSpawn ───────────────────────────────────────────────────────

describe("canSpawn", () => {
  it("returns true when no summons", () => {
    expect(canSpawn(createSummonState())).toBe(true);
  });

  it("returns false when at max", () => {
    const st = createSummonState({ maxSummons: 1 });
    const s = spawnSummon(st, 0, 0);
    expect(canSpawn(s)).toBe(false);
  });

  it("returns true when inactive summons free slots", () => {
    const st = createSummonState({ maxSummons: 1, baseHP: 1 });
    let s = spawnSummon(st, 0, 0);
    s = damageSummon(s, s.summons[0].id, 10);
    expect(canSpawn(s)).toBe(true);
  });

  it("returns true when below max", () => {
    const st = createSummonState({ maxSummons: 3 });
    let s = spawnSummon(st, 0, 0);
    s = spawnSummon(s, 1, 1);
    expect(canSpawn(s)).toBe(true);
  });
});

// ── removeSummon ───────────────────────────────────────────────────

describe("removeSummon", () => {
  it("removes summon by id", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    s = removeSummon(s, id);
    expect(s.summons).toHaveLength(0);
  });

  it("does not affect other summons", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 3 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    const idToRemove = s.summons[0].id;
    const idToKeep = s.summons[1].id;
    s = removeSummon(s, idToRemove);
    expect(s.summons).toHaveLength(1);
    expect(s.summons[0].id).toBe(idToKeep);
  });

  it("no-op for non-existent id", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = removeSummon(s, "nope");
    expect(s.summons).toHaveLength(1);
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const original = s;
    removeSummon(s, s.summons[0].id);
    expect(original.summons).toHaveLength(1);
  });
});

// ── clearSummons ───────────────────────────────────────────────────

describe("clearSummons", () => {
  it("removes all summons", () => {
    let s = spawnSummon(createSummonState({ maxSummons: 3 }), 0, 0);
    s = spawnSummon(s, 1, 1);
    s = spawnSummon(s, 2, 2);
    s = clearSummons(s);
    expect(s.summons).toHaveLength(0);
  });

  it("works on already empty state", () => {
    const s = clearSummons(createSummonState());
    expect(s.summons).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const original = s;
    clearSummons(s);
    expect(original.summons).toHaveLength(1);
  });
});

// ── healSummon ─────────────────────────────────────────────────────

describe("healSummon", () => {
  it("heals summon by amount", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 15);
    s = healSummon(s, id, 10);
    expect(s.summons[0].hp).toBe(25);
  });

  it("caps healing at maxHp", () => {
    let s = spawnSummon(createSummonState({ baseHP: 30 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 5);
    s = healSummon(s, id, 100);
    expect(s.summons[0].hp).toBe(30);
  });

  it("does not heal inactive summons", () => {
    let s = spawnSummon(createSummonState({ baseHP: 5 }), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 10); // kills it
    s = healSummon(s, id, 50);
    expect(s.summons[0].active).toBe(false);
  });

  it("no-op for non-existent id", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    s = damageSummon(s, s.summons[0].id, 10);
    const hpBefore = s.summons[0].hp;
    s = healSummon(s, "nope", 100);
    expect(s.summons[0].hp).toBe(hpBefore);
  });

  it("healing at full HP has no effect", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    s = healSummon(s, id, 50);
    expect(s.summons[0].hp).toBe(30);
  });

  it("does not mutate original state", () => {
    let s = spawnSummon(createSummonState(), 0, 0);
    const id = s.summons[0].id;
    s = damageSummon(s, id, 10);
    const original = s;
    healSummon(s, id, 5);
    expect(original.summons[0].hp).toBe(20);
  });
});

// ── Integration scenarios ──────────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: spawn → attack → damage → heal → expire", () => {
    let s = createSummonState({ duration: 5000, attackSpeed: 2.0 });
    s = spawnSummon(s, 100, 200);
    const id = s.summons[0].id;

    // can attack immediately
    expect(canAttack(s.summons[0])).toBe(true);
    s = recordAttack(s, id);
    expect(canAttack(s.summons[0])).toBe(false);

    // advance time to recover cooldown (500ms for 2.0 aps)
    s = updateSummons(s, 500);
    expect(canAttack(s.summons[0])).toBe(true);

    // take damage
    s = damageSummon(s, id, 20);
    expect(s.summons[0].hp).toBe(10);

    // heal
    s = healSummon(s, id, 15);
    expect(s.summons[0].hp).toBe(25);

    // advance to expiration
    s = updateSummons(s, 4500); // total age = 5000
    expect(s.summons[0].active).toBe(false);
  });

  it("spawn multiple and selectively remove", () => {
    let s = createSummonState({ maxSummons: 3 });
    s = spawnSummon(s, 0, 0);
    s = spawnSummon(s, 10, 10);
    s = spawnSummon(s, 20, 20);
    expect(getSummonCount(s)).toBe(3);
    expect(canSpawn(s)).toBe(false);

    s = removeSummon(s, s.summons[1].id);
    expect(getSummonCount(s)).toBe(2);
    expect(canSpawn(s)).toBe(true);

    s = spawnSummon(s, 30, 30);
    expect(getSummonCount(s)).toBe(3);
  });

  it("permanent summons survive indefinitely", () => {
    let s = createSummonState({ duration: 0 });
    s = spawnSummon(s, 0, 0);
    s = updateSummons(s, 1_000_000);
    expect(s.summons[0].active).toBe(true);
    expect(s.summons[0].age).toBe(1_000_000);
  });

  it("config with high attackSpeed yields low cooldown", () => {
    let s = createSummonState({ attackSpeed: 10 });
    s = spawnSummon(s, 0, 0);
    s = recordAttack(s, s.summons[0].id);
    expect(s.summons[0].attackCooldown).toBe(100); // 1000/10
  });

  it("damage exactly equal to HP deactivates", () => {
    let s = spawnSummon(createSummonState({ baseHP: 25 }), 0, 0);
    s = damageSummon(s, s.summons[0].id, 25);
    expect(s.summons[0].hp).toBe(0);
    expect(s.summons[0].active).toBe(false);
  });
});
