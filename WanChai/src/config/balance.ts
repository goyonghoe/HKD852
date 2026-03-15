import { NEON } from './colors';

export const BALANCE = {
  PLAYER: {
    baseX: 200, // left side of screen — fixed position (side-view)
    baseY: 460, // fixed Y — feet touch street (groundY minus half sprite height)
    targetSize: 128, // player display size in pixels (P1)
    critMultiplier: 2.0, // default crit multiplier (for Player.critDamage)
  },
  BASE: {
    hp: 600, // base wall hit points (was 1000 — lowered for tension)
    y: 660, // base wall Y position (in front of player)
    height: 30, // wall visual height
    damageFlashMs: 200, // flash duration on hit
    leftReachX: 250, // X position enemies reach the base (street defense)
  },
  ALLY: {
    leftX: 60, // sniper ally X
    rightX: 660, // spread ally X
    baseY: 460, // same Y as player
    sniperCooldownMs: 1500, // single-target, high damage
    sniperDamage: 40,
    sniperRange: 800,
    spreadCooldownMs: 1000, // multi-target, low damage
    spreadDamage: 8,
    spreadCount: 5, // targets up to 5 enemies
    spreadRange: 600,
    projectileSpeed: 500, // ally projectile speed (px/s)
  },
  SPAWN: {
    initialDelayMs: 600, // faster first spawn (was 800)
    baseIntervalMs: 800, // tighter base spawn (was 900)
    minIntervalMs: 400, // faster cap (was 500)
    intervalDecayPerMin: 0.45, // steeper decay — swarms faster (was 0.50)
    maxEnemiesOnScreen: 45, // higher cap for more pressure (was 35)
    spawnYMin: -50, // spawn above screen top
    spawnYMax: -10,
    spawnLeftX: -50,
    spawnRightX: 1330,
    spawnYRangeMin: 260,
    spawnYRangeMax: 480,
    groundY: 460,
    airYMin: 200,
    airYMax: 450,
    eliteChanceBase: 0.1, // 10% (was 8%)
    eliteChancePerMin: 0.25, // +25% per minute (was 20%)
    eliteChanceMax: 0.5, // cap at 50% — prevents late-game all-elite swarms
  },
  DIFFICULTY: {
    hpScalePerMin: 1.8, // enemy HP scaling per minute (was 2.2 — reduced for smoother S5 curve)
    speedScalePerMin: 1.5, // (was 1.4)
    damageScalePerMin: 2.0, // (was 1.8)
    maxSpeedMultiplier: 2.8, // (was 2.5)
    maxBossHp: 15000, // hard cap on boss HP after all scaling
    maxBossAtk: 200, // hard cap on boss ATK after all scaling (prevents S6 P2 one-shot)
  },
  XP: {
    basePerLevel: 10,
    growthFactor: 1.25, // each level needs 25% more
  },
  COMBAT: {
    napalmZoneTickMs: 750, // napalm DoT zone tick interval (was 500ms hardcoded — reduces from 8 to ~5.3 ticks per zone)
    critMultiplier: 2.0,
    knockbackForce: 60,
    knockbackDuration: 150,
    homingBaseTurnRate: 4,
    homingTurnRatePerLevel: 0.5,
  },
  ENEMY_BEHAVIOR: {
    bossOrbitCenterY: 500,
    bossOrbitRadius: 200,
    bossOrbitSpeed: 2, // rad/s
    teleportJumpYMin: 100,
    teleportJumpYRange: 50,
    teleportJumpXRange: 100,
    // Phase 1 default timings (TASK-007 RT)
    defaultAttackInterval: 2000, // ms between attacks
    zigzagSpeed: 120, // horizontal oscillation px/s
    dashInterval: 2000, // ms between dashes
    dashDuration: 400, // ms per dash burst
    burstIdleDuration: 2000, // ms pause between charges
    burstChargeDuration: 1000, // ms per charge burst
    teleportInterval: 2000, // ms between teleports
    rangedStopXOffset: 120, // px offset from barrier for ranged stop
  },
  RUN: {
    stageDurationMs: 60000, // 60 seconds — spawning stops here
    // goldPerKill/Elite/Boss removed — single source of truth is ECONOMY.goldPer*
    maxWeapons: 4, // max weapon types per run (after 4, only upgrades offered)
  },
  MID_SHOP: {
    triggerTimeMs: 30000, // show shop at 30s mark
    // Shop effect values consolidated into ECONOMY.shopEffects (TASK-013 RT)
    healHpThreshold: 0.5, // HP % below which heal is prioritized
    minArmorMultiplier: 0.3, // floor for armor damage reduction
  },
  STAGE: {
    maxStages: 6,
    clearHealPercent: 0.2, // heal 20% base HP between stages (was 30%)
    bossDisplaySize: 384, // boss sprite display size in pixels
    clearPauseMs: 2000, // "Stage Clear" overlay duration
    difficultyPerStage: {
      hpMult: 1.5, // cumulative per stage (was 1.3 — steeper scaling)
      speedMult: 1.15, // (was 1.1)
      damageMult: 1.25, // (was 1.15)
    },
    stages: [
      { type: 'wave', durationMs: 60000, name: '중환 구역', enemyPool: ['basic', 'fast', 'swarm'] },
      { type: 'boss', bossId: 'boss', name: '중환 보스' },
      {
        type: 'wave',
        durationMs: 60000,
        name: '침사추이',
        enemyPool: ['basic', 'fast', 'swarm', 'tank', 'special', 'sniper_enemy'],
      },
      { type: 'boss', bossId: 'boss_circle', name: '침사추이 보스' },
      {
        type: 'wave',
        durationMs: 60000,
        name: '빅토리아 피크',
        enemyPool: [
          'basic',
          'fast',
          'swarm',
          'tank',
          'special',
          'splitter',
          'chaser',
          'shooter',
          'sniper_enemy',
          'guardian',
          'teleporter',
        ],
      },
      { type: 'boss', bossId: 'boss_burst', name: '최종 보스' },
    ] as readonly { type: 'wave' | 'boss'; durationMs?: number; bossId?: string; name: string; enemyPool?: string[] }[],
  },
  GAME_SPEED: {
    options: [1, 1.5, 2] as readonly number[],
  },
  HUD: {
    // Player stats — left side, above base HP bar
    statsFontSize: 14,
    statsAlpha: 0.5,
    statsX: 14,
    statsY: 590, // above base HP bar at y=660 (was 648, overlapped)
    // FPS display
    fpsFontSize: 14, // M-011: 14px minimum font size
    fpsAlpha: 0.3,
    // Weapon slot dimensions — right side vertical (below pause button)
    weaponSlotW: 48, // 48px touch target (M-011)
    weaponSlotH: 48,
    weaponSlotGap: 8,
    weaponSlotStartX: 1222, // right-aligned with pause button (1280 - 58)
    weaponSlotStartY: 80, // below pause button (pause at y=28)
    weaponIconSize: 30,
    // Boss HP bar
    bossHpBarWidth: 500,
    bossHpBarHeight: 12,
    bossHpBarY: 102,
    // Weather indicator
    weatherIndicatorX: 20,
    weatherIndicatorY: 80,
    weatherDotRadius: 6,
    weatherTextOffsetX: 20,
    // Critter skill cooldown
    critterCdX: 20,
    critterCdY: 662, // below stats text (was 650)
    critterCdRadius: 18,
    critterCdLabelOffsetX: 46,
    // District label
    districtLabelFadeMs: 2000,
    districtLabelFontSize: 32,
  },
  BARRIER: {
    x: 350, // barrier line X (right of player)
    y: 510, // above ground line
    hp: 500, // barrier total HP
    width: 150, // collision zone width
    height: 30, // collision zone height
    damageFlashMs: 200, // flash duration on hit
  },
  BARRICADE_VISUAL: {
    boxScale: 1.5, // env_box scale (~1/3 player size, small crate)
    boxFallbackW: 40, // fallback rectangle width
    boxFallbackH: 32, // fallback rectangle height
  },
  ULTIMATE: {
    gaugeMax: 100,
    gaugeBarWidth: 200,
    gaugeBarHeight: 8,
    pulseAlphaMin: 0.6,
    pulseAlphaMax: 1.0,
    pulseDurationMs: 600,
    slowMoTimeScale: 0.3,
    slowMoDurationMs: 2000,
    gaugePerKill: { t1: 5, t2: 10, elite: 20, boss: 50 },
    hai: { radius: 200, damage: 80, knockback: 200, durationMs: 500 },
    nova: { freezeDurationMs: 3000, range: 9999 },
    sol: { dotDamage: 15, dotIntervalMs: 500, durationMs: 3000 },
    mei: { width: 60, damage: 200, piercing: true, range: 1280 },
    kai: { stunDurationMs: 1500, armorBuff: 0.5, armorDurationMs: 5000, radius: 9999 },
  },
  PARALLAX: {
    layerSpeeds: [0.1, 0.2, 0.4, 0.7, 1.0] as readonly number[], // scroll speed per layer: sky, far, mid, near, front
    baseScrollSpeed: 60, // base scroll speed (px/s) — multiplied by each layer's speed factor
  },
  GROUND: {
    height: 96, // ground visual height (3 rows of 32px tiles)
    y: 540, // ground line start (5-zone layout)
    tileSize: 32, // tile size for ground rows
    topHighlightHeight: 2, // thin highlight at top edge
    alpha: 0.85, // ground opacity
  },
  LAYOUT: {
    TOP_HUD_H: 64,
    COMBAT_TOP: 64,
    COMBAT_BOTTOM: 540,
    GROUND_Y: 540,
    GROUND_TILE_SIZE: 32,
    GROUND_ROWS: 3,
    BOTTOM_HUD_Y: 636,
  },
  SQUAD: {
    positions: [{ x: 250, y: 460 }] as readonly { x: number; y: number }[],
    memberScale: 1.0,
    damageMultiplier: 1.0,
    memberIds: ['hai'] as readonly string[],
    idleBobOffsetMs: 300,
  },
  ELEMENT: {
    advantageMultiplier: 1.5,
    disadvantageMultiplier: 0.75,
    darkMultiplier: 1.25,
    advantages: { WIND: 'EARTH', EARTH: 'LIGHT', LIGHT: 'FIRE', FIRE: 'WATER', WATER: 'WIND' } as Record<
      string,
      string
    >,
  },
  PLAYER_ANIM: {
    idleBobPx: 3,
    idleBobMs: 1500,
    recoilPx: 4,
    recoilMs: 30,
    pulseScale: 1.08,
    pulseMs: 40,
    maxAimDeg: 15,
    muzzleFlashMs: 80,
    muzzleFlashRadius: 8,
    auraPulseMs: 300,
    auraPulseMaxRadius: 40,
    auraFireInterval: 5,
    muzzleFlashOffsetX: 48, // fallback: arm tip when no armSprite
    muzzleFlashOffsetY: -8, // match shoulder height
    armOffsetX: 16, // right shoulder region (~25% of half-body width)
    armOffsetY: -8, // above center at shoulder height
    armOriginX: 0.18, // pivot at shoulder joint (left side of 32px hand sprite)
    armOriginY: 0.5,
    armScaleMult: 1.0, // hand display = bodyScale * 1.0 (32px hand → ~25% of 128px body)
    armMuzzleFraction: 0.85, // muzzle flash near hand sprite tip
    gunLength: 20, // short muzzle extension (hand sprite already contains pistol)
    gunWidth: 3, // thin barrel extension
  },
  ARIA: {
    panelWidthRatio: 0.55,
    panelHeight: 36,
    positionYRatio: 0.917,
    fontSize: 16,
    displayMs: 2500,
    typeSpeedMs: 20,
    bgAlpha: 0.85,
    cooldownMs: 8000,
    lowHpThreshold: 0.3,
  },
  WEATHER: {
    speedAllBonus: 0.1,
    rainDamagePerSec: 5,
    rainEnemySpeedMult: 0.85,
    rainParticleCount: 40,
    flameZoneIntervalMs: 15000,
    flameZoneDamage: 20,
    flameZoneDurationMs: 5000,
    flameZoneRadius: 60,
    armorAllBonus: 0.15,
    critAllBonus: 0.15,
    fogRadius: 300,
    fogRingCount: 8,
    fogRingAlphaMax: 0.65,
    fogRingAlphaMin: 0.02,
    fogOuterDarknessAlpha: 0.6,
    shieldRegenHpPerSec: 2,
    lightningFieldDamage: 15,
    lightningFieldIntervalMs: 3000,
    lightningFieldRadius: 80,
    voidGravityPullSpeed: 30,
    voidGravityRadius: 250,
    rainFallSpeed: 600,
    rainDropWidth: 2,
    rainDropHeight: 12,
    rainDropAngle: 10,
    rainWindDrift: 30,
    shieldRegenPulseCycleMs: 2000,
    shieldRegenOverlayHeight: 80,
    shieldRegenOverlayOffset: 40,
    lightningFadeMs: 300,
    lightningBoltWidth: 3,
    lightningBoltSegments: 5,
    lightningBoltJitterX: 40,
    lightningBoltSegmentJitterX: 30,
    voidPulseCycleMs: 3000,
    flameZoneSpawnYMin: 100,
    flameZoneSpawnYRange: 400,
    lightningSpawnYMin: 60,
    lightningSpawnYRange: 500,
  },
  CRITTER: {
    orbitRadius: 80,
    orbitSpeed: 2.5,
    healPulsePercent: 0.1,
    knockbackAuraRadius: 200,
    knockbackAuraForce: 150,
    regenStreamTicks: 3,
    regenStreamHpPerTick: 5,
    regenStreamIntervalMs: 1000,
    flameBurstRadius: 120,
    flameBurstDamage: 25,
    chainLightningTargets: 3,
    chainLightningDamage: 20,
    chainLightningRange: 300,
    chainLightningChainRange: 150,
    shieldBubbleBlockCount: 1,
    shieldBubbleDurationMs: 8000,
  },
  PASSIVE: {
    burnChancePerLevel: 0.15,
    burnDamagePct: 0.3,
    burnDurationMs: 3000,
    burnTickIntervalMs: 500,
    frostChancePerLevel: 0.2,
    frostSlowMult: 0.7,
    frostDurationMs: 2000,
    gustKnockbackBonusPct: 0.5,
    torrentComboThreshold: 3,
    torrentAtkSpdBonus: 0.3,
    torrentDurationMs: 3000,
    refractionChancePerLevel: 0.3,
    refractionRange: 200,
    refractionDamageMult: 0.5,
    lightspeedAtkSpdBonus: 0.2,
    lightspeedDurationMs: 5000,
    thornsDamagePerLevel: 15,
    fortifyNoHitMs: 5000,
    fortifyArmorBonusPct: 0.4,
    dashTrailDamagePerLevel: 10,
    dashTrailTickIntervalMs: 200,
    dashTrailRadius: 40,
    igniteHpThreshold: 0.2,
    igniteBonusDmgPct: 0.25,
  },
  ACHIEVEMENTS: {
    firstBloodGold: 10,
    hunter100Gold: 50,
    hunter1000Gold: 200,
    goldHoarderGold: 100,
    veteran10Gold: 150,
    bossSlayerGold: 200,
    weaponMasterGold: 300,
    maxLevelGold: 100,
    survivor5minGold: 100,
    fullHouseGold: 150,
    allCharactersGold: 500,
    metaMaxGold: 200,
    speedrunGold: 300,
    pacifistGoldGold: 400,
    legendGold: 500,
  },
  DAILY_REWARDS: { streakGold: [50, 75, 100, 125, 150, 200, 300] as readonly number[], maxStreak: 7 },
  BOSS_FREEDOM: {
    explosionMs: 1000,
    riseDurationMs: 2000,
    fadeDurationMs: 2000,
    totalMs: 5000,
    particleCount: 12,
    debrisCount: 8,
    explosionShakeIntensity: 0.01,
    explosionShakeDurationMs: 500,
    riseHeightPx: 400,
    flashAlpha: 0.6,
  },
  BOSS_AERO: {
    // Phase 1: Wind Deflection
    windDeflectAngle: 15, // degrees — projectile deflection angle
    windDeflectRadius: 200, // px — deflection apply radius
    // Phase 2: Gust Surge
    spawnBoostMult: 1.5, // enemy spawn rate multiplier
    droneType: 'shooter', // additional spawn enemy type
    // Phase 3: Wind Deflection+ (stronger)
    windDeflectAngleP3: 25, // degrees — enhanced deflection angle
    windDeflectRadiusP3: 250, // px — enhanced deflection radius
    // Phase 3: Eagle Dive
    diveIntervalMs: 10000, // gust cycle period
    divePushSpeed: -100, // player push speed (px/s, negative = leftward)
    diveDurationMs: 3000, // gust duration
    // Phase thresholds (3-phase boss)
    phase2Threshold: 0.66, // HP ratio for P1→P2
    phase3Threshold: 0.33, // HP ratio for P2→P3
    // VFX
    windParticleCount: 6, // concurrent rotating wind particles
    windParticleSpeed: 2.5, // radians/sec orbit speed
    windParticleLifeMs: 800, // individual particle lifetime
    windParticleSpawnIntervalMs: 150, // spawn interval
    diveEagleDurationMs: 1200, // eagle silhouette cross-screen duration
    diveEagleSize: 40, // eagle silhouette size (px)
    phaseTransitionDebrisCount: 8, // turbine debris particles
    phaseTransitionDebrisLife: 600, // debris lifetime (ms)
    windDissipateCount: 10, // boss death wind scatter particles
    windDissipateLife: 1000, // death wind particle lifetime (ms)
  },
  BOSS_PHASE: {
    phaseThreshold: 0.5,
    invulnerabilityMs: 1500,
    flashDurationMs: 400,
    phase2SpeedMult: { boss_chase: 1.8, boss_circle: 1.4, boss_burst: 1.3 } as Record<string, number>,
    phase2DamageMult: { boss_chase: 1.5, boss_circle: 1.3, boss_burst: 1.3 } as Record<string, number>,
    phase2BurstIdleMs: 1000,
    phase2BurstChargeMs: 1500,
    phase2OrbitSpeed: 3.5,
    phase2ChaseTrackingMult: 3.0,
  },
  JUICE: {
    hitStopMs: 40,
    hitStopTimeScale: 100,
    deathShake: {
      boss: { intensity: 0.008, durationMs: 200 },
      elite: { intensity: 0.004, durationMs: 120 },
      normal: { intensity: 0.001, durationMs: 60 },
    },
  },
  SPLITTER: { childHpFraction: 0.4, childScale: 0.6, childOffsetX: 20 },
  PROJECTILE: { oobMargin: 100 },
  TARGET_RETICLE: { circleRadius: 20, crosshairOuter: 28, crosshairInner: 12, clearDelayMs: 3000, alpha: 0.6 },
  BOSS_BOUNCE: { offsetX: 80, shakeIntensity: 0.003, shakeDurationMs: 100 },
  BASE_DAMAGE_VFX: {
    shakeIntensity: 0.005,
    shakeDurationMs: 150,
    collisionShakeIntensity: 0.003,
    collisionShakeDurationMs: 80,
    flashDurationMs: 60,
    dmgNumberOffsetY: -20,
  },
  BOSS_SPAWN_VFX: { shakeIntensity: 0.01, shakeDurationMs: 400, zoomIn: 1.08, zoomDurationMs: 600 },
  BOSS_PHASE2_VFX: { shakeIntensity: 0.01, shakeDurationMs: 300 },
  CAMERA_FX: {
    levelUpZoom: 1.05,
    levelUpZoomMs: 300,
    stageClearZoom: 1.06,
    stageClearZoomMs: 500,
    gameOverZoom: 0.92,
    gameOverZoomMs: 1200,
    sceneTransitionFadeMs: 300,
  },
  POSTFX: {
    bossGlowColor: NEON.BOSS_GLOW,
    bossGlowDistance: 8,
    bossGlowQuality: 0.1,
    bossGlowOuterStrength: 2,
    bossGlowInnerStrength: 0.5,
    bossPhase2GlowColor: NEON.BOSS_PHASE2_GLOW,
    bossPhase2GlowDistance: 12,
    bossPhase2GlowOuterStrength: 3,
    bossPhase2GlowInnerStrength: 1,
    eliteGlowColor: NEON.ELITE_GLOW,
    eliteGlowDistance: 4,
    eliteGlowQuality: 0.05,
    eliteGlowOuterStrength: 1.5,
    eliteGlowInnerStrength: 0.3,
    freezeTintColor: NEON.STATUS_FREEZE,
    poisonTintColor: NEON.STATUS_POISON,
    burnTintColor: NEON.STATUS_BURN,
  },
  CRITTER_SHIELD_VFX: { shieldBubbleRadius: 50, blockAuraRadius: 60 },
  SFX_COOLDOWNS: { weaponFireMs: 400, baseHitMs: 500 },
  CHALLENGE: {
    leaderboardMaxEntries: 10,
    modifiers: ['doubleSpeed', 'halfHp', 'eliteOnly', 'bossRush', 'noShop'] as readonly string[],
    t1EnemyIds: ['basic', 'fast', 'swarm'] as readonly string[],
    bossRushIntervalMs: 15000,
    bossRushPool: ['boss', 'boss_circle', 'boss_burst'] as readonly string[],
  },
  ECONOMY: {
    goldPerKill: 1,
    goldPerElite: 5,
    goldPerBoss: 50,
    basePrestige: 10,
    stageMultiplierPerStage: 0.5,
    stageMultiplierBase: 0.5,
    performanceBonusMaxKills: 500,
    performanceBonusMax: 2.0,
    performanceBonusMin: 1.0,
    shopSlotTiers: [
      { slots: [0, 1, 2], multiplier: 1.0 },
      { slots: [3, 4, 5], multiplier: 1.5 },
      { slots: [6, 7], multiplier: 2.0 },
    ] as readonly { slots: readonly number[]; multiplier: number }[],
    speedBoostDurationMs: 30000,
    damageBoostDurationMs: 30000,
    xpBoostDurationMs: 60000,
    xpBoostMultiplier: 2.0,
    speedBoostMultiplier: 1.3,
    damageBoostMultiplier: 1.5,
    shieldAbsorbHits: 3,
    shopEffects: {
      healBasePercent: 0.3, // restore 30% base HP (was MID_SHOP.healBasePercent)
      damageBoostPercent: 0.25, // +25% damage (was MID_SHOP.damageBoostPercent)
      armorBoostPercent: 0.25, // +25% armor (was MID_SHOP.armorBoostPercent)
    },
    shopCosts: {
      heal: 40,
      damage: 60,
      armor: 55,
      shield: 90,
      speedBoost: 50,
      damageBoost: 75,
      fullHeal: 120,
      xpBoost: 80,
      magnetPulse: 40,
    } as Record<string, number>,
  },
  RARITY: {
    statMultiplier: { Common: 1.0, Uncommon: 1.15, Rare: 1.35, Epic: 1.6, Legendary: 2.0 } as Record<string, number>,
    dropWeight: { Common: 50, Uncommon: 30, Rare: 15, Epic: 4, Legendary: 1 } as Record<string, number>,
  },
  MASTERY: {
    maxLevel: 10,
    xpThresholds: [100, 320, 804, 1869, 4212, 9366, 20705, 45651, 100532, 221270] as readonly number[],
    xpPerKill: 1,
    xpPer1000Damage: 5,
    xpPerRunCompleted: 20,
    damagePerLevel: 0.02,
    fireRatePerLevel: 0.01,
  },
  MILESTONE: {
    runs: [
      { id: 'runs_010', target: 10, prestigePoints: 50, cosmeticUnlock: 'frame_bronze' },
      { id: 'runs_025', target: 25, prestigePoints: 100, cosmeticUnlock: 'frame_silver' },
      { id: 'runs_050', target: 50, prestigePoints: 200, cosmeticUnlock: 'frame_gold' },
      { id: 'runs_100', target: 100, prestigePoints: 400, cosmeticUnlock: 'trail_neon' },
      { id: 'runs_250', target: 250, prestigePoints: 750, cosmeticUnlock: 'portrait_veteran' },
      { id: 'runs_500', target: 500, prestigePoints: 1500, cosmeticUnlock: 'portrait_legend' },
    ] as readonly { id: string; target: number; prestigePoints: number; cosmeticUnlock?: string }[],
    kills: [
      { id: 'kills_1k', target: 1000, prestigePoints: 50 },
      { id: 'kills_5k', target: 5000, prestigePoints: 150, cosmeticUnlock: 'fx_slaughter' },
      { id: 'kills_10k', target: 10000, prestigePoints: 300, cosmeticUnlock: 'badge_hunter' },
      { id: 'kills_50k', target: 50000, prestigePoints: 800, cosmeticUnlock: 'badge_slayer' },
      { id: 'kills_100k', target: 100000, prestigePoints: 2000, cosmeticUnlock: 'badge_annihilator' },
    ] as readonly { id: string; target: number; prestigePoints: number; cosmeticUnlock?: string }[],
    stages: [
      { id: 'stage_04', target: 4, prestigePoints: 75 },
      { id: 'stage_08', target: 8, prestigePoints: 200, cosmeticUnlock: 'skin_half_clear' },
      { id: 'stage_12', target: 12, prestigePoints: 400, cosmeticUnlock: 'skin_veteran' },
      { id: 'stage_16', target: 16, prestigePoints: 800, cosmeticUnlock: 'skin_champion' },
    ] as readonly { id: string; target: number; prestigePoints: number; cosmeticUnlock?: string }[],
  },
  DAILY_CHALLENGE: {
    challengesPerDay: 3,
    prestigeByDifficulty: { easy: 30, medium: 75, hard: 150 } as Record<string, number>,
    params: {
      killWithWeapon: { easy: 30, medium: 80, hard: 200 },
      surviveMinutes: { easy: 3, medium: 6, hard: 10 },
      defeatBossStage: { easy: 2, medium: 6, hard: 12 },
      collectXpOrbs: { easy: 50, medium: 150, hard: 400 },
      reachLevel: { easy: 8, medium: 14, hard: 20 },
      dealTotalDamage: { easy: 5000, medium: 20000, hard: 80000 },
    } as Record<string, Record<string, number>>,
    weaponPool: [
      'energy_shot',
      'rapid_fire',
      'shotgun',
      'missile',
      'laser_beam',
      'lightning',
      'bomb',
      'railgun',
    ] as readonly string[],
    characterPool: ['hai', 'nova', 'sol', 'mei', 'kai'] as readonly string[],
  },
  AUDIO: {
    bgmVolume: 0.3,
    sfxVolume: 0.5,
    bgmFadeMs: 500,
    sfxThrottle: { shoot: 100, hit: 80, death: 60, explosion: 120, pickup: 80 } as Record<string, number>,
  },
} as const;

