# Launch Guide — AI Product Photo Prompt Master Pack

런칭일: "2026-02-07"
프로젝트: "proj-20260207-gumroad"
플랫폼: "Gumroad (메인) + Etsy (보조)"
상태: "ready_to_launch"

---

## Gumroad 런칭 체크리스트

### 1. 파일 준비
- [ ] `AI-Product-Photo-Prompt-Master-Pack.md` → PDF 변환
  - 방법 A: `pandoc AI-Product-Photo-Prompt-Master-Pack.md -o AI-Product-Photo-Prompt-Master-Pack.pdf --pdf-engine=wkhtmltopdf`
  - 방법 B: VS Code에서 Markdown PDF 확장으로 변환
  - 방법 C: 브라우저에서 마크다운 열기 → 인쇄 → PDF 저장
- [ ] `cover.html` → PNG 변환
  - 브라우저에서 열기 → 스크린샷 (1600x900)
  - 또는 `wkhtmltoimage cover.html cover.png`
- [ ] 무료 샘플 PDF 분리 (카테고리별 1개씩 = 10개 프롬프트)

### 2. Gumroad 상품 설정
- [ ] https://gumroad.com 로그인
- [ ] "New Product" 클릭
- [ ] 타입: "Digital Product"
- [ ] 상품명: **AI Product Photo Prompt Master Pack — 200+ Prompts for Midjourney, DALL-E & Stable Diffusion**
- [ ] 가격: **$9.99** (런칭 특가, 1주 후 $19.99로 변경)
- [ ] 카테고리: Design > Photography

### 3. 상품 설명 (아래 복사 붙여넣기)

> `gumroad-listing.md` 파일의 "Full Description" 섹션 전체를 복사하여 붙여넣기

### 4. 파일 업로드
- [ ] 메인 파일: `AI-Product-Photo-Prompt-Master-Pack.pdf`
- [ ] 커버 이미지: `cover.png` (1600x900)

### 5. 태그
```
AI prompts, product photography, Midjourney prompts, DALL-E prompts, e-commerce photography, product photos, Etsy seller tools, Amazon FBA, Shopify, digital download, prompt pack, AI photography
```

### 6. 설정
- [ ] "Allow customers to pay what they want" → OFF (고정 가격)
- [ ] "Offer a free sample" → ON (무료 샘플 PDF 연결)
- [ ] "Content rating" → Everyone

### 7. Publish
- [ ] **"Publish" 클릭**
- [ ] 상품 URL 복사: `https://[username].gumroad.com/l/[slug]`

---

## Etsy 런칭 체크리스트 (보조 채널)

### 1. 리스팅 생성
- [ ] https://www.etsy.com/sell 접속
- [ ] "List an item" 클릭
- [ ] **디지털 상품** 선택

### 2. 상품 정보
- [ ] 제목: **200+ AI Product Photography Prompts | Midjourney DALL-E Stable Diffusion | E-commerce Photo Prompts | Digital Download**
- [ ] 설명: `gumroad-listing.md` 내용 기반으로 Etsy 스타일 변환
- [ ] 카테고리: Craft Supplies & Tools > Digital Downloads
- [ ] 가격: $19.99

### 3. 태그 (최대 13개)
```
AI prompts, product photography, Midjourney prompts, DALL-E prompts, ecommerce photos, product photo prompts, AI photography, digital download, Shopify seller, Amazon FBA, Etsy seller tools, prompt pack, photo editing
```

### 4. 파일
- [ ] `AI-Product-Photo-Prompt-Master-Pack.pdf` 업로드
- [ ] 프리뷰 이미지: `cover.png` + 내부 페이지 스크린샷 2~3장

### 5. AI 공시
- [ ] "Was AI used to create this listing?" → Yes (설명에 AI 도구 사용 명시)

### 6. Publish
- [ ] **"Publish" 클릭**

---

## 마케팅 초기 액션 (런칭 당일)

### Reddit (가장 중요)
- [ ] **r/ecommerce** — "I made 200+ AI prompts specifically for product photography. Here's 10 free ones."
  - 무료 샘플 10개 본문에 포함
  - Gumroad 링크는 댓글에
- [ ] **r/Etsy** — "How I use AI to create product photos for my Etsy shop (free prompts inside)"
- [ ] **r/AmazonSeller** — "Free AI prompts for product listing photos"
- [ ] **r/midjourney** — "200+ product photography prompts I crafted for e-commerce sellers"
- [ ] **r/StableDiffusion** — 동일 포스트

### Twitter/X
- [ ] 런칭 트윗:
```
🚀 Just launched: AI Product Photo Prompt Master Pack

200+ prompts for stunning product photos using Midjourney & DALL-E.

10 categories: Fashion, Jewelry, Food, Cosmetics, Electronics + 5 more.

Skip the $500 studio. Generate pro shots in seconds.

Launch price: $9.99 (50% off)
→ [Gumroad link]
```

### Product Hunt
- [ ] https://www.producthunt.com/posts/new 접속
- [ ] 제출 (해당 카테고리: Productivity, Design Tools)

### 한국 커뮤니티
- [ ] 디스콰이엇 (disquiet.io) — 사이드 프로젝트 공유
- [ ] 클리앙 팁과강좌 — "AI로 상품사진 만들기 (무료 프롬프트 10개 공유)"

---

## 런칭 후 체크리스트

### Day 1-3
- [ ] Reddit 포스트 댓글 모니터링 + 응답
- [ ] 초기 리뷰 요청 (구매자에게 Gumroad 이메일)
- [ ] Google Analytics 또는 Gumroad 대시보드 확인

### Week 1
- [ ] 매일 1개 카테고리 무료 프롬프트를 Twitter에 공개
- [ ] 런칭 특가 종료 → $19.99로 가격 변경
- [ ] 판매 데이터 기록 → `data/performance/` 업데이트

### Week 2+
- [ ] 리뷰 기반 개선 (v1.1 업데이트)
- [ ] 번들 가능성 탐색 (이 팩 + 다른 팩)
- [ ] `/idea-analyze` 주간 분석에 포함

---

## 체크리스트 요약

체크리스트:
  제품_파일: "✅ AI-Product-Photo-Prompt-Master-Pack.md (200개 프롬프트)"
  사용가이드: "✅ usage-guide.md"
  커버이미지: "✅ cover.html (PNG 변환 필요)"
  상품_설명: "✅ gumroad-listing.md"
  가격_설정: "✅ $9.99 (런칭) → $19.99 (정상)"
  마케팅_준비: "✅ Reddit/Twitter/PH 포스트 초안"

다음_액션: "사용자가 위 체크리스트 따라 Gumroad + Etsy 배포 실행"
