# TASK-008: RunScene God Object 리팩토링 설계 문서

> **작성일**: 2026-03-02
> **작성자**: game-designer (WanChai)
> **대상 파일**: `src/scenes/RunScene.ts` (1953줄, ~70개 인스턴스 변수)
> **목적**: 유지보수성, 테스트 가능성, 확장성 확보를 위한 서브시스템 분리

---

## 1. 현재 상태 분석

### 1.1 문제 요약

RunScene.ts는 **1953줄, 약 70개 인스턴스 변수**를 가진 God Object로, 게임 내 모든 런타임 로직을 단일 클래스에서 처리한다.

| 문제                                | 영향                                            |
| ----------------------------------- | ----------------------------------------------- |
| 단일 파일 1953줄                    | 코드 탐색/이해 비용 급증, 리뷰 불가             |
| ~70개 인스턴스 변수                 | 상태 간 암묵적 의존성, 초기화 순서 버그 (M-015) |
| Phase 상태머신이 메서드 곳곳에 분산 | 보스+레벨업 동시 발생 소프트락 (M-014)          |
| 서브시스템 간 경계 없음             | 한 영역 수정이 다른 영역에 예상치 못한 영향     |
| 테스트 불가능                       | Phaser Scene 없이 개별 로직 유닛 테스트 불가    |

### 1.2 인스턴스 변수 분류 (70개)

#### A. 시스템 참조 (7개)

```
weaponSystem, waveDirector, xpTable, vfx, dmgNumbers, ariaMsg, collisionHash
```

#### B. 게임 오브젝트 (6개)

```
player, enemyGroup, projectileGroup, enemyProjectiles[], bgSprite, baseWallGraphics
```

#### C. 캐시/풀 (2개)

```
activeEnemies[], activeEnemyCount
```

#### D. 런 상태 (13개)

```
phase, runState, weapons[], spawnEnded, passiveCounts,
targetPoint, targetReticle, targetClearEvent,
baseArmorMultiplier, shopArmorMultiplier,
gameSpeed, speedIndex, speedText
```

#### E. HUD 요소 (13개)

```
baseBar, xpBar, killText, timerText, levelText, fpsText,
goldText, stageText, bossHpBar, bossNameText,
statsText, enemyHpBarsGfx, fpsUpdateTimer
```

#### F. HUD 더티 캐시 (10개)

```
prevBaseHpPct, prevXpPct, prevKills, prevLevel, prevTimerStr,
prevBossHpPct, prevGold, prevStage, prevWeaponSlotStr, prevStatsStr
```

#### G. 레벨업 UI (5개)

```
upgradeContainer, autoSelectBarBg, autoSelectBarFill,
autoSelectStartReal, autoSelectBestChoice
```

#### H. 상점 UI (6개)

```
midShopShown, shopContainer, shopAutoBarBg, shopAutoBarFill,
shopAutoStartReal, shopAutoBestAction
```

#### I. 스테이지 관리 (9개)

```
pendingStageClear, stageClearContainer, prevStage,
stageHpMult, stageSpeedMult, stageDamageMult,
bossStageActive, bossSpawnedThisStage, activeBoss
```

#### J. ARIA 메시지 (3개)

```
ariaBossShown, ariaBossWarningShown, ariaLowHpShown
```

#### K. 메타 프로그레션 (3개)

```
metaXpBonus, metaDamageBase, metaCritBase
```

#### L. 무기 슬롯 HUD (3개)

```
weaponSlotBgs[], weaponSlotTexts[], prevWeaponSlotStr
```

#### M. 동료 시스템 (4개)

```
allyLeftSprite, allyRightSprite, allySniperCooldown, allySpreadCooldown
```

#### N. 기타 (3개)

```
pauseOverlay, sfxThrottles, BG_MAP(static)
```

### 1.3 책임 영역 분류 (메서드 기준)

| 영역                   | 메서드                                                                                                           | 줄 수 (추정) |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------ |
| **초기화**             | `create()`                                                                                                       | ~170         |
| **메인 루프**          | `update()`                                                                                                       | ~180         |
| **스폰**               | `spawnEnemies()`                                                                                                 | ~20          |
| **충돌**               | `resolveCollisions()`, `onProjectileHitEnemy()`                                                                  | ~50          |
| **적 이동/공격**       | Phase 4 in `update()`, `onEnemyReachedBase()`, `applyBaseDamage()`                                               | ~80          |
| **적 투사체**          | `spawnEnemyProjectile()`, `updateEnemyProjectiles()`                                                             | ~45          |
| **적 사망**            | `onEnemyDeath()` (스플리터 포함)                                                                                 | ~80          |
| **HUD**                | `createHUD()`, `updateHUD()`                                                                                     | ~300         |
| **레벨업 UI**          | `showLevelUpUI()`, `createUpgradeCards()`, `scoreBestChoice()`, `applyUpgrade()`, `applyPassiveEffect()`         | ~180         |
| **상점 UI**            | `showMidRunShop()`, `scoreBestShopChoice()`, `applyShopChoice()`, `closeShop()`                                  | ~180         |
| **스테이지 전환**      | `showStageClear()`, `nextStage()`                                                                                | ~140         |
| **동료**               | `createAllies()`, `updateAllies()`, `findNearestEnemyFrom()`, `findNearestEnemiesFrom()`, `fireAllyProjectile()` | ~95          |
| **입력**               | `onPointerDown()`, `drawTargetReticle()`                                                                         | ~25          |
| **게임 속도/일시정지** | `cycleSpeed()`, `togglePause()`                                                                                  | ~20          |
| **ARIA**               | `checkARIATriggers()`                                                                                            | ~12          |
| **게임 오버**          | `onRunComplete()`                                                                                                | ~40          |
| **배경/그리드**        | `drawGrid()`, `updateBackground()`                                                                               | ~40          |
| **기지 벽**            | `drawBaseWall()`, `flashBaseWall()`, `applyBaseRegen()`                                                          | ~30          |
| **유틸**               | `findNearestEnemyCached()`, `playSfx()`, `shutdown()`                                                            | ~30          |

