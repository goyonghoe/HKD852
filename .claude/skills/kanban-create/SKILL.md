---
name: kanban-create
description: "칸반 태스크 생성 (멀티프로젝트)"
user-invocable: true
allowed-tools: Read, Write, Edit
model: opus
---

# /kanban-create — 칸반 태스크 생성

## 목적
새 태스크를 칸반 보드의 Backlog에 추가합니다.

## 인자
```
/kanban-create <제목> [옵션]
```
- `<제목>` (필수): 태스크 제목
- `--project <프로젝트>` (필수): 프로젝트명 (WanChai, ShortsFactory2, Saju_Agent, Income_Factory, Invest_Agent 등)
- `--assignee <에이전트>` (선택): 담당 에이전트 (기본: 미배정)
- `--priority <critical|high|mid|low>` (선택, 기본: mid)
- `--division <game|business|support|direct|content>` (선택, 프로젝트에서 추론)
- `--sprint <sprint-NNN>` (선택)
- `--due <YYYY-MM-DD>` (선택)
- `--tags <tag1,tag2>` (선택)
- `--description <설명>` (선택)

## 프로젝트-부서 매핑
| 프로젝트 | division | 주요 담당 |
|----------|----------|-----------|
| WanChai | game | game-designer, programmer, art-director |
| SSBL | game | game-designer |
| TsimShaTsui | game | programmer |
| ShortsFactory | business | CEO |
| ShortsFactory2 | business | CEO |
| Saju_Agent | business | CEO |
| Income_Factory | business | CEO |
| Invest_Agent | direct | CEO |
| AI_News | content | CEO |
| HKD852_Wiki | content | CEO |

project가 지정되지 않으면 사용자에게 반드시 물어봅니다.

## 실행 절차

### 1. 데이터 로드
`PMO_Agent/kanban.json`을 Read로 읽습니다.

### 2. ID 채번
`next_id` 값으로 `TASK-{next_id:03d}` 형식의 ID를 생성합니다.

### 3. 태스크 객체 생성
```json
{
  "id": "TASK-001",
  "title": "<제목>",
  "description": "<설명 또는 빈 문자열>",
  "status": "backlog",
  "priority": "<우선순위>",
  "assignee": "<에이전트 또는 null>",
  "project": "<프로젝트명>",
  "division": "<프로젝트-부서 매핑 참조>",
  "created_by": "CEO",
  "created_at": "<현재 ISO 8601 KST>",
  "updated_at": "<현재 ISO 8601 KST>",
  "due_date": "<마감일 또는 null>",
  "tags": ["<태그들>"],
  "sprint": "<스프린트 또는 null>",
  "qa_review": null,
  "redteam_review": null,
  "token_usage": null,
  "history": [
    { "from": null, "to": "backlog", "by": "CEO", "at": "<현재 ISO 8601 KST>" }
  ]
}
```

### 4. 저장
- `tasks` 배열 끝에 추가
- `next_id`를 1 증가
- `updated_at`을 현재 시각으로 갱신
- Write 도구로 `PMO_Agent/kanban.json`에 저장 (들여쓰기 2칸)
- 동기화: `cp PMO_Agent/kanban.json PMO_Agent/app/public/kanban.json`

### 5. 확인 출력
```
✅ 태스크 생성 완료
- ID: TASK-001
- 프로젝트: WanChai
- 제목: 무기 코덱스 씬 UX 설계
- 담당: game-designer
- 우선순위: 🔴 high
- 상태: backlog
```

## WanChai 팀 에이전트
game-designer, programmer, art-director, ui-designer, balance-designer, audio-designer
