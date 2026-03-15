# 적 시스템

> 적 종류, 스폰 로직, 행동 패턴, 난이도 스케일링

관련 파일: `src/core/EnemyBehaviorCalc.ts`, `src/core/EnemyScalingCalc.ts`, `src/managers/SpawnManager.ts`, `src/core/SpawnPoolLogic.ts`

---

## 적 종류

### T1 일반 적 (11종)

| ID             | 행동 패턴           | 특성                          |
| -------------- | ------------------- | ----------------------------- |
| `basic`        | `march` (직선 하강) | 기본 유형                     |
| `fast`         | `march` (고속)      | 빠른 이동속도                 |
| `swarm`        | `march` (군집)      | 낮은 HP, 다수 동시 등장       |
| `tank`         | `march` (저속)      | 높은 HP                       |
| `special`      | `slow_chase`        | 지그재그 추적                 |
| `splitter`     | `split` → `march`   | 사망 시 2개로 분열            |
| `chaser`       | `chase` (직접 추격) | 플레이어를 직접 추격          |
| `shooter`      | `shoot` (원거리)    | 특정 Y에서 멈추고 원거리 사격 |
| `sniper_enemy` | `shoot` (저격)      | 고데미지 원거리               |
| `guardian`     | `dash`              | 주기적으로 대시               |
| `teleporter`   | `teleport`          | 주기적으로 순간이동           |

### 보스 (3종)

| ID            | 행동         | 특성                           |
| ------------- | ------------ | ------------------------------ |
| `boss`        | `boss_chase` | 느린 하강 + X축 플레이어 추적  |
| `boss_circle` | `boss_orbit` | 화면 중앙 궤도 비행 후 하강    |
| `boss_burst`  | `boss_burst` | 아이들(느린) + 차지(고속) 반복 |

### 엘리트 (기존 적의 강화 버전)

어떤 적이든 엘리트로 등장 가능. 기본 스탯에 곱수 적용:

| 스탯      | 배율 |
| --------- | ---- |
| HP        | ×3   |
| 데미지    | ×2   |
| XP        | ×5   |
| 넉백      | 면역 |
| 시각 크기 | ×1.4 |

---

## 행동 패턴 상세

> 관련 파일: `src/core/EnemyBehaviorCalc.ts`

| 패턴         | 함수                         | 설명                              |
| ------------ | ---------------------------- | --------------------------------- |
| `march`      | `calculateMarchVelocity`     | Y축 직선 하강                     |
| `slow_chase` | `calculateSlowChaseVelocity` | 플레이어 방향 추적 + 지그재그     |
| `zigzag`     | `calculateZigzagVelocity`    | 수평 진동하며 하강                |
| `dash`       | `calculateDashVelocity`      | 주기적 고속 대시 + 저속 구간      |
| `chase`      | `calculateChaseVelocity`     | 플레이어 직접 추격                |
| `split`      | `calculateSplitVelocity`     | 0.7 속도 하강                     |
| `shoot`      | `calculateShootBehavior`     | 지정 Y 도달 시 정지 + 원거리 공격 |
| `teleport`   | `calculateTeleportJump`      | 주기적 순간이동 (Y+100~150, X±50) |
| `boss_chase` | `calculateBossChaseVelocity` | 느린 하강 + X 부드러운 추적       |
| `boss_orbit` | `calculateBossOrbitVelocity` | 중심(Y=500) 접근 후 궤도 비행     |
| `boss_burst` | `calculateBossBurstVelocity` | 아이들×0.2속도 + 차지×4속도       |

---

## 스케일링 시스템

> 관련 파일: `src/core/EnemyScalingCalc.ts`

### 시간 기반 스케일링 (경과 분 단위)

```typescript
hpScale = Math.pow(2.2, minutesElapsed); // HP 배율
speedScale = Math.min(Math.pow(1.5, minutesElapsed), 2.8); // 속도 배율 (최대 2.8×)
dmgScale = Math.pow(2.0, minutesElapsed); // 데미지 배율
```

### 스테이지 누적 배율

16 스테이지에 걸쳐 스테이지마다 곱수 적용:

| 스탯   | 스테이지당 배율 |
| ------ | --------------- |
| HP     | ×1.35           |
| 속도   | ×1.10           |
| 데미지 | ×1.15           |

### 보스 HP 상한

아무리 스케일링되어도 보스 HP 최대 **15,000** (`BALANCE.DIFFICULTY.maxBossHp`)

### 분열 자식 스탯

`splitter` 적 사망 시 생성되는 자식 적:

- HP: `ceil(부모 maxHp × 0.4)`
- 크기 배율: 0.6
- X 오프셋: ±20px

---

## 스폰 시스템

> 관련 파일: `src/managers/SpawnManager.ts`, `src/core/SpawnPoolLogic.ts`

### 스폰 매개변수

| 상수                  | 값      | 설명               |
| --------------------- | ------- | ------------------ |
| `initialDelayMs`      | 600ms   | 첫 스폰 딜레이     |
| `baseIntervalMs`      | 800ms   | 기본 스폰 간격     |
| `minIntervalMs`       | 400ms   | 최소 스폰 간격     |
| `intervalDecayPerMin` | 0.45    | 분당 간격 감소     |
| `maxEnemiesOnScreen`  | 45      | 화면 최대 적 수    |
| `eliteChanceBase`     | 10%     | 기본 엘리트 확률   |
| `eliteChancePerMin`   | +25%/분 | 시간당 엘리트 증가 |
| `eliteChanceMax`      | 50%     | 엘리트 확률 상한   |

### 스폰 위치

적은 화면 최상단 바로 위에서 생성: Y = -50 ~ -10 (화면 밖)

### 구역별 적 풀

스테이지마다 해당 구역의 `enemyPool`에서만 적을 선택합니다.

| 구역                 | 등장 적                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Central (1-2)        | basic, fast, swarm                                                                        |
| Tsim Sha Tsui (3-4)  | +tank, special, sniper_enemy                                                              |
| Mong Kok (5-6)       | +splitter, chaser, shooter, guardian, teleporter                                          |
| Sham Shui Po (7-8)   | tank, guardian, splitter, chaser, shooter, sniper_enemy, teleporter                       |
| Wong Tai Sin (9-10)  | fast, swarm, chaser, special, splitter, shooter, sniper_enemy, teleporter                 |
| Lantau (11-12)       | 전체 적 풀                                                                                |
| Aberdeen (13-14)     | tank, guardian, chaser, shooter, sniper_enemy, splitter, teleporter                       |
| Kowloon City (15-16) | fast, swarm, tank, special, splitter, chaser, shooter, sniper_enemy, guardian, teleporter |
