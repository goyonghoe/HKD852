---
name: ui-polish
description: '마이크로인터랙션, 터치 피드백, 버튼 상태 처리'
user-invocable: true
argument-hint: '[target] e.g. buttons, touch-feedback, hover-states'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

UI Designer로서 마이크로인터랙션과 터치 피드백을 구현하여 UI 체감 품질을 높입니다.
버튼 상태(normal/hover/press/disabled), 터치 반응(scale/alpha), 포커스 이펙트 등
사용자 입력에 대한 즉각적이고 자연스러운 시각 피드백을 제공합니다.

## 핵심 참조

- `design/reference/ui-ux-guideline.md` — 터치 인터랙션 (3.3절), 버튼 스타일 (8절)
- `design/reference/art-style-guide.md` — 글래스 상수, 컬러 팔레트
- `src/ui/*.ts` — 기존 UI 컴포넌트 (버튼, 패널 등)
- `src/scenes/*.ts` — 인터랙션이 발생하는 씬
- `src/config/colors.ts` — UI 컬러 상수

## 절차

1. `design/reference/ui-ux-guideline.md`의 터치 인터랙션(3.3절)과 버튼 스타일(8절)을 읽는다.
2. 기존 `src/ui/` 컴포넌트의 인터랙션 구현 상태를 파악한다.
3. 요청된 타겟에 맞는 마이크로인터랙션을 구현한다:

   **buttons**:
   - Primary: hover scale 1.05x + brightness +10%, press scale 0.95x + brightness -10%
   - Secondary: hover scale 1.05x + border alpha 0.5, press scale 0.95x
   - Icon: press scale 0.90x + alpha 0.7
   - Disabled: alpha 0.4, 인터랙션 비활성화

   **touch-feedback**:
   - Tap: scale 0.95 + alpha 0.8, 80ms duration
   - Long Press: scale 0.98, 200ms
   - Release: spring back 1.0, 120ms

   **hover-states**:
   - 포인터 진입 시 scale 1.05x (150ms ease)
   - 포인터 이탈 시 scale 1.0x (100ms ease)

4. Phaser의 `setInteractive()`, `on('pointerover')`, `on('pointerdown')` 등을 활용한다.
5. 공통 인터랙션 헬퍼를 `src/ui/InteractionHelper.ts` 등에 추출하여 재사용성을 높인다.
6. `npm run build`로 빌드 확인 후 `npm run dev`로 인터랙션 체감 확인 안내.

## 제약

- **수정 가능**: `design/` 폴더, `src/ui/` 폴더, `src/scenes/` 폴더 (인터랙션 관련 부분)
- **수정 금지**: `src/core/` 게임 로직, `tests/` 기존 테스트 변경
- 터치 피드백 타이밍은 ui-ux-guideline.md 명시 값 준수
- 버튼 스타일은 Primary/Secondary/Icon 3종 일관되게 적용
- Disabled 상태에서 이벤트 핸들러 비활성화 필수
- 트윈 중복 방지 — 동일 타겟에 중복 트윈 추가하지 않음
- 모든 인터랙티브 요소는 최소 48x48dp 터치 영역 보장
