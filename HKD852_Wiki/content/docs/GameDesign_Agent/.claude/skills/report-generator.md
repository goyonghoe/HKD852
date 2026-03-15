---
name: report
description: "HTML 분석 보고서 생성"
user-invocable: true
recommended-model: sonnet
model-reason: "HTML 코드 생성 — Sonnet 최적"
---

# 보고서 생성기 (Report Generator)

슬래시 명령어: `/report`

## 역할

GameDesign Agent 스킬들의 분석 결과를 공유하기 쉬운 HTML 보고서로 생성합니다.

## 파일명 규칙

```
[프로젝트명]_Report_YYYYMMDD-HHMMSS.html

예시:
- CRM_Analysis_Report_20260203-143052.html
- NewFeature_Review_Report_20260203-150000.html
```

## 보고서 구조

```html
1. 헤더 - 프로젝트명 - 분석일시 - 최종 평가 결과 2. 목차 (네비게이션) - 사용된
스킬별 링크 3. 핵심 요구사항 - 원본 요청 요약 4. 스킬별 분석 결과 (사용된
스킬만) - /requirement: 요구사항 분석 - /coordinate: 작업 분배 - /monetize:
수익화 분석 - /ux: UX 분석 - /balance: 밸런스 분석 - /concept: 컨셉 디자인 -
/proposal: 제안서 - /market: 시장 분석 - /liveops: 라이브옵스 분석 5. 종합 평가
(/pd-review) - 평가 점수 - 잘된 점 / 개선 필요 - 리스크 요약 6. 회의 결정 사항 /
Next Steps 7. 푸터 - 생성 정보
```

## HTML 템플릿 스타일

### 컬러 팔레트 (다크 모드)

```css
--bg-primary: #0d1117;
--bg-secondary: #161b22;
--bg-tertiary: #21262d;
--text-primary: #f0f6fc;
--text-secondary: #8b949e;
--accent-blue: #58a6ff;
--accent-green: #3fb950;
--accent-yellow: #d29922;
--accent-red: #f85149;
--accent-purple: #a371f7;
--border-color: #30363d;
```

### 상태 표시

```html
<span class="status-good">✅ 양호</span>
<span class="status-warning">⚠️ 주의</span>
<span class="status-danger">🔴 위험</span>
```

### 뱃지

```html
<span class="badge badge-must">Must</span>
<span class="badge badge-should">Should</span>
<span class="badge badge-could">Could</span>
```

## 생성 명령

```bash
# 타임스탬프 생성
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# 파일 저장
output/[프로젝트명]_Report_${TIMESTAMP}.html
```

## 출력 예시

```yaml
보고서_생성_결과:
  파일명: "CRM_Analysis_Report_20260203-143052.html"
  경로: "output/CRM_Analysis_Report_20260203-143052.html"
  크기: "~150KB"
  포함_스킬:
    - /requirement
    - /coordinate
    - /monetize
    - /ux
    - /balance
    - /pd-review
  생성_시간: "2026-02-03 14:30:52"
```

## 사용법

1. 스킬 분석 완료 후 `/report` 호출
2. 프로젝트명 지정 (미지정 시 자동 생성)
3. HTML 파일 자동 생성
4. 브라우저에서 열거나 공유

## 필수 포함 요소

### 메타 정보

- 분석 대상
- 분석일시
- 사용된 스킬 목록
- 최종 평가 등급

### 스킬별 섹션

- 섹션 아이콘
- 스킬 태그 (`/skill-name`)
- 핵심 발견 사항
- 테이블/리스트 형식 데이터
- 하이라이트 박스 (경고/위험/성공)

### 액션 아이템

- 우선순위 표시
- 담당자/담당 스킬
- 다음 단계

## 규칙

- 단일 HTML 파일 (외부 CSS/JS 의존성 없음)
- 반응형 디자인 (모바일 대응)
- 다크 모드 기본 (가독성 최적화)
- 인쇄 친화적 스타일 포함
- 파일명에 타임스탬프 필수

분석 결과를 받아 HTML 보고서를 생성하세요.
