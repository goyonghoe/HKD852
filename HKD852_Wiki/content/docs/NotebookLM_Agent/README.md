# NotebookLM Agent

HKD852 지원본부 소속 — AI 리서치 노트북 매니저

## 개요

YouTube/웹/문서 소스를 NotebookLM에 업로드하여 분석하고, 인포그래픽/슬라이드/팟캐스트 등 산출물을 자동 생성합니다.

## 아키텍처

```
[YouTube 검색] → [NotebookLM 소스 업로드] → [분석 (Google)] → [산출물 생성]
  yt-dlp            MCP 또는 CLI           Gemini (무료)      인포그래픽 등
```

**토큰 비용**: 분석/추론은 Google NotebookLM이 수행 → Claude Code는 API 조율만 → 최소 비용

## 디렉토리 구조

```
NotebookLM_Agent/
├── .claude/
│   ├── CLAUDE.md                    # 에이전트 설정
│   └── skills/
│       ├── yt-search/SKILL.md       # YouTube 검색
│       ├── notebooklm/SKILL.md      # NotebookLM 연동
│       └── research/SKILL.md        # 리서치 파이프라인
├── scripts/
│   ├── yt_search.py                 # YouTube 검색 스크립트
│   └── yt_captions.py               # YouTube 캡션 추출
├── inputs/                          # 분석할 소스 파일
├── outputs/                         # 생성된 산출물
├── setup.sh                         # 원클릭 셋업
└── README.md
```

## 스킬

| 스킬          | 설명                                      | 모델   |
| ------------- | ----------------------------------------- | ------ |
| `/yt-search`  | YouTube 검색 + 메타데이터 수집            | Haiku  |
| `/notebooklm` | NotebookLM 노트북 관리 + 산출물 생성      | Sonnet |
| `/research`   | 전체 파이프라인 (검색→업로드→분석→산출물) | Sonnet |

## 셋업

```bash
bash NotebookLM_Agent/setup.sh
```

또는 수동:

```bash
# 1. 의존성
pip3 install yt-dlp "notebooklm-py[browser]"
playwright install chromium

# 2. MCP 서버 등록 (권장)
claude mcp add notebooklm -- npx notebooklm-mcp@latest

# 3. NotebookLM 인증 (1회)
notebooklm login
```

## 사용 예시

```bash
# YouTube에서 "Claude Code skills" 검색 → NotebookLM에 업로드 → 분석 → 인포그래픽
/research "Claude Code skills" --count 20 --deliverable infographic
```
