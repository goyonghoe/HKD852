---
name: log-mistake
description: "실수/교훈을 mistake-registry.md에 기록"
user-invocable: true
argument-hint: "[실수 설명]"
allowed-tools: Read, Edit
model: haiku
---

# /log-mistake — 실수/교훈 기록

## Role
발생한 실수나 교훈을 `.claude/rules/mistake-registry.md`에 구조화하여 기록.
이후 모든 세션에서 자동 로드되어 같은 실수 반복 방지.

## Procedure

### 1. 레지스트리 읽기
`.claude/rules/mistake-registry.md` 파일 읽기.
현재 최고 M-XXX ID 번호 확인.

### 2. 실수 분석
$ARGUMENTS 또는 대화 컨텍스트에서 추출:
- **Category**: Architecture | Balance | Colors | Testing | Session | Design | Performance | Types | Deploy
- **What went wrong**: 구체적 설명
- **Root cause**: 왜 발생했는지
- **Prevention rule**: 실행 가능한 예방 규칙 (NEVER/ALWAYS 형식)

### 3. 중복 확인
기존 항목 중 동일 패턴이 있는지 확인.
중복이면 기존 항목에 사례 추가만 하고 새 항목은 만들지 않음.

### 4. 항목 추가
"새 항목 추가 방법" 섹션 바로 위에 새 항목 삽입:

```markdown
## M-[next-id] | [Category] | [짧은 제목]
- **What**: [설명]
- **Root cause**: [분석]
- **Prevention**: [규칙]
```

### 5. 확인
새 항목 ID와 예방 규칙을 사용자에게 보고.

## Rules
- mistake-registry.md만 편집
- 예방 규칙은 구체적이고 실행 가능해야 함 (모호한 조언 금지)
- 기존 항목과 중복 금지
