# ShortsFactory v4 — 차세대 YouTube 쇼츠 생산 플랫폼

> 채널 프로파일 기반 멀티채널 통합 생산 + 성과 피드백 루프

> **HTML 산출물 생성 시**: `outputs/templates/`에서 주제에 맞는 템플릿을 Read로 읽고 스타일을 따를 것. Pretendard 15px, 행간 1.8, 한글 중심. 상세: 루트 CLAUDE.md 참조.

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 핵심 철학

1. **채널 = JSON 프로파일** — 에이전트 복제 불필요. 새 채널은 `channels/*.json` 1개 추가로 끝
2. **엔진 = 교체 가능한 모듈** — TTS, 비주얼, 합성 엔진을 채널별로 독립 선택
3. **피드백 루프 = YouTube Analytics -> 토픽 선정 반영** — 성과 데이터가 다음 생산에 직접 영향
4. **품질 게이트 = 절대 건너뛰지 않음** — `/review` 미통과 콘텐츠는 업로드 큐에 진입 불가
5. **영구 기억 = 세션을 넘는 학습** — 성공/실패 패턴이 다음 세션에 자동 반영
6. **좋아요율 > 조회수** — 알고리즘의 진짜 시그널은 like rate (4-5% 기준)
7. **CTA 무효** — 쇼츠에서 "구독해주세요" 류의 CTA는 효과 없음. 콘텐츠 밀도에 집중

---

## 파이프라인 흐름

```
[자동] /mine      (Sonnet)  트렌드+성과 기반 토픽 선정 (~1분)
  |
[자동] /script    (Sonnet)  채널 프로파일 기반 스크립트 (~2분)
  |
[자동] /render    (Haiku)   TTS + 비주얼 + 합성 (~5분)
  |
[자동] /review    (Opus)    정책 + 품질 게이트 (~1분)
  |
[자동] /upload    (Haiku)   업로드 큐 + CEO 승인 게이트
  |
[자동] /analyze   (Sonnet)  주간 성과 -> 피드백 루프
```

---

## 스킬 목록 (9개)

| 스킬      | 명령어      | 모델   | 역할                                        |
| --------- | ----------- | ------ | ------------------------------------------- |
| Factory   | `/factory`  | Sonnet | 일일 파이프라인 오케스트레이터              |
| Mine      | `/mine`     | Sonnet | 트렌드+성과 기반 토픽 선정                  |
| Script    | `/script`   | Sonnet | 채널 프로파일 기반 스크립트 + 메타데이터    |
| Render    | `/render`   | Haiku  | TTS + 비주얼 + FFmpeg 합성                  |
| Review    | `/review`   | Opus   | YouTube 정책 준수 + 품질 게이트             |
| Translate | `/translate`| Haiku  | 스크립트 다국어 번역 (KO/EN/JA/CN)         |
| Upload    | `/upload`   | Haiku  | YouTube 업로드 큐 + 스케줄러 + CEO 승인     |
| Analyze   | `/analyze`  | Sonnet | 주간 성과 분석 + 피드백 루프 + 전략 조정    |
| AB Test   | `/ab-test`  | Sonnet | 썸네일/훅/메타데이터 A/B 테스트 설계 및 추적 |

---

## 채널 프로파일 시스템

### 원칙: 1 채널 = 1 JSON

`channels/*.json`으로 채널별 설정을 완전 분리합니다. 새 채널 추가 = JSON 1개 생성.

### 프로파일 구조

```json
{
  "channel_id": "whatif",
  "channel_name": "만약에~",
  "language": "ko",
  "niche": "entertainment/thought-experiment",
  "visual_style": "1980s-90s manga, bold ink, retro neon",
  "visual_suffix": ", 1980s-90s Japanese bubble era manga style, bold ink outlines...",
  "tts_engine": "qwen3",
  "tts_preset": "whatif-female",
  "tts_sampling": { "temperature": 0.75, "top_p": 0.85, "repetition_penalty": 1.2 },
  "script_framework": "succes+story",
  "script_structure": ["hook", "setup", "twist", "impact", "closer"],
  "target_duration_sec": 30,
  "upload": {
    "youtube_channel_key": "whatif",
    "default_privacy": "private",
    "schedule_timezone": "America/New_York",
    "schedule_slots": ["08:00", "17:00"]
  },
  "analytics": {
    "feedback_weight": 0.3,
    "min_episodes_for_feedback": 10
  }
}
```

