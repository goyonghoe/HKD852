# ShortsFactory3_Agent — "책봐서 뭐하니?" 채널

> 미국에서 핫한 신간 중 한국에 아직 없는 책을 발굴하여, Goodreads 리뷰와 함께 55초 쇼츠로 소개하는 해외 도서 큐레이션 채널

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 채널 정보

| 항목          | 내용                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **채널명**    | 책봐서 뭐하니?                                                                                                                            |
| **핸들**      | @Hangoutwith_Books                                                                                                                        |
| **채널 ID**   | UC_xOpa8F4AGpCrr2XjhOPMg                                                                                                                  |
| **컨셉**      | 미국에서 핫한 신간 중 한국 미번역 도서를 발굴 → Goodreads 리뷰 분석으로 왜 핫한지 소개 → 한국 독자 관점 공감 → "번역됐으면 좋겠다" 마무리 |
| **핵심 공식** | **"미국에서 난리 난 책인데 한국엔 아직 없어요"**                                                                                          |
| **타겟**      | 한국 2030 직장인/학생, 해외 도서 트렌드에 관심 있는 독서 애호가                                                                           |
| **언어**      | 한국어                                                                                                                                    |
| **톤**        | 자연스러운 서술체 유지, 친근하면서도 지적인 느낌 ("~인데요", "~거든요", "~더라고요")                                                      |

---

## 콘텐츠 핵심 각도

```
미국에서 핫한 이유 (Goodreads 리뷰/수치)
  → 어떤 내용인지 (핵심 갈등/매력)
  → 왜 한국 독자에게도 와닿을지 (공감)
  → 아직 한국에 없다는 아쉬움 + 번역 기대감
```

**왜 이 각도가 강한가:**

- 시청자가 **발견자**가 된 기분 ("이런 책이 있었어?")
- Goodreads 리뷰 인용 → 단순 소개가 아닌 **대중 반응 스토리텔링**
- "번역됐으면 좋겠다" → 댓글에서 공감/토론 유도 (알고리즘 유리)
- 한국 유튜브에서 이 포맷은 **블루오션**

---

## 차별화

| 차별점                     | 설명                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| **미국 핫 신간 독점 소개** | Goodreads 인기 신간 중 한국 미번역 도서만 선별 — 경쟁 채널 거의 없음 |
| **Goodreads 리뷰 분석**    | 좋아요 순 Top 리뷰를 인용하여 "왜 미국에서 난리인지" 생생하게 전달   |
| **한국인 공감 해석**       | 단순 소개가 아닌, "이 책이 왜 지금 한국인에게 의미가 있는가"를 연결  |
| **번역 기대감 유도**       | "한국에도 나왔으면 좋겠다" → 댓글 참여 + 바이럴                      |
| **발견의 즐거움**          | "미국에선 이미 유명한데 한국엔 아직 없는" 정보 비대칭 활용           |

---

## 데이터 파이프라인

```
[1차] Goodreads Scanner    → 이번 달 인기 신간 (min_rating 3.8+)
[2차] Translation Checker  → 알라딘 검색으로 한국 미번역 필터
[3차] Review Analyzer      → Top 리뷰 좋아요 순 수집
[보조] 4개국 Chart Scanner → KR/US/JP/CN 차트 교차 검증
```

---

## 렌더링 엔진

- `libs/` → `../ShortsFactory_Agent/libs/` (심링크, 공유 엔진)
- video_composer.py, render_samples.py, subtitle_gen.py, tts_engine.py, image_gen.py, metadata_gen.py 등 공유
- 채널 고유 설정은 스크립트 JSON의 `render_config`로 오버라이드

---

## 비주얼 스타일: "Warm Bibliotheca"

> 모든 이미지는 따뜻한 수채화 문학 일러스트풍을 통일 적용합니다.

| 요소            | 규칙                                                |
| --------------- | --------------------------------------------------- |
| **아트 스타일** | 따뜻한 수채화 문학 일러스트풍, 부드러운 잉크 라인   |
| **팔레트**      | amber, burgundy, cream, forest green                |
| **분위기**      | 늦은 오후 서점, 따뜻한 독서등, 아늑한 독서 공간     |
| **질감**        | 종이 그레인 텍스처, 수채 번짐, 부드러운 그라데이션  |
| **캐릭터**      | 독서하는 사람, 서재의 실루엣, 책장과 조명           |
| **배경**        | 따뜻한 서재, 카페 창가, 도서관 코너, 가을 공원 벤치 |

