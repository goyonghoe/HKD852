---
name: quality-gate
description: "모든 에이전트 산출물에 대한 통합 품질 검증 게이트"
user-invocable: true
allowed-tools: Read, Glob, Grep
recommended-model: opus
model-reason: "비판적 분석과 다차원 평가 — Opus 필수"
---

# 통합 Quality Gate

> 모든 에이전트의 최종 산출물을 동일 기준으로 평가하는 공유 서비스

## 역할

기존에 각 에이전트가 독립적으로 수행하던 QA를 **통합 기준**으로 대체:
- GameDesign `/pd-review` → Quality Gate로 위임 가능
- PT_Agent `/pt-redteam` → Quality Gate로 위임 가능
- Income_Factory `/idea-review` → Quality Gate로 위임 가능

## 실행 절차

### Step 1: 산출물 식별

사용자가 지정한 파일 또는 가장 최근 산출물을 읽는다:
- `Read`로 대상 파일 내용 확인
- 파일 형식 자동 감지 (HTML, Markdown, YAML, SVG, JSON)

### Step 2: 컨텍스트 파악

산출물이 어느 에이전트에서 생성되었는지 판단:
- 파일 경로 기반: `GameDesign_Agent/output/` → 게임 기획 리포트
- 파일 경로 기반: `PT_Agent/outputs/` → 프레젠테이션
- 파일 경로 기반: `Income_Factory/pipeline/` → 수익 아이디어/제품
- 파일 경로 기반: `team-kowloon/3_ai_output/` → 아트 스펙
- 기타: 범용 평가 기준 적용

### Step 3: CFMC 매트릭스 평가

4가지 기준으로 평가 (각 25점, 총 100점):

#### C — Clarity (명확성) 25점
- 대상 독자가 즉시 이해할 수 있는가?
- 핵심 메시지가 명확한가?
- 전문 용어가 적절히 설명되었는가?
- 논리적 흐름이 자연스러운가?

#### F — Feasibility (실현성) 25점
- 제안/설계가 기술적으로 가능한가?
- 리소스(시간, 인력, 비용) 제약 내인가?
- 의존성이 명시되고 해결 가능한가?
- 현실적인 타임라인인가?

#### M — Market Fit (시장 적합성) 25점
- 타겟 사용자/고객이 명확한가?
- 경쟁 대비 차별점이 있는가?
- 수요가 실제로 존재하는가?
- 타이밍이 적절한가?

#### C — Completeness (완성도) 25점
- 필수 요소가 모두 포함되었는가?
- 데이터/근거가 충분한가?
- 빠진 섹션이나 TODO가 없는가?
- 최종 산출물로 바로 사용 가능한가?

### Step 4: 도메인별 보너스 체크

에이전트별 추가 체크리스트:

**GameDesign 산출물:**
- [ ] 밸런스 수치에 근거가 있는가?
- [ ] 경쟁작 벤치마킹이 포함되었는가?
- [ ] 리텐션 영향도가 분석되었는가?

**GameDev 산출물:**
- [ ] C# 코드가 컴파일 가능한가?
- [ ] Unity 코딩 컨벤션을 준수하는가?
- [ ] 유닛 테스트가 포함되었는가?
- [ ] 모바일 성능 고려 (GC Alloc, 드로우콜)?
- [ ] 보안 취약점이 없는가? (하드코딩 시크릿, 클라이언트 검증만)

**PT_Agent 산출물:**
- [ ] 슬라이드 수가 적정한가? (10~15장)
- [ ] 시각적 일관성이 유지되는가?
- [ ] 핵심 메시지가 3개 이내로 압축되었는가?

**Income_Factory 산출물:**
- [ ] 7일 내 런칭 가능한가?
- [ ] 수익 모델이 구체적인가?
- [ ] 법적 리스크가 없는가?

**team-kowloon 산출물:**
- [ ] 아트 스펙이 17개 카테고리를 커버하는가?
- [ ] 해상도/포맷 기준이 명시되었는가?
- [ ] 우선순위가 지정되었는가?

**DevOps 산출물:**
- [ ] CI/CD 설정이 문법적으로 올바른가?
- [ ] 시크릿/크레덴셜이 하드코딩되지 않았는가?
- [ ] 롤백 절차가 포함되었는가?
- [ ] 플랫폼별 빌드가 모두 성공하는가?

**QATest 산출물:**
- [ ] 테스트 커버리지가 핵심 기능을 포함하는가?
- [ ] 플랫폼 정책 체크리스트가 완전한가?
- [ ] 심각도/우선순위가 적절한가?

### Step 5: 판정

| 등급 | 점수 | 판정 | 액션 |
|------|------|------|------|
| A | 90-100 | **PASS** | 즉시 사용 가능 |
| B | 80-89 | **PASS (minor)** | 사소한 개선 권장, 사용 가능 |
| C | 70-79 | **REVISE** | 피드백 기반 수정 필요 |
| D | 60-69 | **REVISE (major)** | 대폭 수정 필요 |
| F | 0-59 | **FAIL** | 재작업 권장 |

### Step 5.5: 자동 보안/레드팀 체인

PASS 판정 시 자동으로 후속 검증을 트리거합니다:

| 판정 | 점수 | 자동 트리거 |
|------|------|-----------|
| A (PASS) | 90-100 | → Shield_Agent `/security-audit` + RedTeam_Agent `/red-review` |
| B (PASS minor) | 80-89 | → Shield_Agent `/security-audit` (코드/데이터인 경우) |
| C (REVISE) | 70-79 | 트리거 없음 — 수정 후 재평가 |
| D (REVISE major) | 60-69 | 트리거 없음 — 수정 후 재평가 |
| F (FAIL) | 0-59 | 트리거 없음 — 재작업 |

**체인 흐름:**
```
Quality Gate PASS (80+)
    ↓
Shield_Agent /security-audit [코드/데이터 산출물]
    ├── SECURITY_HOLD → 배포 차단, CEO 에스컬레이션
    └── CLEAR → 계속
    ↓
RedTeam_Agent /red-review [점수 90+ 산출물]
    ├── REJECT → 배포 차단, CEO 에스컬레이션
    ├── CONDITIONAL → 수정 후 재검토 (1회)
    └── APPROVE → 최종 승인
```

### Step 6: 출력 형식

```markdown
## Quality Gate 평가 결과

**대상**: [파일명]
**출처**: [에이전트명]
**등급**: [A/B/C/D/F] ([점수]/100)
**판정**: [PASS / REVISE / FAIL]

### CFMC 점수
| 기준 | 점수 | 평가 |
|------|------|------|
| Clarity | /25 | ... |
| Feasibility | /25 | ... |
| Market Fit | /25 | ... |
| Completeness | /25 | ... |

### 강점
- ...

### 개선 필요
- ...

### 도메인 체크리스트
- [x] ...
- [ ] ...
```