### 1.4 update() 루프 Phase 흐름

```
update(time, delta)
├── Phase 0: 레벨업/상점 자동선택 바 애니메이션 (playing이 아닌 phase에서)
├── if (phase !== 'playing') return
├── Phase 1: activeEnemies 리빌드 + SpatialHash 삽입
├── Phase 2: 플레이어 조준
├── Phase 3: 스폰 (보스 or 웨이브)
├── Phase 3b: 중간 상점 트리거
├── Phase 4: 적 이동 + 공격 + 기지 도달
├── Phase 4b: 적 투사체 업데이트
├── Phase 5: 무기 자동 발사
├── Phase 5b: 동료 자동 발사
├── Phase 6: 충돌 감지 (SpatialHash)
├── Phase 8: VFX 파티클 업데이트
├── Phase 9: 기지 자연 회복
├── Phase 10: HUD 업데이트
├── Phase 10b: ARIA 메시지
└── Phase 11: 승리 판정
```

---

## 2. 제안 서브시스템 구조

### 2.1 아키텍처 개요

```
RunScene (오케스트레이터)
├── SpawnManager         — 웨이브/보스 스폰 로직
├── CollisionManager     — SpatialHash, 충돌 감지 + 콜백 실행
├── HUDManager           — 모든 HUD 요소 생성/업데이트
├── LevelUpManager       — 레벨업 UI + 자동선택 + 패시브 적용
├── StageManager         — 스테이지 전환, 보스 클리어, 난이도 배율
├── ShopManager          — 중간 상점 UI + 자동선택
└── AllyManager          — 동료 생성, 쿨다운, 발사
```

### 2.2 공유 상태: RunContext

각 매니저가 RunScene의 상태에 접근해야 하므로, **읽기/쓰기 가능한 공유 컨텍스트 인터페이스**를 정의한다.

```typescript
// src/types/run-context.ts

import type { RunState, GamePhase } from './game';
import type { WeaponInstance } from './weapon';
import type { Player } from '../objects/Player';
import type { Enemy } from '../objects/Enemy';

/** RunScene의 서브시스템이 공유하는 런타임 컨텍스트 */
export interface RunContext {
  // === 읽기/쓰기 상태 ===
  readonly scene: Phaser.Scene;
  runState: RunState;
  phase: GamePhase;
  weapons: WeaponInstance[];
  passiveCounts: Map<string, number>;

  // === 게임 오브젝트 참조 (읽기 전용) ===
  readonly player: Player;
  readonly enemyGroup: Phaser.Physics.Arcade.Group;
  readonly projectileGroup: Phaser.Physics.Arcade.Group;

  // === 캐시 (프레임 단위 리빌드) ===
  activeEnemies: Enemy[];
  activeEnemyCount: number;
  activeBoss: Enemy | null;

  // === 파생 상태 ===
  gameSpeed: number;
  baseArmorMultiplier: number;
  shopArmorMultiplier: number;
  stageHpMult: number;
  stageSpeedMult: number;
  stageDamageMult: number;

  // === 메타 프로그레션 기본값 ===
  readonly metaDamageBase: number;
  readonly metaCritBase: number;
  readonly metaXpBonus: number;

  // === 이벤트 브릿지 (매니저 → RunScene 콜백) ===
  readonly targetPoint: { x: number; y: number } | null;
}
```

### 2.3 매니저 기본 인터페이스

```typescript
// src/managers/BaseRunManager.ts

export interface RunManager {
  /** RunScene.create() 시 호출 — Phaser 오브젝트 생성 */
  create(ctx: RunContext): void;

  /** RunScene.update() 시 호출 — 프레임 단위 업데이트 */
  update(ctx: RunContext, delta: number): void;

  /** 스테이지 전환 시 상태 초기화 */
  resetForStage?(ctx: RunContext): void;

  /** 씬 종료/재시작 시 정리 */
  shutdown(): void;
}
```

---

## 3. 서브시스템 상세 설계

### 3.1 SpawnManager

**책임**: 웨이브 스폰, 보스 스폰, 적 풀 관리

**이관 변수** (6개):

```
spawnEnded, bossStageActive, bossSpawnedThisStage, waveDirector
```

> `waveDirector`는 SpawnManager 내부에서 소유

**이관 메서드** (1개):

```
spawnEnemies(defId, count, elite)
```

**인터페이스**:

