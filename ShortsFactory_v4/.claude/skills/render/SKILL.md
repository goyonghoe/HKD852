---
name: shorts-v4-render
description: "TTS + 비주얼 + 영상 합성 — 채널별 엔진 자동 선택"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shorts-v4-render

채널 프로파일에 따라 TTS 엔진, 비주얼 엔진을 선택하고 최종 영상을 합성한다.

## 파라미터

| 파라미터      | 필수 | 기본값 | 설명                              |
| ------------- | ---- | ------ | --------------------------------- |
| `script_path` | 예   | —      | 스크립트 JSON 파일 경로           |
| `channel_id`  | 예   | —      | 대상 채널 ID (프로파일 참조용)    |

## 실행 절차

### Step 1: 채널 프로파일 로드

```
channels/{channel_id}/profile.yaml
```

핵심 필드:
- `tts_engine`: TTS 엔진 선택 (예: "google", "elevenlabs", "edge")
- `tts_voice`: 음성 ID
- `tts_speed`: 속도 배율
- `visual_engine`: 이미지 생성 엔진 (예: "flux", "sdxl", "dalle")
- `subtitle_style`: 자막 스타일 설정
- `language`: 기본 언어

### Step 2: TTS 생성

```bash
python3 engines/tts/{tts_engine}.py \
  --script {script_path} \
  --voice {tts_voice} \
  --lang {language} \
  --output pipeline/rendered/{episode_id}/audio/
```

주의사항:
- `language` 파라미터 명시적 전달 ("auto" 금지)
- `speed` 파라미터가 무시되는 엔진은 `atempo` 후처리로 보정
- 씬별 개별 오디오 파일 생성 → 이후 합성

### Step 3: 비주얼 생성

```bash
python3 engines/visual/{visual_engine}.py \
  --script {script_path} \
  --output pipeline/rendered/{episode_id}/images/
```

주의사항:
- `image_prompt`에 텍스트/숫자 렌더링 요청이 포함되어 있으면 자동 제거
- 채널 `visual_style` 접미사가 프롬프트에 포함되어 있는지 검증

### Step 4: 자막 생성

자막 스타일은 언어별 설정을 따른다:

| 언어 | max_chars | font_size |
| ---- | --------- | --------- |
| KO   | 16        | 52pt      |
| EN   | 25        | 56pt      |
| JA   | 14        | 56pt      |

JA 자막은 전용 분할 함수를 사용한다.

### Step 5: 영상 합성

```bash
python3 engines/compose/video_composer.py \
  --audio pipeline/rendered/{episode_id}/audio/ \
  --images pipeline/rendered/{episode_id}/images/ \
  --subtitles pipeline/rendered/{episode_id}/subtitles/ \
  --output pipeline/rendered/{episode_id}.mp4
```

## 입력

- `pipeline/scripts/{episode_id}.json` — 스크립트 파일
- `channels/{channel_id}/profile.yaml` — 채널 프로파일

## 출력

```
pipeline/rendered/{episode_id}.mp4
pipeline/rendered/{episode_id}/
  ├── audio/       # 씬별 TTS 오디오
  ├── images/      # 씬별 이미지
  └── subtitles/   # 자막 파일
```

## 에러 처리

- TTS 엔진 실패: 대체 엔진("edge")으로 자동 폴백 + 경고 로그
- 이미지 생성 실패: 해당 씬을 단색 배경으로 대체 + 경고 로그
- FFmpeg 합성 실패: 로그 출력 후 에러 반환
- 출력 파일 0바이트: 에러 처리 (성공으로 간주하지 않음)

## 채널 프로파일 참조

렌더링의 모든 엔진 선택과 스타일 설정은 `profile.yaml`에서 파생된다.
새 TTS/비주얼 엔진 추가 시 `engines/` 디렉토리에 동일 인터페이스로 구현한다.
