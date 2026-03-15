# Neon Warden: Complete Numerical Framework

> **Project**: ShamShuiPo / Neon Warden
> **Version**: v1.0
> **Author**: Balance Designer (Opus 4.6)
> **Date**: 2026-03-14
> **Prerequisite**: SPEC-037 Concept 7, vs-engine-dissection.md, selection-only-games-analysis.md
> **Status**: CEO Review Pending

---

## 1. CREATURE STAT SYSTEM

### 1.1 Role Definitions

Every creature belongs to exactly one of five ecological roles. Roles define the creature's fundamental behavior inside the Neon Zone.

| Role         | Function                                            | Population Cost |           Combat Contribution           |    Resource Flow    |
| ------------ | --------------------------------------------------- | :-------------: | :-------------------------------------: | :-----------------: |
| **Producer** | Generates Energy; base of the food chain            |    Low (1-2)    |              None directly              |    +Energy/tick     |
| **Predator** | Hunts Producers/Parasites; primary combat power     |   High (3-4)    |              Direct damage              | -Energy (feed cost) |
| **Symbiont** | Bonds with another creature; amplifies its stats    |   Medium (2)    |          Indirect (buffs ally)          |       Neutral       |
| **Parasite** | Drains a host; risky but powerful when controlled   |     Low (1)     | Conditional (drains enemies if no host) | -Energy (from host) |
| **Catalyst** | Triggers events/mutations; modifies ecosystem rules |  Medium (2-3)   |                Variable                 |      Variable       |

### 1.2 Stat Definitions

Each creature has six core stats:

| Stat              | Symbol | Description                                     | Range |
| ----------------- | :----: | ----------------------------------------------- | :---: |
| Population Cost   | `POP`  | Space consumed in the zone (capacity is finite) |  1-5  |
| Combat Power      |  `CP`  | Damage dealt to external threats per cycle      | 0-30  |
| Feed Rate         |  `FR`  | Energy consumed per cycle to survive            |  0-8  |
| Output Rate       |  `OR`  | Energy/resources produced per cycle             | 0-12  |
| Reproduction Rate |  `RR`  | Cycles until self-replication (0 = never)       | 0-10  |
| Resilience        | `RES`  | HP before creature dies/leaves                  | 1-20  |

### 1.3 Rarity Tiers

| Tier      | Drop Rate | Stat Budget | Hidden Trait Chance | Visual            |
| --------- | :-------: | :---------: | :-----------------: | ----------------- |
| Common    |    60%    |  12-16 pts  |         10%         | White silhouette  |
| Uncommon  |    25%    |  18-24 pts  |         20%         | Blue silhouette   |
| Rare      |    12%    |  26-34 pts  |         35%         | Purple silhouette |
| Legendary |    3%     |  38-50 pts  |         60%         | Gold silhouette   |

**Stat Budget** = sum of (CP + OR + RR + RES), normalized. Higher budget means stronger creature. POP and FR scale with power but are costs, not benefits.

### 1.4 Complete Creature Roster (20 Creatures)

#### Producers (4)

| ID  | Name           |  Rarity  | POP | CP  | FR  | OR  | RR  | RES | Special Trait                                                   |
| --- | -------------- | :------: | :-: | :-: | :-: | :-: | :-: | :-: | --------------------------------------------------------------- |
| P01 | Neon Moss      |  Common  |  1  |  0  |  0  |  2  |  5  |  3  | **Photosynthetic**: 0 feed cost, reproduces automatically       |
| P02 | Circuit Fungus |  Common  |  1  |  0  |  0  |  3  |  7  |  2  | **Networked**: +1 OR for each adjacent Producer                 |
| P03 | Data Coral     | Uncommon |  2  |  0  |  1  |  6  |  8  |  5  | **Archive**: Stores excess energy (up to 15 units)              |
| P04 | Quantum Garden |   Rare   |  3  |  0  |  2  | 10  |  0  |  8  | **Superposition**: Output randomly doubles or halves each cycle |

#### Predators (4)

| ID  | Name          |  Rarity   | POP | CP  | FR  | OR  | RR  | RES | Special Trait                                                               |
| --- | ------------- | :-------: | :-: | :-: | :-: | :-: | :-: | :-: | --------------------------------------------------------------------------- |
| D01 | Street Wolf   |  Common   |  2  |  5  |  3  |  0  |  6  |  6  | **Pack Hunter**: +2 CP per other Predator (max +6)                          |
| D02 | Chrome Raptor | Uncommon  |  3  | 10  |  5  |  0  |  0  | 10  | **Apex**: Cannot reproduce; hunts Parasites first                           |
| D03 | Neon Viper    |  Common   |  2  |  4  |  2  |  0  |  5  |  4  | **Venomous**: Kills a Parasite every 3 cycles                               |
| D04 | Void Stalker  | Legendary |  4  | 22  |  8  |  0  |  0  | 18  | **Apex Apex**: Eats other Predators if no prey; +5 CP per creature consumed |

#### Symbionts (4)

| ID  | Name              |  Rarity  | POP | CP  | FR  | OR  | RR  | RES | Special Trait                                                   |
| --- | ----------------- | :------: | :-: | :-: | :-: | :-: | :-: | :-: | --------------------------------------------------------------- |
| S01 | Glowfly Swarm     |  Common  |  1  |  0  |  1  |  1  |  4  |  2  | **Pollinate**: Bonded Producer gets +50% OR                     |
| S02 | Neon Lichen       |  Common  |  1  |  0  |  1  |  0  |  6  |  3  | **Armor Coat**: Bonded creature gets +5 RES                     |
| S03 | Data Sprite       | Uncommon |  2  |  3  |  2  |  2  |  0  |  5  | **Mirror**: Copies bonded creature's Special Trait              |
| S04 | Quantum Entangler |   Rare   |  2  |  0  |  3  |  0  |  0  |  7  | **Entangle**: Links two creatures; they share all buffs/debuffs |

#### Parasites (4)

| ID  | Name        |  Rarity   | POP | CP  | FR  | OR  | RR  | RES | Special Trait                                                                        |
| --- | ----------- | :-------: | :-: | :-: | :-: | :-: | :-: | :-: | ------------------------------------------------------------------------------------ |
| X01 | Wire Tick   |  Common   |  1  |  0  | 0\* |  0  |  3  |  1  | **Siphon**: Steals 2 OR from host; dies if no host in 2 cycles                       |
| X02 | Code Worm   |  Common   |  1  |  0  | 0\* |  0  |  4  |  2  | **Corrupt**: Host loses Special Trait; Parasite gains +3 CP                          |
| X03 | Neuro Leech | Uncommon  |  1  |  6  | 0\* |  0  |  0  |  4  | **Brain Tap**: Drains host RES by 1/cycle; +3 CP per RES drained                     |
| X04 | Omega Virus | Legendary |  1  |  0  | 0\* |  0  |  2  |  1  | **Pandemic**: Spreads to all creatures; each infected gives +1 CP but -1 OR globally |

\*Parasites feed on hosts, not energy pool.

#### Catalysts (4)

