---
name: hsk-data
description: "HSK 3.0 (1-9급) 단어 데이터 생성, 관리, 검증"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
---

# HSK Data — 단어 데이터 관리 스킬

## 역할

HSK 3.0 (2026년 7월 시행) 공식 단어 목록을 기반으로 게임용 단어 데이터를 생성/검증/관리한다.
9급 체계 완전 대응, 구 HSK 2.0 하위호환 매핑 포함.

## HSK 3.0 레벨별 데이터 규모

| HSK | 단계 | 신규 어휘 | 누적 어휘 | 파일      |
| --- | ---- | --------- | --------- | --------- |
| 1   | 초급 | 300       | 300       | hsk1.json |
| 2   | 초급 | 300       | 600       | hsk2.json |
| 3   | 초급 | 600       | 1,200     | hsk3.json |
| 4   | 중급 | 800       | 2,000     | hsk4.json |
| 5   | 중급 | 1,200     | 3,200     | hsk5.json |
| 6   | 중급 | 2,256     | 5,456     | hsk6.json |
| 7   | 고급 | 2,044     | 7,500     | hsk7.json |
| 8   | 고급 | 1,800     | 9,300     | hsk8.json |
| 9   | 고급 | 1,792     | 11,092    | hsk9.json |

## 실행 절차

### 1. 데이터 생성

요청된 HSK 레벨의 단어 데이터를 JSON으로 생성:

```json
{
  "meta": {
    "hsk_level": 7,
    "hsk_version": "3.0",
    "stage": "advanced",
    "total_words": 2044,
    "generated_at": "2026-03-06",
    "version": "1.0"
  },
  "words": [
    {
      "id": "hsk7-001",
      "hanzi": "摘要",
      "pinyin": "zhāiyào",
      "tone": [1, 4],
      "meaning_ko": "요약, 초록",
      "meaning_en": "abstract, summary",
      "pos": "noun",
      "examples": [
        {
          "sentence": "请写一段论文摘要。",
          "pinyin": "Qǐng xiě yí duàn lùnwén zhāiyào.",
          "meaning_ko": "논문 초록을 작성해 주세요.",
          "meaning_en": "Please write a paper abstract.",
          "grammar_point": "请 + V"
        }
      ],
      "frequency_rank": 3200,
      "difficulty": 7,
      "tags": ["academic", "writing"],
      "radical": "扌",
      "stroke_count": 14,
      "similar_chars": ["摘", "要"],
      "confusable_meanings": ["概要", "总结"],
      "hsk2_legacy_level": null,
      "skill_dimension": {
        "recognition": true,
        "production": true,
        "handwriting": true,
        "translation": true
      },
      "game_hints": {
        "word_fall_distractors": ["개요", "결론", "서론"],
        "radical_components": ["扌", "啇"],
        "tone_pattern": "first-fourth",
        "translation_context": "학술 논문에서 본문 앞에 오는 짧은 요약"
      }
    }
  ]
}
```

### 2. 저장 위치

```
LangMaster_Agent/data/hsk/
├── hsk1.json      #   300 words
├── hsk2.json      #   300 words
├── hsk3.json      #   600 words
├── hsk4.json      #   800 words
├── hsk5.json      # 1,200 words
├── hsk6.json      # 2,256 words
├── hsk7.json      # 2,044 words
├── hsk8.json      # 1,800 words
├── hsk9.json      # 1,792 words
├── grammar/
│   ├── elementary.json    # 초급 문법 154개
│   ├── intermediate.json  # 중급 문법 208개
│   └── advanced.json      # 고급 문법 154개
└── legacy/
    └── mapping.json       # 구 HSK 2.0 → 3.0 매핑
```

### 3. 검증 체크리스트

- [ ] HSK 3.0 공식 단어 목록과 대조 (2025년 11월 실러버스 기준)
- [ ] 병음 성조 표기 정확성 (ǖ, ǘ, ǚ, ǜ 등)
- [ ] 한국어 뜻 자연스러움
- [ ] 영어 뜻 정확성
- [ ] 예문이 해당 HSK 레벨 이하 단어로만 구성
- [ ] 오답 보기(distractors)가 헷갈리지만 구별 가능
- [ ] 부수 분해 정확성
- [ ] 중복 단어 없음
- [ ] `hsk2_legacy_level` 매핑 정확성 (구 HSK와 겹치는 단어)
- [ ] `skill_dimension` 설정 (HSK 5+ 필기, HSK 6+ 번역)
- [ ] 고급 단어(7-9)에 `translation_context` 포함

### 4. 배치 생성

대량 생성 시 50단어씩 배치로 나눠 생성 후 병합.
각 배치마다 검증 체크리스트 수행.

### 5. 고급 레벨 (7-9) 특별 요구사항

- 학술/전문 용어 비중 높음 → 분야 태그 필수 (academic, legal, medical, business, etc.)
- 번역 연습용 `translation_context` 필드 필수
- 유의어/반의어 관계 명시 → `confusable_meanings` 확장
- 4자 성어(成语) 별도 표기

## 데이터 품질 기준

| 항목             | 기준                              |
| ---------------- | --------------------------------- |
| 병음 정확도      | 100% (기계 검증)                  |
| 뜻 정확도        | 100% (HSK 3.0 공식 기준)          |
| 예문 레벨 적합성 | 해당 레벨 이하 단어만 사용        |
| 오답 보기 품질   | 같은 품사, 비슷한 빈도, 다른 의미 |
| 게임 힌트 완성도 | 모든 미니게임에 필요한 필드 포함  |
| 구 HSK 매핑      | 2.0↔3.0 레벨 매핑 100% 완료       |
