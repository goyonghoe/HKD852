# SPEC-031: Dai Pai Dong Buff Station (대배당 버프 스테이션)

> **게임**: Neon Survivors (네온 서바이버스)
> **버전**: v1.0
> **작성**: Game Designer
> **대상**: Programmer, Balance Designer (구현용)
> **우선순위**: High
> **의존성**: RunState, balance.ts, SpawnManager, CollisionManager

---

## 1. 개요

맵에 2~3개의 대배당(大排檔, 노점 식당) 오브젝트가 스폰된다. 플레이어가 3초간 근처에 머물면 랜덤 음식 1개를 획득하여 임시 버프를 받는다. 홍콩 심수포의 상징적인 길거리 음식 문화를 게임 메카닉으로 구현한 **환경 상호작용 시스템**.

### 핵심 경험

- **위험-보상 딜레마**: 적이 몰려오는 중에 3초간 가만히 있을 것인가?
- **전략적 포지셔닝**: 대배당 위치를 기억하고 적절한 타이밍에 방문
- **홍콩 문화 체험**: 완탕면, 밀크티, 에그타르트 등 실제 심수포 음식
- **보상 간격 보완**: 레벨업 사이 "보너스 보상" 역할로 코어 루프 풍성

### 디자인 원칙 연계

- **공정한 실패**: 피격 시 카운터 리셋 — "욕심부렸다"가 명확
- **보상 간격**: 60초 쿨다운으로 적절한 간격 유지
- **점진적 복잡도**: 초반에는 안전하게 이용, 후반에는 적 사이에서 음식 먹기가 도전

---

## 2. 상세 메카닉

### 2.1 대배당 스폰

| 속성          | 값                                 | 비고                        |
| ------------- | ---------------------------------- | --------------------------- |
| 스폰 수       | 2~3개 (맵 크기에 따라)             | 런 시작 시 고정 배치        |
| 배치 규칙     | 플레이어 시작점에서 200~500px 거리 | 너무 가깝지도, 멀지도 않게  |
| 최소 간격     | 대배당끼리 300px 이상              | 몰려있으면 의미 없음        |
| 시각 크기     | 96x64px (포장마차 스프라이트)      | 반투명 네온 간판 + 포장마차 |
| 충돌          | 없음 (통과 가능)                   | 플레이어/적 모두 통과       |
| 상호작용 반경 | 60px (대배당 중심 기준)            | 마그넷과 무관               |

### 2.2 상호작용 메카닉

1. 플레이어가 대배당 상호작용 반경(60px) 내에 진입
2. "주문 중..." 프로그레스 바 표시 (3초)
3. 3초 완료 → 랜덤 음식 1개 획득 + 즉시 효과 발동
4. 해당 대배당 60초 쿨다운 (비활성 상태)

#### 중단 조건

- **피격**: 프로그레스 바 즉시 리셋 (0으로 돌아감)
- **범위 이탈**: 프로그레스 바 유지 (2초 이내 재진입 시 이어서 충전, 2초 초과 시 리셋)
- **이미 음식 효과 보유 중**: 정상 상호작용 가능 (새 음식이 이전 효과 교체)

### 2.3 음식 메뉴 6종

| ID                 | 이름 (중문) | 이름 (한글)  | 효과                   | 수치                 | 지속시간 | 아이콘 색상 |
| ------------------ | ----------- | ------------ | ---------------------- | -------------------- | -------- | ----------- |
| `food_wonton`      | 雲吞麵      | 완탕면       | HP 즉시 회복           | maxHp의 30%          | 즉시     | `#FFF5E0`   |
| `food_friedrice`   | 鑊氣炒飯    | 볶음밥       | 화염 데미지 +50%       | ×1.5 (화염계 무기만) | 20초     | `#FF6B35`   |
| `food_milktea`     | 鴛鴦        | 밀크티(원앙) | 이동속도+공격속도 +25% | ×1.25                | 20초     | `#D4A574`   |
| `food_eggtart`     | 蛋撻        | 에그타르트   | XP 보너스 +100%        | ×2.0                 | 15초     | `#FFD700`   |
| `food_fishball`    | 魚蛋        | 피쉬볼       | 관통 +3 (모든 무기)    | +3 pierce            | 20초     | `#F5DEB3`   |
| `food_chickenfeet` | 鳳爪        | 닭발         | 아머 +5 (데미지 감소)  | +5 flat armor        | 30초     | `#CD853F`   |

