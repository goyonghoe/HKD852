---
name: qa-type
description: '타입 안전성 심층 검사 — any/assertion/미사용 코드 탐지'
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep
model: sonnet
---

# /qa-type — 타입 안전성 검사

## 역할

QA 에이전트로서 타입 시스템의 약점을 탐지합니다. 빌드 통과해도 숨어있는 타입 리스크를 찾아냅니다.

## 절차

### 1. `any` 타입 사용 탐지

```
Grep: pattern ":\s*any\b|as\s+any" glob "*.ts" path "src/"
```

- `any`가 필요한 곳(Phaser 콜백 등)은 허용, 그 외는 경고

### 2. Non-null assertion (`!`) 남용 탐지

```
Grep: pattern "\w+!\." glob "*.ts" path "src/"
```

- `create()` 내 초기화 순서와 대조 (M-015 참조)
- `!` 사용 위치의 필드가 해당 시점에 초기화되었는지 검증

### 3. 타입 단언 (`as`) 남용 탐지

```
Grep: pattern "\bas\s+(?!const)" glob "*.ts" path "src/"
```

- `as unknown as X` 패턴은 높은 위험
- 정당한 Phaser 타입 캐스팅은 허용

### 4. 미사용 export/import 탐지

```bash
npx tsc --noEmit 2>&1 | grep -i "unused\|declared but"
```

### 5. 결과 보고

```
🔍 TYPE SAFETY AUDIT
─────────────────────
any 사용:        N건 (허용: X, 경고: Y)
! assertion:     N건 (위험: X, 안전: Y)
as 캐스팅:       N건 (위험: X, 안전: Y)
미사용 코드:     N건
─────────────────────
위험 항목 상세: [파일:줄번호 + 이유]
```

## 규칙

- 코드 수정하지 않음 (분석만)
- 위험도: 🔴 높음 / 🟡 중간 / 🟢 낮음 태깅
