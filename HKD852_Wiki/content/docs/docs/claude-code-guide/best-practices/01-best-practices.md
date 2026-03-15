# Claude Code 베스트 프랙티스 공식 가이드

> **출처**: https://code.claude.com/docs/en/best-practices
> **최종 동기화**: 2026-02-24
> **버전**: v2.0

> 대부분의 베스트 프랙티스는 하나의 제약에 기반합니다: **Claude의 컨텍스트 윈도우는 빠르게 차며, 가득 차면 성능이 떨어집니다.**

## 1. 검증 수단을 제공하라 (최고 우선순위)

이것이 가장 효과가 큰 단일 실천 항목입니다. 테스트, 스크린샷, 예상 출력을 포함하세요.

| 전략              | Before                                                | After                                                                                                                              |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 검증 기준 제공    | "implement a function that validates email addresses" | "write a validateEmail function. example test cases: user@example.com is true, invalid is false. run the tests after implementing" |
| UI 변경 시각 검증 | "make the dashboard look better"                      | "[paste screenshot] implement this design. take a screenshot and compare"                                                          |
| 근본 원인 해결    | "the build is failing"                                | "the build fails with this error: [paste]. fix it and verify the build succeeds"                                                   |

## 2. 탐색 → 계획 → 코드 순서

Plan Mode 활용 (`Ctrl+G`):

1. **탐색**: Plan Mode 진입. Claude가 파일을 읽지만 수정하지 않음
2. **계획**: 상세 구현 계획 요청
3. **구현**: Normal Mode로 전환
4. **커밋**: Claude에게 커밋/PR 요청

> 작업 범위가 명확하고 작은 경우 계획 단계 생략 가능

## 3. 프롬프트에 구체적 컨텍스트 제공

| 전략           | Before                                      | After                                                                                                       |
| -------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 작업 범위 지정 | "add tests for foo.py"                      | "write a test for foo.py covering the edge case where user is logged out. avoid mocks."                     |
| 소스 지정      | "why does ExecutionFactory have weird api?" | "look through ExecutionFactory's git history and summarize how its api came to be"                          |
| 패턴 참조      | "add a calendar widget"                     | "look at how existing widgets are implemented. HotDogWidget.php is a good example. follow the pattern..."   |
| 증상 기술      | "fix the login bug"                         | "users report login fails after session timeout. check auth flow in src/auth/, especially token refresh..." |

### 풍부한 콘텐츠 제공

- `@`로 파일 참조
- 이미지 직접 붙여넣기
- 문서 URL 제공
- 파이프 입력: `cat error.log | claude`
- Claude가 필요한 것을 직접 가져오도록 허용

## 4. 환경 구성

### 효과적인 CLAUDE.md

`/init`으로 스타터 생성. 짧고 사람이 읽기 쉽게.

```markdown
# Code style

- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible

# Workflow

- Be sure to typecheck when you're done making code changes
- Prefer running single tests, not the whole test suite
```

| 포함                           | 제외                      |
| ------------------------------ | ------------------------- |
| Claude가 추측 못하는 Bash 명령 | 코드에서 알 수 있는 것    |
| 기본값과 다른 코드 스타일      | Claude가 아는 표준 관행   |
| 테스트 러너, 테스트 지침       | 상세 API 문서 (링크 대신) |
| 브랜치 네이밍, PR 관행         | 자주 변하는 정보          |
| 아키텍처 결정                  | 긴 튜토리얼               |
| 개발 환경 특이사항             | 자명한 관행               |

### CLAUDE.md 임포트

```markdown
See @README.md for project overview and @package.json for available npm commands.
```

### 권한 설정

`/permissions` → 허용 목록, `/sandbox` → OS 수준 격리

### CLI 도구 설치

`gh`, `aws`, `gcloud`, `sentry-cli` 등. Claude가 사용법을 알고 있습니다.

### MCP 서버 연결

```bash
claude mcp add  # 외부 도구 연결 (Notion, Figma, DB 등)
```

### 스킬 생성

→ [스킬 가이드](../skills/01-skill-structure.md) 참조

### 커스텀 서브에이전트 생성

→ [서브에이전트 가이드](../sub-agents/01-sub-agents.md) 참조

### 플러그인 설치

`/plugin` → 마켓플레이스 브라우즈

## 5. 효과적 커뮤니케이션

### 코드베이스 질문

다른 엔지니어에게 물어볼 것과 같은 질문을 Claude에게 하세요.

### Claude 인터뷰 모드

```
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.
Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs.
```

## 6. 세션 관리

### 즉시 교정

- `Esc`: 진행 중인 작업 중단
- `Esc + Esc` 또는 `/rewind`: 이전 상태 복원
- `"Undo that"`: 변경 사항 되돌리기
- `/clear`: 컨텍스트 리셋

> 두 번 교정 실패 후 → `/clear` 하고 새로 시작

### 컨텍스트 공격적 관리

- `/clear`: 작업 간 컨텍스트 초기화
- `/compact <instructions>`: 통제된 압축
- `Esc + Esc` 또는 `/rewind` → "Summarize from here"
- CLAUDE.md에서 압축 커스터마이즈

### 서브에이전트 활용

```
Use subagents to investigate how our authentication system handles token refresh
```

### 체크포인트로 되돌리기

모든 동작이 체크포인트 생성. Esc 두 번 또는 `/rewind`.

### 대화 재개

```bash
claude --continue    # 가장 최근 재개
claude --resume      # 최근 목록에서 선택
```

`/rename`으로 세션 이름 지정.

## 7. 자동화 및 확장

### Headless 모드

```bash
claude -p "Explain what this project does"
claude -p "List all API endpoints" --output-format json
claude -p "Analyze this log file" --output-format stream-json
```

### 다중 세션 실행

- **데스크톱 앱**: 다중 로컬 세션
- **Web**: 클라우드 인프라
- **Agent Teams**: 자동 조율

### Writer/Reviewer 패턴

| Session A (Writer)         | Session B (Reviewer)                     |
| -------------------------- | ---------------------------------------- |
| `Implement a rate limiter` |                                          |
|                            | `Review the rate limiter implementation` |
| `Address review feedback`  |                                          |

### 파일 팬아웃

```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)"
done
```

### 안전한 자율 모드

`claude --dangerously-skip-permissions` → 인터넷 없는 컨테이너에서만.

## 8. 흔한 실패 패턴 방지

| 패턴                     | 문제                          | 해결                                     |
| ------------------------ | ----------------------------- | ---------------------------------------- |
| **Kitchen sink 세션**    | 무관한 작업들로 컨텍스트 오염 | `/clear` 사이에 끼우기                   |
| **반복 교정**            | 같은 실수 반복 교정           | 두 번 실패 후 `/clear` + 개선된 프롬프트 |
| **과도한 CLAUDE.md**     | 불필요한 지침으로 성능 저하   | 가차없이 정리                            |
| **Trust-then-verify 갭** | 검증 없이 결과 신뢰           | 항상 검증 수단 제공                      |
| **무한 탐색**            | 끝없이 파일 탐색              | 범위 좁히기 또는 서브에이전트 활용       |

---

## 변경 이력

| 날짜       | 버전 | 변경 내용                                                             |
| ---------- | ---- | --------------------------------------------------------------------- |
| 2026-02-24 | v2.0 | 스킬 베스트 프랙티스에서 전체 베스트 프랙티스로 확장 (공식 문서 기준) |
| 2026-02-04 | v1.0 | 최초 작성 (스킬 중심)                                                 |
