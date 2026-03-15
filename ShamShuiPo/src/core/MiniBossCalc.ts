// ── MiniBossCalc ────────────────────────────────────────────────
// Pure TypeScript module for mini-boss encounter & phase transitions.
// NO Phaser imports. All functions are pure & deterministic.
// ────────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────

export type MiniBossId =
  | "cyber_brute"
  | "neon_mage"
  | "shock_tank"
  | "blade_dancer"
  | "void_weaver";

export interface BossPhase {
  readonly phaseNumber: number;
  readonly hpThreshold: number;
  readonly attackPattern: string;
  readonly speedMultiplier: number;
  readonly damageMultiplier: number;
  readonly specialAbility: string;
}

export interface MiniBossConfig {
  readonly id: MiniBossId;
  readonly name: string;
  readonly baseHp: number;
  readonly baseDamage: number;
  readonly baseSpeed: number;
  readonly phases: readonly BossPhase[];
  readonly xpReward: number;
  readonly coinReward: number;
}

export interface MiniBossState {
  readonly config: MiniBossConfig;
  readonly currentHp: number;
  readonly currentPhase: number;
  readonly enraged: boolean;
  readonly shields: number;
  readonly attackTimer: number;
  readonly specialTimer: number;
  readonly isDefeated: boolean;
}

export interface DamageResult {
  readonly state: MiniBossState;
  readonly phaseChanged: boolean;
  readonly isDefeated: boolean;
}

export interface MiniBossRewards {
  readonly xp: number;
  readonly coins: number;
  readonly drops: number;
}

// ── PRNG ───────────────────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Constants ──────────────────────────────────────────────────

const ENRAGE_THRESHOLD = 0.25;
const ENRAGE_MULTIPLIER = 1.5;
const ATTACK_COOLDOWN = 2.0;
const SPECIAL_COOLDOWN = 5.0;

// ── Mini-boss Configs ──────────────────────────────────────────

