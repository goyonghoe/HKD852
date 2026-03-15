// PiercingCalc.ts — Projectile piercing through enemies
// Pure TypeScript, no Phaser imports, immutable state

export interface PiercingConfig {
  readonly maxPierces: number;
  readonly damageRetention: number; // 0-1, damage kept per pierce
  readonly sizeReduction: number; // 0-1, size kept per pierce
}

export interface PiercingProjectile {
  readonly id: string;
  readonly damage: number;
  readonly baseDamage: number;
  readonly size: number;
  readonly baseSize: number;
  readonly pierceCount: number;
  readonly hitTargets: readonly string[];
  readonly active: boolean;
}

export function createPiercingConfig(
  overrides?: Partial<PiercingConfig>,
): PiercingConfig {
  return {
    maxPierces: 3,
    damageRetention: 0.7,
    sizeReduction: 0.9,
    ...overrides,
  };
}

export function createProjectile(
  id: string,
  baseDamage: number,
  baseSize: number,
  _config: PiercingConfig,
): PiercingProjectile {
  return {
    id,
    damage: baseDamage,
    baseDamage,
    size: baseSize,
    baseSize,
    pierceCount: 0,
    hitTargets: [],
    active: true,
  };
}

export function pierce(
  projectile: PiercingProjectile,
  targetId: string,
  config: PiercingConfig,
): PiercingProjectile {
  if (!projectile.active) return projectile;
  if (hasHitTarget(projectile, targetId)) return projectile;

  const newPierceCount = projectile.pierceCount + 1;
  const newDamage = getDamageAtPierce(
    projectile.baseDamage,
    newPierceCount,
    config.damageRetention,
  );
  const newSize = getSizeAtPierce(
    projectile.baseSize,
    newPierceCount,
    config.sizeReduction,
  );
  const reachedMax = newPierceCount >= config.maxPierces;

  return {
    ...projectile,
    damage: newDamage,
    size: newSize,
    pierceCount: newPierceCount,
    hitTargets: [...projectile.hitTargets, targetId],
    active: !reachedMax,
  };
}

export function canPierce(
  projectile: PiercingProjectile,
  config: PiercingConfig,
): boolean {
  return projectile.active && projectile.pierceCount < config.maxPierces;
}

export function hasHitTarget(
  projectile: PiercingProjectile,
  targetId: string,
): boolean {
  return projectile.hitTargets.includes(targetId);
}

export function getDamageAtPierce(
  baseDamage: number,
  pierceIndex: number,
  damageRetention: number,
): number {
  return baseDamage * Math.pow(damageRetention, pierceIndex);
}

export function getSizeAtPierce(
  baseSize: number,
  pierceIndex: number,
  sizeReduction: number,
): number {
  return baseSize * Math.pow(sizeReduction, pierceIndex);
}

export function getRemainingPierces(
  projectile: PiercingProjectile,
  config: PiercingConfig,
): number {
  return Math.max(0, config.maxPierces - projectile.pierceCount);
}

export function getTotalDamageDealt(projectile: PiercingProjectile): number {
  if (projectile.pierceCount === 0) return 0;
  // Each pierce i (0-indexed) dealt baseDamage * damageRetention^i
  // But we don't store damageRetention — derive from current state
  // damage = baseDamage * damageRetention^pierceCount
  // So damageRetention = (damage / baseDamage)^(1/pierceCount)
  if (projectile.baseDamage === 0) return 0;

  const pierceCount = projectile.pierceCount;
  const ratio = projectile.damage / projectile.baseDamage;
  const damageRetention =
    pierceCount > 0 ? Math.pow(ratio, 1 / pierceCount) : 1;

  let total = 0;
  for (let i = 0; i < pierceCount; i++) {
    total += projectile.baseDamage * Math.pow(damageRetention, i);
  }
  return total;
}

export function resetProjectile(
  projectile: PiercingProjectile,
): PiercingProjectile {
  return {
    ...projectile,
    damage: projectile.baseDamage,
    size: projectile.baseSize,
    pierceCount: 0,
    hitTargets: [],
    active: true,
  };
}