| ID  | Name            |  Rarity   | POP | CP  | FR  | OR  | RR  | RES | Special Trait                                                             |
| --- | --------------- | :-------: | :-: | :-: | :-: | :-: | :-: | :-: | ------------------------------------------------------------------------- |
| C01 | Neon Shaman     | Uncommon  |  2  |  2  |  2  |  0  |  0  |  5  | **Mutate**: Every 5 cycles, one random creature gains a random stat +2    |
| C02 | Frequency Tower |   Rare    |  3  |  0  |  4  |  0  |  0  | 12  | **Resonate**: All creatures of the same role get +1 to their primary stat |
| C03 | Chaos Moth      |  Common   |  1  |  1  |  1  |  1  |  3  |  2  | **Flutter**: Randomly swaps two creatures' Special Traits every 8 cycles  |
| C04 | Architect AI    | Legendary |  5  |  0  |  6  |  8  |  0  | 15  | **Terraform**: Every 4 cycles, creates a free Common Producer             |

---

## 2. ECOSYSTEM SIMULATION

### 2.1 Population Capacity

| District Level | Max Population | Unlock Cost | Notes         |
| :------------: | :------------: | :---------: | ------------- |
|   1 (Start)    |       8        |     --      | Tutorial gate |
|       2        |       10       | 50 Credits  | After wave 3  |
|       3        |       13       | 120 Credits | After wave 6  |
|       4        |       16       | 200 Credits | After wave 10 |
|    5 (Max)     |       20       | 350 Credits | After wave 13 |

Population is the sum of all living creatures' POP values. When at capacity, new admissions require an existing creature to die or be exiled.

### 2.2 Food Chain Rules

```
PRODUCERS  ──(generate energy)──>  ENERGY POOL
    ^                                   |
    |                              (feed from)
    |                                   v
    +────(consumed by)────────  PREDATORS ──(attack)──> EXTERNAL THREATS
                                    ^
                                    |
                              (hunted by)
                                    |
                               PARASITES ──(drain)──> HOST CREATURE
                                    ^
                                    |
                              (bonded with)
                                    |
                               SYMBIONTS ──(buff)──> BONDED CREATURE

                               CATALYSTS ──(modify)──> ALL CREATURES
```

**Feeding Resolution (per cycle, ~3 seconds):**

1. Producers generate OR into Energy Pool.
2. All creatures consume FR from Energy Pool.
3. If Energy Pool < total FR demand, creatures starve in reverse order of RES (weakest die first).
4. Parasites drain from their host instead of the pool (host loses OR or RES).
5. Predators with no prey and insufficient energy become **Feral** (attack random zone creatures).
6. Symbionts without a bond target become **Dormant** (no effect, still consume FR).

**Reproduction:**

- Every `RR` cycles, a creature produces a copy of itself (same stats, Common rarity).
- Reproduction only occurs if zone is below population capacity.
- Reproduced creatures inherit Special Trait at 50% effectiveness.

### 2.3 Ecosystem Health Formula

```
Ecosystem Health (EH) = Diversity Score x Chain Balance x Population Ratio

Where:
  Diversity Score (DS) = 1 + 0.2 * (number of distinct roles present - 1)
    - 1 role:  DS = 1.0
    - 2 roles: DS = 1.2
    - 3 roles: DS = 1.4
    - 4 roles: DS = 1.6
    - 5 roles: DS = 1.8

  Chain Balance (CB) = 1 - |Producer% - 0.40|*2 - |Predator% - 0.25|*2 - |Other% - 0.35|*2
    - Perfect balance (40P/25D/35Other): CB = 1.0
    - Max imbalance (100% one role):     CB = -0.2 (clamped to 0.0)
    - CB is clamped to [0.0, 1.0]

  Population Ratio (PR) = min(current_pop / capacity, 1.0) * (1 - overcrowding_penalty)
    - overcrowding_penalty = max(0, (current_pop - capacity) / capacity * 0.5)
    - At capacity: PR = 1.0
    - At 50% capacity: PR = 0.5
    - Over capacity by 20%: PR = 0.9 (penalty kicks in)

EH Range: 0.0 (collapsed) to 1.8 (perfect 5-role diverse, balanced, full population)
```

**Ecosystem Health Thresholds:**

| EH Range  | State           | Visual                    | Effect                                    |
| --------- | --------------- | ------------------------- | ----------------------------------------- |
| 0.0 - 0.3 | **Collapsing**  | Red glow, flickering      | -50% CP, creatures flee (1/cycle)         |
| 0.3 - 0.6 | **Struggling**  | Dim amber glow            | -20% CP                                   |
| 0.6 - 1.0 | **Stable**      | Steady cyan glow          | Normal                                    |
| 1.0 - 1.4 | **Thriving**    | Bright neon pulse         | +25% CP, +2 OR to all Producers           |
| 1.4 - 1.8 | **Flourishing** | Brilliant rainbow cascade | +50% CP, free reproduction every 5 cycles |

### 2.4 Combat Power Formula

```
Zone Combat Power (ZCP) = Base_CP * EH_Multiplier * Synergy_Bonus

Where:
  Base_CP = SUM of all living creatures' CP values

  EH_Multiplier = 0.5 + EH (Ecosystem Health)
    - At EH 0.0: multiplier = 0.5 (halved combat)
    - At EH 1.0: multiplier = 1.5
    - At EH 1.8: multiplier = 2.3

  Synergy_Bonus = 1.0 + SUM of active synergy modifiers
    - "Pack" (3+ Predators): +0.15
    - "Garden" (4+ Producers): +0.10
    - "Hive Mind" (2+ Symbionts bonded): +0.20
    - "Controlled Burn" (1 Parasite + 1 Predator hunting it): +0.25
    - "Full Spectrum" (all 5 roles present): +0.30
```

### 2.5 Cascade Collapse Math

A **Cascade Collapse** occurs when removing one species triggers a chain extinction.

**Collapse Trigger Conditions:**

```
IF Producers die:
  Energy deficit = Total FR demand - Remaining OR
  IF deficit > Energy Pool reserves:
    Starvation cascade: weakest creature dies every cycle
    Each death further reduces CP, causing threat overflow

IF all Predators die:
  Parasites run unchecked (no natural predator)
  Parasites drain all Producers within 3-5 cycles
  Energy → 0 → total collapse

IF all Symbionts die:
  No immediate collapse, but:
  - Bonded creatures lose buffs instantly
  - CP drops 15-30% depending on synergies
  - Predators may not survive next threat wave
```

**Cascade Severity Formula:**

```
Collapse Risk = (1 - Role Redundancy) * Dependency Depth

Role Redundancy = min(count_of_role / 2, 1.0)
  - 1 creature of a role: redundancy = 0.5 (high risk)
  - 2+ creatures: redundancy = 1.0 (safe)

Dependency Depth = number of other roles that directly depend on this role
  - Producers: depth = 3 (Predators, Symbionts, Catalysts all need energy)
  - Predators: depth = 2 (ecosystem defense + Parasite control)
  - Symbionts: depth = 1 (bonded creature only)
  - Parasites: depth = 0 (removal is usually beneficial)
  - Catalysts: depth = 1 (mutation/buff targets)
```

