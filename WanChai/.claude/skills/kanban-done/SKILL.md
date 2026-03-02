---
name: kanban-done
description: "WanChai 칸반 태스크 완료 — in_progress → done"
user-invocable: true
allowed-tools: Read, Write, Edit
model: opus
---

# /kanban-done — 태스크 완료

## 목적
배정된 에이전트가 작업을 완료하고 In Progress → Done (검토 대기)로 전환합니다.

## 인자
```
/kanban-done <TASK-ID> [--note <완료 메모>] [--tokens <input>,<output>,<model>]
```
- `<TASK-ID>` (필수): 완료할 태스크 ID
- `--note` (선택): 완료 시 메모 (산출물 경로, 변경 사항 등)
- `--tokens` (선택): AI 토큰 사용량 기록 (예: `--tokens 45000,32000,opus`)

## 실행 절차

### 1. 데이터 로드
`WanChai/kanban.json`을 Read로 읽습니다.

### 2. 검증
- 해당 ID의 태스크가 존재하는지 확인
- 현재 status가 `in_progress`인지 확인
- qa_fail이나 redteam_reject에서 재작업 후 완료하는 경우도 허용:
  - `qa_fail` → `done` (재검토 요청)
  - `redteam_reject` → `done` (재검토 요청)

### 3. 상태 전환 + 토큰 기록
```json
{
  "status": "done",
  "updated_at": "<현재 ISO 8601 KST>",
  "token_usage": {
    "total_tokens": "<기존 total + input + output>",
    "entries": [...기존, { "phase": "구현", "input": 45000, "output": 32000, "model": "opus", "by": "<에이전트>", "at": "<현재>" }]
  },
  "history": [...기존, { "from": "<이전 상태>", "to": "done", "by": "<에이전트>", "at": "<현재>", "note": "<메모>" }]
}
```
- `--tokens`가 없으면 `token_usage`는 변경하지 않음
- `token_usage`가 null이었으면 새로 생성: `{ "total_tokens": input+output, "entries": [...] }`
- 기존 entries가 있으면 배열 끝에 추가하고 `total_tokens`를 재계산

### 4. 저장
Write 도구로 `WanChai/kanban.json`에 저장합니다.

### 5. 확인 출력
```
✅ 태스크 완료 처리
- ID: TASK-001
- 제목: 무기 코덱스 씬 UX 설계
- 담당: game-designer
- 상태: in_progress → 🟡 done (검토 대기)
- 완료 시각: 2026-03-02T14:00:00+09:00
- 메모: outputs/weapon_codex_spec.md 생성
- 토큰: 77.0K (In: 45.0K / Out: 32.0K / opus)
⏳ Quality Gate 검토를 기다립니다.
```
