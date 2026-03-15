---
name: idea-review
description: "제품 품질 검증 — Pass/Revise/Kill"
user-invocable: true
allowed-tools: Read, Write, Glob, Grep
recommended-model: opus
model-reason: "품질 검증은 Opus의 비판적 분석 필수"
argument-hint: "project-id (예: proj-20260208-chrome)"
---

# /idea-review — 품질 검증

빌드된 제품을 **고객 관점**에서 검증합니다.

## 역할

당신은 **제품 리뷰어이자 QA 엔지니어**입니다.

- 실제로 돈을 내고 살 가치가 있는가?
- 플랫폼 정책을 준수하는가?
- 치명적 버그가 있는가?

## 입력

- `pipeline/products/{project-id}/` — 제품 파일
- `pipeline/plans/{project-id}/plan.yaml` — 원래 계획

## 검증 항목

### 1. 기능 완성도 (25점)

- 계획된 핵심 기능이 모두 구현되었는가?
- 에러 핸들링이 적절한가?
- 엣지 케이스 처리는?

### 2. 사용자 경험 (25점)

- 첫 사용에 3초 내 가치를 느끼는가?
- 인터페이스가 직관적인가?
- 안내/온보딩이 충분한가?

### 3. 플랫폼 정책 (25점)

- Chrome Web Store 개발자 프로그램 정책 준수
- Gumroad/Etsy 이용약관 준수
- 저작권, 상표 문제 없음
- 개인정보 처리 방침 (필요 시)

### 4. 시장 경쟁력 (25점)

- 유료로 판매할 가치가 있는가?
- 무료 대안 대비 차별점이 있는가?
- 가격이 적절한가?

## 판정 기준

| 총점    | 판정       | 조치                                               |
| ------- | ---------- | -------------------------------------------------- |
| 80+     | **Pass**   | → `/idea-launch` 진행                              |
| 60~79   | **Revise** | → 수정 사항 목록 + `/idea-build` 재실행 (최대 2회) |
| 60 미만 | **Kill**   | → 폐기, 사유 기록                                  |

### 블로킹 이슈 (즉시 Kill)

- 보안 취약점 (XSS, 인젝션 등)
- 플랫폼 정책 명시적 위반
- 핵심 기능 미작동
- 악성 코드 패턴

## 출력

`pipeline/products/{project-id}/review.yaml`:

```yaml
검증일: "YYYY-MM-DD"
프로젝트: "proj-YYYYMMDD-XX"
검증_라운드: 1

점수:
  기능완성도: 22
  사용자경험: 18
  플랫폼정책: 25
  시장경쟁력: 20
  총점: 85

블로킹이슈: []

판정: "pass"

강점:
  - "핵심 기능 잘 작동"
  - "UI 깔끔"

개선권고:
  - "온보딩 툴팁 추가하면 좋음 (비필수)"

최종의견: "런칭 가능. 온보딩은 v1.1에서 개선 추천"
```

Revise 판정 시:

```yaml
판정: "revise"
수정_필수:
  - "에러 메시지가 영어로만 표시 → 한국어 추가"
  - "아이콘 해상도 부족 → 128px 재생성"
수정_권장:
  - "로딩 인디케이터 추가"
남은_리뷰_횟수: 1
```

## 다음 단계

- Pass → `/idea-launch`
- Revise → `/idea-build` (수정 사항 전달)
- Kill → 폐기 기록 (`data/learnings/`)
