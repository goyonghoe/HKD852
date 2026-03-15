---
name: game-balance
description: "HSK 3.0 (9급) 대응 난이도 곡선, SRS 파라미터, 보상 밸런스 설계"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Game Balance — 게임 밸런스 설계 스킬

## 역할

HSK 3.0 (9급 체계) 전체에 걸쳐 학습 효과와 게임 재미를 동시에 최적화하는 밸런스 파라미터를 설계한다.

## 밸런스 영역

### 1. 난이도 곡선

```yaml
difficulty_curve:
  # 초급 (初等)
  hsk1:
    words_per_stage: 10
    new_words_per_session: 5
    review_words_per_session: 3
    fall_speed: 1.0
    time_limit: 45s
    choices: 2
    lives: 5
    games_available: [word_fall, pinyin_shooter, match_rush, tone_surf]
  hsk2:
    words_per_stage: 10
    new_words_per_session: 5
    review_words_per_session: 5
    fall_speed: 1.2
    time_limit: 40s
    choices: 3
    lives: 4
    games_available:
      [word_fall, pinyin_shooter, match_rush, fill_blast, tone_surf]
  hsk3:
    words_per_stage: 10
    new_words_per_session: 5
    review_words_per_session: 7
    fall_speed: 1.4
    time_limit: 35s
    choices: 4
    lives: 4
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        tone_surf,
        radical_builder,
      ]

  # 중급 (中等)
  hsk4:
    words_per_stage: 10
    new_words_per_session: 4
    review_words_per_session: 8
    fall_speed: 1.6
    time_limit: 35s
    choices: 4
    lives: 3
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        tone_surf,
        radical_builder,
      ]
  hsk5:
    words_per_stage: 10
    new_words_per_session: 4
    review_words_per_session: 10
    fall_speed: 1.8
    time_limit: 30s
    choices: 4
    lives: 3
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        tone_surf,
        radical_builder,
        context_weaver,
      ]
  hsk6:
    words_per_stage: 10
    new_words_per_session: 3
    review_words_per_session: 12
    fall_speed: 2.0
    time_limit: 30s
    choices: 4
    lives: 3
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        tone_surf,
        radical_builder,
        translate_sprint,
        context_weaver,
      ]

  # 고급 (高等)
  hsk7:
    words_per_stage: 10
    new_words_per_session: 3
    review_words_per_session: 14
    fall_speed: 2.2
    time_limit: 25s
    choices: 4
    lives: 2
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        radical_builder,
        translate_sprint,
        context_weaver,
      ]
  hsk8:
    words_per_stage: 10
    new_words_per_session: 3
    review_words_per_session: 15
    fall_speed: 2.4
    time_limit: 25s
    choices: 4
    lives: 2
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        radical_builder,
        translate_sprint,
        context_weaver,
      ]
  hsk9:
    words_per_stage: 10
    new_words_per_session: 2
    review_words_per_session: 18
    fall_speed: 2.6
    time_limit: 20s
    choices: 4
    lives: 2
    games_available:
      [
        word_fall,
        pinyin_shooter,
        match_rush,
        fill_blast,
        radical_builder,
        translate_sprint,
        context_weaver,
      ]
```

### 2. SRS 간격 파라미터

```yaml
srs:
  intervals: [60, 600, 86400, 259200, 604800, 1209600, 2592000]
  # 1분, 10분, 1일, 3일, 7일, 14일, 30일
  ease_factor: 2.5
  ease_bonus: 0.15
  ease_penalty: 0.20
  min_ease: 1.3
  graduation_threshold: 7
  lapse_reset_to: 1

  # 고급 레벨 SRS 보정
  advanced_modifier:
    hsk7_9_extra_interval: 1.2 # 고급 단어는 간격 1.2배 (더 자주 복습)
    translation_word_weight: 1.5 # 번역 연습 필요 단어 가중
```

### 3. 보상 밸런스

```yaml
rewards:
  correct_answer: 10
  speed_bonus_max: 5
  streak_multiplier: [1.0, 1.1, 1.2, 1.5, 2.0]
  stage_clear: 50
  perfect_clear: 100
  daily_streak: [10, 20, 50, 100, 200]

  # 단계 전환 보너스
  stage_promotion:
    elementary_to_intermediate: 500 # 초급→중급 전환
    intermediate_to_advanced: 1000 # 중급→고급 전환

currency:
  coins_per_stage: 20
  premium_stage_unlock: 0
  hint_cost: 5
  retry_cost: 0
```

### 4. 세션 흐름 밸런스

```yaml
session:
  min_session_length: 30s
  max_session_length: 300s
  new_word_exposure_time: 3s # HSK 1-6
  new_word_exposure_time_advanced: 5s # HSK 7-9 (복잡한 단어)
  feedback_display_time: 1.5s
  inter_game_break: 2s
```

### 5. 학습 시간 예측 (일일 15분 기준)

```yaml
estimated_days_to_master:
  hsk1: 30 #   300 words, ~1개월
  hsk2: 30 #   300 words, ~1개월
  hsk3: 60 #   600 words, ~2개월
  hsk4: 80 #   800 words, ~2.5개월
  hsk5: 120 # 1,200 words, ~4개월
  hsk6: 225 # 2,256 words, ~7.5개월
  hsk7: 205 # 2,044 words, ~7개월
  hsk8: 180 # 1,800 words, ~6개월
  hsk9: 180 # 1,792 words, ~6개월
  total: ~1,110일 (~3년) # HSK 1→9 전체
```

## 분석 도구

밸런스 검증 시 시뮬레이션 스크립트 생성:

- 일일 15분 플레이 시 단어 습득 속도 예측
- HSK 레벨별 마스터까지 예상 소요일
- 리텐션(30일 후 기억률) 추정
- 초급/중급/고급 단계 전환 시점 최적화

출력: `LangMaster_Agent/design/balance/`
