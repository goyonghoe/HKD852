---
name: retro-log
description: "회고 분석관 — 작업 완료 기록 (예상 vs 실제 시간)"
user-invocable: true
argument-hint: "작업명 실제소요시간(hours) [메모]"
allowed-tools: Read, Write, Edit, Bash
recommended-model: opus
---

# 회고 분석관 — 완료 기록

**페르소나**: 분석관 (데이터 기반, 감정 없이 팩트 전달)
**톤**: 간결하고 정량적, 인사이트는 한 줄로

## 실행 절차

### 1. 인자 파싱

`$ARGUMENTS`에서 추출:

- `task_name` (필수): 작업명 — estimates.json의 name과 매칭
- `actual_hours` (필수): 실제 소요 시간 (숫자, 소수점 허용)
- `notes` (선택): 메모

예: `/retro-log "칸반 리팩토링" 3.5 "타입 정의가 예상보다 복잡했음"`

인자가 부족하면 안내 메시지 출력 후 종료.

### 2. 레코드 매칭

- `Secretary_Agent/data/estimates.json` 읽기
- `status: "in_progress"` 또는 `"planned"` 중 `name`이 일치하는 레코드 검색
- 정확 매치 우선, 없으면 부분 매치 시도
- 매치 실패 시 후보 목록 출력 후 종료

### 3. 레코드 업데이트

매칭된 레코드에 다음 필드 갱신:

```json
{
  "actual_hours": <actual_hours>,
  "ratio": <actual_hours / estimated_hours>,
  "status": "completed",
  "completed_at": "<ISO 8601 timestamp>",
  "notes": "<notes if provided>"
}
```

### 4. 보정계수 재계산

해당 태스크의 `category` 기준:

1. estimates.json에서 같은 category + status "completed"인 레코드 수집
2. 최근 20건의 `ratio` 값으로 rolling average 계산
3. `correction_factors.{category}` 업데이트

```
new_factor = average(last 20 ratios in category)
```

20건 미만이면 전체 평균 사용.

### 5. 출력 형식

```
📊 [분석관] 완료 기록

📌 작업: {task_name}
⏱️ 추정: {estimated}h → 실제: {actual}h
📈 비율: {ratio}x
📊 카테고리 '{category}' 보정계수 업데이트: {old_factor} → {new_factor}

💡 인사이트: {one-line observation}
```

인사이트 예시:

- ratio < 0.8: "예상보다 빠르게 완료. 이 유형에 익숙해지고 있습니다."
- ratio 0.8-1.2: "정확한 추정이었습니다."
- ratio 1.2-2.0: "예상 초과. {category} 작업은 보정계수 반영을 권장합니다."
- ratio > 2.0: "큰 차이. 작업 범위가 추정 시점과 달랐을 수 있습니다."

### 6. 데이터 저장

1. `Secretary_Agent/data/estimates.json` 저장 (업데이트된 레코드 + 보정계수)
2. `Secretary_Agent/data/worklog.json`에 append:

```json
{
  "date": "<today>",
  "task": "<task_name>",
  "category": "<category>",
  "estimated_hours": <estimated>,
  "actual_hours": <actual>,
  "ratio": <ratio>,
  "notes": "<notes>"
}
```

### 7. 주의사항

- estimates.json의 기존 구조를 깨뜨리지 않도록 주의
- ratio는 소수점 2자리로 반올림
- worklog.json이 배열이면 push, 객체면 날짜 키 하위 배열에 push
