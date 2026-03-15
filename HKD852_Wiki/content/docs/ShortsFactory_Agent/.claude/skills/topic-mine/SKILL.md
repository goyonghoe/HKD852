---
name: topic-mine
description: "글로벌 트렌드 기반 고RPM YouTube Shorts 토픽 자동 발굴"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
recommended-model: sonnet
model-reason: "트렌드 분석과 스코어링에 Sonnet의 균형잡힌 추론이 적합"
argument-hint: "--count N (기본 1)"
---

# /topic-mine — 트렌드 토픽 발굴기

## 역할

글로벌 트렌드를 실시간 리서치하여, YouTube Shorts 광고 수익을 극대화할 수 있는 토픽을 자동 선정합니다.
고정 니치 없이, 매번 트렌드+RPM 기반으로 최적 토픽을 결정합니다.

## 실행 순서

### 1단계: 트렌드 수집

WebSearch를 사용하여 다음 소스에서 트렌딩 토픽을 수집합니다:

- "trending topics today [date]"
- "viral youtube shorts this week"
- "trending AI tools 2026"
- "trending finance tips"
- "trending productivity hacks"

### 2단계: 스코어링 매트릭스

수집된 토픽을 아래 기준으로 점수화합니다:

```
최종 점수 = RPM 가중치(40%) + 글로벌 볼륨(35%) + 제작 난이도 역수(25%)
```

**RPM 기준 ($/1K views):**
| 니치 | RPM 범위 | 점수 |
|------|---------|------|
| Finance/Investing | $12-25 | 100 |
| AI/Tech | $8-15 | 85 |
| B2B/SaaS | $8-13 | 80 |
| Productivity | $6-10 | 70 |
| Health | $4-8 | 55 |
| Entertainment | $2-4 | 30 |
| Gaming | $1-3 | 20 |

**글로벌 볼륨:**

- 영어 검색량 기준 (미국/영국/캐나다/호주)
- 높음=100, 중간=60, 낮음=30

**제작 난이도 역수:**

- 텍스트+TTS만으로 가능=100
- 스크린캡 필요=70
- 실제 촬영 필요=20

### 3단계: 이전 성과 반영

`data/performance/` 폴더의 이전 성과 데이터가 있으면:

- 높은 조회수를 기록한 니치에 +15점 보너스
- 낮은 조회수를 기록한 니치에 -10점 페널티
- 아직 시도하지 않은 니치에 +5점 (탐색 보너스)

### 4단계: 경쟁 포화도 체크

선정된 토픽에 대해:

- WebSearch로 "youtube shorts [토픽]" 검색
- 이미 대량의 유사 쇼츠가 있으면 -20점
- 새로운 앵글이 가능하면 유지

### 5단계: 독자적 앵글 제안

최종 선정된 토픽에 대해 반드시 **크리에이터 고유 관점**을 제안합니다:

- 단순 팩트 나열이 아닌, "왜 이것이 중요한지"에 대한 해석
- 비유, 대비, 스토리 프레임 중 하나 이상 적용
- "Most people think X, but actually Y" 구조 권장

## 출력 형식

```yaml
# pipeline/topics/YYYY-MM-DD-{N}.yaml
date: "2026-02-18"
batch_number: 1
topic:
  title: "3 AI Tools That Replace $200/mo Subscriptions"
  niche: "ai-tech"
  score: 92
  rpm_estimate: "$8-15"
  angle: "반전 구조 — 무료 도구가 유료보다 나은 구체적 사례"
  sources:
    - "https://..."
  competition: "medium"
  format_recommendation: "list"
  tts_voice: "en-US-AndrewMultilingualNeural"
scoring:
  rpm: 85
  volume: 95
  difficulty_inv: 100
  performance_bonus: 0
  competition_penalty: -5
  total: 92
```

## 속도 목표

1분 이내 완료 (WebSearch 2~3회 + 스코어링 즉시)
