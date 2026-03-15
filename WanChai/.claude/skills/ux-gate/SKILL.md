---
name: ux-gate
description: 'About Face 12원칙 기반 UX 게이트 — 점수 미달 시 배포 차단 + 수정 루프'
user-invocable: true
allowed-tools: Read, Glob, Grep
model: opus
---

# /ux-gate — About Face 12원칙 UX 게이트

## 역할

About Face 4 (Alan Cooper) 12원칙으로 UI/UX를 정량 평가한다.
**B+ (80점) 미만이면 배포 차단**. 수정 목록을 생성하여 프로그래머에게 전달한다.

## 평가 체계

### 12원칙 채점 (각 10점, 총 120점 → 100점 환산)

| #   | 원칙              | MUST 항목수 | 배점 |
| --- | ----------------- | ----------- | ---- |
| 1   | 목표 지향 설계    | 2           | 10   |
| 2   | 페르소나          | 4           | 10   |
| 3   | 멘탈 모델         | 2           | 10   |
| 4   | Excise 제거       | 3           | 10   |
| 5   | Flow 보호         | 3           | 10   |
| 6   | 직접 조작         | 2           | 10   |
| 7   | 피드백 & 가시성   | 3           | 10   |
| 8   | 일관성            | 4           | 10   |
| 9   | 모드리스 인터랙션 | 2           | 10   |
| 10  | 오류 예방         | 2           | 10   |
| 11  | 앱 포스처         | 3           | 10   |
| 12  | 점진적 공개       | 2           | 10   |

### 채점 기준 (각 원칙 내)

- MUST 항목 전부 충족 + SHOULD 2개 이상: **10점 (A)**
- MUST 항목 전부 충족 + SHOULD 1개: **8점 (B)**
- MUST 항목 전부 충족: **7점 (B-)**
- MUST 1개 미충족: **5점 (C)**
- MUST 2개 이상 미충족: **3점 (D)**
- MUST 전부 미충족: **1점 (F)**

### 등급 환산 (120점 만점 → 100점)

```
점수 = (합계 / 120) × 100
A+: 95+  A: 90+  A-: 85+
B+: 80+  ← 통과 기준  B: 75+  B-: 70+
C+: 65+  C: 60+  C-: 55+
D: 50+   F: 50 미만
```

**B+ (80점) 미만 = UX-GATE:FAIL → 배포 차단**

---

## 평가 절차

### Phase 1: 코드 기반 정량 검증

#### 1-1. 터치 타겟 검증 (원칙 2: 페르소나)

```bash
grep -rn "setInteractive\|setSize\|hitArea\|new.*Rectangle" src/scenes/ src/ui/
```

- 모든 인터랙티브 요소 ≥ 48×48dp 확인
- **FAIL**: 48dp 미만 요소 발견 시

#### 1-2. 폰트 크기 검증 (원칙 2, 8: 페르소나/일관성)

```bash
grep -rn "fontSize\|setFontSize" src/scenes/ src/ui/
```

- 최소 14px, 본문 16px 이상
- 폰트 사이즈 종류 ≤ 8종 (체계적)
- **FAIL**: 14px 미만 또는 사이즈 10종 초과

#### 1-3. 버튼 피드백 검증 (원칙 7: 피드백)

```bash
grep -rn "scale.*1\.\|setScale\|pointerover\|pointerout" src/ui/ButtonFactory.ts src/scenes/
```

- hover: scale ≥ 1.05
- press: scale ≤ 0.95
- **FAIL**: 피드백 없거나 인지 불가 수준 (1.02 이하)

#### 1-4. 색상 일관성 (원칙 8: 일관성)

```bash
grep -rn "0x[0-9a-fA-F]\{6\}" src/scenes/ src/ui/ --include="*.ts"
```

- colors.ts 외부 hex 리터럴 = 0건
- **FAIL**: 1건 이상

#### 1-5. 코너 라디우스 일관성 (원칙 8)

```bash
grep -rn "radius\|Rounded" src/ui/ src/scenes/ src/config/
```

- RETRO.radius 값 확인 (가이드: 12-24px)
- **FAIL**: 8px 이하 또는 값 불일치

#### 1-6. 버튼 위치 존 검증 (원칙 2, 4)

```bash
grep -rn "createButton\|ButtonFactory" src/scenes/
```

