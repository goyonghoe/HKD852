# SSBL -- SUPERSTAR THEBLACKLABEL 프로젝트

> THEBLACKLABEL 소속 아티스트 슈퍼스타 리듬게임 런칭 관리 에이전트

## 역할

SSBL 프로젝트의 런칭 체크리스트 관리, 플레이어 행동 분석, 과금 최적화를 담당합니다. 68개 태스크 상태를 추적하고 Go/No-Go 판정을 자동 제공합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬                   | 명령어                 | 모델  | 역할                                    |
| ---------------------- | ---------------------- | ----- | --------------------------------------- |
| Player Monetization    | `/player-monetization` | Opus  | 플레이 기록 <-> 과금 유저 상관관계 분석  |
| Launch Checklist       | `/launch-checklist`    | Haiku | 런칭 체크리스트 상태 추적 + 대시보드    |

## 프로젝트 구조

```
SSBL/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── player-monetization/SKILL.md
│       └── launch-checklist/SKILL.md
├── design/           # 게임 기획 문서, 아트 명세
├── data/             # 분석용 데이터, 런칭 체크리스트 JSON
├── input/            # 입력 데이터
├── outputs/          # 산출물 (대시보드 HTML 등)
├── api/              # Vercel Serverless API
├── public/           # 정적 웹 파일
└── README.md
```

## 관리 대상 아티스트

- TAEYANG
- JEON SOMI
- MEOVV
- ALLDAY PROJECT
