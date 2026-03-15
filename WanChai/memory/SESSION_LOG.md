# Session Log — WanChai NeonSurvivor

## 2026-03-12 | Sprint-012 + TD-1: 기반 정비 + 코드 품질

### Checkpoint: Sprint-012 + TD-1 완료

**팀 구성**: designer + coder + coder2 (3명 병렬)

**완료 태스크 (12건):**

- TASK-040 [coder]: RunScene 잔여 평가 — 이미 711줄로 적정 (Sprint-009 분할 완료 확인)
- TASK-041 [designer]: 퍼즐 스펙 8건 아카이브 (SPEC-001~007, 006A → archive/ 이동)
- TASK-042 [designer]: Chapter 1 설계서 오토슈터 리부트 (퍼즐 용어 제거, 6스테이지 구조)
- TASK-043 [designer]: Boss Aero 오토슈터 전투 메카닉 재설계 (3페이즈: 바람 편향/드론 소환/기류 역전)
- TASK-056 [coder]: hex 색상 검증 — 이슈 없음 확인
- TASK-057 [coder]: resolveTexture 강화 — PreloadScene 검증 로직 추가
- TASK-058 [coder]: ProgressionManager mock 타입 경고 수정
- TASK-059 [designer]: design/status.json 현행화 (tests 3376, 매니저 16개 반영)
- TASK-060 [coder2]: WeaponSystem DPS 테스트 — 10종 무기 커버리지
- TASK-061 [coder2]: Enemy 행동 테스트 — 11종 적 구성/속성 검증
- TASK-062 [coder2]: 통합 테스트 — 보스 클리어 직렬화 플로우 (M-014 방지)
- TASK-063 [coder2]: 씬 전환 배선 자동 검증 테스트 (M-008 방지)

**검증:** Build PASS | Tests 3527/3527 PASS (+151) | Deploy https://project-wanchai.vercel.app

**주요 변경:**

- `design/specs/archive/` — 퍼즐 스펙 8건 아카이브
- `design/specs/chapter-01-central.md` — 오토슈터 전면 재작성
- `design/specs/boss-mechanics-01-aero.md` — 오토슈터 전면 재작성
- `design/status.json` — v39, 현행화 완료
- `src/config/atlas-manifest.ts` — resolveTexture 검증 강화
- `tests/systems/WeaponSystemDPS.test.ts` — 신규 (무기 10종)
- `tests/config/EnemyConfig.test.ts` — 신규 (적 11종)
- `tests/integration/BossFlow.test.ts` — 신규 (보스 직렬화)
- `tests/integration/SceneWiring.test.ts` — 신규 (씬 배선)

**잔여 LSP 경고 (빌드 통과, 후속 정리 필요):**

- EnemyConfig.test.ts: `category` 속성 미존재 (EnemyDef 타입)
- CombatEventManager.test.ts: 타입 변환 경고
- RunSceneInit.ts: pre-existing characterId/totalDamageDealt 경고

**Next Steps:**

- Sprint 13: 튜토리얼 시스템 + 캐릭터 패시브 실장
- Sprint TD-2: 설계 문서 현행화 + E2E 테스트 기반
- LSP 경고 잔여 정리 (EnemyDef.category, RunState 필드)

---

## 2026-03-12 | Sprint-011: 팔+총 튜닝 + ARIA 이벤트 + 런칭 최적화

### Checkpoint: Sprint-011 배포 완료 (v1.5.5)

**팀 구성**: artist + designer + coder (3명 병렬)

**완료 태스크:**

- Task #1 [lead]: 칸반 JSON 상태 정리 (Sprint-010 완료분 6건 반영)
- Task #2 [artist]: PLAYER_ANIM 최종 튜닝 — armScaleMult 0.45→1.0 (손 크기 근본 수정), armOffsetY 6→-8 (어깨 높이)
- Task #3 [coder]: TS 진단 확인 — stale LSP, 빌드 0 에러 확인
- Task #4 [designer]: SPEC-026 ARIA 스토리 이벤트 설계서 작성
- Task #5 [coder]: ARIA 구현 — 5개 런타임 트리거 + i18n 14키 + 테스트 21건
- Task #6 [coder]: 런칭 최적화 — PreloadScene 로딩 팁 7개 추가
- Task #7 [coder]: 최종 배포

