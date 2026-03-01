---
name: gd-level
description: "레벨 설계 — 数值百宝书 난이도 지표 + 성장 곡선 기반"
user-invocable: true
argument-hint: "[world-stage] e.g. w1-s004"
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# /gd-level — 레벨 설계

## 역할
Game Designer로서 새로운 퍼즐 레벨을 설계합니다.
**수치 기획 바이블 (`design/reference/numerical-bible.md`)의 원칙을 반드시 따릅니다.**

## 핵심 참조
- **수치 바이블**: `design/reference/numerical-bible.md` — 반드시 먼저 읽을 것

## 절차

### 1. 기존 레벨 분석
- `src/data/levels/world-*/stage-*.json` — 기존 레벨 패턴
- `src/types/level.ts` — LevelData 인터페이스
- `src/types/hero.ts` — ElementColor enum (fire/water/earth/wind/light/dark)
- `design/status.json` — 어떤 레벨이 이미 설계/구현되었는지
- `design/reference/numerical-bible.md` — 수치 설계 원칙

### 2. 난이도 곡선 포지셔닝 (数値百宝书 §6)
레벨의 S자 곡선 위치 결정:
```
스테이지 1~3: 완만 (튜토리얼) — AP 여유, 원소 단순
스테이지 4~7: 급상승 (코어 챌린지) — 전략 필요
스테이지 8~10: 안정 (마스터) — 최적화 보상
```

### 3. 난이도 지표 산출 (数値百宝书 §4)
레벨 설계 시 반드시 다음 지표를 계산:

| 지표 | 공식 | 이 레벨 목표 |
|------|------|-------------|
| **AP 효율** | 총 AP / 총 큐브 HP | > 1.0 (풀 수 있는 레벨) |
| **원소 커버리지** | 히어로 원소 종류 / 큐브 원소 종류 | 1.0 = 완전 커버 |
| **이론 최저 AP** | 총 큐브 HP | 모든 발사 적중 시 |
| **실제 필요 AP** | 이론 최저 × 1.3~1.8 | 벨트 순환 빗나감 고려 |
| **여유도** | 총 AP / 실제 필요 AP | easy: 1.5+, normal: 1.2~1.5, hard: 1.0~1.2 |

### 4. 레벨 설계
- 플레이어가 이 레벨에서 배우거나 경험할 것 (Design Intent)
- 시각적 보드 레이아웃 (ASCII 그리드)
- 히어로 큐: 순서, 원소, AP, 각 선택의 근거
- 강화(Armored) 큐브 배치 (HP > 1)
- 컨베이어/벤치 슬롯 수
- 별 기준 점수 (난이도에 맞게)
- 최적 플레이 경로 설명

### 5. I/O 균형 검증 (数値百宝书 §5)
```
투입:                          산출:
├─ 히어로 큐 (AP 총합)        ├─ 파괴 가능 큐브 수
├─ 히어로 원소 분포            ├─ 기대 스코어
├─ 전략 자유도                 ├─ 별 등급 달성 가능성
└─ 슬링 타이밍                 └─ 잔여 히어로 보너스
```
**성가비 검증**: AP당 기대 스코어 = Σ(파괴 가능 큐브 × 100) / 총 AP

### 6. 난이도 증가 수단 선택 (数値百宝书 §6)
적절한 수단 조합:
- [ ] 큐브 행/열 수 증가 → 벨트 포지션 증가
- [ ] 원소 종류 증가 → 매칭 확률 감소
- [ ] 강화 큐브 (HP > 1) 배치
- [ ] 히어로 AP 감소 → 효율적 배치 강제
- [ ] 벨트/벤치 슬롯 감소 → 오버플로우 위험

### 7. 산출물
`design/levels/world-X/stage-XXX.md` — `_template.md` 형식 준수

### 8. 상태 업데이트
`design/status.json`에 레벨 항목 추가 (designStatus: "ready")

## 고려사항
- 순환 벨트 구조: 히어로가 TOP→RIGHT→BOTTOM→LEFT 순서로 이동
- 각 엣지에서 안쪽으로 발사 (top→아래, right→왼쪽, bottom→위, left→오른쪽)
- 벨트 포지션 수 = 2*(rows+cols)
- AP가 많으면 더 많은 큐브 파괴, 적으면 전략적 배치 필요

## 제약
- `src/`, `tests/`, `package.json` 수정 금지
- `design/` 폴더만 수정
