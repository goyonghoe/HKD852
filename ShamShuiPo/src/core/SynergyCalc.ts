// ════════════════════════════════════════════════════════════════
// SynergyCalc — pure TypeScript, NO Phaser imports
// Detects and calculates weapon+passive synergy bonuses
// ════════════════════════════════════════════════════════════════

export interface SynergyRequirement {
  type: "weapon" | "passive";
  id: string;
  minLevel: number;
}

export interface SynergyBonus {
  stat: string;
  value: number;
  isPercent: boolean;
}

export interface SynergyDef {
  id: string;
  name: string;
  description: string;
  requirements: SynergyRequirement[];
  bonuses: SynergyBonus[];
}

export interface ActiveSynergy {
  synergy: SynergyDef;
  fulfilled: boolean;
  progress: number; // 0-1
}

// ── Synergy Registry ─────────────────────────────────────────

const SYNERGIES: SynergyDef[] = [
  {
    id: "bullet_storm",
    name: "Bullet Storm",
    description: "Pistol + Projectile synergy: +30% fire rate",
    requirements: [
      { type: "weapon", id: "pistol", minLevel: 3 },
      { type: "passive", id: "projectile", minLevel: 2 },
    ],
    bonuses: [{ stat: "fireRate", value: 30, isPercent: true }],
  },
  {
    id: "scatter_shot",
    name: "Scatter Shot",
    description: "Shotgun + Area synergy: +25% spread area",
    requirements: [
      { type: "weapon", id: "shotgun", minLevel: 3 },
      { type: "passive", id: "area", minLevel: 2 },
    ],
    bonuses: [{ stat: "spreadArea", value: 25, isPercent: true }],
  },
  {
    id: "laser_focus",
    name: "Laser Focus",
    description: "Laser + Crit synergy: +20% crit damage",
    requirements: [
      { type: "weapon", id: "laser", minLevel: 3 },
      { type: "passive", id: "crit", minLevel: 2 },
    ],
    bonuses: [{ stat: "critDamage", value: 20, isPercent: true }],
  },
  {
    id: "rocket_barrage",
    name: "Rocket Barrage",
    description: "Missile + Cooldown synergy: -25% cooldown",
    requirements: [
      { type: "weapon", id: "missile", minLevel: 3 },
      { type: "passive", id: "cooldown", minLevel: 2 },
    ],
    bonuses: [{ stat: "cooldown", value: -25, isPercent: true }],
  },
  {
    id: "boomerang_master",
    name: "Boomerang Master",
    description: "Boomerang + Speed synergy: +20% projectile speed",
    requirements: [
      { type: "weapon", id: "boomerang", minLevel: 3 },
      { type: "passive", id: "speed", minLevel: 2 },
    ],
    bonuses: [{ stat: "projectileSpeed", value: 20, isPercent: true }],
  },
  {
    id: "thunder_god",
    name: "Thunder God",
    description: "Lightning + Damage synergy: +40% chain damage",
    requirements: [
      { type: "weapon", id: "lightning", minLevel: 3 },
      { type: "passive", id: "damage", minLevel: 3 },
    ],
    bonuses: [{ stat: "chainDamage", value: 40, isPercent: true }],
  },
  {
    id: "inferno",
    name: "Inferno",
    description: "Flamethrower + Area synergy: +35% burn area",
    requirements: [
      { type: "weapon", id: "flamethrower", minLevel: 3 },
      { type: "passive", id: "area", minLevel: 3 },
    ],
    bonuses: [{ stat: "burnArea", value: 35, isPercent: true }],
  },
  {
    id: "orbital_defense",
    name: "Orbital Defense",
    description: "Orbital + Armor synergy: +15% armor, +15% orbit speed",
    requirements: [
      { type: "weapon", id: "orbital", minLevel: 3 },
      { type: "passive", id: "armor", minLevel: 2 },
    ],
    bonuses: [
      { stat: "armor", value: 15, isPercent: true },
      { stat: "orbitSpeed", value: 15, isPercent: true },
    ],
  },
];

// ── Item Lookup Types ────────────────────────────────────────

interface ItemEntry {
  id: string;
  level: number;
}

// ── Public API ───────────────────────────────────────────────

/** Returns all defined synergies. */
export function getAllSynergies(): SynergyDef[] {
  return [...SYNERGIES];
}

/** Returns 0-1 progress toward fulfilling a synergy. */
export function getSynergyProgress(
  synergy: SynergyDef,
  weapons: ItemEntry[],
  passives: ItemEntry[],
): number {
  if (synergy.requirements.length === 0) return 1;

  let totalProgress = 0;

  for (const req of synergy.requirements) {
    const items = req.type === "weapon" ? weapons : passives;
    const match = items.find((i) => i.id === req.id);

    if (!match) {
      // Item not owned at all → 0 progress for this requirement
      totalProgress += 0;
    } else {
      // Partial progress: current level / required level, capped at 1
      totalProgress += Math.min(match.level / req.minLevel, 1);
    }
  }

  return totalProgress / synergy.requirements.length;
}

/**
 * Returns all synergies with fulfillment status and progress.
 */
export function getActiveSynergies(
  weapons: ItemEntry[],
  passives: ItemEntry[],
): ActiveSynergy[] {
  return SYNERGIES.map((synergy) => {
    const progress = getSynergyProgress(synergy, weapons, passives);
    return {
      synergy,
      fulfilled: progress >= 1,
      progress,
    };
  });
}

/**
 * Accumulates bonuses from all fulfilled synergies.
 * Returns a record of stat → total bonus value.
 */
export function calculateSynergyBonuses(
  weapons: ItemEntry[],
  passives: ItemEntry[],
): Record<string, number> {
  const bonuses: Record<string, number> = {};

  for (const synergy of SYNERGIES) {
    const progress = getSynergyProgress(synergy, weapons, passives);
    if (progress < 1) continue;

    for (const bonus of synergy.bonuses) {
      bonuses[bonus.stat] = (bonuses[bonus.stat] ?? 0) + bonus.value;
    }
  }

  return bonuses;
}

/** Human-readable description of a synergy's requirements and bonuses. */
export function getSynergyDescription(synergy: SynergyDef): string {
  const reqs = synergy.requirements
    .map((r) => `${r.id} (${r.type}) lv${r.minLevel}`)
    .join(" + ");

  const bonusText = synergy.bonuses
    .map(
      (b) =>
        `${b.value > 0 ? "+" : ""}${b.value}${b.isPercent ? "%" : ""} ${b.stat}`,
    )
    .join(", ");

  return `${synergy.name}: ${reqs} → ${bonusText}`;
}

/** Returns all synergies that involve the given weapon. */
export function getWeaponSynergies(weaponId: string): SynergyDef[] {
  return SYNERGIES.filter((s) =>
    s.requirements.some((r) => r.type === "weapon" && r.id === weaponId),
  );
}

/** Checks whether a specific synergy is fulfilled. */
export function hasSynergy(
  synergyId: string,
  weapons: ItemEntry[],
  passives: ItemEntry[],
): boolean {
  const synergy = SYNERGIES.find((s) => s.id === synergyId);
  if (!synergy) return false;
  return getSynergyProgress(synergy, weapons, passives) >= 1;
}
