# Saju Agent 개요

AI 기반 사주팔자 운세 서비스를 제공하는 웹 애플리케이션입니다.

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 에이전트 | Saju_Agent |
| 서비스 | AI 사주 풀이 (무료 티저 + 유료 상세 해석) |
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 배포 | Vercel |
| 경로 | `Saju_Agent/app/` |

## 기술 스택

- **AI 해석**: Claude API + Gemini API (이중 모델)
- **결제**: TossPayments (한국 결제)
- **DB**: Drizzle ORM
- **스타일링**: Tailwind CSS
- **사주 엔진**: 자체 만세력 계산기 (`lib/saju/`)

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 사주 계산 | 생년월일시 → 사주팔자 (천간/지지) 변환 |
| 무료 티저 | 기본 사주 구성 + 간략 해석 |
| 유료 풀리딩 | 십신, 십이운성, 특수성, 공망 포함 상세 해석 |
| 한자 매핑 | 이름 한자 변환 + 획수 분석 |
| 공유 카드 | SNS 공유용 결과 카드 생성 |

## 사주 엔진 모듈

```
lib/saju/
├── calculator.ts      # 사주 계산 메인
├── manseryeok.ts      # 만세력 데이터
├── ten-gods.ts        # 십신 관계
├── twelve-stages.ts   # 십이운성
├── special-stars.ts   # 신살 (특수성)
├── void-emptiness.ts  # 공망
├── elements.ts        # 오행 분석
└── branch-relations.ts # 지지 관계 (형충파해)
```

## 수익 모델

- 무료: 사주 구성 + 티저 해석 (AI 생성)
- 유료: 상세 풀리딩 (TossPayments 결제)
