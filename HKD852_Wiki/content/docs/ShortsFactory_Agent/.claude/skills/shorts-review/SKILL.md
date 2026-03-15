---
name: shorts-review
description: "YouTube 2026 정책 준수 + 품질 검증 게이트"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: opus
model-reason: "정책 준수 판단은 Opus의 비판적 분석 능력이 필수"
argument-hint: "--episode 'ep001' 또는 --all"
---

# /shorts-review — 정책 준수 + 품질 검증

## 역할

렌더링된 YouTube Shorts의 YouTube 2026 AI 콘텐츠 정책 준수 여부를 검증하고,
콘텐츠 품질을 평가하여 PASS / REVISE / REJECT 판정을 내립니다.

## YouTube 2026 정책 핵심 (2025년 7월 15일 시행)

### 수익화 가능 조건

- AI를 **도구**로 사용하되, AI가 **전체 창작 프로세스**를 대체하면 안 됨
- 크리에이터의 고유 관점, 해석, 스토리텔링이 포함되어야 함
- 실질적 변형(substantial transformation)이 있어야 함

### 비수익화 대상

- 텍스트 읽기만 하는 TTS 영상 (크리에이터 기여 없음)
- 대량 생산 템플릿 콘텐츠 (최소 변형 반복)
- 이미지 슬라이드쇼 (서사 없음)
- 웹사이트 텍스트 그대로 읽기
- AI 아바타 영상 (사람 개입 제로)

### 공개 의무

- AI 합성 콘텐츠가 실제 사람/장소/사건으로 오인될 수 있으면 라벨 필수

## 검증 체크리스트 (7항목)

각 항목을 1~10점으로 채점합니다:

| #   | 항목                | 기준                                     | 최소 통과 |
| --- | ------------------- | ---------------------------------------- | --------- |
| 1   | **원본 출처**       | 팩트/데이터의 출처가 메타데이터에 기재됨 | 7점       |
| 2   | **실질적 변형**     | 단순 복제/재조합이 아닌 새로운 구성      | 8점       |
| 3   | **AI 오인 방지**    | 실제 인물/사건으로 오해 소지 없음        | 9점       |
| 4   | **크리에이터 관점** | 고유 해석/비유/스토리가 포함됨           | 8점       |
| 5   | **중복 회피**       | 이전 에피소드와 구조적 차별화            | 7점       |
| 6   | **훅 강도**         | 1~3초 내 시선 잡는 강한 오프닝           | 7점       |
| 7   | **정보 정확성**     | 팩트가 검증 가능하고 정확함              | 8점       |

**총점 기준:**

- 70점 이상 + 모든 항목 최소 통과 → **PASS**
- 50~69점 또는 1~2개 항목 미달 → **REVISE** (수정사항 명시)
- 49점 이하 또는 3개 이상 항목 미달 → **REJECT** (사유 명시)

## 검증 프로세스

1. `pipeline/scripts/{episode-id}.json`에서 스크립트 로드
2. `pipeline/rendered/{episode-id}.mp4`의 존재 확인 (ffprobe)
3. 7항목 체크리스트 순차 평가
4. 이전 에피소드들과의 유사도 체크 (중복 검출)
5. 판정 + 상세 피드백 출력

## 출력 형식

```yaml
# pipeline/analytics/review/{episode-id}.yaml
episode_id: "ep_20260218_001"
review_date: "2026-02-18"
verdict: "PASS" # PASS | REVISE | REJECT
scores:
  source_citation: 8
  substantial_transformation: 9
  ai_misrepresentation_free: 10
  creator_perspective: 8
  uniqueness: 8
  hook_strength: 9
  factual_accuracy: 8
total_score: 70
feedback: "강한 훅과 명확한 크리에이터 관점. 출처 URL 추가 권장."
revise_items: [] # REVISE일 경우 수정 필요 항목
```

## REVISE 판정 시

수정이 필요한 항목을 구체적으로 명시합니다:

```yaml
revise_items:
  - field: "script.hook"
    issue: "훅이 약함 — 구체적 수치나 반전 요소 추가 필요"
    suggestion: "'Most people waste $200/mo on apps they don't need' 형태로 변경"
  - field: "metadata.description"
    issue: "출처 URL 누락"
    suggestion: "참고 자료 링크 추가"
```
