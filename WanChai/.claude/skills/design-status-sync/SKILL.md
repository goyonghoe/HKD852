---
name: design-status-sync
description: "design/status.json 자동 동기화 — 실제 파일 존재 + 구현 상태 확인"
user-invocable: true
allowed-tools: Read, Edit, Glob, Grep
model: haiku
---

# /design-status-sync — 상태 파일 동기화

## 역할
design/status.json을 실제 코드베이스와 동기화합니다.

## 절차

### 1. 현행 상태 로드
```
design/status.json
```

### 2. 파일 존재 검증
각 항목의 `designDoc`과 `implPath` 파일이 실제 존재하는지 확인:
- designDoc 경로의 .md 파일 존재?
- implPath의 .ts/.json 파일 존재?
- 누락 시 플래그

### 3. 구현 상태 교차 검증
`implStatus: "implemented"` 항목:
- implPath 파일에 핵심 export/class가 존재하는지 Grep
- 테스트 파일 존재 여부 (`tests/` 하위)

### 4. 불일치 보고
```
SYNC REPORT
- OK: N items
- MISSING_DOC: [list]
- MISSING_IMPL: [list]
- STALE_STATUS: [list]
```

### 5. 자동 수정 (선택)
- 누락된 항목: notes에 "[MISSING]" 태그 추가
- status.json `lastUpdated` 갱신

## 규칙
- status.json만 수정
- 코드/설계 문서는 수정하지 않음
