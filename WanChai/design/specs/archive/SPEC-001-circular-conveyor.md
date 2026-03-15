# [SPEC-001] Circular Conveyor Belt

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P0
- **예상 공수**: XL

## 요약

보드를 사각형으로 감싸는 순환형 컨베이어 벨트. 히어로가 벨트를 따라 이동하며 안쪽 큐브를 향해 발사하는 핵심 메카닉.

## 요구사항

### 기능 요구사항

- [x] FR-01: 벨트는 보드 외곽을 TOP→RIGHT→BOTTOM→LEFT 순으로 순환
- [x] FR-02: 총 벨트 포지션 = 2 × (rows + cols)
- [x] FR-03: 히어로는 seq=0 (좌상단)에서 벨트에 진입
- [x] FR-04: 히어로는 AP를 소비하며 한 포지션씩 전진
- [x] FR-05: 각 포지션에서 안쪽 방향으로 매칭 큐브에 발사
- [x] FR-06: AP 소진 또는 1바퀴 완주 시 히어로 퇴장
- [x] FR-07: 벨트 동시 탑승 제한 (conveyorSlots)
- [x] FR-08: 대기 슬롯(benchSlots)에 소진된 히어로 보관

### 비기능 요구사항

- [x] NFR-01: Phaser 무의존 순수 TypeScript 구현
- [x] NFR-02: 벨트 렌더링은 BeltPath의 부드러운 곡선 경로 사용

## 기술 힌트

- Core logic: `src/core/ConveyorState.ts`
- Path rendering: `src/utils/BeltPath.ts`
- Types: `src/types/puzzle.ts` (BeltPosition, BeltEdge, BeltHero)

## 테스트 기준

- [x] TC-01: 4x6 보드 벨트 포지션 수 = 20
- [x] TC-02: 6x6 보드 벨트 포지션 수 = 24
- [x] TC-03: 히어로 배치 후 seq=0에 위치
- [x] TC-04: advance()로 1포지션 전진, 1바퀴 시 true 반환
- [x] TC-05: conveyorSlots 초과 시 배치 거부

## 레벨 데이터 영향

- Schema: `conveyorSlots`, `benchSlots` 필드 사용
- 기존 레벨 영향: 없음

## 밸런스 파라미터

| 파라미터      | 값  | 출처       | 근거                  |
| ------------- | --- | ---------- | --------------------- |
| conveyorSlots | 5~6 | level JSON | 동시 벨트 히어로 수   |
| benchSlots    | 5   | level JSON | 소진 히어로 대기 공간 |

## 엣지별 발사 방향

| 엣지   | 방향    | 대상                       |
| ------ | ------- | -------------------------- |
| TOP    | ↓ DOWN  | 해당 컬럼의 가장 위 큐브   |
| RIGHT  | ← LEFT  | 해당 행의 가장 오른쪽 큐브 |
| BOTTOM | ↑ UP    | 해당 컬럼의 가장 아래 큐브 |
| LEFT   | → RIGHT | 해당 행의 가장 왼쪽 큐브   |
