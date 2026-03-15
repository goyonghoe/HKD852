import { describe, it, expect } from "vitest";
import {
  createBounceConfig,
  checkBounce,
  applyBounce,
  reflectX,
  reflectY,
  isOutOfBounds,
  getWallHit,
  clampToBounds,
  getDamageAfterBounces,
  getSpeedAfterBounces,
  canBounce,
  type Projectile,
} from "../../src/core/BounceCalc";

function makeProjectile(overrides?: Partial<Projectile>): Projectile {
  return {
    id: "p1",
    x: 360,
    y: 640,
    vx: 5,
    vy: 5,
    speed: 100,
    damage: 50,
    bounceCount: 0,
    active: true,
    ...overrides,
  };
}

// ─── createBounceConfig ───

describe("createBounceConfig", () => {
  it("returns defaults with no overrides", () => {
    const cfg = createBounceConfig();
    expect(cfg.maxBounces).toBe(3);
    expect(cfg.speedLossPerBounce).toBe(0.8);
    expect(cfg.damageLossPerBounce).toBe(0.9);
    expect(cfg.boundsWidth).toBe(720);
    expect(cfg.boundsHeight).toBe(1280);
  });

  it("overrides maxBounces", () => {
    const cfg = createBounceConfig({ maxBounces: 5 });
    expect(cfg.maxBounces).toBe(5);
    expect(cfg.boundsWidth).toBe(720);
  });

  it("overrides boundsWidth and boundsHeight", () => {
    const cfg = createBounceConfig({ boundsWidth: 1080, boundsHeight: 1920 });
    expect(cfg.boundsWidth).toBe(1080);
    expect(cfg.boundsHeight).toBe(1920);
  });

  it("overrides speedLossPerBounce", () => {
    const cfg = createBounceConfig({ speedLossPerBounce: 1.0 });
    expect(cfg.speedLossPerBounce).toBe(1.0);
  });

  it("overrides damageLossPerBounce", () => {
    const cfg = createBounceConfig({ damageLossPerBounce: 0.5 });
    expect(cfg.damageLossPerBounce).toBe(0.5);
  });

  it("allows all overrides at once", () => {
    const cfg = createBounceConfig({
      maxBounces: 10,
      speedLossPerBounce: 0.5,
      damageLossPerBounce: 0.7,
      boundsWidth: 500,
      boundsHeight: 900,
    });
    expect(cfg.maxBounces).toBe(10);
    expect(cfg.speedLossPerBounce).toBe(0.5);
    expect(cfg.damageLossPerBounce).toBe(0.7);
    expect(cfg.boundsWidth).toBe(500);
    expect(cfg.boundsHeight).toBe(900);
  });
});

// ─── reflectX / reflectY ───

describe("reflectX", () => {
  it("negates positive vx", () => {
    expect(reflectX(10)).toBe(-10);
  });

  it("negates negative vx", () => {
    expect(reflectX(-7)).toBe(7);
  });

  it("returns 0 for 0", () => {
    expect(reflectX(0)).toBe(-0);
  });
});

describe("reflectY", () => {
  it("negates positive vy", () => {
    expect(reflectY(15)).toBe(-15);
  });

  it("negates negative vy", () => {
    expect(reflectY(-3)).toBe(3);
  });

  it("returns 0 for 0", () => {
    expect(reflectY(0)).toBe(-0);
  });
});

// ─── getWallHit ───

