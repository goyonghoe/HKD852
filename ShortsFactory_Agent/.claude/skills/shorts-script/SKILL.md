---
name: shorts-script
description: "토픽 기반 YouTube Shorts 스크립트 + 메타데이터 자동 생성"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
recommended-model: sonnet
model-reason: "스크립트 생성은 Sonnet의 창의적 균형이 최적"
argument-hint: "--topic 'topic-id' 또는 토픽 YAML 경로"
---

# /shorts-script — 쇼츠 스크립트 생성기

## 역할
선정된 토픽을 받아 15~45초 분량의 YouTube Shorts 스크립트와 전체 메타데이터를 생성합니다.
YouTube 2026 정책을 준수하여 크리에이터 관점이 반드시 포함됩니다.

## 스크립트 구조

```
[훅 — 0~3초] (필수)
시청자의 스크롤을 멈추는 강한 첫 문장.
패턴: 충격/의문/반전/도발 중 택 1

[본문 — 3~25초] (필수)
2~3개 핵심 포인트. 각 포인트는:
- 팩트 또는 데이터 기반
- 크리에이터의 해석/비유 포함
- 짧고 리듬감 있는 문장

[CTA — 25~30초] (필수)
팔로우/구독 유도. 다음 영상 예고 가능.
```

## 훅 패턴 라이브러리

스크립트 생성 시 `templates/hooks.json`에서 적절한 훅 패턴을 선택합니다:

| 패턴 | 예시 |
|------|------|
| 충격 수치 | "99% of people don't know this." |
| 금지/경고 | "Stop doing this right now." |
| 반전 | "Everyone says X. They're wrong." |
| 도발 | "Delete your [tool] subscription." |
| 질문 | "What if I told you..." |
| 비밀 | "Nobody talks about this." |

## 메타데이터 생성 규칙

### 타이틀 (40자 이내, 영어)
- 숫자 포함 권장 ("3 AI Tools", "5 Secrets")
- 감정 단어 포함 ("Shocking", "Secret", "Free")
- 의문문 또는 선언문

### 썸네일 문구 (4~8자)
- 핵심 키워드만 (대문자)
- 예: "FREE AI", "STOP THIS", "$0 TOOL"

### 설명 (2~3줄)
- 1줄: 영상 요약
- 2줄: 부가 정보 또는 출처
- 3줄: CTA ("Follow for more...")
- AI-assisted production 표기 포함

### 해시태그 (10개 이내)
- 영어 기본
- 니치 태그 3~4개 + 범용 태그 3~4개 + 트렌드 태그 2~3개

## 스토리텔링 프레임워크 (필수 적용)

### Made to Stick (SUCCESs) 체크
스크립트 완성 후 아래 6가지를 자가 평가 (각 1~10점):
- **S**imple: 핵심 메시지가 한 줄로 요약되는가?
- **U**nexpected: 예측을 깨는 반전/의외성이 있는가?
- **C**oncrete: 감각적 비유(사탕 2알, 배달앱)가 있는가?
- **C**redible: 구체적 수치/출처가 있는가?
- **E**motional: 공감/놀람/웃음 중 하나를 유발하는가?
- **S**tories: 기대→좌절→깨달음 3막 구조인가?

**기준: 40/60점 이상이어야 PASS** (미달 시 재작성)

### 스토리 구조 (팩트 나열 금지)
```
[기대 구축] 시청자의 욕망/호기심을 자극하는 가정
  ↓
[현실 충돌] "근데..." — 과학/데이터로 기대를 깨뜨림
  ↓
[Aha! 반전] 예상 못한 결론 + 현대적/공감적 비유
```

### 금지 패턴
- 팩트→팩트→팩트→결론 (백과사전형)
- 같은 내용 다른 표현으로 반복 ("60kcal밖에 안 된다→밥 반 공기도 안 된다→배는 고프다")
- 훅에서 이미 결론이 예측되는 구조

## 정책 준수 자동 체크

스크립트 생성 시 자체 검증:
- [ ] 출처 정보가 포함되어 있는가?
- [ ] 단순 팩트 나열이 아닌 해석이 있는가?
- [ ] 오인 소지가 있는 AI 합성 인물/음성 언급이 없는가?
- [ ] "AI-assisted" 라벨을 설명에 포함했는가?

## 출력 형식

```json
// pipeline/scripts/{topic-id}.json
{
  "episode_id": "ep_20260218_001",
  "topic_id": "ai-tool-review",
  "language": "en",
  "script": {
    "hook": "Stop paying for 5 different apps. This one AI tool does it all.",
    "body": [
      "It's called [Tool Name]. Point 1: It writes emails faster than ChatGPT.",
      "Point 2: It creates presentations in one click.",
      "Point 3: It even edits your videos. And the free tier is insanely generous."
    ],
    "cta": "Follow for more AI tools that save you money."
  },
  "full_text": "Stop paying for 5 different apps...",
  "estimated_duration_sec": 28,
  "metadata": {
    "title": "This AI Tool Replaces 5 Apps for Free",
    "thumbnail_text": "5 APPS FREE",
    "description": "This AI tool replaced 5 apps I was paying for. Here's how I use it daily to save 3+ hours.\nAI-assisted production.\n#AITools #Productivity",
    "hashtags": ["#AITools", "#Productivity", "#TechTips", "#AI", "#FreeAI", "#Automation", "#Shorts", "#TechReview", "#AIHacks", "#WorkSmarter"],
    "source_urls": ["https://..."]
  },
  "render_config": {
    "tts_voice": "en-US-AndrewMultilingualNeural",
    "tts_rate": "-3%",
    "tts_pitch": "-1Hz",
    "format": "dark-bg-text",
    "font_size": 48
  }
}
```

## 속도 목표
2분 이내 완료
