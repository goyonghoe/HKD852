# ShortsFactory_Agent — 쇼츠공장 (What-If)

## 역할

트렌드 리서치부터 스크립트, TTS 렌더링, 정책 검수까지 10분/편 목표의 반자동 YouTube Shorts 생산 파이프라인을 운영합니다. 글로벌 타겟(영어 우선), 고RPM 니치 자동 선정.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| Shorts Factory | `/shorts-factory` | 일일 파이프라인 오케스트레이터 (토픽 → 렌더 → 검수) | Sonnet |
| Topic Mine | `/topic-mine` | 글로벌 트렌드 기반 고RPM 토픽 자동 발굴 | Sonnet |
| Shorts Script | `/shorts-script` | 토픽 기반 스크립트 + 메타데이터 자동 생성 | Sonnet |
| Shorts Render | `/shorts-render` | TTS + FFmpeg MP4 렌더링 | Haiku |
| Shorts Review | `/shorts-review` | YouTube 2026 정책 준수 + 품질 검증 게이트 | Opus |
| Shorts Analyze | `/shorts-analyze` | 주간 성과 분석 + 트렌드 전략 조정 | Sonnet |
| Shorts Upload | `/shorts-upload` | 업로드 대기열 관리 + CEO 승인 후 업로드 | Haiku |

## 파이프라인 흐름

```
/topic-mine (1분) → /shorts-script (2분) → /shorts-render (5분) → /shorts-review (1분) → CEO 검수 + 업로드 (1분)
```

## 기술 스택

| 컴포넌트 | 기술 |
| --- | --- |
| TTS 엔진 | Qwen3-TTS 1.7B VoiceDesign (8-bit MLX) |
| 이미지 생성 | segmind/SSD-1B (로컬 MPS) |
| 영상 합성 | moviepy + PIL (1080x1920, 30fps) |
| 자막 싱크 | Whisper (base) + 1단계 전역 정렬 |
| 오디오 후처리 | ffmpeg 마스터링 체인 |

## 프로젝트 구조

```
ShortsFactory_Agent/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/            # 7개 스킬
├── pipeline/
│   ├── scripts/           # 스크립트 (JSON)
│   ├── rendered/          # 렌더링된 영상
│   ├── queue/             # 업로드 대기열
│   └── analytics/         # 성과 데이터
├── libs/                  # Python 모듈 (TTS, 영상합성, 자막)
├── templates/             # 니치/훅/포맷 설정
└── outputs/               # 최종 배포 파일
```
