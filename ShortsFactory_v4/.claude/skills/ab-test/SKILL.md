---
name: shorts-v4-ab-test
description: "제목/썸네일 A/B 테스트 — CTR 기반 자동 교체"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shorts-v4-ab-test

업로드된 영상의 제목 변형 3개를 생성하고, 48시간 후 CTR 기반으로 최적 제목을 자동 선택한다.

## 파라미터

| 파라미터       | 필수   | 기본값 | 설명                               |
| -------------- | ------ | ------ | ---------------------------------- |
| `episode_id`   | 예     | —      | A/B 테스트 대상 에피소드 ID        |
| `channel_id`   | 예     | —      | 대상 채널 ID                       |
| `check_hours`  | 아니오 | 48     | CTR 확인까지 대기 시간             |

## 실행 절차

### Step 1: 원본 스크립트 로드

```
pipeline/scripts/{episode_id}.json
```

원본 제목과 메타데이터를 확인한다.

### Step 2: 제목 변형 생성

채널 프로파일의 tone과 과거 성과 데이터를 참조하여 3개 변형을 생성:

**변형 전략:**

| 변형 | 전략          | 예시                                  |
| ---- | ------------- | ------------------------------------- |
| A    | 원본          | "주식 투자자 90%가 모르는 심리 함정"  |
| B    | 숫자 강조     | "3가지 심리 함정이 당신의 수익을 갉아먹고 있다" |
| C    | 호기심 갭     | "이걸 모르면 주식으로 절대 못 번다"   |

변형 생성 규칙:
- 채널 프로파일의 `tone`에 맞는 어조 유지
- `data/learnings/`의 과거 CTR 패턴 반영
- 클릭베이트 수준 조절 (채널 신뢰도 고려)

### Step 3: A/B 테스트 등록

```
data/learnings/ab_tests.json
```

```json
{
  "tests": [
    {
      "test_id": "ab_{episode_id}_{timestamp}",
      "episode_id": "{episode_id}",
      "channel_id": "{channel_id}",
      "youtube_video_id": "...",
      "started_at": "ISO8601",
      "check_at": "ISO8601",
      "status": "running",
      "variants": {
        "A": {
          "title": "원본 제목",
          "strategy": "original",
          "applied_at": "ISO8601",
          "ctr_at_check": null
        },
        "B": {
          "title": "변형 B 제목",
          "strategy": "number_emphasis",
          "applied_at": null,
          "ctr_at_check": null
        },
        "C": {
          "title": "변형 C 제목",
          "strategy": "curiosity_gap",
          "applied_at": null,
          "ctr_at_check": null
        }
      },
      "winner": null,
      "completed_at": null
    }
  ]
}
```

### Step 4: 초기 제목 적용

원본 제목(A)으로 시작한다. YouTube Data API로 제목 변경이 가능한 환경에서는 일정 간격으로 교체하여 테스트할 수 있다.

간소화 모드: 변형을 미리 생성해두고, 48시간 후 성과 확인 시점에 최적 제목으로 1회 교체.

### Step 5: CTR 확인 (check_hours 경과 후)

`check_hours` 경과 후:

1. YouTube Analytics에서 현재 제목의 CTR 수집
2. 과거 학습 데이터 기반으로 각 변형의 예상 CTR 추정
3. 현재 CTR이 예상 CTR 대비 부진하면 최적 변형으로 교체

### Step 6: 최적 제목 교체

CTR이 가장 높을 것으로 예상되는 변형으로 제목 교체:

```bash
python3 engines/upload/youtube_uploader.py \
  --update-title \
  --video-id {youtube_video_id} \
  --new-title "{winning_title}"
```

### Step 7: 결과 기록

```json
{
  "status": "completed",
  "winner": "B",
  "original_ctr": 6.2,
  "final_ctr": 8.7,
  "improvement": "+2.5%",
  "completed_at": "ISO8601"
}
```

## 입력

- `pipeline/scripts/{episode_id}.json` — 원본 스크립트
- `channels/{channel_id}/profile.yaml` — 채널 프로파일
- `data/learnings/{channel_id}/` — 과거 CTR 패턴
- `data/performance/{channel_id}/` — 현재 성과 데이터

## 출력

- `data/learnings/ab_tests.json` — A/B 테스트 전체 로그
- YouTube 제목 업데이트 (API 호출)

## 에러 처리

- YouTube API 인증 실패: 에러 반환 + 수동 교체 안내
- 성과 데이터 수집 실패: 테스트를 "inconclusive"로 마감
- 제목 교체 실패: 3회 재시도 후 실패 기록
- 이미 완료된 테스트에 재실행 요청: 스킵 + 기존 결과 반환

## 학습 축적

A/B 테스트 결과는 `data/learnings/ab_tests.json`에 누적된다.
`shorts-v4-mine`과 `shorts-v4-script` 스킬이 제목 생성 시 이 데이터를 참조하여 점진적으로 제목 품질을 향상시킨다.

## 채널 프로파일 참조

제목 변형 생성 시 채널의 `tone`, `target_audience`, `content_pillars`를 반영한다.
채널별로 클릭베이트 수준 허용 범위가 다를 수 있으므로 프로파일의 `title_style` 필드를 참조한다.
