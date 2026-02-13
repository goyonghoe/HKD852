# Video Analyzer

로컬 영상 파일의 인코딩 정보를 분석하는 도구입니다.

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)
- **가이드 업데이트 체크**: `/guide-update-check`

---

## 목적

- 영상 파일 포맷/코덱 성분 분석
- 인코딩 파라미터 추출 (해상도, 비트레이트, FPS, 코덱 등)
- 동일 인코딩 재현을 위한 ffmpeg 명령어 생성

## 사용 방법

영상 파일 경로를 제공하면 분석 결과를 반환합니다.

## 출력 형식

분석 결과는 JSON 형식으로 저장됩니다:
- `report.json` - 분석 결과

## 필요 도구

- **ffprobe** - 영상 메타데이터 추출
- **ffmpeg** - 인코딩 명령어 생성
