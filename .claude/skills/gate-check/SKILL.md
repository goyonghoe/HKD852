---
name: gate-check
description: "일정 관리관 — 새 작업 수용 전 용량 체크 + 보정 추정"
user-invocable: true
argument-hint: "작업명 예상시간 카테고리(unfamiliar|familiar|routine)"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: opus
model-reason: "용량 계산 + 의사결정 — Sonnet 적합"
---

# 일정 관리관 — 용량 체크 (Gate Check)

> 새 작업을 수용하기 전에 오늘의 남은 용량을 체크하고, Kowloon의 추정치를 보정합니다.

## 경로 상수

```
PROJECT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852
SECRETARY_DATA=$PROJECT_ROOT/Secretary_Agent/data
ESTIMATES=$SECRETARY_DATA/estimates.json
NOTIFY=$PROJECT_ROOT/Secretary_Agent/libs/notify.sh
```

## 실행 절차

### Step 1: 인자 파싱

`$ARGUMENTS`에서 3개 값을 추출한다:

- `task_name`: 작업명 (문자열)
- `estimated_hours`: 예상 소요시간 (숫자, 시간 단위)
- `category`: `unfamiliar` | `familiar` | `routine`

**인자가 없거나 불완전하면** 사용자에게 대화형으로 질문한다:

```
🚧 [일정 관리관] 새 작업 등록

어떤 작업인가요?
> 작업명:
> 예상 소요시간 (시간):
> 카테고리: unfamiliar(처음) / familiar(해봄) / routine(익숙)
```

### Step 2: 보정 계수 적용

```bash
# Secretary_Agent/data/estimates.json 읽기
```

- Read로 `$ESTIMATES` 파일을 읽는다
- `correction_factors` 에서 해당 `category`의 계수를 가져온다:
  - `unfamiliar`: 2.5x (처음 하는 작업은 2.5배 걸림)
  - `familiar`: 1.5x (해본 적 있지만 익숙하진 않음)
  - `routine`: 1.1x (반복 작업, 약간의 여유만)
- 보정 후 추정: `adjusted_hours = estimated_hours * correction_factor`

### Step 3: 오늘 기투입 시간 계산

- `records` 배열에서 오늘 날짜(`date == today`)이고 `status == "planned"` 또는 `status == "in_progress"` 인 항목을 추출한다
- 각 항목의 `adjusted_hours`를 합산하여 `committed` 계산
- `daily_capacity` = `daily_capacity_hours` (기본 8시간)
- `remaining` = `daily_capacity - committed`

### Step 4: 판정 출력

아래 형식으로 출력한다:

```
🚧 [일정 관리관] 용량 판정

📌 작업: {task_name}
⏱️ Kowloon 추정: {estimated_hours}시간
📊 보정 계수: {factor}x ({category})
⏱️ 보정 후 추정: {adjusted_hours}시간

📅 오늘 현황:
- 가용: {daily_capacity}시간
- 기투입: {committed}시간
- 잔여: {remaining}시간

{판정 결과}
```

**판정 기준:**

| 조건                           | 판정      | 표시                                                                |
| ------------------------------ | --------- | ------------------------------------------------------------------- |
| `remaining - adjusted >= 1`    | 수용 가능 | ✅ 판정: 수용 가능. 작업 후 잔여 {new_remaining}시간.               |
| `0 < remaining - adjusted < 1` | 주의      | ⚠️ 판정: 주의 (빡빡함). 잔여 {new_remaining}시간. 야근 가능성 있음. |
| `remaining - adjusted <= 0`    | 초과      | ❌ 판정: 초과 (내일 이동 권장). {abs(shortage)}시간 부족.           |

### Step 5: 수용 시 — estimates.json 업데이트

판정이 ✅ 또는 ⚠️ 이고 사용자가 수용하면, `$ESTIMATES`의 `records` 배열에 추가한다:

```json
{
  "date": "YYYY-MM-DD",
  "task": "{task_name}",
  "estimated_hours": {estimated_hours},
  "category": "{category}",
  "correction_factor": {factor},
  "adjusted_hours": {adjusted_hours},
  "status": "planned"
}
```

- Edit으로 `$ESTIMATES` 파일의 `records` 배열에 새 항목을 추가한다

### Step 6: 초과 시 — 대안 제안

판정이 ❌ 이면 아래 대안을 제시한다:

```
💡 대안:
1. 📆 내일로 이동 — 내일 가용 시간에 배치
2. 🤖 에이전트 위임 — 자동화 가능한 부분 위임
   {해당 작업에 적합한 에이전트 추천}
3. ⬇️ 낮은 우선순위 작업 연기:
   - {오늘 planned 중 priority가 낮은 것} → 내일 이동 시 {recovered}시간 확보
```

### Step 7: 텔레그램 알림

```bash
# 수용 가능:
bash $NOTIFY "🚧" "관리관" "'{task_name}' 수용 ({adjusted_hours}h). 잔여 {new_remaining}h." "info"

# 초과:
bash $NOTIFY "🚧" "관리관" "'{task_name}' 용량 초과! 보정 후 {adjusted_hours}h, 잔여 {remaining}h." "warn"
```

## estimates.json 스키마

```json
{
  "correction_factors": {
    "unfamiliar": 2.5,
    "familiar": 1.5,
    "routine": 1.1
  },
  "daily_capacity_hours": 8,
  "records": [
    {
      "date": "2026-03-15",
      "task": "작업명",
      "estimated_hours": 2,
      "category": "familiar",
      "correction_factor": 1.5,
      "adjusted_hours": 3,
      "status": "planned|in_progress|done|deferred",
      "actual_hours": null
    }
  ]
}
```

## 보정 계수 업데이트

worklog.json에 실적이 쌓이면, 카테고리별 실제 보정비 평균을 계산하여 `correction_factors`를 자동 조정할 수 있다. 이는 `/chief-brief` 실행 시 어제 실적 분석에서 감지한다.