```typescript
// src/managers/SpawnManager.ts

export class SpawnManager implements RunManager {
  private waveDirector!: WaveDirector;
  private spawnEnded = false;
  private bossStageActive = false;
  private bossSpawnedThisStage = false;

  create(ctx: RunContext): void {
    /* WaveDirector 초기화 */
  }

  update(ctx: RunContext, scaledDelta: number): void {
    /* Phase 3 로직: 보스 스폰 or 웨이브 스폰 */
  }

  /** 스테이지 전환 시 호출 */
  resetForStage(ctx: RunContext): void {
    /* spawnEnded=false, bossSpawnedThisStage=false, enemyPool 교체 */
  }

  /** 스폰 타이머 종료 여부 (Phase 11 승리 판정에 필요) */
  get isSpawnEnded(): boolean {
    return this.spawnEnded;
  }

  /** 현재 보스 스테이지인지 */
  get isBossStage(): boolean {
    return this.bossStageActive;
  }

  /** WaveDirector의 경과 시간 (외부 참조용) */
  getElapsedMinutes(): number {
    return this.waveDirector.getElapsedMinutes();
  }

  shutdown(): void {
    /* cleanup */
  }
}
```

**RunScene과의 통신**:

- SpawnManager는 `ctx.enemyGroup`에 직접 `.get()` 호출하여 적을 스폰
- ARIA 메시지, 오디오 전환은 **콜백**으로 RunScene에 위임:
  ```typescript
  interface SpawnCallbacks {
    onBossSpawn: () => void; // ARIA + 사운드 + VFX
    onStageAudioSwitch: (track: string) => void;
  }
  ```

### 3.2 CollisionManager

**책임**: SpatialHash 관리, 투사체-적 충돌 감지, 적 투사체-기지 충돌

**이관 변수** (3개):

```
collisionHash, enemyProjectiles[], COLLISION_RADIUS/COLLISION_RADIUS_SQ (상수)
```

**이관 메서드** (4개):

```
resolveCollisions()
onProjectileHitEnemy(proj, enemy)
spawnEnemyProjectile(enemy)
updateEnemyProjectiles(delta)
```

**인터페이스**:

```typescript
// src/managers/CollisionManager.ts

export interface CollisionCallbacks {
  onProjectileHit: (proj: Projectile, enemy: Enemy) => void;
  onEnemyDeath: (enemy: Enemy) => void;
  onBaseDamage: (damage: number, x: number) => void;
}

export class CollisionManager implements RunManager {
  private collisionHash!: SpatialHash;
  private enemyProjectiles: EnemyProjectile[] = [];

  create(ctx: RunContext): void {
    /* SpatialHash 초기화 */
  }

  /** Phase 1: 프레임 시작 시 SpatialHash 리빌드 */
  rebuildSpatialHash(ctx: RunContext): void {
    /* ... */
  }

  /** Phase 4b: 적 투사체 이동 + 기지 충돌 */
  updateEnemyProjectiles(ctx: RunContext, scaledDelta: number): void {
    /* ... */
  }

  /** Phase 6: 아군 투사체-적 충돌 */
  resolveProjectileCollisions(ctx: RunContext): void {
    /* ... */
  }

  /** 적이 투사체 발사 (적 이동 로직에서 호출) */
  spawnEnemyProjectile(ctx: RunContext, enemy: Enemy): void {
    /* ... */
  }

  /** 스테이지 전환 시 모든 투사체 정리 */
  resetForStage(): void {
    /* ... */
  }

  shutdown(): void {
    /* sprite.destroy() */
  }
}
```

**RunScene과의 통신**:

- 충돌 결과는 **콜백 패턴**으로 전달 (`CollisionCallbacks`)
- VFX, 데미지 넘버, SFX는 콜백을 통해 RunScene이 중개
- 기지 피해는 `onBaseDamage(damage, x)` 콜백으로 올림 — RunScene이 `runState.baseHp` 갱신

### 3.3 HUDManager

**책임**: 모든 HUD 요소 생성, 더티 플래그 기반 업데이트, 적 오버헤드 HP 바

**이관 변수** (26개):

```
baseBar, xpBar, killText, timerText, levelText, fpsText,
goldText, stageText, bossHpBar, bossNameText,
statsText, enemyHpBarsGfx, fpsUpdateTimer,
prevBaseHpPct, prevXpPct, prevKills, prevLevel, prevTimerStr,
prevBossHpPct, prevGold, prevStage, prevWeaponSlotStr, prevStatsStr,
weaponSlotBgs[], weaponSlotTexts[], speedText
```

**이관 메서드** (2개):

```
createHUD()
updateHUD(rawDelta)
```

**인터페이스**:

```typescript
// src/managers/HUDManager.ts

export class HUDManager implements RunManager {
  // HUD 요소 + 더티 캐시 (26개 변수)

  create(ctx: RunContext): void {
    /* 모든 HUD 텍스트/그래픽스 생성 */
  }

  update(ctx: RunContext, rawDelta: number): void {
    /* 더티 플래그 비교 후 변경분만 갱신 */
  }

  /** 속도 텍스트 갱신 (cycleSpeed 호출 시) */
  setSpeedDisplay(speed: number): void {
    /* ... */
  }

  /** 일시정지/속도 버튼 콜백 등록 */
  setButtonCallbacks(callbacks: { onPause: () => void; onCycleSpeed: () => void }): void {
    /* ... */
  }

  resetForStage(): void {
    /* 더티 플래그 전부 -1 */
  }

  shutdown(): void {
    /* ... */
  }
}
```

