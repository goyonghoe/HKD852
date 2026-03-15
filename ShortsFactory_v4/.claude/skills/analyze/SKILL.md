---
name: shorts-v4-analyze
description: "주간 성과 분석 + 피드백 루프 — YouTube Analytics → 토픽 선정 반영"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
---

# shorts-v4-analyze

최근 7일간 각 채널의 YouTube 성과를 분석하고, 학습 결과를 토픽 선정에 반영하는 피드백 루프를 생성한다.

## 파라미터

| 파라미터     | 필수   | 기본값          | 설명                           |
| ------------ | ------ | --------------- | ------------------------------ |
| `channel_id` | 아니오 | 전체 채널       | 특정 채널만 분석 시 지정       |
| `period`     | 아니오 | 7               | 분석 기간 (일)                 |

## 실행 절차

### Step 1: 채널 목록 로드

`channel_id` 지정 시 해당 채널만, 미지정 시 `channels/` 전체를 대상으로 한다.

### Step 2: 성과 데이터 수집

각 채널에 대해 `data/performance/{channel_id}/` 디렉토리의 최근 데이터를 로드한다.

수집 지표 (우선순위순 — DEV.to 교훈: like rate > views):

**Primary (알고리즘 시그널)**:
- **좋아요율** (like_rate) — 4-5%가 건강한 채널 기준
- **평균 시청 시간** (avg_watch_time) — 절대 초수 (65초 목표)
- **시청 완료율** (completion_rate)

**Secondary (성장 지표)**:
- **조회수** (views) — sqrt로 댐핑, 이상치 영향 축소
- **CTR** (클릭률)
- **구독자 전환** (sub_gained)
- **RPM** (1000회 노출당 수익)

**주의**: YouTube Analytics는 72시간 후에야 안정화. 최근 72시간 내 영상은 분석 제외.

### Step 3: 패턴 분석

상위 성과 콘텐츠에서 공통 패턴을 추출:

1. **토픽 패턴**: 어떤 주제가 높은 조회수를 기록했는가
2. **훅 패턴**: 어떤 오프닝이 높은 CTR을 만들었는가
3. **제목 패턴**: 어떤 제목 구조가 클릭을 유도했는가
4. **길이 패턴**: 최적 영상 길이
5. **업로드 시간 패턴**: 성과가 좋은 업로드 시간대

하위 성과 콘텐츠에서 회피 패턴도 추출:
- 낮은 CTR 제목 유형
- 이탈이 높은 구간 특성
- 성과가 저조한 토픽 유형

### Step 4: 학습 결과 저장

```
data/learnings/{channel_id}/weekly_{YYYYMMDD}.json
```

```json
{
  "channel_id": "{channel_id}",
  "period": "YYYY-MM-DD ~ YYYY-MM-DD",
  "analyzed_at": "ISO8601",
  "summary": {
    "total_videos": 7,
    "total_views": 45000,
    "avg_ctr": 8.2,
    "avg_completion_rate": 72,
    "avg_rpm": 3.5
  },
  "top_performers": [
    {
      "episode_id": "...",
      "views": 12000,
      "ctr": 12.5,
      "topic": "...",
      "hook_type": "question",
      "title_pattern": "숫자+궁금증"
    }
  ],
  "patterns": {
    "winning_topics": ["..."],
    "winning_hooks": ["..."],
    "winning_title_structures": ["..."],
    "optimal_duration": 52,
    "optimal_upload_time": "09:00 KST",
    "avoid_topics": ["..."],
    "avoid_hooks": ["..."]
  },
  "recommendations": [
    "다음 주 '경제 심리학' 토픽 비중 확대",
    "훅에 구체적 숫자 포함 시 CTR +3.2%"
  ]
}
```

### Step 5: HTML 대시보드 생성

인터랙티브 HTML 대시보드를 생성한다:

- 채널별 KPI 카드 (조회수, CTR, RPM, 구독자)
- 일별 조회수 추이 차트
- 상위/하위 콘텐츠 비교 테이블
- 패턴 분석 시각화
- 다음 주 추천 토픽 리스트

## 입력

- `data/performance/{channel_id}/` — YouTube Analytics 데이터
- `pipeline/scripts/` — 해당 기간 스크립트 파일들
- `channels/{channel_id}/profile.yaml` — 채널 프로파일

## 출력

- `data/learnings/{channel_id}/weekly_{YYYYMMDD}.json` — 학습 결과
- `outputs/analytics_{YYYYMMDD}_{channel_id}.html` — HTML 대시보드

## 에러 처리

- 성과 데이터 미존재: 해당 채널 분석 스킵 + 경고
- 데이터 기간 부족 (3일 미만): 분석 가능하나 신뢰도 낮음 경고
- 전체 채널 데이터 없음: 에러 반환

### Step 6: Persistent Memory 업데이트

분석 결과를 `engines/memory/session_memory.py`를 통해 채널별 영구 기억에 기록:

1. **performance_patterns.json** — 이번 주 발견된 패턴 누적 업데이트
2. **session_log.jsonl** — 이번 분석 세션의 결정/발견 기록
3. **failed_experiments.json** — 성과 하위 10% 콘텐츠의 공통점 기록 (반복 방지)
4. **visual_fatigue.json** — 비주얼 스타일 사용 빈도 업데이트

## 피드백 루프

`data/learnings/`에 저장된 결과는 `shorts-v4-mine` 스킬이 토픽 선정 시 자동으로 참조한다.
`data/memory/`에 저장된 영구 기억은 세션을 넘어 패턴을 학습한다.
이를 통해 성과 → 학습 → 기억 → 토픽 선정 → 성과의 선순환 구조가 형성된다.

## 채널 프로파일 참조

분석 결과를 해석할 때 채널의 `niche`, `content_pillars`, `target_audience`를 맥락으로 사용한다.
