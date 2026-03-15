# [SPEC-021] Order Puzzle Combat

## Meta

- **Author**: Game Designer
- **Date**: 2026-02-27
- **Status**: draft
- **Priority**: P0
- **Estimated Effort**: XL
- **Supersedes**: SPEC-001~007 core combat loop (conveyor + matching + scoring)

## Summary

WanChai 전투 시스템을 "Order Puzzle Combat"으로 전면 개편한다.
핵심 변경: 보드 블럭(Cube)을 **Enemy**로 재정의하고, 모든 히어로가 모든 적에게 **기본 피해**를 줄 수 있되
동일 속성이면 **보너스 피해**, 유리 속성이면 **추가 보너스 피해**를 적용한다.
적들은 턴 타이머 기반으로 플레이어 HP를 공격하며, 플레이어는 히어로 배치 순서를 최적화해 적을 제거한다.

### Design Pillars

1. **Any Hero → Any Enemy**: 속성 불일치 = 0 피해 문제를 근본 해결
2. **Belt is King**: 순환 컨베이어 벨트가 전투의 핵심 — 위치별 방향 사격 유지
3. **Sequence Optimization**: 다열 히어로 큐에서 배치 순서 결정이 핵심 전략
4. **Enemy Threat**: 적 공격 타이머가 긴장감과 시간 압박 제공
5. **Bench as Skip**: 벤치 = "이 히어로를 나중에 쓰기 위한 전략적 보류"

### P&D와의 차별점

| 요소          | Puzzle & Dragons       | WanChai Order Puzzle                        |
| ------------- | ---------------------- | ------------------------------------------- |
| 핵심 메카닉   | 단일 턴 오브 매칭      | 멀티턴 배치 순서 최적화                     |
| 플레이어 조작 | 오브를 드래그해서 정렬 | 히어로 큐 선택 + 벨트 궤도                  |
| 공격 방향     | 방향 없음 (전체 적용)  | 벨트 위치 → 방향성 사격 (LOS)               |
| 전략 깊이     | 콤보 극대화 (단일 턴)  | 배치 순서 × 벨트 위치 × 벤치 관리 (다중 턴) |
| 벤치          | 없음                   | 전략적 보류 (제한된 슬롯)                   |

---

## Core Concept: Battle Flow

```
┌─────────────────────────────────────────────────┐
│                  BATTLE START                    │
│  Player HP: 100    Enemy Grid: 3×3~4×4         │
│  Hero Queue: 6~9 heroes (multi-column)          │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│              PLAYER PHASE (per deploy)           │
│                                                  │
│  1. Choose column → pop front hero               │
│     (or Skip → bench current hero)               │
│  2. Hero enters belt at seq=0                    │
│  3. Hero orbits belt:                            │
│     - At each position → fire at nearest         │
│       enemy in LOS (ANY element)                 │
│     - Damage = ATK × elementMultiplier           │
│     - AP-- per shot                              │
│  4. Hero exits when AP=0 or full loop            │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│              ENEMY PHASE (after each deploy)     │
│                                                  │
│  1. All enemy attack timers -= 1                 │
│  2. Enemies with timer = 0:                      │
│     → Attack player (playerHP -= enemyATK)       │
│     → Timer resets to original value             │
│  3. Check: playerHP ≤ 0? → GAME OVER            │
└─────────┬───────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│              WIN/LOSE CHECK                      │
│                                                  │
│  WIN:  All enemies defeated (grid empty)         │
│  LOSE: playerHP ≤ 0                             │
│  LOSE: No heroes left + bench empty              │
│        + enemies alive                           │
│  CONTINUE: More heroes available → PLAYER PHASE  │
└─────────────────────────────────────────────────┘
```

---

## Requirements

### Functional Requirements

#### FR-01: Enemy System

- [ ] FR-01a: Board cells contain **Enemy** instead of Cube
- [ ] FR-01b: Enemy has: `id`, `element`, `maxHp`, `currentHp`, `shield`, `atk`, `attackTimer`, `maxAttackTimer`, `tier` (1/2/3)
- [ ] FR-01c: Enemy is defeated when `currentHp ≤ 0`
- [ ] FR-01d: Defeated enemies leave empty cells (no gravity)
- [ ] FR-01e: Shield absorbs damage before HP: `shield > 0` → `shield -= damage`, overflow to HP

