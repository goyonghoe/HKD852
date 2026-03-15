---
name: pg-build-check
description: '빌드 + 테스트 원커맨드 검증 — 변경 후 빠른 확인용'
user-invocable: true
allowed-tools: Bash, Glob, Read
model: haiku
---

# /pg-build-check — 빌드 + 테스트 검증

## 역할

Programmer로서 현재 코드베이스의 빌드/테스트 상태를 빠르게 검증합니다.

## 절차

### 1. 빌드 검증

```bash
npm run build 2>&1 | tail -20
```

- 빌드 성공/실패 판정
- 에러 시: 에러 메시지 + 관련 파일 특정

### 2. 테스트 실행

```bash
npm test -- --run 2>&1 | tail -30
```

- 전체 테스트 수 / 통과 / 실패 보고
- 실패 시: 실패 테스트명 + 에러 메시지

### 3. 결과 요약

```
BUILD: PASS/FAIL
TESTS: X passed / Y failed / Z total
```

- 실패 항목이 있으면 원인과 수정 제안 포함
- 모두 통과하면 1줄 요약만

## 규칙

- 코드 수정하지 않음 (검증만)
- 10초 이내 완료 목표
