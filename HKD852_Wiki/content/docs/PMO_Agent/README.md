# PMO Agent (프로젝트 매니저)

스프린트 기반 프로젝트 관리 에이전트입니다.

## 스킬 목록

| 스킬            | 명령어             | 모델   | 역할                               |
| --------------- | ------------------ | ------ | ---------------------------------- |
| 스프린트 계획   | `/sprint-plan`     | Sonnet | 2주 스프린트 백로그 생성 (YAML)    |
| 스프린트 회고   | `/sprint-review`   | Sonnet | 스프린트 회고 + 다음 스프린트 초안 |
| 마일스톤 추적   | `/milestone-track` | Haiku  | 마일스톤 진행률 업데이트           |
| 의존성 맵       | `/dep-map`         | Sonnet | 에이전트 간 태스크 의존성 맵       |
| 리스크 레지스터 | `/risk-register`   | Opus   | 리스크 식별 및 점수화              |
| 로드맵          | `/roadmap`         | Sonnet | 인터랙티브 HTML 로드맵 생성        |
| 스탠드업        | `/standup`         | Haiku  | 전체 에이전트 상태 빠른 체크       |

## 사용 예시

```bash
# 스프린트 계획 수립
/sprint-plan "Sprint 1 - 핵심 게임플레이 프로토타입"

# 일일 스탠드업
/standup

# 마일스톤 진행률 업데이트
/milestone-track MS-001

# 에이전트 간 의존성 맵 생성
/dep-map

# 리스크 식별 및 점수화
/risk-register

# 인터랙티브 로드맵 생성
/roadmap "Q1 2026 게임 개발 로드맵"

# 스프린트 회고
/sprint-review sprint-001
```

## 주간 사이클

```
월요일: /sprint-plan -> 스프린트 백로그 생성
매  일: /standup -> 전체 에이전트 상태 체크
금요일: /sprint-review -> 회고 + 다음 스프린트 초안
```

## 에스컬레이션 규칙

- 리스크 점수 20+ -> CEO 즉시 보고
- 마일스톤 delayed -> CEO 즉시 보고
- 스프린트 완료율 60% 미만 -> CEO 회고 시 보고

## 디렉토리 구조

```
PMO_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── sprint-plan/SKILL.md
│       ├── sprint-review/SKILL.md
│       ├── milestone-track/SKILL.md
│       ├── dep-map/SKILL.md
│       ├── risk-register/SKILL.md
│       ├── roadmap/SKILL.md
│       └── standup/SKILL.md
├── README.md
├── sprints/
├── milestones/
├── risks/
└── outputs/
```
