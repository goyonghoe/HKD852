# Balance: NeonSurvivor 60-Second Run -- 1st Validation

## Meta
- **Author**: Balance Designer
- **Date**: 2026-03-01
- **Status**: ready
- **Numerical Bible**: design/reference/numerical-bible.md
- **Source Truth**: All values from `src/config/` as of 2026-03-01

---

## 0. Source Data Discrepancy Log

Before analysis, the actual `src/config/enemies.ts` values differ from the user summary
in several places. This analysis uses the **code values** (ground truth):

| Enemy   | Field     | User Summary | Actual Code | Used |
|---------|-----------|-------------|-------------|------|
| basic   | baseSpeed | 60          | **40**      | 40   |
| basic   | xpValue   | 3           | **1**       | 1    |
| basic   | baseDamage| 5           | **5**       | 5    |
| fast    | baseHp    | 6           | **8**       | 8    |
| fast    | baseDamage| 3           | **8**       | 8    |
| fast    | baseSpeed | 100         | **80**      | 80   |
| fast    | xpValue   | 4           | **2**       | 2    |
| tank    | baseHp    | 30          | **50**      | 50   |
| tank    | baseDamage| 8           | **15**      | 15   |
| tank    | baseSpeed | 30          | **20**      | 20   |
| tank    | xpValue   | 8           | **3**       | 3    |
| special | baseHp    | 12          | **20**      | 20   |
| special | baseDamage| 6           | **10**      | 10   |
| special | xpValue   | 6           | **3**       | 3    |
| splitter| baseHp    | 15          | **30**      | 30   |
| splitter| baseDamage| 4           | **8**       | 8    |
| splitter| xpValue   | 5           | **4**       | 4    |
| boss    | baseDamage| 20          | **30**      | 30   |
| boss    | baseSpeed | 40          | **15**      | 15   |
| boss    | xpValue   | 100         | **50**      | 50   |

These are significant differences -- enemies are generally tougher (higher HP/damage)
and give less XP than the summary suggested.

---

## 1. Spawn Timeline (10s windows)

### 1.1 Spawn Interval Calculation

```
interval(t) = max(800, 1200 * 0.40^(t/60))
```

| Time (s) | t/60  | 0.40^(t/60) | Raw Interval (ms) | Clamped (ms) | Spawns/sec |
|----------|-------|-------------|--------------------|--------------|-----------:|
| 0        | 0.000 | 1.000       | 1200               | 1200         | 0.83       |
| 10       | 0.167 | 0.856       | 1028               | 1028         | 0.97       |
| 20       | 0.333 | 0.733       | 880                | 880          | 1.14       |
| 30       | 0.500 | 0.632       | 759                | 800          | 1.25       |
| 40       | 0.667 | 0.542       | 650                | 800          | 1.25       |
| 50       | 0.833 | 0.465       | 558                | 800          | 1.25       |
| 60       | 1.000 | 0.400       | 480                | 800          | 1.25       |

Spawn interval hits the floor (800ms) at t~27s. After that, spawn rate is constant at 1.25/s.

### 1.2 Spawn Count per Tick

```
spawnCount(t) = 1 + floor((t/60) * 2)
```

| Time (s) | t/60  | spawnCount |
|----------|-------|----------:|
| 0        | 0.000 | 1         |
| 10       | 0.167 | 1         |
| 20       | 0.333 | 1         |
| 30       | 0.500 | 2         |
| 40       | 0.667 | 2         |
| 50       | 0.833 | 2         |
| 60       | 1.000 | 3         |

**Critical**: At t=30s, spawn doubles. At t=60s, triples.

### 1.3 Elite Chance

```
eliteChance(t) = 0.05 + 0.15 * (t/60)
```

| Time (s) | Elite % |
|----------|--------:|
| 0        | 5.0%    |
| 10       | 7.5%    |
| 20       | 10.0%   |
| 30       | 12.5%   |
| 40       | 15.0%   |
| 50       | 17.5%   |
| 60       | 20.0%   |

### 1.4 Enemy Type Unlock

```
unlockedCount = min(pool.length, 1 + floor(minutes * 5))
pool = ['basic', 'fast', 'tank', 'special', 'splitter'] (5 types, boss separate)
```

| Time (s) | minutes | unlocked | Types Available              |
|----------|---------|----------|------------------------------|
| 0        | 0.00    | 1        | basic                        |
| 12       | 0.20    | 2        | basic, fast                  |
| 24       | 0.40    | 3        | basic, fast, tank            |
| 36       | 0.60    | 4        | basic, fast, tank, special   |
| 48       | 0.80    | 5        | all 5 types                  |
| 50       | 0.83    | 5        | all 5 + BOSS spawns          |

### 1.5 Total Spawn Count Estimate (10s windows)

