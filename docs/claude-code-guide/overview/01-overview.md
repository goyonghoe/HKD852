# Claude Code 개요

> **출처**: https://code.claude.com/docs/en/overview
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

## 1. Claude Code란?

Claude Code는 코드베이스를 읽고, 파일을 편집하고, 명령을 실행하며, 개발 도구와 통합되는 **에이전트 코딩 도구**입니다. 터미널, IDE, 데스크톱 앱, 브라우저에서 사용 가능합니다.

## 2. 설치

### Native Install (권장)

**macOS, Linux, WSL:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell:**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**

```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### 패키지 관리자

**Homebrew:**

```bash
brew install --cask claude-code
# 자동 업데이트 안됨 → brew upgrade claude-code
```

**WinGet:**

```powershell
winget install Anthropic.ClaudeCode
# 자동 업데이트 안됨 → winget upgrade Anthropic.ClaudeCode
```

### 사용 시작

```bash
cd your-project
claude
```

## 3. 사용 환경

| 환경                 | 설명                              |
| -------------------- | --------------------------------- |
| **Terminal**         | 풀 기능 CLI                       |
| **VS Code / Cursor** | Extensions에서 "Claude Code" 검색 |
| **Desktop App**      | 독립 실행형 앱 (macOS/Windows)    |
| **Web**              | claude.ai/code (로컬 설정 불필요) |
| **JetBrains**        | IntelliJ, PyCharm, WebStorm 등    |

## 4. 주요 기능

### 코드 작성 및 버그 수정

자연어로 설명하면 Claude가 계획 → 다중 파일 코드 작성 → 검증

### 커밋 및 PR 생성

```bash
claude "commit my changes with a descriptive message"
```

### MCP (Model Context Protocol) 연동

Jira, Slack, Notion 등 외부 도구 연결

### 커스터마이징

- **CLAUDE.md**: 코딩 표준 지침
- **Skills**: 반복 워크플로우를 슬래시 커맨드로
- **Hooks**: 특정 이벤트 전후 셸 명령 실행

### Agent Teams

여러 에이전트가 동시 병렬 작업

### CLI 파이프/스크립팅

```bash
tail -f app.log | claude -p "Slack me if you see any anomalies"
git diff main --name-only | claude -p "review these changed files for security issues"
```

## 5. 환경별 활용

| 원하는 것                    | 최적 환경                  |
| ---------------------------- | -------------------------- |
| 로컬 시작 → 모바일 이어서    | Web / iOS 앱               |
| PR 리뷰/이슈 트리아지 자동화 | GitHub Actions / GitLab CI |
| Slack 버그 → PR 자동 라우팅  | Slack 연동                 |
| 라이브 웹앱 디버깅           | Chrome 연동                |
| 커스텀 에이전트 구축         | Agent SDK                  |

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                  |
| ---------- | ---- | -------------------------- |
| 2026-02-24 | v2.0 | 공식 문서 기준 전면 재작성 |
