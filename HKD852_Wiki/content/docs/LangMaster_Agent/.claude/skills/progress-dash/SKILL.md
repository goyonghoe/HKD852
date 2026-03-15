---
name: progress-dash
description: "학습 진도 분석 인터랙티브 HTML 대시보드"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Progress Dashboard — 학습 진도 대시보드 스킬

## 역할

학습자의 진도, 단어 숙련도, SRS 상태를 인터랙티브 HTML로 시각화한다.

## 대시보드 구성

### 1. 요약 카드

- 현재 HSK 레벨 + 진행률 (%)
- 총 학습 단어 수 / 마스터 단어 수
- 연속 플레이 일수 (스트릭)
- 오늘 학습 시간

### 2. 단어 숙련도 맵

- HSK 레벨별 단어 격자 (히트맵)
- 색상: 빨강(미학습) → 노랑(학습중) → 초록(마스터)
- 클릭 시 단어 상세 정보

### 3. SRS 큐 상태

- 오늘 복습 예정 단어 수
- 간격별 분포 (1일/3일/7일/14일/30일)
- 오답 빈도 높은 단어 Top 10

### 4. 학습 추이 그래프

- 일별/주별 신규 단어 수
- 정답률 추이
- 플레이 시간 추이

### 5. 약점 분석

- 자주 틀리는 성조 패턴
- 혼동 쌍 (你/您, 在/再 등)
- 약한 품사 카테고리

## 출력

`LangMaster_Agent/outputs/dashboard_{date}.html`

단독 실행 가능한 HTML (CSS/JS 인라인).