**Critical Mass Thresholds (when cascade becomes unrecoverable):**

| Scenario               | Recoverable if...                                     | Unrecoverable if...              |
| ---------------------- | ----------------------------------------------------- | -------------------------------- |
| All Producers dead     | Energy Pool > 15 AND next gate has Producer           | Energy Pool < 5                  |
| All Predators dead     | No active Parasites AND threat wave is 2+ cycles away | Parasites > 2 OR threat imminent |
| Ecosystem Health < 0.2 | Player has Emergency Edict available                  | No edict + threat incoming       |

### 2.6 The Golden Ratio

The mathematically optimal ecosystem composition for maximum sustained Combat Power:

```
GOLDEN RATIO (for capacity 20):

Producers:  8 creatures (40% of population)
  - 4x Neon Moss (POP 4, OR 8, FR 0)
  - 2x Circuit Fungus (POP 2, OR 6+bonuses, FR 0)
  - 1x Data Coral (POP 2, OR 6, FR 1 + storage)
  = Total OR: ~24/cycle, Total FR from producers: 1

Predators:  5 creatures (25% of population)
  - 2x Street Wolf (POP 4, CP 10+pack, FR 6)
  - 1x Chrome Raptor (POP 3, CP 10, FR 5)
  - 1x Neon Viper (POP 2, CP 4, FR 2)
  = Total CP: ~30 base, Total FR: 13

Symbionts: 3 creatures (15% of population)
  - 2x Glowfly Swarm (POP 2, OR+, FR 2)
  - 1x Data Sprite (POP 2, CP 3, FR 2)
  = Buff value: +50% OR to 2 Producers, mirror 1 trait

Catalysts: 2 creatures (10% of population)
  - 1x Neon Shaman (POP 2, FR 2)
  - 1x Chaos Moth (POP 1, FR 1)
  = Ecosystem modification value

Parasites: 1-2 creatures (5-10% of population)
  - 1x Wire Tick on an enemy (if "Controlled Burn" synergy active)
  = Conditional +0.25 synergy bonus

TOTAL POP:  ~19-20
TOTAL OR:   ~28/cycle (with Symbiont buffs)
TOTAL FR:   ~20/cycle
NET ENERGY: +8/cycle (surplus → stored or → defenses)
BASE CP:    ~35
EH:         ~1.5 (Thriving)
ZCP:        35 * (0.5 + 1.5) * (1.0 + 0.15 + 0.10 + 0.20 + 0.30)
          = 35 * 2.0 * 1.75
          = ~122.5 ZCP
```

**Why the Golden Ratio is hard to achieve:**

1. Arrival queue is random -- you cannot guarantee the right creatures appear.
2. Reproduction shifts ratios over time (Neon Moss reproduces fast, skewing toward Producers).
3. Hidden traits can sabotage the plan (a "Producer" might actually be a disguised Parasite).
4. Threats specifically counter dominant strategies (see Section 7).

---

## 3. THREAT SCALING

### 3.1 Wave Structure (10 minutes, 15 waves)

|  Wave  |   Time   | Threat HP | Threat DPS | Required ZCP | Composition                              |
| :----: | :------: | :-------: | :--------: | :----------: | ---------------------------------------- |
|   1    |   0:00   |    10     |     1      |      5       | 2 Scavengers                             |
|   2    |   0:40   |    18     |     2      |      10      | 3 Scavengers                             |
|   3    |   1:20   |    28     |     3      |      16      | 4 Scavengers, 1 Drone                    |
|   4    |   2:00   |    40     |     5      |      24      | 3 Drones, 1 Raider                       |
|   5    |   2:40   |    55     |     7      |      33      | 4 Drones, 2 Raiders                      |
|   6    |   3:20   |    72     |     9      |      42      | 5 Raiders, 1 Shielder                    |
|   7    |   4:00   |    92     |     12     |      54      | 4 Raiders, 2 Shielders                   |
| **8**  | **5:00** |  **140**  |   **18**   |    **75**    | **BOSS: Walled City Breaker**            |
|   9    |   5:40   |    105    |     14     |      62      | 6 Drones, 3 Raiders (post-boss reprieve) |
|   10   |   6:20   |    130    |     17     |      78      | 4 Raiders, 2 Shielders, 1 Jammer         |
|   11   |   7:00   |    160    |     21     |      96      | 5 Shielders, 3 Jammers                   |
|   12   |   7:40   |    195    |     25     |     115      | Mixed elite squad                        |
|   13   |   8:20   |    235    |     30     |     135      | 8 Raiders, 4 Shielders, 2 Jammers        |
| **14** | **9:00** |  **320**  |   **40**   |   **180**    | **BOSS: The Purifier**                   |
|   15   |   9:40   |    250    |     32     |     150      | Rejected Arrivals (vengeful)             |

### 3.2 Enemy Types

| Type      | HP  | DPS | Behavior                                | Counter                     |
| --------- | --- | --- | --------------------------------------- | --------------------------- |
| Scavenger | 3   | 1   | Attacks wall directly                   | Any CP                      |
| Drone     | 6   | 2   | Flies over low walls; targets Producers | Predator CP                 |
| Raider    | 12  | 4   | Tanky, slow; deals area damage          | High CP burst               |
| Shielder  | 8   | 1   | Reduces incoming CP by 30% for allies   | Parasites (bypass shields)  |
| Jammer    | 5   | 0   | Disables 1 Symbiont bond per cycle      | Predators (priority target) |

### 3.3 Boss Encounters

**Boss 1: Walled City Breaker (Wave 8, Minute 5)**

| Stat         | Value                                                                            |
| ------------ | -------------------------------------------------------------------------------- |
| HP           | 140                                                                              |
| DPS          | 18                                                                               |
| Special      | **Quake**: Every 2 cycles, kills the weakest creature in the zone                |
| Required ZCP | 75 (over 4 cycles to deplete HP)                                                 |
| Strategy     | Need high RES creatures to survive Quake; Symbionts with Armor Coat are critical |

**Boss 2: The Purifier (Wave 14, Minute 9)**

| Stat         | Value                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| HP           | 320                                                                                                                    |
| DPS          | 40                                                                                                                     |
| Special      | **Cleanse**: Removes all Parasites and Catalysts from zone; **EMP**: Halves all OR for 2 cycles                        |
| Required ZCP | 180 (over 5 cycles to deplete HP)                                                                                      |
| Strategy     | Must survive OR reduction; Data Coral's stored energy is lifesaver. Pure Producer/Predator builds can brute-force this |

### 3.4 The Knife's Edge Balance

The difficulty curve is tuned so that:

