---
name: qa-regression
description: '변경 파일 영향도 분석 — 최근 수정이 다른 모듈에 미치는 영향 탐지'
user-invocable: true
argument-hint: '[commit-range] e.g. HEAD~3, HEAD~1, abc123..def456'
allowed-tools: Bash, Read, Glob, Grep
model: sonnet
---

# /qa-regression — 리그레션 영향도 분석

## 역할

QA 에이전트로서 최근 코드 변경이 다른 모듈에 미치는 영향을 분석합니다.

## 절차

### 1. 변경 파일 수집

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/WanChai
git diff --name-only HEAD~3 -- src/ tests/ | head -30
```

인자가 주어지면 해당 범위 사용.

### 2. 변경 함수/클래스 추출

변경된 각 파일에서:
- 수정된 함수명, 클래스명, export 추출
- 타입 정의 변경 여부 확인

### 3. 의존성 역추적

변경된 함수/클래스를 import하거나 호출하는 파일 탐색:

```
Grep: pattern "[변경된 함수/클래스명]" glob "*.ts" path "src/"
```

### 4. 씬 배선 검증 (M-008, M-009)

변경에 새 플래그/모드가 포함된 경우:
- 해당 플래그를 `true`로 설정하는 코드 존재 확인
- `scene.start` / `scene.launch` 호출에서 데이터 전달 확인

```
Grep: pattern "scene\.(start|launch)" glob "*.ts" path "src/scenes/"
```

### 5. 테스트 커버리지 확인

변경된 모듈에 대응하는 테스트 파일 존재 여부:

```
Glob: pattern "tests/**/*.test.ts"
```

- 테스트 없는 변경 모듈 → ⚠️ 경고

### 6. 결과 보고

```
🔄 REGRESSION ANALYSIS
───────────────────────
변경 파일:     N개
영향받는 파일: M개
───────────────────────
🔴 높은 리스크:
  - [파일]: [이유]

🟡 중간 리스크:
  - [파일]: [이유]

🟢 낮은 리스크:
  - [파일]: [이유]

테스트 누락:   X개 모듈
배선 체크:     PASS / ⚠️ 확인 필요
```

## 규칙

- 코드 수정하지 않음 (분석만)
- M-008 (씬 배선 누락), M-009 (유닛테스트 ≠ 통합), M-015 (초기화 순서) 패턴 중점 체크
