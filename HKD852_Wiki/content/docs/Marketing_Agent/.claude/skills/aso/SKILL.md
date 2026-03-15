---
name: aso
description: "앱스토어/마켓플레이스 키워드 분석 및 메타데이터 최적화"
user-invocable: true
argument-hint: "[제품명 또는 스토어 URL]"
allowed-tools: Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash
recommended-model: sonnet
model-reason: "키워드 분석 + 카피 작성 — Sonnet 최적"
---

# ASO (App Store Optimization) 스킬

> 앱스토어, Google Play, Gumroad 등 마켓플레이스에서 자연 유입을 극대화하는 메타데이터를 생성합니다.

## 실행 절차

### Step 1: 제품 정보 수집

`$ARGUMENTS`에서 제품 정보를 파악합니다.

- 제품명이 주어지면 → `Income_Factory/pipeline/products/` 에서 해당 제품 정보 탐색
- URL이 주어지면 → 해당 스토어 페이지 분석
- 없으면 → 사용자에게 질문

### Step 2: 키워드 리서치

```
WebSearch로 다음을 조사:
1. 제품 카테고리의 인기 검색어
2. 경쟁 제품의 메타데이터 (제목, 설명, 키워드)
3. 트렌딩 키워드 및 롱테일 키워드
```

분석 결과를 다음 표로 정리:

| 키워드 | 검색량 추정 | 경쟁도 | 관련성 | 추천 여부 |
| ------ | ----------- | ------ | ------ | --------- |

### Step 3: 메타데이터 최적화

플랫폼별 최적화된 메타데이터 생성:

#### 앱스토어 / Google Play

- **앱 이름** (30자 이내): 핵심 키워드 포함
- **부제** (30자 이내): 보조 키워드 + 가치 제안
- **설명**: 첫 3줄에 핵심 키워드 집중, 자연스러운 키워드 배치
- **키워드 필드** (100자): 쉼표 구분, 중복 제거

#### Gumroad / 웹 마켓

- **제품 제목**: SEO 친화적, 키워드 포함
- **짧은 설명**: 1~2문장 가치 제안
- **상세 설명**: 기능 목록, 사용 사례, 대상 고객
- **태그**: 5~10개 관련 태그

### Step 4: 스크린샷/이미지 텍스트

스크린샷이나 프로모션 이미지에 들어갈 문구 생성:

- 헤드라인 (5자 이내): 핵심 가치
- 서브 텍스트 (15자 이내): 부연 설명
- CTA (행동 유도): 설치/구매 유도 문구

### Step 5: 산출물 저장

산출물 경로: `Marketing_Agent/outputs/aso_report_YYYY-MM-DD.md`

## 인자 처리

- `$ARGUMENTS`가 비어있으면: Income_Factory 최신 제품 자동 탐색
- 제품명 지정 시: 해당 제품 중심 최적화
  - 예: `/aso 프롬프트팩 AI Writing Templates`
- URL 지정 시: 해당 페이지 분석 후 개선안 제시
  - 예: `/aso https://gumroad.com/...`
