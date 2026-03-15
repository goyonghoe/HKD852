# SPEC-032: Chrono Hack (크로노 핵 — 시간 조작)

> **게임**: Neon Survivors (네온 서바이버스)
> **버전**: v1.0
> **작성**: Game Designer
> **대상**: Programmer, Balance Designer (구현용)
> **우선순위**: High
> **의존성**: RunState, balance.ts, 무기 시스템, 적 이동 시스템

---

## 1. 개요

적 처치로 충전되는 크로노 게이지를 통해 플레이어가 시간을 조작(슬로우모션)할 수 있는 **궁극기(Ultimate) 시스템**. 게이지 100% 시 발동하면 3초간 적과 탄환은 0.3배 속도, 플레이어는 정상 속도로 움직이며 데미지와 크리티컬이 증폭된다. 사이버펑크 해킹 판타지를 시간 조작으로 표현한 시그니처 메카닉.

### 핵심 경험

- **파워 판타지**: 슬로우모션에서 적 탄막을 유유히 피하며 난사하는 쾌감
- **전략적 타이밍**: 보스전? 대규모 웨이브? 어디에 쓸지 판단
- **시각적 임팩트**: 화면 색조 변환 + 모션 트레일 + 블루 글로우 = 영화 같은 순간
- **성취감**: 킬 스트릭으로 게이지를 채우는 과정 자체가 보상

### 디자인 원칙 연계

- **보상 간격**: 30~40초 킬로 게이지 100% → 큰 보상 (3~5분 간격 주요 보상)
- **공정한 실패**: 게이지 소진 후 재충전 필요 — 남용 불가
- **카운터 페어**: 슬로우 중 데미지 증폭(공격) vs 짧은 지속시간(제한)
- **경험 우선**: 기계적으로 강할 뿐 아니라, "시간을 멈춘다"는 체험 그 자체가 목적

---

## 2. 상세 메카닉

### 2.1 크로노 게이지 충전

| 처치 대상                    | 충전량 | 비고           |
| ---------------------------- | ------ | -------------- |
| Tier 1 적 (drone, crawler)   | 1%     | 가장 흔한 소스 |
| Tier 2 적 (enforcer, dasher) | 2%     | 중급           |
| Tier 3 적 (sentinel, bomber) | 3%     | 엘리트         |
| Mini Boss (Riot Commander)   | 20%    | 중간 보스      |
| Chapter Boss (Yakuza Mech)   | 20%    | 챕터 보스      |
| Final Boss (Neon Overlord)   | 20%    | 최종 보스      |

- **최대 게이지**: 100%
- **오버차지 없음**: 100% 이후 추가 충전 무시
- **런 시작 시**: 0%
- **패시브 연동**: "크로노 오버클럭" 패시브 보유 시 충전량 ×1.2 (20% 보너스)

### 2.2 충전 속도 분석

| 시간대                 | 분당 킬 수 (추정) | 평균 충전/킬 | 분당 충전 | 풀 충전 시간 |
| ---------------------- | ----------------- | ------------ | --------- | ------------ |
| 0~2분 (Tier 1)         | 30~50             | 1%           | 30~50%    | ~2.5분       |
| 3~5분 (Tier 1+2 혼합)  | 60~90             | 1.5%         | 90~135%   | ~50초        |
| 6~8분 (Tier 2+3 혼합)  | 80~120            | 2%           | 160~240%  | ~30초        |
| 8~10분 (Tier 3 + 보스) | 100~150           | 2.5%         | 250~375%  | ~25초        |

**결론**: 초반 첫 발동은 약 2~3분, 후반에는 30~40초마다 발동 가능. 10분 런에서 총 6~10회 사용 예상.

### 2.3 발동 조건

- **게이지 100% 필수**
- **입력**: 조이스틱 영역 외 화면 아무 곳 탭
  - 조이스틱 사용 중에도 다른 손으로 탭 가능 (멀티터치)
  - 레벨업 선택 UI, 일시정지 중에는 발동 불가
- **쿨다운**: 없음 (게이지 리셋이 사실상 쿨다운)
- **보스 페이즈 중**: 발동 가능 (보스전에서 전략적 사용 유도)

### 2.4 슬로우모션 효과

