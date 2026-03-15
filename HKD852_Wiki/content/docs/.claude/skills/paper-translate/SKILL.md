---
name: paper-translate
description: "논문 쇼츠 스크립트 KO→EN/JA 번역 + 메타데이터 현지화"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: haiku
model-reason: "번역 실행은 translate_script.py CLI 호출이므로 Haiku로 충분"
argument-hint: "--episode 'paper_ep019' --lang en|ja|all"
---

# /paper-translate — KO→EN/JA 번역

## 역할

한국어 논문 쇼츠 스크립트를 영어/일본어로 번역합니다.
`libs/translate_script.py`를 호출하여 번역을 수행합니다.

## 전제조건

| 항목        | 경로                                | 필수 |
| ----------- | ----------------------------------- | ---- |
| KO 스크립트 | `pipeline/scripts/paper_epNNN.json` | 필수 |
| 언어 설정   | `templates/lang_config.json`        | 필수 |

**참고**: 번역 자체에는 음성 파일이 필요하지 않습니다. 음성 파일은 렌더링(`/paper-render`) 시에만 필요합니다.

## 실행

### 영어 번역

```bash
cd /Users/yong/MainFolder/My_AI_Project/HKD852/ShortsFactory2_Agent
python libs/translate_script.py pipeline/scripts/paper_ep019.json --lang en
```

### 일본어 번역

```bash
python libs/translate_script.py pipeline/scripts/paper_ep019.json --lang ja
```

### EN + JA 동시

```bash
python libs/translate_script.py pipeline/scripts/paper_ep019.json --lang all
```

## 번역 엔진

`translate_script.py`는 Claude CLI(`claude -p --model sonnet`)를 사용합니다.

### 번역 품질 보장

- 스키마 검증: 필수 키, body/scene_texts 배열 길이 일치 확인
- 반환각 방지: "Translate FAITHFULLY. Do NOT add claims not in the original"
- 재시도: 파싱/검증 실패 시 최대 2회 재시도 (지수 백오프)
- Atomic write: tmp → rename 패턴으로 크래시 안전

### 번역 규칙

- 수치는 숫자로 보존 (구천 → 9,000 / 51퍼센트 → 51%)
- 고유명사 (저널명, 기관명) 번역하지 않음
- 타이틀에 시리즈 해시태그 포함 (#TodaysPaper / #今日の論文)
- description의 논문 인용 부분은 영어 유지

## 출력 검증

번역 완료 후 자동 검증:

1. 번역 파일 존재: `paper_epNNN_en.json`, `paper_epNNN_ja.json`
2. `scenes` 수 = 원본과 동일
3. 모든 scene의 `image_prompt: null` (이미지 공유)
4. 모든 scene의 `image_ref` = 원본 이미지 경로
5. `language` 필드 = `"en"` 또는 `"ja"`
6. `source_language` 필드 = `"ko"`

## 출력

```
pipeline/scripts/
├── paper_ep019.json       (KO 원본 — 변경 없음)
├── paper_ep019_en.json    (EN 번역본)
└── paper_ep019_ja.json    (JA 번역본)
```

## 결과 리포트

```markdown
## 번역 결과: paper_ep019

| 언어 | 상태 | 소요시간 | 파일                                 |
| ---- | ---- | -------- | ------------------------------------ |
| EN   | OK   | 12.3s    | pipeline/scripts/paper_ep019_en.json |
| JA   | OK   | 14.1s    | pipeline/scripts/paper_ep019_ja.json |

씬 수 검증: KO 5 = EN 5 = JA 5 ✓
```

## 참조

- `libs/translate_script.py` — 번역 엔진 (Claude CLI 기반)
- `templates/lang_config.json` — 언어별 톤/음성/채널 설정
