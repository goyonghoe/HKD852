# [SPEC-003] Sling Combo System

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P1
- **예상 공수**: M

## 요약

히어로를 빠르게 연속 배치하면 슬링 콤보가 쌓이며 스코어 보너스가 증가하는 시스템. 최대 5콤보(50% 보너스). 연속 배치가 끊기면 콤보 리셋.

## 요구사항

### 기능 요구사항

- [x] FR-01: 이전 배치 후 SLING_TAP_THRESHOLD_MS (300ms) 이내 배치 시 rapidDeploy 판정
- [x] FR-02: rapidDeploy 성공 시 slingCombo +1 (최대 MAX_SLING_COMBO = 5)
- [x] FR-03: rapidDeploy 실패 또는 SLING_COOLDOWN_MS (2000ms) 초과 시 콤보 리셋
- [x] FR-04: 콤보 보너스 = slingCombo × SLING_BONUS_PER_LEVEL (0.1 = 10%)
- [x] FR-05: 큐브 파괴 스코어에 콤보 보너스 적용: `floor(count × 100 × (1 + combo × 0.1))`
- [x] FR-06: 콤보 변경 시 EventBus로 UI 알림 (SLING_COMBO / SLING_BREAK)

### 비기능 요구사항

- [x] NFR-01: 콤보 UI는 PuzzleUIScene에서 실시간 표시

## 기술 힌트

- Logic: `src/core/TurnResolver.ts` — slingCombo, slingCooldownActive 필드
- Score: `src/core/ScoreCalculator.ts` — cubeDestroyScore(count, slingCombo)
- Config: `src/config/balance.ts` — SLING\_\* 상수
- Events: `src/types/events.ts` — GameEvents.SLING_COMBO, SLING_BREAK

## 테스트 기준

- [x] TC-01: 빠른 연속 배치 시 콤보 증가
- [x] TC-02: 300ms 이내 = rapidDeploy 판정
- [x] TC-03: 2000ms 초과 시 콤보 리셋
- [x] TC-04: 최대 5콤보 초과 불가
- [x] TC-05: 콤보 5일 때 큐브 파괴 스코어 1.5배

## 밸런스 파라미터

| 파라미터               | 값   | 출처       | 근거                    |
| ---------------------- | ---- | ---------- | ----------------------- |
| MAX_SLING_COMBO        | 5    | balance.ts | 최대 50% 보너스 상한    |
| SLING_BONUS_PER_LEVEL  | 0.1  | balance.ts | 콤보당 10% 증가, 선형   |
| SLING_TAP_THRESHOLD_MS | 300  | balance.ts | 빠른 탭 판정 시간       |
| SLING_COOLDOWN_MS      | 2000 | balance.ts | 콤보 리셋까지 대기 시간 |
