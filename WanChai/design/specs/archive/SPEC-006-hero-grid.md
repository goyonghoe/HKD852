# [SPEC-006] Hero Grid Deployment

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P0
- **예상 공수**: L

## 요약

히어로를 2D 그리드(컬럼별)로 배치하여 플레이어가 어떤 원소 히어로를 먼저 보낼지 전략적으로 선택하는 시스템. 각 컬럼은 같은 원소 히어로로 구성되며, 컬럼 선택이 발사 순서를 결정한다.

## 요구사항

### 기능 요구사항

- [x] FR-01: heroGrid는 2D 배열 `HeroInstance[][]` — 각 inner array가 컬럼
- [x] FR-02: 각 컬럼의 첫 번째 히어로(front)만 배치 가능
- [x] FR-03: deployFromColumn(colIdx) → 해당 컬럼의 front 히어로를 벨트에 진입
- [x] FR-04: 빈 컬럼 선택 시 배치 거부
- [x] FR-05: 레벨 JSON에 heroGrid 필드 있으면 사용, 없으면 heroQueue를 단일 컬럼으로 래핑
- [x] FR-06: 모든 컬럼이 비면 게임 종료 조건 확인

### 비기능 요구사항

- [x] NFR-01: PuzzleScene에서 컬럼별 히어로 스택 시각화
- [x] NFR-02: front 히어로 하이라이트 + 터치 영역 제공

## 기술 힌트

- Deploy: `src/core/TurnResolver.ts` — deployFromColumn(), getHeroGrid(), peekColumn()
- Load: `src/core/LevelLoader.ts` — heroGrid or heroQueue wrapping
- Types: `src/types/level.ts` — LevelData.heroGrid, heroQueue
- Scene: `src/scenes/PuzzleScene.ts` — hero queue rendering, onDeployTap()

## 테스트 기준

- [x] TC-01: 컬럼 0에서 배치 → front 히어로 제거, 다음 히어로가 front
- [x] TC-02: 빈 컬럼 배치 시 success = false
- [x] TC-03: 범위 밖 colIdx → success = false
- [x] TC-04: heroQueue만 있는 레벨 → 단일 컬럼으로 래핑

## 히어로 인스턴스 구조

```typescript
interface HeroInstance {
  id: string; // 고유 ID
  definitionId: string; // "fire_basic" 등
  element: ElementColor; // 원소
  ap: number; // 현재 AP
  maxAP: number; // 최대 AP
  lanePosition: number; // 벨트 포지션
  isSpent: boolean; // 소진 여부
}
```

## 레벨 데이터 형식

```json
{
  "heroGrid": [
    [
      { "element": "fire", "ap": 3 },
      { "element": "fire", "ap": 2 }
    ],
    [
      { "element": "water", "ap": 3 },
      { "element": "water", "ap": 2 }
    ],
    [{ "element": "earth", "ap": 3 }]
  ]
}
```

## 밸런스 파라미터

| 파라미터      | 현재값 | 근거                                             |
| ------------- | ------ | ------------------------------------------------ |
| 컬럼 수       | 3~4    | 원소 수에 맞춤 (2원소=4컬럼, 3원소=3~4, 4원소=4) |
| 컬럼당 히어로 | 2~3    | 스택 깊이 = 전략 depth                           |
