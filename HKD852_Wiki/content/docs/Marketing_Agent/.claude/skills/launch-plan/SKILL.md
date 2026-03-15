---
name: launch-plan
description: "제품 런칭 D-7~D+30 마케팅 타임라인 및 채널별 전략 수립"
user-invocable: true
argument-hint: "[제품명 또는 런칭일]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash
recommended-model: sonnet
model-reason: "전략 수립 + 타임라인 설계 — Sonnet 최적"
---

# 런칭 마케팅 플랜 스킬

> 제품 런칭 전후의 마케팅 전략과 실행 타임라인을 수립합니다.

## 실행 절차

### Step 1: 런칭 정보 수집

`$ARGUMENTS`에서 런칭 정보를 파악합니다.

- 제품명 → `Income_Factory/pipeline/products/` 및 `Income_Factory/pipeline/launches/` 탐색
- 런칭일 → 타임라인 기준점 설정
- 없으면 → 가장 최근 `/idea-launch` 결과 참조

다음 정보를 정리:

- 제품 유형 (프롬프트팩, 템플릿, 확장, SaaS 등)
- 타겟 플랫폼 (Gumroad, Etsy, Chrome Web Store 등)
- 가격 전략
- 기존 오디언스 유무
- 예산 (0원 가정)

### Step 2: D-7 사전 준비

| 일자 | 채널         | 액션                                 |
| ---- | ------------ | ------------------------------------ |
| D-7  | 전체         | 런칭 페이지 세팅, 프리뷰 이미지 제작 |
| D-5  | X            | 제작 과정 쓰레드 (빌딩 인 퍼블릭)    |
| D-3  | Reddit       | 관련 서브레딧에 가치 제공 게시물     |
| D-2  | Product Hunt | 업로드 준비 (해당 시)                |
| D-1  | X, Instagram | 티저 게시물, 카운트다운              |

### Step 3: D-Day 런칭

| 시간      | 채널         | 액션                    |
| --------- | ------------ | ----------------------- |
| 오전 9시  | Product Hunt | 런칭 (해당 시)          |
| 오전 10시 | X            | 런칭 트윗 + 쓰레드      |
| 오전 11시 | Reddit       | 런칭 게시물 (가치 중심) |
| 오후 1시  | Instagram    | 피드 게시물 + 스토리    |
| 오후 3시  | 이메일       | 뉴스레터 발송 (있을 시) |
| 오후 6시  | X            | 리마인더 트윗           |

### Step 4: D+1~D+7 초기 성장

| 일자 | 액션                          |
| ---- | ----------------------------- |
| D+1  | 초기 피드백 수집, 감사 메시지 |
| D+2  | 사용 사례/팁 콘텐츠           |
| D+3  | 얼리버드 할인 종료 알림       |
| D+5  | 첫 사용자 후기 공유           |
| D+7  | 1주차 성과 공유 (투명성)      |

### Step 5: D+8~D+30 지속 성장

| 주차  | 전략                                          |
| ----- | --------------------------------------------- |
| 2주차 | SEO 콘텐츠 (블로그, YouTube), 크로스 프로모션 |
| 3주차 | 업데이트/개선, 커뮤니티 활동                  |
| 4주차 | 번들/확장 제품, 다음 런칭 예고                |

### Step 6: KPI 및 추적

| 지표          | 목표            | 측정 도구            |
| ------------- | --------------- | -------------------- |
| 페이지 조회수 | D+7: 500+       | Gumroad Analytics    |
| 전환율        | 3~5%            | 스토어 대시보드      |
| 소셜 도달     | 10,000 임프레션 | X/Instagram 인사이트 |
| 매출          | 첫 주 $50+      | 결제 플랫폼          |

### Step 7: 산출물 저장

산출물 경로: `Marketing_Agent/outputs/launch_plan_YYYY-MM-DD.md`

## 인자 처리

- `$ARGUMENTS`가 비어있으면: Income_Factory 최신 런칭 제품 자동 탐색
- 제품명 지정 시: 해당 제품 맞춤 런칭 플랜
  - 예: `/launch-plan AI 프롬프트팩`
- 런칭일 지정 시: 해당 날짜 기준 타임라인
  - 예: `/launch-plan 프롬프트팩 --date 2026-02-20`

## Income_Factory 연계

`/idea-launch` 스킬의 배포 가이드가 완성된 후 이 스킬을 실행하면 최대 효과:

```
/idea-launch → 배포 가이드 (어디에, 어떻게 올릴지)
    ▼
/launch-plan → 마케팅 타임라인 (언제, 무엇을 홍보할지)
/aso → 스토어 메타데이터 최적화
/social-copy → 플랫폼별 홍보 카피
```
