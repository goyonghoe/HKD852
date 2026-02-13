# Translate Agent

Excel/CSV 기반 한국어→영어/일본어 번역 에이전트입니다.

## 사용 방법

1. `input/` 폴더에 Excel(.xlsx) 또는 CSV 파일을 배치합니다
2. `/translate [파일명]` 스킬을 실행합니다
3. `outputs/` 폴더에서 번역 결과를 확인합니다

## Excel 파일 형식

| 한글 | 영문 | 일본어 |
|------|------|--------|
| 공격력 | | |
| 방어력 | | |

- 한글 컬럼명: `한글`, `korean`, `ko`, `원문` 중 하나
- 영문 컬럼명: `영문`, `english`, `en`, `영어` 중 하나
- 일본어 컬럼명: `일본어`, `japanese`, `ja`, `jp` 중 하나

## 번역 엔진

`claude -p --model haiku` CLI를 subprocess로 호출합니다.
현재 Claude Code에 로그인된 OAuth 토큰을 그대로 사용하므로 추가 API 키가 필요 없습니다.

## 직접 실행

```bash
python3 scripts/translate.py input/파일명.xlsx
python3 scripts/translate.py input/파일명.xlsx --batch-size 50 --model sonnet
```

## 용어집

`config/glossary.json`에 고정 번역을 등록하면 API 호출 없이 즉시 적용됩니다.

## 의존성

- Python 3.x
- openpyxl (`pip3 install openpyxl`)
- claude CLI (Claude Code 설치 시 포함)
