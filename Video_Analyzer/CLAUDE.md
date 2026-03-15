# Video_Analyzer -- 기술지원 (비디오 분석)

> 로컬 영상 파일의 인코딩 정보 분석 및 재현 도구

## 역할

영상 파일의 포맷/코덱 성분을 분석하고, 동일한 방식으로 인코딩할 수 있는 ffmpeg 명령어를 생성합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기능

- 영상 파일 포맷/코덱 성분 분석
- 인코딩 파라미터 추출 (해상도, 비트레이트, FPS, 코덱 등)
- 동일 인코딩 재현을 위한 ffmpeg 명령어 생성

## 필요 도구

- **ffprobe** -- 영상 메타데이터 추출
- **ffmpeg** -- 인코딩 명령어 생성

## 프로젝트 구조

```
Video_Analyzer/
├── .claude/CLAUDE.md
├── README.md
└── report.json       # 분석 결과
```

## 산출물

- `report.json` -- 영상 분석 결과 (JSON 형식)