#### FR-02: Universal Targeting (핵심 변경)

- [ ] FR-02a: Heroes fire at the **nearest enemy in LOS** regardless of element
- [ ] FR-02b: LOS mechanics identical to current system (directional from belt edge, first enemy blocks)
- [ ] FR-02c: If no enemy in LOS → no shot at this position (hero advances, AP NOT consumed)
- [ ] FR-02d: Every belt position with an enemy in LOS results in an attack

#### FR-03: Damage Formula

- [ ] FR-03a: Base formula: `damage = heroATK × elementMultiplier`
- [ ] FR-03b: Element multipliers:
  - `neutral` (no relation): ×1.0
  - `same` (same element): ×1.5
  - `advantage` (fire→wind etc): ×2.0
  - `disadvantage` (wind→fire etc): ×0.75
- [ ] FR-03c: Hero ATK stat: derived from critter definition or base value
- [ ] FR-03d: Shield reduction: damage applied to shield first, remainder to HP
  - `shieldDmg = min(shield, damage)`
  - `hpDmg = damage - shieldDmg`

#### FR-04: Player HP System

- [ ] FR-04a: Global player HP pool per battle (not per-hero)
- [ ] FR-04b: Starting HP from RunState (roguelike) or level data (classic)
- [ ] FR-04c: HP displayed in UI (top area, HP bar)
- [ ] FR-04d: Player HP ≤ 0 → game over (reason: `'player_defeated'`)

#### FR-05: Enemy Counter-Attack

- [ ] FR-05a: Each enemy has `attackTimer` (starts at `maxAttackTimer`)
- [ ] FR-05b: After each hero deployment (orbit complete), ALL enemy timers decrement by 1
- [ ] FR-05c: Enemies with `timer ≤ 0` attack: `playerHP -= enemy.atk`
- [ ] FR-05d: After attacking, timer resets: `timer = maxAttackTimer`
- [ ] FR-05e: Attack timer displayed on enemy (countdown number)
- [ ] FR-05f: Multiple enemies can attack in the same phase (all with timer=0)

#### FR-06: Bench Rework

- [ ] FR-06a: Bench still serves as "waiting area" for heroes who complete a full loop
- [ ] FR-06b: New: in the universal targeting system, full loops are rare (heroes always have targets)
- [ ] FR-06c: Bench heroes can be redeployed on any subsequent turn
- [ ] FR-06d: Bench capacity: 3 slots (reduced from 5 — bench is less critical now)
- [ ] FR-06e: Bench overflow: hero is discarded (not game over — bench_full no longer fatal)

#### FR-07: Scoring Overhaul

- [ ] FR-07a: Per-kill score: `tierScore × elementMultiplier × (1 + slingCombo × 0.1)`
  - Tier 1: 100pts, Tier 2: 200pts, Tier 3: 500pts
- [ ] FR-07b: Overkill bonus: excess damage → bonus score (`overkill × 10`)
- [ ] FR-07c: Efficiency bonus: remaining HP percentage → bonus score
- [ ] FR-07d: Sling combo: unchanged (rapid deploy bonus, max 5)

#### FR-08: LOS Changes

- [ ] FR-08a: `findFrom*` methods return nearest enemy in LOS WITHOUT element filtering
- [ ] FR-08b: Return type: `{ enemy: Enemy, matchType: MatchType }` where matchType is computed but not used for filtering
- [ ] FR-08c: Remove gravity from combat (enemies are fixed positions)

### Non-Functional Requirements

- [ ] NFR-01: Pure TypeScript core (no Phaser) — maintain testability
- [ ] NFR-02: All balance constants in `balance.ts` — no magic numbers
- [ ] NFR-03: Backward-compatible level data schema (add `enemies` field alongside existing `grid`)
- [ ] NFR-04: Existing 410 tests: affected tests updated, total test count maintained or increased
- [ ] NFR-05: Deterministic combat resolution (seeded RNG for enemy timer variance)

