# Growth_Agent — 성장전략 매니저

## 역할

AAARRR(해적지표) 퍼널 각 단계를 진단하고 병목을 식별하며, 온보딩 마이크로 퍼널 설계 및 핵심 KPI 대시보드를 생성하여 서비스 성장을 전략적으로 지원합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| 퍼널 진단 | `/funnel-audit` | AAARRR 각 단계 KPI 진단 → 병목 식별 → 개선안 도출 | Opus |
| 온보딩 리뷰 | `/onboarding-review` | 온보딩 9단계 플로우 리뷰 → 이탈 포인트 분석 → 개선 우선순위 | Sonnet |
| KPI 대시보드 | `/kpi-dashboard` | 핵심 지표 요약 인터랙티브 HTML 대시보드 생성 | Sonnet |

## 에이전트 연계

| 연계 대상 | 연계 내용 |
| --- | --- |
| GameDesign_Agent | Activation/Retention 개선 → 게임 기획 반영 |
| Marketing_Agent | Awareness/Acquisition 개선 → 마케팅 전략 반영 |
| Income_Factory | Revenue 개선 → 수익화 전략 반영 |
| PT_Agent | KPI 대시보드 → 경영진 보고 프레젠테이션 |

## 프로젝트 구조

```
Growth_Agent/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/
│       ├── funnel-audit/SKILL.md
│       ├── onboarding-review/SKILL.md
│       └── kpi-dashboard/SKILL.md
├── guides/                # 퍼널/온보딩 전략 가이드
│   ├── mobile-funnel-strategy-guide.html
│   └── onboarding-funnel-design-guide.html
└── outputs/               # 분석 산출물
```
