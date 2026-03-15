# 서브에이전트 (Sub-Agents) 공식 가이드

> **출처**: https://code.claude.com/docs/en/sub-agents
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

## 1. 개요

서브에이전트는 특정 유형의 작업을 처리하는 **전문화된 AI 어시스턴트**입니다. 각각 고유한 컨텍스트 윈도우, 커스텀 시스템 프롬프트, 도구 접근 권한을 갖습니다.

### 서브에이전트의 장점

- **컨텍스트 보존**: 탐색/구현을 메인 대화에서 분리
- **제약 강제**: 도구 접근 제한
- **설정 재사용**: 사용자 수준 서브에이전트로 프로젝트 간 재사용
- **행동 특화**: 집중된 시스템 프롬프트
- **비용 제어**: 빠르고 저렴한 모델로 라우팅

## 2. 빌트인 서브에이전트

### Explore

- **모델**: Haiku (빠르고 저비용)
- **도구**: 읽기 전용 (Write, Edit 거부)
- **용도**: 파일 탐색, 코드 검색, 코드베이스 탐색
- **세밀도**: quick, medium, very thorough

### Plan

- **모델**: 메인 대화에서 상속
- **도구**: 읽기 전용
- **용도**: 계획 모드에서 코드베이스 리서치

### General-purpose

- **모델**: 메인 대화에서 상속
- **도구**: 전체 도구
- **용도**: 복잡한 리서치, 다단계 작업, 코드 수정

### 기타 빌트인

| 에이전트          | 모델   | 용도                               |
| ----------------- | ------ | ---------------------------------- |
| Bash              | 상속   | 별도 컨텍스트에서 터미널 명령 실행 |
| statusline-setup  | Sonnet | `/statusline` 실행 시              |
| Claude Code Guide | Haiku  | Claude Code 기능 질문              |

## 3. 커스텀 서브에이전트 생성

### 빠른 시작

1. `/agents` 실행
2. **Create new agent** → **User-level** 또는 **Project-level**
3. **Generate with Claude** 선택, 설명 입력
4. 도구 선택 (예: Read-only for reviewer)
5. 모델 선택 (예: Sonnet)
6. 배경색 선택
7. 저장 (즉시 사용 가능, 재시작 불필요)

## 4. 서브에이전트 스코프

| 위치                  | 스코프               | 우선순위 | 생성 방법            |
| --------------------- | -------------------- | -------- | -------------------- |
| `--agents` CLI 플래그 | 현재 세션            | 1 (최고) | JSON으로 전달        |
| `.claude/agents/`     | 현재 프로젝트        | 2        | 인터랙티브 또는 수동 |
| `~/.claude/agents/`   | 모든 프로젝트        | 3        | 인터랙티브 또는 수동 |
| Plugin의 `agents/`    | 플러그인 활성화된 곳 | 4 (최저) | 플러그인 설치        |

### CLI 정의 (세션 전용)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

## 5. 서브에이전트 파일 작성법

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

### Frontmatter 필드

| 필드              | 필수 | 설명                                                             |
| ----------------- | :--: | ---------------------------------------------------------------- |
| `name`            | Yes  | 고유 식별자, 소문자+하이픈                                       |
| `description`     | Yes  | 언제 이 에이전트에 위임할지 설명                                 |
| `tools`           |  No  | 사용 가능 도구. 생략 시 전체 상속                                |
| `disallowedTools` |  No  | 거부할 도구                                                      |
| `model`           |  No  | `sonnet`, `opus`, `haiku`, `inherit` (기본: inherit)             |
| `permissionMode`  |  No  | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns`        |  No  | 최대 에이전틱 턴 수                                              |
| `skills`          |  No  | 프리로드할 스킬 목록                                             |
| `mcpServers`      |  No  | 사용 가능한 MCP 서버                                             |
| `hooks`           |  No  | 라이프사이클 훅                                                  |
| `memory`          |  No  | 영속 메모리 스코프: `user`, `project`, `local`                   |
| `background`      |  No  | `true`: 항상 백그라운드 실행 (기본: false)                       |
| `isolation`       |  No  | `worktree`: 임시 git worktree에서 실행                           |

## 6. 권한 모드

| 모드                | 동작                          |
| ------------------- | ----------------------------- |
| `default`           | 표준 권한 확인, 프롬프트 표시 |
| `acceptEdits`       | 파일 편집 자동 승인           |
| `dontAsk`           | 권한 프롬프트 자동 거부       |
| `bypassPermissions` | 모든 권한 검사 건너뛰기       |
| `plan`              | 계획 모드 (읽기 전용 탐색)    |

## 7. 스킬 프리로드

```yaml
---
name: api-developer
description: Implement API endpoints following team conventions
skills:
  - api-conventions
  - error-handling-patterns
---
Implement API endpoints. Follow the conventions and patterns from the preloaded skills.
```

## 8. 영속 메모리

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
memory: user
---
```

| 스코프    | 위치                                 | 용도                        |
| --------- | ------------------------------------ | --------------------------- |
| `user`    | `~/.claude/agent-memory/<name>/`     | 모든 프로젝트에서 기억 유지 |
| `project` | `.claude/agent-memory/<name>/`       | 프로젝트별, VCS 공유 가능   |
| `local`   | `.claude/agent-memory-local/<name>/` | 프로젝트별, 체크인 안됨     |

## 9. 서브에이전트 위임 제한

`Task(agent_type)` 구문으로 특정 서브에이전트만 스폰 허용:

```yaml
---
name: coordinator
description: Coordinates work across specialized agents
tools: Task(worker, researcher), Read, Bash
---
```

## 10. 훅 (Hooks)

### 서브에이전트 Frontmatter에서 정의

```yaml
---
name: code-reviewer
description: Review code changes with automatic linting
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

### 프로젝트 수준 훅 (settings.json)

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

## 11. 포그라운드 vs 백그라운드 실행

- **포그라운드**: 메인 대화 블록, 권한 프롬프트 전달
- **백그라운드**: 동시 실행, 권한 사전 승인, MCP 도구 불가

백그라운드 비활성화: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`

## 12. 일반 패턴

### 대용량 작업 격리

테스트 스위트, 문서, 로그 등을 서브에이전트에 위임하여 메인 컨텍스트 보존

### 병렬 리서치

독립적 조사를 위해 여러 서브에이전트 동시 스폰

### 서브에이전트 체이닝

다단계 워크플로우를 위해 순차 실행

## 13. 서브에이전트 비활성화

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-custom-agent)"]
  }
}
```

## 14. 예제

### 코드 리뷰어

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer. Analyze code for:
1. Code quality and maintainability
2. Security vulnerabilities
3. Performance issues
4. Best practice violations
```

### 디버거

```yaml
---
name: debugger
description: Debug and fix issues
tools: Read, Edit, Bash, Grep, Glob
model: sonnet
---

You are a debugging specialist. When given a bug:
1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Verify fix works
```

### 데이터 사이언티스트

```yaml
---
name: data-scientist
description: Analyze data and generate insights
tools: Bash, Read, Write
model: sonnet
---
You are a data scientist. Analyze data using Python/pandas.
Generate visualizations and summary statistics.
```

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                |
| ---------- | ---- | ------------------------ |
| 2026-02-24 | v2.0 | 공식 문서 기준 전면 작성 |
