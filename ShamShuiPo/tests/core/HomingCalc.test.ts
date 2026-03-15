import { describe, it, expect } from "vitest";
import {
  createHomingConfig,
  createHomingProjectile,
  acquireTarget,
  updateHoming,
  updateHomingNoTarget,
  getDesiredAngle,
  turnToward,
  isExpired,
  loseTarget,
  getPosition,
} from "../../src/core/HomingCalc";

// ════════════════════════════════════════════════════════════════
// § createHomingConfig
// ════════════════════════════════════════════════════════════════

describe("createHomingConfig", () => {
  it("returns default values when no overrides", () => {
    const cfg = createHomingConfig();
    expect(cfg.turnRate).toBe(3.0);
    expect(cfg.acquisitionRange).toBe(400);
    expect(cfg.lockOnDelay).toBe(200);
    expect(cfg.maxLifetime).toBe(5000);
  });

  it("overrides turnRate", () => {
    const cfg = createHomingConfig({ turnRate: 5.0 });
    expect(cfg.turnRate).toBe(5.0);
    expect(cfg.acquisitionRange).toBe(400);
  });

  it("overrides acquisitionRange", () => {
    const cfg = createHomingConfig({ acquisitionRange: 800 });
    expect(cfg.acquisitionRange).toBe(800);
  });

  it("overrides lockOnDelay", () => {
    const cfg = createHomingConfig({ lockOnDelay: 0 });
    expect(cfg.lockOnDelay).toBe(0);
  });

  it("overrides maxLifetime", () => {
    const cfg = createHomingConfig({ maxLifetime: 10000 });
    expect(cfg.maxLifetime).toBe(10000);
  });

  it("overrides multiple fields at once", () => {
    const cfg = createHomingConfig({
      turnRate: 1,
      acquisitionRange: 100,
      lockOnDelay: 50,
      maxLifetime: 2000,
    });
    expect(cfg.turnRate).toBe(1);
    expect(cfg.acquisitionRange).toBe(100);
    expect(cfg.lockOnDelay).toBe(50);
    expect(cfg.maxLifetime).toBe(2000);
  });

  it("empty overrides returns defaults", () => {
    const cfg = createHomingConfig({});
    expect(cfg.turnRate).toBe(3.0);
    expect(cfg.maxLifetime).toBe(5000);
  });
});

// ════════════════════════════════════════════════════════════════
// § createHomingProjectile
// ════════════════════════════════════════════════════════════════

describe("createHomingProjectile", () => {
  it("creates a projectile with correct id, position, angle, speed", () => {
    const p = createHomingProjectile("p1", 100, 200, Math.PI / 4, 300);
    expect(p.id).toBe("p1");
    expect(p.x).toBe(100);
    expect(p.y).toBe(200);
    expect(p.angle).toBeCloseTo(Math.PI / 4);
    expect(p.speed).toBe(300);
  });

  it("starts with no target", () => {
    const p = createHomingProjectile("p1", 0, 0, 0, 100);
    expect(p.targetId).toBeNull();
  });

  it("starts with elapsed = 0", () => {
    const p = createHomingProjectile("p1", 0, 0, 0, 100);
    expect(p.elapsed).toBe(0);
  });

  it("starts unlocked", () => {
    const p = createHomingProjectile("p1", 0, 0, 0, 100);
    expect(p.locked).toBe(false);
  });

  it("starts active", () => {
    const p = createHomingProjectile("p1", 0, 0, 0, 100);
    expect(p.active).toBe(true);
  });

  it("handles zero speed", () => {
    const p = createHomingProjectile("z", 50, 50, 0, 0);
    expect(p.speed).toBe(0);
  });

  it("handles negative angle", () => {
    const p = createHomingProjectile("neg", 0, 0, -Math.PI, 100);
    expect(p.angle).toBeCloseTo(-Math.PI);
  });
});

// ════════════════════════════════════════════════════════════════
// § acquireTarget
// ════════════════════════════════════════════════════════════════

