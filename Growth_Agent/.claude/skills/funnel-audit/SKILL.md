---
name: funnel-audit
description: "AAARRR 퍼널 각 단계 KPI 진단 → 병목 식별 → 개선안 도출"
user-invocable: true
argument-hint: "[서비스명 또는 데이터 파일 경로]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash
recommended-model: opus
model-reason: "복잡한 다단계 퍼널 분석과 비판적 사고 필요 — Opus 최적"
---

# 퍼널 진단 스킬

> AAARRR 프레임워크 기반으로 서비스 퍼널을 진단하고 개선안을 도출합니다.

## 실행 절차

### Step 1: 입력 정보 수집

`$ARGUMENTS`에서 진단 대상을 파악합니다.

- 서비스명 → `Growth_Agent/guides/` 및 관련 에이전트 탐색
- 데이터 파일 → CSV/JSON 형태의 KPI 데이터 파싱
- 없으면 → 가이드 문서 기반 일반 진단 프레임워크 제공

수집 정보:

- 서비스 유형 (모바일 게임, SaaS, 마켓플레이스 등)
- 현재 퍼널 단계별 KPI (있으면)
- 타겟 시장 (KR, NA, CN, JP 등)
- 서비스 단계 (프리런칭, 소프트런칭, 라이브)

### Step 2: AAARRR 현황 분석

각 단계별 진단:

| 단계        | 핵심 지표                  | 진단 항목                  |
| ----------- | -------------------------- | -------------------------- |
| Awareness   | 노출수, 도달률             | 채널별 효율, CPM           |
| Acquisition | 설치수, CPI                | 스토어 전환율, 소스별 품질 |
| Activation  | D0 리텐션, 튜토리얼 완료율 | 온보딩 플로우 이탈         |
| Retention   | D1/D7/D30 리텐션           | 코호트 커브, 이탈 패턴     |
| Revenue     | ARPU, ARPPU, LTV           | 과금률, 과금 구간          |
| Referral    | K-factor, 초대율           | 바이럴 루프 효과           |

### Step 3: 병목 식별

- 각 단계 간 전환율 계산
- 벤치마크 대비 하위 단계 식별
- 가장 큰 임팩트를 줄 수 있는 병목 우선순위화

판정 기준:
| 상태 | 조건 |
|------|------|
| 양호 | 벤치마크 이상 |
| 주의 | 벤치마크 80~100% |
| 위험 | 벤치마크 80% 미만 |
| 긴급 | 벤치마크 50% 미만 |

### Step 4: 개선안 도출

병목 단계별로:

1. 즉시 적용 가능한 퀵윈 (1주 내)
2. 중기 개선안 (1개월 내)
3. 구조적 변경 필요 사항 (분기 단위)

각 개선안에 포함:

- 예상 임팩트 (높음/중간/낮음)
- 구현 난이도
- 관련 HKD852 에이전트 연계

### Step 5: 가이드 참조

분석 시 다음 가이드를 참조합니다:

- `Growth_Agent/guides/mobile-funnel-strategy-guide.html` — AAARRR 전략 상세
- `Growth_Agent/guides/onboarding-funnel-design-guide.html` — 온보딩 최적화

### Step 6: 산출물 저장

산출물 경로: `Growth_Agent/outputs/funnel_audit_YYYY-MM-DD.md`

## 인자 처리

- `$ARGUMENTS`가 비어있으면: 일반 진단 프레임워크 + 체크리스트 제공
- 서비스명 지정 시: 해당 서비스 맞춤 진단
  - 예: `/funnel-audit 화투 로그라이크`
- 데이터 파일 지정 시: 데이터 기반 정량 진단
  - 예: `/funnel-audit data/kpi_202602.csv`

## 에이전트 연계

| 연계 대상        | 연계 내용                                     |
| ---------------- | --------------------------------------------- |
| GameDesign_Agent | Activation/Retention 개선 → 게임 기획 반영    |
| Marketing_Agent  | Awareness/Acquisition 개선 → 마케팅 전략 반영 |
| Income_Factory   | Revenue 개선 → 수익화 전략 반영               |
