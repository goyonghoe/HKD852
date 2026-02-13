---
name: pt-export
description: "PT 내보내기 - SVG 슬라이드들을 HTML/PDF 단일 파일로 통합 내보내기"
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Bash, Glob
recommended-model: haiku
model-reason: "단순 파일 변환/통합 작업이므로 Haiku 모델 권장"
---

# 내보내기 에이전트

완성된 SVG 슬라이드들을 공유하기 쉬운 단일 파일(HTML, PDF)로 통합합니다.

## 모델 권장사항

이 스킬은 **Haiku** 모델을 권장합니다:
- 템플릿 기반 파일 생성
- 단순 변환 작업
- 빠른 처리 속도 필요

---

## 입력

- SVG 슬라이드가 있는 폴더 경로
- 프레젠테이션 메타데이터 (제목, 날짜, 버전)

## 출력 파일

```
PT_Agent/outputs/v{N}_{YYYY-MM-DD}/
├── slide_01_*.svg
├── slide_02_*.svg
├── ...
├── presentation.html    ← 통합 HTML (뷰어 포함)
└── presentation.pdf     ← 인쇄용 PDF
```

---

## HTML 통합 템플릿

다음 템플릿을 사용하여 `presentation.html`을 생성합니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{TITLE} - {DATE}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0F172A;
      color: #F8FAFC;
      min-height: 100vh;
    }

    /* 프레젠테이션 모드 */
    .presentation-mode {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .presentation-mode.active {
      display: flex;
    }

    .presentation-mode .slide {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* 썸네일 그리드 모드 */
    .grid-mode {
      padding: 40px;
    }

    .header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 1px solid #334155;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header .meta {
      color: #94A3B8;
      font-size: 14px;
    }

    .slides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .slide-card {
      background: #1E293B;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .slide-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }

    .slide-card img {
      width: 100%;
      display: block;
    }

    .slide-card .slide-number {
      padding: 12px 16px;
      font-size: 14px;
      color: #94A3B8;
      border-top: 1px solid #334155;
    }

    /* 컨트롤 */
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      border-radius: 12px;
      display: flex;
      gap: 16px;
      align-items: center;
      z-index: 1001;
    }

    .controls button {
      background: #334155;
      border: none;
      color: #F8FAFC;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .controls button:hover {
      background: #475569;
    }

    .controls .slide-counter {
      color: #94A3B8;
      font-size: 14px;
      min-width: 80px;
      text-align: center;
    }

    /* 키보드 힌트 */
    .keyboard-hint {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.9);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      color: #64748B;
    }

    @media print {
      .controls, .keyboard-hint, .header { display: none; }
      .slides-grid { display: block; }
      .slide-card {
        page-break-after: always;
        border-radius: 0;
        box-shadow: none;
      }
      .slide-card .slide-number { display: none; }
    }
  </style>
</head>
<body>
  <!-- 그리드 모드 -->
  <div class="grid-mode">
    <div class="header">
      <h1>{TITLE}</h1>
      <div class="meta">{DATE} · {SLIDE_COUNT} slides · {VERSION}</div>
    </div>
    <div class="slides-grid">
      {SLIDE_CARDS}
    </div>
  </div>

  <!-- 프레젠테이션 모드 -->
  <div class="presentation-mode" id="presentationMode">
    <img class="slide" id="currentSlide" src="" alt="Slide">
  </div>

  <!-- 컨트롤 -->
  <div class="controls" id="controls" style="display: none;">
    <button onclick="prevSlide()">← Prev</button>
    <span class="slide-counter" id="slideCounter">1 / {SLIDE_COUNT}</span>
    <button onclick="nextSlide()">Next →</button>
    <button onclick="exitPresentation()">Exit (ESC)</button>
  </div>

  <div class="keyboard-hint">
    Click any slide to present · Arrow keys to navigate · ESC to exit
  </div>

  <script>
    const slides = [{SLIDE_ARRAY}];
    let currentIndex = 0;
    let isPresentationMode = false;

    function startPresentation(index) {
      currentIndex = index;
      isPresentationMode = true;
      document.getElementById('presentationMode').classList.add('active');
      document.getElementById('controls').style.display = 'flex';
      document.querySelector('.keyboard-hint').style.display = 'none';
      updateSlide();
    }

    function exitPresentation() {
      isPresentationMode = false;
      document.getElementById('presentationMode').classList.remove('active');
      document.getElementById('controls').style.display = 'none';
      document.querySelector('.keyboard-hint').style.display = 'block';
    }

    function updateSlide() {
      document.getElementById('currentSlide').src = slides[currentIndex];
      document.getElementById('slideCounter').textContent =
        `${currentIndex + 1} / ${slides.length}`;
    }

    function nextSlide() {
      if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlide();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (!isPresentationMode) return;

      switch(e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          prevSlide();
          break;
        case 'Escape':
          exitPresentation();
          break;
      }
    });
  </script>