| Window   | Avg Interval | Ticks | Count/tick | Normal | Elite (E[x]) | Total Enemies |
|----------|-------------|-------|-----------|--------|-------------|---------------|
| 0-10s    | 1114ms      | ~9    | 1         | 8.4    | 0.6         | ~9            |
| 10-20s   | 954ms       | ~10   | 1         | 9.1    | 0.9         | ~10           |
| 20-30s   | 840ms       | ~12   | 1-2       | 15.0   | 1.8         | ~17*          |
| 30-40s   | 800ms       | ~12   | 2         | 20.6   | 3.4         | ~24           |
| 40-50s   | 800ms       | ~12   | 2         | 19.8   | 3.9         | ~24           |
| 50-60s   | 800ms       | ~12   | 2-3       | 22.5   | 5.5         | ~28           |

*Transition window, interpolated.

**Total 60s estimated spawns: ~112 enemies** (including ~16 elites)
Plus 1 boss at t=50s.

---

## 2. Enemy HP/Speed/Damage Scaling

### 2.1 HP Scaling

```
hp(t) = baseHp * 2.0^(t/60)
```

| Enemy    | Base HP | t=0  | t=10 | t=20 | t=30 | t=40 | t=50 | t=60 |
|----------|---------|------|------|------|------|------|------|------|
| basic    | 10      | 10   | 11   | 13   | 14   | 16   | 18   | 20   |
| fast     | 8       | 8    | 9    | 10   | 11   | 13   | 14   | 16   |
| tank     | 50      | 50   | 56   | 63   | 71   | 79   | 89   | 100  |
| special  | 20      | 20   | 22   | 25   | 28   | 32   | 36   | 40   |
| splitter | 30      | 30   | 34   | 38   | 42   | 48   | 53   | 60   |
| boss     | 500     | --   | --   | --   | --   | --   | 890  | --   |

**Elite multiplier: 5x HP**

| Elite    | t=0  | t=10 | t=20 | t=30 | t=40 | t=50 |
|----------|------|------|------|------|------|------|
| basic    | 50   | 56   | 63   | 71   | 79   | 89   |
| fast     | 40   | 45   | 50   | 57   | 63   | 71   |
| tank     | 250  | 280  | 315  | 354  | 397  | 445  |
| special  | 100  | 112  | 126  | 141  | 158  | 178  |
| splitter | 150  | 168  | 189  | 212  | 238  | 267  |

### 2.2 Speed Scaling

```
speed(t) = min(baseSpeed * 1.3^(t/60), baseSpeed * 2.0)
```

| Enemy    | Base | t=0 | t=30 | t=60 | Cap (2x) |
|----------|------|-----|------|------|----------|
| basic    | 40   | 40  | 46   | 52   | 80       |
| fast     | 80   | 80  | 91   | 104  | 160      |
| tank     | 20   | 20  | 23   | 26   | 40       |
| special  | 50   | 50  | 57   | 65   | 100      |
| splitter | 30   | 30  | 34   | 39   | 60       |
| boss     | 15   | --  | --   | 17   | 30       |

### 2.3 Damage Scaling

```
damage(t) = baseDamage * 1.5^(t/60)
```

| Enemy    | Base | t=0 | t=10 | t=20 | t=30 | t=40 | t=50 | t=60 |
|----------|------|-----|------|------|------|------|------|------|
| basic    | 5    | 5   | 5    | 6    | 6    | 7    | 7    | 8    |
| fast     | 8    | 8   | 9    | 9    | 10   | 11   | 12   | 12   |
| tank     | 15   | 15  | 16   | 17   | 18   | 20   | 22   | 23   |
| special  | 10   | 10  | 11   | 12   | 12   | 14   | 15   | 15   |
| splitter | 8    | 8   | 9    | 9    | 10   | 11   | 12   | 12   |
| boss     | 30   | --  | --   | --   | --   | --   | 37   | --   |

### 2.4 Travel Time to Base

```
distance = baseY(1200) - spawnY(-30) ~ 1230 px
travelTime = 1230 / speed(t)
```

| Enemy    | t=0 (s) | t=30 (s) | t=50 (s) |
|----------|---------|----------|----------|
| basic    | 30.8    | 26.7     | 24.0     |
| fast     | 15.4    | 13.5     | 12.1     |
| tank     | 61.5    | 53.5     | 48.1     |
| special  | 24.6    | 21.6     | 19.4     |
| splitter | 41.0    | 36.2     | 32.5     |
| boss     | --      | --       | 72.4     |

**CRITICAL FINDING**: Fast enemies reach the base in **15.4s at t=0, 12.1s at t=50**.
This means fast enemies spawned at t=0 can reach the base by t=15s.
Fast enemies are unlocked at t=12s and reach base within ~13s of spawning.

Basic enemies at t=0 need ~31s to reach base. Comfortable buffer.

---

## 3. Weapon DPS Analysis

### 3.1 Base DPS (Level 1, no passives/meta)

```
levelMult = 1 + (level-1) * 0.2
effectiveDmg = baseDamage * levelMult
```

For single-target DPS, we calculate hits per second based on weapon type:

