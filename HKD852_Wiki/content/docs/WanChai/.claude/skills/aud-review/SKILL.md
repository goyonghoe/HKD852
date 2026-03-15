---
name: aud-review
description: '오디오 일관성 리뷰 — BGM/SFX 커버리지, 볼륨 밸런스, 피드백 계층 감사'
user-invocable: true
argument-hint: '[scope] e.g. full, combat, menus, feedback'
allowed-tools: Read, Glob, Grep
model: sonnet
---

## 역할

Audio Designer로서 게임 전체의 오디오 상태를 감사합니다.
모든 게임 이벤트에 적절한 청각 피드백이 있는지, 볼륨 밸런스가 적절한지 확인합니다.

## 핵심 참조

- `src/audio/RetroAudio.ts` — BGM 시스템
- `src/audio/RetroSFX.ts` — SFX 시스템
- `design/reference/about-face-ux-principles.md` — 피드백 계층 (원칙 7)
- 전체 `src/scenes/*.ts` — 씬별 오디오 호출 현황

## 감사 체크리스트

### BGM 커버리지

- [ ] MainMenuScene — BGM 존재 여부
- [ ] RunScene (전투) — BGM 존재 + 강도 변화
- [ ] Boss 등장 — BGM 전환 또는 강화
- [ ] GameOverScene — BGM 전환
- [ ] MetaScene — BGM 존재 여부
- [ ] 도감/월드맵 — 배경 오디오

### SFX 커버리지

- [ ] 모든 적 처치에 SFX
- [ ] 보스 등장/사망 특별 SFX
- [ ] 레벨업 SFX
- [ ] 무기 발사 SFX (타입별 구분)
- [ ] 버튼 탭/호버 SFX
- [ ] XP/골드 획득 SFX
- [ ] 보스 경고 SFX
- [ ] 기지 피격 SFX

### 볼륨 밸런스

- [ ] BGM gain vs SFX gain 비율 확인
- [ ] 보스전 볼륨 에스컬레이션 확인
- [ ] 연쇄 SFX 시 클리핑 없음

## 절차

1. `src/audio/` 파일들을 읽고 현재 오디오 기능 목록을 작성한다
2. `grep`으로 전 씬에서 오디오 호출 지점을 찾는다
3. 체크리스트 대비 누락 항목을 식별한다
4. 등급 판정: A(완벽) ~ F(부재)
5. `design/audio/audio-review.md`에 감사 결과를 기록한다

## 산출물

- `design/audio/audio-review.md` — 감사 결과 + 개선 우선순위
