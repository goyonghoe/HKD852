---
name: shorts-v4-script
description: "채널 프로파일 기반 스크립트 + 메타데이터 생성"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shorts-v4-script

채널 프로파일의 tone, framework, structure, visual style에 따라 스크립트와 메타데이터를 생성한다.

## 파라미터

| 파라미터     | 필수 | 기본값 | 설명                                              |
| ------------ | ---- | ------ | ------------------------------------------------- |
| `channel_id` | 예   | —      | 대상 채널 ID                                      |
| `topic_file` | 예   | —      | 토픽 파일 경로 (mine 스킬 출력)                   |
| `topic_id`   | 아니오 | 전체   | 특정 토픽만 스크립트 생성 시 지정                 |

## 실행 절차

### Step 1: 채널 프로파일 로드

```
channels/{channel_id}/profile.yaml
```

핵심 필드:
- `tone`: 말투/어조 (예: "친근한 형/누나", "전문가")
- `script_framework`: 스크립트 구조 프레임워크
- `structure`: 씬 구성 규칙
- `visual_style`: 이미지 프롬프트 접미사
- `language`: 기본 언어
- `max_duration`: 최대 영상 길이 (초)

### Step 2: 스크립트 프레임워크 적용

채널 프로파일의 `script_framework`에 따라 구조를 결정:

**SUCCESS+Story 프레임워크:**
- S: Situation (상황 제시) — 훅
- U: Urgency (긴급성)
- C: Conflict (갈등/문제)
- C: Credibility (근거/출처)
- E: Engagement (감정 연결)
- S: Solution (해결책)
- S: Story (사례/스토리)

**Lisa Cron+SUCCESS 프레임워크:**
- 구체적 인물/상황으로 시작
- SUCCESS 구조를 스토리텔링으로 감싸기

### Step 3: 씬별 스크립트 생성

각 씬에 대해:

1. **narration**: TTS가 읽을 텍스트
   - 채널 `tone`에 맞는 어조
   - 학술 용어 금지 — MZ세대 친구에게 카톡하는 수준
   - TTS 기호 규칙: "-8.5%" → "마이너스 8.5%", "+12%" → "플러스 12%"
   - 한국어 맞춤법: "한주일" X → "일주일" O
2. **image_prompt**: 시각 이미지 생성 프롬프트
   - 채널 `visual_style` 접미사 자동 추가
   - 텍스트/숫자 렌더링 금지 (간판, UI 텍스트 등)
   - 조명/색감/구도로 감정 표현
3. **duration**: 해당 씬 예상 초수

### Step 4: 도메인 전문성 검증

채널 프로파일의 `domain_expertise.validation_rule`에 따라 스크립트 내용 검증:
- 스크립트에 도메인 전문성 기준 충족 여부 확인
- 미충족 시 해당 씬에 근거/출처 보강

### Step 5: 메타데이터 생성

```json
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."],
  "category": "..."
}
```

- title/description은 시각 텍스트이므로 기호(-, +, %) 유지
- 채널 프로파일의 `seo_keywords` 참조
- **CTA 금지** — "구독해주세요", "좋아요 눌러주세요" 류 미포함 (DEV.to 교훈: 쇼츠에서 CTA 효과 제로)

### Step 5: 출력 파일 생성

## 입력

- `channels/{channel_id}/profile.yaml`
- `pipeline/scripts/topics_{date}_{channel_id}.yaml` — 토픽 파일

## 출력

```
pipeline/scripts/{episode_id}.json
```

출력 형식:

```json
{
  "episode_id": "{channel_id}_ep{NNN}",
  "channel_id": "{channel_id}",
  "topic": "토픽 제목",
  "framework": "SUCCESS+Story",
  "language": "ko",
  "scenes": [
    {
      "scene_id": 1,
      "narration": "...",
      "image_prompt": "...",
      "duration": 5
    }
  ],
  "metadata": {
    "title": "...",
    "description": "...",
    "tags": [],
    "category": "Education"
  },
  "total_duration": 55,
  "sources": [
    {"url": "...", "claim": "..."}
  ]
}
```

## 에러 처리

- 총 duration이 `max_duration` 초과 시: 씬 축소 후 재생성
- 채널 프로파일 누락 필드: 기본값 사용 + 경고 로그
- 토픽 파일 미존재: 에러 반환

## 채널 프로파일 참조

스크립트의 모든 요소(어조, 구조, 시각 스타일)는 `profile.yaml`에서 파생된다.
프로파일 변경 시 스크립트 스타일이 자동으로 반영된다.
