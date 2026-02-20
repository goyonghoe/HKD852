# ShortsFactory_Agent — YouTube Shorts 자동화 공장

> 트렌드 리서치 → 스크립트 → 렌더링 → 검수까지 10분/편 목표의 반자동 쇼츠 생산 파이프라인

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 핵심 철학

```
트렌드 감지 → 토픽 선정 → 스크립트 생성 → 영상 렌더 → 정책 검수 → CEO 확인 → 업로드
```

- **10분/편** — 파이프라인 속도를 지속 개선하여 1편당 10분 이내 생산
- **트렌드 기반 니치** — 고정 니치 없음, 매번 AI가 트렌드+RPM 기반 자동 선정
- **글로벌 타겟** — 영어 우선, 고RPM 국가(미국, 캐나다, 영국, 호주) 집중
- **정책 100% 준수** — YouTube 2026 AI 콘텐츠 정책 자동 검증 게이트
- **크리에이터 관점 필수** — 단순 팩트 나열 금지, 해석/비유/스토리텔링 필수

---

## 수익 모델

```
Shorts 광고 RPM ($0.05~$0.15/1K)
  ↓ 구독자 확보
Long-form 전환 RPM ($1~$20/1K)
  ↓ 브랜드 구축
제휴 마케팅 + 스폰서십
```

**RPM 우선순위 니치:**
1. Finance/Investing ($12-25)
2. AI/Tech ($8-15)
3. Productivity ($6-10)
4. Health/Wellness ($4-8)
5. Entertainment ($2-4)

---

## 파이프라인 흐름

```
[자동] /topic-mine     (Sonnet)  트렌드 스캔 → 토픽 선정 (~1분)
  ↓
[자동] /shorts-script  (Sonnet)  스크립트 + 메타데이터 (~2분)
  ↓
[자동] /shorts-render  (Haiku)   TTS + FFmpeg 렌더링 (~5분)
  ↓
[자동] /shorts-review  (Opus)    정책 준수 + 품질 검증 (~1분)
  ↓
[수동] CEO 검수 + 업로드 (~1분)
──────────────────────────────
총 ~10분/편
```

---

## 스킬 목록

| 스킬 | 명령어 | 모델 | 역할 |
|------|--------|------|------|
| Shorts Factory | `/shorts-factory` | Sonnet | 일일 파이프라인 오케스트레이터 |
| Topic Mine | `/topic-mine` | Sonnet | 트렌드 리서치 + 토픽 자동 선정 |
| Shorts Script | `/shorts-script` | Sonnet | 스크립트 + 메타데이터 생성 |
| Shorts Render | `/shorts-render` | Haiku | TTS + FFmpeg 영상 렌더링 |
| Shorts Review | `/shorts-review` | Opus | 정책 준수 + 품질 검증 |
| Shorts Analyze | `/shorts-analyze` | Sonnet | 주간 성과 분석 + 전략 조정 |

---

## 타 에이전트 연계

```
Income_Factory  ──→  ShortsFactory  (아이디어 공유)
Marketing_Agent ──→  ShortsFactory  (ASO/소셜 전략)
Growth_Agent    ──→  ShortsFactory  (KPI 트래킹)
Shield_Agent    ──→  ShortsFactory  (콘텐츠 보안 검증)
Translate_Agent ──→  ShortsFactory  (다국어 확장)
```

---

## 디렉토리 구조

```
ShortsFactory_Agent/
├── .claude/
│   ├── CLAUDE.md                    ← 이 문서
│   └── skills/                      ← 6개 스킬
│       ├── shorts-factory/SKILL.md
│       ├── topic-mine/SKILL.md
│       ├── shorts-script/SKILL.md
│       ├── shorts-render/SKILL.md
│       ├── shorts-review/SKILL.md
│       └── shorts-analyze/SKILL.md
├── pipeline/
│   ├── topics/                      ← 토픽 리서치 (YAML)
│   ├── scripts/                     ← 스크립트 (JSON)
│   ├── rendered/                    ← 렌더링된 영상
│   ├── queue/                       ← 업로드 대기열
│   └── analytics/                   ← 성과 데이터
├── libs/
│   ├── tts_engine.py                ← Edge TTS 다국어 래퍼
│   ├── video_composer.py            ← FFmpeg 영상 합성
│   ├── subtitle_gen.py              ← 자막 생성기
│   └── metadata_gen.py              ← 메타데이터 생성
├── templates/
│   ├── niches.json                  ← 니치별 RPM/키워드 설정
│   ├── hooks.json                   ← 훅 문장 패턴 라이브러리
│   └── formats.json                 ← 영상 포맷 템플릿
├── data/
│   ├── trends/                      ← 트렌드 스냅샷
│   ├── performance/                 ← 주간 KPI
│   └── learnings/                   ← 누적 학습
└── outputs/                         ← 최종 배포 파일
```

---

## YouTube 정책 준수 체크리스트

모든 쇼츠는 `/shorts-review`에서 아래 7항목을 자동 검증:

