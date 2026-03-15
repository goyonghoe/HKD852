# [GDD-HD] Hill Defense 게임 디자인 문서

## 메타

| 항목          | 내용                                                              |
| ------------- | ----------------------------------------------------------------- |
| **작성자**    | Game Designer                                                     |
| **작성일**    | 2026-03-08                                                        |
| **버전**      | v1.0                                                              |
| **상태**      | draft                                                             |
| **우선순위**  | P0                                                                |
| **의존 문서** | SPEC-010B (world-map), SPEC-010C (synopsis), resource-inventory   |
| **후속 문서** | hill-defense-balance.md, hill-defense-scene-flow.md               |
| **언어**      | 한글 주체, 繁體字 / EN 병기                                       |

> 이 문서는 NeonSurvivor(세로 탑다운 오토슈터)에서 **Hill Defense**(사이드뷰 분대 디펜스)로의 전면 리디자인을 정의한다.

---

## 1. 게임 개요

### 1.1 기본 정보

| 항목         | 내용                                                |
| ------------ | --------------------------------------------------- |
| **타이틀**   | NEXT STOP — HK852                                   |
| **장르**     | 사이드뷰 분대 디펜스 × 로그라이크                   |
| **엔진**     | Phaser 3.90+ (WebGL/Canvas), TypeScript             |
| **해상도**   | 720×1280 (9:16 세로, 모바일 퍼스트)                 |
| **타겟**     | 모바일 웹 (iOS Safari, Android Chrome) + PC 브라우저 |
| **세션 시간** | 1런 = 5~8분 (1챕터)                                |
| **배포**     | Vercel (WebGL)                                      |

### 1.2 컨셉

**"홍콩 MTR 노선의 각 역에서, 사이버펑크 적 웨이브를 분대로 막아내라."**

플레이어는 3~5명의 분대원을 언덕/거점 위에 배치하고, 좌/우/위에서 밀려오는 ARIA 최적화체(Optimized) 웨이브를 자동 사격으로 격퇴한다. 웨이브 사이마다 로그라이크 업그레이드를 선택하여 분대를 강화하고, 10웨이브마다 보스와 대결한다.

### 1.3 핵심 경험

| 순간               | 플레이어 감정           | 디자인 수단                       |
| ------------------- | ---------------------- | --------------------------------- |
| 분대 배치           | 전략적 선택감           | 포지션 + 캐릭터 조합              |
| 웨이브 서바이벌     | 긴장 → 카타르시스       | 적 밀도 S커브 + 화면 가득 탄환    |
| 업그레이드 선택     | "이거 강하겠다" 기대감  | 3택 1 로그라이크 + 시너지 조합    |
| 보스전              | 집중 → 성취             | 패턴 회피 + DPS 체크              |
| 챕터 클리어         | 만족 + 다음역 궁금증    | MTR 노선도 진행 + 신규 배경/적    |

### 1.4 참고작

| 게임                     | 참고 요소                                          |
| ------------------------ | -------------------------------------------------- |
| **빵빵좀비단** (BangBang Survivor) | 세로 화면 사이드뷰 디펜스, 자동 사격, 웨이브 구조   |
| **Metal Slug Defense**   | 분대 배치 + 사이드뷰 전투, 캐릭터 수집             |
| **Zombie Age 3**         | 좌→우 적 러시, 무기 다양성, 세로 화면 적응         |
| **Vampire Survivors**    | 로그라이크 업그레이드 선택, 메타 진행, 세션 루프    |

---

## 2. 코어 루프

### 2.1 세션 루프 (1런 = 1챕터)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│   [로비] 분대 편성 (3~5명) + 장비 선택                   │
│      │                                                    │
│      ▼                                                    │
│   [웨이브 시작] 적 스폰 (좌/우/위)                       │
│      │                                                    │
│      ▼                                                    │
│   [자동 전투] 분대 자동 사격 + 플레이어 스킬 발동        │
│      │                                                    │
│      ▼                                                    │
│   [웨이브 클리어] → 3택 1 업그레이드 선택                │
│      │                                                    │
│      ├── 일반 웨이브 → 다음 웨이브로 반복 ──┐            │
│      │                                        │            │
│      └── 10웨이브마다 → [보스전] ────────────┤            │
│                              │                │            │
│                              ▼                │            │
│                     [챕터 클리어]             │            │
│                         │                     │            │
│                         ▼                     │            │
│                    [결과 화면]                │            │
│                    골드/경험치 획득            │            │
│                         │                     │            │
│                         ▼                     │            │
│                    [MTR 다음 역]              │            │
│                                                            │
│   [런 실패 시]                                            │
│      메타 자원(골드) 비례 획득 → 영구 업그레이드 → 재도전 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 웨이브 구조 (1챕터 = 15웨이브 + 보스)

| 웨이브    | 적 구성                        | 난이도 | 비고             |
| --------- | ------------------------------ | ------ | ---------------- |
| 1~3       | T1 일반 × 5~8                 | ★☆☆    | 학습 구간        |
| 4~6       | T1 × 8~12 + T2 정예 × 1~2    | ★★☆    | 혼합 시작        |
| 7~9       | T1 × 12~16 + T2 × 3~4        | ★★★    | 압박 구간        |
| 10~12     | T1 × 16~20 + T2 × 4~6 + T3 × 1~2 | ★★★☆  | 항공 유닛 투입 |
| 13~14     | T2 × 8~10 + T3 × 3~4         | ★★★★   | 정예 러시        |
| 15 (보스) | Boss × 1 + T1 × 6 + T2 × 2   | ★★★★★  | 보스전           |

### 2.3 웨이브 간 보상

- **매 웨이브 클리어**: 3개 업그레이드 중 1개 선택
- **5웨이브 클리어**: 추가 골드 보너스
- **보스 클리어**: 레어 업그레이드 1개 추가 선택 + 챕터 보상

---

## 3. 화면 레이아웃 (720×1280 세로)

### 3.1 영역 분할

```
┌──────────────────────────────┐  y=0
│         상단 HUD (200px)      │
│  ┌──────────────────────────┐ │
│  │ HP바 | 웨이브 3/15 | 골드 │ │
│  │ 분대원1 HP | 분대원2 HP   │ │
│  │ 스킬 쿨다운 아이콘       │ │
│  └──────────────────────────┘ │
├──────────────────────────────┤  y=200
│     패럴랙스 배경 상단        │
│     (하늘/빌딩 원경)          │
│                                │
├──────────────────────────────┤  y=350
│                                │
│      메인 전투 영역 (550px)    │
│                                │
│   ←적  [분대 거점]  적→       │
│         ▲▲▲▲▲                 │
│       분대원 배치               │
│                                │
│  ↓ T3 드론 (위에서 강하)       │
│                                │
├──────────────────────────────┤  y=900
│     타일맵 지형 (200px)       │
│     [바닥/장애물/함정]         │
│                                │
├──────────────────────────────┤  y=1100
│       하단 UI (180px)         │
│  ┌──────────────────────────┐ │
│  │ [스킬1] [스킬2] [궁극기] │ │
│  │       [아이템] [일시정지] │ │
│  └──────────────────────────┘ │
└──────────────────────────────┘  y=1280
```

### 3.2 거점 구조

```
           탄환→  ←탄환
        ┌─────────────────┐
        │  ■ ■ ■ ■ ■      │  ← 분대원 5명 배치
        │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← 거점 상단 (타일셋)
       ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲   ← 경사면
      ╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲  ← 타일맵 언덕
  ───╱▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╲───  ← 바닥 레벨
  적← 접근 경로              적→ 접근 경로
```

- 거점 중앙 높이: y=600 (화면 중앙 약간 위)
- 좌측 적 스폰: x=-50 (화면 밖)
- 우측 적 스폰: x=770 (화면 밖)
- 상단 T3 스폰: y=-50 (화면 밖 위)

