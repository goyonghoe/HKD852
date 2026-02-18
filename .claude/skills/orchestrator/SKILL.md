---
name: orchestrator
description: "작업을 분석하여 Agent Teams 사용 여부와 팀 구성을 자동 판단하고 실행합니다"
user-invocable: true
argument-hint: "[작업 설명]"
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, Task, Bash
recommended-model: sonnet
model-reason: "복합 판단 및 라우팅 — Sonnet 최적"
---

# HKD852 오케스트레이터

사용자의 요청을 분석하여 **자동으로** 최적의 실행 방식을 결정합니다.

## 판단 플로우

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 요청 분석                          │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. 복잡도 평가                                               │
│    - 단순 질문/단일 파일 수정 → 직접 처리                     │
│    - 다중 단계 필요 → 2단계로                                │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 병렬 처리 가능성 평가                                     │
│    - 순차 의존성 있음 → 기존 스킬 파이프라인                  │
│    - 독립적 병렬 가능 → 3단계로                              │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Agent Teams 비용 효율성 평가                              │
│    - 2개 이하 역할 → 기존 스킬/서브에이전트                   │
│    - 3개 이상 역할 + 협업 필요 → Agent Teams                 │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
              [실행 방식 결정]
```

## 판단 기준

### Agent Teams 사용 (자동 팀 구성)

다음 조건 중 **2개 이상** 충족 시:

| 조건 | 예시 |
|------|------|
| **독립적 병렬 작업 가능** | 리서치 + 디자인 + 검토 동시 진행 |
| **다양한 관점/전문성 필요** | 보안 + 성능 + UX 동시 분석 |
| **팀원 간 토론/피드백 유익** | 가설 검증, 아이디어 브레인스토밍 |
| **작업 범위가 큼** | 전체 시스템 리뷰, 대규모 리팩토링 |

### 기존 스킬 사용 (순차 파이프라인)

다음 조건에 해당 시:

| 조건 | 예시 |
|------|------|
| **순차 의존성 있음** | A 결과 → B 입력 → C 입력 |
| **같은 파일 수정 필요** | 단일 컴포넌트 개선 |
| **단순 작업** | 버그 수정, 문서 업데이트 |
| **비용 효율성 낮음** | 2명 이하로 충분 |

## 실행 절차

### 1단계: 요청 분석

사용자 요청: `$ARGUMENTS`

다음을 파악합니다:
- **목표**: 무엇을 달성하려 하는가?
- **범위**: 어느 에이전트/영역에 해당하는가?
- **복잡도**: 몇 단계가 필요한가?
- **병렬성**: 독립적으로 분리 가능한가?

### 2단계: 에이전트/역할 매핑

| 영역 | 해당 에이전트 | 사용 가능한 역할 |
|------|--------------|-----------------|
| 게임 기획 | GameDesign_Agent | 마켓분석가, 밸런스디자이너, UX어드바이저, 수익화전문가, PD리뷰어 |
| 게임 개발 | GameDev_Agent | 아키텍트, 성능엔지니어, 보안코더, 유지보수전문가 |
| 게임 QA | QATest_Agent | 캐주얼플레이어, 파워유저, 접근성테스터 |
| 아트 리소스 | team-kowloon | CTO, 아트리드, QA리드, 데이터매니저 |
| 프레젠테이션 | PT_Agent | 리서처, 콘텐츠설계자, 시각디자이너, 레드팀 |
| 수익화 | Income_Factory | 트렌드리서처, 스크립트작성자, 콘텐츠매니저 |
| 마케팅 | Marketing_Agent | ASO전문가, 소셜카피라이터, 런칭전략가 |
| 커뮤니티 | Community_Agent | 감성분석가, 콘텐츠라이터, 위기대응전문가 |
| 프로젝트관리 | PMO_Agent | 스프린트매니저, 리스크분석가, 로드맵설계자 |
| 보안 | Shield_Agent | 공격자관점, 규제관점, 유저관점 |
| 레드팀 | RedTeam_Agent | 기술비평, 시장회의, UX파괴, 윤리감시 |
| 현지화 | Translate_Agent | 번역, 문화적응, 검증 |
| CI/CD | DevOps_Agent | 빌드엔지니어, 배포매니저 |
| 성장전략 | Growth_Agent | 퍼널분석가, 온보딩전문가 |
| 영상 분석 | Video_Analyzer | 직접 처리 (단일 도구) |
| 인사 | HR_Agent | 조직도, 재조직 |

### 3단계: 실행 방식 결정 및 출력

#### Case A: 직접 처리
```yaml
판단_결과:
  실행_방식: "직접 처리"
  이유: "[판단 근거]"

