import { describe, it, expect } from "vitest";
import {
  createBeamState,
  startBeam,
  updateBeam,
  getDamageThisFrame,
  getBeamEndPoint,
  getEnemiesInBeam,
  stopBeam,
  isActive,
  isFiring,
  getPhaseProgress,
  setAngle,
  getStats,
} from "../../src/core/BeamCalc";

// ─── createBeamState ────────────────────────────────────────────────

describe("createBeamState", () => {
  it("returns default chargeTime of 500", () => {
    const s = createBeamState();
    expect(s.config.chargeTime).toBe(500);
  });

  it("returns default maxSustainTime of 3000", () => {
    const s = createBeamState();
    expect(s.config.maxSustainTime).toBe(3000);
  });

  it("returns default overheatCooldown of 2000", () => {
    const s = createBeamState();
    expect(s.config.overheatCooldown).toBe(2000);
  });

  it("returns default dps of 30", () => {
    const s = createBeamState();
    expect(s.config.dps).toBe(30);
  });

  it("returns default width of 8", () => {
    const s = createBeamState();
    expect(s.config.width).toBe(8);
  });

  it("returns default range of 400", () => {
    const s = createBeamState();
    expect(s.config.range).toBe(400);
  });

  it("starts in idle phase", () => {
    const s = createBeamState();
    expect(s.phase).toBe("idle");
  });

  it("starts with zero elapsed", () => {
    const s = createBeamState();
    expect(s.elapsed).toBe(0);
  });

  it("starts with zero angle", () => {
    const s = createBeamState();
    expect(s.angle).toBe(0);
  });

  it("starts with zero totalDamageDealt", () => {
    const s = createBeamState();
    expect(s.totalDamageDealt).toBe(0);
  });

  it("starts with zero totalFireTime", () => {
    const s = createBeamState();
    expect(s.totalFireTime).toBe(0);
  });

  it("overrides partial config", () => {
    const s = createBeamState({ dps: 60, width: 16 });
    expect(s.config.dps).toBe(60);
    expect(s.config.width).toBe(16);
    expect(s.config.chargeTime).toBe(500);
  });

  it("does not mutate defaults when overriding", () => {
    createBeamState({ dps: 999 });
    const s2 = createBeamState();
    expect(s2.config.dps).toBe(30);
  });
});

// ─── startBeam ──────────────────────────────────────────────────────

describe("startBeam", () => {
  it("transitions from idle to charging", () => {
    const s = startBeam(createBeamState(), 1.0);
    expect(s.phase).toBe("charging");
  });

  it("sets the angle", () => {
    const s = startBeam(createBeamState(), 1.5);
    expect(s.angle).toBe(1.5);
  });

  it("resets elapsed to 0", () => {
    const s = startBeam(createBeamState(), 0);
    expect(s.elapsed).toBe(0);
  });

  it("does nothing if already charging", () => {
    const s1 = startBeam(createBeamState(), 1.0);
    const s2 = startBeam(s1, 2.0);
    expect(s2).toBe(s1);
  });

  it("does nothing if firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500); // finish charge
    expect(s.phase).toBe("firing");
    const s2 = startBeam(s, 2.0);
    expect(s2).toBe(s);
  });

  it("does nothing if overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500); // charge done
    s = updateBeam(s, 3000); // sustain done → overheated
    expect(s.phase).toBe("overheated");
    const s2 = startBeam(s, 1.0);
    expect(s2).toBe(s);
  });
});

// ─── updateBeam ─────────────────────────────────────────────────────

