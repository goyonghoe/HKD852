export const BALANCE = {
  PLAYER: {
    baseMoveSpeed: 300,       // px/s (horizontal only)
    baseY: 1100,              // fixed Y position (just above base wall)
    critMultiplier: 2.0,      // default crit multiplier (for Player.critDamage)
  },
  BASE: {
    hp: 1000,                 // base wall hit points
    y: 1200,                  // base wall Y position (near bottom)
    height: 40,               // wall visual height
    damageFlashMs: 200,       // flash duration on hit
  },
  SPAWN: {
    initialDelayMs: 1000,
    baseIntervalMs: 1200,     // time between spawns
    minIntervalMs: 800,       // fastest spawn rate (was 400)
    intervalDecayPerMin: 0.40, // gentler decay for 60s stage
    maxEnemiesOnScreen: 30,   // hard cap — prevents frame drops
    spawnYMin: -50,           // spawn above screen top
    spawnYMax: -10,
    eliteChanceBase: 0.05,    // 5%
    eliteChancePerMin: 0.15,  // +15% per minute
    bossTimeMinutes: 0.83,    // boss spawns at ~50s
  },
  DIFFICULTY: {
    hpScalePerMin: 2.0,       // enemy HP 2x by end of 60s stage
    speedScalePerMin: 1.3,
    damageScalePerMin: 1.5,
    maxSpeedMultiplier: 2.0,
  },
  XP: {
    basePerLevel: 10,
    growthFactor: 1.25,       // each level needs 25% more
  },
  COMBAT: {
    critMultiplier: 2.0,
    knockbackForce: 100,
    knockbackDuration: 150,
  },
  RUN: {
    stageDurationMs: 60000,   // 60 seconds — spawning stops here
    goldPerKill: 1,
    goldPerElite: 5,
    goldPerBoss: 50,
  },
  MID_SHOP: {
    triggerTimeMs: 30000,       // show shop at 30s mark
    healBasePercent: 0.30,      // restore 30% base HP
    healCost: 15,
    damageBoostPercent: 0.25,   // +25% damage
    damageCost: 20,
    armorBoostPercent: 0.25,    // +25% armor (reduce incoming damage)
    armorCost: 20,
  },
  STAGE: {
    maxStages: 3,
    durationMs: 60000,            // each stage 60s
    clearHealPercent: 0.30,       // heal 30% base HP between stages
    clearPauseMs: 2000,           // "Stage Clear" overlay duration
    difficultyPerStage: {
      hpMult: 1.5,                // cumulative per stage (S2=1.5x, S3=2.25x)
      speedMult: 1.2,
      damageMult: 1.3,
    },
    bossPerStage: ['boss', 'boss_circle', 'boss_burst'] as readonly string[],
  },
  GAME_SPEED: {
    options: [1, 1.5, 2, 3] as readonly number[],
  },
} as const;

export const VISUAL = {
  ANIM: {
    hitFlashMs: 80,
    deathFadeMs: 200,
    levelUpPauseMs: 100,
    orbFloatSpeed: 2,
    // Legacy fields kept for existing UI components
    BUTTON_PRESS: 80,
    SCENE_FADE: 500,
    SCORE_ROLL_MIN: 800,
    SCORE_ROLL_MAX: 1500,
  },
  PARTICLE: {
    deathBurst: 8,
    hitSpark: 3,
    xpPickup: 4,
  },
  UI: {
    xpBarWidth: 600,
    xpBarHeight: 8,
    upgradeCardWidth: 200,
    upgradeCardHeight: 240,
    upgradeCardGap: 16,
    baseBarWidth: 680,
    baseBarHeight: 16,
    // Legacy fields kept for existing UI components
    BUTTON_MIN_WIDTH: 220,
    BUTTON_HEIGHT: 60,
    MIN_TOUCH_TARGET: 48,
    // Kept for any remaining references
    hpBarWidth: 200,
    hpBarHeight: 12,
    joystickRadius: 60,
    joystickDeadzone: 10,
  },
} as const;