실행:
  - [바로 작업 수행]
```

#### Case B: 기존 스킬 파이프라인
```yaml
판단_결과:
  실행_방식: "스킬 파이프라인"
  이유: "[판단 근거]"
  대상_에이전트: "[에이전트명]"

파이프라인:
  1. /[스킬1] - [목적]
  2. /[스킬2] - [목적]
  3. /[스킬3] - [목적]

실행:
  - [첫 번째 스킬 호출]
```

#### Case C: Agent Teams
```yaml
판단_결과:
  실행_방식: "Agent Teams"
  이유: "[판단 근거]"

팀_구성:
  리드: "[역할] - [담당]"
  팀원:
    - "[역할1]" - "[담당 업무]" - "[권장 모델]"
    - "[역할2]" - "[담당 업무]" - "[권장 모델]"
    - "[역할3]" - "[담당 업무]" - "[권장 모델]"

협업_방식: "[토론/병렬/혼합]"
계획_승인_필요: "[예/아니오]"

실행:
  - Agent Teams 생성 프롬프트 제시
```

## 자동 팀 구성 템플릿

### 게임 기획 분석
```
Create an agent team to analyze this game feature:
- Market analyst: 경쟁작 조사 및 시장 트렌드 분석
- Balance designer: 경제/성장 시스템 영향 모델링
- UX advisor: 플레이어 경험 및 리텐션 평가
Have them share findings and challenge each other's assumptions.
Require plan approval before any implementation recommendations.
```

### 프레젠테이션 제작
```
Create an agent team for this presentation:
- Researcher: 팩트체크 및 데이터 수집
- Content architect: 스토리 구조 및 메시지 설계
- Visual designer: 시각적 컨셉 및 레이아웃
Have them collaborate: researcher feeds facts to content, content guides visual.
```

### 코드 리뷰
```
Create an agent team to review this code:
- Security reviewer: 취약점 및 보안 이슈 점검
- Performance reviewer: 성능 병목 및 최적화 기회
- Quality reviewer: 테스트 커버리지 및 유지보수성
Have them each review independently, then debate findings.
```

### 디버깅/조사
```
Create an agent team to investigate this issue:
- Hypothesis A: [첫 번째 가설 담당]
- Hypothesis B: [두 번째 가설 담당]
- Devil's advocate: 각 가설 검증 및 반박
Have them debate like scientists - try to disprove each other.
```

### 릴리즈 위원회 (Go/No-Go 결정)
```
Create an agent team for release decision:
- QATest_Agent: 테스트 결과 요약 및 잔존 버그 평가
- Shield_Agent: 보안/컴플라이언스 최종 상태 보고
- Marketing_Agent: 시장 타이밍 및 준비 상태 평가
- Growth_Agent: 성장 지표 전망 및 퍼널 준비 상태
Have them each present their Go/No-Go recommendation with evidence.
Require CEO approval for final decision.
```

### 삼각 토론 (아키텍처/기술 결정)
```
Create an agent team for technical decision:
- Optimist: 제안의 장점과 기회 분석
- Pessimist: 리스크, 비용, 기술 부채 경고
- Realist: 현실적 실행 가능성과 타임라인 제시
Have them debate the proposal and reach a consensus recommendation.
```

### 보안 심층 분석
```
Create an agent team for security deep-dive:
- Shield_Agent (attacker): 공격자 관점에서 취약점 탐색
- Shield_Agent (regulator): 규제 관점에서 컴플라이언스 검증
- RedTeam_Agent: 적대적 관점에서 모든 발견 검증
Have Shield present findings first, then RedTeam tries to find what Shield missed.
```

## 예시 판단

### 예시 1: "로그인 버튼 색상 변경해줘"
```yaml
판단_결과:
  실행_방식: "직접 처리"
  이유: "단순 단일 파일 수정, 복잡도 낮음"
```

### 예시 2: "새 게임 기능 BattlePass 기획 검토해줘"
```yaml
판단_결과:
  실행_방식: "스킬 파이프라인"
  이유: "순차적 분석 필요, 같은 문서에 결과 축적"
  대상_에이전트: "GameDesign_Agent"

