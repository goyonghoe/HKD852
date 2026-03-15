---
name: book-review
description: "YouTube 정책 + 스토리텔링 프레임워크 품질 검증 (12항목)"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: opus
model-reason: "정책 준수 + 스토리텔링 프레임워크 판단은 Opus의 비판적 분석 능력이 필수"
argument-hint: "--episode 'book_ep001' 또는 --all"
---

# /book-review -- 12항목 품질 검증 게이트

## 역할

렌더링된 도서 쇼츠의 YouTube 2026 AI 콘텐츠 정책 준수 여부를 검증하고,
Lisa Cron + Dan Heath 스토리텔링 프레임워크 품질을 평가하여
PASS / REVISE / REJECT 판정을 내립니다.

표준 YouTube 검증 7항목 + 도서 특화 5항목 = **총 12항목**.

## 검증 체크리스트 (12항목)

### Part A: 표준 YouTube Shorts 검증 (7항목)

각 항목 1~10점:

| #   | 항목                | 기준                             | 최소 통과 |
| --- | ------------------- | -------------------------------- | --------- |
| 1   | **영상 길이**       | 30~60초 범위 준수                | 7점       |
| 2   | **해상도**          | 1080x1920 세로 포맷              | 8점       |
| 3   | **오디오 품질**     | TTS 명료도, 배경음 밸런스        | 7점       |
| 4   | **자막 싱크**       | 나레이션-자막 동기화 정확도      | 8점       |
| 5   | **정책 준수**       | YouTube 2026 AI 콘텐츠 정책      | 8점       |
| 6   | **독창성**          | 이전 에피소드 대비 구조적 차별화 | 7점       |
| 7   | **크리에이터 관점** | 고유 해석/비유/스토리 포함       | 8점       |

### Part B: 도서 특화 검증 (5항목)

| #   | 항목                                 | 기준                                                                                                                                  | 최소 통과 |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 8   | **Lisa Cron 내면의 갈등**            | Scene 1에서 보편적 내적 갈등으로 시작하는가? 시청자가 "나도..."라고 느끼는가?                                                         | 7점       |
| 9   | **Dan Heath SUCCESs 총점**           | 6개 원칙(Simple, Unexpected, Concrete, Credible, Emotional, Stories) 총합                                                             | 40/60점   |
| 10  | **한국 관점(Korean Perspective)**    | Scene 4에 한국 일상(직장, 지하철, 카페, 공시생 등)과 구체적으로 연결되는 장면이 있는가? "한국에도 적용됩니다" 같은 추상적 연결은 감점 | 8점       |
| 11  | **Not-a-Summary 점수**               | 단순 책 요약을 넘어 크리에이터 고유의 해석/비유/관점 전환이 있는가? 원본 내용의 재배열이 아닌 새로운 프레이밍이 존재하는가?           | 8점       |
| 12  | **도서 출처 명시(Book Attribution)** | 저자명, 책 제목, 출판 연도가 스크립트 또는 메타데이터에 명확히 기재되어 있는가?                                                       | 9점       |

## 판정 기준

### PASS

- 12항목 총점 **90점 이상**
- **모든** 항목이 최소 통과 점수 이상
- SUCCESs 총합 40/60 이상

### REVISE

- 총점 **70~89점**, 또는
- **1~2개** 항목만 최소 통과 점수 미달
- 수정사항을 구체적으로 명시

### REJECT

- 총점 **70점 미만**, 또는
- **3개 이상** 항목이 최소 통과 점수 미달
- 근본적 재작성 필요 사유 명시

## 검증 프로세스

```
[1] pipeline/scripts/book_ep{NNN}.json 에서 스크립트 로드
[2] pipeline/rendered/book_ep{NNN}.mp4 존재 확인 (ffprobe)
[3] Part A: 표준 7항목 순차 평가
[4] Part B: 도서 특화 5항목 순차 평가
[5] 이전 에피소드들과 유사도 체크 (중복 검출)
[6] 종합 판정 + 상세 피드백 출력
```

## 출력 형식

```yaml
# pipeline/analytics/review/book_ep{NNN}.yaml
episode_id: "book_ep001"
book_title: "Atomic Habits"
book_author: "James Clear"
review_date: "2026-02-22"
verdict: "PASS" # PASS | REVISE | REJECT

scores:
  # Part A: Standard YouTube Shorts
  duration_check: 9
  resolution_check: 10
  audio_quality: 8
  subtitle_sync: 8
  policy_compliance: 9
  originality: 8
  creator_perspective: 8

  # Part B: Book-Specific
  lisa_cron_internal_struggle: 8
  dan_heath_success_total: 46 # out of 60
  korean_perspective: 9
  not_a_summary: 8
  book_attribution: 10

total_score: 95
all_minimums_met: true

feedback: |
  강한 공감형 훅으로 시작. 저자 일화를 구체적 장면으로 잘 전달.
  한국 관점 Scene에서 '9호선 퇴근길' 비유가 효과적.
  SUCCESs 46/60으로 기준 충족. 도서 출처 완벽 명시.

revise_items: [] # REVISE일 경우 수정 필요 항목
```

### REVISE 판정 시 상세 피드백 예시

```yaml
verdict: "REVISE"
total_score: 78
all_minimums_met: false

revise_items:
  - item: 8
    field: "script.scenes[0].narration"
    score: 5
    minimum: 7
    issue: "Scene 1 HOOK이 책 소개로 시작함 — Lisa Cron 내면의 갈등 원칙 위반"
    suggestion: "책 제목 대신 시청자의 보편적 실패 경험으로 시작. 예: '매일 운동하겠다고 다짐하고 3일 만에 포기한 적 있죠?'"

  - item: 10
    field: "script.scenes[3].narration"
    score: 6
    minimum: 8
    issue: "한국 관점이 추상적 — '한국인도 공감할 수 있다'로만 언급"
    suggestion: "구체적 장면 추가. 예: '퇴근 후 편의점 삼각김밥 먹으면서 자기계발 유튜브 보는 그 시간, 그게 이미 1%예요.'"
```

## 중복 검출

같은 책을 다른 에피소드에서 다뤘는지 검사:

- ISBN 기반 완전 중복 검출
- 같은 저자의 다른 책 경고 (연속 게시 방지)
- 유사 주제 (예: 습관 관련 책 연속 3편) 경고

## 속도 목표

1분 이내 완료
