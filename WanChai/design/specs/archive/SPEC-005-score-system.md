# [SPEC-005] Score & Star Rating System

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P0
- **예상 공수**: S

## 요약

큐브 파괴, 슬링 콤보, 잔여 히어로에 기반한 스코어 시스템. 레벨별 임계값에 따라 1~3별 등급 부여.

## 요구사항

### 기능 요구사항

- [x] FR-01: 큐브 파괴 스코어 = `floor(count × 100 × (1 + slingCombo × 0.1))`
- [x] FR-02: 레벨 완료 보너스 = `remainingHeroes × 200`
- [x] FR-03: 별 판정: score >= three → 3별, >= two → 2별, >= one → 1별
- [x] FR-04: 각 레벨의 starThresholds는 JSON에서 정의
- [x] FR-05: 최고 스코어/별은 SaveManager에 영속 저장 (best만 덮어씀)

### 비기능 요구사항

- [x] NFR-01: 스코어 변경은 EventBus로 UI에 전달
- [x] NFR-02: ResultScene에서 별 리빌 애니메이션 (순차 스케일 + 파티클)
- [x] NFR-03: ScoreCounter 롤업 애니메이션 (800~1500ms)

## 기술 힌트

- Logic: `src/core/ScoreCalculator.ts` — calculateStars(), cubeDestroyScore(), levelCompleteBonus()
- Save: `src/managers/SaveManager.ts` — saveStageResult()
- UI: `src/ui/ScoreCounter.ts` — rollTo()

## 테스트 기준

- [x] TC-01: 큐브 1개 파괴, 콤보 0 → 100점
- [x] TC-02: 큐브 1개 파괴, 콤보 5 → 150점
- [x] TC-03: 히어로 3명 잔여 → 600점 보너스
- [x] TC-04: 별 임계값 경계 정확히 판정

## 스코어 공식

### 큐브 파괴 스코어

```
cubeDestroyScore = floor(destroyedCount × SCORE_PER_CUBE × (1 + slingCombo × SLING_BONUS_PER_LEVEL))
```

### 레벨 완료 보너스

```
levelCompleteBonus = remainingHeroCount × SCORE_PER_REMAINING_HERO
```

### 별 판정

```
if (score >= starThresholds.three) → 3별
else if (score >= starThresholds.two) → 2별
else if (score >= starThresholds.one) → 1별
else → 0별
```

## 밸런스 파라미터

| 파라미터                 | 값  | 출처       | 속성 계층    |
| ------------------------ | --- | ---------- | ------------ |
| SCORE_PER_CUBE           | 100 | balance.ts | 1차          |
| SCORE_PER_REMAINING_HERO | 200 | balance.ts | 3차 (보너스) |
| SLING_BONUS_PER_LEVEL    | 0.1 | balance.ts | 2차 (콤보)   |
| MAX_SLING_COMBO          | 5   | balance.ts | 2차 상한     |
