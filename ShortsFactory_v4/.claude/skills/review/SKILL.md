---
name: shorts-v4-review
description: "YouTube 정책 준수 + 품질 게이트 (7항목 검증)"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

# shorts-v4-review

YouTube 정책 준수 여부와 콘텐츠 품질을 7항목 체크리스트로 검증한다.
Opus 모델을 사용하여 비판적 분석을 수행한다.

## 파라미터

| 파라미터      | 필수 | 기본값 | 설명                    |
| ------------- | ---- | ------ | ----------------------- |
| `script_path` | 예   | —      | 스크립트 JSON 파일 경로 |
| `channel_id`  | 예   | —      | 대상 채널 ID            |

## 실행 절차

### Step 1: 스크립트 및 채널 프로파일 로드

```
pipeline/scripts/{episode_id}.json
channels/{channel_id}/profile.yaml
```

### Step 2: 7항목 품질 체크리스트 검증

각 항목을 PASS/WARN/FAIL로 평가한다:

| # | 항목             | 기준                                                      |
| - | ---------------- | --------------------------------------------------------- |
| 1 | 출처 명시        | 핵심 주장에 신뢰할 수 있는 출처가 있는가                  |
| 2 | 실질적 변형      | 단순 요약이 아닌 독자적 분석/관점이 포함되어 있는가       |
| 3 | AI 오인 방지     | AI 생성 콘텐츠임을 적절히 고지하는가                      |
| 4 | 크리에이터 관점  | 기계적 나열이 아닌 사람의 관점/해석이 느껴지는가          |
| 5 | 중복 회피        | 최근 30일 내 동일 채널에서 유사한 토픽을 다루지 않았는가  |
| 6 | 훅 강도          | 첫 3초 내 시청 지속을 유도하는 강력한 훅이 있는가         |
| 7 | 정보 정확성      | 수치, 사실관계, 인용이 정확한가                           |

### Step 3: 스크립트 프레임워크 검증

채널 프로파일의 `script_framework`에 따라 구조 준수 여부를 확인:

- **SUCCESS+Story**: 7개 요소(S-U-C-C-E-S-S)가 모두 포함되어 있는가
- **Lisa Cron+SUCCESS**: 구체적 인물/상황으로 시작하며 SUCCESS 구조를 따르는가

### Step 4: 추가 검증

- 총 duration이 채널 `max_duration` 이내인가
- `image_prompt`에 금지 요소(텍스트/숫자 렌더링)가 없는가
- TTS narration에 기호가 한글로 풀어써져 있는가
- 채널 `forbidden_topics`에 해당하지 않는가

### Step 5: 판정

**PASS**: 7항목 모두 PASS, 프레임워크 준수
**REVISE**: WARN 1개 이상 또는 경미한 수정 필요
**FAIL**: FAIL 1개 이상 또는 YouTube 정책 위반

## 입력

- `pipeline/scripts/{episode_id}.json` — 스크립트
- `channels/{channel_id}/profile.yaml` — 채널 프로파일
- `data/performance/{channel_id}/` — 최근 토픽 목록 (중복 체크용)

## 출력

리뷰 결과를 스크립트 JSON의 `review` 필드에 추가:

```json
{
  "review": {
    "verdict": "PASS|REVISE|FAIL",
    "reviewer": "shorts-v4-review",
    "reviewed_at": "ISO8601",
    "checklist": {
      "source_citation": {"status": "PASS", "note": ""},
      "substantial_transform": {"status": "PASS", "note": ""},
      "ai_disclosure": {"status": "PASS", "note": ""},
      "creator_perspective": {"status": "WARN", "note": "씬 3에서 기계적 나열 경향"},
      "duplicate_avoidance": {"status": "PASS", "note": ""},
      "hook_strength": {"status": "PASS", "note": ""},
      "factual_accuracy": {"status": "PASS", "note": ""}
    },
    "framework_check": "PASS",
    "revision_notes": ["씬 3의 나열을 스토리텔링으로 전환 필요"]
  }
}
```

## 에러 처리

- 스크립트 파일 미존재: 에러 반환
- 성과 데이터 미존재 (신규 채널): 중복 체크 항목 자동 PASS
- 프레임워크 미정의 채널: 프레임워크 검증 스킵 + 경고

## 채널 프로파일 참조

리뷰 기준은 채널 프로파일의 `script_framework`, `forbidden_topics`, `max_duration`을 반영한다.