```
Good player's ZCP trajectory:
  Wave 1:  ZCP ~8   vs Required 5    (margin: +60%)
  Wave 5:  ZCP ~45  vs Required 33   (margin: +36%)
  Wave 8:  ZCP ~85  vs Required 75   (margin: +13%)   <-- KNIFE'S EDGE
  Wave 10: ZCP ~95  vs Required 78   (margin: +22%)   (post-boss recovery)
  Wave 14: ZCP ~195 vs Required 180  (margin: +8%)    <-- KNIFE'S EDGE
  Wave 15: ZCP ~170 vs Required 150  (margin: +13%)

Average player's ZCP trajectory:
  Wave 8:  ZCP ~70  vs Required 75   (margin: -7%)    DEATH LIKELY
  Wave 14: ZCP ~155 vs Required 180  (margin: -14%)   DEATH CERTAIN

Design intent:
  - Good play = survive with 5-15% margin at boss waves
  - Average play = die at wave 8-10 (minute 5-6)
  - Expert play = survive with 20-30% margin, enabling risky compositions
  - The game should feel "I BARELY made it" at waves 8 and 14
```

### 3.5 Threat Damage to Zone

When ZCP < Required ZCP for a wave:

```
Zone Damage = (Required_ZCP - Actual_ZCP) * 0.5

Zone has 100 HP (zone wall durability).
Zone HP = 0 → Game Over.

Example: Wave 8 requires 75 ZCP. Player has 60 ZCP.
  Zone Damage = (75 - 60) * 0.5 = 7.5 damage
  Zone HP: 100 → 92.5
  Survivable, but can't take many more losses.
```

---

## 4. ECONOMY

### 4.1 In-Run Currency: Neon Credits

| Source                           |         Amount         | Notes                     |
| -------------------------------- | :--------------------: | ------------------------- |
| Wave survived                    | 8 + (wave_number \* 2) | Wave 1 = 10, Wave 15 = 38 |
| Perfect wave (no zone damage)    |        +5 bonus        | Rewards tight play        |
| Boss killed                      |        30 / 50         | Boss 1 / Boss 2           |
| Ecosystem Health bonus           |    EH \* 3 per wave    | Thriving EH 1.4 = +4.2    |
| Hidden trait revealed (positive) |           +5           | Reward for risk-taking    |

**Expected earnings per run:**

| Run Quality          | Total Credits | Notes                         |
| -------------------- | :-----------: | ----------------------------- |
| Die at wave 5        |      ~80      | Enough for 1 upgrade          |
| Die at wave 10       |     ~200      | Enough for district expansion |
| Full clear (wave 15) |     ~420      | Enough for 2-3 upgrades       |

### 4.2 In-Run Spending

| Purchase                 | Cost | Effect                            |
| ------------------------ | :--: | --------------------------------- |
| District Expansion (Lv2) |  50  | +2 population capacity            |
| District Expansion (Lv3) | 120  | +3 population capacity            |
| District Expansion (Lv4) | 200  | +3 population capacity            |
| District Expansion (Lv5) | 350  | +4 population capacity            |
| Gate Upgrade: Scout Lens |  40  | Reveals 1 additional hidden trait |
| Gate Upgrade: Wider Gate |  60  | +1 arrival in queue (3 → 4)       |
| Gate Upgrade: Quarantine |  80  | Can exile 1 creature per 3 waves  |
| Emergency Repair         |  30  | Restore 15 Zone HP                |
| Ecosystem Stimulant      |  25  | +0.3 EH for 3 cycles              |

### 4.3 Meta-Currency: Warden Tokens

Earned between runs for permanent progression.

| Source                     | Tokens  |
| -------------------------- | :-----: |
| Run completed (any result) |    1    |
| Reached wave 8+            |   +1    |
| Reached wave 15            |   +2    |
| First time reaching wave X |   +3    |
| Achievement completed      | +1 each |

### 4.4 Meta-Progression Shop (Between Runs)

| Upgrade           | Token Cost | Effect                                       | Max Level |
| ----------------- | :--------: | -------------------------------------------- | :-------: |
| Starting Capacity | 3 / 5 / 8  | Start with 9 / 10 / 11 population            |     3     |
| Trait Intuition   | 2 / 4 / 7  | Start with 1 / 2 / 3 hidden traits visible   |     3     |
| Emergency Fund    |   3 / 6    | Start with 20 / 40 Neon Credits              |     2     |
| Ecosystem Memory  |   5 / 10   | Start with 1 / 2 creatures from previous run |     2     |
| Creature Library  |   2 each   | Unlock new creature types in arrival pool    |    15+    |
| Zone Blueprint    |   4 each   | Unlock new zone sector types                 |     5     |
| Edict Manual      |   3 each   | Unlock new Emergency Edicts                  |     6     |

**Progression pacing**: A player doing 3 runs/day earns ~8-12 tokens/day. Full meta-progression takes ~30-40 runs (~10-14 days). This matches casual mobile pacing.

---

## 5. SELECTION MATH

### 5.1 Arrival Queue

```
Queue Size:     3 creatures (base), 4 with Wider Gate upgrade
Display:        Card format showing visible stats
Timing:         Every 30-40 seconds (varies by wave intensity)
Options:        SELECT one creature to admit, or REJECT ALL (skip this gate)
Reject penalty: Rejected creatures have 15% chance to join hostile outside faction
```

### 5.2 Arrival Frequency

| Phase    | Gates per minute | Interval | Reasoning                                       |
| -------- | :--------------: | :------: | ----------------------------------------------- |
| Min 0-2  |       2.0        |  30 sec  | Fast early decisions; build ecosystem quickly   |
| Min 2-5  |       1.7        |  35 sec  | Slightly slower; decisions become weightier     |
| Min 5-7  |       1.5        |  40 sec  | Post-boss; ecosystem stabilization phase        |
| Min 7-9  |       1.3        |  45 sec  | High-stakes late game; each choice critical     |
| Min 9-10 |       1.0        |  60 sec  | Final gates; one or two make-or-break decisions |

**Total gates per run**: ~22-25 gate openings.
**Total creatures admitted per run**: ~15-20 (some gates are rejected).

### 5.3 Hidden Trait System

```
Hidden Trait Probability by Rarity:
  Common:    10% chance of hidden trait
  Uncommon:  20%
  Rare:      35%
  Legendary: 60%

Hidden Trait Pool:
  POSITIVE (60% of hidden traits):
    - "Generous":     +3 OR (Producer becomes much better)
    - "Guardian":     +5 CP vs bosses specifically
    - "Fertile":      RR halved (reproduces faster)
    - "Resilient":    +5 RES
    - "Inspiring":    Adjacent creatures get +1 to all stats

  NEGATIVE (30% of hidden traits):
    - "Spy":          Sabotages 1 random structure every 5 cycles
    - "Sleeper Agent": Becomes a Predator after 3 cycles (eats producers)
    - "Contagious":   Spreads a -1 OR debuff to adjacent creatures
    - "Volatile":     Explodes after 8 cycles (kills self + adjacent, deals 10 zone damage)
    - "Parasite-in-disguise": Role changes to Parasite after 2 cycles

  WILD (10% of hidden traits):
    - "Mutant":       Randomly changes role every 5 cycles
    - "Duplicator":   Creates a copy on admission (free, ignores capacity)
    - "Catalyst":     Triggers a random ecosystem event immediately
```

