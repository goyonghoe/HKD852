// ── Neon Survivors: Run State Manager ──
// Pure TypeScript — NO Phaser imports.
// Manages all run state: player, enemies, projectiles, XP gems, phases.

import {
  PLAYER_BASE,
  WEAPONS,
  PASSIVES,
  RUN,
  GAME_WIDTH,
  GAME_HEIGHT,
  WEAPON_LEVEL_SCALING,
} from "../config/balance";
import { getXpForLevel, addXp } from "./XpCalc";
import { loadSave, getMetaBonuses } from "./MetaCalc";
import type {
  RunState,
  PlayerState,
  WeaponSlot,
  PassiveSlot,
  RunPhase,
} from "../types/game";

// ════════════════════════════════════════════════════════════════
// § FACTORY
// ════════════════════════════════════════════════════════════════

export function createInitialState(startingWeapon: string): RunState {
  // Apply meta progression bonuses to starting stats
  const metaSave = loadSave();
  const metaBonuses = getMetaBonuses(metaSave);

  const baseHp = PLAYER_BASE.hp + metaBonuses.maxHpBonus;
  const baseSpeed = PLAYER_BASE.speed * (1 + metaBonuses.moveSpeedBonus);

  const player: PlayerState = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    hp: baseHp,
    maxHp: baseHp,
    speed: baseSpeed,
    weapons: [
      {
        weaponId: startingWeapon,
        level: 1,
        cooldownTimer: 0,
      },
    ],
    passives: [],
    xp: 0,
    level: 1,
    coins: 0,
    diamonds: 0,
    invincibilityTimer: 0,
  };

  return {
    elapsed: 0,
    phase: "playing",
    player,
    enemies: [],
    projectiles: [],
    xpGems: [],
    coinDrops: [],
    healthPickups: [],
    waveMinute: 0,
    bossesSpawned: [],
    score: 0,
    kills: 0,
  };
}

// ════════════════════════════════════════════════════════════════
// § TICK
// ════════════════════════════════════════════════════════════════

/**
 * Advance elapsed time and check phase transitions.
 * Returns the new minute index if it changed, or -1 if unchanged.
 */
export function tick(state: RunState, dt: number): number {
  if (state.phase !== "playing" && state.phase !== "boss") return -1;

  state.elapsed += dt;

  // Check overtime victory
  if (state.elapsed >= RUN.overtimeStart) {
    state.phase = "victory";
    return -1;
  }

  // Update wave minute
  const newMinute = Math.min(Math.floor(state.elapsed / 60), 10);
  const changed = newMinute !== state.waveMinute;
  state.waveMinute = newMinute;

  // Update player invincibility
  if (state.player.invincibilityTimer > 0) {
    state.player.invincibilityTimer = Math.max(
      0,
      state.player.invincibilityTimer - dt,
    );
  }

  // Update weapon cooldowns
  for (const weapon of state.player.weapons) {
    if (weapon.cooldownTimer > 0) {
      weapon.cooldownTimer = Math.max(0, weapon.cooldownTimer - dt);
    }
  }

  // Regen
  const regenPassive = state.player.passives.find(
    (p) => p.passiveId === "regen",
  );
  if (regenPassive) {
    const regenDef = PASSIVES.regen;
    const regenRate = regenDef.values[regenPassive.level - 1];
    state.player.hp = Math.min(
      state.player.maxHp,
      state.player.hp + regenRate * dt,
    );
  }

  return changed ? newMinute : -1;
}

// ════════════════════════════════════════════════════════════════
// § PLAYER MOVEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Apply joystick input to player position.
 * @param dx Normalized joystick X (-1 to 1)
 * @param dy Normalized joystick Y (-1 to 1)
 */
export function applyJoystickInput(
  state: RunState,
  dx: number,
  dy: number,
  dt: number,
): void {
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 0.01) return;

  // Calculate effective speed with passive bonuses
  const speedBonus = getPassiveValue(state.player.passives, "speed");
  const effectiveSpeed = state.player.speed * (1 + speedBonus);

  const nx = dx / mag;
  const ny = dy / mag;
  const moveScale = Math.min(mag, 1); // clamp magnitude to 1

  state.player.x += nx * effectiveSpeed * moveScale * dt;
  state.player.y += ny * effectiveSpeed * moveScale * dt;

  // Clamp to world bounds (with some margin)
  const margin = 24;
  state.player.x = Math.max(
    margin,
    Math.min(GAME_WIDTH - margin, state.player.x),
  );
  state.player.y = Math.max(
    margin,
    Math.min(GAME_HEIGHT - margin, state.player.y),
  );
}