**RunScene과의 통신**:

- HUDManager는 `ctx.runState`, `ctx.activeEnemies`, `ctx.activeBoss`, `ctx.weapons`, `ctx.player` 등을 **읽기 전용**으로 참조하여 표시
- 버튼 탭 이벤트는 콜백으로 RunScene에 전달
- HUDManager는 상태를 변경하지 않음 (순수 표시 레이어)

### 3.4 LevelUpManager

**책임**: 레벨업 판정, 업그레이드 카드 UI, 자동 선택 타이머, 패시브 효과 적용

**이관 변수** (6개):

```
upgradeContainer, autoSelectBarBg, autoSelectBarFill,
autoSelectStartReal, autoSelectBestChoice, xpTable
```

**이관 메서드** (6개):

```
showLevelUpUI()
createUpgradeCards(choices)
scoreBestChoice(choices)
applyUpgrade(choice)
applyPassiveEffect(passiveId)
getPassiveLevels()
```

**인터페이스**:

```typescript
// src/managers/LevelUpManager.ts

export interface LevelUpCallbacks {
  /** 레벨업 시작 — RunScene이 phase='levelup', physics.pause() */
  onLevelUpStart: () => void;
  /** 모든 레벨업 해소 완료 — RunScene이 phase='playing', physics.resume() */
  onLevelUpEnd: (hasPendingStageClear: boolean) => void;
}

export class LevelUpManager implements RunManager {
  private xpTable!: XpTable;
  private upgradeContainer?: Phaser.GameObjects.Container;
  private autoSelectBarBg?: Phaser.GameObjects.Rectangle;
  private autoSelectBarFill?: Phaser.GameObjects.Rectangle;
  private autoSelectStartReal = 0;
  private autoSelectBestChoice?: UpgradeChoice;

  create(ctx: RunContext): void {
    /* XpTable 초기화 */
  }

  /** Phase 0: 레벨업 중 자동선택 바 업데이트 (update에서 호출) */
  updateAutoSelect(ctx: RunContext): void {
    /* ... */
  }

  /** 적 사망 시 XP 적립 + 레벨업 체크 */
  addXpAndCheck(ctx: RunContext, xpAmount: number): boolean {
    /* returns true if levelup triggered */
  }

  update(ctx: RunContext, delta: number): void {
    /* autoselect bar only */
  }

  /** 패시브 효과를 Player에 적용 */
  private applyPassiveEffect(ctx: RunContext, passiveId: string): void {
    /* ... */
  }

  shutdown(): void {
    /* container destroy */
  }
}
```

**핵심 설계 결정 — 보스+레벨업 직렬화 (M-014 방지)**:

LevelUpManager는 `pendingStageClear` 상태를 **직접 보유하지 않는다**. 대신:

1. `onLevelUpEnd(hasPendingStageClear)` 콜백으로 RunScene에 알림
2. RunScene이 StageManager에게 스테이지 클리어 시퀀스를 위임
3. Phase 전환 책임은 항상 RunScene에 있음 (단일 진실 소스)

```
적 사망(RunScene) → addXpAndCheck(LevelUpManager)
  ├── 레벨업 발생 → onLevelUpStart 콜백 → RunScene phase='levelup'
  │   └── 업그레이드 선택 → 추가 레벨업 체크 → onLevelUpEnd(pendingStageClear)
  │       └── RunScene이 StageManager.showStageClear() 호출
  └── 레벨업 미발생 → RunScene이 직접 StageManager 호출
```

### 3.5 StageManager

**책임**: 스테이지 전환, 난이도 배율 관리, Stage Clear UI, 배경 교체

**이관 변수** (7개):

```
pendingStageClear, stageClearContainer,
stageHpMult, stageSpeedMult, stageDamageMult,
bossStageActive, bossSpawnedThisStage
```

> `bossStageActive`, `bossSpawnedThisStage`는 SpawnManager와 공유 필요 — StageManager가 소유하고 SpawnManager가 참조

**이관 메서드** (2개):

```
showStageClear()
nextStage()
```

**인터페이스**:

```typescript
// src/managers/StageManager.ts

export interface StageCallbacks {
  /** 다음 스테이지 시작 — 각 매니저의 resetForStage() 호출 트리거 */
  onNextStage: (stageConfig: StageConfig) => void;
  /** 최종 스테이지 클리어 — 승리 */
  onRunComplete: (survived: boolean) => void;
  /** ARIA 메시지 표시 */
  onAriaMessage: (msg: string) => void;
}

export class StageManager implements RunManager {
  private pendingStageClear = false;
  private stageClearContainer?: Phaser.GameObjects.Container;
  private stageHpMult = 1;
  private stageSpeedMult = 1;
  private stageDamageMult = 1;

  create(ctx: RunContext): void {
    /* ... */
  }
  update(ctx: RunContext, delta: number): void {
    /* 특별한 프레임 로직 없음 */
  }

  /** 보스 사망 시 호출 — pendingStageClear 플래그 설정 */
  markPendingStageClear(): void {
    this.pendingStageClear = true;
  }
  get hasPendingStageClear(): boolean {
    return this.pendingStageClear;
  }
  consumePendingStageClear(): void {
    this.pendingStageClear = false;
  }

  /** Stage Clear 오버레이 표시 */
  showStageClear(ctx: RunContext): void {
    /* UI 생성, "다음 스테이지" 버튼 */
  }

  /** 다음 스테이지로 진행 */
  private nextStage(ctx: RunContext): void {
    /* 난이도 배율, 힐, 상태 초기화 */
  }

  /** 현재 스테이지 난이도 배율 (SpawnManager에서 참조) */
  getDifficultyMults(): { hp: number; speed: number; damage: number } {
    return { hp: this.stageHpMult, speed: this.stageSpeedMult, damage: this.stageDamageMult };
  }

  shutdown(): void {
    /* container destroy */
  }
}
```

