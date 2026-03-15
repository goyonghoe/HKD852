# 코드 컨벤션

> M-001~M-016 실수 레지스트리, 검증 게이트, 코드 리뷰 체크리스트

관련 파일: `.claude/rules/mistake-registry.md`, `.claude/rules/verification-gates.md`

---

## 실수 레지스트리 (M-001 ~ M-016)

모든 세션에 자동 로드되며, 알려진 실수 패턴과 방지 규칙을 담습니다.

### M-001 | Architecture | core/에 Phaser import 금지

- `src/core/`는 순수 TypeScript만 허용
- Phaser 유틸 필요 시 `src/utils/`에 순수 함수로 추출

### M-002 | Balance | 게임 로직에 매직 넘버 금지

- 모든 수치 상수는 `src/config/balance.ts`에서만
- 없으면 `BALANCE` 객체에 추가

### M-003 | Colors | colors.ts 외부 hex 리터럴 금지

- 모든 색상은 `src/config/colors.ts`에서만
- `0xff4444` 직접 사용 금지

### M-004 | Testing | 리팩토링 후 테스트 실행 필수

- 모든 코드 변경 후 `npm test` 필수, 예외 없음

### M-005 | Session | 세션 시작 시 SESSION_LOG.md 읽기

- 이전 세션 완료 작업 반복 방지
- "Next Steps" 확인 후 작업 시작

### M-006 | Status | status.json 업데이트 누락 금지

- 구현 완료 후 `/design-status-sync` 반드시 실행

### M-007 | Types | 타입 변경 후 사용처 전수 확인

- `npm run build`로 TypeScript 컴파일 에러 전체 확인

### M-008 | Integration | 씬 간 데이터 배선 누락 (Dead Code 방지)

- 새 시스템 구현 후 실제 씬 전환 경로 코드 트레이스 필수
- `grep 'scene.start\|scene.launch' src/scenes/`로 확인

### M-009 | Testing | 유닛 테스트 PASS ≠ 통합 동작 보장

- 유닛 테스트와 별도로 씬에서 해당 코드가 실제 호출되는지 확인
- `grep 'new 새클래스명' src/scenes/`로 확인

### M-010 | Integration | 씬 복귀 로직은 공통 유틸 사용

- `scene.start()` 인라인 사용 금지, 공통 함수 사용

### M-011 | Process | UX 경험 설계서 없이 UI 구현 금지

- UI 구현 전 `/gd-experience` 실행
- 배포 전 `/ux-gate` PASS 필수
- 14px 미만 폰트, 48dp 미만 터치 타겟 금지

### M-012 | Process | 사전 게이트 없이 배포 금지

- UI 변경 시 배포 전 `/ux-gate` 실행
- 새 씬/플래그 추가 시 배포 전 `/pg-wiring-check` 실행

### M-013 | UI | 패널 경계 밖 UI 요소 금지

- UI 요소 배치 시: `요소_우측끝 = startX + count * (width + gap) ≤ panelRight`
- 같은 역할의 라벨은 동일한 X 좌표

### M-014 | Integration | 보스 사망 + 레벨업 동시 발생 Phase 소프트락

- `pendingStageClear` 소비 시 `this.phase`를 'playing'으로 전환 필수
- 보스 클리어 플로우 변경 시 Gate 8 수행

### M-015 | Integration | create() 내 초기화 순서

- `this.*` 필드 접근 메서드는 해당 필드 초기화 이후에만 호출
- `!` non-null assertion 필드 주의

### M-016 | UI | 동적 리스트 뷰포트 오버플로

- `totalHeight = startY + ceil(items/cols) * (cardH + gap) + footerH`
- `totalHeight > 1280px`이면 DragScroll 필수
- Back/Close 버튼은 스크롤 컨테이너 외부 고정

---

## Verification Gates (검증 게이트)

### Gate 1: 구현 후

```bash
npm run build && npm test -- --run
# BUILD:PASS + TESTS:ALL_PASS 확인
```

### Gate 2: 리팩토링 후

- 테스트 수 변화 없어야 함 (행동 보존)

### Gate 3: 핸드오프 전

- 빌드+테스트 PASS
- status.json 업데이트

### Gate 4: 배포 전 필수 체인

- [ ] `BUILD:PASS` — 항상 필수
- [ ] `WIRING:PASS` — 새 씬/플래그 추가 시 (Gate 5)
- [ ] `UX-GATE:PASS` — UI 변경 시 (Gate 7)

### Gate 5: 통합 배선 검증

```bash
# 씬 전환 경로 확인
grep -rn 'scene.start\|scene.launch' src/scenes/

# 새 플래그 활성화 코드 확인
grep -rn '플래그명.*true' src/

# 새 함수 호출 확인
grep -rn 'new 새클래스명' src/scenes/
```

### Gate 8: 보스 클리어 플로우 검증

보스/스테이지/Phase 관련 코드 변경 시:

1. `onEnemyDeath` → 보스 사망 경로 트레이스
2. `applyUpgrade` → `pendingStageClear` 소비 시 phase 전환 확인
3. `showStageClear` → phase 가드 통과 확인
4. 전체 phase 연속성 확인: `playing → levelup → playing → stage_clear → playing`

---

## 코드 리뷰 체크리스트

코드 PR/배포 전 확인:

- [ ] `src/core/`에 Phaser import 없음
- [ ] 새 수치가 `balance.ts`에 추가됨
- [ ] 새 색상이 `colors.ts`에 추가됨
- [ ] `npm run build` PASS
- [ ] `npm test -- --run` PASS (테스트 수 감소 없음)
- [ ] UI 변경 시: 터치 타겟 48dp 이상, 폰트 14px 이상
- [ ] 동적 리스트: 총 높이 계산 및 DragScroll 여부 확인
- [ ] 새 씬/플래그: 배선 체크 (`grep` 확인)
- [ ] 보스 관련 변경: Gate 8 수행