### 현재 등록 채널

| 채널 키     | 채널명           | 니치               | 언어 | 비주얼 스타일      | TTS 엔진 |
| ----------- | ---------------- | ------------------ | ---- | ------------------ | --------- |
| `whatif`    | 만약에~          | 사고실험/엔터      | KO   | 80s 망가 네온      | qwen3     |
| `paperman`  | 논문맨           | 투자심리/행동경제  | KO   | Nano Banana 인포   | qwen3     |
| `bookshelf` | 책봐서 뭐하니?   | 해외도서 큐레이션  | KO   | Warm Bibliotheca   | qwen3     |

---

## 엔진 시스템

채널 프로파일의 엔진 필드로 채널별 독립 선택합니다.

### TTS 엔진

| 엔진 키      | 유형          | 비용   | 특징                                     |
| ------------ | ------------- | ------ | ---------------------------------------- |
| `qwen3`      | 로컬 MLX      | 무료   | VoiceDesign + CustomVoice, 8-bit 양자화  |
| `elevenlabs` | API           | 유료   | 최고 품질, 다국어, 음성 클로닝           |
| `edge`       | 폴백          | 무료   | Microsoft Edge TTS, 안정적이나 단조로움  |

### Visual 엔진

| 엔진 키      | 유형          | 비용   | 특징                                     |
| ------------ | ------------- | ------ | ---------------------------------------- |
| `local_sd`   | 로컬 MPS      | 무료   | SSD-1B, 1080x1920, 30 steps             |
| `flux_api`   | API           | 유료   | 고품질, 스타일 일관성 우수               |
| `kling_video` | API          | 유료   | AI 영상 생성, 모션 포함                  |

### Compose 엔진

- **FFmpeg + MoviePy** — 1080x1920, 30fps, libx264
- 오디오 마스터링: 하이패스 80Hz -> EQ -> 컴프레서(3:1) -> 리버브 -> -16 LUFS

### Upload 엔진

- **YouTube Data API v3** + 스케줄러
- CEO 승인 게이트 (private 업로드 -> 검수 -> public 전환)

### Analytics 엔진

- **YouTube Analytics API** + feedback_loop
- 성과 데이터 -> 토픽 선정 가중치 자동 조정

---

## 영구 기억 시스템 (Persistent Memory)

> DEV.to 교훈: 65+ 세션 동안 에이전트가 기억을 유지하며 패턴을 학습한 것이 핵심 차별점.

### 구조

```
data/memory/{channel_id}/
    session_log.jsonl           — 매 세션 의사결정 기록 (append-only)
    performance_patterns.json   — 누적 학습된 성공 패턴 (주간 업데이트)
    failed_experiments.json     — 실패한 시도 (반복 방지)
    visual_fatigue.json         — 비주얼 스타일 사용 빈도 (단조로움 방지)
```

### 사용 규칙

1. **모든 생산 세션**에서 `session_log.jsonl`에 결정/결과 기록
2. **주간 분석** (`/analyze`) 시 `performance_patterns.json` 업데이트
3. **성과 하위 10%** 콘텐츠는 `failed_experiments.json`에 기록
4. **비주얼 변주** — 매 렌더링 시 `visual_fatigue.json` 체크 → 최소 사용 스타일 우선
5. **토픽 선정** (`/mine`) 시 영구 기억을 채널 프로파일보다 먼저 참조

### 엔진 코드

`engines/memory/session_memory.py` — SessionMemory 클래스

---

## 성과 지표 우선순위

> DEV.to 교훈: 좋아요율(4-5%)이 알고리즘 추천의 진짜 지표. 72시간 이전 데이터만 신뢰.

