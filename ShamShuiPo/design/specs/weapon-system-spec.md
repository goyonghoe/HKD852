# Weapon System Specification

> **게임**: Neon Survivors (네온 서바이버스)
> **버전**: v1.0 (프로토타입)
> **작성**: Game Designer
> **대상**: Programmer (구현용)

---

## 1. 개요

플레이어는 런 시작 시 기본 무기 1개를 보유하며, 레벨업 시 새로운 무기를 획득하거나 기존 무기를 강화할 수 있다. 최대 동시 보유 무기: **6개**. 무기는 자동 발사(auto-fire)되며, 각 무기별 고유한 타겟팅 로직을 갖는다.

### 핵심 규칙

- 동일 무기 획득 시 레벨업 (최대 Lv.5)
- Lv.5 무기 2개 조합 시 진화(Evolution) 무기로 변환
- 진화 무기는 Lv.1 고정, 추가 레벨업 불가
- 화면 밖으로 나간 projectile은 즉시 destroy

---

## 2. 무기 8종 상세

### 2.1 Neon Pistol (네온 피스톨)

| 속성                    | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ----------------------- | ---- | ---- | ---- | ---- | ---- |
| damage                  | 10   | 13   | 16   | 20   | 25   |
| fire_rate (ms)          | 500  | 450  | 400  | 350  | 300  |
| range (px)              | 400  | 400  | 450  | 450  | 500  |
| projectile_count        | 1    | 1    | 1    | 2    | 2    |
| projectile_speed (px/s) | 600  | 600  | 650  | 650  | 700  |

- **타겟팅**: `nearest` - 가장 가까운 적
- **special_effect**: 없음 (기본 무기)
- **sprite**: `projectile_bullet.png` (8x8 네온 블루 탄환)
- **SFX**: `sfx_shot_01.wav`

### 2.2 Cyber Shotgun (사이버 샷건)

| 속성                    | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ----------------------- | ---- | ---- | ---- | ---- | ---- |
| damage                  | 8    | 10   | 12   | 15   | 18   |
| fire_rate (ms)          | 1200 | 1100 | 1000 | 900  | 800  |
| range (px)              | 250  | 270  | 290  | 310  | 350  |
| projectile_count        | 3    | 4    | 5    | 5    | 7    |
| projectile_speed (px/s) | 500  | 500  | 550  | 550  | 600  |
| spread_angle (deg)      | 30   | 35   | 40   | 40   | 50   |

- **타겟팅**: `nearest_spread` - 가장 가까운 적 방향으로 spread_angle 범위 내 부채꼴 발사
- **special_effect**: knockback 50px (피격 적을 밀어냄)
- **sprite**: `projectile_pellet.png` (6x6 오렌지 펠릿)
- **SFX**: `sfx_shot_02.wav`

### 2.3 Plasma Laser (플라즈마 레이저)

| 속성              | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ----------------- | ---- | ---- | ---- | ---- | ---- |
| damage (per tick) | 5    | 7    | 9    | 12   | 15   |
| fire_rate (ms)    | 100  | 90   | 80   | 70   | 60   |
| range (px)        | 300  | 320  | 350  | 380  | 420  |
| beam_width (px)   | 4    | 5    | 6    | 8    | 10   |
| duration (ms)     | 2000 | 2200 | 2500 | 2800 | 3000 |
| cooldown (ms)     | 4000 | 3800 | 3500 | 3200 | 3000 |

- **타겟팅**: `nearest_lock` - 가장 가까운 적에 lock-on, duration 동안 빔 유지
- **special_effect**: penetrate (관통) - 빔 경로 상 모든 적에 damage 적용
- **구현 참고**: Phaser Graphics로 라인 렌더링, duration 후 cooldown 진입
- **sprite**: 없음 (Graphics API 사용)
- **SFX**: `sfx_laser_01.wav` (loop during duration)

### 2.4 Homing Missile (호밍 미사일)

