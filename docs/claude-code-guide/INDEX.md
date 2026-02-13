# Claude Code 공식 가이드 (HKD852 루트)

> **목적**: Claude Code/Agent SDK 공식 문서를 로컬에 저장하여 모든 하위 에이전트가 일관된 표준을 따르도록 지원
> **최종 업데이트**: 2026-02-06
> **업데이트 체크**: `/guide-update-check` 스킬 사용

## 적용 범위

이 가이드는 HKD852 하위 모든 에이전트에 적용됩니다:
- **GameDesign_Agent** - 게임 디자인 의사결정 지원
- **PT_Agent** - 프레젠테이션 제작
- **Income_Factory** - 수익 자동화
- **Video_Analyzer** - 영상 분석
- **team-kowloon** - SSBL 아트 파이프라인

---

## 📚 문서 인덱스

### 1. 스킬 (Skills)
Claude Code에서 사용하는 스킬 정의 및 구현 가이드

| 문서 | 설명 | 버전 |
|------|------|------|
| [01-skill-structure.md](skills/01-skill-structure.md) | 스킬 구조, YAML frontmatter, 도구 권한 | v1.0 |
| [02-skill-examples.md](skills/02-skill-examples.md) | 실제 스킬 예제 모음 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/claude-code/skills

### 2. Agent Teams (Opus 4.6 신기능)
여러 Claude Code 인스턴스가 팀으로 협업하는 기능

| 문서 | 설명 | 버전 |
|------|------|------|
| [01-overview.md](agent-teams/01-overview.md) | Agent Teams 개요, 사용법, 베스트 프랙티스 | v1.0 |

**공식 문서**: https://code.claude.com/docs/en/agent-teams

### 3. Agent SDK
프로그래밍 방식으로 Claude 에이전트를 구축하는 SDK

| 문서 | 설명 | 버전 |
|------|------|------|
| [01-overview.md](agent-sdk/01-overview.md) | SDK 개요, 설치, 기본 사용법 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/agents/agent-sdk

### 4. 베스트 프랙티스
효과적인 스킬/에이전트 개발을 위한 가이드라인

| 문서 | 설명 | 버전 |
|------|------|------|
| [01-skill-best-practices.md](best-practices/01-skill-best-practices.md) | 스킬 설계, 보안, 성능 최적화 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/claude-code/best-practices

---

## 🔄 업데이트 관리

### 업데이트 체크 방법
```
/guide-update-check
```

### 수동 체크 (권장 주기: 월 1회)
1. 공식 문서 사이트 방문
2. 변경 로그 확인
3. 로컬 문서와 비교
4. 필요시 업데이트

### 공식 문서 링크
- **메인**: https://docs.anthropic.com
- **Claude Code**: https://docs.anthropic.com/en/docs/claude-code
- **Agent SDK**: https://docs.anthropic.com/en/docs/agents
- **API Reference**: https://docs.anthropic.com/en/api

---

## 📋 빠른 참조

### 스킬 필수 구조
```
.claude/skills/<skill-name>/SKILL.md
```

### YAML Frontmatter 필수 필드
```yaml
---
name: skill-name
description: "스킬 설명"
---
```

### 주요 옵션 필드
```yaml
argument-hint: "[인수]"
user-invocable: true|false
disable-model-invocation: true|false
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: opus|sonnet|haiku
context: fork
agent: Explore|Plan|general-purpose
```

### 동적 변수
```
$ARGUMENTS     - 모든 인수
$ARGUMENTS[0]  - 첫 번째 인수
$0, $1, $2     - 인수 단축형
```

---

## 📁 디렉토리 구조

```
HKD852/
├── docs/claude-code-guide/      # ← 공용 가이드 (이 폴더)
│   ├── INDEX.md
│   ├── skills/
│   │   ├── 01-skill-structure.md
│   │   └── 02-skill-examples.md
│   ├── agent-teams/             # ← Opus 4.6 신기능
│   │   └── 01-overview.md
│   ├── agent-sdk/
│   │   └── 01-overview.md
│   └── best-practices/
│       └── 01-skill-best-practices.md
├── .claude/
│   ├── settings.local.json      # ← Agent Teams 활성화 설정 포함
│   └── skills/
│       └── guide-update-check/
├── CLAUDE.md                    # ← 루트 규칙 (모든 에이전트 적용)
├── GameDesign_Agent/
├── PT_Agent/
├── Income_Factory/
├── Video_Analyzer/
└── team-kowloon/
```

---

## 하위 에이전트 참조 규칙

모든 하위 에이전트의 CLAUDE.md는 다음을 포함해야 합니다:

```markdown
## 공통 표준
이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- 가이드 위치: `../docs/claude-code-guide/INDEX.md`
- 스킬 표준: `../docs/claude-code-guide/skills/01-skill-structure.md`
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-06 | Agent Teams (Opus 4.6) 문서 추가, 활성화 설정 |
| 2026-02-06 | 루트 레벨로 이동, 전체 에이전트 적용 구조로 재설계 |
| 2026-02-04 | 최초 생성 (PT_Agent 내) |
