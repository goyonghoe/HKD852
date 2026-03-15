// ── Tests: EnvironmentHazardCalc ──

import { describe, it, expect } from "vitest";
import {
  createHazardState,
  addHazard,
  removeHazard,
  tick,
  getHazardsAtPoint,
  getDamageAtPoint,
  isPointInHazard,
  getHazardEffect,
  shouldTickDamage,
  getActiveHazardCount,
  clearExpiredHazards,
  getHazardWarningRadius,
} from "../../src/core/EnvironmentHazardCalc";
import type { HazardType } from "../../src/core/EnvironmentHazardCalc";

// ════════════════════════════════════════════════════════════════
// § createHazardState
// ════════════════════════════════════════════════════════════════

describe("createHazardState", () => {
  it("returns empty zones array", () => {
    const s = createHazardState();
    expect(s.zones).toEqual([]);
  });

  it("starts nextId at 1", () => {
    const s = createHazardState();
    expect(s.nextId).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § addHazard
// ════════════════════════════════════════════════════════════════

describe("addHazard", () => {
  it("adds a hazard zone to state", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 100, 200, 50, 20, 500, 5000);
    expect(s.zones).toHaveLength(1);
    expect(s.zones[0].type).toBe("lava");
  });

  it("assigns sequential ids", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 3000);
    expect(s.zones[0].id).toBe("hazard_1");
    expect(s.zones[1].id).toBe("hazard_2");
    expect(s.nextId).toBe(3);
  });

  it("initializes elapsed to 0 and isActive to true", () => {
    let s = createHazardState();
    s = addHazard(s, "poison_fog", 50, 50, 80, 10, 1000, 8000);
    expect(s.zones[0].elapsed).toBe(0);
    expect(s.zones[0].isActive).toBe(true);
  });

  it("preserves all provided parameters", () => {
    let s = createHazardState();
    s = addHazard(s, "lightning", 300, 400, 60, 50, 2000, 10000);
    const z = s.zones[0];
    expect(z.x).toBe(300);
    expect(z.y).toBe(400);
    expect(z.radius).toBe(60);
    expect(z.damage).toBe(50);
    expect(z.tickRateMs).toBe(2000);
    expect(z.duration).toBe(10000);
  });

  it("does not mutate original state", () => {
    const s1 = createHazardState();
    const s2 = addHazard(s1, "lava", 0, 0, 50, 20, 500, 5000);
    expect(s1.zones).toHaveLength(0);
    expect(s2.zones).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § removeHazard
// ════════════════════════════════════════════════════════════════

describe("removeHazard", () => {
  it("removes hazard by id", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = removeHazard(s, "hazard_1");
    expect(s.zones).toHaveLength(0);
  });

  it("does nothing if id not found", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = removeHazard(s, "hazard_999");
    expect(s.zones).toHaveLength(1);
  });

  it("only removes the matching hazard", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 3000);
    s = removeHazard(s, "hazard_1");
    expect(s.zones).toHaveLength(1);
    expect(s.zones[0].id).toBe("hazard_2");
  });
});

// ════════════════════════════════════════════════════════════════
// § tick
// ════════════════════════════════════════════════════════════════

