---
name: bal-change-proposal
description: '밸런스 변경 제안서 — before/after 비교, 영향 분석, 프로그래머 전달용 구현 스펙'
user-invocable: true
argument-hint: '[area: weapons|enemies|spawn|economy|xp|meta] [issue description]'
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /bal-change-proposal — 밸런스 변경 제안서

## 역할

분석 결과를 기반으로 구체적인 balance.ts/weapons.ts/enemies.ts 변경을 제안합니다.
프로그래머가 바로 구현할 수 있는 스펙 수준으로 작성합니다.

## 핵심 참조

- `design/balance/bal-*.md` — 기존 분석 문서들
- `src/config/balance.ts` — 현재 상수 (변경 대상)
- `src/config/weapons.ts` — 무기 정의 (변경 대상)
- `src/config/enemies.ts` — 적 정의 (변경 대상)
- `src/config/upgrades.ts` — 패시브 정의 (변경 대상)
- `src/core/MetaProgression.ts` — 메타 정의 (변경 대상)
- `design/reference/numerical-bible.md` — 패널 공식 (§2), 대항 속성 (§8)
- `design/balance/_template.md` — 문서 형식

## 절차

### 1. 기존 분석 로드

`design/balance/bal-*.md`에서 문제점 식별:

- DPS 매트릭스: 무기 간 DPS 격차
- 성장곡선: 교차점 이상
- 경제: 페이싱 문제
- 난이도: 임계점 이상
- 빌드: 깨진 상호작용

### 2. 문제 정의

```
문제: [무엇이 잘못되었는가]
원인: [어떤 상수가 원인인가]
영향: [게임 경험에 미치는 영향]
```

### 3. 변경 제안 (패널 공식 적용)

```
실제값 = 기초값 × 계수 + 보정값
```

| 파라미터        | 파일       | 현재값 | 제안값 | 변화율 | 근거                |
| --------------- | ---------- | ------ | ------ | ------ | ------------------- |
| bomb.baseDamage | weapons.ts | 50     | 40     | -20%   | S-tier DPS 15% 초과 |

### 4. 영향 파급 분석

변경이 연쇄적으로 영향을 미치는 시스템:

- TTK 변화: 어떤 적의 TTK가 얼마나 변하는가?
- 경제 영향: 킬레이트 변화 → 골드/런 변화?
- 빌드 영향: 무기 티어 순위 변동?
- 난이도 영향: 클리어율 변화?

### 5. 대항 속성 확인 (수치백과서 §8)

- 변경된 속성의 대항 쌍이 여전히 유효한가?
- S커브 형상이 유지되는가?
- 비율 상한이 존재하는가?

### 6. 구현 스펙 (프로그래머 전달용)

```
## 구현 지시
1. 파일: src/config/weapons.ts
   - 라인 XX: baseDamage: 50 → baseDamage: 40
2. 파일: src/config/balance.ts
   - 라인 XX: hpScalePerMin: 2.0 → hpScalePerMin: 1.8

## 테스트 수정
- tests/core/xxx.test.ts: 기대값 변경

## 검증
- npm run build PASS
- npm test PASS
- 실제 플레이 체감 확인
```

### 7. 리스크 평가

| 리스크      | 등급             | 설명                         |
| ----------- | ---------------- | ---------------------------- |
| 밸런스 붕괴 | low/medium/high  | 다른 시스템 연쇄 파괴 가능성 |
| 체감 악화   | low/medium/high  | 플레이어 경험 저하 가능성    |
| 되돌리기    | easy/medium/hard | 롤백 복잡도                  |

### 8. 산출물

`design/balance/bal-change-{area}-{YYYY-MM-DD}.md`

구성:

1. 문제 정의
2. Before/After 비교표
3. 영향 파급 분석
4. 대항 속성 검증
5. 구현 스펙
6. 리스크 평가
7. 승인 체크리스트:
   - [ ] /gd-review 검증
   - [ ] /pg-implement 구현
   - [ ] /bal-dps-matrix 재계산
   - [ ] design/status.json 업데이트

## 제약

- `design/balance/` 폴더만 write
- 구현은 제안만 (실제 코드 수정 금지)
- 모든 제안은 현재 src/config/ 값 기반