파이프라인:
  1. /requirement - 요구사항 정리
  2. /market - 경쟁작 배틀패스 분석
  3. /monetize - 수익화 모델 설계
  4. /balance - 보상 밸런스 검토
  5. /pd-review - 최종 평가
```

### 예시 3: "전체 인증 시스템 리팩토링 계획 세워줘"
```yaml
판단_결과:
  실행_방식: "Agent Teams"
  이유: "다양한 관점 필요(보안/성능/UX), 독립적 분석 가능, 토론으로 더 나은 결과"

팀_구성:
  리드: "아키텍트 - 전체 조율 및 최종 통합"
  팀원:
    - "보안 전문가" - "인증 흐름 보안 분석" - "Opus"
    - "성능 엔지니어" - "확장성 및 지연 분석" - "Sonnet"
    - "UX 전문가" - "사용자 경험 영향 평가" - "Sonnet"
```

## 부서 간 워크플로우 (Cross-Department Routing)

에이전트 간 산출물이 연결되는 복합 워크플로우를 자동 감지하고 라우팅합니다.

### 본부 & 직속 구조 (v7: 20 에이전트)

```
┌── 대표 직속 ─────────────────────────────────────┐
│  Secretary_Agent (비서실장)                        │
│  오케스트레이터 (COO)                              │
│  Quality Gate (품질관리)                           │
│  Growth_Agent (성장전략)                           │
│  PMO_Agent (프로젝트매니저) ★                     │
│  Shield_Agent (보안책임자) ★                      │
│  RedTeam_Agent (레드팀) ★                         │
└──────────────┬──────────┬──────────┬─────────────┘
               │          │          │
    ┌──────────▼──┐ ┌─────▼────┐ ┌───▼──────────┐
    │  게임본부   │ │ 사업본부 │ │  지원본부    │
    │ GameDesign  │ │ Income_  │ │ PT_Agent     │
    │ team-kowloon│ │ Factory  │ │ Translate    │
    │ GameDev ★  │ │Marketing │ │ HR_Agent     │
    │ QATest ★   │ │Community★│ │ Video_Analyzer│
    └─────────────┘ └──────────┘ │ DevOps ★    │
                                  └──────────────┘
```

### 부서 간 워크플로우 감지

다음 패턴이 감지되면 자동으로 멀티-에이전트 파이프라인을 구성:

#### Case D: 기획 → 발표자료 (게임본부 → 지원본부)
**감지 키워드**: "발표", "PT", "프레젠테이션", "보고", "pitch"가 기획 작업과 함께 언급
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "기획 분석 + 발표 자료 변환 필요"

파이프라인:
  1. GameDesign_Agent → /requirement → /market → /pd-review
  2. PT_Agent → /pt-from-design (GameDesign 결과를 PT로 변환)
  3. /quality-gate (최종 품질 검증)
```

#### Case E: 기획 + 아트 확인 (게임본부 내부)
**감지 키워드**: "런칭", "출시", "일정", "리소스"가 기능 기획과 함께 언급
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "기능 기획 + 아트 실현성 확인 필요"

파이프라인:
  1. GameDesign_Agent → /requirement → /concept
  2. GameDesign_Agent → /art-status (team-kowloon 아트 완성도 조회)
  3. GameDesign_Agent → /pd-review (아트 상태 반영한 최종 판정)
```

#### Case F: 수익 모델 교차 검증 (사업본부 → 게임본부)
**감지 키워드**: "수익", "monetize"가 게임 관련 컨텍스트에서 언급
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "수익 아이디어의 게임 밸런스 영향 검증 필요"

파이프라인:
  1. Income_Factory → /idea-eval → /idea-critic
  2. GameDesign_Agent → /monetize + /balance (교차 검증)
  3. Income_Factory → /idea-plan (검증 통과 시)
```

#### Case G: 다국어 산출물 (모든 본부 → 지원본부)
**감지 키워드**: "번역", "다국어", "영문", "일본어", "localization"
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "산출물 다국어 변환 필요"

파이프라인:
  1. [원래 에이전트 파이프라인 실행]
  2. Translate_Agent → /translate (산출물 텍스트 추출 및 번역)
```

#### Case H: 전체 품질 검증 (모든 본부 → 대표 직속)
**감지 키워드**: "검증", "품질", "리뷰", "quality", 또는 최종 산출물 확인 요청
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "통합 품질 게이트 적용"

파이프라인:
  1. [원래 에이전트 파이프라인 실행]
  2. /quality-gate (CFMC 매트릭스 평가)
```

