---
name: vault-monthly
description: "월간 회고 자동 생성 — 데일리 노트 한 달치 요약"
user-invocable: true
argument-hint: "[YYYY-MM 또는 생략(이번 달)]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "요약 + 패턴 분석 — Sonnet 최적"
---

# 월간 회고 스킬

> 한 달치 데일리 노트, 회의록, 결정 노트를 읽고 월간 회고를 자동 생성합니다.

## Vault 경로

```
VAULT_ROOT=/Users/yong/MainFolder/My_AI_Project/HKD852_Vault
```

## 실행 절차

### Step 1: 대상 월 결정

- 인자가 `YYYY-MM` 형식이면 해당 월 사용
- 인자 생략 시 현재 날짜 기준 이번 달 사용

```bash
# 예: 2026-03 → YEAR=2026, MONTH=03
```

### Step 2: 데일리 노트 수집

```
$VAULT_ROOT/01_Daily/YYYY/MM/*.md
```

- Glob으로 해당 월의 모든 데일리 노트 파일 목록을 가져온다
- 각 파일을 Read로 읽는다
- 파일이 없으면 "해당 월에 데일리 노트가 없습니다" 안내 후 종료

### Step 3: 회의록 수집

```
$VAULT_ROOT/05_Meetings/
```

- Grep으로 해당 월(YYYY-MM)이 포함된 회의록 파일을 검색한다
- 파일명 또는 frontmatter의 date 필드로 해당 월 필터링
- 각 회의록을 Read로 읽어 핵심 내용 파악

### Step 4: 결정 노트 수집

```
$VAULT_ROOT/03_Decisions/
```

- Grep으로 해당 월(YYYY-MM)이 포함된 결정 노트를 검색한다
- 파일명 또는 frontmatter의 date 필드로 해당 월 필터링
- 각 결정 노트를 Read로 읽어 결정 사항 파악

### Step 5: 분석 수행

수집된 데이터에서 다음을 추출/분석한다:

1. **하이라이트**: 가장 중요한 성과 3-5개 (완료된 태스크, 마일스톤, 릴리즈 등)
2. **회의 & 결정 요약**: 각 회의록/결정 노트를 `[[파일명]]` 위키링크 + 핵심 1줄로 정리
3. **에너지 추이**: 데일리 노트의 `energy` 필드 값을 수집하여 평균/추이 계산. 가장 좋았던 날과 힘들었던 날 식별
4. **반복 미완료 태스크**: 3회 이상 이월된 항목 식별 (체크박스 `- [ ]`가 여러 날 반복 등장)
5. **인물 맵**: `[[사람이름]]` 또는 `@이름` 패턴으로 가장 많이 언급된 사람 Top 5
6. **배운 것**: 데일리 노트의 learnings/TIL 섹션 또는 관련 키워드 수집
7. **다음 달 포커스**: 미완료 항목 + 반복 주제에서 다음 달 집중 영역 도출

### Step 6: 월간 회고 파일 생성

**출력 경로**: `$VAULT_ROOT/01_Daily/YYYY/MM/YYYY-MM-월간회고.md`

**출력 형식**:

```markdown
---
date: "YYYY-MM-DD"
type: monthly-review
tags: [monthly, review]
month: "YYYY-MM"
---

# 월간 회고 — YYYY년 M월

## 이번 달 하이라이트
- (가장 중요한 성과 3-5개)

## 주요 회의 & 결정
- [[회의록 링크]] — 핵심 1줄
- [[결정 링크]] — 결정 내용 1줄

## 에너지 추이
- (데일리 노트의 energy 필드 평균/추이)
- 가장 좋았던 날 / 가장 힘들었던 날

## 반복된 미완료 태스크
- (3회 이상 이월된 항목 — "킬/위임/분해" 판단 필요)

## 인물 맵
- 이번 달 가장 많이 언급된 사람 Top 5

## 배운 것

## 다음 달 포커스
```

### Step 7: 완료 보고

- 생성된 파일 경로 안내
- 수집한 데일리 노트 수, 회의록 수, 결정 노트 수 표시
- 주요 발견 사항 1-2줄 요약
