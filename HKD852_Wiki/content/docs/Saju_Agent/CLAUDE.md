# 사주풀이 에이전트 (Saju Agent) — 사업본부

> AI 사주풀이 웹앱 개발/운영/분석 전문 에이전트

---

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드 인덱스: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)
- 스킬 표준: [스킬 구조 가이드](../docs/claude-code-guide/skills/01-skill-structure.md)

---

## 역할

HKD852 스튜디오의 사업본부 소속 사주풀이 서비스 에이전트:

- Next.js 기반 AI 사주풀이 웹앱 개발 및 유지보수
- AI 프롬프트 최적화 (사주 해석 품질 향상)
- 결제/전환율 분석 및 최적화
- 서비스 배포 및 모니터링

---

## 기술 스택

| 영역       | 기술                                                  |
| ---------- | ----------------------------------------------------- |
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS 3.4    |
| AI         | Claude API (Haiku 4.5 = 티저, Sonnet 4.6 = 상세 풀이) |
| Payment    | PortOne V2 (990 KRW 단건 결제)                        |
| Database   | Neon PostgreSQL + Drizzle ORM                         |
| Deployment | Vercel (Seoul icn1 region)                            |
| Font       | Pretendard Variable                                   |

---

## 스킬 목록

| 스킬          | 명령어          | 모델   | 역할                           |
| ------------- | --------------- | ------ | ------------------------------ |
| 프롬프트 튜닝 | `/saju-prompt`  | Opus   | AI 해석 프롬프트 품질 개선     |
| 서비스 분석   | `/saju-analyze` | Sonnet | 전환율/결제/사용자 데이터 분석 |
| 배포          | `/saju-deploy`  | Haiku  | Vercel 배포 + 상태 확인        |

---

## 디렉토리 구조

```
Saju_Agent/
├── .claude/skills/          # Claude Code 스킬
│   ├── saju-analyze/
│   ├── saju-deploy/
│   └── saju-prompt/
├── app/                     # Next.js 애플리케이션
│   └── src/
│       ├── app/             # 라우트 (페이지 + API)
│       ├── components/      # React 컴포넌트
│       └── lib/             # 비즈니스 로직
│           ├── ai/          # Claude API 연동
│           ├── db/          # Drizzle ORM
│           ├── payment/     # PortOne 결제
│           ├── saju/        # 사주 계산 엔진
│           └── utils/       # 유틸리티
└── outputs/                 # 분석 결과
```

---

## 데이터 플로우

```
홈 (/) → 생년월일 입력 → POST /api/saju/calculate → /result (무료 티저)
  → 결제 (990원) → POST /api/payment/verify → /result/full (상세 풀이)
  → 공유 → /share/[id]
```

---

## 대용량 데이터 파일 — 읽지 마세요

아래 파일들은 빌드에 필수이지만, 에이전트 작업 시 읽을 필요가 없는 순수 데이터 파일입니다.
**해당 기능을 직접 수정하는 작업이 아닌 한 절대 Read/탐색하지 마세요.**

| 파일                                 | 크기     | 용도                  | 읽어야 하는 경우                                     |
| ------------------------------------ | -------- | --------------------- | ---------------------------------------------------- |
| `app/src/lib/saju/hanja-mappings.ts` | ~2,000줄 | 한자 선택 사전 데이터 | 한자 선택 UI 버그 수정, 한자 데이터 추가/수정 시에만 |

### 이 파일들의 구조만 알면 됩니다

- `hanja-mappings.ts`: `Record<string, HanjaEntry[]>` 형태의 한글 음절→한자 매핑 사전. `NameInput.tsx`와 `wizard/StepHanja.tsx`에서 import하여 사용.

---

## 버전 정보

- 생성일: 2026-02-21
- 상태: Production Ready