| 대상                    | 속성             | 배율               | 비고                          |
| ----------------------- | ---------------- | ------------------ | ----------------------------- |
| 적 이동속도             | speed            | ×0.3               | 느리게 기어옴                 |
| 적 탄환 속도            | projectile speed | ×0.3               | 쉽게 회피 가능                |
| 적 공격 쿨다운          | attack timer     | ×0.3 (느리게 진행) | 적 공격 빈도 감소             |
| 적 스폰                 | spawn timer      | ×0.3 (느리게 진행) | 새 적 스폰 지연               |
| 플레이어 이동속도       | speed            | ×1.0               | **정상 유지**                 |
| 플레이어 무기 쿨다운    | weapon timer     | ×1.0               | **정상 유지**                 |
| 플레이어 무기 데미지    | damage           | ×1.5               | 증폭                          |
| 플레이어 크리티컬 확률  | critChance       | +0.30              | 기본 5% → 35%                 |
| XP 젬/코인 이동         | pickup flight    | ×1.0               | 마그넷 정상                   |
| 게임 타이머 (경과 시간) | elapsed          | ×1.0               | **정상 진행** (유리하지 않음) |

### 2.5 지속시간 & 패시브 연동

| 속성               | 기본값 | "크로노 오버클럭" 패시브 적용 시 |
| ------------------ | ------ | -------------------------------- |
| 슬로우 지속시간    | 3초    | 4초 (+1초)                       |
| 슬로우 배율        | 0.3×   | 0.3× (변동 없음)                 |
| 데미지 배율        | 1.5×   | 1.5× (변동 없음)                 |
| 크리 보너스        | +30%   | +30% (변동 없음)                 |
| 게이지 충전 보너스 | ×1.0   | ×1.2 (+20%)                      |

### 2.6 "크로노 오버클럭" 패시브

레벨업 시 선택 가능한 새 패시브로 추가:

```
ID: chrono_overclock
Name: Chrono Overclock
Max Level: 3
Level 1: 슬로우 +0.5초, 충전 +10%
Level 2: 슬로우 +1.0초, 충전 +20%
Level 3: 슬로우 +1.5초, 충전 +30%
```

---

## 3. 밸런스 수치 (balance.ts 상수)

```typescript
// ═══ § CHRONO HACK SYSTEM ═══

export const CHRONO_HACK = {
  // Gauge
  maxGauge: 100,
  chargePerTier1Kill: 1,
  chargePerTier2Kill: 2,
  chargePerTier3Kill: 3,
  chargePerBossKill: 20,

  // Activation
  slowDuration: 3.0, // seconds of slow-motion
  timeScale: 0.3, // enemy/bullet speed multiplier during slow
  playerTimeScale: 1.0, // player speed multiplier (unchanged)
  damageMultiplier: 1.5, // player weapon damage during slow
  critChanceBonus: 0.3, // +30% crit chance during slow

  // Visual
  edgeGlowColor: 0x00aaff, // blue glow on screen edges
  motionTrailAlpha: 0.4, // opacity of enemy motion trails
  bgColorShift: 0.3, // saturation reduction for background
  activationFlashDuration: 300, // ms for initial flash effect
} as const;

export const CHRONO_OVERCLOCK_PASSIVE: PassiveDef = {
  id: "chrono_overclock",
  name: "Chrono Overclock",
  maxLevel: 3,
  values: [0.5, 1.0, 1.5], // bonus slow duration (seconds)
  unit: "s",
  description: "+{v}s chrono duration, +charge speed",
  icon: "icon_passive_chrono",
};

export const CHRONO_OVERCLOCK_CHARGE_BONUS = [0.1, 0.2, 0.3] as const;
// chargePerKill *= (1 + CHRONO_OVERCLOCK_CHARGE_BONUS[level - 1])
```

### 밸런스 근거

**DPS 증폭 분석 (3초 슬로우)**:

| 무기                | 기본 DPS | 슬로우 중 DPS (×1.5) | 3초 추가 데미지 | 비고                        |
| ------------------- | -------- | -------------------- | --------------- | --------------------------- |
| Pistol Lv1          | 20       | 30                   | +30             | 크리 확률 상승으로 실질 +45 |
| Shotgun Lv1         | 32       | 48                   | +48             | 적이 느려서 전탄 명중       |
| Laser Lv1           | 32       | 48                   | +48             | 빔 관통 극대화              |
| Flame Lv1           | 36       | 54                   | +54             | 근접 유지 쉬움              |
| 다무기 빌드 (min 4) | ~120     | 180                  | +180            | 후반 기준                   |

