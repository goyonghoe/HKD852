---
name: pt-from-design
description: "GameDesign_Agent 분석 결과를 자동으로 프레젠테이션으로 변환합니다"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
recommended-model: sonnet
model-reason: "콘텐츠 구조화 및 코드 생성 — Sonnet 최적"
---

# GameDesign → PT 브릿지 스킬

> GameDesign_Agent의 분석 산출물을 자동으로 발표 자료로 변환하는 크로스-에이전트 서비스

## 트리거 조건

다음 중 하나에 해당하면 이 스킬을 사용:

- "기획 분석 결과를 발표자료로 만들어줘"
- "이 보고서를 PT로 변환"
- GameDesign 워크플로우 후 "발표자료 필요" 판단 시

## 실행 절차

### Step 1: GameDesign 산출물 탐색

최신 GameDesign 분석 결과를 찾는다:

```
Glob: GameDesign_Agent/output/*.html
Glob: GameDesign_Agent/output/*.md
```

사용자가 특정 파일을 지정하면 해당 파일 사용.
지정하지 않으면 가장 최근 파일 자동 선택.

### Step 2: 핵심 콘텐츠 추출

GameDesign 보고서에서 PT 슬라이드에 들어갈 핵심 요소를 추출:

**추출 대상:**
| GameDesign 섹션 | → PT 슬라이드 용도 |
|----------------|------------------|
| 요구사항 요약 | 타이틀 + 배경 슬라이드 |
| 시장 분석 데이터 | 시장 현황 슬라이드 |
| 수익 모델 | 비즈니스 모델 슬라이드 |
| 밸런스 수치 | 핵심 지표 슬라이드 |
| 경쟁작 비교 | 벤치마킹 슬라이드 |
| PD 리뷰 결론 | 의사결정 포인트 슬라이드 |
| 리스크/기회 | 리스크 & 기회 슬라이드 |

### Step 3: PT 파이프라인에 전달

추출된 콘텐츠를 PT_Agent 표준 파이프라인으로 전달:

1. `/pt-reception` 단계에 자동 입력 생성:
   - **What**: GameDesign 분석 제목
   - **Who**: 경영진/PD/투자자 (보고서 유형에 따라)
   - **Why**: 의사결정 지원
   - **How**: 데이터 기반 분석 발표
   - **Palette**: Cyber Neon (게임) 또는 Luxury Executive (경영진)

2. `/pt-content` 단계에 추출된 구조 전달
3. 이후 표준 파이프라인 진행: visual → redteam → manager → export

### Step 4: 출력

산출물 위치: `PT_Agent/outputs/v{N}_{YYYY-MM-DD}/`

표준 PT 산출물:

- SVG 슬라이드
- presentation.html
- presentation.pdf

## 슬라이드 구성 템플릿

GameDesign 보고서 → 10~12장 기본 구성:

```
1. 타이틀 — 분석 주제 + 날짜
2. 배경 — 왜 이 분석이 필요한가
3. 시장 현황 — 시장 규모, 트렌드 (차트)
4. 경쟁 분석 — 경쟁작 비교표
5. 핵심 제안 — 기능/시스템 설계 요약
6. 비즈니스 모델 — 수익화 전략
7. 밸런스 지표 — 핵심 수치 대시보드
8. UX 흐름 — 사용자 경험 플로우
9. 리스크 & 기회 — 2x2 매트릭스
10. 타임라인 — 구현 로드맵
11. PD 의견 — 최종 판정 + 근거
12. Q&A — 연락처 + 다음 단계
```

## 크로스-에이전트 의존성

```
GameDesign_Agent (upstream)
  └── /requirement, /market, /monetize, /balance, /pd-review
       ↓ 분석 결과 파일
PT_Agent (this skill)
  └── /pt-from-design → /pt-reception → ... → /pt-export
       ↓ 발표 자료
Output: presentation.html + presentation.pdf
```