describe("updateBeam", () => {
  it("returns same state when idle", () => {
    const s = createBeamState();
    const s2 = updateBeam(s, 100);
    expect(s2).toBe(s);
  });

  it("advances elapsed during charging", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 200);
    expect(s.phase).toBe("charging");
    expect(s.elapsed).toBe(200);
  });

  it("transitions from charging to firing at chargeTime", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    expect(s.phase).toBe("firing");
    expect(s.elapsed).toBe(0);
  });

  it("handles overflow from charging to firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 600); // 500 charge + 100 overflow
    expect(s.phase).toBe("firing");
    expect(s.elapsed).toBe(100);
  });

  it("advances elapsed during firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 1000);
    expect(s.phase).toBe("firing");
    expect(s.elapsed).toBe(1000);
  });

  it("accumulates damage during firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500); // charge done
    s = updateBeam(s, 1000); // fire 1s at 30 dps
    expect(s.totalDamageDealt).toBeCloseTo(30);
  });

  it("accumulates totalFireTime during firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 1000);
    expect(s.totalFireTime).toBe(1000);
  });

  it("transitions from firing to overheated at maxSustainTime", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    expect(s.phase).toBe("overheated");
    expect(s.elapsed).toBe(0);
  });

  it("handles overflow from firing to overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3200); // 3000 sustain + 200 overflow
    expect(s.phase).toBe("overheated");
    expect(s.elapsed).toBe(200);
  });

  it("transitions from overheated to idle at overheatCooldown", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500); // charge
    s = updateBeam(s, 3000); // fire → overheat
    s = updateBeam(s, 2000); // cooldown
    expect(s.phase).toBe("idle");
    expect(s.elapsed).toBe(0);
  });

  it("advances elapsed during overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    s = updateBeam(s, 500);
    expect(s.phase).toBe("overheated");
    expect(s.elapsed).toBe(500);
  });

  it("full lifecycle: idle→charge→fire→overheat→idle", () => {
    let s = createBeamState();
    expect(s.phase).toBe("idle");
    s = startBeam(s, 0);
    s = updateBeam(s, 500);
    expect(s.phase).toBe("firing");
    s = updateBeam(s, 3000);
    expect(s.phase).toBe("overheated");
    s = updateBeam(s, 2000);
    expect(s.phase).toBe("idle");
  });

  it("does not deal damage during charging", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 300);
    expect(s.totalDamageDealt).toBe(0);
  });

  it("does not deal damage during overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    const dmgAtOverheat = s.totalDamageDealt;
    s = updateBeam(s, 1000);
    expect(s.totalDamageDealt).toBe(dmgAtOverheat);
  });

  it("accumulates damage across multiple firing updates", () => {
    let s = startBeam(createBeamState({ dps: 100 }), 0);
    s = updateBeam(s, 500); // charge
    s = updateBeam(s, 500); // 0.5s at 100dps = 50
    s = updateBeam(s, 500); // another 50
    expect(s.totalDamageDealt).toBeCloseTo(100);
  });
});

// ─── getDamageThisFrame ─────────────────────────────────────────────

describe("getDamageThisFrame", () => {
  it("returns 0 when idle", () => {
    const s = createBeamState();
    expect(getDamageThisFrame(s, 100)).toBe(0);
  });

  it("returns 0 when charging", () => {
    const s = startBeam(createBeamState(), 0);
    expect(getDamageThisFrame(s, 100)).toBe(0);
  });

  it("returns dps * deltaMs/1000 when firing", () => {
    let s = startBeam(createBeamState({ dps: 60 }), 0);
    s = updateBeam(s, 500);
    expect(s.phase).toBe("firing");
    expect(getDamageThisFrame(s, 500)).toBeCloseTo(30);
  });

  it("returns 0 when overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    expect(s.phase).toBe("overheated");
    expect(getDamageThisFrame(s, 100)).toBe(0);
  });

  it("scales linearly with deltaMs", () => {
    let s = startBeam(createBeamState({ dps: 100 }), 0);
    s = updateBeam(s, 500);
    expect(getDamageThisFrame(s, 1000)).toBeCloseTo(100);
    expect(getDamageThisFrame(s, 100)).toBeCloseTo(10);
  });
});

// ─── getBeamEndPoint ────────────────────────────────────────────────