---

## Detailed Design

### 1. Type Changes

#### `src/types/puzzle.ts` — Enemy replaces Cube

```typescript
/** Enemy on the board (replaces Cube) */
export interface Enemy {
  readonly id: string;
  readonly element: ElementColor;
  readonly tier: 1 | 2 | 3;
  row: number;
  col: number;
  maxHp: number;
  currentHp: number;
  shield: number; // absorbs damage before HP
  atk: number; // damage to player per attack
  attackTimer: number; // turns until next attack (decrements each deploy)
  maxAttackTimer: number; // reset value after attacking
  isDefeated: boolean;
}

/** Match type: now includes 'neutral' and 'disadvantage' */
// In ElementAdvantage.ts:
export type MatchType = 'same' | 'advantage' | 'neutral' | 'disadvantage';

/** Enemy defeat event (replaces CubeDestroyEvent) */
export interface EnemyDefeatEvent {
  readonly enemyId: string;
  readonly element: ElementColor;
  readonly tier: 1 | 2 | 3;
  readonly row: number;
  readonly col: number;
  readonly fromEdge: BeltEdge;
  readonly matchType: MatchType;
  readonly overkillDamage: number;
}

/** Enemy attack event (NEW) */
export interface EnemyAttackEvent {
  readonly enemyId: string;
  readonly damage: number;
  readonly playerHpAfter: number;
}

/** Updated DeployResult */
export interface DeployResult {
  readonly success: boolean;
  readonly gameOver: boolean;
  readonly levelComplete: boolean;
  readonly orbit: OrbitResult | null;
  readonly enemyAttacks: EnemyAttackEvent[]; // NEW: enemy counter-attacks
  readonly score: number;
  readonly stars: number;
  readonly heroBenched: boolean;
  readonly playerHp: number; // NEW: current player HP
  readonly gameOverReason?: 'no_heroes' | 'belt_full' | 'bench_full' | 'player_defeated';
}
```

#### `src/types/hero.ts` — Add ATK stat

```typescript
export interface HeroInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly element: ElementColor;
  ap: number;
  readonly maxAP: number;
  atk: number; // NEW: attack power
  readonly maxATK: number; // NEW: base attack power
  lanePosition: number;
  isSpent: boolean;
  readonly critterId?: string;
  readonly critterLevel?: number;
  readonly passives?: PassiveSkillId[];
}
```

### 2. Element Advantage Rework

```typescript
// ElementAdvantage.ts — Updated

export type MatchType = 'same' | 'advantage' | 'neutral' | 'disadvantage';

export function getMatchType(hero: ElementColor, enemy: ElementColor): MatchType {
  if (hero === enemy) return 'same';
  if (hasAdvantage(hero, enemy)) return 'advantage';
  if (hasAdvantage(enemy, hero)) return 'disadvantage';
  return 'neutral';
}

export function getElementMultiplier(matchType: MatchType): number {
  switch (matchType) {
    case 'advantage':
      return BALANCE.COMBAT.ADVANTAGE_MULT; // 2.0
    case 'same':
      return BALANCE.COMBAT.SAME_MULT; // 1.5
    case 'neutral':
      return BALANCE.COMBAT.NEUTRAL_MULT; // 1.0
    case 'disadvantage':
      return BALANCE.COMBAT.DISADVANTAGE_MULT; // 0.75
  }
}

// getDamageAmount REMOVED — replaced by getElementMultiplier
// getScoreMultiplier REMOVED — scoring now tier-based
```

### 3. Balance Constants

```typescript
// balance.ts — New COMBAT section

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
  },

  /** Player HP */
  PLAYER_BASE_HP: 100,

  /** Enemy stats by tier */
  ENEMY_TIER: {
    1: { hp: 20, shield: 0, atk: 8,  timer: 3 },
    2: { hp: 40, shield: 10, atk: 15, timer: 2 },
    3: { hp: 80, shield: 20, atk: 25, timer: 3 },  // boss-tier
  },

  /** Scoring */
  SCORE_PER_TIER: { 1: 100, 2: 200, 3: 500 },
  OVERKILL_SCORE_PER_HP: 10,
  EFFICIENCY_BONUS_MULT: 0.5,   // remaining HP% × base score

  /** Bench */
  BENCH_SLOTS: 3,   // reduced from 5
},
```