#### Case I: 게임 개발 파이프라인 (게임본부 풀사이클)
**감지 키워드**: "게임 개발", "Unity", "빌드", "코딩", "개발 시작", "프로토타입"
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "기획→개발→테스트→배포 전체 게임 개발 사이클"

파이프라인:
  1. GameDesign_Agent → /requirement → /concept → /monetize → /balance → /pd-review
  2. team-kowloon → /game-art-spec → 아트 에셋 제작
  3. GameDev_Agent → /unity-arch → /unity-init → /unity-scene → /unity-script → /unity-ui
  4. QATest_Agent → /test-plan → /test-script → /perf-profile
  5. Quality Gate → /quality-gate
  6. Shield_Agent → /security-audit → /compliance-check
  7. RedTeam_Agent → /red-review → /exploit-hunt
  8. DevOps_Agent → /pipeline-config → /build-ios → /build-android → /build-steam
  9. Marketing_Agent → /aso → /steam-page → /social-copy → /launch-plan
  10. Translate_Agent → /translate → /translate-cn → /localize-validate
  11. Community_Agent → /discord-plan → /community-post
  12. DevOps_Agent → /deploy-stage → [CEO 승인] → /deploy-prod
```

#### Case J: 풀 릴리즈 파이프라인 (모든 본부 총동원)
**감지 키워드**: "릴리즈", "런칭", "출시", "go live", "풀 파이프라인"
```yaml
판단_결과:
  실행_방식: "Agent Teams + 부서 간 파이프라인"
  이유: "전체 에이전트 순차 협업, 멀티플랫폼 동시 런칭"

팀_구성:
  리드: "오케스트레이터 - 전체 조율"
  팀원:
    - "GameDesign_Agent" - "최종 기획 확정"
    - "GameDev_Agent" - "릴리즈 빌드 완성"
    - "QATest_Agent" - "플랫폼별 최종 검증"
    - "Shield_Agent" - "보안/컴플라이언스 최종 확인"
    - "RedTeam_Agent" - "릴리즈 전 적대적 검증"
    - "DevOps_Agent" - "프로덕션 배포 실행"
    - "Marketing_Agent" - "런칭 마케팅 실행"
    - "Community_Agent" - "커뮤니티 런칭 공지"
    - "Translate_Agent" - "현지화 최종 검증"

파이프라인:
  사전_조건:
    - QATest_Agent /platform-check PASS (Apple/Google/Steam)
    - Shield_Agent /compliance-check CLEAR (GDPR/COPPA/PIPL)
    - RedTeam_Agent /red-review APPROVE
    - Quality Gate A/B (80점+)
  실행:
    - DevOps_Agent /deploy-stage → 스테이징 테스트
    - [CEO 최종 승인]
    - DevOps_Agent /deploy-prod → 프로덕션 배포
    - Marketing_Agent /launch-plan 실행
    - Community_Agent /community-post 런칭 공지
```

#### Case K: 보안 우선 리뷰 (삼중 검증)
**감지 키워드**: "보안", "개인정보", "GDPR", "privacy", "security", "컴플라이언스"
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "보안 관련 요청 — Shield→RedTeam→Quality Gate 삼중 검증"

파이프라인:
  1. Shield_Agent → /secret-scan → /privacy-scan → /security-audit
  2. Shield_Agent → /threat-model → /data-flow (심층 분석)
  3. Shield_Agent → /compliance-check (시장별 법규)
  4. RedTeam_Agent → /red-review (보안 관점 적대적 검증)
  5. Quality Gate → /quality-gate (통합 품질 점수)

판정:
  - Shield CLEAR + RedTeam APPROVE + QG A/B → 진행
  - Shield SECURITY_HOLD → 즉시 차단, CEO 에스컬레이션
  - RedTeam REJECT → 차단, CEO 에스컬레이션
```

#### Case RT: 레드팀 자동 트리거 (모든 파이프라인 후처리)
**트리거**: 모든 파이프라인의 Quality Gate PASS(90+) 이후 자동 발동
```yaml
판단_결과:
  실행_방식: "자동 후처리"
  이유: "품질 게이트 통과 산출물에 대한 필수 적대적 검증"

자동_체인:
  1. Quality Gate → PASS (A: 90-100점)
     ↓ 자동 트리거
  2. Shield_Agent → /security-audit (코드/데이터인 경우)
     ↓
  3. RedTeam_Agent → /red-review (모든 산출물)
     ↓
  판정:
    - APPROVE → 산출물 최종 승인
    - CONDITIONAL → 수정 후 재검토 (1회)
    - REJECT → 차단, CEO 에스컬레이션

주의:
  - Quality Gate B (80-89점) → Shield만 자동 트리거 (코드/데이터인 경우)
  - Quality Gate C 이하 → 자동 트리거 없음 (먼저 품질 개선)
```

