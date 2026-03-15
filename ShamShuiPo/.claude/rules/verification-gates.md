---
paths:
  - "src/**/*.ts"
  - "tests/**/*.ts"
---

# Verification Gates — 필수 검증 체크포인트

## Gate 1: 구현 후 (After Implementation)

- src/ 또는 tests/ 코드 변경 후 반드시 빌드+테스트 실행
- `npm run build && npm test -- --run`
- BUILD:PASS + TESTS:ALL_PASS 확인 후에만 다음 단계 진행
- 실패 시: 즉시 수정, 깨진 상태 누적 금지

## Gate 2: 리팩토링 후 (After Refactoring)

- 테스트 수 변화 없어야 함 (행동 보존 = 테스트 수 유지)
- 테스트 수 변경 시: 의도하지 않은 동작 변경 가능성 조사

## Gate 3: 핸드오프 전 (Before Status Update)

- status.json에 `implStatus: "implemented"` 기록 전:
  1. 빌드+테스트 PASS
  2. /gd-review [spec-id] PASS 또는 수동 검증

## Gate 4: 배포 전 (Before Deploy) — 필수 체인

- **빌드+테스트 PASS** — 항상 필수
- **WIRING:PASS** — 새 씬/플래그/모드 추가 시 필수 (Gate 5)
- **UX-GATE:PASS** — UI 변경 포함 시 `/ux-gate` PASS 필수. Grade B 미만 시 배포 금지.
  - About Face 12원칙 MUST 체크리스트 기반 자동 검증
  - 폰트 16px 최소, 터치 48dp 최소, 마진 16px, 간격 8px, colors.ts 색상, 버튼 피드백
  - 레퍼런스: `design/reference/about-face-ux-principles.md`, `design/reference/ui-ux-guideline.md`
- 위 게이트 미통과 시 배포 실행 거부

## Gate 5: 통합 배선 검증 (After New System/Mode)

> 새 시스템, 모드, 플래그 추가 시 반드시 수행

1. **진입점 추적**: 유저가 실제로 해당 기능에 도달하는 씬 전환 경로를 코드로 트레이스
2. **플래그 활성화 확인**: 새 boolean 플래그가 `true`로 설정되는 코드가 존재하는지 검증
3. **함수 호출 확인**: 새로 만든 함수/생성자가 src/scenes/에서 실제 호출되는지 검증
4. **데이터 전달 확인**: 씬 간 전달 데이터에 필수 필드가 포함되는지 확인

**FAIL 시 배포 금지.**

## Gate 6: 배포 후 스모크 체크 (After Deploy)

1. 주요 씬 전환 경로가 올바른 데이터를 전달하는지 최종 확인
2. 새 기능의 시각적 결과물이 실제 렌더링 경로에 포함되는지 확인
3. 콘솔 에러 없는지 확인
