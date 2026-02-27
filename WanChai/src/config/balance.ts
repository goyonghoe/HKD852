import type { CubeSize } from '../types/puzzle';

/** Cube size display + default HP lookup */
export const CUBE_SIZES: Record<CubeSize, { display: number; defaultHp: number }> = {
  S: { display: 48, defaultHp: 1 },
  M: { display: 72, defaultHp: 1 },
  L: { display: 80, defaultHp: 2 },
} as const;

/** Game balance constants */
export const BALANCE = {
  /** Order Puzzle Combat system (SPEC-021) */
  COMBAT: {
    /** Element multipliers */
    ADVANTAGE_MULT: 2.0,
    SAME_MULT: 1.5,
    NEUTRAL_MULT: 1.0,
    DISADVANTAGE_MULT: 0.75,

    /** Hero base ATK by critter rarity */
    HERO_ATK: {
      COMMON: 10,
      UNCOMMON: 15,
      RARE: 20,
    } as Record<string, number>,

    /** Default hero ATK when rarity unknown */
    DEFAULT_HERO_ATK: 10,

    /** Player HP */
    PLAYER_BASE_HP: 100,

    /** Enemy stats by tier */
    ENEMY_TIER: {
      1: { hp: 20, shield: 0, atk: 8, timer: 3 },
      2: { hp: 40, shield: 10, atk: 15, timer: 2 },
      3: { hp: 80, shield: 20, atk: 25, timer: 3 },
    } as Record<number, { hp: number; shield: number; atk: number; timer: number }>,

    /** Scoring per enemy tier */
    SCORE_PER_TIER: { 1: 100, 2: 200, 3: 500 } as Record<number, number>,
    OVERKILL_SCORE_PER_HP: 10,
    EFFICIENCY_BONUS_MULT: 0.5,

    /** Secondary effect damage (from hooks) */
    SPLASH_DAMAGE: 5,
    DOUBLE_STRIKE_DAMAGE: 10,

    /** Bench slots (reduced from 5 — universal targeting makes bench less critical) */
    BENCH_SLOTS: 3,
  },
  /** Element advantage system */
  ELEMENT: {
    ADVANTAGE_DAMAGE: 2,
    ADVANTAGE_SCORE_MULT: 1.5,
    SAME_DAMAGE: 1,
    SAME_SCORE_MULT: 1.0,
  },
  /** Default conveyor lane slots */
  DEFAULT_LANE_SLOTS: 6,
  /** Default bench slots */
  DEFAULT_BENCH_SLOTS: 5,
  /** Max sling combo count */
  MAX_SLING_COMBO: 5,
  /** Sling combo bonus per level (10%) */
  SLING_BONUS_PER_LEVEL: 0.1,
  /** Sling break cooldown in ms */
  SLING_COOLDOWN_MS: 2000,
  /** Double-tap threshold in ms for sling detection */
  SLING_TAP_THRESHOLD_MS: 300,
  /** Base score per cube destroyed */
  SCORE_PER_CUBE: 100,
  /** Bonus per remaining hero when level completes */
  SCORE_PER_REMAINING_HERO: 200,
  /** Bench hero retreat time in ms (time before spent hero disappears from bench) */
  BENCH_RETREAT_MS: 2000,
} as const;

/** Visual tuning */
export const VISUAL = {
  /** Cube size in pixels */
  CUBE_SIZE: 80,
  /** Gap between cubes */
  CUBE_GAP: 4,
  /** Hero size on conveyor */
  HERO_SIZE: 64,
  /** Conveyor belt height */
  CONVEYOR_HEIGHT: 100,
  /** Board top margin from game area */
  BOARD_TOP_MARGIN: 100,
  /** Queue area height */
  QUEUE_HEIGHT: 120,
  /** Bench slot UI */
  BENCH_SLOT_SIZE: 64,
  BENCH_SLOT_GAP: 8,
  /** Animation durations (ms) */
  ANIM: {
    CUBE_DESTROY: 200,
    GRAVITY_FALL: 150,
    HERO_SLIDE: 200,
    PROJECTILE: 100,
    DEPLOY: 300,
    MATCH_FLASH: 100,
    HERO_LAUNCH: 300,
    HERO_RETURN: 200,
    HERO_EXIT: 250,
    HERO_SHIFT: 150,
    HERO_SHIFT_STAGGER: 40,
    ORBIT_STEP_MS: 100,
    DEPLOY_COOLDOWN_MS: 50,
    SCORE_ROLL_MIN: 800,
    SCORE_ROLL_MAX: 1500,
    STAR_REVEAL: 300,
    PANEL_SLIDE: 400,
    BUTTON_PRESS: 80,
    SCENE_FADE: 500,
    BENCH_RETREAT: 400,
  },
  /** Particle system */
  PARTICLE: {
    POOL_SIZE: 200,
    MATCH_DESTROY: { min: 8, max: 15 },
    COMBO_BURST: { min: 15, max: 25 },
    CELEBRATION: { min: 30, max: 50 },
    TRAIL: { min: 3, max: 5 },
    LIFESPAN: { min: 200, max: 400 },
    SPEED: { min: 50, max: 200 },
    GRAVITY_Y: 100,
  },
  /** UI dimensions */
  UI: {
    TOP_BAR_HEIGHT: 90,
    SAFE_AREA_TOP: 40,
    SAFE_AREA_BOTTOM: 40,
    HERO_QUEUE_HEIGHT: 140,
    LEVEL_CARD_SIZE: 160,
    LEVEL_CARD_GAP: 18,
    MIN_TOUCH_TARGET: 56,
    BUTTON_MIN_WIDTH: 220,
    BUTTON_HEIGHT: 60,
    HERO_GRID_CELL: 80,
    HERO_GRID_GAP: 12,
    HERO_GRID_MAX_COLS: 4,
    HERO_GRID_MAX_ROWS: 4,
    BELT_CORNER_RADIUS: 22,
  },
} as const;
