---
name: paper-render
description: "논문 스크립트 JSON → 이미지 생성 + TTS + FFmpeg MP4 렌더링"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: haiku
model-reason: "렌더링은 Python 스크립트 실행이므로 Haiku로 충분"
argument-hint: "--episode 'paper_ep019' [--lang ko|en|ja|all] [--skip-images]"
---

# /paper-render — 이미지 + TTS + MP4 렌더링

## 역할

논문 스크립트 JSON을 받아 이미지 생성 + TTS + FFmpeg로 최종 MP4 영상을 렌더링합니다.
단일 언어 또는 3개 국어 (KO/EN/JA) 렌더링을 지원합니다.

## 전제조건 자동 체크

렌더링 시작 전 아래를 확인합니다:

| 항목         | 경로                                        | 필수 여부        |
| ------------ | ------------------------------------------- | ---------------- |
| KO 스크립트  | `pipeline/scripts/paper_epNNN.json`         | 필수             |
| EN 스크립트  | `pipeline/scripts/paper_epNNN_en.json`      | --lang en/all 시 |
| JA 스크립트  | `pipeline/scripts/paper_epNNN_ja.json`      | --lang ja/all 시 |
| EN 음성 파일 | `pipeline/voice_ref/reference_voice_en.wav` | --lang en/all 시 |
| JA 음성 파일 | `pipeline/voice_ref/reference_voice_ja.wav` | --lang ja/all 시 |

**미존재 시**: 해당 언어를 `BLOCKED`로 보고하고 건너뜁니다 (에러가 아님).

## 실행

### KO 단일 렌더 (기본)

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/ShortsFactory2_Agent
python libs/render_samples.py --script pipeline/scripts/paper_ep019.json
```

### KO + 이미지 스킵 (기존 이미지 재사용)

```bash
python libs/render_samples.py --script pipeline/scripts/paper_ep019.json --skip-images
```

### EN 렌더 (번역 스크립트 필요)

```bash
python libs/render_samples.py --script pipeline/scripts/paper_ep019.json --lang en --skip-images
```

### JA 렌더

```bash
python libs/render_samples.py --script pipeline/scripts/paper_ep019.json --lang ja --skip-images
```

### 3개 국어 순차 렌더 (--lang all)

1. KO 렌더 (이미지 생성 포함)
2. EN 렌더 (`--skip-images`, 공유 이미지)
3. JA 렌더 (`--skip-images`, 공유 이미지)

**순차 실행 필수**: Qwen3-TTS GPU 메모리 충돌 방지

## 렌더 스펙

| 항목          | 값                                |
| ------------- | --------------------------------- |
| 해상도        | 1080 x 1920 (9:16)                |
| FPS           | 30                                |
| 비디오 코덱   | H.264 (libx264)                   |
| 오디오 코덱   | AAC                               |
| KO 폰트       | AppleSDGothicNeo, 48px            |
| EN 폰트       | Arial, 48px                       |
| JA 폰트       | HiraginoSans, 48px                |
| 자막 아웃라인 | 3px black                         |
| 이미지 스타일 | Nano Banana Pro (과학 인포그래픽) |

## 출력 검증

렌더링 완료 후 ffprobe로 검증:

- 길이: 15~60초 (범위 벗어나면 WARNING)
- 해상도: 1080x1920
- 파일 크기: < 50MB

## 출력 경로

```
pipeline/rendered/samples/paper_epNNN/
├── paper_epNNN_manga_YYYYMMDD-HHMMSS.mp4    (KO — 하위호환 _manga_ 패턴)
├── paper_epNNN_en_YYYYMMDD-HHMMSS.mp4       (EN)
└── paper_epNNN_ja_YYYYMMDD-HHMMSS.mp4       (JA)
```

## 결과 리포트

```markdown
## 렌더링 결과: paper_ep019

| 언어 | 길이  | 크기  | 상태    | 파일                                                  |
| ---- | ----- | ----- | ------- | ----------------------------------------------------- |
| KO   | 28.3s | 4.2MB | OK      | rendered/samples/paper*ep019/paper_ep019_manga*\*.mp4 |
| EN   | —     | —     | BLOCKED | reference_voice_en.wav 없음                           |
| JA   | —     | —     | BLOCKED | reference_voice_ja.wav 없음                           |
```

## 참조

- `libs/render_samples.py` — 렌더링 오케스트레이터
- `libs/image_gen.py` — Gemini API 이미지 생성
- `libs/tts_engine.py` — Qwen3-TTS 엔진
- `libs/video_composer.py` — FFmpeg 합성
- `templates/lang_config.json` — 언어별 설정
