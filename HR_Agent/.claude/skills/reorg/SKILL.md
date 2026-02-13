---
name: reorg
description: "에이전트 팀 재조직 분석 및 효율적 업무 분담 제안"
user-invocable: true
allowed-tools: Read, Write, Glob, Grep
recommended-model: opus
model-reason: "비판적 분석과 전략적 사고 — Opus 권장"
---

# 팀 재조직 분석 스킬

## 실행 절차

### Step 1: 현황 분석

1. 각 에이전트의 역할, 스킬 수, 성숙도 파악
2. 에이전트 간 의존 관계 및 협업 패턴 분석
3. 스킬 중복/공백 영역 식별

### Step 2: 팀 분류 기준

다음 기준으로 팀 재조직 제안:
- **기능 유사성**: 비슷한 도메인의 에이전트 그룹화
- **파이프라인 연계**: 산출물이 연결되는 에이전트 그룹화
- **성숙도 균형**: 성숙 에이전트가 초기 에이전트를 지원
- **독립성**: 고유 워크플로우는 독립 팀 유지

### Step 3: 제안 도출

- 현재 구조 vs 제안 구조 비교표
- 팀 간 협업 관계도
- 예상 효율성 개선 포인트

### Step 4: 보고

마크다운 보고서 생성: `HR_Agent/outputs/reorg_analysis_YYYYMMDD.md`

---

## 현재 기본 팀 구조 제안

| 팀 | 에이전트 | 근거 |
|----|----------|------|
| Game Development | GameDesign_Agent, Hwatu_Roguelike | 게임 기획 전문성 공유 |
| Content Production | PT_Agent, Translate_Agent | 콘텐츠 산출물 연계 |
| Business/Revenue | Income_Factory | 독립 비즈니스 유닛 |
| Art Production | team-kowloon | 특수화된 아트 파이프라인 |
| Infrastructure/Tools | Video_Analyzer, HR_Agent, 루트 스킬 | 전 팀 지원 유틸리티 |