| 우선순위 | 지표                | 기준                   | 역할                |
| -------- | ------------------- | ---------------------- | ------------------- |
| 1 (Primary) | 좋아요율 (like_rate) | 4-5%가 건강한 채널  | 알고리즘 시그널     |
| 2 (Primary) | 평균 시청 시간       | 65초 영상의 80%+ | 콘텐츠 품질 지표    |
| 3 (Secondary) | 조회수 (views)     | sqrt로 댐핑         | 도달 범위 참고      |
| 4 (Secondary) | CTR                | 5%+                   | 제목/썸네일 효과    |
| 5 (Secondary) | RPM                | 니치별 상이           | 수익 효율           |

### 72시간 규칙

YouTube Analytics는 게시 후 72시간이 지나야 안정화됨.
`feedback_loop.py`의 `min_age_hours=72` 파라미터로 최근 영상 자동 제외.

---

## 영상 길이 전략

> DEV.to 교훈: 75초 쇼츠 > 30초 쇼츠. 긴 쇼츠가 일관되게 성과 우수.

채널 프로파일의 `target_duration_sec` 기본값: **65-75초**

| 채널       | 기존   | 변경   | 이유                          |
| ---------- | ------ | ------ | ----------------------------- |
| whatif     | 30초   | 65초   | 사고실험에 충분한 서사 필요   |
| paperman   | 30초   | 65초   | 논문 발견+적용 사례 2개 이상  |
| bookshelf  | 30초   | 70초   | 도서 소개+한국 렌즈+기대감    |

---

## 비주얼 변주 시스템

> DEV.to 교훈: 50영상 이후 동일 스타일 반복 시 시청자 이탈.

채널 프로파일의 `visual_variation` 필드:

```json
{
  "cycle_every_n_episodes": 10,
  "variation_pool": ["dark noir manga", "pop art manga", ...],
  "note": "기본 스타일 유지하되, cycle마다 pool에서 1개 믹스"
}
```

`engines/memory/session_memory.py`의 `suggest_visual_variant()`가 최소 사용 스타일 자동 추천.

---

## 도메인 전문성 검증

> DEV.to 교훈: AI로 누구나 영상을 만들 수 있지만, 도메인 깊이가 차별점.

채널 프로파일의 `domain_expertise` 필드:

```json
{
  "fields": ["behavioral-finance", "investment-psychology"],
  "validation_rule": "논문 출처(저자, 저널, 연도) 최소 1개 명시."
}
```

`/script` 스킬에서 `validation_rule` 충족 여부를 자동 체크.
`/review` 스킬에서 도메인 전문성 항목 추가 검증.

---

## 디렉토리 구조