### 5.4 Information Visibility by Mastery Level

| Mastery Level | Visible Stats             | Hidden Trait Hint             | Unlock Condition  |
| :-----------: | ------------------------- | ----------------------------- | ----------------- |
|   1 (Start)   | Role, POP, 1 random stat  | None                          | Default           |
|       2       | Role, POP, CP, OR         | "Has hidden trait" indicator  | 5 runs completed  |
|       3       | Role, POP, CP, OR, FR     | Positive/Negative category    | 15 runs completed |
|       4       | All stats                 | 50% chance to see exact trait | 30 runs completed |
|    5 (Max)    | All stats + Special Trait | 80% chance to see exact trait | 50 runs completed |

**Design intent**: Early runs feel mysterious and punishing. Late runs feel like mastery as information asymmetry decreases. But the 20% unrevealed chance at max mastery ensures uncertainty is never fully eliminated.

---

## 6. 10-MINUTE RUN SIMULATION

### 6.1 Good Player Run

```
STARTING STATE
  Zone HP: 100    Credits: 0    Capacity: 8    Pop: 0    EH: 0.0

=== GATE 1 (0:00) ===
  Arrivals: [Neon Moss (C), Street Wolf (C), Wire Tick (C)]
  Decision: ADMIT Neon Moss (need energy base first)
  Reasoning: Producer first to generate energy before admitting costly Predators

  Zone State: 1 Neon Moss (POP 1/8)
  Energy Pool: +2/cycle
  ZCP: 0

=== GATE 2 (0:30) ===
  Arrivals: [Circuit Fungus (C), Neon Moss (C), Chaos Moth (C)]
  Decision: ADMIT Circuit Fungus (networks with existing Moss for +1 OR)

  Zone State: 1 Neon Moss, 1 Circuit Fungus (POP 2/8)
  Energy Pool: +5/cycle (2 + 3, Fungus gets +1 from adjacency)
  ZCP: 0

--- WAVE 1 (0:00-0:40): 2 Scavengers (HP 10, Req ZCP 5) ---
  ZCP = 0 → Zone Damage = (5-0)*0.5 = 2.5
  Zone HP: 100 → 97.5
  Credits: +10 (wave survived)

=== GATE 3 (1:00) ===
  Arrivals: [Street Wolf (C), Glowfly Swarm (C), Neon Viper (C)]
  Decision: ADMIT Street Wolf (need combat power desperately)

  Zone State: 2 Producers, 1 Predator (POP 4/8)
  Energy Pool: +5 gen, -3 feed = +2 net/cycle
  ZCP: 5 * 1.2(DS for 2 roles) * ~0.8(CB) = ~4.8

--- WAVE 2 (0:40-1:20): 3 Scavengers (HP 18, Req ZCP 10) ---
  ZCP ~5 → Zone Damage = (10-5)*0.5 = 2.5
  Zone HP: 97.5 → 95
  Credits: +12

=== GATE 4 (1:30) ===
  Arrivals: [Glowfly Swarm (C), Data Coral (U), Code Worm (C)]
  Decision: ADMIT Glowfly Swarm (Symbiont buffs Circuit Fungus OR by +50%)

  Zone State: 2 Producers, 1 Predator, 1 Symbiont (POP 5/8)
  Glowfly bonds to Circuit Fungus: OR 3→4.5 (rounded to 5)
  Energy: +7 gen, -4 feed = +3 net/cycle
  DS = 1.4 (3 roles), CB ~0.75
  ZCP: 5 * (0.5+1.4*0.75) * 1.0 = 5 * 1.55 = ~7.7

--- WAVE 3 (1:20-2:00): 4 Scavengers, 1 Drone (HP 28, Req ZCP 16) ---
  ZCP ~8 → Zone Damage = (16-8)*0.5 = 4
  Zone HP: 95 → 91
  Credits: +14

=== GATE 5 (2:00) ===
  Arrivals: [Neon Viper (C), Neon Moss (C), Neon Shaman (U)]
  Decision: ADMIT Neon Viper (more CP) + already accumulating energy

  Zone State: POP 7/8 | 2 Prod, 2 Pred, 1 Symb
  Energy: +7 gen, -6 feed = +1 net
  Base CP: 5+4 = 9
  DS=1.4, CB~0.7
  ZCP: 9 * (0.5+1.4*0.7) * 1.15(pack bonus forming) = 9 * 1.48 * 1.15 = ~15.3

=== GATE 6 (2:30) ===
  Neon Moss reproduced! (RR 5 cycles reached) → Free Neon Moss copy
  Zone State: POP 8/8 (full!)
  Arrivals: [Quantum Garden (R), Chrome Raptor (U), Wire Tick (C)]
  Decision: REJECT ALL (at capacity, none worth it without expansion)

  Energy: +9 gen, -6 feed = +3 net
  ZCP: ~18 (growing from pack bonus + more producers)

  BUY: District Expansion Lv2 (50 credits) → Capacity 10
  Remaining Credits: ~0

--- WAVE 5 (2:40-3:20): 4 Drones, 2 Raiders (HP 55, Req ZCP 33) ---
  ZCP ~20 → Zone Damage = (33-20)*0.5 = 6.5
  Zone HP: 91 → 84.5
  Credits: +18

=== GATES 7-10 (3:00-4:30) ===
  Admit: Data Coral (storage!), Chrome Raptor (big CP), Neon Shaman (Catalyst)
  Circuit Fungus reproduced once more.

  Zone at wave 8: POP 13/13 (bought Lv3 expansion)
    Producers: 5 (POP 6) — Moss x3, Fungus x2, Coral x1
    Predators: 3 (POP 7) — Wolf, Viper, Raptor
    Symbionts: 1 (POP 1) — Glowfly
    Catalysts: 1 (POP 2) — Shaman
    Parasites: 0

  Energy: +18 gen, -13 feed = +5 net (Data Coral storing surplus)
  DS = 1.6 (4 roles), CB = ~0.82
  Base CP: 5+4+10 = 19, + pack bonus (+2*2=4) = 23
  ZCP: 23 * (0.5+1.6*0.82) * (1.0+0.15+0.10) = 23 * 1.812 * 1.25 = ~52

--- WAVE 7 (4:00-5:00): 4 Raiders, 2 Shielders (HP 92, Req ZCP 54) ---
  ZCP ~52 → Zone Damage = (54-52)*0.5 = 1.0
  Zone HP: 78.5 → 77.5 (close call!)
  Credits: +22 + 5 (near-perfect) = 27

=== BOSS WAVE 8 (5:00): WALLED CITY BREAKER ===
  Boss HP: 140, DPS: 18, Special: Quake (kills weakest each 2 cycles)

  Player's ZCP: ~55 → needs 4 cycles to kill (55 * 4 = 220 > 140)
  But Quake kills weakest creature (Glowfly, RES 2) on cycle 2!
  → Glowfly dies → Circuit Fungus loses +50% OR buff
  → Energy drops: +15 gen, -12 feed = +3 net
  → Shaman mutates Street Wolf: +2 CP → Wolf CP now 7+4(pack) = 11

  Quake cycle 4: kills a Neon Moss (RES 3)
  → Producers drop, energy tightens further

  After 4 cycles: Boss defeated! Zone HP: 77.5 - (18*4 - 55*4 partial offset)
  Actually: excess threat DPS dealt as zone damage only if ZCP < required
  Boss required 75 ZCP over fight duration. Player averages ~50 ZCP during fight.
  Zone Damage over boss: (75-50)*0.5 * 0.5(boss fight lasts ~2 cycles effective) = ~6
  Zone HP: 77.5 → 71.5
  Credits: +30 (boss kill) + 22 (wave) = +52

  AFTERMATH: 2 creatures died to Quake. EH dropped from 1.3 to 0.9.
  Player feels: "I barely survived. I need to rebuild."

=== GATES 11-16 (5:00-7:00) ===
  Recovery phase. Admit 4 more creatures including:
  - Quantum Entangler (Rare Symbiont) → links Raptor + Wolf for shared buffs
  - 2 more Neon Moss (rebuild producer base)
  - Chaos Moth (cheap Catalyst)

  Buy District Expansion Lv4 (200 credits) → Capacity 16

  Zone at wave 12: POP 16/16
    Producers: 6 | Predators: 3 | Symbionts: 2 | Catalysts: 2 | Parasites: 0

  Energy: +22 gen, -14 feed = +8 net (healthy surplus)
  DS = 1.6 (4 roles, no Parasites)
  CB = ~0.85
  Base CP: 32, synergies active (Pack, Garden, Hive Mind)
  ZCP: 32 * (0.5+1.6*0.85) * (1.0+0.15+0.10+0.20) = 32 * 1.86 * 1.45 = ~86

--- WAVE 12 (7:40): Mixed elite squad (HP 195, Req ZCP 115) ---
  ZCP ~95 → Zone Damage = (115-95)*0.5 = 10
  Zone HP: 65 → 55 (getting dangerous!)

=== GATES 17-20 (7:40-9:00) ===
  Critical decisions now. Admit high-power creatures:
  - Wire Tick (Parasite): risky, but activates "Controlled Burn" synergy with Viper
  - More Producers (Neon Moss reproduced twice more)

  Buy District Expansion Lv5 (350 credits) → Capacity 20

  Zone at wave 14: POP 19/20
    Producers: 8 | Predators: 4 | Symbionts: 2 | Catalysts: 2 | Parasites: 1
    (Neon Viper hunts Wire Tick → "Controlled Burn" synergy active!)

  Energy: +28 gen, -18 feed = +10 net
  DS = 1.8 (all 5 roles!)
  CB = ~0.88
  Base CP: 38
  Full Spectrum bonus active!
  ZCP: 38 * (0.5+1.8*0.88) * (1.0+0.15+0.10+0.20+0.25+0.30)
     = 38 * 2.084 * 2.00
     = ~158

  Hidden trait reveal: Wire Tick is actually "Generous" (+3 OR despite being Parasite)
  This is a surprise boon — energy surplus jumps to +13/cycle

=== BOSS WAVE 14 (9:00): THE PURIFIER ===
  Boss HP: 320, DPS: 40, Special: Cleanse + EMP

  Cleanse removes Wire Tick and both Catalysts → POP drops to 14/20
  EMP halves all OR for 2 cycles → Energy gen drops to 14, deficit emerges

  BUT: Data Coral has 15 stored energy → bridges the gap!
  ZCP during EMP: ~95 (halved without Catalyst buffs + EMP)
  ZCP after EMP (2 cycles): recovers to ~130
  Average ZCP over boss fight: ~110

  Required: 180 over 5 cycles. Deficit: ZCP 110*5=550 vs HP 320 → ACTUALLY KILLS BOSS
  (Wait: ZCP is damage per cycle. Boss HP 320 / avg ZCP 110 = ~3 cycles to kill)
  Zone damage during fight: DPS 40 * 3 cycles = 120 total threat.
  Zone defense absorbs ZCP worth: 110*3=330. Excess: 330-320=10 (barely positive)
  Zone Damage from boss DPS: 40*3 cycles, but offset by wall defense.
  Net zone damage: ~15 (the EMP cycles are brutal)
  Zone HP: 55 → 40

  BOSS DEFEATED. Credits: +50 + 36 (wave) = +86
  Player feels: "HOLY CRAP, I actually survived. Data Coral saved me."

--- WAVE 15 (9:40): Rejected Arrivals ---
  Vengeful faction of ~5 rejected creatures (HP 250, Req ZCP 150)

  Player ZCP after boss: ~140 (lost 3 creatures to Cleanse, recovering)
  Zone Damage: (150-140)*0.5 = 5
  Zone HP: 40 → 35

  SURVIVED. Final Zone HP: 35/100.

=== RUN COMPLETE ===
  Total Credits earned: ~420
  Warden Tokens earned: 4 (completed + wave 8 + wave 15 + first clear)
  Creatures admitted: 18
  Gates opened: 23
  Ecosystem peak EH: 1.6 (Flourishing)
  Close calls: 3 (waves 7, 12, boss 2)
```

