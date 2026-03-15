---
name: qa-report
description: 'QA 결과 종합 HTML 리포트 — 전체 스킬 결과를 대시보드로 생성'
user-invocable: true
allowed-tools: Read, Write, Bash, Glob, Grep
model: sonnet
---

# /qa-report — QA 종합 리포트

## 역할

QA 에이전트로서 개별 QA 스킬 결과를 종합하여 인터랙티브 HTML 대시보드를 생성합니다.

## 절차

### 1. 개별 QA 실행

아래 5개 QA를 순서대로 실행하고 결과를 수집합니다:

1. `/qa-smoke` — 빌드+테스트+타입
2. `/qa-type` — 타입 안전성
3. `/qa-balance` — 밸런스 수치
4. `/qa-regression HEAD~5` — 최근 변경 영향도
5. `/qa-spec all` — 기획서 정합성

> 각 QA를 직접 실행하지 않고, 해당 스킬의 절차를 이 스킬 내에서 수행합니다.

### 2. HTML 리포트 생성

- **템플릿**: `outputs/templates/` 에서 `dashboard` 템플릿 참조
- **출력**: `WanChai/outputs/qa-report-[YYYY-MM-DD].html`

### 3. 리포트 구성

```
┌─────────────────────────────────────┐
│  QA Dashboard — WanChai NeonSurvivor │
│  [날짜] [PASS/FAIL 뱃지]            │
├─────────────────────────────────────┤
│                                      │
│  📊 요약 카드 (5개)                  │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│  │SM│ │TY│ │BA│ │RG│ │SP│          │
│  └──┘ └──┘ └──┘ └──┘ └──┘          │
│                                      │
│  🔴 Critical Issues (접이식)         │
│  🟡 Warnings (접이식)                │
│  🟢 Passed Checks (접이식)           │
│                                      │
│  📈 트렌드 (이전 리포트 비교)        │
│  📋 상세 로그 (탭 전환)              │
└─────────────────────────────────────┘
```

### 4. 한글 타이포그래피 적용

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css');
body {
  font-family: 'Pretendard', 'Noto Sans KR', -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.8;
  word-break: keep-all;
}
```

### 5. 결과 안내

```
📊 QA Report 생성 완료
파일: WanChai/outputs/qa-report-[날짜].html
결과: PASS / FAIL (N건 이슈)
```

## 규칙

- 코드 수정하지 않음 (분석 + 리포트 생성만)
- 이전 리포트가 있으면 트렌드 비교 포함
- FAIL 항목은 우선순위 + 추천 수정 방향 제시