describe("acquireTarget", () => {
  const cfg = createHomingConfig({ acquisitionRange: 200 });

  it("acquires the closest target in range", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    const targets = [
      { id: "far", x: 150, y: 0 },
      { id: "close", x: 50, y: 0 },
    ];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBe("close");
  });

  it("ignores targets outside acquisitionRange", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    const targets = [{ id: "far", x: 500, y: 0 }];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBeNull();
  });

  it("returns unchanged projectile if no targets", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    const result = acquireTarget(p, [], cfg);
    expect(result).toBe(p);
  });

  it("acquires target exactly at range boundary", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    const targets = [{ id: "edge", x: 200, y: 0 }];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBe("edge");
  });

  it("does not acquire if projectile is inactive", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 100), active: false };
    const targets = [{ id: "e1", x: 10, y: 0 }];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBeNull();
  });

  it("picks correct closest among many targets", () => {
    const p = createHomingProjectile("p", 100, 100, 0, 100);
    const targets = [
      { id: "a", x: 200, y: 100 }, // dist 100
      { id: "b", x: 130, y: 100 }, // dist 30
      { id: "c", x: 150, y: 100 }, // dist 50
    ];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBe("b");
  });

  it("considers diagonal distance correctly", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    // distance = sqrt(150^2 + 150^2) ≈ 212, outside 200 range
    const targets = [{ id: "diag", x: 150, y: 150 }];
    const result = acquireTarget(p, targets, cfg);
    expect(result.targetId).toBeNull();
  });

  it("does not change other projectile properties", () => {
    const p = createHomingProjectile("p", 10, 20, 1.5, 200);
    const targets = [{ id: "e", x: 30, y: 20 }];
    const result = acquireTarget(p, targets, cfg);
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.angle).toBe(1.5);
    expect(result.speed).toBe(200);
    expect(result.elapsed).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getDesiredAngle
// ════════════════════════════════════════════════════════════════

describe("getDesiredAngle", () => {
  it("returns 0 when target is directly right", () => {
    expect(getDesiredAngle(0, 0, 100, 0)).toBeCloseTo(0);
  });

  it("returns PI/2 when target is directly below", () => {
    expect(getDesiredAngle(0, 0, 0, 100)).toBeCloseTo(Math.PI / 2);
  });

  it("returns PI or -PI when target is directly left", () => {
    const angle = getDesiredAngle(0, 0, -100, 0);
    expect(Math.abs(angle)).toBeCloseTo(Math.PI);
  });

  it("returns -PI/2 when target is directly above", () => {
    expect(getDesiredAngle(0, 0, 0, -100)).toBeCloseTo(-Math.PI / 2);
  });

  it("returns PI/4 for diagonal down-right", () => {
    expect(getDesiredAngle(0, 0, 100, 100)).toBeCloseTo(Math.PI / 4);
  });

  it("handles same point (0,0)", () => {
    expect(getDesiredAngle(5, 5, 5, 5)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § turnToward
// ════════════════════════════════════════════════════════════════

describe("turnToward", () => {
  it("snaps to desired angle if diff < maxTurn", () => {
    const result = turnToward(0, 0.05, 0.1);
    expect(result).toBeCloseTo(0.05);
  });

  it("clamps turn to maxTurn when diff is larger", () => {
    const result = turnToward(0, Math.PI / 2, 0.1);
    expect(result).toBeCloseTo(0.1);
  });

  it("turns counter-clockwise for negative diff", () => {
    const result = turnToward(0, -Math.PI / 2, 0.1);
    expect(result).toBeCloseTo(-0.1);
  });

  it("takes shortest path across PI boundary (positive)", () => {
    // current = 3.0, desired = -3.0 → shortest is clockwise (positive direction wrapping around)
    const result = turnToward(3.0, -3.0, 0.1);
    // diff = -3.0 - 3.0 = -6.0, normalized → ~0.283, so turn right by 0.1
    expect(result).toBeCloseTo(3.1);
  });

  it("takes shortest path across PI boundary (negative)", () => {
    const result = turnToward(-3.0, 3.0, 0.1);
    expect(result).toBeCloseTo(-3.1);
  });

  it("returns desired if current equals desired", () => {
    const result = turnToward(1.5, 1.5, 0.1);
    expect(result).toBeCloseTo(1.5);
  });

  it("handles maxTurn of zero", () => {
    const result = turnToward(0, 1, 0);
    expect(result).toBeCloseTo(0);
  });

  it("handles full PI turn needed", () => {
    const result = turnToward(0, Math.PI, 0.5);
    // diff = PI, |PI| > 0.5, so clamp
    expect(result).toBeCloseTo(0.5);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateHoming
// ════════════════════════════════════════════════════════════════

describe("updateHoming", () => {
  const cfg = createHomingConfig({
    turnRate: 3.0,
    lockOnDelay: 200,
    maxLifetime: 5000,
  });

  it("advances elapsed time", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 300);
    const result = updateHoming(p, 100, 0, 16, cfg);
    expect(result.elapsed).toBe(16);
  });

  it("moves projectile forward", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 300);
    const result = updateHoming(p, 100, 0, 1000, cfg);
    // angle 0, speed 300, 1 second → x += 300
    expect(result.x).toBeCloseTo(300);
    expect(result.y).toBeCloseTo(0);
  });

  it("does not turn before lockOnDelay", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 300);
    // target is above, but elapsed will be 100ms < 200ms lockOnDelay
    const result = updateHoming(p, 0, -1000, 100, cfg);
    expect(result.angle).toBeCloseTo(0); // no turn
    expect(result.locked).toBe(false);
  });

  it("sets locked=true after lockOnDelay", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 300);
    const result = updateHoming(p, 100, 0, 200, cfg);
    expect(result.locked).toBe(true);
  });

  it("turns toward target after lockOnDelay", () => {
    // Start facing right, target is above. After lock-on, should turn upward.
    const p = { ...createHomingProjectile("p", 0, 0, 0, 300), elapsed: 200 };
    const result = updateHoming(p, 0, -100, 100, cfg);
    expect(result.locked).toBe(true);
    // desired angle is -PI/2, turnRate=3 rad/s, delta=0.1s → maxTurn=0.3
    expect(result.angle).toBeCloseTo(-0.3);
  });

  it("returns unchanged if inactive", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 300), active: false };
    const result = updateHoming(p, 100, 100, 100, cfg);
    expect(result).toBe(p);
  });

  it("accumulates elapsed across multiple updates", () => {
    let p = createHomingProjectile("p", 0, 0, 0, 100);
    p = updateHoming(p, 100, 0, 50, cfg);
    p = updateHoming(p, 100, 0, 50, cfg);
    p = updateHoming(p, 100, 0, 50, cfg);
    expect(p.elapsed).toBe(150);
  });

  it("moves position correctly at angle PI/2", () => {
    const p = createHomingProjectile("p", 0, 0, Math.PI / 2, 200);
    const result = updateHoming(p, 0, 1000, 500, cfg);
    // Before lock (elapsed=500 >= 200 lockOn), it will turn, but initially angle=PI/2 moving down
    expect(result.y).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § updateHomingNoTarget
// ════════════════════════════════════════════════════════════════

describe("updateHomingNoTarget", () => {
  const cfg = createHomingConfig();

  it("moves straight along current angle", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 200);
    const result = updateHomingNoTarget(p, 500, cfg);
    expect(result.x).toBeCloseTo(100); // 200 * 0.5s
    expect(result.y).toBeCloseTo(0);
  });

  it("advances elapsed", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 200);
    const result = updateHomingNoTarget(p, 300, cfg);
    expect(result.elapsed).toBe(300);
  });

  it("does not change angle", () => {
    const p = createHomingProjectile("p", 0, 0, 1.23, 200);
    const result = updateHomingNoTarget(p, 100, cfg);
    expect(result.angle).toBeCloseTo(1.23);
  });

  it("returns unchanged if inactive", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 200), active: false };
    const result = updateHomingNoTarget(p, 100, cfg);
    expect(result).toBe(p);
  });

  it("moves correctly at angle PI", () => {
    const p = createHomingProjectile("p", 100, 0, Math.PI, 100);
    const result = updateHomingNoTarget(p, 1000, cfg);
    expect(result.x).toBeCloseTo(0); // moved left 100
    expect(result.y).toBeCloseTo(0);
  });

  it("moves diagonally at PI/4", () => {
    const p = createHomingProjectile("p", 0, 0, Math.PI / 4, 100);
    const result = updateHomingNoTarget(p, 1000, cfg);
    const expected = 100 * Math.cos(Math.PI / 4);
    expect(result.x).toBeCloseTo(expected);
    expect(result.y).toBeCloseTo(expected);
  });
});

