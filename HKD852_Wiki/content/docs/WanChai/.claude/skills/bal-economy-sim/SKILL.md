---
name: bal-economy-sim
description: '골드 경제 시뮬레이션 — 런당 수입, 메타 업그레이드 페이싱, 멀티런 진행'
user-invocable: true
argument-hint: '[--runs N] [--skill-level beginner|average|expert]'
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-economy-sim — 골드 경제 시뮬레이션

## 역할

골드 경제 사이클을 시뮬레이션합니다: 런당 수입, 메타 업그레이드 페이싱, 멀티런 파워 진행.

## 핵심 참조

- `src/config/balance.ts` — RUN.goldPerKill(1), goldPerElite(5), goldPerBoss(50), SPAWN 상수
- `src/core/MetaProgression.ts` — META_UPGRADES 5종 (비용, 효과)
- `src/core/WaveDirector.ts` — 스폰율 → 킬 수 추정
- `src/config/enemies.ts` — 적 XP 값

## 절차

### 1. 런당 골드 계산

스킬 레벨별 모델링:

| 레벨     | 생존 시간    | 킬 비율 | 설명                |
| -------- | ------------ | ------- | ------------------- |
| beginner | ~30s         | 60%     | 초반 적만 처리 가능 |
| average  | ~45s         | 75%     | 중반까지 안정적     |
| expert   | 60s (클리어) | 90%     | 대부분 처치         |

```
normalKills = totalSpawns × killRate × (1 - eliteRate)
eliteKills  = totalSpawns × killRate × eliteRate
bossKill    = 1 if surviveTime >= 50s else 0

gold = normalKills × 1 + eliteKills × 5 + bossKill × 50
```

totalSpawns는 WaveDirector 공식에서 도출 (10초 윈도우별 적분)

### 2. 메타 업그레이드 우선순위

각 업그레이드의 **골드당 파워 증가** 계산:

```
cost_efficiency = (power_increase) / (gold_cost)

meta_damage lv1: +10% DPS / 50골드 = 0.002/골드
meta_hp lv1:     +15% 기지HP / 50골드 = 0.003/골드
meta_speed lv1:  +10% 이속 / 80골드 = 0.00125/골드
meta_xp lv1:     +20% XP / 100골드 = 0.002/골드
meta_crit lv1:   +3% 크릿 / 60골드 = 0.0005/골드
```

우선순위 정렬 → 최적 구매 순서 도출

### 3. 50런 시뮬레이션 (default --runs 50)

각 런:

1. 현재 메타 보너스 적용 → 예상 생존시간/킬수 추정
2. 골드 획득
3. 최적 메타 업그레이드 구매 (가장 비용효율 높은 것)
4. 기록: 런#, 골드잔액, 메타 레벨 상태, 예상 생존시간

### 4. 경제 건전성 판정

| 지표          | 건전 범위 | 의미                                 |
| ------------- | --------- | ------------------------------------ |
| 첫 업그레이드 | 1-3런     | 즉각적 보상 체감                     |
| 체감 강화     | 5-10런    | "강해졌다" 느낌                      |
| 전체 맥스     | 50-100런  | 장기 목표 유지                       |
| 런당 골드     | 30-200    | 너무 적으면 지루, 너무 많으면 무의미 |

**판정**: HEALTHY / TOO_FAST / TOO_SLOW / UNBALANCED

### 5. 산출물

`design/balance/bal-economy-flow.md`

구성:

1. 런당 골드 수입 테이블 (beginner/average/expert)
2. 메타 업그레이드 우선순위 순위표
3. 50런 시뮬 타임라인
4. 경제 건전성 판정 + 튜닝 권고

## 제약

- `design/balance/` 폴더만 write
- 확률 기반 = 기대값(가중 평균) 사용, 몬테카를로 아님
