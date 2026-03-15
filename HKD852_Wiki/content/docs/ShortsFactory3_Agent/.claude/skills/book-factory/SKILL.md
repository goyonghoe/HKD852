---
name: book-factory
description: "일일 도서 쇼츠 생산 파이프라인 오케스트레이터"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, Task
recommended-model: sonnet
model-reason: "파이프라인 조율은 Sonnet의 균형잡힌 성능이 적합"
argument-hint: "--batch N (기본 2, 최대 5)"
---

# /book-factory -- 도서 쇼츠 일일 오케스트레이터

## 역할

매일 실행하여 도서 기반 YouTube Shorts 생산 파이프라인 전체를 자동 조율합니다.
목표: 1편당 12분 이내 완료.

## 실행 흐름

```
입력: --batch N (기본 2, 최대 5)

[1] /book-mine × 1          → 4개국 차트 스캔, Top N 도서 선정
[2] /book-script × N편      → 각 도서별 5씬 스크립트 + 메타데이터
[3] Render × N편            → 공유 라이브러리 (TTS + 이미지 생성 + 영상 합성)
[4] /book-review × N편      → 12항목 품질 게이트
[5] 결과 요약 리포트         → CEO 검수용 테이블 출력
[6] 큐 등록                  → PASS 에피소드를 업로드 큐에 추가
```

## 실행 방법

1. 배치 크기를 파악합니다 (인자 또는 기본값 2)
2. `/book-mine`을 호출하여 Top N 도서를 선정합니다
3. 각 도서에 대해 `/book-script`를 호출하여 5씬 스크립트를 생성합니다
4. 각 스크립트에 대해 공유 렌더링 라이브러리를 사용하여 영상을 렌더링합니다
   - `libs/tts_engine.py` -- TTS 음성 생성
   - `libs/image_gen.py` -- 씬별 이미지 생성
   - `libs/video_composer.py` -- 최종 영상 합성
   - `libs/subtitle_gen.py` -- 자막 싱크
5. 렌더링된 영상에 대해 `/book-review`를 호출하여 12항목 검증합니다
6. REVISE 판정 시 스크립트를 수정하고 재렌더링합니다 (최대 2회 재시도)
7. PASS 에피소드를 업로드 큐에 추가합니다
8. 최종 결과를 요약 테이블로 출력합니다

## 출력 형식

```markdown
## 📚 Book Shorts Factory 배치 결과

| #   | 도서          | 저자        | 타이틀                               | 길이 | 검수         | 파일                    |
| --- | ------------- | ----------- | ------------------------------------ | ---- | ------------ | ----------------------- |
| 1   | Atomic Habits | James Clear | 📖 Atomic Habits를 진짜 실천하면?    | 52s  | PASS         | rendered/book_ep001.mp4 |
| 2   | 역행자        | 자청        | 🔥 역행자가 말하는 진짜 성공 공식은? | 48s  | REVISE->PASS | rendered/book_ep002.mp4 |

### 프레임워크 점수

| #   | Lisa Cron (50) | SUCCESs (60) | Korean Perspective (10) | Not-a-Summary (10) |
| --- | -------------- | ------------ | ----------------------- | ------------------ |
| 1   | 40             | 48           | 9                       | 8                  |
| 2   | 37             | 42           | 8                       | 8                  |

### 메타데이터

[각 에피소드별 타이틀, 설명, 해시태그 블록]

### CEO 액션

- [ ] 영상 재생 확인
- [ ] 업로드 큐 확인
- [ ] 승인 후 업로드 실행
```

## 컨텍스트 관리 규칙

배치 생산 시 반드시 준수:

### 1. 스킬 격리 실행

```
각 스킬은 독립 서브에이전트(Task)로 실행 -> 메인 컨텍스트에 1줄 JSON 요약만 반환

/book-mine   -> Task (Sonnet) -- 결과: data/charts/YYYY-MM-DD.yaml
/book-script -> Task (Sonnet) -- 결과: pipeline/scripts/book_ep{NNN}.json
Render       -> Task (Haiku)  -- 결과: pipeline/rendered/book_ep{NNN}.mp4
/book-review -> Task (Opus)   -- 결과: pipeline/analytics/review/book_ep{NNN}.yaml
```

### 2. 파일 기반 상태 전달

```
스킬 간 데이터는 반드시 파일(JSON/YAML)로 전달합니다.
메인 컨텍스트에 스크립트 전문, 로그 전문을 붙여넣지 않습니다.
결과는 "파일 경로 + 핵심 메트릭"만 반환합니다.
```

### 3. 배치 실행 시 진행률 파일

```json
// pipeline/queue/batch_status.json
{
  "batch_id": "book_20260222_001",
  "total": 2,
  "completed": 1,
  "current": "book_ep002",
  "results": [
    {
      "episode_id": "book_ep001",
      "book_title": "Atomic Habits",
      "status": "PASS",
      "path": "rendered/book_ep001.mp4",
      "lisa_cron": 40,
      "success": 48
    }
  ]
}
```

중단 시 이 파일로 재개할 수 있습니다.

### 4. 컨텍스트 위험 신호

```
아래 상황이면 즉시 /compact 또는 중간 요약을 수행:
- 렌더링 로그가 100줄 이상 누적
- 서브에이전트 결과가 3회 이상 인라인으로 반환
- 동일 세션에서 4편 이상 연속 생산
```

### 5. 에피소드별 요약

각 에피소드 완료 시 1줄 요약만 유지:

```
BOOK.001: PASS | 52s | 3.8MB | "Atomic Habits" | LC:40 SU:48
BOOK.002: REVISE->PASS | 48s | 3.2MB | "역행자" | LC:37 SU:42
```

## REVISE 재시도 로직

```
1차 REVISE -> revise_items 기반 스크립트 수정 -> 재렌더링 -> 재검증
2차 REVISE -> 한 번 더 수정 시도
3차 이후   -> REJECT 처리 (CEO 에스컬레이션)
```

## 속도 최적화

- 차트 스캔: 4개국 동시 요청 (병렬)
- 스크립트: 훅 패턴 라이브러리 즉시 활용
- 렌더링: FFmpeg -preset ultrafast 사용
- 배치 모드: 렌더링 순차 실행 (FFmpeg 프로세스 충돌 방지)
- 이미지 생성: 씬별 병렬 생성 가능

## 속도 목표

2편 배치 기준 25분 이내 완료