### 3.6 ShopManager

**책임**: 중간 상점 UI, 자동 선택 타이머, 구매 적용

**이관 변수** (6개):

```
midShopShown, shopContainer, shopAutoBarBg, shopAutoBarFill,
shopAutoStartReal, shopAutoBestAction
```

**이관 메서드** (4개):

```
showMidRunShop()
scoreBestShopChoice(items)
applyShopChoice(action, cost)
closeShop()
```

**인터페이스**:

```typescript
// src/managers/ShopManager.ts

export interface ShopCallbacks {
  /** 상점 열림 — RunScene이 phase='shop', physics.pause() */
  onShopOpen: () => void;
  /** 상점 닫힘 — RunScene이 phase='playing', physics.resume() */
  onShopClose: () => void;
  /** 구매 효과 적용 */
  onPurchase: (action: 'heal' | 'damage' | 'armor') => void;
  /** ARIA 메시지 */
  onAriaMessage: (msg: string) => void;
}

export class ShopManager implements RunManager {
  private midShopShown = false;
  private shopContainer?: Phaser.GameObjects.Container;
  private shopAutoBarBg?: Phaser.GameObjects.Rectangle;
  private shopAutoBarFill?: Phaser.GameObjects.Rectangle;
  private shopAutoStartReal = 0;
  private shopAutoBestAction?: { action: string; cost: number } | null;

  create(ctx: RunContext): void {
    /* ... */
  }

  /** Phase 3b: 상점 트리거 시점 체크 */
  checkTrigger(ctx: RunContext): boolean {
    /* midShopShown + stageTime >= triggerTimeMs */
  }

  /** Phase 0: 상점 중 자동선택 바 업데이트 */
  updateAutoSelect(ctx: RunContext): void {
    /* ... */
  }

  update(ctx: RunContext, delta: number): void {
    /* autoselect only */
  }

  resetForStage(): void {
    this.midShopShown = false;
  }

  shutdown(): void {
    /* container destroy */
  }
}
```

### 3.7 AllyManager

**책임**: 동료 스프라이트 생성, 위치, 쿨다운, 발사

**이관 변수** (4개):

```
allyLeftSprite, allyRightSprite, allySniperCooldown, allySpreadCooldown
```

**이관 메서드** (5개):

```
createAllies()
updateAllies(delta)
findNearestEnemyFrom(fx, fy, range)
findNearestEnemiesFrom(fx, fy, range, maxCount)
fireAllyProjectile(fromX, fromY, toX, toY, damage, texture)
```

**인터페이스**:

```typescript
// src/managers/AllyManager.ts

export class AllyManager implements RunManager {
  private allyLeftSprite!: Phaser.GameObjects.Sprite;
  private allyRightSprite!: Phaser.GameObjects.Sprite;
  private allySniperCooldown = 0;
  private allySpreadCooldown = 0;

  create(ctx: RunContext): void { /* 동료 스프라이트 생성 */ }

  update(ctx: RunContext, scaledDelta: number): void {
    /* 쿨다운 감소 + 타겟팅 + 발사 */
  }

  /** 발사 시 projectileGroup.get() 사용 (ctx 경유) */
  private fireAllyProjectile(ctx: RunContext, ...): void { /* ... */ }

  shutdown(): void { /* sprite destroy */ }
}
```

---

## 4. 인터페이스 설계: 서브시스템 간 통신

### 4.1 통신 패턴 비교

| 패턴                       | 장점                     | 단점                         | 채택 여부                     |
| -------------------------- | ------------------------ | ---------------------------- | ----------------------------- |
| **직접 참조 (RunContext)** | 단순, 성능 최적          | 양방향 의존성 가능           | **O** (읽기 위주)             |
| **콜백 (Callbacks)**       | 의존성 역전, 테스트 용이 | 콜백 지옥 위험               | **O** (이벤트성 액션)         |
| **EventEmitter**           | 완전 디커플링            | 디버그 어려움, 성능 오버헤드 | **X** (60fps 게임에서 불필요) |
| **공유 이벤트 버스**       | 매니저 간 통신           | 암묵적 의존성                | **X**                         |

### 4.2 채택 패턴: RunContext + Callbacks

```
┌──────────────────────────────────────────┐
│              RunScene (오케스트레이터)      │
│                                          │
│  ┌─ RunContext ──────────────────────┐    │
│  │ runState, phase, player, groups  │    │
│  │ activeEnemies, weapons, ...      │    │
│  └──────────────────────────────────┘    │
│      ↓ read/write     ↑ callbacks        │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Spawn  │ │Collision│ │  HUD   │       │
│  │Manager │ │Manager  │ │Manager │       │
│  └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │LevelUp │ │ Stage  │ │  Shop  │       │
│  │Manager │ │Manager │ │Manager │       │
│  └────────┘ └────────┘ └────────┘       │
│  ┌────────┐                              │
│  │  Ally  │                              │
│  │Manager │                              │
│  └────────┘                              │
└──────────────────────────────────────────┘
```

