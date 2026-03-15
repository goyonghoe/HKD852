---
name: idea-analyze
description: "주간 성과 분석 및 학습 축적"
user-invocable: true
allowed-tools: Read, Write, WebSearch, Glob
recommended-model: sonnet
model-reason: "데이터 분석과 패턴 인식은 Sonnet 적합"
---

# /idea-analyze — 주간 성과 분석

매주 금요일 실행하여 런칭된 제품의 성과를 분석하고 학습을 축적합니다.

## 입력

- `pipeline/launches/` — 런칭된 프로젝트들
- `data/performance/` — 이전 주간 데이터
- `data/learnings/` — 누적 학습

## 실행 절차

### 1. 데이터 수집

각 런칭 제품에 대해:

- 판매 수 (사용자가 수동 입력 또는 API)
- 수익액
- 페이지뷰/다운로드 수
- 리뷰/평점
- 환불/불만

**사용자 입력 요청 형식:**

```
아래 런칭 제품의 이번 주 실적을 알려주세요:

1. [제품명] (플랫폼)
   - 판매: _건
   - 수익: $_
   - 다운로드/조회: _회
   - 리뷰: _개 (평균 _점)
```

### 2. 성과 분석

```yaml
주간_요약:
  기간: "YYYY-MM-DD ~ YYYY-MM-DD"
  총_수익: "$XX"
  총_판매: "N건"
  신규_런칭: "N개"
  활성_프로젝트: "N개"

제품별_성과:
  - 프로젝트: "proj-XXXXXXXX-XX"
    이름: "제품명"
    수익: "$XX"
    트렌드: "↑/↓/→"
    판단: "유지/개선/폐기"
```

### 3. 패턴 분석

- **잘 팔린 것의 공통점** (카테고리, 가격대, 플랫폼)
- **안 팔린 것의 공통점** (왜 실패했는가)
- **시장 변화** (새로운 기회, 사라진 기회)

### 4. 학습 기록

`data/learnings/week-{N}.yaml`:

```yaml
주차: N
기간: "YYYY-MM-DD ~ YYYY-MM-DD"

핵심_학습:
  - "Gumroad 프롬프트팩이 Etsy보다 전환율 2배 높음"
  - "Chrome 확장은 심사에 3일 걸려 타임박스 초과 리스크"
  - "$5~$15 가격대가 최적, $20 이상은 전환율 급감"

다음주_전략:
  집중_카테고리: "디지털 상품 (Gumroad)"
  피할_카테고리: "Chrome 확장 (심사 리스크)"
  실험: "번들 판매 (3개 팩 $29.99)"
  목표: "주간 수익 $XXX"

아이디어_스캔_힌트:
  - "Gumroad에서 잘 팔리는 프롬프트 카테고리 더 탐색"
  - "AI 이미지 생성 관련 템플릿 수요 확인"
  - "SaaS보다 단발 디지털 상품에 집중"
```

### 5. 누적 대시보드 업데이트

`data/performance/dashboard.yaml`:

```yaml
총_런칭_수: N
총_누적_수익: "$XXX"
평균_주간_수익: "$XX"
최고_매출_제품: "제품명 ($XX/월)"
카테고리별_수익:
  디지털상품: "$XX"
  크롬확장: "$XX"
  API: "$XX"
  SaaS: "$XX"
성공률: "XX%" (런칭 대비 수익 발생 비율)
```

## 출력

1. `data/performance/week-{N}.yaml` — 주간 성과
2. `data/learnings/week-{N}.yaml` — 학습
3. `data/performance/dashboard.yaml` — 누적 대시보드 (갱신)

## 다음 단계

→ 학습 결과가 다음 주 `/idea-scan`에 자동 반영됨
