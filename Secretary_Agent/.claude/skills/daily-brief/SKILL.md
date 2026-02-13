---
name: daily-brief
description: "프로젝트 변경사항을 스캔하여 일일 브리핑을 생성합니다"
user-invocable: true
argument-hint: "[특정 에이전트명 또는 생략]"
allowed-tools: Read, Glob, Grep, Bash
recommended-model: sonnet
model-reason: "구조화된 요약 보고서 — Sonnet 최적"
---

# 일일 브리핑 스킬

> 매일 아침 프로젝트 상태를 스캔하여 대표(사용자)에게 브리핑을 제공합니다.

## 실행 절차

### Step 1: 변경사항 수집

```bash
# 어제 이후 git 변경 로그
git log --since=yesterday --oneline --all

# 최근 24시간 내 수정된 파일
find . -name "*.md" -o -name "*.html" -o -name "*.py" -mtime -1
```

### Step 2: 에이전트별 outputs 스캔

각 에이전트의 outputs/ 폴더에서 최신 산출물 확인:

```
Glob: */outputs/*
Glob: */pipeline/*
```

### Step 3: 브리핑 생성

다음 형식의 마크다운 파일을 생성합니다:

```markdown
# 일일 브리핑 — YYYY-MM-DD

## 어제 완료한 작업
| 본부 | 담당자 | 작업 내용 | 산출물 |
|------|--------|----------|--------|
| 제작본부 | 기획팀장 | ... | ... |

## 진행 중인 작업
- [에이전트] 작업 설명

## 주의사항
- 이슈/블로커가 있으면 표시

## 오늘 추천 작업
- 우선순위 순으로 제안
```

### Step 4: 파일 저장

산출물 경로: `Secretary_Agent/outputs/daily_brief_YYYY-MM-DD.md`

## 인자 처리

- `$ARGUMENTS`가 비어있으면: 전체 프로젝트 스캔
- 특정 에이전트명 지정 시: 해당 에이전트만 스캔
  - 예: `/daily-brief GameDesign_Agent`
