# WanChai (NeonSurvivor) v1.5.3

사이버펑크 홍콩 배경 사이드뷰 오토슈터 서바이버.

## 프로젝트 개요

| 항목   | 내용                                    |
| ------ | --------------------------------------- |
| 장르   | 사이드뷰 오토슈터 서바이버 (로그라이트) |
| 배경   | 사이버펑크 홍콩                         |
| 엔진   | Phaser 3.90+ (TypeScript, Vite 6)       |
| 해상도 | 1280x720 (16:9 랜드스케이프)            |
| 배포   | https://project-wanchai.vercel.app      |
| 버전   | v1.5.3                                  |

## 기술 스택

- **게임 엔진**: Phaser 3
- **언어**: TypeScript 5.7+ (strict mode)
- **빌드**: Vite 6
- **테스트**: Vitest 3
- **배포**: Vercel

## 빠른 시작

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm test         # 유닛 테스트
vercel deploy --prod  # 배포
```

## 게임 구조

### 씬 구성 (9개)

| 씬              | 역할                        |
| --------------- | --------------------------- |
| MainMenu        | 메인 타이틀 화면            |
| CharacterSelect | 캐릭터 선택                 |
| Boot            | 부트 초기화                 |
| Preload         | 에셋 프리로드               |
| Run             | 코어 게임 루프 (전투)       |
| GameOver        | 게임 오버 화면              |
| Meta            | 메타 진행 (영구 업그레이드) |
| WeaponCodex     | 무기 도감                   |
| EnemyCodex      | 적 도감                     |
| WorldMap        | 월드맵                      |

### 캐릭터 (5명)

| 캐릭터 | 설명     | 상태      |
| ------ | -------- | --------- |
| Hai    | 바이커   | 구현 완료 |
| Nova   | 펑크     | 구현 완료 |
| Sol    | 사이보그 | 구현 완료 |
| Mei    | —        | TODO      |
| Kai    | —        | TODO      |

### 콘텐츠 규모

- **6 스테이지**: 3 웨이브 + 3 보스
- **10종 무기**
- **11종 적**
- **3종 보스**
- **258개 스프라이트** (CraftPix 기반)

## 아키텍처

```
WanChai/
├── src/
│   ├── core/       — 순수 TypeScript (Phaser import 금지, M-001)
│   ├── scenes/     — Phaser 렌더링 계층
│   ├── managers/   — 12개 매니저 (HUD, Phase, Spawn, Shop, Weather 등)
│   ├── config/     — balance.ts, colors.ts, enemies.ts, weapons.ts 등 중앙 설정
│   ├── ui/         — ButtonFactory, GlassPanel, DamageNumber, PauseOverlay 등
│   ├── objects/    — Player, Enemy, Projectile
│   ├── systems/    — WeaponSystem
│   ├── types/      — 타입 정의
│   ├── audio/      — RetroAudio, RetroSFX
│   └── utils/      — TextureFactory, VFXManager, DragScroll
├── tests/          — 유닛/통합 테스트
├── design/         — 기획 문서
│   ├── specs/      — 메카닉 스펙 (SPEC-001~023)
│   ├── levels/     — 레벨 디자인
│   ├── balance/    — 밸런스 데이터
│   ├── reference/  — 수치 바이블, 아트 가이드, UX 가이드
│   └── ui/         — UI/UX 감사 문서
└── public/assets/  — 스프라이트, 오디오 에셋
```

### 핵심 설계 원칙

- `src/core/`는 순수 TypeScript만 — Phaser import 절대 금지 (M-001)
- 모든 수치 상수는 `src/config/balance.ts`에서 중앙 관리 (M-002)
- 모든 색상은 `src/config/colors.ts`에서 중앙 관리 (M-003)

## 사이드뷰 전환 (2026-03-10)

Sprint 5에서 탑뷰에서 사이드뷰로 전환 완료:

- **플레이어 좌측 고정** (x=200), 적 우측에서 접근
- **지상/공중 적 분류** (ground/air category)
- **팔+총 레이어 분리** — body 고정, arm 회전
- **바리케이트**: 작은 상자 1개 (플레이어 오른쪽)
- **5레이어 TileSprite 패럴랙스 배경**

## 테스트 현황

- **87 테스트 파일**, 3116 테스트 케이스 전체 통과
- 핵심 커버리지: DamageCalc, WaveDirector, SpatialHash, XpTable, SeededRandom
- 통합 테스트: SceneFlowContracts, DeadCodeAudit

## 에이전트 팀 (6명)

| 에이전트         | 역할                          | 스킬           |
| ---------------- | ----------------------------- | -------------- |
| game-designer    | 메카닉/레벨/밸런스 설계       | `/gd-*` (7개)  |
| programmer       | 구현/배선/배포                | `/pg-*` (8개)  |
| art-director     | 프로시저럴 텍스처, VFX        | `/art-*` (4개) |
| ui-designer      | 레이아웃, 애니메이션, UX      | `/ui-*` (5개)  |
| balance-designer | DPS/TTK, 성장 곡선, 경제 시뮬 | `/bal-*` (6개) |
| audio-designer   | BGM/SFX, 오디오 믹싱          | `/aud-*` (4개) |

**총 52개 스킬** (칸반 7개 + 공통 2개 포함)

## 실수 방지 체계

- **mistake-registry.md** — M-001~M-016 (16개 등록)
  - 아키텍처, 밸런스, 테스트, 통합, UI, 프로세스 카테고리별 방지 규칙
- **verification-gates.md** — 배포 전 필수 검증 게이트
  - Gate 0: 사전 게이트 (UX, 배선)
  - Gate 1-5: 빌드, 테스트, 스프라이트, UX, 배선 검증

## 개발 히스토리

| 스프린트   | 주요 내용                                    |
| ---------- | -------------------------------------------- |
| Sprint 3-4 | 퍼즐(순환형 컨베이어) → 오토슈터 피봇 완료   |
| Sprint 5   | 사이드뷰 전환, CraftPix 아트 통합, UI 폴리시 |
| 현재       | v1.5.3 — 코어 게임루프 100% 완성             |

## 현재 상태

**v1.5.3** — 코어 게임루프 완성. 사이드뷰 오토슈터 서바이버의 핵심 메카닉, 6개 스테이지, 전체 UI/UX 시스템 구현 완료. 87개 테스트 파일 / 3116 테스트 전체 통과.