### 4.3 RunScene의 역할 (리팩토링 후)

리팩토링 후 RunScene은 **오케스트레이터/중개자** 역할만 수행:

1. **`create()`**: 각 매니저 인스턴스 생성 + RunContext 조립 + 매니저별 `create()` 호출
2. **`update()`**: Phase 흐름에 따라 각 매니저의 `update()` 호출
3. **Phase 상태머신 관리**: `phase` 전환의 단일 진실 소스
4. **콜백 처리**: 매니저에서 올라온 이벤트를 다른 매니저로 중개
5. **게임 오버/승리**: 씬 전환

**목표 줄 수**: ~400줄 (현재 1953줄 → ~80% 감소)

### 4.4 리팩토링 후 update() 흐름

```typescript
update(_time: number, delta: number): void {
  // Phase 0: UI 자동선택 (playing이 아닌 phase)
  if (this.phase === 'levelup') this.levelUpManager.updateAutoSelect(this.ctx);
  if (this.phase === 'shop') this.shopManager.updateAutoSelect(this.ctx);
  if (this.phase !== 'playing') return;

  const scaledDelta = delta * this.gameSpeed;
  this.ctx.runState.runTime += scaledDelta;
  this.ctx.runState.stageTime += scaledDelta;

  // Phase 1: 적 리스트 + SpatialHash 리빌드
  this.collisionManager.rebuildSpatialHash(this.ctx);

  // Phase 2: 플레이어 조준
  this.updatePlayerAim();

  // Phase 3: 스폰
  this.spawnManager.update(this.ctx, scaledDelta);

  // Phase 3b: 상점 트리거
  if (this.shopManager.checkTrigger(this.ctx)) {
    this.shopManager.showShop(this.ctx);
    return;
  }

  // Phase 4: 적 이동 + 공격
  this.updateEnemyMovement(scaledDelta); // RunScene 잔류 (적 로직은 Enemy 자체)

  // Phase 4b: 적 투사체
  this.collisionManager.updateEnemyProjectiles(this.ctx, scaledDelta);
  if (this.phase !== 'playing') return;

  // Phase 5: 무기 자동 발사
  this.weaponSystem.update(scaledDelta, ...);

  // Phase 5b: 동료 자동 발사
  this.allyManager.update(this.ctx, scaledDelta);

  // Phase 6: 충돌 감지
  this.collisionManager.resolveProjectileCollisions(this.ctx);

  // Phase 8-9: VFX + 기지 회복
  this.vfx.update(scaledDelta);
  this.applyBaseRegen(scaledDelta);

  // Phase 10: HUD
  this.hudManager.update(this.ctx, delta);

  // Phase 10b: ARIA
  this.ariaMsg.update(scaledDelta);
  this.checkARIATriggers();

  // Phase 11: 승리 판정
  this.checkVictory();
}
```

---

## 5. 마이그레이션 계획

### 5.1 원칙

1. **한 번에 하나의 매니저만 추출** — 각 단계에서 빌드+테스트 PASS 확인
2. **행동 보존** — 리팩토링 전후 게임 동작이 동일해야 함
3. **RunContext 먼저** — 모든 매니저보다 먼저 인터페이스 정의
4. **가장 독립적인 것부터** — 의존성이 적은 매니저 먼저 추출

### 5.2 단계별 계획

#### Step 0: RunContext 인터페이스 정의

- `src/types/run-context.ts` 생성
- `src/managers/BaseRunManager.ts` 생성
- **빌드 테스트**: 타입만 추가, 런타임 영향 없음
- **검증**: `npm run build`

#### Step 1: AllyManager 추출 (가장 독립적)

- **이유**: 다른 서브시스템과 거의 의존 없음. `activeEnemies`만 읽음
- **작업**:
  1. `src/managers/AllyManager.ts` 생성
  2. `createAllies()`, `updateAllies()`, 관련 헬퍼 이동
  3. RunScene에서 `this.allyManager = new AllyManager()` 호출
  4. `findNearestEnemyFrom()`, `findNearestEnemiesFrom()`은 AllyManager로 이동 (현재 동료 전용)
- **검증**: `npm run build && npm test -- --run` + 수동 플레이 (동료 발사 확인)
- **위험도**: **낮음**

#### Step 2: HUDManager 추출

- **이유**: 순수 표시 레이어, 상태 변경 없음
- **작업**:
  1. `src/managers/HUDManager.ts` 생성
  2. `createHUD()`, `updateHUD()` 이동 + 더티 캐시 변수 26개 이동
  3. 버튼 콜백 (`onPause`, `onCycleSpeed`) 연결
- **검증**: `npm run build && npm test -- --run` + 수동 플레이 (HUD 요소 전수 확인)
- **위험도**: **낮음** — 단, `enemyHpBarsGfx` (월드 스페이스)는 depth 순서 주의

#### Step 3: ShopManager 추출

