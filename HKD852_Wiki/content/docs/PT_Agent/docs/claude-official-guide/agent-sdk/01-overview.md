# Claude Agent SDK 공식 가이드

> **출처**: https://docs.anthropic.com/en/docs/agent-sdk
> **최종 동기화**: 2026-02-04
> **버전**: v1.0

## 1. 개요

Claude Agent SDK는 프로덕션 AI 에이전트를 구축하기 위한 공식 도구입니다.

### 설치

**Python (uv)**

```bash
uv init && uv add claude-agent-sdk
```

**Python (pip)**

```bash
python3 -m venv .venv && source .venv/bin/activate
pip3 install claude-agent-sdk
```

**TypeScript**

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### API 키 설정

```bash
export ANTHROPIC_API_KEY=your-api-key
```

## 2. 기본 사용법

### Python

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Your task here",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash"],
            permission_mode="acceptEdits"
        )
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

### TypeScript

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Your task here",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits",
  },
})) {
  if ("result" in message) console.log(message.result);
}
```

## 3. 주요 옵션

### ClaudeAgentOptions

| 옵션              | 타입        | 설명                    |
| ----------------- | ----------- | ----------------------- |
| `allowed_tools`   | `list[str]` | 사용 가능한 도구 목록   |
| `permission_mode` | `str`       | 권한 모드               |
| `system_prompt`   | `str`       | 커스텀 시스템 프롬프트  |
| `session_id`      | `str`       | 세션 ID (컨텍스트 유지) |
| `resume`          | `str`       | 이전 세션 재개          |
| `hooks`           | `dict`      | 라이프사이클 훅         |
| `mcp_servers`     | `dict`      | MCP 서버 연결           |
| `agents`          | `dict`      | 서브에이전트 정의       |

### permission_mode 값

| 값                  | 설명                  |
| ------------------- | --------------------- |
| `default`           | 기본값, 권한 요청     |
| `acceptEdits`       | 편집 자동 승인        |
| `bypassPermissions` | 모든 권한 우회 (주의) |

## 4. 사용 가능한 도구

```python
allowed_tools=[
    "Read",           # 파일 읽기
    "Write",          # 파일 쓰기
    "Edit",           # 파일 수정
    "Bash",           # 명령어 실행
    "Glob",           # 파일 패턴 검색
    "Grep",           # 내용 검색
    "WebSearch",      # 웹 검색
    "WebFetch",       # URL 가져오기
    "AskUserQuestion", # 사용자 질문
    "Task"            # 서브에이전트
]
```

## 5. 메시지 타입

```python
from claude_agent_sdk import (
    AssistantMessage,  # Claude의 응답
    UserMessage,       # 사용자 입력
    ResultMessage,     # 작업 결과
    ToolUseMessage,    # 도구 사용
    ToolResultMessage  # 도구 결과
)
```

### 메시지 처리 예시

```python
async for message in query(prompt="...", options=options):
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if hasattr(block, "text"):
                print(block.text)
    elif isinstance(message, ResultMessage):
        print(f"완료: {message.subtype}")
```

## 6. 서브에이전트 정의

```python
from claude_agent_sdk import AgentDefinition

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep", "Task"],
    agents={
        "code-reviewer": AgentDefinition(
            description="코드 품질 리뷰 전문가",
            prompt="코드를 분석하고 개선점을 제안하세요.",
            tools=["Read", "Glob", "Grep"]
        ),
        "test-writer": AgentDefinition(
            description="테스트 코드 작성 전문가",
            prompt="테스트 케이스를 작성하세요.",
            tools=["Read", "Write", "Bash"]
        )
    }
)
```

## 7. 세션 관리

### 세션 유지

```python
# 첫 번째 호출
async for msg in query(prompt="분석해줘", options=ClaudeAgentOptions(
    session_id="my-session-123"
)):
    pass

# 이후 호출 (컨텍스트 유지)
async for msg in query(prompt="아까 분석한 것 수정해줘", options=ClaudeAgentOptions(
    session_id="my-session-123"
)):
    pass
```

### 세션 재개

```python
async for msg in query(prompt="계속해줘", options=ClaudeAgentOptions(
    resume="previous-session-id"
)):
    pass
```

## 8. 훅 (Hooks)

```python
def on_tool_start(tool_name, params):
    print(f"도구 시작: {tool_name}")

def on_tool_end(tool_name, result):
    print(f"도구 완료: {tool_name}")

options = ClaudeAgentOptions(
    hooks={
        "onToolStart": on_tool_start,
        "onToolEnd": on_tool_end
    }
)
```

## 9. MCP 서버 연결

```python
options = ClaudeAgentOptions(
    mcp_servers={
        "database": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-postgres"],
            "env": {"DATABASE_URL": "..."}
        }
    }
)
```

---

## 변경 이력

| 날짜       | 버전 | 변경 내용 |
| ---------- | ---- | --------- |
| 2026-02-04 | v1.0 | 최초 작성 |
