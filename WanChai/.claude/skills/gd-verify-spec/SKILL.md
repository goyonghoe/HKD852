---
name: gd-verify-spec
description: '설계 스펙 문서의 구조/완성도 검증 — 구현 전 사전 체크'
user-invocable: true
argument-hint: '[spec-id] e.g. SPEC-020'
allowed-tools: Read, Glob, Grep
model: sonnet
---

# /gd-verify-spec — 스펙 문서 사전 검증

## 역할

Game Designer로서 설계 문서가 Programmer에게 넘기기 전에 완전한지 검증합니다.

## 절차

### 1. 스펙 로드

- `design/status.json`에서 spec-id 조회
- 해당 설계 문서 전체 읽기

### 2. 구조 체크

필수 섹션 존재 여부:

- [ ] **Meta** (Author, Date, Status, Priority)
- [ ] **Summary** (1-3문장 요약)
- [ ] **Functional Requirements** (FR-01 이상)
- [ ] **Test Criteria** (TC-01 이상)
- [ ] **Balance Parameters** (해당 시)
- [ ] **Edge Cases** (최소 2개)

### 3. 수치 바이블 준수

- `design/reference/numerical-bible.md` 참조
- [ ] 속성 계층 분류 (1차/2차/3차) 명시
- [ ] 대항 속성 정의
- [ ] 수치 범위/공식 명시 (매직넘버 없음)

### 4. 모호성 검사

- "적절히", "필요 시", "등" 같은 모호한 표현 플래그
- 누락된 상태 전이 또는 에러 케이스 식별

### 5. 판정

- **READY**: 구현 가능 → `designStatus: "ready"` 권고
- **REVISE**: 보완 필요 → 구체적 보완 항목 제시
- **INCOMPLETE**: 핵심 섹션 누락 → 작성 필요 목록

### 6. 결과 로그

SESSION_LOG.md에 기록:
`[HH:MM] /gd-verify-spec [SPEC-ID] [READY/REVISE/INCOMPLETE]`
파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`

## 제약

- 코드 수정 금지 (읽기 전용)
- `design/status.json`만 업데이트 가능