### 3.3 패럴랙스 배경

CraftPix 배경 팩 `craftpix-net-832833-free-scrolling-city-backgrounds-pixel-art`의 5레이어 활용:

| 레이어 | 내용          | 스크롤 속도 | z-depth |
| ------ | ------------- | ----------- | ------- |
| Layer 1 | 원경 하늘     | 0.05x       | -500    |
| Layer 2 | 원경 빌딩     | 0.1x        | -400    |
| Layer 3 | 중경 빌딩     | 0.2x        | -300    |
| Layer 4 | 근경 구조물   | 0.4x        | -200    |
| Layer 5 | 전경 오버레이 | 0.6x        | -100    |

- 8개 배경 세트 (BG 1~8) × Day/Night = 16개 배경 조합
- 각 챕터마다 고유 배경 세트 배정

---

## 4. 분대 시스템

### 4.1 기본 분대 (시작 해금)

3명의 메인 캐릭터는 CraftPix 건(Gun) 팩에서 제공하는 Biker/Punk/Cyborg 스프라이트를 사용한다.

| 캐릭터   | 클래스   | 무기 유형       | 사거리 | DPS (Lv1) | 특수 능력          | 스프라이트 팩 |
| -------- | -------- | --------------- | ------ | --------- | ------------------ | ------------- |
| **HAI** (Biker) | 근거리 탱커 | 산탄총 (Shotgun) | 150px  | 45 DPS    | 넉백 샷 (적 밀치기) | `craftpix-net-730561` (1 Characters/1 Biker) |
| **MEI** (Punk)  | 중거리 딜러 | 자동소총 (Rapid) | 300px  | 55 DPS    | 연사 버스트 (3초간 2배속) | `craftpix-net-730561` (1 Characters/2 Punk) |
| **KAI** (Cyborg) | 원거리 저격 | 레이저 빔 (Laser) | 500px  | 35 DPS   | 관통 사격 (직선 적 전체) | `craftpix-net-730561` (1 Characters/3 Cyborg) |

**스프라이트 팩 상세**:
- 메인: `craftpix-net-730561-free-guns-for-cyberpunk-characters-pixel-art`
  - `1 Characters/` — Biker, Punk, Cyborg (Idle, Walk, Run, Jump, Sitdown 애니메이션)
  - `2 Guns/` — 총기 스프라이트 (장착용)
  - `3 Hands/` — 손 스프라이트 (총 그립)
  - `4 Shoot_effects/` — 머즐 플래시
  - `5 Bullets/` — 탄환 스프라이트
- 보조: `craftpix-net-626011-free-guns-pack-2-for-main-characters-pixel-art` (추가 총기 + 이펙트)

### 4.2 해금 캐릭터 (챕터 클리어 보상)

| 캐릭터     | 해금 조건       | 클래스         | 스프라이트 팩                      | 팩 ID        |
| ---------- | --------------- | -------------- | ---------------------------------- | ------------ |
| **교도관** (Warden) | Ch.4 클리어 | 중거리 서포트 | Prison Wardens Pixel Art           | `craftpix-net-142357` |
| **경찰관** (Officer) | Ch.1 클리어 | 근거리 탱커   | Police Cyberpunk Characters        | `craftpix-net-550902` (1 Officer) |
| **경사** (Sergeant) | Ch.2 클리어  | 원거리 딜러   | Police Cyberpunk Characters        | `craftpix-net-550902` (2 Sergeant) |
| **격투가** (Fighter) | Ch.3 클리어 | 근거리 딜러   | Pixel Fighters Asset Pack          | `craftpix-net-456469` |
| **근접전사** (Melee) | Ch.5 클리어 | 근거리 버서커 | Characters with Melee Attack       | `craftpix-net-598640` |
| **노동자** (Worker) | Ch.6 클리어  | 중거리 유틸   | Workers and Drones                 | `craftpix-net-653752` |
| **죄수** (Prisoner) | Ch.4 히든    | 원거리 특수   | Prisoner Character Sprites         | `craftpix-net-950267` |
| **용병** (Mercenary) | 전챕터 클리어 | 만능형        | Extra Animations for Cyberpunk     | `craftpix-net-796772` |

### 4.3 동반 크리처 (Pet System)

CraftPix `craftpix-net-333917-pet-companions-pixel-sprite-pack-for-cyberpunk-game` 활용.

| 크리처 | 효과              | 해금 조건       |
| ------ | ----------------- | --------------- |
| Pet 1  | 자동 아이템 수집  | Ch.1 클리어     |
| Pet 2  | 주기적 HP 회복    | Ch.2 클리어     |
| Pet 3  | 적 감속 오라      | Ch.3 클리어     |
| Pet 4  | 추가 골드 획득    | Ch.5 클리어     |
| Pet 5  | 보조 공격         | Ch.7 클리어     |

### 4.4 분대 AI 행동

```typescript
// 타겟 우선순위 (높을수록 우선)
enum TargetPriority {
  BOSS = 100,        // 보스 최우선
  T3_DRONE = 80,     // 공중 유닛 (위협도 높음)
  T2_ELITE = 60,     // 정예 (특수 능력 보유)
  CLOSEST = 40,      // 가장 가까운 적
  LOWEST_HP = 20,    // 잔여 HP 최소
}

// 자동 사격 로직
interface SquadMemberAI {
  attackRange: number;       // 사거리 (px)
  fireRate: number;          // 초당 발사 수
  targetMode: 'closest' | 'strongest' | 'weakest';
  autoAim: boolean;          // 자동 조준 (항상 true)
  facingDirection: 'auto';   // 가장 가까운 적 방향으로 자동 전환
}
```

### 4.5 분대원 배치 규칙

- **배치 가능 영역**: 거점 상단 (y: 550~650, x: 180~540)
- **최소 간격**: 60px (겹침 방지)
- **드래그&드롭**: 웨이브 시작 전 배치 조정 가능
- **자동 배치**: 기본값은 등간격 배치 (좌→우: 근거리→원거리)

---

## 5. 적 시스템

### 5.1 적 등급

#### T1: 일반 (48px)

좌/우 화면 밖에서 걸어오는 기본 적. 거점에 도달하면 근접 공격.

| 챕터 | 적 팩 | 팩 ID | 적 수 | 애니메이션 |
| ---- | ----- | ----- | ----- | ---------- |
| Ch.1 (中環) | City Enemies | `craftpix-net-223841` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.2 (香港仔) | Pirate Bay Enemies | `craftpix-net-401611` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.3 (旺角) | Chinese Street Enemies | `craftpix-net-255422` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.4 (深水埗) | Residential Area Enemies | `craftpix-net-823313` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.5 (黃大仙) | Business Enemies | `craftpix-net-446105` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.6 (九龍城寨) | Sewerage Enemies | `craftpix-net-583992` | 6종 | Idle, Walk, Attack, Hurt, Death |
| Ch.7 (大嶼山) | Lab Enemies | `craftpix-net-667785` | 6종 | Idle, Walk, Attack, Hurt, Death |

**추가 적 팩 (혼합 투입용)**:

| 팩 이름 | 팩 ID | 용도 |
| ------- | ----- | ---- |
| Bar Street Enemies | `craftpix-net-386974` | Ch.3 야간 웨이브 |
| Basement Enemies | `craftpix-net-488809` | Ch.6 지하 웨이브 |
| Industrial Zone Enemies | `craftpix-net-601813` | Ch.4 공장 웨이브 |
| Snow City Enemies | `craftpix-net-562606` | 보너스 챕터 |
| Power Station Enemies | `craftpix-net-381725` | Ch.7 발전소 구간 |
| Exclusion Zone Enemies (1) | `craftpix-net-415058` | Ch.6 돌연변이 |
| Exclusion Zone Enemies (2) | `craftpix-net-772183` | Ch.7 히든 웨이브 |
| Desert Bandits | `craftpix-net-533366` | 보너스 챕터 |
| Seaport Enemies | `craftpix-net-545114` | Ch.2 항구 웨이브 |
| Spaceliner Enemies | `craftpix-net-583506` | Ch.7 최종 구간 |
| Beach Enemies | `craftpix-net-892821` | 보너스 챕터 |
| Pixel Enemies Pack | `craftpix-net-527764` | 범용 (전 챕터) |