> 색상값은 `src/config/colors.ts`에 `DAI_PAI_DONG` 섹션으로 추가할 것.

### 2.4 음식 효과 규칙

- **동시 활성**: 최대 1개 음식 효과만 유지
- **새 음식 획득 시**: 이전 음식 효과 즉시 교체 (스택 불가)
- **네온사인 버프(SPEC-030)와는 독립**: 네온 버프 + 음식 효과 동시 가능
- **사망 시**: 모든 음식 효과 소멸
- **확률 분배**: 6종 균등 확률 (각 16.67%)

### 2.5 대배당 상태 머신

```
[Active] ──(플레이어 진입)──→ [Ordering] ──(3초 완료)──→ [Cooldown]
                                  │                          │
                              (피격/이탈)              (60초 경과)
                                  │                          │
                                  ↓                          ↓
                              [Active] ←────────────── [Active]
```

- **Active**: 네온 간판 밝게 빛남, 연기 파티클 (음식 조리 중)
- **Ordering**: 프로그레스 바 표시, 간판 깜빡임
- **Cooldown**: 간판 어둡게 (반투명), "CLOSED" 텍스트, 남은 쿨다운 작은 숫자 표시

### 2.6 대배당 위치 결정 알고리즘

```
1. 맵 영역을 3등분 (상/중/하)
2. 각 영역에서 랜덤 X좌표 선택 (화면 가장자리 50px 마진 제외)
3. 맵 3등분 중 랜덤 2~3개 영역 선택
4. 각 선택 영역에 대배당 1개 배치
5. 대배당끼리 300px 최소 거리 검증
6. 플레이어 시작점(360, 640)에서 200px 이내 금지
```

---

## 3. 밸런스 수치 (balance.ts 상수)

```typescript
// ═══ § DAI PAI DONG BUFF STATION ═══

export const DAI_PAI_DONG = {
  // Spawn
  minCount: 2,
  maxCount: 3,
  minDistanceBetween: 300, // px between stations
  minDistanceFromPlayer: 200, // px from start position
  maxDistanceFromPlayer: 500, // px from start position
  interactionRadius: 60, // px to trigger ordering

  // Ordering
  orderDuration: 3.0, // seconds to complete order
  leaveGracePeriod: 2.0, // seconds before progress resets on leave
  cooldownDuration: 60, // seconds before same station reusable

  // Visual
  spriteWidth: 96,
  spriteHeight: 64,
  progressBarWidth: 80,
  progressBarHeight: 8,
} as const;

export type DaiPaiDongFoodId =
  | "food_wonton"
  | "food_friedrice"
  | "food_milktea"
  | "food_eggtart"
  | "food_fishball"
  | "food_chickenfeet";

export interface FoodDef {
  id: DaiPaiDongFoodId;
  nameCn: string;
  nameKo: string;
  nameEn: string;
  buffType: string;
  magnitude: number; // multiplier or flat value
  duration: number; // seconds (0 = instant)
  isInstant: boolean; // true for wonton (HP heal, no lingering buff)
  description: string;
}

export const FOODS: Record<DaiPaiDongFoodId, FoodDef> = {
  food_wonton: {
    id: "food_wonton",
    nameCn: "雲吞麵",
    nameKo: "완탕면",
    nameEn: "Wonton Noodles",
    buffType: "heal_percent",
    magnitude: 0.3, // 30% maxHp
    duration: 0,
    isInstant: true,
    description: "Instantly restore 30% HP",
  },
  food_friedrice: {
    id: "food_friedrice",
    nameCn: "鑊氣炒飯",
    nameKo: "볶음밥",
    nameEn: "Wok Hei Fried Rice",
    buffType: "fire_damage_bonus",
    magnitude: 0.5, // +50% fire/flame weapon damage
    duration: 20,
    isInstant: false,
    description: "+50% fire damage for 20s",
  },
  food_milktea: {
    id: "food_milktea",
    nameCn: "鴛鴦",
    nameKo: "밀크티",
    nameEn: "Yuanyang Milk Tea",
    buffType: "speed_attack_boost",
    magnitude: 0.25, // +25% move speed + attack speed
    duration: 20,
    isInstant: false,
    description: "+25% move & attack speed for 20s",
  },
  food_eggtart: {
    id: "food_eggtart",
    nameCn: "蛋撻",
    nameKo: "에그타르트",
    nameEn: "Egg Tart",
    buffType: "xp_multiplier",
    magnitude: 1.0, // +100% XP (total ×2)
    duration: 15,
    isInstant: false,
    description: "XP ×2 for 15s",
  },
  food_fishball: {
    id: "food_fishball",
    nameCn: "魚蛋",
    nameKo: "피쉬볼",
    nameEn: "Fish Balls",
    buffType: "pierce_bonus",
    magnitude: 3, // +3 pierce all weapons
    duration: 20,
    isInstant: false,
    description: "+3 pierce for 20s",
  },
  food_chickenfeet: {
    id: "food_chickenfeet",
    nameCn: "鳳爪",
    nameKo: "닭발",
    nameEn: "Chicken Feet",
    buffType: "armor_bonus",
    magnitude: 5, // +5 flat armor
    duration: 30,
    isInstant: false,
    description: "+5 armor for 30s",
  },
} as const;
```