**3초간 추가 DPS**: 약 30~180 (빌드에 따라). 적 HP가 2~3배 스케일링되는 후반에서 적절한 파워 스파이크.

**보스전 임팩트**: Mini Boss (800 HP) → 3초간 ~540 데미지 = 67% 즉사. 의도적 — 게이지를 보스에 맞춰 아끼는 전략 보상.

---

## 4. UI/UX 요구사항

### 4.1 크로노 게이지 바

- **위치**: 화면 하단 중앙, 조이스틱 위쪽 (체력바와 대칭)
- **크기**: 200x12px 가로 바
- **색상**:
  - 배경: 반투명 다크 블루 (`#0A1428`)
  - 채움: 그라디언트 시안→블루 (`#00FFFF` → `#0066FF`)
  - 100% 시: 글로우 펄스 애니메이션 (사용 가능 표시)
- **충전 중**: 킬 시 바가 살짝 바운스 (미세한 피드백)
- **텍스트**: 게이지 바 위에 "CHRONO" 라벨 (8px, 반투명)

### 4.2 발동 피드백

#### 발동 순간 (0~0.3초)

1. 화면 전체 짧은 화이트 플래시 (0.1초)
2. 화면 가장자리에서 안쪽으로 파란색 글로우 확산
3. 크로노 게이지 바가 급속 소진 애니메이션
4. "CHRONO HACK" 텍스트 화면 중앙에 0.5초간 표시 (글리치 폰트)
5. SFX: "시간 멈춤" 사운드 (역방향 리버브 + 전자음)

#### 슬로우 진행 중 (0.3~3.0초)

1. 화면 가장자리 파란색 비네팅 유지
2. 적/탄환에 모션 트레일 (잔상 효과)
3. 배경 채도 감소 (회색빛으로 변환)
4. 플레이어에게 밝은 시안 아우라
5. 게이지 바가 남은 시간을 표시 (3→0 카운트)
6. BGM 피치 다운 (0.3× 속도에 맞춤)

#### 종료 시

1. 화면 색조 정상 복귀 (0.3초 트랜지션)
2. 모션 트레일 제거
3. 시간 정상화 "뿅" SFX (피치 업)
4. 게이지 바 0%로 리셋, 다시 충전 시작

### 4.3 입력 영역

- **발동 탭 영역**: 화면 전체에서 다음을 제외:
  - 조이스틱 영역 (좌하단 200x200px)
  - 일시정지 버튼 (우상단 60x60px)
  - 레벨업 UI (level_up 페이즈 중 전체 비활성)
- **탭 감도**: 0.2초 이내 탭만 인식 (길게 누르기 방지)
- **시각적 힌트**: 게이지 100% 시 화면 우하단에 작은 "TAP" 글리치 텍스트

### 4.4 HUD 레이아웃 정리 (SPEC-030, 031, 032 통합)

```
┌─────────────────────────────────────────────┐
│ [HP Bar ████████████████]                    │ ← 최상단
│ [Neon Fragment: 大 吉 ___]                   │ ← SPEC-030
│ [Neon Buff: 火力 15s] [Food: 🍜 18s]        │ ← SPEC-030 + 031
│                                              │
│                                              │
│           (GAME AREA)                        │
│                                              │
│                                              │
│          [CHRONO HACK ███████░░░ 72%]        │ ← SPEC-032
│     [Joystick]                     [TAP]     │ ← 좌하단 조이스틱, 우하단 힌트
└─────────────────────────────────────────────┘
```

---

## 5. Core 모듈 설계

### 5.1 `src/core/ChronoHackCalc.ts`

```
ChronoHackCalc (Pure TypeScript — NO Phaser imports)
├─ addCharge(gauge, enemyTier, chronoOverclockLevel): number
├─ canActivate(gauge): boolean
├─ activate(gauge, chronoOverclockLevel): ChronoHackState
├─ tick(state, dt): { state, expired: boolean }
├─ getEnemyTimeScale(state): number         // 0.3 or 1.0
├─ getPlayerDamageMultiplier(state): number  // 1.5 or 1.0
├─ getCritChanceBonus(state): number         // 0.30 or 0.0
├─ getSlowDuration(chronoOverclockLevel): number // 3.0 + passive bonus
├─ getChargeMultiplier(chronoOverclockLevel): number // 1.0 + passive bonus
├─ isActive(state): boolean
└─ getRemainingFraction(state): number       // for UI gauge display
```