#### T2: 정예 (48px)

일반 적과 동일 크기지만, 특수 능력 보유. 웨이브 4부터 등장.

| T2 유형 | 특수 능력 | HP 배율 | 사용 팩 |
| ------- | --------- | ------- | ------- |
| **쉴더** | 전방 보호막 (파괴 필요) | 3x | 각 챕터 적 팩의 2~3번 적 |
| **거너** | 원거리 사격 (분대에 피해) | 2x | 각 챕터 적 팩의 4~5번 적 |
| **돌격병** | 이동속도 3배 + 자폭 | 1.5x | 각 챕터 적 팩의 6번 적 |
| **힐러** | 주변 적 HP 회복 | 2x | 동일 팩 내 변형 |
| **넉백 저항** | 밀치기 면역 | 4x | 동일 팩 내 변형 |

#### T3: 공중 유닛

위에서 날아오는 드론/로봇. 지형 무시.

| 유닛 | 스프라이트 팩 | 팩 ID | 행동 |
| ---- | ------------- | ----- | ---- |
| **정찰 드론** | Free Drones Pack | `craftpix-net-902201` | 빠른 이동, 낮은 HP, 정보 수집 (적 공격력 버프) |
| **전투 로봇** | Robots Sprite Sheet Pack | `craftpix-net-909754` | 중간 HP, 원거리 사격 |
| **전투 메카** | Battle Mecha Sprites | `craftpix-net-669945` | 높은 HP, 광역 공격 (미니보스급) |
| **경찰 드론** | Police Transport | `craftpix-net-687978` | 적 수송 (T1 3기 투하) |

#### Boss: 보스 (72~96px)

각 챕터 마지막 웨이브에 등장. 다단계 HP + 패턴 공격.

| Ch | 보스 | 스프라이트 팩 | 팩 ID | HP 단계 | 패턴 |
| -- | ---- | ------------- | ----- | ------- | ---- |
| 1 | **센트럴 가디언** | City Bosses (Free) | `craftpix-net-261169` | 3단계 | 풍압 밀치기 → 드론 소환 → 레이저 소사 |
| 2 | **항만 크라켄** | Sea Port Bosses | `craftpix-net-432685` | 3단계 | 촉수 스윕 → 잉크 장판 → 수중 돌진 |
| 3 | **몽콕 용왕** | Chinese Street Bosses | `craftpix-net-355913` | 3단계 | 화염 브레스 → 폭죽 산개 → 용 돌진 |
| 4 | **심수포 중장비** | Residential Area Bosses | `craftpix-net-454345` | 3단계 | 지진 파동 → 잔해 투척 → 돌진 |
| 5 | **황대선 수호신** | Various Bosses | `craftpix-net-713504` | 4단계 | 빛 기둥 → 분신 소환 → 정화 폭발 → 광역 심판 |
| 6 | **구룡성채 마왕** | Sewerage Bosses | `craftpix-net-406978` | 4단계 | 독안개 → 하수도 촉수 → 변이 소환 → 최종 형태 변환 |
| 7 | **ARIA 코어** | Lab Bosses + Cyberpunk Bosses | `craftpix-net-541373` + `craftpix-net-999713` | 5단계 | 데이터 스트림 → 방화벽 → 바이러스 확산 → 시스템 과부하 → 코어 노출 |

**추가 보스 팩 (히든/보너스)**:

| 보스 팩 | 팩 ID | 용도 |
| ------- | ----- | ---- |
| Bar Street Bosses | `craftpix-net-384116` | Ch.3 히든 보스 |
| Industrial Zone Boss | `craftpix-net-536426` | Ch.4 히든 보스 |
| Basement Bosses | `craftpix-net-584459` | Ch.6 히든 보스 |
| Snow City Bosses | `craftpix-net-644444` | 보너스 챕터 |
| Desert Bosses | `craftpix-net-657819` | 보너스 챕터 |
| Prison Bosses | `craftpix-net-787769` | Ch.4 히든 보스 |
| Beach Bosses | `craftpix-net-899060` | 보너스 챕터 |

### 5.2 적 스폰 로직

```typescript
interface WaveSpawnConfig {
  wave: number;
  spawnPoints: SpawnPoint[];
  spawnInterval: number;    // ms 간격
  totalEnemies: number;
  composition: {
    t1: number;    // 비율 (%)
    t2: number;
    t3: number;
  };
}

interface SpawnPoint {
  side: 'left' | 'right' | 'top';
  y: number;      // 스폰 y좌표
  weight: number;  // 스폰 비중 (좌:우:위 = 40:40:20)
}
```

- **좌측 스폰**: x=-50, y=750~900 (바닥 레벨에서 걸어옴)
- **우측 스폰**: x=770, y=750~900
- **상단 스폰**: y=-50, x=100~620 (T3 전용)
- **웨이브 시작**: 3초 카운트다운 → 적 스폰 시작
- **스폰 간격**: 초기 2000ms → 웨이브 진행에 따라 800ms까지 감소

### 5.3 적 행동 패턴

```
T1 일반:   스폰 → Walk(거점 방향) → 거점 도달 → Attack(반복) → Death
T2 거너:   스폰 → Walk(사거리까지) → 정지 → Shoot(반복) → Death
T2 돌격:   스폰 → Run(3배속) → 거점 도달 → 자폭(광역 피해) → Death
T2 쉴더:   스폰 → Walk(느림) → 쉴드 전개 → 뒤의 적 보호 → Attack → Death
T3 드론:   스폰(위) → 좌우 이동(패트롤) → 사격 → Death
Boss:      스폰(화면 가장자리) → 패턴1 → 체력 게이지 전환 → 패턴2 → ... → Death
```

---

## 6. 챕터 구성 (7+1)

### 6.1 챕터-에셋 매핑 총괄표