### image_prompt 필수 서픽스

모든 image_prompt 끝에 아래 스타일 태그를 반드시 포함:

```
, warm watercolor book illustration style, soft ink linework, Korean literary cover art aesthetic, amber and burgundy and cream and forest green palette, warm golden hour lighting, cozy reading atmosphere, soft texture paper grain
```

### 이미지 프롬프트 철칙

> ShortsFactory_Agent v3.4 공통 규칙을 그대로 적용합니다.

**절대 금지:**

- 간판/배너/뱃지에 문구: `banner reading '...'`
- 화면/UI에 텍스트: `book cover with title '...'`
- 숫자/순위: `#1 bestseller badge`
- 말풍선 대사: `speech bubble saying '...'`

**대신 사용:**

- 책의 분위기를 조명, 색감, 구도로 표현
- 순위/인기는 빛의 강도, 크기 대비로 상징화
- 텍스트 정보는 자막(TTS+자막)이 전달, 이미지는 분위기만 담당

---

## 스토리텔링 프레임워크

모든 스크립트는 아래 두 프레임워크를 적용합니다.

### Lisa Cron (Wired for Story) — 5원칙

| 원칙                                    | 체크 포인트                                          |
| --------------------------------------- | ---------------------------------------------------- |
| **Story Instinct** (스토리 본능)        | 시청자가 "이 책 뭔데?"라는 본능적 궁금증을 느끼는가? |
| **Internal Struggle** (내면 갈등)       | 저자 또는 주인공이 겪는 내면의 갈등이 드러나는가?    |
| **Stakes** (판돈)                       | 이 책을 읽지 않으면 놓치는 것이 무엇인가?            |
| **Emotional Consequence** (감정적 결과) | 시청자의 감정(공감/놀람/안도)을 유발하는가?          |
| **Aha Moment** (깨달음)                 | 마지막에 예상 못한 통찰 또는 관점 전환이 있는가?     |

### Dan Heath (Made to Stick) — SUCCESs

| 원칙           | 체크 포인트                                          |
| -------------- | ---------------------------------------------------- |
| **Simple**     | 이 책의 핵심 메시지를 1줄로 요약할 수 있는가?        |
| **Unexpected** | "설마 이런 내용이?"라는 반전이 있는가?               |
| **Concrete**   | 감각적 비유/구체적 장면으로 설명하는가?              |
| **Credible**   | 차트 순위, 리뷰 수, 언론 인용 등 신뢰 근거가 있는가? |
| **Emotional**  | 한국인의 현재 고민/욕구에 연결되는가?                |
| **Stories**    | 팩트 나열이 아닌 "발견 → 몰입 → 깨달음" 구조인가?    |

---

## 스크립트 구조 (5-Scene Framework)

```
[Hook]        0~5초     "미국에서 난리 난" 임팩트 — 수치, 현상, 리뷰
[Buzz]        5~15초    Goodreads 리뷰 반응 — 왜 핫한지 생생하게
[Core Story]  15~30초   책의 핵심 갈등/매력 — 스포일러 없이
[Korean Lens] 30~45초   한국 독자에게 왜 와닿을까 — 구체적 공감
[Wish]        45~55초   "번역됐으면 좋겠다" — 여운 + 검색 유도
```

### 씬별 상세 가이드

#### Scene 1: Hook (0~5초)

> 미국에서의 인기를 숫자와 현상으로 보여준다

**패턴 예시:**

- 숫자 충격: "Goodreads 2만 4천 명이 별 4개를 준 이 책, 한국엔 아직 없습니다."
- 발견형: "미국 서점 1위인데 한국에선 아무도 모르는 책이 있어요."
- 현상 묘사: "이 책 때문에 미국 북스타그램이 난리예요."

#### Scene 2: Buzz (5~15초)

> 실제 Goodreads 리뷰를 인용하여 왜 핫한지 생생하게

- "좋아요 200개가 넘는 리뷰에서 이런 말을 했어요..."
- 리뷰 원문 일부 인용 (영어 → 한국어 의역)
- 독자들의 공통 반응 키워드 요약

#### Scene 3: Core Story (15~30초)

> 책의 핵심 갈등/매력 (스포일러 없이)