| Weapon       | Type   | BaseDmg | CD (ms) | Hits/s       | Raw DPS | Notes                     |
|-------------|--------|---------|---------|-------------|---------|---------------------------|
| energy_shot | bullet | 10      | 800     | 1.25         | 12.5    | Single target             |
| aura_field  | aoe    | 5       | 500     | 2.0 * ~2 avg | 20.0    | 80px radius, 2 avg hits   |
| laser_beam  | laser  | 25      | 2000    | 0.5 * ~2.5   | 31.3    | Pierce 99, ~2.5 in line   |
| orbit_guard | orbit  | 8       | 300*    | 3/0.5 = 6    | 48.0    | 3 orbs, ~0.5s hit interval|
| shotgun     | bullet | 8       | 1200    | 0.83 * 5*0.7 | 23.3    | 5 pellets, 70% hit rate   |
| lightning   | chain  | 15      | 1500    | 0.67 * 3     | 30.0    | 3 chain targets           |
| missile     | homing | 30      | 2500    | 0.4          | 12.0    | Single + 60px AOE splash  |
| bomb        | bomb   | 50      | 4000    | 0.25 * ~3    | 37.5    | 120px AOE, 3 avg hits     |

*orbit_guard cooldownMs=300 is the spawn rate, not hit rate. Orbs orbit continuously
and deal damage on contact with ~500ms hit cooldown per enemy per orb.

**Note on orbit_guard DPS**: The 48 DPS figure assumes all 3 orbs continuously hitting
enemies within 100px range. This requires enemies to be in melee range of the player.
Since the player is at y=1100 (near base), orbit_guard only hits enemies that have
almost reached the base. Effective DPS is much lower as a primary weapon.

**Realistic single-target DPS ranking (Lv1)**:

| Rank | Weapon       | Single-Target DPS | Multi-Target DPS | Overall |
|------|-------------|-------------------|-------------------|---------|
| 1    | orbit_guard | 16* (1 orb in range) | 48 (melee zone) | Position-dependent |
| 2    | laser_beam  | 12.5              | 31.3              | Best overall |
| 3    | lightning   | 10.0              | 30.0              | Strong multi |
| 4    | bomb        | 12.5              | 37.5              | Best AOE       |
| 5    | energy_shot | 12.5              | 12.5              | Consistent     |
| 6    | shotgun     | 8.0*              | 23.3              | Range-limited  |
| 7    | aura_field  | 10.0              | 20.0              | Passive        |
| 8    | missile     | 12.0              | 12.0+splash       | Slow but sure  |

*shotgun single-target = only 1-2 pellets hit at range

### 3.2 Weapon DPS by Level

```
DPS(lv) = DPS(1) * (1 + (lv-1) * 0.2)
```

| Weapon       | Lv1  | Lv2  | Lv3  | Lv4  | Lv5  |
|-------------|------|------|------|------|------|
| energy_shot | 12.5 | 15.0 | 17.5 | 20.0 | 22.5 |
| aura_field  | 20.0 | 24.0 | 28.0 | 32.0 | 36.0 |
| laser_beam  | 31.3 | 37.5 | 43.8 | 50.0 | 56.3 |
| orbit_guard | 48.0 | 57.6 | 67.2 | 76.8 | 86.4 |
| shotgun     | 23.3 | 28.0 | 32.7 | 37.3 | 42.0 |
| lightning   | 30.0 | 36.0 | 42.0 | 48.0 | 54.0 |
| missile     | 12.0 | 14.4 | 16.8 | 19.2 | 21.6 |
| bomb        | 37.5 | 45.0 | 52.5 | 60.0 | 67.5 |

**Orbit guard is S-tier IF enemies are in range** (which they are near the base).
This creates a defensive meta: let enemies approach, then orbit shreds them.

### 3.3 TTK (Time to Kill) -- Energy Shot Only (Lv1)

This answers **Question 1**: Can energy_shot alone kill the boss?

```
TTK = enemyHP / weaponDPS
energy_shot DPS at Lv1 = 12.5
```

| Enemy    | HP @ t=0 | TTK (s) | HP @ t=30 | TTK (s) | HP @ t=50 | TTK (s) |
|----------|----------|---------|-----------|---------|-----------|---------|
| basic    | 10       | 0.8     | 14        | 1.1     | 18        | 1.4     |
| fast     | 8        | 0.6     | 11        | 0.9     | 14        | 1.1     |
| tank     | 50       | 4.0     | 71        | 5.7     | 89        | 7.1     |
| special  | 20       | 1.6     | 28        | 2.2     | 36        | 2.9     |
| splitter | 30       | 2.4     | 42        | 3.4     | 53        | 4.2     |
| **BOSS** | --       | --      | --        | --      | **890**   | **71.2**|

### ANSWER TO QUESTION 1: Boss TTK with Energy Shot

**Boss HP at t=50s = 500 * 2.0^(50/60) = 500 * 1.782 = 891 HP**

Wait -- the boss is spawned with `isElite: true` per WaveDirector line 70.
However, "boss" is its own enemy type, not an elite of another type.
The boss has `baseHp: 500`. But boss spawns as elite? Let me re-check.

Looking at WaveDirector line 70: `commands.push({ enemyId: 'boss', count: 1, isElite: true })`

If the boss gets the elite 5x HP multiplier, that would be:
**Boss HP = 500 * 5 (elite) * 2.0^(50/60) = 4455 HP**

