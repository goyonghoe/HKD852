# 코드 아키텍처

> WanChai 소스 코드의 디렉토리 구조, 핵심 원칙, 데이터 흐름

관련 파일: `src/`, `.claude/rules/architecture.md`, `.claude/rules/mistake-registry.md`

---

## 핵심 아키텍처 원칙

### M-001: core/에 Phaser 임포트 금지

`src/core/` 디렉토리는 **순수 TypeScript**만 허용합니다. Phaser 의존성 없이 독립적으로 테스트 가능해야 합니다.

```
src/core/      → 순수 TS (Phaser 금지)
src/scenes/    → Phaser 렌더링 레이어만 (게임 로직 금지)
src/managers/  → Phaser 의존 서브시스템
```

### M-002: 수치는 balance.ts에서만

모든 게임 밸런스 수치는 `src/config/balance.ts`의 `BALANCE` 상수에서만 가져옵니다. 매직 넘버를 로직 코드에 하드코딩하면 안 됩니다.

### M-003: 색상은 colors.ts에서만

모든 hex 색상 리터럴은 `src/config/colors.ts`에서만 가져옵니다. 씬 파일에서 `0xff4444`와 같이 직접 사용 금지.

---

## 디렉토리 구조

```
src/
├── config/              # 게임 상수 (읽기 전용 데이터)
│   ├── balance.ts       # BALANCE, VISUAL 상수 (수치 원천)
│   ├── weapons.ts       # WEAPON_DEFS (무기 17종 정의)
│   ├── characters.ts    # CHARACTERS (캐릭터 5종)
│   ├── critters.ts      # CRITTERS (크리터 6종)
│   ├── districts.ts     # DISTRICTS (구역 8개)
│   ├── upgrades.ts      # PASSIVE_UPGRADES (패시브 업그레이드)
│   ├── ultimates.ts     # ULTIMATE_DEFS (궁극기 5종)
│   ├── colors.ts        # 색상 팔레트 (hex 원천)
│   ├── game-config.ts   # Phaser GameConfig
│   └── sprite-keys.ts   # 스프라이트 키 상수
│
├── core/                # 순수 TypeScript 로직 (Phaser 금지)
│   ├── DamageCalc.ts    # 데미지/원소 계산
│   ├── EnemyScalingCalc.ts  # 적 스탯 스케일링
│   ├── EnemyBehaviorCalc.ts # 적 행동 패턴 계산
│   ├── DifficultyScaling.ts # 난이도 스케일링
│   ├── SpawnPoolLogic.ts    # 스폰 풀 필터링
│   ├── StageProgression.ts  # 스테이지 진행 로직
│   ├── MetaProgression.ts   # META_UPGRADES, 영구 강화
│   ├── UpgradeSelector.ts   # 레벨업 선택지 생성
│   ├── WeaponFireCalc.ts    # 무기 발사 계산
│   ├── WeaponZoneCalc.ts    # 무기 존 계산
│   ├── WeatherCalc.ts       # 날씨 효과 계산
│   ├── ShopLogic.ts         # 상점 로직
│   ├── UltimateCalc.ts      # 궁극기 계산
│   ├── GaugeCalc.ts         # 게이지 계산
│   ├── AllyTargeting.ts     # 동맹 타겟팅
│   ├── ChallengeMode.ts     # 챌린지 모드
│   ├── CollisionCalc.ts     # 충돌 계산
│   ├── Achievements.ts      # 업적 시스템
│   ├── GameOverCalc.ts      # 게임오버 결과 계산
│   ├── GameStatFormatting.ts# 스탯 포매팅
│   ├── SeededRandom.ts      # 시드 기반 난수
│   ├── SpatialHash.ts       # 공간 해시 (충돌 최적화)
│   ├── WaveDirector.ts      # 웨이브 지시자
│   └── XpTable.ts           # XP 레벨 테이블
│
├── scenes/              # Phaser 씬 (렌더링 레이어)
│   ├── BootScene.ts         # 초기 설정
│   ├── PreloadScene.ts      # 에셋 로드
│   ├── MainMenuScene.ts     # 메인 메뉴
│   ├── CharacterSelectScene.ts # 캐릭터 선택
│   ├── WorldMapScene.ts     # 월드맵
│   ├── RunScene.ts          # 핵심 게임플레이
│   ├── GameOverScene.ts     # 게임오버
│   ├── MetaScene.ts         # 영구 강화
│   ├── WeaponCodexScene.ts  # 무기 도감
│   └── EnemyCodexScene.ts   # 적 도감
│
├── managers/            # Phaser 의존 서브시스템
│   ├── HUDManager.ts        # HUD 렌더링
│   ├── LevelUpUIManager.ts  # 레벨업 UI
│   ├── PhaseManager.ts      # 게임 Phase 상태머신
│   ├── ProgressionManager.ts# XP/레벨 진행
│   ├── SpawnManager.ts      # 적 스폰
│   ├── CollisionManager.ts  # 충돌 처리
│   ├── WeatherManager.ts    # 날씨 시각 효과
│   ├── ShopManager.ts       # 상점 UI
│   ├── AllyManager.ts       # 동맹 크리터 관리
│   ├── UltimateManager.ts   # 궁극기 실행
│   └── SaveManager.ts       # 저장/불러오기
│
├── objects/             # Phaser GameObjects
│   ├── Player.ts            # 플레이어 오브젝트
│   ├── Enemy.ts             # 적 오브젝트
│   ├── Projectile.ts        # 투사체
│   └── Critter.ts           # 크리터(동맹) 오브젝트
│
├── systems/             # Phaser 기반 시스템
│   └── WeaponSystem.ts      # 무기 발사 제어
│
├── ui/                  # UI 컴포넌트
│   ├── ARIAMessage.ts       # ARIA AI 메시지
│   ├── ButtonFactory.ts     # 버튼 팩토리
│   ├── DamageNumber.ts      # 데미지 숫자 표시
│   ├── PauseOverlay.ts      # 일시정지 오버레이
│   └── SettingsOverlay.ts   # 설정 오버레이
│
├── utils/               # 유틸리티
│   ├── TextureFactory.ts    # 프로시저럴 텍스처 생성
│   ├── VFXManager.ts        # 시각 효과
│   ├── PlayerCalc.ts        # 플레이어 계산
│   ├── ProjectileCalc.ts    # 투사체 계산
│   ├── EnemyDeathHandler.ts # 적 사망 처리
│   ├── UICalc.ts            # UI 계산
│   └── SettingsCalc.ts      # 설정 계산
│
├── audio/               # 사운드 시스템
│   ├── RetroSFX.ts          # 프로시저럴 SFX
│   └── weaponSfxRouting.ts  # 무기별 SFX 라우팅
│
├── lib/                 # 라이브러리
│   ├── i18n.ts              # 국제화
│   └── analytics.ts         # 분석
│
└── types/               # TypeScript 타입
    ├── game.ts              # RunState, MetaState 등
    ├── weapon.ts            # WeaponDef
    ├── upgrade.ts           # 업그레이드 타입
    └── enemy.ts             # 적 타입
```