// ════════════════════════════════════════════════════════════════
// § isExpired
// ════════════════════════════════════════════════════════════════

describe("isExpired", () => {
  const cfg = createHomingConfig({ maxLifetime: 5000 });

  it("returns false when elapsed < maxLifetime", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 100), elapsed: 4999 };
    expect(isExpired(p, cfg)).toBe(false);
  });

  it("returns true when elapsed === maxLifetime", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 100), elapsed: 5000 };
    expect(isExpired(p, cfg)).toBe(true);
  });

  it("returns true when elapsed > maxLifetime", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 100), elapsed: 6000 };
    expect(isExpired(p, cfg)).toBe(true);
  });

  it("returns true at elapsed=0 if maxLifetime=0", () => {
    const zeroCfg = createHomingConfig({ maxLifetime: 0 });
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    expect(isExpired(p, zeroCfg)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════
// § loseTarget
// ════════════════════════════════════════════════════════════════

describe("loseTarget", () => {
  it("clears targetId", () => {
    const p = { ...createHomingProjectile("p", 0, 0, 0, 100), targetId: "e1" };
    const result = loseTarget(p);
    expect(result.targetId).toBeNull();
  });

  it("sets locked to false", () => {
    const p = {
      ...createHomingProjectile("p", 0, 0, 0, 100),
      targetId: "e1",
      locked: true,
    };
    const result = loseTarget(p);
    expect(result.locked).toBe(false);
  });

  it("preserves position", () => {
    const p = {
      ...createHomingProjectile("p", 77, 88, 0, 100),
      targetId: "e1",
    };
    const result = loseTarget(p);
    expect(result.x).toBe(77);
    expect(result.y).toBe(88);
  });

  it("preserves angle and speed", () => {
    const p = {
      ...createHomingProjectile("p", 0, 0, 2.0, 500),
      targetId: "e1",
    };
    const result = loseTarget(p);
    expect(result.angle).toBeCloseTo(2.0);
    expect(result.speed).toBe(500);
  });

  it("is no-op on already null targetId", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    const result = loseTarget(p);
    expect(result.targetId).toBeNull();
    expect(result.locked).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════
// § getPosition
// ════════════════════════════════════════════════════════════════

describe("getPosition", () => {
  it("returns x and y", () => {
    const p = createHomingProjectile("p", 123, 456, 0, 100);
    const pos = getPosition(p);
    expect(pos.x).toBe(123);
    expect(pos.y).toBe(456);
  });

  it("returns updated position after movement", () => {
    const cfg = createHomingConfig();
    let p = createHomingProjectile("p", 0, 0, 0, 200);
    p = updateHomingNoTarget(p, 1000, cfg);
    const pos = getPosition(p);
    expect(pos.x).toBeCloseTo(200);
    expect(pos.y).toBeCloseTo(0);
  });

  it("returns only x and y (no extra fields)", () => {
    const p = createHomingProjectile("p", 10, 20, 0, 100);
    const pos = getPosition(p);
    expect(Object.keys(pos).sort()).toEqual(["x", "y"]);
  });
});

// ════════════════════════════════════════════════════════════════
// § Integration / immutability
// ════════════════════════════════════════════════════════════════

describe("integration & immutability", () => {
  const cfg = createHomingConfig({
    turnRate: 3.0,
    acquisitionRange: 400,
    lockOnDelay: 200,
    maxLifetime: 5000,
  });

  it("original projectile is not mutated by acquireTarget", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    acquireTarget(p, [{ id: "e", x: 50, y: 0 }], cfg);
    expect(p.targetId).toBeNull();
  });

  it("original projectile is not mutated by updateHoming", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    updateHoming(p, 100, 0, 100, cfg);
    expect(p.x).toBe(0);
    expect(p.elapsed).toBe(0);
  });

  it("original projectile is not mutated by updateHomingNoTarget", () => {
    const p = createHomingProjectile("p", 0, 0, 0, 100);
    updateHomingNoTarget(p, 100, cfg);
    expect(p.x).toBe(0);
  });

  it("original projectile is not mutated by loseTarget", () => {
    const p = {
      ...createHomingProjectile("p", 0, 0, 0, 100),
      targetId: "e1",
      locked: true,
    };
    loseTarget(p);
    expect(p.targetId).toBe("e1");
    expect(p.locked).toBe(true);
  });

  it("full lifecycle: create → acquire → update → expire", () => {
    let p = createHomingProjectile("missile", 0, 0, 0, 100);
    const targets = [{ id: "enemy", x: 300, y: 200 }];

    // Acquire
    p = acquireTarget(p, targets, cfg);
    expect(p.targetId).toBe("enemy");

    // Update several frames until locked
    for (let i = 0; i < 15; i++) {
      p = updateHoming(p, 300, 200, 16, cfg);
    }
    // elapsed = 240ms, should be locked
    expect(p.locked).toBe(true);
    expect(p.elapsed).toBe(240);

    // Continue updating until expiry
    p = updateHoming(p, 300, 200, 4760, cfg);
    expect(isExpired(p, cfg)).toBe(true);
  });

  it("acquire → lose → re-acquire cycle", () => {
    let p = createHomingProjectile("p", 0, 0, 0, 100);
    const t1 = [{ id: "a", x: 50, y: 0 }];
    const t2 = [{ id: "b", x: 0, y: 50 }];

    p = acquireTarget(p, t1, cfg);
    expect(p.targetId).toBe("a");

    p = loseTarget(p);
    expect(p.targetId).toBeNull();

    p = acquireTarget(p, t2, cfg);
    expect(p.targetId).toBe("b");
  });

  it("projectile with zero speed stays in place", () => {
    let p = createHomingProjectile("stuck", 100, 200, 0, 0);
    p = updateHoming(p, 500, 500, 1000, cfg);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(200);
  });

  it("multiple projectiles track independently", () => {
    const p1 = createHomingProjectile("p1", 0, 0, 0, 100);
    const p2 = createHomingProjectile("p2", 500, 500, Math.PI, 200);

    const r1 = updateHomingNoTarget(p1, 100, cfg);
    const r2 = updateHomingNoTarget(p2, 100, cfg);

    expect(r1.x).toBeCloseTo(10); // 100 * 0.1
    expect(r2.x).toBeCloseTo(480); // 500 + 200*cos(PI)*0.1 = 500 - 20
  });
});