**검증:** Build PASS | Tests 3376/3376 PASS (+21) | Deploy https://project-wanchai.vercel.app

**주요 변경:**

- `src/config/balance.ts` — PLAYER_ANIM 9개 값 조정
- `src/core/AriaDialogueCalc.ts` — RuntimeStoryBeat, getRuntimeDialogue()
- `src/locales/en.ts`, `ko.ts` — ARIA 대사 14키
- `src/scenes/RunScene.ts` — runtimeEventState + checkRuntimeAriaEvent
- `src/managers/CombatEventManager.ts` — 보스킬/킬/골드 트리거 배선
- `src/managers/ProgressionManager.ts` — player_death/district_change 배선
- `src/scenes/PreloadScene.ts` — 로딩 팁 UI
- `design/specs/mechanics/SPEC-026-aria-story-events.md` — 신규 스펙
- `design/status.json` — v38, gameVersion 1.5.5

**Next Steps:**

- 플레이 테스트로 팔+총 위치 최종 확인 (CEO 피드백 필요)
- ProgressionManager.test.ts checkRuntimeAriaEvent 타입 호환성 경고 (LSP only, 빌드 통과)

---

## 2026-03-12 | Sprint-009 버그 수정 + Sprint-010 비주얼/코드품질/UX

### Checkpoint: Sprint-010 배포 완료

**Sprint-009 (단독 작업):**

- Atlas 텍스처 해결: `resolveTexture()` 유틸리티 생성 → 12개 파일 적용
- Camera zoom drift 수정 (VFXManager)
- MetaScene 스크롤 추가 (GeometryMask)
- TASK-019~021 완료 + TASK-022~025 등록

**Sprint-010 (Agent Teams: artist + coder + ux):**

- TASK-022: 플레이어 팔+총 위치/크기 튜닝 (artist)
- TASK-023: 패럴랙스 TileSprite→Image 변환 — 얼굴 반복 아티팩트 해결 (artist)
- TASK-024: PreloadScene 누락 텍스처 오류 정리 — PROCEDURAL_ONLY_KEYS 셋 추가 (coder)
- TASK-025: TS 컴파일 경고 정리 — 미사용 파라미터 접두사화, 통합 테스트 4건 추가 (coder)
- TASK-015: 모바일 터치 타겟 48dp 검증 — EnemyCodexScene 필터/뱃지 수정 (ux)
- TASK-016: 코드 정리 — 미사용 임포트 제거 (coder)
- BackgroundManager 테스트 수정 (TileSprite→Image 전환 반영)

**검증:** Build PASS | Tests 3355/3355 PASS | Deploy https://project-wanchai.vercel.app

**변경 파일 (주요):**

- `src/config/atlas-manifest.ts` — resolveTexture 유틸
- `src/config/balance.ts` — PLAYER_ANIM 값 튜닝
- `src/managers/BackgroundManager.ts` — 패럴랙스 Image 전환
- `src/managers/CollisionManager.ts` — resolveTexture 적용
- `src/managers/LevelUpUIManager.ts` — resolveTexture 적용
- `src/objects/Player.ts` — 핸드 스프라이트 atlas
- `src/objects/Projectile.ts` — resolveTexture 적용
- `src/scenes/PreloadScene.ts` — PROCEDURAL_ONLY_KEYS
- `tests/managers/BackgroundManager.test.ts` — 패럴랙스 테스트 갱신

**Next Steps:**

- 팔+총 위치 추가 미세 조정 (CEO: "여전히 문제가 많네")
- ProgressionManager / Integration.test.ts TS 경고 정리 (pre-existing)
- MetaScene VISUAL import 확인