</body>
</html>
```

## 슬라이드 카드 템플릿

각 슬라이드에 대해:

```html
<div class="slide-card" onclick="startPresentation({INDEX})">
  <img src="{SLIDE_FILENAME}" alt="Slide {NUMBER}">
  <div class="slide-number">Slide {NUMBER}: {SLIDE_TITLE}</div>
</div>
```

---

## PDF 생성 방법

### 옵션 1: 브라우저 인쇄 (권장)

```bash
# HTML을 브라우저에서 열고 Ctrl+P (Cmd+P) → PDF로 저장
open presentation.html
```

### 옵션 2: Puppeteer (Node.js)

```bash
# puppeteer가 설치된 경우
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://${PWD}/presentation.html');
  await page.pdf({
    path: 'presentation.pdf',
    format: 'A4',
    landscape: true,
    printBackground: true
  });
  await browser.close();
})();
"
```

### 옵션 3: wkhtmltopdf

```bash
# wkhtmltopdf가 설치된 경우
wkhtmltopdf --orientation Landscape --page-size A4 presentation.html presentation.pdf
```

---

## 실행 프로세스

1. **SVG 파일 스캔**
   ```bash
   ls -1 slide_*.svg | sort
   ```

2. **HTML 생성**
   - 템플릿의 플레이스홀더 치환
   - `{SLIDE_CARDS}`: 슬라이드 카드 HTML 생성
   - `{SLIDE_ARRAY}`: JavaScript 배열로 파일명 목록

3. **PDF 생성 시도**
   - puppeteer 또는 wkhtmltopdf 사용
   - 실패 시 브라우저 인쇄 안내

4. **완료 메시지**
   ```
   ✅ 내보내기 완료:
   - HTML: presentation.html (브라우저에서 바로 발표 가능)
   - PDF: presentation.pdf (인쇄/공유용)
   ```

---

## 사용 예시

```
# 파이프라인에서 자동 호출
/pt-export outputs/v8_2026-02-04

# 수동 호출
/pt-export [폴더경로]
```

---

# Marp 기반 PDF 변환 (권장)

> **고품질 PDF가 필요한 경우 Marp CLI 사용을 권장합니다.**

## Marp CLI 명령어

```bash
# 기본 PDF 변환
npx @marp-team/marp-cli input.md --pdf -o output.pdf

# 로컬 파일 접근 허용 (이미지 포함 시)
npx @marp-team/marp-cli input.md --pdf --allow-local-files -o output.pdf

# HTML 변환
npx @marp-team/marp-cli input.md --html -o output.html
```

## 고품질 템플릿 사용

```bash
# 고품질 템플릿 기반으로 작성
cp PT_Agent/templates/marp_quality.md my_presentation.md

# 내용 작성 후 PDF 변환
npx @marp-team/marp-cli my_presentation.md --pdf --allow-local-files -o my_presentation.pdf
```

---

# PDF 품질 체크리스트

변환 전 반드시 확인:

```
[테마 & 배경]
□ 밝은 배경 (#FFFFFF) 사용 - PDF 가독성 최고
□ 다크 테마 사용 시 텍스트 대비 확인

[폰트]
□ 시스템 폰트 사용 (깨짐 방지)
   - 한글: 'Apple SD Gothic Neo', 'Malgun Gothic'
   - 영문: sans-serif (기본)
□ 웹폰트, 커스텀 폰트 사용 금지

[색상]
□ 그라디언트 텍스트 금지 (렌더링 문제)
□ 강조색 단일 색상으로 통일
□ 텍스트 색상 충분히 대비 (#333333 이하)

[크기]
□ 제목: 44px 이상
□ 본문: 22px 이상
□ 테이블: 18px 이상

[스타일]
□ 복잡한 CSS 애니메이션 제거
□ box-shadow, filter 최소화
□ 테이블 border 명확하게
```

## 문제 발생 시 해결책

| 문제 | 원인 | 해결 |
|------|------|------|
| 폰트 깨짐 | 웹폰트 사용 | 시스템 폰트로 변경 |
| 색상 이상 | 그라디언트 텍스트 | 단색으로 변경 |
| 레이아웃 깨짐 | 복잡한 CSS | 단순화 |
| 글자 안 보임 | 대비 부족 | 밝은 배경 + 어두운 텍스트 |

---

# 권장 워크플로우

```
1. marp_quality.md 템플릿 복사
2. 내용 작성 (밝은 테마 유지)
3. 품질 체크리스트 확인
4. Marp CLI로 PDF 변환
5. PDF 열어서 최종 확인
```

**템플릿 위치**: `PT_Agent/templates/marp_quality.md`