| 속성                    | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5     |
| ----------------------- | ---- | ---- | ---- | ---- | -------- |
| damage                  | 30   | 40   | 50   | 65   | 80       |
| fire_rate (ms)          | 2000 | 1800 | 1600 | 1400 | 1200     |
| range (px)              | 500  | 550  | 600  | 650  | 화면전체 |
| projectile_count        | 1    | 1    | 2    | 2    | 3        |
| projectile_speed (px/s) | 300  | 320  | 340  | 360  | 400      |
| explosion_radius (px)   | 60   | 70   | 80   | 90   | 100      |

- **타겟팅**: `strongest` - HP가 가장 높은 적 우선
- **special_effect**: AoE explosion (explosion_radius 내 모든 적에 damage \* 0.5 추가 피해)
- **구현 참고**: Phaser.Math.Angle.RotateTo()로 유도 궤적, turn_rate: 3 rad/s
- **sprite**: `projectile_missile.png` (12x6 빨간 미사일)
- **SFX**: `sfx_explosion_01.wav` (on hit)

### 2.5 Neon Boomerang (네온 부메랑)

| 속성                    | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ----------------------- | ---- | ---- | ---- | ---- | ---- |
| damage                  | 15   | 20   | 25   | 32   | 40   |
| fire_rate (ms)          | 1500 | 1400 | 1300 | 1200 | 1000 |
| range (px)              | 250  | 280  | 310  | 340  | 380  |
| projectile_count        | 1    | 1    | 2    | 2    | 3    |
| projectile_speed (px/s) | 350  | 370  | 390  | 410  | 450  |

- **타겟팅**: `nearest` - 가장 가까운 적 방향으로 발사
- **special_effect**: return (왕복) - range까지 날아간 후 플레이어에게 복귀, 복귀 경로에서도 damage 적용 (hit 판정 2회)
- **구현 참고**: 발사 → 감속 → 정지 → 역방향 가속 → 플레이어 위치로 복귀. 피어싱(관통) 적용.
- **sprite**: `projectile_boomerang.png` (16x16, 회전 애니메이션)
- **SFX**: `sfx_whoosh_01.wav`

### 2.6 Chain Lightning (체인 라이트닝)

| 속성             | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ---------------- | ---- | ---- | ---- | ---- | ---- |
| damage           | 12   | 16   | 20   | 25   | 32   |
| fire_rate (ms)   | 1800 | 1600 | 1400 | 1200 | 1000 |
| chain_count      | 2    | 3    | 4    | 5    | 7    |
| chain_range (px) | 100  | 110  | 120  | 130  | 150  |
| damage_decay     | 0.8  | 0.82 | 0.85 | 0.87 | 0.9  |

- **타겟팅**: `random` - 범위 내 랜덤 적 1체에 발사, 이후 chain_range 내 가장 가까운 적으로 연쇄
- **special_effect**: chain - 첫 타겟에서 chain_count만큼 연쇄. n번째 chain damage = base_damage \* damage_decay^n
- **구현 참고**: Phaser Graphics로 번개 라인 렌더링 (짧은 flash). 이미 맞은 적은 chain 대상 제외.
- **sprite**: 없음 (Graphics API 사용, 밝은 시안 색상)
- **SFX**: `sfx_electric_01.wav`

### 2.7 Flamethrower (플레임스로워)

| 속성                | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ------------------- | ---- | ---- | ---- | ---- | ---- |
| damage (per tick)   | 4    | 5    | 7    | 9    | 12   |
| fire_rate (ms)      | 80   | 75   | 70   | 65   | 50   |
| range (px)          | 150  | 165  | 180  | 200  | 220  |
| cone_angle (deg)    | 40   | 45   | 50   | 55   | 60   |
| burn_damage (per s) | 3    | 4    | 5    | 7    | 10   |
| burn_duration (ms)  | 2000 | 2000 | 2500 | 2500 | 3000 |