describe("getWallHit", () => {
  const cfg = createBounceConfig();

  it("returns left when x <= 0", () => {
    expect(getWallHit(0, 500, cfg)).toBe("left");
    expect(getWallHit(-5, 500, cfg)).toBe("left");
  });

  it("returns right when x >= boundsWidth", () => {
    expect(getWallHit(720, 500, cfg)).toBe("right");
    expect(getWallHit(800, 500, cfg)).toBe("right");
  });

  it("returns top when y <= 0", () => {
    expect(getWallHit(360, 0, cfg)).toBe("top");
    expect(getWallHit(360, -10, cfg)).toBe("top");
  });

  it("returns bottom when y >= boundsHeight", () => {
    expect(getWallHit(360, 1280, cfg)).toBe("bottom");
    expect(getWallHit(360, 1500, cfg)).toBe("bottom");
  });

  it("returns null when inside bounds", () => {
    expect(getWallHit(360, 640, cfg)).toBeNull();
    expect(getWallHit(1, 1, cfg)).toBeNull();
    expect(getWallHit(719, 1279, cfg)).toBeNull();
  });

  it("prioritizes left over top at corner (0,0)", () => {
    expect(getWallHit(0, 0, cfg)).toBe("left");
  });

  it("prioritizes left over bottom at corner (0, boundsHeight)", () => {
    expect(getWallHit(0, 1280, cfg)).toBe("left");
  });
});

// ─── isOutOfBounds ───

describe("isOutOfBounds", () => {
  const cfg = createBounceConfig();

  it("true at left boundary", () => {
    expect(isOutOfBounds(0, 640, cfg)).toBe(true);
  });

  it("true at right boundary", () => {
    expect(isOutOfBounds(720, 640, cfg)).toBe(true);
  });

  it("true at top boundary", () => {
    expect(isOutOfBounds(360, 0, cfg)).toBe(true);
  });

  it("true at bottom boundary", () => {
    expect(isOutOfBounds(360, 1280, cfg)).toBe(true);
  });

  it("false inside bounds", () => {
    expect(isOutOfBounds(360, 640, cfg)).toBe(false);
  });

  it("false just inside all edges", () => {
    expect(isOutOfBounds(1, 1, cfg)).toBe(false);
    expect(isOutOfBounds(719, 1279, cfg)).toBe(false);
  });

  it("true for negative coords", () => {
    expect(isOutOfBounds(-1, 640, cfg)).toBe(true);
    expect(isOutOfBounds(360, -1, cfg)).toBe(true);
  });
});

// ─── clampToBounds ───

describe("clampToBounds", () => {
  const cfg = createBounceConfig();

  it("clamps negative x to 0", () => {
    const r = clampToBounds(-10, 640, cfg);
    expect(r.x).toBe(0);
    expect(r.y).toBe(640);
  });

  it("clamps x exceeding width", () => {
    const r = clampToBounds(800, 640, cfg);
    expect(r.x).toBe(720);
  });

  it("clamps negative y to 0", () => {
    const r = clampToBounds(360, -20, cfg);
    expect(r.y).toBe(0);
  });

  it("clamps y exceeding height", () => {
    const r = clampToBounds(360, 1500, cfg);
    expect(r.y).toBe(1280);
  });

  it("does not change values inside bounds", () => {
    const r = clampToBounds(100, 200, cfg);
    expect(r.x).toBe(100);
    expect(r.y).toBe(200);
  });

  it("clamps both axes simultaneously", () => {
    const r = clampToBounds(-5, 2000, cfg);
    expect(r.x).toBe(0);
    expect(r.y).toBe(1280);
  });
});

// ─── getDamageAfterBounces ───

describe("getDamageAfterBounces", () => {
  it("returns baseDamage with 0 bounces", () => {
    expect(getDamageAfterBounces(100, 0, 0.9)).toBe(100);
  });

  it("applies single bounce", () => {
    expect(getDamageAfterBounces(100, 1, 0.9)).toBeCloseTo(90);
  });

  it("applies two bounces", () => {
    expect(getDamageAfterBounces(100, 2, 0.9)).toBeCloseTo(81);
  });

  it("applies three bounces", () => {
    expect(getDamageAfterBounces(100, 3, 0.9)).toBeCloseTo(72.9);
  });

  it("returns 0 with damageLoss=0", () => {
    expect(getDamageAfterBounces(100, 1, 0)).toBe(0);
  });

  it("retains full damage with damageLoss=1", () => {
    expect(getDamageAfterBounces(100, 5, 1)).toBe(100);
  });
});

// ─── getSpeedAfterBounces ───

