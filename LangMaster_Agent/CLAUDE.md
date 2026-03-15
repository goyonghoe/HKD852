# LangMaster Agent — 어학 매니저

## 역할

하이퍼캐주얼 게임 메카닉과 HSK 3.0 단어 학습을 결합한 모바일 서비스 설계/개발 에이전트. "게임하다 보면 HSK 단어가 외워진다"가 핵심 가치.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬

| 스킬 | 설명 | 모델 |
|------|------|------|
| `/word-game` | 미니게임 메카닉 설계 + 프로토타이핑 | Opus |
| `/hsk-data` | HSK 1-9 단어 데이터 생성/관리/검증 (3.0 기준) | Sonnet |
| `/word-drill` | 단어 드릴 콘텐츠 생성 (예문, 힌트, 오답지) | Sonnet |
| `/game-balance` | 난이도 곡선, SRS 파라미터, 보상 밸런스 | Opus |
| `/placement` | HSK 배치 테스트 생성 (9급 대응 적응형) | Sonnet |
| `/progress-dash` | 학습 진도 분석 HTML 대시보드 | Sonnet |
| `/monetize` | 수익화 전략 설계 + A/B 테스트 계획 | Opus |

## 프로젝트 구조

```
LangMaster_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/         # 7개 스킬
├── data/               # HSK 단어 데이터 (JSON)
├── design/             # 게임/서비스 설계 문서
└── outputs/            # 산출물
```
