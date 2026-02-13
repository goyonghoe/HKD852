---
name: factory
description: "Income Factory 일일 파이프라인 실행"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch
recommended-model: sonnet
model-reason: "파이프라인 조율은 Sonnet이 적합"
---

# /factory — Income Factory 일일 오케스트레이터

매일 실행하여 아이디어 생성부터 런칭까지의 파이프라인을 조율합니다.

## 실행 절차

### 1. 현황 파악

먼저 현재 파이프라인 상태를 확인합니다:

```
Income_Factory/pipeline/
├── ideas/      → 오늘 날짜 파일이 있는가?
├── plans/      → 진행 중인 프로젝트가 있는가?
├── products/   → 빌드 완료된 제품이 있는가?
└── launches/   → 런칭 대기 중인 것이 있는가?
```

`data/learnings/` 폴더에서 최근 학습 내용을 읽어 반영합니다.

### 2. 오늘의 액션 결정

**상태에 따른 우선순위:**

| 상태 | 액션 |
|------|------|
| 빌드 중인 프로젝트 있음 | → `/idea-build` 또는 `/idea-review` 계속 |
| 리뷰 통과 대기 | → `/idea-launch` 실행 |
| 진행 중 프로젝트 없음 | → `/idea-scan` → `/idea-eval` → `/idea-critic` 새 사이클 |
| 금요일 | → `/idea-analyze` 주간 분석 추가 실행 |

### 3. 파이프라인 실행

순서대로 스킬을 호출합니다:

**신규 아이디어 사이클:**
```
/idea-scan → pipeline/ideas/YYYY-MM-DD.yaml (10개)
     ↓
/idea-eval → pipeline/ideas/YYYY-MM-DD-eval.yaml (Top 3)
     ↓
/idea-critic → pipeline/ideas/YYYY-MM-DD-decision.yaml (Kill/Proceed)
     ↓
Proceed된 아이디어가 있으면:
/idea-plan → pipeline/plans/{project-id}/plan.yaml
```

**빌드 사이클:**
```
/idea-build → pipeline/products/{project-id}/ (제품 파일)
     ↓
/idea-review → Pass/Revise/Kill
     ↓
Pass → /idea-launch → pipeline/launches/{project-id}/
Revise → /idea-build 재실행 (최대 2회)
Kill → 폐기, 사유 기록
```

### 4. 일일 요약 출력

파이프라인 실행 후 아래 형식으로 요약합니다:

```markdown
## 📋 Income Factory 일일 보고

### 날짜: YYYY-MM-DD

### 오늘의 아이디어 (신규)
- [아이디어 1] — 점수: XX — 판정: Kill/Proceed
- [아이디어 2] — ...

### 진행 중 프로젝트
| 프로젝트 | 단계 | 진행률 | 다음 액션 |
|----------|------|--------|----------|

### 런칭 완료
- [제품명] → [플랫폼] → [링크]

### 누적 현황
- 런칭된 제품: N개
- 이번 주 수익: $XX
```

## 입력

없음 (매일 자동 실행) 또는 선택적 파라미터:
- `mode=scan` — 아이디어 스캔만
- `mode=build` — 빌드 사이클만
- `mode=analyze` — 주간 분석만

## 출력

일일 보고 + 파이프라인 상태 갱신
