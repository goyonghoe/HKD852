---
name: idea-build
description: "실행 계획에 따라 실제 제품 제작"
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
recommended-model: sonnet
model-reason: "코드/콘텐츠 생성은 Sonnet의 균형잡힌 성능 활용"
argument-hint: "project-id (예: proj-20260208-chrome)"
---

# /idea-build — 제품 빌더

실행 계획을 읽고 실제 제품을 제작합니다.

## 입력

- `pipeline/plans/{project-id}/plan.yaml` — 실행 계획
- 인자: project-id

## 카테고리별 빌드 절차

### A. 디지털 상품 (Gumroad/Etsy)

**프롬프트팩:**
1. 카테고리별 프롬프트 50~100개 작성
2. 각 프롬프트에 예시 출력 첨부
3. PDF 또는 Markdown으로 패키징
4. 표지 디자인 (HTML→PNG 또는 SVG)
5. Gumroad 상품 설명 작성

**템플릿:**
1. Notion/Canva 템플릿 구조 설계
2. HTML/CSS로 프리뷰 생성
3. 사용 가이드 작성
4. 변형 3~5개 제작 (색상, 레이아웃)

### B. Chrome 확장

1. `manifest.json` (V3) 생성
2. `popup.html` + `popup.js` — UI
3. `content.js` — 페이지 연동 (필요 시)
4. `background.js` — 서비스 워커 (필요 시)
5. 아이콘 (16, 48, 128px) — SVG→PNG
6. 테스트 (chrome://extensions 로드)
7. `extension.zip` 패키징

### C. API 래퍼 (RapidAPI)

1. 서버 코드 (Node.js/Express 또는 Python/Flask)
2. 엔드포인트 정의
3. OpenAPI 스펙 작성
4. RapidAPI 등록 파일 생성
5. 가격 티어 설정 (Free: 100 req/day, Pro: 10,000 req/day)

### D. Micro-SaaS

1. 프론트엔드 (HTML/CSS/JS 또는 Next.js)
2. 백엔드 API
3. Stripe 결제 연동 코드
4. 랜딩 페이지
5. Vercel/Railway 배포 설정

### E. 콘텐츠

1. 스크립트 작성
2. 섬네일 디자인 (SVG)
3. 메타데이터 (제목, 설명, 태그)

## 빌드 원칙

1. **MVP만** — 핵심 기능 1개, 나머지 제거
2. **외부 의존성 최소** — 라이브러리 0~1개
3. **즉시 작동** — 설치/설정 없이 바로 사용
4. **코드 품질** — 에러 핸들링, 엣지 케이스 처리
5. **자체 완결** — 외부 API 키 불필요 (가능한 경우)

## 출력

`pipeline/products/{project-id}/` 에 모든 제품 파일 저장:

```
pipeline/products/proj-20260208-chrome/
├── manifest.json
├── popup.html
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── extension.zip        ← 배포용 패키지
└── build-log.md         ← 빌드 과정 기록
```

`build-log.md` 포함 내용:
```yaml
빌드일: "YYYY-MM-DD"
프로젝트: "proj-YYYYMMDD-XX"
상태: "complete"
파일목록:
  - "manifest.json — 확장 설정"
  - "popup.html — 메인 UI"
  ...
알려진이슈:
  - "없음" 또는 이슈 목록
다음단계: "/idea-review"
```

## 다음 단계

→ `/idea-review` (품질 검증)