- 주요 CTA y좌표 ≥ 화면높이×2/3 (하단 1/3)
- **FAIL**: 주요 CTA가 상단 2/3에 위치

#### 1-7. 씬 전환 검증 (원칙 4, 5)

```bash
grep -rn "fadeIn\|fadeOut\|fade\|scene.start" src/scenes/
```

- 모든 씬 전환에 fade 효과 존재
- **FAIL**: fade 없는 scene.start

#### 1-8. 오류 예방 검증 (원칙 10)

```bash
grep -rn "disabled\|canAfford\|canPurchase\|setAlpha.*0\.[34]" src/scenes/ src/ui/
```

- 골드 부족 시 구매 버튼 비활성화
- 최대 레벨 시 시각적 잠금
- **FAIL**: 비활성화 로직 없음

#### 1-9. 스크롤/오버플로 검증 (원칙 2, M-016)

```bash
grep -rn "DragScroll\|enableDragScroll\|scrollable" src/scenes/
```

- 동적 리스트 씬에 DragScroll 적용 여부
- 콘텐츠 총 높이 > GAME_HEIGHT 시 스크롤 필수
- **FAIL**: 오버플로 가능 리스트에 스크롤 없음

#### 1-10. 모드 시각 표시 검증 (원칙 9)

```bash
grep -rn "phase\|GamePhase\|overlay\|modal" src/scenes/RunScene.ts src/ui/
```

- 각 모드(playing/levelup/paused/shop/gameover/stage_clear) 진입 시 시각 변화
- **FAIL**: 모드 전환 시각 표시 없음

### Phase 2: 원칙별 종합 채점

각 원칙별로 MUST/SHOULD 항목을 `design/reference/about-face-ux-principles.md` 체크리스트 기준으로 채점.

### Phase 3: 결과 출력

#### PASS (B+ 이상)

```
UX-GATE:PASS (Score: 82/100, Grade: B)

## 원칙별 점수
| # | 원칙 | 점수 | 등급 | MUST |
|---|------|------|------|------|
| 1 | 목표 지향 | 8/10 | B | 2/2 ✅ |
...

## 강점
- ...

## 개선 권고 (SHOULD 미충족)
- ...
```

#### FAIL (B+ 미만)

```
UX-GATE:FAIL (Score: 58/100, Grade: C)
⛔ 배포 차단. 아래 MUST 위반 항목 수정 후 재평가 필요.

## MUST 위반 목록 (수정 필수)
| # | 파일:라인 | 원칙 | 문제 | 수정 방법 |
|---|----------|------|------|----------|
| 1 | PauseOverlay.ts:45 | P2 | 볼륨 세그먼트 28×24px | 48×48dp 이상으로 |
...

## 수정 후 /ux-gate 재실행
```

---

## 레드팀 검증 레이어

PASS 후에도 레드팀이 추가 검증:

1. **플레이어 관점 공격**: "이 UI를 처음 보는 사람이 3초 안에 이해할 수 있는가?"
2. **경쟁작 비교**: "이 수준의 UI가 앱스토어에서 경쟁력이 있는가?"
3. **엣지 케이스**: "화면 회전, 저사양 기기, 색약 사용자에게 문제 없는가?"

레드팀 REJECT 시 추가 수정 루프.

---

## 자율 핑퐁 파이프라인 (Agent Teams 모드)

`/ux-polish` 스킬에서 호출 시 자동 루프:

```
[UI Designer] /ux-gate 평가
    → FAIL → [Programmer] 수정 구현
        → [UI Designer] /ux-gate 재평가
            → FAIL → [Programmer] 재수정
            → PASS → [RedTeam] 적대적 리뷰
                → REJECT → [Programmer] 재수정 → [UI Designer] 재평가
                → APPROVE → 배포 승인
```

최대 루프 3회. 3회 연속 FAIL 시 CEO 에스컬레이션.

---

## 규칙

- UX-GATE:PASS (B+ 이상) 없이 `/pg-deploy` 실행 금지
- MUST 위반 = FAIL (배포 차단)
- SHOULD 미충족 = WARN (배포 가능, 권고)
- 경험 설계서(`design/ux/*.md`) 없으면 FAIL (설계서 먼저)
- 결과를 SESSION_LOG.md에 기록
