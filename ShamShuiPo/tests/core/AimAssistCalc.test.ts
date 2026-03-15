import { describe, it, expect } from "vitest";
import {
  createAimState,
  findBestTarget,
  updateAim,
  getAimDirection,
  getAimAngle,
  getDistance,
  isInRange,
  clearTarget,
  setConfig,
  hasTarget,
} from "../../src/core/AimAssistCalc";

// ─── createAimState ─────────────────────────────────────────────────

describe("createAimState", () => {
  it("returns default config when called with no args", () => {
    const s = createAimState();
    expect(s.config.maxRange).toBe(300);
    expect(s.config.snapAngle).toBe(45);
    expect(s.config.priorityWeight).toBe(0.5);
    expect(s.config.stickyTime).toBe(500);
  });

  it("returns null currentTargetId", () => {
    const s = createAimState();
    expect(s.currentTargetId).toBeNull();
  });

  it("returns zero aimAngle", () => {
    const s = createAimState();
    expect(s.aimAngle).toBe(0);
  });

  it("returns zero stickyElapsed", () => {
    const s = createAimState();
    expect(s.stickyElapsed).toBe(0);
  });

  it("overrides maxRange via partial config", () => {
    const s = createAimState({ maxRange: 500 });
    expect(s.config.maxRange).toBe(500);
    expect(s.config.snapAngle).toBe(45); // other defaults kept
  });

  it("overrides multiple config fields", () => {
    const s = createAimState({ maxRange: 100, priorityWeight: 0.8 });
    expect(s.config.maxRange).toBe(100);
    expect(s.config.priorityWeight).toBe(0.8);
  });

  it("lastAimX and lastAimY default to 0", () => {
    const s = createAimState();
    expect(s.lastAimX).toBe(0);
    expect(s.lastAimY).toBe(0);
  });
});

// ─── getDistance ─────────────────────────────────────────────────────

describe("getDistance", () => {
  it("returns 0 for same point", () => {
    expect(getDistance(5, 5, 5, 5)).toBe(0);
  });

  it("calculates horizontal distance", () => {
    expect(getDistance(0, 0, 3, 0)).toBe(3);
  });

  it("calculates vertical distance", () => {
    expect(getDistance(0, 0, 0, 4)).toBe(4);
  });

  it("calculates diagonal (3-4-5 triangle)", () => {
    expect(getDistance(0, 0, 3, 4)).toBe(5);
  });

  it("handles negative coordinates", () => {
    expect(getDistance(-3, -4, 0, 0)).toBe(5);
  });

  it("is commutative", () => {
    expect(getDistance(1, 2, 7, 9)).toBe(getDistance(7, 9, 1, 2));
  });
});

// ─── getAimAngle ────────────────────────────────────────────────────

describe("getAimAngle", () => {
  it("returns 0 for target directly right", () => {
    expect(getAimAngle(0, 0, 10, 0)).toBe(0);
  });

  it("returns PI/2 for target directly below", () => {
    expect(getAimAngle(0, 0, 0, 10)).toBeCloseTo(Math.PI / 2);
  });

  it("returns PI for target directly left", () => {
    expect(getAimAngle(0, 0, -10, 0)).toBeCloseTo(Math.PI);
  });

  it("returns -PI/2 for target directly above", () => {
    expect(getAimAngle(0, 0, 0, -10)).toBeCloseTo(-Math.PI / 2);
  });

  it("returns PI/4 for 45 degrees", () => {
    expect(getAimAngle(0, 0, 10, 10)).toBeCloseTo(Math.PI / 4);
  });

  it("handles non-origin player position", () => {
    expect(getAimAngle(100, 100, 110, 100)).toBeCloseTo(0);
  });
});

// ─── isInRange ──────────────────────────────────────────────────────

describe("isInRange", () => {
  it("returns true for target within range", () => {
    const s = createAimState({ maxRange: 100 });
    expect(isInRange(s, 0, 0, 50, 0)).toBe(true);
  });

  it("returns true for target exactly at max range", () => {
    const s = createAimState({ maxRange: 100 });
    expect(isInRange(s, 0, 0, 100, 0)).toBe(true);
  });

  it("returns false for target beyond range", () => {
    const s = createAimState({ maxRange: 100 });
    expect(isInRange(s, 0, 0, 101, 0)).toBe(false);
  });

  it("returns true for target at origin (distance 0)", () => {
    const s = createAimState({ maxRange: 100 });
    expect(isInRange(s, 5, 5, 5, 5)).toBe(true);
  });
});

