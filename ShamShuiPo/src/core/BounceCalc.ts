// BounceCalc.ts — Projectile ricochet off arena walls
// Pure TypeScript, no Phaser imports, immutable state

export interface BounceConfig {
  readonly maxBounces: number;
  readonly speedLossPerBounce: number; // 0-1, speed retained each bounce
  readonly damageLossPerBounce: number; // 0-1, damage retained each bounce
  readonly boundsWidth: number;
  readonly boundsHeight: number;
}

export interface Projectile {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly speed: number;
  readonly damage: number;
  readonly bounceCount: number;
  readonly active: boolean;
}

export interface BounceResult {
  readonly newX: number;
  readonly newY: number;
  readonly newVx: number;
  readonly newVy: number;
  readonly bounced: boolean;
  readonly wall: "left" | "right" | "top" | "bottom" | null;
}

export function createBounceConfig(
  overrides?: Partial<BounceConfig>,
): BounceConfig {
  return {
    maxBounces: 3,
    speedLossPerBounce: 0.8,
    damageLossPerBounce: 0.9,
    boundsWidth: 720,
    boundsHeight: 1280,
    ...overrides,
  };
}

export function getWallHit(
  x: number,
  y: number,
  config: BounceConfig,
): "left" | "right" | "top" | "bottom" | null {
  if (x <= 0) return "left";
  if (x >= config.boundsWidth) return "right";
  if (y <= 0) return "top";
  if (y >= config.boundsHeight) return "bottom";
  return null;
}

export function isOutOfBounds(
  x: number,
  y: number,
  config: BounceConfig,
): boolean {
  return (
    x <= 0 || x >= config.boundsWidth || y <= 0 || y >= config.boundsHeight
  );
}

export function reflectX(vx: number): number {
  return -vx;
}

export function reflectY(vy: number): number {
  return -vy;
}

export function clampToBounds(
  x: number,
  y: number,
  config: BounceConfig,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, config.boundsWidth)),
    y: Math.max(0, Math.min(y, config.boundsHeight)),
  };
}

export function getDamageAfterBounces(
  baseDamage: number,
  bounces: number,
  damageLoss: number,
): number {
  return baseDamage * Math.pow(damageLoss, bounces);
}

export function getSpeedAfterBounces(
  baseSpeed: number,
  bounces: number,
  speedLoss: number,
): number {
  return baseSpeed * Math.pow(speedLoss, bounces);
}

export function canBounce(
  projectile: Projectile,
  config: BounceConfig,
): boolean {
  return projectile.bounceCount < config.maxBounces && projectile.active;
}

export function checkBounce(
  projectile: Projectile,
  config: BounceConfig,
): BounceResult {
  const wall = getWallHit(projectile.x, projectile.y, config);

  if (wall === null) {
    return {
      newX: projectile.x,
      newY: projectile.y,
      newVx: projectile.vx,
      newVy: projectile.vy,
      bounced: false,
      wall: null,
    };
  }

  let newVx = projectile.vx;
  let newVy = projectile.vy;

  if (wall === "left" || wall === "right") {
    newVx = reflectX(projectile.vx);
  } else {
    newVy = reflectY(projectile.vy);
  }

  const clamped = clampToBounds(projectile.x, projectile.y, config);

  return {
    newX: clamped.x,
    newY: clamped.y,
    newVx,
    newVy,
    bounced: true,
    wall,
  };
}

export function applyBounce(
  projectile: Projectile,
  config: BounceConfig,
): Projectile {
  if (!projectile.active) {
    return projectile;
  }

  const result = checkBounce(projectile, config);

  if (!result.bounced) {
    return projectile;
  }

  const newBounceCount = projectile.bounceCount + 1;

  if (newBounceCount > config.maxBounces) {
    return {
      ...projectile,
      x: result.newX,
      y: result.newY,
      vx: 0,
      vy: 0,
      active: false,
      bounceCount: newBounceCount,
    };
  }

  const newSpeed = projectile.speed * config.speedLossPerBounce;
  const newDamage = projectile.damage * config.damageLossPerBounce;

  // Scale velocity to match new speed
  const currentSpeed = Math.sqrt(
    result.newVx * result.newVx + result.newVy * result.newVy,
  );
  const scale = currentSpeed > 0 ? newSpeed / currentSpeed : 0;

  return {
    ...projectile,
    x: result.newX,
    y: result.newY,
    vx: result.newVx * scale,
    vy: result.newVy * scale,
    speed: newSpeed,
    damage: newDamage,
    bounceCount: newBounceCount,
    active: true,
  };
}