### 4. BoardState Changes

```
Current:  grid: (Cube | null)[][]
New:      grid: (Enemy | null)[][]
```

**Methods to modify:**
| Current | New | Change |
|---------|-----|--------|
| `findFromTop(col, element)` | `findFromTop(col)` | Remove element filter — return nearest enemy in LOS |
| `findFromBottom(col, element)` | `findFromBottom(col)` | Same |
| `findFromRight(row, element)` | `findFromRight(row)` | Same |
| `findFromLeft(row, element)` | `findFromLeft(row)` | Same |
| `damageCubeAmount(id, amt)` | `damageEnemy(id, amt)` | Shield-first damage, return `{ defeated, overkill }` |
| `damageCube(id)` | REMOVED | Replaced by damageEnemy |
| `healCube(id, amt)` | REMOVED | Enemies don't heal |
| `applyGravity()` | REMOVED | No gravity in enemy grid |
| `isEmpty()` | `allDefeated()` | Check all enemies defeated |
| `placeCube(...)` | REMOVED | No dynamic cube spawning |

**New methods:**

```typescript
/** Get enemies whose attack timer has reached 0 */
getReadyAttackers(): Enemy[]

/** Decrement all alive enemy timers by 1 */
tickEnemyTimers(): Enemy[]  // returns enemies that reached 0

/** Reset an enemy's timer after it attacks */
resetEnemyTimer(enemyId: string): void

/** Apply damage with shield absorption */
damageEnemy(enemyId: string, amount: number): { defeated: boolean; overkill: number }
```

### 5. TurnResolver Changes

**Core loop change:**

```
BEFORE (processPosition):
  1. findTarget(pos, hero.element)  ← element filter
  2. If no matching target → skip (no AP cost)
  3. If target → damage 1 or 2, AP--

AFTER (processPosition):
  1. findTarget(pos)                ← no element filter
  2. If no enemy in LOS → skip (no AP cost)
  3. If enemy → compute damage:
     matchType = getMatchType(hero.element, enemy.element)
     damage = Math.floor(hero.atk × getElementMultiplier(matchType))
     Apply to shield first, then HP
     AP--
```

**New: Enemy Phase after orbit**

```typescript
private executeEnemyPhase(): EnemyAttackEvent[] {
  const readyEnemies = this.board.tickEnemyTimers();
  const attacks: EnemyAttackEvent[] = [];

  for (const enemy of readyEnemies) {
    this.playerHp -= enemy.atk;
    this.board.resetEnemyTimer(enemy.id);
    attacks.push({
      enemyId: enemy.id,
      damage: enemy.atk,
      playerHpAfter: this.playerHp,
    });
  }

  if (this.playerHp <= 0) {
    this.playerHp = 0;
    this.isGameOver = true;
    // emit GAME_OVER with reason 'player_defeated'
  }

  return attacks;
}
```

**Updated deployHero flow:**

```
1. Pop hero from column
2. Place on belt
3. simulateOrbit (CHANGED: universal targeting)
4. Remove from belt
5. (no gravity)
6. Check win (all enemies defeated)
7. Execute enemy phase (NEW)
8. Check lose (player HP ≤ 0)
9. Bench logic
10. Return DeployResult with enemyAttacks + playerHp
```

### 6. Score Calculator Changes

