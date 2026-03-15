# [SPEC-007] Bench (Waiting Slot) Mechanic

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-25
- **상태**: verified
- **우선순위**: P0
- **예상 공수**: L

## 요약

히어로가 벨트를 한 바퀴 완주(full orbit)했는데 매칭 가능한 큐브가 없으면(AP > 0 남은 상태), 히어로를 즉시 소멸시키지 않고 **대기 슬롯(벤치)**에 퇴각시킨다. 플레이어는 벤치의 히어로를 탭하여 재출격시킬 수 있다. 벤치가 꽉 찬 상태에서 추가 퇴각이 발생하면 게임 오버.

## 핵심 메카닉

- **출격 순서가 전략의 핵심**: 컬러 레이어링 보드에서 외곽 큐브가 내부 큐브의 LoS를 차단 → 잘못된 원소를 먼저 출격하면 벤치행
- **벤치 압박**: 벤치 5/5에 도달하면 게임 오버 → 출격 순서 실수의 패널티
- **재출격**: 보드 상태가 변하면(다른 히어로가 외곽 큐브 제거) 벤치 히어로 재출격 기회 발생

## 요구사항

### 기능 요구사항

- [x] FR-01: 풀 오비트 완주 (`orbit.completed === true`) + AP 잔여 (`hero.ap > 0`) 시 히어로를 벤치로 이동
- [x] FR-02: 벤치 슬롯 수 = `LevelData.benchSlots` (기본 5)
- [x] FR-03: 벤치에 빈 슬롯이 없으면 게임 오버 (`reason: 'bench_full'`)
- [x] FR-04: 벤치 히어로의 `lanePosition = -2` (벤치 마커)
- [x] FR-05: 플레이어가 벤치 슬롯을 탭하면 해당 히어로를 벨트에 재배치 (`deployFromBench`)
- [x] FR-06: 재출격 후 매칭 타겟이 여전히 없으면 다시 벤치로 퇴각
- [x] FR-07: 재출격 시 벨트가 꽉 차 있으면 게임 오버 (`reason: 'belt_full'`)
- [x] FR-08: 벤치 상태 변경 시 이벤트 발행 (`HERO_BENCHED`, `BENCH_FULL`)

### 비기능 요구사항

- [x] NFR-01: 벤치 UI는 PuzzleScene에서 벨트 하단에 5슬롯 표시 (64×64, 중앙 정렬)
- [x] NFR-02: 히어로 퇴각 애니메이션 (벨트 → 벤치 슬롯, 400ms)
- [x] NFR-03: 벤치 카운터 4/5 → 노란색 경고, 5/5 → 빨간색
- [x] NFR-04: 벤치 히어로는 큐 히어로와 동일한 외형 (원소 텍스처 + AP 텍스트)

## 기술 힌트

- **Core Logic**: `src/core/TurnResolver.ts` — `deployHero()` 내 벤치 판정, `deployFromBench(slotIdx)` 메서드
- **Conveyor**: `src/core/ConveyorState.ts` — `moveToWaiting(hero)`, `removeFromWaiting(heroId)`, `getWaitingSlots()`, `waitingCount()`, `isOverloaded()`
- **Types**: `src/types/puzzle.ts` — `DeployResult.heroBenched`, `DeployResult.gameOverReason`
- **Events**: `src/types/events.ts` — `GameEvents.HERO_BENCHED`, `GameEvents.BENCH_FULL`
- **Config**: `src/config/balance.ts` — `DEFAULT_BENCH_SLOTS: 5`, `BENCH_SLOT_SIZE: 64`, `BENCH_SLOT_GAP: 8`, `BENCH_RETREAT: 400`
- **Scene**: `src/scenes/PuzzleScene.ts` — `createBenchArea()`, 오비트 완료 콜백 내 벤치 애니메이션, 벤치 슬롯 탭 핸들러

## 슬롯 할당 알고리즘

`ConveyorState.moveToWaiting()`:

1. `waitingSlots[]` 배열에서 첫 번째 `null` 슬롯 탐색
2. 해당 슬롯에 히어로 배치
3. 빈 슬롯이 없으면 `false` 반환

**주의**: 슬롯 제거 후 재배치 시 sparse array가 됨 (중간에 null 가능). 비주얼 인덱스는 `getBenchSlots()`에서 heroId로 검색해야 정확함.

## 테스트 기준

- [x] TC-01: 풀루프 완주 + AP 잔여 → `heroBenched === true`, `waitingCount() === 1`
- [x] TC-02: AP 소진 후 풀루프 → `heroBenched === false` (정상 소멸)
- [x] TC-03: 벤치 5/5 상태에서 추가 퇴각 → `gameOver === true`, `reason === 'bench_full'`
- [x] TC-04: `deployFromBench()` 호출 → 히어로가 벨트에 재배치되어 오비트 실행
- [x] TC-05: 재출격 후 매칭 없음 → 다시 벤치로 퇴각
- [x] TC-06: 벤치에서 재출격 시 벨트 만석 → `gameOver`, `reason === 'belt_full'`

## 레벨 데이터 영향

- **스키마 변경**: `LevelData.benchSlots` 필드 (기존 `conveyorSlots`와 동일 레벨)
- **기존 레벨 마이그레이션**: 전 10스테이지에 `"benchSlots": 5` 추가 완료

## 밸런스 파라미터

| 파라미터             | 값  | 출처       | 근거                           |
| -------------------- | --- | ---------- | ------------------------------ |
| DEFAULT_BENCH_SLOTS  | 5   | balance.ts | 충분한 여유 + 긴장감 사이 균형 |
| BENCH_RETREAT (ms)   | 400 | balance.ts | 퇴각 애니메이션 길이           |
| BENCH_SLOT_SIZE (px) | 64  | balance.ts | 히어로 원본 크기 유지          |
| BENCH_SLOT_GAP (px)  | 8   | balance.ts | 슬롯 간 최소 터치 간격         |

## 게임 오버 조건 (3가지)

| reason       | 조건                             | 트리거 위치                         |
| ------------ | -------------------------------- | ----------------------------------- |
| `no_heroes`  | 큐 + 벤치 모두 빔, 보드 미클리어 | `deployHero()` 끝                   |
| `bench_full` | 벤치 5/5에서 추가 퇴각 시도      | `deployHero()`, `deployFromBench()` |
| `belt_full`  | 벤치에서 재출격 시 벨트 6/6 만석 | `deployFromBench()`                 |

## 미결 사항

없음 — 전 기능 구현 및 검증 완료.