const MINI_BOSS_CONFIGS: Record<MiniBossId, MiniBossConfig> = {
  cyber_brute: {
    id: "cyber_brute",
    name: "Cyber Brute",
    baseHp: 500,
    baseDamage: 40,
    baseSpeed: 60,
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 1.0,
        attackPattern: "heavy_swing",
        speedMultiplier: 1.0,
        damageMultiplier: 1.0,
        specialAbility: "ground_slam",
      },
      {
        phaseNumber: 2,
        hpThreshold: 0.5,
        attackPattern: "charge_rush",
        speedMultiplier: 1.3,
        damageMultiplier: 1.2,
        specialAbility: "shockwave",
      },
      {
        phaseNumber: 3,
        hpThreshold: 0.25,
        attackPattern: "frenzy_combo",
        speedMultiplier: 1.6,
        damageMultiplier: 1.5,
        specialAbility: "enraged_slam",
      },
    ],
    xpReward: 200,
    coinReward: 150,
  },

  neon_mage: {
    id: "neon_mage",
    name: "Neon Mage",
    baseHp: 300,
    baseDamage: 35,
    baseSpeed: 80,
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 1.0,
        attackPattern: "arcane_bolt",
        speedMultiplier: 1.0,
        damageMultiplier: 1.0,
        specialAbility: "teleport",
      },
      {
        phaseNumber: 2,
        hpThreshold: 0.6,
        attackPattern: "neon_barrage",
        speedMultiplier: 1.2,
        damageMultiplier: 1.3,
        specialAbility: "hazard_zone",
      },
      {
        phaseNumber: 3,
        hpThreshold: 0.3,
        attackPattern: "void_storm",
        speedMultiplier: 1.5,
        damageMultiplier: 1.6,
        specialAbility: "mass_teleport",
      },
    ],
    xpReward: 180,
    coinReward: 130,
  },

  shock_tank: {
    id: "shock_tank",
    name: "Shock Tank",
    baseHp: 700,
    baseDamage: 50,
    baseSpeed: 40,
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 1.0,
        attackPattern: "cannon_blast",
        speedMultiplier: 1.0,
        damageMultiplier: 1.0,
        specialAbility: "aoe_slam",
      },
      {
        phaseNumber: 2,
        hpThreshold: 0.4,
        attackPattern: "rapid_fire",
        speedMultiplier: 1.2,
        damageMultiplier: 1.4,
        specialAbility: "electric_field",
      },
    ],
    xpReward: 250,
    coinReward: 200,
  },

  blade_dancer: {
    id: "blade_dancer",
    name: "Blade Dancer",
    baseHp: 350,
    baseDamage: 30,
    baseSpeed: 120,
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 1.0,
        attackPattern: "slash_combo",
        speedMultiplier: 1.0,
        damageMultiplier: 1.0,
        specialAbility: "dash_strike",
      },
      {
        phaseNumber: 2,
        hpThreshold: 0.7,
        attackPattern: "whirlwind",
        speedMultiplier: 1.3,
        damageMultiplier: 1.2,
        specialAbility: "blade_fan",
      },
      {
        phaseNumber: 3,
        hpThreshold: 0.4,
        attackPattern: "shadow_step",
        speedMultiplier: 1.6,
        damageMultiplier: 1.4,
        specialAbility: "phantom_slash",
      },
      {
        phaseNumber: 4,
        hpThreshold: 0.15,
        attackPattern: "death_blossom",
        speedMultiplier: 2.0,
        damageMultiplier: 1.8,
        specialAbility: "thousand_cuts",
      },
    ],
    xpReward: 220,
    coinReward: 160,
  },

  void_weaver: {
    id: "void_weaver",
    name: "Void Weaver",
    baseHp: 400,
    baseDamage: 25,
    baseSpeed: 70,
    phases: [
      {
        phaseNumber: 1,
        hpThreshold: 1.0,
        attackPattern: "shadow_bolt",
        speedMultiplier: 1.0,
        damageMultiplier: 1.0,
        specialAbility: "summon_minions",
      },
      {
        phaseNumber: 2,
        hpThreshold: 0.55,
        attackPattern: "void_tendrils",
        speedMultiplier: 1.1,
        damageMultiplier: 1.3,
        specialAbility: "create_rift",
      },
      {
        phaseNumber: 3,
        hpThreshold: 0.2,
        attackPattern: "dark_nova",
        speedMultiplier: 1.4,
        damageMultiplier: 1.7,
        specialAbility: "void_eruption",
      },
    ],
    xpReward: 210,
    coinReward: 140,
  },
};

const ALL_BOSS_IDS: readonly MiniBossId[] = [
  "cyber_brute",
  "neon_mage",
  "shock_tank",
  "blade_dancer",
  "void_weaver",
];

const DIFFICULTY_RATINGS: Record<MiniBossId, number> = {
  cyber_brute: 3,
  neon_mage: 4,
  shock_tank: 2,
  blade_dancer: 5,
  void_weaver: 4,
};

// ── Functions ──────────────────────────────────────────────────

export function getMiniBossConfig(id: MiniBossId): MiniBossConfig {
  return MINI_BOSS_CONFIGS[id];
}

export function createMiniBoss(
  id: MiniBossId,
  waveScaling: number,
): MiniBossState {
  const config = MINI_BOSS_CONFIGS[id];
  const scaledHp = Math.round(config.baseHp * waveScaling);
  const scaledConfig: MiniBossConfig = {
    ...config,
    baseHp: scaledHp,
    baseDamage: Math.round(config.baseDamage * waveScaling),
  };

  return {
    config: scaledConfig,
    currentHp: scaledHp,
    currentPhase: 1,
    enraged: false,
    shields: 0,
    attackTimer: ATTACK_COOLDOWN,
    specialTimer: SPECIAL_COOLDOWN,
    isDefeated: false,
  };
}

export function getHpPercent(state: MiniBossState): number {
  if (state.config.baseHp <= 0) return 0;
  return Math.max(0, Math.min(1, state.currentHp / state.config.baseHp));
}