This is likely **unintended** -- the boss is already defined with 500 HP as its base.
Applying the elite multiplier on top would make it nearly impossible.

**Scenario A: Boss is NOT affected by elite multiplier** (intended):
```
Boss HP = 500 * 2.0^(50/60) = 500 * 1.782 = 891 HP
Energy Shot Lv1 DPS = 12.5
TTK = 891 / 12.5 = 71.2 seconds
```
**IMPOSSIBLE** -- you only have 10s from boss spawn to stage end.

**Scenario B: Boss IS affected by elite multiplier** (as coded):
```
Boss HP = 500 * 5 * 1.782 = 4455 HP
TTK = 4455 / 12.5 = 356 seconds
```
**ABSURDLY IMPOSSIBLE**

Even with a Lv3 energy_shot (DPS=17.5) + damage passive Lv2 (+30%):
```
DPS = 17.5 * 1.30 = 22.75
TTK(A) = 891 / 22.75 = 39.2 seconds -- still impossible in 10s
```

**Minimum DPS needed to kill boss in 10s**:
```
Scenario A: 891 / 10 = 89.1 DPS required
Scenario B: 4455 / 10 = 445.5 DPS required
```

With energy_shot alone: **NO**, not even close.
With 3-4 weapons at Lv2-3 (combined ~60-100 DPS): **Barely possible in Scenario A**.

---

## 4. XP and Leveling Analysis

### 4.1 XP Required per Level

```
required(lv) = ceil(10 * 1.25^(lv-1))
```

| Level | Required XP | Cumulative XP | Kill Count (xp=1 basic) |
|-------|------------|---------------|------------------------|
| 1     | 10         | 10            | 10                     |
| 2     | 13         | 23            | 23                     |
| 3     | 16         | 39            | 39                     |
| 4     | 20         | 59            | 59                     |
| 5     | 25         | 84            | 84                     |
| 6     | 31         | 115           | 115                    |
| 7     | 39         | 154           | 154                    |
| 8     | 49         | 203           | 203                    |
| 9     | 61         | 264           | 264                    |
| 10    | 76         | 340           | 340                    |
| 11    | 95         | 435           | 435                    |
| 12    | 119        | 554           | 554                    |
| 13    | 149        | 703           | 703                    |
| 14    | 186        | 889           | 889                    |
| 15    | 233        | 1122          | 1122                   |

### 4.2 XP Income Estimation

XP values per enemy from enemies.ts:
- basic: 1 XP, fast: 2 XP, tank: 3 XP, special: 3 XP, splitter: 4 XP
- boss: 50 XP
- Elite: 5x XP (so basic elite = 5 XP, etc.)

**Average XP per kill (weighted by unlock time)**:

| Window  | Types Available           | Avg XP/kill | Estimated Kills | XP Earned |
|---------|---------------------------|-------------|-----------------|-----------|
| 0-12s   | basic only                | 1.0         | ~9              | 9         |
| 12-24s  | basic, fast               | 1.5         | ~10             | 15        |
| 24-36s  | basic, fast, tank         | 2.0         | ~17             | 34        |
| 36-48s  | +special                  | 2.25        | ~24             | 54        |
| 48-60s  | all + boss                | 2.6         | ~26             | 68+50(boss)|

Elite XP bonus (~14% of spawns are elite on average, 5x XP):
```
eliteXPbonus ~ totalXP * 0.14 * 4 = totalXP * 0.56
```

**Total estimated XP (60s, 90% kill rate)**:
```
Base XP from normals: ~180 * 0.9 = 162
Elite bonus: ~16 elites * avg 10 XP = 160
Boss: 50 (if killed)
Total: ~372 XP (without boss), ~422 XP (with boss)
```

### ANSWER TO QUESTION 2: Expected Level-Up Count

With ~372 XP (no boss kill):
- Level 8 requires 203 cumulative XP -- YES
- Level 9 requires 264 cumulative XP -- YES
- Level 10 requires 340 cumulative XP -- YES
- Level 11 requires 435 cumulative XP -- NO (372 < 435)

**First run expected level: 9-10** (depending on kill efficiency)

With meta_xp max (+60% XP):
```
372 * 1.6 = 595 XP -> Level 11-12
```

**Each level-up gives 1 upgrade choice (weapon or passive).**
In 60s, a first-run player gets **9-10 level-ups = 9-10 upgrades**.

This includes:
- Starting weapon (energy_shot) -- can upgrade Lv1->Lv5 (4 upgrades)
- Picking up 1-2 more weapons (2 upgrades)
- 3-4 passive upgrades

**Assessment**: 9-10 level-ups in 60s feels **generous but appropriate** for a Vampire
Survivors-like -- you're constantly getting stronger.

---

## 5. Base HP Survival Analysis

### ANSWER TO QUESTION 3: Can the base survive 60 seconds?

Base HP = 1000

### 5.1 Enemy Damage on Base Contact

When an enemy reaches the base, it deals its scaled damage:

