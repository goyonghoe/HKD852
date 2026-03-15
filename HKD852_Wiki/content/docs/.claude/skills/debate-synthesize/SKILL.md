---
name: debate-synthesize
description: "다관점 프로필 분석을 종합하여 합의 권고안 도출"
user-invocable: true
argument-hint: "[분석 대상 경로] [에이전트명 (선택)]"
allowed-tools: Read, Write, Glob, Grep
recommended-model: opus
model-reason: "다관점 종합에 Opus의 깊은 추론 필수"
---

# /debate-synthesize — 다관점 종합

## 목적

하나의 에이전트 내 여러 프로필이 분석한 결과를 종합하여 합의 권고안을 도출합니다.

## 적용 대상

| 에이전트         | 프로필 수 | 프로필 관점                  |
| ---------------- | --------- | ---------------------------- |
| GameDev_Agent    | 3         | 성능, 보안, 유지보수         |
| Shield_Agent     | 3         | 공격자, 규제당국, 유저       |
| RedTeam_Agent    | 4         | 기술, 시장, UX, 윤리         |
| QATest_Agent     | 3         | 캐주얼유저, 파워유저, 접근성 |
| GameDesign_Agent | 다수      | 시장, 밸런스, UX, 수익화, PD |

## 절차

### Step 1: 프로필 분석 수집

대상 에이전트의 프로필 `.md` 파일을 읽고, 각 관점에서 대상 산출물을 분석합니다.

각 프로필별 출력:

```markdown
### [프로필명] 관점

**판정**: PASS / WARN / FAIL
**핵심 발견**: [1-3개]
**근거**: [구체적 증거]
```

### Step 2: 합의점 식별

**전원 동의** 항목을 추출합니다.

- 모든 프로필이 PASS인 영역
- 모든 프로필이 동일하게 지적한 문제

### Step 3: 긴장점 식별

**의견 충돌** 영역을 추출합니다.

- 한 프로필 PASS, 다른 프로필 FAIL
- 같은 항목에 상반된 판단

### Step 4: 긴장점 해소

각 긴장점에 대해:

1. **양측 주장 정리** — 각 관점의 논거
2. **증거 평가** — 어느 쪽이 더 강한 근거를 가지는가?
3. **해소안 제시** — 양립 가능한 해결책 또는 우선순위 결정

### Step 5: 합의 권고안 도출

## 출력 형식

```markdown
## Debate Synthesis Report

**대상**: [산출물명]
**참여 프로필**: [프로필 목록]
**종합 판정**: APPROVE / CONDITIONAL / REJECT

### 합의점 (전원 동의)

| 항목    | 판정 | 설명             |
| ------- | ---- | ---------------- |
| [항목1] | PASS | [전원 동의 이유] |

### 긴장점 (의견 충돌)

| 항목    | 프로필 A 주장 | 프로필 B 주장 | 해소안   |
| ------- | ------------- | ------------- | -------- |
| [항목1] | [A 주장]      | [B 주장]      | [해소안] |

### 합의 권고안

1. [최우선 권고] — 근거: [합의/긴장 해소 결과]
2. [차순위 권고]
3. [추가 권고]

### 소수 의견 (기록 보존)

| 프로필     | 의견               | 이유               |
| ---------- | ------------------ | ------------------ |
| [프로필명] | [주류와 다른 의견] | [향후 참고할 근거] |

### 다음 단계

- [구체적 액션 아이템]
```

## 사용 예시

### GameDev_Agent 코드 리뷰 종합

```
/debate-synthesize Assets/Scripts/GameManager.cs GameDev_Agent
```

→ performance-engineer, security-coder, maintainability-advocate 3가지 관점 종합

### RedTeam_Agent 산출물 리뷰 종합

```
/debate-synthesize outputs/feature_spec.html RedTeam_Agent
```

→ tech-critic, market-skeptic, ux-destroyer, ethics-watchdog 4가지 관점 종합

### Shield_Agent 보안 검토 종합

```
/debate-synthesize GameDev_Agent/Assets/ Shield_Agent
```

→ attacker-mindset, regulator-mindset, player-advocate 3가지 관점 종합
