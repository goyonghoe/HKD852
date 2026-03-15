# Session Log — WanChai NeonSurvivor

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

### Next Steps (v1.6.0)

- [ ] RunScene 리팩토링 (1850줄 → 3개 모듈 분리)
- [ ] 하드코딩 hex 색상 → colors.ts 이관 (9건)
- [ ] WeaponSystem + Enemy 행동 테스트 추가
- [ ] 통합 테스트 (boss→stageclear→levelup 플로우)