### 5.2 타입 정의 (`src/types/game.ts` 추가)

```typescript
// § CHRONO HACK

export interface ChronoHackState {
  gauge: number; // 0~100
  active: boolean; // true during slow-motion
  remaining: number; // seconds remaining of slow effect
  totalDuration: number; // total duration for this activation (for UI)
}
```

---

## 6. RunState 필드 추가

```typescript
export interface RunState {
  // ... existing fields ...

  // § Chrono Hack System (SPEC-032)
  chronoHack: ChronoHackState;
}
```

### RunStateManager 변경

`createInitialState()` 에 추가:

```typescript
chronoHack: {
  gauge: 0,
  active: false,
  remaining: 0,
  totalDuration: 0,
},
```

`tick()` 에 추가:

```typescript
// Tick chrono hack
if (state.chronoHack.active) {
  const chronoResult = tickChronoHack(state.chronoHack, dt);
  state.chronoHack = chronoResult.state;
  if (chronoResult.expired) {
    // emit: 'chrono_hack_expired'
  }
}
```

### 적 이동 시 적용

```typescript
// EnemyCalc / GameScene에서 적 이동 계산 시
const enemyTimeScale = getEnemyTimeScale(state.chronoHack);
enemy.x += enemy.vx * enemyTimeScale * dt;
enemy.y += enemy.vy * enemyTimeScale * dt;
```

### 적 탄환 이동 시 적용

```typescript
// ProjectileCalc에서 적 탄환 이동 계산 시
const bulletTimeScale = getEnemyTimeScale(state.chronoHack);
bullet.x += bullet.vx * bulletTimeScale * dt;
bullet.y += bullet.vy * bulletTimeScale * dt;
```

### 무기 데미지 적용

```typescript
// WeaponCalc에서 데미지 계산 시
let dmgMultiplier = 1.0 + passiveDamageBonus + metaDamageBonus;
dmgMultiplier *= getPlayerDamageMultiplier(state.chronoHack); // 1.0 or 1.5

let critChance = PLAYER_BASE.critChance + passiveCritBonus;
critChance += getCritChanceBonus(state.chronoHack); // 0.0 or 0.30
```

### 적 처치 시 게이지 충전

```typescript
// 적 사망 콜백에서
const chronoLevel = getPassiveLevel(state.player.passives, "chrono_overclock");
state.chronoHack.gauge = addCharge(
  state.chronoHack.gauge,
  enemy.tier,
  chronoLevel,
);
```

---

## 7. PASSIVES 레지스트리 추가

`src/config/balance.ts`의 `PASSIVES` 레코드에 추가:

```typescript
chrono_overclock: {
  id: 'chrono_overclock',
  name: 'Chrono Overclock',
  maxLevel: 3,
  values: [0.5, 1.0, 1.5],
  unit: 's',
  description: '+{v}s chrono slow, +charge speed',
  icon: 'icon_passive_chrono',
},
```

기존 12개 패시브 + 1 = 13개. `maxPassiveSlots: 6`은 유지 (선택의 여지).

---

## 8. 시스템 간 상호작용

### SPEC-030 (네온 사인 조합) 연동

- 슬로우 중 파편 필드 수명 **일시정지** (파편이 소멸하지 않음)
- 슬로우 중 파편 인벤토리 수명도 일시정지
- 이유: 슬로우 중 파편 수집 기회 제공, 조합 달성 용이

### SPEC-031 (대배당) 연동

- 슬로우 중 대배당 주문 시간은 **정상 진행** (3초 그대로)
- 이유: 슬로우 중 안전하게 주문 가능 = 크로노 핵의 전략적 활용처
- 대배당 쿨다운은 실시간 기준 (슬로우 영향 없음)

### 보스전 연동

- 보스 HP, 이동속도에 슬로우 적용
- 보스 특수 공격 타이머에도 슬로우 적용 (charge_dash, missile_barrage 등)
- 보스 처치 시 게이지 +20% (전투 중 재발동 가능)

---

## 9. 구현 체크리스트

### Phase 1: Core Logic

