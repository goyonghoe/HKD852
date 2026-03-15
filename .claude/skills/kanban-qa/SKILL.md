---
name: kanban-qa
description: "칸반 QA 평가 — CFMC 매트릭스 기반 품질 검증"
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /kanban-qa — CFMC 품질 평가

## 목적
Quality Gate가 Done 상태의 태스크 산출물을 CFMC 매트릭스로 평가하고,
80점 이상이면 qa_passed, 미만이면 qa_fail로 전환합니다.

## 인자
```
/kanban-qa <TASK-ID>
```
- `<TASK-ID>` (필수): QA 평가할 태스크 ID

## 실행 절차

### 1. 데이터 로드
`PMO_Agent/kanban.json`을 Read로 읽습니다.

### 2. 검증
- 해당 ID의 태스크가 존재하는지 확인
- 현재 status가 `done`인지 확인

### 3. CFMC 평가 실행
CFMC (Completeness, Fidelity, Maintainability, Compliance) 4개 축으로 평가합니다:

| 축 | 설명 | 배점 |
|----|------|------|
| **C** Completeness | 요구사항 대비 완성도 | 25 |
| **F** Fidelity | 원본 의도 충실도 | 25 |
| **M** Maintainability | 유지보수성, 코드 품질 | 25 |
| **C** Compliance | 표준/보안/정책 준수 | 25 |

태스크의 `project` 필드를 확인하여 해당 프로젝트 디렉토리 내에서 Glob/Grep/Read로 산출물을 찾아 검토합니다.

### 4. 판정
- **총점 80+**: `qa_passed` → RedTeam 리뷰 대기
- **총점 <80**: `qa_fail` → 에이전트에게 피드백과 함께 반려

### 5. 결과 기록 + 토큰
```json
{
  "status": "qa_passed 또는 qa_fail",
  "updated_at": "<현재 ISO 8601 KST>",
  "qa_review": {
    "score": 85,
    "breakdown": { "completeness": 22, "fidelity": 23, "maintainability": 20, "compliance": 20 },
    "feedback": "전반적으로 양호. 에러 핸들링 보강 필요.",
    "reviewed_at": "<현재 ISO 8601 KST>",
    "reviewed_by": "Quality_Gate"
  },
  "token_usage": {
    "total_tokens": "<기존 total + QA input + output>",
    "entries": [...기존, { "phase": "QA", "input": "<QA 입력 토큰>", "output": "<QA 출력 토큰>", "model": "opus", "by": "Quality_Gate", "at": "<현재>" }]
  },
  "history": [...기존, { "from": "done", "to": "qa_passed", "by": "Quality_Gate", "at": "<현재>" }]
}
```
- QA 평가에 사용된 토큰을 추정하여 기록 (산출물 읽기 + 평가 추론)
- `token_usage`가 null이면 새로 생성

### 6. 저장 및 출력

#### 통과 시
```
✅ QA 통과 — TASK-001
- 총점: 85/100
- C:22 | F:23 | M:20 | C:20
- 판정: 🟢 QA Passed
- 토큰: +46.5K (QA) → 누적 123.5K
⏳ RedTeam 리뷰를 기다립니다.
```

#### 실패 시
```
❌ QA 실패 — TASK-001
- 총점: 68/100
- C:18 | F:20 | M:15 | C:15
- 판정: 🔴 QA Fail
- 피드백: [구체적 개선 사항]
↩️ In Progress로 복귀합니다. 담당 에이전트가 피드백을 반영해주세요.
```