| Ch | 위치 (繁體字) | 영문 | 원소 | 배경 (BG#) | 타일셋 팩 | 적 팩 | 보스 팩 | BGM 팩 |
| -- | ------------- | ---- | ---- | ---------- | --------- | ----- | ------- | ------ |
| 1 | 中環/太平山 | Central | Wind | BG 1 Day | `craftpix-net-622073` (Business Center) | `craftpix-net-223841` (City) | `craftpix-net-261169` (Free Bosses) | `craftpix-net-608340` (Night City) |
| 2 | 香港仔/南區 | Aberdeen | Water | BG 2 Night | `craftpix-net-861263` (Pirate Bay) | `craftpix-net-401611` (Pirate Bay) | `craftpix-net-432685` (Sea Port) | `craftpix-net-608340` (Main theme) |
| 3 | 旺角/油尖旺 | Mong Kok | Fire | BG 3 Night | `craftpix-net-716407` (Chinese Street) | `craftpix-net-255422` (Chinese St.) | `craftpix-net-355913` (Chinese St.) | `craftpix-net-444477` (Chinese Street) |
| 4 | 深水埗 | Sham Shui Po | Earth | BG 4 Day | `craftpix-net-678553` (Residential) | `craftpix-net-823313` (Residential) | `craftpix-net-454345` (Residential) | `craftpix-net-648698` (Industrial) |
| 5 | 黃大仙 | Wong Tai Sin | Light | BG 5 Day | `craftpix-net-622073` (Business) + `craftpix-net-846754` (Green Zone) | `craftpix-net-446105` (Business) | `craftpix-net-713504` (Various) | `craftpix-net-608340` (Battle theme) |
| 6 | 九龍城寨 | Kowloon Walled City | Dark | BG 6 Night | `craftpix-net-581773` (Sewerage) + `craftpix-net-898135` (Basement) | `craftpix-net-583992` (Sewerage) | `craftpix-net-406978` (Sewerage) | `craftpix-net-936590` (Sewerage) |
| 7 | 大嶼山 | Lantau | All | BG 7 Night | `craftpix-net-104941` (Lab) + `craftpix-net-548066` (Spaceliner) | `craftpix-net-667785` (Lab) | `craftpix-net-541373` (Lab) + `craftpix-net-999713` (Cyberpunk) | `craftpix-net-648698` (Lab) |
| B | 보너스 (Snow City) | Bonus | Ice | BG 8 Day | `craftpix-net-695574` (Snow City) | `craftpix-net-562606` (Snow City) | `craftpix-net-644444` (Snow City) | `craftpix-net-682092` (Snow City) |

### 6.2 챕터별 고유 기믹

| Ch | 기믹 | 설명 |
| -- | ---- | ---- |
| 1 | **바람 기류** | 바람이 주기적으로 방향 변경 → 탄환 궤적 휨 (좌↔우) |
| 2 | **밀물/썰물** | 바닥 수위 변동 → 일부 경로 차단/개방 |
| 3 | **네온 폭발** | 배경 간판이 랜덤 폭발 → 광역 피해 (적/아군 모두) |
| 4 | **지진** | 주기적 화면 흔들림 → 분대원 조준 흔들림 |
| 5 | **빛의 기둥** | 특정 위치에 빛 기둥 생성 → 아군 버프 존 |
| 6 | **어둠 안개** | 시야 제한 (원거리 분대원 사거리 감소) |
| 7 | **시스템 해킹** | ARIA가 랜덤으로 분대원 1명 제어 불능 (5초) |
| B | **눈보라** | 이동속도 전체 감소 (적/아군 모두) |

### 6.3 챕터별 장식/환경

| Ch | 장식 팩 | 팩 ID | 사용 요소 |
| -- | ------- | ----- | --------- |
| 전체 | City Signs and Barriers | `craftpix-net-321524` | 바리케이드, 표지판 (파괴 가능 오브젝트) |
| 전체 | Animated Cyberpunk Ads | `craftpix-net-154211` + `craftpix-net-899543` | 배경 네온 간판, 광고판 |
| 전체 | Free Billboards | `craftpix-net-608215` | 빌보드 장식 |
| 3 | Cyberpunk Market Street | `craftpix-net-153816` | 몽콕 야시장 노점 |
| 3 | Market Location for Cyberpunk | `craftpix-net-912307` | 시장 장식 |
| 2 | Cyberpunk Farm | `craftpix-net-105241` | 남구 농장 장식 |
| 전체 | Trees and Bushes | `craftpix-net-894350` | 자연 환경 장식 |
| 전체 | Doors and Portals | `craftpix-net-318273` | 챕터 진입/퇴장 포탈 |
| 전체 | Street Animals | `craftpix-net-610575` | 배경 동물 (장식) |
| 6 | Graffiti Constructor | `craftpix-net-920510` + `craftpix-net-613851` | 구룡성채 벽면 그래피티 |

---

## 7. 업그레이드/아이템 시스템

### 7.1 업그레이드 구조

웨이브 클리어 시 3개의 업그레이드 카드 중 1개를 선택한다. 업그레이드는 해당 런에서만 유효하다.

```
┌─────────────────────────────────────────────────┐
│              웨이브 3 클리어!                     │
│                                                   │
│  ┌──────┐   ┌──────┐   ┌──────┐                 │
│  │ 🔫   │   │ 🛡️   │   │ ⚡   │                 │
│  │연사력│   │분대HP│   │번개  │                  │
│  │+20%  │   │+15%  │   │스킬  │                  │
│  │      │   │      │   │해금  │                  │
│  │[일반]│   │[일반]│   │[레어]│                 │
│  └──────┘   └──────┘   └──────┘                 │
│                                                   │
│         탭하여 선택 (10초 타이머)                 │
└─────────────────────────────────────────────────┘
```

### 7.2 업그레이드 카테고리

#### 무기 강화 (Weapon)

아이콘 팩: `craftpix-net-177646` (Guns 32x32), `craftpix-net-588685` (Firearm 32x32), `craftpix-net-791436` (Weapons & Ammo 32x32)

| 업그레이드 | 등급 | 효과 | 중첩 |
| ---------- | ---- | ---- | ---- |
| 연사력 향상 | 일반 | 발사 속도 +15% | 5회 |
| 데미지 증폭 | 일반 | 기본 공격력 +20% | 5회 |
| 탄환 크기 | 일반 | 탄환 히트박스 +30% | 3회 |
| 관통탄 | 레어 | 탄환이 적 1기 추가 관통 | 3회 |
| 산탄 확산 | 레어 | 산탄총 범위 +40% | 3회 |
| 레이저 폭 | 레어 | 레이저 빔 폭 2배 | 2회 |
| 크리티컬 | 에픽 | 치명타 확률 +10%, 배율 +50% | 3회 |
| 듀얼 웨폰 | 에픽 | 분대원 1명 무기 2정 장착 | 1회 |
| 오버클럭 | 전설 | 전 분대 DPS 2배 (30초) | 1회 |

#### 방어 (Defense)

아이콘 팩: `craftpix-net-188212` (Armor), `craftpix-net-286587` (Armor 32x32), `craftpix-net-326843` (RPG Armor), `craftpix-net-574978` (Pixel Armor)

| 업그레이드 | 등급 | 효과 | 중첩 |
| ---------- | ---- | ---- | ---- |
| 거점 보강 | 일반 | 거점 HP +20% | 5회 |
| 분대 회복 | 일반 | 웨이브 간 HP 15% 회복 | 5회 |
| 방탄복 | 레어 | 받는 피해 -15% | 3회 |
| 바리케이드 | 레어 | 거점 앞 바리케이드 설치 (HP 500) | 2회 |
| 보호막 | 에픽 | 10초마다 피해 1회 무효화 | 1회 |
| 긴급 수리 | 에픽 | HP 30% 이하 시 자동 25% 회복 | 1회 |

#### 스킬 (Skill)

아이콘 팩: `craftpix-net-259753` (Skills 32x32), `craftpix-net-711410` (Skill Icons), `craftpix-net-741764` (Skill 32x32), `craftpix-net-815355` (40 Skill Icons), `craftpix-net-917923` (Skills Pixelated)

| 업그레이드 | 등급 | 효과 | 중첩 |
| ---------- | ---- | ---- | ---- |
| 쿨다운 감소 | 일반 | 스킬 쿨다운 -15% | 5회 |
| 공중 폭격 | 레어 | 10초마다 랜덤 위치 폭격 | 1회 |
| 번개 소환 | 레어 | 체력 가장 높은 적에게 번개 | 1회 |
| 지뢰밭 | 레어 | 거점 주변 지뢰 3개 설치 | 2회 |
| 분대원 소환 | 에픽 | 임시 분대원 1명 추가 (해당 챕터) | 2회 |
| 궁극기 충전 | 에픽 | 궁극기 게이지 즉시 50% 충전 | 1회 |
| ARIA 해킹 | 전설 | 적 1기를 아군으로 전환 (60초) | 1회 |

#### 유틸리티 (Utility)

아이콘 팩: `craftpix-net-477421` (Gadgets 32x32), `craftpix-net-364659` (Tool 32x32), `craftpix-net-615713` (Cyber Implant), `craftpix-net-805026` (Implants)

| 업그레이드 | 등급 | 효과 | 중첩 |
| ---------- | ---- | ---- | ---- |
| 골드 자석 | 일반 | 골드 획득 범위 +50% | 3회 |
| 경험치 증폭 | 일반 | XP 획득 +20% | 5회 |
| 이동속도 | 일반 | 분대원 재배치 속도 +30% | 3회 |
| 스캔 드론 | 레어 | 적 체력바 표시 + 약점 하이라이트 | 1회 |
| 슬로모션 | 에픽 | 적 이동속도 50% 감소 (5초, 30초 쿨) | 1회 |
| 자원 회수 | 에픽 | 적 처치 시 HP 회복 (킬당 2%) | 1회 |

### 7.3 업그레이드 등급 확률

| 등급   | 웨이브 1~5 | 웨이브 6~10 | 웨이브 11~15 | 보스 보상 |
| ------ | ---------- | ----------- | ------------ | --------- |
| 일반   | 70%        | 50%         | 30%          | 0%        |
| 레어   | 25%        | 35%         | 40%          | 40%       |
| 에픽   | 5%         | 13%         | 25%          | 45%       |
| 전설   | 0%         | 2%          | 5%           | 15%       |

### 7.4 소비 아이템

아이콘 팩: `craftpix-net-184808` (Resource 32x32), `craftpix-net-293029` (Resource Icons), `craftpix-net-572384` (Resources), `craftpix-net-620021` (Energy Items)

| 아이템 | 효과 | 획득 방법 |
| ------ | ---- | --------- |
| 수류탄 | 광역 피해 (반경 100px) | 웨이브 5/10 보상 |
| 의료킷 | 분대 전체 HP 30% 회복 | 보스전 시작 시 |
| EMP | 모든 T3 유닛 5초 비활성화 | 웨이브 12 이후 드롭 |
| 오버드라이브 | 전 분대 DPS 3배 (5초) | 보스전 보상 |

---

## 8. 메타 진행

### 8.1 영구 업그레이드 (골드 소비)

| 카테고리 | 업그레이드 | 최대 레벨 | 비용 (Lv1→Max) | 효과 |
| -------- | ---------- | --------- | --------------- | ---- |
| 공격 | 기본 공격력 | 20 | 100~5000 | +5% per lv |
| 공격 | 크리티컬 율 | 10 | 200~3000 | +2% per lv |
| 공격 | 공격 속도 | 15 | 150~4000 | +3% per lv |
| 방어 | 거점 HP | 20 | 100~5000 | +5% per lv |
| 방어 | 분대원 HP | 15 | 150~4000 | +5% per lv |
| 방어 | 피해 감소 | 10 | 300~5000 | +2% per lv |
| 유틸 | 시작 골드 | 10 | 200~3000 | +50 per lv |
| 유틸 | XP 배율 | 10 | 200~3000 | +5% per lv |
| 유틸 | 아이템 품질 | 5 | 500~5000 | 레어+ 확률 +5% per lv |

### 8.2 해금 시스템

| 해금 대상 | 조건 | 콘텐츠 |
| --------- | ---- | ------ |
| 캐릭터 | 챕터 클리어 | 8명 추가 캐릭터 (4.2절 참조) |
| 크리처 | 챕터 클리어 | 5종 동반 크리처 (4.3절 참조) |
| 무기 스킨 | 특정 업적 | 총기 외형 변경 (능력치 동일) |
| 보너스 챕터 | 전 챕터 클리어 | Snow City 보너스 스테이지 |

### 8.3 도감 시스템 (기존 NeonSurvivor 계승)

- **무기 도감**: 획득한 무기/업그레이드 목록 + 스탯 뷰어
- **적 도감**: 조우한 적 목록 + HP/공격력/약점 정보
- **챕터 도감**: 각 챕터 최고 기록, 클리어 횟수, 별점

### 8.4 골드 획득 공식

```typescript
const goldEarned = Math.floor(
  (wavesCleared * 10) +              // 기본 웨이브 보상
  (killCount * 2) +                   // 처치 보상
  (bossKilled ? 200 : 0) +           // 보스 보너스
  (chapterCleared ? 500 : 0) +       // 챕터 클리어 보너스
  (survivalBonus * 0.5)              // 생존 시간 보너스
) * (1 + metaGoldMultiplier);         // 메타 골드 배율
```

---

## 9. 오디오 설계

### 9.1 BGM 매핑

| 용도 | 트랙명 | 팩 | 팩 ID |
| ---- | ------ | -- | ----- |
| **메인 메뉴** | Game_menu_theme_loopable | Futuristic Sounds & Music | `craftpix-net-608340` |
| **로비** | Main_theme_loopable | Futuristic Sounds & Music | `craftpix-net-608340` |
| **Ch.1 전투** | Main_theme_night_city_loopable | Futuristic Sounds & Music | `craftpix-net-608340` |
| **Ch.1 보스** | Battle_theme_loopable | Futuristic Sounds & Music | `craftpix-net-608340` |
| **Ch.2 전투** | police_theme_loopable | Futuristic Sounds & Music | `craftpix-net-608340` |
| **Ch.3 전투** | Main_theme_Chinese_Street | Chinese Street Music | `craftpix-net-444477` |
| **Ch.3 보스** | Battle_theme_Chinese_Street | Chinese Street Music | `craftpix-net-444477` |
| **Ch.3 상점** | Calm_theme_Chinese_Street | Chinese Street Music | `craftpix-net-444477` |
| **Ch.4 전투** | Track Industrial | Cyberpunk Game Pack 1 | `craftpix-net-648698` |
| **Ch.5 전투** | Track greenzone | Cyberpunk Game Pack 1 | `craftpix-net-648698` |
| **Ch.6 전투** | Main_theme_sewerage | Sewerage Music | `craftpix-net-936590` |
| **Ch.6 보스** | Battle_theme_sewerage_loopable | Sewerage Music | `craftpix-net-936590` |
| **Ch.6 앰비언트** | Dark_ambient_loopable | Sewerage Music | `craftpix-net-936590` |
| **Ch.7 전투** | Track Lab | Cyberpunk Game Pack 1 | `craftpix-net-648698` |
| **Ch.7 보스** | Track race | Cyberpunk Game Pack 1 | `craftpix-net-648698` |
| **Ch.7 엔딩** | Emotional_theme | Sewerage Music | `craftpix-net-936590` |
| **보너스 전투** | Main_theme_snow_city_loopable | Snow City Music | `craftpix-net-682092` |
| **보너스 보스** | Battle_theme_snow_city_loopable | Snow City Music | `craftpix-net-682092` |
| **보너스 앰비언트** | Winter_ambient_loopable | Snow City Music | `craftpix-net-682092` |
| **스텔스/이벤트** | Stealthy_theme_loopable | Chinese Street Music | `craftpix-net-444477` |
| **인트로** | Track Intro | Cyberpunk Game Pack 1 | `craftpix-net-648698` |

### 9.2 SFX 매핑

각 오디오 팩의 `Sounds/` 폴더에서 SFX를 매핑한다 (총 174+ SFX).

| 카테고리 | SFX 용도 | 원본 팩 |
| -------- | -------- | ------- |
| 무기 | 산탄총 발사, 자동소총 연사, 레이저 빔 | 전 팩 `Sounds/` |
| 피격 | 적 피격, 분대원 피격, 거점 피격 | 전 팩 `Sounds/` |
| 사망 | 적 사망 (일반/정예/보스), 분대원 쓰러짐 | 전 팩 `Sounds/` |
| UI | 버튼 클릭, 업그레이드 선택, 메뉴 전환 | `craftpix-net-608340` |
| 환경 | 폭발, 바리케이드 파괴, 바람, 물 | `craftpix-net-936590` |
| 보스 | 등장 팡파레, 패턴 전환, 사망 | `craftpix-net-608340` |

### 9.3 오디오 시스템

```typescript
interface AudioConfig {
  bgmVolume: number;     // 0.0 ~ 1.0 (기본 0.5)
  sfxVolume: number;     // 0.0 ~ 1.0 (기본 0.7)
  maxConcurrentSfx: 8;   // 동시 SFX 최대 수
  bgmCrossfade: 1000;    // BGM 전환 크로스페이드 (ms)
  spatialAudio: false;   // 2D 게임이므로 비활성화
}
```

---

## 10. UI 시스템

### 10.1 UI 에셋

메인 GUI 팩:
- `craftpix-net-618358-cyber-intrusion-free-gui-pixel-art-pack` — 버튼, 패널, 슬라이더, 프로그레스바
- `craftpix-net-894687-free-gui-for-cyberpunk-pixel-art` — HP바, 스킬 프레임, 인벤토리 슬롯
- `craftpix-net-610822-cyberpunk-pixel-art-font-effects` — 데미지 넘버, 레벨업 텍스트
- `craftpix-net-567068-free-social-media-icons-pixel-art` — SNS 공유 버튼

### 10.2 HUD 레이아웃

```
┌─────────────────────────────────────────────┐
│  [★ Wave 7/15]          [💰 1,250]  [⏸]    │  y=10
│                                               │
│  HAI ████████░░ 78%                          │  y=50
│  MEI █████████░ 89%                          │  y=80
│  KAI ███████░░░ 65%                          │  y=110
│                                               │
│  거점 HP ██████████████░░ 85%                │  y=150
│                                               │
│  [스킬1 ⏰12s] [스킬2 ⏰5s] [궁극기 ⏰30s] │  y=180
└─────────────────────────────────────────────┘
```

### 10.3 업그레이드 선택 UI

- **위치**: 화면 중앙 (y: 400~800)
- **카드 크기**: 180×280px
- **카드 간격**: 20px
- **타이머**: 상단 10초 카운트다운 바
- **미선택 시**: 랜덤 선택

### 10.4 터치 컨트롤

| 제스처 | 동작 |
| ------ | ---- |
| **탭** | 스킬 버튼 활성화, 업그레이드 선택, UI 상호작용 |
| **드래그** | 분대원 배치 조정 (웨이브 시작 전) |
| **더블탭** | 궁극기 발동 |
| **길게 누르기** | 적 정보 표시 (대상 위) |

### 10.5 이펙트 에셋

| 이펙트 | 팩 | 팩 ID |
| ------ | -- | ----- |
| 폭발 (수류탄, 보스 패턴) | Bombs and Explosions | `craftpix-net-724953` |
| 화염 (Ch.3 기믹, 화염 무기) | Fire Pixel Art Animation | `craftpix-net-237444` |
| 에너지 (레이저, 쉴드, 버프) | Energy Sources | `craftpix-net-168409` |
| 오버레이 (안개, 글리치, 번개) | Cyberpunk Overlay Effects | `craftpix-net-901381` |
| 플랫포머 이펙트 (점프, 착지) | Effects for Platformer | `craftpix-net-965938` |

---

## 11. 기술 사양

### 11.1 Phaser 3 구성

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,          // WebGL 우선, Canvas 폴백
  width: 720,
  height: 1280,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  pixelArt: true,             // 픽셀 아트 보간 방지
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },  // 중력 없음 (사이드뷰지만 플랫포머 아님)
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    LobbyScene,          // 분대 편성
    RunScene,             // 메인 전투 (Hill Defense)
    UpgradeSelectScene,   // 업그레이드 선택
    BossScene,            // 보스전 (RunScene 확장)
    GameOverScene,
    ResultScene,          // 결과 화면
    MetaScene,            // 영구 업그레이드 상점
    WorldMapScene,        // MTR 노선도
    WeaponCodexScene,
    EnemyCodexScene,
    SettingsScene,
  ],
};
```

### 11.2 스프라이트시트 처리

CraftPix 스프라이트시트는 **수평 스트립** 형식:

```typescript
// 적 스프라이트시트 로딩 (48px height)
this.load.spritesheet('enemy_city_1_idle', 'assets/enemies/city/1/Idle.png', {
  frameWidth: 48,    // 프레임 폭 = 높이와 동일 (정사각형 가정)
  frameHeight: 48,   // 캐릭터 높이
});

