---
name: pg-test
description: "Vitest 유닛 테스트 작성 또는 기존 테스트 실행"
user-invocable: true
argument-hint: "[module-name] e.g. BoardState, ConveyorState, TurnResolver, all"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# /pg-test — 테스트 작성/실행

## 역할
Programmer로서 유닛 테스트를 작성하거나 실행합니다.

## 절차

### 테스트 실행
```bash
npm test              # 전체 테스트
npm test -- --run     # 워치 모드 없이 1회 실행
```

### 테스트 작성
- `tests/core/` — 기존 테스트 파일 패턴 따르기
- `import { describe, it, expect, beforeEach } from 'vitest'`
- `src/core/` 모듈만 테스트 (순수 TS, Phaser 불필요)
- `tests/setup.ts` — EventBus 리셋 등 공통 설정

### 기존 테스트 파일
- `tests/core/BoardState.test.ts` — 그리드, 매칭, 중력, isEmpty
- `tests/core/ConveyorState.test.ts` — 벨트 포지션, 배치, 순환
- `tests/core/TurnResolver.test.ts` — 오비트, 파괴, 게임오버, 슬링

### 테스트 원칙
- core/ 모듈 테스트 시 Phaser 의존 없음
- `makeSimpleLevel()` 헬퍼로 테스트용 레벨 데이터 생성
- `loadLevel()` → `TurnResolver` 생성 → `deployNextHero()` 패턴
