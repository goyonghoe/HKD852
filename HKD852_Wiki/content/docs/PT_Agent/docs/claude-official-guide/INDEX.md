# Claude 공식 가이드 로컬 저장소

> **목적**: Claude Code/Agent SDK 공식 문서를 로컬에 저장하여 빠른 참조 및 오프라인 접근 지원
> **최종 업데이트**: 2026-02-04
> **업데이트 체크**: `/pt-update-check` 스킬 사용

## 📚 문서 인덱스

### 1. 스킬 (Skills)

Claude Code에서 사용하는 스킬 정의 및 구현 가이드

| 문서                                                  | 설명                                   | 버전 |
| ----------------------------------------------------- | -------------------------------------- | ---- |
| [01-skill-structure.md](skills/01-skill-structure.md) | 스킬 구조, YAML frontmatter, 도구 권한 | v1.0 |
| [02-skill-examples.md](skills/02-skill-examples.md)   | 실제 스킬 예제 모음                    | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/claude-code/skills

### 2. Agent SDK

프로그래밍 방식으로 Claude 에이전트를 구축하는 SDK

| 문서                                       | 설명                        | 버전 |
| ------------------------------------------ | --------------------------- | ---- |
| [01-overview.md](agent-sdk/01-overview.md) | SDK 개요, 설치, 기본 사용법 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/agents/agent-sdk

### 3. 베스트 프랙티스

효과적인 스킬/에이전트 개발을 위한 가이드라인

| 문서                                                                    | 설명                         | 버전 |
| ----------------------------------------------------------------------- | ---------------------------- | ---- |
| [01-skill-best-practices.md](best-practices/01-skill-best-practices.md) | 스킬 설계, 보안, 성능 최적화 | v1.0 |

**공식 문서**: https://docs.anthropic.com/en/docs/claude-code/best-practices

---

## 🔄 업데이트 관리

### 업데이트 체크 방법

```
/pt-update-check
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
docs/claude-official-guide/
├── INDEX.md                 # 이 파일
├── skills/
│   ├── 01-skill-structure.md
│   └── 02-skill-examples.md
├── agent-sdk/
│   └── 01-overview.md
└── best-practices/
    └── 01-skill-best-practices.md
```

---

## 변경 이력

| 날짜       | 변경 내용                                          |
| ---------- | -------------------------------------------------- |
| 2026-02-04 | 최초 생성: 스킬 가이드, Agent SDK, 베스트 프랙티스 |
