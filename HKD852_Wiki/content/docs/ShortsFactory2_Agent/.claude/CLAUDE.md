# ShortsFactory2_Agent — "오늘의 논문" 채널

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)

## 채널 정보

- **채널명**: 오늘의 논문 (Today's Paper)
- **니치**: **투자 심리 / 행동경제학** (Investment Psychology & Behavioral Finance)
- **컨셉**: 투자자의 인지 편향, 감정적 의사결정, 시장 비효율성을 학술 논문으로 설명하는 30초 쇼츠
- **타겟**: MZ세대 투자자 (20~35세), 주식/코인/부동산 경험자, 재테크 관심층
- **언어**: 한국어 (KO) | 영어 (EN) [PLANNED] | 일본어 (JA) [PLANNED]
- **톤 (KO)**: 친근하지만 신뢰감 있는 설명체 ("~인데요", "~거든요")
- **톤 (EN)**: Conversational, casual science explainer [PLANNED]
- **톤 (JA)**: 親しみやすいが信頼感のある解説体 [PLANNED]

## 현재 상태

> **Phase 2 (스킬 파이프라인)** — 2026-02-27 기준

| 기능              | 상태             | 비고                                    |
| ----------------- | ---------------- | --------------------------------------- |
| KO 스크립트 생성  | 운영 중          | 18편 완료                               |
| KO 렌더링         | 운영 중          | render_samples.py                       |
| KO 업로드         | 운영 중          | 11편 업로드 (private)                   |
| 번역 스크립트     | 코드 완성        | translate_script.py (EN/JA 테스트 필요) |
| EN/JA 렌더링      | **차단됨**       | EN/JA 레퍼런스 음성 파일 필요           |
| EN/JA 업로드      | **차단됨**       | YouTube 채널 + OAuth 미생성             |
| 스킬 파이프라인   | **Phase 2 완료** | 7개 스킬 SKILL.md + pipeline_logger     |
| 에이전트 팀       | 미구현           | Phase 3                                 |
| 모니터링 대시보드 | 미구현           | Phase 3                                 |

## 스킬 목록

| 스킬            | 명령어             | 모델   | 역할                           |
| --------------- | ------------------ | ------ | ------------------------------ |
| Paper Factory   | `/paper-factory`   | Sonnet | 일일 파이프라인 오케스트레이터 |
| Paper Mine      | `/paper-mine`      | Sonnet | 논문 발굴 + 스코어링           |
| Paper Script    | `/paper-script`    | Sonnet | 스크립트 + 메타데이터 생성     |
| Paper Render    | `/paper-render`    | Haiku  | 이미지 + TTS + MP4 렌더링      |
| Paper Review    | `/paper-review`    | Opus   | 정책 + 학술 정확성 검증        |
| Paper Translate | `/paper-translate` | Haiku  | KO→EN/JA 번역                  |
| Paper Upload    | `/paper-upload`    | Haiku  | YouTube 업로드 매니저          |

스킬 경로: `.claude/skills/paper-{mine,script,render,review,translate,upload,factory}/SKILL.md`

## 차별화

- **학술 근거 기반** — 일반 투자 채널 ≠ "이 주식 사세요", 우리 = "왜 당신은 손절 못 하는가 (Nature 2025)"
- 실제 논문 출처 명시 (DOI, 저널, 저자) → 신뢰도
- Nano Banana Pro 인포그래픽 → 과학 저널급 비주얼
- 행동경제학 논문은 무한 공급 (매주 새 연구 발표)

## 렌더링 엔진

- `libs/` — `../ShortsFactory_Agent/libs/` 심링크 (공유 코드)
- **주의**: ShortsFactory_Agent/libs/ 변경 시 ShortsFactory2_Agent에도 즉시 영향
- video_composer.py, render_samples.py, subtitle_gen.py, translate_script.py 등 공유
- `monitor/pipeline_logger.py` — 파이프라인 전용 JSONL 로거 (심링크 아닌 독립 파일)

## 비주얼 스타일

- Nano Banana Pro 인포그래픽 (Nature/Science 저널 스타일)
- 깔끔한 데이터 시각화, 차트, 다이어그램
- 컬러 팔레트: 딥블루 + 화이트 + 액센트 컬러

## 스크립트 구조

```
[Hook] 충격적 연구 결과 한 줄 → 시선 고정
[Context] 어디서, 누가, 어떻게 연구했는지 1~2줄
[Finding] 핵심 발견 + 수치 → 인포그래픽 비주얼
[Impact] 왜 중요한지 / 일상 연결
[Closer] 한 줄 여운 (CTA 없음)
```

## 다국어 파이프라인 [PLANNED — Phase 1 기반 구조 완성]

### 렌더링 흐름 (EN/JA 렌더에는 레퍼런스 음성 파일이 필요합니다)

```
KO 스크립트 → translate_script.py → EN/JA JSON
KO 이미지 생성 (1회) → 3개 언어 공유
KO/EN/JA 각각 TTS → 자막 → MP4 렌더
```

### 핵심 파일

- `templates/lang_config.json` — 언어별 설정 (음성, 속도, 폰트, 채널)
- `libs/translate_script.py` — KO→EN/JA 스크립트 번역기 (모델: Sonnet)
- `libs/render_samples.py --lang en|ja` — 번역본 렌더링

### 번역 스크립트 네이밍

- `paper_ep018.json` → KO 원본
- `paper_ep018_en.json` → EN 번역본
- `paper_ep018_ja.json` → JA 번역본

번역본은 `image_prompt: null` + `image_ref` 로 공유 이미지를 참조합니다.

### 전제 조건 (EN/JA 렌더 전 필수)

1. `pipeline/voice_ref/reference_voice_en.wav` — 영어 레퍼런스 음성
2. `pipeline/voice_ref/reference_voice_ja.wav` — 일본어 레퍼런스 음성
3. EN/JA YouTube 채널 생성 + OAuth 인증
4. `~/.config/shorts-factory/channels.json`에 `paperman-en`, `paperman-ja` 엔트리 추가

## 업로드 히스토리 (필수)

**업로드 성공 시 반드시 `pipeline/analytics/upload_history.json`에 기록합니다.**

파일 구조:

```json
{
  "channels": {
    "paperman": { "id": "paperman", "name": "논문맨", "language": "ko", ... },
    "paperman-en": { ... },
    "paperman-ja": { ... }
  },
  "uploads": [ ... ]
}
```

업로드 항목:

```json
{
  "episode_id": "paper_ep007",
  "title": "영상 제목",
  "uploaded_at": "2026-02-22",
  "url": "https://youtube.com/shorts/xxxxx",
  "video_id": "xxxxx",
  "language": "ko",
  "privacy_status": "private"
}
```

`language` 필드는 필수입니다 (ko/en/ja). 업로드 후 `uploads` 배열에 append하고 저장합니다.

## YouTube 채널 라우팅

| 언어 | 채널명                  | 채널 키       | 상태                  |
| ---- | ----------------------- | ------------- | --------------------- |
| KO   | 논문맨 (@paper-man-xyz) | `paperman`    | 운영 중               |
| EN   | Today's Paper           | `paperman-en` | [PLANNED] 채널 미생성 |
| JA   | 今日の論文              | `paperman-ja` | [PLANNED] 채널 미생성 |

## 수익화 전략

- **Finance/Investing RPM $12-25** (YouTube 최상위 니치)
- 투자 심리 → 재테크 앱, 증권사, 금융 교육 광고 매칭
- 고관여 시청자 → Long-form 전환율 높음 (심층 분석 영상)
