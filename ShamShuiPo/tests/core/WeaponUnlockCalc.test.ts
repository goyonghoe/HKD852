import { describe, it, expect } from "vitest";
import {
  createWeaponUnlockState,
  getWeaponConfigs,
  updateProgress,
  checkUnlocks,
  isWeaponUnlocked,
  getUnlockedWeapons,
  getLockedWeapons,
  getWeaponProgress,
  getAllProgress,
  getNextUnlock,
  getUnlockPercent,
  getHintForWeapon,
  forceUnlock,
  serialize,
  deserialize,
  getAchievementValue,
  type WeaponUnlockState,
} from "../../src/core/WeaponUnlockCalc";

// ── createWeaponUnlockState ────────────────────────────────────────

describe("createWeaponUnlockState", () => {
  it("should create state with pistol unlocked by default", () => {
    const state = createWeaponUnlockState();
    expect(state.unlockedWeapons.has("pistol")).toBe(true);
  });

  it("should have only pistol unlocked initially", () => {
    const state = createWeaponUnlockState();
    expect(state.unlockedWeapons.size).toBe(1);
  });

  it("should initialize progress entries for all non-starter weapons", () => {
    const state = createWeaponUnlockState();
    expect(state.progress["smg"]).toBeDefined();
    expect(state.progress["shotgun"]).toBeDefined();
    expect(state.progress["sniper"]).toBeDefined();
    expect(state.progress["laser"]).toBeDefined();
    expect(state.progress["grenade"]).toBeDefined();
    expect(state.progress["flame_thrower"]).toBeDefined();
    expect(state.progress["drone"]).toBeDefined();
  });

  it("should not have progress entry for pistol (starter weapon)", () => {
    const state = createWeaponUnlockState();
    expect(state.progress["pistol"]).toBeUndefined();
  });

  it("should initialize all progress values to 0", () => {
    const state = createWeaponUnlockState();
    expect(state.progress["smg"]["kills"]).toBe(0);
    expect(state.progress["shotgun"]["level"]).toBe(0);
    expect(state.progress["sniper"]["score"]).toBe(0);
  });
});

// ── getWeaponConfigs ───────────────────────────────────────────────

describe("getWeaponConfigs", () => {
  it("should return 8 weapon configs", () => {
    expect(getWeaponConfigs()).toHaveLength(8);
  });

  it("should have pistol as a starter weapon", () => {
    const configs = getWeaponConfigs();
    const pistol = configs.find((c) => c.weaponId === "pistol");
    expect(pistol?.isStarterWeapon).toBe(true);
  });

  it("should have no conditions on starter weapon", () => {
    const configs = getWeaponConfigs();
    const pistol = configs.find((c) => c.weaponId === "pistol");
    expect(pistol?.conditions).toHaveLength(0);
  });

  it("should have smg require 50 kills", () => {
    const configs = getWeaponConfigs();
    const smg = configs.find((c) => c.weaponId === "smg");
    expect(smg?.conditions[0]).toEqual({ type: "kills", target: 50 });
  });
});

// ── updateProgress ─────────────────────────────────────────────────

describe("updateProgress", () => {
  it("should update kills progress for smg", () => {
    const state = createWeaponUnlockState();
    const updated = updateProgress(state, "kills", 25);
    expect(updated.progress["smg"]["kills"]).toBe(25);
  });

  it("should return new state object (immutable)", () => {
    const state = createWeaponUnlockState();
    const updated = updateProgress(state, "kills", 10);
    expect(updated).not.toBe(state);
    expect(state.progress["smg"]["kills"]).toBe(0);
  });

  it("should return same state if value unchanged", () => {
    const state = createWeaponUnlockState();
    const updated = updateProgress(state, "kills", 0);
    expect(updated).toBe(state);
  });

  it("should update level progress for shotgun", () => {
    const state = createWeaponUnlockState();
    const updated = updateProgress(state, "level", 5);
    expect(updated.progress["shotgun"]["level"]).toBe(5);
  });

  it("should not affect unrelated weapons", () => {
    const state = createWeaponUnlockState();
    const updated = updateProgress(state, "kills", 30);
    expect(updated.progress["shotgun"]["level"]).toBe(0);
  });

  it("should handle multiple sequential updates", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 25);
    state = updateProgress(state, "kills", 50);
    expect(state.progress["smg"]["kills"]).toBe(50);
  });
});

