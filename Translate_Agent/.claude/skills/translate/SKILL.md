---
name: translate
description: "Excel/CSV 파일의 한글 컬럼을 읽어 영문/일본어 번역을 채웁니다"
user-invocable: true
argument-hint: "[파일명.xlsx]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: sonnet
model-reason: "파이프라인 조율은 Sonnet이 적합, 실제 번역은 Haiku CLI"
---

# /translate — Excel 한영일 번역기

`input/` 폴더의 Excel/CSV 파일에서 한글 컬럼을 읽어 영문·일본어 번역을 자동으로 채웁니다.

## 실행 절차

### 1. 파일 확인

`$ARGUMENTS`로 파일명이 지정된 경우 해당 파일을 사용합니다.
지정되지 않은 경우 `Translate_Agent/input/` 폴더에서 `.xlsx` 또는 `.csv` 파일을 찾습니다.

```bash
ls Translate_Agent/input/*.xlsx Translate_Agent/input/*.csv 2>/dev/null
```

파일이 없으면 사용자에게 안내합니다:
> `Translate_Agent/input/` 폴더에 번역할 Excel 또는 CSV 파일을 배치해 주세요.

### 2. 파일 검증

Excel/CSV 파일을 열어 다음을 확인합니다:
- 한글 컬럼 존재 여부 (`한글`, `korean`, `ko`, `원문`)
- 영문 컬럼 존재 여부 (`영문`, `english`, `en`, `영어`)
- 일본어 컬럼 존재 여부 (`일본어`, `japanese`, `ja`, `jp`)
- 번역이 필요한 행 수 (영문/일본어가 비어있는 행)

### 3. 번역 실행

```bash
python3 Translate_Agent/scripts/translate.py "Translate_Agent/input/<파일명>"
```

스크립트가 `claude -p --model haiku`를 사용하여 30개씩 배치 번역합니다.

### 4. 결과 확인

번역 완료 후 결과를 보고합니다:

```markdown
## 번역 완료

- **입력 파일**: input/<파일명>
- **출력 파일**: outputs/translated_<파일명>
- **번역된 행 수**: N행
- **소요 시간**: N초
- **용어집 적용**: N건

### 샘플 확인 (처음 5행)
| 한글 | 영문 | 일본어 |
|------|------|--------|
| ... | ... | ... |
```

## 입력

- `$ARGUMENTS`: 번역할 파일명 (선택)
  - 예: `/translate game_terms.xlsx`
  - 미지정 시 `input/` 폴더의 첫 번째 파일 사용

## 출력

- `Translate_Agent/outputs/translated_<원본파일명>` — 번역 완료된 Excel/CSV

## 옵션

스크립트에 추가 옵션을 전달할 수 있습니다:

```bash
python3 Translate_Agent/scripts/translate.py "input/<파일>" --batch-size 50 --model sonnet
```

- `--batch-size N`: 배치 크기 변경 (기본: 30)
- `--model MODEL`: 번역 모델 변경 (기본: haiku)
- `--output PATH`: 출력 경로 직접 지정