describe("getSpeedAfterBounces", () => {
  it("returns baseSpeed with 0 bounces", () => {
    expect(getSpeedAfterBounces(200, 0, 0.8)).toBe(200);
  });

  it("applies single bounce", () => {
    expect(getSpeedAfterBounces(200, 1, 0.8)).toBeCloseTo(160);
  });

  it("applies multiple bounces", () => {
    expect(getSpeedAfterBounces(200, 3, 0.8)).toBeCloseTo(102.4);
  });

  it("returns 0 with speedLoss=0", () => {
    expect(getSpeedAfterBounces(200, 1, 0)).toBe(0);
  });

  it("retains full speed with speedLoss=1", () => {
    expect(getSpeedAfterBounces(200, 10, 1)).toBe(200);
  });
});

// ─── canBounce ───

describe("canBounce", () => {
  const cfg = createBounceConfig({ maxBounces: 3 });

  it("true when bounceCount=0", () => {
    expect(canBounce(makeProjectile({ bounceCount: 0 }), cfg)).toBe(true);
  });

  it("true when bounceCount < maxBounces", () => {
    expect(canBounce(makeProjectile({ bounceCount: 2 }), cfg)).toBe(true);
  });

  it("false when bounceCount = maxBounces", () => {
    expect(canBounce(makeProjectile({ bounceCount: 3 }), cfg)).toBe(false);
  });

  it("false when bounceCount > maxBounces", () => {
    expect(canBounce(makeProjectile({ bounceCount: 5 }), cfg)).toBe(false);
  });

  it("false when inactive", () => {
    expect(
      canBounce(makeProjectile({ bounceCount: 0, active: false }), cfg),
    ).toBe(false);
  });
});

// ─── checkBounce ───

describe("checkBounce", () => {
  const cfg = createBounceConfig();

  it("no bounce when inside bounds", () => {
    const p = makeProjectile({ x: 360, y: 640 });
    const r = checkBounce(p, cfg);
    expect(r.bounced).toBe(false);
    expect(r.wall).toBeNull();
    expect(r.newVx).toBe(p.vx);
    expect(r.newVy).toBe(p.vy);
  });

  it("bounces off left wall — reflects vx", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3 });
    const r = checkBounce(p, cfg);
    expect(r.bounced).toBe(true);
    expect(r.wall).toBe("left");
    expect(r.newVx).toBe(5);
    expect(r.newVy).toBe(3);
    expect(r.newX).toBe(0);
  });

  it("bounces off right wall — reflects vx", () => {
    const p = makeProjectile({ x: 720, y: 640, vx: 5, vy: -2 });
    const r = checkBounce(p, cfg);
    expect(r.bounced).toBe(true);
    expect(r.wall).toBe("right");
    expect(r.newVx).toBe(-5);
    expect(r.newVy).toBe(-2);
  });

  it("bounces off top wall — reflects vy", () => {
    const p = makeProjectile({ x: 360, y: 0, vx: 4, vy: -6 });
    const r = checkBounce(p, cfg);
    expect(r.bounced).toBe(true);
    expect(r.wall).toBe("top");
    expect(r.newVx).toBe(4);
    expect(r.newVy).toBe(6);
  });

  it("bounces off bottom wall — reflects vy", () => {
    const p = makeProjectile({ x: 360, y: 1280, vx: 1, vy: 8 });
    const r = checkBounce(p, cfg);
    expect(r.bounced).toBe(true);
    expect(r.wall).toBe("bottom");
    expect(r.newVy).toBe(-8);
  });

  it("clamps position on bounce", () => {
    const p = makeProjectile({ x: -20, y: 640, vx: -5, vy: 0 });
    const r = checkBounce(p, cfg);
    expect(r.newX).toBe(0);
    expect(r.newY).toBe(640);
  });
});

// ─── applyBounce ───

