# Mistake Registry — Known Pitfalls & Prevention Rules

> 모든 세션에 자동 로드. 변경 전 아래 패턴 확인 필수.

## M-001 | Architecture | core/에 Phaser import 금지
- **What**: src/core/에서 import Phaser 사용
- **Root cause**: Phaser.Math 유틸 필요해서 임포트
- **Prevention**: core/는 순수 TS만. Phaser 유틸 필요 시 순수 함수로 추출 → src/utils/

## M-002 | Balance | 게임 로직에 매직 넘버
- **What**: 콤보 배율 0.15를 TurnResolver에 하드코딩
- **Root cause**: balance.ts 확인 없이 빠른 수정
- **Prevention**: 모든 수치 상수는 src/config/balance.ts에서만. 없으면 추가.

## M-003 | Colors | colors.ts 외부 hex 리터럴
- **What**: 씬 파일에서 0xff4444 직접 사용
- **Root cause**: 디자인 문서에서 복사
- **Prevention**: 모든 색상은 src/config/colors.ts에서만. 없으면 추가.

## M-004 | Testing | 리팩토링 후 테스트 미실행
- **What**: 이름 변경 후 테스트 3개 실패
- **Root cause**: "안전한" 변경이라 테스트 스킵
- **Prevention**: 모든 코드 변경 후 npm test 필수. 예외 없음.

## M-005 | Session | 세션 끊김 후 이전 작업 반복
- **What**: 이전 세션에서 완료한 작업을 다시 수행
- **Root cause**: 체크포인트 시스템 부재
- **Prevention**: 세션 시작 시 SESSION_LOG.md 읽기. "Next Steps" 확인.

## M-006 | Status | status.json 업데이트 누락
- **What**: 구현 완료했지만 status.json 반영 안 함
- **Root cause**: 구현에 집중하다 문서 갱신 잊음
- **Prevention**: 구현 완료 후 /design-status-sync 반드시 실행.

## M-007 | Types | 타입 미스매치 런타임 에러
- **What**: RunState 필드 변경 후 참조 코드 미수정
- **Root cause**: 타입 정의만 바꾸고 사용처 미갱신
- **Prevention**: 타입 변경 시 npm run build로 TS 컴파일 에러 전수 확인.

## M-008 | Integration | 씬 간 데이터 배선 누락 (Dead Code 배포)
- **What**: SPEC-021 전투 시스템 6개 Phase (A~F) 전부 구현 + 564 테스트 PASS 했지만, 실제 게임에서 전투 모드가 전혀 활성화되지 않음. 적 HP/ATK 표시 없음, 기존 큐브 퍼즐 그대로.
- **Root cause**:
  1. `RunManager.beginBattle()`이 `generateBattleBoard()` (큐브 전용) 호출 → `generateCombatBoard()` (적 전용)을 호출해야 했음
  2. `RunMapScene` → `PuzzleScene` 전환 시 `combatMode: true` 플래그 미전달
  3. `PuzzleScene.init()`에서 `combatMode` 기본값 `false` → 전투 분기 영원히 미진입
- **Impact**: 코어 로직 + 씬 렌더링 + VFX + 테스트 전부 작성했지만, 유저가 플레이할 때 0% 동작. Dead code 상태로 배포됨.
- **Prevention**:
  1. **ALWAYS** 새 시스템 구현 후 "씬 전환 배선 체크리스트" 수행 (Gate 5 참조)
  2. **ALWAYS** 배포 전 실제 게임 플로우를 코드로 추적: 어떤 씬이 어떤 데이터를 전달하는지 `grep 'scene.start\|scene.launch'` 확인
  3. **NEVER** 유닛 테스트만으로 통합 완료 판정하지 않음. 씬 간 데이터 전달은 별도 검증 필수
  4. **ALWAYS** 새 플래그/모드 추가 시, 해당 플래그를 `true`로 설정하는 코드가 실제 존재하는지 `grep`으로 확인

## M-009 | Testing | 유닛 테스트 PASS ≠ 통합 동작 보장
- **What**: 564개 유닛 테스트 전부 통과했지만 실제 게임에서 동작하지 않음
- **Root cause**: 유닛 테스트는 개별 클래스를 직접 생성 (`new CombatResolver(...)`)하여 검증 → 씬에서 그 클래스가 실제로 생성되는지는 미검증
- **Impact**: 테스트 커버리지가 높아도 통합 배선 누락 탐지 불가
- **Prevention**:
  1. **ALWAYS** 새 시스템 구현 시 "호출 경로 검증"을 테스트 Phase에 포함: 진입점(씬) → 핵심 클래스 생성 경로가 실행 가능한지 코드 트레이스
  2. **ALWAYS** `grep`으로 새 함수/클래스가 src/scenes/에서 실제 호출되는지 확인
  3. **NEVER** "빌드 PASS + 테스트 PASS"만으로 배포 승인하지 않음

## M-010 | Integration | 층 진행 로직 일부 씬에만 존재
- **What**: RewardScene만 floor advancement 로직 보유. Rest/Shop/Event는 단순 RunMapScene 복귀 → Layer 3 방문 후 게임 멈춤
- **Root cause**: RewardScene에서 로직 작성 후 다른 씬에 복사하지 않음. 코드 중복 대신 공통화 필요했음
- **Prevention**:
  1. **ALWAYS** 씬 복귀 로직은 `navigateAfterNode()` 공통 유틸 사용. 인라인 `scene.start('RunMapScene')` 금지
  2. **ALWAYS** 새 노드 타입 추가 시 해당 씬의 onContinue가 `navigateAfterNode` 호출하는지 확인

## M-011 | Process | UX 경험 설계서 없이 UI 구현
- **What**: 13개 씬 UI가 10~14px 폰트, 작은 터치 영역, 겹침 등 전면 부실
- **Root cause**: "무엇을 느끼게 할 것인가" 설계 없이 수치/메카닉만 구현
- **Prevention**:
  1. **ALWAYS** `/gd-experience` 실행 후 UI 구현 시작
  2. **ALWAYS** `/ux-gate` PASS 전 배포 금지
  3. **NEVER** 14px 미만 폰트 사용, 48dp 미만 터치 타겟 사용

## M-012 | Process | 사전 게이트 없이 배포 (UX 미검증)
- **What**: 자동 추천 버튼을 40px 높이 + 카운터 텍스트 옆 cx+200에 배치한 채 /ux-gate 미실행 후 배포
- **Root cause**: 빌드+테스트 PASS만 확인하고 바로 `vercel deploy --prod` 실행. 핸드오프 프로토콜 Step 6~7 건너뜀
- **Impact**: CEO가 "자동 추천 버튼 위치 왜이러니? 에이전트가 검토를 해야 하는거 아니야?" 지적
- **Prevention**:
  1. **ALWAYS** UI 변경 포함 시 배포 전 `/ux-gate` 실행
  2. **ALWAYS** 새 씬/플래그 추가 시 배포 전 `/pg-wiring-check` 실행
  3. **NEVER** `/pg-deploy`에서 사전 게이트 체인을 건너뛰지 않음
  4. **ALWAYS** `/pg-deploy` 스킬 내 Gate 0-A/0-B/0-C 필수 체크

---

## 새 항목 추가 방법
1. `/log-mistake "[설명]"` 스킬 사용 또는 직접 편집
2. 다음 M-XXX ID, 카테고리, 구체적 예방 규칙 (NEVER/ALWAYS 형식)
3. 중복 확인 후 추가
