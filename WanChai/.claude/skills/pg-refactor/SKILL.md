---
name: pg-refactor
description: "기존 게임 코드 리팩토링 — 유지보수성, 성능, 확장성"
user-invocable: true
argument-hint: "[target] e.g. TurnResolver, event-system, type-safety"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# /pg-refactor — 코드 리팩토링

## 역할
Programmer로서 기존 코드를 개선합니다.

## 절차

### 1. 대상 분석
- 리팩토링 대상 모듈 전체 읽기
- 해당 모듈에 의존하는 코드 파악 (Grep으로 import 추적)
- 관련 테스트 파일 확인
- 현재 테스트 상태 기록 (통과 수)

### 2. 코드 스멜 점검
- [ ] 함수 200줄 초과 → 분리
- [ ] 파라미터 5개 초과 → 객체화
- [ ] 중복 코드 3회 이상 → 추출
- [ ] any 타입 사용 → 구체 타입으로
- [ ] Phaser import in `core/` → 분리 필요
- [ ] 매직넘버 → `balance.ts`/`colors.ts`로 이동
- [ ] 깊은 중첩 (3단계+) → 조기 반환으로 평탄화

### 3. 리팩토링 패턴
- **Extract Function**: 긴 메서드에서 의미 단위 분리
- **Move to Core**: scene에 있는 게임 로직을 core/로 이동
- **Type Narrowing**: union type에 type guard 추가
- **Replace Conditional**: 반복 분기를 Map/Strategy로 전환

### 4. 아키텍처 규칙
- `src/core/` = 순수 TypeScript (Phaser import 금지)
- `src/scenes/` = 렌더링 전용 (게임 로직 금지)
- core ↔ scene 통신: EventBus 패턴
- 밸런스 상수: `src/config/balance.ts` 집중
- 색상: `src/config/colors.ts` 집중

### 5. 검증
```bash
npm run build    # 컴파일 확인
npm test -- --run  # 리그레션 없음 확인
```
- 테스트 수 변경 없어야 함 (리팩토링 = 동작 보존)
- 빌드 에러 0건

### 6. 결과 로그
검증 통과 후 SESSION_LOG.md에 기록:
`[HH:MM] /pg-refactor [target] BUILD:PASS TESTS:X/X (변화 없음)`
파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`

## 규칙
- 테스트를 리팩토링 전후 반드시 실행
- 타입 시그니처 변경 시 모든 호출처 업데이트
- 새 추상화는 최소한으로 — 3번 이상 반복될 때만
- 기능 추가/변경 금지 (동작 보존만)
