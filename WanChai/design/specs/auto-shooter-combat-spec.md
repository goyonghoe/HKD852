# Auto-Shooter Combat System Spec

> WanChai NeonSurvivor -- current implementation reference (v2.0)
>
> **Source of truth**: `src/config/weapons.ts`, `src/config/enemies.ts`, `src/config/balance.ts`
> **Architecture**: `src/systems/WeaponSystem.ts`, `src/core/WaveDirector.ts`, `src/managers/SpawnManager.ts`

---

## 1. Game Structure Overview

WanChai is a **landscape auto-shooter survivor** (1280x720, 16:9).

- Player is on the left side (x=200, y=460), moves vertically
- Enemies spawn from the right side and move left toward the base
- A defense barrier (x=350, HP 500) and base wall (x=250, y=660, HP 600) protect the player
- Weapons auto-target the nearest enemy and fire automatically
- XP orbs from killed enemies trigger level-ups with weapon/passive choices
- 5 playable characters with elemental ultimates

---

## 2. Stage Structure

6 stages total: 3 wave stages alternating with 3 boss stages.

| Stage | Type | Name          | Enemy Pool                                                                                       | Boss                  |
| ----- | ---- | ------------- | ------------------------------------------------------------------------------------------------ | --------------------- |
| 1     | wave | 중환 구역     | basic, fast, swarm                                                                               | --                    |
| 2     | boss | 중환 보스     | --                                                                                               | boss (HP 1200)        |
| 3     | wave | 침사추이      | basic, fast, swarm, tank, special, sniper_enemy                                                  | --                    |
| 4     | boss | 침사추이 보스 | --                                                                                               | boss_circle (HP 1800) |
| 5     | wave | 빅토리아 피크 | basic, fast, swarm, tank, special, splitter, chaser, shooter, sniper_enemy, guardian, teleporter | --                    |
| 6     | boss | 최종 보스     | --                                                                                               | boss_burst (HP 3000)  |

### Stage Scaling (Cumulative Per Stage)

| Attribute    | Per-Stage Multiplier | Config Key                                    |
| ------------ | -------------------- | --------------------------------------------- |
| Enemy HP     | x1.5                 | `BALANCE.STAGE.difficultyPerStage.hpMult`     |
| Enemy Speed  | x1.15                | `BALANCE.STAGE.difficultyPerStage.speedMult`  |
| Enemy Damage | x1.25                | `BALANCE.STAGE.difficultyPerStage.damageMult` |

### Stage Clear

- Base HP heals 20% (`clearHealPercent: 0.20`)
- 2-second "STAGE CLEAR" overlay with camera zoom (`clearPauseMs: 2000`)
- Wave stages last 60 seconds (`stageDurationMs: 60000`)

---

## 3. Weapon System

### 3.1 Weapon Definition (WeaponDef)

All weapons defined in `src/config/weapons.ts`. 10 T1 weapons + 7 T2 evolved weapons.

| Property          | Type           | Description                                              |
| ----------------- | -------------- | -------------------------------------------------------- |
| `id`              | string         | Unique identifier                                        |
| `name`            | string         | Display name (Korean)                                    |
| `projectileType`  | ProjectileType | bullet / laser / chain / homing / bomb / napalm          |
| `targetMode`      | TargetMode     | nearest / aoe                                            |
| `baseDamage`      | number         | Base damage per hit                                      |
| `cooldownMs`      | number         | Fire interval (ms)                                       |
| `projectileSpeed` | number         | Projectile velocity (px/s, 0=instant)                    |
| `projectileCount` | number         | Projectiles per shot (or chain count)                    |
| `piercing`        | number         | Pierce count (0=destroyed on hit, 99=penetrate all)      |
| `aoeRadius`       | number         | Area damage radius (0=none)                              |
| `range`           | number         | Max range (0=unlimited)                                  |
| `maxLevel`        | number         | Always 5                                                 |
| `tier`            | number         | 1 (default) or 2 (evolved)                               |
| `recipe`          | object         | T2 only: primary + secondary weapon + level requirements |

### 3.2 T1 Weapon Table (10 weapons)

