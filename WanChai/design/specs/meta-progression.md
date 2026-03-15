# [SPEC-015] Meta Progression -- Permanent Upgrades

## Meta

- **Author**: Game Designer
- **Created**: 2026-02-25
- **Updated**: 2026-03-12
- **Status**: active (matches current implementation)
- **Priority**: P1

---

## Summary

The meta progression system provides **permanent upgrades between runs** using gold earned during gameplay. Players spend gold in the MetaScene to boost stats that persist across all future runs, creating a sense of growth even after failed runs.

---

## 1. Meta Currency: Gold

Gold is the sole meta currency. Earned during runs, spent between runs.

### 1.1 Gold Income Sources

| Source       | Gold   | Config Key                         |
| ------------ | ------ | ---------------------------------- |
| Normal kill  | 1      | `BALANCE.ECONOMY.goldPerKill`      |
| Elite kill   | 5      | `BALANCE.ECONOMY.goldPerElite`     |
| Boss kill    | 50     | `BALANCE.ECONOMY.goldPerBoss`      |
| Achievement  | 10-500 | `BALANCE.ACHIEVEMENTS.*Gold`       |
| Daily reward | 50-300 | `BALANCE.DAILY_REWARDS.streakGold` |

### 1.2 Gold Persistence

- Gold earned during a run is added to `meta.totalGold` at GameOver (win or lose)
- `meta.totalGoldEarned` tracks lifetime total (never decreases)
- Spending gold in MetaScene deducts from `meta.totalGold`

---

## 2. Permanent Upgrades

All upgrades are defined in `src/core/MetaProgression.ts` as `META_UPGRADES`.

### 2.1 Upgrade Table

| ID          | Name (KO)    | Effect            | Per Level | Max Lv | Cost Schedule           |
| ----------- | ------------ | ----------------- | --------- | ------ | ----------------------- |
| meta_damage | 기본 화력    | Damage multiplier | +10%      | 5      | 50, 100, 200, 400, 800  |
| meta_hp     | 기지 강화    | Base HP           | +15%      | 5      | 50, 100, 200, 400, 800  |
| meta_xp     | XP 부스터    | XP gain bonus     | +20%      | 3      | 100, 250, 600           |
| meta_crit   | 정밀 조준    | Crit chance       | +3%       | 5      | 60, 120, 250, 500, 1000 |
| meta_magnet | XP 흡수 범위 | XP magnet radius  | +20%      | 3      | 100, 200, 400           |
| meta_armor  | 기지 방어력  | Base armor        | +8%       | 5      | 80, 160, 250, 400, 600  |
| meta_luck   | 행운         | Rare weapon drop  | +5%       | 3      | 150, 300, 600           |

**Total upgrade slots**: 7
**Total max gold to fully upgrade all**: 50+100+200+400+800 + 50+100+200+400+800 + 100+250+600 + 60+120+250+500+1000 + 100+200+400 + 80+160+250+400+600 + 150+300+600 = **8,170 gold**

### 2.2 Effect Application

Effects are applied at run start via `getMetaBonus(meta, effect)`:

```
Player damage = baseDamage * (1 + getMetaBonus(meta, 'damage'))
Base HP       = 600 * (1 + getMetaBonus(meta, 'base_hp'))
XP gain       = baseXP * (1 + getMetaBonus(meta, 'xp_bonus'))
Crit chance   = baseCrit + getMetaBonus(meta, 'crit_chance')
XP magnet     = baseRadius * (1 + getMetaBonus(meta, 'xp_magnet'))
Base armor    = baseArmor * (1 + getMetaBonus(meta, 'meta_armor'))
Rare drop     = baseDrop + getMetaBonus(meta, 'rare_drop')
```

### 2.3 Purchase Logic

```typescript
canPurchase(meta, upgradeId):
  1. Check upgrade exists
  2. Check current level < maxLevel
  3. Check meta.totalGold >= costPerLevel[currentLevel]

purchaseUpgrade(meta, upgradeId):
  1. Validate canPurchase
  2. Return new MetaState with gold deducted and level incremented
  3. Immutable -- returns new object, does not mutate
```

---

## 3. Save Data Structure

### 3.1 MetaState (from `src/types/game.ts`)

```typescript
interface MetaState {
  totalGold: number; // spendable gold
  totalGoldEarned: number; // lifetime total
  highScore: number;
  bestKills: number;
  bestLevel: number;
  bestTimeMs: number;
  upgrades: Record<string, number>; // upgradeId -> level
  runsCompleted: number;
  discovered: {
    weapons: string[]; // discovered weapon IDs
    enemies: string[]; // discovered enemy IDs
  };
}
```

### 3.2 SaveData (from `src/managers/SaveManager.ts`)

```typescript
interface SaveData {
  version: number; // currently 1
  lastSaved: string; // ISO date
  meta: MetaState;
  settings: { bgmVolume; bgmMuted; sfxVolume; sfxMuted; vibration };
  tutorialCompleted: boolean;
}
```

Storage: `localStorage` with key `neonsurvivor_save`.

---

## 4. MetaScene UI

### 4.1 Layout

The MetaScene displays:

- **Header**: Title "Upgrade Lab" + gold display
- **Two tabs**: Upgrades | Achievements
- **Upgrade cards**: 7 cards in a scrollable grid
- **Back button**: Returns to MainMenuScene

### 4.2 Upgrade Card

Each card shows:

- Upgrade name (localized)
- Current level / max level
- Effect description
- Cost for next level (or "MAX" if maxed)
- Visual: progress bar showing level/maxLevel

### 4.3 Achievements Tab

Displays achievements from `src/core/Achievements.ts` with gold rewards, organized by category (combat, economy, progression, collection).

---

## 5. Progression Pacing

### 5.1 Estimated Gold Income Per Run

| Run Type        | Duration | Kills | Gold |
| --------------- | -------- | ----- | ---- |
| Early fail (S1) | 60s      | ~40   | ~45  |
| Mid run (S3)    | 3 min    | ~120  | ~170 |
| Full clear (S6) | 6 min    | ~300  | ~450 |

### 5.2 Upgrade Timeline

| Milestone           | Gold Needed | Est. Runs |
| ------------------- | ----------- | --------- |
| First upgrade (any) | 50          | 1-2       |
| All Lv1             | 590         | 5-8       |
| Half maxed          | ~4000       | 15-25     |
| Fully maxed         | 8,170       | 30-50     |

---

## 6. Related Systems

- **Weapon Mastery** (`src/core/MasteryCalc.ts`): Per-weapon XP progression, max level 10
- **Milestones** (`src/core/MilestoneCalc.ts`): Run/kill/stage milestones with prestige points
- **Daily Challenges** (`src/core/DailyChallengeCalc.ts`): 3 daily challenges with prestige rewards
- **Daily Rewards** (`BALANCE.DAILY_REWARDS`): 7-day streak gold bonus (50-300)
- **Achievements** (`src/core/Achievements.ts`): One-time gold rewards for combat/economy/progression/collection goals

---

## Change Log

| Date       | Version | Content                                                                                                                                                               |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-25 | v1.0    | Initial draft (puzzle-mode critter/hometown design)                                                                                                                   |
| 2026-03-12 | v2.0    | Complete rewrite to match auto-shooter implementation: gold-based 7 permanent upgrades, removed critter collection/hometown/world unlock/purification crystal systems |
