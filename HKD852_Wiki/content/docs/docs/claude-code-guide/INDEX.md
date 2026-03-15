# Claude Code 공식 가이드 (HKD852 루트)

> **목적**: Claude Code 공식 문서를 로컬에 저장하여 모든 하위 에이전트가 일관된 표준을 따르도록 지원
> **최종 업데이트**: 2026-02-24 (v2.0)
> **공식 문서**: https://code.claude.com/docs/en/
> **업데이트 체크**: `/guide-update-check` 스킬 사용

## 적용 범위

이 가이드는 HKD852 하위 **모든 에이전트** (22개)에 적용됩니다.

---

## 문서 인덱스

### 1. 개요 (Overview)

Claude Code의 핵심 개념, 설치, 주요 기능

| 문서                                      | 설명                         | 버전 |
| ----------------------------------------- | ---------------------------- | ---- |
| [01-overview.md](overview/01-overview.md) | Claude Code 개요, 설치, 기능 | v2.0 |

**공식 문서**: https://code.claude.com/docs/en/overview

### 2. 스킬 (Skills)

슬래시 커맨드로 호출 가능한 확장 기능

| 문서                                                  | 설명                                          | 버전 |
| ----------------------------------------------------- | --------------------------------------------- | ---- |
| [01-skill-structure.md](skills/01-skill-structure.md) | 스킬 구조, Frontmatter, 고급 패턴, 트러블슈팅 | v2.0 |
| [02-skill-examples.md](skills/02-skill-examples.md)   | 실제 스킬 예제 모음                           | v1.0 |

**공식 문서**: https://code.claude.com/docs/en/skills

### 3. 서브에이전트 (Sub-Agents)

전문화된 AI 어시스턴트로 작업 위임

| 문서                                            | 설명                                                | 버전 |
| ----------------------------------------------- | --------------------------------------------------- | ---- |
| [01-sub-agents.md](sub-agents/01-sub-agents.md) | 빌트인/커스텀 서브에이전트, Frontmatter, 훅, 메모리 | v2.0 |

**공식 문서**: https://code.claude.com/docs/en/sub-agents

### 4. Agent Teams

여러 Claude Code 인스턴스가 팀으로 협업 (실험적)

| 문서                                         | 설명                                              | 버전 |
| -------------------------------------------- | ------------------------------------------------- | ---- |
| [01-overview.md](agent-teams/01-overview.md) | Agent Teams 아키텍처, 사용법, 훅, 베스트 프랙티스 | v2.0 |

**공식 문서**: https://code.claude.com/docs/en/agent-teams

### 5. 메모리 및 CLAUDE.md

영속 메모리, CLAUDE.md 작성, 모듈형 규칙

| 문서                                | 설명                                                    | 버전 |
| ----------------------------------- | ------------------------------------------------------- | ---- |
| [01-memory.md](memory/01-memory.md) | Auto Memory, CLAUDE.md, 임포트, rules/, 베스트 프랙티스 | v2.0 |

**공식 문서**: https://code.claude.com/docs/en/memory

### 6. 설정 (Settings)

스코프, 권한, 환경 변수, 샌드박스

| 문서                                      | 설명                                             | 버전 |
| ----------------------------------------- | ------------------------------------------------ | ---- |
| [01-settings.md](settings/01-settings.md) | 설정 스코프, 권한, 환경 변수, 샌드박스, 플러그인 | v2.0 |

**공식 문서**: https://code.claude.com/docs/en/settings

### 7. 베스트 프랙티스

효과적인 Claude Code 사용을 위한 종합 가이드

| 문서                                                                    | 설명                                                                      | 버전 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| [01-best-practices.md](best-practices/01-best-practices.md)             | 검증, 계획, 프롬프팅, 세션 관리, 자동화, 실패 방지                        | v2.0 |
| [02-boris-cherny-42-tips.md](best-practices/02-boris-cherny-42-tips.md) | Claude Code 창시자 Boris Cherny의 42가지 실전 팁 + HKD852 적용 체크리스트 | v1.0 |

**공식 문서**: https://code.claude.com/docs/en/best-practices

