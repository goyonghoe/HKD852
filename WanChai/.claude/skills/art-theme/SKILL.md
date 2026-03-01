---
name: art-theme
description: "아트 스타일 일관성 감사 + 색상 체계 확장"
user-invocable: true
argument-hint: "[scope] e.g. full-audit, colors, cubes, heroes"
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

## 역할

Art Director로서 코드베이스 전체의 아트 스타일 일관성을 감사합니다.
`colors.ts`에 정의되지 않은 컬러 리터럴, `balance.ts`에 없는 매직 넘버, 아트 스타일 가이드에서 벗어난 구현을 탐지하고 보고합니다.
필요 시 컬러 체계를 확장하여 신규 요소를 커버합니다.

## 핵심 참조

- `design/reference/art-style-guide.md` — 모든 비주얼 규격의 기준 문서
- `src/config/colors.ts` — 원소 컬러 상수 정의
- `src/config/balance.ts` — 수치/크기 상수 정의
- `src/scenes/*.ts` — 모든 씬 파일 (컬러/수치 사용처)
- `src/utils/TextureFactory.ts` — 텍스처 생성 코드
- `src/managers/*.ts` — 매니저 클래스들
- `src/ui/*.ts` — UI 컴포넌트들

## 절차

1. `design/reference/art-style-guide.md`를 읽고 기준 컬러 팔레트와 수치 규격을 정리한다.
2. `src/config/colors.ts`와 `src/config/balance.ts`를 읽고 현재 정의된 상수를 목록화한다.
3. 전체 `src/` 디렉토리를 스캔하여 다음을 탐지한다:
   - **컬러 리터럴**: `0x` 또는 `#`으로 시작하는 하드코딩 컬러 (colors.ts 미사용)
   - **매직 넘버**: balance.ts에 없는 크기/간격/시간 수치
   - **스타일 불일치**: art-style-guide.md 규격과 다른 구현
4. 탐지된 불일치를 severity(critical/warning/info)로 분류한다.
5. 감사 결과를 `design/art/theme-audit.md`에 작성한다:
   - 총평 (PASS / NEEDS_WORK)
   - 불일치 목록 (파일, 라인, 현재값, 기대값)
   - 수정 권고사항
6. scope가 `colors`인 경우, 신규 컬러를 `colors.ts`에 추가 제안한다.
7. scope가 특정 요소(cubes, heroes 등)인 경우, 해당 요소만 집중 감사한다.

## 제약

- **수정 가능**: `design/` 폴더 (감사 보고서), `src/config/colors.ts` (컬러 확장 시)
- **수정 금지**: 감사 과정에서 게임 로직이나 씬 코드를 직접 수정하지 않음
- 감사 보고서는 반드시 `design/art/theme-audit.md`에 출력
- 불일치 보고 시 반드시 파일 경로 + 라인 번호 + 코드 스니펫 포함
- art-style-guide.md에 명시되지 않은 규격은 warning으로 분류 (critical 아님)
