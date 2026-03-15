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

| 패턴      | 예시                               |
| --------- | ---------------------------------- |
| 충격 수치 | "99% of people don't know this."   |
| 금지/경고 | "Stop doing this right now."       |
| 반전      | "Everyone says X. They're wrong."  |
| 도발      | "Delete your [tool] subscription." |
| 질문      | "What if I told you..."            |
| 비밀      | "Nobody talks about this."         |

## 메타데이터 생성 규칙 (전략 v3 — 2026 알고리즘 최적화)

### 타이틀 (50자 이내, 한글)

- **이모지 1개 필수** (앞에 배치) — vidIQ 1.28억 영상 분석: 이모지 = 조회수 49%↑
- **의문문 형식 필수**: `~면?` / `~다면?` / `~을까?`로 끝나는 질문
- 선택적으로 `#만약에` 접미사 가능
- 예: "🧠 기억을 사고팔 수 있다면? #만약에", "🌍 지구 중력이 반으로 줄어든다면?"
- 숫자 포함 권장 ("3가지 이유", "5초 만에")
- 트렌딩 평균: 51자/8단어 — 20~60자가 최적 구간

### 썸네일 문구 (4~8자)

- 핵심 키워드만 (한글 가능)
- 예: "지구 2배속?", "광합성 인간"

### 설명 (2~3줄, 한글) — 첫 125자가 핵심

- **첫 125자에 주요 키워드 밀집** — YouTube SEO 크롤링 + 미리보기 영역
- 1줄: `[시리즈명] 토픽 키워드` (SEO용)
- 2줄: 한글 훅 (영상 핵심 질문 + 부가 정보)
- 마지막 줄: 해시태그 4~5개
- **영어 설명 불필요** — 한글로만 작성
- **면책/고지 문구 금지** — "※ 순수 창작 풍자 콘텐츠입니다" 등 면책 문구 넣지 않음

### 해시태그 (4~5개로 압축)

- 구성: `#만약에` + 주제 태그 1~2개 + `#WhatIf` + `#Shorts`
- 예: `#만약에 #지구과학 #WhatIf #Shorts`
- **10개 이상 금지** — 알고리즘 패널티 위험

### YouTube API 태그 (5~6개)

- 한글 니치 태그 3개 + 영문 브로드 태그 2~3개
- `#` 접두사 제거된 형태
- 예: `["만약에", "지구과학", "과학", "WhatIf", "Shorts"]`

### 카테고리

- **24 (Entertainment)** 고정 — Shorts 피드 노출 최적화

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

## 이미지 프롬프트 작성 규칙 (필수)

AI 이미지 생성은 텍스트/숫자 렌더링에 취약합니다. **image_prompt 작성 시 반드시 준수:**

### 절대 금지 (이미지에 어색한 글자가 생김)

- 간판/배너/뱃지에 특정 문구 묘사: ~~`banner reading 'SPONSORED BY OO'`~~
- 화면/UI에 텍스트 표시: ~~`app screen showing '월 9,900원'`~~
- 구체적 숫자/퍼센트/가격: ~~`badge showing 1,247회`, `stock chart 3000%`~~
- 말풍선에 대사: ~~`speech bubble saying '18%'`~~
- 리더보드/스코어보드/현황판: ~~`scoreboard displaying names and percentages`~~

### 대신 사용 (순수 시각으로 상황 전달)

| 표현하고 싶은 것 | 텍스트 방식 (금지)                  | 시각적 방식 (권장)                                     |
| ---------------- | ----------------------------------- | ------------------------------------------------------ |
| 가격/구독        | `screen showing 9,900원`            | 황금빛 왕관 아이콘, 프리미엄 vs 무료의 빛/어둠 대비    |
| 퍼센트/수치      | `badge reading 18%`                 | 에너지 바가 거의 바닥난 시각적 게이지                  |
| 광고/스폰서      | `banner reading 'SPONSORED'`        | 네온 광고판 실루엣, 눈부신 빛줄기가 장면을 가르는 구도 |
| 주가 상승        | `stock chart going up 3000%`        | 하늘로 치솟는 빛기둥, 로켓 발사 이미지                 |
| 앱 UI            | `subscription page with crown icon` | 빛나는 신비로운 포털/게이트웨이                        |
| 대사/생각        | `speech bubble from worker`         | 캐릭터의 과장된 표정과 몸짓으로 감정 전달              |

### image_prompt 작성 공식

```
"Vertical 1080x1920. " + [구도/앵글] + [핵심 캐릭터의 감정/동작] + [상황을 상징하는 시각 요소] + [분위기/조명/색감] + [스타일 서픽스]
```

### 채널 통일 스타일 (필수)

모든 image_prompt 끝에 아래 스타일 서픽스를 **반드시** 포함:

```
, 1980s-90s Japanese bubble era manga style, bold ink outlines, screentone shading, retro neon color palette with hot pink cyan and sunset orange, dramatic cinematic lighting, vintage anime cel shading
```

- `visual_style` 필드도 이 스타일 기반으로 작성
- 씬마다 개별 아트 스타일 지정 금지 (통일감 깨짐)
- 색감/분위기는 씬별로 달라도 되지만, 아트 스타일과 선 처리는 동일하게 유지

**예시:**

```
BAD:  "A smartphone app screen showing 'DREAM PREMIUM 월 9,900원' with a crown icon"
GOOD: "Vertical 1080x1920. A lone figure standing before a massive glowing golden gateway, split between a luxurious lit path and a dark cluttered path, dramatic light contrast, 1980s-90s Japanese bubble era manga style, bold ink outlines, screentone shading, retro neon color palette with hot pink cyan and sunset orange, dramatic cinematic lighting, vintage anime cel shading"
```

## 정책 준수 자동 체크

스크립트 생성 시 자체 검증:

- [ ] 출처 정보가 포함되어 있는가?
- [ ] 단순 팩트 나열이 아닌 해석이 있는가?
- [ ] 오인 소지가 있는 AI 합성 인물/음성 언급이 없는가?
- [ ] **image_prompt에 텍스트/숫자/UI 묘사가 없는가?** (v3.3 필수)

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
    "description": "This AI tool replaced 5 apps I was paying for. Here's how I use it daily to save 3+ hours.\n#AITools #Productivity",
    "hashtags": [
      "#AITools",
      "#Productivity",
      "#TechTips",
      "#AI",
      "#FreeAI",
      "#Automation",
      "#Shorts",
      "#TechReview",
      "#AIHacks",
      "#WorkSmarter"
    ],
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
