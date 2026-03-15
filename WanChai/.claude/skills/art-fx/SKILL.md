---
name: art-fx
description: '파티클 이펙트 + 비주얼 쥬스 — 파괴, 콤보, 축하, 스크린 셰이크'
user-invocable: true
argument-hint: '[effect-type] e.g. match-destroy, combo-burst, celebration, screen-shake'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

Art Director로서 파티클 이펙트와 비주얼 쥬스(화면 흔들림, 플래시 등)를 구현합니다.
모든 파티클은 오브젝트 풀(200개)에서 관리되며, ADD 블렌드 모드로 렌더링됩니다.
게임 이벤트(매칭, 콤보, 클리어)에 반응하여 적절한 시각 피드백을 제공합니다.

## 핵심 참조

- `design/reference/art-style-guide.md` — 파티클 표준 (풀 크기, 이펙트별 수량, 수명, 블렌드 모드)
- `src/scenes/PuzzleScene.ts` — 게임 이벤트 훅 (매칭, 파괴, 콤보 등)
- `src/managers/ParticlePool.ts` — 파티클 오브젝트 풀 관리 (없으면 생성)
- `src/managers/VFXManager.ts` — VFX 총괄 관리자 (없으면 생성)
- `src/core/EventBus.ts` — 로직↔렌더링 이벤트 통신
- `src/config/colors.ts` — 원소 컬러 상수

## 절차

1. `design/reference/art-style-guide.md`의 파티클 표준 섹션을 읽는다.
2. `src/core/EventBus.ts`의 이벤트 타입을 확인하여 연결 지점을 파악한다.
3. `src/scenes/PuzzleScene.ts`의 기존 이벤트 핸들러 구조를 파악한다.
4. 요청된 이펙트 타입을 구현한다:
   - **match-destroy**: 큐브 파괴 시 원소 컬러 파편 8~15개, 300ms 수명
   - **combo-burst**: 콤보 달성 시 방사형 폭발 15~25개, 400ms 수명
   - **celebration**: 레벨 클리어 시 화면 전체 30~50개, 800ms 수명
   - **screen-shake**: 카메라 셰이크 — 강도/지속시간 파라미터화
5. `ParticlePool.ts`에서 오브젝트 풀링을 구현/확장한다 (풀 크기 200).
6. `VFXManager.ts`에서 이펙트 트리거 API를 노출한다.
7. EventBus 이벤트에 VFXManager를 연결한다.
8. `npm run build`로 빌드 확인 후 `npm run dev`로 시각 확인 안내.

## 제약

- **수정 가능**: `design/` 폴더, `src/` 폴더 (managers, scenes, config 등)
- **수정 금지**: `src/core/` 순수 로직의 게임 메카닉 변경 금지
- 파티클 블렌드 모드: 반드시 `Phaser.BlendModes.ADD`
- 오브젝트 풀 크기 200 초과 금지 (성능 보장)
- 컬러는 반드시 `colors.ts`에서 임포트
- 애니메이션 타이밍은 `art-style-guide.md` 명시 값 준수
- EventBus를 통한 느슨한 결합 유지 — 직접 씬 참조 금지