- **타겟팅**: `direction` - 조이스틱 이동 방향 (정지 시 마지막 이동 방향)
- **special_effect**: burn DoT - 피격 적에게 burn_duration 동안 burn_damage/s 지속 피해. 화염 영역 내 모든 적 동시 피격.
- **구현 참고**: 파티클 이미터로 불꽃 효과. 원뿔형 히트박스.
- **sprite**: 없음 (파티클 시스템 사용, 오렌지-레드 그라디언트)
- **SFX**: `sfx_fire_01.wav` (loop while active)

### 2.8 Orbital Shield (오비탈 실드)

| 속성                | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
| ------------------- | ---- | ---- | ---- | ---- | ---- |
| damage              | 20   | 26   | 33   | 42   | 55   |
| orbit_radius (px)   | 80   | 85   | 90   | 95   | 100  |
| orbit_speed (rad/s) | 2.0  | 2.2  | 2.5  | 2.8  | 3.2  |
| orb_count           | 1    | 2    | 2    | 3    | 4    |
| orb_size (px)       | 16   | 18   | 20   | 22   | 24   |

- **타겟팅**: `orbit` - 타겟팅 없음, 플레이어 주변을 공전하며 접촉 적에 damage
- **special_effect**: 없음 (접촉 damage만, 쿨다운 없이 적과 접촉 시마다 damage, 같은 적 재히트 간격: 500ms)
- **구현 참고**: 각 orb는 플레이어 중심으로 등간격 배치, orbit_speed로 회전
- **sprite**: `projectile_orb.png` (orb_size, 퍼플 에너지 구체)
- **SFX**: `sfx_hit_energy_01.wav` (on contact)

---

## 3. 무기 진화 시스템

### 3.1 진화 규칙

1. 두 무기 모두 **Lv.5** 도달 필수
2. 레벨업 선택지에 진화 옵션이 **최우선으로 등장** (weight: 10x)
3. 진화 시 원래 두 무기 슬롯이 **1개로 합쳐짐** (빈 슬롯 1개 확보)
4. 진화 무기는 레벨업 불가, 고정 스탯

### 3.2 프로토타입 진화 레시피 (3종)

#### Plasma Storm (플라즈마 스톰)

- **재료**: Neon Pistol Lv.5 + Chain Lightning Lv.5
- **설명**: 전기를 두른 탄환이 적 관통 시 주변에 번개 방출

| 속성                    | 값                                      |
| ----------------------- | --------------------------------------- |
| damage                  | 35                                      |
| fire_rate (ms)          | 250                                     |
| projectile_count        | 3                                       |
| projectile_speed (px/s) | 750                                     |
| penetrate               | true (최대 5체 관통)                    |
| chain_on_hit            | 3체, chain_range 120px, chain_damage 20 |
| 타겟팅                  | `nearest`                               |

#### Inferno Cyclone (인페르노 사이클론)

- **재료**: Flamethrower Lv.5 + Orbital Shield Lv.5
- **설명**: 플레이어 주위를 도는 화염 소용돌이

| 속성                | 값                  |
| ------------------- | ------------------- |
| damage (per tick)   | 18                  |
| tick_rate (ms)      | 100                 |
| orbit_radius (px)   | 120                 |
| orbit_speed (rad/s) | 4.0                 |
| flame_count         | 4                   |
| burn_damage (per s) | 15                  |
| burn_duration (ms)  | 3000                |
| 타겟팅              | `orbit` (접촉 기반) |

#### Apocalypse Launcher (아포칼립스 런처)

- **재료**: Homing Missile Lv.5 + Cyber Shotgun Lv.5
- **설명**: 유도 미사일이 착탄 시 광역 산탄 폭발

