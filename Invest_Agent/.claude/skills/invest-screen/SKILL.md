---
name: invest-screen
description: "밸류에이션 스크리너 — PER/PBR/배당수익률 복합 필터로 저평가 종목 발굴. 종목을 찾거나 스크리닝할 때 사용."
user-invocable: true
argument-hint: "[PBR<1] [배당3%+] [KOSPI]"
allowed-tools: Read, Bash(curl *), Glob, Grep
---

# 밸류에이션 스크리너

투자 전략 §4.1 기반으로 저평가 종목을 스크리닝합니다.

## 참조 문서
- 투자 전략: `Invest_Agent/docs/strategy.md` (§4.1 가치 평가 지표)
- 규칙 엔진: `Invest_Agent/app/src/lib/strategy/rules.ts`

## 데이터 소스
배포된 대시보드 API 활용:
```bash
curl -s "https://invest-dashboard-azure.vercel.app/api/krx/dividend?market=ALL"
```

## 기본 스크리닝 조건 (인수로 커스텀 가능)

### 프리셋 1: 고배당 저PBR (기본)
- PBR < 1.0 (저평가 — §4.1)
- 배당수익률 >= 3% (고배당 — §3.2)
- PER > 0 (적자 기업 제외)

### 프리셋 2: 극저평가
- PBR < 0.5
- PER < 10
- 배당수익률 >= 0% (전체)

### 프리셋 3: 배당 황제
- 배당수익률 >= 5%
- PBR < 5 (제한 없음)

## 스크리닝 절차

1. API에서 전 종목 데이터 가져오기
2. 사용자 인수 또는 기본 프리셋 기준으로 필터링
3. 결과를 배당수익률 내림차순 정렬
4. 상위 30개 종목 CLI 테이블로 출력

## 출력 형식

```
=== 밸류에이션 스크리너 결과 ===
조건: PBR < 1.0, 배당수익률 >= 3%, PER > 0
결과: XX개 종목 (전체 X,XXX개 중)

 #  종목명          코드     PBR   PER   배당률   종가
 1  OOOO은행        XXXXXX   0.3   4.2   7.5%    XX,XXX
 2  OOOO증권        XXXXXX   0.4   5.1   6.2%    XX,XXX
 ...

💡 종목 심층 분석: /invest-review [종목코드]
💡 웹 대시보드: https://invest-dashboard-azure.vercel.app/screener
```

## 추가 분석 제안
- 동일 업종 내 PER 비교 (§4.1 — "반드시 동일 업종 내에서 비교")
- 이익잉여금 규모가 큰 기업 우선 (§4.2 — 배당 재원)
- 매출액 증가 추세 확인 권장 (§4.2)