// ─── getAimDirection ────────────────────────────────────────────────

describe("getAimDirection", () => {
  it("returns (1, 0) for aimAngle 0", () => {
    const s = createAimState();
    const d = getAimDirection(s);
    expect(d.dx).toBeCloseTo(1);
    expect(d.dy).toBeCloseTo(0);
  });

  it("returns (0, 1) for aimAngle PI/2", () => {
    const s = { ...createAimState(), aimAngle: Math.PI / 2 };
    const d = getAimDirection(s);
    expect(d.dx).toBeCloseTo(0);
    expect(d.dy).toBeCloseTo(1);
  });

  it("returns (-1, 0) for aimAngle PI", () => {
    const s = { ...createAimState(), aimAngle: Math.PI };
    const d = getAimDirection(s);
    expect(d.dx).toBeCloseTo(-1);
    expect(d.dy).toBeCloseTo(0);
  });

  it("returns unit vector magnitude ~1", () => {
    const s = { ...createAimState(), aimAngle: 1.23 };
    const d = getAimDirection(s);
    const mag = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
    expect(mag).toBeCloseTo(1);
  });
});

// ─── hasTarget ──────────────────────────────────────────────────────

describe("hasTarget", () => {
  it("returns false for fresh state", () => {
    expect(hasTarget(createAimState())).toBe(false);
  });

  it("returns true when currentTargetId is set", () => {
    const s = { ...createAimState(), currentTargetId: "e1" };
    expect(hasTarget(s)).toBe(true);
  });
});

// ─── clearTarget ────────────────────────────────────────────────────

describe("clearTarget", () => {
  it("sets currentTargetId to null", () => {
    const s = { ...createAimState(), currentTargetId: "e1" };
    const cleared = clearTarget(s);
    expect(cleared.currentTargetId).toBeNull();
  });

  it("does not mutate original state", () => {
    const s = { ...createAimState(), currentTargetId: "e1" };
    clearTarget(s);
    expect(s.currentTargetId).toBe("e1");
  });

  it("preserves other state fields", () => {
    const s = { ...createAimState(), currentTargetId: "e1", aimAngle: 1.5 };
    const cleared = clearTarget(s);
    expect(cleared.aimAngle).toBe(1.5);
  });
});

// ─── setConfig ──────────────────────────────────────────────────────

describe("setConfig", () => {
  it("updates maxRange", () => {
    const s = createAimState();
    const updated = setConfig(s, { maxRange: 500 });
    expect(updated.config.maxRange).toBe(500);
  });

  it("preserves other config fields", () => {
    const s = createAimState();
    const updated = setConfig(s, { maxRange: 500 });
    expect(updated.config.snapAngle).toBe(45);
  });

  it("does not mutate original state", () => {
    const s = createAimState();
    setConfig(s, { maxRange: 500 });
    expect(s.config.maxRange).toBe(300);
  });

  it("can update multiple fields at once", () => {
    const s = createAimState();
    const updated = setConfig(s, { maxRange: 200, stickyTime: 1000 });
    expect(updated.config.maxRange).toBe(200);
    expect(updated.config.stickyTime).toBe(1000);
  });
});

// ─── findBestTarget ─────────────────────────────────────────────────