### 6.2 Bad Player Run

```
STARTING STATE (same)

=== GATES 1-3 ===
  Admits: Street Wolf, Chrome Raptor, Neon Viper
  MISTAKE: All Predators, no Producers

  Energy Pool: 0 gen, -10 feed = DEFICIT
  Predators start starving by cycle 3
  Street Wolf goes Feral (attacks other zone creatures)

=== GATE 4 ===
  Admits: Neon Moss (too late — Wolf already killed it)

=== WAVE 3 ===
  ZCP: 12 (Predators are strong but starving, losing RES)
  Required: 16. Zone Damage: 2
  Zone HP: 98

=== GATE 5 ===
  Admits another Neon Moss. Predators immediately eat it (Feral).
  Player has no understanding of food chain.

=== WAVE 5 ===
  Chrome Raptor starved to death.
  Street Wolf Feral, killed Neon Viper.
  ZCP: 3 (only 1 dying wolf)
  Required: 33. Zone Damage: 15
  Zone HP: 83

=== WAVE 8 (Boss) ===
  Street Wolf dead. Zone empty.
  ZCP: 0. Boss deals full damage.
  Zone HP: 83 → 0 in 2 cycles.

  GAME OVER at minute 5.
  Total Credits: ~60
  Lesson learned: "I need Producers before Predators"
```

### 6.3 Key Differences Summary

| Metric                   | Good Player | Bad Player |
| ------------------------ | :---------: | :--------: |
| First creature admitted  |  Producer   |  Predator  |
| Energy surplus at min 3  |  +3/cycle   |  -8/cycle  |
| Creatures alive at min 5 |     13      |     1      |
| ZCP at wave 8            |     ~55     |     0      |
| Final wave reached       |     15      |     8      |
| Ecosystem Health peak    |     1.6     |    0.2     |
| Run duration             |    10:00    |    5:00    |

---

## 7. ANTI-DOMINANT STRATEGY

