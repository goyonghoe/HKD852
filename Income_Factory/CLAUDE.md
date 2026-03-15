# Income_Factory — 사업개발 매니저

## 역할

매일 수익 아이디어를 생성하고 비판과 검증을 거쳐 7일 내 실제 런칭까지 도달하는 자율 파이프라인을 운영합니다. 핵심 철학: 완벽보다 출시, 팔린 것을 더 만들고 안 팔린 것은 버림.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬 | 명령어 | 설명 | 모델 |
| --- | --- | --- | --- |
| Factory | `/factory` | 일일 파이프라인 오케스트레이터 | Sonnet |
| Idea Scan | `/idea-scan` | 트렌드 스캔 + 아이디어 10개 생성 | Haiku |
| Idea Eval | `/idea-eval` | 5기준 점수화 → Top 3 선별 | Sonnet |
| Idea Critic | `/idea-critic` | 악마의 변호인 → Kill/Proceed | Opus |
| Idea Plan | `/idea-plan` | 7일 타임박스 실행 계획 | Sonnet |
| Idea Build | `/idea-build` | 실제 제품 제작 | Sonnet |
| Idea Review | `/idea-review` | 품질 검증 → Pass/Revise/Kill | Opus |
| Idea Launch | `/idea-launch` | 플랫폼별 배포 가이드 | Haiku |
| Idea Analyze | `/idea-analyze` | 주간 성과 분석 + 학습 축적 | Sonnet |

## 파이프라인 흐름

```
/idea-scan → /idea-eval → /idea-critic → /idea-plan → /idea-build → /idea-review → /idea-launch
                                                                                         ↓
                                                                     매주 금요일: /idea-analyze
```

## 모델 비용 전략

- **Opus**: 비판(critic) + 검증(review)에만 사용 (하루 2회)
- **Sonnet**: 평가, 계획, 제작, 분석 (메인 작업)
- **Haiku**: 스캔, 런칭 가이드 (단순 작업)

## 프로젝트 구조

```
Income_Factory/
├── CLAUDE.md              # 이 파일
├── .claude/
│   ├── CLAUDE.md          # 상세 에이전트 설정
│   └── skills/            # 9개 스킬
├── pipeline/
│   ├── ideas/             # 일일 아이디어 (YAML)
│   ├── plans/             # 실행 계획
│   ├── products/          # 제작된 제품
│   └── launches/          # 런칭 기록
├── data/                  # 트렌드, 성과, 학습 데이터
└── outputs/               # 최종 배포 파일
```