---

## 2026-03-01 | v1.5.0 콘텐츠 확장 + 핫픽스

### Checkpoint: v1.5.0 배포 완료 + 핫픽스 4건

**작업 내역:**

#### Phase 1: v1.5.0 콘텐츠 업데이트

1. **무기 리워크 2종**
   - `aura_field` → `napalm` (네이팜탄): 화염 지대 지속 데미지, 새 projectileType 'napalm'
   - `orbit_guard` → `shuriken` (수리검): 관통 3체 + 회전 시각효과 (spinRate)
   - orbit 관련 코드 전면 제거 (RunScene의 orbitSprites, syncOrbitSprites 등)

2. **신규 무기 2종**
   - `railgun` (레일건): 고알파 스나이퍼, 전체 관통, laser 타입 재사용
   - `rapid_fire` (속사포): 초당 5발, 짧은 사거리, bullet 타입 재사용

3. **신규 적 4종**
   - `swarm` (군체): 소형 자폭, HP 5, 대량 출현
   - `guardian` (수호형): 초중장갑 HP 100, 넉백 면역
   - `sniper_enemy` (저격수): 원거리 고데미지, shoot 행동 재사용
   - `teleporter` (전이체): 순간이동 행동 신규 구현

4. **레벨업 자동 선택**: 3초 타이머 바 + scoreBest 알고리즘
5. **텍스처/스프라이트**: projectile_shuriken, projectile_rapid, enemy_teleporter
6. **스테이지 적 풀 업데이트**: 3스테이지 구성 갱신

#### Phase 2: 핫픽스 (CEO 피드백)

7. **SFX 삑삑 수정**: 게임 시작 시 이상한 비프음 제거
8. **스테이지 검증**: WaveDirector + RunScene setEnemyPool() 연동 확인
9. **난이도 대폭 상향**:
   - 기지 HP 1000→600, 스폰 간격 900→800ms, 최소 500→400ms
   - 적 HP/데미지/속도 전면 상향 (basic HP 10→18, boss1 HP 800→1200)
   - WaveDirector 스폰 수 ramp 강화 (min*2 → min*3)
10. **메인메뉴 개편**: 이어하기/새로하기/데이터 초기화 + 확인 다이얼로그
11. **보급포인트 자동 선택**: 3초 타이머 + scoreBestShopChoice() (HP<70% 힐 우선)
12. **스테이지 클리어 버튼화**: auto-advance → "다음 스테이지" 버튼
13. **게임오버 프리즈 수정**: update() 내 3개 가드 + 100ms 지연 씬 전환
14. **보스+레벨업 직렬화**: pendingStageClear 플래그로 팝업 겹침 방지

### 빌드/테스트 상태

- `npm test`: 30 PASS
- `npm run build`: 0 TS errors
- 배포: vercel deploy --prod 완료

### v1.5.1 밸런스 핫픽스 (완료)

- [x] 네이팜탄: cooldown 5000→2500ms, baseDamage 8→15 (DPS 1.6→48 이론치)
- [x] 보스 HP 스케일링: hpScalePerMin 3.0→2.2, maxBossHp 15000 cap
- [x] 엘리트 배율: 5x→3x, 출현률 캡 50%
- [x] 배포 완료: https://project-wanchai.vercel.app

### v1.5.2 보스 클리어 소프트락 수정 (완료)

- [x] applyUpgrade에서 pendingStageClear 처리 시 phase='playing' 전환 누락 → 추가
- [x] M-014 등록, Gate 8 (보스 클리어 플로우 검증) 신설

### v1.5.3 전체 플로우 검증 + 추가 수정 (완료)

- [x] 부트→메뉴→게임→게임오버→메타→메뉴 전체 플로우 코드 트레이스
- [x] 동시 다수 킬 시 showLevelUpUI 중복 호출 방지 (phase='playing' 가드)
- [x] nextStage()에 방어적 적 정리 루프 추가
- [x] 배포 완료: https://project-wanchai.vercel.app

