---
name: ui-animate
description: "스코어 카운터 롤, 별 연출, 장면 전환, 스프링 애니메이션"
user-invocable: true
argument-hint: "[animation-type] e.g. score-roll, star-reveal, scene-transition"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

UI Designer로서 UI 애니메이션을 구현합니다.
스코어 카운터 롤업, 별 시퀀셜 등장, 장면 전환 효과, 스프링 기반 반응 애니메이션 등
게임의 시각적 완성도를 높이는 모션 디자인을 담당합니다.
모든 타이밍과 이징은 ui-ux-guideline.md 명시 값을 엄격히 준수합니다.

## 핵심 참조

- `design/reference/ui-ux-guideline.md` — 스코어 카운터(6절), 별 연출(7절), 장면 전환(11절)
- `design/reference/art-style-guide.md` — 애니메이션 타이밍(7절)
- `src/scenes/*.ts` — 애니메이션이 적용되는 씬
- `src/ui/*.ts` — 애니메이션 대상 UI 컴포넌트
- `src/config/colors.ts` — 파티클/글로우 컬러

## 절차

1. `design/reference/ui-ux-guideline.md`에서 요청된 애니메이션의 정확한 스펙을 읽는다.
2. 해당 씬/컴포넌트의 현재 구현 상태를 파악한다.
3. 요청된 애니메이션 타입을 구현한다:

   **score-roll**:
   - `tweens.addCounter()` 사용
   - 지속 시간: 800~1500ms (점수 차이에 비례)
   - 이징: Power2.easeOut
   - 완료 시 scale pop: 1.15x → 1.0x (Back.easeOut, 200ms)
   - monospace 폰트, `toLocaleString()` 포맷

   **star-reveal**:
   - 시퀀셜 등장: 별 간 300ms 딜레이
   - scale: 0 → 1.2 → 1.0
   - 이징: Back.easeOut
   - 각 별 등장 시 파티클 버스트 (8~12개)

   **scene-transition**:
   - 메뉴→레벨 셀렉트: Slide Left 400ms
   - 레벨 셀렉트→퍼즐: Fade Black 500ms
   - 퍼즐→결과: Scale Up + Fade 400ms
   - 결과→레벨 셀렉트: Slide Right 400ms
   - 공통 이징: Power2.easeInOut

   **spring**: 범용 스프링 애니메이션 (Back.easeOut 기반)

4. 애니메이션 유틸리티를 `src/ui/AnimationHelper.ts` 등에 추출하여 재사용성을 높인다.
5. `npm run build`로 빌드 확인 후 `npm run dev`로 모션 체감 확인 안내.

## 제약

- **수정 가능**: `design/` 폴더, `src/ui/` 폴더, `src/scenes/` 폴더 (애니메이션 관련 부분)
- **수정 금지**: `src/core/` 게임 로직, `tests/` 기존 테스트 변경
- 타이밍 값은 ui-ux-guideline.md / art-style-guide.md 명시 값 준수
- 이징 함수: Phaser 내장 이징만 사용 (Power2, Back, Bounce, Linear 등)
- 트윈 체이닝 시 onComplete 콜백으로 순차 실행 보장
- 동일 타겟에 중복 트윈 방지 — 기존 트윈 완료 후 새 트윈 시작
- 장면 전환 시 이전 씬의 리소스 정리 (메모리 누수 방지)