```typescript
/** Score for defeating an enemy */
export function enemyDefeatScore(tier: 1 | 2 | 3, slingCombo: number, matchType: MatchType): number {
  const base = BALANCE.COMBAT.SCORE_PER_TIER[tier];
  const mult = getElementMultiplier(matchType);
  return Math.floor(base * mult * (1 + slingCombo * BALANCE.SLING_BONUS_PER_LEVEL));
}

/** Bonus score for overkill damage */
export function overkillBonus(overkillDamage: number): number {
  return overkillDamage * BALANCE.COMBAT.OVERKILL_SCORE_PER_HP;
}

/** Battle efficiency bonus (remaining player HP) */
export function efficiencyBonus(playerHp: number, maxPlayerHp: number, totalScore: number): number {
  const hpRatio = playerHp / maxPlayerHp;
  return Math.floor(totalScore * hpRatio * BALANCE.COMBAT.EFFICIENCY_BONUS_MULT);
}
```

---

## Attribute Hierarchy (수치 바이블 기준)

| 계층    | 속성                      | 설명                                     |
| ------- | ------------------------- | ---------------------------------------- |
| **1차** | Hero ATK                  | 히어로 공격력 — 매 사격의 기본 피해 결정 |
| **1차** | Hero AP                   | 사격 횟수 — 벨트 궤도 중 발사 가능 횟수  |
| **1차** | Hero Element              | 속성 배율 결정 — 1.0x~2.0x               |
| **1차** | Enemy HP                  | 적 내구도 — 제거에 필요한 총 피해량      |
| **1차** | Enemy ATK                 | 적 공격력 — 플레이어 HP에 직접 피해      |
| **2차** | Element Multiplier        | 속성 관계에 따른 피해 배율               |
| **2차** | Sling Combo               | 빠른 배치 보너스 (스코어 ×1.1~1.5)       |
| **2차** | Enemy Shield              | 피해 흡수 — HP 앞단 방어막               |
| **2차** | Attack Timer              | 적 공격 주기 — 플레이어 시간 압박        |
| **3차** | Star Thresholds           | 최종 등급 보정                           |
| **3차** | Overkill/Efficiency Bonus | 스코어 후보정                            |

### Panel Formula (패널 공식)

```
실제 피해 = heroATK × elementMultiplier
          = 기초값(ATK) × 계수(elementMult) + 보정값(0)

실제 스코어 = tierScore × elementMultiplier × slingMultiplier
           = 기초값(tierScore) × 계수(elementMult × slingMult) + 보정값(overkill)

난이도 지표 = Σ(enemyHP + shield) / Σ(heroATK × heroAP × avgElementMult)
```

### Counter-Attribute Pairs (대항 속성)

| 플레이어 속성 | 적 대항 속성      | 균형                                                  |
| ------------- | ----------------- | ----------------------------------------------------- |
| Hero ATK      | Enemy HP + Shield | ATK↑ = 빠른 제거 ↔ HP↑ = 긴 전투                      |
| Hero AP       | Enemy Count       | AP↑ = 더 많은 사격 ↔ 적 수↑ = 더 많은 타겟            |
| Element Match | Element Diversity | 유리 속성↑ = 보너스 ↔ 다양한 속성 = 매칭 어려움       |
| Deploy Speed  | Attack Timer      | 빠른 배치 = 적 공격 전 제거 ↔ 짧은 타이머 = 시간 압박 |
| Player HP     | Enemy ATK         | HP↑ = 생존 ↔ ATK↑ = 높은 피해                         |

---

## Battle Example (3×3 Grid)

```
Enemy Grid:         Hero Queue (3 columns):
[W:20] [F:20] [E:20]   Fire(ATK10,AP4) | Water(ATK10,AP3) | Wind(ATK15,AP3)
[D:40] [L:40] [W:20]   Fire(ATK10,AP4) | Earth(ATK10,AP3) |
[E:20] [W:20] [F:30]

W=Water(T1), F=Fire(T1), E=Earth(T1), D=Dark(T2), L=Light(T2), F:30=Fire(shield:10)

Belt positions (3×3 board = 12 positions):
TOP:    col0, col1, col2  (fire DOWN)
RIGHT:  row2, row1, row0  (fire LEFT)
BOTTOM: col2, col1, col0  (fire UP)
LEFT:   row0, row1, row2  (fire RIGHT)
```

**Turn 1: Deploy Fire hero (ATK=10, AP=4)**

