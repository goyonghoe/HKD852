// BeamCalc — Continuous Beam Weapon System
// Pure TypeScript, no Phaser imports, immutable state

export interface BeamConfig {
  readonly chargeTime: number; // ms
  readonly maxSustainTime: number; // ms
  readonly overheatCooldown: number; // ms
  readonly dps: number; // damage per second
  readonly width: number; // pixels
  readonly range: number; // pixels
}

export type BeamPhase = "idle" | "charging" | "firing" | "overheated";

export interface BeamState {
  readonly config: BeamConfig;
  readonly phase: BeamPhase;
  readonly elapsed: number; // ms within current phase
  readonly angle: number; // radians
  readonly totalDamageDealt: number;
  readonly totalFireTime: number; // ms
}

const DEFAULT_CONFIG: BeamConfig = {
  chargeTime: 500,
  maxSustainTime: 3000,
  overheatCooldown: 2000,
  dps: 30,
  width: 8,
  range: 400,
};

export function createBeamState(config?: Partial<BeamConfig>): BeamState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    phase: "idle",
    elapsed: 0,
    angle: 0,
    totalDamageDealt: 0,
    totalFireTime: 0,
  };
}

export function startBeam(state: BeamState, angle: number): BeamState {
  if (state.phase !== "idle") return state;
  return {
    ...state,
    phase: "charging",
    elapsed: 0,
    angle,
  };
}

export function updateBeam(state: BeamState, deltaMs: number): BeamState {
  if (state.phase === "idle") return state;

  const newElapsed = state.elapsed + deltaMs;

  if (state.phase === "charging") {
    if (newElapsed >= state.config.chargeTime) {
      const overflow = newElapsed - state.config.chargeTime;
      // Transition to firing; recursively process overflow
      const firingState: BeamState = {
        ...state,
        phase: "firing",
        elapsed: 0,
      };
      return overflow > 0 ? updateBeam(firingState, overflow) : firingState;
    }
    return { ...state, elapsed: newElapsed };
  }

  if (state.phase === "firing") {
    const firingDelta = Math.min(
      deltaMs,
      state.config.maxSustainTime - state.elapsed,
    );
    const dmg = getDamageThisFrame(state, firingDelta);

    if (newElapsed >= state.config.maxSustainTime) {
      const overflow = newElapsed - state.config.maxSustainTime;
      const overheatedState: BeamState = {
        ...state,
        phase: "overheated",
        elapsed: 0,
        totalDamageDealt: state.totalDamageDealt + dmg,
        totalFireTime: state.totalFireTime + firingDelta,
      };
      return overflow > 0
        ? updateBeam(overheatedState, overflow)
        : overheatedState;
    }

    return {
      ...state,
      elapsed: newElapsed,
      totalDamageDealt: state.totalDamageDealt + dmg,
      totalFireTime: state.totalFireTime + deltaMs,
    };
  }

  if (state.phase === "overheated") {
    if (newElapsed >= state.config.overheatCooldown) {
      return {
        ...state,
        phase: "idle",
        elapsed: 0,
      };
    }
    return { ...state, elapsed: newElapsed };
  }

  return state;
}

export function getDamageThisFrame(state: BeamState, deltaMs: number): number {
  if (state.phase !== "firing") return 0;
  return state.config.dps * (deltaMs / 1000);
}

export function getBeamEndPoint(
  startX: number,
  startY: number,
  angle: number,
  range: number,
): { x: number; y: number } {
  return {
    x: startX + Math.cos(angle) * range,
    y: startY + Math.sin(angle) * range,
  };
}

export function getEnemiesInBeam(
  startX: number,
  startY: number,
  angle: number,
  range: number,
  width: number,
  enemies: readonly { id: string; x: number; y: number }[],
): readonly { id: string }[] {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const halfWidth = width / 2;

  return enemies
    .filter((e) => {
      // Vector from start to enemy
      const dx = e.x - startX;
      const dy = e.y - startY;

      // Project onto beam direction (along)
      const along = dx * cosA + dy * sinA;
      if (along < 0 || along > range) return false;

      // Perpendicular distance
      const perp = Math.abs(-dx * sinA + dy * cosA);
      return perp <= halfWidth;
    })
    .map((e) => ({ id: e.id }));
}

export function stopBeam(state: BeamState): BeamState {
  if (state.phase === "idle") return state;
  return {
    ...state,
    phase: "idle",
    elapsed: 0,
  };
}

export function isActive(state: BeamState): boolean {
  return state.phase === "charging" || state.phase === "firing";
}

export function isFiring(state: BeamState): boolean {
  return state.phase === "firing";
}

export function getPhaseProgress(state: BeamState): number {
  switch (state.phase) {
    case "idle":
      return 0;
    case "charging":
      return Math.min(state.elapsed / state.config.chargeTime, 1);
    case "firing":
      return Math.min(state.elapsed / state.config.maxSustainTime, 1);
    case "overheated":
      return Math.min(state.elapsed / state.config.overheatCooldown, 1);
  }
}

export function setAngle(state: BeamState, angle: number): BeamState {
  return { ...state, angle };
}

export function getStats(state: BeamState): {
  totalDamageDealt: number;
  totalFireTime: number;
  averageDPS: number;
} {
  const fireTimeSec = state.totalFireTime / 1000;
  return {
    totalDamageDealt: state.totalDamageDealt,
    totalFireTime: state.totalFireTime,
    averageDPS: fireTimeSec > 0 ? state.totalDamageDealt / fireTimeSec : 0,
  };
}
