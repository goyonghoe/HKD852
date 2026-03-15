---
name: fleet-status
description: "전 채널 상태 조회 — 에피소드 수, 최신 배치, 업로드 큐를 한눈에 확인"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
recommended-model: haiku
model-reason: "읽기 전용 조회 — Haiku의 빠른 응답이 최적"
---

# /fleet-status — 전 채널 상태 조회

## 역할

`registry.json`에 등록된 모든 채널의 현재 상태를 읽기 전용으로 조회하여 CEO에게 요약 테이블을 제공합니다.

## 실행 흐름

```
[1] ShortsFleet/registry.json 읽기
[2] 각 채널별 데이터 수집:
    ├─ {agent_dir}/pipeline/scripts/{series_prefix}*.json → 총 에피소드 수, 최신 에피소드
    ├─ {agent_dir}/pipeline/queue/batch_status.json → 마지막 배치 결과
    └─ {agent_dir}/pipeline/queue/upload_queue.json → 큐 상태 (pending/uploaded/rejected)
[3] 테이블 형태로 출력
```

## 실행 방법

1. `ShortsFleet/registry.json`을 Read 도구로 읽습니다
2. `channels` 배열을 순회하며 각 채널 정보를 수집합니다:
   - Glob으로 `{agent_dir}/pipeline/scripts/{series_prefix}*.json` 패턴을 검색하여 에피소드 수를 카운트합니다
   - Read로 `{agent_dir}/pipeline/queue/batch_status.json`을 읽어 마지막 배치 상태를 확인합니다 (파일 없으면 "N/A")
   - Read로 `{agent_dir}/pipeline/queue/upload_queue.json`을 읽어 큐 상태를 집계합니다 (파일 없으면 "N/A")
3. 결과를 아래 형식으로 출력합니다

## 출력 형식

```markdown
## ShortsFleet 상태 현황

| 채널             | 에피소드 | 최신 EP      | 마지막 배치        | 배치 상태 | 업로드 큐 | 활성 |
| ---------------- | -------- | ------------ | ------------------ | --------- | --------- | ---- |
| WhatIf (만약에~) | 36       | whatif_ep042 | 20260221_001 (3편) | complete  | 1 pending | ON   |
| 오늘의 논문      | 8        | paper_ep008  | N/A                | N/A       | N/A       | ON   |

### 채널 상세

#### WhatIf (만약에~)

- **에이전트**: ShortsFactory_Agent
- **언어**: ko | **타겟**: KR, NA
- **오케스트레이터**: /shorts-factory
- **마지막 배치**: 20260221_001 — whatif_ep039(PASS), ep040(PASS), ep041(PASS)
- **업로드 큐**: 1 pending, 5 uploaded, 2 rejected

#### 오늘의 논문

- **에이전트**: ShortsFactory2_Agent
- **언어**: ko | **타겟**: KR
- **오케스트레이터**: 미설정
- **마지막 배치**: N/A
- **업로드 큐**: N/A
```

## 주의사항

- 이 스킬은 **읽기 전용**입니다. 어떤 파일도 수정하지 않습니다
- 파일이 없는 경우 "N/A"로 표시합니다 (에러 아님)
- `enabled: false` 채널도 표시하되 "OFF"로 표기합니다
