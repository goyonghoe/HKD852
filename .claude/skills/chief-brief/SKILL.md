---
name: chief-brief
description: "비서실장 일일 브리핑 — 용량 대시보드 + 추정 보정 포함"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
recommended-model: opus
model-reason: "일일 데이터 수집 + 요약 — Sonnet 최적"
---

# 비서실장 일일 브리핑 (Chief Brief)

> Kowloon의 하루를 여는 브리핑. 어제 실적, 오늘 용량, 주의사항을 한 장에 정리합니다.

## 경로 상수

```
PROJECT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852
SECRETARY_DATA=$PROJECT_ROOT/Secretary_Agent/data
SECRETARY_OUT=$PROJECT_ROOT/Secretary_Agent/outputs
KANBAN=$PROJECT_ROOT/PMO_Agent/kanban.json
VAULT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852_Vault
NOTIFY=$PROJECT_ROOT/Secretary_Agent/libs/notify.sh
```

## 실행 절차

### Step 1: 어제 커밋 수집

```bash
git log --since=yesterday --oneline --all
```

- 커밋 목록을 수집하여 어제 완료된 작업 파악

### Step 2: 진행 중 태스크 확인

```bash
# PMO_Agent/kanban.json 읽기
```

- Read로 `$KANBAN` 파일을 읽는다
- `status: "in_progress"` 인 태스크를 추출한다
- 각 태스크의 `project`, `title`, `assignee`, `priority` 필드를 정리한다

### Step 3: 추정 데이터 로드

```bash
# Secretary_Agent/data/estimates.json 읽기
```

- Read로 `$SECRETARY_DATA/estimates.json` 을 읽는다
- `records` 배열에서 오늘 날짜(`date == today`)이고 `status == "planned"` 인 항목을 추출한다
- `correction_factors` 객체에서 카테고리별 보정 계수를 가져온다

### Step 4: 어제 실적 로드 및 보정비 계산

```bash
# Secretary_Agent/data/worklog.json 읽기
```

- Read로 `$SECRETARY_DATA/worklog.json` 을 읽는다
- `entries` 배열에서 어제 날짜 항목을 추출한다
- 각 항목의 `estimated_hours`와 `actual_hours`로 보정비 계산: `actual / estimated`

### Step 5: 오늘 용량 계산

```
daily_capacity = estimates.json의 daily_capacity_hours (기본 8시간)
committed = 오늘 planned 태스크들의 보정 후 예상시간 합계
remaining = daily_capacity - committed
```

- `remaining < 1` 이면 경고 표시
- `remaining < 0` 이면 초과 경고 + 이동 권장 작업 제안

### Step 6: 브리핑 문서 생성

아래 형식으로 마크다운 생성:

```markdown
# 📋 일일 브리핑 — {YYYY-MM-DD}

## 어제 완료

| 작업        | 예상         | 실제      | 보정비   |
| ----------- | ------------ | --------- | -------- |
| {task_name} | {estimated}h | {actual}h | {ratio}x |

> 어제 커밋: {commit_count}건
> {주요 커밋 요약 1줄씩}

## 오늘 용량

- **가용 시간**: {daily_capacity}시간
- **예약된 작업**: {count}건 ({total_estimated}시간)
- **여유분**: {remaining}시간
  {remaining < 1 이면: ⚠️ 여유 시간이 거의 없습니다. 새 작업 수용 전 /gate-check 실행을 권장합니다.}
  {remaining < 0 이면: ❌ 용량 초과! {abs(remaining)}시간 부족. 낮은 우선순위 작업 이동을 권장합니다.}

## 오늘 할 일 (우선순위순)

1. [{priority}] {task_name} — 예상 {adjusted_hours}시간 (보정 후)
2. ...

## 진행 중 태스크 (칸반)

| 프로젝트  | 태스크  | 담당       | 우선순위   |
| --------- | ------- | ---------- | ---------- |
| {project} | {title} | {assignee} | {priority} |

## 주의사항

- {블로커/이슈/어제 미완료 작업}
- {worklog에서 보정비 2.0 이상인 카테고리 경고}

## Gatekeeper 판단

- 수용 가능 여부: {OK / 주의 / 초과}
- {초과 시 구체적 권장 사항}
```

### Step 7: 파일 저장

```bash
# Secretary_Agent/outputs/brief_{YYYY-MM-DD}.md 로 저장
```

- Write로 `$SECRETARY_OUT/brief_{date}.md` 에 저장한다

### Step 8: Obsidian Vault 연동

**중요: 절대 덮어쓰기 금지 (메모리 #19)**

```bash
# 1. 먼저 파일 존재 여부 확인
DAILY_PATH=$VAULT_ROOT/01_Daily/{YYYY}/{MM}/{YYYY-MM-DD}.md
```

- Read로 해당 파일이 존재하는지 확인한다
- **파일이 존재하면**: Edit으로 파일 끝에 `---` 구분선 + 브리핑 내용을 APPEND한다
- **파일이 없으면**: Write로 새 파일을 생성한다 (디렉토리도 없으면 Bash로 `mkdir -p` 먼저)

### Step 9: 텔레그램 알림

```bash
bash $NOTIFY "📋" "비서실장" "일일 브리핑이 준비되었습니다. 오늘 가용 {remaining}시간, 예약 {count}건." "info"
```

## 출력 예시

실행 후 사용자에게 브리핑 내용을 직접 출력하고, 저장 경로를 안내한다:

```
📋 일일 브리핑이 준비되었습니다.
- 저장: Secretary_Agent/outputs/brief_2026-03-15.md
- Vault: 01_Daily/2026/03/2026-03-15.md (append)
- 텔레그램: 발송 완료
```
