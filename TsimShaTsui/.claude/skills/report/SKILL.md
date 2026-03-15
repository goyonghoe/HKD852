---
name: tst-report
description: "주제별 인터랙티브 HTML 보고서 생성"
argument-hint: "[주제]"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# TST Report — HTML 보고서 생성

주어진 주제에 대해 인터랙티브 HTML 보고서를 생성하여 `outputs/`에 저장합니다.

## 인자

- `$ARGUMENTS`: 보고서 주제 (필수)

## 실행 절차

1. **주제 분석**
   - `$ARGUMENTS`에서 보고서 주제 파악
   - 주제가 없으면 사용자에게 요청

2. **정보 수집**
   - 프로젝트 내 관련 파일 탐색 (Glob, Grep)
   - 필요 시 웹 검색으로 보충

3. **HTML 보고서 생성**
   - 반응형 디자인 (모바일 대응)
   - 인터랙티브 요소: 접기/펼치기, 탭, 차트 (Chart.js CDN)
   - 한국어 기본, 깔끔한 타이포그래피
   - 다크/라이트 모드 지원

4. **파일 저장**
   - 경로: `outputs/tst_report_YYYYMMDD_HHMMSS.html`
   - 파일명에 타임스탬프 포함

5. **결과 보고**

```markdown
## 보고서 생성 완료

- **주제**: [주제]
- **파일**: `outputs/tst_report_YYYYMMDD_HHMMSS.html`
- **섹션 수**: [N]개
```

## HTML 템플릿 구조

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[보고서 제목]</title>
    <style>
      /* 반응형 + 다크모드 CSS */
    </style>
  </head>
  <body>
    <header><!-- 제목, 날짜, 에이전트 --></header>
    <nav><!-- 목차 --></nav>
    <main><!-- 섹션들 --></main>
    <footer><!-- TsimShaTsui Agent | HKD852 --></footer>
    <script>
      // 인터랙티브 기능 (접기/펼치기, 탭 등)
    </script>
  </body>
</html>
```