describe("getBeamEndPoint", () => {
  it("calculates endpoint at angle 0 (right)", () => {
    const ep = getBeamEndPoint(100, 200, 0, 400);
    expect(ep.x).toBeCloseTo(500);
    expect(ep.y).toBeCloseTo(200);
  });

  it("calculates endpoint at angle PI/2 (down)", () => {
    const ep = getBeamEndPoint(100, 200, Math.PI / 2, 400);
    expect(ep.x).toBeCloseTo(100);
    expect(ep.y).toBeCloseTo(600);
  });

  it("calculates endpoint at angle PI (left)", () => {
    const ep = getBeamEndPoint(100, 200, Math.PI, 300);
    expect(ep.x).toBeCloseTo(-200);
    expect(ep.y).toBeCloseTo(200);
  });

  it("handles zero range", () => {
    const ep = getBeamEndPoint(50, 50, 1.0, 0);
    expect(ep.x).toBeCloseTo(50);
    expect(ep.y).toBeCloseTo(50);
  });

  it("handles negative angle", () => {
    const ep = getBeamEndPoint(0, 0, -Math.PI / 2, 100);
    expect(ep.x).toBeCloseTo(0);
    expect(ep.y).toBeCloseTo(-100);
  });
});

// ─── getEnemiesInBeam ───────────────────────────────────────────────

describe("getEnemiesInBeam", () => {
  it("returns empty array when no enemies", () => {
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, []);
    expect(result).toEqual([]);
  });

  it("detects enemy directly in beam path", () => {
    const enemies = [{ id: "e1", x: 200, y: 0 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([{ id: "e1" }]);
  });

  it("excludes enemy outside beam width", () => {
    const enemies = [{ id: "e1", x: 200, y: 50 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([]);
  });

  it("excludes enemy beyond beam range", () => {
    const enemies = [{ id: "e1", x: 500, y: 0 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([]);
  });

  it("excludes enemy behind beam start", () => {
    const enemies = [{ id: "e1", x: -100, y: 0 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([]);
  });

  it("includes enemy within beam width boundary", () => {
    const enemies = [{ id: "e1", x: 200, y: 4 }]; // exactly at halfWidth
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([{ id: "e1" }]);
  });

  it("filters multiple enemies correctly", () => {
    const enemies = [
      { id: "e1", x: 100, y: 0 }, // in beam
      { id: "e2", x: 200, y: 50 }, // outside
      { id: "e3", x: 300, y: 2 }, // in beam
    ];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result).toEqual([{ id: "e1" }, { id: "e3" }]);
  });

  it("works with angled beam", () => {
    // Beam pointing down (PI/2), enemy directly below
    const enemies = [{ id: "e1", x: 0, y: 200 }];
    const result = getEnemiesInBeam(0, 0, Math.PI / 2, 400, 8, enemies);
    expect(result).toEqual([{ id: "e1" }]);
  });

  it("returns only id in results", () => {
    const enemies = [{ id: "e1", x: 100, y: 0 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 8, enemies);
    expect(result[0]).toEqual({ id: "e1" });
    expect(Object.keys(result[0])).toEqual(["id"]);
  });

  it("works with wide beam", () => {
    const enemies = [{ id: "e1", x: 200, y: 25 }];
    const result = getEnemiesInBeam(0, 0, 0, 400, 60, enemies);
    expect(result).toEqual([{ id: "e1" }]);
  });
});

// ─── stopBeam ───────────────────────────────────────────────────────

describe("stopBeam", () => {
  it("returns same state when already idle", () => {
    const s = createBeamState();
    expect(stopBeam(s)).toBe(s);
  });

  it("stops from charging", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 200);
    const stopped = stopBeam(s);
    expect(stopped.phase).toBe("idle");
    expect(stopped.elapsed).toBe(0);
  });

  it("stops from firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 1000);
    const stopped = stopBeam(s);
    expect(stopped.phase).toBe("idle");
  });

  it("stops from overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    const stopped = stopBeam(s);
    expect(stopped.phase).toBe("idle");
  });
});

// ─── isActive ───────────────────────────────────────────────────────

describe("isActive", () => {
  it("returns false when idle", () => {
    expect(isActive(createBeamState())).toBe(false);
  });

  it("returns true when charging", () => {
    const s = startBeam(createBeamState(), 0);
    expect(isActive(s)).toBe(true);
  });

  it("returns true when firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    expect(isActive(s)).toBe(true);
  });

  it("returns false when overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    expect(isActive(s)).toBe(false);
  });
});

// ─── isFiring ───────────────────────────────────────────────────────

describe("isFiring", () => {
  it("returns false when idle", () => {
    expect(isFiring(createBeamState())).toBe(false);
  });

  it("returns false when charging", () => {
    const s = startBeam(createBeamState(), 0);
    expect(isFiring(s)).toBe(false);
  });

  it("returns true when firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    expect(isFiring(s)).toBe(true);
  });

  it("returns false when overheated", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    expect(isFiring(s)).toBe(false);
  });
});

