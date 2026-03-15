---
name: book-script
description: "미국 인기 미번역 도서 → 5씬 YouTube Shorts 스크립트 생성 (리뷰 분석 + 번역 기대감)"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
recommended-model: sonnet
model-reason: "스토리텔링 기반 스크립트 생성은 Sonnet의 창의적 균형이 최적"
argument-hint: "--book <goodreads-url-or-yaml-path> 또는 --topic <book-title>"
---

# /book-script -- "미국에서 핫한 책" 쇼츠 스크립트 생성기

## 역할

/book-mine에서 선정된 미번역 도서를 받아, Goodreads 리뷰를 분석하고
55초 분량의 5씬 YouTube Shorts 스크립트를 생성합니다.

**핵심 톤**: "미국에서 난리 난 이 책, 한국에는 아직 없습니다"
**마무리 뉘앙스**: "읽어보고 싶고, 한국에도 번역됐으면 좋겠다"

## 콘텐츠 핵심 공식

```
미국에서 핫한 이유 (리뷰/수치)
  → 어떤 내용인지 (핵심 갈등/매력)
  → 왜 한국 독자에게도 와닿을지 (공감)
  → 아직 한국에 없다는 아쉬움 + 기대감
```

## 5씬 구조 (필수)

```
[Scene 1] HOOK         (0~5초)   — "미국에서 난리 난" 임팩트
[Scene 2] BUZZ         (5~15초)  — Goodreads 리뷰 반응 소개
[Scene 3] CORE STORY   (15~30초) — 책의 핵심 갈등/매력
[Scene 4] KOREAN LENS  (30~45초) — 한국 독자에게 왜 와닿을까
[Scene 5] WISH         (45~55초) — "번역됐으면 좋겠다" 여운
```

### Scene 1: HOOK (0~5초)

**"미국에서 난리 난 책" 임팩트**

미국에서의 인기를 **숫자와 현상**으로 보여줍니다.

| 구분 | 예시                                                              |
| ---- | ----------------------------------------------------------------- |
| BAD  | "오늘 소개할 책은 It's Not Her입니다."                            |
| GOOD | "Goodreads 2만 4천 명이 별 4개를 준 이 책, 한국엔 아직 없습니다." |
| GOOD | "미국 서점에서 1위를 찍고 있는데, 한국에선 아무도 모릅니다."      |
| GOOD | "이 책 때문에 미국 북스타그램이 뒤집어졌어요."                    |

### Scene 2: BUZZ (5~15초)

**Goodreads 리뷰 반응 소개**

실제 독자 반응을 인용하여 **왜 핫한지**를 생생하게 전달합니다.

- "좋아요 200개가 넘는 리뷰에서 이런 말을 했어요..."
- "가장 많은 공감을 받은 리뷰는 이겁니다..."
- "One-night read라고 말하는 사람이 줄을 서요."
- 리뷰 원문 일부 인용 (영어 → 한국어 의역)

**필수**: `scanner.fetch_reviews()` 결과의 상위 리뷰를 활용

### Scene 3: CORE STORY (15~30초)

**책의 핵심 갈등/매력 — Dan Heath "Unexpected" + Lisa Cron "내면 갈등"**

단순 줄거리가 아닌, **이 책이 독자를 사로잡는 핵심 구조**를 전달합니다.

- 스릴러: 핵심 미스터리 설정 (스포일러 없이)
- 로맨스: 관계의 핵심 갈등/긴장
- 논픽션: 가장 반직관적인 주장
- 판타지: 세계관의 가장 매력적인 설정

### Scene 4: KOREAN LENS (30~45초)

**한국 독자에게 왜 와닿을까**

이 책의 주제가 한국인의 현재 삶에 왜 연결되는지 설명합니다.

**필수 포함 맥락:**

- 직장인: 번아웃, 워라밸, 퇴사 고민
- 학생/2030: 미래 불안, 관계 고민, 자기 정체성
- 공통: "한국에서도 이런 이야기가 필요해요"

**절대 금지**: "한국 사회에도 적용됩니다" 같은 추상적 연결
**필수**: 구체적 감정/상황 — "야근하고 택시 타고 집에 와서, 이런 책 하나 읽고 싶다는 생각..."

### Scene 5: WISH (45~55초)

**"번역됐으면 좋겠다" 여운**

시청자가 **이 책을 직접 찾아보고 싶게** 만드는 마무리입니다.

