# Sprint Summary — WanChai NeonSurvivor

## Sprint 5: 2026-03-01 (v1.5.0)

### 목표: 콘텐츠 확장 + 유저 경험 개선

### 완료된 작업

| #   | 작업                                        | 변경 파일                                               | 상태 |
| --- | ------------------------------------------- | ------------------------------------------------------- | ---- |
| 1   | aura_field → napalm 리워크                  | weapons.ts, WeaponSystem.ts, types/weapon.ts            | DONE |
| 2   | orbit_guard → shuriken 리워크               | weapons.ts, WeaponSystem.ts, Projectile.ts, RunScene.ts | DONE |
| 3   | railgun 추가                                | weapons.ts                                              | DONE |
| 4   | rapid_fire 추가                             | weapons.ts                                              | DONE |
| 5   | swarm/guardian/sniper_enemy/teleporter 추가 | enemies.ts, Enemy.ts, types/enemy.ts                    | DONE |
| 6   | 레벨업 3초 자동 선택                        | RunScene.ts, balance.ts                                 | DONE |
| 7   | 보급포인트 3초 자동 선택                    | RunScene.ts                                             | DONE |
| 8   | 메인메뉴 이어하기/새로하기/초기화           | MainMenuScene.ts, SaveManager.ts                        | DONE |
| 9   | 스테이지 클리어 버튼화                      | RunScene.ts                                             | DONE |
| 10  | 게임오버 프리즈 수정                        | RunScene.ts                                             | DONE |
| 11  | 보스+레벨업 직렬화                          | RunScene.ts                                             | DONE |
| 12  | 난이도 대폭 상향                            | balance.ts, enemies.ts, WaveDirector.ts                 | DONE |
| 13  | SFX 버그 수정                               | RetroSFX.ts                                             | DONE |

### 코드베이스 현황 (v1.5.0)

| 항목         | 수치                       |
| ------------ | -------------------------- |
| 파일 수      | 44                         |
| 총 코드 라인 | ~8,476                     |
| 무기 종류    | 10                         |
| 적 종류      | 14 (일반 11 + 보스 3)      |
| 씬 수        | 9                          |
| 테스트 수    | 30 (5 suites)              |
| 배포 URL     | project-wanchai.vercel.app |

### 레드팀 평가 결과

**등급: B+ (출시 가능, 조건부)**

| 카테고리  | 평가 | 이유                                       |
| --------- | ---- | ------------------------------------------ |
| 코드 품질 | B+   | 깔끔, 메모리 누수 없음, 모놀리식 RunScene  |
| 밸런스    | C    | 네이팜 쓸모없음, 엘리트/보스 스케일링 과도 |
| 아키텍처  | A-   | 좋은 분리, 소수 규칙 위반                  |
| 성능      | A    | 효율적 풀링, O(n) 패턴                     |
| 테스트    | C    | 유닛 커버리지 양호, 통합 테스트 0          |

### 핵심 리스크

1. **CRITICAL**: 네이팜 DPS 1.6 vs 산탄총 DPS 41.7 (25배 차이)
2. **HIGH**: 보스 HP 스케일링 (스테이지 6 보스 50,000+ HP 가능)
3. **HIGH**: 엘리트 배율 5x가 후반 스테이지에서 승리 불가 상황 유발
4. **HIGH**: RunScene 1840줄 모놀리식 — 리팩토링 필요

### 다음 스프린트 (v1.5.1) 목표

- P0: 네이팜 리밸런싱
- P0: 보스/엘리트 스케일링 조정
- P1: 하드코딩 색상 정리
- P2: RunScene 모듈 분리
- P2: 통합 테스트 추가
