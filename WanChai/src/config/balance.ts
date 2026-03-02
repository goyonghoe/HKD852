export const BALANCE = {
  PLAYER: {
    baseMoveSpeed: 300,       // px/s (horizontal only)
    baseY: 1200,              // fixed Y position (behind base wall)
    critMultiplier: 2.0,      // default crit multiplier (for Player.critDamage)
  },
  BASE: {
    hp: 600,                  // base wall hit points (was 1000 — lowered for tension)
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
    initialDelayMs: 600,      // faster first spawn (was 800)
    baseIntervalMs: 800,      // tighter base spawn (was 900)
    minIntervalMs: 400,       // faster cap (was 500)
    intervalDecayPerMin: 0.45, // steeper decay — swarms faster (was 0.50)
    maxEnemiesOnScreen: 45,   // higher cap for more pressure (was 35)
    spawnYMin: -50,           // spawn above screen top
    spawnYMax: -10,
    eliteChanceBase: 0.10,    // 10% (was 8%)
    eliteChancePerMin: 0.25,  // +25% per minute (was 20%)
    eliteChanceMax: 0.50,     // cap at 50% — prevents late-game all-elite swarms
  },
  DIFFICULTY: {
    hpScalePerMin: 2.2,       // enemy HP scaling per minute (was 3.0 — too aggressive)
    speedScalePerMin: 1.5,    // (was 1.4)
    damageScalePerMin: 2.0,   // (was 1.8)
    maxSpeedMultiplier: 2.8,  // (was 2.5)
    maxBossHp: 15000,         // hard cap on boss HP after all scaling
  },
  XP: {
    basePerLevel: 10,
    growthFactor: 1.25,       // each level needs 25% more
  },
  COMBAT: {
    critMultiplier: 2.0,
    knockbackForce: 60,
    knockbackDuration: 150,
    homingBaseTurnRate: 4,
    homingTurnRatePerLevel: 0.5,
  },
  ENEMY_BEHAVIOR: {
    bossOrbitCenterY: 500,
    bossOrbitRadius: 200,
    bossOrbitSpeed: 2,           // rad/s
    teleportJumpYMin: 100,
    teleportJumpYRange: 50,
    teleportJumpXRange: 100,
  },
  RUN: {
    stageDurationMs: 60000,   // 60 seconds — spawning stops here
    goldPerKill: 1,
    goldPerElite: 5,
    goldPerBoss: 50,
    maxWeapons: 4,            // max weapon types per run (after 4, only upgrades offered)
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
    maxStages: 6,
    clearHealPercent: 0.20,       // heal 20% base HP between stages (was 30%)
    clearPauseMs: 2000,           // "Stage Clear" overlay duration
    difficultyPerStage: {
      hpMult: 1.5,                // cumulative per stage (was 1.3 — steeper scaling)
      speedMult: 1.15,            // (was 1.1)
      damageMult: 1.25,           // (was 1.15)
    },
    stages: [
      { type: 'wave', durationMs: 60000, name: '중환 구역', enemyPool: ['basic', 'fast', 'swarm'] },
      { type: 'boss', bossId: 'boss', name: '중환 보스' },
      { type: 'wave', durationMs: 60000, name: '침사추이', enemyPool: ['basic', 'fast', 'swarm', 'tank', 'special', 'sniper_enemy'] },
      { type: 'boss', bossId: 'boss_circle', name: '침사추이 보스' },
      { type: 'wave', durationMs: 60000, name: '빅토리아 피크', enemyPool: ['basic', 'fast', 'swarm', 'tank', 'special', 'splitter', 'chaser', 'shooter', 'sniper_enemy', 'guardian', 'teleporter'] },
      { type: 'boss', bossId: 'boss_burst', name: '최종 보스' },
    ] as readonly { type: 'wave' | 'boss'; durationMs?: number; bossId?: string; name: string; enemyPool?: string[] }[],
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
    autoSelectDelayMs: 5000,
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
