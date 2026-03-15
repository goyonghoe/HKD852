---
name: idea-plan
description: "7일 타임박스 실행 계획 수립"
user-invocable: true
allowed-tools: Read, Write
recommended-model: sonnet
model-reason: "구조적 계획 수립은 Sonnet 적합"
---

# /idea-plan — 실행 계획 수립

비판을 통과한 아이디어를 7일 내 런칭할 수 있는 실행 계획으로 변환합니다.

## 입력

- `pipeline/ideas/YYYY-MM-DD-decision.yaml` — 선택된 프로젝트
- 원본 아이디어 파일 참조

## 실행 절차

### 1. 프로젝트 ID 생성

형식: `proj-YYYYMMDD-{카테고리약어}`
예: `proj-20260208-chrome`, `proj-20260208-gumroad`

### 2. 제품 정의

```yaml
제품_정의:
  이름: "제품 이름"
  카테고리: "chrome-extension"
  플랫폼: "Chrome Web Store"
  가격: "$4.99/월"
  타겟_고객: "이메일 많이 쓰는 직장인"
  핵심가치: "이메일 제목 고민 시간 0으로"
  MVP_범위: "핵심 기능 1개만"
```

### 3. 7일 일정

| 일차  | 작업                                 | 산출물       | 도구        |
| ----- | ------------------------------------ | ------------ | ----------- |
| Day 1 | 프로젝트 구조 + 코어 로직            | 기본 코드    | Claude Code |
| Day 2 | UI/UX + 기능 완성                    | 작동하는 MVP | Claude Code |
| Day 3 | 테스트 + 버그 수정                   | 안정 버전    | Claude Code |
| Day 4 | 스토어 에셋 (아이콘, 설명, 스크린샷) | 마케팅 자료  | Claude Code |
| Day 5 | 최종 리뷰 (`/idea-review`)           | 검증 리포트  | Opus        |
| Day 6 | 수정 반영 (있을 경우)                | 최종 버전    | Claude Code |
| Day 7 | 런칭 (`/idea-launch`)                | 배포 완료    | Haiku       |

### 4. 기술 명세

```yaml
기술_명세:
  언어: "JavaScript"
  프레임워크: "없음 (Vanilla JS)"
  빌드: "zip 패키징"
  배포: "Chrome Web Store 개발자 대시보드"
  필요_API: "없음"
  비용: "0원"
```

### 5. 리스크 대응

비판 단계에서 지적된 약점에 대한 대응 방안:

```yaml
리스크_대응:
  - 약점: "유사 제품 존재"
    대응: "한국어 특화 + 더 심플한 UX"
  - 약점: "초기 트래픽"
    대응: "Reddit r/productivity에 론칭 포스트"
```

## 출력

`pipeline/plans/{project-id}/plan.yaml`:

```yaml
프로젝트: "proj-YYYYMMDD-chrome"
이름: "제품 이름"
원본_아이디어: "idea-YYYYMMDD-01"
시작일: "YYYY-MM-DD"
마감일: "YYYY-MM-DD" (7일 후)
상태: "planned"

제품_정의:
  ...

일정:
  Day1: "..."
  Day2: "..."
  ...

기술_명세:
  ...

리스크_대응:
  ...

산출물:
  - "pipeline/products/{project-id}/ (제품 파일)"
  - "pipeline/launches/{project-id}/launch-guide.md"
```

## 다음 단계

→ `/idea-build` (Day 1~4 실행)
