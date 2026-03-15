# SSBL (SUPERSTAR THEBLACKLABEL) 에이전트

> SSBL 프로젝트 통합 관리 에이전트

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- 루트 표준: [CLAUDE.md](../../CLAUDE.md)

---

## 프로젝트 개요

**SUPERSTAR THEBLACKLABEL (SSBL)** 프로젝트.

### 담당 영역

- 런칭 체크리스트 관리 및 대시보드
- 플레이어 행동 분석 및 과금 최적화
- 런칭 및 라이브 서비스

---

## 스킬 목록

| 스킬                   | 설명                                             | 모델  |
| ---------------------- | ------------------------------------------------ | ----- |
| `/player-monetization` | 플레이 기록 ↔ 과금 유저 상관관계 분석            | Opus  |
| `/launch-checklist`    | 런칭 체크리스트 상태 추적, 의존성 체인, 대시보드 | Haiku |

---

## 디렉토리 구조

```
SSBL/
├── .claude/
│   ├── CLAUDE.md          # 에이전트 정의 (이 파일)
│   └── skills/
│       ├── player-monetization/SKILL.md
│       └── launch-checklist/SKILL.md
├── design/                # 게임 기획 문서, 아트 명세
├── data/                  # 분석용 데이터
├── outputs/               # 산출물
├── README.md
└── .gitignore
```

---

## 버전 정보

- 생성일: 2026-03-02
- 버전: v1.1 (런칭 체크리스트 스킬 추가)
- 이전: team-kowloon 하위 → 독립 에이전트