describe("findBestTarget", () => {
  it("returns null when no enemies", () => {
    const s = createAimState();
    expect(findBestTarget(s, 0, 0, [])).toBeNull();
  });

  it("returns null when all enemies out of range", () => {
    const s = createAimState({ maxRange: 100 });
    const enemies = [{ id: "e1", x: 200, y: 0 }];
    expect(findBestTarget(s, 0, 0, enemies)).toBeNull();
  });

  it("returns the only in-range enemy", () => {
    const s = createAimState({ maxRange: 100 });
    const enemies = [{ id: "e1", x: 50, y: 0 }];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target).not.toBeNull();
    expect(target!.id).toBe("e1");
  });

  it("prefers closer enemy when priorityWeight is 0", () => {
    const s = createAimState({ maxRange: 300, priorityWeight: 0 });
    const enemies = [
      { id: "far", x: 200, y: 0, priority: 10 },
      { id: "close", x: 50, y: 0, priority: 0 },
    ];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.id).toBe("close");
  });

  it("prefers higher priority enemy when priorityWeight is 1", () => {
    const s = createAimState({ maxRange: 300, priorityWeight: 1 });
    const enemies = [
      { id: "low", x: 50, y: 0, priority: 1 },
      { id: "high", x: 200, y: 0, priority: 10 },
    ];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.id).toBe("high");
  });

  it("balances distance and priority at weight 0.5", () => {
    const s = createAimState({ maxRange: 300, priorityWeight: 0.5 });
    // close + low priority vs far + high priority
    const enemies = [
      { id: "close_low", x: 30, y: 0, priority: 0 },
      { id: "far_high", x: 250, y: 0, priority: 10 },
    ];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target).not.toBeNull();
    // With balanced weight, the close one should still win due to strong distance advantage
  });

  it("returns correct distance in AimTarget", () => {
    const s = createAimState({ maxRange: 300 });
    const enemies = [{ id: "e1", x: 3, y: 4 }];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.distance).toBeCloseTo(5);
  });

  it("defaults enemy priority to 0 when not provided", () => {
    const s = createAimState({ maxRange: 300 });
    const enemies = [{ id: "e1", x: 50, y: 0 }];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.priority).toBe(0);
  });

  it("enemy exactly at maxRange is included", () => {
    const s = createAimState({ maxRange: 100 });
    const enemies = [{ id: "e1", x: 100, y: 0 }];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target).not.toBeNull();
  });

  it("enemy barely beyond maxRange is excluded", () => {
    const s = createAimState({ maxRange: 100 });
    const enemies = [{ id: "e1", x: 100.01, y: 0 }];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target).toBeNull();
  });

  it("handles many enemies and returns best", () => {
    const s = createAimState({ maxRange: 300, priorityWeight: 0 });
    const enemies = Array.from({ length: 50 }, (_, i) => ({
      id: `e${i}`,
      x: 10 + i * 5,
      y: 0,
    }));
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.id).toBe("e0"); // closest
  });

  it("works with non-origin player position", () => {
    const s = createAimState({ maxRange: 100 });
    const enemies = [{ id: "e1", x: 150, y: 0 }];
    // From (100, 0) to (150, 0) = 50, within range
    const target = findBestTarget(s, 100, 0, enemies);
    expect(target).not.toBeNull();
    expect(target!.distance).toBeCloseTo(50);
  });
});

// ─── updateAim ──────────────────────────────────────────────────────

