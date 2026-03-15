---
name: invest-dashboard
description: "투자 대시보드 상태 요약 — 포트폴리오 현황, 최근 일지, 오늘의 브리핑 링크를 한눈에 확인"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash(date *), Bash(wc *)
---

# 투자 대시보드 상태 요약

Invest_Agent의 전체 상태를 CLI에서 빠르게 확인합니다.

## 참조 파일

- 투자 전략: `Invest_Agent/docs/strategy.md`
- 투자 일지: `Invest_Agent/data/journal.jsonl`
- 포트폴리오: `Invest_Agent/data/portfolio.jsonl`
- 브리핑 산출물: `Invest_Agent/outputs/brief_*.md`

## 표시 항목

### 1. 포트폴리오 요약

- `data/portfolio.jsonl` 읽기 (없으면 "아직 포트폴리오 미등록")
- 보유 종목 수, 총 투자금액, ETF/주식 비율

### 2. 최근 투자 일지

- `data/journal.jsonl` 읽기 (없으면 "아직 일지 없음")
- 최근 3건 요약 (날짜, 유형, 종목, 가격)

### 3. 오늘의 브리핑

- `outputs/brief_YYYYMMDD.md` 존재 확인
- 있으면: 핵심 요약 (금리, 시장 상태)
- 없으면: "`/market-brief` 스킬로 오늘의 브리핑 생성 가능"

### 4. 전략 리마인더

- 현재 투자 단계 판단 (§3.1~§3.4)
  - 포트폴리오 없음 → "1단계: 지수 ETF 분할 매수부터 시작하세요"
  - ETF만 보유 → "1단계 진행 중. 매일 분할 매수 유지"
  - ETF + 배당주 → "2단계: 배당주 캘린더 매매 활용"
  - 개별 주식 포함 → "3단계: 주도주 발굴 중"

## 출력 형식

```
╔══════════════════════════════════════╗
║       투자 대시보드 상태 요약         ║
╚══════════════════════════════════════╝

📊 포트폴리오
  보유 종목: X개 (ETF X개, 주식 X개)
  총 투자금: X,XXX,XXX원
  바벨 비율: ETF XX% / 주식 XX%

📝 최근 투자 일지
  YYYY-MM-DD  매수  삼성전자  72,000원 × 10주
  YYYY-MM-DD  매도  카카오    55,000원 × 5주
  ...

📰 오늘의 브리핑
  [브리핑 요약 또는 생성 안내]

🎯 현재 단계
  1단계: 지수 ETF 분할 매수
  → 코스피 200 ETF를 매일 꾸준히 나눠 매수하세요

🌐 대시보드: https://invest-dashboard-azure.vercel.app
```