### 밸런스 근거

| 음식                | 효과 크기                  | 기존 시스템 비교                | 위험도 (3초 체류)             |
| ------------------- | -------------------------- | ------------------------------- | ----------------------------- |
| 완탕면 (HP 30%)     | 30 HP (base 100 기준)      | Nano Regen Lv5 = 4/초 → 7.5초분 | 중 — HP 필요할 때 = 이미 위험 |
| 볶음밥 (+50% 화염)  | 화염DPS 36→54 (+18)        | Power Cell Lv3 = +24%           | 중 — 화염 무기 빌드 전용      |
| 밀크티 (+25% 속도)  | 150→187.5 px/s, 공속 ×1.25 | Turbo Legs Lv2 = +20%           | 중 — 범용                     |
| 에그타르트 (XP 2배) | 15초 동안 ~30~50 XP 추가   | Data Leech Lv5 = +50%           | 중 — 초반 가치 높음           |
| 피쉬볼 (+3 관통)    | 전 무기 관통 +3            | Multi-Shot Lv3 = +3 투사체      | 높음 — 레이저/부메랑에 시너지 |
| 닭발 (+5 아머)      | 30초, -5 데미지            | Shield Layer Lv4 = -5           | 낮음 — 방어적, 긴 지속        |

**10분 런 동안 이용 횟수**: 대배당 3개 × (60초 쿨다운) ≈ 최대 15~18회 방문 가능. 실제로는 이동/전투로 인해 약 6~10회 수준.

---

## 4. UI/UX 요구사항

### 4.1 대배당 시각

- **기본 상태 (Active)**: 작은 포장마차, 네온 간판(밝은 빨간+노란), 연기 파티클
- **비활성 (Cooldown)**: 간판 어둡게, 연기 없음, 회색조 오버레이, "CLOSED" 텍스트
- **미니맵 아이콘**: 작은 포크&나이프 아이콘 (Active=노란, Cooldown=회색)

### 4.2 프로그레스 바

- **위치**: 대배당 오브젝트 위 (상단 8px)
- **크기**: 80x8px
- **색상**: 배경 = 반투명 검정, 채움 = 따뜻한 오렌지 (`#FF9F43`)
- **텍스트**: 프로그레스 바 위에 "주문 중..." (10px 폰트)
- **완료 시**: 프로그레스 바가 초록으로 변하며 1프레임 플래시

### 4.3 음식 획득 연출

1. **획득 직후**: 음식 아이콘이 대배당에서 플레이어 방향으로 날아감 (0.3초)
2. **버프 표시**: 플레이어 위에 음식 아이콘 (24x24) 표시 + 음식 이름 1초간 페이드
3. **HUD 아이콘**: 화면 좌상단 (네온 버프 아래)에 음식 아이콘 + 남은 시간

### 4.4 음식 버프 타이머

- **위치**: 화면 좌상단, 네온 버프 아이콘 아래
- **표시**: 음식 아이콘 (28x28) + 남은 시간 (정수 초)
- **종료 3초 전**: 깜빡임
- **즉시 효과 (완탕면)**: 하트 아이콘이 날아가는 것만 표시 (타이머 없음)

### 4.5 접근성

