---
name: ui-review
description: 'UI/UX 품질 리뷰 — ui-ux-guideline.md 대비 검증'
user-invocable: true
argument-hint: '[scope] e.g. all, puzzle-hud, result, menu'
allowed-tools: Read, Glob, Grep
model: opus
---

## 역할

UI Designer로서 UI/UX 코드의 품질을 ui-ux-guideline.md 기준으로 검증합니다.
읽기 전용 리뷰이며, 코드를 직접 수정하지 않습니다.
최종 판정은 **PASS** 또는 **REVISE** (수정 필요 사항과 함께)로 내립니다.

## 핵심 참조

- `design/reference/ui-ux-guideline.md` — UI/UX 품질 기준 문서
- `design/reference/art-style-guide.md` — 글래스 상수, 컬러 팔레트
- `src/ui/*.ts` — UI 컴포넌트
- `src/scenes/*.ts` — 씬별 UI 구현
- `src/config/colors.ts` — 컬러 상수
- `src/config/balance.ts` — 수치 상수

## 절차

1. `design/reference/ui-ux-guideline.md`를 읽고 검증 체크리스트를 수립한다.
2. scope에 따라 해당 파일들을 읽는다:
   - `all`: 전체 src/ui/ + src/scenes/ 스캔
   - `puzzle-hud`: PuzzleScene의 HUD 관련 코드
   - `result`: ResultScene UI
   - `menu`: StageSelectScene UI
3. 다음 항목을 체크한다:

   **글래스모피즘**
   - [ ] 패널 alpha가 0.15~0.40 범위 내인가
   - [ ] 테두리 1px, alpha 0.3, #4a6fa5 준수하는가
   - [ ] 코너 라디우스 12~24px 범위 내인가

   **타이포그래피**
   - [ ] Title 48px, Heading 32px, Body 22px, Caption 14px, Score 42px 준수하는가
   - [ ] 스코어/숫자에 monospace 폰트 사용하는가
   - [ ] 텍스트 대비 비율 4.5:1 이상인가

   **터치 인터랙션**
   - [ ] 모든 터치 타겟이 48x48dp 이상인가
   - [ ] Primary 액션이 하단 1/3에 위치하는가
   - [ ] Tap 피드백 scale 0.95, 80ms 구현되어 있는가
   - [ ] 인접 타겟 간격 최소 8dp 확보되어 있는가

   **HUD 레이아웃 (720x1280)**
   - [ ] 상단 바에 Score(우), Combo(좌), Progress(중앙) 배치되어 있는가
   - [ ] Safe area (상하 40px) 확보되어 있는가
   - [ ] 히어로 큐가 하단에 배치되어 있는가

   **스코어 카운터**
   - [ ] 800~1500ms 롤링 애니메이션 구현되어 있는가
   - [ ] Power2 이징 사용하는가
   - [ ] 1.15x scale pop 구현되어 있는가

   **별 연출**
   - [ ] 300ms 시퀀셜 딜레이 구현되어 있는가
   - [ ] 0→1.2→1.0 스케일 Back.easeOut 구현되어 있는가
   - [ ] 파티클 버스트 동반하는가

   **버튼 스타일**
   - [ ] Primary(accent #e94560), Secondary(glass+border) 구분되어 있는가
   - [ ] Hover 1.05x, Press 0.95x 구현되어 있는가
   - [ ] Disabled 상태(alpha 0.4) 처리되어 있는가

   **레벨 셀렉트**
   - [ ] 벤토 그리드 구조인가 (140x140, 16px gap, 16px radius)
   - [ ] Locked/Available/Completed/Current 상태 구분되어 있는가

   **반응형**
   - [ ] Phaser.Scale.FIT + CENTER_BOTH 설정되어 있는가
   - [ ] 720x1280 기준 비율 좌표 사용하는가

4. 각 항목을 PASS / REVISE로 판정하고, REVISE인 경우 구체적 수정 사항을 명시한다.
5. 전체 판정을 내린다:
   - **PASS**: 모든 항목 통과
   - **REVISE**: 1개 이상 수정 필요 (수정 사항 목록 첨부)

## 제약

- **읽기 전용**: 어떤 파일도 수정하지 않음 (Read, Glob, Grep만 사용)
- 판정은 반드시 PASS 또는 REVISE로 내림 (애매한 표현 금지)
- REVISE 판정 시 반드시 파일 경로, 라인 번호, 현재 상태, 기대 상태를 명시
- ui-ux-guideline.md에 명시되지 않은 항목은 리뷰 대상에서 제외
- 주관적 미적 판단은 하지 않음 — 가이드 대비 객관적 검증만 수행
- 게임 메카닉이나 밸런스에 대한 판단은 범위 밖
