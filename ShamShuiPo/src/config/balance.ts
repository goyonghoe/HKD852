// ── Neon Survivors: Balance Configuration ──
// Pure TypeScript — NO Phaser imports. All numbers are implementation-ready.
// Design: 10-min bullet heaven runs, portrait 720x1280, auto-attack, joystick movement.

// ════════════════════════════════════════════════════════════════
// § GAME DIMENSIONS
// ════════════════════════════════════════════════════════════════

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// ════════════════════════════════════════════════════════════════
// § PLAYER BASE STATS
// ════════════════════════════════════════════════════════════════

export const PLAYER_BASE = {
  hp: 100,
  speed: 150, // pixels/sec — brisk walk, dodgeable
  magnetRadius: 50, // XP gem pickup radius (px)
  armor: 0,
  critChance: 0.05, // 5%
  critMultiplier: 1.5,
  invincibilityMs: 200, // i-frames after taking damage
  regenPerSec: 0, // base regen, upgraded via passives
} as const;

// ════════════════════════════════════════════════════════════════
// § XP & LEVELING
// ════════════════════════════════════════════════════════════════

// Target: ~15 level-ups in 10 min.
// First level-up at ~20s, later ones every 40-60s.
// XP required PER level (cumulative total not used — each level resets bar).
export const XP_THRESHOLDS: readonly number[] = [
  //  Lv  XP    Approx time   Notes
  8, //  1    8     ~0:20       instant gratification
  12, //  2   12     ~0:40       still fast
  18, //  3   18     ~1:05       discovering weapons
  25, //  4   25     ~1:30       first build choices
  33, //  5   33     ~2:00       mid-early
  42, //  6   42     ~2:35       ramp begins
  52, //  7   52     ~3:15       weapon combo unlocks
  63, //  8   63     ~4:00       approaching mini-boss
  75, //  9   75     ~4:50       right before mini-boss
  88, // 10   88     ~5:45       post-boss power spike
  100, // 11  100     ~6:35       late game ramp
  110, // 12  110     ~7:20       power fantasy peak
  118, // 13  118     ~8:00       screen-clear builds online
  125, // 14  125     ~8:40       final stretch
  130, // 15  130     ~9:15       last upgrade before final boss
] as const;

// XP gem values
export const XP_GEM = {
  small: 1, // standard drop
  medium: 3, // elite drop
  large: 8, // boss drop
  magnetAll: true, // level-up vacuums all gems on screen
} as const;

