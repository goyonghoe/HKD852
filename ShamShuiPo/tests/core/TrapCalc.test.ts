import { describe, it, expect } from "vitest";
import {
  type TrapType,
  type Trap,
  createTrapState,
  deployTrap,
  updateTraps,
  checkTrigger,
  triggerTrap,
  getArmedTraps,
  getTriggeredTraps,
  removeTrap,
  clearTraps,
  getTrapCount,
  getTrapsInRange,
} from "../../src/core/TrapCalc";

// ── createTrapState ─────────────────────────────────────────────────

describe("createTrapState", () => {
  it("returns empty traps array", () => {
    const s = createTrapState();
    expect(s.traps).toEqual([]);
  });

  it("defaults maxTraps to 10", () => {
    const s = createTrapState();
    expect(s.maxTraps).toBe(10);
  });

  it("accepts custom maxTraps", () => {
    const s = createTrapState(5);
    expect(s.maxTraps).toBe(5);
  });

  it("starts nextId at 1", () => {
    const s = createTrapState();
    expect(s.nextId).toBe(1);
  });
});

// ── deployTrap ──────────────────────────────────────────────────────

describe("deployTrap", () => {
  it("adds a trap to state", () => {
    const s = deployTrap(createTrapState(), "mine", 100, 200, 50);
    expect(s.traps).toHaveLength(1);
  });

  it("assigns auto-incremented id", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    expect(s.traps[0].id).toBe("trap_1");
    s = deployTrap(s, "spike", 0, 0, 10);
    expect(s.traps[1].id).toBe("trap_2");
  });

  it("increments nextId", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    expect(s.nextId).toBe(2);
    s = deployTrap(s, "spike", 0, 0, 10);
    expect(s.nextId).toBe(3);
  });

  it("sets correct type", () => {
    const types: TrapType[] = ["mine", "spike", "slow", "stun", "electric"];
    for (const type of types) {
      const s = deployTrap(createTrapState(), type, 0, 0, 10);
      expect(s.traps[0].type).toBe(type);
    }
  });

  it("sets position correctly", () => {
    const s = deployTrap(createTrapState(), "mine", 123, 456, 10);
    expect(s.traps[0].x).toBe(123);
    expect(s.traps[0].y).toBe(456);
  });

  it("sets damage correctly", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 75);
    expect(s.traps[0].damage).toBe(75);
  });

  it("defaults radius to 50", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].radius).toBe(50);
  });

  it("accepts custom radius", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10, 80);
    expect(s.traps[0].radius).toBe(80);
  });

  it("defaults lifetime to 15000", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].lifetime).toBe(15000);
  });

  it("accepts custom lifetime", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10, 50, 20000);
    expect(s.traps[0].lifetime).toBe(20000);
  });

  it("defaults duration to 2000", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].duration).toBe(2000);
  });

  it("accepts custom duration", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10, 50, 15000, 5000);
    expect(s.traps[0].duration).toBe(5000);
  });

  it("trap starts armed", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].armed).toBe(true);
  });

  it("trap starts not triggered", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].triggered).toBe(false);
  });

  it("trap starts with elapsed 0", () => {
    const s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(s.traps[0].elapsed).toBe(0);
  });

  it("removes oldest when max exceeded", () => {
    let s = createTrapState(2);
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = deployTrap(s, "slow", 2, 2, 30);
    expect(s.traps).toHaveLength(2);
    expect(s.traps[0].id).toBe("trap_2");
    expect(s.traps[1].id).toBe("trap_3");
  });

  it("does not remove when at max (not exceeding)", () => {
    let s = createTrapState(2);
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    expect(s.traps).toHaveLength(2);
  });

  it("does not mutate original state", () => {
    const s1 = createTrapState();
    const s2 = deployTrap(s1, "mine", 0, 0, 10);
    expect(s1.traps).toHaveLength(0);
    expect(s2.traps).toHaveLength(1);
  });
});

// ── updateTraps ─────────────────────────────────────────────────────

describe("updateTraps", () => {
  it("advances elapsed time", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = updateTraps(s, 500);
    expect(s.traps[0].elapsed).toBe(500);
  });

  it("accumulates elapsed across updates", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = updateTraps(s, 300);
    s = updateTraps(s, 200);
    expect(s.traps[0].elapsed).toBe(500);
  });

  it("removes traps past lifetime", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10, 50, 1000);
    s = updateTraps(s, 1000);
    expect(s.traps).toHaveLength(0);
  });

  it("keeps traps below lifetime", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10, 50, 1000);
    s = updateTraps(s, 999);
    expect(s.traps).toHaveLength(1);
  });

  it("removes only expired traps from mix", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10, 50, 500);
    s = deployTrap(s, "spike", 1, 1, 20, 50, 2000);
    s = updateTraps(s, 600);
    expect(s.traps).toHaveLength(1);
    expect(s.traps[0].type).toBe("spike");
  });

  it("handles empty state", () => {
    const s = updateTraps(createTrapState(), 1000);
    expect(s.traps).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    let s1 = deployTrap(createTrapState(), "mine", 0, 0, 10);
    const s2 = updateTraps(s1, 500);
    expect(s1.traps[0].elapsed).toBe(0);
    expect(s2.traps[0].elapsed).toBe(500);
  });
});

