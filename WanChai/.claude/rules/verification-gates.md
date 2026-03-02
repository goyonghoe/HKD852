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

### UX-GATE 필수 트리거 조건
> 아래 중 하나라도 해당하면 `/ux-gate` 실행 필수 (생략 불가)

1. **신규 UI 컴포넌트**: Overlay, Panel, Popup, Button 등 새 UI 요소 추가
2. **기존 UI 수정**: 좌표, 크기, 색상, 폰트, 정렬 등 시각 속성 변경
3. **씬 레이아웃 변경**: 요소 배치 순서/간격/앵커 변경
4. **오버레이/모달**: SettingsOverlay, PauseOverlay 등 오버레이 내부 변경
5. **인터랙션 영역**: 터치 타겟, 히트 영역, 스크롤 영역 수정

### UX-GATE 검증 항목 (최소)
- [ ] 모든 UI 요소가 부모 패널/컨테이너 경계 내에 위치
- [ ] 터치 타겟 최소 48dp (모바일)
- [ ] 폰트 14px 이상
- [ ] 라벨 X 좌표 일관성 (같은 역할의 라벨은 같은 X)
- [ ] 5-segment 게이지 등 반복 요소의 좌우 마진 ≥ 8px

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

## Gate 8: 보스 클리어 플로우 검증 (After Boss/Stage/Phase Changes)
> 보스 사망, 스테이지 전환, phase 상태머신, 레벨업 관련 코드 변경 시 반드시 수행 (M-008, M-013, M-014 방지)

**트리거**: `onEnemyDeath`, `applyUpgrade`, `showStageClear`, `nextStage`, `showLevelUpUI`, `pendingStageClear`, `bossStageActive`, `phase` 관련 코드 수정 시

**검증 체크리스트**:
1. **보스 사망 + 레벨업 동시 발생 트레이스**:
   - `onEnemyDeath`: `pendingStageClear=true` 후 레벨업 발생 경로 확인
   - `applyUpgrade`: `pendingStageClear` 소비 시 `this.phase`가 `showStageClear` 가드를 통과할 값으로 설정되는지 확인
   - `showStageClear`: 실제 호출 시점의 `this.phase` 값 트레이스

2. **보스 사망 + 레벨업 미발생 트레이스**:
   - `onEnemyDeath` 직접 경로에서 `delayedCall` 콜백 시점의 `this.phase` 값 확인

3. **phase 연속성 확인** (끊김 없이 전이해야 함):
   ```
   playing → (boss dies) → levelup → (upgrade) → playing → (delay) → stage_clear → (button) → playing
   playing → (boss dies, no levelup) → playing → (delay) → stage_clear → (button) → playing
   ```

4. **결과**: `BOSS_FLOW:PASS` 또는 `BOSS_FLOW:FAIL(끊김지점)` 기록

**FAIL 시 배포 금지.**

---

## 검증 로그 형식 (SESSION_LOG.md)
```
[HH:MM] BUILD:PASS TESTS:392/0/392
[HH:MM] WIRING:PASS (RunMapScene→PuzzleScene: combatMode=true, enemyGrid 확인)
[HH:MM] /gd-review SPEC-017 PASS (5/5 FR, 3/3 TC)
```
