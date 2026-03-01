---
name: bal-build-analysis
description: "빌드 경로 분석 — 무기+패시브 조합 최적화, 지배 전략, 함정 빌드, 깨진 상호작용 탐지"
user-invocable: true
argument-hint: "[--focus weapon_id|passive_id|synergy]"
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-build-analysis — 빌드 경로 분석

## 역할
무기+패시브 업그레이드 조합을 분석하여 최적 빌드, 지배 전략, 함정 빌드, 깨진 상호작용을 탐지합니다.

## 핵심 참조
- `src/config/weapons.ts` — WEAPON_DEFS (8 weapons)
- `src/config/upgrades.ts` — PASSIVE_DEFS (7 passives)
- `src/core/MetaProgression.ts` — META_UPGRADES
- `src/config/balance.ts` — COMBAT, PLAYER 상수
- `src/core/DamageCalc.ts` — 데미지 공식
- `design/reference/numerical-bible.md` — 대항 속성 원칙 (§8)

## 절차

### 1. 무기 시너지 매트릭스 (8×8)
모든 2무기 조합(28쌍)에 대해:
- 합산 DPS
- 커버리지 (단일타겟/AOE/원거리/근거리)
- 약점 (특정 적 타입 대응 불가?)

평가 기준:
- **S**: DPS + 커버리지 모두 우수
- **A**: 하나가 우수, 하나 양호
- **B**: 양호
- **C**: 겹치거나 약점 존재

### 2. 패시브 우선순위 (무기별)
각 무기에 대해 패시브 1레벨 투자 시 DPS 증가:

```
damage lv1:       +15% → baseDPS × 0.15
attack_speed lv1: +10% → baseDPS × 0.10
crit_chance lv1:  +5% × (critMult-1) → baseDPS × 0.05
crit_damage lv1:  +25% × critChance → baseDPS × 0.25 × currentCritRate
move_speed lv1:   생존성 (DPS 직접 증가 아님)
base_armor lv1:   -10% 기지 피해 (방어적)
hp_regen lv1:     +20 HP/s (방어적)
```

→ 무기별 패시브 랭킹 테이블 (공격 vs 방어)

### 3. 빌드 아키타입 분석

**글래스캐논**: damage + crit_chance + crit_damage + laser_beam + energy_shot
- 장점: 최대 DPS
- 약점: 기지 방어 없음, 다수 적 대응 약

**탱크**: base_armor + hp_regen + orbit_guard + aura_field
- 장점: 기지 생존
- 약점: 후반 DPS 부족 → 적 누적

**스피드**: attack_speed + shotgun + lightning + move_speed
- 장점: 다수 적 빠르게 처리
- 약점: 보스/탱크 적 처치 느림

각 아키타입의 시간대별 DPS vs 기지 생존 예측

### 4. 깨진 상호작용 탐지

체크리스트:
- [ ] base_armor lv5(50%) + hp_regen lv3(60/s) → 기지 무적 구간 존재?
  - 적 피해 = baseDamage × damageScale × 0.5
  - hp_regen = 60/s
  - 기지 무적 조건: 적피해/s < 60 → 언제까지?
- [ ] crit_chance 상한 없음?
  - 패시브 5lv(25%) + 메타 5lv(15%) = 40% → 상한 도달 불가 (100% 미만)
  - OK 또는 경고
- [ ] attack_speed + orbit_guard
  - orbit hitCooldown(500ms)은 attackSpeedMultiplier 영향 받는가?
  - 코드 확인: RunScene.updateOrbit() → 하드코딩 500ms → 영향 없음 ✓
- [ ] damage 패시브 + meta_damage 중첩
  - passive 5lv: +75%, meta 5lv: +50% → 합계 +125%
  - 곱연산? 합연산? → `playerDmgMult = 1 + passiveBonus + metaBonus` (합연산)
  - 최대: 1 + 0.75 + 0.50 = 2.25x → 과도한가?

### 5. 함정 빌드 경고
겉보기와 실제 성능이 다른 조합:
- move_speed 올인: 이동은 빨라지나 DPS 제로 → 후반 붕괴
- hp_regen만: 적 수가 증가하면 regen < incoming damage
- 특정 무기 미보유 시: 레벨업 선택지 낭비 (무기 없이 패시브만 올리기)

### 6. 빌드 다양성 평가
- 최적 빌드 1개가 다른 모든 빌드를 압도하면 → 빌드 다양성 부족
- 목표: 2-3개 아키타입이 비슷한 성과를 내는 것

### 7. 산출물
`design/balance/bal-build-analysis.md`

구성:
1. 무기 시너지 매트릭스 (28쌍 평가)
2. 무기별 패시브 우선순위
3. 아키타입 비교표
4. 깨진 상호작용 보고
5. 함정 빌드 경고
6. 빌드 다양성 판정
7. 튜닝 권고

## 제약
- `design/balance/` 폴더만 write
- 상호작용 분석 시 실제 코드(RunScene) 참조하여 구현 확인
