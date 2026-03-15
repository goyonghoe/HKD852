import { describe, it, expect } from "vitest";
import {
  createLifetimeState,
  addEntity,
  updateLifetimes,
  removeEntity,
  getEntity,
  isAlive,
  getRemainingTime,
  getLifetimePercent,
  getActiveCount,
  clearEntities,
  extendLifetime,
} from "../../src/core/LifetimeCalc";

// ─── createLifetimeState ───

describe("createLifetimeState", () => {
  it("creates empty state with default maxEntities=200", () => {
    const s = createLifetimeState();
    expect(s.entities).toEqual([]);
    expect(s.maxEntities).toBe(200);
  });

  it("accepts custom maxEntities", () => {
    const s = createLifetimeState(50);
    expect(s.maxEntities).toBe(50);
  });

  it("returns immutable entities array", () => {
    const s = createLifetimeState();
    expect(Object.isFrozen(s.entities) || Array.isArray(s.entities)).toBe(true);
  });
});

// ─── addEntity ───

describe("addEntity", () => {
  it("adds a single entity", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000);
    expect(s.entities).toHaveLength(1);
    expect(s.entities[0].id).toBe("p1");
  });

  it("sets default onExpireAction to destroy", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000);
    expect(s.entities[0].onExpireAction).toBe("destroy");
  });

  it("accepts custom onExpireAction", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000, "fade");
    expect(s.entities[0].onExpireAction).toBe("fade");
  });

  it("initializes elapsed to 0", () => {
    const s = addEntity(createLifetimeState(), "p1", 500);
    expect(s.entities[0].elapsed).toBe(0);
  });

  it("initializes active to true", () => {
    const s = addEntity(createLifetimeState(), "p1", 500);
    expect(s.entities[0].active).toBe(true);
  });

  it("preserves lifetime value", () => {
    const s = addEntity(createLifetimeState(), "p1", 3000);
    expect(s.entities[0].lifetime).toBe(3000);
  });

  it("adds multiple entities", () => {
    let s = createLifetimeState();
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200);
    s = addEntity(s, "c", 300);
    expect(s.entities).toHaveLength(3);
  });

  it("removes oldest when max exceeded", () => {
    let s = createLifetimeState(2);
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200);
    s = addEntity(s, "c", 300);
    expect(s.entities).toHaveLength(2);
    expect(s.entities[0].id).toBe("b");
    expect(s.entities[1].id).toBe("c");
  });

  it("removes multiple oldest when exceeding by more than 1", () => {
    let s = createLifetimeState(1);
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200); // a removed
    expect(s.entities).toHaveLength(1);
    expect(s.entities[0].id).toBe("b");
  });

  it("does not mutate original state", () => {
    const s1 = createLifetimeState();
    const s2 = addEntity(s1, "p1", 1000);
    expect(s1.entities).toHaveLength(0);
    expect(s2.entities).toHaveLength(1);
  });

  it("supports explode action", () => {
    const s = addEntity(createLifetimeState(), "bomb", 500, "explode");
    expect(s.entities[0].onExpireAction).toBe("explode");
  });

  it("supports none action", () => {
    const s = addEntity(createLifetimeState(), "fx", 200, "none");
    expect(s.entities[0].onExpireAction).toBe("none");
  });
});

// ─── updateLifetimes ───

describe("updateLifetimes", () => {
  it("advances elapsed time", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState } = updateLifetimes(s, 100);
    expect(newState.entities[0].elapsed).toBe(100);
  });

  it("keeps entity active before expiry", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState } = updateLifetimes(s, 500);
    expect(newState.entities[0].active).toBe(true);
  });

  it("deactivates entity at exact lifetime", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState, expired } = updateLifetimes(s, 1000);
    expect(newState.entities[0].active).toBe(false);
    expect(expired).toHaveLength(1);
  });

  it("deactivates entity past lifetime", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState, expired } = updateLifetimes(s, 1500);
    expect(newState.entities[0].active).toBe(false);
    expect(expired[0].id).toBe("p1");
  });

  it("returns expired action", () => {
    let s = addEntity(createLifetimeState(), "bomb", 100, "explode");
    const { expired } = updateLifetimes(s, 200);
    expect(expired[0].action).toBe("explode");
  });

  it("returns empty expired list when nothing expires", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { expired } = updateLifetimes(s, 10);
    expect(expired).toHaveLength(0);
  });

  it("handles multiple entities expiring at different times", () => {
    let s = createLifetimeState();
    s = addEntity(s, "short", 100);
    s = addEntity(s, "long", 1000);
    const { newState, expired } = updateLifetimes(s, 200);
    expect(expired).toHaveLength(1);
    expect(expired[0].id).toBe("short");
    expect(newState.entities[1].active).toBe(true);
  });

  it("does not re-expire already inactive entities", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState: s2 } = updateLifetimes(s, 200);
    const { expired } = updateLifetimes(s2, 100);
    expect(expired).toHaveLength(0);
  });

  it("accumulates elapsed across multiple updates", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState: s2 } = updateLifetimes(s, 300);
    const { newState: s3 } = updateLifetimes(s2, 300);
    expect(s3.entities[0].elapsed).toBe(600);
    expect(s3.entities[0].active).toBe(true);
  });

  it("expires on accumulated time reaching lifetime", () => {
    let s = addEntity(createLifetimeState(), "p1", 500);
    const { newState: s2 } = updateLifetimes(s, 250);
    const { newState: s3, expired } = updateLifetimes(s2, 250);
    expect(expired).toHaveLength(1);
    expect(s3.entities[0].active).toBe(false);
  });

  it("handles zero delta", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState, expired } = updateLifetimes(s, 0);
    expect(newState.entities[0].elapsed).toBe(0);
    expect(expired).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    const s = addEntity(createLifetimeState(), "p1", 100);
    updateLifetimes(s, 200);
    expect(s.entities[0].active).toBe(true);
    expect(s.entities[0].elapsed).toBe(0);
  });
});

