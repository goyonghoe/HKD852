# Income Factory — 아이디어-투-런칭 에이전트 생태계

> 매일 10개의 수익 아이디어를 생성하고, 비판과 검증을 거쳐 실제 런칭까지 도달하는 자율 파이프라인

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.
- **가이드 인덱스**: [Claude Code 공식 가이드](../../docs/claude-code-guide/INDEX.md)
- **스킬 표준**: [스킬 구조 가이드](../../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 핵심 철학

```
고민 → 계획 → 비판 → 수용 → 개선 → 결과물 → 런칭 → 학습 → 반복
```

- **매일** 새로운 아이디어 10개 생성
- **Opus로 비판**, 살아남은 것만 진행
- **7일 타임박스** — 완벽보다 출시
- **실제 플랫폼 런칭** — 코드/문서가 아닌 상품
- **주간 학습** — 팔린 것을 더 만들고, 안 팔린 것은 버림

---

## 파이프라인 흐름

```
매일 (/factory 실행)
│
├─ [1] /idea-scan     (Haiku)   트렌드 스캔 → 아이디어 10개
├─ [2] /idea-eval     (Sonnet)  5기준 점수화 → Top 3
├─ [3] /idea-critic   (Opus)    악마의 변호인 → Kill or Proceed
│
│  선별된 1~2개
│
├─ [4] /idea-plan     (Sonnet)  7일 실행 계획
├─ [5] /idea-build    (Sonnet)  제품 제작
├─ [6] /idea-review   (Opus)    품질 검증 → Pass/Revise/Kill
├─ [7] /idea-launch   (Haiku)   배포 가이드
│
│  매주 금요일
│
└─ [8] /idea-analyze  (Sonnet)  성과 → 학습 → 전략 조정
```

---

## 스킬 목록

| 스킬 | 명령어 | 모델 | 역할 |
|------|--------|------|------|
| Factory | `/factory` | Sonnet | 일일 파이프라인 오케스트레이터 |
| Idea Scan | `/idea-scan` | Haiku | 트렌드 스캔 + 아이디어 10개 생성 |
| Idea Eval | `/idea-eval` | Sonnet | 5기준 점수화, Top 3 선별 |
| Idea Critic | `/idea-critic` | Opus | 악마의 변호인, Kill/Proceed |
| Idea Plan | `/idea-plan` | Sonnet | 7일 타임박스 실행 계획 |
| Idea Build | `/idea-build` | Sonnet | 실제 제품 제작 |
| Idea Review | `/idea-review` | Opus | 품질 검증, Pass/Revise/Kill |
| Idea Launch | `/idea-launch` | Haiku | 플랫폼 배포 가이드 |
| Idea Analyze | `/idea-analyze` | Sonnet | 주간 성과 분석 + 학습 |

---

## 제품 카테고리

| 카테고리 | 플랫폼 | 자동화 | 첫 수익 | 월 잠재력 |
|----------|--------|--------|---------|----------|
| 프롬프트팩 | Gumroad | 완전 | 1주 | $200~$1,500 |
| 디자인 템플릿 | Etsy, Gumroad | 완전 | 1~2주 | $500~$3,000 |
| Chrome 확장 | Chrome Web Store | 부분 | 2~4주 | $500~$10,000 |
| API 래퍼 | RapidAPI | 완전 | 2~3주 | $300~$3,000 |
| Micro-SaaS | Vercel+Stripe | 부분 | 3~4주 | $1,000~$10,000 |
| 콘텐츠 | YouTube, Newsletter | 부분 | 4~8주 | $500~$5,000 |

---

## 평가 기준 (5가지, 각 20점)

| 기준 | 질문 |
|------|------|
| **자동화 가능성** | Claude Code만으로 완성 가능한가? |
| **시장 도달 속도** | 런칭까지 며칠? |
| **수익 잠재력** | 월 예상 수익은? |
| **경쟁 강도** | 블루오션인가 레드오션인가? |
| **확장 가능성** | 반복/변형으로 확장 가능한가? |

---

## 디렉토리 구조

```
Income_Factory/
├── .claude/
│   └── skills/          ← 9개 스킬
├── CLAUDE.md            ← 이 문서
├── pipeline/
│   ├── ideas/           ← 일일 아이디어 (YYYY-MM-DD.yaml)
│   ├── plans/           ← 실행 계획 ({project-id}/)
│   ├── products/        ← 제작된 제품 ({project-id}/)
│   └── launches/        ← 런칭 기록 ({project-id}/)
├── data/
│   ├── trends/          ← 트렌드 데이터
│   ├── performance/     ← 주간 성과
│   └── learnings/       ← 누적 학습
└── outputs/             ← 최종 배포 파일
```

---

## 제약 조건

- 일일 투자 시간: **30분** (사람은 검토와 최종 배포 클릭만)
- 초기 자본: **0원**
- 기술: **Claude Code 의존** (외부 도구 최소화)
- 모든 제품은 **7일 내 런칭** 가능해야 함

---

## 모델 비용 전략

```
Opus  → 비판(critic) + 검증(review)에만 사용 (하루 2회)
Sonnet → 평가, 계획, 제작, 분석 (메인 작업)
Haiku  → 스캔, 런칭 가이드 (단순 작업)
```

---

## 버전 정보
- 생성일: 2026-02-07
- 최종 업데이트: 2026-02-07