describe("tick", () => {
  it("advances elapsed time", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = tick(s, 100);
    expect(s.zones[0].elapsed).toBe(100);
  });

  it("accumulates elapsed over multiple ticks", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = tick(s, 100);
    s = tick(s, 200);
    expect(s.zones[0].elapsed).toBe(300);
  });

  it("deactivates zone when elapsed >= duration", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 1000);
    s = tick(s, 1000);
    expect(s.zones[0].isActive).toBe(false);
  });

  it("keeps zone active when elapsed < duration", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 1000);
    s = tick(s, 999);
    expect(s.zones[0].isActive).toBe(true);
  });

  it("does not modify already-inactive zones", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 500);
    s = tick(s, 600); // deactivates
    const elapsed1 = s.zones[0].elapsed;
    s = tick(s, 100); // should not change elapsed further
    expect(s.zones[0].elapsed).toBe(elapsed1);
    expect(s.zones[0].isActive).toBe(false);
  });

  it("is immutable — returns new state", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    const before = s;
    const after = tick(s, 100);
    expect(before.zones[0].elapsed).toBe(0);
    expect(after.zones[0].elapsed).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════
// § getHazardsAtPoint
// ════════════════════════════════════════════════════════════════

describe("getHazardsAtPoint", () => {
  it("returns hazards overlapping the point", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 100, 100, 50, 20, 500, 5000);
    const hits = getHazardsAtPoint(s, 120, 120);
    expect(hits).toHaveLength(1);
  });

  it("returns empty when point is outside all hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 100, 100, 50, 20, 500, 5000);
    const hits = getHazardsAtPoint(s, 300, 300);
    expect(hits).toHaveLength(0);
  });

  it("excludes inactive hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 100, 100, 50, 20, 500, 500);
    s = tick(s, 600); // expired
    const hits = getHazardsAtPoint(s, 100, 100);
    expect(hits).toHaveLength(0);
  });

  it("returns multiple overlapping hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 100, 100, 80, 20, 500, 5000);
    s = addHazard(s, "ice_field", 120, 120, 80, 5, 500, 5000);
    const hits = getHazardsAtPoint(s, 110, 110);
    expect(hits).toHaveLength(2);
  });

  it("includes point exactly on boundary", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    // Point at (50, 0) is exactly radius distance away
    const hits = getHazardsAtPoint(s, 50, 0);
    expect(hits).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDamageAtPoint
// ════════════════════════════════════════════════════════════════

describe("getDamageAtPoint", () => {
  it("returns 0 when no hazards overlap", () => {
    const s = createHazardState();
    expect(getDamageAtPoint(s, 100, 100)).toBe(0);
  });

  it("calculates DPS for a single lava zone (20 dmg / 500ms = 40 DPS)", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 100, 20, 500, 5000);
    expect(getDamageAtPoint(s, 0, 0)).toBe(40);
  });

  it("sums DPS from multiple overlapping zones", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 100, 20, 500, 5000); // 40 DPS
    s = addHazard(s, "laser_grid", 0, 0, 100, 30, 300, 5000); // 100 DPS
    expect(getDamageAtPoint(s, 0, 0)).toBe(140);
  });

  it("ignores inactive hazards in DPS calculation", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 100, 20, 500, 200);
    s = tick(s, 300); // expired
    expect(getDamageAtPoint(s, 0, 0)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § isPointInHazard
// ════════════════════════════════════════════════════════════════

describe("isPointInHazard", () => {
  it("returns true when point is inside an active hazard", () => {
    let s = createHazardState();
    s = addHazard(s, "acid_pool", 50, 50, 40, 15, 500, 5000);
    expect(isPointInHazard(s, 50, 50)).toBe(true);
  });

  it("returns false when point is outside all hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "acid_pool", 50, 50, 40, 15, 500, 5000);
    expect(isPointInHazard(s, 200, 200)).toBe(false);
  });

  it("returns false when hazard is inactive", () => {
    let s = createHazardState();
    s = addHazard(s, "acid_pool", 50, 50, 40, 15, 500, 100);
    s = tick(s, 200);
    expect(isPointInHazard(s, 50, 50)).toBe(false);
  });

  it("returns false for empty state", () => {
    expect(isPointInHazard(createHazardState(), 0, 0)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getHazardEffect
// ════════════════════════════════════════════════════════════════

describe("getHazardEffect", () => {
  it("lava: fire damage, 30% slow, 500ms interval", () => {
    const e = getHazardEffect("lava");
    expect(e.damage_type).toBe("fire");
    expect(e.slow_percent).toBe(30);
    expect(e.dot_interval).toBe(500);
  });

  it("poison_fog: poison damage, 0% slow, 1000ms interval", () => {
    const e = getHazardEffect("poison_fog");
    expect(e.damage_type).toBe("poison");
    expect(e.slow_percent).toBe(0);
    expect(e.dot_interval).toBe(1000);
  });

  it("lightning: electric damage, 0% slow, 2000ms interval", () => {
    const e = getHazardEffect("lightning");
    expect(e.damage_type).toBe("electric");
    expect(e.slow_percent).toBe(0);
    expect(e.dot_interval).toBe(2000);
  });

  it("ice_field: cold damage, 50% slow, 500ms interval", () => {
    const e = getHazardEffect("ice_field");
    expect(e.damage_type).toBe("cold");
    expect(e.slow_percent).toBe(50);
    expect(e.dot_interval).toBe(500);
  });

  it("acid_pool: acid damage, 0% slow, 500ms interval", () => {
    const e = getHazardEffect("acid_pool");
    expect(e.damage_type).toBe("acid");
    expect(e.slow_percent).toBe(0);
    expect(e.dot_interval).toBe(500);
  });

  it("laser_grid: energy damage, 0% slow, 300ms interval", () => {
    const e = getHazardEffect("laser_grid");
    expect(e.damage_type).toBe("energy");
    expect(e.slow_percent).toBe(0);
    expect(e.dot_interval).toBe(300);
  });
});

// ════════════════════════════════════════════════════════════════
// § shouldTickDamage
// ════════════════════════════════════════════════════════════════

describe("shouldTickDamage", () => {
  it("returns true when crossing a tick boundary", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    // zone.elapsed = 0, totalElapsed = 500 → crosses from tick 0 to tick 1
    expect(shouldTickDamage(s.zones[0], 500)).toBe(true);
  });

  it("returns false when within the same tick window", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    // zone.elapsed = 0, totalElapsed = 400 → still tick 0
    expect(shouldTickDamage(s.zones[0], 400)).toBe(false);
  });

  it("returns false for inactive zones", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 100);
    s = tick(s, 200); // deactivated
    expect(shouldTickDamage(s.zones[0], 500)).toBe(false);
  });

  it("handles multiple tick crossings", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = tick(s, 400); // elapsed = 400
    // totalElapsed = 1100 → tick 0 → tick 2, crosses boundary
    expect(shouldTickDamage(s.zones[0], 1100)).toBe(true);
  });

  it("returns false when tickRateMs is 0", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 0, 5000);
    expect(shouldTickDamage(s.zones[0], 500)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getActiveHazardCount
// ════════════════════════════════════════════════════════════════

describe("getActiveHazardCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActiveHazardCount(createHazardState())).toBe(0);
  });

  it("counts all active hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 5000);
    expect(getActiveHazardCount(s)).toBe(2);
  });

  it("excludes inactive hazards", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 500);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 5000);
    s = tick(s, 600); // lava expires
    expect(getActiveHazardCount(s)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════
// § clearExpiredHazards
// ════════════════════════════════════════════════════════════════

describe("clearExpiredHazards", () => {
  it("removes inactive hazards from list", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 500);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 5000);
    s = tick(s, 600); // lava expires
    s = clearExpiredHazards(s);
    expect(s.zones).toHaveLength(1);
    expect(s.zones[0].type).toBe("ice_field");
  });

  it("keeps all zones when none are expired", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 5000);
    s = clearExpiredHazards(s);
    expect(s.zones).toHaveLength(1);
  });

  it("returns empty when all are expired", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 100);
    s = addHazard(s, "ice_field", 100, 100, 30, 5, 500, 100);
    s = tick(s, 200);
    s = clearExpiredHazards(s);
    expect(s.zones).toHaveLength(0);
  });

  it("preserves nextId after clearing", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 50, 20, 500, 100);
    s = tick(s, 200);
    s = clearExpiredHazards(s);
    expect(s.nextId).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getHazardWarningRadius
