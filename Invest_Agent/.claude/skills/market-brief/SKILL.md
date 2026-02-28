---
name: market-brief
description: "일일 시장 브리핑 — 미국 금리, KOSPI/KOSDAQ 요약, 전략 기반 시그널. 매일 아침 시장 상황을 파악할 때 사용."
user-invocable: true
allowed-tools: Read, Write, Bash(curl *), WebSearch, WebFetch, Glob, Grep
---

# 일일 시장 브리핑

CEO 개인 투자 대시보드의 일일 시장 상황 브리핑을 생성합니다.

## 참조 문서
- 투자 전략: `Invest_Agent/docs/strategy.md`

## 브리핑 항목 (순서대로)

### 1. 미국 10년물 국채 금리 (§1.4)
- WebSearch로 "US 10-year treasury yield today" 검색
- 전일 대비 변동 방향 표시 (상승/하락/보합)
- 금리 상승 = 유동성 축소 시그널, 금리 하락 = 유동성 확대 시그널

### 2. KOSPI/KOSDAQ 시장 요약
- Invest_Agent 대시보드 API 활용: `curl -s "https://invest-dashboard-azure.vercel.app/api/krx/dividend?market=ALL"`
- 전체 종목 수, 평균 배당수익률, 고배당(3%+) 종목 수 요약

### 3. 배당수익률 상위 5종목
- API 응답에서 배당수익률 상위 5개 종목 추출
- 종목명, 코드, 배당수익률, PBR, PER 표시

### 4. PBR 저평가 시그널 (§1.1)
- PBR < 1 종목 비율 계산
- "시장 전체 저평가 상태" 판단 기준: PBR < 1 종목이 50% 이상

### 5. 전략 체크리스트
- [ ] 오늘 매수 예정이면: 파란 불(하락일)에만 매수 권장 (§2.3)
- [ ] 장 시작 직후(9~10시) 매매 차단 리마인드 (§2.4)
- [ ] 지정가 주문만 사용 (§2.4)

## FOMO 방지 원칙 (§5.3)
- 자극적 형용사 ("폭등", "사상 최고", "급락") 사용 금지
- 오직 **숫자와 시계열, 비교 대상**만 객관적으로 제시
- 평정심 유지가 목표

## 출력 형식
`Invest_Agent/outputs/brief_YYYYMMDD.md` 파일로 저장

```markdown
# 시장 브리핑 — YYYY-MM-DD

## 미국 10년물 금리
- 현재: X.XX% (전일 대비 +/-X.XX%p)
- 시그널: [유동성 확대/축소/중립]

## KOSPI/KOSDAQ 요약
- 전체 종목: X,XXX개
- 평균 배당수익률: X.XX%
- 고배당(3%+) 종목: XXX개

## 배당수익률 Top 5
| 순위 | 종목명 | 코드 | 배당수익률 | PBR | PER |
|------|--------|------|-----------|-----|-----|
| 1 | ... | ... | ... | ... | ... |

## PBR 저평가 현황
- PBR < 1 종목: XXX개 (전체의 XX.X%)
- 시장 상태: [저평가/적정/고평가]

## 오늘의 전략 체크리스트
- 매수 타이밍: 하락일(파란 불)에만 (§2.3)
- 장 시작 후 1시간 매매 자제 (§2.4)
- 지정가 주문 사용 (§2.4)
```