// 애니메이션 생성
this.anims.create({
  key: 'enemy_city_1_walk',
  frames: this.anims.generateFrameNumbers('enemy_city_1_walk', {
    start: 0,
    end: 5,   // 프레임 수는 팩마다 다름 — 시트 폭 / frameWidth로 계산
  }),
  frameRate: 10,
  repeat: -1,
});
```

**프레임 수 자동 계산**:

```typescript
function getFrameCount(texture: Phaser.Textures.Texture, frameHeight: number): number {
  const source = texture.getSourceImage();
  const frameWidth = frameHeight;  // CraftPix 규격: 정사각 프레임
  return Math.floor(source.width / frameWidth);
}
```

### 11.3 패럴랙스 스크롤링

```typescript
class ParallaxBackground {
  private layers: Phaser.GameObjects.TileSprite[] = [];

  create(scene: Phaser.Scene, bgSet: number, timeOfDay: 'Day' | 'Night') {
    const basePath = `assets/bg/${bgSet}/${timeOfDay}`;
    const speeds = [0.05, 0.1, 0.2, 0.4, 0.6];

    for (let i = 0; i < 5; i++) {
      const layer = scene.add.tileSprite(0, 0, 720, 1280, `bg_${bgSet}_${i}`);
      layer.setOrigin(0, 0);
      layer.setScrollFactor(0);
      layer.setDepth(-500 + i * 100);
      this.layers.push(layer);
    }
  }