| Weapon        | ID          | Type   | Dmg | CD (ms) | Proj | Pierce | Range  | DPS    |
| ------------- | ----------- | ------ | --- | ------- | ---- | ------ | ------ | ------ |
| 에너지 샷     | energy_shot | bullet | 16  | 800     | 1    | 0      | --     | 20.0   |
| 속사포        | rapid_fire  | bullet | 3   | 200     | 1    | 0      | 480    | 15.0   |
| 산탄총        | shotgun     | bullet | 10  | 1200    | 3    | 0      | 380    | 25.0   |
| 수리검        | shuriken    | bullet | 14  | 700     | 1    | 3      | 400    | 20.0   |
| 레이저 빔     | laser_beam  | laser  | 28  | 1400    | 1    | 99     | 500    | 20.0   |
| 레일건        | railgun     | laser  | 48  | 2700    | 1    | 99     | 800    | 17.8   |
| 체인 라이트닝 | lightning   | chain  | 16  | 1400    | 3ch  | 0      | 400    | 34.3\* |
| 추적 미사일   | missile     | homing | 35  | 1950    | 1    | 0      | --     | 17.9   |
| 에너지 폭탄   | bomb        | bomb   | 65  | 3500    | 1    | 0      | AOE120 | 18.6\* |
| 네이팜탄      | napalm      | napalm | 29  | 2500    | 1    | 0      | AOE120 | 11.6+  |

\* Chain/AOE DPS is per-target; effective DPS against groups is much higher.
\+ Napalm has additional DoT zone (4s lifetime, 750ms tick interval).

### 3.3 T2 Evolved Weapons (7 weapons)

T2 weapons are created by combining two T1 weapons at specific levels.

| Weapon          | ID              | Recipe                           | Dmg | CD (ms) | Proj | DPS   |
| --------------- | --------------- | -------------------------------- | --- | ------- | ---- | ----- |
| 플라즈마 개틀링 | plasma_gatling  | energy_shot Lv5 + rapid_fire Lv3 | 14  | 300     | 3    | 140.0 |
| 클러스터 탄두   | cluster_warhead | missile Lv5 + bomb Lv3           | 55  | 550     | 1    | 100.0 |
| 테슬라 아크     | tesla_arc       | laser_beam Lv5 + lightning Lv3   | 16  | 400     | 5ch  | 200.0 |
| 스캐터 스톰     | scatter_storm   | shotgun Lv5 + shuriken Lv3       | 5   | 185     | 7    | 189.2 |
| 인페르노 빔     | inferno_beam    | laser_beam Lv5 + napalm Lv3      | 35  | 600     | 1    | 58.3  |
| 썬더 봄         | thunder_bomb    | lightning Lv5 + bomb Lv3         | 100 | 2000    | 1    | 50.0  |
| 바이퍼 살보     | viper_salvo     | rapid_fire Lv5 + missile Lv3     | 5   | 300     | 2    | 33.3  |

### 3.4 Projectile Types

| Type       | Behavior                                     | Special                              |
| ---------- | -------------------------------------------- | ------------------------------------ |
| **bullet** | Straight line toward nearest enemy           | Spread 0.15rad for multi-projectile  |
| **laser**  | Instant/high-speed beam toward nearest enemy | Pierce 99 (passes through all)       |
| **chain**  | Jumps between enemies within 150px           | Chain count = projectileCount        |
| **homing** | Guided missile tracking nearest enemy        | Turn rate 4 + 0.5/level, 4s lifetime |
| **bomb**   | AOE at enemy centroid                        | Screen shake + flash VFX             |
| **napalm** | Flies to centroid, creates fire zone         | 4s DoT zone, tick every 750ms        |

### 3.5 Weapon Level-Up Scaling

| Stat             | Formula                                                  |
| ---------------- | -------------------------------------------------------- |
| Damage           | `baseDamage * (1 + (level-1) * 0.2)` (+20%/lv)           |
| Projectile count | `projectileCount + floor((level-1) * 0.5)` (+1 per 2 lv) |
| Piercing         | `piercing + floor(level / 3)` (+1 per 3 lv)              |
| AOE radius       | `aoeRadius + level * 10` (or `* 15` for bomb/napalm)     |
| Cooldown         | `cooldownMs / attackSpeedMultiplier` (via passive)       |

### 3.6 Weapon Slots

- Maximum 4 weapon types per run (`BALANCE.RUN.maxWeapons: 4`)
- Once 4 weapons held, level-up only offers existing weapon upgrades or passives