- 프로그레스 바에 숫자 카운트 병행 표시 (색상만으로 구별 금지)
- 대배당 근처 시 조이스틱 진동 피드백 (가능 시)

---

## 5. Core 모듈 설계

### 5.1 `src/core/DaiPaiDongCalc.ts`

```
DaiPaiDongCalc (Pure TypeScript — NO Phaser imports)
├─ generateStationPositions(mapWidth, mapHeight, playerStart): DaiPaiDongStation[]
├─ isInRange(playerX, playerY, station): boolean
├─ tickOrdering(station, dt, playerInRange, playerHit): OrderTickResult
├─ completeOrder(station): FoodDef
├─ rollFood(): DaiPaiDongFoodId
├─ applyFoodBuff(currentBuff, food): ActiveFoodBuff
├─ tickFoodBuff(buff, dt): { buff, expired: boolean }
├─ tickStationCooldowns(stations, dt): void
├─ getFireDamageMultiplier(buff): number
├─ getSpeedMultiplier(buff): number
├─ getAttackSpeedMultiplier(buff): number
├─ getXpMultiplier(buff): number
├─ getPierceBonus(buff): number
├─ getArmorBonus(buff): number
└─ isStationActive(station): boolean
```

### 5.2 타입 정의 (`src/types/game.ts` 추가)

```typescript
// § DAI PAI DONG BUFF STATION

export type DaiPaiDongState = "active" | "ordering" | "cooldown";

export interface DaiPaiDongStation {
  id: string;
  x: number;
  y: number;
  state: DaiPaiDongState;
  orderProgress: number; // 0~3 seconds of ordering
  leaveTimer: number; // grace period countdown when player leaves range
  cooldownTimer: number; // seconds remaining in cooldown
}

export interface ActiveFoodBuff {
  foodId: DaiPaiDongFoodId;
  buffType: string;
  magnitude: number;
  remaining: number; // seconds remaining (0 for instant effects)
  nameCn: string; // for UI display
  nameKo: string;
}

export interface OrderTickResult {
  completed: boolean;
  progress: number;
  interrupted: boolean; // true if hit during ordering
}
```

---

## 6. RunState 필드 추가

```typescript
export interface RunState {
  // ... existing fields ...

  // § Dai Pai Dong System (SPEC-031)
  daiPaiDongStations: DaiPaiDongStation[]; // 2-3 stations on the map
  activeFoodBuff: ActiveFoodBuff | null; // currently active food buff
}
```

### RunStateManager 변경

`createInitialState()` 에 추가:

```typescript
daiPaiDongStations: generateStationPositions(
  GAME_WIDTH * 3,   // world width (if scrolling) or GAME_WIDTH
  GAME_HEIGHT * 3,  // world height (if scrolling) or GAME_HEIGHT
  { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
),
activeFoodBuff: null,
```

`tick()` 에 추가:

```typescript
// Tick dai pai dong station cooldowns
tickStationCooldowns(state.daiPaiDongStations, dt);

// Tick food buff
if (state.activeFoodBuff && state.activeFoodBuff.remaining > 0) {
  state.activeFoodBuff.remaining -= dt;
  if (state.activeFoodBuff.remaining <= 0) {
    state.activeFoodBuff = null;
    // emit: 'food_buff_expired'
  }
}
```

### damagePlayer() 연동

`damagePlayer()` 에서 피격 시:

```typescript
// Interrupt any active dai pai dong ordering
for (const station of state.daiPaiDongStations) {
  if (station.state === "ordering") {
    station.orderProgress = 0;
    station.state = "active";
    // emit: 'order_interrupted'
  }
}
```

---

## 7. 무기 시스템 연동

### 볶음밥 (화염 데미지 +50%)

적용 대상 무기: `flamethrower`, `evo_flamethrower`

```typescript
// WeaponCalc에서
const isFireWeapon =
  weaponId === "flamethrower" || weaponId === "evo_flamethrower";
if (isFireWeapon && activeFoodBuff?.buffType === "fire_damage_bonus") {
  damage *= 1 + activeFoodBuff.magnitude;
}
```

### 밀크티 (공격속도 +25%)

모든 무기의 fireRate에 적용:

```typescript
// WeaponCalc에서
let effectiveFireRate = weapon.fireRate;
if (activeFoodBuff?.buffType === "speed_attack_boost") {
  effectiveFireRate *= 1 + activeFoodBuff.magnitude;
}
```