// ─── removeEntity ───

describe("removeEntity", () => {
  it("removes entity by id", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    s = removeEntity(s, "p1");
    expect(s.entities).toHaveLength(0);
  });

  it("does nothing if id not found", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    s = removeEntity(s, "nonexistent");
    expect(s.entities).toHaveLength(1);
  });

  it("removes only the matching entity", () => {
    let s = createLifetimeState();
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200);
    s = removeEntity(s, "a");
    expect(s.entities).toHaveLength(1);
    expect(s.entities[0].id).toBe("b");
  });

  it("does not mutate original state", () => {
    const s1 = addEntity(createLifetimeState(), "p1", 1000);
    const s2 = removeEntity(s1, "p1");
    expect(s1.entities).toHaveLength(1);
    expect(s2.entities).toHaveLength(0);
  });
});

// ─── getEntity ───

describe("getEntity", () => {
  it("returns entity if found", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000, "fade");
    const e = getEntity(s, "p1");
    expect(e).not.toBeNull();
    expect(e!.id).toBe("p1");
    expect(e!.onExpireAction).toBe("fade");
  });

  it("returns null if not found", () => {
    const s = createLifetimeState();
    expect(getEntity(s, "missing")).toBeNull();
  });

  it("returns inactive entity too", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState } = updateLifetimes(s, 200);
    const e = getEntity(newState, "p1");
    expect(e).not.toBeNull();
    expect(e!.active).toBe(false);
  });
});

// ─── isAlive ───

describe("isAlive", () => {
  it("returns true for active entity", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000);
    expect(isAlive(s, "p1")).toBe(true);
  });

  it("returns false for expired entity", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState } = updateLifetimes(s, 200);
    expect(isAlive(newState, "p1")).toBe(false);
  });

  it("returns false for nonexistent entity", () => {
    const s = createLifetimeState();
    expect(isAlive(s, "nope")).toBe(false);
  });
});

// ─── getRemainingTime ───

describe("getRemainingTime", () => {
  it("returns full lifetime for fresh entity", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000);
    expect(getRemainingTime(s, "p1")).toBe(1000);
  });

  it("returns correct remaining after update", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState } = updateLifetimes(s, 300);
    expect(getRemainingTime(newState, "p1")).toBe(700);
  });

  it("returns 0 for expired entity", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState } = updateLifetimes(s, 500);
    expect(getRemainingTime(newState, "p1")).toBe(0);
  });

  it("returns 0 for nonexistent entity", () => {
    const s = createLifetimeState();
    expect(getRemainingTime(s, "nope")).toBe(0);
  });

  it("never returns negative", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState } = updateLifetimes(s, 9999);
    expect(getRemainingTime(newState, "p1")).toBe(0);
  });
});

// ─── getLifetimePercent ───

describe("getLifetimePercent", () => {
  it("returns 0 for fresh entity", () => {
    const s = addEntity(createLifetimeState(), "p1", 1000);
    expect(getLifetimePercent(s, "p1")).toBe(0);
  });

  it("returns 0.5 at halfway", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState } = updateLifetimes(s, 500);
    expect(getLifetimePercent(newState, "p1")).toBeCloseTo(0.5);
  });

  it("returns 1 at expiry", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    const { newState } = updateLifetimes(s, 1000);
    expect(getLifetimePercent(newState, "p1")).toBe(1);
  });

  it("clamps to 1 past expiry", () => {
    let s = addEntity(createLifetimeState(), "p1", 100);
    const { newState } = updateLifetimes(s, 999);
    expect(getLifetimePercent(newState, "p1")).toBe(1);
  });

  it("returns 0 for nonexistent entity", () => {
    const s = createLifetimeState();
    expect(getLifetimePercent(s, "nope")).toBe(0);
  });

  it("returns 0 for zero lifetime entity", () => {
    const s = addEntity(createLifetimeState(), "z", 0);
    expect(getLifetimePercent(s, "z")).toBe(0);
  });
});

// ─── getActiveCount ───