// ════════════════════════════════════════════════════════════════
// § WEAPON DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface WeaponDef {
  id: string;
  name: string;
  baseDamage: number;
  fireRate: number; // shots per second
  range: number; // pixels (0 = infinite / screen-wide)
  projectileCount: number;
  projectileSpeed: number; // pixels/sec (0 = instant)
  area: number; // hit/explosion radius (px)
  pierce: number; // how many enemies one projectile passes through (0 = dies on hit)
  targeting: "nearest" | "random" | "spread" | "orbit" | "forward" | "area";
  description: string;
}

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: {
    id: "pistol",
    name: "Neon Pistol",
    baseDamage: 10,
    fireRate: 2.0,
    range: 400,
    projectileCount: 1,
    projectileSpeed: 600,
    area: 8,
    pierce: 0,
    targeting: "nearest",
    description: "Reliable sidearm. Fast, accurate, single target.",
  },
  shotgun: {
    id: "shotgun",
    name: "Scatter Blaster",
    baseDamage: 8,
    fireRate: 0.8,
    range: 250,
    projectileCount: 5,
    projectileSpeed: 500,
    area: 10,
    pierce: 0,
    targeting: "spread",
    description: "Fan of pellets. Devastating at close range.",
  },
  laser: {
    id: "laser",
    name: "Beam Cutter",
    baseDamage: 4,
    fireRate: 8.0, // rapid ticks
    range: 350,
    projectileCount: 1,
    projectileSpeed: 0, // instant beam
    area: 12,
    pierce: 3,
    targeting: "nearest",
    description: "Continuous beam that pierces enemies.",
  },
  missile: {
    id: "missile",
    name: "Homing Rocket",
    baseDamage: 35,
    fireRate: 0.5,
    range: 0, // screen-wide homing
    projectileCount: 1,
    projectileSpeed: 300,
    area: 60,
    pierce: 0,
    targeting: "nearest",
    description: "Slow but devastating. Splash damage on impact.",
  },
  boomerang: {
    id: "boomerang",
    name: "Cyber Boomerang",
    baseDamage: 15,
    fireRate: 1.0,
    range: 300,
    projectileCount: 1,
    projectileSpeed: 350,
    area: 20,
    pierce: 5, // hits many on return trip
    targeting: "forward",
    description: "Flies out and returns, hitting enemies both ways.",
  },
  lightning: {
    id: "lightning",
    name: "Tesla Arc",
    baseDamage: 12,
    fireRate: 1.5,
    range: 200,
    projectileCount: 1,
    projectileSpeed: 0, // instant
    area: 30,
    pierce: 3, // chains to 3 enemies
    targeting: "random",
    description: "Chains between nearby enemies. Great for crowds.",
  },
  flamethrower: {
    id: "flamethrower",
    name: "Plasma Torch",
    baseDamage: 6,
    fireRate: 6.0,
    range: 150,
    projectileCount: 1,
    projectileSpeed: 250,
    area: 40,
    pierce: 99, // passes through everything
    targeting: "forward",
    description: "Short-range cone of fire. Melts groups.",
  },
  orbital: {
    id: "orbital",
    name: "Drone Ring",
    baseDamage: 18,
    fireRate: 1.2,
    range: 120, // orbit radius
    projectileCount: 2,
    projectileSpeed: 0, // orbits player
    area: 16,
    pierce: 99,
    targeting: "orbit",
    description: "Drones orbit the player, damaging anything they touch.",
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § WEAPON LEVEL-UP SCALING
// ════════════════════════════════════════════════════════════════

// Each weapon can be leveled up to 5 via duplicate picks.
// Per-level multipliers (index 0 = level 1 base, index 4 = level 5 max).
export const WEAPON_LEVEL_SCALING = {
  damageMultiplier: [1.0, 1.3, 1.6, 2.0, 2.5] as readonly number[],
  fireRateMultiplier: [1.0, 1.1, 1.2, 1.3, 1.5] as readonly number[],
  projectileBonus: [0, 0, 1, 1, 2] as readonly number[], // extra projectiles
  areaMultiplier: [1.0, 1.0, 1.15, 1.3, 1.5] as readonly number[],
  pierceBonus: [0, 0, 0, 1, 2] as readonly number[],
} as const;

// ════════════════════════════════════════════════════════════════
// § WEAPON EVOLUTIONS
// ════════════════════════════════════════════════════════════════

export interface EvolutionRecipe {
  weapon: string; // base weapon (must be level 5)
  passive: string; // required passive (any level)
  result: string; // evolved weapon id
  resultName: string;
  resultDamage: number;
  resultFireRate: number;
  description: string;
}

export const EVOLUTIONS: readonly EvolutionRecipe[] = [
  {
    weapon: "pistol",
    passive: "crit",
    result: "evo_pistol",
    resultName: "Neon Executioner",
    resultDamage: 30,
    resultFireRate: 3.0,
    description: "Every shot crits. Guaranteed headshots.",
  },
  {
    weapon: "shotgun",
    passive: "area",
    result: "evo_shotgun",
    resultName: "Shrapnel Storm",
    resultDamage: 14,
    resultFireRate: 1.2,
    description: "Pellets explode on hit, creating sub-projectiles.",
  },
  {
    weapon: "laser",
    passive: "cooldown",
    result: "evo_laser",
    resultName: "Death Ray",
    resultDamage: 8,
    resultFireRate: 12.0,
    description: "Wider beam, infinite pierce, melts everything in its path.",
  },
  {
    weapon: "missile",
    passive: "damage",
    result: "evo_missile",
    resultName: "Nuke Launcher",
    resultDamage: 80,
    resultFireRate: 0.4,
    description: "Massive AoE. Screen-shaking explosions.",
  },
  {
    weapon: "boomerang",
    passive: "projectile",
    result: "evo_boomerang",
    resultName: "Glaive Storm",
    resultDamage: 22,
    resultFireRate: 1.5,
    description: "Three glaives orbit outward, returning through enemies.",
  },
  {
    weapon: "lightning",
    passive: "luck",
    result: "evo_lightning",
    resultName: "Ion Storm",
    resultDamage: 25,
    resultFireRate: 2.0,
    description: "Chains to 8 enemies. Paralyzes for 0.5s.",
  },
  {
    weapon: "flamethrower",
    passive: "speed",
    result: "evo_flamethrower",
    resultName: "Hellfire Jet",
    resultDamage: 10,
    resultFireRate: 8.0,
    description: "360° flame aura. Walk into enemies to kill them.",
  },
  {
    weapon: "orbital",
    passive: "armor",
    result: "evo_orbital",
    resultName: "Sentinel Swarm",
    resultDamage: 28,
    resultFireRate: 1.5,
    description: "Six drones. Reflect projectiles on contact.",
  },
] as const;

// ════════════════════════════════════════════════════════════════
// § ENEMY DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number; // pixels/sec
  damage: number; // contact damage per hit
  xpDrop: number; // XP gems (small=1 each)
  coinDrop: number; // coins on death (before luck bonus)
  tier: 1 | 2 | 3; // 1=fodder, 2=mid, 3=elite
  knockbackResist: number; // 0 = full knockback, 1 = immune
}