// ════════════════════════════════════════════════════════════════

describe("getHazardWarningRadius", () => {
  it("returns radius * 1.5", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 100, 20, 500, 5000);
    expect(getHazardWarningRadius(s.zones[0])).toBe(150);
  });

  it("handles small radius", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 10, 20, 500, 5000);
    expect(getHazardWarningRadius(s.zones[0])).toBe(15);
  });

  it("handles zero radius", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 0, 0, 0, 20, 500, 5000);
    expect(getHazardWarningRadius(s.zones[0])).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § integration / edge cases
// ════════════════════════════════════════════════════════════════

describe("integration", () => {
  it("full lifecycle: add → tick → query → expire → clear", () => {
    let s = createHazardState();
    s = addHazard(s, "lava", 50, 50, 40, 20, 500, 2000);
    s = addHazard(s, "ice_field", 200, 200, 60, 5, 500, 1000);

    expect(getActiveHazardCount(s)).toBe(2);
    expect(isPointInHazard(s, 50, 50)).toBe(true);

    // Tick past ice_field duration
    s = tick(s, 1200);
    expect(getActiveHazardCount(s)).toBe(1);
    expect(isPointInHazard(s, 200, 200)).toBe(false);

    // Clear expired
    s = clearExpiredHazards(s);
    expect(s.zones).toHaveLength(1);

    // Tick past lava duration
    s = tick(s, 1000);
    expect(getActiveHazardCount(s)).toBe(0);

    s = clearExpiredHazards(s);
    expect(s.zones).toHaveLength(0);
  });

  it("all six hazard types can be created and queried", () => {
    const types: HazardType[] = [
      "lava",
      "poison_fog",
      "lightning",
      "ice_field",
      "acid_pool",
      "laser_grid",
    ];
    let s = createHazardState();
    types.forEach((t, i) => {
      s = addHazard(s, t, i * 200, 0, 50, 10, 500, 5000);
    });
    expect(s.zones).toHaveLength(6);
    expect(getActiveHazardCount(s)).toBe(6);

    // Each type returns valid effect metadata
    types.forEach((t) => {
      const e = getHazardEffect(t);
      expect(e.damage_type).toBeTruthy();
      expect(e.dot_interval).toBeGreaterThan(0);
    });
  });
});