- [ ] `src/types/game.ts` — ChronoHackState 타입 추가
- [ ] `src/types/game.ts` — RunState에 chronoHack 필드 추가
- [ ] `src/config/balance.ts` — CHRONO_HACK 상수 추가
- [ ] `src/config/balance.ts` — PASSIVES에 chrono_overclock 추가
- [ ] `src/core/ChronoHackCalc.ts` — 순수 로직 구현 (Phaser 의존 금지)
- [ ] `src/core/RunStateManager.ts` — createInitialState, tick 수정
- [ ] `tests/core/ChronoHackCalc.test.ts` — 유닛 테스트 (충전, 발동, 틱, 패시브 연동)

### Phase 2: Game Scene Integration

- [ ] `src/scenes/GameScene.ts` — 탭 입력 감지 (조이스틱 외 영역)
- [ ] `src/scenes/GameScene.ts` — 적/탄환 이동에 timeScale 적용
- [ ] `src/scenes/GameScene.ts` — 무기 데미지/크리에 크로노 배율 적용
- [ ] `src/scenes/GameScene.ts` — 적 처치 시 게이지 충전
- [ ] `src/scenes/GameScene.ts` — 스폰 타이머에 timeScale 적용

### Phase 3: UI/UX

- [ ] 크로노 게이지 바 (하단 중앙, 200x12)
- [ ] 100% 글로우 펄스 애니메이션
- [ ] 발동 시 풀스크린 이펙트 (플래시 + 글로우 + 텍스트)
- [ ] 슬로우 중 비네팅 + 모션 트레일 + 배경 색조 변환
- [ ] "TAP" 힌트 텍스트 (100% 시)
- [ ] 남은 시간 카운트다운 표시

### Phase 4: Art & Audio

- [ ] 크로노 게이지 바 UI 텍스처
- [ ] `icon_passive_chrono` (패시브 아이콘, 32x32)
- [ ] 시간 멈춤 SFX (역리버브 + 전자음)
- [ ] 시간 복귀 SFX (피치 업 워프)
- [ ] BGM 피치/템포 다운 처리 (Web Audio API)

### Phase 5: Polish & Balance

- [ ] 적 스폰률 대비 충전 속도 시뮬레이션 (목표: 30~40초/회)
- [ ] 보스전에서의 DPS 스파이크 검증 (너무 빨리 녹지 않는지)
- [ ] 멀티터치 탭 오작동 테스트 (조이스틱 + 탭 동시)
- [ ] 저사양 기기 슬로우 이펙트 성능 검증
- [ ] 크로노 오버클럭 패시브 밸런스 (Lv3에서 4.5초 슬로우 = 과하지 않은지)

---

## 10. 리스크 & 대안

| 리스크                                | 영향           | 대안                                             |
| ------------------------------------- | -------------- | ------------------------------------------------ |
| 슬로우 중 FPS 저하 (모션 트레일)      | 성능           | 트레일을 2프레임 잔상으로 제한, 저사양 시 비활성 |
| 게이지 충전이 너무 빠름 → 상시 슬로우 | 밸런스 붕괴    | 충전량 감소 (Tier1: 1%→0.5%)                     |
| 보스를 크로노 핵으로 즉사             | 보스 위상 하락 | 보스에게 슬로우 저항 (timeScale 0.5 대신 0.3)    |
| 탭 오인식 (실수 발동)                 | 좌절           | 더블탭 요구, 또는 "크로노 발동" 확인 UI          |
| 슬로우 중 신규 적이 정상속도로 스폰   | 일관성         | 스폰 타이머도 슬로우 적용 (이미 설계에 포함)     |
| BGM 피치 다운이 어색                  | 몰입 깨짐      | 별도 슬로우 전용 BGM 트랙 재생                   |

---

## 11. 향후 확장

- **크로노 콤보**: 슬로우 중 처치 수에 따라 추가 보너스 (10킬 = +1초 연장)
- **크로노 진화**: 크로노 오버클럭 Lv3 + 특정 무기 = "시간 정지" (0.5초간 완전 정지)
- **크로노 리플**: 슬로우 종료 시 범위 데미지 폭발 (축적된 에너지 방출)
- **멀티플레이어**: 크로노 핵이 아군에게도 슬로우 면역 부여 (협동 모드)
- **네온 사인 연동 (SPEC-030)**: 大+龍 = "大龍" 조합 → 크로노 게이지 즉시 50% 충전