// ── checkUnlocks ───────────────────────────────────────────────────

describe("checkUnlocks", () => {
  it("should unlock smg when kills reach 50", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("smg");
    expect(result.state.unlockedWeapons.has("smg")).toBe(true);
  });

  it("should not unlock smg when kills below 50", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 49);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).not.toContain("smg");
  });

  it("should unlock shotgun at level 5", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "level", 5);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("shotgun");
  });

  it("should unlock sniper at score 10000", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "score", 10_000);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("sniper");
  });

  it("should unlock laser after 3 boss kills", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "boss_kills", 3);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("laser");
  });

  it("should unlock grenade after 10 runs", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "runs", 10);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("grenade");
  });

  it("should unlock flame_thrower at prestige 1", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "prestige", 1);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("flame_thrower");
  });

  it("should unlock drone with achievement value 1", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "achievement", 1);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("drone");
  });

  it("should unlock multiple weapons simultaneously", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    state = updateProgress(state, "level", 5);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("smg");
    expect(result.newUnlocks).toContain("shotgun");
    expect(result.newUnlocks.length).toBe(2);
  });

  it("should not re-unlock already unlocked weapons", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const first = checkUnlocks(state);
    const second = checkUnlocks(first.state);
    expect(second.newUnlocks).toHaveLength(0);
  });

  it("should return same state reference when no new unlocks", () => {
    const state = createWeaponUnlockState();
    const result = checkUnlocks(state);
    expect(result.state).toBe(state);
    expect(result.newUnlocks).toHaveLength(0);
  });

  it("should accept values exceeding targets", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 999);
    const result = checkUnlocks(state);
    expect(result.newUnlocks).toContain("smg");
  });
});

// ── isWeaponUnlocked ───────────────────────────────────────────────

describe("isWeaponUnlocked", () => {
  it("should return true for pistol on fresh state", () => {
    const state = createWeaponUnlockState();
    expect(isWeaponUnlocked(state, "pistol")).toBe(true);
  });

  it("should return false for smg on fresh state", () => {
    const state = createWeaponUnlockState();
    expect(isWeaponUnlocked(state, "smg")).toBe(false);
  });

  it("should return false for unknown weapon", () => {
    const state = createWeaponUnlockState();
    expect(isWeaponUnlocked(state, "railgun")).toBe(false);
  });
});

// ── getUnlockedWeapons / getLockedWeapons ──────────────────────────

describe("getUnlockedWeapons", () => {
  it("should return only pistol initially", () => {
    const state = createWeaponUnlockState();
    expect(getUnlockedWeapons(state)).toEqual(["pistol"]);
  });

  it("should include newly unlocked weapons", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const { state: s2 } = checkUnlocks(state);
    const unlocked = getUnlockedWeapons(s2);
    expect(unlocked).toContain("pistol");
    expect(unlocked).toContain("smg");
  });
});

describe("getLockedWeapons", () => {
  it("should return 7 locked weapons initially", () => {
    const state = createWeaponUnlockState();
    expect(getLockedWeapons(state)).toHaveLength(7);
  });

  it("should not include pistol in locked weapons", () => {
    const state = createWeaponUnlockState();
    expect(getLockedWeapons(state)).not.toContain("pistol");
  });

  it("should decrease locked count after unlock", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const { state: s2 } = checkUnlocks(state);
    expect(getLockedWeapons(s2)).toHaveLength(6);
  });
});

// ── getWeaponProgress ──────────────────────────────────────────────