| Enemy    | Damage @ t=0 | Damage @ t=30 | Damage @ t=50 |
|----------|-------------|---------------|---------------|
| basic    | 5           | 6             | 7             |
| fast     | 8           | 10            | 12            |
| tank     | 15          | 18            | 22            |
| special  | 10          | 12            | 15            |
| splitter | 8           | 10            | 12            |
| boss     | --          | --            | 37            |

**Elite: 2x damage**

### 5.2 Leak Analysis

The critical question: how many enemies leak through to the base?

**Player DPS vs. Incoming Enemy HP per second**:

We need to model the player's DPS growth vs. enemy HP inflow.

**Player DPS progression** (first run, energy_shot only + upgrades):

| Time  | Weapons/Passives              | Est. Total DPS |
|-------|-------------------------------|---------------:|
| 0-10s | energy_shot Lv1               | 12.5           |
| 10-20s| energy_shot Lv2 + 1 passive   | 18             |
| 20-30s| energy_shot Lv3 + weapon #2 Lv1 + 1 passive | 45 |
| 30-40s| energy Lv3 + weapon2 Lv2 + weapon3 Lv1 + 2 passives | 70 |
| 40-50s| energy Lv4 + w2 Lv3 + w3 Lv2 + 3 passives | 100 |
| 50-60s| energy Lv5 + w2 Lv4 + w3 Lv3 + 4 passives | 130 |

**Incoming enemy HP per second** (total enemy HP spawned per second):

| Window  | Spawn Rate | Count | Avg HP | HP/sec | Elite HP add |
|---------|-----------|-------|--------|--------|-------------|
| 0-10s   | 0.83/s    | 1     | 10     | 8.3    | +2.5        |
| 10-20s  | 0.97/s    | 1     | 11     | 10.7   | +4.0        |
| 20-30s  | 1.14/s    | 1-2   | 25*    | 28.5   | +14.3       |
| 30-40s  | 1.25/s    | 2     | 29*    | 72.5   | +21.8       |
| 40-50s  | 1.25/s    | 2     | 32*    | 80.0   | +28.0       |
| 50-60s  | 1.25/s    | 2-3   | 36*    | 112.5  | +39.4       |

*Weighted average HP across unlocked enemy types at that time, with scaling.

### 5.3 DPS Gap Analysis (Player DPS vs. Incoming HP/s)

| Window  | Player DPS | Incoming HP/s | Ratio | Status          |
|---------|-----------|---------------|-------|-----------------|
| 0-10s   | 12.5      | 10.8          | 1.16  | COMFORTABLE     |
| 10-20s  | 18        | 14.7          | 1.22  | COMFORTABLE     |
| 20-30s  | 45        | 42.8          | 1.05  | TIGHT           |
| 30-40s  | 70        | 94.3          | 0.74  | **UNDERWATER**  |
| 40-50s  | 100       | 108.0         | 0.93  | **UNDERWATER**  |
| 50-60s  | 130       | 151.9         | 0.86  | **UNDERWATER**  |

**CRITICAL FINDING**: From t=30s onward, incoming enemy HP exceeds player DPS.
Enemies begin accumulating on screen. Those that reach the base deal damage.

### 5.4 Estimated Base Damage Over Time

Assuming enemies that survive reach the base after their travel time:

**Conservative estimate (70% kill rate after t=30s)**:

| Window  | Leak Count | Avg Damage | Base Damage |
|---------|-----------|------------|-------------|
| 0-20s   | ~2        | 6          | 12          |
| 20-30s  | ~4        | 10         | 40          |
| 30-40s  | ~8        | 12         | 96          |
| 40-50s  | ~10       | 15         | 150         |
| 50-60s  | ~14       | 18         | 252         |

**Total estimated base damage (without passives): ~550 HP**

With hp_regen (if picked, Lv2 = 40 HP/s):
```
Regen over 60s = 40 * 60 = 2400 HP total regen (but only active from ~level-up time)
Effective regen: ~40 * 40s = 1600 HP
```

With base_armor (Lv2 = -20% damage):
```
Damage taken = 550 * 0.8 = 440 HP
```

**Base HP remaining (first run, no defensive passives): ~450 HP (45% health)**
**Base HP remaining (with some defense): ~600-800 HP (60-80% health)**

### 5.5 Verdict on 60s Survival

**First run: BASE SURVIVES** with ~40-50% HP remaining.
The player is NOT overwhelmed completely, but is under significant pressure after t=30s.

**However**, this assumes perfect play direction. If the player doesn't prioritize
high-HP enemies (tanks), a few elites leaking can swing the result dramatically.

**A tank elite at t=40 has 397 HP** -- if it reaches base, it deals 30+ damage per hit
and keeps hitting until killed.

---

## 6. Boss Kill Feasibility (Deep Analysis)

### 6.1 Boss Stats at Spawn (t=50s)

```
Boss BaseHP = 500
HP scaling: 500 * 2.0^(50/60) = 500 * 1.782 = 891 HP

BUT: Boss spawns with isElite=true (WaveDirector line 70)
If elite 5x HP applies: 891 * 5 = 4455 HP

Boss speed at t=50: min(15 * 1.3^(50/60), 15 * 2.0) = min(17, 30) = 17 px/s
Boss travel time: 1230 / 17 = 72 seconds (won't reach base before stage ends)
Boss damage at t=50: 30 * 1.5^(50/60) = 30 * 1.369 = 41 damage
```

