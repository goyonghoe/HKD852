---
name: art-sprite
description: '프로시저럴 텍스처 생성 — 큐브, 히어로, 아이콘 등 게임 스프라이트'
user-invocable: true
argument-hint: '[sprite-type] e.g. cubes, heroes, icons, buttons, belt'
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

Art Director로서 프로시저럴 픽셀아트 텍스처를 생성합니다.
모든 스프라이트는 런타임에 `Phaser.GameObjects.Graphics`로 그려지며, 외부 이미지 파일 의존을 최소화합니다.
아트 스타일 가이드의 컬러 시스템, 크기 스펙, 베벨/글로우 규격을 엄격히 준수합니다.

## 핵심 참조

- `design/reference/art-style-guide.md` — 컬러 팔레트, 큐브/히어로 스펙, 파티클 표준
- `src/scenes/PreloadScene.ts` — 기존 텍스처 생성 패턴 및 키 네이밍
- `src/config/colors.ts` — 원소 컬러 상수 (hex 리터럴 직접 사용 금지)
- `src/config/balance.ts` — 크기/간격 수치 상수
- `src/utils/TextureFactory.ts` — 텍스처 생성 유틸리티 (없으면 생성)

## 절차

1. `design/reference/art-style-guide.md`를 읽고 요청된 스프라이트 타입의 스펙을 확인한다.
2. `src/config/colors.ts`를 읽고 사용할 원소 컬러 상수를 파악한다.
3. `src/scenes/PreloadScene.ts`를 읽고 기존 텍스처 생성 패턴과 키 네이밍 규칙을 파악한다.
4. `src/utils/TextureFactory.ts`에 스프라이트 생성 메서드를 구현한다:
   - 큐브: 80x80, 8px radius, 2px bevel, 원소 심벌, 아머드 변형
   - 히어로: 64px circle, highlight crescent, glow ring, dot eyes
   - 아이콘: 용도에 맞는 크기, 글래스 배경
   - 버튼: Primary/Secondary/Icon 변형
   - 벨트: 이중 레일, 리벳 도트, 슬롯 글로우
5. `PreloadScene.ts`에서 새 텍스처 생성 호출을 등록한다.
6. `npm run build`로 타입 에러 없이 빌드되는지 확인한다.
7. `npm run dev`로 시각적 결과를 확인할 수 있도록 안내한다.

## 제약

- **수정 가능**: `design/` 폴더, `src/` 폴더 (TextureFactory, PreloadScene, config 등)
- **수정 금지**: `tests/` 폴더의 기존 테스트 로직 변경 금지 (추가는 가능)
- 컬러 hex 리터럴을 코드에 직접 작성하지 않는다 — 반드시 `colors.ts`에서 임포트
- 크기/간격 매직 넘버를 사용하지 않는다 — 반드시 `balance.ts` 또는 상수로 정의
- `pixelArt: true` 설정 유지, 안티앨리어싱 적용 금지
- 블렌드 모드: 파티클만 ADD, 스프라이트는 NORMAL