### 부서 간 연계 예시

#### 예시 4: "배틀패스 기획하고 발표자료까지 만들어줘"
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "게임본부 분석 + 지원본부(PT) 발표자료 변환"

파이프라인:
  1. /requirement - 배틀패스 요구사항 분석
  2. /market - 경쟁작 배틀패스 벤치마킹
  3. /monetize - 수익 모델 설계
  4. /balance - 보상 밸런스 검토
  5. /pd-review - PD 최종 판정
  6. /pt-from-design - 분석 결과 → 발표자료 변환
  7. /quality-gate - 최종 품질 검증
```

#### 예시 5: "이번 아이디어를 게임에 적용 가능한지 검토해줘"
```yaml
판단_결과:
  실행_방식: "부서 간 파이프라인"
  이유: "사업본부 아이디어 + 게임본부 밸런스 교차검증"

파이프라인:
  1. /idea-eval - 아이디어 점수화
  2. /monetize - 게임 수익 모델 관점 검토
  3. /balance - 밸런스 영향도 분석
  4. /idea-critic - 최종 Kill/Proceed 판정
```

#### 예시 6: "캐주얼 퍼즐 게임 프로토타입 만들어줘" (Case I)
```yaml
판단_결과:
  실행_방식: "게임 개발 파이프라인 (Case I)"
  이유: "기획→개발→테스트 전체 사이클 필요"

파이프라인:
  1. GameDesign_Agent → /requirement → /concept → /monetize → /balance → /pd-review
  2. GameDev_Agent → /unity-arch → /unity-init → /unity-script → /unity-ui
  3. QATest_Agent → /test-plan → /test-script
  4. Quality Gate → /quality-gate
  5. Shield_Agent → /security-audit (자동)
  6. RedTeam_Agent → /red-review (자동)
```

#### 예시 7: "출시 전 보안 점검 해줘" (Case K)
```yaml
판단_결과:
  실행_방식: "보안 우선 리뷰 (Case K)"
  이유: "보안 삼중 검증 필요"

파이프라인:
  1. Shield_Agent → /secret-scan → /privacy-scan → /security-audit
  2. Shield_Agent → /compliance-check (타겟 시장: NA, EU, CN)
  3. RedTeam_Agent → /red-review → /exploit-hunt
  4. Quality Gate → /quality-gate
```

#### 예시 8: "Steam/iOS/Android 동시 런칭 준비해줘" (Case J)
```yaml
판단_결과:
  실행_방식: "풀 릴리즈 파이프라인 (Case J)"
  이유: "멀티플랫폼 동시 런칭 — 전체 에이전트 총동원"

파이프라인:
  1. QATest_Agent → /platform-check (Apple/Google/Steam)
  2. Shield_Agent → /compliance-check (GDPR/COPPA/PIPL)
  3. RedTeam_Agent → /red-review + /cultural-review
  4. DevOps_Agent → /build-ios → /build-android → /build-steam
  5. DevOps_Agent → /deploy-stage (TestFlight/내부트랙/Steam Beta)
  6. [CEO 최종 승인]
  7. DevOps_Agent → /deploy-prod
  8. Marketing_Agent → /launch-plan 실행
  9. Community_Agent → /community-post 런칭 공지
```

## 주의사항

1. **과도한 팀 구성 지양**: 2명 이하면 기존 방식이 효율적
2. **명확한 역할 분리**: 팀원 간 중복 업무 최소화
3. **적절한 모델 선택**:
   - 비판적 분석 → Opus
   - 창의적 작업/코드 → Sonnet
   - 단순 분류/라우팅 → Haiku
4. **비용 인식**: Agent Teams는 토큰 비용 높음
5. **부서 간 비용**: 멀티-에이전트 파이프라인은 단일보다 2~3배 토큰 사용
6. **지원 호출 순서**: 항상 본부 작업 먼저 → 지원/직속(PT/번역/QA)은 후처리

---

## 실행

이제 사용자 요청을 분석합니다: `$ARGUMENTS`