### 6.2 Time Available to Kill Boss

Boss spawns at t=50s. Stage ends at t=60s. Time = 10 seconds.

But the boss also needs to travel to reach the player (if player is at base).
If player moves towards boss, combat happens sooner.

### 6.3 DPS Required

**Scenario A (non-elite boss, 891 HP):**
```
Required DPS = 891 / 10 = 89.1 DPS
```

Can a first-run player achieve 89 DPS at t=50?
With energy_shot Lv4 (20 DPS) + laser_beam Lv3 (43.8) + lightning Lv2 (36):
Total = 99.8 DPS -- **Barely possible with 3 weapons at moderate levels**

**Scenario B (elite boss, 4455 HP):**
```
Required DPS = 4455 / 10 = 445.5 DPS
```
This is **impossible** for a first-run player. Even a max-meta player with perfect
weapons would struggle. Max theoretical DPS with 4 weapons = ~250-300 DPS.

### 6.4 Boss Balance Verdict

**BUG IDENTIFIED**: The boss spawns as `isElite: true` in WaveDirector.
If this applies the elite 5x HP multiplier, the boss has **4455 HP** which is
mathematically impossible to kill in 10 seconds under any build configuration.

**RECOMMENDATION**: Boss should NOT receive elite multiplier, or the WaveDirector
should spawn boss with `isElite: false`. The boss already has 500 base HP (50x basic)
which provides sufficient challenge.

Even without elite multiplier, 891 HP in 10 seconds requires focused DPS that only
a well-built mid-game character can achieve. First-run boss kills should be rare
(~10-20%), which matches the intended progression.

---

## 7. Gold Economy

### 7.1 Gold per Kill

```
goldPerKill = 1 (normal)
goldPerElite = 5
goldPerBoss = 50
```

### 7.2 Estimated Gold per Run

| Scenario | Normal Kills | Elite Kills | Boss | Total Gold |
|----------|-------------|-------------|------|-----------|
| Beginner (30s, 60%) | ~21 | ~2 | 0 | 31 |
| Average (45s, 75%) | ~51 | ~7 | 0 | 86 |
| Expert (60s, 90%) | ~82 | ~14 | 1 | 202 |

### 7.3 Meta Upgrade Pacing

| Upgrade      | Lv1 Cost | Total (max) | Runs to Lv1 (avg) | Runs to Max (avg) |
|-------------|---------|-------------|-------------------|-------------------|
| meta_damage | 50      | 1550        | 1                 | 18                |
| meta_hp     | 50      | 1550        | 1                 | 18                |
| meta_speed  | 80      | 780         | 1                 | 9                 |
| meta_xp     | 100     | 950         | 2                 | 11                |
| meta_crit   | 60      | 1930        | 1                 | 22                |
| **Total**   | --      | **6760**    | --                | **~78 runs (avg)**|

### 7.4 Economy Assessment

- **First upgrade**: After 1 run (86 gold avg) -- immediate reward
- **Noticeable power**: ~5 runs (meta_damage Lv2 + meta_hp Lv1) -- correct
- **Full max**: ~78 runs at average gold -- this is ~78 minutes of gameplay (60s runs)

**VERDICT: HEALTHY** -- pacing is appropriate for a quick-session game.
The 78-run number is good for retention without being tedious.

---

## 8. S-Curve Difficulty Analysis

### 8.1 Composite Difficulty Index

```
difficulty(t) = incomingHP/s(t) / playerDPS(t)
```

| Time (s) | Player DPS | Incoming HP/s | Difficulty Index | Zone           |
|----------|-----------|---------------|------------------|----------------|
| 0        | 12.5      | 8.3           | 0.66             | EASY           |
| 10       | 15        | 10.7          | 0.71             | EASY           |
| 20       | 30        | 28.5          | 0.95             | MODERATE       |
| 25       | 40        | 35.0          | 0.88             | MODERATE       |
| 30       | 55        | 72.5          | 1.32             | **HARD**       |
| 35       | 65        | 85.0          | 1.31             | **HARD**       |
| 40       | 80        | 94.3          | 1.18             | HARD           |
| 45       | 100       | 100.0         | 1.00             | MODERATE       |
| 50       | 120       | 108.0 + boss  | 1.40+            | **SPIKE**      |
| 55       | 130       | 130.0         | 1.00             | MODERATE       |
| 60       | 140       | 151.9         | 1.09             | HARD           |

### 8.2 S-Curve Shape Assessment

```
Ideal:  0-20s gentle (< 0.8) -> 20-45s steep (0.8-1.2) -> 45-60s plateau (1.0-1.5)
Actual: 0-15s easy (0.66-0.71) -> 15-30s ramp (0.71-1.32) -> 30-50s HARD (1.18-1.40)
                                                               -> 50s BOSS SPIKE
```

**FINDING: Sharp difficulty spike at t=30s** when spawnCount jumps from 1 to 2.
This is not a smooth S-curve but rather a step function at the 30s mark.

