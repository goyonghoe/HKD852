# SPEC-030: Neon Sign Combo System (네온 사인 조합 시스템)

> **게임**: Neon Survivors (네온 서바이버스)
> **버전**: v1.0
> **작성**: Game Designer
> **대상**: Programmer, Balance Designer (구현용)
> **우선순위**: High
> **의존성**: 적 처치 드롭 시스템, RunState, balance.ts

---

## 1. 개요

적 처치 시 일정 확률로 한자(漢字) 네온 파편이 드롭된다. 파편 2~3개를 수집하면 "네온 사인"이 완성되어 강력한 임시 버프가 발동한다. 심수포(深水埗)의 실제 네온 간판 문화를 게임 메카닉으로 녹여낸 **차별화 핵심 시스템**.

### 핵심 경험

- **수집의 긴장감**: 파편은 20초 후 소멸 — 빠르게 모아야 한다
- **전략적 선택**: 어떤 파편을 보유하고 어떤 것을 포기할지 판단
- **도파민 러시**: 조합 완성 시 네온 글자가 화면에 크게 빛나며 즉시 강력한 버프
- **수집 도감**: 발견한 조합을 기록하여 메타 플레이 욕구 자극

### 디자인 원칙 연계

- **보상 간격**: 파편 드롭 확률 조정으로 15~30초마다 파편 1개, 60~90초마다 조합 1회 완성
- **점진적 복잡도**: 2파편 조합부터 학습 → 3파편 레어 조합은 후반 발견
- **카운터 페어**: 파편 소멸 타이머 vs 럭 패시브로 소멸 시간 연장

---

## 2. 상세 메카닉

### 2.1 파편 드롭

| 속성                  | 값                                    | 비고                         |
| --------------------- | ------------------------------------- | ---------------------------- |
| 드롭 확률 (Tier 1 적) | 3%                                    | 가장 흔한 적 — 수량으로 보정 |
| 드롭 확률 (Tier 2 적) | 6%                                    | 중급 적                      |
| 드롭 확률 (Tier 3 적) | 12%                                   | 엘리트 적                    |
| 드롭 확률 (보스)      | 100% (2개)                            | 보스는 반드시 파편 2개 드롭  |
| 럭 보너스             | `dropChance × (1 + luckPassiveValue)` | 럭 패시브 연동               |
| 파편 풀               | 6종 균등 확률 (각 16.67%)             | 편향 없음                    |

파편이 드롭되면 적 사망 위치에 네온 빛나는 한자 아이콘이 생성된다. 마그넷 범위 내 자동 수집.

### 2.2 파편 6종

| ID          | 한자 | 의미   | 네온 색상 (hex) | 시각 설명 |
| ----------- | ---- | ------ | --------------- | --------- |
| `frag_da`   | 大   | 크다   | `#FF4444`       | 빨간 네온 |
| `frag_ji`   | 吉   | 길하다 | `#FFD700`       | 금색 네온 |
| `frag_huo`  | 火   | 불     | `#FF6B00`       | 주황 네온 |
| `frag_li`   | 力   | 힘     | `#00FFAA`       | 청록 네온 |
| `frag_jin`  | 金   | 금     | `#FFEE00`       | 노란 네온 |
| `frag_long` | 龍   | 용     | `#AA00FF`       | 보라 네온 |

> 색상값은 `src/config/colors.ts`에 `NEON_FRAGMENT` 섹션으로 추가할 것.

### 2.3 파편 보유 규칙

- **최대 보유**: 3개
- **3개 초과 수집 시**: 가장 오래된 파편이 자동 제거됨 (FIFO)
- **파편 수명**: 20초 (필드 위에 놓인 채로 카운트다운, 수집 후에도 인벤토리에서 20초)
- **럭 패시브 연동**: 파편 수명 = `BASE_LIFETIME × (1 + luckPassiveValue × 0.5)` → 럭 최대(0.4) 시 24초
- **사망 시**: 모든 보유 파편 소멸

### 2.4 조합 테이블

#### 2파편 조합 (일반)