export const MENU = {
  PARALLAX: {
    scrollSpeed: 20, // px/s for slowest layer
    layerSpeedFactors: [0.2, 0.4, 0.6, 0.8, 1.0] as readonly number[], // sky, far, mid, near, front
    layerKeys: ['sky', 'far', 'mid', 'near', 'front'] as readonly string[],
    setIndex: 1, // parallax set to use (1-8)
  },
  NEON_PARTICLES: {
    count: 24, // number of floating particles
    minSize: 2,
    maxSize: 5,
    minAlpha: 0.15,
    maxAlpha: 0.5,
    minSpeed: 10,
    maxSpeed: 40,
    minDuration: 4000, // ms for float cycle
    maxDuration: 8000,
  },
  LOGO: {
    y: 140,
    glowPulseMin: 0.7,
    glowPulseMax: 1.0,
    glowPulseDuration: 2000,
  },
  GLASS_PANEL: {
    y: 460, // center Y of the glass panel
    width: 420,
    height: 300,
    alpha: 0.25,
    borderAlpha: 0.4,
    radius: 16,
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
    barrierBarWidth: 120,
    barrierBarHeight: 8,
    barrierBarOffsetY: -60,
  },
  STAGE_CLEAR_GLOW: {
    outerRadius: 48,
    midRadius: 24,
    coreRadius: 10,
    appearMs: 400,
    pulseScaleMax: 1.3,
    pulseAlphaMin: 0.7,
    pulseAlphaMax: 1.0,
    pulseDurationMs: 600,
    holdMs: 1500,
    fadeOutMs: 500,
  },
} as const;
