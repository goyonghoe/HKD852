---
name: gd-ux
description: "화면 플로우, 온보딩, UI 개선 등 UX 설계"
user-invocable: true
argument-hint: "[flow-name] e.g. onboarding, world-select, settings"
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# /gd-ux — UX 플로우 설계

## 역할
Game Designer로서 게임 화면 플로우와 UI/UX를 설계합니다.

## 절차

### 1. 현행 씬 구조 파악
- `src/scenes/` — 현재 씬 목록 (Glob으로 확인)
- `src/config/game-config.ts` — 씬 등록 순서
- `design/status.json` — scenes 섹션의 현재 구현 상태

### 현재 씬 플로우
```
PreloadScene → PartySelectScene → RunMapScene → PuzzleScene
                                             → RewardScene → RunMapScene / RunResultScene
```

### 2. UX 설계
- 화면 전환 플로우 다이어그램 (ASCII)
- 각 화면의 요소와 인터랙션 포인트
- 상태 전환 (조건 → 목적지 씬)
- 게임오버/승리 조건에 따른 분기

### 모바일 터치 체크리스트
- [ ] 터치 영역 최소 48x48px (9:16 세로 기준)
- [ ] 엄지 도달 범위: 주요 버튼은 하단 60% 영역
- [ ] 스와이프 vs 탭 혼동 방지
- [ ] 로딩/전환 시 입력 잠금 (연타 방지)
- [ ] 뒤로가기 제스처 또는 버튼 항상 제공

### 시각화 원칙 (数値百宝书 §10)
- **리듬감**: 쉬운/어려운 구간 교차가 시각적으로 체감
- **의식감**: 클리어/별 달성 시 시각적 보상
- **몰입 (Flow)**: 난이도가 플레이어 실력과 맞물림

### UI/UX 가이드라인 참조
- `design/reference/ui-ux-guideline.md` 필독
- 색상: `src/config/colors.ts` 기준
- 해상도: 720x1280 (9:16), 세이프 영역 상단 60px / 하단 80px

### 3. 산출물
`design/ux/{flow-name}.md`
- 필수: ASCII 플로우 다이어그램, 화면별 요소 목록, 터치 체크리스트
- 선택: 와이어프레임 (ASCII 또는 설명)

## 제약
- `src/`, `tests/`, `package.json` 수정 금지
- `design/` 폴더만 수정