// ════════════════════════════════════════════════════════════════
// § XP & LEVELING
// ════════════════════════════════════════════════════════════════

/**
 * Add XP to player. Returns number of levels gained (triggers level_up phase).
 */
export function grantXp(state: RunState, amount: number): number {
  const xpBonus = getPassiveValue(state.player.passives, "xp_bonus");
  const result = addXp(state.player.xp, amount, xpBonus);
  state.player.xp = result.newXp;

  if (result.levelsGained > 0) {
    state.player.level += result.levelsGained;
    state.phase = "level_up";
  }

  return result.levelsGained;
}

// ════════════════════════════════════════════════════════════════
// § WEAPON & PASSIVE MANAGEMENT
// ════════════════════════════════════════════════════════════════

export function addWeapon(state: RunState, weaponId: string): boolean {
  if (state.player.weapons.length >= RUN.maxWeaponSlots) return false;
  if (state.player.weapons.some((w) => w.weaponId === weaponId)) return false;
  if (!WEAPONS[weaponId]) return false;

  state.player.weapons.push({
    weaponId,
    level: 1,
    cooldownTimer: 0,
  });
  return true;
}

export function upgradeWeapon(state: RunState, weaponId: string): boolean {
  const slot = state.player.weapons.find((w) => w.weaponId === weaponId);
  if (!slot) return false;

  const maxLevel = WEAPON_LEVEL_SCALING.damageMultiplier.length;
  if (slot.level >= maxLevel) return false;

  slot.level++;
  return true;
}

export function addPassive(state: RunState, passiveId: string): boolean {
  if (state.player.passives.length >= RUN.maxPassiveSlots) return false;
  if (state.player.passives.some((p) => p.passiveId === passiveId))
    return false;

  const def = PASSIVES[passiveId];
  if (!def) return false;

  state.player.passives.push({
    passiveId,
    level: 1,
  });

  // Apply immediate stat changes
  applyPassiveEffects(state.player);
  return true;
}

export function upgradePassive(state: RunState, passiveId: string): boolean {
  const slot = state.player.passives.find((p) => p.passiveId === passiveId);
  if (!slot) return false;

  const def = PASSIVES[passiveId];
  if (!def) return false;
  if (slot.level >= def.maxLevel) return false;

  slot.level++;

  // Re-apply stat changes
  applyPassiveEffects(state.player);
  return true;
}

// ════════════════════════════════════════════════════════════════
// § DAMAGE
// ════════════════════════════════════════════════════════════════

/**
 * Apply damage to player, accounting for armor and invincibility.
 * Returns actual damage dealt.
 */
export function damagePlayer(state: RunState, amount: number): number {
  if (state.player.invincibilityTimer > 0) return 0;
  if (state.player.hp <= 0) return 0;

  const armor =
    PLAYER_BASE.armor + getPassiveValue(state.player.passives, "armor");
  const finalDamage = Math.max(1, amount - armor);

  state.player.hp = Math.max(0, state.player.hp - finalDamage);
  state.player.invincibilityTimer = PLAYER_BASE.invincibilityMs / 1000;

  if (state.player.hp <= 0) {
    state.phase = "game_over";
  }

  return finalDamage;
}

/**
 * Heal player by amount, capped at maxHp.
 */
export function healPlayer(state: RunState, amount: number): number {
  const before = state.player.hp;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
  return state.player.hp - before;
}

// ════════════════════════════════════════════════════════════════
// § PHASE MANAGEMENT
// ════════════════════════════════════════════════════════════════

export function setPhase(state: RunState, phase: RunPhase): void {
  state.phase = phase;
}

export function resumePlaying(state: RunState): void {
  state.phase = "playing";
}

// ════════════════════════════════════════════════════════════════
// § HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Get the current value of a passive by ID.
 * Returns 0 if the player doesn't have it.
 */
export function getPassiveValue(
  passives: PassiveSlot[],
  passiveId: string,
): number {
  const slot = passives.find((p) => p.passiveId === passiveId);
  if (!slot) return 0;

  const def = PASSIVES[passiveId];
  if (!def) return 0;

  return def.values[slot.level - 1];
}

/**
 * Recompute player stats affected by passives (hp, speed).
 * Called after adding/upgrading passives.
 */
function applyPassiveEffects(player: PlayerState): void {
  // Max HP = base + hp passive flat bonus
  const hpBonus = getPassiveValue(player.passives, "hp");
  player.maxHp = PLAYER_BASE.hp + hpBonus;
  player.hp = Math.min(player.hp, player.maxHp);

  // Speed = base (movement is calculated dynamically in applyJoystickInput)
  player.speed = PLAYER_BASE.speed;
}