- 스릴러: 핵심 미스터리 설정
- 로맨스: 관계의 핵심 갈등/긴장
- 논픽션: 가장 반직관적인 주장
- 판타지: 세계관의 가장 매력적인 설정

#### Scene 4: Korean Lens (30~45초)

> 한국 독자에게 왜 이 책이 와닿을까

- 한국 사회의 현재 이슈/감정과 연결
- "야근하고 택시 타고 집에 와서, 이런 책 하나 읽고 싶다는 생각..."
- **절대 금지**: "한국 사회에도 적용됩니다" 같은 추상적 연결

#### Scene 5: Wish (45~55초)

> "번역됐으면 좋겠다" 여운

- "이 책, 한국에도 빨리 나왔으면 좋겠어요."
- "원서로 먼저 도전해 보실 분?"
- **구독 유도 CTA 절대 금지** — 번역 기대감으로 자연스럽게 마무리

---

## 보이스

### 메인 보이스: `hangout-male` (CustomVoice)

| 항목         | 설정                                                |
| ------------ | --------------------------------------------------- |
| **엔진**     | Qwen3-TTS CustomVoice (8-bit MLX)                   |
| **소스**     | 책봐서 뭐하니 채널 크리에이터 음성                  |
| **베이스**   | `sohee`                                             |
| **레퍼런스** | `pipeline/voice_ref/reference_voice.wav`            |
| **특성**     | 자연스러운 한국 남성 내레이터, 친근하지만 지적인 톤 |

**Sampling 파라미터:**

- temperature: `0.75` (자연스러운 운율 변동)
- top_p: `0.85` (저확률 토큰 제거)
- repetition_penalty: `1.2` (반복 패턴 방지)

---

## 도서 데이터 엔진 (`book_data/`)

도서 발굴부터 미번역 필터링, 리뷰 분석까지 자동화하는 데이터 패키지입니다.

### 모듈 구성

| 모듈                  | 역할                                 | 데이터 소스                   |
| --------------------- | ------------------------------------ | ----------------------------- |
| `goodreads_scanner`   | **1차 소스**: 이번 달 인기 신간 수집 | Goodreads `popular_by_date`   |
| `translation_checker` | 한국 번역 여부 확인 (미번역만 통과)  | 알라딘 웹 검색                |
| `chart_scanner`       | 보조: 4개국 베스트셀러 차트          | 알라딘, NYT, 紀伊國屋, 当当网 |
| `review_aggregator`   | 보조: 크로스플랫폼 리뷰 수집         | Google Books, Hardcover       |
| `book_scorer`         | 쇼츠 적합도 점수화 (5기준)           | goodreads + review 결과       |

### 핵심 파이프라인

```python
# 1. Goodreads 인기 신간 수집
books = GoodreadsScanner().fetch_popular(min_rating=3.8, limit=30)

# 2. 한국 미번역 필터
untranslated = KoreanTranslationChecker().filter_untranslated(books)

# 3. 리뷰 분석 (Top pick)
reviews = GoodreadsScanner().fetch_reviews(book.url, limit=10)
```

### AI 점수화 기준 (100점 만점)

| 기준                  | 배점 | 설명                                     |
| --------------------- | ---- | ---------------------------------------- |
| **대중 열광도**       | 25   | Goodreads 평점 + 리뷰 수 + 리뷰 감성     |
| **스토리텔링 잠재력** | 25   | 반전/갈등/논쟁 — 55초에 담을 수 있는가?  |
| **한국 공감 연결**    | 20   | 한국 사회 이슈/감정에 연결 가능한가?     |
| **발견의 놀라움**     | 15   | "이런 책이 있었어?" 리액션 유발          |
| **시각화 가능성**     | 15   | Warm Bibliotheca 스타일로 표현 가능한가? |

---

## 업로드 히스토리 (필수)

**업로드 성공 시 반드시 `pipeline/analytics/upload_history.json`에 기록합니다.**

기록 항목:

```json
{
  "episode_id": "book_ep001",
  "title": "영상 제목",
  "book_title": "원서 제목",
  "book_author": "저자명",
  "chart_source": "NYT / 교보문고 / etc.",
  "uploaded_at": "2026-02-22",
  "url": "https://youtube.com/shorts/xxxxx",
  "video_id": "xxxxx",
  "privacy_status": "private"
}
```

업로드 후 `uploads` 배열에 append하고 저장합니다. 이전 세션의 기록도 유지합니다.

