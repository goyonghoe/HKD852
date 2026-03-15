---
name: kanban-redteam
description: 'WanChai 칸반 RedTeam 리뷰 — 적대적 관점 최종 검증'
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /kanban-redteam — 적대적 리뷰

## 목적

RedTeam이 QA를 통과한 태스크를 적대적 관점에서 최종 검증하고,
APPROVE면 final_done, REJECT면 redteam_reject로 전환합니다.

## 인자

```
/kanban-redteam <TASK-ID>
```

- `<TASK-ID>` (필수): RedTeam 리뷰할 태스크 ID

## 실행 절차

### 1. 데이터 로드

`WanChai/kanban.json`을 Read로 읽습니다.

### 2. 검증

- 해당 ID의 태스크가 존재하는지 확인
- 현재 status가 `qa_passed`인지 확인

### 3. 적대적 리뷰 실행

4개 관점으로 적대적 분석을 수행합니다:

| 관점            | 검토 내용                                  |
| --------------- | ------------------------------------------ |
| **익스플로잇**  | 게임 경제 치트, 입력 조작, 무한루프 가능성 |
| **논리 결함**   | 게임 로직 불일치, 엣지 케이스 미처리       |
| **문화 민감도** | 5개 시장(NA/EU/CN/KR/JP) 문화적 이슈       |
| **밸런스**      | 깨진 빌드 경로, 지배 전략, 난이도 허점     |

태스크 관련 산출물을 WanChai/ 내에서 Glob/Grep/Read로 찾아 실제 내용을 검토합니다.

### 4. 판정

- **APPROVE**: 심각한 이슈 없음 → `final_done`
- **REJECT**: 심각한 이슈 발견 → `redteam_reject` + 구체적 이유

### 5. 결과 기록 + 토큰

```json
{
  "status": "final_done 또는 redteam_reject",
  "updated_at": "<현재 ISO 8601 KST>",
  "redteam_review": {
    "verdict": "APPROVE 또는 REJECT",
    "findings": [
      { "severity": "low|mid|high|critical", "category": "<관점>", "detail": "<내용>" }
    ],
    "summary": "<한 줄 요약>",
    "reviewed_at": "<현재 ISO 8601 KST>",
    "reviewed_by": "RedTeam"
  },
  "token_usage": {
    "total_tokens": "<기존 total + RT input + output>",
    "entries": [...기존, { "phase": "레드팀", "input": "<RT 입력 토큰>", "output": "<RT 출력 토큰>", "model": "opus", "by": "RedTeam", "at": "<현재>" }]
  },
  "history": [...기존, { "from": "qa_passed", "to": "final_done", "by": "RedTeam", "at": "<현재>" }]
}
```

- 레드팀 리뷰에 사용된 토큰을 추정하여 기록
- `token_usage`가 null이면 새로 생성

### 6. 출력

#### APPROVE 시

```
✅ RedTeam 승인 — TASK-001
- 판정: 🟢 APPROVE
- 요약: 심각한 보안/문화적 이슈 없음
- 토큰: +32.7K (레드팀) → 누적 156.2K
→ ✅ Final Done — 태스크 완전 종료
```

#### REJECT 시

```
❌ RedTeam 거부 — TASK-001
- 판정: 🔴 REJECT
- 심각한 발견:
  1. [high] 익스플로잇: 골드 복제 가능 경로 발견
  2. [mid] 밸런스: 특정 무기 조합 지배 전략
- 요약: 경제 취약점 + 밸런스 이슈
↩️ 담당 에이전트가 발견사항을 수정해주세요.
```
