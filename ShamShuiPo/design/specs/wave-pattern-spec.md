# Wave & Enemy System Specification

> **게임**: Neon Survivors (네온 서바이버스)
> **버전**: v1.0 (프로토타입)
> **작성**: Game Designer
> **대상**: Programmer (구현용)

---

## 1. 개요

10분(600초) 런을 4개 페이즈로 분할한다. 각 페이즈는 고유한 적 구성, 스폰 밀도, 포메이션을 가진다. 난이도는 시간에 비례하여 상승하며, 5분에 미니보스, 9분에 최종 보스가 출현한다.

### 화면 좌표 기준

- 게임 영역: 720 x 1280 (portrait)
- 스폰 영역: 화면 밖 80px 바깥 링에서 생성
- 디스폰: 플레이어로부터 800px 이상 떨어지면 제거 (재활용)

---

## 2. 적 6종 상세

### 2.1 Drone (드론) — 잡몹 기본

| 속성         | 값                                |
| ------------ | --------------------------------- |
| base_hp      | 20                                |
| speed (px/s) | 80                                |
| damage       | 5                                 |
| xp_drop      | 1                                 |
| size (px)    | 48x48                             |
| color        | 초록                              |
| behavior     | `chase` — 플레이어 방향 직선 이동 |
| asset_pack   | `cyberpunk_city_enemy_01`         |

### 2.2 Rusher (러셔) — 빠른 돌격형

| 속성         | 값                                                                |
| ------------ | ----------------------------------------------------------------- |
| base_hp      | 12                                                                |
| speed (px/s) | 160                                                               |
| damage       | 8                                                                 |
| xp_drop      | 2                                                                 |
| size (px)    | 48x48                                                             |
| color        | 빨강                                                              |
| behavior     | `rush` — 스폰 시 플레이어 위치로 직선 돌진, 방향 고정 (유도 없음) |
| asset_pack   | `cyberpunk_bar_enemy_02`                                          |

### 2.3 Tank (탱크) — 느린 고체력

| 속성         | 값                              |
| ------------ | ------------------------------- |
| base_hp      | 80                              |
| speed (px/s) | 40                              |
| damage       | 12                              |
| xp_drop      | 5                               |
| size (px)    | 48x48                           |
| color        | 파랑                            |
| behavior     | `chase` — 플레이어 추적, 느림   |
| asset_pack   | `cyberpunk_industrial_enemy_01` |

### 2.4 Spitter (스피터) — 원거리 공격

| 속성                    | 값                                                             |
| ----------------------- | -------------------------------------------------------------- |
| base_hp                 | 15                                                             |
| speed (px/s)            | 50                                                             |
| damage (melee)          | 4                                                              |
| projectile_damage       | 10                                                             |
| projectile_speed (px/s) | 200                                                            |
| fire_range (px)         | 300                                                            |
| fire_rate (ms)          | 2000                                                           |
| xp_drop                 | 3                                                              |
| size (px)               | 48x48                                                          |
| color                   | 보라                                                           |
| behavior                | `kite` — fire_range 유지하며 접근, 범위 내 도달 시 정지 + 발사 |
| asset_pack              | `cyberpunk_sewer_enemy_01`                                     |

### 2.5 Exploder (익스플로더) — 자폭형

| 속성                  | 값                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------- |
| base_hp               | 8                                                                                            |
| speed (px/s)          | 100                                                                                          |
| damage                | 25                                                                                           |
| explosion_radius (px) | 80                                                                                           |
| xp_drop               | 3                                                                                            |
| size (px)             | 48x48                                                                                        |
| color                 | 노랑                                                                                         |
| behavior              | `suicide` — 플레이어 추적, 접촉(30px 이내) 시 자폭. 폭발은 플레이어 + 다른 적 모두에 damage. |
| fuse_warning          | 접촉 직전 0.5초 점멸(flash) 경고                                                             |
| asset_pack            | `cyberpunk_lab_enemy_01`                                                                     |

### 2.6 Shielder (실더) — 보호막 적

