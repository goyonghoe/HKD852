---
name: pg-implement
description: 'design/ 설계 스펙을 src/ 코드로 구현 + 테스트 작성'
user-invocable: true
argument-hint: '[spec-id-or-name]'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# /pg-implement — 설계 스펙 구현

## 역할

Programmer로서 Game Designer의 설계 스펙을 코드로 구현합니다.

## 절차

### 1. 스펙 로드

- `design/status.json`에서 해당 항목 찾기
- 설계 문서 읽기 (design/specs/ 또는 design/levels/)
- 요구사항(FR, NFR)과 테스트 기준(TC) 확인

### 2. 구현

#### 메카닉 스펙인 경우

- `src/types/` — 필요한 타입 추가/수정
- `src/core/` — 순수 TS 로직 구현 (Phaser 의존 없음)
- `src/config/balance.ts` — 밸런스 상수 추가
- `src/scenes/` — 렌더링 연동 (필요 시)
- `tests/core/` — 유닛 테스트

#### 레벨 스펙인 경우

- 설계 문서의 보드 레이아웃 → JSON 변환
- `src/data/levels/world-X/stage-XXX.json` 생성
- `src/data/levels/index.ts` — 레벨 등록

### 3. 검증

```bash
npm run build    # TypeScript 컴파일 확인
npm test         # 전 테스트 통과 확인
```

### 4. 상태 업데이트

`design/status.json` — `implStatus: "implemented"` 로 변경

### 5. 결과 로그

검증 통과 후 SESSION_LOG.md에 기록:
`[HH:MM] /pg-implement [SPEC-ID] BUILD:PASS TESTS:X/X`
파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`

## 구현 완료 후 다음 단계 (자동 체인)

구현 + 테스트 통과 후, 배포 전에 아래 게이트를 **반드시** 실행하세요:

```
/pg-build-check (Step 5) → /pg-wiring-check (Step 6) → /ux-gate (Step 7) → /pg-deploy (Step 8)
```

- 새 씬/플래그/모드 추가 시: `/pg-wiring-check` 필수
- UI 변경 시: `/ux-gate` 필수
- M-008, M-009, M-012 방지

## 아키텍처 규칙

- `core/` = 순수 TypeScript, Phaser import 금지
- `scenes/` = Phaser 렌더링만
- EventBus로 로직↔렌더링 통신
- 기존 패턴 따르기: BoardState, ConveyorState, TurnResolver 참고