---

## YouTube 채널 라우팅

- **채널**: 책봐서 뭐하니? (@Hangoutwith_Books)
- **채널 키**: `bookshelf` (channels.json)
- `series_routing`: `"book"` / `"책봐서 뭐하니"` → `bookshelf`

---

## 수익화 전략

### Phase 1: 쇼츠 블리츠 → YPP 재활성화

```
목표: 구독자 1,000명 + 시청 시간 4,000시간 (또는 쇼츠 1,000만 조회)
전략: 일 1~2편 쇼츠 업로드, 4개국 차트 기반 무한 토픽
예상: 2~3개월 내 YPP 자격 도달
```

### Phase 2: 롱폼 병행

```
목표: 롱폼 RPM ($3~$8) 확보
전략: 쇼츠에서 반응 좋은 도서 → 10~15분 딥다이브 영상
콘텐츠: "이 달의 베스트셀러 TOP 5", "미국 vs 일본 독서 트렌드 비교"
```

### Phase 3: 수익 다각화

```
- 제휴 링크: 교보문고/예스24/Amazon 어필리에이트
- 협찬: 출판사 신간 소개 (PPL 아닌 자연스러운 큐레이션)
- 커뮤니티: 멤버십 전용 월간 북리스트
```

### RPM 예상 (교육/문화 니치)

| 포맷      | RPM 예상       |
| --------- | -------------- |
| Shorts    | $0.05~$0.15/1K |
| Long-form | $3~$8/1K       |
| 제휴 링크 | 구매당 3~7%    |

---

## 스킬 목록

| 스킬         | 명령어          | 모델   | 역할                               |
| ------------ | --------------- | ------ | ---------------------------------- |
| Book Factory | `/book-factory` | Sonnet | 일일 파이프라인 오케스트레이터     |
| Book Mine    | `/book-mine`    | Sonnet | 4개국 차트 스캔 + 도서 선정        |
| Book Script  | `/book-script`  | Sonnet | 5-Scene 스크립트 + 메타데이터 생성 |
| Book Review  | `/book-review`  | Opus   | YouTube 정책 준수 + 품질 검증      |
| Book Analyze | `/book-analyze` | Sonnet | 주간 성과 분석 + 전략 조정         |

---

## 파이프라인 흐름

```
[자동] /book-mine       (Sonnet)  4개국 차트 스캔 → 도서 선정 (~2분)
  ↓
[자동] /book-script     (Sonnet)  5-Scene 스크립트 + 메타데이터 (~3분)
  ↓
[자동] shorts-render    (Haiku)   TTS + FFmpeg 렌더링 (~5분)
  ↓
[자동] /book-review     (Opus)    정책 준수 + 품질 검증 (~1분)
  ↓
[수동] CEO 검수 + 업로드 (~1분)
──────────────────────────────
총 ~12분/편
```

> 렌더링은 ShortsFactory_Agent의 공유 엔진(`libs/`)을 사용합니다.

---

## YouTube 정책 준수 체크리스트

모든 쇼츠는 `/book-review`에서 아래 7항목을 자동 검증:

| #   | 항목              | 기준                                     |
| --- | ----------------- | ---------------------------------------- |
| 1   | 원본 출처 명시    | 도서 제목, 저자, 출판사, 차트 출처 기재  |
| 2   | 실질적 변형       | 단순 요약이 아닌 고유 관점/해석 포함     |
| 3   | AI 합성 오인 방지 | 실제 저자/인물로 오해 소지 없음          |
| 4   | 크리에이터 관점   | 한국인 관점의 고유 해석/공감 포인트 포함 |
| 5   | 중복 회피         | 이전 에피소드와 동일 도서/구조 중복 없음 |
| 6   | 훅 강도           | 1~3초 내 시선 잡기                       |
| 7   | 정보 정확성       | 도서 정보/차트 순위/리뷰 인용 팩트 체크  |

---

## 컨텍스트 관리 안전장치

ShortsFactory_Agent 공통 규칙을 그대로 적용합니다.

### 1. 스킬 단위 격리 실행

```
각 스킬은 독립 서브에이전트(Task)로 실행 → 메인 컨텍스트에 결과만 반환
- /book-mine    → Task (Sonnet) — 결과: data/charts/YYYY-MM-DD.json
- /book-script  → Task (Sonnet) — 결과: pipeline/scripts/{book-id}.json
- shorts-render → Task (Haiku)  — 결과: pipeline/rendered/{episode-id}.mp4
- /book-review  → Task (Opus)   — 결과: pipeline/analytics/review/{episode-id}.yaml
```

