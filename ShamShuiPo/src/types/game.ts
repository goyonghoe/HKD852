// ── Neon Survivors: Core Types ──
// Pure TypeScript — NO Phaser imports.

// ════════════════════════════════════════════════════════════════
// § SCENE KEYS
// ════════════════════════════════════════════════════════════════

export const SCENE_KEYS = {
  BOOT: "BootScene",
  PRELOAD: "PreloadScene",
  MAIN_MENU: "MainMenuScene",
  CHARACTER_SELECT: "CharacterSelectScene",
  GAME: "GameScene",
  GAME_OVER: "GameOverScene",
  META: "MetaScene",
} as const;

// ════════════════════════════════════════════════════════════════
// § PLAYER
// ════════════════════════════════════════════════════════════════

export interface WeaponSlot {
  weaponId: string;
  level: number; // 1-5
  cooldownTimer: number; // seconds remaining until next fire
}

export interface PassiveSlot {
  passiveId: string;
  level: number; // 1-maxLevel
}

export interface PlayerState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  weapons: WeaponSlot[];
  passives: PassiveSlot[];
  xp: number;
  level: number;
  coins: number;
  diamonds: number;
  invincibilityTimer: number; // seconds remaining of i-frames
}

// ════════════════════════════════════════════════════════════════
// § ENEMIES
// ════════════════════════════════════════════════════════════════

export interface EnemyInstance {
  id: string;
  enemyId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  active: boolean;
}

// ════════════════════════════════════════════════════════════════
// § PROJECTILES
// ════════════════════════════════════════════════════════════════

export interface ProjectileInstance {
  id: string;
  weaponId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number; // remaining pierce count
  area: number; // hit/explosion radius
  lifetime: number; // seconds remaining
}

// ════════════════════════════════════════════════════════════════
// § XP GEMS
// ════════════════════════════════════════════════════════════════

export interface XpGem {
  id: string;
  x: number;
  y: number;
  value: number;
  lifetime: number; // seconds remaining
}

// ════════════════════════════════════════════════════════════════
// § PICKUPS (coins, health)
// ════════════════════════════════════════════════════════════════

export interface CoinDrop {
  id: string;
  x: number;
  y: number;
  value: number;
  lifetime: number; // seconds remaining
}

export interface HealthPickup {
  id: string;
  x: number;
  y: number;
  value: number; // HP to restore
  lifetime: number; // seconds remaining
}

// ════════════════════════════════════════════════════════════════
// § RUN STATE
// ════════════════════════════════════════════════════════════════

export type RunPhase =
  | "playing"
  | "level_up"
  | "boss"
  | "game_over"
  | "victory";

export interface RunState {
  elapsed: number; // seconds since run start
  phase: RunPhase;
  player: PlayerState;
  enemies: EnemyInstance[];
  projectiles: ProjectileInstance[];
  xpGems: XpGem[];
  coinDrops: CoinDrop[];
  healthPickups: HealthPickup[];
  waveMinute: number; // current minute index into WAVE_TIMELINE
  bossesSpawned: string[]; // boss IDs already spawned this run
  score: number;
  kills: number; // total enemies killed this run
}

// ════════════════════════════════════════════════════════════════
// § NEON SIGN COMBO SYSTEM
// ════════════════════════════════════════════════════════════════

import { NEON_SIGNS } from "../config/balance";

export type FragmentType = (typeof NEON_SIGNS.fragmentTypes)[number];

export type NeonEffect =
  | "luck"
  | "damage"
  | "coinDrop"
  | "knockback"
  | "fireAura"
  | "critChance"
  | "allDamage"
  | "allDrop";

export interface NeonComboResult {
  name: string;
  effect: NeonEffect;
  multiplier: number;
  durationMs: number;
  consumedFragments: FragmentType[];
}

export interface NeonBuff {
  name: string;
  effect: NeonEffect;
  multiplier: number;
  remainingMs: number;
}

// ════════════════════════════════════════════════════════════════
// § UPGRADE CHOICES
// ════════════════════════════════════════════════════════════════

export interface UpgradeChoice {
  type: "weapon" | "passive" | "evolution";
  id: string;
  level: number; // level AFTER picking this choice
  isNew: boolean; // true if player doesn't have this yet
}