| 구분 | 예시                                                              |
| ---- | ----------------------------------------------------------------- |
| BAD  | "구독 좋아요 눌러주세요"                                          |
| GOOD | "이 책, 한국에도 빨리 나왔으면 좋겠어요. 읽어보고 싶지 않으세요?" |
| GOOD | "영어 원서로 먼저 읽어보실 분들도 있을 것 같아요."                |
| GOOD | "한국 출판사 중에 누가 먼저 이 책을 가져올까요?"                  |

**핵심**: 시청자가 댓글에 "나도 읽고 싶다", "번역 빨리 해주세요" 라고 쓰게 만들기

## 훅 패턴 라이브러리 (신규 각도 최적화)

| #   | 패턴          | 예시                                                         |
| --- | ------------- | ------------------------------------------------------------ |
| 1   | **숫자 충격** | "Goodreads 2만 명이 별점 4.5를 준 이 책, 한국엔 없습니다."   |
| 2   | **발견형**    | "미국 서점 1위인데 한국에선 아무도 모르는 책이 있어요."      |
| 3   | **리뷰 인용** | "가장 많은 좋아요를 받은 리뷰: '밤새 읽었다. 인생 책.'"      |
| 4   | **현상 묘사** | "이 책 때문에 미국 북스타그램이 난리예요."                   |
| 5   | **비교형**    | "한국에선 \_\_\_ 가 유행인데, 미국에선 이 책이 그 자리예요." |
| 6   | **아쉬움**    | "한국에 아직 번역이 안 된 게 너무 아까운 책이 있어요."       |
| 7   | **질문형**    | "미국 사람들이 지금 가장 많이 읽는 책이 뭔지 아세요?"        |
| 8   | **트렌드형**  | "올해 미국 출판계 최대 화제작이 드디어 나왔습니다."          |

## 스토리텔링 프레임워크 (필수 자가 검증)

### Lisa Cron 체크 (각 1~10점, 총 50점)

| 원칙        | 이 각도에서의 체크 포인트                          |
| ----------- | -------------------------------------------------- |
| 내면의 갈등 | 책의 주인공/독자가 겪는 보편적 갈등이 전달되는가?  |
| 확실한 상대 | 한국 시청자가 "나도 읽고 싶다"고 느끼는가?         |
| 갈등의 힘   | "미국에선 있는데 한국에 없다"는 결핍이 작동하는가? |
| 구체성      | 리뷰 인용, 수치, 구체적 장면이 있는가?             |
| Aha! 모먼트 | "이런 책이 있었구나"라는 발견의 순간이 있는가?     |

**기준: 35/50점 이상이어야 PASS**

### Dan Heath "Made to Stick" (SUCCESs) 체크 (각 1~10점, 총 60점)

| 원칙           | 체크 포인트                                       |
| -------------- | ------------------------------------------------- |
| **S**imple     | 이 책의 매력을 한 줄로 요약할 수 있는가?          |
| **U**nexpected | 한국에 없다는 사실 자체가 놀라움인가?             |
| **C**oncrete   | Goodreads 리뷰 원문 인용이 있는가?                |
| **C**redible   | 평점, 리뷰 수, 차트 순위 등 수치가 있는가?        |
| **E**motional  | "나도 읽고 싶다"는 욕구를 유발하는가?             |
| **S**tories    | 단순 소개가 아닌 서사 구조(발견→몰입→아쉬움)인가? |

**기준: 40/60점 이상이어야 PASS**

## 이미지 프롬프트 작성 규칙

### 절대 금지

- 간판/배너/뱃지에 특정 문구
- 화면/UI에 텍스트
- 구체적 숫자/퍼센트
- 말풍선에 대사
- **책 표지에 글자/제목 묘사 금지**

### 채널 통일 스타일 서픽스 (필수)

```
, warm watercolor book illustration style, soft ink linework, Korean literary cover art aesthetic, amber and burgundy and cream and forest green palette, warm golden hour lighting, cozy reading atmosphere, soft texture paper grain
```

### 씬별 이미지 가이드

