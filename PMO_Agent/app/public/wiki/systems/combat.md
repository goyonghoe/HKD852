# 전투 시스템

> 무기, 데미지 계산, 투사체, 크리티컬, 원소 속성

관련 파일: `src/config/weapons.ts`, `src/core/DamageCalc.ts`, `src/systems/WeaponSystem.ts`, `src/objects/Projectile.ts`

---

## 무기 시스템 개요

플레이어는 런 중 최대 **4종** 무기를 동시 장착할 수 있습니다 (`BALANCE.RUN.maxWeapons`). 무기는 레벨업 선택지에서 획득하며 최대 레벨 5까지 업그레이드됩니다. T1 무기 2개가 레벨 조건을 충족하면 T2 진화 무기로 합성할 수 있습니다.

---

## T1 기본 무기 (10종)

| ID            | 이름          | 기본 데미지 | 쿨다운 | 특성                  |
| ------------- | ------------- | ----------- | ------ | --------------------- |
| `energy_shot` | 에너지 샷     | 10          | 800ms  | 단일 타겟, 고속(1200) |
| `napalm`      | 네이팜탄      | 12          | 2500ms | AOE 범위 120, 소이탄  |
| `laser_beam`  | 레이저 빔     | 25          | 2000ms | 관통 99, 사거리 500   |
| `shuriken`    | 수리검        | 12          | 1000ms | 관통 3, 사거리 400    |
| `shotgun`     | 산탄총        | 10×3        | 1200ms | 3발 동시 발사         |
| `lightning`   | 체인 라이트닝 | 22          | 1200ms | 3체인, 사거리 400     |
| `missile`     | 추적 미사일   | 30          | 2500ms | 유도, AOE 60          |
| `bomb`        | 에너지 폭탄   | 50          | 4000ms | AOE 범위 120          |
| `railgun`     | 레일건        | 45          | 3500ms | 관통 99, 사거리 800   |
| `rapid_fire`  | 속사포        | 3           | 200ms  | 초당 5발, 사거리 480  |

---

## T2 진화 무기 (7종)

T2 무기는 레벨업 선택지에서 **진화(Evolution)** 카드로만 등장하며, 두 재료 무기가 레벨 조건을 충족해야 합니다.

| ID                | 이름            | 기본 데미지 | 쿨다운 | 재료 (레벨 조건)                 |
| ----------------- | --------------- | ----------- | ------ | -------------------------------- |
| `plasma_gatling`  | 플라즈마 개틀링 | 25×3        | 120ms  | energy_shot Lv5 + rapid_fire Lv3 |
| `cluster_warhead` | 클러스터 탄두   | 55          | 1200ms | missile Lv5 + bomb Lv3           |
| `tesla_arc`       | 테슬라 아크     | 30×5체인    | 600ms  | laser_beam Lv5 + lightning Lv3   |
| `scatter_storm`   | 스캐터 스톰     | 18×7        | 350ms  | shotgun Lv5 + shuriken Lv3       |
| `inferno_beam`    | 인페르노 빔     | 35          | 450ms  | laser_beam Lv5 + napalm Lv3      |
| `thunder_bomb`    | 썬더 봄         | 60          | 2000ms | lightning Lv5 + bomb Lv3         |
| `viper_salvo`     | 바이퍼 살보     | 15×2        | 200ms  | rapid_fire Lv5 + missile Lv3     |

---

## 데미지 계산

> 관련 파일: `src/core/DamageCalc.ts`

### 기본 공식

```
actual = ceil(baseDamage × damageMultiplier × (isCrit ? critMultiplier : 1))
```

- `critMultiplier` 기본값: **2.0** (`BALANCE.COMBAT.critMultiplier`)
- 크리티컬 판정: `random() < critChance`

### 원소 상성

WIND → EARTH → LIGHT → FIRE → WATER → WIND (5원소 순환)

| 상황                  | 배율  |
| --------------------- | ----- |
| 유리 원소 (Effective) | ×1.5  |
| 불리 원소 (Resist)    | ×0.75 |
| 중립 (Neutral)        | ×1.0  |
| DARK 원소 대상/사용   | ×1.25 |

```typescript
// 원소 상성 예시
getElementMultiplier("WIND", "EARTH", advantages, 1.5, 0.75, 1.25);
// → { multiplier: 1.5, effectiveness: 'effective' }
```

### 적 원소 저항 (M-002 — balance.ts 참조)

보스는 DARK 원소를 가지므로 모든 캐릭터의 공격이 ×1.25 데미지.

---

## 투사체 시스템

> 관련 파일: `src/objects/Projectile.ts`, `src/systems/WeaponSystem.ts`

### 투사체 유형

| `projectileType` | 설명                      |
| ---------------- | ------------------------- |
| `bullet`         | 직선 이동, 관통 가능      |
| `laser`          | 즉발, 선형, 관통 99       |
| `homing`         | 유도 (적 방향으로 조향)   |
| `bomb`           | 즉발 AOE, 투사체 없음     |
| `napalm`         | 즉발 AOE, 화염 지속       |
| `chain`          | 체인 방식 (번개 멀티히트) |

### 타겟팅 모드

| `targetMode` | 설명                   |
| ------------ | ---------------------- |
| `nearest`    | 가장 가까운 적 조준    |
| `aoe`        | 적 밀집 지역 중앙 타겟 |

### 유도탄 회전율

- 기본 회전율: `BALANCE.COMBAT.homingBaseTurnRate` (4 rad/s)
- 레벨당 증가: `+0.5 rad/s`

---

## 궁극기 시스템

> 관련 파일: `src/core/UltimateCalc.ts`, `src/managers/UltimateManager.ts`

게이지 충전 시 궁극기 발동 가능. 적 처치 시 게이지 충전:

- T1 적: +5
- T2 적: +10
- 엘리트: +20
- 보스: +50

| 캐릭터       | 궁극기 효과                               |
| ------------ | ----------------------------------------- |
| HAI (WIND)   | 범위 200px, 80 데미지, 넉백 200           |
| NOVA (WATER) | 전체 화면 냉동 3000ms                     |
| SOL (FIRE)   | DOT 15 데미지/0.5초, 3초 지속             |
| MEI (LIGHT)  | 너비 60px 관통 레이저, 200 데미지         |
| KAI (EARTH)  | 전체 적 1500ms 기절 + 방어력 50% 버프 5초 |