```
ShortsFactory_v4/
+-- .claude/
|   +-- CLAUDE.md                          <- 이 문서
|   +-- skills/                            <- 9개 스킬
|       +-- factory/SKILL.md
|       +-- mine/SKILL.md
|       +-- script/SKILL.md
|       +-- render/SKILL.md
|       +-- review/SKILL.md
|       +-- translate/SKILL.md
|       +-- upload/SKILL.md
|       +-- analyze/SKILL.md
|       +-- ab-test/SKILL.md
+-- channels/                              <- 채널 프로파일 (JSON)
|   +-- whatif.json
|   +-- paperman.json
|   +-- bookshelf.json
+-- engines/                               <- 교체 가능 엔진 모듈
|   +-- tts/
|   |   +-- qwen3_tts.py
|   |   +-- elevenlabs_tts.py
|   |   +-- edge_tts.py
|   +-- visual/
|   |   +-- local_sd.py
|   |   +-- flux_api.py
|   |   +-- kling_video.py
|   +-- compose/
|   |   +-- video_composer.py
|   |   +-- subtitle_gen.py
|   +-- upload/
|   |   +-- youtube_uploader.py
|   |   +-- upload_scheduler.py
|   +-- analytics/
|   |   +-- youtube_analytics.py
|   |   +-- feedback_loop.py
|   +-- memory/
|       +-- session_memory.py              <- 영구 기억 엔진
+-- libs/                                  <- 공용 유틸리티
|   +-- image_gen.py
|   +-- metadata_gen.py
|   +-- mood_profiles.py
|   +-- render_samples.py
|   +-- translate_script.py
+-- pipeline/
|   +-- topics/                            <- 토픽 리서치 (YAML)
|   +-- scripts/                           <- 스크립트 (JSON)
|   +-- images/                            <- 생성된 이미지
|   |   +-- _cache/                        <- 이미지 캐시
|   +-- rendered/                          <- 렌더링된 영상
|   |   +-- samples/                       <- 샘플/프리뷰
|   +-- queue/                             <- 업로드 대기열
|   +-- temp/                              <- TTS 임시 파일
|   +-- voice_ref/                         <- 보이스 레퍼런스 WAV
|   +-- analytics/                         <- 성과 데이터
|       +-- upload_history.json
|       +-- feedback/                      <- 피드백 루프 데이터
|       +-- ab_tests/                      <- A/B 테스트 결과
+-- data/
|   +-- trends/                            <- 트렌드 스냅샷
|   +-- charts/                            <- 차트 데이터 (도서 등)
|   +-- performance/                       <- 주간 KPI
|   +-- learnings/                         <- 누적 학습
|   +-- memory/                            <- 영구 기억 (세션 간 유지)
+-- templates/
|   +-- niches.json                        <- 니치별 RPM/키워드
|   +-- hooks.json                         <- 훅 문장 패턴
|   +-- formats.json                       <- 영상 포맷 템플릿
|   +-- lang_config.json                   <- 언어별 설정
+-- book_data/                             <- 도서 데이터 엔진 (bookshelf 채널용)
|   +-- goodreads_scanner.py
|   +-- translation_checker.py
|   +-- chart_scanner.py
|   +-- review_aggregator.py
|   +-- book_scorer.py
+-- outputs/                               <- 최종 배포/보고서
+-- monitor/                               <- 파이프라인 로거
    +-- pipeline_logger.py
```

---

## YouTube 정책 준수 체크리스트

모든 쇼츠는 `/review`에서 아래 7항목을 자동 검증합니다:

| #   | 항목              | 기준                              |
| --- | ----------------- | --------------------------------- |
| 1   | 원본 출처 명시    | 팩트/데이터의 출처 기재           |
| 2   | 실질적 변형       | 단순 복제/재조합 아님             |
| 3   | AI 합성 오인 방지 | 실제 인물/사건으로 오해 소지 없음 |
| 4   | 크리에이터 관점   | 고유 해석/비유/스토리 포함        |
| 5   | 중복 회피         | 이전 에피소드와 구조적 차별화     |
| 6   | 훅 강도           | 1~3초 내 시선 잡기                |
| 7   | 정보 정확성       | 팩트 체크 완료                    |

---

## 이미지 프롬프트 철칙

> **AI 이미지 생성에서 텍스트/숫자는 항상 어색하게 렌더링됩니다. 100% 시각적 표현만 사용합니다.**

### 절대 금지

- 간판/배너/뱃지에 문구: `banner reading '...'`
- 화면/UI에 텍스트: `app screen showing '...'`
- 숫자/퍼센트/가격: `badge showing 1,247회`
- 말풍선 대사: `speech bubble saying '...'`
- 스코어보드/차트 수치: `stock chart going up 3000%`

### 대신 사용

- 감정/분위기를 **조명, 색감, 구도**로 표현
- 수치는 **크기 대비, 에너지 바, 빛의 강도**로 상징화
- UI/화면은 **빛나는 포털, 신비로운 게이트웨이**로 추상화
- 텍스트 정보는 자막(TTS+자막)이 전달 -> 이미지는 분위기만 담당

### 적용 범위

- `/script`의 `image_prompt` 생성 시 (업스트림)
- `image_gen.py`의 `_sanitize_prompt` + 비주얼 엔진 프롬프트 (다운스트림 안전장치)

---

## 컨텍스트 관리 안전장치

