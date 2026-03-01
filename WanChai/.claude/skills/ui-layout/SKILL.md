---
name: ui-layout
description: "화면 레이아웃, 글래스모피즘 패널, 컴포넌트 배치"
user-invocable: true
argument-hint: "[scene-name] e.g. MainMenu, PuzzleUI, Result"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

UI Designer로서 화면 레이아웃과 글래스모피즘 패널을 설계하고 구현합니다.
720x1280 세로 모바일 기준으로 HUD, 메뉴, 결과 화면 등의 컴포넌트를 배치합니다.
모든 터치 타겟은 최소 48x48dp를 보장하며, 주요 액션은 하단 1/3 영역에 배치합니다.

## 핵심 참조

- `design/reference/ui-ux-guideline.md` — 글래스모피즘, 타이포그래피, HUD 레이아웃, 반응형 규격
- `design/reference/art-style-guide.md` — 글래스 상수 (panelAlpha, borderAlpha, borderColor, radius)
- `src/ui/*.ts` — 기존 UI 컴포넌트
- `src/scenes/*.ts` — 씬별 UI 배치
- `src/config/colors.ts` — UI 컬러 상수
- `src/config/balance.ts` — 레이아웃 수치 상수

## 절차

1. `design/reference/ui-ux-guideline.md`를 읽고 해당 씬의 레이아웃 요구사항을 확인한다.
2. `design/reference/art-style-guide.md`의 글래스 상수 섹션을 확인한다.
3. 기존 `src/ui/` 컴포넌트를 읽고 재사용 가능한 요소를 파악한다.
4. 요청된 씬의 레이아웃을 구현한다:
   - **MainMenu**: 타이틀, 플레이 버튼(하단 1/3), 설정 아이콘(우상단)
   - **PuzzleUI**: HUD 상단 바(스코어/콤보/진행바), 게임 영역, 히어로 큐 하단
   - **Result**: 별 연출 영역, 스코어 표시, 다음/재도전 버튼(하단)
   - **LevelSelect**: 벤토 그리드 (140x140 카드, 16px gap, 4열)
5. 글래스 패널 컴포넌트를 구현/활용한다:
   ```
   배경: fillRoundedRect(x, y, w, h, radius) alpha 0.25
   테두리: strokeRoundedRect(x, y, w, h, radius) alpha 0.3
   ```
6. 반응형 좌표 계산을 적용한다 (720x1280 기준 비율).
7. `npm run build`로 타입 에러 확인 후 `npm run dev`로 레이아웃 확인 안내.

## 제약

- **수정 가능**: `design/` 폴더, `src/ui/` 폴더, `src/scenes/` 폴더 (UI 관련 부분)
- **수정 금지**: `src/core/` 게임 로직, `tests/` 기존 테스트 변경
- 터치 타겟 48x48dp 미만 금지
- Primary 액션은 반드시 화면 하단 1/3에 배치
- 글래스 상수는 art-style-guide.md 값 준수 (panelAlpha=0.25, borderAlpha=0.3, radius=16)
- 폰트 크기는 ui-ux-guideline.md 타이포그래피 시스템 준수
- 하드코딩 좌표 최소화 — 기준 해상도 비율 또는 상수 사용
