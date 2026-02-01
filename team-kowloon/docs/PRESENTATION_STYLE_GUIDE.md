# SSBL 프레젠테이션 스타일 가이드

> 현대적이고 전문적인 프레젠테이션 제작을 위한 디자인 시스템

---

## 🎨 디자인 원칙

### 1. **Less is More (간결함)**
- 한 슬라이드에 하나의 핵심 메시지만
- 코드 블록 최소화 (필요시 간단한 예시만)
- 텍스트는 핵심만, 나머지는 시각적으로 표현

### 2. **Visual First (시각 우선)**
- 도표, 아이콘, 그래픽 적극 활용
- 숫자는 큰 폰트로 임팩트 있게
- 컬러로 의미 구분

### 3. **Readable (가독성)**
- 충분한 여백 (line-height: 1.6~2.0)
- 대비가 명확한 색상
- 계층 구조가 명확한 폰트 크기

### 4. **Consistent (일관성)**
- 정해진 컬러 팔레트 사용
- 동일한 레이아웃 패턴 반복
- 아이콘 스타일 통일

---

## 🎨 컬러 시스템

```css
/* Primary Colors */
--primary: #2E3192      /* 메인 브랜드 컬러 (진한 파랑) */
--secondary: #00D4FF    /* 강조 컬러 (밝은 청록) */
--accent: #FF6B9D       /* 포인트 컬러 (핑크) */

/* Functional Colors */
--success: #00E676      /* 성공, 긍정적 */
--warning: #FFD600      /* 주의, 경고 */
--error: #FF5252        /* 오류, 위험 */

/* Text Colors */
--text-dark: #1a1a1a    /* 본문 */
--text-light: #666      /* 보조 설명 */
--text-muted: #999      /* 비활성 */

/* Background */
--bg-light: #f8f9fa     /* 연한 배경 */
--bg-white: #ffffff     /* 흰색 배경 */
```

### 컬러 사용 가이드

| 용도 | 컬러 | 예시 |
|------|------|------|
| 제목 | Primary | 슬라이드 타이틀 |
| 강조 텍스트 | Accent | 중요 키워드 |
| 버튼/배지 | Secondary | CTA, 라벨 |
| 성공/완료 | Success | 체크마크, 완료 상태 |
| 경고 | Warning | 주의사항 |
| 본문 | Text Dark | 일반 텍스트 |
| 설명 | Text Light | 부가 설명 |

---

## ✍️ 타이포그래피

### 폰트 패밀리
```css
font-family: 'Noto Sans KR', sans-serif;
```

### 폰트 크기 체계

| 요소 | 크기 | 용도 |
|------|------|------|
| H1 | 3.5em (56px) | 메인 타이틀 |
| H2 | 2.5em (40px) | 섹션 타이틀 |
| H3 | 1.8em (29px) | 서브 타이틀 |
| H4 | 1.4em (22px) | 카드 제목 |
| Body | 1.3em (21px) | 본문 |
| Small | 1.0em (16px) | 보조 설명 |

### 폰트 굵기

| Weight | 값 | 용도 |
|--------|-----|------|
| Light | 300 | 부가 설명 |
| Regular | 400 | 본문 |
| Medium | 500 | 소제목 |
| Bold | 700 | 강조, 제목 |
| Black | 900 | 메인 타이틀 |

### 줄 간격

```css
/* 제목 */
line-height: 1.2~1.3

/* 본문 */
line-height: 1.6~1.8

/* 리스트 */
line-height: 1.8~2.0
```

---

## 📐 레이아웃 시스템

### Grid 시스템

```css
/* 2열 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* 3열 */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

/* 4열 (2x2) */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}
```

### 여백 (Spacing)

| 크기 | 값 | 용도 |
|------|-----|------|
| XS | 0.5rem (8px) | 아이콘-텍스트 간격 |
| S | 1rem (16px) | 문단 간격 |
| M | 1.5rem (24px) | 요소 간격 |
| L | 2rem (32px) | 섹션 간격 |
| XL | 3rem (48px) | 큰 섹션 간격 |

### 둥근 모서리 (Border Radius)

```css
border-radius: 12px;  /* 일반 카드 */
border-radius: 16px;  /* 큰 카드 */
border-radius: 20px;  /* 통계 카드 */
border-radius: 24px;  /* 메인 카드 */
border-radius: 50%;   /* 원형 (배지, 아이콘) */
```