---

## 데이터 흐름

```
Config (constants)
    ↓
core/ (순수 계산 로직)
    ↓  ↑ (결과 반환)
managers/ (Phaser 서브시스템)
    ↓  ↑
scenes/ (렌더링 + 조율)
    ↓
objects/ (Phaser GameObjects)
```

### 예시: 데미지 계산 흐름

```typescript
// 1. Config에서 수치 로드
const { critMultiplier } = BALANCE.COMBAT;

// 2. core/에서 순수 계산
import { calculateDamage } from "../core/DamageCalc";
const result = calculateDamage(
  baseDamage,
  damageMultiplier,
  critChance,
  critMultiplier,
  Math.random(),
);

// 3. RunScene에서 적에 적용
enemy.takeDamage(result.damage);
```

---

## 핵심 상수 파일

### `src/config/balance.ts`

전체 게임 밸런스의 단일 진실 소스(Single Source of Truth):

- `BALANCE.PLAYER` — 플레이어 기본 스탯
- `BALANCE.BASE` — 기지 HP (600), 위치
- `BALANCE.SPAWN` — 스폰 간격, 엘리트 확률
- `BALANCE.DIFFICULTY` — HP/속도/데미지 시간 스케일
- `BALANCE.XP` — 레벨업 XP 공식
- `BALANCE.STAGE` — 16 스테이지 정의, 구역별 적 풀
- `BALANCE.WEATHER` — 8종 날씨 수치
- `BALANCE.CRITTER` — 6종 크리터 스킬 수치
- `BALANCE.ULTIMATE` — 5종 궁극기 수치

### `src/config/weapons.ts`

`WEAPON_DEFS`: T1 무기 10종 + T2 진화 무기 7종 정의 (각 `maxLevel: 5`)