### 2. 파일 기반 상태 전달

```
스킬 간 데이터는 반드시 파일(JSON/YAML)로 전달합니다.
메인 컨텍스트에 스크립트 전문, 로그 전문을 붙여넣지 않습니다.
결과는 "파일 경로 + 핵심 메트릭"만 반환합니다.
```

### 3. 배치 실행 시 진행률 파일

```
배치 모드에서 pipeline/queue/batch_status.json 을 유지합니다:
{
  "batch_id": "20260222_001",
  "total": 5,
  "completed": 3,
  "current": "book_ep004",
  "results": [
    {"episode_id": "book_ep001", "status": "PASS", "path": "rendered/book_ep001.mp4"},
    ...
  ]
}
중단 시 이 파일로 재개할 수 있습니다.
```

### 4. 컨텍스트 위험 신호

```
아래 상황이면 즉시 /compact 또는 중간 요약을 수행:
- 렌더링 로그가 100줄 이상 누적
- 서브에이전트 결과가 3회 이상 인라인으로 반환
- 동일 세션에서 5편 이상 연속 생산
```

---

## 타 에이전트 연계

```
ShortsFactory_Agent ──→  ShortsFactory3  (공유 렌더링 엔진, libs/ 심링크)
ShortsFleet         ──→  ShortsFactory3  (멀티채널 오케스트레이션, bookshelf 키)
Income_Factory      ──→  ShortsFactory3  (수익화 전략 연계)
Growth_Agent        ──→  ShortsFactory3  (KPI 트래킹)
Shield_Agent        ──→  ShortsFactory3  (콘텐츠 보안 검증)
Translate_Agent     ──→  ShortsFactory3  (다국어 도서 정보 번역 지원)
```

---

## 디렉토리 구조

```
ShortsFactory3_Agent/
├── .claude/
│   ├── CLAUDE.md                        ← 이 문서
│   └── skills/                          ← 5개 스킬
│       ├── book-factory/SKILL.md
│       ├── book-mine/SKILL.md
│       ├── book-script/SKILL.md
│       ├── book-review/SKILL.md
│       └── book-analyze/SKILL.md
├── book_data/                           ← 도서 데이터 엔진
│   ├── chart_scanner.py                 ← 4개국 차트 스캐너
│   ├── review_aggregator.py             ← 리뷰/서평 수집기
│   └── book_scorer.py                   ← 쇼츠 적합도 평가
├── pipeline/
│   ├── scripts/                         ← 스크립트 (JSON)
│   ├── images/                          ← 생성된 이미지
│   │   └── _cache/                      ← 이미지 캐시
│   ├── rendered/                        ← 렌더링된 영상
│   │   └── samples/                     ← 샘플 영상
│   ├── queue/                           ← 업로드 대기열
│   ├── temp/                            ← TTS 임시 파일
│   ├── voice_ref/                       ← 보이스 레퍼런스
│   │   └── reference_voice.wav          ← hangout-male 원본
│   └── analytics/                       ← 성과 데이터
│       ├── upload_history.json          ← 업로드 기록
│       └── review/                      ← 리뷰 결과 (YAML)
├── data/
│   ├── charts/                          ← 차트 스냅샷 (일별)
│   ├── books/                           ← 도서 상세 정보
│   ├── performance/                     ← 주간 KPI
│   └── learnings/                       ← 누적 학습
├── templates/
│   └── hooks.json                       ← 훅 문장 패턴 라이브러리
├── libs/ → ../ShortsFactory_Agent/libs/ ← 공유 렌더링 엔진 (심링크)
└── outputs/                             ← 최종 배포 파일
```

---

## 모델 비용 전략

```
Opus   → 정책 검증(book-review)에만 사용 (편당 1회)
Sonnet → 차트 스캔, 스크립트, 분석 (메인 작업)
Haiku  → 렌더링 트리거 (단순 실행)
```

---

## 버전 정보

- 생성일: 2026-02-22
- 최종 업데이트: 2026-02-22
- 버전: v1.0 — "책봐서 뭐하니? 채널 프로덕션 레디"
- 공유 엔진: ShortsFactory_Agent libs/ v3.2+
