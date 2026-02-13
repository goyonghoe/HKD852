---
name: idea-launch
description: "플랫폼별 배포 가이드 생성"
user-invocable: true
allowed-tools: Read, Write
recommended-model: haiku
model-reason: "배포 가이드 생성은 정형화된 작업, Haiku 충분"
argument-hint: "project-id (예: proj-20260208-chrome)"
---

# /idea-launch — 런칭 가이드

리뷰를 통과한 제품의 플랫폼별 배포 가이드를 생성합니다.
**사람이 최종 클릭**하여 배포를 완료합니다.

## 입력

- `pipeline/products/{project-id}/` — 제품 파일
- `pipeline/products/{project-id}/review.yaml` — Pass 판정
- `pipeline/plans/{project-id}/plan.yaml` — 플랫폼 정보

## 플랫폼별 가이드

### Gumroad

```markdown
## Gumroad 런칭 체크리스트

### 상품 설정
- [ ] 상품명: {이름}
- [ ] 가격: ${가격}
- [ ] 카테고리: {카테고리}

### 상품 설명 (아래 복사 붙여넣기)
---
{SEO 최적화된 상품 설명}
{기능 목록}
{포함 내용}
{FAQ}
---

### 파일 업로드
- [ ] 메인 파일: {파일명}
- [ ] 프리뷰 이미지: {이미지 경로}
- [ ] 커버 이미지: {이미지 경로}

### 태그
{태그1}, {태그2}, {태그3}, ...

### 런칭 후
- [ ] 소셜 미디어 공유 링크 생성
- [ ] Reddit/Twitter 론칭 포스트
```

### Chrome Web Store

```markdown
## Chrome Web Store 런칭 체크리스트

### 개발자 대시보드
- [ ] https://chrome.google.com/webstore/devconsole 접속
- [ ] "새 항목" 클릭

### 업로드
- [ ] extension.zip 업로드

### 스토어 등록 정보
- [ ] 확장 프로그램 이름: {이름}
- [ ] 간단한 설명 (132자 이내): {설명}
- [ ] 자세한 설명: {상세 설명}
- [ ] 카테고리: {카테고리}
- [ ] 언어: 한국어

### 스크린샷 (최소 1개, 1280×800 또는 640×400)
- [ ] {스크린샷 경로}

### 아이콘
- [ ] 128×128 아이콘: {경로}

### 개인정보 처리방침
- [ ] {URL 또는 "해당없음" 사유}

### 제출
- [ ] "검토를 위해 제출" 클릭
- [ ] 예상 심사 기간: 1~3일
```

### RapidAPI

```markdown
## RapidAPI 런칭 체크리스트

- [ ] https://rapidapi.com/provider 접속
- [ ] "Add New API" 클릭
- [ ] API 이름/설명 입력
- [ ] Base URL 설정
- [ ] 엔드포인트 등록
- [ ] 가격 티어 설정 (Free/Pro/Enterprise)
- [ ] 문서 작성
- [ ] "Publish" 클릭
```

### Etsy

```markdown
## Etsy 런칭 체크리스트

- [ ] https://www.etsy.com/sell 접속
- [ ] "List an item" 클릭
- [ ] 디지털 상품 선택
- [ ] 사진/파일 업로드
- [ ] 제목: {SEO 최적화 제목}
- [ ] 설명: {상세 설명}
- [ ] 태그 (최대 13개): {태그 목록}
- [ ] 가격: ${가격}
- [ ] "Publish" 클릭
```

## 마케팅 초기 액션

```markdown
### 런칭 당일 할 일
1. [ ] Product Hunt에 제출 (해당 시)
2. [ ] Reddit 관련 서브레딧에 포스트
   - r/SideProject
   - r/{카테고리별 서브레딧}
3. [ ] Twitter/X 런칭 트윗
4. [ ] 한국 커뮤니티 (디스콰이엇 등) 공유
```

## 출력

`pipeline/launches/{project-id}/launch-guide.md`

```yaml
런칭일: "YYYY-MM-DD"
프로젝트: "proj-YYYYMMDD-XX"
플랫폼: "Chrome Web Store"
상태: "ready_to_launch"

체크리스트:
  제품_파일: "✅"
  스토어_에셋: "✅"
  상품_설명: "✅"
  가격_설정: "✅"
  마케팅_준비: "✅"

다음_액션: "사용자가 체크리스트 따라 배포 실행"
```

## 다음 단계

→ 사용자가 배포 완료 후 → 상태를 "launched"로 업데이트
→ 주간 `/idea-analyze`에서 성과 추적 시작
