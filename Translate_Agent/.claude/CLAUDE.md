# Translate Agent — Excel 기반 한영일 번역 파이프라인

> 한글 컬럼을 읽어 영문·일본어 번역을 자동으로 채우는 번역 에이전트

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 역할

- Excel/CSV 파일에서 한글 컬럼을 읽어 영문/일본어 번역 자동 채우기
- `claude -p` CLI를 통한 고품질 번역 (추가 API 키 불필요)
- 용어집(glossary) 기반 고정 번역 지원

---

## 스킬 목록

| 스킬 | 명령어 | 모델 | 역할 |
|------|--------|------|------|
| Translate | `/translate` | Sonnet (조율) + Haiku (번역) | 전체 번역 파이프라인 |

---

## 사용 방법

1. `input/` 폴더에 Excel(.xlsx) 또는 CSV 파일 배치
2. `/translate [파일명]` 실행
3. `outputs/` 폴더에서 번역된 결과 확인

### Excel 파일 요구사항

- 첫 번째 행: 헤더 (컬럼명)
- 한글 컬럼: `한글`, `korean`, `ko`, `원문` 중 하나
- 영문 컬럼: `영문`, `english`, `en`, `영어` 중 하나
- 일본어 컬럼: `일본어`, `japanese`, `ja`, `jp` 중 하나
- 영문/일본어 셀이 비어있는 행만 번역 대상

---

## 번역 엔진

- **방식**: `claude -p --model haiku` CLI subprocess
- **인증**: 현재 Claude Code OAuth 토큰 자동 사용
- **배치**: 30개 행씩 묶어서 번역 (비용 최적화)
- **비용**: ~$0.009/배치 (Haiku 모델 기준)
- **품질**: 게임 로컬라이제이션 포함 전문 번역 품질

---

## 디렉토리 구조

```
Translate_Agent/
├── .claude/
│   ├── CLAUDE.md              ← 이 문서
│   └── skills/translate/SKILL.md
├── scripts/
│   └── translate.py           ← 핵심 번역 스크립트
├── input/                     ← Excel/CSV 파일 배치
├── outputs/                   ← 번역 결과 저장
├── config/
│   └── glossary.json          ← 고정 번역 용어집
└── README.md
```

---

## 제약 조건

- `openpyxl` 필요 (Excel 처리)
- `claude` CLI 필요 (번역 엔진)
- 원본 파일은 수정하지 않음 — 항상 `outputs/`에 결과 저장

---

## 버전 정보
- 생성일: 2026-02-10
- 최종 업데이트: 2026-02-10