| 씬             | 이미지 방향                                                    |
| -------------- | -------------------------------------------------------------- |
| Scene 1 HOOK   | 미국 서점/독서 문화의 열기 — 붐비는 서점, 책이 쌓인 디스플레이 |
| Scene 2 BUZZ   | 독서하는 사람들의 열광 — 밤새 읽는 모습, 몰입한 독자들         |
| Scene 3 CORE   | 책의 핵심 분위기 — 장르에 맞는 상징적 장면                     |
| Scene 4 KOREAN | 한국 일상 속 독서 욕구 — 지하철/카페에서 책을 갈망하는 모습    |
| Scene 5 WISH   | 두 문화를 잇는 다리 — 책 한 권이 바다를 건너오는 이미지        |

## 메타데이터 생성 규칙

### 타이틀 (50자 이내, 한글)

- **이모지 1개 필수** (앞에 배치)
- **"미국에서 핫한" 뉘앙스 포함**
- 예: "🔥 미국 Goodreads 1위인데 한국엔 없는 이 책", "📚 미국이 열광하는 스릴러, 한국은 아직 모른다"

### 설명 (2~3줄, 한글) -- 첫 125자가 핵심

- 1줄: 책 제목 + 저자 + "미국 베스트셀러" + 핵심 키워드
- 2줄: "한국 미출간" + 핵심 매력 포인트
- 마지막 줄: 해시태그 5~8개

### 해시태그

- 필수: `#미국베스트셀러` `#번역안된책` `#해외신간` `#북추천`
- 니치 태그 2~4개 추가
- 예: `#미국베스트셀러 #번역안된책 #해외신간 #북추천 #스릴러 #Goodreads #Shorts`

## CTA 정책

**절대 금지:** "구독", "좋아요", "알림"
**허용하는 마무리:**

- "이 책, 한국에도 빨리 나왔으면 좋겠어요."
- "원서로 먼저 도전해 보실 분?"
- "어떤 출판사가 먼저 가져올까요?"

## 출력 형식

```json
// pipeline/scripts/book_ep{NNN}.json
{
  "episode_id": "book_ep001",
  "content_angle": "us_hot_untranslated",
  "book": {
    "title": "It's Not Her",
    "author": "Mary Kubica",
    "goodreads_url": "https://www.goodreads.com/book/show/230443142",
    "goodreads_rating": 4.08,
    "ratings_count": 24288,
    "reviews_count": 4045,
    "isbn": "9780778387992",
    "genre": "Thriller",
    "korean_available": false
  },
  "reviews_used": [
    { "reviewer": "Sydney Books", "likes": 239, "quote": "PHEW what a ride!" },
    {
      "reviewer": "Norma",
      "likes": 154,
      "quote": "Totally gripping, breathless pacing"
    }
  ],
  "language": "ko",
  "script": {
    "scenes": [
      {
        "scene": 1,
        "label": "HOOK",
        "timing": "0-5s",
        "narration": "Goodreads 2만 4천 명이 별 4개를 준 이 책, 한국엔 아직 없습니다.",
        "image_prompt": "Vertical 1080x1920. A bustling American bookstore with a prominent display of a mysterious book surrounded by excited readers reaching for it, warm golden lighting casting dramatic shadows, warm watercolor book illustration style, soft ink linework, Korean literary cover art aesthetic, amber and burgundy and cream and forest green palette, warm golden hour lighting, cozy reading atmosphere, soft texture paper grain",
        "hook_pattern": "숫자 충격"
      }
    ]
  },
  "full_text": "Goodreads 2만 4천 명이 별 4개를 준...",
  "estimated_duration_sec": 53,
  "framework_scores": {
    "lisa_cron": { "total": 38, "pass": true },
    "success": { "total": 45, "pass": true }
  },
  "metadata": {
    "title": "🔥 미국 2만명이 열광한 스릴러, 한국엔 아직 없다",
    "thumbnail_text": "미국 난리",
    "description": "It's Not Her 메리 쿠비카 — 미국 Goodreads ★4.08 스릴러 베스트셀러\n'밤새 읽었다' 2만 독자의 반응, 한국 미출간 아쉬운 이 책\n#미국베스트셀러 #번역안된책 #해외신간 #스릴러 #북추천 #Goodreads #Shorts",
    "hashtags": [
      "#미국베스트셀러",
      "#번역안된책",
      "#해외신간",
      "#스릴러",
      "#북추천",
      "#Goodreads",
      "#Shorts"
    ],
    "category": 27
  },
  "render_config": {
    "tts_voice": "hangout-male",
    "visual_style": "warm_bibliotheca"
  }
}
```

## 속도 목표

3분 이내 완료
