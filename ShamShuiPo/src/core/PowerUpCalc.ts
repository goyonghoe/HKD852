// PowerUpCalc.ts — pure TypeScript, NO Phaser imports.
// Temporary in-run power-up effects (bomb, invincibility, magnet burst, etc).

// ── Types ──

export type PowerUpType =
  | "bomb"
  | "magnet_burst"
  | "invincibility"
  | "double_damage"
  | "speed_boost"
  | "xp_magnet";

export interface PowerUp {
  type: PowerUpType;
  duration: number; // seconds remaining (0 = instant effect)
  value: number; // effect magnitude
  isActive: boolean;
}

export interface PowerUpState {
  active: PowerUp[];
  cooldowns: Record<string, number>; // type → seconds until available again
}

// ── Definitions ──

interface PowerUpDef {
  duration: number;
  value: number;
  cooldown: number;
}

const POWER_UP_DEFS: Record<PowerUpType, PowerUpDef> = {
  bomb: { duration: 0, value: 300, cooldown: 30 },
  magnet_burst: { duration: 3, value: 1, cooldown: 20 },
  invincibility: { duration: 5, value: 1, cooldown: 60 },
  double_damage: { duration: 8, value: 2, cooldown: 45 },
  speed_boost: { duration: 6, value: 1.5, cooldown: 30 },
  xp_magnet: { duration: 10, value: 3, cooldown: 25 },
};

// ── Functions ──

/** Create a fresh power-up state with no actives and no cooldowns. */
export function createPowerUpState(): PowerUpState {
  return { active: [], cooldowns: {} };
}

/** Look up the definition for a power-up type. */
export function getPowerUpDef(type: PowerUpType): {
  duration: number;
  value: number;
  cooldown: number;
} {
  return { ...POWER_UP_DEFS[type] };
}

/**
 * Activate a power-up. Adds it to the active list and starts its cooldown.
 * If already on cooldown, returns state unchanged.
 * If already active, returns state unchanged.
 */
export function activatePowerUp(
  state: PowerUpState,
  type: PowerUpType,
): PowerUpState {
  if (isOnCooldown(state, type)) return state;
  if (hasActivePowerUp(state, type)) return state;

  const def = POWER_UP_DEFS[type];
  const powerUp: PowerUp = {
    type,
    duration: def.duration,
    value: def.value,
    isActive: true,
  };

  const newActive =
    def.duration === 0
      ? [...state.active] // instant effects don't persist
      : [...state.active, powerUp];

  return {
    active: newActive,
    cooldowns: { ...state.cooldowns, [type]: def.cooldown },
  };
}

/**
 * Tick all active power-ups and cooldowns by dt seconds.
 * Removes expired power-ups and zeroed-out cooldowns.
 */
export function tickPowerUps(state: PowerUpState, dt: number): PowerUpState {
  const active = state.active
    .map((p) => ({ ...p, duration: p.duration - dt }))
    .filter((p) => p.duration > 0);

  const cooldowns: Record<string, number> = {};
  for (const [type, remaining] of Object.entries(state.cooldowns)) {
    const next = remaining - dt;
    if (next > 0) {
      cooldowns[type] = next;
    }
  }

  return { active, cooldowns };
}

/** Returns true if the power-up type is on cooldown. */
export function isOnCooldown(state: PowerUpState, type: PowerUpType): boolean {
  return (state.cooldowns[type] ?? 0) > 0;
}

/** Returns seconds remaining on cooldown (0 if not on cooldown). */
export function getCooldownRemaining(
  state: PowerUpState,
  type: PowerUpType,
): number {
  return Math.max(0, state.cooldowns[type] ?? 0);
}

/** Returns true if the power-up type is currently active. */
export function hasActivePowerUp(
  state: PowerUpState,
  type: PowerUpType,
): boolean {
  return state.active.some((p) => p.type === type && p.isActive);
}

/** Damage multiplier: 2x if double_damage active, else 1x. */
export function getDamageMultiplier(state: PowerUpState): number {
  return hasActivePowerUp(state, "double_damage") ? 2 : 1;
}

/** Speed multiplier: 1.5x if speed_boost active, else 1x. */
export function getSpeedMultiplier(state: PowerUpState): number {
  return hasActivePowerUp(state, "speed_boost") ? 1.5 : 1;
}

/** Magnet radius multiplier: 3x if xp_magnet active, else 1x. */
export function getMagnetMultiplier(state: PowerUpState): number {
  return hasActivePowerUp(state, "xp_magnet") ? 3 : 1;
}

/** Returns true if player is currently invincible. */
export function isInvincible(state: PowerUpState): boolean {
  return hasActivePowerUp(state, "invincibility");
}
