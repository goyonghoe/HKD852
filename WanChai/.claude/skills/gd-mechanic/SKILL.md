---
name: gd-mechanic
description: '신규 게임 메카닉 스펙 작성 — 数值百宝书 속성 체계 + 전투 공식 기반'
user-invocable: true
argument-hint: '[mechanic-name]'
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /gd-mechanic — 신규 메카닉 설계

## 역할

Game Designer로서 새로운 게임 메카닉을 설계합니다.
**수치 기획 바이블 (`design/reference/numerical-bible.md`)의 원칙을 반드시 따릅니다.**

## 핵심 참조

- **수치 바이블**: `design/reference/numerical-bible.md` — 반드시 먼저 읽을 것

## 절차

### 1. 현행 시스템 파악

- `src/types/hero.ts` — ElementColor, SkillType, HeroInstance
- `src/types/puzzle.ts` — BeltPosition, BeltHero, OrbitResult, StepResult
- `src/types/level.ts` — LevelData 스키마
- `src/core/TurnResolver.ts` — 현재 턴 시뮬레이션 로직
- `src/core/BoardState.ts` — 보드 상태 및 4방향 탐색
- `src/core/ConveyorState.ts` — 순환 벨트 상태
- `src/config/balance.ts` — 현재 밸런스 상수
- `design/reference/numerical-bible.md` — 수치 설계 원칙

### 2. 속성 계층 분류 (数値百宝书 §2)

새 메카닉이 도입하는 모든 속성을 3단계로 분류:

| 계층         | 정의                                 | 특성                 |
| ------------ | ------------------------------------ | -------------------- |
| **1차 속성** | 전투에 직접 참여하는 기초 속성       | 확정적, 매 전투 사용 |
| **2차 속성** | 1차 속성 위에 구축, 단일 결과에 영향 | 확률적 (%), 랜덤성   |
| **3차 속성** | 1·2차 속성을 보정                    | 후기 밸런스 조정용   |

**패널 공식 적용**: `실제값 = 기초값 × 계수 + 보정값`

### 3. 전투 공식 영향 분석 (数値百宝书 §3)

새 메카닉이 기존 전투 공식에 미치는 영향:

```
현재: 히어로 원소 == 큐브 원소 → AP 1 소모 → 큐브 HP 1 감소
```

- 감산/승산/혼합 중 어떤 공식 체계를 따르는가?
- 기존 원소 매칭 시스템과의 상호작용
- 향후 확장 시 호환성 (원소 상성, 스킬, 강화 큐브)

### 4. 대항 속성 설계 (数値百宝书 §8)

**모든 새 속성은 반드시 대항 쌍(对抗属性)을 가져야 함**:

- 새 속성이 강화하는 것 ↔ 이를 견제하는 것
- 예: 폭탄 범위 ↔ 방어 큐브 HP, 관통력 ↔ 큐브 배치 밀도

### 5. 메카닉 설계

- 기존 코어루프(순환 벨트 + 매칭 파괴)와의 상호작용 분석
- Functional/Non-Functional 요구사항 작성
- 테스트 기준 정의 (Programmer가 검증 가능한 수준)
- 밸런스 파라미터 제안 (before/after 표, 패널 공식 포함)
- LevelData 스키마 변경 필요 시 명시
- **I/O 영향**: 투입(AP, 원소) → 산출(스코어, 파괴) 균형 변화 예측

### 6. 확률 메카닉 시 추가 검증 (数値百宝书 §9)

확률 기반 메카닉 도입 시:

- **극단적 부정 결과 방지**: 점진적 확률 증가 또는 빈도 변환 적용
- **판정 방법 선택**: 순차 판정(우선순위) vs 원탁 판정(균등 배분)
- 확률 대신 확정적 빈도(쿨다운) 사용 가능 여부 검토

### 7. 산출물

`design/specs/mechanics/{mechanic-name}.md` — `_template.md` 형식 준수

### 8. 상태 업데이트

`design/status.json`에 새 항목 추가 (designStatus: "draft" 또는 "ready")

## 제약

- `src/`, `tests/`, `package.json` 수정 금지
- `design/` 폴더만 수정