| 속성         | 값                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------ |
| base_hp      | 30                                                                                         |
| shield_hp    | 20                                                                                         |
| speed (px/s) | 60                                                                                         |
| damage       | 8                                                                                          |
| xp_drop      | 4                                                                                          |
| size (px)    | 48x48                                                                                      |
| color        | 시안                                                                                       |
| behavior     | `chase` — 추적. shield_hp가 0이 될 때까지 받는 damage 50% 감소. shield 파괴 시 0.5초 스턴. |
| shield_regen | shield 파괴 후 5초 뒤 shield_hp 전체 회복                                                  |
| asset_pack   | `cyberpunk_chinese_enemy_01`                                                               |

---

## 3. 페이즈 구성

### 3.1 Phase 1: Early (0:00 ~ 2:00)

**테마**: 적응기. 플레이어가 조작과 무기에 익숙해지는 구간.

| 속성       | 값                                                     |
| ---------- | ------------------------------------------------------ |
| 등장 적    | Drone, Rusher                                          |
| spawn_rate | 0:00~0:30: 0.5/s → 0:30~1:00: 1.0/s → 1:00~2:00: 1.5/s |
| max_alive  | 15 → 20 → 30                                           |
| 적 비율    | Drone 80%, Rusher 20%                                  |
| 스폰 방향  | 랜덤 전방위                                            |
| 포메이션   | 없음 (개별 스폰)                                       |

**이벤트**:

- 0:30 — 첫 Rusher 등장 (경고 화살표 UI)
- 1:30 — XP 보너스 웨이브: 10초간 Drone 15마리 일렬 행진 (한 방향)

### 3.2 Phase 2: Mid (2:00 ~ 5:00)

**테마**: 난이도 상승. 새로운 적 타입과 포메이션 등장.

| 속성       | 값                                                    |
| ---------- | ----------------------------------------------------- |
| 등장 적    | Drone, Rusher, Tank, Spitter                          |
| spawn_rate | 2:00: 2.0/s → 3:00: 2.5/s → 4:00: 3.0/s → 5:00: 3.5/s |
| max_alive  | 40 → 50 → 60 → 70                                     |
| 적 비율    | Drone 50%, Rusher 20%, Tank 15%, Spitter 15%          |
| 스폰 방향  | 60% 랜덤, 40% 플레이어 이동 반대 방향                 |

**포메이션 (2분부터 활성화)**:

- `circle_swarm`: 12~20마리가 플레이어 주변 원형으로 동시 스폰 후 수축
- `line_charge`: 6~10마리가 한 방향에서 일렬로 돌진
- 포메이션 발동 간격: 30초마다 1회

**이벤트**:

- 3:00 — 엘리트 Tank 1마리 (HP 2배, 크기 1.5배, xp_drop 15)
- 4:00 — Spitter 8마리 원형 포위

### 3.3 Phase 3: Late (5:00 ~ 8:00)

**테마**: 카오스. 모든 적 타입 등장, 높은 스폰 밀도.

| 속성       | 값                                                                       |
| ---------- | ------------------------------------------------------------------------ |
| 등장 적    | 전 6종                                                                   |
| spawn_rate | 5:00: 4.0/s → 6:00: 5.0/s → 7:00: 6.0/s → 8:00: 7.0/s                    |
| max_alive  | 80 → 100 → 120 → 120                                                     |
| 적 비율    | Drone 35%, Rusher 20%, Tank 15%, Spitter 10%, Exploder 10%, Shielder 10% |
| 스폰 방향  | 40% 랜덤, 60% 전략적 (플레이어 이동 방향 차단)                           |

**포메이션**:

- `circle_swarm`, `line_charge` 유지
- `pincer`: 양쪽에서 동시 돌진 (좌우 또는 상하)
- `shield_wall`: Shielder 4~6마리 전방 벽 + 뒤에 Spitter 4마리
- 포메이션 발동 간격: 20초마다 1회

**이벤트**:

- 5:00 — **미니보스 등장** (섹션 4 참고)
- 6:30 — Exploder 10마리 동시 사방 스폰 (자폭 러시)
- 7:30 — 엘리트 Shielder 2마리 + Spitter 6마리 콤보

### 3.4 Phase 4: Boss (8:00 ~ 10:00)

**테마**: 최종 결전. 잡몹 감소, 보스 집중.