describe("getWeaponProgress", () => {
  it("should return progress=1 for starter weapon", () => {
    const state = createWeaponUnlockState();
    const p = getWeaponProgress(state, "pistol");
    expect(p.isUnlocked).toBe(true);
    expect(p.progress).toBe(1);
    expect(p.conditions).toHaveLength(0);
  });

  it("should return 0 progress for untouched weapon", () => {
    const state = createWeaponUnlockState();
    const p = getWeaponProgress(state, "smg");
    expect(p.progress).toBe(0);
    expect(p.isUnlocked).toBe(false);
  });

  it("should return partial progress", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 25);
    const p = getWeaponProgress(state, "smg");
    expect(p.progress).toBeCloseTo(0.5);
    expect(p.conditions[0].current).toBe(25);
    expect(p.conditions[0].target).toBe(50);
  });

  it("should cap current at target in progress display", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 100);
    const p = getWeaponProgress(state, "smg");
    expect(p.conditions[0].current).toBe(50);
  });

  it("should return empty progress for unknown weapon", () => {
    const state = createWeaponUnlockState();
    const p = getWeaponProgress(state, "unknown_weapon");
    expect(p.weaponId).toBe("unknown_weapon");
    expect(p.isUnlocked).toBe(false);
    expect(p.progress).toBe(0);
  });
});

// ── getAllProgress ──────────────────────────────────────────────────

describe("getAllProgress", () => {
  it("should return progress for all 8 weapons", () => {
    const state = createWeaponUnlockState();
    const all = getAllProgress(state);
    expect(all).toHaveLength(8);
  });

  it("should include pistol as unlocked", () => {
    const state = createWeaponUnlockState();
    const all = getAllProgress(state);
    const pistol = all.find((p) => p.weaponId === "pistol");
    expect(pistol?.isUnlocked).toBe(true);
  });
});

// ── getNextUnlock ──────────────────────────────────────────────────

describe("getNextUnlock", () => {
  it("should return a weapon on fresh state", () => {
    const state = createWeaponUnlockState();
    const next = getNextUnlock(state);
    expect(next).not.toBeNull();
    expect(next!.isUnlocked).toBe(false);
  });

  it("should return the weapon with most progress", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 40); // smg: 40/50 = 80%
    state = updateProgress(state, "level", 1); // shotgun: 1/5 = 20%
    const next = getNextUnlock(state);
    expect(next!.weaponId).toBe("smg");
  });

  it("should return null when all weapons unlocked", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    state = updateProgress(state, "level", 5);
    state = updateProgress(state, "score", 10_000);
    state = updateProgress(state, "boss_kills", 3);
    state = updateProgress(state, "runs", 10);
    state = updateProgress(state, "prestige", 1);
    state = updateProgress(state, "achievement", 1);
    const { state: s2 } = checkUnlocks(state);
    const next = getNextUnlock(s2);
    expect(next).toBeNull();
  });

  it("should skip already unlocked weapons", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const { state: s2 } = checkUnlocks(state);
    // smg is now unlocked; next should not be smg
    const next = getNextUnlock(s2);
    expect(next!.weaponId).not.toBe("smg");
  });
});

// ── getUnlockPercent ───────────────────────────────────────────────

describe("getUnlockPercent", () => {
  it("should return 1/8 on fresh state", () => {
    const state = createWeaponUnlockState();
    expect(getUnlockPercent(state)).toBeCloseTo(1 / 8);
  });

  it("should return 1.0 when all unlocked", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    state = updateProgress(state, "level", 5);
    state = updateProgress(state, "score", 10_000);
    state = updateProgress(state, "boss_kills", 3);
    state = updateProgress(state, "runs", 10);
    state = updateProgress(state, "prestige", 1);
    state = updateProgress(state, "achievement", 1);
    const { state: s2 } = checkUnlocks(state);
    expect(getUnlockPercent(s2)).toBe(1);
  });
});

// ── getHintForWeapon ───────────────────────────────────────────────

describe("getHintForWeapon", () => {
  it("should return hint for pistol", () => {
    expect(getHintForWeapon("pistol")).toContain("always unlocked");
  });

  it("should return hint for smg mentioning 50 enemies", () => {
    expect(getHintForWeapon("smg")).toContain("50");
  });

  it("should return hint for drone mentioning combo_king", () => {
    expect(getHintForWeapon("drone")).toContain("combo_king");
  });

  it("should return fallback for unknown weapon", () => {
    expect(getHintForWeapon("railgun")).toContain("Unknown weapon");
  });
});

// ── forceUnlock ────────────────────────────────────────────────────

