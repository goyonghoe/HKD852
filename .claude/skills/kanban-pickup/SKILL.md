---
name: kanban-pickup
description: "칸반 태스크 픽업 — backlog → in_progress"
user-invocable: true
allowed-tools: Read, Write, Edit
model: opus
---

# /kanban-pickup — 태스크 시작

## 목적
배정된 에이전트가 Backlog 태스크를 픽업하여 In Progress로 전환합니다.

## 인자
```
/kanban-pickup <TASK-ID>
```
- `<TASK-ID>` (필수): 픽업할 태스크 ID (예: TASK-001)

## 실행 절차

### 1. 데이터 로드
`PMO_Agent/kanban.json`을 Read로 읽습니다.

### 2. 검증
- 해당 ID의 태스크가 존재하는지 확인
- 현재 status가 `backlog`인지 확인
- 다른 상태면 에러 메시지 출력:
  ```
  ❌ TASK-001은 현재 'in_progress' 상태입니다. backlog 상태만 픽업 가능합니다.
  ```

### 3. 상태 전환
```json
{
  "status": "in_progress",
  "updated_at": "<현재 ISO 8601 KST>",
  "history": [...기존, { "from": "backlog", "to": "in_progress", "by": "<에이전트>", "at": "<현재>" }]
}
```

### 4. 저장
- Write 도구로 `PMO_Agent/kanban.json`에 저장합니다.
- 동기화: `cp PMO_Agent/kanban.json PMO_Agent/app/public/kanban.json`

### 5. 확인 출력
```
✅ 태스크 픽업 완료
- ID: TASK-001
- 프로젝트: WanChai
- 제목: 무기 코덱스 씬 UX 설계
- 담당: game-designer
- 상태: backlog → 🔵 in_progress
- 시작 시각: 2026-03-02T10:30:00+09:00
```