---

## 🎴 컴포넌트

### 1. Card (카드)

```html
<div class="card">
  <h4>제목</h4>
  <p>내용</p>
</div>
```

**특징:**
- 흰색 배경
- 그림자: `box-shadow: 0 10px 40px rgba(0,0,0,0.08)`
- Hover 효과: `transform: translateY(-5px)`

### 2. Stat Card (통계 카드)

```html
<div class="stat-card">
  <div class="stat-number">70%</div>
  <div class="stat-label">시간 절감</div>
</div>
```

**용도:** 큰 숫자로 임팩트 전달

### 3. Process Step (프로세스 단계)

```html
<div class="process-step">
  <span class="step-number">1</span>
  <strong>제목</strong>
  <p>설명</p>
</div>
```

**용도:** 순차적 흐름 표현

### 4. Badge (배지)

```html
<span class="badge badge-primary">라벨</span>
```

**종류:**
- `badge-primary`: 파랑
- `badge-success`: 초록
- `badge-accent`: 핑크

### 5. Highlight Box (하이라이트 박스)

```html
<div class="highlight-box">
  <p>강조할 내용</p>
</div>
```

**용도:** 핵심 메시지 강조

### 6. Icon Box (아이콘 박스)

```html
<div class="icon-box">
  <div class="icon">🎯</div>
  <h4>제목</h4>
  <p>설명</p>
</div>
```

**용도:** 기능 소개, 특징 설명

---

## 📊 슬라이드 타입별 가이드

### 타이틀 슬라이드

```
✅ DO:
- 그라디언트 배경
- 큰 타이틀 (3.5em)
- 서브타이틀 (1.8em)
- 배지로 핵심 키워드 강조

❌ DON'T:
- 너무 많은 텍스트
- 여러 색상 혼용
- 복잡한 레이아웃
```

### 콘텐츠 슬라이드

```
✅ DO:
- 섹션 서브타이틀 (PROBLEM, SOLUTION 등)
- 제목은 질문 형태로
- Grid로 정보 구조화
- 아이콘으로 시각화

❌ DON'T:
- 긴 문장
- 코드 블록
- 복잡한 표
```

### 비교 슬라이드

```
✅ DO:
- Before/After 명확히 구분
- 색상으로 대비 (빨강/초록)
- 이모지 활용
- 간단한 리스트

❌ DON'T:
- 중립적 색상
- 복잡한 설명
```

### 통계 슬라이드

```
✅ DO:
- 큰 숫자 (4em 이상)
- Grid 레이아웃
- 그라디언트 배경
- 간단한 라벨

❌ DON'T:
- 작은 폰트
- 복잡한 차트
- 긴 설명
```

---

## 🎯 슬라이드 구성 원칙

### 슬라이드당 정보량

| 요소 | 최대 개수 |
|------|----------|
| 핵심 메시지 | 1개 |
| 리스트 항목 | 3-5개 |
| 카드 | 3-4개 |
| 텍스트 줄 | 3-4줄 |

### 3-3-3 규칙

1. **3초 안에 주제 파악**
   - 명확한 타이틀
   - 시각적 계층 구조

2. **3개 이하의 핵심 포인트**
   - 너무 많은 정보 금지
   - 핵심만 전달

3. **3가지 시각 요소**
   - 텍스트
   - 색상/아이콘
   - 레이아웃

---

## 🚫 피해야 할 것

### 절대 하지 말 것

1. **코드 블록 남발**
   - 기술 문서가 아님
   - 필요시 아주 간단한 예시만

2. **긴 문장**
   - 한 줄은 최대 60자
   - 문단은 3-4줄 이내

3. **복잡한 표**
   - 표 대신 카드나 리스트
   - 필요시 매우 간단하게

4. **너무 많은 색상**
   - 정해진 컬러 팔레트만
   - 한 슬라이드 3가지 색상 이내

5. **작은 폰트**
   - 최소 1.0em (16px) 이상
   - 가독성 최우선

---

## 🚫 화면 오버플로우 방지 규칙

### ⚠️ 절대 규칙

**모든 콘텐츠는 화면 안에 수납되어야 합니다!**

### 1. 콘텐츠 제약 시스템

