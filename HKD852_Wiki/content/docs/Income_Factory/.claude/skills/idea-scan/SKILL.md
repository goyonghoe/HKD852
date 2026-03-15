---
name: idea-scan
description: "트렌드 스캔 + 수익 아이디어 10개 생성"
user-invocable: true
allowed-tools: Read, Write, WebSearch, Glob
recommended-model: haiku
model-reason: "트렌드 수집은 빠른 Haiku로 충분"
---

# /idea-scan — 트렌드 스캐너

매일 웹 트렌드를 스캔하고 수익 아이디어 10개를 생성합니다.

## 실행 절차

### 1. 기존 데이터 확인

- `pipeline/ideas/` — 이전 아이디어와 중복 방지
- `pipeline/launches/` — 이미 런칭한 제품과 중복 방지
- `data/learnings/` — 최근 학습 (잘 팔린 카테고리, 피해야 할 영역)

### 2. 트렌드 스캔

다음 소스에서 트렌드를 수집합니다:

| 소스             | 검색 키워드                         |
| ---------------- | ----------------------------------- |
| Product Hunt     | "trending products today"           |
| Gumroad          | "gumroad trending digital products" |
| Chrome Web Store | "new chrome extensions trending"    |
| RapidAPI         | "trending APIs rapidapi"            |
| Reddit           | "r/SideProject top week"            |
| Indie Hackers    | "what shipped this week"            |

### 3. 아이디어 생성

수집된 트렌드를 바탕으로 **정확히 10개** 아이디어를 생성합니다.

**카테고리 배분 가이드 (유연하게 적용):**

- 디지털 상품 (프롬프트팩, 템플릿): 3~4개
- Chrome 확장 / 웹도구: 2~3개
- API / 개발 도구: 1~2개
- Micro-SaaS: 1~2개
- 콘텐츠 (YouTube, Newsletter): 1~2개

**각 아이디어에 포함할 정보:**

- id (idea-YYYYMMDD-NN 형식)
- 이름
- 카테고리
- 타겟 플랫폼
- 한줄 설명
- 왜 지금인가 (트렌드 근거)
- 예상 수익 (월)
- 예상 제작 기간
- 자동화 수준 (완전/부분)

### 4. 출력

`pipeline/ideas/YYYY-MM-DD.yaml` 에 저장:

```yaml
생성일: "YYYY-MM-DD"
트렌드_소스:
  - "Product Hunt: [관찰된 트렌드]"
  - "Gumroad: [관찰된 트렌드]"
학습_반영:
  - "[이전 학습에서 반영한 사항]"
아이디어:
  - id: "idea-YYYYMMDD-01"
    이름: "제품명"
    카테고리: "chrome-extension"
    플랫폼: "Chrome Web Store"
    한줄설명: "한 문장 설명"
    트렌드근거: "왜 지금 이것인가"
    예상수익: "$X~$Y/월"
    제작기간: "N일"
    자동화수준: "완전"
  - id: "idea-YYYYMMDD-02"
    ...
```

## 다음 단계

→ `/idea-eval` (평가)
