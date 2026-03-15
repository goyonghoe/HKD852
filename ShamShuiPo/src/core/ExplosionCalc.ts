// ExplosionCalc.ts — AoE Explosion Damage with Falloff
// Pure TypeScript, no Phaser imports, immutable state

export interface ExplosionConfig {
  readonly radius: number;
  readonly baseDamage: number;
  readonly falloffType: "linear" | "quadratic" | "none";
  readonly knockbackForce: number;
}

export interface ExplosionResult {
  readonly targets: readonly {
    readonly id: string;
    readonly damage: number;
    readonly distance: number;
    readonly knockbackX: number;
    readonly knockbackY: number;
  }[];
  readonly totalDamage: number;
}

export interface ExplosionInstance {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly config: ExplosionConfig;
  readonly elapsed: number;
  readonly duration: number;
  readonly active: boolean;
}

export interface ExplosionState {
  readonly explosions: readonly ExplosionInstance[];
  readonly maxExplosions: number;
}

let _idCounter = 0;

export function createExplosionState(
  maxExplosions: number = 20,
): ExplosionState {
  return { explosions: [], maxExplosions };
}

export function createExplosionConfig(
  overrides?: Partial<ExplosionConfig>,
): ExplosionConfig {
  return {
    radius: 100,
    baseDamage: 50,
    falloffType: "linear",
    knockbackForce: 200,
    ...overrides,
  };
}

export function getFalloffMultiplier(
  distance: number,
  radius: number,
  falloffType: "linear" | "quadratic" | "none",
): number {
  if (distance <= 0) return 1;
  if (radius <= 0) return 0;
  if (distance >= radius) return 0;

  const ratio = distance / radius;

  switch (falloffType) {
    case "linear":
      return 1 - ratio;
    case "quadratic":
      return 1 - ratio * ratio;
    case "none":
      return 1;
  }
}

export function calculateExplosionDamage(
  distance: number,
  config: ExplosionConfig,
): number {
  if (distance < 0) return 0;
  if (distance > config.radius) return 0;

  const multiplier = getFalloffMultiplier(
    distance,
    config.radius,
    config.falloffType,
  );
  return config.baseDamage * multiplier;
}

export function calculateKnockback(
  explosionX: number,
  explosionY: number,
  targetX: number,
  targetY: number,
  force: number,
): { kbX: number; kbY: number } {
  const dx = targetX - explosionX;
  const dy = targetY - explosionY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    return { kbX: 0, kbY: 0 };
  }

  const nx = dx / dist;
  const ny = dy / dist;

  return {
    kbX: nx * force,
    kbY: ny * force,
  };
}

export function applyExplosion(
  x: number,
  y: number,
  enemies: readonly { id: string; x: number; y: number }[],
  config: ExplosionConfig,
): ExplosionResult {
  const targets: {
    id: string;
    damage: number;
    distance: number;
    knockbackX: number;
    knockbackY: number;
  }[] = [];

  let totalDamage = 0;

  for (const enemy of enemies) {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > config.radius) continue;

    const damage = calculateExplosionDamage(distance, config);
    const { kbX, kbY } = calculateKnockback(
      x,
      y,
      enemy.x,
      enemy.y,
      config.knockbackForce,
    );

    targets.push({
      id: enemy.id,
      damage,
      distance,
      knockbackX: kbX,
      knockbackY: kbY,
    });

    totalDamage += damage;
  }

  return { targets, totalDamage };
}

export function spawnExplosion(
  state: ExplosionState,
  x: number,
  y: number,
  config: ExplosionConfig,
  duration: number = 300,
): ExplosionState {
  const id = `explosion_${++_idCounter}`;
  const instance: ExplosionInstance = {
    id,
    x,
    y,
    config,
    elapsed: 0,
    duration,
    active: true,
  };

  let explosions = [...state.explosions, instance];

  // Remove oldest if max exceeded
  if (explosions.length > state.maxExplosions) {
    explosions = explosions.slice(explosions.length - state.maxExplosions);
  }

  return { ...state, explosions };
}

export function updateExplosions(
  state: ExplosionState,
  deltaMs: number,
): ExplosionState {
  const explosions = state.explosions.map((exp) => {
    if (!exp.active) return exp;

    const elapsed = exp.elapsed + deltaMs;
    const active = elapsed < exp.duration;

    return { ...exp, elapsed, active };
  });

  return { ...state, explosions };
}

export function getActiveExplosions(
  state: ExplosionState,
): ExplosionInstance[] {
  return state.explosions.filter((exp) => exp.active);
}

export function clearExplosions(state: ExplosionState): ExplosionState {
  return { ...state, explosions: [] };
}
