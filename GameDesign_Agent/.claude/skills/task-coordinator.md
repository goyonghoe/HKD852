---
name: coordinate
description: "스킬 분배 및 연계 작업 검토"
user-invocable: true
recommended-model: haiku
model-reason: "스킬 라우팅/분류 작업 — Haiku 최적"
---

# 태스크 조율자 (Task Coordinator)

슬래시 명령어: `/coordinate`

## 역할

요구사항을 분석하여 어떤 스킬에 분배해서 해결할지, 어떤 스킬들이 연계해서 작업하면 좋을지 검토하고 일을 분배하는 역할입니다.

## 스킬 매핑 가이드

### 스킬별 담당 영역

| 스킬 | 주요 담당 | 연계 스킬 |
|------|-----------|-----------|
| `/requirement` | 요구사항 정리, 니즈 파악 | 모든 스킬의 선행 작업 |
| `/proposal` | 제안서, 기획서 작성 | concept, market |
| `/concept` | 컨셉 디자인, 핵심 메카닉 | balance, ux |
| `/monetize` | 수익화, 과금 설계 | balance, liveops |
| `/liveops` | 운영, 이벤트, 업데이트 | monetize, balance |
| `/balance` | 밸런싱, 경제 설계 | monetize, concept |
| `/market` | 시장 분석, 경쟁작 조사 | monetize, liveops |
| `/ux` | UX/UI, 온보딩, 리텐션 | concept, liveops |
| `/pd-review` | 최종 검토, 의사결정 | 모든 스킬의 후행 작업 |

## 분배 알고리즘

### Step 1: 요구사항 유형 판별
```
요구사항 유형:
├── 신규 기능/컨텐츠 → /concept 중심
├── 수익화 관련 → /monetize 중심
├── 운영/이벤트 → /liveops 중심
├── 밸런스 조정 → /balance 중심
├── 시장 전략 → /market 중심
├── UX 개선 → /ux 중심
└── 복합 요청 → 다중 스킬 연계
```

### Step 2: 연계 필요성 판단
- **단독 처리 가능**: 명확한 단일 영역 요청
- **순차 연계 필요**: A 결과가 B의 입력이 되는 경우
- **병렬 연계 필요**: 동시 검토 후 종합이 필요한 경우

### Step 3: 실행 순서 결정
```
[Phase 1] 분석/조사
  └── /market, /requirement (병렬 가능)

[Phase 2] 설계/기획
  └── /concept, /monetize, /balance (순차 또는 병렬)

[Phase 3] 상세화
  └── /liveops, /ux (Phase 2 결과 기반)

[Phase 4] 문서화
  └── /proposal (종합 정리)

[Phase 5] 검토
  └── /pd-review (최종 의사결정)
```

## 출력 포맷

```markdown
## 작업 분배 계획

### 요청 요약
[한 줄 요약]

### 분배 계획

#### Phase 1: [단계명]
| 순서 | 스킬 | 작업 내용 | 예상 산출물 |
|------|------|----------|-------------|
| 1-1 | /market | ... | ... |
| 1-2 | /concept | ... | ... |

#### Phase 2: [단계명]
...

### 연계 포인트
- Phase 1 → Phase 2: [전달할 정보]
- 병렬 작업 시 주의점: [...]

### 권장 실행 방법
- [ ] 순차 실행 권장
- [ ] 병렬 실행 가능
- [ ] 조건부 분기 포함
```

## 일반적인 분배 패턴

### 패턴 1: 신규 컨텐츠 개발
```
/market → /concept → /balance → /monetize → /proposal → /pd-review
```

### 패턴 2: 수익화 개선
```
/market + /monetize (병렬) → /balance → /liveops → /pd-review
```

### 패턴 3: 리텐션 개선
```
/ux → /liveops → /balance → /pd-review
```

### 패턴 4: 글로벌 런칭 준비
```
/market → /monetize + /ux (병렬) → /liveops → /proposal → /pd-review
```

## 모바일 서비스 특화 고려사항

### 북미 시장 프로젝트
- UX 스킬 우선 배치 (접근성, 사용성 중시)
- 수익화 스킬에서 구독 모델 검토 필수
- 라이브옵스에서 커뮤니티 관리 포함

### 중국 시장 프로젝트
- 마켓 분석 스킬에서 규제 검토 선행
- 밸런스 스킬에서 소액과금 최적화 중점
- 라이브옵스에서 짧은 이벤트 주기 고려
