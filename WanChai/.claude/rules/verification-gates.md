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
- 결과를 SESSION_LOG.md에 기록

## Gate 4: 배포 전 (Before Deploy) — 필수 체인
- **빌드+테스트 PASS** — 항상 필수
- **WIRING:PASS** — 새 씬/플래그/모드 추가 시 필수 (Gate 5)
- **UX-GATE:PASS** — UI 변경 시 필수 (Gate 7 = /ux-gate)
- 위 게이트 미통과 시 `/pg-deploy` 실행 거부
- `/pg-deploy` 스킬이 자체적으로 사전 게이트를 검증함

## Gate 5: 통합 배선 검증 (After New System/Mode)
> 새 시스템, 모드, 플래그 추가 시 반드시 수행 (M-008, M-009 방지)

1. **진입점 추적**: 유저가 실제로 해당 기능에 도달하는 씬 전환 경로를 코드로 트레이스
   ```bash
   grep -rn 'scene.start\|scene.launch' src/scenes/ | grep '관련씬명'
   ```
2. **플래그 활성화 확인**: 새 boolean 플래그가 `true`로 설정되는 코드가 존재하는지 검증
   ```bash
   grep -rn '플래그명.*true\|플래그명.*=' src/
   ```
3. **함수 호출 확인**: 새로 만든 함수/생성자가 src/scenes/에서 실제 호출되는지 검증
   ```bash
   grep -rn '새함수명\|new 새클래스명' src/scenes/
   ```
4. **데이터 전달 확인**: 씬 간 전달 데이터에 필수 필드가 포함되는지 확인
5. **결과**: `WIRING:PASS` 또는 `WIRING:FAIL(누락항목)` 기록

**FAIL 시 배포 금지. 배선 수정 후 Gate 1부터 재검증.**

## Gate 6: 배포 후 스모크 체크 (After Deploy)
> 배포 후 최소한의 플레이 경로 코드 트레이스

1. 주요 씬 전환 경로가 올바른 데이터를 전달하는지 최종 확인
2. 새 기능의 시각적 결과물(스프라이트, UI, VFX)이 실제 렌더링 경로에 포함되는지 확인
3. 콘솔 에러 없는지 `vercel inspect --logs` 확인

---

## 검증 로그 형식 (SESSION_LOG.md)
```
[HH:MM] BUILD:PASS TESTS:392/0/392
[HH:MM] WIRING:PASS (RunMapScene→PuzzleScene: combatMode=true, enemyGrid 확인)
[HH:MM] /gd-review SPEC-017 PASS (5/5 FR, 3/3 TC)
```
