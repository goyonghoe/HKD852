---
name: shorts-render
description: "스크립트 JSON을 받아 TTS + FFmpeg로 YouTube Shorts MP4 렌더링"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: haiku
model-reason: "렌더링은 Python 스크립트 실행이므로 Haiku로 충분"
argument-hint: "--script 'scripts/ep001.json' 또는 --all"
---

# /shorts-render — 쇼츠 영상 렌더링

## 역할
스크립트 JSON 파일을 받아 Edge TTS + FFmpeg로 최종 MP4 영상을 렌더링합니다.

## 의존성
```
pip install edge-tts Pillow numpy
brew install ffmpeg  # 또는 이미 설치되어 있어야 함
```

## 렌더링 파이프라인

```
[1] 스크립트 JSON 로드
  ↓
[2] Edge TTS로 음성 생성 (MP3)
  ↓
[3] 자막 타이밍 계산 (WordBoundary 이벤트)
  ↓
[4] FFmpeg 필터 생성 (drawtext 체인)
  ↓
[5] FFmpeg로 최종 합성 (배경 + 오디오 + 자막)
  ↓
[6] 품질 확인 (ffprobe로 길이/해상도 검증)
```

## 실행 방법

스크립트 JSON 경로를 받아 Python 렌더링 스크립트를 실행합니다:

```bash
cd ShortsFactory_Agent
python libs/video_composer.py --script pipeline/scripts/{episode-id}.json --output pipeline/rendered/{episode-id}.mp4
```

## 영상 포맷 옵션

| 포맷 ID | 설명 | 배경 | 자막 위치 |
|---------|------|------|----------|
| `dark-bg-text` | 다크 배경 + 큰 텍스트 | #0f0f19 | 하단 1/3 |
| `gradient-bg` | 그라데이션 배경 | 보라→남색 | 중앙 |
| `split-screen` | 비포/애프터 분할 | 좌우 분할 | 각 영역 하단 |
| `list-countdown` | 숫자 카운트다운 | 다크 + 숫자 강조 | 중앙 |

## 렌더링 사양

```
해상도: 1080 x 1920 (9:16 세로)
FPS: 30
비디오 코덱: H.264 (libx264)
오디오 코덱: AAC
프리셋: ultrafast (속도 우선)
폰트: Arial 또는 NotoSans (영어), AppleSDGothicNeo (한국어)
자막 크기: 48px
자막 외곽선: 3px 검정
```

## 출력

```
pipeline/rendered/{episode-id}.mp4
```

렌더링 완료 후 ffprobe로 자동 검증:
- 영상 길이: 15~60초
- 해상도: 1080x1920
- 파일 크기: < 50MB
