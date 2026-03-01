# [SPEC-004] Armored Cubes

## 메타
- **작성자**: Game Designer (retroactive)
- **작성일**: 2026-02-24
- **상태**: verified
- **우선순위**: P1
- **예상 공수**: M

## 요약
HP가 2 이상인 강화 큐브. 일반 큐브(HP 1)와 달리 여러 번 타격해야 파괴된다. 시각적으로 메탈릭 보더와 HP 인디케이터로 구분.

## 요구사항

### 기능 요구사항
- [x] FR-01: 레벨 JSON의 `board.armored` 배열로 강화 큐브 지정
- [x] FR-02: armored 항목은 `{ row, col, hp }` 형태
- [x] FR-03: 매칭 히어로 타격 시 HP 1 감소 (damageCube)
- [x] FR-04: HP 0 도달 시 파괴 (일반 큐브와 동일)
- [x] FR-05: HP > 0인 동안 LoS를 차단하지 않음 (투명 LoS 규칙 적용)
- [x] FR-06: 시각적 구분: 메탈릭 실버 보더 (4px), HP 숫자 오버레이

### 비기능 요구사항
- [x] NFR-01: 텍스처 프로시저럴 생성 (renderArmoredCube)
- [x] NFR-02: 타격 시 HP 바/숫자 업데이트 피드백

## 기술 힌트
- Board logic: `src/core/BoardState.ts` — damageCube(), getArmoredHp()
- Level data: `src/types/level.ts` — LevelData.board.armored
- Texture: `src/utils/TextureFactory.ts` — armored cube variants
- Rendering: `src/utils/PixelArtRenderer.ts` — renderArmoredCube()

## 테스트 기준
- [x] TC-01: armored HP 2 큐브에 1타격 → HP 1 (미파괴)
- [x] TC-02: armored HP 2 큐브에 2타격 → HP 0 (파괴)
- [x] TC-03: armored 미지정 큐브는 HP 1 (기본)
- [x] TC-04: 파괴된 armored 큐브는 LoS에서 건너뜀

## 레벨 데이터 영향
- Schema: `board.armored[]` 배열 (optional)
- 첫 도입: W1-S004 "Iron Fortress"
- 기존 레벨 영향: 없음 (armored 미지정 시 기본 HP 1)

## 밸런스 파라미터
| 파라미터 | 현재값 | 범위 | 근거 |
|-----------|---------|-------|-----------|
| Armored HP | 2 | 2~4 | 현재 HP 2만 사용, 향후 3+ 가능 |
| Score | 일반 큐브와 동일 (100/큐브) | - | HP 소비가 페널티, 추가 보상 불요 |
