---
name: qa-smoke
description: '빌드 + 테스트 + 타입체크 원커맨드 스모크 테스트'
user-invocable: true
allowed-tools: Bash, Read, Glob
model: haiku
---

# /qa-smoke — 스모크 테스트

## 역할

QA 에이전트로서 빌드, 테스트, 타입 검사를 한 번에 실행하고 결과를 요약합니다.

## 절차

### 1. 빌드 검증

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/WanChai && npm run build 2>&1 | tail -20
```

### 2. 테스트 실행

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/WanChai && npm test -- --run 2>&1 | tail -30
```

### 3. TypeScript strict 검사

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/WanChai && npx tsc --noEmit 2>&1 | tail -20
```

### 4. 결과 요약

```
🔥 SMOKE TEST RESULT
────────────────────
BUILD:  ✅ PASS / ❌ FAIL
TESTS:  X passed / Y failed / Z total
TYPES:  ✅ PASS / ❌ N errors
────────────────────
VERDICT: PASS / FAIL
```

- 하나라도 FAIL이면 VERDICT = FAIL
- FAIL 시 에러 메시지 + 파일 위치 포함

## 규칙

- 코드 수정하지 않음 (검증만)
- 15초 이내 완료 목표
