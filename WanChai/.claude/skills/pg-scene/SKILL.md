---
name: pg-scene
description: "Phaser 씬 생성 또는 수정 — 렌더링, 인터랙션, 애니메이션"
user-invocable: true
argument-hint: "[scene-name] e.g. WorldSelectScene, SettingsScene"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# /pg-scene — Phaser 씬 생성/수정

## 역할
Programmer로서 Phaser 씬을 만들거나 수정합니다.

## 절차

### 1. 기존 씬 패턴 파악
- `src/scenes/PuzzleScene.ts` — 메인 게임 씬 (레이아웃, 애니메이션 패턴)
- `src/scenes/PuzzleUIScene.ts` — 투명 HUD 오버레이 패턴
- `src/scenes/ResultScene.ts` — 결과 화면 패턴
- `src/config/game-config.ts` — 씬 등록

### 2. 씬 구현
- 720x1280 (9:16 모바일 세로) 기준 레이아웃
- `EventBus`로 core/ 로직과 통신
- `src/config/colors.ts` — ELEMENT_COLORS, UI_COLORS 사용
- `src/config/balance.ts` — VISUAL 상수 사용
- depth 레이어 규칙: 배경(0~50), 보드(100~200), 큐브(200), 벨트(300~350), 히어로(400~450), UI(600)

### 3. 등록
- 새 씬은 `src/config/game-config.ts`의 `scene` 배열에 추가
- 씬 전환: `this.scene.start('SceneName', data)` 패턴

### 4. 검증
```bash
npm run build    # 컴파일 확인
npm run dev      # 브라우저에서 시각 확인
```
