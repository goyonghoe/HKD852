---
name: vault-weekly
description: "금요일 주간 리뷰 자동 생성 — 데일리 노트 5개 요약"
user-invocable: true
argument-hint: "[주차 또는 생략(이번 주)]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "요약 + 패턴 분석 — Sonnet 최적"
---

# 주간 리뷰 스킬

> 이번 주 데일리 노트를 읽고 주간 리뷰를 자동 생성합니다.

## Vault 경로

```
VAULT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852_Vault
```

## 실행 절차

### Step 1: 이번 주 데일리 노트 수집

```bash
# 이번 주 월~금 날짜 계산
# Glob으로 해당 날짜 파일 읽기
```

```
Glob: $VAULT_ROOT/01_Daily/YYYY/MM/YYYY-MM-DD.md  (월~일 7개)
```

각 데일리 노트를 Read로 읽어 내용 수집.

### Step 2: 이번 주 회의록 수집

```
Glob: $VAULT_ROOT/05_Meetings/YYYY-MM-*.md (이번 주 범위)
```

### Step 3: 이번 주 의사결정 수집

```
Glob: $VAULT_ROOT/03_Decisions/YYYY-MM-*.md (이번 주 범위)
```

### Step 4: 칸반 변동 확인

```
Read: PMO_Agent/kanban.json
→ 이번 주 완료된 태스크 (done 상태, 날짜 비교)
```

### Step 5: 주간 리뷰 작성

```
파일: $VAULT_ROOT/01_Daily/YYYY-WXX-주간리뷰.md
```

**포맷:**

```markdown
---
date: "YYYY-MM-DD"
type: weekly-review
tags: [weekly, review]
week: "YYYY-WXX"
---

# 주간 리뷰 — YYYY년 M월 X주차

## 이번 주 완료한 일
- (데일리 노트의 [x] 항목 + 칸반 done 태스크 종합)

## 이번 주 주요 회의
- [[회의록 링크]] — 핵심 결정 1줄 요약

## 이번 주 의사결정
- [[결정 링크]] — 결정 내용 1줄

## 미완료 → 다음 주 이월
- (데일리 노트의 [ ] 반복 항목 중 3회 이상 등장한 것)

## 수치/성과
- (칸반: 완료 N건, 신규 N건, 잔여 N건)

## 이번 주 배운 것
- (CEO가 직접 추가하는 영역)

## 다음 주 포커스
- (미완료 + 칸반 우선순위 기반 제안)
```

## 인자 처리

- `$ARGUMENTS` 비어있으면: 이번 주 (현재 날짜 기준 월~일)
- 주차 지정: `W10`, `2026-W10` 등 → 해당 주 리뷰
