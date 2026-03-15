---
name: gd-review
description: '구현된 코드를 설계 스펙 대비 검증 — PASS/REVISE 판정'
user-invocable: true
argument-hint: '[spec-id] e.g. SPEC-001'
allowed-tools: Read, Glob, Grep
model: opus
---

# /gd-review — 구현 검증 리뷰

## 역할

Game Designer로서 Programmer가 구현한 코드를 설계 스펙 대비 검증합니다.

## 절차

### 1. 스펙 로드

- `design/status.json`에서 해당 spec-id 또는 level-id 찾기
- 해당 설계 문서 읽기 (design/specs/ 또는 design/levels/)

### 2. 구현 코드 확인

- 스펙에 명시된 `src/` 파일들 읽기
- 관련 테스트 파일 읽기

### 3. 요구사항 체크

각 항목별 PASS/FAIL 판정:

- [ ] Functional Requirements (FR-01, FR-02, ...)
- [ ] Non-Functional Requirements (NFR-01, ...)
- [ ] Test Criteria (TC-01, TC-02, ...)
- [ ] Balance Parameters — 스펙에 명시된 값과 실제 구현 비교

### 수치 바이블 준수 검증 (design/reference/numerical-bible.md)

- [ ] 속성 계층: 신규 속성이 1차/2차/3차 분류를 따르는가
- [ ] 패널 공식: `실제값 = 기초값 × 계수 + 보정값` 구조인가
- [ ] 대항 속성: 모든 속성에 대항 쌍이 존재하는가
- [ ] 난이도 지표: AP 효율, 원소 커버리지, 여유도가 기준 범위 내인가
- [ ] I/O 균형: 성가비(AP당 기대 스코어)가 균등한가

### 4. 판정

- **PASS**: 모든 요구사항 충족 → `implStatus: "verified"`
- **REVISE**: 미충족 항목 있음 → 구체적 수정 요청 목록 제공 → `implStatus: "revise"`
- **BLOCK**: 근본적 설계 재검토 필요

### 5. 상태 업데이트

`design/status.json` 업데이트

### 6. 결과 로그

SESSION_LOG.md에 기록:
`[HH:MM] /gd-review [SPEC-ID] [PASS/REVISE/BLOCK]`
파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`

## 제약

- 코드 수정 금지 (읽기 전용)
- 판정 결과만 `design/status.json`에 반영