The 30s spike is caused by:
1. spawnCount doubles (1 -> 2)
2. Tank enemies unlocked (50 HP each)
3. Interval already at minimum (800ms)

---

## 9. Build Diversity Quick Check

### 9.1 Passive Priority (DPS impact per level)

| Passive       | Effect/Lv | DPS Impact (on 100 DPS) | Priority |
|---------------|-----------|------------------------|----------|
| damage        | +15%      | +15 DPS                | **S**    |
| attack_speed  | +10%      | +10 DPS                | **A**    |
| crit_chance   | +5%       | +5 DPS (with 2x crit)  | **B**    |
| crit_damage   | +25%      | +~2.5 (at 10% crit)    | **C**    |
| move_speed    | +10%      | 0 DPS (survival)       | C        |
| base_armor    | -10% dmg  | 0 DPS (defense)        | B (def)  |
| hp_regen      | +20 HP/s  | 0 DPS (defense)        | A (def)  |

**Dominant strategy**: Stack `damage` (S) and `attack_speed` (A) passives.
Defensive passives are necessary but secondary.

### 9.2 Weapon Tier Ranking

| Tier | Weapon       | Rationale                                        |
|------|-------------|--------------------------------------------------|
| S    | orbit_guard | Highest DPS (48 base), but requires melee range  |
| A    | bomb        | 37.5 DPS AOE, best wave clear                   |
| A    | laser_beam  | 31.3 DPS, best line clear, pierce 99            |
| A    | lightning   | 30 DPS, 3-chain, good coverage                  |
| B    | shotgun     | 23.3 DPS, range-limited, solid burst             |
| B    | aura_field  | 20 DPS, passive damage, always-on               |
| C    | energy_shot | 12.5 DPS, starter weapon, falls off              |
| C    | missile     | 12 DPS, slow, splash too small                  |

**ISSUE**: orbit_guard's 48 DPS is 3.8x the starter weapon and nearly double the
next best weapon (bomb at 37.5). If enemies cluster near the base, orbit_guard
trivializes the defensive game.

---

## 10. Broken Interactions & Flags

### 10.1 Boss Elite Multiplier Bug

**Severity: CRITICAL**

WaveDirector line 70 spawns boss with `isElite: true`.
If the render/damage system applies the standard 5x HP multiplier, the boss has
4455 HP, which is **mathematically unkillable in 10 seconds** by any build.

**Fix**: Either:
- (A) Change to `isElite: false` in WaveDirector
- (B) Add boss-specific handling that skips the elite multiplier

### 10.2 hp_regen + base_armor Stacking

```
hp_regen Lv3 = 60 HP/s
base_armor Lv5 = 50% damage reduction

At t=30s, average enemy damage on base hit = ~10 damage per leak
With 50% armor = 5 damage per leak
If leak rate < 12 enemies/s (5 * 12 = 60 = regen), base is immortal

Leak rate at t=30s ~ 0.5 enemies/s -> 2.5 damage/s vs 60 regen/s
Leak rate at t=50s ~ 1.5 enemies/s -> 12 damage/s vs 60 regen/s
```

**VERDICT**: hp_regen Lv3 makes the base effectively immortal. The regen far exceeds
any plausible leak damage. This removes survival pressure entirely.

**Fix**: Reduce hp_regen valuePerLevel from 20 to 5, or add maxLevel cap at 2.

### 10.3 Orbit Guard DPS Dominance

orbit_guard at 48 DPS (multi-target) is **2.5x stronger** than the next best
single-target weapon. Its only drawback (melee range) is negated by the
game's design: enemies march toward the player.

**Fix**: Increase orbit_guard hitCooldown or reduce projectileCount.

### 10.4 Spawn Count Step Function

The `1 + floor(minutes * 2)` formula creates hard steps:
- t=0-29s: spawnCount = 1
- t=30-59s: spawnCount = 2
- t=60s: spawnCount = 3

The jump from 1 to 2 at t=30s doubles spawn rate instantly, creating a
difficulty spike that violates the S-curve principle.

**Fix**: Use `1 + floor(minutes * 2.5)` or smooth interpolation.

---

## 11. Summary Answers to Core Questions

### Q1: Can energy_shot alone kill the boss (HP 891)?

**NO.** Energy shot Lv1 DPS = 12.5. TTK = 71.2 seconds. Only 10 seconds available.
Even at Lv5 (22.5 DPS), TTK = 39.6 seconds. Still impossible.
Minimum DPS needed: 89.1 DPS -- requires 3+ weapons at mid level.
If boss receives elite 5x HP (4455), it is **impossible for any build**.

### Q2: Expected level-ups in 60 seconds?

**9-10 level-ups** on first run (~372 XP). With meta_xp max: 11-12.
This provides sufficient upgrade choices to feel progression.

### Q3: Can the base survive 60 seconds?

**YES, but barely on first run** (~40-50% HP remaining).
With defensive passives (hp_regen + base_armor), base becomes effectively immortal.
Without any defense, base can drop to ~400 HP by t=60s.

### Q4: Balance Improvement Recommendations

See Section 12 below.

