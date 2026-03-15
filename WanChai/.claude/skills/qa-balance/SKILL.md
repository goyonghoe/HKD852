---
name: qa-balance
description: '밸런스 수치 범위 검증 — balance.ts 기준 이상치 탐지'
user-invocable: true
argument-hint: '[category] e.g. weapon, enemy, xp, economy, all'
allowed-tools: Read, Glob, Grep, Bash
model: sonnet
---

# /qa-balance — 밸런스 수치 검증

## 역할

QA 에이전트로서 게임 밸런스 수치가 합리적 범위 내인지 검증합니다.

## 절차

### 1. balance.ts 읽기

```
Read: src/config/balance.ts
```

### 2. 수치 범위 검증

#### 무기 (weapons.ts)

| 항목 | 최소 | 최대 | 기준 |
|------|------|------|------|
| damage | 1 | 500 | 레벨 스케일링 고려 |
| fireRate | 50 | 5000 | ms 단위 |
| projectileSpeed | 50 | 1000 | px/frame |
| range | 100 | 2000 | px |

#### 적 (enemies.ts)

| 항목 | 최소 | 최대 | 기준 |
|------|------|------|------|
| hp | 1 | 10000 | 보스 포함 |
| speed | 10 | 300 | px/s |
| damage | 1 | 100 | 접촉 대미지 |
| xpValue | 1 | 500 | 드랍 경험치 |

#### 경험치/레벨 (XpTable.ts)

- 레벨 간 XP 증가율: 1.1x ~ 2.0x (급격한 점프 경고)
- 최대 레벨 도달 시간: 예상 스테이지 수와 일치하는지

### 3. 매직 넘버 스캔

```
Grep: pattern "\b\d{2,}\b" glob "*.ts" path "src/scenes/"
```

- `balance.ts`, `colors.ts`, `weapons.ts`, `enemies.ts` 외부에 하드코딩된 수치 탐지 (M-002)

### 4. 결과 보고

```
⚖️ BALANCE AUDIT
──────────────────
범위 이탈:    N건 [상세]
매직 넘버:    N건 [상세]
성장곡선:     정상 / 이상
──────────────────
권장 조정: [있으면 제안]
```

## 규칙

- 코드 수정하지 않음 (분석만)
- numerical-bible.md와 교차 검증