export function isEnraged(state: MiniBossState): boolean {
  return getHpPercent(state) <= ENRAGE_THRESHOLD && !state.isDefeated;
}

export function getEnrageMultiplier(state: MiniBossState): number {
  return isEnraged(state) ? ENRAGE_MULTIPLIER : 1.0;
}

export function shouldTransitionPhase(state: MiniBossState): boolean {
  const hpPct = getHpPercent(state);
  const phases = state.config.phases;

  for (let i = phases.length - 1; i >= 0; i--) {
    const phase = phases[i];
    if (hpPct <= phase.hpThreshold && phase.phaseNumber > state.currentPhase) {
      return true;
    }
  }
  return false;
}

export function getCurrentPhase(state: MiniBossState): BossPhase {
  const phases = state.config.phases;
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].phaseNumber === state.currentPhase) {
      return phases[i];
    }
  }
  return phases[0];
}

export function getPhaseAttackPattern(state: MiniBossState): string {
  return getCurrentPhase(state).attackPattern;
}

function resolvePhase(state: MiniBossState): number {
  const hpPct = getHpPercent(state);
  const phases = state.config.phases;
  let resolved = 1;

  for (let i = 0; i < phases.length; i++) {
    if (hpPct <= phases[i].hpThreshold) {
      resolved = phases[i].phaseNumber;
    }
  }
  return resolved;
}

export function damageMiniBoss(
  state: MiniBossState,
  damage: number,
): DamageResult {
  if (state.isDefeated || damage <= 0) {
    return { state, phaseChanged: false, isDefeated: state.isDefeated };
  }

  // Shields absorb damage first
  if (state.shields > 0) {
    const remaining = damage - state.shields;
    if (remaining <= 0) {
      return {
        state: { ...state, shields: state.shields - damage },
        phaseChanged: false,
        isDefeated: false,
      };
    }
    damage = remaining;
    state = { ...state, shields: 0 };
  }

  const newHp = Math.max(0, state.currentHp - damage);
  const defeated = newHp <= 0;

  let newState: MiniBossState = {
    ...state,
    currentHp: newHp,
    isDefeated: defeated,
  };

  const newPhase = resolvePhase(newState);
  const phaseChanged = newPhase !== state.currentPhase;

  if (phaseChanged) {
    newState = {
      ...newState,
      currentPhase: newPhase,
      enraged: isEnraged(newState),
    };
  } else {
    newState = { ...newState, enraged: isEnraged(newState) };
  }

  return {
    state: newState,
    phaseChanged,
    isDefeated: defeated,
  };
}

export function tickMiniBoss(state: MiniBossState, dt: number): MiniBossState {
  if (state.isDefeated) return state;

  const newAttackTimer = Math.max(0, state.attackTimer - dt);
  const newSpecialTimer = Math.max(0, state.specialTimer - dt);

  return {
    ...state,
    attackTimer: newAttackTimer === 0 ? ATTACK_COOLDOWN : newAttackTimer,
    specialTimer: newSpecialTimer === 0 ? SPECIAL_COOLDOWN : newSpecialTimer,
  };
}

export function getMiniBossRewards(state: MiniBossState): MiniBossRewards {
  const waveScale =
    state.config.baseHp / MINI_BOSS_CONFIGS[state.config.id].baseHp || 1;
  const enrageBonus = state.enraged ? 1.25 : 1.0;

  return {
    xp: Math.round(state.config.xpReward * waveScale * enrageBonus),
    coins: Math.round(state.config.coinReward * waveScale * enrageBonus),
    drops: Math.min(5, Math.max(1, Math.floor(waveScale * 2))),
  };
}

export function selectMiniBossForWave(wave: number, seed: number): MiniBossId {
  const rng = mulberry32(seed + wave * 31);
  const roll = rng();
  const index = Math.floor(roll * ALL_BOSS_IDS.length);
  return ALL_BOSS_IDS[Math.min(index, ALL_BOSS_IDS.length - 1)];
}

export function getMiniBossDifficulty(id: MiniBossId): number {
  return DIFFICULTY_RATINGS[id];
}
