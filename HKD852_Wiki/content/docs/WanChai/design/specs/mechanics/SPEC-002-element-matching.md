# [SPEC-002] Element Matching & Line-of-Sight

## 메타

- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P0
- **예상 공수**: L

## 요약

6원소 매칭 시스템. 히어로가 벨트 포지션에서 안쪽으로 발사할 때, 시선(LoS) 경로에서 자신과 같은 원소의 큐브를 찾아 타격한다. 매칭되지 않는 큐브는 시선을 차단하지 않는다 (투명 LoS).

## 요구사항

### 기능 요구사항

- [x] FR-01: 6원소 정의 — Fire, Water, Earth, Wind, Light, Dark
- [x] FR-02: 각 원소는 고유 색상 3쉐이드 (base, highlight, shadow) 보유
- [x] FR-03: LoS 쿼리는 에지 방향 + 컬럼/행 인덱스 + 원소로 검색
- [x] FR-04: 매칭되지 않는 큐브는 LoS를 차단하지 않음 (투명 통과)
- [x] FR-05: 매칭 큐브 발견 시 HP 1 감소
- [x] FR-06: HP 0이 되면 큐브 파괴 (isDestroyed = true)
- [x] FR-07: 파괴된 큐브는 LoS에서 건너뜀

### 비기능 요구사항

- [x] NFR-01: 원소 색상은 `config/colors.ts`에서 중앙 관리

## 기술 힌트

- LoS 쿼리: `src/core/BoardState.ts` — `findFromTop()`, `findFromBottom()`, `findFromLeft()`, `findFromRight()`
- Types: `src/types/hero.ts` (ElementColor enum)
- Colors: `src/config/colors.ts` (ELEMENT_COLORS, ELEMENT_SHADES)

## 테스트 기준

- [x] TC-01: 같은 원소 큐브에 정확히 매칭
- [x] TC-02: 다른 원소 큐브는 LoS 차단 안함
- [x] TC-03: 파괴된 큐브 뒤의 큐브에 LoS 도달
- [x] TC-04: 빈 셀은 LoS 통과
- [x] TC-05: 보드 범위 밖이면 null 반환

## 원소 컬러 참조

| Element | Base     | Highlight | Shadow      |
| ------- | -------- | --------- | ----------- |
| Fire    | 0xe74c3c | 밝은 빨강 | 어두운 빨강 |
| Water   | 0x3498db | 밝은 파랑 | 어두운 파랑 |
| Earth   | 0x2ecc71 | 밝은 초록 | 어두운 초록 |
| Wind    | 0xf1c40f | 밝은 노랑 | 어두운 노랑 |
| Light   | 0xecf0f1 | 흰색      | 회색        |
| Dark    | 0x9b59b6 | 밝은 보라 | 어두운 보라 |

## 미결 사항

- [x] Q1: 원소 간 상성(어피니티) → 현재 미구현, 타입만 정의 (향후 확장)