```
Pos 0 (top, col0) → LOS DOWN → nearest: [W:20] at row2
  matchType: neutral (fire vs water → water beats fire → disadvantage!)
  damage = 10 × 0.75 = 7  → W:20 → W:13
  AP: 4→3

Pos 1 (top, col1) → LOS DOWN → nearest: [F:20] at row2
  matchType: same (fire vs fire)
  damage = 10 × 1.5 = 15  → F:20 → F:5
  AP: 3→2

Pos 2 (top, col2) → LOS DOWN → nearest: [E:20] at row2
  matchType: advantage (fire → wind... wait, fire vs earth = neutral)
  damage = 10 × 1.0 = 10  → E:20 → E:10
  AP: 2→1

Pos 3 (right, row2) → LOS LEFT → nearest: [E:10] at col2
  damage = 10 × 1.0 = 10  → E:10 → E:0 → DEFEATED!
  AP: 1→0 → Hero exits

Enemy Phase: all timers -= 1
  [W:13] timer: 3→2
  [F:5]  timer: 3→2
  [D:40] timer: 2→1
  [L:40] timer: 2→1
  [W:20] timer: 3→2
  [F:30] timer: 3→2
  (no attacks yet)
```

**Turn 2: Deploy Wind hero (ATK=15, AP=3)**

```
Pos 0 (top, col0) → [W:13] → advantage (wind→earth? No, wind vs water = neutral)
  Actually: wind vs water = neutral → damage = 15 × 1.0 = 15 → W:13 → W:0 → DEFEATED! (overkill 2)
  AP: 3→2

Pos 1 (top, col1) → [F:5] → advantage! (wind vs fire → fire beats wind → disadvantage)
  Wait: wind is beaten by fire? No. Cycle: Fire→Wind→Earth→Water→Fire
  Fire has advantage over Wind. So Wind attacking Fire = disadvantage.
  damage = 15 × 0.75 = 11 → F:5 → F:0 → DEFEATED! (overkill 6)
  AP: 2→1

Pos 2 (top, col2) → [E:20 defeated, skip] → no target in col2 row2
  Actually: row2 col2 was Earth that was defeated Turn 1.
  LOS goes through: row2(empty) → row1(W:20) → hit!
  wind vs water = neutral → damage = 15 × 1.0 = 15 → W:20 → W:5
  AP: 1→0 → Hero exits

Enemy Phase: timers -= 1
  [D:40] timer: 1→0 → ATTACKS! playerHP: 100 - 15 = 85, timer resets to 2
  [L:40] timer: 1→0 → ATTACKS! playerHP: 85 - 15 = 70, timer resets to 2
  [W:5]  timer: 2→1
  [F:30] timer: 2→1
```

이 예시가 보여주는 것:

- **모든 히어로가 공격 가능** — 빈 발사(miss) 없음
- **속성 매칭이 전략적 보너스** — 필수가 아닌 선택적 최적화
- **적 공격 타이머** — 시간 압박, T2 적 우선 처리 필요
- **LOS 관통** — 적 제거 시 뒤의 적이 노출 (전략적 순서)

---

## Level Data Changes

### Current Schema (LevelData.board)

```typescript
board: {
  rows: number;
  cols: number;
  grid: (ElementColor | null)[][];      // element-only
  armored?: { row, col, hp }[];
  sizes?: { row, col, size }[];
}
```

### New Schema (LevelData.enemies)

```typescript
enemies: {
  rows: number;
  cols: number;
  grid: (EnemyDef | null)[][];
}

interface EnemyDef {
  element: ElementColor;
  tier: 1 | 2 | 3;
  hpOverride?: number;      // override default tier HP
  shieldOverride?: number;
  atkOverride?: number;
  timerOverride?: number;
}
```

### Migration

- 기존 `board.grid` 데이터를 `enemies.grid`로 변환
- 각 element → `{ element, tier: 1 }` (기본 T1 적)
- `armored` entries → `tier: 2` 또는 `shieldOverride`
- 기존 10개 레벨은 자동 마이그레이션 스크립트로 변환

---

## Test Criteria

### Core Mechanics

