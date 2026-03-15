---
name: word-drill
description: "단어 드릴 콘텐츠 생성 — 예문, 힌트, 오답지, 맥락 문장"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Word Drill — 드릴 콘텐츠 생성 스킬

## 역할

미니게임에 투입할 단어 드릴 콘텐츠를 생성한다.
각 단어에 대해 다양한 게임 모드에 맞는 문제/힌트/오답지를 생성.

## 실행 절차

### 1. 입력

- HSK 레벨 (1-9, HSK 3.0 기준)
- 대상 단어 범위 (전체 / 특정 스테이지 / 특정 단어 ID)
- 게임 모드 (Word Fall / Pinyin Shooter / Match Rush / Fill Blast / Tone Surf / Radical Builder / Translate Sprint / Context Weaver)

### 2. 게임별 콘텐츠 생성

#### Word Fall용

```json
{
  "word_id": "hsk1-001",
  "question": "你",
  "correct": "너, 당신",
  "distractors": ["나", "그", "우리"],
  "time_limit": 3.0
}
```

#### Pinyin Shooter용

```json
{
  "word_id": "hsk1-001",
  "question": "你",
  "correct": "nǐ",
  "distractors": ["ní", "nì", "nī"],
  "hint": "3성 (v자 곡선)"
}
```

#### Fill Blast용

```json
{
  "word_id": "hsk1-015",
  "sentence": "我___中国人。",
  "correct": "是",
  "distractors": ["有", "在", "去"],
  "sentence_ko": "나는 중국 사람___.",
  "blank_hint": "~이다"
}
```

#### Tone Surf용

```json
{
  "word_id": "hsk1-001",
  "hanzi": "你",
  "correct_tone": 3,
  "tone_pattern": "down-up",
  "audio_ref": "ni3.mp3"
}
```

#### Radical Builder용

```json
{
  "word_id": "hsk2-045",
  "target": "认",
  "components": ["讠", "人"],
  "distractors": ["亻", "口", "木"],
  "hint": "말씀 + 사람 = 알다"
}
```

#### Translate Sprint용 (HSK 6-9)

```json
{
  "word_id": "hsk7-001",
  "source_ko": "요약",
  "source_en": "summary",
  "correct": "摘要",
  "distractors": ["概要", "总结", "大纲"],
  "context": "논문의 본문 앞에 오는 짧은 ___",
  "difficulty": 7
}
```

#### Context Weaver용 (HSK 5-9)

```json
{
  "word_id": "hsk6-120",
  "sentence": "这项研究的___表明，教育投资与经济增长之间存在正相关。",
  "correct": "结果",
  "distractors": ["原因", "过程", "目标"],
  "full_meaning": "이 연구의 결과는 교육 투자와 경제 성장 사이에 양의 상관관계가 있음을 보여준다.",
  "grammar_point": "的 + N + 表明",
  "difficulty": 6
}
```

### 3. 오답지 생성 규칙

| 규칙             | 설명                                   |
| ---------------- | -------------------------------------- |
| 같은 품사        | 명사 답이면 오답도 명사                |
| 같은 HSK 레벨    | 학습자가 알 법한 범위 내               |
| 의미적 유사      | 완전 다른 뜻이 아닌, 헷갈릴 수 있는 것 |
| 발음 유사 (병음) | 성조만 다른 것 포함                    |
| 형태 유사 (한자) | 비슷하게 생긴 글자 포함                |

### 4. 출력

`LangMaster_Agent/data/drills/{hsk_level}/stage_{n}.json`
