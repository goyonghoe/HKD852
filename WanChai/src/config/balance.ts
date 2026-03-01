export const BALANCE = {
  PLAYER: {
    baseMoveSpeed: 300,       // px/s (horizontal only)
    baseY: 1200,              // fixed Y position (behind base wall)
    critMultiplier: 2.0,      // default crit multiplier (for Player.critDamage)
  },
  BASE: {
    hp: 1000,                 // base wall hit points
    y: 1100,                  // base wall Y position (in front of player)
    height: 30,               // wall visual height
    damageFlashMs: 200,       // flash duration on hit
  },
  ALLY: {
    leftX: 60,                // sniper ally X
    rightX: 660,              // spread ally X
    baseY: 1200,              // same Y as player
    sniperCooldownMs: 1500,   // single-target, high damage
    sniperDamage: 40,
    sniperRange: 800,
    spreadCooldownMs: 1000,   // multi-target, low damage
    spreadDamage: 8,
    spreadCount: 5,           // targets up to 5 enemies
    spreadRange: 600,
  },
  SPAWN: {
    initialDelayMs: 800,
    baseIntervalMs: 900,      // faster base spawn (was 1200)
    minIntervalMs: 500,       // faster cap (was 800)
    intervalDecayPerMin: 0.50, // steeper decay — late game swarms
    maxEnemiesOnScreen: 35,   // slightly higher cap
    spawnYMin: -50,           // spawn above screen top
    spawnYMax: -10,
    eliteChanceBase: 0.08,    // 8% (was 5%)
    eliteChancePerMin: 0.20,  // +20% per minute (was 15%)
    bossTimeMinutes: 0.83,    // boss spawns at ~50s
  },
  DIFFICULTY: {
    hpScalePerMin: 2.5,       // enemy HP 2.5x by end of 60s stage (was 2.0)
    speedScalePerMin: 1.4,    // (was 1.3)
    damageScalePerMin: 1.8,   // (was 1.5)
    maxSpeedMultiplier: 2.5,  // (was 2.0)
  },
  XP: {
    basePerLevel: 10,
    growthFactor: 1.25,       // each level needs 25% more
  },
  COMBAT: {
    critMultiplier: 2.0,
    knockbackForce: 60,
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
    options: [1, 1.5, 2] as readonly number[],
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
