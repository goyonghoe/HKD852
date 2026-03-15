# 설정 및 환경 구성 공식 가이드

> **출처**: https://code.claude.com/docs/en/settings
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

## 1. 설정 스코프

| 스코프  | 위치                                | 영향 범위          | 공유            |
| ------- | ----------------------------------- | ------------------ | --------------- |
| Managed | 시스템 수준 `managed-settings.json` | 머신의 모든 사용자 | Yes (IT 배포)   |
| User    | `~/.claude/`                        | 나, 모든 프로젝트  | No              |
| Project | `.claude/` (repo)                   | 모든 협업자        | Yes (git)       |
| Local   | `.claude/*.local.*`                 | 나, 이 repo만      | No (gitignored) |

### 우선순위 (높은 순)

1. Managed settings
2. CLI 인수
3. 로컬 프로젝트 설정 (`.claude/settings.local.json`)
4. 공유 프로젝트 설정 (`.claude/settings.json`)
5. 사용자 설정 (`~/.claude/settings.json`)

### 파일 위치

- **User**: `~/.claude/settings.json`
- **Project shared**: `.claude/settings.json`
- **Project local**: `.claude/settings.local.json`
- **Managed (macOS)**: `/Library/Application Support/ClaudeCode/`
- **Managed (Linux/WSL)**: `/etc/claude-code/`
- **Managed (Windows)**: `C:\Program Files\ClaudeCode\`

## 2. settings.json 예시

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm run test *)", "Read(~/.zshrc)"],
    "deny": [
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp"
  }
}
```

## 3. 주요 설정 키

| 키                      | 설명                                                 |
| ----------------------- | ---------------------------------------------------- |
| `model`                 | 기본 모델                                            |
| `permissions`           | 도구 권한 (allow/deny/ask)                           |
| `env`                   | 환경 변수                                            |
| `hooks`                 | 라이프사이클 훅                                      |
| `statusLine`            | 상태 줄 표시 설정                                    |
| `outputStyle`           | 출력 스타일                                          |
| `language`              | UI 언어                                              |
| `teammateMode`          | Agent Teams 표시 모드 (`in-process`, `tmux`, `auto`) |
| `attribution`           | 커밋/PR 귀속 메시지                                  |
| `respectGitignore`      | .gitignore 준수 여부                                 |
| `alwaysThinkingEnabled` | 항상 thinking 모드                                   |
| `autoUpdatesChannel`    | 자동 업데이트 채널                                   |

## 4. 권한 설정

### 권한 키

| 키                             | 설명                                               |
| ------------------------------ | -------------------------------------------------- |
| `allow`                        | 도구 사용 허용 규칙 배열                           |
| `ask`                          | 확인 필요 규칙 배열                                |
| `deny`                         | 도구 사용 거부 규칙 배열                           |
| `additionalDirectories`        | 추가 작업 디렉토리                                 |
| `defaultMode`                  | 기본 권한 모드                                     |
| `disableBypassPermissionsMode` | `"disable"`: `--dangerously-skip-permissions` 방지 |

### 규칙 구문

규칙은 `Tool` 또는 `Tool(specifier)` 형식. 평가 순서: deny → ask → allow

| 규칙                           | 효과                        |
| ------------------------------ | --------------------------- |
| `Bash`                         | 모든 Bash 명령              |
| `Bash(npm run *)`              | `npm run`으로 시작하는 명령 |
| `Read(./.env)`                 | .env 파일 읽기              |
| `WebFetch(domain:example.com)` | example.com 접근            |
| `Task(Explore)`                | Explore 서브에이전트        |
| `Task(my-custom-agent)`        | 특정 커스텀 에이전트        |

## 5. 샌드박스 설정

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker"],
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowLocalBinding": true
    }
  }
}
```

## 6. Attribution 설정

```json
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": ""
  }
}
```

## 7. 주요 환경 변수

### API / 모델

| 변수                      | 설명               |
| ------------------------- | ------------------ |
| `ANTHROPIC_API_KEY`       | API 키             |
| `ANTHROPIC_MODEL`         | 사용할 모델        |
| `CLAUDE_CODE_USE_BEDROCK` | AWS Bedrock 사용   |
| `CLAUDE_CODE_USE_VERTEX`  | Google Vertex 사용 |
| `CLAUDE_CODE_USE_FOUNDRY` | Foundry 사용       |

### 동작 제어

| 변수                                   | 설명                                    |
| -------------------------------------- | --------------------------------------- |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`      | 자동 압축 시작 % (1~100, 기본 ~95%)     |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY`      | 1=끄기, 0=강제 켜기                     |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | 백그라운드 태스크 비활성화              |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Agent Teams 활성화                      |
| `CLAUDE_CODE_EFFORT_LEVEL`             | low, medium, high                       |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS`        | 최대 출력 토큰 (기본 32000, 최대 64000) |
| `CLAUDE_CODE_SIMPLE`                   | 최소 시스템 프롬프트                    |
| `MAX_THINKING_TOKENS`                  | 최대 thinking 토큰                      |

### 기타

| 변수                             | 설명                                      |
| -------------------------------- | ----------------------------------------- |
| `DISABLE_AUTOUPDATER`            | 자동 업데이터 비활성화                    |
| `DISABLE_TELEMETRY`              | 텔레메트리 비활성화                       |
| `HTTP_PROXY` / `HTTPS_PROXY`     | 프록시 설정                               |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | 스킬 description 버짓 (기본: 컨텍스트 2%) |

## 8. 플러그인 설정

```json
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/claude-plugins" }
    }
  }
}
```

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                |
| ---------- | ---- | ------------------------ |
| 2026-02-24 | v2.0 | 공식 문서 기준 전면 작성 |