describe("getActiveCount", () => {
  it("returns 0 for empty state", () => {
    expect(getActiveCount(createLifetimeState())).toBe(0);
  });

  it("counts active entities", () => {
    let s = createLifetimeState();
    s = addEntity(s, "a", 1000);
    s = addEntity(s, "b", 1000);
    expect(getActiveCount(s)).toBe(2);
  });

  it("excludes expired entities", () => {
    let s = createLifetimeState();
    s = addEntity(s, "short", 100);
    s = addEntity(s, "long", 9999);
    const { newState } = updateLifetimes(s, 500);
    expect(getActiveCount(newState)).toBe(1);
  });
});

// ─── clearEntities ───

describe("clearEntities", () => {
  it("removes all entities", () => {
    let s = createLifetimeState();
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200);
    s = clearEntities(s);
    expect(s.entities).toHaveLength(0);
  });

  it("preserves maxEntities", () => {
    let s = createLifetimeState(50);
    s = addEntity(s, "a", 100);
    s = clearEntities(s);
    expect(s.maxEntities).toBe(50);
  });

  it("is safe on empty state", () => {
    const s = clearEntities(createLifetimeState());
    expect(s.entities).toHaveLength(0);
  });

  it("does not mutate original state", () => {
    const s1 = addEntity(createLifetimeState(), "a", 100);
    const s2 = clearEntities(s1);
    expect(s1.entities).toHaveLength(1);
    expect(s2.entities).toHaveLength(0);
  });
});

// ─── extendLifetime ───

describe("extendLifetime", () => {
  it("adds extra ms to entity lifetime", () => {
    let s = addEntity(createLifetimeState(), "p1", 1000);
    s = extendLifetime(s, "p1", 500);
    expect(s.entities[0].lifetime).toBe(1500);
  });

  it("can prevent expiry by extending", () => {
    let s = addEntity(createLifetimeState(), "p1", 500);
    const { newState: s2 } = updateLifetimes(s, 400);
    const s3 = extendLifetime(s2, "p1", 300);
    // remaining was 100, now 400
    expect(getRemainingTime(s3, "p1")).toBe(400);
  });

  it("does not affect other entities", () => {
    let s = createLifetimeState();
    s = addEntity(s, "a", 1000);
    s = addEntity(s, "b", 1000);
    s = extendLifetime(s, "a", 500);
    expect(s.entities[0].lifetime).toBe(1500);
    expect(s.entities[1].lifetime).toBe(1000);
  });

  it("does nothing for nonexistent id (no crash)", () => {
    let s = addEntity(createLifetimeState(), "a", 100);
    const s2 = extendLifetime(s, "missing", 999);
    expect(s2.entities).toHaveLength(1);
    expect(s2.entities[0].lifetime).toBe(100);
  });

  it("does not mutate original state", () => {
    const s1 = addEntity(createLifetimeState(), "p1", 1000);
    const s2 = extendLifetime(s1, "p1", 500);
    expect(s1.entities[0].lifetime).toBe(1000);
    expect(s2.entities[0].lifetime).toBe(1500);
  });
});

// ─── Integration / edge cases ───

describe("integration scenarios", () => {
  it("full lifecycle: add → update → expire → remove", () => {
    let s = createLifetimeState();
    s = addEntity(s, "bullet", 300, "destroy");
    expect(getActiveCount(s)).toBe(1);

    const { newState: s2, expired } = updateLifetimes(s, 300);
    expect(expired).toHaveLength(1);
    expect(expired[0]).toEqual({ id: "bullet", action: "destroy" });
    expect(getActiveCount(s2)).toBe(0);

    const s3 = removeEntity(s2, "bullet");
    expect(s3.entities).toHaveLength(0);
  });

  it("many entities with staggered lifetimes", () => {
    let s = createLifetimeState();
    for (let i = 0; i < 10; i++) {
      s = addEntity(s, `e${i}`, (i + 1) * 100);
    }
    // After 500ms, entities 0-4 (lifetime 100-500) should expire
    const { newState, expired } = updateLifetimes(s, 500);
    expect(expired).toHaveLength(5);
    expect(getActiveCount(newState)).toBe(5);
  });

  it("extend then update prevents expiry", () => {
    let s = addEntity(createLifetimeState(), "laser", 200, "fade");
    const { newState: s2 } = updateLifetimes(s, 150);
    const s3 = extendLifetime(s2, "laser", 200);
    // lifetime now 400, elapsed 150, remaining 250
    const { newState: s4, expired } = updateLifetimes(s3, 100);
    expect(expired).toHaveLength(0);
    expect(isAlive(s4, "laser")).toBe(true);
  });

  it("maxEntities=1 always keeps only latest", () => {
    let s = createLifetimeState(1);
    s = addEntity(s, "a", 100);
    s = addEntity(s, "b", 200);
    s = addEntity(s, "c", 300);
    expect(s.entities).toHaveLength(1);
    expect(s.entities[0].id).toBe("c");
  });
});
