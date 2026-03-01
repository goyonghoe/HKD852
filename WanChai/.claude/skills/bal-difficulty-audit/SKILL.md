---
name: bal-difficulty-audit
description: "난이도 종합 감사 — 60초 스테이지 클리어 가능성, 난이도 전환점, 밸런스 판정"
user-invocable: true
argument-hint: "[--meta-level 0|partial|max] [--weapon-set starter|mid|full]"
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-difficulty-audit — 난이도 종합 감사

## 역할
현재 60초 스테이지가 클리어 가능한지, 어느 시점에 난이도가 전환되는지 종합 판정합니다.

## 핵심 참조
- `src/config/balance.ts` — 전체 BALANCE 상수
- `src/config/weapons.ts` — WEAPON_DEFS
- `src/config/enemies.ts` — ENEMY_DEFS
- `src/config/upgrades.ts` — PASSIVE_DEFS
- `src/core/MetaProgression.ts` — META_UPGRADES
- `src/core/WaveDirector.ts` — 스폰 로직
- `src/core/DamageCalc.ts` — 데미지 공식
- `design/reference/numerical-bible.md` — KPI 기준 (§7)

## 절차

### 1. 적 유입 DPS vs 플레이어 DPS
10초 단위 체크포인트(0/10/20/30/40/50/60s)별:

**적 유입 DPS** = 초당 스폰되는 적의 총 HP
```
spawnRate(t) = 1000 / interval(t) × spawnCount(t)
avgEnemyHp(t) = weightedAvg(unlockedEnemies HP) × hpScale(t)
eliteMultiplier(t) = 1 + eliteChance(t) × 4  (엘리트 HP 5배)
incomingDPS(t) = spawnRate(t) × avgEnemyHp(t) × eliteMultiplier(t)
```

**플레이어 DPS** = 무기 조합 기반
- starter: energy_shot lv1 = ~12.5 DPS
- mid (3무기 lv2-3 + 패시브): ~80-120 DPS 추정
- full (4무기 lv4-5 + 전 패시브 + 메타): ~200-400 DPS 추정

### 2. 기지 HP 생존 분석
```
baseHp(0) = 1000 × (1 + metaHpBonus)

적이 기지에 도달하는 시간 = distance / speed
distance = baseY(1200) - spawnY(-30) = ~1230px
travelTime(t) = 1230 / (baseSpeed × speedScale(t))

killable(t) = playerDPS > incomingDPS (처리 가능 여부)
leakRate(t) = max(0, incomingDPS(t) - playerDPS) 를 HP로 환산
baseHp(t) = baseHp(0) - Σ leakedDamage + hpRegen
```

### 3. 핵심 임계점 식별

| 임계점 | 설명 | 건전 범위 |
|--------|------|----------|
| 안전구간 종료 | 첫 적 기지 도달 | 10-20s |
| 위험구간 시작 | playerDPS < incomingDPS | 25-40s |
| 압도 시점 | 기지 HP 급락 | 40-55s |
| 보스 등장 | t=50s, HP 500 | 처치 가능해야 |

### 4. 빌드별 감사

| 빌드 | 무기 | 패시브 | 메타 | 예상 결과 |
|------|------|--------|------|----------|
| 첫 런 | energy_shot lv1-3 | 0-2개 | 없음 | t=?에 게임오버 |
| 10런차 | 3무기 lv2-3 | 3-4개 | lv1-2 | 기지 HP ?% 잔여 |
| 50런차 | 4무기 lv4-5 | 전체 | 맥스 | 안정적 클리어? |

### 5. 보스 처치 가능성
```
bossHp = 500 (스케일링 없음, 엘리트로 스폰)
t=50s 시점 플레이어 DPS로 보스 TTK 계산
남은 시간 = 10s (60s - 50s)
보스 TTK < 10s → 처치 가능
보스 TTK > 10s → 보스 + 일반 적 동시 처리 불가능?
```

### 6. KPI 평가 (수치백과서 §7)
| KPI | 첫런 목표 | 10런 목표 | 맥스 목표 |
|-----|----------|----------|----------|
| 클리어율 | 10-30% | 50-70% | 90%+ |
| 도달 레벨 | 5-8 | 8-12 | 12-15 |
| 골드/런 | 30-60 | 60-120 | 120-200 |
| 보스 처치 | 0% | 50% | 90%+ |

### 7. 판정
- **BALANCED**: S커브 형상 유지, 모든 빌드에서 점진적 개선
- **TOO_EASY**: 첫 런에도 클리어 가능, 메타 투자 의미 없음
- **TOO_HARD**: 맥스 메타에도 클리어 불확실
- **SPIKE**: 특정 시점에 난이도 급등 (S커브 위반)

### 8. 산출물
`design/balance/bal-difficulty-analysis.md`

구성:
1. 시계열 테이블 (적유입DPS vs 플레이어DPS vs 기지HP)
2. 임계점 요약
3. 빌드별 비교표
4. 보스 처치 분석
5. KPI 평가
6. 종합 판정 + 튜닝 권고

## 제약
- `design/balance/` 폴더만 write
- 확률 = 기대값 사용