| ID              | 조합  | 네온사인 | 버프 효과                                      | 지속시간 |
| --------------- | ----- | -------- | ---------------------------------------------- | -------- |
| `combo_daji`    | 大+吉 | **大吉** | 럭 2배 (드롭 확률, 업그레이드 레어도)          | 30초     |
| `combo_huoli`   | 火+力 | **火力** | 무기 데미지 2배                                | 15초     |
| `combo_jinlong` | 金+龍 | **金龍** | 코인 드롭량 3배, 코인 드롭 확률 100%           | 20초     |
| `combo_dali`    | 大+力 | **大力** | 넉백 효과 3배                                  | 25초     |
| `combo_huolong` | 火+龍 | **火龍** | 플레이어 주변 120px 화염 오라 (초당 15 데미지) | 20초     |
| `combo_jijin`   | 吉+金 | **吉金** | 크리티컬 확률 100%, 크리티컬 배율 +0.5         | 25초     |

#### 3파편 조합 (레어)

| ID                | 조합     | 네온사인   | 버프 효과                          | 지속시간 |
| ----------------- | -------- | ---------- | ---------------------------------- | -------- |
| `combo_dahuoli`   | 大+火+力 | **大火力** | ALL 무기 데미지 3배                | 10초     |
| `combo_jinjilong` | 金+吉+龍 | **金吉龍** | ALL 드롭 5배 (XP, 코인, 파편 포함) | 15초     |

### 2.5 조합 매칭 로직

1. 파편 수집 시 현재 보유 파편 셋으로 가능한 조합 검사
2. **3파편 조합 우선 매칭** → 매칭 안 되면 2파편 조합 검사
3. 2파편 조합이 여러 개 가능한 경우: 먼저 수집된 파편 기준으로 매칭 (FIFO)
4. 조합 성공 시 사용된 파편 제거, 남은 파편은 유지
5. 조합 성공 즉시 버프 발동 (겹치지 않음 — 새 조합 시 이전 네온사인 버프 교체)

### 2.6 네온사인 버프 발동

- **동시 활성 버프**: 최대 1개 (새 조합 완성 시 이전 버프 즉시 교체)
- **발동 시 시각 효과**:
  - 화면 중앙에 완성된 네온사인 한자가 1.5초간 크게 표시 (글로우 + 페이드)
  - 플레이어 위에 작은 네온사인 아이콘 지속 표시 (버프 지속 중)
  - 화면 가장자리에 버프 색상 비네팅
- **발동 시 SFX**: 전기 "찌지직" + 네온관 점등 사운드
- **버프 종료 시**: 네온사인 깨지는 이펙트 + 사운드

---

## 3. 밸런스 수치 (balance.ts 상수)

