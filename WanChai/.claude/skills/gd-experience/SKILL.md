---
name: gd-experience
description: '기대 플레이 경험 설계 — 수치 설계 이전 단계'
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: opus
---

# /gd-experience — 플레이 경험 설계

## 역할

Game Designer로서 수치 설계(gd-mechanic)에 앞서 플레이어가 느껴야 할 경험을 먼저 정의합니다.

## 언제 사용하나요?

- 새 기능/씬/화면 설계를 시작하기 전
- `/gd-mechanic` 실행 전 필수 선행 단계
- 핸드오프 파이프라인 Step 1

## 절차

### 1. 기존 컨텍스트 파악

- `design/reference/ui-ux-guideline.md` — UX 원칙 확인
- `design/reference/art-style-guide.md` — 시각 표준 확인
- `design/ux/` — 기존 경험 설계서 확인 (패턴 파악)
- `design/status.json` — 현재 진행 상태 확인

### 2. 경험 설계서 작성

출력 파일: `design/ux/{feature}-experience.md`

#### 필수 섹션

**Scene UX Goals (씬 UX 목표)**

- 이 화면/기능에서 플레이어가 느껴야 할 핵심 감정 3가지
- "플레이어는 \_\_\_를 느낀다" 형식으로 서술
- 목표 달성 여부를 측정할 기준 명시

**Font Hierarchy (폰트 위계)**

- H1: 제목급 (최소 px 지정)
- H2: 소제목급 (최소 px 지정)
- Body: 본문 (최소 px 지정)
- Caption: 보조 텍스트 (최소 px 지정)
- 모든 값은 정수 px, 720x1280 기준

**Touch Targets (터치 영역)**

- 각 인터랙티브 요소별 최소 크기 (최소 48x48dp)
- 주요 액션 버튼 크기 명시
- 위험 액션(삭제, 포기 등)은 분리 배치 규칙 명시

**Layout Zones (레이아웃 존)**

- Zone A (상단 정보): y=0~280 — 무엇이 표시되는가
- Zone B (메인 컨텐츠): y=280~850 — 핵심 인터랙션 영역
- Zone C (주요 액션): y=850~1240 — 주 CTA 버튼 위치
- 각 존에 배치되는 UI 요소 목록

**Emotional Arc (감정 곡선)**

- 진입 시: 첫 인상, 로딩 애니메이션, 기대감
- 진행 중: 집중, 긴장, 성취 피드백 타이밍
- 이탈 시: 만족감, 다음 액션으로의 자연스러운 유도
- 실패 시: 좌절 최소화, 재시도 유도 방식

**Acceptance Criteria (승인 기준)**

- [ ] 체크리스트 형식으로 5개 이상
- UX-Gate에서 검증 가능한 구체적 수치 포함
- 예: "주요 CTA 버튼은 Zone C(y>=850)에 위치한다"
- 예: "모든 폰트는 최소 16px 이상이다"
- 예: "터치 타겟은 최소 48x48dp 이상이다"

### 3. 검토

- 수치 기준이 `design/reference/ui-ux-guideline.md`와 일치하는지 확인
- Acceptance Criteria가 UX-Gate에서 자동 검증 가능한지 확인
- 감정 곡선이 게임의 전체 톤앤매너와 일치하는지 확인

### 4. 상태 업데이트

`design/status.json`에 해당 기능의 `uxStatus: "experience-defined"` 추가

## 산출물 예시

```
design/ux/result-screen-experience.md
design/ux/tutorial-experience.md
design/ux/conveyor-interaction-experience.md
```

## 다음 단계

경험 설계서 완성 후 → `/gd-mechanic` 실행 (Step 2)

## 규칙

- 수치보다 경험을 먼저 정의 (why before how)
- 모든 Acceptance Criteria는 측정 가능해야 함
- UX-Gate가 검증할 수 있는 구체적 픽셀/크기 값 포함 필수