```css
/* 모든 슬라이드에 적용 */
.content-container {
    max-width: 90%;
    margin: 0 auto;
    max-height: calc(100vh - 150px);
}
```

### 2. 슬라이드당 콘텐츠 제한

| 요소 | 최대 개수 | 대안 |
|------|----------|------|
| 프로세스 스텝 | 4개 | 2x2 Grid로 변경 |
| 리스트 항목 | 5개 | 6개 이상 시 분할 |
| 카드 (세로) | 2개 | 3개 이상 시 Grid |
| 문단 | 3개 | compact 클래스 사용 |

### 3. 크기 조정 우선순위

오버플로우 발생 시 **이 순서대로** 축소:

1. **마진/패딩** (가장 먼저)
   - `margin: 2rem` → `1rem` → `0.5rem`
   - `padding: 2rem` → `1.5rem` → `1rem`

2. **폰트 크기**
   - `font-size: 1.3em` → `1.1em` → `1em`
   - `line-height: 1.8` → `1.5` → `1.3`

3. **콘텐츠 수**
   - 항목 5개 → 4개 → 3개
   - Grid 3열 → 2열

4. **요소 제거** (최후의 수단)
   - 부가 설명 제거
   - 화살표 제거
   - 장식 요소 제거

### 4. Compact 클래스 활용

```css
.compact {
    margin: 0.3rem 0 !important;
    padding: 0.8rem !important;
}
```

**사용 예:**
```html
<div class="process-step compact">...</div>
<div class="card compact">...</div>
```

### 5. 슬라이드 제작 체크리스트

각 슬라이드 완성 후 **반드시** 확인:

- [ ] 화면 하단 여백 충분 (최소 50px)
- [ ] 스크롤 없이 전체 보임
- [ ] 1080p 화면 기준 (1920x1080)
- [ ] 브라우저 주소창 고려
- [ ] 모든 텍스트 읽기 가능

### 6. 오버플로우 방지 템플릿

**안전한 슬라이드 구조:**

```html
<section>
    <div class="section-subtitle">CATEGORY</div>
    <h2>제목 (최대 15자)</h2>

    <div class="content-container">
        <!-- 콘텐츠: 최대 높이 자동 제한 -->
        <div class="grid-2">
            <div class="card compact">...</div>
            <div class="card compact">...</div>
        </div>

        <!-- 하이라이트 (옵션) -->
        <div class="highlight-box">
            <p>핵심 메시지 1줄</p>
        </div>
    </div>
</section>
```

---

## ✅ 체크리스트

프레젠테이션 완성 후 확인:

### 디자인
- [ ] 컬러 팔레트 일관성
- [ ] 폰트 크기 적절
- [ ] 충분한 여백
- [ ] 시각적 계층 구조

### 콘텐츠
- [ ] 슬라이드당 하나의 메시지
- [ ] 비개발자도 이해 가능
- [ ] 코드 블록 최소화
- [ ] 시각 자료 충분

### 오버플로우 방지 ⭐ NEW
- [ ] 모든 슬라이드 화면 안에 수납
- [ ] 하단 여백 충분 (50px+)
- [ ] 1080p 화면 테스트 완료
- [ ] compact 클래스 적절히 사용

### 접근성
- [ ] 색상 대비 충분
- [ ] 폰트 크기 적절
- [ ] 명확한 구조

---

## 📚 참고 자료

### 영감을 얻을 수 있는 곳

1. **Apple Keynote 디자인**
   - 미니멀한 디자인
   - 큰 숫자, 간결한 텍스트

2. **Google I/O 프레젠테이션**
   - 밝은 색상
   - 명확한 아이콘

3. **Stripe 제품 페이지**
   - 그라디언트 활용
   - 카드 레이아웃

### 도구

- **아이콘**: Emojis (🎯, 🎨, ✅, 💾)
- **폰트**: Noto Sans KR (한글 최적화)
- **컬러 팔레트 도구**: Coolors.co

---

## 🔄 버전 히스토리

- **v1.0** (2026-02-01): 초기 가이드 작성
  - 컬러 시스템 정의
  - 타이포그래피 가이드
  - 컴포넌트 라이브러리

---

**이 가이드를 따라 모든 SSBL 프레젠테이션을 제작하세요!**