---

## 4. Enemy System

### 4.1 Enemy Categories

Enemies have two categories affecting spawn and movement:

- **ground**: Walk on ground level (y=460), horizontal movement
- **air**: Fly at varying heights (y=200-450), sine-wave movement

### 4.2 Ground Enemies (7 types)

| Enemy    | Shape    | HP  | Speed | Dmg | Behavior       | XP  | Attack     | Special                      |
| -------- | -------- | --- | ----- | --- | -------------- | --- | ---------- | ---------------------------- |
| basic    | circle   | 18  | 45    | 8   | march          | 1   | melee      | --                           |
| fast     | triangle | 12  | 90    | 12  | dash           | 2   | suicide    | Kamikaze dive                |
| swarm    | circle   | 8   | 80    | 5   | march          | 1   | suicide    | Small size (8px)             |
| tank     | rect     | 70  | 22    | 20  | slow_march     | 3   | melee 2.5s | Knockback immune             |
| chaser   | triangle | 22  | 60    | 15  | chase          | 3   | melee 1.8s | Player tracking              |
| splitter | hexagon  | 45  | 35    | 12  | split_on_death | 4   | suicide    | Splits into children         |
| guardian | rect     | 150 | 15    | 30  | slow_march     | 5   | melee 3s   | Knockback immune, ultra-tank |

### 4.3 Air Enemies (4 types)

| Enemy        | Shape    | HP  | Speed | Dmg | Behavior | XP  | Attack      | Special              |
| ------------ | -------- | --- | ----- | --- | -------- | --- | ----------- | -------------------- |
| special      | diamond  | 28  | 55    | 14  | zigzag   | 3   | melee 1.5s  | Evasive movement     |
| shooter      | diamond  | 25  | 28    | 12  | shoot    | 4   | ranged 2s   | Projectile 220px/s   |
| sniper_enemy | triangle | 20  | 22    | 20  | shoot    | 4   | ranged 2.5s | Projectile 350px/s   |
| teleporter   | diamond  | 28  | 35    | 14  | teleport | 4   | melee 1.8s  | Spatial displacement |

### 4.4 Bosses (3 types)

| Boss        | Shape   | HP   | Speed | Dmg | Behavior    | XP  | Special                         |
| ----------- | ------- | ---- | ----- | --- | ----------- | --- | ------------------------------- |
| boss        | hexagon | 1200 | 18    | 40  | boss_chase  | 100 | Knockback immune, chase player  |
| boss_circle | diamond | 1800 | 28    | 35  | boss_circle | 120 | Ranged (280px/s), orbit pattern |
| boss_burst  | rect    | 3000 | 15    | 45  | boss_burst  | 150 | Knockback immune, heavy hitter  |

### 4.5 Boss Phase System

All bosses have a **Phase 2** triggered at 50% HP (`BALANCE.BOSS_PHASE.phaseThreshold: 0.5`):

- 1.5s invulnerability window
- Speed multiplier: boss_chase x1.8, boss_circle x1.4, boss_burst x1.3
- Damage multiplier: boss_chase x1.5, boss_circle x1.3, boss_burst x1.3
- Visual: phase 2 glow effect, screen shake

### 4.6 Enemy Behavior Patterns

| Behavior       | Description                                         |
| -------------- | --------------------------------------------------- |
| march          | Straight horizontal movement toward base            |
| slow_march     | Slow straight movement (tank units)                 |
| dash           | Fast burst movement (kamikaze)                      |
| zigzag         | Horizontal zigzag pattern with vertical oscillation |
| chase          | Tracks player position                              |
| shoot          | Moves + fires projectiles at intervals              |
| teleport       | Phase-shifts to new position periodically           |
| split_on_death | Spawns child enemies on death (40% HP, 60% scale)   |
| boss_chase     | Slow tracking + Phase 2 speed burst                 |
| boss_circle    | Orbit pattern + ranged attacks                      |
| boss_burst     | Slow advance + heavy burst damage                   |

### 4.7 Elite System

- Base elite chance: 10% (`eliteChanceBase: 0.1`)
- Per-minute increase: +25% (`eliteChancePerMin: 0.25`)
- Maximum: 50% (`eliteChanceMax: 0.5`)
- Elite buffs: HP x3, larger size, glow aura, HP bar displayed
- Elite gold: 5 (vs. 1 for normal)

