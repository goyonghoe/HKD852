# NotebookLM Agent

> HKD852 지원본부 소속 — AI 리서치 노트북 매니저

## 역할

문서/논문/회의록 등 다양한 소스를 분석하여 핵심 인사이트를 추출하고, 구조화된 노트북으로 정리하는 에이전트.

## 핵심 기능

1. **YouTube 검색**: yt-dlp 기반 키워드 검색 + 메타데이터/캡션 수집
2. **NotebookLM 연동**: 소스 업로드, RAG 분석, 산출물 생성 (MCP 또는 CLI)
3. **리서치 파이프라인**: YouTube 검색 → NotebookLM 업로드 → 분석 → 산출물 자동화
4. **산출물 유형**: 인포그래픽, 슬라이드덱, 팟캐스트, 퀴즈, 플래시카드, 마인드맵
5. **토큰 절약**: 분석은 Google(NotebookLM)이 수행, Claude Code는 조율만

## 스킬

| 스킬          | 설명                                 | 모델   |
| ------------- | ------------------------------------ | ------ |
| `/yt-search`  | YouTube 검색 + 메타데이터 수집       | Haiku  |
| `/notebooklm` | NotebookLM 노트북 관리 + 산출물 생성 | Sonnet |
| `/research`   | 전체 파이프라인 오케스트레이터       | Sonnet |

## 의존성

- `yt-dlp` — YouTube 스크래핑
- `notebooklm-py` — NotebookLM Python CLI
- `notebooklm-mcp` — NotebookLM MCP 서버 (권장)
- `playwright` + Chromium — 브라우저 자동화

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
