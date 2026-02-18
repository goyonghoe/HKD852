---
name: shorts-analyze
description: "YouTube Shorts 주간 성과 분석 + 트렌드 전략 조정"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
recommended-model: sonnet
model-reason: "데이터 분석과 전략 제안에 Sonnet의 균형잡힌 추론이 적합"
argument-hint: "--week N 또는 --period 'YYYY-MM-DD to YYYY-MM-DD'"
---

# /shorts-analyze — 주간 성과 분석

## 역할
업로드된 YouTube Shorts의 성과 데이터를 분석하고,
다음 주 전략을 조정합니다. 매주 금요일 실행 권장.

## 입력 데이터

CEO가 YouTube Studio에서 다음 데이터를 제공합니다:
- CSV 파일 또는 수동 입력 (아래 형식)

```yaml
# data/performance/week-{N}.yaml
week: 3
period: "2026-02-10 ~ 2026-02-16"
episodes:
  - id: "ep_20260210_001"
    title: "This AI Tool Replaces 5 Apps"
    niche: "ai-tech"
    format: "list"
    views: 45000
    watch_time_hours: 280
    completion_rate: 0.72
    likes: 1200
    subscribers_gained: 85
    revenue: "$3.60"
  - id: "ep_20260211_001"
    title: "Stop Saving Money Wrong"
    niche: "finance"
    format: "dark-bg-text"
    views: 128000
    watch_time_hours: 890
    completion_rate: 0.68
    likes: 3400
    subscribers_gained: 240
    revenue: "$15.36"
```

## 분석 항목

### 1. 니치별 성과 비교
- 조회수, RPM, 완료율을 니치별로 집계
- 최고/최저 성과 니치 식별
- 니치 가중치 조정 권고 (templates/niches.json 업데이트)

### 2. 포맷별 성과 비교
- 어떤 영상 포맷이 가장 효과적인지 분석
- 완료율이 높은 포맷 = 알고리즘 추천 유리

### 3. 훅 효과성
- 각 훅 패턴별 완료율 비교
- 가장 효과적인 훅 패턴 식별

### 4. 최적 업로드 시간
- 조회수와 업로드 시간의 상관관계 (데이터 충분 시)
- 글로벌 타깃 기준 권장 시간대

### 5. 성장 지표
- 구독자 증가 추세
- 수익 추세
- 수익화 목표까지 남은 기간 예측

## 출력 형식

```yaml
# data/performance/analysis-week-{N}.yaml
week: 3
summary:
  total_episodes: 7
  total_views: 523000
  total_revenue: "$41.84"
  avg_completion_rate: 0.71
  subscribers_gained: 890
  best_performer:
    episode: "ep_20260211_001"
    views: 128000
    reason: "Finance 니치 + 강한 반전 훅"
  worst_performer:
    episode: "ep_20260214_001"
    views: 8500
    reason: "포화된 주제 + 약한 훅"

insights:
  - "Finance 니치가 AI/Tech 대비 2.8x 높은 RPM"
  - "반전 구조 훅이 질문 구조 대비 1.4x 높은 완료율"
  - "30초 이하 영상이 30초 이상 대비 20% 높은 완료율"

next_week_strategy:
  niche_priority: ["finance", "ai-tech", "productivity"]
  recommended_hooks: ["반전", "충격 수치"]
  recommended_format: "dark-bg-text"
  target_episodes: 7
  focus: "Finance 니치 비중 40%로 증가"
```

## 전략 조정 자동화

분석 결과에 따라 자동 업데이트:
1. `templates/niches.json`의 priority 조정
2. `templates/hooks.json`의 효과성 점수 업데이트
3. `data/learnings/`에 누적 인사이트 저장