  update(delta: number, cameraX: number) {
    const speeds = [0.05, 0.1, 0.2, 0.4, 0.6];
    this.layers.forEach((layer, i) => {
      layer.tilePositionX = cameraX * speeds[i];
    });
  }
}
```

### 11.4 타일맵 (거점 + 지형)

```typescript
// 타일셋 로딩 (32x32)
this.load.image('tileset_chinese_street', 'assets/tilesets/chinese_street/tileset.png');
this.load.tilemapTiledJSON('map_ch3', 'assets/maps/ch3_mongkok.json');

// 맵 생성
const map = this.make.tilemap({ key: 'map_ch3' });
const tileset = map.addTilesetImage('chinese_street', 'tileset_chinese_street', 32, 32);

// 레이어 구성
const groundLayer = map.createLayer('ground', tileset, 0, 0);      // 바닥
const hillLayer = map.createLayer('hill', tileset, 0, 0);           // 거점 언덕
const decorLayer = map.createLayer('decorations', tileset, 0, 0);   // 장식

// 충돌 설정
groundLayer.setCollisionByProperty({ collides: true });
hillLayer.setCollisionByProperty({ collides: true });
```

### 11.5 물리/충돌

```typescript
// Arcade Physics 충돌 그룹
interface CollisionGroups {
  playerBullets: Phaser.Physics.Arcade.Group;   // 분대 탄환
  enemyBullets: Phaser.Physics.Arcade.Group;    // 적 탄환 (T2 거너, 보스)
  enemies: Phaser.Physics.Arcade.Group;          // 적 본체
  squadMembers: Phaser.Physics.Arcade.StaticGroup; // 분대원 (고정)
  fortification: Phaser.Physics.Arcade.StaticGroup; // 거점 HP 영역
  pickups: Phaser.Physics.Arcade.Group;          // 드롭 아이템
}

