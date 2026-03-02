# PMO_Agent — 프로젝트 매니저

## 역할
HKD852 전체 에이전트 태스크 추적, 스프린트 관리, 칸반 보드 운영

## 공통 표준
이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- 가이드: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)

## 기술 스택
- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS (금융 다크 테마, Invest_Agent 동일)
- **배포**: Vercel
- **데이터**: `kanban.json` (JSON 파일 기반, DB 불필요)

## 프로젝트 구조
```
PMO_Agent/
├── .claude/
│   ├── CLAUDE.md              # 이 파일
│   └── skills/                # 칸반 스킬 (7개)
│       ├── kanban-create/     # 태스크 생성
│       ├── kanban-pickup/     # 태스크 시작
│       ├── kanban-done/       # 태스크 완료
│       ├── kanban-qa/         # CFMC 품질 평가
│       ├── kanban-redteam/    # 적대적 리뷰
│       ├── kanban-status/     # 현황 조회
│       └── kanban-deploy/     # 빌드+배포
├── kanban.json                # 칸반 보드 데이터 (단일 진실 소스)
├── app/                       # Next.js 웹 앱
│   └── src/
│       ├── app/
│       │   ├── page.tsx       # 메인 칸반 보드
│       │   └── layout.tsx     # 루트 레이아웃
│       ├── components/
│       │   ├── board/         # 보드 컴포넌트
│       │   ├── layout/        # 헤더
│       │   └── filters/       # 필터 바
│       └── lib/kanban/        # 타입, 상수, 헬퍼
├── milestones/
├── outputs/
├── risks/
└── sprints/
```

## 칸반 파이프라인
```
Backlog → In Progress → Done (검토 대기) → QA → RedTeam → Final Done
                ↑           qa_fail ↓         reject ↓
                └───────────────────┘──────────────────┘
```

## 상태 전이 규칙
| From | To | By |
|------|----|----|
| backlog | in_progress | 배정된 에이전트 |
| in_progress | done | 배정된 에이전트 |
| done | qa_passed | Quality_Gate (CFMC 80+) |
| done | qa_fail | Quality_Gate (CFMC <80) |
| qa_passed | final_done | RedTeam (APPROVE) |
| qa_passed | redteam_reject | RedTeam (REJECT) |
| qa_fail | in_progress | 배정된 에이전트 |
| redteam_reject | in_progress | 배정된 에이전트 |

## 스킬 목록
| 스킬 | 설명 | 모델 |
|------|------|------|
| `/kanban-create` | 태스크 생성 (CEO/RedTeam/QualityGate) | Haiku |
| `/kanban-pickup` | 태스크 시작 (배정 에이전트) | Haiku |
| `/kanban-done` | 태스크 완료 표시 (배정 에이전트) | Haiku |
| `/kanban-qa` | CFMC 품질 평가 (Quality_Gate) | Opus |
| `/kanban-redteam` | 적대적 리뷰 (RedTeam_Agent) | Opus |
| `/kanban-status` | 현황 조회 (모든 에이전트, 읽기 전용) | Haiku |
| `/kanban-deploy` | 빌드+배포 (CEO) | Haiku |

## 개발 명령어
```bash
cd PMO_Agent/app
npm run dev     # 개발 서버 (localhost:3001)
npm run build   # 프로덕션 빌드
vercel --prod   # Vercel 배포
```