배치 생산 시 컨텍스트 창이 커지면 작업이 끊길 수 있습니다. 아래 규칙을 준수합니다.

### 1. 스킬 단위 격리 실행

```
각 스킬은 독립 서브에이전트(Task)로 실행 -> 메인 컨텍스트에 결과만 반환
- /mine      -> Task (Sonnet) -- 결과: pipeline/topics/YYYY-MM-DD.yaml
- /script    -> Task (Sonnet) -- 결과: pipeline/scripts/{episode-id}.json
- /render    -> Task (Haiku)  -- 결과: pipeline/rendered/{episode-id}.mp4
- /review    -> Task (Opus)   -- 결과: pipeline/analytics/{episode-id}.yaml
- /upload    -> Task (Haiku)  -- 결과: pipeline/analytics/upload_history.json 업데이트
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
  "batch_id": "20260307_001",
  "channel": "whatif",
  "total": 5,
  "completed": 3,
  "current": "whatif_ep030",
  "results": [
    {"episode_id": "whatif_ep028", "status": "PASS", "path": "rendered/whatif_ep028.mp4"},
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

## 모델 비용 전략

```
Opus   -> 정책 검증(/review)에만 사용 (편당 1회, 최고 정확도 필요)
Sonnet -> 토픽, 스크립트, 분석, A/B 테스트 (메인 작업)
Haiku  -> 렌더링, 업로드, 번역 트리거 (단순 실행, 비용 최소화)
```

| 모델   | 사용 스킬                          | 편당 호출 | 비고               |
| ------ | ---------------------------------- | --------- | ------------------ |
| Opus   | `/review`                          | 1회       | 품질 게이트 전용   |
| Sonnet | `/mine`, `/script`, `/analyze`, `/ab-test` | 3~4회 | 핵심 생산 작업     |
| Haiku  | `/render`, `/upload`, `/translate` | 2~3회     | 실행 트리거 전용   |

---

## 마이그레이션 현황

ShortsFactory v4는 기존 3개 에이전트를 통합합니다.

| 기존 에이전트          | 채널           | v4 채널 키   | 마이그레이션 상태 | 비고                            |
| ---------------------- | -------------- | ------------ | ----------------- | ------------------------------- |
| ShortsFactory_Agent    | 만약에~        | `whatif`     | 예정              | 스킬 6개 -> v4 통합 스킬로 전환 |
| ShortsFactory2_Agent   | 논문맨 (Paper) | `paperman`   | 예정              | 스킬 7개 -> v4 통합 스킬로 전환 |
| ShortsFactory3_Agent   | 책봐서 뭐하니? | `bookshelf`  | 예정              | 스킬 5개 -> v4 통합 스킬로 전환 |

### 마이그레이션 계획

```
Phase 1: v4 엔진 + 채널 프로파일 구조 구축
Phase 2: whatif 채널 마이그레이션 + 검증
Phase 3: paperman, bookshelf 채널 마이그레이션
Phase 4: 기존 SF1/SF2/SF3 에이전트 아카이브
```

### 공유 자산 이전 대상

- `libs/` 공유 코드 -> `engines/` + `libs/` 재배치
- `book_data/` 도서 엔진 -> `book_data/` 그대로 이전
- `pipeline/voice_ref/` 보이스 레퍼런스 -> 채널별 `pipeline/voice_ref/` 통합
- 업로드 히스토리 -> `pipeline/analytics/upload_history.json` 통합

---

## 버전 정보

- **버전**: v4.1 — "멀티채널 통합 생산 플랫폼 + 영구 기억 + 성과 피드백"
- **생성일**: 2026-03-07
- **최종 업데이트**: 2026-03-07
- **통합 대상**: ShortsFactory_Agent (v3.2), ShortsFactory2_Agent (Paper), ShortsFactory3_Agent (Book)
- **v4.1 변경**: DEV.to 6주 실험 교훈 7개 반영 — 영구 기억, 좋아요율 우선, 72h 지연, 65-75초 영상, CTA 제거, 비주얼 변주, 도메인 전문성
