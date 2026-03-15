---
name: pg-checkpoint
description: '빌드+테스트 검증 + SESSION_LOG.md에 결과 기록'
user-invocable: true
allowed-tools: Read, Edit, Bash, Glob
model: haiku
---

# /pg-checkpoint — 빌드/테스트 검증 + 영구 로그

## Role

Programmer 체크포인트: 빌드+테스트 검증 후 결과를 SESSION_LOG.md에 기록.

## Procedure

### 1. 빌드 검증

```bash
npm run build 2>&1 | tail -20
```

결과: BUILD:PASS 또는 BUILD:FAIL + 에러 요약

### 2. 테스트 검증

```bash
npm test -- --run 2>&1 | tail -30
```

결과: TESTS:X passed / Y failed / Z total

### 3. SESSION_LOG.md에 기록

파일 경로: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`

"Completed Steps"의 마지막 항목 뒤에 추가:

```
N. [HH:MM] /pg-checkpoint BUILD:PASS TESTS:392/0/392
```

실패 시 "Open Issues"에도 추가:

```
- BUILD FAIL: [에러 요약] 또는 TEST FAIL: [실패 테스트명]
```

### 4. 보고

사용자에게 1줄 요약:

- PASS: `✓ BUILD:PASS TESTS:392/0/392`
- FAIL: `✗ BUILD:FAIL [에러]` 또는 `✗ TESTS:390/2/392 [실패 테스트]`

## Rules

- 코드 수정 금지 (검증 + 로그 기록만)
- SESSION_LOG.md는 반드시 업데이트
- vs `/pg-build-check`: build-check은 빠른 확인용 (로그 없음), checkpoint은 게이트용 (로그 기록)
