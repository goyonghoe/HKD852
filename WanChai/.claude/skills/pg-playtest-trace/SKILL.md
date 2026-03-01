---
name: pg-playtest-trace
description: "플레이 경로 코드 트레이스 — 통합 스모크 테스트"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# /pg-playtest-trace — 플레이 경로 트레이스

## 역할
Programmer로서 실제 플레이 시나리오를 코드 경로로 트레이스하여 통합 스모크 테스트를 수행합니다. 핸드오프 파이프라인 Step 9입니다.

## 언제 사용하나요?
- `/pg-deploy` 완료 후 검증 단계
- 새 기능 통합 후 엔드투엔드 흐름 확인
- 씬 전환 흐름이 복잡해졌을 때

## 절차

### 1. 플레이 시나리오 입력
사용자가 시나리오를 제공합니다. 예:
```
"신규 플레이어가 게임을 시작하고, 첫 번째 스테이지를 클리어하고, 결과 화면에서 다음 스테이지로 진행한다"
```

시나리오 미제공 시 기본 시나리오 사용:
- Boot → Preload → MainMenu → Game → Result → MainMenu

### 2. 진입 씬 확인
```
grep -rn "scene.start\|new Phaser.Game\|firstScene\|bootScene" src/config/game-config.ts src/main.ts
```
- 게임 진입점(첫 씬) 확인
- 씬 배열 순서 확인

### 3. 씬별 전환 경로 트레이스
진입 씬부터 시작하여 시나리오에 따라 각 씬을 순서대로 추적:

각 씬에 대해:
```
grep -n "scene.start\|scene.launch\|scene.switch" src/scenes/{SceneName}.ts
```
- 해당 씬에서 다음 씬으로의 전환 조건 확인
- 전환 시 전달되는 데이터 페이로드 기록
- 다음 씬의 `init(data)` 파라미터와 매칭 확인

### 4. 데이터 흐름 검증
각 씬 전환의 데이터 연속성 확인:
- 이전 씬에서 전달한 `score`, `level`, `stars` 등의 값이
- 다음 씬의 `init(data)` 또는 `create()` 에서 올바르게 수신되는지 확인

### 5. 막힌 상태(Stuck State) 탐지
씬 전환 출구가 없는 경우 탐지:
```
grep -rn "scene.start\|scene.launch" src/scenes/{SceneName}.ts
```
- 출구 전환이 0개인 씬 → 막힌 상태 경고
- 단, 최종 씬(예: BootScene)은 예외

조건부 전환이 항상 false가 될 수 있는지 검토:
- 게임오버 후 재시작 경로 존재 여부
- 클리어 후 다음 스테이지 경로 존재 여부

### 6. 트레이스 경로 기록
```
시나리오: [시나리오 설명]

씬 경로:
1. BootScene → PreloadScene (data: none)
2. PreloadScene → MainMenuScene (data: none)
3. MainMenuScene → PuzzleScene (data: { levelId: 'world-1/stage-001' })
4. PuzzleScene → ResultScene (data: { score: ?, stars: ?, levelId: ? })
5. ResultScene → PuzzleScene (data: { levelId: 'world-1/stage-002' }) OR MainMenuScene

데이터 흐름:
- levelId: PuzzleScene.init() ✓ 수신 확인
- score: ResultScene.init() ✓ 수신 확인
- stars: ResultScene.init() ✓ 수신 확인
```

### 7. 결과 출력

#### PASS 케이스
```
PLAYTEST-TRACE:PASS
- 시나리오: [설명]
- 트레이스된 씬: N개
- 모든 데이터 흐름: 정상
- 막힌 상태: 없음
```

#### FAIL 케이스
```
PLAYTEST-TRACE:FAIL(stuck at X)
- [FAIL] ResultScene에서 다음 스테이지 전환 경로 없음 (stuck)
- [FAIL] PuzzleScene → ResultScene 전환 시 'stars' 데이터 미전달
- [WARN] MainMenuScene에 예외 경로(오류 시) 없음
```

### 8. FAIL 시 처리
- PLAYTEST-TRACE:FAIL 발생 시 `/design-status-sync` 진행 전 수정 필요
- 막힌 씬/누락 데이터를 `/pg-implement`로 루프백
- 수정 후 `/pg-wiring-check` → `/ux-gate` → `/pg-deploy` → `/pg-playtest-trace` 재실행

## 규칙
- 코드 정적 분석 기반 (실제 런타임 없음)
- 복잡한 조건 분기는 최악의 경우(worst case) 기준으로 평가
- 결과를 SESSION_LOG.md에 기록:
  `[HH:MM] /pg-playtest-trace PLAYTEST-TRACE:PASS ([scenario name])`
  파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`
