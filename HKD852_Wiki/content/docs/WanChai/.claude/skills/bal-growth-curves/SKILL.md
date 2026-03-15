---
name: bal-growth-curves
description: '성장 곡선 설계 및 검증 — XP, 적 스케일링, 스폰율, 무기 성장, 메타 진행'
user-invocable: true
argument-hint: '[curve-type: xp|enemy|spawn|weapon|meta|all]'
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-growth-curves — 성장 곡선 분석

## 역할

게임 내 모든 수학적 성장 곡선을 모델링하고 교차 검증합니다.
플레이어 파워 vs 적 파워가 시간에 따라 어떻게 변화하는지 분석합니다.

## 핵심 참조

- `src/core/XpTable.ts` — XP 곡선 (base=10, growthFactor=1.25)
- `src/config/balance.ts` — DIFFICULTY, SPAWN, XP, RUN 상수
- `src/config/enemies.ts` — 6 적 기본 스탯
- `src/config/weapons.ts` — 8 무기 스탯
- `src/core/WaveDirector.ts` — 스폰 로직
- `src/core/MetaProgression.ts` — 메타 업그레이드 비용/효과
- `design/reference/numerical-bible.md` — S커브 원칙 (§6)

## 절차

### 1. XP 곡선 분석

```
required(lv) = ceil(10 × 1.25^(lv-1))
totalToLevel(lv) = Σ required(i), i=1..lv
```

테이블: 레벨 1-20

- 레벨별 필요 XP
- 누적 XP
- 필요 킬 수 (기본 xpValue=1 기준)
- 60초 내 현실적 도달 레벨 추정 (킬레이트 기반)

### 2. 적 HP/Speed/Damage 곡선

6적 각각, t=0/10/20/30/40/50/60s:

```
hp(t)     = baseHp × 2.0^(t/60)
speed(t)  = min(baseSpeed × 1.3^(t/60), baseSpeed × 2.0)
damage(t) = baseDamage × 1.5^(t/60)
```

ASCII 테이블로 정리. 주요 전환점 식별:

- 1히트킬 불가능해지는 시점 (무기별)
- 적이 기지에 도달하는 시간 추정 (거리 ÷ 속도)

### 3. 스폰율 곡선

```
interval(t) = max(800, 1200 × 0.40^(t/60))
spawnCount(t) = 1 + floor((t/60) × 2)
eliteChance(t) = 0.05 + 0.15 × (t/60)
```

10초 윈도우별:

- 스폰 횟수
- 적 수 (일반 + 엘리트 기대값)
- 총 적 HP 유입량 (= 초당 HP 유입 DPS)

### 4. 무기 파워 곡선

레벨업으로 무기가 성장하는 속도:

```
weaponDmg(lv) = baseDmg × (1 + (lv-1) × 0.2)
```

적 HP 성장(×2.0/분) vs 무기 DPS 성장(레벨업으로 ×1.8 + 패시브)
→ 교차점: 어느 시점에 적 HP 성장이 플레이어 DPS를 추월하는가?

### 5. 메타 진행 곡선

```
meta_damage: [50, 100, 200, 400, 800] → 총 1550골드
meta_hp:     [50, 100, 200, 400, 800] → 총 1550골드
meta_speed:  [80, 200, 500]           → 총 780골드
meta_xp:     [100, 250, 600]          → 총 950골드
meta_crit:   [60, 120, 250, 500, 1000]→ 총 1930골드
전체 맥스 비용: 6760골드
```

런당 예상 골드(스킬별) → 전체 맥스까지 필요 런 수

### 6. S커브 검증 (수치백과서 §6)

복합 난이도 지표를 10초 단위로 계산:

```
difficulty(t) = 적유입DPS(t) / 플레이어DPS(t)
```

이상적 S커브:

- 0-20s: gentle (difficulty < 0.5) — 학습 구간
- 20-45s: steep (0.5 < difficulty < 1.0) — 핵심 도전
- 45-60s: plateau (difficulty ~ 1.0-1.5) — 숙련 구간

실제 곡선이 이 패턴과 일치하는지 검증

### 7. 교차 분석

플레이어 총 DPS vs 적 총 유입 DPS 시계열:

- **우위 구간**: 플레이어 > 적 (편안함)
- **균형점**: 플레이어 ≈ 적 (긴장감)
- **열세 구간**: 플레이어 < 적 (기지 HP 감소)

→ 판정: BALANCED / PLAYER_DOMINANT / ENEMY_DOMINANT

### 8. 산출물

`design/balance/bal-growth-curves.md`

구성:

1. XP 진행 테이블 (레벨 1-20)
2. 적 스케일링 테이블 (6적 × 7시점)
3. 스폰율 테이블 (10초 윈도우)
4. 무기 성장 vs 적 HP 교차 분석
5. 메타 진행 페이싱
6. S커브 검증 결과
7. 교차 분석 판정

## 제약

- `design/balance/` 폴더만 write
- 모든 수치는 `src/config/` 추적
