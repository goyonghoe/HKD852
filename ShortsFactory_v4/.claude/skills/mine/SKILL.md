---
name: shorts-v4-mine
description: "트렌드 + 성과 피드백 기반 토픽 발굴"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch
---

# shorts-v4-mine

트렌드 스캔과 과거 성과 피드백을 결합하여 고RPM 토픽을 발굴한다.

## 파라미터

| 파라미터     | 필수 | 기본값 | 설명           |
| ------------ | ---- | ------ | -------------- |
| `channel_id` | 예   | —      | 대상 채널 ID   |
| `count`      | 아니오 | 3      | 발굴할 토픽 수 |

## 실행 절차

### Step 1: 채널 프로파일 로드

```
channels/{channel_id}/profile.yaml
```

채널의 niche, target_audience, content_pillars, forbidden_topics를 확인한다.

### Step 2: Persistent Memory + 성과 데이터 확인

```
data/memory/{channel_id}/          ← 세션 간 영구 기억 (우선 참조)
data/performance/{channel_id}/     ← 최근 성과 데이터
data/learnings/{channel_id}/       ← 학습 피드백
```

1. **영구 기억 확인** (`session_memory.py`):
   - `performance_patterns.json` — 누적 학습된 성공 패턴
   - `failed_experiments.json` — 실패한 실험 (반복 금지)
   - `visual_fatigue.json` — 비주얼 스타일 사용 빈도 (단조로움 방지)
2. **최근 성과**: 좋아요율/시청시간 상위 토픽 패턴 추출 (72시간 이전 데이터만)
3. **피드백 루프**: `data/learnings/`의 주간 학습 결과 참조
4. **중복 방지**: 최근 30일 내 다룬 토픽 목록 로드

### Step 3: 트렌드 스캔

WebSearch로 채널 niche 관련 최신 트렌드를 탐색한다.

검색 키워드 구성:
- 채널 niche + "trending" + 현재 날짜
- 채널 content_pillars 기반 세부 키워드
- 시장별 키워드 (NA > EU > KR 순)

### Step 4: 토픽 선정

다음 기준으로 토픽 후보를 평가하고 상위 `count`개를 선정:

1. **트렌드 점수** (0-10): 현재 화제성
2. **채널 적합도** (0-10): 프로파일 niche/pillars 부합도
3. **중복 회피** (Y/N): 최근 30일 내 유사 토픽 없음
4. **RPM 잠재력** (0-10): 과거 유사 토픽 성과 기반 추정
5. **제작 난이도** (상/중/하): 리서치 및 렌더 복잡도

### Step 5: 출력 파일 생성

## 입력

- `channels/{channel_id}/profile.yaml`
- `data/performance/{channel_id}/` — 최근 성과
- `data/learnings/{channel_id}/` — 학습 피드백
- WebSearch 결과

## 출력

```
pipeline/scripts/topics_{YYYYMMDD}_{channel_id}.yaml
```

출력 형식:

```yaml
batch_date: "YYYY-MM-DD"
channel_id: "{channel_id}"
topics:
  - id: "topic_001"
    title: "토픽 제목"
    angle: "접근 각도 설명"
    trend_score: 8
    channel_fit: 9
    rpm_potential: 7
    difficulty: "중"
    sources:
      - url: "https://..."
        summary: "요약"
    rejected_reason: null
```

## 에러 처리

- 채널 프로파일 미존재: 에러 반환, 파이프라인 중단
- WebSearch 실패: 과거 성과 데이터만으로 토픽 선정 (경고 로그)
- 성과 데이터 없음 (신규 채널): 트렌드 스캔 결과만으로 선정

## 채널 프로파일 참조

`profile.yaml`의 `content_pillars`, `forbidden_topics`, `target_audience` 필드를 반드시 준수한다.
