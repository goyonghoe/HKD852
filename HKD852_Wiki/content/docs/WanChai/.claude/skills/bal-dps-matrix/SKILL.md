---
name: bal-dps-matrix
description: '전 무기 DPS/TTK 매트릭스 계산 — 레벨별, 패시브 조합별, 적 타입별'
user-invocable: true
argument-hint: '[weapon_id|all] [--with-passives] [--with-meta level]'
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-dps-matrix — DPS/TTK 매트릭스

## 역할

전 무기(8종)의 DPS(초당 데미지)와 TTK(적 처치 시간)를 레벨별·시간대별·패시브 조합별로 계산하여 무기 티어를 평가합니다.

## 핵심 참조

- `src/config/weapons.ts` — WEAPON_DEFS (8 weapons)
- `src/config/balance.ts` — COMBAT.critMultiplier
- `src/config/upgrades.ts` — PASSIVE_DEFS (damage, attack_speed, crit_chance, crit_damage)
- `src/core/MetaProgression.ts` — META_UPGRADES (meta_damage, meta_crit)
- `src/core/DamageCalc.ts` — damage formula
- `src/config/enemies.ts` — ENEMY_DEFS (6 enemy types)
- `design/reference/numerical-bible.md` — 밸런스 원칙

## 절차

### 1. 상수 로드

- weapons.ts: 8 WEAPON_DEFS 전체
- balance.ts: COMBAT.critMultiplier(2.0), DIFFICULTY.hpScalePerMin(2.0)
- upgrades.ts: damage(+15%/lv), attack_speed(+10%/lv), crit_chance(+5%/lv), crit_damage(+25%/lv)
- MetaProgression.ts: meta_damage(+10%/lv), meta_crit(+3%/lv)
- enemies.ts: 6 ENEMY_DEFS (HP 기준)

### 2. 기본 DPS 계산 (8무기 × 5레벨)

```
For each weapon w at level L:
  levelMult = 1 + (L-1) × 0.2
  effectiveDmg = w.baseDamage × levelMult

  # 타입별 hitsPerSec 계산
  bullet:  hitsPerSec = 1000 / w.cooldownMs × w.projectileCount
  aoe:     hitsPerSec = 1000 / w.cooldownMs (지속 틱)
  laser:   hitsPerSec = 1000 / w.cooldownMs × avgEnemiesInLine (추정 2-3)
  orbit:   hitsPerSec = w.projectileCount / (hitCooldown=0.5) [3÷0.5=6]
  chain:   hitsPerSec = 1000 / w.cooldownMs × chainCount
  homing:  hitsPerSec = 1000 / w.cooldownMs (단일)
  bomb:    hitsPerSec = 1000 / w.cooldownMs (AOE 다수 적중, 추정 3-5적)

  baseDPS = effectiveDmg × hitsPerSec
```

특수 무기 보정:

- `orbit_guard`: hitCooldown 500ms, sprites=3+floor((L-1)×0.5), radius=100+L×10
- `shotgun`: spread 범위 내 적중률 60-80% 추정
- `bomb`: 120+L×15 AOE, 밀집도 기반 적 수 추정

### 3. TTK 계산 (8무기 × 6적 × 3시점)

```
시점: t=0s, t=30s, t=55s
enemyHp(t) = baseHp × 2.0^(t/60)
TTK = enemyHp(t) / weaponDPS

엘리트: HP × 5
보스: 별도 (HP 500, 스케일링 없음)
```

### 4. 패시브/메타 적용 DPS (--with-passives, --with-meta)

```
expectedDPS = baseDPS
  × (1 + dmgPassive×lvl + metaDmg×lvl)   # 데미지 배율
  × (1 + atkSpdPassive×lvl)               # 공격속도 배율
  × (1 + critChance × (critMult - 1))     # 기대 크리티컬 배율

critChance = critPassive×lvl + metaCrit×lvl
critMult = 2.0 + critDmgPassive×lvl
```

### 5. 무기 티어 평가

DPS-per-cooldown-efficiency 기준 S/A/B/C 랭킹:

- **S**: 동 레벨 평균 DPS 150% 이상
- **A**: 100-150%
- **B**: 70-100%
- **C**: 70% 미만

시간대별 티어 변동 분석 (AOE 무기는 후반 유리, 단일 타겟은 초반 유리)

### 6. 깨진 상호작용 플래그

- 특정 무기의 DPS가 다른 모든 무기의 2배 이상 → 과도
- 보스 TTK > 10초 → 처치 불가 위험
- 후반 적 TTK > spawn interval → 화면 포화

### 7. 산출물

`design/balance/bal-dps-matrix.md`

구성:

1. 기본 DPS 테이블 (8×5)
2. TTK 테이블 (8×6×3)
3. 패시브 적용 DPS (최대 레벨 기준)
4. 메타 적용 DPS (최대 레벨 기준)
5. S/A/B/C 티어 랭킹 + 근거
6. 깨진 상호작용 경고
7. 튜닝 권고

## 제약

- `design/balance/` 폴더만 write
- 모든 수치는 `src/config/` 추적
