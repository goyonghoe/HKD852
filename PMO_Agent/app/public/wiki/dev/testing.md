# 테스트 가이드

> 테스트 구조, 작성 규칙, Phaser 모킹 패턴, 주요 파일 목록

관련 파일: `tests/`, `tests/setup.ts`, `WanChai/package.json`

---

## 개요

WanChai는 **Vitest 3** 기반의 단위 테스트를 사용합니다. 모든 `src/core/` 모듈은 Phaser 없이 독립적으로 테스트 가능합니다.

| 항목           | 현황                 |
| -------------- | -------------------- |
| 테스트 파일 수 | 73개                 |
| 테스트 러너    | Vitest 3             |
| 환경           | jsdom                |
| Phaser 의존    | 모킹 처리 (setup.ts) |

---

## 디렉토리 구조

```
tests/
├── setup.ts             # Phaser 모킹, 전역 설정
├── core/                # 순수 로직 테스트 (39개)
│   ├── DamageCalc.test.ts
│   ├── EnemyScalingCalc.test.ts
│   ├── EnemyBehaviorCalc.test.ts
│   ├── DifficultyScaling.test.ts
│   ├── SpawnPoolLogic.test.ts
│   ├── StageProgression.test.ts
│   ├── MetaProgression.test.ts
│   ├── UpgradeSelector.test.ts
│   ├── WeatherCalc.test.ts
│   ├── ShopLogic.test.ts
│   ├── UltimateCalc.test.ts
│   ├── GaugeCalc.test.ts
│   ├── AllyTargeting.test.ts
│   ├── ChallengeMode.test.ts
│   ├── CollisionCalc.test.ts
│   ├── Achievements.test.ts
│   ├── GameOverCalc.test.ts
│   ├── GameStatFormatting.test.ts
│   ├── SeededRandom.test.ts
│   ├── SpatialHash.test.ts
│   ├── WeaponFireCalc.test.ts
│   ├── WeaponZoneCalc.test.ts
│   ├── WaveDirector.test.ts
│   ├── XpTable.test.ts
│   ├── PhaseManager.test.ts
│   ├── BalanceMatrix.test.ts
│   ├── Integration.test.ts
│   └── DailyReward.test.ts
├── config/              # 설정 검증 테스트 (9개)
│   ├── Weapons.test.ts
│   ├── Characters.test.ts
│   ├── Critters.test.ts
│   ├── Districts.test.ts
│   ├── Enemies.test.ts
│   ├── Ultimates.test.ts
│   ├── Passives.test.ts
│   └── ColorAudit.test.ts
├── managers/            # 매니저 테스트 (10개)
├── objects/             # 게임 오브젝트 테스트 (3개)
├── systems/             # 시스템 테스트 (4개)
├── ui/                  # UI 컴포넌트 테스트 (6개)
├── utils/               # 유틸리티 테스트 (5개)
├── integration/         # 통합/감사 테스트 (4개)
│   ├── DeadCodeAudit.test.ts
│   ├── LocaleAudit.test.ts
│   ├── RunSceneContracts.test.ts
│   └── SceneFlowContracts.test.ts
├── lib/                 # 라이브러리 테스트 (2개)
└── audio/               # 오디오 테스트 (1개)
```

---

## 테스트 작성 규칙

### 1. core/ 테스트: Phaser 임포트 없음

`src/core/`의 모든 함수는 순수 TypeScript입니다. Phaser 없이 직접 테스트합니다.

```typescript
// 올바른 예: DamageCalc.test.ts
import { calculateDamage } from "../../src/core/DamageCalc";

test("크리티컬 히트 시 2배 데미지", () => {
  const result = calculateDamage(10, 1.0, 1.0, 2.0, 0.5); // roll=0.5 < critChance=1.0
  expect(result.damage).toBe(20);
  expect(result.isCrit).toBe(true);
});
```

### 2. Phaser 의존 테스트: setup.ts 모킹 사용

`tests/setup.ts`에서 Phaser 전역 객체를 모킹합니다.

```typescript
// managers/ 또는 objects/ 테스트
import { describe, it, expect, vi } from "vitest";
// Phaser 모킹은 setup.ts에서 자동 처리
```

### 3. 시드 기반 난수 사용

랜덤 요소가 있는 로직은 `SeededRandom`으로 결정론적 테스트를 작성합니다.

```typescript
import { SeededRandom } from '../../src/core/SeededRandom';

const rng = new SeededRandom(42);
const upgrades = selectUpgrades(..., rng);
// 같은 시드 → 항상 같은 결과
```

### 4. 테스트 수 유지 (M-004)

리팩토링 후 테스트 수가 감소하면 의도하지 않은 동작 변경 가능성을 조사합니다.

---

## 주요 테스트 파일

| 파일                                     | 테스트 대상        | 핵심 케이스         |
| ---------------------------------------- | ------------------ | ------------------- |
| `core/DamageCalc.test.ts`                | 데미지/원소 계산   | 크리티컬, 원소 상성 |
| `core/BalanceMatrix.test.ts`             | 전체 무기 DPS 검증 | T1/T2 DPS 범위      |
| `core/Integration.test.ts`               | 시스템 통합 계산   | 스케일링 조합       |
| `core/WeatherCalc.test.ts`               | 날씨 수정자        | 각 날씨 효과        |
| `core/MetaProgression.test.ts`           | 메타 업그레이드    | 구매/보너스 계산    |
| `config/ColorAudit.test.ts`              | hex 리터럴 감사    | M-003 위반 검출     |
| `integration/DeadCodeAudit.test.ts`      | 미사용 코드 감사   | Dead code 검출      |
| `integration/SceneFlowContracts.test.ts` | 씬 전환 계약       | M-008 방지          |
| `ui/TouchTargets.test.ts`                | 터치 타겟 크기     | 48dp 이상 검증      |

---

## 테스트 실행 명령

```bash
# 전체 테스트
npm test

# CI 모드 (단발성)
npm test -- --run

# 특정 파일
npm test -- tests/core/DamageCalc.test.ts

# 테스트 UI 모드
npm test -- --ui

# 커버리지
npm test -- --coverage
```