```typescript
// ═══ § NEON SIGN COMBO SYSTEM ═══

export const NEON_FRAGMENT = {
  // Drop chances per enemy tier
  dropChanceTier1: 0.03,
  dropChanceTier2: 0.06,
  dropChanceTier3: 0.12,
  dropChanceBoss: 1.0,
  bossDropCount: 2,

  // Fragment behavior
  fieldLifetime: 20, // seconds on the ground before despawn
  inventoryLifetime: 20, // seconds after pickup before expiry
  maxHeld: 3, // max fragments in inventory
  magnetPickup: true, // affected by magnet radius
  luckLifetimeScale: 0.5, // lifetime bonus = luckValue * this

  // Fragment types
  types: [
    "frag_da",
    "frag_ji",
    "frag_huo",
    "frag_li",
    "frag_jin",
    "frag_long",
  ] as const,
} as const;

export interface NeonComboRecipe {
  id: string;
  fragments: string[]; // required fragment IDs (order doesn't matter)
  signName: string; // display name (한자)
  signNameEn: string; // English display
  buffType: string; // buff identifier
  duration: number; // seconds
  magnitude: number; // buff multiplier or flat value
  rarity: "common" | "rare";
  description: string;
}

export const NEON_COMBOS: readonly NeonComboRecipe[] = [
  // ── 2-fragment combos (common) ──
  {
    id: "combo_daji",
    fragments: ["frag_da", "frag_ji"],
    signName: "大吉",
    signNameEn: "Great Fortune",
    buffType: "luck_multiplier",
    duration: 30,
    magnitude: 2.0,
    rarity: "common",
    description: "Luck ×2 for 30s",
  },
  {
    id: "combo_huoli",
    fragments: ["frag_huo", "frag_li"],
    signName: "火力",
    signNameEn: "Firepower",
    buffType: "damage_multiplier",
    duration: 15,
    magnitude: 2.0,
    rarity: "common",
    description: "Weapon damage ×2 for 15s",
  },
  {
    id: "combo_jinlong",
    fragments: ["frag_jin", "frag_long"],
    signName: "金龍",
    signNameEn: "Golden Dragon",
    buffType: "coin_multiplier",
    duration: 20,
    magnitude: 3.0,
    rarity: "common",
    description: "Coin drops ×3, 100% coin drop for 20s",
  },
  {
    id: "combo_dali",
    fragments: ["frag_da", "frag_li"],
    signName: "大力",
    signNameEn: "Great Strength",
    buffType: "knockback_multiplier",
    duration: 25,
    magnitude: 3.0,
    rarity: "common",
    description: "Knockback ×3 for 25s",
  },
  {
    id: "combo_huolong",
    fragments: ["frag_huo", "frag_long"],
    signName: "火龍",
    signNameEn: "Fire Dragon",
    buffType: "fire_aura",
    duration: 20,
    magnitude: 15, // DPS of aura
    rarity: "common",
    description: "Fire aura (120px, 15 DPS) for 20s",
  },
  {
    id: "combo_jijin",
    fragments: ["frag_ji", "frag_jin"],
    signName: "吉金",
    signNameEn: "Lucky Gold",
    buffType: "guaranteed_crit",
    duration: 25,
    magnitude: 0.5, // bonus crit multiplier on top of 100% crit
    rarity: "common",
    description: "100% crit + crit damage +0.5 for 25s",
  },

  // ── 3-fragment combos (rare) ──
  {
    id: "combo_dahuoli",
    fragments: ["frag_da", "frag_huo", "frag_li"],
    signName: "大火力",
    signNameEn: "Maximum Firepower",
    buffType: "damage_multiplier",
    duration: 10,
    magnitude: 3.0,
    rarity: "rare",
    description: "ALL weapon damage ×3 for 10s",
  },
  {
    id: "combo_jinjilong",
    fragments: ["frag_jin", "frag_ji", "frag_long"],
    signName: "金吉龍",
    signNameEn: "Golden Fortune Dragon",
    buffType: "all_drop_multiplier",
    duration: 15,
    magnitude: 5.0,
    rarity: "rare",
    description: "ALL drops ×5 for 15s",
  },
] as const;

export const NEON_AURA = {
  fireAuraRadius: 120, // px
  fireAuraDps: 15, // damage per second
  fireAuraTickRate: 0.25, // damage tick every 0.25s
} as const;
```

### 밸런스 근거

| 조합                | 예상 DPS 영향            | 위험도           | 발동 빈도 |
| ------------------- | ------------------------ | ---------------- | --------- |
| 大吉 (럭 2배)       | 간접 (드롭 개선)         | 낮음             | ~90초마다 |
| 火力 (데미지 2배)   | 직접 2배 → 15초 = 짧음   | 중간             | ~90초마다 |
| 金龍 (코인 3배)     | 없음 (경제 전용)         | 낮음             | ~90초마다 |
| 大力 (넉백 3배)     | 방어적                   | 중간             | ~90초마다 |
| 火龍 (화염 오라)    | +15DPS 근접              | 높음 (근접 필요) | ~90초마다 |
| 吉金 (크리 100%)    | 평균 ~1.5배 DPS 증가     | 중간             | ~90초마다 |
| 大火力 (3배 데미지) | 직접 3배 → 10초 극초단기 | 낮음 (레어)      | ~3분마다  |
| 金吉龍 (5배 드롭)   | 없음 (경제 전용)         | 낮음 (레어)      | ~3분마다  |

---

## 4. UI/UX 요구사항

### 4.1 HUD — 파편 인벤토리

- **위치**: 화면 상단 중앙 (체력바 아래)
- **크기**: 3칸 슬롯 (각 40x40px), 좌측 정렬
- **빈 슬롯**: 반투명 어두운 사각형 + 점선 테두리
- **채워진 슬롯**: 네온 한자 + 색상 글로우 + 남은 시간 원형 프로그레스
- **만료 임박 (5초 이하)**: 깜빡이는 애니메이션
- **파편 수집 시**: 슬롯에 "삽입" 애니메이션 (스케일 바운스)

### 4.2 조합 완성 연출

1. **파편 결합**: 보유 슬롯의 해당 파편이 화면 중앙으로 날아가며 합쳐짐 (0.3초)
2. **네온사인 점등**: 완성된 한자가 네온관 점등 효과로 나타남 (0.5초)
3. **크게 표시**: 1.5초간 화면 중앙에 풀사이즈 표시 (200x200px 범위)
4. **축소 + 이동**: 0.3초간 축소되어 버프 아이콘 위치(화면 좌상단)로 이동
5. **비네팅**: 화면 가장자리에 네온사인 색상의 얇은 글로우 (버프 지속 중)