describe("applyBounce", () => {
  const cfg = createBounceConfig({
    maxBounces: 3,
    speedLossPerBounce: 0.8,
    damageLossPerBounce: 0.9,
  });

  it("returns same projectile if inside bounds", () => {
    const p = makeProjectile({ x: 360, y: 640 });
    const r = applyBounce(p, cfg);
    expect(r).toBe(p);
  });

  it("returns same projectile if inactive", () => {
    const p = makeProjectile({ x: 0, y: 640, active: false });
    const r = applyBounce(p, cfg);
    expect(r).toBe(p);
  });

  it("increments bounceCount on bounce", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, bounceCount: 0 });
    const r = applyBounce(p, cfg);
    expect(r.bounceCount).toBe(1);
  });

  it("reduces speed on bounce", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, speed: 100 });
    const r = applyBounce(p, cfg);
    expect(r.speed).toBeCloseTo(80);
  });

  it("reduces damage on bounce", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, damage: 50 });
    const r = applyBounce(p, cfg);
    expect(r.damage).toBeCloseTo(45);
  });

  it("stays active when bounceCount < maxBounces", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, bounceCount: 1 });
    const r = applyBounce(p, cfg);
    expect(r.active).toBe(true);
    expect(r.bounceCount).toBe(2);
  });

  it("stays active on exactly maxBounces", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, bounceCount: 2 });
    const r = applyBounce(p, cfg);
    expect(r.active).toBe(true);
    expect(r.bounceCount).toBe(3);
  });

  it("deactivates when bounceCount exceeds maxBounces", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, bounceCount: 3 });
    const r = applyBounce(p, cfg);
    expect(r.active).toBe(false);
    expect(r.bounceCount).toBe(4);
  });

  it("sets velocity to 0 when deactivated", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3, bounceCount: 3 });
    const r = applyBounce(p, cfg);
    expect(r.vx).toBe(0);
    expect(r.vy).toBe(0);
  });

  it("reflects velocity on left wall", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3 });
    const r = applyBounce(p, cfg);
    expect(r.vx).toBeGreaterThan(0);
  });

  it("reflects velocity on bottom wall", () => {
    const p = makeProjectile({ x: 360, y: 1280, vx: 2, vy: 5 });
    const r = applyBounce(p, cfg);
    expect(r.vy).toBeLessThan(0);
  });

  it("preserves id", () => {
    const p = makeProjectile({ id: "test-id", x: 0, y: 640, vx: -5, vy: 3 });
    const r = applyBounce(p, cfg);
    expect(r.id).toBe("test-id");
  });

  it("does not mutate original projectile", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: -5, vy: 3 });
    applyBounce(p, cfg);
    expect(p.bounceCount).toBe(0);
    expect(p.vx).toBe(-5);
  });

  it("multiple sequential bounces reduce stats cumulatively", () => {
    let p = makeProjectile({
      x: 0,
      y: 640,
      vx: -5,
      vy: 3,
      speed: 100,
      damage: 100,
    });
    p = applyBounce(p, cfg);
    expect(p.speed).toBeCloseTo(80);
    expect(p.damage).toBeCloseTo(90);

    // Simulate hitting the right wall next
    p = { ...p, x: 720, vx: Math.abs(p.vx) };
    p = applyBounce(p, cfg);
    expect(p.speed).toBeCloseTo(64);
    expect(p.damage).toBeCloseTo(81);
    expect(p.bounceCount).toBe(2);
  });

  it("handles zero velocity projectile at boundary", () => {
    const p = makeProjectile({ x: 0, y: 640, vx: 0, vy: 0, speed: 100 });
    const r = applyBounce(p, cfg);
    expect(r.bounceCount).toBe(1);
    expect(r.active).toBe(true);
  });

  it("works with custom small arena", () => {
    const smallCfg = createBounceConfig({
      boundsWidth: 100,
      boundsHeight: 100,
      maxBounces: 1,
    });
    const p = makeProjectile({ x: 100, y: 50, vx: 3, vy: 0 });
    const r = applyBounce(p, smallCfg);
    expect(r.bounceCount).toBe(1);
    expect(r.active).toBe(true);
  });
});