- **이유**: 레벨업과 독립적, phase='shop' 전용
- **작업**:
  1. `src/managers/ShopManager.ts` 생성
  2. 상점 관련 6개 변수 + 4개 메서드 이동
  3. `onPurchase` 콜백으로 효과 적용 (heal/damage/armor는 RunScene에서 처리)
- **검증**: `npm run build` + 수동 플레이 (30초 시점 상점 등장 + 구매 확인)
- **위험도**: **낮음**

#### Step 4: SpawnManager 추출

- **이유**: 웨이브 디렉터를 캡슐화
- **작업**:
  1. `src/managers/SpawnManager.ts` 생성
  2. `waveDirector`, `spawnEnemies()`, 스폰 관련 변수 이동
  3. 보스 스폰 콜백 연결 (ARIA + 오디오)
- **검증**: `npm run build` + 수동 플레이 (웨이브 스폰 + 보스 등장)
- **위험도**: **중간** — `stageHpMult`/`stageSpeedMult`/`stageDamageMult` 참조 경로 주의

#### Step 5: LevelUpManager 추출 (M-014 핵심 영역)

- **이유**: Phase 상태머신과 깊이 연관 — 가장 주의 필요
- **작업**:
  1. `src/managers/LevelUpManager.ts` 생성
  2. 레벨업 UI + XpTable + 패시브 적용 이동
  3. **pendingStageClear 처리 프로토콜 재구현**:
     - LevelUpManager는 `pendingStageClear`를 소유하지 않음
     - `onLevelUpEnd(hasPendingStageClear: boolean)` 콜백으로 RunScene에 전달
     - RunScene이 StageManager에 위임
- **검증 (필수)**:
  1. `npm run build && npm test -- --run`
  2. **Gate 8: 보스 클리어 플로우 검증** — 전체 코드 트레이스
  3. 수동 플레이: 보스 사망 + 레벨업 동시 발생 시나리오 확인
- **위험도**: **높음** — M-014 재발 가능

#### Step 6: StageManager 추출

- **이유**: Step 5 이후 해야 pendingStageClear 흐름이 안정화됨
- **작업**:
  1. `src/managers/StageManager.ts` 생성
  2. `showStageClear()`, `nextStage()`, 난이도 배율 이동
  3. `onNextStage` 콜백으로 다른 매니저들의 `resetForStage()` 호출
- **검증**:
  1. `npm run build && npm test -- --run`
  2. Gate 8 재수행
  3. 수동 플레이: 6스테이지 전체 진행 테스트
- **위험도**: **중간** — Step 5와의 상호작용

#### Step 7: CollisionManager 추출 (마지막)

- **이유**: 성능 크리티컬, SpatialHash 최적화 포함
- **작업**:
  1. `src/managers/CollisionManager.ts` 생성
  2. `resolveCollisions()`, `onProjectileHitEnemy()`, 적 투사체 로직 이동
  3. `QUERY_BUFFER` 등 성능 최적화 상수도 함께 이동
- **검증**:
  1. `npm run build && npm test -- --run`
  2. 수동 플레이: 대량 적 (45마리) 환경에서 FPS 확인
  3. 충돌 누락 없는지 확인 (엘리트/보스 포함)
- **위험도**: **중간** — 성능 회귀 가능성

### 5.3 잔류 항목 (RunScene에 남는 것)

리팩토링 후 RunScene에 남는 책임:

| 항목                               | 이유                                               |
| ---------------------------------- | -------------------------------------------------- |
| `phase` 상태머신                   | 단일 진실 소스                                     |
| `create()` 오케스트레이션          | 매니저 조립 순서 보장 (M-015 방지)                 |
| `update()` 오케스트레이션          | Phase별 매니저 호출 순서 보장                      |
| 적 이동 + 기지 도달 (Phase 4)      | `Enemy.applyMovement()` 호출 + 기지 도달 판정      |
| `onEnemyDeath()`                   | 여러 매니저에 걸친 사이드 이펙트 중개              |
| `applyBaseDamage()`                | `runState.baseHp` 변경 + VFX + SFX + 게임오버 체크 |
| 기지 벽 렌더링                     | `drawBaseWall()`, `flashBaseWall()`                |
| `onRunComplete()`                  | 씬 전환                                            |
| 입력 처리                          | `onPointerDown()` (타겟 포인트)                    |
| `drawGrid()`, `updateBackground()` | 단순 렌더링                                        |
| `playSfx()`                        | 공유 유틸                                          |

**예상 잔류 줄 수**: ~350-400줄

---

## 6. 리스크 평가

### 6.1 M-014 패턴: 보스+레벨업 직렬화 소프트락

**위험도**: **높음**

| 시나리오                                                  | 위험                   |
| --------------------------------------------------------- | ---------------------- |
| LevelUpManager와 StageManager 간 phase 전환 타이밍 어긋남 | 영구 소프트락          |
| `pendingStageClear` 소유권 혼란                           | 스테이지 클리어 미발생 |
| 콜백 체인 중 phase가 예상과 다른 값                       | 가드 조건에 걸림       |

**완화 전략**:

1. `pendingStageClear`는 StageManager가 소유, LevelUpManager는 `onLevelUpEnd` 콜백의 인자로만 관여
2. Phase 전환은 **항상 RunScene에서만** 수행 — 매니저는 phase를 변경하지 않음
3. Step 5/6 후 반드시 Gate 8 수행
4. 자동화 테스트 추가: `describe('보스사망+레벨업 동시', ...)`

