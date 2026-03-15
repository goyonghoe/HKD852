---
name: shorts-factory
description: "YouTube Shorts 일일 파이프라인 오케스트레이터 — 토픽→스크립트→렌더→검수 전 과정 자동 실행"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, Task
recommended-model: sonnet
model-reason: "파이프라인 조율은 Sonnet의 균형잡힌 성능이 적합"
argument-hint: "--batch N (기본 3)"
---

# /shorts-factory — 쇼츠 공장 오케스트레이터

## 역할

매일 실행하여 YouTube Shorts 생산 파이프라인 전체를 자동 조율합니다.
목표: 1편당 10분 이내 완료.

## 실행 흐름

```
입력: --batch N (기본 3, 최대 10)

[1] /topic-mine × N편     → 트렌드 기반 토픽 N개 선정
[2] /shorts-script × N편  → 각 토픽별 스크립트 + 메타데이터
[3] /shorts-render × N편  → TTS + FFmpeg 영상 렌더링
[4] /shorts-review × N편  → YouTube 정책 준수 자동 검증
[5] 결과 요약 리포트       → CEO 검수용 테이블 출력
[6] /shorts-upload --add   → PASS 에피소드를 업로드 큐에 추가
[7] CEO 승인 대기 테이블   → 큐 상태 + 승인 가이드 출력
```

## 실행 방법

1. 배치 크기를 파악합니다 (인자 또는 기본값 3)
2. `/topic-mine` 스킬을 호출하여 N개의 트렌드 토픽을 선정합니다
3. 각 토픽에 대해 `/shorts-script`를 호출하여 스크립트를 생성합니다
4. 각 스크립트에 대해 `/shorts-render`를 호출하여 영상을 렌더링합니다
5. 렌더링된 영상에 대해 `/shorts-review`를 호출하여 정책 검증합니다
6. REVISE 판정이 나온 경우 스크립트를 수정하고 재렌더링합니다
7. PASS 판정 에피소드를 업로드 큐에 추가합니다 (`upload_queue.py add`)
8. 최종 결과 + 업로드 큐 상태를 요약 테이블로 출력합니다

## 출력 형식

```markdown
## 🎬 Shorts Factory 배치 결과

| #   | 토픽         | 타이틀       | 길이 | 검수        | 파일               |
| --- | ------------ | ------------ | ---- | ----------- | ------------------ |
| 1   | AI Tool      | "This AI..." | 28s  | PASS        | rendered/ep001.mp4 |
| 2   | Finance      | "Stop..."    | 32s  | PASS        | rendered/ep002.mp4 |
| 3   | Productivity | "I auto..."  | 25s  | REVISE→PASS | rendered/ep003.mp4 |

### 메타데이터

[각 에피소드별 타이틀, 설명, 해시태그 블록]

### CEO 액션

- [ ] 영상 재생 확인
- [ ] `/shorts-upload --list` 로 큐 확인
- [ ] `/shorts-upload --approve --all` 로 승인
- [ ] `/shorts-upload --upload` 로 업로드 실행
```

## 속도 최적화

- 토픽 선정: 이전 성과 데이터 기반 니치 우선순위 적용
- 스크립트: hooks.json 훅 패턴 즉시 활용
- 렌더링: FFmpeg -preset ultrafast 사용
- 배치 모드: 렌더링을 순차 실행 (FFmpeg 프로세스 충돌 방지)

## 컨텍스트 관리 규칙

배치 생산 시 반드시 준수:

1. **스킬 격리**: 각 스킬은 Task(서브에이전트)로 실행 → 메인에 결과 경로+메트릭만 반환
2. **파일 기반 통신**: 스킬 간 데이터는 JSON/YAML 파일로만 전달 (컨텍스트에 전문 붙여넣기 금지)
3. **진행률 파일**: `pipeline/queue/batch_status.json` 유지 → 중단 시 재개 가능
4. **컨텍스트 위험 신호 감지**:
   - 렌더링 로그 100줄 이상 → 즉시 요약 후 정리
   - 동일 세션 5편 이상 → `/compact` 수행 권고
5. **에피소드별 요약**: 각 에피소드 완료 시 1줄 요약만 유지
   ```
   EP.001: PASS | 28s | 3.2MB | "AI Tool Replaces 5 Apps"
   ```
