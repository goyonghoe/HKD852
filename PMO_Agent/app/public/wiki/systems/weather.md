# 날씨 시스템

> 8종 날씨 효과, 구역별 배정, 게임플레이 영향

관련 파일: `src/core/WeatherCalc.ts`, `src/managers/WeatherManager.ts`, `src/config/districts.ts`

---

## 개요

각 홍콩 구역에는 고유 날씨 효과가 배정됩니다. 날씨는 스테이지 전환 시 자동으로 적용되며, HUD의 날씨 인디케이터에 현재 날씨가 표시됩니다.

날씨는 두 가지로 분류됩니다:

- **스탯 수정자**: 즉각적 수치 변화 (속도, 방어력, 치명타 등)
- **환경 이벤트**: 주기적으로 발생하는 시각적/게임플레이 이벤트 (화염 지대, 번개 등)

---

## 날씨 8종

| 날씨 ID           | 이름        | 구역          | 원소  | 효과                                |
| ----------------- | ----------- | ------------- | ----- | ----------------------------------- |
| `speed_all`       | 강풍        | Central       | WIND  | 모든 유닛 이동속도 +10%             |
| `rain`            | 폭우        | Tsim Sha Tsui | WATER | 적 이동속도 -15%                    |
| `flame_zones`     | 열파        | Mong Kok      | FIRE  | 15초마다 랜덤 위치에 화염 지대 출현 |
| `armor_all`       | 지진파      | Sham Shui Po  | EARTH | 적 방어력 +15%                      |
| `lightning_field` | 뇌우        | Wong Tai Sin  | LIGHT | 3초마다 번개 타격 (15 데미지)       |
| `fog`             | 암흑 안개   | Lantau        | DARK  | 시야 반경 300px로 제한              |
| `shield_regen`    | 에너지 필드 | Aberdeen      | WATER | 기지 HP +2/초 자동 회복             |
| `void_gravity`    | 중력장      | Kowloon City  | DARK  | 화면 중앙이 적을 30px/s로 끌어당김  |

---

## 날씨 스탯 수정자

> 관련 함수: `getWeatherModifiers()` in `src/core/WeatherCalc.ts`

```typescript
// 반환 타입
interface WeatherModifiers {
  speedMult: number; // 플레이어 이동속도 배율
  armorMult: number; // 적 방어력 배율
  critBonus: number; // 치명타 확률 보너스
  enemySpeedMult: number; // 적 이동속도 배율
  baseRegenPerSec: number; // 기지 초당 회복량
}
```

| 날씨           | speedMult | armorMult | critBonus | enemySpeedMult | baseRegenPerSec |
| -------------- | --------- | --------- | --------- | -------------- | --------------- |
| `speed_all`    | 1.10      | 1.0       | 0         | 1.0            | 0               |
| `rain`         | 1.0       | 1.0       | 0         | 0.85           | 0               |
| `armor_all`    | 1.0       | 1.15      | 0         | 1.0            | 0               |
| `shield_regen` | 1.0       | 1.0       | 0         | 1.0            | 2               |
| 기타           | 1.0       | 1.0       | 0         | 1.0            | 0               |

---

## 환경 이벤트 상세

### 화염 지대 (flame_zones)

- **주기**: 15초마다 1개 출현
- **지속**: 5초
- **데미지**: 지대 안의 적에게 20 DPS
- **시각 반경**: 60px
- **스폰 범위**: Y = 200 ~ 800

생성 위치 계산:

```typescript
calculateFlameZonePosition(
  gameWidth,
  gameHeight,
  radius,
  spawnYMin,
  spawnYRange,
  rng,
);
// x: 화염 반경을 고려한 화면 내 랜덤 X
// y: [200, 800] 범위 내 랜덤 Y
```

### 번개 폭풍 (lightning_field)

- **주기**: 3초마다 1회 타격
- **데미지**: 타격 범위 내 모든 적에게 15 데미지
- **시각**: 5단계 지그재그 볼트, 너비 3px
- **볼트 범위**: Y = 100 ~ 900

번개 경로 계산:

```typescript
calculateLightningPath(startX, endX, endY, segments, segmentJitter, rng);
// 화면 상단(Y=0)에서 타격 위치까지 지그재그 경로 반환
```

### 안개 (fog)

- **시야 반경**: 300px (플레이어 중심)
- **구현**: 4개의 검정 사각형으로 시야 외 영역 마스킹
- **효과**: 멀리 있는 적이 보이지 않아 긴장감 조성

```typescript
calculateFogMaskRects(playerX, playerY, fogRadius, gameW, gameH);
// [상단, 하단, 좌측, 우측] 4개 Rect 반환
```

### 중력장 (void_gravity)

- **끌어당김 속도**: 30 px/s
- **유효 반경**: 화면 중앙으로부터 250px
- **효과**: 범위 내 적이 화면 중앙을 향해 끌려감

---

## 날씨 시각 효과 VFX

| 날씨              | VFX                                                        |
| ----------------- | ---------------------------------------------------------- |
| `rain`            | 40개 빗방울 파티클 (600px/s, 각도 10°, 폭 2px × 높이 12px) |
| `shield_regen`    | 기지 위 빛나는 펄스 오버레이 (2초 주기)                    |
| `lightning_field` | 볼트 표시 후 300ms 페이드                                  |
| `void_gravity`    | 중력 펄스 원 (3초 주기)                                    |