### 7.1 Why Monocultures Fail

#### "All Predators" (Apex Stack)

```
Admits: 8 Predators (POP 8/8)
Total CP: ~50 (impressive!)
Total FR: ~30/cycle
Total OR: 0/cycle

Result: Energy Pool depletes in 2 cycles.
  Cycle 3: weakest Predator starves.
  Cycle 5: all Predators starving, losing 1 RES/cycle.
  Cycle 8: half are dead.
  Cycle 12: total wipeout.

DS = 1.0 (single role) → EH multiplier is terrible
CB = 0.0 (100% predator, 0% producer) → EH collapses

ZCP after energy runs out: 50 * 0.5 * 0.0 = 0
Even with 50 base CP, the EH multiplier kills it.
```

#### "All Producers" (Energy Farm)

```
Admits: 8 Producers (POP ~10, some are POP 2)
Total OR: ~20/cycle (great!)
Total CP: 0
Total FR: ~3/cycle (minimal)

Result: Massive energy surplus. But ZCP = 0.
  - Every wave deals full damage to zone walls.
  - Zone HP drops ~5-15 per wave.
  - Dead by wave 6-7 guaranteed.
  - Additionally: high energy attracts more Parasites in arrival queue
    (hidden mechanic: energy surplus > 15 adds 1 Parasite to next gate)
```

#### "All Symbionts" (Buff Stack)

```
Admits: 8 Symbionts
Problem: Symbionts bond to OTHER creatures. With only Symbionts:
  - No bond targets → all go Dormant
  - Dormant: no effect, still consume FR
  - Zero CP, low OR, pure drain
  - DS = 1.0, CB = 0.0

Result: Zone collapses by wave 3.
```

#### "All Parasites" (Drain Stack)

```
Admits: 8 Parasites
Problem: Parasites need hosts. With only Parasites:
  - No hosts → all die within 2 cycles (Wire Tick: "dies if no host in 2 cycles")
  - Zone empties itself automatically

Result: Self-extinction by cycle 4.
```

#### "All Catalysts" (Chaos Stack)

```
Admits: 8 Catalysts
High POP cost (2-5 each), only ~3-4 fit
Moderate CP (~5 total), high FR (~12)
Mutations have nothing meaningful to buff
OR is low (~5)

Result: Slow energy bleed. ZCP too low to survive wave 4.
```

### 7.2 The Nash Equilibrium and How to Prevent "Solving"

**The Theoretical Optimum** (from Section 2.6):

- 40% Producers, 25% Predators, 15% Symbionts, 10% Catalysts, 5-10% Parasites
- This is the Golden Ratio that maximizes ZCP.

**Why the game cannot be "solved" by always pursuing this ratio:**

**Counter 1: Arrival Randomness**

The arrival queue is weighted by ecosystem state:

```
Arrival Pool Weighting:
  IF Producers > 50% of zone: +30% chance Parasites appear in queue
  IF Predators > 40% of zone: +20% chance Jammers in next threat wave
  IF EH > 1.4 (Flourishing):  +15% chance of negative hidden traits
  IF Zone has 0 Parasites:    +10% chance of Parasite-in-disguise hidden trait
```

The game actively pushes against the "perfect" composition.

**Counter 2: Threat Adaptation**

Starting from wave 6, threats analyze the zone composition and counter it:

| Zone Composition          | Threat Adaptation                                                    |
| ------------------------- | -------------------------------------------------------------------- |
| Heavy Producers           | Drones prioritize Producers; +1 Drone per wave                       |
| Heavy Predators           | Shielders appear more; reduce CP effectiveness by 30%                |
| No Parasites              | Jammers appear; disable Symbiont bonds                               |
| All 5 roles present       | "Disruptor" enemy type: randomly converts 1 zone creature to hostile |
| Reliance on one legendary | "Hunter" enemy targets highest-RES creature specifically             |

**Counter 3: Ecosystem Entropy**

Every 3 cycles, a small random event occurs:

```
Entropy Events (1 per 3 cycles, random):
  - "Neon Storm": 1 random creature loses 2 RES
  - "Resource Spike": All OR doubled for 1 cycle, then halved for 1 cycle
  - "Migration": 1 random creature changes role (Producer→Symbiont, etc.)
  - "Territorial Dispute": 2 Predators fight; loser loses 3 RES
  - "Mutation": 1 creature gains +2 to random stat, -2 to another
```

These prevent static "set it and forget it" strategies.

**Counter 4: The Rejected Army**

Rejected creatures form a hostile faction that attacks in wave 15. The more you reject, the stronger wave 15 becomes:

```
Rejected Army Strength:
  Base HP: 100 + (rejected_count * 15)
  Base DPS: 10 + (rejected_count * 3)

  If you reject 10 creatures: HP 250, DPS 40
  If you reject 15 creatures: HP 325, DPS 55
  If you reject 5 creatures:  HP 175, DPS 25
```

This means rejecting is costly. You can't just wait for "perfect" arrivals.

**Counter 5: Hidden Traits as Black Swans**

Even with Mastery Level 5 (80% trait visibility), 20% of hidden traits remain unknown. A single "Volatile" creature can wipe out a perfect ecosystem if placed next to critical creatures.

### 7.3 Designed Meta-Diversity

To ensure no single strategy dominates across runs, the game uses **zone modifiers** (randomly assigned each run):

| Zone Modifier       | Effect                               | Favored Strategy                      |
| ------------------- | ------------------------------------ | ------------------------------------- |
| Fertile Ground      | Producers get +2 OR                  | Producer-heavy                        |
| Hunting Season      | Predators get +3 CP                  | Predator-heavy                        |
| Symbiotic Resonance | All bonds give double buffs          | Symbiont-heavy                        |
| Parasite Paradise   | Parasites drain enemies too          | Parasite-risky                        |
| Chaos Theory        | Catalyst events happen 2x faster     | Catalyst-heavy                        |
| Barren Wastes       | All OR halved                        | Predator + Parasite (low energy meta) |
| Overcrowded         | Capacity +5 but EH penalties doubled | Quantity over quality                 |

Each run's modifier pushes toward a different optimal strategy, preventing a single "meta" from forming.

---

## 8. POWER CURVE

### 8.1 Target Power Trajectory

```
            ZCP ▲
            200 │                                          ★ Wave 14 Boss (180 req)
                │                                        ╱
            150 │                                      ╱
                │                                    ╱
            120 │                              ────╱  ← "Hockey Stick" inflection
                │                            ╱
            100 │                          ╱
                │                     ───╱
             75 │               ─── ╱  ★ Wave 8 Boss (75 req)
                │            ╱─╱
             50 │          ╱
                │       ╱╱
             30 │     ╱╱
                │   ╱╱
             10 │ ╱╱
                │╱
              0 └──────────────────────────────────────────→ Time
                0    1    2    3    4    5    6    7    8    9   10 min
```

### 8.2 Exact Numbers

