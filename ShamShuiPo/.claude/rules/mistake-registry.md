---
paths:
  - "src/**/*.ts"
  - "tests/**/*.ts"
---

# Mistake Registry — Known Pitfalls & Prevention Rules

> 모든 세션에 자동 로드. 변경 전 아래 패턴 확인 필수.
> WanChai 프로젝트의 교훈을 초기부터 적용합니다.

## M-001 | Architecture | core/에 Phaser import 금지

- **Prevention**: core/는 순수 TS만. Phaser 유틸 필요 시 순수 함수로 추출 → src/utils/

## M-002 | Balance | 게임 로직에 매직 넘버

- **Prevention**: 모든 수치 상수는 src/config/balance.ts에서만. 없으면 추가.

## M-003 | Colors | colors.ts 외부 hex 리터럴

- **Prevention**: 모든 색상은 src/config/colors.ts에서만. 없으면 추가.

## M-004 | Testing | 리팩토링 후 테스트 미실행

- **Prevention**: 모든 코드 변경 후 npm test 필수. 예외 없음.

## M-005 | Integration | 씬 간 데이터 배선 누락 (Dead Code 배포)

- **Prevention**: 새 시스템 구현 후 씬 전환 배선 체크리스트 수행. 유닛 테스트만으로 통합 완료 판정하지 않음.

## M-006 | UI | 동적 리스트 뷰포트 오버플로

- **Prevention**: 동적 리스트 UI 구현 시 총 콘텐츠 높이 산술 계산. 초과 시 스크롤 적용 필수. Back 버튼은 스크롤 컨테이너 외부에 고정.

---

## 새 항목 추가 방법

1. `/log-mistake "[설명]"` 스킬 사용 또는 직접 편집
2. 다음 M-XXX ID, 카테고리, 구체적 예방 규칙 (NEVER/ALWAYS 형식)