---

## 5. Wave System (WaveDirector)

`WaveDirector` is a pure TypeScript class (no Phaser dependency). It decides WHEN and WHAT to spawn.

### 5.1 Spawn Logic

```
Initial delay:   600ms (BALANCE.SPAWN.initialDelayMs)
Spawn interval:  800ms * 0.45^(minutes) -> min 400ms
Spawn count:     1 + floor(minutes * 3) -> ~4 per wave at 60s
Enemy pool:      Unlocks progressively based on stage config
Elite roll:      10% + 25%/min (max 50%)
Boss:            Spawned once per boss stage
Max on screen:   45 (BALANCE.SPAWN.maxEnemiesOnScreen)
```

### 5.2 Time-Based Scaling (Within a Stage)

| Stat        | Scale/Min | Config Key                             |
| ----------- | --------- | -------------------------------------- |
| Enemy HP    | x1.8      | `BALANCE.DIFFICULTY.hpScalePerMin`     |
| Enemy Speed | x1.5      | `BALANCE.DIFFICULTY.speedScalePerMin`  |
| Enemy Dmg   | x2.0      | `BALANCE.DIFFICULTY.damageScalePerMin` |

Hard caps: `maxSpeedMultiplier: 2.8`, `maxBossHp: 15000`, `maxBossAtk: 200`

---

## 6. Player System

### 6.1 Player Stats

| Stat            | Value         | Config                          |
| --------------- | ------------- | ------------------------------- |
| Base position   | x=200, y=460  | `BALANCE.PLAYER.baseX/baseY`    |
| Display size    | 128px         | `BALANCE.PLAYER.targetSize`     |
| Crit multiplier | 2.0x          | `BALANCE.PLAYER.critMultiplier` |
| Move speed      | Vertical drag | Pointer input                   |

### 6.2 Defense Barrier

| Stat     | Value        | Config                  |
| -------- | ------------ | ----------------------- |
| Position | x=350, y=510 | `BALANCE.BARRIER.x/y`   |
| HP       | 500          | `BALANCE.BARRIER.hp`    |
| Width    | 150px        | `BALANCE.BARRIER.width` |

### 6.3 Base Wall

| Stat     | Value                 | Config                |
| -------- | --------------------- | --------------------- |
| Position | leftReachX=250, y=660 | `BALANCE.BASE.*`      |
| HP       | 600                   | `BALANCE.BASE.hp`     |
| Height   | 30px                  | `BALANCE.BASE.height` |

### 6.4 Allies

| Ally     | Position | Cooldown | Damage | Count | Range |
| -------- | -------- | -------- | ------ | ----- | ----- |
| Sniper   | x=60     | 1500ms   | 40     | 1     | 800   |
| Spreader | x=660    | 1000ms   | 8      | 5     | 600   |

---

## 7. XP / Level-Up System

### 7.1 XP Table

```
XP for level N = basePerLevel(10) * growthFactor(1.25)^(N-1)
```

| Level | Required XP | Cumulative |
| ----- | ----------- | ---------- |
| 2     | 10          | 10         |
| 3     | 13          | 23         |
| 4     | 16          | 39         |
| 5     | 20          | 59         |
| 10    | 75          | ~300       |
| 15    | 181         | ~850       |
| 20    | 437         | ~2300      |

### 7.2 Level-Up Choices

3 cards shown per level-up:

1. **New weapon**: If holding < 4 weapons
2. **Weapon upgrade**: Existing weapon +1 level (max 5)
3. **Passive buff**: Permanent stat boost

### 7.3 Passives

| Passive   | Effect                | Per Level | Max |
| --------- | --------------------- | --------- | --- |
| 속사 장치 | Attack speed          | +10%      | 5   |
| 파워 코어 | Damage                | +15%      | 5   |
| 장갑 강화 | Base damage reduction | -10%      | 5   |
| 실드 수리 | Base HP regen/sec     | +5        | 3   |
| 집중 렌즈 | Crit chance           | +5%       | 5   |
| 증폭기    | Crit damage           | +25%      | 3   |

Auto-select after 5 seconds (`autoSelectDelayMs: 5000`).

---

## 8. Economy

### 8.1 Gold Income

