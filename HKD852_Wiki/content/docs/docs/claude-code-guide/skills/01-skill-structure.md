# 스킬 (Skills) 공식 가이드

> **출처**: https://code.claude.com/docs/en/skills
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

## 1. 개요

스킬은 Claude의 기능을 확장합니다. `SKILL.md` 파일에 지침을 작성하면 Claude가 도구에 추가합니다. 관련 상황에서 자동 사용되거나 `/skill-name`으로 직접 호출 가능합니다.

> **참고**: 커스텀 슬래시 커맨드(`.claude/commands/`)가 스킬에 통합되었습니다. 기존 `.claude/commands/` 파일도 동일하게 작동합니다.

> Claude Code 스킬은 **Agent Skills 오픈 표준** (agentskills.io)을 따릅니다.

## 2. 첫 스킬 만들기

### Step 1: 디렉토리 생성

```bash
mkdir -p ~/.claude/skills/explain-code
```

### Step 2: SKILL.md 작성

`~/.claude/skills/explain-code/SKILL.md`:

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always include:

1. **Start with an analogy**: Compare the code to something from everyday life
2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
3. **Walk through the code**: Explain step-by-step what happens
4. **Highlight a gotcha**: What's a common mistake or misconception?

Keep explanations conversational. For complex concepts, use multiple analogies.
```

### Step 3: 테스트

- 자동 호출: "How does this code work?"
- 직접 호출: `/explain-code src/auth/login.ts`

## 3. 스킬 저장 위치

| 위치       | 경로                               | 적용 범위          | 우선순위 |
| ---------- | ---------------------------------- | ------------------ | -------- |
| Enterprise | Managed settings                   | 조직 전체          | 최고     |
| 개인용     | `~/.claude/skills/<name>/SKILL.md` | 모든 프로젝트      | 높음     |
| 프로젝트용 | `.claude/skills/<name>/SKILL.md`   | 해당 프로젝트      | 보통     |
| 플러그인   | `<plugin>/skills/<name>/SKILL.md`  | 플러그인 활성화 시 | 최저     |

> 같은 이름의 스킬은 높은 우선순위가 우선: enterprise > personal > project

### 자동 디스커버리

하위 디렉토리에서 작업 시 중첩된 `.claude/skills/` 디렉토리를 자동 발견합니다.

### 추가 디렉토리

`--add-dir`로 추가된 디렉토리의 `.claude/skills/` 스킬도 자동 로드됩니다.

## 4. 파일 구조

```
my-skill/
├── SKILL.md           # 메인 지침 (필수)
├── template.md        # 템플릿 (선택)
├── examples/          # 예시 (선택)
│   └── sample.md
└── scripts/           # 스크립트 (선택)
    └── validate.sh
```

> `SKILL.md`는 500줄 이하로 유지. 상세 참조 자료는 별도 파일로 분리.

## 5. YAML Frontmatter 전체 레퍼런스

```yaml
---
name: my-skill
description: What this skill does
argument-hint: "[issue-number]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Grep
model: opus
context: fork
agent: Explore
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./validate.sh"
---
```

### 필드 설명

| 필드                       | 필수 | 설명                                           |
| -------------------------- | :--: | ---------------------------------------------- |
| `name`                     |  No  | 표시 이름. 소문자, 숫자, 하이픈 (최대 64자)    |
| `description`              | 권장 | 스킬 용도. Claude가 자동 적용 여부 판단에 사용 |
| `argument-hint`            |  No  | 자동완성에 표시될 힌트. 예: `[issue-number]`   |
| `disable-model-invocation` |  No  | `true`: Claude 자동 호출 방지. 기본: `false`   |
| `user-invocable`           |  No  | `false`: `/` 메뉴에서 숨김. 기본: `true`       |
| `allowed-tools`            |  No  | 권한 없이 사용 가능한 도구                     |
| `model`                    |  No  | 스킬 활성화 시 사용할 모델                     |
| `context`                  |  No  | `fork`: 격리된 서브에이전트에서 실행           |
| `agent`                    |  No  | `context: fork`일 때 사용할 서브에이전트 타입  |
| `hooks`                    |  No  | 스킬 라이프사이클 훅                           |

## 6. 동적 변수 (String Substitutions)

| 변수                   | 설명                   |
| ---------------------- | ---------------------- |
| `$ARGUMENTS`           | 전달된 모든 인수       |
| `$ARGUMENTS[N]`        | N번째 인수 (0-based)   |
| `$N`                   | `$ARGUMENTS[N]` 단축형 |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID           |

### 예시

```yaml
---
name: migrate-component
description: Migrate a component from one framework to another
---
Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.
```

## 7. 콘텐츠 유형

### Reference 콘텐츠 (지식 추가)

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---
When writing API endpoints:
  - Use RESTful naming conventions
  - Return consistent error formats
  - Include request validation
```

