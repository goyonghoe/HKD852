---
name: pg-wiring-check
description: "씬 전환 배선 검증 — Gate 5 자동화"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# /pg-wiring-check — 씬 전환 배선 검증

## 역할
Programmer로서 씬 전환 배선을 자동으로 검증합니다. 핸드오프 파이프라인 Gate 5 (Step 6)입니다.

## 언제 사용하나요?
- `/pg-build-check` 통과 후 배포 전
- 새 씬을 추가하거나 씬 전환 로직을 변경한 경우
- `/pg-deploy` 실행 전 필수 선행 단계

## 절차

### 1. 씬 전환 호출 수집
```bash
# scene.start / scene.launch / scene.switch 모든 호출 검색
grep -rn "scene\.start\|scene\.launch\|scene\.switch" src/ --include="*.ts"
```

### 2. 각 전환별 페이로드 검증
수집된 각 전환에 대해:
- 호출부: `this.scene.start('SceneName', { key: value })` 형태 확인
- 대상 씬의 `init(data)` 파라미터 타입 확인
- 전달 데이터 키가 `init()` 내부에서 실제로 사용되는지 확인

```bash
# 특정 씬의 init() 시그니처 확인
grep -n "init(" src/scenes/*.ts
```

### 3. 신규 boolean 플래그 검증
- 최근 추가된 boolean 플래그 탐색
```bash
grep -rn "boolean\s*=" src/core/ src/scenes/ --include="*.ts" | grep -v "test"
```
- 각 플래그가 `true`로 설정되는 코드 경로 존재 여부 확인
- 초기값만 있고 `true` 설정 없는 경우 → WIRING:FAIL

### 4. 신규 클래스 인스턴스화 검증
- 최근 추가된 클래스 탐색
```bash
grep -rn "^export class\|^class " src/core/ src/scenes/ --include="*.ts"
```
- 각 클래스가 씬 또는 다른 클래스에서 `new ClassName()` 형태로 사용되는지 확인
- 정의만 있고 인스턴스화 없는 경우 → 미연결 경고

### 5. 씬 등록 확인
```bash
# game-config.ts에 등록된 씬 목록
grep -n "scene\|Scene" src/config/game-config.ts
```
- `src/scenes/` 내 모든 씬 파일이 `game-config.ts`에 등록되었는지 확인
- 등록 누락된 씬 → WIRING:FAIL

### 6. 결과 출력

#### PASS 케이스
```
WIRING:PASS
- 검증된 전환 수: N
- 검증된 페이로드: N
- 모든 씬 등록 확인
```

#### FAIL 케이스
```
WIRING:FAIL(broken paths)
- [FAIL] SceneA → SceneB: 페이로드 키 'level' 없음 (init()에서 요구)
- [FAIL] feature-flag: 'isNewMode' 플래그가 어디서도 true로 설정되지 않음
- [WARN] MyNewClass: 정의됨, 인스턴스화 없음
```

### 7. FAIL 시 처리
- WIRING:FAIL 발생 시 `/pg-deploy` 진행 불가
- 깨진 경로 목록을 바탕으로 `/pg-implement` 루프백
- 수정 후 `/pg-build-check` → `/pg-wiring-check` 재실행

## 규칙
- WIRING:PASS 없이 `/pg-deploy` 실행 금지
- 경고(WARN)는 배포 차단 안 함, 실패(FAIL)는 차단
- 결과를 SESSION_LOG.md에 기록:
  `[HH:MM] /pg-wiring-check WIRING:PASS (N transitions verified)`
  파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`