export const ENEMIES: Record<string, EnemyDef> = {
  // ── Tier 1: Fodder (minutes 0-3, swarm numbers) ──
  drone: {
    id: "drone",
    name: "Street Drone",
    hp: 15,
    speed: 70,
    damage: 5,
    xpDrop: 1,
    coinDrop: 1,
    tier: 1,
    knockbackResist: 0,
  },
  crawler: {
    id: "crawler",
    name: "Sewer Crawler",
    hp: 25,
    speed: 50,
    damage: 8,
    xpDrop: 1,
    coinDrop: 1,
    tier: 1,
    knockbackResist: 0.2,
  },

  // ── Tier 2: Mid (minutes 3-6, tougher, mixed with T1) ──
  enforcer: {
    id: "enforcer",
    name: "Corp Enforcer",
    hp: 60,
    speed: 55,
    damage: 12,
    xpDrop: 2,
    coinDrop: 2,
    tier: 2,
    knockbackResist: 0.4,
  },
  dasher: {
    id: "dasher",
    name: "Neon Dasher",
    hp: 35,
    speed: 130,
    damage: 10,
    xpDrop: 2,
    coinDrop: 2,
    tier: 2,
    knockbackResist: 0.1,
  },

  // ── Tier 3: Elite (minutes 6-10, tanky, dangerous) ──
  sentinel: {
    id: "sentinel",
    name: "Mech Sentinel",
    hp: 150,
    speed: 40,
    damage: 20,
    xpDrop: 5,
    coinDrop: 4,
    tier: 3,
    knockbackResist: 0.8,
  },
  bomber: {
    id: "bomber",
    name: "Suicide Bomber",
    hp: 50,
    speed: 100,
    damage: 40, // huge damage if it reaches player
    xpDrop: 3,
    coinDrop: 3,
    tier: 3,
    knockbackResist: 0.3,
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § BOSS DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface BossDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xpDrop: number;
  coinDrop: number;
  phases: number;
  specialAttack: string;
}

export const BOSSES: Record<string, BossDef> = {
  mini_boss: {
    id: "mini_boss",
    name: "Riot Commander",
    hp: 800,
    speed: 45,
    damage: 15,
    xpDrop: 30,
    coinDrop: 50,
    phases: 2,
    specialAttack: "charge_dash", // Phase 1: summons adds. Phase 2: charges at player.
  },
  chapter_boss: {
    id: "chapter_boss",
    name: "Yakuza Mech",
    hp: 2500,
    speed: 35,
    damage: 25,
    xpDrop: 60,
    coinDrop: 100,
    phases: 3,
    specialAttack: "missile_barrage", // Phase 1: melee swipes. Phase 2: ranged missiles. Phase 3: enrage + both.
  },
  final_boss: {
    id: "final_boss",
    name: "Neon Overlord",
    hp: 5000,
    speed: 30,
    damage: 35,
    xpDrop: 100,
    coinDrop: 200,
    phases: 3,
    specialAttack: "laser_grid", // Phase 1: sweeping lasers. Phase 2: bullet hell rings. Phase 3: arena shrink + enrage.
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § WAVE TIMELINE (per minute)
// ════════════════════════════════════════════════════════════════

export interface WaveConfig {
  minute: number;
  enemiesPerSecond: number; // spawn rate
  enemyPool: string[]; // which enemy IDs can spawn
  hpMultiplier: number; // applied to base enemy HP
  speedMultiplier: number; // applied to base enemy speed
  damageMultiplier: number; // applied to base enemy damage
  bossSpawn?: string; // boss id if boss spawns this minute
  event?: string; // special event description
}

export const WAVE_TIMELINE: readonly WaveConfig[] = [
  // ── ACT 1: Tutorial / Power Discovery (min 0-2) ──
  {
    minute: 0,
    enemiesPerSecond: 0.8,
    enemyPool: ["drone"],
    hpMultiplier: 1.0,
    speedMultiplier: 1.0,
    damageMultiplier: 1.0,
    event: "Warm-up. Player learns movement.",
  },
  {
    minute: 1,
    enemiesPerSecond: 1.2,
    enemyPool: ["drone", "crawler"],
    hpMultiplier: 1.0,
    speedMultiplier: 1.0,
    damageMultiplier: 1.0,
  },
  {
    minute: 2,
    enemiesPerSecond: 1.8,
    enemyPool: ["drone", "crawler"],
    hpMultiplier: 1.1,
    speedMultiplier: 1.05,
    damageMultiplier: 1.0,
    event: "First significant wave. Should have 2+ weapons by now.",
  },

  // ── ACT 2: Build Phase (min 3-4) ──
  {
    minute: 3,
    enemiesPerSecond: 2.5,
    enemyPool: ["drone", "crawler", "enforcer"],
    hpMultiplier: 1.2,
    speedMultiplier: 1.1,
    damageMultiplier: 1.1,
    event: "Tier 2 enemies arrive. DPS check begins.",
  },
  {
    minute: 4,
    enemiesPerSecond: 3.0,
    enemyPool: ["drone", "crawler", "enforcer", "dasher"],
    hpMultiplier: 1.4,
    speedMultiplier: 1.15,
    damageMultiplier: 1.2,
  },

  // ── ACT 3: Mini-boss + Mid Ramp (min 5-6) ──
  {
    minute: 5,
    enemiesPerSecond: 2.0, // lower during boss
    enemyPool: ["enforcer", "dasher"],
    hpMultiplier: 1.6,
    speedMultiplier: 1.2,
    damageMultiplier: 1.3,
    bossSpawn: "mini_boss",
    event: "MINI-BOSS. Adds reduced to let player focus.",
  },
  {
    minute: 6,
    enemiesPerSecond: 4.0,
    enemyPool: ["crawler", "enforcer", "dasher", "sentinel"],
    hpMultiplier: 1.8,
    speedMultiplier: 1.2,
    damageMultiplier: 1.4,
    event: "Tier 3 enemies. Build should be taking shape.",
  },

  // ── ACT 4: Power Fantasy Peak (min 7-8) ──
  {
    minute: 7,
    enemiesPerSecond: 5.0,
    enemyPool: ["drone", "crawler", "enforcer", "dasher", "sentinel"],
    hpMultiplier: 2.0,
    speedMultiplier: 1.25,
    damageMultiplier: 1.5,
    event: "SWARM. Hundreds of enemies. Player should feel godlike.",
  },
  {
    minute: 8,
    enemiesPerSecond: 6.0,
    enemyPool: ["enforcer", "dasher", "sentinel", "bomber"],
    hpMultiplier: 2.3,
    speedMultiplier: 1.3,
    damageMultiplier: 1.7,
    bossSpawn: "chapter_boss",
    event: "CHAPTER BOSS + bomber swarm. Screen-filling chaos.",
  },

  // ── ACT 5: Death Pressure / Finale (min 9-10) ──
  {
    minute: 9,
    enemiesPerSecond: 7.0,
    enemyPool: ["enforcer", "sentinel", "bomber"],
    hpMultiplier: 2.8,
    speedMultiplier: 1.35,
    damageMultiplier: 2.0,
    bossSpawn: "final_boss",
    event: "FINAL BOSS. Survive or die. Maximum pressure.",
  },
  {
    minute: 10,
    enemiesPerSecond: 8.0,
    enemyPool: ["sentinel", "bomber"],
    hpMultiplier: 3.5,
    speedMultiplier: 1.4,
    damageMultiplier: 2.5,
    event: "OVERTIME. If player survives, instant victory screen.",
  },
] as const;

// ════════════════════════════════════════════════════════════════
// § PASSIVE UPGRADES (in-run)
// ════════════════════════════════════════════════════════════════

export interface PassiveDef {
  id: string;
  name: string;
  maxLevel: number;
  values: readonly number[]; // value per level (index 0 = level 1)
  unit: "%" | "flat" | "px" | "s"; // display hint
  description: string;
  icon: string;
}

export const PASSIVES: Record<string, PassiveDef> = {
  damage: {
    id: "damage",
    name: "Power Cell",
    maxLevel: 5,
    values: [0.08, 0.16, 0.24, 0.34, 0.45], // % damage increase
    unit: "%",
    description: "+{v}% weapon damage",
    icon: "icon_passive_damage",
  },
  speed: {
    id: "speed",
    name: "Turbo Legs",
    maxLevel: 5,
    values: [0.1, 0.2, 0.3, 0.4, 0.5], // % speed increase
    unit: "%",
    description: "+{v}% move speed",
    icon: "icon_passive_speed",
  },
  hp: {
    id: "hp",
    name: "Nano Plating",
    maxLevel: 5,
    values: [20, 40, 60, 80, 100], // flat HP increase
    unit: "flat",
    description: "+{v} max HP",
    icon: "icon_passive_hp",
  },
  crit: {
    id: "crit",
    name: "Precision Chip",
    maxLevel: 5,
    values: [0.05, 0.1, 0.15, 0.2, 0.3], // crit chance increase
    unit: "%",
    description: "+{v}% crit chance",
    icon: "icon_passive_crit",
  },
  crit_dmg: {
    id: "crit_dmg",
    name: "Amplifier",
    maxLevel: 5,
    values: [0.2, 0.4, 0.6, 0.8, 1.0], // crit multiplier increase
    unit: "%",
    description: "+{v}x crit damage",
    icon: "icon_passive_crit_dmg",
  },
  area: {
    id: "area",
    name: "Blast Radius",
    maxLevel: 5,
    values: [0.08, 0.16, 0.24, 0.34, 0.45], // % area increase
    unit: "%",
    description: "+{v}% attack area",
    icon: "icon_passive_area",
  },
  cooldown: {
    id: "cooldown",
    name: "Overclock",
    maxLevel: 5,
    values: [0.05, 0.1, 0.15, 0.2, 0.28], // % cooldown reduction
    unit: "%",
    description: "-{v}% weapon cooldown",
    icon: "icon_passive_cooldown",
  },
  magnet: {
    id: "magnet",
    name: "Mag-Boots",
    maxLevel: 5,
    values: [20, 40, 65, 95, 130], // flat magnet radius increase (px)
    unit: "px",
    description: "+{v}px pickup radius",
    icon: "icon_passive_magnet",
  },
  armor: {
    id: "armor",
    name: "Shield Layer",
    maxLevel: 5,
    values: [1, 2, 3, 5, 8], // flat damage reduction
    unit: "flat",
    description: "-{v} damage taken",
    icon: "icon_passive_armor",
  },
  regen: {
    id: "regen",
    name: "Nano Regen",
    maxLevel: 5,
    values: [0.5, 1.0, 1.5, 2.5, 4.0], // HP per second
    unit: "flat",
    description: "+{v} HP/sec",
    icon: "icon_passive_regen",
  },
  projectile: {
    id: "projectile",
    name: "Multi-Shot",
    maxLevel: 3,
    values: [1, 2, 3], // extra projectiles (all weapons)
    unit: "flat",
    description: "+{v} projectile(s)",
    icon: "icon_passive_projectile",
  },
  xp_bonus: {
    id: "xp_bonus",
    name: "Data Leech",
    maxLevel: 5,
    values: [0.1, 0.2, 0.3, 0.4, 0.5], // % XP bonus
    unit: "%",
    description: "+{v}% XP gained",
    icon: "icon_passive_xp",
  },
  luck: {
    id: "luck",
    name: "Fortune Chip",
    maxLevel: 5,
    values: [0.05, 0.1, 0.18, 0.28, 0.4], // affects rare drop chance & upgrade rarity
    unit: "%",
    description: "+{v}% luck",
    icon: "icon_passive_luck",
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § META PROGRESSION (permanent upgrades between runs)
// ════════════════════════════════════════════════════════════════

export interface MetaUpgradeDef {
  id: string;
  name: string;
  maxLevel: number;
  costPerLevel: readonly number[]; // currency cost per level
  valuePerLevel: readonly number[]; // bonus per level
  currency: "coins" | "diamonds";
  description: string;
}

export const META_UPGRADES: Record<string, MetaUpgradeDef> = {
  meta_hp: {
    id: "meta_hp",
    name: "Reinforced Frame",
    maxLevel: 10,
    costPerLevel: [50, 100, 200, 350, 550, 800, 1100, 1500, 2000, 3000],
    valuePerLevel: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], // flat HP bonus
    currency: "coins",
    description: "+{v} starting HP",
  },
  meta_damage: {
    id: "meta_damage",
    name: "Weapon Tuning",
    maxLevel: 10,
    costPerLevel: [80, 160, 300, 500, 750, 1050, 1400, 1850, 2400, 3500],
    valuePerLevel: [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2], // % damage bonus
    currency: "coins",
    description: "+{v}% base damage",
  },
  meta_speed: {
    id: "meta_speed",
    name: "Leg Servos",
    maxLevel: 5,
    costPerLevel: [100, 250, 500, 900, 1500],
    valuePerLevel: [0.03, 0.06, 0.09, 0.12, 0.15], // % speed bonus
    currency: "coins",
    description: "+{v}% move speed",
  },
  meta_magnet: {
    id: "meta_magnet",
    name: "Magnetic Field",
    maxLevel: 5,
    costPerLevel: [60, 150, 300, 600, 1000],
    valuePerLevel: [10, 20, 30, 40, 50], // flat px
    currency: "coins",
    description: "+{v}px pickup radius",
  },
  meta_revive: {
    id: "meta_revive",
    name: "Second Chance",
    maxLevel: 1,
    costPerLevel: [5],
    valuePerLevel: [1], // allows 1 free revive (no ad)
    currency: "diamonds",
    description: "Free revive once per run",
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § ECONOMY
// ════════════════════════════════════════════════════════════════

export const ECONOMY = {
  // ── Coins (soft currency) ──
  startingCoins: 0,
  coinDropChance: 0.3, // 30% of enemies drop coins
  coinDropMin: 1,
  coinDropMax: 3,
  bossCoins: 50, // guaranteed boss coin drop (mini)
  chapterBossCoins: 100,
  finalBossCoins: 200,

  // ── Diamonds (premium / hard currency) ──
  diamondsPerRun: 0, // earned via achievements, not random drops
  diamondsPerAd: 5,
  diamondRunBonus: 10, // if player watches ad at end of run

  // ── Revive ──
  reviveAdCost: 1, // 1 ad watch to revive
  reviveLimit: 1, // max 1 per run
  reviveHpPercent: 0.3, // revive at 30% HP

  // ── Coin doubler (ad-based) ──
  coinDoublerAdCost: 1,
  coinDoublerMultiplier: 2.0,

  // ── Chest system ──
  commonChestCost: 100, // coins
  rareChestCost: 500, // coins
  premiumChestCost: 20, // diamonds
} as const;

// ════════════════════════════════════════════════════════════════
// § RUN SETTINGS
// ════════════════════════════════════════════════════════════════

export const RUN = {
  duration: 600, // 10 minutes in seconds
  miniBossTime: 300, // 5:00
  chapterBossTime: 480, // 8:00
  finalBossTime: 540, // 9:00
  overtimeStart: 600, // 10:00 — survive = win
  maxWeaponSlots: 6,
  maxPassiveSlots: 6,
  upgradeChoices: 3, // choices per level-up
  rerollCost: 1, // diamond cost to reroll upgrade choices
  levelUpPause: true, // pause game during level-up choice
  startingWeapon: "pistol", // every run begins with this
} as const;

// ════════════════════════════════════════════════════════════════
// § COMBAT FORMULAS (reference for programmer)
// ════════════════════════════════════════════════════════════════

/**
 * Damage formula:
 *   baseDmg = weapon.baseDamage × weaponLevelMultiplier
 *   totalDmg = baseDmg × (1 + passiveDamageBonus + metaDamageBonus)
 *   if crit: totalDmg × (PLAYER_BASE.critMultiplier + passiveCritDmgBonus)
 *   finalDmg = max(1, totalDmg - enemy.armor) // enemies have no armor currently
 *
 * Effective DPS targets (single enemy, no crit, level 1 weapon):
 *   pistol:  20 dps (10 × 2.0)
 *   shotgun: 32 dps (8 × 5 × 0.8) — if all pellets hit
 *   laser:   32 dps (4 × 8.0)
 *   missile: 17.5 dps (35 × 0.5) — but AoE
 *   boomerang: 15 dps (15 × 1.0) — hits twice (out + back)
 *   lightning: 18 dps (12 × 1.5) — chains
 *   flame:    36 dps (6 × 6.0) — short range
 *   orbital:  21.6 dps (18 × 1.2) — passive damage
 *
 * TTK targets (time-to-kill, single weapon, level 1):
 *   Drone (15 HP):   ~0.75s (pistol), ~0.5s (flame)
 *   Enforcer (60 HP): ~3s (pistol), ~1.7s (flame)
 *   Sentinel (150 HP): ~7.5s (pistol) — needs multiple weapons
 *
 * Player survivability:
 *   Drone damage:  5/hit → 20 hits to kill player (100 HP)
 *   Enforcer:     12/hit → 8 hits
 *   Sentinel:     20/hit → 5 hits
 *   Bomber:       40/hit → 2-3 hits (very dangerous)
 */

// ════════════════════════════════════════════════════════════════
// § SPAWN GEOMETRY
// ════════════════════════════════════════════════════════════════

export const SPAWN = {
  /** Enemies spawn at a ring around the player at this radius */
  spawnRadius: 700, // just beyond screen edge (diagonal ~740px)
  /** Minimum distance between spawns to prevent overlap */
  minSpawnSpacing: 30,
  /** Boss spawns at this fixed offset from player */
  bossSpawnOffset: 500,
  /** Despawn distance (stop updating enemies too far away) */
  despawnRadius: 1200,
} as const;

// ════════════════════════════════════════════════════════════════
// § DIFFICULTY SCALING (for New Game+ / endless mode)
// ════════════════════════════════════════════════════════════════

export const DIFFICULTY = {
  /** Per-loop multipliers for NG+ style repeat runs */
  loopHpMultiplier: 2.0, // enemy HP doubles each loop
  loopDamageMultiplier: 1.5,
  loopSpeedMultiplier: 1.1,
  loopCoinMultiplier: 1.5, // reward scaling to match
  maxLoops: 5, // cap at 5 loops (extremely hard)
} as const;

// ════════════════════════════════════════════════════════════════
// § UPGRADE RARITY WEIGHTS
// ════════════════════════════════════════════════════════════════

export const UPGRADE_RARITY = {
  /** Weights for upgrade pool selection (sum doesn't need to be 100) */
  weaponWeight: 40, // chance a level-up offers a weapon
  passiveWeight: 60, // chance a level-up offers a passive

  /** When offering a weapon, probability of "new weapon" vs "level up existing" */
  newWeaponChance: 0.6, // 60% new, 40% existing upgrade (early game)
  newWeaponChancePerSlot: -0.1, // per occupied slot, new chance decreases

  /** Evolution offer: appears only when conditions met (weapon lv5 + passive) */
  evolutionPriority: true, // always offer evolution when available
} as const;

// ════════════════════════════════════════════════════════════════
// § DAMAGE NUMBERS & FEEDBACK
// ════════════════════════════════════════════════════════════════

export const FEEDBACK = {
  damageNumberDuration: 600, // ms
  damageNumberRise: 40, // px float up
  critScale: 1.5, // scale multiplier for crit damage text
  screenShakeBoss: 8, // px shake intensity for boss hits
  screenShakeHit: 2, // px shake when player takes damage
  hitFlashDuration: 100, // ms enemy flashes white on hit
  xpGemLifetime: 15000, // ms before gems despawn
  coinLifetime: 20000, // ms before coins despawn
} as const;

// ════════════════════════════════════════════════════════════════
// § JOYSTICK & INPUT
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// § NEON SIGNS (combo pickup system)
// ════════════════════════════════════════════════════════════════

/**
 * Weapon-Fragment affinity mapping.
 * Each weapon has exactly one PRIMARY fragment affinity (SPEC-034 §4.3).
 * primary: +40% additive drop boost for that fragment type.
 * No secondary affinity — SPEC-034 only defines PRIMARY.
 */
export const WEAPON_FRAGMENT_AFFINITY: Record<string, { primary: string }> = {
  pistol: { primary: "力" }, // 정밀 타격 = 집중된 힘
  shotgun: { primary: "大" }, // 넓은 확산 = 크기
  laser: { primary: "火" }, // 광선 에너지
  missile: { primary: "龍" }, // 추적하는 용
  boomerang: { primary: "力" }, // 물리적 투척
  lightning: { primary: "金" }, // 전기 = 금속
  flamethrower: { primary: "火" }, // 화염 그 자체
  orbital: { primary: "金" }, // 기계 = 금속
} as const;

export const NEON_SIGNS = {
  fragmentDropChance: 0.17, // 17% base chance per kill — SPEC-034 §4.1
  primaryAffinityBonus: 0.4, // +40% additive boost for primary affinity weapon — SPEC-034 §4.3
  fragmentFieldLifetimeMs: 20000, // 20s field drop lifetime — SPEC-034 §4.1 (was fragmentLifetimeMs)
  /** @deprecated use fragmentFieldLifetimeMs — kept as alias for backward compat */
  fragmentLifetimeMs: 20000, // 20s — SPEC-034 §4.1: field drops only, inventory = Infinity
  maxHeldFragments: 4, // 4 slots: 3-fragment combo + 1 spare — SPEC-034 §4.1
  fragmentTypes: ["大", "吉", "火", "力", "金", "龍"] as const,
  combos: [
    {
      fragments: ["大", "吉"],
      name: "大吉",
      effect: "luck",
      multiplier: 2.0,
      durationMs: 30000,
    },
    {
      fragments: ["火", "力"],
      name: "火力",
      effect: "damage",
      multiplier: 2.0,
      durationMs: 15000,
    },
    {
      fragments: ["金", "龍"],
      name: "金龍",
      effect: "coinDrop",
      multiplier: 3.0,
      durationMs: 20000,
    },
    {
      fragments: ["大", "力"],
      name: "大力",
      effect: "knockback",
      multiplier: 3.0,
      durationMs: 25000,
    },
    {
      fragments: ["火", "龍"],
      name: "火龍",
      effect: "fireAura",
      multiplier: 1.0,
      durationMs: 20000,
    },
    {
      fragments: ["吉", "金"],
      name: "吉金",
      effect: "critChance",
      multiplier: 1.0,
      durationMs: 25000,
    },
    {
      fragments: ["大", "火", "力"],
      name: "大火力",
      effect: "allDamage",
      multiplier: 3.0,
      durationMs: 10000,
    },
    {
      fragments: ["金", "吉", "龍"],
      name: "金吉龍",
      effect: "allDrop",
      multiplier: 5.0,
      durationMs: 15000,
    },
  ],
} as const;

// ════════════════════════════════════════════════════════════════
// § DAI PAI DONG (大排檔 Buff Stations)
// ════════════════════════════════════════════════════════════════

export const DAI_PAI_DONG = {
  stationCount: 2, // 2 fixed stations per map — SPEC-034 §4.7
  interactionRadiusPx: 60, // must be within 60px
  interactionTimeMs: 0, // instant interaction (0ms) — SPEC-034 §4.7 & issue 5-2
  stationCooldownMs: 60000, // 60s cooldown after use
  interruptOnDamage: true, // taking damage resets progress
  maxActiveBuffs: 1, // only 1 food buff at a time
  menu: [
    {
      id: "wonton",
      name: "雲吞麵",
      nameEn: "Wonton Noodles",
      effect: "healPercent",
      value: 0.3,
      durationMs: 0,
    },
    {
      id: "friedrice",
      name: "鑊氣炒飯",
      nameEn: "Wok Hei Fried Rice",
      effect: "fireDamage",
      value: 0.5,
      durationMs: 20000,
    },
    {
      id: "yuanyang",
      name: "鴛鴦",
      nameEn: "Yuan Yang",
      effect: "speedAndAttack",
      value: 0.25,
      durationMs: 20000,
    },
    {
      id: "eggtart",
      name: "蛋撻",
      nameEn: "Egg Tart",
      effect: "xpBonus",
      value: 1.0,
      durationMs: 15000,
    },
    {
      id: "fishball",
      name: "魚蛋",
      nameEn: "Fish Ball",
      effect: "pierce",
      value: 3,
      durationMs: 20000,
    },
    {
      id: "chickenfeet",
      name: "鳳爪",
      nameEn: "Chicken Feet",
      effect: "armor",
      value: 5,
      durationMs: 30000,
    },
  ],
  /** Coin prices for each food item in the shop menu */
  shopMenuPrices: {
    wonton: 15,
    friedrice: 25,
    yuanyang: 20,
    eggtart: 20,
    fishball: 25,
    chickenfeet: 15,
  } as Record<string, number>,
  /** Fragment purchase options at the Dai Pai Dong shop — SPEC-034 §4.7 */
  fragmentPurchases: {
    /** Buy a random fragment for this many coins — SPEC-034 §4.7: 30코인 */
    randomFragmentCost: 30,
    /** Buy a specific fragment for this many coins — SPEC-034 §4.7: 50코인 */
    specificFragmentCost: 50,
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § BOSS NEON SHIELDS
// ════════════════════════════════════════════════════════════════

/**
 * Boss Neon Shield definitions — SPEC-034 §4.6
 *
 * Shield mechanic: Player SPENDS fragments from inventory to break the shield.
 * NOT combo-buff based. Creates tradeoff: use fragments for combos vs. boss shield.
 *
 * requiredFragmentCount: number of fragments that must be thrown
 * requiredFragmentType: if set, at least one of the thrown fragments must be this type
 * damageReduction: multiplier reduction while shield is active (e.g. 0.50 = 50% damage)
 * vulnerableDurationMs: how long boss is fully exposed after shield breaks
 * autoWeakenMs: time after which shield automatically weakens (prevents soft-lock)
 */
export const BOSS_NEON_SHIELDS = {
  mini_boss: {
    shieldHp: 200, // neon charges — SPEC-034 §4.6
    requiredFragmentCount: 2, // any 2 fragments
    requiredFragmentType: null as string | null, // any type accepted
    damageReduction: 0.5, // 50% damage reduction while active — SPEC-034 §4.6
    vulnerableDurationMs: 10000, // 10s vulnerable window — SPEC-034 §4.6
    autoWeakenMs: 30000, // 30s auto-release — SPEC-034 §4.6
  },
  chapter_boss: {
    shieldHp: 500,
    requiredFragmentCount: 3,
    requiredFragmentType: "火" as string | null, // must include 火 — SPEC-034 §4.6
    damageReduction: 0.7, // 70% damage reduction — SPEC-034 §4.6
    vulnerableDurationMs: 8000,
    autoWeakenMs: 45000,
  },
  final_boss: {
    shieldHp: 800,
    requiredFragmentCount: 3,
    requiredFragmentType: "火" as string | null, // Phase 1 default (火 포함 3개)
    damageReduction: 0.8, // 80% damage reduction — SPEC-034 §4.6
    vulnerableDurationMs: 6000,
    autoWeakenMs: 60000,
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § CHRONO HACK (크로노 핵)
// ════════════════════════════════════════════════════════════════

export const CHRONO_HACK = {
  maxGauge: 100,
  chargePerKill: 2, // regular enemy
  chargePerEliteKill: 5,
  chargePerBossKill: 20,
  durationMs: 3000, // 3 seconds slow-mo
  gameSpeedDuring: 0.3, // 30% game speed
  playerSpeedMultiplier: 1.0, // player moves at normal speed
  damageMultiplier: 1.5,
  critChanceBonus: 0.3, // +30% crit chance
  cooldownAfterUse: true, // gauge resets to 0 after use
  /**
   * Neon synergy: combo meter fills 1.5× faster during Chrono Hack.
   * Used by getComboMeterBonus() in ChronoHackCalc.ts.
   */
  comboMeterBonus: 1.5,
  passiveBonus: {
    // "Chrono Overclock" passive
    extraDurationMs: 1000,
    chargeBoost: 0.2, // +20% charge rate
  },
} as const;

// ════════════════════════════════════════════════════════════════
// § JOYSTICK & INPUT
// ════════════════════════════════════════════════════════════════

export const INPUT = {
  joystickRadius: 60, // px, visual joystick size
  joystickDeadzone: 8, // px, minimum drag to register movement
  joystickX: 180, // default joystick center X (left side)
  joystickY: 1050, // default joystick center Y (bottom area)
  floatingJoystick: true, // joystick appears where player touches
} as const;

// ════════════════════════════════════════════════════════════════
// § COMBAT CAPS (DPS hard cap — SPEC-034 §4.9)
// ════════════════════════════════════════════════════════════════

/**
 * DPS_HARD_CAP: Maximum combined damage multiplier from all buff sources.
 * Prevents crono + combo + food stacking beyond 3.0x base DPS.
 * SPEC-034 §4.9: "어떤 버프 조합이든 기본 DPS의 3.0배를 초과할 수 없다."
 */
export const COMBAT = {
  dpsHardCap: 3.0, // maximum combined damage multiplier from all buff sources
} as const;
