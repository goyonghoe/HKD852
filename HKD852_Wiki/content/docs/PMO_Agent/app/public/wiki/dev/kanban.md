# 칸반 워크플로

> 파이프라인, 상태 전이, CFMC 매트릭스, 스킬 명령어

관련 파일: `WanChai/kanban.json`, `WanChai/.claude/CLAUDE.md`

---

## 칸반 파이프라인

```
Backlog → In Progress → Done (검토 대기)
                              ↓
                          QA (CFMC 80+)
                         ↙           ↘
                    qa_pass        qa_fail
                       ↓              ↓
                   RedTeam       In Progress (재작업)
                  ↙      ↘
            final_done  redteam_reject
                              ↓
                         In Progress (재작업)
```

---

## 상태 전이 규칙

| From             | To               | 담당                    |
| ---------------- | ---------------- | ----------------------- |
| `backlog`        | `in_progress`    | 배정된 에이전트         |
| `in_progress`    | `done`           | 배정된 에이전트         |
| `done`           | `qa_passed`      | Quality_Gate (CFMC 80+) |
| `done`           | `qa_fail`        | Quality_Gate (CFMC <80) |
| `qa_passed`      | `final_done`     | RedTeam (APPROVE)       |
| `qa_passed`      | `redteam_reject` | RedTeam (REJECT)        |
| `qa_fail`        | `in_progress`    | 배정된 에이전트         |
| `redteam_reject` | `in_progress`    | 배정된 에이전트         |

---

## CFMC 매트릭스

QA 평가 시 사용하는 4가지 기준 (각 25점, 합계 100점):

| 기준                    | 설명            | 주요 체크 항목                      |
| ----------------------- | --------------- | ----------------------------------- |
| **C — Completeness**    | 요구사항 완전성 | 기능 요구사항 충족, 누락 없음       |
| **F — Functionality**   | 기능 동작       | 빌드/테스트 PASS, 배선 정상         |
| **M — Maintainability** | 유지보수성      | 아키텍처 원칙 준수, 매직 넘버 없음  |
| **C — Consistency**     | 일관성          | 코드 스타일, 타입 사용, 문서 동기화 |

**합계 80점 이상**: `qa_passed` → RedTeam 진행
**합계 80점 미만**: `qa_fail` → 재작업

---

## 스킬 명령어

| 스킬              | 설명                                          | 모델   |
| ----------------- | --------------------------------------------- | ------ |
| `/kanban-create`  | 새 태스크 생성 (title, description, priority) | Sonnet |
| `/kanban-pickup`  | 태스크 시작 (backlog → in_progress)           | Haiku  |
| `/kanban-done`    | 태스크 완료 (in_progress → done)              | Haiku  |
| `/kanban-qa`      | CFMC 품질 평가 (done → qa_passed/fail)        | Opus   |
| `/kanban-redteam` | 적대적 리뷰 (qa_passed → final_done/reject)   | Opus   |
| `/kanban-status`  | 전체 현황 조회 (읽기 전용)                    | Haiku  |
| `/kanban-deploy`  | 대시보드 빌드+배포                            | Haiku  |

### 사용 예시

```bash
# 새 태스크 생성
/kanban-create 타이틀: "레일건 추가" 설명: "..." 우선순위: high

# 태스크 시작
/kanban-pickup WANCHAI-042

# 태스크 완료 (토큰 기록 포함)
/kanban-done WANCHAI-042 --tokens 1200,800,sonnet

# QA 평가
/kanban-qa WANCHAI-042

# 현황 조회
/kanban-status
```

---

## kanban.json 구조

```
WanChai/kanban.json          ← 단일 진실 소스 (SOT)
PMO_Agent/kanban.json        ← PMO 통합 보드 (WanChai 데이터 포함)
PMO_Agent/app/public/kanban.json ← 웹 앱 배포용 (동기화 필요)
```

> 주의 (M-014): `PMO_Agent/kanban.json` 수정 후 반드시  
> `cp PMO_Agent/kanban.json PMO_Agent/app/public/kanban.json` 실행 후 빌드+배포

### priority 값 규칙 (M-015)

허용값: `"critical"` | `"high"` | `"mid"` | `"low"`  
(❌ `"medium"` 사용 불가)

---

## 토큰 추적

태스크별 AI 토큰 사용량 기록 (`token_usage` 필드):

```bash
/kanban-done TASK-ID --tokens <input>,<output>,<model>
# 예: --tokens 1200,800,sonnet
```

월간 예산 설정: `token_budget` 필드 (수동 설정)

---

## 대시보드

- URL: https://pmo-kanban.vercel.app
- 실시간 업데이트 (배포 후)
- 필터: 프로젝트별, 상태별, 담당자별
- 타임라인 뷰 지원