### 6.2 M-008 패턴: 배선 누락 (Dead Code)

**위험도**: **중간**

| 시나리오                                                      | 위험                          |
| ------------------------------------------------------------- | ----------------------------- |
| 매니저 메서드를 구현했지만 RunScene의 update()에서 호출 안 함 | 기능 미동작                   |
| 콜백 미등록 (예: `onBossSpawn` 연결 안 함)                    | 보스 스폰 시 ARIA/오디오 없음 |

**완화 전략**:

1. 각 Step에서 "매니저 메서드 → RunScene 호출부" 1:1 매핑 확인
2. `grep -rn '매니저메서드명' src/scenes/RunScene.ts` 로 호출 존재 확인
3. Gate 5 (통합 배선 검증) 수행

### 6.3 M-015 패턴: 초기화 순서

**위험도**: **중간**

| 시나리오                                        | 위험                        |
| ----------------------------------------------- | --------------------------- |
| `create()` 내 매니저 생성 순서 잘못             | 미초기화 참조 접근 → 크래시 |
| RunContext 조립 시점에 player/enemyGroup 미생성 | undefined 에러              |

**완화 전략**:

1. `create()` 내 순서를 명시적으로 주석 문서화
2. RunContext는 모든 기본 오브젝트 생성 후 마지막에 조립
3. `!` non-null assertion 최소화 — 가능하면 `create()`에서 즉시 할당

### 6.4 성능 회귀

**위험도**: **낮음**

| 시나리오                | 위험            |
| ----------------------- | --------------- |
| 함수 호출 오버헤드 증가 | FPS 하락        |
| 객체 생성/GC 증가       | 프레임 스파이크 |

**완화 전략**:

1. 매니저 인스턴스는 `create()` 시 1회만 생성 (프레임 루프에서 `new` 없음)
2. RunContext는 기존 변수의 참조만 가지므로 추가 할당 없음
3. Step 7 (CollisionManager) 후 FPS 벤치마크 비교
4. 핫 경로 (SpatialHash, 충돌 루프)는 인라인 유지 고려

### 6.5 테스트 커버리지 불연속

**위험도**: **낮음**

현재 RunScene은 유닛 테스트 불가 (Phaser Scene 의존). 리팩토링 후:

- 매니저 내부 순수 로직 (scoreBestChoice, applyPassiveEffect)은 **단독 테스트 가능**
- Phaser 의존 부분 (UI 생성)은 여전히 통합 테스트 필요
- 기존 테스트 수 변화 없음 (Gate 2 준수)

---

## 7. 파일 구조 (완료 후)

```
src/
├── managers/
│   ├── AllyManager.ts        (~95줄)
│   ├── CollisionManager.ts   (~100줄)
│   ├── HUDManager.ts         (~310줄)
│   ├── LevelUpManager.ts     (~200줄)
│   ├── ShopManager.ts        (~180줄)
│   ├── SpawnManager.ts       (~80줄)
│   └── StageManager.ts       (~160줄)
├── types/
│   ├── run-context.ts        (~50줄) [신규]
│   ├── game.ts
│   └── weapon.ts
├── scenes/
│   └── RunScene.ts           (~400줄) [1953→400줄]
└── ...
```

**총 줄 수**: ~1,575줄 (기존 1,953줄과 비슷하지만 7개 파일로 분산)

---

## 8. 수락 기준

| #   | 기준                                       | 검증 방법                                      |
| --- | ------------------------------------------ | ---------------------------------------------- |
| 1   | RunScene.ts ≤ 500줄                        | `wc -l`                                        |
| 2   | 모든 매니저가 `RunManager` 인터페이스 구현 | 타입 체크                                      |
| 3   | `phase` 변경은 RunScene에서만 발생         | `grep 'this.phase =' src/managers/` → 결과 0건 |
| 4   | 빌드+테스트 PASS                           | Gate 1                                         |
| 5   | 보스+레벨업 동시 발생 소프트락 없음        | Gate 8                                         |
| 6   | 6스테이지 전체 클리어 가능                 | 수동 플레이                                    |
| 7   | FPS ≥ 55 (45적 환경)                       | 게임 내 FPS 카운터                             |
| 8   | 기존 테스트 수 변화 없음                   | Gate 2                                         |

---

## 9. 비고

### 이 문서에서 다루지 않는 것

- **Enemy 이동 로직 분리**: Enemy.applyMovement()는 이미 Enemy 클래스에 캡슐화되어 있으므로, RunScene의 Phase 4 루프는 현재 구조를 유지한다. 별도 EnemyMovementManager는 과잉 설계.
- **WeaponSystem 변경**: 이미 독립 시스템으로 분리되어 있음. 리팩토링 대상 아님.
- **VFXManager/DamageNumberManager 변경**: 이미 독립 유틸. 그대로 유지.
- **테스트 코드 작성**: 별도 태스크로 분리 (TASK-008b).

### 관련 태스크

| 태스크    | 설명                         | 의존성    |
| --------- | ---------------------------- | --------- |
| TASK-008  | 리팩토링 설계 문서 (이 문서) | 없음      |
| TASK-008a | 리팩토링 구현 (Step 0~7)     | TASK-008  |
| TASK-008b | 매니저별 유닛 테스트 추가    | TASK-008a |
