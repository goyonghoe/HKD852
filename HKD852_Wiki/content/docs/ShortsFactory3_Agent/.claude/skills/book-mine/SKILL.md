---
name: book-mine
description: "Goodreads 인기 신간 수집 → 한국 미번역 필터 → 리뷰 분석 → Top N 선정"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
recommended-model: sonnet
model-reason: "트렌드 스캔 + 필터링 + 점수화는 Sonnet의 균형잡힌 성능이 적합"
argument-hint: "--count N (기본 3)"
---

# /book-mine -- 미국 인기 신간 발굴 (한국 미번역)

## 역할

Goodreads에서 이번 달 가장 인기 있는 신간을 수집하고,
한국에 아직 번역되지 않은 책만 필터링한 뒤,
리뷰를 분석하여 콘텐츠 잠재력이 높은 Top N 도서를 선정합니다.

**핵심 각도**: "미국에서 난리 난 책인데 한국엔 아직 없어요"

## 실행 흐름

```
[1] Goodreads 스캔  → goodreads_scanner.py (이번 달 popular 신간)
[2] 미번역 필터     → translation_checker.py (알라딘 검색으로 한국 출판 여부 확인)
[3] 리뷰 분석       → 상위 후보 Top 10 리뷰 가져오기 (좋아요 순)
[4] 점수화 + 선정   → AI가 콘텐츠 잠재력 평가, Top N 선정
```

## 데이터 소스

### 1차 소스: Goodreads

```python
from book_data.goodreads_scanner import GoodreadsScanner

scanner = GoodreadsScanner()
books = scanner.fetch_popular(min_rating=3.8, limit=30)
```

수집 항목:

- 제목, 저자, 평점, 평가 수, 리뷰 수, 셸빙 수
- 표지 이미지 URL, 책 페이지 URL
- 설명 (description)

### 2차 소스: 한국 번역 확인

```python
from book_data.translation_checker import KoreanTranslationChecker

checker = KoreanTranslationChecker()
untranslated = checker.filter_untranslated(books)
```

알라딘 검색으로 한국어 제목이 있는 결과가 나오면 → 번역됨 → 제외

### 3차 소스: 리뷰 수집

```python
reviews = scanner.fetch_reviews(book.url, limit=10)
```

좋아요 순으로 상위 10개 리뷰 수집 → 대중 반응 분석 소재

### 보조 소스: 4개국 차트 (교차 검증)

```python
from book_data.chart_scanner import ChartAggregator

charts = ChartAggregator().fetch_all(enrich=False)
```

4개국 차트에도 진입한 책이면 추가 점수 부여

## AI 점수화 기준

각 미번역 도서를 아래 기준으로 평가합니다 (100점 만점):

| #   | 항목                  | 배점 | 설명                                            |
| --- | --------------------- | ---- | ----------------------------------------------- |
| 1   | **대중 열광도**       | 25   | Goodreads 평점 + 리뷰 수 + 리뷰 감성            |
| 2   | **스토리텔링 잠재력** | 25   | 반전, 갈등, 논쟁 요소 — 55초에 담을 수 있는가?  |
| 3   | **한국 공감 연결**    | 20   | 한국 사회 이슈/감정에 연결 가능한가?            |
| 4   | **발견의 놀라움**     | 15   | "이런 책이 있었어?" 리액션 유발 가능성          |
| 5   | **시각화 가능성**     | 15   | Warm Bibliotheca 스타일 이미지로 표현 가능한가? |

**선정 기준**: 70점 이상, 상위 N권

## 중복 방지

- `pipeline/scripts/` 기존 스크립트의 `book_title` 필드로 이미 다룬 도서 확인
- `pipeline/analytics/upload_history.json`의 `book_title` 필드 교차 확인

## 인자

| 인자              | 기본값  | 설명                   |
| ----------------- | ------- | ---------------------- |
| `--count N`       | 3       | 선정할 도서 수         |
| `--month YYYY-MM` | 이번 달 | Goodreads 스캔 대상 월 |
| `--min-rating N`  | 3.8     | 최소 Goodreads 평점    |

## 출력 형식

```yaml
# data/picks/YYYY-MM-DD.yaml
scan_date: "2026-02-22"
source: "goodreads_popular"
total_scanned: 15
translated_filtered: 1
top_picks:
  - rank: 1
    title: "It's Not Her"
    author: "Mary Kubica"
    goodreads_url: "https://www.goodreads.com/book/show/..."
    goodreads_rating: 4.08
    ratings_count: 24288
    reviews_count: 4045
    korean_available: false
    scores:
      popularity: 23
      storytelling: 22
      korean_angle: 18
      discovery: 14
      visual: 13
    total_score: 90
    why_hot: "24K 평점에 ★4.08, 스릴러 팬들이 '원나잇 리드'라며 열광"
    korean_angle: "직장인의 일상 탈출 판타지, 가족 서스펜스에 대한 공감"
    top_reviews_summary:
      - "PHEW what a ride! (239 likes)"
      - "Totally gripping, breathless pacing (154 likes)"
      - "Kubica did it again! I devoured this (114 likes)"
    translation_status:
      checked_via: "aladin"
      confidence: "high"
      korean_edition: null
  - rank: 2
    # ...
```

## 속도 목표

2분 이내 완료 (Goodreads 1회 + 알라딘 N회 + 리뷰 N회)