### 4.3 버프 타이머

- **위치**: 화면 좌상단, 파편 슬롯 아래
- **표시**: 네온사인 아이콘 (32x32) + 남은 시간 (소수점 없이 정수 초)
- **종료 3초 전**: 깜빡임
- **종료 시**: 네온관 깨지는 VFX + 아이콘 사라짐

### 4.4 도감 (조합 기록)

- **접근**: 메인 메뉴 → "네온 도감" 버튼
- **레이아웃**: 그리드 형태, 미발견 조합은 "???" 실루엣
- **발견 시**: 네온사인 이미지 + 이름 + 효과 설명
- **보상**: 조합 최초 발견 시 다이아몬드 2개

---

## 5. Core 모듈 설계

### 5.1 `src/core/NeonComboCalc.ts`

```
NeonComboCalc (Pure TypeScript — NO Phaser imports)
├─ fragmentTypes: readonly string[]
├─ shouldDropFragment(enemyTier, luckValue): boolean
├─ rollFragmentType(): FragmentTypeId
├─ addFragment(inventory, fragment): { inventory, expired? }
├─ tickFragments(inventory, dt, luckValue): { inventory, expired[] }
├─ checkCombo(inventory): NeonComboRecipe | null
├─ applyNeonBuff(activeNeonBuff, combo): ActiveNeonBuff
├─ tickNeonBuff(buff, dt): { buff, expired: boolean }
├─ getFireAuraDamage(dt): number
├─ isNeonBuffActive(buff, buffType): boolean
├─ getDamageMultiplier(buff): number
├─ getCoinMultiplier(buff): number
├─ getLuckMultiplier(buff): number
├─ getKnockbackMultiplier(buff): number
├─ getCritOverride(buff): { chance: number, bonusMultiplier: number } | null
└─ getAllDropMultiplier(buff): number
```

### 5.2 타입 정의 (`src/types/game.ts` 추가)

```typescript
// § NEON SIGN COMBO

export type FragmentTypeId =
  | "frag_da"
  | "frag_ji"
  | "frag_huo"
  | "frag_li"
  | "frag_jin"
  | "frag_long";

export interface NeonFragment {
  type: FragmentTypeId;
  timer: number; // seconds remaining before expiry
  collectedAt: number; // elapsed time when collected (for FIFO ordering)
}

export interface ActiveNeonBuff {
  comboId: string;
  buffType: string;
  magnitude: number;
  remaining: number; // seconds remaining
  signName: string; // for UI display
}

export interface NeonFragmentDrop {
  id: string;
  type: FragmentTypeId;
  x: number;
  y: number;
  lifetime: number; // seconds remaining on the ground
}
```

---

## 6. RunState 필드 추가

```typescript
export interface RunState {
  // ... existing fields ...

  // § Neon Sign Combo System (SPEC-030)
  neonFragmentDrops: NeonFragmentDrop[]; // fragments on the ground (field pickups)
  neonInventory: NeonFragment[]; // fragments held by player (max 3)
  activeNeonBuff: ActiveNeonBuff | null; // currently active neon sign buff
  discoveredCombos: string[]; // combo IDs discovered this run (for codex)
}
```

### RunStateManager 변경

`createInitialState()` 에 추가:

```typescript
neonFragmentDrops: [],
neonInventory: [],
activeNeonBuff: null,
discoveredCombos: [],
```

`tick()` 에 추가:

```typescript
// Tick neon fragment field lifetimes
state.neonFragmentDrops = state.neonFragmentDrops.filter((f) => {
  f.lifetime -= dt;
  return f.lifetime > 0;
});

// Tick neon inventory timers
const luckValue = getPassiveValue(state.player.passives, "luck");
const { inventory, expired } = tickFragments(
  state.neonInventory,
  dt,
  luckValue,
);
state.neonInventory = inventory;

// Tick active neon buff
if (state.activeNeonBuff) {
  state.activeNeonBuff.remaining -= dt;
  if (state.activeNeonBuff.remaining <= 0) {
    state.activeNeonBuff = null;
    // emit: 'neon_buff_expired'
  }
}
```