describe("updateAim", () => {
  const basicEnemies = [
    { id: "e1", x: 100, y: 0 },
    { id: "e2", x: 200, y: 0 },
  ];

  it("acquires a target from fresh state", () => {
    const s = createAimState();
    const next = updateAim(s, 0, 0, basicEnemies, 16);
    expect(next.currentTargetId).not.toBeNull();
  });

  it("sets aimAngle toward acquired target", () => {
    const s = createAimState({ priorityWeight: 0 });
    const enemies = [{ id: "e1", x: 0, y: 100 }];
    const next = updateAim(s, 0, 0, enemies, 16);
    expect(next.aimAngle).toBeCloseTo(Math.PI / 2);
  });

  it("resets stickyElapsed when acquiring new target", () => {
    const s = createAimState();
    const next = updateAim(s, 0, 0, basicEnemies, 16);
    expect(next.stickyElapsed).toBe(0);
  });

  it("keeps sticky target within stickyTime", () => {
    const s = createAimState({ stickyTime: 500 });
    const step1 = updateAim(s, 0, 0, basicEnemies, 16);
    const targetId = step1.currentTargetId;
    // Move enemy slightly, step again within sticky
    const step2 = updateAim(step1, 0, 0, basicEnemies, 100);
    expect(step2.currentTargetId).toBe(targetId);
  });

  it("increments stickyElapsed each frame", () => {
    const s = createAimState({ stickyTime: 500 });
    const step1 = updateAim(s, 0, 0, basicEnemies, 16);
    const step2 = updateAim(step1, 0, 0, basicEnemies, 100);
    expect(step2.stickyElapsed).toBe(100);
  });

  it("re-evaluates target after stickyTime expires", () => {
    const s = createAimState({ stickyTime: 100, priorityWeight: 0 });
    const enemies = [
      { id: "e1", x: 100, y: 0 },
      { id: "e2", x: 50, y: 0 },
    ];
    // First acquire — should pick e2 (closer)
    const step1 = updateAim(s, 0, 0, enemies, 16);
    expect(step1.currentTargetId).toBe("e2");
    // Accumulate past stickyTime
    const step2 = updateAim(step1, 0, 0, enemies, 101);
    // Should re-evaluate and pick e2 again (still closest)
    expect(step2.currentTargetId).toBe("e2");
    expect(step2.stickyElapsed).toBe(0); // reset after re-eval
  });

  it("drops target when current target goes out of range", () => {
    const s = createAimState({ maxRange: 150 });
    const step1 = updateAim(s, 0, 0, [{ id: "e1", x: 100, y: 0 }], 16);
    expect(step1.currentTargetId).toBe("e1");
    // Enemy moved out of range
    const step2 = updateAim(step1, 0, 0, [{ id: "e1", x: 200, y: 0 }], 16);
    expect(step2.currentTargetId).toBeNull();
  });

  it("drops target when current enemy disappears", () => {
    const s = createAimState();
    const step1 = updateAim(s, 0, 0, [{ id: "e1", x: 100, y: 0 }], 16);
    expect(step1.currentTargetId).toBe("e1");
    // Enemy gone
    const step2 = updateAim(step1, 0, 0, [], 16);
    expect(step2.currentTargetId).toBeNull();
  });

  it("switches to new target when current disappears and others exist", () => {
    const s = createAimState();
    const step1 = updateAim(s, 0, 0, [{ id: "e1", x: 100, y: 0 }], 16);
    const step2 = updateAim(step1, 0, 0, [{ id: "e2", x: 150, y: 0 }], 16);
    expect(step2.currentTargetId).toBe("e2");
  });

  it("returns null target when no enemies in range", () => {
    const s = createAimState({ maxRange: 50 });
    const next = updateAim(s, 0, 0, [{ id: "e1", x: 200, y: 0 }], 16);
    expect(next.currentTargetId).toBeNull();
  });

  it("updates lastAimX and lastAimY", () => {
    const s = createAimState();
    const enemies = [{ id: "e1", x: 77, y: 33 }];
    const next = updateAim(s, 0, 0, enemies, 16);
    expect(next.lastAimX).toBe(77);
    expect(next.lastAimY).toBe(33);
  });

  it("does not mutate original state", () => {
    const s = createAimState();
    updateAim(s, 0, 0, basicEnemies, 16);
    expect(s.currentTargetId).toBeNull();
    expect(s.stickyElapsed).toBe(0);
  });

  it("handles deltaMs of 0", () => {
    const s = createAimState();
    const next = updateAim(s, 0, 0, basicEnemies, 0);
    expect(next.currentTargetId).not.toBeNull();
  });

  it("sticky keeps aim angle updated as target moves", () => {
    const s = createAimState({ stickyTime: 1000 });
    const step1 = updateAim(s, 0, 0, [{ id: "e1", x: 100, y: 0 }], 16);
    expect(step1.aimAngle).toBeCloseTo(0); // directly right
    // Same enemy moved up
    const step2 = updateAim(step1, 0, 0, [{ id: "e1", x: 0, y: 100 }], 100);
    expect(step2.aimAngle).toBeCloseTo(Math.PI / 2); // now directly below
    expect(step2.currentTargetId).toBe("e1"); // still sticky
  });
});

// ─── Integration / edge cases ───────────────────────────────────────

