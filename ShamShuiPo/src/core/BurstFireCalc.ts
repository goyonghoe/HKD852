// BurstFireCalc.ts — Weapon Burst Fire Pattern
// Pure TypeScript, no Phaser imports, immutable state

export interface BurstConfig {
  readonly shotsPerBurst: number;
  readonly burstInterval: number; // ms between shots in burst
  readonly burstCooldown: number; // ms after burst before next
  readonly spreadAngle: number; // degrees spread across burst
}

export interface BurstState {
  readonly config: BurstConfig;
  readonly phase: "ready" | "firing" | "cooldown";
  readonly shotsFired: number;
  readonly burstElapsed: number; // ms
  readonly cooldownElapsed: number; // ms
  readonly totalBursts: number;
  readonly totalShots: number;
}

const DEFAULT_CONFIG: BurstConfig = {
  shotsPerBurst: 3,
  burstInterval: 80,
  burstCooldown: 600,
  spreadAngle: 15,
};

export function createBurstState(config?: Partial<BurstConfig>): BurstState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    phase: "ready",
    shotsFired: 0,
    burstElapsed: 0,
    cooldownElapsed: 0,
    totalBursts: 0,
    totalShots: 0,
  };
}

export function canFire(state: BurstState): boolean {
  return state.phase === "ready";
}

export function startBurst(state: BurstState): BurstState {
  return {
    ...state,
    phase: "firing",
    shotsFired: 0,
    burstElapsed: 0,
    cooldownElapsed: 0,
  };
}

export function updateBurst(
  state: BurstState,
  deltaMs: number,
): { newState: BurstState; shouldFire: boolean } {
  if (state.phase === "ready") {
    return { newState: state, shouldFire: false };
  }

  if (state.phase === "firing") {
    const elapsed = state.burstElapsed + deltaMs;

    // First shot fires immediately (elapsed starts at 0, shotsFired starts at 0)
    if (state.shotsFired === 0) {
      const newShotsFired = 1;
      const newTotalShots = state.totalShots + 1;

      // Check if burst is complete after this shot
      if (newShotsFired >= state.config.shotsPerBurst) {
        return {
          newState: {
            ...state,
            phase: "cooldown",
            shotsFired: newShotsFired,
            burstElapsed: elapsed,
            cooldownElapsed: 0,
            totalBursts: state.totalBursts + 1,
            totalShots: newTotalShots,
          },
          shouldFire: true,
        };
      }

      return {
        newState: {
          ...state,
          shotsFired: newShotsFired,
          burstElapsed: elapsed,
          totalShots: newTotalShots,
        },
        shouldFire: true,
      };
    }

    // Subsequent shots fire on burstInterval boundaries
    const nextShotTime = state.shotsFired * state.config.burstInterval;

    if (elapsed >= nextShotTime) {
      const newShotsFired = state.shotsFired + 1;
      const newTotalShots = state.totalShots + 1;

      // Check if burst is complete
      if (newShotsFired >= state.config.shotsPerBurst) {
        return {
          newState: {
            ...state,
            phase: "cooldown",
            shotsFired: newShotsFired,
            burstElapsed: elapsed,
            cooldownElapsed: 0,
            totalBursts: state.totalBursts + 1,
            totalShots: newTotalShots,
          },
          shouldFire: true,
        };
      }

      return {
        newState: {
          ...state,
          shotsFired: newShotsFired,
          burstElapsed: elapsed,
          totalShots: newTotalShots,
        },
        shouldFire: true,
      };
    }

    // Not yet time for next shot
    return {
      newState: { ...state, burstElapsed: elapsed },
      shouldFire: false,
    };
  }

  // phase === 'cooldown'
  const cooldown = state.cooldownElapsed + deltaMs;

  if (cooldown >= state.config.burstCooldown) {
    return {
      newState: {
        ...state,
        phase: "ready",
        cooldownElapsed: state.config.burstCooldown,
      },
      shouldFire: false,
    };
  }

  return {
    newState: { ...state, cooldownElapsed: cooldown },
    shouldFire: false,
  };
}

export function getShotAngleOffset(
  shotIndex: number,
  config: BurstConfig,
): number {
  const spreadRad = (config.spreadAngle * Math.PI) / 180;

  if (config.shotsPerBurst <= 1) {
    return 0;
  }

  // Distribute evenly across spread: from -spread/2 to +spread/2
  const step = spreadRad / (config.shotsPerBurst - 1);
  return -spreadRad / 2 + step * shotIndex;
}

export function getBurstProgress(state: BurstState): number {
  if (state.phase !== "firing") {
    return state.phase === "cooldown" ? 1 : 0;
  }

  if (state.config.shotsPerBurst <= 1) {
    return state.shotsFired > 0 ? 1 : 0;
  }

  return state.shotsFired / state.config.shotsPerBurst;
}

export function getCooldownProgress(state: BurstState): number {
  if (state.phase !== "cooldown") {
    return state.phase === "ready" ? 1 : 0;
  }

  if (state.config.burstCooldown <= 0) {
    return 1;
  }

  return Math.min(1, state.cooldownElapsed / state.config.burstCooldown);
}

export function isFiring(state: BurstState): boolean {
  return state.phase === "firing";
}

export function isCoolingDown(state: BurstState): boolean {
  return state.phase === "cooldown";
}

export function resetBurst(state: BurstState): BurstState {
  return {
    ...state,
    phase: "ready",
    shotsFired: 0,
    burstElapsed: 0,
    cooldownElapsed: 0,
  };
}

export function getFireRate(config: BurstConfig): number {
  // Total time for one full burst cycle:
  // (shotsPerBurst - 1) * burstInterval for firing + burstCooldown
  const firingTime = (config.shotsPerBurst - 1) * config.burstInterval;
  const totalCycleMs = firingTime + config.burstCooldown;

  if (totalCycleMs <= 0) {
    return 0;
  }

  const totalCycleSec = totalCycleMs / 1000;
  return config.shotsPerBurst / totalCycleSec;
}

export function getStats(state: BurstState): {
  totalBursts: number;
  totalShots: number;
  averageShotsPerBurst: number;
} {
  return {
    totalBursts: state.totalBursts,
    totalShots: state.totalShots,
    averageShotsPerBurst:
      state.totalBursts > 0 ? state.totalShots / state.totalBursts : 0,
  };
}
