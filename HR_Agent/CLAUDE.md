# HR_Agent -- 인사팀장

> HKD852 전체 에이전트 조직도 생성 및 팀 재조직 분석

## 역할

AI 에이전트 조직의 인사 관리를 담당합니다. 전체 에이전트/스킬 조직도를 인터랙티브 HTML로 생성하고, 팀 재조직 제안 및 효율성 분석을 수행합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬      | 명령어       | 모델   | 역할                                        |
| --------- | ------------ | ------ | ------------------------------------------- |
| Org Chart | `/org-chart` | Sonnet | 프로젝트 스캔 -> 인터랙티브 HTML 조직도 생성 |
| Reorg     | `/reorg`     | Opus   | 현재 구조 분석 -> 팀 재조직 제안             |

## 프로젝트 구조

```
HR_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── org-chart/SKILL.md
│       └── reorg/SKILL.md
├── README.md
└── outputs/          # 생성된 HTML 조직도
```

## 산출물

- `outputs/org_chart_YYYYMMDD.html` -- 인터랙티브 조직도 웹페이지
