---
name: ux-gate
description: 'UX 경험 설계서 대비 UI 검증 — 배포 차단 가능'
user-invocable: true
allowed-tools: Read, Glob, Grep
model: opus
---

# /ux-gate — UX 경험 게이트

## 역할

UI Designer로서 경험 설계서(`gd-experience` 산출물)에 대비해 실제 구현을 검증합니다. 핸드오프 파이프라인 Step 7이며 UX-GATE:REVISE 시 배포를 차단합니다.

## 언제 사용하나요?

- `/pg-wiring-check` 통과 후, `/pg-deploy` 이전
- 새 씬 또는 UI 기능 구현 완료 시
- 배포 직전 품질 게이트

## 절차

### 1. 경험 설계서 로드

- `design/ux/` 내 해당 기능의 `*-experience.md` 파일 읽기
- Acceptance Criteria 섹션 추출
- 최소 폰트/터치 타겟/레이아웃 존 기준값 파악

```
예시:
- H1 최소: 32px
- H2 최소: 24px
- Body 최소: 16px
- 터치 타겟 최소: 48x48dp
- Zone C (주요 액션): y=850~1240
```

### 2. 폰트 크기 검증

```
grep -rn "fontSize\|font-size\|setFontSize" src/scenes/ src/ui/
```

- 각 `fontSize` 값 추출
- 경험 설계서 최솟값 대비 체크
- 기준 미달 → REVISE 목록에 추가

### 3. 터치 타겟 크기 검증

```
grep -rn "setSize\|setInteractive\|setDisplaySize\|\.width\|\.height" src/scenes/ src/ui/
```

- 인터랙티브 요소의 크기 값 추출
- 48x48dp 미만 → REVISE 목록에 추가
- 명시적 크기 없이 `setInteractive()` 단독 사용 → 경고

### 4. 레이아웃 존 검증

주요 액션(CTA) 버튼 위치 확인:

```
grep -rn "y\s*=\|\.y\s*=\|setPosition" src/scenes/ src/ui/
```

- 주요 CTA의 y 좌표가 Zone C(y=850~1240)에 위치하는지 확인
- Zone A/B에 주요 CTA 배치 시 → REVISE 목록에 추가

### 5. Acceptance Criteria 체크리스트 실행

경험 설계서의 각 AC 항목에 대해:

- [ ] 측정 가능한 항목 → 코드에서 값 추출하여 비교
- [ ] 구조적 항목 → 관련 컴포넌트 존재 여부 확인
- [ ] 감정/경험 항목 → 관련 애니메이션/피드백 구현 여부 확인

### 6. 결과 출력

#### PASS 케이스

```
UX-GATE:PASS
- 경험 설계서: design/ux/{feature}-experience.md
- 검증 항목: N개
- 폰트 기준 충족: 모두 통과
- 터치 타겟 기준 충족: 모두 통과
- Zone C 주요 액션: 확인됨
- AC 항목: N/N 통과
```

#### REVISE 케이스

```
UX-GATE:REVISE(list)
- [FAIL] ResultScene.ts:142 — 점수 텍스트 fontSize=12, 최소 16px 필요
- [FAIL] HeroButton — 터치 타겟 40x40, 최소 48x48dp 필요
- [FAIL] 재시작 버튼 y=420 — Zone B에 위치, Zone C(y>=850) 이동 필요
- [WARN] 애니메이션 피드백 — 매치 성공 시 이펙트 확인 불가 (정적 분석 한계)
```

### 7. REVISE 시 처리

- UX-GATE:REVISE 발생 시 `/pg-deploy` 진행 불가
- REVISE 목록을 Programmer 및 UI Designer에게 전달
- 수정 후 `/ux-gate` 재실행

## 규칙

- UX-GATE:PASS 없이 `/pg-deploy` 실행 금지 (배포 차단 권한)
- WARN은 배포 차단 안 함, FAIL은 차단
- 경험 설계서(`design/ux/*.md`)가 없는 경우 → UX-GATE:REVISE (설계서 먼저 작성)
- 결과를 SESSION_LOG.md에 기록:
  `[HH:MM] /ux-gate UX-GATE:PASS ({feature})`
  파일: `~/.claude/projects/-Users-yong-MainFolder-My-AI-Project-HKD852-WanChai/memory/SESSION_LOG.md`