// ─── getPhaseProgress ───────────────────────────────────────────────

describe("getPhaseProgress", () => {
  it("returns 0 when idle", () => {
    expect(getPhaseProgress(createBeamState())).toBe(0);
  });

  it("returns 0.5 at half charge", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 250); // 250 / 500
    expect(getPhaseProgress(s)).toBeCloseTo(0.5);
  });

  it("returns 0 at start of firing", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    expect(getPhaseProgress(s)).toBe(0);
  });

  it("returns ~0.5 at half sustain", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 1500); // 1500 / 3000
    expect(getPhaseProgress(s)).toBeCloseTo(0.5);
  });

  it("returns ~0.5 at half overheat cooldown", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 500);
    s = updateBeam(s, 3000);
    s = updateBeam(s, 1000); // 1000 / 2000
    expect(getPhaseProgress(s)).toBeCloseTo(0.5);
  });

  it("never exceeds 1", () => {
    let s = startBeam(createBeamState(), 0);
    s = updateBeam(s, 499);
    expect(getPhaseProgress(s)).toBeLessThanOrEqual(1);
  });
});

// ─── setAngle ───────────────────────────────────────────────────────

describe("setAngle", () => {
  it("updates angle", () => {
    const s = setAngle(createBeamState(), 2.5);
    expect(s.angle).toBe(2.5);
  });

  it("does not mutate original state", () => {
    const s1 = createBeamState();
    const s2 = setAngle(s1, 3.14);
    expect(s1.angle).toBe(0);
    expect(s2.angle).toBe(3.14);
  });

  it("preserves other state fields", () => {
    let s = startBeam(createBeamState(), 1.0);
    s = updateBeam(s, 500);
    const s2 = setAngle(s, 2.0);
    expect(s2.phase).toBe("firing");
    expect(s2.elapsed).toBe(0);
    expect(s2.angle).toBe(2.0);
  });
});

// ─── getStats ───────────────────────────────────────────────────────

describe("getStats", () => {
  it("returns zeros for fresh state", () => {
    const stats = getStats(createBeamState());
    expect(stats.totalDamageDealt).toBe(0);
    expect(stats.totalFireTime).toBe(0);
    expect(stats.averageDPS).toBe(0);
  });

  it("returns correct averageDPS after firing", () => {
    let s = startBeam(createBeamState({ dps: 60 }), 0);
    s = updateBeam(s, 500); // charge
    s = updateBeam(s, 2000); // fire 2s at 60dps = 120 dmg
    const stats = getStats(s);
    expect(stats.totalDamageDealt).toBeCloseTo(120);
    expect(stats.totalFireTime).toBe(2000);
    expect(stats.averageDPS).toBeCloseTo(60);
  });

  it("averageDPS is 0 when totalFireTime is 0", () => {
    const s = startBeam(createBeamState(), 0);
    const stats = getStats(s);
    expect(stats.averageDPS).toBe(0);
  });
});

// ─── immutability ───────────────────────────────────────────────────

describe("immutability", () => {
  it("startBeam returns a new object", () => {
    const s1 = createBeamState();
    const s2 = startBeam(s1, 0);
    expect(s1).not.toBe(s2);
  });

  it("updateBeam returns a new object when state changes", () => {
    const s1 = startBeam(createBeamState(), 0);
    const s2 = updateBeam(s1, 100);
    expect(s1).not.toBe(s2);
  });

  it("stopBeam returns a new object when not idle", () => {
    const s1 = startBeam(createBeamState(), 0);
    const s2 = stopBeam(s1);
    expect(s1).not.toBe(s2);
  });

  it("original state unchanged after multiple operations", () => {
    const original = createBeamState();
    startBeam(original, 1.0);
    setAngle(original, 2.0);
    expect(original.phase).toBe("idle");
    expect(original.angle).toBe(0);
  });
});