describe("integration", () => {
  it("full lifecycle: acquire, stick, expire, reacquire", () => {
    const s = createAimState({
      stickyTime: 200,
      priorityWeight: 0,
      maxRange: 300,
    });
    const enemies = [
      { id: "a", x: 100, y: 0 },
      { id: "b", x: 50, y: 0 },
    ];

    // Frame 1: acquire closest (b)
    const f1 = updateAim(s, 0, 0, enemies, 16);
    expect(f1.currentTargetId).toBe("b");

    // Frame 2-10: sticky holds (total elapsed < 200)
    let state = f1;
    for (let i = 0; i < 9; i++) {
      state = updateAim(state, 0, 0, enemies, 16);
    }
    expect(state.currentTargetId).toBe("b");
    expect(state.stickyElapsed).toBeLessThan(200);

    // Frame 11+: push past sticky time
    state = updateAim(state, 0, 0, enemies, 200);
    // Re-evaluates, picks b again (still closest)
    expect(state.currentTargetId).toBe("b");
    expect(state.stickyElapsed).toBe(0);
  });

  it("target switching when closer enemy appears", () => {
    const s = createAimState({ stickyTime: 50, priorityWeight: 0 });
    const f1 = updateAim(s, 0, 0, [{ id: "far", x: 200, y: 0 }], 16);
    expect(f1.currentTargetId).toBe("far");

    // Sticky expires, new closer enemy appears
    const f2 = updateAim(
      f1,
      0,
      0,
      [
        { id: "far", x: 200, y: 0 },
        { id: "near", x: 30, y: 0 },
      ],
      60,
    );
    expect(f2.currentTargetId).toBe("near");
  });

  it("getAimDirection matches target position after updateAim", () => {
    const s = createAimState();
    const enemies = [{ id: "e1", x: 100, y: 100 }];
    const next = updateAim(s, 0, 0, enemies, 16);
    const dir = getAimDirection(next);
    // Should point toward (100, 100) from (0, 0) — 45 degrees
    expect(dir.dx).toBeCloseTo(Math.SQRT1_2);
    expect(dir.dy).toBeCloseTo(Math.SQRT1_2);
  });

  it("clearTarget + updateAim reacquires", () => {
    const s = createAimState();
    const enemies = [{ id: "e1", x: 100, y: 0 }];
    const f1 = updateAim(s, 0, 0, enemies, 16);
    const cleared = clearTarget(f1);
    expect(hasTarget(cleared)).toBe(false);
    const f2 = updateAim(cleared, 0, 0, enemies, 16);
    expect(f2.currentTargetId).toBe("e1");
  });

  it("setConfig changes maxRange and affects targeting", () => {
    const s = createAimState({ maxRange: 50 });
    const enemies = [{ id: "e1", x: 100, y: 0 }];
    const f1 = updateAim(s, 0, 0, enemies, 16);
    expect(f1.currentTargetId).toBeNull(); // out of range

    const expanded = setConfig(f1, { maxRange: 200 });
    const f2 = updateAim(expanded, 0, 0, enemies, 16);
    expect(f2.currentTargetId).toBe("e1");
  });

  it("works at portrait game resolution boundaries", () => {
    // 720x1280 portrait, player at center
    const s = createAimState({ maxRange: 400 });
    const px = 360,
      py = 640;
    const enemies = [
      { id: "top", x: 360, y: 300 },
      { id: "bottom", x: 360, y: 900 },
      { id: "corner", x: 700, y: 1200 },
    ];
    const target = findBestTarget(s, px, py, enemies);
    expect(target).not.toBeNull();
  });

  it("handles enemies at same position", () => {
    const s = createAimState({ priorityWeight: 1 });
    const enemies = [
      { id: "a", x: 100, y: 0, priority: 5 },
      { id: "b", x: 100, y: 0, priority: 8 },
    ];
    const target = findBestTarget(s, 0, 0, enemies);
    expect(target!.id).toBe("b"); // higher priority
  });

  it("handles enemy at player position (distance 0)", () => {
    const s = createAimState();
    const enemies = [{ id: "e1", x: 50, y: 50 }];
    const target = findBestTarget(s, 50, 50, enemies);
    expect(target).not.toBeNull();
    expect(target!.distance).toBe(0);
  });
});