### 피쉬볼 (관통 +3)

모든 무기의 pierce에 적용:

```typescript
// ProjectileCalc에서
let effectivePierce = weapon.pierce + passivePierceBonus;
if (activeFoodBuff?.buffType === "pierce_bonus") {
  effectivePierce += activeFoodBuff.magnitude;
}
```

---

## 8. 구현 체크리스트

### Phase 1: Core Logic

- [ ] `src/types/game.ts` — DaiPaiDongStation, ActiveFoodBuff, OrderTickResult 타입 추가
- [ ] `src/types/game.ts` — RunState에 daiPaiDongStations, activeFoodBuff 추가
- [ ] `src/config/balance.ts` — DAI_PAI_DONG, FOODS 상수 추가
- [ ] `src/config/colors.ts` — DAI_PAI_DONG 색상 섹션 추가
- [ ] `src/core/DaiPaiDongCalc.ts` — 순수 로직 구현 (Phaser 의존 금지)
- [ ] `src/core/RunStateManager.ts` — createInitialState, tick, damagePlayer 수정
- [ ] `tests/core/DaiPaiDongCalc.test.ts` — 유닛 테스트 (스폰, 상호작용, 쿨다운, 버프)

### Phase 2: Game Scene Integration

- [ ] `src/scenes/GameScene.ts` — 대배당 오브젝트 렌더링
- [ ] `src/scenes/GameScene.ts` — 플레이어 근접 감지 + 프로그레스 바
- [ ] `src/scenes/GameScene.ts` — 음식 버프 적용 (무기 데미지, 이동속도, XP 등)
- [ ] `src/scenes/GameScene.ts` — 피격 시 주문 중단 연동

### Phase 3: UI/UX

- [ ] 프로그레스 바 렌더링 (대배당 위)
- [ ] 음식 획득 연출 (아이콘 날아감)
- [ ] 음식 버프 HUD 아이콘 + 타이머
- [ ] 대배당 상태 시각화 (Active/Cooldown)

### Phase 4: Art & Audio

- [ ] 대배당 스프라이트 (96x64, Active + Cooldown 상태)
- [ ] 음식 아이콘 6종 (32x32)
- [ ] 주문 완료 SFX (딩! 벨소리)
- [ ] 주문 중단 SFX (음식 떨어지는 소리)
- [ ] 연기 파티클 (대배당 Active 상태)

### Phase 5: Polish & Balance

- [ ] 3초 주문 시간 체감 테스트 (너무 길면 2.5초, 너무 짧으면 3.5초)
- [ ] 쿨다운 60초 적절성 검증
- [ ] 음식 효과 밸런스 (DPS/생존에 미치는 영향 시뮬레이션)
- [ ] 대배당 배치 알고리즘 플레이테스트

---

## 9. 리스크 & 대안

| 리스크                                     | 영향        | 대안                                      |
| ------------------------------------------ | ----------- | ----------------------------------------- |
| 3초 체류가 너무 위험 → 아무도 안 씀        | 시스템 사장 | 2초로 단축, 또는 대배당 근처 적 스폰 억제 |
| 음식 효과가 너무 강력 → 대배당 중심 플레이 | 단조로움    | 효과 약화 또는 쿨다운 90초로 증가         |
| 대배당 위치가 안 좋으면 접근 자체 불가     | 불공정      | 맵 스크롤 시 새 대배당 동적 생성 고려     |
| 피격 리셋이 너무 가혹                      | 좌절감      | 피격 시 50% 감소 (완전 리셋 대신) 옵션    |
| 대배당이 적 무리에 파묻힘                  | 접근 불가   | 대배당 주변 40px 적 스폰 금지 구역        |

---

## 10. 향후 확장

- **메뉴 선택**: 쿨다운 없이 코인으로 원하는 음식 구매 (상위 대배당)
- **업그레이드 대배당**: 메타 프로그레션으로 주문 시간 단축 (3초→2초)
- **요리사 NPC**: 특정 조건 달성 시 대배당에 보스급 NPC 등장 → 특별 음식
- **네온 파편 연동 (SPEC-030)**: 대배당에서 코인으로 파편 구매 가능
- **크로노 핵 연동 (SPEC-032)**: 슬로우모션 중 주문 시간 변동 없음 (유리)