| # | 항목 | 기준 |
|---|------|------|
| 1 | 원본 출처 명시 | 팩트/데이터의 출처 기재 |
| 2 | 실질적 변형 | 단순 복제/재조합 아님 |
| 3 | AI 합성 오인 방지 | 실제 인물/사건으로 오해 소지 없음 |
| 4 | 크리에이터 관점 | 고유 해석/비유/스토리 포함 |
| 5 | 중복 회피 | 이전 에피소드와 구조적 차별화 |
| 6 | 훅 강도 | 1~3초 내 시선 잡기 |
| 7 | 정보 정확성 | 팩트 체크 완료 |

---

## TTS 보이스 설정

### 메인 엔진: Qwen3-TTS 1.7B (로컬 MLX)

**VoiceDesign 엔진** — instruct 텍스트로 음색/톤/말투 디자인:

| 프리셋 | 특성 | 용도 |
|--------|------|------|
| `whatif-female` | 20대 여성, 카페 수다 톤 | 만약에 시리즈 (기본) |
| `whatif-male` | 30대 남성, 다큐 내레이터 | 만약에 시리즈 (남성) |
| `witty-male` | 팟캐스트 호스트, 재치 | 테크/AI 콘텐츠 |
| `trust-male` | 40대 남성, 신뢰감 | 금융/교양 |
| `energetic-male` | 20대 남성, 에너지 | 엔터테인먼트 |
| `calm-female` | 30대 여성, 차분 | 건강/웰니스 |
| `storyteller-female` | 할머니 이야기꾼 | 역사/민담 |
| `cool-female` | 30대 여성, 시크 | 뉴스/시사 |

**CustomVoice 엔진** — 레퍼런스 음성 클로닝:

| 프리셋 | 소스 | 베이스 | 용도 |
|--------|------|--------|------|
| `hangout-male` | 책봐서 뭐하니 채널 | `sohee` | 자연스러운 한국 남성 내레이터 |

**Sampling 파라미터 (v3.2):**
- temperature: `0.75` (자연스러운 운율 변동)
- top_p: `0.85` (저확률 토큰 제거)
- repetition_penalty: `1.2` (반복 패턴 방지)

---

## 모델 비용 전략

```
Opus   → 정책 검증(review)에만 사용 (편당 1회)
Sonnet → 토픽, 스크립트, 분석 (메인 작업)
Haiku  → 렌더링 트리거 (단순 실행)
```

---

## 컨텍스트 관리 안전장치

배치 생산 시 컨텍스트 창이 커지면 작업이 끊길 수 있습니다. 아래 규칙을 준수합니다.

