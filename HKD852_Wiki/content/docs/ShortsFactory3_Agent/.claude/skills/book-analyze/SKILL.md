---
name: book-analyze
description: "주간 쇼츠 성과 분석 — 장르별/시장별/훅패턴별 인사이트"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
recommended-model: sonnet
model-reason: "데이터 분석과 전략 제안에 Sonnet의 균형잡힌 추론이 적합"
argument-hint: "--week N 또는 --period 'YYYY-MM-DD to YYYY-MM-DD'"
---

# /book-analyze -- 주간 도서 쇼츠 성과 분석

## 역할

업로드된 도서 쇼츠의 성과 데이터를 다차원으로 분석하고,
다음 주 전략을 조정합니다. 매주 금요일 실행 권장.

## 입력 데이터

CEO가 YouTube Studio에서 다음 데이터를 제공합니다:

- CSV 파일 또는 수동 입력 (아래 형식)

```yaml
# data/performance/raw/week_{N}.yaml
week: 1
period: "2026-02-22 ~ 2026-02-28"
episodes:
  - id: "book_ep001"
    book_title: "Atomic Habits"
    author: "James Clear"
    genre: "self-improvement"
    market_origin: "US"
    hook_pattern: "공감형"
    views: 85000
    watch_time_hours: 520
    completion_rate: 0.74
    likes: 2300
    comments: 145
    subscribers_gained: 180
    revenue: "$6.80"
    lisa_cron_score: 40
    success_score: 48
  - id: "book_ep002"
    book_title: "역행자"
    author: "자청"
    genre: "business"
    market_origin: "KR"
    hook_pattern: "도발형"
    views: 124000
    watch_time_hours: 780
    completion_rate: 0.68
    likes: 3100
    comments: 287
    subscribers_gained: 250
    revenue: "$9.92"
    lisa_cron_score: 37
    success_score: 42
```

## 분석 항목 (6차원)

### 1. 장르별 성과 (Genre Performance)

| 장르                        | 분석 항목                        |
| --------------------------- | -------------------------------- |
| self-improvement (자기계발) | 조회수, RPM, 완료율, 구독 전환율 |
| psychology (심리학)         | 동일                             |
| fiction (소설/문학)         | 동일                             |
| business (경영/창업)        | 동일                             |
| science (과학/기술)         | 동일                             |
| philosophy (인문/철학)      | 동일                             |

- 장르별 평균 지표 비교 테이블
- 최고/최저 성과 장르 식별
- 장르 가중치 조정 권고

### 2. 저자 효과 (Author Effect)

- **유명 저자** vs **무명 저자**: 조회수/구독 전환율 차이
- 한국 저자 vs 해외 저자 성과 비교
- 저자 인지도와 완료율 상관관계
- "저자 이름 자체가 훅이 되는가?" 분석

### 3. 시장 원산지 (Market Origin)

| 시장              | 분석 항목                    |
| ----------------- | ---------------------------- |
| 한국 원작 (KR)    | 한국 시청자 공감도가 높은가? |
| 번역서 (US/JP/CN) | 문화적 가교가 효과적인가?    |

- 원작 언어별 성과 차이
- 한국 원작 vs 번역서의 댓글 감성 분석
- 시장별 최적 훅 패턴

### 4. 훅 패턴 효과성 (Hook Pattern Analysis)

8가지 훅 패턴별 핵심 지표:

| 패턴       | 분석 항목        |
| ---------- | ---------------- |
| 공감형     | 완료율, 좋아요율 |
| 반전형     | 완료율, 좋아요율 |
| 수치형     | 완료율, 좋아요율 |
| 도발형     | 완료율, 좋아요율 |
| 비밀형     | 완료율, 좋아요율 |
| 저자서사형 | 완료율, 좋아요율 |
| 질문형     | 완료율, 좋아요율 |
| 고백형     | 완료율, 좋아요율 |

- 각 패턴별 완료율 순위
- 장르 x 훅 패턴 교차 분석 (어떤 장르에 어떤 훅이 최적인가?)
- `templates/hooks_book.json` 효과성 점수 업데이트 권고

### 5. 프레임워크 점수 vs 실제 성과 상관관계

- Lisa Cron 점수와 완료율 상관계수
- SUCCESs 점수와 조회수 상관계수
- Korean Perspective 점수와 댓글/좋아요 상관계수
- Not-a-Summary 점수와 구독 전환율 상관계수
- "어떤 프레임워크 항목이 실제 성과에 가장 영향을 주는가?" 도출

### 6. 성장 지표 + 다음 주 전략

- 주간 구독자 증가 추세
- 주간 수익 추세
- 수익화 목표(YPP 조건)까지 남은 기간 예측
- 다음 주 장르/시장/훅 전략 권고

## 출력 형식

```yaml
# data/performance/week_{N}.yaml
week: 1
period: "2026-02-22 ~ 2026-02-28"

summary:
  total_episodes: 5
  total_views: 423000
  total_revenue: "$33.84"
  avg_completion_rate: 0.71
  subscribers_gained: 890
  best_performer:
    episode: "book_ep002"
    book: "역행자"
    views: 124000
    reason: "한국 원작 + 도발형 훅 + 높은 댓글 참여"
  worst_performer:
    episode: "book_ep004"
    book: "Sapiens"
    views: 12000
    reason: "이미 포화된 주제 + 질문형 훅의 낮은 효과"

genre_analysis:
  best_genre: "business"
  best_genre_avg_views: 95000
  worst_genre: "science"
  worst_genre_avg_views: 15000
  recommendation: "경영/자기계발 비중 60%로 증가, 과학은 월 1편으로 제한"

author_effect:
  famous_avg_views: 78000
  obscure_avg_views: 42000
  korean_author_avg_views: 95000
  foreign_author_avg_views: 55000
  insight: "한국 저자 도서가 1.7x 높은 조회수. 특히 댓글 참여율 2.3x"

market_origin:
  korean_books_avg_views: 95000
  translated_books_avg_views: 55000
  best_translated_market: "US"
  insight: "번역서 중 미국 원작이 가장 높은 성과. 일본 원작은 완료율은 높지만 조회수 낮음"

hook_pattern_ranking:
  - pattern: "도발형"
    avg_completion: 0.76
    avg_views: 98000
  - pattern: "공감형"
    avg_completion: 0.74
    avg_views: 85000
  - pattern: "반전형"
    avg_completion: 0.72
    avg_views: 72000
  # ...

framework_correlation:
  lisa_cron_vs_completion: 0.78
  success_vs_views: 0.65
  korean_perspective_vs_engagement: 0.82
  insight: "한국 관점 점수가 실제 참여율과 가장 높은 상관관계 (r=0.82)"

next_week_strategy:
  genre_priority: ["business", "self-improvement", "psychology"]
  market_priority: ["KR", "US"]
  recommended_hooks: ["도발형", "공감형"]
  target_episodes: 3
  focus: "한국 저자 비중 50% 이상. 도발형/공감형 훅 우선."
  avoid: "과학 장르 일시 중단, 질문형 훅 사용 제한"
```

## 전략 조정 자동화

분석 결과에 따라 자동 업데이트:

1. `templates/hooks_book.json`의 패턴별 효과성 점수 업데이트
2. `book_scorer.py`의 장르별 가중치 조정 권고
3. `data/learnings/book_insights.yaml`에 누적 인사이트 저장
4. 다음 `/book-mine` 실행 시 반영될 시장/장르 우선순위 업데이트

## 속도 목표

5분 이내 완료