| 속성       | 값                                                    |
| ---------- | ----------------------------------------------------- |
| 등장 적    | Drone, Rusher (보스 호위)                             |
| spawn_rate | 8:00~9:00: 2.0/s → 9:00~10:00: 1.0/s (보스 전투 집중) |
| max_alive  | 30 (보스 제외)                                        |
| 적 비율    | Drone 70%, Rusher 30%                                 |

**이벤트**:

- 8:30 — 화면 가장자리에 경고 연출 (화면 진동 + 사이렌 SFX)
- 9:00 — **최종 보스 등장** (섹션 5 참고)
- 보스 사망 시 → 잡몹 전체 제거 + Victory 화면
- 10:00 타임아웃 시 → 보스 남은 HP 비례 등급 부여 (S/A/B/C/F)

---

## 4. 미니보스 (5:00)

### Cyber Sentinel (사이버 센티넬)

| 속성           | 값                  |
| -------------- | ------------------- |
| hp             | 500                 |
| speed (px/s)   | 60                  |
| damage (melee) | 20                  |
| size (px)      | 72x72               |
| xp_drop        | 50                  |
| asset_pack     | `cyberpunk_boss_01` |

**공격 패턴** (3개 순환, 각 패턴 4초):

1. **Charge** (2초 차징 → 돌진)
   - 차징 중 방향 표시 (빨간 레이저 라인)
   - 돌진 속도: 400px/s, 범위: 화면 끝까지
   - 피격 damage: 25
   - 돌진 후 1초 경직

2. **Spawn Adds** (잡몹 소환)
   - 미니보스 주변에 Rusher 6마리 원형 스폰
   - 쿨다운: 패턴 전환 시 1회만

3. **Ring Shot** (원형 탄막)
   - 8방향 탄환 발사
   - 탄환 damage: 15, speed: 150px/s
   - 2연발 (0.5초 간격)

**보상**: 드롭 시 무기 상자 1개 (랜덤 무기 or 보유 무기 레벨업)

---

## 5. 최종 보스 (9:00)

### Neon Overlord (네온 오버로드)

| 속성           | 값                        |
| -------------- | ------------------------- |
| hp             | 2000                      |
| speed (px/s)   | 40                        |
| damage (melee) | 30                        |
| size (px)      | 96x96 (1.33x 확대 렌더링) |
| asset_pack     | `cyberpunk_boss_05`       |

**3 페이즈 전환** (HP 기준):

#### Phase A: HP 100%~60%

- **Laser Sweep**: 화면 좌→우 or 상→하 레이저 빔 (1초 경고 라인 → 0.5초 빔)
  - damage: 40, 빔 폭: 60px
  - 빔 통과 전 safe zone이 반드시 존재
- **Missile Barrage**: 플레이어 위치에 3초간 5회 미사일 투하 (착탄 지점에 0.8초 전 경고 원)
  - damage: 20, 폭발 반경: 80px
- 잡몹 스폰: Drone 4마리/10초

#### Phase B: HP 60%~30%

- Phase A 패턴 유지 + 속도 1.5배
- **Shield Phase**: 10초간 보호막(shield_hp: 300) 활성화. 보호막 활성 중 받는 damage 70% 감소.
  - 보호막 파괴 시: 2초간 스턴 + 받는 damage 1.5배 (weak state)
  - 보호막 지속 시: 10초 후 자동 해제, 전방위 충격파 (damage: 30, radius: 200px)
- 잡몹 스폰: Rusher 6마리/10초

#### Phase C: HP 30%~0%

- 기존 패턴 속도 2배
- **Enrage**: 이동속도 80px/s, melee damage 50
- **Desperation**: 3초마다 전방위 12방향 탄막 (damage: 15, speed: 200px/s)
- 잡몹 스폰 중지 (1:1 결투)
- HP 10% 이하: 모든 공격 패턴 동시 발동 (최종 러시)

---

## 6. 적 스케일링 공식

시간 경과에 따라 적 스탯이 선형 증가한다.

```typescript
function getScaledStat(
  baseStat: number,
  minute: number,
  statType: "hp" | "damage" | "speed",
): number {
  const scalingFactors = {
    hp: 0.15, // 분당 15% 증가
    damage: 0.1, // 분당 10% 증가
    speed: 0.03, // 분당 3% 증가 (과도한 속도 방지)
  };

  const factor = scalingFactors[statType];
  return Math.round(baseStat * (1 + factor * minute));
}
```

