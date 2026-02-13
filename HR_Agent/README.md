# HR Agent

HKD852 AI 에이전트 조직도 관리 및 시각화 도구

## 기능

- **조직도 생성** (`/org-chart`): 프로젝트 전체 에이전트/스킬 구조를 스캔하여 인터랙티브 HTML 조직도 생성
- **재조직 분석** (`/reorg`): 현재 에이전트 구조를 분석하고 효율적인 팀 재조직 제안

## 사용법

```
/org-chart          # 전체 조직도 HTML 생성
/reorg              # 팀 재조직 분석 실행
```

## 산출물

| 파일 | 설명 |
|------|------|
| `outputs/org_chart_YYYYMMDD.html` | 인터랙티브 조직도 (브라우저에서 열기) |

## 조직도 기능

- 통계 대시보드 (에이전트 수, 스킬 수, 모델 분포)
- 트리 뷰 (펼치기/접기)
- 파이프라인 뷰 (스킬 간 흐름)
- 팀 구성 뷰 (현재 vs 제안)
- 검색 및 필터

## 팀 구조 (제안)

| 팀 | 에이전트 |
|----|----------|
| Game Development | GameDesign_Agent, Hwatu_Roguelike |
| Content Production | PT_Agent, Translate_Agent |
| Business/Revenue | Income_Factory |
| Art Production | team-kowloon |
| Infrastructure/Tools | Video_Analyzer, HR_Agent, 루트 스킬 |