### Task 콘텐츠 (단계별 지침)

```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

## 8. 호출 제어

| Frontmatter                      | 사용자 호출 | Claude 호출 |                 컨텍스트 로드                  |
| -------------------------------- | :---------: | :---------: | :--------------------------------------------: |
| (기본값)                         |      O      |      O      |     description 항상 / 전체 스킬은 호출 시     |
| `disable-model-invocation: true` |      O      |      X      | description 컨텍스트에 없음 / 사용자 호출 시만 |
| `user-invocable: false`          |      X      |      O      |      description 항상 / 호출 시 전체 로드      |

## 9. 도구 접근 제한

```yaml
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

### Bash 패턴 제한

```yaml
allowed-tools: Bash(npm test *), Bash(git status)
```

## 10. 인수 전달

```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests
5. Create a commit
```

실행: `/fix-issue 123`

## 11. 고급 패턴

### 동적 컨텍스트 주입

`` !`command` `` 구문으로 스킬 전송 전에 셸 명령 실행:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

### Extended Thinking 활성화

스킬 콘텐츠에 "ultrathink"를 포함하면 extended thinking 활성화

### 서브에이전트에서 실행

`context: fork` 추가하면 격리 실행. 스킬 콘텐츠가 서브에이전트의 프롬프트가 됩니다.

| 접근 방식                  | 시스템 프롬프트       | 태스크             | 추가 로드                 |
| -------------------------- | --------------------- | ------------------ | ------------------------- |
| `context: fork` 스킬       | 에이전트 타입에서     | SKILL.md 내용      | CLAUDE.md                 |
| `skills` 필드 서브에이전트 | 서브에이전트 마크다운 | Claude 위임 메시지 | 프리로드 스킬 + CLAUDE.md |

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

## 12. Claude의 스킬 접근 제한

### 모든 스킬 비활성화

```
Skill
```

### 특정 스킬만 허용/거부

```
Skill(commit)
Skill(review-pr *)
Skill(deploy *)
```

## 13. 스킬 공유

- **프로젝트 스킬**: `.claude/skills/`를 버전 컨트롤에 커밋
- **플러그인**: 플러그인에 `skills/` 디렉토리 생성
- **Managed**: 조직 전체 managed settings로 배포

## 14. 트러블슈팅

- **스킬 미작동**: description 키워드 확인, "What skills are available?" 질문, 직접 호출 시도
- **너무 자주 작동**: description을 더 구체적으로, `disable-model-invocation: true` 추가
- **모든 스킬 미표시**: 버짓은 컨텍스트 윈도우의 2% (폴백 16,000자). `SLASH_COMMAND_TOOL_CHAR_BUDGET` 환경 변수로 오버라이드

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                                   |
| ---------- | ---- | --------------------------------------------------------------------------- |
| 2026-02-24 | v2.0 | 공식 문서 기준 전면 재작성 (hooks, advanced patterns, troubleshooting 추가) |
| 2026-02-04 | v1.0 | 최초 작성                                                                   |