---

## 2026-03-09 | QA 자동화 + 맵 에디터 파이프라인 구축

### Checkpoint: QA 6스킬 + 이슈 7건 해결 + 맵 파이프라인 재설계

**작업 내역:**

#### Phase 1: QA 자동화 스킬 구축 (6종)

1. `/qa-smoke` (Haiku): 빌드+테스트+타입 원커맨드
2. `/qa-type` (Sonnet): any/assertion/미사용 코드 탐지
3. `/qa-balance` (Sonnet): balance.ts 기준 수치 범위 검증
4. `/qa-regression` (Sonnet): 변경 파일 영향도 분석
5. `/qa-spec` (Opus): 기획서 ↔ 코드 정합성
6. `/qa-report` (Sonnet): 전체 QA HTML 대시보드

#### Phase 2: QA 실행 → 7건 이슈 발견 + 해결 (TASK-224~230)

멀티 에이전트 팀 3명 병렬 투입하여 전건 해결:

| TASK | 이슈                                               | 해결                                               |
| ---- | -------------------------------------------------- | -------------------------------------------------- |
| 224  | `as unknown as` 이중 단언 (main.ts, Projectile.ts) | 타입 인터페이스 정의로 교체                        |
| 225  | SaveManager JSON.parse 미검증                      | isValidSaveData/isValidRunState 가드 추가          |
| 226  | map-editor innerHTML XSS 위험 5건                  | createElement + textContent로 교체                 |
| 227  | RunScene 매직넘버 13개                             | balance.ts로 추출 (TARGET_RETICLE, BOSS_BOUNCE 등) |
| 228  | map-editor JSON import 미검증                      | decorations 배열 체크, autoSave try/catch          |
| 229  | map-editor render() 과다 호출                      | rAF 스로틀 + sort 캐싱                             |
| 230  | map-editor innerHTML XSS 추가 2건                  | createElement으로 교체                             |

#### Phase 3: 맵 에디터 → 게임 파이프라인 근본 재설계

**문제**: 맵 에디터에서 배경/바닥을 설정해도 게임에 전혀 반영되지 않음

**해결 — 3계층 파이프라인 구축:**

1. **map-server.py** (재작성)
   - CraftPix cp_key → 원본 파일 경로 역해석 (14,391개 forward lookup)
   - PNG 자동 복사 → `public/assets/maps/textures/`
   - 클린 키 + textures[] 매니페스트 JSON 변환

2. **PreloadScene** (확장)
   - `collectMapTextures()`: 8개 챕터 JSON에서 textures[] 수집
   - 동적 `this.load.image()` → `this.load.start()` → MainMenu 진행

3. **RunScene** (확장)
   - `updateBackground()`: 챕터 JSON의 bgLayers로 커스텀 배경 렌더 (fallback 유지)
   - 바닥 타일: 챕터 JSON의 ground.surfaceTile/fillTile 사용

**검증 결과:**

- Chapter 1: 배경 3장 + 바닥 타일 2종 Deploy 완료
- 텍스처 PNG 5개 HTTP 200 확인
- 빌드+테스트 PASS (3110/3110)

### 빌드/테스트 상태

- `npm test`: 3110 PASS
- `npm run build`: 0 TS errors
- 스킬 총 52개 (기존 46 + QA 6)

### Next Steps

- [ ] RunScene 리팩토링 (1850줄 → 3개 모듈 분리)
- [ ] 하드코딩 hex 색상 → colors.ts 이관 (9건)
- [ ] WeaponSystem + Enemy 행동 테스트 추가
- [ ] 통합 테스트 (boss→stageclear→levelup 플로우)
- [ ] 맵 에디터로 Chapter 2~8 배경 편집
- [ ] 맵 에디터 장식물(decorations) 배치 후 게임 반영 검증
