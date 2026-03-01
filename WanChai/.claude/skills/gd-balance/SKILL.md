---
name: gd-balance
description: "스코어, AP, 별 기준 등 밸런스 분석 및 변경 제안 — 数值百宝书 원칙 적용"
user-invocable: true
argument-hint: "[area] e.g. scoring, ap-curves, star-thresholds"
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /gd-balance — 밸런스 튜닝

## 역할
Game Designer로서 게임 밸런스를 분석하고 조정안을 제안합니다.
**수치 기획 바이블 (`design/reference/numerical-bible.md`)의 원칙을 반드시 따릅니다.**

## 핵심 참조
- **수치 바이블**: `design/reference/numerical-bible.md` — 반드시 먼저 읽을 것

## 절차

### 1. 현행 밸런스 파악
- `src/config/balance.ts` — BALANCE, VISUAL 상수
- `src/core/ScoreCalculator.ts` — 스코어링 공식
- `src/data/levels/world-*/stage-*.json` — 전 레벨 파라미터 분포
- `tests/core/` — 기존 밸런스 관련 테스트
- `design/reference/numerical-bible.md` — 수치 설계 원칙

### 2. 속성 계층 분석 (数值百宝书 §2)
모든 파라미터를 3단계 속성으로 분류하여 분석:

| 계층 | WanChai 속성 | 분석 포인트 |
|------|-------------|------------|
| **1차** | AP, Element, Cube HP | 직접 전투 참여, 확정적 |
| **2차** | 슬링 콤보 배율, 벨트 포지션 효율 | 확률적/상황적 보너스 |
| **3차** | 별 기준 점수, 보너스 스코어 | 최종 보정값 |

### 3. I/O 균형 분석 (数値百宝书 §5)
투입-산출 프레임워크로 경제 균형 점검:
```
투입: 히어로 큐(AP 총합) + 원소 분포 + 전략
산출: 파괴 큐브 수 + 스코어 + 별 등급
```
- **성가비(性价比) 검증**: 모든 원소의 AP당 기대 스코어가 균등한가?
- **소비 모델**: 초반 소액→고빈도 피드백→후반 대량 소비 패턴 준수?

### 4. 핵심 KPI 계산 (数値百宝书 §7)
반드시 다음 4가지 KPI를 산출:
```
1. 클리어율 = 클리어 횟수 / 총 시도  (목표: easy 90%, normal 60%, hard 30%)
2. 평균 별 = Σ별 / 시도 수           (목표: easy 2.5+, normal 1.5+, hard 1.0+)
3. AP 사용률 = 사용 AP / 총 가용 AP   (적정: 60~90%)
4. 빈 발사율 = 매칭 실패 / 총 발사    (적정: 20~40%)
```

### 5. 밸런스 원칙 점검 (数値百宝书 §8)
- **대항 속성**: 히어로 AP ↔ 큐브 HP, 원소 매칭 ↔ 원소 다양성 균형
- **비율 상한**: 퍼센트 증가에 상한선 (슬링 콤보 최대 5 = 50%)
- **분배율 관리**: AP 배분으로 난이도 조절
- **성가비 균등**: 같은 투자 대비 같은 수준의 보상
- **플레이어 경험 우선**: 수치가 아닌 체감 결과 설계

### 6. 난이도 곡선 검증 (数値百宝书 §6)
```
난이도 지표 = 총 큐브 수 × 평균 큐브 HP / 총 가용 AP

여유도 기준:
  easy:   1.5+ (AP 충분)
  normal: 1.2~1.5 (전략 필요)
  hard:   1.0~1.2 (최적화 필수)
```
S자 곡선 준수 여부: 1~3 완만 → 4~7 급상승 → 8~10 안정

### 7. 변경 제안
- Before/After 표 (패널 공식 적용: `실제값 = 기초값 × 계수 + 보정값`)
- 영향받는 레벨 목록 + 각 레벨의 KPI 변화 예측
- 리스크 수준 (low/medium/high)
- 3차원 복기 체크: 전투 복기, 경제 복기, 양성(성장) 복기

### 8. 산출물
`design/balance/{area}.md` — `_template.md` 형식 준수

## 제약
- `src/`, `tests/`, `package.json` 수정 금지
- `design/` 폴더만 수정