describe("forceUnlock", () => {
  it("should unlock a locked weapon", () => {
    const state = createWeaponUnlockState();
    const updated = forceUnlock(state, "laser");
    expect(updated.unlockedWeapons.has("laser")).toBe(true);
  });

  it("should return same state if already unlocked", () => {
    const state = createWeaponUnlockState();
    const updated = forceUnlock(state, "pistol");
    expect(updated).toBe(state);
  });

  it("should return same state for unknown weapon", () => {
    const state = createWeaponUnlockState();
    const updated = forceUnlock(state, "banana_launcher");
    expect(updated).toBe(state);
  });

  it("should not mutate original state", () => {
    const state = createWeaponUnlockState();
    forceUnlock(state, "laser");
    expect(state.unlockedWeapons.has("laser")).toBe(false);
  });
});

// ── serialize / deserialize ────────────────────────────────────────

describe("serialize / deserialize", () => {
  it("should round-trip a fresh state", () => {
    const state = createWeaponUnlockState();
    const json = serialize(state);
    const restored = deserialize(json);
    expect(restored.unlockedWeapons.has("pistol")).toBe(true);
    expect(restored.unlockedWeapons.size).toBe(1);
  });

  it("should produce JSON-safe output (no Set)", () => {
    const state = createWeaponUnlockState();
    const json = serialize(state);
    expect(Array.isArray(json.unlockedWeapons)).toBe(true);
  });

  it("should round-trip state with progress", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 35);
    const json = serialize(state);
    const restored = deserialize(json);
    expect(restored.progress["smg"]["kills"]).toBe(35);
  });

  it("should round-trip state with unlocks", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    const { state: s2 } = checkUnlocks(state);
    const json = serialize(s2);
    const restored = deserialize(json);
    expect(restored.unlockedWeapons.has("smg")).toBe(true);
    expect(restored.unlockedWeapons.has("pistol")).toBe(true);
  });

  it("should survive JSON.stringify/JSON.parse cycle", () => {
    let state = createWeaponUnlockState();
    state = updateProgress(state, "kills", 50);
    state = updateProgress(state, "level", 3);
    const { state: s2 } = checkUnlocks(state);
    const raw = JSON.stringify(serialize(s2));
    const restored = deserialize(JSON.parse(raw));
    expect(restored.unlockedWeapons.has("smg")).toBe(true);
    expect(restored.progress["shotgun"]["level"]).toBe(3);
  });
});

// ── getAchievementValue ────────────────────────────────────────────

describe("getAchievementValue", () => {
  it("should return 1 for combo_king", () => {
    expect(getAchievementValue("combo_king")).toBe(1);
  });

  it("should return 0 for unknown achievement", () => {
    expect(getAchievementValue("nonexistent")).toBe(0);
  });
});

// ── Integration: full unlock flow ──────────────────────────────────

describe("integration: full unlock flow", () => {
  it("should unlock all weapons through progressive play", () => {
    let state = createWeaponUnlockState();
    expect(getUnlockedWeapons(state)).toEqual(["pistol"]);

    // Simulate play sessions
    state = updateProgress(state, "kills", 50);
    state = updateProgress(state, "runs", 10);
    let result = checkUnlocks(state);
    state = result.state;
    expect(result.newUnlocks).toContain("smg");
    expect(result.newUnlocks).toContain("grenade");

    state = updateProgress(state, "level", 5);
    state = updateProgress(state, "score", 10_000);
    state = updateProgress(state, "boss_kills", 3);
    result = checkUnlocks(state);
    state = result.state;
    expect(result.newUnlocks).toContain("shotgun");
    expect(result.newUnlocks).toContain("sniper");
    expect(result.newUnlocks).toContain("laser");

    state = updateProgress(state, "prestige", 1);
    state = updateProgress(
      state,
      "achievement",
      getAchievementValue("combo_king"),
    );
    result = checkUnlocks(state);
    state = result.state;
    expect(result.newUnlocks).toContain("flame_thrower");
    expect(result.newUnlocks).toContain("drone");

    expect(getUnlockedWeapons(state)).toHaveLength(8);
    expect(getLockedWeapons(state)).toHaveLength(0);
    expect(getUnlockPercent(state)).toBe(1);
  });
});