- [ ] TC-01: Hero fires at ANY enemy in LOS (element 무관)
- [ ] TC-02: Damage = ATK × elementMultiplier (same=1.5, advantage=2.0, neutral=1.0, disadvantage=0.75)
- [ ] TC-03: Shield absorbs damage before HP
- [ ] TC-04: Enemy defeated when currentHp ≤ 0
- [ ] TC-05: Overkill damage recorded correctly

### Enemy Counter-Attack

- [ ] TC-06: Enemy timers decrement by 1 after each hero deployment
- [ ] TC-07: Enemy attacks when timer reaches 0 → playerHP decreases
- [ ] TC-08: Enemy timer resets to maxAttackTimer after attack
- [ ] TC-09: Multiple enemies can attack in same phase
- [ ] TC-10: Player defeated when HP ≤ 0

### LOS & Targeting

- [ ] TC-11: findFromTop returns nearest enemy regardless of element
- [ ] TC-12: Defeated enemy no longer blocks LOS (expose enemy behind)
- [ ] TC-13: Empty column/row = no target (no AP consumed)
- [ ] TC-14: All 4 directions work correctly (top/bottom/left/right)

### Scoring

- [ ] TC-15: enemyDefeatScore = tierBase × elementMult × slingMult
- [ ] TC-16: Overkill bonus = excess damage × OVERKILL_SCORE_PER_HP
- [ ] TC-17: Efficiency bonus based on remaining playerHP ratio

### Integration

- [ ] TC-18: Full battle simulation: deploy → orbit → enemy phase → repeat
- [ ] TC-19: Win condition: all enemies defeated
- [ ] TC-20: Lose condition: player HP ≤ 0
- [ ] TC-21: Lose condition: no heroes remaining
- [ ] TC-22: Sling combo still works with new damage system
- [ ] TC-23: Bench logic with universal targeting (full loops are rare)
- [ ] TC-24: Plugin hooks compatible with Enemy (adapted from Cube)

---

## Balance Parameters

| Parameter                 | Current           | Proposed | Rationale                          |
| ------------------------- | ----------------- | -------- | ---------------------------------- |
| Hero ATK (common)         | N/A (fixed 1 dmg) | 10       | 20HP 적 2턴 제거 가능              |
| Hero ATK (uncommon)       | N/A               | 15       | 20HP 적 1.5턴, 40HP 적 3턴         |
| Hero ATK (rare)           | N/A               | 20       | T1 1턴 제거, T2 2턴                |
| Element Same mult         | 1.0 (damage)      | 1.5      | 매칭 보상, 미매칭 패널티 아님      |
| Element Advantage mult    | 2.0 (damage)      | 2.0      | 유리 속성 = 2배 (P&D와 유사)       |
| Element Disadvantage mult | N/A (no shot)     | 0.75     | 불리해도 공격 가능                 |
| Element Neutral mult      | N/A (no shot)     | 1.0      | 기본 피해 보장                     |
| Enemy T1 HP               | 1 (cube)          | 20       | ATK10 히어로 2회 타격 제거         |
| Enemy T1 Shield           | 0                 | 0        | T1은 순수 HP만                     |
| Enemy T1 ATK              | N/A               | 8        | 12.5턴 생존 (100/8)                |
| Enemy T1 Timer            | N/A               | 3        | 3턴 여유                           |
| Enemy T2 HP               | 2 (armored)       | 40       | ATK10 히어로 4회 또는 ATK15 3회    |
| Enemy T2 Shield           | 0                 | 10       | 첫 1회 피해 감소                   |
| Enemy T2 ATK              | N/A               | 15       | 6.6턴 생존                         |
| Enemy T2 Timer            | N/A               | 2        | 2턴, 더 위협적                     |
| Enemy T3 HP               | N/A               | 80       | 보스급, 4-6턴 소요                 |
| Enemy T3 Shield           | N/A               | 20       | 초반 피해 감소                     |
| Enemy T3 ATK              | N/A               | 25       | 4턴 생존                           |
| Enemy T3 Timer            | N/A               | 3        | 보스는 느리지만 강력               |
| Player HP                 | N/A               | 100      | T1 12.5회, T2 6.6회, T3 4회 버팀   |
| Bench Slots               | 5                 | 3        | 보편적 타겟팅으로 벤치 필요성 감소 |
| Sling combo               | 0-5 (10%/lv)      | 유지     | 기존 시스템 그대로                 |

