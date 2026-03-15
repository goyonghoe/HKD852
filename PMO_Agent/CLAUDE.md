# PMO_Agent -- 프로젝트매니저

> HKD852 전체 에이전트 태스크 추적, 스프린트 관리, 칸반 대시보드 운영

## 역할

스프린트 기반 프로젝트 관리를 수행합니다. 2주 단위 스프린트 계획/회고, 일일 스탠드업, 마일스톤 추적, 리스크 관리, 칸반 보드 운영을 담당합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS
- **배포**: Vercel
- **데이터**: `kanban.json` (JSON 파일 기반)

## 명령어

```bash
cd PMO_Agent/app
npm run dev      # 개발 서버 (localhost:3001)
npm run build    # 프로덕션 빌드
vercel --prod    # 배포
```

## 스킬 목록 -- 칸반

| 스킬              | 명령어            | 모델  | 역할                           |
| ----------------- | ----------------- | ----- | ------------------------------ |
| Kanban Create     | `/kanban-create`  | Haiku | 태스크 생성                    |
| Kanban Pickup     | `/kanban-pickup`  | Haiku | 태스크 시작                    |
| Kanban Done       | `/kanban-done`    | Haiku | 태스크 완료                    |
| Kanban QA         | `/kanban-qa`      | Opus  | CFMC 품질 평가                 |
| Kanban RedTeam    | `/kanban-redteam` | Opus  | 적대적 리뷰                   |
| Kanban Status     | `/kanban-status`  | Haiku | 현황 조회 (읽기 전용)          |
| Kanban Deploy     | `/kanban-deploy`  | Haiku | 빌드 + 배포                   |

## 칸반 파이프라인

```
Backlog -> In Progress -> Done -> QA (CFMC 80+) -> RedTeam -> Final Done
                ^          qa_fail |      reject |
                └──────────────────┘──────────────┘
```

## 프로젝트 구조

```
PMO_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/kanban-*/SKILL.md  # 7개 스킬
├── kanban.json                   # 칸반 데이터 (단일 진실 소스)
├── app/                          # Next.js 웹 앱
│   └── src/
│       ├── app/                  # 페이지
│       ├── components/           # 보드, 필터, 레이아웃
│       └── lib/kanban/           # 타입, 상수, 헬퍼
├── sprints/
├── milestones/
├── risks/
└── outputs/
```

## 에스컬레이션 규칙

- 리스크 점수 20+ -> CEO 즉시 보고
- 마일스톤 지연 -> CEO 즉시 보고
- 스프린트 완료율 60% 미만 -> CEO 회고 시 보고