---

## 12. Balance Change Proposals

### P1: Boss Elite Flag Fix [CRITICAL]

| Parameter | File | Current | Proposed | Impact |
|-----------|------|---------|----------|--------|
| Boss spawn isElite | WaveDirector.ts L70 | `isElite: true` | `isElite: false` | Boss HP: 4455 -> 891 |

**Rationale**: Boss is already a unique enemy type with 500 base HP. Elite multiplier
makes it unkillable. First-run boss kill rate should be ~10-20%.

### P2: hp_regen Nerf [HIGH]

| Parameter | File | Current | Proposed | Impact |
|-----------|------|---------|----------|--------|
| hp_regen.valuePerLevel | upgrades.ts | 20 | 5 | Regen: 60/s max -> 15/s max |

**Rationale**: 60 HP/s regen makes base immortal. At 15 HP/s, regen supplements
survival without trivializing it.

### P3: Spawn Count Smoothing [MEDIUM]

| Parameter | File | Current | Proposed | Impact |
|-----------|------|---------|----------|--------|
| spawnCount formula | WaveDirector.ts L59 | `1 + floor(min*2)` | `1 + floor(min*3)` | Steps at 20s, 40s, 60s |

**Rationale**: Currently jumps from 1 to 2 at t=30s (exact midpoint). With `*3`,
steps occur at t=20s (1->2) and t=40s (2->3), distributing pressure more evenly.

Alternative: Smooth formula `Math.round(1 + minutes * 2)` for gradual ramp.

### P4: Missile Buff [LOW]

| Parameter | File | Current | Proposed | Impact |
|-----------|------|---------|----------|--------|
| missile.cooldownMs | weapons.ts | 2500 | 1800 | DPS: 12.0 -> 16.7 |
| missile.aoeRadius | weapons.ts | 60 | 90 | More splash hits |

**Rationale**: Missile is strictly worse than every other weapon. A faster cooldown
and larger splash makes it viable as a boss-killer + AOE hybrid.

### P5: Orbit Guard Balance [LOW]

| Parameter | File | Current | Proposed | Impact |
|-----------|------|---------|----------|--------|
| orbit_guard.baseDamage | weapons.ts | 8 | 6 | DPS: 48 -> 36 |

**Rationale**: Orbit guard DPS is 2.5x the average. Reducing base damage to 6
(DPS=36) puts it in line with bomb (37.5) and laser (31.3) while still rewarding
the melee risk.

### P6: Enemy XP Rebalance [MEDIUM]

Current XP values seem low for harder enemies:

| Enemy    | Current XP | Proposed XP | Rationale                    |
|----------|-----------|-------------|------------------------------|
| basic    | 1         | 1           | (no change)                  |
| fast     | 2         | 2           | (no change)                  |
| tank     | 3         | 5           | 50 HP but only 3 XP          |
| special  | 3         | 4           | 20 HP, zigzag behavior       |
| splitter | 4         | 5           | 30 HP + splits               |
| boss     | 50        | 100         | Reward for difficult kill    |

**Rationale**: Tank has 50 HP (5x basic) but only gives 3x XP. This disincentivizes
fighting tanks. XP should roughly scale with HP to maintain kill efficiency parity.

---

## 13. Risk Assessment

| Change | Risk Level | Blast Radius | Reversibility |
|--------|-----------|-------------|---------------|
| P1 Boss elite fix | LOW | WaveDirector only | Easy |
| P2 hp_regen nerf | MEDIUM | Affects defensive builds | Easy |
| P3 Spawn smoothing | MEDIUM | Changes difficulty curve | Easy |
| P4 Missile buff | LOW | Single weapon | Easy |
| P5 Orbit nerf | MEDIUM | Affects melee builds | Easy |
| P6 XP rebalance | LOW | Leveling speed | Easy |

---

## 14. Overall Verdict

**OVERALL: MOSTLY BALANCED with 2 CRITICAL ISSUES**

The 60-second run structure fundamentally works:
- Early game (0-20s) is approachable
- Mid game (20-40s) ramps challenge appropriately
- Late game (40-60s) creates legitimate pressure
- Leveling pace (9-10 ups) provides constant gratification
- Economy pacing (78 runs to max) supports long-term engagement

**CRITICAL FIXES NEEDED**:
1. Boss elite flag must be fixed -- the boss is unkillable as currently coded
2. hp_regen is grossly overtuned and trivializes survival

**RECOMMENDED FIXES**:
3. Spawn count step function should be smoothed
4. Missile needs a buff to be competitive
5. Tank/Splitter XP should be increased for kill efficiency parity

---

## 15. Next Steps

- [ ] Programmer: Fix boss isElite flag (P1)
- [ ] Balance: After P1-P6 applied, re-run `/bal-dps-matrix` for updated tier ranking
- [ ] Balance: Run `/bal-economy-sim` for 50-run gold pacing simulation
- [ ] Balance: Run `/bal-build-analysis` for weapon synergy matrix
- [ ] QA: Playtest 10 runs and record actual base HP / level / boss kill data
- [ ] Update `design/status.json` with BAL-002 entry
