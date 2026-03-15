---
name: shorts-v4-factory
description: "ShortsFactory v4 일일 파이프라인 오케스트레이터 — 채널 프로파일 기반 멀티채널 통합 생산"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, WebSearch
---

# shorts-v4-factory

ShortsFactory v4 일일 파이프라인 오케스트레이터.
채널 프로파일(`channels/`)을 기반으로 멀티채널 콘텐츠를 통합 생산한다.

## 파라미터

| 파라미터     | 필수 | 기본값                      | 설명                         |
| ------------ | ---- | --------------------------- | ---------------------------- |
| `channel_id` | 아니오 | 전체 (`channels/` 내 모든 채널) | 특정 채널만 실행할 경우 지정 |

## 파이프라인 단계

```
mine → script → render → review → upload
```

각 단계는 **서브 에이전트(Task)**로 실행하여 컨텍스트를 격리한다.

## 실행 절차

### Step 1: 채널 목록 로드

```
channels/{channel_id}/profile.yaml
```

- `channel_id`가 지정되면 해당 채널만 로드
- 미지정이면 `channels/` 하위 모든 프로파일 로드

### Step 2: 채널별 파이프라인 실행

각 채널에 대해 순차적으로:

1. **mine** — `shorts-v4-mine` 스킬을 Task로 호출. 토픽 발굴.
2. **script** — `shorts-v4-script` 스킬을 Task로 호출. 스크립트 생성.
3. **render** — `shorts-v4-render` 스킬을 Task로 호출. 영상 합성.
4. **review** — `shorts-v4-review` 스킬을 Task로 호출. 품질 검증.
   - PASS → Step 5로 진행
   - REVISE → script 단계로 되돌아가 수정 (최대 2회)
   - FAIL → 해당 에피소드 중단, 로그 기록
5. **upload** — `shorts-v4-upload` 스킬을 Task로 호출. 업로드 큐 등록.

### Step 3: 배치 상태 기록

진행 상황을 `pipeline/queue/batch_status.json`에 기록한다.

```json
{
  "batch_id": "batch_{YYYYMMDD}_{HHMMSS}",
  "started_at": "ISO8601",
  "channels": {
    "{channel_id}": {
      "status": "completed|failed|in_progress",
      "episodes": ["ep_id_1", "ep_id_2"],
      "step": "mine|script|render|review|upload",
      "error": null
    }
  },
  "completed_at": "ISO8601"
}
```

### Step 4: 완료 보고

전체 배치 완료 후 요약 보고:
- 채널별 생산 수량
- 리뷰 통과/수정/실패 건수
- 업로드 큐 등록 건수

## 입력

- `channels/{channel_id}/profile.yaml` — 채널 프로파일
- `data/performance/` — 최근 성과 데이터 (mine 단계에서 참조)
- `data/learnings/` — 학습 피드백 데이터

## 출력

- `pipeline/queue/batch_status.json` — 배치 진행 상태
- 각 단계별 산출물은 해당 스킬의 출력 경로 참조

## 에러 처리

- 개별 채널 실패 시 다른 채널 파이프라인은 계속 진행
- 서브 에이전트 타임아웃: 10분 초과 시 해당 단계 FAIL 처리
- 모든 에러는 `pipeline/queue/batch_status.json`의 `error` 필드에 기록
- 치명적 에러(파일시스템 접근 불가 등) 시 전체 배치 중단 + CEO 에스컬레이션

## 채널 프로파일 참조

모든 단계는 `channels/{channel_id}/profile.yaml`의 설정을 따른다.
프로파일에 정의된 niche, tone, framework, visual_style, tts_engine 등이 각 스킬에 전달된다.