### Difficulty Curve (S-Curve)

| Floor       | Enemy Composition | Expected Turns | Player HP Loss |
| ----------- | ----------------- | -------------- | -------------- |
| F1 (easy)   | 6×T1, 3×T2        | 6-8            | 20-30%         |
| F2 (normal) | 4×T1, 4×T2, 1×T3  | 8-10           | 40-50%         |
| F3 (hard)   | 2×T1, 4×T2, 3×T3  | 10-12          | 60-70%         |
| Boss        | 1×T3(boss) + 4×T2 | 8-10           | 50-70%         |

### KPI Targets (수치 바이블 §7)

```
1. 클리어율: F1 90%, F2 60%, F3 30%, Boss 40%
2. 평균 잔여 HP: F1 70%, F2 50%, F3 30%, Boss 35%
3. AP 사용률: 80-95% (거의 모든 AP가 적에게 피해)
4. 속성 매칭률: 30-40% (random party vs random enemies)
5. 빈 발사율: 5-10% (대폭 감소 — 보편적 타겟팅)
```

---

## Implementation Phases

### Phase A: Core Type + BoardState (기반)

1. `Enemy` type 정의 (puzzle.ts)
2. `HeroInstance.atk/maxATK` 추가
3. `BoardState` → `EnemyBoard` 리팩토링
4. `findFrom*` element 필터 제거
5. `damageEnemy()` 쉴드 로직 추가
6. `tickEnemyTimers()`, `getReadyAttackers()` 추가
7. 테스트: TC-01~05, TC-11~14

### Phase B: ElementAdvantage + Damage Formula (전투)

1. `MatchType` 확장 ('neutral', 'disadvantage')
2. `getElementMultiplier()` 추가
3. `getDamageAmount()` 제거 → `getElementMultiplier()` 사용
4. ScoreCalculator 리팩토링
5. 테스트: TC-02, TC-15~17

### Phase C: TurnResolver Overhaul (핵심)

1. `processPosition()` → 보편적 타겟팅 + ATK 기반 피해
2. `executeEnemyPhase()` 신규 추가
3. `deployHero()` 플로우 업데이트
4. `playerHp` 트래킹 + game over 조건
5. gravity 제거
6. DeployResult 업데이트
7. 테스트: TC-06~10, TC-18~24

### Phase D: Balance + Level Data (데이터)

1. `balance.ts` COMBAT 섹션 추가
2. `LevelData` 스키마 업데이트
3. 기존 10개 레벨 마이그레이션
4. roguelike-balance.ts 업데이트 (EnemyPlacer 연동)

### Phase E: Plugin Adaptation (호환)

1. `CombatPlugin` 인터페이스 Cube→Enemy 업데이트
2. PassiveResolver, ModifierResolver, RelicResolver 적응
3. 기존 15개 렐릭 호환성 확인

### Phase F: Scene + UI (렌더링)

1. PuzzleScene: Enemy 렌더링 (HP bar, shield, timer)
2. PuzzleUIScene: Player HP bar, enemy attack animations
3. VFXManager: shield break, enemy attack, element match effects

---

## Open Questions

- [ ] Q1: 히어로 HP도 필요한가? (현재 설계: 글로벌 HP만) — 개별 히어로 HP 추가 시 전략 깊이↑ 복잡도↑
- [ ] Q2: 적 특수 능력 (독, 속성 변환, 분열 등) — Phase 2에서 추가? 기존 blight 시스템 재활용?
- [ ] Q3: 보스 메카닉 — 다페이즈? 광역 공격? 특수 패턴?
- [ ] Q4: Roguelike 상점에서 "히어로 ATK 업그레이드" 아이템 추가?
- [ ] Q5: 기존 Classic 모드(StageSelect) 유지? or 로그라이크 전용으로 전환?
