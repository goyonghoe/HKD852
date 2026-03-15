// ── Tests: EnemyAICalc ──

import { describe, it, expect } from "vitest";
import {
  createAIState,
  getMovement,
  shouldChangeBehavior,
  getDefaultBehaviorForEnemy,
  calculateFleeDirection,
  getChargeWindup,
  type AIState,
} from "../../src/core/EnemyAICalc";

// ════════════════════════════════════════════════════════════════
// § createAIState
// ════════════════════════════════════════════════════════════════

describe("createAIState", () => {
  it("creates state with given behavior", () => {
    const state = createAIState("chase");
    expect(state.behavior).toBe("chase");
  });

  it("initializes timers to zero", () => {
    const state = createAIState("orbit");
    expect(state.timer).toBe(0);
    expect(state.phaseTimer).toBe(0);
  });

  it("sets default retreat threshold", () => {
    const state = createAIState("charge");
    expect(state.retreatThreshold).toBe(0.25);
  });

  it("has no chargeTarget by default", () => {
    const state = createAIState("charge");
    expect(state.chargeTarget).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — chase
// ════════════════════════════════════════════════════════════════

describe("getMovement chase", () => {
  it("moves toward player on the right", () => {
    const state = createAIState("chase");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.dx).toBeGreaterThan(0);
    expect(movement.dy).toBeCloseTo(0);
    expect(movement.speedMod).toBe(1.0);
  });

  it("moves toward player below", () => {
    const state = createAIState("chase");
    const { movement } = getMovement(state, 100, 0, 100, 200, 0.016);
    expect(movement.dx).toBeCloseTo(0);
    expect(movement.dy).toBeGreaterThan(0);
  });

  it("returns normalized direction for diagonal chase", () => {
    const state = createAIState("chase");
    const { movement } = getMovement(state, 0, 0, 100, 100, 0.016);
    const mag = Math.sqrt(movement.dx ** 2 + movement.dy ** 2);
    expect(mag).toBeCloseTo(1, 5);
  });

  it("returns zero movement when enemy is on player", () => {
    const state = createAIState("chase");
    const { movement } = getMovement(state, 50, 50, 50, 50, 0.016);
    expect(movement.dx).toBe(0);
    expect(movement.dy).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — orbit
// ════════════════════════════════════════════════════════════════

describe("getMovement orbit", () => {
  it("produces movement with speedMod 1.0", () => {
    const state = createAIState("orbit");
    const { movement } = getMovement(state, 200, 0, 0, 0, 0.016);
    expect(movement.speedMod).toBe(1.0);
  });

  it("output direction is normalized", () => {
    const state = createAIState("orbit");
    const { movement } = getMovement(state, 300, 100, 100, 100, 0.016);
    const mag = Math.sqrt(movement.dx ** 2 + movement.dy ** 2);
    expect(mag).toBeCloseTo(1, 4);
  });

  it("approaches player when far from orbit radius", () => {
    const state = createAIState("orbit");
    // Enemy 500px away — should move toward player
    const { movement } = getMovement(state, 500, 0, 0, 0, 0.016);
    expect(movement.dx).toBeLessThan(0); // toward player at origin
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — zigzag
// ════════════════════════════════════════════════════════════════

describe("getMovement zigzag", () => {
  it("has speedMod 1.0", () => {
    const state = createAIState("zigzag");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(1.0);
  });

  it("direction is normalized", () => {
    const state = createAIState("zigzag");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    const mag = Math.sqrt(movement.dx ** 2 + movement.dy ** 2);
    expect(mag).toBeCloseTo(1, 4);
  });

  it("alternates lateral direction over time", () => {
    let state = createAIState("zigzag");
    // First tick (t~0, cycle 0 → side=+1)
    const r1 = getMovement(state, 0, 0, 100, 0, 0.016);
    const dy1 = r1.movement.dy;

    // Advance past 0.5s (next cycle → side=-1)
    state = { ...state, phaseTimer: 0.6 };
    const r2 = getMovement(state, 0, 0, 100, 0, 0.016);
    const dy2 = r2.movement.dy;

    // Signs should differ (alternating sides)
    expect(dy1 * dy2).toBeLessThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — charge
// ════════════════════════════════════════════════════════════════

describe("getMovement charge", () => {
  it("moves slowly during windup phase (speedMod 0.3)", () => {
    const state = createAIState("charge");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(0.3);
  });

  it("dashes at 2x speed after windup", () => {
    // timer=0.8 → windup done, dash starts
    const state: AIState = {
      ...createAIState("charge"),
      timer: 0.8,
      chargeTarget: { x: 100, y: 0 },
    };
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(2.0);
  });

  it("pauses after dash (speedMod 0)", () => {
    // timer=1.8 → past windup (0.8) + dash (1.0), in pause
    const state: AIState = {
      ...createAIState("charge"),
      timer: 1.8,
      chargeTarget: { x: 100, y: 0 },
    };
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(0);
    expect(movement.dx).toBe(0);
    expect(movement.dy).toBe(0);
  });

  it("locks charge target during windup", () => {
    const state = createAIState("charge");
    const { newState } = getMovement(state, 0, 0, 200, 300, 0.016);
    expect(newState.chargeTarget).toBeDefined();
    expect(newState.chargeTarget!.x).toBe(200);
    expect(newState.chargeTarget!.y).toBe(300);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — retreat
// ════════════════════════════════════════════════════════════════

describe("getMovement retreat", () => {
  it("moves away from player", () => {
    const state = createAIState("retreat");
    const { movement } = getMovement(state, 50, 50, 0, 0, 0.016);
    // Enemy at (50,50), player at (0,0) → flee direction is positive
    expect(movement.dx).toBeGreaterThan(0);
    expect(movement.dy).toBeGreaterThan(0);
  });

  it("has speedMod 1.2 (slightly faster retreat)", () => {
    const state = createAIState("retreat");
    const { movement } = getMovement(state, 50, 0, 0, 0, 0.016);
    expect(movement.speedMod).toBe(1.2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — strafe
// ════════════════════════════════════════════════════════════════

describe("getMovement strafe", () => {
  it("moves mostly perpendicular to player direction", () => {
    const state = createAIState("strafe");
    // Player directly to the right
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    // Should have significant y component (perpendicular) and small x component (approach)
    expect(Math.abs(movement.dy)).toBeGreaterThan(Math.abs(movement.dx) * 0.5);
  });

  it("has speedMod 1.0", () => {
    const state = createAIState("strafe");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(1.0);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — swarm
// ════════════════════════════════════════════════════════════════

describe("getMovement swarm", () => {
  it("generally moves toward player", () => {
    const state = createAIState("swarm");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.dx).toBeGreaterThan(0);
  });

  it("has speedMod 1.0", () => {
    const state = createAIState("swarm");
    const { movement } = getMovement(state, 0, 0, 100, 0, 0.016);
    expect(movement.speedMod).toBe(1.0);
  });

  it("angle varies with phaseTimer (spread effect)", () => {
    const state1: AIState = { ...createAIState("swarm"), phaseTimer: 0 };
    const state2: AIState = { ...createAIState("swarm"), phaseTimer: 1.5 };
    const r1 = getMovement(state1, 0, 0, 100, 0, 0.016);
    const r2 = getMovement(state2, 0, 0, 100, 0, 0.016);
    // dy should differ due to angle offset
    expect(r1.movement.dy).not.toBeCloseTo(r2.movement.dy, 2);
  });
});

// ════════════════════════════════════════════════════════════════
// § getMovement — timer advancement
// ════════════════════════════════════════════════════════════════

describe("getMovement timer advancement", () => {
  it("increments timer by dt", () => {
    const state = createAIState("chase");
    const { newState } = getMovement(state, 0, 0, 100, 0, 0.5);
    expect(newState.timer).toBeCloseTo(0.5);
  });

  it("increments phaseTimer by dt", () => {
    const state = createAIState("zigzag");
    const { newState } = getMovement(state, 0, 0, 100, 0, 0.25);
    expect(newState.phaseTimer).toBeCloseTo(0.25);
  });
});

// ════════════════════════════════════════════════════════════════
// § shouldChangeBehavior
// ════════════════════════════════════════════════════════════════

describe("shouldChangeBehavior", () => {
  it("suggests retreat when HP low and close to player", () => {
    const state = createAIState("chase");
    const result = shouldChangeBehavior(state, 0.1, 100);
    expect(result).toBe("retreat");
  });

  it("returns null when HP is healthy", () => {
    const state = createAIState("chase");
    const result = shouldChangeBehavior(state, 0.8, 100);
    expect(result).toBeNull();
  });

  it("returns null if already retreating with low HP", () => {
    const state = createAIState("retreat");
    // retreating + low HP + close → no change (already retreating)
    const result = shouldChangeBehavior(state, 0.1, 100);
    expect(result).toBeNull();
  });

  it("suggests chase when retreating and HP recovered", () => {
    const state = createAIState("retreat");
    const result = shouldChangeBehavior(state, 0.5, 100);
    expect(result).toBe("chase");
  });

  it("suggests chase when retreating and far enough", () => {
    const state = createAIState("retreat");
    const result = shouldChangeBehavior(state, 0.1, 200);
    expect(result).toBe("chase");
  });

  it("does not suggest retreat when far from player", () => {
    const state = createAIState("chase");
    // Low HP but far away → no need to retreat
    const result = shouldChangeBehavior(state, 0.1, 300);
    expect(result).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// § getDefaultBehaviorForEnemy
// ════════════════════════════════════════════════════════════════

describe("getDefaultBehaviorForEnemy", () => {
  it("drone defaults to swarm", () => {
    expect(getDefaultBehaviorForEnemy("drone")).toBe("swarm");
  });

  it("crawler defaults to chase", () => {
    expect(getDefaultBehaviorForEnemy("crawler")).toBe("chase");
  });

  it("dasher defaults to charge", () => {
    expect(getDefaultBehaviorForEnemy("dasher")).toBe("charge");
  });

  it("enforcer defaults to strafe", () => {
    expect(getDefaultBehaviorForEnemy("enforcer")).toBe("strafe");
  });

  it("sentinel defaults to orbit", () => {
    expect(getDefaultBehaviorForEnemy("sentinel")).toBe("orbit");
  });

  it("bomber defaults to zigzag", () => {
    expect(getDefaultBehaviorForEnemy("bomber")).toBe("zigzag");
  });

  it("unknown enemy falls back to chase", () => {
    expect(getDefaultBehaviorForEnemy("unknown_enemy")).toBe("chase");
  });
});

// ════════════════════════════════════════════════════════════════
// § calculateFleeDirection
// ════════════════════════════════════════════════════════════════

describe("calculateFleeDirection", () => {
  it("flees right when player is to the left", () => {
    const result = calculateFleeDirection(50, 0, 0, 0);
    expect(result.dx).toBeGreaterThan(0);
    expect(result.dy).toBeCloseTo(0);
  });

  it("flees upward when player is below", () => {
    const result = calculateFleeDirection(0, 0, 0, 100);
    expect(result.dx).toBeCloseTo(0);
    expect(result.dy).toBeLessThan(0);
  });

  it("returns normalized vector", () => {
    const result = calculateFleeDirection(100, 100, 0, 0);
    const mag = Math.sqrt(result.dx ** 2 + result.dy ** 2);
    expect(mag).toBeCloseTo(1, 5);
  });

  it("returns zero vector when positions overlap", () => {
    const result = calculateFleeDirection(50, 50, 50, 50);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
  });

  it("is opposite direction to chase", () => {
    const state = createAIState("chase");
    const { movement } = getMovement(state, 100, 100, 300, 300, 0.016);
    const flee = calculateFleeDirection(100, 100, 300, 300);
    // Chase and flee should be opposite
    expect(movement.dx + flee.dx).toBeCloseTo(0, 4);
    expect(movement.dy + flee.dy).toBeCloseTo(0, 4);
  });
});

// ════════════════════════════════════════════════════════════════
// § getChargeWindup
// ════════════════════════════════════════════════════════════════

describe("getChargeWindup", () => {
  it("returns 0 for non-charge behavior", () => {
    const state = createAIState("chase");
    expect(getChargeWindup(state)).toBe(0);
  });

  it("returns 0 at start of windup", () => {
    const state = createAIState("charge");
    expect(getChargeWindup(state)).toBeCloseTo(0);
  });

  it("returns ~0.5 at midpoint of windup", () => {
    const state: AIState = { ...createAIState("charge"), timer: 0.4 };
    expect(getChargeWindup(state)).toBeCloseTo(0.5, 1);
  });

  it("returns close to 1 at end of windup", () => {
    const state: AIState = { ...createAIState("charge"), timer: 0.79 };
    expect(getChargeWindup(state)).toBeCloseTo(1, 1);
  });

  it("returns 0 during dash phase", () => {
    const state: AIState = { ...createAIState("charge"), timer: 1.0 };
    expect(getChargeWindup(state)).toBe(0);
  });

  it("returns 0 during pause phase", () => {
    const state: AIState = { ...createAIState("charge"), timer: 2.0 };
    expect(getChargeWindup(state)).toBe(0);
  });

  it("cycles back to windup after full cycle", () => {
    // Full cycle = 0.8 + 1.0 + 0.5 = 2.3
    const state: AIState = { ...createAIState("charge"), timer: 2.3 + 0.4 };
    expect(getChargeWindup(state)).toBeCloseTo(0.5, 1);
  });
});