| 속성                    | 값                     |
| ----------------------- | ---------------------- |
| damage                  | 100                    |
| fire_rate (ms)          | 2000                   |
| projectile_count        | 2                      |
| projectile_speed (px/s) | 350                    |
| explosion_radius (px)   | 130                    |
| cluster_count           | 8 (폭발 시 8방향 산탄) |
| cluster_damage          | 25                     |
| cluster_range (px)      | 200                    |
| 타겟팅                  | `strongest`            |

---

## 4. 타겟팅 시스템 상세

### 4.1 타겟팅 모드 정의

```typescript
enum TargetMode {
  NEAREST = "nearest", // 유클리드 거리 최소
  NEAREST_SPREAD = "nearest_spread", // nearest + 부채꼴 분산
  NEAREST_LOCK = "nearest_lock", // nearest에 lock-on 유지
  STRONGEST = "strongest", // 현재 HP 최대
  RANDOM = "random", // 범위 내 랜덤
  DIRECTION = "direction", // 이동 방향
  ORBIT = "orbit", // 공전 (타겟 없음)
}
```

### 4.2 타겟 갱신 주기

- `nearest`, `strongest`, `random`: 매 fire_rate마다 재탐색
- `nearest_lock`: lock-on 대상이 사망하거나 range 벗어날 때만 재탐색
- `direction`: 매 프레임 조이스틱 방향 반영
- `orbit`: 타겟 탐색 없음

### 4.3 타겟 탐색 범위

- 기본 탐색 범위 = 무기의 `range` 값
- range 내 적이 없을 경우: `nearest`, `strongest` → 화면 내 전체 탐색 (fallback)
- `random` → 발사하지 않음 (대기)

---

## 5. DPS 참고 테이블 (Lv.5 기준)

| 무기            | 단일 DPS  | 비고                                          |
| --------------- | --------- | --------------------------------------------- |
| Neon Pistol     | 167       | 2발 \* 25 / 0.3s                              |
| Cyber Shotgun   | 158       | 7발 \* 18 / 0.8s (전탄 적중 시)               |
| Plasma Laser    | 250       | 15 / 0.06s (빔 유지 중)                       |
| Homing Missile  | 200       | 3발 \* 80 / 1.2s                              |
| Neon Boomerang  | 120       | 3발 \* 40 / 1.0s (왕복 포함 240)              |
| Chain Lightning | 224       | 32 \* (1+0.9+0.81+0.73+0.66+0.59+0.53) / 1.0s |
| Flamethrower    | 240       | 12 / 0.05s (연속 화염)                        |
| Orbital Shield  | 접촉 의존 | 밀집 적 상대 시 최대 440 (4orb _ 55 _ 2hit/s) |

> **밸런스 목표**: Lv.5 단일 무기 DPS 120~250 범위. 진화 무기는 300~500 DPS.

---

## 6. 구현 우선순위

1. **Phase 1**: Neon Pistol, Orbital Shield (가장 단순한 projectile + orbit)
2. **Phase 2**: Cyber Shotgun, Homing Missile (spread + homing 로직)
3. **Phase 3**: Neon Boomerang, Chain Lightning (복귀 + 연쇄)
4. **Phase 4**: Plasma Laser, Flamethrower (빔 + 파티클)
5. **Phase 5**: 진화 시스템 3종

---

## 7. 에셋 매핑 참고

| 무기            | 아이콘 (CraftPix)           | 이펙트 팩         |
| --------------- | --------------------------- | ----------------- |
| Neon Pistol     | `icon_weapon_pistol.png`    | -                 |
| Cyber Shotgun   | `icon_weapon_shotgun.png`   | sparks            |
| Plasma Laser    | `icon_weapon_laser.png`     | energy            |
| Homing Missile  | `icon_weapon_missile.png`   | explosions        |
| Neon Boomerang  | `icon_weapon_boomerang.png` | energy            |
| Chain Lightning | `icon_weapon_lightning.png` | sparks            |
| Flamethrower    | `icon_weapon_flame.png`     | smoke, explosions |
| Orbital Shield  | `icon_weapon_orb.png`       | energy            |