### 스케일링 적용 예시 (Drone 기준)

| 분(minute) | HP  | Damage | Speed |
| ---------- | --- | ------ | ----- |
| 0          | 20  | 5      | 80    |
| 2          | 26  | 6      | 85    |
| 5          | 35  | 8      | 92    |
| 8          | 44  | 9      | 99    |
| 10         | 50  | 10     | 104   |

### 스케일링 제외 항목

- `xp_drop`: 고정 (인플레이션 방지)
- `speed`: 최대 캡 = base_speed \* 1.5 (너무 빨라지는 것 방지)
- 보스 HP/damage: 고정 (페이즈 시스템이 난이도 조절)

---

## 7. 스폰 시스템 구현 가이드

### 7.1 스폰 위치 계산

```typescript
function getSpawnPosition(
  playerX: number,
  playerY: number,
): { x: number; y: number } {
  const SPAWN_MARGIN = 80; // 화면 밖 거리
  const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

  // 화면 경계에서 SPAWN_MARGIN만큼 바깥
  const spawnDistance = Math.max(720, 1280) / 2 + SPAWN_MARGIN;

  return {
    x: playerX + Math.cos(angle) * spawnDistance,
    y: playerY + Math.sin(angle) * spawnDistance,
  };
}
```

### 7.2 Object Pooling

- 각 적 타입별 풀 크기: `max_alive * 1.2` (여유분 20%)
- 디스폰 조건: 플레이어로부터 800px 초과 시 풀에 반환
- 풀 고갈 시: 가장 먼 적을 강제 회수하여 재활용

### 7.3 포메이션 스폰

```typescript
// circle_swarm: 플레이어 주변 원형 스폰
function spawnCircleSwarm(count: number, radius: number) {
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i;
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;
    spawnEnemy("drone", x, y);
  }
}

// line_charge: 한 방향에서 일렬 돌진
function spawnLineCharge(count: number, direction: number) {
  const spacing = 40; // 적 간 간격
  for (let i = 0; i < count; i++) {
    const offset = (i - count / 2) * spacing;
    // direction에 수직인 축으로 offset 적용
    const perpAngle = direction + Math.PI / 2;
    const x = spawnEdgeX + Math.cos(perpAngle) * offset;
    const y = spawnEdgeY + Math.sin(perpAngle) * offset;
    spawnEnemy("rusher", x, y);
  }
}
```

### 7.4 성능 목표

- 최대 동시 적 수: 120마리
- 타겟 FPS: 60fps (모바일에서 최소 30fps)
- 적 120마리 초과 시: 가장 먼 적부터 자동 디스폰

---

## 8. XP 드롭 시스템

### XP 보석 종류

| 보석          | XP 값 | 드롭 조건                   |
| ------------- | ----- | --------------------------- |
| 초록 (Small)  | 1     | Drone, Rusher               |
| 파랑 (Medium) | 3     | Spitter, Exploder           |
| 보라 (Large)  | 5     | Tank, Shielder              |
| 금색 (Rare)   | 20    | 엘리트, 보석 10개 자동 합산 |

### 보석 행동

- 드롭 위치에 3초 정지 후 서서히 플레이어 방향으로 이동 (speed: 30px/s)
- 플레이어 magnet_range(기본 50px) 내 진입 시 빠르게 흡수 (speed: 600px/s)
- 30초 후 자동 소멸 (깜빡임 경고 5초 전)

---

## 9. 사운드 매핑

| 이벤트               | SFX 파일                                 |
| -------------------- | ---------------------------------------- |
| Drone 사망           | `sfx_enemy_death_01.wav`                 |
| Rusher 돌진          | `sfx_dash_01.wav`                        |
| Tank 피격            | `sfx_hit_heavy_01.wav`                   |
| Spitter 발사         | `sfx_shot_03.wav`                        |
| Exploder 자폭        | `sfx_explosion_02.wav`                   |
| Shielder 보호막 파괴 | `sfx_shield_break_01.wav`                |
| 미니보스 등장        | `sfx_boss_intro_01.wav`                  |
| 최종보스 등장        | `sfx_boss_intro_02.wav`                  |
| Phase 전환           | BGM 크로스페이드 (현재 → 다음 트랙, 2초) |
