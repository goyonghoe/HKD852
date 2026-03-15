# NotebookLM Agent — NotebookLM 연동 매니저

## 역할

문서/논문/YouTube 등 다양한 소스를 NotebookLM에 업로드하여 분석하고, 인포그래픽/보고서/팟캐스트 등 산출물을 자동 생성하는 에이전트. 분석은 Google이 수행하므로 토큰 비용 최소.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬

| 스킬 | 설명 | 모델 |
|------|------|------|
| `/yt-search` | YouTube 검색 + 메타데이터 수집 (yt-dlp) | Haiku |
| `/notebooklm` | NotebookLM 노트북 관리 + 산출물 생성 | Sonnet |
| `/research` | 리서치 파이프라인 오케스트레이터 | Sonnet |

## 프로젝트 구조

```
NotebookLM_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/         # 3개 스킬
├── scripts/            # yt_search.py, template_selector.py
├── inputs/             # 분석 소스 파일
└── outputs/            # 산출물 (HTML 보고서 등)
```
