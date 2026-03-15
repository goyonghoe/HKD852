---
name: paper-script
description: "논문 토픽 기반 30~45초 쇼츠 스크립트 + 메타데이터 생성"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "스크립트 생성은 Sonnet의 창의적 균형이 최적"
argument-hint: "--topic 'pipeline/topics/YYYY-MM-DD_paper_1.yaml' 또는 --paper-info '직접 입력'"
---

# /paper-script — 투자 심리 논문 쇼츠 스크립트 생성

## 역할

**투자 심리 / 행동경제학** 논문을 기반으로, 30~45초 YouTube Shorts 에피소드 JSON을 생성합니다.
핵심: 투자자가 "나도 이러는데!" 하고 무릎을 치는 인사이트를 학술 근거로 전달.

## 입력

### Option 1: 토픽 YAML 경로

```
/paper-script --topic pipeline/topics/2026-02-27_paper_1.yaml
```

### Option 2: 직접 입력

```
/paper-script --paper-info "title: ..., doi: ..., key_finding: ..."
```

## 에피소드 번호 결정

`pipeline/scripts/paper_ep*.json`을 스캔하여 가장 큰 번호 + 1을 사용합니다.

## 스크립트 구조

```
[Hook]    충격적 연구 결과 한 줄 → 시선 고정 (0~3초)
[Context] 어디서, 누가, 어떻게 연구했는지 1~2줄 (3~8초)
[Finding] 핵심 발견 + 수치 → 인포그래픽 비주얼 (8~22초)
[Impact]  왜 중요한지 / 일상 연결 (22~28초)
[Closer]  한 줄 여운 — CTA 없음 (28~35초)
```

**핵심 규칙**:

- `script.cta`는 항상 빈 문자열 `""` (논문 시리즈는 CTA 없음)
- `script.closer`에 여운 있는 마무리 한 줄

## 톤 & 언어

- **언어**: 한국어 (ko)
- **톤**: 투자자 친구에게 충격적 논문 결과를 알려주는 느낌
  - 어미: `~인데요`, `~거든요`, `~대요`, `~래요`
  - 금지: `~입니다`, `~습니다` (딱딱한 존댓말)
  - 맞춤법: `일주일` (O) / `한주일` (X) — "한 주"는 가능하지만 "한주일"은 비표준
  - TTS 기호: `-8.5%` → `마이너스 8.5%`, `+12%` → `플러스 12%` (TTS가 기호를 무시함)
  - 숫자: 구어체 변환 (`8천 명` not `8,000명`)
  - **투자 용어 자연스럽게 사용**: 손절, 물타기, 개미, 시총, PER 등 (별도 설명 불필요)
  - **시청자 = 투자 경험이 있는 MZ세대**: 주식/코인/부동산 중 하나 이상 경험 전제
  - **학술 용어 금지**: 논문의 발견을 전달하되, 논문의 언어를 사용하지 않는다
    - `처분 효과` → "오른 건 팔고 빠진 건 못 파는 습관"
    - `기준점/앵커링` → "머릿속에 딱 꽂히는 가격" / "잣대"
    - `인과 검증/RDD` → 언급하지 않음 (출처만 명시)
    - `인지 편향` → "착각" / "판단이 꼬이는 것"
    - 카톡으로 친구에게 알려주는 수준이 기준

## 비주얼 스타일

**Nano Banana Pro 인포그래픽** (Nature/Science 저널 스타일):

- 딥 네이비 배경 + 화이트 + 액센트 컬러
- 깔끔한 데이터 시각화, 차트, 다이어그램 느낌
- 망가/애니메이션 스타일 **사용 금지**

### visual_style 필드 (에피소드 단위)

```
"visual_style": "Kurzgesagt-inspired scientific infographic style, flat vector art with subtle gradients, deep dark navy-black background, clean data visualization aesthetic, Nature journal quality, minimalist professional design, "
```

### image_prompt 규칙

**절대 금지** (AI가 텍스트/숫자를 렌더링하면 어색):

- 간판/배너에 문구: `banner reading '...'`
- 화면/UI에 텍스트: `app screen showing '...'`
- 숫자/퍼센트/가격: `badge showing 40%`
- 말풍선 대사: `speech bubble saying '...'`
- 차트 수치: `bar chart with numbers`

**대신 사용**:

- 감정/분위기를 **조명, 색감, 구도**로 표현
- 수치는 **크기 대비, 에너지 바, 빛의 강도**로 상징화
- 텍스트 정보는 자막(TTS+자막)이 전달 → 이미지는 분위기만 담당

### image_prompt 필수 서픽스

모든 image_prompt 끝에:

```
, Kurzgesagt-inspired flat vector infographic style, deep dark navy-black background, clean scientific aesthetic, subtle gradients, professional data visualization feel
```

## paper_source 블록 (필수)

```json
"paper_source": {
  "title": "영문 논문 원제",
  "authors": "저자명 (et al.)",
  "journal": "저널명",
  "year": 2025,
  "doi": "DOI 또는 PMC ID",
  "peer_reviewed": true,
  "institution": "연구 기관",
  "sample_size": 100,
  "key_finding": "핵심 발견 한국어 1문장"
}
```

## 메타데이터 규칙

| 필드           | 규칙                                                             |
| -------------- | ---------------------------------------------------------------- |
| title          | 50자 이내, 이모지 1개 + 질문형, `#오늘의논문` 포함               |
| description    | 첫 125자 핵심, 끝에 출처 인용 (저널+년도+저자)                   |
| hashtags       | 5~6개: `#오늘의논문` + `#투자심리` + 분야 태그 2~3개 + `#Shorts` |
| thumbnail_text | 4~8자 한글 (투자 관련 핵심 단어)                                 |
| category_id    | `"27"` (Education)                                               |

## 품질 프레임워크

### Made to Stick (SUCCESs) — 최소 40/60

| 원칙       | 체크                       |
| ---------- | -------------------------- |
| Simple     | 핵심 메시지 1줄 요약 가능? |
| Unexpected | 통념을 깨는 반전?          |
| Concrete   | 감각적 비유/장면?          |
| Credible   | 출처+수치?                 |
| Emotional  | 공감/놀람?                 |
| Stories    | 기대→좌절→깨달음 구조?     |

### 금지 패턴

- 팩트 나열형 (백과사전 스타일)
- 같은 내용 다른 표현으로 반복
- 결론을 훅에서 미리 공개
- 전문 용어 남발 (일반인이 이해 불가)

## render_config 기본값

`templates/lang_config.json`의 `ko` 설정을 사용:

```json
"render_config": {
  "voice_preset": "hangout-male",
  "speed": 1.3,
  "format": "dark-bg-text",
  "font_size": 48
}
```

## 출력

파일: `pipeline/scripts/paper_epNNN.json`

기존 에피소드(paper_ep001~018)와 동일한 JSON 스키마를 따릅니다.
필수 최상위 키: `episode_id`, `series`, `topic_id`, `language`, `paper_source`, `visual_style`, `script`, `full_text`, `display_text`, `scenes`, `metadata`, `render_config`, `quality_check`

## 속도 목표

3분 이내