### 1. 스킬 단위 격리 실행
```
각 스킬은 독립 서브에이전트(Task)로 실행 → 메인 컨텍스트에 결과만 반환
- /topic-mine   → Task (Sonnet) — 결과: topics/YYYY-MM-DD.yaml
- /shorts-script → Task (Sonnet) — 결과: scripts/{topic-id}.json
- /shorts-render → Task (Haiku)  — 결과: rendered/{episode-id}.mp4
- /shorts-review → Task (Opus)   — 결과: review/{episode-id}.yaml
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
  "batch_id": "20260218_001",
  "total": 5,
  "completed": 3,
  "current": "whatif_ep004",
  "results": [
    {"episode_id": "whatif_ep001", "status": "PASS", "path": "rendered/ep001.mp4"},
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

### 5. 스크립트 품질 프레임워크

모든 스크립트는 아래 두 프레임워크를 적용합니다:

**Made to Stick (SUCCESs):**
| 원칙 | 체크 포인트 |
|------|-----------|
| Simple | 핵심 메시지 1줄로 요약 가능한가? |
| Unexpected | 예측을 깨는 반전이 있는가? |
| Concrete | 감각적 비유/장면이 있는가? |
| Credible | 출처나 구체적 수치가 있는가? |
| Emotional | 공감/놀람/웃음 중 하나를 유발하는가? |
| Stories | 팩트 나열이 아닌 기대→좌절→깨달음 구조인가? |

**스토리만이 살길이다:**
| 원칙 | 체크 포인트 |
|------|-----------|
| 스토리 본능 | 주인공의 기대와 좌절이 있는가? |
| 확실한 상대 | 시청자가 "내 이야기"로 느끼는가? |
| 갈등의 힘 | 긴장감을 만드는 갈등이 있는가? |
| 구체성 | 추상이 아닌 감각적 장면인가? |
| Aha! 모멘트 | 마지막에 예상 못한 통찰이 있는가? |

---

## 버전 정보

### v1.0 — "만약에 시리즈 프로덕션 레디" (2026-02-18)

**확정된 파이프라인 스택:**
| 컴포넌트 | 기술 | 설정 |
|----------|------|------|
| TTS 엔진 | Qwen3-TTS 1.7B VoiceDesign (8-bit MLX) | 8개 VoiceDesign + 1개 CustomVoice 프리셋 |
| 이미지 생성 | segmind/SSD-1B (로컬 MPS) | 1080x1920, 30 steps |
| 영상 합성 | moviepy + PIL | 1080x1920, 30fps, libx264 |
| 자막 싱크 | Whisper (base) + 1단계 전역 정렬 | 100% 임계값 자동 검증 |
| 오디오 후처리 | ffmpeg 마스터링 체인 | EQ+컴프레서+리버브+라우드니스 |
| 비용 | 전액 무료 (유료 API 없음) | — |

**보이스 프리셋 (`bright-female`):**
- 심드렁+시크+개구진+밝은톤
- 물음표: 호기심+장난기, 느낌표: 펀치감 놀람, 팩트: 데드팬 코미디

**오디오 마스터링 체인:**
- 하이패스 80Hz → EQ(250Hz +2dB, 3kHz +1.5dB, 8kHz -1dB) → 컴프레서(3:1) → 리버브(15/25ms) → 라우드니스 -16 LUFS

**한국어 자막 청킹:**
- scored optimal split (조사/연결어미 경계 인식)
- 3단계 자동 검증 (청크 품질 → Whisper 매칭 → 종합 판정)

**검증 완료 에피소드:**
- EP.10 "만약에 인간이 광합성을 한다면?" — 26.9초, 100% PASS

### v1.1 — "1단계 전역 정렬" (2026-02-18)

**핵심 변경: 자막 싱크 아키텍처 근본 개편**

| 항목 | v1.0 (2단계) | v1.1 (1단계) |
|------|-------------|-------------|
| 정렬 방식 | 문장 그룹핑 → 구절 정렬 | 전역 직접 정렬 |
| Whisper 워드 할당 | 글자수 비례 (부정확) | 텍스트 매칭 (정확) |
| 싱크율 | 87% | **100%** |
| 오디오 처리 | 침묵 삽입 (끊김 유발) | 원본 무편집 |

**v1.0 → v1.1 해결된 문제:**
- 오디오 끊김: 문장 경계에서 침묵 삽입 시 끊김 → 원본 오디오 그대로 사용
- 자막 조기 표시: 2단계 정렬의 누적 오차 → 1단계 전역 정렬로 근본 해결
- 자막 조기 소멸: 문장 그룹핑 부정확 → 직접 Whisper 매칭으로 정확한 종료점

**`_align_phrases_to_whisper` 알고리즘 (v1.1):**
1. Whisper 워드 스트림 → 문자-시간 매핑 구축
2. 전체 구절을 순차 탐색 (3~5글자 키 + 2글자 퍼지 폴백)
3. 미매칭 구절은 전후 앵커 사이 글자수 비례 보간
4. 연속 타이밍 (각 구절 end = 다음 구절 start, 갭 제로)
5. 최소 표시시간 0.5초 보장 (인접 재분배)

### v3.2 — "TTS 인간화 + Voice Clone + 한국어 전처리 고도화" (2026-02-20)

**4대 개선:**

| # | 개선 | 파일 | 효과 |
|---|------|------|------|
| 1 | Sampling 파라미터 최적화 | `tts_engine.py` | temp 0.75, top_p 0.85, rep_penalty 1.2 → 로봇 느낌 감소 |
| 2 | Instruct 텍스트 고도화 | `tts_engine.py` | 8개 프리셋 전부 구체적 연기 디렉션으로 개선 |
| 3 | CustomVoice 엔진 통합 | `tts_engine.py` | YouTube 레퍼런스 음성 → 보이스 클로닝 (Qwen3-TTS CustomVoice 8-bit) |
| 4 | 한국어 전처리 고도화 | `video_composer.py` | 숫자 읽기 교정 + 호흡 유도 + 문장 간 쉼 개선 |

**CustomVoice 파이프라인:**
```
YouTube 음원 (yt-dlp) → Demucs 보컬 분리 → FFmpeg 20s 클립 → 레퍼런스 WAV
  → Qwen3-TTS CustomVoice (ref_audio + ref_text + base voice) → 클로닝 TTS
```

**한국어 전처리 수정 (`_convert_korean_numbers`):**
- 연령대 한자어 교정: `20대` → `이십대` (기존: `스무 대` 오류)
- 10~90 단위 연령대만 한자어 처리 (`[1-9]0대` 패턴)

**씬 간 호흡 개선 (`_generate_single_tts_audio`):**
- 씬 텍스트 연결자: `, ` → `\n` (줄바꿈)
- 마침표 후 평균 0.8초 호흡 간격 확보 (기존 0.1초)

**render_samples.py 수정:**
- 스크립트 JSON의 `render_config` 오버라이드 지원 (기존: 항상 `RENDER_STYLE` 하드코딩)

**검증 에피소드:**
- EP.19 "만약 100살까지 안 늙는 약이 나온다면?" — 25.8초, 싱크 91%, CustomVoice `hangout-male`

---

- 생성일: 2026-02-18
- 최종 업데이트: 2026-02-20
- 벤치마크: 직업의온도 "젠스파크 달러 채굴 공장" 핵심 원리