---

## 7. 메타 프로그레션 연동

### 영구 도감 (SaveManager)

```typescript
// MetaSave에 추가
export interface MetaSave {
  // ... existing ...
  neonCombosDiscovered: string[]; // 발견한 조합 ID 목록 (런 간 유지)
}
```

- 조합 최초 발견 시 `neonCombosDiscovered`에 추가 + 다이아몬드 2개 지급
- 8개 전부 발견 시 업적 "네온 마스터" + 다이아몬드 20개

---

## 8. 구현 체크리스트

### Phase 1: Core Logic

- [ ] `src/types/game.ts` — NeonFragment, ActiveNeonBuff, NeonFragmentDrop 타입 추가
- [ ] `src/types/game.ts` — RunState에 neon 필드 4개 추가
- [ ] `src/config/balance.ts` — NEON_FRAGMENT, NEON_COMBOS, NEON_AURA 상수 추가
- [ ] `src/config/colors.ts` — NEON_FRAGMENT 색상 섹션 추가
- [ ] `src/core/NeonComboCalc.ts` — 순수 로직 구현 (Phaser 의존 금지)
- [ ] `src/core/RunStateManager.ts` — createInitialState, tick 수정
- [ ] `tests/core/NeonComboCalc.test.ts` — 유닛 테스트 (드롭 확률, 조합 매칭, 버프 적용, FIFO)

### Phase 2: Game Scene Integration

- [ ] `src/scenes/GameScene.ts` — 적 사망 시 파편 드롭 로직
- [ ] `src/scenes/GameScene.ts` — 파편 필드 오브젝트 렌더링 + 마그넷 수집
- [ ] `src/scenes/GameScene.ts` — 무기 데미지 계산에 네온 버프 multiplier 적용
- [ ] `src/scenes/GameScene.ts` — 코인 드롭에 네온 버프 multiplier 적용
- [ ] `src/scenes/GameScene.ts` — 화염 오라 데미지 틱 처리

### Phase 3: UI/UX

- [ ] 파편 인벤토리 HUD (3슬롯, 타이머, 글로우)
- [ ] 조합 완성 연출 (결합 → 점등 → 확대 → 축소)
- [ ] 버프 타이머 아이콘
- [ ] 네온 도감 씬 (메인 메뉴)

### Phase 4: Art & Audio

- [ ] 파편 스프라이트 6종 (한자 네온 아이콘, 32x32)
- [ ] 조합 완성 네온사인 이미지 8종 (128x128)
- [ ] 네온관 점등 SFX
- [ ] 네온관 깨짐 SFX
- [ ] 화염 오라 루프 SFX

### Phase 5: Polish & Balance

- [ ] 드롭 확률 플레이테스트 → 조합 빈도 검증 (목표: 60~90초마다 1회)
- [ ] 3파편 조합 빈도 검증 (목표: 3~4분마다 1회)
- [ ] 데미지 배율 밸런스 (10분 런 전체 DPS 곡선 확인)
- [ ] 도감 보상 밸런스

---

## 9. 리스크 & 대안

| 리스크                                 | 영향               | 대안                                       |
| -------------------------------------- | ------------------ | ------------------------------------------ |
| 파편이 너무 자주 드롭 → 버프 상시 유지 | 게임 밸런스 붕괴   | 드롭률 하향, 버프 지속시간 단축            |
| 파편이 너무 안 드롭 → 시스템 무의미    | 플레이어 인지 못함 | 분당 최소 1파편 보장 (pity timer)          |
| 3파편 조합이 너무 쉬움                 | 레어 가치 하락     | 3파편 조합 시 특정 순서 요구 (추후)        |
| 화면 상단 HUD 공간 부족                | UI 혼잡            | 파편 슬롯을 캐릭터 위 미니 아이콘으로 대체 |
| 화염 오라 성능 이슈                    | FPS 저하           | tick rate 조정 (0.25s → 0.5s), 적 수 상한  |

---

## 10. 향후 확장

- **4파편 전설 조합**: 大+火+龍+力 = "大火龍力" (5초간 무적 + 화면 전체 공격)
- **파편 상점**: 대배당(SPEC-031)에서 코인으로 파편 구매 가능
- **네온사인 스킨**: 조합 발동 시 네온사인 비주얼 커스터마이즈
- **크로노 핵 연동 (SPEC-032)**: 슬로우모션 중 파편 수명 일시정지
