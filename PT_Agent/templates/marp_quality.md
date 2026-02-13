---
marp: true
theme: default
paginate: true
style: |
  /*
   * PT_Agent 고품질 템플릿 v2
   * - 밝은 테마 (가독성 최우선)
   * - PDF 변환 검증됨
   * - 시스템 폰트 (깨짐 방지)
   *
   * 최종 검증: 2026-02-06
   */

  /* ========================================
     1. 기본 설정 - 밝은 배경, 높은 대비
     ======================================== */
  section {
    background: #ffffff;
    color: #222222;
    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
    padding: 50px 70px;
    font-size: 22px;
    line-height: 1.6;
  }

  /* ========================================
     2. 제목 스타일
     ======================================== */
  h1 {
    color: #1a1a1a;
    font-size: 44px;
    font-weight: 700;
    margin-bottom: 30px;
    border-bottom: 3px solid var(--accent, #FF6B6B);
    padding-bottom: 15px;
  }

  h2 {
    color: #333333;
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 25px;
  }

  h3 {
    color: #444444;
    font-size: 26px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  /* ========================================
     3. 본문 스타일
     ======================================== */
  p, li {
    font-size: 22px;
    line-height: 1.7;
    color: #333333;
  }

  ul, ol {
    margin-left: 15px;
  }

  li {
    margin-bottom: 10px;
  }

  /* ========================================
     4. 강조 - 단일 색상으로 명확하게
     ======================================== */
  strong {
    color: var(--accent, #FF6B6B);
    font-weight: 700;
  }

  em {
    color: #555555;
    font-style: italic;
  }

  /* ========================================
     5. 코드 블록 - 밝은 배경
     ======================================== */
  code {
    background: #f5f5f5;
    color: #333333;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 18px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  }

  pre {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
  }

  pre code {
    background: transparent;
    font-size: 16px;
    padding: 0;
  }

  /* ========================================
     6. 테이블 - 명확한 구분
     ======================================== */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 18px;
    margin: 20px 0;
  }

  th {
    background: var(--accent, #FF6B6B);
    color: white;
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 12px 15px;
    border-bottom: 1px solid #e0e0e0;
  }

  tr:nth-child(even) {
    background: #f9f9f9;
  }

  /* ========================================
     7. 타이틀 슬라이드 (컬러풀 허용)
     ======================================== */
  section.title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  section.title h1 {
    color: white;
    font-size: 52px;
    border: none;
    margin-bottom: 20px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  section.title h2 {
    color: rgba(255,255,255,0.9);
    font-size: 28px;
    font-weight: 400;
  }

  section.title p {
    color: rgba(255,255,255,0.8);
    font-size: 22px;
  }

  /* ========================================
     8. 섹션 구분 슬라이드
     ======================================== */
  section.section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: #f8f9fa;
  }

  section.section h1 {
    font-size: 48px;
    border: none;
    color: #333333;
  }

  /* ========================================
     9. 인용 슬라이드
     ======================================== */
  section.quote {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  blockquote {
    font-size: 28px;
    font-style: italic;
    color: #444444;
    border-left: 4px solid var(--accent, #FF6B6B);
    padding-left: 30px;
    margin: 0;
    max-width: 80%;
  }

  /* ========================================
     10. 페이지 번호
     ======================================== */
  section::after {
    color: #999999;
    font-size: 14px;
  }

  /* ========================================
     11. 강조 박스
     ======================================== */
  .highlight-box {
    background: #f0f7ff;
    border-left: 4px solid var(--accent, #FF6B6B);
    padding: 20px;
    border-radius: 0 8px 8px 0;
    margin: 20px 0;
  }

  /* ========================================
     12. 이미지 스타일
     ======================================== */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  /* ========================================
     13. 엔딩 슬라이드
     ======================================== */
  section.ending {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  section.ending h1 {
    color: white;
    font-size: 48px;
    border: none;
  }

  section.ending p {
    color: rgba(255,255,255,0.9);
    font-size: 24px;
  }
---

<!--
================================================================================
PT_Agent 고품질 템플릿 v2
================================================================================

[사용 가이드]

1. 타이틀 슬라이드: <!-- _class: title -->
2. 섹션 구분: <!-- _class: section -->
3. 인용: <!-- _class: quote -->
4. 엔딩: <!-- _class: ending -->
5. 페이지 번호 숨김: <!-- _paginate: false -->

[강조색 변경]
CSS 변수 --accent를 변경하여 전체 강조색 조정 가능

[품질 체크리스트]
□ 밝은 배경 사용
□ 제목 44px 이상
□ 본문 22px 이상
□ 단일 강조색만 사용
□ 테이블 헤더 색상 통일
□ 코드 블록 밝은 배경

================================================================================
-->

<!-- _class: title -->
<!-- _paginate: false -->

# 프레젠테이션 제목

## 부제목 또는 핵심 메시지

발표자 / 날짜

---

# 아젠다

1. **첫 번째 주제** — 간단한 설명
2. **두 번째 주제** — 간단한 설명
3. **세 번째 주제** — 간단한 설명

---

<!-- _class: section -->

# 첫 번째 섹션

---

# 슬라이드 제목

## 부제목 (선택)

- 첫 번째 포인트
- 두 번째 포인트
- **강조할 내용**은 이렇게

---

# 데이터 테이블

| 항목 | Before | After | 개선 |
|------|:------:|:-----:|:----:|
| 속도 | 10초 | 2초 | **80%** |
| 비용 | $100 | $20 | **80%** |
| 품질 | 60점 | 95점 | **58%** |

---

# 코드 예시

```bash
# 설치
npm install -g @anthropic-ai/claude-code

# 실행
claude "작업 내용"
```

---

<!-- _class: quote -->

> "인용문은 이렇게 표시합니다.
> 두 줄도 자연스럽게 연결됩니다."

— 출처

---

# 핵심 요약

| 기능 | 효과 |
|------|------|
| 기능 A | 효과 설명 |
| 기능 B | 효과 설명 |

**결론**: 핵심 메시지를 한 문장으로

---

<!-- _class: ending -->
<!-- _paginate: false -->

# 감사합니다

질문이 있으시면 말씀해주세요

연락처 정보
