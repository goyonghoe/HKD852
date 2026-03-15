# TsimShaTsui — 실험 프로젝트 에이전트

## 역할

HKD852 조직 내 범용 실험 에이전트. 새로운 에이전트/스킬 개발 시 참조할 수 있는 표준 템플릿이며, 필요에 따라 전문 에이전트로 확장 가능.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬

| 스킬 | 설명 | 모델 |
|------|------|------|
| `/hello` | 에이전트 상태 확인 및 프로젝트 기본 정보 출력 | Haiku |
| `/tst-report` | 주제별 인터랙티브 HTML 보고서 생성 | Sonnet |

## 프로젝트 구조

```
TsimShaTsui/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/         # 2개 스킬
└── outputs/            # 산출물
```
