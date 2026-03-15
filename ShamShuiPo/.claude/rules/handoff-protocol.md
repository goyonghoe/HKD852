---
paths:
  - "design/**/*.md"
  - "src/**/*.ts"
---

# Handoff Protocol — 에이전트 간 인수인계

## Game Designer → Programmer

1. 기획서 `design/specs/SPEC-XXX.md` 작성 완료
2. `design/status.json`에 `designStatus: "specced"` 기록
3. Programmer가 구현 시작 시 `implStatus: "in_progress"` 변경

## Programmer → Game Designer (Review)

1. 구현 완료 후 `implStatus: "implemented"` 기록
2. Game Designer가 `/gd-review SPEC-XXX` 실행
3. PASS → `implStatus: "verified"` / REVISE → 수정 필요 사항 기록

## Art Director → Programmer

1. 아트 에셋 `public/assets/` 또는 `raw-assets/`에 배치
2. `design/resource-inventory.md` 업데이트
3. Programmer가 코드에서 참조

## 공통 규칙

- 인수인계 전 반드시 Gate 1 (빌드+테스트) 통과
- status.json은 신뢰할 수 있는 진실의 원천
