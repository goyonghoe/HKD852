---
name: art-review
description: "비주얼 품질 리뷰 — art-style-guide.md 대비 검증"
user-invocable: true
argument-hint: "[scope] e.g. all, preload, puzzle, result"
allowed-tools: Read, Glob, Grep
model: opus
---

## 역할

Art Director로서 비주얼 코드의 품질을 art-style-guide.md 기준으로 검증합니다.
읽기 전용 리뷰이며, 코드를 직접 수정하지 않습니다.
최종 판정은 **PASS** 또는 **REVISE** (수정 필요 사항과 함께)로 내립니다.

## 핵심 참조

- `design/reference/art-style-guide.md` — 비주얼 품질 기준 문서
- `src/scenes/PreloadScene.ts` — 텍스처 생성 코드
- `src/scenes/PuzzleScene.ts` — 게임 플레이 비주얼
- `src/scenes/ResultScene.ts` — 결과 화면 비주얼
- `src/utils/TextureFactory.ts` — 스프라이트 생성
- `src/managers/ParticlePool.ts` — 파티클 관리
- `src/managers/VFXManager.ts` — VFX 관리
- `src/config/colors.ts` — 컬러 상수
- `src/config/balance.ts` — 수치 상수

## 절차

1. `design/reference/art-style-guide.md`를 읽고 검증 체크리스트를 수립한다.
2. scope에 따라 해당 파일들을 읽는다:
   - `all`: 전체 src/ 스캔
   - `preload`: PreloadScene.ts + TextureFactory.ts
   - `puzzle`: PuzzleScene.ts + 관련 매니저
   - `result`: ResultScene.ts
3. 다음 항목을 체크한다:

   **컬러 일관성**
   - [ ] 모든 컬러가 colors.ts에서 임포트되는가
   - [ ] 원소 컬러 3단계(base/highlight/shadow) 올바르게 사용되는가
   - [ ] 배경 컬러 #1a1a2e 준수하는가

   **큐브 스펙**
   - [ ] 80x80 크기 준수하는가
   - [ ] 8px corner radius 준수하는가
   - [ ] 2px inner bevel 구현되어 있는가
   - [ ] 아머드 큐브 메탈릭 보더 구현되어 있는가

   **히어로 스펙**
   - [ ] 64px circle 크기 준수하는가
   - [ ] highlight crescent 구현되어 있는가
   - [ ] glow ring 구현되어 있는가
   - [ ] dot eyes 구현되어 있는가

   **파티클 표준**
   - [ ] 오브젝트 풀 200 준수하는가
   - [ ] ADD 블렌드 모드 사용하는가
   - [ ] 이펙트별 파티클 수 범위 준수하는가

   **애니메이션 타이밍**
   - [ ] destroy 200ms 준수하는가
   - [ ] gravity 150ms 준수하는가
   - [ ] match flash 100ms 준수하는가

   **벨트 비주얼**
   - [ ] 이중 평행 레일 구현되어 있는가
   - [ ] 리벳 도트 구현되어 있는가
   - [ ] 액티브 슬롯 글로우 구현되어 있는가

4. 각 항목을 PASS / REVISE로 판정하고, REVISE인 경우 구체적 수정 사항을 명시한다.
5. 전체 판정을 내린다:
   - **PASS**: 모든 항목 통과
   - **REVISE**: 1개 이상 수정 필요 (수정 사항 목록 첨부)

## 제약

- **읽기 전용**: 어떤 파일도 수정하지 않음 (Read, Glob, Grep만 사용)
- 판정은 반드시 PASS 또는 REVISE로 내림 (애매한 표현 금지)
- REVISE 판정 시 반드시 파일 경로, 라인 번호, 현재 상태, 기대 상태를 명시
- art-style-guide.md에 명시되지 않은 항목은 리뷰 대상에서 제외
- 주관적 미적 판단은 하지 않음 — 가이드 대비 객관적 검증만 수행