// 충돌 판정
this.physics.add.overlap(playerBullets, enemies, onBulletHitEnemy);
this.physics.add.overlap(enemyBullets, squadMembers, onEnemyBulletHitSquad);
this.physics.add.overlap(enemies, fortification, onEnemyReachFort);
this.physics.add.overlap(squadMembers, pickups, onPickup);
```

### 11.6 씬 전환 플로우

```
BootScene → PreloadScene → MainMenuScene
                              │
                              ├── WorldMapScene (챕터 선택)
                              │       │
                              │       ▼
                              │    LobbyScene (분대 편성)
                              │       │
                              │       ▼
                              │    RunScene (메인 전투) ←──┐
                              │       │                     │
                              │       ├── UpgradeSelectScene ┘ (웨이브 클리어)
                              │       │
                              │       ├── BossScene (보스전) → ResultScene
                              │       │                           │
                              │       └── GameOverScene ──────────┘
                              │                                    │
                              ├── MetaScene (영구 업그레이드)   ←──┘
                              ├── WeaponCodexScene
                              ├── EnemyCodexScene
                              └── SettingsScene
```

### 11.7 성능 최적화 가이드

| 항목 | 기준값 | 최적화 방법 |
| ---- | ------ | ----------- |
| 동시 적 수 | 최대 30 | SpatialHash + 화면 밖 적 비활성화 |
| 동시 탄환 수 | 최대 50 | 오브젝트 풀링 (탄환 재활용) |
| 파티클 수 | 최대 200 | 풀링 + 수명 관리 |
| 타겟 FPS | 60fps (모바일 30fps) | requestAnimationFrame + delta time |
| 메모리 | < 256MB | 텍스처 아틀라스 + lazy loading |
| 초기 로딩 | < 3초 | 챕터별 에셋 분리 로딩 |

---

## 12. NeonSurvivor → Hill Defense 전환 계획

### 12.1 보존 요소

| 기존 시스템 | 보존 방식 | 관련 파일 |
| ----------- | --------- | --------- |
| 메타 진행 (골드/업그레이드) | 구조 유지, 수치 조정 | `src/core/MetaProgression.ts` |
| 업그레이드 선택 UI (3택 1) | 카드 디자인 변경, 로직 유지 | `src/core/UpgradeSelector.ts` |
| 수치 밸런스 프레임워크 | S커브 구조 유지 | `src/config/balance.ts` |
| 무기/적 도감 | 씬 구조 유지, 내용 교체 | `src/scenes/*CodexScene.ts` |
| 세이브 매니저 | 필드 추가, 구조 유지 | `src/managers/SaveManager.ts` |
| 색상 체계 | 그대로 유지 | `src/config/colors.ts` |
| 오디오 시스템 | 트랙 교체, 시스템 유지 | `src/audio/RetroAudio.ts` |
| SpatialHash | 충돌 최적화 유지 | `src/core/SpatialHash.ts` |
| DamageCalc | 공식 재활용 | `src/core/DamageCalc.ts` |
| SeededRandom | 웨이브 시드 유지 | `src/core/SeededRandom.ts` |
| XpTable | 경험치 테이블 유지 | `src/core/XpTable.ts` |
| VFXManager | 이펙트 시스템 유지 | `src/utils/VFXManager.ts` |
| TextureFactory | 텍스처 생성 유지 | `src/utils/TextureFactory.ts` |

### 12.2 교체 요소

| 기존 시스템 | 변경 내용 | 작업량 |
| ----------- | --------- | ------ |
| RunScene (탑다운 오토슈터) | → 사이드뷰 분대 디펜스 | XL |
| Player (단독 캐릭터) | → Squad (분대 3~5명) | L |
| Enemy spawning (위→아래) | → 좌/우/위 멀티방향 | L |
| WeaponSystem (탑다운) | → 사이드뷰 사격 (좌/우 방향) | L |
| WaveDirector | → 좌/우/위 스폰 로직 + T1/T2/T3 혼합 | M |
| MainMenuScene | → 새 타이틀 + 배경 | S |
| WorldMapScene | → MTR 노선도 UI 개편 | M |
| Projectile | → 수평 이동 탄환 (좌→우, 우→좌) | M |

### 12.3 신규 구현

| 신규 시스템 | 설명 | 작업량 | 우선순위 |
| ----------- | ---- | ------ | -------- |
| **SquadManager** | 분대원 관리 (배치, AI, 레벨업) | XL | P0 |
| **HillDefenseScene** | 메인 전투 씬 (RunScene 대체) | XL | P0 |
| **TilemapManager** | 거점/지형 타일맵 로딩 및 충돌 | L | P0 |
| **ParallaxSystem** | 5레이어 패럴랙스 배경 | M | P0 |
| **SpritesheetLoader** | CraftPix 스프라이트시트 자동 로딩 | L | P0 |
| **LobbyScene** | 분대 편성 + 장비 선택 | L | P1 |
| **UpgradeSelectScene** | 웨이브 간 업그레이드 선택 (개편) | M | P1 |
| **BossScene** | 보스전 전용 씬 (패턴 시스템) | L | P1 |
| **ResultScene** | 결과 화면 (골드/경험치 정산) | S | P1 |
| **ChapterGimmick** | 챕터별 고유 기믹 시스템 | M | P2 |
| **PetSystem** | 동반 크리처 AI 및 효과 | M | P2 |

### 12.4 마일스톤

| Phase | 기간 | 목표 | 산출물 |
| ----- | ---- | ---- | ------ |
| **Phase 0: 프로토타입** | 1주 | 기본 사이드뷰 전투 동작 확인 | 분대 3명 + T1 적 5기 + 자동 사격 |
| **Phase 1: 코어 루프** | 2주 | 웨이브 → 전투 → 업그레이드 → 반복 | 1챕터 플레이 가능 |
| **Phase 2: 콘텐츠** | 2주 | 7챕터 에셋 통합 + 보스 패턴 | 전 챕터 플레이 가능 |
| **Phase 3: 메타** | 1주 | 영구 업그레이드 + 캐릭터 해금 | 메타 루프 완성 |
| **Phase 4: 폴리시** | 1주 | UX 검증 + 밸런스 조정 + 최적화 | 배포 가능 버전 |

---

## 13. 건 컨스트럭터 (무기 조합)

CraftPix `craftpix-net-461336-gun-constructor-pixel-art`에서 137개 건파츠 활용.

### 13.1 파츠 카테고리

| 파츠 | 수량 | 역할 |
| ---- | ---- | ---- |
| 총신 (Barrel) | ~30종 | 사거리, 정확도 결정 |
| 총몸 (Body) | ~30종 | 기본 데미지 결정 |
| 탄창 (Magazine) | ~20종 | 장탄수, 재장전 속도 |
| 조준경 (Scope) | ~15종 | 크리티컬 확률 보너스 |
| 그립 (Grip) | ~15종 | 안정성, 연사 속도 |
| 머즐 (Muzzle) | ~10종 | 관통, 넉백 등 특수 효과 |
| 장식 (Accessory) | ~17종 | 외형 변경 (능력치 미반영) |

### 13.2 무기 조합 시스템 (메타 콘텐츠)

- 파츠 획득: 챕터 클리어 보상, 골드 구매
- 조합: 로비에서 총신 + 총몸 + 탄창 + (옵션) 조합
- 결과: 고유 스탯을 가진 커스텀 무기 생성
- 분대원 장착: 각 분대원에게 커스텀 무기 장착 가능

---

## 14. 차량/탈것 시스템 (향후 확장)

CraftPix 차량 팩은 향후 챕터 확장 시 활용:

| 팩 | 팩 ID | 향후 용도 |
| -- | ----- | --------- |
| Battle Mecha | `craftpix-net-669945` | 특수 웨이브: 메카 탑승 모드 |
| Police Transport | `craftpix-net-687978` | 적 수송 차량 (T1 대량 투하) |
| Free Drones Pack | `craftpix-net-902201` | T3 공중 유닛 |
| Robots Pack | `craftpix-net-909754` | T3 지상 로봇 유닛 |
| Bike Constructor | `craftpix-net-325145` | 보너스 모드: 추격전 |
| Car Constructor | `craftpix-net-609014` | 보너스 모드: 호송전 |
| Truck Constructor | `craftpix-net-312671` | 보너스 모드: 보급 방어 |
| Submarine Constructor | `craftpix-net-113236` | Ch.2 히든 보너스 |

---

## 15. 밸런스 프레임워크

### 15.1 핵심 공식

```typescript
// 분대원 DPS 계산
const dps = (baseDamage * levelMult * damageMultiplier * critMultiplier) / (cooldownMs / 1000);

// 적 체력 스케일링 (웨이브별)
const enemyHp = baseHp * (1 + (wave - 1) * 0.15) * chapterMultiplier;

// 거점 HP
const fortHp = baseFortHp * (1 + metaFortLevel * 0.05);

// 웨이브 클리어 예상 시간
const expectedClearTime = totalEnemyHp / totalSquadDps;  // 목표: 20~45초/웨이브
```

### 15.2 밸런스 KPI

| KPI | 목표값 | 측정 방법 |
| --- | ------ | --------- |
| 웨이브 클리어율 (Ch.1) | 90%+ | 분석 로그 |
| 웨이브 클리어율 (Ch.7) | 40~60% | 분석 로그 |
| 평균 런 시간 | 5~8분 | 타이머 |
| 업그레이드 선택 분포 | 균등 (±10%) | 선택 로그 |
| 분대원 사용률 | 전원 20%+ | 편성 로그 |
| 메타 업그레이드 완료 시간 | ~50런 | 진행도 추적 |

### 15.3 난이도 S커브

```
난이도
  ▲
  │         ┌─── Ch.7 (ARIA 코어)
  │       ┌─┘
  │     ┌─┘ Ch.5~6 (마스터리)
  │   ┌─┘
  │ ┌─┘ Ch.3~4 (챌린지)
  │─┘
  │ Ch.1~2 (학습)
  └──────────────────────► 진행도
```

---

## 16. 에셋 로딩 전략

### 16.1 에셋 분류

| 분류 | 로딩 시점 | 내용 |
| ---- | --------- | ---- |
| **Core** | 앱 시작 | UI, 폰트, 공통 SFX, 메인 메뉴 BG |
| **Chapter** | 챕터 선택 시 | 해당 챕터 타일셋, 적, 보스, BGM, 배경 |
| **Character** | 로비 진입 시 | 편성된 분대원 스프라이트 + 무기 |
| **Meta** | 메타 씬 진입 시 | 업그레이드 아이콘, 도감 썸네일 |

### 16.2 에셋 경로 규약

```
public/assets/
├── sprites/
│   ├── characters/       # 분대원 스프라이트시트
│   │   ├── biker/        # Idle.png, Walk.png, Run.png, ...
│   │   ├── punk/
│   │   └── cyborg/
│   ├── enemies/          # 챕터별 적 스프라이트시트
│   │   ├── ch1_city/     # 1/ ~ 6/ (Idle, Walk, Attack, Hurt, Death)
│   │   ├── ch2_pirate/
│   │   └── ...
│   ├── bosses/           # 챕터별 보스
│   ├── vehicles/         # T3 공중 유닛
│   └── pets/             # 동반 크리처
├── tilesets/             # 32x32 타일셋 PNG
├── backgrounds/          # 패럴랙스 레이어 (5장 × 챕터)
├── icons/                # 32x32 아이템/스킬 아이콘
├── effects/              # VFX 스프라이트시트
├── ui/                   # GUI 요소
├── audio/
│   ├── bgm/              # 챕터별 BGM (MP3)
│   └── sfx/              # 효과음 (MP3)
└── maps/                 # Tiled JSON 맵 데이터
```

---

## 부록 A: CraftPix 팩 전체 인벤토리 (Hill Defense 사용 분)

### A.1 필수 팩 (Phase 0~1)

| 카테고리 | 팩 이름 | 팩 ID | 용도 |
| -------- | ------- | ----- | ---- |
| characters | Free Guns for Cyberpunk Characters | `craftpix-net-730561` | 메인 3캐릭터 (Biker/Punk/Cyborg) |
| characters | Free Guns Pack 2 | `craftpix-net-626011` | 추가 총기 + 이펙트 |
| enemies | Free City Enemies | `craftpix-net-223841` | Ch.1 적 (프로토타입) |
| bosses | Free Bosses Pixel Art | `craftpix-net-261169` | Ch.1 보스 (프로토타입) |
| tilesets | Free Industrial Zone Tileset | `craftpix-net-314143` | 프로토타입 거점 |
| backgrounds | Free Scrolling City Backgrounds | `craftpix-net-832833` | 전 챕터 패럴랙스 |
| ui | Cyber Intrusion Free GUI | `craftpix-net-618358` | 기본 UI |
| ui | Free GUI for Cyberpunk | `craftpix-net-894687` | HUD |
| audio | Free Futuristic Sounds & Music | `craftpix-net-608340` | 메인/전투 BGM + SFX |
| effects | Free Effects for Platformer | `craftpix-net-965938` | 기본 VFX |

### A.2 콘텐츠 팩 (Phase 2)

| 카테고리 | 팩 수 | 비고 |
| -------- | ----- | ---- |
| enemies | 19팩 | 챕터별 6종 적 세트 |
| bosses | 15팩 | 챕터별 보스 + 히든 |
| tilesets | 21팩 | 챕터별 타일셋 |
| icons | 46팩 | 업그레이드/아이템 아이콘 |
| audio | 5팩 | 챕터별 BGM/SFX |
| decorations | 11팩 | 환경 장식 |
| effects | 5팩 | VFX |
| constructors | 8팩 | 건 컨스트럭터 + 탈것 |
| vehicles | 4팩 | T3 유닛 + 향후 확장 |
| characters | 18팩 | 해금 캐릭터 + NPC |

---

## 부록 B: 데이터 스키마

### B.1 세이브 데이터

```typescript
interface SaveData {
  // 메타 진행
  totalGold: number;
  metaUpgrades: Record<string, number>;  // 업그레이드ID → 레벨
  unlockedCharacters: string[];
  unlockedPets: string[];
  unlockedWeapons: string[];

  // 챕터 진행
  chaptersCleared: number[];             // 클리어한 챕터 번호
  chapterBestWave: Record<number, number>; // 챕터별 최고 웨이브
  chapterBestTime: Record<number, number>; // 챕터별 최고 클리어 시간 (ms)

  // 도감
  encounteredEnemies: string[];
  encounteredBosses: string[];

  // 설정
  bgmVolume: number;
  sfxVolume: number;

  // 버전
  version: string;
  lastSaved: number;  // timestamp
}
```

### B.2 런 상태

```typescript
interface RunState {
  chapter: number;
  wave: number;
  totalWaves: number;

  squad: SquadMember[];
  fortHp: number;
  fortMaxHp: number;

  gold: number;
  xp: number;
  kills: number;

  activeUpgrades: Upgrade[];
  items: ConsumableItem[];

  waveTimer: number;         // 현재 웨이브 경과 시간
  totalTimer: number;        // 총 경과 시간

  phase: 'deploy' | 'combat' | 'upgrade' | 'boss' | 'clear' | 'gameover';
  seed: number;              // 시드 기반 랜덤
}

interface SquadMember {
  id: string;
  characterType: string;
  hp: number;
  maxHp: number;
  position: { x: number; y: number };
  weapon: WeaponConfig;
  level: number;
  upgrades: string[];
}
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
| ---- | ---- | --------- |
| v1.0 | 2026-03-08 | 최초 작성. NeonSurvivor → Hill Defense 전면 리디자인 GDD |