### 8. Agent SDK

프로그래밍 방식으로 Claude 에이전트를 구축하는 SDK

| 문서                                       | 설명                        | 버전 |
| ------------------------------------------ | --------------------------- | ---- |
| [01-overview.md](agent-sdk/01-overview.md) | SDK 개요, 설치, 기본 사용법 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/agents/agent-sdk

---

## 디렉토리 구조

```
docs/claude-code-guide/
├── INDEX.md                          # ← 이 파일
├── overview/
│   └── 01-overview.md                # Claude Code 개요
├── skills/
│   ├── 01-skill-structure.md         # 스킬 구조 + 고급 패턴
│   └── 02-skill-examples.md          # 스킬 예제 모음
├── sub-agents/
│   └── 01-sub-agents.md              # 서브에이전트 가이드
├── agent-teams/
│   └── 01-overview.md                # Agent Teams 가이드
├── memory/
│   └── 01-memory.md                  # 메모리 및 CLAUDE.md
├── settings/
│   └── 01-settings.md                # 설정 및 환경 구성
├── agent-sdk/
│   └── 01-overview.md                # Agent SDK
└── best-practices/
    ├── 01-best-practices.md          # 종합 베스트 프랙티스
    └── 02-boris-cherny-42-tips.md    # 창시자 42가지 실전 팁
```

---

## 빠른 참조

### 스킬 필수 구조

```
.claude/skills/<skill-name>/SKILL.md
```

### YAML Frontmatter 핵심 필드

```yaml
---
name: skill-name # 소문자+하이픈, 최대 64자
description: "스킬 설명" # Claude 자동 호출 판단에 사용
allowed-tools: Read, Grep # 권한 없이 사용 가능한 도구
model: opus|sonnet|haiku # 사용 모델
context: fork # 서브에이전트 격리 실행
agent: Explore|Plan|general-purpose
disable-model-invocation: true|false
user-invocable: true|false
---
```

### 서브에이전트 Frontmatter 핵심 필드

```yaml
---
name: agent-name # 고유 식별자
description: "에이전트 설명" # 위임 판단에 사용
tools: Read, Glob, Grep # 사용 가능 도구 (생략 시 전체)
model: sonnet # 모델 선택
permissionMode: default # 권한 모드
skills: # 프리로드할 스킬
  - api-conventions
memory: user|project|local # 영속 메모리 스코프
---
```

### 동적 변수

```
$ARGUMENTS     - 모든 인수
$ARGUMENTS[0]  - 첫 번째 인수
$0, $1, $2     - 인수 단축형
${CLAUDE_SESSION_ID} - 세션 ID
```

---

## 하위 에이전트 참조 규칙

모든 하위 에이전트의 CLAUDE.md는 다음을 포함해야 합니다:

```markdown
## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
```

---

## 공식 문서 링크

| 문서             | URL                                                 |
| ---------------- | --------------------------------------------------- |
| Claude Code 메인 | https://code.claude.com/docs/en/                    |
| Skills           | https://code.claude.com/docs/en/skills              |
| Sub-Agents       | https://code.claude.com/docs/en/sub-agents          |
| Agent Teams      | https://code.claude.com/docs/en/agent-teams         |
| Memory           | https://code.claude.com/docs/en/memory              |
| Settings         | https://code.claude.com/docs/en/settings            |
| Best Practices   | https://code.claude.com/docs/en/best-practices      |
| Agent SDK        | https://docs.anthropic.com/en/docs/agents/agent-sdk |
| API Reference    | https://docs.anthropic.com/en/api                   |

---

## 변경 이력

| 날짜       | 변경 내용                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| 2026-02-24 | v2.0: 7개 공식 문서 기준 전면 재구축 (overview, sub-agents, memory, settings 추가) |
| 2026-02-06 | v1.0: Agent Teams (Opus 4.6) 문서 추가, 활성화 설정                                |
| 2026-02-06 | 루트 레벨로 이동, 전체 에이전트 적용 구조로 재설계                                 |
| 2026-02-04 | 최초 생성 (PT_Agent 내)                                                            |
