---
name: shorts-fleet
description: "멀티채널 일일 병렬 생산 오케스트레이터 — 전 채널 순차 가동 + 통합 결과 요약"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
recommended-model: sonnet
model-reason: "파이프라인 조율 + 서브에이전트 관리 — Sonnet 최적"
argument-hint: "[--channel <id>] [--batch N] [--resume]"
---

# /shorts-fleet — 멀티채널 생산 오케스트레이터

## 역할

등록된 전 채널을 순차적으로 가동하여 YouTube Shorts를 생산하고, 결과를 통합 관리합니다.
GPU(SSD-1B) + Qwen3-TTS가 메모리를 공유하므로 동시 실행 시 OOM 위험이 있어 **채널별 순차 실행**합니다.

## 인자

| 인자        | 필수 | 설명                                       | 예시               |
| ----------- | ---- | ------------------------------------------ | ------------------ |
| `--channel` | N    | 특정 채널만 실행 (기본: 전체 enabled 채널) | `--channel whatif` |
| `--batch`   | N    | 채널별 배치 오버라이드 (기본: registry 값) | `--batch 5`        |
| `--resume`  | N    | 이전 중단 지점에서 재개                    | `--resume`         |

## 실행 흐름

```
[1] Read registry.json → enabled 채널 필터
[2] --channel 플래그 있으면 특정 채널만 선택
[3] fleet_state.json 생성/로드 (--resume 시 기존 파일 로드)
[4] 채널별 순차 실행:
    ├─ 채널의 orchestrator_skill이 있으면:
    │   └─ Task 서브에이전트 스폰 → 해당 채널 CLAUDE.md 읽고 오케스트레이터 실행
    ├─ orchestrator_skill이 null이면:
    │   └─ Task 서브에이전트 스폰 → 채널 CLAUDE.md 읽고 수동 파이프라인 실행
    └─ 리턴: 에피소드당 1줄 JSON만 (경로 + 메트릭)
[5] fleet_state.json 업데이트 (채널 완료 시마다)
[6] 전 채널 결과 집계 → CEO 요약 테이블
```

## 실행 방법

### 1단계: 레지스트리 로드

```
ShortsFleet/registry.json을 Read로 읽어 enabled 채널 목록을 확인합니다.
--channel 인자가 있으면 해당 채널만 필터링합니다.
```

### 2단계: fleet_state.json 초기화

`--resume` 플래그가 있으면 기존 `ShortsFleet/fleet_state.json`을 읽어 진행 상태를 복원합니다.
없으면 새 상태 파일을 생성합니다:

```json
{
  "run_id": "fleet_20260222_001",
  "started_at": "2026-02-22T10:00:00+09:00",
  "status": "running",
  "channels": {
    "whatif": {
      "status": "pending",
      "batch_size": 3,
      "episodes": []
    },
    "paper": {
      "status": "pending",
      "batch_size": 2,
      "episodes": []
    }
  }
}
```

Write 도구로 `ShortsFleet/fleet_state.json`에 저장합니다.

### 3단계: 채널별 순차 실행

각 채널에 대해 **Task 서브에이전트**를 스폰합니다:

```
Task 서브에이전트 프롬프트 (채널별):
─────────────────────────────
채널: {channel.name} ({channel.id})
에이전트 디렉토리: {channel.agent_dir}
배치 사이즈: {batch_size}

1. {channel.agent_dir}/.claude/CLAUDE.md를 읽어 채널 컨텍스트를 파악합니다
2. {channel.agent_dir}/pipeline/scripts/ 에서 기존 에피소드를 확인합니다
3. 채널의 오케스트레이터 스킬이 있으면 해당 파이프라인을 실행합니다
4. 없으면 수동으로: topic → script → render → review 순서로 진행합니다
5. 완료 시 에피소드별 1줄 JSON만 반환합니다:
   {"ep": "whatif_ep043", "status": "PASS", "duration": "35s", "path": "rendered/samples/whatif_ep043/"}
─────────────────────────────
```

**중요**: 한 채널이 완료된 후 다음 채널로 진행합니다 (순차 실행).

### 4단계: 상태 업데이트

각 채널 완료 시 `fleet_state.json`을 Edit으로 업데이트합니다:

- `status`: "pending" → "running" → "complete" / "error"
- `episodes`: 서브에이전트가 반환한 1줄 JSON 배열

### 5단계: 결과 집계

모든 채널 완료 후 통합 요약을 출력합니다.

## 출력 형식

```markdown
## ShortsFleet 생산 결과

**실행 ID**: fleet_20260222_001
**실행 시간**: 2026-02-22 10:00 ~ 10:45

### 채널별 결과

| 채널             | 배치  | 생산  | PASS  | REVISE | FAIL  | 총 길이    |
| ---------------- | ----- | ----- | ----- | ------ | ----- | ---------- |
| WhatIf (만약에~) | 3     | 3     | 2     | 1→PASS | 0     | 1m 42s     |
| 오늘의 논문      | 2     | 2     | 2     | 0      | 0     | 1m 05s     |
| **합계**         | **5** | **5** | **4** | **1**  | **0** | **2m 47s** |

### 에피소드 상세

#### WhatIf (만약에~)

| #   | 에피소드     | 타이틀 | 길이 | 검수        | 파일                           |
| --- | ------------ | ------ | ---- | ----------- | ------------------------------ |
| 1   | whatif_ep043 | "..."  | 35s  | PASS        | rendered/samples/whatif_ep043/ |
| 2   | whatif_ep044 | "..."  | 38s  | PASS        | rendered/samples/whatif_ep044/ |
| 3   | whatif_ep045 | "..."  | 29s  | REVISE→PASS | rendered/samples/whatif_ep045/ |

#### 오늘의 논문

| #   | 에피소드    | 타이틀 | 길이 | 검수 | 파일                          |
| --- | ----------- | ------ | ---- | ---- | ----------------------------- |
| 1   | paper_ep009 | "..."  | 33s  | PASS | rendered/samples/paper_ep009/ |
| 2   | paper_ep010 | "..."  | 32s  | PASS | rendered/samples/paper_ep010/ |

### CEO 액션

- [ ] 영상 재생 확인
- [ ] `/fleet-status` 로 업로드 큐 확인
- [ ] 각 채널에서 승인 후 업로드
```

## 컨텍스트 관리 규칙

1. **서브에이전트 격리**: 각 채널은 독립 Task로 실행 → 메인에 1줄 JSON만 반환
2. **파일 기반 통신**: `fleet_state.json`으로만 상태 공유
3. **재개 가능**: `--resume` 시 fleet_state.json에서 "pending" 상태인 채널만 실행
4. **3채널 이상 실행 시**: 중간 요약 수행, 완료 채널 결과는 정리

## 주의사항

- 기존 에이전트 파일은 절대 수정하지 않습니다
- GPU 메모리 공유 문제로 동시 실행은 하지 않습니다
- 채널별 오류 발생 시 해당 채널만 "error" 표기하고 다음 채널 진행
- `fleet_state.json`은 항상 최신 상태를 유지합니다
