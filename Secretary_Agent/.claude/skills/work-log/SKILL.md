---
name: work-log
description: "현재 작업 내용을 구조화된 작업 일지로 정리합니다"
user-invocable: true
argument-hint: "[작업 설명 또는 생략]"
allowed-tools: Read, Glob, Grep, Bash
recommended-model: haiku
model-reason: "단순 요약 및 정리 — Haiku로 충분"
---

# 작업 일지 스킬

> 작업 완료 후 호출하면, 수행한 작업을 구조화된 일지로 정리합니다.

## 실행 절차

### Step 1: 최근 변경 파일 탐색

```bash
# 최근 1시간 이내 변경된 파일
find . -mmin -60 -type f \( -name "*.md" -o -name "*.html" -o -name "*.py" -o -name "*.json" \)

# 최근 git 변경
git diff --name-only HEAD~1
```

### Step 2: 변경 내용 분석

변경된 파일의 내용을 읽어 다음을 파악:
- 어떤 에이전트가 관련되었는지
- 어떤 스킬이 사용되었는지
- 주요 산출물은 무엇인지

### Step 3: 작업 일지 작성

```markdown
# 작업 일지 — YYYY-MM-DD HH:MM

## 작업 요약
[1줄 요약]

## 상세 내용

### 수행 작업
| 순서 | 작업 | 담당 에이전트 | 사용 스킬 |
|------|------|------------|----------|
| 1 | ... | ... | ... |

### 산출물
| 파일 | 설명 |
|------|------|
| `경로/파일명` | 설명 |

### 주요 의사결정
- [결정 사항과 근거]

### 다음 단계
- [후속 작업 제안]
```

### Step 4: 파일 저장

산출물 경로: `Secretary_Agent/outputs/work_log_YYYY-MM-DD_HHMM.md`

## 인자 처리

- `$ARGUMENTS`가 비어있으면: 자동 탐지 모드 (최근 변경 기반)
- 작업 설명 제공 시: 해당 내용을 중심으로 일지 작성
  - 예: `/work-log 게임기획 배틀패스 분석 완료`
