# 씬(Scene) 플로우

> WanChai의 10개 씬 구조, 전환 다이어그램, 각 씬의 역할

관련 파일: `src/scenes/`, `design/reference/ui-ux-guideline.md`

---

## 씬 목록

| #   | 씬                     | 역할                                                  |
| --- | ---------------------- | ----------------------------------------------------- |
| 1   | `BootScene`            | 초기 Phaser 설정, PreloadScene으로 즉시 전환          |
| 2   | `PreloadScene`         | 모든 스프라이트/텍스처 로드, 프로시저럴 텍스처 생성   |
| 3   | `MainMenuScene`        | 메인 메뉴 (START, 무기도감, 적도감, 월드맵, 메타강화) |
| 4   | `CharacterSelectScene` | 캐릭터 5종 선택 (잠금해제 조건 포함)                  |
| 5   | `WorldMapScene`        | 홍콩 8구역 스테이지 선택 지도                         |
| 6   | `RunScene`             | 핵심 게임플레이 (오토슈터 전투)                       |
| 7   | `GameOverScene`        | 게임오버 결과 화면 (스탯, 골드 획득)                  |
| 8   | `MetaScene`            | 영구 강화 구매 (META_UPGRADES 7종)                    |
| 9   | `WeaponCodexScene`     | 무기 도감 (17종 스크롤 가능 목록)                     |
| 10  | `EnemyCodexScene`      | 적 도감 (14종 스크롤 가능 목록)                       |

---

## 씬 전환 다이어그램

```
BootScene
    ↓
PreloadScene
    ↓
MainMenuScene ◄──────────────────────────────────┐
    │                                             │
    ├──[START]──→ CharacterSelectScene            │
    │                    ↓                        │
    │              WorldMapScene                  │
    │                    ↓ (스테이지 선택)         │
    │               RunScene ──────── [Game Over] → GameOverScene ──┘
    │                    │
    │                    └── [Stage Clear × 8] ─→ 최종 클리어 → GameOverScene
    │
    ├──[메타강화]──→ MetaScene ──────────────────────────────────────┘
    ├──[무기도감]──→ WeaponCodexScene ──────────────────────────────┘
    ├──[적도감]───→ EnemyCodexScene ────────────────────────────────┘
    └──[월드맵]───→ WorldMapScene ──────────────────────────────────┘
```

### 씬 전환 효과

| 전환                          | 효과                          | 지속시간 |
| ----------------------------- | ----------------------------- | -------- |
| 메뉴 → RunScene               | 검정 페이드 (Fade Black)      | 500ms    |
| RunScene → GameOverScene      | 검정 페이드                   | 500ms    |
| GameOverScene → MainMenuScene | 검정 페이드                   | 500ms    |
| 스테이지 → 다음 스테이지      | "STAGE CLEAR" 인게임 오버레이 | 2000ms   |

---

## 각 씬 상세

### BootScene

- Phaser 게임 초기화 후 즉시 `PreloadScene`으로 전환
- 설정 파일 로드

### PreloadScene

- 모든 스프라이트 에셋 로드 (`public/assets/sprites/`)
- `TextureFactory`로 프로시저럴 텍스처 생성 (적, 투사체, 배경 등)
- 로딩 진행바 표시
- 완료 후 `MainMenuScene`으로 전환

### MainMenuScene

- 게임 타이틀 "WANCHAI NEON SURVIVOR" 표시
- 버튼: START, 이어하기/새로하기/초기화 (저장 데이터 있을 때)
- 빠른 접근: 무기도감, 적도감, 월드맵, 메타강화

### CharacterSelectScene

- HAI, NOVA, SOL, MEI, KAI 5종 캐릭터 카드 표시
- 잠금해제 조건 표시 (SOL: 런 3회, MEI: 골드 500, KAI: 처치 200)
- 선택된 캐릭터의 원소, 시작 무기, 패시브 능력 확인

### WorldMapScene

- 홍콩 8구역 스테이지 지도
- DragScroll 적용 (M-016 방지)
- 스테이지 상태: `cleared` / `current` / `locked`
- 스테이지 선택 후 `RunScene`으로 데이터 전달

### RunScene

코어 게임플레이 씬. Phase 상태머신으로 제어:

```
'loading' → 'playing' → 'levelup' → 'playing'
                      → 'shop' → 'playing'
                      → 'stage_clear' → 'playing' (다음 스테이지)
                      → 'gameover'
```

주요 서브시스템:

- `SpawnManager` — 적 스폰
- `WeaponSystem` — 무기 자동 발사
- `CollisionManager` — 충돌 처리
- `ProgressionManager` — XP/레벨
- `HUDManager` — HUD 렌더링
- `WeatherManager` — 날씨 효과
- `AllyManager` — 크리터 동맹
- `UltimateManager` — 궁극기

### GameOverScene

- 런 결과 표시: 생존 시간, 처치 수, 획득 골드
- 메타 골드 합산 (`SaveManager`)
- 버튼: "다시 시작", "메인 메뉴"

### MetaScene

- `META_UPGRADES` 7종 영구 업그레이드 구매
- 골드 차감, 레벨 표시
- 누적 골드 잔액 표시

### WeaponCodexScene / EnemyCodexScene

- 전체 무기 17종 / 적 14종 목록
- DragScroll 적용 (뷰포트 초과 콘텐츠)
- Back 버튼 화면 하단 고정 (M-016)
