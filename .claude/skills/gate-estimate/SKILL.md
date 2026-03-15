---
name: gate-estimate
description: "일정 관리관 — 작업 소요시간 보정 추정 (커밋 없이 조회만)"
user-invocable: true
argument-hint: "예상시간 카테고리(unfamiliar|familiar|routine)"
allowed-tools: Read, Bash
recommended-model: opus
model-reason: "단순 조회 + 계산 — Haiku로 충분"
---

# 일정 관리관 — 보정 추정 조회 (Gate Estimate)

> 파일 수정 없이, 입력한 예상시간에 보정 계수를 적용한 결과만 빠르게 보여줍니다.

## 경로 상수

```
PROJECT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852
ESTIMATES=$PROJECT_ROOT/Secretary_Agent/data/estimates.json
WORKLOG=$PROJECT_ROOT/Secretary_Agent/data/worklog.json
```

## 실행 절차

### Step 1: 인자 파싱

`$ARGUMENTS`에서 2개 값을 추출한다:

- `estimated_hours`: 예상 소요시간 (숫자, 시간 단위)
- `category`: `unfamiliar` | `familiar` | `routine`

**인자가 없으면** 사용자에게 질문한다:

```
⏱️ 보정 추정 조회
> 예상 소요시간 (시간):
> 카테고리: unfamiliar(처음) / familiar(해봄) / routine(익숙)
```

### Step 2: 보정 계수 조회

- Read로 `$ESTIMATES` 파일을 읽는다
- `correction_factors`에서 해당 카테고리의 계수를 가져온다

### Step 3: 유사 과거 작업 조회

- `$ESTIMATES`의 `records` 배열에서 같은 `category`이고 `status == "done"`이며 `actual_hours`가 있는 항목을 추출한다
- 최근 10건까지 표시
- 각 항목의 실제 보정비(`actual_hours / estimated_hours`)를 계산한다
- Read로 `$WORKLOG` 파일도 읽어서 추가 실적 데이터를 참조한다

### Step 4: 결과 출력

```
⏱️ [일정 관리관] 보정 추정

📊 입력: {estimated_hours}시간 ({category})
📊 보정 계수: {factor}x
⏱️ 보정 후 추정: {adjusted_hours}시간

📈 유사 과거 작업:
| 작업 | 예상 | 실제 | 실제 보정비 |
|------|------|------|------------|
| {task} | {est}h | {act}h | {ratio}x |

{과거 데이터가 있으면}
📊 카테고리 평균 보정비: {avg_ratio}x (기본 계수 {factor}x 대비 {diff})
💡 {avg_ratio가 factor보다 크면: "이 카테고리는 기본 계수보다 실제로 더 걸리는 경향입니다."}
{avg_ratio가 factor보다 작으면: "이 카테고리는 예상보다 빠르게 처리하는 경향입니다."}

{과거 데이터가 없으면}
📊 아직 이 카테고리의 실적 데이터가 없습니다. 기본 계수({factor}x)를 적용합니다.
```

## 주의사항

- 이 스킬은 **조회 전용**입니다. 파일을 수정하지 않습니다.
- 작업을 실제로 등록하려면 `/gate-check`를 사용하세요.
- 알림도 발송하지 않습니다.
