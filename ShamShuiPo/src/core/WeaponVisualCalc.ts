export type ProjectileShape = "circle" | "line" | "rect" | "triangle";

export interface WeaponVisualConfig {
  shape: ProjectileShape;
  color: number;
  width: number;
  height: number;
  glow: boolean;
  trail: boolean;
  trailColor: number;
}

const VISUALS: Record<string, WeaponVisualConfig> = {
  pistol: {
    shape: "circle",
    color: 0x00ffff,
    width: 4,
    height: 4,
    glow: false,
    trail: false,
    trailColor: 0x000000,
  },
  shotgun: {
    shape: "circle",
    color: 0xff8800,
    width: 3,
    height: 3,
    glow: false,
    trail: false,
    trailColor: 0x000000,
  },
  laser: {
    shape: "line",
    color: 0x00ffff,
    width: 3,
    height: 60,
    glow: true,
    trail: true,
    trailColor: 0x00ffff,
  },
  missile: {
    shape: "triangle",
    color: 0xff4444,
    width: 8,
    height: 12,
    glow: true,
    trail: true,
    trailColor: 0xff6600,
  },
  boomerang: {
    shape: "rect",
    color: 0x00ff88,
    width: 10,
    height: 10,
    glow: false,
    trail: true,
    trailColor: 0x00ff88,
  },
  lightning: {
    shape: "line",
    color: 0xffff00,
    width: 2,
    height: 40,
    glow: true,
    trail: false,
    trailColor: 0x000000,
  },
  flamethrower: {
    shape: "circle",
    color: 0xff4400,
    width: 6,
    height: 6,
    glow: true,
    trail: true,
    trailColor: 0xff0000,
  },
};

const DEFAULT_VISUAL: WeaponVisualConfig = {
  shape: "circle",
  color: 0xffffff,
  width: 4,
  height: 4,
  glow: false,
  trail: false,
  trailColor: 0x000000,
};

/** Get visual config for a weapon's projectiles. */
export function getWeaponVisual(weaponId: string): WeaponVisualConfig {
  return VISUALS[weaponId] ?? { ...DEFAULT_VISUAL };
}

/** Returns projectile size multiplier: base size * (1 + (level-1) * 0.15) */
export function getProjectileSize(weaponId: string, level: number): number {
  const config = getWeaponVisual(weaponId);
  const base = config.width;
  return base * (1 + (level - 1) * 0.15);
}
