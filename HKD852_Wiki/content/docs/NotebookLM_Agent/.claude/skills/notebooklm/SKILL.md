---
name: notebooklm
description: "NotebookLM 연동 — 노트북 생성, 소스 업로드, 분석, 산출물 생성"
user-invocable: true
allowed-tools: Bash, Read, Write
---

# NotebookLM Skill

Google NotebookLM과 연동하여 소스 업로드, 질의, 산출물 생성을 수행.

## 연동 방식 (2가지)

### 방식 A: MCP 서버 (권장 — Claude Code 네이티브)

MCP 서버가 설치되어 있으면 별도 명령 없이 NotebookLM 도구를 직접 사용:

- `ask_question` — 노트북에 질문
- `list_notebooks` — 노트북 목록 조회
- `add_notebook` — 노트북 추가
- `search_notebooks` — 노트북 검색

**설치** (1회):

```bash
claude mcp add notebooklm -- npx notebooklm-mcp@latest
```

**프로필 설정**:

```bash
npx notebooklm-mcp config set profile full
```

### 방식 B: Python CLI (notebooklm-py)

MCP 서버가 없을 때 Python CLI로 대체:

```bash
# 설치
pip3 install "notebooklm-py[browser]"
playwright install chromium

# 인증 (1회)
notebooklm login
```

## 사용법

```
/notebooklm [action]
```

### 주요 액션

#### 1. 노트북 생성 + 소스 추가

```bash
NOTEBOOKLM="/Users/yong/Library/Python/3.10/bin/notebooklm"

# 노트북 생성 (UUID 반환)
NB=$($NOTEBOOKLM create "리서치 노트북" 2>&1 | grep -oE '[0-9a-f-]{36}')

# 소스 추가 — URL (YouTube 포함)
$NOTEBOOKLM source add -n "$NB" "https://www.youtube.com/watch?v=VIDEO_ID"

# 소스 추가 — 텍스트 파일 (긴 텍스트는 파일로 저장 후 전달)
$NOTEBOOKLM source add -n "$NB" "/path/to/analysis.md"
```

> **주의**: 인라인 텍스트가 길면 "File name too long" 에러 발생. 반드시 .md 파일로 저장 후 경로 전달.

#### 2. 질의

```bash
$NOTEBOOKLM ask -n "$NB" "한국어로 답변해주세요. 핵심 인사이트 3가지를 정리해주세요."
```

#### 3. 산출물 생성

```bash
# 오디오 개요 (팟캐스트) — 생성에 1~3분 소요
$NOTEBOOKLM generate audio -n "$NB" "한국어로 대화해주세요."

# 인포그래픽 (영문만 지원 — 한국어 필요 시 Claude Code HTML 직접 생성)
$NOTEBOOKLM generate infographic -n "$NB"
```

#### 4. 다운로드

```bash
# 오디오
$NOTEBOOKLM download audio NotebookLM_Agent/outputs/podcast.wav

# 인포그래픽 (PNG)
$NOTEBOOKLM download infographic NotebookLM_Agent/outputs/infographic.png
```

## 소스 제한

- NotebookLM 최대 소스 수: **50개**/노트북
- YouTube 영상은 URL로 바로 소스 추가 가능 (캡션 자동 추출)

## 출력

- `NotebookLM_Agent/outputs/` — 모든 산출물 저장

## 인증 상태 확인

```bash
# MCP 서버
npx notebooklm-mcp config get

# Python CLI
notebooklm list
```

## 주의사항

- 비공식 API — Google 정책 변경 시 작동 중단 가능
- 인증 세션은 로컬에만 저장, 외부 전송 없음
- 대량 요청 시 rate limit 주의
