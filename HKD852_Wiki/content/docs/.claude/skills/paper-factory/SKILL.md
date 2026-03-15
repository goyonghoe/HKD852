---
name: paper-factory
description: "오늘의 논문 일일 파이프라인 오케스트레이터 — 논문 발굴→스크립트→렌더→검수 전 과정"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, Task
recommended-model: sonnet
model-reason: "파이프라인 조율은 Sonnet의 균형잡힌 성능이 적합"
argument-hint: "--batch N (기본 1) [--lang ko|all] [--doi '10.xxxx/yyyy']"
---

# /paper-factory — 오늘의 논문 파이프라인 오케스트레이터

## 역할

매일 실행하여 논문 쇼츠 생산 파이프라인 전체를 자동 조율합니다.
각 단계는 독립 Task (서브에이전트)로 실행하여 컨텍스트를 격리합니다.

## 실행 흐름

```
입력: --batch N (기본 1, 최대 5)
      --lang ko|all (기본 ko)
      --doi "10.xxxx/yyyy" (선택: 특정 논문 지정)

[1] /paper-mine × N         → 논문 발굴 + 스코어링
[2] /paper-script × N       → KO 스크립트 + 메타데이터 생성
--- CEO GATE 1: 스크립트 승인 ---
[3] /paper-render × N       → 이미지 생성 + KO MP4 렌더링
[4] /paper-review × N       → 정책 + 학술 정확성 검증
    REVISE → /paper-script 재실행 → 재렌더 (최대 2회)
    REJECT → 해당 에피소드 스킵, 사유 로그
[5] /paper-translate × N    → EN/JA 번역 (--lang all 시만)
[6] /paper-render × N × L   → EN/JA 렌더링 (--lang all 시만)
--- CEO GATE 2: 영상 승인 ---
[7] /paper-upload --add     → PASS 에피소드를 업로드 큐에 추가
[8] 최종 요약 리포트
```

## 실행 방법

1. 배치 크기와 언어 옵션을 파악합니다
2. `--doi`가 지정된 경우 `/paper-mine --doi` 모드로 실행, 아니면 `--discover`
3. 각 토픽에 대해 `/paper-script`를 Task로 호출
4. **CEO GATE 1**: 스크립트 승인 요청 테이블을 출력하고 사용자 입력 대기
5. 승인된 스크립트에 대해 `/paper-render`를 Task로 호출
6. 렌더링된 에피소드에 대해 `/paper-review`를 Task로 호출
7. REVISE 판정 시 피드백을 포함하여 `/paper-script` 재실행 (최대 2회)
8. `--lang all` 시 `/paper-translate` → `/paper-render --lang en/ja` 순차 실행
9. **CEO GATE 2**: 영상 승인 요청 테이블을 출력하고 사용자 입력 대기
10. 승인된 에피소드를 `/paper-upload --add`로 큐에 추가
11. 최종 요약 + CEO 업로드 가이드 출력

## CEO GATE 1: 스크립트 승인

```markdown
## 📝 스크립트 승인 요청

| #   | 에피소드    | Hook                     | 논문          | 점수   |
| --- | ----------- | ------------------------ | ------------- | ------ |
| 1   | paper_ep019 | "8천 명을 조사했더니..." | Cureus (2025) | 81/100 |

### paper_ep019 상세

- **Hook**: "8천 명을 조사했더니, 혼밥하는 남자가..."
- **Body**: [3문장 요약]
- **Closer**: "..."
- **출처**: Journal of Preventive Medicine, DOI: 10.xxxx

### CEO 액션

각 에피소드에 대해 응답:

- `approve` — 렌더링 진행
- `revise: [피드백]` — 피드백 반영 후 재생성
- `reject` — 스킵
```

## CEO GATE 2: 영상 승인

```markdown
## 🎬 영상 승인 요청

| #   | 에피소드    | 언어 | 길이  | 크기  | 리뷰         | 파일                                  |
| --- | ----------- | ---- | ----- | ----- | ------------ | ------------------------------------- |
| 1   | paper_ep019 | KO   | 28.3s | 4.2MB | PASS (69/80) | rendered/.../paper*ep019_manga*\*.mp4 |

### CEO 액션

- `approve` — 업로드 큐에 추가
- `reject: [사유]` — 스킵 (로그 기록)
```

## 컨텍스트 관리 규칙

배치 생산 시 반드시 준수:

1. **스킬 격리**: 각 스킬은 Task(서브에이전트)로 실행 → 메인에 결과 경로+메트릭만 반환
2. **파일 기반 통신**: 스킬 간 데이터는 JSON/YAML 파일로만 전달 (컨텍스트에 전문 붙여넣기 금지)
3. **진행률 파일**: `pipeline/queue/batch_status.json` 유지 → 중단 시 재개 가능
4. **컨텍스트 위험 신호 감지**:
   - 렌더링 로그 100줄 이상 → 즉시 요약 후 정리
   - 동일 세션 3편 이상 → `/compact` 수행 권고
5. **에피소드별 1줄 요약만 유지**:
   ```
   EP.019: PASS | 28s | 4.2MB | "혼밥하는 남자, 대사증후군 위험 3배"
   ```

## 배치 상태 파일

`pipeline/queue/batch_status.json`:

```json
{
  "batch_id": "20260227_001",
  "total": 1,
  "completed": 0,
  "current_step": "mine",
  "current_episode": "paper_ep019",
  "languages": ["ko"],
  "results": []
}
```

완료 시:

```json
{
  "batch_id": "20260227_001",
  "total": 1,
  "completed": 1,
  "current_step": "done",
  "current_episode": null,
  "languages": ["ko"],
  "results": [
    {
      "episode_id": "paper_ep019",
      "status": "PASS",
      "ko_path": "rendered/samples/paper_ep019/paper_ep019_manga_*.mp4",
      "duration_sec": 28,
      "review_score": 69
    }
  ]
}
```

## 최종 요약 리포트

```markdown
## 🏭 Paper Factory 배치 결과

| #   | 에피소드    | 타이틀                | 길이 | 리뷰         | 업로드 큐 |
| --- | ----------- | --------------------- | ---- | ------------ | --------- |
| 1   | paper_ep019 | "🧠 혼밥하는 남자..." | 28s  | PASS (69/80) | ✓ 추가됨  |

### 메타데이터

**paper_ep019**

- Title: 🧠 혼밥하는 남자, 대사증후군 위험 3배? #오늘의논문
- Description: 오늘의 논문: 8천 명을 조사했더니...
- Tags: #오늘의논문 #건강 #대사증후군 #Shorts

### CEO 다음 액션

- [ ] 영상 재생 확인
- [ ] `/paper-upload --list` 로 큐 확인
- [ ] `/paper-upload --approve --all` 로 승인
- [ ] `/paper-upload --upload` 로 업로드 실행
```

## 속도 목표

- 1편 (KO only): ~10분
- 1편 (3개 국어): ~20분

## 로깅

`monitor/pipeline_logger.py`를 사용하여 전 과정을 JSONL로 기록합니다:

- 각 스킬 시작/완료 이벤트
- CEO 게이트 결정
- 에러 발생 시 에러 로그
- 배치 완료 시 요약 메트릭

## 참조

- `ShortsFactory_Agent/.claude/skills/shorts-factory/SKILL.md` — 기반 오케스트레이터 패턴
- `monitor/pipeline_logger.py` — JSONL 로거
- `pipeline/queue/batch_status.json` — 배치 진행률