| Minute |   ZCP   |   EH    |  Pop   | Energy Net | Feeling                                                        |
| :----: | :-----: | :-----: | :----: | :--------: | -------------------------------------------------------------- |
|   0    |    0    |   0.0   |   0    |     0      | "Empty zone. Need to start building."                          |
|   1    |    5    |   0.4   |   3    |     +2     | "Fragile ecosystem. One Producer, one Predator."               |
|   2    |   15    |   0.7   |   6    |     +3     | "Starting to come together. Energy is tight."                  |
|   3    |   25    |   0.9   |   8    |     +4     | "Ecosystem is stable! But threats are growing..."              |
|   4    |   40    |   1.1   |   10   |     +5     | "Things are clicking. Pack bonus just activated."              |
| **5**  | **55**  | **1.3** | **13** |   **+6**   | **"Boss incoming. Am I ready? EH is Thriving..."**             |
|   6    |   65    |   0.9   |   11   |     +3     | "Post-boss recovery. Lost 2 creatures to Quake. Rebuilding."   |
|   7    |   85    |   1.2   |   14   |     +7     | "HOCKEY STICK MOMENT. Full Spectrum bonus just activated!"     |
|   8    |   110   |   1.5   |   17   |     +9     | "Ecosystem is flourishing! Zone is glowing brilliantly."       |
| **9**  | **155** | **1.6** | **19** |  **+10**   | **"Final boss. Everything I've built is about to be tested."** |
|   10   |  140\*  |  1.2\*  |  15\*  |    +5\*    | "Post-Purifier. Battered but alive. Wave 15 incoming."         |

\*Post-boss values drop due to Cleanse removing creatures.

### 8.3 The "Hockey Stick" Moment (Minute 7)

The exponential growth inflection occurs at minute 7 because of **synergy stacking**:

```
Minute 6: ZCP = Base_CP(25) * EH_mult(1.4) * Synergy(1.25) = ~44
  (3 synergies active: Pack, Garden, Hive Mind)

Minute 7: ZCP = Base_CP(32) * EH_mult(1.7) * Synergy(1.75) = ~95
  (5 synergies active: Pack, Garden, Hive Mind, Controlled Burn, Full Spectrum)

Growth from min 6→7: +115% (!!!)
```

The "Full Spectrum" synergy (+0.30) requires all 5 roles present. This is the hardest synergy to achieve because Parasites are risky. When a player finally admits a Parasite to complete the set, the ZCP rockets upward. This is the **"zero to hero" moment** -- the ecosystem transforms from functional to spectacular.

### 8.4 Mapping to VS's "Zero to Hero" Arc

| VS Phase                   |   Time   | Neon Warden Equivalent                                     | Emotional Arc          |
| -------------------------- | :------: | ---------------------------------------------------------- | ---------------------- |
| **Helpless survivor**      | 0-3 min  | Empty zone, scrambling for first Producer                  | Vulnerability, urgency |
| **Building momentum**      | 3-5 min  | Ecosystem taking shape, energy surplus emerging            | Hope, strategy forming |
| **Danger zone (crossing)** | 5-6 min  | Boss 1 threatens everything; creatures die                 | Terror, near-death     |
| **Recovery + growth**      | 6-7 min  | Rebuilding, then HOCKEY STICK when Full Spectrum activates | Relief → exhilaration  |
| **Power fantasy**          | 7-9 min  | Flourishing ecosystem, zone glowing, threats evaporating   | Pride, ownership, awe  |
| **Final test**             | 9-10 min | Boss 2 strips away power; must survive on stored reserves  | Desperation → triumph  |

The key difference from VS: in VS, the player's avatar becomes godlike. In Neon Warden, the **ecosystem** becomes godlike -- the player watches their creation demolish threats. The pride comes from "I built this" rather than "I am powerful."

### 8.5 EH (Ecosystem Health) as the "Growth Feel"

In VS, growth is felt through weapon count, screen effects, and DPS numbers. In Neon Warden, growth is felt through **ambient visual density**:

```
EH 0.0-0.3:  Empty, dark zone. Occasional flicker.
EH 0.3-0.6:  Dim neon. A few creatures moving slowly.
EH 0.6-1.0:  Steady glow. Creatures visibly interacting. Energy flows visible.
EH 1.0-1.4:  Bright neon. Creatures reproducing. Structures forming. Pulsing light.
EH 1.4-1.8:  SPECTACULAR. Rainbow neon cascade. Dense population moving in patterns.
             Energy rivers flowing to reactor. Zone structures fully formed.
             The zone itself is the visual spectacle -- a living neon ecosystem.
```

This maps directly to VS's Engine 4 (Sensory Saturation): the zone's visual transformation IS the power fantasy, experienced not as screen-clearing explosions but as a living, breathing, self-sustaining world the player designed.

---

## Appendix A: Simulation Validation Checklist

| Check                        |             Target             | Good Run |      Bad Run      |
| ---------------------------- | :----------------------------: | :------: | :---------------: |
| Average run length           | 5-7 min (die) / 10 min (clear) |  10:00   |       5:00        |
| Boss 1 survival rate         |          ~40% of runs          | Survived |       Died        |
| Full clear rate              |          ~15% of runs          | Cleared  |        N/A        |
| Gate decisions per run       |             22-25              |    23    |         8         |
| Creatures admitted per run   |             15-20              |    18    |         4         |
| Close calls per run          |              2-4               |    3     | 0 (instant death) |
| Credits earned (avg)         |            150-250             |   420    |        60         |
| Meta-progression full unlock |           30-40 runs           |    --    |        --         |
| Time to learn food chain     |            2-3 runs            |  Run 1   |      Run 3+       |

## Appendix B: Synergy Reference Table

| Synergy Name     | Condition                             | ZCP Bonus |   Discovery Difficulty    |
| ---------------- | ------------------------------------- | :-------: | :-----------------------: |
| Pack Hunter      | 3+ Predators                          |   +15%    |       Easy (wave 3)       |
| Neon Garden      | 4+ Producers                          |   +10%    |       Easy (wave 4)       |
| Hive Mind        | 2+ bonded Symbionts                   |   +20%    |     Medium (wave 5-6)     |
| Controlled Burn  | 1 Parasite being hunted by 1 Predator |   +25%    |      Hard (wave 7+)       |
| Full Spectrum    | All 5 roles present                   |   +30%    |    Very Hard (wave 7+)    |
| Double Bond      | Quantum Entangler links 2 Predators   |   +20%    |   Rare creature needed    |
| Pandemic Control | Omega Virus + Chrome Raptor           |   +35%    |   Legendary + Uncommon    |
| Terraform Engine | Architect AI + 3 Producers            |   +25%    | Legendary creature needed |

> **Total synergies discoverable**: 8 base + 12 hidden (unlocked via meta-progression) = 20 synergies.
> This creates the "systemic surprise" (VS Engine 3) that drives replayability.

---

> **Design Note**: All numbers are first-pass estimates for prototyping. The actual balance will require iterative playtesting with these values as the starting point. The key relationships to preserve are: (1) Producers must precede Predators, (2) bosses must feel barely survivable, (3) the hockey stick at minute 7 must feel earned, (4) monocultures must fail visibly and quickly.
