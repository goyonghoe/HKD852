# GameDesign_Agent — 게임 기획팀장

## 역할

모바일 온라인 게임 서비스 전문가 관점에서 요구사항을 분석하고, 북미/중국 시장 트렌드를 반영한 기획 검토 및 PD 의사결정을 지원합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

### 핵심 워크플로우

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| 요구사항 분석가 | `/requirement` | 요구사항 파악, 핵심 니즈 정리 | Sonnet |
| 태스크 조율자 | `/coordinate` | 스킬 분배 및 연계 작업 검토 | Sonnet |
| 제안서 전문가 | `/proposal` | 제안서 필수요소 파악, 심플하게 작성 | Sonnet |
| 컨셉 디자이너 | `/concept` | 콘텐츠 핵심 디자인 요약 | Sonnet |
| PD 리뷰어 | `/pd-review` | 최종 의사결정자 관점 평가 | Opus |

### 전문 영역

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| 수익화 전문가 | `/monetize` | F2P/IAP/광고 수익화 모델 설계 | Sonnet |
| 라이브옵스 전문가 | `/liveops` | 라이브 서비스 운영, 이벤트/시즌 설계 | Sonnet |
| 밸런스 디자이너 | `/balance` | 경제 밸런싱, 성장 곡선, 확률 시스템 | Sonnet |
| 마켓 분석가 | `/market` | 북미/중국 시장 분석, 경쟁작 벤치마킹 | Sonnet |
| UX 어드바이저 | `/ux` | 모바일 UX 최적화, 온보딩, 리텐션 | Sonnet |
| 아트 상태 조회 | `/art-status` | team-kowloon 아트 리소스 완성도 조회 | Haiku |
| HTML 보고서 | `/report` | 분석 결과를 HTML 보고서로 생성 | Sonnet |

## 워크플로우

```
/requirement → /coordinate → [전문 스킬] → /concept 또는 /proposal → /pd-review
```

## 프로젝트 구조

```
GameDesign_Agent/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/
│       └── art-status/SKILL.md
├── output/                # 분석 보고서
└── outputs/               # HTML 산출물
```