// ── checkTrigger ────────────────────────────────────────────────────

describe("checkTrigger", () => {
  const baseTrap: Trap = {
    id: "trap_1",
    type: "mine",
    x: 100,
    y: 100,
    radius: 50,
    damage: 30,
    duration: 2000,
    armed: true,
    triggered: false,
    lifetime: 15000,
    elapsed: 0,
  };

  it("returns true when enemy is within radius", () => {
    expect(checkTrigger(baseTrap, 110, 110)).toBe(true);
  });

  it("returns true when enemy is exactly at trap position", () => {
    expect(checkTrigger(baseTrap, 100, 100)).toBe(true);
  });

  it("returns true when enemy is exactly at radius boundary", () => {
    expect(checkTrigger(baseTrap, 150, 100)).toBe(true);
  });

  it("returns false when enemy is outside radius", () => {
    expect(checkTrigger(baseTrap, 200, 200)).toBe(false);
  });

  it("returns false when trap is not armed", () => {
    const disarmed = { ...baseTrap, armed: false };
    expect(checkTrigger(disarmed, 100, 100)).toBe(false);
  });

  it("returns false when trap is already triggered", () => {
    const triggered = { ...baseTrap, triggered: true, armed: false };
    expect(checkTrigger(triggered, 100, 100)).toBe(false);
  });

  it("uses Euclidean distance", () => {
    // 30-40-50 triangle: distance = 50 = radius, should trigger
    expect(checkTrigger(baseTrap, 130, 140)).toBe(true);
    // just past radius
    expect(checkTrigger(baseTrap, 131, 140)).toBe(false);
  });
});

// ── triggerTrap ─────────────────────────────────────────────────────

describe("triggerTrap", () => {
  it("sets triggered to true", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = triggerTrap(s, "trap_1");
    expect(s.traps[0].triggered).toBe(true);
  });

  it("sets armed to false", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = triggerTrap(s, "trap_1");
    expect(s.traps[0].armed).toBe(false);
  });

  it("only affects the targeted trap", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = triggerTrap(s, "trap_1");
    expect(s.traps[0].triggered).toBe(true);
    expect(s.traps[1].armed).toBe(true);
    expect(s.traps[1].triggered).toBe(false);
  });

  it("does nothing if id not found", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    const s2 = triggerTrap(s, "nonexistent");
    expect(s2.traps[0].armed).toBe(true);
    expect(s2.traps[0].triggered).toBe(false);
  });

  it("does not mutate original state", () => {
    const s1 = deployTrap(createTrapState(), "mine", 0, 0, 10);
    const s2 = triggerTrap(s1, "trap_1");
    expect(s1.traps[0].armed).toBe(true);
    expect(s2.traps[0].armed).toBe(false);
  });
});

// ── getArmedTraps ───────────────────────────────────────────────────

describe("getArmedTraps", () => {
  it("returns armed, non-triggered traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    expect(getArmedTraps(s)).toHaveLength(2);
  });

  it("excludes triggered traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = triggerTrap(s, "trap_1");
    const armed = getArmedTraps(s);
    expect(armed).toHaveLength(1);
    expect(armed[0].id).toBe("trap_2");
  });

  it("returns empty for no armed traps", () => {
    const s = createTrapState();
    expect(getArmedTraps(s)).toHaveLength(0);
  });
});

// ── getTriggeredTraps ───────────────────────────────────────────────

describe("getTriggeredTraps", () => {
  it("returns only triggered traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = triggerTrap(s, "trap_1");
    const triggered = getTriggeredTraps(s);
    expect(triggered).toHaveLength(1);
    expect(triggered[0].id).toBe("trap_1");
  });

  it("returns empty when none triggered", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    expect(getTriggeredTraps(s)).toHaveLength(0);
  });

  it("returns multiple triggered traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = triggerTrap(s, "trap_1");
    s = triggerTrap(s, "trap_2");
    expect(getTriggeredTraps(s)).toHaveLength(2);
  });
});

// ── removeTrap ──────────────────────────────────────────────────────

describe("removeTrap", () => {
  it("removes trap by id", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = removeTrap(s, "trap_1");
    expect(s.traps).toHaveLength(0);
  });

  it("does not affect other traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = removeTrap(s, "trap_1");
    expect(s.traps).toHaveLength(1);
    expect(s.traps[0].id).toBe("trap_2");
  });

  it("does nothing if id not found", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = removeTrap(s, "nonexistent");
    expect(s.traps).toHaveLength(1);
  });

  it("does not mutate original state", () => {
    const s1 = deployTrap(createTrapState(), "mine", 0, 0, 10);
    const s2 = removeTrap(s1, "trap_1");
    expect(s1.traps).toHaveLength(1);
    expect(s2.traps).toHaveLength(0);
  });
});

// ── clearTraps ──────────────────────────────────────────────────────

