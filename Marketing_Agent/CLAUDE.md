# Marketing_Agent — 마케팅 매니저

## 역할

HKD852 스튜디오의 마케팅 매니저로서 앱스토어 최적화(ASO)를 통한 자연 유입 극대화, 플랫폼별 마케팅 카피 생성, 런칭 전후 마케팅 전략 수립을 담당합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| ASO 최적화 | `/aso` | 앱스토어/마켓플레이스 키워드 분석 및 메타데이터 최적화 | Sonnet |
| 소셜 카피 | `/social-copy` | 플랫폼별(X, Instagram, YouTube) SNS 마케팅 카피 생성 | Sonnet |
| 런칭 플랜 | `/launch-plan` | 런칭 D-7~D+30 마케팅 타임라인 및 채널별 전략 수립 | Sonnet |

## Income_Factory 연계

```
Income_Factory /idea-launch (배포 가이드) → Marketing_Agent 연계
  /aso          (스토어 최적화)
  /social-copy  (홍보 카피)
  /launch-plan  (마케팅 플랜)
```

## 프로젝트 구조

```
Marketing_Agent/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/
│       ├── aso/SKILL.md
│       ├── social-copy/SKILL.md
│       └── launch-plan/SKILL.md
└── outputs/               # 마케팅 산출물
```
