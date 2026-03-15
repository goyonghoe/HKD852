// DashCalc.ts — Pure TypeScript dash/dodge mechanic (no Phaser imports)

export interface DashConfig {
  readonly distance: number; // pixels
  readonly duration: number; // ms
  readonly cooldown: number; // ms (unused legacy, kept for compat)
  readonly iFrames: boolean; // invincible during dash
  readonly maxCharges: number;
  readonly rechargeTime: number; // ms per charge
}

export interface DashState {
  readonly config: DashConfig;
  readonly charges: number;
  readonly isDashing: boolean;
  readonly dashElapsed: number;
  readonly cooldownElapsed: number;
  readonly rechargeElapsed: number;
  readonly dashDirX: number;
  readonly dashDirY: number;
  readonly startX: number;
  readonly startY: number;
}

const DEFAULT_CONFIG: DashConfig = {
  distance: 150,
  duration: 200,
  cooldown: 1000,
  iFrames: true,
  maxCharges: 2,
  rechargeTime: 3000,
};

export function createDashState(config?: Partial<DashConfig>): DashState {
  const merged: DashConfig = { ...DEFAULT_CONFIG, ...config };
  return {
    config: merged,
    charges: merged.maxCharges,
    isDashing: false,
    dashElapsed: 0,
    cooldownElapsed: 0,
    rechargeElapsed: 0,
    dashDirX: 0,
    dashDirY: 0,
    startX: 0,
    startY: 0,
  };
}

export function canDash(state: DashState): boolean {
  return !state.isDashing && state.charges > 0;
}

export function startDash(
  state: DashState,
  dirX: number,
  dirY: number,
  startX: number,
  startY: number,
): DashState {
  if (!canDash(state)) return state;

  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  const normX = len === 0 ? 0 : dirX / len;
  const normY = len === 0 ? 0 : dirY / len;

  return {
    ...state,
    isDashing: true,
    dashElapsed: 0,
    charges: state.charges - 1,
    dashDirX: normX,
    dashDirY: normY,
    startX,
    startY,
  };
}

export function updateDash(state: DashState, deltaMs: number): DashState {
  let { isDashing, dashElapsed, rechargeElapsed, charges } = state;
  const { config } = state;

  // Advance dash timer
  if (isDashing) {
    dashElapsed = dashElapsed + deltaMs;
    if (dashElapsed >= config.duration) {
      isDashing = false;
    }
  }

  // Advance recharge timer
  if (charges < config.maxCharges) {
    rechargeElapsed = rechargeElapsed + deltaMs;
    while (
      rechargeElapsed >= config.rechargeTime &&
      charges < config.maxCharges
    ) {
      rechargeElapsed = rechargeElapsed - config.rechargeTime;
      charges = charges + 1;
    }
    // Clamp leftover if fully recharged
    if (charges >= config.maxCharges) {
      rechargeElapsed = 0;
    }
  }

  return {
    ...state,
    isDashing,
    dashElapsed,
    rechargeElapsed,
    charges,
  };
}

export function getDashPosition(state: DashState): { x: number; y: number } {
  if (!state.isDashing && state.dashElapsed === 0) {
    return { x: state.startX, y: state.startY };
  }

  const t = Math.min(Math.max(state.dashElapsed / state.config.duration, 0), 1);
  return {
    x: state.startX + state.dashDirX * state.config.distance * t,
    y: state.startY + state.dashDirY * state.config.distance * t,
  };
}

export function isDashComplete(state: DashState): boolean {
  return (
    !state.isDashing &&
    state.dashElapsed >= state.config.duration &&
    state.dashElapsed > 0
  );
}

export function isInvincible(state: DashState): boolean {
  return state.isDashing && state.config.iFrames;
}

export function getCharges(state: DashState): number {
  return state.charges;
}

export function getCooldownPercent(state: DashState): number {
  if (state.charges >= state.config.maxCharges) return 0;
  return Math.min(
    Math.max(state.rechargeElapsed / state.config.rechargeTime, 0),
    1,
  );
}

export function resetDash(state: DashState): DashState {
  return {
    ...state,
    charges: state.config.maxCharges,
    isDashing: false,
    dashElapsed: 0,
    cooldownElapsed: 0,
    rechargeElapsed: 0,
    dashDirX: 0,
    dashDirY: 0,
    startX: 0,
    startY: 0,
  };
}