describe("clearTraps", () => {
  it("removes all traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = clearTraps(s);
    expect(s.traps).toHaveLength(0);
  });

  it("preserves maxTraps", () => {
    let s = createTrapState(5);
    s = deployTrap(s, "mine", 0, 0, 10);
    s = clearTraps(s);
    expect(s.maxTraps).toBe(5);
  });

  it("preserves nextId", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = clearTraps(s);
    expect(s.nextId).toBe(2);
  });

  it("works on empty state", () => {
    const s = clearTraps(createTrapState());
    expect(s.traps).toHaveLength(0);
  });
});

// ── getTrapCount ────────────────────────────────────────────────────

describe("getTrapCount", () => {
  it("returns 0 for empty state", () => {
    expect(getTrapCount(createTrapState())).toBe(0);
  });

  it("returns correct count", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    expect(getTrapCount(s)).toBe(2);
  });

  it("includes triggered traps", () => {
    let s = deployTrap(createTrapState(), "mine", 0, 0, 10);
    s = triggerTrap(s, "trap_1");
    expect(getTrapCount(s)).toBe(1);
  });

  it("decreases after removal", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = removeTrap(s, "trap_1");
    expect(getTrapCount(s)).toBe(1);
  });
});

// ── getTrapsInRange ─────────────────────────────────────────────────

describe("getTrapsInRange", () => {
  it("returns armed traps within range", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 100, 100, 10);
    s = deployTrap(s, "spike", 110, 110, 20);
    const result = getTrapsInRange(s, 105, 105, 50);
    expect(result).toHaveLength(2);
  });

  it("excludes traps outside range", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 100, 100, 10);
    s = deployTrap(s, "spike", 500, 500, 20);
    const result = getTrapsInRange(s, 100, 100, 50);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("mine");
  });

  it("excludes triggered traps", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 100, 100, 10);
    s = triggerTrap(s, "trap_1");
    const result = getTrapsInRange(s, 100, 100, 50);
    expect(result).toHaveLength(0);
  });

  it("includes traps exactly at range boundary", () => {
    let s = deployTrap(createTrapState(), "mine", 100, 100, 10);
    // distance = 50 exactly
    const result = getTrapsInRange(s, 150, 100, 50);
    expect(result).toHaveLength(1);
  });

  it("returns empty for empty state", () => {
    expect(getTrapsInRange(createTrapState(), 0, 0, 100)).toHaveLength(0);
  });

  it("returns empty when no armed traps in range", () => {
    let s = deployTrap(createTrapState(), "mine", 1000, 1000, 10);
    expect(getTrapsInRange(s, 0, 0, 50)).toHaveLength(0);
  });
});

// ── Integration scenarios ───────────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: deploy → trigger → update → expire", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 100, 100, 50, 40, 3000, 1500);
    expect(getTrapCount(s)).toBe(1);
    expect(getArmedTraps(s)).toHaveLength(1);

    // enemy walks over
    expect(checkTrigger(s.traps[0], 110, 110)).toBe(true);
    s = triggerTrap(s, "trap_1");
    expect(getArmedTraps(s)).toHaveLength(0);
    expect(getTriggeredTraps(s)).toHaveLength(1);

    // time passes, trap expires
    s = updateTraps(s, 3000);
    expect(getTrapCount(s)).toBe(0);
  });

  it("max traps rotation", () => {
    let s = createTrapState(3);
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = deployTrap(s, "slow", 2, 2, 30);
    s = deployTrap(s, "stun", 3, 3, 40);
    s = deployTrap(s, "electric", 4, 4, 50);

    expect(getTrapCount(s)).toBe(3);
    expect(s.traps[0].id).toBe("trap_3");
    expect(s.traps[1].id).toBe("trap_4");
    expect(s.traps[2].id).toBe("trap_5");
  });

  it("deploy after clear resets traps but keeps nextId", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10);
    s = deployTrap(s, "spike", 1, 1, 20);
    s = clearTraps(s);
    s = deployTrap(s, "slow", 2, 2, 30);
    expect(getTrapCount(s)).toBe(1);
    expect(s.traps[0].id).toBe("trap_3");
  });

  it("getTrapsInRange ignores non-armed after trigger", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 100, 100, 10);
    s = deployTrap(s, "spike", 105, 105, 20);
    s = triggerTrap(s, "trap_1");
    const inRange = getTrapsInRange(s, 100, 100, 200);
    expect(inRange).toHaveLength(1);
    expect(inRange[0].id).toBe("trap_2");
  });

  it("mixed expiry and trigger state", () => {
    let s = createTrapState();
    s = deployTrap(s, "mine", 0, 0, 10, 50, 500);
    s = deployTrap(s, "spike", 1, 1, 20, 50, 2000);
    s = triggerTrap(s, "trap_2");
    s = updateTraps(s, 600);
    // mine expired, spike still present (triggered but not expired)
    expect(getTrapCount(s)).toBe(1);
    expect(s.traps[0].id).toBe("trap_2");
    expect(s.traps[0].triggered).toBe(true);
  });
});
