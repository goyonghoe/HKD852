# Invest_Agent — 개인 투자 대시보드

## 역할

CEO 개인 주식투자 정보 대시보드 개발 및 운영

## 공통 표준

이 에이전트는 HKD852 루트의 Claude Code 가이드를 따릅니다.

- 가이드: [Claude Code 공식 가이드](../docs/claude-code-guide/INDEX.md)

## 기술 스택

- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **스타일링**: Tailwind CSS (금융 다크 테마)
- **차트**: Recharts
- **검증**: Zod
- **배포**: Vercel (`invest-dashboard-azure.vercel.app`)
- **데이터 소스**: 네이버 금융 모바일 API (`m.stock.naver.com/api/`)
- **AI 코치**: Claude API (Sonnet) — 투자 코칭 챗봇
- **데이터 저장**: localStorage (웹) + JSONL (CLI 스킬)

## 프로젝트 구조

```
Invest_Agent/
├── CLAUDE.md              # 이 파일
├── docs/strategy.md       # 투자 전략 지식 베이스 (§ 참조)
├── data/                  # CLI 스킬 데이터 (gitignore)
│   ├── journal.jsonl      # 투자 일지
│   └── portfolio.jsonl    # 포트폴리오
├── outputs/               # 스킬 산출물 (brief, review 등)
├── .claude/skills/        # 스킬 (7개)
│   ├── market-brief/      # 일일 시장 브리핑
│   ├── invest-journal/    # 투자 일지 기록
│   ├── invest-dashboard/  # 상태 요약
│   ├── invest-screen/     # 밸류에이션 스크리닝
│   ├── invest-review/     # 종목 심층 분석
│   ├── invest-analyze/    # 주간 포트폴리오 분석
│   └── invest-plan/       # 투자 계획 수립
└── app/                   # Next.js 앱 (배포 루트)
    └── src/
        ├── app/
        │   ├── page.tsx           # 배당수익률 대시보드
        │   ├── screener/          # 밸류에이션 스크리너
        │   ├── portfolio/         # 포트폴리오 트래커
        │   ├── briefing/          # 시장 브리핑
        │   ├── journal/           # 투자 일지
        │   ├── coach/             # AI 투자 코치 챗봇
        │   └── api/
        │       ├── krx/dividend/  # 배당 데이터 API
        │       ├── stock/[code]/  # 종목 상세 API
        │       ├── market/summary/ # 시장 요약 API (KOSPI, KOSDAQ, USD/KRW)
        │       └── coach/chat/    # 투자 코치 AI API (Claude 스트리밍)
        ├── components/
        │   ├── layout/            # Header, Navigation
        │   ├── dashboard/         # 배당 대시보드 UI
        │   ├── screener/          # 스크리너 UI
        │   ├── portfolio/         # 포트폴리오 UI
        │   ├── briefing/          # 브리핑 UI (MarketSummary, RateTracker, DividendCalendar)
        │   ├── journal/           # 일지 UI (JournalForm, JournalTimeline)
        │   └── coach/             # 코치 UI (ChatContainer)
        ├── lib/
        │   ├── ai/                # AI 클라이언트 (코치 시스템 프롬프트)
        │   ├── krx/               # Naver Finance API 클라이언트
        │   ├── naver/             # 종목 상세 API 클라이언트
        │   ├── portfolio/         # 포트폴리오 localStorage 스토어
        │   ├── journal/           # 투자 일지 localStorage 스토어
        │   ├── strategy/          # 전략 규칙 엔진
        │   └── utils/             # 포매팅 유틸리티
        └── hooks/                 # React hooks
```

## 투자 전략 지식 베이스

- **전략 문서**: [docs/strategy.md](./docs/strategy.md) — 주식아가방 강연 기반 5대 카테고리
  - I. 거시 경제 및 시장 분석 (PBR 저평가, 상법 개정, 금리 트래킹)
  - II. 핵심 매매 알고리즘 (손절 10%, 익절 극대화, 역발상 매수)
  - III. 단계별 포트폴리오 (ETF → 배당주 → 주도주 → 바벨 전략)
  - IV. 가치 평가 및 재무 분석 (PBR/PER, 재무제표)
  - V. 투자 마인드 관리 (FOMO 방지, 투자 일지)
- **규칙 엔진**: `app/src/lib/strategy/rules.ts` — 전략을 코드로 구현

## 스킬 목록

| 스킬                | 설명                                            | 모델   |
| ------------------- | ----------------------------------------------- | ------ |
| `/market-brief`     | 일일 시장 브리핑 (금리, 시장 요약, 전략 시그널) | Sonnet |
| `/invest-journal`   | 투자 일지 기록 (매수/매도 + 인과관계 훈련)      | Sonnet |
| `/invest-dashboard` | 전체 상태 요약 (포트폴리오, 일지, 브리핑)       | Haiku  |
| `/invest-screen`    | 밸류에이션 스크리너 (PBR/PER/배당 복합 필터)    | Sonnet |
| `/invest-review`    | 종목 심층 분석 (재무제표 + 전략 적합도)         | Opus   |
| `/invest-analyze`   | 주간 포트폴리오 분석 (손절/익절 체크)           | Sonnet |
| `/invest-plan`      | 투자 계획 수립 (단계별 액션 제안)               | Opus   |

## 대시보드 페이지

| 경로         | 기능                                         | 상태 |
| ------------ | -------------------------------------------- | ---- |
| `/`          | 투자 전략 가이드 (5대 카테고리)              | 완료 |
| `/dividend`  | 배당수익률 전 종목 테이블 + Top 20 차트      | 완료 |
| `/screener`  | PBR/PER/배당수익률 복합 필터 스크리닝        | 완료 |
| `/portfolio` | 보유 종목 관리, 수익률, 손절 알림, 바벨 비율 | 완료 |
| `/briefing`  | 일일 시장 요약, 금리, 배당 캘린더            | 완료 |
| `/journal`   | 투자 일지 기록/조회, 타임라인                | 완료 |
| `/coach`     | AI 투자 코치 챗봇 (Claude Sonnet 스트리밍)   | 완료 |

## AI 투자 코치 (`/coach`)

- **모델**: Claude Sonnet (스트리밍)
- **페르소나**: 엄격하고 다정한 투자 러닝메이트
- **절대 원칙 4가지**:
  1. 종목을 직접 하나만 찍어주지 않음 → 미인대회 관점 훈련
  2. 매수 전 투자 일지 4요소 작성 강제
  3. 매수 이유는 '성장성' 또는 '저평가'만
  4. 레버리지/인버스 강력 차단
- **상황별 대화**: FOMO 통제, 손절 10% 룰, 익절 극대화, 재무제표 설명
- **시스템 프롬프트**: `app/src/lib/ai/coach-prompt.ts`
- **환경변수**: `ANTHROPIC_API_KEY` (Vercel + .env.local)

## 데이터 소스 참고

- KRX 직접 API (`data.krx.co.kr`)는 서버사이드 접근 차단 (LOGOUT 응답)
- 네이버 금융 모바일 API 사용: 종목 목록 + integration API (30 병렬, ~7초, 30분 캐시)

## 개발 명령어

```bash
cd Invest_Agent/app
npm run dev     # 개발 서버 (localhost:3000)
npm run build   # 프로덕션 빌드
vercel --prod   # Vercel 배포
```
