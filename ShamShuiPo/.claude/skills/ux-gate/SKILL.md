---
name: ux-gate
description: "About Face 원칙 기반 UI/UX 품질 게이트 — 배포 전 필수 검증"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
model: opus
---

# UX Gate — About Face UI/UX 검증

About Face 4 원칙 기반으로 UI 코드를 자동 평가합니다. **UI 변경이 포함된 배포 전 필수 실행.**

## 검증 절차

### Step 1: 레퍼런스 로드

```
Read design/reference/about-face-ux-principles.md
Read design/reference/ui-ux-guideline.md
Read .claude/rules/mistake-registry.md (M-011, M-012, M-013, M-016 참조)
```

### Step 2: 자동 검사 항목 (12개)

| #   | 항목                    | 검증 방법                                   | 등급 기준    |
| --- | ----------------------- | ------------------------------------------- | ------------ |
| 1   | 터치 타겟 48dp          | `Grep` setInteractive 요소 크기 확인        | < 48dp → F   |
| 2   | 최소 폰트 16px          | `Grep` fontSize 전수 조사, 14px 캡션만 허용 | < 14px → F   |
| 3   | HUD 가장자리 마진 16px+ | 좌표 검사: x < 16, x > 704, y < 16          | 위반 → C     |
| 4   | 인접 요소 간격 8px+     | 인접 요소 좌표 차이 계산                    | 위반 → C     |
| 5   | 무기 슬롯-조이스틱 겹침 | 하단 UI 배치 영역 확인                      | 겹침 → F     |
| 6   | 레벨업 선택지 3개 이하  | 레벨업 UI 카드 수 확인                      | > 3 → C      |
| 7   | 버튼 press 피드백       | ButtonFactory + pointerdown 핸들러 확인     | 누락 → C     |
| 8   | 코너 라디우스 일관성    | fillRoundedRect 호출 확인                   | 불일치 → B   |
| 9   | 색상 colors.ts 집중     | hex 매직 넘버 grep                          | 위반 → C     |
| 10  | 폰트 크기 체계          | 48/32/22/20/16/14/13/12px 외 사용           | 위반 → B     |
| 11  | 뷰포트 오버플로         | 동적 리스트 총 높이 > 1280 확인             | 오버플로 → F |
| 12  | 패널 경계 오버플로      | 자식 요소가 부모 패널 밖 렌더링             | 위반 → C     |

### Step 3: 수동 검토 항목 (6개)

| #   | 원칙        | 체크 포인트                                    |
| --- | ----------- | ---------------------------------------------- |
| A   | 목표 지향   | 각 씬이 "플레이어 감정 목표"를 달성하는가?     |
| B   | 멘탈 모델   | Kill→Collect→Upgrade 루프가 UI에서 직관적인가? |
| C   | 몰입 보호   | 전투 중 불필요한 모달 차단이 없는가?           |
| D   | 피드백 계층 | 처치/피격/레벨업 시 시청각 피드백 존재하는가?  |
| E   | 점진적 공개 | 첫 플레이 시 정보 과잉이 아닌가?               |
| F   | 일관성      | 버튼 스타일/위치가 씬 간 통일되어 있는가?      |

### Step 4: 등급 산출

```
A (90-100): 모든 MUST 통과 + SHOULD 80% 이상
B (75-89):  모든 MUST 통과 + SHOULD 50% 이상
C (60-74):  MUST 1-2건 위반 또는 SHOULD 50% 미만
F (0-59):   MUST 3건 이상 위반
```

### Step 5: 결과 출력

```markdown
## 🎯 UX Gate 평가 결과

### 등급: [A/B/C/F]

### 점수: [0-100]

### 자동 검사 결과

| #   | 항목 | 결과 | 상세 |
| --- | ---- | ---- | ---- |

### 수동 검토 결과

| #   | 원칙 | 결과 | 상세 |
| --- | ---- | ---- | ---- |

### 위반 항목 (수정 필요)

1. [위반 내용] — 파일:라인 — 수정 방법

### 판정

- **PASS** (B 이상): 배포 허용
- **FAIL** (C 이하): 위반 항목 수정 후 재검증 필수
```

## 파이프라인 연동

```
UI 작업 완료 → /ux-gate 실행 → PASS → /pg-build-check → 배포
                              → FAIL → 위반 항목 수정 → /ux-gate 재실행
```

## 관련 문서

- `design/reference/about-face-ux-principles.md` — 12개 원칙 상세
- `design/reference/ui-ux-guideline.md` — UI 구현 가이드라인
- `.claude/rules/mistake-registry.md` — M-011~M-016 UX 관련 실수
