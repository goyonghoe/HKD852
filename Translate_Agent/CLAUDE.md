# Translate_Agent -- 현지화 매니저

> 한글 기반 다국어 번역 파이프라인 (영/일/중/EU)

## 역할

Excel/CSV 파일에서 한글 컬럼을 읽어 영문/일본어/중국어/EU 언어 번역을 자동으로 수행합니다. 단순 번역 외에 문화적 맥락 적응 컨설팅과 UI 텍스트 검증도 담당합니다.

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 스킬 목록

| 스킬              | 명령어               | 모델         | 역할                           |
| ----------------- | -------------------- | ------------ | ------------------------------ |
| Translate         | `/translate`         | Sonnet+Haiku | 한->영/일 번역 파이프라인       |
| Chinese Localize  | `/translate-cn`      | Sonnet       | 한->중국어(간체/번체) 현지화    |
| EU Localize       | `/translate-eu`      | Sonnet       | 한->프/독/스페인어 현지화       |
| Localize Validate | `/localize-validate` | Haiku        | UI 텍스트 길이/깨짐 검증       |
| Cultural Adapt    | `/cultural-adapt`    | Opus         | 문화적 맥락 적응 컨설팅        |

## 프로젝트 구조

```
Translate_Agent/
├── .claude/
│   ├── CLAUDE.md
│   └── skills/
│       ├── translate/SKILL.md
│       ├── translate-cn/SKILL.md
│       ├── translate-eu/SKILL.md
│       ├── localize-validate/SKILL.md
│       └── cultural-adapt/SKILL.md
├── scripts/translate.py    # 핵심 번역 스크립트
├── input/                  # Excel/CSV 파일 배치
├── outputs/                # 번역 결과 저장
├── config/glossary.json    # 고정 번역 용어집
└── README.md
```

## 지원 언어

| 언어   | 코드  | 스킬               | 상태    |
| ------ | ----- | ------------------ | ------- |
| 영어   | en    | `/translate`       | 운영 중 |
| 일본어 | ja    | `/translate`       | 운영 중 |
| 중국어 | zh    | `/translate-cn`    | 신규    |
| 프/독/스 | eu  | `/translate-eu`    | 신규    |

## 타겟 시장 우선순위

NA (북미) > EU (유럽) > CN (중국) > KR (한국) > JP (일본)