| Source      | Gold | Config Key                     |
| ----------- | ---- | ------------------------------ |
| Normal kill | 1    | `BALANCE.ECONOMY.goldPerKill`  |
| Elite kill  | 5    | `BALANCE.ECONOMY.goldPerElite` |
| Boss kill   | 50   | `BALANCE.ECONOMY.goldPerBoss`  |

### 8.2 Mid-Shop

Triggered at 30s mark (`BALANCE.MID_SHOP.triggerTimeMs: 30000`). In-game overlay with gold-cost items:

| Item          | Effect              | Cost (Gold) |
| ------------- | ------------------- | ----------- |
| Heal          | Base HP +30%        | 40          |
| Damage Boost  | +25% damage (30s)   | 60          |
| Armor Boost   | +25% armor (30s)    | 55          |
| Shield        | Absorb 3 hits       | 90          |
| Speed Boost   | +30% speed (30s)    | 50          |
| Damage Boost+ | +50% damage (30s)   | 75          |
| Full Heal     | Base HP 100%        | 120         |
| XP Boost      | 2x XP (60s)         | 80          |
| Magnet Pulse  | Collect all XP orbs | 40          |

---

## 9. Game Speed

3-tier speed control: 1.0x / 1.5x / 2.0x (`BALANCE.GAME_SPEED.options`)

---

## 10. Combat Constants Summary

```typescript
COMBAT: {
  critMultiplier: 2.0,
  knockbackForce: 60,
  knockbackDuration: 150,
  napalmZoneTickMs: 750,
  homingBaseTurnRate: 4,
  homingTurnRatePerLevel: 0.5,
}

RUN: {
  stageDurationMs: 60000,
  maxWeapons: 4,
}

DIFFICULTY: {
  hpScalePerMin: 1.8,
  speedScalePerMin: 1.5,
  damageScalePerMin: 2.0,
  maxSpeedMultiplier: 2.8,
  maxBossHp: 15000,
  maxBossAtk: 200,
}

STAGE: {
  maxStages: 6,
  clearHealPercent: 0.2,
  clearPauseMs: 2000,
  difficultyPerStage: { hpMult: 1.5, speedMult: 1.15, damageMult: 1.25 },
}
```

---

## 11. Manager Architecture

| Manager            | File                                 | Responsibility                       |
| ------------------ | ------------------------------------ | ------------------------------------ |
| WeaponSystem       | `src/systems/WeaponSystem.ts`        | Weapon firing, projectile creation   |
| SpawnManager       | `src/managers/SpawnManager.ts`       | Enemy instantiation, pool management |
| CollisionManager   | `src/managers/CollisionManager.ts`   | Hit detection, damage application    |
| HUDManager         | `src/managers/HUDManager.ts`         | XP bar, HP bar, weapon slots, timer  |
| LevelUpUIManager   | `src/managers/LevelUpUIManager.ts`   | Level-up card display/selection      |
| ShopManager        | `src/managers/ShopManager.ts`        | Mid-shop overlay                     |
| PhaseManager       | `src/managers/PhaseManager.ts`       | Game phase state machine             |
| ProgressionManager | `src/managers/ProgressionManager.ts` | Stage progression, scaling           |
| AllyManager        | `src/managers/AllyManager.ts`        | NPC ally firing                      |
| UltimateManager    | `src/managers/UltimateManager.ts`    | Character ultimate abilities         |
| WeatherManager     | `src/managers/WeatherManager.ts`     | Weather effects per district         |
| SquadManager       | `src/managers/SquadManager.ts`       | Squad member positioning             |

Core logic (pure TS, no Phaser dependency):

- `WaveDirector` -- spawn timing and enemy selection
- `DamageCalc` -- damage formula with crit, armor, element
- `UpgradeSelector` -- level-up card generation
- `XpTable` -- XP requirements per level
- `SpatialHash` -- efficient collision detection

---

## Change Log

| Date       | Version | Content                                                                                                                                                                                                                                                              |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-02 | v1.0    | Initial spec (10 T1 weapons, 11 enemies, 3 bosses)                                                                                                                                                                                                                   |
| 2026-03-12 | v2.0    | Updated all values from current config files: T2 evolved weapons (7), boss phase system, barrier system, economy/shop details, manager architecture, difficulty scaling corrections (hpScalePerMin 2.2->1.8), ally stats, weather/critter/passive systems referenced |
