---
name: aud-sfx
description: "프로시저럴 SFX 생성 — 게임 이벤트별 사운드 이펙트"
user-invocable: true
argument-hint: "[event] e.g. enemy-death, boss-warning, level-up, button-tap, weapon-fire"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

## 역할

Audio Designer로서 게임 이벤트에 대응하는 프로시저럴 SFX를 생성합니다.
모든 이펙트는 Web Audio API의 OscillatorNode + GainNode로 구현합니다.

## 핵심 참조

- `src/audio/RetroSFX.ts` — 현재 SFX 시스템 (기존 패턴 확인)
- `design/reference/about-face-ux-principles.md` — 피드백 계층 (원칙 7)
- `src/config/weapons.ts` — 무기별 차별화 필요

## SFX 카테고리

| 카테고리 | 이벤트 | 특성 |
|---------|--------|------|
| **전투** | 적 처치, 보스 처치, 피격, 무기 발사 | 임팩트, 빠른 어택 |
| **진행** | 레벨업, 스테이지 클리어, 신기록 | 상승 아르페지오, 밝은 톤 |
| **경고** | 보스 등장, 기지 피격, HP 낮음 | 하강 톤, 긴박감 |
| **UI** | 버튼 탭, 메뉴 이동, 구매 확인 | 짧은 클릭, 밝은 톤 |
| **보상** | XP 획득, 골드 획득, 무기 획득 | 밝은 징글, 코인 소리 |

## 절차

1. `src/audio/RetroSFX.ts`를 읽고 기존 SFX 패턴을 파악한다
2. 요청된 이벤트에 맞는 SFX를 설계한다:
   - 주파수 범위 (저역=위협, 고역=보상)
   - 파형 (square=임팩트, sine=부드러움, noise=파괴)
   - 지속시간 (UI: 30-50ms, 전투: 60-100ms, 연출: 200-500ms)
   - 엔벨로프 (attack, sustain, release)
3. `RetroSFX` 클래스에 메서드를 추가한다
4. 해당 이벤트 발생 시점 코드에서 SFX 호출을 배선한다
5. `npm run build`로 빌드 검증

## 설계 원칙

- **즉각성**: 모든 SFX는 이벤트 발생 후 16ms 이내 재생
- **변별력**: 같은 카테고리 내에서도 이벤트별로 구분 가능해야 함
- **비침투성**: SFX가 BGM을 가리지 않을 것 (gain 0.15-0.25 범위)
- **무기 개성**: 각 무기 타입별 고유 발사음 (탄환≠레이저≠궤도)

## 제약

- **수정 가능**: `src/audio/`, `src/scenes/`, `design/audio/`
- Fire-and-forget 패턴: OscillatorNode → GainNode → masterGain, onended에서 disconnect
- 동시 재생 SFX 제한 고려 (폭발 연쇄 시 과부하 방지)
