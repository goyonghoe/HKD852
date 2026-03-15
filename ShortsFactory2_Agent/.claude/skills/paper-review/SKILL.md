---
name: paper-review
description: "논문 쇼츠 YouTube 정책 준수 + 학술 정확성 + 품질 검증 게이트"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
recommended-model: opus
model-reason: "정책 준수 + 학술 정확성 판단은 Opus의 비판적 분석 능력이 필수"
argument-hint: "--episode 'paper_ep019' 또는 --all"
---

# /paper-review — 정책 + 학술 정확성 + 품질 검증

## 역할

논문 쇼츠의 YouTube 2026 AI 콘텐츠 정책 준수, 학술 정확성, 콘텐츠 품질을 검증하여
PASS / REVISE / REJECT 판정을 내립니다.

## YouTube 2026 정책 핵심 (2025년 7월 15일 시행)

### 수익화 가능 조건

- AI를 **도구**로 사용하되, AI가 **전체 창작 프로세스**를 대체하면 안 됨
- 크리에이터의 고유 관점, 해석, 스토리텔링이 포함되어야 함
- 실질적 변형(substantial transformation)이 있어야 함

### 비수익화 대상

- 텍스트 읽기만 하는 TTS 영상 (크리에이터 기여 없음)
- 대량 생산 템플릿 콘텐츠 (최소 변형 반복)
- 이미지 슬라이드쇼 (서사 없음)
- 논문 초록 그대로 읽기

## 검증 체크리스트 (8항목)

각 항목을 1~10점으로 채점합니다:

| #   | 항목                | 기준                                           | 최소 통과 |
| --- | ------------------- | ---------------------------------------------- | --------- |
| 1   | **출처 인용**       | DOI/저널/저자가 metadata.description에 명시    | 8점       |
| 2   | **학술 정확성**     | key_finding이 원 논문과 일치, 데이터 왜곡 없음 | 9점       |
| 3   | **실질적 변형**     | 초록 읽기가 아닌 독자적 해석/비유/스토리       | 8점       |
| 4   | **AI 오인 방지**    | 실제 인물/사건으로 오해 소지 없음              | 9점       |
| 5   | **크리에이터 관점** | 고유 해석/비유/스토리가 포함됨                 | 7점       |
| 6   | **중복 회피**       | 이전 에피소드와 구조/주제 차별화               | 7점       |
| 7   | **훅 강도**         | 1~3초 내 시선 잡는 강한 오프닝                 | 7점       |
| 8   | **비주얼 일관성**   | Nano Banana Pro 스타일, 이미지에 텍스트 없음   | 7점       |

## 판정 기준

**총점 80점 만점:**

- **64점 이상** + 모든 항목 최소 통과 → **PASS**
- **48~63점** 또는 1~2개 항목 미달 → **REVISE** (수정사항 명시)
- **47점 이하** 또는 3개 이상 항목 미달 → **REJECT** (사유 명시)

## 검증 프로세스

1. `pipeline/scripts/paper_epNNN.json`에서 스크립트 로드
2. `paper_source` 블록 필수 존재 확인
3. 8항목 체크리스트 순차 평가
4. 이전 에피소드들과의 유사도 체크 (중복 검출):
   - `pipeline/scripts/paper_ep*.json`에서 hook + body 구조 비교
5. 렌더링 파일 존재 시 ffprobe로 기본 검증 (길이, 해상도)
6. 판정 + 상세 피드백 출력

## 출력 형식

파일: `pipeline/analytics/review/paper_epNNN.yaml`

```yaml
episode_id: "paper_ep019"
review_date: "2026-02-27"
verdict: "PASS"
scores:
  source_citation: 9
  academic_accuracy: 9
  substantial_transformation: 8
  ai_misrepresentation_free: 10
  creator_perspective: 8
  uniqueness: 8
  hook_strength: 8
  visual_consistency: 9
total_score: 69
feedback: "학술 정확성 우수. 출처 명시 완벽. 크리에이터 관점의 비유가 효과적."
revise_items: []
```

## REVISE 판정 시

수정이 필요한 항목을 구체적으로 명시합니다:

```yaml
revise_items:
  - field: "script.hook"
    issue: "훅이 약함 — 구체적 수치나 반전 요소 추가 필요"
    suggestion: "'8천 명을 조사했더니, 혼밥하는 남자가...' 형태로 변경"
  - field: "metadata.description"
    issue: "DOI 누락"
    suggestion: "출처 인용에 DOI 추가"
```

## --all 모드

`--all` 사용 시 `pipeline/scripts/paper_ep*.json` 전체를 순회하며
아직 리뷰가 없는 에피소드만 검증합니다 (기존 리뷰 파일이 있으면 스킵).

## 참조

- `pipeline/scripts/paper_ep*.json` — 스크립트 원본
- `pipeline/analytics/review/` — 리뷰 결과 저장 디렉토리
- `ShortsFactory_Agent/.claude/skills/shorts-review/SKILL.md` — 기반 패턴
