# Claude Code 스킬 구조 공식 가이드

> **출처**: https://docs.anthropic.com/en/docs/claude-code/skills
> **최종 동기화**: 2026-02-04
> **버전**: v1.0

## 1. 스킬 파일 구조

### 필수 파일
모든 스킬은 `SKILL.md` 파일이 필요합니다.

```
<skill-name>/
├── SKILL.md           # 메인 지침 (필수)
├── template.md        # 템플릿 (선택)
├── examples/          # 예시 (선택)
│   └── sample.md
└── scripts/           # 스크립트 (선택)
    └── validate.sh
```

### 스킬 저장 위치

| 위치 | 경로 | 적용 범위 |
|------|------|----------|
| 개인용 | `~/.claude/skills/<skill-name>/SKILL.md` | 모든 프로젝트 |
| 프로젝트용 | `.claude/skills/<skill-name>/SKILL.md` | 해당 프로젝트만 |

## 2. YAML Frontmatter 필드

```yaml
---
name: skill-name
description: "스킬 설명 (최대 1024자)"
argument-hint: "[filename] [format]"
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Bash
model: opus
context: fork
agent: Explore
---
```

### 필드 설명

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `name` | ✓ | 스킬 식별자 (소문자, 하이픈, 최대 64자) |
| `description` | ✓ | 스킬 용도 설명 (최대 1024자) |
| `argument-hint` | - | 자동완성에 표시될 인수 힌트 |
| `disable-model-invocation` | - | `true`: Claude가 자동 호출 불가 |
| `user-invocable` | - | `false`: `/` 메뉴에서 숨김 |
| `allowed-tools` | - | 권한 없이 사용 가능한 도구 목록 |
| `model` | - | 사용할 모델 (`opus`, `sonnet`, `haiku`) |
| `context` | - | `fork`: 격리된 서브에이전트로 실행 |
| `agent` | - | 서브에이전트 타입 (`Explore`, `Plan`, `general-purpose`) |

## 3. 동적 변수

스킬 내에서 사용 가능한 변수:

```yaml
$ARGUMENTS        # 전달된 모든 인수
$ARGUMENTS[0]     # 첫 번째 인수
$0, $1, $2        # 인수 단축형
${CLAUDE_SESSION_ID}  # 현재 세션 ID
```

### 예시
```yaml
---
name: fix-issue
description: GitHub 이슈 수정
---

GitHub 이슈 #$ARGUMENTS 를 수정합니다.
```

## 4. 사용 가능한 도구 (allowed-tools)

| 도구 | 설명 |
|------|------|
| `Read` | 파일 읽기 |
| `Write` | 파일 쓰기 |
| `Edit` | 파일 수정 |
| `Bash` | 명령어 실행 |
| `Glob` | 파일 패턴 검색 |
| `Grep` | 내용 검색 |
| `WebSearch` | 웹 검색 |
| `WebFetch` | URL 내용 가져오기 |
| `AskUserQuestion` | 사용자에게 질문 |
| `Task` | 서브에이전트 실행 |

### Bash 패턴 허용
```yaml
allowed-tools: Bash(npm *), Bash(git *)
```

## 5. 프로그레시브 콘텐츠 로딩

Claude는 스킬을 3단계로 로드합니다:

1. **Level 1 (항상)**: YAML 메타데이터 (~100 토큰)
2. **Level 2 (호출 시)**: SKILL.md 본문 (~5k 토큰)
3. **Level 3 (필요 시)**: 참조 파일들 (무제한)

## 6. 호출 제어

### 사용자만 호출 가능
```yaml
disable-model-invocation: true
```

### Claude만 호출 가능 (백그라운드 지식)
```yaml
user-invocable: false
```

### 둘 다 호출 가능 (기본값)
두 필드 모두 생략

## 7. 보안 고려사항

- 신뢰할 수 있는 소스의 스킬만 사용
- 스킬 디렉토리의 모든 파일 감사
- 외부 데이터를 가져오는 스킬 주의
- 악의적인 스킬은 코드 실행 유도 가능

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-04 | v1.0 | 최초 작성 |
