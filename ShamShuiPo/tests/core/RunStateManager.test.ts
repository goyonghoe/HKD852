// ── Tests: RunStateManager ──

import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tick,
  applyJoystickInput,
  grantXp,
  addWeapon,
  upgradeWeapon,
  addPassive,
  upgradePassive,
  damagePlayer,
  healPlayer,
  resumePlaying,
} from "../../src/core/RunStateManager";
import {
  PLAYER_BASE,
  GAME_WIDTH,
  GAME_HEIGHT,
  RUN,
} from "../../src/config/balance";

describe("createInitialState", () => {
  it("creates a valid initial state with starting weapon", () => {
    const state = createInitialState("pistol");
    expect(state.player.hp).toBe(PLAYER_BASE.hp);
    expect(state.player.maxHp).toBe(PLAYER_BASE.hp);
    expect(state.player.weapons).toHaveLength(1);
    expect(state.player.weapons[0].weaponId).toBe("pistol");
    expect(state.player.weapons[0].level).toBe(1);
    expect(state.player.level).toBe(1);
    expect(state.player.xp).toBe(0);
    expect(state.elapsed).toBe(0);
    expect(state.phase).toBe("playing");
  });

  it("places player at center of screen", () => {
    const state = createInitialState("pistol");
    expect(state.player.x).toBe(GAME_WIDTH / 2);
    expect(state.player.y).toBe(GAME_HEIGHT / 2);
  });
});

describe("tick", () => {
  it("advances elapsed time", () => {
    const state = createInitialState("pistol");
    tick(state, 1.5);
    expect(state.elapsed).toBeCloseTo(1.5);
  });

  it("triggers victory at overtime", () => {
    const state = createInitialState("pistol");
    state.elapsed = RUN.overtimeStart - 0.1;
    tick(state, 0.2);
    expect(state.phase).toBe("victory");
  });

  it("returns new minute index on minute change", () => {
    const state = createInitialState("pistol");
    state.elapsed = 59.9;
    const result = tick(state, 0.2);
    expect(result).toBe(1);
  });

  it("reduces weapon cooldown timers", () => {
    const state = createInitialState("pistol");
    state.player.weapons[0].cooldownTimer = 1.0;
    tick(state, 0.5);
    expect(state.player.weapons[0].cooldownTimer).toBeCloseTo(0.5);
  });

  it("reduces invincibility timer", () => {
    const state = createInitialState("pistol");
    state.player.invincibilityTimer = 0.5;
    tick(state, 0.3);
    expect(state.player.invincibilityTimer).toBeCloseTo(0.2);
  });
});

describe("applyJoystickInput", () => {
  it("moves player based on joystick input", () => {
    const state = createInitialState("pistol");
    const startX = state.player.x;
    applyJoystickInput(state, 1, 0, 1);
    expect(state.player.x).toBeGreaterThan(startX);
  });

  it("clamps player to world bounds", () => {
    const state = createInitialState("pistol");
    state.player.x = 0;
    applyJoystickInput(state, -1, 0, 1);
    expect(state.player.x).toBeGreaterThanOrEqual(24);
  });

  it("does nothing with zero input", () => {
    const state = createInitialState("pistol");
    const startX = state.player.x;
    const startY = state.player.y;
    applyJoystickInput(state, 0, 0, 1);
    expect(state.player.x).toBe(startX);
    expect(state.player.y).toBe(startY);
  });
});

describe("weapon management", () => {
  it("adds a new weapon", () => {
    const state = createInitialState("pistol");
    const result = addWeapon(state, "shotgun");
    expect(result).toBe(true);
    expect(state.player.weapons).toHaveLength(2);
  });

  it("rejects duplicate weapon", () => {
    const state = createInitialState("pistol");
    const result = addWeapon(state, "pistol");
    expect(result).toBe(false);
  });

  it("rejects when slots full", () => {
    const state = createInitialState("pistol");
    addWeapon(state, "shotgun");
    addWeapon(state, "laser");
    addWeapon(state, "missile");
    addWeapon(state, "boomerang");
    addWeapon(state, "lightning");
    expect(state.player.weapons).toHaveLength(6);
    const result = addWeapon(state, "flamethrower");
    expect(result).toBe(false);
  });

  it("upgrades an existing weapon", () => {
    const state = createInitialState("pistol");
    const result = upgradeWeapon(state, "pistol");
    expect(result).toBe(true);
    expect(state.player.weapons[0].level).toBe(2);
  });
});

describe("damage and healing", () => {
  it("damages player with armor reduction", () => {
    const state = createInitialState("pistol");
    const dmg = damagePlayer(state, 20);
    expect(dmg).toBe(20); // base armor is 0
    expect(state.player.hp).toBe(PLAYER_BASE.hp - 20);
  });

  it("sets invincibility after damage", () => {
    const state = createInitialState("pistol");
    damagePlayer(state, 10);
    expect(state.player.invincibilityTimer).toBeGreaterThan(0);
  });

  it("ignores damage during invincibility", () => {
    const state = createInitialState("pistol");
    damagePlayer(state, 10);
    const dmg2 = damagePlayer(state, 10);
    expect(dmg2).toBe(0);
  });

  it("triggers game_over when HP reaches 0", () => {
    const state = createInitialState("pistol");
    damagePlayer(state, PLAYER_BASE.hp + 100);
    expect(state.phase).toBe("game_over");
  });

  it("heals player capped at maxHp", () => {
    const state = createInitialState("pistol");
    state.player.hp = 50;
    const healed = healPlayer(state, 200);
    expect(state.player.hp).toBe(state.player.maxHp);
    expect(healed).toBe(state.player.maxHp - 50);
  });
});

describe("passive management", () => {
  it("adds a passive", () => {
    const state = createInitialState("pistol");
    const result = addPassive(state, "damage");
    expect(result).toBe(true);
    expect(state.player.passives).toHaveLength(1);
  });

  it("upgrades a passive", () => {
    const state = createInitialState("pistol");
    addPassive(state, "damage");
    const result = upgradePassive(state, "damage");
    expect(result).toBe(true);
    expect(state.player.passives[0].level).toBe(2);
  });

  it("hp passive increases maxHp", () => {
    const state = createInitialState("pistol");
    addPassive(state, "hp");
    expect(state.player.maxHp).toBeGreaterThan(PLAYER_BASE.hp);
  });
});

describe("phase management", () => {
  it("resumes playing from level_up", () => {
    const state = createInitialState("pistol");
    state.phase = "level_up";
    resumePlaying(state);
    expect(state.phase).toBe("playing");
  });
});
